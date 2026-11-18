// Homepage: cinematic hero slideshow, "what's new" (CHANGELOG[0]), real-3D section, routes + regions,
// feature rows, details grid, car showcase strip, gallery + lightbox, quick start, requirements, controls, FAQ.
import { GAME, CHANGELOG, LANGS, REGIONS } from '../../data/meta.js';
import { CARS } from '../../data/cars.js';
import { t, pick } from '../i18n.js';
import { initSite, onLang, esc, num, swap, reducedMotion } from './common.js';
import { carImage } from './carart.js';

const $ = id => document.getElementById(id);
const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';
const SHOT_DIR = 'docs/screenshots/';
const shotSrc = (s, w) => SHOT_DIR + s + (w === 800 ? '-800' : '') + '.jpg';
const srcset = s => `${shotSrc(s, 800)} 800w, ${shotSrc(s, 1600)} 1600w`;

// ── Hero slideshow: [screenshot, location label (Japanese road-sign style, not translated)]
const SLIDES = [
  ['50-touge-sakura', 'アネスト岩田ターンパイク箱根 · 桜'], ['51-pa-autumn', '大黒PA · 秋'],
  ['47-hud-k1', '首都高速K1横羽線 · 新子安'], ['45-tokyo-tower', '東京タワー · 3D都市モデル'], ['48-pa-lights', '大黒PA · 深夜'], ['40-real-yokohama', '横浜みなとみらい · 3D都市モデル'], ['27-c1night', '首都高速都心環状線 · 銀座'],
  ['29-hakone_dusk', 'アネスト岩田ターンパイク箱根'], ['31-k1rain', '首都高速K1横羽線 · 雨の夜'], ['33-rainbow', 'レインボーブリッジ · 東京湾'],
  ['42-tokyo-night', '東京 · 都心の夜'], ['26-k1-night', '首都高速K1横羽線'],
];
const SLIDE_MS = 6500;

// ── Routes: each card starts the game at that place (play.html?spawn=<id>). Items 0 and 6 are wide.
const ROUTES = [
  { id: 'c1', img: '27-c1night', route: 'C1', km: '14 km', ja: '首都高速都心環状線' },
  { id: 'hakone', img: '29-hakone_dusk', route: 'TP', km: '13.5 km', ja: 'アネスト岩田ターンパイク箱根' },
  { id: 'k1', img: '26-k1-night', route: 'K1', km: '17 km', ja: '横浜ループ（K5・K1・K3・湾岸線）' },
  { id: 'pa', img: '48-pa-lights', route: 'B', km: '30 km', ja: '大黒PA · 首都高速湾岸線' },
  { id: 'daiba', img: '33-rainbow', route: '11', km: '40 km', ja: '湾岸線・11号台場線・1号羽田線' },
  { id: 'seisho', img: '34-seisho', route: '1', km: '59 km', ja: '横浜新道・新湘南・西湘バイパス' },
  { id: 'mm', img: '18-minatomirai', route: 'Y', km: '', ja: '横浜・川崎・東京・湘南の街並み' },
];

// ── Feature rows: [key, screenshot, Japanese label, play link, extra-renderer]
const STANCES = ['stock', 'street', 'tsura', 'shakotan', 'vip', 'oni', 'drift', 'track', 'lift'];
const FROWS = [
  ['garage', '46-stance-garage', 'ガレージ', 'play.html', () => `<ul class="chips-row stance" aria-label="Stance">${STANCES.map(s => `<li>${esc(t('site.home.stance.' + s))}</li>`).join('')}</ul>`],
  ['roads', '44-mm-street', '日本の道', 'play.html?spawn=k1', () => `<ul class="chips-row marks" lang="ja" aria-hidden="true"><li>止まれ</li><li>速度落とせ</li><li>合流注意</li><li class="etc">ETC</li><li class="spd">50</li></ul>`],
  ['sky', '31-k1rain', '昼夜・天気', 'play.html?spawn=hakone', () => `<ul class="chips-row wx" aria-hidden="true">${[
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    '<path d="M7 18a4 4 0 0 1-.5-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18z"/>',
    '<path d="M7 15a4 4 0 0 1-.5-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
    '<path d="M7 14a4 4 0 0 1-.5-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 14z"/><path d="M12 14l-2 4h3l-2 4"/>',
    '<path d="M4 9h16M2 13h20M5 17h14"/>',
    '<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/>'].map(p => `<li>${ic(p)}</li>`).join('')}</ul>`],
  ['meet', '01-pa-night', '大黒PA', 'play.html?spawn=pa', () => `<ul class="chips-row marks" lang="ja" aria-hidden="true"><li class="pa">P</li><li>大黒PA</li><li>自販機</li><li>ONLINE β</li></ul>`],
];

// ── Detail grid: [i18n key (site.home.more.* or site.feat.*), icon]
const MORE = [
  ['home.more.sound', ic('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>')],
  ['home.more.fps', ic('<path d="M3 14a9 9 0 0 1 18 0"/><path d="M12 14l4.5-4.5"/><circle cx="12" cy="14" r="1.4"/><path d="M5 18h14"/>')],
  ['home.more.damage', ic('<path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5h-3v-2H6v2H3z"/><path d="M14 7l-1.5 3 2 1-2 3"/>')],
  ['feat.manual', ic('<path d="M6 4v16M12 4v16M18 4v8H6"/><circle cx="6" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="18" cy="4" r="1.5"/>')],
  ['feat.cockpit', ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 14.5V21M9.6 11.2 3.5 9.5M14.4 11.2l6.1-1.7"/>')],
  ['feat.plates', ic('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h4M7 14h10"/>')],
  ['home.more.radio', ic('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="8" cy="14" r="2.5"/><path d="M14 12h4M14 16h4"/>')],
  ['home.more.settings', ic('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>')],
  ['feat.langs', ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>')],
];

// ── Showcase strip (ids from data/cars.js; unknown ids are skipped)
const FEATURED = ['r34', 'jza80', 'fd3s', 'ae86', 's15', 'na1', 'r35', 'gr86', 'evo9', 'crown', 'a90', 'fl5'];

// ── Gallery: 9 shots fill the grid exactly on desktop (first one large). Caption: i18n site.shot.<first 2 chars>.
const SHOTS = ['29-hakone_dusk', '33-rainbow', '42-tokyo-night', '17-city-night', '24-rain', '22-haneda', '16-tsubasa', '28-c1tunnel', '23-foodcourt'];
const shotCap = s => {
  const k = 'site.shot.' + s.slice(0, 2), v = t(k);
  if (v !== k) return v;
  const w = s.replace(/^\d+[-_]?/, '').replace(/[-_]+/g, ' ').trim();
  return w ? w[0].toUpperCase() + w.slice(1) : s;
};

// ── Controls. Keep in sync with the game's input map.
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

// ───────────────────────── hero ─────────────────────────
function renderHero() {
  const v = 'v' + GAME.version;
  $('hero-version').textContent = v;
  $('hero-code').textContent = CHANGELOG[0]?.codename || '';
  $('hero-new').textContent = t('site.home.hero.new', { v: GAME.version });
  $('hero-badge').setAttribute('aria-label', t('site.home.hero.new', { v: GAME.version }));
}

function heroSlides() {
  const box = $('hero-slides'), loc = $('hero-loc'), dots = $('hero-dots'); if (!box) return;
  const reduce = reducedMotion();
  const first = box.querySelector('img');
  const imgs = SLIDES.map(([f], i) => {
    if (i === 0) return first;
    const im = new Image(); im.className = 'hero-shot slide'; im.alt = ''; im.decoding = 'async'; im.loading = 'lazy';
    im.sizes = '100vw'; im.dataset.srcset = srcset(f); im.width = 1600; im.height = 900;
    box.appendChild(im); return im;
  });
  const load = i => { const im = imgs[i]; if (im.dataset.srcset) { im.srcset = im.dataset.srcset; im.src = shotSrc(SLIDES[i][0], 1600); delete im.dataset.srcset; } };
  let k = 0, timer = 0;
  const show = i => {
    k = (i + imgs.length) % imgs.length; load(k); load((k + 1) % imgs.length);
    imgs.forEach((im, j) => im.classList.toggle('on', j === k));
    loc.innerHTML = `<i></i><span lang="ja">${esc(SLIDES[k][1])}</span>`;
    dots.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', String(j === k)));
  };
  const schedule = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show(k + 1), SLIDE_MS); };
  const renderDots = () => {
    dots.innerHTML = SLIDES.map((_, i) => `<button type="button" aria-label="${esc(t('site.home.slide', { n: i + 1 }))}" aria-current="${i === k}"><i></i></button>`).join('');
    dots.style.setProperty('--slide-ms', SLIDE_MS + 'ms');
  };
  renderDots(); window.addEventListener('langchange', () => { renderDots(); show(k); });
  dots.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; show([...dots.children].indexOf(b)); schedule(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(timer); else schedule(); });
  show(0); schedule();
}

function countUp() {
  if (reducedMotion()) return;
  document.querySelectorAll('.stats b').forEach((b, i) => {
    const end = +b.textContent; if (!Number.isFinite(end) || end <= 0) return;
    const t0 = performance.now() + 500 + i * 110, dur = 1200;
    b.textContent = '0';
    const tick = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      b.textContent = String(Math.round(end * e));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ───────────────────────── what's new ─────────────────────────
const WN_MAX = 6;
function renderWhatsNew() {
  const el = $('wn'), c = CHANGELOG[0];
  if (!c) { el.closest('section').hidden = true; return; }
  const all = (c.items || []).filter(i => i.type !== 'known');
  const order = { new: 0, change: 1, fix: 2 };
  const items = [...all].sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3)).slice(0, WN_MAX);
  const anchor = 'changelog.html#v' + c.version.replace(/\./g, '-');
  const [maj, min] = c.version.split('.');
  el.innerHTML = `
    <div class="wn-side">
      <span class="wn-big" aria-hidden="true">${esc(maj)}.${esc(min ?? '0')}</span>
      <span class="kicker"><span class="route new">NEW</span><span>${esc(t('site.home.new.kicker'))}</span></span>
      <h2 class="sec-title" id="wn-title">${esc(t('site.home.hero.new', { v: c.version }))}</h2>
      <div class="wn-meta">${c.codename ? `<span class="wn-code">${esc(c.codename)}</span>` : ''}<time datetime="${esc(c.date)}">${esc(c.date)}</time></div>
      <p class="wn-sum">${esc(pick(c.summary))}</p>
      <div class="wn-cta">
        <a class="btn btn-play" href="play.html">${PLAY}<span>${esc(t('site.home.new.play', { v: c.version }))}</span></a>
        <a class="btn btn-ghost" href="${esc(anchor)}">${esc(t('site.latest.more'))} →</a>
      </div>
    </div>
    <ol class="wn-list">
      ${items.map(i => `<li class="wn-item ${esc(i.type)}"><span class="ty ${esc(i.type)}">${esc(t('site.type.' + i.type))}</span><p>${esc(pick(i))}</p></li>`).join('')}
      ${all.length > items.length ? `<li class="wn-more"><a href="${esc(anchor)}">${esc(t('site.home.new.more', { n: all.length - items.length }))} →</a></li>` : ''}
    </ol>`;
}

// ───────────────────────── routes + regions ─────────────────────────
function renderRoutes() {
  $('route-grid').innerHTML = ROUTES.map((r, i) => `<a class="route-card${i === 0 || i === ROUTES.length - 1 ? ' wide' : ''}" href="play.html?spawn=${r.id}">
    <img src="${shotSrc(r.img, 800)}" srcset="${srcset(r.img)}" sizes="(min-width: 960px) ${i === 0 || i === ROUTES.length - 1 ? '66vw' : '33vw'}, 100vw" alt="" loading="lazy" decoding="async" width="800" height="450">
    <span class="rc-top"><span class="route${r.route === 'TP' ? ' aq' : ''}">${esc(r.route)}</span>${r.km ? `<span class="rc-km">${esc(r.km)}</span>` : ''}</span>
    <div class="rc-body"><span class="rc-jp" lang="ja">${esc(r.ja)}</span><h3>${esc(t('site.routes.' + r.id))}</h3><span class="rc-d">${esc(t('site.routes.' + r.id + 'D'))}</span>
    <span class="rc-go">${PLAY}${esc(t('site.routes.go'))}</span></div></a>`).join('');
  const live = REGIONS.filter(r => r.status === 'live');
  $('rb-label').innerHTML = `<i class="dot live"></i>${esc(t('site.home.regions.live', { n: live.length }))}`;
  $('rb-chips').innerHTML = live.map(r => `<a class="rchip" href="regions.html#r-${encodeURIComponent(r.id)}">${esc(pick(r.name))}</a>`).join('');
}

// ───────────────────────── features ─────────────────────────
function renderFeatures() {
  $('frows').innerHTML = FROWS.map(([k, img, jp, href, extra], i) => `
    <article class="frow${i % 2 ? ' flip' : ''}">
      <figure class="frow-media"><img src="${shotSrc(img, 800)}" srcset="${srcset(img)}" sizes="(min-width: 960px) 55vw, 100vw" alt="" loading="lazy" decoding="async" width="800" height="450"><span class="frow-n" aria-hidden="true">0${i + 1}</span></figure>
      <div class="frow-copy">
        <span class="frow-jp" lang="ja">${esc(jp)}</span>
        <h3>${esc(t('site.home.feat.' + k + '.t'))}</h3>
        <p>${esc(t('site.home.feat.' + k + '.d'))}</p>
        ${extra()}
        <a class="frow-go" href="${href}">${esc(t('site.home.feat.' + k + '.cta'))} <span aria-hidden="true">→</span></a>
      </div>
    </article>`).join('');
  $('mini-grid').innerHTML = MORE.map(([k, svg]) => `<article class="mini"><span class="mini-ic">${svg}</span><div><h4>${esc(t('site.' + k + '.t', { n: CARS.length }))}</h4><p>${esc(t('site.' + k + '.d', { n: CARS.length }))}</p></div></article>`).join('');
}

// ───────────────────────── showcase strip ─────────────────────────
function renderShowcase() {
  const list = FEATURED.map(id => CARS.find(c => c.id === id)).filter(c => c && c.playable);
  $('show-lead').textContent = t('site.show.lead', { n: CARS.length });
  $('show-all').textContent = t('site.show.all', { n: CARS.length }) + ' →';
  $('car-strip').innerHTML = list.map(c => `
    <li class="scar">
      <a class="car-img" href="cars.html#${encodeURIComponent(c.id)}" tabindex="-1" aria-hidden="true">${carImage(c)}<span class="tag drv" title="${esc(t('site.drive.' + c.drive))}">${esc(c.drive)}</span></a>
      <div class="scar-body">
        <div class="car-maker">${esc(c.maker)}</div>
        <a class="car-name" href="cars.html#${encodeURIComponent(c.id)}">${esc(c.name)}</a>
        <div class="car-sub"><b>${esc(c.chassis)}</b> · ${c.year} · ${num(c.engine.hp)} hp</div>
        <a class="btn btn-play sm" href="play.html?car=${encodeURIComponent(c.id)}" aria-label="${esc(t('site.show.drive') + ': ' + c.maker + ' ' + c.name)}">${PLAY}${esc(t('site.show.drive'))}</a>
      </div>
    </li>`).join('');
}
let stripUpd = () => {};
function wireStrip() {
  const st = $('car-strip'), pv = $('strip-prev'), nx = $('strip-next');
  const upd = () => { pv.disabled = st.scrollLeft < 4; nx.disabled = st.scrollLeft + st.clientWidth >= st.scrollWidth - 4; };
  const go = d => st.scrollBy({ left: d * Math.max(280, st.clientWidth * 0.8), behavior: reducedMotion() ? 'auto' : 'smooth' });
  pv.addEventListener('click', () => go(-1)); nx.addEventListener('click', () => go(1));
  st.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd);
  if ('ResizeObserver' in window) new ResizeObserver(upd).observe(st);
  stripUpd = upd; requestAnimationFrame(upd);
}

// ───────────────────────── gallery + lightbox ─────────────────────────
function renderGallery() {
  const g = $('gallery-grid');
  g.innerHTML = SHOTS.map((s, i) => `
    <button type="button" class="shot" data-i="${i}" aria-label="${esc(shotCap(s))}">
      <img src="${shotSrc(s, 800)}" srcset="${srcset(s)}" sizes="(min-width: 900px) ${i === 0 ? '66vw' : '33vw'}, 100vw" alt="" loading="lazy" decoding="async" width="800" height="450">
      <span class="cap">${esc(shotCap(s))}</span>
    </button>`).join('');
  g.querySelectorAll('.shot').forEach(b => b.addEventListener('click', () => openLb(+b.dataset.i)));
}
let lbIndex = 0;
const lb = () => $('lightbox');
function openLb(i) {
  lbIndex = (i + SHOTS.length) % SHOTS.length; const s = SHOTS[lbIndex];
  const im = $('lb-img');
  im.src = shotSrc(s, 1600); im.alt = shotCap(s);
  $('lb-cap').textContent = shotCap(s);
  swap(im);
  if (!lb().classList.contains('open')) { lb().classList.add('open'); lb().querySelector('.lb-close').focus(); }
}
function closeLb() { lb().classList.remove('open'); document.querySelector(`#gallery-grid .shot[data-i="${lbIndex}"]`)?.focus(); }
function wireLb() {
  const el = lb();
  el.querySelector('.lb-close').onclick = closeLb;
  el.querySelector('.lb-prev').onclick = () => openLb(lbIndex - 1);
  el.querySelector('.lb-next').onclick = () => openLb(lbIndex + 1);
  el.addEventListener('click', e => { if (e.target === el) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!el.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') openLb(lbIndex - 1); else if (e.key === 'ArrowRight') openLb(lbIndex + 1);
  });
}

// ───────────────────────── requirements, controls, FAQ ─────────────────────────
function renderReq() {
  $('req-table').innerHTML = `<thead><tr><th></th><th>${esc(t('site.req.min'))}</th><th>${esc(t('site.req.rec'))}</th></tr></thead>
  <tbody>${REQ.map(k => `<tr><th scope="row">${esc(t('site.req.' + k))}</th><td data-l="${esc(t('site.req.min'))}">${esc(t('site.req.' + k + '.min'))}</td><td data-l="${esc(t('site.req.rec'))}">${esc(t('site.req.' + k + '.rec'))}</td></tr>`).join('')}</tbody>`;
}
// Phones default to the touch column (the full table is long when stacked).
let dev = matchMedia('(max-width: 600px)').matches ? 'touch' : 'all';
function renderCtl() {
  const kb = a => a.map(k => `<kbd>${esc(k)}</kbd>`).join(' ');
  const cols = [['kb', 'site.ctl.keyboard'], ['pad', 'site.ctl.gamepad'], ['touch', 'site.ctl.touch']].filter(([d]) => dev === 'all' || dev === d);
  const cell = (d, row) => d === 'kb' ? kb(row[1]) : d === 'pad' ? kb(row[2]) : esc(t('site.ctl.t.' + row[3]));
  $('ctl-table').innerHTML = `<thead><tr><th>${esc(t('site.ctl.action'))}</th>${cols.map(([, k]) => `<th>${esc(t(k))}</th>`).join('')}</tr></thead>
  <tbody>${CONTROLS.map(r => `<tr><th scope="row">${esc(t('site.ctl.a.' + r[0]))}</th>${cols.map(([d, k]) => `<td data-l="${esc(t(k))}">${cell(d, r)}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
function wireTabs() {
  const tabs = document.querySelectorAll('#ctl-tabs .tab');
  tabs.forEach(x => x.setAttribute('aria-selected', String(x.dataset.dev === dev)));
  tabs.forEach(b => b.addEventListener('click', () => {
    dev = b.dataset.dev; tabs.forEach(x => x.setAttribute('aria-selected', String(x === b))); renderCtl(); swap($('ctl-table'));
  }));
}
function renderFaq() {
  $('faq-list').innerHTML = FAQ.map(k =>
    `<details><summary>${esc(t('site.faq.' + k + '.q'))}</summary><div>${esc(t('site.faq.' + k + '.a', { langs: LANGS.length }))}</div></details>`).join('');
}
function wireCopy() {
  const btn = $('copy-url'), url = $('site-url').textContent.trim();
  btn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {
      const r = document.createRange(); r.selectNodeContents($('site-url'));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      try { ok = document.execCommand('copy'); } catch {}
    }
    const lab = btn.querySelector('span');
    lab.textContent = t(ok ? 'site.start.copied' : 'site.start.copyFail');
    btn.classList.toggle('ok', ok);
    clearTimeout(btn._t); btn._t = setTimeout(() => { lab.textContent = t('site.start.copy'); btn.classList.remove('ok'); }, 1800);
  });
}

// ───────────────────────── boot ─────────────────────────
$('st-routes').textContent = ROUTES.length;
$('st-cars').textContent = CARS.length;
$('st-langs').textContent = LANGS.length;
countUp();
wireLb(); wireTabs(); wireCopy(); wireStrip();
await initSite('home');
heroSlides();
onLang(() => {
  renderHero(); renderWhatsNew(); renderRoutes(); renderFeatures();
  renderShowcase(); requestAnimationFrame(stripUpd); renderGallery(); renderReq(); renderCtl(); renderFaq();
});
