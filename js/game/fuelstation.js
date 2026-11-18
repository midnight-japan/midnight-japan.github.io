// Full-service fuel station (v2.13.4) — the Japanese フルサービス routine at every city fuel station (city-worker.js
// pump islands → city.fuelNear). Stop beside a pump island and press F:
//   1. an attendant in uniform jogs out of the office: 「いらっしゃいませー！」
//   2. you choose the fuel — レギュラー / ハイオク / 軽油 (the right one for your car is marked 推奨; the wrong one is
//      refused, as a real attendant would) — and how much (満タン / ¥3,000 / 20 L)
//   3. he holds a cloth under the filler neck while it fills (no drips on your paint), the meter runs, he wipes the glass
//   4. he takes the money, walks out to the kerb, asks which way you're going (← / →), stops the traffic and waves you
//      out with 「オーライ、オーライ！ ありがとうございましたー！」
import * as THREE from 'three';
import { createHuman, randomOutfit } from './humans.js';
import { getLang } from '../i18n.js';

const PRICE = { regular: 174, high: 185, diesel: 154 }; // ¥ / litre (2025-ish Kanagawa)
const L3 = (ko, ja, en) => ({ ko, ja })[getLang()] || en;
const FUEL_NAME = { regular: () => L3('레귤러', 'レギュラー', 'Regular'), high: () => L3('하이옥', 'ハイオク', 'High-octane'), diesel: () => L3('경유', '軽油', 'Diesel') };

export class FuelStation {
  constructor(game) { this.g = game; this.job = null; this.el = null; }
  // the fuel a car takes: diesel engines (codes with a 'D'/'4M41'/'4JJ1' etc.), premium for sports engines, else regular
  fuelFor(car) {
    const c = car.engine?.code || '';
    if (car.engine?.type === 'EV') return null;
    if (/^(4M4|4JJ|4D|N04|1KD|2KD|1GD|J05|4HK)/.test(c) || /diesel|ディーゼル/i.test(car.name)) return 'diesel';
    if ((car.engine?.hp || 0) >= 180 || car.engine?.turbo || /RB|2JZ|13B|SR20|4G63|EJ|K20|F20C|B18|VQ|VR38|1LR|H22|FA24|C30A|JNC/.test(c)) return 'high';
    return 'regular';
  }
  canStart() {
    const g = this.g, v = g.vehicle; if (this.job || g.mode !== 'drive' || !v || Math.abs(v.kmh) > 3) return null;
    const f = g.world.city?.fuelNear?.(v.pos.x, v.pos.z, 7); if (!f) return null;
    return f;
  }
  start(f) {
    const g = this.g, v = g.vehicle, car = v.car, want = this.fuelFor(car);
    if (!want) { g.ui.toast(L3('전기차는 충전소를 이용하세요', '電気自動車は充電スタンドへ', 'EVs charge at a charging station'), 'info', 3); return; }
    v.handbrakeOn = true;
    const o = randomOutfit(); o.top = 'racing_jacket'; o.hair = 'cap'; o.topColor = ['#d4421a', '#1d5fbf', '#c81e2a', '#1d8a4a'][f.brand % 4]; // station uniform + cap
    let h; try { h = createHuman(o); } catch { h = null; }
    const nx = -f.tz, nz = f.tx; // office side
    const office = f.ox !== undefined ? new THREE.Vector3(f.ox, v.pos.y, f.oz) : new THREE.Vector3(f.x + nx * 7 + f.tx * 6, v.pos.y, f.z + nz * 7 + f.tz * 6);
    // the filler is on the car's left rear on most JDM cars (the attendant stands there)
    const yw = v.yaw, side = 1, fill = new THREE.Vector3(v.pos.x + Math.cos(yw) * 1.25 * side - Math.sin(yw) * (car.L / 2000 - 0.9), v.pos.y, v.pos.z - Math.sin(yw) * 1.25 * side - Math.cos(yw) * (car.L / 2000 - 0.9));
    if (h) { h.object.position.copy(office); g.scene.add(h.object); }
    this.job = { f, h, stage: 'come', t: 0, want, fill, office, pos: office.clone(), litres: 0, target: 0, yaw: 0 };
    g.audio?.speak?.('いらっしゃいませー！', 'ja-JP', { role: 'male' });
    g.ui.toast('「いらっしゃいませー！」', 'info', 2.5);
  }
  menu() {
    const g = this.g, j = this.job, car = g.vehicle.car, ui = document.getElementById('ui'); this.el?.remove();
    const el = document.createElement('div'); el.className = 'fuelmenu menu'; this.el = el;
    const b = k => `<button class="btn sm${k === j.want ? ' primary' : ''}" data-fuel="${k}">${FUEL_NAME[k]()} <small>¥${PRICE[k]}/L</small>${k === j.want ? `<em>${L3('추천', '推奨', 'recommended')}</em>` : ''}</button>`;
    el.innerHTML = `<h2>⛽ ${L3('주유 — 풀서비스', '給油 — フルサービス', 'Fuel — full service')}</h2>
      <p class="fm-q">「${L3('어떤 걸로 넣을까요?', '油種はどうなさいますか？', 'Which fuel would you like?')}」 <small>${esc(car.maker)} ${esc(car.name)} · ${esc(car.engine.code || '')}</small></p>
      <div class="fm-row">${['regular', 'high', 'diesel'].map(b).join('')}</div>
      <p class="fm-q">「${L3('얼마나 넣을까요?', 'どれくらい入れますか？', 'How much?')}」</p>
      <div class="fm-row"><button class="btn sm primary" data-amt="full">${L3('가득', '満タン', 'Fill up')}</button><button class="btn sm" data-amt="yen3000">¥3,000</button><button class="btn sm" data-amt="l20">20 L</button></div>
      <div class="fm-row"><button class="btn sm ghost" data-fuel="cancel">${L3('그만두기', 'やめる', 'Cancel')}</button></div>`;
    let fuel = j.want;
    el.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.fuel === 'cancel') { this.finish(true); return; }
      if (t.dataset.fuel) { fuel = t.dataset.fuel; el.querySelectorAll('[data-fuel]').forEach(x => x.classList.toggle('primary', x === t));
        if (fuel !== j.want) g.ui.toast(fuel === 'diesel' || j.want === 'diesel' ? L3('「손님, 이 차는 ' + FUEL_NAME[j.want]() + '입니다!」', '「お客様、こちらのお車は' + FUEL_NAME[j.want]() + 'です！」', '“Sir, this car takes ' + FUEL_NAME[j.want]() + '!”') : L3('「' + FUEL_NAME[j.want]() + '를 추천드려요」', '「' + FUEL_NAME[j.want]() + 'をおすすめします」', '“We’d recommend ' + FUEL_NAME[j.want]() + '.”'), 'warn', 3);
        return; }
      if (t.dataset.amt) { if ((fuel === 'diesel') !== (j.want === 'diesel')) { g.ui.toast(L3('잘못된 연료는 넣을 수 없어요', '誤給油はできません', 'Wrong fuel — the attendant refuses'), 'warn', 3); return; }
        const tank = car.cat === 'kei' ? 30 : (car.mass || 1300) > 1900 ? 75 : 50, need = Math.max(2, (1 - (g.vehicle.fuel ?? 0.5)) * tank);
        j.fuel = fuel; j.target = t.dataset.amt === 'full' ? need : t.dataset.amt === 'l20' ? Math.min(20, need) : Math.min(3000 / PRICE[fuel], need);
        j.stage = 'fill'; j.t = 0; el.remove(); this.el = null; g.ui.toast('「' + FUEL_NAME[fuel]() + (t.dataset.amt === 'full' ? L3(' 가득이요, 알겠습니다!」', '満タン、かしこまりました！」', ' — fill her up, right away!”') : L3(', 알겠습니다!」', '、かしこまりました！」', ', right away!”')), 'info', 2.5); } });
    ui.appendChild(el);
  }
  finish(cancel = false) {
    const g = this.g, j = this.job; if (!j) return; this.el?.remove(); this.el = null;
    if (j.h) { g.scene.remove(j.h.object); try { j.h.dispose(); } catch {} }
    if (g.vehicle) g.vehicle.handbrakeOn = false;
    this.job = null; if (cancel) g.ui.toast(L3('주유를 취소했어요', '給油をやめました', 'Refuelling cancelled'), 'info', 2);
  }
  walkTo(p, dt, speed = 2.2) { const j = this.job, d = p.clone().sub(j.pos); d.y = 0; const L = d.length(); if (L < 0.25) return true; const k = Math.min(1, speed * dt / L); j.pos.addScaledVector(d, k); j.yaw = Math.atan2(d.x, d.z); return false; }
  update(dt) {
    const g = this.g, j = this.job;
    if (!j) { const f = this.canStart(); if (f) { g.ui.prompt('F', L3('주유 (풀서비스)', '給油（フルサービス）', 'Refuel (full service)')); if (g.input.act('interact')) { g.input.consume?.('interact'); this.start(f); return true; } } return false; }
    if (g.mode !== 'drive' || !g.vehicle) { this.finish(true); return false; }
    j.t += dt; let action = 'idle', speed = 0;
    if (j.stage === 'come') { speed = 2.2; if (this.walkTo(j.fill, dt, 2.6)) { j.stage = 'ask'; j.t = 0; this.menu(); } else action = 'walk'; }
    else if (j.stage === 'ask') { const v = g.vehicle; j.yaw = Math.atan2(v.pos.x - j.pos.x, v.pos.z - j.pos.z); action = 'talk'; }
    else if (j.stage === 'fill') { // cloth under the filler neck: crouched at the flap while the litres run
      action = 'crouch'; const rate = 0.7; j.litres = Math.min(j.target, j.litres + rate * dt * 3.2);
      const tank = g.vehicle.car.cat === 'kei' ? 30 : 50; g.vehicle.fuel = Math.min(1, (g.vehicle.fuel ?? 0) + rate * dt * 3.2 / tank);
      g.ui.prompt('⛽', `${FUEL_NAME[j.fuel]()} ${j.litres.toFixed(1)} L · ¥${Math.round(j.litres * PRICE[j.fuel]).toLocaleString()}`);
      if (j.litres >= j.target - 0.01) { j.stage = 'wipe'; j.t = 0; g.ui.toast(L3('「유리도 닦아드릴게요」', '「お窓、お拭きしますねー」', '“I’ll give the windows a wipe.”'), 'info', 2.5); } }
    else if (j.stage === 'wipe') { const v = g.vehicle, front = new THREE.Vector3(v.pos.x + Math.sin(v.yaw) * (v.car.L / 2000 + 0.4), v.pos.y, v.pos.z + Math.cos(v.yaw) * (v.car.L / 2000 + 0.4));
      if (this.walkTo(front, dt, 1.8)) { action = 'wave'; if (j.t > 4) { const yen = Math.round(j.litres * PRICE[j.fuel]); g.money -= yen; g.ui.toast(`¥${yen.toLocaleString()} — ${L3('「감사합니다! 어느 쪽으로 가세요?」', '「ありがとうございます！どちらへ出られますか？」', '“Thank you! Which way are you heading?”')}`, 'info', 4); j.stage = 'dir'; j.t = 0; this.dirMenu(); } } else action = 'walk'; }
    else if (j.stage === 'dir') { action = 'talk'; }
    else if (j.stage === 'guide') { // out to the kerb, stops the traffic, waves you out
      const f = j.f, nx = -f.tz, nz = f.tx, kerb = new THREE.Vector3(f.x - nx * 9 + f.tx * j.dir * 4, g.vehicle.pos.y, f.z - nz * 9 + f.tz * j.dir * 4);
      if (this.walkTo(kerb, dt, 2.4)) { action = 'wave'; j.yaw = Math.atan2(g.vehicle.pos.x - j.pos.x, g.vehicle.pos.z - j.pos.z);
        if (!j.said) { j.said = 1; g.ui.toast('「オーライ、オーライ！ ありがとうございましたー！」', 'info', 4); g.audio?.speak?.('オーライ、オーライ！ありがとうございましたー！', 'ja-JP', { role: 'male' }); g.vehicle.handbrakeOn = false; }
        if (j.t > 14 || g.vehicle.pos.distanceTo(j.pos) > 40) this.finish(); } else action = 'walk'; }
    if (j.h) { j.h.object.position.copy(j.pos); j.h.object.rotation.y = j.yaw; try { j.h.update(dt, { speed: action === 'walk' ? 2.2 : 0, action }); } catch {} }
    return true;
  }
  dirMenu() {
    const ui = document.getElementById('ui'); this.el?.remove(); const el = document.createElement('div'); el.className = 'fuelmenu menu'; this.el = el;
    el.innerHTML = `<p class="fm-q">「${L3('어느 쪽으로 나가세요?', 'どちらへ出られますか？', 'Which way out?')}」</p><div class="fm-row"><button class="btn" data-dir="-1">← ${L3('왼쪽', '左へ', 'Left')}</button><button class="btn" data-dir="1">${L3('오른쪽', '右へ', 'Right')} →</button></div>`;
    el.addEventListener('click', e => { const t = e.target.closest('[data-dir]'); if (!t || !this.job) return; this.job.dir = +t.dataset.dir; this.job.stage = 'guide'; this.job.t = 0; el.remove(); this.el = null; });
    ui.appendChild(el);
  }
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
