// Flora (v2.8): Japanese tree species built from alpha-tested leaf cards on real branch volumes, one shared material
// and one texture atlas (canvas-drawn, no download), instanced per species. Mid-November Tokyo/Yokohama colours:
// ginkgo (イチョウ) golden, zelkova (ケヤキ) rust-orange, cherry (サクラ) red-brown, camphor (クスノキ) and black pine
// (クロマツ) evergreen, Japanese cedar (スギ) / maple (モミジ) in the Hakone hills. Grass tufts for parks and verges.
// Cost: ~180–420 triangles per near tree (similar to the old blobs), 24 on the far card tree; alphaTest, no blending.
import * as THREE from 'three';

let atlas = null;
// atlas layout (u, v in 0..1): broad leaves [0,.5]×[0,1] · needles [.5,.75]×[.5,1] · bark [.5,.75]×[0,.5] ·
// grass blades [.75,1]×[0,1]
function makeAtlas() {
  if (atlas) return atlas;
  const N = 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.clearRect(0, 0, N, N);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // broad leaves: 2×4 cells, each one leaf spray (≈60 leaves round a twig) on a transparent background — the cards
  // read as foliage, never as squares. Near-white so the per-species tint gives the colour; darker towards the core
  const C = N / 4;
  for (let cell = 0; cell < 8; cell++) { const ox = (cell % 2) * C, oy = Math.floor(cell / 2) * C, cx = ox + C / 2, cy = oy + C / 2;
    g.strokeStyle = 'rgb(90,80,70)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - C * 0.3, cy + C * 0.3); g.lineTo(cx + C * 0.1, cy - C * 0.1); g.stroke();
    for (let i = 0; i < 64; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * C * 0.36, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.9;
      const l = 165 + r() * 90 - (1 - d / (C * 0.36)) * 45 | 0, w = C * (0.05 + r() * 0.035), h = w * (0.42 + r() * 0.18);
      g.save(); g.translate(x, y); g.rotate(a + (r() - 0.5)); g.fillStyle = `rgb(${l},${l},${l})`; g.beginPath(); g.moveTo(-w, 0); g.quadraticCurveTo(0, -h * 1.6, w, 0); g.quadraticCurveTo(0, h * 1.6, -w, 0); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-w, 0); g.lineTo(w * 0.9, 0); g.stroke(); g.restore(); } }
  // needles (pine / cedar): 1×2 cells of radiating needle tufts with gaps
  for (let cell = 0; cell < 2; cell++) { const ox = N / 2, oy = N / 2 + cell * C;
    for (let k = 0; k < 9; k++) { const cx = ox + C * (0.2 + r() * 0.6), cy = oy + C * (0.2 + r() * 0.6);
      for (let i = 0; i < 34; i++) { const a = r() * Math.PI * 2, L = C * (0.06 + r() * 0.08), l = 150 + r() * 100 | 0; g.strokeStyle = `rgb(${l},${l},${l})`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.stroke(); } } }
  // bark: opaque, vertical fissures (tinted per species by vertex colour)
  for (let y = 0; y < N / 2; y += 2) for (let x = N / 2; x < N * 0.75; x += 2) { const v = 120 + (Math.sin(x * 0.21 + Math.sin(y * 0.05) * 3) * 30) + r() * 50 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 2, 2); }
  // grass blades: separate tapered blades with clear gaps between them
  for (let i = 0; i < 46; i++) { const x = N * 0.755 + r() * N * 0.24, y = N, h = N * (0.4 + r() * 0.55), bend = (r() - 0.5) * 90, w = 3 + r() * 3, l = 130 + r() * 120 | 0;
    g.fillStyle = `rgb(${l},${l},${l})`; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x + bend * 0.35, y - h * 0.55, x + bend, y - h); g.quadraticCurveTo(x + bend * 0.35 + w * 0.6, y - h * 0.5, x + w, y); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return (atlas = t);
}

// one material for every tree: the instance colour tints leaves only (attribute aLeaf), bark keeps its vertex colour;
// leaves are lit from an outward "crown" normal (soft, volumetric) and get a little light through them (backlit glow)
let mat = null;
export function floraMaterial() {
  if (mat) return mat;
  mat = new THREE.MeshStandardMaterial({ map: makeAtlas(), alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true, roughness: 0.82, metalness: 0 });
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aLeaf;')
      .replace('#include <color_vertex>', `#include <color_vertex>
      vBare = 0.0;
      #ifdef USE_INSTANCING_COLOR
        vColor.xyz = color.xyz * mix(vec3(1.0), instanceColor.xyz, aLeaf);
        vBare = step(1.5, instanceColor.x) * aLeaf;   // winter: deciduous leaves hidden (colour > 1.5 marks it)
      #endif`).replace('#include <common>', '#include <common>\nvarying float vBare;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBare;').replace('void main() {', 'void main() {\n  if (vBare > 0.5) discard;');
  };
  mat.customProgramCacheKey = () => 'mj-flora';
  return mat;
}

// v2.15: same leaf-tint / winter-bare logic for the real 3D tree models (js/game/neartrees.js): their own texture atlas,
// grey leaves flagged by the aLeaf attribute, white vertex colour on everything
const modelMats = new Map();
export function floraModelMaterial(src) {
  let m = modelMats.get(src); if (m) return m;
  m = new THREE.MeshStandardMaterial({ map: src.map, alphaTest: src.alphaTest || 0.3, side: THREE.DoubleSide, vertexColors: true, roughness: 0.85, metalness: 0 });
  m.onBeforeCompile = floraMaterial().onBeforeCompile; m.customProgramCacheKey = () => 'mj-flora-model';
  modelMats.set(src, m); return m;
}

// ── geometry builder ──
class G {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.leaf = []; this.i = []; }
  quad(a, b, cc, d, nrm, uv, col, leaf) { const o = this.p.length / 3; for (const q of [a, b, cc, d]) this.p.push(...q); for (let k = 0; k < 4; k++) { this.n.push(...nrm); this.c.push(...col); this.leaf.push(leaf); } this.uv.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[3]); this.i.push(o, o + 1, o + 2, o, o + 2, o + 3); }
  // tapered trunk / branch from p0 to p1, k sides, bark uv
  limb(p0, p1, r0, r1, col, k = 6) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz), ax = [dx / L, dy / L, dz / L];
    const up = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; let ux = ax[1] * up[2] - ax[2] * up[1], uy = ax[2] * up[0] - ax[0] * up[2], uz = ax[0] * up[1] - ax[1] * up[0]; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = ay(ax, [ux, uy, uz]);
    for (let j = 0; j < k; j++) { const a0 = j / k * Math.PI * 2, a1 = (j + 1) / k * Math.PI * 2;
      const P = (pp, rr, a) => [pp[0] + (ux * Math.cos(a) + vx[0] * Math.sin(a)) * rr, pp[1] + (uy * Math.cos(a) + vx[1] * Math.sin(a)) * rr, pp[2] + (uz * Math.cos(a) + vx[2] * Math.sin(a)) * rr];
      const am = (a0 + a1) / 2, nrm = [ux * Math.cos(am) + vx[0] * Math.sin(am), uy * Math.cos(am) + vx[1] * Math.sin(am), uz * Math.cos(am) + vx[2] * Math.sin(am)];
      this.quad(P(p0, r0, a0), P(p0, r0, a1), P(p1, r1, a1), P(p1, r1, a0), nrm, [0.5 + j / k * 0.25, 0, 0.5 + (j + 1) / k * 0.25, 0.5 * Math.min(1, L / 6)], col, 0); }
  }
  // a leaf card centred at q, facing a random direction; normal = outward from the crown centre (soft shading)
  card(q, size, cen, rnd, uvR, shade) {
    const a = rnd() * Math.PI * 2, b = (rnd() - 0.5) * 1.2, rx = Math.cos(a), rz = Math.sin(a), h = size / 2;
    const ux = -rz * h, uz = rx * h, vy = h * Math.cos(b), vx = rx * h * Math.sin(b), vz = rz * h * Math.sin(b);
    let nx = q[0] - cen[0], ny = (q[1] - cen[1]) * 0.8 + 0.35, nz = q[2] - cen[2]; const nl = Math.hypot(nx, ny, nz) || 1;
    const cw = uvR[4] || 1, ch = uvR[5] || 1, cell = Math.floor(rnd() * cw * ch), us = (uvR[2] - uvR[0]) / cw, vs = (uvR[3] - uvR[1]) / ch, u0 = uvR[0] + (cell % cw) * us, v0 = uvR[1] + Math.floor(cell / cw) * vs;
    this.quad([q[0] - ux - vx, q[1] - vy, q[2] - uz - vz], [q[0] + ux - vx, q[1] - vy, q[2] + uz - vz], [q[0] + ux + vx, q[1] + vy, q[2] + uz + vz], [q[0] - ux + vx, q[1] + vy, q[2] - uz + vz], [nx / nl, ny / nl, nz / nl], [u0, v0, u0 + us, v0 + vs], [shade, shade, shade], 1);
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aLeaf', new THREE.Float32BufferAttribute(this.leaf, 1)); g.setIndex(this.i); g.computeBoundingSphere(); return g; }
}
function ay(a, u) { return [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]]; }

const LEAF = [0, 0, 0.5, 1, 2, 4], NEEDLE = [0.5, 0.5, 0.75, 1, 1, 2], GRASS = [0.75, 0, 1, 1];
// crowns: list of ellipsoids [cx, cy, cz, rx, ry, rz, cards, cardSize]
function tree(seed, { trunkH, trunkR, bark, limbs = [], crowns, uv = LEAF, needles = false }) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const g = new G();
  g.limb([0, -0.3, 0], [0, trunkH, 0], trunkR, trunkR * 0.6, bark, 7);
  for (const [x, y, z, r] of limbs) g.limb([0, trunkH * 0.75, 0], [x, y, z], r, r * 0.45, bark, 5);
  for (const [cx, cy, cz, rx, ry, rz, n0, sz] of crowns) {
    const n = Math.round(n0 * 1.6); // v2.13.3: fuller crowns (gaps made the trees look moth-eaten)
    for (let k = 0; k < n; k++) {
      // points biased to the shell (dense outer foliage, a few inner cards)
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, rr = Math.pow(rnd(), 0.35), sq = Math.sqrt(1 - u * u);
      const q = [cx + rx * rr * sq * Math.cos(th), cy + ry * rr * u, cz + rz * rr * sq * Math.sin(th)];
      const shade = 0.72 + 0.4 * ((q[1] - (cy - ry)) / (2 * ry)) * (0.7 + 0.3 * rr); // darker underneath and inside
      g.card(q, sz * (0.8 + rnd() * 0.4), [cx, cy - ry * 0.3, cz], rnd, uv, shade);
    }
  }
  return g.geo();
}

// species table: geometry + leaf colour (instance tint, with per-tree variation) + bark colour
const BARK = { grey: [0.42, 0.4, 0.37], brown: [0.36, 0.27, 0.2], red: [0.42, 0.24, 0.18], dark: [0.25, 0.21, 0.18] };
export const SPECIES = {
  ginkgo: { col: [[0.93, 0.74, 0.16], [0.82, 0.7, 0.2], [0.6, 0.62, 0.22]], make: sd => tree(sd, { trunkH: 4.2, trunkR: 0.24, bark: BARK.grey, crowns: [[0, 5.6, 0, 1.7, 2.6, 1.7, 70, 1.5], [0, 8.2, 0, 1.1, 1.5, 1.1, 34, 1.3]] }) },
  zelkova: { col: [[0.62, 0.5, 0.22], [0.42, 0.52, 0.22], [0.36, 0.5, 0.2]], make: sd => tree(sd, { trunkH: 3.4, trunkR: 0.3, bark: BARK.grey, limbs: [[1.8, 6.2, 0.3, 0.14], [-1.6, 6.4, -0.5, 0.14], [0.2, 6.8, 1.7, 0.13]], crowns: [[0, 6.8, 0, 3.2, 2.0, 3.2, 120, 1.7]] }) },
  sakura: { col: [[0.66, 0.38, 0.22], [0.44, 0.48, 0.22], [0.38, 0.47, 0.2]], make: sd => tree(sd, { trunkH: 2.2, trunkR: 0.28, bark: BARK.dark, limbs: [[2.4, 4.0, 0.6, 0.15], [-2.2, 4.1, -0.8, 0.15], [0.4, 4.6, 2.3, 0.13], [-0.6, 4.4, -2.3, 0.13]], crowns: [[0, 4.6, 0, 3.6, 1.5, 3.6, 120, 1.6]] }) },
  camphor: { col: [[0.3, 0.46, 0.2], [0.36, 0.5, 0.22], [0.26, 0.4, 0.18]], make: sd => tree(sd, { trunkH: 2.8, trunkR: 0.34, bark: BARK.brown, limbs: [[1.6, 5.0, 0.4, 0.16], [-1.5, 5.2, -0.4, 0.16]], crowns: [[0, 5.6, 0, 3.0, 2.6, 3.0, 130, 1.7], [1.4, 6.6, 0.8, 1.6, 1.4, 1.6, 30, 1.4]] }) },
  pine: { col: [[0.2, 0.33, 0.18], [0.24, 0.36, 0.2], [0.18, 0.3, 0.17]], make: sd => tree(sd, { trunkH: 6.0, trunkR: 0.22, bark: BARK.red, limbs: [[1.6, 4.6, 0.4, 0.09], [-1.4, 5.4, -0.6, 0.09], [0.6, 6.4, 1.3, 0.08]], uv: NEEDLE, crowns: [[1.5, 4.8, 0.4, 1.4, 0.55, 1.4, 26, 1.4], [-1.3, 5.6, -0.6, 1.3, 0.5, 1.3, 24, 1.3], [0.5, 6.6, 1.2, 1.1, 0.45, 1.1, 20, 1.2], [0, 7.3, 0, 1.2, 0.6, 1.2, 24, 1.2]] }) },
  cedar: { col: [[0.16, 0.27, 0.16], [0.2, 0.3, 0.17], [0.15, 0.24, 0.14]], make: sd => tree(sd, { trunkH: 9.0, trunkR: 0.3, bark: BARK.red, uv: NEEDLE, crowns: [[0, 5.5, 0, 1.9, 2.2, 1.9, 60, 1.6], [0, 8.4, 0, 1.4, 2.0, 1.4, 44, 1.4], [0, 11.0, 0, 0.8, 1.6, 0.8, 26, 1.2]] }) },
  maple: { col: [[0.78, 0.16, 0.1], [0.86, 0.34, 0.1], [0.62, 0.55, 0.18]], make: sd => tree(sd, { trunkH: 2.4, trunkR: 0.2, bark: BARK.dark, limbs: [[1.6, 3.8, 0.4, 0.1], [-1.5, 3.9, -0.5, 0.1]], crowns: [[0, 4.2, 0, 2.6, 1.6, 2.6, 90, 1.3]] }) },
  far: { col: [[0.3, 0.42, 0.2], [0.42, 0.46, 0.2], [0.26, 0.36, 0.18]], make: sd => tree(sd, { trunkH: 3.4, trunkR: 0.26, bark: BARK.brown, crowns: [[0, 5.2, 0, 2.6, 2.4, 2.6, 12, 2.8]] }) },
};
export const SPECIES_IDS = Object.keys(SPECIES);
let geos = null;
export function speciesGeos() { if (!geos) geos = Object.fromEntries(SPECIES_IDS.map((k, i) => [k, SPECIES[k].make(1000 + i * 977)])); return geos; }

// which species stands here: worker variant (0 park/broadleaf · 1 street tree · 2 pine/wood · 3 far) + place + hash
// Hakone hills (far west) → cedar / maple / zelkova; coast & Daikoku-futō → black pine; avenues → ginkgo / zelkova;
// parks → cherry / camphor / zelkova / ginkgo
export function speciesAt(variant, wx, wz, h) {
  if (variant === 3) return 'far';
  if (wx < -30000) return h < 0.55 ? 'cedar' : h < 0.8 ? 'maple' : 'zelkova';
  if (variant === 2) return h < 0.8 ? 'pine' : 'camphor';
  if (variant === 1) return h < 0.62 ? 'ginkgo' : 'zelkova';
  return h < 0.3 ? 'sakura' : h < 0.58 ? 'camphor' : h < 0.8 ? 'zelkova' : h < 0.9 ? 'ginkgo' : 'maple';
}
// v2.9 seasons: autumn = the table above; spring / summer / winter per species (null = bare in winter)
const GREEN = [[0.36, 0.52, 0.2], [0.42, 0.58, 0.24], [0.32, 0.48, 0.2]], FRESH = [[0.55, 0.72, 0.3], [0.6, 0.76, 0.34], [0.5, 0.68, 0.28]];
const SEASON_COL = {
  spring: { sakura: [[1.0, 0.7, 0.8], [1.0, 0.78, 0.86], [0.98, 0.64, 0.76]], maple: FRESH, ginkgo: FRESH, zelkova: FRESH },
  summer: { sakura: GREEN, maple: GREEN, ginkgo: GREEN, zelkova: GREEN, far: GREEN },
  winter: { sakura: null, maple: null, ginkgo: null, zelkova: null, far: [[0.26, 0.32, 0.2], [0.3, 0.3, 0.24], [0.24, 0.3, 0.19]] },
};
let SEASON = 'autumn';
const trees = new Set(); // instanced meshes to recolour when the season changes
export function getSeason() { return SEASON; }
export function speciesColor(sp, h, out) {
  const T = SEASON_COL[SEASON], C = T && sp in T ? T[sp] : SPECIES[sp].col;
  if (C === null) return out.setRGB(2, 2, 2); // bare (winter)
  const k = h * 2.999 | 0, a = C[k]; return out.setRGB(a[0] * (0.88 + h * 0.2), a[1] * (0.9 + (h * 7 % 1) * 0.15), a[2]);
}
// remember an instanced tree mesh (species + per-instance hash) so a season change can recolour it in place
export function registerTrees(im, sp, hs) { im.userData.flora = { sp, hs }; trees.add(im); }
export function setSeason(s) {
  if (s === SEASON) return; SEASON = s; const C = new THREE.Color();
  for (const im of trees) { if (!im.parent && im.userData.floraDead) { trees.delete(im); continue; } const { sp, hs } = im.userData.flora; for (let i = 0; i < hs.length; i++) im.setColorAt(i, speciesColor(sp, hs[i], C)); if (im.instanceColor) im.instanceColor.needsUpdate = true; }
}
export function forgetTrees(root) { root.traverse(o => { if (o.userData?.flora) trees.delete(o); }); }

// grass tuft (crossed blade cards) for parks / verges
let grassGeo = null;
export function grassGeometry() {
  if (grassGeo) return grassGeo;
  const g = new G(); let s = 99; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + rnd() * 0.3, cx = Math.cos(a) * 0.35, cz = Math.sin(a) * 0.35, h = 0.45 + rnd() * 0.25;
    g.quad([-cx, 0, -cz], [cx, 0, cz], [cx, h, cz], [-cx, h, -cz], [0, 1, 0], GRASS, [0.75, 0.8, 0.75], 1); }
  return (grassGeo = g.geo());
}
