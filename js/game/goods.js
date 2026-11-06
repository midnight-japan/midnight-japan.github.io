// Konbini goods: printed packaging, magazine covers and shelf price tags drawn on canvases (parody brands, legible
// Japanese print). Small textures, built once and shared.
import * as THREE from 'three';

const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';
const cache = new Map();
function canvasTex(key, w, h, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  cache.set(key, t); return t;
}
const fit = (g, txt, x, y, size, maxW, weight = 800, col = '#fff') => {
  g.font = `${weight} ${size}px ${JP}`; const w = g.measureText(txt).width; const k = Math.min(1, maxW / w);
  g.save(); g.translate(x, y); g.scale(k, 1); g.fillStyle = col; g.textAlign = 'center'; g.fillText(txt, 0, 0); g.restore();
};

// [name, sub, bg, band, text colour, price]
export const PRODUCTS = [
  ['まろやか緑茶', '国産茶葉100%', '#2f7a3a', '#e9f3d8', '#fff', 140],
  ['ほうじ茶', '香ばし焙煎', '#8a4b22', '#f2e2c8', '#fff', 140],
  ['BLACK COFFEE', '無糖 微糖', '#1d1d1d', '#c49a5a', '#fff', 150],
  ['アクアスウェット', 'イオン補給', '#2d7fd3', '#ffffff', '#fff', 160],
  ['カップめん', 'しょうゆ味', '#d92f2f', '#fff3c4', '#fff', 236],
  ['ポテトチップス', 'うすしお味', '#f2c230', '#d92f2f', '#7a1d10', 158],
  ['ミルクチョコ', 'カカオ40%', '#6b3a1f', '#f5e1c8', '#fff', 128],
  ['天然水', '南アルプス', '#e8f4ff', '#3d8bd9', '#1f4f88', 110],
  ['エナジーZ', 'カフェイン配合', '#0e0e0e', '#9ef01a', '#9ef01a', 210],
  ['のど飴', 'はちみつレモン', '#f5d23c', '#2a8a3a', '#5a3a00', 198],
  ['牛乳', '成分無調整', '#ffffff', '#2d6fd3', '#1d3f88', 178],
  ['塩むすび', '国産米使用', '#f4f1e6', '#1e1e1e', '#1e1e1e', 120],
];
export function productTexture(i) {
  const [name, sub, bg, band, col, price] = PRODUCTS[i % PRODUCTS.length];
  return canvasTex('prod' + i, 128, 192, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = band; g.fillRect(0, h * 0.58, w, h * 0.16);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(8, 0, 10, h); // shine
    fit(g, name, w / 2, h * 0.36, 26, w - 14, 900, col);
    fit(g, sub, w / 2, h * 0.70, 15, w - 16, 700, bg === '#ffffff' || bg === '#f4f1e6' || bg === '#e8f4ff' ? '#fff' : bg);
    fit(g, '内容量 500', w / 2, h * 0.86, 11, w - 20, 500, col);
    g.font = `600 9px ${JP}`; g.fillStyle = col; g.globalAlpha = 0.7; g.textAlign = 'center'; g.fillText('MIDNIGHT FOODS', w / 2, h * 0.95);
  });
}
const COVERS = [
  ['JDM MONTHLY', '12月号', '#c8102e', ['首都高 深夜の大黒PA', '最新チューニング50台', 'R34 完全解剖']],
  ['週刊 湾岸', 'No.48', '#0b3d91', ['湾岸線 ルート完全ガイド', '冬のタイヤ選び', '読者の愛車 大集合']],
  ['カーライフ', '冬号', '#1f7a4a', ['軽自動車ベスト10', '燃費の新常識', '車中泊グッズ']],
  ['旅と道', '特集', '#e07b00', ['アクアライン 絶景ドライブ', '海ほたる グルメ', '房総 温泉めぐり']],
  ['横浜ウォーカー', '最新号', '#7a2d8f', ['みなとみらい 夜景', '中華街 食べ歩き', '赤レンガ 冬祭り']],
  ['日刊 東京新聞社', '朝刊', '#f5f2ea', ['湾岸の再開発 本格化', '首都高 夜間工事のお知らせ', '天気 晴れ 最高14℃']],
];
export function coverTexture(i) {
  const [title, iss, col, lines] = COVERS[i % COVERS.length];
  const paper = col === '#f5f2ea';
  return canvasTex('cover' + i, 192, 256, (g, w, h) => {
    if (paper) {
      g.fillStyle = col; g.fillRect(0, 0, w, h); fit(g, title, w / 2, 34, 26, w - 20, 900, '#111');
      g.fillStyle = '#111'; g.fillRect(10, 44, w - 20, 2);
      fit(g, lines[0], w / 2, 76, 22, w - 20, 900, '#111');
      g.fillStyle = '#9aa'; g.fillRect(12, 90, 80, 60);
      g.font = `500 8px ${JP}`; g.fillStyle = '#333'; g.textAlign = 'left';
      for (let r = 0; r < 14; r++) g.fillText('首都高速道路は今月から湾岸線の夜間補修工事を実施する。'.slice(r % 5, 14 + r % 5), r < 7 ? 98 : 12, 98 + (r < 7 ? r : r - 7 + 9) * 10);
      fit(g, lines[1], w / 2, 238, 12, w - 20, 700, '#111');
      return;
    }
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#2a2f38'); grd.addColorStop(1, '#0d0f13'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // cover photo: a stylised car silhouette under city lights
    g.fillStyle = '#ffcf6a'; for (let k = 0; k < 18; k++) g.fillRect((k * 37) % w, 90 + (k * 13) % 60, 3, 3);
    g.fillStyle = col; g.beginPath(); g.moveTo(24, 200); g.lineTo(50, 168); g.lineTo(120, 162); g.lineTo(160, 182); g.lineTo(172, 200); g.closePath(); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(58, 202, 13, 0, 7); g.arc(146, 202, 13, 0, 7); g.fill();
    g.fillStyle = col; g.fillRect(0, 0, w, 52); fit(g, title, w / 2, 38, 34, w - 16, 900, '#fff');
    fit(g, iss, w - 24, 66, 12, 40, 700, '#fff');
    lines.forEach((l, k) => { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(8, 74 + k * 22, w * 0.62, 18); fit(g, l, 8 + w * 0.31, 88 + k * 22, 12, w * 0.6, 800, k === 0 ? '#ffe14a' : '#fff'); });
    g.fillStyle = '#fff'; g.fillRect(w - 46, h - 30, 40, 24); g.fillStyle = '#000'; g.font = `700 9px ${JP}`; g.textAlign = 'center'; g.fillText('¥680', w - 26, h - 14);
  });
}
// a strip of shelf price tags (POP) for one shelf level
export function priceStripTexture(seed) {
  return canvasTex('strip' + seed, 512, 32, (g, w, h) => {
    g.fillStyle = '#fafafa'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 8; k++) {
      const p = PRODUCTS[(k + seed) % PRODUCTS.length]; const x = k * 64;
      g.fillStyle = '#ddd'; g.fillRect(x, 0, 1, h);
      g.fillStyle = '#222'; g.font = `600 8px ${JP}`; g.textAlign = 'left'; g.fillText(p[0].slice(0, 7), x + 3, 11);
      g.fillStyle = '#d0021b'; g.font = `800 14px ${JP}`; g.fillText(p[5] + '円', x + 3, 27);
      g.fillStyle = '#666'; g.font = `500 6px ${JP}`; g.fillText('税込' + Math.round(p[5] * 1.08), x + 40, 27);
    }
  });
}
