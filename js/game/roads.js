// Road network of Daikoku JCT / PA / Daikoku-futō, its geometry, and the surface query used by physics & AI.
// World axes: +X east, +Z south, +Y up, metres. Origin = Daikoku PA (lat 35.4615, lon 139.6800). Left-hand traffic (Japan).
// Alignments come from OpenStreetMap via tools/osm-import.mjs → data/map-daikoku.js
// (Map data © OpenStreetMap contributors, ODbL 1.0 — https://www.openstreetmap.org/copyright).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { surface } from './textures.js';
import { MAP } from '../../data/map-daikoku.js';

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
export const ROAD_DEFS = [...MAP.roads, ...umihotaruRamps()];

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
function fixFlatRamps(defs) {
  const dyNear = (self, x, z, y) => { let b = null; for (const o of defs) { if (o === self) continue; for (const q of o.pts) { if (Math.hypot(q[0] - x, q[2] - z) > 12) continue; const dy = q[1] - y; if (b === null || Math.abs(dy) < Math.abs(b)) b = dy; } } return b ?? 0; };
  const sm = t => t * t * (3 - 2 * t), BL = 260;
  return defs.map(d => {
    if (d.kind !== 'ramp') return d;
    const a = d.pts[0], e = d.pts[d.pts.length - 1];
    const o0 = dyNear(d, a[0], a[2], a[1]), o1 = dyNear(d, e[0], e[2], e[1]);
    if (Math.abs(o0) < 4 && Math.abs(o1) < 4) return d;
    let L = 0; const acc = d.pts.map((p, i) => (L += i ? Math.hypot(p[0] - d.pts[i - 1][0], p[2] - d.pts[i - 1][2]) : 0));
    return { ...d, pts: d.pts.map((p, i) => [p[0], p[1] + (Math.abs(o0) >= 4 ? o0 * (1 - sm(Math.min(1, acc[i] / BL))) : 0) + (Math.abs(o1) >= 4 ? o1 * (1 - sm(Math.min(1, (L - acc[i]) / BL))) : 0), p[2]]) };
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
export class RoadNet {
  constructor(defs = ROAD_DEFS) {
    // drop degenerate polylines from the OSM import (zero-length ways would put signs/lamps on one point of another road)
    const plen = d => d.pts.reduce((a, q, i) => i ? a + Math.hypot(q[0] - d.pts[i - 1][0], q[2] - d.pts[i - 1][2]) : 0, 0);
    this.roads = fixFlatRamps(joinLocalEnds(defs.filter(d => d.pts?.length > 1 && plen(d) > 8))).map((d, i) => new Road(d, i));
    this.byId = Object.fromEntries(this.roads.map(r => [r.id, r]));
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
    this.findJunctions();
    this.flushJoins();
  }
  // Where a ramp leaves / joins a road, the part of it lying on the parent deck must have the parent's height, then blend
  // smoothly into its own profile — otherwise the ramp floats 1–2 m over the main lanes (a step for car and eye).
  flushJoins() {
    const pairs = [];
    for (const [parent, l] of this.diverges) for (const d of l) pairs.push([d.to, parent, 0]);
    for (const [child, d] of this.links) pairs.push([child, d.to, 1]);
    for (const [r, parent, atEnd] of pairs) {
      if (r.kind === 'local' || r === parent) continue;
      const S = r.samples, n = S.length, idx = i => atEnd ? n - 1 - i : i;
      const pY = (p) => { let y = null; for (const h of this.hits(p.x, p.z)) if (h.road === parent && !h.beyond && h.lat <= parent.edgeL + 0.5 && h.lat >= parent.edgeR - 0.5 && Math.abs(h.y - p.y) < 4) y = h.y; return y; };
      let k = 0, lastOff = 0; const BL = 30;
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
    if (best && (best.y >= gy - 0.05 || best.y < -0.5)) return { y: best.y, hit: best, road: best.road, onRoad: true }; // below ground = tunnel / trench
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
function buildTunnels(net, isLand, lampOut) {
  const pos = [], idx = [], lamps = [];
  const quad = (a, b, c, d) => { const v = pos.length / 3; pos.push(...a, ...b, ...c, ...d); idx.push(v, v + 1, v + 2, v, v + 2, v + 3); };
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
        for (const lat of [L, R]) quad(P(a, lat, a.p.y - 0.3), P(b, lat, b.p.y - 0.3), P(b, lat, Math.max(tb, b.p.y + 1)), P(a, lat, Math.max(ta, a.p.y + 1)));
        if (ca && cb) {
          quad(P(a, L, ta), P(b, L, tb), P(b, R, tb), P(a, R, ta));                 // ceiling
          if (!isLand(a.p.x, a.p.z)) quad(P(a, L - 0.6, ta + 1.2), P(b, L - 0.6, tb + 1.2), P(b, R + 0.6, tb + 1.2), P(a, R + 0.6, ta + 1.2)); // roof of the immersed box
        }
        if (ca !== cb) { const q = ca ? a : b, t = q.p.y + TUN_H; if (t < 0.45) quad(P(q, L + 0.6, t), P(q, R - 0.6, t), P(q, R - 0.6, 1.2), P(q, L + 0.6, 1.2)); } // portal headwall
        if (ca && (Math.floor(a.s / 9) !== Math.floor(b.s / 9))) { lamps.push(P(a, L - 1.0, a.p.y + TUN_H - 0.35), P(a, R + 1.0, a.p.y + TUN_H - 0.35)); if (Math.floor(a.s / 36) !== Math.floor(b.s / 36)) lampOut?.push(new THREE.Vector3(...P(a, 0, a.p.y + TUN_H - 1.0))); }
      }
    }
  }
  const g = new THREE.Group(); g.name = 'tunnels';
  if (!pos.length) return g;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const uv = new Float32Array(pos.length / 3 * 2); for (let i = 0; i < pos.length / 3; i++) { uv[i * 2] = (pos[i * 3] + pos[i * 3 + 2]) * 0.25; uv[i * 2 + 1] = pos[i * 3 + 1] * 0.25; } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
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
  const concrete = surface('concrete', { tile: 3 });
  const concreteOld = surface('pier', { tile: 4 });
  const sidewalk = surface('sidewalk', { tile: 2 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe8b400, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const span = bridgeSpan(net);
  // keep piers off the PA lot and out of its main building (the viaducts span over them)
  const noPier = (x, z) => PA.inLot(x, z, 2) || (() => { const [lx, lz] = PA.toLocal(x, z); return lx > -112 && lx < -84 && Math.abs(lz) < 46; })();
  const geoms = { asphalt: [], asphaltOld: [], concrete: [], concreteOld: [], sidewalk: [], white: [], yellow: [] };
  const jersey = [[0, 0], [0.18, 0.08], [0.25, 0.32], [0.3, 1.05], [0.48, 1.05], [0.5, 0], [0.5, -2.0]]; // inner face → top → outer face → girder
  const pierSpots = [];

  net.roads.forEach((r, ri) => {
    const local = r.kind === 'local';
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
      for (const [s0, s1] of freeRuns(net, r, r.edgeL + 0.3)) geoms.concrete.push(sweep(r, jersey, r.edgeL, yo, 1, s0, s1));
      for (const [s0, s1] of freeRuns(net, r, r.edgeR - 0.3)) geoms.concrete.push(sweep(r, jersey, r.edgeR, yo, -1, s0, s1));
      if (r.median > 0) geoms.concrete.push(sweep(r, [[-0.3, 0], [-0.12, 0.3], [-0.08, 0.9], [0.08, 0.9], [0.12, 0.3], [0.3, 0]], 0, yo, 1));
      // deck underside
      geoms.concreteOld.push(ribbon(r, r.edgeL + 0.5, r.edgeR - 0.5, yo - 2.0, { segs: 2 })); // latA > latB → faces down (soffit)
      // piers
      if (r.elevated) {
        const step = r.kind === 'ramp' ? 28 : 34;
        for (let s = 12; s < r.length; s += step) {
          const p = r.at(s); if (p.y < 4) continue;
          if (span && r === span.road && s > span.s0 && s < span.s1) continue; // cable-stayed Bay Bridge
          const t = r.dirAt(s), cl = (r.edgeL + r.edgeR) / 2, px = p.x + t.z * cl, pz = p.z - t.x * cl;
          if (noPier(px, pz) || opts.noPier?.(px, pz)) continue;
          pierSpots.push({ p, t, w: r.edgeL - r.edgeR, road: r });
        }
      }
    } else {
      // curbs + sidewalks
      const sw = r.sidewalk || 3;
      const curb = [[0, 0], [0, 0.15], [sw, 0.15], [sw, 0.0]];
      // kerbs + sidewalks, interrupted where another street crosses (intersections) or a ramp joins
      for (const [s0, s1] of freeRuns(net, r, [r.edgeL + 0.3, r.edgeL + sw * 0.5, r.edgeL + sw - 0.2], -0.4)) geoms.sidewalk.push(sweep(r, curb, r.edgeL, yo, 1, s0, s1));
      for (const [s0, s1] of freeRuns(net, r, [r.edgeR - 0.3, r.edgeR - sw * 0.5, r.edgeR - sw + 0.2], -0.4)) geoms.sidewalk.push(sweep(r, curb, r.edgeR, yo, -1, s0, s1));
      if (r.median > 0) for (const [s0, s1] of freeRuns(net, r, 0)) geoms.concrete.push(sweep(r, [[-r.median / 2 + 0.2, 0], [-r.median / 2 + 0.2, 0.18], [r.median / 2 - 0.2, 0.18], [r.median / 2 - 0.2, 0]], 0, yo, 1, s0, s1));
    }
  });
  const M = { asphalt, asphaltOld, concrete, concreteOld, sidewalk, white, yellow };
  for (const k in geoms) if (geoms[k].length) {
    const mesh = new THREE.Mesh(mergeGeometries(geoms[k]), M[k]);
    mesh.receiveShadow = true; mesh.castShadow = k === 'concrete';
    mesh.name = 'road_' + k;
    group.add(mesh);
  }
  if (opts.isLand) group.add(buildTunnels(net, opts.isLand, opts.tunnelLamps));
  // piers (instanced): column + cap. Every leg footprint is checked against all lower roads/tunnels (incl. kerbs and
  // sidewalks): a leg never stands on a carriageway. If the default layout is blocked, the legs are pushed outwards into a
  // portal frame that straddles the lower roads; if no clear portal exists within reach the pier is dropped (the deck spans).
  const legClear = (x, z, top) => {
    for (const [ox, oz] of [[0, 0], [1.7, 0], [-1.7, 0], [0, 1.7], [0, -1.7], [1.2, 1.2], [-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2]]) {
      for (const h of net.hits(x + ox, z + oz)) {
        if (h.beyond || h.y > top - 2.5) continue; // own deck / decks above
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
    for (let half = sp.w * 0.5 + 0.8; half <= sp.w * 0.5 + 26; half += 1.5) tries.push({ offs: [-half, half], cap: half * 2 + 2.4, thick: 1.25, portal: true });
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
    group.userData.pierStats = { spots: pierSpots.length, placed: caps.length };
  }
  return group;
}

// Lamp positions along roads (for street lights): returns [{pos, dir(left vec), road}]
export function lampSpots(net) {
  const out = []; const span = bridgeSpan(net);
  for (const r of net.roads) {
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
