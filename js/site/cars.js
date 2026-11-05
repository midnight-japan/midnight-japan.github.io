// Vehicle list page: category chips, search, sort, cards with spec bars, detail modal.
import { CARS, CATEGORIES } from '../../data/cars.js';
import { t, pick } from '../i18n.js';
import { initSite, onLang, esc, num } from './common.js';
import { carImage, plateBadge } from './carart.js';
// The 3D viewer (three.js + the game's car model) is loaded only when a car is opened.
let car3d = null;
const load3d = () => (car3d ||= import('./car3d.js').catch(e => { console.warn('[cars] 3D viewer unavailable', e); return null; }));
const unmountCar3D = () => car3d?.then(m => m?.unmountCar3D());
let glOK;
const webglAvailable = () => glOK ??= (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();

const SCALE = { hp: 600, nm: 700, mass: 2500, pw: 350 };
const pw = c => c.engine.hp / (c.mass / 1000);
const pct = (v, max) => Math.max(3, Math.min(100, v / max * 100)).toFixed(1);

let cat = 'all', query = '', sort = 'default';
const params = new URLSearchParams(location.search);
if (params.get('cat') && CATEGORIES.includes(params.get('cat'))) cat = params.get('cat');

function transLabel(c) {
  const ty = t('site.trans.' + c.trans.type);
  return c.trans.type === 'EV' ? ty : `${t('site.trans.speeds', { n: c.trans.gears.length })} ${ty}`;
}
function engineLabel(c) {
  const parts = [t('site.eng.' + c.engine.type)];
  if (c.engine.disp) parts.push((c.engine.disp / 1000).toFixed(1) + ' L');
  if (c.engine.type !== 'EV') parts.push(c.engine.turbo ? t('site.eng.turbo') : t('site.eng.na'));
  if (c.hybrid) parts.push(t('site.eng.hybrid'));
  return parts.join(' · ');
}

function specBars(c) {
  const row = (cls, label, v, max, txt) => `<div class="spec ${cls}"><dt>${esc(label)}</dt><div class="bar"><i style="width:${pct(v, max)}%"></i></div><dd>${txt}</dd></div>`;
  return `<dl class="specs">
    ${row('hp', t('site.spec.power'), c.engine.hp, SCALE.hp, `${num(c.engine.hp)} hp`)}
    ${row('tq', t('site.spec.torque'), c.engine.nm, SCALE.nm, `${num(c.engine.nm)} N·m`)}
    ${row('ms', t('site.spec.mass'), c.mass, SCALE.mass, `${num(c.mass)} kg`)}
    ${row('pw', t('site.spec.pw'), pw(c), SCALE.pw, `${num(pw(c))} hp/t`)}
  </dl>`;
}

function card(c) {
  return `<button type="button" class="card car" data-id="${esc(c.id)}" aria-haspopup="dialog">
    <div class="car-img">${carImage(c)}<div class="tags"><span class="tag cat-${esc(c.cat)}">${esc(t('site.cat.' + c.cat))}</span>${c.playable ? '' : `<span class="tag ai">${esc(t('site.cars.aiOnly'))}</span>`}</div></div>
    <div class="car-body">
      <div class="car-top">
        <div><div class="car-maker">${esc(c.maker)}</div><div class="car-name">${esc(c.name)}</div><div class="car-sub"><b>${esc(c.chassis)}</b> · ${c.year}</div></div>
        <div>${plateBadge(c)}<div class="plate-l">${esc(t('site.plate.' + c.plate))}</div></div>
      </div>
      ${specBars(c)}
      <div class="car-foot"><span class="pill code">${esc(c.engine.code)}</span><span class="pill">${esc(engineLabel(c))}</span><span class="pill">${esc(transLabel(c))}</span><span class="pill">${esc(c.drive)}</span></div>
    </div>
  </button>`;
}

function filtered() {
  const q = query.trim().toLowerCase();
  let list = CARS.filter(c => (cat === 'all' || c.cat === cat) &&
    (!q || [c.maker, c.name, c.chassis, c.engine.code, c.id, String(c.year), t('site.cat.' + c.cat)].join(' ').toLowerCase().includes(q)));
  const by = {
    hp: (a, b) => b.engine.hp - a.engine.hp, nm: (a, b) => b.engine.nm - a.engine.nm, pw: (a, b) => pw(b) - pw(a),
    mass: (a, b) => a.mass - b.mass, year: (a, b) => b.year - a.year, name: (a, b) => (a.maker + a.name).localeCompare(b.maker + b.name),
  }[sort];
  if (by) list = [...list].sort(by);
  return list;
}

function renderChips() {
  const all = ['all', ...CATEGORIES];
  document.getElementById('cat-chips').innerHTML = all.map(k => {
    const n = k === 'all' ? CARS.length : CARS.filter(c => c.cat === k).length;
    return `<button type="button" class="chip" data-cat="${k}" aria-pressed="${k === cat}">${esc(t(k === 'all' ? 'site.cat.all' : 'site.cat.' + k))}<span class="n">${n}</span></button>`;
  }).join('');
}

function renderGrid() {
  const list = filtered();
  document.getElementById('car-count').textContent = t('site.cars.count', { n: list.length });
  document.getElementById('car-grid').innerHTML = list.length ? list.map(card).join('') : `<div class="empty" style="grid-column:1/-1">${esc(t('site.cars.empty'))}</div>`;
}

let lastFocus = null, openId = null;
function openModal(id) {
  const c = CARS.find(x => x.id === id); if (!c) return;
  openId = id; lastFocus = lastFocus || document.activeElement;
  const dl = [
    [t('site.spec.engine'), `${c.engine.code}`],
    [t('site.spec.layout'), engineLabel(c)],
    ...(c.engine.disp ? [[t('site.spec.disp'), `${num(c.engine.disp)} cc`]] : []),
    [t('site.spec.power'), `${num(c.engine.hp)} hp`],
    [t('site.spec.torque'), `${num(c.engine.nm)} N·m`],
    [t('site.spec.redline'), `${num(c.engine.redline)} rpm`],
    ...(c.battery ? [[t('site.spec.battery'), `${num(c.battery)} kWh`]] : []),
    [t('site.spec.trans'), transLabel(c)],
    [t('site.spec.drive'), `${c.drive} — ${t('site.drive.' + c.drive)}`],
    [t('site.spec.mass'), `${num(c.mass)} kg`],
    [t('site.spec.pw'), `${num(pw(c), 1)} hp/t`],
    [t('site.spec.size'), `${num(c.L)} × ${num(c.W)} × ${num(c.H)} mm`],
    [t('site.spec.wb'), `${num(c.wb)} mm`],
  ];
  const st = paintState(c);
  const box = document.getElementById('car-modal-box');
  box.innerHTML = `
    <button class="modal-close" type="button" aria-label="${esc(t('site.close'))}">×</button>
    <div class="md-hero" id="md-hero">
      <div class="md-sil" id="md-sil">${carImage(c, { color: st.color })}</div>
      <div class="car3d" id="car3d"><div class="car3d-load"><i></i></div></div>
      <span class="car3d-hint" aria-hidden="true">${esc(t('site.cars.dragHint'))}</span>
    </div>
    <div class="md-body">
      <div>
        <div class="car-maker">${esc(c.maker)} · <span class="tag cat-${esc(c.cat)}">${esc(t('site.cat.' + c.cat))}</span></div>
        <h2 class="md-title" id="md-title">${esc(c.name)}</h2>
        <div class="car-sub" style="margin-bottom:14px"><b>${esc(c.chassis)}</b> · ${c.year}</div>
        <p class="md-desc">${esc(pick(c.desc))}</p>
        <div class="paint">
          <div class="count">${esc(t('site.cars.colors'))}</div>
          <div class="swatches" id="md-sw" role="radiogroup" aria-label="${esc(t('site.cars.colors'))}">${c.colors.map((col, i) => `<button type="button" class="sw" role="radio" style="--c:${esc(col)}" data-col="${esc(col)}" aria-checked="${col.toLowerCase() === st.color.toLowerCase()}" aria-label="${esc(t('site.cars.colorN', { n: i + 1 }))} ${esc(col)}" title="${esc(col)}"></button>`).join('')}
            <label class="sw custom" title="${esc(t('site.cars.custom'))}"><input type="color" id="md-custom" value="${esc(st.color)}" aria-label="${esc(t('site.cars.custom'))}"><span aria-hidden="true">+</span></label></div>
          <div class="count">${esc(t('site.cars.finish'))}</div>
          <div class="seg" id="md-finish" role="radiogroup" aria-label="${esc(t('site.cars.finish'))}">${FINISHES.map(f => `<button type="button" role="radio" data-f="${f}" aria-checked="${f === st.finish}">${esc(t('site.finish.' + f))}</button>`).join('')}</div>
          <div class="count">${esc(t('site.cars.rim'))}</div>
          <div class="swatches sm" id="md-rim" role="radiogroup" aria-label="${esc(t('site.cars.rim'))}">${RIMS.map(col => `<button type="button" class="sw" role="radio" style="--c:${col}" data-rim="${col}" aria-checked="${col === st.rim}" title="${col}" aria-label="${esc(t('site.cars.rim'))} ${col}"></button>`).join('')}</div>
        </div>
        <div class="row" style="align-items:flex-start;gap:18px">
          <div>${plateBadge(c, true)}<div class="plate-l">${esc(t('site.plate.' + c.plate))}</div></div>
          <p style="flex:1;min-width:180px;color:var(--muted);font-size:.86rem;margin:0">${esc(t('site.plate.' + c.plate + '.d'))}</p>
        </div>
        <div class="row" style="margin-top:20px">
          ${c.playable ? `<button type="button" class="btn btn-play" id="md-drive"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>${esc(t('site.cars.driveColor'))}</button>
            <a class="btn btn-ghost btn-sm" href="play.html?car=${encodeURIComponent(c.id)}">${esc(t('site.cars.drive'))}</a>` : `<span class="tag ai">${esc(t('site.cars.aiOnlyLong'))}</span>`}
        </div>
      </div>
      <div>
        <h3 style="font-size:.85rem;letter-spacing:.14em;text-transform:uppercase;color:var(--sodium-2)">${esc(t('site.cars.specs'))}</h3>
        ${specBars(c)}
        <dl class="dl" style="margin-top:16px">${dl.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <p style="margin:10px 0 0;font-size:.75rem;color:var(--dim)">${esc(t('site.cars.specNote'))}</p>
      </div>
    </div>`;
  const m = document.getElementById('car-modal');
  const wasOpen = m.classList.contains('open');
  m.classList.add('open'); document.body.style.overflow = 'hidden';
  box.querySelector('.modal-close').onclick = closeModal;
  if (!wasOpen) box.querySelector('.modal-close').focus({ preventScroll: true });
  history.replaceState(null, '', '#' + c.id);
  wirePaint(c, st);
}

const FINISHES = ['metallic', 'pearl', 'solid', 'matte'];
const RIMS = ['#b9bcc0', '#2a2c30', '#d4af37', '#e8e8e6', '#8a5a2b', '#c0392b'];
function readGarage() { try { const g = JSON.parse(localStorage.getItem('dn.garage')) || {}; return { car: g.car || 'r34', ...g, cars: g.cars || {} }; } catch { return { car: 'r34', cars: {} }; } }
const pickState = {}; // per-car choice made on this page (not yet saved)
function paintState(c) {
  if (pickState[c.id]) return pickState[c.id];
  const s = readGarage().cars[c.id] || {};
  return (pickState[c.id] = { color: s.color || c.colors[0], finish: s.finish || (c.cat === 'police' ? 'solid' : 'metallic'), rim: s.rim || RIMS[0] });
}

let ctl = null;
function wirePaint(c, st) {
  const box = document.getElementById('car-modal-box');
  const host = box.querySelector('#car3d'), hero = box.querySelector('#md-hero');
  const sil = () => { box.querySelector('#md-sil').innerHTML = carImage(c, { color: st.color }); };
  ctl = null;
  if (webglAvailable()) {
    hero.classList.add('has3d');
    load3d().then(m => m ? m.mountCar3D(host, c, { ...st, onFail: () => hero.classList.remove('has3d') }) : null).then(r => {
      if (openId !== c.id) return;
      if (!r) { hero.classList.remove('has3d'); return; }
      ctl = r; r.setFinish(st.finish); r.setPaint(st.color); r.setRim(st.rim);
    });
  }
  const setColor = (col, from) => {
    st.color = col;
    box.querySelectorAll('#md-sw .sw[data-col]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.col.toLowerCase() === col.toLowerCase())));
    const cu = box.querySelector('#md-custom'); if (from !== 'custom') cu.value = col;
    cu.closest('.custom').style.setProperty('--c', col);
    cu.closest('.custom').classList.toggle('on', !c.colors.some(x => x.toLowerCase() === col.toLowerCase()));
    if (ctl) ctl.setPaint(col); else sil();
    if (from !== 'custom') hero.classList.remove('flash'), void hero.offsetWidth, hero.classList.add('flash');
  };
  box.querySelector('#md-sw').addEventListener('click', e => { const b = e.target.closest('.sw[data-col]'); if (b) setColor(b.dataset.col); });
  box.querySelector('#md-custom').addEventListener('input', e => setColor(e.target.value, 'custom'));
  setColor(st.color, 'init');
  box.querySelector('#md-finish').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return; st.finish = b.dataset.f;
    box.querySelectorAll('#md-finish [data-f]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    ctl?.setFinish(st.finish);
  });
  box.querySelector('#md-rim').addEventListener('click', e => {
    const b = e.target.closest('[data-rim]'); if (!b) return; st.rim = b.dataset.rim;
    box.querySelectorAll('#md-rim [data-rim]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    ctl?.setRim(st.rim);
  });
  // arrow keys inside radio groups
  box.querySelectorAll('[role=radiogroup]').forEach(g => g.addEventListener('keydown', e => {
    if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
    const items = [...g.querySelectorAll('button[role=radio]')], i = items.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); const n = items[(i + (/Right|Down/.test(e.key) ? 1 : -1) + items.length) % items.length]; n.focus(); n.click();
  }));
  box.querySelector('#md-drive')?.addEventListener('click', () => {
    const g = readGarage();
    g.cars[c.id] = { ...(g.cars[c.id] || {}), color: st.color, finish: st.finish, rim: st.rim };
    g.car = c.id;
    try { localStorage.setItem('dn.garage', JSON.stringify(g)); } catch {}
    location.href = `play.html?go=1&car=${encodeURIComponent(c.id)}`;
  });
}
function closeModal() {
  const m = document.getElementById('car-modal'); if (!m.classList.contains('open')) return;
  m.classList.remove('open'); document.body.style.overflow = ''; openId = null; ctl = null;
  setTimeout(() => { if (!openId) unmountCar3D(); }, 260);
  history.replaceState(null, '', location.pathname + location.search);
  lastFocus?.focus?.(); lastFocus = null;
}

document.getElementById('cat-chips').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  cat = b.dataset.cat; renderChips(); renderGrid();
});
document.getElementById('car-search').addEventListener('input', e => { query = e.target.value; renderGrid(); });
document.getElementById('car-sort').addEventListener('change', e => { sort = e.target.value; renderGrid(); });
document.getElementById('car-grid').addEventListener('click', e => { const b = e.target.closest('.car'); if (b) { lastFocus = b; openModal(b.dataset.id); } });
document.getElementById('car-modal').addEventListener('click', e => { if (e.target.id === 'car-modal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

await initSite('cars');
onLang(() => { renderChips(); renderGrid(); if (openId) openModal(openId); });
const h = location.hash.slice(1); if (h && CARS.some(c => c.id === h)) openModal(h);
