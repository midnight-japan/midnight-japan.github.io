// Homepage: hero art, 3-step start, features, car showcase, roadmap, gallery + lightbox, latest update teaser, requirements, controls, FAQ.
import { GAME, CHANGELOG, LANGS, REGIONS } from '../../data/meta.js';
import { CARS } from '../../data/cars.js';
import { t, pick } from '../i18n.js';
import { initSite, onLang, esc, num, swap, reducedMotion } from './common.js';
import { carImage } from './carart.js';

// ── Feature list: [key, icon, Japanese flavour label]
const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
// (Desktop/mobile/PWA is covered by the "Start in 3 steps" section, so it is not repeated here.)
const FEATURES = [
  ['city', ic('<path d="M3 21V9l5-3v15M8 21V4l7 3v14M15 21v-9l6-2v11M2 21h20"/><path d="M11 9h1M11 12h1M11 15h1M18 13h1M18 16h1"/>'), '実在の街'],
  ['tune', ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'), 'チューン'],
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

// ── Screenshots in docs/screenshots/: each entry needs <name>.jpg (1600 px wide) and <name>-800.jpg (800 px wide).
//    If the .jpg is missing the page falls back to <name>.png. Make the JPEGs on macOS with:
//    sips -s format jpeg -s formatOptions 78 -Z 1600 X.png --out X.jpg && sips -s format jpeg -s formatOptions 74 -Z 800 X.png --out X-800.jpg
// Caption: i18n key site.shot.<first 2 chars> if it exists, otherwise the file name ("08-wangan-night" → "Wangan night").
// 9 entries fill the grid exactly on desktop (first one large). Other shots on disk: 05-onfoot, 06-tollgate.
const SHOTS = ['18-minatomirai', '22-haneda', '17-city-night', '19-city-aerial', '07-ae86-loops', '23-foodcourt', '16-tsubasa', '21-tuning', '14-aqua-tunnel'];
const SHOT_DIR = 'docs/screenshots/';
const shotSrc = (s, w) => SHOT_DIR + s + (w === 800 ? '-800' : '') + '.jpg';
const shotCap = s => {
  const k = 'site.shot.' + s.slice(0, 2), v = t(k);
  if (v !== k) return v;
  const w = s.replace(/^\d+[-_]?/, '').replace(/[-_]+/g, ' ').trim();
  return w ? w[0].toUpperCase() + w.slice(1) : s;
};
/** <img> fallback chain: -800.jpg/.jpg → .png → placeholder. */
function pngFallback(img, name, onFail) {
  img.addEventListener('error', () => {
    if (!img.dataset.png) { img.dataset.png = '1'; img.removeAttribute('srcset'); img.src = SHOT_DIR + name + '.png'; }
    else onFail?.();
  });
}

// ── World tiles (home): [screenshot, region id in data/meta.js REGIONS or i18n key, route badge, Japanese name]
const WORLD = [
  ['19-city-aerial', 'site.world.city', 'K', '横浜・川崎'],
  ['07-ae86-loops', 'daikoku_pa', 'B', '大黒PA'],
  ['16-tsubasa', 'tsubasa', 'B', '鶴見つばさ橋'],
  ['14-aqua-tunnel', 'site.world.aqua', 'CA', '東京湾アクアライン'],
];
// Route-sign ticker words (decorative, Japanese/English place names — not translated on purpose)
const TICKER = ['みなとみらい', 'MINATO MIRAI', '横浜中華街', 'YOKOHAMA CHINATOWN', '川崎', 'KAWASAKI', '大黒PA', 'DAIKOKU PA', '首都高速湾岸線', 'BAYSHORE ROUTE', '鶴見つばさ橋', 'TSURUMI TSUBASA BRIDGE', '川崎浮島JCT', '東京湾アクアライン', 'TOKYO BAY AQUA-LINE', '海ほたるPA', 'UMIHOTARU', '羽田', 'HANEDA', '横浜ベイブリッジ', 'YOKOHAMA BAY BRIDGE'];

// ── Featured cars for the home showcase strip (ids from data/cars.js; unknown ids are skipped).
const FEATURED = ['r34', 'r32', 'jza80', 'fd3s', 'na1', 'ae86', 'gr86', 'ap1', 'evo9', 'lfa'];

// ── Roadmap: [version, status, item keys]. Keep it modest — plans, not promises.
// Item keys: site.road.<version without dot>.<key>, except entries written as 'NN.key' which point at another version's key.
const ROADMAP = [
  ['0.3', 'done', ['handling', 'cockpit', 'paint', 'map']],
  ['0.4', 'done', ['roadside', 'places', 'traffic', 'konbini']],
  ['0.5', 'done', ['city', 'citytraffic', 'landmarks', 'tuning']],
  ['0.6', 'now', ['trains', 'people', 'haneda', 'interiors']],
  ['0.7', 'next', ['03.c1', 'cars', '06.touge']],
  ['Later', 'later', ['03.events', '02.perf']],
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

function renderFeatures() {
  const n = CARS.length;
  document.getElementById('feature-grid').innerHTML = FEATURES.map(([k, svg, jp, beta]) => `
    <article class="card feat${beta ? ' is-beta' : ''}"><span class="jp" lang="ja">${jp}</span><div class="ic">${svg}</div>
      <h3>${esc(t('site.feat.' + k + '.t', { n }))}${beta ? ` <span class="beta">${esc(t('site.beta'))}</span>` : ''}</h3><p>${esc(t('site.feat.' + k + '.d', { n }))}</p></article>`).join('');
}

function renderGallery() {
  const g = document.getElementById('gallery-grid');
  g.innerHTML = SHOTS.map((s, i) => `
    <button type="button" class="shot" data-i="${i}" aria-label="${esc(shotCap(s))}">
      <img src="${shotSrc(s, 800)}" srcset="${shotSrc(s, 800)} 800w, ${shotSrc(s, 1600)} 1600w" sizes="(min-width: 900px) ${i === 0 ? '66vw' : '33vw'}, 100vw" alt="${esc(shotCap(s))}" loading="lazy" decoding="async" width="800" height="450">
      <span class="cap">${esc(shotCap(s))}</span>
    </button>`).join('');
  g.querySelectorAll('.shot').forEach(b => {
    const img = b.querySelector('img');
    const fail = () => { b.classList.add('missing'); b.disabled = true; img.remove(); b.insertAdjacentHTML('afterbegin', `<span class="ph"><span>${esc(t('site.gallery.soon'))}</span></span>`); };
    pngFallback(img, SHOTS[+b.dataset.i], fail);
    b.addEventListener('click', () => { if (!b.classList.contains('missing')) openLb(+b.dataset.i); });
  });
}

function renderWorld() {
  const name = id => { const r = REGIONS.find(x => x.id === id); return r ? pick(r.name) : t(id); };
  const g = document.getElementById('world-grid');
  g.innerHTML = WORLD.map(([s, id, route, jp], i) => {
    const href = REGIONS.some(x => x.id === id) ? `regions.html#r-${encodeURIComponent(id)}` : 'regions.html';
    return `<a class="wtile${i === 0 ? ' big' : ''}" href="${href}">
      <img src="${shotSrc(s, 800)}" srcset="${shotSrc(s, 800)} 800w, ${shotSrc(s, 1600)} 1600w" sizes="(min-width: 900px) ${i === 0 ? '60vw' : '30vw'}, 100vw" alt="" loading="lazy" decoding="async" width="800" height="450">
      <span class="wt-body"><span class="route${route === 'CA' ? ' aq' : ''}">${esc(route)}</span><span class="wt-name">${esc(name(id))}</span><span class="wt-jp" lang="ja">${esc(jp)}</span></span>
    </a>`;
  }).join('');
  g.querySelectorAll('.wtile img').forEach((img, i) => pngFallback(img, WORLD[i][0], () => img.remove()));
}

function renderTicker() {
  const el = document.getElementById('ticker'); if (!el) return;
  const run = TICKER.map(w => `<span>${esc(w)}</span>`).join('<i></i>');
  el.innerHTML = `<div>${run}<i></i></div><div>${run}<i></i></div>`;
}

let lbIndex = 0;
const lb = () => document.getElementById('lightbox');
function avail() { return [...document.querySelectorAll('#gallery-grid .shot:not(.missing)')].map(b => +b.dataset.i); }
function openLb(i) {
  lbIndex = i; const s = SHOTS[i];
  const im = document.getElementById('lb-img'); delete im.dataset.png;
  im.onerror = () => { if (!im.dataset.png) { im.dataset.png = '1'; im.src = SHOT_DIR + s + '.png'; } };
  im.src = shotSrc(s, 1600);
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
      <div class="road-top"><span class="road-v">${/^\d/.test(v) ? 'v' + esc(v) : '+'}</span><span class="status ${st === 'done' || st === 'now' ? 'live' : st === 'next' ? 'partial' : 'planned'}">${esc(t('site.road.' + st))}</span></div>
      <ul>${items.map(k => `<li>${esc(t('site.road.' + (k.includes('.') ? k : v.replace('.', '') + '.' + k), { n: CARS.length }))}</li>`).join('')}</ul>
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

document.getElementById('hero-version').textContent = 'v' + GAME.version;
document.getElementById('hero-code').textContent = CHANGELOG[0]?.codename || '';
renderTicker();
document.getElementById('hero-carcount').textContent = CARS.length;
// Count-up for the hero stats (numbers only; "30:00" style values are left as-is).
function countUp() {
  if (reducedMotion()) return;
  document.querySelectorAll('.hero-meta b:not(.nocount)').forEach((b, i) => {
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
onLang(() => { document.getElementById('hero-cars').textContent = t('site.show.all', { n: CARS.length }) + ' →'; renderWorld(); renderFeatures(); renderShowcase(); requestAnimationFrame(stripUpd); renderGallery(); renderRoadmap(); renderLatest(); renderReq(); renderCtl(); renderFaq(); });
