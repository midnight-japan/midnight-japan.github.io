// Regions page: REGIONS list with status badges + stylised Tokyo Bay map.
import { REGIONS } from '../../data/meta.js';
import { t, pick } from '../i18n.js';
import { initSite, onLang, esc } from './common.js';

// Approximate map positions (viewBox 0 0 600 600; x=(lon-139.55)*1000, y=(35.72-lat)*1230). Unknown ids are listed but not plotted.
const POS = {
  daikoku_pa: [128, 318], daikoku_jct: [140, 306], daikoku_futo: [146, 330], baybridge: [118, 346],
  tsubasa: [168, 290], tatsumi: [262, 94], shibaura: [222, 106], umihotaru: [325, 315],
};
const LABEL_SIDE = { daikoku_pa: 'l', daikoku_jct: 'r', daikoku_futo: 'r', baybridge: 'l', tsubasa: 'r', tatsumi: 'r', shibaura: 'l', umihotaru: 'r' };

const WATER = 'M216 100 L262 98 L300 112 L350 112 L392 80 L432 58 L470 96 L520 130 L552 162 L540 205 L522 246 L486 284 L452 322 L400 370 L352 418 L336 456 L292 478 L252 504 L292 528 L316 600 L160 600 L184 578 L148 560 L120 541 L128 470 L132 420 L124 372 L102 350 L96 336 L118 326 L134 312 L150 292 L190 276 L226 262 L248 236 L256 214 L238 186 L214 168 L204 148 L210 122 Z';

function map() {
  const pt = (id, i) => {
    const r = REGIONS.find(x => x.id === id); const [x, y] = POS[id];
    const left = LABEL_SIDE[id] === 'l';
    return `<g class="mk" data-id="${esc(id)}" tabindex="0" role="button" aria-label="${esc(pick(r.name))} — ${esc(t('site.status.' + r.status))}">
      ${r.status === 'live' ? `<circle class="pulse" cx="${x}" cy="${y}" r="7" fill="none" stroke="#33c27a" stroke-width="2"/>` : ''}
      <circle class="ring" cx="${x}" cy="${y}" r="9" fill="${r.status === 'live' ? '#33c27a' : r.status === 'partial' ? '#ff9a2e' : '#0a1120'}" fill-opacity="${r.status === 'planned' ? 1 : .25}" stroke="${r.status === 'live' ? '#33c27a' : r.status === 'partial' ? '#ff9a2e' : '#8796b5'}" stroke-width="2"/>
      <circle cx="${x}" cy="${y}" r="3.2" fill="${r.status === 'planned' ? '#8796b5' : '#fff'}"/>
      <text x="${left ? x - 14 : x + 14}" y="${y + 4 + (i % 2 ? 0 : 0)}" text-anchor="${left ? 'end' : 'start'}" class="ml">${esc(pick(r.name))}</text>
    </g>`;
  };
  const place = (x, y, k, size = 12) => `<text x="${x}" y="${y}" class="pl" font-size="${size}">${esc(t('site.map.' + k))}</text>`;
  const ids = REGIONS.map(r => r.id).filter(id => POS[id]);
  return `<svg viewBox="0 0 600 600" role="img" aria-label="${esc(t('site.map.aria'))}">
  <defs>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#5fd4ff" stroke-opacity=".05"/></pattern>
    <radialGradient id="wglow" cx=".35" cy=".5" r=".6"><stop offset="0" stop-color="#10264a"/><stop offset="1" stop-color="#081427"/></radialGradient>
  </defs>
  <style>
    .pl{fill:#7f8ba3;font-family:var(--display);letter-spacing:.14em;text-transform:uppercase;font-weight:600}
    .ml{fill:#e9edf5;font:600 12.5px var(--font);paint-order:stroke;stroke:#060a13;stroke-width:4px;stroke-linejoin:round}
    .rt{fill:none;stroke-linecap:round;stroke-linejoin:round}
  </style>
  <rect width="600" height="600" fill="#0d1526"/>
  <rect width="600" height="600" fill="url(#grid)"/>
  <path d="${WATER}" fill="url(#wglow)" stroke="#2a4d7c" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="${WATER}" fill="url(#grid)"/>
  <!-- Expressways (schematic) -->
  <path class="rt" d="M330 60 L300 84 L262 96 L222 106 L208 140 L232 186 L244 214 L226 258 L190 272 L168 290 L140 306 L128 318 L118 346 L126 380 L124 440 L120 520" stroke="#04070d" stroke-width="7"/>
  <path class="rt" d="M330 60 L300 84 L262 96 L222 106 L208 140 L232 186 L244 214 L226 258 L190 272 L168 290 L140 306 L128 318 L118 346 L126 380 L124 440 L120 520" stroke="#2fbf71" stroke-width="3.5"/>
  <path class="rt" d="M226 258 L325 315 L360 400" stroke="#2fbf71" stroke-width="3" stroke-dasharray="7 5"/>
  <path class="rt" d="M140 306 L120 270 L150 230 L200 150 L222 106" stroke="#2fbf71" stroke-width="2" stroke-opacity=".5"/>
  ${place(150, 70, 'tokyo', 14)}${place(70, 250, 'kawasaki')}${place(30, 300, 'yokohama', 13)}${place(470, 60, 'chiba')}${place(400, 440, 'kisarazu')}
  ${place(272, 230, 'haneda', 11)}${place(22, 392, 'minatomirai', 10)}${place(300, 280, 'aqualine', 9)}
  <text x="460" y="250" class="pl" font-size="18" style="letter-spacing:.5em;fill:#3e5784">東京湾</text>
  ${ids.map(pt).join('')}
  <g transform="translate(560 540)" fill="none" stroke="#7f8ba3" stroke-width="1.5"><path d="M0 -22 L6 0 L0 -5 L-6 0Z" fill="#7f8ba3"/><text x="0" y="16" text-anchor="middle" class="pl" font-size="11" stroke="none" fill="#7f8ba3">N</text></g>
</svg>`;
}

function list() {
  return REGIONS.map(r => `<article class="card region" id="r-${esc(r.id)}" data-id="${esc(r.id)}">
    <div class="rtop"><h3>${esc(pick(r.name))}</h3><span class="status ${esc(r.status)}"><i class="dot ${esc(r.status)}"></i>${esc(t('site.status.' + r.status))}</span></div>
    <div class="pref" lang="ja">${esc(r.pref || '')}</div>
    <p>${esc(r.status === 'planned' && (pick(r.desc) || '').length < 16 ? t('site.status.plannedDesc') : pick(r.desc))}</p>
  </article>`).join('');
}

function hl(id, on) {
  document.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach(el => el.classList.toggle('hl', on));
}

function render() {
  document.getElementById('bay-map').innerHTML = map();
  document.getElementById('region-list').innerHTML = list();
  document.querySelectorAll('.mk').forEach(m => {
    const go = () => { const el = document.getElementById('r-' + m.dataset.id); el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); hl(m.dataset.id, true); setTimeout(() => hl(m.dataset.id, false), 1600); };
    m.addEventListener('click', go);
    m.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    m.addEventListener('mouseenter', () => hl(m.dataset.id, true));
    m.addEventListener('mouseleave', () => hl(m.dataset.id, false));
  });
  document.querySelectorAll('.region').forEach(r => {
    r.addEventListener('mouseenter', () => hl(r.dataset.id, true));
    r.addEventListener('mouseleave', () => hl(r.dataset.id, false));
  });
}

await initSite('regions');
onLang(render);
