// Commuter trains on the real railway lines streamed in with the city (js/game/city.js RailNet).
// Liveries in the style of the lines around the bay (stainless with a coloured band, all-red private line, …),
// lit windows at night, doors, pantographs; trains slow down and stop at stations, then run on across tiles.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const CAR_L = 20, GAP = 0.6;
const LIVERY = [
  { body: 0xc9ced3, band: 0x2aa8e0, stripe: 0x2aa8e0, metal: 0.75 },   // stainless + sky blue
  { body: 0xc9ced3, band: 0x1a9b4b, stripe: 0xf0a020, metal: 0.75 },   // stainless + green/orange
  { body: 0xc9ced3, band: 0xd8262e, stripe: 0xd8262e, metal: 0.75 },   // stainless + red
  { body: 0xc01e2b, band: 0xf2f2ee, stripe: 0xf2f2ee, metal: 0.25 },   // all-red with white band
  { body: 0xf1f1ec, band: 0x0b5fb0, stripe: 0x7bc4ff, metal: 0.2 },    // white + blue
];

function carGeometry() {
  // v2.13.10: the body has real window openings (lower panel, roof rail, pillars, end walls) so you see the lit
  // interior and the passengers through the glass; chamfered roof
  const L = CAR_L - 0.4, W = 2.86, parts = [];
  const bx = (w, h, d, x, y, z) => parts.push(new THREE.BoxGeometry(w, h, d).translate(x, y, z));
  bx(W, 1.05, L, 0, 1.525, 0);            // below the windows
  bx(W, 0.7, L, 0, 3.4, 0);               // above the windows
  for (const z of [-L / 2 + 0.15, L / 2 - 0.15]) bx(W, 1.0, 0.3, 0, 2.55, z); // end walls
  for (const z of [-8.8, -4.4, 0, 4.4, 8.8]) bx(W, 1.0, 0.5, 0, 2.55, z);     // window pillars between the doors
  const g = mergeGeometries(parts.map(q => q.toNonIndexed()));
  const roof = new THREE.CylinderGeometry(1.43, 1.43, L, 12, 1, false, -Math.PI / 2, Math.PI); roof.rotateX(Math.PI / 2); roof.scale(1, 0.22, 1); roof.translate(0, 3.75, 0);
  const under = new THREE.BoxGeometry(2.5, 0.7, CAR_L - 3); under.translate(0, 0.75, 0);
  return { body: g, roof, under };
}
// interior (floor, long bench seats along both sides as on Japanese commuter trains, grab-rail bar, lit ceiling) and
// passengers — seated and standing figures — merged into one vertex-coloured mesh; three loads (quiet / normal / rush)
function interiorGeometry(load, seed) {
  let r = seed; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const parts = [], col = (geo, c) => { const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'color'].includes(k)) geo.deleteAttribute(k); parts.push(geo.index ? geo.toNonIndexed() : geo); };
  const L = CAR_L - 1;
  col(new THREE.BoxGeometry(2.7, 0.05, L).translate(0, 1.08, 0), [0.32, 0.3, 0.28]);                    // floor
  for (const s of [-1, 1]) for (const z0 of [-8.6, -4.0, 0.6, 5.2]) { col(new THREE.BoxGeometry(0.5, 0.42, 3.4).translate(s * 1.12, 1.32, z0 + 1.7), [0.2, 0.32, 0.62]); col(new THREE.BoxGeometry(0.12, 0.5, 3.4).translate(s * 1.36, 1.72, z0 + 1.7), [0.2, 0.32, 0.62]); } // blue moquette benches
  for (const s of [-1, 1]) col(new THREE.CylinderGeometry(0.02, 0.02, L, 5).rotateX(Math.PI / 2).translate(s * 0.75, 3.05, 0), [0.75, 0.76, 0.78]); // grab rails
  col(new THREE.BoxGeometry(0.5, 0.03, L).translate(0, 3.32, 0), [1.6, 1.6, 1.5]);                     // ceiling light strip (bright → reads as lit)
  const CL = [[0.12, 0.12, 0.14], [0.2, 0.22, 0.3], [0.85, 0.85, 0.82], [0.35, 0.3, 0.26], [0.5, 0.15, 0.15], [0.18, 0.28, 0.2], [0.6, 0.55, 0.48]], SK = [[0.93, 0.78, 0.66], [0.85, 0.68, 0.55]], HR = [[0.06, 0.05, 0.05], [0.2, 0.14, 0.1]];
  const person = (x, z, seated) => { const c = CL[Math.floor(rnd() * CL.length)], y0 = seated ? 1.55 : 1.1;
    col(new THREE.CapsuleGeometry(0.19, seated ? 0.32 : 0.95, 2, 6).translate(x, y0 + (seated ? 0.35 : 0.67), z), c);
    col(new THREE.SphereGeometry(0.13, 7, 5).translate(x, y0 + (seated ? 0.83 : 1.48), z), SK[Math.floor(rnd() * 2)]);
    col(new THREE.SphereGeometry(0.135, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2).translate(x, y0 + (seated ? 0.86 : 1.51), z), HR[Math.floor(rnd() * 2)]); };
  const seatP = [0.25, 0.6, 0.95][load], standN = [0, 4, 14][load];
  for (const s of [-1, 1]) for (const z0 of [-8.6, -4.0, 0.6, 5.2]) for (let k = 0; k < 7; k++) if (rnd() < seatP) person(s * 1.05, z0 + 0.25 + k * 0.48, true);
  for (let k = 0; k < standN; k++) person((rnd() - 0.5) * 1.2, (rnd() - 0.5) * (L - 2), false);
  return mergeGeometries(parts);
}

export class Trains {
  constructor(game) {
    this.g = game; this.list = []; this.t = 0; this.manageT = 0;
    this.max = { low: 2, medium: 4, high: 6, ultra: 8 }[game.quality] ?? 4;
    const G = carGeometry(); this.G = G;
    this.bogie = new THREE.BoxGeometry(2.3, 0.6, 2.6); this.bogie.translate(0, 0.45, 0);
    this.pantoGeo = new THREE.BoxGeometry(1.6, 0.06, 0.08);
    this.winMat = new THREE.MeshStandardMaterial({ color: 0x26323c, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.32, depthWrite: false }); // see-through glass
    this.inGeo = [0, 1, 2].map(l => [11, 23].map(sd => interiorGeometry(l, sd + l * 7)));
    this.inMat = new THREE.MeshBasicMaterial({ vertexColors: true }); // fluorescent-lit cabin: unlit colours, dimmer than daylight outside, bright at night
    this.darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.7, metalness: 0.4 });
    this.roofMat = new THREE.MeshStandardMaterial({ color: 0x8d9197, roughness: 0.6, metalness: 0.5 });
    this.mats = LIVERY.map(L => ({ body: new THREE.MeshStandardMaterial({ color: L.body, roughness: 0.32, metalness: L.metal }), band: new THREE.MeshStandardMaterial({ color: L.band, roughness: 0.4, metalness: 0.2 }) }));
    this.headMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 }); this.tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    // windows + band as thin boxes on both sides
    this.winGeo = mergeGeometries([-1, 1].map(sd => new THREE.PlaneGeometry(CAR_L - 0.6, 1.0).rotateY(sd * Math.PI / 2).translate(sd * 1.44, 2.55, 0)));
    this.bandGeo = new THREE.BoxGeometry(2.9, 0.32, CAR_L - 0.5); this.bandGeo.translate(0, 1.75, 0);
    this.doorGeo = mergeGeometries([-1, 1].map(sd => new THREE.BoxGeometry(0.05, 1.95, 1.3).translate(sd * 1.45, 0, 0))); // thin door leaves on each side (the old full-width block cut through the cabin)
    this.lampGeo = new THREE.BoxGeometry(0.4, 0.22, 0.05);
  }
  rail() { return this.g.world.city?.rail; }
  makeTrain(n) {
    const liv = this.mats[Math.floor(Math.random() * this.mats.length)];
    const cars = [];
    for (let k = 0; k < n; k++) {
      const root = new THREE.Group();
      const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = k < 2; m.receiveShadow = false; root.add(m); return m; };
      add(this.G.body, liv.body); add(this.G.roof, this.roofMat); add(this.G.under, this.darkMat);
      { const h = this.g.tod?.hours ?? 12, rush = (h > 7 && h < 9.5) || (h > 17 && h < 20), late = h > 23 || h < 5.5; const load = late ? 0 : rush ? 2 : Math.random() < 0.5 ? 1 : 0;
        const im = add(this.inGeo[load][Math.floor(Math.random() * 2)], this.inMat); im.castShadow = false; }
      { const w = add(this.winGeo, this.winMat); w.castShadow = false; w.renderOrder = 2; } add(this.bandGeo, liv.band);
      for (const dz of [-6.6, -2.2, 2.2, 6.6]) add(this.doorGeo, liv.body, 0, 2.05, dz);
      for (const dz of [-CAR_L / 2 + 2.5, CAR_L / 2 - 2.5]) add(this.bogie, this.darkMat, 0, 0, dz);
      if (k % 2 === 1) { const p = add(this.pantoGeo, this.darkMat, 0, 4.35, 4); p.rotation.z = 0; }
      if (k === 0) { for (const x of [-0.9, 0.9]) { add(this.lampGeo, this.headMat, x, 1.4, CAR_L / 2 - 0.18); } }
      if (k === n - 1) { for (const x of [-0.9, 0.9]) { add(this.lampGeo, this.tailMat, x, 1.4, -CAR_L / 2 + 0.18); } }
      this.g.scene.add(root); cars.push(root);
    }
    return cars;
  }
  spawn(f) {
    const R = this.rail(); if (!R || !R.chains.size) return false;
    const cand = [...R.chains.values()].filter(c => c.cls === 0 && c.len > 60);
    for (let tries = 0; tries < 10 && cand.length; tries++) {
      const c = cand[Math.floor(Math.random() * cand.length)], s = Math.random() * c.len, p = R.at(c, s);
      const d = Math.hypot(p.x - f.x, p.z - f.z); if (d < 250 || d > 1400) continue;
      if (this.list.some(tr => tr.c === c)) continue;
      const n = 4 + 2 * Math.floor(Math.random() * 4); // 4–10 cars
      const tr = { c, s, dir: Math.random() < 0.5 ? 1 : -1, v: 18, vMax: 19 + Math.random() * 6, hist: [], n, cars: this.makeTrain(n), stop: 0, lastSt: null };
      // pre-fill the history behind the head so the whole consist appears on the track
      for (let b = (n * (CAR_L + GAP)) + 10; b >= 0; b -= 2) { const q = R.at(c, s - b * tr.dir); tr.hist.push([q.x, c.deck, q.z]); }
      this.list.push(tr); return true;
    }
    return false;
  }
  remove(tr) { for (const m of tr.cars) this.g.scene.remove(m); this.list.splice(this.list.indexOf(tr), 1); }
  update(dt, f, night) {
    const R = this.rail(); this.inMat.color.setScalar(0.5 + night * 0.45);
    this.manageT -= dt;
    if (this.manageT <= 0) {
      this.manageT = 2;
      for (const tr of this.list.slice()) { const h = tr.hist[tr.hist.length - 1]; if (!R || tr.c.dead || Math.hypot(h[0] - f.x, h[2] - f.z) > 1900 || (tr.stop > 1e8 && Math.hypot(h[0] - f.x, h[2] - f.z) > 300)) this.remove(tr); }
      if (R && this.list.length < this.max) this.spawn(f);
    }
    if (!R) return;
    for (const tr of this.list.slice()) {
      // station stops: brake for the nearest station ahead within 160 m, wait, then go
      const head = tr.hist[tr.hist.length - 1];
      let target = tr.vMax;
      if (tr.stop > 0) { tr.stop -= dt; target = 0; if (tr.stop <= 0) tr.leave = 6; }
      else if (!(tr.leave > 0)) {
        for (const st of R.stations) { const dx = st[0] - head[0], dz = st[1] - head[2], d = Math.hypot(dx, dz); if (d > 170 || st === tr.lastSt) continue; const hd = R.at(tr.c, tr.s); const fwd = (dx * hd.dx + dz * hd.dz) * tr.dir; if (fwd < -5 || Math.abs(dx * hd.dz - dz * hd.dx) > 14) continue; /* ahead, and on this line (not a parallel one) */ target = Math.min(target, Math.max(0, Math.sqrt(Math.max(0, 2 * 0.9 * Math.max(0, d - 8))))); if (d < 10) { tr.stop = 18 + Math.random() * 10; tr.lastSt = st; } }
      }
      if (tr.leave > 0) tr.leave -= dt;
      tr.v += Math.max(-1.2, Math.min(0.8, target - tr.v)) * dt;
      tr.v = Math.max(0, tr.v);
      let step = tr.v * dt;
      while (step > 0) {
        const rem = tr.dir > 0 ? tr.c.len - tr.s : tr.s;
        if (step < rem) { tr.s += step * tr.dir; step = 0; break; }
        step -= rem; tr.s = tr.dir > 0 ? tr.c.len : 0;
        const nx = R.next(tr.c, tr.dir > 0);
        if (!nx) { tr.v = 0; tr.stop = 1e9; break; } // end of the loaded line (terminus / edge of the streamed area): wait there until recycled
        tr.c = nx.c; tr.dir = nx.dir; tr.s = nx.s;
      }
      const p = R.at(tr.c, tr.s);
      const last = tr.hist[tr.hist.length - 1];
      if (Math.hypot(p.x - last[0], p.z - last[2]) > 1.5) { tr.hist.push([p.x, tr.c.deck, p.z]); if (tr.hist.length > 400) tr.hist.splice(0, tr.hist.length - 400); }
      // place cars along the history polyline (head = newest point)
      const pts = tr.hist.concat([[p.x, tr.c.deck, p.z]]);
      const atBack = d => { let acc = 0; for (let i = pts.length - 1; i > 0; i--) { const a = pts[i], b = pts[i - 1]; const L = Math.hypot(a[0] - b[0], a[2] - b[2]); if (acc + L >= d) { const t = (d - acc) / (L || 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; } acc += L; } return pts[0]; };
      tr.cars.forEach((m, k) => {
        const d0 = k * (CAR_L + GAP) + 1, d1 = d0 + CAR_L - 2;
        const A = atBack(d0), B = atBack(d1);
        m.position.set((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 0.35, (A[2] + B[2]) / 2);
        m.rotation.y = Math.atan2(A[0] - B[0], A[2] - B[2]);
      });
      // passing-train sound when close
      const dP = Math.hypot(p.x - f.x, p.z - f.z);
      if (dP < 140 && tr.v > 5 && !(tr.heard > 0)) { tr.heard = 20; if (this.g.audio?.amb) this.g.audio._train(); }
      if (tr.heard > 0) tr.heard -= dt;
    }
  }
}
