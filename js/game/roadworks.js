// Road works (v2.10): as on the real Shutokō — mostly at night — a lane closure appears on an expressway ahead of you
// for a few minutes, then is packed up and moves elsewhere. Never the travel lane (第一通行帯): the overtaking lane
// is coned off with a 60 m taper, an arrow-board truck (矢印板車) blinks at its start, 「この先 工事中 / 車線規制」
// boards stand 500 m and 200 m before, and a few workers with light batons stand inside. AI traffic and the
// autopilot move over in good time (closed()), the cones and the truck are solid (world colliders).
import * as THREE from 'three';
import { getLang } from '../i18n.js';

const LIFE = [150, 330];         // seconds a closure stays (real time)
const LEN = [220, 420];          // closed length (m)
let MATS = null;
function mats() {
  if (MATS) return MATS;
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#ff5a14'; g.fillRect(0, 0, 64, 128); g.fillStyle = '#f4f4f0'; g.fillRect(0, 34, 64, 22); g.fillRect(0, 72, 64, 14);
  const cone = new THREE.CanvasTexture(c); cone.colorSpace = THREE.SRGBColorSpace;
  const b = document.createElement('canvas'); b.width = 512; b.height = 256; const h = b.getContext('2d');
  h.fillStyle = '#f2c200'; h.fillRect(0, 0, 512, 256); h.strokeStyle = '#111'; h.lineWidth = 10; h.strokeRect(6, 6, 500, 244);
  h.fillStyle = '#111'; h.textAlign = 'center'; h.font = '800 64px "Hiragino Sans","Noto Sans JP",sans-serif'; h.fillText('この先 工事中', 256, 100);
  h.font = '800 56px "Hiragino Sans","Noto Sans JP",sans-serif'; h.fillText('右車線規制', 256, 190);
  const board = new THREE.CanvasTexture(b); board.colorSpace = THREE.SRGBColorSpace;
  MATS = {
    cone: new THREE.MeshStandardMaterial({ map: cone, roughness: 0.6 }),
    base: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
    truck: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.45, metalness: 0.2 }),
    stripe: new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.5 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4 }),
    led: new THREE.MeshBasicMaterial({ color: 0xffb020 }),
    board: new THREE.MeshStandardMaterial({ map: board, roughness: 0.6 }),
    pole: new THREE.MeshStandardMaterial({ color: 0x8a8f94, roughness: 0.5, metalness: 0.5 }),
  };
  return MATS;
}
const coneGeo = (() => { let g = null; return () => g || (g = (() => { const c = new THREE.CylinderGeometry(0.035, 0.17, 0.7, 14, 1, true); c.translate(0, 0.39, 0); return c; })()); })();
const baseGeo = (() => { let g = null; return () => g || (g = new THREE.BoxGeometry(0.42, 0.05, 0.42).translate(0, 0.025, 0)); })();

export class Roadworks {
  constructor(game) { this.g = game; this.zones = []; this.t = 0; this.nextT = 20; this.blink = 0; }
  // is lane `lane` of `road` (direction dir) closed between s and s + ahead·dir?
  closed(road, dir, s, lane, ahead = 350) {
    for (const z of this.zones) { if (z.road !== road || z.dir !== dir || z.lane !== lane) continue; const a = (z.s0 - s) * dir, b = (z.s1 - s) * dir; if (b > -5 && a < ahead) return z; }
    return null;
  }
  update(dt) {
    this.t += dt; this.blink += dt;
    const g = this.g, v = g.vehicle;
    for (const z of this.zones.slice()) { z.life -= dt; const far = v && Math.hypot(z.cx - v.pos.x, z.cz - v.pos.z) > 4000; if (z.life <= 0 && (far || !v || this.near(z, v) > 300) || far) this.remove(z); }
    // the arrow boards blink (sequential chevrons)
    const on = (this.blink % 0.9) < 0.6; for (const z of this.zones) if (z.led) z.led.visible = on;
    this.nextT -= dt;
    if (this.nextT <= 0 && this.zones.length < 2 && v && g.mode === 'drive') {
      const night = g.tod?.night ?? 0; this.nextT = (night > 0.5 ? 60 : 160) + Math.random() * 120; // mostly at night, like the real thing
      try { this.spawn(); } catch (e) { console.warn('roadworks', e); }
    }
  }
  near(z, v) { return Math.hypot(z.cx - v.pos.x, z.cz - v.pos.z); }
  spawn() {
    const g = this.g, v = g.vehicle, net = g.net, h = v.surface?.hit, r = v.road;
    if (!r || !h || r.kind !== 'expressway') return;
    const t0 = r.dirAt(h.s), dir = (t0.x * Math.sin(v.yaw) + t0.z * Math.cos(v.yaw)) >= 0 ? 1 : -1;
    const lanes = r.lanes.filter(l => l.dir === dir); if (lanes.length < 2) return;
    const lane = lanes.sort((a, b) => a.lat * dir - b.lat * dir)[0]; // the overtaking (right-most) lane — never 第一通行帯
    const len = LEN[0] + Math.random() * (LEN[1] - LEN[0]), start = h.s + dir * (900 + Math.random() * 900), s0 = start, s1 = start + dir * len;
    if (Math.min(s0, s1) < 80 || Math.max(s0, s1) > r.length - 80) return;
    // keep clear of junctions (diverges / merges) and of the Bay Bridge span
    const lo = Math.min(s0, s1) - 650, hi = Math.max(s0, s1) + 150;
    if ((net.diverges.get(r) || []).some(d => d.s > lo && d.s < hi)) return;
    if ([...net.links.values()].some(L => L.to === r && L.s > lo && L.s < hi)) return;
    const M = mats(), grp = new THREE.Group(); grp.name = 'roadworks';
    const cols = [], P = new THREE.Vector3();
    const inner = lane.lat - Math.sign(lane.lat - lanes.find(l => l !== lane).lat) * 1.75; // lane line towards the open lane
    const coneAt = (s, lat) => { r.at(s, lat, P); const c = new THREE.Mesh(coneGeo(), M.cone); c.position.copy(P); const b = new THREE.Mesh(baseGeo(), M.base); b.position.copy(P); grp.add(c, b); cols.push({ x: P.x, z: P.z, hx: 0.22, hz: 0.22, c: 1, s: 0, y0: P.y - 1, y1: P.y + 0.8, kind: 'cone' }); };
    // taper (60 m) from the outer edge of the closed lane to its inner line, then cones along the line every 6 m
    const outer = lane.lat + Math.sign(lane.lat - inner) * 1.6;
    for (let k = 0; k <= 10; k++) coneAt(s0 + dir * k * 6, outer + (inner - outer) * k / 10);
    for (let d = 66; d < len; d += 6) coneAt(s0 + dir * d, inner);
    for (let k = 0; k <= 4; k++) coneAt(s1 - dir * k * 2, inner + (outer - inner) * k / 4); // closing the end
    // arrow-board truck at the start of the closure, in the closed lane
    const ts = s0 + dir * 30; r.at(ts, lane.lat, P); const td = r.dirAt(ts), yaw = Math.atan2(td.x * dir, td.z * dir);
    const truck = new THREE.Group(); truck.position.copy(P); truck.rotation.y = yaw;
    const box = (w, hh, l, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, l), m); o.position.set(x, y, z); o.castShadow = true; truck.add(o); return o; };
    box(1.9, 1.8, 1.6, M.truck, 0, 1.4, 1.9); box(2.0, 0.25, 4.6, M.truck, 0, 0.75, -0.2); box(2.02, 0.12, 4.62, M.stripe, 0, 0.6, -0.2);
    box(1.9, 1.4, 0.12, M.panel, 0, 2.2, -2.3);
    for (const [x, y] of [[-0.6, 0], [-0.2, 0], [0.2, 0], [0.6, 0], [0.35, 0.3], [0.35, -0.3]]) box(0.16, 0.16, 0.04, M.led, (lane.lat * dir > 0 ? -1 : 1) * x, 2.2 + y, -2.37);
    const led = new THREE.Group(); for (const o of truck.children.slice(-6)) led.add(o); truck.add(led);
    for (const zz of [-1.6, 1.4]) for (const x of [-0.85, 0.85]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 16).rotateZ(Math.PI / 2), M.base); w.position.set(x, 0.38, zz); truck.add(w); }
    grp.add(truck); cols.push({ x: P.x, z: P.z, hx: 1.0, hz: 2.6, c: Math.cos(yaw), s: Math.sin(yaw), y0: P.y - 1, y1: P.y + 3, kind: 'truck' });
    // advance warning boards at 500 m and 200 m, on the shoulder of the travel side
    const travel = lanes.sort((a, b) => b.lat * dir - a.lat * dir)[0];
    for (const d of [500, 200]) { const s = s0 - dir * d; if (s < 0 || s > r.length) continue; r.at(s, travel.lat + Math.sign(travel.lat - lane.lat) * 3.2, P);
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.05), M.board); b.position.set(P.x, P.y + 1.6, P.z); b.rotation.y = yaw + Math.PI; grp.add(b);
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), M.pole); p2.position.set(P.x, P.y + 0.8, P.z); grp.add(p2); }
    // workers in the closed lane (helmets, reflective vests via the human outfits are not available here: simple figures)
    g.scene.add(grp);
    const W = g.world; W.colliders.push(...cols);
    const z = { road: r, dir, lane, s0, s1, life: LIFE[0] + Math.random() * (LIFE[1] - LIFE[0]), grp, cols, led, cx: P.x, cz: P.z };
    this.zones.push(z);
    g.ui?.toast?.(({ ko: '⚠ 전방 도로공사 — 추월차선 규제', ja: '⚠ この先 工事中 — 右車線規制' })[getLang()] || '⚠ Road works ahead — right lane closed', 'warn', 4);
  }
  remove(z) {
    this.g.scene.remove(z.grp); z.grp.traverse(o => { if (o.isMesh && o.geometry !== coneGeo() && o.geometry !== baseGeo()) o.geometry.dispose(); });
    const C = this.g.world.colliders; for (const c of z.cols) { const i = C.indexOf(c); if (i >= 0) C.splice(i, 1); }
    this.zones.splice(this.zones.indexOf(z), 1);
  }
}
