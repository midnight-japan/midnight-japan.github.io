// v2.15 near trees: within a radius of the player every street / park tree is drawn as a real 3D model (Sketchfab, see
// assets/CREDITS.md, baked by tools/prop-bake.mjs) instead of the light procedural one. Every ~0.4 s the nearest trees of the
// loaded near tiles are copied into one InstancedMesh per model and their procedural instances are collapsed (scale 0);
// those that drift out of range get their procedural tree back. Leaf tint, seasons and bare winter come from flora.js
// (same shader, instance colour); in spring cherry trees use the textured blossom model.
import * as THREE from 'three';
import { propAsset } from './props.js';
import { floraModelMaterial, getSeason } from './flora.js';

const MODEL = { ginkgo: 'tree_ginkgo', zelkova: 'tree_zelkova', camphor: 'tree_camphor', pine: 'tree_pine', cedar: 'tree_cedar', maple: 'tree_maple', sakura: 'tree_maple' };
const RADIUS = { low: 90, medium: 140, high: 190, ultra: 260 };
const CAP = { low: 160, medium: 260, high: 420, ultra: 700 };
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

export class NearTrees {
  constructor(parent, quality) {
    this.parent = parent; this.R = RADIUS[quality] ?? 190; this.cap = CAP[quality] ?? 420;
    this.ims = new Map();     // model key → InstancedMesh
    this.hidden = [];         // [procIM, index, Matrix4] currently collapsed
    this.t = 0; this.M = new THREE.Matrix4(); this.C = new THREE.Color();
  }
  mesh(key, spring) {
    const k = spring ? 'sakura' : key; let im = this.ims.get(k); if (im) return im;
    const a = propAsset(k); if (!a) return null;
    const mat = spring ? a.mat : floraModelMaterial(a.mat);
    if (spring) { mat.side = THREE.DoubleSide; }
    im = new THREE.InstancedMesh(a.geo, mat, this.cap); im.count = 0; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = false;
    if (!spring) im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.cap * 3), 3);
    im.name = 'neartrees_' + k; this.parent.add(im); this.ims.set(k, im); return im;
  }
  // a tile is being replaced / unloaded: its procedural meshes go away, don't try to restore into them later
  forget(t) { if (!t?.treeIMs) return; const dead = new Set(t.treeIMs.map(e => e.im)); this.hidden = this.hidden.filter(h => !dead.has(h[0])); this.t = 0; }
  update(dt, focus, tiles) {
    if (!this.R) return; this.t -= dt; if (this.t > 0) return; this.t = 0.4;
    const touched = new Set();
    for (const [im, i, m] of this.hidden) { im.setMatrixAt(i, m); touched.add(im); }
    this.hidden = [];
    // nearest trees first
    const cand = [], R2 = this.R * this.R, M = this.M;
    for (const t of tiles.values()) {
      if (!t.treeIMs || !t.group || t.lod !== 0) continue; const ox = t.group.position.x, oz = t.group.position.z;
      if (Math.abs(ox + 500 - focus.x) > 500 + this.R || Math.abs(oz + 500 - focus.z) > 500 + this.R) continue;
      for (const e of t.treeIMs) { if (!MODEL[e.sp]) continue; const a = e.im.instanceMatrix.array;
        for (let i = 0; i < e.im.count; i++) { const dx = a[i * 16 + 12] + ox - focus.x, dz = a[i * 16 + 14] + oz - focus.z, d2 = dx * dx + dz * dz; if (d2 < R2) cand.push([d2, e, i, ox, oz]); } }
    }
    cand.sort((p, q) => p[0] - q[0]);
    const spring = getSeason() === 'spring', fill = new Map();
    for (const im of this.ims.values()) im.count = 0;
    for (const [, e, i, ox, oz] of cand) {
      const sp = spring && e.sp === 'sakura', im = this.mesh(MODEL[e.sp], sp); if (!im || im.count >= this.cap) continue;
      e.im.getMatrixAt(i, M); const keep = M.clone(); M.elements[12] += ox; M.elements[14] += oz;
      const n = im.count++; im.setMatrixAt(n, M);
      if (!sp && e.im.instanceColor) { e.im.getColorAt(i, this.C); im.setColorAt(n, this.C); }
      e.im.setMatrixAt(i, ZERO); touched.add(e.im); this.hidden.push([e.im, i, keep]); fill.set(im, true);
    }
    for (const im of touched) im.instanceMatrix.needsUpdate = true;
    for (const im of this.ims.values()) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  }
}
