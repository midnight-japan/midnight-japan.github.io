// Map pictograms (v2.15): one flat, white silhouette per landmark kind on a round coloured badge. Our own vector drawings
// (canvas paths), rendered ONCE into an atlas canvas; the map then blits them with drawImage (no per-frame path work).
// Glyphs are drawn in a 100 × 100 box centred on (50, 50).
const CAT = {
  shrine: '#e0453a', temple: '#d98a1c', castle: '#7a5cd6', nature: '#2f9e62', water: '#2a86c9', urban: '#3d6fd6',
  bridge: '#1aa3b5', travel: '#4b8fd0', onsen: '#d65a8e', race: '#ff5a2a', icon: '#e8432f',
};
export const ICON_CAT = {
  tokyotower: 'icon', skytree: 'urban', fuji: 'nature', castle: 'castle', torii: 'shrine', ftorii: 'shrine', pagoda: 'temple',
  temple: 'temple', pavilion: 'temple', lantern: 'temple', buddha: 'temple', bridge: 'bridge', tbridge: 'bridge', abridge: 'bridge',
  wheel: 'urban', skyscraper: 'urban', tower: 'urban', clock: 'urban', dome: 'urban', city: 'urban', building: 'urban', station: 'travel',
  stadium: 'urban', plane: 'travel', ship: 'travel', onsen: 'onsen', mountain: 'nature', volcano: 'nature', lake: 'water',
  island: 'water', waterfall: 'water', fish: 'water', park: 'nature', bamboo: 'nature', deer: 'nature', flower: 'nature',
  dune: 'nature', house: 'castle', star: 'castle', lighthouse: 'travel', sun: 'icon', circuit: 'race', pa: 'race', jct: 'bridge',
};
const R = (c, x, y, w, h) => c.fillRect(x, y, w, h);
const poly = (c, ...p) => { c.beginPath(); for (let i = 0; i < p.length; i += 2) i ? c.lineTo(p[i], p[i + 1]) : c.moveTo(p[i], p[i + 1]); c.closePath(); c.fill(); };
const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const line = (c, w, ...p) => { c.lineWidth = w; c.beginPath(); for (let i = 0; i < p.length; i += 2) i ? c.lineTo(p[i], p[i + 1]) : c.moveTo(p[i], p[i + 1]); c.stroke(); };
const roof = (c, y, w, h, lift = 6) => { c.beginPath(); c.moveTo(50 - w / 2, y + h); c.quadraticCurveTo(50 - w / 2 + 4, y + h - lift, 50 - w / 4, y + 2); c.lineTo(50 + w / 4, y + 2); c.quadraticCurveTo(50 + w / 2 - 4, y + h - lift, 50 + w / 2, y + h); c.closePath(); c.fill(); };
const G = {
  tokyotower(c) { poly(c, 50, 10, 56, 44, 66, 88, 58, 88, 50, 60, 42, 88, 34, 88, 44, 44); c.fillStyle = 'rgba(0,0,0,.25)'; R(c, 41, 46, 18, 5); R(c, 37, 68, 26, 5); },
  skytree(c) { R(c, 48.5, 6, 3, 16); poly(c, 46, 22, 54, 22, 60, 90, 40, 90); c.fillStyle = 'rgba(0,0,0,.25)'; R(c, 43, 34, 14, 5); R(c, 42, 50, 16, 4); },
  fuji(c) { poly(c, 8, 84, 40, 30, 60, 30, 92, 84); c.fillStyle = 'rgba(0,0,0,.28)'; poly(c, 40, 30, 60, 30, 70, 46, 62, 42, 55, 48, 48, 41, 40, 47, 31, 45); },
  castle(c) { roof(c, 14, 34, 12); R(c, 38, 26, 24, 10); roof(c, 34, 50, 12); R(c, 32, 46, 36, 12); roof(c, 56, 64, 12); R(c, 26, 68, 48, 18); c.fillStyle = 'rgba(0,0,0,.25)'; R(c, 46, 74, 8, 12); },
  torii(c) { c.beginPath(); c.moveTo(10, 24); c.quadraticCurveTo(50, 32, 90, 24); c.lineTo(88, 34); c.quadraticCurveTo(50, 40, 12, 34); c.closePath(); c.fill(); R(c, 20, 44, 60, 7); R(c, 26, 34, 8, 54); R(c, 66, 34, 8, 54); R(c, 46, 38, 8, 10); },
  ftorii(c) { G.torii(c); c.fillStyle = 'rgba(255,255,255,.55)'; for (const y of [84, 92]) { c.beginPath(); for (let x = 8; x <= 92; x += 2) c.lineTo(x, y + Math.sin(x / 6) * 2.5); c.lineTo(92, y + 4); c.lineTo(8, y + 4); c.fill(); } },
  pagoda(c) { R(c, 48.5, 4, 3, 14); for (let i = 0; i < 5; i++) { const y = 16 + i * 14, w = 30 + i * 9; roof(c, y, w, 8, 4); R(c, 50 - (w - 16) / 4, y + 8, (w - 16) / 2, 6); } },
  temple(c) { roof(c, 22, 86, 22, 10); R(c, 22, 44, 56, 30); c.fillStyle = 'rgba(0,0,0,.25)'; R(c, 30, 52, 8, 22); R(c, 46, 52, 8, 22); R(c, 62, 52, 8, 22); c.fillStyle = '#fff'; R(c, 14, 74, 72, 8); },
  pavilion(c) { R(c, 48.5, 8, 3, 8); roof(c, 14, 40, 10); R(c, 36, 24, 28, 14); roof(c, 36, 66, 12, 6); R(c, 28, 48, 44, 18); R(c, 20, 66, 60, 4); c.fillStyle = 'rgba(255,255,255,.5)'; R(c, 10, 80, 80, 4); R(c, 20, 88, 60, 3); },
  lantern(c) { R(c, 30, 12, 40, 6); R(c, 30, 82, 40, 6); c.beginPath(); c.ellipse(50, 50, 26, 32, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(0,0,0,.3)'; R(c, 27, 38, 46, 3); R(c, 27, 60, 46, 3); },
  buddha(c) { circ(c, 50, 26, 13); c.beginPath(); c.moveTo(18, 88); c.quadraticCurveTo(20, 46, 50, 42); c.quadraticCurveTo(80, 46, 82, 88); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(50, 74, 18, 6, 0, 0, Math.PI * 2); c.fill(); },
  bridge(c) { c.strokeStyle = '#fff'; R(c, 26, 18, 6, 64); R(c, 68, 18, 6, 64); R(c, 4, 62, 92, 7); c.lineWidth = 3; c.beginPath(); c.moveTo(4, 30); c.quadraticCurveTo(16, 58, 29, 20); c.quadraticCurveTo(50, 70, 71, 20); c.quadraticCurveTo(84, 58, 96, 30); c.stroke(); },
  tbridge(c) { R(c, 4, 60, 92, 7); poly(c, 12, 60, 30, 34, 48, 60, 40, 60, 30, 46, 20, 60); poly(c, 52, 60, 70, 34, 88, 60, 80, 60, 70, 46, 60, 60); R(c, 26, 60, 8, 26); R(c, 66, 60, 8, 26); },
  abridge(c) { c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.arc(30, 78, 24, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.arc(70, 78, 24, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); R(c, 6, 62, 88, 5); },
  wheel(c) { c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.arc(50, 44, 30, 0, Math.PI * 2); c.stroke(); c.lineWidth = 2.5; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(c, 2.5, 50, 44, 50 + Math.cos(a) * 30, 44 + Math.sin(a) * 30); } circ(c, 50, 44, 6); poly(c, 50, 44, 66, 92, 58, 92, 50, 62, 42, 92, 34, 92); },
  skyscraper(c) { poly(c, 34, 92, 36, 26, 50, 10, 64, 26, 66, 92); c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 34; y < 88; y += 10) R(c, 40, y, 20, 3); },
  tower(c) { R(c, 47, 6, 6, 18); c.beginPath(); c.ellipse(50, 34, 18, 10, 0, 0, Math.PI * 2); c.fill(); poly(c, 44, 40, 56, 40, 62, 92, 38, 92); },
  clock(c) { poly(c, 50, 8, 70, 30, 30, 30); R(c, 32, 30, 36, 60); c.fillStyle = 'rgba(0,0,0,.3)'; circ(c, 50, 46, 10); c.fillStyle = '#fff'; R(c, 49, 38, 2, 9); R(c, 49, 45, 7, 2); },
  dome(c) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(50, 38, 20, Math.PI, 0); c.stroke(); line(c, 3, 50, 18, 50, 38); line(c, 3, 36, 24, 64, 24); R(c, 26, 38, 48, 8); R(c, 14, 46, 72, 44); c.fillStyle = 'rgba(0,0,0,.28)'; for (const x of [22, 36, 58, 72]) R(c, x - 3, 54, 6, 12); },
  city(c) { R(c, 10, 46, 18, 46); R(c, 32, 22, 18, 70); R(c, 54, 34, 16, 58); R(c, 74, 56, 16, 36); c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 30; y < 88; y += 9) R(c, 36, y, 10, 4); },
  building(c) { poly(c, 10, 40, 50, 18, 90, 40); R(c, 16, 40, 68, 50); c.fillStyle = 'rgba(0,0,0,.28)'; for (const x of [24, 40, 56, 70]) R(c, x, 50, 8, 14); R(c, 44, 70, 12, 20); },
  station(c) { R(c, 18, 14, 64, 58); c.fillStyle = 'rgba(0,0,0,.3)'; R(c, 26, 22, 48, 22); circ(c, 32, 58, 5); circ(c, 68, 58, 5); c.fillStyle = '#fff'; poly(c, 30, 72, 40, 72, 30, 90, 20, 90); poly(c, 60, 72, 70, 72, 80, 90, 70, 90); },
  stadium(c) { c.beginPath(); c.ellipse(50, 56, 42, 26, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(50, 52, 28, 14, 0, 0, Math.PI * 2); c.fill(); },
  plane(c) { poly(c, 50, 6, 56, 16, 56, 40, 92, 58, 92, 66, 56, 56, 56, 78, 68, 88, 68, 94, 50, 88, 32, 94, 32, 88, 44, 78, 44, 56, 8, 66, 8, 58, 44, 40, 44, 16); },
  ship(c) { poly(c, 6, 60, 94, 60, 80, 84, 18, 84); R(c, 24, 44, 50, 16); R(c, 34, 30, 30, 14); R(c, 44, 14, 8, 16); },
  onsen(c) { c.beginPath(); c.ellipse(50, 70, 36, 18, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 6; c.lineCap = 'round'; for (const x of [32, 50, 68]) { c.beginPath(); c.moveTo(x, 48); c.bezierCurveTo(x - 10, 38, x + 10, 28, x, 12); c.stroke(); } },
  mountain(c) { poly(c, 4, 86, 34, 30, 50, 52, 64, 22, 96, 86); c.fillStyle = 'rgba(0,0,0,.25)'; poly(c, 64, 22, 72, 36, 64, 34, 57, 38); },
  volcano(c) { poly(c, 6, 86, 38, 36, 62, 36, 94, 86); c.fillStyle = 'rgba(255,255,255,.75)'; circ(c, 46, 22, 8); circ(c, 58, 14, 7); circ(c, 64, 26, 6); },
  lake(c) { c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round'; for (const y of [34, 54, 74]) { c.beginPath(); c.moveTo(12, y); c.bezierCurveTo(30, y - 12, 34, y + 12, 50, y); c.bezierCurveTo(66, y - 12, 70, y + 12, 88, y); c.stroke(); } },
  island(c) { c.beginPath(); c.ellipse(50, 74, 40, 12, 0, 0, Math.PI * 2); c.fill(); R(c, 48, 26, 5, 46); poly(c, 50, 26, 82, 36, 54, 30); poly(c, 50, 26, 20, 38, 48, 30); poly(c, 50, 24, 74, 16, 52, 28); poly(c, 50, 24, 28, 14, 50, 28); },
  waterfall(c) { R(c, 8, 12, 84, 12); c.fillStyle = 'rgba(255,255,255,.85)'; for (const x of [32, 46, 60]) R(c, x, 24, 8, 54); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(50, 82, 34, 9, 0, 0, Math.PI * 2); c.fill(); },
  fish(c) { c.beginPath(); c.ellipse(44, 50, 30, 18, 0, 0, Math.PI * 2); c.fill(); poly(c, 70, 50, 94, 30, 94, 70); c.fillStyle = 'rgba(0,0,0,.35)'; circ(c, 28, 46, 4); },
  park(c) { circ(c, 50, 36, 26); circ(c, 32, 50, 16); circ(c, 68, 50, 16); R(c, 46, 56, 8, 34); },
  bamboo(c) { for (const [x, h] of [[28, 10], [48, 4], [68, 14]]) { R(c, x, h, 7, 90 - h); c.fillStyle = 'rgba(0,0,0,.3)'; for (let y = h + 16; y < 90; y += 18) R(c, x, y, 7, 3); c.fillStyle = '#fff'; poly(c, x + 7, h + 20, x + 22, h + 12, x + 7, h + 26); } },
  deer(c) { poly(c, 22, 50, 70, 46, 76, 54, 74, 88, 66, 88, 64, 64, 34, 64, 32, 88, 24, 88, 20, 62); poly(c, 66, 50, 78, 28, 88, 30, 80, 52); c.strokeStyle = '#fff'; line(c, 4, 78, 30, 72, 10, 66, 16); line(c, 4, 84, 30, 92, 12, 96, 20); },
  flower(c) { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4 - Math.PI / 2; circ(c, 50 + Math.cos(a) * 18, 42 + Math.sin(a) * 18, 13); } c.fillStyle = 'rgba(0,0,0,.3)'; circ(c, 50, 42, 8); c.fillStyle = '#fff'; R(c, 47, 60, 6, 32); },
  dune(c) { c.beginPath(); c.moveTo(4, 86); c.bezierCurveTo(24, 40, 44, 44, 58, 62); c.bezierCurveTo(70, 40, 86, 44, 96, 70); c.lineTo(96, 86); c.closePath(); c.fill(); circ(c, 74, 22, 10); },
  house(c) { poly(c, 50, 8, 88, 64, 12, 64); R(c, 20, 64, 60, 24); c.fillStyle = 'rgba(0,0,0,.28)'; R(c, 42, 36, 16, 12); R(c, 44, 70, 12, 18); },
  star(c) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 22 : 42; c.lineTo(50 + Math.cos(a) * r, 52 + Math.sin(a) * r); } c.closePath(); c.fill(); },
  lighthouse(c) { poly(c, 40, 30, 60, 30, 66, 90, 34, 90); R(c, 38, 16, 24, 14); poly(c, 36, 16, 50, 6, 64, 16); c.fillStyle = 'rgba(0,0,0,.28)'; R(c, 38, 48, 24, 7); R(c, 36, 70, 28, 7); },
  sun(c) { R(c, 38, 34, 24, 58); poly(c, 38, 52, 14, 36, 18, 30, 38, 42); poly(c, 62, 52, 86, 36, 82, 30, 62, 42); circ(c, 50, 24, 14); c.fillStyle = 'rgba(0,0,0,.3)'; circ(c, 50, 58, 7); },
  circuit(c) { const s = 13; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) R(c, 28 + i * s, 14 + j * s, s, s); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(28, 14, s * 4, s * 4); R(c, 22, 10, 6, 82); },
  pa(c) { c.font = '900 64px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', 50, 54); },
  jct(c) { c.strokeStyle = '#fff'; c.lineWidth = 9; c.lineCap = 'round'; line(c, 9, 50, 92, 50, 50, 22, 12); line(c, 9, 50, 50, 78, 12); },
};
// atlas: one 64 px (× dpr) cell per kind, badge + glyph. get(kind) → { img, sx, sy, s }
export function iconAtlas(dpr = 1) {
  const kinds = Object.keys(G), s = Math.round(64 * Math.min(2, dpr)), cols = 8, rows = Math.ceil(kinds.length / cols);
  const cv = document.createElement('canvas'); cv.width = cols * s; cv.height = rows * s; const c = cv.getContext('2d'); const idx = {};
  kinds.forEach((k, i) => {
    const x = (i % cols) * s, y = Math.floor(i / cols) * s; idx[k] = { img: cv, sx: x, sy: y, s };
    c.save(); c.translate(x, y); c.scale(s / 100, s / 100);
    c.fillStyle = 'rgba(0,0,0,.45)'; circ(c, 50, 53, 46); // soft shadow
    c.fillStyle = CAT[ICON_CAT[k]] || CAT.urban; circ(c, 50, 50, 45);
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 5; c.beginPath(); c.arc(50, 50, 44, 0, Math.PI * 2); c.stroke();
    c.translate(50, 50); c.scale(0.6, 0.6); c.translate(-50, -50); c.fillStyle = '#fff'; c.strokeStyle = '#fff';
    try { G[k](c); } catch { /* a glyph bug must never break the map */ }
    c.restore();
  });
  return k => idx[k] || idx.city;
}
