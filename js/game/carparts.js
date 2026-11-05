// Detail parts for the procedural cars: material library (CC0 textures + procedural canvases),
// a geometry "kit" that merges many small parts per material (few draw calls), wheels/tyres/brakes,
// the lamp material (all lamps of a car in ONE draw call, driven by a per-lamp intensity array)
// and the full cockpit interior. Local axes as in carmodel.js: +Z forward, +Y up, +X = car's left.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
export const helpers = { clamp, lerp, sstep, spow };

// ───────────────────────── textures ─────────────────────────
const TEX_BASE = new URL('../../assets/textures/', import.meta.url);
const texLoader = new THREE.TextureLoader();
const texCache = new Map();
export function fileTex(name, map, rep = 1, srgb = false) {
  const key = name + '/' + map;
  let base = texCache.get(key);
  if (!base) {
    base = texLoader.load(new URL(`${name}/${map}.jpg`, TEX_BASE).href);
    base.wrapS = base.wrapT = THREE.RepeatWrapping; base.anisotropy = 4;
    if (srgb) base.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, base);
  }
  if (rep === 1) return base;
  const t = base.clone(); t.repeat.set(rep, rep); return t;
}
export function canvasTex(key, w, h, draw, { srgb = true, repeat = null } = {}) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  texCache.set(key, t);
  return t;
}
let seed = 1234567;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// fine woven fabric bump (seat inserts, headliner, carpet)
export const fabricTex = () => canvasTex('fabric', 256, 256, (g, W, H) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
    const v = 110 + ((x / 4 + y / 4) % 2) * 40 + rnd() * 50; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 3, 3);
  }
}, { srgb: false });
// brushed aluminium streaks
const brushedTex = () => canvasTex('brushed', 512, 64, (g, W, H) => {
  g.fillStyle = '#b8bcc0'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) { const v = 150 + rnd() * 90 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},0.35)`; g.fillRect(rnd() * W, rnd() * H, 40 + rnd() * 200, 1); }
});
// metallic flake normal map (paint)
export const flakeTex = () => canvasTex('flake', 256, 256, (g, W, H) => {
  const id = g.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const a = rnd() * TAU, r = Math.pow(rnd(), 2) * 0.6;
    id.data[i * 4] = 128 + Math.cos(a) * r * 127; id.data[i * 4 + 1] = 128 + Math.sin(a) * r * 127; id.data[i * 4 + 2] = 255; id.data[i * 4 + 3] = 255;
  }
  g.putImageData(id, 0, 0);
}, { srgb: false });
// woodgrain (luxury trim)
const woodTex = () => canvasTex('wood', 512, 128, (g, W, H) => {
  g.fillStyle = '#4a2a14'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y++) { const k = Math.sin(y * 0.35 + Math.sin(y * 0.05) * 4) * 0.5 + 0.5; g.fillStyle = `rgba(${90 + k * 50},${50 + k * 26},${22 + k * 10},0.7)`; g.fillRect(0, y, W, 1); }
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(30,15,6,0.25)'; g.fillRect(rnd() * W, rnd() * H, 30 + rnd() * 120, 1); }
});
// honeycomb grille (map + bump)
export const honeyTex = () => canvasTex('honey', 128, 128, (g, W, H) => {
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#060606';
  const r = 14, dx = r * 1.732;
  for (let row = -1; row < 7; row++) for (let col = -1; col < 6; col++) {
    const cx = col * dx + (row % 2 ? dx / 2 : 0), cy = row * r * 1.5;
    g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3)); } g.fill();
  }
}, { srgb: false });
// brake disc face (cap UVs of a cylinder are a circle in the unit square)
const discTex = () => canvasTex('disc', 256, 256, (g, W, H) => {
  const cx = W / 2, cy = H / 2;
  g.fillStyle = '#2b2c2e'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(cx, cy, 40, cx, cy, 128);
  gr.addColorStop(0, '#5b5d60'); gr.addColorStop(0.42, '#55575a'); gr.addColorStop(0.45, '#9a9da1'); gr.addColorStop(0.97, '#8d9094'); gr.addColorStop(1, '#3a3b3d');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 128, 0, TAU); g.fill();
  for (let i = 0; i < 1200; i++) { const a = rnd() * TAU, rr = 60 + rnd() * 66; g.fillStyle = `rgba(${rnd() < 0.5 ? 60 : 200},${rnd() < 0.5 ? 60 : 200},${rnd() < 0.5 ? 60 : 200},0.12)`; g.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.5, 1.5); }
  // concentric machining rings
  g.strokeStyle = 'rgba(40,40,40,0.25)'; for (let rr = 62; rr < 126; rr += 3) { g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke(); }
  // curved slots + drilled holes
  g.strokeStyle = '#1c1c1d'; g.lineWidth = 3;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30, 72, a + 0.15, a + 0.55); g.stroke(); }
  g.fillStyle = '#141414'; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + 0.12; for (const rr of [80, 104]) { g.beginPath(); g.arc(cx + Math.cos(a + rr * 0.003) * rr, cy + Math.sin(a + rr * 0.003) * rr, 3, 0, TAU); g.fill(); } }
  // hat
  g.fillStyle = '#3e3f42'; g.beginPath(); g.arc(cx, cy, 56, 0, TAU); g.fill();
  g.fillStyle = '#1a1a1b'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34, 6, 0, TAU); g.fill(); }
});
// tyre: u = around, v = 11 bands of the lathe profile (0..3 outer sidewall, 4..7 tread, 8..11 inner)
const tyreTex = () => canvasTex('tyre', 2048, 352, (g, W, H) => {
  const band = j => [H - (j + 1) * 32, 32];
  g.fillStyle = '#1b1b1c'; g.fillRect(0, 0, W, H);
  // tread grooves (circumferential + lateral sipes)
  const [ty] = band(4); const th = 32 * 3;
  g.fillStyle = '#121213'; g.fillRect(0, ty - 64, W, th);
  g.fillStyle = '#050505';
  for (const f of [0.22, 0.5, 0.78]) g.fillRect(0, ty - 64 + th * f - 3, W, 6);
  for (let x = 0; x < W; x += 22) { g.save(); g.translate(x, ty - 64); g.rotate(0.35); g.fillRect(0, 0, 3, th * 0.2); g.fillRect(4, th * 0.55, 3, th * 0.25); g.restore(); }
  // outer sidewall lettering (bands 1-2)
  const [sy] = band(2);
  g.fillStyle = '#58595b'; g.font = 'bold 30px Arial, sans-serif'; g.textBaseline = 'middle';
  for (let k = 0; k < 2; k++) {
    const x0 = k * W / 2;
    g.save(); g.translate(x0 + 120, sy + 32); g.fillText('MIDNIGHT  SPORT  RADIAL', 0, 0); g.restore();
    g.save(); g.translate(x0 + 700, sy + 32); g.font = 'bold 22px Arial, sans-serif'; g.fillText('TUBELESS   M+S   245/40ZR18  97Y', 0, 0); g.restore();
  }
  g.fillStyle = 'rgba(255,255,255,0.025)'; for (let i = 0; i < 4000; i++) g.fillRect(rnd() * W, rnd() * H, 2, 1);
});
const tyreBump = () => {
  const src = tyreTex();
  if (texCache.has('tyreBump')) return texCache.get('tyreBump');
  const t = new THREE.CanvasTexture(src.image); t.wrapS = t.wrapT = THREE.RepeatWrapping; texCache.set('tyreBump', t); return t;
};
// steering-wheel leather with stitching; torus uv: u around the rim, v around the tube (0.75 = driver side)
export const wheelLeatherTex = (marker) => canvasTex('swheel' + marker, 1024, 128, (g, W, H) => {
  g.fillStyle = '#1e1e20'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 6000; i++) { const v = 20 + rnd() * 30 | 0; g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.fillRect(rnd() * W, rnd() * H, 2, 2); }
  const stitch = (vy, col) => { g.fillStyle = col; for (let x = 0; x < W; x += 9) g.fillRect(x, H - vy * H - 1, 5, 2); };
  const sc = marker === 'red' ? '#b02020' : marker === 'blue' ? '#3050b0' : '#6a6a6e';
  stitch(0.69, sc); stitch(0.81, sc); stitch(0.19, sc); stitch(0.31, sc);
  if (marker !== 'none') { g.fillStyle = marker === 'red' ? '#c01818' : marker === 'blue' ? '#2846b8' : '#d0a020'; g.fillRect(W * 0.245, 0, W * 0.012, H); }
});

// ───────────────────────── material library ─────────────────────────
const MC = new Map();
const memo = (k, f) => { if (!MC.has(k)) MC.set(k, f()); return MC.get(k); };
export const M = {
  chrome: () => memo('chrome', () => new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.06, metalness: 1 })),
  satin: () => memo('satin', () => new THREE.MeshStandardMaterial({ color: 0xb4b7bb, roughness: 0.28, metalness: 1, map: brushedTex() })),
  black: () => memo('black', () => new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.6, metalness: 0 })),
  gloss: () => memo('gloss', () => new THREE.MeshPhysicalMaterial({ color: 0x060607, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 })),
  rubber: () => memo('rubber', () => new THREE.MeshStandardMaterial({ color: 0x111112, roughness: 0.9 })),
  housing: () => memo('housing', () => new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.18, metalness: 1 })),
  housingDark: () => memo('housingDark', () => new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide })),
  lens: () => memo('lens', () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.16, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false })),
  lensRed: () => memo('lensRed', () => new THREE.MeshPhysicalMaterial({ color: 0xff2a1a, roughness: 0.04, transparent: true, opacity: 0.38, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false })),
  grille: () => memo('grille', () => { const t = honeyTex().clone(); t.repeat.set(14, 14); return new THREE.MeshStandardMaterial({ color: 0x1a1a1b, roughness: 0.45, metalness: 0.3, bumpMap: t, bumpScale: 3, map: t }); }),
  disc: (lod) => memo('disc' + lod, () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.85, map: lod === 'low' ? null : discTex() })),
  discEdge: () => memo('discEdge', () => new THREE.MeshStandardMaterial({ color: 0x5c5e61, roughness: 0.5, metalness: 0.8 })),
  tyre: (lod) => memo('tyre' + lod, () => lod === 'low'
    ? new THREE.MeshStandardMaterial({ color: 0x161617, roughness: 0.92 })
    : new THREE.MeshStandardMaterial({ color: 0xffffff, map: tyreTex(), bumpMap: tyreBump(), bumpScale: 2.5, roughness: 0.88, metalness: 0 })),
  // interior
  carpet: () => memo('carpet', () => { const t = fabricTex().clone(); t.repeat.set(30, 30); return new THREE.MeshStandardMaterial({ color: 0x151516, roughness: 1, bumpMap: t, bumpScale: 2 }); }),
  dash: (hex = 0x222326) => memo('dash' + hex, () => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.78, metalness: 0, normalMap: fileTex('plastic_black', 'nor_gl', 6), normalScale: new THREE.Vector2(0.35, 0.35) })),
  leather: (hex = 0x1c1c1e) => memo('leather' + hex, () => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.58, metalness: 0, normalMap: fileTex('leather', 'nor_gl', 3), normalScale: new THREE.Vector2(0.7, 0.7), roughnessMap: fileTex('leather', 'rough', 3) })),
  fabric: (hex = 0x2a2a2e) => memo('fabric' + hex, () => { const t = fabricTex().clone(); t.repeat.set(24, 24); return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95, bumpMap: t, bumpScale: 1.2 }); }),
  alcantara: (hex = 0x1e1e20) => memo('alc' + hex, () => { const t = fabricTex().clone(); t.repeat.set(60, 60); return new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.92, bumpMap: t, bumpScale: 0.6, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x555555) }); }),
  headliner: (hex = 0x3a3a3c) => memo('head' + hex, () => { const t = fabricTex().clone(); t.repeat.set(14, 14); return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.97, bumpMap: t, bumpScale: 1, side: THREE.BackSide }); }),
  carbon: () => memo('carbon', () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: fileTex('carbon_fibre', 'diff', 4, true), normalMap: fileTex('carbon_fibre', 'nor_gl', 4), roughness: 0.3, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03 })),
  wood: () => memo('wood', () => { const t = woodTex(); t.repeat.set(3, 3); return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.05 }); }),
  wheelLeather: (marker) => memo('wl' + marker, () => new THREE.MeshStandardMaterial({ map: wheelLeatherTex(marker), roughness: 0.55, normalMap: (() => { const t = fileTex('leather', 'nor_gl'); const c = t.clone(); c.repeat.set(12, 1.5); return c; })(), normalScale: new THREE.Vector2(0.6, 0.6) })),
  mirror: () => memo('mirror', () => new THREE.MeshStandardMaterial({ color: 0xbfc4c8, roughness: 0.0, metalness: 1, envMapIntensity: 1.4 })),
  noShadow: () => memo('noShadow', () => new THREE.MeshDepthMaterial({ depthWrite: false, colorWrite: false })),
};

// ───────────────────────── geometry kit ─────────────────────────
// project UVs in metres (box mapping) so tiled materials have a consistent texel density
export function boxUV(g, scale = 1) {
  const p = g.attributes.position, n = g.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); } else if (ay >= az) { u = p.getX(i); v = p.getZ(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u * scale; uv[i * 2 + 1] = v * scale;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function T(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, order = 'XYZ') {
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, order)), _s.set(sx, sy, sz));
}
export class Kit {
  constructor() { this.buckets = new Map(); }
  // mat may be an array (uses geometry groups); opts.uv: 'keep' keeps original uvs, default box-projects; opts.lamp = lamp id
  add(geo, mat, m4 = null, opts = {}) {
    if (!geo) return this;
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (opts.uv !== 'keep' || !g.attributes.uv) boxUV(g, opts.uvScale || 1);
    if (m4) g.applyMatrix4(m4);
    const useGroups = (Array.isArray(mat) || opts.lampByGroup) && g.groups.length;
    const groups = useGroups ? g.groups : [{ start: 0, count: g.attributes.position.count, materialIndex: 0 }];
    for (const gr of groups) {
      const mm = Array.isArray(mat) ? mat[gr.materialIndex] : mat;
      const lid = opts.lampByGroup ? gr.materialIndex : opts.lamp;
      if (!mm) continue;
      let sub = g;
      if (groups.length > 1 || gr.start !== 0 || gr.count !== g.attributes.position.count) {
        sub = new THREE.BufferGeometry();
        for (const k of Object.keys(g.attributes)) { const a = g.attributes[k]; sub.setAttribute(k, new THREE.BufferAttribute(a.array.slice(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), a.itemSize)); }
      }
      if (lid !== undefined) {
        const c = new Float32Array(sub.attributes.position.count * 3); for (let i = 0; i < c.length; i += 3) c[i] = lid / 15;
        sub.setAttribute('color', new THREE.BufferAttribute(c, 3));
      } else if (mm.vertexColors && !sub.attributes.color) sub.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sub.attributes.position.count * 3).fill(1), 3));
      else if (!mm.vertexColors && sub.attributes.color) sub.deleteAttribute('color');
      let arr = this.buckets.get(mm); if (!arr) this.buckets.set(mm, arr = []); arr.push(sub);
    }
    return this;
  }
  build(parent, { offset = null, shadow = true, noShadowFor = null, renderOrder = 0 } = {}) {
    const out = [];
    for (const [mat, arr] of this.buckets) {
      const mg = arr.length === 1 ? arr[0] : mergeGeometries(arr, false);
      if (!mg) continue;
      if (offset) mg.translate(-offset.x, -offset.y, -offset.z);
      const mesh = new THREE.Mesh(mg, mat);
      mesh.castShadow = shadow && !mat.transparent; mesh.receiveShadow = true;
      if (mat.transparent) { mesh.customDepthMaterial = M.noShadow(); mesh.renderOrder = renderOrder || 2; }
      if (noShadowFor && noShadowFor(mat)) mesh.customDepthMaterial = M.noShadow();
      parent.add(mesh); out.push(mesh);
    }
    this.buckets.clear();
    return out;
  }
}

export function roundedBox(w, h, l, r, seg = 3) {
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, l / 2 - 1e-4);
  const g = new THREE.BoxGeometry(w, h, l, seg * 2, seg * 2, seg * 2);
  const p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const hx = w / 2 - r, hy = h / 2 - r, hz = l / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
    const d = v.sub(c); if (d.lengthSq() > 0) d.setLength(r);
    p.setXYZ(i, c.x + d.x, c.y + d.y, c.z + d.z);
  }
  g.computeVertexNormals();
  return g;
}
// extrude a 2D profile given in (z, y) across X (width w, centred), rounded side edges
export function profileX(pts, w, bevel = 0.02, curveSeg = 8) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    if (p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, w - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3, curveSegments: curveSeg });
  g.rotateY(-Math.PI / 2); // shape x → z, extrude z → -x
  g.translate(w / 2 - bevel, 0, 0);
  return g;
}
// capsule-like padded tube along +Y; cross-section in (x, z), front = +z. Used for seats / bolsters.
// wFn(t) = half width, dFn(t) = half depth, dent(t,xn) = front-face depression, insert(t,xn) → true for insert faces
export function padGeo(len, wFn, dFn, dent, insert, rows = 22, cols = 28, capR = 0.035) {
  const ring = [];
  const nCap = 4;
  for (let i = 0; i <= nCap; i++) { const a = (1 - i / nCap) * Math.PI / 2; ring.push({ y: capR - capR * Math.sin(a), s: Math.max(0.02, Math.cos(a)) }); }
  for (let i = 1; i < rows; i++) ring.push({ y: lerp(capR, len - capR, i / rows), s: 1 });
  for (let i = 0; i <= nCap; i++) { const a = (i / nCap) * Math.PI / 2; ring.push({ y: len - capR + capR * Math.sin(a), s: Math.max(0.02, Math.cos(a)) }); }
  const pos = [], idx = [], ins = [];
  for (let r = 0; r < ring.length; r++) {
    const { y, s } = ring[r]; const t = y / len;
    const hw = wFn(t), hd = dFn(t);
    for (let c = 0; c < cols; c++) {
      const a = c / cols * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const x = spow(ca, 0.5) * hw * s;
      let z = spow(sa, 0.5) * hd * s;
      if (sa > 0) z -= dent(t, Math.abs(x) / hw) * Math.pow(sa, 0.6) * s;
      pos.push(x, y, z);
    }
  }
  const g0 = [], g1 = [];
  for (let r = 0; r < ring.length - 1; r++) for (let c = 0; c < cols; c++) {
    const c1 = (c + 1) % cols;
    const a = r * cols + c, b = r * cols + c1, d = (r + 1) * cols + c, e = (r + 1) * cols + c1;
    const ac = (c + 0.5) / cols * TAU; const t = ring[r].y / len;
    const isIns = Math.sin(ac) > 0.45 && ring[r].s > 0.99 && ring[r + 1].s > 0.99 && insert(t, Math.abs(Math.cos(ac)));
    (isIns ? g1 : g0).push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([...g0, ...g1]);
  g.addGroup(0, g0.length, 0); g.addGroup(g0.length, g1.length, 1);
  g.computeVertexNormals();
  return g;
}

// ───────────────────────── lamps ─────────────────────────
// One material per car for every emissive lamp element; vertex colour .r encodes the lamp id.
export const LAMP = { HEAD: 1, HIGH: 2, POS: 3, TAIL: 4, STOP: 5, INDL: 6, INDR: 7, REV: 8, FOG: 9, PLATE: 10, DRL: 11, MARKL: 12, MARKR: 13 };
const LAMP_C = [0x000000, 0xfff2df, 0xf2f6ff, 0xfff0dc, 0xff1206, 0xff1206, 0xff9a00, 0xff9a00, 0xffffff, 0xff1a0a, 0xfff6ea, 0xeef4ff, 0xff9a00, 0xff9a00, 0, 0];
const LAMP_B = [0x111111, 0xc8ccd0, 0xc8ccd0, 0xc8ccd0, 0x6a0b08, 0x6a0b08, 0x9a5c00, 0x9a5c00, 0xd8dadc, 0x6a0b08, 0xbbbbbb, 0xd5d9dd, 0x9a5c00, 0x9a5c00, 0, 0];
const vecArr = list => { const a = new Float32Array(48); list.forEach((h, i) => { const c = new THREE.Color(h); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }); return a; };
const LAMP_CV = vecArr(LAMP_C), LAMP_BV = vecArr(LAMP_B);
export function lampMaterial() {
  const I = new Float32Array(16);
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.22, metalness: 0.4, emissive: 0xffffff });
  m.userData.lampI = I;
  m.onBeforeCompile = sh => {
    sh.uniforms.lampI = { value: I }; sh.uniforms.lampC = { value: LAMP_CV }; sh.uniforms.lampB = { value: LAMP_BV };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float lampI[16];\nuniform vec3 lampC[16];\nuniform vec3 lampB[16];')
      .replace('#include <color_fragment>', 'int lampId = int(vColor.r * 15.0 + 0.5); diffuseColor.rgb = lampB[lampId];')
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = lampC[lampId] * lampI[lampId];');
  };
  m.customProgramCacheKey = () => 'mj-lamp-1';
  return m;
}
// additive flare sprites for all lamps of a car (1 draw call); directional (fdir) so they only show from the lit side
let glowTexCache = null;
function glowTex() {
  if (glowTexCache) return glowTexCache;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.08, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.25)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 62, 128, 4); // horizontal streak
  glowTexCache = new THREE.CanvasTexture(c); return glowTexCache;
}
export function flarePoints(list, lampI) { // list: [{p:Vector3, id, size, dir:Vector3}]
  if (!list.length) return null;
  const pos = [], id = [], sz = [], dir = [];
  for (const f of list) { pos.push(f.p.x, f.p.y, f.p.z); id.push(f.id); sz.push(f.size); dir.push(f.dir.x, f.dir.y, f.dir.z); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('lid', new THREE.Float32BufferAttribute(id, 1));
  g.setAttribute('fsize', new THREE.Float32BufferAttribute(sz, 1));
  g.setAttribute('fdir', new THREE.Float32BufferAttribute(dir, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { lampI: { value: lampI }, lampC: { value: LAMP_CV }, map: { value: glowTex() }, scale: { value: 600 } },
    vertexShader: `attribute float lid; attribute float fsize; attribute vec3 fdir; uniform float lampI[16]; uniform vec3 lampC[16]; uniform float scale; varying vec3 vCol;
      void main(){ int i = int(lid + 0.5); float I = lampI[i];
        vec4 wp = modelMatrix * vec4(position, 1.0); vec3 n = normalize(mat3(modelMatrix) * fdir);
        float k = smoothstep(-0.1, 0.7, dot(n, normalize(cameraPosition - wp.xyz)));
        vec4 mv = viewMatrix * wp; float d = max(0.3, -mv.z);
        float s = I > 0.0 ? fsize * scale / d * (0.55 + 0.25 * sqrt(I)) * k : 0.0;
        gl_PointSize = clamp(s, 0.0, 380.0); vCol = lampC[i] * min(1.0, I * 0.35) * k * (0.7 + min(1.0, d / 25.0));
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; varying vec3 vCol; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vCol * t.rgb * t.a, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const pts = new THREE.Points(g, mat); pts.renderOrder = 5; pts.frustumCulled = true;
  pts.onBeforeRender = (r, s, cam) => { mat.uniforms.scale.value = r.getDrawingBufferSize(_v2).y * 0.5 * cam.projectionMatrix.elements[5]; };
  return pts;
}
const _v2 = new THREE.Vector2();

// ───────────────────────── wheels ─────────────────────────
const wheelCache = new Map();
function tireGeometry(R, w, rimR, lod, mirror = false) {
  const key = `t${R.toFixed(3)}_${w.toFixed(3)}_${rimR.toFixed(3)}_${lod}_${mirror}`;
  if (wheelCache.has(key)) return wheelCache.get(key);
  const side = R - rimR;
  const prof = [
    [rimR - 0.004, -w * 0.45], [rimR + side * 0.3, -w * 0.5], [rimR + side * 0.72, -w * 0.52], [R - 0.022, -w * 0.5],
    [R - 0.005, -w * 0.43], [R, -w * 0.3], [R, w * 0.3], [R - 0.005, w * 0.43], [R - 0.022, w * 0.5],
    [rimR + side * 0.72, w * 0.52], [rimR + side * 0.3, w * 0.5], [rimR - 0.004, w * 0.45],
  ].map(([r, x]) => new THREE.Vector2(r, x));
  const g = new THREE.LatheGeometry(prof, lod === 'low' ? 28 : lod === 'mid' ? 48 : 72);
  g.rotateZ(Math.PI / 2);
  if (mirror) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }
  g.userData.shared = true;
  wheelCache.set(key, g);
  return g;
}
function rimGeometry(style, rimR, w, lod) {
  const key = `r${style}_${rimR.toFixed(3)}_${w.toFixed(3)}_${lod}`;
  if (wheelCache.has(key)) return wheelCache.get(key);
  const face = new THREE.Shape(); face.absarc(0, 0, rimR * 0.985, 0, TAU, false);
  const spokeHoles = (n, inner, outer, widthFrac, twist = 0) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU + twist, a1 = ((i + 1) / n) * TAU + twist;
      const gap = (a1 - a0) * widthFrac, ai = a0 + gap / 2, ae = a1 - gap / 2;
      const h = new THREE.Path();
      h.moveTo(Math.cos(ai) * inner, Math.sin(ai) * inner);
      h.lineTo(Math.cos(ai + twist * 0.4) * outer, Math.sin(ai + twist * 0.4) * outer);
      h.absarc(0, 0, outer, ai + twist * 0.4, ae + twist * 0.4, false);
      h.lineTo(Math.cos(ae) * inner, Math.sin(ae) * inner);
      h.absarc(0, 0, inner, ae, ai, true);
      face.holes.push(h);
    }
  };
  const R = rimR * 0.86;
  switch (style) {
    case 'mesh': spokeHoles(10, R * 0.36, R, 0.42); break;
    case '6spoke': spokeHoles(6, R * 0.3, R, 0.3); break;
    case 'turbine': spokeHoles(12, R * 0.42, R, 0.55, 0.25); break;
    case 'multi': spokeHoles(14, R * 0.36, R, 0.45); break;
    case 'steel': spokeHoles(8, R * 0.62, R * 0.8, 0.6); break;
    case 'deepdish': spokeHoles(5, R * 0.28, R * 0.62, 0.38); break;
    case 'aero': spokeHoles(5, R * 0.55, R * 0.92, 0.75); break;
    case 'twin5': spokeHoles(10, R * 0.32, R, 0.38, 0.06); break;
    default: spokeHoles(5, R * 0.3, R, 0.34);
  }
  const depth = style === 'deepdish' ? 0.03 : 0.02;
  const g = new THREE.ExtrudeGeometry(face, { depth, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: lod === 'low' ? 1 : 2, curveSegments: lod === 'low' ? 20 : 48 });
  g.rotateY(Math.PI / 2); // face → +X outward
  // concave dish: hub sits inboard of the lip; spokes slope outwards
  const concave = style === 'deepdish' ? 0.055 : style === 'mesh' || style === 'multi' ? 0.04 : style === 'steel' ? 0.012 : 0.03;
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getY(i), p.getZ(i)) / rimR; p.setX(i, p.getX(i) - concave * Math.pow(1 - clamp(r, 0, 1), 1.3)); }
  g.computeVertexNormals();
  const parts = [g.toNonIndexed()];
  const seg = lod === 'low' ? 24 : 48;
  const barrel = new THREE.CylinderGeometry(rimR, rimR * 0.97, w * 0.9, seg, 1, true); barrel.rotateZ(Math.PI / 2); barrel.translate(-w * 0.45 + depth, 0, 0);
  parts.push(barrel.toNonIndexed());
  const lip = new THREE.TorusGeometry(rimR, 0.009, 8, seg); lip.rotateY(Math.PI / 2); lip.translate(depth + 0.003, 0, 0); parts.push(lip.toNonIndexed());
  const hub = new THREE.CylinderGeometry(rimR * 0.16, rimR * 0.2, 0.025, 24); hub.rotateZ(Math.PI / 2); hub.translate(depth - concave + 0.01, 0, 0); parts.push(hub.toNonIndexed());
  if (lod !== 'low') {
    for (let i = 0; i < 5; i++) { // lug nuts
      const a = i / 5 * TAU; const n = new THREE.CylinderGeometry(0.0085, 0.0095, 0.022, 6); n.rotateZ(Math.PI / 2);
      n.translate(depth - concave + 0.016, Math.cos(a) * rimR * 0.27, Math.sin(a) * rimR * 0.27); parts.push(n.toNonIndexed());
    }
  }
  for (const q of parts) { q.deleteAttribute('uv'); }
  const merged = mergeGeometries(parts);
  merged.userData.shared = true;
  wheelCache.set(key, merged);
  return merged;
}
function caliperGeometry(rimR) {
  const key = `cal${rimR.toFixed(3)}`;
  if (wheelCache.has(key)) return wheelCache.get(key);
  const r0 = rimR * 0.62, r1 = rimR * 0.86, a = 0.62;
  const s = new THREE.Shape(); s.absarc(0, 0, r1, -a / 2, a / 2, false); s.absarc(0, 0, r0, a / 2, -a / 2, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -0.035); g.rotateY(Math.PI / 2);
  g.userData.shared = true;
  wheelCache.set(key, g);
  return g;
}
export function buildWheel(P, S, front, left, lod = 'full') {
  const steer = new THREE.Group(), camber = new THREE.Group(), spin = new THREE.Group();
  steer.add(camber); camber.add(spin);
  const tire = new THREE.Mesh(tireGeometry(P.wheelR, P.tireW, P.rimR, lod, !left), M.tyre(lod));
  tire.castShadow = true;
  const rimMat = new THREE.MeshStandardMaterial({ color: S.rimColor, metalness: 0.9, roughness: S.rimColor === '#1a1a1a' ? 0.45 : 0.24 });
  const rim = new THREE.Mesh(rimGeometry(S.wheel, P.rimR, P.tireW, lod), rimMat);
  rim.position.x = P.tireW * 0.2; rim.castShadow = true;
  spin.add(tire, rim);
  if (lod !== 'low') { // centre cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(P.rimR * 0.1, P.rimR * 0.11, 0.012, 20), M.chrome()); cap.rotation.z = Math.PI / 2;
    const cc = S.wheel === 'mesh' ? 0.04 : S.wheel === 'deepdish' ? 0.055 : 0.03;
    cap.position.x = rim.position.x + 0.02 - cc + 0.022; spin.add(cap);
  }
  // brake disc (vented: two faces + edge) + caliper — do not spin
  const dR = P.rimR * 0.8;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(dR, dR, 0.028, lod === 'low' ? 20 : 40), [M.discEdge(), M.disc(lod), M.disc(lod)]);
  disc.rotation.z = Math.PI / 2; disc.position.x = -P.tireW * 0.06 + 0.01;
  const calMat = new THREE.MeshPhysicalMaterial({ color: S.caliper, roughness: 0.35, clearcoat: 0.6 });
  const cal = new THREE.Mesh(caliperGeometry(P.rimR), calMat);
  cal.position.x = disc.position.x; cal.rotation.x = front ? 0.5 : -0.5 + Math.PI;
  camber.add(disc, cal);
  if (!left) camber.scale.x = -1;
  steer.position.set(left ? P.track : -P.track, P.wheelR, front ? P.axF : P.axR);
  return { steer, camber, spin, rimMat, front, left, radius: P.wheelR, base: steer.position.clone() };
}

// ───────────────────────── interior ─────────────────────────
const THEME = {
  default: { seat: 0x1c1c1e, insert: 0x2b2b2f, insertType: 'fabric', dash: 0x1f2023, trim: 'gloss', head: 0x3c3c3f, stitch: 'none' },
  r32: { insert: 0x3a3b40, trim: 'dash', head: 0x4a4a4c, stitch: 'none' },
  r33: { insert: 0x343a48, trim: 'dash', stitch: 'none' },
  r34: { insert: 0x3d4150, trim: 'carbon', head: 0x38383b, stitch: 'blue', mfd: true },
  r35: { seat: 0x161618, insert: 0x161618, insertType: 'leather', trim: 'carbon', stitch: 'red', head: 0x202022 },
  s15: { insert: 0x2d3a55, trim: 'satin', stitch: 'blue' },
  rps13: { insert: 0x3a3a3e, trim: 'dash' },
  z33: { insert: 0x6a4f2a, insertType: 'alcantara', trim: 'satin', stitch: 'none' },
  gr86: { insert: 0x262628, insertType: 'alcantara', trim: 'carbon', stitch: 'red', head: 0x1a1a1c },
  ae86: { seat: 0x222224, insert: 0x3a3c42, trim: 'dash', head: 0x6a6660, stitch: 'none' },
  jza80: { insert: 0x3e3e44, trim: 'satin', stitch: 'none' },
  a90: { seat: 0x1a1a1c, insert: 0x5a1414, insertType: 'leather', trim: 'carbon', stitch: 'red', head: 0x1d1d1f },
  jzx100: { seat: 0x4a4a50, insert: 0x55555c, trim: 'wood', head: 0x6c6a66 },
  crown: { seat: 0x7a6a55, insert: 0x8a7a64, insertType: 'leather', dash: 0x2a2724, trim: 'wood', head: 0x8a857c },
  fd3s: { insert: 0x2f2f33, trim: 'dash', stitch: 'none' },
  nd: { seat: 0x1a1a1c, insert: 0x262628, insertType: 'leather', trim: 'gloss', stitch: 'red' },
  na1: { insert: 0x353535, trim: 'dash', stitch: 'none' },
  ek9: { seat: 0x1a1a1c, insert: 0xa01818, trim: 'satin', stitch: 'red' },
  fl5: { seat: 0x1a1a1c, insert: 0xa61818, insertType: 'alcantara', trim: 'carbon', stitch: 'red', head: 0x1a1a1c },
  ap1: { seat: 0x1a1a1c, insert: 0x8a1414, insertType: 'leather', trim: 'satin', stitch: 'red' },
  evo9: { insert: 0x1d2e5a, trim: 'carbon', stitch: 'blue' },
  gdb: { insert: 0x2a3550, trim: 'satin', stitch: 'blue' },
  lfa: { seat: 0x6a0d0d, insert: 0x1c1c1e, insertType: 'alcantara', trim: 'carbon', stitch: 'red', head: 0x1a1a1c },
  copen: { insert: 0x3a2a22, insertType: 'leather', trim: 'gloss' },
  s660: { insert: 0x7a1010, trim: 'gloss', stitch: 'red' },
  p911: { insertType: 'alcantara', trim: 'carbon', stitch: 'red', head: 0x1a1a1c },
  e46: { insert: 0x454548, trim: 'satin' },
  mustang: { insert: 0x2a2a2c, insertType: 'leather', trim: 'satin', stitch: 'red' },
  model3: { seat: 0xe8e6e2, insert: 0xe8e6e2, insertType: 'leather', dash: 0x222324, trim: 'wood', head: 0x2a2a2c },
  leaf: { seat: 0x303034, insert: 0x45474d, trim: 'gloss', head: 0x8a8a88 },
  sakura: { seat: 0x6a625a, insert: 0x857a6e, trim: 'gloss', dash: 0x2b2a28, head: 0x9a9690 },
  prius: { seat: 0x3a3a3e, insert: 0x55565c, dash: 0x2a2b2e, trim: 'gloss', head: 0x8a8a88 },
  taxi: { seat: 0x2c2c2e, insert: 0x3d3d42, head: 0x8a8884 },
  police: { seat: 0x303033, insert: 0x45454a, head: 0x7a7a78 },
  police_unmarked: { seat: 0x303033, insert: 0x45454a, head: 0x7a7a78 },
};
export function themeFor(car) { return { ...THEME.default, ...(THEME[car.id] || {}) }; }

// cluster style: 'analog' | 'digital' | 'tesla'
export function clusterStyle(car) { return car.id === 'model3' ? 'tesla' : (car.year >= 2017 || car.engine.type === 'EV' || car.id === 'lfa' || car.id === 'r35') ? 'digital' : 'analog'; }

// the full cockpit interior lives in interiors.js (per-car specs, live cluster, mirrors)

// minimal interior for mid LOD (visible through the glass from outside)
export function buildInteriorLite(P, S, car, ctx) {
  const th = themeFor(car);
  const kit = new Kit();
  const g = new THREE.Group();
  const dx = ctx.driverX, floorY = S.clr + 0.12;
  const zEye = clamp(P.zA - 1.1, P.zD + 0.55, P.zA - 0.7), Hz = zEye + 0.2;
  const dashHalf = ctx.bodyXAt(P.zA - 0.3, S.belt) - 0.06;
  const zDashEdge = zEye + 0.62;
  kit.add(profileX([[P.zA + 0.03, S.cowl - 0.01], [zDashEdge, S.belt + 0.03], [zDashEdge + 0.05, floorY + 0.4], [P.zA, floorY + 0.35]], dashHalf * 2, 0.03, 4), M.dash(th.dash));
  for (const x of [dx, -dx]) {
    kit.add(roundedBox(0.48, 0.1, 0.48, 0.04), M.leather(th.seat), T(x, floorY + 0.2, Hz + 0.08, 0.1));
    kit.add(roundedBox(0.48, 0.6, 0.12, 0.05), M.leather(th.seat), T(x, floorY + 0.48, Hz - 0.2, -0.28));
  }
  kit.add(new THREE.TorusGeometry(0.18, 0.016, 6, 24), M.black(), T(dx, floorY + 0.55, zEye + 0.46, 0.36));
  kit.build(g, { shadow: false });
  return { group: g };
}
