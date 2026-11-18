// Pedestrians on the city sidewalks: they follow the real street graph (js/game/city.js CityNet) on either side of
// the road, continue round corners at junctions, thin out late at night and step aside for cars.
import * as THREE from 'three';
import { createHuman, randomOutfit } from './humans.js';

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

export class Walkers {
  constructor(game) {
    this.g = game; this.list = []; this.t = 0; this.manageT = 0;
    this.max = { low: 6, medium: 14, high: 24, ultra: 34 }[game.quality] ?? 14;
  }
  net() { return this.g.world.city?.net; }
  seg(c, i) { const a = c.pts[i], b = c.pts[i + 1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.01; return { a, b, L, tx: (b[0] - a[0]) / L, tz: (b[1] - a[1]) / L }; }
  spawn(f) {
    const N = this.net(); if (!N) return false;
    const sp = N.randomNear(f.x, f.z, 30, 200); if (!sp || sp.c.cls > 4) return false;
    const hour = this.g.tod?.hours ?? 12, type = crowdType(hour);
    let h; try { h = createHuman(typedOutfit(type)); } catch (e) { return false; } giveBag(h, type);
    // v2.9 personalities: car fans stop and film / wave at a passing sports car, phone-checkers stop to read, couples
    // walk side by side at the same pace
    const w = { h, c: sp.c, i: sp.i, d: sp.d, dir: Math.random() < 0.5 ? 1 : -1, side: Math.random() < 0.5 ? 1 : -1, v: (type === 'office' ? 1.35 : type === 'student' ? 1.2 : 1.05) + Math.random() * 0.4, type, yaw: 0, pause: 0, ox: 0, oz: 0, lat: 0,
      fan: Math.random() < (type === 'student' ? 0.45 : type === 'office' ? 0.12 : 0.3), phoney: Math.random() < (type === 'office' ? 0.5 : 0.35), act: null, cool: 0 };
    w.umb = umbrella(); w.umb.position.set(0.12, (h.height || 1.7) + 0.08, 0.06); w.umb.visible = false; h.object.add(w.umb);
    this.g.scene.add(h.object); this.list.push(w); this.pose(w, true);
    if (Math.random() < (type === 'student' ? 0.55 : 0.2) && this.list.length < this.max) { let h2; try { h2 = createHuman(type === 'student' || type === 'office' ? typedOutfit(type) : randomOutfit()); if (type === 'student' || type === 'office') giveBag(h2, type); } catch { h2 = null; }
      if (h2) { const m = { ...w, h: h2, lead: w, lat: 0.6, fan: w.fan, phoney: false, umb: null }; m.umb = umbrella(); m.umb.position.copy(w.umb.position); m.umb.visible = false; h2.object.add(m.umb); w.lat = -0.05; this.g.scene.add(h2.object); this.list.push(m); this.pose(m, true); } }
    return true;
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
    const N = this.net();
    this.manageT -= dt;
    if (this.manageT <= 0) {
      this.manageT = 1;
      for (const w of this.list.slice()) { const p = w.h.object.position; if (!N || w.c.dead || Math.hypot(p.x - f.x, p.z - f.z) > 260) this.remove(w); }
      const want = Math.round(this.max * (1 - 0.55 * night));
      const inCity = this.g.world.isLand(f.x, f.z) && f.y < 8;
      for (let k = 0; N && inCity && k < 3 && this.list.length < want; k++) this.spawn(f);
    }
    if (!N) return;
    const raining = (this.g.env?.rain ?? 0) > 0.15;
    const v = this.g.vehicle, drive = this.g.mode === 'drive' && v;
    for (const w of this.list) {
      if (w.c.dead) continue;
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
      if (w.pause > 0) { w.pause -= dt; speed = 0; }
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
          if (Math.random() < 0.15) w.pause = 2 + Math.random() * 6;
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
