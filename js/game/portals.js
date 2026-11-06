// Tunnel mouths built like the real ones on the Shuto Expressway: a concrete portal face over the opening with the
// tunnel's name plate, and before every entrance the roadside boards 「トンネル内 ライト点灯」 and the radio
// re-broadcast frequency (ラジオ再放送 1620kHz) — instead of the road just sinking into the ground.
import * as THREE from 'three';
import { tunnelPortals } from './roads.js';
import { placeAt } from '../../data/places.js';
import { surface } from './textures.js';

// well-known tunnels by position (game metres) → name; others are named after the district they pass under
const KNOWN = [
  [-3700, 2150, '石川町トンネル'], [-4200, 1700, '横浜公園トンネル'], [7600, -8300, '多摩川トンネル'], [4400, -6800, '川崎航路トンネル'],
  [10500, -5500, 'アクアトンネル'], [15000, -2500, 'アクアトンネル'],
];
function tunnelName(x, z) {
  let best = null; for (const [kx, kz, n] of KNOWN) { const d = Math.hypot(kx - x, kz - z); if (d < 1400 && (!best || d < best.d)) best = { d, n }; }
  if (best) return best.n;
  const pl = placeAt(x, z, 2500); return (pl ? pl.name.replace(/[（(].*$/, '').replace(/(駅|町|区|ふ頭|埠頭)$/, '') : '首都高') + 'トンネル';
}

function board(lines, w, h, bg, fg, sub) {
  const S = 128, c = document.createElement('canvas'); c.width = Math.round(w * S); c.height = Math.round(h * S); const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(14, 14, c.width - 28, c.height - 28);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = lines.length + (sub ? 0.55 : 0);
  lines.forEach((t, i) => { let fs = c.height / n * 0.62; g.font = `800 ${fs}px "Hiragino Sans","Noto Sans JP",sans-serif`; while (g.measureText(t).width > c.width * 0.9 && fs > 10) { fs -= 4; g.font = `800 ${fs}px "Hiragino Sans","Noto Sans JP",sans-serif`; } g.fillText(t, c.width / 2, c.height * (i + 0.5) / n); });
  if (sub) { g.font = `700 ${c.height / n * 0.32}px system-ui,sans-serif`; g.fillText(sub, c.width / 2, c.height * (lines.length + 0.3) / n); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 });
}

export function buildPortals(world) {
  const net = world.net, isLand = (x, z) => world.isLand(x, z);
  const g = new THREE.Group(); g.name = 'tunnel-portals';
  const conc = surface('concrete', { tile: 3 }).clone(); conc.color = new THREE.Color(0xd2cdc2);
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6, metalness: 0.3 });
  const lightsOn = board(['トンネル内', 'ライト点灯'], 2.2, 1.6, '#1d4fa3', '#ffffff', 'HEADLIGHTS ON');
  const radio = board(['ラジオ再放送', '1620 kHz'], 2.2, 1.3, '#1d4fa3', '#ffffff', 'TUNNEL RADIO');
  const cache = new Map();
  const portals = tunnelPortals(net, isLand);
  for (const P of portals) {
    const { r, q, enter } = P;
    const t = q.t, out = new THREE.Vector3(-t.x * enter, 0, -t.z * enter); // outward = facing the cars that drive in
    const cx = q.p.x + (q.left.x * (r.edgeL + r.edgeR) / 2), cz = q.p.z + (q.left.z * (r.edgeL + r.edgeR) / 2);
    const yaw = Math.atan2(out.x, out.z);
    const gy = world.ground(cx, cz), top = P.top, faceTop = Math.max(gy + 2.4, top + 2.2);
    // portal face: a thick concrete lintel above the opening, the full width of the cutting (+ a dark parapet cap)
    const W = P.w + 3.2, H = faceTop - (top - 0.4);
    const face = new THREE.Mesh(new THREE.BoxGeometry(W, H, 1.4), conc); face.position.set(cx, top - 0.4 + H / 2, cz); face.rotation.y = yaw; face.castShadow = face.receiveShadow = true; g.add(face);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.25, 1.8), dark); cap.position.set(cx, faceTop + 0.12, cz); cap.rotation.y = yaw; g.add(cap);
    // name plate on the side cars drive in from (one-way roads: only at the entrance)
    if (enter === 1 || r.lanesB) {
      const name = tunnelName(q.p.x, q.p.z);
      let m = cache.get(name); if (!m) cache.set(name, m = board([name], 6.4, 1.15, '#f4f4f0', '#1a1a1a', 'TUNNEL'));
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.15), m);
      plate.position.set(cx + out.x * 0.72, Math.min(faceTop - 0.75, top + 0.9), cz + out.z * 0.72); plate.rotation.y = yaw; g.add(plate);
      // approach boards ~150 m before the mouth, on the left-hand verge of the incoming traffic
      const sBoard = q.s - 150 * enter; if (sBoard < 5 || sBoard > r.length - 5) continue;
      const p = r.at(sBoard), d = r.dirAt(sBoard); const lat = enter > 0 ? r.edgeL + 0.9 : r.edgeR - 0.9;
      const left = new THREE.Vector3(d.z, 0, -d.x);
      const bx = p.x + left.x * lat, bz = p.z + left.z * lat, by = p.y;
      if (by < -0.5) continue; // already down in the cutting with no verge
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.2, 8), dark); pole.position.set(bx, by + 2.1, bz); g.add(pole);
      const byaw = Math.atan2(-d.x * enter, -d.z * enter);
      const b1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), lightsOn); b1.position.set(bx, by + 3.4, bz); b1.rotation.y = byaw; g.add(b1);
      const b2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), radio); b2.position.set(bx, by + 1.95, bz); b2.rotation.y = byaw; g.add(b2);
    }
  }
  return g;
}
