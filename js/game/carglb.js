// Real 3D car models (glTF / GLB, CC BY 4.0 — see assets/CREDITS.md) wrapped in the same CarModel API as the procedural
// cars: live paint recolour + finish, the model's own wheels spinning/steering/cambering, lamps driven by the light state,
// plates, police lightbar, and an openable bonnet (engine lid on mid/rear-engined cars) on every model: the panel is cut
// out of the body with clipping planes, hinged, and a detailed engine bay (buildEngineBay) sits underneath.
// assets/models/cars/manifest.json lists the models; all GLBs are normalised (metres, front = +Z, up = +Y, ground at
// y = 0, wheels split into wheel_fl/fr/rl/rr nodes pivoted at the wheel centre).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { buildCar, buildEngineBay } from './carmodel.js';

const BASE = new URL('../../assets/models/cars/', import.meta.url);
let manifest = null, manifestP = null, gltf = null;
const cache = new Map();   // id → { promise, scene, info, bay: { front, rear } }

export function loadManifest() {
  return manifestP ||= fetch(new URL('manifest.json', BASE)).then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(m => (manifest = m));
}
export const hasGlb = id => !!manifest?.[id];
export const glbEntry = id => { const e = cache.get(id); return e?.scene ? e : null; };
export function requestGlb(id) {
  let e = cache.get(id); if (e) return e.promise;
  e = {}; cache.set(id, e);
  e.promise = loadManifest().then(m => {
    const info = m[id]; if (!info) throw new Error('no model for ' + id);
    if (!gltf) { gltf = new GLTFLoader(); gltf.setMeshoptDecoder(MeshoptDecoder); }
    return gltf.loadAsync(new URL(info.file, BASE).href).then(g => { e.scene = g.scene; e.info = info; e.scene.updateMatrixWorld(true); return e; });
  });
  e.promise.catch(err => { if (!/no model/.test(err.message)) console.warn('car model', id, err); });
  return e.promise;
}

const ease = t => t * t * (3 - 2 * t);
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

const FINISH = { metallic: { metalness: 0.6, roughness: 0.3, clearcoat: 1 }, pearl: { metalness: 0.35, roughness: 0.22, clearcoat: 1 }, solid: { metalness: 0.05, roughness: 0.32, clearcoat: 1 }, matte: { metalness: 0.15, roughness: 0.75, clearcoat: 0 } };
const HEAD_RE = /head.?(light|lamp)|front.?(light|lamp)|scheinwerfer|^hl(_|$)/i, TAIL_RE = /(tail|rear|brake|stop).?(light|lamp)|taillight|^tl(_|$)/i;

/** Build a CarModel around a loaded glTF entry. opts: same as buildCar (+ openable=false to skip the bonnet cut). */
export function buildGlbCar(car, e, opts = {}) {
  const low = opts.lod === 'low';
  const model = buildCar(car, { ...opts, lod: low ? 'low' : 'mid' });
  const { root, bodyG, parts, P } = model; const info = e.info;
  model.isGlb = true; model.glbInfo = info;
  // hide the procedural shell (keep plates, police lightbar & door decals), and the procedural wheels
  bodyG.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && !o.userData.isPlate && !o.userData.glbKeep && o.userData.glbDecal === undefined) o.visible = false; });
  for (const w of parts.wheels) w.steer.traverse(o => { if (o.isMesh) o.visible = false; });
  if (parts.engineBay) parts.engineBay.visible = false;
  for (const d of parts.doors) { d.pivot.visible = false; }
  const vis = e.scene.clone(true); vis.name = 'glb';
  // per-instance paint & lamp materials (the rest is shared between all instances of this model)
  const paintNames = new Set(info.paint || []), paintMats = [], head = [], tail = [];
  const matMap = new Map();
  const own = m => { let c = matMap.get(m); if (!c) { c = m.clone(); matMap.set(m, c); } return c; };
  vis.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const out = mats.map(m => {
      if (paintNames.has(m.name)) { const c = own(m); if (!paintMats.includes(c)) paintMats.push(c); return c; }
      if (HEAD_RE.test(m.name) && !TAIL_RE.test(m.name)) { const c = own(m); if (!head.includes(c)) head.push(c); return c; }
      if (TAIL_RE.test(m.name)) { const c = own(m); if (!tail.includes(c)) tail.push(c); return c; }
      return m;
    });
    o.material = Array.isArray(o.material) ? out : out[0];
    o.castShadow = !low; o.receiveShadow = !low;
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
  if (pf) pf.position.set(0, 0.42, bz1 + zoff + 0.012);
  if (pr) pr.position.set(0, 0.55, bz0 + zoff - 0.012);
  const dy = by1 - (P.H || by1);
  bodyG.traverse(o => { if (o.userData.glbKeep) o.position.y += dy; if (o.userData.glbDecal !== undefined) o.position.x = o.userData.glbDecal * (Math.max(bx1, -bx0) + 0.004); });
  // paint
  model.paintMats = paintMats;
  model.setPaint = hex => { for (const m of paintMats) m.color.set(hex); };
  model.setFinish = finish => { const f = FINISH[finish] || FINISH.metallic; for (const m of model.allPaint ? model.allPaint() : paintMats) { m.metalness = f.metalness; m.roughness = f.roughness; if ('clearcoat' in m) m.clearcoat = f.clearcoat; m.needsUpdate = true; } };
  if (paintMats.length) { model.setPaint(opts.color || car.colors[0]); model.setFinish(opts.finish || (car.cat === 'police' ? 'solid' : 'metallic')); }
  // lamps
  for (const m of [...head, ...tail]) { m.emissive = m.emissive || new THREE.Color(); m.emissiveIntensity = 0; }
  const bay = opts.openable === false || low ? null : analyseBay(e, REAR_ENGINE(car));
  let cut = null;
  if (bay) cut = makeOpenable(model, vis, bay, car, new Set(matMap.values()));
  const base = model.onUpdate;
  model.onUpdate = dt => {
    base?.(dt);
    const L = model.lights; const blink = model.blinkOn;
    const headOn = L.head || L.drl === true, brake = L.brake, pos = L.head || L.pos;
    for (const m of head) { m.emissive.setHex(0xfff4e0); m.emissiveIntensity = headOn ? (L.high ? 3 : 2) : (L.hazard && blink ? 0.6 : 0); }
    for (const m of tail) { m.emissive.setHex(0xff1a10); m.emissiveIntensity = brake ? 3 : pos ? 0.9 : (L.hazard && blink ? 1.5 : 0); }
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
  vis.traverse(o => { if (!o.isMesh) return; const conv = m => { let c = bodyMats.get(m); if (!c) { c = owned.has(m) ? m : m.clone(); c.clipIntersection = true; bodyMats.set(m, c); } return c; }; o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
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
  hoodVis.traverse(o => { if (!o.isMesh) return; const conv = m => { let c = hoodMats.get(m); if (!c) { c = m.clone(); c.clipIntersection = false; c.side = THREE.DoubleSide; hoodMats.set(m, c); } return c; }; o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
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
