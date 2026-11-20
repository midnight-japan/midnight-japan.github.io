// Traffic accidents (事故): when the player hits an AI car hard enough, that car is visibly wrecked (crumpled panels,
// shattered glass on the road, steam / smoke from the engine bay, bonnet sprung, hazards on) and stops. The player's
// car takes no damage from it (js/game/traffic.js no longer reports the contact as a hit on the player's body).
// v2.16: what happens next depends on the crash —
//   injured  the driver stays in the car; a passer-by calls 119 and an ambulance (js/game/ambulance.js) comes,
//            the paramedics load the driver onto a stretcher and take them away; the wreck is left behind
//   angry    the other driver gets out shouting and walks up to you; on foot next to them, F = ビンタ (a cartoon
//            slap): they reel, then calm down and drive off — or just walk away
//   check    (rare) the old behaviour: they get out, ask if you're OK, F to talk it over / call the police
//   stay     most drivers just sit there with the hazards on for a while and then limp on
// Leaving the scene of a talk / police case = 当て逃げ → pursuit.
import * as THREE from 'three';
import { t } from '../i18n.js';
import { createHuman, defaultOutfit, randomOutfit } from './humans.js';
import { createPerson } from './people.js';
import { Ambulances, L } from './ambulance.js';
import { PA_RECT } from './roads.js';

const inPA = p => p.x > PA_RECT.x0 && p.x < PA_RECT.x1 && p.z > PA_RECT.z0 && p.z < PA_RECT.z1;
const POLICE_OUTFIT = () => ({ ...defaultOutfit(), top: 'suit', topColor: '#1e2c4e', accentColor: '#e3c84b', bottom: 'chinos', bottomColor: '#1e2c4e', shoes: 'boots', shoeColor: '#121418', hair: 'cap', hairColor: '#1e2c4e' });
const ANGRY = [
  ['おい！どこ見て運転してんだよ！', 'Hey! Where the hell were you looking?!', '야! 어딜 보고 운전하는 거야!'],
  ['ふざけんなよ、新車なんだぞこれ！', 'Are you kidding me? This car is brand new!', '장난해? 이거 새 차라고!'],
  ['降りてこいよ！', 'Get out here!', '내려 봐!'],
  ['保険入ってんだろうな！？', 'You\'d better be insured!', '보험은 들었겠지?!'],
];
const CALM = [['……す、すみません。言い過ぎました。', '…S-sorry. I went too far.', '…죄, 죄송합니다. 제가 너무했네요.'], ['いってぇ…もういいよ、帰る。', 'Ow… forget it, I\'m going home.', '아야… 됐어, 집에 갈래.']];
const say3 = a => L({ ja: a[0], en: a[1], ko: a[2] });

// ─────────────────────────────────────────────────────────── wreck FX ──
let SMOKE_TEX = null;
function smokeTex() {
  if (SMOKE_TEX) return SMOKE_TEX;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); SMOKE_TEX = new THREE.CanvasTexture(c); return SMOKE_TEX;
}
// safety glass that has crazed into a white web: frosted, pale, no longer see-through
let CRAZED = null;
const crazedMat = () => CRAZED || (CRAZED = new THREE.MeshStandardMaterial({ color: 0xc9d2d6, roughness: 0.55, metalness: 0.1, transparent: true, opacity: 0.86, side: THREE.DoubleSide }));
let SHARD = null;
const shardMat = () => SHARD || (SHARD = new THREE.PointsMaterial({ color: 0xe8f2f6, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false }));

class Wreck {
  constructor(g, ai, hit, vin) {
    this.g = g; this.ai = ai; this.t = 0; this.level = Math.min(1, vin / 14);
    // smoke / steam puffs from the engine bay
    this.puffs = []; this.emitT = 0;
    this.group = new THREE.Group(); g.scene.add(this.group);
    // glass: crash side window + windscreen craze over, shards scatter on the road
    let n = 0;
    ai.model.root.traverse(o => {
      if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material];
      if (!ms.some(m => m?.userData?.mjGlass || /glass|window|windscreen|windshield/i.test(m?.name || ''))) return;
      if (vin < 7 && Math.random() < 0.5) return;
      o.userData.wreckMat = o.material;
      o.material = Array.isArray(o.material) ? o.material.map(m => (m?.userData?.mjGlass || /glass|window/i.test(m?.name || '')) ? crazedMat() : m) : crazedMat(); n++;
    });
    const N = Math.round(90 + 220 * this.level), P = new Float32Array(N * 3), y = (ai.pos.y || 0) + 0.02;
    for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, r = Math.random() ** 0.6 * (1.2 + this.level * 1.8); P[i * 3] = hit.x + Math.cos(a) * r; P[i * 3 + 1] = y + Math.random() * 0.01; P[i * 3 + 2] = hit.z + Math.sin(a) * r; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(P, 3));
    this.shards = new THREE.Points(pg, shardMat()); this.group.add(this.shards);
    // bonnet springs open on a frontal hit
    if (ai.model.parts?.hood && vin > 6) ai.model.parts.hood.target = 0.2 + Math.random() * 0.25;
    ai.model.lights.hazard = true;
  }
  update(dt, focus) {
    this.t += dt; const ai = this.ai;
    const near = focus ? ai.pos.distanceToSquared(focus) < 220 * 220 : true;
    // smoke: dense grey at first, thinning to wisps of steam over ~2 minutes
    const rate = near ? (this.level > 0.3 ? 9 : 4) * Math.max(0.15, 1 - this.t / 140) : 0;
    this.emitT -= dt;
    if (rate > 0 && this.emitT <= 0 && this.puffs.length < 40) {
      this.emitT = 1 / rate;
      const f = new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw));
      const m = new THREE.SpriteMaterial({ map: smokeTex(), color: this.level > 0.5 && this.t < 60 ? 0x5a5c60 : 0xb8bcc0, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(m); s.position.copy(ai.pos).addScaledVector(f, ai.halfL * 0.62); s.position.y += 0.85; s.position.x += (Math.random() - 0.5) * 0.6; s.position.z += (Math.random() - 0.5) * 0.6;
      s.userData = { life: 0, max: 2.6 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 0.35, vz: (Math.random() - 0.5) * 0.35, s0: 0.5 + Math.random() * 0.3 };
      this.group.add(s); this.puffs.push(s);
    }
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const s = this.puffs[i], u = s.userData; u.life += dt; const k = u.life / u.max;
      if (k >= 1) { s.removeFromParent(); s.material.dispose(); this.puffs.splice(i, 1); continue; }
      s.position.x += u.vx * dt + 0.25 * dt; s.position.z += u.vz * dt; s.position.y += (1.1 - 0.6 * k) * dt;
      s.scale.setScalar(u.s0 + k * 2.4); s.material.opacity = Math.min(1, k * 6) * (1 - k) * (0.55 + 0.25 * this.level);
    }
    ai.model.lights.hazard = true;
  }
  dispose() {
    for (const s of this.puffs) s.material.dispose(); this.puffs = [];
    this.shards.geometry.dispose(); this.group.removeFromParent();
  }
}

export class Accidents {
  constructor(game) { this.g = game; this.list = []; this.cool = 0; this.wrecks = []; this.amb = new Ambulances(game); }

  /** traffic.js: the player's car hit an AI car — dent it (always, whatever the damage setting) and wreck it on a real crash */
  wreck(ai, hit, vin) {
    const fx = this.g.fx;
    if (vin < 2.2 || !ai?.model) return;
    if (fx?.dentJob) { fx.dq = fx.dq || []; if (fx.dq.length < 8) fx.dq.push(fx.dentJob(ai.model, hit, Math.min(24, vin * 1.6 + 3))); }
    if (vin >= 4 && !ai.wreck && !ai.police) { ai.wreck = new Wreck(this.g, ai, hit, vin); this.wrecks.push(ai.wreck); }
    else if (ai.wreck) ai.wreck.level = Math.min(1, ai.wreck.level + vin / 30);
  }

  /** called by main when the player's vehicle reports a crash */
  onCrash(impact) {
    const g = this.g, tr = g.traffic; if (!tr || this.cool > 0) return;
    // the AI car that was just hit
    const ai = tr.cars.filter(a => a.hitBy !== undefined && tr.t - a.hitBy < 0.25 && !a.police && !a.incident && !a.pursuit)
      .sort((a, b) => a.pos.distanceToSquared(g.vehicle.pos) - b.pos.distanceToSquared(g.vehicle.pos))[0];
    // v2.16: the closing speed of the hit itself counts (the player's own speed has already dropped by the time main.js reports it)
    if (ai?.lastHit && performance.now() - ai.lastHit.t < 500) impact = Math.max(impact, ai.lastHit.vin);
    if (!ai || impact < 5) return; // a light bump (< 18 km/h) is not an accident scene
    this.cool = 4;
    // what the other driver does (most stay in the car; a hard hit often hurts them)
    const r = Math.random(), hard = impact > 9;
    const kind = hard ? (r < 0.55 ? 'injured' : r < 0.72 ? 'angry' : r < 0.82 ? 'check' : 'stay') : (r < 0.15 ? 'injured' : r < 0.4 ? 'angry' : r < 0.55 ? 'check' : 'stay');
    const inc = { ai, t: 0, stage: 'stop', kind, impact, pos: ai.pos.clone(), driver: null, officer: null, unit: null, said: {}, voice: { role: Math.random() < 0.55 ? 'male' : 'female', seed: Math.random() * 10 }, mood: 50 };
    ai.incident = inc; ai.model.lights.hazard = true;
    if (!ai.wreck) { ai.wreck = new Wreck(g, ai, ai.lastHit || { x: ai.pos.x, z: ai.pos.z }, Math.max(4.5, impact)); this.wrecks.push(ai.wreck); }
    ai.vDesSaved = ai.vDes; ai.vDes = 0;
    if (ai.mode === 'road') ai.stopAt = ai.s + ai.dir * 2;
    this.list.push(inc);
    g.ui.toast(t('game.acc.crash'), 'warn', 5);
    setTimeout(() => g.ui.toast(t('game.acc.tipHazard'), 'info', 6), 1800);
  }

  // the other driver of an accident you are standing next to (on foot) — main.js shows 「F 話す」
  talkable(pos) { return this.list.find(inc => inc.kind === 'check' && !inc.talked && inc.stage === 'check' && inc.driver && inc.driver.pos.distanceTo(pos) < 3) || null; }
  update(dt) {
    this.cool = Math.max(0, this.cool - dt);
    for (const inc of [...this.list]) this.step(inc, dt);
    const focus = this.g.focus;
    for (const w of [...this.wrecks]) {
      // the car is gone (recycled / despawned) → its scene goes with it
      if (!this.g.traffic?.cars.includes(w.ai)) { w.dispose(); this.wrecks.splice(this.wrecks.indexOf(w), 1); continue; }
      w.update(dt, focus);
      // an abandoned wreck is towed away (despawned) once nobody is looking any more
      if (w.ai.abandoned && !w.ai.incident && focus && w.ai.pos.distanceTo(focus) > 180) this.g.traffic.remove(w.ai);
    }
    this.amb.update(dt);
    this.slapPrompt();
  }

  // v2.16: angry driver next to the player on foot → 「F ビンタ」 (main.js's walk prompt is set earlier in the frame)
  slapPrompt() {
    const g = this.g, p = g.mode === 'walk' ? g.player : null; if (!p) return;
    const inc = this.list.find(i => i.kind === 'angry' && i.stage === 'angry' && i.driver && i.driver.pos.distanceTo(p.pos) < 2.4);
    if (!inc) return;
    g.ui.prompt('F', L({ ja: 'ビンタする', en: 'Slap', ko: '뺨 때리기' }));
    if (g.input.act('interact')) this.slap(inc);
  }
  slap(inc) {
    const g = this.g, p = g.player, d = inc.driver; inc.stage = 'slapped'; inc.st = 0;
    // face each other; the player's open-hand swing, the other driver reels from it a beat later
    if (p) { p.yaw = Math.atan2(d.pos.x - p.pos.x, d.pos.z - p.pos.z); p.h?.playOnce?.('slap', 0.6); }
    this.face(d, p?.pos || d.pos);
    setTimeout(() => {
      if (!inc.driver) return;
      inc.driver.h.oneShot ? (inc.hitDur = inc.driver.h.oneShot('hit')) : inc.driver.h.playOnce?.('wave', 1);
      this.slapSound(d.pos); g.shake = Math.max(g.shake || 0, 0.15);
      g.ui.toast(L({ ja: 'パシッ！', en: '*SLAP!*', ko: '찰싹!' }), 'warn', 2);
    }, 260);
  }
  slapSound(pos) {
    const a = this.g.audio, ctx = a?.ctx; if (!ctx || !a.bus?.sfx) return;
    try {
      const n = Math.floor(ctx.sampleRate * 0.12), buf = ctx.createBuffer(1, n, ctx.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.018));
      const s = ctx.createBufferSource(); s.buffer = buf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.7;
      const gn = ctx.createGain(); gn.gain.value = 1.4; s.connect(f); f.connect(gn); gn.connect(a.bus.sfx); s.start();
    } catch {}
  }
  shout(inc, line) { const g = this.g; g.ui.toast('「' + say3(line) + '」', 'warn', 3.5); g.audio?.speak(line[0], 'ja-JP', inc.voice); }

  step(inc, dt) {
    const g = this.g, ai = inc.ai, v = g.vehicle;
    inc.t += dt;
    if (!g.traffic.cars.includes(ai)) return this.finish(inc);
    if (ai.mode === 'road') { ai.v = Math.max(0, ai.v - 9 * dt); ai.stopAt = ai.s + ai.dir * 0.5; }
    else ai.v = Math.max(0, ai.v - 9 * dt);
    ai.model.lights.hazard = true;
    const me = g.mode === 'walk' && g.player ? g.player.pos : v?.pos;
    const dMe = me ? me.distanceTo(ai.pos) : 999;
    // hit and run (only once a talk / police case is under way — the injured are taken care of by the ambulance anyway)
    if ((inc.stage === 'check' || inc.stage === 'wait' || inc.stage === 'talk' || inc.stage === 'report') && dMe > 320 && g.mode === 'drive') {
      g.ui.toast(t('game.acc.hitrun'), 'police', 6);
      g.audio?.speak('当て逃げの車両、止まりなさい！', 'ja-JP', { role: 'police' });
      return this.finish(inc);
    }
    switch (inc.stage) {
      case 'stop':
        if (ai.v < 0.4 && inc.t > 1.5) {
          inc.st = 0;
          if (inc.kind === 'injured') { inc.stage = 'injured'; ai.abandoned = true; }
          else if (inc.kind === 'stay') inc.stage = 'stay';
          else { this.spawnDriver(inc); inc.stage = inc.kind === 'angry' ? 'angry' : 'check'; }
        }
        break;
      case 'stay': // sits it out with the hazards on, then limps on
        inc.st += dt; if (inc.st > 10 + Math.random() * 0.1) { inc.stage = 'leave'; inc.st = 0; }
        break;
      case 'injured': {
        inc.st += dt;
        if (inc.st > 3.5 && !inc.called) {
          inc.called = true;
          g.ui.toast(L({ ja: '通行人が119番通報しました。救急車が向かっています。', en: 'A passer-by called 119 — an ambulance is on its way.', ko: '행인이 119에 신고했습니다. 구급차가 오고 있습니다.' }), 'warn', 6);
          inc.job = this.amb.dispatch({ ai, patientId: ai.seatD?.userData?.person, onDone: () => { inc.stage = 'leave'; inc.st = 0; } });
          if (!inc.job) { inc.stage = 'leave'; inc.st = 0; }
        }
        break;
      }
      case 'angry': {
        inc.st += dt; const d = inc.driver;
        // storms up to you (stops an arm's length away) and shouts
        const at = me && dMe < 40 ? me : ai.pos; const arrived = this.walkTo(d, at, dt, 1.6, 1.5);
        if (arrived) { d.action = 'argue'; d.speed = 0; if (me) this.face(d, me); }
        if (inc.st > 1.5 && (inc.shoutT = (inc.shoutT ?? 0) - dt) <= 0) { inc.shoutT = 4.5; this.shout(inc, ANGRY[(inc.nShout = (inc.nShout || 0) + 1) % ANGRY.length]); }
        if (inc.st > 35) { inc.stage = 'leave'; inc.st = 0; } // ran out of steam
        break;
      }
      case 'slapped': {
        inc.st += dt; const d = inc.driver; d.speed = 0; d.action = inc.st < (inc.hitDur || 1.4) + 0.3 ? 'hit' : 'idle';
        if (inc.st > 2.2 && !inc.said.calm) {
          inc.said.calm = 1; const walkOff = Math.random() < 0.4; inc.walkOff = walkOff;
          g.ui.toast('「' + say3(CALM[walkOff ? 1 : 0]) + '」', 'info', 4); g.audio?.speak(CALM[walkOff ? 1 : 0][0], 'ja-JP', inc.voice);
        }
        if (inc.st > 3.5) {
          if (inc.walkOff) { // leaves the car where it is and walks away down the street
            ai.abandoned = true; const f = new THREE.Vector3(Math.sin(ai.yaw), 0, Math.cos(ai.yaw)); inc.away = d.pos.clone().addScaledVector(f, -60); inc.stage = 'walkoff'; inc.st = 0;
          } else { inc.stage = 'leave'; inc.st = 0; }
        }
        break;
      }
      case 'walkoff': {
        inc.st += dt; const d = inc.driver;
        if (this.walkTo(d, inc.away, dt, 1.3, 1) || inc.st > 40) { this.removeHuman(d); inc.driver = null; return this.finish(inc); }
        break;
      }
      case 'check': {
        inc.st += dt;
        const d = inc.driver; this.walkTo(d, me && dMe < 40 ? me : ai.pos, dt, 1.4, 2.2);
        if (inc.st > 2 && !inc.said.ok) { inc.said.ok = 1; g.audio?.speak('大丈夫ですか！？お怪我はありませんか？', 'ja-JP', inc.voice); g.ui.toast(t('game.acc.driver1'), 'info', 5); }
        // v2.2: a conversation only when YOU start it (walk up to the driver and press F — see talkable())
        if (inc.wantTalk && !inc.talked && d && g.dialog && !g.dialog.open) {
          inc.talked = true; inc.stage = 'talk'; d.action = 'talk'; d.speed = 0; if (me) this.face(d, me);
          g.dialog.accident(inc, res => this.resolve(inc, res)); break;
        }
        // v2.5.3: no police unless you ask for it in the conversation — left alone, the other driver shrugs and drives on
        if (inc.st > 14 && !inc.said.call) { inc.said.call = 1; g.audio?.speak('気をつけてくださいね。', 'ja-JP', inc.voice); inc.stage = 'leave'; inc.st = 0; }
        break;
      }
      case 'talk': { const d = inc.driver; if (d) { d.speed = 0; d.action = 'talk'; if (me) this.face(d, me); } break; }
      case 'wait': {
        const d = inc.driver; d.speed = 0; d.action = inc.t % 20 < 8 ? 'phone' : 'idle';
        const arrived = this.policeStep(inc, dt);
        if (arrived) { inc.stage = 'report'; inc.st = 0; g.audio?.speak('神奈川県警です。事故の状況を確認します。', 'ja-JP', { role: 'police', megaphone: false, seed: 3 }); g.ui.toast(t('game.acc.police'), 'police', 6); }
        break;
      }
      case 'report': {
        inc.st += dt;
        if (inc.officer) { inc.officer.action = 'talk'; inc.officer.speed = 0; this.face(inc.officer, me || ai.pos); }
        if (inc.driver) { inc.driver.action = 'talk'; }
        if (inc.st > 10) {
          const fine = inc.assault ? 300000 : inc.mood > 65 ? 0 : inc.impact > 12 ? 12000 : 0; // 暴行 / 安全運転義務違反 (approx.)
          if (fine) { g.money -= fine; }
          g.ui.toast(t(fine ? 'game.acc.doneFine' : 'game.acc.done', { fine: fine.toLocaleString('ja-JP') }), 'police', 7);
          g.audio?.speak('事故証明の手続きをしました。この後も安全運転でお願いします。', 'ja-JP', { role: 'police', megaphone: false, seed: 3 });
          g.stats.accidents = (g.stats.accidents || 0) + 1;
          inc.stage = 'leave'; inc.st = 0;
        }
        break;
      }
      case 'leave': {
        inc.st += dt;
        if (inc.driver) { const back = this.walkTo(inc.driver, this.doorPos(ai), dt, 1.3, 0.6); if (back || inc.st > 10) { this.removeHuman(inc.driver); inc.driver = null; ai.driverOut = false; g.audio?.sfx?.('door_close', { position: ai.pos }); } }
        if (inc.officer) { const home = inc.officerHome || ai.pos; if (this.walkTo(inc.officer, home, dt, 1.5, 1.5) || inc.st > 25) { this.removeHuman(inc.officer); inc.officer = null; } }
        if (!inc.driver && inc.st > 3) {
          if (ai.abandoned) { if (inc.st > 6 && !inc.officer) return this.finish(inc); }
          else {
            ai.vDes = (ai.vDesSaved || 15) * (ai.wreck ? 0.55 : 1); ai.stopAt = undefined; ai.model.lights.hazard = inc.st < 9 || !!ai.wreck;
            if (inc.st > 9 && !inc.officer) return this.finish(inc);
          }
        }
        if (inc.unit && inc.st > 6) { inc.unit.stopAt = undefined; inc.unit.vDes = 22; inc.unit.accident = false; }
        break;
      }
    }
    for (const h of [inc.driver, inc.officer]) if (h) { h.h.update(dt, { speed: h.speed, action: h.action }); h.h.object.position.copy(h.pos); h.h.object.rotation.y = h.yaw; }
  }

  // outcome of the conversation with the other driver
  resolve(inc, r) {
    const g = this.g; inc.mood = r.mood ?? inc.mood;
    if (r.kind === 'settled') { g.ui.toast(t('game.acc.settled', { amt: r.amount.toLocaleString('ja-JP') }), 'info', 6); inc.stage = 'leave'; inc.st = 0; g.stats.accidents = (g.stats.accidents || 0) + 1; return; }
    if (r.kind === 'leave') { inc.stage = 'check'; inc.st = 8; return; } // they call the police; driving off = hit and run
    if (r.kind === 'assault') { inc.assault = true; g.ui.toast(t('game.acc.assault'), 'police', 6); }
    inc.said.call = 1; if (inc.driver) inc.driver.action = 'phone'; this.dispatch(inc); inc.stage = 'wait';
  }
  doorPos(ai) { const side = new THREE.Vector3(Math.cos(ai.yaw), 0, -Math.sin(ai.yaw)); const p = ai.pos.clone().addScaledVector(side, -(ai.radius + 0.6)); p.y = ai.pos.y; return p; }
  spawnDriver(inc) {
    const ai = inc.ai, pos = this.doorPos(ai);
    // the same person who was at the wheel gets out
    inc.driver = this.makeHuman(null, pos, ai.yaw + Math.PI / 2, ai.seatD?.userData?.person);
    ai.driverOut = true; this.g.audio?.sfx?.('door_open', { position: pos });
  }
  makeHuman(outfit, pos, yaw, id) {
    let h;
    if (outfit) { try { h = createPerson({ type: 'police', outfit, mirror: false }); } catch { h = createHuman(defaultOutfit()); } } // v2.16.1: 警察官 in navy uniform + cap (procedural only while loading)
    else { try { h = createPerson({ id, type: 'driver', outfit: randomOutfit() }); } catch { h = createHuman(defaultOutfit()); } }
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
    if (ai) {
      ai.incident = null; ai.stopAt = undefined;
      if (ai.abandoned) { ai.vDes = 0; ai.driverOut = true; ai.model.lights.hazard = true; } // left where it is until towed
      else { ai.model.lights.hazard = !!ai.wreck; ai.vDes = (ai.vDesSaved || ai.vDes || 15) * (ai.wreck ? 0.55 : 1); ai.driverOut = false; }
    }
    if (inc.unit) { inc.unit.accident = false; inc.unit.stopAt = undefined; inc.unit.vDes = 22; inc.unit.model.lights.beacon = false; }
    this.list.splice(this.list.indexOf(inc), 1);
  }
}
