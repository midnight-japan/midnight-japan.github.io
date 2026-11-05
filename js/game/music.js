// MIDNIGHT JAPAN — generative radio music.
// Everything here is ORIGINAL and synthesized in real time with the Web Audio API:
// seeded random song forms, chord progressions, melodies, bass lines and drum parts.
// No samples, no copyrighted melodies. Song titles / artist names are invented.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ───────────────────────── seeded random ─────────────────────────
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function R(seed) {
  const f = mulberry32(seed);
  return {
    f,
    i: (a, b) => a + Math.floor(f() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
  };
}

// ───────────────────────── stations ─────────────────────────
// sorted by frequency (tuning order). `read` = Japanese reading for the DJ voice.
export const STATIONS = [
  { id: 'enka', name: 'ENKA NIGHT', freq: 76.5, genre: 'Enka', jp: '演歌ナイト', read: 'ななじゅうろくてんご' },
  { id: 'citypop', name: 'FM DAIKOKU', freq: 82.5, genre: 'City Pop', jp: 'エフエム大黒', read: 'はちじゅうにてんご' },
  { id: 'eurobeat', name: 'EUROBEAT YOKOHAMA', freq: 85.1, genre: 'Eurobeat', jp: 'ユーロビート横浜', read: 'はちじゅうごてんいち' },
  { id: 'lofi', name: 'LO-FI WANGAN', freq: 89.7, genre: 'Lo-Fi Hip Hop', jp: 'ローファイ湾岸', read: 'はちじゅうきゅうてんなな' },
  { id: 'jpop', name: 'J-POP 90.8 BAYSTAR', freq: 90.8, genre: 'J-POP', jp: 'ジェイポップ・ベイスター', read: 'きゅうじゅってんはち' },
];

// ───────────────────────── invented names ─────────────────────────
const NAMES = {
  citypop: {
    a: ['真夜中の', 'ベイサイド', '午前零時の', 'ガラス越しの', '港の見える', 'シルエット', 'ネオン', 'サマーナイト', 'ブルーアワーの', '湾岸', '月曜日の', '桟橋の'],
    b: ['ドライブ', 'ラブソング', 'ダンサー', 'レイン', 'メモリー', 'パレード', 'リゾート', 'シーサイド', 'ストーリー', 'トワイライト', 'ハイウェイ', 'カクテル'],
    sur: ['葉山', '南条', '杉浦', '真鍋', '浅倉', '瀬戸', '早瀬', '汐見', '秋庭', '水城'],
    given: ['かおる', '玲奈', 'ユウキ', '真理', 'アキラ', 'みずき', '直人', '沙織', 'リョウ', '透'],
    band: ['ネオン・ハーバー', 'Bayside Velvet', 'ミッドナイト・クルーズ', 'Pacific Avenue 7', 'シティ・ランデヴー', 'Coral Lights'],
  },
  eurobeat: {
    a: ['NEON', 'TURBO', 'CHROME', 'ELECTRIC', 'MIDNIGHT', 'SILVER', 'LASER', 'COSMIC', 'HYPER', 'CRIMSON', 'VELVET', 'SONIC'],
    b: ['DRIVER', 'HEARTBEAT', 'PARADISE', 'CORNER', 'EMOTION', 'VELOCITY', 'SIGNAL', 'HORIZON', 'KISS', 'BOOST', 'LOVER', 'REVOLUTION'],
    first: ['MARCO', 'LUCIA', 'NICO', 'ELISA', 'TONY', 'GINA', 'ALEX', 'SARA', 'DINO', 'VALE', 'ROXY', 'ENZO'],
    last: ['VELOCE', 'BRIGHTWAY', 'STELLARE', 'ROCKETTI', 'FOXXINI', 'MARINETTI', 'LASERA', 'TURBINA', 'NOVARA', 'CORSARI'],
  },
  lofi: {
    a: ['yokohama', '4am', 'bayside', 'rain on the', 'tsuki', 'yoru', 'kissaten', 'umi', 'sleepy', 'daikoku', 'late night', 'tetrapod'],
    b: ['tapes', 'drive', 'window', 'coffee', 'memories', 'loop', 'walk', 'haze', 'static', 'lights', 'ramen', 'parking'],
    artist: ['tsubame.', 'kumo beats', 'nagi', 'mizu & co', 'yoru no neko', 'hikari tapes', 'shiokaze', 'ame.wav', 'kaigan', 'nemui'],
  },
  jpop: {
    a: ['君と', '夏の', '青い', '最後の', '恋する', 'きらめく', '終わらない', 'はじまりの', '真夜中の', '願いの', '星降る', '未来へ'],
    b: ['シグナル', 'ステップ', 'メロディー', '約束', 'ストーリー', '流れ星', 'エール', 'ハートビート', '花火', 'ミラクル', '青空', 'ドライブ'],
    group: ['STELLA☆LINE', 'はなまる少女隊', 'Bluebird Season', 'ソラノート', 'KIRAMEKI', 'ミッドナイト・ロケッツ', 'Lemonade Drop', 'ネオンガールズ'],
    sur: ['桜井', '水野', '高瀬', '白石', '月島', '星野', '藤咲', '天音'],
    given: ['ひかり', 'ユイ', '蒼', '美空', 'ハルカ', '湊', 'りん', '奏'],
  },
  enka: {
    place: ['大黒', '鶴見', '本牧', '根岸', '磯子', '汐入', '元町', '山下'],
    mid: ['ふ頭', '港', '川', '岬', '坂', '桟橋'],
    noun: ['夜しぐれ', '恋みれん', 'ひとり酒', '未練舟', '女の灯', '別れ雨', '波止場唄', '夢灯り', '涙割り', '情け川'],
    sur: ['大原', '北条', '三河', '若狭', '秋月', '白川', '氷見', '能登'],
    given: ['静香', '雪乃', '鉄平', '一郎', '美智代', '龍二', '千鶴', '勝'],
  },
};

export function songName(stationId, seed) {
  const r = R((seed ^ 0x9e3779b9) >>> 0);
  const N = NAMES[stationId] || NAMES.citypop;
  switch (stationId) {
    case 'eurobeat': {
      const title = r.pick(N.a) + ' ' + r.pick(N.b) + (r.chance(0.2) ? ' (Extended Mix)' : '');
      return { title, artist: r.pick(N.first) + ' ' + r.pick(N.last) };
    }
    case 'lofi':
      return { title: r.pick(N.a) + ' ' + r.pick(N.b), artist: r.pick(N.artist) };
    case 'jpop':
      return { title: r.pick(N.a) + r.pick(N.b), artist: r.chance(0.45) ? r.pick(N.group) : r.pick(N.sur) + r.pick(N.given) };
    case 'enka': {
      const title = r.chance(0.5) ? r.pick(N.place) + r.pick(N.noun) : r.pick(N.place) + r.pick(N.mid) + 'の' + r.pick(N.noun);
      return { title, artist: r.pick(N.sur) + ' ' + r.pick(N.given) };
    }
    default: {
      const title = r.pick(N.a) + r.pick(N.b);
      return { title, artist: r.chance(0.3) ? r.pick(N.band) : r.pick(N.sur) + ' ' + r.pick(N.given) };
    }
  }
}

// ───────────────────────── harmony ─────────────────────────
const RN = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };
const QUAL = {
  '': [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], M9: [0, 4, 7, 11, 14], '6': [0, 4, 7, 9], add9: [0, 4, 7, 14],
  m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], m6: [0, 3, 7, 9], '7': [0, 4, 7, 10], '9': [0, 4, 7, 10, 14],
  '7sus4': [0, 5, 7, 10], '9sus4': [0, 5, 7, 10, 14], sus4: [0, 5, 7], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8], '7b9': [0, 4, 7, 10, 13], mM7: [0, 3, 7, 11],
};
function parseChord(tok) {
  const m = /^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/.exec(tok);
  if (!m) return { root: 0, ivs: QUAL[''], bass: 0 };
  const root = RN[m[2].toUpperCase()] + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0);
  let q = m[3];
  let bass = root;
  const sl = q.indexOf('/');
  if (sl >= 0) { bass = parseChord(q.slice(sl + 1)).root; q = q.slice(0, sl); }
  const lower = m[2] === m[2].toLowerCase();
  if (lower && q === '') q = 'm';
  const ivs = QUAL[q] || (lower ? QUAL.m : QUAL['']);
  return { root: (root + 12) % 12, ivs, bass: (bass + 12) % 12 };
}
// "IVM7 V7 iiim7 vim7|V7" → [[{s,c}], ...] one entry per bar
function parseProg(str) {
  return str.trim().split(/\s+/).map((tok) => {
    const parts = tok.split('|');
    return parts.map((p, i) => ({ s: i * (16 / parts.length), c: parseChord(p) }));
  });
}
function chordAt(sec, b, s) {
  const slots = sec.chords[b % sec.chords.length];
  let c = slots[0].c;
  for (const sl of slots) if (sl.s <= s) c = sl.c;
  return c;
}
function chordPcs(key, c) { return c.ivs.map((i) => (key + c.root + i) % 12); }
function voicing(key, c, lo, hi, rootless) {
  let ivs = c.ivs;
  if (rootless && ivs.length >= 4) ivs = ivs.slice(1);
  let notes = ivs.map((i) => key + c.root + i);
  let mn = Math.min(...notes);
  while (mn < lo) { notes = notes.map((n) => n + 12); mn += 12; }
  while (mn >= lo + 12) { notes = notes.map((n) => n - 12); mn -= 12; }
  notes = notes.map((n) => (n > hi ? n - 12 : n));
  return [...new Set(notes)].sort((a, b) => a - b);
}
function bassNote(key, c, kind, next) {
  const base = 33 + (((key + c.bass - 33) % 12) + 12) % 12; // A1..G#2
  switch (kind) {
    case 'O': return base + 12;
    case '5': return base + 7;
    case '3': return base + c.ivs[1];
    case '7': return base + (c.ivs[3] !== undefined ? c.ivs[3] : 10);
    case 'A': {
      if (!next) return base + 7;
      let nr = 33 + (((key + next.bass - 33) % 12) + 12) % 12;
      if (nr - base > 6) nr -= 12; else if (base - nr > 6) nr += 12;
      return nr === base ? base + 7 : nr + (nr > base ? -1 : 1);
    }
    default: return base;
  }
}

// ───────────────────────── melody ─────────────────────────
const RH = {
  pop: { d: [2, 2, 2, 2, 4, 1, 3, 6, 4], rest: 0.14, start: [0, 0, 2, 1] },
  sabi: { d: [2, 2, 2, 4, 1, 3, 2, 4], rest: 0.08, start: [0, 0, 0, 2] },
  euro: { d: [2, 2, 2, 1, 1, 4, 2, 3], rest: 0.06, start: [0, 0] },
  riff: { d: [1, 1, 2, 1, 1, 2, 2], rest: 0.04, start: [0] },
  lofi: { d: [4, 2, 6, 8, 3, 2], rest: 0.35, start: [0, 2, 4] },
  enka: { d: [8, 4, 6, 12, 4, 2, 16, 2], rest: 0.1, start: [0, 4] },
  sham: { d: [2, 2, 1, 1, 2, 4], rest: 0.2, start: [0] },
};
function rhythm(r, style, total = 32, endRest = 2) {
  const P = RH[style] || RH.pop;
  let pos = r.pick(P.start);
  const out = [];
  while (pos < total - endRest) {
    let d = r.pick(P.d);
    if (pos + d > total - endRest) d = total - endRest - pos;
    if (d <= 0) break;
    if (out.length && r.f() < P.rest) { pos += d; continue; }
    out.push({ s: pos, len: d });
    pos += d;
  }
  if (!out.length) out.push({ s: 0, len: 8 });
  return out;
}
function nearestIdx(pool, midi) {
  let bi = 0, bd = 1e9;
  for (let i = 0; i < pool.length; i++) { const d = Math.abs(pool[i] - midi); if (d < bd) { bd = d; bi = i; } }
  return bi;
}
function snapIdx(pool, idx, pcs) {
  for (const o of [0, -1, 1, -2, 2, -3, 3]) {
    const j = idx + o;
    if (j >= 0 && j < pool.length && pcs.includes(pool[j] % 12)) return j;
  }
  return idx;
}
function pitchify(r, rh, sec, key, barOff, st) {
  const out = [];
  for (const n of rh) {
    const b = barOff + Math.floor(n.s / 16), s = n.s % 16;
    let step = r.pick([-1, -1, 1, 1, -2, 2, 0, 1, -1, 3, -3, 2, -2]);
    if (st.lastLeap) step = -Math.sign(st.lastLeap) * (r.f() < 0.7 ? 1 : 2);
    const dc = st.idx - st.c;
    if (Math.abs(dc) > 4 && Math.sign(step) === Math.sign(dc)) step = -step;
    st.lastLeap = Math.abs(step) >= 3 ? step : 0;
    st.idx = clamp(st.idx + step, 0, st.pool.length - 1);
    const strong = s % 8 === 0 || n.len >= 4;
    if (strong) st.idx = snapIdx(st.pool, st.idx, chordPcs(key, chordAt(sec, b, s)));
    out.push({ b, s, len: n.len, midi: st.pool[st.idx], v: strong ? 0.85 : 0.7 });
  }
  return out;
}
function resnap(notes, sec, key, pool) {
  return notes.map((n) => {
    if (n.s % 8 !== 0 && n.len < 4) return n;
    const j = snapIdx(pool, nearestIdx(pool, n.midi), chordPcs(key, chordAt(sec, n.b, n.s)));
    return { ...n, midi: pool[j] };
  });
}
const shiftBars = (notes, d) => notes.map((n) => ({ ...n, b: n.b + d }));

// 8-bar period: M (1-2), M' (3-4), M (5-6), cadence (7-8)
function genMelody(r, sec, key, opt) {
  const pool = [];
  for (let n = opt.lo; n <= opt.hi; n++) if (opt.scale.includes((((n - key) % 12) + 12) % 12)) pool.push(n);
  const c = nearestIdx(pool, opt.center);
  const st = { pool, idx: c, c, lastLeap: 0 };
  const rhA = rhythm(r, opt.style);
  const m1 = pitchify(r, rhA, sec, key, 0, st);
  let all = m1.slice();
  if (sec.len >= 4) {
    const firstHalf = m1.filter((n) => n.b === 0);
    const tail = rhythm(r, opt.style).filter((n) => n.s >= 16);
    const m2 = shiftBars(firstHalf, 2);
    if (m2.length) st.idx = nearestIdx(pool, m2[m2.length - 1].midi);
    all = all.concat(m2, pitchify(r, tail, sec, key, 2, st));
  }
  if (sec.len >= 8) {
    all = all.concat(resnap(shiftBars(m1, 4), sec, key, pool));
    const cad = pitchify(r, rhythm(r, opt.style, 32, 2), sec, key, 6, st);
    if (cad.length) {
      const last = cad[cad.length - 1];
      const tonic = [key % 12, (key + (opt.minor ? 3 : 4)) % 12, (key + 7) % 12];
      last.midi = pool[snapIdx(pool, nearestIdx(pool, last.midi), [key % 12])] ?? last.midi;
      if (!tonic.includes(last.midi % 12)) last.midi = pool[snapIdx(pool, nearestIdx(pool, last.midi), tonic)];
      const endStep = 30;
      last.len = Math.max(last.len, endStep - ((last.b - 6) * 16 + last.s));
      last.v = 0.9;
    }
    all = all.concat(cad);
  }
  const bars = [];
  for (let b = 0; b < sec.len; b++) bars.push([]);
  for (const n of all) if (n.b < sec.len) bars[n.b].push(n);
  return bars;
}

// ───────────────────────── song builders ─────────────────────────
const SCALE = {
  major: [0, 2, 4, 5, 7, 9, 11],
  yonaMajor: [0, 2, 4, 7, 9],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmMinor: [0, 2, 3, 5, 7, 8, 11],
  yonaMinor: [0, 2, 3, 7, 8],
  majPent9: [0, 2, 4, 7, 9, 11],
};
const PROGS = {
  citypop: {
    A: ['IM7 vim9 iim9 V7sus4', 'IVM7 iiim7 vim7 IM7', 'iim7 V7 IM7 vim7', 'IM9 iiim7 IVM7 V9sus4', 'vim7 IVM7 V7 IM7'],
    B: ['IVM7 V7 iiim7 vim7', 'iim7 iiim7 IVM7 V7sus4', 'bVIM7 bVII7 IM7 IM7', 'IVM7 IVm6 iiim7 VI7'],
    S: ['IVM7 V7 iiim7 vim7', 'IVM7 III7 vim7 v7|I7', 'IVM7 V7 iiim7 VI7', 'iim7 V7 IM7 VI7b9'],
  },
  eurobeat: {
    A: ['im bVI bVII im', 'im bVII bVI bVII', 'ivm bVII im im', 'im bIII bVII ivm'],
    B: ['bVI bVII im im', 'bVI bVII V V', 'ivm V im bVII', 'bIII bVII ivm V'],
    S: ['bVI bVII im im', 'im bVI bIII bVII', 'bVI bVII v im', 'ivm bVII bIII bVI'],
  },
  lofi: ['iim9 V9 IM9 vim9', 'IVM9 iiim7 vim9 V7sus4', 'IM9 iiim7 IVM9 ivm6', 'vim9 iim9 V7 IM9', 'IVM7 ivm7 iiim7 VI7b9', 'iim9 iiim7 IVM9 V9sus4'],
  jpop: { // 王道進行 / 丸サ進行 / 小室進行 — the J-POP staples
    A: ['IM7 V/VII vim7 iiim7', 'IVM7 V7 iiim7 vim7', 'I V vim IV', 'vim IV V I'],
    B: ['IVM7 V7 iiim7 vim7', 'iim7 iiim7 IVM7 V7sus4', 'IVM7 iiim7 iim7 V7'],
    S: ['IVM7 V7 iiim7 vim7', 'IVM7 III7 vim7 v7|I7', 'vim IV V I', 'IVM7 V7 iiim7 VI7'],
  },
  enka: {
    A: ['im ivm V7 im', 'im bVI ivm V7', 'ivm im V7 im', 'im im ivm V7'],
    B: ['bVI bVII bIII bIII', 'ivm im bVI V7', 'bIII bVII bVI V7', 'bVI bIII ivm V7'],
    S: ['ivm V7 im bVI', 'bVI V7 im im', 'ivm bVII bIII bVI|V7', 'ivm im bVI|V7 im'],
  },
};
function mkSec(name, prog, len, extra) {
  let bars = parseProg(prog);
  const chords = [];
  for (let i = 0; i < len; i++) chords.push(bars[i % bars.length]);
  return Object.assign({ name, len, chords, mel: null, bass: [], comp: [], energy: 0.7 }, extra || {});
}
function withTurn(prog, turn) { const t = prog.trim().split(/\s+/); return t.concat(t.slice(0, 3), [turn]).join(' '); }

const BASS = {
  slap: [
    [{ s: 0, k: 'R', l: 3 }, { s: 3, k: 'O', l: 1, pop: 1 }, { s: 6, k: 'R', l: 2 }, { s: 8, k: '5', l: 2 }, { s: 10, k: 'O', l: 1, pop: 1 }, { s: 11, k: 'R', l: 1 }, { s: 14, k: 'A', l: 2 }],
    [{ s: 0, k: 'R', l: 2 }, { s: 2, k: 'R', l: 1 }, { s: 4, k: 'O', l: 1, pop: 1 }, { s: 7, k: 'R', l: 1 }, { s: 8, k: '7', l: 2 }, { s: 10, k: '5', l: 2 }, { s: 12, k: 'O', l: 1, pop: 1 }, { s: 14, k: '5', l: 1 }, { s: 15, k: 'A', l: 1 }],
  ],
  soft: [
    [{ s: 0, k: 'R', l: 6 }, { s: 6, k: 'R', l: 2 }, { s: 8, k: '5', l: 4 }, { s: 12, k: 'O', l: 2 }, { s: 14, k: 'A', l: 2 }],
    [{ s: 0, k: 'R', l: 4 }, { s: 6, k: '5', l: 2 }, { s: 8, k: 'R', l: 4 }, { s: 13, k: '3', l: 1 }, { s: 14, k: 'A', l: 2 }],
  ],
  lofi: [
    [{ s: 0, k: 'R', l: 6 }, { s: 7, k: 'R', l: 2 }, { s: 10, k: '5', l: 4 }, { s: 14, k: 'A', l: 2 }],
    [{ s: 0, k: 'R', l: 8 }, { s: 10, k: '3', l: 2 }, { s: 12, k: '5', l: 4 }],
  ],
  enka: [
    [{ s: 0, k: 'R', l: 6 }, { s: 8, k: '5', l: 6 }],
    [{ s: 0, k: 'R', l: 4 }, { s: 4, k: '3', l: 4 }, { s: 8, k: '5', l: 4 }, { s: 12, k: 'A', l: 4 }],
  ],
};
const COMP = {
  pad: [{ s: 0, l: 16 }],
  push: [{ s: 0, l: 6 }, { s: 6, l: 4 }, { s: 10, l: 6 }],
  anticip: [{ s: 0, l: 3 }, { s: 3, l: 5 }, { s: 10, l: 2 }, { s: 14, l: 2 }],
  lofi: [{ s: 0, l: 14 }],
  lofi2: [{ s: 0, l: 6 }, { s: 6, l: 10 }],
  half: [{ s: 0, l: 8 }, { s: 8, l: 8 }],
};

function buildSong(stationId, seed) {
  const r = R(seed >>> 0);
  const meta = songName(stationId, seed);
  const song = { stationId, seed, ...meta, secs: {}, form: [], swing: 0 };
  const S = song.secs;
  if (stationId === 'eurobeat') {
    song.bpm = r.i(150, 158); song.key = 57 + r.i(0, 7); song.minor = true;
    const P = PROGS.eurobeat;
    const pS = r.pick(P.S);
    S.A = mkSec('A', withTurn(r.pick(P.A), 'bVII'), 8, { energy: 0.75, comp: COMP.pad, lead: 'euro' });
    S.B = mkSec('B', withTurn(r.pick(P.B), 'V'), 8, { energy: 0.8, comp: COMP.half, lead: 'euro' });
    S.S = mkSec('S', pS, 8, { energy: 1, lead: 'euro', dbl: true });
    S.intro = mkSec('intro', pS, 8, { energy: 0.95, lead: 'euroRiff' });
    S.riff = mkSec('riff', pS, 8, { energy: 0.95, lead: 'euroRiff' });
    S.outro = mkSec('outro', pS, 4, { energy: 0.8, lead: 'euroRiff', fade: true });
    const sc = SCALE.minor, k = song.key, lo = k + 7, hi = k + 26;
    S.A.mel = genMelody(r, S.A, k, { scale: sc, lo, hi, center: k + 15, style: 'euro', minor: true });
    S.B.mel = genMelody(r, S.B, k, { scale: SCALE.harmMinor, lo, hi, center: k + 17, style: 'euro', minor: true });
    S.S.mel = genMelody(r, S.S, k, { scale: sc, lo, hi: hi + 2, center: k + 20, style: 'sabi', minor: true });
    S.intro.mel = genMelody(r, S.intro, k, { scale: sc, lo: k + 12, hi: k + 31, center: k + 22, style: 'riff', minor: true });
    S.riff.mel = S.intro.mel; S.outro.mel = S.intro.mel.slice(0, 4);
    const fin = r.chance(0.6) ? r.pick([1, 2]) : 0;
    song.form = [['intro'], ['A'], ['B'], ['S'], ['riff'], ['A'], ['B'], ['S'], ['S', fin], ['outro', fin]];
  } else if (stationId === 'lofi') {
    song.bpm = r.i(72, 86); song.key = 57 + r.i(0, 9); song.swing = 0.14 + r.f() * 0.08;
    const p = r.pick(PROGS.lofi), p2 = r.f() < 0.5 ? p : r.pick(PROGS.lofi);
    const kick = r.pick([[0, 10], [0, 7, 10], [0, 9], [0, 3, 10]]);
    S.intro = mkSec('intro', p, 4, { energy: 0.6, comp: COMP.lofi, drums: false });
    S.A = mkSec('A', p, 8, { energy: 0.75, comp: r.pick([COMP.lofi, COMP.lofi2]), bass: r.pick(BASS.lofi), kick });
    S.B = mkSec('B', p2, 8, { energy: 0.8, comp: COMP.lofi, bass: r.pick(BASS.lofi), kick, lead: r.pick(['flute', 'bell', 'flute']) });
    S.outro = mkSec('outro', p, 4, { energy: 0.6, comp: COMP.lofi, drums: false, fade: true });
    S.B.mel = genMelody(r, S.B, song.key, { scale: SCALE.majPent9, lo: song.key + 9, hi: song.key + 26, center: song.key + 16, style: 'lofi' });
    song.form = r.chance(0.5)
      ? [['intro'], ['A'], ['B'], ['A'], ['B'], ['outro']]
      : [['intro'], ['A'], ['A'], ['B'], ['B'], ['A'], ['outro']];
  } else if (stationId === 'enka') {
    song.bpm = r.i(66, 78); song.key = 57 + r.i(0, 7); song.minor = true;
    const P = PROGS.enka;
    const pS = r.pick(P.S);
    S.A = mkSec('A', withTurn(r.pick(P.A), 'V7'), 8, { energy: 0.7, bass: BASS.enka[0], lead: 'enka' });
    S.B = mkSec('B', withTurn(r.pick(P.B), 'V7'), 8, { energy: 0.75, bass: r.pick(BASS.enka), lead: 'enka', pad: true });
    S.S = mkSec('S', withTurn(pS, 'V7'), 8, { energy: 0.9, bass: BASS.enka[1], lead: 'enka', pad: true });
    S.intro = mkSec('intro', withTurn(pS, 'V7'), 8, { energy: 0.7, bass: BASS.enka[0], lead: 'shaku', pad: true, sham: true });
    S.inter = mkSec('inter', 'ivm im V7 im', 4, { energy: 0.7, bass: BASS.enka[0], lead: 'shaku', sham: true });
    S.outro = mkSec('outro', 'ivm V7 im im', 4, { energy: 0.8, bass: BASS.enka[0], lead: 'shaku', pad: true, ending: true });
    const sc = SCALE.yonaMinor, k = song.key;
    const o = { scale: sc, lo: k + 3, hi: k + 22, minor: true, style: 'enka' };
    S.A.mel = genMelody(r, S.A, k, { ...o, center: k + 10 });
    S.B.mel = genMelody(r, S.B, k, { ...o, center: k + 14 });
    S.S.mel = genMelody(r, S.S, k, { ...o, center: k + 17, hi: k + 24 });
    S.intro.mel = genMelody(r, S.intro, k, { ...o, lo: k + 10, hi: k + 31, center: k + 22 });
    S.inter.mel = S.intro.mel.slice(4, 8).map((bar) => bar.map((n) => ({ ...n, b: n.b - 4 })));
    S.outro.mel = S.intro.mel.slice(0, 4);
    S.sham = genMelody(r, S.inter, k, { scale: sc, lo: k + 12, hi: k + 31, center: k + 19, style: 'sham', minor: true });
    song.form = [['intro'], ['A'], ['B'], ['S'], ['inter'], ['A'], ['B'], ['S'], ['outro']];
  } else if (stationId === 'jpop') {
    song.bpm = r.i(128, 144); song.key = 57 + r.i(0, 10);
    const P = PROGS.jpop;
    const pS = r.pick(P.S);
    S.A = mkSec('A', withTurn(r.pick(P.A), 'V7sus4|V7'), 8, { energy: 0.7, bass: r.pick(BASS.soft), comp: COMP.push, lead: 'synth', jp: true });
    S.B = mkSec('B', withTurn(r.pick(P.B), 'V7sus4'), 8, { energy: 0.82, bass: r.pick(BASS.soft), comp: COMP.anticip, gtr: true, lead: 'synth', jp: true });
    S.S = mkSec('S', pS, 8, { energy: 1, bass: r.pick(BASS.slap), comp: COMP.push, gtr: true, lead: 'bell', dbl: true, pad: true, jp: true });
    S.intro = mkSec('intro', pS, 4, { energy: 0.9, bass: BASS.slap[0], comp: COMP.pad, gtr: true, lead: 'bell', jp: true });
    S.inter = mkSec('inter', pS, 4, { energy: 0.9, bass: BASS.slap[1], comp: COMP.anticip, gtr: true, lead: 'brass', jp: true });
    S.outro = mkSec('outro', pS, 4, { energy: 0.85, bass: BASS.slap[0], comp: COMP.pad, lead: 'bell', fade: true, jp: true });
    const sc = SCALE.major, k = song.key;
    S.A.mel = genMelody(r, S.A, k, { scale: SCALE.yonaMajor, lo: k + 7, hi: k + 22, center: k + 14, style: 'pop' });
    S.B.mel = genMelody(r, S.B, k, { scale: sc, lo: k + 7, hi: k + 24, center: k + 16, style: 'pop' });
    S.S.mel = genMelody(r, S.S, k, { scale: sc, lo: k + 9, hi: k + 26, center: k + 19, style: 'sabi' });
    S.intro.mel = S.S.mel.slice(0, 4); S.outro.mel = S.S.mel.slice(4, 8);
    S.inter.mel = genMelody(r, S.inter, k, { scale: SCALE.yonaMajor, lo: k + 9, hi: k + 26, center: k + 18, style: 'pop' });
    // サビ始まり is common in J-POP; the last chorus modulates up (転調)
    const fin = r.chance(0.75) ? r.pick([1, 2, 2]) : 0;
    song.form = r.chance(0.35)
      ? [['S'], ['A'], ['B'], ['S'], ['inter'], ['A'], ['B'], ['S'], ['S', fin], ['outro', fin]]
      : [['intro'], ['A'], ['B'], ['S'], ['inter'], ['A'], ['B'], ['S'], ['S', fin], ['outro', fin]];
  } else {
    // city pop
    song.bpm = r.i(94, 114); song.key = 57 + r.i(0, 10);
    const P = PROGS.citypop;
    const pS = r.pick(P.S);
    S.A = mkSec('A', withTurn(r.pick(P.A), 'V7sus4|V7'), 8, { energy: 0.7, bass: r.pick(BASS.soft), comp: COMP.push, lead: 'synth' });
    S.B = mkSec('B', withTurn(r.pick(P.B), 'V7sus4'), 8, { energy: 0.8, bass: r.pick(BASS.slap), comp: COMP.anticip, gtr: true, lead: 'synth' });
    S.S = mkSec('S', pS, 8, { energy: 1, bass: r.pick(BASS.slap), comp: COMP.push, gtr: true, lead: 'synth', dbl: true, pad: true });
    S.intro = mkSec('intro', pS, 4, { energy: 0.85, bass: BASS.slap[0], comp: COMP.pad, lead: 'brass' });
    S.inter = mkSec('inter', pS, 4, { energy: 0.85, bass: BASS.slap[1], comp: COMP.anticip, gtr: true, lead: 'sax' });
    S.outro = mkSec('outro', pS, 4, { energy: 0.8, bass: BASS.slap[0], comp: COMP.pad, lead: 'brass', fade: true });
    const sc = SCALE.major, k = song.key;
    S.A.mel = genMelody(r, S.A, k, { scale: SCALE.yonaMajor, lo: k + 5, hi: k + 21, center: k + 12, style: 'pop' });
    S.B.mel = genMelody(r, S.B, k, { scale: sc, lo: k + 5, hi: k + 22, center: k + 14, style: 'pop' });
    S.S.mel = genMelody(r, S.S, k, { scale: sc, lo: k + 7, hi: k + 24, center: k + 17, style: 'sabi' });
    S.intro.mel = S.S.mel.slice(0, 4); S.outro.mel = S.S.mel.slice(0, 4);
    S.inter.mel = genMelody(r, S.inter, k, { scale: SCALE.yonaMajor, lo: k + 7, hi: k + 24, center: k + 16, style: 'pop' });
    const fin = r.chance(0.65) ? r.pick([1, 1, 2]) : 0; // 転調 for the last chorus
    song.form = [['intro'], ['A'], ['B'], ['S'], ['inter'], ['A'], ['B'], ['S'], ['S', fin], ['outro', fin]];
  }
  // expand form → bar list
  song.bars = [];
  for (const [name, tr = 0] of song.form) {
    const sec = S[name];
    for (let b = 0; b < sec.len; b++) song.bars.push({ sec, b, tr, first: b === 0, last: b === sec.len - 1 });
  }
  for (let i = 0; i < song.bars.length; i++) {
    const nb = song.bars[i + 1];
    song.bars[i].next = nb ? nb.sec.chords[nb.b % nb.sec.chords.length][0].c : null;
    song.bars[i].idx = i;
  }
  song.secStarts = song.bars.map((b, i) => (b.first && b.sec.name !== 'outro' ? i : -1)).filter((i) => i >= 0);
  return song;
}

// ───────────────────────── instruments ─────────────────────────
function tone(ctx, type, f, t) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  return o;
}
function noiseSrc(m, t, dur) {
  const s = m.ctx.createBufferSource();
  s.buffer = m.res.white;
  const off = Math.random() * (s.buffer.duration - dur - 0.05);
  s.start(t, Math.max(0, off), dur + 0.02);
  return s;
}
function ampEnv(g, t, a, peak, tau, end, rel) {
  const p = g.gain;
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + a);
  if (tau) p.setTargetAtTime(peak * 0.0001, t + a, tau);
  if (end !== undefined) {
    p.setTargetAtTime(0, end, rel || 0.05);
  }
}
function vibrato(m, t, oscs, rate, cents, delay, ramp) {
  const ctx = m.ctx;
  const l = ctx.createOscillator(), lg = ctx.createGain();
  l.frequency.value = rate;
  lg.gain.setValueAtTime(0, t);
  lg.gain.setValueAtTime(0, t + delay);
  lg.gain.linearRampToValueAtTime(cents, t + delay + ramp);
  l.connect(lg);
  for (const o of oscs) lg.connect(o.detune);
  l.start(t);
  return l;
}
function wow(m, oscs) { if (m.wow) for (const o of oscs) m.wow.connect(o.detune); }

const I = {
  kick(m, t, v, hard) {
    const ctx = m.ctx, o = tone(ctx, 'sine', hard ? 165 : 130, t), g = ctx.createGain();
    o.frequency.exponentialRampToValueAtTime(44, t + (hard ? 0.09 : 0.12));
    ampEnv(g, t, 0.002, v * 0.95, hard ? 0.12 : 0.16);
    o.connect(g); g.connect(m.bus.drum);
    o.start(t); o.stop(t + 0.7);
    const n = noiseSrc(m, t, 0.012), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 2500;
    ampEnv(ng, t, 0.001, v * 0.25, 0.004);
    n.connect(hp); hp.connect(ng); ng.connect(m.bus.drum);
  },
  snare(m, t, v, gated, soft) {
    const ctx = m.ctx;
    const n = noiseSrc(m, t, 0.3), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = soft ? 2600 : 1900; bp.Q.value = 0.7;
    ampEnv(ng, t, 0.001, v * 0.55, soft ? 0.09 : 0.06);
    n.connect(bp); bp.connect(ng); ng.connect(m.bus.drum);
    const o = tone(ctx, 'triangle', 200, t), og = ctx.createGain();
    o.frequency.exponentialRampToValueAtTime(155, t + 0.05);
    ampEnv(og, t, 0.001, v * 0.5, 0.035);
    o.connect(og); og.connect(m.bus.drum); o.start(t); o.stop(t + 0.3);
    if (gated && m.send.gate) { const s = ctx.createGain(); s.gain.value = 0.9; ng.connect(s); s.connect(m.send.gate); }
    else if (m.send.hall) { const s = ctx.createGain(); s.gain.value = 0.18; ng.connect(s); s.connect(m.send.hall); }
  },
  clap(m, t, v) {
    const ctx = m.ctx, bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.1;
    const p = g.gain; p.setValueAtTime(0, t);
    for (let i = 0; i < 3; i++) { p.setValueAtTime(v * 0.6, t + i * 0.011); p.setTargetAtTime(v * 0.1, t + i * 0.011 + 0.001, 0.004); }
    p.setValueAtTime(v * 0.45, t + 0.034); p.setTargetAtTime(0.0001, t + 0.034, 0.05);
    const n = noiseSrc(m, t, 0.35);
    n.connect(bp); bp.connect(g); g.connect(m.bus.drum);
    if (m.send.hall) { const s = ctx.createGain(); s.gain.value = 0.25; g.connect(s); s.connect(m.send.hall); }
  },
  hat(m, t, v, open) {
    const ctx = m.ctx, n = noiseSrc(m, t, open ? 0.4 : 0.08), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 7200;
    ampEnv(g, t, 0.001, v * 0.6, open ? 0.12 : 0.018);
    n.connect(hp); hp.connect(g); g.connect(m.bus.hat);
  },
  crash(m, t, v) {
    const ctx = m.ctx, n = noiseSrc(m, t, 2.2), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 4200;
    ampEnv(g, t, 0.002, v * 0.4, 0.55);
    n.connect(hp); hp.connect(g); g.connect(m.bus.hat);
  },
  tom(m, t, f, v) {
    const ctx = m.ctx, o = tone(ctx, 'sine', f * 1.5, t), g = ctx.createGain();
    o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    ampEnv(g, t, 0.002, v * 0.7, 0.12);
    o.connect(g); g.connect(m.bus.drum); o.start(t); o.stop(t + 0.6);
  },
  brush(m, t, v) {
    const ctx = m.ctx, n = noiseSrc(m, t, 0.3), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.6;
    ampEnv(g, t, 0.01, v * 0.35, 0.07);
    n.connect(bp); bp.connect(g); g.connect(m.bus.drum);
  },
  bass(m, t, midi, dur, v, style) {
    const ctx = m.ctx, f = mtof(midi), end = t + dur;
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass';
    let oscs;
    if (style === 'euro') {
      oscs = [tone(ctx, 'sawtooth', f, t), tone(ctx, 'sawtooth', f, t)];
      oscs[0].detune.value = -7; oscs[1].detune.value = 7;
      lp.Q.value = 5; lp.frequency.setValueAtTime(2400, t); lp.frequency.setTargetAtTime(280, t, 0.06);
      ampEnv(g, t, 0.003, v * 0.32, 0, end, 0.03);
    } else if (style === 'sub' || style === 'enka') {
      oscs = [tone(ctx, 'triangle', f, t), tone(ctx, 'sine', f, t)];
      lp.frequency.value = style === 'enka' ? 900 : 650; lp.Q.value = 0.5;
      ampEnv(g, t, 0.008, v * 0.5, style === 'enka' ? 0.6 : 0, end, 0.08);
    } else {
      // slap / pop (city pop)
      const pop = style === 'pop';
      oscs = [tone(ctx, 'sawtooth', f, t), tone(ctx, 'square', f, t)];
      oscs[1].detune.value = 4;
      lp.Q.value = pop ? 6 : 3;
      lp.frequency.setValueAtTime(pop ? 5200 : 3000, t);
      lp.frequency.setTargetAtTime(pop ? 700 : 380, t, pop ? 0.05 : 0.08);
      ampEnv(g, t, 0.002, v * 0.3, 0.5, end, 0.04);
      const n = noiseSrc(m, t, 0.02), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
      hp.type = 'bandpass'; hp.frequency.value = pop ? 3500 : 1600; hp.Q.value = 1;
      ampEnv(ng, t, 0.001, v * (pop ? 0.3 : 0.12), 0.006);
      n.connect(hp); hp.connect(ng); ng.connect(m.bus.bass);
    }
    for (const o of oscs) { o.connect(lp); o.start(t); o.stop(end + 0.4); }
    wow(m, oscs);
    lp.connect(g); g.connect(m.bus.bass);
  },
  ep(m, t, midi, dur, v, dark) {
    // FM electric piano (DX-style tine)
    const ctx = m.ctx, f = mtof(midi), end = t + dur;
    const car = tone(ctx, 'sine', f, t), mod = tone(ctx, 'sine', f, t), mg = ctx.createGain(), g = ctx.createGain();
    const idx = dark ? 1.1 : 2.2;
    mg.gain.setValueAtTime(f * idx * (0.6 + v * 0.6), t);
    mg.gain.setTargetAtTime(f * (dark ? 0.12 : 0.25), t, dark ? 0.12 : 0.2);
    mod.connect(mg); mg.connect(car.frequency);
    const oscs = [car, mod];
    if (!dark) {
      const tine = tone(ctx, 'sine', f * 14, t), tg = ctx.createGain();
      tg.gain.setValueAtTime(f * 0.6 * v, t); tg.gain.setTargetAtTime(0, t, 0.02);
      tine.connect(tg); tg.connect(car.frequency); tine.start(t); tine.stop(t + 0.2);
    }
    const p = g.gain;
    p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * 0.16, t + 0.004);
    p.setTargetAtTime(v * 0.06, t + 0.004, 0.6);
    p.setTargetAtTime(0, end, 0.12);
    car.connect(g); g.connect(m.bus.chord);
    for (const o of oscs) { o.start(t); o.stop(end + 0.7); }
    wow(m, oscs);
  },
  gtr(m, t, notes, v) {
    // 16-beat muted "cutting" guitar
    const ctx = m.ctx, bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 1.2;
    ampEnv(g, t, 0.002, v * 0.08, 0.03);
    for (const n of notes) {
      const o = tone(ctx, 'sawtooth', mtof(n), t);
      o.connect(bp); o.start(t); o.stop(t + 0.2);
    }
    bp.connect(g); g.connect(m.bus.gtr);
  },
  nylon(m, t, notes, v) {
    const ctx = m.ctx, lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.setTargetAtTime(900, t, 0.08);
    ampEnv(g, t, 0.002, v * 0.1, 0.18);
    notes.forEach((n, i) => {
      const o = tone(ctx, 'triangle', mtof(n), t + i * 0.012);
      o.connect(lp); o.start(t + i * 0.012); o.stop(t + 1);
    });
    lp.connect(g); g.connect(m.bus.gtr);
  },
  stab(m, t, notes, dur, v) {
    const ctx = m.ctx, lp = ctx.createBiquadFilter(), g = ctx.createGain(), end = t + dur;
    lp.type = 'lowpass'; lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(5200, t); lp.frequency.setTargetAtTime(1600, t, 0.09);
    ampEnv(g, t, 0.003, v * 0.07, 0, end, 0.06);
    for (const n of notes) for (const d of [-9, 9]) {
      const o = tone(ctx, 'sawtooth', mtof(n), t); o.detune.value = d;
      o.connect(lp); o.start(t); o.stop(end + 0.4);
    }
    lp.connect(g); g.connect(m.bus.chord);
    if (m.send.hall) { const s = ctx.createGain(); s.gain.value = 0.3; g.connect(s); s.connect(m.send.hall); }
  },
  brass(m, t, notes, dur, v) {
    const ctx = m.ctx, lp = ctx.createBiquadFilter(), g = ctx.createGain(), end = t + dur;
    lp.type = 'lowpass'; lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(3600, t + 0.05); lp.frequency.setTargetAtTime(2200, t + 0.05, 0.2);
    ampEnv(g, t, 0.02, v * 0.07, 0, end, 0.08);
    for (const n of notes) for (const d of [-10, 0, 10]) {
      const o = tone(ctx, 'sawtooth', mtof(n), t); o.detune.value = d;
      o.connect(lp); o.start(t); o.stop(end + 0.5);
    }
    lp.connect(g); g.connect(m.bus.chord);
    if (m.send.hall) { const s = ctx.createGain(); s.gain.value = 0.35; g.connect(s); s.connect(m.send.hall); }
  },
  pad(m, t, notes, dur, v) {
    const ctx = m.ctx, lp = ctx.createBiquadFilter(), g = ctx.createGain(), end = t + dur;
    lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.4;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 0.045, t + Math.min(0.35, dur * 0.3));
    g.gain.setTargetAtTime(0, end, 0.25);
    const oscs = [];
    for (const n of notes) for (const d of [-11, 11]) {
      const o = tone(ctx, 'sawtooth', mtof(n), t); o.detune.value = d;
      o.connect(lp); o.start(t); o.stop(end + 1.4); oscs.push(o);
    }
    wow(m, oscs);
    lp.connect(g); g.connect(m.bus.pad);
    if (m.send.hall) { const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(m.send.hall); }
  },
  pluck(m, t, midi, dur, v) {
    const ctx = m.ctx, o = tone(ctx, 'square', mtof(midi), t), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(4200, t); lp.frequency.setTargetAtTime(700, t, 0.05);
    ampEnv(g, t, 0.002, v * 0.09, 0.09);
    o.connect(lp); lp.connect(g); g.connect(m.bus.arp);
    o.start(t); o.stop(t + dur + 0.3);
  },
  shamisen(m, t, midi, v) {
    const ctx = m.ctx, f = mtof(midi);
    const o = tone(ctx, 'sawtooth', f * 1.012, t), o2 = tone(ctx, 'square', f, t);
    o.frequency.setTargetAtTime(f, t, 0.015);
    const ws = ctx.createWaveShaper(); ws.curve = m.res.sawari; // "sawari" buzz
    const lp = ctx.createBiquadFilter(), pk = ctx.createBiquadFilter(), g = ctx.createGain(), og2 = ctx.createGain();
    og2.gain.value = 0.3;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(6500, t); lp.frequency.setTargetAtTime(1100, t, 0.07);
    pk.type = 'peaking'; pk.frequency.value = 2400; pk.Q.value = 2; pk.gain.value = 6;
    ampEnv(g, t, 0.001, v * 0.12, 0.16);
    o.connect(ws); o2.connect(og2); og2.connect(ws); ws.connect(lp); lp.connect(pk); pk.connect(g); g.connect(m.bus.lead2);
    o.start(t); o2.start(t); o.stop(t + 1.1); o2.stop(t + 1.1);
    // bachi (plectrum) click
    const n = noiseSrc(m, t, 0.02), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 2500;
    ampEnv(ng, t, 0.001, v * 0.08, 0.006);
    n.connect(hp); hp.connect(ng); ng.connect(m.bus.lead2);
    if (m.send.hall) { const s = ctx.createGain(); s.gain.value = 0.3; g.connect(s); s.connect(m.send.hall); }
  },
  lead(m, t, midi, dur, v, style) {
    const ctx = m.ctx, f = mtof(midi), end = t + dur;
    const g = ctx.createGain(), out = ctx.createBiquadFilter();
    let oscs = [], extra = null, hall = 0.25, peak = 0.1, a = 0.01;
    out.type = 'lowpass';
    switch (style) {
      case 'euro': case 'euroRiff': {
        oscs = [tone(ctx, 'sawtooth', f, t), tone(ctx, 'sawtooth', f, t), tone(ctx, 'square', f / 2, t)];
        oscs[0].detune.value = -12; oscs[1].detune.value = 12;
        const sg = ctx.createGain(); sg.gain.value = 0.35; extra = sg;
        out.frequency.value = style === 'euroRiff' ? 5200 : 4200; out.Q.value = 2.5;
        peak = 0.075; hall = 0.32; a = 0.004;
        if (dur > 0.25) vibrato(m, t, oscs, 6, 16, 0.18, 0.12);
        break;
      }
      case 'brass': {
        oscs = [tone(ctx, 'sawtooth', f, t), tone(ctx, 'sawtooth', f, t)];
        oscs[0].detune.value = -8; oscs[1].detune.value = 8;
        out.frequency.setValueAtTime(900, t); out.frequency.linearRampToValueAtTime(3800, t + 0.06); out.frequency.setTargetAtTime(2600, t + 0.06, 0.2);
        peak = 0.08; a = 0.025; hall = 0.35;
        if (dur > 0.3) vibrato(m, t, oscs, 5.2, 12, 0.25, 0.2);
        break;
      }
      case 'sax': {
        oscs = [tone(ctx, 'sawtooth', f, t)];
        oscs[0].detune.setValueAtTime(-45, t); oscs[0].detune.linearRampToValueAtTime(0, t + 0.06);
        out.type = 'bandpass'; out.frequency.value = 1300; out.Q.value = 0.9;
        peak = 0.2; a = 0.03; hall = 0.35;
        if (dur > 0.3) vibrato(m, t, oscs, 5, 22, 0.2, 0.25);
        break;
      }
      case 'flute': {
        oscs = [tone(ctx, 'sine', f, t), tone(ctx, 'triangle', f * 2, t)];
        out.frequency.value = 3000;
        peak = 0.1; a = 0.05; hall = 0.4;
        vibrato(m, t, oscs, 4.6, 10, 0.25, 0.3);
        break;
      }
      case 'bell': {
        const car = tone(ctx, 'sine', f, t), mod = tone(ctx, 'sine', f * 3.5, t), mg = ctx.createGain();
        mg.gain.setValueAtTime(f * 1.2, t); mg.gain.setTargetAtTime(f * 0.05, t, 0.25);
        mod.connect(mg); mg.connect(car.frequency);
        mod.start(t); mod.stop(end + 1.2);
        oscs = [car]; out.frequency.value = 6000; peak = 0.12; a = 0.003; hall = 0.45;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * peak, t + a);
        g.gain.setTargetAtTime(0.0001, t + a, 0.5);
        car.connect(out); out.connect(g); g.connect(m.bus.lead);
        car.start(t); car.stop(end + 1.2); wow(m, [car, mod]);
        if (m.send.hall) { const s = ctx.createGain(); s.gain.value = hall; g.connect(s); s.connect(m.send.hall); }
        return;
      }
      case 'shaku': case 'enka': {
        // shakuhachi-like breathy tone / enka "vocal" line with kobushi ornaments
        const shaku = style === 'shaku';
        oscs = shaku ? [tone(ctx, 'sine', f, t), tone(ctx, 'triangle', f * 2, t)]
                     : [tone(ctx, 'sawtooth', f, t), tone(ctx, 'triangle', f, t)];
        for (const o of oscs) {
          o.detune.setValueAtTime(-160, t); // scoop up from below
          o.detune.setTargetAtTime(0, t, shaku ? 0.05 : 0.04);
          if (dur > 0.9 && Math.random() < 0.55) { // kobushi: quick turn
            const k = t + dur * 0.55;
            o.detune.setValueAtTime(0, k); o.detune.linearRampToValueAtTime(-110, k + 0.06); o.detune.linearRampToValueAtTime(0, k + 0.14);
          }
        }
        out.type = shaku ? 'lowpass' : 'bandpass';
        out.frequency.value = shaku ? 4200 : 1500; out.Q.value = shaku ? 0.5 : 0.7;
        peak = shaku ? 0.17 : 0.13; a = shaku ? 0.09 : 0.05; hall = 0.45;
        vibrato(m, t, oscs, shaku ? 5.4 : 5.8, shaku ? 28 : 34, Math.min(0.5, dur * 0.4), dur * 0.35);
        // breath
        const n = noiseSrc(m, t, dur + 0.3), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
        bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = shaku ? 3 : 6;
        ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(v * (shaku ? 0.2 : 0.05), t + 0.04);
        ng.gain.setTargetAtTime(v * (shaku ? 0.07 : 0.02), t + 0.05, 0.15); ng.gain.setTargetAtTime(0, end, 0.08);
        n.connect(bp); bp.connect(ng); ng.connect(m.bus.lead);
        if (!shaku) { const f2 = ctx.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 2800; f2.Q.value = 1.5; f2.gain.value = 5; extra = f2; }
        break;
      }
      default: { // 'synth' city-pop lead
        oscs = [tone(ctx, 'square', f, t), tone(ctx, 'sawtooth', f, t)];
        oscs[1].detune.value = 7;
        out.frequency.value = 3000; out.Q.value = 1;
        peak = 0.07; a = 0.008; hall = 0.3;
        if (dur > 0.3) vibrato(m, t, oscs, 5.5, 13, 0.22, 0.2);
      }
    }
    if (style === 'euro' || style === 'euroRiff') {
      oscs[0].connect(out); oscs[1].connect(out); oscs[2].connect(extra); extra.connect(out);
    } else if (extra) {
      for (const o of oscs) o.connect(extra); extra.connect(out);
    } else for (const o of oscs) o.connect(out);
    const p = g.gain;
    p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * peak, t + a);
    p.setTargetAtTime(v * peak * 0.8, t + a, 0.3);
    p.setTargetAtTime(0, end, style === 'shaku' || style === 'enka' ? 0.09 : 0.05);
    out.connect(g); g.connect(m.bus.lead);
    for (const o of oscs) { o.start(t); o.stop(end + 0.6); }
    wow(m, oscs);
    if (m.send.hall) { const s = ctx.createGain(); s.gain.value = hall; g.connect(s); s.connect(m.send.hall); }
  },
};

// ───────────────────────── per-genre step players ─────────────────────────
function melAt(sec, b, s) { const bar = sec.mel && sec.mel[b]; return bar ? bar.filter((n) => n.s === s) : []; }

const PLAY = {
  citypop(m, bi, s, t) {
    const sec = bi.sec, n = sec.name, b = bi.b, k = m.song.key + bi.tr, sd = m.sd, E = sec.energy * (sec.fade ? 1 - b / sec.len * 0.6 : 1);
    const ch = chordAt(sec, b, s);
    const drums = !(n === 'intro' && b === 0 && s < 12);
    if (drums) {
      if (s === 0 && bi.first && n !== 'A') I.crash(m, t, 0.5);
      if (s === 0 || s === 8 || (E > 0.9 && s === 10 && b % 2 === 1) || (n === 'B' && s === 7)) I.kick(m, t, 0.85 * E + 0.1);
      if (s === 4 || s === 12) I.snare(m, t, 0.6 * E + 0.1, true);
      if (s % 2 === 0) I.hat(m, t, s % 4 === 2 ? 0.2 : 0.12);
      else if (E > 0.75) I.hat(m, t, 0.05);
      if (s === 14 && E > 0.9) I.hat(m, t, 0.12, true);
      if (bi.last && s >= 12 && (n === 'B' || n === 'intro' || n === 'inter')) I.tom(m, t, 220 - (s - 12) * 30, 0.5);
    }
    if (n === 'intro' && b === 0 && s < 12) { if (s === 0) for (const x of voicing(k, ch, 55, 76, true)) I.ep(m, t, x, sd * 12, 0.5); }
    else {
      for (const p of sec.bass) if (p.s === s) I.bass(m, t, bassNote(k, ch, p.k, bi.next), p.l * sd * 0.95, 0.85, p.pop ? 'pop' : 'slap');
      for (const p of sec.comp) if (p.s === s || (s === 8 && sec.chords[b % sec.chords.length].length > 1 && p.s < 8 && p.s + p.l > 8))
        for (const x of voicing(k, ch, 55, 76, true)) I.ep(m, t, x, Math.min(p.l, 16 - s) * sd * 0.95, 0.5 * (0.7 + 0.3 * E));
      if (sec.gtr && s % 4 === 2) I.gtr(m, t, voicing(k, ch, 64, 79, false), 0.7 + 0.3 * (s === 6 || s === 14));
      if (sec.pad && s === 0) I.pad(m, t, voicing(k, ch, 60, 79, false), sd * 16, 0.7);
      if ((n === 'S' && bi.last) || (n === 'intro' && bi.last)) { if (s === 0 || s === 3 || s === 6) I.brass(m, t, voicing(k, ch, 62, 81, false), sd * 2, 0.8); }
    }
    for (const x of melAt(sec, b, s)) {
      I.lead(m, t, x.midi + bi.tr, x.len * sd, x.v * (0.6 + 0.4 * E), sec.lead);
      if (sec.dbl) I.lead(m, t, x.midi + bi.tr - 12, x.len * sd, x.v * 0.45, 'brass');
    }
  },
  jpop(m, bi, s, t) {
    // bright 8-beat band arrangement on top of the city-pop instruments: driving kick, 16th hats, strummed guitar
    const sec = bi.sec, n = sec.name, b = bi.b, k = m.song.key + bi.tr, sd = m.sd, E = sec.energy * (sec.fade ? 1 - b / sec.len * 0.6 : 1);
    const ch = chordAt(sec, b, s);
    if (s === 0 && bi.first) I.crash(m, t, 0.55);
    if (s === 0 || s === 6 || s === 8 || (n === 'S' && (s === 10 || s === 14))) I.kick(m, t, 0.8 * E + 0.15, n === 'S');
    if (s === 4 || s === 12) { I.snare(m, t, 0.65 * E + 0.15, true); if (n === 'S') I.clap(m, t, 0.35); }
    I.hat(m, t, s % 4 === 2 ? 0.18 : s % 2 ? 0.07 : 0.12, s === 14 && E > 0.9);
    if (bi.last && s >= 8 && (n === 'B' || n === 'intro')) { if (s % 2 === 0) I.snare(m, t, 0.25 + (s - 8) * 0.06, false); }
    for (const p of sec.bass) if (p.s === s) I.bass(m, t, bassNote(k, ch, p.k, bi.next), p.l * sd * 0.95, 0.85, p.pop ? 'pop' : 'slap');
    if (n !== 'B' && s % 2 === 0) I.bass(m, t, bassNote(k, ch, s % 4 === 0 ? 'R' : 'O', bi.next), sd * 0.9, 0.45, 'slap');
    for (const p of sec.comp) if (p.s === s) for (const x of voicing(k, ch, 57, 77, false)) I.ep(m, t, x, Math.min(p.l, 16 - s) * sd * 0.9, 0.42 * (0.7 + 0.3 * E));
    if (sec.gtr && (s % 2 === 0)) I.gtr(m, t, voicing(k, ch, 64, 81, false), (s % 4 === 0 ? 0.75 : 0.5) * (0.7 + 0.3 * E));
    if (sec.pad && s === 0) I.pad(m, t, voicing(k, ch, 60, 81, false), sd * 16, 0.65);
    if (n === 'S' || n === 'intro') { const ar = voicing(k, ch, 72, 88, false); if (s % 2 === 1) I.pluck(m, t, ar[(s >> 1) % ar.length], sd, 0.35); }
    for (const x of melAt(sec, b, s)) {
      I.lead(m, t, x.midi + bi.tr, x.len * sd, x.v * (0.65 + 0.35 * E), sec.lead);
      if (sec.dbl) I.lead(m, t, x.midi + bi.tr + 12, x.len * sd, x.v * 0.3, 'synth');
    }
  },
  eurobeat(m, bi, s, t) {
    const sec = bi.sec, n = sec.name, b = bi.b, k = m.song.key + bi.tr, sd = m.sd, E = sec.energy;
    const ch = chordAt(sec, b, s);
    const breakdown = n === 'intro' && b < 2;
    if (!breakdown) {
      if (s % 4 === 0) I.kick(m, t, 0.9, true);
      if (s === 4 || s === 12) { I.clap(m, t, 0.7); I.snare(m, t, 0.35, false); }
      if (s % 4 === 2) I.hat(m, t, 0.18, true); else I.hat(m, t, s % 2 ? 0.06 : 0.1);
      if (s === 0 && bi.first) I.crash(m, t, 0.55);
      if (bi.last && n === 'B' && s >= 8 && s % 2 === 0) I.snare(m, t, 0.2 + s * 0.03, false);
    } else if (s === 0) I.pad(m, t, voicing(k, ch, 57, 76, false), sd * 16, 0.8);
    if (!breakdown || b === 1) {
      if (s % 2 === 0) I.bass(m, t, bassNote(k, ch, s % 4 === 0 ? 'R' : 'O', bi.next), sd * 1.6, 0.85, 'euro');
    }
    if (n !== 'B') {
      const ar = voicing(k, ch, 64, 84, false);
      const seq = ar.concat(ar.slice(1, -1).reverse());
      I.pluck(m, t, seq[s % seq.length] + (s >= 8 && n === 'S' ? 12 : 0), sd, s % 4 === 0 ? 0.9 : 0.6);
    }
    if (n === 'S' || n === 'riff') { if ([0, 3, 6, 10, 12].includes(s)) I.stab(m, t, voicing(k, ch, 60, 79, false), sd * 1.6, 0.8); }
    else if (n === 'B') { if (s === 0 || s === 6 || s === 8 || s === 14) I.stab(m, t, voicing(k, ch, 60, 79, false), sd * (s === 0 || s === 8 ? 3 : 1.5), 0.7); }
    else if (s === 0) I.pad(m, t, voicing(k, ch, 57, 76, false), sd * 16, 0.6);
    for (const x of melAt(sec, b, s)) {
      I.lead(m, t, x.midi + bi.tr, x.len * sd, x.v * (0.7 + 0.3 * E), sec.lead);
      if (sec.dbl) I.lead(m, t, x.midi + bi.tr + 12, x.len * sd, x.v * 0.4, 'euro');
    }
  },
  lofi(m, bi, s, t) {
    const sec = bi.sec, b = bi.b, k = m.song.key + bi.tr, sd = m.sd;
    const ch = chordAt(sec, b, s);
    const hum = () => t + (Math.random() - 0.5) * 0.012;
    if (sec.drums !== false) {
      if (sec.kick.includes(s)) I.kick(m, hum(), s === 0 ? 0.8 : 0.6);
      if (s === 4 || s === 12) I.snare(m, hum() + 0.01, 0.45, false, true);
      if (s % 2 === 0 && Math.random() > 0.1) I.hat(m, hum(), 0.06 + Math.random() * 0.04);
      if (s === 15 && Math.random() < 0.2) I.hat(m, hum(), 0.05, true);
    }
    for (const p of sec.bass) if (p.s === s) I.bass(m, hum(), bassNote(k, ch, p.k, bi.next), p.l * sd * 0.9, 0.85, 'sub');
    for (const p of sec.comp) if (p.s === s) {
      const vs = voicing(k, ch, 53, 74, true);
      vs.forEach((x, i) => I.ep(m, t + i * 0.008, x, p.l * sd, 0.55, true));
    }
    for (const x of melAt(sec, b, s)) I.lead(m, hum(), x.midi + bi.tr, x.len * sd, x.v * 0.8, sec.lead);
  },
  enka(m, bi, s, t) {
    const sec = bi.sec, n = sec.name, b = bi.b, k = m.song.key + bi.tr, sd = m.sd, E = sec.energy;
    const ch = chordAt(sec, b, s);
    const ending = sec.ending && bi.last;
    if (ending) {
      if (s === 0) {
        I.pad(m, t, voicing(k, ch, 55, 79, false), sd * 16, 1);
        I.bass(m, t, bassNote(k, ch, 'R'), sd * 14, 0.9, 'enka');
        I.kick(m, t, 0.6); I.crash(m, t, 0.35);
        I.shamisen(m, t, k + 12, 0.9); I.shamisen(m, t + 0.02, k + 19, 0.8);
      }
      return;
    }
    const drums = n !== 'intro' || b >= 4;
    if (drums) {
      if (s === 0 || s === 8) I.kick(m, t, 0.55);
      if (s === 4 || s === 12) I.brush(m, t, 0.5 + 0.2 * E);
      if (s % 2 === 0) I.hat(m, t, 0.04);
      if (bi.last && n === 'S' && s >= 8 && s % 2 === 0) I.tom(m, t, 200 - s * 6, 0.45);
    }
    for (const p of sec.bass) if (p.s === s && (drums || s === 0)) I.bass(m, t, bassNote(k, ch, p.k, bi.next), p.l * sd * 0.9, 0.8, 'enka');
    if (s === 4 || s === 12) I.nylon(m, t, voicing(k, ch, 57, 72, false), 0.7 + 0.2 * E);
    if (sec.pad && s === 0) I.pad(m, t, voicing(k, ch, 60, 79, false), sd * 16, 0.7);
    // shamisen: intro/interlude riffs, and fills in the gaps of the vocal line
    if (m.song.secs.sham) {
      const shamBar = m.song.secs.sham[b % 4];
      const fill = (n === 'A' || n === 'B' || n === 'S') && (b === 3 || b === 7) && s >= 8;
      if (sec.sham || fill) for (const x of shamBar) if (x.s === s) I.shamisen(m, t, x.midi + bi.tr, 0.8);
    }
    for (const x of melAt(sec, b, s)) I.lead(m, t, x.midi + bi.tr, x.len * sd, x.v * (0.7 + 0.3 * E), sec.lead);
  },
};

// ───────────────────────── sequencer ─────────────────────────
// Output graph per station: instrument buses → station gain → dest.
// Lookahead scheduling: tick() schedules all 16th-steps up to `ahead` seconds in the future.
export class MusicEngine {
  constructor(ctx, dest, res) {
    this.ctx = ctx; this.dest = dest; this.res = res;
    this.playing = false;
    this.song = null;
    this.onSong = null;
    this.ahead = 0.3;
    // shared reverbs
    this.hall = ctx.createConvolver(); this.hall.buffer = res.hallIR;
    this.hallRet = ctx.createGain(); this.hallRet.gain.value = 0.55;
    this.hall.connect(this.hallRet); this.hallRet.connect(dest);
    this.gate = ctx.createConvolver(); this.gate.buffer = res.gateIR;
    this.gateRet = ctx.createGain(); this.gateRet.gain.value = 0.5;
    this.gate.connect(this.gateRet); this.gateRet.connect(dest);
  }
  _graph(stationId) {
    const ctx = this.ctx;
    const g = (v) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    const pan = (v) => { if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = v; return p; } return g(1); };
    const out = g(0);
    out.gain.setValueAtTime(0, ctx.currentTime);
    out.gain.linearRampToValueAtTime(stationId === 'lofi' ? 0.62 : stationId === 'enka' ? 0.85 : 1, ctx.currentTime + 0.15);
    let sink = out;
    this.extra = [];
    if (stationId === 'lofi') {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600; lp.Q.value = 0.3;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
      lp.connect(hp); hp.connect(out); sink = lp;
      // vinyl crackle
      const cr = ctx.createBufferSource(); cr.buffer = this.res.crackle; cr.loop = true;
      const cg = g(0.5); cr.connect(cg); cg.connect(out); cr.start(ctx.currentTime);
      // wow & flutter (shared LFO into every oscillator's detune)
      const w1 = ctx.createOscillator(); w1.frequency.value = 0.45;
      const w2 = ctx.createOscillator(); w2.frequency.value = 5.5;
      const wg = g(9), wg2 = g(2.5);
      w1.connect(wg); w2.connect(wg2); wg2.connect(wg);
      w1.start(); w2.start();
      this.wow = wg;
      this.extra.push(cr, w1, w2);
    } else this.wow = null;
    const mk = (v, p) => { const a = g(v), b = pan(p); a.connect(b); b.connect(sink); return a; };
    const lvl = {
      citypop: { drum: 0.8, hat: 0.6, bass: 0.9, chord: 0.8, gtr: 0.7, lead: 0.85, lead2: 0.8, arp: 0.6, pad: 0.6 },
      eurobeat: { drum: 0.8, hat: 0.55, bass: 0.85, chord: 0.7, gtr: 0.6, lead: 0.85, lead2: 0.8, arp: 0.55, pad: 0.5 },
      jpop: { drum: 0.85, hat: 0.55, bass: 0.85, chord: 0.6, gtr: 0.75, lead: 0.9, lead2: 0.8, arp: 0.5, pad: 0.55 },
      lofi: { drum: 0.75, hat: 0.5, bass: 0.9, chord: 0.95, gtr: 0.6, lead: 0.7, lead2: 0.7, arp: 0.5, pad: 0.6 },
      enka: { drum: 0.6, hat: 0.4, bass: 0.85, chord: 0.8, gtr: 0.9, lead: 0.95, lead2: 0.85, arp: 0.5, pad: 0.7 },
    }[stationId] || {};
    this.bus = {
      drum: mk(lvl.drum, 0), hat: mk(lvl.hat, 0.15), bass: mk(lvl.bass, 0), chord: mk(lvl.chord, -0.25),
      gtr: mk(lvl.gtr, 0.35), lead: mk(lvl.lead, 0.05), lead2: mk(lvl.lead2, -0.3), arp: mk(lvl.arp, 0.4), pad: mk(lvl.pad, 0),
    };
    const hs = g(stationId === 'lofi' ? 0.5 : 1), gs = g(stationId === 'citypop' ? 1 : 0.4);
    hs.connect(this.hall); gs.connect(this.gate);
    this.send = { hall: hs, gate: gs };
    out.connect(this.dest);
    this.out = out;
  }
  start(stationId, songSeed, startAtSection) {
    this.stop();
    const ctx = this.ctx;
    this.stationId = stationId;
    this._graph(stationId);
    this._load(songSeed, startAtSection);
    this.nextT = ctx.currentTime + 0.12;
    this.playing = true;
  }
  _load(seed, startAtSection) {
    this.song = buildSong(this.stationId, seed);
    this.seed = seed;
    this.sd = 60 / this.song.bpm / 4;
    this.bar = 0; this.step = 0;
    if (startAtSection) {
      const ss = this.song.secStarts.filter((i) => i > 0);
      if (ss.length) this.bar = ss[Math.floor(Math.random() * ss.length)];
    }
    this.gap = 0;
    if (this.onSong) try { this.onSong(this.song, !!startAtSection); } catch (e) { /* ignore */ }
  }
  get meta() { return this.song ? { title: this.song.title, artist: this.song.artist, bpm: this.song.bpm } : null; }
  stop() {
    if (!this.out) { this.playing = false; return; }
    const ctx = this.ctx, out = this.out, extra = this.extra || [], send = this.send;
    const t = ctx.currentTime;
    try { out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 0.06); } catch (e) { /* */ }
    const kill = () => {
      try { out.disconnect(); } catch (e) { /* */ }
      try { send.hall.disconnect(); send.gate.disconnect(); } catch (e) { /* */ }
      for (const x of extra) { try { x.stop(); } catch (e) { /* */ } }
    };
    if (ctx instanceof (window.OfflineAudioContext || function () {})) kill(); else setTimeout(kill, 120);
    this.out = null; this.playing = false; this.extra = [];
  }
  tick() {
    if (!this.playing || !this.song) return;
    const ctx = this.ctx, now = ctx.currentTime;
    if (this.nextT < now - 0.2) this.nextT = now + 0.05; // fell behind (tab hidden): resync
    let guard = 0;
    while (this.nextT < now + this.ahead && guard++ < 64) {
      if (this.gap > 0) { this.gap--; this.nextT += this.sd; if (this.gap === 0) this._load(this.seed + 1, false); continue; }
      const bi = this.song.bars[this.bar];
      const s = this.step;
      let t = this.nextT;
      if (this.song.swing && s % 2 === 1) t += this.song.swing * this.sd;
      try { (PLAY[this.stationId] || PLAY.citypop)(this, bi, s, t); } catch (e) { if (!this._warned) { this._warned = true; console.warn('[music]', e); } }
      this.nextT += this.sd;
      if (++this.step >= 16) {
        this.step = 0;
        if (++this.bar >= this.song.bars.length) { this.bar = 0; this.gap = 20; } // ~1 bar of air between songs
      }
    }
  }
}
