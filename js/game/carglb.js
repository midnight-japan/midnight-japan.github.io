// Real 3D car models (glTF / GLB, CC BY 4.0 — see assets/CREDITS.md) wrapped in the same CarModel API as the procedural
// cars: live paint recolour + finish, the model's own wheels spinning/steering/cambering, lamps driven by the light state,
// plates, police lightbar, and an openable bonnet (engine lid on mid/rear-engined cars) on every model: the panel is cut
// out of the body with clipping planes, hinged, and a detailed engine bay (buildEngineBay) sits underneath.
// assets/models/cars/manifest.json lists the models; all GLBs are normalised (metres, front = +Z, up = +Y, ground at
// y = 0, wheels split into wheel_fl/fr/rl/rr nodes pivoted at the wheel centre).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildCar, buildEngineBay } from './carmodel.js';

const BASE = new URL('../../assets/models/cars/', import.meta.url);
let manifest = null, manifestP = null, gltf = null;
const cache = new Map();   // id → { promise, scene, info, bay: { front, rear } }

export function loadManifest() {
  return manifestP ||= fetch(new URL('manifest.json', BASE)).then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(m => (manifest = m));
}
// cars without a model of their own that are built on one that exists (police / taxi Crowns → the Crown model; the
// procedural lightbar, roof sign and decals are kept on top)
export const GLB_ALIAS = { police: 'crown', police_unmarked: 'crown', taxi: 'crown' };
const mid = id => GLB_ALIAS[id] || id;
export const hasGlb = id => !!manifest?.[mid(id)];
// v2.13: NPC traffic uses the manifest `lo` file (≈20k triangles) when there is one — the full models are 100k+
const ckey = (id, lod) => mid(id) + (lod === 'lo' && manifest?.[mid(id)]?.lo ? '@lo' : '');
export const glbEntry = (id, lod) => { const e = cache.get(ckey(id, lod)); return e?.scene ? e : null; };
// Models delivered as ONE plain untextured material (e.g. the Canter box truck) would render as unpainted white clay:
// split their triangles by position into a painted cab, the aluminium load box and the dark chassis / tyres below,
// so the cab takes the real factory colour like every other car. manifest: split { mat, cab (m from the front), low (m) }
function splitLivery(scene, info) {
  const S = info.split, zFront = info.bbox?.[5] ?? 0, v = new THREE.Vector3();
  scene.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material) || o.material.name !== S.mat) return;
    const g = o.geometry, pos = g.attributes.position, I = g.index ? g.index.array : null, n = I ? I.length / 3 : pos.count / 3;
    const B = [[], [], []];
    for (let t = 0; t < n; t++) {
      let cy = 0, cz = 0; const ids = [0, 1, 2].map(k => (I ? I[t * 3 + k] : t * 3 + k));
      for (const i of ids) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); cy += v.y / 3; cz += v.z / 3; }
      if (S.van) { // one-material van: tyres/chassis below, glass band (steep faces between belt and roof), the rest painted
        const a = new THREE.Vector3().fromBufferAttribute(pos, ids[0]).applyMatrix4(o.matrixWorld), b = new THREE.Vector3().fromBufferAttribute(pos, ids[1]).applyMatrix4(o.matrixWorld), c = new THREE.Vector3().fromBufferAttribute(pos, ids[2]).applyMatrix4(o.matrixWorld);
        const ny = Math.abs(b.sub(a).cross(c.sub(a)).normalize().y), H = info.bbox?.[4] ?? 2;
        B[cy < S.low ? 2 : (cy > H * S.belt && cy < H - 0.1 && ny < 0.55) ? 1 : 0].push(...ids); continue;
      }
      B[cy < S.low ? 2 : cz > zFront - S.cab ? 0 : 1].push(...ids);
    }
    g.setIndex([...B[0], ...B[1], ...B[2]]); g.clearGroups();
    g.addGroup(0, B[0].length, 0); g.addGroup(B[0].length, B[1].length, 1); g.addGroup(B[0].length + B[1].length, B[2].length, 2);
    const base = o.material, mk = (name, col, metal, rough) => { const m = base.clone(); m.name = name; m.color.set(col); m.map = null; m.metalness = metal; m.roughness = rough; return m; };
    o.material = [mk('auto_paint', 0xffffff, 0.3, 0.3), S.van ? mk('auto_glass', 0x141a20, 0.3, 0.08) : mk('auto_box', 0xd9dde1, 0.55, 0.38), mk('auto_dark', 0x232528, 0.2, 0.75)];
  });
  info.paint = [...new Set([...(info.paint || []), 'auto_paint'])];
}
// v2.3 — every car the same, clean way: glass = dark tinted see-through (some models had white opaque or fully clear
// glass, so a car looked roofless or frosted), and body panels drawn from both sides (one-sided panels opened holes
// at some angles — the "broken" models)
function fixMaterials(scene, info) {
  const glass = new Set(info.glass || []), done = new Set();
  // v2.11.1: body panels of many source models have rough / split normals → the clear-coat reflection rippled like
  // crumpled foil (R35). Paint meshes get creased normals: smooth below 35°, panel lines and edges stay sharp.
  { const paint = new Set(info.paint || []), seen = new Set();
    scene.traverse(o => { if (!o.isMesh || seen.has(o.geometry)) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
      if (!ms.some(m => paint.has(m.name)) || Array.isArray(o.material)) return; seen.add(o.geometry);
      try { const g = toCreasedNormals(o.geometry, 35 * Math.PI / 180); o.geometry = g; } catch (e) { console.warn('normals', e); } }); }
  // v2.7: factory look — manifest `recolor` {material: hex} (R33's lime rims) and `stripMap` [material] (aftermarket
  // livery baked into the JZA80's body texture → plain paint)
  if (info.opaque) for (const n of info.opaque) scene.traverse(o => { if (!o.isMesh) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m.name === n) { m.transparent = false; m.opacity = 1; m.alphaTest = 0; m.depthWrite = true; m.needsUpdate = true; } }); // v2.13: atlas-textured bodies exported as BLEND
  if (info.recolor || info.stripMap) { const strip = new Set(info.stripMap || []);
    scene.traverse(o => { if (!o.isMesh) return; for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (info.recolor?.[m.name]) { m.color.set(info.recolor[m.name]); m.map = null; m.needsUpdate = true; }
      if (strip.has(m.name) && m.map) { m.map = null; m.color.set(0xffffff); m.needsUpdate = true; } } }); }
  // v2.14: the cabin read as see-through. Three causes, fixed here for every model:
  //  · the manifest `glass` lists (and the "transparent → glass" rule) also caught alpha-textured interior / trim
  //    materials (Legacy seat belts, dash details, pedals, wipers; DC2's and ND's whole cabin atlas; badges, wheels) —
  //    they were turned into 42 %-opaque dark glass, so seats and dash were ghosts. Textured materials that are not
  //    named glass are not glass: they become alpha-tested solids (also fixes them vanishing behind the windows).
  //  · lamp lenses (red_glass, headlight_glass …) were darkened like windows → own clear / coloured lens look.
  //  · the window glass itself was a 42 % black film with no visible reflection, so the car looked windowless:
  //    now a tinted, Fresnel-weighted glass (glassShader) — reflective and nearly opaque at grazing angles, darker
  //    from outside, light from inside (cockpit view keeps a clear windscreen).
  const WIN_RE = /glass|window|windscreen|windshield|cristal|vidrio/i;
  const NOT_GLASS_RE = /seat|belt|icon|badge|button|pedal|wiper|rim|wheel|tyre|tire|plate|licen|engine|cabin|cockpit|chrome|interior|(^|_)int_|shift|stee?r|dash|grid|surr|border|trim/i;
  const LENS_RE = /light|lamp|lens|head|tail|brake|stop|indicator|signal|blinker|turn|reflector|(^|_)red|orange|amber/i;
  const lampNames = new Set([...(info.lamps?.head || []), ...(info.lamps?.tail || [])]);
  const [, , bz0 = -2.2, , by1 = 1.3, bz1 = 2.2] = info.bbox || [];
  const mbox = new Map(); // material → world box of its meshes (lens detection for generic names: Material.002 …)
  scene.traverse(o => { if (!o.isMesh) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m) (mbox.get(m) || mbox.set(m, new THREE.Box3()).get(m)).union(b); });
  const atEnd = m => { const b = mbox.get(m); if (!b || b.isEmpty()) return false; const hl = (bz1 - bz0) / 2, zc = (b.min.z + b.max.z) / 2 - (bz0 + bz1) / 2;
    return Math.abs(zc) > 0.72 * hl && b.max.y < 0.8 * by1 && b.max.y - b.min.y < 0.35 * by1 && b.max.z - b.min.z < 0.3 * hl * 2; };
  const winMeshes = [];
  scene.traverse(o => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) {
      if (!m || done.has(m)) continue; done.add(m);
      const n = m.name || '', named = WIN_RE.test(n);
      let isG = glass.has(n) || named || m.transmission > 0 || (m.transparent && m.opacity < 0.9 && !/light|lamp|lens/i.test(n));
      if (isG && !named && (NOT_GLASS_RE.test(n) || (m.map && m.opacity >= 0.99 && !(m.transmission > 0)))) isG = false; // trim / atlas, not glass
      if (isG && NOT_GLASS_RE.test(n) && !/window|windscreen|windshield/i.test(n) && !LENS_RE.test(n)) isG = false;      // e.g. "glass_surr"
      if (isG && !glass.has(n) && !m.transparent && !(m.transmission > 0) && (m.map || /border|surr|trim/i.test(n))) isG = false; // opaque window trim / body atlas ("Window_Border", "Black_window_trim")
      const lens = isG && !/window|windscreen|windshield/i.test(n) && (LENS_RE.test(n) || (lampNames.has(n) && !glass.has(n)) || atEnd(m));
      if (lens) {
        // a lamp lens: clear (or its own red / amber), glossy, see-through to the reflector behind it
        const c = m.color ? m.color.clone() : new THREE.Color(1, 1, 1), hsl = c.getHSL({}, THREE.SRGBColorSpace), tinted = hsl.s > 0.45 && hsl.l > 0.12;
        m.userData.lamp = lensRole(n, tinted ? hsl.h : -1, hsl.l, mbox.get(m), bz0, bz1, by1);
        if (!tinted && m.color) m.color.setHex(0xe8edf2);
        m.transparent = true; m.opacity = tinted ? Math.max(m.opacity, 0.62) : THREE.MathUtils.clamp(m.opacity, 0.22, 0.45);
        m.roughness = 0.04; m.metalness = 0; if ('transmission' in m) m.transmission = 0;
        m.depthWrite = false; m.side = THREE.DoubleSide; m.forceSinglePass = true; m.needsUpdate = true;
      } else if (isG) {
        m.transparent = true; m.opacity = 0.62; if (m.color) { m.userData.col0 ??= m.color.getHex(); m.color.setHex(0x0d1419); } m.roughness = 0.03; m.metalness = 0;
        if ('transmission' in m) m.transmission = 0; m.depthWrite = false; m.side = THREE.DoubleSide; m.forceSinglePass = true; m.map = null; m.alphaMap = null; m.alphaTest = 0; // v2.4: one pass (two passes re-validated the shader twice per glass per frame)
        glassShader(m); m.needsUpdate = true;
      } else if (m.transparent && m.map && m.opacity >= 0.99 && !/shadow/i.test(n)) {
        // alpha-textured trim / interior exported as BLEND: cut-out solid (correct depth, no sorting against glass)
        m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true; m.side = THREE.DoubleSide; m.needsUpdate = true;
      } else if (!m.transparent) { m.side = THREE.DoubleSide; m.needsUpdate = true; }
    }
    if (ms.every(m => m && m.userData.mjGlass)) winMeshes.push(o);
  });
  // window normals point out of the cabin (the glass shader tells inside from outside by them; source models mix
  // inward / outward / double shells)
  const cen = new THREE.Vector3(0, by1 * 0.55, (bz0 + bz1) / 2), owner = new Map();
  for (const o of winMeshes) {
    let g = o.geometry; if (owner.has(g) && owner.get(g) !== o) { g = o.geometry = g.clone(); } owner.set(g, o);
    if (!g.attributes.normal) g.computeVertexNormals();
    const P = g.attributes.position, N = g.attributes.normal, nm = new THREE.Matrix3().getNormalMatrix(o.matrixWorld), p = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld).sub(cen); q.fromBufferAttribute(N, i).applyMatrix3(nm);
      if (q.dot(p) < 0) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i));
    }
    N.needsUpdate = true;
  }
}
// v2.14: what a lamp lens is for — by name, colour (h = hue, -1 = clear) and which end of the car it sits at; drives
// the lamp anchors (glow sprites) and which materials light up (head / tail / reverse / indicator)
function lensRole(n, h, l, b, z0, z1, H) {
  const q = (z1 - z0) * 0.16, low = b && !b.isEmpty() && b.max.y < 0.85 * H, front = low && b.min.z > z1 - q, rear = low && b.max.z < z0 + q;
  const amber = h >= 0.04 && h < 0.16, red = h >= 0 && (h < 0.04 || h > 0.93);
  if (/indicator|signal|blinker|turn|orange|amber/i.test(n) || (amber && (front || rear))) return 'ind';
  if (/reverse|backup|back.?light/i.test(n) && rear) return 'rev';
  if (rear && (red || /tail|brake|stop|(^|_)red|rear/i.test(n))) return 'tail';
  if (front && h < 0 && !/tail|brake|stop|rear/i.test(n)) return 'head';
  if (rear && h < 0 && l > 0.3 && !/head|front/i.test(n)) return 'rev'; // a light, clear lens at the back (not a smoked cover)
  return null;
}
// v2.16: the model's REAL lamps, triangle by triangle. Lamp-like materials (by name, own emission, lens, or a red /
// amber colour at either end) are split by where each triangle sits and what colour it is (material colour × its
// texture there): clear at the front → low/high beam, amber → indicator (per corner), red at the back → tail + brake,
// red high in the middle → high-mount stop lamp, clear at the back → reversing lamp, fog-named → fog lamps. Every
// split part gets its own material (userData.lampRole) that buildGlbCar drives from the light switch. Before, whole
// materials were lit (front + back lenses shared one material → the headlight glass glowed red, the windows white),
// most models' lamps were not recognised (generic names), and many models' own baked emission stayed on day and night.
// manifest `lamps` {head|tail|brake|rev|ind|fog|none: [material names]} forces a material's role (the side / end
// still comes from the geometry); `lampPos` {head|tail|ind|indR|rev|fog: [x, y, z]} (left side, mirrored) places the
// glows by hand.
const LAMP_NAME_RE = /light|lamp|lens|lght|r(ü|ue?)?cklicht|head|(?<!de)tail|brake|break|stop|blink|signal|indic|turn|revers|backup|fog|glow|phare|feu|luz|licht|leucht|(^|[^a-z])(red|orange|amber)/i;
const LAMP_EXCL_RE = /dis[ck]|caliper|hub|rotor|pad|interior|interier|(^|[_\s.-])int[_\s.-]|seat|belt|dash|gauge|icon|button|stee?r|cockpit|symbol|badge|logo|emblem|trim|stripe|paint|tyre|tire|rim|wheel|mirror|plate|licen|frame|housing|bezel|plastic|shadow|metal|carcolor|body/i;
const N_HEAD = /head|front|phare|scheinw|(^|_)hl(_|$)|avant/i, N_TAIL = /(?<!de)tail|rear|back|stop|brake|break|r(ü|ue?)?cklicht|(^|_)tl(_|$)/i, N_IND = /blink|signal|indic|turn|orange|amber|clignot/i, N_REV = /revers|backup/i, N_FOG = /fog/i;
const _texCache = new WeakMap();
function texSampler(tex) {
  if (!tex?.image) return null; let s = _texCache.get(tex); if (s !== undefined) return s;
  try {
    const im = tex.image, W = 128, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, W, H); const d = g.getImageData(0, 0, W, H).data;
    tex.updateMatrix(); const M = tex.matrix.clone(), v = new THREE.Vector2();
    s = (u, w) => { v.set(u, w).applyMatrix3(M); const x = Math.floor((v.x - Math.floor(v.x)) * W) % W, y = Math.floor((v.y - Math.floor(v.y)) * H) % H, i = (y * W + x) * 4; return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]; };
  } catch { s = null; }
  _texCache.set(tex, s); return s;
}
const S2L = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4), toS = l => l.map(v => Math.min(1, v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
function lampSplit(scene, info) {
  const [bx0 = -0.9, , bz0 = -2.2, bx1 = 0.9, by1 = 1.3, bz1 = 2.2] = info.bbox || [], L = bz1 - bz0, H = by1;
  const zq = Math.min(1.1, Math.max(0.55, L * 0.2)), paint = new Set(info.paint || []), cut = info.lampCut; // lampCut: [[x0,y0,z0,x1,y1,z1]] never a lamp
  // lamps {role: [name | [name, [x0,y0,z0,x1,y1,z1]]]}: a box limits the forced role to that part of the material
  const force = new Map(), fbox = new Map(); for (const [r, list] of Object.entries(info.lamps || {})) if (Array.isArray(list) && r !== 'atlas') for (const it of list) { const n = Array.isArray(it) ? it[0] : it; force.set(n, r); if (Array.isArray(it)) fbox.set(n, it[1]); }
  scene.updateMatrixWorld(true); const inv = scene.matrixWorld.clone().invert();
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), R = new THREE.Vector3(), C = new THREE.Vector3(), m4 = new THREE.Matrix4();
  const roleMats = new Map(), mk = (m, role) => { const k = m.uuid + role; let c = roleMats.get(k); if (!c) { c = cloneMat(m); c.name = m.name; c.userData.lampRole = role; roleMats.set(k, c); } return c; };
  const offMats = new Map(), off = m => { let c = offMats.get(m); if (!c) { c = cloneMat(m); c.emissive?.setHex(0); c.emissiveMap = null; offMats.set(m, c); } return c; };
  const atlas = new Set(info.lamps?.atlas || []); // textured materials (even the paint) whose red / amber / white texels at either end are lamps
  // per material: how much of it lies between the lamp zones (a plain red / amber material all over the car is paint, not a lamp)
  const midShare = new Map(); { const cnt = new Map(), V = new THREE.Vector3();
    scene.traverse(o => { if (!o.isMesh || isWheel(o)) return; const g = o.geometry, pos = g.attributes.position, idx = g.index, n = idx ? idx.count : pos.count, ms = Array.isArray(o.material) ? o.material : [o.material];
      const groups = Array.isArray(o.material) && g.groups.length ? g.groups : [{ start: 0, count: n, materialIndex: 0 }]; m4.multiplyMatrices(inv, o.matrixWorld);
      for (const gr of groups) { const m = ms[gr.materialIndex ?? 0]; if (!m) continue; const c = cnt.get(m) || cnt.set(m, [0, 0]).get(m); const step = 3 * Math.max(1, Math.floor(gr.count / 3 / 300));
        for (let t = gr.start; t < Math.min(gr.start + gr.count, n); t += step) { V.fromBufferAttribute(pos, idx ? idx.getX(t) : t).applyMatrix4(m4); c[0]++; if (V.z < bz1 - zq && V.z > bz0 + zq) c[1]++; } } });
    for (const [m, [a, b]] of cnt) midShare.set(m, a ? b / a : 0); }
  const isCand = m => {
    if (!m) return false; const n = m.name || '';
    if (atlas.has(n)) return true;
    if (force.has(n)) return force.get(n) !== 'none';
    if (paint.has(n) || m.userData.mjGlass || LAMP_EXCL_RE.test(n)) return false;
    if (LAMP_NAME_RE.test(n) || m.userData.lamp) return true;
    const emis = m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b > 0.05 || m.emissiveMap);
    if (emis) return true;
    const hsl = m.color?.getHSL({}, THREE.SRGBColorSpace); return !!hsl && hsl.s > 0.5 && hsl.l > 0.15 && (hsl.h < 0.17 || hsl.h > 0.92) && !m.map && (midShare.get(m) ?? 1) < 0.1; // red / amber plain colour at the ends only (decided per triangle by position)
  };
  const work = [];
  scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || isWheel(o) || o.geometry.morphAttributes?.position) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material]; if (ms.some(isCand)) work.push(o); });
  const cls = rgb => { const c = new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2]), h = c.getHSL({}, THREE.SRGBColorSpace); // rgb in sRGB 0..1
    if (h.s > 0.4 && h.l > 0.12 && h.l < 0.97 && (h.h < 0.045 || h.h > 0.92)) return 'red';
    if (h.s > 0.45 && h.l > 0.2 && h.h >= 0.045 && h.h < 0.17) return 'amber';
    if (h.l > 0.42 && h.s < 0.4) return h.l > 0.62 ? 'white' : 'clear'; return 'dark'; };
  const tri = (o, t) => { const g = o.geometry, idx = g.index, a = idx ? idx.getX(t) : t, b = idx ? idx.getX(t + 1) : t + 1, c = idx ? idx.getX(t + 2) : t + 2; return [a, b, c]; };
  const pending = [];
  for (const o of work) {
    const g = o.geometry, pos = g.attributes.position, uv = g.attributes.uv, vc = g.attributes.color, idx = g.index, ms = Array.isArray(o.material) ? o.material : [o.material];
    m4.multiplyMatrices(inv, o.matrixWorld);
    const groups = Array.isArray(o.material) && g.groups.length ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    const buckets = new Map(); // matIndex|role → [indices]
    for (const gr of groups) {
      const mi = gr.materialIndex ?? 0, m = ms[mi]; if (!m) continue; const cand = isCand(m), n = m.name || '', fr = force.get(n);
      const base = m.color ? [m.color.r, m.color.g, m.color.b] : [1, 1, 1];
      const smap = cand && m.map && uv ? texSampler(m.map) : null, semi = cand && m.emissiveMap && uv ? texSampler(m.emissiveMap) : null, vcol = cand && m.vertexColors && vc;
      const ecol = m.emissive ? [m.emissive.r, m.emissive.g, m.emissive.b] : [0, 0, 0], emOn = ecol[0] + ecol[1] + ecol[2] > 0.05;
      let uniCls = cls(toS(base)); if (emOn && !m.map && uniCls === 'dark') { const ec = cls(toS(ecol)); if (ec === 'red' || ec === 'amber') uniCls = ec; }
      const lens = !!m.userData.lamp || (m.transparent && !m.map), tex = !!(smap || vcol);
      const end = Math.min(gr.start + gr.count, idx ? idx.count : pos.count);
      for (let t = gr.start; t + 2 < end + 0; t += 3) {
        const [a, b, c] = tri(o, t);
        let role = 'none';
        if (cand) {
          P.fromBufferAttribute(pos, a).applyMatrix4(m4); Q.fromBufferAttribute(pos, b).applyMatrix4(m4); R.fromBufferAttribute(pos, c).applyMatrix4(m4);
          C.copy(P).add(Q).add(R).divideScalar(3);
          const front = C.z > bz1 - zq, rear = C.z < bz0 + zq, side = C.x > 0.03 ? 'L' : C.x < -0.03 ? 'R' : '';
          if (cut && cut.some(q => C.x > q[0] && C.y > q[1] && C.z > q[2] && C.x < q[3] && C.y < q[4] && C.z < q[5])) { const k = mi + '|none'; let B = buckets.get(k); if (!B) buckets.set(k, B = []); B.push(a, b, c); continue; }
          let col = uniCls;
          if (smap || semi || vcol) { const u = uv ? (uv.getX(a) + uv.getX(b) + uv.getX(c)) / 3 : 0, w = uv ? (uv.getY(a) + uv.getY(b) + uv.getY(c)) / 3 : 0;
            let rgb = null;
            if (semi && emOn) { const e = semi(u, w); const s2 = [S2L(e[0]) * ecol[0], S2L(e[1]) * ecol[1], S2L(e[2]) * ecol[2]]; if (s2[0] + s2[1] + s2[2] > 0.3) rgb = s2; }
            if (!rgb) { rgb = base.slice(); if (smap) { const e = smap(u, w); rgb = [S2L(e[0]) * rgb[0], S2L(e[1]) * rgb[1], S2L(e[2]) * rgb[2]]; }
              if (vcol) for (let k = 0; k < 3; k++) rgb[k] *= (vc.getComponent(a, k) + vc.getComponent(b, k) + vc.getComponent(c, k)) / 3; }
            col = cls(toS(rgb)); }
          const hi = C.y > 0.62 * H, centre = Math.abs(C.x) < 0.3;
          let done = false;
          const fb = fr && fbox.get(n), inFb = !fb || (C.x > fb[0] && C.y > fb[1] && C.z > fb[2] && C.x < fb[3] && C.y < fb[4] && C.z < fb[5]);
          if (fr && !inFb) done = true; // outside its box: not a lamp
          else if (fr) { // forced by the manifest: that role at the end it belongs to (elsewhere: found as usual)
            done = true;
            if (fr === 'head' && front && Math.abs(C.x) > 0.12) role = 'head';
            else if (fr === 'tail' && rear) role = 'tail';
            else if (fr === 'brake' && rear) role = 'brake';
            else if (fr === 'rev' && rear) role = 'rev';
            else if (fr === 'ind' && (front || rear) && side) role = 'ind' + (front ? 'F' : 'R') + side;
            else if (fr === 'fog' && (front || rear)) role = front ? 'ffog' : side === 'R' ? 'rfog' : 'none';
            else done = false;
          } else if (atlas.has(n)) { // texels only: red → tail, amber → indicator, bright white at the front → headlamp
            done = true;
            if (C.y < 0.86 * H && (front || rear)) role = col === 'red' && rear ? 'tail' : col === 'amber' && side ? 'ind' + (front ? 'F' : 'R') + side : col === 'white' && front && Math.abs(C.x) > 0.16 && !paint.has(n) ? 'head' : 'none'; // (white texels of a painted atlas are body)
          }
          if (done) {} else if (C.y < 0.86 * H || (rear && centre)) {
            if (front) {
              if (N_FOG.test(n) && !tex) role = 'ffog';
              else if ((N_IND.test(n) && !tex) || col === 'amber') role = side ? 'indF' + side : 'none';
              else if (col === 'red' || Math.abs(C.x) < 0.16) role = 'none'; // no headlamp on the centre line (badges, grille chrome)
              else if (N_TAIL.test(n) && !N_HEAD.test(n) && !tex) role = 'none';
              else if (col === 'clear' || col === 'white') role = 'head';
              else if (col === 'dark' && (N_HEAD.test(n) || lens || (/light|lamp/i.test(n) && !tex))) role = 'head';
            } else if (rear) {
              if (N_FOG.test(n) && !tex) role = side === 'R' ? 'rfog' : 'none';
              else if (N_IND.test(n) && !tex) role = side ? 'indR' + side : 'none';
              else if (N_REV.test(n) && !tex) role = 'rev';
              else if (col === 'red') role = centre && hi && (Math.abs(C.x) < 0.2 || /stop|brake|break/i.test(n)) ? 'brake' : 'tail';
              else if (col === 'amber') role = side ? 'indR' + side : 'none';
              else if (col === 'white' || col === 'clear') role = N_TAIL.test(n) && !tex ? 'tail' : (N_HEAD.test(n) && !tex) ? 'none' : (tex ? col === 'white' : (lens || /light|lamp/i.test(n))) ? 'rev' : 'none';
              else if (col === 'dark' && N_TAIL.test(n) && !N_HEAD.test(n)) role = 'tail';
            }
          }
          if (role === 'tail' && centre && hi && /stop|brake|break/i.test(n)) role = 'brake';
        }
        const k = mi + '|' + role; let B = buckets.get(k); if (!B) buckets.set(k, B = []); B.push(a, b, c);
      }
    }
    // a few stray texels (a white highlight on a red lens) are not a reversing lamp
    for (const [k, B] of [...buckets]) { const [mi, role] = k.split('|'); if (role === 'rev' && B.length < 24 && (ms[mi].map || ms[mi].vertexColors)) { buckets.delete(k); const k2 = mi + '|tail'; buckets.set(k2, [...(buckets.get(k2) || []), ...B]); } }
    const matFor = k => { const [mi, role] = k.split('|'), m = ms[+mi]; if (role !== 'none') return mk(m, role); return isCand(m) && m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b > 0.05 || m.emissiveMap) ? off(m) : m; };
    pending.push({ o, buckets, matFor });
  }
  // lamp boxes (per role and side) from the lamp triangles
  const acc = {}; const A = (k, p, w) => { const r = acc[k] ||= { x: 0, y: 0, z: 0, w: 0, zmax: -1e9, zmin: 1e9, x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }; r.x += p.x * w; r.y += p.y * w; r.z += p.z * w; r.w += w; r.zmax = Math.max(r.zmax, p.z); r.zmin = Math.min(r.zmin, p.z); r.x0 = Math.min(r.x0, p.x); r.x1 = Math.max(r.x1, p.x); r.y0 = Math.min(r.y0, p.y); r.y1 = Math.max(r.y1, p.y); };
  const E1 = new THREE.Vector3(), E2 = new THREE.Vector3();
  const accumulate = (o, buckets) => { const pos = o.geometry.attributes.position; m4.multiplyMatrices(inv, o.matrixWorld);
    for (const [k, B] of buckets) { const role = k.split('|')[1]; if (role === 'none' || role === 'lens') continue; const step = 3 * Math.max(1, Math.floor(B.length / 3 / 500));
      for (let t = 0; t + 2 < B.length; t += step) { P.fromBufferAttribute(pos, B[t]).applyMatrix4(m4); Q.fromBufferAttribute(pos, B[t + 1]).applyMatrix4(m4); R.fromBufferAttribute(pos, B[t + 2]).applyMatrix4(m4);
        const w = E1.subVectors(Q, P).cross(E2.subVectors(R, P)).length() * 0.5 + 1e-7; C.copy(P).add(Q).add(R).divideScalar(3);
        A(role + (/ind/.test(role) ? '' : C.x > 0 ? 'L' : 'R'), C, w); } } };
  for (const { o, buckets } of pending) accumulate(o, buckets);
  const boxes = Object.entries(acc).filter(([, r]) => r.x1 - r.x0 < 1.3).map(([k, r]) => ({ role: /^ind/.test(k) ? k : k.replace(/[LR]$/, ''), key: k, r }));
  // pass 2 — window glass over the lamps: several models cover head / tail lamps with the window-glass material (dark
  // film → the lamps never showed). Glass inside a lamp box takes that lamp's role as a clear lens; glass low at either
  // end (below any window) is a lens too.
  const lensMats = new Map(), lensMat = (m, role) => { const k = m.uuid + role; let c = lensMats.get(k); if (!c) {
    c = m.clone(); c.onBeforeCompile = () => {}; c.customProgramCacheKey = () => 'lens'; delete c.userData.mjGlass; const c0 = m.userData.col0;
    c.color.setHex(c0 !== undefined && new THREE.Color(c0).getHSL({}, THREE.SRGBColorSpace).s > 0.45 ? c0 : 0xe8edf2); c.opacity = 0.3; c.roughness = 0.04;
    if (role !== 'lens') c.userData.lampRole = role; lensMats.set(k, c); } return c; };
  scene.traverse(o => { if (!o.isMesh || isWheel(o) || o.isSkinnedMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    if (!ms.some(m => m?.userData.mjGlass) || pending.some(p => p.o === o)) return;
    const g = o.geometry, pos = g.attributes.position, idx = g.index; m4.multiplyMatrices(inv, o.matrixWorld);
    const groups = Array.isArray(o.material) && g.groups.length ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    const buckets = new Map(); let any = false;
    for (const gr of groups) { const mi = gr.materialIndex ?? 0, m = ms[mi]; const end = Math.min(gr.start + gr.count, idx ? idx.count : pos.count);
      for (let t = gr.start; t + 2 < end; t += 3) { const [a, b, c] = tri(o, t); let role = 'none';
        if (m?.userData.mjGlass) { P.fromBufferAttribute(pos, a).applyMatrix4(m4); Q.fromBufferAttribute(pos, b).applyMatrix4(m4); R.fromBufferAttribute(pos, c).applyMatrix4(m4); C.copy(P).add(Q).add(R).divideScalar(3);
          const front = C.z > bz1 - zq, rear = C.z < bz0 + zq;
          const cutHere = cut && cut.some(q => C.x > q[0] && C.y > q[1] && C.z > q[2] && C.x < q[3] && C.y < q[4] && C.z < q[5]);
          if ((front || rear) && C.y < 0.8 * H && !cutHere && !PLATE_RE.test(m.name || '')) {
            const bx = boxes.find(({ r }) => C.x > r.x0 - 0.03 && C.x < r.x1 + 0.03 && C.y > r.y0 - 0.03 && C.y < r.y1 + 0.03 && C.z > r.zmin - 0.1 && C.z < r.zmax + 0.1 && (front ? r.zmax > bz1 - zq : r.zmin < bz0 + zq));
            const c0 = m.userData.col0 !== undefined ? cls(toS(new THREE.Color(m.userData.col0).toArray())) : 'dark';
            if (bx && !(bx.role === 'head' && Math.abs(C.x) < 0.16)) role = bx.role;
            // glass low at either end, below any window, is a lamp cover: clear at the front → headlamp, at the back a lens (red → tail)
            else if (front && C.y < Math.min(0.62 * H, 0.85) && C.y > 0.42 && Math.abs(C.x) > 0.3 && !boxes.some(b => b.role === 'head')) role = c0 === 'amber' ? (C.x > 0 ? 'indFL' : 'indFR') : c0 === 'red' ? 'lens' : 'head';
            else if (rear && C.y < Math.min(0.55 * H, 0.8)) role = c0 === 'red' ? 'tail' : 'lens';
          } }
        if (role !== 'none') any = true;
        const k = mi + '|' + role; let B = buckets.get(k); if (!B) buckets.set(k, B = []); B.push(a, b, c); } }
    if (any) pending.push({ o, buckets, matFor: k => { const [mi, role] = k.split('|'), m = ms[+mi]; return role === 'none' ? m : lensMat(m, role); } });
  });
  // build: one mesh per part (same transform, shared vertex buffers, own index)
  for (const { o, buckets, matFor } of pending) {
    const keys = [...buckets.keys()];
    if (keys.length === 1 && !Array.isArray(o.material)) { o.material = matFor(keys[0]); continue; }
    const g = o.geometry, parent = o.parent; let first = true;
    for (const k of keys) {
      const sub = new THREE.BufferGeometry(); for (const [nm, at] of Object.entries(g.attributes)) sub.setAttribute(nm, at);
      sub.setIndex(buckets.get(k));
      if (first) { o.geometry = sub; o.material = matFor(k); first = false; continue; }
      const me = new THREE.Mesh(sub, matFor(k)); me.name = o.name + '#' + k.split('|')[1]; me.position.copy(o.position); me.quaternion.copy(o.quaternion); me.scale.copy(o.scale);
      me.castShadow = o.castShadow; me.receiveShadow = o.receiveShadow; me.renderOrder = o.renderOrder; parent.add(me); me.updateMatrixWorld(true);
    }
  }
  // the models' own always-on emission outside the lamps (glowing wheels, trims, white-hot "lamp" atlases) is switched off;
  // the cabin keeps its (dash / gauge) glow
  scene.traverse(o => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    const out = ms.map(m => { if (!m || m.userData.lampRole || !m.emissive || !(m.emissive.r + m.emissive.g + m.emissive.b > 0.05 || m.emissiveMap)) return m;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv);
      const inCabin = !isWheel(o) && b.max.z < bz1 - zq && b.min.z > bz0 + zq && b.min.y > 0.25 * H;
      return inCabin ? m : off(m); });
    o.material = Array.isArray(o.material) ? out : out[0]; });
  // anchors: where each lamp is (area-weighted centre, outer face), per side — glows, beams and the rear fog lamp sit there
  const out = {}; for (const [k, r] of Object.entries(acc)) if (r.w > 0) out[k] = { p: [r.x / r.w, r.y / r.w, r.z / r.w], zmax: r.zmax, zmin: r.zmin, w: r.x1 - r.x0, h: r.y1 - r.y0 };
  return out;
}
// Window glass: alpha and reflection follow the view angle (Fresnel) — mostly reflection at grazing angles, a dark
// tint face-on; reflections are added on top of what is seen through (not faded with the alpha). From inside the car
// (vertex normal facing away from the viewer, see fixMaterials) the glass is a light tint, so the cockpit view stays clear.
function glassShader(m) {
  m.userData.mjGlass = true;
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
    {
      #ifdef FLAT_SHADED
        vec3 gN = normal;
      #else
        vec3 gN = normalize( vNormal );
      #endif
      float gNV = dot( gN, geometryViewDir ), gOut = smoothstep( -0.3, 0.05, gNV ), gF = pow( 1.0 - abs( gNV ), 4.0 );
      float gA = mix( 0.14 + 0.2 * gF, mix( diffuseColor.a, 0.94, gF ), gOut );
      vec3 gSpec = totalSpecular * mix( 0.12, 1.6, gOut );
      gl_FragColor = vec4( totalDiffuse + totalEmissiveRadiance + gSpec / gA, gA );
    }`);
  };
  m.customProgramCacheKey = () => 'mjglass';
}
// Material.clone() drops onBeforeCompile → the glass shader is put back on copies (per-car paint / lamp / clipped body copies)
const cloneMat = m => { const c = m.clone(); if (m.userData.mjGlass) glassShader(c); return c; };
// v2.16: a model exported facing backwards (manifest forward "-z", e.g. the Prelude: tail lamps at the "front", the
// front wheels steering at the back) is turned round inside its root, its wheel nodes renamed to the corners they are at
function faceForward(e) {
  const sc = e.scene, turn = new THREE.Group(); turn.name = 'mj_turn'; turn.rotation.y = Math.PI;
  for (const c of [...sc.children]) turn.add(c); sc.add(turn);
  const ren = { wheel_fl: 'wheel_rr', wheel_fr: 'wheel_rl', wheel_rl: 'wheel_fr', wheel_rr: 'wheel_fl' }, ws = [];
  sc.traverse(o => { if (ren[o.name]) ws.push(o); }); for (const o of ws) o.name = ren[o.name];
  const b = e.info.bbox; if (b && !e.info._turned) { e.info.bbox = [-b[3], b[1], -b[5], -b[0], b[4], -b[2]]; e.info._turned = true; }
}
export function requestGlb(id, lod) {
  if (lod === 'lo' && !manifest) return loadManifest().then(() => requestGlb(id, lod));
  const key = ckey(id, lod); id = mid(id);
  let e = cache.get(key); if (e) return e.promise;
  e = {}; cache.set(key, e);
  e.promise = loadManifest().then(m => {
    const info = m[id]; if (!info) throw new Error('no model for ' + id);
    if (!gltf) { gltf = new GLTFLoader(); gltf.setMeshoptDecoder(MeshoptDecoder); }
    return gltf.loadAsync(new URL(key.endsWith('@lo') ? info.lo : info.file, BASE).href).then(g => { e.scene = g.scene; e.info = info; if (info.forward === '-z') faceForward(e); e.scene.updateMatrixWorld(true); if (info.split) splitLivery(e.scene, info); fixMaterials(e.scene, info); e.lamps = lampSplit(e.scene, info); e.scene.traverse(o => { if (o.geometry) o.geometry.userData.shared = true; }); return precompile(e); });
  });
  e.promise.catch(err => { if (!/no model/.test(err.message)) console.warn('car model', id, err); });
  return e.promise;
}

const ease = t => t * t * (3 - 2 * t);
// v2.4: compile a freshly loaded model's shaders (in parallel, off the frame) before it is shown
let compiler = null;
export function setGlbCompiler(fn) { compiler = fn; }
function precompile(e) {
  if (!compiler) return e;
  try { const p = compiler(e.scene); if (!p) return e; return Promise.race([p, new Promise(r => setTimeout(r, 4000))]).then(() => e, () => e); } catch { return e; }
}
// v2.4: traffic-LOD copy of a model — every static mesh merged per material (geometry cached on the entry and shared by
// all instances), wheels / plates / multi-material meshes kept as they are. A typical model drops from hundreds of
// nodes and draw calls to a dozen, which is most of the per-frame CPU cost of a busy road.
const NOFLAT = typeof location !== 'undefined' && /[?&]noflat=1/.test(location.search);
const PLATE_RE = /plate|licen|kennz|nummer|matric/i;
// quantized (normalized int) / interleaved attribute → plain float (applyMatrix4 would clamp a normalized one to ±1)
function toFloat(a) {
  if (!a.isInterleavedBufferAttribute && !a.normalized && a.array instanceof Float32Array) return a;
  const n = a.count, k = a.itemSize, f = new Float32Array(n * k);
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) f[i * k + j] = a.getComponent ? a.getComponent(i, j) : [a.getX, a.getY, a.getZ, a.getW][j].call(a, i);
  return new THREE.BufferAttribute(f, k);
}
export function flatClone(e) {
  if (!e.flat) {
    const sc = e.scene; sc.updateMatrixWorld(true); const inv = sc.matrixWorld.clone().invert(), m4 = new THREE.Matrix4();
    const groups = new Map(), keep = [];
    sc.traverse(o => {
      if (!o.isMesh) return;
      let hidden = false; for (let q = o; q; q = q.parent) if (!q.visible) hidden = true; if (hidden) return;
      const top = (() => { for (let q = o; q && q !== sc; q = q.parent) if (/^wheel_(fl|fr|rl|rr)$/.test(q.name)) return q; return null; })();
      if (top) { if (!keep.includes(top)) keep.push(top); return; }
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      if (Array.isArray(o.material) || o.isSkinnedMesh || o.isInstancedMesh || o.geometry.morphAttributes?.position || PLATE_RE.test(o.name) || PLATE_RE.test(ms[0]?.name || '') || plateShaped(o, inv, e.info.bbox[2], e.info.bbox[5])) { keep.push(o); return; }
      const gm = o.geometry, at = Object.keys(gm.attributes).sort().map(n => { const a = gm.attributes[n]; return n + a.itemSize; }).join(',');
      const k = o.material.uuid + '|' + at + '|' + (gm.index ? 'x' : '');
      if (!groups.has(k)) groups.set(k, { mat: o.material, list: [] });
      groups.get(k).list.push(o);
    });
    const merged = [];
    for (const { mat, list } of groups.values()) {
      const geos = list.map(o => { const g = o.geometry.clone(); for (const n of Object.keys(g.attributes)) g.setAttribute(n, toFloat(g.attributes[n])); g.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld)); g.morphAttributes = {}; return g; });
      let g = null; try { g = geos.length === 1 ? geos[0] : mergeGeometries(geos, false); } catch { g = null; }
      if (g) { g.userData.shared = true; merged.push({ g, mat, name: list[0].name }); if (geos.length > 1) geos.forEach(x => x.dispose()); }
      else list.forEach(o => keep.push(o));
    }
    e.flat = { merged, keep: keep.map(o => ({ o, m: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld) })) };
  }
  const vis = new THREE.Group(); vis.position.copy(e.scene.position); vis.quaternion.copy(e.scene.quaternion); vis.scale.copy(e.scene.scale);
  for (const { g, mat, name } of e.flat.merged) { const me = new THREE.Mesh(g, mat); me.name = name; me.matrixAutoUpdate = false; vis.add(me); }
  for (const { o, m } of e.flat.keep) { const c = o.clone(true); m.decompose(c.position, c.quaternion, c.scale); vis.add(c); }
  return vis;
}
// v2.4.1 / v2.16: where the real model's lamps are — per side (x > 0 is the car's left), in the model's own space, from
// the lamp triangles found by lampSplit (manifest `lampPos` overrides; a guess from the body box when a model has none).
// Cached per model.
export function lampAnchors(e) {
  if (e.lampA !== undefined) return e.lampA;
  const A = e.lamps || {}, [bx0, , bz0, bx1, by1, bz1] = e.info.bbox, hw = Math.max(bx1, -bx0), O = e.info.lampPos || {};
  const ok = a => a && a.w < 1.3 && a.h < 0.8;
  const mir = (p, sg) => [Math.abs(p[0]) * sg, p[1], p[2]];
  const out = { head: [], tail: [], ind: [], rev: [], fog: [], ffog: [], brake: [] };
  for (const side of ['L', 'R']) { const sg = side === 'L' ? 1 : -1;
    const h = A['head' + side], t = A['tail' + side];
    const hp = O.head ? mir(O.head, sg) : ok(h) ? [h.p[0], h.p[1], h.zmax + 0.02] : [sg * (hw - 0.35), 0.68, bz1 + 0.02];
    const tp = O.tail ? mir(O.tail, sg) : ok(t) ? [t.p[0], t.p[1], t.zmin - 0.02] : [sg * (hw - 0.3), 0.85, bz0 - 0.02];
    out.head.push({ side, p: hp }); out.tail.push({ side, p: tp });
    // indicators: the model's own amber lamps (front / rear corner), else the outer edge of the head / tail lamp
    const iF = A['indF' + side], iR = A['indR' + side];
    const tw = ok(t) ? Math.max(0.05, t.w * 0.3) : 0.12, hW = ok(h) ? h.w : 0.3;
    out.ind.push({ side, p: O.ind ? mir(O.ind, sg) : ok(iF) ? [iF.p[0], iF.p[1], iF.zmax + 0.015] : [hp[0] + sg * hW * 0.45, hp[1] - 0.02, hp[2] - 0.01] },
      { side, p: O.indR ? mir(O.indR, sg) : ok(iR) ? [iR.p[0], iR.p[1], iR.zmin - 0.015] : [tp[0] + sg * tw, tp[1] + 0.01, tp[2] + 0.01] });
    // reversing lamps: the model's own (clear lenses at the back), else the inner part of the tail lamp
    const r = A['rev' + side];
    out.rev.push({ side, p: O.rev ? mir(O.rev, sg) : ok(r) ? [r.p[0], r.p[1], r.zmin - 0.015] : [tp[0] - sg * tw, tp[1] - 0.03, tp[2] + 0.005] });
    const ff = A['ffog' + side]; if (ok(ff)) out.ffog.push({ side, p: [ff.p[0], ff.p[1], ff.zmax + 0.015] });
  }
  // ONE rear fog lamp, on the driver's (right, x < 0) side as on Japanese cars: the model's own if it has one, else the
  // inner, lower part of the right tail lamp
  { const f = A.rfogR, tR = out.tail[1].p, t = A.tailR, tw = ok(t) ? Math.max(0.05, t.w * 0.3) : 0.12;
    out.fog.push({ side: 'R', p: O.fog ? mir(O.fog, -1) : ok(f) ? [f.p[0], f.p[1], f.zmin - 0.015] : [tR[0] + tw * 0.5, tR[1] - 0.035, tR[2] - 0.004] }); }
  // high-mount stop lamp
  { const bl = A.brakeL, br = A.brakeR, list = [bl, br].filter(Boolean);
    if (list.length) { const wsum = list.length, p = [0, list.reduce((s, a) => s + a.p[1], 0) / wsum, Math.min(...list.map(a => a.zmin)) - 0.01]; out.brake.push({ side: 'C', p }); } }
  return (e.lampA = out);
}
let _glowTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _glowTex = new THREE.CanvasTexture(c); return _glowTex;
}
const GLOW_MATS = {};
function glowMat(hex) { return GLOW_MATS[hex] ||= new THREE.SpriteMaterial({ map: glowTex(), color: hex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: true }); }
// v2.5.2: a model's own (foreign) plate whose name says nothing — a thin plate-sized panel on the centre line at either
// end of the car (several models showed it under the Japanese plate)
const _pb = new THREE.Box3(), _pc = new THREE.Vector3(), _ps = new THREE.Vector3();
function plateShaped(o, inv, z0, z1) {
  const g = o.geometry; if (!g?.attributes?.position || g.attributes.position.count > 3000) return false;
  if (!g.boundingBox) g.computeBoundingBox();
  _pb.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (inv) _pb.applyMatrix4(inv);
  _pb.getCenter(_pc); _pb.getSize(_ps);
  const L = Math.max(Math.abs(z0), Math.abs(z1));
  return Math.abs(_pc.x) < 0.25 && _ps.x > 0.26 && _ps.x < 0.66 && _ps.y > 0.06 && _ps.y < 0.24 && _ps.z < 0.14 && Math.abs(_pc.z) > L * 0.75;
}
const isWheel = o => { for (let p = o; p; p = p.parent) if (/^wheel_(fl|fr|rl|rr)$/.test(p.name)) return true; return false; };
const REAR_ENGINE = car => car.drive === 'MR' || car.drive === 'RR';

// top-surface profile along the centre line → where the bonnet (or engine lid) starts and ends
function analyseBay(e, rear) {
  const key = rear ? 'rear' : 'front'; e.bay ||= {}; if (key in e.bay) return e.bay[key];
  const meshes = []; e.scene.traverse(o => { if (o.isMesh && !isWheel(o)) meshes.push(o); });
  const rc = new THREE.Raycaster(); const dn = new THREE.Vector3(0, -1, 0); const o = new THREE.Vector3();
  const bb = e.info.bbox; const [x0, , z0, x1, y1, z1] = bb;
  const hy = (z, x = 0) => { o.set(x, y1 + 1, z); rc.set(o, dn); const h = rc.intersectObjects(meshes, false)[0]; return h ? h.point.y : null; };
  const wheel = n => { const w = e.scene.getObjectByName('wheel_' + n); return w ? w.getWorldPosition(new THREE.Vector3()) : null; };
  const L = z1 - z0; let res = null;
  const axle = rear ? (wheel('rl')?.z ?? z0 + L * 0.2) : (wheel('fl')?.z ?? z1 - L * 0.2);
  const h0 = hy(axle);
  if (h0 !== null) {
    const step = 0.03, inward = rear ? 1 : -1, outward = -inward;
    let zc = null, ze = null;
    // windscreen (or rear window) base: where the surface turns steeply upwards
    let prev = h0;
    for (let z = axle + inward * step; Math.abs(z - axle) < L * 0.6; z += inward * step) { const h = hy(z); if (h === null) continue; if ((h - prev) / step > 0.42 && h > h0 + 0.04) { zc = z - inward * 0.06; break; } prev = h; }
    // leading (trailing) edge: where it drops steeply towards the bumper
    prev = h0;
    for (let z = axle + outward * step; z > z0 && z < z1; z += outward * step) { const h = hy(z); if (h === null || (prev - h) / step > 0.7) { ze = z - outward * 0.04; break; } prev = h; }
    if (zc !== null && ze !== null && Math.abs(zc - ze) > 0.45) {
      const za = Math.min(zc, ze), zb = Math.max(zc, ze);
      let yMin = 1e9; for (let z = za; z <= zb; z += 0.05) { const h = hy(z); if (h !== null) yMin = Math.min(yMin, h); }
      const hx = Math.min(x1, -x0) * 0.7;
      // does the model already have an engine under the panel? (non-paint geometry close below the bonnet)
      const paint = new Set(e.info.paint || []); let hits = 0;
      const matOf = h => { const m = h.object.material; return Array.isArray(m) ? m[h.face?.materialIndex ?? 0] : m; };
      for (const fz of [0.25, 0.5, 0.75]) for (const fx of [-0.5, 0, 0.5]) {
        o.set(fx * hx, y1 + 1, za + (zb - za) * fz); rc.set(o, dn);
        const h = rc.intersectObjects(meshes, false).find(h => !paint.has(matOf(h).name) && h.point.y < yMin - 0.03);
        if (h && h.point.y > yMin - 0.45) hits++;
      }
      res = { z0: za, z1: zb, hinge: zc, y: yMin - 0.045, hx, rear, ownEngine: hits >= 4 };
    }
  }
  e.bay[key] = res; return res;
}

const isWhite = hex => { const c = new THREE.Color(hex); return c.r > 0.8 && c.g > 0.8 && c.b > 0.8; };
const FINISH = { metallic: { metalness: 0.45, roughness: 0.36, clearcoat: 1 }, pearl: { metalness: 0.35, roughness: 0.22, clearcoat: 1 }, solid: { metalness: 0.05, roughness: 0.32, clearcoat: 1 }, matte: { metalness: 0.15, roughness: 0.75, clearcoat: 0 } };

/** Build a CarModel around a loaded glTF entry. opts: same as buildCar (+ openable=false to skip the bonnet cut). */
export function buildGlbCar(car, e, opts = {}) {
  const low = opts.lod === 'low';
  // player car / garage (full LOD): the full procedural car (cockpit interior, mirrors, live gauges) is built underneath
  // and swapped in for the first-person view (setCockpitView); everything else only needs the cheap mid shell
  const full = !low && (!opts.lod || opts.lod === 'full');
  const model = buildCar(car, { ...opts, lod: low ? 'low' : full ? 'full' : 'mid' });
  const { root, bodyG, parts, P } = model; const info = e.info;
  model.isGlb = true; model.glbInfo = info;
  // hide the procedural shell (keep plates, police lightbar & door decals), and the procedural wheels
  const procShell = [];
  bodyG.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.visible && !o.userData.isPlate && !o.userData.glbKeep && o.userData.glbDecal === undefined) { o.visible = false; procShell.push(o); } });
  for (const w of parts.wheels) w.steer.traverse(o => { if (o.isMesh) o.visible = false; });
  if (parts.engineBay) parts.engineBay.visible = false;
  const procHood = parts.hood?.pivot || null;
  for (const d of parts.doors) { d.pivot.visible = false; }
  if (!full) { for (const o of procShell) o.matrixWorldAutoUpdate = false; for (const w of parts.wheels) w.steer.traverse(o => { if (o.isMesh) o.matrixWorldAutoUpdate = false; }); for (const d of parts.doors) d.pivot.matrixWorldAutoUpdate = false; } // v2.4: hidden for good → skip their matrices
  const vis = full || NOFLAT ? e.scene.clone(true) : flatClone(e); vis.name = 'glb';
  // per-instance paint & lamp materials (the rest is shared between all instances of this model)
  const paintNames = new Set(info.paint || []), paintMats = [];
  // lamp materials (v2.16): the parts lampSplit cut out of the model, by role (head / tail / brake / rev / indFL … / ffog / rfog)
  const lampM = {};
  const matMap = new Map();
  const ownSet = new Set(); // v2.16: an instance copy is its own owner (the cockpit pass used to copy the copies → the paint / lamp
  // materials driven by setPaint and the light switch were no longer the ones on screen)
  const own = m => { if (ownSet.has(m)) return m; let c = matMap.get(m); if (!c) { c = cloneMat(m); matMap.set(m, c); ownSet.add(c); } return c; };
  vis.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map(m => {
      if (paintNames.has(m.name) && !m.userData.lampRole) { const c = own(m); if (!paintMats.includes(c)) paintMats.push(c); return c; }
      const role = m.userData.lampRole; if (role) { const c = own(m), l = lampM[role] ||= []; if (!l.includes(c)) l.push(c); return c; }
      return m;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
    o.castShadow = !low; o.receiveShadow = true; // v2.4: same on every LOD (materials are shared; a mismatch re-validates the shader per draw)
  });
  bodyG.add(vis);
  // align the axle midpoint with the procedural model's (the physics reference)
  const wf = vis.getObjectByName('wheel_fl'), wr = vis.getObjectByName('wheel_rl');
  root.updateMatrixWorld(true);
  if (wf && wr) { const a = wf.getWorldPosition(new THREE.Vector3()).z, b = wr.getWorldPosition(new THREE.Vector3()).z; vis.position.z = (P.axF + P.axR) / 2 - (a + b) / 2; }
  vis.position.y = -bodyG.position.y; root.updateMatrixWorld(true);
  // the model's own wheels → into the procedural wheel rigs (steer → camber → spin)
  if (info.wheels) for (const w of parts.wheels) {
    const node = vis.getObjectByName('wheel_' + (w.front ? 'f' : 'r') + (w.left ? 'l' : 'r')); if (!node || node.userData.rigged) continue;
    const c = node.getWorldPosition(new THREE.Vector3());
    w.base.copy(c); w.steer.position.copy(c); w.steer.rotation.set(0, 0, 0); w.camber.rotation.set(0, 0, 0); w.spin.rotation.set(0, 0, 0);
    w.steer.updateMatrixWorld(true); w.spin.attach(node); node.userData.rigged = true;
  }
  // plates at the real bumpers, lightbar on the real roof
  const [bx0, , bz0, bx1, by1, bz1] = info.bbox; const zoff = vis.position.z;
  const [pf, pr] = parts.plates || [];
  // v2.2: the model's own (foreign) number plates are hidden and the Japanese plates take their exact place — before,
  // many models showed two plates on top of each other. Without a plate on the model, the plate sits ON the bumper
  // (ray against the body) instead of floating in front of its furthest point.
  {
    root.updateMatrixWorld(true);
    const inv = bodyG.matrixWorld.clone().invert(), box = new THREE.Box3(), spots = { f: null, r: null };
    vis.traverse(o => {
      if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
      if (!(/plate|licen|kennz|nummer|matric/i.test(o.name) || ms.some(m => /plate|licen|kennz|nummer|matric/i.test(m.name || '')) || plateShaped(o, inv, bz0 + zoff, bz1 + zoff)) || /top|rim/i.test(o.name)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
      o.visible = false; o.userData.plateHidden = true;
      const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
      if (sz.z > 1.5) return; // one mesh for both ends: hidden, plates placed by ray below
      const k = c.z > 0 ? 'f' : 'r'; if (!spots[k] || sz.x * sz.y > spots[k].a) spots[k] = { x: c.x, y: c.y, z: c.z > 0 ? box.max.z + 0.006 : box.min.z - 0.006, a: sz.x * sz.y };
    });
    const rc = new THREE.Raycaster(), surf = (y, front) => { const o = new THREE.Vector3(0, y, front ? bz1 + zoff + 1 : bz0 + zoff - 1).applyMatrix4(bodyG.matrixWorld); rc.set(o, new THREE.Vector3(0, 0, front ? -1 : 1).transformDirection(bodyG.matrixWorld)); rc.far = 1.6; const h = rc.intersectObject(vis, true).find(h => h.object.visible); return h ? h.point.applyMatrix4(inv).z + (front ? 0.012 : -0.012) : (front ? bz1 + zoff + 0.012 : bz0 + zoff - 0.012); };
    // v2.4: the bumper ray is the same for every copy of a model → cast once per model and LOD (it cost a frame per spawn)
    const pz = e.plateZ ||= {}, ck = (k, y, fr) => pz[k + (low ? 'l' : 'h')] ??= surf(y, fr);
    if (pf) { const S = spots.f; if (S) pf.position.set(S.x, S.y, S.z); else pf.position.set(0, 0.42, ck('f', 0.42, true)); }
    if (pr) { const S = spots.r; if (S) pr.position.set(S.x, S.y, S.z); else pr.position.set(0, 0.55, ck('r', 0.55, false)); }
    // v2.14 / v2.16: the plate recess measured on the model (the flattest plate-sized patch on the centre line — or where
    // the model's own plate was — found offline by a depth map of each end: manifest `plate` {f|r: [x, y, z, tiltDeg,
    // yawDeg]}, model space, z = the most protruding point of the patch): flat on the recess at its real angle, never
    // sunk into the bumper
    for (const [k, pm] of [['f', pf], ['r', pr]]) {
      const A = info.plate?.[k]; if (!A || !pm || info.plateAt?.[k]) continue;
      const [x, y, z, tilt = 0, yaw = 0] = A, out = k === 'f' ? 1 : -1, tr = tilt * Math.PI / 180;
      pm.position.set(x, y + vis.position.y, z + zoff + out * 0.003); pm.rotation.x = out > 0 ? -tr : tr; pm.rotation.y = (out > 0 ? 0 : Math.PI) + yaw * Math.PI / 180;
      pm.userData.rx0 = pm.rotation.x; pm.userData.p0 = pm.position.clone();
    }
    // v2.5.3: plates painted into the body texture (no mesh to hide) — manifest plateAt {r|f: [x, y, z, w, h, tiltDeg]}:
    // a body-coloured cover over the foreign plate, the Japanese plate on it at the same angle
    for (const [k, pm] of [['f', pf], ['r', pr]]) {
      const A = info.plateAt?.[k]; if (!A || !pm) continue;
      const [x, y, z, w, h, tilt = 0] = A, out = k === 'f' ? 1 : -1, tr = tilt * Math.PI / 180;
      const cover = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paintMats[0] || new THREE.MeshStandardMaterial({ color: 0x333333 }));
      const yb = y + vis.position.y, zb = z + zoff, rx = out > 0 ? -tr : tr; // rear hatch leans forward going up
      cover.position.set(x, yb, zb + out * 0.004); cover.rotation.set(rx, out > 0 ? 0 : Math.PI, 0); bodyG.add(cover);
      pm.position.set(x, yb, zb + out * 0.009); pm.rotation.x = rx;
      pm.userData.rx0 = pm.rotation.x; pm.userData.p0 = pm.position.clone();
    }
  }
  const dy = by1 - (P.H || by1);
  bodyG.traverse(o => { if (o.userData.glbKeep) o.position.y += dy; if (o.userData.glbDecal !== undefined) o.position.x = o.userData.glbDecal * (Math.max(bx1, -bx0) + 0.004); });
  // paint
  model.paintMats = paintMats;
  model.setPaint = hex => { for (const m of paintMats) m.color.set(hex); };
  model.setFinish = finish => { const f = FINISH[finish] || FINISH.metallic; for (const m of model.allPaint ? model.allPaint() : paintMats) { m.metalness = f.metalness; m.roughness = f.roughness; if ('clearcoat' in m) m.clearcoat = f.clearcoat; m.needsUpdate = true; } };
  if (paintMats.length) { const col = opts.color || car.colors[0]; model.setPaint(col); model.setFinish(opts.finish || (car.cat === 'police' ? 'solid' : isWhite(col) ? 'pearl' : 'metallic')); }
  // lamps
  // lit uniformly (the model's own emission map is a day-and-night glow pattern), clear lenses turn opaque-bright when lit
  for (const list of Object.values(lampM)) for (const m of list) { if (!m.emissive) m.emissive = new THREE.Color(); m.emissive.setHex(0); m.emissiveMap = null; m.emissiveIntensity = 0; m.userData.op0 = m.opacity; m.needsUpdate = true; }
  const bay = opts.openable === false || low ? null : analyseBay(e, REAR_ENGINE(car));
  let cut = null;
  if (bay) cut = makeOpenable(model, vis, bay, car, new Set(matMap.values()));
  // first-person view (v2.0): the REAL model stays on screen — its own pillars, roof, bonnet, door mirrors — seen from
  // inside as dark trim, and the detailed procedural cabin (dash, live cluster, wheel, seats, console) is fitted into the
  // real model's cabin, measured by rays from the driver's eye (roof liner, windscreen, door) against both bodies.
  if (full && parts.eye) {
    model.cockpitView = false;
    const interiorG = bodyG.getObjectByName('interior');
    const inCabin = new Set(); interiorG?.traverse(o => inCabin.add(o));
    const INTERIOR_RE = /interior|interier|seat|steer|dash|gauge|carpet|pedal|cabin|(^|[_\s.-])int([_\s.-]|$)|leather|stitch|visor/i;
    const glbInside = [], glbMats = new Set();
    const glassNames = new Set(info.glass || []);
    const isGlass = m => glassNames.has(m.name) || /glass|window|windscreen|windshield/i.test(m.name || '') || (m.transmission > 0) || (m.opacity < 0.95);
    vis.traverse(o => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; if (ms.some(m => INTERIOR_RE.test(m.name || '')) || INTERIOR_RE.test(o.name || '')) glbInside.push(o); });
    // the player's copy of the body materials: double-sided in the cockpit, back faces = dark trim
    const trimU = { uCk: { value: 0 }, uBodyInv: { value: new THREE.Matrix4() }, uCab: { value: new THREE.Vector4(0, 0.3, -9, 99) }, uWs: { value: new THREE.Vector3(0, 1, -99) } };
    vis.traverse(o => {
      if (!o.isMesh) return;
      const ms = (Array.isArray(o.material) ? o.material : [o.material]).map(m => {
        if (isGlass(m)) return m;
        const c = own(m); if (glbMats.has(c)) return c; glbMats.add(c);
        const prev = c.onBeforeCompile;
        c.onBeforeCompile = (sh, r) => {
          prev?.call(c, sh, r); Object.assign(sh.uniforms, trimU);
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uBodyInv; varying vec3 vCk;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvCk = (uBodyInv * modelMatrix * vec4(transformed, 1.0)).xyz;');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uCk; uniform vec4 uCab; uniform vec3 uWs; varying vec3 vCk;')
            .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
            if (uCk > 0.5) { // the model's own cabin (seats, dash, wheel …) gives way to the fitted cockpit
              float hw = uCab.x - 0.16 * clamp((vCk.y - uCab.y) / max(0.05, uCab.z - uCab.y), 0.0, 1.0);
              if (abs(vCk.x) < hw && vCk.y > 0.05 && vCk.y < uCab.z && vCk.z > uCab.w && vCk.y * uWs.x + vCk.z * uWs.y < uWs.z) discard;
            }`)
            .replace('#include <color_fragment>', '#include <color_fragment>\nif (uCk > 0.5 && !gl_FrontFacing) diffuseColor.rgb = vec3(0.045, 0.045, 0.05);');
        };
        c.customProgramCacheKey = () => 'ck' + (prev ? 1 : 0) + c.type;
        return c;
      });
      o.material = Array.isArray(o.material) ? ms : ms[0];
    });
    let fitted = false;
    const fit = () => {
      if (info.cockpit === 'glb' && info.eye) { parts.eye.set(info.eye[0], info.eye[1], info.eye[2]).add(vis.position); parts.eyePitch = 0.08; fitted = true; return; } // v2.12: the model's own cabin, eye set by hand (cab-over kei truck)
      fitted = true; if (!interiorG) return;
      root.updateMatrixWorld(true);
      const rc = new THREE.Raycaster(); rc.near = 0.02; rc.far = 3.5;
      const shellP = procShell.filter(o => o.isMesh && !inCabin.has(o) && o.name !== 'headliner'), shellG = [], glassG = [];
      vis.traverse(o => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; if (ms.every(isGlass)) glassG.push(o); else if (!glbInside.includes(o)) shellG.push(o); });
      const cast = (list, dir, from = null) => {
        const sides = list.map(o => { const ms = Array.isArray(o.material) ? o.material : [o.material]; const k = ms.map(m => m.side); ms.forEach(m => { m.side = THREE.DoubleSide; }); return [ms, k]; });
        const vis0 = list.map(o => o.visible); list.forEach(o => { o.visible = true; });
        const E = bodyG.localToWorld((from || parts.eye).clone()), D = dir.clone().transformDirection(bodyG.matrixWorld);
        rc.set(E, D); const h = rc.intersectObjects(list, false)[0];
        list.forEach((o, i) => { o.visible = vis0[i]; }); sides.forEach(([ms, k]) => ms.forEach((m, i) => { m.side = k[i]; }));
        if (!h) return null; const q = bodyG.worldToLocal(h.point.clone()); q.hit = h.object.name + '/' + ((Array.isArray(h.object.material) ? h.object.material[0] : h.object.material)?.name || ''); return q;
      };
      const fwd = new THREE.Vector3(0, 0.15, 1).normalize(), side = new THREE.Vector3(Math.sign(parts.eye.x) || -1, -0.9, 0).normalize();
      const above = parts.eye.clone().setY(parts.eye.y + 2), down = new THREE.Vector3(0, -1, 0);
      let rG = cast([...shellG, ...glassG], down, above);         // real roof (outer top; sunroof glass counts) over the head
      if (rG && rG.y < parts.eye.y + 0.08) rG = null;             // fell through an opening
      const wP = cast(shellP, fwd), wG = cast(glassG.length ? glassG : shellG, fwd) || cast(shellG, fwd); // windscreen, same ray, both bodies
      const dP = cast(shellP, side), dG = cast(shellG, side);     // driver's door inner face
      const off = new THREE.Vector3();
      if (rG) off.y = THREE.MathUtils.clamp(rG.y - 0.24 - parts.eye.y, -0.2, 0.15); // seated eye ≈ 24 cm under the roof
      if (wP && wG) off.z = THREE.MathUtils.clamp(wG.z - wP.z, -0.35, 0.35);
      let sx = 1; if (dP && dG && Math.abs(dP.x) > 0.3) sx = THREE.MathUtils.clamp(Math.abs(dG.x) / Math.abs(dP.x), 0.88, 1.1);
      interiorG.position.add(off); interiorG.scale.x *= sx;
      parts.eye.x *= sx; parts.eye.add(off);
      // cabin volume of the real model: door inner face, eye height, windscreen plane (two hits on the glass)
      const gl = glassG.length ? glassG : shellG;
      const A = cast(gl, fwd) || cast(shellG, fwd), B2 = cast(gl, new THREE.Vector3(0, -0.03, 1).normalize()) || cast(shellG, new THREE.Vector3(0, -0.03, 1).normalize());
      if (dG && A) {
        const Bp = B2 && B2.z > A.z - 0.05 && B2.y < A.y - 0.05 ? B2 : new THREE.Vector3(0, A.y - 0.35, A.z + 0.38); // fallback: a 45° screen
        let ny = Bp.z - A.z, nz = -(Bp.y - A.y); const L = Math.hypot(ny, nz) || 1; ny /= L; nz /= L; if (nz < 0) { ny = -ny; nz = -nz; } // normal pointing forward
        trimU.uWs.value.set(ny, nz, ny * A.y + nz * A.z - 0.035);
        trimU.uCab.value.set(Math.abs(dG.x) - 0.035, parts.eye.y - 0.55, parts.eye.y + 0.06, parts.eye.z - 2.2);
      }
      model.cockpitFit = { off: off.toArray().map(v => +v.toFixed(3)), sx: +sx.toFixed(3), hits: [!!rG, !!wP, !!wG, !!dP, !!dG, !!A, !!B2], glass: glassG.length, roof: rG && [+rG.y.toFixed(2), rG.hit], ws: wG && [+wG.y.toFixed(2), +wG.z.toFixed(2), wG.hit], door: dG && [+dG.x.toFixed(2), dG.hit], eye: parts.eye.toArray().map(v => +v.toFixed(2)) };
    };
    model.setCockpitView = on => {
      on = !!on; if (on === model.cockpitView) return; model.cockpitView = on;
      if (on && !fitted) fit();
      for (const o of procShell) o.visible = on && inCabin.has(o) && info.cockpit !== 'glb';
      for (const o of glbInside) o.visible = true;
      for (const d of parts.doors) d.pivot.visible = false;
      vis.visible = !(on && info.cockpit === 'proc'); trimU.uCk.value = on && info.cockpit !== 'glb' ? 1 : 0; // v2.9: models without window openings: the procedural cabin + glass in cockpit view
      if (on && info.cockpit === 'proc') for (const o of procShell) o.visible = true;
      for (const m of glbMats) { m.userData.side0 ??= m.side; const sd = on ? THREE.DoubleSide : m.userData.side0; if (m.side !== sd) { m.side = sd; m.needsUpdate = true; } } // v2.14: back to the model's own sides (was FrontSide → one-sided panels see-through after leaving the cockpit)
      if (procHood) procHood.visible = false;
      if (model.parts.hood?.pivot && model.parts.hood.pivot !== procHood) model.parts.hood.pivot.visible = true;
    };
    parts.doorMirrors = []; // the real model's own mirrors are on screen
    model._trimU = trimU;
  }
  // v2.4.1 / v2.16: glows at the real lamps (the procedural lamps are hidden on real models), and the beams from them
  const LA = lampAnchors(e), glows = { head: [], tail: [], ind: [], rev: [], fog: [], ffog: [], brake: [] };
  const spr = (hex, p, k) => { const s2 = new THREE.Sprite(glowMat(hex)); s2.position.set(p[0], p[1], p[2]); s2.visible = false; s2.renderOrder = 3; vis.add(s2); glows[k].push(s2); return s2; };
  for (const a of LA.ind) spr(0xff9418, a.p, 'ind').userData.side = a.side;
  for (const a of LA.head) spr(0xfff2dc, a.p, 'head'); for (const a of LA.tail) spr(0xff2010, a.p, 'tail');
  for (const a of LA.rev) spr(0xfff6ee, a.p, 'rev');
  for (const a of LA.fog) spr(0xff1408, a.p, 'fog');
  for (const a of LA.ffog) spr(0xfff0d0, a.p, 'ffog');
  for (const a of LA.brake) spr(0xff1408, a.p, 'brake');
  if (parts.real) { // the player's headlight beam from between the real headlamps, the rear glow from the real tail lamps
    const avg = (l, i) => l.reduce((s2, a) => s2 + a.p[i], 0) / l.length, hy = avg(LA.head, 1) + vis.position.y, hz = avg(LA.head, 2) + vis.position.z;
    const sz = Math.max(hz, bz1 + vis.position.z) + 0.05; // just ahead of the nose: the bumper / plate are not floodlit by their own beam
    parts.real.spot.position.set(0, hy, sz); parts.real.spot.target.position.set(0, hy - 1.3, sz + 18);
    parts.real.glow.position.set(0, avg(LA.tail, 1) + vis.position.y, avg(LA.tail, 2) + vis.position.z - 0.2);
  }
  const warm = (car.year || 2000) < 2006; // halogen (warm) vs HID / LED (cool white) headlamps
  const setL = (role, hex, I) => { const l = lampM[role]; if (!l) return; for (const m of l) { m.emissive.setHex(hex); m.emissiveIntensity = I; if (m.transparent) m.opacity = I > 0 ? Math.max(m.userData.op0, 0.85) : m.userData.op0; } };
  const base = model.onUpdate;
  model.onUpdate = dt => {
    base?.(dt);
    if (model.cockpitView && model._trimU) model._trimU.uBodyInv.value.copy(bodyG.matrixWorld).invert();
    const L = model.lights; const blink = model.blinkOn;
    const headOn = L.head || L.drl === true, brake = L.brake, pos = !!(L.head || L.pos), fog = !!(L.fog && pos);
    // head: low beam (high brighter); parking-lamp glow with only the small lamps on
    setL('head', warm ? 0xffe2b8 : 0xeef3ff, headOn ? (L.high ? 3.4 : 2.4) : pos ? 0.3 : 0);
    // tail: dim red with the lights on, bright red only while braking (same lens); high-mount stop lamp only braking
    setL('tail', 0xff1808, brake ? 3.6 : pos ? 0.75 : 0); setL('brake', 0xff1808, brake ? 4 : 0);
    setL('rev', 0xffffff, L.reverse ? 2.6 : 0);
    setL('ffog', 0xfff2d0, fog ? 2.4 : 0); setL('rfog', 0xff1808, fog ? 4 : 0);
    const lOn = !!((L.hazard || L.left) && blink), rOn = !!((L.hazard || L.right) && blink);
    setL('indFL', 0xff7a00, lOn ? 3.4 : 0); setL('indRL', 0xff7a00, lOn ? 3.4 : 0); setL('indFR', 0xff7a00, rOn ? 3.4 : 0); setL('indRR', 0xff7a00, rOn ? 3.4 : 0);
    for (const s2 of glows.ind) { const on = s2.userData.side === 'L' ? lOn : rOn; s2.visible = on; if (on) s2.scale.setScalar(0.26); }
    for (const s2 of glows.head) { s2.visible = headOn; if (headOn) s2.scale.setScalar(L.high ? 0.6 : 0.36); }
    for (const s2 of glows.tail) { const on = brake || pos; s2.visible = on; if (on) s2.scale.setScalar(brake ? 0.36 : 0.16); }
    for (const s2 of glows.brake) { s2.visible = !!brake; if (brake) s2.scale.setScalar(0.2); }
    for (const s2 of glows.rev) { s2.visible = !!L.reverse; if (L.reverse) s2.scale.setScalar(0.26); }
    for (const s2 of glows.fog) { s2.visible = fog; if (fog) s2.scale.setScalar(0.34); }
    for (const s2 of glows.ffog) { s2.visible = fog; if (fog) s2.scale.setScalar(0.3); }
    cut?.update();
  };
  const dispose0 = model.dispose.bind(model);
  model.dispose = () => { for (const m of matMap.values()) m.dispose(); cut?.dispose(); dispose0(); };
  return model;
}

// bonnet cut-out: body materials clip the panel region away while it is open; a clone of the body restricted to the
// region rides on a hinge pivot. Planes are kept in world space every frame (the car moves).
function makeOpenable(model, vis, bay, car, owned) {
  const { bodyG, P } = model; const zoff = vis.position.z;
  const z0 = bay.z0 + zoff, z1 = bay.z1 + zoff, hinge = bay.hinge + zoff;
  const N = (x, y, z, c) => new THREE.Plane(new THREE.Vector3(x, y, z), c);
  // outward normals: inside the region → negative distance on every plane
  const local = [N(1, 0, 0, -bay.hx), N(-1, 0, 0, -bay.hx), N(0, -1, 0, bay.y), N(0, 0, 1, -z1), N(0, 0, -1, z0)];
  const bodyPlanes = local.map(p => p.clone()), hoodPlanes = local.map(p => p.clone());
  // per-instance body materials (clipping planes differ per car)
  const bodyMats = new Map();
  vis.traverse(o => { if (!o.isMesh) return; const conv = m => { let c = bodyMats.get(m); if (!c) { c = owned.has(m) ? m : cloneMat(m); c.clipIntersection = true; bodyMats.set(m, c); } return c; }; o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
  // keep paint/lamp references pointing at the instance materials
  const pm = model.paintMats; model.setPaint = hex => { for (const m of pm) m.color.set(hex); for (const m of hoodMatsOf(pm)) m.color.set(hex); };
  model.allPaint = () => [...pm, ...hoodMatsOf(pm)];
  // hood: clone of the (clipped) body inside the region, on a hinge at the windscreen edge (front) / rear window (rear lid)
  const pivot = new THREE.Group(); pivot.name = bay.rear ? 'engineLid' : 'hood';
  const yH = bay.y + 0.2; pivot.position.set(0, yH, hinge); bodyG.add(pivot);
  const hoodVis = vis.clone(true); hoodVis.traverse(o => { if (/^wheel_/.test(o.name)) o.visible = false; });
  // the moving panel is only the painted skin (not the engine / radiator / lamps that sit inside the region)
  const paintNames = new Set(model.glbInfo.paint || []), invisible = new THREE.MeshBasicMaterial({ visible: false });
  hoodVis.traverse(o => { if (!o.isMesh) return; if (Array.isArray(o.material)) o.material = o.material.map(m => (paintNames.has(m.name) ? m : invisible)); else if (!paintNames.has(o.material.name)) o.visible = false; });
  const hoodMats = new Map();
  hoodVis.traverse(o => { if (!o.isMesh) return; const conv = m => { let c = hoodMats.get(m); if (!c) { c = cloneMat(m); c.clipIntersection = false; c.side = THREE.DoubleSide; hoodMats.set(m, c); } return c; }; o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
  function hoodMatsOf(list) { return list.map(m => hoodMats.get(m)).filter(Boolean); }
  hoodVis.position.sub(pivot.position); pivot.add(hoodVis); hoodVis.visible = false;
  // engine bay under the panel
  const eb = buildEngineBay(car, { width: bay.hx * 2, length: z1 - z0, floorY: Math.max(0.22, (P.wheelR || 0.32) - 0.05), topY: bay.y - 0.02, zc: (z0 + z1) / 2, zFront: bay.rear ? z0 + 0.05 : z1, zRear: bay.rear ? z1 : z0, hw: bay.hx / 0.86 });
  eb.visible = false; if (!bay.ownEngine) bodyG.add(eb);
  model.parts.hood = { pivot, open: 0, target: 0, dir: bay.rear ? -1 : 1, angle: 1.15 };
  model.parts.engineBay = eb;
  const w = new THREE.Plane(); let active = false;
  const setPlanes = on => {
    if (on === active) return; active = on;
    for (const m of bodyMats.values()) { m.clippingPlanes = on ? bodyPlanes : null; m.needsUpdate = true; }
    for (const m of hoodMats.values()) { m.clippingPlanes = on ? hoodPlanes : null; m.needsUpdate = true; }
    hoodVis.visible = on; eb.visible = on;
  };
  return {
    update() {
      const open = model.parts.hood.open > 0.002 || model.parts.hood.target > 0;
      setPlanes(open); if (!open) return;
      bodyG.updateMatrixWorld(true);
      for (let i = 0; i < local.length; i++) {
        bodyPlanes[i].copy(local[i]).applyMatrix4(bodyG.matrixWorld);
        // hood region in pivot space = body region shifted by the pivot's rest position
        w.copy(local[i]); w.constant += w.normal.dot(pivot.position); w.normal.negate(); w.constant = -w.constant;
        hoodPlanes[i].copy(w).applyMatrix4(pivot.matrixWorld);
      }
    },
    dispose() { for (const m of bodyMats.values()) if (!owned.has(m)) m.dispose(); for (const m of hoodMats.values()) m.dispose(); },
  };
}
