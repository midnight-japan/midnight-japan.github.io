// Zama sunflower fields (v2.13.11) — 座間市ひまわりまつり on the Sagami River (data/sunflowers.js = the real plots).
// Summer: ~2 m sunflowers in rows, heads turned east, a yellow sea to the levee. Spring: young green plants with closed
// green buds; autumn: drooping brown seed heads on browning plants; winter: bare ploughed soil.
// v2.16: the plants are a real 3D model (Sketchfab "Sunflower" by zvanstone, CC BY 4.0 — assets/CREDITS.md, baked by
// tools/prop-bake.mjs into assets/models/props/sunflower*.glb) drawn in distance rings around the camera:
//   < R0   the full model (1 008 tris)            R0…R1  a simplified model (221 tris)
//   R1…R   crossed-quad impostors (4 tris) whose texture is rendered from the model at run time (front + side view)
//   > R    the field "canopy" + a sunflower band along the field edge, both textured with views rendered from the model,
//          so the field reads as sunflowers from kilometres away
// Seasons are a shader recolour of the model's own texture (petals → green bud / dry brown, leaves → brown) plus a
// head droop in autumn; the impostor / canopy / edge textures are re-rendered whenever the season changes.
// Without the model file the old procedural plants and painted textures are used.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SUNFLOWER_FIELDS } from '../../data/sunflowers.js';
import { seasonOf } from './seasonfx.js';
import { loadProps, propAsset } from './props.js';

const SP = 0.62; // plant spacing (m)
const R0 = 7, R1 = 16; // full model / simplified model ring radii (m)
function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) { const xi = P[i], zi = P[i + 1], xj = P[j], zj = P[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }

function plantGeo() {
  const col = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); return g.index ? g.toNonIndexed() : g; };
  const stem = col(new THREE.CylinderGeometry(0.018, 0.026, 1.75, 5, 1, true).translate(0, 0.875, 0), [0.28, 0.45, 0.16]);
  const leaf = (y, r) => col(new THREE.CircleGeometry(0.13, 6).scale(1, 1.6, 1).rotateX(-1.1).rotateY(r).translate(Math.sin(r) * 0.12, y, Math.cos(r) * 0.12), [0.24, 0.42, 0.14]);
  // head: petal ring + seed disc, facing +z (east after the instance rotation), tilted a little down
  const petals = col(new THREE.RingGeometry(0.09, 0.2, 14, 1), [0.98, 0.76, 0.08]);
  const disc = col(new THREE.CircleGeometry(0.095, 12).translate(0, 0, 0.004), [0.3, 0.17, 0.06]);
  const back = col(new THREE.CircleGeometry(0.16, 10).rotateY(Math.PI).translate(0, 0, -0.01), [0.3, 0.42, 0.14]);
  const head = mergeGeometries([petals, disc, back]); head.rotateX(0.25); head.translate(0, 1.78, 0.04);
  return mergeGeometries([stem, leaf(0.8, 0.4), leaf(1.15, 2.8), head]);
}

// season look: petal recolour target + mix, leaf/stem multiplier, head droop (rad), plant scale
const LOOK = {
  spring: { petal: [0.16, 0.3, 0.06], mix: 0.92, leaf: [0.95, 1.08, 0.8], droop: 0, k: 0.45 },
  summer: { petal: [1, 1, 1], mix: 0, leaf: [1, 1, 1], droop: 0, k: 1 },
  autumn: { petal: [0.16, 0.09, 0.035], mix: 0.88, leaf: [0.78, 0.55, 0.3], droop: 0.95, k: 0.92 },
  winter: { petal: [1, 1, 1], mix: 0, leaf: [1, 1, 1], droop: 0, k: 0 },
};
// shader patch shared by the 3D plants and the sprite renders (uniform objects are shared, so one update recolours all)
function seasonPatch(U) {
  return sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uDroop;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { float w = smoothstep(1.3, 1.62, transformed.y) * uDroop; // bend the head forward / down about a pivot on the stem
          if (w > 0.0) { vec2 v = vec2(transformed.y - 1.42, transformed.z); float c = cos(w), s = sin(w); transformed.y = 1.42 + v.x * c - v.y * s; transformed.z = v.x * s + v.y * c; } }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uPetal; uniform float uPetalMix; uniform vec3 uLeaf;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        { vec3 c = diffuseColor.rgb; float yel = clamp((c.r - c.b) * 2.5 - 0.6, 0.0, 1.0) * step(c.g * 0.92, c.r); // petals / seed disc
          float l = dot(c, vec3(0.3, 0.59, 0.11));
          diffuseColor.rgb = mix(c * uLeaf, mix(c, uPetal * (0.6 + 1.6 * l), uPetalMix), yel); }`);
  };
}

export class Sunflowers {
  constructor(game) {
    this.g = game; this.fields = SUNFLOWER_FIELDS.map(f => { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (let i = 0; i < f.pts.length; i += 2) { x0 = Math.min(x0, f.pts[i]); x1 = Math.max(x1, f.pts[i]); z0 = Math.min(z0, f.pts[i + 1]); z1 = Math.max(z1, f.pts[i + 1]); } return { ...f, x0, z0, x1, z1 }; });
    let cx = 0, cz = 0; for (const f of this.fields) { cx += (f.x0 + f.x1) / 2; cz += (f.z0 + f.z1) / 2; } this.c = [cx / this.fields.length, cz / this.fields.length];
    this.R = { low: 18, medium: 28, high: 36, ultra: 44 }[game.quality] ?? 28;
    this.group = new THREE.Group(); this.group.name = 'sunflowers'; this.group.visible = false; game.scene.add(this.group);
    // soil + canopy per field
    const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#3f6a22'; x.fillRect(0, 0, 256, 256);
      let r = 7; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 170; i++) { const px = rnd() * 256, py = rnd() * 256, rr = 7 + rnd() * 4; for (const [ox, oy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) { x.fillStyle = rnd() < 0.5 ? '#f2b90f' : '#e8a90c'; x.beginPath(); x.arc(px + ox, py + oy, rr, 0, Math.PI * 2); x.fill(); x.fillStyle = '#4a2a0e'; x.beginPath(); x.arc(px + ox, py + oy, rr * 0.42, 0, Math.PI * 2); x.fill(); } }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
    this.canU = { uCam: { value: new THREE.Vector3() }, uR: { value: this.R - 4 } };
    this.canMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    this.canMat.onBeforeCompile = sh => { Object.assign(sh.uniforms, this.canU); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCam; uniform float uR; varying vec3 vWp;').replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (distance(vWp.xz, uCam.xz) < uR) discard;'); };
    this.soilMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
    this.canMat.side = THREE.DoubleSide;
    this.edgeMat = new THREE.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.clearRect(0, 0, 256, 128);
      let r = 11; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 26; i++) { const px = (i + 0.5) * 256 / 26 + (rnd() - 0.5) * 6, top = 8 + rnd() * 18; x.strokeStyle = '#3c6a22'; x.lineWidth = 3; x.beginPath(); x.moveTo(px, 128); x.lineTo(px, top + 8); x.stroke(); x.fillStyle = '#4c7a2a'; x.beginPath(); x.ellipse(px + 6, 70 + rnd() * 30, 9, 4, -0.5, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(px - 6, 60 + rnd() * 30, 9, 4, 0.5, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#f2b90f'; x.beginPath(); x.arc(px, top, 9, 0, Math.PI * 2); x.fill(); x.fillStyle = '#4a2a0e'; x.beginPath(); x.arc(px, top, 4, 0, Math.PI * 2); x.fill(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.85 });
    this.edgeMat.onBeforeCompile = this.canMat.onBeforeCompile;
    this.canopy = []; this.canopyTop = [];
    for (const f of this.fields) {
      const shape = new THREE.Shape(); for (let i = 0; i < f.pts.length; i += 2) (i ? shape.lineTo(f.pts[i], -f.pts[i + 1]) : shape.moveTo(f.pts[i], -f.pts[i + 1]));
      const sg = new THREE.ShapeGeometry(shape); sg.rotateX(-Math.PI / 2); // shape y = -z → after rotation z = +z
      const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 5, uv.getY(i) / 5);
      const soil = new THREE.Mesh(sg, this.soilMat); soil.position.y = 0.06; soil.receiveShadow = true; this.group.add(soil);
      const can = new THREE.Mesh(sg, this.canMat); can.position.y = 1.7; this.group.add(can); this.canopy.push(can); this.canopyTop.push(can);
      // v2.14: the field's edge as a band of sunflowers (side view) so it reads from far away, at road level
      const pos = [], uvs = []; let run = 0;
      for (let i = 0; i < f.pts.length; i += 2) { const j = (i + 2) % f.pts.length, ax = f.pts[i], az = f.pts[i + 1], bx = f.pts[j], bz = f.pts[j + 1], L = Math.hypot(bx - ax, bz - az);
        pos.push(ax, 0.05, az, bx, 0.05, bz, bx, 2.25, bz, ax, 0.05, az, bx, 2.25, bz, ax, 2.25, az); const u0 = run / 3, u1 = (run + L) / 3; uvs.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1); run += L; }
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); eg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); eg.computeVertexNormals();
      const edge = new THREE.Mesh(eg, this.edgeMat); this.group.add(edge); this.canopy.push(edge);
    }
    const cap = (r0, r1) => Math.ceil(Math.PI * (r1 * r1 - r0 * r0) / (SP * SP) * 1.1) + 50;
    this.N = cap(0, this.R);
    this.plants = new THREE.InstancedMesh(plantGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }), this.N);
    this.plants.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.plants.count = 0; this.plants.frustumCulled = false; this.plants.castShadow = game.quality !== 'low'; this.group.add(this.plants);
    this.last = new THREE.Vector3(1e9, 0, 1e9); this.season = null;
    // v2.16 real model (loaded with the street props; falls back to the procedural plant above if missing)
    this.U = { uDroop: { value: 0 }, uPetal: { value: new THREE.Color(1, 1, 1) }, uPetalMix: { value: 0 }, uLeaf: { value: new THREE.Color(1, 1, 1) } };
    this.model = null;
    loadProps().then(() => { try { this.initModel(cap); } catch (e) { console.warn('sunflower model', e); } });
  }
  initModel(cap) {
    const hi = propAsset('sunflower'), lo = propAsset('sunflower_lo'); if (!hi || !lo) return;
    // the baked origin is the bbox centre (leaves included): move the stem foot to x = z = 0 so the plant turns about its stem
    const foot = geo => { const p = geo.attributes.position; let x = 0, z = 0, n = 0; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.25) { x += p.getX(i); z += p.getZ(i); n++; } const g = geo.clone(); if (n) g.translate(-x / n, 0, -z / n); g.rotateY(-Math.PI / 2); g.computeBoundingSphere(); return g; }; // the model's head faces +x → +z
    const patch = seasonPatch(this.U), q = this.g.quality, shadows = q !== 'low';
    const mk = (a, n, name) => { const m = a.mat.clone(); m.side = THREE.DoubleSide; m.onBeforeCompile = patch; m.customProgramCacheKey = () => 'sunflower';
      const im = new THREE.InstancedMesh(foot(a.geo), m, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.count = 0; im.frustumCulled = false; im.castShadow = shadows; im.receiveShadow = true; im.name = name; this.group.add(im); return im; };
    const r0 = Math.min(R0, this.R), r1 = Math.min(R1, this.R);
    this.hiIM = mk(hi, cap(0, r0), 'sunflowers_hi'); this.loIM = mk(lo, cap(r0, r1), 'sunflowers_lo');
    // sprite material: same texture + season patch, unlit (the sprite holds albedo; the impostor material lights it)
    this.spriteMat = new THREE.MeshBasicMaterial({ map: hi.mat.map, alphaTest: 0.5, side: THREE.DoubleSide }); this.spriteMat.onBeforeCompile = patch; this.spriteMat.customProgramCacheKey = () => 'sunflower_sprite';
    this.spriteGeo = foot(hi.geo);
    // render targets: [front | side] plant sprite, a 5 m canopy tile seen from above, a 3 m edge strip seen from the side
    const rt = (w, h, rep) => { const t = new THREE.WebGLRenderTarget(w, h, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
      if (rep) { t.texture.wrapS = THREE.RepeatWrapping; t.texture.wrapT = rep === 2 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; } t.texture.anisotropy = 4; return t; };
    this.rtSprite = rt(512, 256); this.rtCanopy = rt(512, 512, 2); this.rtEdge = rt(512, 256, 1);
    // impostor: two crossed quads 2.1 m square (front view on the x-y quad, side view on the z-y quad)
    const S = 1.05, H = 2.1, quad = (u0, ax, az) => { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-S * ax, 0, -S * az, S * ax, 0, S * az, S * ax, H, S * az, -S * ax, H, -S * az], 3));
      const nx = -az, nz = ax; g.setAttribute('normal', new THREE.Float32BufferAttribute(Array(4).fill([nx * 0.55, 0.83, nz * 0.55]).flat(), 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, 0, u0 + 0.5, 0, u0 + 0.5, 1, u0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const ig = mergeGeometries([quad(0, 1, 0), quad(0.5, 0, -1)]);
    this.impMat = new THREE.MeshStandardMaterial({ map: this.rtSprite.texture, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
    this.impIM = new THREE.InstancedMesh(ig, this.impMat, cap(r1, this.R)); this.impIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.impIM.count = 0; this.impIM.frustumCulled = false; this.impIM.name = 'sunflowers_imp'; this.group.add(this.impIM);
    this.plants.visible = false; this.plants.count = 0;
    this.canMat.map = this.rtCanopy.texture; this.canMat.color.set(0xffffff); this.canMat.needsUpdate = true;
    this.edgeMat.map = this.rtEdge.texture; this.edgeMat.color.set(0xffffff); this.edgeMat.alphaTest = 0.5; this.edgeMat.needsUpdate = true;
    this.model = true; this.season = null; // re-apply the season (renders the sprites)
  }
  // season → uniforms, then the sprite / canopy / edge textures rendered from the model
  renderSprites(L) {
    const r = this.g.renderer; if (!r || !this.model) return;
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50), M = new THREE.Matrix4();
    const prevRT = r.getRenderTarget(), prevAC = r.autoClear, prevCol = r.getClearColor(new THREE.Color()), prevA = r.getClearAlpha(), prevSh = r.shadowMap.autoUpdate;
    r.shadowMap.autoUpdate = false; r.autoClear = false; r.setClearColor(0x3e5a22, 0);
    const go = (target, list, cells, opaque = false) => { // list: [x, y, z, rotY, pitch, scale]*; cells: [[vx, vw, camSetup]]
      const im = new THREE.InstancedMesh(this.spriteGeo, this.spriteMat, list.length); const Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3();
      list.forEach((p, i) => { E.set(p[4], p[3], 0, 'YXZ'); Q.setFromEuler(E); P.set(p[0], p[1], p[2]); Sc.setScalar(p[5]); im.setMatrixAt(i, M.compose(P, Q, Sc)); });
      im.frustumCulled = false; scene.add(im);
      r.setRenderTarget(target); r.setClearColor(opaque ? 0x2f4a1c : 0x3e5a22, opaque ? 1 : 0); r.clear(); // canopy: dense leaves between the heads
      for (const [vx, vw, setup] of cells) { setup(); cam.updateProjectionMatrix(); target.viewport.set(vx, 0, vw, target.height); target.scissor.set(vx, 0, vw, target.height); target.scissorTest = true; r.setRenderTarget(target); r.render(scene, cam); }
      target.scissorTest = false; scene.remove(im); im.dispose();
    };
    try {
      const h = 2.1, k = L.k;
      // plant sprite (scale 1: the impostor instances carry the season scale)
      go(this.rtSprite, [[0, 0, 0, 0, 0, 1]], [
        [0, 256, () => { cam.left = -1.05; cam.right = 1.05; cam.top = h; cam.bottom = 0; cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); }],
        [256, 256, () => { cam.left = -1.05; cam.right = 1.05; cam.top = h; cam.bottom = 0; cam.position.set(10, 0, 0); cam.lookAt(0, 0, 0); }]]);
      // canopy tile (5 m, wraps): plants on a jittered 8 × 8 grid, heads tipped up so their faces show from above
      let s = 5; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647), can = [];
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const x = (i + 0.5) * 0.625 + (rnd() - 0.5) * 0.2, z = (j + 0.5) * 0.625 + (rnd() - 0.5) * 0.2, ry = (rnd() - 0.5) * 1.2, sc = (0.85 + rnd() * 0.3) * k;
        for (const ox of [-5, 0, 5]) for (const oz of [-5, 0, 5]) can.push([x + ox, -1.6 * sc, -(z + oz), ry, -0.9, sc]); } // screen up = -z
      go(this.rtCanopy, can, [[0, 512, () => { cam.left = 0; cam.right = 5; cam.top = 5; cam.bottom = 0; cam.position.set(0, 10, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0); }]], true);
      cam.up.set(0, 1, 0);
      // edge strip (3 m, wraps along u): two staggered rows seen from the side, heads towards the viewer
      const edge = []; s = 11;
      for (let i = 0; i < 6; i++) for (const row of [0, 1]) { const x = (i + 0.25 + row * 0.5) * 0.5 + (rnd() - 0.5) * 0.1, sc = (0.88 + rnd() * 0.22) * k;
        for (const ox of [-3, 0, 3]) edge.push([x + ox, 0, -row * 0.6, (rnd() - 0.5) * 0.7, 0, sc]); }
      go(this.rtEdge, edge, [[0, 512, () => { cam.left = 0; cam.right = 3; cam.top = 2.25; cam.bottom = 0.05; cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); }]]);
    } finally {
      r.setRenderTarget(prevRT); r.autoClear = prevAC; r.setClearColor(prevCol, prevA); r.shadowMap.autoUpdate = prevSh;
    }
  }
  // grid points inside the fields within R of (x, z) → instance matrices (deterministic jitter per grid cell), split into
  // the distance rings (full model / simplified model / impostor)
  fill(x, z) {
    const R = this.R, M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
    const s = this.season, L = LOOK[s] || LOOK.summer, k = L.k, droop = this.model ? 0 : s === 'autumn' ? 0.9 : 0;
    const ims = this.model ? [this.hiIM, this.loIM, this.impIM] : [this.plants, this.plants, this.plants], n = [0, 0, 0], cap = ims.map(m => m.instanceMatrix.count);
    const r0 = R0 * R0, r1 = R1 * R1;
    for (const f of this.fields) {
      if (x + R < f.x0 || x - R > f.x1 || z + R < f.z0 || z - R > f.z1) continue;
      for (let gi = Math.floor(Math.max(f.x0, x - R) / SP); gi <= Math.ceil(Math.min(f.x1, x + R) / SP); gi++) for (let gj = Math.floor(Math.max(f.z0, z - R) / SP); gj <= Math.ceil(Math.min(f.z1, z + R) / SP); gj++) {
        const h = Math.abs(Math.sin(gi * 12.9898 + gj * 78.233) * 43758.5453) % 1, h2 = (h * 7.31) % 1;
        const px = gi * SP + (h - 0.5) * 0.25, pz = gj * SP + (h2 - 0.5) * 0.25, d2 = (px - x) ** 2 + (pz - z) ** 2;
        if (d2 > R * R || !inPoly(px, pz, f.pts)) continue;
        const ring = !this.model ? 0 : d2 < r0 ? 0 : d2 < r1 ? 1 : 2, im = ims[ring], slot = this.model ? ring : 0;
        if (n[slot] >= cap[slot]) continue;
        E.set(droop + (h2 - 0.5) * 0.12, Math.PI / 2 + (h - 0.5) * 0.7, (h - 0.5) * 0.1); Q.setFromEuler(E); // heads face east (+x)
        const sc = (0.85 + h2 * 0.3) * k; P.set(px, 0.05, pz); S.set(sc, sc, sc); M.compose(P, Q, S); im.setMatrixAt(n[slot]++, M);
      }
    }
    if (this.model) ims.forEach((im, i) => { im.count = n[i]; im.instanceMatrix.needsUpdate = true; });
    else { this.plants.count = n[0]; this.plants.instanceMatrix.needsUpdate = true; }
  }
  update(dt, cam) {
    const p = cam.position, near = Math.hypot(p.x - this.c[0], p.z - this.c[1]) < 6000; // v2.14: visible from far away
    this.group.visible = near; if (!near) return;
    const s = seasonOf(this.g.settings?.season);
    if (s !== this.season) { this.season = s; this.last.set(1e9, 0, 1e9);
      const bloom = s === 'summer', bare = s === 'winter', L = LOOK[s] || LOOK.summer;
      for (const c of this.canopy) c.visible = !bare;
      if (this.model) {
        this.U.uDroop.value = L.droop; this.U.uPetal.value.setRGB(...L.petal); this.U.uPetalMix.value = L.mix; this.U.uLeaf.value.setRGB(...L.leaf);
        for (const im of [this.hiIM, this.loIM, this.impIM]) im.visible = !bare;
        for (const c of this.canopyTop) c.position.y = 1.62 * L.k + 0.06;
        if (!bare) { try { this.renderSprites(L); } catch (e) { console.warn('sunflower sprites', e); } }
      } else {
        this.edgeMat.color.set(bloom ? 0xffffff : s === 'spring' ? 0x6f9a4a : 0x8a6a3a); this.plants.visible = !bare;
        this.canMat.color.set(bloom ? 0xffffff : s === 'spring' ? 0x6f9a4a : 0x8a6a3a); this.canMat.needsUpdate = true;
        this.plants.material.color.set(bloom ? 0xffffff : s === 'spring' ? 0x9fd07a : 0x9a7a4a);
      }
    }
    this.canU.uCam.value.copy(p); this.canU.uR.value = this.R - 4;
    if (Math.hypot(p.x - this.last.x, p.z - this.last.z) > 4) { this.last.copy(p); this.fill(p.x, p.z); }
  }
}
