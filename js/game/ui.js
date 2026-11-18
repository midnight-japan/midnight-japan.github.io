// DOM UI: loading, title, garage (car/colour/stance/plate/strobe), HUD (speedo, minimap, radio),
// pause & settings, car-action menu, konbini shop, outfit editor, map, photo mode, touch controls.
import * as THREE from 'three';
import { CARS, CAR_BY_ID, CATEGORIES } from '../../data/cars.js';
import { GAME, LANGS, CHANGELOG } from '../../data/meta.js';
import { reading } from './names.js';
import { t, pick, setLang, getLang } from '../i18n.js';
import { displayName, currentUser } from '../account.js';
import { PLATE_REGIONS, PLATE_KANA, PLATE_TYPES, plateCanvas, formatNumber } from './plates.js';
import { STROBE_MODES, STANCE_PRESETS } from './carmodel.js';
import { TUNE_PRESETS, resolveTune } from './vehicle.js';
import { OUTFIT_OPTIONS } from './humans.js';
import { PA_RECT, MAP } from './roads.js';
import { GOALS } from './goals.js';
import { PLACES } from '../../data/places.js';
import { JAPAN_LAND, JAPAN_CITIES, JAPAN_PREFS } from '../../data/japan.js';
import { DESTS } from '../../data/destinations.js';
import { GLOSSARY, STANCE_TERM, ROAD_TERM, term } from '../../data/glossary.js';
import { DEFAULT_SETTINGS } from './main.js';
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
      <div id="loading" class="screen show"><div class="load-photo" id="load-photo"></div><div class="load-box"><div class="logo">MIDNIGHT <b>JAPAN</b><small>ミッドナイト・ジャパン</small></div><div class="bar"><i></i></div><div class="load-msg"></div><div class="ver">v${GAME.version}</div></div></div>
      <div id="title" class="screen"><div class="title-box">
        <div class="logo big">MIDNIGHT <b>JAPAN</b><small>ミッドナイト・ジャパン · v${GAME.version}</small></div>
        <div class="who"></div>
        <div class="lobby-steps"><span data-i18n="game.lobby.s1"></span><i>›</i><span data-i18n="game.lobby.s2"></span><i>›</i><span data-i18n="game.lobby.s3"></span><i>›</i><span data-i18n="game.lobby.s4"></span></div>
        <button class="btn primary big" data-a="play"><span data-i18n="game.title.start"></span><small class="sub" data-i18n="game.title.startSub"></small></button>
        <button class="btn" data-a="quick"><span data-i18n="game.title.quick"></span> <small class="sub" id="quick-car"></small></button>
        <label class="spawn-sel"><span data-i18n="game.spawn.label"></span> <select id="t-spawn">
          <option value="pa" data-i18n="game.spawn.pa"></option><option value="bay" data-i18n="game.spawn.bay"></option>
          <option value="k1" data-i18n="game.spawn.k1"></option><option value="hakone" data-i18n="game.spawn.hakone"></option><option value="c1" data-i18n="game.spawn.c1"></option><option value="daiba" data-i18n="game.spawn.daiba"></option><option value="r1" data-i18n="game.spawn.r1"></option><option value="seisho" data-i18n="game.spawn.seisho"></option><option value="umi" data-i18n="game.spawn.umi"></option><option value="futo" data-i18n="game.spawn.futo"></option>
          <option value="mm" data-i18n="game.spawn.mm"></option><option value="chinatown" data-i18n="game.spawn.chinatown"></option><option value="tsurumi" data-i18n="game.spawn.tsurumi"></option><option value="kawasaki" data-i18n="game.spawn.kawasaki"></option><option value="haneda" data-i18n="game.spawn.haneda"></option><option value="zama" data-i18n="game.spawn.zama"></option></select></label><canvas id="t-spawnmap" class="spawnmap" width="440" height="250"></canvas>
        <div class="lobby-online" id="lobby-online"></div>
        <div class="lobby-row"><button class="btn sm" data-a="settings">⚙ <span data-i18n="game.menu.settings"></span></button>
        <button class="btn sm" data-a="controls">🎮 <span data-i18n="game.menu.controls"></span></button>
        <a class="btn sm ghost" href="index.html">🌐 <span data-i18n="game.title.site"></span></a></div>
        <p class="hint" data-i18n="game.title.hint"></p>
        <div class="title-ver">MIDNIGHT JAPAN v${GAME.version} · ${GAME.build} · Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · Buildings: <a href="credits.html" target="_blank" rel="noopener">3D都市モデル（PLATEAU）国土交通省</a></div>
      </div></div>
      <div id="garage" class="screen side"><div class="panel">
        <div class="ph"><h2 data-i18n="game.garage.title"></h2><button class="x" data-a="garageBack">✕</button></div>
        <div class="tabs" id="g-cats"></div>
        <div class="carlist" id="g-list"></div>
        <div class="carinfo" id="g-info"></div>
        <div class="gsec"><h3 data-i18n="game.garage.paint"></h3><div class="swatches" id="g-colors"></div>
          <div class="row"><input type="color" id="g-color"><select id="g-finish"><option value="metallic">Metallic</option><option value="solid">Solid</option><option value="pearl">Pearl</option><option value="matte">Matte</option></select>
          <label class="mini"><span data-i18n="game.garage.rim"></span><input type="color" id="g-rim" value="#b9bcc0"></label></div></div>
        <div class="gsec tune"><h3 data-i18n="game.garage.stance"></h3>
          <div class="presets" id="g-spre"></div><p class="g-term" id="g-term"></p>
          <label class="sl"><span data-i18n="game.garage.camberF"></span><input type="range" id="g-cf" min="-20" max="3" step="0.5"><b></b></label>
          <label class="sl"><span data-i18n="game.garage.camberR"></span><input type="range" id="g-cr" min="-22" max="3" step="0.5"><b></b></label>
          <label class="sl"><span data-i18n="game.garage.ride"></span><input type="range" id="g-ride" min="-0.12" max="0.08" step="0.005"><b></b></label>
          <label class="sl"><span data-i18n="game.garage.track"></span><input type="range" id="g-track" min="-0.03" max="0.1" step="0.005"><b></b></label>
          <label class="sl"><span id="g-l-tf"></span><input type="range" id="g-tf" min="-2" max="2" step="0.1"><b></b></label>
          <label class="sl"><span id="g-l-tr"></span><input type="range" id="g-tr" min="-2" max="2" step="0.1"><b></b></label>
          <label class="sl"><span id="g-l-rk"></span><input type="range" id="g-rk" min="-0.05" max="0.05" step="0.005"><b></b></label></div>
        <div class="gsec tune"><h3 data-i18n="game.tune.title"></h3>
          <div class="presets" id="g-tpre"></div>
          <label class="sl"><span data-i18n="game.tune.power"></span><input type="range" id="t-power" min="0.9" max="1.8" step="0.01"><b></b></label>
          <label class="sl"><span data-i18n="game.tune.weight"></span><input type="range" id="t-weight" min="0" max="0.18" step="0.005"><b></b></label>
          <label class="sl"><span data-i18n="game.tune.tyre"></span><select id="t-tyre"><option value="eco"></option><option value="street"></option><option value="sport"></option><option value="semi"></option><option value="drift"></option></select></label>
          <label class="sl"><span data-i18n="game.tune.final"></span><input type="range" id="t-final" min="0.8" max="1.25" step="0.01"><b></b></label>
          <label class="sl"><span data-i18n="game.tune.brake"></span><input type="range" id="t-brake" min="0.8" max="1.4" step="0.01"><b></b></label>
          <label class="sl"><span data-i18n="game.tune.bias"></span><input type="range" id="t-bias" min="0.5" max="0.75" step="0.01"><b></b></label>
          <label class="sl"><span data-i18n="game.tune.balance"></span><input type="range" id="t-balance" min="-1" max="1" step="0.05"><b></b></label>
          <label class="sl"><span data-i18n="game.tune.aero"></span><input type="range" id="t-aero" min="0" max="1" step="0.05"><b></b></label>
          <label class="sl"><span data-i18n="game.tune.lock"></span><input type="range" id="t-lock" min="28" max="58" step="1"><b></b></label>
          <p class="note" id="t-sum"></p></div>
        <div class="gsec"><h3 data-i18n="game.garage.plate"></h3><canvas id="g-plate" width="330" height="165"></canvas>
          <div class="row"><select id="g-pregion"></select><input id="g-pcls" maxlength="3" size="3"><select id="g-pkana"></select><input id="g-pnum" type="number" min="1" max="9999" style="width:80px"><button class="btn sm" data-a="plateRandom">🎲</button></div><div class="row"><select id="g-pstyle"><option value="normal"></option><option value="glow"></option><option value="tilt"></option></select></div>
          <p class="note" id="g-ptype"></p></div>
        <div class="gsec"><h3 data-i18n="game.garage.strobe"></h3><select id="g-strobe"></select></div>
        <div class="gsec"><h3 data-i18n="game.set.transmission"></h3><select id="g-trans"><option value="auto" data-i18n="game.trans.auto"></option><option value="manual" data-i18n="game.trans.manual"></option><option value="manual_clutch" data-i18n="game.trans.manual_clutch"></option></select><p class="note" data-i18n="game.trans.note"></p></div>
        <button class="btn primary wide" data-a="drive" data-i18n="game.garage.drive"></button>
      </div></div>
      <div id="hud" class="hidden">
        <div class="tl"><div class="loc"></div><div class="clock"></div><div class="money"></div><div class="goaltrack" id="goaltrack"></div></div>
        <canvas id="minimap" width="680" height="500"></canvas><div class="hudbar"><button class="autobtn garbtn" data-a="hudGarage" title="U">🔧</button><button class="autobtn mapbtn" data-a="hudMap" title="M">🗺</button><button id="wxbtn" class="autobtn wxbtn" data-a="weather" title="Weather">🌤</button><button id="seabtn" class="autobtn seabtn" data-a="season" title="Season">🍁</button><button id="autobtn" class="autobtn" data-a="auto" title="J">AUTO</button></div><div id="keyhint" class="keyhint" hidden></div><div id="navhud" class="navhud" hidden><span class="nav-arrow">↑</span><span class="nav-dist"></span><button class="nav-x" data-a="navClear" aria-label="clear">✕</button></div><div id="pursuit" class="pursuithud" hidden></div>
        <div class="speedo"><canvas id="speedo" width="520" height="520"></canvas><div class="icons"></div></div>
        <div class="radio-banner"></div><div id="radiopill" class="radiopill" hidden><button class="rp-fold" data-a="radioFold" title="−">📻</button><span class="rp-t"></span><button data-a="radioPrev" title="R">⏮</button><button data-a="radioSkip" title="Y">⏭</button><button data-a="radioNext" title="T">📻</button></div>
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
        <button class="btn" data-a="goals" id="goals-btn"></button>
        <button class="btn" data-a="glossary" id="gloss-btn">📖 <span class="gl-lb"></span></button>
        <button class="btn" data-a="outfit" data-i18n="game.menu.outfit"></button>
        <button class="btn" data-a="settings" data-i18n="game.menu.settings"></button>
        <button class="btn" data-a="controls" data-i18n="game.menu.controls"></button>
        <div class="row center"><button class="btn sm" data-a="timeDay" data-i18n="game.menu.day"></button><button class="btn sm" data-a="timeDusk" data-i18n="game.menu.dusk"></button><button class="btn sm" data-a="timeNight" data-i18n="game.menu.night"></button></div>
        <div class="row center"><button class="btn sm" data-a="repair" data-i18n="game.menu.repair"></button><button class="btn sm" data-a="teleport" data-i18n="game.menu.teleport"></button></div>
        <button class="btn" data-a="respawn" data-i18n="game.menu.respawn"></button>
        <div class="stats"></div>
        <a class="btn ghost" href="index.html" data-i18n="game.menu.quit"></a>
      </div></div>
      <div id="settings" class="screen dim"><div class="menu wide"><h2 data-i18n="game.menu.settings"></h2><div class="sgrid" id="s-grid"></div><button class="btn primary" data-a="settingsClose" data-i18n="game.menu.back"></button></div></div>
      <div id="whatsnew" class="screen dim"><div class="menu wide wn"><div class="wn-tag">NEW · v<span class="wn-ver"></span></div><h2 class="wn-title"></h2><p class="wn-sum"></p><ul class="wn-list"></ul><div class="wn-go"><button class="btn primary" data-a="wnDaiba"></button><button class="btn primary" data-a="wnSeisho"></button></div><button class="btn ghost" data-a="wnClose"></button></div></div>
      <div id="goals" class="screen dim"><div class="menu wide"><h2 data-i18n="game.goal.title"></h2><div id="g-body" class="goals"></div><button class="btn primary" data-a="goalsClose" data-i18n="game.menu.back"></button></div></div>
      <div id="controls" class="screen dim"><div class="menu wide"><h2 data-i18n="game.menu.controls"></h2><div id="c-body"></div><button class="btn primary" data-a="controlsClose" data-i18n="game.menu.back"></button></div></div>
      <div id="outfit" class="screen side"><div class="panel"><div class="ph"><h2 data-i18n="game.menu.outfit"></h2><button class="x" data-a="outfitClose">✕</button></div><div id="o-body"></div></div></div>
      <div id="shop" class="popup"><h3 id="shop-title"></h3><div id="shop-list"></div><button class="btn sm" data-a="shopClose">✕</button></div>
      <div id="map" class="screen dim"><canvas id="bigmap"></canvas><div class="mapctl"><button class="btn sm" data-a="mapIn">＋</button><button class="btn sm" data-a="mapOut">－</button><button class="btn sm" data-a="mapMe">◎</button><button class="btn sm" data-a="mapAll">⤢</button><button class="btn sm" data-a="mapJapan" title="Japan">🗾</button></div><div class="qt" id="qt"><div class="qt-h" data-a="qtToggle"></div><div class="qt-list" id="qt-list"></div></div><div class="maphint" data-i18n="game.map.hint2"></div><div class="mapsel" id="mapsel" hidden><span class="ms-t"></span><button class="btn sm primary" data-a="mapNav" data-i18n="game.map.route"></button><button class="btn sm" data-a="mapTp" data-i18n="game.map.tp"></button></div><button class="btn sm mapx" data-a="mapClose">✕</button></div>
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
    { // v2.13.3: a moody shot behind the loading bar (slow Ken Burns drift), different each visit
      const P = ['50-touge-sakura', '48-pa-lights', '27-c1night', '33-rainbow', '45-tokyo-tower', '29-hakone_dusk', '31-k1rain', '42-tokyo-night', '51-pa-autumn', '40-real-yokohama'];
      const f = P[Math.floor(Math.random() * P.length)], el = document.getElementById('load-photo'); if (el) el.style.backgroundImage = `url(docs/screenshots/${f}${innerWidth < 900 ? '-800' : ''}.jpg)`; }
    r.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) { this.g.audio?.sfx('ui_click'); this.action(b.dataset.a, b); } const c = e.target.closest('[data-c]'); if (c) this.carAction(c.dataset.c); });
    this.wireTouch();
    this.speedo = $('#speedo').getContext('2d'); this.mini = $('#minimap').getContext('2d'); $('#minimap').addEventListener('click', () => this.toggleMap(true));
  }
  relabel() { this.root.querySelectorAll('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n)); }
  loading(p, msg) { $('#loading .bar i').style.width = (p * 100) + '%'; $('#loading .load-msg').textContent = msg || ''; if (p >= 1) setTimeout(() => $('#loading').classList.remove('show'), 300); }
  fatal(msg) { $('#fatal').classList.add('show'); $('#fatal-msg').textContent = msg; }
  screens(show) { for (const id of ['title', 'garage', 'pause', 'settings', 'goals', 'whatsnew', 'controls', 'outfit', 'map', 'tutorial']) $('#' + id).classList.toggle('show', show === id); }
  showWhatsNew() {
    const c = CHANGELOG[0]; $('#whatsnew .wn-ver').textContent = c.version; $('#whatsnew .wn-title').textContent = `${c.codename} — ${t('game.wn.title')}`;
    $('#whatsnew .wn-sum').textContent = pick(c.summary);
    $('#whatsnew .wn-list').innerHTML = c.items.filter(i => i.type === 'new' || i.type === 'change').slice(0, 6).map(i => `<li>${esc(pick(i))}</li>`).join('');
    $('#whatsnew [data-a=wnDaiba]').textContent = '🌈 ' + t('game.wn.daiba'); $('#whatsnew [data-a=wnSeisho]').textContent = '🗻 ' + t('game.wn.seisho'); $('#whatsnew [data-a=wnClose]').textContent = t('game.wn.close');
    this.screens('whatsnew');
  }
  showTitle() { let seen = null; try { seen = localStorage.getItem('dn.seenVer'); } catch {} if (seen !== GAME.version && !this._wnShown && !/[?&](auto|go)=/.test(location.search)) { this._wnShown = true; this.showWhatsNew(); return; } this.screens('title'); $('#hud').classList.add('hidden'); $('#title .who').innerHTML = `${esc(t('game.title.hello'))} <b>${esc(displayName())}</b>` + (currentUser() ? '' : ` · <a href="account.html">${esc(t('game.title.login'))}</a>`); this.touchMode(null); const sp = $('#t-spawn'); if (sp) { sp.value = this.g.settings.spawn || 'pa'; sp.onchange = () => { this.g.settings.spawn = sp.value; this.g.saveSettings?.(); this.spawnPreview(sp.value); }; this.spawnPreview(sp.value); } const qc = CAR_BY_ID[this.g.garage.car]; $('#quick-car').textContent = qc ? `${qc.maker} ${qc.name}` : ''; this.updateOnline(); }
  // v2.5.2: icon + word on every quick button (in the play language) — icons alone were guesswork
  labelHUD() {
    const L3 = (ko, ja, en) => ({ ko, ja, en })[getLang()] || en;
    { const gl = document.querySelector('#gloss-btn .gl-lb'); if (gl) gl.textContent = L3('용어 사전', '用語集', 'Glossary'); }
    const set = (sel, ic, txt) => { const b = document.querySelector(sel); if (b) b.innerHTML = `<span class="ic">${ic}</span><span class="lb">${esc(txt)}</span>`; };
    set('#hud .garbtn', '🔧', L3('차고', 'ガレージ', 'Garage')); set('#hud .mapbtn', '🗺', L3('지도', '地図', 'Map'));
    const wx = { auto: '🌤', clear: '☀️', cloudy: '☁️', rain: '🌧', storm: '⛈', fog: '🌫' }[this.g.settings.weather] || '🌤'; set('#wxbtn', wx, L3('날씨', '天気', 'Weather'));
    { const se = { auto: '🗓', spring: '🌸', summer: '🌿', autumn: '🍁', winter: '❄️' }[this.g.settings.season || 'auto']; set('#seabtn', se, L3('계절', '季節', 'Season')); }
    set('#autobtn', '🚘', L3('자동', '自動', 'Auto'));
    const m = document.querySelector('#hud .hud-menu'); if (m) m.title = L3('메뉴', 'メニュー', 'Menu');
  }
  showHUD() { this.labelHUD(); this.screens(null); $('#hud').classList.remove('hidden'); if (!this._khShown && this.g.mode === 'drive') { this._khShown = true; setTimeout(() => this.keyHint(), 1500); } this.touchMode(this.g.mode); this.paused = false; }
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
      case 'glossary': this.showGlossary(); break;
      case 'glossClose': $('#glossary')?.remove(); break;
      case 'resume': this.togglePause(false); break;
      case 'garage': {
        const v = g.vehicle;
        if (v && Math.abs(v.kmh) > 3) { this.toast(t('game.walk.stopfirst'), 'warn'); break; }
        if (g.mode === 'walk') g.enterCar();
        this.paused = false; g.openGarage(); break;
      }
      case 'goals': this.screens('goals'); this.buildGoals(); break;
      case 'wnClose': try { localStorage.setItem('dn.seenVer', GAME.version); } catch {} this.showTitle(); break;
      case 'wnDaiba': case 'wnSeisho': try { localStorage.setItem('dn.seenVer', GAME.version); } catch {} g.settings.spawn = a === 'wnDaiba' ? 'daiba' : 'seisho'; g.saveSettings?.(); this.screens(null); g.quickStart(); break;
      case 'goalsClose': this.screens('pause'); this.updateGoals(); break;
      case 'outfit': this.screens('outfit'); this.buildOutfit(); break;
      case 'outfitClose': this.screens('pause'); break;
      // v2.13.3: settings never pause the drive — the game keeps running underneath, closing returns straight to it
      case 'settings': this.prevScreen = g.mode === 'title' ? 'title' : 'hud'; if (g.mode === 'drive' || g.mode === 'walk') this.paused = false; this.screens('settings'); $('#settings')?.classList.add('live'); this.buildSettings(); break;
      case 'settingsClose': $('#settings')?.classList.remove('live'); if (this.prevScreen === 'title') { this.screens('title'); this.showTitle(); } else { this.screens(null); this.paused = false; this.showHUD?.(); } break;
      case 'controls': this.prevScreen = g.mode === 'title' ? 'title' : 'pause'; this.screens('controls'); this.buildControls(); break;
      case 'controlsClose': this.screens(this.prevScreen || 'pause'); if (this.prevScreen === 'title') this.showTitle(); break;
      case 'timeDay': g.tod.setHours(12); break;
      case 'timeDusk': g.tod.setHours(17.6); break;
      case 'timeNight': g.tod.setHours(22); break;
      case 'respawn': if (g.mode === 'walk') g.enterCar(); g.respawnPA(); this.togglePause(false); break;
      case 'repair': if (g.model) { g.fx?.repair(g.model); this.toast(t('game.car.repaired'), 'info', 2); } this.togglePause(false); break;
      case 'teleport': this.togglePause(false); this.toggleMap(true); this.toast(t('game.map.tpHint'), 'info', 5); break;
      case 'closeCar': $('#carmenu').classList.remove('show'); break;
      case 'shopClose': $('#shop').classList.remove('show'); break;
      case 'hudMap': this.toggleMap(); break;
      case 'radioFold': { const pl = document.getElementById('radiopill'); pl.classList.toggle('folded'); try { localStorage.setItem('dn.rpFold', pl.classList.contains('folded') ? '1' : ''); } catch {} break; }
      case 'radioSkip': if (g.radio?.on) { g.radio.skip(); this.radioBanner(); } break;
      case 'radioNext': if (g.radio) { if (!g.radio.on) g.radio.power(true); else g.radio.next(); this.radioBanner(); } break;
      case 'radioPrev': if (g.radio?.on) { g.radio.prev(); this.radioBanner(); } break;
      case 'hudGarage': this.quickGarage(); break;
      case 'season': { // v2.9: auto (real date) → spring → summer → autumn → winter
        const M = ['auto', 'spring', 'summer', 'autumn', 'winter'], i = (M.indexOf(g.settings.season || 'auto') + 1) % M.length; g.settings.season = M[i]; g.saveSettings(); this.labelHUD();
        const L = { ko: { auto: '계절: 자동(현재 날짜)', spring: '봄 · 벚꽃', summer: '여름', autumn: '가을 · 단풍', winter: '겨울 · 눈' }, ja: { auto: '季節：自動（今日の日付）', spring: '春・桜', summer: '夏', autumn: '秋・紅葉', winter: '冬・雪' } }[getLang()] || { auto: 'Season: auto (today)', spring: 'Spring · cherry blossom', summer: 'Summer', autumn: 'Autumn · leaves', winter: 'Winter · snow' };
        this.toast(L[M[i]], 'info', 2); break; }
      case 'weather': { // v2.2: one tap cycles the weather — auto → clear → cloudy → rain → storm → fog
        const M = ['auto', 'clear', 'cloudy', 'rain', 'storm', 'fog'], i = (M.indexOf(g.settings.weather || 'auto') + 1) % M.length; g.settings.weather = M[i]; g.saveSettings();
        const ic = { auto: '🌤', clear: '☀️', cloudy: '☁️', rain: '🌧', storm: '⛈', fog: '🌫' }; this.labelHUD();
        this.toast(t('game.weather.' + M[i]), 'info', 2); break; }
      case 'auto': g.autopilot?.toggle(); if (g.autopilot?.on) this.toast(t('game.auto.on'), 'info', 4); break;
      case 'mapClose': this.toggleMap(false); break;
      case 'mapNav': if (this.mapSel) { g.nav.set(this.mapSel.x, this.mapSel.z); this.toggleMap(false); this.toast(t('game.nav.set'), 'info', 3); } break;
      case 'mapTp': if (this.mapSel) { this.toggleMap(false); g.teleport(this.mapSel.x, this.mapSel.z); } break;
      case 'mapTp0': case 'mapTp1': { const o = this.mapSel?.opts?.[a === 'mapTp1' ? 1 : 0]; if (o) { this.toggleMap(false); g.teleport(this.mapSel.x, this.mapSel.z, o); } break; }
      case 'navClear': g.nav.clear(); break;
      case 'mapIn': this.mapZoom(1.6); break;
      case 'mapOut': this.mapZoom(1 / 1.6); break;
      case 'mapMe': this.mapCenterMe(); break;
      case 'mapAll': this.mapFitAll(); break;
      case 'mapJapan': this.mapJapan(); break;
      case 'qtToggle': $('#qt').classList.toggle('open'); break;
      default: if (a.startsWith('qt:')) { const d = DESTS.find(x => x.id === a.slice(3)); if (d) { this.mapFollow = false; this.mv.x = d.x; this.mv.z = d.z; this.mv.k = Math.max(this.mv.k, 0.25); this.mapSel = { x: d.x, z: d.z }; this.showMapSel(d.x, d.z); this.drawBigMap(); if (innerWidth < 760) $('#qt').classList.remove('open'); } } break;
      case 'plateRandom': { const cur = g.carSetup(g.previewId).plate; const p = { ...cur, region: PLATE_REGIONS[Math.floor(Math.random() * 8)], kana: PLATE_KANA[Math.floor(Math.random() * 30)], num: 1 + Math.floor(Math.random() * 9999) }; g.applyPreview({ plate: p }); this.fillPlate(); break; }
    }
  }
  togglePause(force) {
    const on = force ?? !this.paused;
    if (this.g.mode !== 'drive' && this.g.mode !== 'walk') return;
    this.paused = on; this.screens(on ? 'pause' : null); if (on) this.updateGoals();
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
    // v2.4: stance presets + camber / ride / track / toe / rake (any slider edit → custom)
    const L3 = (ko, ja, en) => ({ ko, ja, en })[getLang()] || en;
    const SPN = { stock: L3('순정', 'ノーマル', 'Stock'), street: L3('스트리트', 'ストリート', 'Street'), tsura: L3('츠라이치', 'ツライチ', 'Flush'), shakotan: L3('샤코탄', 'シャコタン', 'Slammed'), vip: 'VIP', oni: L3('오니캔버', '鬼キャン', 'Oni-camber'), drift: L3('드리프트', 'ドリフト', 'Drift'), track: L3('서킷', 'サーキット', 'Track'), lift: L3('리프트업', 'リフトアップ', 'Lifted'), custom: L3('사용자', 'カスタム', 'Custom') };
    $('#g-l-tf').textContent = L3('앞 토 (+ 토인)', 'フロント トー (+イン)', 'Front toe (+ in)'); $('#g-l-tr').textContent = L3('뒤 토 (+ 토인)', 'リア トー (+イン)', 'Rear toe (+ in)'); $('#g-l-rk').textContent = L3('레이크 (뒤 높이)', 'レーキ（後ろ上がり）', 'Rake (rear up)');
    const curSt = S.stance || 'custom';
    $('#g-spre').innerHTML = [...Object.keys(STANCE_PRESETS), 'custom'].map(k => `<button data-sp="${k}" class="${curSt === k ? 'on' : ''}">${esc(SPN[k])}</button>`).join('');
    { const tk = STANCE_TERM[curSt], T = tk && term(tk), el = $('#g-term'); if (el) el.innerHTML = T ? `<b>${esc(T.ja)}</b> — ${esc(this.gloss(T))}` : ''; } // v2.12: what the preset means
    $('#g-spre').onclick = ev => { const b = ev.target.closest('[data-sp]'); if (!b || b.dataset.sp === 'custom') return; g.applyPreview({ stance: b.dataset.sp, ...STANCE_PRESETS[b.dataset.sp] }); this.showGarage(); };
    const sl = (sel, key, fmt) => { const i = $(sel); i.value = S[key]; const out = i.nextElementSibling; out.textContent = fmt(+i.value); i.oninput = () => { out.textContent = fmt(+i.value); g.applyPreview({ [key]: +i.value, stance: 'custom' }); $('#g-spre').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.sp === 'custom')); }; };
    sl('#g-cf', 'camberF', v => v.toFixed(1) + '°'); sl('#g-cr', 'camberR', v => v.toFixed(1) + '°');
    sl('#g-ride', 'ride', v => (v > 0 ? '+' : '') + (v * 1000).toFixed(0) + ' mm'); sl('#g-track', 'track', v => (v >= 0 ? '+' : '') + (v * 1000).toFixed(0) + ' mm');
    sl('#g-tf', 'toeF', v => v.toFixed(1) + '°'); sl('#g-tr', 'toeR', v => v.toFixed(1) + '°'); sl('#g-rk', 'rake', v => (v > 0 ? '+' : '') + (v * 1000).toFixed(0) + ' mm');
    // performance tuning: presets + sliders (any slider edit switches the preset to "custom")
    {
      const T = resolveTune(S.tune);
      $('#g-tpre').innerHTML = [...Object.keys(TUNE_PRESETS), 'custom'].map(k => `<button data-tp="${k}" class="${T.preset === k ? 'on' : ''}">${esc(t('game.tune.p.' + k))}</button>`).join('');
      $('#g-tpre').onclick = ev => { const b = ev.target.closest('[data-tp]'); if (!b) return; const k = b.dataset.tp; g.applyPreview({ tune: k === 'custom' ? { ...T, preset: 'custom' } : { preset: k } }); this.showGarage(); };
      for (const o of $('#t-tyre').options) o.textContent = t('game.tune.ty.' + o.value);
      const fmt = { power: v => Math.round(v * car.engine.hp) + ' PS', weight: v => Math.round(car.mass * (1 - v)) + ' kg', final: v => '×' + v.toFixed(2), brake: v => Math.round(v * 100) + '%', bias: v => Math.round(v * 100) + ' : ' + Math.round(100 - v * 100), balance: v => (v > 0.02 ? 'OS +' : v < -0.02 ? 'US ' : '') + v.toFixed(2), aero: v => Math.round(v * 100) + '%', lock: v => v.toFixed(0) + '°' };
      const edit = (key, val) => { const nt = { ...resolveTune(g.carSetup(id).tune), [key]: val, preset: 'custom' }; g.applyPreview({ tune: nt }); $('#g-tpre').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tp === 'custom')); summary(nt); };
      const summary = tt => { $('#t-sum').textContent = t('game.tune.sum', { hp: Math.round(tt.power * car.engine.hp), kg: Math.round(car.mass * (1 - tt.weight)), pw: (Math.round(car.mass * (1 - tt.weight)) / Math.round(tt.power * car.engine.hp)).toFixed(2) }); };
      for (const key of Object.keys(fmt)) { const i = $('#t-' + key); i.value = T[key]; const out = i.nextElementSibling; out.textContent = fmt[key](+i.value); i.oninput = () => { out.textContent = fmt[key](+i.value); edit(key, +i.value); }; }
      $('#t-tyre').value = T.tyre; $('#t-tyre').onchange = ev => edit('tyre', ev.target.value);
      summary(T);
    }
    $('#g-strobe').innerHTML = STROBE_MODES.map(m => `<option value="${m}">${esc(t('game.strobe.' + m))}</option>`).join('');
    $('#g-strobe').value = S.strobe; $('#g-strobe').onchange = ev => { g.applyPreview({ strobe: ev.target.value }); g.preview.lights.strobe = ev.target.value; };
    $('#g-trans').value = g.settings.transmission; $('#g-trans').onchange = ev => { g.settings.transmission = ev.target.value; g.saveSettings(); };
    if (car.trans.type === 'EV') $('#g-trans').disabled = true; else $('#g-trans').disabled = false;
    // plate editor
    $('#g-pregion').innerHTML = PLATE_REGIONS.map(r => `<option>${r}</option>`).join('');
    $('#g-pkana').innerHTML = PLATE_KANA.map(k => `<option>${k}</option>`).join('');
    const upd = () => { const p = { ...g.carSetup(id).plate, region: $('#g-pregion').value, cls: $('#g-pcls').value.replace(/[^0-9A-Z]/gi, '').slice(0, 3) || '300', kana: $('#g-pkana').value, num: Math.max(1, Math.min(9999, +$('#g-pnum').value || 1)) }; g.applyPreview({ plate: p }); this.fillPlate(); };
    for (const s of ['#g-pregion', '#g-pcls', '#g-pkana', '#g-pnum']) $(s).onchange = upd;
    { const L3 = (ko, ja, en) => ({ ko, ja, en })[getLang()] || en; const ps = $('#g-pstyle'); const N = { normal: L3('일반 번호판', '通常ナンバー', 'Standard plate'), glow: L3('字光式 (야광) 번호판', '字光式ナンバー', 'Illuminated (字光式) plate'), tilt: L3('꺾인 번호판 (お辞儀)', 'お辞儀ナンバー', 'Bowed (お辞儀) plate') };
      for (const o of ps.options) o.textContent = N[o.value]; ps.value = g.carSetup(id).plate.style || 'normal';
      ps.onchange = () => g.applyPreview({ plate: { ...g.carSetup(id).plate, style: ps.value } }); }
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
    const rng = (key, label, min = 0, max = 1, step = 0.01) => `<label><span>${esc(t(label))}</span><input type="range" data-s="${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}"></label>`;
    const chk = (key, label) => `<label class="chk"><input type="checkbox" data-s="${key}" ${s[key] ? 'checked' : ''}><span>${esc(t(label))}</span></label>`;
    // driving difficulty / assists (labels fall back to built-in en/ko/ja text until the i18n keys exist)
    const tf = (k, f) => { const x = t(k); return x !== k ? x : typeof f === 'string' ? f : (f[getLang()] || f.en); };
    const selF = (key, opts, label, fb) => `<label><span>${esc(tf(label, fb))}</span><select data-s="${key}">${opts.map(([v, l, lf]) => `<option value="${v}" ${String(s[key]) === String(v) ? 'selected' : ''}>${esc(tf(l, lf))}</option>`).join('')}</select></label>`;
    const ON = { en: 'On', ko: '켜기', ja: 'オン' }, OFF = { en: 'Off', ko: '끄기', ja: 'オフ' }, SPORT = { en: 'Sport', ko: '스포츠', ja: 'スポーツ' };
    const assistHtml =
      selF('steerAssist', [['assisted', 'game.assist.assisted', { en: 'Assisted', ko: '보조', ja: 'アシスト' }], ['standard', 'game.assist.standard', { en: 'Standard', ko: '표준', ja: 'スタンダード' }], ['sim', 'game.assist.sim', { en: 'Simulation', ko: '시뮬레이션', ja: 'シミュレーション' }]], 'game.set.steerAssist', { en: 'Steering', ko: '조향', ja: 'ステアリング' }) +
      selF('stm', [['full', 'game.assist.on', ON], ['sport', 'game.assist.sport', SPORT], ['off', 'game.assist.off', OFF]], 'game.set.stm', { en: 'Stability control (STM)', ko: '자세 제어 (STM)', ja: '姿勢制御 (STM)' }) +
      selF('tcs', [['full', 'game.assist.on', ON], ['sport', 'game.assist.sport', SPORT], ['off', 'game.assist.off', OFF]], 'game.set.tcs', { en: 'Traction control (TCS)', ko: '트랙션 컨트롤 (TCS)', ja: 'トラクションコントロール (TCS)' }) +
      selF('abs', [['true', 'game.assist.on', ON], ['false', 'game.assist.off', OFF]], 'game.set.abs', 'ABS') +
      selF('police', [['lenient', 'game.police.lenient', { en: 'Lenient (+60 km/h)', ko: '관대 (+60 km/h)', ja: '寛容 (+60 km/h)' }], ['normal', 'game.police.normal', { en: 'Normal (+40 km/h)', ko: '보통 (+40 km/h)', ja: '標準 (+40 km/h)' }], ['strict', 'game.police.strict', { en: 'Strict (+25 km/h)', ko: '엄격 (+25 km/h)', ja: '厳しい (+25 km/h)' }]], 'game.set.police', { en: 'Police tolerance', ko: '경찰 단속 기준', ja: '取り締まり基準' });
    // v2.4: the essentials up top, the rest folded into sections (open state kept across rebuilds)
    const L3 = (ko, ja, en) => ({ ko, ja, en })[getLang()] || en;
    this._sOpen = this._sOpen || {};
    const sec = (id, title, html) => `<details class="ssec" data-sec="${id}" ${this._sOpen[id] ? 'open' : ''}><summary>${esc(title)}</summary><div class="sgrid">${html}</div></details>`;
    $('#s-grid').innerHTML =
      `<div class="sgrid sbasic">` +
      `<label><span>${esc(t('game.set.lang'))}</span><select id="s-lang">${LANGS.map(([c, n]) => `<option value="${c}" ${c === getLang() ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` +
      sel('quality', [['low', t('game.q.low')], ['medium', t('game.q.medium')], ['high', t('game.q.high')], ['ultra', t('game.q.ultra')]], 'game.set.quality', true) +
      selF('difficulty', [['beginner', 'game.diff.beginner', { en: 'Beginner', ko: '초보', ja: 'ビギナー' }], ['standard', 'game.diff.standard', { en: 'Standard', ko: '표준', ja: 'スタンダード' }], ['pro', 'game.diff.pro', { en: 'Pro', ko: '프로', ja: 'プロ' }], ['sim', 'game.diff.sim', { en: 'Simulation', ko: '시뮬레이션', ja: 'シミュレーション' }], ['custom', 'game.diff.custom', { en: 'Custom', ko: '사용자 지정', ja: 'カスタム' }]], 'game.set.difficulty', { en: 'Driving difficulty', ko: '주행 난이도', ja: '運転難易度' }) +
      sel('transmission', [['auto', t('game.trans.auto')], ['manual', t('game.trans.manual')], ['manual_clutch', t('game.trans.manual_clutch')]], 'game.set.transmission') +
      sel('weather', [['auto', t('game.weather.auto')], ['clear', t('game.weather.clear')], ['cloudy', t('game.weather.cloudy')], ['rain', t('game.weather.rain')], ['storm', t('game.weather.storm')], ['fog', t('game.weather.fog')]], 'game.set.weather') +
      rng('master', 'game.set.master') +
      `<label class="chk"><input type="checkbox" data-s="damage" ${s.damage ? 'checked' : ''}><span>${esc(L3('차량 파손 효과', '車体の損傷', 'Car damage'))}</span></label>` +
      chk('online', 'game.set.online') + chk('fps', 'game.set.fps') +
      `</div>` +
      sec('drive', L3('주행 보조', '運転アシスト', 'Driving assists'), assistHtml + chk('assist', 'game.set.assist') + chk('etc', 'game.set.etc')) +
      sec('gfx', L3('화면', '画面', 'Display'),
        sel('resScale', [[0.5, '50%'], [0.75, '75%'], [1, '100%']], 'game.set.res') +
        sel('timeSpeed', [[1, t('game.set.time1')], [0.25, t('game.set.time025')], [0, t('game.set.time0')]], 'game.set.time') +
        sel('touch', [['auto', t('game.set.auto')], ['on', 'ON'], ['off', 'OFF']], 'game.set.touch') +
        chk('bloom', 'game.set.bloom') + chk('shake', 'game.set.shake') + chk('tilt', 'game.set.tilt')) +
      sec('snd', L3('사운드', 'サウンド', 'Sound'),
        rng('engine', 'game.set.engine') + rng('sfx', 'game.set.sfx') + rng('ambient', 'game.set.ambient') + rng('radio', 'game.set.radio') + chk('dj', 'game.set.dj') + chk('voice', 'game.set.voice')) +
      `<div class="row center"><button class="btn sm ghost" id="s-reset">${esc(L3('기본값으로 되돌리기', '初期設定に戻す', 'Reset to defaults'))}</button></div>`;
    $('#s-grid').querySelectorAll('details.ssec').forEach(d => d.ontoggle = () => { this._sOpen[d.dataset.sec] = d.open; });
    $('#s-reset').onclick = () => {
      const keep = { v22: s.v22, v24: s.v24, v111: s.v111, fpsOn: s.fpsOn, v253: 1 };
      for (const k of Object.keys(s)) delete s[k]; Object.assign(s, DEFAULT_SETTINGS, keep);
      g.saveSettings(); g.applyVolumes(); g.vehicle?.setAssists(assistsFromSettings(s));
      if (g.bloom) g.bloom.enabled = s.bloom && g.quality !== 'low';
      if (g.model) g.fx?.repair(g.model);
      this.buildSettings(); this.toast(L3('기본 설정으로 되돌렸습니다', '初期設定に戻しました', 'Settings reset'), 'info', 2);
    };
    $('#s-lang').onchange = e => setLang(e.target.value).then(() => this.buildSettings());
    $('#s-grid').querySelectorAll('[data-s]').forEach(i => i.onchange = i.oninput = () => {
      const k = i.dataset.s; let v = i.type === 'checkbox' ? i.checked : i.type === 'range' ? +i.value : i.value;
      if (['resScale', 'timeSpeed'].includes(k)) v = +v;
      if (k === 'abs') v = v === 'true';
      s[k] = v; g.applyVolumes();
      clearTimeout(this._saveT); this._saveT = setTimeout(() => g.saveSettings(), i.type === 'range' ? 300 : 0);
      if (k === 'damage' && !v && g.model) g.fx?.repair(g.model);
      if (k === 'resScale') { g.renderer.setPixelRatio(g.basePR()); g.composer.setPixelRatio?.(g.renderer.getPixelRatio()); g.composer.setSize(innerWidth, innerHeight); }
      if (k === 'weather') this.labelHUD();
      if (k === 'tilt') { g.input.tilt = v; if (v && typeof DeviceOrientationEvent?.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {}); }
      if (k === 'dj' && g.radio) g.radio.djVoice = v;
      if (k === 'voice') g.audio.voiceOn = v;
      if (k === 'online') { if (v && g.vehicle) g.online.start(); else if (!v) g.online.stop(); this.updateOnline(); }
      if (k === 'bloom') g.bloom.enabled = v && g.quality !== 'low'; // user-chosen: one recompile is fine here
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
      if (it.type === 'shop') { g.audio.speak('ありがとうございましたー。', 'ja-JP', { role: 'female', seed: 5 }); g.konbiniStaff?.served(); }
      this.toast(t('game.shop.bought', { item: x.ja }), 'info');
      if (g.player) { g.player.hold = 'drink'; clearTimeout(this._holdT); this._holdT = setTimeout(() => { if (g.player) g.player.hold = null; }, 9000); }
      $('#shop').classList.remove('show');
    };
    $('#shop').classList.add('show');
  }
  // v2.4.1: change car / tune right where you are (stops the car first if it is rolling slowly)
  quickGarage() {
    const g = this.g, v = g.vehicle; if (g.mode !== 'drive' && g.mode !== 'walk') return;
    if (v && Math.abs(v.kmh) > 12) { this.toast(t('game.walk.stopfirst'), 'warn', 2); return; }
    if (g.autopilot?.on) g.autopilot.toggle(false);
    if (g.mode === 'walk') g.enterCar();
    if (v) { v.vel.set(0, 0, 0); v.vx = 0; v.vlat = 0; }
    g.openGarage();
  }
  // a one-line key guide when a drive starts (fades after 12 s)
  keyHint() {
    const el = document.getElementById('keyhint'); if (!el || matchMedia('(pointer:coarse)').matches) return;
    const L = { ko: ['W/S 가속·브레이크', 'A/D 조향', 'M 지도', 'U 차고·튜닝', 'J 자동주행', 'C 카메라', 'L 라이트', 'B 비상등', 'Y 다음 곡', 'Esc 메뉴'], ja: ['W/S アクセル・ブレーキ', 'A/D ハンドル', 'M 地図', 'U ガレージ', 'J 自動運転', 'C カメラ', 'L ライト', 'B ハザード', 'Y 次の曲', 'Esc メニュー'], en: ['W/S throttle·brake', 'A/D steer', 'M map', 'U garage', 'J autopilot', 'C camera', 'L lights', 'B hazards', 'Y next song', 'Esc menu'] }[getLang()] || null;
    const items = L || ['W/S throttle·brake', 'A/D steer', 'M map', 'U garage', 'J autopilot', 'C camera', 'L lights', 'B hazards', 'Esc menu'];
    el.innerHTML = items.map(x => { const [k, ...r] = x.split(' '); return `<span><kbd>${esc(k)}</kbd>${esc(r.join(' '))}</span>`; }).join('');
    el.hidden = false; el.classList.remove('fade'); clearTimeout(this._khT); this._khT = setTimeout(() => el.classList.add('fade'), 12000); setTimeout(() => { if (el.classList.contains('fade')) el.hidden = true; }, 13500);
  }
  setAuto(on) { document.getElementById('autobtn')?.classList.toggle('on', !!on); }
  // v2.5.4: the picked point — its name large (play language + Japanese), and one button per direction of travel
  showMapSel(x, z) {
    const g = this.g, box = $('#mapsel'); box.hidden = false;
    const ja = g.world.zoneAt(x, z, 0) || '', rd = reading(ja.split(' · ')[0]) || '';
    const L3 = (ko, jaT, en) => ({ ko, ja: jaT, en })[getLang()] || en;
    const DIRS = { ko: ['북', '북동', '동', '남동', '남', '남서', '서', '북서'], ja: ['北', '北東', '東', '南東', '南', '南西', '西', '北西'], en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] };
    const comp = yaw => { const a = (Math.atan2(Math.sin(yaw), -Math.cos(yaw)) * 180 / Math.PI + 360) % 360; return (DIRS[getLang()] || DIRS.en)[Math.round(a / 45) % 8]; }; // +x east, +z south
    const opts = g.tpOptions(x, z); this.mapSel.opts = opts;
    const main = rd && getLang() !== 'ja' ? rd : ja.split(' · ')[0]; box.innerHTML = `<div class="ms-name"><b>${esc(main)}</b>${ja && ja !== main ? `<small>${esc(ja)}</small>` : ''}</div>` +
      `<button class="btn sm primary" data-a="mapNav">${esc(t('game.map.route'))}</button>` +
      (opts.length ? opts.map((o, i) => `<button class="btn sm" data-a="mapTp${i}">➜ ${esc(comp(o.yaw))}${esc(L3('쪽으로 출발', '方面へ', ' bound'))}<small>${esc(o.name)}</small></button>`).join('') : `<button class="btn sm" data-a="mapTp">${esc(t('game.map.tp'))}</button>`);
  }
  toggleMap(force) {
    this.mapOpen = force ?? !this.mapOpen; $('#map').classList.toggle('show', this.mapOpen);
    if (!this.mapOpen) return;
    const cv = $('#bigmap'), dpr = Math.min(2, devicePixelRatio || 1); const rb = cv.getBoundingClientRect(); cv.width = (rb.width || innerWidth) * dpr; cv.height = (rb.height || innerHeight) * dpr;
    if (!this.mv) { this.mv = { x: 0, z: 0, k: 0.35 * dpr }; this.wireMap(cv); }
    // v2.2: open on your own position (≈ 2.5 km across) and keep following you; driving / autopilot carry on underneath
    this.mv.k = Math.min(cv.width, cv.height) / 2500; this.mapFollow = true; this.mapCenterMe();
    this.buildQuickTravel();
    clearInterval(this._mapLive); this._mapLive = setInterval(() => { if (!this.mapOpen) { clearInterval(this._mapLive); return; } if (this.mapFollow) { const p = this.mapPos(); if (p) { this.mv.x = p.x; this.mv.z = p.z; } } this.drawBigMap(); }, 150);
  }
  // v2.7.1 — quick travel: every destination with its photo, which way it lies from you (arrow turned to your heading,
  // compass point) and how far; picking one centres the map there and offers the carriageway + direction buttons
  buildQuickTravel() {
    const box = $('#qt-list'); if (!box) return; const p = this.mapPos(); const g = this.g;
    const yaw = g.mode === 'walk' ? g.player?.yaw ?? 0 : g.vehicle?.yaw ?? 0;
    const DIRS = { ko: ['북', '북동', '동', '남동', '남', '남서', '서', '북서'], ja: ['北', '北東', '東', '南東', '南', '南西', '西', '北西'] }[getLang()] || ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    $('#qt .qt-h').textContent = ({ ko: '빠른 이동', ja: 'クイック移動' })[getLang()] || 'Quick travel';
    box.innerHTML = DESTS.map(d => {
      const dx = d.x - (p?.x ?? 0), dz = d.z - (p?.z ?? 0), dist = Math.hypot(dx, dz);
      const brg = Math.atan2(dx, dz), rel = brg - yaw; // game yaw: 0 = +z (south)
      const comp = DIRS[Math.round(((Math.atan2(dx, -dz) * 180 / Math.PI) + 360) % 360 / 45) % 8];
      const rd = getLang() !== 'ja' ? reading(d.name) : '';
      const km = dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(dist < 10000 ? 1 : 0) + ' km';
      return `<button class="qt-card" data-a="qt:${d.id}"><img src="assets/tp/${d.id}.webp" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span class="qt-t"><b>${esc(d.name)}</b>${rd ? `<small>${esc(rd)}</small>` : ''}</span><span class="qt-d"><i style="transform:rotate(${(-rel * 180 / Math.PI).toFixed(0)}deg)">▲</i>${esc(comp)} · ${km}</span></button>`;
    }).join('');
  }
  mapPos() { return this.g.mode === 'walk' ? this.g.player?.pos : this.g.vehicle?.pos; }
  mapZoom(f, cx, cy) { const cv = $('#bigmap'), m = this.mv; cx ??= cv.width / 2; cy ??= cv.height / 2; const wx = m.x + (cx - cv.width / 2) / m.k, wz = m.z + (cy - cv.height / 2) / m.k; m.k = Math.max(0.00012, Math.min(12, m.k * f)); m.x = wx - (cx - cv.width / 2) / m.k; m.z = wz - (cy - cv.height / 2) / m.k; this.drawBigMap(); }
  mapJapan() { const cv = $('#bigmap'); this.mapFollow = false; this.mv.x = 300000; this.mv.z = -100000; this.mv.k = 0.95 * Math.min(cv.width / 2400000, cv.height / 2700000); this.drawBigMap(); } // v2.7.1: all of Japan
  mapCenterMe() { this.mapFollow = true; const p = this.mapPos(); if (p) { this.mv.x = p.x; this.mv.z = p.z; } this.drawBigMap(); }
  mapFitAll() { const cv = $('#bigmap'); let a = [1e9, 1e9, -1e9, -1e9]; for (const r of this.g.net.roads) for (const q of r.samples) { a[0] = Math.min(a[0], q.p.x); a[1] = Math.min(a[1], q.p.z); a[2] = Math.max(a[2], q.p.x); a[3] = Math.max(a[3], q.p.z); } this.mv.x = (a[0] + a[2]) / 2; this.mv.z = (a[1] + a[3]) / 2; this.mv.k = 0.9 * Math.min(cv.width / (a[2] - a[0]), cv.height / (a[3] - a[1])); this.drawBigMap(); }
  wireMap(cv) {
    const pts = new Map(); let pinch = 0;
    cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), d = cv.width / r.width; this.mapZoom(Math.exp(-e.deltaY * 0.0015), (e.clientX - r.left) * d, (e.clientY - r.top) * d); }, { passive: false });
    let down = null;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); down = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', e => {
      pts.delete(e.pointerId); pinch = 0;
      // a tap (no drag) picks a point: route there or teleport
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const r = cv.getBoundingClientRect(), d = cv.width / r.width; const x = this.mv.x + ((e.clientX - r.left) * d - cv.width / 2) / this.mv.k, z = this.mv.z + ((e.clientY - r.top) * d - cv.height / 2) / this.mv.k; this.mapSel = { x, z }; this.showMapSel(x, z); this.drawBigMap(); }
      down = null;
    });
    cv.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch = 0; });
    cv.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || pts.size) return; const r = cv.getBoundingClientRect(), d = cv.width / r.width; this._mapHover = { x: this.mv.x + ((e.clientX - r.left) * d - cv.width / 2) / this.mv.k, z: this.mv.z + ((e.clientY - r.top) * d - cv.height / 2) / this.mv.k }; clearTimeout(this._hovT); this._hovT = setTimeout(() => this.drawBigMap(), 30); });
    cv.addEventListener('pointermove', e => {
      const prev = pts.get(e.pointerId); if (!prev) return; const r = cv.getBoundingClientRect(), d = cv.width / r.width;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const dist = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) this.mapZoom(dist / pinch, ((a[0] + b[0]) / 2 - r.left) * d, ((a[1] + b[1]) / 2 - r.top) * d); pinch = dist; return; }
      this.mapFollow = false; this.mv.x -= (e.clientX - prev[0]) * d / this.mv.k; this.mv.z -= (e.clientY - prev[1]) * d / this.mv.k; this.drawBigMap();
    });
  }
  updateGoals() { const b = $('#goals-btn'), G = this.g.goals; if (b && G) b.textContent = `🏆 ${t('game.goal.title')} (${G.count}/${GOALS.length})`; }
  buildGoals() {
    const G = this.g.goals;
    $('#g-body').innerHTML = GOALS.map(d => { const done = G.done(d.id), p = G.progress(d); const bar = d.target ? `<div class="g-bar"><i style="width:${Math.min(100, p / d.target * 100)}%"></i></div><span class="g-num">${p}/${d.target}${d.id === 'c1' || d.id === 'distance' || d.id === 'roadtrip' ? ' km' : d.id === 'drift' ? ' s' : ''}</span>` : '';
      return `<div class="g-item${done ? ' done' : ''}"><span class="g-ic">${d.icon}</span><div class="g-txt"><b>${esc(t('game.goal.' + d.id))}</b><small>${esc(t('game.goal.' + d.id + '.d'))}</small>${bar}</div><span class="g-rw">${done ? '✓' : '¥' + d.reward.toLocaleString()}</span></div>`; }).join('');
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
  // v2.13 — spawn picker preview: an aerial map (the baked OSM raster) of the chosen start, ~2 km across, with the
  // expressways drawn on top and an arrow at the spawn point facing the way you will set off
  spawnPreview(region) {
    const cv = $('#t-spawnmap'); if (!cv) return; const g = this.g; let sp = null;
    try { sp = region === 'pa' ? { pos: new THREE.Vector3((PA_RECT.x0 + PA_RECT.x1) / 2, 0, (PA_RECT.z0 + PA_RECT.z1) / 2), yaw: 0 } : g.regionSpawn(region); } catch {}
    if (!sp) { cv.hidden = true; return; } cv.hidden = false;
    const draw = () => { const c = cv.getContext('2d'), W = cv.width, H = cv.height, k = W / 2200, m = { x: sp.pos.x, z: sp.pos.z };
      const P = (x, z) => [(x - m.x) * k + W / 2, (z - m.z) * k + H / 2];
      c.fillStyle = '#0d2236'; c.fillRect(0, 0, W, H); c.fillStyle = '#232c38'; // sea, then land polygons as a base
      for (const l of MAP.land || []) { if (!l.pts?.length) continue; c.beginPath(); l.pts.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); c.fill(); }
      try { this.drawMapRaster(c, W, H, m, k, 1); } catch {}
      c.lineCap = 'round';
      for (const r of g.net.roads) { if (r.kind === 'local') continue; const S = r.samples; if (!S.some(q => Math.abs(q.p.x - m.x) < 1400 && Math.abs(q.p.z - m.z) < 900)) continue;
        c.strokeStyle = r.kind === 'expressway' ? 'rgba(47,191,116,.95)' : 'rgba(143,224,178,.85)'; c.lineWidth = r.kind === 'expressway' ? 3 : 2; c.beginPath(); S.forEach((q, i) => { if (i % 3) return; const [a, b] = P(q.p.x, q.p.z); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.stroke(); }
      const [ax, az] = P(sp.pos.x, sp.pos.z); c.save(); c.translate(ax, az); c.rotate(-sp.yaw + Math.PI); c.fillStyle = '#ff6a3d'; c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, -13); c.lineTo(9, 9); c.lineTo(0, 4); c.lineTo(-9, 9); c.closePath(); c.fill(); c.stroke(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.strokeRect(0.5, 0.5, W - 1, H - 1); };
    draw(); for (const t of [300, 900, 2000, 4000]) setTimeout(() => { if ($('#t-spawn')?.value === region) draw(); }, t); // raster tiles arrive a moment later
  }
  // v2.12 — plain-language glossary (data/glossary.js): the explanation in the player's language
  gloss(T) { const L = getLang(); return L === 'ko' ? T.ko : L === 'ja' ? T.jp : T.en; }
  showGlossary() {
    $('#glossary')?.remove(); const L = getLang();
    const H = { ko: ['용어 사전', '차나 일본 도로를 잘 몰라도 괜찮아요', { stance: '차고·튜닝', drive: '운전', road: '도로', car: '자동차' }], ja: ['用語集', 'クルマや日本の道路に詳しくなくても大丈夫', { stance: '車高・カスタム', drive: '運転', road: '道路', car: 'クルマ' }] }[L] || ['Glossary', 'No car or Japan know-how needed', { stance: 'Stance & tuning', drive: 'Driving', road: 'Roads', car: 'Cars' }];
    const groups = ['road', 'stance', 'drive', 'car'].map(tag => `<h3>${esc(H[2][tag])}</h3>` + GLOSSARY.filter(g => g.tag === tag).map(g => `<div class="gl-item"><b lang="ja">${esc(g.ja)}</b>${g.r ? `<small>${esc(g.r)}</small>` : ''}<p>${esc(this.gloss(g))}</p></div>`).join('')).join('');
    const el = document.createElement('div'); el.id = 'glossary'; el.className = 'screen show dim';
    el.innerHTML = `<div class="menu gl-box"><h2>📖 ${esc(H[0])}</h2><p class="gl-sub">${esc(H[1])}</p><div class="gl-list">${groups}</div><button class="btn sm" data-a="glossClose">✕</button></div>`;
    $('#ui').appendChild(el);
  }
  // first time you drive onto a kind of road (湾岸線, C1, a touge …): a short card saying what it is
  roadTip(road) {
    if (!road?.name || this._tipRoad === road.name) return; this._tipRoad = road.name;
    const hit = ROAD_TERM.find(([re]) => re.test(road.name)); if (!hit) return; const T = term(hit[1]); let seen = {};
    try { seen = JSON.parse(localStorage.getItem('dn.tips') || '{}'); } catch {}
    if (seen[T.k]) return; seen[T.k] = 1; try { localStorage.setItem('dn.tips', JSON.stringify(seen)); } catch {}
    this.toast(`📖 ${T.ja} — ${this.gloss(T)}`, 'info', 9);
  }
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
    this._rpT = (this._rpT || 0) - dt;
    if (this._rpT <= 0) { this._rpT = 0.5; const pill = document.getElementById('radiopill'), r = g.radio; if (pill) { const on = !!(r?.on && g.mode === 'drive'); pill.hidden = !on; if (on) { const n = r.nowPlaying(), txt = `📻 ${n.station} · ${n.title || ''}${n.artist ? ' — ' + n.artist : ''}`; if (txt !== this._rpTxt) { this._rpTxt = txt; pill.querySelector('.rp-t').textContent = txt; } } } }
    if (this._promptT !== undefined) { this._promptT -= dt; if (this._promptT <= 0) { $('#hud .prompt').classList.remove('show'); this._promptT = undefined; } }
    if (g.mode !== 'drive' && g.mode !== 'walk') return;
    if (g.mode === 'drive' && g.vehicle) this.drawSpeedo(g.vehicle, dt); // every frame: smooth needle/gear motion
    if (g.mode === 'drive' && g.vehicle?.road && (this._tipT = (this._tipT || 0) - dt) <= 0) { this._tipT = 1; this.roadTip(g.vehicle.road); }
    if ((this._gtT = (this._gtT || 0) - dt) <= 0 && g.goals) { this._gtT = 0.5; const G = g.goals, el2 = $('#goaltrack');
      const next = GOALS.find(d => !G.done(d.id) && d.target && G.progress(d) > 0) || GOALS.find(d => !G.done(d.id));
      if (!next) el2.innerHTML = `🏆 ${esc(t('game.goal.all'))}`; else { const p = G.progress(next); el2.innerHTML = `<span class="gt-k">🏆 ${G.count}/${GOALS.length}</span> ${next.icon} ${esc(t('game.goal.' + next.id))}${next.target ? ` <b>${p}/${next.target}</b>` : ''}`; } }
    this._acc = (this._acc || 0) + dt; if (this._acc < 1 / 20) return; const step = this._acc; this._acc = 0;
    const v = g.vehicle;
    const pos = g.mode === 'walk' ? g.player.pos : v.pos;
    { const z = g.world.zoneAt(pos.x, pos.z, pos.y); if (z !== this._zone) { this._zone = z; const el = $('#hud .loc'); el.textContent = z; const r = reading(z); if (r) { const sm = document.createElement('small'); sm.className = 'loc-r'; sm.textContent = r; el.appendChild(sm); } } }
    $('#hud .clock').textContent = g.tod.clock;
    $('#hud .money').textContent = yen(g.money);
    $('#hud .fps').textContent = `MIDNIGHT JAPAN v${GAME.version}` + (g.settings.fps ? ` · ${Math.round(g.fps || 0)} FPS` : '');
    $('#hud .speedo').style.display = g.mode === 'drive' ? '' : 'none';
    if (g.frame % 4 === 0) this.drawMini(pos, g.mode === 'drive' ? v.yaw : g.player.yaw);
    // GPS: distance + turn arrow
    const nv = g.nav, nh = $('#navhud');
    if (nv?.target) { nh.hidden = false; const yaw = g.mode === 'drive' ? v.yaw : g.player.yaw; const a = nv.hint(pos, yaw) ?? Math.atan2(nv.target.x - pos.x, nv.target.z - pos.z) - yaw; nh.querySelector('.nav-arrow').style.transform = `rotate(${-a}rad)`; const d = nv.dist ?? 0; nh.querySelector('.nav-dist').textContent = d > 950 ? (d / 1000).toFixed(1) + ' km' : Math.round(d / 10) * 10 + ' m'; } else nh.hidden = true;
    // police: distance / ETA while being chased or after a crash, last known position after losing them
    const ph = $('#pursuit'), pi = g.police?.hud?.(pos);
    if (pi) { ph.hidden = false; ph.textContent = pi; } else ph.hidden = true;
  }
  drawSpeedo(v, dt = 1 / 20) {
    const c = this.speedo, W = 260, cx = 130, cy = 130;
    c.setTransform(c.canvas.width / 260, 0, 0, c.canvas.width / 260, 0, 0); // v2.4.1: drawn at 2× (sharp on Retina / phones)
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
    if (!v.ev) {
      // v2.4.1: minor ticks every 500 rpm, shift lights, turbo boost
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
      for (let r = 0; r <= maxR; r += 500) { const a = a0 + (a1 - a0) * r / maxR, r0 = r % 1000 ? 97 : 94; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * 100, cy + Math.sin(a) * 100); c.stroke(); }
      const sl = (rpm - red * 0.72) / (red * 0.24), flash = rpm > red * 0.96 && (performance.now() % 160) < 80;
      for (let i = 0; i < 7; i++) { const on = sl * 7 > i, x = cx - 42 + i * 14, y = cy - 52; const col = i < 3 ? '#38e07b' : i < 5 ? '#ffd23f' : '#ff3b3b';
        c.fillStyle = flash ? '#5aa9ff' : on ? col : 'rgba(255,255,255,.1)'; c.beginPath(); c.arc(x, y, 4.2, 0, Math.PI * 2); c.fill(); }
      if (v.car.engine.turbo) { const bst = Math.max(0, v.engine.boost || 0); c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.arc(cx, cy, 70, Math.PI * 0.62, Math.PI * 0.38, true); c.stroke();
        c.strokeStyle = '#5ad1ff'; c.beginPath(); c.arc(cx, cy, 70, Math.PI * 0.62, Math.PI * 0.62 - bst * Math.PI * 0.24 * 1, true); c.stroke();
        c.fillStyle = 'rgba(160,225,255,.85)'; c.font = '600 9px system-ui'; c.textAlign = 'right'; c.fillText('BOOST ' + (bst * 1.2).toFixed(1), cx - 24, cy + 92); }
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
  // v2.4.1: a big heading-up map in the bottom-left — the real map (OSM raster) underneath the roads, traffic, your
  // car and route, zooming out with speed; the footer names your car and where you are
  mapTile(lv, i, j) {
    const R = this.mapRaster || (this.mapRaster = { idx: null, img: new Map() });
    if (!R.idx) { if (!R.loading) R.loading = fetch(new URL('../../assets/map/index.json', import.meta.url)).then(r => r.json()).then(j => { R.idx = j; R.has = j.levels.map(L => new Set(L.tiles.map(t => t[0] + '_' + t[1]))); }).catch(() => {}); return null; }
    const key = i + '_' + j; if (!R.has[lv]?.has(key)) return null;
    const id = lv + '/' + key; let im = R.img.get(id);
    if (!im) { im = new Image(); im.decoding = 'async'; im.src = new URL(`../../assets/map/${id}.webp`, import.meta.url).href; R.img.set(id, im); }
    return im.complete && im.naturalWidth ? im : null;
  }
  drawMini(pos, yaw) {
    const cv = this.mini.canvas, c = this.mini, DW = cv.width, DH = cv.height;
    const box = cv.getBoundingClientRect(); const W = box.width || 340, H = box.height || 250, k = DW / W;
    const v = this.g.vehicle, kmh = Math.abs(v?.kmh || 0);
    this._mmS = this._mmS === undefined ? 0.5 : this._mmS + ((0.62 - Math.min(0.34, kmh / 450)) - this._mmS) * 0.08;
    const S = this._mmS * (W / 340) * 1.15, cx = W / 2, cy = H * 0.6, FOOT = 26, rr = 14;
    c.save(); c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, W, H);
    const rrect = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    rrect(0, 0, W, H, rr); c.clip();
    c.fillStyle = 'rgba(14,30,52,.9)'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(cx, cy); c.rotate(Math.PI + yaw); c.scale(S, S); c.translate(-pos.x, -pos.z);
    // real map underneath (4 m/px detail, 16 m/px further out)
    const R = this.mapRaster, reach = Math.hypot(W, H) / S;
    for (const lv of [0, 1]) { this.mapTile(lv, 0, 0); const L = R?.idx?.levels?.[lv]; if (!L) continue; const s2 = L.size;
      c.globalAlpha = lv ? 0.95 : 0.8;
      for (let i = Math.floor((pos.x - reach) / s2); i * s2 < pos.x + reach; i++) for (let j = Math.floor((pos.z - reach) / s2); j * s2 < pos.z + reach; j++) { const im = this.mapTile(lv, i, j); if (im) c.drawImage(im, i * s2, j * s2, s2 + 0.5, s2 + 0.5); } }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(120,140,170,.3)'; c.fillRect(PA_RECT.x0, PA_RECT.z0, PA_RECT.x1 - PA_RECT.x0, PA_RECT.z1 - PA_RECT.z0);
    const N = this.g.world.city?.net, RR = reach;
    if (N) { c.strokeStyle = 'rgba(205,212,225,.55)'; c.lineCap = 'round';
      for (const ch of N.chains.values()) { if (ch.dead || ch.bb[2] < pos.x - RR || ch.bb[0] > pos.x + RR || ch.bb[3] < pos.z - RR || ch.bb[1] > pos.z + RR) continue; c.lineWidth = Math.max(3, ch.w * 0.8); c.beginPath(); ch.pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); } }
    for (const r of this.g.net.roads) {
      const bb = r._bb || (r._bb = r.samples.reduce((b, q) => [Math.min(b[0], q.p.x), Math.min(b[1], q.p.z), Math.max(b[2], q.p.x), Math.max(b[3], q.p.z)], [1e9, 1e9, -1e9, -1e9]));
      if (bb[2] < pos.x - RR || bb[0] > pos.x + RR || bb[3] < pos.z - RR || bb[1] > pos.z + RR) continue;
      c.strokeStyle = r.kind === 'expressway' ? '#2fd07f' : r.kind === 'ramp' ? '#93e0b6' : '#c4ccd8'; c.lineWidth = Math.max(4 / S, r.edgeL - r.edgeR); c.lineCap = 'round';
      c.globalAlpha = 0.85; c.beginPath(); r.samples.forEach((q, i) => { if (i % 3 && i !== r.samples.length - 1) return; i ? c.lineTo(q.p.x, q.p.z) : c.moveTo(q.p.x, q.p.z); }); c.stroke();
    }
    c.globalAlpha = 1;
    for (const ai of this.g.traffic.cars) { if (ai.pos.distanceToSquared(pos) > RR * RR || ai.mode === 'parked' && !ai.police) continue; // v2.13.3: small car chevrons pointing where they drive (parked cars left off)
      const q = 2.6 / S * 1.6, sn = Math.sin(ai.yaw), cs = Math.cos(ai.yaw); c.fillStyle = ai.police ? (ai.pursuit ? '#ff3030' : '#4a8cff') : '#e9edf3'; c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = q * 0.35;
      c.beginPath(); c.moveTo(ai.pos.x + sn * q * 1.6, ai.pos.z + cs * q * 1.6); c.lineTo(ai.pos.x - sn * q + cs * q * 0.9, ai.pos.z - cs * q - sn * q * 0.9); c.lineTo(ai.pos.x - sn * q * 0.5, ai.pos.z - cs * q * 0.5); c.lineTo(ai.pos.x - sn * q - cs * q * 0.9, ai.pos.z - cs * q + sn * q * 0.9); c.closePath(); c.fill(); c.stroke(); }
    this.drawNav(c, 1 / S);
    c.restore();
    // pointers on the edge for the destination / police
    const rim = (x, z, col) => { const a = Math.atan2(x - pos.x, z - pos.z) - yaw; const d = Math.hypot(x - pos.x, z - pos.z) * S; if (d < Math.min(W, H) * 0.42) return; const ang = -a - Math.PI / 2; const R2 = Math.min(W, H) * 0.42; c.fillStyle = col; c.beginPath(); c.arc(cx + Math.cos(ang) * R2, cy + Math.sin(ang) * R2 * 0.9, 6, 0, Math.PI * 2); c.fill(); };
    if (this.g.nav?.target) rim(this.g.nav.target.x, this.g.nav.target.z, '#3fb6ff');
    const ls = this.g.police?.lastSeen; if (ls) rim(ls.x, ls.z, '#ff3030');
    // you: a glowing arrow + a soft "here" ring
    c.fillStyle = 'rgba(255,179,71,.18)'; c.beginPath(); c.arc(cx, cy, 20, 0, Math.PI * 2); c.fill();
    c.save(); c.shadowColor = '#ffb347'; c.shadowBlur = 10; c.fillStyle = '#ffb347'; c.strokeStyle = '#1a0e00'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx, cy - 13); c.lineTo(cx + 9, cy + 9); c.lineTo(cx, cy + 4); c.lineTo(cx - 9, cy + 9); c.closePath(); c.fill(); c.stroke(); c.restore();
    // north
    const na = -Math.PI / 2 - (Math.PI + yaw), nr = Math.min(W, H) * 0.5 - 18; c.fillStyle = 'rgba(8,14,26,.7)'; const nx = Math.max(14, Math.min(W - 14, cx + Math.cos(na) * nr * 1.6)), ny = Math.max(14, Math.min(H - FOOT - 12, cy + Math.sin(na) * nr * 1.6));
    c.beginPath(); c.arc(nx, ny, 10, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ff6b5a'; c.font = '800 12px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', nx, ny + 0.5);
    // scale bar
    const m = [50, 100, 200, 500, 1000].find(x => x * S > 50) || 1000, px = m * S; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(W - 12 - px, H - FOOT - 10); c.lineTo(W - 12, H - FOOT - 10); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '600 10px system-ui'; c.textAlign = 'right'; c.fillText(m >= 1000 ? '1 km' : m + ' m', W - 12, H - FOOT - 20);
    // footer: car · place
    c.fillStyle = 'rgba(6,10,20,.78)'; c.fillRect(0, H - FOOT, W, FOOT);
    const car = v?.car; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = '#ffb347'; c.font = '700 12px system-ui';
    const narrow = W < 260, cn = car ? (narrow ? car.name : `${car.maker} ${car.name}`) : '', maxC = narrow ? 18 : 30; c.fillText(cn.length > maxC ? cn.slice(0, maxC - 1) + '…' : cn, 10, H - FOOT / 2);
    const loc = narrow ? '' : (document.querySelector('#hud .loc')?.firstChild?.textContent || '').split('・')[0];
    c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '600 11px system-ui'; c.fillText(loc.slice(0, 18), W - 10, H - FOOT / 2);
    c.restore();
    c.save(); c.setTransform(k, 0, 0, k, 0, 0); c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1.5; rrect(0.75, 0.75, W - 1.5, H - 1.5, rr); c.stroke(); c.restore();
  }
  // route polyline + destination (+ police last-seen) in world coordinates on an already transformed canvas
  drawNav(c, px) {
    const nv = this.g.nav;
    if (nv?.route?.length > 1) { c.lineCap = c.lineJoin = 'round'; c.globalAlpha = 1; c.strokeStyle = 'rgba(0,20,45,.85)'; c.lineWidth = 11 * px; c.beginPath(); nv.route.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.strokeStyle = '#3fb6ff'; c.lineWidth = 7 * px; c.lineCap = c.lineJoin = 'round'; c.globalAlpha = 0.9; c.beginPath(); nv.route.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.globalAlpha = 1; }
    if (nv?.target) { c.fillStyle = '#3fb6ff'; c.beginPath(); c.arc(nv.target.x, nv.target.z, 7 * px, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2 * px; c.stroke(); }
    const ls = this.g.police?.lastSeen; if (ls) { c.fillStyle = 'rgba(255,48,48,.25)'; c.beginPath(); c.arc(ls.x, ls.z, ls.r || 120, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ff3030'; c.beginPath(); c.arc(ls.x, ls.z, 6 * px, 0, Math.PI * 2); c.fill(); }
  }
  // full real map: baked OpenStreetMap raster (tools/map-overview.mjs → assets/map), 16 m/px overview + 4 m/px detail
  // tiles loaded on demand; the vector expressways, labels and markers are drawn on top
  drawMapRaster(c, W, H, m, k, dpr) {
    const R = this.mapRaster || (this.mapRaster = { idx: null, img: new Map() });
    if (!R.idx) { if (!R.loading) R.loading = fetch(new URL('../../assets/map/index.json', import.meta.url)).then(r => r.json()).then(j => { R.idx = j; R.has = j.levels.map(L => new Set(L.tiles.map(t => t[0] + '_' + t[1]))); if (this.mapOpen) this.drawBigMap(); }).catch(() => {}); return; }
    const want = k / dpr > 1 / 6 ? 1 : 0; // screen px per metre → detail level once a 16 m texel would cover > ~2.5 px
    c.imageSmoothingEnabled = true;
    for (const lv of want ? [0, 1] : [0]) {
      const L = R.idx.levels[lv], s = L.size, x0 = m.x - W / 2 / k, x1 = m.x + W / 2 / k, z0 = m.z - H / 2 / k, z1 = m.z + H / 2 / k;
      for (let i = Math.floor(x0 / s); i * s < x1; i++) for (let j = Math.floor(z0 / s); j * s < z1; j++) {
        const key = i + '_' + j; if (!R.has[lv].has(key)) continue;
        const id = lv + '/' + key; let im = R.img.get(id);
        if (!im) { im = new Image(); im.decoding = 'async'; im.onload = () => { if (this.mapOpen) { cancelAnimationFrame(this._mapRaf); this._mapRaf = requestAnimationFrame(() => this.drawBigMap()); } }; im.src = new URL(`../../assets/map/${id}.webp`, import.meta.url).href; R.img.set(id, im); }
        if (!im.complete || !im.naturalWidth) continue;
        const ax = (i * s - m.x) * k + W / 2, az = (j * s - m.z) * k + H / 2;
        c.drawImage(im, ax, az, s * k + 0.5, s * k + 0.5);
      }
    }
  }
  drawBigMap() {
    const cv = $('#bigmap'), c = cv.getContext('2d'), W = cv.width, H = cv.height, m = this.mv, k = m.k;
    const P = (x, z) => [(x - m.x) * k + W / 2, (z - m.z) * k + H / 2];
    const dpr = W / (cv.getBoundingClientRect().width || innerWidth);
    c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(10,26,51,.78)'; c.fillRect(0, 0, W, H); // sea (translucent: the drive goes on underneath)
    const poly = (pts, fill) => { c.beginPath(); pts.forEach(([x, z], i) => { const [a, b] = P(x, z); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); c.fillStyle = fill; c.fill(); };
    // v2.7.1: all of Japan underneath (Natural Earth coastline), cities when zoomed out, the drivable area glowing
    if (k < 0.02) { c.fillStyle = '#1d2633'; c.strokeStyle = 'rgba(140,170,210,.45)'; c.lineWidth = 1 * dpr;
      for (const R of JAPAN_LAND) { c.beginPath(); for (let i = 0; i < R.length; i += 2) { const [a, b] = P(R[i], R[i + 1]); i ? c.lineTo(a, b) : c.moveTo(a, b); } c.closePath(); c.fill(); c.stroke(); }
      // v2.13: the 47 prefectures — thin borders, names when zoomed out to region level
      c.strokeStyle = 'rgba(160,190,230,.28)'; c.lineWidth = 0.8 * dpr;
      for (const pf of JAPAN_PREFS) for (const R of pf.r) { c.beginPath(); for (let i = 0; i < R.length; i += 2) { const [a, b] = P(R[i], R[i + 1]); i ? c.lineTo(a, b) : c.moveTo(a, b); } c.closePath(); c.stroke(); }
      if (k > 0.0004) { c.textAlign = 'center'; c.textBaseline = 'middle'; for (const pf of JAPAN_PREFS) { if (!pf.c) continue; const [a, b] = P(pf.c[0], pf.c[1]); if (a < -50 || b < -50 || a > W + 50 || b > H + 50) continue;
        c.font = `600 ${10 * dpr}px "Hiragino Sans","Noto Sans JP",system-ui`; c.fillStyle = 'rgba(200,215,235,.55)'; c.fillText(pf.n, a, b + 12 * dpr); if (getLang() !== 'ja' && k > 0.0012) { c.font = `500 ${8.5 * dpr}px system-ui`; c.fillText(pf.en, a, b + 23 * dpr); } } } }
    for (const l of MAP.land || []) if (l.pts?.length > 2) poly(l.pts, l.main ? '#1d2633' : '#222c3a');
    if (k > 0.25) for (const b of MAP.buildings || []) poly(b.pts, '#3a4658');
    this.drawMapRaster(c, W, H, m, k, dpr);
    { const [x0, z0] = P(PA_RECT.x0, PA_RECT.z0), [x1, z1] = P(PA_RECT.x1, PA_RECT.z1); c.fillStyle = '#44587a'; c.fillRect(Math.min(x0, x1), Math.min(z0, z1), Math.abs(x1 - x0), Math.abs(z1 - z0)); }
    const roads = this.g.net.roads;
    for (const pass of [0, 1]) for (const r of roads) {
      const col = r.kind === 'expressway' ? '#2fbf74' : r.kind === 'ramp' ? '#8fe0b2' : '#c4ccd8';
      c.strokeStyle = pass ? col : 'rgba(0,0,0,.55)'; c.lineCap = c.lineJoin = 'round';
      c.lineWidth = Math.max(pass ? 1.5 * dpr : 3 * dpr, (r.edgeL - r.edgeR) * k + (pass ? 0 : 2 * dpr));
      c.globalAlpha = r.samples.some(q => q.p.y < -0.6) && pass ? 0.75 : 1;
      const step = k < 0.002 ? 60 : k < 0.05 ? 8 : k < 0.3 ? 3 : 1;
      c.beginPath(); r.samples.forEach((q, i) => { if (i % step && i !== r.samples.length - 1) return; const [a, b] = P(q.p.x, q.p.z); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.stroke();
    }
    c.globalAlpha = 1;
    // lane markings when zoomed right in
    if (k > 3) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = dpr; c.setLineDash([6 * dpr, 8 * dpr]); for (const r of roads) for (const L of r.lanes) { c.beginPath(); r.samples.forEach((q, i) => { const [a, b] = P(q.p.x + q.left.x * L.lat, q.p.z + q.left.z * L.lat); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.stroke(); } c.setLineDash([]); }
    // route / destination / police last seen, and the picked point
    c.save(); c.translate(W / 2, H / 2); c.scale(k, k); c.translate(-m.x, -m.z); this.drawNav(c, 1 / k * dpr); c.restore();
    if (this.mapSel) { const [a, b] = P(this.mapSel.x, this.mapSel.z); c.strokeStyle = '#ffb347'; c.lineWidth = 3 * dpr; c.beginPath(); c.arc(a, b, 10 * dpr, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(a, b - 18 * dpr); c.lineTo(a, b + 18 * dpr); c.moveTo(a - 18 * dpr, b); c.lineTo(a + 18 * dpr, b); c.stroke(); }
    if (k < 0.004) { // city names across Japan + a glow round the drivable region
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const [n, x, z, pop] of JAPAN_CITIES) { if (pop < (k < 0.0006 ? 1500000 : 300000)) continue; const [a, b] = P(x, z); c.fillStyle = '#ffd38a'; c.beginPath(); c.arc(a, b, 2.5 * dpr, 0, 7); c.fill(); c.font = `700 ${11 * dpr}px "Hiragino Sans","Noto Sans JP",system-ui`; c.lineWidth = 3 * dpr; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(n, a, b - 10 * dpr); c.fillStyle = '#fff'; c.fillText(n, a, b - 10 * dpr); }
      const g0 = P(-20000, 0), rad = Math.max(10 * dpr, 70000 * k); c.strokeStyle = 'rgba(47,191,116,.9)'; c.lineWidth = 2 * dpr; c.setLineDash([5 * dpr, 4 * dpr]); c.beginPath(); c.arc(g0[0], g0[1], rad, 0, 7); c.stroke(); c.setLineDash([]);
      c.font = `800 ${12 * dpr}px system-ui`; c.fillStyle = '#7ff0b0'; c.fillText('MIDNIGHT JAPAN', g0[0], g0[1] + rad + 14 * dpr); }
    // traffic
    for (const ai of this.g.traffic?.cars || []) { const [a, b] = P(ai.pos.x, ai.pos.z); if (a < 0 || b < 0 || a > W || b > H || (ai.mode === 'parked' && !ai.police)) continue;
      const q = 3.2 * dpr, sn = Math.sin(ai.yaw), cs = Math.cos(ai.yaw); c.fillStyle = ai.police ? '#4a8cff' : '#e9edf3'; c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = dpr;
      c.beginPath(); c.moveTo(a + sn * q * 1.6, b + cs * q * 1.6); c.lineTo(a - sn * q + cs * q * 0.9, b - cs * q - sn * q * 0.9); c.lineTo(a - sn * q * 0.5, b - cs * q * 0.5); c.lineTo(a - sn * q - cs * q * 0.9, b - cs * q + sn * q * 0.9); c.closePath(); c.fill(); c.stroke(); }
    // labels: road names (expressways always, ramps/streets when zoomed), landmarks, places
    c.textAlign = 'center'; c.textBaseline = 'middle';
    // Japanese name + its reading in the player's language on a second, smaller line
    const lab = (txt, x, z, size, col = '#fff') => { const [a, b] = P(x, z); if (a < -200 || b < -50 || a > W + 200 || b > H + 50) return; const pre = txt.match(/^[⬡◆] /)?.[0] || ''; const ja = txt.slice(pre.length); const rd = reading(ja);
      c.font = `700 ${size * dpr}px "Hiragino Sans","Noto Sans JP",system-ui,sans-serif`; c.lineWidth = 3 * dpr; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(txt, a, b); c.fillStyle = col; c.fillText(txt, a, b);
      if (rd) { c.font = `600 ${size * 0.78 * dpr}px system-ui,sans-serif`; const y2 = b + size * 1.05 * dpr; c.strokeText(rd, a, y2); c.fillStyle = col; c.globalAlpha = 0.85; c.fillText(rd, a, y2); c.globalAlpha = 1; } };
    const seen = new Set();
    if (k >= 0.004) for (const r of roads) { if (!r.name || seen.has(r.name)) continue; if (r.kind !== 'expressway' && k < (r.kind === 'ramp' ? 0.6 : 1.2)) continue; seen.add(r.name); const q = r.samples[r.samples.length >> 1].p; lab(r.name.replace(/（.*?）/g, ''), q.x, q.z, r.kind === 'expressway' ? 13 : 11, r.kind === 'expressway' ? '#b6f5cf' : '#dde4ee'); }
    // place names: wards always, towns/wharves from mid zoom, JCTs/spots when zoomed in
    for (const pl of k < 0.004 ? [] : PLACES) {
      const need = pl.kind === 'ward' || pl.kind === 'water' ? 0 : pl.kind === 'jct' || pl.kind === 'spot' ? 0.15 * dpr : 0.05 * dpr;
      if (k < need) continue;
      lab(pl.kind === 'jct' ? '⬡ ' + pl.name : pl.name, pl.x, pl.z, pl.kind === 'ward' ? 14 : 11, pl.kind === 'water' ? '#8fc8ff' : pl.kind === 'jct' ? '#b6f5cf' : pl.kind === 'ward' ? '#ffffff' : '#c9d2de');
    }
    // landmarks: bigger than street names; the one by the picked point (or under the cursor) grows and gets a ring
    const sel = this.mapSel, hov = this._mapHover;
    for (const l of k < 0.004 ? [] : MAP.landmarks || []) { const near = (sel && Math.hypot(sel.x - l.x, sel.z - l.z) < 600 / Math.max(0.2, k)) || (hov && Math.hypot(hov.x - l.x, hov.z - l.z) < 40 / k);
      if (near) { const [a, b] = P(l.x, l.z); c.beginPath(); c.arc(a, b, 16 * dpr, 0, 7); c.strokeStyle = '#ffd38a'; c.lineWidth = 2.5 * dpr; c.stroke(); }
      lab('◆ ' + l.name, l.x, l.z, near ? 21 : 14, near ? '#fff2c8' : '#ffd38a'); }
    lab('大黒PA', (PA_RECT.x0 + PA_RECT.x1) / 2, (PA_RECT.z0 + PA_RECT.z1) / 2, 15, '#ffb347');
    // player
    const p = this.mapPos(); if (p) { const [a, b] = P(p.x, p.z); const yaw = this.g.mode === 'walk' ? this.g.player.yaw : this.g.vehicle.yaw; const pr = (performance.now() / 900) % 1; c.beginPath(); c.arc(a, b, (14 + pr * 26) * dpr, 0, 7); c.strokeStyle = `rgba(255,179,71,${1 - pr})`; c.lineWidth = 3 * dpr; c.stroke(); c.beginPath(); c.arc(a, b, 13 * dpr, 0, 7); c.fillStyle = 'rgba(255,179,71,.25)'; c.fill(); c.save(); c.translate(a, b); c.rotate(-yaw + Math.PI); c.fillStyle = '#ffb347'; c.strokeStyle = '#000'; c.lineWidth = 2.5 * dpr; c.beginPath(); c.moveTo(0, -16 * dpr); c.lineTo(12 * dpr, 13 * dpr); c.lineTo(0, 6 * dpr); c.lineTo(-12 * dpr, 13 * dpr); c.closePath(); c.fill(); c.stroke(); c.restore(); c.font = `800 ${13 * dpr}px system-ui,sans-serif`; c.textAlign = 'center'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.8)'; c.lineWidth = 4 * dpr; { // v2.5.2: "you are here" card — the place in the play language, with the Japanese name under it
        const here = ({ ko: '현재 위치', ja: '現在地', zh: '当前位置', 'zh-TW': '目前位置', es: 'Estás aquí', fr: 'Vous êtes ici', de: 'Sie sind hier' })[getLang()] || 'You are here';
        const locEl = document.querySelector('#hud .loc'); const ja = (locEl?.childNodes?.[0]?.textContent || '').trim(), loc = (locEl?.querySelector('small, .sub, div')?.textContent || '').trim();
        const l1 = here + (loc && getLang() !== 'ja' ? ' · ' + loc : ja ? ' · ' + ja : ''), l2 = getLang() !== 'ja' ? ja : '';
        c.font = `800 ${13 * dpr}px system-ui,sans-serif`; const w1 = c.measureText(l1).width; c.font = `600 ${11 * dpr}px system-ui,sans-serif`; const w2 = l2 ? c.measureText(l2).width : 0;
        const W2 = Math.max(w1, w2) + 20 * dpr, H2 = (l2 ? 40 : 24) * dpr, x0 = a - W2 / 2, y0 = b - 30 * dpr - H2;
        c.fillStyle = 'rgba(8,14,26,.88)'; c.strokeStyle = '#ffb347'; c.lineWidth = 1.5 * dpr; c.beginPath(); c.roundRect ? c.roundRect(x0, y0, W2, H2, 8 * dpr) : c.rect(x0, y0, W2, H2); c.fill(); c.stroke();
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.font = `800 ${13 * dpr}px system-ui,sans-serif`; c.fillText(l1, a, y0 + 12 * dpr);
        if (l2) { c.fillStyle = '#ffcf8a'; c.font = `600 ${11 * dpr}px system-ui,sans-serif`; c.fillText(l2, a, y0 + 29 * dpr); }
        c.textBaseline = 'alphabetic'; } }
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
