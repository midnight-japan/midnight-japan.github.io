// MIDNIGHT JAPAN — audio system.
// Hybrid: CC0 recordings (granular RPM-tracked engine banks, tyres, road, wind, pops, BOV, doors, UI — see
// audio-banks.js / assets/CREDITS.md) on top of Web Audio synthesis (fallback engine layer, turbo, EV, siren, radio,
// ambience, tunnel/viaduct reverb). Missing or undecodable assets fall back to pure synthesis.
// Every public method is exception-safe: if Web Audio is unavailable everything is a silent no-op.

import { MusicEngine, STATIONS, songName } from './music.js';
import { Banks, engineFamily } from './audio-banks.js';

const W = typeof window !== 'undefined' ? window : {};
const AC = W.AudioContext || W.webkitAudioContext || null;
const OAC = W.OfflineAudioContext || W.webkitOfflineAudioContext || null;
const UA = (W.navigator && W.navigator.userAgent) || '';
const IS_MOBILE = /iPhone|iPad|iPod|Android|Mobile/i.test(UA) ||
  (W.navigator && W.navigator.platform === 'MacIntel' && W.navigator.maxTouchPoints > 1);
const IS_IOS = /iPhone|iPad|iPod/i.test(UA) || (W.navigator && W.navigator.platform === 'MacIntel' && W.navigator.maxTouchPoints > 1);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const TAU = Math.PI * 2;

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Smoothed AudioParam set that skips redundant automation events (keeps 30+ engines cheap).
function sp(p, v, t, tau = 0.03) {
  if (!p || !Number.isFinite(v)) return;
  const lv = p._lv;
  if (lv !== undefined && Math.abs(v - lv) <= Math.abs(lv) * 0.003 + 1e-6) return;
  p._lv = v;
  try { p.setTargetAtTime(v, t, tau); } catch (e) { p.value = v; }
}
// Direct (k-rate) set for filter params: avoids per-sample biquad coefficient recomputation
// that a never-ending setTargetAtTime would cause. Used where 60 Hz steps are inaudible.
function sv(p, v, rel = 0.01) {
  if (!p || !Number.isFinite(v)) return;
  const lv = p._lv;
  if (lv !== undefined && Math.abs(v - lv) <= Math.abs(lv) * rel) return;
  p._lv = v;
  p.value = v;
}
function setPos(p, v) {
  if (!p || !v) return;
  const x = num(v.x, 0), y = num(v.y, 0), z = num(v.z, 0);
  if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; }
  else if (p.setPosition) p.setPosition(x, y, z);
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

// ───────────────────────── buffers ─────────────────────────
function makeNoise(ctx, kind, secs = 3) {
  const sr = ctx.sampleRate, len = Math.floor(sr * secs);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    } else if (kind === 'brown') {
      last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5;
    } else d[i] = w * 0.9;
  }
  // crossfade loop seam
  const fade = Math.floor(sr * 0.02);
  for (let i = 0; i < fade; i++) { const k = i / fade; d[len - fade + i] = d[len - fade + i] * (1 - k) + d[i] * k; }
  return buf;
}
function makeIR(ctx, dur, decay, fcStart, fcEnd, gated) {
  const sr = ctx.sampleRate, len = Math.max(1, Math.floor(sr * dur));
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let y = 0, c = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      if ((i & 255) === 0) { const fc = fcStart + (fcEnd - fcStart) * x; c = Math.exp(-TAU * fc / sr); }
      y = (1 - c) * (Math.random() * 2 - 1) + c * y;
      let env;
      if (gated) env = x < 0.8 ? 0.8 + 0.2 * Math.sin(x * 4) : Math.max(0, 1 - (x - 0.8) / 0.2);
      else env = Math.pow(1 - x, decay) * (i < sr * 0.004 ? i / (sr * 0.004) : 1);
      d[i] = y * env * (gated ? 1.6 : 2.2);
    }
  }
  return buf;
}
// Space impulse responses for the environment reverb.
// tunnel: concrete box (~10 m wide, 6.8 m high) → dense flutter between the walls + long bright tail
// trench: open-top cutting with retaining walls → side-wall flutter, short tail
// deck: under a viaduct deck / bridge → one strong slap from the soffit, pier reflections, short tail
function makeSpaceIR(ctx, kind) {
  const sr = ctx.sampleRate;
  const P = {
    tunnel: { dur: 2.6, decay: 2.2, flutter: 0.031, fl: 26, slap: 0.019, tailG: 0.55, lp0: 6500, lp1: 1600 },
    trench: { dur: 1.1, decay: 2.8, flutter: 0.034, fl: 10, slap: 0, tailG: 0.25, lp0: 7000, lp1: 2200 },
    deck: { dur: 0.9, decay: 3.2, flutter: 0, fl: 0, slap: 0.055, tailG: 0.22, lp0: 5000, lp1: 1800 },
  }[kind];
  const len = Math.floor(sr * P.dur), buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    // diffuse tail: filtered noise with exponential decay and a falling lowpass
    let y = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      const fc = P.lp0 + (P.lp1 - P.lp0) * Math.sqrt(x), c = Math.exp(-TAU * fc / sr);
      y = (1 - c) * (Math.random() * 2 - 1) + c * y;
      const onset = Math.min(1, i / (sr * 0.012));
      d[i] = y * Math.pow(1 - x, P.decay) * P.tailG * onset * 2.2;
    }
    const imp = (t, g) => { const i = Math.floor(t * sr); if (i >= 0 && i < len - 4) { d[i] += g; d[i + 1] += g * 0.5; d[i + 2] -= g * 0.25; } };
    if (P.slap) { imp(P.slap * (ch ? 1.06 : 1), 0.55); imp(P.slap * 2.1 * (ch ? 0.97 : 1), 0.22); }
    // side-wall flutter (alternating L/R, slight jitter so it isn't a pure comb)
    for (let k = 1; k <= P.fl; k++) {
      const t = k * P.flutter * (1 + (Math.random() - 0.5) * 0.08) + (ch ? 0.0013 : 0);
      imp(t, 0.42 * Math.pow(0.86, k) * ((k + ch) % 2 ? 1 : 0.6));
    }
    if (kind === 'deck') for (let k = 0; k < 6; k++) imp(0.09 + Math.random() * 0.25, 0.08 + Math.random() * 0.08); // piers
  }
  return buf;
}
function makeCrackle(ctx) {
  const sr = ctx.sampleRate, len = sr * 4;
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp = lp * 0.9 + (Math.random() * 2 - 1) * 0.1;
      d[i] = lp * 0.025; // hiss
    }
    const pops = 70 + Math.floor(Math.random() * 40);
    for (let p = 0; p < pops; p++) {
      const at = Math.floor(Math.random() * (len - 200)), amp = 0.04 + Math.random() * (Math.random() < 0.1 ? 0.25 : 0.08);
      const w = 4 + Math.floor(Math.random() * 30);
      for (let k = 0; k < w; k++) d[at + k] += amp * (Math.random() * 2 - 1) * (1 - k / w);
    }
  }
  return buf;
}
function softClipCurve(n = 1024, drive = 3) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * drive) / Math.tanh(drive); }
  return c;
}
function sawariCurve(n = 1024) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * 2.2) * 0.8 + 0.12 * Math.sin(x * 9); }
  return c;
}

// ───────────────────────── engine waveforms ─────────────────────────
// Each engine is modelled as one full 4-stroke cycle (720° crank) rendered as a PeriodicWave whose
// fundamental is rpm/120. Firing events inside the cycle (with per-bank amplitude / timing offsets)
// give the per-type character: crossplane V8 lope, unequal-length boxer burble, 3-cyl off-beat, …
// harmonic k of the wave = engine order k/2; the firing frequency is harmonic #events.
function evenEv(n, amps, offs, widths) {
  const ev = [];
  for (let i = 0; i < n; i++) ev.push({ t: i / n + (offs ? offs[i % offs.length] : 0), a: amps ? amps[i % amps.length] : 1, w: widths ? widths[i % widths.length] : 1 });
  return ev;
}
const V8_BANKS = 'LRLRRLRL';
const PROFILES = {
  I3: { ev: evenEv(3, [1, 0.84, 0.93], [0, 0.01, -0.006]), w: 0.3, ring: 2.2, ra: 0.25, res: [[130, 5, 1], [950, 3, 1.4]], bright: 1, vol: 0.9 },
  I4: { ev: evenEv(4, [1, 0.95, 0.98, 0.93], [0, 0.003, -0.002, 0.001]), w: 0.28, ring: 2.5, ra: 0.25, res: [[210, 4, 1], [1500, 3, 1.3]], bright: 1, vol: 0.95 },
  I6: { ev: evenEv(6, [1, 0.97, 0.99, 0.96, 1, 0.98]), w: 0.34, ring: 2.8, ra: 0.18, res: [[170, 3, 0.9], [2300, 4, 1.4]], bright: 1.05, vol: 1 },
  V6: { ev: evenEv(6, [1, 0.84], [0, 0.005]), w: 0.28, ring: 2.4, ra: 0.22, res: [[150, 4, 1], [1300, 3, 1.4]], bright: 1, vol: 1 },
  V8: { ev: Array.from(V8_BANKS, (b, i) => ({ t: i / 8 + (b === 'R' ? 0.007 : 0), a: b === 'L' ? 1 : 0.7, w: b === 'R' ? 1.15 : 1 })), w: 0.26, ring: 1.8, ra: 0.2, res: [[95, 7, 0.9], [520, 3, 1.2]], bright: 0.85, vol: 1.15 },
  V10: { ev: evenEv(10, [1, 0.9]), w: 0.2, ring: 3.5, ra: 0.35, res: [[1200, 5, 1], [3300, 5, 1.6]], bright: 1.4, vol: 1.05 },
  V12: { ev: evenEv(12, [1, 0.95]), w: 0.22, ring: 3.0, ra: 0.3, res: [[900, 4, 1], [2800, 4, 1.4]], bright: 1.3, vol: 1.05 },
  F4: { ev: [{ t: 0, a: 1 }, { t: 0.25 + 0.045, a: 0.74, w: 1.2 }, { t: 0.5, a: 0.97 }, { t: 0.75 + 0.045, a: 0.7, w: 1.2 }], w: 0.3, ring: 2.0, ra: 0.2, res: [[130, 6, 0.9], [700, 2, 1.2]], bright: 0.9, vol: 1 },
  F6: { ev: evenEv(6, [1, 0.88]), w: 0.22, ring: 3.0, ra: 0.3, res: [[480, 4, 1], [2600, 5, 1.5]], bright: 1.25, vol: 1 },
  R2: { ev: evenEv(4, [1, 0.97]), w: 0.45, rotary: true, ring: 2.2, ra: 0.3, res: [[380, 5, 1], [1900, 6, 2]], bright: 1.2, vol: 1.25 },
};
// per-layout tone shaping applied to the recorded bank: [freq, Q, gain dB] (freq is scaled per car by voiceK)
const SAMPLE_TONE = {
  i6: [[2400, 1.2, 2.5], [180, 1, 1.5]],
  v6: [[1500, 1.1, 3], [320, 1.3, -2]],
  f6: [[2900, 1.4, 4], [120, 0.9, 2]],
  i4: [[1700, 1.0, 2], [240, 1.0, 1]],
  i3: [[900, 1.2, 3], [2600, 1.4, -2]],
  rotary: [[1900, 1.6, 6], [420, 1.5, 4]],
  f4: [[140, 1.0, 3], [1300, 1.1, 1.5]],
  v8: [[95, 1.0, 3], [600, 1.2, 1.5]],
  v10: [[3200, 1.3, 3], [1300, 1.2, 2]],
  diesel: [[110, 0.9, 2], [1900, 1.5, 2.5]],
};
const WAVES = new WeakMap();
const WN = 2048;
let TRIG = null;
function toWave(ctx, data, H) {
  if (!TRIG) { TRIG = { c: new Float32Array(WN), s: new Float32Array(WN) }; for (let i = 0; i < WN; i++) { TRIG.c[i] = Math.cos(TAU * i / WN); TRIG.s[i] = Math.sin(TAU * i / WN); } }
  const re = new Float32Array(H + 1), im = new Float32Array(H + 1);
  for (let k = 1; k <= H; k++) {
    let a = 0, b = 0;
    for (let n = 0, idx = 0; n < WN; n++, idx = (idx + k) & (WN - 1)) { a += data[n] * TRIG.c[idx]; b += data[n] * TRIG.s[idx]; }
    const taper = 1 / (1 + Math.pow(k / (H * 0.75), 4));
    re[k] = (2 * a / WN) * taper; im[k] = (2 * b / WN) * taper;
  }
  return ctx.createPeriodicWave(re, im);
}
function engineWaves(ctx, type, H, diesel) {
  let cache = WAVES.get(ctx);
  if (!cache) { cache = new Map(); WAVES.set(ctx, cache); }
  const key = type + '|' + H + '|' + (diesel ? 1 : 0);
  if (cache.has(key)) return cache.get(key);
  const P = PROFILES[type];
  const n = P.ev.length;
  const ex = new Float32Array(WN), inn = new Float32Array(WN);
  for (let i = 0; i < WN; i++) {
    const ph = i / WN;
    let se = 0, si = 0;
    for (const e of P.ev) {
      let d = ph - e.t; d -= Math.floor(d);
      const x = d * n; // firing intervals since this event
      const w = P.w * (e.w || 1);
      let p = P.rotary ? (1 - Math.exp(-x / 0.035)) * Math.exp(-x / w) : (x / w) * Math.exp(1 - x / w);
      p += P.ra * Math.exp(-x / (w * 1.6)) * Math.sin(TAU * P.ring * x);
      se += e.a * p;
      const wi = P.w * 1.9;
      si += (x / wi) * (x / wi) * Math.exp(2 - 2 * x / wi);
      if (diesel) si += 0.8 * Math.exp(-x / 0.012) * Math.sin(TAU * 11 * x);
    }
    ex[i] = se; inn[i] = si;
  }
  const res = { ex: toWave(ctx, ex, H), in: toWave(ctx, inn, Math.min(H, 128)) };
  cache.set(key, res);
  return res;
}
function evWave(ctx) {
  let cache = WAVES.get(ctx);
  if (!cache) { cache = new Map(); WAVES.set(ctx, cache); }
  if (cache.has('EV')) return cache.get('EV');
  const H = 40, re = new Float32Array(H + 1), im = new Float32Array(H + 1);
  const amps = { 1: 1, 2: 0.18, 3: 0.05, 6: 0.42, 12: 0.24, 18: 0.1, 24: 0.08, 36: 0.03 };
  for (const k in amps) if (k <= H) im[k] = amps[k];
  const w = ctx.createPeriodicWave(re, im);
  cache.set('EV', w);
  return w;
}

// ───────────────────────── SFX primitives ─────────────────────────
function nz(a, dest, t, o) {
  const ctx = a.ctx, src = ctx.createBufferSource();
  const buf = a.noise[o.noise || 'white'];
  src.buffer = buf;
  if (o.rate) src.playbackRate.value = o.rate;
  const at = o.attack || 0.001, hold = o.hold || 0, dec = o.decay || 0.05;
  const dur = at + hold + dec * 7;
  const f = ctx.createBiquadFilter();
  f.type = o.type || 'bandpass';
  f.frequency.setValueAtTime(Math.min(o.f || 1000, ctx.sampleRate * 0.45), t);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.min(o.f2, ctx.sampleRate * 0.45), t + (o.sweep || dur));
  f.Q.value = o.q !== undefined ? o.q : 1;
  const g = ctx.createGain(), pk = o.gain !== undefined ? o.gain : 0.3;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(pk, t + at);
  if (hold) g.gain.setValueAtTime(pk, t + at + hold);
  g.gain.setTargetAtTime(0, t + at + hold, dec);
  src.connect(f); f.connect(g); g.connect(dest);
  const off = Math.max(0, Math.random() * (buf.duration - dur - 0.1));
  src.start(t, off, dur + 0.02);
  return t + dur;
}
function tn(a, dest, t, o) {
  const ctx = a.ctx, osc = ctx.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, t);
  const at = o.attack || 0.002, hold = o.hold || 0, dec = o.decay || 0.1;
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || at + hold + dec * 2));
  const g = ctx.createGain(), pk = o.gain !== undefined ? o.gain : 0.3;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(pk, t + at);
  if (hold) g.gain.setValueAtTime(pk, t + at + hold);
  g.gain.setTargetAtTime(0, t + at + hold, dec);
  let node = osc;
  if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
  node.connect(g); g.connect(dest);
  const end = t + at + hold + dec * 7;
  osc.start(t); osc.stop(end);
  return end;
}
// recorded sample one-shot (returns end time, or 0 if the buffer isn't loaded → caller falls back to synthesis)
function smp(a, dest, t, name, o = {}) {
  const buf = a.banks && a.banks.get(name);
  if (!buf) return 0;
  const ctx = a.ctx, src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf;
  const rate = o.rate || 1;
  src.playbackRate.value = rate;
  g.gain.value = o.gain !== undefined ? o.gain : 1;
  let node = src;
  if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; src.connect(f); node = f; }
  node.connect(g); g.connect(dest);
  const off = o.offset || 0, dur = Math.min(o.dur || buf.duration, buf.duration - off);
  src.start(t, off, dur);
  return t + dur / rate;
}
const SFX_FILES = ['tire_squeal', 'tire_scrub', 'road', 'wind', 'backfire', 'bov', 'pops', 'door_close', 'door_close_in', 'handbrake', 'blink_on', 'blink_off', 'ui_click', 'shift'];

// FM bell (store chime, coin, …)
function bell(a, dest, t, f, gain, decay, ratio = 3.5, idx = 1.5) {
  const ctx = a.ctx, car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
  car.frequency.value = f; mod.frequency.value = f * ratio;
  mg.gain.setValueAtTime(f * idx, t); mg.gain.setTargetAtTime(f * 0.05, t, decay * 0.35);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.003); g.gain.setTargetAtTime(0, t + 0.003, decay);
  mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(dest);
  const end = t + decay * 7;
  car.start(t); mod.start(t); car.stop(end); mod.stop(end);
  return end;
}
function hornTone(a, dest, t, dur, gain) {
  const ctx = a.ctx, ws = ctx.createWaveShaper(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  ws.curve = a._clip;
  bp.type = 'peaking'; bp.frequency.value = 1800; bp.Q.value = 0.8; bp.gain.value = 6;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 280;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
  for (const f of [415, 497]) {
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
    const og = ctx.createGain(); og.gain.value = 0.45;
    o.connect(og); og.connect(ws); o.start(t); if (dur) o.stop(t + dur + 0.1);
    if (!dur) (g._oscs = g._oscs || []).push(o);
  }
  ws.connect(hp); hp.connect(bp); bp.connect(lp); lp.connect(g); g.connect(dest);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.012);
  if (dur) g.gain.setTargetAtTime(0, t + dur, 0.02);
  return g;
}

const SFX = {
  door_open(a, d, t) {
    nz(a, d, t, { f: 2600, q: 3, gain: 0.3, decay: 0.008 });
    nz(a, d, t + 0.012, { type: 'lowpass', f: 520, gain: 0.45, decay: 0.035, noise: 'brown' });
    tn(a, d, t + 0.01, { f: 130, f2: 85, gain: 0.22, decay: 0.04 });
    return nz(a, d, t + 0.05, { f: 1300, q: 0.8, gain: 0.04, attack: 0.03, decay: 0.08 });
  },
  door_close(a, d, t) {
    const e = smp(a, d, t, 'door_close', { gain: 0.9, rate: 0.96 + Math.random() * 0.08 });
    if (e) { tn(a, d, t, { f: 70, f2: 42, gain: 0.35, decay: 0.07, glide: 0.1 }); return e; }
    tn(a, d, t, { f: 78, f2: 42, gain: 0.85, decay: 0.09, glide: 0.12 });
    nz(a, d, t, { type: 'lowpass', f: 380, gain: 0.7, decay: 0.07, noise: 'brown' });
    nz(a, d, t + 0.012, { f: 2100, q: 2.5, gain: 0.3, decay: 0.01 });
    return nz(a, d, t + 0.02, { f: 900, q: 4, gain: 0.1, decay: 0.05 });
  },
  trunk_open(a, d, t) {
    nz(a, d, t, { f: 2300, q: 3, gain: 0.3, decay: 0.008 });
    tn(a, d, t + 0.01, { f: 160, f2: 110, gain: 0.15, decay: 0.03 });
    return nz(a, d, t + 0.08, { f: 3400, f2: 2600, q: 1.4, gain: 0.05, attack: 0.08, hold: 0.25, decay: 0.12 });
  },
  trunk_close(a, d, t) {
    const e = smp(a, d, t, 'door_close', { gain: 0.85, rate: 0.82 + Math.random() * 0.06, lp: 3500 });
    if (e) { tn(a, d, t, { f: 60, f2: 36, gain: 0.4, decay: 0.09, glide: 0.12 }); return e; }
    tn(a, d, t, { f: 66, f2: 38, gain: 0.85, decay: 0.11, glide: 0.14 });
    nz(a, d, t, { type: 'lowpass', f: 300, gain: 0.7, decay: 0.09, noise: 'brown' });
    return nz(a, d, t + 0.02, { f: 1900, q: 2.5, gain: 0.25, decay: 0.012 });
  },
  hood_open(a, d, t) {
    nz(a, d, t, { f: 2000, q: 3, gain: 0.3, decay: 0.008 });
    tn(a, d, t + 0.18, { f: 300, f2: 260, gain: 0.12, decay: 0.03 });
    return nz(a, d, t + 0.18, { f: 620, q: 9, gain: 0.25, decay: 0.08 });
  },
  hood_close(a, d, t) {
    tn(a, d, t, { f: 85, f2: 45, gain: 0.95, decay: 0.1, glide: 0.12 });
    nz(a, d, t, { type: 'lowpass', f: 500, gain: 0.7, decay: 0.08, noise: 'brown' });
    for (const [f, g] of [[190, 0.1], [431, 0.08], [772, 0.05]]) tn(a, d, t + 0.005, { f, gain: g, decay: 0.09 });
    return nz(a, d, t + 0.015, { f: 2200, q: 2, gain: 0.25, decay: 0.012 });
  },
  window(a, d, t) {
    tn(a, d, t, { type: 'sawtooth', f: 112, f2: 96, glide: 1.6, gain: 0.07, attack: 0.05, hold: 1.5, decay: 0.03, lp: 700 });
    nz(a, d, t, { f: 1500, q: 1.2, gain: 0.02, attack: 0.05, hold: 1.5, decay: 0.03 });
    tn(a, d, t + 1.58, { f: 140, f2: 90, gain: 0.25, decay: 0.03 });
    return nz(a, d, t + 1.58, { type: 'lowpass', f: 600, gain: 0.2, decay: 0.03 });
  },
  handbrake_on(a, d, t) {
    const e = smp(a, d, t, 'handbrake', { gain: 0.8 });
    if (e) return e;
    let tt = t;
    for (let i = 0; i < 7; i++) {
      nz(a, d, tt, { f: 3200, q: 6, gain: 0.28, decay: 0.006 });
      nz(a, d, tt, { f: 900, q: 3, gain: 0.08, decay: 0.01 });
      tt += 0.06 - i * 0.005;
    }
    return tn(a, d, tt, { f: 140, f2: 100, gain: 0.2, decay: 0.03 });
  },
  handbrake_off(a, d, t) {
    nz(a, d, t, { f: 2500, q: 3, gain: 0.25, decay: 0.008 });
    tn(a, d, t + 0.09, { f: 140, f2: 90, gain: 0.3, decay: 0.05 });
    return nz(a, d, t + 0.09, { type: 'lowpass', f: 700, gain: 0.25, decay: 0.04 });
  },
  shift(a, d, t) {
    const e = smp(a, d, t, 'shift', { gain: 0.75, rate: 0.95 + Math.random() * 0.1 });
    if (e) return e;
    nz(a, d, t, { f: 2000, q: 2, gain: 0.3, decay: 0.01 });
    tn(a, d, t + 0.005, { f: 130, f2: 90, gain: 0.25, decay: 0.03 });
    return nz(a, d, t + 0.045, { f: 1400, q: 2, gain: 0.22, decay: 0.012 });
  },
  clutch(a, d, t) {
    tn(a, d, t, { f: 90, f2: 70, gain: 0.22, decay: 0.05 });
    nz(a, d, t, { type: 'lowpass', f: 600, gain: 0.14, decay: 0.04 });
    return nz(a, d, t + 0.02, { f: 1800, q: 10, gain: 0.025, attack: 0.02, decay: 0.05 });
  },
  ignition_click(a, d, t) {
    nz(a, d, t, { f: 3000, q: 3, gain: 0.22, decay: 0.006 });
    nz(a, d, t + 0.12, { f: 2200, q: 3, gain: 0.22, decay: 0.006 });
    return nz(a, d, t + 0.2, { f: 1200, q: 2, gain: 0.3, decay: 0.01 });
  },
  starter_fail(a, d, t) {
    for (let i = 0; i < 11; i++) nz(a, d, t + i / 14, { f: 1500, q: 2, gain: 0.3, decay: 0.008 });
    return tn(a, d, t, { type: 'sawtooth', f: 46, f2: 38, glide: 0.75, gain: 0.07, attack: 0.03, hold: 0.6, decay: 0.05, lp: 320 });
  },
  horn_short(a, d, t) { hornTone(a, d, t, 0.22, 0.35); return t + 0.45; },
  etc_beep(a, d, t) {
    for (const k of [0, 0.13]) {
      const o = { type: 'square', f: 1975, gain: 0.07, attack: 0.004, hold: 0.07, decay: 0.008, lp: 4000 };
      tn(a, d, t + k, o);
      tn(a, d, t + k, { f: 1975, gain: 0.12, attack: 0.004, hold: 0.07, decay: 0.008 });
    }
    return t + 0.35;
  },
  toll_bar(a, d, t) {
    tn(a, d, t, { type: 'sawtooth', f: 120, f2: 150, glide: 0.8, gain: 0.07, attack: 0.04, hold: 0.8, decay: 0.03, lp: 500 });
    nz(a, d, t, { f: 700, q: 1, gain: 0.025, attack: 0.04, hold: 0.8, decay: 0.03 });
    tn(a, d, t + 0.86, { f: 120, f2: 60, gain: 0.35, decay: 0.05 });
    return nz(a, d, t + 0.86, { f: 1800, q: 2.5, gain: 0.25, decay: 0.012 });
  },
  coin(a, d, t) {
    let tt = t, g = 0.12;
    for (let i = 0; i < 3; i++) {
      for (const [r, gg] of [[1, 1], [2.76, 0.6], [5.4, 0.35], [8.93, 0.2]]) tn(a, d, tt, { f: 2100 * r, gain: g * gg, decay: 0.05 + 0.02 * (2 - i) });
      tt += 0.09 - i * 0.025; g *= 0.6;
    }
    return nz(a, d, tt + 0.08, { f: 1500, q: 3, gain: 0.18, decay: 0.02 });
  },
  ui_click(a, d, t) {
    const e = smp(a, d, t, 'ui_click', { gain: 0.55 });
    if (e) return e;
    tn(a, d, t, { f: 2400, f2: 1800, gain: 0.12, decay: 0.012 });
    return nz(a, d, t, { type: 'highpass', f: 4000, gain: 0.06, decay: 0.003 });
  },
  ui_select(a, d, t) {
    tn(a, d, t, { type: 'triangle', f: 880, gain: 0.14, decay: 0.04 });
    return tn(a, d, t + 0.06, { type: 'triangle', f: 1318.5, gain: 0.14, decay: 0.09 });
  },
  turn_tick(a, d, t) {
    a._tick = !a._tick;
    const e = smp(a, d, t, a._tick ? 'blink_on' : 'blink_off', { gain: 0.8 });
    if (e) return e;
    const f = a._tick ? 2800 : 2200;
    nz(a, d, t, { f, q: 5, gain: 0.3, decay: 0.006 });
    return tn(a, d, t, { f: a._tick ? 1100 : 900, gain: 0.06, decay: 0.01 });
  },
  hazard_tick(a, d, t) {
    a._tick = !a._tick;
    const e = smp(a, d, t, a._tick ? 'blink_on' : 'blink_off', { gain: 0.8, rate: 1.03 });
    if (e) return e;
    nz(a, d, t, { f: 2600, q: 5, gain: 0.3, decay: 0.006 });
    nz(a, d, t + 0.02, { f: 2000, q: 5, gain: 0.15, decay: 0.006 });
    return tn(a, d, t, { f: 1000, gain: 0.06, decay: 0.01 });
  },
  footstep(a, d, t) {
    const r = Math.random();
    nz(a, d, t, { type: 'lowpass', f: 900 + r * 700, gain: 0.3, decay: 0.025 + r * 0.01 });
    tn(a, d, t, { f: 95 + r * 20, f2: 60, gain: 0.22, decay: 0.03 });
    return nz(a, d, t + 0.01, { type: 'highpass', f: 3500, gain: 0.04 + r * 0.03, decay: 0.015 });
  },
  crash(a, d, t) {
    tn(a, d, t, { f: 70, f2: 32, gain: 0.9, decay: 0.15, glide: 0.4 });
    nz(a, d, t, { type: 'lowpass', f: 900, gain: 0.75, decay: 0.12, noise: 'brown' });
    nz(a, d, t, { f: 1700, f2: 600, q: 0.8, gain: 0.35, decay: 0.08 });
    for (let i = 0; i < 9; i++) nz(a, d, t + Math.random() * 0.25, { f: 400 + Math.random() * 3000, q: 5 + Math.random() * 5, gain: 0.25, decay: 0.03 + Math.random() * 0.05 });
    for (let i = 0; i < 12; i++) tn(a, d, t + 0.02 + Math.random() * 0.5, { f: 3800 + Math.random() * 5000, gain: 0.04 + Math.random() * 0.04, decay: 0.03 + Math.random() * 0.08 });
    return nz(a, d, t + 0.1, { f: 1800, f2: 700, q: 1.5, gain: 0.12, attack: 0.05, hold: 0.25, decay: 0.15, sweep: 0.6 });
  },
  cone(a, d, t) {
    tn(a, d, t, { f: 265, f2: 240, gain: 0.3, decay: 0.05 });
    tn(a, d, t, { f: 612, gain: 0.12, decay: 0.03 });
    nz(a, d, t, { f: 1200, q: 1.5, gain: 0.15, decay: 0.02 });
    tn(a, d, t + 0.22, { f: 250, gain: 0.12, decay: 0.03 });
    return nz(a, d, t + 0.25, { f: 1600, q: 1, gain: 0.06, attack: 0.02, hold: 0.15, decay: 0.05 });
  },
  vending(a, d, t) {
    tn(a, d, t, { type: 'square', f: 1046, gain: 0.05, attack: 0.003, hold: 0.07, decay: 0.01, lp: 3000 });
    tn(a, d, t + 0.15, { type: 'sawtooth', f: 90, f2: 100, glide: 0.4, gain: 0.05, attack: 0.03, hold: 0.35, decay: 0.03, lp: 400 });
    for (const [k, g] of [[0.6, 1], [0.95, 0.55]]) {
      tn(a, d, t + k, { f: 95, f2: 50, gain: 0.6 * g, decay: 0.06 });
      nz(a, d, t + k, { type: 'lowpass', f: 650, gain: 0.45 * g, decay: 0.05 });
      nz(a, d, t + k + 0.01, { f: 720, q: 7, gain: 0.18 * g, decay: 0.07 });
    }
    return nz(a, d, t + 1.1, { f: 1400, q: 3, gain: 0.05, attack: 0.02, hold: 0.2, decay: 0.05 });
  },
  store_chime(a, d, t) {
    // original 4-note bell arpeggio (A add6 shape), NOT any real chain's jingle
    const mt = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const seq = [[81, 0], [88, 0.17], [85, 0.34], [90, 0.58]];
    let end = t;
    for (const [m, k] of seq) {
      end = bell(a, d, t + k, mt(m), 0.11, k === 0.58 ? 0.6 : 0.35, 4, 0.9);
      bell(a, d, t + k, mt(m - 12), 0.04, 0.3, 2, 0.5);
    }
    return end;
  },
  camera_shutter(a, d, t) {
    nz(a, d, t, { f: 4500, q: 2, gain: 0.3, decay: 0.006 });
    tn(a, d, t + 0.012, { f: 180, f2: 90, gain: 0.25, decay: 0.02 });
    nz(a, d, t + 0.015, { type: 'lowpass', f: 1200, gain: 0.15, decay: 0.015 });
    return nz(a, d, t + 0.065, { f: 3800, q: 2, gain: 0.25, decay: 0.008 });
  },
};

// ───────────────────────── EngineSound ─────────────────────────
class EngineSound {
  constructor(a, car, opts) {
    this.a = a;
    this.car = car || {};
    const e = this.car.engine || {};
    this.lod = opts && opts.lod === 'lite' ? 'lite' : 'full';
    this.isEV = e.type === 'EV';
    this.hybrid = !!this.car.hybrid && !this.isEV;
    this.type = PROFILES[e.type] ? e.type : 'I4';
    this.prof = PROFILES[this.type];
    this.redline = num(e.redline, this.isEV ? 12000 : 7000);
    this.idle = num(e.idle, 800);
    this.vtec = num(e.vtec, 0);
    this.turbo = !!e.turbo;
    this.diesel = !this.isEV && this.redline < 5000;
    const cat = this.car.cat || '';
    const disp = num(e.disp, 1800);
    const catF = { traffic: 0.65, kei: 0.7, police: 0.85, ev: 0.8 }[cat] || 1;
    this.vol = this.prof.vol * catF * (0.72 + 0.28 * clamp(disp / 2500, 0.3, 2.2)) * (this.diesel ? 1.15 : 1);
    const sporty = cat === 'jdm' || cat === 'euro' || cat === 'us';
    this.crackle = sporty ? (this.turbo || ['R2', 'V8', 'F6', 'V10', 'F4'].includes(this.type) ? 1 : 0.45) : 0;
    this.bovStyle = hashStr(String(this.car.id || '')) % 3 === 0 ? 'flutter' : 'bov';
    // per-car voice: same engine layout still sounds different car to car (exhaust resonance, displacement, tune)
    const hv = hashStr(String(this.car.id || '') + (e.code || ''));
    const dispK = Math.pow(2500 / clamp(disp, 600, 10000), 0.18);
    const codeK = { 'RB26DETT': 1.08, '2JZ-GTE': 0.9, '1JZ-GTE': 0.95, 'B58': 0.92, 'VQ35HR': 1.12, 'VR38DETT': 0.95, 'SR20DET': 1.05, '4G63': 0.98, 'EJ207': 0.9, 'FA24': 0.94, 'B16B': 1.15, 'F20C': 1.18, 'K20C': 1.05, '4A-GEU': 1.12, '13B-REW': 1.1, '1LR-GUE': 1.2, 'S54': 1.1, 'Coyote 5.0': 0.85, 'C30A': 1.08 }[e.code] || 1;
    this.voiceK = (0.9 + (hv % 23) / 100) * dispK * codeK;
    this.voiceG = 0.9 + ((hv >> 5) % 30) / 100 + (sporty ? 0.15 : 0);
    this.pos = { x: 0, y: 0, z: 0 };
    this.st = { rpm: 0, throttle: 0, load: 0, running: false, cranking: false, boost: 0, speed: 0, slip: 0, interior: false, openness: 0 };
    this._alive = 0; this._ice = this.hybrid ? 0 : 1; this._intW = 0; this._vr = 0; this._dop = 1; this._prevD = null; this._lastT = 0;
    this._sleep = false; this._built = false; this._dead = false; this._jit = 0; this._sq = 1100; this._prevThr = 0;
    this._crackleQ = 0;
    // recorded engine bank (granular, lazy loaded); the synth below stays as fallback + character layer
    this.fam = engineFamily(this.car);
    this._smpW = 0; this._pw = 0;
    a.engines.add(this);
  }

  _build() {
    const a = this.a, ctx = a.ctx, full = this.lod === 'full', t = ctx.currentTime;
    const N = (this.N = {});
    const srcs = (this.srcs = []);
    const G = (v = 1) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const F = (type, f, q = 0.7, gain) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; if (gain !== undefined) b.gain.value = gain; return b; };
    const O = (wave, f = 50) => { const o = ctx.createOscillator(); if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave); o.frequency.value = f; srcs.push(o); return o; };
    const NS = (kind) => { const s = ctx.createBufferSource(); s.buffer = a.noise[kind]; s.loop = true; srcs.push(s); return s; };

    N.ext = G(1); N.int = G(0);
    N.panner = a._panner(full);
    N.ext.connect(N.panner); N.panner.connect(a.bus.engine);
    N.int.connect(a.bus.engine);
    N.exSum = G(1); N.inSum = G(1); N.bay = G(1); N.tire = G(1); N.cabin = G(1);
    // exterior routing
    N.exSum.connect(N.ext);
    N.inExt = G(0.45); N.inSum.connect(N.inExt); N.inExt.connect(N.ext);
    N.bay.connect(N.ext); N.tire.connect(N.ext);
    N.cabExt = G(0.08); N.cabin.connect(N.cabExt); N.cabExt.connect(N.ext);
    // interior routing (through the body / firewall)
    if (full) {
      N.intLP = F('lowpass', 600, 0.5); N.intEx = G(0.6);
      N.exSum.connect(N.intLP); N.intLP.connect(N.intEx); N.intEx.connect(N.int);
      N.inInt = G(0.85); N.inSum.connect(N.inInt); N.inInt.connect(N.int);
      N.bayLP = F('lowpass', 2000, 0.5); N.bayInt = G(0.6); N.bay.connect(N.bayLP); N.bayLP.connect(N.bayInt); N.bayInt.connect(N.int);
      N.tireLP = F('lowpass', 1200, 0.5); N.tireInt = G(0.5); N.tire.connect(N.tireLP); N.tireLP.connect(N.tireInt); N.tireInt.connect(N.int);
    } else {
      // lite LOD: no cabin filtering (AI cars are almost never listened to from inside)
      N.intEx = G(0.5); N.exSum.connect(N.intEx); N.intEx.connect(N.int);
      N.inSum.connect(N.int); N.bay.connect(N.int); N.tire.connect(N.int);
    }
    N.cabin.connect(N.int);

    const white = NS('white');
    const pink = NS(full ? 'pink' : 'pink');

    if (!this.isEV) {
      const waves = engineWaves(ctx, this.type, full ? 320 : 96, this.diesel);
      N.exOsc = O(waves.ex);
      N.exGain = G(0);
      N.exLP = F('lowpass', 800, 0.8);
      N.exOsc.connect(N.exGain); N.exGain.connect(N.exLP);
      let last = N.exLP;
      const res = full ? this.prof.res : this.prof.res.slice(0, 1);
      for (const [f, g, q] of res) { const pk = F('peaking', f * this.voiceK, q, g * this.voiceG); last.connect(pk); last = pk; }
      last.connect(N.exSum);
      if (full) {
        N.inOsc = O(waves.in);
        N.inGain = G(0);
        N.inBP = F('bandpass', 700, 0.45);
        N.vtecPk = F('peaking', 2300, 1.3, 0);
        N.inOsc.connect(N.inGain); N.inGain.connect(N.inBP); N.inBP.connect(N.vtecPk); N.vtecPk.connect(N.inSum);
        // combustion noise, amplitude-modulated by the exhaust pulse train
        N.combBP = F('bandpass', 1800, 0.8);
        N.combAM = G(0);
        N.amDepth = G(0);
        white.connect(N.combBP); N.combBP.connect(N.combAM); N.combAM.connect(N.exLP);
        N.exOsc.connect(N.amDepth); N.amDepth.connect(N.combAM.gain);
      }
      if (this.turbo) {
        N.whOsc = O('sine', 2000);
        N.whG = G(0);
        N.whOsc.connect(N.whG); N.whG.connect(N.inSum);
        if (full) { N.whooshBP = F('bandpass', 1500, 1.2); N.whooshG = G(0); white.connect(N.whooshBP); N.whooshBP.connect(N.whooshG); N.whooshG.connect(N.inSum); }
      }
    }
    if (this.isEV || this.hybrid) {
      N.evOsc = O(evWave(ctx), 100);
      N.evG = G(0); N.evLP = F('lowpass', 7000, 0.5);
      N.evOsc.connect(N.evG); N.evG.connect(N.evLP); N.evLP.connect(N.bay);
      N.gwOsc = O('sine', 300); N.gwG = G(0); N.gwOsc.connect(N.gwG); N.gwG.connect(N.bay);
      if (full) { N.invOsc = O('sine', 2350); N.invG = G(0); N.invOsc.connect(N.invG); N.invG.connect(N.bay); }
      // AVAS (pedestrian warning) — soft two-tone hum, exterior only
      N.av1 = O('sine', 420); N.av2 = O('triangle', 630);
      N.avTrem = G(0.7); N.avLfo = O('sine', 3.2); N.avLfoG = G(0.25);
      N.avLfo.connect(N.avLfoG); N.avLfoG.connect(N.avTrem.gain);
      N.av2g = G(0.35); N.av1.connect(N.avTrem); N.av2.connect(N.av2g); N.av2g.connect(N.avTrem);
      N.avG = G(0); N.avTrem.connect(N.avG); N.avG.connect(N.ext);
      N.avInt = G(0); N.avTrem.connect(N.avInt); N.avInt.connect(N.int);
    }
    // road / tyre
    N.roadBP = F('bandpass', 500, 0.6); N.roadG = G(0);
    pink.connect(N.roadBP); N.roadBP.connect(N.roadG); N.roadG.connect(N.tire);
    N.sq1 = F('bandpass', 1100, 9); N.sqG = G(0);
    N.sq1.connect(N.sqG); N.sqG.connect(N.tire);
    N.white = white; this._sqOn = false; this._sqIdle = 0;
    if (full) {
      N.sq2 = F('bandpass', 2100, 12); N.sq2G = G(0.6); N.sq2.connect(N.sq2G); N.sq2G.connect(N.sqG);
      const brown = NS('brown');
      N.boomLP = F('lowpass', 110, 0.7); N.boomG = G(0); brown.connect(N.boomLP); N.boomLP.connect(N.boomG); N.boomG.connect(N.int);
      N.windBP = F('bandpass', 800, 0.5); N.windG = G(0); pink.connect(N.windBP); N.windBP.connect(N.windG); N.windG.connect(N.int);
    }
    if (full) {
      // recorded tyre squeal / scrub / rolling-road loops (attached once the buffers are decoded)
      N.sqS = G(0); N.scS = G(0); N.roadS = G(0);
      N.sqS.connect(N.tire); N.scS.connect(N.tire); N.roadS.connect(N.tire);
      // off-road: low rumble + gravel crunch; expressway expansion joints go to N.tire too
      N.offLP = F('lowpass', 170, 0.7); N.offG = G(0); NS('brown').connect(N.offLP); N.offLP.connect(N.offG); N.offG.connect(N.tire);
      N.grBP = F('bandpass', 2600, 0.8); N.grG = G(0); white.connect(N.grBP); N.grBP.connect(N.grG); N.grG.connect(N.tire);
      this._loops = false;
    }
    if (this.fam && a.banks) {
      // sample chain: granular voice → load-dependent lowpass → per-car/layout tone → exhaust sum
      N.smpG = G(0);
      N.smpLP = F('lowpass', 14000, 0.6);
      N.smpG.connect(N.smpLP);
      let last = N.smpLP;
      const tone = SAMPLE_TONE[this.fam.tone || this.fam.fam] || [];
      for (const [f, q, g] of (full ? tone : tone.slice(0, 1))) { const pk = F('peaking', f * this.voiceK, q, g * this.voiceG); last.connect(pk); last = pk; }
      last.connect(N.exSum);
      this._attachSample();
    }
    for (const s of srcs) {
      if (s.loop) s.start(t, Math.random() * 2); else s.start(t);
    }
    this._built = true;
    for (const p of [N.ext.gain, N.int.gain]) p._lv = undefined;
  }

  _attachLoops() {
    const a = this.a, B = a.banks, N = this.N;
    if (this._loops || !B || !N || !N.sqS) return;
    const bs = B.get('tire_squeal'), bc = B.get('tire_scrub'), br = B.get('road');
    if (!bs || !bc || !br) return;
    const ctx = a.ctx, t = ctx.currentTime;
    const L = (buf, dest) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(dest); s.start(t, Math.random() * buf.duration); this.srcs.push(s); return s; };
    N.sqSrc = L(bs, N.sqS); N.scSrc = L(bc, N.scS); N.roadSrc = L(br, N.roadS);
    this._loops = true;
  }

  _attachSample() {
    const a = this.a, B = a.banks, fam = this.fam && this.fam.fam;
    if (!B || !fam || !this.N || this.N.wk) return;
    if (B.ready.has(fam)) {
      try {
        const node = B.voice(fam);
        if (node) { node.connect(this.N.smpG); this.N.wk = node; }
      } catch (e) { a._err(e); }
      return;
    }
    const N0 = this.N;
    B.engine(fam).then((bank) => { if (bank && !this._dead && this.N === N0) this._attachSample(); });
  }

  _starter(on) {
    const a = this.a, ctx = a.ctx, N = this.N, t = ctx.currentTime;
    if (on && !N.stOsc) {
      N.stOsc = ctx.createOscillator(); N.stOsc.type = 'sawtooth'; N.stOsc.frequency.value = 150;
      N.stLP = ctx.createBiquadFilter(); N.stLP.type = 'lowpass'; N.stLP.frequency.value = 1300;
      N.stG = ctx.createGain(); N.stG.gain.value = 0;
      N.chug = ctx.createOscillator(); N.chug.frequency.value = 8;
      N.chugF = ctx.createGain(); N.chugF.gain.value = 32;
      N.chugA = ctx.createGain(); N.chugA.gain.value = 0.05;
      N.chug.connect(N.chugF); N.chugF.connect(N.stOsc.frequency);
      N.chug.connect(N.chugA); N.chugA.connect(N.stG.gain);
      N.stOsc.connect(N.stLP); N.stLP.connect(N.stG); N.stG.connect(N.bay);
      N.stOsc.start(t); N.chug.start(t);
      N.stG.gain.setTargetAtTime(0.12, t, 0.02);
    } else if (!on && N.stOsc) {
      const o = N.stOsc, c = N.chug, g = N.stG;
      g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.03);
      try { o.stop(t + 0.3); c.stop(t + 0.3); } catch (e) { /* */ }
      N.stOsc = N.chug = null;
    }
  }

  _teardown(fade) {
    const N = this.N;
    if (!N) return;
    const ctx = this.a.ctx, t = ctx.currentTime;
    const kill = () => {
      for (const s of this.srcs || []) { try { s.stop(); } catch (e) { /* */ } }
      if (N.stOsc) { try { N.stOsc.stop(); N.chug.stop(); } catch (e) { /* */ } }
      if (N.horn) { for (const o of N.horn._oscs || []) { try { o.stop(); } catch (e) { /* */ } } }
      if (N.wk) { try { N.wk.port.postMessage({ type: 'stop' }); N.wk.disconnect(); } catch (e) { /* */ } if (this.a.banks) this.a.banks.live--; N.wk = null; }
      try { N.panner.disconnect(); N.int.disconnect(); } catch (e) { /* */ }
    };
    if (fade && !this.a._offline) {
      try { N.ext.gain.setTargetAtTime(0, t, 0.02); N.int.gain.setTargetAtTime(0, t, 0.02); } catch (e) { /* */ }
      setTimeout(kill, 150);
    } else kill();
    this.N = null; this.srcs = null; this._built = false;
  }

  update(s) {
    if (this._dead) return;
    try { this._update(s || {}); } catch (e) { this.a._err(e); }
  }
  _update(s) {
    const a = this.a, ctx = a.ctx;
    const st = this.st;
    for (const k in st) if (s[k] !== undefined) st[k] = typeof st[k] === 'boolean' ? !!s[k] : num(s[k], st[k]);
    if (s.position) { this.pos.x = num(s.position.x, 0); this.pos.y = num(s.position.y, 0); this.pos.z = num(s.position.z, 0); }
    if (!ctx) return;
    const t = ctx.currentTime;
    const dt = this._lastT ? clamp(t - this._lastT, 0.001, 0.25) : 1 / 60;
    this._lastT = t;
    const d = dist(this.pos, a._L.pos);
    // far-away AI engines are torn down completely (zero CPU) and rebuilt when they come back
    if (this.lod === 'lite' && !st.interior) {
      this._dist = d;
      const off = d > 240 || this._budgetOff;
      if (!this._sleep && off) { this._teardown(false); this._sleep = true; this._prevD = null; return; }
      if (this._sleep) { if (d < 220 && !this._budgetOff) this._sleep = false; else return; }
    }
    if (!this._built) { this._build(); this._fresh = true; }
    const N = this.N;
    const full = this.lod === 'full';

    // doppler from closing speed
    if (st.interior) { this._vr = 0; }
    else if (this._prevD !== null) {
      let vr = (d - this._prevD) / dt;
      if (Math.abs(vr) > 120) vr = 0; // teleport
      this._vr += (vr - this._vr) * Math.min(1, dt * 6);
    }
    this._prevD = d;
    const dop = clamp(343 / (343 + this._vr), 0.7, 1.4);
    this._dop = dop;
    setPos(N.panner, this.pos);

    const rpm = Math.max(0, st.rpm), thr = clamp(st.throttle, 0, 1), load = clamp(st.load, -1, 1);
    const lp = Math.max(0, load), ov = Math.max(0, -load);
    const rpmN = clamp(rpm / this.redline, 0, 1.15);
    const power = clamp(0.65 * thr + 0.35 * lp, 0, 1);
    const speed = Math.abs(st.speed), open = clamp(st.openness, 0, 1);
    const cranking = st.cranking && !st.running;

    // smoothed state
    const aliveT = st.running ? 1 : cranking ? 0.45 : 0;
    this._alive += (aliveT - this._alive) * Math.min(1, dt * (aliveT > this._alive ? 14 : 5));
    let iceT = 1;
    if (this.hybrid) iceT = st.running && (speed > 13 || thr > 0.6 || rpm > this.idle * 2.2) ? 1 : 0;
    this._ice += (iceT - this._ice) * Math.min(1, dt * 3);
    const intT = st.interior ? 1 : 0;
    if (this._fresh) { this._intW = intT; this._fresh = false; }
    else this._intW += (intT - this._intW) * Math.min(1, dt * 20);
    const alive = this._alive * (this.isEV ? 0 : this._ice);

    if (this.lod === 'full') a._intW = this._intW;
    sp(N.ext.gain, 1 - this._intW, t, 0.02);
    sp(N.int.gain, this._intW, t, 0.02);

    // ── recorded engine (granular bank) ──
    this._smpW += ((N.wk ? 1 : 0) - this._smpW) * Math.min(1, dt * 4);
    const smpW = this._smpW;
    if (N.wk) {
      // smoothed load: pulls → on-load layer, lift / coast → overrun layer (equal-power crossfade)
      const pwT = clamp(power * 1.25 + (rpm < this.idle * 1.25 ? 0.15 : 0), 0, 1);
      this._pw += (pwT - this._pw) * Math.min(1, dt * (pwT > this._pw ? 12 : 6));
      const pw = this._pw;
      const rpmB = Math.max(cranking ? Math.max(rpm, 200) : rpm, 1) * this.fam.scale * dop;
      const P = N.wk.parameters;
      sp(P.get('rpm'), rpmB, t, 0.008);
      const lOn = (0.42 + 0.58 * Math.min(1, rpmN)) * (0.55 + 0.45 * pw);
      const lOff = (0.3 + 0.3 * Math.min(1, rpmN)) * (1 - 0.3 * ov);
      sp(P.get('on'), lOn * Math.sqrt(pw), t, 0.02);
      sp(P.get('off'), lOff * Math.sqrt(1 - pw), t, 0.02);
      sp(N.smpG.gain, this.vol * alive * (cranking ? 0.25 : 1) * 1.55 * smpW, t, 0.03);
      sv(N.smpLP.frequency, clamp((2600 + 5000 * rpmN + 9000 * pw) * (1 - 0.25 * ov), 1200, 18000), 0.03);
    }
    const synW = 1 - 0.82 * smpW;

    // ── combustion engine ──
    if (N.exOsc) {
      this._jit = this._jit * 0.9 + (Math.random() - 0.5) * 0.004 * (1.6 - rpmN);
      const rpmEff = cranking ? Math.max(rpm, 200) : rpm;
      const fC = Math.max(0.5, rpmEff / 120 * dop * (1 + this._jit));
      sp(N.exOsc.frequency, fC, t, 0.012);
      const vt = this.vtec ? clamp((rpm - this.vtec) / 220 + 0.5, 0, 1) * (0.35 + 0.65 * power) : 0;
      const exAmp = (cranking ? 0.25 : 0.15 + 0.5 * power + 0.18 * rpmN - 0.05 * ov) * this.vol * alive * 0.42;
      let cut = (420 + 1500 * rpmN + 6500 * Math.pow(power, 1.3) + 2500 * vt) * this.prof.bright * (1 - 0.35 * ov);
      if (cranking) cut = 350;
      sp(N.exGain.gain, Math.max(0, exAmp) * synW, t, 0.025);
      sv(N.exLP.frequency, clamp(cut, 150, 16000), 0.02);
      if (N.inOsc) {
        sp(N.inOsc.frequency, fC, t, 0.012);
        const inAmp = (0.03 + 0.3 * power * (0.3 + rpmN) + 0.12 * vt + 0.04 * ov * rpmN) * this.vol * alive * 0.4;
        sp(N.inGain.gain, inAmp * (1 - 0.45 * smpW), t, 0.03);
        sv(N.inBP.frequency, 500 + 1400 * rpmN + 600 * vt, 0.02);
        sv(N.vtecPk.gain, 10 * vt, 0.03);
        sp(N.amDepth.gain, (0.02 + 0.12 * power * (0.3 + rpmN) + (this.diesel ? 0.08 : 0)) * this.vol * alive * synW, t, 0.03);
        sv(N.combBP.frequency, 1200 + 2000 * rpmN, 0.03);
      }
      if (N.whOsc) {
        const b = clamp(st.boost, 0, 1);
        sp(N.whOsc.frequency, (2400 + 7200 * Math.pow(b, 1.2)) * dop, t, 0.05);
        sp(N.whG.gain, 0.022 * b * b * (0.35 + 0.65 * power) * alive, t, 0.05);
        if (N.whooshG) { sp(N.whooshG.gain, 0.05 * b * power * alive, t, 0.05); sv(N.whooshBP.frequency, 1200 + 2600 * b, 0.03); }
      }
      // overrun crackle / lift-off pops
      if (this.crackle && st.running) {
        if (this._prevThr > 0.7 && thr < 0.15 && rpm > 4000) this._crackleQ = 2 + Math.floor(Math.random() * 4 * this.crackle);
        const rate = ov > 0.15 && rpm > 2800 ? this.crackle * ov * rpmN * 9 : 0;
        if (this._crackleQ > 0 && Math.random() < dt * 18) { this._pop(0.35 + Math.random() * 0.3); this._crackleQ--; }
        else if (Math.random() < rate * dt) this._pop(0.15 + Math.random() * 0.25);
      }
    }
    this._prevThr = thr;
    if (cranking && !N.stOsc && !this.isEV) this._starter(true);
    if (!cranking && N.stOsc) this._starter(false);
    if (N.stOsc) {
      const crank = Math.max(rpm, 200);
      sp(N.chug.frequency, crank / 120 * this.prof.ev.length * 0.5, t, 0.05);
      sp(N.stOsc.frequency, 135 + crank * 0.08, t, 0.05);
    }

    // ── electric drive ──
    if (N.evOsc) {
      const on = this._alive * (this.hybrid ? 1 - 0.7 * this._ice : 1);
      const evRpm = this.hybrid ? speed * 220 : rpm;
      const evN = clamp(evRpm / (this.hybrid ? 9000 : this.redline), 0, 1.1);
      sp(N.evOsc.frequency, Math.max(1, evRpm / 60 * 3 * dop), t, 0.02);
      sp(N.evG.gain, (0.018 + 0.13 * thr * (0.25 + evN) + 0.1 * ov * (0.2 + evN)) * on, t, 0.04);
      sv(N.evLP.frequency, 3000 + 6000 * (thr + ov * 0.6), 0.03);
      sp(N.gwOsc.frequency, Math.max(20, speed * 62 * dop), t, 0.03);
      sp(N.gwG.gain, (speed > 1 ? 0.006 + 0.018 * (thr + ov) * clamp(speed / 20, 0, 1) : 0) * on, t, 0.05);
      if (N.invG) sp(N.invG.gain, 0.012 * thr * clamp(1 - speed / 12, 0, 1) * on, t, 0.04);
      const kmh = speed * 3.6;
      const av = st.running ? clamp(1 - (kmh - 20) / 10, 0, 1) * (kmh < 0.5 ? 0.6 : 1) : 0;
      const f0 = (420 + speed * 18) * dop;
      sp(N.av1.frequency, f0, t, 0.05); sp(N.av2.frequency, f0 * 1.498, t, 0.05);
      sp(N.avG.gain, 0.045 * av * (this.hybrid ? 1 - this._ice : 1), t, 0.1);
      sp(N.avInt.gain, 0.006 * av, t, 0.1);
    }

    // ── tyres / road / wind ──
    const spd = clamp(speed / 30, 0, 1.6);
    sp(N.roadG.gain, 0.12 * Math.pow(spd, 1.5), t, 0.05);
    sv(N.roadBP.frequency, 380 + Math.min(speed, 60) * 18, 0.03);
    this._sq = clamp(this._sq + (Math.random() - 0.5) * dt * 2600, 850, 1500);
    const slip = clamp(st.slip, 0, 1);
    if (this._sqOn) { sv(N.sq1.frequency, this._sq, 0.01); if (N.sq2) sv(N.sq2.frequency, this._sq * 1.93, 0.01); }
    const spdF = clamp((speed + slip * 6) / 4, 0, 1);
    if (N.sqS && !this._loops && ((this._loopT = (this._loopT || 0) - dt) <= 0)) { this._loopT = 0.5; this._attachLoops(); }
    const lw = this._loops ? 1 : 0;
    sp(N.sqG.gain, 0.26 * Math.pow(slip, 1.4) * spdF * (1 - 0.85 * lw), t, 0.03);
    if (this._loops) {
      // squeal = high slip (tonal), scrub = onset / understeer (broadband); pitch rises with slip, a little with speed
      const sq = Math.pow(clamp((slip - 0.22) / 0.78, 0, 1), 1.15), sc = clamp(slip / 0.45, 0, 1) * (1 - 0.6 * sq);
      this._sqJ = (this._sqJ || 0) * 0.92 + (Math.random() - 0.5) * 0.02;
      sp(N.sqS.gain, 0.55 * sq * spdF, t, 0.04);
      sp(N.scS.gain, 0.32 * sc * spdF, t, 0.05);
      sp(N.sqSrc.playbackRate, (0.86 + 0.2 * slip + Math.min(speed, 40) * 0.002 + this._sqJ) * this._dop, t, 0.05);
      sp(N.scSrc.playbackRate, 0.8 + 0.35 * slip + Math.min(speed, 40) * 0.004, t, 0.05);
      sp(N.roadS.gain, 0.2 * Math.pow(clamp(speed / 30, 0, 1.6), 1.25) * (this._onRoad === false ? 0.4 : 1), t, 0.08);
      sp(N.roadSrc.playbackRate, clamp(0.5 + speed / 32, 0.5, 2.2), t, 0.1);
      sp(N.roadG.gain, 0.05 * Math.pow(spd, 1.5), t, 0.05);
    }
    if (N.offG) {
      // surface + expansion joints (needs attachWorld): probe a few times a second
      if ((this._probeT = (this._probeT || 0) - dt) <= 0) {
        this._probeT = 0.2;
        const q = a.probe(this.pos);
        this._onRoad = q.onRoad; this._elev = q.elevated && q.onRoad;
      }
      const off = this._onRoad === false ? 1 : 0;
      this._offW = (this._offW || 0) + (off - (this._offW || 0)) * Math.min(1, dt * 5);
      const sf = clamp(speed / 20, 0, 1.5);
      sp(N.offG.gain, 0.35 * this._offW * sf, t, 0.05);
      sp(N.grG.gain, 0.12 * this._offW * sf * (0.4 + Math.random() * 1.2), t, 0.012);
      if (this._elev && speed > 4) {
        this._jointD = (this._jointD === undefined ? 10 + Math.random() * 20 : this._jointD) - speed * dt;
        if (this._jointD <= 0) {
          this._jointD = 22 + Math.random() * 26;
          const gj = clamp(speed / 28, 0.25, 1.1), wb = clamp(2.6 / speed, 0.03, 0.4);
          this._joint(t + 0.005, gj); this._joint(t + 0.005 + wb, gj * 0.85);
        }
      }
    }
    // squeal filters only run while needed
    if (slip > 0.02) { this._sqIdle = 0; if (!this._sqOn) { N.white.connect(N.sq1); if (N.sq2) N.white.connect(N.sq2); this._sqOn = true; } }
    else if (this._sqOn && (this._sqIdle += dt) > 1) { try { N.white.disconnect(N.sq1); if (N.sq2) N.white.disconnect(N.sq2); } catch (e) { /* */ } this._sqOn = false; }

    // interior tone
    if (this._intW > 0.01 && full) {
      sv(N.intLP.frequency, 320 + 500 * power + 7000 * Math.pow(open, 1.5), 0.02);
      sp(N.intEx.gain, 0.55 + 0.45 * open, t, 0.05);
      sv(N.bayLP.frequency, 1500 + 8000 * open, 0.02);
      sv(N.tireLP.frequency, 900 + 6000 * open, 0.02);
      sp(N.tireInt.gain, 0.45 + 0.5 * open, t, 0.05);
      if (N.boomG) {
        sp(N.boomG.gain, 0.14 * Math.pow(clamp(speed / 35, 0, 1.4), 1.2) * (1 - 0.5 * open), t, 0.1);
        sp(N.windG.gain, Math.min(0.22, 0.1 * Math.pow(speed / 40, 2) * (0.2 + 0.8 * open)), t, 0.1);
        sv(N.windBP.frequency, 500 + speed * 15, 0.03);
      }
    }
  }

  // expressway expansion joint: short low "ta-tan" thump per axle
  _joint(t, g) {
    const a = this.a, d = this.N && this.N.tire;
    if (!d) return;
    tn(a, d, t, { f: 62 + Math.random() * 10, f2: 38, gain: 0.32 * g, decay: 0.035, glide: 0.06 });
    nz(a, d, t, { type: 'lowpass', f: 420, gain: 0.35 * g, decay: 0.022, noise: 'brown' });
    nz(a, d, t + 0.002, { f: 1700 + Math.random() * 500, q: 2, gain: 0.05 * g, decay: 0.008 });
  }

  _dest(where) {
    const N = this.N;
    if (!N) return null;
    return where === 'cabin' ? N.cabin : where === 'bay' ? N.bay : N.exSum;
  }
  _pop(g) {
    const a = this.a, d = this._dest('ex');
    if (!d) return;
    const t = a.ctx.currentTime + 0.005;
    // recorded overrun pop (4 variations packed 0.25 s apart), random pitch; synth fallback
    const k = Math.floor(Math.random() * 4);
    if (smp(a, d, t, 'pops', { offset: k * 0.25, dur: 0.22, rate: 0.8 + Math.random() * 0.45, gain: g * this.vol * 1.1 })) return;
    nz(a, d, t, { f: 500 + Math.random() * 1600, q: 0.9, gain: g * this.vol * 0.5, decay: 0.012 + Math.random() * 0.012 });
    tn(a, d, t, { f: 90 + Math.random() * 40, f2: 50, gain: g * 0.25 * this.vol, decay: 0.02 });
  }
  backfire() {
    try {
      const a = this.a, d = this._dest('ex');
      if (!d) return;
      const t = a.ctx.currentTime + 0.005;
      if (smp(a, d, t, 'backfire', { gain: 0.9 * this.vol, rate: 0.9 + Math.random() * 0.25 })) {
        if (Math.random() < 0.5) smp(a, d, t + 0.08 + Math.random() * 0.06, 'pops', { offset: Math.floor(Math.random() * 4) * 0.25, dur: 0.22, gain: 0.5 * this.vol });
        return;
      }
      nz(a, d, t, { type: 'lowpass', f: 1400, gain: 0.7, decay: 0.05, noise: 'brown' });
      nz(a, d, t, { f: 700, q: 0.7, gain: 0.45, decay: 0.03 });
      tn(a, d, t, { f: 75, f2: 40, gain: 0.6, decay: 0.06 });
      if (Math.random() < 0.5) nz(a, d, t + 0.07 + Math.random() * 0.05, { f: 900, q: 0.8, gain: 0.3, decay: 0.025 });
    } catch (e) { this.a._err(e); }
  }
  blowOff() {
    try {
      const a = this.a, d = this._dest('bay');
      if (!d) return;
      const t = a.ctx.currentTime + 0.005, b = 0.5 + 0.5 * clamp(this.st.boost, 0, 1);
      if (a.banks && a.banks.get('bov')) {
        // recorded blow-off / compressor-surge flutter; per-car pitch, louder with boost
        const rate = (this.bovStyle === 'flutter' ? 0.88 : 1.05) * (0.94 + ((hashStr(String(this.car.id || '')) >> 3) % 13) / 100);
        if (this.bovStyle === 'flutter') {
          const ctx = a.ctx, am = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          lfo.type = 'triangle'; lfo.frequency.setValueAtTime(22, t); lfo.frequency.linearRampToValueAtTime(13, t + 0.6);
          lg.gain.value = 0.45; am.gain.value = 0.55; lfo.connect(lg); lg.connect(am.gain); am.connect(d);
          lfo.start(t); lfo.stop(t + 0.9);
          smp(a, am, t, 'bov', { rate, gain: 0.75 * b });
          if (!a._offline) setTimeout(() => { try { am.disconnect(); lg.disconnect(); } catch (e) { /* */ } }, 2500);
        } else smp(a, d, t, 'bov', { rate, gain: 0.7 * b });
        return;
      }
      if (this.bovStyle === 'flutter') {
        // compressor surge "chu-tu-tu-tu"
        const ctx = a.ctx, am = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.type = 'square'; lfo.frequency.setValueAtTime(24, t); lfo.frequency.linearRampToValueAtTime(14, t + 0.5);
        lg.gain.value = 0.5; am.gain.value = 0.5;
        lfo.connect(lg); lg.connect(am.gain); am.connect(d);
        lfo.start(t); lfo.stop(t + 0.7);
        nz(a, am, t, { f: 1100, f2: 600, q: 1.2, gain: 0.3 * b, attack: 0.005, hold: 0.1, decay: 0.12, sweep: 0.5 });
      } else {
        nz(a, d, t, { f: 3800, f2: 1300, q: 0.9, gain: 0.32 * b, attack: 0.006, hold: 0.06, decay: 0.09, sweep: 0.45 });
        nz(a, d, t, { type: 'highpass', f: 5000, gain: 0.08 * b, attack: 0.005, decay: 0.06 });
      }
    } catch (e) { this.a._err(e); }
  }
  shift() {
    try { const d = this._dest('cabin'); if (d) SFX.shift(this.a, d, this.a.ctx.currentTime + 0.003); } catch (e) { this.a._err(e); }
  }
  stall() {
    try {
      const a = this.a, d = this._dest('bay');
      if (!d) return;
      const t = a.ctx.currentTime + 0.005;
      for (let i = 0; i < 3; i++) tn(a, d, t + i * 0.09, { f: 42 - i * 5, gain: 0.35 - i * 0.08, decay: 0.04 });
      nz(a, d, t, { type: 'lowpass', f: 400, gain: 0.25, decay: 0.08, noise: 'brown' });
      this._alive *= 0.3;
    } catch (e) { this.a._err(e); }
  }
  horn(on) {
    try {
      const a = this.a, N = this.N;
      if (!N || !a.ctx) return;
      const t = a.ctx.currentTime;
      if (on && !N.horn) {
        N.horn = hornTone(a, N.ext, t, 0, 0.32);
        N.hornInt = a.ctx.createGain(); N.hornInt.gain.value = 0.35; N.horn.connect(N.hornInt); N.hornInt.connect(N.int);
      } else if (!on && N.horn) {
        const h = N.horn;
        h.gain.cancelScheduledValues(t); h.gain.setTargetAtTime(0, t, 0.02);
        for (const o of h._oscs || []) { try { o.stop(t + 0.15); } catch (e) { /* */ } }
        N.horn = null;
      }
    } catch (e) { this.a._err(e); }
  }
  dispose() {
    if (this._dead) return;
    this._dead = true;
    try { if (this.N) this._teardown(true); } catch (e) { /* */ }
    this.a.engines.delete(this);
  }
}

// ───────────────────────── Siren (Japanese police) ─────────────────────────
class Siren {
  constructor(a) {
    this.a = a; this.mode = 'off'; this.pos = { x: 0, y: 0, z: 0 }; this._prevD = null; this._vr = 0; this._lastT = 0;
    this._dead = false; this.N = null;
    a.sirens.add(this);
  }
  _build() {
    const a = this.a, ctx = a.ctx, t = ctx.currentTime, N = (this.N = {});
    N.o1 = ctx.createOscillator(); N.o1.type = 'sawtooth';
    N.o2 = ctx.createOscillator(); N.o2.type = 'square'; N.o2.detune.value = 6;
    const g1 = ctx.createGain(); g1.gain.value = 0.35; const g2 = ctx.createGain(); g2.gain.value = 0.2;
    N.ws = ctx.createWaveShaper(); N.ws.curve = a._clip;
    N.hp = ctx.createBiquadFilter(); N.hp.type = 'highpass'; N.hp.frequency.value = 330;
    N.pk = ctx.createBiquadFilter(); N.pk.type = 'peaking'; N.pk.frequency.value = 1500; N.pk.Q.value = 0.8; N.pk.gain.value = 5;
    N.lp = ctx.createBiquadFilter(); N.lp.type = 'lowpass'; N.lp.frequency.value = 5000;
    N.amp = ctx.createGain(); N.amp.gain.value = 0;
    N.panner = a._panner(true); N.panner.refDistance = 8;
    N.rev = ctx.createGain(); N.rev.gain.value = 0.3;
    N.o1.connect(g1); N.o2.connect(g2); g1.connect(N.ws); g2.connect(N.ws);
    N.ws.connect(N.hp); N.hp.connect(N.pk); N.pk.connect(N.lp); N.lp.connect(N.amp);
    N.amp.connect(N.panner); N.panner.connect(a.bus.sfx);
    N.amp.connect(N.rev); N.rev.connect(a.revIn);
    for (const o of [N.o1, N.o2]) { o.frequency.value = 430; o.start(t); }
    this.cur = 'off'; this.nextT = 0;
  }
  _freq(fn) { for (const o of [this.N.o1, this.N.o2]) fn(o.frequency); }
  update(position, mode, opts) {
    if (this._dead) return;
    try {
      const a = this.a, ctx = a.ctx;
      if (position) { this.pos.x = num(position.x, 0); this.pos.y = num(position.y, 0); this.pos.z = num(position.z, 0); }
      this.mode = ['wail', 'yelp', 'stop'].includes(mode) ? mode : 'off';
      if (!ctx) return;
      if (!this.N) this._build();
      const N = this.N, t = ctx.currentTime;
      setPos(N.panner, this.pos);
      const interior = !!(opts && opts.interior);
      sv(N.lp.frequency, interior ? 2200 : 5000);
      // doppler
      const d = dist(this.pos, a._L.pos), dt = this._lastT ? clamp(t - this._lastT, 0.001, 0.25) : 1 / 60;
      this._lastT = t;
      if (this._prevD !== null && !interior) { let vr = (d - this._prevD) / dt; if (Math.abs(vr) > 120) vr = 0; this._vr += (vr - this._vr) * Math.min(1, dt * 6); }
      else if (interior) this._vr = 0;
      this._prevD = d;
      const cents = 1200 * Math.log2(clamp(343 / (343 + this._vr), 0.7, 1.4));
      sp(N.o1.detune, cents, t, 0.05); sp(N.o2.detune, cents + 6, t, 0.05);
      if (this.mode !== this.cur) this._switch(this.mode, t);
      this._schedule(t);
    } catch (e) { this.a._err(e); }
  }
  _switch(mode, t) {
    const N = this.N;
    const wasOff = this.cur === 'off';
    this.cur = mode;
    this._freq((p) => { const v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); });
    const g = N.amp.gain, gv = g.value;
    g.cancelScheduledValues(t); g.setValueAtTime(gv, t);
    if (mode === 'off') { g.setTargetAtTime(0, t, 0.12); return; }
    if (wasOff && mode === 'wail') this._freq((p) => p.setValueAtTime(400, t + 0.01));
    this.nextT = t + 0.01;
  }
  _schedule(now) {
    const N = this.N, g = N.amp.gain;
    let guard = 0;
    while (this.cur !== 'off' && this.nextT < now + 0.6 && guard++ < 8) {
      const T = this.nextT;
      if (this.cur === 'wail') {
        // Japanese patrol-car "ウーーー": fast motor-like rise, long slow fall
        g.setTargetAtTime(0.5, T, 0.04);
        this._freq((p) => { p.setTargetAtTime(880, T, 0.5); p.setTargetAtTime(430, T + 1.9, 1.3); });
        this.nextT = T + 5.0;
      } else if (this.cur === 'yelp') {
        g.setTargetAtTime(0.5, T, 0.03);
        this._freq((p) => { p.setTargetAtTime(1250, T, 0.045); p.setTargetAtTime(640, T + 0.16, 0.045); });
        this.nextT = T + 0.32;
      } else if (this.cur === 'stop') {
        // short "ウッ" stop-request burst, repeated
        this._freq((p) => { p.setValueAtTime(420, T); p.setTargetAtTime(860, T, 0.12); p.setTargetAtTime(560, T + 0.42, 0.08); });
        g.setValueAtTime(0, T); g.linearRampToValueAtTime(0.55, T + 0.03); g.setValueAtTime(0.55, T + 0.42); g.setTargetAtTime(0, T + 0.42, 0.05);
        this.nextT = T + 2.2;
      }
    }
  }
  dispose() {
    if (this._dead) return;
    this._dead = true;
    try {
      const N = this.N;
      if (N) {
        const t = this.a.ctx.currentTime;
        N.amp.gain.cancelScheduledValues(t); N.amp.gain.setTargetAtTime(0, t, 0.03);
        N.o1.stop(t + 0.2); N.o2.stop(t + 0.2);
        if (this.a._offline) N.panner.disconnect(); else setTimeout(() => { try { N.panner.disconnect(); N.rev.disconnect(); } catch (e) { /* */ } }, 300);
      }
    } catch (e) { /* */ }
    this.a.sirens.delete(this);
  }
}

// ───────────────────────── Radio ─────────────────────────
const DJ_LINES = [
  (st, m) => `${st.jp}、${st.read}。続いては、${m.artist}で「${m.title}」。`,
  (st, m) => `こんばんは、${st.jp}です。お届けするのは、${m.artist}、「${m.title}」。`,
  (st, m) => `${m.artist}の新曲、「${m.title}」。`,
  (st) => `${st.jp}。大黒パーキングから、夜のドライブにぴったりの音楽を。`,
  (st) => `首都高をご利用の皆さん、安全運転で。${st.jp}、${st.read}。`,
];
class Radio {
  constructor(a) {
    this.a = a;
    this.stations = STATIONS.map(({ id, name, freq, genre }) => ({ id, name, freq, genre }));
    this.station = Math.max(0, STATIONS.findIndex((s) => s.id === 'jpop'));
    this.on = false;
    this.djVoice = true;
    const base = Math.floor(Date.now() / 200000);
    this._seed = STATIONS.map((s, i) => (base * 7919 + i * 104729 + 17) >>> 0);
    this._leftAt = STATIONS.map(() => 0);
    this.st = { interior: true, openness: 0, speed: 0 };
    this.pos = { x: 0, y: 0, z: 0 };
    this.N = null; this.music = null; this._timer = null; this._dead = false; this._playing = -1;
    a.radios.add(this);
  }
  _build() {
    const a = this.a, ctx = a.ctx, N = (this.N = {});
    const G = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    N.pre = G(0.55);
    N.comp = ctx.createDynamicsCompressor();
    N.comp.threshold.value = -20; N.comp.knee.value = 8; N.comp.ratio.value = 4; N.comp.attack.value = 0.006; N.comp.release.value = 0.2;
    N.hp = ctx.createBiquadFilter(); N.hp.type = 'highpass'; N.hp.frequency.value = 55;
    N.pres = ctx.createBiquadFilter(); N.pres.type = 'peaking'; N.pres.frequency.value = 2800; N.pres.Q.value = 0.8; N.pres.gain.value = 1.5;
    N.power = G(this.on ? 1 : 0);
    N.pre.connect(N.comp); N.comp.connect(N.hp); N.hp.connect(N.pres); N.pres.connect(N.power);
    N.intG = G(0); N.power.connect(N.intG); N.intG.connect(a.bus.radio);
    N.extLP = ctx.createBiquadFilter(); N.extLP.type = 'lowpass'; N.extLP.frequency.value = 800; N.extLP.Q.value = 0.6;
    N.extG = G(0); N.panner = a._panner(false); N.panner.refDistance = 3;
    N.power.connect(N.extLP); N.extLP.connect(N.extG); N.extG.connect(N.panner); N.panner.connect(a.bus.radio);
    // tuning static
    N.stSrc = ctx.createBufferSource(); N.stSrc.buffer = a.noise.white; N.stSrc.loop = true;
    N.stBP = ctx.createBiquadFilter(); N.stBP.type = 'bandpass'; N.stBP.frequency.value = 2200; N.stBP.Q.value = 0.6;
    N.stG = G(0);
    N.stSrc.connect(N.stBP); N.stBP.connect(N.stG); N.stG.connect(N.pre);
    N.stSrc.start(ctx.currentTime);
    this.music = new MusicEngine(ctx, N.pre, { white: a.noise.white, hallIR: a._hallIR, gateIR: a._gateIR, crackle: a._crackle, sawari: a._sawari });
    this.music.res.sawari = a._sawari;
    this.music.onSong = (song, mid) => this._onSong(song, mid);
    if (this.on) this._tune(false);
  }
  _onSong(song, mid) {
    const i = STATIONS.findIndex((s) => s.id === song.stationId);
    if (i >= 0) this._seed[i] = song.seed;
    if (!mid && this.djVoice && this.on && this.st.interior && Math.random() < 0.3 && !this.a._offline) {
      const st = STATIONS[i] || STATIONS[0];
      const line = DJ_LINES[Math.floor(Math.random() * DJ_LINES.length)](st, song);
      setTimeout(() => { if (this.on && this._playing === i) this.a.speak(line, 'ja-JP', { priority: 'low', rate: 1.05, volume: 0.9, channel: 'radio' }); }, 600);
    }
  }
  _tune(withStatic) {
    const a = this.a, ctx = a.ctx, N = this.N;
    if (!N) return;
    const t = ctx.currentTime;
    if (withStatic) {
      const g = N.stG.gain;
      g.cancelScheduledValues(t); g.setValueAtTime(0, t); g.linearRampToValueAtTime(0.5, t + 0.02);
      g.setValueAtTime(0.45, t + 0.25); g.linearRampToValueAtTime(0, t + 0.42);
      N.stBP.frequency.cancelScheduledValues(t);
      N.stBP.frequency.setValueAtTime(800 + Math.random() * 600, t); N.stBP.frequency.exponentialRampToValueAtTime(3500, t + 0.35);
    }
    const i = this.station, sid = STATIONS[i].id;
    // the station kept "broadcasting" while we were away
    const away = this._leftAt[i] ? (Date.now() - this._leftAt[i]) / 1000 : 0;
    if (away > 90) this._seed[i] = (this._seed[i] + Math.floor(away / 150)) >>> 0;
    this.music.start(sid, this._seed[i], true);
    if (withStatic) this.music.nextT = t + 0.35;
    this._playing = i;
    if (!a._offline && !this._timer && W.setInterval) this._timer = W.setInterval(() => { try { this.music && this.music.tick(); } catch (e) { /* */ } }, 50);
    if (withStatic && this.djVoice && this.st.interior && Math.random() < 0.12 && !a._offline) {
      const st = STATIONS[i];
      setTimeout(() => { if (this.on && this._playing === i) a.speak(`${st.jp}、${st.read}。`, 'ja-JP', { priority: 'low', rate: 1.05, volume: 0.9, channel: 'radio' }); }, 500);
    }
  }
  _stop() {
    if (this._playing >= 0) this._leftAt[this._playing] = Date.now();
    this._playing = -1;
    if (this.music) this.music.stop();
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }
  power(on) {
    try {
      on = !!on;
      if (on === this.on) return;
      this.on = on;
      const N = this.N;
      if (!N) return;
      const t = this.a.ctx.currentTime;
      sp(N.power.gain, on ? 1 : 0, t, 0.03);
      if (on) this._tune(true); else this._stop();
    } catch (e) { this.a._err(e); }
  }
  setStation(i) {
    try {
      const n = STATIONS.length;
      i = ((Math.round(num(i, 0)) % n) + n) % n;
      if (i === this.station && (this._playing === i || !this.on)) return;
      if (this._playing >= 0) this._leftAt[this._playing] = Date.now();
      this.station = i;
      if (this.on && this.N) this._tune(true);
    } catch (e) { this.a._err(e); }
  }
  next() { this.setStation(this.station + 1); }
  prev() { this.setStation(this.station - 1); }
  nowPlaying() {
    const st = STATIONS[this.station];
    let meta;
    if (this.music && this.music.song && this._playing === this.station) meta = { title: this.music.song.title, artist: this.music.song.artist };
    else meta = songName(st.id, this._seed[this.station]);
    return { station: `${st.name} ${st.freq}`, id: st.id, freq: st.freq, genre: st.genre, title: meta.title, artist: meta.artist, on: this.on };
  }
  update(s) {
    if (this._dead) return;
    try {
      s = s || {};
      if (s.interior !== undefined) this.st.interior = !!s.interior;
      if (s.openness !== undefined) this.st.openness = clamp(num(s.openness, 0), 0, 1);
      if (s.speed !== undefined) this.st.speed = Math.abs(num(s.speed, 0));
      if (s.position) { this.pos.x = num(s.position.x, 0); this.pos.y = num(s.position.y, 0); this.pos.z = num(s.position.z, 0); }
      const a = this.a;
      if (!a.ctx) return;
      if (!this.N) this._build();
      const N = this.N, t = a.ctx.currentTime;
      if (this.on && this._playing < 0) { sp(N.power.gain, 1, t, 0.03); this._tune(false); }
      const o = this.st.openness;
      const pos = s.position ? this.pos : a._L.pos;
      setPos(N.panner, pos);
      if (this.st.interior) {
        sp(N.intG.gain, 1 + clamp(this.st.speed / 40, 0, 1) * 0.3, t, 0.08);
        sp(N.extG.gain, 0, t, 0.08);
      } else {
        sp(N.intG.gain, 0, t, 0.08);
        sp(N.extG.gain, 0.22 + 0.9 * o, t, 0.08);
        sv(N.extLP.frequency, 700 + 9000 * Math.pow(o, 1.6), 0.02);
      }
      if (this.music) this.music.tick();
    } catch (e) { this.a._err(e); }
  }
  _tick() { if (this.music && this.on) this.music.tick(); }
  dispose() {
    if (this._dead) return;
    this._dead = true;
    try {
      this._stop();
      const N = this.N;
      if (N) { N.stSrc.stop(); N.panner.disconnect(); N.intG.disconnect(); N.hp.disconnect(); }
      if (this.music) { try { this.music.hallRet.disconnect(); this.music.gateRet.disconnect(); } catch (e) { /* */ } }
    } catch (e) { /* */ }
    this.a.radios.delete(this);
  }
}

// ───────────────────────── GameAudio ─────────────────────────
export class GameAudio {
  constructor(opts) {
    this._opts = opts || {};
    this.ctx = null;
    this._offline = false;
    this._vol = { master: 0.9, engine: 0.8, sfx: 0.8, ambient: 0.6, radio: 0.7 };
    this._env = { night: 1, inPA: false, nearSea: false, speedWind: 0 };
    this._L = { pos: { x: 0, y: 0, z: 0 }, fwd: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } };
    this.engines = new Set(); this.sirens = new Set(); this.radios = new Set();
    this._errors = [];
    this._voices = 0;
    this._resumeT = 0;
    this._budgetT = 0;
    /** max simultaneously synthesized 'lite' engines (nearest first); tune for low-end devices */
    this.maxEngines = num(this._opts.maxEngines, IS_MOBILE ? 12 : 28);
    this.supported = !!(AC || this._opts.context);
  }
  _err(e) {
    if (this._errors.length < 50) this._errors.push(String((e && e.stack) || e));
    if (!this._warned) { this._warned = true; try { console.warn('[audio]', e); } catch (x) { /* */ } }
  }
  get ready() {
    const c = this.ctx;
    return !!c && (this._offline || c.state === 'running');
  }
  async unlock() {
    try {
      if (!this.ctx) {
        if (this._opts.context) { this.ctx = this._opts.context; this._offline = !!(OAC && this.ctx instanceof OAC); }
        else if (AC) {
          try { this.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { this.ctx = new AC(); }
        } else return false;
        this._init();
      }
      const ctx = this.ctx;
      this._unlocked = true;
      if (!this._offline && ctx.state !== 'running' && ctx.resume) {
        await Promise.race([Promise.resolve(ctx.resume()).catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
      }
      if (!this._offline && !this._primed) {
        this._primed = true;
        // iOS: play a silent buffer inside the gesture
        try { const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); s.connect(ctx.destination); s.start(0); } catch (e) { /* */ }
        // iOS: speech synthesis must be primed by a gesture too
        try { if (IS_IOS && W.speechSynthesis && W.SpeechSynthesisUtterance) { const u = new W.SpeechSynthesisUtterance(' '); u.volume = 0; W.speechSynthesis.speak(u); } } catch (e) { /* */ }
      }
    } catch (e) { this._err(e); }
    return this.ready;
  }
  _init() {
    const ctx = this.ctx;
    const G = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    this.noise = { white: makeNoise(ctx, 'white', 3), pink: makeNoise(ctx, 'pink', 3), brown: makeNoise(ctx, 'brown', 3) };
    this._clip = softClipCurve(1024, 2.5);
    this._sawari = sawariCurve();
    this._hallIR = makeIR(ctx, 1.9, 2.6, 7000, 1800, false);
    this._gateIR = makeIR(ctx, 0.26, 1, 8000, 4000, true);
    this._crackle = makeCrackle(ctx);
    try { this.banks = new Banks(ctx); for (const n of SFX_FILES) this.banks.buffer(n); } catch (e) { this.banks = null; this._err(e); }
    // master chain: buses → master → glue comp → limiter → out
    this.master = G(this._vol.master);
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -20; this.comp.knee.value = 10; this.comp.ratio.value = 4; this.comp.attack.value = 0.005; this.comp.release.value = 0.25;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -3; this.limiter.knee.value = 0; this.limiter.ratio.value = 20; this.limiter.attack.value = 0.001; this.limiter.release.value = 0.1;
    this.out = G(0.85); // makeup gain after the heavier levelling compressor
    this.master.connect(this.comp); this.comp.connect(this.limiter); this.limiter.connect(this.out); this.out.connect(ctx.destination);
    this.bus = { engine: G(this._vol.engine), sfx: G(this._vol.sfx), ambient: G(this._vol.ambient), radio: G(this._vol.radio) };
    for (const k in this.bus) this.bus[k].connect(this.master);
    // shared reverb (small, generated impulse) — SFX / siren / ambience send into revIn
    this.revIn = G(1);
    this.rev = ctx.createConvolver(); this.rev.buffer = makeIR(ctx, 1.3, 3, 6000, 1500, false);
    this.revOut = G(0.3);
    this.revIn.connect(this.rev); this.rev.connect(this.revOut); this.revOut.connect(this.master);
    // environment reverb (tunnel / trench / under a viaduct): engine + sfx buses → sends → convolvers
    this.envIn = G(1); this.envLP = ctx.createBiquadFilter(); this.envLP.type = 'lowpass'; this.envLP.frequency.value = 9000;
    this.bus.engine.connect(this.envIn); this.bus.sfx.connect(this.envIn);
    this.envIn.connect(this.envLP);
    this.envW = {};
    for (const k of ['tunnel', 'trench', 'deck']) {
      const send = G(0), cv = ctx.createConvolver();
      cv.normalize = false; cv.buffer = makeSpaceIR(ctx, k);
      send.connect(cv); cv.connect(this.master);
      this.envW[k] = { send, cv, on: false, idle: 0 };
    }
    this._space = { tunnel: 0, trench: 0, deck: 0, deckH: 10, t: 0 };
    this._buildAmbient();
    this._applyListener();
    // fade everything out while the tab is hidden (engines would otherwise drone on)
    if (!this._offline && W.document && W.document.addEventListener) {
      W.document.addEventListener('visibilitychange', () => {
        try {
          this._hidden = W.document.hidden;
          const t = this.ctx.currentTime;
          this.out.gain.cancelScheduledValues(t);
          this.out.gain.setTargetAtTime(this._hidden ? 0 : 0.72, t, 0.05);
        } catch (e) { /* */ }
      });
    }
  }
  _panner(hq) {
    const p = this.ctx.createPanner();
    p.panningModel = hq && !IS_MOBILE ? 'HRTF' : 'equalpower';
    p.distanceModel = 'inverse';
    p.refDistance = 4; p.maxDistance = 2000; p.rolloffFactor = 1;
    return p;
  }
  _stereo(pan) {
    const ctx = this.ctx;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); return p; }
    const p = ctx.createPanner(); p.panningModel = 'equalpower';
    // fallback: place around the listener's head (listener-relative positioning isn't available; approximate)
    setPos(p, { x: this._L.pos.x + pan, y: this._L.pos.y, z: this._L.pos.z - 1 }); p.refDistance = 100;
    return p;
  }

  setVolumes(v) {
    try {
      v = v || {};
      for (const k of ['master', 'engine', 'sfx', 'ambient', 'radio']) if (v[k] !== undefined) this._vol[k] = clamp(num(v[k], this._vol[k]), 0, 1);
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      sp(this.master.gain, this._vol.master, t, 0.05);
      for (const k in this.bus) sp(this.bus[k].gain, this._vol[k], t, 0.05);
    } catch (e) { this._err(e); }
  }
  setListener(pos, forward, up) {
    try {
      const L = this._L;
      if (pos) { L.pos.x = num(pos.x, 0); L.pos.y = num(pos.y, 0); L.pos.z = num(pos.z, 0); }
      if (forward) { L.fwd.x = num(forward.x, 0); L.fwd.y = num(forward.y, 0); L.fwd.z = num(forward.z, -1); }
      if (up) { L.up.x = num(up.x, 0); L.up.y = num(up.y, 1); L.up.z = num(up.z, 0); }
      if (this.ctx) this._applyListener();
    } catch (e) { this._err(e); }
  }
  _applyListener() {
    const l = this.ctx.listener, L = this._L;
    if (l.positionX) {
      l.positionX.value = L.pos.x; l.positionY.value = L.pos.y; l.positionZ.value = L.pos.z;
      l.forwardX.value = L.fwd.x; l.forwardY.value = L.fwd.y; l.forwardZ.value = L.fwd.z;
      l.upX.value = L.up.x; l.upY.value = L.up.y; l.upZ.value = L.up.z;
    } else {
      if (l.setPosition) l.setPosition(L.pos.x, L.pos.y, L.pos.z);
      if (l.setOrientation) l.setOrientation(L.fwd.x, L.fwd.y, L.fwd.z, L.up.x, L.up.y, L.up.z);
    }
  }
  setEnvironment(e) {
    try {
      e = e || {};
      const E = this._env;
      if (e.night !== undefined) E.night = clamp(num(e.night, E.night), 0, 1);
      if (e.inPA !== undefined) E.inPA = !!e.inPA;
      if (e.nearSea !== undefined) E.nearSea = !!e.nearSea;
      if (e.speedWind !== undefined) E.speedWind = Math.abs(num(e.speedWind, 0));
    } catch (x) { this._err(x); }
  }

  /** optional: lets the audio probe the road network for tunnels / viaduct decks / surfaces (reverb, joints, rumble) */
  attachWorld(net, world) { this._net = net || null; this._world = world || null; }
  // what kind of space is around a point: { tunnel, trench, deck (0..1), deckH, onRoad, elevated }
  probe(p) {
    const net = this._net, w = this._world;
    const r = { tunnel: 0, trench: 0, deck: 0, deckH: 10, onRoad: true, elevated: false, y: 0 };
    if (!net || !net.hits || !p) return r;
    let below = null, over = null;
    for (const h of net.hits(p.x, p.z)) {
      if (!h.inside) continue;
      if (h.y <= p.y + 0.6) { if (!below || h.y > below.y) below = h; }
      else if (h.y > p.y + 2.2 && h.y < p.y + 45) { if (!over || h.y < over.y) over = h; }
    }
    const land = w && w.isLand ? w.isLand(p.x, p.z) : true;
    if (below && p.y - below.y < 7) {
      r.y = below.y;
      if (below.y < -0.6) {
        if (!land || below.y < -6.2) r.tunnel = 1; else r.trench = clamp((-0.6 - below.y) / 3, 0.3, 1);
      }
      r.elevated = below.y > 4;
    } else r.onRoad = false;
    if (over && !r.tunnel) { r.deckH = over.y - p.y; r.deck = clamp(1.25 - r.deckH / 30, 0.3, 1); }
    return r;
  }
  _updateSpace(dt) {
    const S = this._space;
    if (!S || !this.envW) return;
    if ((S.t -= dt) <= 0) {
      S.t = 0.15;
      const q = this.probe(this._L.pos);
      S.tunnel = q.tunnel; S.trench = q.tunnel ? 0 : q.trench; S.deck = q.deck; S.deckH = q.deckH;
    }
    const t = this.ctx.currentTime, inside = clamp(this._intW || 0, 0, 1);
    sv(this.envLP.frequency, 9000 - 7600 * inside, 0.03);
    const lvl = { tunnel: 0.55, trench: 0.38, deck: 0.42 };
    for (const k in this.envW) {
      const E = this.envW[k], v = S[k] * lvl[k] * (1 - 0.55 * inside);
      // only keep a convolver running while it is audible (+ its tail)
      if (v > 0.002) { E.idle = 0; if (!E.on) { this.envLP.connect(E.send); E.on = true; } }
      else if (E.on && (E.idle = (E.idle || 0) + dt) > 3.5) { try { this.envLP.disconnect(E.send); } catch (e) { /* */ } E.on = false; }
      sp(E.send.gain, v, t, 0.25);
    }
  }

  createEngine(car, opts) {
    try { return new EngineSound(this, car, opts); } catch (e) { this._err(e); return NULL_ENGINE; }
  }
  createSiren() {
    try { return new Siren(this); } catch (e) { this._err(e); return NULL_SIREN; }
  }
  createRadio() {
    try { return new Radio(this); } catch (e) { this._err(e); return NULL_RADIO; }
  }

  sfx(name, opts) {
    try {
      if (!this.ctx || !SFX[name]) return;
      opts = opts || {};
      if (this._voices > 40 || (this._voices > 24 && (name === 'footstep' || name === 'turn_tick' || name === 'hazard_tick'))) return;
      const ctx = this.ctx, t = ctx.currentTime + 0.004;
      const g = ctx.createGain();
      g.gain.value = clamp(num(opts.volume, 1), 0, 1.5) * (name === 'crash' ? 1.6 : 0.75);
      let p = null, rs = null;
      if (opts.position) {
        p = this._panner(name === 'crash');
        setPos(p, opts.position);
        g.connect(p); p.connect(this.bus.sfx);
        rs = ctx.createGain(); rs.gain.value = name === 'crash' ? 0.35 : 0.12;
        g.connect(rs); rs.connect(this.revIn);
      } else g.connect(this.bus.sfx);
      const end = SFX[name](this, g, t, opts) || t + 1;
      this._voices++;
      const cleanup = () => { this._voices--; try { g.disconnect(); if (p) p.disconnect(); if (rs) rs.disconnect(); } catch (e) { /* */ } };
      if (this._offline) this._voices--; else setTimeout(cleanup, (end - ctx.currentTime) * 1000 + 300);
    } catch (e) { this._err(e); }
  }

  speak(text, lang = 'ja-JP', opts) {
    try {
      const ss = W.speechSynthesis;
      if (!ss || !W.SpeechSynthesisUtterance || !text) return;
      opts = opts || {};
      if (opts.priority === 'low' && (ss.speaking || ss.pending)) return;
      ss.cancel();
      const u = new W.SpeechSynthesisUtterance(String(text));
      u.lang = lang;
      const v = this._voice(lang);
      if (v) u.voice = v;
      u.rate = clamp(num(opts.rate, 1), 0.5, 2);
      u.pitch = clamp(num(opts.pitch, 1), 0, 2);
      const busVol = opts.channel === 'radio' ? this._vol.radio : this._vol.sfx;
      u.volume = clamp(num(opts.volume, 1) * this._vol.master * busVol, 0, 1);
      ss.speak(u);
    } catch (e) { this._err(e); }
  }
  _voice(lang) {
    const ss = W.speechSynthesis;
    const vs = (ss.getVoices && ss.getVoices()) || [];
    if (!vs.length) return null;
    this._vcache = this._vcache || {};
    if (this._vcache[lang] !== undefined) return this._vcache[lang];
    const base = lang.split('-')[0].toLowerCase();
    const cands = vs.filter((v) => (v.lang || '').replace('_', '-').toLowerCase().startsWith(base));
    const pref = /Kyoko|O-ren|Otoya|Google 日本語|Haruka|Ayumi|Nanami|Sayaka|Ichiro/;
    const v = cands.find((x) => pref.test(x.name)) || cands.find((x) => (x.lang || '').toLowerCase() === lang.toLowerCase()) || cands[0] || null;
    this._vcache[lang] = v;
    return v;
  }

  update(dt) {
    try {
      const ctx = this.ctx;
      if (!ctx) return;
      dt = clamp(num(dt, 1 / 60), 0, 0.25);
      if (!this._offline && this._unlocked && !this._hidden && (ctx.state === 'suspended' || ctx.state === 'interrupted') && ctx.resume) {
        const now = Date.now();
        if (now - this._resumeT > 1000) { this._resumeT = now; Promise.resolve(ctx.resume()).catch(() => {}); }
      }
      this._updateAmbient(dt);
      this._updateSpace(dt);
      // engine budget: only the nearest `maxEngines` lite engines are synthesized
      if ((this._budgetT -= dt) <= 0) {
        this._budgetT = 0.4;
        const L = this._L.pos, lite = [];
        for (const e of this.engines) if (e.lod === 'lite' && !e._dead) { e._dist = dist(e.pos, L); lite.push(e); }
        if (lite.length > this.maxEngines) {
          lite.sort((x, y) => x._dist - y._dist);
          lite.forEach((e, i) => { e._budgetOff = i >= this.maxEngines; });
        } else for (const e of lite) e._budgetOff = false;
      }
      for (const r of this.radios) r._tick();
    } catch (e) { this._err(e); }
  }

  // ───────── ambience ─────────
  _buildAmbient() {
    const ctx = this.ctx, t = ctx.currentTime;
    const G = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const F = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
    const NS = (kind, rate = 1) => { const s = ctx.createBufferSource(); s.buffer = this.noise[kind]; s.loop = true; s.playbackRate.value = rate; s.start(t, Math.random() * 2.5); return s; };
    const A = (this.amb = { out: G(1), swell: 0, gust: 0, timers: { insect: 1, brake: 8, gull: 5, rev: 6, door: 4, pass: 3 } });
    A.out.connect(this.bus.ambient);
    // distant expressway: two decorrelated low rumbles + tyre hiss, panned wide
    A.traf = [];
    for (const pan of [-0.7, 0.7]) {
      const lp = F('lowpass', 260, 0.5), g = G(0), p = this._stereo(pan);
      NS('brown', pan < 0 ? 1 : 0.93).connect(lp); lp.connect(g); g.connect(p); p.connect(A.out);
      A.traf.push(g);
    }
    A.hissBP = F('bandpass', 900, 0.5); A.hiss = G(0);
    NS('pink').connect(A.hissBP); A.hissBP.connect(A.hiss); A.hiss.connect(A.out);
    // sea: slow swells
    A.seaLP = F('lowpass', 700, 0.4); A.seaAM = G(0.5); A.sea = G(0);
    NS('pink', 0.8).connect(A.seaLP); A.seaLP.connect(A.seaAM); A.seaAM.connect(A.sea); A.sea.connect(A.out);
    A.seaLfo = ctx.createOscillator(); A.seaLfo.frequency.value = 0.11; A.seaLfoG = G(0.45);
    A.seaLfo.connect(A.seaLfoG); A.seaLfoG.connect(A.seaAM.gain); A.seaLfo.start(t);
    // wind (listener speed + sea breeze)
    A.windBP = F('bandpass', 500, 0.8); A.wind = G(0);
    NS('white').connect(A.windBP); A.windBP.connect(A.wind); A.wind.connect(A.out);
    A.rumLP = F('lowpass', 120, 0.6); A.rum = G(0);
    NS('brown', 1.3).connect(A.rumLP); A.rumLP.connect(A.rum); A.rum.connect(A.out);
    // crowd murmur: formant-filtered noise "voices" with syllabic envelopes
    A.crowd = G(0); A.crowdLP = F('lowpass', 2400, 0.5); A.crowdLP.connect(A.crowd); A.crowd.connect(A.out);
    A.voices = [];
    for (let i = 0; i < 4; i++) {
      const bp = F('bandpass', 500 + i * 300, 5), bp2 = F('bandpass', 1400 + i * 250, 6), g = G(0), p = this._stereo(-0.6 + i * 0.4);
      const s = NS('white');
      s.connect(bp); s.connect(bp2); bp.connect(g); bp2.connect(g); g.connect(p); p.connect(A.crowdLP);
      A.voices.push({ bp, bp2, g, next: 0 });
    }
  }
  _updateAmbient(dt) {
    const A = this.amb;
    if (!A) return;
    const ctx = this.ctx, t = ctx.currentTime, E = this._env, n = E.night, day = 1 - n;
    // traffic hum with slow random swells (passing vehicles far away)
    A.swell = clamp(A.swell + (Math.random() - 0.5) * dt * 0.8, -0.35, 0.35);
    const traf = (0.11 * (1 - 0.35 * n) + 0.03) * (1 + A.swell);
    sp(A.traf[0].gain, traf * (1 + A.swell * 0.5), t, 0.3);
    sp(A.traf[1].gain, traf * (1 - A.swell * 0.5), t, 0.3);
    sp(A.hiss.gain, (0.025 * (1 - 0.4 * n) + 0.008) * (1 + A.swell), t, 0.3);
    sp(A.sea.gain, E.nearSea ? 0.09 : 0, t, 0.8);
    A.gust = clamp(A.gust + (Math.random() - 0.5) * dt * 1.5, -0.4, 0.4);
    const w = clamp(E.speedWind / 30, 0, 1.5);
    const wTot = (0.012 * (E.nearSea ? 1.8 : 1) + 0.16 * w * w) * (1 + A.gust);
    if (!A.windS && this.banks && this.banks.get('wind')) {
      // recorded wind loop replaces most of the filtered-noise wind
      const src = ctx.createBufferSource(); src.buffer = this.banks.get('wind'); src.loop = true;
      A.windSG = ctx.createGain(); A.windSG.gain.value = 0; A.windSLP = ctx.createBiquadFilter(); A.windSLP.type = 'lowpass'; A.windSLP.frequency.value = 2500;
      src.connect(A.windSLP); A.windSLP.connect(A.windSG); A.windSG.connect(A.out); src.start(t, Math.random() * 4); A.windS = src;
    }
    if (A.windS) {
      sp(A.windSG.gain, wTot * 1.6, t, 0.15);
      sp(A.windS.playbackRate, 0.75 + 0.45 * Math.min(w, 1.2) + A.gust * 0.1, t, 0.3);
      sv(A.windSLP.frequency, 1200 + 5000 * Math.min(w, 1.2), 0.03);
    }
    sp(A.wind.gain, wTot * (A.windS ? 0.35 : 1), t, 0.15);
    sv(A.windBP.frequency, 350 + 900 * Math.min(w, 1) + A.gust * 200, 0.03);
    sp(A.rum.gain, Math.min(0.35, 0.22 * w * w) * (1 + A.gust), t, 0.15);
    // crowd
    const crowd = E.inPA ? 0.05 + 0.1 * n : 0;
    sp(A.crowd.gain, crowd, t, 0.6);
    if (crowd > 0.001) {
      for (const v of A.voices) {
        if (t >= v.next) {
          const syl = 0.08 + Math.random() * 0.18;
          v.next = t + syl;
          const talk = Math.random() < 0.7;
          try {
            v.g.gain.setTargetAtTime(talk ? 0.2 + Math.random() * 0.5 : 0.02, t, syl * 0.3);
            v.bp.frequency.value = 350 + Math.random() * 600;
            v.bp2.frequency.value = 1100 + Math.random() * 1300;
          } catch (e) { /* */ }
        }
      }
    }
    // one-shots
    const T = A.timers;
    for (const k in T) T[k] -= dt;
    if (T.insect <= 0) {
      T.insect = 0.4 + Math.random() * 2;
      if (n > 0.3 && Math.random() < n * (E.inPA ? 0.5 : 1)) this._insect(n);
    }
    if (T.brake <= 0) { T.brake = (day > 0.5 ? 25 : 60) * (0.5 + Math.random()); this._airBrake(); }
    if (T.gull <= 0) { T.gull = 12 + Math.random() * 20; if (day > 0.4 && Math.random() < (E.nearSea ? 0.9 : 0.3)) this._gull(day); }
    if (T.rev <= 0) { T.rev = 6 + Math.random() * 14; if (E.inPA && n > 0.5) this._distantRev(); }
    if (T.door <= 0) { T.door = 3 + Math.random() * 9; if (E.inPA && Math.random() < 0.6) this._ambSfx(Math.random() < 0.7 ? 'door_close' : 'trunk_close', 0.08 + Math.random() * 0.08); }
  }
  _ambDest(pan, lp, gain) {
    const ctx = this.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain(), p = this._stereo(pan);
    f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = gain;
    f.connect(g); g.connect(p); p.connect(this.amb.out);
    if (!this._offline) setTimeout(() => { try { p.disconnect(); } catch (e) { /* */ } }, 4000);
    return f;
  }
  _ambSfx(name, gain) { const d = this._ambDest(Math.random() * 1.6 - 0.8, 1200, gain); SFX[name](this, d, this.ctx.currentTime + 0.01); }
  _insect(n) {
    const ctx = this.ctx, t = ctx.currentTime + 0.01;
    const d = this._ambDest(Math.random() * 1.8 - 0.9, 9000, 0.012 + 0.012 * n);
    if (Math.random() < 0.55) {
      // bell-cricket style "riii-n"
      const o = ctx.createOscillator(), am = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(), env = ctx.createGain();
      o.frequency.value = 4200 + Math.random() * 500; lfo.type = 'square'; lfo.frequency.value = 38 + Math.random() * 14;
      am.gain.value = 0.5; lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
      env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(1, t + 0.04); env.gain.setValueAtTime(1, t + 0.3); env.gain.setTargetAtTime(0, t + 0.3, 0.08);
      o.connect(am); am.connect(env); env.connect(d);
      o.start(t); lfo.start(t); o.stop(t + 0.9); lfo.stop(t + 0.9);
    } else {
      // cricket "koro koro" trill
      const f = 3500 + Math.random() * 600, k = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < k; i++) tn(this, d, t + i * 0.065, { f, gain: 1, attack: 0.004, hold: 0.02, decay: 0.006 });
    }
  }
  _airBrake() {
    const d = this._ambDest(Math.random() * 1.6 - 0.8, 3500, 0.03 * (1 - 0.4 * this._env.night));
    nz(this, d, this.ctx.currentTime + 0.01, { type: 'highpass', f: 2200, q: 0.5, gain: 1, attack: 0.02, hold: 0.35, decay: 0.25 });
  }
  _gull(day) {
    const d = this._ambDest(Math.random() * 1.6 - 0.8, 4000, 0.02 * day);
    const ctx = this.ctx, t0 = ctx.currentTime + 0.01, k = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < k; i++) {
      const t = t0 + i * (0.38 + Math.random() * 0.1);
      const o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1300, t); o.frequency.linearRampToValueAtTime(2250, t + 0.08); o.frequency.exponentialRampToValueAtTime(1500, t + 0.3);
      bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 2.5;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.03); g.gain.setTargetAtTime(0, t + 0.22, 0.04);
      o.connect(bp); bp.connect(g); g.connect(d); o.start(t); o.stop(t + 0.5);
    }
  }
  _distantRev() {
    const ctx = this.ctx, t = ctx.currentTime + 0.01;
    const d = this._ambDest(Math.random() * 1.6 - 0.8, 900, 0.05);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    const lo = 28 + Math.random() * 10, hi = lo * (2.5 + Math.random() * 1.5);
    o.frequency.setValueAtTime(lo, t); o.frequency.setTargetAtTime(hi, t + 0.05, 0.12); o.frequency.setTargetAtTime(lo, t + 0.45, 0.25);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.08); g.gain.setTargetAtTime(0.15, t + 0.45, 0.2); g.gain.setTargetAtTime(0, t + 1.2, 0.2);
    o.connect(g); g.connect(d); o.start(t); o.stop(t + 2.4);
  }
}

// null objects returned if construction ever fails
const NOOP = () => {};
const NULL_ENGINE = { update: NOOP, backfire: NOOP, blowOff: NOOP, shift: NOOP, stall: NOOP, dispose: NOOP, horn: NOOP };
const NULL_SIREN = { update: NOOP, dispose: NOOP };
const NULL_RADIO = {
  stations: STATIONS.map(({ id, name, freq, genre }) => ({ id, name, freq, genre })), station: 0, on: false, djVoice: false,
  power: NOOP, setStation: NOOP, next: NOOP, prev: NOOP, update: NOOP, dispose: NOOP,
  nowPlaying: () => ({ station: '', title: '', artist: '' }),
};

export { STATIONS };
export default GameAudio;
