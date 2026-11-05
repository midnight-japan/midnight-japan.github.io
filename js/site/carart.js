// Procedural side-profile placeholder art for cars (used until docs/cars/<id>.png renders exist), and JP plate badges.
import { esc } from './common.js';

function shade(hex, f) { // f<0 darken, f>0 lighten
  let c = (hex || '#888').replace('#', '');
  if (c.length === 3) c = [...c].map(x => x + x).join('');
  const n = parseInt(c, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

let uid = 0;
/** Side silhouette SVG built from the car's real L/H/wb, tinted with colors[0]. */
export function carSilhouette(car, { color } = {}) {
  const id = 'cs' + (uid++);
  const col = color || car.colors?.[0] || '#7b7f86';
  const L = car.L, H = car.H, wb = car.wb;
  const heavy = L > 8000, boxy = !heavy && H / L > 0.36, low = H < 1330;
  const r = heavy ? 520 : Math.min(345, Math.max(285, H * 0.22));
  const fo = (L - wb) * (heavy ? 0.42 : 0.52); // front overhang (car faces right)
  const xf = L - fo, xr = xf - wb;
  const clr = heavy ? 260 : 140;
  const belt = heavy ? H * 0.42 : boxy ? H * 0.5 : H * (low ? 0.6 : 0.56);
  let pts;
  if (heavy) {
    pts = [[0, clr + 100], [0, H], [L - 2300, H], [L - 2250, belt + 900], [L - 60, belt + 700], [L, belt], [L, clr + 120]];
  } else if (boxy) {
    pts = [[0, clr + 60], [10, belt], [40, H - 40], [120, H], [L * 0.8, H], [L * 0.9, belt + 150], [L - 30, belt - 20], [L, clr + 120]];
  } else {
    const rf = low ? 0.62 : 0.6;
    pts = [[0, clr + 90], [20, belt - 10], [L * 0.12, belt + 20], [L * 0.3, H], [L * rf, H], [L * 0.77, belt + 30], [L - 40, belt - 70], [L, clr + 160]];
  }
  const vx = v => v.toFixed(0);
  const y = v => H + 200 - v; // flip, ground at H+200
  const body = 'M' + pts.map(([a, b]) => `${vx(a)} ${vx(y(b))}`).join(' L') + ` L${vx(L - 20)} ${vx(y(clr))} L20 ${vx(y(clr))}Z`;
  // greenhouse (windows)
  let win = '';
  if (heavy) win = `M${vx(L - 2150)} ${vx(y(H - 150))}L${vx(L - 250)} ${vx(y(belt + 820))}L${vx(L - 250)} ${vx(y(belt + 120))}L${vx(L - 2150)} ${vx(y(belt + 120))}Z`;
  else {
    const [a, b, c, d] = boxy ? [[150, H - 70], [L * 0.79, H - 60], [L * 0.88, belt + 140], [130, belt + 30]]
      : [[L * 0.14, belt + 40], [L * 0.31, H - 55], [L * (low ? 0.6 : 0.585), H - 55], [L * 0.745, belt + 40]];
    win = boxy ? `M${vx(a[0])} ${vx(y(a[1]))}L${vx(b[0])} ${vx(y(b[1]))}L${vx(c[0])} ${vx(y(c[1]))}L${vx(d[0])} ${vx(y(d[1]))}Z`
      : `M${vx(a[0])} ${vx(y(a[1]))}L${vx(b[0])} ${vx(y(b[1]))}L${vx(c[0])} ${vx(y(c[1]))}L${vx(d[0])} ${vx(y(d[1]))}Z`;
  }
  const wheel = x => `<circle cx="${vx(x)}" cy="${vx(y(r))}" r="${vx(r + 40)}" fill="#05080f"/><circle cx="${vx(x)}" cy="${vx(y(r))}" r="${vx(r)}" fill="#151a24" stroke="#2a3140" stroke-width="${vx(r * .12)}"/><circle cx="${vx(x)}" cy="${vx(y(r))}" r="${vx(r * .55)}" fill="url(#${id}rim)"/>`;
  const wheels = heavy ? wheel(xr) + wheel(xr + 1400) + wheel(xf) : wheel(xr) + wheel(xf);
  const pad = Math.max(L * 0.08, 380), w = L + pad * 2, hgt = w * 9 / 16;
  const ox = -pad, oy = (H + 200) - hgt * 0.8;
  const lamp = heavy ? '' : `<rect x="${vx(L - 160)}" y="${vx(y(belt - 120))}" width="150" height="70" rx="30" fill="#fff4d6" opacity=".9"/><rect x="0" y="${vx(y(belt - 100))}" width="90" height="70" rx="20" fill="#ff3a3a" opacity=".85"/>`;
  const plateY = y(clr + 330);
  return `<svg class="sil" viewBox="${vx(ox)} ${vx(oy)} ${vx(w)} ${vx(hgt)}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1730"/><stop offset=".78" stop-color="${shade(col, -.72)}"/><stop offset="1" stop-color="#05070d"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(col, .28)}"/><stop offset=".45" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -.55)}"/></linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb6d9" stop-opacity=".55"/><stop offset=".5" stop-color="#1b2740"/><stop offset="1" stop-color="#0b1222"/></linearGradient>
    <radialGradient id="${id}rim"><stop offset="0" stop-color="#c9ced8"/><stop offset=".7" stop-color="#6b7383"/><stop offset="1" stop-color="#2a3140"/></radialGradient>
    <radialGradient id="${id}glow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#ff9a2e" stop-opacity=".25"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="${vx(ox)}" y="${vx(oy)}" width="${vx(w)}" height="${vx(hgt)}" fill="url(#${id}sky)"/>
  <rect x="${vx(ox)}" y="${vx(oy)}" width="${vx(w)}" height="${vx(hgt)}" fill="url(#${id}glow)"/>
  <rect x="${vx(ox)}" y="${vx(H + 200)}" width="${vx(w)}" height="${vx(hgt)}" fill="#05070d"/>
  <line x1="${vx(ox)}" y1="${vx(H + 200)}" x2="${vx(ox + w)}" y2="${vx(H + 200)}" stroke="#ff9a2e" stroke-opacity=".35" stroke-width="${vx(w / 400)}"/>
  <ellipse cx="${vx(L / 2)}" cy="${vx(H + 200)}" rx="${vx(L * .55)}" ry="${vx(r * .35)}" fill="#000" opacity=".7"/>
  <path d="${body}" fill="url(#${id}b)" stroke="${shade(col, -.6)}" stroke-width="${vx(L / 300)}" stroke-linejoin="round"/>
  <path d="${win}" fill="url(#${id}g)" stroke="#0a0f1a" stroke-width="${vx(L / 260)}" stroke-linejoin="round"/>
  <path d="M${vx(L * .05)} ${vx(y(belt - 30))}H${vx(L * .95)}" stroke="#fff" stroke-opacity=".18" stroke-width="${vx(L / 400)}"/>
  ${lamp}
  ${heavy ? '' : `<rect x="${vx(L - 60)}" y="${vx(plateY)}" width="60" height="140" fill="#f2f2ee" opacity=".7"/>`}
  ${wheels}
</svg>`;
}

/** Card/hero image: real render if present, else the silhouette. */
export function carImage(car, opts) {
  return `${carSilhouette(car, opts)}<img src="docs/cars/${esc(car.id)}.jpg" alt="" loading="lazy" decoding="async" onerror="this.remove()">`;
}

const KANA = { private: 'さ', commercial: 'あ', kei: 'え', keiCommercial: 'け', police: 'さ' };
function hash(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function classNo(car) {
  if (car.plate === 'kei') return 580;
  if (car.plate === 'keiCommercial') return 480;
  if (car.plate === 'commercial') return car.id === 'bus' ? 200 : car.id === 'truck' ? 100 : car.id === 'taxi' ? 500 : 400;
  return (car.W > 1700 || car.engine.disp > 2000) ? 300 + (hash(car.id) % 9) * 10 + 1 : 500 + (hash(car.id) % 9) * 10 + 1;
}
/** Japanese plate badge (fictional numbers). */
export function plateBadge(car, large = false) {
  const h = hash(car.chassis + car.id) % 10000;
  const n = String(h).padStart(4, '0');
  const numStr = n[0] === '0' ? `・${n.slice(1, 2)}-${n.slice(2)}` : `${n.slice(0, 2)}-${n.slice(2)}`;
  return `<span class="plate ${esc(car.plate)}${large ? ' lg' : ''}" aria-hidden="true"><span class="p1">横浜 ${classNo(car)}</span><span class="p2"><small>${KANA[car.plate] || 'さ'}</small>${numStr}</span></span>`;
}
