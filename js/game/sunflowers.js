// Zama sunflower fields (v2.13.11) — 座間市ひまわりまつり on the Sagami River (data/sunflowers.js = the real plots).
// Summer: ~2 m sunflowers in rows, heads turned east, a yellow sea to the levee. Close to the camera every plant is a
// real 3D plant (instanced: stem, two leaves, petal ring, seed disc); further out the field is one "canopy" surface with
// a painted head texture that fades out where the 3D plants take over. Spring: young green plants; autumn: drooping
// brown seed heads; winter: bare ploughed soil.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SUNFLOWER_FIELDS } from '../../data/sunflowers.js';
import { seasonOf } from './seasonfx.js';

const SP = 0.62; // plant spacing (m)
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
    this.canopy = [];
    for (const f of this.fields) {
      const shape = new THREE.Shape(); for (let i = 0; i < f.pts.length; i += 2) (i ? shape.lineTo(f.pts[i], -f.pts[i + 1]) : shape.moveTo(f.pts[i], -f.pts[i + 1]));
      const sg = new THREE.ShapeGeometry(shape); sg.rotateX(-Math.PI / 2); // shape y = -z → after rotation z = +z
      const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 5, uv.getY(i) / 5);
      const soil = new THREE.Mesh(sg, this.soilMat); soil.position.y = 0.06; soil.receiveShadow = true; this.group.add(soil);
      const can = new THREE.Mesh(sg, this.canMat); can.position.y = 1.7; this.group.add(can); this.canopy.push(can);
    }
    this.N = Math.ceil(Math.PI * this.R * this.R / (SP * SP)) + 50;
    this.plants = new THREE.InstancedMesh(plantGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }), this.N);
    this.plants.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.plants.count = 0; this.plants.frustumCulled = false; this.plants.castShadow = game.quality !== 'low'; this.group.add(this.plants);
    this.last = new THREE.Vector3(1e9, 0, 1e9); this.season = null;
  }
  // grid points inside the fields within R of (x, z) → instance matrices (deterministic jitter per grid cell)
  fill(x, z) {
    const R = this.R, M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
    const s = this.season, k = s === 'spring' ? 0.45 : s === 'autumn' ? 0.92 : 1, droop = s === 'autumn' ? 0.9 : 0;
    let n = 0;
    for (const f of this.fields) {
      if (x + R < f.x0 || x - R > f.x1 || z + R < f.z0 || z - R > f.z1) continue;
      for (let gi = Math.floor(Math.max(f.x0, x - R) / SP); gi <= Math.ceil(Math.min(f.x1, x + R) / SP); gi++) for (let gj = Math.floor(Math.max(f.z0, z - R) / SP); gj <= Math.ceil(Math.min(f.z1, z + R) / SP); gj++) {
        if (n >= this.N) break;
        const h = Math.abs(Math.sin(gi * 12.9898 + gj * 78.233) * 43758.5453) % 1, h2 = (h * 7.31) % 1;
        const px = gi * SP + (h - 0.5) * 0.25, pz = gj * SP + (h2 - 0.5) * 0.25;
        if ((px - x) ** 2 + (pz - z) ** 2 > R * R || !inPoly(px, pz, f.pts)) continue;
        E.set(droop + (h2 - 0.5) * 0.12, Math.PI / 2 + (h - 0.5) * 0.7, (h - 0.5) * 0.1); Q.setFromEuler(E); // heads face east (+x)
        const sc = (0.85 + h2 * 0.3) * k; P.set(px, 0.05, pz); S.set(sc, sc, sc); M.compose(P, Q, S); this.plants.setMatrixAt(n++, M);
      }
    }
    this.plants.count = n; this.plants.instanceMatrix.needsUpdate = true;
  }
  update(dt, cam) {
    const p = cam.position, near = Math.hypot(p.x - this.c[0], p.z - this.c[1]) < 2600;
    this.group.visible = near; if (!near) return;
    const s = seasonOf(this.g.settings?.season);
    if (s !== this.season) { this.season = s; this.last.set(1e9, 0, 1e9);
      const bloom = s === 'summer', bare = s === 'winter';
      for (const c of this.canopy) c.visible = !bare; this.plants.visible = !bare;
      this.canMat.color.set(bloom ? 0xffffff : s === 'spring' ? 0x6f9a4a : 0x8a6a3a); this.canMat.map = bloom ? this.canMat.map : this.canMat.map; this.canMat.needsUpdate = true;
      this.plants.material.color.set(bloom ? 0xffffff : s === 'spring' ? 0x9fd07a : 0x9a7a4a); }
    this.canU.uCam.value.copy(p); this.canU.uR.value = this.R - 4;
    if (Math.hypot(p.x - this.last.x, p.z - this.last.z) > 4) { this.last.copy(p); this.fill(p.x, p.z); }
  }
}
