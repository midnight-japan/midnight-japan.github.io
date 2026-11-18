// Regions page (v2.13.9): all of Japan — every prefecture from Natural Earth (data/japan.js), the drivable area
// around Tokyo Bay and Hakone highlighted (planned: Osaka), then a close-up of that area with each region as a
// landmark illustration you can click; every card has a "drive here" button that starts the game at that spot.
import { REGIONS } from '../../data/meta.js';
import { JAPAN_LAND, JAPAN_PREFS, JAPAN_CITIES } from '../../data/japan.js';
import { t, pick, getLang } from '../i18n.js';
import { initSite, onLang, esc } from './common.js';

const L3 = (ko, ja, en) => pick({ ko, ja, en });
// game metres (x east, z south) — the same frame as the in-game map
const POS = {
  daikoku_pa: [120, -60, 'pa'], daikoku_jct: [-300, -350, 'pa'], daikoku_futo: [800, 600, 'futo'], baybridge: [-560, 760, 'bay'],
  k1loop: [-2600, -1300, 'k1'], yokohama: [-3480, -60, 'mm'], kawasaki: [2600, -5145, 'kawasaki'], haneda: [9049, -9720, 'haneda'],
  tsubasa: [4600, -3200, 'bay'], c1: [5810, -24414, 'c1'], hakone: [-57257, 30719, 'hakone'], route1: [6400, -14500, 'r1'],
  rainbow: [8115, -19170, 'daiba'], seisho: [-41200, 19400, 'seisho'], tokyo3d: [3600, -27500, 'c1'], kisarazu: [21800, 11500, 'umi'],
  shonan: [-20400, 17000, 'seisho'], umihotaru: [17681, -276, 'umi'], tatsumi: [10800, -20200, null], shibaura: [8000, -21600, null],
};
const ART = { daikoku_pa: 'pa', daikoku_jct: 'jct', daikoku_futo: 'port', baybridge: 'bridge', k1loop: 'jct', yokohama: 'city', kawasaki: 'factory',
  haneda: 'airport', tsubasa: 'bridge', c1: 'tower', hakone: 'mountain', route1: 'city', rainbow: 'bridge', seisho: 'coast', tokyo3d: 'tower',
  kisarazu: 'coast', shonan: 'coast', umihotaru: 'sea', tatsumi: 'pa', shibaura: 'pa' };

// ── landmark illustrations (flat, night palette; drawn here — no external images) ──
const SKY = (a, b) => `<defs><linearGradient id="g${a.slice(1)}${b.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="140" fill="url(#g${a.slice(1)}${b.slice(1)})"/>`;
const MOON = '<circle cx="270" cy="30" r="11" fill="#ffe9b8" opacity=".9"/>';
const SEA = y => `<rect y="${y}" width="320" height="${140 - y}" fill="#0a2238"/><path d="M0 ${y + 8}h320M0 ${y + 18}h320" stroke="#1d4a72" stroke-width="1.5" stroke-dasharray="14 10"/>`;
const ARTS = {
  pa: () => `${SKY('#1b1440', '#3a1d4e')}${MOON}<path d="M0 46h320" stroke="#5a5f6e" stroke-width="10"/><g fill="#6b7080">${[30, 90, 150, 210, 270].map(x => `<rect x="${x}" y="51" width="7" height="40"/>`).join('')}</g>
    <rect y="92" width="320" height="48" fill="#232634"/><g stroke="#e8e8e0" stroke-width="2">${[40, 80, 120, 160, 200, 240, 280].map(x => `<path d="M${x} 100v30"/>`).join('')}</g>
    ${[[52, '#d4252f'], [92, '#f2f2ee'], [132, '#2659c9'], [212, '#f2c200'], [252, '#141414']].map(([x, c]) => `<g transform="translate(${x} 108)"><path d="M0 14q2-9 10-10h12q8 1 10 10z" fill="${c}"/><rect x="-1" y="13" width="34" height="5" rx="2" fill="${c}"/><circle cx="6" cy="19" r="3.5" fill="#111"/><circle cx="26" cy="19" r="3.5" fill="#111"/><rect x="31" y="14" width="3" height="2" fill="#ffcf6a"/></g>`).join('')}
    <rect x="170" y="70" width="26" height="22" rx="2" fill="#2659c9"/><text x="183" y="87" text-anchor="middle" font-size="16" font-weight="800" fill="#fff" font-family="sans-serif">P</text>`,
  jct: () => `${SKY('#0d1530', '#24305c')}${MOON}<g fill="none" stroke-linecap="round"><ellipse cx="160" cy="80" rx="110" ry="38" stroke="#58607a" stroke-width="12"/><ellipse cx="160" cy="80" rx="70" ry="24" stroke="#6d7590" stroke-width="10"/>
    <ellipse cx="160" cy="80" rx="110" ry="38" stroke="#ffb64d" stroke-width="1.5" stroke-dasharray="3 9"/><ellipse cx="160" cy="80" rx="70" ry="24" stroke="#ff6a3d" stroke-width="1.5" stroke-dasharray="3 9"/></g>
    <g fill="#3b4258">${[60, 110, 160, 210, 260].map(x => `<rect x="${x - 4}" y="88" width="8" height="52"/>`).join('')}</g>`,
  port: () => `${SKY('#101a33', '#2b2f4f')}${SEA(104)}${[40, 120].map(x => `<g transform="translate(${x} 20)" stroke="#e2533a" stroke-width="5" fill="none"><path d="M8 84V20h40v64M8 20L-4 4h90M48 20l30-16"/><path d="M8 50h40" stroke-width="3"/></g>`).join('')}
    <g>${[['#c9452f', 0], ['#2f6fb5', 1], ['#2f9a5a', 2], ['#d9a52a', 3], ['#8a8f99', 4], ['#c9452f', 5]].map(([c, i]) => `<rect x="${190 + (i % 3) * 40}" y="${74 - Math.floor(i / 3) * 14}" width="38" height="13" fill="${c}"/>`).join('')}</g><rect x="180" y="100" width="140" height="4" fill="#3b4258"/>`,
  bridge: () => `${SKY('#0b1430', '#25305e')}${MOON}${SEA(100)}<g stroke="#e6ebf2" stroke-width="1.2" opacity=".85">${[-1, 1].flatMap(s => [0, 1, 2, 3, 4, 5, 6].map(k => `<path d="M${s < 0 ? 96 : 224} 24L${(s < 0 ? 96 : 224) + s * (14 + k * 13)} 78"/><path d="M${s < 0 ? 96 : 224} 24L${(s < 0 ? 96 : 224) - s * (14 + k * 13)} 78"/>`)).join('')}</g>
    <path d="M0 78h320" stroke="#c9d2de" stroke-width="7"/><path d="M0 78h320" stroke="#ffcf6a" stroke-width="1.4" stroke-dasharray="2 10"/><g fill="#d9e1ec"><path d="M90 16h12v84H90zM218 16h12v84h-12z"/></g><circle cx="96" cy="14" r="2.5" fill="#ff4848"/><circle cx="224" cy="14" r="2.5" fill="#ff4848"/>`,
  city: () => `${SKY('#141030', '#3d1f50')}${MOON}<g fill="#22263a">${[[0, 70, 40], [36, 46, 30], [62, 60, 36], [96, 28, 24], [118, 52, 40], [156, 36, 28], [182, 64, 34], [214, 40, 30], [242, 58, 40], [280, 44, 40]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${140 - y}"/>`).join('')}</g>
    <g fill="#ffcf6a" opacity=".75">${Array.from({ length: 60 }, (_, i) => `<rect x="${(i * 53) % 310 + 4}" y="${60 + (i * 37) % 70}" width="3" height="3"/>`).join('')}</g><circle cx="250" cy="60" r="22" fill="none" stroke="#f2f2ee" stroke-width="2.5" opacity=".8"/><path d="M250 82v58" stroke="#f2f2ee" stroke-width="2.5" opacity=".8"/>`,
  factory: () => `${SKY('#1a1428', '#3b2a3e')}<g fill="#2c3040"><rect x="10" y="80" width="120" height="60"/><rect x="150" y="70" width="70" height="70"/><rect x="236" y="90" width="80" height="50"/></g>
    <g fill="#b2402e">${[40, 70, 180].map(x => `<rect x="${x}" y="20" width="9" height="62"/>`).join('')}</g><g fill="#eee">${[40, 70, 180].map(x => `<rect x="${x}" y="30" width="9" height="6"/><rect x="${x}" y="48" width="9" height="6"/>`).join('')}</g>
    <g fill="#ffb64d">${Array.from({ length: 18 }, (_, i) => `<circle cx="${12 + i * 17}" cy="${84 + (i % 3) * 6}" r="1.6"/>`).join('')}</g><g fill="#9aa0b0" opacity=".35"><circle cx="46" cy="12" r="10"/><circle cx="62" cy="6" r="8"/><circle cx="186" cy="12" r="9"/></g>`,
  airport: () => `${SKY('#0f1a3a', '#2c3e6a')}<rect y="100" width="320" height="40" fill="#20242f"/><path d="M0 120h320" stroke="#f2f2ee" stroke-width="2" stroke-dasharray="18 12"/><g fill="#7fb2ff">${Array.from({ length: 16 }, (_, i) => `<circle cx="${10 + i * 20}" cy="104" r="1.6"/>`).join('')}</g>
    <g transform="translate(150 54) rotate(-12)" fill="#e9eef5"><path d="M-70 0q0-6 10-6h110q18 0 26 6q-8 6-26 6H-60q-10 0-10-6z"/><path d="M-10-4L20-34h12L18-4zM-10 4l30 30h12L18 4zM-62-4l-6-18h8l12 18z"/><circle cx="58" cy="0" r="1.5" fill="#ff4848"/></g>`,
  tower: () => `${SKY('#0d1230', '#2b1d4a')}${MOON}<g fill="#22263a">${[[0, 80, 50], [40, 60, 40], [200, 56, 44], [250, 74, 70]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${140 - y}"/>`).join('')}</g>
    <g stroke="#ff5a2a" stroke-width="3" fill="none"><path d="M160 6L132 140M160 6l28 134M146 70h28M140 98h40M136 120h48"/><path d="M150 40l10 30 10-30" stroke-width="2"/></g><rect x="148" y="62" width="24" height="8" fill="#f2f2ee"/><rect x="142" y="92" width="36" height="8" fill="#f2f2ee"/>`,
  mountain: () => `${SKY('#1d1a3e', '#e07a4a')}<path d="M0 104L70 50l40 26 60-58 70 50 40-20 40 28v64H0z" fill="#1f2a2a"/><path d="M150 32l20-14 18 14-8 6-10-6-10 8z" fill="#f2f2ee" opacity=".85"/>
    <path d="M20 140q60-30 120-26t80-20 100-10" fill="none" stroke="#3d4148" stroke-width="10"/><path d="M20 140q60-30 120-26t80-20 100-10" fill="none" stroke="#f2f2ee" stroke-width="1.2" stroke-dasharray="6 8"/>
    <g fill="#16241e">${[18, 44, 250, 284, 300].map(x => `<path d="M${x} 136l9-30 9 30z"/>`).join('')}</g><circle cx="168" cy="118" r="2.2" fill="#ffe08a"/><circle cx="174" cy="118" r="2.2" fill="#ffe08a"/>`,
  coast: () => `${SKY('#2b3c78', '#f19a5a')}<circle cx="230" cy="96" r="22" fill="#ffd27a"/>${SEA(96)}<path d="M0 90q80-14 160-6t160-4" fill="none" stroke="#3d4148" stroke-width="8"/><path d="M0 90q80-14 160-6t160-4" fill="none" stroke="#f2f2ee" stroke-width="1" stroke-dasharray="6 8"/>
    <g fill="#26303a"><path d="M0 80q30-26 70-20t40 20z"/></g><g stroke="#2b3a2e" stroke-width="2"><path d="M40 82V60M60 84V62"/></g><g fill="#2b3a2e"><circle cx="40" cy="58" r="6"/><circle cx="60" cy="60" r="6"/></g>`,
  sea: () => `${SKY('#0d1738', '#2a3c6c')}${MOON}${SEA(92)}<path d="M60 92h200l-20-22H90z" fill="#e9eef5"/><rect x="120" y="54" width="70" height="16" fill="#cfd8e4"/><rect x="140" y="40" width="30" height="14" fill="#cfd8e4"/>
    <g fill="#ffcf6a">${Array.from({ length: 12 }, (_, i) => `<rect x="${96 + i * 13}" y="78" width="6" height="4"/>`).join('')}</g><path d="M0 92h60M260 92h60" stroke="#c9d2de" stroke-width="5"/>`,
};
const art = id => `<svg class="rart" viewBox="0 0 320 140" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${(ARTS[ART[id]] || ARTS.city)()}</svg>`;

// ── maps ──
const ringPath = (R, P, minD = 0) => { let d = '', lx = 1e9, lz = 1e9; for (let i = 0; i < R.length; i += 2) { const x = R[i], z = R[i + 1]; if (i && Math.hypot(x - lx, z - lz) < minD && i < R.length - 2) continue; lx = x; lz = z; const [a, b] = P(x, z); d += (d ? 'L' : 'M') + a.toFixed(1) + ' ' + b.toFixed(1); } return d + 'Z'; };
const KANTO = { x0: -78000, x1: 42000, z0: -46000, z1: 42000 };
const OSAKA = [-378700, 85200];
function japanMap() {
  // whole country, but the far south-west islands are folded into the frame as on most Japanese maps
  const X0 = -960000, X1 = 1250000, Z0 = -1150000, Z1 = 580000, W = 600, H = W * (Z1 - Z0) / (X1 - X0);
  const P = (x, z) => [(x - X0) / (X1 - X0) * W, (z - Z0) / (Z1 - Z0) * H];
  // Okinawa / Amami (south of z 560 km) go in an inset box top-left at 0.6 scale, as on Japanese maps
  const IN = (x, z) => P(X0 + 30000 + (x + 1420000) * 0.6, Z0 + 40000 + (z - 560000) * 0.6);
  const south = R => { for (let i = 1; i < R.length; i += 2) if (R[i] < 560000) return false; return true; };
  const prefs = JAPAN_PREFS.map(p => p.r.map(R => `<path d="${ringPath(R, south(R) ? IN : P, 6000)}"/>`).join('')).join('');
  const [ix0, iz0] = IN(-1420000, 560000), [ix1, iz1] = IN(-880000, 1245000);
  const [kx0, kz0] = P(KANTO.x0, KANTO.z0), [kx1, kz1] = P(KANTO.x1, KANTO.z1), [ox, oz] = P(...OSAKA);
  const cities = JAPAN_CITIES.filter(c => c[3] > 1400000).map(c => { const [a, b] = P(c[1], c[2]); return `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="2" fill="#aab"/><text x="${(a + 5).toFixed(1)}" y="${(b + 3.5).toFixed(1)}" class="jc">${esc(c[0])}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H.toFixed(0)}" role="img" aria-label="${esc(L3('일본 전체 지도', '日本全図', 'Map of Japan'))}">
    <style>.jc{fill:#9aa1b2;font:600 10px var(--font);paint-order:stroke;stroke:#0a0a0c;stroke-width:3px}</style>
    <rect width="${W}" height="${H.toFixed(0)}" fill="#0b1220"/>
    <g fill="#1f2433" stroke="#3a4157" stroke-width=".6" stroke-linejoin="round">${prefs}</g>
    <rect x="${ix0.toFixed(1)}" y="${iz0.toFixed(1)}" width="${(ix1 - ix0).toFixed(1)}" height="${(iz1 - iz0).toFixed(1)}" fill="none" stroke="#3a4157" stroke-dasharray="4 3"/>
    <text x="${(ix0 + 6).toFixed(1)}" y="${(iz1 - 6).toFixed(1)}" class="jc">${esc(L3('오키나와·아마미', '沖縄・奄美', 'Okinawa & Amami'))}</text>
    ${cities}
    <rect x="${kx0.toFixed(1)}" y="${kz0.toFixed(1)}" width="${(kx1 - kx0).toFixed(1)}" height="${(kz1 - kz0).toFixed(1)}" fill="rgba(255,61,110,.25)" stroke="#ff3d6e" stroke-width="2"/>
    <text x="${(kx1 + 8).toFixed(1)}" y="${(kz0 + 4).toFixed(1)}" class="jc" style="fill:#ff7a8f;font-size:12px">${esc(L3('플레이 가능 — 도쿄만·하코네', 'プレイ可能 — 東京湾・箱根', 'Drivable — Tokyo Bay & Hakone'))}</text>
    <circle cx="${ox.toFixed(1)}" cy="${oz.toFixed(1)}" r="7" fill="none" stroke="#ffc04d" stroke-width="2" stroke-dasharray="3 3"/>
    <text x="${(ox - 10).toFixed(1)}" y="${(oz + 20).toFixed(1)}" class="jc" style="fill:#ffc04d" text-anchor="middle">${esc(L3('오사카 (예정)', '大阪（予定）', 'Osaka (planned)'))}</text>
  </svg>`;
}
function kantoMap() {
  const K = KANTO, W = 600, H = W * (K.z1 - K.z0) / (K.x1 - K.x0);
  const P = (x, z) => [(x - K.x0) / (K.x1 - K.x0) * W, (z - K.z0) / (K.z1 - K.z0) * H];
  const prefs = JAPAN_PREFS.filter(p => /東京|神奈川|千葉|埼玉|静岡|山梨/.test(p.n)).map(p => p.r.map(R => `<path d="${ringPath(R, P, 250)}"/>`).join('')).join('');
  const labels = JAPAN_PREFS.filter(p => /東京|神奈川|千葉|埼玉/.test(p.n)).map(p => { const [a, b] = P(p.c[0], p.c[1]); return a > 0 && a < W && b > 0 && b < H ? `<text x="${a.toFixed(0)}" y="${b.toFixed(0)}" class="kp" text-anchor="middle">${esc(p.n)}</text>` : ''; }).join('');
  const mk = REGIONS.filter(r => POS[r.id]).map((r, i) => { const [x, z] = POS[r.id], [a, b] = P(x, z); const col = r.status === 'live' ? '#33c27a' : r.status === 'partial' ? '#ff9a2e' : '#8796b5';
    return `<g class="mk" data-id="${esc(r.id)}" tabindex="0" role="button" aria-label="${esc(pick(r.name))}"><title>${esc(pick(r.name))}</title><circle class="ring" cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="7" fill="${col}" fill-opacity=".3" stroke="${col}" stroke-width="2"/><circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="2.6" fill="${col}"/></g>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H.toFixed(0)}" role="img" aria-label="${esc(L3('수록 지역 지도', '収録エリアの地図', 'Map of the drivable area'))}">
    <style>.kp{fill:#5b6378;font:700 13px var(--font);letter-spacing:.3em}</style>
    <rect width="${W}" height="${H.toFixed(0)}" fill="#0a1a2e"/>
    <g fill="#1c2130" stroke="#353c52" stroke-width="1" stroke-linejoin="round">${prefs}</g>${labels}
    <text x="${P(14000, 6000)[0].toFixed(0)}" y="${P(14000, 6000)[1].toFixed(0)}" class="kp" style="fill:#2c4d78;font-size:16px">東京湾</text>
    <text x="${P(-48000, 38000)[0].toFixed(0)}" y="${P(-48000, 38000)[1].toFixed(0)}" class="kp" style="fill:#2c4d78">相模湾</text>
    ${mk}
  </svg>`;
}

function list() {
  return REGIONS.map(r => { const p = POS[r.id], spawn = p?.[2];
    return `<article class="card region rcard" id="r-${esc(r.id)}" data-id="${esc(r.id)}">
    ${art(r.id)}
    <div class="rbody">
      <div class="rtop"><h3>${esc(pick(r.name))}</h3><span class="status ${esc(r.status)}"><i class="dot ${esc(r.status)}"></i>${esc(t('site.status.' + r.status))}</span></div>
      <div class="pref" lang="ja">${esc(r.pref || '')}</div>
      <p>${esc(r.status === 'planned' && (pick(r.desc) || '').length < 16 ? t('site.status.plannedDesc') : pick(r.desc))}</p>
      ${spawn && r.status !== 'planned' ? `<a class="btn btn-play rgo" href="play.html?spawn=${encodeURIComponent(spawn)}"><span>▶ ${esc(L3('여기서 달리기', 'ここから走る', 'Drive here'))}</span></a>` : ''}
    </div>
  </article>`; }).join('');
}

function hl(id, on) { document.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach(el => el.classList.toggle('hl', on)); }

function render() {
  const host = document.getElementById('bay-map');
  host.innerHTML = `<div class="jmap">${japanMap()}</div><div class="kmap-h">${esc(L3('도쿄만 · 하코네 (확대)', '東京湾・箱根（拡大）', 'Tokyo Bay & Hakone (close-up)'))}</div><div class="kmap">${kantoMap()}</div>`;
  document.getElementById('region-list').innerHTML = list();
  document.querySelectorAll('.mk').forEach(m => {
    const go = () => { const el = document.getElementById('r-' + m.dataset.id); el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); hl(m.dataset.id, true); setTimeout(() => hl(m.dataset.id, false), 1600); };
    m.addEventListener('click', go);
    m.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    m.addEventListener('mouseenter', () => hl(m.dataset.id, true));
    m.addEventListener('mouseleave', () => hl(m.dataset.id, false));
  });
  document.querySelectorAll('.region').forEach(r => { r.addEventListener('mouseenter', () => hl(r.dataset.id, true)); r.addEventListener('mouseleave', () => hl(r.dataset.id, false)); });
  void getLang;
}

await initSite('regions');
onLang(render);
