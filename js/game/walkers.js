// Pedestrians on the city sidewalks: they follow the real street graph (js/game/city.js CityNet) on either side of
// the road, continue round corners at junctions, thin out late at night and step aside for cars.
import * as THREE from 'three';
import { randomOutfit } from './humans.js';
import { createPerson, createDriver, loadPeople, loadPeopleProp, peopleReady, peopleFailed, peopleFrame } from './people.js';
// v2.16: realistic rigged people (js/game/people.js); the procedural human is only the stand-in while they load
const createHuman = (outfit, type) => createPerson({ outfit, type: type === 'student' ? 'student' : type === 'office' ? 'office' : type === 'shopper' ? 'shopper' : 'casual', sex: outfit?.body === 'f' ? 'f' : outfit?.body === 'm' ? 'm' : undefined });

// umbrellas for rainy days — shared geometry, a few canopy colours (clear plastic konbini umbrellas are the most common)
let UMB = null;
function umbrella() {
  if (!UMB) {
    const canopy = new THREE.ConeGeometry(0.52, 0.2, 8, 1, true); canopy.translate(0, 0.1, 0);
    const shaft = new THREE.CylinderGeometry(0.009, 0.009, 0.95, 4); shaft.translate(0, -0.47, 0);
    const mk = (c, o) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, transparent: o < 1, opacity: o, side: THREE.DoubleSide, depthWrite: o >= 1 });
    UMB = { canopy, shaft, mats: [mk(0xe8eef2, 0.45), mk(0xe8eef2, 0.45), mk(0xe8eef2, 0.45), mk(0x15171c, 1), mk(0x1d2c4a, 1), mk(0x7a1622, 1), mk(0x2f4a35, 1)], shaftMat: new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 }) };
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(UMB.canopy, UMB.mats[Math.floor(Math.random() * UMB.mats.length)]), new THREE.Mesh(UMB.shaft, UMB.shaftMat));
  g.rotation.z = -0.12; return g;
}


// v2.13.7: who is out — by the clock, like a real Japanese street: school kids in uniform (gakuran / sailor) on the way
// to and from school, salarymen and office workers in suits with briefcases at rush hour, shoppers with carrier bags
// through the day, everyone else casual. Each type carries its bag in the left hand.
const BAGS = (() => { let G = null; return () => G || (G = {
  brief: [new THREE.BoxGeometry(0.4, 0.29, 0.09).translate(0, -0.2, 0), new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 0.45, metalness: 0.1 })],
  school: [new THREE.BoxGeometry(0.36, 0.26, 0.11).translate(0, -0.19, 0), new THREE.MeshStandardMaterial({ color: 0x1a1d2b, roughness: 0.6 })],
  shop: [new THREE.BoxGeometry(0.3, 0.34, 0.14).translate(0, -0.23, 0), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.8, transparent: true, opacity: 0.92 })],
  paper: [new THREE.BoxGeometry(0.32, 0.36, 0.12).translate(0, -0.24, 0), new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.85 })],
}); })();
export function crowdType(hour) {
  const r = Math.random(), school = (hour > 7 && hour < 8.8) || (hour > 15 && hour < 17.5), rush = (hour > 7 && hour < 9.5) || (hour > 17.5 && hour < 20), day = hour > 10 && hour < 19;
  if (school && r < 0.35) return 'student';
  if (rush && r < 0.6) return 'office';
  if (!rush && hour > 9 && hour < 18 && r < 0.18) return 'office';
  if (day && r < 0.5) return 'shopper';
  return 'casual';
}
export function typedOutfit(type) {
  const o = randomOutfit();
  if (type === 'student') {
    o.scale = 0.92 + Math.random() * 0.05; o.accessory = 'none'; o.shoes = 'loafers'; o.shoeColor = '#2a1e17';
    if (o.body === 'm') { o.top = 'suit'; o.topColor = '#121418'; o.accentColor = '#121418'; o.bottom = 'chinos'; o.bottomColor = '#121418'; o.hair = 'short'; } // 学ラン
    else { o.top = 'shirt'; o.topColor = '#f2f2ee'; o.accentColor = '#1e2c4e'; o.bottom = 'skirt'; o.bottomColor = '#1e2c4e'; if (o.hair === 'cap' || o.hair === 'beanie') o.hair = 'ponytail'; } // セーラー服
    o.hairColor = '#141110';
  } else if (type === 'office') {
    o.top = 'suit'; o.topColor = ['#121418', '#1e2c4e', '#3a3d44', '#2a2c31'][Math.floor(Math.random() * 4)]; o.accentColor = '#f2f2ee';
    o.bottom = o.body === 'f' && Math.random() < 0.6 ? 'skirt' : 'chinos'; o.bottomColor = o.topColor; o.shoes = 'loafers'; o.shoeColor = '#121418';
    if (o.hair === 'cap' || o.hair === 'beanie') o.hair = o.body === 'm' ? 'short' : 'bun'; if (o.accessory === 'headphones' || o.accessory === 'sunglasses') o.accessory = 'none';
  }
  return o;
}
function giveBag(h, type) {
  const k = type === 'office' ? 'brief' : type === 'student' ? 'school' : type === 'shopper' ? (Math.random() < 0.7 ? 'shop' : 'paper') : null;
  if (!k || !h.handL) return; const [g, m] = BAGS()[k]; const b = new THREE.Mesh(g, m); b.rotation.y = Math.PI / 2; h.handL.add(b);
}

// Split the merged bicycle mesh (one geometry, see assets/CREDITS.md "bicycle") into its moving parts: connected
// pieces whose every vertex lies within a wheel's radius of its hub (tyre, rim, spokes, hub) → that wheel; pieces
// within the crank radius of the bottom bracket (chainring, arms) → crank, the two pedal blocks on their own (they stay
// level while the crank turns); the rest is the frame. Hubs: centres of the two big round pieces (the tyres); bottom
// bracket: centre of the round piece between them nearest the ground (the chainring).
function splitBike(scene) {
  let mesh = null; scene.updateMatrixWorld(true); scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
  const g0 = mesh.geometry, P = g0.attributes.position, n = P.count, M = mesh.matrixWorld, pos = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; }
  const idx = g0.index ? g0.index.array : Array.from({ length: n }, (_, i) => i);
  // connected pieces (vertices welded by position)
  const key = i => Math.round(pos[i * 3] * 2e3) + ',' + Math.round(pos[i * 3 + 1] * 2e3) + ',' + Math.round(pos[i * 3 + 2] * 2e3), rep = new Map(), id = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = key(i); if (!rep.has(k)) rep.set(k, i); id[i] = rep.get(k); }
  const par = Int32Array.from(id), f = x => { while (par[x] !== x) x = par[x] = par[par[x]]; return x; };
  for (let t = 0; t < idx.length; t += 3) { const a = f(id[idx[t]]); par[f(id[idx[t + 1]])] = a; par[f(id[idx[t + 2]])] = a; }
  const comp = new Map(); for (let i = 0; i < n; i++) { const r = f(id[i]); let c = comp.get(r); if (!c) comp.set(r, c = { vs: [], min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }); c.vs.push(i); for (let k = 0; k < 3; k++) { c.min[k] = Math.min(c.min[k], pos[i * 3 + k]); c.max[k] = Math.max(c.max[k], pos[i * 3 + k]); } }
  const C = [...comp.values()]; for (const c of C) { c.cy = (c.min[1] + c.max[1]) / 2; c.cz = (c.min[2] + c.max[2]) / 2; c.cx = (c.min[0] + c.max[0]) / 2; c.ey = c.max[1] - c.min[1]; c.ez = c.max[2] - c.min[2]; }
  const round = C.filter(c => c.ey > 0.1 && Math.abs(c.ey - c.ez) < 0.12 * c.ey && c.max[0] - c.min[0] < 0.15).sort((a, b) => b.ey - a.ey);
  const tyres = round.slice(0, 2).sort((a, b) => b.cz - a.cz); // front (+z) first
  const hubF = new THREE.Vector3(tyres[0].cx, tyres[0].cy, tyres[0].cz), hubR = new THREE.Vector3(tyres[1].cx, tyres[1].cy, tyres[1].cz), rF = tyres[0].ey / 2, rR = tyres[1].ey / 2;
  const ring = round.filter(c => c.ey < 0.4 && c.cz < hubF.z - rF && c.cz > hubR.z + rR * 0.5).sort((a, b) => a.cy - b.cy)[0] || round.filter(c => !tyres.includes(c)).sort((a, b) => a.cy - b.cy)[0];
  const bb = new THREE.Vector3(0, ring.cy, ring.cz); const crankR0 = 0.215;
  const within = (c, h, R, xMax) => c.vs.every(i => Math.hypot(pos[i * 3 + 1] - h.y, pos[i * 3 + 2] - h.z) <= R && Math.abs(pos[i * 3] - h.x) < xMax);
  const groups = { frame: [], wheelF: [], wheelR: [], crank: [] }, pedals = [];
  for (const c of C) {
    if (within(c, hubF, rF * 1.04, 0.1)) groups.wheelF.push(c);
    else if (within(c, hubR, rR * 1.04, 0.1)) groups.wheelR.push(c);
    else if (within(c, bb, crankR0, 0.25)) { const dc = Math.hypot(c.cy - bb.y, c.cz - bb.z); if (dc > 0.13 && Math.abs(c.cx) > 0.08 && c.ey < 0.06) pedals.push(c); else groups.crank.push(c); }
    else groups.frame.push(c);
  }
  // geometry of a set of pieces, re-centred on `at`
  const vOf = new Int32Array(n).fill(-1);
  const build = (cs, at) => { const set = new Set(); for (const c of cs) for (const i of c.vs) set.add(i);
    const map = new Map(), P2 = [], N2 = [], U2 = [], I2 = [], nrm = g0.attributes.normal, uv = g0.attributes.uv, nm = new THREE.Matrix3().getNormalMatrix(M), nv = new THREE.Vector3();
    for (let t = 0; t < idx.length; t += 3) { if (!set.has(idx[t])) continue; for (let q = 0; q < 3; q++) { const i = idx[t + q]; let j = map.get(i); if (j === undefined) { j = map.size; map.set(i, j); P2.push(pos[i * 3] - at.x, pos[i * 3 + 1] - at.y, pos[i * 3 + 2] - at.z); if (nrm) { nv.fromBufferAttribute(nrm, i).applyMatrix3(nm).normalize(); N2.push(nv.x, nv.y, nv.z); } if (uv) U2.push(uv.getX(i), uv.getY(i)); } I2.push(j); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); if (N2.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3)); else g.computeVertexNormals(); if (U2.length) g.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2)); g.setIndex(I2); g.computeBoundingSphere(); g.userData.shared = true; return g; };
  const O = new THREE.Vector3();
  const out = { mat: mesh.material, frame: build(groups.frame, O), wheelF: build(groups.wheelF, hubF), wheelR: build(groups.wheelR, hubR), crank: build(groups.crank, bb), hubF, hubR, rF, rR, bb, crankR: 0.17,
    pedals: pedals.slice(0, 2).map(c => { const at = new THREE.Vector3(c.cx, c.cy, c.cz); return { g: build([c], at), c: at, rel: at.clone().sub(bb) }; }) };
  if (out.pedals.length) out.crankR = Math.hypot(out.pedals[0].rel.y, out.pedals[0].rel.z);
  // saddle (highest piece behind the bottom bracket) and the grips (ends of the handlebar, the widest piece up front)
  const sad = C.filter(c => c.cz < bb.z && c.cz > hubR.z).sort((a, b) => b.max[1] - a.max[1])[0];
  out.saddle = sad ? new THREE.Vector3(0, sad.max[1], sad.cz) : new THREE.Vector3(0, 0.9, -0.3);
  const bar = C.filter(c => c.cz > bb.z).sort((a, b) => (b.max[0] - b.min[0]) - (a.max[0] - a.min[0]))[0];
  const barSet = bar ? C.filter(c => Math.abs(c.cy - bar.cy) < 0.06 && Math.abs(c.cz - bar.cz) < 0.1) : [];
  const gy = bar ? bar.cy : 1.0, gz = bar ? bar.cz : 0.32, gx = barSet.length ? Math.max(...barSet.map(c => Math.max(Math.abs(c.min[0]), Math.abs(c.max[0])))) - 0.06 : 0.2;
  out.grips = [new THREE.Vector3(gx, gy, gz), new THREE.Vector3(-gx, gy, gz)]; // [character's left (+x), right]
  console.info('[bike] split', groups.frame.length, groups.wheelF.length, groups.wheelR.length, groups.crank.length, pedals.length, 'r', rF.toFixed(2), 'bb', bb.y.toFixed(2), bb.z.toFixed(2));
  return out;
}

export class Walkers {
  constructor(game) {
    this.g = game; this.list = []; this.t = 0; this.manageT = 0;
    this.max = { low: 8, medium: 20, high: 32, ultra: 44 }[game.quality] ?? 20; this.born = performance.now(); loadPeople();
    // v2.16: cyclists (city bikes) on the left edge of the street
    this.bikes = []; this.maxBikes = { low: 0, medium: 3, high: 5, ultra: 7 }[game.quality] ?? 3; this.bikeSrc = null;
  }
  net() { return this.g.world.city?.net; }
  seg(c, i) { const a = c.pts[i], b = c.pts[i + 1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.01; return { a, b, L, tx: (b[0] - a[0]) / L, tz: (b[1] - a[1]) / L }; }
  spawn(f) {
    const N = this.net(); if (!N) return false;
    const sp = N.randomNear(f.x, f.z, 25, 160); if (!sp || sp.c.cls > 4) return false;
    const hour = this.g.tod?.hours ?? 12, type = crowdType(hour);
    let h; try { h = createHuman(typedOutfit(type), type); } catch (e) { return false; } giveBag(h, type);
    // v2.9 personalities: car fans stop and film / wave at a passing sports car, phone-checkers stop to read, couples
    // walk side by side at the same pace
    const w = { h, c: sp.c, i: sp.i, d: sp.d, dir: Math.random() < 0.5 ? 1 : -1, side: Math.random() < 0.5 ? 1 : -1, v: (type === 'office' ? 1.35 : type === 'student' ? 1.2 : 1.05) + Math.random() * 0.4, type, yaw: 0, pause: 0, ox: 0, oz: 0, lat: 0,
      fan: Math.random() < (type === 'student' ? 0.45 : type === 'office' ? 0.12 : 0.3), phoney: Math.random() < (type === 'office' ? 0.5 : 0.35), act: null, cool: 0 };
    w.umb = umbrella(); w.umb.position.set(0.12, (h.height || 1.7) + 0.08, 0.06); w.umb.visible = false; h.object.add(w.umb);
    this.g.scene.add(h.object); this.list.push(w); this.pose(w, true);
    if (Math.random() < (type === 'student' ? 0.55 : 0.2) && this.list.length < this.max) { let h2; try { h2 = createHuman(type === 'student' || type === 'office' ? typedOutfit(type) : randomOutfit(), type); if (type === 'student' || type === 'office') giveBag(h2, type); } catch { h2 = null; }
      if (h2) { const m = { ...w, h: h2, lead: w, lat: 0.6, fan: w.fan, phoney: false, umb: null }; m.umb = umbrella(); m.umb.position.copy(w.umb.position); m.umb.visible = false; h2.object.add(m.umb); w.lat = -0.05; this.g.scene.add(h2.object); this.list.push(m); this.pose(m, true); } }
    return true;
  }
  // someone walks out of a konbini door with a carrier bag and joins the nearest pavement
  spawnFromShop(sh) {
    const N = this.net(); if (!N) return; const sp = N.randomNear(sh.x, sh.z, 0, 30); if (!sp || sp.c.cls > 4) return;
    const type = Math.random() < 0.3 ? 'office' : Math.random() < 0.5 ? 'student' : 'shopper';
    let h; try { h = createHuman(typedOutfit(type), type); } catch { return; } giveBag(h, 'shopper');
    const w = { h, c: sp.c, i: sp.i, d: sp.d, dir: Math.random() < 0.5 ? 1 : -1, side: Math.random() < 0.5 ? 1 : -1, v: 1.1 + Math.random() * 0.3, type, yaw: 0, pause: 0, ox: 0, oz: 0, lat: 0, fan: false, phoney: Math.random() < 0.4, act: null, cool: 0, shopCool: 60 };
    w.umb = umbrella(); w.umb.position.set(0.12, (h.height || 1.7) + 0.08, 0.06); w.umb.visible = false; h.object.add(w.umb);
    this.g.scene.add(h.object); this.list.push(w); this.pose(w, true);
    // start at the door: the side-offset eases back onto the pavement line (ox/oz decay in update)
    const p = h.object.position; w.ox = sh.x + sh.nx * 0.6 - p.x; w.oz = sh.z + sh.nz * 0.6 - p.z; if (Math.hypot(w.ox, w.oz) > 25) { w.ox = w.oz = 0; } else { p.x += w.ox; p.z += w.oz; }
  }
  // ── cyclists ──
  // v2.16.1: the bicycle model is split once into frame / two wheels / crank / two pedals (splitBike) so the wheels
  // spin with the road speed and the cranks turn; the rider is a live person whose feet are held on the pedals and
  // hands on the grips by two-bone IK (people.js) on top of the seated clip, so the legs pedal
  manageBikes(f, night, N, inCity) {
    for (const b of this.bikes.slice()) { const p = b.obj.position; if (!N || b.c.dead || Math.hypot(p.x - f.x, p.z - f.z) > 260) this.dropBike(b); }
    if (this.maxBikes && !this.bikeReq) { this.bikeReq = true; loadPeopleProp('bicycle').then(sc => { this.bikeSrc = splitBike(sc); }).catch(e => { console.warn('bicycle', e?.message); this.maxBikes = 0; }); }
    const want = Math.round(this.maxBikes * (1 - 0.7 * night));
    if (!N || !inCity || !this.bikeSrc || !peopleReady() || this.bikes.length >= want) return;
    const sp = N.randomNear(f.x, f.z, 40, 170); if (!sp || sp.c.cls > 4 || sp.c.cls < 1) return;
    const B = this.bikeSrc, obj = new THREE.Group();
    const part = (g, at) => { const m = new THREE.Mesh(g, B.mat); m.castShadow = true; if (at) m.position.copy(at); obj.add(m); return m; };
    part(B.frame); const wF = part(B.wheelF, B.hubF), wR = part(B.wheelR, B.hubR), crank = part(B.crank, B.bb), pedals = B.pedals.map(q => part(q.g, q.c));
    let rider = null, live = false;
    try { const p = createPerson({ type: Math.random() < 0.35 ? 'student' : 'casual', mirror: false }); if (p.realistic) { rider = p; live = true; } else p.dispose?.(); } catch {}
    if (!live) { rider = createDriver(); if (!rider) { return; } rider.position.set(0, 0.79, -0.3); rider.scale.multiplyScalar(0.96); obj.add(rider); }
    else { obj.add(rider.object); rider.play('sit', 0); this.mountRider(rider, B); }
    this.g.scene.add(obj);
    const b = { obj, c: sp.c, i: sp.i, d: sp.d, dir: Math.random() < 0.5 ? 1 : -1, v: 3.8 + Math.random() * 1.6, vNow: 3, yaw: 0, t: Math.random() * 9, wF, wR, crank, pedals, rider: live ? rider : null, crankA: Math.random() * 6.28 };
    this.bikes.push(b); this.poseBike(b, true);
  }
  // seat the rider: pelvis over the saddle at a height where the leg just doesn't straighten at the bottom of the stroke
  mountRider(p, B) {
    const o = p.object; o.position.set(0, 0, 0); o.updateMatrixWorld(true); p.mixer.update(0.01); o.updateMatrixWorld(true);
    const hip = p.bone('LeftUpLeg'), knee = p.bone('LeftLeg'), foot = p.bone('LeftFoot'), hips = p.bone('Hips');
    const v1 = hip.getWorldPosition(new THREE.Vector3()), v2 = knee.getWorldPosition(new THREE.Vector3()), v3 = foot.getWorldPosition(new THREE.Vector3());
    const L = v1.distanceTo(v2) + v2.distanceTo(v3), h0 = hips.getWorldPosition(new THREE.Vector3()), parentInv = new THREE.Matrix4().copy(o.parent.matrixWorld).invert(); h0.applyMatrix4(parentInv);
    const low = B.bb.clone().add(new THREE.Vector3(0, -B.crankR + 0.075, -0.07)), seatZ = B.saddle.z + 0.02;
    const hipY = low.y + Math.sqrt(Math.max(0.1, (0.95 * L) ** 2 - (seatZ - low.z) ** 2)) + 0.03;
    o.position.set(-h0.x, Math.max(B.saddle.y + 0.04, hipY) - h0.y, seatZ - h0.z);
    // IK targets (world space, refreshed every frame in updateBikes)
    const T = () => new THREE.Vector3();
    p.ik = [
      { rotate: 'Spine', axis: new THREE.Vector3(1, 0, 0), angle: 0.5 }, // lean forward over the bars (axis refreshed per frame)
      { chain: ['LeftUpLeg', 'LeftLeg', 'LeftFoot'], target: T(), pole: T() }, { chain: ['RightUpLeg', 'RightLeg', 'RightFoot'], target: T(), pole: T() },
      { chain: ['LeftArm', 'LeftForeArm', 'LeftHand'], target: T(), pole: T() }, { chain: ['RightArm', 'RightForeArm', 'RightHand'], target: T(), pole: T() },
    ];
  }
  dropBike(b) { b.obj.removeFromParent(); if (b.rider) { try { b.rider.dispose(); } catch {} } this.bikes.splice(this.bikes.indexOf(b), 1); }
  poseBike(b, snap) {
    const S = this.seg(b.c, b.i), hx = S.tx * b.dir, hz = S.tz * b.dir, off = b.c.w / 2 - 0.75; // Japan: keep left
    b.obj.position.set(S.a[0] + S.tx * b.d + hz * off, 0.02, S.a[1] + S.tz * b.d - hx * off);
    const yaw = Math.atan2(hx, hz); if (snap) b.yaw = yaw; else { let dy = yaw - b.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); b.yaw += dy * 0.12; }
    b.obj.rotation.set(0, b.yaw, Math.sin(b.crankA) * 0.02 * Math.min(1, b.vNow / 2)); // a little sway with each pedal stroke
  }
  // wheels / crank / pedals / the rider's legs for this frame
  spinBike(b, dt) {
    const B = this.bikeSrc; if (!B) return;
    b.wF.rotation.x += b.vNow * dt / B.rF; b.wR.rotation.x += b.vNow * dt / B.rR;
    if (b.vNow > 0.3) b.crankA += b.vNow * dt / B.rR / 2.1; // gear ratio ~2.1 (city bike)
    b.crank.rotation.x = b.crankA;
    const ca = Math.cos(b.crankA), sa = Math.sin(b.crankA);
    b.pedals.forEach((m, i) => { const r = B.pedals[i].rel; m.position.set(B.bb.x + r.x, B.bb.y + r.y * ca - r.z * sa, B.bb.z + r.y * sa + r.z * ca); });
    const p = b.rider; if (!p || !p.ik) return;
    b.obj.updateMatrixWorld(true);
    const W = v => b.obj.localToWorld(v), D = v => v.transformDirection(b.obj.matrixWorld);
    // feet: the ankle sits a little above and behind the pedal axle; the character's left (+x) foot on the +x pedal
    p.ik[0].axis.set(1, 0, 0).transformDirection(b.obj.matrixWorld); // bike's right-to-left axis → leaning forward
    for (let s = 0; s < 2; s++) { const k = p.ik[1 + s], ped = b.pedals[B.pedals.findIndex(q => (q.rel.x > 0) === (s === 0))] || b.pedals[s];
      k.target.copy(W(ped.position.clone().add(new THREE.Vector3(0, 0.075, -0.06)))); k.pole.copy(D(new THREE.Vector3(0, 0.25, 1))); }
    for (let s = 0; s < 2; s++) { const k = p.ik[3 + s], g = B.grips[s === 0 ? 0 : 1]; k.target.copy(W(g.clone())); k.pole.copy(D(new THREE.Vector3(s === 0 ? 0.6 : -0.6, -1, -0.5))); }
    p.update(dt, { speed: 0, action: 'sit' });
  }
  updateBikes(dt, N) {
    const v = this.g.vehicle;
    for (const b of this.bikes) {
      if (b.c.dead) continue; b.t += dt;
      // slow / stop for the player's car just ahead
      let want = b.v; const p = b.obj.position;
      if (v) { const dx = v.pos.x - p.x, dz = v.pos.z - p.z, fw = dx * Math.sin(b.yaw) + dz * Math.cos(b.yaw), sd = Math.abs(dx * Math.cos(b.yaw) - dz * Math.sin(b.yaw)); if (fw > 0 && fw < 9 && sd < 2.2) want = 0; }
      b.vNow += Math.max(-4 * dt, Math.min(1.2 * dt, want - b.vNow));
      let step = b.vNow * dt;
      for (let guard = 0; guard < 3 && step > 0; guard++) {
        const S = this.seg(b.c, b.i), rem = b.dir > 0 ? S.L - b.d : b.d;
        if (step < rem) { b.d += step * b.dir; break; }
        step -= rem; b.d = b.dir > 0 ? S.L : 0; const vi = b.dir > 0 ? b.i + 1 : b.i;
        if (b.dir > 0 && b.i + 1 < b.c.pts.length - 1) { b.i++; b.d = 0; continue; }
        if (b.dir < 0 && b.i > 0) { b.i--; b.d = this.seg(b.c, b.i).L; continue; }
        const opts = (N.nodes.get(b.c.keys[vi]) || []).filter(([c2]) => c2 !== b.c && !c2.dead && c2.cls <= 4);
        if (opts.length) { const [c2, i2] = opts[Math.floor(Math.random() * opts.length)]; if (i2 < c2.pts.length - 1) { b.c = c2; b.i = i2; b.dir = 1; b.d = 0; } else { b.c = c2; b.i = i2 - 1; b.dir = -1; b.d = this.seg(c2, i2 - 1).L; } }
        else { b.dir = -b.dir; }
      }
      this.poseBike(b, false);
      // close by: spinning wheels + pedalling rider every frame; far: every few frames (they are a few pixels)
      const cam = this.g.camera?.position, d2 = cam ? (p.x - cam.x) ** 2 + (p.z - cam.z) ** 2 : 0;
      b.acc = (b.acc || 0) + dt; if (d2 < 70 * 70 || (this.g.frame ?? 0) % 4 === 0) { this.spinBike(b, b.acc); b.acc = 0; }
    }
  }
  remove(w) { for (const m of this.list) if (m.lead === w) m.lead = null; w.umb?.removeFromParent(); this.g.scene.remove(w.h.object); try { w.h.dispose(); } catch {} this.list.splice(this.list.indexOf(w), 1); }
  pose(w, snap) {
    const S = this.seg(w.c, w.i); const off = w.c.w / 2 + (w.c.cls <= 3 ? 1.6 : 0.8) + (w.lat || 0) * w.side;
    const hx = S.tx * w.dir, hz = S.tz * w.dir;
    const x = S.a[0] + S.tx * w.d + S.tz * off * w.side, z = S.a[1] + S.tz * w.d - S.tx * off * w.side;
    w.h.object.position.set(x + w.ox, 0.05, z + w.oz);
    const yaw = Math.atan2(hx, hz);
    if (snap) w.yaw = yaw; else { let dy = yaw - w.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; w.yaw += dy * 0.15; }
    w.h.object.rotation.y = w.yaw;
  }
  update(dt, f, night) {
    peopleFrame(this.g);
    const N = this.net();
    this.manageT -= dt;
    if (this.manageT <= 0) {
      this.manageT = 1;
      const ready = peopleReady() || peopleFailed() || performance.now() - this.born > 25000;
      for (const w of this.list.slice()) { const p = w.h.object.position, d = Math.hypot(p.x - f.x, p.z - f.z); if (!N || w.c.dead || d > 260 || (peopleReady() && !w.h.realistic && d > 45 && !w.lead)) this.remove(w); }
      // v2.16: busier where there are shops (station fronts, shopping streets), quieter in back streets and at night
      const C1 = this.g.world.city, nShops = C1?.shopsNear ? C1.shopsNear(f.x, f.z, 160).length : 0;
      const want = Math.round(this.max * (1 - 0.55 * night) * (0.55 + 0.45 * Math.min(1, nShops / 5)));
      const inCity = this.g.world.isLand(f.x, f.z) && f.y < 8;
      const C0 = this.g.world.city, shs = C0?.shopsNear ? C0.shopsNear(f.x, f.z, 190).filter(s => Math.hypot(s.x - f.x, s.z - f.z) > 25) : [];
      this.manageBikes(f, night, N, inCity);
      for (let k = 0; N && inCity && ready && k < 4 && this.list.length < want; k++) { if (shs.length && Math.random() < 0.3 && night < 0.8) this.spawnFromShop(shs[Math.floor(Math.random() * shs.length)]); else this.spawn(f); }
    }
    if (!N) return;
    this.updateBikes(dt, N);
    const raining = (this.g.env?.rain ?? 0) > 0.15;
    const v = this.g.vehicle, drive = this.g.mode === 'drive' && v;
    // v2.13.11 routines: some people pop into a konbini they pass (walk to the door, go in) and others come out with a bag
    const C = this.g.world.city;
    if (C?.shopsNear && (this._shopT = (this._shopT || 0) - dt) <= 0) { this._shopT = 2.5;
      for (const w of this.list) if (!w.go && !w.lead && !w.act && Math.random() < 0.25) { const p = w.h.object.position, sh = C.shopsNear(p.x, p.z, 22)[0]; if (sh && !(w.shopCool > 0)) { w.go = { x: sh.x + sh.nx * 0.6, z: sh.z + sh.nz * 0.6, door: sh }; for (const m of this.list) if (m.lead === w) m.lead = null; } }
    }
    for (const w of this.list.slice()) {
      if (w.go) { const p = w.h.object.position, dx = w.go.x - p.x, dz = w.go.z - p.z, d = Math.hypot(dx, dz);
        if (d < 0.4) { this.g.audio?.sfx?.('store_chime', { gain: 0.25, pos: p }); this.remove(w); continue; }
        p.x += dx / d * 1.2 * dt; p.z += dz / d * 1.2 * dt; w.yaw = Math.atan2(dx, dz); w.h.object.rotation.y = w.yaw; w.h.object.visible = true; try { w.h.update(dt, { speed: 1.2, action: 'walk' }); } catch {} continue; }
    }
    for (const w of this.list) {
      if (w.c.dead || w.go) continue;
      if (w.shopCool > 0) w.shopCool -= dt;
      let speed = w.v;
      // stop for a moving car about to pass close by
      const p = w.h.object.position;
      if (drive) { const dx = p.x - v.pos.x, dz = p.z - v.pos.z, d2 = dx * dx + dz * dz; if (d2 < 16 && Math.abs(v.kmh) > 3) { const d = Math.sqrt(d2) || 1; w.ox += dx / d * dt * 4; w.oz += dz / d * dt * 4; speed = 0; } }
      // step back onto the pavement line once the car has gone (the side-step used to be overwritten by pose())
      const k = Math.min(1, dt * 0.8); w.ox -= w.ox * k; w.oz -= w.oz * k;
      // a sports car going by (or revving close by): fans stop, turn to it and film or wave
      w.cool -= dt;
      if (drive && w.fan && w.cool <= 0 && !w.act) { const dx = v.pos.x - p.x, dz = v.pos.z - p.z, d = Math.hypot(dx, dz); const sporty = ['jdm', 'euro', 'us'].includes(v.car?.cat);
        if (sporty && d < 32 && (Math.abs(v.kmh) > 25 || (v.engine?.rpm || 0) > 4500)) { w.act = Math.random() < 0.65 ? 'photo' : 'wave'; w.actT = 3 + Math.random() * 3; w.pause = w.actT; w.cool = 25; } }
      if (!w.act && w.phoney && w.pause <= 0 && Math.random() < dt * 0.015) { w.act = 'phone'; w.actT = 4 + Math.random() * 6; w.pause = w.actT; }
      if (w.act) { w.actT -= dt; if (w.actT <= 0) w.act = null; }
      if (w.lead) { const L = w.lead; w.c = L.c; w.i = L.i; w.d = L.d; w.dir = L.dir; w.side = L.side; w.pause = L.pause; if (L.act === 'photo' || L.act === 'wave') { w.act = L.act; w.actT = L.actT; } speed = L.pause > 0 ? 0 : L.v; this.pose(w, false); }
      if (w.pause > 0) { w.pause -= dt; speed = 0; } else w.waitX = undefined;
      let step = w.lead ? 0 : speed * dt;
      if (!w.lead) w.vNow = speed;
      for (let guard = 0; guard < 3 && step > 0; guard++) {
        const S = this.seg(w.c, w.i); const rem = w.dir > 0 ? S.L - w.d : w.d;
        if (step < rem) { w.d += step * w.dir; step = 0; break; }
        step -= rem; w.d = w.dir > 0 ? S.L : 0;
        const vi = w.dir > 0 ? w.i + 1 : w.i;
        if (w.dir > 0 && w.i + 1 < w.c.pts.length - 1) { w.i++; w.d = 0; continue; }
        if (w.dir < 0 && w.i > 0) { w.i--; w.d = this.seg(w.c, w.i).L; continue; }
        // chain end: carry on along another street meeting here, or turn back
        const opts = (N.nodes.get(w.c.keys[vi]) || []).filter(([c2]) => c2 !== w.c && !c2.dead && c2.cls <= 4);
        if (opts.length && Math.random() < 0.85) {
          const [c2, i2] = opts[Math.floor(Math.random() * opts.length)];
          if (i2 < c2.pts.length - 1) { w.c = c2; w.i = i2; w.dir = 1; w.d = 0; } else { w.c = c2; w.i = i2 - 1; w.dir = -1; w.d = this.seg(c2, i2 - 1).L; }
          // v2.16: a real junction (several streets meet) — wait at the corner for the lights like everyone else; people
          // already waiting there set the rhythm so a little crowd builds up and then crosses together
          if (opts.length >= 2 && Math.random() < 0.6) {
            const p0 = w.h.object.position; let tw = 0; for (const o of this.list) if (o !== w && o.waitX !== undefined && o.pause > 0 && Math.hypot(o.waitX - p0.x, o.waitZ - p0.z) < 14) { tw = Math.max(tw, o.pause); }
            w.pause = tw || 5 + Math.random() * 12; w.waitX = p0.x; w.waitZ = p0.z; if (w.phoney && Math.random() < 0.5 && !w.act) { w.act = 'phone'; w.actT = w.pause; }
          } else if (Math.random() < 0.15) w.pause = 2 + Math.random() * 6;
        } else { w.dir = -w.dir; w.pause = 1 + Math.random() * 3; }
      }
      this.pose(w, false);
      if ((w.act === 'photo' || w.act === 'wave') && v) { const dx = v.pos.x - p.x, dz = v.pos.z - p.z; w.yaw = Math.atan2(dx, dz); w.h.object.rotation.y = w.yaw; } // face the car
      if (w.umb) w.umb.visible = raining && w.act !== 'photo';
      const d2 = (p.x - f.x) ** 2 + (p.z - f.z) ** 2;
      w.h.object.visible = d2 < 200 * 200;
      if (w.h.object.visible && (d2 < 70 * 70 || this.g.frame % 3 === 0)) { try { w.h.update(d2 < 70 * 70 ? dt : dt * 3, { speed, action: w.act && speed < 0.1 ? w.act : speed > 0.1 ? 'walk' : 'idle' }); } catch {} }
    }
  }
}
