// Haneda Airport traffic: airliners parked at the real stands (data/city/airport.json from OpenStreetMap) and a
// steady flow of landings and take-offs on the real runways — 3° approaches over the bay with landing lights,
// strobes and beacons at night, and the roar when they pass overhead. Liveries are fictional.
import * as THREE from 'three';
import { glowTexture } from './textures.js';

const TAIL = [0x0b3a8c, 0xc8102e, 0x00968f, 0x1b1b1b, 0xe8a300, 0x5b2d8e];
const HANEDA = { x: 9600, z: -9600 };

function airliner(tailColor) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.35, metalness: 0.15 });
  const grey = new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.45, metalness: 0.35 });
  const tail = new THREE.MeshStandardMaterial({ color: tailColor, roughness: 0.4, metalness: 0.1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.2, metalness: 0.4 });
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  const fus = new THREE.CylinderGeometry(2.9, 2.9, 42, 24); fus.rotateX(Math.PI / 2); add(fus, white, 0, 0, 2);
  const nose = new THREE.SphereGeometry(2.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); nose.rotateX(Math.PI / 2); nose.scale(1, 0.95, 2.2); add(nose, white, 0, -0.1, 23);
  const cone = new THREE.CylinderGeometry(2.9, 0.6, 13, 20); cone.rotateX(Math.PI / 2); cone.translate(0, 0, -25.5); add(cone, white, 0, 0.5, 0, 0.05, 0, 0);
  add(new THREE.BoxGeometry(5.9, 0.55, 33), dark, 0, 0.9, 3); // window band
  const ck = new THREE.BoxGeometry(3.2, 0.8, 1.2); add(ck, dark, 0, 1.4, 21.6, -0.5, 0, 0);
  // swept, tapered planforms (span along x, chord along z), extruded to a thin slab
  const plan = (pts, t) => { const sh = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b))); const g2 = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }); g2.rotateX(Math.PI / 2); g2.translate(0, t / 2, 0); return g2; };
  for (const sd of [-1, 1]) {
    const wing = plan([[0, 5], [sd * 29, -12.5], [sd * 29, -15], [sd * 2, -5.5], [0, -5.5]].map(([a, b]) => [a, -b]), 0.55); add(wing, grey, sd * 2.4, -1.6, 4, 0, 0, sd * 0.07);
    const eng = new THREE.CylinderGeometry(1.55, 1.35, 5.5, 18); eng.rotateX(Math.PI / 2); add(eng, white, sd * 9.5, -2.8, 7.5);
    const intake = new THREE.CylinderGeometry(1.35, 1.35, 0.3, 18); intake.rotateX(Math.PI / 2); add(intake, dark, sd * 9.5, -2.8, 10.3);
    const hs = plan([[0, 3], [sd * 10, -3.5], [sd * 10, -5], [0, -3.2]].map(([a, b]) => [a, -b]), 0.3); add(hs, grey, sd * 0.8, 1.2, -24, 0, 0, sd * 0.1);
  }
  { const sh = new THREE.Shape([new THREE.Vector2(4, 0), new THREE.Vector2(-5.5, 10.5), new THREE.Vector2(-8.5, 10.5), new THREE.Vector2(-6, 0)]); const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: false }); fg.rotateY(Math.PI / 2); fg.translate(-0.22, 0, 0); add(fg, tail, 0, 2.2, -22); }
  // gear (visible on the ground / final approach)
  const gearG = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 12); gearG.rotateZ(Math.PI / 2);
  const gear = new THREE.Group(); for (const [x, z] of [[0, 19], [-3, 0.5], [3, 0.5]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.6, 6), grey); s.position.set(x, -3.6, z); gear.add(s); for (const dz of [-0.8, 0.8]) { const w = new THREE.Mesh(gearG, dark); w.position.set(x, -4.9, z + (x ? dz : 0)); gear.add(w); } }
  g.add(gear); g.userData.gear = gear;
  // lights
  const tex = glowTexture();
  const spr = (c, s, x, y, z, op = 1) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op })); m.scale.setScalar(s); m.position.set(x, y, z); g.add(m); return m; };
  g.userData.nav = [spr(0xff2020, 2.5, -31, -0.9, -9.5), spr(0x20ff40, 2.5, 31, -0.9, -9.5)];
  g.userData.strobe = [spr(0xffffff, 5, -31.2, -0.8, -10.5), spr(0xffffff, 5, 31.2, -0.8, -10.5), spr(0xffffff, 4, 0, 1.2, -32)];
  g.userData.beacon = [spr(0xff2a10, 3, 0, 3.2, 0), spr(0xff2a10, 3, 0, -3.2, 2)];
  g.userData.land = [spr(0xfff4dc, 16, -4, -1.6, 6), spr(0xfff4dc, 16, 4, -1.6, 6), spr(0xfff4dc, 10, 0, -4.2, 19)];
  g.scale.setScalar(0.98);
  return g;
}

export class Planes {
  constructor(game) {
    this.g = game; this.parked = []; this.flying = []; this.t = 0; this.next = 8; this.data = null;
    fetch(new URL('../../data/city/airport.json', import.meta.url)).then(r => r.ok ? r.json() : null).then(d => { if (d) this.data = this.prepare(d); }).catch(() => {});
  }
  prepare(d) {
    // join split runway pieces with the same ref into one strip (extreme points along its axis)
    const by = new Map();
    for (const r of d.runways) { const k = r.ref || Math.random(); (by.get(k) || by.set(k, []).get(k)).push(r); }
    const runways = [];
    for (const list of by.values()) {
      const pts = list.flatMap(r => [r.a, r.b]); const a0 = list[0].a, b0 = list[0].b; const ux = b0[0] - a0[0], uz = b0[1] - a0[1], L = Math.hypot(ux, uz) || 1;
      let lo = null, hi = null; for (const p of pts) { const s = ((p[0] - a0[0]) * ux + (p[1] - a0[1]) * uz) / L; if (!lo || s < lo.s) lo = { s, p }; if (!hi || s > hi.s) hi = { s, p }; }
      const a = lo.p, b = hi.p, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len > 1500 && Math.hypot((a[0] + b[0]) / 2 - HANEDA.x, (a[1] + b[1]) / 2 - HANEDA.z) < 6000) runways.push({ a, b, len, dx: (b[0] - a[0]) / len, dz: (b[1] - a[1]) / len });
    }
    return { runways, gates: d.gates };
  }
  update(dt, focus, night) {
    if (!this.data) return;
    this.t += dt;
    const dH = Math.hypot(focus.x - HANEDA.x, focus.z - HANEDA.z);
    // parked aircraft at the stands nearest to the player (only while near the airport)
    if ((this._pt = (this._pt || 0) - dt) <= 0) {
      this._pt = 3;
      if (dH < 4500 && !this.parked.length) {
        const stands = this.data.gates.slice().sort((a, b) => Math.hypot(a[0] - focus.x, a[1] - focus.z) - Math.hypot(b[0] - focus.x, b[1] - focus.z)).filter((s, i, arr) => !arr.slice(0, i).some(o => Math.hypot(o[0] - s[0], o[1] - s[1]) < 45)).slice(0, { low: 4, medium: 8, high: 14, ultra: 20 }[this.g.quality] ?? 8);
        for (const [x, z, yaw] of stands) { const m = airliner(TAIL[Math.floor(Math.random() * TAIL.length)]); m.position.set(x, 5.4, z); m.rotation.y = yaw; this.g.scene.add(m); this.parked.push(m); m.userData.land.forEach(s => (s.visible = false)); }
      } else if (dH > 5500 && this.parked.length) { for (const m of this.parked) this.g.scene.remove(m); this.parked.length = 0; }
    }
    // flight operations while within sight of Haneda
    this.next -= dt;
    if (this.next <= 0 && dH < 9000 && this.data.runways.length && this.flying.length < 3) {
      this.next = 35 + Math.random() * 45;
      const R = this.data.runways[Math.floor(Math.random() * this.data.runways.length)];
      const dir = Math.random() < 0.5 ? 1 : -1, landing = Math.random() < 0.55;
      const m = airliner(TAIL[Math.floor(Math.random() * TAIL.length)]); this.g.scene.add(m);
      const start = dir > 0 ? R.a : R.b, hx = R.dx * dir, hz = R.dz * dir;
      this.flying.push({ m, R, start, hx, hz, landing, s: landing ? -7500 : 120, v: landing ? 75 : 0, y: 0, phase: landing ? 'final' : 'roll' });
    }
    const blink = (this.t % 1.2) < 0.08, beacon = (this.t % 1.0) < 0.15;
    for (const f of this.flying.slice()) {
      const T0 = 350; // touchdown point past the threshold
      if (f.landing) {
        if (f.s < T0) { f.v = 72; f.y = Math.max(0, (T0 - f.s) * Math.tan(3 * Math.PI / 180)); if (f.y < 12) f.y *= 0.92 + 0.08 * f.y / 12; }
        else { f.y = 0; f.v = Math.max(14, f.v - 2.6 * dt); if (f.s > f.R.len - 300) { this.drop(f); continue; } }
      } else {
        if (f.phase === 'roll') { f.v += 2.4 * dt; if (f.v > 78) f.phase = 'climb'; }
        else { f.v = Math.min(105, f.v + 1.2 * dt); f.y += f.v * Math.sin(8 * Math.PI / 180) * dt; if (f.y > 1600) { this.drop(f); continue; } }
      }
      f.s += f.v * dt;
      const x = f.start[0] + f.hx * f.s, z = f.start[1] + f.hz * f.s;
      f.m.position.set(x, f.y + 5.4, z); f.m.rotation.set(0, Math.atan2(f.hx, f.hz), 0);
      const pitch = f.landing ? (f.y > 0 ? -0.05 : (f.y === 0 && f.v > 40 ? -0.02 : 0)) : (f.phase === 'climb' ? -0.16 : 0);
      f.m.rotation.x = pitch; f.m.userData.gear.visible = f.y < 500;
      const dP = Math.hypot(x - focus.x, z - focus.z, f.y - focus.y);
      if (dP > 16000) { this.drop(f); continue; }
      f.m.userData.land.forEach(s => (s.visible = night > 0.2 && (f.y < 900)));
      f.m.userData.strobe.forEach(s => (s.visible = blink));
      f.m.userData.beacon.forEach(s => (s.visible = beacon));
      f.loud = Math.max(0, 1 - dP / 1600) ** 1.5 * (f.landing ? 0.8 : 1);
    }
    for (const m of this.parked) { m.userData.beacon.forEach(s => (s.visible = beacon && night > 0.3)); m.userData.strobe.forEach(s => (s.visible = false)); m.userData.nav.forEach(s => (s.visible = night > 0.3)); }
    const loud = this.flying.reduce((a, f) => Math.max(a, f.loud || 0), 0);
    this.g.audio?.setJet?.(loud);
  }
  drop(f) { this.g.scene.remove(f.m); this.flying.splice(this.flying.indexOf(f), 1); }
}
