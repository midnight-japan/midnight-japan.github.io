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
        m.transparent = true; m.opacity = 0.62; if (m.color) m.color.setHex(0x0d1419); m.roughness = 0.03; m.metalness = 0;
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
export function requestGlb(id, lod) {
  if (lod === 'lo' && !manifest) return loadManifest().then(() => requestGlb(id, lod));
  const key = ckey(id, lod); id = mid(id);
  let e = cache.get(key); if (e) return e.promise;
  e = {}; cache.set(key, e);
  e.promise = loadManifest().then(m => {
    const info = m[id]; if (!info) throw new Error('no model for ' + id);
    if (!gltf) { gltf = new GLTFLoader(); gltf.setMeshoptDecoder(MeshoptDecoder); }
    return gltf.loadAsync(new URL(key.endsWith('@lo') ? info.lo : info.file, BASE).href).then(g => { e.scene = g.scene; e.info = info; e.scene.updateMatrixWorld(true); if (info.split) splitLivery(e.scene, info); fixMaterials(e.scene, info); e.scene.traverse(o => { if (o.geometry) o.geometry.userData.shared = true; }); return precompile(e); });
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
// v2.4.1: where the real model's lamps are — per side (x > 0 is the car's left), from the vertices of its head- and
// tail-lamp materials, in the model's own space. Cached per model.
export function lampAnchors(e, isHead, isTail) {
  if (e.lampA !== undefined) return e.lampA;
  const sc = e.scene; sc.updateMatrixWorld(true); const inv = sc.matrixWorld.clone().invert(), m4 = new THREE.Matrix4(), v = new THREE.Vector3();
  const box = () => ({ x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9, n: 0 });
  const B = { hL: box(), hR: box(), tL: box(), tR: box(), rL: box(), rR: box(), iFL: box(), iFR: box(), iRL: box(), iRR: box() };
  const IND_RE = /blinker|orange|indicator|turn.?sig|amber/i;
  sc.traverse(o => {
    if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
    const kinds = ms.map(m => isHead(m.name, m) ? 'h' : isTail(m.name, m) ? 't' : m.userData.lamp === 'rev' ? 'r' : (IND_RE.test(m.name || '') || m.userData.lamp === 'ind') ? 'i' : null); if (!kinds.some(Boolean)) return;
    const g = o.geometry, pos = g.attributes.position, idx = g.index; m4.multiplyMatrices(inv, o.matrixWorld);
    const groups = g.groups.length && Array.isArray(o.material) ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    for (const gr of groups) { const k = kinds[gr.materialIndex ?? 0]; if (!k) continue;
      const step = Math.max(1, Math.floor(gr.count / 600));
      for (let i = gr.start; i < gr.start + gr.count; i += step) { const vi = idx ? idx.getX(i) : i; v.fromBufferAttribute(pos, vi).applyMatrix4(m4);
        const b = B[k === 'i' ? 'i' + (v.z > 0 ? 'F' : 'R') + (v.x > 0 ? 'L' : 'R') : k + (v.x > 0 ? 'L' : 'R')]; b.n++; b.x0 = Math.min(b.x0, v.x); b.x1 = Math.max(b.x1, v.x); b.y0 = Math.min(b.y0, v.y); b.y1 = Math.max(b.y1, v.y); b.z0 = Math.min(b.z0, v.z); b.z1 = Math.max(b.z1, v.z); } }
  });
  const [bx0, , bz0, bx1, , bz1] = e.info.bbox;
  const ok = b => b.n > 6 && b.x1 - b.x0 < 1.2;
  const out = { head: [], tail: [], ind: [], rev: [], fog: [] };
  for (const side of ['L', 'R']) { const sg = side === 'L' ? 1 : -1;
    const h = B['h' + side], t = B['t' + side];
    const hp = ok(h) ? [(h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2, h.z1 + 0.03] : [sg * (Math.max(bx1, -bx0) - 0.35), 0.68, bz1 + 0.02];
    const tp = ok(t) ? [(t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2, t.z0 - 0.03] : [sg * (Math.max(bx1, -bx0) - 0.3), 0.85, bz0 - 0.02];
    out.head.push({ side, p: hp }); out.tail.push({ side, p: tp });
    // indicators at the outer corner of each lamp (front and rear)
    const hx = ok(h) ? (sg > 0 ? h.x1 : h.x0) - sg * 0.04 : hp[0] + sg * 0.18, tx = ok(t) ? (sg > 0 ? t.x1 : t.x0) - sg * 0.04 : tp[0] + sg * 0.15;
    // the model's own amber lenses when it has them (front / rear, per side), else the lamp's outer corner
    const iF = B['iF' + side], iR = B['iR' + side], cen = (b, z) => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, z];
    out.ind.push({ side, p: ok(iF) ? cen(iF, iF.z1 + 0.02) : [hx, hp[1] - 0.02, hp[2] - 0.01] }, { side, p: ok(iR) ? cen(iR, iR.z0 - 0.02) : [tx, tp[1] + 0.02, tp[2] + 0.01] });
    // v2.14: reversing lamps (the model's own clear rear lenses, else the inner part of the tail lamp) and the single
    // rear fog lamp — Japanese cars carry it on the driver's (right, x < 0) side, in the inner part of the cluster
    const r = B['r' + side], tw = ok(t) ? Math.max(0.06, (t.x1 - t.x0) * 0.3) : 0.12;
    out.rev.push({ side, p: ok(r) ? cen(r, r.z0 - 0.02) : [tp[0] - sg * tw, tp[1] - 0.02, tp[2] + 0.005] });
    if (side === 'R') out.fog.push({ side, p: [tp[0] + tw * 0.5, tp[1] - 0.035, tp[2] - 0.004] });
  }
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
const HEAD_RE = /head.?(light|lamp)|front.?(light|lamp)|scheinwerfer|^hl(_|$)/i, TAIL_RE = /(tail|rear|brake|stop).?(light|lamp)|taillight|^tl(_|$)/i;

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
  const paintNames = new Set(info.paint || []), paintMats = [], head = [], tail = [];
  // lamp materials: by name, or listed explicitly in the manifest (models with generic material names)
  const headNames = new Set(info.lamps?.head || []), tailNames = new Set(info.lamps?.tail || []);
  const isHead = (n, m) => headNames.has(n) || (!tailNames.has(n) && ((HEAD_RE.test(n) && !TAIL_RE.test(n)) || m?.userData.lamp === 'head')), isTail = (n, m) => tailNames.has(n) || (!headNames.has(n) && (TAIL_RE.test(n) || m?.userData.lamp === 'tail'));
  const rev = [];
  const matMap = new Map();
  const own = m => { let c = matMap.get(m); if (!c) { c = cloneMat(m); matMap.set(m, c); } return c; };
  vis.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map(m => {
      if (paintNames.has(m.name)) { const c = own(m); if (!paintMats.includes(c)) paintMats.push(c); return c; }
      if (isHead(m.name, m)) { const c = own(m); if (!head.includes(c)) head.push(c); return c; }
      if (isTail(m.name, m)) { const c = own(m); if (!tail.includes(c)) tail.push(c); return c; }
      if (m.userData.lamp === 'rev') { const c = own(m); if (!rev.includes(c)) rev.push(c); return c; }
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
    // v2.14: the plate recess measured on the model (a flat, plate-sized, recessed patch on the centre line, found by
    // rays — see manifest `plate` {f|r: [x, y, z, tiltDeg]}, model space): flat on the recess at its real angle
    for (const [k, pm] of [['f', pf], ['r', pr]]) {
      const A = info.plate?.[k]; if (!A || !pm || info.plateAt?.[k]) continue;
      const [x, y, z, tilt = 0] = A, out = k === 'f' ? 1 : -1, tr = tilt * Math.PI / 180;
      pm.position.set(x, y + vis.position.y, z + zoff + out * 0.005); pm.rotation.x = out > 0 ? -tr : tr;
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
  for (const m of [...head, ...tail, ...rev]) { m.emissive = m.emissive || new THREE.Color(); m.emissiveIntensity = 0; }
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
  // v2.4.1: lamp glows and amber indicators at the real lamps (the procedural lamps are hidden on real models; hazards
  // used to flash the whole headlight white and the tail red)
  const LA = lampAnchors(e, isHead, isTail), glows = { head: [], tail: [], ind: [], rev: [], fog: [] };
  const spr = (hex, p, k) => { const s2 = new THREE.Sprite(glowMat(hex)); s2.position.set(p[0], p[1], p[2]); s2.visible = false; s2.renderOrder = 3; vis.add(s2); glows[k].push(s2); return s2; };
  for (const a of LA.ind) spr(0xffa020, a.p, 'ind').userData.side = a.side;
  { const H = low ? LA.head.slice(0, 2) : LA.head, T = low ? LA.tail.slice(0, 2) : LA.tail; for (const a of H) spr(0xfff2dc, a.p, 'head'); for (const a of T) spr(0xff2010, a.p, 'tail'); }
  for (const a of LA.rev || []) spr(0xfff6ee, a.p, 'rev');
  for (const a of LA.fog || []) spr(0xff1408, a.p, 'fog'); // v2.11.1: NPC cars light up too (2 + 2 sprites)
  const base = model.onUpdate;
  model.onUpdate = dt => {
    base?.(dt);
    if (model.cockpitView && model._trimU) model._trimU.uBodyInv.value.copy(bodyG.matrixWorld).invert();
    const L = model.lights; const blink = model.blinkOn;
    const headOn = L.head || L.drl === true, brake = L.brake, pos = L.head || L.pos;
    for (const m of head) { m.emissive.setHex(0xfff4e0); m.emissiveIntensity = headOn ? (L.high ? 5 : 3.5) : 0; }
    // tail: dim red with the lights, bright only while braking; reversing lamps white in reverse; rear fog: one bright
    // red lamp, only with the fog switch on and the lights on (as on a real car)
    for (const m of tail) { m.emissive.setHex(0xff1a10); m.emissiveIntensity = brake ? 4.5 : pos ? 1.1 : 0; }
    for (const m of rev) { m.emissive.setHex(0xfff6ee); m.emissiveIntensity = L.reverse ? 3.2 : 0; }
    for (const s2 of glows.rev) { s2.visible = !!L.reverse; if (L.reverse) s2.scale.setScalar(0.3); }
    { const fog = !!(L.fog && pos); for (const s2 of glows.fog) { s2.visible = fog; if (fog) s2.scale.setScalar(0.5); } }
    const lOn = (L.hazard || L.left) && blink, rOn = (L.hazard || L.right) && blink;
    for (const s2 of glows.ind) { const on = s2.userData.side === 'L' ? lOn : rOn; s2.visible = on; if (on) s2.scale.setScalar(0.3); }
    for (const s2 of glows.head) { s2.visible = headOn; if (headOn) s2.scale.setScalar(L.high ? 0.68 : 0.46); }
    for (const s2 of glows.tail) { const on = brake || pos; s2.visible = on; if (on) { s2.scale.setScalar(brake ? 0.46 : 0.22); } }
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
