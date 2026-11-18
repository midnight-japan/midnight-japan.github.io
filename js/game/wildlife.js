// Wildlife (v2.13.7): the animals you actually meet on a Japanese drive.
//  · ドバト pigeons — little flocks pecking on city pavements; they burst up and fly off when a car or you come close
//  · カラス crows — a few circle over the city by day and caw now and then
//  · シカ sika deer — on the Hakone mountain roads, mostly at dusk / night, a deer stands at the roadside grazing,
//    lifts its head as you approach and bounds off into the trees (slow down on the touge!)
// Everything is a handful of shared meshes around the camera: no cost elsewhere. Shapes are rounded (spheres,
// capsules, tapered cylinders), never boxes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { inHakone } from './hakone.js';

const TAU = Math.PI * 2;
const ell = (rx, ry, rz, x, y, z, seg = 8) => new THREE.SphereGeometry(1, seg, Math.max(4, seg - 2)).scale(rx, ry, rz).translate(x, y, z);
const tube = (r0, r1, len, x, y, z, rx = 0, rz = 0) => { const g = new THREE.CylinderGeometry(r1, r0, len, 6, 1); g.translate(0, -len / 2, 0); g.rotateX(rx); g.rotateZ(rz); return g.translate(x, y, z); };
const strip = g => { for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); return g; };

let GEO = null;
function geos() {
  if (GEO) return GEO;
  // pigeon (≈ 32 cm) — body, head, tail; wings are separate (flap)
  const pBody = mergeGeometries([ell(0.07, 0.065, 0.13, 0, 0.12, 0), ell(0.042, 0.042, 0.045, 0, 0.2, 0.1), tube(0.012, 0.004, 0.03, 0, 0.2, 0.15, Math.PI / 2), ell(0.05, 0.012, 0.09, 0, 0.12, -0.15)].map(strip));
  const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.07, 0.3, 0, 0.0, 0.26, 0, -0.08, 0, 0, -0.07], 3)); wing.setIndex([0, 1, 2, 0, 2, 3]); wing.computeVertexNormals();
  // crow: bigger, black, longer wings
  const cBody = mergeGeometries([ell(0.08, 0.075, 0.2, 0, 0, 0), ell(0.055, 0.055, 0.06, 0, 0.03, 0.2), tube(0.022, 0.004, 0.07, 0, 0.03, 0.25, Math.PI / 2), ell(0.07, 0.012, 0.14, 0, 0, -0.26)].map(strip));
  const cWing = wing.clone().scale(1.9, 1, 1.6);
  // sika deer (shoulder ≈ 0.9 m): body + neck + head + ears + white rump; legs separate (gait)
  const dBody = mergeGeometries([ell(0.22, 0.26, 0.55, 0, 0.98, 0, 10), tube(0.1, 0.07, 0.45, 0, 1.12, 0.42, -0.75), ell(0.08, 0.09, 0.17, 0, 1.43, 0.72, 8), ell(0.03, 0.06, 0.015, 0.07, 1.53, 0.64, 6), ell(0.03, 0.06, 0.015, -0.07, 1.53, 0.64, 6)].map(strip));
  const dRump = strip(ell(0.16, 0.16, 0.06, 0, 1.0, -0.53, 8));
  const dLeg = strip(tube(0.045, 0.022, 0.86, 0, 0, 0));
  GEO = { pBody, wing, cBody, cWing, dBody, dRump, dLeg };
  return GEO;
}

export class Wildlife {
  constructor(game) {
    this.g = game; const G = geos();
    const hi = game.quality !== 'low';
    this.NP = hi ? 24 : 12; this.NC = hi ? 6 : 3;
    const pm = new THREE.MeshStandardMaterial({ color: 0x8c9098, roughness: 0.8 }), wm = new THREE.MeshStandardMaterial({ color: 0x7a7f88, roughness: 0.8, side: THREE.DoubleSide });
    const cm = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.55, metalness: 0.1 }), cwm = new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.6, side: THREE.DoubleSide });
    const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.count = 0; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); game.scene.add(m); return m; };
    this.pB = mk(G.pBody, pm, this.NP); this.pWL = mk(G.wing, wm, this.NP); this.pWR = mk(G.wing, wm, this.NP);
    this.cB = mk(G.cBody, cm, this.NC); this.cWL = mk(G.cWing, cwm, this.NC); this.cWR = mk(G.cWing, cwm, this.NC);
    this.pig = []; this.crows = []; this.deer = null; this.t = 0; this.flockT = 0; this.deerT = 8;
    this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(0, 0, 0, 'YXZ'); this.S1 = new THREE.Vector3(1, 1, 1); this.S2 = new THREE.Vector3(-1, 1, 1); this.S0 = new THREE.Vector3(0.001, 0.001, 0.001); this.P = new THREE.Vector3();
  }
  // ── pigeons ──
  spawnFlock(f) {
    const N = this.g.world.city?.net; if (!N) return;
    const sp = N.randomNear(f.x, f.z, 25, 90); if (!sp || sp.c.cls > 4) return;
    const a = sp.c.pts[sp.i], b = sp.c.pts[sp.i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, side = Math.random() < 0.5 ? 1 : -1;
    const off = sp.c.w / 2 + (sp.c.cls <= 3 ? 1.6 : 0.8), cx = a[0] + tx * sp.d + tz * off * side, cz = a[1] + tz * sp.d - tx * off * side;
    const n = 4 + Math.floor(Math.random() * 5);
    for (let k = 0; k < n && this.pig.length < this.NP; k++) this.pig.push({ x: cx + (Math.random() - 0.5) * 2.5, y: 0.05, z: cz + (Math.random() - 0.5) * 2.5, yaw: Math.random() * TAU, st: 'peck', t: Math.random() * 3, vx: 0, vy: 0, vz: 0, ph: Math.random() * TAU });
  }
  update(dt, f, night) {
    this.t += dt; const g = this.g, inH = inHakone(f.x, f.z), city = !inH && g.world.isLand(f.x, f.z) && f.y < 12;
    const v = g.vehicle, drive = g.mode === 'drive' && v, pl = g.player?.pos, M = this.M, Q = this.Q, E = this.E, P = this.P;
    // pigeons: a flock every few seconds near you by day in the city; they leave when far
    this.flockT -= dt;
    if (city && night < 0.5 && this.flockT <= 0) { this.flockT = 3; if (this.pig.length < this.NP - 4) this.spawnFlock(f); }
    for (const p of this.pig) { if (Math.hypot(p.x - f.x, p.z - f.z) > 160 || p.y > 40) p.dead = true; }
    this.pig = this.pig.filter(p => !p.dead);
    let i = 0;
    for (const p of this.pig) {
      p.t += dt;
      if (p.st === 'peck') {
        // threat: a car moving close by or you walking up
        let thr = null; if (drive && Math.abs(v.kmh) > 4 && Math.hypot(v.pos.x - p.x, v.pos.z - p.z) < 9) thr = v.pos; if (pl && g.mode === 'walk' && Math.hypot(pl.x - p.x, pl.z - p.z) < 3) thr = pl;
        if (thr) { const dx = p.x - thr.x, dz = p.z - thr.z, d = Math.hypot(dx, dz) || 1; p.st = 'fly'; p.vx = dx / d * 5 + (Math.random() - 0.5) * 2; p.vz = dz / d * 5 + (Math.random() - 0.5) * 2; p.vy = 3.5 + Math.random() * 1.5; p.yaw = Math.atan2(p.vx, p.vz); g.audio?.sfx?.('wings'); }
        else if (p.t > 1.5 + (p.ph % 1) * 2) { p.t = 0; p.yaw += (Math.random() - 0.5) * 1.6; } // shuffle about
        else if (p.t < 0.4) { p.x += Math.sin(p.yaw) * dt * 0.35; p.z += Math.cos(p.yaw) * dt * 0.35; }
      } else { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy = Math.max(1.2, p.vy - dt * 0.8); }
      const peck = p.st === 'peck' ? Math.max(0, Math.sin(this.t * 7 + p.ph)) * 0.35 : -0.1;
      E.set(peck, p.yaw, 0); Q.setFromEuler(E); P.set(p.x, p.y, p.z); M.compose(P, Q, this.S1); this.pB.setMatrixAt(i, M);
      const fly = p.st === 'fly', flap = fly ? Math.sin(this.t * 26 + p.ph) * 0.9 : 0; // on the ground the wings are folded into the body
      E.set(peck, p.yaw, flap); Q.setFromEuler(E); P.set(p.x, p.y + 0.15, p.z); M.compose(P, Q, fly ? this.S1 : this.S0); this.pWL.setMatrixAt(i, M);
      E.set(peck, p.yaw, -flap); Q.setFromEuler(E); M.compose(P, Q, fly ? this.S2 : this.S0); this.pWR.setMatrixAt(i, M);
      i++;
    }
    for (const m of [this.pB, this.pWL, this.pWR]) { m.count = i; m.instanceMatrix.needsUpdate = true; }
    // crows: circling high over the city by day
    const wantC = city && night < 0.6 ? this.NC : 0;
    while (this.crows.length < wantC) this.crows.push({ cx: f.x + (Math.random() - 0.5) * 200, cz: f.z + (Math.random() - 0.5) * 200, r: 20 + Math.random() * 40, h: 25 + Math.random() * 30, a: Math.random() * TAU, w: (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.15), ph: Math.random() * TAU, caw: 5 + Math.random() * 20 });
    if (this.crows.length > wantC) this.crows.length = wantC;
    i = 0;
    for (const c of this.crows) {
      if (Math.hypot(c.cx - f.x, c.cz - f.z) > 260) { c.cx = f.x + (Math.random() - 0.5) * 200; c.cz = f.z + (Math.random() - 0.5) * 200; }
      c.a += c.w * dt; const x = c.cx + Math.cos(c.a) * c.r, z = c.cz + Math.sin(c.a) * c.r, yaw = Math.atan2(-Math.sin(c.a) * c.w, Math.cos(c.a) * c.w);
      c.caw -= dt; if (c.caw <= 0) { c.caw = 8 + Math.random() * 25; if (Math.hypot(x - f.x, z - f.z) < 120) g.audio?.sfx?.('crow'); }
      const glide = Math.sin(this.t * 0.7 + c.ph) > 0.2, flap = glide ? 0.12 : Math.sin(this.t * 9 + c.ph) * 0.6, bank = -c.w * 1.5;
      E.set(0, yaw, bank); Q.setFromEuler(E); P.set(x, c.h, z); M.compose(P, Q, this.S1); this.cB.setMatrixAt(i, M);
      E.set(0, yaw, bank + flap); Q.setFromEuler(E); M.compose(P, Q, this.S1); this.cWL.setMatrixAt(i, M);
      E.set(0, yaw, bank - flap); Q.setFromEuler(E); M.compose(P, Q, this.S2); this.cWR.setMatrixAt(i, M);
      i++;
    }
    for (const m of [this.cB, this.cWL, this.cWR]) { m.count = i; m.instanceMatrix.needsUpdate = true; }
    this.updateDeer(dt, f, night, inH);
  }
  // ── sika deer on the Hakone roads ──
  buildDeer() {
    const G = geos(), grp = new THREE.Group();
    const fur = new THREE.MeshStandardMaterial({ color: 0x7a5636, roughness: 0.9 }), white = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.9 });
    grp.add(new THREE.Mesh(G.dBody, fur), new THREE.Mesh(G.dRump, white));
    const legs = [[0.12, 0.42], [-0.12, 0.42], [0.12, -0.4], [-0.12, -0.4]].map(([x, z]) => { const l = new THREE.Mesh(G.dLeg, fur); l.position.set(x, 0.88, z); grp.add(l); return l; });
    grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
    // eye shine in the headlights (the classic night sighting)
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x9fffd0 }); const eyes = new THREE.Group();
    for (const x of [0.055, -0.055]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 4), eyeM); e.position.set(x, 1.47, 0.8); eyes.add(e); }
    grp.add(eyes);
    this.g.scene.add(grp); return { grp, legs, eyes };
  }
  updateDeer(dt, f, night, inH) {
    const g = this.g, v = g.vehicle; this.deerT -= dt;
    if (!this.deer && inH && this.deerT <= 0 && g.mode === 'drive' && v?.road?.kind === 'mountain') {
      this.deerT = (night > 0.4 ? 40 : 110) + Math.random() * 60; // dusk / night: far more likely
      const r = v.road, h = v.surface?.hit; if (!h) return;
      const t0 = r.dirAt(h.s), dir = (t0.x * Math.sin(v.yaw) + t0.z * Math.cos(v.yaw)) >= 0 ? 1 : -1, s = h.s + dir * (160 + Math.random() * 80);
      if (s < 10 || s > r.length - 10) return;
      const lanes = r.lanes.map(l => l.lat), edge = Math.max(...lanes.map(Math.abs)) + 2.6, side = Math.random() < 0.5 ? 1 : -1;
      const p = r.at(s, side * edge), q = r.at(s, side * (edge + 8)), ax = q.x - p.x, az = q.z - p.z, al = Math.hypot(ax, az) || 1;
      if (!this.deerObj) this.deerObj = this.buildDeer();
      const y = g.world.ground(p.x, p.z); const py = Number.isFinite(y) && Math.abs(y - p.y) < 3 ? y : p.y;
      this.deer = { x: p.x, y: py, z: p.z, yaw: Math.atan2(-az, -ax) + (Math.random() - 0.5), away: [ax / al, az / al], st: 'graze', t: 0, run: 0 };
      this.deerObj.grp.visible = true;
    }
    const d = this.deer; if (!d) { if (this.deerObj) this.deerObj.grp.visible = false; return; }
    const O = this.deerObj, dist = v ? Math.hypot(v.pos.x - d.x, v.pos.z - d.z) : 999;
    d.t += dt;
    if (d.st === 'graze' && dist < 70) { d.st = 'alert'; d.t = 0; d.yaw = Math.atan2(v.pos.x - d.x, v.pos.z - d.z); }
    if (d.st === 'alert' && (dist < 32 || d.t > 3.5)) { d.st = 'run'; d.t = 0; d.yaw = Math.atan2(d.away[0], d.away[1]); }
    let head = 0, gait = 0;
    if (d.st === 'graze') head = 0.9 + Math.sin(d.t * 1.3) * 0.15;
    if (d.st === 'run') { d.run = Math.min(9, d.run + dt * 12); d.x += Math.sin(d.yaw) * d.run * dt; d.z += Math.cos(d.yaw) * d.run * dt; gait = d.t * 11; const y = g.world.ground(d.x, d.z); if (Number.isFinite(y) && Math.abs(y - d.y) < 4) d.y += (y - d.y) * Math.min(1, dt * 6); }
    O.grp.position.set(d.x, d.y + (d.st === 'run' ? Math.abs(Math.sin(gait)) * 0.25 : 0), d.z); O.grp.rotation.set(head * 0.25, d.yaw, 0, 'YXZ');
    O.legs.forEach((l, k) => { l.rotation.x = d.st === 'run' ? Math.sin(gait + (k < 2 ? 0 : Math.PI) + (k % 2) * 0.4) * 0.7 : 0; });
    O.eyes.visible = (g.tod?.night ?? 0) > 0.4 && d.st !== 'run';
    if (dist > 400 || (d.st === 'run' && d.t > 4)) { this.deer = null; O.grp.visible = false; }
  }
}
