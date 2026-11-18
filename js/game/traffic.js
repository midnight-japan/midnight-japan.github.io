// AI traffic: lane-following expressway cars (IDM car-following), car-meet visitors that park in the PA,
// and police patrol / pursuit. Models are merged per material for few draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CARS, CAR_BY_ID } from '../../data/cars.js';
import { buildCarAuto, requestGlb, glbEntry } from './carfactory.js';
import { PA_RECT, PA, PA_LAYOUT } from './roads.js';
import { STANCE_PRESETS, defaultStance } from './carmodel.js';

const _pa = new THREE.Vector3(), _pb = new THREE.Vector3();
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const MEET_POOL = ['s13', 'ap1', 'nd', 'rx8', 'fc3s', 'dc2', 'lfa', 'r34', 'r32', 'r33', 'r35', 's15', 'rps13', 'z33', 'gr86', 'ae86', 'jza80', 'a90', 'jzx100', 'fd3s', 'na1', 'ek9', 'fl5', 'evo9', 'gdb', 'p911', 'e46', 'mustang', 'model3', 'r34', 'jza80', 'fd3s'];
const CITY_POOL = ['xtrail', 'accord', 'hijet', 'acty', 'elf', 'wagonr', 'wagonr', 'nd', 'taxi', 'taxi', 'taxi', 'crown', 'crown', 'model3', 'truck', 'truck', 'bus', 'fl5', 'r35', 'gr86', 'ek9', 'jzx100', 'e46', 'z33'];
// NPC traffic uses cars that have real 3D models (the procedural-only kei/hybrid models stay player-selectable)
// v2.3: everyday Japanese traffic first (taxis, Crowns, vans, trucks, kei cars, Leafs, buses); sports cars are rare on the road
const TRAFFIC_POOL = ['xtrail', 'accord', 'elf', 'elf', 'hijet', 'acty', 'wagonr', 'taxi', 'taxi', 'taxi', 'crown', 'crown', 'crown', 'truck', 'truck', 'truck', 'truck', 'bus', 'bus', 'model3', 'model3', 'crown', 'a90', 'jzx100', 'e46', 'gr86', 'fl5'];

// Merge all static meshes of a car model by material (keeps wheels, doors, lights animatable).
export function mergeModel(model) {
  const keep = new Set();
  for (const w of model.parts.wheels) keep.add(w.steer);
  const buckets = new Map();
  const remove = [];
  model.bodyG.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.bodyG.matrixWorld).invert();
  model.bodyG.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh) return;
    if (o.userData.isPlate) return;
    let p = o.parent; while (p && p !== model.bodyG) { if (model.parts.doors.some(d => d.pivot === p) || model.parts.popups.includes(p) || p === model.parts.steering) return; p = p.parent; }
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const groups = g.groups.length ? g.groups : [{ start: 0, count: g.attributes.position.count, materialIndex: 0 }];
    for (const gr of groups) {
      const mat = mats[gr.materialIndex] || mats[0];
      const sub = new THREE.BufferGeometry();
      for (const name of ['position', 'normal', 'color']) {
        const a = g.attributes[name]; if (!a) continue;
        sub.setAttribute(name, new THREE.BufferAttribute(a.array.slice(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), a.itemSize));
      }
      if (mat.vertexColors && !sub.attributes.color) { const c = new Float32Array(sub.attributes.position.count * 3).fill(1); sub.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
      if (!mat.vertexColors && sub.attributes.color) sub.deleteAttribute('color');
      let arr = buckets.get(mat); if (!arr) buckets.set(mat, arr = []); arr.push(sub);
    }
    remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
  for (const [mat, arr] of buckets) {
    try { const mg = mergeGeometries(arr, false); if (!mg) continue; const m = new THREE.Mesh(mg, mat); m.castShadow = !mat.transparent; model.bodyG.add(m); } catch (e) { /* attribute mismatch → skip */ }
  }
  // drop the interior gauge canvas (not needed for AI)
  return model;
}

export class Traffic {
  constructor(game) {
    this.g = game; this.net = game.net; this.world = game.world; this.scene = game.scene;
    this.cars = []; this.max = { low: 28, medium: 52, high: 84, ultra: 112 }[game.quality] ?? 40;
    this.meetMax = { low: 12, medium: 22, high: 32, ultra: 44 }[game.quality] ?? 22;
    this.t = 0; this.spawnT = 0; this.paClosed = false;
    this.headPool = this.makeHeadPool();
    this.cityMax = { low: 10, medium: 22, high: 36, ultra: 50 }[game.quality] ?? 22;
  }
  makeHeadPool() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, 'rgba(255,240,215,.9)'); gr.addColorStop(1, 'rgba(255,240,215,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(22, 128); g.lineTo(42, 128); g.lineTo(64, 0); g.lineTo(0, 0); g.fill();
    const t = new THREE.CanvasTexture(c);
    const geo = new THREE.PlaneGeometry(3.2, 14); geo.rotateX(-Math.PI / 2); geo.translate(0, 0.04, 7.6 + 1.2);
    return { geo, mat: new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }) };
  }
  // load every traffic model up front; swap procedural stand-ins for the real model as soon as it is in
  // v2.5.1: two at a time, the cars actually on screen first (was: every model at once, before the game started —
  // ~90 MB competing with the essentials on a phone connection)
  preloadModels() {
    if (this._pre || (this.g.mode !== 'drive' && this.g.mode !== 'walk')) return; this._pre = true;
    const want = new Set([...this.cars.map(a => a.car.id), ...TRAFFIC_POOL, 'police', ...CITY_POOL, ...MEET_POOL]);
    const q = [...want]; const next = () => { const id = q.shift(); if (!id) return; requestGlb(id, 'lo').catch(() => {}).finally(next); };
    next(); next();
  }
  // v2.10: a driver at the wheel of every moving NPC car (seated torso + head, a few outfits; hidden when parked)
  driverFor(ai) {
    if (!this._drv) { const skin = [0xe8c4a4, 0xd9b08c, 0xc8956e].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })), shirt = [0x1c2433, 0xe8e8e4, 0x2b2b2e, 0x4a5a7a, 0x6b2a2a, 0x3c4a3a, 0x8a8a90].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })), hair = new THREE.MeshStandardMaterial({ color: 0x15120f, roughness: 0.8 });
      const torso = new THREE.CylinderGeometry(0.15, 0.19, 0.5, 10); torso.translate(0, 0.25, 0); torso.scale(1.25, 1, 0.75);
      const head = new THREE.SphereGeometry(0.095, 14, 10); head.scale(0.92, 1.1, 1); head.translate(0, 0.66, 0.01);
      const cap = new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55); cap.scale(0.95, 1.05, 1.05); cap.translate(0, 0.675, -0.005);
      const arm = new THREE.CylinderGeometry(0.045, 0.05, 0.42, 6); arm.rotateX(-1.1); arm.translate(0, 0.33, 0.17);
      this._drv = { skin, shirt, hair, torso, head, cap, arm }; }
    const D = this._drv, g = new THREE.Group(), r = a => a[Math.floor(Math.random() * a.length)];
    const sh = r(D.shirt), sk = r(D.skin);
    g.add(new THREE.Mesh(D.torso, sh), new THREE.Mesh(D.head, sk), new THREE.Mesh(D.cap, D.hair));
    for (const x of [-0.17, 0.17]) { const m = new THREE.Mesh(D.arm, sh); m.position.x = x; g.add(m); }
    const c = ai.car, big = c.cat === 'traffic' && (c.id === 'bus' || c.id === 'truck');
    const hw = c.W / 2000, x = -Math.min(0.38, hw * 0.48) * (c.lhd ? -1 : 1);
    g.position.set(big ? -hw * 0.55 : x, big ? 1.15 : Math.max(0.28, c.H / 1000 * 0.24), big ? c.L / 2000 - 1.3 : -c.wb / 1000 * 0.08);
    return g;
  }
  seatDriver(ai) { if (ai.seatD) ai.seatD.removeFromParent(); ai.seatD = this.driverFor(ai); ai.model.root.add(ai.seatD); ai.seatD.visible = ai.mode !== 'parked'; }
  swapModels() {
    let n = 0;
    for (const ai of this.cars) {
      if (n >= 30 || ai.model.isGlb || !glbEntry(ai.car.id, 'lo')) continue;
      const old = ai.model, L = { ...old.lights };
      const model = buildCarAuto(ai.car, { lod: 'low', color: ai.color, glb: true, realLights: false }); if (!model.isGlb) continue;
      old.root.remove(ai.beam); this.scene.remove(old.root); old.dispose?.();
      model.root.add(ai.beam); model.root.position.copy(old.root.position); model.root.rotation.copy(old.root.rotation); Object.assign(model.lights, L);
      this.scene.add(model.root); ai.model = model; n++; if (ai.seatD) { model.root.add(ai.seatD); }
    }
  }
  createAI(id, opts = {}) {
    const car = CAR_BY_ID[id];
    // real factory palette; white/pearl only now and then (it was reading as unpainted bodywork)
    const pal = car.colors.filter(c => !/^#e[0-9a-f]e[0-9a-f]e[0-9a-f]$|^#f/i.test(c)); const color = opts.color || (pal.length && Math.random() > 0.15 ? pal[Math.floor(Math.random() * pal.length)] : car.colors[Math.floor(Math.random() * car.colors.length)]);
    // real glTF models for traffic only on medium+ quality (they cost more triangles than the low-LOD procedural cars)
    // only real 3D models drive around (v1.1.1): until a model has loaded the car is built procedurally and swapped later
    const model = buildCarAuto(car, { lod: 'low', color, glb: true, realLights: false, lazy: true });
    if (!model.isGlb) { mergeModel(model); model.root.visible = false; } // hidden until its real model has loaded (swapModels)
    const beam = new THREE.Mesh(this.headPool.geo, this.headPool.mat); beam.position.z = 0; model.root.add(beam);
    this.scene.add(model.root);
    const ai = { car, model, beam, road: null, lane: null, s: 0, dir: 1, v: 0, vDes: 0, mode: 'road', t: 0, id: Math.random(), color, pos: new THREE.Vector3(), yaw: 0, radius: car.W / 2000, halfL: car.L / 2000, ...opts };
    ai.spin = 0;
    this.seatDriver(ai);
    this.cars.push(ai);
    return ai;
  }
  // share of the full traffic volume at the current game hour
  density() {
    const h = this.g.tod?.hours ?? 22;
    const pts = [[0, 0.5], [2, 0.3], [4, 0.25], [5.5, 0.4], [7, 0.95], [8.5, 1], [10, 0.8], [13, 0.85], [16, 0.9], [18, 1], [20, 0.75], [22, 0.6], [24, 0.5]];
    for (let i = 1; i < pts.length; i++) if (h <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + (vb - va) * (h - a) / (b - a); }
    return 0.5;
  }
  // the player sounded the horn: cars just ahead in the same direction move over (or at least speed up)
  honk(pos, fwd) {
    for (const ai of this.cars) {
      if (ai.police || ai.incident || (ai.mode !== 'road' && ai.mode !== 'city')) continue;
      const dx = ai.pos.x - pos.x, dz = ai.pos.z - pos.z, d = Math.hypot(dx, dz); if (d > 45 || d < 1) continue;
      if ((dx * fwd.x + dz * fwd.z) / d < 0.75 || Math.sin(ai.yaw) * fwd.x + Math.cos(ai.yaw) * fwd.z < 0.5) continue;
      ai.yieldT = 5;
      // which side of us is the honking car? (in our frame: +1 left, −1 right, 0 behind in our lane)
      const rx = Math.cos(ai.yaw), rz = -Math.sin(ai.yaw), side = -(dx * rx + dz * rz); ai.yieldSide = Math.abs(side) < 2.2 ? 0 : side > 0 ? 1 : -1;
      if (ai.mode === 'city') { ai.yieldSlow = 3; ai.cityBias = (ai.yieldSide >= 0 ? -1 : 1); }
    }
  }
  remove(ai) {
    if (ai.snd) { try { ai.snd.dispose(); } catch {} ai.snd = null; }
    this.scene.remove(ai.model.root);
    ai.model.root.traverse(o => { if (o.geometry && o !== ai.beam && !o.geometry.userData.shared) o.geometry.dispose(); }); // v2.4.1: real-model geometry is shared by every copy — disposing it re-uploaded it for the next car
    this.cars.splice(this.cars.indexOf(ai), 1);
    if (ai.spot) ai.spot.taken = false;
    if (ai.driver) this.g.npc?.removeDriver(ai);
  }
  // the overtaking lane (追越車線 — the median-side lane, "1st lane" to a Korean driver) of a multi-lane carriageway is
  // left to the player: traffic never spawns in it, never changes into it, and leaves it if a junction drops it there
  fastLane(road, dir) { const ls = road.lanes.filter(l => l.dir === dir); if (ls.length < 2 || road.kind === 'local') return null; return ls.reduce((a, b) => (b.lat * dir < a.lat * dir ? b : a)); }
  // put an AI on a road lane
  placeOnRoad(ai, road, lane, s) {
    if (!ai.police && lane === this.fastLane(road, lane.dir)) { const ls = road.lanes.filter(l => l.dir === lane.dir && l !== lane); lane = ls.reduce((a, b) => (Math.abs(b.lat - lane.lat) < Math.abs(a.lat - lane.lat) ? b : a)); }
    ai.mode = 'road'; ai.road = road; ai.lane = lane; ai.dir = lane.dir; ai.s = s; ai.lat = lane.lat;
    ai.vDes = (road.speed / 3.6) * (0.85 + Math.random() * 0.35) * (ai.car.mass > 5000 ? 0.85 : 1);
    ai.v = ai.vDes * 0.9;
  }

  init() {
    // v2.5.1: no model downloads before the first frame — manage() starts them once you are driving
    // initial highway traffic
    const bay = this.net.byId.bayshore, k5 = this.net.byId.k5, k5n = this.net.byId.k5_nb || k5, k1 = this.net.byId.k1 || bay, k3 = this.net.byId.k3 || bay;
    for (let i = 0; i < this.max; i++) {
      const q = Math.random(), road = q < 0.55 ? bay : q < 0.67 ? k5 : q < 0.78 ? k5n : q < 0.93 ? k1 : k3;
      const lane = road.lanes[Math.floor(Math.random() * road.lanes.length)];
      const ai = this.createAI(TRAFFIC_POOL[Math.floor(Math.random() * TRAFFIC_POOL.length)]);
      this.placeOnRoad(ai, road, lane, Math.random() * road.length);
    }
    // meet cars already parked
    // like the real Daikoku meets the cars bunch up in one corner of the lot (the east meet rows, where the player parks)
    const spots = this.world.parkingSpots.filter(s => s.size === 's');
    const meetSide = spots.filter(s => s.pos.x > 55); const ctr = { x: 0, z: 0 };
    for (const s of meetSide.length ? meetSide : spots) { ctr.x += s.pos.x; ctr.z += s.pos.z; }
    ctr.x /= Math.max(1, (meetSide.length || spots.length)); ctr.z /= Math.max(1, (meetSide.length || spots.length));
    const order = spots.slice().sort((a, b) => Math.hypot(a.pos.x - ctr.x, a.pos.z - ctr.z) - Math.hypot(b.pos.x - ctr.x, b.pos.z - ctr.z));
    const n = Math.round(this.meetMax * 0.8); let placed = 0;
    const pool = MEET_POOL.slice().sort(() => Math.random() - 0.5); // variety: no duplicates until the pool is used up
    for (const spot of order) {
      if (placed >= n) break;
      if (spot.taken || Math.random() < 0.18) continue; // a few gaps, like real arrivals
      this.spawnParked(pool[placed % pool.length], spot); placed++;
    }
    // a few trucks parked in the large bays
    const big = this.world.parkingSpots.filter(s => s.size === 'l');
    // the large bays are mostly full of trucks resting (as at any expressway PA), and ordinary cars are parked all over
    // the rest of the lot — commuters, families, delivery vans — not only the meet crowd
    for (const s of big) if (!s.taken && Math.random() < 0.7) this.spawnParked(Math.random() < 0.75 ? 'truck' : 'bus', s, true, true);
    for (const s of spots) if (!s.taken && Math.random() < 0.22) this.spawnParked(TRAFFIC_POOL[Math.floor(Math.random() * TRAFFIC_POOL.length)], s, true, true);
    // police: patrol car on the expressway + parked units at the post
    const pol = this.createAI('police'); pol.police = true; this.placeOnRoad(pol, bay, bay.lanes.find(l => l.dir === 1 && l.i === 0), 600); pol.vDes = 22;
    this.patrol = pol;
    for (const p of (this.world.policeBays || []).slice(0, 2)) { const a = this.createAI(Math.random() < 0.5 ? 'police' : 'police_unmarked'); a.mode = 'parked'; a.pos.copy(p); a.yaw = this.world.policeYaw ?? Math.PI; a.police = true; a.station = true; }
  }
  spawnParked(id, spot, noDriver = false, plain = false) {
    const ai = this.createAI(id); ai.plain = plain;
    spot.taken = true; ai.spot = spot; ai.mode = 'parked'; ai.pos.copy(spot.pos); ai.yaw = spot.yaw; if (ai.seatD) ai.seatD.visible = false;
    ai.stay = 60 + Math.random() * 400;
    if (!noDriver) this.g.npc?.spawnMeetGroup(ai);
    // some show-offs: hood open, stance
    if (!plain && Math.random() < 0.25 && ai.model.parts.hood) ai.model.parts.hood.target = 1;
    if (!plain) { // v2.4: meet cars run their usual stance, a third of them something louder
      const ks = Object.keys(STANCE_PRESETS), k = Math.random() < 0.35 ? ks[1 + Math.floor(Math.random() * (ks.length - 2))] : defaultStance(CAR_BY_ID[id]).preset;
      const P = STANCE_PRESETS[k] || STANCE_PRESETS.stock, j = () => 0.8 + Math.random() * 0.4;
      ai.model.setStance({ camberF: P.camberF * j(), camberR: P.camberR * j(), ride: P.ride * j(), track: P.track * j(), toeF: P.toeF, toeR: P.toeR, rake: P.rake });
    }
    ai.model.lights.head = false;
    return ai;
  }

  // ───── per frame ─────
  // engine sound for the few AI cars closest to you (lite synth, positional; idle / cruising rpm from road speed with a
  // virtual gearbox) — enough to hear cars pass and idle beside you without a wall of noise
  engineSounds(dt) {
    const a = this.g.audio; if (!a?.ready) return;
    this._sndT = (this._sndT || 0) - dt;
    if (this._sndT <= 0) {
      this._sndT = 0.5; const f = this.g.focus;
      const near = this.cars.filter(c => c.mode !== 'parked' || c.engineOn).map(c => [c, c.pos.distanceToSquared(f)]).filter(([, d]) => d < 70 * 70).sort((x, y) => x[1] - y[1]).slice(0, 4).map(([c]) => c);
      for (const c of this.cars) if (c.snd && !near.includes(c)) { try { c.snd.dispose(); } catch {} c.snd = null; }
      for (const c of near) if (!c.snd) c.snd = a.createEngine(c.car, { lod: 'lite' });
    }
    for (const c of this.cars) {
      if (!c.snd) continue;
      const E = c.car.engine, kmh = (c.v || 0) * 3.6, idle = E.idle || 750, red = E.redline || 6500;
      // v2.4.1: the car's real gear ratios — the highest gear that keeps the engine above its cruising floor
      const T = c.car.trans || {}, gs = T.gears?.length ? T.gears : [3.5, 2.1, 1.4, 1.0, 0.8], fin = T.final || 4.1, wr = 0.31;
      const acc = (c.v || 0) - (c._vPrev ?? c.v ?? 0); c._vPrev = c.v || 0; const want = acc > 0.02 ? 0.36 : 0.26;
      let rpm = idle;
      if (kmh >= 2) { const w = (c.v || 0) / wr * 60 / (2 * Math.PI); let r0 = w * gs[0] * fin; for (let i = gs.length - 1; i >= 0; i--) { const r = w * gs[i] * fin; if (r >= red * want || i === 0) { r0 = r; break; } } rpm = Math.max(idle * 1.1, Math.min(red * 0.8, r0)); }
      c.snd.update({ rpm, throttle: c.braking ? 0 : kmh > 2 ? 0.35 : 0, load: c.braking ? -0.3 : 0.25, running: true, cranking: false, boost: 0, speed: c.v || 0, slip: 0, position: c.pos, interior: false, openness: 1 });
    }
  }
  update(dt, env) {
    try { this.engineSounds(dt); } catch (e) { /* audio is optional */ }
    this.t += dt;
    const player = this.g.vehicle && this.g.mode === 'drive' ? this.g.vehicle : null;
    const night = env.night;
    this.headPool.mat.opacity = night * 0.35;
    // index cars per road/lane for leader search
    const byLane = new Map();
    for (const ai of this.cars) if (ai.mode === 'road') { const k = ai.road.index * 100 + ai.lane.lat; let a = byLane.get(k); if (!a) byLane.set(k, a = []); a.push(ai); }
    for (const a of byLane.values()) a.sort((x, y) => (x.s - y.s) * x.dir);
    // player position projected onto roads
    let ph = null;
    if (player) ph = this.net.hits(player.pos.x, player.pos.z).filter(h => h.inside && Math.abs(h.y - player.pos.y) < 2);
    for (const ai of this.cars) {
      if (ai.seatD) ai.seatD.visible = ai.mode !== 'parked' && !ai.accident; // v2.10: seat empty when parked
      if (ai.model.isGlb && this.g.camera) { const cp = this.g.camera.position, dd = (ai.pos.x - cp.x) ** 2 + (ai.pos.z - cp.z) ** 2, R = this.g.quality === 'low' ? 350 : this.g.quality === 'medium' ? 600 : 900; ai.model.root.visible = dd < R * R; } // v2.11: far cars are a few pixels — not drawn
      ai.t += dt;
      if (ai.mode === 'road') this.driveRoad(ai, dt, byLane, ph, player);
      else if (ai.mode === 'path') this.drivePath(ai, dt, player);
      else if (ai.mode === 'parked') this.parked(ai, dt);
      else if (ai.mode === 'city') this.driveCity(ai, dt, player);
      // write transform
      const m = ai.model;
      m.root.position.copy(ai.pos); m.root.rotation.order = 'YXZ'; m.root.rotation.y = ai.yaw;
      if (ai.mode === 'road' && ai.near && ai.road) { // pitch with the road grade (ramps, bridges)
        const r = ai.road, a = r.at(Math.min(r.length, ai.s + 2), ai.lat, _pa), b = r.at(Math.max(0, ai.s - 2), ai.lat, _pb);
        m.root.rotation.x = -Math.atan2((a.y - b.y) * ai.dir, Math.hypot(a.x - b.x, a.z - b.z) || 1);
      } else m.root.rotation.x = 0;
      ai.spin += ai.v / 0.32 * dt;
      const L = m.lights;
      L.head = night > 0.45 && ai.mode !== 'parked';
      L.brake = ai.braking; L.reverse = !!ai.reversing;
      L.left = ai.signal === 1; L.right = ai.signal === -1;
      L.beacon = !!ai.pursuit || !!ai.accident || (ai.police && this.paClosed && ai.closure);
      ai.beam.visible = L.head;
      if (this.g.frame % 2 === 0 || ai.near) m.update(dt * 2, { steer: ai.steer || 0, spin: [ai.spin, ai.spin, ai.spin, ai.spin] });
    }
    // spawn management
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 1.2; this.manage(); }
    if (this.g.police) this.g.police.update(dt);
  }

  driveRoad(ai, dt, byLane, ph, player) {
    const road = ai.road;
    // leader
    const list = byLane.get(road.index * 100 + ai.lane.lat) || [];
    let gap = 1e9, vLead = ai.vDes;
    for (const o of list) { if (o === ai) continue; const d = (o.s - ai.s) * ai.dir; if (d > 0 && d < gap) { gap = d; vLead = o.v; } }
    // player as obstacle
    let behindMe = false;
    if (ph && player) for (const h of ph) if (h.road === road && Math.abs(h.lat - ai.lat) < 2.6) { const d = (h.s - ai.s) * ai.dir; if (d > 0 && d < gap) { gap = d; behindMe = true; vLead = Math.max(0, player.vel.dot(road.dirAt(h.s)) * ai.dir); } }
    // closures
    if (ai.stopAt !== undefined) { const d = (ai.stopAt - ai.s) * ai.dir; if (d > 0 && d < gap) { gap = d; vLead = 0; } }
    // IDM
    // v2.5.3: behind the player they hang well back (2.8 s, +14 m) instead of sitting on your bumper
    const a = 1.6, bComf = 2.5, s0 = 6 + ai.halfL + (behindMe && gap < 120 ? 14 : 0), T = behindMe && gap < 120 ? 2.8 : 1.3;
    const dv = ai.v - vLead;
    const sStar = s0 + Math.max(0, ai.v * T + ai.v * dv / (2 * Math.sqrt(a * bComf)));
    if (ai.yieldSlow > 0) ai.yieldSlow -= dt;
    let acc = a * (1 - Math.pow(ai.v / Math.max(1, ai.yieldSlow > 0 ? ai.vDes * 0.7 : ai.vDes), 4) - Math.pow(sStar / Math.max(0.1, gap - ai.halfL * 2), 2));
    acc = clamp(acc, -8, a);
    ai.braking = acc < -1;
    ai.v = Math.max(0, ai.v + acc * dt);
    ai.s += ai.v * dt * ai.dir;
    // lane discipline as on Japanese expressways: drive in the left (travel) lane, overtake on the right, then move back
    // left. "Leftness" of a lane for this direction = lat · dir. Cars also move over when the player sounds the horn.
    if (ai.yieldT > 0) ai.yieldT -= dt;
    if (!ai.police && Math.abs(ai.lat - ai.lane.lat) < 0.5) {
      const same = road.lanes.filter(l => l.dir === ai.dir && l !== ai.lane && Math.abs(l.lat - ai.lane.lat) < 4);
      const lft = l => l.lat * ai.dir, free = (l, ahead, behind) => !(byLane.get(road.index * 100 + l.lat) || []).some(o => { const d = (o.s - ai.s) * ai.dir; return d < ahead && d > -behind; });
      const fast = this.fastLane(road, ai.dir);
      let right = same.filter(l => lft(l) < lft(ai.lane)).sort((a, b) => lft(b) - lft(a))[0], left = same.filter(l => lft(l) > lft(ai.lane)).sort((a, b) => lft(a) - lft(b))[0];
      if (right === fast) right = null;
      let target = null;
      const rw = this.g.roadworks; const shut = l => rw && rw.closed(road, ai.dir, ai.s, l, 450);
      if (right && shut(right)) right = null;
      if (shut(ai.lane) && left) { if (free(left, 25, 12) || Math.random() < dt * 0.5) target = left; else ai.yieldSlow = 2; } // v2.10: lane closed ahead — merge left
      else if (ai.lane === fast && left) target = left; // dropped into the overtaking lane by a junction → move over
      else if (ai.yieldT > 0 && Math.random() < dt * 4) {
        // honked at: move AWAY from the player (who is behind) — never across into their lane
        const ps = ai.yieldSide ?? 0; // −1 player on our right, +1 on our left, 0 same lane
        target = ps <= 0 ? ((left && free(left, 25, 15)) ? left : (ps === 0 && right && free(right, 25, 15)) ? right : null) : ((right && free(right, 25, 15)) ? right : null);
        if (!target) ai.yieldSlow = 3; // nowhere to go: ease off and let them by
      }
      else if (gap < 45 && vLead < ai.vDes * 0.85 && right && Math.random() < dt * 0.6 && free(right, 30, 25)) target = right; // overtake on the right
      else if (left && Math.random() < dt * 0.25 && free(left, 60, 25)) target = left;                                       // keep left
      if (target) { ai.signal = lft(target) > lft(ai.lane) ? 1 : -1; ai.lane = target; if (ai.yieldT > 0) ai.yieldT = 0; }
    }
    const yb = ai.yieldSlow > 0 ? (ai.yieldSide > 0 ? -0.9 : 0.9) * ai.dir : 0; // squeeze over within the lane, away from the player
    ai.lat = lerp(ai.lat, ai.lane.lat + yb, 1 - Math.exp(-dt * 0.9));
    if (Math.abs(ai.lat - ai.lane.lat) < 0.2) ai.signal = 0;
    // ramp decisions: westbound Bayshore near the PA diverge
    if (road.id === 'bayshore' && ai.dir === -1 && !ai.decided) {
      const sDiv = this.net.sPAin ?? 0;
      if (ai.s < sDiv + 260 && ai.s > sDiv + 200) {
        ai.decided = true;
        const wantPA = !this.paClosed && !ai.police && MEET_POOL.includes(ai.car.id) && this.meetCount() < this.meetMax && Math.random() < 0.65;
        if (wantPA) { ai.toPA = true; ai.lane = road.lanes.filter(l => l.dir === -1).sort((x, y) => x.lat - y.lat)[0]; ai.signal = 1; }
      }
    }
    if (ai.toPA && road.id === 'bayshore' && ai.s <= (this.net.sPAin ?? 0)) { const r = this.net.byId.pa_in; this.transfer(ai, r, r.lanes[0], 0); ai.vDes = 11; ai.toPA = false; ai.toLot = true; }
    if (ai.toLot && road.id === 'pa_in' && ai.s >= road.length - 2) { this.enterLot(ai); return; }
    // other diverges along this road (JCT ramps, K5 → PA, …): taken by chance
    const dvs = this.net.diverges?.get(road);
    if (dvs && ai.mode === 'road') {
      const prev = ai.s - ai.v * dt * ai.dir;
      for (const d of dvs) {
        if (d.dir !== ai.dir || d.to.id === 'pa_in') continue;
        if (!(ai.dir > 0 ? prev < d.s && ai.s >= d.s : prev > d.s && ai.s <= d.s)) continue;
        if (!this.takeDiverge(ai, road, d)) continue;
        this.transfer(ai, d.to, d.to.lanes.find(l => l.dir === 1) || d.to.lanes[0], 0); return;
      }
    }
    // end of a ramp → continue on the road it merges into; map edge → recycle
    if (ai.s < 0 || ai.s > road.length) {
      const L = ai.dir === 1 ? this.net.links?.get(road) : null;
      // a road that ends exactly where the next one starts (K5 → Namamugi → K1 → Ishikawachō → K3 …) shows up as a
      // diverge at its very end rather than a link: carry on along one of those
      const cont = !L ? (dvs || []).filter(d => d.dir === ai.dir && (ai.dir === 1 ? d.s >= road.length - 60 : d.s <= 60) && d.to !== road) : []; // (dir −1: a two-way road's back lanes running into a road at its start, e.g. Bayshore → K3 at Honmoku)
      if (L && L.to !== road) { const lane = this.net.laneNear(L.to, L.dir, L.lat); this.transfer(ai, L.to, lane, L.s); ai.vDes = Math.max(ai.vDes, (L.to.speed / 3.6) * 0.9); }
      else if (cont.length) { const d = cont[Math.floor(Math.random() * cont.length)]; const h = this.net.hits(ai.pos.x, ai.pos.z).find(h => h.road === d.to); this.transfer(ai, d.to, d.to.lanes.find(l => l.dir === 1) || d.to.lanes[0], h ? Math.max(0, h.s) : 0); ai.vDes = Math.max(ai.vDes, (d.to.speed / 3.6) * 0.9); }
      else if (/^x_/.test(road.id) && this.toCity(ai)) {} // off the exit ramp onto the street it meets
      else this.recycle(ai);
      return;
    }
    road.at(ai.s, ai.lat, ai.pos);
    const t = road.dirAt(ai.s);
    const yaw = Math.atan2(t.x * ai.dir, t.z * ai.dir);
    let dy = yaw - ai.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    ai.steer = clamp(dy * 3, -0.5, 0.5);
    ai.yaw += dy * (1 - Math.exp(-dt * 10));
  }
  // move an AI onto another road keeping its lateral position (it then eases into the lane)
  transfer(ai, road, lane, s) {
    const lat0 = (() => { const h = this.net.hits(ai.pos.x, ai.pos.z).filter(h => h.road === road).sort((a, b) => Math.abs(a.y - ai.pos.y) - Math.abs(b.y - ai.pos.y))[0]; return h ? h.lat : lane.lat; })();
    const v = ai.v; this.placeOnRoad(ai, road, lane, s); ai.v = Math.max(v, 4); ai.lat = clamp(lat0, lane.lat - 4, lane.lat + 4);
  }
  takeDiverge(ai, road, d) {
    const id = d.to.id;
    if (ai.police || ai.toLot) return false;
    if (road.id === 'pa_in') return true;                       // through traffic on the JCT link continues onto K5 north
    if (id === 'k5_pa') { const want = !this.paClosed && MEET_POOL.includes(ai.car.id) && this.meetCount() < this.meetMax && Math.random() < 0.5; if (want) ai.toLot = true; return want; }
    if (/^futo_/.test(id)) return Math.random() < 0.08;
    if (/^x_/.test(id)) return Math.random() < 0.12; // exits to the city streets
    return Math.random() < 0.35;
  }
  recycle(ai) {
    if (this.spawnNear(ai)) return;
    const bay = this.net.byId.bayshore, k5 = this.net.byId.k5, k5n = this.net.byId.k5_nb || k5;
    const playerPos = this.g.focus;
    for (let tries = 0; tries < 6; tries++) {
      const q = Math.random(), road = q < 0.75 ? bay : q < 0.9 ? k5 : k5n;
      const lane = road.lanes[Math.floor(Math.random() * road.lanes.length)];
      const s = lane.dir === 1 ? Math.random() * 80 : road.length - Math.random() * 80;
      const p = road.at(s, lane.lat);
      if (p.distanceTo(playerPos) > 250) { ai.decided = false; ai.toPA = false; ai.toLot = false; this.placeOnRoad(ai, road, lane, s); return; }
    }
    ai.s = clamp(ai.s, 0, ai.road.length); ai.v = 0;
  }
  meetCount() { return this.cars.filter(c => c.mode === 'parked' || c.mode === 'path').filter(c => !c.police && !c.station && !c.plain).length; }

  // ───── PA lot driving (waypoints) ─────
  enterLot(ai) {
    const spots = this.world.parkingSpots.filter(s => !s.taken && s.size === (ai.car.mass > 5000 ? 'l' : 's'));
    if (!spots.length) { ai.path = this.lotPath(ai.pos, this.lotExit()); ai.mode = 'path'; ai.after = 'out'; return; }
    const spot = spots[Math.floor(Math.random() * spots.length)]; spot.taken = true; ai.spot = spot;
    ai.path = this.lotPath(ai.pos, spot.pos, spot); ai.mode = 'path'; ai.after = 'park'; ai.v = 6;
  }
  // PA exit point (start of the pa_out ramp)
  lotExit() { const r = this.net.byId.pa_out; return r ? r.at(0).setY(0) : PA.toWorld(PA_LAYOUT.exit[0], PA_LAYOUT.exit[1]); }
  // Lot waypoints, worked out in PA-local coordinates (see PA_LAYOUT): circulation bands along the long sides
  // (z = ±46.5), stall aisles parallel to local Z.
  lotPath(from, to, spot) {
    const L = PA_LAYOUT, band = L.bandZ[1], W = (x, z) => PA.toWorld(x, z);
    const [fx, fz] = PA.toLocal(from.x, from.z), [tx, tz] = PA.toLocal(to.x, to.z);
    const pts = [from.clone()];
    const cx = clamp(fx, -PA.hx + 6, PA.hx - 6);
    if (spot) {
      const ax = spot.aisle ?? tx;
      const bz = Math.abs(fz - L.bandZ[0]) < Math.abs(fz - L.bandZ[1]) ? L.bandZ[0] : L.bandZ[1];
      if (Math.abs(fx - ax) > 3) pts.push(W(Math.min(cx, PA.hx - 10), bz), W(ax, bz));
      pts.push(W(ax, tz), to.clone());
    } else {
      // leave: up the nearest aisle to the south-east band, then east to the exit
      const ax = [...L.carAisles, L.truck.aisle, L.meet.aisle].reduce((a, b) => Math.abs(b - fx) < Math.abs(a - fx) ? b : a);
      const inStall = Math.abs(ax - fx) < 10 && Math.abs(fz) < 40, x = inStall ? ax : cx;
      // v2.7.1: out of the stall into its aisle first, then along the aisle — the straight line to the band ran
      // across the next row of parked cars
      if (inStall && Math.abs(ax - fx) > 1.5) { const q = W(ax, clamp(fz, -38, 38)); q.r = 1.2; pts.push(q); } // v2.13.1: reach the aisle before turning (r = arrival radius)
      pts.push(W(x, band), W(L.endX[1], band), W(L.exit[0] - 6, L.exit[1] + 1), to.clone());
    }
    return pts;
  }
  drivePath(ai, dt, player) {
    const p = ai.path; if (!p || !p.length) { ai.mode = 'parked'; return; }
    const target = p[0];
    const dx = target.x - ai.pos.x, dz = target.z - ai.pos.z, d = Math.hypot(dx, dz);
    if (d < 2.2) { p.shift(); if (!p.length) return this.pathDone(ai); return; }
    // slow for player
    let vT = p.length === 1 ? Math.min(3, d * 0.6) : 6;
    if (player && player.pos.distanceTo(ai.pos) < 9) { const ahead = new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw)).dot(player.pos.clone().sub(ai.pos)); if (ahead > 0) vT = 0; }
    ai.braking = ai.v > vT + 0.5;
    ai.v = lerp(ai.v, vT, 1 - Math.exp(-dt * 1.5));
    if (ai.reverse) { // backing out of the stall
      const back = new THREE.Vector3(-Math.sin(ai.yaw), 0, -Math.cos(ai.yaw));
      ai.v = lerp(ai.v, 1.6, 1 - Math.exp(-dt * 2));
      ai.pos.addScaledVector(back, ai.v * dt); ai.braking = false; ai.reversing = true;
      const turn = Math.atan2(dx, dz) - Math.atan2(back.x, back.z);
      ai.yaw -= clamp(Math.sin(turn), -1, 1) * dt * 0.5;
      if (d < 2.5 || ai.t > 30) { ai.reverse = false; ai.reversing = false; p.shift(); }
      return;
    }
    const want = Math.atan2(dx, dz);
    let dy = want - ai.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    ai.yaw += clamp(dy, -1.2 * dt * Math.max(0.3, ai.v / 4), 1.2 * dt * Math.max(0.3, ai.v / 4));
    ai.steer = clamp(dy, -0.5, 0.5);
    ai.pos.x += Math.sin(ai.yaw) * ai.v * dt; ai.pos.z += Math.cos(ai.yaw) * ai.v * dt; ai.pos.y = 0;
  }
  pathDone(ai) {
    if (ai.after === 'park') { ai.mode = 'parked'; ai.v = 0; ai.pos.copy(ai.spot.pos); ai.yaw = ai.spot.yaw; ai.stay = 90 + Math.random() * 500; this.g.npc?.spawnMeetGroup(ai, true); this.g.audio?.sfx('door_open', { position: ai.pos }); }
    else if (ai.after === 'out') { const r = this.net.byId.pa_out; this.transfer(ai, r, r.lanes[0], 0); ai.vDes = 12; ai.v = 4; ai.toLot = false; }
  }
  parked(ai, dt) {
    ai.v = 0; ai.braking = false;
    if (ai.station) return;
    ai.stay -= dt * (this.paClosed ? 6 : 1);
    if (ai.stay <= 0 && !ai.leaving) {
      ai.leaving = true;
      const ready = () => { if (!this.cars.includes(ai)) return; ai.path = this.lotPath(ai.pos, this.lotExit()); // reverse out first
        const back = new THREE.Vector3(-Math.sin(ai.yaw), 0, -Math.cos(ai.yaw)).multiplyScalar(6).add(ai.pos);
        ai.path.splice(1, 0, back); ai.path.shift(); ai.reverse = true;
        ai.mode = 'path'; ai.after = 'out'; if (ai.spot) { ai.spot.taken = false; ai.spot = null; } ai.leaving = false; };
      if (this.g.npc && ai.driver) this.g.npc.recallDriver(ai, ready); else ready();
    }
  }
  // fill the expressways around the player too (not only at the far ends of the Bayshore Route)
  spawnNear(reuse = null) {
    const f = this.g.focus; if (!f) return false;
    // only roads that pass within reach of the player (the network is ~150 km of carriageway since v1.1)
    const roads = this.net.roads.filter(r => { if (r.kind === 'local' || r.kind === 'ramp' || !r.lanes?.length || r.length < 300) return false; const b = r._bb ||= r.samples.reduce((b, q) => [Math.min(b[0], q.p.x), Math.min(b[1], q.p.z), Math.max(b[2], q.p.x), Math.max(b[3], q.p.z)], [1e9, 1e9, -1e9, -1e9]); return f.x > b[0] - 900 && f.x < b[2] + 900 && f.z > b[1] - 900 && f.z < b[3] + 900; });
    for (let tries = 0; tries < 14; tries++) {
      const r = roads[Math.floor(Math.random() * roads.length)]; if (!r) return false;
      const s = 20 + Math.random() * (r.length - 40), p = r.at(s, 0, _pa), d = Math.hypot(p.x - f.x, p.z - f.z);
      if (d < 180 || d > 900) continue; // out of sight, but close enough to meet
      const lane = r.lanes[Math.floor(Math.random() * r.lanes.length)];
      if (this.cars.some(c => c.road === r && c.lane === lane && Math.abs(c.s - s) < 30)) continue;
      const ai = reuse || this.createAI(Math.random() < 0.1 ? MEET_POOL[Math.floor(Math.random() * MEET_POOL.length)] : TRAFFIC_POOL[Math.floor(Math.random() * TRAFFIC_POOL.length)]);
      ai.decided = false; ai.toPA = false; ai.toLot = false;
      this.placeOnRoad(ai, r, lane, s); return true;
    }
    return false;
  }
  manage() {
    this.preloadModels(); this.swapModels();
    // keep highway population
    const roadCars = this.cars.filter(c => c.mode === 'road' && !c.police).length;
    // traffic follows the clock: quiet before dawn, busiest in the morning and evening rush
    const dens = this.density(), maxNow = Math.round(this.max * dens);
    if (roadCars > maxNow + 4) { const f0 = this.g.focus; const far = this.cars.find(c => c.mode === 'road' && !c.police && !c.incident && !c.pursuit && c.pos.distanceTo(f0) > 500); if (far) this.remove(far); }
    if (roadCars < maxNow) {
      const q = Math.random(), bay = q < 0.8 ? this.net.byId.bayshore : (this.net.byId.k5 || this.net.byId.bayshore);
      const lane = bay.lanes[Math.floor(Math.random() * bay.lanes.length)];
      const s = lane.dir === 1 ? 0 : bay.length;
      const ai = this.createAI(Math.random() < 0.12 ? MEET_POOL[Math.floor(Math.random() * MEET_POOL.length)] : TRAFFIC_POOL[Math.floor(Math.random() * TRAFFIC_POOL.length)]);
      this.placeOnRoad(ai, bay, lane, s);
      this.spawnNear(); this.spawnNear();
    }
    // keep the traffic where the player is: cars far away along the 30 km of expressway are moved closer
    const f = this.g.focus; let moved = 0;
    for (const ai of this.cars) {
      if (moved >= 3) break;
      if (ai.mode !== 'road' || ai.police || ai.toLot || ai.toPA || ai.accident || ai.pursuit) continue;
      if (Math.hypot(ai.pos.x - f.x, ai.pos.z - f.z) < 2400) continue;
      if (this.spawnNear(ai)) moved++;
    }
    this.manageCity();
    // mark near cars for full-rate updates
    for (const ai of this.cars) ai.near = ai.pos.distanceToSquared(this.g.focus) < 120 * 120;
  }
  // ───── city streets (OpenStreetMap graph from js/game/city.js) ─────
  manageCity() {
    const net = this.world.city?.net; if (!net || !net.chains.size) return;
    const f = this.g.focus; const city = this.cars.filter(c => c.mode === 'city');
    // recycle far / orphaned cars to new spots near the player
    for (const ai of city) if (ai.c.dead || Math.hypot(ai.pos.x - f.x, ai.pos.z - f.z) > 650 || ai.stuck > 25) this.placeCity(ai, net, f);
    // cars only appear when the player is near the city streets
    const nearStreet = net.randomNear(f.x, f.z, 0, 400);
    if (!nearStreet) return;
    const cityMax = Math.round(this.cityMax * this.density());
    const fill = city.length < cityMax * 0.6;
    for (let k = city.length; k < cityMax && k < city.length + (fill ? 8 : 3); k++) {
      const ai = this.createAI(CITY_POOL[Math.floor(Math.random() * CITY_POOL.length)]);
      if (!this.placeCity(ai, net, f, fill ? 35 : 150)) { this.remove(ai); break; }
    }
  }
  // hand a car leaving an expressway exit over to the city-street traffic, on the street right at the ramp foot
  toCity(ai) {
    const net = this.world.city?.net; if (!net) return false;
    const x = ai.pos.x, z = ai.pos.z, hx = Math.sin(ai.yaw), hz = Math.cos(ai.yaw); let best = null;
    for (const c of net.chains.values()) { if (c.dead || c.cls > 4 || c.bb[0] > x + 40 || c.bb[2] < x - 40 || c.bb[1] > z + 40 || c.bb[3] < z - 40) continue;
      for (let i = 0; i < c.pts.length - 1; i++) { const a = c.pts[i], b = c.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2)); const d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); if (d < 30 && (!best || d < best.d)) best = { d, c, i, t, dot: (dx * hx + dz * hz) / Math.sqrt(L2) }; } }
    if (!best) return false;
    const { c, i, t } = best, dir = best.dot >= 0 ? 1 : -1, seg = Math.hypot(c.pts[i + 1][0] - c.pts[i][0], c.pts[i + 1][1] - c.pts[i][1]);
    ai.mode = 'city'; ai.road = null; ai.c = c; ai.i = i; ai.dir = dir; ai.d = t * seg; ai.stuck = 0; ai.next = null;
    ai.vDes = [16, 13.5, 12, 11, 8.5, 6][c.cls] * (0.85 + Math.random() * 0.25); ai.v = Math.min(ai.v, ai.vDes);
    this.cityPose(ai, true); return true;
  }
  placeCity(ai, net, f, rMin = 150) {
    const sp = net.randomNear(f.x, f.z, rMin, 480); if (!sp) { ai.mode = 'city'; ai.c = { dead: true }; return false; }
    ai.mode = 'city'; ai.road = null; ai.c = sp.c; ai.i = sp.i; ai.d = sp.d; ai.dir = sp.dir; ai.stuck = 0; ai.next = null;
    ai.vDes = [16, 13.5, 12, 11, 8.5, 6][sp.c.cls] * (0.85 + Math.random() * 0.25); ai.v = ai.vDes * 0.7;
    this.cityPose(ai, true); return true;
  }
  segOf(c, i) { const a = c.pts[i], b = c.pts[i + 1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.01; return { a, b, L, tx: (b[0] - a[0]) / L, tz: (b[1] - a[1]) / L }; }
  // pick the street to continue on at the vertex the car is driving into
  chooseNext(ai, net) {
    const c = ai.c, vi = ai.dir > 0 ? ai.i + 1 : ai.i; const k = c.keys[vi];
    const S0 = this.segOf(c, ai.i); const hx = S0.tx * ai.dir, hz = S0.tz * ai.dir;
    const opts = [];
    for (const [c2, i2] of net.nodes.get(k) || []) {
      if (c2.dead) continue;
      if (i2 < c2.pts.length - 1) { const S = this.segOf(c2, i2); if (!(c2 === c && i2 === ai.i && ai.dir === -1)) opts.push({ c: c2, i: i2, dir: 1, d: 0, dot: S.tx * hx + S.tz * hz }); }
      if (i2 > 0 && !c2.oneway) { const S = this.segOf(c2, i2 - 1); if (!(c2 === c && i2 - 1 === ai.i && ai.dir === 1)) opts.push({ c: c2, i: i2 - 1, dir: -1, d: S.L, dot: -S.tx * hx - S.tz * hz }); }
    }
    const ok = opts.filter(o => o.dot > -0.5 && o.c.cls < 5);
    if (!ok.length) return null;
    let sum = 0; for (const o of ok) { o.w = (o.dot > 0.85 ? 6 : o.dot > 0.2 ? 2 : 1) * (o.c.cls <= ai.c.cls ? 1.5 : 1); sum += o.w; }
    let r = Math.random() * sum; for (const o of ok) { r -= o.w; if (r <= 0) return o; } return ok[0];
  }
  cityPose(ai, snap) {
    const c = ai.c, S = this.segOf(c, ai.i);
    const lat = c.oneway ? (c.w > 7 ? c.w / 4 : 0) : Math.max(1.35, Math.min(c.w / 4, 3.4));
    const hx = S.tx * ai.dir, hz = S.tz * ai.dir;
    const x = S.a[0] + S.tx * ai.d + hz * lat, z = S.a[1] + S.tz * ai.d - hx * lat;
    ai.pos.set(x, 0, z);
    const yaw = Math.atan2(hx, hz);
    if (snap) ai.yaw = yaw; else { let dy = yaw - ai.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; ai.steer = clamp(dy * 2, -0.5, 0.5); ai.yaw += dy * (1 - Math.exp(-ai.dtLast * 8)); }
  }
  driveCity(ai, dt, player) {
    const net = this.world.city?.net; if (!net || ai.c.dead) return;
    ai.dtLast = dt;
    const S = this.segOf(ai.c, ai.i);
    const toV = ai.dir > 0 ? S.L - ai.d : ai.d;                       // distance to the vertex ahead
    if (!ai.next) ai.next = this.chooseNext(ai, net) || 'end';
    if (ai.yieldSlow > 0) ai.yieldSlow -= dt;
    let vMax = ai.yieldSlow > 0 ? ai.vDes * 0.55 : ai.vDes;
    if (ai.next !== 'end' && ai.next.dot < 0.85) vMax = Math.min(vMax, toV < 22 ? lerp(4.2, ai.vDes, clamp((toV - 4) / 18, 0, 1)) : vMax);
    if (ai.next === 'end') vMax = Math.min(vMax, Math.max(1, toV * 0.6));
    // gap to the nearest obstacle ahead: other city cars, the player, a red light
    let gap = 1e9, vLead = vMax;
    const hx = S.tx * ai.dir, hz = S.tz * ai.dir;
    for (const o of this.cars) {
      if (o === ai || o.mode !== 'city') continue;
      const dx = o.pos.x - ai.pos.x, dz = o.pos.z - ai.pos.z; const fwd = dx * hx + dz * hz; if (fwd <= 0 || fwd > 35) continue;
      const side = Math.abs(dx * hz - dz * hx); if (side > 1.8) continue;
      if (Math.sin(o.yaw) * hx + Math.cos(o.yaw) * hz < 0.2) continue;
      if (fwd < gap) { gap = fwd; vLead = o.v; }
    }
    if (player) { const dx = player.pos.x - ai.pos.x, dz = player.pos.z - ai.pos.z; const fwd = dx * hx + dz * hz; if (fwd > 0 && fwd < 45 && Math.abs(dx * hz - dz * hx) < 2.2 && Math.abs(player.pos.y - ai.pos.y) < 2) { if (fwd - 10 < gap) { gap = Math.max(0.5, fwd - 10); vLead = Math.max(0, player.vel.x * hx + player.vel.z * hz); } } }
    const k = ai.c.keys[ai.dir > 0 ? ai.i + 1 : ai.i];
    const light = net.light(k, hx, hz, this.world.city.uniforms.uTime.value);
    if (light !== 'go' && toV > 7) { const stop = toV - 7.5; if (light === 'stop' || stop > ai.v * 1.2) { if (stop < gap) { gap = Math.max(0.1, stop + ai.halfL * 2 + 4); vLead = 0; } } }
    // IDM (city: shorter headway)
    const a = 1.8, b = 2.6, s0 = 2.2 + ai.halfL, T = 1.1;
    const sStar = s0 + Math.max(0, ai.v * T + ai.v * (ai.v - vLead) / (2 * Math.sqrt(a * b)));
    let acc = a * (1 - Math.pow(ai.v / Math.max(0.5, vMax), 4) - Math.pow(sStar / Math.max(0.1, gap - ai.halfL * 2), 2));
    acc = clamp(acc, -7, a); ai.braking = acc < -0.8 || ai.v < 0.3;
    ai.v = Math.max(0, ai.v + acc * dt);
    ai.stuck = ai.v < 0.2 ? ai.stuck + dt : 0;
    // advance, crossing vertices
    let step = ai.v * dt;
    for (let guard = 0; guard < 4 && step > 0; guard++) {
      const Sg = this.segOf(ai.c, ai.i); const rem = ai.dir > 0 ? Sg.L - ai.d : ai.d;
      if (step < rem) { ai.d += step * ai.dir; step = 0; break; }
      step -= rem; ai.d = ai.dir > 0 ? Sg.L : 0;
      const n = ai.next && ai.next !== 'end' ? ai.next : null;
      if (!n) { // dead end: turn around if two-way, else wait to be recycled
        if (!ai.c.oneway) { ai.dir = -ai.dir; ai.v = 0; } else { ai.v = 0; ai.stuck = 99; }
        ai.next = null; break;
      }
      ai.c = n.c; ai.i = n.i; ai.dir = n.dir; ai.d = n.d; ai.next = null;
      ai.signal = 0;
    }
    if (ai.next && ai.next !== 'end') { const turn = Math.sign((ai.next.c.pts[ai.next.dir > 0 ? ai.next.i + 1 : ai.next.i][0] - ai.pos.x) * hz - (ai.next.c.pts[ai.next.dir > 0 ? ai.next.i + 1 : ai.next.i][1] - ai.pos.z) * hx); ai.signal = toV < 30 && ai.next.dot < 0.6 ? (turn > 0 ? 1 : -1) : 0; }
    this.cityPose(ai, false);
  }

  // collisions with the player (circle approximations)
  collidePlayer(v) {
    if (!v) return;
    const pr = v.car.W / 2000, pL = v.car.L / 2000, f = v.forward;
    for (const ai of this.cars) {
      if (!ai.model.root.visible) continue;
      const dx = ai.pos.x - v.pos.x, dz = ai.pos.z - v.pos.z;
      if (dx * dx + dz * dz > 100 || Math.abs(ai.pos.y - v.pos.y) > 2) continue;
      const af = new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw));
      for (const o1 of [-pL + pr, 0, pL - pr]) for (const o2 of [-ai.halfL + ai.radius, 0, ai.halfL - ai.radius]) {
        const px = v.pos.x + f.x * o1, pz = v.pos.z + f.z * o1, qx = ai.pos.x + af.x * o2, qz = ai.pos.z + af.z * o2;
        const ex = px - qx, ez = pz - qz, d = Math.hypot(ex, ez), min = pr + ai.radius;
        if (d < min && d > 1e-4) {
          const nx = ex / d, nz = ez / d, pen = min - d;
          const heavy = ai.car.mass / (ai.car.mass + v.m);
          v.pos.x += nx * pen * heavy; v.pos.z += nz * pen * heavy;
          if (ai.mode === 'road' || ai.mode === 'city') ai.v *= 0.7; else { ai.pos.x -= nx * pen * (1 - heavy); ai.pos.z -= nz * pen * (1 - heavy); }
          const rel = (v.vel.x - af.x * ai.v) * nx + (v.vel.z - af.z * ai.v) * nz;
          if (rel < 0) { v.vel.x -= nx * rel * 1.2; v.vel.z -= nz * rel * 1.2; v.vx = v.vel.dot(v.forward); v.vlat = v.vel.dot(v.left); if (rel < -2) { v.events.push('crash'); const hit = { x: (px + qx) / 2, z: (pz + qz) / 2, y: v.pos.y + 0.6, vin: -rel, t: performance.now() }; v.lastHit = hit; this.g.fx?.damage(ai.model, hit, -rel, true); } ai.hitBy = this.t; }
        }
      }
    }
  }
}
