// People at the meet: drivers get out of their cars, chat, take photos, crouch at wheels, buy drinks,
// smoke only in the smoking area, and walk back when their car leaves. Restricted areas are never entered.
import * as THREE from 'three';
import { createHuman, randomOutfit } from './humans.js';
import { PA_RECT } from './roads.js';

const rnd = Math.random;
export const CHATTER = [
  { ja: 'いい音してますね！', k: 'game.chat.sound' },
  { ja: 'それ何馬力出てるんですか？', k: 'game.chat.hp' },
  { ja: 'キャンバーえぐいっすね。', k: 'game.chat.camber' },
  { ja: '今日は人多いなぁ。', k: 'game.chat.crowd' },
  { ja: '警察来る前に解散しよっか。', k: 'game.chat.police' },
  { ja: '写真撮ってもいいですか？', k: 'game.chat.photo' },
  { ja: 'このホイール、どこのですか？', k: 'game.chat.wheels' },
  { ja: 'どこから来たんですか？', k: 'game.chat.from' },
  { ja: 'ベイブリッジの夜景、最高ですよね。', k: 'game.chat.view' },
  { ja: '空ぶかしはやめときなよ〜', k: 'game.chat.rev' },
  { ja: 'コンビニでコーヒー買ってくる。', k: 'game.chat.coffee' },
  { ja: '湾岸、空いてました？', k: 'game.chat.wangan' },
];

export class NPCs {
  constructor(game) {
    this.g = game; this.people = []; this.max = { low: 16, medium: 34, high: 56, ultra: 80 }[game.quality] ?? 34;
    this.cache = [];
  }
  canWalk(x, z) { return this.g.world.canWalk(x, z) && !this.blocked(x, z); }
  blocked(x, z, r = 0.35) {
    for (const C of this.g.world.colliders) {
      if (C.y0 > 1.5 || C.y1 < 0.2) continue;
      const dx = x - C.x, dz = z - C.z;
      const lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c;
      if (Math.abs(lx) < C.hx + r && Math.abs(lz) < C.hz + r) return true;
    }
    // parked cars
    for (const ai of this.g.traffic.cars) {
      if (ai.mode === 'road') continue;
      const dx = x - ai.pos.x, dz = z - ai.pos.z; if (dx * dx + dz * dz > 16) continue;
      const f = Math.sin(ai.yaw), c = Math.cos(ai.yaw);
      const lz = dx * f + dz * c, lx = dx * c - dz * f;
      if (Math.abs(lz) < ai.halfL + r * 0.5 && Math.abs(lx) < ai.radius + r * 0.5) return true;
    }
    return false;
  }
  spawn(pos, opts = {}) {
    if (this.people.length >= this.max) return null;
    const outfit = opts.outfit || randomOutfit();
    let h;
    try { h = createHuman(outfit); } catch (e) { console.warn('human', e); return null; }
    h.object.position.copy(pos);
    this.g.scene.add(h.object);
    const p = { h, pos: h.object.position, yaw: opts.yaw ?? rnd() * 6.28, state: 'idle', action: 'idle', t: 0, wait: 2 + rnd() * 6, target: null, speed: 0, car: opts.car || null, ...opts };
    this.people.push(p);
    return p;
  }
  despawn(p) { this.g.scene.remove(p.h.object); try { p.h.dispose(); } catch {} this.people.splice(this.people.indexOf(p), 1); }
  doorOf(ai, side = -1) {
    const f = new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw)), l = new THREE.Vector3(Math.cos(ai.yaw), 0, -Math.sin(ai.yaw));
    const x = (ai.car.lhd ? 1 : -1) * side;
    return ai.pos.clone().addScaledVector(l, -x * (ai.radius + 0.6)).addScaledVector(f, 0.2);
  }
  spawnMeetGroup(ai, arriving = false) {
    if (ai.car.cat === 'traffic' && ai.car.mass > 5000) return;
    const door = this.doorOf(ai, 1);
    if (!this.g.world.canWalk(door.x, door.z)) return;
    const d = this.spawn(door, { car: ai, yaw: ai.yaw + Math.PI / 2 });
    if (!d) return;
    ai.driver = d; d.role = 'driver';
    if (arriving) { d.state = 'exit'; d.t = 0; ai.model.parts.doors.find(x => !x.rear && x.left === !!ai.car.lhd)?.pivot && this.openDoor(ai, true); }
    if (rnd() < 0.3) { const p2 = this.spawn(this.doorOf(ai, -1), { car: ai }); if (p2) { p2.role = 'passenger'; ai.passenger = p2; } }
  }
  openDoor(ai, on) {
    const d = ai.model.parts.doors.find(x => !x.rear && (ai.car.lhd ? x.left : !x.left)); if (d) d.target = on ? 1 : 0;
  }
  recallDriver(ai, cb) {
    const ps = [ai.driver, ai.passenger].filter(Boolean);
    if (!ps.length) return cb();
    let n = ps.length;
    for (const p of ps) { p.state = 'return'; p.target = this.doorOf(ai, p.role === 'driver' ? 1 : -1); p.cb = () => { if (--n === 0) cb(); }; p.giveUp = 40; }
  }
  removeDriver(ai) { for (const p of [ai.driver, ai.passenger]) if (p && this.people.includes(p)) this.despawn(p); ai.driver = ai.passenger = null; }

  pickTarget(p) {
    const cars = this.g.traffic.cars.filter(c => c.mode === 'parked' && !c.station && c.pos.distanceTo(p.pos) < 45);
    const r = rnd();
    const W = this.g.world;
    if (r < 0.62 && cars.length) {
      const c = cars[Math.floor(rnd() * cars.length)];
      const ang = rnd() * 6.28, rad = c.halfL + 0.9 + rnd() * 1.2;
      p.focus = c; p.next = ['talk', 'photo', 'crouch', 'phone', 'idle', 'talk', 'lean'][Math.floor(rnd() * 7)];
      return new THREE.Vector3(c.pos.x + Math.cos(ang) * rad, 0, c.pos.z + Math.sin(ang) * rad);
    }
    if (r < 0.72) { p.next = 'drink'; p.focus = null; return new THREE.Vector3(58 + rnd() * 7, 0, -57.6); }        // vending machines
    if (r < 0.8) { p.next = 'phone'; p.focus = null; return new THREE.Vector3(14 + rnd() * 24, 0, -64 - rnd() * 14); } // konbini
    if (r < 0.86) { p.next = 'smoke'; p.focus = null; return new THREE.Vector3(-72 + rnd() * 4, 0, -74 + rnd() * 6); } // smoking area
    p.next = 'idle'; p.focus = null;
    return new THREE.Vector3(PA_RECT.x0 + 10 + rnd() * 230, 0, PA_RECT.z0 + 25 + rnd() * 130);
  }

  update(dt) {
    const focus = this.g.focus;
    // ambient population: a few staff / visitors around the building
    if (this.people.length < this.max * 0.35 && rnd() < dt * 0.5) {
      const p = new THREE.Vector3(-40 + rnd() * 90, 0, -57);
      if (this.g.world.canWalk(p.x, p.z)) this.spawn(p, { role: 'visitor' });
    }
    for (const p of [...this.people]) {
      const dist2 = p.pos.distanceToSquared(focus);
      const vis = dist2 < 180 * 180;
      p.h.object.visible = vis;
      p.t += dt;
      switch (p.state) {
        case 'exit': p.action = 'exit'; if (p.t > 1.0) { p.state = 'idle'; p.wait = 1 + rnd() * 3; if (p.car) this.openDoor(p.car, false); this.g.audio?.sfx('door_close', { position: p.pos }); } break;
        case 'idle':
          p.speed = 0; p.wait -= dt;
          if (p.focus) { const d = p.focus.pos.clone().sub(p.pos); const want = Math.atan2(d.x, d.z); p.yaw += angDiff(want, p.yaw) * (1 - Math.exp(-dt * 3)); }
          if (p.wait <= 0) { const tg = this.pickTarget(p); if (this.canWalk(tg.x, tg.z)) { p.target = tg; p.state = 'walk'; p.action = 'walk'; p.stuck = 0; } else p.wait = 1; }
          break;
        case 'walk': case 'return': {
          const tg = p.target; const d = new THREE.Vector3(tg.x - p.pos.x, 0, tg.z - p.pos.z); const L = d.length();
          const sp = p.state === 'return' ? 1.5 : 1.25;
          if (L < 0.35) {
            if (p.state === 'return') { p.state = 'enter'; p.t = 0; if (p.car) this.openDoor(p.car, true); break; }
            p.state = 'idle'; p.action = p.next || 'idle'; p.wait = 8 + rnd() * 30; p.speed = 0; break;
          }
          const want = Math.atan2(d.x, d.z);
          p.yaw += angDiff(want, p.yaw) * (1 - Math.exp(-dt * 6));
          const nx = p.pos.x + Math.sin(p.yaw) * sp * dt, nz = p.pos.z + Math.cos(p.yaw) * sp * dt;
          if (this.canWalk(nx, nz)) { p.pos.x = nx; p.pos.z = nz; p.speed = sp; p.stuck = 0; }
          else { p.stuck += dt; p.yaw += (rnd() < 0.5 ? 1 : -1) * dt * 3; p.speed = 0.3; if (p.stuck > 3) { if (p.state === 'return') { p.pos.copy(tg); } else { p.state = 'idle'; p.wait = 1; } } }
          if (p.state === 'return') { p.giveUp -= dt; if (p.giveUp < 0) p.pos.copy(tg); }
          p.action = p.state === 'return' && L > 6 ? 'run' : 'walk';
          break;
        }
        case 'enter': p.action = 'enter'; if (p.t > 1.0) { if (p.car) this.openDoor(p.car, false); this.g.audio?.sfx('door_close', { position: p.pos }); const cb = p.cb; if (p.car) { if (p.car.driver === p) p.car.driver = null; if (p.car.passenger === p) p.car.passenger = null; } this.despawn(p); cb?.(); continue; } break;
      }
      // player avoidance: step aside from a moving player car
      const v = this.g.vehicle;
      if (v && this.g.mode === 'drive' && Math.abs(v.kmh) > 2) {
        const dx = p.pos.x - v.pos.x, dz = p.pos.z - v.pos.z, d2 = dx * dx + dz * dz;
        if (d2 < 9) { const d = Math.sqrt(d2) || 1; const nx = p.pos.x + dx / d * dt * 3, nz = p.pos.z + dz / d * dt * 3; if (this.g.world.canWalk(nx, nz)) { p.pos.x = nx; p.pos.z = nz; } }
      }
      p.h.object.rotation.y = p.yaw;
      if (vis && (dist2 < 60 * 60 || this.g.frame % 3 === 0)) {
        try { p.h.update(dist2 < 60 * 60 ? dt : dt * 3, { speed: p.speed, action: p.action, t: Math.min(1, p.t) }); } catch {}
        if (p.action === 'talk' || p.action === 'idle') p.h.lookAt?.(this.g.mode === 'walk' && dist2 < 36 ? this.g.player?.pos.clone().add(new THREE.Vector3(0, 1.6, 0)) : null);
      }
    }
  }
  nearest(pos, r = 2.2) {
    let best = null, bd = r * r;
    for (const p of this.people) { const d = p.pos.distanceToSquared(pos); if (d < bd) { bd = d; best = p; } }
    return best;
  }
}
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
