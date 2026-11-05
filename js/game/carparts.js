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
function fileTex(name, map, rep = 1, srgb = false) {
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
function canvasTex(key, w, h, draw, { srgb = true, repeat = null } = {}) {
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
const fabricTex = () => canvasTex('fabric', 256, 256, (g, W, H) => {
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
const honeyTex = () => canvasTex('honey', 128, 128, (g, W, H) => {
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
const wheelLeatherTex = (marker) => canvasTex('swheel' + marker, 1024, 128, (g, W, H) => {
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
const SPORTY = new Set(['r32', 'r33', 'r34', 'r35', 's15', 'rps13', 'z33', 'gr86', 'ae86', 'jza80', 'a90', 'fd3s', 'nd', 'na1', 'ek9', 'fl5', 'ap1', 'evo9', 'gdb', 'lfa', 'copen', 's660', 'p911', 'e46', 'mustang']);
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
function trimMat(th) { return th.trim === 'carbon' ? M.carbon() : th.trim === 'wood' ? M.wood() : th.trim === 'satin' ? M.satin() : th.trim === 'dash' ? M.dash(th.dash) : M.gloss(); }
function insertMat(th) { return th.insertType === 'leather' ? M.leather(th.insert) : th.insertType === 'alcantara' ? M.alcantara(th.insert) : M.fabric(th.insert); }

// static canvas screens
function screenCanvas(kind, car, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (kind === 'nav') {
    g.fillStyle = '#0c1118'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1f2b3a'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); }
    g.strokeStyle = '#2e4058'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, h * 0.7); g.bezierCurveTo(w * 0.3, h * 0.6, w * 0.5, h * 0.2, w, h * 0.25); g.stroke();
    g.strokeStyle = '#3a8cff'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * 0.36, h); g.lineTo(w * 0.4, h * 0.6); g.bezierCurveTo(w * 0.45, h * 0.4, w * 0.6, h * 0.3, w, h * 0.25); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w * 0.4, h * 0.62); g.lineTo(w * 0.37, h * 0.74); g.lineTo(w * 0.43, h * 0.74); g.fill();
    g.fillStyle = 'rgba(20,28,40,0.9)'; g.fillRect(0, 0, w, 34); g.fillStyle = '#cfe2ff'; g.font = '20px sans-serif'; g.fillText('首都高速 湾岸線   大黒PA  2.4km', 12, 24);
    g.fillStyle = '#9ab'; g.font = '16px sans-serif'; g.fillText('♪ MIDNIGHT FM 89.1', 12, h - 12);
  } else if (kind === 'mfd') { // R34-style multi-function display
    g.fillStyle = '#060a10'; g.fillRect(0, 0, w, h);
    const bars = [['BOOST', 0.62, '#ffb030'], ['OIL T', 0.48, '#5ad'], ['WATER', 0.55, '#5ad'], ['EXH T', 0.4, '#e55']];
    g.font = 'bold 22px monospace';
    bars.forEach(([n, v, col], i) => { const y = 34 + i * 54; g.fillStyle = '#8ab'; g.fillText(n, 14, y + 18); g.strokeStyle = '#334'; g.strokeRect(120, y, w - 140, 26); g.fillStyle = col; g.fillRect(122, y + 2, (w - 144) * v, 22); });
  } else if (kind === 'radio') {
    g.fillStyle = '#121214'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b2a1c'; g.fillRect(w * 0.12, h * 0.18, w * 0.76, h * 0.36);
    g.fillStyle = '#9cff8a'; g.font = 'bold 54px monospace'; g.fillText('FM1 89.1', w * 0.17, h * 0.46);
    g.fillStyle = '#2a2a2e'; for (let i = 0; i < 6; i++) g.fillRect(w * 0.12 + i * w * 0.128, h * 0.66, w * 0.11, h * 0.16);
    g.fillStyle = '#777'; g.font = '22px sans-serif'; for (let i = 0; i < 6; i++) g.fillText(String(i + 1), w * 0.16 + i * w * 0.128, h * 0.78);
  } else if (kind === 'hvac') {
    g.fillStyle = '#141416'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff9a3c'; g.font = 'bold 40px sans-serif'; g.fillText('22.0', w * 0.08, h * 0.6); g.fillText('AUTO', w * 0.4, h * 0.6); g.fillText('22.0', w * 0.76, h * 0.6);
  } else if (kind === 'prnd') {
    g.fillStyle = '#101012'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ddd'; g.font = 'bold 120px sans-serif'; g.textAlign = 'center';
    'PRND'.split('').forEach((ch, i) => g.fillText(ch, w * 0.5, 130 + i * 170));
  } else if (kind === 'hpattern') {
    g.fillStyle = '#141414'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, TAU); g.fill();
    g.strokeStyle = '#ddd'; g.lineWidth = 8; g.beginPath();
    const n = car.trans.gears.length; const cols = Math.ceil(n / 2) + (n % 2 ? 1 : 0);
    const x0 = w * 0.22, x1 = w * 0.78; g.moveTo(x0, h / 2); g.lineTo(x1, h / 2);
    for (let i = 0; i < cols; i++) { const x = lerp(x0, x1, cols > 1 ? i / (cols - 1) : 0.5); g.moveTo(x, h * 0.22); g.lineTo(x, h * 0.78); }
    g.stroke(); g.fillStyle = '#ddd'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center';
    for (let i = 0; i < n; i++) { const col = Math.floor(i / 2), x = lerp(x0, x1, cols > 1 ? col / (cols - 1) : 0.5); g.fillText(String(i + 1), x, i % 2 ? h * 0.92 : h * 0.18); }
    g.fillText('R', x1, n % 2 ? h * 0.92 : h * 0.18);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function screenMat(kind, car, k = 0.8) {
  const t = screenCanvas(kind, car);
  return new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(k, k, k), toneMapped: false });
}
function glowPanelMat(kind, car) {
  const t = screenCanvas(kind, car);
  return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.4 });
}

// cluster style: 'analog' | 'digital' | 'tesla'
export function clusterStyle(car) { return car.id === 'model3' ? 'tesla' : (car.year >= 2017 || car.engine.type === 'EV' || car.id === 'lfa' || car.id === 'r35') ? 'digital' : 'analog'; }

export function buildInterior(P, S, car, ctx) {
  const lod = ctx.lod;
  const th = themeFor(car);
  const sporty = SPORTY.has(car.id);
  const tall = S.cabSq > 3.5 || car.H > 1600;
  const kit = new Kit();
  const g = new THREE.Group(); g.name = 'interior';
  const dx = ctx.driverX, side = Math.sign(dx) || -1;
  const floorY = S.clr + 0.12;
  const year = car.year || 2000;
  const dashM = M.dash(th.dash), dashTop = M.dash(th.dash === 0x1f2023 ? 0x19191b : th.dash);
  const trim = trimMat(th);
  // ── key points ──
  const roofAt = z => Math.max(P.top(z), P.roof(z));
  let zEye = clamp(P.zA - (tall ? 0.95 : 1.1), P.zD + 0.55, P.zA - 0.7);
  if (S.doors === 4) zEye = clamp(zEye, ctx.B_PILLAR + 0.02, P.zA - 0.7);
  const eyeY = Math.min(floorY + (tall ? 1.0 : sporty ? 0.84 : 0.9), roofAt(zEye) - (tall ? 0.16 : 0.105));
  const Hz = zEye + 0.2, Hy = eyeY - (tall ? 0.7 : 0.64); // hip point
  const zDashEdge = zEye + 0.62;
  const yDashEdge = eyeY - 0.25;
  const cw = (z, y) => ctx.bodyXAt(z, y) - 0.05; // inner half-width at (z,y)
  const dashHalf = cw(P.zA - 0.3, S.belt) - 0.01;
  const eye = new THREE.Vector3(dx, eyeY, zEye);

  // ── floor, firewall, sills ──
  const flen = P.zA - P.zD;
  kit.add(roundedBox(dashHalf * 2 + 0.06, 0.05, flen, 0.02), M.carpet(), T(0, floorY - 0.02, (P.zA + P.zD) / 2));
  kit.add(roundedBox(dashHalf * 2, 0.4, 0.04, 0.015), M.carpet(), T(0, floorY + 0.15, P.zA - 0.08, -0.5));
  // ── dashboard (lofted profile across the cabin) ──
  const yA = S.cowl - 0.01, zA = P.zA + 0.04;
  const prof = [
    [zA, yA], [lerp(zA, zDashEdge, 0.45), lerp(yA, yDashEdge, 0.55) + 0.025, zDashEdge + 0.08, yDashEdge],
    [zDashEdge - 0.02, yDashEdge - 0.01, zDashEdge - 0.01, yDashEdge - 0.06],
    [zDashEdge + 0.03, yDashEdge - 0.2],
    [zDashEdge + 0.06, floorY + 0.4, zDashEdge + 0.16, floorY + 0.36],
    [P.zA - 0.12, floorY + 0.32],
    [zA, floorY + 0.36],
  ];
  if (zDashEdge + 0.16 > P.zA - 0.14) { prof[4] = [zDashEdge + 0.06, floorY + 0.38]; prof.splice(5, 1); }
  kit.add(profileX(prof.map(p => p.length === 4 ? [p[0], p[1], p[2], p[3]] : p), dashHalf * 2, 0.035, 10), dashTop);
  // decorative trim band on the passenger side of the dash face
  const pxs = -side;
  const trimLen = dashHalf - 0.32;
  if (trimLen > 0.15) kit.add(roundedBox(trimLen, 0.045, 0.02, 0.008), trim, T(pxs * (0.17 + trimLen / 2), yDashEdge - 0.1, zDashEdge - 0.01, -0.12));
  // glovebox shut line
  kit.add(roundedBox(trimLen * 0.8, 0.004, 0.004, 0.0015), M.black(), T(pxs * (0.2 + trimLen * 0.45), yDashEdge - 0.2, zDashEdge + 0.035));
  // ── instrument binnacle ──
  const style = clusterStyle(car);
  let gauge = null;
  {
    const gc = document.createElement('canvas'); gc.width = 1024; gc.height = 384;
    const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace; gt.anisotropy = 8;
    const gm = new THREE.MeshBasicMaterial({ map: gt, toneMapped: false, color: 0xdddddd });
    let gw = 0.32, gh = 0.12, mesh;
    if (style === 'tesla') {
      gw = 0.38; gh = 0.2425;
      gc.height = 654; // landscape centre screen
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), gm);
      mesh.position.set(0, yDashEdge + 0.09, zDashEdge + 0.04); mesh.rotation.set(0.22, Math.PI, 0);
      kit.add(roundedBox(gw + 0.016, gh + 0.016, 0.016, 0.006), M.gloss(), T(0, yDashEdge + 0.09, zDashEdge + 0.05, 0.22));
      kit.add(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 12), M.gloss(), T(0, yDashEdge + 0.0, zDashEdge + 0.08));
    } else {
      const cy = eyeY - 0.285, cz = zDashEdge - 0.035, GT = 0.3;
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), gm);
      mesh.position.set(dx, cy, cz); mesh.rotation.set(GT, Math.PI, 0);
      // pod behind the dials + hood arch over them
      kit.add(roundedBox(gw + 0.07, gh + 0.06, 0.12, 0.03), dashM, T(dx, cy - 0.01, cz + 0.065, GT));
      const arch = new THREE.Shape();
      const aw = gw / 2 + 0.045, ah = 0.075;
      arch.absellipse(0, 0, aw, ah, 0, Math.PI, false); arch.lineTo(-aw + 0.014, 0); arch.absellipse(0, 0, aw - 0.014, ah - 0.012, Math.PI, 0, true); arch.lineTo(aw, 0);
      const ag = new THREE.ExtrudeGeometry(arch, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 24 });
      kit.add(ag, dashTop, T(dx, cy + gh / 2 - 0.02, cz - 0.07, GT, 0, 0));
      // side cheeks of the hood
      for (const sx of [1, -1]) kit.add(roundedBox(0.016, gh * 0.75, 0.14, 0.006), dashTop, T(dx + sx * (aw - 0.008), cy + 0.005, cz + 0.0, GT));
      if (style === 'analog') for (const ox of [-0.085, 0.085]) { // chrome dial bezels
        kit.add(new THREE.TorusGeometry(0.0505, 0.0028, 6, 40), M.chrome(), T(dx + ox, cy, cz - 0.004, GT, Math.PI, 0));
        kit.add(new THREE.CylinderGeometry(0.052, 0.052, 0.012, 32, 1, true), M.black(), T(dx + ox, cy, cz + 0.002, GT - Math.PI / 2, 0, 0));
      }
    }
    mesh.renderOrder = 1;
    g.add(mesh);
    // cover glass (reflective)
    const cg = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.05, transparent: true, opacity: 0.12, envMapIntensity: 0.8, depthWrite: false }));
    cg.position.copy(mesh.position); cg.rotation.copy(mesh.rotation); cg.translateZ(0.006); cg.renderOrder = 3; cg.customDepthMaterial = M.noShadow(); g.add(cg);
    gauge = { canvas: gc, tex: gt, mesh, style };
  }
  // ── centre stack, vents, infotainment ──
  const stackZ = zDashEdge + 0.05, stackTop = yDashEdge - 0.03, stackBot = floorY + 0.3;
  kit.add(roundedBox(0.3, stackTop - stackBot, 0.12, 0.03), dashM, T(0, (stackTop + stackBot) / 2, stackZ + 0.02, 0.18));
  const stackFace = (y, zOff = 0) => [0, y, stackZ - 0.042 + zOff + (y - (stackTop + stackBot) / 2) * Math.tan(0.18)];
  // vents
  const vent = (x, y, z, w, h, ry = 0, round = false) => {
    if (round) {
      kit.add(new THREE.TorusGeometry(h / 2, 0.008, 8, 24), M.satin(), T(x, y, z, 0, ry, 0));
      kit.add(new THREE.CylinderGeometry(h / 2, h / 2, 0.02, 24), M.black(), T(x, y, z + 0.01, Math.PI / 2, ry, 0, 1, 1, 1, 'YXZ'));
      for (let i = -1; i <= 1; i++) kit.add(new THREE.BoxGeometry(h * 0.9, 0.004, 0.012), M.gloss(), T(x, y + i * h * 0.22, z - 0.002, 0, ry, 0));
      return;
    }
    kit.add(roundedBox(w + 0.016, h + 0.016, 0.03, 0.008), M.gloss(), T(x, y, z + 0.01, 0, ry, 0));
    for (let i = 0; i < 4; i++) kit.add(new THREE.BoxGeometry(w, 0.004, 0.018), M.black(), T(x, y - h / 2 + (i + 0.5) * h / 4, z - 0.006, 0.3, ry, 0));
  };
  const roundVents = ['nd', 's660', 'copen', 'p911', 'ap1', 'mustang', 'gr86'].includes(car.id);
  {
    const vy = yDashEdge - 0.06, vz = zDashEdge - 0.012;
    vent(0.07, vy, vz, 0.09, 0.05, 0, roundVents); vent(-0.07, vy, vz, 0.09, 0.05, 0, roundVents);
    vent(dashHalf - 0.12, vy + 0.01, vz + 0.01, 0.1, 0.055, 0.25, roundVents); vent(-(dashHalf - 0.12), vy + 0.01, vz + 0.01, 0.1, 0.055, -0.25, roundVents);
  }
  const screens = [];
  if (style === 'tesla') { /* the centre screen is the cluster */ }
  else if (year >= 2012) { // floating tablet on the dash top
    const sw = car.id === 'nbox' || car.cat === 'kei' ? 0.18 : 0.22, sh = sw * 0.58;
    const sy = yDashEdge + 0.07, sz = zDashEdge + 0.08;
    kit.add(roundedBox(sw + 0.018, sh + 0.018, 0.02, 0.006), M.gloss(), T(0, sy, sz + 0.004, 0.2, -side * 0.1, 0));
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), screenMat('nav', car, 0.7)); sc.position.set(0, sy, sz - 0.0065); sc.rotation.set(0.2, Math.PI - side * 0.1, 0); screens.push(sc);
    // HVAC panel lower in the stack
    const [hx, hy, hz] = stackFace(stackBot + 0.12);
    const hv = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), glowPanelMat('hvac', car)); hv.position.set(hx, hy, hz - 0.004); hv.rotation.set(0.18, Math.PI, 0); screens.push(hv);
  } else {
    // head unit (radio / nav) in the stack + HVAC knobs below
    const [rx, ry, rz] = stackFace(stackTop - 0.11);
    const kind = year >= 2004 ? 'nav' : 'radio';
    const hu = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.1), kind === 'nav' ? screenMat('nav', car, 0.6) : glowPanelMat('radio', car)); hu.position.set(rx, ry, rz - 0.003); hu.rotation.set(0.18, Math.PI, 0); screens.push(hu);
    const [kx, ky, kz] = stackFace(stackTop - 0.22);
    for (const ox of [-0.075, 0, 0.075]) kit.add(new THREE.CylinderGeometry(0.019, 0.021, 0.022, 20), M.satin(), T(kx + ox, ky, kz - 0.006, Math.PI / 2 + 0.18, 0, 0));
    if (th.mfd) { // R34 MFD screen top centre
      const mf = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.075), screenMat('mfd', car, 0.75)); mf.position.set(0, yDashEdge + 0.035, zDashEdge + 0.03); mf.rotation.set(0.35, Math.PI, 0); screens.push(mf);
      kit.add(roundedBox(0.17, 0.095, 0.05, 0.012), dashTop, T(0, yDashEdge + 0.03, zDashEdge + 0.05, 0.35));
    }
  }
  // hazard switch
  kit.add(roundedBox(0.026, 0.014, 0.01, 0.003), M.dash(0x5a0a0a), T(...stackFace(stackTop - 0.035, -0.004)));
  for (const s of screens) { s.renderOrder = 1; g.add(s); }

  // ── centre console / tunnel ──
  const conZ0 = Hz - 0.32, conZ1 = Math.min(stackZ + 0.05, P.zA - 0.12);
  const conTop = floorY + (sporty ? 0.24 : 0.28);
  kit.add(roundedBox(0.24, conTop - floorY, conZ1 - conZ0, 0.04), dashM, T(0, (conTop + floorY) / 2, (conZ0 + conZ1) / 2));
  kit.add(roundedBox(0.2, 0.012, conZ1 - conZ0 - 0.08, 0.005), trim, T(0, conTop + 0.002, (conZ0 + conZ1) / 2 + 0.02));
  if (!sporty || year >= 2010) kit.add(roundedBox(0.2, 0.08, 0.3, 0.035), M.leather(th.seat), T(0, conTop + 0.06, conZ0 + 0.1)); // armrest lid
  // ── shifter ──
  const trans = car.trans.type;
  const shGroup = new THREE.Group();
  const shZ = Hz + (sporty ? 0.34 : 0.4), shY = conTop + 0.006;
  shGroup.position.set(dx * 0.06, shY, shZ);
  const shKit = new Kit();
  let shType = trans === 'MT' ? 'mt' : trans === 'EV' ? 'ev' : 'at';
  if (car.id === 'model3') shType = 'none';
  if (shType === 'mt') {
    // leather boot (wrinkled lathe) + chrome collar on the console (static)
    const bp = []; for (let i = 0; i <= 12; i++) { const t = i / 12; bp.push(new THREE.Vector2(lerp(0.055, 0.016, Math.pow(t, 0.8)) + Math.sin(t * 22) * 0.003 * (1 - t), t * 0.08)); }
    kit.add(new THREE.LatheGeometry(bp, 24), M.leather(0x161618), T(dx * 0.06, shY, shZ));
    kit.add(new THREE.TorusGeometry(0.058, 0.006, 6, 28), M.satin(), T(dx * 0.06, shY + 0.003, shZ, Math.PI / 2));
    shKit.add(new THREE.CylinderGeometry(0.008, 0.011, 0.16, 10), M.satin(), T(0, 0.08, 0));
    const knobR = sporty ? 0.026 : 0.024;
    shKit.add(new THREE.SphereGeometry(knobR, 20, 14), sporty && th.trim === 'satin' ? M.satin() : M.leather(0x141416), T(0, 0.165, 0, 0, 0, 0, 1, 0.92, 1));
    const top = new THREE.Mesh(new THREE.CircleGeometry(knobR * 0.62, 24), new THREE.MeshStandardMaterial({ map: screenCanvas('hpattern', car, 128, 128), roughness: 0.3, metalness: 0.4 }));
    top.rotation.x = -Math.PI / 2; top.position.y = 0.165 + knobR * 0.9; shGroup.add(top);
  } else if (shType === 'at') {
    kit.add(roundedBox(0.09, 0.012, 0.2, 0.006), M.gloss(), T(dx * 0.06, shY + 0.004, shZ - 0.03));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.12), glowPanelMat('prnd', car)); lab.rotation.x = -Math.PI / 2; lab.position.set(dx * 0.06 - 0.03 * side, shY + 0.011, shZ - 0.03); g.add(lab);
    shKit.add(new THREE.CylinderGeometry(0.01, 0.012, 0.1, 10), M.satin(), T(0, 0.05, 0));
    shKit.add(roundedBox(0.04, 0.07, 0.055, 0.017), M.leather(0x141416), T(0, 0.12, 0, -0.15));
    shKit.add(roundedBox(0.014, 0.02, 0.014, 0.005), M.satin(), T(-0.022 * side, 0.14, 0.0));
  } else if (shType === 'ev') { // drive selector puck
    shKit.add(new THREE.CylinderGeometry(0.032, 0.038, 0.035, 28), M.gloss(), T(0, 0.02, 0));
    shKit.add(new THREE.SphereGeometry(0.03, 20, 10, 0, TAU, 0, Math.PI / 2), M.satin(), T(0, 0.037, 0));
  }
  shKit.build(shGroup);
  g.add(shGroup);
  // handbrake lever (or electronic button on modern cars)
  let hbGroup = null;
  if (year < 2014 && car.engine.type !== 'EV' && car.cat !== 'traffic') {
    hbGroup = new THREE.Group(); hbGroup.position.set(-dx * 0.02 - side * 0.0, conTop + 0.01, Hz - 0.12);
    const hk = new Kit();
    hk.add(roundedBox(0.035, 0.03, 0.26, 0.012), M.leather(0x151517), T(0, 0.015, 0.13));
    hk.add(new THREE.CylinderGeometry(0.007, 0.007, 0.03, 10), M.satin(), T(0, 0.012, 0.27, Math.PI / 2));
    hk.build(hbGroup);
    hbGroup.rotation.x = -0.12;
    g.add(hbGroup);
    kit.add(roundedBox(0.06, 0.012, 0.3, 0.005), M.leather(0x161618), T(hbGroup.position.x, conTop + 0.002, Hz - 0.0));
  } else {
    kit.add(roundedBox(0.025, 0.01, 0.035, 0.004), M.gloss(), T(-side * 0.06, conTop + 0.006, shZ - 0.12));
  }
  // ── steering wheel ──
  const wheel = new THREE.Group();
  const col = new THREE.Group();
  const wR = tall ? 0.19 : sporty ? 0.178 : 0.185, tubeR = sporty ? 0.0175 : 0.0155;
  const wz = zEye + (tall ? 0.42 : 0.46), wy = eyeY - (tall ? 0.36 : 0.32);
  col.position.set(dx, wy, wz); col.rotation.x = tall ? 0.62 : 0.36;
  {
    const wk = new Kit();
    const rim = new THREE.TorusGeometry(wR, tubeR, lod === 'full' ? 16 : 8, lod === 'full' ? 80 : 40);
    wk.add(rim, M.wheelLeather(th.stitch === 'none' ? (sporty ? 'gold' : 'none') : th.stitch), null, { uv: 'keep' });
    const spokes = year < 1990 && !sporty ? [0, Math.PI, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5] : [0, Math.PI, -Math.PI / 2];
    for (const a of spokes) {
      const sp = new THREE.Shape(); const r0 = 0.05, r1 = wR - 0.004, w0 = 0.032, w1 = a === -Math.PI / 2 ? 0.014 : 0.022;
      sp.moveTo(r0, -w0); sp.quadraticCurveTo(r0 + 0.05, -w1 * 1.4, r1, -w1); sp.lineTo(r1, w1); sp.quadraticCurveTo(r0 + 0.05, w1 * 1.4, r0, w0); sp.closePath();
      const sg = new THREE.ExtrudeGeometry(sp, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6 });
      sg.translate(0, 0, -0.01); sg.rotateZ(a);
      wk.add(sg, M.leather(0x1a1a1c));
      if (sporty && a !== -Math.PI / 2) { const ig = new THREE.BoxGeometry(0.06, 0.006, 0.004); ig.translate(0.1, 0, -0.016); ig.rotateZ(a); wk.add(ig, th.trim === 'carbon' ? M.carbon() : M.satin()); }
    }
    // airbag / horn pad
    const airbag = year >= 1992;
    const pad = airbag ? roundedBox(0.135, 0.105, 0.05, 0.022) : new THREE.CylinderGeometry(0.045, 0.05, 0.03, 24).rotateX(Math.PI / 2);
    wk.add(pad, M.dash(0x18181a), T(0, -0.006, -0.03));
    const emb = new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), M.chrome()); emb.position.set(0, 0, -0.0565 + (airbag ? 0 : 0.012)); emb.rotation.y = Math.PI; emb.scale.set(1.4, 1, 1); wheel.add(emb);
    if (year >= 2006) for (const sx of [1, -1]) wk.add(roundedBox(0.035, 0.02, 0.008, 0.004), M.gloss(), T(sx * 0.1, 0.012, -0.022));
    if (trans === 'DCT' || (trans === 'AT' && sporty)) for (const sx of [1, -1]) wk.add(roundedBox(0.05, 0.08, 0.006, 0.004), M.satin(), T(sx * (wR - 0.06), 0.04, 0.03, 0, 0, sx * 0.2));
    wk.build(wheel);
  }
  col.add(wheel);
  // column shroud + stalks (static, follow the column angle)
  const shroud = new THREE.Group(); shroud.position.copy(col.position); shroud.rotation.x = col.rotation.x;
  const sk = new Kit();
  sk.add(roundedBox(0.09, 0.08, 0.2, 0.03), dashM, T(0, -0.01, 0.13));
  for (const sx of [1, -1]) sk.add(new THREE.CylinderGeometry(0.006, 0.008, 0.11, 8), M.black(), T(sx * 0.075, 0.01, 0.07, 0, 0, Math.PI / 2 + sx * 0.15));
  sk.build(shroud);
  g.add(col, shroud);
  // ── pedals ──
  const pz = Math.min(P.zA - 0.24, zEye + 0.98), py = floorY + 0.1;
  const pedal = (x, w, alu) => {
    kit.add(roundedBox(w, 0.075, 0.012, 0.005), alu ? M.satin() : M.rubber(), T(x, py, pz, -0.95));
    kit.add(new THREE.BoxGeometry(0.012, 0.18, 0.012), M.black(), T(x, py + 0.11, pz + 0.07, -0.55));
  };
  const alu = sporty && year >= 1995;
  if (trans === 'MT') { pedal(dx + 0.16, 0.06, alu); pedal(dx + 0.03, 0.065, alu); pedal(dx - 0.1, 0.045, alu); }
  else { pedal(dx + 0.05, 0.1, alu); pedal(dx - 0.1, 0.045, alu); }
  if (sporty) kit.add(roundedBox(0.06, 0.12, 0.01, 0.004), alu ? M.satin() : M.rubber(), T(dx + 0.28, py + 0.02, pz - 0.02, -0.9));
  // ── seats ──
  const seatW = clamp(P.hw * 0.66, 0.44, 0.54);
  const seat = (x, bucket, sk) => {
    const ins = insertMat(th), sideM = M.leather(th.seat);
    const hw = seatW / 2;
    // cushion: origin at the front edge, length runs backward
    const cl = 0.5;
    const cush = padGeo(cl, t => hw * (0.9 + 0.1 * t), () => 0.06, (t, xn) => (bucket ? 0.028 : 0.012) * (1 - sstep(0.45, 0.85, xn)), (t, xn) => xn < 0.55 && t > 0.08 && t < 0.92, 16, 28, 0.03);
    sk.add(cush, [sideM, ins], T(x, Hy - 0.03, Hz + 0.3, -Math.PI / 2 - 0.12));
    // backrest (bucket: integrated headrest)
    const bl = bucket ? 0.8 : 0.62;
    const bw = t => hw * (bucket ? (t < 0.62 ? 1 - 0.06 * t : lerp(0.94, 0.56, sstep(0.62, 0.78, t))) : (1 - 0.1 * t));
    const back = padGeo(bl, bw, t => bucket ? 0.075 - 0.02 * t : 0.065, (t, xn) => (bucket ? 0.045 * (1 - sstep(0.62, 0.8, t)) : 0.015) * (1 - sstep(0.4, 0.82, xn)), (t, xn) => xn < (bucket ? 0.5 : 0.6) && t > 0.06 && t < (bucket ? 0.6 : 0.92), 26, 28, 0.04);
    sk.add(back, [sideM, ins], T(x, Hy - 0.04, Hz - 0.14, -(bucket ? 0.3 : 0.26)));
    if (bucket) { // harness slots
      for (const sx of [-1, 1]) sk.add(roundedBox(0.05, 0.012, 0.03, 0.005), M.black(), T(x + sx * 0.07, Hy + 0.02 + Math.cos(0.3) * bl * 0.66, Hz - 0.12 - Math.sin(0.3) * bl * 0.66 + 0.06, -0.3));
    } else { // separate headrest on posts
      const hy = Hy + 0.02 + Math.cos(0.26) * (bl + 0.1), hz = Hz - 0.12 - Math.sin(0.26) * (bl + 0.1);
      sk.add(roundedBox(0.25, 0.17, 0.09, 0.04), sideM, T(x, hy, hz - 0.01, -0.2));
      for (const sx of [-1, 1]) sk.add(new THREE.CylinderGeometry(0.005, 0.005, 0.1, 6), M.satin(), T(x + sx * 0.07, hy - 0.1, hz + 0.02, -0.26));
    }
    // base & rails
    sk.add(roundedBox(seatW * 0.8, 0.07, 0.42, 0.015), M.black(), T(x, (floorY + Hy + 0.02) / 2, Hz + 0.08));
  };
  const bucket = sporty && !['crown', 'mustang', 'e46', 'jzx100', 'nd', 'copen', 's660', 'r33', 'jza80', 'z33', 'na1'].includes(car.id) || ['fl5', 'ek9', 'r34', 'gr86'].includes(car.id);
  seat(dx, bucket, kit); seat(-dx, bucket, kit);
  if (S.doors === 4 || S.rearSeat) { // rear bench
    const rz = Hz - (S.doors === 4 ? 0.9 : 0.78);
    if (rz > P.zD + 0.15) {
      const bw = cw(rz, S.belt) - 0.04;
      const ins = insertMat(th), sideM = M.leather(th.seat);
      kit.add(padGeo(0.45, () => bw, () => 0.06, (t, xn) => 0.012 * (1 - sstep(0.85, 0.98, xn)), (t, xn) => xn < 0.9 && t > 0.1 && t < 0.9, 10, 40, 0.03), [sideM, ins], T(0, Hy + 0.04, rz + 0.26, -Math.PI / 2 - 0.1));
      kit.add(padGeo(S.doors === 4 ? 0.58 : 0.45, () => bw, () => 0.06, (t, xn) => 0.012, (t, xn) => xn < 0.9 && t > 0.08 && t < 0.9, 12, 40, 0.035), [sideM, ins], T(0, Hy + 0.03, rz - 0.18, -0.3));
    }
  }
  // parcel shelf / rear deck
  if (!S.open && !S.cargo) kit.add(roundedBox(dashHalf * 2, 0.02, 0.3, 0.01), M.carpet(), T(0, S.belt - 0.02, P.zD + 0.18));
  // ── rear-view mirror, sun visors, grab handles ──
  if (!S.open) {
    const mz = P.zB - 0.1, my = roofAt(mz) - 0.085;
    kit.add(roundedBox(0.24, 0.062, 0.03, 0.02), M.black(), T(0, my, mz));
    kit.add(new THREE.CylinderGeometry(0.008, 0.01, 0.06, 8), M.black(), T(0, my + 0.04, mz + 0.03, 0.4));
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.048), M.mirror()); mir.position.set(0, my, mz - 0.016); mir.rotation.set(-0.05, Math.PI - side * 0.12, 0); g.add(mir);
    for (const sx of [1, -1]) {
      const vz = P.zB - 0.17, vy = roofAt(vz) - 0.03;
      kit.add(roundedBox(0.32, 0.018, 0.15, 0.008), M.headliner(th.head), T(sx * 0.27, vy, vz + 0.02, -0.15));
    }
  }
  // ── door cards (built per door, attached to the door pivot by carmodel) ──
  const doorCard = (dk, z0, z1, sx, pivot) => {
    const len = z1 - z0 - 0.06; if (len < 0.3) return;
    const zm = (z0 + z1) / 2 - 0.01;
    const y0 = floorY + 0.03, y1 = S.belt - 0.035;
    const xl = ctx.bodyXAt(zm, y0 + 0.12) - 0.05, xh = Math.max(xl - 0.05, ctx.bodyXAt(zm, Math.min(y1, P.top(zm) - 0.1)) - 0.05);
    const ang = Math.atan2(xh - xl, y1 - y0);
    const at = (y, inset = 0) => sx * (lerp(xl, xh, (y - y0) / (y1 - y0)) - inset);
    const rz = -sx * ang;
    dk.add(roundedBox(0.03, y1 - y0, len, 0.012), M.dash(th.dash), T(at((y0 + y1) / 2), (y0 + y1) / 2, zm, 0, 0, rz));
    // upper insert panel (seat material)
    dk.add(roundedBox(0.012, 0.13, len * 0.72, 0.006), insertMat(th), T(at(S.belt - 0.15, 0.018), S.belt - 0.15, zm - len * 0.08, 0, 0, rz));
    // armrest + pull handle
    dk.add(roundedBox(0.07, 0.045, len * 0.5, 0.02), M.leather(th.seat), T(at(S.belt - 0.25, 0.045), S.belt - 0.25, zm - len * 0.12, 0, 0, rz));
    dk.add(roundedBox(0.018, 0.028, 0.1, 0.008), M.chrome(), T(at(S.belt - 0.13, 0.025), S.belt - 0.13, z1 - 0.2, 0, 0, rz));
    dk.add(roundedBox(0.01, 0.04, 0.12, 0.004), M.black(), T(at(S.belt - 0.13, 0.016), S.belt - 0.13, z1 - 0.2, 0, 0, rz));
    // speaker grille
    dk.add(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 28), M.grille(), T(at(y0 + 0.16, 0.016), y0 + 0.16, z1 - 0.25, 0, 0, Math.PI / 2 + rz));
    // window switch / crank
    if (year >= 1988) dk.add(roundedBox(0.04, 0.012, 0.07, 0.004), M.gloss(), T(at(S.belt - 0.225, 0.06), S.belt - 0.225, zm + len * 0.05, 0, 0, rz));
    else dk.add(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16), M.satin(), T(at(S.belt - 0.18, 0.03), S.belt - 0.18, zm, 0, 0, Math.PI / 2 + rz));
    // belt cap
    dk.add(roundedBox(0.045, 0.02, len + 0.02, 0.008), M.dash(th.dash), T(at(y1, 0.005), y1, zm, 0, 0, rz));
  };
  // static rear-quarter trim (coupés), sill scuff plates
  for (const sx of [1, -1]) {
    const zq0 = P.zD + 0.08, zq1 = (S.doors === 4 ? ctx.rdoorZ0 : ctx.doorZ0) - 0.02;
    if (zq1 - zq0 > 0.2) {
      const zm = (zq0 + zq1) / 2, xm = ctx.bodyXAt(zm, (floorY + S.belt) / 2) - 0.05;
      kit.add(roundedBox(0.03, S.belt - floorY - 0.05, zq1 - zq0, 0.012), M.dash(th.dash), T(sx * xm, (floorY + S.belt) / 2, zm));
    }
    const xs = ctx.bodyXAt((ctx.doorZ0 + ctx.doorZ1) / 2, floorY + 0.1) - 0.07;
    kit.add(roundedBox(0.06, 0.012, ctx.doorZ1 - ctx.doorZ0 - 0.05, 0.004), M.satin(), T(sx * xs, floorY + 0.09, (ctx.doorZ0 + ctx.doorZ1) / 2));
  }
  kit.build(g);
  // transparent/glass-like or screens shouldn't block the sun on the interior
  return { group: g, wheel, shifter: { group: shGroup, type: shType, gears: car.trans.gears.length, cur: { x: 0, z: 0 }, tgt: { x: 0, z: 0 } }, handbrake: hbGroup, gauge, floorY, zSeat: Hz, eye, doorCard, theme: th };
}

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
