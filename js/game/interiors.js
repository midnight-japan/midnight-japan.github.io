// Per-car cockpits: what each car looks like from the driver's seat.
// SPEC (below) describes every drivable car's interior — instrument cluster layout & backlight, steering wheel,
// seats, shifter / handbrake, centre-stack signature pieces (R34 MFD, R32/R33 console triple gauges, Z33 dash pods,
// JZA80 driver-wrapped stack, FL5 honeycomb strip, taxi meter, police radio …) and colours/materials.
// buildInterior() turns a spec into geometry fitted to the procedural body (P, S); drawCockpit() paints the live
// cluster / MFD / auxiliary gauges; makeMirrors() gives the rear-view and door mirrors real (low-res, round-robin)
// reflections. No trademarks: steering-wheel centres, clusters and seats are generic shapes without logos or names.
// Local axes as in carmodel.js: +Z forward, +Y up, +X = car's left (RHD driver sits at -X).
import * as THREE from 'three';
import { Kit, T, M, roundedBox, profileX, padGeo, helpers, fabricTex, honeyTex } from './carparts.js';

const { clamp, lerp, sstep } = helpers;
const TAU = Math.PI * 2;

// ───────────────────────── specs ─────────────────────────
// cluster: analog layouts (twin, tri, r34, r35, fd, nsx, sti, e46, opti, p911, jimny, single) or screen layouts
//          (tft:<variant>, s2000, lfa, none). light = numeral backlight colour at night, needle colour, face colour.
// wheel: '2' | '3' | '4' | 'momo' (thin metal spokes, small horn button); pad: airbag | round | small
// seat: bucket (Recaro-style shell, integrated headrest + harness slots) | sport | comfort | bench
// knob: ball | ti | leather | teardrop | at | dct | pdk | dashAT | puck | none ; hb: lever | pedal | button | stick
// screen: radio | nav | float | dual | tesla | wide | lid | inset | none ; extras: signature details
const DEF = {
  cls: 'sport', cluster: 'twin', light: '#eef3f6', needle: '#ff5418', face: '#040506', speedMax: 180, tachMax: 0,
  binW: 0.32, binH: 0.12, binHood: 'arch', binDx: 0,
  dash: 0x26272a, dashTop: null, trim: 'gloss', head: 0x3c3c3f, carpet: 0x151516,
  wheel: '3', wheelR: 0.18, pad: 'airbag', flat: false, paddles: false, spokeMat: 'leather', stitch: 'none', marker: 'none',
  seat: 'sport', seatSide: 0x1c1c1e, seatIns: 0x2b2b2f, insType: 'fabric', seatStitch: null,
  knob: 'leather', rev: 'R', hb: 'lever', screen: 'radio', extras: [], eye: [0, 0], pitch: 0.07, switchLight: '#ff9a3c',
};
const SPEC = {
  r32: { cluster: 'twin', smallMid: true, light: '#dff3e6', tachMax: 9000, wheel: '4', pad: 'round', dash: 0x26272a, trim: 'dash', seatSide: 0x232427, seatIns: 0x4a4c52, head: 0x55565a, extras: ['triple'], switchLight: '#7dffa0' },
  r33: { cluster: 'tri', speedLeft: true, tachMax: 9000, light: '#e8f0ff', wheel: '4', dash: 0x232428, trim: 'dash', seatIns: 0x363c4a, head: 0x4a4a4e, extras: ['triple'], switchLight: '#7dffa0' },
  r34: { cluster: 'r34', tachMax: 9000, speedMax: 320, light: '#fbf4e8', needle: '#ff6a1a', boost: true, wheel: '3', dash: 0x1d1e21, trim: 'carbon', seatSide: 0x18191b, seatIns: 0x3a3e4c, head: 0x38383b, extras: ['mfd'], knob: 'ball', rev: 'L' },
  r35: { cluster: 'r35', tachMax: 9000, speedMax: 340, light: '#ffffff', needle: '#ff3018', wheel: '3', flat: true, paddles: true, dash: 0x161618, trim: 'carbon', seatSide: 0x141416, seatIns: 0x161618, insType: 'leather', stitch: 'red', head: 0x202022, knob: 'dct', hb: 'pedal', screen: 'inset', extras: ['mfd35', 'start'] },
  s15: { cluster: 'tri', tachMax: 9000, light: '#f4f6ff', boost: false, wheel: '3', trim: 'satin', seatIns: 0x2d3a55, extras: ['boostPod'], stitch: 'blue' },
  rps13: { cluster: 'twin', smallMid: true, boost: true, tachMax: 8000, light: '#f0f4f2', wheel: '4', trim: 'dash', seatIns: 0x3a3a3e },
  z33: { cluster: 'tri', tachMax: 9000, speedMax: 260, light: '#ffb070', needle: '#ff6a1a', wheel: '3', trim: 'satin', seatSide: 0x1a1a1c, seatIns: 0x3a2c22, insType: 'alcantara', extras: ['zPods'], screen: 'nav', binW: 0.3, binH: 0.13 },
  gr86: { cluster: 'tft:ring', accent: '#ff3a2a', tachMax: 8000, speedMax: 260, wheel: '3', trim: 'carbon', seatIns: 0x262628, insType: 'alcantara', stitch: 'red', head: 0x1a1a1c, screen: 'float', extras: ['start'] },
  ae86: { cluster: 'tri', speedLeft: true, tachMax: 9000, light: '#ffb45a', needle: '#ff7a1a', wheel: '3', pad: 'round', dash: 0x23252a, trim: 'dash', seatSide: 0x222326, seatIns: 0x3e4048, head: 0x6a6660, pattern: 'check', switchLight: '#ffa040' },
  jza80: { cluster: 'tri', speedLeft: true, tachMax: 9000, light: '#f5f6f8', boost: true, wheel: '4', trim: 'satin', seatIns: 0x3e3e44, extras: ['wrap'] },
  a90: { cluster: 'tft:a90', accent: '#ff2a1a', tachMax: 8000, speedMax: 260, wheel: '3', trim: 'carbon', seatSide: 0x18181a, seatIns: 0x5a1414, insType: 'leather', stitch: 'red', head: 0x1d1d1f, screen: 'float', extras: ['start'], hb: 'button' },
  jzx100: { cls: 'sedan', cluster: 'opti', light: '#f4f8ff', tachMax: 8000, wheel: '4', trim: 'wood', seat: 'comfort', seatSide: 0x48484e, seatIns: 0x56565c, head: 0x6c6a66, screen: 'nav' },
  crown: { cls: 'sedan', cluster: 'tft:twin', accent: '#59b4ff', tachMax: 8000, speedMax: 260, wheel: '4', dash: 0x1e1e20, trim: 'wood', seat: 'comfort', seatSide: 0x1a1a1c, seatIns: 0x1e1e20, insType: 'leather', head: 0x8a857c, knob: 'at', hb: 'button', screen: 'dual' },
  fd3s: { cluster: 'fd', tachMax: 10000, light: '#ffb03c', needle: '#ff4a12', boost: true, wheel: '3', pad: 'small', trim: 'dash', seatIns: 0x2f2f33, binW: 0.34, binH: 0.13, switchLight: '#ff8a2a' },
  nd: { cluster: 'nd', tachMax: 8000, speedMax: 260, light: '#ffffff', needle: '#ff2a1a', wheel: '3', trim: 'gloss', seat: 'bucket', seatSide: 0x1a1a1c, seatIns: 0x262628, insType: 'leather', stitch: 'red', screen: 'float', extras: ['bodyTrim', 'start'], hbSide: -1 },
  na1: { cluster: 'nsx', tachMax: 9000, light: '#f6f6f6', wheel: '4', trim: 'dash', seatSide: 0x1a1a1c, seatIns: 0x2e2e30, insType: 'leather', binW: 0.42, binH: 0.1, eye: [-0.02, 0] },
  ek9: { cluster: 'twin', smallMid: true, tachMax: 10000, light: '#f6f6f6', needle: '#ff2a12', wheel: 'momo', stitch: 'red', trim: 'satin', seat: 'bucket', seatSide: 0x151517, seatIns: 0xa01818, knob: 'ti', head: 0x45454a },
  fl5: { cluster: 'tft:bar', accent: '#ff2a2a', tachMax: 8000, speedMax: 260, wheel: '3', stitch: 'red', trim: 'carbon', seat: 'bucket', seatSide: 0x7a1010, seatIns: 0xa61818, insType: 'alcantara', head: 0x1a1a1c, carpet: 0x4a0b0b, knob: 'teardrop', hb: 'button', screen: 'float', extras: ['honeycomb', 'start'] },
  ap1: { cluster: 's2000', tachMax: 10000, wheel: '3', trim: 'satin', seatSide: 0x18181a, seatIns: 0x8a1414, insType: 'leather', knob: 'ball', screen: 'lid', extras: ['startL'], binW: 0.36, binH: 0.11 },
  evo9: { cluster: 'twin', smallMid: true, tachMax: 9000, light: '#f4f6f8', wheel: 'momo', trim: 'carbon', seat: 'bucket', seatSide: 0x18181a, seatIns: 0x1d2e5a, stitch: 'blue' },
  gdb: { cluster: 'sti', tachMax: 9000, light: '#ff3a2a', needle: '#ffffff', boost: true, wheel: 'momo', trim: 'satin', seatIns: 0x2a3550, stitch: 'blue', extras: ['dccd'] },
  lfa: { cluster: 'lfa', tachMax: 10000, speedMax: 340, wheel: '3', flat: true, paddles: true, stitch: 'red', trim: 'carbon', seat: 'bucket', seatSide: 0x5e0c0c, seatIns: 0x1c1c1e, insType: 'alcantara', head: 0x1a1a1c, knob: 'none', hb: 'button', screen: 'inset', extras: ['start', 'lfaKnobs'] },
  copen: { cls: 'kei', cluster: 'tri', tachMax: 9000, light: '#ffffff', wheel: 'momo', wheelR: 0.175, seatIns: 0x3a2a22, insType: 'leather', trim: 'gloss', screen: 'nav', extras: ['bodyTrim'] },
  altow: { cls: 'kei', cluster: 'twin', tachLeft: true, smallMid: true, tachMax: 9000, light: '#ffffff', needle: '#ff2010', wheel: '3', wheelR: 0.175, stitch: 'red', seat: 'bucket', seatSide: 0x161618, seatIns: 0x2a2a2c, seatStitch: 0xb01818, screen: 'nav' },
  s660: { cls: 'kei', cluster: 'tft:s660', accent: '#ff3a2a', tachMax: 9000, wheel: '3', wheelR: 0.165, flat: true, stitch: 'red', seatIns: 0x7a1010, trim: 'gloss', screen: 'none', extras: ['start', 'bodyTrim'], binW: 0.24, binH: 0.12 },
  jimny: { cls: 'kei', cluster: 'jimny', tachMax: 8000, light: '#ffffff', wheel: '3', wheelR: 0.185, seat: 'comfort', seatSide: 0x232326, seatIns: 0x3a3a3e, binHood: 'twin', screen: 'float', extras: ['grab', 'transfer'], eye: [0.02, 0] },
  nbox: { cls: 'kei', cluster: 'tft:top', accent: '#4ac0ff', wheel: '3', wheelR: 0.18, seat: 'comfort', seatSide: 0x2a2a2e, seatIns: 0x3c3c42, head: 0x9a9690, binHood: 'top', knob: 'dashAT', hb: 'button', screen: 'float' },
  sakura: { cls: 'ev', cluster: 'tft:wide', accent: '#5ad0ff', wheel: '3', seat: 'comfort', seatSide: 0x5a544e, seatIns: 0x857a6e, dash: 0x2b2a28, head: 0x9a9690, knob: 'puck', hb: 'button', screen: 'wide' },
  leaf: { cls: 'ev', cluster: 'tft:ev', accent: '#3aa0ff', wheel: '3', flat: true, seat: 'comfort', seatSide: 0x2a2a2e, seatIns: 0x45474d, head: 0x8a8a88, knob: 'puck', hb: 'button', screen: 'float' },
  model3: { cls: 'ev', cluster: 'none', wheel: '2', seat: 'comfort', seatSide: 0xe8e6e2, seatIns: 0xe8e6e2, insType: 'leather', dash: 0x222324, trim: 'wood', head: 0x2a2a2c, knob: 'none', hb: 'button', screen: 'tesla' },
  p911: { cluster: 'p911', tachMax: 9000, speedMax: 340, light: '#ffffff', needle: '#ff3a1a', binW: 0.4, binH: 0.12, wheel: '3', paddles: true, trim: 'carbon', seatIns: 0x1e1e20, insType: 'alcantara', stitch: 'red', head: 0x1a1a1c, knob: 'pdk', hb: 'button', screen: 'inset' },
  e46: { cluster: 'e46', tachMax: 9000, speedMax: 300, light: '#ff8a3a', needle: '#ff4a12', wheel: '3', trim: 'satin', seatSide: 0x2a2a2c, seatIns: 0x454548, insType: 'leather', switchLight: '#ff7a2a' },
  mustang: { cluster: 'tft:wide', accent: '#3a8cff', tachMax: 8000, speedMax: 300, wheel: '3', flat: true, trim: 'satin', seatIns: 0x2a2a2c, insType: 'leather', stitch: 'red', knob: 'ball', hb: 'button', screen: 'wide', extras: ['start'] },
  police: { cls: 'sedan', cluster: 'tft:twin', accent: '#59b4ff', tachMax: 8000, wheel: '4', seat: 'comfort', seatSide: 0x2a2a2c, seatIns: 0x3a3a3e, head: 0x7a7a78, knob: 'at', hb: 'button', screen: 'dual', extras: ['policeRadio'] },
  police_unmarked: { cls: 'sedan', cluster: 'tft:twin', accent: '#59b4ff', tachMax: 8000, wheel: '4', seat: 'comfort', seatSide: 0x2a2a2c, seatIns: 0x3a3a3e, head: 0x7a7a78, knob: 'at', hb: 'button', screen: 'dual', extras: ['policeRadio'] },
  prius: { cls: 'sedan', cluster: 'tft:top', accent: '#5ad0ff', wheel: '3', seat: 'comfort', seatSide: 0x2a2a2e, seatIns: 0x3c3c42, dash: 0x2a2b2e, head: 0x8a8a88, knob: 'puck', hb: 'button', screen: 'float', binHood: 'top' },
  taxi: { cls: 'van', cluster: 'tft:top', accent: '#7ad0ff', wheel: '3', seat: 'comfort', seatSide: 0x2c2c2e, seatIns: 0x3d3d42, head: 0x8a8884, knob: 'dashAT', hb: 'pedal', screen: 'float', binHood: 'top', extras: ['taxiMeter'] },
  hiace: { cls: 'van', cluster: 'single', light: '#9ad8ff', wheel: '4', wheelR: 0.19, seat: 'comfort', seatSide: 0x34363a, seatIns: 0x4a4c52, head: 0x8a8884, knob: 'dashAT', hb: 'stick', screen: 'radio', dash: 0x2a2b2e },
  every: { cls: 'van', cluster: 'single', light: '#ffffff', wheel: '3', wheelR: 0.185, seat: 'comfort', seatSide: 0x34363a, seatIns: 0x4a4c52, head: 0x8a8884, knob: 'dashAT', hb: 'lever', screen: 'radio', dash: 0x2a2b2e },
};
export function cockpitSpec(car) {
  const s = { ...DEF, ...(SPEC[car.id] || {}) };
  if (!SPEC[car.id]) { // unknown cars: pick by category / age
    if (car.engine.type === 'EV') Object.assign(s, { cls: 'ev', cluster: 'tft:ev', knob: 'puck', hb: 'button', screen: 'float', seat: 'comfort' });
    else if (car.year >= 2015) Object.assign(s, { cluster: 'tft:twin', screen: 'float', hb: 'button' });
    if (car.cat === 'traffic' || car.cat === 'kei') s.seat = 'comfort';
  }
  if (!s.tachMax) s.tachMax = Math.ceil((car.engine.redline + 1000) / 1000) * 1000;
  if (car.trans.type === 'AT' && s.knob !== 'dashAT' && s.knob !== 'puck') s.knob = 'at';
  if (car.trans.type === 'DCT' && !['pdk', 'none'].includes(s.knob)) s.knob = 'dct';
  s.turbo = !!car.engine.turbo; s.ev = car.engine.type === 'EV';
  if (s.turbo && s.boost === undefined && ['twin', 'tri', 'sti', 'fd'].includes(s.cluster) && !s.extras.some(e => ['triple', 'boostPod', 'mfd', 'mfd35'].includes(e))) s.boost = true;
  return s;
}

// ───────────────────────── materials / textures ─────────────────────────
const MC = new Map();
const memo = (k, f) => { if (!MC.has(k)) MC.set(k, f()); return MC.get(k); };
let seed = 777;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// houndstooth-ish check (AE86 style seat cloth)
const checkTex = () => memo('checkTex', () => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#5a5a5a'; for (let y = 0; y < 128; y += 16) for (let x = (y / 16) % 2 * 8; x < 128; x += 16) g.fillRect(x, y, 8, 8);
  g.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 900; i++) g.fillRect(rnd() * 128, rnd() * 128, 1, 1);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(26, 26); return t;
});
const IM = {
  ins: (sp) => {
    if (sp.pattern === 'check') return memo('insCheck' + sp.seatIns, () => { const b = fabricTex().clone(); b.repeat.set(24, 24); return new THREE.MeshStandardMaterial({ color: new THREE.Color(sp.seatIns).multiplyScalar(2.2), map: checkTex(), roughness: 0.95, bumpMap: b, bumpScale: 1.2 }); });
    return sp.insType === 'leather' ? M.leather(sp.seatIns) : sp.insType === 'alcantara' ? M.alcantara(sp.seatIns) : M.fabric(sp.seatIns);
  },
  side: (sp) => sp.seat === 'comfort' && sp.insType === 'fabric' ? M.fabric(sp.seatSide) : M.leather(sp.seatSide),
  trim: (sp) => sp.trim === 'carbon' ? M.carbon() : sp.trim === 'wood' ? M.wood() : sp.trim === 'satin' ? M.satin() : sp.trim === 'dash' ? M.dash(sp.dash) : M.gloss(),
  glow: (hex, k = 1.6) => memo('glow' + hex + k, () => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false })),
  red: () => memo('btnRed', () => new THREE.MeshStandardMaterial({ color: 0xa01010, roughness: 0.35, emissive: 0x400404, emissiveIntensity: 0.6 })),
  ti: () => memo('ti', () => new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.16, metalness: 1 })),
  alu: () => memo('alu', () => new THREE.MeshStandardMaterial({ color: 0xb8bcc2, roughness: 0.3, metalness: 1 })),
  glass: () => memo('cg', () => new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.04, transparent: true, opacity: 0.1, envMapIntensity: 0.8, depthWrite: false })),
  skin: () => memo('glove', () => new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.7 })),
  honey: () => memo('honeyStrip', () => { const t = honeyTex().clone(); t.repeat.set(40, 3); return new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.4, metalness: 0.4, map: t, bumpMap: t, bumpScale: 2 }); }),
};

// ───────────────────────── canvas screens ─────────────────────────
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, t, g: c.getContext('2d') }; }
function staticScreen(kind, w = 512, h = 256) {
  const { c, t, g } = mkCanvas(w, h);
  if (kind === 'nav') {
    g.fillStyle = '#0c1118'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1f2b3a'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(rnd() * w, rnd() * h); g.lineTo(rnd() * w, rnd() * h); g.stroke(); }
    g.strokeStyle = '#2e4058'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, h * 0.7); g.bezierCurveTo(w * 0.3, h * 0.6, w * 0.5, h * 0.2, w, h * 0.25); g.stroke();
    g.strokeStyle = '#3a8cff'; g.lineWidth = 7; g.beginPath(); g.moveTo(w * 0.36, h); g.lineTo(w * 0.4, h * 0.6); g.bezierCurveTo(w * 0.45, h * 0.4, w * 0.6, h * 0.3, w, h * 0.25); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(w * 0.4, h * 0.62); g.lineTo(w * 0.37, h * 0.74); g.lineTo(w * 0.43, h * 0.74); g.fill();
    g.fillStyle = 'rgba(20,28,40,0.9)'; g.fillRect(0, 0, w, 34); g.fillStyle = '#cfe2ff'; g.font = '20px sans-serif'; g.fillText('首都高速 湾岸線   大黒PA  2.4km', 12, 24);
    g.fillStyle = '#9ab'; g.font = '16px sans-serif'; g.fillText('♪ MIDNIGHT FM 89.1', 12, h - 12);
  } else if (kind === 'radio') {
    g.fillStyle = '#101012'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#16200f'; g.fillRect(w * 0.1, h * 0.14, w * 0.8, h * 0.36);
    g.fillStyle = '#9cff8a'; g.font = 'bold 54px monospace'; g.fillText('FM1 89.1', w * 0.16, h * 0.43);
    g.fillStyle = '#26262a'; for (let i = 0; i < 6; i++) g.fillRect(w * 0.1 + i * w * 0.135, h * 0.62, w * 0.12, h * 0.15);
    g.fillStyle = '#888'; g.font = '22px sans-serif'; for (let i = 0; i < 6; i++) g.fillText(String(i + 1), w * 0.15 + i * w * 0.135, h * 0.73);
    g.fillStyle = '#1c1c1f'; g.fillRect(w * 0.1, h * 0.82, w * 0.8, h * 0.06);
  } else if (kind === 'hvac') {
    g.fillStyle = '#141416'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff9a3c'; g.font = 'bold 40px sans-serif'; g.fillText('22.0', w * 0.08, h * 0.6); g.fillText('AUTO', w * 0.4, h * 0.6); g.fillText('22.0', w * 0.76, h * 0.6);
  } else if (kind === 'prnd') {
    g.fillStyle = '#101012'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ddd'; g.font = 'bold 120px sans-serif'; g.textAlign = 'center';
    'PRND'.split('').forEach((ch, i) => g.fillText(ch, w * 0.5, 130 + i * 170));
  } else if (kind === 'tesla') {
    g.fillStyle = '#16181b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2a3340'; g.lineWidth = 3; for (let i = 0; i < 30; i++) { g.beginPath(); g.moveTo(w * 0.34 + rnd() * w * 0.66, rnd() * h); g.lineTo(w * 0.34 + rnd() * w * 0.66, rnd() * h); g.stroke(); }
    g.strokeStyle = '#3a8cff'; g.lineWidth = 9; g.beginPath(); g.moveTo(w * 0.6, h); g.bezierCurveTo(w * 0.62, h * 0.6, w * 0.75, h * 0.4, w, h * 0.35); g.stroke();
  } else if (kind === 'taxi') {
    g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff2a1a'; g.font = 'bold 120px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('空車', w * 0.3, h * 0.5);
    g.fillStyle = '#ffb020'; g.font = 'bold 90px monospace'; g.fillText('500', w * 0.75, h * 0.5);
  } else if (kind === 'police') {
    g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3aff6a'; g.font = 'bold 60px monospace'; g.fillText('CH 3', w * 0.08, h * 0.45);
    g.fillStyle = '#ffb020'; g.font = '34px monospace'; g.fillText('SIREN  AUTO', w * 0.08, h * 0.8);
  }
  return t;
}
const screenMat = (kind, k = 0.8, w, h) => new THREE.MeshBasicMaterial({ map: staticScreen(kind, w, h), color: new THREE.Color(k, k, k), toneMapped: false });
const glowPanel = (kind) => { const t = staticScreen(kind); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.4 }); };
function hpatternTex(n, rev) {
  const { t, g } = mkCanvas(128, 128); const w = 128, h = 128;
  g.fillStyle = '#141414'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, TAU); g.fill();
  const cols = Math.ceil((n + 1) / 2), x0 = w * 0.22, x1 = w * 0.78;
  const colX = i => lerp(x0, x1, cols > 1 ? i / (cols - 1) : 0.5);
  g.strokeStyle = '#ddd'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, h / 2); g.lineTo(x1, h / 2);
  for (let i = 0; i < cols; i++) { g.moveTo(colX(i), h * 0.24); g.lineTo(colX(i), h * 0.76); }
  g.stroke(); g.fillStyle = '#ddd'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const off = rev === 'L' ? 1 : 0;
  for (let i = 0; i < n; i++) { const k = i; const col = Math.floor(k / 2) + off; g.fillText(String(i + 1), colX(col), k % 2 ? h * 0.88 : h * 0.13); }
  if (rev === 'L') g.fillText('R', colX(0), h * 0.13); else g.fillText('R', colX(cols - 1), n % 2 ? h * 0.88 : h * 0.13);
  return t;
}

// ───────────────────────── geometry helpers ─────────────────────────
function torusFlat(R, tube, rs, ts, flatY) {
  const g = new THREE.TorusGeometry(R, tube, rs, ts);
  if (flatY) {
    const p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); c.set(v.x, v.y, 0); const l = c.length() || 1; c.multiplyScalar(R / l);
      if (c.y < -flatY) { const o = v.clone().sub(c); c.y = -flatY - (c.y + flatY) * 0.15; c.x *= 1.0; v.copy(c).add(o); p.setXYZ(i, v.x, v.y, v.z); }
    }
    g.computeVertexNormals();
  }
  return g;
}
// rounded ring/bezel facing -Z (towards the driver)
const bezel = (r, t = 0.004) => new THREE.TorusGeometry(r, t, 6, 40);
const tubeOpen = (r, d) => new THREE.CylinderGeometry(r, r, d, 32, 1, true).rotateX(Math.PI / 2);

// ───────────────────────── interior builder ─────────────────────────
export function buildInterior(P, S, car, ctx) {
  const lod = ctx.lod;
  const sp = cockpitSpec(car);
  const tall = S.cabSq > 3.5 || car.H > 1600;
  const van = sp.cls === 'van' && S.cA !== undefined && S.cA < 0.15; // cab-over: driver over the front wheels
  const sporty = sp.cls === 'sport';
  const kit = new Kit();
  const g = new THREE.Group(); g.name = 'interior';
  const dx = ctx.driverX, side = Math.sign(dx) || -1, pxs = -side; // pxs: passenger side sign
  const floorY = S.clr + 0.12;
  const year = car.year || 2000;
  const dashM = M.dash(sp.dash), dashTop = M.dash(sp.dashTop ?? (sp.dash === 0x26272a ? 0x202124 : sp.dash));
  const trim = IM.trim(sp);
  const paint = ctx.paint || dashM;
  // ── key points ──
  const roofAt = z => Math.max(P.top(z), P.roof(z));
  let zEye = clamp(P.zA - (van ? 0.82 : tall ? 0.95 : 1.1), P.zD + 0.55, P.zA - 0.7);
  if (S.doors === 4) zEye = clamp(zEye, ctx.B_PILLAR + 0.02, P.zA - 0.7);
  zEye += sp.eye[1];
  const eyeY = Math.min(floorY + (van ? 1.06 : tall ? 1.0 : sporty ? 0.84 : 0.9), roofAt(zEye) - (tall ? 0.17 : 0.15)) + sp.eye[0];
  const Hz = zEye + 0.2, Hy = eyeY - (van ? 0.72 : tall ? 0.7 : 0.64); // hip point
  const zDashEdge = zEye + (van ? 0.56 : 0.62);
  const yDashEdge = eyeY - (van ? 0.3 : 0.25);
  const cw = (z, y) => ctx.bodyXAt(z, y) - 0.05; // inner half-width at (z,y)
  const dashHalf = cw(P.zA - 0.3, S.belt) - 0.01;
  const eye = new THREE.Vector3(dx, eyeY, zEye);
  const live = []; // live-drawn canvases { draw(st), tex }

  // ── floor, firewall, sills ──
  const flen = P.zA - P.zD;
  kit.add(roundedBox(dashHalf * 2 + 0.06, 0.05, flen, 0.02), M.carpet(), T(0, floorY - 0.02, (P.zA + P.zD) / 2));
  if (sp.carpet !== 0x151516) for (const x of [dx, -dx]) kit.add(roundedBox(0.5, 0.012, 0.62, 0.006), M.fabric(sp.carpet), T(x, floorY + 0.008, Hz + 0.55)); // coloured mats
  kit.add(roundedBox(dashHalf * 2, 0.4, 0.04, 0.015), M.carpet(), T(0, floorY + 0.15, P.zA - 0.08, -0.5));
  // ── dashboard (lofted profile across the cabin) ──
  const yA = S.cowl - 0.01, zA = P.zA + 0.04;
  const prof = [
    [zA, yA], [lerp(zA, zDashEdge, 0.45), lerp(yA, yDashEdge, 0.55) + 0.025, zDashEdge + 0.08, yDashEdge],
    [zDashEdge - 0.02, yDashEdge - 0.01, zDashEdge - 0.01, yDashEdge - 0.06],
    [zDashEdge + 0.03, yDashEdge - 0.2],
    [zDashEdge + 0.06, floorY + 0.4, zDashEdge + 0.16, floorY + 0.36],
    [P.zA - 0.12, floorY + 0.32],
    [zA, floorY + 0.36],
  ];
  if (zDashEdge + 0.16 > P.zA - 0.14) { prof[4] = [zDashEdge + 0.06, floorY + 0.38]; prof.splice(5, 1); }
  kit.add(profileX(prof, dashHalf * 2, 0.035, 10), dashTop);
  // soft-touch upper pad strip along the dash edge
  kit.add(roundedBox(dashHalf * 2 - 0.08, 0.03, 0.05, 0.014), M.leather(sp.dash === 0x26272a ? 0x1e1e20 : sp.dash), T(0, yDashEdge - 0.012, zDashEdge + 0.01));
  // decorative trim band on the passenger side of the dash face
  const trimLen = dashHalf - 0.32;
  if (trimLen > 0.15) {
    if (sp.screen === 'tesla') kit.add(roundedBox(dashHalf * 2 - 0.08, 0.05, 0.02, 0.008), trim, T(0, yDashEdge - 0.1, zDashEdge - 0.01, -0.12));
    else kit.add(roundedBox(trimLen, 0.045, 0.02, 0.008), sp.extras.includes('bodyTrim') ? paint : trim, T(pxs * (0.17 + trimLen / 2), yDashEdge - 0.1, zDashEdge - 0.01, -0.12));
    kit.add(roundedBox(trimLen * 0.8, 0.004, 0.004, 0.0015), M.black(), T(pxs * (0.2 + trimLen * 0.45), yDashEdge - 0.2, zDashEdge + 0.035)); // glovebox shut line
  }
  if (sp.extras.includes('honeycomb')) kit.add(roundedBox(dashHalf * 2 - 0.2, 0.03, 0.012, 0.004), IM.honey(), T(0, yDashEdge - 0.055, zDashEdge - 0.022, -0.1));
  if (sp.extras.includes('grab')) { // passenger grab bar on the dash (Jimny)
    const gx = pxs * (dashHalf * 0.55);
    kit.add(roundedBox(0.3, 0.03, 0.03, 0.012), M.dash(0x111112), T(gx, yDashEdge - 0.03, zDashEdge - 0.06));
    for (const s2 of [-1, 1]) kit.add(roundedBox(0.03, 0.06, 0.05, 0.01), M.dash(0x111112), T(gx + s2 * 0.15, yDashEdge - 0.02, zDashEdge - 0.03));
  }

  // ── instrument binnacle + live cluster ──
  const gauge = buildCluster(sp, car, kit, g, { dx, eyeY, yDashEdge, zDashEdge, dashM, dashTop, side });

  // ── centre stack, vents, screens ──
  const wrap = sp.extras.includes('wrap');
  const stackZ = zDashEdge + 0.05, stackTop = yDashEdge - 0.03, stackBot = floorY + 0.3;
  const stackRy = wrap ? side * -0.32 : 0; // driver-wrapped stack (JZA80) faces the driver
  const stackX = wrap ? side * 0.03 : 0;
  kit.add(roundedBox(wrap ? 0.34 : 0.3, stackTop - stackBot, 0.12, 0.03), dashM, T(stackX, (stackTop + stackBot) / 2, stackZ + 0.02, 0.18, stackRy, 0, 1, 1, 1, 'YXZ'));
  const stackFace = (y, zOff = 0) => { const zz = stackZ - 0.042 + zOff + (y - (stackTop + stackBot) / 2) * Math.tan(0.18); return [stackX + Math.sin(stackRy) * -0.04, y, zz]; };
  const vent = (x, y, z, w, h, ry = 0, round = false) => {
    if (round) {
      kit.add(new THREE.TorusGeometry(h / 2, 0.008, 8, 24), M.satin(), T(x, y, z, 0, ry, 0));
      kit.add(new THREE.CylinderGeometry(h / 2, h / 2, 0.02, 24), M.black(), T(x, y, z + 0.01, Math.PI / 2, ry, 0, 1, 1, 1, 'YXZ'));
      for (let i = -1; i <= 1; i++) kit.add(new THREE.BoxGeometry(h * 0.9, 0.004, 0.012), M.gloss(), T(x, y + i * h * 0.22, z - 0.002, 0, ry, 0));
      return;
    }
    kit.add(roundedBox(w + 0.016, h + 0.016, 0.03, 0.008), M.gloss(), T(x, y, z + 0.01, 0, ry, 0));
    for (let i = 0; i < 4; i++) kit.add(new THREE.BoxGeometry(w, 0.004, 0.018), M.black(), T(x, y - h / 2 + (i + 0.5) * h / 4, z - 0.006, 0.3, ry, 0));
  };
  const roundVents = ['nd', 's660', 'copen', 'p911', 'ap1', 'mustang', 'gr86', 'a90', 'jimny', 'lfa'].includes(car.id);
  {
    const vy = yDashEdge - 0.06, vz = zDashEdge - 0.012;
    if (sp.screen !== 'tesla') { vent(0.07 + stackX, vy, vz, 0.09, 0.05, stackRy, roundVents); vent(-0.07 + stackX, vy, vz, 0.09, 0.05, stackRy, roundVents); }
    vent(dashHalf - 0.12, vy + 0.01, vz + 0.01, 0.1, 0.055, 0.25, roundVents); vent(-(dashHalf - 0.12), vy + 0.01, vz + 0.01, 0.1, 0.055, -0.25, roundVents);
  }
  if (sp.screen === 'tesla') kit.add(roundedBox(dashHalf * 2 - 0.1, 0.014, 0.02, 0.005), M.black(), T(0, yDashEdge - 0.06, zDashEdge - 0.015)); // full-width vent slot
  const screens = [];
  const addScreen = (mat, w, h, x, y, z, rx, ry = 0, bezelD = 0.02) => {
    kit.add(roundedBox(w + 0.018, h + 0.018, bezelD, 0.006), M.gloss(), T(x, y, z + bezelD / 2 - 0.004, rx, ry, 0, 1, 1, 1, 'YXZ'));
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); sc.position.set(x, y, z - 0.0065); sc.rotation.set(rx, Math.PI + ry, 0, 'YXZ'); screens.push(sc); return sc;
  };
  const [rx0, ry0, rz0] = stackFace(stackTop - 0.11);
  switch (sp.screen) {
    case 'float': case 'dual': {
      const sw = sp.cls === 'kei' ? 0.19 : 0.22, sh = sw * 0.58;
      addScreen(screenMat('nav', 0.7), sw, sh, 0, yDashEdge + 0.07, zDashEdge + 0.08, 0.2, -side * 0.1);
      const [hx, hy, hz] = stackFace(stackBot + 0.12);
      const hv = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), glowPanel('hvac')); hv.position.set(hx, hy, hz - 0.004); hv.rotation.set(0.18, Math.PI, 0); screens.push(hv);
      if (sp.screen === 'dual') addScreen(screenMat('hvac', 0.55), 0.18, 0.1, rx0, ry0 - 0.05, rz0 - 0.004, 0.18);
      break;
    }
    case 'tesla': {
      const w = 0.38, h = 0.24;
      addScreen(screenMat('tesla', 0.75, 1024, 646), w, h, 0, yDashEdge + 0.1, zDashEdge + 0.04, 0.22, 0, 0.016);
      kit.add(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 12), M.gloss(), T(0, yDashEdge + 0.0, zDashEdge + 0.08));
      break;
    }
    case 'wide': { // cluster + centre display under one glass (Sakura, Mustang)
      const w = 0.3, h = 0.13;
      addScreen(screenMat('nav', 0.7), w, h, side * 0.04 + pxs * 0.12, yDashEdge + 0.035, zDashEdge + 0.03, 0.22, -side * 0.12);
      break;
    }
    case 'inset': addScreen(screenMat('nav', 0.65), 0.2, 0.1, rx0, ry0 + 0.02, rz0 - 0.004, 0.18); break;
    case 'lid': { // S2000: the head unit hides behind a lid
      kit.add(roundedBox(0.19, 0.06, 0.012, 0.004), M.dash(0x111113), T(rx0, ry0, rz0 - 0.008, 0.18));
      break;
    }
    case 'nav': addScreen(screenMat('nav', 0.6), 0.18, 0.1, rx0, ry0, rz0 - 0.004, 0.18, stackRy); break;
    case 'radio': { const hu = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.1), glowPanel('radio')); hu.position.set(rx0, ry0, rz0 - 0.003); hu.rotation.set(0.18, Math.PI + stackRy, 0, 'YXZ'); screens.push(hu); break; }
    default: break;
  }
  if (!['float', 'dual', 'tesla'].includes(sp.screen)) { // HVAC knobs
    const [kx, ky, kz] = stackFace(stackTop - 0.22);
    for (const ox of [-0.075, 0, 0.075]) {
      kit.add(new THREE.CylinderGeometry(0.019, 0.021, 0.022, 20), M.satin(), T(kx + ox * Math.cos(stackRy), ky, kz - 0.006 - ox * Math.sin(stackRy), Math.PI / 2 + 0.18, stackRy, 0, 1, 1, 1, 'YXZ'));
      kit.add(new THREE.BoxGeometry(0.003, 0.012, 0.003), IM.glow(sp.switchLight, 1.2), T(kx + ox * Math.cos(stackRy), ky + 0.012, kz - 0.019, 0.18));
    }
  }
  // hazard switch + switch backlights
  kit.add(roundedBox(0.026, 0.014, 0.01, 0.003), M.dash(0x5a0a0a), T(...stackFace(stackTop - 0.035, -0.004)));
  for (let i = 0; i < 4; i++) { const [sx2, sy2, sz2] = stackFace(stackBot + 0.05, -0.006); kit.add(roundedBox(0.03, 0.012, 0.006, 0.002), M.gloss(), T(sx2 - 0.06 + i * 0.04, sy2, sz2, 0.18)); kit.add(new THREE.BoxGeometry(0.008, 0.002, 0.002), IM.glow(sp.switchLight, 1.1), T(sx2 - 0.06 + i * 0.04, sy2 + 0.002, sz2 - 0.0035)); }
  // ── signature extras ──
  extrasFor(sp, car, kit, g, live, { dx, side, pxs, eyeY, zEye, yDashEdge, zDashEdge, stackFace, stackTop, stackBot, floorY, dashHalf, dashTop, dashM });
  for (const s of screens) { s.renderOrder = 1; g.add(s); }

  // ── centre console / tunnel ──
  const conZ0 = Hz - 0.32, conZ1 = Math.min(stackZ + 0.05, P.zA - 0.12);
  const conTop = floorY + (sporty ? 0.24 : van ? 0.12 : 0.28);
  if (!van) {
    kit.add(roundedBox(0.24, conTop - floorY, conZ1 - conZ0, 0.04), dashM, T(0, (conTop + floorY) / 2, (conZ0 + conZ1) / 2));
    kit.add(roundedBox(0.2, 0.012, conZ1 - conZ0 - 0.08, 0.005), trim, T(0, conTop + 0.002, (conZ0 + conZ1) / 2 + 0.02));
    if (!sporty || year >= 2010) kit.add(roundedBox(0.2, 0.08, 0.3, 0.035), M.leather(sp.seatSide), T(0, conTop + 0.06, conZ0 + 0.1)); // armrest lid
    // cup holders
    for (const s2 of [-1, 1]) kit.add(new THREE.CylinderGeometry(0.036, 0.034, 0.012, 20), M.black(), T(s2 * 0.045, conTop + 0.006, conZ0 + 0.32));
  }
  // ── shifter ──
  const shifter = buildShifter(sp, car, kit, g, { dx, side, conTop, Hz, sporty, yDashEdge, zDashEdge, stackFace, stackBot, van });
  // handbrake
  let hbGroup = null;
  if (sp.hb === 'lever' && !van) {
    hbGroup = new THREE.Group(); const hx = sp.hbSide ? sp.hbSide * side * -0.07 : -dx * 0.02;
    hbGroup.position.set(hx, conTop + 0.01, Hz - 0.12);
    const hk = new Kit();
    hk.add(roundedBox(0.035, 0.03, 0.26, 0.012), M.leather(0x151517), T(0, 0.015, 0.13));
    hk.add(new THREE.CylinderGeometry(0.007, 0.007, 0.03, 10), M.satin(), T(0, 0.012, 0.27, Math.PI / 2));
    hk.build(hbGroup); hbGroup.rotation.x = -0.12; g.add(hbGroup);
    kit.add(roundedBox(0.06, 0.012, 0.3, 0.005), M.leather(0x161618), T(hx, conTop + 0.002, Hz - 0.0));
  } else if (sp.hb === 'lever' && van) { // between the van seats on the floor
    hbGroup = new THREE.Group(); hbGroup.position.set(-dx * 0.25, floorY + 0.08, Hz + 0.05);
    const hk = new Kit(); hk.add(roundedBox(0.035, 0.03, 0.26, 0.012), M.dash(0x151517), T(0, 0.015, 0.13)); hk.build(hbGroup); hbGroup.rotation.x = -0.25; g.add(hbGroup);
  } else if (sp.hb === 'button') {
    kit.add(roundedBox(0.026, 0.01, 0.036, 0.004), M.gloss(), T(-side * 0.06, conTop + 0.006, shifter.z - 0.12));
    kit.add(new THREE.BoxGeometry(0.012, 0.002, 0.004), IM.glow(sp.switchLight, 1.1), T(-side * 0.06, conTop + 0.012, shifter.z - 0.11));
  } else if (sp.hb === 'stick') { // pull-handle under the dash (HiAce)
    kit.add(roundedBox(0.09, 0.03, 0.03, 0.012), M.dash(0x151517), T(dx + side * 0.27, yDashEdge - 0.28, zDashEdge - 0.0));
  }
  // ── steering wheel ──
  const wheel = new THREE.Group();
  const col = new THREE.Group();
  const wR = sp.wheelR + (van ? 0.01 : 0), tubeR = sp.wheel === 'momo' ? 0.016 : sporty ? 0.0175 : 0.0155;
  const wz = zEye + (van ? 0.4 : tall ? 0.42 : 0.46), wy = eyeY - (van ? 0.38 : tall ? 0.36 : 0.32);
  col.position.set(dx, wy, wz); col.rotation.x = van ? 0.7 : tall ? 0.55 : 0.36;
  buildSteeringWheel(sp, car, wheel, { wR, tubeR, lod, sporty, year });
  col.add(wheel);
  // column shroud + stalks (static, follow the column angle)
  const shroud = new THREE.Group(); shroud.position.copy(col.position); shroud.rotation.x = col.rotation.x;
  const sk = new Kit();
  sk.add(roundedBox(0.09, 0.08, 0.2, 0.03), dashM, T(0, -0.01, 0.13));
  for (const sx of [1, -1]) {
    sk.add(new THREE.CylinderGeometry(0.006, 0.008, 0.11, 8), M.black(), T(sx * 0.075, 0.01, 0.07, 0, 0, Math.PI / 2 + sx * 0.15));
    sk.add(roundedBox(0.02, 0.014, 0.014, 0.005), M.black(), T(sx * 0.13, 0.018, 0.07));
  }
  // ignition (key barrel) / start button handled in extras
  if (!sp.extras.includes('start') && !sp.extras.includes('startL') && !sp.ev) sk.add(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 16), M.satin(), T(side * -0.055, -0.02, 0.1, Math.PI / 2 - 0.4, 0, 0));
  sk.build(shroud);
  g.add(col, shroud);
  // ── pedals (pivot at the top; animated) ──
  const pz = Math.min(P.zA - 0.24, zEye + (van ? 0.85 : 0.98)), py = floorY + 0.1;
  const pedals = {};
  const alu = (sporty && year >= 1995) || ['fl5', 'ek9', 'evo9', 'gdb', 's2000', 'ap1'].includes(car.id);
  const pedal = (key, x, w, h = 0.075) => {
    const pg = new THREE.Group(); pg.position.set(x, py + 0.2, pz + 0.12);
    const pk = new Kit();
    pk.add(roundedBox(w, h, 0.012, 0.005), alu ? M.satin() : M.rubber(), T(0, -0.2, -0.12, -0.95));
    if (alu) for (let i = -1; i <= 1; i++) pk.add(roundedBox(w * 0.8, 0.006, 0.006, 0.002), M.rubber(), T(0, -0.2 + i * h * 0.28 * Math.cos(0.95), -0.12 - 0.006 - i * h * 0.28 * Math.sin(0.95) * 0.1, -0.95));
    pk.add(new THREE.BoxGeometry(0.012, 0.2, 0.012), M.black(), T(0, -0.09, -0.05, -0.55));
    pk.build(pg); g.add(pg); pedals[key] = pg;
  };
  if (car.trans.type === 'MT') { pedal('clutch', dx + 0.16, 0.06); pedal('brake', dx + 0.03, 0.065); pedal('throttle', dx - 0.1, 0.045, 0.12); }
  else { pedal('brake', dx + 0.05, 0.1); pedal('throttle', dx - 0.1, 0.045, 0.12); }
  if (sp.hb === 'pedal') pedal('park', dx + 0.3, 0.05, 0.05);
  else if (sporty) kit.add(roundedBox(0.06, 0.12, 0.01, 0.004), alu ? M.satin() : M.rubber(), T(dx + 0.28, py + 0.02, pz - 0.02, -0.9)); // dead pedal
  // ── seats ──
  const seatW = clamp(P.hw * 0.66, 0.44, van ? 0.5 : 0.54);
  const seat = (x, type, k) => buildSeat(sp, k, { x, Hy, Hz, floorY, seatW, type });
  const stype = sp.seat;
  seat(dx, stype, kit);
  if (sp.seat === 'bench' || (van && car.id === 'hiace')) { // passenger bench for two (HiAce)
    const bw = cw(Hz, S.belt) - Math.abs(dx) * 0.2;
    buildSeat(sp, kit, { x: -dx * 0.85, Hy, Hz, floorY, seatW: Math.min(0.85, bw), type: 'comfort' });
  } else seat(-dx, stype, kit);
  if (S.doors === 4 || S.rearSeat) { // rear bench
    const rz = Hz - (S.doors === 4 ? 0.9 : 0.78);
    if (rz > P.zD + 0.15) {
      const bw = cw(rz, S.belt) - 0.04;
      const ins = IM.ins(sp), sideM = IM.side(sp);
      kit.add(padGeo(0.45, () => bw, () => 0.06, (t, xn) => 0.012 * (1 - sstep(0.85, 0.98, xn)), (t, xn) => xn < 0.9 && t > 0.1 && t < 0.9, 10, 40, 0.03), [sideM, ins], T(0, Hy + 0.04, rz + 0.26, -Math.PI / 2 - 0.1));
      kit.add(padGeo(S.doors === 4 ? 0.58 : 0.45, () => bw, () => 0.06, (t, xn) => 0.012, (t, xn) => xn < 0.9 && t > 0.08 && t < 0.9, 12, 40, 0.035), [sideM, ins], T(0, Hy + 0.03, rz - 0.18, -0.3));
      if (S.doors === 4) for (const sx of [-1, 1]) kit.add(roundedBox(0.22, 0.13, 0.08, 0.035), sideM, T(sx * bw * 0.5, Hy + 0.03 + Math.cos(0.3) * 0.66, rz - 0.18 - Math.sin(0.3) * 0.66 - 0.01, -0.25));
    }
  }
  // parcel shelf / rear deck
  if (!S.open && !S.cargo && !van) kit.add(roundedBox(dashHalf * 2, 0.02, 0.3, 0.01), M.carpet(), T(0, S.belt - 0.02, P.zD + 0.18));
  if (S.open) { // roadster: roll hoops / bulkhead behind the seats
    const bz = Hz - 0.5;
    kit.add(roundedBox(dashHalf * 2, S.belt - floorY, 0.06, 0.02), M.dash(sp.dash), T(0, (S.belt + floorY) / 2, bz));
    for (const x of [dx, -dx]) kit.add(new THREE.TorusGeometry(0.2, 0.022, 8, 24, Math.PI), M.dash(0x141416), T(x, S.belt + 0.02, bz - 0.02));
  }
  // ── rear-view mirror, sun visors, grab handles ──
  let rearMirror = null;
  if (!S.open || car.id === 'ap1' || car.id === 'nd' || car.id === 'copen' || car.id === 's660') {
    const mz = (S.open ? P.zB + 0.02 : P.zB - 0.1), my = (S.open ? P.roof(P.zB) - 0.11 : roofAt(mz) - 0.085);
    const mw = van ? 0.26 : 0.24, mh = 0.065;
    kit.add(new THREE.CylinderGeometry(0.008, 0.01, 0.07, 8), M.black(), T(0, my + 0.045, mz + 0.03, 0.4));
    if (!S.open) kit.add(roundedBox(0.07, 0.02, 0.06, 0.01), M.dash(0x2a2a2c), T(0, my + 0.075, mz + 0.04));
    const mg = new THREE.Group(); mg.position.set(0, my, mz);
    const toEye = new THREE.Vector3(dx, eyeY, zEye).sub(mg.position).normalize();
    const n = toEye.add(new THREE.Vector3(0, -0.02, -1).normalize()).normalize(); // normal bisects eye ↔ rear window
    mg.lookAt(mg.position.clone().add(n));
    const mk = new Kit(); mk.add(roundedBox(mw, mh, 0.03, 0.02), M.black(), T(0, 0, -0.016)); mk.build(mg);
    rearMirror = new THREE.Mesh(new THREE.PlaneGeometry(mw - 0.016, mh - 0.014), M.mirror());
    rearMirror.position.z = 0.0005; mg.add(rearMirror);
    g.add(mg);
    if (!S.open) for (const sx of [1, -1]) {
      const vz = P.zB - 0.17, vy = roofAt(vz) - 0.03;
      kit.add(roundedBox(0.32, 0.018, 0.15, 0.008), M.fabric(sp.head), T(sx * 0.27, vy, vz + 0.02, -0.15));
      kit.add(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8), M.satin(), T(sx * 0.12, vy + 0.004, vz + 0.08, 0, 0, Math.PI / 2));
    }
    if (!S.open) { // grab handles above the doors (passenger side + rear)
      const gz = Hz + 0.05, gy = roofAt(gz) - 0.12, gx = cw(gz, gy) - 0.02;
      kit.add(roundedBox(0.03, 0.025, 0.2, 0.01), M.dash(sp.head === 0x1a1a1c ? 0x141416 : 0x3a3a3c), T(pxs * gx, gy, gz, 0, 0, pxs * 0.5));
    }
  }
  // ── door cards (built per door, attached to the door pivot by carmodel) ──
  const doorCard = (dk, z0, z1, sx) => {
    const len = z1 - z0 - 0.06; if (len < 0.3) return;
    const zm = (z0 + z1) / 2 - 0.01;
    const y0 = floorY + 0.03, y1 = S.belt - 0.035;
    const xl = ctx.bodyXAt(zm, y0 + 0.12) - 0.05, xh = Math.max(xl - 0.05, ctx.bodyXAt(zm, Math.min(y1, P.top(zm) - 0.1)) - 0.05);
    const ang = Math.atan2(xh - xl, y1 - y0);
    const at = (y, inset = 0) => sx * (lerp(xl, xh, (y - y0) / (y1 - y0)) - inset);
    const rz = -sx * ang;
    dk.add(roundedBox(0.03, y1 - y0, len, 0.012), M.dash(sp.dash), T(at((y0 + y1) / 2), (y0 + y1) / 2, zm, 0, 0, rz));
    dk.add(roundedBox(0.012, 0.13, len * 0.72, 0.006), IM.ins(sp), T(at(S.belt - 0.15, 0.018), S.belt - 0.15, zm - len * 0.08, 0, 0, rz));
    dk.add(roundedBox(0.07, 0.045, len * 0.5, 0.02), M.leather(sp.seatSide), T(at(S.belt - 0.25, 0.045), S.belt - 0.25, zm - len * 0.12, 0, 0, rz));
    dk.add(roundedBox(0.018, 0.028, 0.1, 0.008), M.chrome(), T(at(S.belt - 0.13, 0.025), S.belt - 0.13, z1 - 0.2, 0, 0, rz));
    dk.add(roundedBox(0.01, 0.04, 0.12, 0.004), M.black(), T(at(S.belt - 0.13, 0.016), S.belt - 0.13, z1 - 0.2, 0, 0, rz));
    dk.add(new THREE.CylinderGeometry(0.075, 0.075, 0.012, 28), M.grille(), T(at(y0 + 0.16, 0.016), y0 + 0.16, z1 - 0.25, 0, 0, Math.PI / 2 + rz));
    dk.add(roundedBox(0.04, 0.03, len * 0.6, 0.01), M.carpet(), T(at(y0 + 0.06, 0.02), y0 + 0.06, zm, 0, 0, rz)); // door pocket
    if (year >= 1988) dk.add(roundedBox(0.04, 0.012, 0.07, 0.004), M.gloss(), T(at(S.belt - 0.225, 0.06), S.belt - 0.225, zm + len * 0.05, 0, 0, rz));
    else dk.add(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16), M.satin(), T(at(S.belt - 0.18, 0.03), S.belt - 0.18, zm, 0, 0, Math.PI / 2 + rz));
    dk.add(roundedBox(0.045, 0.02, len + 0.02, 0.008), sp.extras.includes('bodyTrim') ? paint : M.dash(sp.dash), T(at(y1, 0.005), y1, zm, 0, 0, rz)); // belt cap
  };
  // static rear-quarter trim (coupés), sill scuff plates, A-pillar trims
  for (const sx of [1, -1]) {
    const zq0 = P.zD + 0.08, zq1 = (S.doors === 4 ? ctx.rdoorZ0 : ctx.doorZ0) - 0.02;
    if (zq1 - zq0 > 0.2) {
      const zm = (zq0 + zq1) / 2, xm = ctx.bodyXAt(zm, (floorY + S.belt) / 2) - 0.05;
      kit.add(roundedBox(0.03, S.belt - floorY - 0.05, zq1 - zq0, 0.012), M.dash(sp.dash), T(sx * xm, (floorY + S.belt) / 2, zm));
    }
    const xs = ctx.bodyXAt((ctx.doorZ0 + ctx.doorZ1) / 2, floorY + 0.1) - 0.07;
    kit.add(roundedBox(0.06, 0.012, ctx.doorZ1 - ctx.doorZ0 - 0.05, 0.004), M.satin(), T(sx * xs, floorY + 0.09, (ctx.doorZ0 + ctx.doorZ1) / 2));
  }
  kit.build(g);
  return {
    group: g, wheel, eye, eyePitch: sp.pitch, spec: sp, floorY, zSeat: Hz, doorCard, theme: { head: sp.head },
    shifter, handbrake: hbGroup, pedals, gauge, live, rearMirror,
  };
}

// ── steering wheel ──
function buildSteeringWheel(sp, car, wheel, { wR, tubeR, lod, sporty, year }) {
  const wk = new Kit();
  const rim = torusFlat(wR, tubeR, lod === 'full' ? 16 : 8, lod === 'full' ? 80 : 40, sp.flat ? wR * 0.8 : 0);
  const mark = sp.marker !== 'none' ? sp.marker : sp.stitch === 'none' ? (sporty ? 'none' : 'none') : sp.stitch;
  wk.add(rim, M.wheelLeather(sp.stitch === 'none' ? 'none' : mark), null, { uv: 'keep' });
  const airbag = sp.pad === 'airbag' && year >= 1990;
  const momo = sp.wheel === 'momo';
  const spokeM = momo ? M.dash(0x1a1a1c) : sp.spokeMat === 'carbon' ? M.carbon() : M.leather(0x1a1a1c);
  let spokes;
  switch (sp.wheel) {
    case '2': spokes = [-0.12, Math.PI + 0.12]; break;
    case '4': spokes = [0.05, Math.PI - 0.05, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55]; break;
    default: spokes = [0, Math.PI, -Math.PI / 2];
  }
  for (const a of spokes) {
    const sp2 = new THREE.Shape(); const r0 = 0.05, r1 = wR - 0.004;
    const bottom = Math.abs(a + Math.PI / 2) < 0.01;
    const w0 = momo ? 0.018 : 0.032, w1 = momo ? 0.012 : bottom ? 0.014 : 0.022;
    sp2.moveTo(r0, -w0); sp2.quadraticCurveTo(r0 + 0.05, -w1 * 1.4, r1, -w1); sp2.lineTo(r1, w1); sp2.quadraticCurveTo(r0 + 0.05, w1 * 1.4, r0, w0); sp2.closePath();
    const sg = new THREE.ExtrudeGeometry(sp2, { depth: momo ? 0.006 : 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6 });
    sg.translate(0, 0, -0.01); sg.rotateZ(a);
    wk.add(sg, spokeM);
    if (momo) { const ig = new THREE.BoxGeometry(wR - 0.07, 0.004, 0.003); ig.translate(0.03 + (wR - 0.07) / 2, 0, -0.016); ig.rotateZ(a); wk.add(ig, M.satin()); }
    else if (sporty && !bottom && sp.wheel === '3') { const ig = new THREE.BoxGeometry(0.06, 0.006, 0.004); ig.translate(0.1, 0, -0.016); ig.rotateZ(a); wk.add(ig, sp.trim === 'carbon' ? M.carbon() : M.satin()); }
  }
  // hub / horn pad (badge-less)
  let pad;
  if (momo || sp.pad === 'small') pad = new THREE.CylinderGeometry(0.038, 0.042, 0.028, 28).rotateX(Math.PI / 2);
  else if (airbag) pad = roundedBox(sp.wheel === '2' ? 0.11 : 0.12, 0.095, 0.05, 0.03);
  else pad = new THREE.CylinderGeometry(0.05, 0.055, 0.03, 24).rotateX(Math.PI / 2);
  wk.add(pad, M.dash(0x18181a), T(0, -0.006, -0.03));
  if (momo || sp.pad === 'small') wk.add(new THREE.CircleGeometry(0.03, 24), M.gloss(), T(0, -0.006, -0.0445, 0, Math.PI, 0));
  else if (airbag) wk.add(roundedBox(0.05, 0.03, 0.004, 0.012), M.dash(0x222224), T(0, 0.01, -0.0565)); // plain cover seam plate
  if (year >= 2006 && !momo) for (const sx of [1, -1]) wk.add(roundedBox(0.035, 0.02, 0.008, 0.004), M.gloss(), T(sx * 0.1, 0.012, -0.022));
  if (sp.paddles) for (const sx of [1, -1]) wk.add(roundedBox(0.05, 0.08, 0.006, 0.004), M.satin(), T(sx * (wR - 0.06), 0.04, 0.03, 0, 0, sx * 0.2));
  // top-centre marker stripe
  if (sp.marker !== 'none') wk.add(new THREE.TorusGeometry(wR, tubeR + 0.0008, 8, 4, 0.06), IM.red(), T(0, 0, 0, 0, 0, Math.PI / 2 - 0.03));
  wk.build(wheel);
}

// ── seats ──
function buildSeat(sp, sk, { x, Hy, Hz, floorY, seatW, type }) {
  const ins = IM.ins(sp), sideM = IM.side(sp);
  const hw = seatW / 2;
  const bucket = type === 'bucket', comfort = type === 'comfort' || type === 'bench';
  const cl = 0.5;
  const cush = padGeo(cl, t => hw * (0.9 + 0.1 * t), () => 0.06, (t, xn) => (bucket ? 0.032 : comfort ? 0.006 : 0.016) * (1 - sstep(0.45, 0.85, xn)), (t, xn) => xn < (bucket ? 0.5 : 0.6) && t > 0.08 && t < 0.92, 16, 28, 0.03);
  sk.add(cush, [sideM, ins], T(x, Hy - 0.03, Hz + 0.3, -Math.PI / 2 - 0.12));
  const integrated = bucket || type === 'sport';
  const bl = integrated ? 0.8 : 0.62;
  const rec = bucket ? 0.28 : 0.26;
  const bw = t => hw * (integrated ? (t < 0.62 ? 1 - 0.06 * t : lerp(0.94, bucket ? 0.52 : 0.6, sstep(0.62, 0.78, t))) : (1 - 0.1 * t));
  const back = padGeo(bl, bw, t => integrated ? 0.075 - 0.02 * t : 0.065, (t, xn) => (bucket ? 0.06 * (1 - sstep(0.62, 0.8, t)) : type === 'sport' ? 0.035 * (1 - sstep(0.62, 0.8, t)) : 0.012) * (1 - sstep(0.4, 0.82, xn)), (t, xn) => xn < (bucket ? 0.48 : 0.6) && t > 0.06 && t < (integrated ? 0.6 : 0.92), 26, 28, 0.04);
  sk.add(back, [sideM, ins], T(x, Hy - 0.04, Hz - 0.14, -rec));
  const up = (d) => [Math.cos(rec) * d, -Math.sin(rec) * d]; // along the backrest
  if (bucket) {
    // shell wings at the shoulders + harness slots
    for (const sx of [-1, 1]) {
      const [uy, uz] = up(bl * 0.5);
      sk.add(roundedBox(0.05, 0.3, 0.13, 0.022), sideM, T(x + sx * (hw - 0.01), Hy - 0.02 + uy, Hz - 0.12 + uz + 0.03, -rec, 0, sx * 0.08));
      const [hy2, hz2] = up(bl * 0.66);
      sk.add(roundedBox(0.05, 0.012, 0.03, 0.005), M.black(), T(x + sx * 0.07, Hy + 0.02 + hy2, Hz - 0.12 + hz2 + 0.06, -rec));
    }
    // seat shell back (gloss) visible from the rear
    const [sy3, sz3] = up(bl * 0.45);
    sk.add(roundedBox(seatW * 0.9, bl * 0.9, 0.03, 0.03), sp.trim === 'carbon' ? M.carbon() : M.gloss(), T(x, Hy - 0.04 + sy3, Hz - 0.14 + sz3 - 0.085, -rec));
  } else if (!integrated) { // separate headrest on posts
    const hy = Hy + 0.02 + Math.cos(rec) * (bl + 0.1), hz = Hz - 0.12 - Math.sin(rec) * (bl + 0.1);
    sk.add(roundedBox(0.25, 0.17, 0.09, 0.04), sideM, T(x, hy, hz - 0.01, -0.2));
    for (const sx of [-1, 1]) sk.add(new THREE.CylinderGeometry(0.005, 0.005, 0.1, 6), M.satin(), T(x + sx * 0.07, hy - 0.1, hz + 0.02, -rec));
  }
  if (sp.seatStitch) for (const sx of [-1, 1]) { const [sy, sz] = up(bl * 0.35); sk.add(roundedBox(0.004, bl * 0.5, 0.004, 0.0015), M.leather(sp.seatStitch), T(x + sx * hw * 0.5, Hy - 0.04 + sy, Hz - 0.14 + sz + 0.07, -rec)); }
  // base & rails, recline lever
  sk.add(roundedBox(seatW * 0.8, 0.07, 0.42, 0.015), M.black(), T(x, (floorY + Hy + 0.02) / 2, Hz + 0.08));
  for (const sx of [-1, 1]) sk.add(roundedBox(0.03, 0.02, 0.5, 0.006), M.satin(), T(x + sx * seatW * 0.33, floorY + 0.015, Hz + 0.1));
}

// ── shifter ──
function buildShifter(sp, car, kit, g, { dx, side, conTop, Hz, sporty, yDashEdge, zDashEdge, stackFace, stackBot, van }) {
  const shGroup = new THREE.Group();
  let shZ = Hz + (sporty ? 0.34 : 0.4), shY = conTop + 0.006, shX = dx * 0.06;
  let type = sp.knob === 'none' ? 'none' : car.trans.type === 'MT' ? 'mt' : sp.knob === 'puck' ? 'ev' : (sp.knob === 'dashAT' ? 'dash' : 'at');
  if (car.trans.type === 'EV' && sp.knob !== 'puck' && sp.knob !== 'none') type = 'ev';
  if (type === 'dash') { const [x, y, z] = stackFace(stackBot + 0.16, -0.02); shX = x + side * 0.12; shY = y; shZ = z - 0.03; }
  shGroup.position.set(shX, shY, shZ);
  const shKit = new Kit();
  if (type === 'mt') {
    const bp = []; for (let i = 0; i <= 12; i++) { const t = i / 12; bp.push(new THREE.Vector2(lerp(0.055, 0.016, Math.pow(t, 0.8)) + Math.sin(t * 22) * 0.003 * (1 - t), t * 0.08)); }
    kit.add(new THREE.LatheGeometry(bp, 24), M.leather(0x161618), T(shX, shY, shZ));
    kit.add(new THREE.TorusGeometry(0.058, 0.006, 6, 28), M.satin(), T(shX, shY + 0.003, shZ, Math.PI / 2));
    const lever = sporty ? 0.15 : 0.17;
    shKit.add(new THREE.CylinderGeometry(0.008, 0.011, lever, 10), M.satin(), T(0, lever / 2, 0));
    const top = lever + 0.005;
    let knobR = 0.026, kmat = M.leather(0x141416), ky = top;
    switch (sp.knob) {
      case 'ti': knobR = 0.027; kmat = IM.ti(); break;
      case 'ball': knobR = 0.026; kmat = IM.alu(); break;
      case 'teardrop': shKit.add(new THREE.CylinderGeometry(0.02, 0.014, 0.05, 20), IM.alu(), T(0, top - 0.02, 0)); knobR = 0.024; kmat = IM.alu(); ky = top + 0.008; break;
      default: shKit.add(new THREE.CylinderGeometry(0.018, 0.015, 0.04, 20), M.leather(0x141416), T(0, top - 0.02, 0)); knobR = 0.024; break;
    }
    shKit.add(new THREE.SphereGeometry(knobR, 24, 16), kmat, T(0, ky, 0, 0, 0, 0, 1, 0.9, 1));
    const cap = new THREE.Mesh(new THREE.CircleGeometry(knobR * 0.62, 24), new THREE.MeshStandardMaterial({ map: hpatternTex(car.trans.gears.length, sp.rev), roughness: 0.3, metalness: 0.4 }));
    cap.rotation.x = -Math.PI / 2; cap.position.y = ky + knobR * 0.9 + 0.0005; shGroup.add(cap);
  } else if ((type === 'at' || type === 'dash') && sp.knob !== 'dct' && sp.knob !== 'pdk') {
    if (type === 'at') {
      kit.add(roundedBox(0.09, 0.012, 0.2, 0.006), M.gloss(), T(shX, shY + 0.004, shZ - 0.03));
      kit.add(roundedBox(0.012, 0.004, 0.15, 0.002), M.black(), T(shX, shY + 0.011, shZ - 0.03));
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.12), glowPanel('prnd')); lab.rotation.x = -Math.PI / 2; lab.position.set(shX - 0.03 * side, shY + 0.011, shZ - 0.03); g.add(lab);
    } else {
      kit.add(roundedBox(0.07, 0.15, 0.02, 0.008), M.gloss(), T(shX, shY - 0.03, shZ + 0.025, 0.25));
    }
    const L = type === 'dash' ? 0.07 : 0.1;
    shKit.add(new THREE.CylinderGeometry(0.009, 0.011, L, 10), M.satin(), T(0, L / 2, 0, type === 'dash' ? -1.0 : 0));
    const ky = type === 'dash' ? 0.04 : 0.12, kz = type === 'dash' ? -0.05 : 0;
    shKit.add(roundedBox(0.04, 0.07, 0.055, 0.017), M.leather(0x141416), T(0, ky, kz, -0.15));
    shKit.add(roundedBox(0.014, 0.02, 0.014, 0.005), M.satin(), T(-0.022 * side, ky + 0.02, kz));
  } else if (type === 'ev') {
    kit.add(roundedBox(0.1, 0.012, 0.12, 0.02), M.gloss(), T(shX, shY + 0.004, shZ));
    shKit.add(new THREE.CylinderGeometry(0.032, 0.038, 0.035, 28), M.gloss(), T(0, 0.02, 0));
    shKit.add(new THREE.SphereGeometry(0.03, 20, 10, 0, TAU, 0, Math.PI / 2), M.satin(), T(0, 0.037, 0));
  }
  if (sp.knob === 'dct' || sp.knob === 'pdk') { // short gated selector lever
    shGroup.clear(); shKit.buckets.clear();
    kit.add(roundedBox(0.09, 0.014, 0.16, 0.01), M.carbon(), T(shX, shY + 0.004, shZ - 0.02));
    shKit.add(new THREE.CylinderGeometry(0.009, 0.012, 0.07, 10), M.satin(), T(0, 0.035, 0));
    shKit.add(roundedBox(0.045, 0.05, 0.07, 0.018), M.leather(0x121214), T(0, 0.08, -0.01, -0.25));
    type = 'at';
  }
  shKit.build(shGroup);
  g.add(shGroup);
  return { group: shGroup, type: type === 'none' ? 'none' : type === 'dash' ? 'at' : type, gears: car.trans.gears.length, rev: sp.rev, cur: { x: 0, z: 0 }, tgt: { x: 0, z: 0 }, z: shZ };
}

// ── cluster (binnacle + live canvas) ──
function buildCluster(sp, car, kit, g, { dx, eyeY, yDashEdge, zDashEdge, dashM, dashTop, side }) {
  if (sp.cluster === 'none') return null;
  let gw = sp.binW, gh = sp.binH;
  const W = 1024, H = Math.round(W * gh / gw);
  const { c, t } = mkCanvas(W, H);
  const gm = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: 0xdddddd });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), gm);
  const GT = 0.3;
  let cx = dx + sp.binDx, cy = eyeY - 0.285, cz = zDashEdge - 0.035;
  if (sp.binHood === 'top') { // dash-top meter far forward (N-BOX, Prius, taxi)
    cy = yDashEdge + 0.06; cz = zDashEdge + 0.2; gw *= 0.9;
    mesh.position.set(cx, cy, cz); mesh.rotation.set(0.15, Math.PI, 0);
    kit.add(roundedBox(gw + 0.03, gh + 0.03, 0.06, 0.012), dashTop, T(cx, cy, cz + 0.032, 0.15));
    kit.add(roundedBox(gw + 0.05, 0.016, 0.1, 0.006), dashTop, T(cx, cy + gh / 2 + 0.014, cz - 0.015, 0.1));
  } else {
    mesh.position.set(cx, cy, cz); mesh.rotation.set(GT, Math.PI, 0);
    kit.add(roundedBox(gw + 0.07, gh + 0.06, 0.12, 0.03), dashM, T(cx, cy - 0.01, cz + 0.065, GT));
    if (sp.binHood === 'twin') { // two separate square pods (Jimny)
      for (const ox of [-gw / 4, gw / 4]) kit.add(roundedBox(gw / 2 + 0.01, gh + 0.03, 0.09, 0.02), dashTop, T(cx + ox, cy + 0.005, cz - 0.02, GT));
      kit.add(roundedBox(0.012, gh, 0.1, 0.004), dashTop, T(cx, cy, cz - 0.03, GT));
    } else {
      const arch = new THREE.Shape();
      const aw = gw / 2 + 0.045, ah = Math.min(0.09, gh * 0.62);
      arch.absellipse(0, 0, aw, ah, 0, Math.PI, false); arch.lineTo(-aw + 0.014, 0); arch.absellipse(0, 0, aw - 0.014, ah - 0.012, Math.PI, 0, true); arch.lineTo(aw, 0);
      const ag = new THREE.ExtrudeGeometry(arch, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 24 });
      kit.add(ag, dashTop, T(cx, cy + gh / 2 - 0.02, cz - 0.07, GT, 0, 0));
      for (const sx of [1, -1]) kit.add(roundedBox(0.016, gh * 0.75, 0.14, 0.006), dashTop, T(cx + sx * (aw - 0.008), cy + 0.005, cz + 0.0, GT));
    }
    // chrome / satin bezels around analogue dials, matched to the layout
    for (const d of clusterLayout(sp, car, W, H).dials) {
      if (d.r < 70) continue;
      const bx = cx - (d.x / W - 0.5) * gw, by = cy - (d.y / H - 0.5) * gh * Math.cos(GT), bz = cz - (d.y / H - 0.5) * gh * -Math.sin(GT);
      const rr = d.r / W * gw;
      kit.add(bezel(rr + 0.002, 0.0026), sp.cls === 'sport' && car.year < 2000 ? M.dash(0x2a2a2c) : M.chrome(), T(bx, by, bz - 0.004, GT, Math.PI, 0));
      kit.add(tubeOpen(rr + 0.003, 0.016), M.black(), T(bx, by, bz + 0.004, GT, 0, 0));
    }
  }
  mesh.renderOrder = 1; g.add(mesh);
  const cg = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), IM.glass());
  cg.position.copy(mesh.position); cg.rotation.copy(mesh.rotation); cg.translateZ(0.008); cg.renderOrder = 3; cg.customDepthMaterial = M.noShadow(); g.add(cg);
  return { canvas: c, tex: t, mesh, mat: gm, style: sp.cluster, spec: sp, W, H };
}

// ── signature extras ──
function extrasFor(sp, car, kit, g, live, o) {
  const { dx, side, pxs, eyeY, yDashEdge, zDashEdge, stackFace, stackTop, floorY, dashHalf, dashTop } = o;
  const auxScreen = (w, h, cw, ch, draw, x, y, z, rx, ry = 0) => {
    const { c, t, g: gg } = mkCanvas(cw, ch);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: 0xd8d8d8 }));
    m.position.set(x, y, z); m.rotation.set(rx, Math.PI + ry, 0, 'YXZ'); m.renderOrder = 1; g.add(m);
    live.push({ draw: st => { draw(gg, cw, ch, st); t.needsUpdate = true; } });
    draw(gg, cw, ch, {}); t.needsUpdate = true;
    return m;
  };
  const pod = (x, y, z, r, rx, ry) => { // round gauge pod housing
    kit.add(tubeOpen(r + 0.004, 0.05), dashTop, T(x, y, z + 0.02, rx, ry, 0, 1, 1, 1, 'YXZ'));
    kit.add(bezel(r + 0.004, 0.003), M.chrome(), T(x, y, z - 0.004, rx, ry, 0, 1, 1, 1, 'YXZ'));
  };
  for (const ex of sp.extras) switch (ex) {
    case 'mfd': { // R34 multi-function display, hooded, dash top centre
      const y = yDashEdge + 0.035, z = zDashEdge + 0.03;
      kit.add(roundedBox(0.18, 0.1, 0.06, 0.014), dashTop, T(0, y - 0.005, z + 0.02, 0.35));
      kit.add(roundedBox(0.19, 0.012, 0.07, 0.005), dashTop, T(0, y + 0.05, z - 0.005, 0.15));
      auxScreen(0.15, 0.075, 512, 256, drawMfd34, 0, y, z - 0.012, 0.35);
      for (let i = 0; i < 3; i++) kit.add(roundedBox(0.03, 0.012, 0.01, 0.003), M.gloss(), T(-0.05 + i * 0.05, y - 0.05, z - 0.004, 0.35));
      break;
    }
    case 'mfd35': { // R35 centre multi-function screen
      const [x, y, z] = stackFace(stackTop - 0.07);
      kit.add(roundedBox(0.23, 0.13, 0.03, 0.01), M.gloss(), T(x, y, z + 0.006, 0.18));
      auxScreen(0.21, 0.115, 512, 280, drawMfd35, x, y, z - 0.01, 0.18);
      break;
    }
    case 'triple': { // R32 / R33: oil temp, boost, volts above the centre console, angled at the driver
      const [x, y, z] = stackFace(stackTop - 0.03);
      const ry = side * -0.18;
      kit.add(roundedBox(0.2, 0.075, 0.06, 0.02), dashTop, T(x, y, z + 0.015, 0.15, ry, 0, 1, 1, 1, 'YXZ'));
      for (let i = 0; i < 3; i++) pod(x + (i - 1) * 0.062 * Math.cos(ry), y, z - 0.012 + (i - 1) * 0.062 * Math.sin(ry), 0.026, 0.15, ry);
      auxScreen(0.19, 0.0633, 384, 128, drawTriple(['oilt', 'boost', 'volt'], sp), x, y, z - 0.015, 0.15, ry);
      break;
    }
    case 'zPods': { // Z33: three pods on the dash top centre, facing the driver
      const ry = side * -0.25, y = yDashEdge + 0.045, z = zDashEdge + 0.06;
      kit.add(roundedBox(0.2, 0.06, 0.07, 0.025), dashTop, T(0, y - 0.01, z + 0.02, 0.4, ry, 0, 1, 1, 1, 'YXZ'));
      for (let i = 0; i < 3; i++) pod((i - 1) * 0.062 * Math.cos(ry), y, z - 0.012 + (i - 1) * 0.062 * Math.sin(ry), 0.026, 0.4, ry);
      auxScreen(0.19, 0.0633, 384, 128, drawTriple(['volt', 'oilp', 'trip'], sp), 0, y, z - 0.015, 0.4, ry);
      break;
    }
    case 'boostPod': { // S15: boost gauge pod on the centre dash top
      const ry = side * -0.2, y = yDashEdge + 0.035, z = zDashEdge + 0.04;
      kit.add(tubeOpen(0.032, 0.06), dashTop, T(0, y, z + 0.02, 0.35, ry, 0, 1, 1, 1, 'YXZ'));
      kit.add(new THREE.SphereGeometry(0.036, 16, 8, 0, TAU, 0, Math.PI / 2), dashTop, T(0, y + 0.005, z + 0.03, -1.2, ry, 0, 1, 0.5, 1, 'YXZ'));
      pod(0, y, z - 0.008, 0.028, 0.35, ry);
      auxScreen(0.056, 0.056, 128, 128, drawTriple(['boost'], sp), 0, y, z - 0.012, 0.35, ry);
      break;
    }
    case 'start': case 'startL': { // engine start button by the wheel
      const x = dx + pxs * 0.235, y = yDashEdge - 0.11, z = zDashEdge - 0.015;
      kit.add(new THREE.CylinderGeometry(0.017, 0.017, 0.012, 24), M.satin(), T(x, y, z, Math.PI / 2 + 0.1, 0, 0));
      kit.add(new THREE.CylinderGeometry(0.013, 0.013, 0.008, 24), IM.red(), T(x, y, z - 0.008, Math.PI / 2 + 0.1, 0, 0));
      break;
    }
    case 'wrap': { // JZA80: the stack's driver-side flank sweeps around the driver
      const [x, y, z] = stackFace((stackTop + floorY + 0.3) / 2);
      kit.add(roundedBox(0.04, stackTop - floorY - 0.1, 0.36, 0.015), o.dashM, T(x + side * 0.17, (stackTop + floorY + 0.2) / 2, z - 0.12, 0.05, side * -0.35, 0));
      break;
    }
    case 'dccd': { // GDB centre diff dial beside the shifter
      kit.add(new THREE.CylinderGeometry(0.016, 0.018, 0.016, 20), M.satin(), T(side * 0.08, floorY + 0.25, zDashEdge - 0.32));
      break;
    }
    case 'transfer': { // Jimny 4WD transfer lever
      const tg = new Kit(); tg.add(new THREE.CylinderGeometry(0.007, 0.009, 0.14, 8), M.satin(), T(side * -0.02, floorY + 0.31, zDashEdge - 0.55, -0.15)); tg.add(new THREE.SphereGeometry(0.02, 16, 10), M.leather(0x141416), T(side * -0.02, floorY + 0.38, zDashEdge - 0.56)); tg.build(g);
      break;
    }
    case 'honeycomb': break;
    case 'lfaKnobs': {
      kit.add(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 32), M.satin(), T(0, yDashEdge - 0.06, zDashEdge - 0.03, Math.PI / 2, 0, 0));
      break;
    }
    case 'taxiMeter': { // fare meter on the dash top centre-left + receipt printer
      const x = pxs * 0.12, y = yDashEdge + 0.03, z = zDashEdge + 0.02;
      kit.add(roundedBox(0.2, 0.06, 0.1, 0.01), M.dash(0x141416), T(x, y, z + 0.03, 0.2));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.04), screenMat('taxi', 0.9, 512, 128)); m.position.set(x, y + 0.004, z - 0.022); m.rotation.set(0.2, Math.PI, 0); m.renderOrder = 1; g.add(m);
      kit.add(roundedBox(0.12, 0.05, 0.12, 0.01), M.dash(0x2a2a2c), T(x, y - 0.1, z - 0.02, 0.2));
      break;
    }
    case 'policeRadio': { // radio / siren controller under the centre stack + handset
      const [x, y, z] = stackFace(floorY + 0.36, -0.03);
      kit.add(roundedBox(0.18, 0.05, 0.12, 0.008), M.dash(0x121214), T(x, y, z, 0.18));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.035), screenMat('police', 0.85, 512, 128)); m.position.set(x, y + 0.006, z - 0.062); m.rotation.set(0.18, Math.PI, 0); m.renderOrder = 1; g.add(m);
      kit.add(roundedBox(0.035, 0.07, 0.025, 0.012), M.dash(0x111112), T(x - side * 0.14, y + 0.08, z - 0.02, 0.2));
      break;
    }
    default: break;
  }
}

// ───────────────────────── cluster drawing ─────────────────────────
const A0 = Math.PI * 0.75, A1 = Math.PI * 2.25; // 270° sweep, 0 at lower-left
const GAUGES = {
  tach: sp => ({ min: 0, max: sp.tachMax, major: 1000, minor: sp.tachMax > 9000 ? 500 : 250, red: sp.red, fmt: v => v / 1000, label: 'x1000r/min' }),
  speed: sp => ({ min: 0, max: sp.speedMax, major: sp.speedMax > 200 ? 20 : 10, minor: sp.speedMax > 200 ? 10 : 5, fmtEvery: sp.speedMax > 200 ? 40 : 20, label: 'km/h' }),
  temp: () => ({ min: 0, max: 1, small: true, ends: ['C', 'H'], red: 0.85 }),
  fuel: () => ({ min: 0, max: 1, small: true, ends: ['E', 'F'] }),
  boost: () => ({ min: -1, max: 1, major: 0.5, minor: 0.1, fmt: v => (v === 0 ? '0' : v > 0 ? '+' + v : String(v)), label: '×100kPa', red: 0.8, mid: true }),
  oilt: () => ({ min: 50, max: 150, major: 50, minor: 10, fmt: v => v, label: 'OIL °C', red: 130, mid: true }),
  oilp: () => ({ min: 0, max: 10, major: 5, minor: 1, fmt: v => v, label: 'OIL kg/cm²', mid: true }),
  volt: () => ({ min: 8, max: 16, major: 4, minor: 1, fmt: v => v, label: 'VOLT', mid: true }),
  trip: () => ({ digital: true, label: 'TRIP' }),
};
// analogue layouts: dial list in canvas pixels (W x H)
function clusterLayout(sp, car, W, H) {
  const L = { dials: [], screen: null };
  const d = (kind, x, y, r, extra = {}) => L.dials.push({ kind, x, y, r, ...extra });
  const mid = H / 2;
  switch (sp.cluster) {
    case 'twin': {
      const r = Math.min(H * 0.46, W * 0.2), tl = !!sp.tachLeft;
      d(tl ? 'tach' : 'speed', W * 0.27, mid, r); d(tl ? 'speed' : 'tach', W * 0.73, mid, r);
      if (sp.boost) { d('boost', W * 0.5, mid - H * 0.22, r * 0.36); d('temp', W * 0.44, mid + H * 0.22, r * 0.3); d('fuel', W * 0.56, mid + H * 0.22, r * 0.3); }
      else { d('temp', W * 0.5, mid - H * 0.2, r * 0.34); d('fuel', W * 0.5, mid + H * 0.23, r * 0.34); }
      break;
    }
    case 'tri': case 'r34': case 'sti': case 'fd': case 'nd': {
      const rt = Math.min(H * 0.48, W * 0.21), rs = rt * (sp.cluster === 'fd' ? 0.66 : 0.8);
      const sl = !!sp.speedLeft || sp.cluster === 'fd';
      d('tach', W * 0.5, mid, rt, sp.cluster === 'sti' ? { red_face: true } : {});
      d('speed', sl ? W * 0.18 : W * 0.82, mid + H * 0.05, rs);
      const ox = sl ? W * 0.82 : W * 0.18;
      if (sp.cluster === 'nd') L.screen = { x: ox, y: mid + H * 0.05, r: rs };
      else if (sp.boost) { d('boost', ox, mid - H * 0.15, rs * 0.48); d('temp', ox - rs * 0.4, mid + H * 0.27, rs * 0.36); d('fuel', ox + rs * 0.4, mid + H * 0.27, rs * 0.36); }
      else { d('temp', ox, mid - H * 0.2, rs * 0.45); d('fuel', ox, mid + H * 0.25, rs * 0.45); }
      break;
    }
    case 'r35': {
      const rt = H * 0.47; d('tach', W * 0.5, mid, rt); d('speed', W * 0.82, mid + H * 0.04, rt * 0.8);
      L.screen = { x: W * 0.18, y: mid + H * 0.04, r: rt * 0.8 }; break;
    }
    case 'nsx': {
      const r = H * 0.46; d('speed', W * 0.36, mid, r); d('tach', W * 0.64, mid, r);
      d('fuel', W * 0.1, mid - H * 0.18, r * 0.42); d('temp', W * 0.1, mid + H * 0.25, r * 0.42); d('oilp', W * 0.9, mid - H * 0.18, r * 0.42); d('volt', W * 0.9, mid + H * 0.25, r * 0.42);
      break;
    }
    case 'e46': {
      const r = Math.min(H * 0.46, W * 0.2); d('speed', W * 0.27, mid, r); d('tach', W * 0.73, mid, r); d('fuel', W * 0.5, mid - H * 0.18, r * 0.33); d('oilt', W * 0.5, mid + H * 0.22, r * 0.33);
      break;
    }
    case 'opti': {
      const r = Math.min(H * 0.46, W * 0.19); d('speed', W * 0.3, mid, r); d('tach', W * 0.7, mid, r); d('fuel', W * 0.08, mid, r * 0.45); d('temp', W * 0.92, mid, r * 0.45);
      break;
    }
    case 'p911': {
      const rt = H * 0.47; d('tach', W * 0.5, mid, rt);
      L.screens2 = [{ x: W * 0.18, y: mid, r: rt * 0.9, kind: 'speed' }, { x: W * 0.82, y: mid, r: rt * 0.9, kind: 'map' }];
      d('speed', W * 0.18, mid, rt * 0.85, { virtual: true }); break;
    }
    case 'jimny': { const r = H * 0.44; d('tach', W * 0.25, mid, r); d('speed', W * 0.75, mid, r); break; }
    case 'single': { const r = H * 0.47; d('speed', W * 0.5, mid, r); d('fuel', W * 0.16, mid, r * 0.5); d('temp', W * 0.84, mid, r * 0.5); break; }
    default: break;
  }
  return L;
}
// warm-up / derived values
function derived(st, sp, state) {
  const run = st.running !== false;
  state.warm = clamp((state.warm ?? 0.35) + (run ? 0.0006 : -0.0002), 0, 1);
  const rpm = st.rpm || 0;
  return {
    tach: rpm, speed: st.kmh || 0, kw: Math.abs(st.kw || 0),
    temp: 0.08 + state.warm * 0.42, fuel: clamp(st.fuel ?? 0.7, 0, 1),
    boost: run ? (sp.turbo ? -0.65 + (st.boost || 0) * 1.75 : -0.6 + rpm / 20000) : 0,
    oilt: 50 + state.warm * 40 + rpm / 400, oilp: run ? clamp(1.5 + rpm / 1100, 0, 9.5) : 0, volt: run ? 14.1 : 12.3,
  };
}
const FONT = 'Arial, Helvetica, sans-serif';
function drawDialFace(g, d, sp, night) {
  const G = GAUGES[d.kind]?.(sp) || {};
  const lit = night ? sp.light : '#f2f2f2';
  const { x, y, r } = d;
  const face = d.red_face ? (night ? '#3a0606' : '#5a0a0a') : sp.face;
  const gr = g.createRadialGradient(x, y - r * 0.2, r * 0.1, x, y, r); gr.addColorStop(0, d.red_face ? face : '#121417'); gr.addColorStop(1, face);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  if (night) { g.shadowColor = lit; g.shadowBlur = r * 0.06; }
  if (G.small) { // 90° minor gauge with end letters
    const a0 = Math.PI * 1.2, a1 = Math.PI * 1.8;
    g.strokeStyle = lit; g.lineWidth = Math.max(2, r * 0.05);
    for (let i = 0; i <= 4; i++) { const a = lerp(a0, a1, i / 4); g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.62, y + 0.25 * r + Math.sin(a) * r * 0.62); g.lineTo(x + Math.cos(a) * r * 0.85, y + 0.25 * r + Math.sin(a) * r * 0.85); g.stroke(); }
    if (G.red) { g.strokeStyle = '#e02010'; g.lineWidth = r * 0.1; g.beginPath(); g.arc(x, y + 0.25 * r, r * 0.8, lerp(a0, a1, G.red), a1); g.stroke(); }
    g.fillStyle = lit; g.font = `bold ${Math.round(r * 0.26)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(G.ends[0], x + Math.cos(a0) * r * 0.62, y + r * 0.62); g.fillText(G.ends[1], x + Math.cos(a1) * r * 0.62, y + r * 0.62);
    g.shadowBlur = 0; return;
  }
  if (G.digital) { g.fillStyle = '#0a120a'; g.fillRect(x - r * 0.7, y - r * 0.3, r * 1.4, r * 0.6); g.fillStyle = lit; g.font = `${Math.round(r * 0.22)}px ${FONT}`; g.textAlign = 'center'; g.fillText(G.label, x, y - r * 0.45); g.shadowBlur = 0; return; }
  const span = G.max - G.min, a0 = A0, a1 = A1;
  const red = d.kind === 'tach' ? sp.redline : G.red;
  if (red) { g.strokeStyle = '#d0140c'; g.lineWidth = r * 0.07; g.beginPath(); g.arc(x, y, r * 0.9, a0 + (a1 - a0) * (red - G.min) / span, a1); g.stroke(); }
  const minor = G.minor || G.major;
  for (let v = G.min, i = 0; v <= G.max + 1e-6; v = G.min + (++i) * minor) {
    const a = a0 + (a1 - a0) * (v - G.min) / span, major = Math.abs((v - G.min) / G.major - Math.round((v - G.min) / G.major)) < 1e-6;
    g.strokeStyle = red && v >= red - 1e-6 ? '#ff4030' : lit; g.lineWidth = major ? Math.max(2, r * 0.025) : Math.max(1, r * 0.012);
    const r0 = r * (major ? 0.8 : 0.86);
    g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); g.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95); g.stroke();
    const every = G.fmtEvery || G.major;
    if (major && Math.abs((v - G.min) / every - Math.round((v - G.min) / every)) < 1e-6) {
      g.fillStyle = red && v >= red ? '#ff4030' : lit; g.font = `bold ${Math.round(r * (G.mid ? 0.2 : 0.15))}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const rr = r * (G.mid ? 0.56 : 0.64); g.fillText(String(G.fmt ? G.fmt(v) : v), x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
  }
  g.fillStyle = night ? lit : '#9aa4ae'; g.font = `${Math.round(r * (G.mid ? 0.13 : 0.085))}px ${FONT}`; g.textAlign = 'center'; g.fillText(G.label || '', x, y + r * 0.42);
  g.shadowBlur = 0;
}
function drawNeedle(g, d, sp, val, col) {
  const G = GAUGES[d.kind]?.(sp) || {};
  if (G.digital) { g.fillStyle = sp.light; g.font = `bold ${Math.round(d.r * 0.42)}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((val ?? 0).toFixed(1), d.x, d.y + d.r * 0.02); return; }
  const { x, y, r } = d;
  let a, cyy = y, rr = r;
  if (G.small) { cyy = y + 0.25 * r; a = lerp(Math.PI * 1.2, Math.PI * 1.8, clamp(val, 0, 1)); rr = r * 0.8; }
  else a = A0 + (A1 - A0) * clamp((val - G.min) / (G.max - G.min), -0.01, 1.02);
  g.save(); g.translate(x, cyy); g.rotate(a);
  g.shadowColor = col; g.shadowBlur = r * 0.08; g.fillStyle = col;
  g.beginPath(); g.moveTo(-rr * 0.16, -r * 0.022); g.lineTo(rr * 0.9, -r * 0.008); g.lineTo(rr * 0.9, r * 0.008); g.lineTo(-rr * 0.16, r * 0.022); g.fill();
  g.restore(); g.shadowBlur = 0;
  g.fillStyle = '#16171a'; g.beginPath(); g.arc(x, cyy, r * (G.small ? 0.12 : 0.09), 0, TAU); g.fill(); g.strokeStyle = '#3a3c40'; g.lineWidth = 2; g.stroke();
}
// screen (TFT) clusters
function drawTft(g, W, H, sp, v, st, night) {
  const variant = sp.cluster.split(':')[1] || 'twin';
  const acc = sp.accent || '#3aa0ff';
  g.fillStyle = '#020305'; g.fillRect(0, 0, W, H);
  const bg = g.createRadialGradient(W / 2, H * 0.6, 20, W / 2, H * 0.6, W * 0.6); bg.addColorStop(0, '#0e1620'); bg.addColorStop(1, '#020305'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const txt = (s, x, y, size, col = '#f2f6fa', bold = true, align = 'center') => { g.fillStyle = col; g.font = `${bold ? 'bold ' : ''}${Math.round(size)}px ${FONT}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); };
  const kmh = Math.round(Math.abs(v.speed));
  const frac = sp.ev ? v.kw / 150 : v.tach / sp.tachMax;
  const ring = (cx, cy, r, f, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ticks = true) => {
    g.lineWidth = r * 0.09; g.strokeStyle = '#141c26'; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
    const grd = g.createLinearGradient(cx - r, 0, cx + r, 0); grd.addColorStop(0, acc); grd.addColorStop(0.8, '#ffffff'); grd.addColorStop(1, '#ff3a2a');
    g.strokeStyle = grd; g.shadowColor = acc; g.shadowBlur = 16; g.beginPath(); g.arc(cx, cy, r, a0, a0 + (a1 - a0) * clamp(f, 0, 1)); g.stroke(); g.shadowBlur = 0;
    if (ticks && !sp.ev) {
      const n = sp.tachMax / 1000;
      for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; g.strokeStyle = i * 1000 >= sp.redline ? '#ff3a2a' : '#8a9aaa'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1); g.lineTo(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2); g.stroke(); txt(String(i), cx + Math.cos(a) * r * 1.34, cy + Math.sin(a) * r * 1.34, r * 0.14, i * 1000 >= sp.redline ? '#ff5a4a' : '#c8d2dc'); }
    }
  };
  const side = (x, y) => { // fuel / temp bars
    txt('FUEL', x, y - H * 0.18, H * 0.06, '#7a8a9a', false);
    g.fillStyle = '#18202a'; g.fillRect(x - W * 0.07, y - H * 0.12, W * 0.14, H * 0.05); g.fillStyle = acc; g.fillRect(x - W * 0.07, y - H * 0.12, W * 0.14 * v.fuel, H * 0.05);
    txt('TEMP', x, y + H * 0.04, H * 0.06, '#7a8a9a', false);
    g.fillStyle = '#18202a'; g.fillRect(x - W * 0.07, y + H * 0.1, W * 0.14, H * 0.05); g.fillStyle = '#c8d2dc'; g.fillRect(x - W * 0.07, y + H * 0.1, W * 0.14 * v.temp * 1.6, H * 0.05);
    if (sp.turbo) { // boost bar
      txt('BOOST', x, y + H * 0.26, H * 0.06, '#7a8a9a', false);
      g.fillStyle = '#18202a'; g.fillRect(x - W * 0.07, y + H * 0.32, W * 0.14, H * 0.05); g.fillStyle = '#ffb030'; g.fillRect(x - W * 0.07, y + H * 0.32, W * 0.14 * clamp((v.boost + 1) / 2, 0, 1), H * 0.05);
    }
  };
  const gear = String(st.gear ?? 'N');
  switch (variant) {
    case 'ring': case 'a90': case 's660': case 'ev': {
      const cx = variant === 'a90' ? W * 0.6 : W / 2, cy = H * 0.55, r = H * 0.36;
      ring(cx, cy, r, frac);
      txt(String(kmh), cx, cy - H * 0.04, H * 0.24); txt('km/h', cx, cy + H * 0.13, H * 0.06, '#8a9aaa', false);
      txt(sp.ev ? (st.gear ?? 'D') : gear, cx, cy + H * 0.28, H * 0.12, '#ff9a3c');
      side(variant === 'a90' ? W * 0.2 : W * 0.14, H * 0.55);
      if (variant !== 'a90') { txt(st.info || '', W * 0.86, H * 0.45, H * 0.07, '#9ad', false); if (st.warn) txt(st.warn, W * 0.86, H * 0.62, H * 0.06, '#ff3a2a'); }
      else if (st.warn) txt(st.warn, W * 0.2, H * 0.88, H * 0.06, '#ff3a2a');
      break;
    }
    case 'bar': { // horizontal bar tach across the top (FL5 +R)
      const n = 20, f = frac;
      for (let i = 0; i < n; i++) { const on = i / n < f; const x = W * 0.12 + i * W * 0.038; g.fillStyle = on ? (i / n > sp.redline / sp.tachMax - 0.05 ? '#ff2a2a' : i / n > 0.6 ? '#ffd040' : acc) : '#16202a'; g.fillRect(x, H * 0.12, W * 0.03, H * 0.16); }
      txt(String(kmh), W * 0.5, H * 0.58, H * 0.3); txt('km/h', W * 0.5, H * 0.8, H * 0.06, '#8a9aaa', false);
      txt(gear, W * 0.78, H * 0.58, H * 0.26, '#ff3a2a'); side(W * 0.18, H * 0.62);
      if (st.warn) txt(st.warn, W * 0.5, H * 0.92, H * 0.06, '#ff3a2a');
      break;
    }
    case 'top': case 'wide': default: { // two virtual dials / modern simple
      if (variant === 'twin' || variant === 'wide') {
        const r = H * 0.34;
        ring(W * 0.24, H * 0.55, r, frac);
        txt(gear, W * 0.24, H * 0.55, H * 0.2, '#ff9a3c');
        const sf = Math.abs(v.speed) / sp.speedMax; ring(W * 0.76, H * 0.55, r, sf, Math.PI * 0.75, Math.PI * 2.25, false);
        txt(String(kmh), W * 0.76, H * 0.52, H * 0.2); txt('km/h', W * 0.76, H * 0.68, H * 0.05, '#8a9aaa', false);
        txt(st.info || '', W * 0.5, H * 0.4, H * 0.07, '#9ad', false); if (st.warn) txt(st.warn, W * 0.5, H * 0.6, H * 0.06, '#ff3a2a');
      } else { // simple dash-top meter: big digital speed + bars
        txt(String(kmh), W * 0.42, H * 0.5, H * 0.46); txt('km/h', W * 0.42, H * 0.84, H * 0.08, '#8a9aaa', false);
        txt(sp.ev || car_at(st) ? gear : gear, W * 0.8, H * 0.45, H * 0.3, '#ff9a3c');
        g.fillStyle = '#18202a'; g.fillRect(W * 0.06, H * 0.15, W * 0.12, H * 0.7); g.fillStyle = acc; const fh = H * 0.7 * v.fuel; g.fillRect(W * 0.06, H * 0.85 - fh, W * 0.12, fh);
        if (st.warn) txt(st.warn, W * 0.8, H * 0.82, H * 0.08, '#ff3a2a');
      }
      break;
    }
  }
}
const car_at = () => false;
function drawS2000(g, W, H, sp, v, st, night) {
  g.fillStyle = '#020304'; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 1.25, r = H * 1.05;
  const a0 = Math.PI * 1.18, a1 = Math.PI * 1.82, n = 45, f = v.tach / sp.tachMax;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, a = lerp(a0, a1, t0), on = t0 < f;
    const red = t0 * sp.tachMax >= sp.redline - 200;
    g.strokeStyle = on ? (red ? '#ff2a1a' : t0 > 0.66 ? '#ffb020' : '#ff7a20') : '#1a1410'; g.lineWidth = H * 0.12;
    if (on) { g.shadowColor = g.strokeStyle; g.shadowBlur = 10; }
    g.beginPath(); g.arc(cx, cy, r, a, a + (a1 - a0) / n * 0.7); g.stroke(); g.shadowBlur = 0;
  }
  g.fillStyle = '#ffb060'; g.font = `bold ${Math.round(H * 0.08)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 0; k <= sp.tachMax / 1000; k++) { const a = lerp(a0, a1, k * 1000 / sp.tachMax); g.fillText(String(k), cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); }
  g.fillStyle = '#ff9a3c'; g.font = `bold ${Math.round(H * 0.34)}px monospace`; g.fillText(String(Math.round(Math.abs(v.speed))), cx, H * 0.66);
  g.font = `${Math.round(H * 0.07)}px ${FONT}`; g.fillText('km/h', cx + W * 0.13, H * 0.74);
  // fuel / temp segment columns
  for (const [x, val] of [[W * 0.08, v.fuel], [W * 0.92, v.temp * 1.5]]) for (let i = 0; i < 8; i++) { g.fillStyle = i / 8 < val ? '#ff8a2a' : '#1a1410'; g.fillRect(x - W * 0.025, H * 0.85 - i * H * 0.08, W * 0.05, H * 0.05); }
  if (st.warn) { g.fillStyle = '#ff3a2a'; g.font = `bold ${Math.round(H * 0.07)}px ${FONT}`; g.fillText(st.warn, cx, H * 0.9); }
}
function drawLfa(g, W, H, sp, v, st, night, state) {
  g.fillStyle = '#030304'; g.fillRect(0, 0, W, H);
  // the ring slides right when the car is stationary (menu), centred while driving
  state.ring = lerp(state.ring ?? 0, Math.abs(v.speed) < 3 ? 1 : 0, 0.15);
  const cx = W / 2 + state.ring * W * 0.18, cy = H / 2, r = H * 0.44;
  if (state.ring > 0.05) { g.globalAlpha = state.ring; g.fillStyle = '#9ab'; g.font = `${Math.round(H * 0.06)}px ${FONT}`; g.textAlign = 'left'; ['DRIVE MODE', 'SPORT', 'TRIP', 'SETTINGS'].forEach((s, i) => g.fillText(s, W * 0.08, H * 0.3 + i * H * 0.12)); g.globalAlpha = 1; }
  g.fillStyle = '#0b0c0e'; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = '#d8dce0'; g.lineWidth = H * 0.025; g.beginPath(); g.arc(cx, cy, r + H * 0.02, 0, TAU); g.stroke();
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, f = v.tach / sp.tachMax;
  for (let k = 0; k <= sp.tachMax / 1000; k++) { const a = lerp(a0, a1, k * 1000 / sp.tachMax); g.fillStyle = k * 1000 >= sp.redline ? '#ff3a2a' : '#e8ecef'; g.font = `bold ${Math.round(H * 0.07)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k), cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); }
  // needle-type light bar
  const an = lerp(a0, a1, clamp(f, 0, 1));
  g.strokeStyle = '#ff6a1a'; g.lineWidth = H * 0.05; g.shadowColor = '#ff6a1a'; g.shadowBlur = 18; g.beginPath(); g.arc(cx, cy, r * 0.93, an - 0.06, an); g.stroke(); g.shadowBlur = 0;
  g.fillStyle = '#ffffff'; g.font = `bold ${Math.round(H * 0.2)}px ${FONT}`; g.fillText(String(st.gear ?? 'N'), cx, cy - H * 0.04);
  g.font = `${Math.round(H * 0.09)}px ${FONT}`; g.fillStyle = '#c8d2dc'; g.fillText(`${Math.round(Math.abs(v.speed))} km/h`, cx, cy + H * 0.2);
  if (st.warn) { g.fillStyle = '#ff3a2a'; g.font = `bold ${Math.round(H * 0.06)}px ${FONT}`; g.fillText(st.warn, cx, cy + H * 0.33); }
}
function telltales(g, W, H, L, blink, st, small = false) {
  const y = small ? H * 0.1 : H * 0.08, s = H / 384;
  const tt = (x, kind, on, col) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = g.strokeStyle = on ? col : 'rgba(0,0,0,0)'; g.lineWidth = 4; if (on) { g.shadowColor = col; g.shadowBlur = 14; }
    if (kind === 'l') { g.beginPath(); g.moveTo(-22, 0); g.lineTo(-4, -16); g.lineTo(-4, -7); g.lineTo(20, -7); g.lineTo(20, 7); g.lineTo(-4, 7); g.lineTo(-4, 16); g.fill(); }
    else if (kind === 'r') { g.beginPath(); g.moveTo(22, 0); g.lineTo(4, -16); g.lineTo(4, -7); g.lineTo(-20, -7); g.lineTo(-20, 7); g.lineTo(4, 7); g.lineTo(4, 16); g.fill(); }
    else if (kind === 'hi') { g.beginPath(); g.arc(-6, 0, 12, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fill(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(10, i * 8); g.lineTo(24, i * 8); g.stroke(); } }
    else if (kind === 'p') { g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.stroke(); g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 0, 1); }
    g.restore();
  };
  tt(W / 2 - 60 * s, 'l', (L.left || L.hazard) && blink, '#2fe05a'); tt(W / 2 + 60 * s, 'r', (L.right || L.hazard) && blink, '#2fe05a');
  tt(W / 2, 'hi', L.head && L.high, '#3a6dff');
  if (st.hb || /\(P\)/.test(st.warn || '')) tt(W / 2 + 110 * s, 'p', true, '#ff3a2a');
}

/** Paint the live cockpit (cluster + aux displays). model: CarModel, st: drawGauges state */
export function drawCockpit(model, st) {
  const gg = model.parts.gauge, sp = gg?.spec || model.parts.cockpitSpec;
  const state = model._ck ||= {};
  if (!sp) return;
  sp.redline = model.car.engine.redline;
  const v = derived(st, sp, state);
  const night = (st.night ?? 1) > 0.45;
  // faint fill on the cabin trim at night (cluster / switch backlight + street-light spill), so it reads in the dark
  if (!state.mats) {
    state.mats = new Set();
    model.bodyG.traverse(o => { if (o.isMesh && o.material && (o.name === 'headliner' || o.parent?.name === 'interior' || o.parent?.parent?.name === 'interior')) for (const m of [].concat(o.material)) if (m.isMeshStandardMaterial && !m.transparent && m.emissive && m.emissive.getHex() === 0 && !m.emissiveMap) state.mats.add(m); });
  }
  const fill = 0.025 + clamp(((st.night ?? 1) - 0.3) / 0.7, 0, 1) * 0.04;
  if (Math.abs((state.fill ?? -1) - fill) > 0.002) { state.fill = fill; for (const m of state.mats) m.emissive.copy(m.color).multiplyScalar(fill * (m.map ? 1 : m.side === THREE.BackSide || m.side === THREE.DoubleSide ? 3 : 1.6)); }
  for (const l of model.parts.cockpitLive || []) l.draw({ ...st, v, night });
  if (!gg) return;
  const c = gg.canvas, g = c.getContext('2d'), W = gg.W, H = gg.H;
  const L = model.lights, blink = model.blinkOn;
  const style = sp.cluster;
  if (style.startsWith('tft')) { drawTft(g, W, H, sp, v, st, night); telltales(g, W, H, L, blink, st, true); }
  else if (style === 's2000') { drawS2000(g, W, H, sp, v, st, night); telltales(g, W, H, L, blink, st, true); }
  else if (style === 'lfa') { drawLfa(g, W, H, sp, v, st, night, state); telltales(g, W, H, L, blink, st, true); }
  else {
    const key = night ? 'bgN' : 'bgD';
    if (!gg[key]) {
      const bc = document.createElement('canvas'); bc.width = W; bc.height = H; const b = bc.getContext('2d');
      b.fillStyle = '#020203'; b.fillRect(0, 0, W, H);
      const lay = clusterLayout(sp, model.car, W, H); gg.layout = lay;
      for (const d of lay.dials) drawDialFace(b, d, sp, night);
      gg[key] = bc;
    }
    g.drawImage(gg[key], 0, 0);
    const lay = gg.layout;
    const needle = night ? sp.needle : sp.needle;
    for (const d of lay.dials) {
      if (d.virtual) continue;
      const val = d.kind === 'tach' && sp.ev ? v.kw : v[d.kind];
      drawNeedle(g, d, sp, val ?? 0, d.red_face ? '#f4f4f4' : needle);
    }
    // odometer / gear LCD in the tach
    const tach = lay.dials.find(d => d.kind === 'tach');
    if (tach) {
      g.fillStyle = '#0c120c'; const lw = tach.r * 0.62, lh = tach.r * 0.16; g.fillRect(tach.x - lw / 2, tach.y + tach.r * 0.55, lw, lh);
      g.fillStyle = night ? sp.light : '#cfe8cf'; g.font = `${Math.round(lh * 0.8)}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(Math.floor((st.odo || 0) / 1000 + 48213)).padStart(6, '0'), tach.x, tach.y + tach.r * 0.55 + lh / 2);
      if (st.warn && /ENGINE/.test(st.warn)) { g.fillStyle = '#ff3a2a'; g.beginPath(); g.arc(tach.x, tach.y - tach.r * 0.35, tach.r * 0.06, 0, TAU); g.fill(); }
    }
    if (lay.screen) drawSubScreen(g, lay.screen, sp, v, st);
    if (sp.cluster === 'p911') for (const s of lay.screens2) drawSubScreen(g, s, sp, v, st);
    telltales(g, W, H, L, blink, st);
  }
  gg.mat.color.setScalar(night ? 0.82 : 0.95);
  gg.tex.needsUpdate = true;
}
function drawSubScreen(g, s, sp, v, st) { // round TFT inside an analogue cluster (R35 / ND / 992)
  const { x, y, r } = s;
  g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  g.fillStyle = '#05080c'; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.fillStyle = '#e8eef4'; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (s.kind === 'map') { g.strokeStyle = '#2a3a4c'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - r, y + r * 0.4); g.quadraticCurveTo(x, y - r * 0.2, x + r, y - r * 0.5); g.stroke(); g.strokeStyle = '#3a8cff'; g.lineWidth = 8; g.beginPath(); g.moveTo(x, y + r); g.lineTo(x, y); g.quadraticCurveTo(x, y - r * 0.3, x + r, y - r * 0.5); g.stroke(); }
  else if (s.kind === 'speed') { g.font = `bold ${Math.round(r * 0.5)}px ${FONT}`; g.fillText(String(Math.round(Math.abs(v.speed))), x, y - r * 0.05); g.font = `${Math.round(r * 0.14)}px ${FONT}`; g.fillStyle = '#8a9aaa'; g.fillText('km/h', x, y + r * 0.35); }
  else { // fuel / temp / gear info
    g.font = `bold ${Math.round(r * 0.42)}px ${FONT}`; g.fillStyle = '#ff9a3c'; g.fillText(String(st.gear ?? 'N'), x, y - r * 0.2);
    g.fillStyle = '#1a2430'; g.fillRect(x - r * 0.6, y + r * 0.25, r * 1.2, r * 0.1); g.fillStyle = '#c8d2dc'; g.fillRect(x - r * 0.6, y + r * 0.25, r * 1.2 * v.fuel, r * 0.1);
    g.fillStyle = '#1a2430'; g.fillRect(x - r * 0.6, y + r * 0.45, r * 1.2, r * 0.1); g.fillStyle = '#c8d2dc'; g.fillRect(x - r * 0.6, y + r * 0.45, r * 1.2 * v.temp * 1.5, r * 0.1);
  }
  g.restore();
}
// R34 MFD: boost / oil temp / water temp bar meters
function drawMfd34(g, W, H, st) {
  const v = st.v || { boost: 0, oilt: 70, temp: 0.4 };
  g.fillStyle = '#04070c'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#123'; g.lineWidth = 2; g.strokeRect(6, 6, W - 12, H - 12);
  const items = [['BOOST', (v.boost + 1) / 2, (v.boost * 100).toFixed(0) + ' kPa', '#ffb030'], ['OIL TEMP', (v.oilt - 50) / 100, Math.round(v.oilt) + ' °C', '#5ad0ff'], ['WATER', v.temp * 1.4, Math.round(60 + v.temp * 60) + ' °C', '#5ad0ff']];
  items.forEach(([n, f, val, col], i) => {
    const x = 24 + i * (W - 48) / 3, w = (W - 48) / 3 - 18;
    g.fillStyle = '#8ab'; g.font = 'bold 22px monospace'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(n, x, 40);
    g.strokeStyle = '#2a3a4a'; g.strokeRect(x, 56, w, 130);
    const segs = 12; for (let k = 0; k < segs; k++) { g.fillStyle = k / segs < clamp(f, 0, 1) ? (k > 9 ? '#ff3a2a' : col) : '#0c141c'; g.fillRect(x + 6, 176 - k * 10.4, w - 12, 7); }
    g.fillStyle = '#e8f0f8'; g.font = 'bold 24px monospace'; g.fillText(val, x, 226);
  });
}
function drawMfd35(g, W, H, st) {
  const v = st.v || { boost: 0, oilt: 70, temp: 0.4 };
  g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
  const cell = (i, n, f, val, col) => {
    const x = (i % 2) * W / 2 + 12, y = Math.floor(i / 2) * H / 2 + 12, w = W / 2 - 24, h = H / 2 - 24;
    g.strokeStyle = '#1e2a38'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
    g.fillStyle = '#8a9aaa'; g.font = '20px sans-serif'; g.textAlign = 'left'; g.fillText(n, x + 10, y + 28);
    g.strokeStyle = col; g.lineWidth = 10; g.beginPath(); g.arc(x + w * 0.72, y + h * 0.62, h * 0.32, Math.PI * 0.8, Math.PI * 0.8 + Math.PI * 1.4 * clamp(f, 0, 1)); g.stroke();
    g.fillStyle = '#f0f4f8'; g.font = 'bold 30px sans-serif'; g.fillText(val, x + 10, y + h - 16);
  };
  cell(0, 'BOOST', (v.boost + 1) / 2, (v.boost).toFixed(2), '#ffb030'); cell(1, 'OIL TEMP', (v.oilt - 50) / 100, Math.round(v.oilt) + '°', '#5ad0ff');
  cell(2, 'WATER', v.temp * 1.4, Math.round(60 + v.temp * 60) + '°', '#5ad0ff');
  const ax = clamp(-(st.ay || 0) / 12, -1, 1), az = clamp((st.ax || 0) / 12, -1, 1);
  const x = W * 0.75, y = H * 0.75, r = H * 0.18; g.strokeStyle = '#2a3a4a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke();
  g.fillStyle = '#ffb030'; g.beginPath(); g.arc(x + ax * r, y - az * r, 8, 0, TAU); g.fill();
  g.fillStyle = '#8a9aaa'; g.font = '20px sans-serif'; g.fillText('G', W / 2 + 22, H / 2 + 40);
}
function drawTriple(kinds, sp) {
  return (g, W, H, st) => {
    const v = st.v || { oilt: 70, boost: -0.6, volt: 12.3, oilp: 0 };
    const night = st.night ?? true;
    g.fillStyle = '#020203'; g.fillRect(0, 0, W, H);
    const n = kinds.length, r = H * 0.46;
    kinds.forEach((k, i) => {
      const d = { kind: k, x: W * (i + 0.5) / n, y: H / 2, r };
      drawDialFace(g, d, sp, night);
      if (k === 'trip') { g.fillStyle = '#0c140c'; g.fillRect(d.x - r * 0.6, d.y - r * 0.2, r * 1.2, r * 0.4); g.fillStyle = night ? sp.light : '#cfe8cf'; g.font = `bold ${Math.round(r * 0.28)}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(((st.odo || 0) / 1000).toFixed(1), d.x, d.y); }
      else drawNeedle(g, d, sp, v[k] ?? 0, sp.needle);
    });
  };
}

// ───────────────────────── mirrors ─────────────────────────
// Rear-view + door mirrors render the scene into small half-float targets, one mirror per update, round robin.
export function makeMirrors(model) {
  const p = model.parts, list = [];
  const mk = (mesh, w, h, fov, convex = 1) => {
    if (!mesh) return;
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true });
    rt.texture.repeat.set(-1, 1); rt.texture.offset.set(1, 0); rt.texture.wrapS = THREE.RepeatWrapping;
    const mat = new THREE.MeshBasicMaterial({ map: rt.texture, color: 0xb8bcc0, side: THREE.DoubleSide });
    mesh.material = mat;
    const cam = new THREE.PerspectiveCamera(fov, w / h, 0.05, 260);
    list.push({ mesh, rt, cam, convex, mat });
  };
  mk(p.rearMirror, 256, 80, 16);
  for (const dm of p.doorMirrors || []) mk(dm, 160, 96, 30);
  if (!list.length) return null;
  let turn = 0;
  const eyeW = new THREE.Vector3(), mp = new THREE.Vector3(), n = new THREE.Vector3(), r = new THREE.Vector3(), q = new THREE.Quaternion();
  return {
    list,
    render(renderer, scene, frame, eyeLocal) {
      if (frame % 2) return;
      const m = list[turn++ % list.length];
      model.bodyG.localToWorld(eyeW.copy(eyeLocal));
      m.mesh.getWorldPosition(mp); m.mesh.getWorldQuaternion(q);
      n.set(0, 0, 1).applyQuaternion(q); // plane normal (mirror faces +Z of its plane)
      const d = mp.clone().sub(eyeW).normalize();
      if (d.dot(n) > 0) n.negate();
      r.copy(d).addScaledVector(n, -2 * d.dot(n)); // reflected view direction
      m.cam.position.copy(mp).addScaledVector(r, 0.02);
      m.cam.up.set(0, 1, 0).applyQuaternion(model.root.quaternion);
      m.cam.lookAt(mp.clone().add(r));
      const vis = list.map(x => x.mesh.visible); for (const x of list) x.mesh.visible = false;
      const sm = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
      const prevRT = renderer.getRenderTarget(), prevXR = renderer.xr.enabled; renderer.xr.enabled = false;
      renderer.setRenderTarget(m.rt); renderer.clear(); renderer.render(scene, m.cam);
      renderer.setRenderTarget(prevRT); renderer.xr.enabled = prevXR; renderer.shadowMap.autoUpdate = sm;
      list.forEach((x, i) => (x.mesh.visible = vis[i]));
    },
    dispose() { for (const m of list) { m.rt.dispose(); m.mat.dispose(); } },
  };
}
