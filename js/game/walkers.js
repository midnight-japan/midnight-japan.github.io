// Pedestrians on the city sidewalks: they follow the real street graph (js/game/city.js CityNet) on either side of
// the road, continue round corners at junctions, thin out late at night and step aside for cars.
import { createHuman, randomOutfit } from './humans.js';

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
    let h; try { h = createHuman(randomOutfit()); } catch (e) { return false; }
    const w = { h, c: sp.c, i: sp.i, d: sp.d, dir: Math.random() < 0.5 ? 1 : -1, side: Math.random() < 0.5 ? 1 : -1, v: 1.05 + Math.random() * 0.5, yaw: 0, pause: 0 };
    this.g.scene.add(h.object); this.list.push(w); this.pose(w, true); return true;
  }
  remove(w) { this.g.scene.remove(w.h.object); try { w.h.dispose(); } catch {} this.list.splice(this.list.indexOf(w), 1); }
  pose(w, snap) {
    const S = this.seg(w.c, w.i); const off = w.c.w / 2 + (w.c.cls <= 3 ? 1.6 : 0.8);
    const hx = S.tx * w.dir, hz = S.tz * w.dir;
    const x = S.a[0] + S.tx * w.d + S.tz * off * w.side, z = S.a[1] + S.tz * w.d - S.tx * off * w.side;
    w.h.object.position.set(x, 0.05, z);
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
    const v = this.g.vehicle, drive = this.g.mode === 'drive' && v;
    for (const w of this.list) {
      if (w.c.dead) continue;
      let speed = w.v;
      // stop for a moving car about to pass close by
      const p = w.h.object.position;
      if (drive) { const dx = p.x - v.pos.x, dz = p.z - v.pos.z, d2 = dx * dx + dz * dz; if (d2 < 16 && Math.abs(v.kmh) > 3) { const d = Math.sqrt(d2) || 1; p.x += dx / d * dt * 4; p.z += dz / d * dt * 4; speed = 0; } }
      if (w.pause > 0) { w.pause -= dt; speed = 0; }
      let step = speed * dt;
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
      const d2 = (p.x - f.x) ** 2 + (p.z - f.z) ** 2;
      w.h.object.visible = d2 < 200 * 200;
      if (w.h.object.visible && (d2 < 70 * 70 || this.g.frame % 3 === 0)) { try { w.h.update(d2 < 70 * 70 ? dt : dt * 3, { speed, action: speed > 0.1 ? 'walk' : 'idle' }); } catch {} }
    }
  }
}
