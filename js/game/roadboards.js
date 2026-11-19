// v2.14 Road boards: the two signs every Japanese main road has and the city never had —
//  · 方面看板: the blue overhead direction board before a signalled junction: an arrow per road out of the junction with
//    the place it leads to (kanji, romaji underneath), white border — destinations are the real towns / wards / cities
//    lying in that direction (data/places.js nearby, data/japan.js cities further out)
//  · 交差点名: the small blue name plate on the signal pole — the name of the town the junction is in
// Positions / arms come from the city worker (boards[]); text is drawn here into one shared atlas (512×256 cells,
// shared by key, freed with their tiles) → one draw call per tile.
import * as THREE from 'three';
import { PLACES, placeAt } from '../../data/places.js';
import { JAPAN_CITIES } from '../../data/japan.js';
import { romaji } from './names.js';

const AW = 2048, AH = 2048, CW = 512, CH = 256, COLS = AW / CW, ROWS = AH / CH;
const FONT = '"Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif';

// the best destination in direction (dx, dz) from (x, z): a place 1.2–14 km out, or a big city 14–120 km out
function destination(x, z, dx, dz, avoid) {
  let best = null, bs = -1e9;
  const consider = (name, px, pz, dmin, dmax, w) => { if (avoid.has(name)) return; const ex = px - x, ez = pz - z, d = Math.hypot(ex, ez); if (d < dmin || d > dmax) return;
    const c = (ex * dx + ez * dz) / d; if (c < 0.82) return; const sc = c * 3 + w - Math.abs(Math.log(d / (dmin * 3))) * 0.6; if (sc > bs) { bs = sc; best = name; } };
  for (const p of PLACES) if (p.kind === 'ward' || p.kind === 'town' || p.kind === 'spot') consider(p.name, p.x, p.z, 1200, 14000, p.kind === 'ward' ? 1.2 : 0.4);
  for (const [n, px, pz, pop] of JAPAN_CITIES) consider(n, px, pz, 9000, 120000, pop > 1e6 ? 1.6 : pop > 3e5 ? 1 : 0.4);
  return best;
}

function drawGuide(g, ox, oy, arms) {
  g.fillStyle = '#1652a8'; g.fillRect(ox, oy, CW, CH); g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(ox + 9, oy + 9, CW - 18, CH - 18);
  const cx = ox + CW / 2, cy = oy + CH * 0.62; g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  // the junction drawn as on real boards: a thick stem from the bottom, an arm (with arrowhead) per exit
  g.lineWidth = 15; g.beginPath(); g.moveTo(cx, oy + CH - 16); g.lineTo(cx, cy); g.stroke();
  for (const a of arms) {
    const L = a.side === 0 ? 62 : 120, ex = cx + a.sx * L, ey = cy - a.sy * L; g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.stroke();
    const ang = Math.atan2(-a.sy, a.sx); g.beginPath(); g.moveTo(ex + Math.cos(ang) * 18, ey + Math.sin(ang) * 18); g.lineTo(ex + Math.cos(ang + 2.4) * 18, ey + Math.sin(ang + 2.4) * 18); g.lineTo(ex + Math.cos(ang - 2.4) * 18, ey + Math.sin(ang - 2.4) * 18); g.closePath(); g.fill();
    if (!a.name) continue;
    const tx = a.side === 0 ? cx : cx + a.sx * 170, ty = a.side === 0 ? oy + 46 : cy - a.sy * 40 - 6;
    g.textAlign = a.side === 0 ? 'center' : a.sx < 0 ? 'left' : 'right'; const X = a.side === 0 ? tx : a.sx < 0 ? ox + 20 : ox + CW - 20;
    const fs = a.name.length > 5 ? 30 : 38; g.font = `800 ${fs}px ${FONT}`; g.textBaseline = 'middle'; g.fillText(a.name, X, ty);
    const r = romaji(a.name); if (r) { g.font = `600 17px system-ui,sans-serif`; g.fillText(r, X, ty + fs * 0.75); }
  }
}
function drawPlate(g, ox, oy, name) {
  g.fillStyle = '#1652a8'; g.fillRect(ox, oy + 64, CW, 128); g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(ox + 7, oy + 71, CW - 14, 114);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 52px ${FONT}`; g.fillText(name, ox + CW / 2, oy + 112);
  const r = romaji(name); g.font = `600 22px system-ui,sans-serif`; g.fillText(r || ' ', ox + CW / 2, oy + 160);
}

export class RoadBoards {
  constructor(scene) {
    const c = document.createElement('canvas'); c.width = AW; c.height = AH; this.cv = c; this.g = c.getContext('2d');
    this.tex = new THREE.CanvasTexture(c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8; this.tex.generateMipmaps = true;
    this.mat = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.45, metalness: 0.1, emissiveMap: this.tex, emissive: 0xffffff, emissiveIntensity: 0.18, side: THREE.DoubleSide, alphaTest: 0.5 }); // retro-reflective sheeting reads a touch bright
    this.cells = new Map(); this.free = []; for (let i = COLS * ROWS - 1; i >= 0; i--) this.free.push(i); this.dirty = false;
  }
  cell(key, draw) {
    let e = this.cells.get(key); if (e) { e.n++; return e.i; }
    const i = this.free.pop(); if (i === undefined) return -1;
    const ox = (i % COLS) * CW, oy = Math.floor(i / COLS) * CH; this.g.clearRect(ox, oy, CW, CH); draw(this.g, ox, oy); this.cells.set(key, { i, n: 1 }); this.dirty = true; return i;
  }
  release(keys) { for (const k of keys || []) { const e = this.cells.get(k); if (!e) continue; if (--e.n <= 0) { this.cells.delete(k); this.free.push(e.i); } } }
  // b = worker boards (tile-local), (ox, oz) tile origin, y(x, z) ground → a Mesh (or null) + the atlas keys it holds
  build(b, ox, oz) {
    const pos = [], uv = [], keys = [];
    const quad = (cx, cy, cz, nx, nz, w, h, i, vTop = 0, vBot = 1) => { const tx = -nz, tz = nx, u0 = (i % COLS) * CW / AW, u1 = u0 + CW / AW, v1 = 1 - Math.floor(i / COLS) * CH / AH - vTop * CH / AH, v0 = 1 - Math.floor(i / COLS) * CH / AH - vBot * CH / AH;
      const P = (a, b2) => [cx + tx * a + nx * 0.02, cy + b2, cz + tz * a + nz * 0.02]; // tx = viewer's right… mirrored below so text reads correctly
      const A = P(-w / 2, -h / 2), B = P(w / 2, -h / 2), C = P(w / 2, h / 2), D = P(-w / 2, h / 2); // t = the viewer's right
      pos.push(...A, ...B, ...C, ...A, ...C, ...D); uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); };
    for (let k = 0; k < b.length;) {
      const type = b[k], x = b[k + 1] + ox, z = b[k + 2] + oz, nx = b[k + 3], nz = b[k + 4], w = b[k + 5], n = b[k + 6], arms = [];
      for (let a = 0; a < n; a++) arms.push([b[k + 7 + a * 2], b[k + 8 + a * 2]]); k += 7 + n * 2;
      if (type === 1) { const pl = placeAt(x, z, 1500); if (!pl) continue; const key = 'p:' + pl.name, i = this.cell(key, (g, X, Y) => drawPlate(g, X, Y, pl.name)); if (i < 0) continue; keys.push(key);
        quad(x, 4.85, z, nx, nz, 1.7, 0.85, i); continue; } // the plate fills the middle half of its cell
      // guide board: classify each exit relative to the driver heading into the junction (−n)
      const fx = -nx, fz = -nz, lx = -fz, lz = fx, used = new Set(), list = [];
      for (const [dx, dz] of arms) { const st = dx * fx + dz * fz, sd = dx * lx + dz * lz; const side = st > 0.7 ? 0 : sd > 0 ? -1 : 1; if (list.some(o => o.side === side)) continue;
        const name = destination(x, z, dx, dz, used); if (name) used.add(name); list.push({ side, sx: side === 0 ? 0 : side, sy: side === 0 ? 1 : Math.max(0, st), name }); }
      if (!list.some(o => o.name)) continue;
      list.sort((p, q) => p.side - q.side);
      const key = 'g:' + list.map(o => o.side + (o.name || '')).join('|'), i = this.cell(key, (g, X, Y) => drawGuide(g, X, Y, list)); if (i < 0) continue; keys.push(key);
      quad(x, 6.7, z, nx, nz, w, w / 2, i);
    }
    if (!pos.length) return { mesh: null, keys };
    if (this.dirty) { this.tex.needsUpdate = true; this.dirty = false; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, this.mat); m.name = 'roadboards'; return { mesh: m, keys };
  }
}
