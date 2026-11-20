// 救急車 (v2.16): after a crash with injured people someone calls 119 — a Japanese high-roof ambulance (white body,
// red stripe, red light bar, two-tone ピーポー siren) drives up behind the scene with its lights flashing, stops, two
// paramedics bring the stretcher to the wrecked car, load the injured driver and carry them back into the ambulance,
// which then pulls out round the wreck and drives off to hospital.
// Model: "Japanese Ambulance Van" + "Hospital Stretcher" (Sketchfab, CC BY — assets/CREDITS.md), baked with
// tools/prop-bake.mjs into assets/models/people/.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createPerson } from './people.js';

const BASE = new URL('../../assets/models/people/', import.meta.url);
let MODELS = null;
function loadModels() {
  if (MODELS) return MODELS;
  const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
  MODELS = Promise.all(['ambulance', 'stretcher'].map(n => L.loadAsync(new URL(n + '.glb', BASE).href).then(g => { g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.geometry.userData.shared = true; } }); return g.scene; })))
    .then(([amb, str]) => ({ amb, str }));
  MODELS.catch(e => console.warn('ambulance', e.message));
  return MODELS;
}

// soft glow sprite for the flashing lamps
let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,80,70,0.8)'); gr.addColorStop(1, 'rgba(255,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); GLOW = new THREE.CanvasTexture(c); return GLOW;
}

// the Japanese ambulance siren: two tones (≈960 / 770 Hz) alternating every 0.65 s, panned in 3D
class PeePo {
  constructor(a) {
    this.a = a; const ctx = a.ctx; this.ok = !!(ctx && a.bus?.sfx); if (!this.ok) return;
    this.o = ctx.createOscillator(); this.o.type = 'square'; this.o2 = ctx.createOscillator(); this.o2.type = 'sine';
    this.f = ctx.createBiquadFilter(); this.f.type = 'lowpass'; this.f.frequency.value = 2600;
    this.g = ctx.createGain(); this.g.gain.value = 0;
    this.p = ctx.createPanner(); this.p.panningModel = 'equalpower'; this.p.distanceModel = 'inverse'; this.p.refDistance = 12; this.p.rolloffFactor = 1.1;
    const m1 = ctx.createGain(); m1.gain.value = 0.18; const m2 = ctx.createGain(); m2.gain.value = 0.5;
    this.o.connect(m1); this.o2.connect(m2); m1.connect(this.f); m2.connect(this.f); this.f.connect(this.g); this.g.connect(this.p); this.p.connect(a.bus.sfx);
    this.o.start(); this.o2.start(); this.t = 0; this.hi = true;
  }
  update(dt, pos, on, vRel = 0) {
    if (!this.ok) return; const ctx = this.a.ctx, now = ctx.currentTime;
    this.t += dt; if (this.t > 0.65) { this.t = 0; this.hi = !this.hi; }
    const dop = THREE.MathUtils.clamp(1 + vRel / 343, 0.9, 1.1), f = (this.hi ? 960 : 770) * dop;
    this.o.frequency.setTargetAtTime(f, now, 0.01); this.o2.frequency.setTargetAtTime(f, now, 0.01);
    this.g.gain.setTargetAtTime(on ? 0.5 : 0, now, 0.08);
    if (this.p.positionX) { this.p.positionX.setTargetAtTime(pos.x, now, 0.05); this.p.positionY.setTargetAtTime(pos.y + 1.5, now, 0.05); this.p.positionZ.setTargetAtTime(pos.z, now, 0.05); } else this.p.setPosition(pos.x, pos.y + 1.5, pos.z);
  }
  dispose() { if (!this.ok) return; try { this.g.gain.setTargetAtTime(0, this.a.ctx.currentTime, 0.05); setTimeout(() => { try { this.o.stop(); this.o2.stop(); this.p.disconnect(); } catch {} }, 400); } catch {} this.ok = false; }
}

const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const angD = d => Math.atan2(Math.sin(d), Math.cos(d));

export class Ambulances {
  constructor(game) { this.g = game; this.list = []; }

  /**
   * Send an ambulance to an accident. inc: { ai (the wrecked car), patientId?, onDone?() }.
   * The route is built along the lane / street the wrecked car is on, starting ~170 m behind it.
   */
  dispatch(inc) {
    const g = this.g, ai = inc.ai;
    const route = this.routeTo(ai); if (!route) return null;
    const job = { inc, route, ri: 1, stage: 'load', t: 0, pos: route[0].clone(), yaw: yawTo(route[0], route[1]), v: 13, crew: [], flash: 0 };
    this.list.push(job);
    loadModels().then(M => {
      if (!this.list.includes(job)) return;
      const root = new THREE.Group(); root.add(M.amb.clone()); job.root = root;
      // flashing red lamps: light-bar ends + rear upper corners (emissive boxes with additive glow sprites)
      job.lamps = [];
      const lampG = new THREE.BoxGeometry(0.34, 0.13, 0.2);
      for (const [x, y, z] of [[-0.55, 2.43, 1.15], [0.55, 2.43, 1.15], [-0.82, 2.3, -2.48], [0.82, 2.3, -2.48]]) {
        const m = new THREE.Mesh(lampG, new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1010, emissiveIntensity: 0, roughness: 0.4 })); m.position.set(x, y, z);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff2a20, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); s.scale.setScalar(1.6); s.position.set(x, y + 0.05, z + Math.sign(z) * 0.12);
        root.add(m, s); job.lamps.push({ m, s, side: x < 0 ? 0 : 1 });
      }
      job.stretcherSrc = M.str;
      g.scene.add(root);
      job.stage = 'drive';
      if (g.audio?.ctx) job.siren = new PeePo(g.audio);
    }).catch(() => { this.list.splice(this.list.indexOf(job), 1); });
    return job;
  }

  // points from ~170 m behind the wrecked car to just behind it, on its own lane / street
  routeTo(ai) {
    const pts = [], W = this.g.world;
    if (ai.mode === 'road' && ai.road) {
      const r = ai.road, dir = ai.dir || 1, lat = ai.lane?.lat ?? ai.lat ?? 0;
      for (let k = 170; k >= 11; k -= 8) { const s = THREE.MathUtils.clamp(ai.s - dir * k, 1, r.length - 1); const p = r.at(s, lat); pts.push(new THREE.Vector3(p.x, p.y, p.z)); }
      this.exitOf = null;
    } else if (ai.mode === 'city' && ai.c?.pts) {
      // walk back along the street polyline from the car
      const c = ai.c; const dir = ai.dir || 1; let i = ai.i, x = ai.pos.x, z = ai.pos.z, left = 175; const back = [[x, z]];
      let vi = dir > 0 ? i : i + 1;
      while (left > 0 && vi >= 0 && vi < c.pts.length) { const q = c.pts[vi]; const d = Math.hypot(q[0] - x, q[1] - z); if (d > left) { const k = left / d; back.push([x + (q[0] - x) * k, z + (q[1] - z) * k]); left = 0; break; } back.push([q[0], q[1]]); left -= d; x = q[0]; z = q[1]; vi -= dir; }
      back.reverse();
      // keep to the left of the street (Japan drives on the left): offset the polyline by the lane half-width
      const off = (c.w || 7) / 4;
      const y = ai.pos.y;
      for (let k = 0; k < back.length; k++) { const a = back[Math.max(0, k - 1)], b = back[Math.min(back.length - 1, k + 1)]; const tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1; pts.push(new THREE.Vector3(back[k][0] - tz / L * off * 0, y, back[k][1] + tx / L * off * 0)); }
      // stop 9 m short of the car
      const last = pts[pts.length - 1]; const prev = pts[pts.length - 2] || last.clone().add(new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw)).multiplyScalar(-10));
      const dv = last.clone().sub(prev).setY(0).normalize(); pts[pts.length - 1] = ai.pos.clone().addScaledVector(dv, -9); pts[pts.length - 1].y = y;
    } else {
      // parked / PA: come straight in from behind the car
      const f = new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw));
      for (let k = 120; k >= 9; k -= 10) pts.push(ai.pos.clone().addScaledVector(f, -k));
    }
    // drop points closer than 1 m to each other
    const out = [pts[0]]; for (const p of pts) if (p.distanceTo(out[out.length - 1]) > 1) out.push(p);
    return out.length >= 2 ? out : null;
  }

  update(dt) {
    for (const job of [...this.list]) this.step(job, dt);
  }

  step(job, dt) {
    const g = this.g; job.t += dt; job.flash += dt;
    if (job.stage === 'load') return;
    const ai = job.inc.ai;
    // lamps: alternating left / right at ~2.5 Hz, rear ones in sync
    const ph = Math.floor(job.flash * 5) % 2, on = job.stage !== 'gone';
    for (const L of job.lamps || []) { const lit = on && L.side === ph; L.m.material.emissiveIntensity = lit ? 3.2 : 0.15; L.s.material.opacity = lit ? 0.9 : 0; }
    const me = g.mode === 'walk' && g.player ? g.player.pos : g.vehicle?.pos;
    if (job.siren) { const d = me ? me.distanceTo(job.pos) : 999; job.siren.update(dt, job.pos, (job.stage === 'drive' || job.stage === 'leave') && d < 600, 0); }
    switch (job.stage) {
      case 'drive': {
        if (this.follow(job, dt, 14)) { job.stage = 'park'; job.t = 0; job.v = 0; }
        break;
      }
      case 'park': if (job.t > 1.2) { this.spawnCrew(job); job.stage = 'fetch'; job.t = 0; } break;
      case 'fetch': { // crew + stretcher to the driver door
        const door = this.doorOf(ai); const done = this.walkCrew(job, door, dt, 1.5);
        if (done || job.t > 25) { job.stage = 'treat'; job.t = 0; }
        break;
      }
      case 'treat': {
        for (const c of job.crew) { c.speed = 0; c.action = 'crouch'; c.yaw = yawTo(c.pos, ai.pos); }
        if (job.t > 5 && !job.patient) {
          // the injured driver is lifted onto the stretcher
          if (ai.seatD) ai.driverOut = true;
          const p = createPerson({ id: job.inc.patientId, mirror: false });
          p.object.scale.setScalar(1); job.patient = { h: p }; g.scene.add(p.object);
          g.audio?.speak?.('せーの！', 'ja-JP', { role: 'male', seed: 7 });
        }
        if (job.t > 7) { job.stage = 'carry'; job.t = 0; }
        break;
      }
      case 'carry': { // back to the rear doors
        const back = job.pos.clone().add(new THREE.Vector3(Math.sin(job.yaw), 0, Math.cos(job.yaw)).multiplyScalar(-3.4));
        const done = this.walkCrew(job, back, dt, 1.1);
        if (done || job.t > 30) { job.stage = 'board'; job.t = 0; }
        break;
      }
      case 'board':
        if (job.t > 1.5) {
          this.dropCrew(job); job.stage = 'leave'; job.t = 0; job.v = 0; job.route = this.exitRoute(job); job.ri = 1;
          job.inc.onDone?.();
          g.ui?.toast?.(L({ ja: '救急車が負傷者を搬送しました。', en: 'The ambulance is taking the injured driver to hospital.', ko: '구급차가 부상자를 병원으로 이송합니다.' }), 'info', 5);
        }
        break;
      case 'leave': {
        if (this.follow(job, dt, 16) || job.t > 60 || (me && me.distanceTo(job.pos) > 500)) { job.stage = 'gone'; this.remove(job); }
        break;
      }
    }
    // stretcher + patient travel between the two crew members
    if (job.str) {
      const [a, b] = job.crew; if (a && b) { job.str.position.lerpVectors(a.pos, b.pos, 0.5); job.str.rotation.y = yawTo(b.pos, a.pos) - Math.PI / 2; }
      if (job.patient) { const p = job.patient.h; p.object.position.copy(job.str.position); p.object.position.y += 0.82; p.object.rotation.y = job.str.rotation.y + Math.PI / 2; p.update(dt, { action: 'lying' }); }
    }
    for (const c of job.crew) { c.h.object.position.copy(c.pos); c.h.object.rotation.y = c.yaw; c.h.update(dt, { speed: c.speed, action: c.action }); }
    if (job.root) { job.root.position.copy(job.pos); job.root.rotation.y = job.yaw; }
  }

  follow(job, dt, vMax) {
    const r = job.route; if (job.ri >= r.length) return true;
    const tgt = r[job.ri], dx = tgt.x - job.pos.x, dz = tgt.z - job.pos.z, d = Math.hypot(dx, dz);
    // distance left to the end of the route → brake for it
    let left = d; for (let k = job.ri; k < r.length - 1; k++) left += r[k].distanceTo(r[k + 1]);
    const want = Math.min(vMax, Math.sqrt(2 * 3.5 * Math.max(0, left - 0.5)) + 0.3);
    // the player's car (often stopped right behind the wreck) is in the way: pull up behind it instead
    let want2 = want; const pv = this.g.vehicle?.pos;
    if (pv && job.stage === 'drive') { const hx = Math.sin(job.yaw), hz = Math.cos(job.yaw), ex = pv.x - job.pos.x, ez = pv.z - job.pos.z, fw = ex * hx + ez * hz, sd = Math.abs(ex * hz - ez * hx);
      if (fw > 0 && fw < 9 && sd < 2.6) { want2 = 0; if (job.v < 0.3 && left < 30) return true; } }
    job.v += THREE.MathUtils.clamp(want2 - job.v, -6 * dt, 3 * dt);
    if (d < Math.max(1.2, job.v * dt * 1.5)) { job.ri++; return job.ri >= r.length && left < 2; }
    const step = Math.min(d, job.v * dt); job.pos.x += dx / d * step; job.pos.z += dz / d * step; job.pos.y += (tgt.y - job.pos.y) * Math.min(1, dt * 4);
    job.yaw += angD(Math.atan2(dx, dz) - job.yaw) * Math.min(1, dt * 3);
    return false;
  }
  exitRoute(job) {
    // pull out to the right (overtaking side), past the wreck, then on along the street / lane
    const f = new THREE.Vector3(Math.sin(job.yaw), 0, Math.cos(job.yaw)), right = new THREE.Vector3(-f.z, 0, f.x);
    const pts = [job.pos.clone()];
    for (let k = 1; k <= 25; k++) { const side = Math.min(1, k / 4) * 3.3; pts.push(job.pos.clone().addScaledVector(f, k * 8).addScaledVector(right, side)); }
    return pts;
  }
  doorOf(ai) {
    const side = new THREE.Vector3(Math.cos(ai.yaw), 0, -Math.sin(ai.yaw)); // driver side (right-hand drive)
    return ai.pos.clone().addScaledVector(side, -(ai.radius + 1.3));
  }
  spawnCrew(job) {
    const g = this.g, f = new THREE.Vector3(Math.sin(job.yaw), 0, Math.cos(job.yaw)), r = new THREE.Vector3(-f.z, 0, f.x);
    const rear = job.pos.clone().addScaledVector(f, -3.2);
    for (const s of [-0.55, 0.55]) {
      const h = createPerson({ type: 'staff', sex: 'm', mirror: false });
      const pos = rear.clone().addScaledVector(r, s); h.object.position.copy(pos); g.scene.add(h.object);
      job.crew.push({ h, pos: h.object.position, yaw: job.yaw + Math.PI, speed: 0, action: 'idle' });
    }
    const st = job.stretcherSrc.clone(); g.scene.add(st); job.str = st;
    g.audio?.sfx?.('door_open', { position: rear });
  }
  // the two crew walk side by side (1.1 m apart across the stretcher) to a point
  walkCrew(job, p, dt, sp) {
    const [a, b] = job.crew; if (!a) return true;
    const mid = a.pos.clone().lerp(b.pos, 0.5), dx = p.x - mid.x, dz = p.z - mid.z, d = Math.hypot(dx, dz);
    if (d < 0.5) { for (const c of job.crew) { c.speed = 0; c.action = 'idle'; } return true; }
    const yaw = Math.atan2(dx, dz), st = Math.min(d, sp * dt), r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const nm = mid.clone().add(new THREE.Vector3(dx / d * st, 0, dz / d * st));
    a.pos.copy(nm).addScaledVector(r, -0.55); b.pos.copy(nm).addScaledVector(r, 0.55);
    for (const c of job.crew) { c.yaw = yaw; c.speed = sp; c.action = 'walk'; }
    return false;
  }
  dropCrew(job) {
    for (const c of job.crew) { c.h.dispose(); } job.crew = [];
    if (job.str) { job.str.removeFromParent(); job.str = null; }
    if (job.patient) { job.patient.h.dispose(); job.patient = null; }
    this.g.audio?.sfx?.('door_close', { position: job.pos });
  }
  remove(job) {
    this.dropCrew(job); job.siren?.dispose(); job.root?.removeFromParent();
    const i = this.list.indexOf(job); if (i >= 0) this.list.splice(i, 1);
  }
  busy() { return this.list.length > 0; }
}

// tiny local i18n for the few lines here (ja / en / ko)
import { getLang } from '../i18n.js';
export function L(m) { const l = (getLang?.() || 'ja').slice(0, 2); return m[l] || m.en || m.ja; }
