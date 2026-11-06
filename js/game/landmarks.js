// Hand-modelled Yokohama landmarks (positions from OpenStreetMap, shapes from the real structures):
// Cosmo Clock 21 (the giant ferris wheel with its digital clock), Yokohama Marine Tower, and the NYK Hikawa Maru
// moored at Yamashita Park. OSM buildings for these are skipped by tools/osm-city-build.mjs so nothing doubles up.
import * as THREE from 'three';

export function buildLandmarks(W, far) {
  cosmoClock(W, far);
  marineTower(W, far);
  hikawaMaru(W, far);
}

// Cosmo Clock 21 — 112.5 m, Ø100 m, 60 gondolas, the clock in the hub (35.4553 N, 139.6371 E)
function cosmoClock(W, far) {
  const X = -3890, Z = 686, R = 50, HUB = 62.5;
  const root = new THREE.Group(); root.position.set(X, 0, Z); root.rotation.y = 0.72; far.add(root);
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9dee3, metalness: 0.6, roughness: 0.35 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f4f5, metalness: 0.2, roughness: 0.5 });
  // A-frame legs (two pairs) + axle
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, Math.hypot(HUB, 34), 10), steel);
    leg.position.set(sx * 17, HUB / 2, sz * 7); leg.rotation.z = -sx * Math.atan2(34, HUB); root.add(leg);
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 16, 16), steel); axle.rotation.x = Math.PI / 2; axle.position.y = HUB; root.add(axle);
  // base building
  const base = new THREE.Mesh(new THREE.BoxGeometry(46, 9, 24), white); base.position.y = 4.5; root.add(base);
  // the wheel (rotates)
  const wheel = new THREE.Group(); wheel.position.y = HUB; root.add(wheel);
  for (const z of [-3.5, 3.5]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.55, 8, 120), steel); rim.position.z = z; wheel.add(rim); const inner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.86, 0.35, 6, 100), steel); inner.position.z = z; wheel.add(inner); }
  const sp = []; for (let a = 0; a < 60; a++) { const t = a / 60 * Math.PI * 2; for (const z of [-3.5, 3.5]) sp.push(new THREE.Vector3(Math.cos(t) * 6, Math.sin(t) * 6, z * 0.4), new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, z)); }
  wheel.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sp), new THREE.LineBasicMaterial({ color: 0xbfc8d0 })));
  // gondolas (hang from the rim; counter-rotated each frame so they stay level)
  const gGeo = new THREE.CylinderGeometry(1.5, 1.5, 2.6, 10); gGeo.translate(0, -2.2, 0);
  const gm = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xecf0f1].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.2 }));
  W.gondolas = [];
  for (let a = 0; a < 60; a++) { const t = a / 60 * Math.PI * 2; const g = new THREE.Mesh(gGeo, gm[a % gm.length]); g.position.set(Math.cos(t) * (R + 0.6), Math.sin(t) * (R + 0.6), 0); wheel.add(g); W.gondolas.push(g); }
  // hub clock: a lit disc whose digits are redrawn each minute (World.update)
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const clockMat = W.night(new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.4 }), 0.5, 2.2);
  for (const sd of [-1, 1]) { const face = new THREE.Mesh(new THREE.CircleGeometry(12, 40), clockMat); face.position.set(0, HUB, sd * 4.2); if (sd < 0) face.rotation.y = Math.PI; root.add(face); }
  W.cosmoClock = { cv, tex, last: '' };
  // LED rim (colour wave at night)
  const led = []; for (let a = 0; a < 360; a++) { const t = a / 360 * Math.PI * 2; for (const z of [-3.6, 3.6]) led.push(new THREE.Vector3(Math.cos(t) * (R + 0.2), Math.sin(t) * (R + 0.2), z)); }
  const lg = new THREE.BufferGeometry().setFromPoints(led); lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(led.length * 3), 3));
  W.wheelLED = new THREE.Points(lg, new THREE.PointsMaterial({ size: 2.6, vertexColors: true, transparent: true, opacity: 0 })); W.night(W.wheelLED.material, 0, 1).userData.opacityMode = true;
  wheel.add(W.wheelLED);
  W.ferris = wheel; W.blink.push(W.warnLight(X, 113.5, Z));
  W.addCollider(X, Z, 23, 12, -0.72, -1, 9);
}

// Yokohama Marine Tower — 106 m decagonal lattice, observation deck near the top (35.4436 N, 139.6508 E)
function marineTower(W, far) {
  const X = -2648, Z = 1979;
  const g = new THREE.Group(); g.position.set(X, 0, Z); far.add(g);
  const steel = W.night(new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.7, roughness: 0.35, emissive: 0xff5040, emissiveIntensity: 0 }), 0, 0.55);
  const pts = []; const N = 10;
  const rAt = y => 10 - y / 106 * 6.5;
  for (let i = 0; i < N; i++) {
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a0) * rAt(0), 0, Math.sin(a0) * rAt(0)), new THREE.Vector3(Math.cos(a0) * rAt(90), 90, Math.sin(a0) * rAt(90)));
    for (let y = 0; y < 90; y += 9) { // diagonal lattice
      pts.push(new THREE.Vector3(Math.cos(a0) * rAt(y), y, Math.sin(a0) * rAt(y)), new THREE.Vector3(Math.cos(a1) * rAt(y + 9), y + 9, Math.sin(a1) * rAt(y + 9)));
      pts.push(new THREE.Vector3(Math.cos(a1) * rAt(y), y, Math.sin(a1) * rAt(y)), new THREE.Vector3(Math.cos(a0) * rAt(y + 9), y + 9, Math.sin(a0) * rAt(y + 9)));
    }
  }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), W.night(new THREE.LineBasicMaterial({ color: 0xdfe3e6 }), 0, 0)));
  // solid core so it reads at distance
  const core = new THREE.Mesh(new THREE.CylinderGeometry(rAt(90) * 0.75, rAt(0) * 0.75, 90, 10, 1, true), steel); core.position.y = 45; g.add(core);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 6.5, 9, 10), W.night(new THREE.MeshStandardMaterial({ color: 0xe8ecef, metalness: 0.4, roughness: 0.3, emissive: 0xfff1d6, emissiveIntensity: 0 }), 0.05, 1.2)); deck.position.y = 94; g.add(deck);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 3, 12, 10), steel); top.position.y = 104; g.add(top);
  W.blink.push(W.warnLight(X, 111, Z));
  W.addCollider(X, Z, 9, 9, 0, -1, 106);
}

// NYK Hikawa Maru (1930 ocean liner, 163 m) moored at Yamashita Park (35.4469 N, 139.6503 E)
function hikawaMaru(W, far) {
  const X = -2700, Z = 1585, YAW = 0.48;
  const g = new THREE.Group(); g.position.set(X, -1.6, Z); g.rotation.y = YAW; far.add(g);
  const hull = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.6 }), red = new THREE.MeshStandardMaterial({ color: 0x8d1f19, roughness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf0eee8, roughness: 0.55 }), buff = new THREE.MeshStandardMaterial({ color: 0xd9b46a, roughness: 0.6 });
  // hull: tapered bow/stern via a shaped extrusion
  const sh = new THREE.Shape(); sh.moveTo(-81, 0); sh.quadraticCurveTo(-78, 10, -70, 10.5); sh.lineTo(70, 10.5); sh.quadraticCurveTo(82, 10, 84, 0); sh.lineTo(-81, 0);
  const hg = new THREE.ExtrudeGeometry(sh, { depth: 20, bevelEnabled: false }); hg.translate(0, 0, -10); hg.rotateY(Math.PI / 2);
  const hm = new THREE.Mesh(hg, hull); hm.position.y = -2; g.add(hm);
  const wl = new THREE.Mesh(new THREE.BoxGeometry(19.6, 1.6, 150), red); wl.position.y = 0.2; g.add(wl);
  // superstructure decks + windows
  const win = W.night(new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0xffd9a0, emissiveIntensity: 0 }), 0, 1.4);
  for (const [w, h, l, y, z] of [[17, 3, 96, 10, -2], [14, 3, 70, 13, -2], [11, 2.6, 30, 16, 6]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), white); m.position.set(0, y, z); g.add(m); const ws = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.6, l - 2), win); ws.position.set(0, y + 0.3, z); g.add(ws); }
  const fun = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 11, 16), buff); fun.position.set(0, 22, -2); g.add(fun);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.45, 2, 16), red); band.position.set(0, 26, -2); g.add(band);
  for (const z of [-52, 48]) { const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 30, 8), buff); mast.position.set(0, 24, z); g.add(mast); }
  // dressing lights (bow → masts → stern), lit at night
  const pts = []; const A = [0, 9, -80], B = [0, 39, -52], C = [0, 39, 48], D = [0, 9, 82];
  for (const [p, q] of [[A, B], [B, C], [C, D]]) for (let i = 0; i < 30; i++) { const t = i / 30; pts.push(new THREE.Vector3(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t - Math.sin(t * Math.PI) * 2, p[2] + (q[2] - p[2]) * t)); }
  const lp = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: 0xfff2c8, size: 1.4, transparent: true, opacity: 0 })); W.night(lp.material, 0, 1).userData.opacityMode = true; g.add(lp);
}

// per-frame: gondolas stay level, the hub clock shows the in-game time
export function updateLandmarks(W, dt, hours) {
  if (W.gondolas && W.ferris) for (const gd of W.gondolas) gd.rotation.z = -W.ferris.rotation.z;
  const C = W.cosmoClock; if (!C) return;
  const h = Math.floor(hours) % 24, m = Math.floor((hours % 1) * 60); const s = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  if (s === C.last) return; C.last = s;
  const g = C.cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#7dfcff'; g.font = '700 150px "Courier New",monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 256, 132);
  C.tex.needsUpdate = true;
}
