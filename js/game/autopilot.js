// Autopilot (自動運転, J / AUTO button): drives the player's own car with the real physics (throttle, brake, steering —
// no rails). From a parking stall it follows the PA circulation lanes to the exit, then cruises the whole expressway
// network: keeps to the overtaking lane (the lane the AI traffic leaves free for the player) on multi-lane roads,
// follows the car ahead with an IDM gap (and any car / walker in its path), slows for curves, changes lanes only into
// a clear gap, signals, and at every junction prefers the roads it hasn't driven yet so it tours the whole map.
// Any steering / pedal input from the player hands control straight back.
import * as THREE from 'three';
import { t, getLang } from '../i18n.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const angle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const _p = new THREE.Vector3(), _q = new THREE.Vector3();
const AVOID = /^(pa_in|k5_pa)$/; // back into the PA — the tour stays on the open road

export class Autopilot {
  constructor(game) { this.g = game; this.on = false; this.visits = new Map(); }
  get net() { return this.g.net; }

  toggle(force) {
    const g = this.g, on = force ?? !this.on;
    if (on === this.on) return;
    if (on && g.mode !== 'drive') return;
    this.on = on;
    const v = g.vehicle;
    if (on) {
      this.prevMode = v.mode; if (!v.ev) v.mode = 'auto';
      if (!v.engine.running && !v.engine.cranking) v.startEngine();
      v.handbrakeOn = false; v.setSel('D');
      this.road = null; this.path = null; this.join = null; this.stuck = 0; this.rev = 0; this.revN = 0; this.laneT = 0; this.plan = null;
      if (!this.attach()) { // still in the lot: drive out through the PA
        const ex = g.traffic.lotExit();
        if (Math.hypot(ex.x - v.pos.x, ex.z - v.pos.z) > 450 && this.joinNearest()) { g.ui.setAuto?.(true); return; } // v2.4: any other lot (Umihotaru, Daikoku-futō …): drive to the nearest road
        if (Math.hypot(ex.x - v.pos.x, ex.z - v.pos.z) > 450) { this.on = false; if (this.prevMode && !v.ev) v.mode = this.prevMode; g.ui.toast(t('game.auto.noroad'), 'warn', 4); g.ui.setAuto?.(false); return; }
        this.path = g.traffic.lotPath(v.pos.clone(), ex);
        this.path.shift();
      }
    } else {
      if (this.prevMode && !v.ev) v.mode = this.prevMode;
      const L = g.model?.lights; if (L) { L.left = L.right = false; }
    }
    g.ui.setAuto?.(on);
  }

  // v2.4: from a car park away from Daikoku PA — the closest non-local road at our level within 500 m, joined in the
  // lane that runs the way we approach it, through two waypoints (a lead-in 20 m before the join, then the join)
  joinNearest() {
    const v = this.g.vehicle; let best = null;
    for (const pass of [0, 1]) { // expressways / arterials first, then any street (Daikoku-futō has only local streets)
      for (const r of this.net.roads) {
        if ((pass === 0 && r.kind === 'local') || !r.samples?.length || r.length < 60) continue;
        for (let i = 0; i < r.samples.length; i += 2) { const S = r.samples[i], d = Math.hypot(S.p.x - v.pos.x, S.p.z - v.pos.z);
          if (d < 500 && Math.abs(S.p.y - v.pos.y) < 4 && (!best || d < best.d)) best = { d, r, S }; }
      }
      if (best) break;
    }
    if (!best) return false;
    const { r, S } = best, ins = Math.min(r.length - 1, S.s + 30);
    let lane = r.lanes[0]; for (const ln of r.lanes) if (ln.dir === 1) { lane = ln; break; }
    const sJoin = lane.dir === 1 ? ins : Math.max(1, S.s - 30), sLead = lane.dir === 1 ? Math.max(0, sJoin - 22) : Math.min(r.length - 1, sJoin + 22);
    const a = r.at(sLead, lane.lat), b = r.at(sJoin, lane.lat);
    this.path = [a.clone(), b.clone()]; this.join = { road: r, lane, s: sJoin };
    return true;
  }

  // snap onto the expressway lane under the car (same level, travelling our way)
  attach() {
    const v = this.g.vehicle; const f = v.forward;
    const hs = this.net.hits(v.pos.x, v.pos.z).filter(h => h.inside && Math.abs(h.y - v.pos.y) < 2.5 && h.road.kind !== 'local');
    let best = null;
    for (const h of hs) for (const ln of h.road.lanes) {
      const t = h.road.dirAt(h.s), dot = (t.x * f.x + t.z * f.z) * ln.dir; if (dot < 0.5) continue;
      const d = Math.abs(ln.lat - h.lat); if (!best || d < best.d) best = { d, h, ln };
    }
    if (!best || best.d > 6) return false;
    this.setRoad(best.h.road, best.ln, best.h.s);
    return true;
  }
  setRoad(road, lane, s) {
    this.road = road; this.dir = lane.dir; this.lane = lane; this.s = s; this.plan = null;
    this.visits.set(road.id, (this.visits.get(road.id) || 0) + 1);
  }

  // overtaking lane for this direction (rightmost in Japan); single-lane roads → their only lane
  fastLane(road, dir) { const ls = road.lanes.filter(l => l.dir === dir); return ls.reduce((a, b) => (b.lat * dir < a.lat * dir ? b : a)); }

  // obstacles in front: AI cars (any mode) and walkers/NPCs inside a corridor along our heading
  leader(range, half, toward = null) {
    const g = this.g, v = g.vehicle; let f = v.forward, l = v.left;
    // v2.13.1: in the car park look along the line to the next waypoint, not along the bonnet — backing out of a bay
    // the nose points at the opposite row of parked cars, which are not in the way
    if (toward) { const dx = toward.x - v.pos.x, dz = toward.z - v.pos.z, L = Math.hypot(dx, dz) || 1; f = { x: dx / L, z: dz / L }; l = { x: dz / L, z: -dx / L }; }
    let gap = 1e9, vl = 0; this.blk = null;
    const test = (p, sp, len = 2.3, kind = 'car') => {
      const dx = p.x - v.pos.x, dz = p.z - v.pos.z, dy = Math.abs(p.y - v.pos.y); if (dy > 3) return;
      const ah = dx * f.x + dz * f.z, la = dx * l.x + dz * l.z;
      if (ah <= 0 || ah > range) return;
      // look along the curve: widen nothing, but bend the corridor with the current steering (yaw rate)
      const bend = this.path ? 0 : (v.yawRate || 0) / Math.max(4, v.vx) * ah * ah / 2; // v2.13.1: not in the car park (tight turns swung the corridor onto parked cars 2–5 m to the side)
      if (Math.abs(la - bend) > half) return;
      const d = ah - len - 2.3; if (d < gap) { gap = d; vl = sp; this.blk = kind; this.blkP = p; this.blkLa = la; }
    };
    for (const ai of g.traffic?.cars || []) {
      const sp = ai.mode === 'parked' ? 0 : (ai.v || 0) * Math.max(0, Math.cos(ai.yaw - v.yaw));
      test(ai.pos, sp, ai.halfL || 2.3, ai.mode);
    }
    for (const n of g.npc?.people || []) { const p = n.h?.object?.position || n.pos; if (p) test(p, 0, 0.5, 'npc'); }
    for (const w of g.walkers?.list || []) { const p = w.h?.object?.position; if (p) test(p, 0, 0.5); }
    return { gap, vl };
  }

  // nothing within ~5 m behind us (reversing out of a stall)
  behindClear() {
    const v = this.g.vehicle, f = v.forward, l = v.left;
    const hit = p => { const dx = p.x - v.pos.x, dz = p.z - v.pos.z; const ah = -(dx * f.x + dz * f.z), la = dx * l.x + dz * l.z; return ah > 0 && ah < 7.5 && Math.abs(la) < 1.7 && Math.abs(p.y - v.pos.y) < 3; };
    for (const ai of this.g.traffic?.cars || []) if (hit(ai.pos)) return false;
    for (const n of this.g.npc?.people || []) { const p = n.h?.object?.position; if (p && hit(p)) return false; }
    return true;
  }
  // is `lane` free from `behind` m back to `ahead` m forward (AI cars on this road)
  laneFree(lane, ahead, behind) {
    for (const ai of this.g.traffic?.cars || []) {
      if (ai.mode !== 'road' || ai.road !== this.road) continue;
      if (Math.abs(ai.lat - lane.lat) > 2.4) continue;
      const d = (ai.s - this.s) * this.dir; if (d < ahead && d > -behind) return false;
    }
    return true;
  }

  update(dt) {
    const g = this.g, v = g.vehicle, A = g.input.axes;
    if (!this.on) return null;
    if (g.mode !== 'drive') { this.toggle(false); return null; }
    // the player takes over
    if (Math.abs(A.steer) > 0.25 || A.throttle > 0.3 || A.brake > 0.3) { this.why = 'input'; this.toggle(false); g.ui.toast(t('game.auto.off'), 'info', 2); return null; }
    v.handbrakeOn = false;
    // backing out of a stall (nose-in parking, or boxed in by a car / people in front): reverse a few metres with
    // the wheel turned so the nose swings towards the way out, then carry on forwards
    if (this.rev > 0) {
      this.rev -= dt;
      if (v.engine.running && v.atSel !== 'R' && Math.abs(v.vx) < 0.5) v.setSel('R');
      const behind = this.behindClear(); if (!behind) this.rev = 0;
      return { throttle: v.atSel === 'R' && v.vx > -1.8 && behind ? (v.vx > -0.4 ? 0.65 : 0.3) : 0, brake: v.vx < -2.2 || !behind ? 0.5 : 0, steer: this.revSteer };
    }
    if (v.engine.running && v.atSel !== 'D' && !v.ev) { if (Math.abs(v.vx) < 0.5) v.setSel('D'); else return { throttle: 0, brake: 0.6, steer: 0 }; }
    const speed = Math.max(0, v.vx);
    let target, vDes, half = 1.6;
    if (this.path) {
      // ── PA lot: waypoints at walking pace
      let p = this.path[0];
      while (p && Math.hypot(p.x - v.pos.x, p.z - v.pos.z) < (p.r || 4)) { this.path.shift(); p = this.path[0]; }
      if (!p && this.join) { const J = this.join; this.join = null; this.path = null; this.setRoad(J.road, J.lane, J.s); return this.update(dt); }
      if (!p) { this.path = null; const r = this.net.byId.pa_out; if (r) this.setRoad(r, r.lanes[0], 0); else { this.toggle(false); return null; } return this.update(dt); }
      target = p; vDes = this.path.length === 1 ? 7 : 5.5; half = 1.2; // v2.7: 1.5 → 1.2 m — cars in their bays poke into a wider corridor
      const nxt = this.path[1]; if (nxt) { const a1 = Math.atan2(p.x - v.pos.x, p.z - v.pos.z), a2 = Math.atan2(nxt.x - p.x, nxt.z - p.z); if (Math.abs(angle(a2 - a1)) > 0.8 && Math.hypot(p.x - v.pos.x, p.z - v.pos.z) < 14) vDes = 3.5; }
    } else {
      if (!this.road && !this.attach()) { this.toggle(false); return null; }
      this.follow(dt);
      if (!this.road) { this.why = 'end:' + this.lastId; this.toggle(false); g.ui.toast(t('game.auto.off'), 'info', 2); return null; }
      const r = this.road, dir = this.dir;
      // lane: the overtaking lane, or the side of the junction we are about to take
      this.laneT -= dt;
      let want = this.plan ? this.plan.lane : this.fastLane(r, dir);
      { const rw = g.roadworks; if (rw && rw.closed(r, dir, this.s, want, 500)) { const alt = r.lanes.filter(l => l.dir === dir && !rw.closed(r, dir, this.s, l, 500)).sort((a, b) => Math.abs(a.lat - want.lat) - Math.abs(b.lat - want.lat))[0]; if (alt) want = alt; } } // v2.10: road works
      if (want !== this.lane && this.laneT <= 0) {
        const ls = r.lanes.filter(l => l.dir === dir).sort((a, b) => (a.lat - b.lat) * Math.sign(want.lat - this.lane.lat));
        const step = ls.find(l => (l.lat - this.lane.lat) * Math.sign(want.lat - this.lane.lat) > 0.5);
        if (step && this.laneFree(step, 35, 22)) { this.signal = Math.sign((step.lat - this.lane.lat) * dir); this.lane = step; this.laneT = 2.5; this.sigT = 3; }
      }
      // target point on the lane centre, lookahead grows with speed
      const look = clamp(6 + speed * 0.75, 8, 70);
      target = r.at(this.s + look * dir, this.lane.lat, _p);
      if ((dir > 0 && this.s + look > r.length) || (dir < 0 && this.s - look < 0)) { const nx = this.nextAtEnd(); if (nx) target = nx.road.at(clamp(nx.s + (dir > 0 ? this.s + look - r.length : look - this.s) * nx.lane.dir, 0, nx.road.length), nx.lane.lat, _p); }
      // speed: limit + 15 %, slowed for the curvature ahead (3.2 m/s² lateral)
      vDes = r.kind === 'local' ? (r.speed / 3.6) * 1.15 : 120; // v2.2: open road → as fast as the car will go (still slowed for bends and traffic)
      const t0 = r.dirAt(this.s); const h0 = Math.atan2(t0.x, t0.z);
      for (let d = 15; d <= Math.max(60, speed * speed / 4); d += 15) {
        const s2 = this.s + d * dir; if (s2 < 0 || s2 > r.length) break;
        const t1 = r.dirAt(s2), k = Math.abs(angle(Math.atan2(t1.x, t1.z) - h0)) / d;
        const vc = Math.sqrt(5 / Math.max(k, 1e-4)); vDes = Math.min(vDes, Math.sqrt(vc * vc + 2 * 4.5 * Math.max(0, d - 15)));
      }
      if (this.sigT > 0) this.sigT -= dt; else this.signal = 0;
    }
    // follow the leader (IDM), anything in our corridor
    // v2.7.1: in the lot only what lies before the next turn matters (the car parked across the aisle we turn into is not a leader)
    const range = this.path ? Math.min(clamp(20 + speed * 2.5, 18, 140), Math.hypot(target.x - v.pos.x, target.z - v.pos.z) + 1.5) : clamp(20 + speed * 2.5, 18, 140);
    const { gap, vl } = this.leader(range, half, this.path ? target : null);
    const a = 2.0, b = 3.0, s0 = this.path ? 2.5 : 5, T = 1.4;
    const sStar = s0 + Math.max(0, speed * T + speed * (speed - vl) / (2 * Math.sqrt(a * b)));
    let acc = a * (1 - Math.pow(speed / Math.max(1, vDes), 4)) - (gap < 1e8 ? a * Math.pow(sStar / Math.max(0.3, gap), 2) : 0);
    acc = clamp(acc, -9, a);
    // pure pursuit → curvature → steer angle (bicycle model with understeer), as a share of the current lock
    const dx = target.x - v.pos.x, dz = target.z - v.pos.z, f = v.forward, l = v.left;
    const ah = dx * f.x + dz * f.z, la = dx * l.x + dz * l.z, Ld = Math.max(3, Math.hypot(ah, la));
    const kappa = 2 * la / (Ld * Ld);
    const delta = Math.atan(kappa * (v.wb + (v.Kus || 0) * speed * speed));
    const steer = clamp(delta / Math.max(0.02, v.steerLim || 0.5), -1, 1);
    // stuck (blocked for long, e.g. a car parked across the lane): nudge on so the tour never freezes forever
    this.stuck = speed < 0.5 && acc < 0 ? this.stuck + dt : 0;
    this.wedged = speed < 0.6 && acc > 0.2 ? (this.wedged || 0) + dt : 0; // pushing but not moving: against a kerb / wall
    if (this.wedged > 2.5 && (this.revN || 0) < 6) { this.rev = 2.2; this.revN = (this.revN || 0) + 1; this.wedged = 0; this.revSteer = la > 0 ? -0.8 : 0.8; }
    // v2.7: a parked car (or a van sticking out of its bay) on the lot route: steer around it on the free side instead
    // of backing up forever — a detour waypoint beside it, then back on the route
    if (this.path && (this.blk === 'parked' || (this.blk === 'npc' && this.stuck > 1.2)) && gap < 7 && speed < 1.5 && !(this.detourT > 0) && this.blkP && this.path.length < 9) {
      const side = (this.blkLa || 0) > 0 ? -1 : 1, P = this.blkP, off = this.blk === 'npc' ? 2.4 : 3.4;
      for (const k of [side, -side]) { const q = { x: P.x + l.x * k * off + f.x * 1.5, y: v.pos.y, z: P.z + l.z * k * 3.4 + f.z * 1.5 };
        if (!g.world.access || g.world.access(q.x, q.z, v.pos.y, false)) { this.path.unshift(q); this.detourT = 6; break; } }
    }
    if (this.detourT > 0) this.detourT -= dt;
    // v2.13.1: a packed car park can box the autopilot in — after three back-and-forths, continue from the exit lane
    if (this.path && (this.revN || 0) >= 3 && !(this.rev > 0)) { const r = this.net.byId.pa_out; if (r) { const ln = r.lanes[0], q = r.at(2, ln.lat, new THREE.Vector3()), d = r.dirAt(2);
      v.place(q.setY(q.y + 0.3), Math.atan2(d.x, d.z)); g.camSnap = true; this.path = null; this.join = null; this.revN = 0; this.setRoad(r, ln, 2); g.ui.toast(({ ko: '주차장이 붐벼서 출구 차선에서 이어갑니다', ja: '駐車場が混雑のため出口レーンから再開' })[getLang?.()] || 'Car park busy — continuing from the exit lane', 'info', 3); return null; } }
    if (this.stuck > 12) { this.revN = 0; this.stuck = 0; if (this.path) { const ex = this.path[this.path.length - 1]; this.path = g.traffic.lotPath(v.pos.clone(), ex) || this.path; } } // long stall: replan
    if (this.path && this.stuck > (this.blk === 'npc' ? 6 : 2.5) && (this.revN || 0) < 4) { this.rev = 3.2; this.revN = (this.revN || 0) + 1; this.stuck = 0; this.revSteer = la > 0 ? -0.8 : 0.8; }
    const L = g.model?.lights; if (L && !this.path) { L.left = this.signal === 1; L.right = this.signal === -1; }
    return { throttle: acc > 0.05 ? clamp(acc / a, 0, 1) * (speed < 2 ? 0.55 : 1) : 0, brake: acc < -0.3 ? clamp(-acc / 8, 0, 1) : (vDes < 0.5 && speed < 1 ? 0.4 : 0), steer };
  }

  // track our distance along the road; at its end continue on the linked road, at diverges pick the tour
  follow(dt) {
    const v = this.g.vehicle, r = this.road, dir = this.dir;
    // project the car onto the road near the last s
    let best = this.s, bd = 1e9;
    for (let d = -8; d <= 30; d += 1) { const s = clamp(this.s + d * dir, 0, r.length); r.at(s, this.lane.lat, _q); const e = (v.pos.x - _q.x) ** 2 + (v.pos.z - _q.z) ** 2; if (e < bd) { bd = e; best = s; } }
    const prev = this.s; this.s = best;
    // junction ahead: decide early (≥ 450 m) so there is time to move across to its side
    // v2.7: with a GPS destination set, the junction choice follows the route (exits included) instead of the tour
    const navOn = !!(this.g.nav?.target && this.g.nav.route?.length > 1);
    const dvs = (this.net.diverges?.get(r) || []).filter(d => d.dir === dir && d.to !== r && (navOn ? true : !AVOID.test(d.to.id) && !/^x_/.test(d.to.id)));
    if (!this.plan) for (const d of dvs) {
      const ahead = (d.s - this.s) * dir; if (ahead < 120 || ahead > 450) continue;
      if (this.decided?.has(d)) continue; (this.decided ||= new Set()).add(d);
      const nTo = this.visits.get(d.to.id) || 0, nHere = this.visits.get(r.id) || 0;
      const take = navOn ? this.onRoute(d.to) : nTo === 0 ? Math.random() < 0.85 : Math.random() < 0.2 / (1 + nTo - Math.min(nTo, nHere));
      if (!take) continue;
      const lat0 = this.latOf(r, d.s, d.to.at(0, 0, _q));
      this.plan = { d, lane: this.net.laneNear(r, dir, lat0) }; break;
    }
    if (this.plan) {
      const d = this.plan.d, past = (this.s - d.s) * dir;
      if (past >= 0) {
        const to = d.to, ln = to.lanes.find(l => l.dir === 1) || to.lanes[0];
        // our lateral position on the new road decides the lane we join
        const h = this.net.hits(v.pos.x, v.pos.z).find(h => h.road === to);
        this.setRoad(to, h ? this.net.laneNear(to, ln.dir, h.lat) : ln, h ? h.s : 0); return;
      }
      if (past < -500) this.plan = null;
    }
    if ((dir > 0 && this.s >= r.length - 1.5) || (dir < 0 && this.s <= 1.5)) {
      const nx = this.nextAtEnd();
      if (nx) this.setRoad(nx.road, nx.lane, nx.s); else if (!this.turnaround()) { this.lastId = r.id + '@' + dir; this.road = null; }
    }
  }
  // end of the modelled network (map edge): turn round onto the opposite carriageway, as if through the toll gate
  // and back on at the next ramp, and keep touring
  turnaround() {
    const g = this.g, v = g.vehicle, r = this.road, dir = this.dir, net = this.net;
    const E = r.at(dir > 0 ? r.length : 0, this.lane.lat, new THREE.Vector3()), te = r.dirAt(dir > 0 ? r.length : 0);
    const hx = te.x * dir, hz = te.z * dir;
    let best = null;
    for (const o of net.roads) {
      if (o.kind === 'local' || AVOID.test(o.id) || /^x_/.test(o.id)) continue;
      for (const q of o.samples) {
        const d = Math.hypot(q.p.x - E.x, q.p.z - E.z); if (d > 600 || Math.abs(q.p.y - E.y) > 20 || (best && d >= best.d)) continue;
        for (const ln of o.lanes) { const dot = (q.t.x * hx + q.t.z * hz) * ln.dir; if (dot > -0.7) continue; const room = ln.dir > 0 ? o.length - q.s : q.s; if (room < 300) continue; best = { d, o, ln, s: q.s }; break; }
      }
    }
    if (!best) return false;
    const { o, ln } = best; const lane = this.fastLane(o, ln.dir); const s = best.s;
    const p = o.at(s, lane.lat, new THREE.Vector3()); const tt = o.dirAt(s);
    const sp = Math.max(8, v.vx); const yaw = Math.atan2(tt.x * lane.dir, tt.z * lane.dir);
    p.y += 0.3; v.place(p, yaw); v.vx = sp; v.vel.set(Math.sin(yaw) * sp, 0, Math.cos(yaw) * sp);
    g.camSnap = true; g.ui.toast(t('game.auto.uturn'), 'info', 3);
    this.setRoad(o, lane, s); this.decided = null;
    return true;
  }
  // is road `to` (its first ~80 m) part of the current GPS route?
  onRoute(to) {
    const R = this.g.nav?.route; if (!R) return false;
    for (let s = 20; s <= Math.min(80, to.length); s += 20) { const q = to.at(s, 0, _q); let ok = false; for (let i = 0; i < R.length; i++) if ((R[i][0] - q.x) ** 2 + (R[i][1] - q.z) ** 2 < 15 * 15) { ok = true; break; } if (!ok) return false; }
    return true;
  }
  // lateral offset of point p from road r at s (left positive)
  latOf(r, s, p) { const a = r.at(s, 0, new THREE.Vector3()), b = r.at(s, 1, new THREE.Vector3()); return (p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z); }
  nextAtEnd() {
    const r = this.road, dir = this.dir, net = this.net;
    const L = dir === 1 ? net.links?.get(r) : null;
    if (L && L.to !== r) { const lane = net.laneNear(L.to, L.dir, L.lat); return { road: L.to, lane, s: L.s }; }
    const cont = (net.diverges?.get(r) || []).filter(d => d.dir === dir && (dir === 1 ? d.s >= r.length - 60 : d.s <= 60) && d.to !== r && !AVOID.test(d.to.id) && !/^x_/.test(d.to.id));
    if (!cont.length) { // v2.7.1: a road running on past this end (two-way Bayshore ends) — same table as the GPS
      const c = (this.g.nav?.cont?.(r, dir) || []).filter(c => !AVOID.test(c.to.id)).sort((a, b) => this.onRoute(b.to) - this.onRoute(a.to))[0];
      if (!c) return null; const lane = net.laneNear(c.to, c.dir, c.dir > 0 ? (c.to.lanes.find(l => l.dir === 1)?.lat ?? 0) : (c.to.lanes.find(l => l.dir === -1)?.lat ?? 0)); return { road: c.to, lane, s: c.s }; }
    cont.sort((a, b) => (this.visits.get(a.to.id) || 0) - (this.visits.get(b.to.id) || 0));
    if (this.g.nav?.route?.length > 1) cont.sort((a, b) => this.onRoute(b.to) - this.onRoute(a.to)); // GPS route first
    const to = cont[0].to; const lane = to.lanes.find(l => l.dir === 1) || to.lanes[0];
    const v = this.g.vehicle; const h = net.hits(v.pos.x, v.pos.z).find(h => h.road === to);
    return { road: to, lane, s: h ? Math.max(0, h.s) : 0 };
  }
}
