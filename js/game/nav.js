// Navigation (GPS): pick a destination on the full map → the route is searched with A* over the road graph you are
// on — the expressway network (lanes, diverges and ramp links, driving direction respected) or the city streets that
// are streamed in around you (one-way streets respected) — and drawn on the minimap and the full map, with a light
// beam at the destination and distance / next-turn hints on the HUD. Re-routes when you leave the route.
import * as THREE from 'three';
import { t } from '../i18n.js';

class Heap { // tiny binary min-heap on .f
  constructor() { this.a = []; }
  push(x) { const a = this.a; a.push(x); let i = a.length - 1; while (i) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() { const a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < a.length && a[l].f < a[m].f) m = l; if (r < a.length && a[r].f < a[m].f) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } } return top; }
  get size() { return this.a.length; }
}

function astar(start, goals, nbrs, pos, h, limit = 60000) {
  const g = new Map([[start, 0]]), prev = new Map(), H = new Heap(); H.push({ k: start, f: h(start) });
  let n = 0;
  while (H.size && n++ < limit) {
    const { k } = H.pop();
    if (goals.has(k)) { const path = [k]; let c = k; while (prev.has(c)) { c = prev.get(c); path.push(c); } return path.reverse().map(pos); }
    const gk = g.get(k);
    for (const [k2, w] of nbrs(k)) { const ng = gk + w; if (ng < (g.get(k2) ?? Infinity)) { g.set(k2, ng); prev.set(k2, k); H.push({ k: k2, f: ng + h(k2) }); } }
  }
  return null;
}

export class Nav {
  constructor(game) {
    this.g = game; this.target = null; this.route = null; this.t = 0; this.off = 0;
    // destination beacon: a tall soft light column + ground ring
    const mat = new THREE.MeshBasicMaterial({ color: 0x3fb6ff, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 120, 20, 1, true), mat); beam.position.y = 60;
    const ring = new THREE.Mesh(new THREE.RingGeometry(3, 4, 40), mat.clone()); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.3;
    this.beacon = new THREE.Group(); this.beacon.add(beam, ring); this.beacon.visible = false; game.scene.add(this.beacon);
  }
  set(x, z, label = '') {
    this.target = { x, z, label }; this.route = null; this.t = 0; this.beacon.visible = true;
    this.beacon.position.set(x, this.groundAt(x, z), z);
    this.g.audio?.sfx('ui_select');
  }
  clear() { this.target = null; this.route = null; this.beacon.visible = false; }
  groundAt(x, z) { const q = this.g.net.query(x, z, 200, (a, b) => this.g.world.ground(a, b)); return q.y; }
  focus() { const g = this.g; return g.mode === 'walk' ? g.player?.pos : g.vehicle?.pos; }

  update(dt) {
    if (!this.target) return;
    const p = this.focus(); if (!p) return;
    const d = Math.hypot(this.target.x - p.x, this.target.z - p.z);
    this.dist = d;
    this.beacon.children[1].scale.setScalar(1 + 0.15 * Math.sin(performance.now() / 300));
    if (d < 25) { this.g.ui.toast(t('game.nav.arrived'), 'info', 3); this.g.audio?.sfx('ui_select'); this.clear(); return; }
    // off-route check / periodic re-route
    this.t -= dt;
    if (this.route) { let best = 1e9; for (let i = 0; i < this.route.length; i += 2) { const q = this.route[i]; best = Math.min(best, (q[0] - p.x) ** 2 + (q[1] - p.z) ** 2); } this.off = Math.sqrt(best); }
    if (this.t <= 0 || (this.route && this.off > 40)) { this.t = this.route ? 4 : 1.5; this.plan(p); }
  }

  plan(p) {
    const v = this.g.vehicle, T = this.target;
    const onExpress = this.g.mode === 'drive' && v?.road && v.road.kind !== 'local' && v.onRoad;
    this.route = onExpress ? this.planExpress(p, v) : this.planCity(p);
    if (this.route) this.route.push([T.x, T.z]);
  }

  // ── city streets (loaded tiles) ──
  planCity(p) {
    const N = this.g.world.city?.net; if (!N || !N.nodes.size) return null;
    const T = this.target;
    const P = k => { const [a, b] = k.split(','); return [a / 2, b / 2]; };
    // nearest vertices: start near the player, goal near the target (or the loaded vertex closest to it)
    let s = null, sd = 1e18, gl = null, gd = 1e18;
    for (const [k, list] of N.nodes) { if (!list.length || list[0][0].cls > 6) continue; const [x, z] = P(k); const a = (x - p.x) ** 2 + (z - p.z) ** 2, b = (x - T.x) ** 2 + (z - T.z) ** 2; if (a < sd) { sd = a; s = k; } if (b < gd) { gd = b; gl = k; } }
    if (!s || !gl) return null;
    const nbrs = k => {
      const out = [];
      for (const [c, i] of N.nodes.get(k) || []) {
        if (c.dead || c.cls > 6) continue;
        if (i + 1 < c.pts.length) out.push([c.keys[i + 1], c.cum[i + 1] - c.cum[i]]);
        if (i > 0 && !c.oneway) out.push([c.keys[i - 1], c.cum[i] - c.cum[i - 1]]);
      }
      return out;
    };
    const h = k => { const [x, z] = P(k); return Math.hypot(x - T.x, z - T.z); };
    return astar(s, new Set([gl]), nbrs, P, h);
  }

  // ── expressway network (driving direction, diverges and ramp links) ──
  planExpress(p, v) {
    const net = this.g.net, T = this.target, STEP = 6;
    const id = (r, i) => r.id + '|' + i;
    const parse = k => { const j = k.lastIndexOf('|'); return [net.byId[k.slice(0, j)], +k.slice(j + 1)]; };
    const P = k => { const [r, i] = parse(k); const q = r.samples[i].p; return [q.x, q.z]; };
    const idxAt = (r, s) => { let i = 0; const S = r.samples; while (i < S.length - 1 && S[i + 1].s < s) i++; return Math.round(i / STEP) * STEP; };
    const clampI = (r, i) => Math.max(0, Math.min(r.samples.length - 1, i));
    // which way am I driving on this road?
    const h0 = v.surface?.hit; const r0 = v.road; if (!r0 || !h0) return null;
    const t0 = r0.dirAt(h0.s); const dirNow = (t0.x * Math.sin(v.yaw) + t0.z * Math.cos(v.yaw)) >= 0 ? 1 : -1;
    const start = id(r0, clampI(r0, idxAt(r0, h0.s))) + '|' + dirNow;
    // goal: road samples closest to the target
    let best = [], bd = 1e18;
    for (const r of net.roads) for (let i = 0; i < r.samples.length; i += STEP) { const q = r.samples[i].p; const d = (q.x - T.x) ** 2 + (q.z - T.z) ** 2; if (d < bd - 1) { bd = d; best = [[r, i]]; } }
    const goals = new Set(); for (const [r, i] of best) { goals.add(id(r, i) + '|1'); goals.add(id(r, i) + '|-1'); }
    const nb = k => {
      const parts = k.split('|'); const dir = +parts.pop(); const kk = parts.join('|'); const [r, i] = parse(kk); const out = [];
      const S = r.samples, j = dir > 0 ? (Math.floor(i / STEP) + 1) * STEP : (Math.ceil(i / STEP) - 1) * STEP;
      const okDir = dir === 1 || r.lanesB > 0;
      if (okDir && j >= 0 && j < S.length) out.push([id(r, j) + '|' + dir, Math.abs(S[j].s - S[i].s)]);
      if (okDir && (j < 0 || j >= S.length) && i !== clampI(r, j)) { const jj = clampI(r, j); out.push([id(r, jj) + '|' + dir, Math.abs(S[jj].s - S[i].s)]); }
      // diverges from this road between i and j (forward), and the ramp link at the end
      if (dir === 1) {
        const s0 = S[i].s, s1 = S[clampI(r, j)].s + (j >= S.length - 1 ? 5 : 0);
        for (const d of net.diverges.get(r) || []) if (d.dir === 1 && d.s >= s0 - 1 && d.s <= s1) out.push([id(d.to, 0) + '|1', 5]);
        if (i >= S.length - 1 - STEP) { const L = net.links.get(r); if (L) out.push([id(L.to, clampI(L.to, idxAt(L.to, L.s))) + '|' + (L.dir || 1), 5]); }
      } else {
        const s0 = S[clampI(r, j)].s, s1 = S[i].s;
        for (const d of net.diverges.get(r) || []) if (d.dir === -1 && d.s >= s0 && d.s <= s1 + 1) out.push([id(d.to, 0) + '|1', 5]);
      }
      return out;
    };
    const Pd = k => { const parts = k.split('|'); parts.pop(); return P(parts.join('|')); };
    const h = k => { const [x, z] = Pd(k); return Math.hypot(x - T.x, z - T.z); };
    return astar(start, goals, nb, Pd, h, 80000);
  }

  // next-turn hint from the route: angle between the current heading and the route a bit ahead
  hint(p, yaw) {
    if (!this.route || this.route.length < 2) return null;
    let k = 0, bd = 1e18; this.route.forEach((q, i) => { const d = (q[0] - p.x) ** 2 + (q[1] - p.z) ** 2; if (d < bd) { bd = d; k = i; } });
    let acc = 0, j = k; while (j < this.route.length - 1 && acc < 60) { acc += Math.hypot(this.route[j + 1][0] - this.route[j][0], this.route[j + 1][1] - this.route[j][1]); j++; }
    const q = this.route[j]; const a = Math.atan2(q[0] - p.x, q[1] - p.z); let d = a - yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
}
