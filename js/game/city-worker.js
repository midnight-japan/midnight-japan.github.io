// City tile builder (module Web Worker). Turns one data/city/<i>_<j>.json tile (real OpenStreetMap features) into
// typed-array geometry for js/game/city.js — Japanese houses with tiled gable/hip roofs, mansions with balconies and
// open corridors, offices, shop streets with awnings and signs, konbini, factories, tanks, streets with paint,
// sidewalks, utility poles and wires, traffic signals, street lamps, vending machines, rail and Shuto viaducts.
// Coordinates are local to the tile corner (metres); the main thread positions the meshes.
// Nothing here touches the DOM, so the city streams in without hitching the game loop.
import { ShapeUtils, Vector2 } from '../../vendor/three/three.core.js';

// ── classes: keep in sync with tools/osm-city-build.mjs ──
const B = { HOUSE: 0, APT: 1, COM: 2, IND: 3, SCHOOL: 4, TEMPLE: 5, TOWER: 6, SMALL: 7, TANK: 8, STATION: 9, HOSP: 10, HOTEL: 11, KONBINI: 12, PARKING: 13, OFFICE: 14, WAREHOUSE: 15, GAS: 16, BRICK: 17 };
const S = { TRUNK: 0, PRIMARY: 1, SECONDARY: 2, TERTIARY: 3, MINOR: 4, SERVICE: 5, PED: 6 };
const L = { GREEN: 0, IND: 1, SCHOOL: 2, WATER: 3, PARKING: 4, COM: 5, RES: 6, RAIL: 7, PORT: 8, BEACH: 9, WOOD: 10, PITCH: 11 };
const PT = { KONBINI: 0, VEND: 1, SIGNAL: 2, LAMP: 3, BUS: 4, FUEL: 5, POLICE: 6, POST: 7, FOOD: 8, CAFE: 9, BAR: 10, SHRINE: 11, STATION: 12, CROSS: 13, LEVEL_X: 14, CHIMNEY: 15, CRANE: 16, BANK: 17, PHARM: 18, HOTEL: 19, CARSHOP: 20, TOILET: 21, TOWER: 22, SUPER: 23 };
// shader "kind" for plain (window-less) surfaces of the building material
const PLAIN = 30, ROOFTILE = 31, GLASSWALL = 32, SHOPFRONT = 33, KONBINI_FRONT = 34, METALWALL = 35;

let RND = 1;
const rnd = () => (RND = (RND * 16807) % 2147483647) / 2147483647;
const hash2 = (a, b) => { let x = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263); x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

// ── growable typed buffers ──
class Buf {
  constructor(stride) { this.stride = stride; this.a = new Float32Array(4096 * stride); this.n = 0; }
  push(...v) { if ((this.n + 1) * this.stride > this.a.length) { const b = new Float32Array(this.a.length * 2); b.set(this.a); this.a = b; } this.a.set(v, this.n * this.stride); this.n++; }
  out() { return this.a.slice(0, this.n * this.stride); }
}
// mesh accumulator: position(3) normal(3) uv(2) color(3) info(4)  — info = (kind, seed, floorH, extra)
class Mesh {
  constructor() { this.v = new Buf(15); }
  vert(p, n, u, v, c, info) { this.v.push(p[0], p[1], p[2], n[0], n[1], n[2], u, v, c[0], c[1], c[2], info[0], info[1], info[2], info[3]); }
  // triangle with a guaranteed facing (vertices are swapped so the geometric normal points along n)
  tri(a, b, c, n, ua, ub, uc, col, info) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
    if (gx * n[0] + gy * n[1] + gz * n[2] < 0) { [b, c] = [c, b]; [ub, uc] = [uc, ub]; }
    this.vert(a, n, ua[0], ua[1], col, info); this.vert(b, n, ub[0], ub[1], col, info); this.vert(c, n, uc[0], uc[1], col, info);
  }
  quad(a, b, c, d, n, ua, ub, uc, ud, col, info) { this.tri(a, b, c, n, ua, ub, uc, col, info); this.tri(a, c, d, n, ua, uc, ud, col, info); }
  // axis-free box: centre (x,y,z), half sizes along local axes (t = along, n = across), yaw from t
  box(cx, cy, cz, tx, tz, hl, hw, hh, col, info, faces = 63) {
    const nx = -tz, nz = tx; // left-hand normal
    const P = (a, b, c) => [cx + tx * a + nx * b, cy + c, cz + tz * a + nz * b];
    const F = [
      [[hl, -hw, -hh], [hl, hw, -hh], [hl, hw, hh], [hl, -hw, hh], [tx, 0, tz], 2 * hw, 2 * hh],
      [[-hl, hw, -hh], [-hl, -hw, -hh], [-hl, -hw, hh], [-hl, hw, hh], [-tx, 0, -tz], 2 * hw, 2 * hh],
      [[-hl, hw, -hh], [hl, hw, -hh], [hl, hw, hh], [-hl, hw, hh], [nx, 0, nz], 2 * hl, 2 * hh],
      [[hl, -hw, -hh], [-hl, -hw, -hh], [-hl, -hw, hh], [hl, -hw, hh], [-nx, 0, -nz], 2 * hl, 2 * hh],
      [[-hl, -hw, hh], [hl, -hw, hh], [hl, hw, hh], [-hl, hw, hh], [0, 1, 0], 2 * hl, 2 * hw],
      [[-hl, hw, -hh], [hl, hw, -hh], [hl, -hw, -hh], [-hl, -hw, -hh], [0, -1, 0], 2 * hl, 2 * hw],
    ];
    F.forEach(([a, b, c, d, n, U, V], i) => { if (!(faces & (1 << i))) return; this.quad(P(...a), P(...b), P(...c), P(...d), n, [0, 0], [U, 0], [U, V], [0, V], col, info); });
  }
  // vertical prism (n-gon) e.g. tanks, poles
  cyl(cx, cz, y0, y1, r, seg, col, info, cap = true, r1 = r) {
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2;
      const n = [Math.cos(am), 0, Math.sin(am)];
      const p0 = [cx + Math.cos(a0) * r, y0, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, y0, cz + Math.sin(a1) * r];
      const q0 = [cx + Math.cos(a0) * r1, y1, cz + Math.sin(a0) * r1], q1 = [cx + Math.cos(a1) * r1, y1, cz + Math.sin(a1) * r1];
      const u0 = a0 * r, u1 = a1 * r;
      this.quad(p0, p1, q1, q0, n, [u0, y0], [u1, y0], [u1, y1], [u0, y1], col, info);
      if (cap) this.tri([cx, y1, cz], q0, q1, [0, 1, 0], [cx, cz], [q0[0], q0[2]], [q1[0], q1[2]], col, info);
    }
  }
  out() { return this.v.out(); }
}
// routes geometry into 250 m sub-cells of the tile (near LOD) so the renderer can cull camera + shadow passes finely
class Router {
  constructor(split) { this.n = split ? 4 : 1; this.m = Array.from({ length: this.n * this.n }, () => new Mesh()); this.c = 0; }
  at(x, z) { if (this.n > 1) { const i = Math.max(0, Math.min(3, Math.floor(x / 250))), j = Math.max(0, Math.min(3, Math.floor(z / 250))); this.c = j * 4 + i; } return this; }
  vert(...a) { this.m[this.c].vert(...a); } tri(...a) { this.m[this.c].tri(...a); } quad(...a) { this.m[this.c].quad(...a); }
  box(...a) { this.m[this.c].box(...a); } cyl(...a) { this.m[this.c].cyl(...a); }
  out() { return this.m.map(m => m.out()); }
}
// simple mesh for paint / ground: position(3) uv(2) color(3)
class Flat {
  constructor() { this.v = new Buf(8); }
  tri(a, b, c, col, uv) { // always facing up
    const cr = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
    if (cr > 0) [b, c] = [c, b];
    for (const p of [a, b, c]) this.v.push(p[0], p[1], p[2], uv ? uv(p)[0] : p[0], uv ? uv(p)[1] : p[2], col[0], col[1], col[2]);
  }
  quad(a, b, c, d, col, uv) { this.tri(a, b, c, col, uv); this.tri(a, c, d, col, uv); }
  out() { return this.v.out(); }
}

const hex = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// facade palettes (Japanese streets: off-white tiles, beige, grey siding, brown brick tile, pastel mansions)
const PAL = {
  house: [0xd8d1c2, 0xc9c1b0, 0xb9b2a4, 0xa9a397, 0xdcd8cf, 0xc4b498, 0xb09d82, 0x8a7f73, 0xc5c9cb, 0x99a1a5, 0x7c6e61, 0xe2dccb, 0xb7a88f, 0x6f6a66, 0xa8927a, 0xd4c7b0].map(hex),
  apt: [0xd6d0c4, 0xc8c2b6, 0xbfb5a3, 0xa8957c, 0x957e65, 0xd4cec0, 0xb8b9b6, 0xaaa69d, 0x8b7561, 0xc9bda7, 0xe0dbd2, 0x7f7a74, 0xb49c80].map(hex),
  com: [0xd8d8d4, 0xc6c5c0, 0xb5b3ad, 0xe2ddd2, 0x9ea3a8, 0x7f858c, 0xd0c6b4, 0xbdb6a9].map(hex),
  office: [0x8d9399, 0x9aa3ab, 0xb6bcc1, 0x6f7880, 0xc4c6c4, 0xa4a8a6, 0x5d6870].map(hex),
  ind: [0xc9ccca, 0xb7bdc0, 0xd8dbd6, 0x9fa9ae, 0x7d9aa8, 0xa8b7a0, 0xc2b79a, 0x8c9da6].map(hex),
  roofTile: [0x3a3e44, 0x2f3238, 0x4a4f57, 0x5b4a3e, 0x6b3f2e, 0x2e3a4a, 0x4d5560, 0x3d3532, 0x6a6d70].map(hex),
  roofFlat: [0x8f9192, 0x7d8080, 0x9c9a95, 0x6f7377, 0xa5a7a6].map(hex),
};
const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];

// ── geometry helpers ──
const ringArea = P => { let A = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) A += (P[j][0] - P[i][0]) * (P[j][1] + P[i][1]); return A / 2; };
function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function obb(pts) {
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]; const Ln = Math.hypot(b[0] - a[0], b[1] - a[1]); if (Ln < 0.3) continue;
    const ux = (b[0] - a[0]) / Ln, uz = (b[1] - a[1]) / Ln;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of pts) { const u = p[0] * ux + p[1] * uz, v = -p[0] * uz + p[1] * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0) * (v1 - v0);
    if (!best || A < best.A) { const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2; best = { A, x: cu * ux - cv * uz, z: cu * uz + cv * ux, hl: (u1 - u0) / 2, hw: (v1 - v0) / 2, tx: ux, tz: uz }; }
  }
  if (best && best.hw > best.hl) { const { tx, tz } = best; best = { ...best, hl: best.hw, hw: best.hl, tx: -tz, tz: tx }; } // t = long axis
  return best;
}
function triangulate(pts) {
  try { return ShapeUtils.triangulateShape(pts.map(p => new Vector2(p[0], p[1])), []); } catch { return []; }
}

// ── street segment grid (for "which facade faces a street", pole/lamp spacing, signals) ──
class SegGrid {
  constructor() { this.g = new Map(); this.c = 20; }
  add(s) { const c = this.c; const x0 = Math.floor(Math.min(s.ax, s.bx) / c) - 1, x1 = Math.floor(Math.max(s.ax, s.bx) / c) + 1, z0 = Math.floor(Math.min(s.az, s.bz) / c) - 1, z1 = Math.floor(Math.max(s.az, s.bz) / c) + 1; for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = i * 4099 + j; let a = this.g.get(k); if (!a) this.g.set(k, a = []); a.push(s); } }
  near(x, z) { return this.g.get(Math.floor(x / this.c) * 4099 + Math.floor(z / this.c)) || []; }
  dist(x, z, filter) { let best = null; for (const s of this.near(x, z)) { if (filter && !filter(s)) continue; const dx = s.bx - s.ax, dz = s.bz - s.az; const L2 = dx * dx + dz * dz || 1e-9; const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / L2)); const px = s.ax + dx * t, pz = s.az + dz * t; const d = Math.hypot(x - px, z - pz); if (!best || d < best.d) best = { d, s, t, px, pz }; } return best; }
}

// ── coastline land rings (sent once by the main thread) → per-tile clipped ground ──
let LAND = [];
function clipRect(pts, x0, z0, x1, z1) {
  let out = pts;
  const E = [[p => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]], [p => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [p => p[1] >= z0, (a, b) => [a[0] + (b[0] - a[0]) * (z0 - a[1]) / (b[1] - a[1]), z0]], [p => p[1] <= z1, (a, b) => [a[0] + (b[0] - a[0]) * (z1 - a[1]) / (b[1] - a[1]), z1]]];
  for (const [inside, cut] of E) { const inp = out; out = []; if (!inp.length) break; for (let i = 0; i < inp.length; i++) { const a = inp[i], b = inp[(i + 1) % inp.length]; if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); } else if (inside(a)) out.push(cut(a, b)); } }
  return out;
}

// ─────────────────────────────────────────────── tile build ───────────────────────────────────────────────
function buildTile(T, lod, opts) {
  RND = 1 + ((T.i * 7919 + T.j * 104729) >>> 0) % 2147483646;
  const D = 0.1;
  const split = lod === 0;
  const bm = new Router(split);  // buildings + viaducts (city material, windows by shader)
  const pm = new Router(split);  // props (poles, lamps, rails, signals, machines) — plain lit material
  const gm = new Router(split);  // glowing props (lamp heads, signal lamps, vending fronts, sign boxes) — info.x = signal slot
  const sg = new Router(split);  // shop signs (atlas UV)
  const C = (x, z) => { bm.at(x, z); pm.at(x, z); gm.at(x, z); sg.at(x, z); };
  const road = new Flat(), walk = new Flat(), paint = new Flat();
  const ground = {};             // land use class → Flat
  const wires = new Buf(3);
  const trees = new Buf(5);      // x, z, scale, rot, variant
  const cols = [];               // [x, z, hx, hz, ry, y0, y1]
  const lamps = [];              // [x, y, z]
  const water = [];              // polygons (local metres)
  const sigs = [];               // traffic signals: x, z, phase (s)
  const bridges = [];            // [ax, az, bx, bz, halfWidth]
  const near = lod === 0, mid = lod <= 1;
  const signN = opts.signs || 64;
  // ground: coastline land clipped to this tile (the big coast rings don't triangulate reliably in one piece)
  const landF = new Flat();
  const OX = T.i * 1000, OZ = T.j * 1000;
  for (const L0 of LAND) {
    if (L0.x1 < OX || L0.x0 > OX + 1000 || L0.z1 < OZ || L0.z0 > OZ + 1000) continue;
    const c = clipRect(L0.pts, OX, OZ, OX + 1000, OZ + 1000); if (c.length < 3) continue;
    const loc = c.map(([x, z]) => [x - OX, z - OZ]);
    for (const [i0, i1, i2] of triangulate(loc)) landF.tri([loc[i0][0], -0.008, loc[i0][1]], [loc[i1][0], -0.008, loc[i1][1]], [loc[i2][0], -0.008, loc[i2][1]], [1, 1, 1]);
  }

  // ── streets ──
  const segs = new SegGrid();
  const junc = []; for (let k = 0; k < (T.x || []).length; k += 2) junc.push([T.x[k] * D, T.x[k + 1] * D]);
  const jGrid = new Map(); for (const p of junc) { const k = Math.floor(p[0] / 25) * 4099 + Math.floor(p[1] / 25); (jGrid.get(k) || jGrid.set(k, []).get(k)).push(p); }
  const nearJunction = (x, z, r) => { for (let i = Math.floor((x - r) / 25); i <= Math.floor((x + r) / 25); i++) for (let j = Math.floor((z - r) / 25); j <= Math.floor((z + r) / 25); j++) for (const p of jGrid.get(i * 4099 + j) || []) if (Math.hypot(p[0] - x, p[1] - z) < r) return true; return false; };
  const streets = (T.s || []).map(a => { const pts = []; for (let k = 3; k < a.length; k += 2) pts.push([a[k] * D, a[k + 1] * D]); return { cls: a[0], w: a[1] * D, flags: a[2], pts }; });
  for (const st of streets) for (let k = 0; k < st.pts.length - 1; k++) { const [ax, az] = st.pts[k], [bx, bz] = st.pts[k + 1]; segs.add({ ax, az, bx, bz, w: st.w, cls: st.cls, st }); if (st.flags & 1) bridges.push([ax, az, bx, bz, st.w / 2 + 0.5]); }

  const asphaltCol = c => c <= S.PRIMARY ? [0.5, 0.5, 0.52] : c <= S.TERTIARY ? [0.55, 0.55, 0.56] : c === S.PED ? [0.95, 0.9, 0.85] : [0.6, 0.6, 0.6];
  const WHITE = [0.92, 0.92, 0.9], YEL = [0.95, 0.68, 0.12];
  for (const st of streets) {
    if (st.flags & 16) continue; // ghost: a driveable expressway at street level (only keeps trees / props off it)
    const { pts, w, cls } = st; const hw = w / 2;
    const y = 0.035 + (6 - cls) * 0.003;
    const swW = (st.flags & 8) && cls <= S.TERTIARY ? (cls <= S.PRIMARY ? 3.5 : 2.5) : 0;
    // grey interlocking blocks as on most Japanese pavements; some streets (shopping streets, station approaches) get the
    // brown-red colour blocks — chosen per street from its position so it never flickers between rebuilds
    const h0 = Math.abs(Math.sin(pts[0][0] * 12.9898 + pts[0][1] * 78.233) * 43758.5453) % 1; const wc = h0 < 0.2 ? [1.08, 0.8, 0.7] : h0 < 0.3 ? [0.92, 0.95, 0.98] : [1, 1, 1];
    // per-vertex offsets (miter, clamped)
    const N = pts.map((p, k) => {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const L0 = Math.hypot(tx, tz) || 1; tx /= L0; tz /= L0;
      let m = 1;
      if (k > 0 && k < pts.length - 1) { const t1x = p[0] - a[0], t1z = p[1] - a[1], l1 = Math.hypot(t1x, t1z) || 1; const nx1 = -t1z / l1, nz1 = t1x / l1; const d = nx1 * -tz + nz1 * tx; m = 1 / Math.max(0.5, d); }
      return [-tz * m, tx * m];
    });
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], na = N[k], nb = N[k + 1];
      const A = (p, n, o, yy) => [p[0] + n[0] * o, yy, p[1] + n[1] * o];
      road.quad(A(a, na, hw, y), A(b, nb, hw, y), A(b, nb, -hw, y), A(a, na, -hw, y), asphaltCol(cls));
      if (swW && mid) for (const sd of [1, -1]) walk.quad(A(a, na, sd * hw, 0.03), A(b, nb, sd * hw, 0.03), A(b, nb, sd * (hw + swW), 0.03), A(a, na, sd * (hw + swW), 0.03), wc);
    }
    if (!mid) continue;
    // lane paint: centre line + edge lines (cut at junctions)
    const L = []; let acc = 0; for (let k = 0; k < pts.length - 1; k++) { const l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); L.push([acc, l]); acc += l; }
    const at = (s, off) => { let k = 0; while (k < L.length - 1 && s > L[k][0] + L[k][1]) k++; const [s0, l] = L[k]; const t = l ? (s - s0) / l : 0; const a = pts[k], b = pts[k + 1]; const tx = (b[0] - a[0]) / (l || 1), tz = (b[1] - a[1]) / (l || 1); return [a[0] + (b[0] - a[0]) * t - tz * off, a[1] + (b[1] - a[1]) * t + tx * off, tx, tz]; };
    const line = (off, wid, dash, gap, col) => {
      for (let s = 0; s < acc; s += dash + gap) {
        const s1 = Math.min(acc, s + dash); if (s1 - s < 0.5) continue;
        const p = at(s, off), q2 = at(s1, off);
        if (nearJunction(p[0], p[1], hw + 3) || nearJunction(q2[0], q2[1], hw + 3)) continue;
        const nx = -p[3] * wid / 2, nz = p[2] * wid / 2, mx = -q2[3] * wid / 2, mz = q2[2] * wid / 2;
        paint.quad([p[0] + nx, y + 0.012, p[1] + nz], [q2[0] + mx, y + 0.012, q2[1] + mz], [q2[0] - mx, y + 0.012, q2[1] - mz], [p[0] - nx, y + 0.012, p[1] - nz], col);
      }
    };
    if (cls <= S.TERTIARY || (cls === S.MINOR && w >= 5.5)) {
      if (!(st.flags & 2)) {
        if (cls <= S.SECONDARY) { line(0.12, 0.15, 1e9, 0, cls <= S.PRIMARY ? YEL : WHITE); line(-0.12, 0.15, 1e9, 0, cls <= S.PRIMARY ? YEL : WHITE); }
        else line(0, 0.15, cls === S.MINOR ? 5 : 6, cls === S.MINOR ? 5 : 9, WHITE);
      }
      if (w >= 9) { // lane dividers
        const per = Math.max(1, Math.round((w - 1) / 2 / 3.25));
        for (let ln = 1; ln < per; ln++) for (const sd of [1, -1]) line(sd * ln * (hw - 0.5) / per, 0.15, 5, 7, WHITE);
      }
      line(hw - 0.35, 0.15, 1e9, 0, WHITE); line(-(hw - 0.35), 0.15, 1e9, 0, WHITE);
    }
    // street furniture
    if (!near) continue;
    const poles = [];
    if (cls === S.MINOR || cls === S.TERTIARY || cls === S.SERVICE) {
      // 電柱 utility poles on one side every ~30 m, wires between them
      const side = hash2(T.i * 31 + pts.length, Math.round(pts[0][0])) < 0.5 ? 1 : -1;
      for (let s = 6 + rnd() * 10; s < acc - 4; s += 28 + rnd() * 8) {
        const p = at(s, side * (hw + (swW ? swW - 0.4 : 0.45)));
        if (nearJunction(p[0], p[1], 5)) continue;
        poles.push(p);
      }
      const CON = [0.62, 0.62, 0.6], DARK = [0.22, 0.22, 0.22];
      let prev = null;
      for (const p of poles) {
        const [x, z, tx, tz] = p; const H = 11 + rnd() * 1.5; C(x, z);
        pm.cyl(x, z, 0, H, 0.17, 6, CON, [PLAIN, 0, 0, 0], true, 0.12);
        pm.box(x, H - 1.0, z, -tz, tx, 0.9, 0.05, 0.05, DARK, [PLAIN, 0, 0, 0]);
        pm.box(x, H - 1.9, z, -tz, tx, 0.7, 0.05, 0.05, DARK, [PLAIN, 0, 0, 0]);
        if (rnd() < 0.35) pm.cyl(x - tz * 0.45, z + tx * 0.45, H - 3.6, H - 2.4, 0.28, 6, [0.55, 0.57, 0.58], [PLAIN, 0, 0, 0]);
        // yellow guard sleeve at the bottom
        pm.cyl(x, z, 0, 1.8, 0.2, 6, [0.85, 0.7, 0.15], [PLAIN, 0, 0, 0], false);
        cols.push([x, z, 0.22, 0.22, 0, -1, H]);
        if (prev && Math.hypot(prev[0] - x, prev[1] - z) < 45) {
          for (const [o, hh] of [[-0.8, H - 1.0], [0, H - 1.0], [0.8, H - 1.0], [-0.6, H - 1.9], [0.6, H - 1.9]]) {
            const ax = prev[0] - prev[3] * o, az = prev[1] + prev[2] * o, bx = x - tz * o, bz = z + tx * o;
            let px = ax, py = hh + 0.1, pz = az;
            for (let k = 1; k <= 4; k++) { const t = k / 4; const sag = Math.sin(t * Math.PI) * 0.5; const qx = ax + (bx - ax) * t, qz = az + (bz - az) * t, qy = hh + 0.1 - sag; wires.push(px, py, pz); wires.push(qx, qy, qz); px = qx; py = qy; pz = qz; }
          }
        }
        prev = p;
        // a street light on some poles (防犯灯)
        if (rnd() < 0.5) { const lx = x + tz * side * -0.9, lz = z - tx * side * -0.9; gm.box(lx, 7.2, lz, tx, tz, 0.3, 0.12, 0.06, [1, 0.97, 0.9], [1, 0, 0, 0]); if (rnd() < 0.3) lamps.push([lx, 7, lz]); }
      }
    }
    if (cls <= S.SECONDARY) {
      // street lamps both sides, trees + guard rails on sidewalks
      for (const sd of [1, -1]) for (let s = 10 + (sd > 0 ? 0 : 17); s < acc - 5; s += 34) {
        const p = at(s, sd * (hw + 0.6)); if (nearJunction(p[0], p[1], hw + 4)) continue;
        const [x, z, tx, tz] = p; const nx = -tz * sd, nz = tx * sd; C(x, z); // toward the outside
        pm.cyl(x, z, 0, 9, 0.12, 6, [0.5, 0.52, 0.54], [PLAIN, 0, 0, 0], true, 0.09);
        pm.box(x - nx * 1.2, 9.0, z - nz * 1.2, -nx, -nz, 1.2, 0.06, 0.06, [0.5, 0.52, 0.54], [PLAIN, 0, 0, 0]);
        gm.box(x - nx * 2.3, 8.92, z - nz * 2.3, -nx, -nz, 0.4, 0.18, 0.06, [1, 0.92, 0.78], [1, 0, 0, 0]);
        cols.push([x, z, 0.18, 0.18, 0, -1, 9]);
        lamps.push([x - nx * 2.3, 8.6, z - nz * 2.3]);
      }
      if (swW) for (const sd of [1, -1]) {
        for (let s = 6 + rnd() * 4; s < acc - 4; s += 13 + rnd() * 3) { const p = at(s, sd * (hw + swW * 0.62)); if (nearJunction(p[0], p[1], hw + 6)) continue; trees.push(p[0], p[1], 0.75 + rnd() * 0.4, rnd() * 6.28, cls <= S.PRIMARY ? 1 : 0); cols.push([p[0], p[1], 0.3, 0.3, 0, -1, 4]); }
        // white pipe guard rail along the kerb (6 m panels: two rails + a post)
        for (let s0 = 2; s0 < acc - 2; s0 += 6) {
          const s1 = Math.min(acc - 1, s0 + 6); const p = at(s0, sd * (hw + 0.25)), q2 = at(s1, sd * (hw + 0.25)); if (nearJunction(p[0], p[1], hw + 5) || nearJunction(q2[0], q2[1], hw + 5)) continue;
          const mx = (p[0] + q2[0]) / 2, mz = (p[1] + q2[1]) / 2, l = Math.hypot(q2[0] - p[0], q2[1] - p[1]) / 2; if (l < 0.5) continue;
          const tx = (q2[0] - p[0]) / (2 * l), tz = (q2[1] - p[1]) / (2 * l); C(mx, mz);
          pm.box(mx, 0.75, mz, tx, tz, l, 0.03, 0.03, [0.93, 0.93, 0.92], [PLAIN, 0, 0, 0], 28);
          pm.box(mx, 0.45, mz, tx, tz, l, 0.03, 0.03, [0.93, 0.93, 0.92], [PLAIN, 0, 0, 0], 12);
          pm.box(p[0], 0.4, p[1], tx, tz, 0.03, 0.03, 0.4, [0.93, 0.93, 0.92], [PLAIN, 0, 0, 0], 15);
        }
      }
    }
  }

  // fuel station (ガソリンスタンド): open forecourt under a lit canopy on pillars, pump islands with dispensers, a brand
  // fascia that glows at night and a tall price pole — drivable in, only the pillars / pumps / pole collide
  function gasStation(cx, cz, tx, tz, hl, hw, seed) {
    const H = 5.4, nx = -tz, nz = tx;
    const at = (a, b) => [cx + tx * a + nx * b, cz + tz * a + nz * b];
    const BR = [[0.92, 0.32, 0.08], [0.1, 0.35, 0.75], [0.85, 0.1, 0.12], [0.1, 0.55, 0.3]][seed % 4];
    bm.box(cx, H + 0.45, cz, tx, tz, hl, hw, 0.45, [0.94, 0.94, 0.92], [PLAIN, 0, 0, 0]);          // canopy
    gm.box(cx, H + 0.42, cz, tx, tz, hl + 0.03, hw + 0.03, 0.2, BR, [1, 0, 0, 0]);               // brand fascia band
    gm.box(cx, H - 0.02, cz, tx, tz, hl * 0.86, hw * 0.8, 0.02, [1, 0.98, 0.94], [1, 0, 0, 0]);   // canopy downlights
    for (const a of [-0.62, 0.62]) for (const b of [-0.5, 0.5]) { const [x, z] = at(a * hl, b * hw); pm.box(x, H / 2, z, tx, tz, 0.22, 0.22, H / 2, [0.88, 0.88, 0.86], [PLAIN, 0, 0, 0]); cols.push([x, z, 0.25, 0.25, 0, -1, H]); }
    const islands = hl > 9 ? [-0.32, 0.32] : [0];
    for (const a of islands) for (const b of hw > 6 ? [-0.22, 0.22] : [0]) {
      const [x, z] = at(a * hl, b * hw);
      pm.box(x, 0.1, z, tx, tz, 1.5, 0.45, 0.1, [0.78, 0.78, 0.76], [PLAIN, 0, 0, 0]);                 // island kerb
      for (const d of [-0.75, 0.75]) { const px = x + tx * d, pz = z + tz * d; pm.box(px, 0.95, pz, tx, tz, 0.35, 0.28, 0.75, [0.95, 0.95, 0.95], [PLAIN, 0, 0, 0]); gm.box(px + nx * 0.29, 1.15, pz + nz * 0.29, tx, tz, 0.22, 0.01, 0.16, [0.6, 0.9, 1], [1, 0, 0, 0]); gm.box(px, 1.72, pz, tx, tz, 0.36, 0.29, 0.06, BR, [1, 0, 0, 0]); }
      cols.push([x, z, 1.55, 0.5, Math.atan2(-tz, tx), -1, 1.8]);
    }
    // price pole at the street-side corner: brand panel + three lit price rows (レギュラー / ハイオク / 軽油)
    { const [x, z] = at(hl + 1.6, -hw + 0.6); pm.cyl(x, z, 0, 7.2, 0.14, 8, [0.6, 0.62, 0.64], [PLAIN, 0, 0, 0]); cols.push([x, z, 0.2, 0.2, 0, -1, 7.2]);
      gm.box(x, 7.6, z, nx, nz, 0.9, 0.12, 0.55, BR, [1, 0, 0, 0]);
      for (let k = 0; k < 3; k++) { pm.box(x, 6.55 - k * 0.5, z, nx, nz, 0.9, 0.1, 0.22, [0.06, 0.06, 0.07], [PLAIN, 0, 0, 0]); gm.box(x, 6.55 - k * 0.5, z, nx, nz, 0.5, 0.115, 0.13, k === 1 ? [1, 0.25, 0.15] : [1, 0.75, 0.2], [1, 0, 0, 0]); } }
  }
  // ── points: traffic signals + crossings, vending machines, bus stops, konbini pole signs, chimneys ──
  const P = T.p || [];
  for (let k = 0; k < P.length; k += 4) {
    const ty = P[k], x = P[k + 1] * D, z = P[k + 2] * D, hh = P[k + 3]; C(x, z);
    if (ty === PT.CHIMNEY || ty === PT.TOWER) { if (!mid) continue; const H = hh || (ty === PT.CHIMNEY ? 60 + rnd() * 60 : 30 + rnd() * 30); const red = ty === PT.CHIMNEY; for (let b = 0; b < (red ? 8 : 1); b++) bm.cyl(x, z, b * H / 8, red ? (b + 1) * H / 8 : H, red ? 2.2 - b * 0.12 : 1.4, 12, red ? (b % 2 ? [0.85, 0.22, 0.16] : [0.93, 0.93, 0.92]) : [0.7, 0.72, 0.74], [PLAIN, 0, 0, 0], b === 7, red ? 2.2 - (b + 1) * 0.12 : 1.0); cols.push([x, z, 2.2, 2.2, 0, -1, H]); gm.box(x, H + 0.6, z, 1, 0, 0.5, 0.5, 0.5, [1, 0.15, 0.1], [5, 0, 0, 0]); continue; }
    if (ty === PT.FUEL && mid) {
      let best = null; for (const sg of segs.near(x, z)) { if (sg.st.flags & 16) continue; const dx = sg.bx - sg.ax, dz = sg.bz - sg.az, L = Math.hypot(dx, dz) || 1; const t = Math.max(0, Math.min(1, ((x - sg.ax) * dx + (z - sg.az) * dz) / (L * L))); const px = sg.ax + dx * t, pz = sg.az + dz * t; const d = Math.hypot(x - px, z - pz); if (!best || d < best.d) best = { d, tx: dx / L, tz: dz / L, px, pz, w: sg.w }; }
      if (best && best.d < 60) {
        const hl = 8, hw = 5.5; let nx = (x - best.px) / (best.d || 1), nz = (z - best.pz) / (best.d || 1); if (!best.d) { nx = -best.tz; nz = best.tx; }
        const set = Math.max(best.d, best.w / 2 + 3.5 + hw); // keep the canopy off the carriageway and the pavement
        gasStation(best.px + nx * set, best.pz + nz * set, best.tx, best.tz, hl, hw, Math.floor(Math.abs(x * 7 + z * 13)));
      }
      continue;
    }
    if (!near) continue;
    if (ty === PT.SIGNAL) {
      // find the street directions through this node
      const dirs = [];
      for (const sgm of segs.near(x, z)) {
        for (const [ex, ez, ox, oz] of [[sgm.ax, sgm.az, sgm.bx, sgm.bz], [sgm.bx, sgm.bz, sgm.ax, sgm.az]]) {
          if (Math.hypot(ex - x, ez - z) > 1.5) continue;
          const dx = ox - ex, dz = oz - ez, l = Math.hypot(dx, dz) || 1; const d = [dx / l, dz / l, sgm.w / 2];
          if (!dirs.some(o => o[0] * d[0] + o[1] * d[1] > 0.9)) dirs.push(d);
        }
      }
      const ph = hash2(Math.round(x * 10), Math.round(z * 10)) * 60; sigs.push(x, z, ph);
      for (const [dx, dz, hw] of dirs.slice(0, 4)) {
        const axis = Math.abs(dx) > Math.abs(dz) ? 0 : 1;
        // approaching traffic moves along −d and keeps left; pole on its left kerb, arm over the lanes
        const lx = dz, lz = -dx; // left of a car travelling −d … (−d rotated) → pick the kerb on that side
        const px = x + dx * (hw + 3) + lx * (hw + 1), pz = z + dz * (hw + 3) + lz * (hw + 1);
        const GREY = [0.55, 0.57, 0.58];
        pm.cyl(px, pz, 0, 6.2, 0.13, 6, GREY, [PLAIN, 0, 0, 0]);
        const armL = Math.min(hw + 0.5, 6);
        pm.box(px - lx * armL / 2, 5.9, pz - lz * armL / 2, -lx, -lz, armL / 2, 0.06, 0.06, GREY, [PLAIN, 0, 0, 0]);
        // horizontal 3-lamp head facing the approach (+d direction is where cars come from)
        const hx = px - lx * (armL - 0.3), hz = pz - lz * (armL - 0.3);
        pm.box(hx, 5.55, hz, -lx, -lz, 0.62, 0.17, 0.2, [0.2, 0.2, 0.2], [PLAIN, 0, 0, 0]);
        for (let s = 0; s < 3; s++) { const o = (s - 1) * 0.4; gm.box(hx - lx * o + dx * 0.18, 5.55, hz - lz * o + dz * 0.18, -lx, -lz, 0.15, 0.02, 0.15, s === 0 ? [0.1, 1, 0.75] : s === 1 ? [1, 0.75, 0.1] : [1, 0.12, 0.08], [10 + s, ph, axis, 0]); }
        // pedestrian signal on the pole
        pm.box(px, 2.9, pz, -lx, -lz, 0.2, 0.15, 0.4, [0.2, 0.2, 0.2], [PLAIN, 0, 0, 0]);
        gm.box(px - dx * 0.16, 3.1, pz - dz * 0.16, -lx, -lz, 0.14, 0.01, 0.14, [1, 0.12, 0.08], [15, ph, axis, 0]);
        gm.box(px - dx * 0.16, 2.72, pz - dz * 0.16, -lx, -lz, 0.14, 0.01, 0.14, [0.1, 1, 0.75], [16, ph, axis, 0]);
        cols.push([px, pz, 0.18, 0.18, 0, -1, 6.2]);
        // zebra crossing + stop line across this approach
        const cx = x + dx * (hw + 3), cz = z + dz * (hw + 3);
        for (let o = -hw + 0.5; o < hw - 0.3; o += 0.9) { const qx = cx + lx * o, qz = cz + lz * o; const yy = 0.075; paint.quad([qx - dx * 1.9 + lx * 0.22, yy, qz - dz * 1.9 + lz * 0.22], [qx + dx * 1.9 + lx * 0.22, yy, qz + dz * 1.9 + lz * 0.22], [qx + dx * 1.9 - lx * 0.22, yy, qz + dz * 1.9 - lz * 0.22], [qx - dx * 1.9 - lx * 0.22, yy, qz - dz * 1.9 - lz * 0.22], WHITE); }
        const sx = x + dx * (hw + 6.2), sz = z + dz * (hw + 6.2);
        paint.quad([sx + lx * 0.1 - dx * 0.22, 0.075, sz + lz * 0.1 - dz * 0.22], [sx + lx * hw - dx * 0.22, 0.075, sz + lz * hw - dz * 0.22], [sx + lx * hw + dx * 0.22, 0.075, sz + lz * hw + dz * 0.22], [sx + lx * 0.1 + dx * 0.22, 0.075, sz + lz * 0.1 + dz * 0.22], WHITE);
      }
    } else if (ty === PT.VEND) {
      vending(x, z, rnd() * 6.28, 1 + Math.floor(rnd() * 3));
    } else if (ty === PT.BUS) {
      const b = segs.dist(x, z); const ry = b ? Math.atan2(b.s.bx - b.s.ax, b.s.bz - b.s.az) : 0;
      pm.cyl(x, z, 0, 2.3, 0.05, 6, [0.6, 0.6, 0.6], [PLAIN, 0, 0, 0]);
      gm.box(x, 2.3, z, Math.sin(ry), Math.cos(ry), 0.02, 0.32, 0.32, [0.9, 0.95, 1], [2, 0, 0, 0]);
      cols.push([x, z, 0.3, 0.3, 0, -1, 2.5]);
    } else if (ty === PT.POST) {
      pm.box(x, 0.65, z, 1, 0, 0.22, 0.22, 0.65, [0.82, 0.08, 0.06], [PLAIN, 0, 0, 0]); cols.push([x, z, 0.3, 0.3, 0, -1, 1.3]);
    } else if (ty === PT.LAMP) {
      pm.cyl(x, z, 0, 6.5, 0.1, 6, [0.5, 0.52, 0.54], [PLAIN, 0, 0, 0]); gm.box(x, 6.5, z, 1, 0, 0.3, 0.3, 0.1, [1, 0.93, 0.8], [1, 0, 0, 0]); lamps.push([x, 6.3, z]); cols.push([x, z, 0.15, 0.15, 0, -1, 6.5]);
    }
  }
  function vending(x, z, ry, n) {
    const tx = Math.cos(ry), tz = -Math.sin(ry), nx = -tz, nz = tx; // machine faces +n
    const COLS = [[0.85, 0.12, 0.12], [0.1, 0.35, 0.75], [0.93, 0.93, 0.93], [0.15, 0.55, 0.3], [0.95, 0.6, 0.1]];
    for (let k = 0; k < n; k++) {
      const o = (k - (n - 1) / 2) * 1.05; const cx = x + tx * o, cz = z + tz * o;
      pm.box(cx, 0.92, cz, tx, tz, 0.5, 0.38, 0.92, COLS[Math.floor(rnd() * COLS.length)], [PLAIN, 0, 0, 0]);
      gm.box(cx + nx * 0.39, 1.15, cz + nz * 0.39, tx, tz, 0.44, 0.01, 0.45, [0.95, 0.97, 1], [3, rnd(), 0, 0]);
    }
    cols.push([x, z, n * 0.53, 0.4, -ry, -1, 1.9]);
  }

  // ── buildings ──
  const blds = T.b || [];
  const sideOf = (x, z) => segs.dist(x, z);
  for (const a of blds) {
    let [cls, h10, lv, seed, roof] = a; const h = h10 * D; const r = seed / 1000;
    const pts = []; for (let k = 5; k < a.length; k += 2) pts.push([a[k] * D, a[k + 1] * D]);
    if (pts.length < 3) continue;
    const A = Math.abs(ringArea(pts));
    if (!mid && h < 14 && cls !== B.TANK) continue; // far LOD: only the skyline
    const ob = obb(pts); if (!ob) continue;
    const fill = A / (ob.hl * ob.hw * 4);
    // outward normals: test one edge
    const cwSign = (() => { const p = pts[0], q2 = pts[1]; const ex = q2[0] - p[0], ez = q2[1] - p[1], l = Math.hypot(ex, ez) || 1; const mx = (p[0] + q2[0]) / 2 + (ez / l) * 0.05, mz = (p[1] + q2[1]) / 2 - (ex / l) * 0.05; return inPoly(mx, mz, pts) ? -1 : 1; })();
    const outN = (p, q2) => { const ex = q2[0] - p[0], ez = q2[1] - p[1], l = Math.hypot(ex, ez) || 1; return [cwSign * ez / l, 0, -cwSign * ex / l]; };
    // palette + floor height by class
    let col, fh = 3.1, kind = cls;
    switch (cls) {
      case B.HOUSE: col = pick(PAL.house, r); fh = 2.9; break;
      case B.APT: col = pick(PAL.apt, r); fh = 2.95; break;
      case B.OFFICE: case B.TOWER: col = pick(PAL.office, r); fh = 3.8; break;
      case B.HOTEL: col = pick(PAL.apt, r); fh = 3.2; break;
      case B.IND: case B.WAREHOUSE: col = pick(PAL.ind, r); fh = 6; break;
      case B.TANK: col = r < 0.6 ? [0.88, 0.89, 0.88] : [0.78, 0.8, 0.8]; break;
      case B.SCHOOL: case B.HOSP: col = r < 0.5 ? [0.9, 0.89, 0.86] : [0.82, 0.8, 0.76]; fh = 3.8; break;
      case B.TEMPLE: col = [0.55, 0.38, 0.26]; break;
      case B.KONBINI: col = [0.94, 0.94, 0.93]; fh = 4.6; break;
      case B.BRICK: col = [0.62, 0.3, 0.22]; fh = 5.4; break;
      case B.PARKING: col = [0.72, 0.72, 0.7]; fh = 2.9; break;
      case B.SMALL: col = pick(PAL.house, r * 0.7 + 0.3); break;
      default: col = pick(PAL.com, r); fh = 3.3;
    }
    const seedF = (seed % 997) / 997;
    const info = [kind, seedF, fh, lv];
    const cx = ob.x, cz = ob.z; C(cx, cz);
    // ── fuel station (ガソリンスタンド): open forecourt under a lit canopy on pillars, pump islands with dispensers,
    // a brand fascia that glows at night and a tall price pole at the kerb — drivable in, only pillars/pumps collide ──
    if (cls === B.GAS && ob.hl > 3 && ob.hw > 3) { gasStation(cx, cz, ob.tx, ob.tz, ob.hl, ob.hw, seed); continue; }
    // ── storage tank: cylinder + dome ──
    if (cls === B.TANK) {
      const rad = Math.sqrt(A / Math.PI);
      bm.cyl(cx, cz, 0, h, rad, mid ? 28 : 12, col, [PLAIN, seedF, 0, 0], false);
      const dome = Math.min(rad * 0.2, 4);
      for (let i = 0; i < (mid ? 24 : 10); i++) { const s = mid ? 24 : 10; const a0 = i / s * 6.283, a1 = (i + 1) / s * 6.283; bm.tri([cx, h + dome, cz], [cx + Math.cos(a0) * rad, h, cz + Math.sin(a0) * rad], [cx + Math.cos(a1) * rad, h, cz + Math.sin(a1) * rad], [0, 1, 0], [0, 0], [1, 0], [0, 1], shade(col, 0.95), [PLAIN, 0, 0, 0]); }
      if (near) { for (let y = 3; y < h; y += 3) {} pm.box(cx + rad, h / 2, cz, 0, 1, 0.5, 0.05, h / 2, [0.75, 0.3, 0.2], [PLAIN, 0, 0, 0]); }
      cols.push([cx, cz, rad * 0.9, rad * 0.9, 0, -1, h]);
      continue;
    }
    // pitched roof? (houses, temples, small sheds) — over the oriented box with eaves
    const pitched = (roof === 1 || roof === 2) && fill > 0.78 && ob.hw > 1.5 && ob.hw < 9;
    const roofH = pitched ? Math.min(ob.hw * (cls === B.TEMPLE ? 0.8 : 0.5), 4.5) : 0;
    const wallTop = pitched ? Math.max(2.6, h - roofH) : h;
    // walls along the footprint
    let u = 0;
    const parapet = !pitched && h > 6 && cls !== B.IND && cls !== B.WAREHOUSE ? 0.9 : 0;
    const wallH = wallTop + parapet;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k], q2 = pts[(k + 1) % pts.length];
      const l = Math.hypot(q2[0] - p[0], q2[1] - p[1]); if (l < 0.05) continue;
      const n = outN(p, q2);
      bm.quad([p[0], 0, p[1]], [q2[0], 0, q2[1]], [q2[0], wallH, q2[1]], [p[0], wallH, p[1]], n, [u, 0], [u + l, 0], [u + l, wallH], [u, wallH], col, info);
      if (parapet && mid) { // inner face of the parapet + coping
        const ni = [-n[0], 0, -n[2]]; const ix = n[0] * 0.25, iz = n[2] * 0.25;
        bm.quad([p[0] - ix, wallTop, p[1] - iz], [q2[0] - ix, wallTop, q2[1] - iz], [q2[0] - ix, wallH, q2[1] - iz], [p[0] - ix, wallH, p[1] - iz], ni, [u, 0], [u + l, 0], [u + l, 1], [u, 1], shade(col, 0.85), [PLAIN, 0, 0, 0]);
        bm.quad([p[0], wallH, p[1]], [q2[0], wallH, q2[1]], [q2[0] - ix, wallH, q2[1] - iz], [p[0] - ix, wallH, p[1] - iz], [0, 1, 0], [0, 0], [1, 0], [1, 1], [0, 1], shade(col, 0.8), [PLAIN, 0, 0, 0]);
      }
      u += l;
    }
    // roof
    if (pitched) {
      const ov = 0.45, { tx, tz } = ob; const nx = -tz, nz = tx;
      const hl = ob.hl + ov, hw2 = ob.hw + ov;
      const P3 = (a, b, y) => [cx + tx * a + nx * b, y, cz + tz * a + nz * b];
      const rc = pick(PAL.roofTile, (r * 7.3) % 1); const rinfo = [ROOFTILE, seedF, 0, 0];
      const ey = wallTop - 0.15, ry2 = wallTop + roofH;
      const ridge = roof === 2 ? Math.max(0.3, hl - hw2) : hl; // hip: ridge shortened
      // two long slopes
      for (const sd of [1, -1]) {
        const a0 = P3(-hl, sd * hw2, ey), a1 = P3(hl, sd * hw2, ey), b1 = P3(ridge, 0, ry2), b0 = P3(-ridge, 0, ry2);
        const sl = Math.hypot(hw2, roofH); const n = [nx * sd * roofH / sl, hw2 / sl, nz * sd * roofH / sl];
        bm.quad(a0, a1, b1, b0, n, [-hl, 0], [hl, 0], [ridge, sl], [-ridge, sl], rc, rinfo);
        // eave fascia
        if (mid) bm.quad(P3(-hl, sd * hw2, ey - 0.2), P3(hl, sd * hw2, ey - 0.2), a1, a0, [nx * sd, 0, nz * sd], [0, 0], [1, 0], [1, 1], [0, 1], shade(rc, 0.8), [PLAIN, 0, 0, 0]);
      }
      for (const se of [1, -1]) {
        if (roof === 2) { // hip ends
          const a0 = P3(se * hl, -hw2, ey), a1 = P3(se * hl, hw2, ey), b = P3(se * ridge, 0, ry2);
          const sl = Math.hypot(hl - ridge, roofH) || 1; const n = [tx * se * roofH / sl, (hl - ridge) / sl, tz * se * roofH / sl];
          bm.tri(a0, a1, b, n, [-hw2, 0], [hw2, 0], [0, sl], rc, rinfo);
        } else { // gable wall triangle + verge
          const a0 = P3(se * ob.hl, -ob.hw, wallTop), a1 = P3(se * ob.hl, ob.hw, wallTop), b = P3(se * ob.hl, 0, wallTop + roofH * ob.hw / hw2);
          bm.tri(a0, a1, b, [tx * se, 0, tz * se], [0, 0], [ob.hw * 2, 0], [ob.hw, roofH], col, [PLAIN, seedF, 0, 0]);
          // also fill wall gap between footprint top and OBB (rect footprints: negligible)
        }
      }
      if (mid) bm.box(cx, ry2 + 0.08, cz, tx, tz, ridge + 0.1, 0.18, 0.1, shade(rc, 0.7), [PLAIN, 0, 0, 0]); // ridge tiles
    } else {
      const tris = triangulate(pts);
      const rc = cls === B.IND || cls === B.WAREHOUSE ? (r < 0.5 ? [0.62, 0.66, 0.68] : [0.45, 0.55, 0.62]) : pick(PAL.roofFlat, r);
      const rinfo = [cls === B.IND || cls === B.WAREHOUSE ? METALWALL : PLAIN, seedF, 0, 1];
      for (const [i0, i1, i2] of tris) { const a0 = pts[i0], a1 = pts[i1], a2 = pts[i2]; bm.tri([a0[0], wallTop, a0[1]], [a1[0], wallTop, a1[1]], [a2[0], wallTop, a2[1]], [0, 1, 0], [a0[0], a0[1]], [a1[0], a1[1]], [a2[0], a2[1]], rc, rinfo); }
    }
    // collider: oriented box when the footprint is box-like, else one thin wall per edge
    if (fill > 0.8) cols.push([cx, cz, ob.hl, ob.hw, Math.atan2(-ob.tz, ob.tx), -1, h]);
    else for (let k = 0; k < pts.length; k++) { const p = pts[k], q2 = pts[(k + 1) % pts.length]; const l = Math.hypot(q2[0] - p[0], q2[1] - p[1]); if (l < 0.3) continue; cols.push([(p[0] + q2[0]) / 2, (p[1] + q2[1]) / 2, l / 2, 0.3, Math.atan2(-(q2[1] - p[1]) / l, (q2[0] - p[0]) / l), -1, h]); }

    if (!near) continue;
    // ── near-LOD architectural details ──
    // edges sorted by length; which face a street?
    const edges = [];
    for (let k = 0; k < pts.length; k++) { const p = pts[k], q2 = pts[(k + 1) % pts.length]; const l = Math.hypot(q2[0] - p[0], q2[1] - p[1]); if (l < 2.5) continue; const n = outN(p, q2); const mx = (p[0] + q2[0]) / 2, mz = (p[1] + q2[1]) / 2; const sd = sideOf(mx + n[0] * 4, mz + n[2] * 4); const street = sd && sd.d < sd.s.w / 2 + 6 ? sd.s : null; edges.push({ p, q: q2, l, n, mx, mz, street, tx: (q2[0] - p[0]) / l, tz: (q2[1] - p[1]) / l }); }
    edges.sort((a, b) => b.l - a.l);
    const front = edges.find(e => e.street) || edges[0];
    if (!front) continue;
    if (cls === B.APT && lv >= 2 && edges.length) {
      // balconies on the longest facade (prefer the south-ish one), open corridors on the opposite
      const bal = edges.slice(0, 3).sort((a, b) => (b.n[2] + (b === edges[0] ? 0.3 : 0)) - (a.n[2] + (a === edges[0] ? 0.3 : 0)))[0];
      const opp = edges.find(e => e.n[0] * bal.n[0] + e.n[2] * bal.n[2] < -0.9 && e.l > 6);
      const rail = r < 0.4 ? [0.9, 0.91, 0.9] : r < 0.7 ? [0.55, 0.6, 0.64] : shade(col, 0.9);
      for (const [E, depth, glassy] of [[bal, 1.15, r < 0.35], [opp, 1.3, false]]) {
        if (!E) continue;
        const l = E.l - 0.6, mx = E.mx + E.n[0] * depth / 2, mz = E.mz + E.n[2] * depth / 2;
        for (let f = 1; f < lv; f++) {
          const y = f * fh;
          bm.box(mx, y - 0.08, mz, E.tx, E.tz, l / 2, depth / 2, 0.09, shade(col, 0.92), [PLAIN, 0, 0, 0]);
          const fx = E.mx + E.n[0] * (depth - 0.04), fz = E.mz + E.n[2] * (depth - 0.04);
          bm.box(fx, y + 0.5, fz, E.tx, E.tz, l / 2, 0.04, 0.5, glassy ? [0.55, 0.62, 0.66] : rail, [glassy ? GLASSWALL : PLAIN, 0, 0, 0], 63);
          if (E === bal) for (let d = -l / 2 + 6; d < l / 2 - 1; d += 6) bm.box(E.mx + E.n[0] * depth / 2 + E.tx * d, y + 1.05, E.mz + E.n[2] * depth / 2 + E.tz * d, E.tx, E.tz, 0.03, depth / 2, 1.0, [0.86, 0.86, 0.84], [PLAIN, 0, 0, 0], 15);
        }
        if (E === opp && lv >= 3) { // stair/elevator core at one end
          const ex = E.p[0] + E.tx * 2 + E.n[0] * 1.6, ez = E.p[1] + E.tz * 2 + E.n[2] * 1.6;
          bm.box(ex, (h + 2.5) / 2, ez, E.tx, E.tz, 1.6, 1.6, (h + 2.5) / 2, shade(col, 0.95), [PLAIN, seedF, 0, 0]);
        }
      }
      // rooftop: elevator machine room + water tank
      if (lv >= 4) { bm.box(cx, h + 1.3, cz, ob.tx, ob.tz, 1.8, 1.6, 1.3, shade(col, 0.95), [PLAIN, 0, 0, 0]); pm.cyl(cx + ob.tx * 4, cz + ob.tz * 4, h + 1.2, h + 3.2, 1.1, 8, [0.85, 0.85, 0.82], [PLAIN, 0, 0, 0]); pm.box(cx + ob.tx * 4, h + 0.6, cz + ob.tz * 4, ob.tx, ob.tz, 1.0, 1.0, 0.6, [0.35, 0.35, 0.35], [PLAIN, 0, 0, 0]); }
    }
    if ((cls === B.COM || cls === B.OFFICE || cls === B.HOTEL || cls === B.APT && r < 0.25) && front.street) {
      // shopfront on the street side: glazed ground floor (shader), awning, fascia sign, protruding vertical sign
      const E = front; const l = E.l - 0.4;
      const sgnIdx = Math.floor(hash2(seed, 77) * signN);
      const ax = E.mx + E.n[0] * 0.6, az = E.mz + E.n[2] * 0.6;
      bm.quad([E.p[0] + E.n[0] * 0.03, 0.05, E.p[1] + E.n[2] * 0.03], [E.q[0] + E.n[0] * 0.03, 0.05, E.q[1] + E.n[2] * 0.03], [E.q[0] + E.n[0] * 0.03, 2.75, E.q[1] + E.n[2] * 0.03], [E.p[0] + E.n[0] * 0.03, 2.75, E.p[1] + E.n[2] * 0.03], E.n, [0, 0], [E.l, 0], [E.l, 2.7], [0, 2.7], [1, 1, 1], [SHOPFRONT, seedF, 0, 0]);
      if (r < 0.6) { const ac = pick([[0.7, 0.1, 0.1], [0.12, 0.35, 0.2], [0.15, 0.2, 0.45], [0.85, 0.55, 0.1], [0.3, 0.3, 0.3], [0.9, 0.9, 0.88]], r * 3.1 % 1); pm.box(ax, 2.95, az, E.tx, E.tz, Math.min(l / 2, 6), 0.6, 0.06, ac, [PLAIN, 0, 0, 0]); }
      sign(E.mx + E.n[0] * 0.08, 3.4, E.mz + E.n[2] * 0.08, E.tx, E.tz, E.n, Math.min(l * 0.9, 9), 0.9, sgnIdx, 0);
      if (lv >= 3 && r > 0.35) { // vertical sign
        const vx = E.p[0] + E.tx * 0.9 + E.n[0] * 0.75, vz = E.p[1] + E.tz * 0.9 + E.n[2] * 0.75;
        const vh = Math.min(lv * fh - 3.5, 9);
        sign(vx, 3.5 + vh / 2, vz, E.n[0], E.n[2], [E.tx, 0, E.tz], 1.2, vh, (sgnIdx + 17) % signN, 1, true);
      }
    }
    if (cls === B.KONBINI) konbini(front, seed, h);
    if ((cls === B.COM || cls === B.OFFICE) && !pitched && h > 8 && r > 0.4) {
      for (let k = 0; k < 3 + Math.floor(r * 4); k++) { const ox = (rnd() - 0.5) * ob.hl, oz = (rnd() - 0.5) * ob.hw; const x = cx + ob.tx * ox - ob.tz * oz, z = cz + ob.tz * ox + ob.tx * oz; if (inPoly(x, z, pts)) pm.box(x, h + 0.45, z, ob.tx, ob.tz, 0.5, 0.4, 0.45, [0.82, 0.82, 0.8], [PLAIN, 0, 0, 0]); }
      if (front.street && front.street.cls <= S.SECONDARY && r > 0.75 && h < 40) { // rooftop billboard
        const E = front; const bx = E.mx - E.n[0] * 1.5, bz = E.mz - E.n[2] * 1.5;
        for (const o of [-2.5, 2.5]) pm.box(bx + E.tx * o, h + 2.2, bz + E.tz * o, E.tx, E.tz, 0.08, 0.08, 2.2, [0.3, 0.3, 0.3], [PLAIN, 0, 0, 0]);
        sign(bx + E.n[0] * 0.1, h + 3.4, bz + E.n[2] * 0.1, E.tx, E.tz, E.n, 7, 2.6, Math.floor(hash2(seed, 5) * signN), 2);
      }
    }
    if ((cls === B.HOUSE || cls === B.APT) && front.street && front.street.cls >= S.TERTIARY && hash2(seed, 13) < 0.035) {
      const E = front; vending(E.mx + E.n[0] * 0.6 + E.tx * (E.l / 2 - 1.5), E.mz + E.n[2] * 0.6 + E.tz * (E.l / 2 - 1.5), Math.atan2(-E.tz, E.tx), 1 + Math.floor(hash2(seed, 3) * 3));
    }
    if ((cls === B.HOUSE || cls === B.APT && lv <= 3) && front.street && front.street.cls >= S.TERTIARY && hash2(seed, 31) < 0.7) {
      // concrete-block garden wall between the facade and the street, with a gate opening
      const E = front; const sd = segs.dist(E.mx, E.mz); const edgeD = sd ? sd.d - sd.s.w / 2 : 99; const gap = Math.max(0.6, Math.min(3.2, edgeD - 0.35));
      if (edgeD > 1.1 && edgeD < 9) {
      const ox = E.n[0] * (gap + 0.0), oz = E.n[2] * (gap + 0.0); const wh = 0.9 + hash2(seed, 32) * 0.7;
      const wc = hash2(seed, 33) < 0.5 ? [0.66, 0.65, 0.62] : hash2(seed, 34) < 0.5 ? [0.78, 0.74, 0.66] : [0.55, 0.53, 0.5];
      const gateAt = 0.25 + hash2(seed, 35) * 0.5, gw = 1.2;
      const segL = E.l * gateAt - gw / 2, segR = E.l * (1 - gateAt) - gw / 2;
      if (segL > 0.4) { const c0 = E.l * gateAt / 2 - gw / 4; bm.box(E.p[0] + E.tx * (segL / 2) + ox, wh / 2, E.p[1] + E.tz * (segL / 2) + oz, E.tx, E.tz, segL / 2, 0.075, wh / 2, wc, [PLAIN, seedF, 0, 0]); cols.push([E.p[0] + E.tx * (segL / 2) + ox, E.p[1] + E.tz * (segL / 2) + oz, segL / 2, 0.1, Math.atan2(-E.tz, E.tx), -1, wh]); }
      if (segR > 0.4) { const d0 = E.l - segR / 2; bm.box(E.p[0] + E.tx * d0 + ox, wh / 2, E.p[1] + E.tz * d0 + oz, E.tx, E.tz, segR / 2, 0.075, wh / 2, wc, [PLAIN, seedF, 0, 0]); cols.push([E.p[0] + E.tx * d0 + ox, E.p[1] + E.tz * d0 + oz, segR / 2, 0.1, Math.atan2(-E.tz, E.tx), -1, wh]); }
      // gate posts + mailbox/intercom, a potted plant
      for (const g2 of [-1, 1]) pm.box(E.p[0] + E.tx * (E.l * gateAt + g2 * gw / 2) + ox, (wh + 0.25) / 2, E.p[1] + E.tz * (E.l * gateAt + g2 * gw / 2) + oz, E.tx, E.tz, 0.12, 0.12, (wh + 0.25) / 2, shade(wc, 0.85), [PLAIN, 0, 0, 0]);
      if (hash2(seed, 36) < 0.6) pm.cyl(E.p[0] + E.tx * (E.l * gateAt + gw) + ox - E.n[0] * 0.5, E.p[1] + E.tz * (E.l * gateAt + gw) + oz - E.n[2] * 0.5, 0, 0.35, 0.22, 6, [0.55, 0.32, 0.2], [PLAIN, 0, 0, 0]);
      // entrance door (genkan) on the facade behind the gate
      bm.quad(...(() => { const d = E.l * gateAt; const ax = E.p[0] + E.tx * (d - 0.45) + E.n[0] * 0.02, az = E.p[1] + E.tz * (d - 0.45) + E.n[2] * 0.02, bx = E.p[0] + E.tx * (d + 0.45) + E.n[0] * 0.02, bz = E.p[1] + E.tz * (d + 0.45) + E.n[2] * 0.02; return [[ax, 0.05, az], [bx, 0.05, bz], [bx, 2.1, bz], [ax, 2.1, az]]; })(), E.n, [0, 0], [1, 0], [1, 1], [0, 1], hash2(seed, 37) < 0.5 ? [0.36, 0.26, 0.18] : [0.55, 0.56, 0.57], [PLAIN, 0, 0, 0]);
      }
    }
    if (cls === B.HOUSE && near && hash2(seed, 21) < 0.5) { // AC outdoor unit
      const E = edges[Math.min(1, edges.length - 1)]; pm.box(E.mx + E.n[0] * 0.35, 0.35, E.mz + E.n[2] * 0.35, E.tx, E.tz, 0.4, 0.15, 0.3, [0.9, 0.9, 0.88], [PLAIN, 0, 0, 0]);
    }
  }
  function sign(x, y, z, tx, tz, n, w, hgt, idx, style, both) {
    // a lit box sign (atlas face on the front, and on the back for protruding signs)
    pm.box(x - n[0] * 0.06, y, z - n[2] * 0.06, tx, tz, w / 2, 0.05, hgt / 2, [0.2, 0.2, 0.22], [PLAIN, 0, 0, 0]);
    for (const sd of both ? [1, -1] : [1]) {
      const fx = x + n[0] * 0.0 * sd + (sd < 0 ? -n[0] * 0.13 : 0), fz = z + n[2] * 0.0 * sd + (sd < 0 ? -n[2] * 0.13 : 0);
      const nn = [n[0] * sd, 0, n[2] * sd];
      const ttx = tx * sd, ttz = tz * sd;
      const a = [fx - ttx * w / 2, y - hgt / 2, fz - ttz * w / 2], b = [fx + ttx * w / 2, y - hgt / 2, fz + ttz * w / 2], c = [fx + ttx * w / 2, y + hgt / 2, fz + ttz * w / 2], d = [fx - ttx * w / 2, y + hgt / 2, fz - ttz * w / 2];
      sg.quad(a, b, c, d, nn, [0, 0], [1, 0], [1, 1], [0, 1], [1, 1, 1], [idx, style, w / hgt, 0]);
    }
  }
  function konbini(E, seed, h) {
    const brand = Math.floor(hash2(seed, 99) * 3);
    const BR = [[[0.05, 0.35, 0.75], [1, 1, 1]], [[0.1, 0.55, 0.3], [0.1, 0.35, 0.75]], [[0.9, 0.35, 0.1], [0.85, 0.1, 0.12]]][brand];
    // glazed front, colour band, logo sign, lit
    bm.quad([E.p[0] + E.n[0] * 0.04, 0.05, E.p[1] + E.n[2] * 0.04], [E.q[0] + E.n[0] * 0.04, 0.05, E.q[1] + E.n[2] * 0.04], [E.q[0] + E.n[0] * 0.04, 3.0, E.q[1] + E.n[2] * 0.04], [E.p[0] + E.n[0] * 0.04, 3.0, E.p[1] + E.n[2] * 0.04], E.n, [0, 0], [E.l, 0], [E.l, 3], [0, 3], [1, 1, 1], [KONBINI_FRONT, 0, 0, 0]);
    gm.box(E.mx + E.n[0] * 0.12, 3.55, E.mz + E.n[2] * 0.12, E.tx, E.tz, E.l / 2, 0.06, 0.28, BR[0][0] ? BR[0] : [1, 1, 1], [4, 0, 0, 0]);
    gm.box(E.mx + E.n[0] * 0.12, 3.95, E.mz + E.n[2] * 0.12, E.tx, E.tz, E.l / 2, 0.06, 0.12, BR[1], [4, 0, 0, 0]);
    sign(E.mx + E.n[0] * 0.2 + E.tx * (E.l / 2 - 2.5), 4.15, E.mz + E.n[2] * 0.2 + E.tz * (E.l / 2 - 2.5), E.tx, E.tz, E.n, 3.6, 0.9, brand, 3);
    // pole sign at the lot corner
    const px = E.p[0] + E.n[0] * 9, pz = E.p[1] + E.n[2] * 9;
    pm.box(px, 3, pz, E.tx, E.tz, 0.15, 0.15, 3, [0.85, 0.85, 0.85], [PLAIN, 0, 0, 0]);
    sign(px + E.n[0] * 0.2, 6.6, pz + E.n[2] * 0.2, E.tx, E.tz, E.n, 2.2, 1.6, brand, 4, true);
    cols.push([px, pz, 0.25, 0.25, 0, -1, 7]);
    lamps.push([E.mx + E.n[0] * 3, 3.5, E.mz + E.n[2] * 3]);
    // parking stalls in front
    for (let k = -2; k <= 2; k++) { const sx = E.mx + E.n[0] * 5 + E.tx * k * 2.6, sz = E.mz + E.n[2] * 5 + E.tz * k * 2.6; paint.quad([sx - E.n[0] * 2.5 - E.tx * 0.06, 0.06, sz - E.n[2] * 2.5 - E.tz * 0.06], [sx + E.n[0] * 2.5 - E.tx * 0.06, 0.06, sz + E.n[2] * 2.5 - E.tz * 0.06], [sx + E.n[0] * 2.5 + E.tx * 0.06, 0.06, sz + E.n[2] * 2.5 + E.tz * 0.06], [sx - E.n[0] * 2.5 + E.tx * 0.06, 0.06, sz - E.n[2] * 2.5 + E.tz * 0.06], WHITE); }
  }

  // ── land use ground ──
  for (const a of T.l || []) {
    const c = a[0]; const pts = []; for (let k = 1; k < a.length; k += 2) pts.push([a[k] * D, a[k + 1] * D]);
    if (pts.length < 3) continue;
    if (c === L.WATER) water.push(pts);
    if (!mid && c !== L.WATER && c !== L.GREEN && c !== L.WOOD) continue;
    const g = ground[c] || (ground[c] = new Flat());
    const y = c === L.WATER ? 0.02 : c === L.PARKING ? 0.028 : 0.012 + (c % 5) * 0.002;
    for (const [i0, i1, i2] of triangulate(pts)) g.tri([pts[i0][0], y, pts[i0][1]], [pts[i1][0], y, pts[i1][1]], [pts[i2][0], y, pts[i2][1]], [1, 1, 1]);
    // trees in parks / woods
    if (mid && (c === L.GREEN || c === L.WOOD)) {
      const Ar = Math.abs(ringArea(pts)); const n = Math.min(near ? 220 : 50, Math.floor(Ar / (c === L.WOOD ? 45 : 160) / (near ? 1 : 4)));
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      for (let k = 0, tries = 0; k < n && tries < n * 4; tries++) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (!inPoly(x, z, pts)) continue; const sd = segs.dist(x, z); if (sd && sd.d < sd.s.w / 2 + 2) continue; trees.push(x, z, 0.7 + rnd() * 0.7, rnd() * 6.28, near ? (c === L.WOOD ? 2 : Math.floor(rnd() * 3)) : 3); k++; }
    }
    // river / canal embankment walls (block driving into the water, except at bridges)
    if (c === L.WATER && mid) {
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k], q2 = pts[(k + 1) % pts.length]; const l = Math.hypot(q2[0] - p[0], q2[1] - p[1]); if (l < 1) continue;
        const onTileEdge = (Math.abs(p[0] - q2[0]) < 0.01 && (Math.abs(p[0]) < 0.01 || Math.abs(p[0] - 1000) < 0.01)) || (Math.abs(p[1] - q2[1]) < 0.01 && (Math.abs(p[1]) < 0.01 || Math.abs(p[1] - 1000) < 0.01));
        if (onTileEdge) continue;
        const mx = (p[0] + q2[0]) / 2, mz = (p[1] + q2[1]) / 2;
        if (bridges.some(([ax, az, bx, bz, hw]) => { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((mx - ax) * dx + (mz - az) * dz) / L2)); return Math.hypot(mx - ax - dx * t, mz - az - dz * t) < hw + l / 2 + 2; })) continue;
        const tx = (q2[0] - p[0]) / l, tz = (q2[1] - p[1]) / l;
        C(mx, mz); if (near) pm.box(mx, 0.5, mz, tx, tz, l / 2, 0.15, 0.5, [0.62, 0.62, 0.6], [PLAIN, 0, 0, 0]);
        cols.push([mx, mz, l / 2, 0.2, Math.atan2(-tz, tx), -1, 1]);
      }
    }
  }

  // ── railways ──
  for (const a of T.r || []) {
    if (!mid) continue;
    const cls = a[0], deck = a[1] * D; const pts = []; for (let k = 2; k < a.length; k += 2) pts.push([a[k] * D, a[k + 1] * D]);
    let acc = 0;
    for (let k = 0; k < pts.length - 1; k++) {
      const p = pts[k], q2 = pts[k + 1]; const l = Math.hypot(q2[0] - p[0], q2[1] - p[1]); if (l < 0.1) continue;
      const tx = (q2[0] - p[0]) / l, tz = (q2[1] - p[1]) / l, mx = (p[0] + q2[0]) / 2, mz = (p[1] + q2[1]) / 2; C(mx, mz);
      const y = deck;
      if (cls === 2) { bm.box(mx, y - 0.9, mz, tx, tz, l / 2 + 0.05, 0.45, 0.9, [0.8, 0.8, 0.78], [PLAIN, 0, 0, 0]); }
      else {
        pm.box(mx, y + 0.12, mz, tx, tz, l / 2 + 0.05, 1.6, 0.12, [0.42, 0.4, 0.37], [PLAIN, 0, 0, 0], 16 | 4 | 8);
        if (near) for (const o of [-0.53, 0.53]) pm.box(mx - tz * o, y + 0.32, mz + tx * o, tx, tz, l / 2 + 0.03, 0.035, 0.08, [0.45, 0.42, 0.4], [PLAIN, 0, 0, 0], 16 | 4 | 8);
        if (deck > 0.5) { bm.box(mx, y - 0.7, mz, tx, tz, l / 2 + 0.05, 2.6, 0.7, [0.7, 0.7, 0.68], [PLAIN, 0, 0, 0]); if (near) for (const o of [-2.5, 2.5]) bm.box(mx - tz * o, y + 0.6, mz + tx * o, tx, tz, l / 2 + 0.05, 0.1, 0.6, [0.72, 0.72, 0.7], [PLAIN, 0, 0, 0]); }
      }
      // piers + catenary masts at a fixed spacing along the line
      for (let s = Math.ceil(acc / 25) * 25; s < acc + l; s += 25) {
        const t = (s - acc) / l; const x = p[0] + (q2[0] - p[0]) * t, z = p[1] + (q2[1] - p[1]) * t;
        if (deck > 0.5 || cls === 2) { bm.box(x, (y - 1.4) / 2, z, tx, tz, 0.9, cls === 2 ? 0.6 : 1.1, (y - 1.4) / 2, [0.7, 0.7, 0.68], [PLAIN, 0, 0, 0]); cols.push([x, z, 1, 1.2, Math.atan2(-tz, tx), -1, y - 1]); }
        if (cls === 0 && near && Math.round(s / 25) % 2 === 0) { const ox = x - tz * 2.4, oz = z + tx * 2.4; pm.cyl(ox, oz, y, y + 7.5, 0.12, 6, [0.55, 0.56, 0.55], [PLAIN, 0, 0, 0]); pm.box(ox + tz * 1.4, y + 7.0, oz - tx * 1.4, -tz, tx, 1.5, 0.05, 0.05, [0.55, 0.56, 0.55], [PLAIN, 0, 0, 0]); if (deck < 0.5) cols.push([ox, oz, 0.15, 0.15, 0, -1, 8]); }
      }
      // fence along ground-level lines (blocks driving onto the tracks)
      if (deck < 0.5 && cls === 0) for (const o of [-2.9, 2.9]) { if (near) pm.box(mx - tz * o, 0.9, mz + tx * o, tx, tz, l / 2, 0.02, 0.9, [0.5, 0.55, 0.5], [PLAIN, 0, 0, 0], 15); cols.push([mx - tz * o, mz + tx * o, l / 2, 0.1, Math.atan2(-tz, tx), -1, 2]); }
      acc += l;
    }
  }

  // ── Shuto viaducts that are not driveable here (Yokohane, Kariba, Mitsuzawa, K6 …) ──
  for (const a of T.e || []) {
    const deck = a[0] * D, w = a[1] * D; const pts = []; for (let k = 2; k < a.length; k += 2) pts.push([a[k] * D, a[k + 1] * D]);
    let acc = 0;
    for (let k = 0; k < pts.length - 1; k++) {
      const p = pts[k], q2 = pts[k + 1]; const l = Math.hypot(q2[0] - p[0], q2[1] - p[1]); if (l < 0.1) continue;
      const tx = (q2[0] - p[0]) / l, tz = (q2[1] - p[1]) / l, mx = (p[0] + q2[0]) / 2, mz = (p[1] + q2[1]) / 2; C(mx, mz);
      bm.box(mx, deck - 1.1, mz, tx, tz, l / 2 + 0.3, w / 2, 1.1, [0.66, 0.66, 0.64], [PLAIN, 0, 0, 0]);
      if (mid) for (const o of [-w / 2 + 0.25, w / 2 - 0.25]) bm.box(mx - tz * o, deck + 0.55, mz + tx * o, tx, tz, l / 2 + 0.3, 0.25, 0.55, [0.7, 0.7, 0.68], [PLAIN, 0, 0, 0]);
      if (near) { road.quad([p[0] - tz * (w / 2 - 0.5), deck + 0.01, p[1] + tx * (w / 2 - 0.5)], [q2[0] - tz * (w / 2 - 0.5), deck + 0.01, q2[1] + tx * (w / 2 - 0.5)], [q2[0] + tz * (w / 2 - 0.5), deck + 0.01, q2[1] - tx * (w / 2 - 0.5)], [p[0] + tz * (w / 2 - 0.5), deck + 0.01, p[1] - tx * (w / 2 - 0.5)], [0.75, 0.75, 0.77]); }
      for (let s = Math.ceil(acc / 32) * 32; s < acc + l; s += 32) {
        const t = (s - acc) / l; const x = p[0] + (q2[0] - p[0]) * t, z = p[1] + (q2[1] - p[1]) * t;
        bm.box(x, (deck - 2.2) / 2, z, tx, tz, 1.2, 1.4, (deck - 2.2) / 2, [0.68, 0.68, 0.66], [PLAIN, 0, 0, 0]);
        if (mid) bm.box(x, deck - 2.9, z, tx, tz, 1.3, w / 2 - 0.5, 0.7, [0.66, 0.66, 0.64], [PLAIN, 0, 0, 0]);
        cols.push([x, z, 1.3, 1.5, Math.atan2(-tz, tx), -1, deck - 2.2]);
        if (near && Math.round(s / 32) % 2 === 0) { const lx = x - tz * (w / 2 - 0.3), lz = z + tx * (w / 2 - 0.3); pm.cyl(lx, lz, deck + 1.1, deck + 9, 0.12, 6, [0.5, 0.52, 0.54], [PLAIN, 0, 0, 0]); gm.box(lx + tz * 1.8, deck + 9, lz - tx * 1.8, -tz, tx, 0.45, 0.2, 0.06, [1, 0.85, 0.6], [1, 0, 0, 0]); }
      }
      acc += l;
    }
  }

  // ── airport: runways (asphalt, white markings, threshold bars, edge lights) and taxiways (yellow line, blue lights) ──
  const runways = [], gates = [];
  for (const a of T.a || []) {
    const type = a[0], w = a[1] * D; const pts = []; for (let k = 2; k < a.length; k += 2) pts.push([a[k] * D, a[k + 1] * D]);
    if (pts.length < 2) continue;
    const yR = type === 0 ? 0.05 : 0.045, hw = w / 2;
    let acc = 0; const total = pts.reduce((s0, p, k) => k ? s0 + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0, 0);
    if (type === 0) runways.push([pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1], w]);
    for (let k = 0; k < pts.length - 1; k++) {
      const p = pts[k], q2 = pts[k + 1]; const l = Math.hypot(q2[0] - p[0], q2[1] - p[1]); if (l < 0.1) continue;
      const tx = (q2[0] - p[0]) / l, tz = (q2[1] - p[1]) / l, nx = -tz, nz = tx; C((p[0] + q2[0]) / 2, (p[1] + q2[1]) / 2);
      const P4 = (o0, o1, s0, s1, yy) => [[p[0] + tx * s0 + nx * o0, yy, p[1] + tz * s0 + nz * o0], [p[0] + tx * s1 + nx * o0, yy, p[1] + tz * s1 + nz * o0], [p[0] + tx * s1 + nx * o1, yy, p[1] + tz * s1 + nz * o1], [p[0] + tx * s0 + nx * o1, yy, p[1] + tz * s0 + nz * o1]];
      road.quad(...P4(-hw, hw, 0, l, yR), type === 0 ? [0.42, 0.42, 0.44] : [0.5, 0.5, 0.52]);
      if (!mid) { acc += l; continue; }
      if (type === 0) {
        // centreline 30 m dash / 20 m gap, side stripes, threshold piano keys near both ends
        for (let s0 = Math.ceil(acc / 50) * 50 - acc; s0 < l; s0 += 50) { const sA = Math.max(0, s0), sB = Math.min(l, s0 + 30); if (sB - sA > 1 && acc + sA > 120 && acc + sB < total - 120) paint.quad(...P4(-0.45, 0.45, sA, sB, yR + 0.012), WHITE); }
        for (const sd of [-1, 1]) paint.quad(...P4(sd * (hw - 1.4), sd * (hw - 0.5), 0, l, yR + 0.012), WHITE);
        for (const [s0, s1] of [[0, 60], [total - 60, total]]) { const a0 = Math.max(0, s0 - acc), a1 = Math.min(l, s1 - acc); if (a1 - a0 < 1) continue; for (let o = -hw + 3; o < hw - 3; o += 3.6) if (Math.abs(o) > 2.5) paint.quad(...P4(o, o + 1.8, a0 + 6, a1 - 6, yR + 0.012), WHITE); }
        if (near) for (let s0 = Math.ceil(acc / 60) * 60 - acc; s0 < l; s0 += 60) for (const sd of [-1, 1]) { if (s0 < 0) continue; const x = p[0] + tx * s0 + nx * sd * (hw + 1), z = p[1] + tz * s0 + nz * sd * (hw + 1); gm.box(x, 0.25, z, tx, tz, 0.15, 0.15, 0.2, [1, 0.96, 0.85], [1, 0, 0, 0]); }
      } else {
        paint.quad(...P4(-0.08, 0.08, 0, l, yR + 0.012), YEL);
        if (near) for (let s0 = Math.ceil(acc / 30) * 30 - acc; s0 < l; s0 += 30) for (const sd of [-1, 1]) { if (s0 < 0) continue; const x = p[0] + tx * s0 + nx * sd * (hw + 0.5), z = p[1] + tz * s0 + nz * sd * (hw + 0.5); gm.box(x, 0.2, z, tx, tz, 0.1, 0.1, 0.15, [0.2, 0.45, 1], [1, 0, 0, 0]); }
      }
      acc += l;
    }
  }
  { const G = T.g || []; for (let k = 0; k < G.length; k += 3) gates.push(G[k] * D, G[k + 1] * D, G[k + 2] / 100); }

  // ── OSM trees ──
  if (mid) { const tr = T.t || []; for (let k = 0; k < tr.length; k += near ? 2 : 6) { const x = tr[k] * D, z = tr[k + 1] * D; const sd = segs.dist(x, z); if (sd && sd.s.st?.flags & 16 && sd.d < sd.s.w / 2 + 3) continue; trees.push(x, z, 0.8 + rnd() * 0.5, rnd() * 6.28, near ? Math.floor(rnd() * 3) : 3); } }

  const rails = [], stations = [];
  if (mid) for (const a of T.r || []) { if (a.length < 6) continue; const o = [a[0], a[1] * D]; for (let k = 2; k < a.length; k += 2) o.push(Math.round(a[k] * D * 10) / 10, Math.round(a[k + 1] * D * 10) / 10); rails.push(o); }
  { const P2 = T.p || []; for (let k = 0; k < P2.length; k += 4) if (P2[k] === PT.STATION) stations.push(P2[k + 1] * D, P2[k + 2] * D); }
  const net = [];
  if (mid) for (const st of streets) { if (st.cls >= S.SERVICE || st.pts.length < 2 || st.flags & 16) continue; const a = [st.cls, st.w, st.flags & 2 ? 1 : 0]; for (const [x, z] of st.pts) a.push(Math.round(x * 10) / 10, Math.round(z * 10) / 10); net.push(a); }
  const out = { runways, gates, rails, stations, net, sigs, land: landF.out(), bm: bm.out(), pm: pm.out(), gm: gm.out(), sg: sg.out(), road: road.out(), walk: walk.out(), paint: paint.out(), wires: wires.out(), trees: trees.out(), cols, lamps, water, bridges, ground: {} };
  for (const c in ground) out.ground[c] = ground[c].out();
  return out;
}

self.onmessage = async ev => {
  if (ev.data.land) { LAND = ev.data.land.map(pts => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { pts, x0, x1, z0, z1 }; }); return; }
  const { id, url, lod, opts } = ev.data;
  try {
    let T = cache.get(url);
    if (!T) { const r = await fetch(url); if (!r.ok) throw new Error(r.status + ' ' + url); T = await r.json(); cache.set(url, T); if (cache.size > 80) cache.delete(cache.keys().next().value); }
    const o = buildTile(T, lod, opts || {});
    const tr = [o.land.buffer, ...o.bm.map(b => b.buffer), ...o.pm.map(b => b.buffer), ...o.gm.map(b => b.buffer), ...o.sg.map(b => b.buffer), o.road.buffer, o.walk.buffer, o.paint.buffer, o.wires.buffer, o.trees.buffer, ...Object.values(o.ground).map(g => g.buffer)];
    self.postMessage({ id, ok: true, o }, tr);
  } catch (e) { self.postMessage({ id, ok: false, err: String(e && e.stack || e) }); }
};
const cache = new Map();
