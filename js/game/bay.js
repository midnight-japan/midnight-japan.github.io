// Tokyo Bay beyond Daikoku: Umihotaru PA (海ほたる), Kaze-no-Tō (風の塔), Tsurumi Tsubasa Bridge (鶴見つばさ橋),
// Kawasaki / Chiba industrial shores, Haneda Airport, and the far Tokyo skyline (Tokyo Tower, Skytree, Rainbow Bridge,
// Tokyo Gate Bridge) with Mt. Fuji on the western horizon.
// Positions come from OpenStreetMap (data/map-daikoku.js → MAP.umihotaru / MAP.landmarks; © OSM contributors, ODbL);
// structures are simplified procedural models at real scale.
import * as THREE from 'three';
import { surface, windowTexture, glowTexture } from './textures.js';
import { MAP, UMI_LOTS } from './roads.js';

const lerp = (a, b, t) => a + (b - a) * t;
const rand = (() => { let s = 987654; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
export const LM = Object.fromEntries((MAP.landmarks || []).map(l => [l.id, l]));
function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
export const UMI_RING = MAP.umihotaru?.ring || null;
export const inUmihotaru = (x, z) => !!UMI_RING && x > 17350 && x < 18150 && z > -700 && z < 200 && inPoly(x, z, UMI_RING);

function textTexture(lines, { w = 1024, h = 256, bg = null, color = '#fff', font = '700 150px "Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, w / 2, h * (i + 0.5) / lines.length));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/** Piers must not stand in these spans (cable-stayed main spans). */
export function noPierBay(net) {
  const ts = LM.tsubasa; if (!ts) return () => false;
  return (x, z) => Math.hypot(x - ts.x, z - ts.z) < 265;
}

export function buildBay(W, S, H) {
  const { boxGeo, planeGeo, polyGeo, Frame } = H;
  const far = new THREE.Group(); far.name = 'bay';
  W.group.add(far);
  buildUmihotaru(W, S, H);
  buildKaze(W, far);
  buildTsubasa(W, S, H);
  buildTokyo(W, far);
  buildIndustry(W, far);
  buildFuji(W, far);
  far.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
}

// ───────────────────────── 海ほたるPA ─────────────────────────
function buildUmihotaru(W, S, H) {
  const U = MAP.umihotaru; if (!U) return;
  const { boxGeo, planeGeo, polyGeo } = H;
  const net = W.net;
  const plaza = surface('pavement', { tile: 3 });
  const lot = surface('parking', { tile: 5 });
  const grass = surface('grass', { tile: 3, tint: 0x9fbf7a });
  const wall = surface('concrete_old', { tile: 4 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f2f0, roughness: 0.45, metalness: 0.05 });
  const glass = W.night(new THREE.MeshStandardMaterial({ color: 0x5d7488, roughness: 0.15, metalness: 0.6, emissive: 0xffffff, emissiveMap: windowTexture(41, 0.75, 40, 5), emissiveIntensity: 0 }), 0.05, 1.3);
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.4, metalness: 0.6 });
  const lineM = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  // island deck (paved plaza) + seawall + railing
  S.add(polyGeo(U.ring, 0.01), plaza);
  for (const g of U.green || []) S.add(polyGeo(g, 0.05), grass);
  const R = U.ring;
  for (let i = 0; i < R.length; i++) {
    const a = R[i], b = R[(i + 1) % R.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue;
    const ry = Math.atan2(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    S.add(boxGeo(2, 9, L + 2), wall, mx, -4.2, mz, ry);
    S.add(boxGeo(0.12, 1.1, L), steel, mx, 0.55, mz, ry);
    W.addCollider(mx, mz, 0.6, L / 2, ry, -10, 2, 'wall');
  }
  // the island's land is walkable
  W.umiRing = R;

  // ── lots (one per carriageway, on its left) ──
  const lampG = new THREE.CylinderGeometry(0.15, 0.22, 1, 8); lampG.translate(0, 0.5, 0);
  const led = W.night(new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xf4f6ff, emissiveIntensity: 0 }), 0, 3);
  W.umiSpots = [];
  for (const L of UMI_LOTS) {
    const r = net.byId[L.road]; if (!r) continue;
    const ring = [];
    for (let s = L.s0; s <= L.s1 + 0.1; s += 5) { const p = r.at(s, L.lat1); ring.push([p.x, p.z]); }
    for (let s = L.s1; s >= L.s0 - 0.1; s -= 5) { const p = r.at(s, L.lat0); ring.push([p.x, p.z]); }
    S.add(polyGeo(ring, 0.03), lot);
    // two rows of stalls: along the outer edge and along the inner edge, 2.5 m wide, 5 m deep
    const line = (s, la, lb) => { const a = r.at(s, la), b = r.at(s, lb); const len = Math.hypot(b.x - a.x, b.z - a.z); S.add(planeGeo(0.15, len), lineM, (a.x + b.x) / 2, 0.045, (a.z + b.z) / 2, Math.atan2(b.x - a.x, b.z - a.z)); };
    for (let s = L.s0 + 20; s <= L.s1 - 20 + 0.01; s += 2.5) {
      line(s, L.lat1 - 5.5, L.lat1 - 0.5); line(s, L.lat0 + 0.5, L.lat0 + 5.5);
      if (s < L.s1 - 21) for (const [la, lb] of [[L.lat1 - 5.5, L.lat1 - 0.5], [L.lat0 + 0.5, L.lat0 + 5.5]]) {
        const p = r.at(s + 1.25, (la + lb) / 2); const t = r.dirAt(s); W.umiSpots.push({ pos: new THREE.Vector3(p.x, 0, p.z), yaw: Math.atan2(t.x, t.z) + (la > L.lat0 + 3 ? Math.PI / 2 : -Math.PI / 2) });
      }
    }
    // lamp masts along the middle of the aisle
    for (let s = L.s0 + 25; s < L.s1; s += 40) {
      const p = r.at(s, (L.lat0 + L.lat1) / 2);
      S.add(lampG, steel, p.x, 0, p.z, 0, 1.2, 14, 1.2); S.add(boxGeo(2.4, 0.3, 2.4), led, p.x, 14, p.z);
      W.lampHeads.push(new THREE.Vector3(p.x, 13.5, p.z)); W.addCollider(p.x, p.z, 0.3, 0.3, 0, -1, 14, 'pole');
    }
    W.zones.push({ name: '海ほたるPA', lot: L });
  }

  // ── the ship-shaped PA building straddling the Aqua-Line (5 floors, observation deck on top) ──
  const ae = net.byId.aqua_e; if (!ae) return;
  let sB = 0, best = 1e9; for (let s = 0; s < ae.length; s += 2) { const p = ae.at(s); const d = Math.hypot(p.x - 17632, p.z + 310); if (d < best) { best = d; sB = s; } }
  const c = ae.at(sB), t = ae.dirAt(sB), yaw = Math.atan2(t.x, t.z);
  const left = new THREE.Vector3(t.z, 0, -t.x);
  const ctr = c.clone().addScaledVector(left, -4); // between the carriageways
  const LEN = 210, WID = 62, FL0 = 9.5, FH = 4.2, NF = 4;
  // hull plan: bow points NE (+along), stern square; built in local (u along, v across)
  const hull = new THREE.Shape();
  hull.moveTo(-LEN / 2, -WID / 2); hull.lineTo(LEN / 2 - 50, -WID / 2); hull.quadraticCurveTo(LEN / 2 - 8, -WID / 2 + 6, LEN / 2, 0);
  hull.quadraticCurveTo(LEN / 2 - 8, WID / 2 - 6, LEN / 2 - 50, WID / 2); hull.lineTo(-LEN / 2, WID / 2); hull.lineTo(-LEN / 2, -WID / 2);
  const place = (mesh, u = 0, y = 0, v = 0) => { const p = ctr.clone().addScaledVector(t, u).addScaledVector(left, v); mesh.position.set(p.x, y, p.z); mesh.rotation.y = yaw - Math.PI / 2; W.group.add(mesh); return mesh; };
  // extrude along +Y: shape in (x=u, y=v) → rotate so x→along, y→across
  const ext = (shape, h) => { const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 18 }); g.rotateX(-Math.PI / 2); return g; };
  for (let f = 0; f < NF; f++) {
    const k = 1 - f * 0.05; const sh = new THREE.Shape(hull.getPoints(24).map(p => new THREE.Vector2(p.x * k - f * 4, p.y * k)));
    place(new THREE.Mesh(ext(sh, 0.6), white), 0, FL0 + f * FH);                       // floor slab / white band
    const gl = new THREE.Mesh(ext(new THREE.Shape(sh.getPoints(24).map(p => new THREE.Vector2(p.x * 0.985, p.y * 0.97))), FH - 0.6), f === 0 ? white : glass);
    place(gl, 0, FL0 + f * FH + 0.6);
  }
  const topY = FL0 + NF * FH;
  place(new THREE.Mesh(ext(new THREE.Shape(hull.getPoints(24).map(p => new THREE.Vector2(p.x * 0.8 - 16, p.y * 0.8))), 0.5), white), 0, topY);
  // bridge house + funnel-like bell tower (幸せの鐘) on the deck
  { const g = new THREE.BoxGeometry(40, 7, 26); g.translate(0, 3.5, 0); const m = new THREE.Mesh(g, glass); place(m, 30, topY + 0.5, 0); }
  { const g = new THREE.CylinderGeometry(3.5, 5, 18, 16); g.translate(0, 9, 0); place(new THREE.Mesh(g, white), -20, topY + 0.5, 0); W.blink.push(W.warnLight(...(() => { const p = ctr.clone().addScaledVector(t, -20); return [p.x, topY + 20, p.z]; })())); }
  // roof sign 「海ほたる」 (lit at night)
  { const tex = textTexture(['海ほたる UMIHOTARU'], { w: 2048, h: 256, font: '800 160px "Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif', color: '#0d4f8b' });
    const m = W.night(new THREE.MeshStandardMaterial({ map: tex, transparent: true, emissive: 0x66c8ff, emissiveMap: tex, emissiveIntensity: 0, side: THREE.DoubleSide }), 0, 1.4);
    for (const sv of [1, -1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(70, 8.5), m); const p = ctr.clone().addScaledVector(t, 10).addScaledVector(left, sv * (WID / 2 * 0.86 + 0.6)); pl.position.set(p.x, FL0 + 2.4 * FH, p.z); pl.rotation.y = yaw + (sv > 0 ? -Math.PI / 2 : Math.PI / 2); W.group.add(pl); } }
  // pilotis: two rows of columns outside the carriageways (the road passes underneath the building)
  const colG = new THREE.CylinderGeometry(1.1, 1.1, FL0, 14); colG.translate(0, FL0 / 2, 0);
  for (let u = -LEN / 2 + 8; u < LEN / 2 - 30; u += 18) for (const v of [-WID / 2 + 4, WID / 2 - 4]) {
    const p = ctr.clone().addScaledVector(t, u).addScaledVector(left, v); S.add(colG, white, p.x, 0, p.z); W.addCollider(p.x, p.z, 1.1, 1.1, 0, -1, FL0, 'pole');
  }
  // underside soffit lights over the road
  const soffit = W.night(new THREE.MeshStandardMaterial({ color: 0xdddddd, emissive: 0xfff4e0, emissiveIntensity: 0.6 }), 0.6, 1.6);
  for (let u = -LEN / 2 + 10; u < LEN / 2 - 30; u += 12) { const p = ctr.clone().addScaledVector(t, u); S.add(boxGeo(WID - 14, 0.08, 1), soffit, p.x, FL0 - 0.05, p.z, yaw); W.lampHeads.push(new THREE.Vector3(p.x, FL0 - 1, p.z)); }
  // "cutter face" monument: the real shield-machine cutter (Ø14.14 m) at the island's south-west tip
  const cf = U.pois?.find(p => /カッターフェイス/.test(p.name));
  if (cf) {
    const g = new THREE.CylinderGeometry(7.07, 7.07, 1.2, 40); g.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.7, roughness: 0.45 })); m.position.set(cf.x, 7.6, cf.z); m.rotation.y = yaw; W.group.add(m);
    const spokes = new THREE.Mesh(new THREE.BoxGeometry(1.4, 14, 0.8), new THREE.MeshStandardMaterial({ color: 0x3b3f44, metalness: 0.6 }));
    for (let k = 0; k < 4; k++) { const sp = spokes.clone(); sp.rotation.set(k * Math.PI / 4, 0, 0); sp.position.x = 0.7; m.add(sp); }
  }
  // information sign for the HUD/minimap
  W.umihotaru = { ctr, yaw, sB };
  W.interact?.push?.({ pos: ctr.clone().setY(0), r: 30, type: 'info', data: { name: '海ほたるPA' } });
}

// ───────────────────────── 風の塔 (Aqua Tunnel ventilation towers, Kawasaki man-made island) ─────────────────────────
function buildKaze(W, far) {
  const K = LM.kaze; if (!K) return;
  const conc = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.7 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x9fb3c4, roughness: 0.5, metalness: 0.3 });
  const ae = W.net.byId.aqua_e; let dir = new THREE.Vector3(0.77, 0, 0.64);
  if (ae) { let bs = 0, bd = 1e9; for (let s = 0; s < ae.length; s += 10) { const p = ae.at(s); const d = Math.hypot(p.x - K.x, p.z - K.z); if (d < bd) { bd = d; bs = s; } } dir = ae.dirAt(bs).clone(); }
  const yaw = Math.atan2(dir.x, dir.z);
  const tower = (off, h, r) => {
    const g = new THREE.CylinderGeometry(r * 0.78, r, h, 40); g.scale(1.6, 1, 1); g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, conc); m.position.set(K.x + dir.x * off, 0, K.z + dir.z * off); m.rotation.y = yaw + Math.PI / 2; far.add(m);
    for (let y = 12; y < h - 4; y += 9) { const rr = lerp(r, r * 0.78, y / h) + 0.25; const band = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 1.2, 40), accent); band.position.y = y; band.scale.x = 1.6; m.add(band); }
    W.blink.push(W.warnLight(m.position.x, h + 1, m.position.z));
  };
  tower(-45, 90, 14); tower(55, 75, 12);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(95, 100, 6, 48), new THREE.MeshStandardMaterial({ color: 0x8c8a84, roughness: 0.9 }));
  deck.position.set(K.x, -1, K.z); far.add(deck);
}

// ───────────────────────── 鶴見つばさ橋 (single-pylon cable-stayed, 510 m main span) ─────────────────────────
function buildTsubasa(W, S, H) {
  const T = LM.tsubasa, r = W.net.byId.bayshore; if (!T || !r) return;
  const { boxGeo } = H;
  let sP = 0, bd = 1e9; for (let s = 0; s < r.length; s += 2) { const p = r.at(s); const d = Math.hypot(p.x - T.x, p.z - T.z); if (d < bd) { bd = d; sP = s; } }
  const p0 = r.at(sP), t = r.dirAt(sP), ry = Math.atan2(t.x, t.z), left = new THREE.Vector3(t.z, 0, -t.x);
  const steel = new THREE.MeshStandardMaterial({ color: 0xeef1f4, roughness: 0.4, metalness: 0.45 });
  const PH = T.h || 183;
  // pylon in the median (slender, slightly tapered), from the water up
  S.add(boxGeo(4.5, PH + 6, 9), steel, p0.x, (PH + 6) / 2 - 6, p0.z, ry);
  W.addCollider(p0.x, p0.z, 2.6, 5, ry, -10, PH);
  // box girder under the deck along the cable-stayed span
  for (let s = sP - 510; s < sP + 510; s += 10) { const p = r.at(s), d = r.dirAt(s); S.add(boxGeo(r.edgeL - r.edgeR + 2, 3, 10.4), steel, p.x, p.y - 2.2, p.z, Math.atan2(d.x, d.z)); }
  // fan of stay cables (single plane, in the median) + lights
  const pts = [], lights = [];
  for (let k = 1; k <= 17; k++) for (const sd of [-1, 1]) {
    const top = new THREE.Vector3(p0.x, PH - 6 - k * 3.2, p0.z);
    const d = r.at(sP + sd * (k * 29 + 12)); const bot = new THREE.Vector3(d.x, d.y + 0.6, d.z);
    pts.push(top, bot); for (let j = 1; j < 8; j++) lights.push(top.clone().lerp(bot, j / 8));
  }
  W.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xe6edf3 })));
  const lg = new THREE.Points(new THREE.BufferGeometry().setFromPoints(lights), new THREE.PointsMaterial({ color: 0xbfe1ff, size: 2.4, transparent: true, opacity: 0 }));
  W.night(lg.material, 0, 1).userData.opacityMode = true; W.group.add(lg);
  W.blink.push(W.warnLight(p0.x, PH + 1, p0.z));
  void left;
}

// ───────────────────────── far Tokyo: Tokyo Tower, Skytree, Rainbow Bridge, Gate Bridge, Haneda ─────────────────────────
function buildTokyo(W, far) {
  const add = (m, x, y, z) => { m.position.set(x, y, z); far.add(m); return m; };
  // Tokyo Tower (333 m, orange/white lattice → tapered frustum + observatories), warm "landmark light" at night
  if (LM.tokyo_tower) { const { x, z } = LM.tokyo_tower;
    const m = W.night(new THREE.MeshStandardMaterial({ color: 0xe0582b, roughness: 0.6, emissive: 0xff8a2a, emissiveIntensity: 0 }), 0, 1.6);
    const g = new THREE.CylinderGeometry(3, 48, 333, 4, 6, true); g.rotateY(Math.PI / 4); g.translate(0, 166, 0); add(new THREE.Mesh(g, m), x, 0, z);
    for (const [y, rr] of [[150, 16], [250, 8]]) add(new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, emissive: 0xfff0d0, emissiveIntensity: 0.2 })), x, y, z);
    W.blink.push(W.warnLight(x, 336, z)); }
  // Tokyo Skytree (634 m)
  if (LM.skytree) { const { x, z } = LM.skytree;
    const m = W.night(new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.4, metalness: 0.5, emissive: 0x7aa6ff, emissiveIntensity: 0 }), 0, 1.3);
    const g = new THREE.CylinderGeometry(7, 34, 634, 12, 1, true); g.translate(0, 317, 0); add(new THREE.Mesh(g, m), x, 0, z);
    for (const [y, rr] of [[350, 22], [450, 15]]) add(new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 10, 20), W.night(new THREE.MeshStandardMaterial({ color: 0xcfd8e2, emissive: 0xb07aff, emissiveIntensity: 0 }), 0, 1.6)), x, y, z);
    W.blink.push(W.warnLight(x, 636, z)); }
  // Rainbow Bridge (suspension, towers 126 m), between Shibaura and Daiba
  if (LM.rainbow) { const { x, z } = LM.rainbow; const ax = new THREE.Vector3(1495, 0, 298).normalize(); const yaw = Math.atan2(ax.x, ax.z);
    const steel = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4, metalness: 0.4 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 920), steel); deck.rotation.y = yaw; add(deck, x, 52, z);
    const pts = [], lights = [];
    for (const sd of [-1, 1]) { const tw = new THREE.Mesh(new THREE.BoxGeometry(34, 126, 8), steel); tw.rotation.y = yaw; add(tw, x + ax.x * sd * 285, 63, z + ax.z * sd * 285); W.blink.push(W.warnLight(x + ax.x * sd * 285, 128, z + ax.z * sd * 285)); }
    for (let i = 0; i <= 60; i++) { const u = -460 + i * (920 / 60); const a = Math.abs(u); const y = a < 285 ? 60 + 66 * (u / 285) ** 2 : 126 - (a - 285) / 175 * 66; lights.push(new THREE.Vector3(x + ax.x * u, y, z + ax.z * u)); if (i) pts.push(lights[i - 1], lights[i]); }
    far.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xdddddd })));
    const lp = new THREE.Points(new THREE.BufferGeometry().setFromPoints(lights), new THREE.PointsMaterial({ color: 0xffffff, size: 4, transparent: true, opacity: 0 })); W.night(lp.material, 0, 1).userData.opacityMode = true; far.add(lp); }
  // Tokyo Gate Bridge ("dinosaur" truss, ~87 m)
  if (LM.gate_bridge) { const { x, z } = LM.gate_bridge; const ax = new THREE.Vector3(-1146, 0, 1109).normalize(); const yaw = Math.atan2(ax.x, ax.z);
    const steel = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.5, metalness: 0.5 }); const lights = [];
    for (let u = -800; u <= 800; u += 20) { const k = Math.abs(u); const top = k < 100 ? 62 : k < 400 ? 62 + 25 * Math.sin((k - 100) / 300 * Math.PI) : Math.max(30, 62 - (k - 400) * 0.08);
      const b = new THREE.Mesh(new THREE.BoxGeometry(26, top - 50 + 6, 20.5), steel); b.rotation.y = yaw; add(b, x + ax.x * u, (top + 50) / 2 - 3, z + ax.z * u); lights.push(new THREE.Vector3(x + ax.x * u, top + 1, z + ax.z * u)); }
    const lp = new THREE.Points(new THREE.BufferGeometry().setFromPoints(lights), new THREE.PointsMaterial({ color: 0xcfe8ff, size: 4, transparent: true, opacity: 0 })); W.night(lp.material, 0, 1).userData.opacityMode = true; far.add(lp); }
  // Haneda Airport: runway edge lights, approach lights, tower beacon
  if (LM.haneda) { const { x, z } = LM.haneda; const pts = [], blue = [];
    const runway = (cx, cz, deg, len, wid) => { const a = deg * Math.PI / 180, d = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), n = new THREE.Vector3(d.z, 0, -d.x);
      for (let u = -len / 2; u <= len / 2; u += 60) for (const sd of [-1, 1]) pts.push(new THREE.Vector3(cx + d.x * u + n.x * sd * wid / 2, 1, cz + d.z * u + n.z * sd * wid / 2));
      for (let u = len / 2; u < len / 2 + 900; u += 30) blue.push(new THREE.Vector3(cx + d.x * u, 2, cz + d.z * u)); };
    runway(x + 700, z - 300, 337, 3360, 60); runway(x - 600, z + 500, 337, 3000, 60); runway(x + 300, z + 900, 220, 2500, 60); runway(x + 1600, z + 1500, 230, 2500, 60);
    const e = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: 0xfff1c4, size: 2.6, transparent: true, opacity: 0 })); W.night(e.material, 0, 1).userData.opacityMode = true; far.add(e);
    const b = new THREE.Points(new THREE.BufferGeometry().setFromPoints(blue), new THREE.PointsMaterial({ color: 0x9fd0ff, size: 3, transparent: true, opacity: 0 })); W.night(b.material, 0, 1).userData.opacityMode = true; far.add(b);
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(6, 9, 115, 12), new THREE.MeshStandardMaterial({ color: 0xd8dde3 })); tw.position.set(x, 57, z); far.add(tw); W.blink.push(W.warnLight(x, 117, z)); }
  // central Tokyo / Odaiba / Shinagawa high-rises (lit windows) between Shinagawa and Shiodome
  const dark = new THREE.MeshStandardMaterial({ color: 0x5d6166, roughness: 0.8 });
  let seed = 400;
  for (const b of [{ cx: 5200, cz: -19800, n: 110, r: 2200, h: [60, 240] }, { cx: 8800, cz: -18600, n: 35, r: 900, h: [30, 120] }, { cx: 3500, cz: -15500, n: 60, r: 1800, h: [40, 160] }, { cx: 10500, cz: -23500, n: 60, r: 2500, h: [30, 180] }]) {
    for (let i = 0; i < b.n; i++) {
      const a = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * b.r, x = b.cx + Math.cos(a) * rr, z = b.cz + Math.sin(a) * rr;
      if (!W.isLand(x, z)) continue;
      const h = b.h[0] + rand() * (b.h[1] - b.h[0]), w = 25 + rand() * 30, d = 25 + rand() * 30;
      const m = new THREE.MeshStandardMaterial({ color: 0x6b7076, roughness: 0.6, metalness: 0.3, emissive: 0xffffff, emissiveMap: windowTexture(seed++, 0.25 + rand() * 0.3, Math.round(w / 3), Math.round(h / 3.6)), emissiveIntensity: 0 });
      W.night(m, 0, 1.3);
      const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); add(new THREE.Mesh(g, [m, m, dark, dark, m, m]), x, 0, z);
      if (h > 150) W.blink.push(W.warnLight(x, h + 2, z));
    }
  }
}

// ───────────────────────── Keihin (Kawasaki) & Keiyō (Chiba) industrial zones: tanks, stacks, flares, lights ─────────────────────────
function buildIndustry(W, far) {
  const tankM = new THREE.MeshStandardMaterial({ color: 0xc4c8cc, roughness: 0.6, metalness: 0.5 });
  const redM = new THREE.MeshStandardMaterial({ color: 0xd94b3d, roughness: 0.7 }), whiteM = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.7 });
  const lights = [], carpet = [];
  const tankG = new THREE.CylinderGeometry(1, 1, 1, 24); tankG.translate(0, 0.5, 0);
  const stackG = new THREE.CylinderGeometry(0.6, 1, 1, 10); stackG.translate(0, 0.5, 0);
  const tanks = [], stacks = [];
  const zones = [
    { x0: 3500, x1: 10500, z0: -7600, z1: -2100, n: 260 },     // Ōgishima / Higashi-Ōgishima / Ukishima (JFE, refineries)
    { x0: 19500, x1: 27000, z0: -9000, z1: 9000, n: 220 },     // Chiba coast: Sodegaura / Kisarazu / Kimitsu
  ];
  for (const Z of zones) for (let i = 0, tries = 0; i < Z.n && tries < Z.n * 12; tries++) {
    const x = lerp(Z.x0, Z.x1, rand()), z = lerp(Z.z0, Z.z1, rand());
    if (!W.isLand(x, z) || W.net.hits(x, z).length) continue; i++;
    if (rand() < 0.55) { const r = 10 + rand() * 20, h = 12 + rand() * 12; tanks.push([x, z, r, h]); }
    else { const h = 40 + rand() * 140; stacks.push([x, z, h]); if (h > 90) W.blink.push(W.warnLight(x, h + 1, z)); }
    for (let k = 0; k < 22; k++) lights.push(new THREE.Vector3(x + (rand() - 0.5) * 140, rand() * 45, z + (rand() - 0.5) * 140));
  }
  const m4 = new THREE.Matrix4();
  if (tanks.length) { const im = new THREE.InstancedMesh(tankG, tankM, tanks.length); tanks.forEach(([x, z, r, h], i) => { m4.makeScale(r, h, r); m4.setPosition(x, 0, z); im.setMatrixAt(i, m4); }); far.add(im); }
  for (const [mat, list] of [[redM, stacks.filter((_, i) => i % 2)], [whiteM, stacks.filter((_, i) => !(i % 2))]]) if (list.length) { const im = new THREE.InstancedMesh(stackG, mat, list.length); list.forEach(([x, z, h], i) => { m4.makeScale(2.4, h, 2.4); m4.setPosition(x, 0, z); im.setMatrixAt(i, m4); }); far.add(im); }
  // flare stacks with flames (animated by World.update through W.flares)
  W.flares = W.flares || [];
  for (const [x, z] of [[6200, -4300], [7800, -5200], [9300, -6900], [22400, -2500], [23800, 1200]]) {
    if (!W.isLand(x, z)) continue;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2, 90, 8), tankM); st.position.set(x, 45, z); far.add(st);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(4, 16, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.set(x, 98, z); far.add(fl); W.flares.push(fl);
  }
  const lp = new THREE.Points(new THREE.BufferGeometry().setFromPoints(lights), new THREE.PointsMaterial({ color: 0xffe2a8, size: 2.5, transparent: true, opacity: 0 }));
  W.night(lp.material, 0, 1).userData.opacityMode = true; far.add(lp);
  // city light carpet on the far shores (Kawasaki, Ōta / Shinagawa, Chiba)
  for (let i = 0, tries = 0; i < 9000 && tries < 60000; tries++) {
    const x = lerp(-4000, 30000, rand()), z = lerp(-26000, 12000, rand());
    if (Math.hypot(x, z) < 4500 || !W.isLand(x, z)) continue; i++;
    carpet.push(new THREE.Vector3(x, 1 + rand() * 8, z));
  }
  const cp = new THREE.Points(new THREE.BufferGeometry().setFromPoints(carpet), new THREE.PointsMaterial({ color: 0xffd7a0, size: 3, sizeAttenuation: true, transparent: true, opacity: 0 }));
  W.night(cp.material, 0, 0.9).userData.opacityMode = true; far.add(cp);
}

// ───────────────────────── Mt. Fuji on the western horizon (scaled & pulled in so it stays inside the view range) ─────────────────────────
function buildFuji(W, far) {
  const F = LM.fuji; if (!F) return;
  const D = Math.hypot(F.x, F.z), k = 46000 / D;
  const x = F.x * k, z = F.z * k, h = 3776 * k, r = 17000 * k;
  const g = new THREE.ConeGeometry(r, h, 64, 6, true);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const y = (pos.getY(i) + h / 2) / h; const snow = y > 0.62 ? 1 : 0; const c = snow ? [0.93, 0.95, 1] : [0.36, 0.42, 0.52]; col.set(c, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 0.55, depthWrite: false }));
  m.position.set(x, h / 2 - 40, z); m.renderOrder = -1; far.add(m);
  W.fuji = m;
}
