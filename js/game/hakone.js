// Hakone Turnpike touge region (separate from Tokyo Bay; reached by spawn / teleport): real terrain from elevation
// tiles, the road from OpenStreetMap, cut-and-fill slopes along it, cedar / broadleaf forest, the Odawara toll gate,
// a viewpoint lay-by half way up and the Daikanyama (大観山) summit car park with its lounge, toilets, vending machines
// and the railing over Lake Ashi with Mt Fuji beyond.
import * as THREE from 'three';
import { HAKONE } from '../../data/map-hakone.js';
import { surface } from './textures.js';

const G = HAKONE.grid, R = HAKONE.road;
export const HAKONE_BOX = { x0: G.x0, z0: G.z0, x1: G.x0 + (G.w - 1) * G.step, z1: G.z0 + (G.h - 1) * G.step };
export const inHakone = (x, z) => x > HAKONE_BOX.x0 && x < HAKONE_BOX.x1 && z > HAKONE_BOX.z0 && z < HAKONE_BOX.z1;
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class Hakone {
  constructor(world) {
    this.w = world; this.ready = false; this.group = new THREE.Group(); this.group.name = 'hakone';
    this.road = world.net.byId.hakone_tp;
    // road-point hash for the skirt / ground lookups
    this.cell = new Map(); this.CS = 40;
    this.road.samples.forEach((q, i) => { const k = Math.floor(q.p.x / 40) + ',' + Math.floor(q.p.z / 40); (this.cell.get(k) || this.cell.set(k, []).get(k)).push(i); });
    world.group.add(this.group);
    Promise.all(['terrain', 'dem'].map(n => fetch(new URL(`../../data/hakone/${n}.bin`, import.meta.url)).then(r => r.arrayBuffer()))).then(([t, d]) => {
      this.H = new Int16Array(t); this.D = new Int16Array(d); this.build(); this.ready = true;
    }).catch(e => console.warn('hakone', e));
  }
  grid(A, x, z) { const fx = (x - G.x0) / G.step, fz = (z - G.z0) / G.step; const i = Math.max(0, Math.min(G.w - 2, Math.floor(fx))), j = Math.max(0, Math.min(G.h - 2, Math.floor(fz))); const u = fx - i, v = fz - j, k = j * G.w + i;
    return ((A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + G.w] * (1 - u) + A[k + G.w + 1] * u) * v) * G.scale; }
  dem(x, z) { return this.D ? this.grid(this.D, x, z) : 0; }
  nearest(x, z) { let best = null; const cx = Math.floor(x / this.CS), cz = Math.floor(z / this.CS); const S = this.road.samples; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const i of this.cell.get((cx + a) + ',' + (cz + b)) || []) { const q = S[i]; const d = (q.p.x - x) ** 2 + (q.p.z - z) ** 2; if (!best || d < best.d) best = { d, i }; } if (best) best.d = Math.sqrt(best.d); return best; }
  lotAt(x, z) { for (const L of HAKONE.lots) { const dx = x - L.x, dz = z - L.z, s = Math.sin(L.yaw), c = Math.cos(L.yaw); const a = dx * s + dz * c, b = dx * c - dz * s; if (Math.abs(a) < L.l / 2 && Math.abs(b) < L.w / 2) return L; } return null; }
  // ground height off the road: car parks → their level; the road-side band → the cut/fill slope; else the terrain
  ground(x, z) {
    if (!this.H) return this.road ? this.road.samples[0].p.y : 0;
    const L = this.lotAt(x, z); if (L) return L.y;
    const n = this.nearest(x, z);
    if (n && n.d < 34) { const q = this.road.samples[n.i]; const hw = (this.road.edgeL - this.road.edgeR) / 2 + 0.6; const base = q.p.y - 0.35; return n.d < hw ? base : base + (this.dem(x, z) - base) * ss(hw, 30, n.d); } // kept below the deck so the road (and its guardrails) always win
    for (const L2 of HAKONE.lots) { const d = Math.hypot(x - L2.x, z - L2.z); if (d < Math.max(L2.l, L2.w) / 2 + 26) { const t = ss(Math.max(L2.l, L2.w) / 2, Math.max(L2.l, L2.w) / 2 + 24, d); return L2.y + (this.dem(x, z) - L2.y) * t; } }
    return this.grid(this.H, x, z);
  }

  build() {
    const g = this.group;
    // ── terrain (carved grid) ──
    const geo = new THREE.PlaneGeometry((G.w - 1) * G.step, (G.h - 1) * G.step, G.w - 1, G.h - 1); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
    for (let k = 0; k < pos.count; k++) {
      const i = k % G.w, j = Math.floor(k / G.w), x = G.x0 + i * G.step, z = G.z0 + j * G.step; const h = this.H[j * G.w + i] * G.scale;
      pos.setXYZ(k, x, h, z);
      const hi = ss(400, 1000, h); col[k * 3] = 0.42 + 0.08 * hi; col[k * 3 + 1] = 0.5 + 0.06 * hi; col[k * 3 + 2] = 0.32; // greener low, paler grassland near the ridge
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const grass = surface('grass', { tile: 6, tint: 0xffffff }).clone(); grass.vertexColors = true;
    const terr = new THREE.Mesh(geo, grass); terr.receiveShadow = true; g.add(terr);
    // ── cut / fill slopes along both sides of the road (follow the road exactly, meet the terrain 30 m out) ──
    const S = this.road.samples, hw = (this.road.edgeL - this.road.edgeR) / 2 + 0.55, rows = [0, 2, 5, 9, 15, 22, 30];
    const sp = [], sc = [], si = [];
    for (const side of [1, -1]) {
      const base = sp.length / 3;
      for (let i = 0; i < S.length; i += 2) {
        const q = S[i];
        for (const r of rows) {
          const d = hw + r, x = q.p.x + q.left.x * d * side, z = q.p.z + q.left.z * d * side;
          // don't run into the other carriageway of a hairpin: stop where another stretch of road is closer
          const n = this.nearest(x, z); const clash = n && Math.abs(n.i - i) > 30 && n.d < r + 2;
          const y = clash ? q.p.y - 0.4 : q.p.y - 0.12 + (this.dem(x, z) - q.p.y) * ss(0, 30, r);
          sp.push(x, y, z); const rock = Math.min(1, Math.abs(y - q.p.y) / Math.max(1, r) * 0.9); sc.push(0.42 + rock * 0.2, 0.48 + rock * 0.08, 0.32 + rock * 0.12);
        }
      }
      const nr = rows.length, ns = Math.ceil(S.length / 2);
      for (let a = 0; a < ns - 1; a++) for (let b = 0; b < nr - 1; b++) { const v = base + a * nr + b; if (side > 0) si.push(v, v + nr, v + 1, v + 1, v + nr, v + nr + 1); else si.push(v, v + 1, v + nr, v + 1, v + nr + 1, v + nr); }
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); sg.setIndex(si); sg.computeVertexNormals();
    const uv = new Float32Array(sp.length / 3 * 2); for (let k = 0; k < sp.length / 3; k++) { uv[k * 2] = sp[k * 3] / 6; uv[k * 2 + 1] = sp[k * 3 + 2] / 6; } sg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const skirt = new THREE.Mesh(sg, grass); skirt.receiveShadow = true; g.add(skirt);
    // ── forest: cedars (sugi) and broadleaf trees, kept off the road band, the lots and the bare ridge tops ──
    const cone = new THREE.ConeGeometry(2.4, 11, 7); cone.translate(0, 8.5, 0); const trunk = new THREE.CylinderGeometry(0.25, 0.35, 4, 5); trunk.translate(0, 2, 0);
    const blob = new THREE.IcosahedronGeometry(3.6, 0); blob.translate(0, 6, 0);
    const mCed = new THREE.MeshStandardMaterial({ color: 0x2c4a2a, roughness: 0.9, flatShading: true }), mBro = new THREE.MeshStandardMaterial({ color: 0x4f6e33, roughness: 0.9, flatShading: true }), mTr = new THREE.MeshStandardMaterial({ color: 0x4a3828, roughness: 1 });
    const spots = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < S.length; i += 6) for (let k = 0; k < 7; k++) {
      const q = S[i], side = rnd() < 0.5 ? 1 : -1, d = 26 + rnd() * rnd() * 520, along = (rnd() - 0.5) * 30;
      const t = q.t, x = q.p.x + q.left.x * d * side + t.x * along, z = q.p.z + q.left.z * d * side + t.z * along;
      const n = this.nearest(x, z); if (n && n.d < 22) continue; if (this.lotAt(x, z) || HAKONE.lots.some(L => Math.hypot(x - L.x, z - L.z) < Math.max(L.l, L.w) / 2 + 20)) continue;
      const y = this.ground(x, z); if (y > 900 && rnd() < 0.7) continue; // the summit ridge is open bamboo-grass
      spots.push([x, y, z, rnd() < 0.62, 0.75 + rnd() * 0.6, rnd() * 6.28]);
    }
    const ced = spots.filter(s => s[3]), bro = spots.filter(s => !s[3]);
    const im = (geo, mat, list) => { const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D(); list.forEach((s, i) => { o.position.set(s[0], s[1] - 0.3, s[2]); o.scale.setScalar(s[4]); o.rotation.y = s[5]; o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = true; m.frustumCulled = false; g.add(m); };
    im(cone, mCed, ced); im(trunk, mTr, spots); im(blob, mBro, bro);
    // ── car parks: asphalt pad, stall lines, wheel stops ──
    const asphalt = surface('asphalt_worn', { tile: 6, tint: 0x8a8a8a }), white = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
    const conc = surface('concrete', { tile: 3 }), dark = new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6, metalness: 0.3 });
    const add = (geo, mat, L, a, y, b, rot = 0) => { const m = new THREE.Mesh(geo, mat); const s = Math.sin(L.yaw), c = Math.cos(L.yaw); m.position.set(L.x + s * a + c * b, y, L.z + c * a - s * b); m.rotation.y = L.yaw + rot; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    this.colliders = [];
    for (const L of HAKONE.lots) {
      add(new THREE.BoxGeometry(L.w, 0.3, L.l), asphalt, L, 0, L.y - 0.13, 0);
      const rows = L.w > 30 ? [-L.w / 2 + 3, L.w / 2 - 3] : [-L.w / 2 + 3];
      for (const b of rows) for (let a = -L.l / 2 + 4; a < L.l / 2 - 3; a += 2.6) add(new THREE.BoxGeometry(5, 0.02, 0.12), white, L, a, L.y + 0.03, b);
      // edge railing towards the view
      for (let a = -L.l / 2; a < L.l / 2; a += 2.5) add(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6), dark, L, a, L.y + 0.55, L.w / 2 - 0.2);
      add(new THREE.BoxGeometry(0.06, 0.06, L.l), dark, L, 0, L.y + 1.08, L.w / 2 - 0.2);
      this.colliders.push(L);
    }
    // summit: lounge with a glass front, toilet block, vending machines, the 大観山 sign
    const top = HAKONE.lots[0];
    const glass = new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.08, metalness: 0.5, emissive: 0xffe2b0, emissiveIntensity: 0 });
    this.loungeGlass = glass;
    add(new THREE.BoxGeometry(14, 6, 30), conc, top, -2, top.y + 3, -top.w / 2 - 8);
    add(new THREE.BoxGeometry(0.2, 4.2, 26), glass, top, -2, top.y + 2.4, -top.w / 2 - 0.9);
    add(new THREE.BoxGeometry(16, 0.5, 32), dark, top, -2, top.y + 6.2, -top.w / 2 - 8);
    add(new THREE.BoxGeometry(8, 3.2, 6), conc, top, top.l / 2 - 8, top.y + 1.6, -top.w / 2 - 4);
    const vm = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4, emissive: 0xdde8ff, emissiveIntensity: 0.25 });
    for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(1, 1.85, 0.8), vm, top, top.l / 2 - 14 + k * 1.1, top.y + 0.93, -top.w / 2 - 0.6);
    // sign
    const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#5a3a22'; x.fillRect(0, 0, 512, 160); x.fillStyle = '#f6efe1'; x.font = '800 78px "Hiragino Mincho ProN","Noto Serif JP",serif'; x.textAlign = 'center'; x.fillText('大観山', 256, 92); x.font = '600 26px system-ui'; x.fillText('DAIKANYAMA  1,011 m', 256, 138);
    const st = new THREE.CanvasTexture(c); st.colorSpace = THREE.SRGBColorSpace;
    add(new THREE.BoxGeometry(3.2, 1.0, 0.1), new THREE.MeshStandardMaterial({ map: st, roughness: 0.7 }), top, -top.l / 2 + 6, top.y + 2.1, top.w / 2 - 1.2, Math.PI / 2);
    for (const dz of [-1.3, 1.3]) add(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), dark, top, -top.l / 2 + 6 + dz * 0, top.y + 1.3, top.w / 2 - 1.2 + dz);
    // Odawara toll gate at the foot of the road
    const s0 = S[25], t0 = S[25].t;
    const booth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, 4), conc); booth.position.set(s0.p.x, s0.p.y + 1.3, s0.p.z); booth.rotation.y = Math.atan2(t0.x, t0.z); g.add(booth);
    this.w.addCollider(s0.p.x, s0.p.z, 0.55, 2, Math.atan2(t0.x, t0.z), s0.p.y - 1, s0.p.y + 3);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 9), new THREE.MeshStandardMaterial({ color: 0xc7262e, roughness: 0.5 })); roof.position.set(s0.p.x, s0.p.y + 5.6, s0.p.z); roof.rotation.y = booth.rotation.y; g.add(roof);
    for (const o of [-7, 7]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.4, 0.5), conc); pl.position.set(s0.p.x + s0.left.x * o, s0.p.y + 2.7, s0.p.z + s0.left.z * o); g.add(pl); }
  }
  update(env) { if (this.loungeGlass) this.loungeGlass.emissiveIntensity = (env?.night ?? 0) * 1.2; }
}
