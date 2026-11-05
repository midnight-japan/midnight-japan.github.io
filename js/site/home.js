// Homepage: hero art, 3-step start, features, car showcase, roadmap, gallery + lightbox, latest update teaser, requirements, controls, FAQ.
import { GAME, CHANGELOG, LANGS } from '../../data/meta.js';
import { CARS } from '../../data/cars.js';
import { t, pick } from '../i18n.js';
import { initSite, onLang, esc, num, swap, reducedMotion } from './common.js';
import { carImage } from './carart.js';

// ── Feature list: [key, icon, Japanese flavour label]
const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
// (Desktop/mobile/PWA is covered by the "Start in 3 steps" section, so it is not repeated here.)
const FEATURES = [
  ['pa', ic('<path d="M4 20V5h7a4 4 0 0 1 0 8H4"/><path d="M15 20h5"/>'), '大黒PA'],
  ['online', ic('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.9 15.7 7.1M8.3 13.1l7.4 3.8"/>'), 'オンライン', 'beta'],
  ['cycle', ic('<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/>'), '昼夜'],
  ['manual', ic('<path d="M6 4v16M12 4v16M18 4v8H6"/><circle cx="6" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="18" cy="4" r="1.5"/>'), 'MT'],
  ['ev', ic('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'), 'EV'],
  ['cars', ic('<path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5h-3v-2H6v2H3z"/><circle cx="7" cy="13.5" r="1"/><circle cx="17" cy="13.5" r="1"/>'), '実車'],
  ['plates', ic('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h4M7 14h10"/>'), 'ナンバー'],
  ['police', ic('<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>'), '高速隊'],
  ['toll', ic('<path d="M4 20V8l4-4h8l4 4v12"/><path d="M4 12h16"/><path d="M12 12v8"/>'), '料金所'],
  ['radio', ic('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="8" cy="14" r="2.5"/><path d="M14 12h4M14 16h4"/>'), 'ラジオ'],
  ['walk', ic('<circle cx="13" cy="4" r="2"/><path d="M10 22l2-7 3 3v6M8 12l3-4 3 1 2 3"/>'), '徒歩'],
  ['langs', ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'), '多言語'],
];

// ── Screenshots: file names in docs/screenshots/ (without .png). Append new ones here, e.g. '07-wangan-night'.
// Caption: i18n key site.shot.<first 2 chars> if it exists, otherwise the file name ("07-wangan-night" → "Wangan night").
const SHOTS = ['01-pa-night', '02-loop-day', '03-cockpit', '04-garage', '05-onfoot', '06-tollgate'];
const shotCap = s => {
  const k = 'site.shot.' + s.slice(0, 2), v = t(k);
  if (v !== k) return v;
  const w = s.replace(/^\d+[-_]?/, '').replace(/[-_]+/g, ' ').trim();
  return w ? w[0].toUpperCase() + w.slice(1) : s;
};

// ── Featured cars for the home showcase strip (ids from data/cars.js; unknown ids are skipped).
const FEATURED = ['r34', 'r32', 'jza80', 'fd3s', 'na1', 'ae86', 'gr86', 'ap1', 'evo9', 'lfa'];

// ── Roadmap: [version, status, item keys]. Keep it modest — plans, not promises.
const ROADMAP = [
  ['0.1', 'now', ['pa', 'cars', 'life', 'online']],
  ['0.2', 'next', ['routes', 'models', 'perf']],
  ['0.3', 'later', ['events', 'tuning', 'areas']],
];

// ── Controls. Keep in sync with the game's input map. Values: keyboard keys (array → <kbd>), gamepad, touch i18n key.
const CONTROLS = [
  ['accel', ['W', '↑'], ['RT'], 'pedalR'],
  ['brake', ['S', '↓'], ['LT'], 'pedalL'],
  ['steer', ['A', 'D', '←', '→'], ['L-Stick'], 'tilt'],
  ['clutch', ['Shift'], ['X'], 'clutchBtn'],
  ['gear', ['E', 'Q'], ['RB', 'LB'], 'gearBtn'],
  ['handbrake', ['Space'], ['A'], 'hbBtn'],
  ['ignition', ['I'], ['View'], 'keyBtn'],
  ['lights', ['L'], ['D-Pad ↑'], 'lightsBtn'],
  ['horn', ['H'], ['R3'], 'hornBtn'],
  ['radio', ['R'], ['D-Pad →'], 'radioBtn'],
  ['camera', ['C'], ['Y'], 'camBtn'],
  ['interact', ['F'], ['D-Pad ↓'], 'doorBtn'],
  ['menu', ['Esc'], ['Menu'], 'pauseBtn'],
];

const REQ = ['browser', 'gpu', 'ram', 'display', 'mobile', 'network'];
const FAQ = ['free', 'install', 'multi', 'account', 'real', 'perf'];

function heroArt() {
  // Stylised night view: stars, Minato-Mirai-ish skyline, Ferris wheel, cable-stayed bridge, elevated JCT loops with light trails.
  let stars = '', win = '', lamps = '';
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) stars += `<circle cx="${(rnd() * 1600).toFixed(0)}" cy="${(rnd() * 380).toFixed(0)}" r="${(rnd() * 1.4 + .3).toFixed(1)}" fill="#dfe8ff" opacity="${(rnd() * .6 + .2).toFixed(2)}"${i % 7 === 0 ? ' class="twinkle"' : ''}/>`;
  const bld = [[600, 70, 210], [680, 55, 300], [745, 40, 250], [800, 70, 360], [880, 50, 270], [940, 60, 330], [1010, 45, 230], [1060, 80, 290], [1150, 40, 210], [1200, 60, 250], [1270, 50, 190]];
  const blds = bld.map(([x, w, h]) => {
    for (let k = 0; k < h / 16; k++) for (let j = 0; j < w / 12; j++) if (rnd() > .62) win += `<rect x="${x + 4 + j * 12}" y="${560 - h + 8 + k * 16}" width="5" height="6" fill="${rnd() > .8 ? '#ffd9a0' : '#9fc3ff'}" opacity="${(rnd() * .5 + .35).toFixed(2)}"/>`;
    return `<rect x="${x}" y="${560 - h}" width="${w}" height="${h}" fill="#0b1426"/>`;
  }).join('');
  let spokes = '';
  for (let a = 0; a < 360; a += 15) { const r = a * Math.PI / 180; spokes += `<line x1="1370" y1="400" x2="${(1370 + Math.cos(r) * 110).toFixed(1)}" y2="${(400 + Math.sin(r) * 110).toFixed(1)}"/>`; }
  for (let i = 0; i < 16; i++) { const x = 70 + i * 100; lamps += `<line x1="${x}" y1="690" x2="${x}" y2="655" stroke="#1a2236" stroke-width="3"/><circle cx="${x + 6}" cy="654" r="16" fill="url(#lampg)"/><circle cx="${x + 6}" cy="654" r="2.6" fill="#ffd18a"/>`; }
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050913"/><stop offset=".55" stop-color="#0d1a3a"/><stop offset=".72" stop-color="#2a2238"/><stop offset="1" stop-color="#05070d"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1730"/><stop offset="1" stop-color="#03060c"/></linearGradient>
    <radialGradient id="lampg"><stop offset="0" stop-color="#ffb04a" stop-opacity=".9"/><stop offset="1" stop-color="#ff8a1f" stop-opacity="0"/></radialGradient>
    <radialGradient id="cityglow" cx=".55" cy="1" r=".6"><stop offset="0" stop-color="#ff9a2e" stop-opacity=".28"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  ${stars}
  <mask id="moonm"><rect width="1600" height="900" fill="#fff"/><circle cx="1405" cy="110" r="30" fill="#000"/></mask><circle cx="1390" cy="120" r="34" fill="#f6e7bf" opacity=".95" mask="url(#moonm)"/>
  <rect y="380" width="1600" height="300" fill="url(#cityglow)"/>
  ${blds}${win}
  <g stroke="#2f4774" stroke-width="1.4" opacity=".9">${spokes}</g>
  <circle cx="1370" cy="400" r="110" fill="none" stroke="#5fd4ff" stroke-width="3" opacity=".7"/>
  <circle cx="1370" cy="400" r="110" fill="none" stroke="#ff7ad9" stroke-width="3" stroke-dasharray="6 18" opacity=".8" class="twinkle"/>
  <path d="M1360 400 1335 560h70z" fill="#0b1426"/>
  <g stroke="#9fb3d9" stroke-width="1.2" opacity=".55">
    <path d="M300 560 330 330 360 560M300 560 220 520M330 330 120 520M330 330 200 525M330 330 260 535M330 330 540 520M330 330 460 525M330 330 400 535"/>
  </g>
  <path d="M0 520H600" stroke="#203357" stroke-width="7"/>
  <rect y="560" width="1600" height="340" fill="url(#sea)"/>
  <g opacity=".35" filter="url(#blur)">${win.replace(/y="(\d+)"/g, (m, y) => `y="${1120 - y}"`)}</g>
  <!-- elevated JCT loops -->
  <g fill="none">
    <ellipse cx="1050" cy="700" rx="470" ry="120" stroke="#04060b" stroke-width="34"/>
    <ellipse cx="1050" cy="700" rx="470" ry="120" stroke="#1a2440" stroke-width="22"/>
    <ellipse cx="1050" cy="700" rx="470" ry="120" stroke="#ff2a2a" stroke-width="4" class="trail" opacity=".9" pathLength="286"/>
    <ellipse cx="1050" cy="700" rx="470" ry="120" stroke="#ff2a2a" stroke-width="4" class="trail d2" opacity=".9" pathLength="286"/>
    <ellipse cx="1050" cy="700" rx="470" ry="120" stroke="#fff3d6" stroke-width="4" class="trail r d3" pathLength="286"/>
    <ellipse cx="1080" cy="760" rx="360" ry="80" stroke="#04060b" stroke-width="30"/>
    <ellipse cx="1080" cy="760" rx="360" ry="80" stroke="#172038" stroke-width="18"/>
    <ellipse cx="1080" cy="760" rx="360" ry="80" stroke="#fff3d6" stroke-width="3.5" class="trail" pathLength="286"/>
    <ellipse cx="1080" cy="760" rx="360" ry="80" stroke="#ff2a2a" stroke-width="3.5" class="trail r d2" pathLength="286"/>
  </g>
  <path d="M0 690H1600" stroke="#04060b" stroke-width="30"/>
  <path d="M0 690H1600" stroke="#1b2a4a" stroke-width="18"/>
  <path d="M0 690H1600" stroke="#ff9a2e" stroke-width="2" stroke-dasharray="30 40" opacity=".55"/>
  <g fill="#070b14">${[150, 450, 750, 1050, 1350].map(x => `<rect x="${x}" y="700" width="26" height="200"/>`).join('')}</g>
  ${lamps}
  <path d="M0 700H1600" stroke="#2fbf71" stroke-width="2" opacity=".5"/>
</svg>`;
}

function renderFeatures() {
  const n = CARS.length;
  document.getElementById('feature-grid').innerHTML = FEATURES.map(([k, svg, jp, beta]) => `
    <article class="card feat${beta ? ' is-beta' : ''}"><span class="jp" lang="ja">${jp}</span><div class="ic">${svg}</div>
      <h3>${esc(t('site.feat.' + k + '.t', { n }))}${beta ? ` <span class="beta">${esc(t('site.beta'))}</span>` : ''}</h3><p>${esc(t('site.feat.' + k + '.d', { n }))}</p></article>`).join('');
}

let loaded = []; // indices of screenshots that loaded
function renderGallery() {
  const g = document.getElementById('gallery-grid');
  g.innerHTML = SHOTS.map((s, i) => `
    <button type="button" class="shot" data-i="${i}" aria-label="${esc(shotCap(s))}">
      <img src="docs/screenshots/${s}.png" alt="${esc(shotCap(s))}" loading="lazy">
      <span class="cap">${esc(shotCap(s))}</span>
    </button>`).join('');
  g.querySelectorAll('.shot').forEach(b => {
    const img = b.querySelector('img');
    const fail = () => { b.classList.add('missing'); b.disabled = true; img.remove(); b.insertAdjacentHTML('afterbegin', `<span class="ph"><span>${esc(t('site.gallery.soon'))}</span></span>`); };
    img.addEventListener('error', fail, { once: true });
    b.addEventListener('click', () => { if (!b.classList.contains('missing')) openLb(+b.dataset.i); });
  });
}

let lbIndex = 0;
const lb = () => document.getElementById('lightbox');
function avail() { return [...document.querySelectorAll('#gallery-grid .shot:not(.missing)')].map(b => +b.dataset.i); }
function openLb(i) {
  lbIndex = i; const s = SHOTS[i];
  document.getElementById('lb-img').src = `docs/screenshots/${s}.png`;
  document.getElementById('lb-img').alt = shotCap(s);
  document.getElementById('lb-cap').textContent = shotCap(s);
  swap(document.getElementById('lb-img'));
  lb().classList.add('open'); lb().querySelector('.lb-close').focus();
}
function stepLb(d) { const a = avail(); if (!a.length) return; const p = a.indexOf(lbIndex); openLb(a[(p + d + a.length) % a.length]); }
function closeLb() { lb().classList.remove('open'); document.querySelector(`#gallery-grid .shot[data-i="${lbIndex}"]`)?.focus(); }
function wireLb() {
  const el = lb();
  el.querySelector('.lb-close').onclick = closeLb;
  el.querySelector('.lb-prev').onclick = () => stepLb(-1);
  el.querySelector('.lb-next').onclick = () => stepLb(1);
  el.addEventListener('click', e => { if (e.target === el) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!el.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') stepLb(-1); else if (e.key === 'ArrowRight') stepLb(1);
  });
}

function renderLatest() {
  const c = CHANGELOG[0]; const el = document.getElementById('latest-card');
  if (!c) { el.hidden = true; return; }
  const items = (c.items || []).filter(i => i.type !== 'known').slice(0, 5);
  el.innerHTML = `<div><div class="ver">v${esc(c.version)}</div><div class="code">${esc(c.codename || '')}</div><div class="date">${esc(c.date)}</div></div>
    <div><p class="rel-sum">${esc(pick(c.summary))}</p>
      <ul>${items.map(i => `<li><span class="ty ${esc(i.type)}">${esc(t('site.type.' + i.type))}</span><span>${esc(pick(i))}</span></li>`).join('')}</ul>
      <a class="btn btn-green btn-sm" href="changelog.html#v${esc(c.version.replace(/\./g, '-'))}">${esc(t('site.latest.more'))} →</a></div>`;
}

function renderReq() {
  document.getElementById('req-table').innerHTML = `<thead><tr><th></th><th>${esc(t('site.req.min'))}</th><th>${esc(t('site.req.rec'))}</th></tr></thead>
  <tbody>${REQ.map(k => `<tr><th scope="row">${esc(t('site.req.' + k))}</th><td data-l="${esc(t('site.req.min'))}">${esc(t('site.req.' + k + '.min'))}</td><td data-l="${esc(t('site.req.rec'))}">${esc(t('site.req.' + k + '.rec'))}</td></tr>`).join('')}</tbody>`;
}

let dev = 'all';
function renderCtl() {
  const kb = a => a.map(k => `<kbd>${esc(k)}</kbd>`).join(' ');
  const cols = [['kb', 'site.ctl.keyboard'], ['pad', 'site.ctl.gamepad'], ['touch', 'site.ctl.touch']].filter(([d]) => dev === 'all' || dev === d);
  const cell = (d, row) => d === 'kb' ? kb(row[1]) : d === 'pad' ? kb(row[2]) : esc(t('site.ctl.t.' + row[3]));
  document.getElementById('ctl-table').innerHTML = `<thead><tr><th>${esc(t('site.ctl.action'))}</th>${cols.map(([, k]) => `<th>${esc(t(k))}</th>`).join('')}</tr></thead>
  <tbody>${CONTROLS.map(r => `<tr><th scope="row">${esc(t('site.ctl.a.' + r[0]))}</th>${cols.map(([d, k]) => `<td data-l="${esc(t(k))}">${cell(d, r)}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
function wireTabs() {
  const tabs = document.querySelectorAll('#ctl-tabs .tab');
  tabs.forEach(b => b.addEventListener('click', () => {
    dev = b.dataset.dev; tabs.forEach(x => x.setAttribute('aria-selected', String(x === b))); renderCtl(); swap(document.getElementById('ctl-table'));
  }));
}

function renderFaq() {
  document.getElementById('faq-list').innerHTML = FAQ.map(k =>
    `<details><summary>${esc(t('site.faq.' + k + '.q'))}</summary><div>${esc(t('site.faq.' + k + '.a', { langs: LANGS.length }))}</div></details>`).join('');
}

function renderShowcase() {
  const list = FEATURED.map(id => CARS.find(c => c.id === id)).filter(c => c && c.playable);
  document.getElementById('show-lead').textContent = t('site.show.lead', { n: CARS.length });
  document.getElementById('show-all').textContent = t('site.show.all', { n: CARS.length }) + ' →';
  document.getElementById('car-strip').innerHTML = list.map(c => `
    <li class="card scar">
      <a class="car-img" href="cars.html#${encodeURIComponent(c.id)}" tabindex="-1" aria-hidden="true">${carImage(c)}<span class="tag drv" title="${esc(t('site.drive.' + c.drive))}">${esc(c.drive)}</span></a>
      <div class="scar-body">
        <div class="car-maker">${esc(c.maker)}</div>
        <a class="car-name" href="cars.html#${encodeURIComponent(c.id)}">${esc(c.name)}</a>
        <div class="car-sub"><b>${esc(c.chassis)}</b> · ${c.year} · ${num(c.engine.hp)} hp</div>
        <div class="scar-drv">${esc(t('site.drive.' + c.drive))}</div>
        <a class="btn btn-play sm" href="play.html?car=${encodeURIComponent(c.id)}" aria-label="${esc(t('site.show.drive') + ': ' + c.maker + ' ' + c.name)}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>${esc(t('site.show.drive'))}</a>
      </div>
    </li>`).join('');
}

let stripUpd = () => {};
function wireStrip() {
  const st = document.getElementById('car-strip'), pv = document.getElementById('strip-prev'), nx = document.getElementById('strip-next');
  const upd = () => { pv.disabled = st.scrollLeft < 4; nx.disabled = st.scrollLeft + st.clientWidth >= st.scrollWidth - 4; };
  const go = d => st.scrollBy({ left: d * Math.max(280, st.clientWidth * 0.8), behavior: 'smooth' });
  pv.addEventListener('click', () => go(-1)); nx.addEventListener('click', () => go(1));
  st.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd);
  if ('ResizeObserver' in window) new ResizeObserver(upd).observe(st);
  stripUpd = upd; requestAnimationFrame(upd);
}

function renderRoadmap() {
  document.getElementById('road-grid').innerHTML = ROADMAP.map(([v, st, items]) => `
    <article class="card road-col ${st}">
      <div class="road-top"><span class="road-v">v${esc(v)}</span><span class="status ${st === 'now' ? 'live' : st === 'next' ? 'partial' : 'planned'}">${esc(t('site.road.' + st))}</span></div>
      <ul>${items.map(k => `<li>${esc(t('site.road.' + v.replace('.', '') + '.' + k, { n: CARS.length }))}</li>`).join('')}</ul>
    </article>`).join('');
}

function wireCopy() {
  const btn = document.getElementById('copy-url'), url = document.getElementById('site-url').textContent.trim();
  btn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {
      const r = document.createRange(); r.selectNodeContents(document.getElementById('site-url'));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      try { ok = document.execCommand('copy'); } catch {}
    }
    const lab = btn.querySelector('span');
    lab.textContent = t(ok ? 'site.start.copied' : 'site.start.copyFail');
    btn.classList.toggle('ok', ok);
    clearTimeout(btn._t); btn._t = setTimeout(() => { lab.textContent = t('site.start.copy'); btn.classList.remove('ok'); }, 1800);
  });
}

document.getElementById('hero-art').innerHTML = heroArt();
document.getElementById('hero-version').textContent = 'v' + GAME.version;
document.getElementById('hero-carcount').textContent = CARS.length;
// Count-up for the hero stats (numbers only; "30:00" style values are left as-is).
function countUp() {
  if (reducedMotion()) return;
  document.querySelectorAll('.hero-meta b').forEach((b, i) => {
    const end = +b.textContent; if (!Number.isFinite(end) || end <= 0) return;
    const t0 = performance.now() + 700 + i * 120, dur = 1300;
    b.textContent = '0';
    const tick = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      b.textContent = String(Math.round(end * e));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
countUp();
wireLb(); wireTabs(); wireCopy(); wireStrip();
await initSite('home');
onLang(() => { renderFeatures(); renderShowcase(); requestAnimationFrame(stripUpd); renderGallery(); renderRoadmap(); renderLatest(); renderReq(); renderCtl(); renderFaq(); });
