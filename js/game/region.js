// v2.16 — lazily loaded touge / coast regions (tools/region-build.mjs → data/regions/): 箱根七曲り, 富士山スカイライン,
// 江の島 + 国道134号 and ビーナスライン. Only a tiny manifest (boxes + spawn points) is imported at startup; a region's
// roads, terrain heights and lots are fetched when you get near it or travel there, then:
//   · its roads join the game's road network (world.net: surface queries, traffic, autopilot, guardrail walls, U-turns)
//     and get the usual road meshes (roads.js buildRoadMeshes: asphalt, lines, W-beam guardrails, delineators, bays)
//   · real terrain from the DEM grid, carved under the road with cut/fill slopes, a coarse far ring (distant mountains)
//   · forest by altitude, roadside grass, car parks / view points with buildings, lamps lit at night, signs (route
//     shields, curve chevrons at the hairpins, altitude plates, speed limits)
//   · 箱根七曲り lies inside the Hakone Turnpike terrain: it carves that terrain instead of bringing its own
// All meshes of a region sit in one group positioned at the region's centre (vertices relative to it), so 130 km from
// the origin (Venus Line) the geometry keeps its precision.
import * as THREE from 'three';
import { RoadNet, buildRoadMeshes } from './roads.js';
import { tougeBays, TOUGE_LOTS } from './touge.js';
import { speciesGeos, floraMaterial, speciesColor, grassGeometry, registerTrees, getSeason } from './flora.js';
import { surface } from './textures.js';
import { REGIONS } from '../../data/regions/index.js';

const LANE = 3.5;
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const idle = () => new Promise(r => setTimeout(r, 0));
const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo","Noto Sans JP",sans-serif';
const halfW = r => (r.edgeL - r.edgeR) / 2;

// ── canvas textures (cached) ──
const _tex = new Map();
function canvasTex(key, w, h, draw) {
  if (_tex.has(key)) return _tex.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; _tex.set(key, t); return t;
}
const chevronTex = dir => canvasTex('chev' + dir, 128, 160, (g, w, h) => { g.fillStyle = '#ffd200'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.lineWidth = 0;
  for (const y of [18, 82]) { g.beginPath(); if (dir > 0) { g.moveTo(92, y); g.lineTo(36, y + 30); g.lineTo(92, y + 60); g.lineTo(92, y + 42); g.lineTo(64, y + 30); g.lineTo(92, y + 18); } else { g.moveTo(36, y); g.lineTo(92, y + 30); g.lineTo(36, y + 60); g.lineTo(36, y + 42); g.lineTo(64, y + 30); g.lineTo(36, y + 18); } g.closePath(); g.fill(); }
  g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); });
const nameTex = (name, sub, style = 'brown') => canvasTex('nm' + name + sub + style, 512, 192, (g, w, h) => {
  g.fillStyle = style === 'blue' ? '#0b55a8' : style === 'green' ? '#00703c' : '#5a3a22'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f6efe1'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#f6efe1'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 84; g.font = `800 ${fs}px ${style === 'brown' ? '"Hiragino Mincho ProN","Noto Serif JP",serif' : JP}`; while (g.measureText(name).width > w - 50 && fs > 30) { fs -= 4; g.font = `800 ${fs}px ${JP}`; }
  g.fillText(name, w / 2, sub ? 82 : h / 2); if (sub) { g.font = `600 30px system-ui,sans-serif`; g.fillText(sub, w / 2, 150); } });
const shieldTex = (ref, national) => canvasTex('sh' + ref + national, 192, 192, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  if (national) { g.fillStyle = '#0b55a8'; g.beginPath(); g.moveTo(14, 20); g.lineTo(178, 20); g.lineTo(170, 120); g.quadraticCurveTo(96, 190, 96, 190); g.quadraticCurveTo(22, 120, 22, 120); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `700 26px ${JP}`; g.fillText('国道', 96, 56); g.font = `800 64px system-ui,sans-serif`; g.fillText(ref, 96, 122); }
  else { g.fillStyle = '#0b55a8'; g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(96 + Math.cos(a) * 88, 96 + Math.sin(a) * 88); } g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `700 24px ${JP}`; g.fillText('県道', 96, 66); g.font = `800 ${ref.length > 2 ? 56 : 66}px system-ui,sans-serif`; g.fillText(ref, 96, 132); } });
const speedTex = v => canvasTex('sp' + v, 160, 160, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(80, 80, 76, 0, 7); g.fill(); g.strokeStyle = '#d9171c'; g.lineWidth = 16; g.beginPath(); g.arc(80, 80, 66, 0, 7); g.stroke();
  g.fillStyle = '#0a4aa6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 70px system-ui,sans-serif'; g.fillText(String(v), 80, 86); });
const altTex = m => canvasTex('alt' + m, 256, 112, (g, w, h) => { g.fillStyle = '#0b55a8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 30px ${JP}`; g.fillText('標高', 52, 56); g.font = '800 46px system-ui,sans-serif'; g.fillText(m.toLocaleString('en') + 'm', 158, 58); });
const glowTex = () => canvasTex('glow', 128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62); gr.addColorStop(0, 'rgba(255,226,170,1)'); gr.addColorStop(0.5, 'rgba(255,210,150,0.35)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });

// terrain colour by region + height (multiplies the grass texture)
function terrainColor(flora, h, slope, out) {
  const autumn = getSeason?.() === 'autumn', winter = getSeason?.() === 'winter', summer = getSeason?.() === 'summer';
  if (flora === 'fuji') {
    if (h > 3150 + (summer ? 400 : 0) - (winter ? 900 : 0)) return out.setRGB(1.25, 1.27, 1.32);           // snow cap
    if (h > 2350) return out.setRGB(0.78 + slope * 0.1, 0.58, 0.5);                                         // red-brown scoria
    if (h > 1900) { const t = ss(1900, 2350, h); return out.setRGB(0.6 + 0.18 * t, 0.78 - 0.2 * t, 0.46 + 0.04 * t); }
    return out.setRGB(0.7, 0.92, 0.52);
  }
  if (flora === 'venus') { const t = ss(1350, 1650, h); const g0 = autumn || winter ? [0.98, 0.86, 0.52] : [0.72, 0.92, 0.5]; return out.setRGB(0.6 + (g0[0] - 0.6) * t, 0.86 + (g0[1] - 0.86) * t, 0.48 + (g0[2] - 0.48) * t); }
  if (flora === 'coast') { if (h < 4) return out.setRGB(0.82, 0.78, 0.68); return out.setRGB(0.55, 0.82, 0.46); }
  const hi = ss(400, 1000, h); return out.setRGB(0.66 + 0.36 * hi, 0.92 + 0.04 * hi, 0.5 + 0.12 * hi); // Hakone
}

class Region {
  constructor(W, meta) { this.W = W; this.m = meta; this.id = meta.id; this.state = 'idle'; this.box = meta.box; this.lots = []; this.cells = []; }
  inBox(x, z, pad = 0) { const b = this.box; return x > b[0] - pad && x < b[2] + pad && z > b[1] - pad && z < b[3] + pad; }
  load() {
    if (this.promise) return this.promise;
    this.state = 'loading';
    this.promise = this._load().then(() => { this.state = 'ready'; }).catch(e => { console.warn('region ' + this.id, e?.stack || e); this.state = 'failed'; });
    return this.promise;
  }
  async _load() {
    const W = this.W, url = f => new URL(`../../data/regions/${f}`, import.meta.url);
    const data = this.data = await (await fetch(url(this.m.file))).json();
    if (data.hakone) { const t0 = performance.now(); while (!(W.hakone && W.hakone.H) && performance.now() - t0 < 20000) await new Promise(r => setTimeout(r, 100)); if (!W.hakone?.H) throw new Error('hakone terrain not ready'); }
    if (data.bins) { const [d, f] = await Promise.all(['dem', 'far'].map(k => data.bins[k] ? fetch(url(data.bins[k])).then(r => r.arrayBuffer()) : null)); if (d) this.D = new Int16Array(d); if (f) this.F = new Int16Array(f); }
    this.G = data.grid || null;
    const b = this.box; this.ox = Math.round((b[0] + b[2]) / 2); this.oz = Math.round((b[1] + b[3]) / 2);
    this.group = new THREE.Group(); this.group.name = 'region-' + this.id; this.group.position.set(this.ox, 0, this.oz); W.group.add(this.group);
    // lots first: the touge bays keep away from them, and the ground under them is flat
    this.lots = data.lots.map(L => ({ ...L, region: this }));
    TOUGE_LOTS.push(...this.lots);
    for (const B of data.bridges || []) this.addDeck(B);
    await idle();
    this.joinNet(data.roads);
    for (const r of this.roads) if (r.kind === 'mountain') this.lots.push(...tougeBays(r).map(L => ({ ...L, region: this })));
    // road hash for nearest-road lookups (ground skirts, trees)
    this.hash = new Map(); this.CS = 40;
    this.roads.forEach((r, ri) => r.samples.forEach((q, i) => { if (i % 2) return; const k = Math.floor(q.p.x / 40) + ',' + Math.floor(q.p.z / 40); let l = this.hash.get(k); if (!l) this.hash.set(k, l = []); l.push(ri, i); }));
    // terrain: carve the DEM under the roads
    if (this.G) { this.H = Float32Array.from(this.D, v => v * this.G.scale); this.carve(); }
    this.live = true; // ground / isLand answer from here on (the meshes below stand on it)
    if (data.hakone) W.hakone.extend(this);
    await idle();
    this.buildRoads(); await idle();
    if (this.G) { this.buildTerrain(); await idle(); }
    if (this.F) { this.buildFar(); await idle(); }
    if (!data.coast) { this.buildSkirts(); await idle(); }
    this.buildTrees(); await idle();
    this.buildGrass(); await idle();
    this.buildLots(); await idle();
    this.buildSigns(); this.buildLamps(); this.buildPiers();
    if (data.coast) this.buildEnoshima();
    this.group.traverse(o => { if (o.isMesh && o.geometry && !o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); });
    this.cull(true);
  }
  // ── road network: a RoadNet of this region's roads (its own smoothing / lanes), then spliced into world.net ──
  joinNet(defs) {
    const net = this.W.net, sub = new RoadNet(defs);
    this.sub = sub; this.roads = sub.roads;
    for (const r of sub.roads) {
      r.index = net.roads.length; net.roads.push(r); net.byId[r.id] = r; r.region = this.id;
      for (let i = 0; i < r.samples.length - 1; i++) {
        const a = r.samples[i].p, b = r.samples[i + 1].p, pad = Math.max(r.edgeL, -r.edgeR) + 2, C = net.cell;
        const x0 = Math.floor((Math.min(a.x, b.x) - pad) / C), x1 = Math.floor((Math.max(a.x, b.x) + pad) / C), z0 = Math.floor((Math.min(a.z, b.z) - pad) / C), z1 = Math.floor((Math.max(a.z, b.z) + pad) / C);
        for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = x * 100003 + z; let arr = net.grid.get(k); if (!arr) net.grid.set(k, arr = []); arr.push(r.index, i); }
      }
    }
    for (const [k, v] of sub.diverges) net.diverges.set(k, [...(net.diverges.get(k) || []), ...v]);
    for (const [k, v] of sub.links) if (!net.links.has(k)) net.links.set(k, v);
    // junctions with two-way roads (findJunctions only knows one-way ramps): ends that meet another road are registered
    // as links / diverges so the guardrail wall lets you through there and traffic carries on across
    const fwdLat = r => r.lanes.filter(l => l.dir === 1).sort((a, b) => b.lat - a.lat)[0]?.lat ?? 0;
    const addDv = (road, d) => { let l = net.diverges.get(road); if (!l) net.diverges.set(road, l = []); if (!l.some(x => x.to === d.to && Math.abs(x.s - d.s) < 5)) { l.push(d); l.sort((a, b) => a.s - b.s); } };
    for (const r of sub.roads) for (const end of [0, 1]) {
      const S = r.samples, q = end ? S[S.length - 1] : S[0], t = q.t;
      for (const h of net.hits(q.p.x, q.p.z)) {
        const o = h.road; if (o === r || Math.abs(h.y - q.p.y) > 2.5 || h.lat > o.edgeL + 3 || h.lat < o.edgeR - 3) continue;
        const ot = o.samples[h.i].t, dot = ot.x * t.x + ot.z * t.z, oEnd = h.s > o.length - 15, oStart = h.s < 15;
        if (!end) { // r starts here
          if (oEnd && dot > 0.3) { if (!net.links.has(o) && o.lanesB) net.links.set(o, { to: r, s: 0, dir: 1, lat: fwdLat(r) }); else addDv(o, { s: o.length, dir: 1, to: r, lat: fwdLat(r) }); }
          else if (oStart) { addDv(o, { s: 0, dir: -1, to: r, lat: fwdLat(r) }); addDv(r, { s: 0, dir: -1, to: o, lat: fwdLat(o) }); }
          else { const dir = dot >= 0 ? 1 : -1; if (dir === 1 || o.lanesB) addDv(o, { s: h.s, dir, to: r, lat: fwdLat(r) }); addDv(r, { s: 0, dir: -1, to: o, lat: h.lat }); }
        } else if (!net.links.has(r)) { // r ends here
          if (oStart && dot > 0.3) net.links.set(r, { to: o, s: 0, dir: 1, lat: fwdLat(o) });
          else if (!oEnd) net.links.set(r, { to: o, s: h.s, dir: dot >= 0 ? 1 : -1, lat: h.lat });
        }
      }
    }
  }
  // ── terrain heights ──
  gridAt(A, x, z) { const G = this.G, fx = (x - G.x0) / G.step, fz = (z - G.z0) / G.step; const i = Math.max(0, Math.min(G.w - 2, Math.floor(fx))), j = Math.max(0, Math.min(G.h - 2, Math.floor(fz))); const u = Math.max(0, Math.min(1, fx - i)), v = Math.max(0, Math.min(1, fz - j)), k = j * G.w + i;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + G.w] * (1 - u) + A[k + G.w + 1] * u) * v; }
  inGrid(x, z, pad = 0) { const G = this.G; return !!G && x > G.x0 + pad && z > G.z0 + pad && x < G.x0 + (G.w - 1) * G.step - pad && z < G.z0 + (G.h - 1) * G.step - pad; }
  dem(x, z) { if (this.data.hakone) return this.W.hakone.dem(x, z); return this.inGrid(x, z) ? this.gridAt(this.D, x, z) * this.G.scale : 0; }
  nearest(x, z) { let best = null; const cx = Math.floor(x / this.CS), cz = Math.floor(z / this.CS);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = this.hash.get((cx + a) + ',' + (cz + b)); if (!l) continue; for (let k = 0; k < l.length; k += 2) { const q = this.roads[l[k]].samples[l[k + 1]]; const d = (q.p.x - x) ** 2 + (q.p.z - z) ** 2; if (!best || d < best.d) best = { d, r: l[k], i: l[k + 1] }; } }
    if (best) { best.d = Math.sqrt(best.d); best.road = this.roads[best.r]; best.q = best.road.samples[best.i]; } return best; }
  isBridge(q) { if (this.data.coast) return q.p.y > 1.2 && !this.islandAt(q.p.x, q.p.z); return q.p.y - this.dem(q.p.x, q.p.z) > 6; }
  islandAt(x, z) { return !!(this.G?.island && this.inGrid(x, z, 2) && this.gridAt(this.H, x, z) > 0.3); }
  carve() {
    const G = this.G, H = this.H, coast = this.data.coast;
    for (const r of this.roads) { const hw = halfW(r), S = r.samples;
      for (let n = 0; n < S.length; n += 2) { const q = S[n]; if (coast ? !this.islandAt(q.p.x, q.p.z) : this.isBridge(q)) continue;
        const R = coast ? hw + 14 : 34, i0 = Math.floor((q.p.x - R - G.x0) / G.step), i1 = Math.ceil((q.p.x + R - G.x0) / G.step), j0 = Math.floor((q.p.z - R - G.z0) / G.step), j1 = Math.ceil((q.p.z + R - G.z0) / G.step);
        for (let j = Math.max(0, j0); j <= Math.min(G.h - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(G.w - 1, i1); i++) {
          const d = Math.hypot(G.x0 + i * G.step - q.p.x, G.z0 + j * G.step - q.p.z); if (d > R) continue; const k = j * G.w + i;
          if (coast) { const base = q.p.y - 0.4, t = ss(hw + 2, R, d); H[k] = d < hw + 2 ? Math.min(H[k], base) : Math.min(H[k], base + (H[k] - base) * t + 0.01) ; }
          else H[k] = Math.min(H[k], q.p.y - 3.5);
        } } }
    for (const L of this.lots) { if (L.deck) continue; const s = Math.sin(L.yaw), c = Math.cos(L.yaw), R = Math.max(L.l, L.w) / 2 + 30;
      const i0 = Math.floor((L.x - R - G.x0) / G.step), i1 = Math.ceil((L.x + R - G.x0) / G.step), j0 = Math.floor((L.z - R - G.z0) / G.step), j1 = Math.ceil((L.z + R - G.z0) / G.step);
      for (let j = Math.max(0, j0); j <= Math.min(G.h - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(G.w - 1, i1); i++) { const dx = G.x0 + i * G.step - L.x, dz = G.z0 + j * G.step - L.z, a = dx * s + dz * c, b = dx * c - dz * s;
        if (Math.abs(a) < L.l / 2 + 26 && Math.abs(b) < L.w / 2 + 26) H[j * G.w + i] = Math.min(H[j * G.w + i], L.y - (coast ? 0.4 : 3.5)); } }
  }
  lotAt(x, z) { for (const L of this.lots) { const dx = x - L.x, dz = z - L.z; if (dx * dx + dz * dz > (L.l + L.w) * (L.l + L.w) * 0.25 + 4) continue; const s = Math.sin(L.yaw), c = Math.cos(L.yaw); const a = dx * s + dz * c, b = dx * c - dz * s; if (Math.abs(a) < L.l / 2 && Math.abs(b) < L.w / 2) return L; } return null; }
  // ground near this region's roads / lots (undefined = not ours: the caller falls back to its own ground)
  groundNear(x, z) {
    const L = this.lotAt(x, z); if (L) return L.deck ? L.y - 0.02 : L.y;
    if (this.data.coast) return undefined;
    const n = this.nearest(x, z);
    if (n && n.d < 34 && !this.isBridge(n.q)) { const hw = halfW(n.road) + 0.6, base = n.q.p.y - 0.35; return n.d < hw ? base : base + (this.dem(x, z) - base) * ss(hw, 30, n.d); }
    for (const L2 of this.lots) { if (L2.bay || L2.deck) continue; const R = Math.max(L2.l, L2.w) / 2, d = Math.hypot(x - L2.x, z - L2.z); if (d < R + 26) return L2.y + (this.dem(x, z) - L2.y) * ss(R, R + 24, d); }
    return undefined;
  }
  ground(x, z) {
    if (!this.live || !this.inBox(x, z)) return undefined;
    const g = this.groundNear(x, z); if (g !== undefined) return g;
    if (this.data.coast) return this.islandAt(x, z) ? this.gridAt(this.H, x, z) : undefined;
    if (this.inGrid(x, z)) return this.gridAt(this.H, x, z);
    if (this.F) return this.farAt(x, z);
    return undefined;
  }
  farAt(x, z) { const F = this.data.far, fx = (x - F.x0) / F.step, fz = (z - F.z0) / F.step, i = Math.max(0, Math.min(F.w - 2, Math.floor(fx))), j = Math.max(0, Math.min(F.h - 2, Math.floor(fz))), u = Math.max(0, Math.min(1, fx - i)), v = Math.max(0, Math.min(1, fz - j)), k = j * F.w + i, A = this.F;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + F.w] * (1 - u) + A[k + F.w + 1] * u) * v; }
  isLand(x, z) { if (!this.live || !this.inBox(x, z)) return undefined; if (this.data.coast) return this.islandAt(x, z) || !!this.lotAt(x, z) ? true : undefined; return true; }
  zoneAt(x, z, y) {
    if (!this.live || !this.inBox(x, z)) return null;
    const L = this.lotAt(x, z); if (L && !L.bay) return `${L.name} · ${this.m.name}`;
    const h = this.W.net.query(x, z, y); if (h.road && h.road.region === this.id) return h.road.name;
    if (this.data.hakone) return null; // the Turnpike's own labels everywhere else in the Hakone hills
    if (this.data.coast) return this.islandAt(x, z) ? '江の島' : null;
    return this.m.name;
  }
  // ── meshes ──
  local(geo) { geo.translate(-this.ox, 0, -this.oz); return geo; }
  add(o, cullR = 0) { this.group.add(o); if (cullR) { o.userData.cullR = cullR; this.cells.push(o); } return o; }
  buildRoads() {
    const net = this.W.net, view = Object.create(net); view.roads = this.roads; view.hits = net.hits.bind(net); // markings clipped against every road (main network included)
    const g = buildRoadMeshes(view, {});
    for (const m of [...g.children]) {
      if (m.isInstancedMesh) { const M = new THREE.Matrix4(); for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); M.elements[12] -= this.ox; M.elements[14] -= this.oz; m.setMatrixAt(i, M); } m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }
      else if (m.geometry) { this.local(m.geometry); m.geometry.computeBoundingSphere(); }
      this.add(m, 2600);
    }
  }
  terrainMat() { if (this._tm) return this._tm; const m = surface('grass', { tile: 6, tint: 0xffffff }).clone(); m.vertexColors = true; return (this._tm = m); }
  buildTerrain() {
    const G = this.G, H = this.H, st = this.W.q === 'low' && !G.island ? 2 : 1, CH = 64 * st, C = new THREE.Color(), flora = this.data.flora;
    for (let cj = 0; cj < G.h - 1; cj += CH) for (let ci = 0; ci < G.w - 1; ci += CH) {
      const nw = Math.floor(Math.min(CH, G.w - 1 - ci) / st), nh = Math.floor(Math.min(CH, G.h - 1 - cj) / st); if (nw < 1 || nh < 1) continue;
      const pos = new Float32Array((nw + 1) * (nh + 1) * 3), col = new Float32Array(pos.length), uv = new Float32Array((nw + 1) * (nh + 1) * 2), idx = [];
      let any = false;
      for (let b = 0; b <= nh; b++) for (let a = 0; a <= nw; a++) {
        const i = ci + a * st, j = cj + b * st, k = j * G.w + i, v = b * (nw + 1) + a, x = G.x0 + i * G.step, z = G.z0 + j * G.step, h = H[k];
        pos[v * 3] = x - this.ox; pos[v * 3 + 1] = h; pos[v * 3 + 2] = z - this.oz; uv[v * 2] = x - this.ox; uv[v * 2 + 1] = z - this.oz;
        const sl = Math.min(1, Math.abs(H[Math.min(G.w * G.h - 1, k + 1)] - H[Math.max(0, k - 1)]) / (G.step * 2)); terrainColor(flora, h, sl, C); col[v * 3] = C.r; col[v * 3 + 1] = C.g; col[v * 3 + 2] = C.b;
        if (h > -2) any = true;
      }
      if (G.island && !any) continue;
      for (let b = 0; b < nh; b++) for (let a = 0; a < nw; a++) { const v = b * (nw + 1) + a; idx.push(v, v + nw + 1, v + 1, v + 1, v + nw + 1, v + nw + 2); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, this.terrainMat()); m.receiveShadow = true; this.add(m, 6500);
    }
  }
  // coarse far ring (distant mountains, the upper slopes of Fuji): a hole where the detailed grid is, sunk a little
  buildFar() {
    const F = this.data.far, A = this.F, G = this.G, C = new THREE.Color(), flora = this.data.flora;
    const gx1 = G.x0 + (G.w - 1) * G.step, gz1 = G.z0 + (G.h - 1) * G.step, inside = (x, z) => x > G.x0 && x < gx1 && z > G.z0 && z < gz1;
    const pos = new Float32Array(F.w * F.h * 3), col = new Float32Array(F.w * F.h * 3), idx = [];
    for (let j = 0; j < F.h; j++) for (let i = 0; i < F.w; i++) { const k = j * F.w + i, x = F.x0 + i * F.step, z = F.z0 + j * F.step; let h = A[k];
      if (inside(x, z)) h = Math.min(h, this.gridAt(this.H, x, z) * 1) - 6;
      pos[k * 3] = x - this.ox; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z - this.oz; terrainColor(flora, h, 0.3, C);
      const far = Math.min(1, Math.max(0, Math.max(G.x0 - x, x - gx1, G.z0 - z, z - gz1)) / 12000), hz = 0.1 + 0.3 * far; col[k * 3] = C.r * 0.8 * (1 - hz) + 0.62 * hz; col[k * 3 + 1] = C.g * 0.8 * (1 - hz) + 0.7 * hz; col[k * 3 + 2] = C.b * 0.8 * (1 - hz) + 0.82 * hz; }
    const cellIn = (i, j) => inside(F.x0 + i * F.step, F.z0 + j * F.step) && inside(F.x0 + (i + 1) * F.step, F.z0 + (j + 1) * F.step);
    for (let j = 0; j < F.h - 1; j++) for (let i = 0; i < F.w - 1; i++) { if (cellIn(i, j)) continue; const v = j * F.w + i; idx.push(v, v + F.w, v + 1, v + 1, v + F.w, v + F.w + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })); m.receiveShadow = false; m.name = 'far-terrain'; this.add(m);
    this.farMesh = m;
  }
  // cut / fill slopes along both sides of the mountain roads, meeting the terrain 30 m out (as on the Turnpike)
  buildSkirts() {
    const mat = this.terrainMat(), rows = [0, 2, 5, 9, 15, 22, 30], C = new THREE.Color(), flora = this.data.flora;
    for (const road of this.roads) {
      if (road.kind !== 'mountain') continue;
      const S = road.samples, hw = halfW(road) + 0.55, n = Math.ceil(S.length / 2), CHK = 400;
      for (let c0 = 0; c0 < n - 1; c0 += CHK) {
        const c1 = Math.min(n - 1, c0 + CHK), sp = [], sc = [], si = [], uv = [];
        for (const side of [1, -1]) {
          const base = sp.length / 3;
          for (let a = c0; a <= c1; a++) { const i = Math.min(S.length - 1, a * 2), q = S[i], br = this.isBridge(q);
            for (const r of rows) { const d = hw + r, x = q.p.x + q.left.x * d * side, z = q.p.z + q.left.z * d * side;
              const nn = this.nearest(x, z), clash = nn && (nn.road !== road || Math.abs(nn.i - i) > 30) && nn.d < r + 2;
              const Lb = this.lotAt(x, z); const y = Lb ? Lb.y - 0.08 : (clash || br) ? q.p.y - 0.4 - (br ? 3 : 0) : q.p.y - 0.12 + (this.dem(x, z) - q.p.y) * ss(0, 30, r);
              sp.push(x - this.ox, y, z - this.oz); uv.push(x - this.ox, z - this.oz); const rock = Math.min(1, Math.abs(y - q.p.y) / Math.max(1, r) * 0.9);
              terrainColor(flora, y, rock, C); sc.push(C.r * (0.72 + rock * 0.2), C.g * (0.62 + rock * 0.1), C.b * (0.62 + rock * 0.2)); } }
          const nr = rows.length, ns = c1 - c0 + 1;
          for (let a = 0; a < ns - 1; a++) { const i0 = Math.min(S.length - 1, (c0 + a) * 2), i1 = Math.min(S.length - 1, (c0 + a + 1) * 2); if (this.isBridge(S[i0]) && this.isBridge(S[i1])) continue;
            for (let b = 0; b < nr - 1; b++) { const v = base + a * nr + b; if (side > 0) si.push(v, v + nr, v + 1, v + 1, v + nr, v + nr + 1); else si.push(v, v + 1, v + nr, v + 1, v + nr + 1, v + nr); } }
        }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(si); sg.computeVertexNormals(); sg.computeBoundingSphere();
        const m = new THREE.Mesh(sg, mat); m.receiveShadow = true; this.add(m, 3500);
      }
    }
  }
  groundAt(x, z) { const g = this.W.ground(x, z); return g; }
  onAnyRoad(x, z, pad) { for (const h of this.W.net.hits(x, z)) if (!h.beyond && h.lat <= h.road.edgeL + pad && h.lat >= h.road.edgeR - pad) return true; return false; }
  // forest by altitude: Hakone cedar / maple, Fuji's larch-fir-beech belt thinning out above 2,300 m, the Venus Line's
  // open highland meadows with larch / birch stands lower down, black pines along the Shōnan shore
  buildTrees() {
    const fl = this.data.flora, spots = []; let seed = 7 + this.id.length * 131; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const density = y => fl === 'fuji' ? (y < 1900 ? 1 : y < 2300 ? 0.55 : y < 2450 ? 0.12 : 0) : fl === 'venus' ? (y < 1350 ? 1 : y < 1650 ? 0.45 : 0.06) : fl === 'coast' ? 1 : (y > 900 ? 0.3 : 1);
    const pick = (y, h) => fl === 'fuji' ? (y > 2250 ? 'pine' : y > 1700 ? (h < 0.6 ? 'cedar' : 'far') : h < 0.45 ? 'cedar' : h < 0.75 ? 'zelkova' : 'maple')
      : fl === 'venus' ? (y > 1500 ? (h < 0.5 ? 'zelkova' : 'cedar') : h < 0.55 ? 'cedar' : h < 0.8 ? 'zelkova' : 'maple')
      : fl === 'coast' ? (h < 0.8 ? 'pine' : 'camphor') : (h < 0.62 ? 'cedar' : h < 0.82 ? 'maple' : 'zelkova');
    const per = fl === 'venus' ? 5 : 7;
    for (const road of this.roads) { const S = road.samples, hw = halfW(road);
      for (let i = 0; i < S.length; i += 6) for (let k = 0; k < per; k++) {
        const q = S[i], side = rnd() < 0.5 ? 1 : -1, d = (fl === 'coast' ? hw + 6 : 26) + rnd() * rnd() * (fl === 'coast' ? 90 : 520), along = (rnd() - 0.5) * 30;
        const x = q.p.x + q.left.x * d * side + q.t.x * along, z = q.p.z + q.left.z * d * side + q.t.z * along;
        if (fl === 'coast') { if (!this.islandAt(x, z) && !this.W.isLand(x, z)) continue; if (this.W.city?.maskAt?.(x, z) >= 1) continue; }
        const n = this.nearest(x, z); if (n && n.d < (fl === 'coast' ? hw + 4 : 22)) continue;
        if (this.lotAt(x, z) || this.lots.some(L => Math.hypot(x - L.x, z - L.z) < Math.max(L.l, L.w) / 2 + 20) || this.onAnyRoad(x, z, 4)) continue;
        const y = this.W.ground(x, z); if (rnd() > density(y)) continue; if (fl === 'coast' && y < 0.5 && this.islandAt(x, z)) continue;
        const h = rnd(); spots.push([x, y, z, pick(y, h), 0.75 + rnd() * 0.6 * (y > 2250 && fl === 'fuji' ? 0.5 : 1), rnd() * 6.28, rnd()]);
      } }
    const Gs = speciesGeos(), mat = floraMaterial(), C = new THREE.Color(), o = new THREE.Object3D(), by = {};
    for (const s of spots) { const key = s[3] + '|' + Math.floor(s[0] / 1000) + ',' + Math.floor(s[2] / 1000); (by[key] ||= []).push(s); }
    for (const [key, list] of Object.entries(by)) { const k = key.split('|')[0]; const m = new THREE.InstancedMesh(Gs[k], mat, list.length);
      list.forEach((s, i) => { o.position.set(s[0] - this.ox, s[1] - 0.3, s[2] - this.oz); o.scale.setScalar(s[4] * (k === 'cedar' || k === 'far' ? 1.5 : 1.1)); o.rotation.y = s[5]; o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, speciesColor(k, s[6], C)); });
      registerTrees(m, k, Float32Array.from(list.map(s => s[6]))); m.computeBoundingSphere(); this.add(m, 2200); }
    this.treeCount = spots.length;
  }
  buildGrass() {
    const Q = this.W.q || 'high', fl = this.data.flora, km = this.roads.reduce((a, r) => a + r.length, 0) / 1000, n0 = Math.round((Q === 'low' ? 180 : Q === 'medium' ? 450 : 1000) * km * (fl === 'venus' ? 1.6 : fl === 'coast' ? 0.4 : 1));
    if (!n0) return; const mat = floraMaterial(), geo = grassGeometry(), C = new THREE.Color(), o = new THREE.Object3D(); let sd = 3 + this.id.length; const r2 = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const cells = new Map(); let n = 0;
    for (let t = 0; t < n0 * 3 && n < n0; t++) { const road = this.roads[Math.floor(r2() * this.roads.length)], S = road.samples, q = S[Math.floor(r2() * S.length)], hw = halfW(road) + (road.street ? (road.sidewalk || 0) + 1 : 0.6), side = r2() < 0.5 ? 1 : -1, d = hw + 1.5 + r2() * r2() * (fl === 'venus' ? 80 : 40);
      const x = q.p.x + q.left.x * d * side, z = q.p.z + q.left.z * d * side; if (this.lotAt(x, z) || this.onAnyRoad(x, z, 1.2)) continue;
      if (fl === 'coast' && !this.islandAt(x, z) && (!this.W.isLand(x, z) || this.W.city?.maskAt?.(x, z) >= 1)) continue;
      const y = this.W.ground(x, z); if (Math.abs(y - q.p.y) > 14 || y < 0.2 && fl === 'coast') continue;
      o.position.set(x - this.ox, y - 0.05, z - this.oz); o.rotation.y = r2() * 6.28; const sc = 1.1 + r2() * 1.6; o.scale.set(sc, sc * (0.8 + r2() * 0.9), sc); o.updateMatrix();
      const gold = r2() * 0.5 + (fl === 'venus' ? 0.5 : ss(300, 900, y) * 0.5); const key = Math.floor(x / 600) + ',' + Math.floor(z / 600); let l = cells.get(key); if (!l) cells.set(key, l = []); l.push([o.matrix.clone(), 0.55 + 0.35 * gold, 0.58 + 0.12 * gold]); n++; }
    for (const list of cells.values()) { const m = new THREE.InstancedMesh(geo, mat, list.length); list.forEach(([M, r, g], i) => { m.setMatrixAt(i, M); m.setColorAt(i, C.setRGB(r, g, 0.28)); }); m.computeBoundingSphere(); this.add(m, 450); }
  }
  // ── car parks / view points / emergency bays ──
  buildLots() {
    const W = this.W, asphalt = surface('asphalt_worn', { tile: 6, tint: 0x8a8a8a }), white = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
    const conc = surface('concrete', { tile: 3 }), dark = new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6, metalness: 0.3 });
    const glass = W.night(new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.08, metalness: 0.5, emissive: 0xffe2b0, emissiveIntensity: 0 }), 0, 1.2);
    const vm = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4, emissive: 0xdde8ff, emissiveIntensity: 0.25 });
    const roofM = new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.8 });
    const add = (geo, mat, L, a, y, b, rot = 0) => { const m = new THREE.Mesh(geo, mat); const s = Math.sin(L.yaw), c = Math.cos(L.yaw); m.position.set(L.x + s * a + c * b - this.ox, y, L.z + c * a - s * b - this.oz); m.rotation.y = L.yaw + rot; m.castShadow = m.receiveShadow = true; this.add(m, 1800); return m; };
    const col = (L, a, b, hx, hz, y0, y1) => { const s = Math.sin(L.yaw), c = Math.cos(L.yaw); W.addCollider(L.x + s * a + c * b, L.z + c * a - s * b, hx, hz, L.yaw, y0, y1, 'wall'); };
    this.lampSpots = this.lampSpots || [];
    for (const L of this.lots) {
      if (L.deck) continue;
      if (L.bay) { // touge emergency bay (as on the Turnpike)
        add(new THREE.BoxGeometry(L.w + 0.6, 0.3, L.l), asphalt, L, 0, L.y - 0.155, 0); add(new THREE.BoxGeometry(L.w + 0.5, 3, L.l - 0.2), conc, L, 0, L.y - 1.8, 0);
        add(new THREE.BoxGeometry(0.08, 0.32, L.l + 10), white, L, 0, L.y + 0.7, L.side * (L.w / 2 + 0.25));
        for (let a = -L.l / 2 - 4; a <= L.l / 2 + 4; a += 4) add(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), dark, L, a, L.y + 0.4, L.side * (L.w / 2 + 0.35));
        add(new THREE.BoxGeometry(0.15, 0.02, L.l), white, L, 0, L.y + 0.01, -L.side * (L.w / 2 - 0.1));
        const sm = new THREE.MeshStandardMaterial({ map: nameTex(L.name, L.name === '非常駐車帯' ? 'EMERGENCY PARKING' : 'PARKING', L.name === '非常駐車帯' ? 'green' : 'blue'), roughness: 0.5 });
        add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), dark, L, -L.l / 2 + 1, L.y + 1.2, L.side * (L.w / 2 + 0.4)); add(new THREE.BoxGeometry(0.9, 0.34, 0.03), sm, L, -L.l / 2 + 1, L.y + 2.3, L.side * (L.w / 2 + 0.4), Math.PI / 2);
        continue;
      }
      add(new THREE.BoxGeometry(L.w, 0.3, L.l), asphalt, L, 0, L.y - 0.13, 0);
      add(new THREE.BoxGeometry(L.w + 0.4, 6, L.l + 0.4), conc, L, 0, L.y - 3.3, 0); // retaining wall / fill under the lot
      if (L.kind !== 'lay') { const rows = L.w > 30 ? [-L.w / 2 + 3, L.w / 2 - 3] : [L.w / 2 - 3]; for (const b of rows) for (let a = -L.l / 2 + 4; a < L.l / 2 - 3; a += 2.6) add(new THREE.BoxGeometry(5, 0.02, 0.12), white, L, a, L.y + 0.03, b, Math.PI / 2); }
      // railing on the far side (towards the view)
      for (let a = -L.l / 2; a < L.l / 2; a += 2.5) add(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6), dark, L, a, L.y + 0.55, (L.side || 1) * (L.w / 2 - 0.2));
      add(new THREE.BoxGeometry(0.06, 0.06, L.l), dark, L, 0, L.y + 1.08, (L.side || 1) * (L.w / 2 - 0.2));
      col(L, 0, (L.side || 1) * (L.w / 2 + 0.1), 0.25, L.l / 2, L.y - 1, L.y + 1.2);
      // name board
      const sm = new THREE.MeshStandardMaterial({ map: nameTex(L.name, `${Math.round(L.y).toLocaleString('en')} m`), roughness: 0.7 }), sb = (L.side || 1) * (L.w / 2 - 1.4);
      add(new THREE.BoxGeometry(0.1, 1.2, 3.2), sm, L, -L.l / 2 + 4, L.y + 2.0, sb); for (const d of [-1.3, 1.3]) add(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), dark, L, -L.l / 2 + 4 + d, L.y + 1.3, sb);
      if (L.kind === 'summit' || L.kind === 'lot') { // rest house / toilets, vending machines
        const big = L.kind === 'summit', bw = big ? 12 : 7, bl = big ? 26 : 9, b = (L.side || 1) * (L.w / 2 + bw / 2 + 1.5), a = big ? 0 : L.l / 2 - 10;
        add(new THREE.BoxGeometry(bw, big ? 5.5 : 3.2, bl), conc, L, a, L.y + (big ? 2.75 : 1.6), b); add(new THREE.BoxGeometry(bw + 2, 0.5, bl + 2), roofM, L, a, L.y + (big ? 5.8 : 3.4), b);
        add(new THREE.BoxGeometry(0.2, big ? 3.6 : 1.4, bl - 3), glass, L, a, L.y + (big ? 2.2 : 1.8), b - (L.side || 1) * (bw / 2 + 0.05));
        col(L, a, b, bw / 2, bl / 2, L.y - 1, L.y + 6);
        for (let k = 0; k < (big ? 4 : 2); k++) add(new THREE.BoxGeometry(0.8, 1.85, 1), vm, L, a - bl / 2 + 2 + k * 1.1, L.y + 0.93, b - (L.side || 1) * (bw / 2 + 0.6));
        for (let a2 = -L.l / 2 + 8; a2 < L.l / 2 - 4; a2 += 22) this.lampSpots.push({ x: L.x + Math.sin(L.yaw) * a2 + Math.cos(L.yaw) * (-(L.side || 1) * (L.w / 2 - 1)), z: L.z + Math.cos(L.yaw) * a2 - Math.sin(L.yaw) * (-(L.side || 1) * (L.w / 2 - 1)), y: L.y, yaw: L.yaw + ((L.side || 1) > 0 ? 0 : Math.PI), h: 7 });
      }
    }
  }
  // ── roadside signs: route shields at the ends, chevrons round the hairpins, altitude plates, speed limits ──
  buildSigns() {
    const posts = [], boards = new Map(), push = (tex, x, y, z, yaw, w, h, postH) => { let l = boards.get(tex); if (!l) boards.set(tex, l = []); l.push([x, y + postH, z, yaw, w, h]); posts.push([x, y, z, postH]); };
    let cheva = 0;
    for (const r of this.roads) {
      const S = r.samples, hw = halfW(r), mtn = r.kind === 'mountain', off = hw + (mtn ? 0.9 : (r.sidewalk || 0) + 0.6), nat = /国道/.test(r.name);
      const sideAt = (i, side) => { const q = S[i]; return [q.p.x + q.left.x * off * side, q.p.z + q.left.z * off * side]; };
      const yawOf = (i, dir) => Math.atan2(S[i].t.x * dir, S[i].t.z * dir) + Math.PI; // board faces oncoming traffic
      // route shield + speed limit near both ends (left side of each direction)
      if (r.ref) for (const [i, dir] of [[Math.min(S.length - 1, 40), 1], [Math.max(0, S.length - 41), -1]]) { const [x, z] = sideAt(i, dir); push(shieldTex(r.ref, nat), x, S[i].p.y, z, yawOf(i, dir), 0.9, 0.9, 2.2); }
      for (let i = 300; i < S.length - 300; i += 1500) for (const dir of [1, -1]) { const k = i + (dir > 0 ? 0 : 20); const [x, z] = sideAt(k, dir); push(speedTex(r.speed || 40), x, S[k].p.y, z, yawOf(k, dir), 0.7, 0.7, 2.0); }
      if (!mtn) continue;
      // hairpins / sharp bends: heading change over ±12 m → chevron boards on the outside of the bend
      for (let i = 12; i < S.length - 12; i++) {
        const a = S[i - 12].t, b = S[i + 12].t, cr = a.x * b.z - a.z * b.x, dt = a.x * b.x + a.z * b.z; if (dt > 0.35) continue; // > ~70° in 24 m
        let j = i, best = dt; for (let k = i; k < Math.min(S.length - 12, i + 30); k++) { const a2 = S[k - 12].t, b2 = S[k + 12].t, d2 = a2.x * b2.x + a2.z * b2.z; if (d2 < best) { best = d2; j = k; } }
        const outside = cr > 0 ? 1 : -1; // turning right (cr > 0 in x/z with +z south) → outside is the left
        for (const o of [-8, 0, 8]) { const k = Math.max(0, Math.min(S.length - 1, j + Math.round(o / 2))); const q = S[k], d = hw + 1.1; const x = q.p.x + q.left.x * d * outside, z = q.p.z + q.left.z * d * outside;
          for (const dir of [1, -1]) push(chevronTex(outside * dir), x + q.t.x * 0.15 * dir, q.p.y, z + q.t.z * 0.15 * dir, yawOf(k, dir), 0.45, 0.56, 0.9); }
        cheva++; i = j + 24;
      }
      // altitude plates every 100 m of height (富士山スカイライン / ビーナスライン style)
      let last = Math.floor(S[0].p.y / 100); for (let i = 1; i < S.length; i++) { const m = Math.floor(S[i].p.y / 100); if (m !== last) { const up = m > last ? 1 : -1, alt = Math.max(m, last) * 100; const [x, z] = sideAt(i, up); push(altTex(alt), x, S[i].p.y, z, yawOf(i, up), 1.1, 0.48, 1.9); last = m; i += 60; } }
    }
    const o = new THREE.Object3D();
    for (const [tex, list] of boards) { const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.4, roughness: 0.5, side: THREE.DoubleSide }), list.length);
      list.forEach(([x, y, z, yaw, w, h], i) => { o.position.set(x - this.ox, y + h / 2, z - this.oz); o.rotation.set(0, yaw, 0); o.scale.set(w, h, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.computeBoundingSphere(); this.add(m, 900); }
    if (posts.length) { const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 }), posts.length);
      posts.forEach(([x, y, z, h], i) => { o.position.set(x - this.ox, y, z - this.oz); o.rotation.set(0, 0, 0); o.scale.set(1, h, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.computeBoundingSphere(); this.add(m, 900); }
    this.signCount = posts.length; this.hairpins = cheva;
  }
  // ── night lighting: lamp posts at the car parks and along the coast road, lit heads + light pools on the ground ──
  buildLamps() {
    const W = this.W, spots = this.lampSpots || [];
    for (const r of this.roads) if (r.street) { const S = r.samples, off = halfW(r) + (r.sidewalk || 0) * 0.5; for (let i = 10; i < S.length - 10; i += 20) { const q = S[i], side = (i / 20) % 2 ? 1 : -1; if (q.p.y > 1.5 && !this.islandAt(q.p.x, q.p.z) && i % 40) continue; const x = q.p.x + q.left.x * off * side, z = q.p.z + q.left.z * off * side; if (this.onAnyRoad(x, z, -0.2)) continue; spots.push({ x, z, y: q.p.y, yaw: Math.atan2(q.left.x * -side, q.left.z * -side), h: 9, arm: off - halfW(r) + 2.4 }); } }
    if (!spots.length) return;
    const o = new THREE.Object3D(), pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.13, 1, 8).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x8c9196, metalness: 0.6, roughness: 0.45 }), spots.length);
    const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.14, 0.32), W.night(new THREE.MeshStandardMaterial({ color: 0xdedcd2, emissive: 0xffe6b8, emissiveIntensity: 0 }), 0, 2.4), spots.length);
    const pm = W.night(new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }), 0, 0.5); pm.userData.opacityMode = true;
    const pool = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), pm, spots.length);
    spots.forEach((s, i) => { const arm = s.arm ?? 1.6, hx = s.x + Math.sin(s.yaw) * arm, hz = s.z + Math.cos(s.yaw) * arm;
      o.position.set(s.x - this.ox, s.y, s.z - this.oz); o.rotation.set(0, 0, 0); o.scale.set(1, s.h, 1); o.updateMatrix(); pole.setMatrixAt(i, o.matrix);
      o.position.set(hx - this.ox, s.y + s.h, hz - this.oz); o.rotation.set(0, s.yaw, 0); o.scale.set(1, 1, 1); o.updateMatrix(); head.setMatrixAt(i, o.matrix);
      o.position.set(hx - this.ox, s.y + 0.06, hz - this.oz); o.rotation.set(0, 0, 0); o.scale.set(16, 1, 16); o.updateMatrix(); pool.setMatrixAt(i, o.matrix); });
    for (const m of [pole, head, pool]) { m.computeBoundingSphere(); this.add(m, 2400); } pool.renderOrder = 2; pole.castShadow = true;
    this.lampCount = spots.length;
  }
  // bridge piers + girders wherever a road runs well above the ground (the Enoshima bridge, valley bridges)
  buildPiers() {
    const conc = surface('pier', { tile: 4 }), legs = [], decks = [];
    for (const r of this.roads) { const S = r.samples, hw = halfW(r);
      let run = null; const flush = () => { if (run && run[1] - run[0] > 4) decks.push([r, run[0], run[1]]); run = null; };
      for (let i = 0; i < S.length; i++) { const q = S[i], gy = this.W.ground(q.p.x, q.p.z), under = this.data.coast ? (this.islandAt(q.p.x, q.p.z) ? this.gridAt(this.H, q.p.x, q.p.z) : this.W.isLand(q.p.x, q.p.z) ? 0 : -12) : this.dem(q.p.x, q.p.z);
        const high = q.p.y - under > 3 && (this.data.coast || this.isBridge(q)); void gy;
        if (high) { if (!run) run = [i, i]; run[1] = i; if (i % 15 === 0) legs.push([q.p.x, under - 2, q.p.z, q.p.y - 1.4, Math.atan2(q.t.x, q.t.z), hw]); } else flush(); }
      flush(); }
    const o = new THREE.Object3D();
    if (legs.length) { const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), conc, legs.length);
      legs.forEach(([x, y0, z, y1, yaw, hw], i) => { o.position.set(x - this.ox, y0, z - this.oz); o.rotation.set(0, yaw, 0); o.scale.set(hw * 1.2, Math.max(0.5, y1 - y0), 1.6); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.computeBoundingSphere(); m.castShadow = true; this.add(m, 3000); }
    // girder: a 1.3 m deep slab under the deck along each bridge run (the street / mountain road meshes are a thin ribbon)
    for (const [r, i0, i1] of decks) { const S = r.samples, hw = halfW(r) + 0.3, pos = [], idx = [];
      for (let i = i0; i <= i1; i += 2) { const q = S[i]; for (const [l, dy] of [[hw, -0.05], [hw, -1.35], [-hw, -1.35], [-hw, -0.05]]) pos.push(q.p.x + q.left.x * l - this.ox, q.p.y + dy, q.p.z + q.left.z * l - this.oz); }
      const n = pos.length / 12; for (let a = 0; a < n - 1; a++) for (let f = 0; f < 3; f++) { const v = a * 4 + f, w = v + 4; idx.push(v, w, v + 1, v + 1, w, w + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); g.setIndex(idx); g.computeVertexNormals();
      const mm = new THREE.Mesh(g, conc.clone()); mm.material.side = THREE.DoubleSide; this.add(mm, 3000);
      // railings along street bridges (mountain roads already have their guardrails)
      if (r.street) for (const side of [1, -1]) { const rp = []; for (let i = i0; i <= i1; i += 2) { const q = S[i], l = (side > 0 ? r.edgeL + (r.sidewalk || 0) : r.edgeR - (r.sidewalk || 0)); rp.push(new THREE.Vector3(q.p.x + q.left.x * l - this.ox, q.p.y + 1.1, q.p.z + q.left.z * l - this.oz)); }
        if (rp.length > 1) { const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), rp.length * 2, 0.06, 5, false); this.add(new THREE.Mesh(tube, new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.5, roughness: 0.4 })), 2000); } }
    }
  }
  // pedestrian bridge (江の島弁天橋): a deck you can walk (and, if you must, drive) along, with railings
  addDeck(B) {
    const P = B.pts; this.decks = this.decks || [];
    for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az); this.lots.push({ name: B.name, deck: true, x: (ax + bx) / 2, z: (az + bz) / 2, y: 3.2, yaw: Math.atan2(bx - ax, bz - az), l: L + 2, w: B.w, region: this }); }
    this.decks.push(B);
  }
  buildEnoshima() {
    const W = this.W, conc = surface('concrete', { tile: 3 }), rail = new THREE.MeshStandardMaterial({ color: 0xc9d0d6, metalness: 0.5, roughness: 0.45 });
    for (const L of this.lots) { if (!L.deck) continue; const g = new THREE.BoxGeometry(L.w, 0.5, L.l); const m = new THREE.Mesh(g, conc); m.position.set(L.x - this.ox, L.y - 0.25, L.z - this.oz); m.rotation.y = L.yaw; m.receiveShadow = true; this.add(m, 3000);
      for (const sd of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, L.l), rail); r.position.set(L.x + Math.cos(L.yaw) * sd * L.w / 2 - this.ox, L.y + 0.5, L.z - Math.sin(L.yaw) * sd * L.w / 2 - this.oz); r.rotation.y = L.yaw; this.add(r, 3000); }
      for (let a = -L.l / 2 + 6; a < L.l / 2; a += 18) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 8, 10), conc); p.position.set(L.x + Math.sin(L.yaw) * a - this.ox, L.y - 4.5, L.z + Math.cos(L.yaw) * a - this.oz); this.add(p, 3000); } }
    // 江の島シーキャンドル (lighthouse observation tower) on the island's summit, its lantern lit at night
    let top = null; if (this.G) { const G = this.G; for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const h = this.H[j * G.w + i]; if (!top || h > top.h) top = { h, x: G.x0 + i * G.step, z: G.z0 + j * G.step }; } }
    if (top) { const white = new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.5 }), lamp = W.night(new THREE.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xfff0c0, emissiveIntensity: 0.1 }), 0.1, 3.0);
      const t = new THREE.Group(); t.position.set(top.x - this.ox, top.h - 1, top.z - this.oz);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 4.2, 42, 12, 1, true), white); shaft.position.y = 21; t.add(shaft);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 46, 8), white); core.position.y = 23; t.add(core);
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 4, 16), new THREE.MeshStandardMaterial({ color: 0x9fb3c4, roughness: 0.1, metalness: 0.5, emissive: 0xffe2b0, emissiveIntensity: 0 })); deck.position.y = 44; W.night(deck.material, 0, 0.9); t.add(deck);
      const lan = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 3, 12), lamp); lan.position.y = 48.5; t.add(lan);
      this.add(t); W.addCollider(top.x, top.z, 4.2, 4.2, 0, top.h - 2, top.h + 50, 'wall'); this.candle = lan; }
  }
  cull(force) {
    const cam = this.W.cam; if (!cam || !this.group) return;
    const show = this.inBox(cam.position.x, cam.position.z, 9000); this.group.visible = show; if (!show) return;
    const f = this.W.q === 'low' ? 0.6 : 1, cx = cam.position.x - this.ox, cz = cam.position.z - this.oz, cy = cam.position.y, v = new THREE.Vector3();
    for (const m of this.cells) { const b = m.isInstancedMesh ? m.boundingSphere : m.geometry.boundingSphere; if (!b) continue; v.copy(b.center).add(m.position); m.visible = Math.hypot(v.x - cx, v.y - cy, v.z - cz) - b.radius < m.userData.cullR * f; }
    void force;
  }
  spawnPoint() {
    const sp = this.m.spawn, r = this.W.net.byId[sp.road];
    if (!r) return { pos: new THREE.Vector3(sp.x, sp.y + 0.3, sp.z), yaw: sp.yaw };
    const s = Math.min(r.length - 30, sp.s), L = r.lanes.filter(l => l.dir === 1).sort((a, b) => b.lat - a.lat)[0] || r.lanes[0], p = r.at(s, L.lat), d = r.dirAt(s);
    const y = this.W.net.query(p.x, p.z, p.y + 1, (x, z) => this.W.ground(x, z)).y; return { pos: new THREE.Vector3(p.x, y + 0.3, p.z), yaw: Math.atan2(d.x, d.z) };
  }
}

export class Regions {
  constructor(world) { this.w = world; this.list = REGIONS.map(m => new Region(world, m)); this.t = 0; }
  byId(id) { return this.list.find(r => r.id === id) || null; }
  ready() { return this.list.filter(r => r.state === 'ready'); }
  ensure(id) { const r = this.byId(id); return r ? r.load() : Promise.resolve(); }
  ground(x, z) { for (const r of this.list) { if (!r.live || r.data.hakone) continue; const g = r.ground(x, z); if (g !== undefined) return g; } return undefined; }
  isLand(x, z) { for (const r of this.list) { if (!r.live || r.data.hakone) continue; const g = r.isLand(x, z); if (g !== undefined) return g; } return undefined; }
  zoneAt(x, z, y) { for (const r of this.list) { if (r.state !== 'ready') continue; const s = r.zoneAt(x, z, y); if (s) return s; } return null; }
  lotAt(x, z) { for (const r of this.list) { if (r.state !== 'ready' || !r.inBox(x, z)) continue; const L = r.lotAt(x, z); if (L) return L; } return null; }
  update(env, dt = 0.016) {
    const cam = this.w.cam; if (!cam) return; this.t -= dt;
    if (this.t <= 0) { this.t = 0.5;
      for (const r of this.list) { if (r.state === 'idle' && r.inBox(cam.position.x, cam.position.z, 2500)) r.load(); if (r.state === 'ready') r.cull(); } }
    // the distant Mt Fuji backdrop (bay.js buildFuji, scaled for the view from Tokyo Bay) must not stand beside the real
    // one: hidden while the real mountain is loaded within view; west of Odawara it moves to Fuji's true bearing
    const F = this.w.fuji; if (F) { if (!F.userData.home) F.userData.home = F.position.clone();
      const fs = this.byId('fujisky'), real = fs?.state === 'ready' && fs.inBox(cam.position.x, cam.position.z, 30000);
      F.visible = !real;
      if (!real && cam.position.x < -30000) { const P = FUJI_XZ, dx = P[0] - cam.position.x, dz = P[1] - cam.position.z, D = Math.hypot(dx, dz) || 1, k = F.userData.k || (F.userData.k = Math.hypot(F.userData.home.x, F.userData.home.z) / Math.hypot(P[0], P[1]));
        F.position.set(cam.position.x + dx * k, F.userData.home.y, cam.position.z + dz * k); void D; }
      else F.position.copy(F.userData.home); }
  }
  // hooks into the game: travelling / spawning into a region that is not loaded yet waits for it behind the loading screen
  install(g) {
    const R = this; this.g = g;
    const rs = g.regionSpawn.bind(g); g.regionSpawn = region => { const r = R.byId(region); if (r) return r.state === 'ready' ? r.spawnPoint() : { pos: new THREE.Vector3(r.m.spawn.x, r.m.spawn.y + 0.3, r.m.spawn.z), yaw: r.m.spawn.yaw }; return rs(region); };
    const wait = async (r) => { if (!r || r.state === 'ready' || r.state === 'failed') return; const el = document.getElementById('loading'); el?.classList.add('show'); let p = 0.1; const tm = setInterval(() => { p = Math.min(0.9, p + 0.04); g.ui?.loading?.(p, r.m.name); }, 120); try { await r.load(); } finally { clearInterval(tm); g.ui?.loading?.(1, r.m.name); } };
    const sd = g.startDrive.bind(g); g.startDrive = (id, keepPos = false) => { const r = !keepPos && R.byId(g.spawnReq || g.settings.spawn); if (r && r.state !== 'ready' && r.state !== 'failed') { wait(r).then(() => sd(id, keepPos)); return; } return sd(id, keepPos); };
    const tt = g.travelTo.bind(g); g.travelTo = d => { const r = d && R.byId(d.spawn) || (d && R.list.find(x => x.inBox(d.x, d.z))); if (r && r.state !== 'ready' && r.state !== 'failed') { wait(r).then(() => tt(d)); return; } return tt(d); };
    const tp = g.teleport.bind(g); g.teleport = (x, z, opt) => { const r = !opt && R.list.find(q => q.inBox(x, z)); if (r && r.state !== 'ready' && r.state !== 'failed') { wait(r).then(() => tp(x, z, opt)); return; } return tp(x, z, opt); };
  }
}
const FUJI_XZ = (() => { const f = [0, 0, 0, 35.3606, 138.7274]; const O = { lat: 35.4615, lon: 139.68 }, C = Math.cos(O.lat * Math.PI / 180); return [(f[4] - O.lon) * 111320 * C, -(f[3] - O.lat) * 110574]; })();
