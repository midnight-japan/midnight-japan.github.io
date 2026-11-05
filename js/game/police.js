// Kanagawa Prefectural Police behaviour: speed enforcement & pursuit on the expressway,
// revving warnings and the late-night Daikoku PA closure event (大黒PA閉鎖).
import * as THREE from 'three';
import { t } from '../i18n.js';
import { PA_RECT } from './roads.js';

const inPA = p => p.x > PA_RECT.x0 && p.x < PA_RECT.x1 && p.z > PA_RECT.z0 && p.z < PA_RECT.z1;

export class Police {
  constructor(game) {
    this.g = game; this.state = 'patrol'; this.t = 0; this.stillT = 0; this.lostT = 0;
    this.revCount = 0; this.revT = 0; this.warnT = 0;
    this.closure = { active: false, t: 0, nextCheck: 30 };
    this.siren = null;
    this.cones = null;
  }
  get unit() { return this.g.traffic?.patrol; }
  speedLimit(v) { const r = v.road; if (!r) return 50; return r.speed; }

  update(dt) {
    const g = this.g, v = g.vehicle, pol = this.unit;
    this.t += dt;
    if (!pol) return;
    if (!this.siren && g.audio?.ready) this.siren = g.audio.createSiren();
    // ── enforcement
    if (v && g.mode === 'drive' && this.state === 'patrol') {
      const over = v.kmh - this.speedLimit(v);
      const d = pol.pos.distanceTo(v.pos);
      if (over > ({ lenient: 60, strict: 25 }[g.settings?.police] ?? 40) && d < 140 && Math.abs(pol.pos.y - v.pos.y) < 4) this.startPursuit(over);
    }
    if (this.state === 'pursuit') this.pursue(dt, v, pol);
    // siren audio
    if (this.siren) this.siren.update(pol.pos, this.state === 'pursuit' ? (pol.pos.distanceTo(v?.pos || pol.pos) < 25 ? 'yelp' : 'wail') : pol.accident ? 'wail' : 'off');
    // ── revving in the PA (空ぶかし)
    if (v && g.mode === 'drive' && inPA(v.pos) && Math.abs(v.kmh) < 3 && v.engine.running) {
      if (v.engine.rpm > v.car.engine.redline * 0.75) { if (!this._revHigh) { this.revCount++; this._revHigh = true; this.revT = 20; } } else this._revHigh = false;
    }
    this.revT -= dt; if (this.revT <= 0) this.revCount = 0;
    this.warnT -= dt;
    if (this.revCount >= 3 && this.warnT <= 0) {
      this.warnT = 25; this.revCount = 0;
      g.audio?.speak('空ぶかしはやめてください。近隣の迷惑になります。', 'ja-JP');
      g.ui.toast(t('game.police.rev'), 'police');
      g.stats.warnings++;
    }
    // ── PA closure event (night 22:30–02:00)
    this.closureUpdate(dt);
  }

  startPursuit(over) {
    this.state = 'pursuit'; this.over = over; this.stillT = 0; this.lostT = 0;
    const pol = this.unit; pol.pursuit = true; pol.vDes = 45;
    this.g.ui.toast(t('game.police.pursuit'), 'police');
    this.g.audio?.speak('前の車、左に寄せて止まりなさい。', 'ja-JP');
    this._sayT = 12;
  }
  pursue(dt, v, pol) {
    if (!v || this.g.mode !== 'drive') { this.endPursuit(false); return; }
    // follow on the same road behind the player
    const d = pol.pos.distanceTo(v.pos);
    if (pol.mode === 'road') {
      const h = this.g.net.hits(v.pos.x, v.pos.z).find(h => h.road === pol.road && h.inside);
      if (h) {
        // match lane & keep ~14 m behind
        const lanes = pol.road.lanes.filter(l => l.dir === pol.dir);
        pol.lane = lanes.reduce((a, b) => Math.abs(b.lat - h.lat) < Math.abs(a.lat - h.lat) ? b : a);
        const behind = (h.s - pol.s) * pol.dir;
        pol.vDes = Math.max(5, Math.abs(v.vx) + (behind - 14) * 0.6);
        pol.stopAt = h.s - pol.dir * 12;
      } else pol.vDes = 40;
    }
    this._sayT -= dt;
    if (this._sayT <= 0) { this._sayT = 14; this.g.audio?.speak(Math.random() < 0.5 ? '前の車、止まりなさい。' : 'そこの車、速度超過です。左に寄せて停車しなさい。', 'ja-JP'); }
    if (Math.abs(v.kmh) < 4 && d < 35) { this.stillT += dt; if (this.stillT > 3) this.ticket(); }
    else this.stillT = 0;
    if (d > 650) { this.lostT += dt; if (this.lostT > 15) this.endPursuit(true); } else this.lostT = 0;
  }
  ticket() {
    const over = this.over;
    const fine = over >= 50 ? 100000 : over >= 40 ? 40000 : over >= 30 ? 25000 : 18000; // 反則金(普通車) approximation; ≥50 → 罰金相当
    this.g.money -= fine; this.g.stats.tickets++;
    this.g.ui.toast(t('game.police.ticket', { fine: fine.toLocaleString('ja-JP'), over: Math.round(over) }), 'police', 6);
    this.g.audio?.speak('速度超過です。今回は反則切符を切ります。安全運転でお願いします。', 'ja-JP');
    this.endPursuit(false);
  }
  endPursuit(escaped) {
    const pol = this.unit; if (pol) { pol.pursuit = false; pol.stopAt = undefined; pol.vDes = 22; }
    if (escaped) { this.g.ui.toast(t('game.police.lost'), 'police'); this.g.stats.escapes++; }
    this.state = 'patrol';
  }

  closureUpdate(dt) {
    const g = this.g, h = g.tod.hours, c = this.closure;
    const window = h > 22.5 || h < 2;
    c.nextCheck -= dt;
    if (!c.active && window && c.nextCheck <= 0) {
      c.nextCheck = 60;
      const crowd = g.traffic.meetCount();
      if (crowd > g.traffic.meetMax * 0.65 && Math.random() < 0.35) this.startClosure();
    }
    if (c.active) {
      c.t += dt;
      c.sayT = (c.sayT ?? 0) - dt;
      if (c.sayT <= 0 && g.vehicle && inPA(g.focus)) { c.sayT = 35; g.audio?.speak('大黒パーキングエリアは閉鎖します。駐車中の車両は速やかに退出してください。', 'ja-JP'); }
      if (!window && c.t > 120) this.endClosure();
    }
  }
  startClosure() {
    const g = this.g, c = this.closure; c.active = true; c.t = 0; c.sayT = 3;
    g.traffic.paClosed = true;
    g.world.paBoard?.userData?.setText?.(['大黒PA', '閉鎖中']);
    for (const b of g.world.boards) if (b !== g.world.paBoard) b.userData.setText?.(['大黒PA', '閉鎖']);
    // cones across the entrance ramp end
    const r = g.net.byId.pa_in; const grp = new THREE.Group();
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5a00, roughness: 0.6 }), stripe = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 });
    for (let i = -3; i <= 3; i++) { const p = r.at(r.length - 30, i * 1.1); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 14), coneMat); cone.position.copy(p).add(new THREE.Vector3(0, 0.35, 0)); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.1, 14), stripe); st.position.copy(cone.position).add(new THREE.Vector3(0, 0.05, 0)); grp.add(cone, st); }
    g.scene.add(grp); this.cones = grp;
    this.coneLine = { road: r, s: r.length - 30 };
    // a patrol car parks at the entrance with its beacon on
    const unit = g.traffic.cars.find(a => a.station);
    if (unit) { unit.closure = true; unit.pos.copy(r.at(r.length - 22, 0)); const tt = r.dirAt(r.length - 22); unit.yaw = Math.atan2(-tt.x, -tt.z); }
    g.ui.toast(t('game.police.closure'), 'police', 6);
    g.world.colliders.push(this.coneCol = { x: r.at(r.length - 30).x, z: r.at(r.length - 30).z, hx: 4, hz: 0.4, c: Math.cos(Math.atan2(r.dirAt(r.length - 30).x, r.dirAt(r.length - 30).z)), s: Math.sin(Math.atan2(r.dirAt(r.length - 30).x, r.dirAt(r.length - 30).z)), y0: -1, y1: 2, kind: 'cones' });
  }
  endClosure() {
    const g = this.g; this.closure.active = false; g.traffic.paClosed = false;
    g.world.paBoard?.userData?.setText?.(['大黒PA', '営業中']);
    for (const b of g.world.boards) if (b !== g.world.paBoard) b.userData.setText?.(['大黒PA', '混雑']);
    if (this.cones) g.scene.remove(this.cones);
    const i = g.world.colliders.indexOf(this.coneCol); if (i >= 0) g.world.colliders.splice(i, 1);
    const unit = g.traffic.cars.find(a => a.station && a.closure); if (unit) { unit.closure = false; const p = g.world.policeBays[0]; unit.pos.copy(p); unit.yaw = Math.PI; }
  }
}
