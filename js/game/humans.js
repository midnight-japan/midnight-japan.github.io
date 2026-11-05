// Procedural stylised-realistic people for the Daikoku PA car meet.
// No external assets: every body part is a smooth parametric surface (lathe / grid) with
// analytic-ish smooth normals. All parts attached to the same rig joint are merged into ONE
// geometry, and every human shares ONE material (vertex colours + per-vertex roughness +
// a small detail atlas), so a person costs ~13 draw calls and ~2-3k triangles.
//
// Rig (Object3D hierarchy, no skeleton):
//   object(root, feet at y=0, faces +Z)
//     hips ─ spine ─ neck(head)
//          │       ├ shoulderL ─ elbowL ─ (handL anchor)
//          │       └ shoulderR ─ elbowR ─ (handR anchor, props)
//          ├ thighL ─ kneeL ─ footL
//          └ thighR ─ kneeR ─ footR
// Character's LEFT side is +X.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ───────────────────────────────────────────────────────────── options ──

export const OUTFIT_OPTIONS = {
  body: ['m', 'f'],
  skin: ['#f6dcc8', '#ecc6a6', '#dcaa84', '#bf8a62', '#8f5d3d', '#5f3b25'],
  hair: ['short', 'undercut', 'long', 'ponytail', 'bun', 'cap', 'beanie', 'bald'],
  hairColor: ['#141110', '#2a1e17', '#46301f', '#6e4a2e', '#a57a4c', '#d6bf94', '#8e8b88', '#8a2f25'],
  top: ['tshirt', 'hoodie', 'jacket_bomber', 'racing_jacket', 'shirt', 'suit', 'sukajan', 'tracksuit'],
  bottom: ['jeans', 'chinos', 'cargo', 'shorts', 'skirt', 'tracksuit'],
  shoes: ['sneakers', 'boots', 'loafers'],
  colors: ['#121418', '#efefea', '#8b8e93', '#1e2c4e', '#2f5f8f', '#7a1d25',
           '#c63d2b', '#de8a2a', '#e3c84b', '#3d5a3b', '#c5b08b', '#5f4a85'],
  accessory: ['none', 'glasses', 'sunglasses', 'mask', 'headphones'],
};

const DENIM = ['#26385a', '#34507a', '#5274a0', '#1c2029', '#3b4458'];

export function defaultOutfit() {
  return {
    body: 'm', skin: '#ecc6a6', hair: 'short', hairColor: '#141110',
    top: 'hoodie', topColor: '#8b8e93', accentColor: '#efefea',
    bottom: 'jeans', bottomColor: '#26385a',
    shoes: 'sneakers', shoeColor: '#efefea',
    accessory: 'none', scale: 1,
  };
}

export function randomOutfit(rng = Math.random) {
  const pick = (a) => a[Math.floor(rng() * a.length) % a.length];
  const wpick = (pairs) => { // [[value, weight], ...]
    let s = 0; for (const p of pairs) s += p[1];
    let r = rng() * s; for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; }
    return pairs[0][0];
  };
  const O = OUTFIT_OPTIONS, C = O.colors;
  const body = rng() < 0.68 ? 'm' : 'f';
  const skin = wpick([[O.skin[0], 3], [O.skin[1], 5], [O.skin[2], 3], [O.skin[3], 1.2], [O.skin[4], 0.6], [O.skin[5], 0.4]]);
  const hair = body === 'm'
    ? wpick([['short', 5], ['undercut', 3], ['cap', 3], ['beanie', 1.5], ['bald', 0.7], ['long', 0.5], ['bun', 0.4], ['ponytail', 0.3]])
    : wpick([['long', 5], ['ponytail', 3], ['bun', 2], ['short', 1.2], ['cap', 1.2], ['beanie', 1]]);
  const hairColor = wpick([[O.hairColor[0], 6], [O.hairColor[1], 4], [O.hairColor[2], 2], [O.hairColor[3], 1.2],
    [O.hairColor[4], 0.8], [O.hairColor[5], 0.6], [O.hairColor[6], 0.4], [O.hairColor[7], 0.3]]);
  const top = wpick([['tshirt', 4], ['hoodie', 4], ['jacket_bomber', 3], ['racing_jacket', 2], ['shirt', 2],
    ['suit', 0.8], ['sukajan', 1.5], ['tracksuit', 1.5]]);
  let bottom = body === 'f'
    ? wpick([['jeans', 4], ['chinos', 1], ['cargo', 1.5], ['shorts', 1], ['skirt', 2.5], ['tracksuit', 0.6]])
    : wpick([['jeans', 5], ['chinos', 2.5], ['cargo', 2.5], ['shorts', 1], ['tracksuit', 0.8]]);
  if (top === 'tracksuit' && rng() < 0.7) bottom = 'tracksuit';
  if (top === 'suit') bottom = 'chinos';
  let topColor = wpick(C.map((c, i) => [c, [5, 3, 3, 3, 1.5, 1.2, 1.2, 0.8, 0.5, 1.5, 1.5, 0.6][i]]));
  if (top === 'shirt') topColor = pick(['#efefea', '#efefea', '#9fb5cf', '#8b8e93', '#121418', '#c5b08b']);
  if (top === 'suit') topColor = pick(['#121418', '#1e2c4e', '#3a3d44']);
  let accentColor = pick(C);
  if (accentColor === topColor) accentColor = topColor === '#efefea' ? '#c63d2b' : '#efefea';
  let bottomColor;
  if (bottom === 'jeans') bottomColor = pick(DENIM);
  else if (bottom === 'chinos') bottomColor = top === 'suit' ? topColor : pick(['#c5b08b', '#1e2c4e', '#121418', '#8b8e93', '#6b5a43']);
  else if (bottom === 'cargo') bottomColor = pick(['#3d5a3b', '#121418', '#c5b08b', '#55524a', '#8b8e93']);
  else if (bottom === 'tracksuit') bottomColor = top === 'tracksuit' ? topColor : pick(['#121418', '#1e2c4e', '#8b8e93']);
  else bottomColor = pick(['#121418', '#c5b08b', '#1e2c4e', '#8b8e93', '#efefea', '#7a1d25', '#3d5a3b']);
  const shoes = top === 'suit' ? 'loafers' : wpick([['sneakers', 7], ['boots', 1.5], ['loafers', 0.8]]);
  const shoeColor = shoes === 'sneakers' ? wpick([['#efefea', 4], ['#121418', 3], ['#c63d2b', 0.6], ['#2f5f8f', 0.6], ['#8b8e93', 1]])
    : shoes === 'boots' ? pick(['#4a3020', '#121418', '#7a5a3a']) : pick(['#121418', '#3a2418']);
  const accessory = wpick([['none', 8], ['glasses', 2], ['sunglasses', 1.2], ['mask', 1.5], ['headphones', 0.6]]);
  const scale = body === 'm' ? 0.95 + rng() * 0.09 : 0.95 + rng() * 0.08;
  return { body, skin, hair, hairColor, top, topColor, accentColor, bottom, bottomColor, shoes, shoeColor, accessory, scale };
}

function normOutfit(o) {
  const d = defaultOutfit();
  const r = Object.assign(d, o || {});
  const O = OUTFIT_OPTIONS;
  for (const k of ['body', 'hair', 'top', 'bottom', 'shoes', 'accessory']) if (!O[k].includes(r[k])) r[k] = d[k];
  r.scale = Math.min(1.15, Math.max(0.85, +r.scale || 1));
  return r;
}

// ──────────────────────────────────────────────────────── proportions ──

const BODY_M = {
  ankleH: 0.085, shinL: 0.43, thighL: 0.43, hipsY: 0.98, hipX: 0.09, hipYOff: -0.035, spineY: 0.07,
  shX: 0.168, shY: 0.345, neckY: 0.415, headC: [0, 0.19, 0.012], head: [0.081, 0.117, 0.100],
  uaL: 0.30, faL: 0.26, handL: 0.18, neckR: 0.05,
  ua: [0.044, 0.044, 0.036], fa: [0.037, 0.041, 0.027], th: [0.080, 0.068, 0.050], sh: [0.050, 0.053, 0.032],
  torso: [[-0.17, 0.160, 0.74], [-0.08, 0.153, 0.74], [0.02, 0.145, 0.72], [0.12, 0.150, 0.70], [0.21, 0.162, 0.67],
    [0.29, 0.170, 0.63], [0.34, 0.171, 0.60], [0.375, 0.166, 0.60], [0.405, 0.142, 0.64], [0.43, 0.10, 0.80], [0.448, 0.07, 0.95], [0.455, 0.062, 1.0]],
  pelvis: [[-0.14, 0.0, 0.8], [-0.132, 0.07, 0.8], [-0.105, 0.125, 0.72], [-0.07, 0.148, 0.72], [-0.02, 0.149, 0.72],
    [0.05, 0.141, 0.73], [0.13, 0.130, 0.74]],
  bust: 0, bustY: 0.25, foot: 1.0,
};
const BODY_F = {
  ankleH: 0.08, shinL: 0.405, thighL: 0.405, hipsY: 0.92, hipX: 0.084, hipYOff: -0.035, spineY: 0.065,
  shX: 0.146, shY: 0.322, neckY: 0.39, headC: [0, 0.18, 0.012], head: [0.077, 0.111, 0.096],
  uaL: 0.28, faL: 0.24, handL: 0.165, neckR: 0.043,
  ua: [0.039, 0.039, 0.031], fa: [0.032, 0.035, 0.024], th: [0.079, 0.066, 0.045], sh: [0.045, 0.049, 0.029],
  torso: [[-0.16, 0.170, 0.74], [-0.08, 0.166, 0.74], [0.02, 0.146, 0.74], [0.11, 0.130, 0.74], [0.19, 0.140, 0.70],
    [0.27, 0.148, 0.66], [0.32, 0.149, 0.62], [0.355, 0.143, 0.62], [0.385, 0.122, 0.66], [0.405, 0.088, 0.82], [0.42, 0.06, 0.95], [0.425, 0.054, 1.0]],
  pelvis: [[-0.13, 0.0, 0.8], [-0.122, 0.07, 0.8], [-0.10, 0.132, 0.74], [-0.06, 0.160, 0.74], [-0.02, 0.162, 0.74],
    [0.05, 0.146, 0.74], [0.12, 0.124, 0.74]],
  bust: 0.022, bustY: 0.235, foot: 0.92,
};
const BODIES = { m: BODY_M, f: BODY_F };
for (const P of [BODY_M, BODY_F]) {
  P.neckTop = P.torso[P.torso.length - 1][0];
  P.standHip = P.hipsY;
  P.legL = P.thighL + P.shinL;
  P.height = P.hipsY + P.spineY + P.neckY + P.headC[1] + P.head[1] + 0.01;
}

// ─────────────────────────────────────────────────────────── helpers ──

const TAU = Math.PI * 2;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function tInterp(tab, x, col) {
  const n = tab.length;
  if (x <= tab[0][0]) return tab[0][col];
  if (x >= tab[n - 1][0]) return tab[n - 1][col];
  let i = 0; while (x > tab[i + 1][0]) i++;
  const t = (x - tab[i][0]) / (tab[i + 1][0] - tab[i][0]);
  const p0 = tab[Math.max(i - 1, 0)][col], p1 = tab[i][col], p2 = tab[i + 1][col], p3 = tab[Math.min(i + 2, n - 1)][col];
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function curve3(a, b, c, s) { // smooth radius along a limb from 3 key radii (s=0, ~0.35, 1)
  return s < 0.35 ? lerp(a, b, sstep(0, 0.35, s)) : lerp(b, c, sstep(0.35, 1, s));
}

const _c = new THREE.Color();
function shade(hex, k) { _c.set(hex); _c.r *= k; _c.g *= k; _c.b *= k; return '#' + _c.getHexString(); }
function mix(h1, h2, t) { const a = new THREE.Color(h1), b = new THREE.Color(h2); return '#' + a.lerp(b, t).getHexString(); }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function luminance(hex) { _c.set(hex); return 0.2126 * _c.r + 0.7152 * _c.g + 0.0722 * _c.b; }

// ───────────────────────────────────────────────────── detail atlas ──
// 1024² canvas. Regions (px): white, knit noise, denim, 3 sukajan back panels.
const ATLAS_W = 1024;
const REG = {
  white: [8, 8, 112, 112],
  knit: [136, 8, 240, 240],
  denim: [392, 8, 240, 240],
  satin: [648, 8, 240, 240],
  suka0: [8, 264, 320, 480],
  suka1: [344, 264, 320, 480],
  suka2: [680, 264, 320, 480],
};
const SUKA_BG = ['#15171d', '#1b294a', '#4f1820'];

function regUV(reg, u, v) { // u,v in [0,1], v=0 = top of region
  return [(reg[0] + u * reg[2]) / ATLAS_W, 1 - (reg[1] + v * reg[3]) / ATLAS_W];
}

let _atlas = null;
function getAtlas() {
  if (_atlas) return _atlas;
  const cv = document.createElement('canvas');
  cv.width = cv.height = ATLAS_W;
  const g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, ATLAS_W, ATLAS_W);
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // knit: subtle noise + faint weave
  {
    const [x0, y0, w, h] = REG.knit;
    const img = g.getImageData(x0 - 8, y0 - 8, w + 16, h + 16);
    for (let y = 0; y < h + 16; y++) for (let x = 0; x < w + 16; x++) {
      const n = 238 + (rnd() - 0.5) * 22 + ((x + y) % 4 < 2 ? 4 : -4) + (y % 6 === 0 ? -6 : 0);
      const k = (y * (w + 16) + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = clamp(n, 0, 255);
    }
    g.putImageData(img, x0 - 8, y0 - 8);
  }
  // denim: diagonal twill + vertical fading streaks + whiskers
  {
    const [x0, y0, w, h] = REG.denim;
    const img = g.getImageData(x0 - 8, y0 - 8, w + 16, h + 16);
    const streak = []; for (let x = 0; x < w + 16; x++) streak.push((rnd() - 0.5) * 18);
    for (let x = 1; x < w + 16; x++) streak[x] = streak[x - 1] * 0.8 + streak[x] * 0.2;
    for (let y = 0; y < h + 16; y++) for (let x = 0; x < w + 16; x++) {
      const tw = ((x + y * 2) % 5) < 2 ? 18 : -6;
      const fade = 14 * Math.exp(-(((y - h * 0.3) / (h * 0.18)) ** 2)) * (0.5 + 0.5 * Math.cos(x / (w + 16) * TAU * 2));
      const n = 205 + tw + streak[x] + fade + (rnd() - 0.5) * 30;
      const k = (y * (w + 16) + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = clamp(n, 0, 255);
    }
    g.putImageData(img, x0 - 8, y0 - 8);
  }
  // satin: soft sheen bands
  {
    const [x0, y0, w, h] = REG.satin;
    const gr = g.createLinearGradient(x0, 0, x0 + w, 0);
    gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.3, '#ffffff'); gr.addColorStop(0.55, '#e4e4e4'); gr.addColorStop(0.8, '#ffffff'); gr.addColorStop(1, '#d8d8d8');
    g.fillStyle = gr; g.fillRect(x0 - 8, y0 - 8, w + 16, h + 16);
  }
  // sukajan backs
  ['suka0', 'suka1', 'suka2'].forEach((k, i) => drawSukajan(g, REG[k], SUKA_BG[i], i, rnd));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  _atlas = tex;
  return tex;
}

function drawSukajan(g, reg, bg, variant, rnd) {
  const [x0, y0, w, h] = reg;
  g.save();
  g.fillStyle = bg; g.fillRect(x0 - 8, y0 - 8, w + 16, h + 16);
  g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  const cx = x0 + w / 2;
  const gold = '#e1b54a', goldD = '#9a6e1c';
  const stitch = (path, fill, stroke, lw = 3) => {
    g.fillStyle = fill; g.fill(path);
    // satin stitch hatch
    g.save(); g.clip(path); g.globalAlpha = 0.18; g.strokeStyle = '#000'; g.lineWidth = 1;
    for (let k = -h; k < w + h; k += 4) { g.beginPath(); g.moveTo(x0 + k, y0); g.lineTo(x0 + k - h * 0.6, y0 + h); g.stroke(); }
    g.restore();
    g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(path);
  };
  if (variant === 1) {
    // rising sun + Mt Fuji + waves
    const sun = new Path2D(); sun.arc(cx, y0 + h * 0.36, w * 0.27, 0, TAU);
    stitch(sun, '#c8272f', gold, 5);
    const fuji = new Path2D();
    fuji.moveTo(x0 + w * 0.02, y0 + h * 0.72); fuji.lineTo(cx - w * 0.12, y0 + h * 0.40);
    fuji.quadraticCurveTo(cx, y0 + h * 0.37, cx + w * 0.12, y0 + h * 0.40); fuji.lineTo(x0 + w * 0.98, y0 + h * 0.72); fuji.closePath();
    stitch(fuji, '#3d5f8f', '#e8e8f0', 3);
    const snow = new Path2D();
    snow.moveTo(cx - w * 0.12, y0 + h * 0.40); snow.quadraticCurveTo(cx, y0 + h * 0.37, cx + w * 0.12, y0 + h * 0.40);
    snow.lineTo(cx + w * 0.2, y0 + h * 0.48); snow.lineTo(cx + w * 0.08, y0 + h * 0.46); snow.lineTo(cx, y0 + h * 0.5);
    snow.lineTo(cx - w * 0.09, y0 + h * 0.46); snow.lineTo(cx - w * 0.2, y0 + h * 0.48); snow.closePath();
    stitch(snow, '#f4f4f4', '#c8c8d0', 2);
    for (let i = 0; i < 4; i++) {
      const wv = new Path2D(); const yy = y0 + h * (0.75 + i * 0.06);
      for (let j = -1; j < 5; j++) { const xx = x0 + j * w * 0.28 + (i % 2) * w * 0.14; wv.moveTo(xx, yy); wv.arc(xx + w * 0.07, yy, w * 0.07, Math.PI, 0); }
      g.lineWidth = 7; g.strokeStyle = i % 2 ? '#e9eef5' : '#4b78b5'; g.stroke(wv);
    }
  } else {
    // dragon (variant 0) / tiger-orange coil (variant 2) circling a pearl, with kanji
    const col = variant === 0 ? gold : '#e58a2c', colD = variant === 0 ? goldD : '#8a3c10';
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, a = t * TAU * 1.35 + 0.6;
      pts.push([cx + Math.cos(a) * w * (0.32 - t * 0.12), y0 + h * (0.22 + t * 0.55) + Math.sin(a) * h * 0.1]);
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) for (let i = 1; i < pts.length; i++) {
      const t = i / pts.length, wdt = lerp(44, 12, t) + (pass === 0 ? 8 : pass === 2 ? -18 : 0);
      if (wdt <= 0) continue;
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1]); g.lineTo(pts[i][0], pts[i][1]);
      g.strokeStyle = pass === 0 ? colD : pass === 1 ? col : '#fff3c0'; g.lineWidth = wdt; g.globalAlpha = pass === 2 ? 0.35 : 1; g.stroke();
    }
    g.globalAlpha = 1;
    g.strokeStyle = colD; g.lineWidth = 2;
    for (let i = 3; i < 56; i += 2) { const p = pts[i], q = pts[i + 1]; const a = Math.atan2(q[1] - p[1], q[0] - p[0]); g.beginPath(); g.arc(p[0], p[1], lerp(14, 5, i / 60), a + 0.6, a + Math.PI - 0.6); g.stroke(); }
    // claws / flames
    g.fillStyle = '#c8272f';
    for (const i of [14, 30, 46]) { const p = pts[i]; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + 28, p[1] - 30, p[0] + 8, p[1] - 52); g.quadraticCurveTo(p[0] + 4, p[1] - 26, p[0] - 12, p[1] - 8); g.fill(); }
    // head
    const hp = pts[0];
    const head = new Path2D(); head.ellipse(hp[0] + 10, hp[1] - 6, 40, 28, -0.3, 0, TAU);
    stitch(head, col, colD, 4);
    g.fillStyle = '#c8272f'; g.beginPath(); g.arc(hp[0] + 22, hp[1] - 12, 5, 0, TAU); g.fill();
    g.strokeStyle = col; g.lineWidth = 4;
    g.beginPath(); g.moveTo(hp[0] - 10, hp[1] - 20); g.quadraticCurveTo(hp[0] - 40, hp[1] - 60, hp[0] - 70, hp[1] - 50); g.stroke();
    g.beginPath(); g.moveTo(hp[0] + 30, hp[1] - 20); g.quadraticCurveTo(hp[0] + 60, hp[1] - 50, hp[0] + 80, hp[1] - 40); g.stroke();
    const pearl = new Path2D(); pearl.arc(cx, y0 + h * 0.48, w * 0.09, 0, TAU);
    stitch(pearl, variant === 0 ? '#f2f2ee' : '#c8272f', col, 4);
  }
  // kanji banner
  g.font = `bold ${Math.round(w * 0.16)}px "Hiragino Mincho ProN","Yu Mincho","Noto Serif JP","Hiragino Sans",serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const txt = ['横須賀', '大黒', '龍虎'][variant];
  g.lineWidth = 8; g.strokeStyle = variant === 1 ? '#7a1d25' : '#1a1a1a'; g.strokeText(txt, cx, y0 + h * 0.1);
  g.fillStyle = variant === 1 ? gold : '#f2f2ee'; g.fillText(txt, cx, y0 + h * 0.1);
  // satin sheen overall (subtle, fades to plain bg at the panel edges so seams vanish)
  const sh = g.createRadialGradient(cx, y0 + h * 0.4, 10, cx, y0 + h * 0.4, w * 0.6);
  sh.addColorStop(0, 'rgba(255,255,255,0.035)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(x0, y0, w, h);
  g.restore();
}

// ─────────────────────────────────────────────────── shared material ──

let _mat = null;
function getMaterial() {
  if (_mat) return _mat;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map: getAtlas(), roughness: 1, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float rough;\nvarying float vRough;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRough = rough;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vRough;')
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vRough;')
      // cheap skin/satin sheen: rim light boosted on low-roughness surfaces
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
        'float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 3.0);\n' +
        'totalEmissiveRadiance += diffuseColor.rgb * rimF * 0.18 * (1.0 - smoothstep(0.45, 0.8, vRough));');
  };
  m.customProgramCacheKey = () => 'human-vrough-v1';
  _mat = m;
  return m;
}

// ───────────────────────────────────────────────────── geometry core ──
// grid(): (nu+1)x(nv+1) vertices from fn(u,v) -> [x,y,z]; u runs around (optionally closed),
// v runs "down" the surface. Smooth normals from central differences on the grid itself.

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3();

function grid(nu, nv, fn, o = {}) {
  const closed = !!o.closed;
  const cols = nu + 1, rows = nv + 1, N = cols * rows;
  const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), uv = new Float32Array(N * 2);
  const col = new Float32Array(N * 3), rgh = new Float32Array(N);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const p = (closed && i === nu) ? null : fn(i / nu, j / nv, i, j);
    const k = (j * cols + i) * 3;
    if (p) { pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2]; }
    else { const k0 = (j * cols) * 3; pos[k] = pos[k0]; pos[k + 1] = pos[k0 + 1]; pos[k + 2] = pos[k0 + 2]; }
  }
  const P = (i, j) => (j * cols + i) * 3;
  const bad = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    let i0, i1;
    if (closed) { const ii = i % nu; i0 = (ii - 1 + nu) % nu; i1 = (ii + 1) % nu; } else { i0 = Math.max(i - 1, 0); i1 = Math.min(i + 1, nu); }
    const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nv);
    const a = P(i1, j), b = P(i0, j), c = P(i, j1), d = P(i, j0);
    _a.set(pos[a] - pos[b], pos[a + 1] - pos[b + 1], pos[a + 2] - pos[b + 2]); // du
    _b.set(pos[c] - pos[d], pos[c + 1] - pos[d + 1], pos[c + 2] - pos[d + 2]); // dv
    _n.crossVectors(_b, _a);
    const L = _n.length(), k = P(i, j);
    if (L < 1e-12 || _a.lengthSq() < 1e-14) { bad.push(i, j); continue; }
    nor[k] = _n.x / L; nor[k + 1] = _n.y / L; nor[k + 2] = _n.z / L;
  }
  for (let q = 0; q < bad.length; q += 2) { // poles: average the neighbouring row
    const i = bad[q], j = bad[q + 1];
    const jn = j === 0 ? 1 : j === nv ? nv - 1 : (j < nv / 2 ? j + 1 : j - 1);
    _n.set(0, 0, 0);
    for (let ii = 0; ii < cols; ii++) { const k = P(ii, jn); _n.x += nor[k]; _n.y += nor[k + 1]; _n.z += nor[k + 2]; }
    if (_n.lengthSq() < 1e-12) _n.set(0, 1, 0);
    _n.normalize(); const k = P(i, j); nor[k] = _n.x; nor[k + 1] = _n.y; nor[k + 2] = _n.z;
  }
  // orientation
  let flip = !!o.flip;
  if (o.orient === 'auto') {
    let cx = 0, cy = 0, cz = 0;
    for (let k = 0; k < N * 3; k += 3) { cx += pos[k]; cy += pos[k + 1]; cz += pos[k + 2]; }
    cx /= N; cy /= N; cz /= N;
    let s = 0;
    for (let k = 0; k < N * 3; k += 3) s += nor[k] * (pos[k] - cx) + nor[k + 1] * (pos[k + 1] - cy) + nor[k + 2] * (pos[k + 2] - cz);
    if (s < 0) flip = !flip;
  }
  if (flip) for (let k = 0; k < N * 3; k++) nor[k] = -nor[k];
  // colour / roughness / uv
  const colorFn = typeof o.color === 'function' ? o.color : null;
  const roughFn = typeof o.rough === 'function' ? o.rough : null;
  const base = new THREE.Color(colorFn ? '#ffffff' : (o.color ?? '#ff00ff'));
  const reg = o.reg || REG.white;
  const mapUV = !!o.reg;
  const uvFn = o.uvFn;
  const cc = new THREE.Color();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const u = i / nu, v = j / nv, idx = j * cols + i;
    let c = base;
    if (colorFn) { cc.set(colorFn(u, v, i, j)); c = cc; }
    col[idx * 3] = c.r; col[idx * 3 + 1] = c.g; col[idx * 3 + 2] = c.b;
    rgh[idx] = roughFn ? roughFn(u, v) : (o.rough ?? 0.8);
    let t;
    if (uvFn) t = uvFn(u, v);
    else if (mapUV) t = regUV(reg, (u * (o.uRep || 1)) % 1.0001, (v * (o.vRep || 1)) % 1.0001);
    else t = regUV(REG.white, 0.5, 0.5);
    uv[idx * 2] = t[0]; uv[idx * 2 + 1] = t[1];
  }
  const index = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * cols + i, b = (j + 1) * cols + i, c = j * cols + i + 1, d = (j + 1) * cols + i + 1;
    const t1 = flip ? [a, c, b] : [a, b, c], t2 = flip ? [b, c, d] : [b, d, c];
    if (!degen(pos, t1)) index.push(t1[0], t1[1], t1[2]);
    if (!degen(pos, t2)) index.push(t2[0], t2[1], t2[2]);
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('rough', new THREE.BufferAttribute(rgh, 1));
  geo.setIndex(index);
  if (o.double) {
    const back = geo.clone();
    const bp = back.attributes.position.array, bn = back.attributes.normal.array;
    for (let k = 0; k < bp.length; k++) { bp[k] -= bn[k] * 0.0025; bn[k] = -bn[k]; }
    const idx = back.index.array;
    for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    geo = mergeGeometries([geo, back], false);
  }
  return geo;
}

function degen(pos, t) {
  const same = (i, j) => Math.abs(pos[i * 3] - pos[j * 3]) + Math.abs(pos[i * 3 + 1] - pos[j * 3 + 1]) + Math.abs(pos[i * 3 + 2] - pos[j * 3 + 2]) < 1e-7;
  return same(t[0], t[1]) || same(t[1], t[2]) || same(t[0], t[2]);
}

// lathe-style surface from a profile [[r, y], ...] listed top -> bottom.
function lathe(profile, nu, o = {}) {
  const phi0 = o.phi0 ?? 0, phi1 = o.phi1 ?? TAU;
  const full = Math.abs(phi1 - phi0 - TAU) < 1e-6;
  const sx = o.sx ?? 1, sz = o.sz ?? 1;
  const nv = profile.length - 1;
  const def = o.deform;
  if (o.rowColor) o = Object.assign({}, o, { color: (u, v, i, j) => o.rowColor[j] });
  return grid(nu, nv, (u, v, i, j) => {
    const [r, y] = profile[j];
    const ph = phi0 + (phi1 - phi0) * u;
    let p = [Math.sin(ph) * r * sx, y, Math.cos(ph) * r * sz];
    if (def) p = def(p, ph, j, y);
    return p;
  }, Object.assign({}, o, { closed: full }));
}

// add colour/rough/uv attributes to a three.js primitive so it can be merged.
function paint(geo, color, rough = 0.8) {
  geo = geo.index ? geo : mergeVerticesSimple(geo);
  const n = geo.attributes.position.count;
  const c = new THREE.Color(color);
  const col = new Float32Array(n * 3), r = new Float32Array(n), uv = new Float32Array(n * 2);
  const t = regUV(REG.white, 0.5, 0.5);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; r[i] = rough; uv[i * 2] = t[0]; uv[i * 2 + 1] = t[1]; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('rough', new THREE.BufferAttribute(r, 1));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}
function mergeVerticesSimple(geo) {
  const n = geo.attributes.position.count; const idx = []; for (let i = 0; i < n; i++) idx.push(i); geo.setIndex(idx); return geo;
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function place(geo, pos, rot, scl) {
  _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
  _q.setFromEuler(_e);
  _m4.compose(_v.set(pos[0], pos[1], pos[2]), _q, scl ? _s.set(scl[0], scl[1], scl[2]) : _s.set(1, 1, 1));
  geo.applyMatrix4(_m4);
  return geo;
}
function blob(color, rough, pos, scl, rot, seg = [6, 4]) { // small ellipsoid feature
  return place(paint(new THREE.SphereGeometry(1, seg[0], seg[1]), color, rough), pos, rot, scl);
}

// capsule-ish limb profile: radius rFn(s) for s in [s0,s1] along -Y (length L), off = cloth offset
function limbProfile(L, rFn, s0, s1, off, capTop, capBot, n, capN = 2) {
  const pts = [];
  if (capTop) {
    const R = rFn(s0) + off, y0 = -s0 * L;
    for (let k = 0; k < capN; k++) { const a = Math.PI / 2 * (1 - k / capN); pts.push([R * Math.cos(a), y0 + R * Math.sin(a)]); }
  } else pts.push([Math.max(0.003, rFn(s0) - 0.002), -s0 * L]);
  for (let k = 0; k <= n; k++) { const s = s0 + (s1 - s0) * k / n; pts.push([rFn(s) + off, -s * L]); }
  if (capBot) {
    const R = rFn(s1) + off, y1 = -s1 * L;
    for (let k = 1; k <= capN; k++) { const a = Math.PI / 2 * k / capN; pts.push([R * Math.cos(a), y1 - R * Math.sin(a)]); }
  } else pts.push([Math.max(0.003, rFn(s1) - 0.002), -s1 * L]);
  return pts;
}

// ────────────────────────────────────────────────── body part shapes ──

function torsoPt(P, ph, y, off) {
  let rx = tInterp(P.torso, y, 1), sz = tInterp(P.torso, y, 2);
  // never narrower than pelvis + trousers below the waist (hem must cover the pants)
  const yh = y + P.spineY;
  if (yh < P.pelvis[P.pelvis.length - 1][0] + 0.05) {
    let rp = tInterp(P.pelvis, yh, 1) + 0.024; const szp = tInterp(P.pelvis, yh, 2);
    const dy = yh - P.hipYOff, R = P.th[0] + 0.024;
    if (Math.abs(dy) < R) rp = Math.max(rp, P.hipX + Math.sqrt(R * R - dy * dy) + 0.004);
    const k = sstep(rx - 0.01, rx + 0.01, rp);
    rx = lerp(rx, Math.max(rx, rp), k); sz = lerp(sz, szp, k * 0.5);
  }
  let x = Math.sin(ph) * (rx + off), z = Math.cos(ph) * (rx * sz + off);
  // shoulder blades / chest flattening
  z -= 0.006 * Math.exp(-(((y - 0.3) / 0.1) ** 2)) * Math.max(0, -Math.cos(ph));
  if (P.bust) {
    const c = Math.cos(ph);
    if (c > 0) {
      let a = Math.abs(Math.atan2(Math.sin(ph), c));
      const lobe = Math.exp(-(((a - 0.42) / 0.3) ** 2));
      const vy = Math.exp(-(((y - P.bustY) / 0.065) ** 2));
      z += P.bust * lobe * vy * c * (1 + off * 6);
    }
  }
  return [x, y, z];
}
function pelvisPt(P, ph, y, off) {
  const rx = tInterp(P.pelvis, y, 1), sz = tInterp(P.pelvis, y, 2);
  let z = Math.cos(ph) * (rx * sz + off);
  // buttocks
  z -= 0.012 * Math.exp(-(((y + 0.06) / 0.05) ** 2)) * Math.max(0, -Math.cos(ph)) * (rx > 0.05 ? 1 : 0);
  return [Math.sin(ph) * (rx + (rx > 0 ? off : 0)), y, z];
}

// torso garment shell. rows y top->bottom. gapFn(y) = half-angle of front opening (0 closed)
function torsoShell(P, o) {
  const off = o.off, yb = o.yb ?? -0.17, yt = o.yt ?? P.neckTop;
  const ys = [];
  const nRows = o.rows ?? 8;
  if (o.topFold !== false) ys.push(yt > P.neckTop - 0.02 ? [yt + 0.004, 'neck'] : [yt - 0.002, 'fold']);
  for (let k = 0; k <= nRows; k++) ys.push([lerp(yt, yb, k / nRows), 'body']);
  if (o.botFold !== false) ys.push([yb + 0.002, 'fold']);
  const gap = o.gap || null;
  const nu = o.nu ?? 12;
  return grid(nu, ys.length - 1, (u, v, i, j) => {
    const [y, kind] = ys[j];
    const g = gap ? gap(y) : 0;
    const ph = o.phiRange ? lerp(o.phiRange[0], o.phiRange[1], u) : g + (TAU - 2 * g) * u;
    if (kind === 'neck') { const r = P.neckR + 0.004 + off * 0.3; return [Math.sin(ph) * r, y, Math.cos(ph) * r * 1.02 + 0.004]; }
    if (kind === 'fold') return torsoPt(P, ph, y, off - 0.007);
    return torsoPt(P, ph, y, off);
  }, Object.assign({ closed: !gap && !o.phiRange }, o));
}

// ──────────────────────────────────────────────────────── head shape ──
function headPt(P, nx, ny, nz, extra = 0) {
  const [ax, ay, az] = P.head;
  let x = nx * (ax + extra), y = ny * (ay + extra), z = nz * (az + extra);
  if (ny < 0) {
    const k = -ny;
    x *= 1 - 0.30 * k * k * (0.6 + 0.4 * Math.max(0, nz));
    if (nz < 0) z *= 1 - 0.45 * k; // back of jaw tucks into neck
    else z *= 1 - 0.10 * k * k;
  } else {
    if (nz < 0) z *= 1 + 0.05 * ny; // occiput
  }
  // flatter face plane & cheek bones
  if (nz > 0) { z -= 0.012 * nz * nz * Math.abs(nx); x *= 1 + 0.03 * nz * (1 - Math.abs(ny)); }
  return [x + P.headC[0], y + P.headC[1], z + P.headC[2]];
}
function headDir(th, ph) { return [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]; }
function headSurf(P, nx, ny, extra = 0, front = true) { // point + normal on the face at sphere coords
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * (front ? 1 : -1);
  const p = headPt(P, nx, ny, nz, extra);
  const e = 0.01;
  const px = headPt(P, nx + e, ny, Math.sqrt(Math.max(0, 1 - (nx + e) ** 2 - ny * ny)), extra);
  const py = headPt(P, nx, ny + e, Math.sqrt(Math.max(0, 1 - nx * nx - (ny + e) ** 2)), extra);
  const a = new THREE.Vector3(px[0] - p[0], px[1] - p[1], px[2] - p[2]);
  const b = new THREE.Vector3(py[0] - p[0], py[1] - p[1], py[2] - p[2]);
  const n = new THREE.Vector3().crossVectors(a, b).normalize();
  if (n.z < 0) n.negate();
  return { p, n };
}
function onFace(geo, P, nx, ny, lift, spin = 0) {
  const { p, n } = headSurf(P, nx, ny);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  if (spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), spin));
  _m4.compose(new THREE.Vector3(p[0] + n.x * lift, p[1] + n.y * lift, p[2] + n.z * lift), q, new THREE.Vector3(1, 1, 1));
  geo.applyMatrix4(_m4);
  return geo;
}

function hairline(ph) { // max polar angle of a normal haircut at azimuth ph (0=front)
  return Math.PI * (0.52 - 0.17 * Math.cos(ph) + 0.02 * Math.cos(2 * ph));
}
function hairShell(P, o) {
  const nu = o.nu ?? 12, nv = o.nv ?? 5;
  return grid(nu, nv, (u, v) => {
    const ph = TAU * u;
    const th = v * (o.thMax ? o.thMax(ph) : hairline(ph));
    const taper = 1 - sstep(o.edge ?? 0.7, 1, v);
    const off = (o.off(th, ph) * taper) + 0.0025;
    const d = headDir(th, ph);
    const p = headPt(P, d[0], d[1], d[2], off);
    if (o.deform) o.deform(p, th, ph, v);
    return p;
  }, { closed: true, color: o.color, rough: o.rough ?? 0.65 });
}

// ─────────────────────────────────────────────── part builders (geo) ──

const TOPS = {
  tshirt:        { sleeve: 0.48, off: 0.008, collar: 'crew' },
  hoodie:        { sleeve: 2, off: 0.016, collar: 'none', hood: true, rib: true, pocket: true, yb: -0.19 },
  jacket_bomber: { sleeve: 2, off: 0.019, collar: 'rib', open: 'zip', inner: true, rib: true, yb: -0.18 },
  racing_jacket: { sleeve: 2, off: 0.016, collar: 'stand', stripes: 'racing', yb: -0.18 },
  shirt:         { sleeve: 1.45, off: 0.010, collar: 'shirt', placket: true, yb: -0.19 },
  suit:          { sleeve: 1.97, off: 0.017, collar: 'none', open: 'v', inner: true, lapel: true, yb: -0.22 },
  sukajan:       { sleeve: 2, off: 0.018, collar: 'rib', back: true, rib: true, satin: true, yb: -0.17 },
  tracksuit:     { sleeve: 2, off: 0.015, collar: 'stand', stripes: 'track', zip: true, yb: -0.18 },
};
const BOTTOMS = {
  jeans:     { off: 0.010, len: 1.0, reg: 'denim', rough: 0.85 },
  chinos:    { off: 0.013, len: 0.99, rough: 0.8 },
  cargo:     { off: 0.016, len: 0.98, rough: 0.85, pockets: true },
  shorts:    { off: 0.018, len: 0.0, thighLen: 0.62, rough: 0.8 },
  skirt:     { off: 0.0, len: 0.0, thighLen: 0.0, skirt: true, rough: 0.75 },
  tracksuit: { off: 0.016, len: 0.985, rough: 0.7, stripes: true },
};

function topInfo(o) {
  const T = TOPS[o.top];
  const sukaVar = hashStr(o.topColor) % 3;
  const main = o.top === 'sukajan' ? SUKA_BG[sukaVar] : o.topColor;
  const rough = T.satin ? 0.38 : o.top === 'racing_jacket' || o.top === 'tracksuit' ? 0.55 : o.top === 'suit' ? 0.7 : 0.88;
  const sleeveColor = o.top === 'sukajan' ? o.topColor : main;
  const inner = o.top === 'suit' ? '#f2f2ee' : (luminance(o.accentColor) > 0.5 ? '#e9e9e4' : '#25272c');
  return { T, main, rough, sleeveColor, inner, sukaVar };
}

function buildTorso(P, o) {
  const parts = [];
  const { T, main, rough, inner, sukaVar } = topInfo(o);
  const off = T.off, yb = T.yb ?? -0.17;
  const knit = !T.satin;
  const accent = o.accentColor;
  const darker = shade(main, 0.72);
  // neck (skin) – tucked into the garment
  if (T.open) {
    // inner layer (shirt / tee) visible in the opening
    const gapIn = T.open === 'v' ? (y) => 0.0 : null;
    parts.push(torsoShell(P, { off: off - 0.008, yb: yb + 0.02, color: inner, rough: 0.85, reg: REG.knit, gap: gapIn, nu: 10, rows: 7 }));
    const gap = T.open === 'v'
      ? (y) => lerp(0.07, 0.78, sstep(0.08, 0.44, y)) + (y < 0.0 ? sstep(0.0, -0.2, y) * 0.25 : 0)
      : (y) => lerp(0.26, 0.42, sstep(0.2, P.neckTop, y));
    if (T.open === 'v') {
      // tie
      parts.push(torsoShell(P, { off: off - 0.003, yb: 0.0, yt: P.neckTop - 0.01, phiRange: [-0.07, 0.07], color: o.accentColor, rough: 0.5, nu: 2, rows: 8, topFold: false, botFold: false }));
      // shirt collar
      parts.push(lathe([[P.neckR + 0.006, P.neckTop + 0.035], [P.neckR + 0.014, P.neckTop + 0.02], [P.neckR + 0.02, P.neckTop - 0.005]], 10,
        { phi0: 0.3, phi1: TAU - 0.3, color: '#f2f2ee', rough: 0.8, double: true }));
    }
    parts.push(torsoShell(P, { off, yb, gap, color: main, rough, reg: knit ? REG.knit : null, nu: 12 }));
    if (T.lapel) {
      for (const sd of [1, -1]) {
        parts.push(torsoShell(P, { off: off + 0.003, yb: 0.06, yt: P.neckTop - 0.005, topFold: false, botFold: false, nu: 2, rows: 8,
          phiRange: sd > 0 ? [0.05, 0.2] : [-0.2, -0.05], color: shade(main, 0.85), rough: 0.55, gap: null }));
      }
    }
    if (T.open === 'zip') {
      // zipper tapes along the opening
      for (const sd of [1, -1]) parts.push(torsoShell(P, { off: off + 0.001, yb, yt: P.neckTop - 0.02, topFold: false, botFold: false, nu: 1, rows: 10,
        phiRange: sd > 0 ? [0.26, 0.31] : [-0.31, -0.26], color: shade(main, 0.6), rough: 0.5, gap: null }));
    }
  } else if (T.back) {
    // sukajan: front panels plain, back panel embroidered (atlas)
    const reg = REG['suka' + sukaVar];
    const w = 1.15;
    parts.push(torsoShell(P, { off, yb, color: main, rough, phiRange: [-Math.PI + w, Math.PI - w], nu: 10 }));
    const ys = [];
    const yt = P.neckTop, nR = 9;
    ys.push([yt + 0.004, 'neck']); for (let k = 0; k <= nR; k++) ys.push([lerp(yt, yb, k / nR), 'body']); ys.push([yb + 0.002, 'fold']);
    parts.push(grid(6, ys.length - 1, (u, v, i, j) => {
      const [y, kind] = ys[j];
      const ph = Math.PI - w + 2 * w * u;
      if (kind === 'neck') { const r = P.neckR + 0.004 + off * 0.3; return [Math.sin(ph) * r, y, Math.cos(ph) * r * 1.02 + 0.004]; }
      return torsoPt(P, ph, y, kind === 'fold' ? off - 0.007 : off);
    }, {
      color: '#ffffff', rough, uvFn: (u, v) => {
        const j = Math.round(v * (ys.length - 1)); const y = ys[j][0];
        return regUV(reg, u, clamp((yt - 0.03 - y) / (yt - 0.03 - yb), 0, 1));
      },
    }));
  } else {
    parts.push(torsoShell(P, { off, yb, color: main, rough, reg: knit ? REG.knit : null, nu: 12 }));
  }
  // waistband rib
  if (T.rib) {
    const ribC = o.top === 'sukajan' ? accent : darker;
    const gap = T.open === 'zip' ? () => 0.26 : null;
    parts.push(torsoShell(P, { off: off + 0.006, yb: yb - 0.004, yt: yb + 0.045, gap, color: ribC, rough: 0.9, reg: REG.knit, nu: 12, rows: 1, topFold: true, botFold: true }));
    if (o.top === 'sukajan') parts.push(torsoShell(P, { off: off + 0.008, yb: yb + 0.012, yt: yb + 0.024, color: main, rough: 0.9, nu: 12, rows: 1, topFold: false, botFold: false }));
  }
  // collars
  const nt = P.neckTop;
  if (T.collar === 'crew') {
    parts.push(lathe([[P.neckR + 0.004, nt + 0.012], [P.neckR + 0.012, nt + 0.008], [P.neckR + 0.016, nt - 0.006]], 12, { color: shade(main, 0.92), rough: 0.9 }));
  } else if (T.collar === 'rib' || T.collar === 'stand') {
    const c = T.collar === 'rib' ? (o.top === 'sukajan' ? accent : darker) : main;
    const g0 = T.open === 'zip' ? 0.4 : 0.06;
    parts.push(lathe([[P.neckR + 0.004, nt + 0.045], [P.neckR + 0.012, nt + 0.048], [P.neckR + 0.016, nt + 0.03], [P.neckR + 0.022, nt - 0.005]], 12,
      { phi0: g0, phi1: TAU - g0, color: c, rough: 0.8, double: true }));
  } else if (T.collar === 'shirt') {
    parts.push(lathe([[P.neckR + 0.006, nt + 0.04], [P.neckR + 0.012, nt + 0.03], [P.neckR + 0.03, nt - 0.012]], 12,
      { phi0: 0.32, phi1: TAU - 0.32, color: shade(main, 0.97), rough: 0.85, double: true }));
  }
  if (T.placket) parts.push(torsoShell(P, { off: off + 0.0015, yb, yt: nt - 0.01, topFold: false, botFold: false, nu: 2, rows: 10, phiRange: [-0.05, 0.05], color: shade(main, 1.06), rough: 0.85 }));
  if (T.zip) parts.push(torsoShell(P, { off: off + 0.0015, yb, yt: nt + 0.03, topFold: false, botFold: false, nu: 1, rows: 10, phiRange: [-0.02, 0.02], color: '#2a2a2e', rough: 0.4 }));
  if (T.hood) {
    // bunched hood behind the neck
    const R0 = 0.085, Rz = 0.07, tube = 0.04;
    parts.push(grid(6, 7, (u, v) => {
      const ps = TAU * u, ph = lerp(Math.PI * 0.5, Math.PI * 1.5, v);
      const tr = tube * Math.pow(Math.sin(Math.PI * v), 0.6) + 0.002;
      const c = [Math.sin(ph) * R0, nt - 0.005, Math.cos(ph) * Rz - 0.02];
      const d = [Math.sin(ph), 0, Math.cos(ph)];
      return [c[0] + d[0] * Math.cos(ps) * tr, c[1] + Math.sin(ps) * tr * 1.3 + 0.02 * (1 - Math.abs(Math.cos(ph))), c[2] + d[2] * Math.cos(ps) * tr];
    }, { color: shade(main, 0.95), rough, orient: 'auto', closed: true }));
    // drawstrings
    for (const sd of [1, -1]) {
      const g = paint(new THREE.CylinderGeometry(0.004, 0.004, 0.13, 5, 1), '#efefea', 0.7);
      const zf = torsoPt(P, 0, 0.36, off)[2] + 0.004;
      parts.push(place(g, [sd * 0.03, 0.34, zf], [0.1, 0, 0]));
    }
    // kangaroo pocket
    parts.push(torsoShell(P, { off: off + 0.006, yb: -0.12, yt: 0.03, topFold: true, botFold: true, nu: 6, rows: 3, phiRange: [-0.8, 0.8], color: shade(main, 0.93), rough }));
  }
  if (T.stripes === 'racing') {
    parts.push(torsoShell(P, { off: off + 0.004, yb: 0.17, yt: 0.25, color: accent, rough: 0.5, nu: 12, rows: 1, topFold: true, botFold: true }));
    parts.push(torsoShell(P, { off: off + 0.004, yb: 0.255, yt: 0.272, color: luminance(accent) > 0.5 ? '#1a1a1a' : '#efefea', rough: 0.5, nu: 12, rows: 1, topFold: true, botFold: true }));
    // chest patches
    for (const sd of [1, -1]) parts.push(torsoShell(P, { off: off + 0.004, yb: 0.29, yt: 0.33, topFold: false, botFold: false, nu: 2, rows: 1,
      phiRange: sd > 0 ? [0.25, 0.65] : [-0.65, -0.25], color: sd > 0 ? '#efefea' : '#d8b13a', rough: 0.6 }));
  }
  if (T.stripes === 'track') {
    for (const sd of [1, -1]) parts.push(torsoShell(P, { off: off + 0.002, yb, yt: nt - 0.02, topFold: false, botFold: false, nu: 1, rows: 8,
      phiRange: sd > 0 ? [0.5, 0.6] : [-0.6, -0.5], color: accent, rough: 0.6 }));
  }
  return parts;
}

function buildPelvis(P, o) {
  const B = BOTTOMS[o.bottom];
  const parts = [];
  const off = Math.max(0.006, B.off * 0.7);
  const tab = P.pelvis;
  const ys = []; for (let k = 0; k <= 6; k++) ys.push(lerp(tab[tab.length - 1][0], tab[0][0], k / 6));
  const color = B.skirt ? '#1d1d20' : o.bottomColor;
  parts.push(grid(12, ys.length - 1, (u, v, i, j) => pelvisPt(P, TAU * u, ys[j], off), {
    closed: true, color, rough: B.rough, reg: B.reg ? REG[B.reg] : REG.knit,
  }));
  // belt for jeans/chinos/cargo
  if (false) {
    const yt = tab[tab.length - 1][0];
    parts.push(grid(12, 3, (u, v, i, j) => pelvisPt(P, TAU * u, [yt - 0.005, yt - 0.006, yt - 0.03, yt - 0.031][j], off + [0, 0.004, 0.004, 0][j]),
      { closed: true, color: '#2a211b', rough: 0.45 }));
  }
  if (B.skirt) {
    const top = 0.06, bot = -0.40;
    const prof = [];
    for (let k = 0; k <= 7; k++) {
      const y = lerp(top, bot, k / 7);
      const r0 = tInterp(tab, Math.max(y, -0.07), 1) + 0.012;
      const flare = Math.max(0, (-0.03 - y)) * 0.32;
      prof.push([r0 + flare, y]);
    }
    prof.push([prof[prof.length - 1][0] - 0.004, bot + 0.002]);
    parts.push(lathe(prof, 14, { sz: 0.82, color: o.bottomColor, rough: B.rough, reg: REG.knit, double: true }));
  }
  return parts;
}

function sleeveInfo(o) {
  const { T, sleeveColor, rough } = topInfo(o);
  return { len: T.sleeve, off: T.off * 0.5 + 0.003, color: sleeveColor, rough, T };
}

function buildUpperArm(P, o, side) {
  const parts = [];
  const r = (s) => curve3(P.ua[0], P.ua[1], P.ua[2], s);
  const L = P.uaL;
  const S = sleeveInfo(o);
  const reg = TOPS[o.top].satin ? null : REG.knit;
  const sx = 0.94;
  if (S.len >= 1) {
    parts.push(lathe(limbProfile(L, r, 0, 1, S.off, true, true, 4), 8, { sx, color: S.color, rough: S.rough, reg }));
  } else {
    parts.push(lathe(limbProfile(L, r, 0, S.len, S.off, true, false, 4), 8, { sx, color: S.color, rough: S.rough, reg }));
    parts.push(lathe(limbProfile(L, r, S.len - 0.08, 1, 0, false, true, 5), 8, { sx, color: o.skin, rough: 0.55 }));
  }
  addSleeveStripes(parts, P, o, side, L, r, 0, Math.min(1, S.len), S.off, sx);
  return parts;
}
function addSleeveStripes(parts, P, o, side, L, r, s0, s1, off, sx) {
  const T = TOPS[o.top];
  if (!T.stripes || s1 <= s0) return;
  const outer = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  const bands = T.stripes === 'racing' ? [[0, 0.18, o.accentColor], [0.24, 0.07, luminance(o.accentColor) > 0.5 ? '#1a1a1a' : '#efefea']]
    : [[-0.16, 0.08, o.accentColor], [0.08, 0.08, o.accentColor]];
  for (const [c, w, col] of bands) {
    const ph = outer + c * side;
    parts.push(lathe(limbProfile(L, r, s0 + 0.04, s1 - 0.02, off + 0.0025, false, false, 6), 1,
      { phi0: ph - w / 2, phi1: ph + w / 2, sx, color: col, rough: 0.55 }));
  }
}

function buildForearm(P, o, side) {
  const parts = [];
  const r = (s) => curve3(P.fa[0], P.fa[1], P.fa[2], s);
  const L = P.faL;
  const S = sleeveInfo(o);
  const reg = TOPS[o.top].satin ? null : REG.knit;
  const sx = (s) => 1;
  const sleeveEnd = S.len >= 1 ? S.len - 1 : 0;
  if (sleeveEnd > 0) {
    const se = Math.min(sleeveEnd, 1.0);
    const rib = S.T.rib;
    const slOff = S.off + (S.T.sleeve >= 2 ? 0.001 : 0);
    const rf = (s) => r(s) + (S.T.sleeve >= 2 ? 0.003 * s : 0);
    if (rib) {
      // sleeve + ribbed cuff in one lathe; cuff colour via duplicated row (hard edge, no extra tris)
      const ribC = o.top === 'sukajan' ? o.accentColor : shade(S.color, 0.75);
      const prof = limbProfile(L, rf, 0, se - 0.1, slOff, true, false, 3).slice(0, -1);
      const cols = prof.map(() => S.color);
      const yc = -(se - 0.1) * L, ye = -se * L;
      prof.push([r(se - 0.1) + S.off - 0.002, yc], [r(se) + S.off - 0.003, ye + 0.004], [r(se) - 0.002, ye]);
      cols.push(ribC, ribC, ribC);
      parts.push(lathe(prof, 8, { rowColor: cols, rough: S.rough, reg, sz: 0.95 }));
    } else {
      parts.push(lathe(limbProfile(L, rf, 0, se, slOff, true, false, 4), 8, { color: S.color, rough: S.rough, reg, sz: 0.95 }));
    }
    if (o.top === 'shirt') // rolled cuff
      parts.push(lathe([[r(se) + S.off - 0.002, -se * L + 0.012], [r(se) + S.off + 0.007, -se * L + 0.008], [r(se) + S.off + 0.007, -se * L - 0.008], [r(se) + 0.001, -se * L - 0.012]], 10, { color: shade(S.color, 0.95), rough: 0.85 }));
    if (o.top === 'suit') // shirt cuff peeking
      parts.push(lathe(limbProfile(L, r, 0.9, 1.0, 0.006, false, false, 1), 8, { color: '#f2f2ee', rough: 0.8 }));
    addSleeveStripes(parts, P, o, side, L, r, 0, rib ? se - 0.1 : se, slOff, 1);
    if (se < 0.98) parts.push(lathe(limbProfile(L, r, se - 0.1, 1, 0, false, true, 2), 8, { color: o.skin, rough: 0.55 }));
    else parts.push(lathe(limbProfile(L, r, 0.88, 1, 0, false, true, 1), 8, { color: o.skin, rough: 0.55 }));
  } else {
    parts.push(lathe(limbProfile(L, r, 0, 1, 0, true, true, 4), 8, { color: o.skin, rough: 0.55 }));
  }
  parts.push(...buildHand(P, o, side));
  return parts;
}

function buildHand(P, o, side) {
  const L = P.handL, y0 = -P.faL + 0.005;
  const wTab = [[0, 0.024], [0.3, 0.040], [0.55, 0.043], [0.8, 0.039], [1, 0.03]];
  const tTab = [[0, 0.018], [0.3, 0.016], [0.55, 0.014], [0.8, 0.011], [1, 0.008]];
  const k = P === BODY_F ? 0.92 : 1;
  const parts = [];
  parts.push(grid(6, 6, (u, v) => {
    const ps = TAU * u;
    const env = v > 0.78 ? Math.sqrt(Math.max(0, 1 - ((v - 0.78) / 0.22) ** 2)) : 1;
    const env0 = v < 0.05 ? Math.sqrt(v / 0.05) * 0.6 + 0.4 : 1;
    const curl = sstep(0.5, 1, v);
    const cx = -side * 0.032 * curl * curl * k, cy = y0 - v * L * (1 - 0.1 * curl);
    const w = tInterp(wTab, v, 1) * env * env0 * k, t = tInterp(tTab, v, 1) * env * env0 * k;
    return [cx + Math.cos(ps) * t, cy, Math.sin(ps) * w + 0.004];
  }, { closed: true, color: o.skin, rough: 0.55, orient: 'auto' }));
  // thumb
  const dir = new THREE.Vector3(-side * 0.45, -0.7, 0.55).normalize();
  const th = lathe(limbProfile(0.05 * k, (s) => lerp(0.013, 0.009, s) * k, 0, 1, 0, true, true, 1), 4, { color: o.skin, rough: 0.55 });
  _q.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  _m4.compose(new THREE.Vector3(-side * 0.008, y0 - 0.03 * k, 0.028 * k), _q, new THREE.Vector3(1, 1, 1));
  th.applyMatrix4(_m4);
  parts.push(th);
  return parts;
}

function legSpec(P) {
  return {
    th: (s) => curve3(P.th[0], P.th[1], P.th[2], s),
    sh: (s) => (s < 0.3 ? lerp(P.sh[0], P.sh[1], sstep(0, 0.3, s)) : lerp(P.sh[1], P.sh[2], sstep(0.3, 0.95, s))),
  };
}
const calf = (s) => -0.010 * Math.exp(-(((s - 0.28) / 0.18) ** 2));

function buildThigh(P, o, side) {
  const parts = [];
  const B = BOTTOMS[o.bottom];
  const { th } = legSpec(P);
  const L = P.thighL;
  const reg = B.reg ? REG[B.reg] : REG.knit;
  const sz = 1.04;
  const tl = B.len > 0 ? 1 : B.thighLen;
  if (tl >= 1) parts.push(lathe(limbProfile(L, th, 0, 1, B.off, true, true, 4), 8, { sz, color: o.bottomColor, rough: B.rough, reg }));
  else {
    if (tl > 0) parts.push(lathe(limbProfile(L, (s) => th(s) + 0.004 * s, 0, tl, B.off, true, false, 5), 8, { sz, color: o.bottomColor, rough: B.rough, reg }));
    parts.push(lathe(limbProfile(L, th, Math.max(0, tl - 0.1), 1, 0, tl <= 0, true, 4), 8, { sz, color: o.skin, rough: 0.55 }));
  }
  if (B.pockets) {
    const g = paint(new THREE.BoxGeometry(0.022, 0.10, 0.085, 1, 1, 1), shade(o.bottomColor, 0.88), B.rough);
    parts.push(place(g, [side * (th(0.55) + B.off - 0.002), -0.55 * L, 0.004], [0, 0, side * 0.04]));
  }
  if (B.stripes) parts.push(lathe(limbProfile(L, th, 0.02, 0.98, B.off + 0.002, false, false, 6), 1,
    { phi0: side * Math.PI / 2 - 0.08, phi1: side * Math.PI / 2 + 0.08, sz, color: '#efefea', rough: 0.6 }));
  return parts;
}

function buildShin(P, o, side) {
  const parts = [];
  const B = BOTTOMS[o.bottom];
  const { sh } = legSpec(P);
  const L = P.shinL;
  const reg = B.reg ? REG[B.reg] : REG.knit;
  const def = (p, ph, j, y) => { p[2] += calf(-y / L) * Math.max(0, -Math.cos(ph)) * 1.4; return p; };
  if (B.len > 0) {
    const flare = o.bottom === 'cargo' ? 0.012 : o.bottom === 'chinos' ? 0.006 : 0.002;
    parts.push(lathe(limbProfile(L, (s) => sh(s) + flare * s * s, 0, B.len, B.off, true, false, 4), 8, { color: o.bottomColor, rough: B.rough, reg, deform: def }));
    if (o.bottom === 'cargo' || o.bottom === 'tracksuit') // cuffed hem
      parts.push(lathe(limbProfile(L, sh, B.len - 0.06, B.len, B.off - 0.002, false, false, 1), 8, { color: shade(o.bottomColor, 0.85), rough: B.rough }));
    if (B.stripes) parts.push(lathe(limbProfile(L, sh, 0.0, B.len - 0.06, B.off + 0.002, false, false, 6), 1,
      { phi0: side * Math.PI / 2 - 0.08, phi1: side * Math.PI / 2 + 0.08, color: '#efefea', rough: 0.6, deform: def }));
    if (B.len < 0.98) parts.push(lathe(limbProfile(L, sh, 0.86, 1, 0, false, true, 2), 8, { color: o.skin, rough: 0.55 }));
  } else {
    parts.push(lathe(limbProfile(L, sh, 0, 1, 0, true, true, 5), 8, { color: o.skin, rough: 0.55, deform: def }));
    // socks
    if (o.shoes !== 'boots') parts.push(lathe(limbProfile(L, sh, 0.84, 1, 0.003, false, false, 2), 8, { color: o.shoes === 'loafers' ? '#202024' : '#f2f2ee', rough: 0.9 }));
  }
  return parts;
}

function buildFoot(P, o, side) {
  const parts = [];
  const k = P.foot;
  const kind = o.shoes;
  const soleH = kind === 'sneakers' ? 0.026 : kind === 'boots' ? 0.024 : 0.012;
  const Z0 = -0.068 * k, Z1 = 0.205 * k;
  const ground = -P.ankleH;
  const base = ground + soleH;
  const env = (t) => t > 0.78 ? Math.sqrt(Math.max(0, 1 - ((t - 0.78) / 0.22) ** 2)) : t < 0.14 ? Math.sqrt(Math.max(0, 1 - ((0.14 - t) / 0.14) ** 2)) : 1;
  const wTab = [[0, 0.034], [0.25, 0.039], [0.6, 0.048], [0.85, 0.045], [1, 0.042]];
  let hTab = kind === 'boots'
    ? [[0, 0.17], [0.22, 0.17], [0.38, 0.10], [0.6, 0.06], [0.85, 0.042], [1, 0.03]]
    : kind === 'loafers'
      ? [[0, 0.055], [0.25, 0.06], [0.5, 0.05], [0.75, 0.033], [1, 0.022]]
      : [[0, 0.072], [0.25, 0.084], [0.5, 0.068], [0.75, 0.05], [1, 0.042]];
  const upperC = o.shoeColor;
  const rough = kind === 'loafers' ? 0.38 : kind === 'boots' ? 0.6 : 0.75;
  const zAt = (t) => lerp(Z0, Z1, t);
  const outward = (t) => side * 0.006 * sstep(0.4, 1, t); // toes splay a bit outward
  parts.push(grid(8, 8, (u, v) => {
    const ps = TAU * u, t = 0.5 - 0.5 * Math.cos(Math.PI * v);
    const e = env(t);
    const w = tInterp(wTab, t, 1) * k * Math.pow(e, 0.8), h = tInterp(hTab, t, 1) * Math.pow(e, 0.45), hb = 0.012 * Math.pow(e, 0.5);
    const s = Math.sin(ps);
    let y = base + (s > 0 ? s * h : s * hb);
    // boot shaft is a cylinder around the ankle
    let x = Math.cos(ps) * w + outward(t);
    if (kind === 'boots' && t < 0.3) x = Math.cos(ps) * Math.max(w, 0.044 * e);
    return [x, y, zAt(t)];
  }, { closed: true, color: upperC, rough, orient: 'auto' }));
  // sole
  const soleC = kind === 'sneakers' ? '#f4f4f0' : kind === 'boots' ? '#2a2420' : '#1d1612';
  const rows = [[0.0, base], [1, base - 0.002], [1, ground + 0.004], [0, ground]];
  const zc = lerp(Z0, Z1, 0.5);
  parts.push(grid(14, rows.length - 1, (u, v, i, j) => {
    const sd = u < 0.5 ? 1 : -1;
    const tl = u < 0.5 ? u * 2 : 2 - u * 2, t = 0.5 - 0.5 * Math.cos(Math.PI * tl);
    const [f, y] = rows[j];
    const w = tInterp(wTab, t, 1) * k * env(t) * 1.07 + 0.002;
    const z = zc + (zAt(t) + (t < 0.5 ? -0.004 : 0.006) - zc) * f;
    return [sd * w * f + outward(t) * f, y, z];
  }, { closed: true, color: soleC, rough: 0.85, orient: 'auto' }));
  if (false) {
    // side panel accent stripe
    const acc = luminance(upperC) > 0.6 ? '#1e2c4e' : '#f4f4f0';
    for (const sd of [1, -1]) {
      const g = paint(new THREE.BoxGeometry(0.003, 0.012, 0.08, 1, 1, 1), acc, 0.6);
      parts.push(place(g, [sd * (0.046 * k) + side * 0.003, base + 0.02, 0.06 * k], [0.25, sd * 0.08, 0]));
    }
  }
  return parts;
}

function buildHead(P, o) {
  const parts = [];
  // neck + head
  parts.push(lathe(limbProfile(0.13, () => P.neckR - 0.003, 0, 1, 0, false, false, 1).map(([r, y]) => [r, y + 0.11]), 8, { color: o.skin, rough: 0.55 }));
  parts.push(grid(12, 9, (u, v) => {
    const d = headDir(v * Math.PI, TAU * u);
    return headPt(P, d[0], d[1], d[2], 0);
  }, { closed: true, color: o.skin, rough: 0.5 }));
  // ears
  for (const sd of [1, -1]) {
    const e = headPt(P, sd * 0.98, -0.05, -0.1, 0);
    parts.push(blob(shade(o.skin, 0.95), 0.55, [e[0] + sd * 0.004, e[1], e[2]], [0.009, 0.025, 0.016], [0, sd * 0.35, 0], [5, 3]));
  }
  // face
  const browC = shade(o.hairColor, o.hair === 'bald' ? 0.9 : 1.0);
  const lip = mix(o.skin, '#9c4a46', 0.35);
  for (const sd of [1, -1]) {
    parts.push(onFace(paint(new THREE.SphereGeometry(1, 6, 3), '#f1ece4', 0.35).scale(0.0135, 0.0078, 0.004), P, sd * 0.35, 0.0, 0.0005));
    parts.push(onFace(paint(new THREE.SphereGeometry(1, 5, 3), '#2a1a12', 0.25).scale(0.0064, 0.0068, 0.003), P, sd * 0.34, 0.0, 0.0035));
    parts.push(onFace(paint(new THREE.SphereGeometry(1, 4, 3), browC, 0.8).scale(0.016, 0.0037, 0.004), P, sd * 0.36, 0.22, 0.001, sd * -0.12));
    // eyelid crease / upper lash line
    parts.push(onFace(paint(new THREE.SphereGeometry(1, 4, 3), shade(o.skin, 0.5), 0.6).scale(0.0145, 0.0022, 0.003), P, sd * 0.35, 0.065, 0.002, sd * -0.08));
  }
  parts.push(onFace(paint(new THREE.SphereGeometry(1, 5, 3), shade(o.skin, 0.96), 0.5).scale(0.011, 0.022, 0.016), P, 0, -0.22, -0.005, 0));
  parts.push(onFace(paint(new THREE.SphereGeometry(1, 6, 3), lip, 0.45).scale(0.018, 0.004, 0.004), P, 0, -0.56, 0.0, 0));
  parts.push(...buildHair(P, o));
  parts.push(...buildAccessory(P, o));
  return parts;
}

function buildHair(P, o) {
  const parts = [];
  const c = o.hairColor;
  const hr = 0.6;
  const shell = (offFn, opts = {}) => hairShell(P, Object.assign({ off: offFn, color: c, rough: hr }, opts));
  switch (o.hair) {
    case 'short':
      parts.push(shell((th, ph) => 0.010 + 0.012 * Math.max(0, Math.cos(ph)) * (1 - th / 1.6) + 0.006 * Math.cos(th)));
      break;
    case 'undercut':
      parts.push(shell(() => 0.003, { color: mix(c, o.skin, 0.28), rough: 0.85 }));
      parts.push(shell((th, ph) => 0.022 + 0.01 * Math.max(0, Math.cos(ph)), { thMax: (ph) => Math.PI * (0.30 + 0.06 * Math.cos(ph) + 0.06 * Math.max(0, -Math.cos(ph))), edge: 0.55 }));
      break;
    case 'long':
    case 'ponytail':
    case 'bun': {
      const long = o.hair === 'long';
      parts.push(shell((th, ph) => (long ? 0.014 : 0.008) + 0.004 * Math.cos(th), { thMax: (ph) => hairline(ph) + (long ? 0.08 : 0.04) }));
      if (long) {
        // back sheet falling to shoulders, framing the face
        const a0 = 0.40 * Math.PI, a1 = 1.60 * Math.PI;
        parts.push(grid(10, 4, (u, v) => {
          const ph = lerp(a0, a1, u);
          const th0 = Math.PI * 0.42;
          const d = headDir(th0, ph);
          const top = headPt(P, d[0], d[1], d[2], 0.016);
          const yb = P.headC[1] - 0.25 + 0.07 * Math.abs(Math.sin(ph)) ** 2 + 0.012 * Math.sin(ph * 11);
          const y = lerp(top[1], yb, v);
          const grow = 1 + 0.25 * v * (1 - v * 0.4);
          const side = Math.abs(Math.sin(ph));
          let x = top[0] * grow, z = (top[2] - P.headC[2]) * grow + P.headC[2] - 0.02 * v;
          if (Math.cos(ph) > -0.2) z -= 0.03 * v * side; // front strands sit behind shoulders' front
          return [x, y, z];
        }, { color: c, rough: hr, double: true, orient: 'auto' }));
      } else if (o.hair === 'ponytail') {
        const pts = [[0, 0.06, -0.085], [0, 0.03, -0.13], [0, -0.04, -0.15], [0, -0.13, -0.135], [0, -0.20, -0.12]].map(p => new THREE.Vector3(p[0], p[1] + P.headC[1], p[2] + P.headC[2]));
        const cv = new THREE.CatmullRomCurve3(pts);
        parts.push(grid(7, 8, (u, v) => {
          const p = cv.getPointAt(v), t = cv.getTangentAt(v);
          const n1 = new THREE.Vector3(1, 0, 0), n2 = new THREE.Vector3().crossVectors(t, n1).normalize();
          const r = (0.018 + 0.016 * Math.sin(Math.PI * Math.min(1, v * 1.2))) * (v > 0.85 ? Math.sqrt((1 - v) / 0.15) : 1) + 0.001;
          const a = TAU * u;
          return [p.x + n1.x * Math.cos(a) * r * 1.2 + n2.x * Math.sin(a) * r, p.y + n2.y * Math.sin(a) * r, p.z + n2.z * Math.sin(a) * r];
        }, { closed: true, color: c, rough: hr, orient: 'auto' }));
        parts.push(place(paint(new THREE.TorusGeometry(0.016, 0.006, 5, 10), '#1c1c1c', 0.5), [0, P.headC[1] + 0.052, P.headC[2] - 0.11], [0.9, 0, 0]));
      } else {
        parts.push(blob(c, hr, [0, P.headC[1] + 0.085, P.headC[2] - 0.065], [0.045, 0.04, 0.045], [0, 0, 0], [8, 6]));
      }
      break;
    }
    case 'cap': {
      parts.push(shell(() => 0.006, { thMax: (ph) => hairline(ph) + 0.02 }));
      const cc = o.accentColor === o.topColor ? '#121418' : o.accentColor;
      parts.push(hairShell(P, { off: () => 0.02, color: cc, rough: 0.8, thMax: (ph) => Math.PI * (0.40 - 0.03 * Math.cos(ph)), edge: 0.96, nv: 6 }));
      // brim
      parts.push(grid(8, 2, (u, v) => {
        const a = lerp(-1.15, 1.15, u);
        const d = headDir(Math.PI * 0.37, a);
        const p0 = headPt(P, d[0], d[1], d[2], 0.02);
        const out = v * 0.075 * (0.55 + 0.45 * Math.cos(a * 0.9));
        return [p0[0] + Math.sin(a) * out * 0.8, p0[1] - v * 0.012 - 0.006 * v * Math.cos(a), p0[2] + Math.cos(a) * out];
      }, { color: cc, rough: 0.8, double: true, orient: 'auto' }));
      parts.push(blob(cc, 0.8, [0, P.headC[1] + P.head[1] + 0.022, P.headC[2]], [0.009, 0.005, 0.009]));
      break;
    }
    case 'beanie': {
      parts.push(shell(() => 0.005, { thMax: (ph) => hairline(ph) + 0.06 }));
      const bc = o.accentColor;
      parts.push(hairShell(P, { off: (th) => 0.018 + 0.012 * Math.cos(th * 0.8), color: bc, rough: 0.95, thMax: (ph) => Math.PI * (0.47 - 0.05 * Math.cos(ph)), edge: 0.97, nv: 7 }));
      // cuff
      parts.push(grid(14, 3, (u, v) => {
        const ph = TAU * u, th = Math.PI * (0.47 - 0.05 * Math.cos(ph)) - v * 0.32;
        const d = headDir(th, ph);
        return headPt(P, d[0], d[1], d[2], [0.019, 0.03, 0.03, 0.022][Math.round(v * 3)]);
      }, { closed: true, color: shade(bc, 0.9), rough: 0.95, orient: 'auto', reg: REG.knit }));
      break;
    }
    case 'bald':
    default:
      break;
  }
  return parts;
}

function buildAccessory(P, o) {
  const parts = [];
  const eye = (sd) => headSurf(P, sd * 0.34, 0.0);
  switch (o.accessory) {
    case 'glasses':
    case 'sunglasses': {
      const sun = o.accessory === 'sunglasses';
      const fc = sun ? '#111111' : '#2a2420';
      for (const sd of [1, -1]) {
        const { p } = eye(sd);
        const z = p[2] + 0.012;
        if (sun) parts.push(blob('#0d0f12', 0.12, [p[0], p[1] - 0.002, z], [0.02, 0.015, 0.004], [0, sd * 0.25, 0], [8, 5]));
        parts.push(place(paint(new THREE.TorusGeometry(0.018, sun ? 0.0028 : 0.0022, 4, 12), fc, 0.4), [p[0], p[1], z], [0, sd * 0.25, 0], [1.1, 0.82, 1]));
        // temple arm
        const ear = headPt(P, sd * 0.98, 0.02, -0.15, 0.004);
        const a = new THREE.Vector3(p[0] + sd * 0.019, p[1], z - 0.004), b = new THREE.Vector3(ear[0] + sd * 0.002, ear[1], ear[2]);
        const len = a.distanceTo(b);
        const g = paint(new THREE.BoxGeometry(0.003, 0.004, len), fc, 0.4);
        g.lookAt(new THREE.Vector3().subVectors(b, a));
        parts.push(place(g, [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2]));
      }
      const { p } = eye(1);
      parts.push(place(paint(new THREE.CylinderGeometry(0.002, 0.002, 0.02, 4), fc, 0.4), [0, p[1] + 0.004, p[2] + 0.014], [0, 0, Math.PI / 2]));
      break;
    }
    case 'mask': {
      parts.push(grid(10, 5, (u, v) => {
        const nx = lerp(-0.86, 0.86, u);
        const ny = lerp(-0.10, -0.98, v) * (1 - 0.15 * nx * nx);
        const nz = Math.sqrt(Math.max(0.0, 1 - nx * nx - ny * ny));
        const p = headPt(P, nx, ny, Math.max(nz, 0.05), 0.006);
        const nose = 0.012 * Math.exp(-((nx / 0.25) ** 2)) * Math.exp(-(((ny + 0.25) / 0.25) ** 2));
        p[2] += nose + 0.006 * (1 - Math.abs(nx)) * Math.max(0, -ny - 0.6);
        return p;
      }, { color: '#f4f5f6', rough: 0.9, orient: 'auto', reg: REG.knit }));
      break;
    }
    case 'headphones': {
      const top = P.headC[1], R = P.head[0] + 0.03;
      const hb = paint(new THREE.TorusGeometry(R, 0.007, 5, 14, Math.PI), '#1b1b1d', 0.4);
      hb.scale(1, (P.head[1] + 0.03) / R, 1);
      parts.push(place(hb, [0, top - 0.005, P.headC[2] - 0.01]));
      for (const sd of [1, -1]) parts.push(place(paint(new THREE.CylinderGeometry(0.03, 0.032, 0.026, 12), '#1b1b1d', 0.4), [sd * (P.head[0] + 0.012), top - 0.01, P.headC[2] - 0.01], [0, 0, Math.PI / 2]));
      break;
    }
    default: break;
  }
  return parts;
}

// props (shared, not per outfit)
let _props = null;
function getProps() {
  if (_props) return _props;
  const phone = mergeGeometries([
    paint(new THREE.BoxGeometry(0.072, 0.148, 0.009), '#17181b', 0.35),
    place(paint(new THREE.BoxGeometry(0.064, 0.136, 0.001), '#5d8fd0', 0.15), [0, 0, 0.0048]),
    place(paint(new THREE.CylinderGeometry(0.008, 0.008, 0.003, 8), '#2a2b30', 0.2), [-0.02, 0.055, -0.006], [Math.PI / 2, 0, 0]),
  ], false);
  const can = mergeGeometries([
    paint(new THREE.CylinderGeometry(0.026, 0.026, 0.09, 12), '#7a3b1e', 0.35),
    place(paint(new THREE.CylinderGeometry(0.0265, 0.0265, 0.03, 12), '#e1b54a', 0.3), [0, 0.012, 0]),
    place(paint(new THREE.CylinderGeometry(0.022, 0.026, 0.012, 12), '#c9c9cc', 0.25), [0, 0.051, 0]),
  ], false);
  const cig = mergeGeometries([
    paint(new THREE.CylinderGeometry(0.0038, 0.0038, 0.055, 6), '#f2f2ee', 0.8),
    place(paint(new THREE.CylinderGeometry(0.0039, 0.0039, 0.02, 6), '#d39a52', 0.8), [0, -0.037, 0]),
    place(paint(new THREE.CylinderGeometry(0.0036, 0.0036, 0.004, 6), '#ff6a1a', 0.9), [0, 0.0295, 0]),
  ], false);
  _props = { phone, can, cig };
  return _props;
}

// ───────────────────────────────────────────── geometry cache (refcount) ──
const _cache = new Map();
function cached(key, build) {
  let e = _cache.get(key);
  if (!e) {
    const parts = build();
    const geo = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    geo.computeBoundingSphere();
    e = { geo, refs: 0 };
    _cache.set(key, e);
  }
  e.refs++;
  return e.geo;
}
function release(key) {
  const e = _cache.get(key);
  if (!e) return;
  if (--e.refs <= 0) { e.geo.dispose(); _cache.delete(key); }
}

function partKeys(o) {
  const b = o.body;
  const top = [o.top, o.topColor, o.accentColor].join();
  return {
    pelvis: ['pelvis', b, o.bottom, o.bottomColor].join('|'),
    torso: ['torso', b, o.skin, top].join('|'),
    head: ['head', b, o.skin, o.hair, o.hairColor, o.accessory, o.hair === 'cap' || o.hair === 'beanie' ? o.accentColor + o.topColor : ''].join('|'),
    uaL: ['ua', b, 1, o.skin, top].join('|'), uaR: ['ua', b, -1, o.skin, top].join('|'),
    faL: ['fa', b, 1, o.skin, top].join('|'), faR: ['fa', b, -1, o.skin, top].join('|'),
    thL: ['th', b, 1, o.skin, o.bottom, o.bottomColor].join('|'), thR: ['th', b, -1, o.skin, o.bottom, o.bottomColor].join('|'),
    shL: ['sh', b, 1, o.skin, o.bottom, o.bottomColor, o.shoes].join('|'), shR: ['sh', b, -1, o.skin, o.bottom, o.bottomColor, o.shoes].join('|'),
    ftL: ['ft', b, 1, o.shoes, o.shoeColor].join('|'), ftR: ['ft', b, -1, o.shoes, o.shoeColor].join('|'),
  };
}
const BUILDERS = {
  pelvis: (P, o) => buildPelvis(P, o), torso: (P, o) => buildTorso(P, o), head: (P, o) => buildHead(P, o),
  uaL: (P, o) => buildUpperArm(P, o, 1), uaR: (P, o) => buildUpperArm(P, o, -1),
  faL: (P, o) => buildForearm(P, o, 1), faR: (P, o) => buildForearm(P, o, -1),
  thL: (P, o) => buildThigh(P, o, 1), thR: (P, o) => buildThigh(P, o, -1),
  shL: (P, o) => buildShin(P, o, 1), shR: (P, o) => buildShin(P, o, -1),
  ftL: (P, o) => buildFoot(P, o, 1), ftR: (P, o) => buildFoot(P, o, -1),
};

// ──────────────────────────────────────────────────────────── poses ──

const CH = ['hipH', 'hipX', 'hipZ', 'hipsX', 'hipsY', 'hipsZ', 'spineX', 'spineY', 'spineZ', 'neckX', 'neckY', 'neckZ',
  'lShX', 'lShY', 'lShZ', 'lElX', 'lElY', 'rShX', 'rShY', 'rShZ', 'rElX', 'rElY',
  'lThX', 'lThY', 'lThZ', 'lKnX', 'lFtX', 'lFtZ', 'rThX', 'rThY', 'rThZ', 'rKnX', 'rFtX', 'rFtZ'];
function newPose() { const p = {}; for (const k of CH) p[k] = 0; return p; }

// two-bone IK for one leg; target = ankle position in root space; writes thigh/knee/foot channels
function legIK(pose, P, side, tx, ty, tz, footPitch = 0) {
  const hx = pose.hipsX, hz = pose.hipsZ;
  // hip joint in root space: hips pos + Rx(hx)*Rz(hz)*(side*hipX, hipYOff, 0)
  let ox = side * P.hipX, oy = P.hipYOff, oz = 0;
  let x1 = ox * Math.cos(hz) - oy * Math.sin(hz), y1 = ox * Math.sin(hz) + oy * Math.cos(hz), z1 = oz;
  let y2 = y1 * Math.cos(hx) - z1 * Math.sin(hx), z2 = y1 * Math.sin(hx) + z1 * Math.cos(hx);
  const jx = pose.hipX + x1, jy = pose.hipH + y2, jz = pose.hipZ + z2;
  let dx = tx - jx, dy = ty - jy, dz = tz - jz;
  // into hips local: Rz(-hz) * Rx(-hx)
  let ey = dy * Math.cos(-hx) - dz * Math.sin(-hx), ez = dy * Math.sin(-hx) + dz * Math.cos(-hx);
  let fx = dx * Math.cos(-hz) - ey * Math.sin(-hz), fy = dx * Math.sin(-hz) + ey * Math.cos(-hz);
  dx = fx; dy = fy; dz = ez;
  const L1 = P.thighL, L2 = P.shinL;
  const roll = Math.atan2(dx, -dy);
  const down = -Math.sqrt(dx * dx + dy * dy);
  let D = Math.hypot(dz, down);
  D = clamp(D, Math.abs(L1 - L2) + 0.02, (L1 + L2) * 0.9995);
  const aT = Math.atan2(dz, -down);
  const A = Math.acos(clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
  const K = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
  const thX = -(aT + A), knX = K;
  const s = side > 0 ? 'l' : 'r';
  pose[s + 'ThX'] = thX; pose[s + 'ThZ'] = roll; pose[s + 'KnX'] = knX;
  pose[s + 'FtX'] = footPitch - hx - thX - knX;
  pose[s + 'FtZ'] = -roll - hz;
}

function poseStand(c, pose) {
  const { P, time: t, seed } = c;
  const br = Math.sin(t * 1.7 + seed) * 0.5 + 0.5;
  const sway = Math.sin(t * 0.37 + seed * 2.1);
  pose.hipH = P.standHip - 0.005;
  pose.hipX = sway * 0.012;
  pose.hipsZ = -sway * 0.025;
  pose.spineZ = sway * 0.02;
  pose.spineX = 0.02 + br * 0.012;
  pose.neckX = -0.03 - br * 0.01;
  pose.neckY = Math.sin(t * 0.23 + seed * 3) * 0.12;
  const armOut = 0.10;
  pose.lShZ = armOut + br * 0.01; pose.rShZ = armOut + br * 0.01;
  pose.lShX = 0.03; pose.rShX = 0.03;
  pose.lElX = -0.18; pose.rElX = -0.18;
  pose.lElY = 0.0; pose.rElY = 0.0;
  pose.lThY = 0.12; pose.rThY = -0.12;
  legIK(pose, P, 1, 0.105, P.ankleH, 0.01);
  legIK(pose, P, -1, -0.105, P.ankleH, -0.01);
  return pose;
}

function poseLoco(c, pose) {
  const { P, speed, phase, gait: g } = c;
  const st = lerp(0.6, 0.36, g);
  const cyc = cycleLen(speed, g);
  const S = st * cyc;
  const lift = lerp(0.075, 0.2, g);
  const legOf = (p, side) => {
    let z, y = P.ankleH, pitch = 0;
    if (p < st) {
      const q = p / st;
      z = S / 2 - S * q;
      if (z < -0.08) pitch = Math.min(0.9, (-z - 0.08) * lerp(3.2, 2.4, g));
      if (q < 0.15 && g < 0.5) pitch = -0.25 * (1 - q / 0.15) * (1 - g * 2);
      y = footY(P, pitch);
    } else {
      const q = (p - st) / (1 - st);
      z = -S / 2 + S * sstep(0, 1, q);
      pitch = lerp(0.75, -0.15, sstep(0, 0.9, q));
      y = footY(P, pitch) + Math.sin(Math.PI * q) * lift + (1 - q) * 0.01 * g * 3;
      if (g > 0) z -= g * 0.12 * Math.sin(Math.PI * q) * (1 - q);
    }
    return [side * lerp(0.1, 0.085, g), y, z, pitch];
  };
  const ph = phase;
  const pL = ph, pR = (ph + 0.5) % 1;
  const bobW = lerp(0.028, 0.045, g);
  const bob = g < 0.5 ? 0.5 + 0.5 * Math.cos(4 * Math.PI * (ph - 0.05)) : 0.5 + 0.5 * Math.cos(4 * Math.PI * (ph - st / 2));
  pose.hipH = P.standHip - lerp(0.03, 0.075, g) - bob * bobW * (g < 0.5 ? 1 : -1) - (g >= 0.5 ? bobW : 0);
  pose.hipX = Math.sin(TAU * ph) * lerp(0.018, 0.008, g);
  pose.hipsZ = -Math.sin(TAU * ph) * 0.03;
  pose.hipsX = lerp(0.0, 0.14, g);
  pose.hipsY = -Math.cos(TAU * ph) * lerp(0.08, 0.12, g);
  pose.spineY = Math.cos(TAU * ph) * lerp(0.12, 0.2, g);
  pose.spineX = lerp(0.02, 0.1, g);
  pose.neckX = -lerp(0.02, 0.18, g);
  pose.neckY = -pose.spineY - pose.hipsY;
  const sw = lerp(0.32, 0.75, g) * clamp(speed / 1.2, 0.3, 1);
  pose.lShX = sw * Math.cos(TAU * ph) - 0.05;
  pose.rShX = -sw * Math.cos(TAU * ph) - 0.05;
  pose.lShZ = pose.rShZ = lerp(0.1, 0.16, g);
  pose.lElX = -lerp(0.25, 1.5, g) + Math.min(0, -0.25 * Math.cos(TAU * ph + Math.PI)) * (1 - g);
  pose.rElX = -lerp(0.25, 1.5, g) + Math.min(0, -0.25 * Math.cos(TAU * ph)) * (1 - g);
  pose.lShY = pose.rShY = -0.1 * g;
  const a = legOf(pL, 1), b = legOf(pR, -1);
  pose.lThY = 0.08; pose.rThY = -0.08;
  legIK(pose, P, 1, a[0], a[1], a[2], a[3]);
  legIK(pose, P, -1, b[0], b[1], b[2], b[3]);
  return pose;
}
// ankle height that keeps toe (pitch>0) or heel (pitch<0) on the ground
function footY(P, pitch) { return P.ankleH * Math.cos(pitch) + (pitch > 0 ? 0.19 * P.foot : 0.07 * P.foot) * Math.sin(Math.abs(pitch)) + 0.002; }
function cycleLen(speed, g) { return lerp(clamp(0.45 + 0.57 * speed, 0.6, 1.7), clamp(1.0 + 0.42 * speed, 1.6, 3.8), g); }

const ACTIONS = {
  talk(c, p) {
    poseStand(c, p);
    const t = c.time + c.seed * 5;
    const g1 = Math.sin(t * 2.3) * 0.5 + 0.5, g2 = Math.sin(t * 1.7 + 1.3) * 0.5 + 0.5;
    p.rShX = -0.35 - 0.25 * g1; p.rShZ = 0.18; p.rElX = -1.25 - 0.3 * Math.sin(t * 3.1); p.rElY = -0.6; p.rShY = 0.2;
    p.lShX = -0.15 - 0.2 * g2 * (Math.sin(t * 0.5) > 0 ? 1 : 0.2); p.lShZ = 0.14; p.lElX = -0.6 - 0.6 * g2; p.lElY = -0.5;
    p.neckX = 0.04 * Math.sin(t * 2.7); p.neckY += 0.05 * Math.sin(t * 1.1);
    p.spineY = 0.06 * Math.sin(t * 0.9);
    return p;
  },
  phone(c, p) {
    poseStand(c, p);
    const t = c.time + c.seed;
    p.rShX = -0.42; p.rShZ = -0.05; p.rShY = 0.25; p.rElX = -1.75; p.rElY = -0.9;
    p.lShX = 0.0; p.lShZ = 0.1; p.lElX = -0.35; p.lElY = 0; p.lShY = 0;
    p.neckX = 0.5 + 0.03 * Math.sin(t * 0.7); p.neckY = 0.05; p.spineX = 0.08;
    return p;
  },
  photo(c, p) {
    poseStand(c, p);
    const t = c.time + c.seed;
    p.rShX = -1.42; p.rShZ = 0.02; p.rShY = -0.22; p.rElX = -0.95; p.rElY = 0.3;
    p.lShX = -1.42; p.lShZ = 0.02; p.lShY = -0.22; p.lElX = -0.95; p.lElY = 0.3;
    p.neckX = 0.05 + 0.02 * Math.sin(t); p.spineX = -0.02;
    legIK(p, c.P, 1, 0.13, c.P.ankleH, 0.08);
    legIK(p, c.P, -1, -0.12, c.P.ankleH, -0.1);
    return p;
  },
  crouch(c, p) {
    const { P } = c; const t = c.time + c.seed;
    p.hipH = P.standHip * 0.47; p.hipZ = -0.06; p.hipsX = 0.32; p.spineX = 0.32; p.neckX = 0.35 + 0.05 * Math.sin(t * 0.6);
    p.neckY = 0.15 * Math.sin(t * 0.4);
    p.lShX = -0.55; p.lShZ = 0.25; p.lElX = -1.1; p.lElY = -0.3;
    p.rShX = -0.95 - 0.08 * Math.sin(t * 1.3); p.rShZ = 0.12; p.rElX = -0.35; p.rElY = -0.6;
    p.lThY = 0.25; p.rThY = -0.25;
    legIK(p, P, 1, 0.16, P.ankleH, 0.12, 0.0);
    legIK(p, P, -1, -0.15, footY(P, 0.55), -0.06, 0.55);
    return p;
  },
  lean(c, p) {
    const { P } = c; const t = c.time + c.seed;
    const br = Math.sin(t * 1.5) * 0.5 + 0.5;
    p.hipH = P.standHip - 0.05; p.hipZ = -0.02; p.hipsX = -0.12; p.spineX = -0.06 + br * 0.01; p.neckX = 0.12;
    p.neckY = Math.sin(t * 0.21) * 0.25;
    // arms crossed
    p.lShX = -0.3; p.lShZ = 0.12; p.lShY = -0.95; p.lElX = -1.75; p.lElY = 0.0;
    p.rShX = -0.36; p.rShZ = 0.14; p.rShY = -0.95; p.rElX = -1.65; p.rElY = 0.0;
    p.lThY = 0.1; p.rThY = -0.15;
    legIK(p, P, 1, 0.04, P.ankleH, 0.30);
    legIK(p, P, -1, -0.16, P.ankleH, 0.24);
    return p;
  },
  smoke(c, p) {
    poseStand(c, p);
    const t = (c.time + c.seed * 7) % 7;
    const up = sstep(0.0, 0.9, t) * (1 - sstep(2.4, 3.3, t));
    p.lShX = -0.2; p.lShZ = 0.1; p.lShY = -0.85; p.lElX = -1.5; p.lElY = 0;
    p.rShX = lerp(-0.15, -0.3, up); p.rShZ = lerp(0.12, -0.32, up); p.rShY = lerp(0.1, 0.2, up); p.rElX = lerp(-1.2, -2.45, up); p.rElY = lerp(-0.4, -0.8, up);
    p.neckX = lerp(0.0, -0.08, up) + 0.02; p.neckY = lerp(p.neckY, 0.08, up);
    return p;
  },
  drink(c, p) {
    poseStand(c, p);
    const t = (c.time + c.seed * 5) % 6;
    const up = sstep(0.0, 0.7, t) * (1 - sstep(1.8, 2.5, t));
    p.rShX = lerp(-0.25, -0.35, up); p.rShZ = lerp(0.12, -0.28, up); p.rShY = 0.15; p.rElX = lerp(-1.35, -2.4, up); p.rElY = lerp(-0.9, -1.0, up);
    p.lShZ = 0.12; p.lElX = -0.25;
    p.neckX = lerp(0.05, -0.32, up); p.spineX = lerp(0.02, -0.06, up);
    return p;
  },
  wave(c, p) {
    poseStand(c, p);
    const t = c.time + c.seed;
    p.rShZ = 2.35; p.rShX = -0.15; p.rShY = 0.0; p.rElX = -0.55 + 0.35 * Math.sin(t * 9); p.rElY = 0;
    p.rShZ += 0.1 * Math.sin(t * 9 + 0.5);
    p.spineZ = 0.05; p.neckZ = -0.04;
    return p;
  },
  sit(c, p) {
    const { P } = c; const t = c.time + c.seed;
    p.hipH = 0.30; p.hipZ = 0; p.hipsX = -0.42; p.spineX = 0.12; p.neckX = 0.28 + 0.02 * Math.sin(t * 0.5);
    p.neckY = 0.08 * Math.sin(t * 0.3);
    p.lShX = -0.95; p.lShZ = 0.0; p.lShY = -0.15; p.lElX = -0.8; p.lElY = -0.6;
    p.rShX = -0.95; p.rShZ = 0.0; p.rShY = -0.15; p.rElX = -0.8; p.rElY = -0.6;
    p.lThY = 0.08; p.rThY = -0.08;
    legIK(p, P, 1, 0.13, P.ankleH + 0.05, 0.74, -0.35);
    legIK(p, P, -1, -0.13, P.ankleH + 0.05, 0.74, -0.35);
    return p;
  },
  enter(c, p) { return poseEnter(c, p, c.t); },
  exit(c, p) { return poseEnter(c, p, 1 - c.t); },
};
ACTIONS.idle = poseStand;
ACTIONS.walk = poseLoco;
ACTIONS.run = poseLoco;

const _tmpA = newPose(), _tmpB = newPose();
function poseEnter(c, p, t) {
  t = clamp(t ?? 0, 0, 1);
  const P = c.P;
  const duck = (q) => {
    q.hipH = P.standHip * 0.66; q.hipZ = 0.05; q.hipsX = 0.65; q.spineX = 0.3; q.neckX = 0.1;
    q.lShX = -0.5; q.lShZ = 0.35; q.lElX = -0.4; q.rShX = -0.9; q.rShZ = 0.3; q.rElX = -0.3;
    q.lThY = 0.1; q.rThY = -0.1;
    legIK(q, P, 1, 0.2, P.ankleH + 0.12, 0.35, -0.2); // leading leg lifted into car
    legIK(q, P, -1, -0.12, footY(P, 0.2), -0.05, 0.2);
    return q;
  };
  let a, b, k;
  for (const ch of CH) { _tmpA[ch] = 0; _tmpB[ch] = 0; }
  if (t < 0.5) { a = poseStand(c, _tmpA); b = duck(_tmpB); k = sstep(0, 0.5, t); }
  else { a = duck(_tmpA); b = ACTIONS.sit(c, _tmpB); k = sstep(0.5, 1, t); }
  for (const ch of CH) p[ch] = lerp(a[ch], b[ch], k);
  return p;
}

// ─────────────────────────────────────────────────────────── Human ──

const JOINT_NAMES = ['pelvis', 'torso', 'head', 'uaL', 'uaR', 'faL', 'faR', 'thL', 'thR', 'shL', 'shR', 'ftL', 'ftR'];
let _seedCounter = 0;

class Human {
  constructor(outfit) {
    this.object = new THREE.Group();
    this.object.name = 'human';
    const J = (name, parent) => { const o = new THREE.Object3D(); o.name = name; parent.add(o); return o; };
    const root = this.object;
    this.hips = J('hips', root);
    this.spine = J('spine', this.hips);
    this.neck = J('neck', this.spine);
    this.shoulderL = J('shoulderL', this.spine); this.shoulderR = J('shoulderR', this.spine);
    this.elbowL = J('elbowL', this.shoulderL); this.elbowR = J('elbowR', this.shoulderR);
    this.handL = J('handL', this.elbowL); this.handR = J('handR', this.elbowR);
    this.thighL = J('thighL', this.hips); this.thighR = J('thighR', this.hips);
    this.kneeL = J('kneeL', this.thighL); this.kneeR = J('kneeR', this.thighR);
    this.footL = J('footL', this.kneeL); this.footR = J('footR', this.kneeR);
    for (const j of [this.shoulderL, this.shoulderR, this.thighL, this.thighR]) j.rotation.order = 'ZYX';
    const mat = getMaterial();
    const attach = { pelvis: this.hips, torso: this.spine, head: this.neck, uaL: this.shoulderL, uaR: this.shoulderR,
      faL: this.elbowL, faR: this.elbowR, thL: this.thighL, thR: this.thighR, shL: this.kneeL, shR: this.kneeR, ftL: this.footL, ftR: this.footR };
    this.meshes = {};
    for (const n of JOINT_NAMES) {
      const m = new THREE.Mesh(undefined, mat);
      m.castShadow = true; m.receiveShadow = false; m.name = n;
      attach[n].add(m);
      this.meshes[n] = m;
    }
    // props
    const props = getProps();
    this.props = {};
    for (const k of ['phone', 'can', 'cig']) {
      const m = new THREE.Mesh(props[k], mat); m.visible = false; m.castShadow = true; m.name = 'prop_' + k;
      this.handR.add(m); this.props[k] = m;
    }
    this._keys = null;
    this.seed = (_seedCounter++ * 0.618 % 1) * 10 + Math.random() * 3;
    this.time = Math.random() * 10;
    this.phase = Math.random();
    this.gait = 0;
    this.weights = new Map([['idle', 1]]);
    this.pose = newPose();
    this._scratch = newPose();
    this.lookTarget = null;
    this._look = { yaw: 0, pitch: 0 };
    this.setOutfit(outfit);
    this.update(0, { speed: 0, action: 'idle' });
  }

  setOutfit(outfit) {
    const o = normOutfit(outfit);
    this.outfit = o;
    const P = BODIES[o.body];
    this.P = P;
    const keys = partKeys(o);
    for (const n of JOINT_NAMES) this.meshes[n].geometry = cached(keys[n], () => BUILDERS[n](P, o));
    if (this._keys) for (const n of JOINT_NAMES) release(this._keys[n]);
    this._keys = keys;
    // joint layout
    this.spine.position.set(0, P.spineY, 0);
    this.neck.position.set(0, P.neckY, -0.005);
    this.shoulderL.position.set(P.shX, P.shY, -0.008); this.shoulderR.position.set(-P.shX, P.shY, -0.008);
    this.elbowL.position.set(0, -P.uaL, 0); this.elbowR.position.set(0, -P.uaL, 0);
    this.handL.position.set(-0.012, -P.faL - 0.075, 0.012); this.handR.position.set(0.012, -P.faL - 0.075, 0.012);
    this.thighL.position.set(P.hipX, P.hipYOff, 0); this.thighR.position.set(-P.hipX, P.hipYOff, 0);
    this.kneeL.position.set(0, -P.thighL, 0); this.kneeR.position.set(0, -P.thighL, 0);
    this.footL.position.set(0, -P.shinL, 0); this.footR.position.set(0, -P.shinL, 0);
    this.object.scale.setScalar(o.scale);
    this.height = (P.height + (o.hair === 'bald' ? 0 : o.hair === 'bun' ? 0.03 : 0.015)) * o.scale;
    this.trianglesPerPerson = this.countTriangles();
  }

  countTriangles() {
    let t = 0;
    for (const n of JOINT_NAMES) { const g = this.meshes[n].geometry; t += (g.index ? g.index.count : g.attributes.position.count) / 3; }
    return t;
  }

  lookAt(target) {
    if (!target) { this.lookTarget = null; return; }
    if (!this.lookTarget) this.lookTarget = new THREE.Vector3();
    this.lookTarget.copy(target);
  }

  update(dt, state = {}) {
    dt = Math.min(dt || 0, 0.1);
    const speed = Math.max(0, state.speed || 0);
    let action = state.action || (speed > 0.15 ? 'walk' : 'idle');
    if (!ACTIONS[action]) action = 'idle';
    this.time += dt;
    // locomotion collapses idle/walk/run into one blended action
    const loco = action === 'idle' || action === 'walk' || action === 'run';
    const key = loco ? 'loco' : action;
    const gTarget = action === 'run' || (action !== 'walk' && speed > 2.8) ? 1 : 0;
    this.gait += (gTarget - this.gait) * Math.min(1, dt * 4);
    if (loco || speed > 0) this.phase = (this.phase + speed * dt / cycleLen(Math.max(speed, 0.3), this.gait)) % 1;
    // blend weights (~0.25 s)
    const rate = dt / 0.25;
    if (!this.weights.has(key)) this.weights.set(key, dt === 0 && this.weights.size === 0 ? 1 : 0);
    if (dt === 0) { this.weights.clear(); this.weights.set(key, 1); }
    let sum = 0;
    for (const [k, w] of this.weights) {
      const nw = k === key ? Math.min(1, w + rate) : Math.max(0, w - rate);
      if (nw <= 0 && k !== key) this.weights.delete(k); else { this.weights.set(k, nw); sum += nw; }
    }
    const ctx = { P: this.P, time: this.time, seed: this.seed, speed, phase: this.phase, gait: this.gait, t: state.t ?? 0 };
    const pose = this.pose;
    for (const ch of CH) pose[ch] = 0;
    for (const [k, w] of this.weights) {
      const s = this._scratch; for (const ch of CH) s[ch] = 0;
      if (k === 'loco') {
        const move = sstep(0.05, 0.6, speed);
        if (move < 1) { poseStand(ctx, s); for (const ch of CH) pose[ch] += s[ch] * (1 - move) * w / sum; }
        if (move > 0) { for (const ch of CH) s[ch] = 0; poseLoco(ctx, s); for (const ch of CH) pose[ch] += s[ch] * move * w / sum; }
      } else {
        ACTIONS[k](ctx, s);
        for (const ch of CH) pose[ch] += s[ch] * w / sum;
      }
    }
    // look-at (additive, clamped, smoothed)
    let ty = 0, tp = 0;
    if (this.lookTarget) {
      this.object.updateWorldMatrix(true, false);
      _v.copy(this.lookTarget); this.object.worldToLocal(_v);
      const hy = this.P.height * 0.92;
      ty = clamp(Math.atan2(_v.x, _v.z), -1.2, 1.2);
      if (Math.abs(Math.atan2(_v.x, _v.z)) > 2.2) ty = 0;
      tp = clamp(-Math.atan2(_v.y - hy, Math.hypot(_v.x, _v.z)), -0.5, 0.45);
    }
    const k = 1 - Math.exp(-dt * 6);
    this._look.yaw += (ty - this._look.yaw) * (dt === 0 ? 1 : k);
    this._look.pitch += (tp - this._look.pitch) * (dt === 0 ? 1 : k);
    const lookW = (this.weights.get('sit') || 0) + (this.weights.get('enter') || 0) + (this.weights.get('exit') || 0) > 0.5 ? 0.6 : 1;
    this.applyPose(pose, this._look.yaw * lookW, this._look.pitch * lookW);
    // props
    const w = (n) => this.weights.get(n) || 0;
    this.props.phone.visible = w('phone') + w('photo') > 0.5;
    this.props.can.visible = w('drink') > 0.5;
    this.props.cig.visible = w('smoke') > 0.5;
    if (this.props.phone.visible) {
      if (w('photo') > w('phone')) { this.props.phone.rotation.set(0.0, 0.3, Math.PI / 2); this.props.phone.position.set(0.05, 0.0, 0.035); }
      else { this.props.phone.rotation.set(-1.2, 0.0, 0.25); this.props.phone.position.set(0.01, -0.0, 0.03); }
    }
    if (this.props.can.visible) { this.props.can.position.set(0.012, 0.0, 0.028); this.props.can.rotation.set(0, 0, 0); }
    if (this.props.cig.visible) { this.props.cig.position.set(-0.02, -0.04, 0.035); this.props.cig.rotation.set(1.3, 0, 0); }
  }

  applyPose(p, lookYaw = 0, lookPitch = 0) {
    this.hips.position.set(p.hipX, p.hipH, p.hipZ);
    this.hips.rotation.set(p.hipsX, p.hipsY, p.hipsZ);
    this.spine.rotation.set(p.spineX, p.spineY + lookYaw * 0.25, p.spineZ);
    this.neck.rotation.set(p.neckX + lookPitch, p.neckY + lookYaw * 0.75, p.neckZ);
    this.shoulderL.rotation.set(p.lShX, p.lShY, p.lShZ);
    this.shoulderR.rotation.set(p.rShX, -p.rShY, -p.rShZ);
    this.elbowL.rotation.set(p.lElX, p.lElY, 0);
    this.elbowR.rotation.set(p.rElX, -p.rElY, 0);
    this.thighL.rotation.set(p.lThX, p.lThY, p.lThZ);
    this.thighR.rotation.set(p.rThX, p.rThY, p.rThZ);
    this.kneeL.rotation.set(p.lKnX, 0, 0);
    this.kneeR.rotation.set(p.rKnX, 0, 0);
    this.footL.rotation.set(p.lFtX, 0, p.lFtZ);
    this.footR.rotation.set(p.rFtX, 0, p.rFtZ);
  }

  dispose() {
    if (this._keys) for (const n of JOINT_NAMES) release(this._keys[n]);
    this._keys = null;
    this.object.removeFromParent();
  }
}

export function createHuman(outfit) { return new Human(outfit); }
export { Human };

// ─────────────────────────────────────────────────────────── name tag ──

export function createNameTag(text) {
  const font = '"Hiragino Sans","Noto Sans JP","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
  const px = 44, pad = 22, dpr = 2;
  const cv = document.createElement('canvas');
  const g = cv.getContext('2d');
  g.font = `600 ${px}px ${font}`;
  const tw = Math.ceil(g.measureText(String(text)).width);
  const w = tw + pad * 2, h = px + pad * 1.2;
  cv.width = w * dpr; cv.height = h * dpr;
  g.scale(dpr, dpr);
  g.fillStyle = 'rgba(14,16,20,0.72)';
  const r = h / 2;
  g.beginPath();
  if (g.roundRect) g.roundRect(0, 0, w, h, r);
  else { g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.closePath(); }
  g.fill();
  g.font = `600 ${px}px ${font}`;
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(text), w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  const worldH = 0.15;
  sp.scale.set(worldH * w / h, worldH, 1);
  sp.center.set(0.5, 0);
  sp.renderOrder = 10;
  sp.userData.dispose = () => { tex.dispose(); mat.dispose(); };
  return sp;
}
