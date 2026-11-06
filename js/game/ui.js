// DOM UI: loading, title, garage (car/colour/stance/plate/strobe), HUD (speedo, minimap, radio),
// pause & settings, car-action menu, konbini shop, outfit editor, map, photo mode, touch controls.
import * as THREE from 'three';
import { CARS, CAR_BY_ID, CATEGORIES } from '../../data/cars.js';
import { GAME, LANGS } from '../../data/meta.js';
import { t, pick, setLang, getLang } from '../i18n.js';
import { displayName, currentUser } from '../account.js';
import { PLATE_REGIONS, PLATE_KANA, PLATE_TYPES, plateCanvas, formatNumber } from './plates.js';
import { STROBE_MODES } from './carmodel.js';
import { OUTFIT_OPTIONS } from './humans.js';
import { PA_RECT, MAP } from './roads.js';
import { ASSIST_SETTING_KEYS, assistsFromSettings, applyDifficulty } from './vehicle.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');

const SHOP = [
  { id: 'onigiri', ja: 'おにぎり（鮭）', price: 160, act: 'drink' }, { id: 'coffee', ja: 'ホットコーヒー', price: 120, act: 'drink' },
  { id: 'karaage', ja: 'からあげ棒', price: 230, act: 'drink' }, { id: 'melonpan', ja: 'メロンパン', price: 150, act: 'drink' },
  { id: 'energy', ja: 'エナジードリンク', price: 210, act: 'drink' }, { id: 'tea', ja: '緑茶 500ml', price: 150, act: 'drink' },
];
const FOOD = [{ id: 'ramen', ja: '醤油ラーメン', price: 900 }, { id: 'curry', ja: 'カツカレー', price: 1050 }, { id: 'teishoku', ja: '唐揚げ定食', price: 1000 }, { id: 'soba', ja: 'かけそば', price: 550 }];
const VENDING = [{ id: 'cancoffee', ja: '缶コーヒー（あったか〜い）', price: 130 }, { id: 'cola', ja: 'コーラ', price: 160 }, { id: 'water', ja: '天然水', price: 120 }, { id: 'pocari', ja: 'スポーツドリンク', price: 160 }];

export class UI {
  constructor(game) {
    this.g = game; this.root = $('#ui'); this.paused = false; this.toasts = []; this.mapOpen = false; this.photo = false;
    this.isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    this.build();
    addEventListener('langchange', () => this.relabel());
  }
  build() {
    const r = this.root;
    r.innerHTML = `
      <div id="loading" class="screen show"><div class="load-box"><div class="logo">MIDNIGHT <b>JAPAN</b><small>ミッドナイト・ジャパン</small></div><div class="bar"><i></i></div><div class="load-msg"></div><div class="ver">v${GAME.version}</div></div></div>
      <div id="title" class="screen"><div class="title-box">
        <div class="logo big">MIDNIGHT <b>JAPAN</b><small>ミッドナイト・ジャパン · v${GAME.version}</small></div>
        <div class="who"></div>
        <div class="lobby-steps"><span data-i18n="game.lobby.s1"></span><i>›</i><span data-i18n="game.lobby.s2"></span><i>›</i><span data-i18n="game.lobby.s3"></span><i>›</i><span data-i18n="game.lobby.s4"></span></div>
        <button class="btn primary big" data-a="play"><span data-i18n="game.title.start"></span><small class="sub" data-i18n="game.title.startSub"></small></button>
        <button class="btn" data-a="quick"><span data-i18n="game.title.quick"></span> <small class="sub" id="quick-car"></small></button>
        <label class="spawn-sel"><span data-i18n="game.spawn.label"></span> <select id="t-spawn">
          <option value="pa" data-i18n="game.spawn.pa"></option><option value="bay" data-i18n="game.spawn.bay"></option>
          <option value="umi" data-i18n="game.spawn.umi"></option><option value="futo" data-i18n="game.spawn.futo"></option></select></label>
        <div class="lobby-online" id="lobby-online"></div>
        <div class="lobby-row"><button class="btn sm" data-a="settings">⚙ <span data-i18n="game.menu.settings"></span></button>
        <button class="btn sm" data-a="controls">🎮 <span data-i18n="game.menu.controls"></span></button>
        <a class="btn sm ghost" href="index.html">🌐 <span data-i18n="game.title.site"></span></a></div>
        <p class="hint" data-i18n="game.title.hint"></p>
        <div class="title-ver">MIDNIGHT JAPAN v${GAME.version} · ${GAME.build}</div>
      </div></div>
      <div id="garage" class="screen side"><div class="panel">
        <div class="ph"><h2 data-i18n="game.garage.title"></h2><button class="x" data-a="garageBack">✕</button></div>
        <div class="tabs" id="g-cats"></div>
        <div class="carlist" id="g-list"></div>
        <div class="carinfo" id="g-info"></div>
        <div class="gsec"><h3 data-i18n="game.garage.paint"></h3><div class="swatches" id="g-colors"></div>
          <div class="row"><input type="color" id="g-color"><select id="g-finish"><option value="metallic">Metallic</option><option value="solid">Solid</option><option value="pearl">Pearl</option><option value="matte">Matte</option></select>
          <label class="mini"><span data-i18n="game.garage.rim"></span><input type="color" id="g-rim" value="#b9bcc0"></label></div></div>
        <div class="gsec"><h3 data-i18n="game.garage.stance"></h3>
          <label class="sl"><span data-i18n="game.garage.camberF"></span><input type="range" id="g-cf" min="-12" max="2" step="0.5"><b></b></label>
          <label class="sl"><span data-i18n="game.garage.camberR"></span><input type="range" id="g-cr" min="-14" max="2" step="0.5"><b></b></label>
          <label class="sl"><span data-i18n="game.garage.ride"></span><input type="range" id="g-ride" min="-0.08" max="0.06" step="0.005"><b></b></label>
          <label class="sl"><span data-i18n="game.garage.track"></span><input type="range" id="g-track" min="-0.03" max="0.06" step="0.005"><b></b></label></div>
        <div class="gsec"><h3 data-i18n="game.garage.plate"></h3><canvas id="g-plate" width="330" height="165"></canvas>
          <div class="row"><select id="g-pregion"></select><input id="g-pcls" maxlength="3" size="3"><select id="g-pkana"></select><input id="g-pnum" type="number" min="1" max="9999" style="width:80px"><button class="btn sm" data-a="plateRandom">🎲</button></div>
          <p class="note" id="g-ptype"></p></div>
        <div class="gsec"><h3 data-i18n="game.garage.strobe"></h3><select id="g-strobe"></select></div>
        <div class="gsec"><h3 data-i18n="game.set.transmission"></h3><select id="g-trans"><option value="auto" data-i18n="game.trans.auto"></option><option value="manual" data-i18n="game.trans.manual"></option><option value="manual_clutch" data-i18n="game.trans.manual_clutch"></option></select><p class="note" data-i18n="game.trans.note"></p></div>
        <button class="btn primary wide" data-a="drive" data-i18n="game.garage.drive"></button>
      </div></div>
      <div id="hud" class="hidden">
        <div class="tl"><div class="loc"></div><div class="clock"></div><div class="money"></div></div>
        <canvas id="minimap" width="200" height="200"></canvas>
        <div class="speedo"><canvas id="speedo" width="260" height="260"></canvas><div class="icons"></div></div>
        <div class="radio-banner"></div>
        <div class="prompt"><kbd></kbd><span></span></div>
        <div class="toasts"></div>
        <button class="online-pill" data-a="chat" id="online-pill"></button>
        <div class="chat" id="chat"><div class="log"></div><form><input maxlength="120" autocomplete="off" enterkeyhint="send"><button type="submit">↵</button></form></div>
        <div class="fps"></div>
        <button class="hud-menu" data-a="pause" aria-label="menu">☰</button>
      </div>
      <div id="tutorial" class="screen"><div class="tut-box">
        <div class="tut-step"></div><div class="tut-icon"></div><h2 class="tut-h"></h2><p class="tut-p"></p>
        <div class="tut-dots"></div>
        <div class="tut-btns"><button class="btn ghost sm" data-a="tutSkip" data-i18n="game.tut.skip"></button><button class="btn primary" data-a="tutNext"></button></div>
      </div></div>
      <div id="carmenu" class="popup"><h3 data-i18n="game.car.menu"></h3><div class="grid">
        <button data-c="doorD" data-i18n="game.car.doorD"></button><button data-c="doorP" data-i18n="game.car.doorP"></button>
        <button data-c="winD" data-i18n="game.car.winD"></button><button data-c="winP" data-i18n="game.car.winP"></button>
        <button data-c="hood" data-i18n="game.car.hood"></button><button data-c="trunk" data-i18n="game.car.trunk"></button>
        <button data-c="strobe" data-i18n="game.car.strobe"></button><button data-c="hazard" data-i18n="game.car.hazard"></button>
        <button data-c="sigL" data-i18n="game.car.sigL"></button><button data-c="sigR" data-i18n="game.car.sigR"></button>
        <button data-c="fog" data-i18n="game.car.fog"></button><button data-c="high" data-i18n="game.car.high"></button>
        <button data-c="engine" data-i18n="game.car.engine"></button><button data-c="regen" data-i18n="game.car.regen"></button>
        <button data-c="beacon" data-i18n="game.car.beacon"></button><button data-c="radio" data-i18n="game.car.radio"></button>
      </div><button class="btn sm" data-a="closeCar">✕</button></div>
      <div id="pause" class="screen dim"><div class="menu">
        <h2 data-i18n="game.menu.paused"></h2>
        <button class="btn primary" data-a="resume" data-i18n="game.menu.resume"></button>
        <button class="btn" data-a="garage" data-i18n="game.menu.garage"></button>
        <button class="btn" data-a="outfit" data-i18n="game.menu.outfit"></button>
        <button class="btn" data-a="settings" data-i18n="game.menu.settings"></button>
        <button class="btn" data-a="controls" data-i18n="game.menu.controls"></button>
        <div class="row center"><button class="btn sm" data-a="timeDay" data-i18n="game.menu.day"></button><button class="btn sm" data-a="timeDusk" data-i18n="game.menu.dusk"></button><button class="btn sm" data-a="timeNight" data-i18n="game.menu.night"></button></div>
        <button class="btn" data-a="respawn" data-i18n="game.menu.respawn"></button>
        <div class="stats"></div>
        <a class="btn ghost" href="index.html" data-i18n="game.menu.quit"></a>
      </div></div>
      <div id="settings" class="screen dim"><div class="menu wide"><h2 data-i18n="game.menu.settings"></h2><div class="sgrid" id="s-grid"></div><button class="btn primary" data-a="settingsClose" data-i18n="game.menu.back"></button></div></div>
      <div id="controls" class="screen dim"><div class="menu wide"><h2 data-i18n="game.menu.controls"></h2><div id="c-body"></div><button class="btn primary" data-a="controlsClose" data-i18n="game.menu.back"></button></div></div>
      <div id="outfit" class="screen side"><div class="panel"><div class="ph"><h2 data-i18n="game.menu.outfit"></h2><button class="x" data-a="outfitClose">✕</button></div><div id="o-body"></div></div></div>
      <div id="shop" class="popup"><h3 id="shop-title"></h3><div id="shop-list"></div><button class="btn sm" data-a="shopClose">✕</button></div>
      <div id="map" class="screen dim"><canvas id="bigmap"></canvas><div class="mapctl"><button class="btn sm" data-a="mapIn">＋</button><button class="btn sm" data-a="mapOut">－</button><button class="btn sm" data-a="mapMe">◎</button><button class="btn sm" data-a="mapAll">⤢</button></div><div class="maphint">M · Wheel / Pinch · Drag</div><button class="btn sm mapx" data-a="mapClose">✕</button></div>
      <div id="touch" class="hidden">
        <div class="t-drive">
          <div class="t-steer"><button data-t="left">◀</button><button data-t="right">▶</button></div>
          <div class="t-pedals"><button class="t-hb" data-t="handbrake">HB</button><button class="t-brake" data-t="brake">BRAKE</button><button class="t-gas" data-t="throttle">GAS</button></div>
          <div class="t-side"><button data-tap="shiftUp">▲</button><button data-tap="shiftDown">▼</button><button data-tap="interact">🚪</button><button data-tap="camera">🎥</button><button data-tap="lights">💡</button><button data-tap="radioNext">📻</button><button data-tap="carMenu">⚙</button><button data-tap="horn">📯</button></div>
        </div>
        <div class="t-walk"><div class="t-stick"><i></i></div><div class="t-side"><button data-tap="interact">F</button><button data-t="run">🏃</button><button data-tap="camera">🎥</button></div></div>
      </div>
      <div id="fatal" class="screen"><div class="menu"><h2>⚠</h2><p id="fatal-msg"></p><a class="btn" href="index.html">← Home</a></div></div>`;
    this.relabel();
    r.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { this.g.audio?.sfx('ui_click'); this.action(b.dataset.a, b); } const c = e.target.closest('[data-c]'); if (c) this.carAction(c.dataset.c); });
    this.wireTouch();
    this.speedo = $('#speedo').getContext('2d'); this.mini = $('#minimap').getContext('2d'); $('#minimap').addEventListener('click', () => this.toggleMap(true));
  }
  relabel() { this.root.querySelectorAll('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n)); }
  loading(p, msg) { $('#loading .bar i').style.width = (p * 100) + '%'; $('#loading .load-msg').textContent = msg || ''; if (p >= 1) setTimeout(() => $('#loading').classList.remove('show'), 300); }
  fatal(msg) { $('#fatal').classList.add('show'); $('#fatal-msg').textContent = msg; }
  screens(show) { for (const id of ['title', 'garage', 'pause', 'settings', 'controls', 'outfit', 'map', 'tutorial']) $('#' + id).classList.toggle('show', show === id); }
  showTitle() { this.screens('title'); $('#hud').classList.add('hidden'); $('#title .who').innerHTML = `${esc(t('game.title.hello'))} <b>${esc(displayName())}</b>` + (currentUser() ? '' : ` · <a href="account.html">${esc(t('game.title.login'))}</a>`); this.touchMode(null); const sp = $('#t-spawn'); if (sp) { sp.value = this.g.settings.spawn || 'pa'; sp.onchange = () => { this.g.settings.spawn = sp.value; this.g.saveSettings?.(); }; } const qc = CAR_BY_ID[this.g.garage.car]; $('#quick-car').textContent = qc ? `${qc.maker} ${qc.name}` : ''; this.updateOnline(); }
  showHUD() { this.screens(null); $('#hud').classList.remove('hidden'); this.touchMode(this.g.mode); this.paused = false; }
  touchMode(mode) {
    const on = this.g.settings.touch === 'on' || (this.g.settings.touch === 'auto' && this.isTouch);
    $('#touch').classList.toggle('hidden', !on || !mode);
    $('#touch').dataset.mode = mode || '';
  }

  action(a, b) {
    const g = this.g;
    switch (a) {
      case 'quick': g.quickStart(); break;
      case 'tutNext': this.tutStep(this.tut + 1); break;
      case 'tutSkip': this.endTutorial(); break;
      case 'chat': this.openChat(); break;
      case 'play': g.unlockAudio(); g.openGarage(); break;
      case 'drive': g.closeGarage(true); break;
      case 'garageBack': g.closeGarage(false); break;
      case 'pause': this.togglePause(); break;
      case 'resume': this.togglePause(false); break;
      case 'garage': {
        const v = g.vehicle; const inPA = v && v.pos.x > PA_RECT.x0 && v.pos.x < PA_RECT.x1 && v.pos.z > PA_RECT.z0 && v.pos.z < PA_RECT.z1;
        if (!inPA || Math.abs(v.kmh) > 3) { this.toast(t('game.garage.onlyPA'), 'warn'); break; }
        if (g.mode === 'walk') g.enterCar();
        this.paused = false; g.openGarage(); break;
      }
      case 'outfit': this.screens('outfit'); this.buildOutfit(); break;
      case 'outfitClose': this.screens('pause'); break;
      case 'settings': this.prevScreen = g.mode === 'title' ? 'title' : 'pause'; this.screens('settings'); this.buildSettings(); break;
      case 'settingsClose': this.screens(this.prevScreen || 'pause'); if (this.prevScreen === 'title') this.showTitle(); break;
      case 'controls': this.prevScreen = g.mode === 'title' ? 'title' : 'pause'; this.screens('controls'); this.buildControls(); break;
      case 'controlsClose': this.screens(this.prevScreen || 'pause'); if (this.prevScreen === 'title') this.showTitle(); break;
      case 'timeDay': g.tod.setHours(12); break;
      case 'timeDusk': g.tod.setHours(17.6); break;
      case 'timeNight': g.tod.setHours(22); break;
      case 'respawn': if (g.mode === 'walk') g.enterCar(); g.respawnPA(); this.togglePause(false); break;
      case 'closeCar': $('#carmenu').classList.remove('show'); break;
      case 'shopClose': $('#shop').classList.remove('show'); break;
      case 'mapClose': this.toggleMap(false); break;
      case 'mapIn': this.mapZoom(1.6); break;
      case 'mapOut': this.mapZoom(1 / 1.6); break;
      case 'mapMe': this.mapCenterMe(); break;
      case 'mapAll': this.mapFitAll(); break;
      case 'plateRandom': { const cur = g.carSetup(g.previewId).plate; const p = { ...cur, region: PLATE_REGIONS[Math.floor(Math.random() * 8)], kana: PLATE_KANA[Math.floor(Math.random() * 30)], num: 1 + Math.floor(Math.random() * 9999) }; g.applyPreview({ plate: p }); this.fillPlate(); break; }
    }
  }
  togglePause(force) {
    const on = force ?? !this.paused;
    if (this.g.mode !== 'drive' && this.g.mode !== 'walk') return;
    this.paused = on; this.screens(on ? 'pause' : null);
    if (on) { const s = this.g.stats; $('#pause .stats').innerHTML = `${esc(t('game.stats.km'))} ${s.km.toFixed(1)} km · ${esc(t('game.stats.tolls'))} ${yen(s.tolls)} · ${esc(t('game.stats.tickets'))} ${s.tickets}`; }
  }

  // ───── garage ─────
  showGarage() {
    this.screens('garage'); $('#hud').classList.add('hidden'); this.touchMode(null);
    const g = this.g;
    const cats = CATEGORIES;
    this.gcat = this.gcat || CAR_BY_ID[g.garage.car]?.cat || 'jdm';
    $('#g-cats').innerHTML = cats.map(c => `<button data-cat="${c}" class="${c === this.gcat ? 'on' : ''}">${esc(t('site.cat.' + c) !== 'site.cat.' + c ? t('site.cat.' + c) : c.toUpperCase())}</button>`).join('');
    $('#g-cats').onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; this.gcat = b.dataset.cat; this.showGarage(); };
    const list = CARS.filter(c => c.cat === this.gcat && c.playable !== false);
    $('#g-list').innerHTML = list.map(c => `<button data-car="${c.id}" class="${c.id === g.previewId || c.id === g.garage.car ? 'on' : ''}"><b>${esc(c.maker)} ${esc(c.name)}</b><small>${esc(c.chassis)} · ${c.year}</small></button>`).join('');
    $('#g-list').onclick = e => { const b = e.target.closest('[data-car]'); if (!b) return; g.previewCar(b.dataset.car); g.garage.car = b.dataset.car; this.showGarage(); };
    const id = g.previewId || g.garage.car, car = CAR_BY_ID[id];
    const S = g.carSetup(id);
    const e = car.engine;
    $('#g-info').innerHTML = `<h3>${esc(car.maker)} ${esc(car.name)} <small>${esc(car.chassis)}</small></h3><p>${esc(pick(car.desc))}</p>
      <div class="specs"><span>${e.type === 'EV' ? 'EV' : esc(e.code)}</span><span>${e.hp} PS</span><span>${e.nm} N·m</span><span>${car.mass} kg</span><span>${esc(car.drive)} · ${esc(t('site.drive.' + car.drive))}</span><span>${e.type === 'EV' ? 'EV' : esc(e.turbo ? t('site.eng.turbo') : t('site.eng.na'))}</span><span>${esc(car.maker)} · ${car.year}</span><span>${esc(car.trans.type)}${car.trans.gears.length > 1 ? ' ' + car.trans.gears.length + '速' : ''}</span></div>`;
    $('#g-colors').innerHTML = car.colors.map(c => `<button style="background:${c}" data-col="${c}" title="${c}"></button>`).join('');
    $('#g-colors').onclick = ev => { const b = ev.target.closest('[data-col]'); if (b) { g.applyPreview({ color: b.dataset.col }); $('#g-color').value = b.dataset.col; } };
    $('#g-color').value = S.color; $('#g-color').oninput = ev => g.applyPreview({ color: ev.target.value });
    $('#g-finish').value = S.finish; $('#g-finish').onchange = ev => g.applyPreview({ finish: ev.target.value });
    $('#g-rim').value = S.rim || '#b9bcc0'; $('#g-rim').oninput = ev => g.applyPreview({ rim: ev.target.value });
    const sl = (sel, key, fmt) => { const i = $(sel); i.value = S[key]; const out = i.nextElementSibling; out.textContent = fmt(+i.value); i.oninput = () => { out.textContent = fmt(+i.value); g.applyPreview({ [key]: +i.value }); }; };
    sl('#g-cf', 'camberF', v => v.toFixed(1) + '°'); sl('#g-cr', 'camberR', v => v.toFixed(1) + '°');
    sl('#g-ride', 'ride', v => (v * 1000).toFixed(0) + ' mm'); sl('#g-track', 'track', v => '+' + (v * 1000).toFixed(0) + ' mm');
    $('#g-strobe').innerHTML = STROBE_MODES.map(m => `<option value="${m}">${esc(t('game.strobe.' + m))}</option>`).join('');
    $('#g-strobe').value = S.strobe; $('#g-strobe').onchange = ev => { g.applyPreview({ strobe: ev.target.value }); g.preview.lights.strobe = ev.target.value; };
    $('#g-trans').value = g.settings.transmission; $('#g-trans').onchange = ev => { g.settings.transmission = ev.target.value; g.saveSettings(); };
    if (car.trans.type === 'EV') $('#g-trans').disabled = true; else $('#g-trans').disabled = false;
    // plate editor
    $('#g-pregion').innerHTML = PLATE_REGIONS.map(r => `<option>${r}</option>`).join('');
    $('#g-pkana').innerHTML = PLATE_KANA.map(k => `<option>${k}</option>`).join('');
    const upd = () => { const p = { ...g.carSetup(id).plate, region: $('#g-pregion').value, cls: $('#g-pcls').value.replace(/[^0-9A-Z]/gi, '').slice(0, 3) || '300', kana: $('#g-pkana').value, num: Math.max(1, Math.min(9999, +$('#g-pnum').value || 1)) }; g.applyPreview({ plate: p }); this.fillPlate(); };
    for (const s of ['#g-pregion', '#g-pcls', '#g-pkana', '#g-pnum']) $(s).onchange = upd;
    this.fillPlate();
    this.relabel();
  }
  fillPlate() {
    const g = this.g, p = g.carSetup(g.previewId).plate;
    $('#g-pregion').value = p.region; $('#g-pcls').value = p.cls; $('#g-pkana').value = p.kana; $('#g-pnum').value = p.num;
    const c = plateCanvas(p); const ctx = $('#g-plate').getContext('2d'); ctx.clearRect(0, 0, 330, 165); ctx.drawImage(c, 0, 0, 330, 165);
    $('#g-ptype').textContent = t('game.plate.' + p.type);
  }

  // ───── settings ─────
  buildSettings() {
    const g = this.g, s = g.settings;
    const sel = (key, opts, label, reload) => `<label><span>${esc(t(label))}${reload ? ' ↻' : ''}</span><select data-s="${key}" ${reload ? 'data-reload="1"' : ''}>${opts.map(([v, l]) => `<option value="${v}" ${String(s[key]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
    const rng = (key, label, min = 0, max = 1, step = 0.05) => `<label><span>${esc(t(label))}</span><input type="range" data-s="${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}"></label>`;
    const chk = (key, label) => `<label class="chk"><input type="checkbox" data-s="${key}" ${s[key] ? 'checked' : ''}><span>${esc(t(label))}</span></label>`;
    // driving difficulty / assists (labels fall back to built-in en/ko/ja text until the i18n keys exist)
    const tf = (k, f) => { const x = t(k); return x !== k ? x : typeof f === 'string' ? f : (f[getLang()] || f.en); };
    const selF = (key, opts, label, fb) => `<label><span>${esc(tf(label, fb))}</span><select data-s="${key}">${opts.map(([v, l, lf]) => `<option value="${v}" ${String(s[key]) === String(v) ? 'selected' : ''}>${esc(tf(l, lf))}</option>`).join('')}</select></label>`;
    const ON = { en: 'On', ko: '켜기', ja: 'オン' }, OFF = { en: 'Off', ko: '끄기', ja: 'オフ' }, SPORT = { en: 'Sport', ko: '스포츠', ja: 'スポーツ' };
    const assistHtml =
      selF('difficulty', [['beginner', 'game.diff.beginner', { en: 'Beginner', ko: '초보', ja: 'ビギナー' }], ['standard', 'game.diff.standard', { en: 'Standard', ko: '표준', ja: 'スタンダード' }], ['pro', 'game.diff.pro', { en: 'Pro', ko: '프로', ja: 'プロ' }], ['sim', 'game.diff.sim', { en: 'Simulation', ko: '시뮬레이션', ja: 'シミュレーション' }], ['custom', 'game.diff.custom', { en: 'Custom', ko: '사용자 지정', ja: 'カスタム' }]], 'game.set.difficulty', { en: 'Driving difficulty', ko: '주행 난이도', ja: '運転難易度' }) +
      selF('steerAssist', [['assisted', 'game.assist.assisted', { en: 'Assisted', ko: '보조', ja: 'アシスト' }], ['standard', 'game.assist.standard', { en: 'Standard', ko: '표준', ja: 'スタンダード' }], ['sim', 'game.assist.sim', { en: 'Simulation', ko: '시뮬레이션', ja: 'シミュレーション' }]], 'game.set.steerAssist', { en: 'Steering', ko: '조향', ja: 'ステアリング' }) +
      selF('stm', [['full', 'game.assist.on', ON], ['sport', 'game.assist.sport', SPORT], ['off', 'game.assist.off', OFF]], 'game.set.stm', { en: 'Stability control (STM)', ko: '자세 제어 (STM)', ja: '姿勢制御 (STM)' }) +
      selF('tcs', [['full', 'game.assist.on', ON], ['sport', 'game.assist.sport', SPORT], ['off', 'game.assist.off', OFF]], 'game.set.tcs', { en: 'Traction control (TCS)', ko: '트랙션 컨트롤 (TCS)', ja: 'トラクションコントロール (TCS)' }) +
      selF('abs', [['true', 'game.assist.on', ON], ['false', 'game.assist.off', OFF]], 'game.set.abs', 'ABS') +
      selF('police', [['lenient', 'game.police.lenient', { en: 'Lenient (+60 km/h)', ko: '관대 (+60 km/h)', ja: '寛容 (+60 km/h)' }], ['normal', 'game.police.normal', { en: 'Normal (+40 km/h)', ko: '보통 (+40 km/h)', ja: '標準 (+40 km/h)' }], ['strict', 'game.police.strict', { en: 'Strict (+25 km/h)', ko: '엄격 (+25 km/h)', ja: '厳しい (+25 km/h)' }]], 'game.set.police', { en: 'Police tolerance', ko: '경찰 단속 기준', ja: '取り締まり基準' });
    $('#s-grid').innerHTML =
      `<label><span>${esc(t('game.set.lang'))}</span><select id="s-lang">${LANGS.map(([c, n]) => `<option value="${c}" ${c === getLang() ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` +
      sel('quality', [['low', t('game.q.low')], ['medium', t('game.q.medium')], ['high', t('game.q.high')], ['ultra', t('game.q.ultra')]], 'game.set.quality', true) +
      sel('resScale', [[0.5, '50%'], [0.75, '75%'], [1, '100%']], 'game.set.res', true) +
      assistHtml +
      sel('transmission', [['auto', t('game.trans.auto')], ['manual', t('game.trans.manual')], ['manual_clutch', t('game.trans.manual_clutch')]], 'game.set.transmission') +
      sel('touch', [['auto', t('game.set.auto')], ['on', 'ON'], ['off', 'OFF']], 'game.set.touch') +
      sel('timeSpeed', [[1, t('game.set.time1')], [0.25, t('game.set.time025')], [0, t('game.set.time0')]], 'game.set.time') +
      chk('online', 'game.set.online') + chk('assist', 'game.set.assist') + chk('etc', 'game.set.etc') + chk('dj', 'game.set.dj') + chk('tilt', 'game.set.tilt') + chk('shake', 'game.set.shake') + chk('bloom', 'game.set.bloom') + chk('fps', 'game.set.fps') +
      rng('master', 'game.set.master') + rng('engine', 'game.set.engine') + rng('sfx', 'game.set.sfx') + rng('ambient', 'game.set.ambient') + rng('radio', 'game.set.radio');
    $('#s-lang').onchange = e => setLang(e.target.value).then(() => this.buildSettings());
    $('#s-grid').querySelectorAll('[data-s]').forEach(i => i.onchange = i.oninput = () => {
      const k = i.dataset.s; let v = i.type === 'checkbox' ? i.checked : i.type === 'range' ? +i.value : i.value;
      if (['resScale', 'timeSpeed'].includes(k)) v = +v;
      if (k === 'abs') v = v === 'true';
      s[k] = v; g.saveSettings(); g.applyVolumes();
      if (k === 'tilt') { g.input.tilt = v; if (v && typeof DeviceOrientationEvent?.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {}); }
      if (k === 'dj' && g.radio) g.radio.djVoice = v;
      if (k === 'online') { if (v && g.vehicle) g.online.start(); else if (!v) g.online.stop(); this.updateOnline(); }
      if (k === 'bloom') g.bloom.enabled = v && g.quality !== 'low';
      if (k === 'transmission' && g.vehicle && !g.vehicle.ev) { g.vehicle.mode = v; g.vehicle.gear = 0; g.vehicle.atSel = 'P'; }
      if (k === 'difficulty' || ASSIST_SETTING_KEYS.includes(k)) {
        const prevTrans = s.transmission;
        if (k === 'difficulty') applyDifficulty(s, v); else s.difficulty = 'custom';
        g.saveSettings();
        g.vehicle?.setAssists(assistsFromSettings(s));
        if (s.transmission !== prevTrans && g.vehicle && !g.vehicle.ev) { // keep the current gear when switching on the move
          const gv = g.vehicle; gv.mode = s.transmission;
          if (Math.abs(gv.vx) < 1) { gv.gear = 0; gv.atSel = 'P'; } else if (s.transmission === 'auto') { gv.atSel = gv.gear < 0 ? 'R' : 'D'; if (gv.gear === 0) gv.gear = 1; }
        }
        return this.buildSettings();
      }
      if (k === 'touch') this.touchMode(g.mode === 'drive' || g.mode === 'walk' ? g.mode : null);
      if (i.dataset.reload) this.toast(t('game.set.reload'), 'info', 4);
    });
  }
  buildControls() {
    const rows = [
      ['accel', 'W / ↑', 'RT', 'GAS'], ['brake', 'S / ↓', 'LT', 'BRAKE'], ['steer', 'A D / ← →', 'L-Stick', '◀ ▶ / tilt'], ['handbrake', 'Space', 'A', 'HB'],
      ['clutch', 'Shift', 'X', '—'], ['gear', 'E / Q · 1-7, 0=R, 9=N', 'RB / LB', '▲ ▼'], ['ignition', 'I', 'View', t('game.ctl.autostart')], ['interact', 'F', 'B / D-Pad ↓', '🚪 / F'],
      ['lights', 'L', 'D-Pad ↑', '💡'], ['horn', 'H', 'R3', '📯'], ['signals', 'Z / X / B', '—', '⚙'], ['fog', 'O', '—', '⚙'], ['chat', 'Enter', '—', '🌐'], ['camera', 'C (G = look back)', 'Y', '🎥'],
      ['radio', 'R (T = next station)', 'D-Pad → / ←', '📻'], ['carmenu', 'Tab', '—', '⚙'], ['strobe', 'K', '—', '⚙'], ['siren', 'P', '—', '⚙'], ['regen', 'N', '—', '⚙'],
      ['map', 'M', '—', '—'], ['photo', 'V', '—', '—'], ['pause', 'Esc', 'Menu', '☰'],
    ];
    $('#c-body').innerHTML = `<p class="note">${esc(t('game.ctl.easy'))}</p><table class="ctl"><thead><tr><th></th><th>⌨</th><th>🎮</th><th>📱</th></tr></thead><tbody>${rows.map(r => `<tr><th>${esc(t('game.ctl.' + r[0]))}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table>`;
  }
  buildOutfit() {
    const g = this.g, o = { ...g.outfit };
    const O = OUTFIT_OPTIONS;
    const opt = (key, list, labelKey) => `<label><span>${esc(t('game.outfit.' + labelKey))}</span><select data-o="${key}">${list.map(v => `<option value="${v}" ${o[key] === v ? 'selected' : ''}>${esc(t('game.outfit.v.' + v) !== 'game.outfit.v.' + v ? t('game.outfit.v.' + v) : v)}</option>`).join('')}</select></label>`;
    const cols = (key, list, labelKey) => `<div class="olab">${esc(t('game.outfit.' + labelKey))}</div><div class="swatches" data-oc="${key}">${list.map(c => `<button style="background:${c}" data-v="${c}" class="${o[key] === c ? 'on' : ''}"></button>`).join('')}</div>`;
    $('#o-body').innerHTML = opt('body', O.body, 'body') + cols('skin', O.skin, 'skin') + opt('hair', O.hair, 'hair') + cols('hairColor', O.hairColor, 'hairColor') +
      opt('top', O.top, 'top') + cols('topColor', O.colors, 'topColor') + cols('accentColor', O.colors, 'accent') + opt('bottom', O.bottom, 'bottom') + cols('bottomColor', O.colors, 'bottomColor') +
      opt('shoes', O.shoes, 'shoes') + cols('shoeColor', O.colors, 'shoeColor') + opt('accessory', O.accessory, 'accessory');
    const apply = () => g.setOutfit({ ...o });
    $('#o-body').querySelectorAll('[data-o]').forEach(s => s.onchange = () => { o[s.dataset.o] = s.value; apply(); });
    $('#o-body').querySelectorAll('[data-oc]').forEach(w => w.onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; o[w.dataset.oc] = b.dataset.v; w.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); apply(); });
    if (g.mode === 'drive') this.toast(t('game.outfit.hint'), 'info', 4);
  }

  // ───── in-game popups ─────
  toggleCarMenu() { $('#carmenu').classList.toggle('show'); }
  carAction(c) {
    const g = this.g, m = g.model, v = g.vehicle; if (!m) return;
    const drvLeft = m.parts.driverX > 0;
    const door = left => m.parts.doors.find(d => !d.rear && d.left === left);
    const tog = d => { if (!d) return; d.target = d.target ? 0 : 1; g.audio.sfx(d.target ? 'door_open' : 'door_close', { position: v.pos }); };
    switch (c) {
      case 'doorD': if (Math.abs(v.kmh) < 3) tog(door(drvLeft)); break;
      case 'doorP': if (Math.abs(v.kmh) < 3) tog(door(!drvLeft)); break;
      case 'winD': { const d = door(drvLeft); if (d?.window) { d.winTarget = d.winTarget ? 0 : 1; g.audio.sfx('window', { position: v.pos }); } else this.toast(t('game.car.nowindow'), 'info'); break; }
      case 'winP': { const d = door(!drvLeft); if (d?.window) { d.winTarget = d.winTarget ? 0 : 1; g.audio.sfx('window', { position: v.pos }); } break; }
      case 'hood': if (m.parts.hood && Math.abs(v.kmh) < 3) { m.parts.hood.target = m.parts.hood.target ? 0 : 1; g.audio.sfx(m.parts.hood.target ? 'hood_open' : 'hood_close', { position: v.pos }); } break;
      case 'trunk': if (m.parts.trunk && Math.abs(v.kmh) < 3) { m.parts.trunk.target = m.parts.trunk.target ? 0 : 1; g.audio.sfx(m.parts.trunk.target ? 'trunk_open' : 'trunk_close', { position: v.pos }); } break;
      case 'strobe': { const L = m.lights; L.strobe = STROBE_MODES[(STROBE_MODES.indexOf(L.strobe) + 1) % STROBE_MODES.length]; this.toast(t('game.car.strobe') + ': ' + t('game.strobe.' + L.strobe), 'info', 2); break; }
      case 'hazard': m.lights.hazard = !m.lights.hazard; break;
      case 'sigL': m.lights.left = !m.lights.left; m.lights.right = false; break;
      case 'sigR': m.lights.right = !m.lights.right; m.lights.left = false; break;
      case 'fog': m.lights.fog = !m.lights.fog; break;
      case 'high': m.lights.high = !m.lights.high; if (m.lights.high) m.lights.head = true; break;
      case 'engine': if (v.engine.running) v.stopEngine(); else v.startEngine(); break;
      case 'regen': if (v.ev) { v.regenLevel = (v.regenLevel + 1) % 4; this.toast(t('game.car.regen') + ': ' + t('game.regen.' + v.regenLevel), 'info', 2); } else this.toast(t('game.car.notEV'), 'info'); break;
      case 'beacon': if (v.car.cat === 'police') { m.lights.beacon = !m.lights.beacon; } else this.toast(t('game.car.notPolice'), 'info'); break;
      case 'radio': if (g.radio) { if (!g.radio.on) g.radio.power(true); else g.radio.next(); this.radioBanner(); } break;
    }
  }
  interaction(it) {
    const g = this.g;
    const list = it.type === 'shop' ? SHOP : it.type === 'food' ? FOOD : it.type === 'vending' || it.type === 'coffee' ? (it.type === 'coffee' ? [SHOP[1]] : VENDING) : null;
    if (it.type === 'toilet') { this.toast(t('game.walk.toiletDone'), 'info'); return; }
    if (it.type === 'ev') {
      const v = g.vehicle; if (v?.ev && v.pos.distanceTo(it.pos) < 8) { v.battery = 1; g.money -= 500; this.toast(t('game.walk.evDone'), 'info'); } else this.toast(t('game.walk.evNo'), 'info'); return;
    }
    if (!list) return;
    $('#shop-title').textContent = t('game.walk.' + it.type);
    $('#shop-list').innerHTML = list.map(x => `<button data-buy="${x.id}"><span>${esc(x.ja)}<small>${esc(t('game.item.' + x.id))}</small></span><b>${yen(x.price)}</b></button>`).join('');
    $('#shop-list').onclick = e => {
      const b = e.target.closest('[data-buy]'); if (!b) return;
      const x = list.find(i => i.id === b.dataset.buy);
      if (g.money < x.price) { this.toast(t('game.shop.nomoney'), 'warn'); return; }
      g.money -= x.price; g.audio.sfx(it.type === 'vending' ? 'vending' : 'coin');
      if (it.type === 'shop') g.audio.speak('ありがとうございましたー。', 'ja-JP');
      this.toast(t('game.shop.bought', { item: x.ja }), 'info');
      if (g.player) { g.player.hold = 'drink'; clearTimeout(this._holdT); this._holdT = setTimeout(() => { if (g.player) g.player.hold = null; }, 9000); }
      $('#shop').classList.remove('show');
    };
    $('#shop').classList.add('show');
  }
  toggleMap(force) {
    this.mapOpen = force ?? !this.mapOpen; $('#map').classList.toggle('show', this.mapOpen);
    if (!this.mapOpen) return;
    const cv = $('#bigmap'), dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    if (!this.mv) { this.mv = { x: 0, z: 0, k: 0.35 * dpr }; this.wireMap(cv); this.mapCenterMe(); } else this.drawBigMap();
  }
  mapPos() { return this.g.mode === 'walk' ? this.g.player?.pos : this.g.vehicle?.pos; }
  mapZoom(f, cx, cy) { const cv = $('#bigmap'), m = this.mv; cx ??= cv.width / 2; cy ??= cv.height / 2; const wx = m.x + (cx - cv.width / 2) / m.k, wz = m.z + (cy - cv.height / 2) / m.k; m.k = Math.max(0.01, Math.min(12, m.k * f)); m.x = wx - (cx - cv.width / 2) / m.k; m.z = wz - (cy - cv.height / 2) / m.k; this.drawBigMap(); }
  mapCenterMe() { const p = this.mapPos(); if (p) { this.mv.x = p.x; this.mv.z = p.z; } this.drawBigMap(); }
  mapFitAll() { const cv = $('#bigmap'); let a = [1e9, 1e9, -1e9, -1e9]; for (const r of this.g.net.roads) for (const q of r.samples) { a[0] = Math.min(a[0], q.p.x); a[1] = Math.min(a[1], q.p.z); a[2] = Math.max(a[2], q.p.x); a[3] = Math.max(a[3], q.p.z); } this.mv.x = (a[0] + a[2]) / 2; this.mv.z = (a[1] + a[3]) / 2; this.mv.k = 0.9 * Math.min(cv.width / (a[2] - a[0]), cv.height / (a[3] - a[1])); this.drawBigMap(); }
  wireMap(cv) {
    const pts = new Map(); let pinch = 0;
    cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), d = cv.width / r.width; this.mapZoom(Math.exp(-e.deltaY * 0.0015), (e.clientX - r.left) * d, (e.clientY - r.top) * d); }, { passive: false });
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); });
    cv.addEventListener('pointerup', e => { pts.delete(e.pointerId); pinch = 0; });
    cv.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch = 0; });
    cv.addEventListener('pointermove', e => {
      const prev = pts.get(e.pointerId); if (!prev) return; const r = cv.getBoundingClientRect(), d = cv.width / r.width;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const dist = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) this.mapZoom(dist / pinch, ((a[0] + b[0]) / 2 - r.left) * d, ((a[1] + b[1]) / 2 - r.top) * d); pinch = dist; return; }
      this.mv.x -= (e.clientX - prev[0]) * d / this.mv.k; this.mv.z -= (e.clientY - prev[1]) * d / this.mv.k; this.drawBigMap();
    });
  }
  togglePhoto() { this.photo = !this.photo; document.body.classList.toggle('photo', this.photo); if (this.photo) { this.g.audio.sfx('camera_shutter'); this.toast(t('game.photo.on'), 'info', 3); } }

  // ───── tutorial (first drive) ─────
  startTutorial() {
    this.tut = 0; this.paused = true; this.screens('tutorial'); this.tutStep(0);
  }
  tutStep(i) {
    const touch = this.isTouch, N = 4;
    if (i >= N) return this.endTutorial();
    this.tut = i;
    const icons = ['🚗', '🚪', '📷', '🌐'];
    const k = `game.tut.${i + 1}`;
    $('#tutorial .tut-step').textContent = `${i + 1} / ${N}`;
    $('#tutorial .tut-icon').textContent = icons[i];
    $('#tutorial .tut-h').textContent = t(k + '.h');
    $('#tutorial .tut-p').textContent = t(k + (touch ? '.touch' : '.pc'));
    const dots = $('#tutorial .tut-dots');
    if (dots.children.length !== N) dots.innerHTML = Array.from({ length: N }, () => '<i></i>').join('');
    [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
    if (i > 0) for (const e of $('#tutorial').querySelectorAll('.tut-icon,.tut-h,.tut-p')) { e.classList.remove('swap'); void e.offsetWidth; e.classList.add('swap'); }
    $('#tutorial [data-a="tutNext"]').textContent = t(i === N - 1 ? 'game.tut.go' : 'game.tut.next');
  }
  endTutorial() {
    try { localStorage.setItem('dn.tutorial', '1'); } catch {}
    this.paused = false; this.showHUD();
  }
  // ───── online ─────
  updateOnline() {
    const o = this.g.online; if (!o) return;
    const on = this.g.settings.online;
    const st = !on ? 'off' : o.status === 'on' ? 'on' : o.status === 'error' ? 'error' : o.status === 'connecting' ? 'connecting' : 'ready';
    const txt = st === 'on' ? t('game.online.on', { n: o.count + 1 }) : t('game.online.' + st);
    const pill = $('#online-pill'); if (pill) { pill.textContent = '🌐 ' + (st === 'on' ? (o.count + 1) : txt); pill.className = 'online-pill ' + st; pill.title = txt; }
    const lob = $('#lobby-online'); if (lob) lob.textContent = '🌐 ' + t('game.lobby.online') + ' · ' + (st === 'on' ? txt : t(on ? 'game.online.ready' : 'game.online.off'));
  }
  openChat() {
    const o = this.g.online; if (!o?.room) { this.toast(t('game.online.' + (this.g.settings.online ? 'connecting' : 'off')), 'info'); return; }
    const c = $('#chat'); c.classList.add('open', 'show'); const inp = c.querySelector('input'); inp.placeholder = t('game.online.chatPh'); inp.focus();
    this.g.input.chatting = true;
    c.querySelector('form').onsubmit = e => { e.preventDefault(); o.chat(inp.value); inp.value = ''; inp.blur(); };
    inp.onblur = () => { c.classList.remove('open'); this.g.input.chatting = false; };
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Escape') inp.blur(); };
    inp.onkeyup = e => e.stopPropagation();
  }
  renderChat() {
    const c = $('#chat'), o = this.g.online; if (!c || !o) return;
    c.querySelector('.log').innerHTML = o.chatLog.slice(-6).map(m => `<div class="${m.mine ? 'me' : ''}"><b>${esc(m.name)}</b> ${esc(m.text)}</div>`).join('');
    c.classList.add('show'); clearTimeout(this._chatT); this._chatT = setTimeout(() => { if (!c.classList.contains('open')) c.classList.remove('show'); }, 9000);
  }

  // ───── HUD ─────
  toast(msg, kind = 'info', dur = 3) {
    const box = $('#hud .toasts'); const e = el('div', 'toast ' + kind, esc(msg)); box.appendChild(e);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { e.classList.add('out'); setTimeout(() => e.remove(), 400); }, dur * 1000);
  }
  prompt(key, text) {
    const p = $('#hud .prompt');
    if (!key) { p.classList.remove('show'); return; }
    p.querySelector('kbd').textContent = this.isTouch ? '👆' : key; p.querySelector('span').textContent = text; p.classList.add('show');
    p.onclick = () => this.g.input.tap('interact');
    this._promptT = 0.15;
  }
  radioBanner() {
    const r = this.g.radio; const b = $('#hud .radio-banner');
    if (!r) return;
    if (!r.on) { b.innerHTML = `📻 OFF`; } else { const n = r.nowPlaying(); b.innerHTML = `📻 <b>${esc(n.station)}</b><br><small>${esc(n.title || '')} — ${esc(n.artist || '')}</small>`; }
    b.classList.add('show'); clearTimeout(this._rb); this._rb = setTimeout(() => b.classList.remove('show'), 5000);
  }
  update(dt) {
    const g = this.g;
    if (this._promptT !== undefined) { this._promptT -= dt; if (this._promptT <= 0) { $('#hud .prompt').classList.remove('show'); this._promptT = undefined; } }
    if (g.mode !== 'drive' && g.mode !== 'walk') return;
    if (g.mode === 'drive' && g.vehicle) this.drawSpeedo(g.vehicle, dt); // every frame: smooth needle/gear motion
    this._acc = (this._acc || 0) + dt; if (this._acc < 1 / 20) return; const step = this._acc; this._acc = 0;
    const v = g.vehicle;
    const pos = g.mode === 'walk' ? g.player.pos : v.pos;
    $('#hud .loc').textContent = g.world.zoneAt(pos.x, pos.z, pos.y);
    $('#hud .clock').textContent = g.tod.clock;
    $('#hud .money').textContent = yen(g.money);
    $('#hud .fps').textContent = `MIDNIGHT JAPAN v${GAME.version}` + (g.settings.fps ? ` · ${Math.round(g.fps || 0)} FPS` : '');
    $('#hud .speedo').style.display = g.mode === 'drive' ? '' : 'none';
    if (g.frame % 4 === 0) this.drawMini(pos, g.mode === 'drive' ? v.yaw : g.player.yaw);
  }
  drawSpeedo(v, dt = 1 / 20) {
    const c = this.speedo, W = 260, cx = 130, cy = 130;
    c.clearRect(0, 0, W, W);
    // display-only smoothing (needle sweep, speed digits, gear-change pop)
    const kR = 1 - Math.exp(-dt * 16), kS = 1 - Math.exp(-dt * 10);
    this._rpmS = this._rpmS === undefined ? v.engine.rpm : this._rpmS + (v.engine.rpm - this._rpmS) * kR;
    this._kmhS = this._kmhS === undefined ? v.kmh : this._kmhS + (v.kmh - this._kmhS) * kS;
    this._kwS = this._kwS === undefined ? (v.kw || 0) : this._kwS + ((v.kw || 0) - this._kwS) * kR;
    if (v.gearLabel !== this._gearL) { if (this._gearL !== undefined) this._gearT = 1; this._gearL = v.gearLabel; }
    this._gearT = Math.max(0, (this._gearT || 0) - dt * 3.5);
    const rpm = this._rpmS;
    const red = v.car.engine.redline, maxR = Math.ceil((red + 500) / 1000) * 1000;
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    c.lineCap = 'round';
    c.lineWidth = 14; c.strokeStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.arc(cx, cy, 108, a0, a1); c.stroke();
    if (!v.ev) {
      c.strokeStyle = 'rgba(255,60,60,.45)'; c.beginPath(); c.arc(cx, cy, 108, a0 + (a1 - a0) * red / maxR, a1); c.stroke();
      const f = Math.max(0, Math.min(1, rpm / maxR));
      const grd = c.createLinearGradient(0, 260, 260, 0); grd.addColorStop(0, '#ffb347'); grd.addColorStop(1, rpm > red * 0.92 ? '#ff3b3b' : '#ff7a1a');
      c.strokeStyle = grd; c.beginPath(); c.arc(cx, cy, 108, a0, a0 + (a1 - a0) * f); c.stroke();
      const an = a0 + (a1 - a0) * f; // needle tip
      c.save(); c.shadowColor = rpm > red * 0.92 ? '#ff3b3b' : '#ffb347'; c.shadowBlur = 12; c.fillStyle = '#fff';
      c.beginPath(); c.arc(cx + Math.cos(an) * 108, cy + Math.sin(an) * 108, 5, 0, Math.PI * 2); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '600 13px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let r = 0; r <= maxR; r += 1000) { const a = a0 + (a1 - a0) * r / maxR; c.fillText(r / 1000, cx + Math.cos(a) * 86, cy + Math.sin(a) * 86); }
    } else {
      const kw = this._kwS, f = Math.max(-0.3, Math.min(1, kw / (v.car.engine.hp * 0.7355)));
      c.strokeStyle = f >= 0 ? '#4fd1ff' : '#4cff9a'; c.beginPath(); c.arc(cx, cy, 108, a0 + (a1 - a0) * 0.2, a0 + (a1 - a0) * (0.2 + f * 0.8), f < 0); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '600 13px system-ui'; c.textAlign = 'center'; c.fillText(v.regenActive ? 'REGEN' : 'POWER', cx, cy - 70);
    }
    const sp = g => this.g.settings.units === 'mph' ? g * 0.621 : g;
    c.fillStyle = '#fff'; c.font = '700 54px "Chakra Petch", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(Math.round(Math.abs(sp(Math.abs(v.kmh) < 0.5 ? v.kmh : this._kmhS))), cx, cy + 4);
    c.font = '600 13px system-ui'; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(this.g.settings.units === 'mph' ? 'mph' : 'km/h', cx, cy + 38);
    const gp = this._gearT * this._gearT;
    c.save(); c.translate(cx, cy + 74); c.scale(1 + gp * 0.45, 1 + gp * 0.45);
    if (gp > 0) { c.shadowColor = '#ffb347'; c.shadowBlur = 18 * gp; }
    c.font = '700 30px "Chakra Petch", system-ui'; c.fillStyle = v.engine.limiter > 0 ? '#ff4040' : gp > 0.3 ? '#fff' : '#ffb347'; c.fillText(v.gearLabel, 0, 0);
    c.restore();
    // icons
    const ic = [];
    if (!v.engine.running) ic.push(`<i class="warn">${v.ev ? 'OFF' : 'ENGINE'}</i>`);
    if (v.handbrakeOn) ic.push('<i class="warn">(P)</i>');
    if (this.g.model.lights.head) ic.push(`<i class="on">${this.g.model.lights.high ? 'HI' : 'LO'}</i>`);
    if (this.g.settings.etc) ic.push('<i class="etc">ETC</i>');
    if (v.ev) ic.push(`<i>${Math.round(v.battery * 100)}%</i>`); else ic.push(`<i>⛽${Math.round(v.fuel * 100)}%</i>`);
    if (v.mode === 'manual_clutch' && !v.ev) ic.push(`<i class="${v.ctl.clutch > 0.5 ? 'on' : ''}">CL</i>`);
    if (this.g.model.lights.strobe !== 'off') ic.push('<i class="on">STROBE</i>');
    const html = ic.join(''); if (html !== this._ic) { $('#hud .icons').innerHTML = html; this._ic = html; }
  }
  drawMini(pos, yaw) {
    const c = this.mini, W = 200, S = 0.45; // px per metre
    c.save(); c.clearRect(0, 0, W, W);
    c.beginPath(); c.arc(100, 100, 98, 0, Math.PI * 2); c.clip();
    c.fillStyle = 'rgba(8,14,26,.82)'; c.fillRect(0, 0, W, W);
    c.translate(100, 100); c.rotate(Math.PI + yaw); c.scale(S, S); c.translate(-pos.x, -pos.z);
    // PA lot
    c.fillStyle = 'rgba(120,140,170,.25)'; c.fillRect(PA_RECT.x0, PA_RECT.z0, PA_RECT.x1 - PA_RECT.x0, PA_RECT.z1 - PA_RECT.z0);
    c.fillStyle = 'rgba(200,210,230,.35)'; c.fillRect(-55, -84, 110, 24);
    for (const r of this.g.net.roads) {
      c.strokeStyle = r.kind === 'expressway' ? '#3fbf7f' : r.kind === 'ramp' ? '#8fd6ae' : '#9aa6b8'; c.lineWidth = (r.edgeL - r.edgeR); c.lineCap = 'round';
      c.globalAlpha = 0.6; c.beginPath(); r.samples.forEach((s, i) => { if (i % 3 && i !== r.samples.length - 1) return; i ? c.lineTo(s.p.x, s.p.z) : c.moveTo(s.p.x, s.p.z); }); c.stroke();
    }
    c.globalAlpha = 1;
    for (const ai of this.g.traffic.cars) { if (ai.pos.distanceToSquared(pos) > 250 * 250) continue; c.fillStyle = ai.police ? (ai.pursuit ? '#ff3030' : '#4a8cff') : 'rgba(255,255,255,.7)'; c.fillRect(ai.pos.x - 2.5, ai.pos.z - 2.5, 5, 5); }
    c.restore();
    // player arrow
    c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(100, 88); c.lineTo(108, 108); c.lineTo(100, 103); c.lineTo(92, 108); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.beginPath(); c.arc(100, 100, 98, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#fff'; c.font = '700 12px system-ui'; c.textAlign = 'center';
    const nAng = -(Math.PI + yaw) - Math.PI / 2 + Math.PI; c.fillText('N', 100 + Math.cos(-Math.PI / 2 - (Math.PI + yaw)) * 86, 104 + Math.sin(-Math.PI / 2 - (Math.PI + yaw)) * 86);
  }
  drawBigMap() {
    const cv = $('#bigmap'), c = cv.getContext('2d'), W = cv.width, H = cv.height, m = this.mv, k = m.k;
    const P = (x, z) => [(x - m.x) * k + W / 2, (z - m.z) * k + H / 2];
    const dpr = W / innerWidth;
    c.fillStyle = '#0a1a33'; c.fillRect(0, 0, W, H); // sea
    const poly = (pts, fill) => { c.beginPath(); pts.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); c.fillStyle = fill; c.fill(); };
    for (const l of MAP.land || []) if (l.pts?.length > 2) poly(l.pts, l.main ? '#1d2633' : '#222c3a');
    if (k > 0.25) for (const b of MAP.buildings || []) poly(b.pts, '#3a4658');
    { const [x0, z0] = P(PA_RECT.x0, PA_RECT.z0), [x1, z1] = P(PA_RECT.x1, PA_RECT.z1); c.fillStyle = '#44587a'; c.fillRect(Math.min(x0, x1), Math.min(z0, z1), Math.abs(x1 - x0), Math.abs(z1 - z0)); }
    const roads = this.g.net.roads;
    for (const pass of [0, 1]) for (const r of roads) {
      const col = r.kind === 'expressway' ? '#2fbf74' : r.kind === 'ramp' ? '#8fe0b2' : '#c4ccd8';
      c.strokeStyle = pass ? col : 'rgba(0,0,0,.55)'; c.lineCap = c.lineJoin = 'round';
      c.lineWidth = Math.max(pass ? 1.5 * dpr : 3 * dpr, (r.edgeL - r.edgeR) * k + (pass ? 0 : 2 * dpr));
      c.globalAlpha = r.samples.some(q => q.p.y < -0.6) && pass ? 0.75 : 1;
      const step = k < 0.05 ? 8 : k < 0.3 ? 3 : 1;
      c.beginPath(); r.samples.forEach((q, i) => { if (i % step && i !== r.samples.length - 1) return; const [a, b] = P(q.p.x, q.p.z); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.stroke();
    }
    c.globalAlpha = 1;
    // lane markings when zoomed right in
    if (k > 3) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = dpr; c.setLineDash([6 * dpr, 8 * dpr]); for (const r of roads) for (const L of r.lanes) { c.beginPath(); r.samples.forEach((q, i) => { const [a, b] = P(q.p.x + q.left.x * L.lat, q.p.z + q.left.z * L.lat); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.stroke(); } c.setLineDash([]); }
    // traffic
    for (const ai of this.g.traffic?.cars || []) { const [a, b] = P(ai.pos.x, ai.pos.z); if (a < 0 || b < 0 || a > W || b > H) continue; c.fillStyle = ai.police ? '#4a8cff' : 'rgba(255,255,255,.8)'; c.fillRect(a - 2 * dpr, b - 2 * dpr, 4 * dpr, 4 * dpr); }
    // labels: road names (expressways always, ramps/streets when zoomed), landmarks, places
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const lab = (txt, x, z, size, col = '#fff') => { const [a, b] = P(x, z); if (a < -200 || b < -50 || a > W + 200 || b > H + 50) return; c.font = `700 ${size * dpr}px "Hiragino Sans","Noto Sans JP",system-ui,sans-serif`; c.lineWidth = 3 * dpr; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(txt, a, b); c.fillStyle = col; c.fillText(txt, a, b); };
    const seen = new Set();
    for (const r of roads) { if (!r.name || seen.has(r.name)) continue; if (r.kind !== 'expressway' && k < (r.kind === 'ramp' ? 0.6 : 1.2)) continue; seen.add(r.name); const q = r.samples[r.samples.length >> 1].p; lab(r.name.replace(/（.*?）/g, ''), q.x, q.z, r.kind === 'expressway' ? 13 : 11, r.kind === 'expressway' ? '#b6f5cf' : '#dde4ee'); }
    for (const l of MAP.landmarks || []) lab('◆ ' + l.name, l.x, l.z, 12, '#ffd38a');
    lab('大黒PA', (PA_RECT.x0 + PA_RECT.x1) / 2, (PA_RECT.z0 + PA_RECT.z1) / 2, 15, '#ffb347');
    // player
    const p = this.mapPos(); if (p) { const [a, b] = P(p.x, p.z); const yaw = this.g.mode === 'walk' ? this.g.player.yaw : this.g.vehicle.yaw; c.save(); c.translate(a, b); c.rotate(-yaw + Math.PI); c.fillStyle = '#ffb347'; c.strokeStyle = '#000'; c.lineWidth = 2 * dpr; c.beginPath(); c.moveTo(0, -11 * dpr); c.lineTo(8 * dpr, 9 * dpr); c.lineTo(0, 4 * dpr); c.lineTo(-8 * dpr, 9 * dpr); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    // scale bar + north
    const nice = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]; const len = nice.find(n => n * k > 80 * dpr) || 10000;
    c.fillStyle = '#fff'; c.fillRect(20 * dpr, H - 30 * dpr, len * k, 3 * dpr); c.textAlign = 'left'; c.font = `600 ${12 * dpr}px system-ui`; c.fillText(len >= 1000 ? len / 1000 + ' km' : len + ' m', 20 * dpr, H - 42 * dpr);
    c.textAlign = 'center'; c.font = `800 ${14 * dpr}px system-ui`; c.fillText('N ▲', W - 40 * dpr, 70 * dpr);
  }

  // ───── touch controls ─────
  wireTouch() {
    const T = this.g.input?.touch || (this._pendingTouch = {});
    const root = $('#touch');
    const hold = (btn, on) => {
      const k = btn.dataset.t; const touch = this.g.input.touch;
      if (k === 'left') touch.steer = on ? 1 : 0; else if (k === 'right') touch.steer = on ? -1 : 0;
      else if (k === 'run') this.g.input.axes.run = on; else touch[k] = on ? 1 : 0;
      btn.classList.toggle('on', on);
    };
    root.addEventListener('pointerdown', e => { const b = e.target.closest('[data-t]'); if (b) { e.preventDefault(); b.setPointerCapture?.(e.pointerId); hold(b, true); } const tp = e.target.closest('[data-tap]'); if (tp) { e.preventDefault(); this.g.input.tap(tp.dataset.tap); } });
    const up = e => { const b = e.target.closest?.('[data-t]'); if (b) hold(b, false); };
    root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up); root.addEventListener('pointerleave', up, true);
    // walking joystick
    const stick = root.querySelector('.t-stick'), knob = stick.querySelector('i');
    let sid = null, sc = null;
    stick.addEventListener('pointerdown', e => { sid = e.pointerId; const r = stick.getBoundingClientRect(); sc = [r.left + r.width / 2, r.top + r.height / 2]; stick.setPointerCapture(e.pointerId); move(e); });
    const move = e => { if (e.pointerId !== sid) return; const dx = e.clientX - sc[0], dy = e.clientY - sc[1]; const d = Math.min(50, Math.hypot(dx, dy)); const a = Math.atan2(dy, dx); knob.style.transform = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`; this.g.input.touch.moveX = Math.cos(a) * d / 50; this.g.input.touch.moveY = -Math.sin(a) * d / 50; };
    stick.addEventListener('pointermove', move);
    const end = e => { if (e.pointerId !== sid) return; sid = null; knob.style.transform = ''; this.g.input.touch.moveX = 0; this.g.input.touch.moveY = 0; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    // touch-drag look on the canvas
    const cv = document.getElementById('gl'); let lid = null, lp = null;
    cv.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; lid = e.pointerId; lp = [e.clientX, e.clientY]; this.g.touchLook = { dx: 0, dy: 0, active: true }; });
    cv.addEventListener('pointermove', e => { if (e.pointerId !== lid || !this.g.touchLook) return; this.g.touchLook.dx += e.clientX - lp[0]; this.g.touchLook.dy += e.clientY - lp[1]; lp = [e.clientX, e.clientY]; });
    const lend = e => { if (e.pointerId === lid) { lid = null; if (this.g.touchLook) this.g.touchLook.active = false; } };
    cv.addEventListener('pointerup', lend); cv.addEventListener('pointercancel', lend);
  }
}
