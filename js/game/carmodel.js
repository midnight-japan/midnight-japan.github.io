// Procedural high-poly car generator.
// Body = smooth parametric surface (rings of superellipse sections with rounded end caps),
// cabin = second parametric surface (greenhouse) with glass/paint face groups,
// doors / trunk / hood / windows are patches of the same surfaces so they open with correct shape.
// Lamps are recessed housings cut into the same surface; all emissive lamp elements of a car share
// ONE material whose per-lamp intensities are driven by CarModel.lights.
// Local axes: +Z forward, +Y up, +X = car's left. Origin = ground below wheelbase centre.
//
// LOD (opts.lod): 'full' (default — player car / garage: cockpit interior, lamp internals, real lights),
//                 'mid'  (nearby / online cars: lamp housings, simple interior, full wheels),
//                 'low'  (traffic: coarse surfaces, seat silhouettes; safe for traffic.mergeModel)
import * as THREE from 'three';
import { shapeFor } from './carshapes.js';
import { plateMesh, randomPlate } from './plates.js';
import { Kit, T, M, roundedBox as rbox, buildWheel, buildInteriorLite, lampMaterial, flarePoints, LAMP, flakeTex, clusterStyle } from './carparts.js';
import { buildInterior, drawCockpit, makeMirrors } from './interiors.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);

// Monotone-ish Catmull-Rom over sorted keys [[x,y],...]
function curve(keys) {
  keys = keys.slice().sort((a, b) => a[0] - b[0]);
  return x => {
    if (x <= keys[0][0]) return keys[0][1];
    const n = keys.length;
    if (x >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (x > keys[i + 1][0]) i++;
    const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n - 1, i + 2)];
    const t = (x - p1[0]) / (p2[0] - p1[0]);
    const m1 = (p2[1] - p0[1]) / Math.max(1e-6, p2[0] - p0[0]) * (p2[0] - p1[0]);
    const m2 = (p3[1] - p1[1]) / Math.max(1e-6, p3[0] - p1[0]) * (p2[0] - p1[0]);
    const d = p2[1] - p1[1];
    const c1 = d === 0 ? 0 : clamp(m1, -3 * Math.abs(d) - 0.05, 3 * Math.abs(d) + 0.05);
    const c2 = d === 0 ? 0 : clamp(m2, -3 * Math.abs(d) - 0.05, 3 * Math.abs(d) + 0.05);
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * c1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * c2;
  };
}

// ───────────────────────── shared materials ─────────────────────────
// Glass that keeps its reflections at low opacity (specular is added, only the diffuse part is alpha-blended).
function glassMaterial(color, opacity, env = 1.8, side = THREE.FrontSide) {
  const m = new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.02, ior: 1.52, transparent: true, opacity, envMapIntensity: env, side, depthWrite: false, premultipliedAlpha: true });
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <opaque_fragment>', 'gl_FragColor = vec4( totalDiffuse * diffuseColor.a + totalSpecular, diffuseColor.a );')
      .replace('#include <premultiplied_alpha_fragment>', '');
  };
  m.customProgramCacheKey = () => 'mj-glass-1';
  return m;
}
const MAT = {};
function mats() {
  if (MAT.ready) return MAT;
  MAT.glass = glassMaterial(0x0b1013, 0.34, 2.0);
  MAT.glassTint = glassMaterial(0x050607, 0.78, 2.0);
  MAT.glassIn = glassMaterial(0x0b1013, 0.14, 0.18, THREE.BackSide);
  MAT.glassInTint = glassMaterial(0x050607, 0.5, 0.18, THREE.BackSide);
  MAT.glassLow = glassMaterial(0x080a0c, 0.62, 2.0, THREE.DoubleSide);
  MAT.lens = glassMaterial(0xffffff, 0.06, 2.4);
  MAT.lensRed = glassMaterial(0xb01008, 0.32, 1.8);
  MAT.trim = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.55, metalness: 0.1 });
  MAT.trimGloss = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.15, clearcoat: 1 });
  MAT.chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.06, metalness: 1 });
  MAT.rubber = new THREE.MeshStandardMaterial({ color: 0x101011, roughness: 0.9, metalness: 0 });
  MAT.interior = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.85 });
  MAT.liner = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.9, side: THREE.BackSide });
  MAT.doorIn = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.8, side: THREE.BackSide });
  MAT.well = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.95, side: THREE.DoubleSide });
  MAT.hidden = new THREE.MeshBasicMaterial({ visible: false });
  MAT.ready = true;
  return MAT;
}
export function paintMaterial(hex, finish = 'metallic', flakes = false) {
  const metallic = finish === 'metallic' || finish === 'pearl';
  const m = new THREE.MeshPhysicalMaterial({
    color: hex, vertexColors: true,
    metalness: finish === 'solid' ? 0.0 : finish === 'matte' ? 0.25 : 0.62,
    roughness: finish === 'matte' ? 0.58 : finish === 'solid' ? 0.3 : 0.34,
    clearcoat: finish === 'matte' ? 0 : 1, clearcoatRoughness: 0.025, envMapIntensity: 1.25,
    specularIntensity: finish === 'solid' ? 0.6 : 1,
  });
  if (flakes && metallic) { const t = flakeTex().clone(); t.repeat.set(9, 9); m.normalMap = t; m.normalScale.set(0.16, 0.16); }
  if (finish === 'pearl') { m.iridescence = 0.35; m.iridescenceIOR = 1.6; m.sheen = 0.3; }
  return m;
}

// ───────────────────────── surfaces ─────────────────────────
function makeProfile(car, S) {
  const L = car.L / 1000, W = car.W / 1000, H = S.roofH || car.H / 1000, wb = car.wb / 1000;
  const over = L - wb;
  const fo = over * S.foR, ro = over - fo;
  const zF = wb / 2 + fo, zR = -wb / 2 - ro;
  const hw = W / 2 - 0.01;
  const P = { L, W, H, wb, fo, ro, zF, zR, hw };
  const at = f => zF - f * L;
  P.zA = at(S.cA); P.zB = at(S.cB); P.zC = at(S.cC); P.zD = at(S.cD);
  P.top = curve([
    [zR, S.tail], [zR + ro * 0.35, S.deck * 0.985], [zR + ro * 0.9, S.deck], [P.zD, S.belt + (S.deck - S.belt) * 0.6],
    [(P.zD + P.zA) / 2, S.belt], [P.zA, S.cowl], [P.zA + (zF - P.zA) * 0.55, lerp(S.cowl, S.nose, 0.45)], [zF - fo * 0.25, S.nose * 1.01], [zF, S.nose * 0.96],
  ]);
  P.bot = curve([[zR, S.lipR], [zR + ro * 0.45, S.clr + 0.04], [-wb / 2, S.clr], [wb / 2, S.clr], [zF - fo * 0.45, S.clr + 0.03], [zF, S.lipF]]);
  P.half = curve([[zR, hw * S.wR], [zR + ro * 0.5, hw * lerp(S.wR, 1, 0.75)], [-wb / 2, hw], [wb / 2, hw], [zF - fo * 0.4, hw * lerp(S.wF, 1, 0.7)], [zF, hw * S.wF]]);
  P.roof = curve([
    [P.zD - 0.001, S.belt], [lerp(P.zD, P.zC, 0.55), lerp(S.belt, H, 0.78) + (H - S.belt) * S.rearBow], [P.zC, H - 0.012], [(P.zC + P.zB) / 2, H],
    [P.zB, H - 0.01], [lerp(P.zB, P.zA, 0.45), lerp(H, S.cowl, 0.42) + (H - S.cowl) * S.wsBow], [P.zA + 0.001, S.cowl],
  ]);
  const rimR = S.rim * 0.0254 / 2;
  P.tireW = S.tireW; P.wheelR = rimR + S.tireW * S.aspect; P.rimR = rimR;
  P.track = hw - S.tireW / 2 - 0.035 + S.trackAdj;
  P.axF = wb / 2; P.axR = -wb / 2;
  P.archR = P.wheelR + 0.045;
  return P;
}

// Body point at ring parameter (z, scale) & angle θ.  θ: 0 = left(+X), π/2 = top, π = right, 3π/2 = bottom
function sectionPoint(P, S, z, scale, th, out) {
  const t = P.top(z), b = P.bot(z), hw = P.half(z);
  const yc = (t + b) / 2, hb = (t - b) / 2;
  const c = Math.cos(th), s = Math.sin(th);
  const e = s >= 0 ? 2 / S.sqTop : 2 / S.sqBot;
  const x = spow(c, e) * hw * scale;
  let y = yc + spow(s, e) * hb * scale;
  if (s < 0) y = Math.max(y, b);
  return out.set(x, y, z);
}
// outer half-width of the body section at height y
function bodyXAt(P, S, z, y) {
  const t = P.top(z), b = P.bot(z), hw = P.half(z);
  const yc = (t + b) / 2, hb = (t - b) / 2;
  const sN = clamp((y - yc) / hb, -1, 1);
  const e = sN >= 0 ? 2 / S.sqTop : 2 / S.sqBot;
  const s = spow(sN, 1 / e), c = Math.sqrt(Math.max(0, 1 - s * s));
  return Math.pow(c, e) * hw;
}

function ringsFor(P, S, nMain = 84, nCap = 12) {
  const rings = [];
  const capR = S.capR, capF = S.capF;
  for (let i = 0; i <= nCap; i++) {
    const phi = (1 - i / nCap) * Math.PI / 2;
    rings.push({ z: P.zR + capR - capR * Math.sin(phi), scale: Math.pow(Math.cos(phi), 0.9) * 0.999 + 0.001, cap: -1 });
  }
  for (let i = 1; i < nMain; i++) rings.push({ z: lerp(P.zR + capR, P.zF - capF, i / nMain), scale: 1, cap: 0 });
  for (let i = 0; i <= nCap; i++) {
    const phi = (i / nCap) * Math.PI / 2;
    rings.push({ z: P.zF - capF + capF * Math.sin(phi), scale: Math.pow(Math.cos(phi), 0.9) * 0.999 + 0.001, cap: 1 });
  }
  return rings;
}

// Generic grid → BufferGeometry with optional face filter, groups, vertex colour & uv
function gridGeometry(rows, cols, posFn, { closedCols = false, faceKeep = null, faceGroup = null, colorFn = null, uvFn = null, flip = false } = {}) {
  const pos = [], col = [], uv = [], idx = [];
  const v = new THREE.Vector3();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    posFn(r, c, v); pos.push(v.x, v.y, v.z);
    if (colorFn) { const k = colorFn(r, c, v); col.push(k, k, k); }
    if (uvFn) { const q = uvFn(r, c, v); uv.push(q[0], q[1]); }
  }
  const groups = {};
  const cmax = closedCols ? cols : cols - 1;
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cmax; c++) {
    if (faceKeep && !faceKeep(r, c)) continue;
    const c1 = (c + 1) % cols;
    const a = r * cols + c, b = r * cols + c1, d = (r + 1) * cols + c, e = (r + 1) * cols + c1;
    const g = faceGroup ? faceGroup(r, c) : 0;
    if (flip) (groups[g] ||= []).push(a, d, b, b, d, e); else (groups[g] ||= []).push(a, b, d, b, e, d);
  }
  const keys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  let start = 0; const gl = [];
  for (const k of keys) { idx.push(...groups[k]); gl.push([start, groups[k].length, k]); start += groups[k].length; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  if (uvFn) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  for (const [s, c, m] of gl) g.addGroup(s, c, m);
  g.computeVertexNormals();
  return g;
}

// real (scene) lights are limited to a couple of live models (player car + garage preview)
const LIVE_LIGHTS = new Set();

// ───────────────────────── main builder ─────────────────────────
export function buildCar(car, opts = {}) {
  const lod = opts.lod === 'low' || opts.lod === 'mid' ? opts.lod : 'full';
  const full = lod === 'full', low = lod === 'low';
  const S = shapeFor(car);
  const P = makeProfile(car, S);
  const m = mats();
  const paintHex = opts.color || car.colors[0];
  const finish = opts.finish || (car.cat === 'police' ? 'solid' : 'metallic');
  const paint = paintMaterial(paintHex, finish, full);
  const paintFlat = paintMaterial(paintHex, finish, false); paintFlat.vertexColors = false;
  const root = new THREE.Group(); root.name = car.id;
  const bodyG = new THREE.Group(); root.add(bodyG);
  const year = car.year || 2000;

  const rings = ringsFor(P, S, low ? 50 : lod === 'mid' ? 96 : 150, low ? 6 : lod === 'mid' ? 10 : 14);
  const NT = low ? 32 : lod === 'mid' ? 64 : 96;
  const dTh = TAU / NT;
  const theta = c => c * dTh;
  const driverX = (car.lhd ? 1 : -1) * Math.min(0.38, P.hw * 0.48);
  P.driverX = driverX;

  // door / hood / trunk regions (z ranges)
  const doorZ1 = P.zA + 0.05, doorZ0 = S.doors === 4 ? P.zA - (P.zA - P.zD) * 0.48 : P.zA - Math.min(1.25, (P.zA - P.zD) * 0.78);
  const rdoorZ0 = S.doors === 4 ? Math.max(P.zD + 0.08, -P.wb / 2 + P.archR + 0.03) : 0, rdoorZ1 = S.doors === 4 ? doorZ0 - 0.012 : 0;
  const doorTh = 0.62;
  const doorYmin = S.clr + 0.12;
  const isSide = (th, y) => (Math.abs(Math.cos(th)) > Math.cos(doorTh)) && y > doorYmin;
  const hoodZ0 = P.zA + 0.06, hoodZ1 = P.zF - S.capF - 0.08;
  const trunkZ0 = P.zR + S.capR + 0.06, trunkZ1 = P.zD - 0.04;
  const topBand = th => Math.sin(th) > Math.sin(0.62 * Math.PI / 2 + 0.25);
  const cabinHole = (z, th) => !S.cargo && z > P.zD + 0.02 && z < P.zA - 0.02 && Math.sin(th) > 0.2 && Math.abs(Math.cos(th)) < 0.93;

  // ── lamp regions on the end caps (aligned to body grid columns so the housings fit the holes exactly) ──
  const regionFor = (cap, spec) => {
    const [sMin, sMax, thMin, thMax] = spec;
    const rs = []; rings.forEach((R, i) => { if (R.cap === cap && R.scale >= sMin && R.scale <= sMax) rs.push(i); });
    if (rs.length < 2) return null;
    let c0 = Math.round(thMin / dTh), c1 = Math.round(thMax / dTh); if (c1 - c0 < 2) c1 = c0 + 2;
    return { cap, r0: Math.min(...rs), r1: Math.max(...rs), c0, c1, thMin, thMax, right: false };
  };
  const mirrorReg = R => R && ({ ...R, c0: NT / 2 - R.c1, c1: NT / 2 - R.c0, right: true });
  const headReg = regionFor(1, S.headlight);
  const tailReg = S.roundTails ? null : regionFor(-1, S.taillight);
  const lampRegs = [headReg, mirrorReg(headReg), tailReg, mirrorReg(tailReg)].filter(Boolean);
  const inLamp = (r, c) => lampRegs.some(L => r >= L.r0 && r < L.r1 && c >= L.c0 && c < L.c1);

  // body vertex positions (needed for patches too)
  const bodyPos = (r, c, out) => {
    const R = rings[r], th = theta(c);
    sectionPoint(P, S, R.z, R.scale, th, out);
    for (const az of [P.axF, P.axR]) {
      const dz = out.z - az, dy = out.y - P.wheelR;
      const d = Math.hypot(dz, dy);
      const side = Math.abs(out.x) > P.half(R.z) * 0.45 && out.y < P.wheelR + P.archR + 0.02;
      if (!side) continue;
      const band = 0.045;
      const inner = P.track - P.tireW / 2 - 0.05;
      if (d < P.archR) {
        if (d > P.archR - band && dy > -P.wheelR * 0.6) { const k = (P.archR - 0.002) / Math.max(d, 1e-4); out.z = az + dz * k; out.y = P.wheelR + dy * k; }
        out.x = Math.sign(out.x) * Math.min(Math.abs(out.x), inner);
        out.userDark = true;
      } else {
        if (d < P.archR + band * 0.5 && dy > -P.wheelR * 0.6) { const k = P.archR / d; out.z = az + dz * k; out.y = P.wheelR + dy * k; }
        const dd = Math.hypot(out.z - az, out.y - P.wheelR);
        if (dd < P.archR + 0.16) out.x += Math.sign(out.x) * S.flare * (1 - (dd - P.archR) / 0.16) * smooth(clamp((out.y - S.clr) / 0.2, 0, 1));
      }
    }
    return out;
  };
  const bodyColor = (r, c, v) => {
    const R = rings[r], th = theta(c);
    let k = 1;
    if (v.userDark) { k = 0.03; v.userDark = false; }
    const s = Math.sin(th);
    if (s < -0.75) k = Math.min(k, 0.05);
    if (R.cap === 1 && R.scale < 0.94) {
      const yRel = (v.y - P.bot(R.z)) / (P.top(R.z) - P.bot(R.z));
      if (Math.abs(v.x) < P.hw * S.grilleW && yRel > S.grilleY0 && yRel < S.grilleY1) k = Math.min(k, 0.06);
      if (yRel < 0.16) k = Math.min(k, 0.08);
    }
    if (R.cap === -1 && R.scale < 0.95) {
      const yRel = (v.y - P.bot(R.z)) / (P.top(R.z) - P.bot(R.z));
      if (yRel < 0.22) k = Math.min(k, 0.09);
    }
    return k;
  };
  const bodyUV = (r, c, v) => { const R = rings[r]; const per = 2 * (2 * P.half(R.z) + P.top(R.z) - P.bot(R.z)) * R.scale; return [c / NT * per, v.z]; };

  const rowsB = rings.length;
  const keepBody = (r, c) => {
    const R = rings[r], th = theta(c + 0.5);
    const z = R.z;
    const y = (P.top(z) + P.bot(z)) / 2 + Math.sin(th) * (P.top(z) - P.bot(z)) / 2;
    if (isSide(th, y) && y < S.belt + 0.01) {
      if (z > doorZ0 && z < doorZ1) return false;
      if (S.doors === 4 && z > rdoorZ0 && z < rdoorZ1) return false;
    }
    if (cabinHole(z, th)) return false;
    if (S.hood && topBand(th) && z > hoodZ0 && z < hoodZ1 && Math.abs(Math.cos(th)) < 0.82) return false;
    if (S.trunk && topBand(th) && z > trunkZ0 && z < trunkZ1 && Math.abs(Math.cos(th)) < 0.82) return false;
    return true;
  };
  const bodyGeo = gridGeometry(rowsB, NT, bodyPos, { closedCols: true, faceKeep: (r, c) => keepBody(r, c) && !inLamp(r, c), colorFn: bodyColor, uvFn: full ? bodyUV : null });
  if (S.twoTone) {
    const pos = bodyGeo.attributes.position, colA = bodyGeo.attributes.color;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < S.twoTone.y && (S.twoTone.zMin === undefined || pos.getZ(i) > S.twoTone.zMin)) colA.setXYZ(i, S.twoTone.k, S.twoTone.k, S.twoTone.k);
  }
  const body = new THREE.Mesh(bodyGeo, paint);
  body.castShadow = true; body.receiveShadow = true;
  bodyG.add(body);

  // inner liner (so openings don't look hollow)
  const liner = new THREE.Mesh(gridGeometry(rowsB, NT, (r, c, o) => { bodyPos(r, c, o); o.x *= 0.985; o.y = lerp(P.bot(rings[r].z), o.y, 0.99); return o; }, { closedCols: true, faceKeep: (r, c) => !cabinHole(rings[r].z, theta(c + 0.5)) }), m.liner);
  bodyG.add(liner);
  // wheel-well liners (dark tubs inside the arches)
  if (!low) for (const az of [P.axF, P.axR]) for (const sx of [1, -1]) {
    const inner = P.track - P.tireW / 2 - 0.05;
    const w = 0.34;
    const g = new THREE.CylinderGeometry(P.archR - 0.004, P.archR - 0.004, w, 28, 1, true, -0.25, Math.PI + 0.5);
    g.rotateZ(Math.PI / 2); g.rotateX(-Math.PI / 2);
    const ww = new THREE.Mesh(g, m.well); ww.position.set(sx * (inner - w / 2 + 0.06), P.wheelR, az); bodyG.add(ww);
  }

  // rolled arch lips (hide the stair-stepping of the grid where it meets the wheel opening)
  if (!low) for (const az of [P.axF, P.axR]) for (const sx of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 28; i++) {
      const a = lerp(-0.3, Math.PI + 0.3, i / 28), z = az + Math.cos(a) * (P.archR + 0.004), y = P.wheelR + Math.sin(a) * (P.archR + 0.004);
      if (y < P.bot(z) + 0.035) continue;
      const x = bodyXAt(P, S, z, y) + S.flare * smooth(clamp((y - S.clr) / 0.2, 0, 1)) - 0.012;
      pts.push(new THREE.Vector3(sx * x, y, z));
    }
    if (pts.length > 3) { const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.016, 6); const tm = new THREE.Mesh(tg, paintFlat); tm.castShadow = true; bodyG.add(tm); }
  }
  // patches (doors/hood/trunk) from the same surface, as separate meshes with pivots; small shut-line gaps at the z edges
  const parts = { doors: [], windows: [], hood: null, trunk: null, wheels: [], lights: {} };
  const GAP = low ? 0 : 0.0045;
  const patch = (zr0, zr1, keepFn, pivot) => {
    const rIdx = []; rings.forEach((R, i) => { if (R.z >= zr0 - 1e-4 && R.z <= zr1 + 1e-4) rIdx.push(i); });
    if (rIdx.length < 2) return null;
    const r0 = Math.max(0, rIdx[0] - 1), r1 = Math.min(rings.length - 1, rIdx[rIdx.length - 1] + 1);
    const nR = r1 - r0 + 1;
    const geo = gridGeometry(nR, NT, (r, c, o) => { bodyPos(r + r0, c, o); if (r === 1) o.z += GAP; if (r === nR - 1) o.z -= GAP; o.sub(pivot); return o; },
      { closedCols: true, faceKeep: (r, c) => !keepBody(r + r0, c) && !cabinHole(rings[r + r0].z, theta(c + 0.5)) && keepFn(r + r0, c), colorFn: (r, c, v) => { const o = v.clone().add(pivot); return bodyColor(r + r0, c, o); }, uvFn: full ? (r, c, v) => bodyUV(r + r0, c, v.clone().add(pivot)) : null });
    const g = new THREE.Group(); g.position.copy(pivot);
    const mesh = new THREE.Mesh(geo, paint); mesh.castShadow = true;
    const inner = new THREE.Mesh(geo, m.doorIn);
    g.add(mesh, inner);
    bodyG.add(g);
    return g;
  };
  const mkDoor = (z0, z1, left, rear) => {
    const pivot = new THREE.Vector3((left ? 1 : -1) * P.half(z1) * 0.98, S.belt * 0.6, z1);
    const keep = (r, c) => { const th = theta(c + 0.5); return left ? Math.cos(th) > 0 : Math.cos(th) < 0; };
    const g = patch(z0, z1, keep, pivot);
    if (!g) return;
    parts.doors.push({ pivot: g, left, rear, open: 0, target: 0, z0, z1 });
  };
  mkDoor(doorZ0, doorZ1, true, false); mkDoor(doorZ0, doorZ1, false, false);
  if (S.doors === 4) { mkDoor(rdoorZ0, rdoorZ1, true, true); mkDoor(rdoorZ0, rdoorZ1, false, true); }
  if (S.hood) { const pv = new THREE.Vector3(0, P.top(hoodZ0), hoodZ0); const g = patch(hoodZ0, hoodZ1, () => true, pv); if (g) parts.hood = { pivot: g, open: 0, target: 0, dir: 1 }; }
  if (S.trunk) { const pv = new THREE.Vector3(0, P.top(trunkZ1), trunkZ1); const g = patch(trunkZ0, trunkZ1, () => true, pv); if (g) parts.trunk = { pivot: g, open: 0, target: 0, dir: -1 }; }

  // ───── cabin / greenhouse ─────
  const NC = low ? 20 : 40, RC = low ? 26 : 52;
  const cz = r => lerp(P.zD, P.zA, r / (RC - 1));
  const roofHalf = z => P.half(z) * S.roofW;
  const cabPos = (r, c, o) => {
    const z = cz(r); const th = (c / (NC - 1)) * Math.PI;
    const yb = P.top(z) - 0.005, yr = Math.max(yb, P.roof(z));
    const sv = Math.sin(th), cv = Math.cos(th);
    const k = Math.pow(sv, 2 / S.cabSq);
    const y = yb + (yr - yb) * k;
    const wBelt = P.half(z) * 0.965;
    const x = spow(cv, 2 / S.cabSq) * lerp(wBelt, roofHalf(z), k);
    return o.set(x, y, z);
  };
  const B_PILLAR = S.doors === 4 ? doorZ0 : lerp(P.zA, P.zD, 0.62);
  const cabGroup = (r, c) => {
    const z = (cz(r) + cz(r + 1)) / 2, th = ((c + 0.5) / (NC - 1)) * Math.PI;
    const side = th < S.sideTh || th > Math.PI - S.sideTh;
    const pillarBand = (th > S.sideTh - 0.12 && th < S.sideTh) || (th < Math.PI - S.sideTh + 0.12 && th > Math.PI - S.sideTh);
    const roof = z < P.zB - 0.04 && z > P.zC + 0.04 && !side;
    if (S.open) {
      if (z > P.zB - 0.02 && !side) return pillarBand ? 0 : 1;
      if (z > P.zB - 0.06 && !side) return 0;
      return -1;
    }
    if (roof) return S.glassRoof && !pillarBand && Math.abs(th - Math.PI / 2) < 0.7 ? 1 : 0;
    if (pillarBand && z > P.zB - 0.06) return 0;
    if (pillarBand && z < P.zC + 0.1) return S.cPillar ? 0 : 2;
    if (side) {
      if (Math.abs(z - B_PILLAR) < 0.05) return 2;
      if (z > B_PILLAR && z < doorZ1 + 0.02 && z < P.zB + 0.15) return -1;
      if (S.cPillar && z < P.zC + S.cPillar) return 0;
      if (th < 0.06 || th > Math.PI - 0.06) return 2;
      return 1;
    }
    return 1;
  };
  const cabGeo = gridGeometry(RC, NC, cabPos, { faceKeep: (r, c) => cabGroup(r, c) >= 0, faceGroup: (r, c) => Math.max(0, cabGroup(r, c)), colorFn: () => 1 }); // rows run rear→front, columns left→right over the top: unflipped winding faces outwards (like the body)
  const glassOut = low ? m.glassLow : S.tint ? m.glassTint : m.glass, glassIn = S.tint ? m.glassInTint : m.glassIn;
  if (low) {
    const cabin = new THREE.Mesh(cabGeo, [paint, glassOut, m.trimGloss]);
    cabin.castShadow = true; cabin.renderOrder = 2; bodyG.add(cabin);
  } else {
    const cabin = new THREE.Mesh(cabGeo, [paint, m.hidden, m.trimGloss]); cabin.castShadow = true; bodyG.add(cabin);
    // headliner / pillar trim seen from the cockpit (the painted skin only faces outwards)
    const headliner = new THREE.Mesh(cabGeo, [m.liner, m.hidden, m.liner]); headliner.customDepthMaterial = M.noShadow(); bodyG.add(headliner);
    const gOut = new THREE.Mesh(cabGeo, [m.hidden, glassOut, m.hidden]); gOut.renderOrder = 3; gOut.customDepthMaterial = M.noShadow();
    const gIn = new THREE.Mesh(cabGeo, [m.hidden, glassIn, m.hidden]); gIn.renderOrder = 2; gIn.customDepthMaterial = M.noShadow();
    bodyG.add(gOut, gIn);
  }
  // front side windows as separate glass that slides down (child of door pivot)
  for (const d of parts.doors.filter(d => !d.rear)) {
    const rows = []; for (let r = 0; r < RC; r++) { const z = cz(r); if (z >= B_PILLAR - 0.01 && z <= Math.min(doorZ1 + 0.02, P.zB + 0.15) + 0.02) rows.push(r); }
    if (rows.length < 2 || S.open) { d.window = null; continue; }
    const r0 = rows[0];
    const pv = d.pivot.position;
    const geo = gridGeometry(rows.length, NC, (r, c, o) => { cabPos(r + r0, c, o); o.sub(pv); o.x *= 0.995; return o; },
      { faceKeep: (r, c) => { const th = ((c + 0.5) / (NC - 1)) * Math.PI; return (d.left ? th < S.sideTh - 0.12 : th > Math.PI - S.sideTh + 0.12) && th > 0.06 && th < Math.PI - 0.06; } });
    const wg = new THREE.Group();
    const win = new THREE.Mesh(geo, glassOut); win.renderOrder = 3; win.customDepthMaterial = M.noShadow(); wg.add(win);
    if (!low) { const wi = new THREE.Mesh(geo, glassIn); wi.renderOrder = 2; wi.customDepthMaterial = M.noShadow(); wg.add(wi); }
    d.pivot.add(wg);
    d.window = wg; d.winOpen = 0; d.winTarget = 0;
    parts.windows.push(d);
  }

  // engine bay (visible with the hood open): detailed engine matching car.engine (inline / V / boxer / rotary), radiator,
  // battery, reservoirs, strut bar, bay floor — scaled to fit under this car's bonnet
  if (S.hood && car.engine.type !== 'EV' && !low) {
    const zc = (hoodZ0 + hoodZ1) / 2;
    const hoodLow = Math.min(P.top(hoodZ0), P.top(hoodZ1), P.top(zc)) - 0.05;
    const floorY = S.clr + 0.12;
    const eg = buildEngineBay(car, { width: P.hw * 2 * 0.86, length: Math.max(0.5, hoodZ1 - hoodZ0 - 0.12), floorY, topY: hoodLow, zc, zFront: hoodZ1, zRear: hoodZ0, hw: P.hw });
    bodyG.add(eg); parts.engineBay = eg;
  }

  // ───── lamps ─────
  const lampMat = lampMaterial();
  parts.lampI = lampMat.userData.lampI;
  const lk = new Kit(), hk = new Kit(), dk = new Kit(); // lamp elements / housings+lenses / small exterior details
  const flares = [];
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const capNormal = (o, cap) => { const yc = (P.top(o.z) + P.bot(o.z)) / 2; return tmpB.set(o.x * 0.5 / P.hw, (o.y - yc) * 0.8, cap).normalize(); };
  const surfAt = (L, rf, cf, out) => {
    const ra = rings[L.r0], rb = rings[L.r1];
    const c = lerp(L.c0, L.c1, cf);
    return sectionPoint(P, S, lerp(ra.z, rb.z, rf), lerp(ra.scale, rb.scale, rf), theta(c), out);
  };
  const DEPTH = 0.05;
  // fraction across the lamp from its OUTER (side) edge
  const outerFrac = (L, c) => { const f = (c - L.c0) / (L.c1 - L.c0); return L.right ? 1 - f : f; };
  const buildHousing = (L, backId) => { // backId(rf, cf) → 0 = chrome housing, else lamp id
    const nR = L.r1 - L.r0 + 1, nC = L.c1 - L.c0 + 1;
    const inner = (r, c, o) => { bodyPos(L.r0 + r, L.c0 + c, o); const n = capNormal(o, L.cap); return o.addScaledVector(n, -DEPTH); };
    const outer = (r, c, o) => bodyPos(L.r0 + r, L.c0 + c, o);
    const grp = (r, c) => backId((r + 0.5) / (nR - 1), outerFrac(L, L.c0 + c + 0.5));
    const back = gridGeometry(nR, nC, inner, { faceGroup: grp });
    // split: group 0 → housing material, others → lamp material by id
    const g0 = back.groups.filter(g => g.materialIndex === 0), gL = back.groups.filter(g => g.materialIndex !== 0);
    if (g0.length) { const gg = back.clone(); gg.clearGroups(); for (const g of g0) gg.addGroup(g.start, g.count, 0); hk.add(gg, [M.housing()]); }
    if (gL.length) { const gg = back.clone(); gg.clearGroups(); for (const g of gL) gg.addGroup(g.start, g.count, g.materialIndex); lk.add(gg, lampMat, null, { lampByGroup: true }); }
    // side walls
    const edges = [[0, 0, 0, 1, nC], [nR - 1, 0, 0, 1, nC], [0, 0, 1, 0, nR], [0, nC - 1, 1, 0, nR]];
    for (const [r, c, dr, dc, n] of edges) hk.add(gridGeometry(2, n, (k, i, o) => (k === 0 ? outer : inner)(r + dr * i, c + dc * i, o)), M.housingDark());
    return { nR, nC };
  };
  const lens = (L, mat, filter = null) => {
    const nR = L.r1 - L.r0 + 1, nC = L.c1 - L.c0 + 1;
    const g = gridGeometry(nR, nC, (r, c, o) => { bodyPos(L.r0 + r, L.c0 + c, o); return o.addScaledVector(capNormal(o, L.cap), 0.0015); }, { faceKeep: filter ? (r, c) => filter(outerFrac(L, L.c0 + c + 0.5)) : null });
    hk.add(g, mat);
  };
  const orient = (pos, n) => new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n), new THREE.Vector3(1, 1, 1));
  const at = (L, rf, cf, depthK, out = new THREE.Vector3()) => { const c = L.right ? 1 - cf : cf; surfAt(L, rf, c, out); const n = capNormal(out, L.cap).clone(); out.addScaledVector(n, -DEPTH * depthK); return [out, n]; };
  const projector = (L, rf, cf, rad, id) => {
    const [p, n] = at(L, rf, cf, 0.55);
    const M4 = orient(p, n);
    hk.add(new THREE.CylinderGeometry(rad * 1.35, rad * 1.05, DEPTH * 0.6, 20, 1, true).rotateX(Math.PI / 2), M.housing(), M4);
    hk.add(new THREE.TorusGeometry(rad * 1.25, rad * 0.12, 6, 24), M.chrome(), M4);
    lk.add(new THREE.SphereGeometry(rad, 18, 10, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2), lampMat, M4, { lamp: id });
    flares.push({ p: p.clone().addScaledVector(n, DEPTH * 0.6 + 0.01), id, size: id === LAMP.HIGH ? 0.55 : 0.42, dir: n.clone() });
  };
  const lampW = L => { surfAt(L, 0.5, 0, tmpA); const a = tmpA.clone(); surfAt(L, 0.5, 1, tmpA); return a.distanceTo(tmpA); };
  const lampH = L => { surfAt(L, 0, 0.5, tmpA); const a = tmpA.clone(); surfAt(L, 1, 0.5, tmpA); return a.distanceTo(tmpA); };
  const modern = year >= 2008;
  for (const L of lampRegs) {
    const IND = L.right ? LAMP.INDR : LAMP.INDL;
    if (L.cap === 1) {
      if (S.popup) { // corner position + indicator lamps under the pop-ups
        buildHousing(L, (rf, f) => f < 0.4 ? IND : LAMP.POS);
        lens(L, m.lens);
        const [p, n] = at(L, 0.5, 0.2, 0); flares.push({ p, id: IND, size: 0.2, dir: n.clone() });
        const [p2, n2] = at(L, 0.5, 0.7, 0); flares.push({ p: p2, id: LAMP.POS, size: 0.14, dir: n2.clone() });
        continue;
      }
      buildHousing(L, (rf, f) => f < 0.16 ? IND : 0);
      lens(L, m.lens);
      if (!low) {
        const rad = clamp(Math.min(lampW(L) * 0.16, lampH(L) * 0.3), 0.018, 0.042);
        if (year >= 1995) { projector(L, 0.5, 0.38, rad, LAMP.HEAD); projector(L, 0.5, 0.72, rad * 0.85, LAMP.HIGH); }
        else { // reflector bowls with bulbs
          for (const [cf, id, k] of [[0.42, LAMP.HEAD, 1.5], [0.78, LAMP.HIGH, 1.1]]) {
            const [p, n] = at(L, 0.5, cf, 0.9); const M4 = orient(p, n);
            hk.add(new THREE.SphereGeometry(rad * k, 20, 8, 0, TAU, 0, Math.PI / 2).rotateX(-Math.PI / 2), M.housing(), M4);
            lk.add(new THREE.SphereGeometry(rad * 0.35, 10, 8), lampMat, orient(p.clone().addScaledVector(n, rad * 0.4), n), { lamp: id });
            flares.push({ p: p.clone().addScaledVector(n, DEPTH + 0.01), id, size: 0.5, dir: n.clone() });
          }
        }
        // DRL light guide (modern) or position bulb
        if (modern) {
          const pts = []; for (let i = 0; i <= 10; i++) { const [p] = at(L, 0.22, 0.18 + 0.78 * i / 10, 0.15); pts.push(p.clone()); }
          lk.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.005, 6), lampMat, null, { lamp: LAMP.DRL });
          const [p, n] = at(L, 0.22, 0.55, 0); flares.push({ p, id: LAMP.DRL, size: 0.25, dir: n.clone() });
        } else {
          const [p, n] = at(L, 0.3, 0.2, 0.5); lk.add(new THREE.SphereGeometry(0.009, 8, 6), lampMat, T(p.x, p.y, p.z), { lamp: LAMP.POS });
          flares.push({ p: p.clone().addScaledVector(n, 0.03), id: LAMP.POS, size: 0.12, dir: n.clone() });
        }
      } else {
        // low LOD: the whole housing back glows for head (no internals)
        const [p, n] = at(L, 0.5, 0.5, 0.95);
        lk.add(new THREE.CircleGeometry(Math.min(lampW(L), lampH(L)) * 0.32, 12), lampMat, orient(p, n), { lamp: LAMP.HEAD });
      }
      { const [p, n] = at(L, 0.5, 0.45, 0); flares.push({ p: p.clone().addScaledVector(n, 0.02), id: LAMP.HEAD, size: 0.5, dir: n.clone() }); }
      { const [p, n] = at(L, 0.5, 0.08, 0); flares.push({ p, id: IND, size: 0.22, dir: n.clone() }); }
    } else {
      // tail cluster: tail/brake (outer) | indicator | reverse (inner)
      const seg = f => f < 0.52 ? LAMP.TAIL : f < 0.74 ? IND : LAMP.REV;
      buildHousing(L, (rf, f) => seg(f));
      lens(L, m.lensRed, f => f < 0.74);
      lens(L, m.lens, f => f >= 0.74);
      if (!low && modern) { // LED light bar
        const pts = []; for (let i = 0; i <= 8; i++) { const [p] = at(L, 0.5, 0.04 + 0.44 * i / 8, 0.25); pts.push(p.clone()); }
        lk.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.006, 6), lampMat, null, { lamp: LAMP.TAIL });
      }
      for (const [cf, id, sz] of [[0.25, LAMP.TAIL, 0.3], [0.63, IND, 0.24], [0.86, LAMP.REV, 0.26]]) { const [p, n] = at(L, 0.5, cf, 0); flares.push({ p: p.clone().addScaledVector(n, 0.015), id, size: sz, dir: n.clone() }); }
    }
  }
  // surface point on an end cap closest to (x, y)
  const capPoint = (cap, x, y) => {
    let best = null, bd = 1e9; const o = new THREE.Vector3();
    rings.forEach((R) => { if (R.cap !== cap) return; for (let c = 0; c < NT; c++) { sectionPoint(P, S, R.z, R.scale, theta(c), o); const d = (o.x - x) ** 2 + (o.y - y) ** 2; if (d < bd) { bd = d; best = o.clone(); } } });
    return best;
  };
  const rearY = f => lerp(P.bot(P.zR + 0.05), P.top(P.zR + 0.05), f);
  const back = new THREE.Vector3(0, 0, -1);
  if (S.roundTails) { // R32/R33/R34/R35 quad round tail-lights
    const rr = 0.074;
    for (const sx of [1, -1]) for (const k of [0.62, 0.36]) {
      const p = capPoint(-1, sx * P.half(P.zR + 0.05) * k, rearY(0.62)); p.z -= 0.006;
      const M4 = orient(p, back);
      hk.add(new THREE.TorusGeometry(rr + 0.004, 0.007, 8, 32), low ? M.black() : M.chrome(), M4);
      const outerRing = k > 0.5;
      lk.add(new THREE.CircleGeometry(rr, 32), lampMat, orient(p.clone().add(new THREE.Vector3(0, 0, 0.004)), back), { lamp: LAMP.TAIL });
      if (!low) {
        lk.add(new THREE.TorusGeometry(rr * 0.62, 0.006, 6, 28), lampMat, orient(p.clone().add(new THREE.Vector3(0, 0, -0.004)), back), { lamp: LAMP.TAIL });
        if (!outerRing) lk.add(new THREE.CircleGeometry(rr * 0.42, 24), lampMat, orient(p.clone().add(new THREE.Vector3(0, 0, -0.003)), back), { lamp: LAMP.REV });
        hk.add(new THREE.CircleGeometry(rr, 32), m.lensRed, orient(p.clone().add(new THREE.Vector3(0, 0, -0.009)), back));
      }
      flares.push({ p: p.clone().add(new THREE.Vector3(0, 0, -0.02)), id: outerRing ? LAMP.TAIL : LAMP.REV, size: outerRing ? 0.32 : 0.24, dir: back });
      if (!outerRing) flares.push({ p: p.clone().add(new THREE.Vector3(0, 0, -0.02)), id: LAMP.TAIL, size: 0.26, dir: back });
    }
    // amber rear indicators in the bumper corners
    for (const sx of [1, -1]) {
      const p = capPoint(-1, sx * P.half(P.zR + 0.05) * 0.8, rearY(0.36)); p.z -= 0.004;
      const id = sx > 0 ? LAMP.INDL : LAMP.INDR;
      lk.add(rbox(0.11, 0.03, 0.012, 0.005), lampMat, orient(p, back), { lamp: id });
      flares.push({ p: p.clone().add(new THREE.Vector3(0, 0, -0.02)), id, size: 0.22, dir: back });
    }
  }
  // rear fog lamp (driver side) + plate lamps + high-mount stop lamp
  {
    const p = capPoint(-1, Math.sign(driverX) * P.half(P.zR + 0.05) * 0.42, rearY(0.2)); p.z -= 0.004;
    lk.add(rbox(0.085, 0.032, 0.014, 0.008), lampMat, orient(p, back), { lamp: LAMP.FOG });
    if (!low) hk.add(rbox(0.1, 0.045, 0.01, 0.01), M.black(), orient(p.clone().add(new THREE.Vector3(0, 0, 0.006)), back));
    flares.push({ p: p.clone().add(new THREE.Vector3(0, 0, -0.02)), id: LAMP.FOG, size: 0.35, dir: back });
    const py = lerp(P.bot(P.zR), P.top(P.zR), 0.48) + 0.09;
    for (const sx of [1, -1]) lk.add(rbox(0.035, 0.008, 0.02, 0.003), lampMat, T(sx * 0.12, py, P.zR - 0.004), { lamp: LAMP.PLATE });
    let hz, hy, hw2 = S.open ? 0.22 : 0.32;
    if (S.open || S.cargo) { hz = P.zR + S.capR + 0.06; hy = P.top(hz) + 0.012; } else { hz = P.zC - 0.035; hy = P.roof(hz) - 0.035; }
    if (!S.cargo) {
      lk.add(rbox(hw2, 0.016, 0.02, 0.006), lampMat, T(0, hy, hz), { lamp: LAMP.STOP });
      flares.push({ p: new THREE.Vector3(0, hy, hz - 0.03), id: LAMP.STOP, size: 0.2, dir: back });
    }
  }
  // side repeaters on the front fenders
  {
    const z = P.axF - P.archR - 0.13, y = Math.min(P.wheelR + 0.24, S.belt - 0.12);
    for (const sx of [1, -1]) {
      const x = sx * (bodyXAt(P, S, z, y) + S.flare * 0.3 + 0.002);
      const id = sx > 0 ? LAMP.MARKL : LAMP.MARKR;
      lk.add(rbox(0.008, 0.022, 0.055, 0.004), lampMat, T(x, y, z), { lamp: id });
      flares.push({ p: new THREE.Vector3(x + sx * 0.01, y, z), id, size: 0.12, dir: new THREE.Vector3(sx, 0, -0.3).normalize() });
    }
  }
  // pop-up headlight pods
  parts.popups = [];
  if (S.popup) {
    for (const sx of [1, -1]) {
      const z = P.zF - S.capF - 0.12, x = sx * P.hw * 0.62, y = P.top(z);
      const pv = new THREE.Group(); pv.position.set(x, y - 0.01, z + 0.12);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.24), paintFlat); lid.position.set(0, 0, -0.12);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.13, 0.2), m.trim); box.position.set(0, -0.065, -0.1);
      const pk = new Kit();
      pk.add(rbox(0.33, 0.11, 0.015, 0.03), lampMat, T(0, -0.06, 0.002), { lamp: LAMP.HEAD });
      if (!low) pk.add(new THREE.TorusGeometry(0.045, 0.006, 6, 20), M.chrome(), T(sx * 0.07, -0.06, 0.01));
      pv.add(lid, box); pk.build(pv);
      bodyG.add(pv);
      parts.popups.push(pv);
      flares.push({ p: new THREE.Vector3(x, y + 0.08, z + 0.2), id: LAMP.HEAD, size: 0.55, dir: new THREE.Vector3(0, 0, 1) });
    }
  }

  // ───── details: mirrors, exhaust, wing, plates, grille, wipers, trims ─────
  for (const sx of [1, -1]) {
    const z = P.zA - 0.12, x = sx * (P.half(z) * 0.97 + 0.06), y = P.top(z) + 0.1;
    const mg = new THREE.Group(); mg.position.set(x, y, z);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.075, low ? 10 : 20, low ? 8 : 12), paintFlat); shell.scale.set(1.3, 0.75, 0.75);
    const arm = new THREE.Mesh(rbox(0.09, 0.03, 0.06, 0.012), m.trim); arm.position.x = -sx * 0.07; arm.position.y = -0.035;
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), low ? m.chrome : M.mirror()); glass.position.z = -0.052; glass.rotation.y = Math.PI; glass.scale.set(1.3, 0.72, 1);
    mg.add(shell, arm, glass); bodyG.add(mg);
    if (full) (parts.doorMirrors ||= []).push(glass); // live reflections in the cockpit (interiors.makeMirrors)
  }
  const exN = S.exhaust;
  for (let i = 0; i < exN; i++) {
    const sx = exN === 1 ? -0.55 : exN === 2 ? (i ? -0.55 : 0.55) : (i < 2 ? -1 : 1) * (0.48 + (i % 2) * 0.1);
    const p = new THREE.Vector3(sx * P.hw * 0.75, S.lipR + 0.06, P.zR + 0.03);
    dk.add(new THREE.CylinderGeometry(0.045, 0.05, 0.16, 20, 1, true).rotateX(Math.PI / 2), m.chrome, T(p.x, p.y, p.z));
    if (!low) {
      dk.add(new THREE.TorusGeometry(0.045, 0.004, 6, 20), m.chrome, T(p.x, p.y, p.z - 0.08));
      dk.add(new THREE.CylinderGeometry(0.038, 0.038, 0.12, 16, 1, true).rotateX(Math.PI / 2), M.housingDark(), T(p.x, p.y, p.z));
    }
    dk.add(new THREE.CircleGeometry(0.04, 16), m.trim, T(p.x, p.y, p.z + 0.03, 0, Math.PI, 0));
  }
  if (S.wing) bodyG.add(buildWing(S.wing, P, S, paintFlat));
  // licence plates
  const plate = opts.plate || randomPlate(car.plate);
  parts.plateData = plate;
  const pf = plateMesh(plate); pf.position.set(0, lerp(P.bot(P.zF), P.top(P.zF), 0.38), P.zF + 0.012); bodyG.add(pf);
  const pr = plateMesh(plate); pr.rotation.y = Math.PI; pr.position.set(0, lerp(P.bot(P.zR), P.top(P.zR), 0.48), P.zR - 0.01); bodyG.add(pr);
  parts.plates = [pf, pr];
  if (!low) {
    // honeycomb grille + lower intake mesh on the nose
    const capRows = []; rings.forEach((R, i) => { if (R.cap === 1) capRows.push(i); });
    const r0 = capRows[0], nR = capRows.length;
    const inGrille = (r, c) => {
      const R = rings[r0 + r]; if (R.scale > 0.94) return false;
      sectionPoint(P, S, R.z, R.scale, theta(c + 0.5), tmpA);
      const yRel = (tmpA.y - P.bot(R.z)) / (P.top(R.z) - P.bot(R.z));
      return (Math.abs(tmpA.x) < P.hw * S.grilleW * 0.96 && yRel > S.grilleY0 + 0.02 && yRel < S.grilleY1 - 0.02) || (yRel < 0.15 && yRel > 0.03 && Math.abs(tmpA.x) < P.hw * 0.62);
    };
    const gg = gridGeometry(nR, NT, (r, c, o) => { sectionPoint(P, S, rings[r0 + r].z, rings[r0 + r].scale, theta(c), o); o.z += 0.002; return o; }, { closedCols: true, faceKeep: (r, c) => inGrille(r, c), uvFn: (r, c, v) => [v.x * 8, v.y * 8] });
    dk.add(gg, M.grille(), null, { uv: 'keep' });
    // badges
    const fb = capPoint(1, 0, lerp(P.bot(P.zF), P.top(P.zF), Math.min(0.9, S.grilleY1 + 0.08)));
    if (fb) dk.add(new THREE.CircleGeometry(0.03, 20).scale(1.6, 1, 1), m.chrome, T(fb.x, fb.y, fb.z + 0.004));
    const rb = capPoint(-1, 0, rearY(0.78));
    if (rb) dk.add(new THREE.CircleGeometry(0.028, 20).scale(1.6, 1, 1), m.chrome, T(rb.x, rb.y, rb.z - 0.004, 0, Math.PI, 0));
    // window belt rubber/chrome strips
    const beltMat = year < 2000 && (car.cat === 'traffic' || car.id === 'crown' || car.id === 'jzx100' || car.id === 'e46') ? m.chrome : m.trim;
    for (const sx of [1, -1]) {
      const pts = []; for (let r = 1; r < RC - 1; r += 2) { cabPos(r, sx > 0 ? 0 : NC - 1, tmpA); pts.push(tmpA.clone().add(new THREE.Vector3(sx * 0.004, 0.004, 0))); }
      if (!S.open && pts.length > 3) dk.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.006, 5), beltMat);
    }
    // wipers
    if (!S.open || true) {
      const up = new THREE.Vector3(0, S.cowl < P.H ? (P.H - S.cowl) : 0.4, P.zB - P.zA).normalize();
      for (const k of [0.42, -0.25]) {
        const base = new THREE.Vector3(k * P.hw * Math.sign(driverX), S.cowl + 0.015, P.zA + 0.02);
        const dir = new THREE.Vector3(-Math.sign(driverX) * 0.97, 0, 0).addScaledVector(up, 0.24).normalize();
        const len = P.hw * (k > 0 ? 0.95 : 0.8);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
        const mid = base.clone().addScaledVector(dir, len / 2).addScaledVector(new THREE.Vector3(0, 1, 0), 0.008);
        dk.add(new THREE.BoxGeometry(len, 0.008, 0.016), m.trim, new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
        dk.add(new THREE.CylinderGeometry(0.012, 0.014, 0.025, 10), m.trim, T(base.x, base.y, base.z));
      }
    }
    // door handles (on the door pivots)
    for (const d of parts.doors) {
      const z = d.z0 + (d.rear ? 0.1 : 0.14), y = S.belt - 0.075;
      const sx = d.left ? 1 : -1;
      const x = sx * (bodyXAt(P, S, z, y) + 0.004);
      const hk2 = new Kit();
      hk2.add(rbox(0.012, 0.024, 0.12, 0.006), year < 2000 ? m.trim : paintFlat, T(x, y, z));
      hk2.add(rbox(0.004, 0.034, 0.14, 0.003), m.trim, T(x - sx * 0.005, y, z));
      hk2.build(d.pivot, { offset: d.pivot.position });
    }
  }

  // ───── interior ─────
  const ctx = { lod, driverX, doorZ0, doorZ1, rdoorZ0, rdoorZ1, B_PILLAR, bodyXAt: (z, y) => bodyXAt(P, S, z, y), paint: paintFlat };
  let interior = null;
  if (full) {
    interior = buildInterior(P, S, car, ctx);
    bodyG.add(interior.group);
    parts.steering = interior.wheel; parts.shifter = interior.shifter; parts.handbrake = interior.handbrake; parts.gauge = interior.gauge;
    parts.eye = interior.eye.clone(); parts.eyePitch = interior.eyePitch;
    parts.pedals = interior.pedals; parts.cockpitLive = interior.live; parts.cockpitSpec = interior.spec; parts.rearMirror = interior.rearMirror;
    // door cards ride on the door pivots
    for (const d of parts.doors) { const k = new Kit(); interior.doorCard(k, d.z0, d.z1, d.left ? 1 : -1); k.build(d.pivot, { offset: d.pivot.position }); }
    // headliner / pillar trim seen from inside
    if (!S.open) { // inset a little towards the cabin centre so it never fights with the shell, visible from either winding
      const hg = cabGeo.clone(), hp = hg.attributes.position, hv = new THREE.Vector3(), hd = new THREE.Vector3();
      for (let i = 0; i < hp.count; i++) { hv.fromBufferAttribute(hp, i); hd.set(-hv.x, (S.belt - hv.y) * 0.8, 0).normalize(); hv.addScaledVector(hd, 0.014); hp.setXYZ(i, hv.x, hv.y, hv.z); }
      hg.computeVertexNormals();
      const hm = M.headliner(interior.theme.head).clone(); hm.side = THREE.DoubleSide;
      const hl = new THREE.Mesh(hg, [hm, m.hidden, hm]); hl.receiveShadow = true; hl.name = 'headliner'; bodyG.add(hl);
    }
  } else {
    if (lod === 'mid') bodyG.add(buildInteriorLite(P, S, car, ctx).group);
    else { // seat silhouettes so the glass isn't see-through to nothing
      const zs = lerp(P.zA, P.zD, S.doors === 4 ? 0.42 : 0.55), fy = S.clr + 0.12;
      for (const sx of [driverX, -driverX]) dk.add(new THREE.BoxGeometry(0.46, 0.62, 0.14), m.interior, T(sx, fy + 0.4, zs - 0.28, -0.25));
      dk.add(new THREE.BoxGeometry(P.hw * 1.7, 0.2, 0.4), m.interior, T(0, S.belt - 0.12, P.zA - 0.3));
    }
    const floorY = S.clr + 0.12, zSeat = lerp(P.zA, P.zD, S.doors === 4 ? 0.42 : 0.55);
    parts.eye = new THREE.Vector3(driverX, Math.min(floorY + 0.88, P.H - 0.11), zSeat - 0.08);
  }
  parts.driverX = driverX;
  parts.exitPoint = new THREE.Vector3(Math.sign(driverX) * (P.hw + 0.6), 0, lerp(doorZ0, doorZ1, 0.4));

  // build merged lamp / housing / detail meshes
  lk.build(bodyG, { shadow: false });
  hk.build(bodyG, { shadow: false, renderOrder: 3 });
  dk.build(bodyG);
  const fp = flarePoints(flares, parts.lampI);
  if (fp) { bodyG.add(fp); parts.flares = fp; }
  parts.lampMat = lampMat;
  // real lights for the player / garage car (headlight spot + rear glow), limited to two live models
  if (full && opts.realLights !== false && LIVE_LIGHTS.size < 2) {
    const yH = lerp(P.bot(P.zF), P.top(P.zF), 0.62);
    const spot = new THREE.SpotLight(0xfff1dc, 0, 70, 0.5, 0.55, 1.4);
    spot.position.set(0, yH, P.zF - 0.15); spot.target.position.set(0, -0.6, P.zF + 18);
    const glow = new THREE.PointLight(0xff2010, 0, 5, 2);
    glow.position.set(0, rearY(0.55), P.zR - 0.25);
    bodyG.add(spot, spot.target, glow);
    parts.real = { spot, glow };
  }

  // ───── police / taxi extras ─────
  if (car.livery === 'police' || car.livery === 'unmarked') parts.beacon = buildPoliceExtras(car, P, S, bodyG, paintFlat);
  if (car.livery === 'taxi') {
    const andon = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.16), new THREE.MeshStandardMaterial({ color: 0x664410, emissive: 0xffb020, emissiveIntensity: 0, roughness: 0.2, metalness: 0.3 }));
    andon.position.set(0, P.H + 0.07, lerp(P.zB, P.zC, 0.4)); bodyG.add(andon); parts.lights.taxi = andon;
  }
  if (S.cargo) {
    const c = S.cargo; const box = new THREE.Mesh(rbox(c.w, c.h, c.l, 0.05), new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.6, metalness: 0.2 }));
    box.position.set(0, c.y + c.h / 2, c.z); box.castShadow = true; bodyG.add(box);
  }

  // ───── wheels ─────
  for (const front of [true, false]) for (const left of [true, false]) {
    const w = buildWheel(P, S, front, left, lod); root.add(w.steer); parts.wheels.push(w);
  }
  if (S.dually) for (const left of [true, false]) { const w = buildWheel(P, S, false, left, lod); w.steer.position.z -= 1.35; w.base.z -= 1.35; root.add(w.steer); parts.wheels.push(w); }

  // strobe lights (aftermarket) in grille corners + rear
  parts.strobes = [];
  const strobeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const [x, y, z] of [[P.hw * 0.45, lerp(P.bot(P.zF), P.top(P.zF), 0.32), P.zF + 0.01], [-P.hw * 0.45, lerp(P.bot(P.zF), P.top(P.zF), 0.32), P.zF + 0.01], [P.hw * 0.5, lerp(P.bot(P.zR), P.top(P.zR), 0.3), P.zR - 0.01], [-P.hw * 0.5, lerp(P.bot(P.zR), P.top(P.zR), 0.3), P.zR - 0.01]]) {
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), strobeMat.clone()); s.position.set(x, y, z); if (z < 0) s.rotation.y = Math.PI; s.visible = false; bodyG.add(s); parts.strobes.push(s);
  }

  parts.paintFlat = paintFlat;
  const model = new CarModel(car, root, bodyG, P, S, parts, paint);
  model.lod = lod;
  if (parts.real) LIVE_LIGHTS.add(model);
  return model;
}

function buildWing(type, P, S, paint) {
  const m = mats();
  const g = new THREE.Group();
  const z = P.zR + S.capR + 0.12;
  const yDeck = P.top(z);
  if (type === 'duck' || type === 'lip') {
    const lip = new THREE.Mesh(rbox(P.hw * 1.6, 0.03, 0.12, 0.012), paint);
    lip.position.set(0, yDeck + 0.02, z - 0.04); lip.rotation.x = -0.25; g.add(lip); return g;
  }
  const span = type === 'big' ? P.hw * 1.95 : type === 'gt' ? P.hw * 1.9 : P.hw * 1.7;
  const chord = type === 'gt' ? 0.3 : type === 'big' ? 0.26 : 0.2;
  const h = type === 'big' ? 0.3 : type === 'gt' ? 0.26 : 0.12;
  const af = new THREE.Shape();
  af.moveTo(0, 0); af.bezierCurveTo(chord * 0.2, 0.035, chord * 0.7, 0.03, chord, 0.005); af.lineTo(chord, -0.004); af.bezierCurveTo(chord * 0.6, 0.006, chord * 0.2, -0.012, 0, 0);
  const wg = new THREE.ExtrudeGeometry(af, { depth: span, bevelEnabled: false, curveSegments: 12 });
  wg.rotateY(Math.PI / 2); wg.translate(-span / 2, 0, 0);
  const wing = new THREE.Mesh(wg, type === 'gt' ? M.carbon() : paint); wing.position.set(0, yDeck + h, z + chord * 0.4); wing.rotation.x = -0.1; wing.castShadow = true;
  g.add(wing);
  for (const sx of [1, -1]) {
    const st = new THREE.Mesh(rbox(0.022, h, 0.12, 0.008), type === 'gt' ? m.trim : paint);
    st.position.set(sx * span * 0.36, yDeck + h / 2, z + 0.05); g.add(st);
    const ep = new THREE.Mesh(rbox(0.008, 0.12, chord * 1.1, 0.003), type === 'gt' ? m.trimGloss : paint); ep.position.set(sx * span / 2, yDeck + h, z + chord * 0.45); g.add(ep);
  }
  return g;
}

function buildPoliceExtras(car, P, S, bodyG, paint) {
  const beacon = { lamps: [], mats: [] };
  const red = () => { const mm = new THREE.MeshStandardMaterial({ color: 0x500000, emissive: 0xff1010, emissiveIntensity: 0, roughness: 0.3, transparent: true, opacity: 0.95 }); beacon.mats.push(mm); return mm; };
  const zRoof = lerp(P.zB, P.zC, 0.45);
  if (car.livery === 'police') {
    const base = new THREE.Mesh(rbox(1.3, 0.07, 0.3, 0.03), mats().chrome); base.position.set(0, P.H + 0.04, zRoof); base.userData.glbKeep = true; bodyG.add(base);
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const l = new THREE.Mesh(rbox(0.17, 0.11, 0.26, 0.04), red()); l.position.set(i * 0.18, P.H + 0.12, zRoof); l.userData.glbKeep = true; bodyG.add(l); beacon.lamps.push(l);
    }
    const disp = new THREE.Mesh(rbox(0.22, 0.18, 0.2, 0.04), red()); disp.position.set(0, P.H + 0.16, zRoof); disp.userData.glbKeep = true; bodyG.add(disp); beacon.lamps.push(disp);
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const gx = c.getContext('2d'); gx.fillStyle = '#111'; gx.font = '700 84px "Hiragino Sans","Yu Gothic","Noto Sans JP",sans-serif'; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillText('神奈川県警', 256, 66);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const dm = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const z = lerp(P.zA, P.zD, 0.38);
    for (const sx of [1, -1]) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), dm); d.position.set(sx * (P.half(z) + 0.004), S.belt - 0.1, z); d.rotation.y = sx * Math.PI / 2; d.userData.glbDecal = sx; bodyG.add(d);
    }
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.06, 5), new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 1, roughness: 0.3 }));
    badge.position.set(0, lerp(P.bot(P.zF), P.top(P.zF), 0.62), P.zF + 0.015); bodyG.add(badge);
  } else {
    const pv = new THREE.Group(); pv.position.set(P.driverX || -0.3, P.H - 0.01, lerp(P.zB, P.zC, 0.15));
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 18), red()); l.position.y = 0.07; pv.add(l); pv.rotation.x = Math.PI / 2; pv.visible = false;
    bodyG.add(pv); beacon.lamps.push(l); beacon.flip = pv;
  }
  return beacon;
}

// ───────────────────────── engine bay ─────────────────────────
const _engMats = {};
function engMat(key, color, metal = 0.5, rough = 0.45) { return _engMats[key] ||= new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough }); }
export function buildEngineBay(car, { width, length, floorY, topY, zc, zFront, zRear, hw }) {
  const g = new THREE.Group(); g.name = 'engineBay';
  const E = car.engine, type = E.type || 'I4', code = E.code || '';
  const cyl = +(type.match(/\d+/)?.[0] || 4);
  const H = Math.max(0.28, topY - floorY);                       // usable height under the bonnet
  const alu = engMat('alu', 0x9a9ea3, 0.85, 0.35), cast = engMat('cast', 0x3a3c40, 0.6, 0.6), black = engMat('black', 0x151617, 0.2, 0.7);
  const hose = engMat('hose', 0x0e0e0e, 0.0, 0.85), chrome = engMat('chrome', 0xdadde0, 1.0, 0.15), blue = engMat('strut', 0x1f3fb5, 0.6, 0.3);
  const camCol = /RB26|SR20|4G63|4B11|B16|B18|F20|K20|EJ20|EJ25|FA24|1LR/.test(code) ? 0xb3121b : /2JZ|1JZ/.test(code) ? 0x2a2b2e : /13B|20B/.test(code) ? 0x3b3d42 : /VR38|VQ|G16/.test(code) ? 0x2e3033 : 0x8a8d92;
  const cover = engMat('cam' + camCol, camCol, 0.45, 0.32);
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cylX = (r, len, m, x, y, z, axis = 'x') => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), m); if (axis === 'x') o.rotation.z = Math.PI / 2; else if (axis === 'z') o.rotation.x = Math.PI / 2; o.position.set(x, y, z); g.add(o); return o; };
  // bay: dark floor + inner fenders so the opening never looks hollow
  box(width + 0.1, 0.02, length + 0.1, black, 0, floorY, zc);
  for (const sx of [-1, 1]) { const f = box(0.04, H * 0.8, length, black, sx * (width / 2 + 0.03), floorY + H * 0.4, zc); f.rotation.z = sx * 0.12; }
  // radiator + fan shroud at the front, slam panel
  box(width * 0.82, H * 0.7, 0.05, engMat('rad', 0x2b2d30, 0.6, 0.5), 0, floorY + H * 0.38, zFront - 0.05);
  box(width * 0.86, 0.04, 0.08, cast, 0, topY - 0.02, zFront - 0.04);
  // engine proportions
  const L = Math.min(length * 0.62, 0.18 + cyl * 0.1), eH = Math.min(H * 0.92, 0.55);
  const ez = zc - (length * 0.05);
  const y0 = floorY + 0.02;
  const head = (x, y, w, rot = 0, n = cyl) => {
    const blk = box(w, eH * 0.5, L, cast, x, y + eH * 0.25, ez); blk.rotation.z = rot;
    const cv = box(w * 0.92, eH * 0.16, L * 0.96, cover, x + Math.sin(rot) * eH * 0.35, y + eH * 0.58, ez); cv.rotation.z = rot;
    // spark-plug / coil-pack row
    for (let i = 0; i < n; i++) { const c = box(w * 0.18, eH * 0.06, 0.05, black, x + Math.sin(rot) * eH * 0.45, y + eH * 0.69, ez - L / 2 + L * (i + 0.5) / n); c.rotation.z = rot; }
    // brand plate on the cam cover
    return cv;
  };
  if (/^R/.test(type)) {                          // rotary: compact, intake manifold dominates
    box(0.42, eH * 0.55, 0.38, cast, 0, y0 + eH * 0.3, ez);
    box(0.5, eH * 0.18, 0.46, alu, 0, y0 + eH * 0.68, ez);
    for (let i = 0; i < 4; i++) cylX(0.035, 0.32, alu, -0.18 + i * 0.12, y0 + eH * 0.55, ez + 0.2, 'z');
  } else if (/^F/.test(type)) {                   // boxer: low and wide, heads at the sides
    box(width * 0.42, eH * 0.38, L * 0.8, cast, 0, y0 + eH * 0.25, ez);
    for (const sx of [-1, 1]) { const c = box(0.12, eH * 0.36, L * 0.7, cover, sx * width * 0.27, y0 + eH * 0.25, ez); c.rotation.z = sx * 0.08; }
    box(width * 0.36, eH * 0.16, L * 0.5, alu, 0, y0 + eH * 0.55, ez);                 // intake manifold on top
  } else if (/^V/.test(type)) {                   // V engine: two banks + plenum in the valley
    const n = cyl / 2, w = Math.min(0.24, width * 0.22);
    head(-w * 0.75, y0, w, -0.42, n); head(w * 0.75, y0, w, 0.42, n);
    box(w * 1.1, eH * 0.2, L * 0.92, alu, 0, y0 + eH * 0.66, ez);
    cylX(0.07, 0.14, alu, 0, y0 + eH * 0.66, ez + L / 2 + 0.07, 'z');                  // throttle body
  } else {                                        // inline (I3/I4/I6)
    const w = Math.min(0.3, width * 0.3);
    head(0, y0, w, 0.12);
    // individual intake runners into a plenum on the left (driver's view = RHD)
    const px = w * 0.95;
    box(0.12, eH * 0.22, L * 0.9, alu, px, y0 + eH * 0.55, ez);
    for (let i = 0; i < cyl; i++) cylX(0.025, w * 0.6, alu, px * 0.55, y0 + eH * 0.5, ez - L / 2 + L * (i + 0.5) / cyl, 'x');
    cylX(0.06, 0.12, alu, px, y0 + eH * 0.55, ez + L / 2 + 0.06, 'z');
  }
  // exhaust side heat shield, turbo + intercooler piping
  if (E.turbo) {
    const tx = -Math.min(0.32, width * 0.32);
    const tb = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.035, 10, 20), engMat('turbo', 0x7a6f66, 0.8, 0.4)); tb.position.set(tx, y0 + eH * 0.45, ez + L * 0.2); tb.rotation.y = Math.PI / 2; g.add(tb);
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(tx, y0 + eH * 0.45, ez + L * 0.3), new THREE.Vector3(tx * 0.9, y0 + eH * 0.3, zFront - 0.25), new THREE.Vector3(0, y0 + eH * 0.25, zFront - 0.14)]), 20, 0.03, 8), chrome); g.add(pipe);
    box(width * 0.7, 0.14, 0.04, engMat('ic', 0x6d7075, 0.8, 0.4), 0, floorY + 0.12, zFront - 0.1);
  }
  // pod air filter + intake pipe, battery, brake booster/master cylinder, washer & coolant tanks
  const af = cylX(0.08, 0.16, engMat('filter', 0xc0392b, 0.1, 0.8), width * 0.36, y0 + eH * 0.55, zFront - 0.2, 'x'); void af;
  box(0.22, 0.18, 0.16, black, -width * 0.36, y0 + 0.1, zRear + 0.2);
  box(0.06, 0.03, 0.04, engMat('red', 0xc0392b, 0.3, 0.5), -width * 0.36 + 0.07, y0 + 0.2, zRear + 0.2);
  cylX(0.11, 0.08, black, width * 0.34, y0 + eH * 0.5, zRear + 0.06, 'z');
  { const t = cylX(0.05, 0.12, engMat('washer', 0x3d7fe0, 0.1, 0.6), -width * 0.38, y0 + eH * 0.45, zFront - 0.22, 'y'); t.material = t.material.clone(); t.material.transparent = true; t.material.opacity = 0.85; }
  cylX(0.045, 0.1, engMat('coolant', 0xe8e4d8, 0.1, 0.5), width * 0.15, y0 + eH * 0.7, zFront - 0.12, 'y');
  // hoses
  for (const [a, b] of [[[-0.1, 0.5, 0.3], [-0.3, 0.3, 0.05]], [[0.12, 0.45, 0.28], [0.34, 0.25, 0.1]]]) {
    const pts = [new THREE.Vector3(a[0] * width * 2, y0 + eH * a[1], zFront - a[2]), new THREE.Vector3((a[0] + b[0]) * width, y0 + eH * 0.8, ez), new THREE.Vector3(b[0] * width * 2, y0 + eH * b[1], zRear + b[2] + 0.1)];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.016, 6), hose));
  }
  // strut-tower brace (blue) between the turrets
  cylX(0.016, hw * 1.5, blue, 0, topY - 0.04, zRear + 0.12, 'x');
  for (const sx of [-1, 1]) cylX(0.06, 0.05, alu, sx * hw * 0.75, topY - 0.06, zRear + 0.12, 'y');
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  return g;
}

// ───────────────────────── runtime wrapper ─────────────────────────
// lights: { head, high, brake, reverse, left, right, hazard, fog (rear fog), pos (parking/position),
//           drl ('auto' = on while driving | true | false), strobe, beacon }
export class CarModel {
  constructor(car, root, bodyG, P, S, parts, paint) {
    Object.assign(this, { car, root, bodyG, P, S, parts, paint });
    this.lights = { head: false, high: false, brake: false, reverse: false, left: false, right: false, hazard: false, fog: false, pos: false, drl: 'auto', strobe: 'off', beacon: false };
    this.camber = { f: 0, r: 0 }; this.ride = 0; this.trackAdj = 0;
    this.t = 0; this.popup = 0; this.movedT = -99; this._spin0 = null; this.hb = 1; this.hbTgt = 1;
  }
  setPaint(hex) { this.paint.color.set(hex); this.parts.paintFlat.color.set(hex); }
  setFinish(finish) {
    const p = paintMaterial(this.paint.color.getHex(), finish, this.lod === 'full');
    this.paint.copy(p); this.paint.needsUpdate = true;
    const f = paintMaterial(this.paint.color.getHex(), finish, false);
    this.parts.paintFlat.copy(f); this.parts.paintFlat.vertexColors = false; this.parts.paintFlat.needsUpdate = true;
  }
  setRimColor(hex) { for (const w of this.parts.wheels) w.rimMat.color.set(hex); }
  setPlate(p) {
    import('./plates.js').then(({ plateTexture }) => { for (const pm of this.parts.plates) { pm.material.map = plateTexture(p); pm.material.emissiveMap = plateTexture(p); pm.material.needsUpdate = true; } });
    this.parts.plateData = p;
  }
  setStance({ camberF, camberR, ride, track }) {
    if (camberF !== undefined) this.camber.f = camberF;
    if (camberR !== undefined) this.camber.r = camberR;
    if (ride !== undefined) this.ride = ride;
    if (track !== undefined) this.trackAdj = track;
    for (const w of this.parts.wheels) {
      const deg = (w.front ? this.camber.f : this.camber.r) * Math.PI / 180;
      w.camber.rotation.z = (w.left ? 1 : -1) * deg;
      w.steer.position.x = w.base.x + (w.left ? 1 : -1) * this.trackAdj;
    }
    this.bodyG.position.y = this.ride;
  }
  // shifter target from a gear label ('1'..'6', 'R', 'N', 'P', 'D', 'D3', 'B', …)
  setGear(label) {
    const sh = this.parts.shifter; if (!sh) return;
    const g = String(label ?? 'N');
    if (sh.type === 'mt') {
      const n = sh.gears, cols = Math.ceil((n + 1) / 2), mid = (cols - 1) / 2;
      let col = mid, fwd = 0;
      const off = sh.rev === 'L' ? 1 : 0; // reverse left of 1st (e.g. R34 Getrag) shifts the gears one gate right
      if (g === 'R') { col = off ? 0 : cols - 1; fwd = off ? 1 : n % 2 ? -1 : 1; }
      else if (/^\d$/.test(g)) { const k = +g - 1; col = Math.min(cols - 1, Math.floor(k / 2) + off); fwd = k % 2 ? -1 : 1; }
      sh.tgt.x = (col - mid) * 0.12; sh.tgt.z = fwd * 0.2;
    } else if (sh.type === 'at') {
      const pos = { P: 0.045, R: 0.015, N: -0.015, D: -0.045, B: -0.06, S: -0.06, M: -0.06 }[g[0]] ?? -0.015;
      sh.tgt.z = pos; sh.tgt.x = 0;
    } else if (sh.type === 'ev') sh.tgt.x = { P: 0, R: 0.3, N: 0.15, D: -0.3, B: -0.3 }[g[0]] ?? 0;
    this._gear = g;
  }
  update(dt, st = {}) {
    this.t += dt;
    const p = this.parts;
    p.wheels.forEach((w, i) => {
      if (w.front) w.steer.rotation.y = st.steer || 0;
      w.spin.rotation.x = st.spin ? st.spin[i % 4] : 0;
      w.steer.position.y = w.base.y + (st.susp ? st.susp[i % 4] : 0);
    });
    if (st.spin) { const s0 = st.spin[0] || 0; if (this._spin0 !== null && Math.abs(s0 - this._spin0) > 1e-3) this.movedT = this.t; this._spin0 = s0; }
    this.bodyG.rotation.x = st.pitch || 0; this.bodyG.rotation.z = st.roll || 0;
    if (p.steering) p.steering.rotation.z = -(st.steer || 0) * 8;
    if (st.gear !== undefined && st.gear !== this._gear) this.setGear(st.gear);
    if (st.handbrake !== undefined) this.hbTgt = st.handbrake ? 1 : 0;
    const ease = (o, tgt, sp) => o + clamp(tgt - o, -sp * dt, sp * dt);
    if (p.shifter) {
      const sh = p.shifter, k = 1 - Math.exp(-dt * 14);
      sh.cur.x += (sh.tgt.x - sh.cur.x) * k; sh.cur.z += (sh.tgt.z - sh.cur.z) * k;
      if (sh.type === 'mt') { sh.group.rotation.z = sh.cur.x; sh.group.rotation.x = sh.cur.z; }
      else if (sh.type === 'at') { sh.base ??= sh.group.position.z; sh.group.position.z = sh.base + sh.cur.z; }
      else if (sh.type === 'ev') sh.group.rotation.y = sh.cur.x;
    }
    if (p.handbrake) { this.hb = ease(this.hb, this.hbTgt, 4); p.handbrake.rotation.x = -0.1 - this.hb * 0.32; }
    if (p.pedals && this._ctl) { // pedals follow the driver's inputs
      const c = this._ctl, k = 1 - Math.exp(-dt * 18), pd = p.pedals;
      for (const [key, val] of [['throttle', c.throttle], ['brake', c.brake], ['clutch', c.clutch], ['park', this.hbTgt]]) if (pd[key]) pd[key].rotation.x += (-(val || 0) * 0.32 - pd[key].rotation.x) * k;
    }
    for (const d of p.doors) {
      d.open = ease(d.open, d.target, 1.6);
      d.pivot.rotation.y = (d.left ? -1 : 1) * smooth(d.open) * 1.1;
      if (d.window) { d.winOpen = ease(d.winOpen, d.winTarget, 0.6); d.window.position.y = -d.winOpen * 0.42; }
    }
    if (p.hood) { p.hood.open = ease(p.hood.open, p.hood.target, 1.0); p.hood.pivot.rotation.x = -(p.hood.dir ?? 1) * smooth(p.hood.open) * (p.hood.angle ?? 1.05); }
    this.onUpdate?.(dt);
    if (p.trunk) { p.trunk.open = ease(p.trunk.open, p.trunk.target, 1.0); p.trunk.pivot.rotation.x = smooth(p.trunk.open) * 1.2; }
    // ── lamps ──
    const L = this.lights, I = p.lampI;
    this.blinkOn = (this.t % 0.667) < 0.36;
    this.popup = ease(this.popup, L.head ? 1 : 0, 3);
    for (const pv of p.popups) pv.rotation.x = -this.popup * 0.9;
    const pos = !!(L.head || L.pos);
    const drl = L.drl === true || (L.drl === 'auto' && this.t - this.movedT < 8 && (this.car.year || 0) >= 2008);
    const popK = p.popups.length ? this.popup : 1;
    I[LAMP.HEAD] = L.head ? (L.high && p.popups.length ? 5 : 3.2) * popK : 0;
    I[LAMP.HIGH] = L.head && L.high ? 5 : 0;
    I[LAMP.POS] = pos ? 1.6 : 0;
    I[LAMP.DRL] = drl || pos ? (L.head ? 1.2 : 3.2) : 0;
    I[LAMP.TAIL] = L.brake ? 5.5 : pos ? 1.6 : 0;
    I[LAMP.STOP] = L.brake ? 5 : 0;
    const left = (L.hazard || L.left) && this.blinkOn, right = (L.hazard || L.right) && this.blinkOn;
    I[LAMP.INDL] = I[LAMP.MARKL] = left ? 4.5 : 0;
    I[LAMP.INDR] = I[LAMP.MARKR] = right ? 4.5 : 0;
    I[LAMP.REV] = L.reverse ? 3.5 : 0;
    I[LAMP.FOG] = L.fog ? 6 : 0;
    I[LAMP.PLATE] = pos ? 2 : 0;
    if (p.real) {
      p.real.spot.intensity = L.head ? (L.high ? 160 : 70) * popK : 0;
      p.real.spot.angle = L.high ? 0.42 : 0.55; p.real.spot.distance = L.high ? 110 : 60;
      p.real.spot.target.position.y = L.high ? 0.4 : -0.8;
      const g = p.real.glow;
      if (L.reverse) { g.color.setHex(0xfff4ea); g.intensity = 3; } else if (L.brake || L.fog) { g.color.setHex(0xff2010); g.intensity = L.brake ? 2.5 : 1.2; } else { g.color.setHex(0xff2010); g.intensity = pos ? 0.5 : 0; }
    }
    // strobes
    if (p.strobes.length) {
      const mode = L.strobe; const on = mode !== 'off';
      p.strobes.forEach((s, i) => {
        s.visible = on && strobeOn(mode, this.t, i);
        if (mode === 'police') s.material.color.set(i % 2 ? 0xff0000 : 0x2040ff);
        else if (mode === 'amber') s.material.color.set(0xffa000);
        else s.material.color.set(0xffffff);
      });
    }
    if (p.beacon) {
      const on = L.beacon;
      if (p.beacon.flip) { p.beacon.flip.visible = on; p.beacon.flip.rotation.x = on ? 0 : Math.PI / 2; }
      p.beacon.mats.forEach((mm, i) => { mm.emissiveIntensity = on ? (Math.sin(this.t * 9 + i * 0.9) > 0.1 ? 6 : 0.4) : 0; });
    }
    if (p.lights.taxi) p.lights.taxi.material.emissiveIntensity = L.head ? 2 : 0.3;
    for (const pl of p.plates) pl.material.emissiveIntensity = pos ? 0.25 : 0;
  }
  // live cockpit (cluster, MFD, aux gauges — see interiors.js). st: { rpm, kmh, gear, kw, info, warn, boost, fuel, night, ctl, hb, ax, ay, odo }
  drawGauges(st = {}) {
    if (!this.parts.gauge && !this.parts.cockpitSpec) return;
    if (st.gear !== undefined && st.gear !== this._gear) this.setGear(st.gear);
    if (st.warn !== undefined) this.hbTgt = st.hb ?? /\(P\)/.test(st.warn) ? 1 : 0;
    if (st.ctl) this._ctl = st.ctl;
    drawCockpit(this, st);
  }
  // rear-view / door mirror reflections (cockpit view only; called by the camera)
  renderMirrors(renderer, scene, frame) {
    if (!this.parts.rearMirror && !this.parts.doorMirrors) return;
    if (this._mirrors === undefined) this._mirrors = makeMirrors(this);
    this._mirrors?.render(renderer, scene, frame, this.parts.eye);
  }
  dispose() {
    LIVE_LIGHTS.delete(this);
    this._mirrors?.dispose();
    this.root.traverse(o => { if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.(); });
  }
}

// static cluster faces (drawn once per car)
function drawClusterBg(style, W, H, { maxR, red, maxK, ev }) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  if (style === 'tesla') {
    g.fillStyle = '#16181b'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#2a3340'; g.lineWidth = 3; for (let i = 0; i < 30; i++) { g.beginPath(); g.moveTo(W * 0.34 + Math.random() * W * 0.66, Math.random() * H); g.lineTo(W * 0.34 + Math.random() * W * 0.66, Math.random() * H); g.stroke(); }
    g.strokeStyle = '#3a8cff'; g.lineWidth = 9; g.beginPath(); g.moveTo(W * 0.6, H); g.bezierCurveTo(W * 0.62, H * 0.6, W * 0.75, H * 0.4, W, H * 0.35); g.stroke();
    g.fillStyle = '#20242a'; g.fillRect(0, H * 0.86, W, H * 0.14);
    return c;
  }
  g.fillStyle = '#030405'; g.fillRect(0, 0, W, H);
  if (style === 'digital') {
    const cx = W / 2, cy = 236, r = 170; const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
    const bgr = g.createRadialGradient(cx, cy, 20, cx, cy, 420); bgr.addColorStop(0, '#0d1620'); bgr.addColorStop(1, '#020304'); g.fillStyle = bgr; g.fillRect(0, 0, W, H);
    g.lineWidth = 22; g.strokeStyle = '#141c26'; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#58687a';
    const n = ev ? 6 : maxR / 1000;
    g.font = '20px sans-serif'; g.fillStyle = '#7a8a9a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; g.beginPath(); g.moveTo(cx + Math.cos(a) * (r + 14), cy + Math.sin(a) * (r + 14)); g.lineTo(cx + Math.cos(a) * (r + 26), cy + Math.sin(a) * (r + 26)); g.stroke(); g.fillText(ev ? String(i * 50) : String(i), cx + Math.cos(a) * (r + 44), cy + Math.sin(a) * (r + 44)); }
    if (!ev) { g.strokeStyle = '#c21a12'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r + 18, a0 + (a1 - a0) * red / maxR, a1); g.stroke(); }
    g.fillStyle = '#58687a'; g.font = '18px sans-serif'; g.fillText(ev ? 'kW' : 'x1000 r/min', cx, cy + 120);
    // side info panels
    g.strokeStyle = '#1c2834'; g.lineWidth = 2; g.strokeRect(40, 120, 200, 200); g.strokeRect(W - 240, 120, 200, 200);
    return c;
  }
  // analog: two dials with chrome-ish rims, ticks and numbers
  const dial = (cx, cy, r, max, step, minor, redFrom, fmt, label) => {
    const gr = g.createRadialGradient(cx, cy - 30, 10, cx, cy, r); gr.addColorStop(0, '#15171b'); gr.addColorStop(1, '#060708');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    if (redFrom) { g.strokeStyle = '#d0140c'; g.lineWidth = 12; g.beginPath(); g.arc(cx, cy, r - 12, a0 + (a1 - a0) * redFrom / max, a1); g.stroke(); }
    for (let v = 0; v <= max + 1e-6; v += minor) {
      const a = a0 + (a1 - a0) * v / max, major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
      g.strokeStyle = redFrom && v >= redFrom ? '#ff4030' : '#e8eef4'; g.lineWidth = major ? 4 : 2;
      const r0 = r - (major ? 30 : 20);
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); g.stroke();
      if (major) { g.fillStyle = '#f0f4f8'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fmt(v), cx + Math.cos(a) * (r - 52), cy + Math.sin(a) * (r - 52)); }
    }
    g.fillStyle = '#8a96a2'; g.font = '17px sans-serif'; g.textAlign = 'center'; g.fillText(label, cx, cy + r * 0.45);
  };
  if (ev) dial(240, 192, 160, 300, 50, 10, 0, v => v, 'kW');
  else dial(240, 192, 160, maxR, 1000, 500, red, v => v / 1000, 'x1000 r/min');
  dial(784, 192, 160, maxK, 20, 10, 0, v => v % 40 === 0 ? v : '', 'km/h');
  // centre info panel
  g.fillStyle = '#0a0c0f'; g.fillRect(W / 2 - 110, 140, 220, 170); g.strokeStyle = '#1e242c'; g.lineWidth = 2; g.strokeRect(W / 2 - 110, 140, 220, 170);
  return c;
}
function drawTelltale(g, x, y, kind, on, col) {
  g.save(); g.translate(x, y);
  g.fillStyle = g.strokeStyle = on ? col : '#1b1f24'; g.lineWidth = 4;
  if (on) { g.shadowColor = col; g.shadowBlur = 16; }
  switch (kind) {
    case 'left': g.beginPath(); g.moveTo(-22, 0); g.lineTo(-4, -16); g.lineTo(-4, -7); g.lineTo(20, -7); g.lineTo(20, 7); g.lineTo(-4, 7); g.lineTo(-4, 16); g.fill(); break;
    case 'right': g.beginPath(); g.moveTo(22, 0); g.lineTo(4, -16); g.lineTo(4, -7); g.lineTo(-20, -7); g.lineTo(-20, 7); g.lineTo(4, 7); g.lineTo(4, 16); g.fill(); break;
    case 'high': g.beginPath(); g.arc(-6, 0, 12, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fill(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(10, i * 8); g.lineTo(24, i * 8); g.stroke(); } break;
    case 'pos': g.beginPath(); g.arc(-8, 0, 9, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fill(); g.beginPath(); g.arc(8, 0, 9, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); break;
    case 'fog': g.beginPath(); g.arc(8, 0, 11, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-6, i * 8); g.lineTo(-22, i * 8); g.stroke(); } g.beginPath(); g.moveTo(-14, -14); g.quadraticCurveTo(-10, 0, -14, 14); g.stroke(); break;
    case 'brake': g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.stroke(); g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 0, 1); break;
  }
  g.restore();
}

function strobeOn(mode, t, i) {
  switch (mode) {
    case 'flash': return (t * 12 % 1) < 0.35 && Math.floor(t * 2) % 2 === i % 2;
    case 'triple': { const ph = t % 1.0; const n = Math.floor(ph / 0.08); return n < 6 && n % 2 === 0 && (i % 2 === (Math.floor(t) % 2)); }
    case 'police': return (Math.floor(t * 8) + i) % 2 === 0;
    case 'amber': return (t * 3 % 1) < 0.5;
    case 'steady': return true;
    default: return false;
  }
}
export const STROBE_MODES = ['off', 'flash', 'triple', 'police', 'amber', 'steady'];
export { clusterStyle };
