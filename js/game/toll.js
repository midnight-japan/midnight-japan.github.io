// 大黒ふ頭 入口料金所: ETC専用 / ETC・一般 lanes with barrier arms (開閉バー).
import * as THREE from 'three';
import { PA } from './roads.js';
import { t } from '../i18n.js';

export const FARES = { etc: { std: 520, kei: 430 }, cash: { std: 1950, kei: 1600 } };

export class TollPlaza {
  constructor(game) {
    this.g = game; this.lanes = [];
    const w = game.world;
    for (const L of w.tollLanes || []) {
      const pivot = new THREE.Group();
      const left = new THREE.Vector3(L.dir.z, 0, -L.dir.x);
      // arm hinged at the right-hand island of the lane (relative to inbound travel)
      const base = L.pos.clone().addScaledVector(left, -1.75).addScaledVector(L.dir, 1.5);
      pivot.position.copy(base).add(new THREE.Vector3(0, 0.95, 0));
      pivot.rotation.y = Math.atan2(left.x, left.z);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 3.3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
      arm.position.z = 1.65;
      // red/white stripes
      for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, 0.4), new THREE.MeshStandardMaterial({ color: 0xd01515, roughness: 0.4 })); s.position.z = 0.4 + i * 0.8; pivot.add(s); }
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2c200 }));
      post.position.set(0, -0.5, 0); pivot.add(arm, post);
      game.scene.add(pivot);
      const col = { x: L.pos.x + L.dir.x * 1.5, z: L.pos.z + L.dir.z * 1.5, hx: 1.7, hz: 0.12, c: Math.cos(Math.atan2(L.dir.x, L.dir.z)), s: Math.sin(Math.atan2(L.dir.x, L.dir.z)), y0: -1, y1: 1.2, kind: 'bar' };
      // collider frame: hx across the lane
      col.c = left.x; col.s = -left.z; // local x axis = across the lane
      w.colliders.push(col);
      this.lanes.push({ ...L, pivot, open: 0, target: 0, col, closeT: 0, state: 'idle', paid: false, left });
    }
  }
  // v2.4.1: leaving the expressway (off-ramp → street) with ETC: the on-board unit's chime and announcement of the
  // distance-based fare (首都高: ¥300 + ~¥29.5/km, capped at ¥1,950), charged here unless paid at an entrance gate
  exitFare(dt) {
    const g = this.g, v = g.vehicle; if (!v || g.mode !== 'drive' || !g.settings.etc) { this.xKm = 0; return; }
    const k = v.road?.kind; const fast = k === 'expressway' || k === 'ramp';
    if (fast) { this.xKm = (this.xKm || 0) + Math.abs(v.vx) * dt / 1000; this.offT = 0; return; }
    if (!this.xKm) return;
    const inPA = PA.inLot(v.pos.x, v.pos.z, 30) || Math.hypot(v.pos.x - 17800, v.pos.z + 200) < 450; // rest areas are inside the expressway
    if (!inPA) { this.offT = (this.offT || 0) + dt; } else { this.offT = 0; return; }
    if (this.offT < 1.2) return;
    const km = this.xKm; this.xKm = 0; if (km < 1) return;
    const kei = v.car.plate === 'kei' || v.car.plate === 'keiCommercial';
    let fare = Math.min(1950, Math.round((300 + km * 29.52) / 10) * 10); if (kei) fare = Math.round(fare * 0.82 / 10) * 10;
    if (this.paidAt && performance.now() - this.paidAt < 1800000) { this.paidAt = 0; g.audio?.sfx('etc_beep'); g.audio?.speak('ご利用、ありがとうございました。', 'ja-JP', { role: 'etc', seed: 2, force: true }); return; }
    g.money -= fare; g.stats.tolls += fare;
    g.audio?.sfx('etc_beep');
    setTimeout(() => g.audio?.speak(`料金は、${fare}円です。`, 'ja-JP', { role: 'etc', seed: 2, force: true }), 450);
    g.ui.toast(t('game.toll.etc', { fare: fare.toLocaleString('ja-JP') }), 'toll');
  }
  update(dt) {
    const g = this.g, v = g.vehicle;
    this.exitFare(dt);
    for (const L of this.lanes) {
      L.open += Math.max(-dt * 1.6, Math.min(dt * 2.2, L.target - L.open));
      L.pivot.rotation.x = -L.open * Math.PI / 2 * 0.98;
      L.col.y1 = L.open > 0.6 ? -0.5 : 1.2; // passable when raised
      if (L.target > 0) { L.closeT -= dt; if (L.closeT <= 0 && !this.nearCar(L)) L.target = 0; }
      if (!v || g.mode !== 'drive') continue;
      const rel = v.pos.clone().sub(L.pos); const along = -rel.dot(L.dir); // >0 before the bar (approaching)
      const lat = rel.dot(L.left);
      if (Math.abs(lat) > 1.9 || along < -6 || along > 40) { if (L.state !== 'idle' && along < -6) L.state = 'idle'; continue; }
      const kei = v.car.plate === 'kei' || v.car.plate === 'keiCommercial';
      const heading = v.forward.dot(L.dir) > 0.5;
      if (!heading) continue;
      if (L.state === 'idle' && along < 30) {
        L.state = 'approach';
        if (g.settings.etc) { g.audio?.sfx('etc_beep'); }
      }
      if (L.state === 'approach' && along < 12) {
        if (g.settings.etc) {
          const fare = FARES.etc[kei ? 'kei' : 'std'];
          L.target = 1; L.closeT = 3; L.state = 'passed';
          g.money -= fare; g.stats.tolls += fare; this.paidAt = performance.now();
          g.audio?.speak(`料金は、${fare}円です。`, 'ja-JP', { role: 'etc', seed: 2, force: true });
          g.ui.toast(t('game.toll.etc', { fare: fare.toLocaleString('ja-JP') }), 'toll');
          if (v.kmh > 25) g.ui.toast(t('game.toll.slow'), 'warn');
        } else if (L.type === 'etc') {
          L.state = 'blocked';
          g.audio?.speak('ETCカードが、確認できません。', 'ja-JP', { role: 'etc', seed: 2, force: true });
          g.ui.toast(t('game.toll.nocard'), 'warn', 5);
        } else { L.state = 'cash'; }
      }
      if ((L.state === 'cash' || L.state === 'blocked') && along < 8 && Math.abs(v.kmh) < 3) {
        L.waitT = (L.waitT || 0) + dt;
        g.ui.prompt('F', t('game.toll.pay', { fare: FARES.cash[kei ? 'kei' : 'std'].toLocaleString('ja-JP') }));
        if (g.input.act('interact') || L.waitT > 6) {
          const fare = FARES.cash[kei ? 'kei' : 'std'];
          g.money -= fare; g.stats.tolls += fare; L.waitT = 0;
          g.audio?.sfx('coin'); g.audio?.speak('ありがとうございました。お気をつけて。', 'ja-JP', { role: 'female', seed: 2 });
          L.target = 1; L.closeT = 4; L.state = 'passed';
          g.ui.toast(t('game.toll.paid', { fare: fare.toLocaleString('ja-JP') }), 'toll');
        }
      }
    }
  }
  nearCar(L) { const v = this.g.vehicle; return v && v.pos.distanceTo(L.pos) < 5; }
}
