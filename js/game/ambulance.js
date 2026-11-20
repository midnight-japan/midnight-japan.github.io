// 救急車 (v2.16): after a crash with injured people someone calls 119 — a Japanese high-roof ambulance (white body,
// red stripe, red light bar, two-tone ピーポー siren) drives up behind the scene with its lights flashing, stops, two
// paramedics bring the stretcher to the wrecked car, load the injured driver and carry them back into the ambulance,
// which then pulls out round the wreck and drives off to hospital.
// Model: "Japanese Ambulance Van" + "Hospital Stretcher" (Sketchfab, CC BY — assets/CREDITS.md), baked with
// tools/prop-bake.mjs into assets/models/people/.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createPerson } from './people.js';
import { defaultOutfit } from './humans.js';
// stand-in while the medic model loads (procedural): pale blue-grey jacket and trousers, white helmet-ish cap
const MEDIC_OUTFIT = () => ({ ...defaultOutfit(), top: 'racing_jacket', topColor: '#a9bccb', accentColor: '#e8eef2', bottom: 'chinos', bottomColor: '#5d6f80', shoes: 'boots', shoeColor: '#15171a', hair: 'cap', hairColor: '#f2f2f2', accessory: 'none' });

const BASE = new URL('../../assets/models/people/', import.meta.url);
let MODELS = null;
function loadModels() {
  if (MODELS) return MODELS;
  const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
  MODELS = Promise.all(['ambulance', 'stretcher'].map(n => L.loadAsync(new URL(n + '.glb', BASE).href).then(g => { g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.geometry.userData.shared = true; } }); return g.scene; })))
    .then(([amb, str]) => ({ amb, str }));
  MODELS.catch(e => console.warn('ambulance', e.message));
  return MODELS;
}

// soft glow sprite for the flashing lamps
let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,80,70,0.8)'); gr.addColorStop(1, 'rgba(255,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); GLOW = new THREE.CanvasTexture(c); return GLOW;
}

// the Japanese ambulance siren: two tones (≈960 / 770 Hz) alternating every 0.65 s, panned in 3D
class PeePo {
  constructor(a) {
    this.a = a; const ctx = a.ctx; this.ok = !!(ctx && a.bus?.sfx); if (!this.ok) return;
    this.o = ctx.createOscillator(); this.o.type = 'square'; this.o2 = ctx.createOscillator(); this.o2.type = 'sine';
    this.f = ctx.createBiquadFilter(); this.f.type = 'lowpass'; this.f.frequency.value = 2600;
    this.g = ctx.createGain(); this.g.gain.value = 0;
    this.p = ctx.createPanner(); this.p.panningModel = 'equalpower'; this.p.distanceModel = 'inverse'; this.p.refDistance = 12; this.p.rolloffFactor = 1.1;
    const m1 = ctx.createGain(); m1.gain.value = 0.18; const m2 = ctx.createGain(); m2.gain.value = 0.5;
    this.o.connect(m1); this.o2.connect(m2); m1.connect(this.f); m2.connect(this.f); this.f.connect(this.g); this.g.connect(this.p); this.p.connect(a.bus.sfx);
    this.o.start(); this.o2.start(); this.t = 0; this.hi = true;
  }
  update(dt, pos, on, vRel = 0) {
    if (!this.ok) return; const ctx = this.a.ctx, now = ctx.currentTime;
    this.t += dt; if (this.t > 0.65) { this.t = 0; this.hi = !this.hi; }
    const dop = THREE.MathUtils.clamp(1 + vRel / 343, 0.9, 1.1), f = (this.hi ? 960 : 770) * dop;
    this.o.frequency.setTargetAtTime(f, now, 0.01); this.o2.frequency.setTargetAtTime(f, now, 0.01);
    this.g.gain.setTargetAtTime(on ? 0.5 : 0, now, 0.08);
    if (this.p.positionX) { this.p.positionX.setTargetAtTime(pos.x, now, 0.05); this.p.positionY.setTargetAtTime(pos.y + 1.5, now, 0.05); this.p.positionZ.setTargetAtTime(pos.z, now, 0.05); } else this.p.setPosition(pos.x, pos.y + 1.5, pos.z);
  }
  dispose() { if (!this.ok) return; try { this.g.gain.setTargetAtTime(0, this.a.ctx.currentTime, 0.05); setTimeout(() => { try { this.o.stop(); this.o2.stop(); this.p.disconnect(); } catch {} }, 400); } catch {} this.ok = false; }
}

const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const angD = d => Math.atan2(Math.sin(d), Math.cos(d));

// ───────────────────────────────────────────────── street graph walking ──
// (read-only use of the city street graph: chains of [x, z] points joined at shared vertex keys; same conventions as
// the traffic AI in js/game/traffic.js — heading (hx, hz), left-hand traffic lane offset (hz, −hx) · lat)
const segOf = (c, i) => { const a = c.pts[i], b = c.pts[i + 1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.01; return { a, b, L, tx: (b[0] - a[0]) / L, tz: (b[1] - a[1]) / L }; };
const laneLat = c => c.oneway ? (c.w > 7 ? c.w / 4 : 0) : Math.max(1.35, Math.min(c.w / 4, 3.4));
const smooth = u => u * u * (3 - 2 * u);
const lanePoint = (q, lat, y) => { const p = new THREE.Vector3(q.x + q.hz * lat, y, q.z - q.hx * lat); if (q.key !== undefined) p.key = q.key; return p; };
// the street to carry on along at the vertex ahead: straight on first, then the bigger street; no footpaths, no
// U-turns, one-way streets only the right way (back = walking against the direction of travel)
function nextStreet(net, cur, back) {
  const c = cur.c, vi = cur.dir > 0 ? cur.i + 1 : cur.i, k = c.keys?.[vi]; if (k === undefined) return null;
  const S0 = segOf(c, cur.i), hx = S0.tx * cur.dir, hz = S0.tz * cur.dir, opts = [];
  for (const [c2, i2] of net.nodes.get(k) || []) {
    if (c2.dead || c2.cls >= 5) continue;
    if (i2 < c2.pts.length - 1 && !(c2 === c && i2 === cur.i) && !(back && c2.oneway)) { const S = segOf(c2, i2); opts.push({ c: c2, i: i2, dir: 1, d: 0, dot: S.tx * hx + S.tz * hz }); }
    if (i2 > 0 && !(c2 === c && i2 - 1 === cur.i) && (back || !c2.oneway)) { const S = segOf(c2, i2 - 1); opts.push({ c: c2, i: i2 - 1, dir: -1, d: S.L, dot: -S.tx * hx - S.tz * hz }); }
  }
  let ok = opts.filter(o => o.dot > -0.3); if (!ok.length) ok = opts.filter(o => o.c.cls < 5); if (!ok.length) return null; // a sharp turn rather than none
  ok.sort((a, b) => (b.dot > 0.85) - (a.dot > 0.85) || a.c.cls - b.c.cls || b.dot - a.dot);
  return { ...ok[0], key: k };
}
// centreline points every `step` m for `dist` m from a cursor { c, i, dir, d } → [{ x, z, hx, hz, lat, w, key? }]
function walkStreet(net, cur0, dist, step, back) {
  const cur = { ...cur0 }, out = []; let left = dist, guard = 0;
  const push = key => { const S = segOf(cur.c, cur.i); out.push({ x: S.a[0] + S.tx * cur.d, z: S.a[1] + S.tz * cur.d, hx: S.tx * cur.dir, hz: S.tz * cur.dir, lat: laneLat(cur.c), w: cur.c.w || 7, key }); };
  push();
  while (left > 0 && guard++ < 3000) {
    const S = segOf(cur.c, cur.i), rem = cur.dir > 0 ? S.L - cur.d : cur.d;
    if (rem > step) { cur.d += step * cur.dir; left -= step; push(); continue; }
    cur.d = cur.dir > 0 ? S.L : 0; left -= rem;
    let n = nextStreet(net, cur, back);
    // dead end of a two-way street: turn round (as the traffic AI does) — only once per walk
    if (!n && !back && !cur.c.oneway && !out.uturn) { out.uturn = true; n = { c: cur.c, i: cur.i, dir: -cur.dir, d: cur.d }; }
    if (!n) { out.end = true; break; }
    cur.c = n.c; cur.i = n.i; cur.dir = n.dir; cur.d = n.d; push(n.key);
  }
  out.cur = cur; return out;
}

export class Ambulances {
  constructor(game) { this.g = game; this.list = []; }

  /**
   * Send an ambulance to an accident. inc: { ai (the wrecked car), patientId?, onDone?() }.
   * The route is built along the lane / street the wrecked car is on, starting ~170 m behind it.
   */
  dispatch(inc) {
    const g = this.g, ai = inc.ai;
    const route = this.routeTo(ai); if (!route) return null;
    const job = { inc, inCl: this.lastIn, route, ri: 1, stage: 'load', t: 0, pos: route[0].clone(), yaw: yawTo(route[0], route[1]), v: 13, crew: [], flash: 0 };
    this.list.push(job);
    loadModels().then(M => {
      if (!this.list.includes(job)) return;
      const root = new THREE.Group(); root.add(M.amb.clone()); job.root = root;
      // flashing red lamps: light-bar ends + rear upper corners (emissive boxes with additive glow sprites)
      job.lamps = [];
      const lampG = new THREE.BoxGeometry(0.34, 0.13, 0.2);
      for (const [x, y, z] of [[-0.55, 2.43, 1.15], [0.55, 2.43, 1.15], [-0.82, 2.3, -2.48], [0.82, 2.3, -2.48]]) {
        const m = new THREE.Mesh(lampG, new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1010, emissiveIntensity: 0, roughness: 0.4 })); m.position.set(x, y, z);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff2a20, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); s.scale.setScalar(1.6); s.position.set(x, y + 0.05, z + Math.sign(z) * 0.12);
        root.add(m, s); job.lamps.push({ m, s, side: x < 0 ? 0 : 1 });
      }
      job.stretcherSrc = M.str;
      g.scene.add(root);
      job.stage = 'drive';
      if (g.audio?.ctx) job.siren = new PeePo(g.audio);
    }).catch(() => { this.list.splice(this.list.indexOf(job), 1); });
    return job;
  }

  // the way in: ~170 m of the wrecked car's own street / lane, driven in its direction, ending ~10 m behind it.
  // City streets are walked backwards through the OpenStreetMap graph (js/game/city.js — the same chains the traffic
  // AI drives, read-only), so the ambulance comes round real corners on the left-hand lane and never through a block.
  routeTo(ai) {
    const W = this.g.world, net = W.city?.net, y = ai.pos.y;
    let pts = []; this.lastIn = null;
    if (ai.mode === 'road' && ai.road) {
      const r = ai.road, dir = ai.dir || 1, lat = ai.lane?.lat ?? ai.lat ?? 0;
      for (let k = 170; k >= 10; k -= 4) { const s = THREE.MathUtils.clamp(ai.s - dir * k, 1, r.length - 1); const p = r.at(s, lat); pts.push(new THREE.Vector3(p.x, p.y, p.z)); }
    } else if (ai.mode === 'city' && ai.c?.pts && net) {
      const back = walkStreet(net, { c: ai.c, i: ai.i, dir: -(ai.dir || 1), d: ai.d }, 175, 3, true);
      back.reverse();
      const cl = back.map(q => ({ ...q, hx: -q.hx, hz: -q.hz }));
      // drop the last 10 m (the ambulance stops short of the wreck); keep the centreline for the way out
      let acc = 0; for (let k = cl.length - 1; k > 0 && acc < 10; k--) { acc += Math.hypot(cl[k].x - cl[k - 1].x, cl[k].z - cl[k - 1].z); cl.length = k; }
      this.lastIn = cl;
      pts = cl.map(q => lanePoint(q, q.lat, y));
    } else {
      // parked / PA: come straight in from behind the car
      const f = new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw));
      for (let k = 120; k >= 9; k -= 10) pts.push(ai.pos.clone().addScaledVector(f, -k));
    }
    // drop points closer than 1 m to each other
    const out = [pts[0]]; for (const p of pts) if (p && p.distanceTo(out[out.length - 1]) > 1) out.push(p);
    return out.length >= 2 ? out : null;
  }

  // the way out: pull out to the right (into the oncoming / overtaking lane) round the wreck, back into the left lane
  // and on along the street graph / expressway; the route is extended as it is driven
  exitRoute(job) {
    const g = this.g, ai = job.inc.ai, net = g.world.city?.net, y = job.pos.y, pts = [job.pos.clone()];
    job.ext = null;
    if (ai.mode === 'city' && ai.c?.pts && net && !ai.c.dead) {
      const fwd = walkStreet(net, { c: ai.c, i: ai.i, dir: ai.dir || 1, d: ai.d }, 260, 3, false);
      const cl = [...(job.inCl || []).slice(-1), ...fwd];
      // distance of every point from the wreck along the route (−: behind it)
      let s0 = 0; const sAt = []; for (let k = 0; k < cl.length; k++) { if (k) s0 += Math.hypot(cl[k].x - cl[k - 1].x, cl[k].z - cl[k - 1].z); sAt.push(s0); }
      const sW = sAt[Math.min(job.inCl?.length ? 1 : 0, sAt.length - 1)];
      for (let k = 0; k < cl.length; k++) {
        const q = cl[k], ds = sAt[k] - sW, lane = q.lat, w = q.w || 7;
        const latO = Math.max(lane - 3.3, -(w / 2) + 1.2); // as far over as the street allows
        const u = ds < -14 ? 0 : ds < -6 ? (ds + 14) / 8 : ds < 9 ? 1 : ds < 17 ? 1 - (ds - 9) / 8 : 0;
        const p = lanePoint(q, lane + (latO - lane) * smooth(u), y); if (p.distanceTo(pts[pts.length - 1]) > 1) pts.push(p);
      }
      if (!fwd.end) job.ext = { kind: 'city', cur: fwd.cur };
    } else if (ai.mode === 'road' && ai.road) {
      const r = ai.road, dir = ai.dir || 1, lat = ai.lane?.lat ?? ai.lat ?? 0, latO = lat - 3.5 * dir;
      for (let k = -8; k <= 260; k += 4) { const s = ai.s + dir * k; if (s < 1 || s > r.length - 1) break;
        const u = k < -2 ? (k + 8) / 6 : k < 10 ? 1 : k < 22 ? 1 - (k - 10) / 12 : 0; const p = r.at(s, lat + (latO - lat) * smooth(Math.max(0, u))); pts.push(new THREE.Vector3(p.x, p.y, p.z)); }
      const sEnd = ai.s + dir * 260; job.ext = { kind: 'road', r, dir, lat, s: THREE.MathUtils.clamp(sEnd, 0, r.length) };
    } else {
      // PA lot: out along the lot's own aisles to the exit ramp (traffic.js lot planner, read-only), then down the ramp
      const tr = g.traffic; try { const ex = tr.lotExit(); for (const p of tr.lotPath(job.pos.clone(), ex)) pts.push(new THREE.Vector3(p.x, y, p.z)); } catch {}
      const r = g.net?.byId?.pa_out; if (r) { for (let s = 4; s < r.length; s += 6) { const p = r.at(s, r.lanes[0]?.lat ?? 0); pts.push(new THREE.Vector3(p.x, p.y, p.z)); } job.ext = { kind: 'road', r, dir: 1, lat: r.lanes[0]?.lat ?? 0, s: r.length }; }
      if (pts.length < 3) { const f = new THREE.Vector3(Math.sin(job.yaw), 0, Math.cos(job.yaw)); for (let k = 1; k <= 12; k++) pts.push(job.pos.clone().addScaledVector(f, k * 8)); }
    }
    return pts;
  }
  // more route ahead (city graph or expressway links) once the ambulance gets near the end of what it has
  extend(job) {
    const g = this.g, net = g.world.city?.net, r = job.route;
    let e = job.ext;
    // the street ran out (end of the loaded street graph / a dead end): pick up the nearest street segment ahead that
    // may be driven in our direction and carry on from there
    if (!e && net && (job.replan = (job.replan || 0) + 1) <= 4) {
      const x = job.pos.x, z = job.pos.z, hx = Math.sin(job.yaw), hz = Math.cos(job.yaw); let best = null;
      for (const c of net.chains.values()) { if (c.dead || c.cls >= 5 || c.bb[0] > x + 30 || c.bb[2] < x - 30 || c.bb[1] > z + 30 || c.bb[3] < z - 30) continue;
        for (let i = 0; i < c.pts.length - 1; i++) { const S = segOf(c, i), t = THREE.MathUtils.clamp((x - S.a[0]) * S.tx + (z - S.a[1]) * S.tz, 0, S.L), d = Math.hypot(S.a[0] + S.tx * t - x, S.a[1] + S.tz * t - z);
          for (const dir of c.oneway ? [1] : [1, -1]) { const dot = (S.tx * hx + S.tz * hz) * dir; if (dot < 0.2) continue; const sc = d - dot * 4; if (d < 25 && (!best || sc < best.sc)) best = { sc, cur: { c, i, dir, d: THREE.MathUtils.clamp(t + dir * 6, 0, S.L) } }; } } }
      if (best) e = { kind: 'city', cur: best.cur };
    }
    if (!e) return;
    if (e.kind === 'city' && net) {
      const fwd = walkStreet(net, e.cur, 200, 3, false); for (const q of fwd.slice(1)) r.push(lanePoint(q, q.lat, job.pos.y));
      job.ext = fwd.end ? null : { kind: 'city', cur: fwd.cur };
    } else if (e.kind === 'road') {
      let { r: road, dir, lat, s } = e;
      if (dir > 0 ? s >= road.length - 1 : s <= 1) { // end of this road: follow its link onto the next one
        const L = dir > 0 ? g.net?.links?.get(road) : null; if (!L || L.to === road) { job.ext = null; return; }
        const lane = g.net.laneNear(L.to, L.dir, L.lat); road = L.to; dir = L.dir; lat = lane?.lat ?? L.lat; s = L.s;
      }
      let k = 0; for (; k < 200; k += 4) { const ss = s + dir * k; if (ss < 1 || ss > road.length - 1) break; const p = road.at(ss, lat); r.push(new THREE.Vector3(p.x, p.y, p.z)); }
      job.ext = { kind: 'road', r: road, dir, lat, s: THREE.MathUtils.clamp(s + dir * k, 0, road.length) };
    }
  }

  update(dt) {
    for (const job of [...this.list]) this.step(job, dt);
  }

  step(job, dt) {
    const g = this.g; job.t += dt; job.flash += dt;
    if (job.stage === 'load') return;
    const ai = job.inc.ai;
    // lamps: alternating left / right at ~2.5 Hz, rear ones in sync
    const ph = Math.floor(job.flash * 5) % 2, on = job.stage !== 'gone';
    for (const L of job.lamps || []) { const lit = on && L.side === ph; L.m.material.emissiveIntensity = lit ? 3.2 : 0.15; L.s.material.opacity = lit ? 0.9 : 0; }
    const me = g.mode === 'walk' && g.player ? g.player.pos : g.vehicle?.pos;
    if (job.siren) { const d = me ? me.distanceTo(job.pos) : 999; job.siren.update(dt, job.pos, (job.stage === 'drive' || job.stage === 'leave') && d < 600, 0); }
    switch (job.stage) {
      case 'drive': {
        if (this.follow(job, dt, 14)) { job.stage = 'park'; job.t = 0; job.v = 0; }
        break;
      }
      case 'park': if (job.t > 1.2) { this.spawnCrew(job); job.stage = 'fetch'; job.t = 0; } break;
      case 'fetch': { // crew + stretcher to the driver door
        const door = this.doorOf(ai); const done = this.walkCrew(job, door, dt, 1.5);
        if (done || job.t > 25) { job.stage = 'treat'; job.t = 0; }
        break;
      }
      case 'treat': {
        for (const c of job.crew) { c.speed = 0; c.action = 'crouch'; c.yaw = yawTo(c.pos, ai.pos); }
        if (job.t > 5 && !job.patient) {
          // the injured driver is lifted onto the stretcher
          if (ai.seatD) ai.driverOut = true;
          const p = createPerson({ id: job.inc.patientId, mirror: false });
          p.object.scale.setScalar(1); job.patient = { h: p }; g.scene.add(p.object);
          g.audio?.speak?.('せーの！', 'ja-JP', { role: 'male', seed: 7 });
        }
        if (job.t > 7) { job.stage = 'carry'; job.t = 0; }
        break;
      }
      case 'carry': { // back to the rear doors
        const back = job.pos.clone().add(new THREE.Vector3(Math.sin(job.yaw), 0, Math.cos(job.yaw)).multiplyScalar(-3.4));
        const done = this.walkCrew(job, back, dt, 1.1);
        if (done || job.t > 30) { job.stage = 'board'; job.t = 0; }
        break;
      }
      case 'board':
        if (job.t > 1.5) {
          this.dropCrew(job); job.stage = 'leave'; job.t = 0; job.v = 0; job.route = this.exitRoute(job); job.ri = 1;
          job.inc.onDone?.();
          g.ui?.toast?.(L({ ja: '救急車が負傷者を搬送しました。', en: 'The ambulance is taking the injured driver to hospital.', ko: '구급차가 부상자를 병원으로 이송합니다.' }), 'info', 5);
        }
        break;
      case 'leave': {
        // gone once well away from the player (or out of road and out of sight)
        const far = me ? me.distanceTo(job.pos) : 999;
        if (far > 420 || (this.follow(job, dt, 16) && far > 90) || job.t > 150) { job.stage = 'gone'; this.remove(job); }
        break;
      }
    }
    // stretcher + patient travel between the two crew members
    if (job.str) {
      const [a, b] = job.crew; if (a && b) { job.str.position.lerpVectors(a.pos, b.pos, 0.5); job.str.rotation.y = yawTo(b.pos, a.pos) - Math.PI / 2; }
      if (job.patient) { const p = job.patient.h; p.object.position.copy(job.str.position); p.object.position.y += 0.82; p.object.rotation.y = job.str.rotation.y + Math.PI / 2; p.update(dt, { action: 'lying' }); }
    }
    for (const c of job.crew) { c.h.object.position.copy(c.pos); c.h.object.rotation.y = c.yaw; c.h.update(dt, { speed: c.speed, action: c.action }); }
    if (job.root) { job.root.position.copy(job.pos); job.root.rotation.y = job.yaw; }
  }

  // drive along job.route: pure pursuit with a speed plan (corners, the end of the route), keeping a safe gap to the
  // traffic ahead (same direction: IDM-like; oncoming in the lane we are using: wait), crawling through red lights,
  // and making the traffic yield to the siren (cars ahead move over / slow, cars behind hold back)
  follow(job, dt, vMax) {
    const g = this.g, r = job.route;
    // consume points we have reached (or passed)
    while (job.ri < r.length) { const q = r[job.ri], dx = q.x - job.pos.x, dz = q.z - job.pos.z, d = Math.hypot(dx, dz);
      const hx = Math.sin(job.yaw), hz = Math.cos(job.yaw); if (d < Math.max(1.5, job.v * 0.25) || (d < 6 && dx * hx + dz * hz < 0)) job.ri++; else break; }
    if (job.ri >= r.length - 25 && (job.ext || job.stage === 'leave')) this.extend(job);
    if (job.ri >= r.length) { job.v = Math.max(0, job.v - 6 * dt); return job.v < 0.3; }
    // look-ahead point, the sharpest bend in the next ~30 m and the distance left to the end of the route
    const la = Math.max(4, job.v * 0.75); let look = r[job.ri], bend = 0, acc = Math.hypot(r[job.ri].x - job.pos.x, r[job.ri].z - job.pos.z);
    for (let k = job.ri; k < r.length - 1; k++) {
      const sd = Math.hypot(r[k + 1].x - r[k].x, r[k + 1].z - r[k].z);
      if (acc < la) look = r[k + 1];
      if (acc < 30 && k > job.ri) { const a1 = Math.atan2(r[k].x - r[k - 1].x, r[k].z - r[k - 1].z), a2 = Math.atan2(r[k + 1].x - r[k].x, r[k + 1].z - r[k].z); bend = Math.max(bend, Math.abs(angD(a2 - a1)) / Math.max(1, sd)); }
      acc += sd; if (job.ext && acc > 45) break;
    }
    const left = job.ext ? 1e9 : acc;
    let want = Math.min(vMax, Math.sqrt(2 * 3.5 * Math.max(0, left - 0.5)) + 0.3, bend > 0.01 ? Math.max(4, Math.sqrt(2.6 / bend)) : vMax);
    // traffic around us
    const hx = Math.sin(job.yaw), hz = Math.cos(job.yaw), wreck = job.inc.ai, tr = g.traffic;
    let gap = 1e9, vLead = want, blocked = false;
    for (const o of tr?.cars || []) {
      if (o === wreck && job.stage === 'leave') continue;
      const ex = o.pos.x - job.pos.x, ez = o.pos.z - job.pos.z; if (ex * ex + ez * ez > 60 * 60 || Math.abs(o.pos.y - job.pos.y) > 3) continue;
      const fw = ex * hx + ez * hz, sd = Math.abs(ex * hz - ez * hx), same = Math.sin(o.yaw) * hx + Math.cos(o.yaw) * hz;
      if (fw > 0 && fw < 45 && sd < 1.6 + (o.radius || 0.9)) {
        if (same > 0.3) { if (fw - (o.halfL || 2.2) - 3 < gap) { gap = fw - (o.halfL || 2.2) - 3; vLead = o.v || 0; } }
        else if (same < -0.3 && fw < 35) { gap = Math.min(gap, fw - (o.halfL || 2.2) - 4); vLead = 0; blocked = true; } // oncoming in our lane: let it pass
        else if (fw < 14) { gap = Math.min(gap, fw - 4); vLead = 0; }
      }
      // cars behind us in the same direction hold back (nobody drives into a stopped ambulance)
      if (fw < 0 && fw > -30 && sd < 2.2 && same > 0.5 && (o.mode === 'city' || o.mode === 'road') && !o.incident) { const room = -fw - (o.halfL || 2.2) - 2.6 - 5; o.v = Math.min(o.v, Math.max(0, job.v + room * 0.6)); }
    }
    // the player's car
    const pv = g.mode === 'drive' ? g.vehicle?.pos : null;
    if (pv) { const ex = pv.x - job.pos.x, ez = pv.z - job.pos.z, fw = ex * hx + ez * hz, sd = Math.abs(ex * hz - ez * hx);
      if (fw > 0 && fw < 30 && sd < 2.4 && Math.abs(pv.y - job.pos.y) < 3) { if (fw - 6 < gap) { gap = fw - 6; vLead = 0; } if (job.stage === 'drive' && job.v < 0.3 && fw < 12 && job.ri > r.length - 12) return true; } }
    // emergency vehicle: siren on → cars ahead move over (traffic.js honk() response) — every half second
    if ((job.yieldT = (job.yieldT || 0) - dt) <= 0) { job.yieldT = 0.5; try { tr?.honk?.(job.pos, new THREE.Vector3(hx, 0, hz)); } catch {} }
    // red light at the junction ahead: crawl through it (緊急走行)
    const net = g.world.city?.net;
    if (net && job.ri < r.length) for (let k = job.ri; k < Math.min(r.length, job.ri + 6); k++) if (r[k].key !== undefined) { const d = r[k].distanceTo(job.pos); if (d < 16) { let L = 'go'; try { L = net.light(r[k].key, hx, hz, g.world.city.uniforms.uTime.value); } catch {} if (L !== 'go') want = Math.min(want, 3 + d * 0.25); } break; }
    // stuck behind something for a long time (a queue that never clears): pass through it rather than deadlock
    job.blockT = gap < 8 && job.v < 0.5 ? (job.blockT || 0) + dt : 0;
    if (job.blockT > 14) gap = 1e9;
    if (gap < 1e8) want = Math.min(want, Math.max(0, vLead + (gap - 2) * 0.55), gap < 1 ? 0 : 99);
    job.v += THREE.MathUtils.clamp(want - job.v, -7 * dt, 2.6 * dt); if (job.v < 0) job.v = 0;
    // steer towards the look-ahead point, move along the heading
    const tx = look.x - job.pos.x, tz = look.z - job.pos.z;
    if (tx * tx + tz * tz > 0.01) { const dy = angD(Math.atan2(tx, tz) - job.yaw); job.yaw += THREE.MathUtils.clamp(dy, -1.6 * dt * Math.max(0.4, job.v / 5), 1.6 * dt * Math.max(0.4, job.v / 5)); }
    const st = job.v * dt; job.pos.x += Math.sin(job.yaw) * st; job.pos.z += Math.cos(job.yaw) * st;
    const ty = r[Math.min(job.ri, r.length - 1)].y; job.pos.y += (ty - job.pos.y) * Math.min(1, dt * 4);
    return job.ri >= r.length - 1 && !job.ext && job.pos.distanceTo(r[r.length - 1]) < 2.5;
  }
  doorOf(ai) {
    const side = new THREE.Vector3(Math.cos(ai.yaw), 0, -Math.sin(ai.yaw)); // driver side (right-hand drive)
    return ai.pos.clone().addScaledVector(side, -(ai.radius + 1.3));
  }
  spawnCrew(job) {
    const g = this.g, f = new THREE.Vector3(Math.sin(job.yaw), 0, Math.cos(job.yaw)), r = new THREE.Vector3(-f.z, 0, f.x);
    const rear = job.pos.clone().addScaledVector(f, -3.2);
    for (const s of [-0.55, 0.55]) {
      const h = createPerson({ type: 'medic', sex: 'm', mirror: false, outfit: MEDIC_OUTFIT() }); // 救急隊員: light-blue / silver jacket, white helmet
      const pos = rear.clone().addScaledVector(r, s); h.object.position.copy(pos); g.scene.add(h.object);
      job.crew.push({ h, pos: h.object.position, yaw: job.yaw + Math.PI, speed: 0, action: 'idle' });
    }
    const st = job.stretcherSrc.clone(); g.scene.add(st); job.str = st;
    g.audio?.sfx?.('door_open', { position: rear });
  }
  // the two crew walk side by side (1.1 m apart across the stretcher) to a point
  walkCrew(job, p, dt, sp) {
    const [a, b] = job.crew; if (!a) return true;
    const mid = a.pos.clone().lerp(b.pos, 0.5), dx = p.x - mid.x, dz = p.z - mid.z, d = Math.hypot(dx, dz);
    if (d < 0.5) { for (const c of job.crew) { c.speed = 0; c.action = 'idle'; } return true; }
    const yaw = Math.atan2(dx, dz), st = Math.min(d, sp * dt), r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const nm = mid.clone().add(new THREE.Vector3(dx / d * st, 0, dz / d * st));
    a.pos.copy(nm).addScaledVector(r, -0.55); b.pos.copy(nm).addScaledVector(r, 0.55);
    for (const c of job.crew) { c.yaw = yaw; c.speed = sp; c.action = 'walk'; }
    return false;
  }
  dropCrew(job) {
    for (const c of job.crew) { c.h.dispose(); } job.crew = [];
    if (job.str) { job.str.removeFromParent(); job.str = null; }
    if (job.patient) { job.patient.h.dispose(); job.patient = null; }
    this.g.audio?.sfx?.('door_close', { position: job.pos });
  }
  remove(job) {
    this.dropCrew(job); job.siren?.dispose(); job.root?.removeFromParent();
    const i = this.list.indexOf(job); if (i >= 0) this.list.splice(i, 1);
  }
  busy() { return this.list.length > 0; }
}

// tiny local i18n for the few lines here (ja / en / ko)
import { getLang } from '../i18n.js';
export function L(m) { const l = (getLang?.() || 'ja').slice(0, 2); return m[l] || m.en || m.ja; }
