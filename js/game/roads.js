// Road network of Daikoku JCT / PA / Daikoku-futō, its geometry, and the surface query used by physics & AI.
// World axes: +X east, +Z south, +Y up, metres. Origin = Daikoku PA (lat 35.4615, lon 139.6800). Left-hand traffic (Japan).
// Alignments come from OpenStreetMap via tools/osm-import.mjs → data/map-daikoku.js
// (Map data © OpenStreetMap contributors, ODbL 1.0 — https://www.openstreetmap.org/copyright).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { surface, weather } from './textures.js';
import { MAP } from '../../data/map-daikoku.js';
import { HAKONE } from '../../data/map-hakone.js';
import { C1 } from '../../data/map-c1.js';
import { SHUTO } from '../../data/map-shuto.js';

const LANE = 3.5;
const UV_WRAP = 600; // metres; texture v coordinates restart every 600 m (all tile sizes divide it)
export { MAP };

// ── Daikoku PA frame: the lot is a rotated rectangle (long axis ≈ NE). Local +X = long axis, local +Z = across. ──
// toWorld / toLocal convert between PA-local and world coordinates; yaw(localYaw) converts headings.
export const PA = (() => {
  const P = MAP.pa, c = Math.cos(P.yaw), s = Math.sin(P.yaw), cx = P.c[0], cz = P.c[1];
  return {
    ...P, cx, cz, cos: c, sin: s, angle: P.yaw,
    toWorld(lx, lz, out = new THREE.Vector3(), y = 0) { return out.set(cx + lx * c + lz * s, y, cz - lx * s + lz * c); },
    toLocal(x, z) { const dx = x - cx, dz = z - cz; return [dx * c - dz * s, dx * s + dz * c]; },
    yaw(localYaw) { return localYaw + P.yaw; },
    inLot(x, z, pad = 0) { const [lx, lz] = this.toLocal(x, z); return Math.abs(lx) < P.hx + pad && Math.abs(lz) < P.hz + pad; },
  };
})();
// axis-aligned bounds of the lot (kept for the existing "in the PA?" checks in main/ui/police/npc/accident)
export const PA_RECT = (() => {
  const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => PA.toWorld(a * PA.hx, b * PA.hz));
  const xs = pts.map(p => p.x), zs = pts.map(p => p.z), r = v => Math.round(v);
  return { x0: r(Math.min(...xs)), x1: r(Math.max(...xs)), z0: r(Math.min(...zs)), z1: r(Math.max(...zs)) };
})();
export const DECK_Y = 28; // typical Bayshore deck height at the JCT (legacy export)
export const DECK_Z = PA.cz - 80; // legacy export

// ───────────────────────── network definition ─────────────────────────
// lanesF: lanes in point order (on the LEFT of the centreline); lanesB: opposite direction. median: gap between directions.
// partner/edge: one-way roads that end at the map edge (K5 decks) → the player is turned onto the partner road there.
export const UMI_LOTS = [];
export const ROAD_DEFS = [...MAP.roads, ...umihotaruRamps(), HAKONE.road, ...C1.roads, ...SHUTO.roads];

// ── Umihotaru PA (海ほたる): the Aqua-Line runs along the island on the surface and under the ship-shaped PA building.
// Each carriageway gets its own surface lot on its left (Japan: exits on the left) with an entry and an exit ramp.
// Lots are described in the carriageway's frame (s along the road, lat to the left) so world.js can draw them.
function umihotaruRamps() {
  const U = MAP.umihotaru; if (!U) return [];
  const B = [17632, -310]; // PA building centre (OSM: 5-storey blocks)
  const out = [];
  for (const id of ['aqua_e', 'aqua_w']) {
    const d = MAP.roads.find(r => r.id === id); if (!d) continue;
    // polyline arclength helpers on the raw control points (good enough at 10 m spacing)
    const P = d.pts, S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][2] - P[i - 1][2]));
    const at = s => { let i = 0; while (i < P.length - 2 && S[i + 1] < s) i++; const t = Math.max(0, Math.min(1, (s - S[i]) / (S[i + 1] - S[i]))); const a = P[i], b = P[i + 1];
      const tx = b[0] - a[0], tz = b[2] - a[2], L = Math.hypot(tx, tz) || 1; return { x: a[0] + tx * t, y: a[1] + (b[1] - a[1]) * t, z: a[2] + tz * t, lx: tz / L, lz: -tx / L, tx: tx / L, tz: tz / L }; };
    let sB = 0, dB = 1e9; for (let i = 0; i < P.length; i++) { const dd = Math.hypot(P[i][0] - B[0], P[i][2] - B[1]); if (dd < dB) { dB = dd; sB = S[i]; } }
    const dir = id === 'aqua_e' ? 1 : -1;              // the lot is north-east of the building: ahead for eastbound, behind for westbound
    const s0 = dir > 0 ? sB + 150 : sB - 300, s1 = s0 + 140, LAT = 24, LANE_L = 1.75;
    UMI_LOTS.push({ road: id, s0, s1, lat0: LAT - 7, lat1: LAT + 26 });
    const pt = (s, lat, y) => { const q = at(s); return [+(q.x + q.lx * lat).toFixed(2), +(y ?? q.y).toFixed(2), +(q.z + q.lz * lat).toFixed(2)]; };
    const ease = t => t * t * (3 - 2 * t);
    const inPts = [], outPts = [];
    for (let k = 0; k <= 14; k++) { const u = k / 14, s = s0 - 95 + u * 95; const q = at(s); inPts.push(pt(s, LANE_L + (LAT - LANE_L) * ease(Math.max(0, (u - 0.15) / 0.85)), q.y + (0.05 - q.y) * ease(u))); }
    inPts.push(pt(s0 + 18, LAT, 0.04));
    outPts.push(pt(s1 - 18, LAT, 0.04));
    for (let k = 0; k <= 14; k++) { const u = k / 14, s = s1 + u * 95; const q = at(s); outPts.push(pt(s, LAT + (LANE_L - LAT) * ease(Math.min(1, u / 0.85)), 0.05 + (q.y - 0.05) * ease(u))); }
    outPts.push(pt(s1 + 125, LANE_L));
    const base = { kind: 'ramp', lanesF: 1, lanesB: 0, shoulder: 1.8, speed: 40, umihotaru: true };
    out.push({ ...base, id: `umi_in_${id.slice(-1)}`, name: '海ほたるPA 入口', pts: inPts }, { ...base, id: `umi_out_${id.slice(-1)}`, name: '海ほたるPA 出口', pts: outPts });
  }
  return out;
}

// ── PA lot layout in PA-local metres (shared by world.js = paint/stalls and traffic.js = AI lot driving) ──
// Car stalls in rows parallel to local Z (as the real aisles run), large-vehicle bays in the middle, a "meet" pair of
// rows at the north-east end next to the entrance/exit (+X end, +Z corner), circulation bands along both long sides.
export const PA_LAYOUT = {
  carAisles: [-58.5, -43, -27.5, -12], aisleW: 5.5, stallD: 5, stallW: 2.5, carZ: [-30, 30],
  truck: { rows: [[2, 15, -1], [27, 40, 1]], aisle: 21, z: [-21, 21], w: 3.6 },
  meet: { aisle: 51, z: [-30, 30] },
  bandZ: [-46.5, 46.5], endX: [-73, 70],
  entry: MAP.pa.entry.l, exit: MAP.pa.exit.l,
};

// ───────────────────────── sampling ─────────────────────────
export class Road {
  constructor(def, index) {
    Object.assign(this, def); this.index = index;
    this.median = def.median || 0;
    this.lanesB = def.lanesB || 0;
    const v = def.pts.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(v, false, 'centripetal');
    this.length = curve.getLength();
    const n = Math.max(8, Math.ceil(this.length / 2));
    this.samples = [];
    const pts = curve.getSpacedPoints(n);
    let s = 0;
    for (let i = 0; i <= n; i++) {
      const p = pts[i];
      if (i > 0) s += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
      const t = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
      const grade = (b.y - a.y) / Math.max(0.01, Math.hypot(b.x - a.x, b.z - a.z));
      this.samples.push({ p, t, left: new THREE.Vector3(t.z, 0, -t.x), s, grade });
    }
    this.length = s;
    // OSM bridge/viaduct heights come in steps (per way / layer), which left a ±5 m sawtooth on the long decks (the Bay
    // Bridge rose and dipped every 100 m). Smooth elevated stretches with a ±100 m window (3 passes), leaving the road ends alone so
    // junctions still meet.
    if (def.kind !== 'local' && n > 60) {
      const S = this.samples, mtn = def.kind === 'mountain', W = mtn ? 6 : Math.min(50, Math.floor(n / 6));
      for (let pass = 0; pass < 3; pass++) {
        const y0 = S.map(q => q.p.y), out = y0.slice();
        for (let i = W; i <= n - W; i++) {
          // decks (≥ 3 m) and trenches / tunnels (≤ −1 m) only — never pull a road across the ground plane (mountain roads: light despike only)
          const deck = mtn || y0[i] >= 3; let sum = 0, ok = true; for (let k = i - W; k <= i + W; k++) { if (mtn ? false : deck ? y0[k] < 3 : y0[k] > -1) { ok = false; break; } sum += y0[k]; }
          if (!ok) continue;
          const w = Math.min(1, Math.min(S[i].s, s - S[i].s) / 150);
          out[i] = y0[i] + (sum / (2 * W + 1) - y0[i]) * w;
        }
        S.forEach((q, i) => { q.p.y = out[i]; });
      }
      for (let i = 0; i <= n; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(n, i + 1)]; S[i].grade = (b.p.y - a.p.y) / Math.max(0.01, Math.hypot(b.p.x - a.p.x, b.p.z - a.p.z)); }
    }
    // v2.2 — no steps: one-sample spikes from the spline overshooting stepped OSM heights are flattened, and any grade
    // above the road type's limit is spread out over the neighbours (ends stay put so junctions still meet). Ramps used
    // to drop 10 m within a few metres at their start (a cliff / bump in the car) and decks had ±1.5 m spikes.
    if (def.kind !== 'local') {
      const S = this.samples, N = S.length - 1, y = S.map(q => q.p.y), gmax = def.kind === 'mountain' ? 0.15 : def.kind === 'ramp' ? 0.09 : 0.07;
      for (let pass = 0; pass < 4; pass++) for (let i = 1; i < N; i++) { const m = (y[i - 1] + y[i + 1]) / 2; if (Math.abs(y[i] - m) > 0.15) y[i] = m; }
      for (let it = 0; it < 400; it++) {
        let moved = false;
        for (let i = 0; i < N; i++) {
          const ds = Math.max(0.3, S[i + 1].s - S[i].s), d = y[i + 1] - y[i], lim = gmax * ds;
          if (Math.abs(d) <= lim + 1e-4) continue;
          const ex = (Math.abs(d) - lim) * Math.sign(d); moved = true;
          if (i === 0) y[1] -= ex; else if (i + 1 === N) y[i] += ex; else { y[i] += ex / 2; y[i + 1] -= ex / 2; }
        }
        if (!moved) break;
      }
      for (let pass = 0; pass < 24; pass++) { const z = y.slice(); for (let i = 1; i < N; i++) y[i] = (z[i - 1] + 2 * z[i] + z[i + 1]) / 4; } // round crests / sags (vertical curves)
      S.forEach((q, i) => { q.p.y = y[i]; });
      for (let i = 0; i <= N; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(N, i + 1)]; S[i].grade = (b.p.y - a.p.y) / Math.max(0.01, Math.hypot(b.p.x - a.p.x, b.p.z - a.p.z)); }
    }
    // lanes: lat positive = left of travel direction (point order)
    this.lanes = [];
    if (this.lanesB === 0) {
      for (let i = 0; i < def.lanesF; i++) this.lanes.push({ lat: (i - (def.lanesF - 1) / 2) * LANE, dir: 1, i });
      this.edgeL = def.lanesF * LANE / 2 + def.shoulder; this.edgeR = -this.edgeL;
    } else {
      for (let i = 0; i < def.lanesF; i++) this.lanes.push({ lat: this.median / 2 + (i + 0.5) * LANE, dir: 1, i });
      for (let i = 0; i < this.lanesB; i++) this.lanes.push({ lat: -(this.median / 2 + (i + 0.5) * LANE), dir: -1, i });
      this.edgeL = this.median / 2 + def.lanesF * LANE + def.shoulder;
      this.edgeR = -(this.median / 2 + this.lanesB * LANE + def.shoulder);
    }
    this.elevated = this.samples.some(q => q.p.y > 3);
  }
  // position on road at distance s with lateral offset lat
  at(s, lat = 0, out = new THREE.Vector3()) {
    const S = this.samples; s = Math.max(0, Math.min(this.length, s));
    let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m].s <= s) lo = m; else hi = m; }
    const a = S[lo], b = S[hi]; const t = (s - a.s) / Math.max(1e-6, b.s - a.s);
    out.lerpVectors(a.p, b.p, t);
    const lx = a.left.x + (b.left.x - a.left.x) * t, lz = a.left.z + (b.left.z - a.left.z) * t;
    const ll = Math.hypot(lx, lz) || 1;
    out.x += lx / ll * lat; out.z += lz / ll * lat;
    return out;
  }
  dirAt(s) { const i = Math.min(this.samples.length - 1, Math.max(0, Math.round(s / (this.length / (this.samples.length - 1))))); return this.samples[i].t; }
}

// Some OSM ramps have no / wrong height where they join a tunnel or trench (Ukishima JCT: the ramp left the Aqua-Line
// tunnel 16 m above it) → a step = a hole at the joint. Blend each ramp end to the height of the road it joins.
// v2.2 — exit / entry ramps whose OpenStreetMap chain stops in mid-air (大師, 平和島, 芝浦, 羽田 …: the real ramp goes on
// down to the street below) are continued along their own heading at a 6 % grade until they reach the ground
function landHangingRamps(defs) {
  const hwOf = o => ((o.lanesF || 1) + (o.lanesB || 0)) * 1.75 + (o.median || 0) / 2 + (o.shoulder || 1) + 1.5;
  const near = (self, q) => defs.some(o => o !== self && o.pts.some((p, i) => { const n = o.pts[Math.min(o.pts.length - 1, i + 1)], dx = n[0] - p[0], dz = n[2] - p[2], L2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((q[0] - p[0]) * dx + (q[2] - p[2]) * dz) / L2)); return Math.hypot(q[0] - p[0] - dx * t, q[2] - p[2] - dz * t) < hwOf(o) && Math.abs(p[1] + (n[1] - p[1]) * t - q[1]) < 2.5; }));
  return defs.map(d => {
    if (d.kind !== 'ramp' || d.pts.length < 3) return d;
    let pts = d.pts.slice(); let changed = false;
    for (const end of [1, 0]) {
      const P = end ? pts[pts.length - 1] : pts[0], Q = end ? pts[pts.length - 3] : pts[2];
      if (P[1] < 3 || near(d, P)) continue;
      let hx = P[0] - Q[0], hz = P[2] - Q[2]; const L = Math.hypot(hx, hz) || 1; hx /= L; hz /= L;
      const add = []; let y = P[1];
      for (let k = 1; y > 0.05 && k < 60; k++) { y = Math.max(0.05, P[1] - 0.06 * 10 * k); add.push([+(P[0] + hx * 10 * k).toFixed(2), +y.toFixed(2), +(P[2] + hz * 10 * k).toFixed(2)]); }
      add.push([+(P[0] + hx * 10 * (add.length + 1)).toFixed(2), 0.05, +(P[2] + hz * 10 * (add.length + 1)).toFixed(2)]);
      pts = end ? pts.concat(add) : add.reverse().concat(pts); changed = true;
    }
    return changed ? { ...d, pts, landed: true } : d;
  });
}
function fixFlatRamps(defs) {
  const dyNear = (self, x, z, y) => { let b = null; for (const o of defs) { if (o === self || o.kind === 'local') continue; for (const q of o.pts) { if (Math.hypot(q[0] - x, q[2] - z) > 12) continue; const dy = q[1] - y; if (b === null || Math.abs(dy) < Math.abs(b)) b = dy; } } return b ?? 0; };
  const sm = t => t * t * (3 - 2 * t), BL = 260;
  return defs.map(d => {
    if (d.kind !== 'ramp') return d;
    const a = d.pts[0], e = d.pts[d.pts.length - 1];
    const o0 = dyNear(d, a[0], a[2], a[1]), o1 = dyNear(d, e[0], e[2], e[1]);
    if (Math.abs(o0) < 1.2 && Math.abs(o1) < 1.2) return d; // v2.5.4: was 4 m — a 2.6–4 m step (湾岸線→大黒 at Daikoku JCT) went unfixed
    let L = 0; const acc = d.pts.map((p, i) => (L += i ? Math.hypot(p[0] - d.pts[i - 1][0], p[2] - d.pts[i - 1][2]) : 0));
    return { ...d, pts: d.pts.map((p, i) => [p[0], p[1] + (Math.abs(o0) >= 1.2 ? o0 * (1 - sm(Math.min(1, acc[i] / BL))) : 0) + (Math.abs(o1) >= 1.2 ? o1 * (1 - sm(Math.min(1, (L - acc[i]) / BL))) : 0), p[2]]) };
  });
}

// OSM street ways often stop a few metres short of the street they meet, leaving a hole in the asphalt at the junction.
// Extend every dangling local-street end (straight on, within 40 m) to the centreline of the street ahead of it.
function joinLocalEnds(defs) {
  const loc = defs.filter(d => d.kind === 'local');
  return defs.map(d => {
    if (d.kind !== 'local') return d;
    const pts = d.pts.map(p => p.slice());
    for (const end of [0, 1]) {
      const n = pts.length, e = end ? pts[n - 1] : pts[0], f = end ? pts[n - 2] : pts[1];
      let tx = e[0] - f[0], tz = e[2] - f[2]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      let best = null, joined = false;
      // two street ends facing each other across a gap (corner): bridge end-to-end, regardless of angle
      for (const o of loc) {
        if (o === d || o.id < d.id) continue;
        for (const oe of [o.pts[0], o.pts[o.pts.length - 1]]) { const dist = Math.hypot(oe[0] - e[0], oe[2] - e[2]); if (dist > 0.5 && dist < 30 && (!best || dist < best.dist)) best = { dist, p: [oe[0], e[1], oe[2]] }; }
      }
      if (best) { if (end) pts.push(best.p); else pts.unshift(best.p); continue; }
      for (const o of loc) {
        if (o === d || joined) continue;
        for (let i = 0; i < o.pts.length - 1; i++) {
          const a = o.pts[i], b = o.pts[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz || 1e-6;
          const u = Math.max(0, Math.min(1, ((e[0] - a[0]) * dx + (e[2] - a[2]) * dz) / L2));
          const x = a[0] + dx * u, z = a[2] + dz * u, vx = x - e[0], vz = z - e[2], dist = Math.hypot(vx, vz);
          if (dist < 0.5) { joined = true; break; } // already joined
          if (dist > 40 || (vx * tx + vz * tz) / dist < (dist < 25 ? 0.2 : 0.6)) continue; // only straight ahead
          if (!best || dist < best.dist) best = { dist, p: [x, e[1], z] };
        }
      }
      if (!joined && best) { if (end) pts.push(best.p); else pts.unshift(best.p); }
    }
    return { ...d, pts };
  });
}

// ───────────────────────── spatial index & surface query ─────────────────────────
// v2.5.3 — Yokohama Bay Bridge, west end: westbound Bayshore traffic ran off the end of the deck at 14 m while K3
// westbound began 9 m lower, 50 m away under the bridge. K3 westbound now starts ON the bridge in the westbound lanes
// (same height) and swings onto its own alignment ~230 m later; the stub under the deck is dropped.
// v2.5.4 — a road that ends exactly where the next one starts but at another height (K1 northbound at Namamugi:
// 19.6 m → 14 m, a 5.6 m cliff): the arriving road's last 250 m are eased to the next road's height
function joinSteppedEnds(defs) {
  const sm = t => t * t * (3 - 2 * t);
  const cum = d => { let L = 0; return d.pts.map((p, i) => (L += i ? Math.hypot(p[0] - d.pts[i - 1][0], p[2] - d.pts[i - 1][2]) : 0)); };
  for (const d of defs) {
    if (d.kind !== 'expressway') continue; // expressway → expressway only (ramps have their own height fixes)
    const E = d.pts[d.pts.length - 1];
    for (const o of defs) {
      if (o === d || o.kind !== 'expressway') continue; let S = o.pts[0];
      if (Math.hypot(S[0] - E[0], S[2] - E[2]) > 4 && o.lanesB > 0) S = o.pts[o.pts.length - 1]; // a two-way road's far end (b_sb → Bayshore at Haneda)
      if (Math.hypot(S[0] - E[0], S[2] - E[2]) > 14) continue;
      // v2.6.1: only a road that carries on in the same direction — K5 southbound ends under the start of K5
      // northbound (stacked 10 m higher, opposite way) and was hauled up into that deck
      { const Ep = d.pts[Math.max(0, d.pts.length - 3)], so = S === o.pts[0], On = so ? o.pts[Math.min(2, o.pts.length - 1)] : o.pts[Math.max(0, o.pts.length - 3)];
        const ax = E[0] - Ep[0], az = E[2] - Ep[2], bx = On[0] - S[0], bz = On[2] - S[2];
        if ((ax * bx + az * bz) / ((Math.hypot(ax, az) * Math.hypot(bx, bz)) || 1) < 0.3) continue; }
      const dy = S[1] - E[1]; if (Math.abs(dy) < 0.4 || Math.abs(dy) > 12) continue;
      const acc = cum(d), L = acc[acc.length - 1], B = Math.min(250, L * 0.6);
      d.pts = d.pts.map((p, i) => [p[0], p[1] + dy * sm(Math.max(0, 1 - (L - acc[i]) / B)), p[2]]);
      break;
    }
  }
  return defs;
}
// v2.5.4 — ramps whose OSM height left them in the air at their street end: run them down to the ground
// v2.5.4 — a ramp end sitting a few metres under/over the expressway it leaves or joins (centre line up to 25 m away)
function snapRampEnds(defs) {
  const sm = t => t * t * (3 - 2 * t);
  return defs.map(d => {
    if (d.kind !== 'ramp' || d.pts.length < 3) return d;
    let L = 0; const acc = d.pts.map((p, i) => (L += i ? Math.hypot(p[0] - d.pts[i - 1][0], p[2] - d.pts[i - 1][2]) : 0));
    const off = [0, 0];
    for (const end of [0, 1]) { const P = end ? d.pts[d.pts.length - 1] : d.pts[0]; let best = null;
      for (const o of defs) { if (o === d || o.kind !== 'expressway') continue; for (let k = 0; k < o.pts.length - 1; k++) { const a = o.pts[k], b = o.pts[k + 1], dx = b[0] - a[0], dz = b[2] - a[2], L2 = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((P[0] - a[0]) * dx + (P[2] - a[2]) * dz) / L2)); const h = Math.hypot(a[0] + dx * t - P[0], a[2] + dz * t - P[2]); if (h > 25) continue; const dy = a[1] + (b[1] - a[1]) * t - P[1]; if (best === null || Math.abs(dy) < Math.abs(best)) best = dy; } }
      if (best !== null && Math.abs(best) >= 1.2 && Math.abs(best) <= 8) off[end] = best; }
    if (!off[0] && !off[1]) return d;
    const B = Math.min(220, L * 0.45);
    return { ...d, pts: d.pts.map((p, i) => [p[0], p[1] + off[0] * (1 - sm(Math.min(1, acc[i] / B))) + off[1] * (1 - sm(Math.min(1, (L - acc[i]) / B))), p[2]]) };
  });
}
function landNamed(defs) {
  const sm = t => t * t * (3 - 2 * t), LAND = { e_tsurumi: 'start', x_shibaura: 'end' };
  return defs.map(d => {
    const w = LAND[d.id]; if (!w) return d;
    let L = 0; const acc = d.pts.map((p, i) => (L += i ? Math.hypot(p[0] - d.pts[i - 1][0], p[2] - d.pts[i - 1][2]) : 0));
    const B = Math.min(240, L * 0.62);
    const pts = d.pts.map((p, i) => { const u = w === 'start' ? acc[i] / B : (L - acc[i]) / B; const k = sm(Math.min(1, Math.max(0, u))); return [p[0], 0.05 + (p[1] - 0.05) * k, p[2]]; });
    return { ...d, pts, landed: true };
  });
}
function joinBayBridgeK3(defs) {
  const B = defs.find(d => d.id === 'bayshore'), K = defs.find(d => d.id === 'k3_wb'); if (!B || !K || K._joined) return defs;
  const p0 = B.pts[0]; let j = 1; while (j < B.pts.length - 1 && Math.hypot(B.pts[j][0] - p0[0], B.pts[j][2] - p0[2]) < 25) j++;
  const tx = B.pts[j][0] - p0[0], tz = B.pts[j][2] - p0[2], tl = Math.hypot(tx, tz) || 1, t = [tx / tl, tz / tl], left = [t[1], -t[0]];
  const lat = -((B.median || 0) / 2 + (B.lanesB || 3) * 3.5 / 2), y0 = p0[1];
  const A = sd => [p0[0] + t[0] * sd + left[0] * lat, y0, p0[2] + t[1] * sd + left[1] * lat];
  let i = 1, acc = 0; while (i < K.pts.length - 1 && acc < 230) { acc += Math.hypot(K.pts[i][0] - K.pts[i - 1][0], K.pts[i][2] - K.pts[i - 1][2]); i++; }
  const lead = [A(70), A(40), A(15), A(0), A(-25)];
  const tail = K.pts.slice(i); const yT = tail[0][1];
  // ease the height from the deck to the K3 profile over the gap
  const g0 = lead[lead.length - 1], g1 = tail[0], mid = [1, 2, 3].map(k => { const f = k / 4, e = f * f * (3 - 2 * f); return [g0[0] + (g1[0] - g0[0]) * f, y0 + (yT - y0) * e, g0[2] + (g1[2] - g0[2]) * f]; });
  K.pts = [...lead, ...mid, ...tail]; K._joined = true;
  return defs;
}

export class RoadNet {
  constructor(defs = ROAD_DEFS) {
    // drop degenerate polylines from the OSM import (zero-length ways would put signs/lamps on one point of another road)
    const plen = d => d.pts.reduce((a, q, i) => i ? a + Math.hypot(q[0] - d.pts[i - 1][0], q[2] - d.pts[i - 1][2]) : 0, 0);
    this.roads = landHangingRamps(landNamed(snapRampEnds(fixFlatRamps(joinLocalEnds(joinSteppedEnds(joinBayBridgeK3(defs.filter(d => d.pts?.length > 1 && plen(d) > 8)))))))).map((d, i) => new Road(d, i));
    this.byId = Object.fromEntries(this.roads.map(r => [r.id, r]));
    // v2.5.4: after smoothing, a ramp end can sit a few metres off the deck it leaves / joins (湾岸線→大黒 started 2.7 m
    // under the Bayshore at Daikoku JCT): ease the ramp's end samples onto that deck
    { const sm = t => t * t * (3 - 2 * t);
      for (const r of this.roads) { if (r.kind !== 'ramp' || r.samples.length < 4) continue; const S = r.samples, L = S[S.length - 1].s;
        for (const end of [0, 1]) { const P = (end ? S[S.length - 1] : S[0]).p; let best = null;
          for (const o of this.roads) { if (o === r || o.kind !== 'expressway') continue; const hw = (o.edgeL - o.edgeR) / 2 + 2; for (let i = 0; i < o.samples.length; i += 2) { const q = o.samples[i].p, h = Math.hypot(q.x - P.x, q.z - P.z); if (h > hw) continue; const dy = q.y - P.y; if (best === null || Math.abs(dy) < Math.abs(best)) best = dy; } }
          if (best === null || Math.abs(best) < 1.2 || Math.abs(best) > 8) continue;
          const B = Math.min(220, L * 0.45); for (const q of S) { const u = end ? (L - q.s) / B : q.s / B; if (u < 1) q.p.y += best * (1 - sm(Math.max(0, u))); } } } }
    this.cell = 24; this.grid = new Map();
    for (const r of this.roads) {
      for (let i = 0; i < r.samples.length - 1; i++) {
        const a = r.samples[i].p, b = r.samples[i + 1].p;
        const pad = Math.max(r.edgeL, -r.edgeR) + 2;
        const x0 = Math.floor((Math.min(a.x, b.x) - pad) / this.cell), x1 = Math.floor((Math.max(a.x, b.x) + pad) / this.cell);
        const z0 = Math.floor((Math.min(a.z, b.z) - pad) / this.cell), z1 = Math.floor((Math.max(a.z, b.z) + pad) / this.cell);
        for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
          const k = x * 100003 + z; let arr = this.grid.get(k); if (!arr) this.grid.set(k, arr = []);
          arr.push(r.index, i);
        }
      }
    }
    this._res = [];
    this.fairRamps();
    this.clearances();
    this.snapSeams();
    this.findJunctions();
    this.flushJoins();
  }
  // Where a ramp leaves / joins a road, the part of it lying on the parent deck must have the parent's height, then blend
  // smoothly into its own profile — otherwise the ramp floats 1–2 m over the main lanes (a step for car and eye).
  flushJoins() {
    // v2.6.1: end-to-start continuations (K1 横羽線 → K1 at Namamugi ended 0.8–1 m above the road it runs on into)
    for (const r of this.roads) {
      if (r.kind === 'local' || r.lanesB) continue;
      const S = r.samples, L = r.length, E = S[S.length - 1], e = E.p;
      const nx = this.roads.find(o => o !== r && o.kind !== 'local' && !o.lanesB && Math.hypot(o.samples[0].p.x - e.x, o.samples[0].p.z - e.z) < 4 && o.samples[0].t.x * E.t.x + o.samples[0].t.z * E.t.z > 0.8);
      if (!nx) continue;
      const dy = nx.samples[0].p.y - e.y; if (Math.abs(dy) < 0.05 || Math.abs(dy) > 3) continue;
      const B = Math.min(180, L * 0.5); for (const q of S) { const u = (L - q.s) / B; if (u < 1) { const t = 1 - u; q.p.y += dy * t * t * (3 - 2 * t); } }
      this._grades(r);
    }
    const pairs = [];
    for (const [parent, l] of this.diverges) for (const d of l) pairs.push([d.to, parent, 0]);
    for (const [child, d] of this.links) pairs.push([child, d.to, 1]);
    for (const [r, parent, atEnd] of pairs) {
      if (r.kind === 'local' || r === parent) continue;
      if (r.kind === 'expressway' && parent.kind !== 'expressway') continue; // v2.6.1: a main line never follows a merging ramp's height
      const S = r.samples, n = S.length, idx = i => atEnd ? n - 1 - i : i;
      const pY = (p) => { let y = null; for (const h of this.hits(p.x, p.z)) if (h.road === parent && !h.beyond && h.lat <= parent.edgeL + 0.5 && h.lat >= parent.edgeR - 0.5 && Math.abs(h.y - p.y) < 4) y = h.y; return y; };
      let k = 0, lastOff = 0; const BL = 60; // v2.6.1: 30 → 60 m blend (a 6–8 % grade break at every join)
      for (; k < n; k++) { const q = S[idx(k)]; const y = pY(q.p); if (y === null) break; lastOff = y - q.p.y; q.p.y = y; }
      if (!k) continue;
      const s0 = S[idx(k - 1)].s;
      for (let j = k; j < n; j++) { const q = S[idx(j)]; const ds = Math.abs(q.s - s0); if (ds > BL) break; const t = ds / BL; q.p.y += lastOff * (1 - t * t * (3 - 2 * t)); }
    }
  }
  // Where one road's start lies on another (diverge) and where a road's end flows into another (link).
  // Used by the traffic AI; computed from geometry so new regions work without hand-made tables.
  findJunctions() {
    this.diverges = new Map(); this.links = new Map();
    const match = (r, x, z, y, t, other) => {
      let best = null;
      for (const h of this.hits(x, z)) {
        if (h.road === r || (other && h.road !== other) || !h.inside || Math.abs(h.y - y) > 1.6) continue;
        const u = h.road.samples[h.i].t; const dot = u.x * t.x + u.z * t.z;
        const dir = dot > 0.6 ? 1 : dot < -0.6 ? -1 : 0;
        if (!dir || (dir === -1 && !h.road.lanesB)) continue;
        const d = Math.abs(h.lat - (dir > 0 ? (h.road.lanesB ? h.road.median / 2 + h.road.lanesF * LANE / 2 : 0) : -(h.road.median / 2 + h.road.lanesB * LANE / 2)));
        if (!best || d < best.d) best = { road: h.road, s: h.s, dir, lat: h.lat, d };
      }
      return best;
    };
    for (const r of this.roads) {
      if (r.lanesB) continue; // two-way roads end at the map edge (U-turn)
      const a = r.samples[0], b = r.samples[r.samples.length - 1];
      const dv = match(r, a.p.x, a.p.z, a.p.y, a.t);
      if (dv) { let l = this.diverges.get(dv.road); if (!l) this.diverges.set(dv.road, l = []); l.push({ s: dv.s, dir: dv.dir, to: r, lat: dv.lat }); }
      // step 1 m back from the end so the hit is on the joined road's surface, not its edge
      const e = r.at(r.length - 1); const lk = match(r, e.x, e.z, e.y, b.t);
      if (lk) this.links.set(r, { to: lk.road, s: lk.s, dir: lk.dir, lat: lk.lat });
    }
    for (const l of this.diverges.values()) l.sort((x, y) => x.s - y.s);
    const bay = this.byId.bayshore, pin = this.byId.pa_in;
    this.sPAin = bay && pin ? (this.diverges.get(bay) || []).find(d => d.to === pin)?.s ?? 0 : 0;
  }
  // v2.6.1 — OSM ramp heights come in per-way steps: a light fairing pass removes the sudden grade breaks (a jolt at
  // speed) on ramps, leaving 30 m at each end untouched so the joins found later still meet
  fairRamps() {
    for (const r of this.roads) {
      if (r.kind !== 'ramp' || r.samples.length < 40) continue;
      const S = r.samples, L = r.length, y = S.map(q => q.p.y), w = S.map(q => Math.min(1, Math.max(0, (Math.min(q.s, L - q.s) - 30) / 40)));
      for (let pass = 0; pass < 40; pass++) { const z = y.slice(); for (let i = 1; i < S.length - 1; i++) if (w[i] > 0) y[i] = z[i] + ((z[i - 1] + 2 * z[i] + z[i + 1]) / 4 - z[i]) * w[i]; }
      S.forEach((q, i) => { q.p.y = y[i]; });
      this._grades(r);
    }
  }
  _grades(r) { const S = r.samples; for (let i = 0; i < S.length; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)]; S[i].grade = (b.p.y - a.p.y) / Math.max(0.01, Math.hypot(b.p.x - a.p.x, b.p.z - a.p.z)); } }
  // v2.6.1 — two carriageways crossing one over the other with too little headroom (大師 exit 3.6 m under K1, K3→K1
  // ramp under K3, the stacked C1 tunnels): the lower road dips (or, when it is at ground level, the upper one rises)
  // smoothly over ±160 m until there is 5 m of headroom (7.2 m between tunnels, for the tunnel box)
  clearances() {
    const sm = t => t * t * (3 - 2 * t);
    // roads that join (an end of one lies on the other's deck) converge in height on purpose — never pushed apart
    const joined = new Set();
    for (const r of this.roads) for (const q of [r.samples[0], r.samples[r.samples.length - 1]]) for (const h of this.hits(q.p.x, q.p.z)) if (h.road !== r && Math.abs(h.y - q.p.y) < 1.6 && h.lat <= h.road.edgeL + 2 && h.lat >= h.road.edgeR - 2) { joined.add(r.index + ':' + h.road.index); joined.add(h.road.index + ':' + r.index); }
    for (let iter = 0; iter < 3; iter++) {
      const need = new Map(); // road → [{s, d}] (d < 0 lower, d > 0 raise)
      const add = (r, s, d) => { let l = need.get(r); if (!l) need.set(r, l = []); l.push({ s, d }); };
      for (const r of this.roads) {
        if (r.kind === 'local') continue;
        const S = r.samples;
        for (let i = 0; i < S.length; i += 2) {
          const p = S[i].p;
          for (const h of this.hits(p.x, p.z)) {
            const o = h.road; if (o === r || o.kind === 'local' || h.beyond || joined.has(r.index + ':' + o.index)) continue;
            if (Math.min(h.lat - o.edgeR, o.edgeL - h.lat) < 1.0) continue;
            const dy = h.y - p.y; if (dy < 0.6) continue; // r is the lower road
            const req = (p.y < -0.6 || h.y < -0.6) ? 7.2 : 5.0; if (dy >= req) continue;
            const def = req - dy, endR = Math.min(S[i].s, r.length - S[i].s), endO = Math.min(h.s, o.length - h.s);
            if (p.y - def < 0.3 && p.y > -0.3 || endR < 40) { if (endO >= 40) add(o, h.s, def); }
            else add(r, S[i].s, -def);
          }
        }
      }
      if (!need.size) break;
      for (const [r, l] of need) {
        const S = r.samples, L = r.length;
        for (const q of S) { let lo = 0, hi = 0; for (const n of l) { const w = 1 - sm(Math.min(1, Math.abs(q.s - n.s) / 160)); if (n.d < 0) lo = Math.min(lo, n.d * w); else hi = Math.max(hi, n.d * w); }
          const tap = sm(Math.min(1, Math.min(q.s, L - q.s) / 60)); q.p.y += (lo + hi) * 1.05 * tap; }
        this._grades(r);
      }
    }
  }
  // v2.2 — where a ramp runs on top of a carriageway (diverge / merge tapers) both decks must be the same surface: the
  // lesser road's samples take the main road's height there (they differed by up to 1 m → a step when changing lanes)
  snapSeams() {
    const rank = r => (r.kind === 'expressway' ? 3 : r.kind === 'ramp' ? 2 : 1) * 1e6 + r.length;
    for (const r of this.roads) {
      if (r.kind === 'local') continue;
      const S = r.samples, fixed = new Uint8Array(S.length); let any = false;
      for (let i = 0; i < S.length; i++) {
        const p = S[i].p; let best = null;
        for (const h of this.hits(p.x, p.z)) { if (h.road === r || !h.inside || h.beyond) continue;
          // v2.6.1: a ramp foot crossing a street at ground level takes the street's height (futo_out landed 1 m above 大黒橋通り)
          const streetFoot = h.road.kind === 'local' && r.kind === 'ramp' && p.y < 2 && Math.abs(h.y) < 0.5 && h.lat <= h.road.edgeL - 0.5 && h.lat >= h.road.edgeR + 0.5;
          if (h.road.kind === 'local' && !streetFoot) continue; const d = h.y - p.y; if (Math.abs(d) > 0.03 && Math.abs(d) < 1.3 && (rank(h.road) > rank(r) || streetFoot) && (!best || Math.abs(d) < Math.abs(best - p.y))) best = h.y; }
        if (best !== null) { p.y = best; fixed[i] = 1; any = true; }
      }
      if (!any) continue;
      const y = S.map(q => q.p.y);
      for (let pass = 0; pass < 140; pass++) { const z = y.slice(); for (let i = 1; i < S.length - 1; i++) if (!fixed[i]) y[i] = (z[i - 1] + 2 * z[i] + z[i + 1]) / 4; }
      S.forEach((q, i) => { q.p.y = y[i]; });
      for (let i = 0; i < S.length; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)]; S[i].grade = (b.p.y - a.p.y) / Math.max(0.01, Math.hypot(b.p.x - a.p.x, b.p.z - a.p.z)); }
    }
  }
  // lane of `road` in direction `dir` nearest to lateral offset `lat`
  laneNear(road, dir, lat) { return road.lanes.filter(l => l.dir === dir).sort((a, b) => Math.abs(a.lat - lat) - Math.abs(b.lat - lat))[0]; }
  // All road hits at (x,z): [{road, i, t, y, lat, s, inside}]
  hits(x, z) {
    const k = Math.floor(x / this.cell) * 100003 + Math.floor(z / this.cell);
    const arr = this.grid.get(k); const res = this._res; res.length = 0;
    if (!arr) return res;
    const best = new Map();
    for (let j = 0; j < arr.length; j += 2) {
      const r = this.roads[arr[j]], i = arr[j + 1];
      const A = r.samples[i], B = r.samples[i + 1];
      const dx = B.p.x - A.p.x, dz = B.p.z - A.p.z; const L2 = dx * dx + dz * dz || 1e-6;
      let t = ((x - A.p.x) * dx + (z - A.p.z) * dz) / L2;
      const tc = Math.max(0, Math.min(1, t));
      const px = A.p.x + dx * tc, pz = A.p.z + dz * tc;
      const lat = (x - px) * A.left.x + (z - pz) * A.left.z;
      const along = Math.hypot(x - px, z - pz) - Math.abs(lat); // >0 if beyond segment ends
      if (along > 0.5 && (i > 0 && i < r.samples.length - 2)) continue;
      const d = Math.abs(lat) + Math.max(0, along) * 4;
      const y = A.p.y + (B.p.y - A.p.y) * tc;
      const key = r.index * 64 + (Math.floor(y / 6) & 63); // a road may pass over itself (spiral ramps) → keep each level
      const prev = best.get(key);
      if (!prev || d < prev.d) best.set(key, { road: r, i, t: tc, d, lat, y, s: A.s + (B.s - A.s) * tc, beyond: (t < -0.01 && i === 0) || (t > 1.01 && i === r.samples.length - 2) });
    }
    // the same road can appear under two level keys where it crosses a 6 m boundary: keep only the nearer segment
    // (the other is a clamped neighbour whose height is off by grade × distance → a 10–20 cm step in the surface)
    if (best.size > 1) { const v = [...best.entries()]; for (const [k, h] of v) for (const [k2, h2] of v) if (k !== k2 && h.road === h2.road && Math.abs(h.y - h2.y) < 3 && best.has(k) && best.has(k2)) best.delete(h.d <= h2.d ? k2 : k); }
    for (const h of best.values()) { h.inside = !h.beyond && h.lat <= h.road.edgeL + 0.6 && h.lat >= h.road.edgeR - 0.6; res.push(h); }
    return res;
  }
  // Surface below a point. yHint = current height (to resolve stacked decks).
  query(x, z, yHint = 0, ground = null) {
    const hs = this.hits(x, z);
    let best = null;
    for (const h of hs) {
      if (!h.inside) continue;
      if (h.y > yHint + 1.6) continue; // deck far above us → not our surface
      if (!best || (h.y > best.y && !(Math.abs(best.y - yHint) < 0.5 && h.y - yHint > 0.5))) best = h; // stay on our own deck
    }
    const gy = ground ? ground(x, z) : 0;
    if (best && (best.y >= gy - 0.6 || best.y < -0.5)) return { y: best.y, hit: best, road: best.road, onRoad: true }; // below ground = tunnel / trench
    return { y: gy, hit: null, road: null, onRoad: false };
  }
}

// ───────────────────────── geometry ─────────────────────────
// faces up (visible from above) unless `down` (deck soffits)
function ribbon(road, latA, latB, yOff, { uScale = 1, segs = 1, dashed = null, s0 = 0, s1 = Infinity, down = false, keep = null } = {}) {
  const S = road.samples; const pos = [], uv = [], idx = [];
  let vi = 0;
  for (let i = 0; i < S.length - 1; i++) {
    const a = S[i], b = S[i + 1];
    if (b.s < s0 || a.s > s1) continue;
    if (dashed) { const mid = (a.s + b.s) / 2 + dashed.offset; if ((mid % dashed.period) > dashed.on) continue; }
    if (keep && !keep(i)) continue;
    const base = Math.floor(a.s / UV_WRAP) * UV_WRAP;
    for (const q of [a, b]) for (let k = 0; k <= segs; k++) {
      const lat = latA + (latB - latA) * k / segs;
      pos.push(q.p.x + q.left.x * lat, q.p.y + yOff, q.p.z + q.left.z * lat);
      uv.push(lat * uScale, q.s - base);
    }
    for (let k = 0; k < segs; k++) {
      const r0 = vi + k, r1 = vi + segs + 1 + k;
      if (down) idx.push(r0, r0 + 1, r1, r0 + 1, r1 + 1, r1); else idx.push(r0, r1, r0 + 1, r0 + 1, r1, r1 + 1);
    }
    vi += (segs + 1) * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// sweep a 2D profile [[lat, dy],...] along road (closed=false). profile lat relative to `latBase`
function sweep(road, profile, latBase, yOff = 0, side = 1, s0 = 0, s1 = Infinity) {
  const S = road.samples; const pos = [], uv = [], idx = [];
  const np = profile.length; let rows = 0;
  let plen = [0]; for (let k = 1; k < np; k++) plen.push(plen[k - 1] + Math.hypot(profile[k][0] - profile[k - 1][0], profile[k][1] - profile[k - 1][1]));
  let base = null;
  const row = (q, v) => { for (let k = 0; k < np; k++) { const lat = latBase + profile[k][0] * side; pos.push(q.p.x + q.left.x * lat, q.p.y + yOff + profile[k][1], q.p.z + q.left.z * lat); uv.push(plen[k], v); } rows++; };
  for (let i = 0; i < S.length; i++) {
    const q = S[i]; if (q.s < s0 - 2 || q.s > s1 + 2) continue;
    const b = Math.floor(q.s / UV_WRAP) * UV_WRAP;
    if (base !== null && b !== base) row(q, q.s - base); // close the previous period at this point, then restart (zero-length quad between)
    base = b; row(q, q.s - base);
  }
  for (let r = 0; r < rows - 1; r++) for (let k = 0; k < np - 1; k++) {
    const a = r * np + k, b = a + 1, c = a + np, d = c + 1;
    if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Is the point (x,y,z) on top of another road's deck (same level)? → no barrier / kerb there (merges, diverges, crossings)
function onOtherRoad(net, road, x, y, z, pad = 0.2) {
  for (const h of net.hits(x, z)) {
    if (h.road === road || h.beyond) continue;
    if (Math.abs(h.y - y) > 1.5) continue;
    if (h.lat <= h.road.edgeL - pad && h.lat >= h.road.edgeR + pad) return true;
  }
  return false;
}
// [s0,s1] runs along `road` where the edge at lateral `lat` is free of other roads
function freeRuns(net, road, lat, pad = 0.2) {
  const out = []; let s0 = null; const S = road.samples; const lats = Array.isArray(lat) ? lat : [lat];
  for (let i = 0; i < S.length; i++) {
    const q = S[i];
    const free = lats.every(l => !onOtherRoad(net, road, q.p.x + q.left.x * l, q.p.y, q.p.z + q.left.z * l, pad));
    if (free && s0 === null) s0 = q.s;
    if ((!free || i === S.length - 1) && s0 !== null) { const e = free ? q.s : S[Math.max(0, i - 1)].s; if (e - s0 > 3) out.push([s0, e]); s0 = null; }
  }
  return out;
}
// span of the Bayshore between the Bay Bridge towers (+ side spans): no ordinary piers / lamps there
export function bridgeSpan(net) {
  const B = MAP.bridge, r = B && net.byId[B.road]; if (!r) return null;
  const sOn = ([x, z]) => net.hits(x, z).filter(h => h.road === r).sort((a, b) => Math.abs(a.lat) - Math.abs(b.lat))[0]?.s;
  const a = sOn(B.towers[0]), b = sOn(B.towers[1]); if (a === undefined || b === undefined) return null;
  return { road: r, s0: Math.min(a, b) - 210, s1: Math.max(a, b) + 210, towers: [a, b] };
}

// ── tunnels: every run of a road below ground (y < -0.6). On land the shallow part is an open trench (retaining walls,
// a hole is cut into the ground by world.js via trenchPolys); deeper (or anywhere under the sea) it is a closed box tunnel.
const TUN_H = 6.8;
function tunnelRuns(road) {
  const S = road.samples, runs = []; let i0 = -1;
  for (let i = 0; i < S.length; i++) { const below = S[i].p.y < -0.6; if (below && i0 < 0) i0 = Math.max(0, i - 1); if ((!below || i === S.length - 1) && i0 >= 0) { runs.push([i0, Math.min(S.length - 1, i + (below ? 0 : 0))]); i0 = -1; } }
  return runs;
}
const coveredAt = (q, isLand) => !isLand(q.p.x, q.p.z) || q.p.y < -TUN_H + 0.6;
export function trenchPolys(net, isLand) {
  const out = [];
  for (const r of net.roads) for (const [i0, i1] of tunnelRuns(r)) {
    const S = r.samples; let run = [];
    const flush = () => { if (run.length > 1) { const L = run.map(q => [q.p.x + q.left.x * (r.edgeL + 0.9), q.p.z + q.left.z * (r.edgeL + 0.9)]), R = run.map(q => [q.p.x + q.left.x * (r.edgeR - 0.9), q.p.z + q.left.z * (r.edgeR - 0.9)]); out.push([...L, ...R.reverse()]); } run = []; };
    for (let i = i0; i <= i1; i++) { const q = S[i]; if (!coveredAt(q, isLand) && isLand(q.p.x, q.p.z)) run.push(q); else flush(); }
    flush();
  }
  return out;
}
// tunnel mouths: where a road passes from open air (or an open trench) under cover. dir = +1 if traffic along the road
// enters here, -1 if traffic in the opposite direction (two-way roads) enters here.
export function tunnelPortals(net, isLand) {
  const out = [];
  for (const r of net.roads) {
    if (r.kind === 'local') continue;
    for (const [i0, i1] of tunnelRuns(r)) {
      const S = r.samples;
      for (let i = i0; i < i1; i++) {
        const ca = coveredAt(S[i], isLand), cb = coveredAt(S[i + 1], isLand); if (ca === cb) continue;
        const q = ca ? S[i] : S[i + 1];
        if (!isLand(q.p.x, q.p.z)) continue; // immersed tunnels start out at sea (artificial islands have their own buildings)
        out.push({ r, q, i: ca ? i : i + 1, enter: cb ? 1 : -1, w: r.edgeL - r.edgeR + 1.2, top: q.p.y + TUN_H });
      }
    }
  }
  return out;
}
function buildTunnels(net, isLand, lampOut) {
  const pos = [], idx = [], lamps = [], uvs = [];
  // uv: u runs along the road (s), v up the wall / across the ceiling — world-xz based uvs smeared the texture into streaks
  const quad = (a, b, c, d, sa = 0, sb = 0, flat = false) => { const v = pos.length / 3; pos.push(...a, ...b, ...c, ...d); idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
    if (flat) uvs.push(sa * 0.25, 0, sb * 0.25, 0, sb * 0.25, 1.5, sa * 0.25, 1.5); else uvs.push(sa * 0.25, a[1] * 0.25, sb * 0.25, b[1] * 0.25, sb * 0.25, c[1] * 0.25, sa * 0.25, d[1] * 0.25); };
  const P = (q, lat, y) => [q.p.x + q.left.x * lat, y, q.p.z + q.left.z * lat];
  for (const r of net.roads) {
    if (r.kind === 'local') continue;
    const L = r.edgeL + 0.6, R = r.edgeR - 0.6;
    for (const [i0, i1] of tunnelRuns(r)) {
      const S = r.samples;
      for (let i = i0; i < i1; i++) {
        const a = S[i], b = S[i + 1];
        const ca = coveredAt(a, isLand), cb = coveredAt(b, isLand);
        const ta = ca ? a.p.y + TUN_H : 0.45, tb = cb ? b.p.y + TUN_H : 0.45;
        // side walls — not where the wall would stand on another carriageway (both C1 loops share one tunnel bore)
        for (const lat of [L, R]) { const pa = P(a, lat, a.p.y), pb = P(b, lat, b.p.y); if (onOtherRoad(net, r, pa[0], pa[1], pa[2], 0.3) || onOtherRoad(net, r, pb[0], pb[1], pb[2], 0.3)) continue; quad(P(a, lat, a.p.y - 0.3), P(b, lat, b.p.y - 0.3), P(b, lat, Math.max(tb, b.p.y + 1)), P(a, lat, Math.max(ta, a.p.y + 1)), a.s, b.s); }
        if (ca && cb) {
          quad(P(a, L, ta), P(b, L, tb), P(b, R, tb), P(a, R, ta), a.s, b.s, true);  // ceiling
          if (!isLand(a.p.x, a.p.z)) quad(P(a, L - 0.6, ta + 1.2), P(b, L - 0.6, tb + 1.2), P(b, R + 0.6, tb + 1.2), P(a, R + 0.6, ta + 1.2), a.s, b.s, true); // roof of the immersed box
        }
        if (ca !== cb) { const q = ca ? a : b, t = q.p.y + TUN_H; if (t < 0.45) quad(P(q, L + 0.6, t), P(q, R - 0.6, t), P(q, R - 0.6, 1.2), P(q, L + 0.6, 1.2), L, R); } // portal headwall
        if (ca && (Math.floor(a.s / 9) !== Math.floor(b.s / 9))) { lamps.push(P(a, L - 1.0, a.p.y + TUN_H - 0.35), P(a, R + 1.0, a.p.y + TUN_H - 0.35)); if (Math.floor(a.s / 36) !== Math.floor(b.s / 36)) lampOut?.push(new THREE.Vector3(...P(a, 0, a.p.y + TUN_H - 1.0))); }
      }
    }
  }
  const g = new THREE.Group(); g.name = 'tunnels';
  if (!pos.length) return g;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  const wall = surface('concrete', { tile: 3 }).clone(); wall.side = THREE.DoubleSide; wall.color = new THREE.Color(0xc9c4b8);
  const m = new THREE.Mesh(geo, wall); m.castShadow = true; m.receiveShadow = true; g.add(m);
  if (lamps.length) {
    const lg = new THREE.BoxGeometry(0.7, 0.12, 0.7);
    const lm = new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xffa646, emissiveIntensity: 2.2 });
    const inst = new THREE.InstancedMesh(lg, lm, lamps.length); const m4 = new THREE.Matrix4();
    lamps.forEach((p, i) => { m4.makeTranslation(p[0], p[1], p[2]); inst.setMatrixAt(i, m4); });
    inst.frustumCulled = false; g.add(inst);
  }
  return g;
}

export function buildRoadMeshes(net, opts = {}) {
  const group = new THREE.Group(); group.name = 'roads';
  const asphalt = surface('asphalt', { tile: 5, tint: 0x8a8a8a });
  const asphaltOld = surface('asphalt_worn', { tile: 6, tint: 0x8a8a8a });
  const concrete = weather(surface('concrete', { tile: 3 }), 0.55);   // decades of exhaust soot on the parapets
  const concreteOld = weather(surface('pier', { tile: 4 }), 1.0);    // rain-streaked piers & soffits
  const sidewalk = surface('sidewalk', { tile: 2, tint: 0xaab3bd });
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe8b400, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const span = bridgeSpan(net);
  // keep piers off the PA lot and out of its main building (the viaducts span over them)
  const noPier = (x, z) => PA.inLot(x, z, 2) || (() => { const [lx, lz] = PA.toLocal(x, z); return lx > -112 && lx < -84 && Math.abs(lz) < 46; })();
  const geoms = { asphalt: [], asphaltOld: [], concrete: [], concreteOld: [], sidewalk: [], white: [], yellow: [], wallSteel: [], wallClear: [], rail: [] };
  const gapWalls = [];
  // 防音壁 (Shutoko noise barriers): galvanised lower panel + clear acrylic upper panel curving inwards, H-posts every 4 m.
  // Only where an elevated expressway runs over land (not over the sea / on the long bridges).
  const steelPanel = [[0.36, 1.05], [0.36, 2.15], [0.44, 2.15], [0.44, 1.05]];
  const clearPanel = [[0.40, 2.15], [0.40, 3.45], [0.12, 3.85]];
  const wallPosts = [], reflectors = [], railPosts = [];
  const landRuns = (r, runs) => {
    if (!opts.isLand || r.kind === 'ramp' || r.kind === 'local') return [];
    const out = [];
    for (const [a, b] of runs) {
      let s0 = null;
      for (let q = a; q <= b + 0.01; q += 12) {
        const p = r.at(Math.min(q, b)); const ok = p.y > 5 && opts.isLand(p.x, p.z) && !(span && r === span.road && q > span.s0 && q < span.s1);
        if (ok && s0 === null) s0 = q;
        if ((!ok || q + 12 > b) && s0 !== null) { const e = ok ? b : q; if (e - s0 > 40) out.push([s0, e]); s0 = null; }
      }
    }
    return out;
  };
  const jersey = [[0, 0], [0.18, 0.08], [0.25, 0.32], [0.3, 1.05], [0.48, 1.05], [0.5, 0], [0.5, -2.0]]; // inner face → top → outer face → girder
  const pierSpots = [];

  net.roads.forEach((r, ri) => {
    const mountain = r.kind === 'mountain';
    const local = r.kind === 'local' || mountain || r.street; // r.street: ordinary national road (kerbs, pavements, no parapets)
    const deckMat = local ? 'asphaltOld' : 'asphalt';
    // deck surface (tiny y offset per road to avoid z-fighting where decks overlap)
    const yo = 0.0006 * ri; // tiny per-road lift (anti z-fight) — kept small so wheels never sink into a deck
    geoms[deckMat].push(ribbon(r, r.edgeR, r.edgeL, yo, { segs: Math.max(2, Math.round((r.edgeL - r.edgeR) / 4)) }));
    // markings — clipped wherever they would run across another road's carriageway (junctions, merges, intersections),
    // so no other deck can cover or z-fight them. On expressways the clipped part of an edge
    // line becomes the thick dashed merge/diverge line used on Japanese expressways.
    const MKY = yo + 0.02;
    const freeAt = (lat) => { const S = r.samples; const f = new Uint8Array(S.length); for (let i = 0; i < S.length; i++) { const q = S[i]; f[i] = onOtherRoad(net, r, q.p.x + q.left.x * lat, q.p.y, q.p.z + q.left.z * lat, 0.4) ? 0 : 1; } return f; };
    const mk = (lat, w, dashed, mat = 'white', merge = false) => {
      const f = freeAt(lat);
      geoms[mat].push(ribbon(r, lat - w / 2, lat + w / 2, MKY, { dashed, keep: i => f[i] && f[i + 1] }));
      if (merge && !local && f.some(v => !v)) geoms.white.push(ribbon(r, lat - 0.225, lat + 0.225, MKY, { dashed: { period: 6, on: 3, offset: 0 }, keep: i => !f[i] && !f[i + 1] }));
    };
    const dash = local ? { period: 10, on: 5, offset: 0 } : { period: 20, on: 8, offset: 0 };
    if (r.lanesB === 0) {
      for (let i = 1; i < r.lanesF; i++) mk(r.lanes[i].lat - LANE / 2, 0.15, dash);
      mk(r.edgeL - r.shoulder, 0.15, null, 'white', r.kind === 'expressway'); mk(r.edgeR + r.shoulder, 0.15, null, 'white', r.kind === 'expressway');
    } else {
      for (let i = 1; i < r.lanesF; i++) mk(r.median / 2 + i * LANE, 0.15, dash);
      for (let i = 1; i < r.lanesB; i++) mk(-(r.median / 2 + i * LANE), 0.15, dash);
      if (r.median > 0) { mk(r.median / 2, 0.15, null); mk(-r.median / 2, 0.15, null); }
      else mk(0, 0.15, null, local ? 'yellow' : 'white'); // centre line (yellow = no overtaking)
      mk(r.edgeL - r.shoulder, 0.15, null); mk(r.edgeR + r.shoulder, 0.15, null);
    }
    if (!local) {
      // jersey barriers along both edges (gaps wherever the edge runs over another deck: merges / diverges) + girder skirt
      const runL = freeRuns(net, r, r.edgeL + 0.3), runR = freeRuns(net, r, r.edgeR - 0.3);
      for (const [s0, s1] of runL) geoms.concrete.push(sweep(r, jersey, r.edgeL, yo, 1, s0, s1));
      // v2.5.3: twin viaducts side by side (Aqua-Line, Bayshore …) — the slot between the two decks read as a hole in
      // the road; it is closed with a deck slab at road level wherever another carriageway runs within 9 m
      if (r.lanesB === 0 && r.kind !== 'mountain') for (const [side, edge] of [[1, r.edgeL], [-1, r.edgeR]]) {
        const S = r.samples, pos = [], idx = [], midSeg = []; let prev = null, prevMid = null;
        for (let i = 0; i < S.length; i += 3) {
          const q = S[i]; let g = null;
          const hitAt = d => { const l = edge + side * d; return onOtherRoad(net, r, q.p.x + q.left.x * l, q.p.y, q.p.z + q.left.z * l, 0); };
          if (q.p.y > 1.5 && hitAt(9.5)) for (const d of [1.2, 2.2, 3.4, 4.8, 6.4, 8.2]) if (hitAt(d)) { g = d; break; }
          const cur = g ? [q.p.x + q.left.x * (edge - side * 0.4), q.p.y + yo - 0.03, q.p.z + q.left.z * (edge - side * 0.4), q.p.x + q.left.x * (edge + side * (g + 0.6)), q.p.y + yo - 0.03, q.p.z + q.left.z * (edge + side * (g + 0.6))] : null;
          if (prev && cur) { const v = pos.length / 3; pos.push(...prev, ...cur); if (side > 0) idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); else idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
          // a central barrier in the middle of the slot (built once per pair: by the road whose id sorts first) — and a wall
          let mid = null;
          if (g) { const lm = edge + side * (g / 2 + 0.1), mx = q.p.x + q.left.x * lm, mz = q.p.z + q.left.z * lm; const o = net.hits(q.p.x + q.left.x * (edge + side * (g + 0.4)), q.p.z + q.left.z * (edge + side * (g + 0.4))).find(h => h.road !== r && !h.beyond && Math.abs(h.y - q.p.y) < 1.5);
            if (o && r.id < o.road.id) { const to = o.road.dirAt(o.s); if (to.x * q.t.x + to.z * q.t.z < -0.8) mid = [mx, q.p.y + yo, mz]; } } // opposite carriageways only — never across a merge
          if (mid && prevMid) { midSeg.push([prevMid, mid]); }
          prevMid = mid;
          prev = cur;
        }
        if (idx.length) { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); gg.setIndex(idx); gg.computeVertexNormals(); geoms.concrete.push(gg); }
        // the barrier itself: a 0.5 m × 0.9 m concrete wall along the slot centre, plus colliders
        if (midSeg.length) { const bp = [], bi = [];
          for (const [a, b] of midSeg) { const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1, nx = -dz / L * 0.25, nz = dx / L * 0.25, v = bp.length / 3;
            for (const [p, h] of [[a, 0], [b, 0], [a, 0.9], [b, 0.9]]) bp.push(p[0] + nx, p[1] + h, p[2] + nz); for (const [p, h] of [[a, 0], [b, 0], [a, 0.9], [b, 0.9]]) bp.push(p[0] - nx, p[1] + h, p[2] - nz);
            bi.push(v, v + 1, v + 2, v + 1, v + 3, v + 2, v + 4, v + 6, v + 5, v + 5, v + 6, v + 7, v + 2, v + 3, v + 6, v + 3, v + 7, v + 6);
            gapWalls.push({ x: (a[0] + b[0]) / 2, z: (a[2] + b[2]) / 2, hx: 0.3, hz: L / 2 + 0.2, ry: Math.atan2(dx, dz), y0: Math.min(a[1], b[1]) - 1, y1: Math.max(a[1], b[1]) + 1.1 }); }
          const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(bp.length / 3 * 2), 2)); bg.setIndex(bi); bg.computeVertexNormals(); geoms.concrete.push(bg); }
      }
      for (const [s0, s1] of runR) geoms.concrete.push(sweep(r, jersey, r.edgeR, yo, -1, s0, s1));
      for (const [side, edge, runs] of [[1, r.edgeL, runL], [-1, r.edgeR, runR]]) {
        for (const [s0, s1] of landRuns(r, runs)) {
          geoms.wallSteel.push(sweep(r, steelPanel, edge, yo, side, s0, s1));
          geoms.wallClear.push(sweep(r, clearPanel, edge, yo, side, s0, s1));
          for (let q = s0; q <= s1; q += 4) { const p = r.at(q, edge + 0.4 * side); const t = r.dirAt(q); wallPosts.push(p.x, p.y + yo, p.z, Math.atan2(t.x, t.z)); }
        }
        // 視線誘導標 delineators on the parapet every 10 m (white on the left edge, amber on the right/median side)
        for (const [s0, s1] of runs) for (let q = s0 + 5; q < s1; q += 10) { const p = r.at(q, edge + 0.39 * side); const t = r.dirAt(q); reflectors.push(p.x, p.y + yo + 1.12, p.z, Math.atan2(t.x, t.z), side > 0 ? 0 : 1); }
      }
      if (r.median > 0) geoms.concrete.push(sweep(r, [[-0.3, 0], [-0.12, 0.3], [-0.08, 0.9], [0.08, 0.9], [0.12, 0.3], [0.3, 0]], 0, yo, 1));
      // deck underside
      geoms.concreteOld.push(ribbon(r, r.edgeL + 0.5, r.edgeR - 0.5, yo - 2.0, { segs: 2 })); // latA > latB → faces down (soffit)
      // piers
      if (r.elevated) {
        const step = r.kind === 'ramp' ? 28 : 34;
        for (let s = 12; s < r.length; s += step) {
          const p = r.at(s); if (p.y < 5.5) continue; // low decks near the ends of a bridge: the cap sat on the ground as a pale block
          if (span && r === span.road && s > span.s0 && s < span.s1) continue; // cable-stayed Bay Bridge
          const t = r.dirAt(s), cl = (r.edgeL + r.edgeR) / 2, px = p.x + t.z * cl, pz = p.z - t.x * cl;
          if (noPier(px, pz) || opts.noPier?.(px, pz)) continue;
          pierSpots.push({ p, t, w: r.edgeL - r.edgeR, road: r });
        }
      }
    } else {
      // curbs + sidewalks
      if (mountain) {
        // touge: white W-beam guardrails (ガードレール) on posts both sides, delineators on top — no kerbs / pavements
        const rail = [[0.35, 0.55], [0.3, 0.62], [0.35, 0.7], [0.3, 0.78], [0.35, 0.85], [0.42, 0.85], [0.42, 0.55]];
        geoms.rail.push(sweep(r, rail, r.edgeL, yo, 1)); geoms.rail.push(sweep(r, rail, r.edgeR, yo, -1));
        for (const [side, edge] of [[1, r.edgeL], [-1, r.edgeR]]) for (let q = 2; q < r.length; q += 4) { const p = r.at(q, edge + 0.45 * side); const t = r.dirAt(q); railPosts.push(p.x, p.y + yo, p.z, Math.atan2(t.x, t.z)); if (q % 20 < 4) reflectors.push(p.x, p.y + yo + 0.95, p.z, Math.atan2(t.x, t.z), side > 0 ? 0 : 1); }
        return;
      }
      const sw = r.sidewalk || 3;
      const curb = [[0, 0], [0, 0.15], [sw, 0.15], [sw, 0.0]];
      // kerbs + sidewalks, interrupted where another street crosses (intersections) or a ramp joins
      for (const [s0, s1] of freeRuns(net, r, [r.edgeL + 0.3, r.edgeL + sw * 0.5, r.edgeL + sw - 0.2], -0.4)) geoms.sidewalk.push(sweep(r, curb, r.edgeL, yo, 1, s0, s1));
      for (const [s0, s1] of freeRuns(net, r, [r.edgeR - 0.3, r.edgeR - sw * 0.5, r.edgeR - sw + 0.2], -0.4)) geoms.sidewalk.push(sweep(r, curb, r.edgeR, yo, -1, s0, s1));
      if (r.median > 0) for (const [s0, s1] of freeRuns(net, r, 0)) geoms.concrete.push(sweep(r, [[-r.median / 2 + 0.2, 0], [-r.median / 2 + 0.2, 0.18], [r.median / 2 - 0.2, 0.18], [r.median / 2 - 0.2, 0]], 0, yo, 1, s0, s1));
    }
  });
  const wallSteel = surface('metal_galvanized', { tile: 2, tint: 0xb9bec2, metalness: 0.6, roughness: 0.55 }).clone(); wallSteel.side = THREE.DoubleSide;
  const wallClear = new THREE.MeshStandardMaterial({ color: 0xbfd8d6, roughness: 0.08, metalness: 0.1, transparent: true, forceSinglePass: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xe9ebec, roughness: 0.45, metalness: 0.35, side: THREE.DoubleSide });
  const M = { asphalt, asphaltOld, concrete, concreteOld, sidewalk, white, yellow, wallSteel, wallClear, rail: railMat };
  for (const k in geoms) if (geoms[k].length) {
    const mesh = new THREE.Mesh(mergeGeometries(geoms[k]), M[k]);
    mesh.receiveShadow = true; mesh.castShadow = k === 'concrete';
    mesh.name = 'road_' + k;
    group.add(mesh);
  }
  // noise-barrier H-posts + delineators (instanced)
  const inst = (geo, mat, arr, stride, place) => {
    const n = arr.length / stride; if (!n) return;
    const im = new THREE.InstancedMesh(geo, mat, n); const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { place(o, arr, i * stride); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    im.castShadow = mat !== null; group.add(im); return im;
  };
  inst(new THREE.BoxGeometry(0.18, 2.85, 0.14).translate(0, 1.05 + 1.42, 0), new THREE.MeshStandardMaterial({ color: 0x7d8487, metalness: 0.7, roughness: 0.45 }), wallPosts, 4, (o, a, k) => { o.position.set(a[k], a[k + 1], a[k + 2]); o.rotation.set(0, a[k + 3], 0); });
  if (railPosts.length) inst(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 8).translate(0, 0.47, 0), new THREE.MeshStandardMaterial({ color: 0xdfe2e4, metalness: 0.4, roughness: 0.5 }), railPosts, 4, (o, a, k) => { o.position.set(a[k], a[k + 1], a[k + 2]); o.rotation.set(0, a[k + 3], 0); });
  const refl = [0, 1].map(c => new THREE.MeshStandardMaterial({ color: c ? 0xffa21a : 0xf4f4f0, emissive: c ? 0x6a3a00 : 0x3a3a3a, roughness: 0.3 }));
  for (const c of [0, 1]) { const arr = []; for (let k = 0; k < reflectors.length; k += 5) if (reflectors[k + 4] === c) arr.push(reflectors[k], reflectors[k + 1], reflectors[k + 2], reflectors[k + 3]);
    const im = inst(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 10).rotateX(Math.PI / 2), refl[c], arr, 4, (o, a, k) => { o.position.set(a[k], a[k + 1], a[k + 2]); o.rotation.set(0, a[k + 3], 0); });
    if (im) im.castShadow = false; }
  if (opts.isLand) group.add(buildTunnels(net, opts.isLand, opts.tunnelLamps));
  // piers (instanced): column + cap. Every leg footprint is checked against all lower roads/tunnels (incl. kerbs and
  // sidewalks): a leg never stands on a carriageway. If the default layout is blocked, the legs are pushed outwards into a
  // portal frame that straddles the lower roads; if no clear portal exists within reach the pier is dropped (the deck spans).
  const legClear = (x, z, top) => {
    for (const [ox, oz] of [[0, 0], [1.7, 0], [-1.7, 0], [0, 1.7], [0, -1.7], [1.2, 1.2], [-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2]]) {
      for (const h of net.hits(x + ox, z + oz)) {
        if (h.beyond || h.y > top + 1) continue; // own deck (top + 2) / decks above — a road passing just under the deck still blocks the leg
        const m = h.road.kind === 'local' ? (h.road.sidewalk || 3) + 0.6 : 0.9;
        if (h.lat <= h.road.edgeL + m && h.lat >= h.road.edgeR - m) return false;
      }
    }
    return true;
  };
  // the cross-beam must not hang into the traffic envelope of a lower road
  const beamClear = (cx, cz, lx, lz, half, top) => {
    for (let o = -half; o <= half; o += 1.5) {
      for (const h of net.hits(cx + lx * o, cz + lz * o)) {
        if (h.beyond || !h.inside) continue;
        if (h.y < top - 0.2 && h.y > top - 1.4 - 4.1) return false; // 4.1 m clearance (Japanese limit 3.8 m)
      }
    }
    return true;
  };
  const legs = [];
  const caps = [];
  for (const sp of pierSpots) {
    const top = sp.p.y - 2.0;
    const center = (sp.road.edgeL + sp.road.edgeR) / 2;
    const lx = sp.t.z, lz = -sp.t.x; // left vector
    const cx = sp.p.x + lx * center, cz = sp.p.z + lz * center;
    const tries = [];
    if (sp.w <= 14) tries.push({ offs: [0], cap: sp.w * 0.92, thick: 1 });
    tries.push({ offs: [-sp.w * 0.28, sp.w * 0.28], cap: sp.w * 0.92, thick: 1.2 });
    if (sp.p.y > 9) for (let half = sp.w * 0.5 + 0.8; half <= sp.w * 0.5 + 12; half += 1.5) tries.push({ offs: [-half, half], cap: half * 2 + 2.4, thick: 1.25, portal: true });
    const ok = tries.find(tr => tr.offs.every(o => legClear(cx + lx * o, cz + lz * o, top)) && (!tr.portal || beamClear(cx, cz, lx, lz, tr.cap / 2, top + 1.4)));
    if (!ok) continue;
    const capTop = ok.portal ? top + 1.4 : top;
    for (const o of ok.offs) legs.push({ x: cx + lx * o, z: cz + lz * o, top: capTop, thick: ok.thick, t: sp.t });
    caps.push({ x: cx, z: cz, top: capTop, len: ok.cap, t: sp.t, portal: !!ok.portal });
  }
  if (legs.length) {
    const col = new THREE.CylinderGeometry(1.1, 1.3, 1, 20); col.translate(0, 0.5, 0);
    const cap = new THREE.BoxGeometry(1, 1.4, 2.4); cap.translate(0, -0.7, 0);
    const colMesh = new THREE.InstancedMesh(col, concreteOld, legs.length);
    const capMesh = new THREE.InstancedMesh(cap, concreteOld, caps.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    const bottom = -6;
    legs.forEach((l, i) => {
      q.setFromAxisAngle(Y, Math.atan2(l.t.x, l.t.z));
      pos.set(l.x, bottom, l.z); sc.set(l.thick, l.top - bottom - 1.4, l.thick);
      m4.compose(pos, q, sc); colMesh.setMatrixAt(i, m4);
    });
    caps.forEach((c, i) => {
      q.setFromAxisAngle(Y, Math.atan2(c.t.x, c.t.z));
      pos.set(c.x, c.top, c.z); sc.set(c.len, 1, c.portal ? 1.15 : 1);
      m4.compose(pos, q, sc); capMesh.setMatrixAt(i, m4);
    });
    colMesh.castShadow = capMesh.castShadow = true; colMesh.receiveShadow = capMesh.receiveShadow = true;
    colMesh.name = 'piers'; capMesh.name = 'pier_caps';
    group.add(colMesh, capMesh);
    group.userData.piers = legs; // for collision
    group.userData.gapWalls = gapWalls;
    group.userData.pierStats = { spots: pierSpots.length, placed: caps.length };
  }
  return group;
}

// Lamp positions along roads (for street lights): returns [{pos, dir(left vec), road}]
export function lampSpots(net) {
  const out = []; const span = bridgeSpan(net);
  for (const r of net.roads) {
    if (r.kind === 'mountain') continue; // touge roads are unlit
    const step = r.kind === 'local' ? 36 : 42;
    for (let s = 10; s < r.length - 5; s += step) {
      if (span && r === span.road && s > span.s0 + 150 && s < span.s1 - 150) continue; // the bridge has its own lights
      const p = r.at(s); const t = r.dirAt(s);
      if (p.y < -0.3) continue; // tunnels have their own ceiling lights
      if (r.kind === 'local' && PA.inLot(p.x, p.z, 6)) continue;
      const left = new THREE.Vector3(t.z, 0, -t.x);
      const coverY = (x, z) => { let y = Infinity; for (const h of net.hits(x, z)) if (h.road !== r && !h.beyond && h.lat <= h.road.edgeL + 1.5 && h.lat >= h.road.edgeR - 1.5 && h.y > p.y + 0.8 && h.y < p.y + 13) y = Math.min(y, h.y); return y; };
      const side0 = r.kind === 'local' ? r.edgeL + 0.8 : r.edgeL + 0.2;
      const cy = Math.min(coverY(p.x, p.z), coverY(p.x + left.x * side0, p.z + left.z * side0));
      if (cy < Infinity) { // another deck overhead: soffit-mounted luminaire instead of a pole (it would pierce the deck)
        if (cy - 2.0 - p.y > 4.2) out.push({ pos: p.clone(), arms: [], h: cy - 2.15 - p.y, road: r, ceiling: true, t });
        continue;
      }
      // a pole never stands on any carriageway (other roads, merging ramps, intersections, sidewalks of crossing streets)
      const blocked = (x, z, own = true) => { for (const h of net.hits(x, z)) { if (h.beyond || Math.abs(h.y - p.y) > 3 || (!own && h.road === r)) continue; const pad = h.road.kind === 'local' ? (h.road.sidewalk || 3) * 0.5 : 0.9; if (h.road === r ? (h.lat < h.road.edgeL - 0.05 && h.lat > h.road.edgeR + 0.05) : (h.lat <= h.road.edgeL + pad && h.lat >= h.road.edgeR - pad)) return true; } return false; };
      if (r.kind === 'expressway' && r.median > 0) { if (!blocked(p.x, p.z, false)) out.push({ pos: p.clone(), arms: [left.clone(), left.clone().negate()], h: 10, road: r, median: true }); continue; }
      let placed = false;
      for (const sgn of [1, -1]) {
        const side = sgn > 0 ? (r.kind === 'local' ? r.edgeL + 0.8 : r.edgeL + 0.2) : (r.kind === 'local' ? r.edgeR - 0.8 : r.edgeR - 0.2);
        const q = p.clone().addScaledVector(left, side);
        if (blocked(q.x, q.z)) continue;
        out.push({ pos: q, arms: [sgn > 0 ? left.clone().negate() : left.clone()], h: r.kind === 'local' ? 8 : 10, road: r }); placed = true; break;
      }
      if (!placed) continue;
    }
  }
  return out;
}
