// v2.15 real 3D street props: Sketchfab models (CC BY 4.0, see assets/CREDITS.md) baked by tools/prop-bake.mjs into one
// mesh + one atlas material each, drawn with one InstancedMesh per kind per city tile. The city worker only emits
// (kind, x, z, rotY) records, so a tile with 40 vending machines and 120 utility poles is still a couple of draw calls.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const PROP_KINDS = ['vending', 'pole_a', 'pole_b']; // index = kind id written by city-worker.js
const EXTRA = ['sakura', 'tree_ginkgo', 'tree_zelkova', 'tree_camphor', 'tree_pine', 'tree_cedar', 'tree_maple'];
const BASE = new URL('../../assets/models/props/', import.meta.url);
const assets = {};
let loading = null;

// load every prop model once; resolves even if a file is missing (that kind is then simply not drawn)
export function loadProps() {
  if (loading) return loading;
  const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
  loading = Promise.all([...PROP_KINDS, ...EXTRA].map(n => L.loadAsync(new URL(n + '.glb', BASE).href).then(g => {
    let mesh = null; g.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    if (!mesh) return;
    // meshopt-quantised files keep positions as normalised ints + a node scale/offset: bake that into plain float
    // attributes so the InstancedMesh (which ignores the node transform) draws the model at its real size and pose
    g.scene.updateMatrixWorld(true);
    const geo = new THREE.BufferGeometry();
    for (const [name, a] of Object.entries(mesh.geometry.attributes)) {
      const f = new Float32Array(a.count * a.itemSize);
      for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) f[i * a.itemSize + c] = a.getComponent(i, c);
      geo.setAttribute(name, new THREE.BufferAttribute(f, a.itemSize));
    }
    geo.setIndex(mesh.geometry.index); geo.applyMatrix4(mesh.matrixWorld); mesh.geometry = geo;
    // tree models: leaf flag (custom glTF attribute _ALEAF → "_aleaf") for the flora shader + white vertex colour
    if (geo.attributes._aleaf) { geo.setAttribute('aLeaf', geo.attributes._aleaf); geo.deleteAttribute('_aleaf'); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3)); }
    const m = mesh.material; m.envMapIntensity = 0.6;
    if (m.map) { m.map.anisotropy = 4; }
    if (m.emissiveMap) m.emissiveIntensity = 1; // vending fronts stay lit
    mesh.geometry.computeBoundingSphere(); mesh.geometry.userData.shared = true;
    assets[n] = { geo: mesh.geometry, mat: m };
  }).catch(e => console.warn('prop model', n, e)))).then(() => assets);
  return loading;
}
export function propAsset(name) { return assets[name] || null; }

// instance records [kind, x, z, rotY]* (tile-local) → InstancedMeshes added to grp
export function addProps(grp, rec, shadows) {
  if (!rec || !rec.length) return;
  const by = new Map();
  for (let k = 0; k < rec.length; k += 4) { const kind = rec[k] | 0; let l = by.get(kind); if (!l) by.set(kind, l = []); l.push(k); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  for (const [kind, ids] of by) {
    const a = assets[PROP_KINDS[kind]]; if (!a) continue;
    const im = new THREE.InstancedMesh(a.geo, a.mat, ids.length);
    ids.forEach((k, i) => { Q.setFromAxisAngle(Y, rec[k + 3]); P.set(rec[k + 1], 0, rec[k + 2]); M.compose(P, Q, S); im.setMatrixAt(i, M); });
    im.castShadow = shadows; im.receiveShadow = true; im.computeBoundingSphere(); im.name = 'props_' + PROP_KINDS[kind];
    grp.add(im);
  }
}
