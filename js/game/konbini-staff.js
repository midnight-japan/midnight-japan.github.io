// Konbini staff (v2.13.7; v2.16.1 realistic clerks in light-blue uniform shirts — people.js 'shun_clerk' / 'kana_clerk') — the Daikoku PA LAWSON is staffed: a clerk stands behind the register (turns to you and
// greets 「いらっしゃいませー」 when you walk in, bows a little while ringing you up) and a part-timer in the same
// uniform restocks the shelves — walks an aisle, crouches at a shelf, faces the products up, moves on.
// Built only while you are near the PA (two animated humans, nothing elsewhere).
import * as THREE from 'three';
import { randomOutfit } from './humans.js';
import { createPerson, peopleFailed, loadPeople, uniformReady } from './people.js';

const UNI = ['#2f6fb5', '#2f6fb5', '#2f6fb5']; // LAWSON blue striped uniform
function staffOutfit(seed) {
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const o = randomOutfit(r); o.top = 'shirt'; o.topColor = UNI[0]; o.accentColor = '#eef3f8'; o.bottom = 'chinos'; o.bottomColor = '#1b1f26'; o.shoes = 'sneakers'; o.accessory = 'none'; if (o.hair === 'cap' || o.hair === 'beanie') o.hair = 'short'; return o;
}
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);

export class KonbiniStaff {
  constructor(game) { this.g = game; this.on = false; this.t = 0; }
  build() {
    const g = this.g, K = g.world.konbiniStaff; if (!K) return false;
    const mk = seed => { try { const h = createPerson({ outfit: staffOutfit(seed), id: seed === 4021 ? 'kana_clerk' : 'shun_clerk', mirror: false }); g.scene.add(h.object); return h; } catch { return null; } };
    this.clerk = { h: mk(4021), pos: K.counter.clone(), yaw: yawTo(K.counter, K.customer), act: 'idle', actT: 0 };
    const a0 = K.aisles[1]; this.stock = { h: mk(9157), pos: a0.a.clone(), yaw: 0, path: [], act: 'walk', wait: 0, aisle: 1 };
    this.on = true; return true;
  }
  destroy() { for (const s of [this.clerk, this.stock]) if (s?.h) { this.g.scene.remove(s.h.object); s.h.dispose?.(); } this.clerk = this.stock = null; this.on = false; }
  // the shop UI calls this after a purchase: the clerk bows / talks while bagging it
  served() { if (this.clerk) { this.clerk.act = 'talk'; this.clerk.actT = 3; } }
  update(dt, focus) {
    const g = this.g, W = g.world, K = W.konbiniStaff; if (!K || !focus) return;
    const near = focus.distanceTo(K.counter) < 140;
    // v2.16: build with the realistic staff once loaded (v2.16.1: in the LAWSON-blue uniform shirts; procedural after 20 s if those fail)
    if (near && !this.on && !uniformReady('clerk') && !peopleFailed() && (this.waitT = (this.waitT || 0) + dt) < 20) { loadPeople(); return; }
    if (near && !this.on) this.build(); else if (!near && this.on) this.destroy();
    if (!this.on) return;
    const p = g.player?.pos, inStore = g.mode === 'walk' && p && W.konbini && p.x > W.konbini.x0 && p.x < W.konbini.x1 && p.z > W.konbini.z0 && p.z < W.konbini.z1;
    // clerk: faces the register side; turns to the player when they come in, a short bow on entry
    const c = this.clerk;
    if (inStore && !this._in) { c.act = 'wave'; c.actT = 1.4; }
    this._in = inStore;
    if (c.actT > 0) c.actT -= dt; else c.act = 'idle';
    const want = inStore ? yawTo(c.pos, p) : yawTo(K.counter, K.customer);
    let dy = want - c.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.yaw += dy * Math.min(1, dt * 4);
    if (c.h) { c.h.object.position.copy(c.pos); c.h.object.rotation.y = c.yaw; try { c.h.update(dt, { speed: 0, action: c.act }); } catch {} }
    // restocker: walk to an aisle, crouch at the shelf facing products for a while, move on
    const s = this.stock; let speed = 0, act = s.act;
    if (s.wait > 0) { s.wait -= dt; act = 'crouch'; }
    else if (s.path.length) {
      const q = s.path[0], d = q.clone().sub(s.pos); d.y = 0; const L = d.length();
      if (L < 0.2) { s.path.shift(); if (!s.path.length) { s.wait = 6 + Math.random() * 8; const A = K.aisles[s.aisle]; s.yaw = yawTo(s.pos, Math.random() < 0.5 ? A.shelfL : A.shelfR); } }
      else { const k = Math.min(1, 1.3 * dt / L); s.pos.addScaledVector(d, k); s.yaw = Math.atan2(d.x, d.z); speed = 1.3; act = 'walk'; }
    } else { // next stop: another aisle (via the front cross-aisle), a random depth along it
      const from = K.aisles[s.aisle]; s.aisle = (s.aisle + 1 + Math.floor(Math.random() * 3)) % K.aisles.length; const A = K.aisles[s.aisle], f = 0.15 + Math.random() * 0.8;
      s.path = [from.a.clone(), A.a.clone(), A.a.clone().lerp(A.b, f)];
    }
    if (s.h) { s.h.object.position.copy(s.pos); s.h.object.rotation.y = s.yaw; try { s.h.update(dt, { speed, action: act === 'crouch' ? 'crouch' : speed > 0 ? 'walk' : 'idle' }); } catch {} }
  }
}
