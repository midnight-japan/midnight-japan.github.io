// Japanese licence plates (自動車登録番号標) drawn on canvas.
import * as THREE from 'three';

export const PLATE_REGIONS = ['横浜', '川崎', '湘南', '相模', '品川', '練馬', '足立', '多摩', '世田谷', '杉並', '大宮', '千葉', '袖ヶ浦', '習志野', 'なにわ', '名古屋', '富士山', '札幌'];
// hiragana used on plates (お し へ ん are not used)
export const PLATE_KANA = ['さ', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'ろ', 'あ', 'い', 'う', 'え', 'か', 'き', 'く', 'け', 'こ', 'を'];
export const PLATE_TYPES = {
  private: { bg: '#f4f4ef', fg: '#1f5a3a', border: '#1f5a3a' },          // 自家用 white/green
  commercial: { bg: '#1f6a3f', fg: '#f4f4ef', border: '#f4f4ef' },       // 事業用 green/white
  kei: { bg: '#f2d23a', fg: '#1a1a1a', border: '#1a1a1a' },              // 軽自家用 yellow/black
  keiCommercial: { bg: '#141414', fg: '#f2d23a', border: '#f2d23a' },    // 軽事業用 black/yellow
  rental: { bg: '#f4f4ef', fg: '#1f5a3a', border: '#1f5a3a' },           // わ / れ
  police: { bg: '#f4f4ef', fg: '#1f5a3a', border: '#1f5a3a' },           // 8ナンバー (特種用途)
};

export function randomPlate(type = 'private', rng = Math.random) {
  const pick = a => a[Math.floor(rng() * a.length)];
  const kei = type === 'kei' || type === 'keiCommercial';
  let cls;
  if (type === 'police') cls = '8' + pick(['00', '30', '80']);
  else if (kei) cls = pick(['580', '581', '583', '585', '50', '480']);
  else if (type === 'commercial') cls = pick(['100', '130', '300', '500', '800', '11']);
  else cls = pick(['300', '330', '331', '332', '334', '500', '501', '503', '530']);
  let kana = type === 'commercial' || type === 'keiCommercial' ? pick(['あ', 'い', 'う', 'え', 'か', 'き', 'く', 'け', 'こ', 'を']) : pick(PLATE_KANA.slice(0, 30));
  if (type === 'rental') kana = pick(['わ', 'れ']);
  const n = 1 + Math.floor(rng() * 9999);
  return { type, region: pick(PLATE_REGIONS.slice(0, 8)), cls, kana, num: n };
}

// 一連指定番号: 1 → "・・・1", 12 → "・・12", 123 → "・123", 1234 → "12-34"
export function formatNumber(n) {
  n = Math.max(1, Math.min(9999, Math.floor(+n || 1)));
  const s = String(n);
  if (s.length === 4) return s.slice(0, 2) + '-' + s.slice(2);
  const p = '・'.repeat(4 - s.length) + s; // e.g. "・・12" → shown as "・・ 12"
  return p.slice(0, 2) + ' ' + p.slice(2);
}

const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo","Noto Sans JP",sans-serif';
const cache = new Map();

export function plateCanvas(p, w = 660, h = 330) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const col = PLATE_TYPES[p.type] || PLATE_TYPES.private;
  // plate body with subtle emboss gradient
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, shade(col.bg, 1.06)); grd.addColorStop(1, shade(col.bg, 0.9));
  g.fillStyle = grd; roundRect(g, 4, 4, w - 8, h - 8, 26); g.fill();
  g.lineWidth = 9; g.strokeStyle = col.border; roundRect(g, 14, 14, w - 28, h - 28, 20); g.stroke();
  // bolts
  g.fillStyle = 'rgba(0,0,0,.35)';
  [[w * 0.2, 52], [w * 0.8, 52]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); });
  g.fillStyle = col.fg; g.textBaseline = 'middle';
  // upper row: region + class number
  g.textAlign = 'center';
  g.font = `600 70px ${FONT}`;
  const top = `${p.region}  ${p.cls}`;
  g.fillText(top, w / 2, 70, w * 0.62);
  // kana
  g.font = `600 78px ${FONT}`;
  g.fillText(p.kana, 72, 222);
  // main number
  g.font = `700 172px ${FONT}`;
  g.save(); g.translate(w / 2 + 40, 222); g.scale(0.8, 1.15);
  g.fillText(formatNumber(p.num), 0, 0, w * 0.95);
  g.restore();
  // embossed shine
  g.globalCompositeOperation = 'source-atop';
  const s = g.createLinearGradient(0, 0, w, h); s.addColorStop(0, 'rgba(255,255,255,.18)'); s.addColorStop(.5, 'rgba(255,255,255,0)'); s.addColorStop(1, 'rgba(0,0,0,.1)');
  g.fillStyle = s; g.fillRect(0, 0, w, h);
  return c;
}

export function plateTexture(p) {
  const key = JSON.stringify(p);
  if (cache.has(key)) return cache.get(key);
  const t = new THREE.CanvasTexture(plateCanvas(p));
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

// 0.33 x 0.165 m plate mesh facing +Z
const plateGeo = new THREE.PlaneGeometry(0.33, 0.165);
export function plateMesh(p) {
  const m = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ map: plateTexture(p), roughness: 0.45, metalness: 0.2, emissive: 0xffffff, emissiveMap: plateTexture(p), emissiveIntensity: 0 }));
  m.userData.isPlate = true;
  return m;
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) * k), gg = Math.min(255, ((n >> 8) & 255) * k), b = Math.min(255, (n & 255) * k);
  return `rgb(${r | 0},${gg | 0},${b | 0})`;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
