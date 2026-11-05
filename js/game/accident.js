// Traffic accidents (事故): when the player hits an AI car hard enough, that car stops with its hazards on,
// the driver gets out and checks on you, calls 110, and a Kanagawa police unit responds — a patrol car on the
// expressway, or an officer on foot from the PA police post. Leaving the scene = 当て逃げ → pursuit.
import * as THREE from 'three';
import { t } from '../i18n.js';
import { createHuman, randomOutfit, defaultOutfit } from './humans.js';
import { PA_RECT } from './roads.js';

const inPA = p => p.x > PA_RECT.x0 && p.x < PA_RECT.x1 && p.z > PA_RECT.z0 && p.z < PA_RECT.z1;
const POLICE_OUTFIT = () => ({ ...defaultOutfit(), top: 'suit', topColor: '#1e2c4e', accentColor: '#e3c84b', bottom: 'chinos', bottomColor: '#1e2c4e', shoes: 'boots', shoeColor: '#121418', hair: 'cap', hairColor: '#1e2c4e' });

export class Accidents {
  constructor(game) { this.g = game; this.list = []; this.cool = 0; }

  /** called by main when the player's vehicle reports a crash */
  onCrash(impact) {
    const g = this.g, tr = g.traffic; if (!tr || this.cool > 0) return;
    // the AI car that was just hit
    const ai = tr.cars.filter(a => a.hitBy !== undefined && tr.t - a.hitBy < 0.25 && !a.police && !a.incident && !a.pursuit)
      .sort((a, b) => a.pos.distanceToSquared(g.vehicle.pos) - b.pos.distanceToSquared(g.vehicle.pos))[0];
    if (!ai || impact < 3) return;
    this.cool = 4;
    const inc = { ai, t: 0, stage: 'stop', impact, pos: ai.pos.clone(), driver: null, officer: null, unit: null, said: {} };
    ai.incident = inc; ai.model.lights.hazard = true;
    ai.vDesSaved = ai.vDes; ai.vDes = 0;
    if (ai.mode === 'road') ai.stopAt = ai.s + ai.dir * 2;
    this.list.push(inc);
    g.ui.toast(t('game.acc.crash'), 'warn', 5);
    setTimeout(() => g.ui.toast(t('game.acc.tipHazard'), 'info', 6), 1800);
  }

  update(dt) {
    this.cool = Math.max(0, this.cool - dt);
    for (const inc of [...this.list]) this.step(inc, dt);
  }

  step(inc, dt) {
    const g = this.g, ai = inc.ai, v = g.vehicle;
    inc.t += dt;
    if (!g.traffic.cars.includes(ai)) return this.finish(inc);
    if (ai.mode === 'road') { ai.v = Math.max(0, ai.v - 9 * dt); ai.stopAt = ai.s + ai.dir * 0.5; }
    ai.model.lights.hazard = true;
    const me = g.mode === 'walk' && g.player ? g.player.pos : v?.pos;
    const dMe = me ? me.distanceTo(ai.pos) : 999;
    // hit and run
    if (inc.stage !== 'done' && dMe > 320 && g.mode === 'drive') {
      g.ui.toast(t('game.acc.hitrun'), 'police', 6);
      g.audio?.speak('当て逃げの車両、止まりなさい！', 'ja-JP');
      if (g.police && g.police.state === 'patrol') g.police.startPursuit(45);
      return this.finish(inc);
    }
    switch (inc.stage) {
      case 'stop':
        if (ai.v < 0.4 && inc.t > 1.5) { this.spawnDriver(inc); inc.stage = 'check'; inc.st = 0; }
        break;
      case 'check': {
        inc.st += dt;
        const d = inc.driver; this.walkTo(d, me && dMe < 40 ? me : ai.pos, dt, 1.4, 2.2);
        if (inc.st > 2 && !inc.said.ok) { inc.said.ok = 1; g.audio?.speak('大丈夫ですか！？お怪我はありませんか？', 'ja-JP'); g.ui.toast(t('game.acc.driver1'), 'info', 5); }
        if (inc.st > 7 && !inc.said.call) { inc.said.call = 1; d.action = 'phone'; g.audio?.speak('今、警察に電話しますね。', 'ja-JP'); g.ui.toast(t('game.acc.call'), 'police', 5); this.dispatch(inc); inc.stage = 'wait'; }
        break;
      }
      case 'wait': {
        const d = inc.driver; d.speed = 0; d.action = inc.t % 20 < 8 ? 'phone' : 'idle';
        const arrived = this.policeStep(inc, dt);
        if (arrived) { inc.stage = 'report'; inc.st = 0; g.audio?.speak('神奈川県警です。事故の状況を確認します。', 'ja-JP'); g.ui.toast(t('game.acc.police'), 'police', 6); }
        break;
      }
      case 'report': {
        inc.st += dt;
        if (inc.officer) { inc.officer.action = 'talk'; inc.officer.speed = 0; this.face(inc.officer, me || ai.pos); }
        if (inc.driver) { inc.driver.action = 'talk'; }
        if (inc.st > 10) {
          const fine = inc.impact > 12 ? 12000 : 0; // 安全運転義務違反 (approx.) for a hard hit
          if (fine) { g.money -= fine; }
          g.ui.toast(t(fine ? 'game.acc.doneFine' : 'game.acc.done', { fine: fine.toLocaleString('ja-JP') }), 'police', 7);
          g.audio?.speak('事故証明の手続きをしました。この後も安全運転でお願いします。', 'ja-JP');
          g.stats.accidents = (g.stats.accidents || 0) + 1;
          inc.stage = 'leave'; inc.st = 0;
        }
        break;
      }
      case 'leave': {
        inc.st += dt;
        if (inc.driver) { const back = this.walkTo(inc.driver, ai.pos, dt, 1.3, 1.2); if (back || inc.st > 8) { this.removeHuman(inc.driver); inc.driver = null; } }
        if (inc.officer) { const home = inc.officerHome || ai.pos; if (this.walkTo(inc.officer, home, dt, 1.5, 1.5) || inc.st > 25) { this.removeHuman(inc.officer); inc.officer = null; } }
        if (!inc.driver && inc.st > 3) {
          ai.vDes = ai.vDesSaved || 15; ai.stopAt = undefined; ai.model.lights.hazard = inc.st < 9;
          if (inc.st > 9 && !inc.officer) return this.finish(inc);
        }
        if (inc.unit && inc.st > 6) { inc.unit.stopAt = undefined; inc.unit.vDes = 22; inc.unit.accident = false; }
        break;
      }
    }
    for (const h of [inc.driver, inc.officer]) if (h) { h.h.update(dt, { speed: h.speed, action: h.action }); h.h.object.position.copy(h.pos); h.h.object.rotation.y = h.yaw; }
  }

  spawnDriver(inc) {
    const ai = inc.ai, side = new THREE.Vector3(Math.cos(ai.yaw), 0, -Math.sin(ai.yaw)); // driver side (RHD → right)
    const pos = ai.pos.clone().addScaledVector(side, -(ai.radius + 0.6)); pos.y = ai.pos.y;
    inc.driver = this.makeHuman(randomOutfit(), pos, ai.yaw);
  }
  makeHuman(outfit, pos, yaw) {
    let h; try { h = createHuman(outfit); } catch { h = createHuman(defaultOutfit()); }
    h.object.position.copy(pos); this.g.scene.add(h.object);
    return { h, pos: h.object.position, yaw, speed: 0, action: 'idle' };
  }
  removeHuman(x) { if (!x) return; this.g.scene.remove(x.h.object); x.h.dispose?.(); }
  face(x, p) { x.yaw = Math.atan2(p.x - x.pos.x, p.z - x.pos.z); }
  walkTo(x, p, dt, sp, stopR) {
    if (!x) return true;
    const dx = p.x - x.pos.x, dz = p.z - x.pos.z, d = Math.hypot(dx, dz);
    if (d < stopR) { x.speed = 0; if (x.action === 'walk' || x.action === 'run') x.action = 'idle'; return true; }
    x.yaw = Math.atan2(dx, dz); x.speed = sp; x.action = sp > 2.5 ? 'run' : 'walk';
    x.pos.x += dx / d * sp * dt; x.pos.z += dz / d * sp * dt; x.pos.y += (p.y - x.pos.y) * Math.min(1, dt * 3);
    return false;
  }

  dispatch(inc) {
    const g = this.g, ai = inc.ai, tr = g.traffic;
    inc.dispatchT = 0;
    if (ai.mode === 'road' && tr.patrol && !tr.patrol.pursuit) {
      // patrol car comes up behind the accident on the same carriageway with beacon on
      const u = tr.patrol, r = ai.road, lane = r.lanes.filter(l => l.dir === ai.dir).sort((a, b) => b.lat - a.lat)[0] || ai.lane;
      const s0 = ai.s - ai.dir * 420;
      if (s0 > 5 && s0 < r.length - 5) { tr.placeOnRoad(u, r, lane, s0); u.v = 20; }
      u.vDes = 27; u.accident = true; u.stopAt = ai.s - ai.dir * 14; u.model.lights.beacon = true;
      inc.unit = u;
    } else {
      // officer on foot from the Daikoku police post
      const bay = g.world.policeBays?.[0] || new THREE.Vector3(-110, 0, -60);
      const home = bay.clone().add(new THREE.Vector3(2, 0, 4)); home.y = g.world.groundY?.(home.x, home.z) ?? ai.pos.y;
      inc.officerHome = home;
      inc.officer = this.makeHuman(POLICE_OUTFIT(), home.clone(), 0);
      if (!inPA(ai.pos)) inc.officer.pos.copy(ai.pos.clone().add(new THREE.Vector3(30, 0, 30)));
    }
    g.ui.toast(t('game.acc.dispatched'), 'police', 5);
  }
  policeStep(inc, dt) {
    inc.dispatchT += dt;
    const ai = inc.ai;
    if (inc.unit) {
      const u = inc.unit; u.model.lights.beacon = true;
      if (this.g.police?.siren && u.pos.distanceTo(ai.pos) > 60) this.g.police._accSiren = true;
      if (u.pos.distanceTo(ai.pos) < 24 && u.v < 1) {
        if (!inc.officer) { const p = u.pos.clone(); p.x += 1.5; inc.officer = this.makeHuman(POLICE_OUTFIT(), p, u.yaw); }
        return this.walkTo(inc.officer, ai.pos, dt, 1.4, 3) ;
      }
      if (inc.dispatchT > 70) { inc.unit = null; } // gave up → foot officer
      return false;
    }
    if (!inc.officer) { this.dispatch(inc); return false; }
    return this.walkTo(inc.officer, ai.pos, dt, 3.2, 3.5);
  }
  finish(inc) {
    const ai = inc.ai;
    this.removeHuman(inc.driver); this.removeHuman(inc.officer);
    if (ai) { ai.incident = null; ai.model.lights.hazard = false; ai.stopAt = undefined; ai.vDes = ai.vDesSaved || ai.vDes || 15; }
    if (inc.unit) { inc.unit.accident = false; inc.unit.stopAt = undefined; inc.unit.vDes = 22; inc.unit.model.lights.beacon = false; }
    this.list.splice(this.list.indexOf(inc), 1);
  }
}
