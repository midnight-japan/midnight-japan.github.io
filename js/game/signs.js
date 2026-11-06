// Japanese road / expressway / PA signage for Daikoku PA & Daikoku JCT (首都高速道路, 横浜市鶴見区).
// Everything is drawn procedurally on <canvas>; no image files.
// Drawing is done in millimetres of the real sign (ctx is pre-scaled), so layouts follow real dimensions.
import * as THREE from 'three';

const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo","Noto Sans JP","Noto Sans CJK JP",sans-serif';
const EN = '"Helvetica Neue",Helvetica,Arial,' + JP;

const COL = {
  green: '#00703c',      // 案内標識 (高速道路) green
  guideBlue: '#0b55a8',  // 案内標識 (一般道) blue
  regBlue: '#1561b4',    // 規制標識 blue
  regRed: '#d9171c',     // 規制標識 red
  speedBlue: '#0a4aa6',
  etc: '#7d2d91',        // ETC lane purple
  white: '#ffffff',
  black: '#141414',
  yellow: '#ffcf00',
};

// ───────────────────────── helpers ─────────────────────────
function rr(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
function fillRR(g, x, y, w, h, r, c) { g.fillStyle = c; rr(g, x, y, w, h, r); g.fill(); }
function strokeRR(g, x, y, w, h, r, c, lw) { g.strokeStyle = c; g.lineWidth = lw; rr(g, x, y, w, h, r); g.stroke(); }
function fillCircle(g, x, y, r, c) { g.fillStyle = c; circle(g, x, y, r); g.fill(); }
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }

/** Text with horizontal condensing when it would exceed maxW (as real sign makers do). Returns drawn width. */
function text(g, s, x, y, size, o = {}) {
  const { color = '#fff', family = JP, weight = 700, align = 'center', base = 'middle', maxW = Infinity, sx = 1, ls = 0, stroke = null, strokeW = 0 } = o;
  g.save();
  g.font = `${weight} ${size}px ${family}`;
  g.letterSpacing = ls ? `${ls}px` : '0px';
  g.textAlign = align; g.textBaseline = base;
  let w = g.measureText(s).width;
  if (ls) w -= ls; // trailing spacing
  let k = sx;
  if (w * k > maxW) k = maxW / w;
  g.translate(x + (ls && align === 'center' ? ls / 2 : 0), y);
  g.scale(k, 1);
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = strokeW / k; g.lineJoin = 'round'; g.strokeText(s, 0, 0); }
  g.fillStyle = color; g.fillText(s, 0, 0);
  g.restore();
  return w * k;
}
function measure(g, s, size, family = JP, weight = 700) {
  g.save(); g.font = `${weight} ${size}px ${family}`; g.letterSpacing = '0px';
  const w = g.measureText(s).width; g.restore(); return w;
}

/** Arrow: thick polyline whose last point is the tip. */
function arrow(g, pts, t, hl, hw, color) {
  const n = pts.length;
  const [ax, ay] = pts[n - 2], [bx, by] = pts[n - 1];
  const L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L;
  const baseX = bx - ux * hl, baseY = by - uy * hl;
  g.save();
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = t; g.lineJoin = 'miter'; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n - 1; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.lineTo(baseX + ux * 2, baseY + uy * 2); g.stroke();
  g.beginPath(); g.moveTo(bx, by);
  g.lineTo(baseX - uy * hw / 2, baseY + ux * hw / 2);
  g.lineTo(baseX + uy * hw / 2, baseY - ux * hw / 2);
  g.closePath(); g.fill();
  g.restore();
}
/** Standard guide-sign arrow inside a box. type: up|down|left|right|exit|exit_left|upright */
function guideArrow(g, type, x, y, w, h, color = '#fff', scale = 1) {
  const t = Math.min(w, h) * 0.16 * scale, hl = t * 2.0, hw = t * 2.8;
  const cx = x + w / 2, cy = y + h / 2;
  if (type === 'up') arrow(g, [[cx, y + h], [cx, y]], t, hl, hw, color);
  else if (type === 'down') arrow(g, [[cx, y], [cx, y + h]], t, hl, hw, color);
  else if (type === 'right') arrow(g, [[x, cy], [x + w, cy]], t, hl, hw, color);
  else if (type === 'left') arrow(g, [[x + w, cy], [x, cy]], t, hl, hw, color);
  else if (type === 'upright') arrow(g, [[x + w * 0.15, y + h * 0.85], [x + w * 0.9, y + h * 0.1]], t, hl, hw, color);
  else if (type === 'exit' || type === 'exit_left') {
    // stem from the bottom, bending 45° off toward the exit side
    const sgn = type === 'exit' ? 1 : -1;
    const sx = type === 'exit' ? x + w * 0.28 : x + w * 0.72;
    const y1 = y + h * 0.5;
    const d = Math.min(w * 0.6, (y1 - y) * 0.95);
    arrow(g, [[sx, y + h], [sx, y1], [sx + sgn * d, y1 - d]], t, hl, hw, color);
  }
  else if (type === 'diverge') {
    const sx = x + w * 0.3;
    arrow(g, [[sx, y + h], [sx, y]], t, hl, hw, color);
    const y1 = y + h * 0.62, d = Math.min(w * 0.55, h * 0.45);
    arrow(g, [[sx, y1 + t * 0.3], [sx + d, y1 - d]], t * 0.9, hl * 0.9, hw * 0.9, color);
  }
}

// deterministic RNG
function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// ───────────────────────── LED dot-matrix ─────────────────────────
/** Renders mask() into a cols×rows grid, then draws round LED dots. Lit dots take the mask pixel's colour. */
function ledMatrix(g, x, y, w, h, cols, rows, mask, o = {}) {
  const { off = 'rgba(70,70,70,0.55)', dot = 0.36, threshold = 110, glow = true } = o;
  const m = document.createElement('canvas'); m.width = cols; m.height = rows;
  const mc = m.getContext('2d', { willReadFrequently: true });
  mask(mc, cols, rows);
  const d = mc.getImageData(0, 0, cols, rows).data;
  const px = w / cols, py = h / rows, r = Math.min(px, py) * dot;
  g.save();
  g.fillStyle = off;
  g.beginPath();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (d[(j * cols + i) * 4 + 3] > threshold) continue;
    const cx = x + (i + 0.5) * px, cy = y + (j + 0.5) * py;
    g.moveTo(cx + r * 0.8, cy); g.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  }
  g.fill();
  const lit = new Map();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = (j * cols + i) * 4; const a = d[k + 3];
    if (a <= threshold) continue;
    const key = `${d[k] & 0xf0 | 0x08},${d[k + 1] & 0xf0 | 0x08},${d[k + 2] & 0xf0 | 0x08}`; // getImageData is un-premultiplied
    if (!lit.has(key)) lit.set(key, []);
    lit.get(key).push(x + (i + 0.5) * px, y + (j + 0.5) * py);
  }
  for (const [rgb, pts] of lit) {
    if (glow) {
      g.fillStyle = `rgba(${rgb},0.22)`; g.beginPath();
      for (let n = 0; n < pts.length; n += 2) { g.moveTo(pts[n] + r * 1.7, pts[n + 1]); g.arc(pts[n], pts[n + 1], r * 1.7, 0, Math.PI * 2); }
      g.fill();
    }
    g.fillStyle = `rgb(${rgb})`; g.beginPath();
    for (let n = 0; n < pts.length; n += 2) { g.moveTo(pts[n] + r, pts[n + 1]); g.arc(pts[n], pts[n + 1], r, 0, Math.PI * 2); }
    g.fill();
    const [R, G, B] = rgb.split(',').map(Number);
    g.fillStyle = `rgba(${Math.min(255, R + 120)},${Math.min(255, G + 120)},${Math.min(255, B + 120)},0.85)`; g.beginPath();
    for (let n = 0; n < pts.length; n += 2) { g.moveTo(pts[n] + r * 0.4, pts[n + 1]); g.arc(pts[n], pts[n + 1], r * 0.4, 0, Math.PI * 2); }
    g.fill();
  }
  g.restore();
}

// ───────────────────────── pictograms (0..100 box) ─────────────────────────
function picto(g0, name, x, y, size, color = '#000') {
  const tr = g0.getTransform();
  const px = Math.max(8, Math.ceil(size * Math.hypot(tr.a, tr.b)));
  const oc = document.createElement('canvas'); oc.width = oc.height = px;
  const g = oc.getContext('2d');
  g.save(); g.scale(px / 100, px / 100);
  g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
  const line = (pts, lw) => { g.lineWidth = lw; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke(); };
  switch (name) {
    case 'man':
      fillCircle(g, 50, 13, 9.5, color);
      rr(g, 35, 26, 30, 36, 7); g.fill();
      line([[33, 31], [28, 58]], 8); line([[67, 31], [72, 58]], 8);
      rr(g, 37, 55, 11.5, 40, 4); g.fill(); rr(g, 51.5, 55, 11.5, 40, 4); g.fill();
      break;
    case 'woman':
      fillCircle(g, 50, 13, 9.5, color);
      g.beginPath(); g.moveTo(41, 26); g.lineTo(59, 26); g.quadraticCurveTo(63, 26, 64, 32); g.lineTo(73, 70); g.lineTo(27, 70); g.lineTo(36, 32); g.quadraticCurveTo(37, 26, 41, 26); g.fill();
      line([[36, 31], [28, 56]], 7.5); line([[64, 31], [72, 56]], 7.5);
      rr(g, 39, 66, 9, 29, 3.5); g.fill(); rr(g, 52, 66, 9, 29, 3.5); g.fill();
      break;
    case 'wheelchair': // International Symbol of Access
      fillCircle(g, 40, 12, 9, color);
      line([[38, 27], [38, 56], [63, 56], [74, 82], [83, 79]], 10);
      line([[38, 39], [58, 39]], 9);
      g.lineWidth = 8; g.beginPath(); g.arc(42, 66, 24, -0.25 * Math.PI, 1.25 * Math.PI, false); g.stroke();
      break;
    case 'baby': // parent with baby (多目的)
      fillCircle(g, 46, 13, 9, color);
      rr(g, 33, 26, 26, 34, 6); g.fill();
      rr(g, 35, 56, 10, 38, 4); g.fill(); rr(g, 48, 56, 10, 38, 4); g.fill();
      fillCircle(g, 68, 38, 6.5, color); rr(g, 60, 44, 15, 12, 5); g.fill();
      line([[58, 34], [70, 50]], 6);
      break;
    case 'walker': // walking left
      fillCircle(g, 55, 11, 9.5, color);
      line([[53, 26], [48, 52]], 12);
      line([[48, 52], [37, 70], [30, 90]], 11);
      line([[48, 52], [57, 71], [66, 89]], 11);
      line([[52, 30], [40, 43], [35, 54]], 8.5);
      line([[53, 30], [62, 43], [68, 50]], 8.5);
      break;
    case 'fork_knife':
      // fork
      rr(g, 29, 8, 4.5, 26, 2); g.fill(); rr(g, 36, 8, 4.5, 26, 2); g.fill(); rr(g, 43, 8, 4.5, 26, 2); g.fill();
      g.beginPath(); g.moveTo(28, 30); g.lineTo(49, 30); g.quadraticCurveTo(49, 44, 42, 46); g.lineTo(35, 46); g.quadraticCurveTo(28, 44, 28, 30); g.fill();
      rr(g, 34.5, 42, 8, 50, 4); g.fill();
      // knife
      g.beginPath(); g.moveTo(62, 8); g.quadraticCurveTo(76, 18, 74, 52); g.lineTo(62, 52); g.closePath(); g.fill();
      rr(g, 62, 48, 9, 44, 4); g.fill();
      break;
    case 'cup':
      g.beginPath(); g.moveTo(20, 42); g.lineTo(72, 42); g.lineTo(66, 88); g.quadraticCurveTo(65, 93, 60, 93); g.lineTo(32, 93); g.quadraticCurveTo(27, 93, 26, 88); g.closePath(); g.fill();
      g.lineWidth = 7; g.beginPath(); g.arc(74, 60, 11, -Math.PI / 2, Math.PI / 2); g.stroke();
      line([[34, 34], [30, 26], [36, 18], [32, 8]], 5); line([[50, 34], [46, 26], [52, 18], [48, 8]], 5);
      break;
    case 'cart':
      line([[6, 18], [20, 18], [32, 66], [80, 66]], 7);
      g.beginPath(); g.moveTo(22, 28); g.lineTo(90, 28); g.lineTo(82, 58); g.lineTo(29, 58); g.closePath(); g.fill();
      fillCircle(g, 38, 80, 8, color); fillCircle(g, 74, 80, 8, color);
      break;
    case 'bottle':
      g.beginPath(); g.moveTo(44, 6); g.lineTo(56, 6); g.lineTo(56, 18); g.quadraticCurveTo(68, 26, 68, 40); g.lineTo(68, 88); g.quadraticCurveTo(68, 94, 62, 94); g.lineTo(38, 94); g.quadraticCurveTo(32, 94, 32, 88); g.lineTo(32, 40); g.quadraticCurveTo(32, 26, 44, 18); g.closePath(); g.fill();
      break;
    case 'vending': {
      g.lineWidth = 6; rr(g, 18, 4, 64, 92, 4); g.stroke();
      rr(g, 25, 11, 50, 34, 2); g.fill();
      g.save(); g.fillStyle = '#fff'; g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 4; i++) { rr(g, 29 + i * 11.5, 15, 7, 12, 2); g.fill(); rr(g, 29 + i * 11.5, 30, 7, 12, 2); g.fill(); }
      g.restore();
      rr(g, 25, 52, 30, 26, 2); g.fill(); rr(g, 62, 52, 6, 14, 1); g.fill();
      rr(g, 25, 84, 50, 7, 2); g.fill();
      break; }
    case 'cigarette':
      rr(g, 8, 62, 60, 13, 2); g.fill();
      rr(g, 70, 62, 22, 13, 2); g.fill();
      line([[20, 52], [14, 42], [22, 32], [16, 20], [22, 8]], 5.5);
      line([[33, 52], [27, 42], [35, 32], [29, 20], [35, 8]], 5.5);
      break;
    case 'info':
      g.font = `900 92px ${EN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 50, 54);
      break;
    case 'i':
      fillCircle(g, 50, 16, 10, color); rr(g, 41, 34, 18, 58, 3); g.fill(); rr(g, 33, 34, 18, 9, 2); g.fill(); rr(g, 33, 84, 34, 9, 2); g.fill();
      break;
    case 'terminal':
      g.lineWidth = 7; rr(g, 8, 10, 84, 58, 5); g.stroke();
      rr(g, 44, 68, 12, 14, 0); g.fill(); rr(g, 28, 82, 44, 8, 3); g.fill();
      fillCircle(g, 50, 24, 5.5, color); rr(g, 45.5, 33, 9, 26, 2); g.fill();
      break;
    case 'ev':
      // plug with cable + bolt
      rr(g, 22, 30, 38, 34, 8); g.fill();
      rr(g, 28, 12, 7, 20, 2); g.fill(); rr(g, 47, 12, 7, 20, 2); g.fill();
      line([[41, 64], [41, 78], [58, 90], [86, 90]], 7);
      g.beginPath(); poly(g, [[80, 8], [62, 40], [74, 40], [66, 66], [90, 30], [77, 30], [86, 8]]); g.fill();
      break;
    case 'phone': // handset (receiver) lying over a desk telephone body
      g.save(); g.translate(50, 30);
      g.beginPath(); g.moveTo(-44, 6); g.quadraticCurveTo(-44, -14, -20, -16); g.lineTo(20, -16); g.quadraticCurveTo(44, -14, 44, 6);
      g.lineTo(44, 12); g.lineTo(26, 14); g.lineTo(22, 0); g.lineTo(-22, 0); g.lineTo(-26, 14); g.lineTo(-44, 12); g.closePath(); g.fill();
      g.restore();
      g.beginPath(); g.moveTo(30, 48); g.lineTo(70, 48); g.lineTo(88, 90); g.quadraticCurveTo(88, 94, 84, 94); g.lineTo(16, 94); g.quadraticCurveTo(12, 94, 12, 90); g.closePath(); g.fill();
      g.save(); g.globalCompositeOperation = 'destination-out';
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { circle(g, 38 + i * 12 + (j - 1) * 2, 60 + j * 10, 3.6); g.fill(); }
      g.restore();
      rr(g, 34, 36, 8, 14, 2); g.fill(); rr(g, 58, 36, 8, 14, 2); g.fill();
      break;
    case 'car':
      g.beginPath(); g.moveTo(6, 64); g.lineTo(8, 50); g.quadraticCurveTo(10, 44, 18, 43); g.lineTo(28, 42); g.lineTo(38, 28); g.quadraticCurveTo(41, 25, 46, 25); g.lineTo(70, 25); g.quadraticCurveTo(75, 25, 78, 29); g.lineTo(86, 42); g.quadraticCurveTo(94, 44, 94, 52); g.lineTo(94, 64); g.closePath(); g.fill();
      g.save(); g.globalCompositeOperation = 'destination-out';
      poly(g, [[34, 42], [43, 30], [57, 30], [57, 42]]); g.fill(); poly(g, [[61, 42], [61, 30], [72, 30], [80, 42]]); g.fill();
      g.restore();
      g.save(); g.globalCompositeOperation = 'destination-out'; circle(g, 27, 65, 11.5); g.fill(); circle(g, 75, 65, 11.5); g.fill(); g.restore();
      fillCircle(g, 27, 65, 8.5, color); fillCircle(g, 75, 65, 8.5, color);
      break;
    case 'truck':
      rr(g, 4, 20, 62, 44, 2); g.fill();
      g.beginPath(); g.moveTo(68, 34); g.lineTo(84, 34); g.lineTo(95, 48); g.lineTo(95, 64); g.lineTo(68, 64); g.closePath(); g.fill();
      g.save(); g.globalCompositeOperation = 'destination-out'; poly(g, [[73, 38], [83, 38], [90, 48], [73, 48]]); g.fill();
      circle(g, 20, 66, 11); g.fill(); circle(g, 50, 66, 11); g.fill(); circle(g, 82, 66, 11); g.fill(); g.restore();
      fillCircle(g, 20, 66, 8, color); fillCircle(g, 50, 66, 8, color); fillCircle(g, 82, 66, 8, color);
      break;
    case 'camera':
      g.save(); g.translate(46, 40); g.rotate(0.35);
      rr(g, -34, -14, 58, 28, 4); g.fill(); poly(g, [[24, -10], [36, -16], [36, 16], [24, 10]]); g.fill();
      g.restore();
      line([[26, 50], [26, 72], [12, 72]], 7); rr(g, 6, 60, 8, 30, 2); g.fill();
      break;
    case 'P':
      g.font = `700 98px ${EN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 52, 55);
      break;
  }
  g.restore();
  g0.drawImage(oc, x, y, size, size);
}

// ───────────────────────── common sign bases ─────────────────────────
function guideBase(g, W, H, bg = COL.green, o = {}) {
  const { r = 90, inset = 30, bw = 26 } = o;
  fillRR(g, 0, 0, W, H, r, bg);
  strokeRR(g, inset + bw / 2, inset + bw / 2, W - 2 * inset - bw, H - 2 * inset - bw, r - inset, '#fff', bw);
}
const ROUTES = {
  B: { ja: '湾岸線', en: 'Bayshore Rte.' },
  K1: { ja: '横羽線', en: 'Yokohane Rte.' },
  K2: { ja: '三ツ沢線', en: 'Mitsuzawa Rte.' },
  K3: { ja: '狩場線', en: 'Kariba Rte.' },
  K5: { ja: '大黒線', en: 'Daikoku Rte.' },
  K6: { ja: '川崎線', en: 'Kawasaki Rte.' },
  K7: { ja: '横浜北線', en: 'Yokohama-kita Rte.' },
  C1: { ja: '都心環状線', en: 'Inner Circular Rte.' },
};
/** Shuto Expressway route-number badge: white hexagon (pointed ends), route code in green. */
function routeBadge(g, cx, cy, h, route, o = {}) {
  const { fg = COL.green, bg = '#fff', edge = null } = o;
  const w = h * (route.length > 1 ? 1.55 : 1.25);
  const p = h * 0.3;
  const pts = [[cx - w / 2 + p, cy - h / 2], [cx + w / 2 - p, cy - h / 2], [cx + w / 2, cy], [cx + w / 2 - p, cy + h / 2], [cx - w / 2 + p, cy + h / 2], [cx - w / 2, cy]];
  g.save();
  g.lineJoin = 'round';
  poly(g, pts); g.fillStyle = bg; g.fill();
  g.lineWidth = h * 0.08; g.strokeStyle = bg; g.stroke();
  if (edge) { g.lineWidth = h * 0.045; g.strokeStyle = edge; poly(g, pts.map(([x, y]) => [cx + (x - cx) * 0.86, cy + (y - cy) * 0.8])); g.stroke(); }
  g.restore();
  text(g, route, cx, cy + h * 0.04, h * 0.74, { color: fg, family: EN, weight: 800, maxW: w * 0.68, sx: 0.92 });
  return w;
}

// ───────────────────────── SPECS ─────────────────────────
// Each spec: (opts) => { w, h (m), shape, r (corner m), mount, top?, bottom?, emissive?, depth?, draw(g, W, H) }
const S = {};

S.shuto_guide = o => {
  const lines = o.lines ?? [{ ja: '東京・羽田空港', en: 'Tokyo / Haneda Airport' }];
  const route = o.route === undefined ? 'B' : o.route;
  const rn = route ? (o.routeName ?? ROUTES[route] ?? { ja: '', en: '' }) : null;
  const arrowT = o.arrow ?? 'up';
  const W = (o.width ?? 4.8) * 1000;
  const pad = 170, hh = rn ? 650 : 0, lh = 640, aw = arrowT && arrowT !== 'none' ? 950 : 0;
  const H = pad * 2 + hh + lines.length * lh;
  return {
    w: W / 1000, h: H / 1000, shape: 'rect', r: 0.09, mount: 'twin', bottom: 2.2,
    draw(g) {
      guideBase(g, W, H);
      const left = arrowT === 'left';
      const x0 = pad + 40 + (left ? aw : 0), tw = W - 2 * pad - 80 - aw;
      let y = pad;
      let distW = 0;
      if (o.dist) {
        const m = /^([\d.,]+)\s*(.*)$/.exec(o.dist) || [0, o.dist, ''];
        const xr = x0 + tw;
        const yy = pad + (rn ? hh * 0.5 : lh * 0.4);
        const w2 = measure(g, m[2], 190, EN);
        text(g, m[2], xr, yy + 50, 190, { family: EN, align: 'right', base: 'alphabetic' });
        const w1 = text(g, m[1], xr - w2 - 20, yy + 50, 330, { family: EN, align: 'right', base: 'alphabetic', weight: 700 });
        distW = w1 + w2 + 80;
      }
      if (rn) {
        const bh = 400;
        const bw = routeBadge(g, x0 + (route.length > 1 ? 310 : 250), y + hh / 2 - 10, bh, route);
        const tx = x0 + (route.length > 1 ? 310 : 250) + bw / 2 + 70;
        text(g, rn.ja, tx, y + hh * 0.38, 330, { align: 'left', maxW: tw - (tx - x0) - distW });
        text(g, rn.en, tx, y + hh * 0.8, 140, { align: 'left', family: EN, weight: 600, maxW: tw - (tx - x0) - distW });
        y += hh;
      }
      lines.forEach((l, i) => {
        const mw = tw - (!rn && i === 0 ? distW : 0);
        text(g, l.ja, x0, y + lh * 0.4, 370, { align: 'left', maxW: mw });
        if (l.en) text(g, l.en, x0, y + lh * 0.83, 150, { align: 'left', family: EN, weight: 600, maxW: mw });
        y += lh;
      });
      if (aw) {
        const ax = left ? pad + 60 : W - pad - aw + 20, ay = pad + 60, ah = H - 2 * pad - 120;
        const s = Math.min(aw - 120, ah);
        if (arrowT === 'left' || arrowT === 'right') guideArrow(g, arrowT, ax + 40, ay + ah / 2 - s / 2, aw - 140, s);
        else guideArrow(g, arrowT, ax + (aw - 120 - s * 0.8) / 2, ay + (ah - s) / 2, s * 0.8, s);
      }
    },
  };
};

S.jct_sign = o => {
  const W = (o.width ?? 3.6) * 1000, H = 1900;
  const routes = o.routes ?? ['B', 'K5'];
  const arrowT = o.arrow ?? 'up';
  return {
    w: W / 1000, h: H / 1000, shape: 'rect', r: 0.09, mount: 'twin', bottom: 2.2,
    draw(g) {
      guideBase(g, W, H);
      const aw = arrowT && arrowT !== 'none' ? 800 : 0;
      const x0 = 220, tw = W - 440 - aw;
      let bx = x0;
      routes.forEach(rt => { const bw = routeBadge(g, bx + (rt.length > 1 ? 310 : 250), 430, 400, rt); bx += bw + 80; });
      if (o.dist) text(g, o.dist, x0 + tw, 470, 280, { family: EN, align: 'right' });
      const jw = measure(g, o.name ?? '大黒', 520);
      const jx = x0;
      text(g, o.name ?? '大黒', jx, 1060, 520, { align: 'left', maxW: tw * 0.6 });
      text(g, 'JCT', jx + Math.min(jw, tw * 0.6) + 40, 1110, 400, { align: 'left', family: EN, weight: 700, base: 'middle' });
      text(g, o.en ?? 'Daikoku Jct.', x0, 1520, 200, { align: 'left', family: EN, weight: 600, maxW: tw });
      if (aw) guideArrow(g, arrowT, W - 220 - aw + 80, 330, aw - 160, H - 660);
    },
  };
};

S.exit_sign = o => {
  const W = (o.width ?? 4.0) * 1000, H = 2000;
  const arrowT = o.arrow ?? 'exit';
  return {
    w: W / 1000, h: H / 1000, shape: 'rect', r: 0.09, mount: 'twin', bottom: 2.2,
    draw(g) {
      guideBase(g, W, H);
      // 出口 / EXIT plate (reverse colours)
      fillRR(g, 200, 200, 1000, 600, 40, '#fff');
      text(g, '出口', 700, 400, 300, { color: COL.green, ls: 60 });
      text(g, 'EXIT', 700, 680, 140, { color: COL.green, family: EN, weight: 700, ls: 20 });
      if (o.dist) text(g, o.dist, 1330, 520, 300, { family: EN, align: 'left' });
      const aw = 900, tw = W - 400 - aw;
      text(g, o.ja ?? '大黒ふ頭', 230, 1200, 470, { align: 'left', maxW: tw });
      text(g, o.en ?? 'Daikoku-futo', 240, 1640, 190, { align: 'left', family: EN, weight: 600, maxW: tw });
      guideArrow(g, arrowT, W - 200 - aw + 60, 300, aw - 120, H - 600);
    },
  };
};

S.pa_sign = o => {
  const W = (o.width ?? 3.8) * 1000, H = 1950;
  const arrowT = o.arrow === undefined ? 'exit' : o.arrow;
  const dist = o.dist === undefined ? '500m' : o.dist;
  return {
    w: W / 1000, h: H / 1000, shape: 'rect', r: 0.09, mount: 'twin', bottom: 2.2,
    draw(g) {
      guideBase(g, W, H, COL.guideBlue);
      // P mark
      fillRR(g, 210, 220, 640, 640, 60, '#fff');
      text(g, 'P', 532, 572, 640, { color: COL.guideBlue, family: EN, weight: 800 });
      // 大黒PA
      const aw = arrowT ? 760 : 0;
      const tx = 950, tw = W - tx - 200 - aw;
      const w1 = text(g, '大黒', tx, 480, 470, { align: 'left', maxW: tw * 0.62 });
      text(g, 'PA', tx + w1 + 30, 510, 400, { align: 'left', family: EN, weight: 700, maxW: tw - w1 - 30 });
      text(g, 'Daikoku PA', tx + 10, 800, 170, { align: 'left', family: EN, weight: 600, maxW: tw });
      // facility pictograms (white tiles, blue symbols)
      const icons = o.icons ?? ['toilet', 'fork_knife', 'cup', 'cart', 'info'];
      const ts = 440, gap = 50; let ix = 220;
      const iy = 1000;
      for (const ic of icons) {
        fillRR(g, ix, iy, ts, ts, 30, '#fff');
        if (ic === 'toilet') { picto(g, 'man', ix + 10, iy + 40, ts * 0.8, COL.guideBlue); picto(g, 'woman', ix + ts * 0.42, iy + 40, ts * 0.8, COL.guideBlue); }
        else picto(g, ic, ix + ts * 0.12, iy + ts * 0.12, ts * 0.76, COL.guideBlue);
        ix += ts + gap;
      }
      if (dist) {
        const m = /^([\d.,]+)\s*(.*)$/.exec(dist) || [0, dist, ''];
        const w2 = measure(g, m[2], 200, EN);
        text(g, m[2], W - 230, 1720, 200, { align: 'right', family: EN, base: 'alphabetic' });
        text(g, m[1], W - 230 - w2 - 15, 1720, 340, { align: 'right', family: EN, base: 'alphabetic' });
      }
      if (arrowT) guideArrow(g, arrowT, W - 200 - aw + 60, 230, aw - 100, dist ? 1150 : 1450);
    },
  };
};

// ── regulatory ──
function regRing(g, D, inner = COL.regBlue) {
  const R = D / 2;
  fillCircle(g, R, R, R, '#fff');
  fillCircle(g, R, R, R - 8, COL.regRed);
  fillCircle(g, R, R, R - 8 - D * 0.1, inner);
}
const roundSign = (D, draw, extra = {}) => ({ w: D / 1000, h: D / 1000, shape: 'circle', mount: 'pole', top: 2.5, ...extra, draw: (g) => draw(g, D) });

S.speed_limit = o => roundSign(600, (g, D) => {
  regRing(g, D, '#fff');
  const v = String(o.value ?? 60);
  const size = 400;
  text(g, v, D / 2, D / 2 + 12, size, { color: COL.speedBlue, family: '"Helvetica Neue","Arial Narrow",Arial,sans-serif', weight: 700, sx: v.length > 2 ? 0.62 : 0.78, maxW: D * 0.66, ls: -8 });
});

S.no_parking = () => roundSign(600, (g, D) => {
  regRing(g, D);
  g.save(); g.beginPath(); g.arc(D / 2, D / 2, D / 2 - 10, 0, 7); g.clip();
  g.strokeStyle = COL.regRed; g.lineWidth = D * 0.1; const k = D * 0.36;
  g.beginPath(); g.moveTo(D / 2 - k, D / 2 - k); g.lineTo(D / 2 + k, D / 2 + k); g.stroke(); g.restore();
});
S.no_stopping = () => roundSign(600, (g, D) => {
  regRing(g, D);
  g.save(); g.strokeStyle = COL.regRed; g.lineWidth = D * 0.1; const k = D * 0.36;
  g.beginPath(); g.moveTo(D / 2 - k, D / 2 - k); g.lineTo(D / 2 + k, D / 2 + k); g.moveTo(D / 2 + k, D / 2 - k); g.lineTo(D / 2 - k, D / 2 + k); g.stroke(); g.restore();
});
S.no_entry = () => roundSign(600, (g, D) => {
  fillCircle(g, D / 2, D / 2, D / 2, '#fff');
  fillCircle(g, D / 2, D / 2, D / 2 - 10, COL.regRed);
  fillRR(g, D * 0.14, D * 0.415, D * 0.72, D * 0.17, 4, '#fff');
});
S.no_pedestrians = () => roundSign(600, (g, D) => {
  regRing(g, D);
  picto(g, 'walker', D * 0.24, D * 0.2, D * 0.58, '#fff');
  g.save(); g.strokeStyle = COL.regRed; g.lineWidth = D * 0.09; const k = D * 0.355;
  g.beginPath(); g.moveTo(D / 2 - k, D / 2 - k); g.lineTo(D / 2 + k, D / 2 + k); g.stroke(); g.restore();
});

function invTriangle(label, en) {
  return () => {
    const W = 800, H = Math.round(800 * Math.sqrt(3) / 2);
    return {
      w: W / 1000, h: H / 1000, shape: 'tri_down', mount: 'pole', top: 2.6,
      draw(g) {
        g.save(); g.lineJoin = 'round';
        poly(g, [[0, 0], [W, 0], [W / 2, H]]); g.fillStyle = '#fff'; g.fill();
        const i = 34; // white border
        const pts = [[i * 1.73, i], [W - i * 1.73, i], [W / 2, H - i * 2]];
        poly(g, pts); g.fillStyle = COL.regRed; g.fill();
        g.lineWidth = 16; g.strokeStyle = COL.regRed; g.stroke();
        g.restore();
        text(g, label, W / 2, H * 0.27, label.length > 2 ? 165 : 185, { color: '#fff', weight: 800, maxW: W * 0.56, ls: label.length > 2 ? 4 : 40 });
        text(g, en, W / 2, H * 0.47, 66, { color: '#fff', family: EN, weight: 700, ls: 6 });
      },
    };
  };
}
S.stop = invTriangle('止まれ', 'STOP');
S.slow = invTriangle('徐行', 'SLOW');

S.one_way = o => {
  const W = 800, H = 400, dir = o.dir ?? 'right';
  return {
    w: 0.8, h: 0.4, shape: 'rect', r: 0.02, mount: 'pole', top: 2.6,
    draw(g) {
      fillRR(g, 0, 0, W, H, 20, '#fff');
      fillRR(g, 8, 8, W - 16, H - 16, 14, COL.regBlue);
      g.save();
      if (dir === 'left') { g.translate(W, 0); g.scale(-1, 1); }
      poly(g, [[60, 125], [530, 125], [530, 55], [745, 200], [530, 345], [530, 275], [60, 275]]);
      g.fillStyle = '#fff'; g.fill();
      g.restore();
      text(g, '一方通行', dir === 'left' ? W - 310 : 310, 202, 112, { color: COL.regBlue, weight: 800, maxW: 440, ls: 6 });
    },
  };
};

S.pedestrian_crossing = () => ({
  w: 0.6, h: 0.6, shape: 'rect', r: 0.02, mount: 'pole', top: 2.6,
  draw(g) {
    const W = 600;
    fillRR(g, 0, 0, W, W, 20, '#fff');
    fillRR(g, 8, 8, W - 16, W - 16, 14, COL.regBlue);
    g.save(); g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#fff'; g.fillStyle = '#fff';
    poly(g, [[W / 2, 58], [W - 52, W - 70], [52, W - 70]]); g.fill(); g.stroke(); g.restore();
    // zebra stripes (perspective-free bars)
    g.fillStyle = COL.black;
    for (let i = 0; i < 6; i++) { const x = 118 + i * 63; g.fillRect(x, 455, 36, 40); }
    picto(g, 'walker', 200, 175, 270, COL.black);
  },
});

S.speed_limit_electronic = o => {
  const W = 1000;
  return {
    w: 1.0, h: 1.0, shape: 'rect', r: 0.03, mount: 'pole', top: 4.2, emissive: 0.9, depth: 0.16,
    draw(g) {
      fillRR(g, 0, 0, W, W, 30, '#2b2d30');
      fillRR(g, 30, 30, W - 60, W - 60, 16, '#050505');
      // LED ring: concentric dot rings
      const rings = [0.43, 0.405, 0.38];
      g.save();
      for (const k of rings) {
        const R = W * k, n = Math.round(2 * Math.PI * R / 22);
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2, x = W / 2 + Math.cos(a) * R, y = W / 2 + Math.sin(a) * R;
          fillCircle(g, x, y, 12, 'rgba(255,40,30,0.25)');
          fillCircle(g, x, y, 7, '#ff2a1c');
          fillCircle(g, x, y, 3, '#ffb0a0');
        }
      }
      g.restore();
      const v = String(o.value ?? 60), col = o.color ?? '#fff6e8';
      const cols = 30, rows = 26, cw = W * 0.6, ch = cw * rows / cols;
      ledMatrix(g, W / 2 - cw / 2, W / 2 - ch / 2, cw, ch, cols, rows, (m, c, r) => {
        m.fillStyle = col; m.textAlign = 'center'; m.textBaseline = 'middle';
        m.font = `700 ${r * 1.18}px "Helvetica Neue",Arial,sans-serif`;
        m.save(); m.translate(c / 2, r / 2 + 1); m.scale(v.length > 2 ? 0.62 : 0.85, 1); m.fillText(v, 0, 0); m.restore();
      }, { off: 'rgba(40,40,40,0.6)' });
    },
  };
};

// ── police / operator notices ──
const NOTICES = {
  long_parking: { band: 'お願い', bandColor: COL.regRed, body: ['長時間駐車は', 'やめましょう'], sub: ['このパーキングエリアは', '休憩施設です'], issuer: '神奈川県警察' },
  no_racing: { band: '警　告', bandColor: COL.regRed, body: ['暴走行為', '空ぶかし'], red: '禁止', sub: ['迷惑行為は取り締まります'], issuer: '神奈川県警察', issuer2: '高速道路交通警察隊' },
  no_gathering: { band: '警　告', bandColor: COL.regRed, body: ['集団での', '駐車・集会は', 'やめましょう'], sub: ['周辺の迷惑となる行為は', '取り締まりの対象となります'], issuer: '神奈川県警察' },
  idling: { band: 'お願い', bandColor: '#0a7a3c', body: ['アイドリング', 'ストップに', 'ご協力ください'], sub: ['駐車中はエンジンを', '止めましょう'], issuer: '首都高速道路', bodyColor: '#0a7a3c' },
  camera: { band: '防犯カメラ作動中', bandColor: COL.regRed, camera: true, body: [], sub: ['このパーキングエリアは', '防犯カメラで監視しています'], issuer: '神奈川県警察' },
};
S.police_notice = o => {
  const v = NOTICES[o.text ?? 'long_parking'] ?? NOTICES.long_parking;
  const W = 600, H = 900;
  return {
    w: 0.6, h: 0.9, shape: 'rect', r: 0.015, mount: 'pole', top: 2.2,
    draw(g) {
      fillRR(g, 0, 0, W, H, 15, '#fbfbf8');
      strokeRR(g, 14, 14, W - 28, H - 28, 8, v.bandColor, 8);
      // headline band
      fillRR(g, 30, 30, W - 60, 150, 6, v.bandColor);
      const bandLen = v.band.replace(/　/g, '').length;
      text(g, v.band, W / 2, 106, bandLen <= 3 ? 104 : 74, { color: '#fff', weight: 800, maxW: W - 110 });
      // measure content block, then centre it between headline band and issuer line
      const bodyColor = v.bodyColor ?? COL.black;
      const bs = v.body.length >= 3 ? 86 : (v.red ? 92 : 100), bl = bs * 1.22;
      const parts = [];
      if (v.camera) parts.push(['cam', 270], ['rec', 80]);
      v.body.forEach(t => parts.push(['body', bl, t]));
      if (v.red) parts.push(['red', 165]);
      parts.push(['div', 50]);
      v.sub.forEach(t => parts.push(['sub', 58, t]));
      const total = parts.reduce((a, p) => a + p[1], 0);
      const top = 190, bottom = H - (v.issuer2 ? 165 : 135);
      let y = top + Math.max(10, (bottom - top - total) / 2);
      for (const [k, h, t] of parts) {
        if (k === 'cam') picto(g, 'camera', W / 2 - 130, y + 5, 260, COL.black);
        else if (k === 'rec') text(g, '24時間録画', W / 2, y + h / 2, 64, { color: COL.regRed, weight: 800 });
        else if (k === 'body') text(g, t, W / 2, y + h / 2, bs, { color: bodyColor, weight: 800, maxW: W - 90 });
        else if (k === 'red') text(g, v.red, W / 2, y + h / 2, 150, { color: COL.regRed, weight: 900, ls: 40 });
        else if (k === 'div') { g.fillStyle = '#bbb'; g.fillRect(60, y + h / 2 - 2, W - 120, 3); }
        else if (k === 'sub') text(g, t, W / 2, y + h / 2, 42, { color: COL.black, weight: 600, maxW: W - 90 });
        y += h;
      }
      g.fillStyle = v.bandColor; g.fillRect(30, bottom + 6, W - 60, 5);
      // issuer
      const iy = H - 70;
      if (v.issuer2) {
        text(g, v.issuer, W / 2, iy - 52, 46, { color: COL.black, weight: 800, ls: 6 });
        text(g, v.issuer2, W / 2, iy + 2, 38, { color: COL.black, weight: 700 });
      } else text(g, v.issuer, W / 2, iy - 12, 50, { color: COL.black, weight: 800, ls: 8 });
    },
  };
};

// ── PA facility boards ──
const FAC = {
  toilet: { ja: 'トイレ', en: 'Toilets' },
  restaurant: { ja: 'レストラン', en: 'Restaurant', icon: 'fork_knife' },
  food_court: { ja: 'フードコート', en: 'Food Court', icon: 'fork_knife' },
  convenience: { ja: 'コンビニ', en: 'Convenience Store', icon: 'cart', tag: '24h' },
  vending: { ja: '自動販売機', en: 'Vending Machines', icon: 'vending' },
  smoking: { ja: '喫煙所', en: 'Smoking Area', icon: 'cigarette' },
  information: { ja: '案内所', en: 'Information', icon: 'info' },
  highway_terminal: { ja: 'ハイウェイ情報ターミナル', en: 'Highway Information Terminal', icon: 'terminal' },
  ev: { ja: 'EV急速充電器', en: 'EV Quick Charger', icon: 'ev' },
};
S.pa_facility = o => {
  const type = o.type ?? 'toilet';
  const f = FAC[type] ?? FAC.toilet;
  const toilet = type === 'toilet';
  const W = toilet ? 1500 : 800, H = 1000;
  const navy = '#1f2f55';
  return {
    w: W / 1000, h: H / 1000, shape: 'rect', r: 0.02, mount: 'twin', bottom: 1.6,
    draw(g) {
      fillRR(g, 0, 0, W, H, 20, navy);
      strokeRR(g, 12, 12, W - 24, H - 24, 12, 'rgba(255,255,255,.35)', 4);
      if (toilet) {
        const ts = 400, y = 70;
        const items = [['man', '男', COL.guideBlue, 'Men'], ['woman', '女', COL.regRed, 'Women'], ['wheelchair', '多目的', COL.black, 'Multipurpose']];
        items.forEach(([p, lab, c, en], i) => {
          const x = 80 + i * (ts + 70);
          fillRR(g, x, y, ts, ts, 24, '#fff');
          if (p === 'wheelchair') { picto(g, 'wheelchair', x + 10, y + 40, ts * 0.62, COL.guideBlue); picto(g, 'baby', x + ts * 0.6, y + ts * 0.5, ts * 0.38, COL.black); }
          else picto(g, p, x + ts * 0.1, y + ts * 0.08, ts * 0.84, c);
          text(g, lab, x + ts / 2, y + ts + 80, 88, { color: '#fff', maxW: ts });
          text(g, en, x + ts / 2, y + ts + 165, 48, { color: '#cfd8ea', family: EN, weight: 600, maxW: ts });
        });
        g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(60, 740, W - 120, 4);
        text(g, 'トイレ', W / 2 - 230, 862, 110, { color: '#fff', ls: 10 });
        text(g, 'Toilets', W / 2 + 220, 866, 80, { color: '#fff', family: EN, weight: 600 });
      } else {
        const ts = 500, x = (W - ts) / 2, y = 60;
        fillRR(g, x, y, ts, ts, 28, '#fff');
        picto(g, f.icon, x + ts * 0.12, y + ts * 0.12, ts * 0.76, COL.black);
        let jy = 690;
        const ja = f.ja;
        text(g, ja, W / 2, jy, ja.length > 8 ? 70 : 96, { color: '#fff', maxW: W - 90 });
        if (f.tag) {
          fillRR(g, W - 230, y + 10, 190, 110, 20, '#e8a317');
          text(g, f.tag, W - 135, y + 66, 76, { color: '#fff', family: EN, weight: 800 });
        }
        text(g, f.en, W / 2, 820, f.en.length > 20 ? 40 : 54, { color: '#cfd8ea', family: EN, weight: 600, maxW: W - 80 });
        if (type === 'highway_terminal') text(g, '道路交通情報', W / 2, 910, 46, { color: '#fff', weight: 600 });
        if (type === 'smoking') text(g, '指定場所以外は禁煙です', W / 2, 910, 44, { color: '#fff', weight: 600 });
        if (type === 'ev') text(g, 'CHAdeMO', W / 2, 910, 48, { color: '#fff', family: EN, weight: 700 });
        if (type === 'convenience') text(g, '24時間営業', W / 2, 910, 48, { color: '#fff', weight: 700 });
      }
    },
  };
};

S.parking_bay_board = o => {
  const type = o.type ?? 'small';
  const d = { large: ['大型車', 'Large Vehicles', 'truck'], small: ['小型車', 'Cars', 'car'], disabled: ['身障者用', 'Disabled', 'wheelchair'] }[type] ?? ['小型車', 'Cars', 'car'];
  const W = 900, H = 700;
  return {
    w: 0.9, h: 0.7, shape: 'rect', r: 0.03, mount: 'pole', top: 2.6,
    draw(g) {
      fillRR(g, 0, 0, W, H, 30, COL.guideBlue);
      strokeRR(g, 20, 20, W - 40, H - 40, 18, '#fff', 14);
      fillRR(g, 70, 70, 300, 300, 22, '#fff');
      text(g, 'P', 220, 228, 300, { color: COL.guideBlue, family: EN, weight: 800 });
      picto(g, d[2], 420, type === 'disabled' ? 60 : 30, type === 'disabled' ? 330 : 400, '#fff');
      text(g, d[0], W / 2, 490, d[0].length > 3 ? 140 : 160, { color: '#fff', weight: 800, ls: 20, maxW: W - 120 });
      text(g, d[1], W / 2, 610, 62, { color: '#fff', family: EN, weight: 600 });
    },
  };
};

S.pa_entrance = o => {
  const ex = (o.type ?? 'entrance') === 'exit';
  const arrowT = o.arrow ?? (ex ? 'left' : 'right');
  const W = 1400, H = 700;
  return {
    w: 1.4, h: 0.7, shape: 'rect', r: 0.04, mount: 'twin', bottom: 1.4,
    draw(g) {
      guideBase(g, W, H, COL.green, { r: 50, inset: 18, bw: 14 });
      const left = arrowT === 'left';
      const tx = left ? 920 : 500;
      text(g, ex ? '出口' : '入口', tx, 300, 270, { ls: 60 });
      text(g, ex ? 'EXIT' : 'ENTRANCE', tx, 520, 110, { family: EN, weight: 700, ls: 10, maxW: 680 });
      guideArrow(g, arrowT, left ? 100 : 980, 150, 320, 400);
    },
  };
};

// ── variable message sign (道路情報板) ──
function normLine(l) { return typeof l === 'string' ? { text: l } : l; }
S.message_board = o => {
  const cols = o.cols ?? 8, nrows = Math.max(1, (o.lines ?? ['大黒PA', '閉鎖中']).length, o.rows ?? 2);
  const cell = 32, gap = 8, pitch = o.pitch ?? 12; // mm per dot (32×32-dot characters)
  const margin = 170;
  const gw = cols * cell, gh = nrows * cell + (nrows - 1) * gap;
  const W = gw * pitch + margin * 2, H = gh * pitch + margin * 2;
  return {
    w: W / 1000, h: H / 1000, shape: 'rect', r: 0.03, mount: 'overhead', bottom: 5.2, emissive: 1.0, depth: 0.32, dynamic: true,
    draw(g, _W, _H, lines = o.lines ?? ['大黒PA', '閉鎖中']) {
      fillRR(g, 0, 0, W, H, 30, '#55595e');
      fillRR(g, 40, 40, W - 80, H - 80, 14, '#0b0b0c');
      // screws
      for (const [x, y] of [[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]]) fillCircle(g, x, y, 9, '#8a8f95');
      const L = lines.map(normLine);
      ledMatrix(g, margin, margin, gw * pitch, gh * pitch, gw, gh, (m) => {
        m.textAlign = 'center'; m.textBaseline = 'middle';
        L.forEach((l, i) => {
          m.fillStyle = l.color ?? o.color ?? '#ffa21a';
          m.font = `${o.weight ?? 500} ${cell}px ${JP}`;
          const w = m.measureText(l.text).width;
          const k = Math.min(1, gw / Math.max(1, w));
          m.save(); m.translate(gw / 2, i * (cell + gap) + cell / 2 + 1); m.scale(k, 1); m.fillText(l.text, 0, 0); m.restore();
        });
      }, { off: 'rgba(48,44,40,0.55)', threshold: 95 });
    },
  };
};

// ── toll plaza ──
S.toll_gate = o => {
  const type = o.type ?? 'etc';
  const base = { shape: 'rect', r: 0.03, mount: 'none' };
  const lane = (draw) => ({ ...base, w: 0.7, h: 0.7, emissive: 1.0, depth: 0.18, draw(g) { fillRR(g, 0, 0, 700, 700, 24, '#2f3236'); fillRR(g, 30, 30, 640, 640, 12, '#040404'); draw(g); } });
  switch (type) {
    case 'etc': return { ...base, w: 1.8, h: 0.9, draw(g) {
      fillRR(g, 0, 0, 1800, 900, 30, COL.etc); strokeRR(g, 30, 30, 1740, 840, 20, '#fff', 20);
      text(g, 'ETC', 620, 455, 440, { family: EN, weight: 800, sx: 0.95 });
      text(g, '専用', 1340, 400, 280, { ls: 20 });
      text(g, 'ETC ONLY', 1340, 670, 100, { family: EN, weight: 700 });
    } };
    case 'etc_general': return { ...base, w: 1.8, h: 0.9, draw(g) {
      g.save(); rr(g, 0, 0, 1800, 900, 30); g.clip();
      g.fillStyle = COL.etc; g.fillRect(0, 0, 900, 900); g.fillStyle = COL.green; g.fillRect(900, 0, 900, 900); g.restore();
      strokeRR(g, 30, 30, 1740, 840, 20, '#fff', 20);
      text(g, 'ETC', 470, 420, 340, { family: EN, weight: 800 });
      text(g, 'ETC', 470, 690, 90, { family: EN, weight: 600 });
      g.fillStyle = '#fff'; g.save(); g.translate(900, 450); g.rotate(0.35); g.fillRect(-12, -330, 24, 660); g.restore();
      text(g, '一般', 1330, 420, 300, { ls: 20 });
      text(g, 'GENERAL', 1330, 690, 90, { family: EN, weight: 600 });
    } };
    case 'general': return { ...base, w: 1.8, h: 0.9, draw(g) {
      fillRR(g, 0, 0, 1800, 900, 30, COL.green); strokeRR(g, 30, 30, 1740, 840, 20, '#fff', 20);
      text(g, '一般', 900, 400, 360, { ls: 80 });
      text(g, 'GENERAL', 900, 690, 110, { family: EN, weight: 700, ls: 10 });
    } };
    case 'lane_open': return lane(g => {
      ledMatrix(g, 80, 80, 540, 540, 24, 24, (m) => {
        m.fillStyle = '#28ff6a'; m.beginPath(); poly(m, [[9, 2], [15, 2], [15, 12], [20, 12], [12, 22], [4, 12], [9, 12]]); m.fill();
      }, { off: 'rgba(40,40,40,.6)' });
    });
    case 'lane_closed': return lane(g => {
      ledMatrix(g, 80, 80, 540, 540, 24, 24, (m) => {
        m.strokeStyle = '#ff2a1c'; m.lineWidth = 3.4; m.beginPath(); m.moveTo(4, 4); m.lineTo(20, 20); m.moveTo(20, 4); m.lineTo(4, 20); m.stroke();
      }, { off: 'rgba(40,40,40,.6)' });
    });
    case 'tollgate': return { ...base, w: 3.2, h: 0.9, draw(g) {
      guideBase(g, 3200, 900, COL.green, { r: 50, inset: 24, bw: 18 });
      text(g, '料金所', 1100, 450, 440, { ls: 70 });
      text(g, 'TOLL GATE', 2450, 470, 190, { family: EN, weight: 700, ls: 10 });
    } };
    case 'card': return { ...base, w: 3.4, h: 0.85, draw(g) {
      fillRR(g, 0, 0, 3400, 850, 30, COL.guideBlue); strokeRR(g, 24, 24, 3352, 802, 20, '#fff', 16);
      fillRR(g, 90, 165, 640, 520, 30, COL.etc);
      text(g, 'ETC', 410, 380, 250, { family: EN, weight: 800 });
      // card icon
      fillRR(g, 250, 500, 320, 120, 14, '#fff'); fillRR(g, 290, 530, 70, 55, 6, '#e0b84a');
      text(g, 'ETCカードの挿入を', 2070, 300, 230, { maxW: 2500 });
      text(g, '確認してください', 2070, 580, 230, { maxW: 2500 });
    } };
    case 'fare': {
      const fares = o.fares ?? [{ type: '普通車', fare: '¥1,320' }, { type: '軽・二輪', fare: '¥1,090' }];
      const W = 1300, rowH = 250, H = 330 + fares.length * rowH + 120;
      return { ...base, w: W / 1000, h: H / 1000, draw(g) {
        fillRR(g, 0, 0, W, H, 24, '#fff'); strokeRR(g, 12, 12, W - 24, H - 24, 16, COL.green, 14);
        fillRR(g, 30, 30, W - 60, 230, 10, COL.green);
        text(g, '料金', 430, 145, 150, { ls: 40 });
        text(g, 'TOLL', 900, 152, 110, { family: EN });
        fares.forEach((f, i) => {
          const y = 300 + i * rowH;
          if (i) { g.fillStyle = '#999'; g.fillRect(60, y, W - 120, 4); }
          text(g, f.type, 90, y + rowH / 2, 120, { color: COL.black, align: 'left', maxW: 520 });
          text(g, f.fare, W - 90, y + rowH / 2 + 6, 150, { color: COL.black, align: 'right', family: EN, weight: 700 });
        });
        text(g, o.note ?? 'ETC割引は別途', W / 2, H - 100, 56, { color: '#444', weight: 600 });
      } };
    }
    case 'stop': return { ...base, w: 0.9, h: 0.45, draw(g) {
      fillRR(g, 0, 0, 900, 450, 24, COL.regRed); strokeRR(g, 22, 22, 856, 406, 14, '#fff', 14);
      text(g, '止まれ', 450, 200, 200, { ls: 20 });
      text(g, 'STOP', 450, 360, 90, { family: EN, weight: 700, ls: 10 });
    } };
    case 'slow20': return { ...base, w: 1.4, h: 1.4, draw(g) {
      fillRR(g, 0, 0, 1400, 1400, 30, COL.guideBlue); strokeRR(g, 24, 24, 1352, 1352, 20, '#fff', 16);
      fillRR(g, 100, 100, 1200, 320, 20, COL.etc);
      text(g, 'ETC車', 700, 265, 210, { family: EN });
      text(g, '20', 560, 720, 460, { family: EN, weight: 800 });
      text(g, 'km', 1000, 790, 200, { family: EN, base: 'alphabetic', align: 'center' });
      text(g, '以下に減速', 700, 1150, 200, { maxW: 1150 });
    } };
    default: return S.toll_gate({ ...o, type: 'etc' });
  }
};

// ── small expressway furniture ──
S.kilometer_post = o => {
  const W = 300, H = 460;
  return {
    w: 0.3, h: 0.46, shape: 'rect', r: 0.02, mount: 'pole', top: 1.25,
    draw(g) {
      fillRR(g, 0, 0, W, H, 20, COL.green); strokeRR(g, 12, 12, W - 24, H - 24, 12, '#fff', 8);
      if (o.route) routeBadge(g, W / 2, 85, 90, o.route);
      else text(g, o.name ?? '大黒', W / 2, 88, 72, { maxW: W - 60 });
      const km = String(o.km ?? '1.2');
      const [a, b] = km.split('.');
      const wa = measure(g, a, 190, EN);
      const wb = b ? measure(g, '.' + b, 130, EN) : 0;
      const x0 = W / 2 - (wa + wb) / 2;
      text(g, a, x0, 300, 190, { family: EN, align: 'left', base: 'alphabetic' });
      if (b) text(g, '.' + b, x0 + wa, 300, 130, { family: EN, align: 'left', base: 'alphabetic' });
      text(g, 'km', W / 2, 385, 60, { family: EN, weight: 600 });
    },
  };
};

S.emergency_phone = () => ({
  w: 0.9, h: 0.45, shape: 'rect', r: 0.03, mount: 'pole', top: 2.8,
  draw(g) {
    const W = 900, H = 450;
    fillRR(g, 0, 0, W, H, 30, COL.green); strokeRR(g, 16, 16, W - 32, H - 32, 18, '#fff', 12);
    fillRR(g, 50, 60, 270, 270, 24, '#fff');
    picto(g, 'phone', 65, 75, 240, COL.green);
    text(g, 'SOS', 185, 380, 60, { family: EN, weight: 800 });
    text(g, '非常電話', 610, 190, 140, { maxW: 500 });
    text(g, 'EMERGENCY', 610, 310, 62, { family: EN, weight: 700, maxW: 500 });
    text(g, 'TELEPHONE', 610, 375, 62, { family: EN, weight: 700, maxW: 500 });
  },
});

S.bridge_name = o => {
  const style = o.style ?? 'plate';
  const ja = o.ja ?? '横浜ベイブリッジ', en = o.en ?? 'Yokohama Bay Bridge';
  if (style === 'road') {
    const W = 3600, H = 900;
    return { w: 3.6, h: 0.9, shape: 'rect', r: 0.05, mount: 'twin', bottom: 2.0, draw(g) {
      guideBase(g, W, H, COL.green, { r: 50, inset: 22, bw: 16 });
      text(g, ja, W / 2, 360, 340, { maxW: W - 300, ls: 20 });
      text(g, en, W / 2, 700, 150, { family: EN, weight: 600 });
    } };
  }
  // cast bronze 橋名板
  const W = 1500, H = 420;
  return { w: 1.5, h: 0.42, shape: 'rect', r: 0.01, mount: 'none', draw(g) {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#6b4f2a'); gr.addColorStop(0.5, '#4d3519'); gr.addColorStop(1, '#3a2812');
    fillRR(g, 0, 0, W, H, 10, gr);
    strokeRR(g, 22, 22, W - 44, H - 44, 6, '#c7a466', 10);
    strokeRR(g, 40, 40, W - 80, H - 80, 4, '#2a1c0b', 4);
    const emb = (s, y, size, fam, ls) => {
      text(g, s, W / 2 + 4, y + 4, size, { color: 'rgba(0,0,0,.55)', family: fam, ls, maxW: W - 180 });
      text(g, s, W / 2, y, size, { color: '#d9bc7c', family: fam, ls, maxW: W - 180 });
    };
    emb(ja, 175, 150, JP, 30);
    emb(en.toUpperCase(), 315, 66, '"Times New Roman",Times,serif', 18);
    for (const [x, y] of [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]]) { fillCircle(g, x, y, 13, '#2a1c0b'); fillCircle(g, x - 2, y - 2, 10, '#b08d55'); }
  } };
};

S.area_name = o => {
  const W = 2400, H = 1000;
  const bg = o.color === 'green' ? COL.green : COL.guideBlue;
  return { w: 2.4, h: 1.0, shape: 'rect', r: 0.05, mount: 'twin', bottom: 2.0, draw(g) {
    guideBase(g, W, H, bg, { r: 50, inset: 22, bw: 16 });
    text(g, o.ja ?? '大黒ふ頭', W / 2, 400, 400, { maxW: W - 260, ls: 30 });
    text(g, o.en ?? 'Daikoku-futō', W / 2, 790, 170, { family: EN, weight: 600, maxW: W - 260 });
  } };
};

S.route_marker = o => {
  const route = o.route ?? 'K5';
  const rn = ROUTES[route];
  const W = 900, H = o.name === false || !rn ? 520 : 720;
  return { w: W / 1000, h: H / 1000, shape: 'rect', r: 0.04, mount: 'pole', top: 2.8, draw(g) {
    guideBase(g, W, H, COL.green, { r: 40, inset: 16, bw: 12 });
    routeBadge(g, W / 2, 255, 330, route);
    if (H > 520) {
      text(g, rn.ja, W / 2, 520, 130, { maxW: W - 120 });
      text(g, rn.en, W / 2, 640, 62, { family: EN, weight: 600, maxW: W - 120 });
    }
  } };
};

S.fence_notice = o => {
  const v = o.text ?? 'keep_out';
  const W = 600, H = 400;
  return { w: 0.6, h: 0.4, shape: 'rect', r: 0.01, mount: 'none', depth: 0.004, draw(g) {
    fillRR(g, 0, 0, W, H, 10, '#fbfbf7');
    if (v === 'danger') {
      g.save(); rr(g, 14, 14, W - 28, 130, 6); g.clip();
      g.fillStyle = COL.yellow; g.fillRect(0, 0, W, 150);
      g.fillStyle = COL.black;
      for (let x = -150; x < W + 150; x += 70) { poly(g, [[x, 150], [x + 35, 150], [x + 35 + 150, 0], [x + 150, 0]]); g.fill(); }
      g.restore();
      fillRR(g, 170, 26, 260, 106, 8, COL.yellow);
      text(g, '危険', W / 2, 82, 92, { color: COL.black, weight: 900, ls: 20 });
      text(g, '関係者以外', W / 2, 220, 80, { color: COL.regRed, weight: 800, maxW: W - 70 });
      text(g, '立入禁止', W / 2, 315, 90, { color: COL.regRed, weight: 900, ls: 12 });
      text(g, 'DANGER  KEEP OUT', W / 2, 375, 34, { color: COL.black, family: EN, weight: 700 });
    } else {
      strokeRR(g, 14, 14, W - 28, H - 28, 6, COL.regRed, 10);
      text(g, '立入禁止', W / 2, 150, 135, { color: COL.regRed, weight: 900, ls: 8, maxW: W - 70 });
      g.fillStyle = COL.regRed; g.fillRect(50, 238, W - 100, 4);
      text(g, 'KEEP OUT', W / 2, 295, 66, { color: COL.black, family: EN, weight: 800, ls: 8 });
      text(g, o.issuer ?? '首都高速道路', W / 2, 368, 28, { color: '#444', weight: 600 });
    }
    for (const [x, y] of [[34, 34], [W - 34, 34], [34, H - 34], [W - 34, H - 34]]) fillCircle(g, x, y, 7, '#9aa');
  } };
};

// ── convenience store: parody of the real 24h store in Daikoku PA's annex (二番館) — "LAWSUN / ローサン" ──
const BAY = { blue: '#1b63b5', orange: '#f28c1a', teal: '#3aa0e0', navy: '#123f7a', white: '#ffffff' };
function bayLogo(g, x, y, s) {
  // milk-bottle emblem in a rounded square (parody look, original drawing)
  fillRR(g, x, y, s, s, s * 0.18, BAY.white);
  g.save(); g.fillStyle = BAY.blue;
  const cx = x + s * 0.5;
  g.beginPath();
  g.moveTo(cx - s * 0.11, y + s * 0.14); g.lineTo(cx + s * 0.11, y + s * 0.14);
  g.lineTo(cx + s * 0.11, y + s * 0.3); g.quadraticCurveTo(cx + s * 0.27, y + s * 0.38, cx + s * 0.27, y + s * 0.55);
  g.lineTo(cx + s * 0.27, y + s * 0.82); g.quadraticCurveTo(cx + s * 0.27, y + s * 0.88, cx + s * 0.21, y + s * 0.88);
  g.lineTo(cx - s * 0.21, y + s * 0.88); g.quadraticCurveTo(cx - s * 0.27, y + s * 0.88, cx - s * 0.27, y + s * 0.82);
  g.lineTo(cx - s * 0.27, y + s * 0.55); g.quadraticCurveTo(cx - s * 0.27, y + s * 0.38, cx - s * 0.11, y + s * 0.3);
  g.closePath(); g.fill();
  g.fillStyle = BAY.white; g.fillRect(cx - s * 0.2, y + s * 0.56, s * 0.4, s * 0.14);
  g.restore();
}
S.store_front = o => {
  const W = (o.width ?? 7.2) * 1000, H = 1100;
  return { w: W / 1000, h: 1.1, shape: 'rect', r: 0.0, mount: 'none', emissive: 0.6, depth: 0.12, draw(g) {
    g.fillStyle = BAY.blue; g.fillRect(0, 0, W, H);
    g.fillStyle = BAY.white; g.fillRect(0, H - 120, W, 34); g.fillStyle = BAY.teal; g.fillRect(0, H - 70, W, 70);
    bayLogo(g, 200, 130, 640);
    const tx = 1000;
    const nw = text(g, 'LAWSUN', tx, 430, 520, { color: BAY.white, align: 'left', family: EN, weight: 800, ls: 40, maxW: W - tx - (W > 5000 ? 1500 : 150) });
    text(g, 'ローサン', tx + 10, 790, 210, { color: BAY.white, align: 'left', weight: 800, family: JP, ls: 30, maxW: nw });
    if (W > 5000) {
      fillRR(g, W - 1000, 140, 760, 600, 50, BAY.white);
      text(g, '24', W - 790, 400, 330, { color: BAY.blue, family: EN, weight: 800 });
      text(g, 'H', W - 520, 430, 220, { color: BAY.blue, family: EN, weight: 800 });
      text(g, 'OPEN', W - 620, 640, 130, { color: BAY.blue, family: EN, weight: 700, ls: 10 });
      text(g, o.branch ?? '大黒PA二番館店', W - 1100, 820, 120, { color: BAY.white, align: 'right' });
    }
  } };
};

S.store_poster = o => {
  const v = o.variant ?? 'onigiri';
  const W = 594, H = 841;
  return { w: 0.594, h: 0.841, shape: 'rect', r: 0.0, mount: 'none', depth: 0.002, emissive: 0.15, draw(g) {
    const foot = (bg = BAY.navy) => {
      g.fillStyle = bg; g.fillRect(0, H - 60, W, 60);
      bayLogo(g, 20, H - 52, 44);
      text(g, 'LAWSUN', 80, H - 30, 30, { align: 'left', family: EN, weight: 800, ls: 4 });
      text(g, '※価格は税込です', W - 20, H - 30, 22, { align: 'right', weight: 600 });
    };
    const price = (x, y, yen, size, col = COL.regRed) => {
      const w = measure(g, yen, size, EN, 800);
      text(g, '¥', x - w / 2 - size * 0.18, y + size * 0.04, size * 0.5, { color: col, family: EN, weight: 800 });
      text(g, yen, x + size * 0.1, y, size, { color: col, family: EN, weight: 800, stroke: '#fff', strokeW: size * 0.12 });
    };
    if (v === 'onigiri') {
      g.fillStyle = '#fff6e2'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#c8102e'; g.fillRect(0, 0, W, 150);
      text(g, 'こだわりの', W / 2, 48, 40, { weight: 700 });
      text(g, '手巻おにぎり', W / 2, 106, 76, { weight: 900, maxW: W - 40 });
      // onigiri illustration
      const oni = (cx, cy, s, fill) => {
        g.save(); g.translate(cx, cy);
        g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * 0.35, -s, s * 1.05, s * 0.35, s * 0.95, s * 0.7); g.quadraticCurveTo(s * 0.9, s * 0.92, s * 0.55, s * 0.92); g.lineTo(-s * 0.55, s * 0.92); g.quadraticCurveTo(-s * 0.9, s * 0.92, -s * 0.95, s * 0.7); g.bezierCurveTo(-s * 1.05, s * 0.35, -s * 0.35, -s, 0, -s); g.closePath();
        g.fillStyle = '#fffdf6'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#d8cfb8'; g.stroke();
        g.clip(); g.fillStyle = '#1d2a1e'; g.fillRect(-s * 0.55, s * 0.18, s * 1.1, s); g.fillStyle = 'rgba(80,120,80,.25)'; g.fillRect(-s * 0.55, s * 0.18, s * 0.1, s);
        if (fill) fillCircle(g, 0, -s * 0.15, s * 0.22, fill);
        g.restore();
      };
      oni(190, 360, 135, '#e8572a'); oni(400, 400, 135, '#8a5a2b');
      [['鮭', 190, 585], ['昆布', 400, 585]].forEach(([s, x, y]) => { fillRR(g, x - 70, y - 30, 140, 60, 30, '#c8102e'); text(g, s, x, y, 38, { weight: 800 }); });
      text(g, 'パリッと海苔', W / 2, 670, 46, { color: '#333', weight: 800 });
      price(W / 2, 735, String(o.price ?? 150), 96);
      foot();
    } else if (v === 'coffee') {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3b2214'); gr.addColorStop(1, '#1d0f08');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      text(g, '挽きたて', W / 2, 70, 52, { color: '#f2c78a', weight: 700, ls: 10 });
      text(g, 'ホットコーヒー', W / 2, 150, 72, { weight: 900, maxW: W - 40 });
      // cup
      g.save(); g.translate(W / 2, 450);
      g.fillStyle = '#fff'; poly(g, [[-110, -120], [110, -120], [85, 150], [-85, 150]]); g.fill();
      g.fillStyle = BAY.blue; poly(g, [[-102, -40], [102, -40], [94, 40], [-94, 40]]); g.fill();
      fillRR(g, -125, -150, 250, 40, 10, '#e9e4dc');
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 9; g.lineCap = 'round';
      for (const sx of [-50, 0, 50]) { g.beginPath(); g.moveTo(sx, -170); g.bezierCurveTo(sx - 25, -190, sx + 25, -210, sx, -230); g.stroke(); }
      g.restore();
      text(g, 'BAY CAFE', W / 2, 452, 30, { family: EN, weight: 800 });
      fillRR(g, 60, 625, 110, 110, 55, '#f2c78a'); text(g, 'R', 115, 682, 64, { color: '#3b2214', family: EN, weight: 800 });
      price(W / 2 + 60, 680, String(o.price ?? 120), 110, '#ffd23a');
      foot('#0d0704');
    } else if (v === 'karaage') {
      g.fillStyle = '#ffd400'; g.fillRect(0, 0, W, H);
      // burst rays
      g.save(); g.translate(W / 2, 400); g.fillStyle = '#ffe866';
      for (let i = 0; i < 18; i++) { g.rotate(Math.PI / 9); poly(g, [[0, 0], [-40, -600], [40, -600]]); g.fill(); }
      g.restore();
      text(g, '揚げたて！', W / 2, 80, 70, { color: COL.regRed, weight: 900, stroke: '#fff', strokeW: 14 });
      // karaage nuggets
      const rng = mulberry(7);
      const nug = (cx, cy, s) => {
        g.beginPath();
        for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2, r = s * (0.8 + rng() * 0.3); i ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85); }
        g.closePath(); const gr = g.createRadialGradient(cx - s * 0.3, cy - s * 0.3, 4, cx, cy, s);
        gr.addColorStop(0, '#f0a640'); gr.addColorStop(0.7, '#b8621a'); gr.addColorStop(1, '#7a3a0c'); g.fillStyle = gr; g.fill();
        for (let i = 0; i < 6; i++) fillCircle(g, cx + (rng() - 0.5) * s, cy + (rng() - 0.5) * s * 0.8, 6, 'rgba(255,220,140,.6)');
      };
      fillRR(g, 110, 300, 374, 230, 30, '#fff');
      nug(220, 350, 80); nug(370, 345, 80); nug(300, 430, 85); nug(190, 450, 70); nug(410, 450, 72);
      fillCircle(g, 470, 300, 45, '#ffe94a'); text(g, 'レモン', 470, 300, 22, { color: '#333', weight: 800 });
      text(g, 'からあげ', W / 2, 610, 110, { color: '#7a2a0c', weight: 900, stroke: '#fff', strokeW: 16, maxW: W - 40 });
      fillRR(g, 40, 680, 170, 80, 12, COL.regRed); text(g, '5個入', 125, 722, 44, { weight: 900 });
      price(390, 722, String(o.price ?? 250), 100);
      foot();
    } else { // new
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.save(); g.translate(W / 2, 200);
      g.beginPath(); for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, r = i % 2 ? 140 : 190; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fillStyle = COL.regRed; g.fill(); g.restore();
      text(g, '新商品', W / 2, 180, 96, { color: '#fff', weight: 900 });
      text(g, 'NEW', W / 2, 260, 44, { color: COL.yellow, family: EN, weight: 800, ls: 6 });
      // cheesecake slice
      g.save(); g.translate(W / 2, 500);
      g.fillStyle = '#f7d77c'; poly(g, [[-170, -20], [150, -90], [170, 60], [-170, 60]]); g.fill();
      g.fillStyle = '#c98a3a'; poly(g, [[-170, -20], [150, -90], [150, -70], [-170, 0]]); g.fill();
      g.fillStyle = '#9c6a2c'; g.fillRect(-170, 60, 340, 30);
      g.restore();
      text(g, '濃厚チーズケーキ', W / 2, 650, 56, { color: '#333', weight: 900, maxW: W - 50 });
      price(W / 2, 740, String(o.price ?? 298), 96);
      foot();
    }
  } };
};

// ── vending machine front ──
S.vending_front = o => {
  const W = 1000, H = 1830;
  const seed = o.seed ?? 1;
  return { w: 1.0, h: 1.83, shape: 'rect', r: 0.0, mount: 'none', emissive: 0.85, depth: 0.004, draw(g) {
    const rng = mulberry(seed * 9973 + 17);
    const body = o.color ?? '#c8102e';
    g.fillStyle = body; g.fillRect(0, 0, W, H);
    // header
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, W, 120);
    text(g, o.brand ?? 'BAY DRINK', 40, 62, 70, { align: 'left', family: EN, weight: 800, ls: 4 });
    text(g, 'おいしい水分補給', W - 40, 62, 40, { align: 'right', weight: 700 });
    // display window (lit)
    const dx = 30, dy = 140, dw = W - 60, dh = 930;
    const gl = g.createLinearGradient(0, dy, 0, dy + dh);
    gl.addColorStop(0, '#ffffff'); gl.addColorStop(1, '#e9eef4');
    fillRR(g, dx, dy, dw, dh, 8, gl);
    const rowsN = 3, colsN = 8, rowH = dh / rowsN, cw = dw / colsN;
    const PAL = [['#c8102e', '#fff'], ['#1a3f8c', '#e6eef9'], ['#0f7a3a', '#fff'], ['#f7b500', '#5a2d00'], ['#3b2214', '#e8c58a'], ['#e4e9ef', '#0a5fb0'], ['#111', '#d8a024'], ['#ff6f1a', '#fff'], ['#7fc7f2', '#fff'], ['#5b8f2a', '#f4f0d2'], ['#efe6cf', '#7a1e1e']];
    for (let r = 0; r < rowsN; r++) {
      const y0 = dy + r * rowH;
      // shelf
      g.fillStyle = '#c9d0d8'; g.fillRect(dx, y0 + rowH - 96, dw, 8);
      const hotRow = r === rowsN - 1;
      for (let c = 0; c < colsN; c++) {
        const cx = dx + cw * (c + 0.5);
        const kind = rng() < 0.45 ? 'pet' : (rng() < 0.6 ? 'can' : 'short');
        const [bc, lc] = PAL[Math.floor(rng() * PAL.length)];
        const base = y0 + rowH - 96;
        if (kind === 'can' || kind === 'short') {
          const ch = kind === 'can' ? 165 : 120, cwid = kind === 'can' ? 66 : 70;
          const gx = g.createLinearGradient(cx - cwid / 2, 0, cx + cwid / 2, 0);
          gx.addColorStop(0, shadeHex(bc, 0.7)); gx.addColorStop(0.35, shadeHex(bc, 1.25)); gx.addColorStop(1, shadeHex(bc, 0.6));
          fillRR(g, cx - cwid / 2, base - ch, cwid, ch, 8, gx);
          g.fillStyle = '#c4c8cc'; g.fillRect(cx - cwid / 2 + 4, base - ch, cwid - 8, 10);
          g.fillStyle = lc; g.fillRect(cx - cwid / 2, base - ch * 0.62, cwid, ch * 0.18);
          fillCircle(g, cx, base - ch * 0.3, cwid * 0.18, lc);
        } else {
          const bh = 220, bw = 70;
          g.save();
          g.beginPath(); g.moveTo(cx - 10, base - bh); g.lineTo(cx + 10, base - bh); g.lineTo(cx + 10, base - bh + 30);
          g.quadraticCurveTo(cx + bw / 2, base - bh + 55, cx + bw / 2, base - bh + 90); g.lineTo(cx + bw / 2, base - 6); g.quadraticCurveTo(cx + bw / 2, base, cx + bw / 2 - 6, base);
          g.lineTo(cx - bw / 2 + 6, base); g.quadraticCurveTo(cx - bw / 2, base, cx - bw / 2, base - 6); g.lineTo(cx - bw / 2, base - bh + 90); g.quadraticCurveTo(cx - bw / 2, base - bh + 55, cx - 10, base - bh + 30); g.closePath();
          const liquid = rng() < 0.4 ? 'rgba(200,225,240,.7)' : (rng() < 0.5 ? 'rgba(186,140,60,.8)' : 'rgba(120,170,70,.75)');
          g.fillStyle = liquid; g.fill(); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.stroke();
          g.restore();
          fillRR(g, cx - 12, base - bh - 18, 24, 22, 4, bc);
          g.fillStyle = bc; g.fillRect(cx - bw / 2, base - bh + 100, bw, 70);
          g.fillStyle = lc; g.fillRect(cx - bw / 2, base - bh + 125, bw, 18);
          g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(cx - bw / 2 + 8, base - bh + 60, 6, bh - 70);
        }
        // hot/cold label, price, button
        const hot = hotRow && c < 5;
        const ly = base + 12;
        fillRR(g, cx - cw / 2 + 6, ly, cw - 12, 26, 4, hot ? '#e2231a' : '#1667c9');
        text(g, hot ? 'あったか〜い' : 'つめた〜い', cx, ly + 14, 17, { maxW: cw - 18, weight: 800 });
        const pr = kind === 'pet' ? 160 : kind === 'can' ? 130 : (rng() < 0.5 ? 110 : 130);
        fillRR(g, cx - cw / 2 + 10, ly + 32, cw - 20, 24, 3, '#111');
        text(g, String(pr), cx, ly + 45, 21, { color: '#ff4b2b', family: '"Courier New",monospace', weight: 700 });
        fillRR(g, cx - 28, ly + 62, 56, 16, 8, rng() < 0.08 ? '#ff3b30' : '#2fe06a');
      }
    }
    // lower panel: ad + money panel
    const py = dy + dh + 20;
    fillRR(g, 30, py, 600, 520, 10, shadeHex(body, 0.82));
    g.save(); rr(g, 30, py, 600, 520, 10); g.clip();
    g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(330, py + 600, 120 + i * 70, Math.PI, 2 * Math.PI); g.lineWidth = 18; g.strokeStyle = 'rgba(255,255,255,.08)'; g.stroke(); }
    g.restore();
    text(g, '冷たい', 330, py + 170, 120, { weight: 900 });
    text(g, 'ひとやすみ。', 330, py + 320, 100, { weight: 900 });
    text(g, '交通系電子マネー使えます', 330, py + 450, 38, { weight: 700, maxW: 560 });
    // money panel
    const mx = 660;
    fillRR(g, mx, py, 310, 520, 10, '#2a2c30');
    fillRR(g, mx + 30, py + 30, 250, 70, 6, '#0a0a0a');
    text(g, '0', mx + 255, py + 66, 50, { color: '#3dff7a', family: '"Courier New",monospace', align: 'right' });
    fillRR(g, mx + 30, py + 120, 110, 110, 10, '#4b4f55'); fillRR(g, mx + 76, py + 140, 18, 70, 4, '#090909');
    text(g, '硬貨', mx + 85, py + 248, 24, { weight: 700 });
    fillRR(g, mx + 165, py + 120, 115, 110, 10, '#4b4f55'); fillRR(g, mx + 180, py + 166, 85, 16, 4, '#090909');
    text(g, '千円札', mx + 222, py + 248, 24, { weight: 700 });
    fillRR(g, mx + 30, py + 280, 250, 110, 12, '#16a5d9');
    text(g, 'IC', mx + 100, py + 336, 54, { family: EN, weight: 800 });
    g.save(); g.strokeStyle = '#fff'; g.lineWidth = 6; for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(mx + 160, py + 336, 14 * i, -0.7, 0.7); g.stroke(); } g.restore();
    fillRR(g, mx + 30, py + 410, 120, 80, 8, '#4b4f55'); text(g, '返却', mx + 90, py + 450, 28, { weight: 700 });
    fillRR(g, mx + 170, py + 410, 110, 80, 8, '#0c0c0c'); text(g, 'おつり', mx + 225, py + 450, 22, { weight: 700 });
    // take-out port
    const ty = py + 545;
    fillRR(g, 120, ty, 760, H - ty - 40, 14, '#1c1d20');
    fillRR(g, 140, ty + 15, 720, H - ty - 75, 10, '#3a3d42');
    text(g, '取出口', W / 2, ty + (H - ty - 40) / 2, 48, { color: '#ddd', weight: 700, ls: 20 });
  } };
};

function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// supplementary plate (補助標識) e.g. "8-20", "ここから", "高速道路"
S.sub_plate = o => {
  const s = o.text ?? 'ここから', W = o.width ? o.width * 1000 : 600, H = 200;
  return { w: W / 1000, h: 0.2, shape: 'rect', r: 0.01, mount: 'none', draw(g) {
    fillRR(g, 0, 0, W, H, 10, '#fff'); strokeRR(g, 10, 10, W - 20, H - 20, 6, '#1d4f9e', 8);
    text(g, s, W / 2, H / 2 + 4, 110, { color: '#1d4f9e', weight: 700, maxW: W - 70, family: /^[\d\-:.]+$/.test(s) ? EN : JP });
  } };
};

export const SIGN_KINDS = Object.keys(S).filter(k => k !== 'sub_plate').concat(['sub_plate']);

// ───────────────────────── rendering / caching ─────────────────────────
const _cache = new Map();
let _aniso = 8;

function stableKey(o) {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(stableKey).join(',') + ']';
  return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + stableKey(o[k])).join(',') + '}';
}
function getSpec(kind, opts) {
  const f = S[kind];
  if (!f) throw new Error(`signs.js: unknown sign kind "${kind}"`);
  return f(opts || {});
}
function renderSpec(spec, canvas, ...args) {
  const ppm = Math.min(2048 / Math.max(spec.w, spec.h), 1600);
  canvas = canvas || document.createElement('canvas');
  const cw = Math.max(16, Math.round(spec.w * ppm)), ch = Math.max(16, Math.round(spec.h * ppm));
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;
  const g = canvas.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cw, ch);
  g.scale(cw / (spec.w * 1000), ch / (spec.h * 1000));
  spec.draw(g, spec.w * 1000, spec.h * 1000, ...args);
  return canvas;
}
function makeTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = _aniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** Canvas only (handy for UI / debug). */
export function signCanvas(kind, opts = {}) {
  return renderSpec(getSpec(kind, opts));
}

export function signTexture(kind, opts = {}) {
  const key = kind + '|' + stableKey(opts);
  let e = _cache.get(key);
  if (!e) {
    const spec = getSpec(kind, opts);
    const canvas = renderSpec(spec);
    e = { texture: makeTexture(canvas), w: spec.w, h: spec.h };
    _cache.set(key, e);
  }
  return { texture: e.texture, w: e.w, h: e.h };
}

export function setSignAnisotropy(n) {
  _aniso = n;
  for (const e of _cache.values()) { e.texture.anisotropy = n; if (e.texture.image) e.texture.needsUpdate = true; }
  for (const t of _dynamic) { t.anisotropy = n; t.needsUpdate = true; }
}
const _dynamic = new Set();

// ───────────────────────── meshes ─────────────────────────
function signShape(spec) {
  const w = spec.w, h = spec.h, s = new THREE.Shape();
  if (spec.shape === 'circle') { s.absarc(0, 0, w / 2, 0, Math.PI * 2, false); return s; }
  if (spec.shape === 'tri_down') {
    const r = 0.03; // rounded corners
    const P = [[-w / 2, h / 2], [w / 2, h / 2], [0, -h / 2]];
    const n = P.length;
    for (let i = 0; i < n; i++) {
      const [px, py] = P[(i + n - 1) % n], [cx, cy] = P[i], [nx, ny] = P[(i + 1) % n];
      const a = Math.hypot(px - cx, py - cy), b = Math.hypot(nx - cx, ny - cy);
      const p1 = [cx + (px - cx) / a * r * 1.7, cy + (py - cy) / a * r * 1.7], p2 = [cx + (nx - cx) / b * r * 1.7, cy + (ny - cy) / b * r * 1.7];
      if (i === 0) s.moveTo(p1[0], p1[1]); else s.lineTo(p1[0], p1[1]);
      s.quadraticCurveTo(cx, cy, p2[0], p2[1]);
    }
    s.closePath();
    return s;
  }
  const r = Math.min(spec.r ?? 0, w / 2, h / 2), x = -w / 2, y = -h / 2;
  if (r <= 0) { s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath(); return s; }
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function remapUV(geo, w, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  uv.needsUpdate = true;
}

const _metal = () => new THREE.MeshStandardMaterial({ color: 0xa9aeb4, metalness: 0.55, roughness: 0.5 });
const _galv = () => new THREE.MeshStandardMaterial({ color: 0x9a9fa5, metalness: 0.6, roughness: 0.45 });
let _sharedMetal, _sharedGalv, _sharedDark;
function metalMat() { return (_sharedMetal ||= _metal()); }
function galvMat() { return (_sharedGalv ||= _galv()); }
function darkMat() { return (_sharedDark ||= new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.4, roughness: 0.6 })); }

/**
 * opts (common to all kinds):
 *   noPost: true          → no posts, origin at sign centre
 *   mount: 'pole'|'twin'|'overhead'|'none'  (override default)
 *   top / bottom          → height (m) of sign top / bottom edge above ground
 *   span, clearance       → overhead gantry span (m) and sign-bottom clearance
 *   plate: '8-20'         → supplementary plate (補助標識) under pole-mounted signs
 *   emissive              → initial emissiveIntensity
 */
export function signMesh(kind, opts = {}) {
  const spec = getSpec(kind, opts);
  let texture, canvas = null;
  if (spec.dynamic) {
    canvas = renderSpec(spec);
    texture = makeTexture(canvas);
    _dynamic.add(texture);
  } else texture = signTexture(kind, opts).texture;

  const group = new THREE.Group();
  group.name = `sign:${kind}`;
  const w = spec.w, h = spec.h, depth = spec.depth ?? 0.012;
  const shape = signShape(spec);

  const faceMat = new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.5, metalness: 0.0,
    emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: opts.emissive ?? spec.emissive ?? 0.0,
  });
  const faceGeo = new THREE.ShapeGeometry(shape, 24);
  remapUV(faceGeo, w, h);
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.position.z = 0.0015;
  face.name = 'face';

  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
  bodyGeo.translate(0, 0, -depth);
  const body = new THREE.Mesh(bodyGeo, depth > 0.05 ? darkMat() : metalMat());
  body.name = 'back';

  const sign = new THREE.Group();
  sign.add(body, face);
  group.add(sign);

  const mount = opts.noPost ? 'none' : (opts.mount ?? spec.mount ?? 'none');
  const postR = w > 2 ? 0.1 : 0.0305;
  const behind = -depth - postR - 0.01;
  if (mount === 'pole') {
    const top = opts.top ?? spec.top ?? 2.5;
    sign.position.y = top - h / 2;
    let poleTop = top - 0.02;
    let bottomEdge = top - h;
    if (opts.plate) {
      const pl = signMesh('sub_plate', { text: opts.plate, width: Math.max(0.5, Math.min(w, 0.9)), noPost: true });
      pl.position.y = bottomEdge - 0.05 - 0.1;
      group.add(pl);
      group.userData.plate = pl;
      bottomEdge -= 0.25;
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.0305, 0.0305, poleTop, 12), galvMat());
    pole.position.set(0, poleTop / 2, behind);
    if (opts.plate) group.userData.plate.position.z = 0;
    group.add(pole);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), galvMat());
    cap.position.set(0, poleTop, behind); group.add(cap);
  } else if (mount === 'twin') {
    const bottom = opts.bottom ?? spec.bottom ?? 2.0;
    sign.position.y = bottom + h / 2;
    const r = w > 2 ? 0.08 : 0.04;
    const H = bottom + h;
    const dx = w > 1.2 ? w * 0.3 : w * 0.35;
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, H, 14), galvMat());
      p.position.set(sx * dx, H / 2, -depth - r - 0.01);
      group.add(p);
    }
  } else if (mount === 'overhead') {
    const clearance = opts.clearance ?? spec.bottom ?? 5.0;
    const span = opts.span ?? Math.max(w + 4, 10);
    sign.position.y = clearance + h / 2;
    const colR = 0.2, H = clearance + h + 0.25;
    for (const sx of [-1, 1]) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(colR, colR * 1.15, H, 16), galvMat());
      c.position.set(sx * span / 2, H / 2, -depth - 0.35);
      group.add(c);
    }
    const bz = -depth - 0.35;
    for (const by of [clearance + h * 0.22, clearance + h * 0.78]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, span, 12), galvMat());
      b.rotation.z = Math.PI / 2; b.position.set(0, by, bz); group.add(b);
    }
    // brackets sign → beam
    for (const sx of [-0.35, 0.35]) {
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.08, h * 0.9, 0.3), galvMat());
      br.position.set(sx * w, clearance + h / 2, -depth - 0.17); group.add(br);
    }
  }

  group.userData.faceMaterial = faceMat;
  group.userData.kind = kind;
  group.userData.size = { w, h };
  group.userData.texture = texture;
  group.userData.lit = (spec.emissive ?? 0) > 0.5;
  if (spec.dynamic) {
    group.userData.setText = (lines) => {
      renderSpec(spec, canvas, lines);
      texture.needsUpdate = true;
    };
  }
  return group;
}
