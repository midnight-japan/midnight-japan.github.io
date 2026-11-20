// Real 3D city (v2.0): the MLIT Project PLATEAU 3D city models — every surveyed building of the Tokyo wards,
// Yokohama, Kawasaki, Kamakura, Fujisawa, Kisarazu and Hakone, textured LOD2 where PLATEAU has it — streamed straight
// from PLATEAU's public CDN as 3D Tiles (data/plateau.json lists the datasets, built by tools/plateau-build.mjs).
// Each tile is re-projected vertex by vertex from earth-centred coordinates into the game's map projection (the same
// one the OpenStreetMap roads use), and every building is stood on the game's ground. Where PLATEAU covers the map
// the city worker drops its procedural building and keeps only the collider.
// Source: 3D都市モデル（Project PLATEAU）国土交通省 — used under the PLATEAU Site Policy (CC BY 4.0 compatible).
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { TilesRenderer } from '../../vendor/3d-tiles-renderer/index.three.js';
import { GLTFExtensionsPlugin } from '../../vendor/3d-tiles-renderer/index.three-plugins.js';
import { PA } from './roads.js';
import { inHakone } from './hakone.js';
// hand-built in the game (Daikoku PA, Cosmo Clock 21, Marine Tower, Hikawa Maru, Umihotaru): PLATEAU's copy is left out
const OWNOFF = /[?&]ownoff=1/.test(location.search);
const OWN = [[-3890, 686, 70], [-2648, 1979, 18], [-2700, 1585, 70], [17632, -310, 260]];

const A = 6378137, F = 1 / 298.257223563, B = A * (1 - F), E2 = F * (2 - F), EP2 = (A * A - B * B) / (B * B);
const D2R = Math.PI / 180;
const ON = { low: 3000, medium: 4500, high: 6000, ultra: 8000 };  // coarse tiles are cheap: far skyline   // a dataset streams when its bounds are this close
const ERR = { low: 130, medium: 90, high: 70, ultra: 52 };         // screen-space error target (px): leaf tiles within ≈1–2 km
const MB = { low: 220, medium: 380, high: 620, ultra: 900 };      // tile cache budget (MB, shared by all datasets)
const TEX = { low: 512, medium: 512, high: 1024, ultra: 2048 };  // facade atlas size cap (leaf tiles; coarser tiles get half)

// facade atlases are scaled down in a worker (createImageBitmap on the main thread blocked it for 20+ ms per tile)
let RW = null, rwId = 0, rwNext = 0; const rwCb = new Map();
function resizeInWorker(bmp, w, h) { // a pool of 3 workers: facades sharpen faster when many tiles arrive at once
  if (!RW) {
    const src = "onmessage=async e=>{const{id,b,w,h}=e.data;try{const o=await createImageBitmap(b,{resizeWidth:w,resizeHeight:h,resizeQuality:'high'});b.close();postMessage({id,o},[o]);}catch(x){postMessage({id,err:String(x)});}}";
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    RW = [0, 1, 2].map(() => { const w0 = new Worker(url); w0.onmessage = e => { const f = rwCb.get(e.data.id); rwCb.delete(e.data.id); f?.(e.data); }; return w0; });
  }
  return new Promise((ok, no) => { const id = ++rwId; rwCb.set(id, d => d.o ? ok(d.o) : no(d.err)); RW[rwNext++ % RW.length].postMessage({ id, b: bmp, w, h }, [bmp]); });
}

export class Plateau {
  constructor(world, scene, camera, renderer, quality) {
    this.world = world; this.scene = scene; this.camera = camera; this.renderer = renderer; this.q = quality;
    this.sets = []; this.live = new Map(); this.failed = new Set(); this.ready = false;
    this.group = new THREE.Group(); this.group.name = 'plateau'; scene.add(this.group);
    this.uniforms = { uNight: world.city?.uniforms.uNight || { value: 0 } };
    this.draco = new DRACOLoader(); this.draco.setDecoderPath(new URL('../../vendor/three/addons/libs/draco/', import.meta.url).href);
    this.draco.setWorkerLimit(2);
    this.stats = { tiles: 0, verts: 0, ms: 0 };
  }
  async init() {
    try { const r = await fetch(new URL('../../data/plateau.json', import.meta.url)); if (!r.ok) return false; this.data = await r.json(); } catch { return false; }
    const { lat, lon } = this.data.origin; this.LAT0 = lat; this.LON0 = lon; this.KX = 111320 * Math.cos(lat * D2R); this.KZ = 110574;
    this.sets = this.data.sets;
    this.world.city?.setPlateau(this.data.cell, this.data.cov, this.sets.map((_, i) => i));
    this.ready = true; return true;
  }
  // game metres → ECEF (h = ellipsoidal height)
  ecef(x, z, h, out = new THREE.Vector3()) {
    const lon = (this.LON0 + x / this.KX) * D2R, lat = (this.LAT0 - z / this.KZ) * D2R;
    const s = Math.sin(lat), N = A / Math.sqrt(1 - E2 * s * s);
    return out.set((N + h) * Math.cos(lat) * Math.cos(lon), (N + h) * Math.cos(lat) * Math.sin(lon), (N * (1 - E2) + h) * s);
  }
  // rigid ECEF → game frame about a point (only used for culling / LOD; the vertices are re-projected exactly)
  frameAt(x, z) {
    const lon = (this.LON0 + x / this.KX) * D2R, lat = (this.LAT0 - z / this.KZ) * D2R;
    const sl = Math.sin(lon), cl = Math.cos(lon), sp = Math.sin(lat), cp = Math.cos(lat);
    const e = [-sl, cl, 0], n = [-sp * cl, -sp * sl, cp], u = [cp * cl, cp * sl, sp];
    const C = this.ecef(x, z, 37); // ~ geoid height around Tokyo Bay
    const R = new THREE.Matrix4().set(e[0], e[1], e[2], 0, u[0], u[1], u[2], 0, -n[0], -n[1], -n[2], 0, 0, 0, 0, 1);
    const t = C.clone().applyMatrix4(R).negate().add(new THREE.Vector3(x, 0, z));
    R.setPosition(t);
    return R;
  }
  open(i) {
    const S = this.sets[i];
    const tiles = new TilesRenderer(S.url);
    tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: this.draco, rtc: true, autoDispose: false }));
    tiles.errorTarget = ERR[this.q] || 46;
    const L = tiles.lruCache, mb = (MB[this.q] || 480) * 2 ** 20; L.maxBytesSize = mb; L.minBytesSize = mb * 0.7; L.maxSize = 1200; L.minSize = 800;
    tiles.loadSiblings = false;
    tiles.setCamera(this.camera); tiles.setResolutionFromRenderer(this.camera, this.renderer);
    const cx = (S.bb[0] + S.bb[2]) / 2, cz = (S.bb[1] + S.bb[3]) / 2;
    const G = tiles.group; G.matrixAutoUpdate = false; G.matrix.copy(this.frameAt(cx, cz)); G.matrixWorldNeedsUpdate = true;
    const inv = G.matrix.clone().invert();
    tiles.addEventListener('load-model', ({ scene, tile }) => this.bake(scene, tile, inv, tiles));
    tiles.addEventListener('load-error', ({ url, error }) => { if (/tileset\.json/.test(String(url))) { console.warn('PLATEAU dataset unavailable', S.name, error?.message); this.fail(i); } });
    this.group.add(G);
    this.live.set(i, tiles);
  }
  close(i) { const t = this.live.get(i); if (!t) return; this.group.remove(t.group); t.dispose(); this.live.delete(i); }
  fail(i) {
    if (this.failed.has(i)) return; this.failed.add(i); this.close(i);
    this.world.city?.setPlateau(this.data.cell, this.data.cov, this.sets.map((_, k) => k).filter(k => !this.failed.has(k))); // OSM buildings come back there
  }

  // ── re-project one tile into game coordinates and stand each building on the ground ──
  bake(scene, tile, inv, tiles) {
    const t0 = performance.now();
    const tq = performance.now(); scene.updateMatrixWorld(true); // parentless here: matrixWorld = mesh → ECEF (tileset frame)
    const meshes = []; scene.traverse(o => { if (o.isMesh) meshes.push(o); });
    const p = new THREE.Vector3(), nrm = new THREE.Vector3(), nm = new THREE.Matrix3();
    const W = this.world, ground = (x, z) => (W.hakone && inHakone(x, z)) ? W.hakone.ground(x, z) : 0; // the city is flat at 0
    this.stats.tq = (this.stats.tq || 0) + performance.now() - tq;
    for (const m of meshes) {
      const g = m.geometry, pos = g.attributes.position; if (!pos) continue;
      const n = pos.count, M = m.matrixWorld;
      const bid = g.attributes._batchid || g.attributes._BATCHID || g.attributes.batchid || null;
      const t9 = performance.now();
      // ECEF → game is linearised about the mesh centre (Jacobian of the map projection; < 1 cm over a 500 m tile)
      if (!g.boundingBox) g.computeBoundingBox();
      const c = g.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(M);
      const r0 = Math.sqrt(c.x * c.x + c.y * c.y), th = Math.atan2(c.z * A, r0 * B), st = Math.sin(th), ct = Math.cos(th);
      const lat0 = Math.atan2(c.z + EP2 * B * st * st * st, r0 - E2 * A * ct * ct * ct), lon0 = Math.atan2(c.y, c.x);
      const sp = Math.sin(lat0), cp = Math.cos(lat0), sl = Math.sin(lon0), cl = Math.cos(lon0), w = Math.sqrt(1 - E2 * sp * sp);
      const Nr = A / w, Mr = A * (1 - E2) / (w * w * w), h0 = r0 / cp - Nr;
      const kx = this.KX / D2R / ((Nr + h0) * cp), kz = -this.KZ / D2R / (Mr + h0);
      const x0 = (lon0 / D2R - this.LON0) * this.KX, z0 = -(lat0 / D2R - this.LAT0) * this.KZ;
      const J = new THREE.Matrix4().set(
        -sl * kx, cl * kx, 0, 0,
        cp * cl, cp * sl, sp, 0,
        -sp * cl * kz, -sp * sl * kz, cp * kz, 0,
        0, 0, 0, 1);
      const T = new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z).premultiply(J).premultiply(new THREE.Matrix4().makeTranslation(x0, h0, z0)).multiply(M);
      const e = T.elements, X = new Float32Array(n), Z = new Float32Array(n), H = new Float32Array(n);
      const pa = pos.isInterleavedBufferAttribute ? null : pos.array, ps = pos.itemSize;
      for (let k = 0; k < n; k++) {
        let px, py, pz; if (pa && ps === 3 && !pos.normalized) { px = pa[k * 3]; py = pa[k * 3 + 1]; pz = pa[k * 3 + 2]; } else { px = pos.getX(k); py = pos.getY(k); pz = pos.getZ(k); }
        X[k] = e[0] * px + e[4] * py + e[8] * pz + e[12]; H[k] = e[1] * px + e[5] * py + e[9] * pz + e[13]; Z[k] = e[2] * px + e[6] * py + e[10] * pz + e[14];
      }
      this.stats.tp = (this.stats.tp || 0) + performance.now() - t9;
      // per building: lowest point → the game ground under its centre
      const tA = performance.now();
      const BI = new Uint32Array(n); if (bid) for (let k = 0; k < n; k++) BI[k] = bid.getX(k);
      let nb = 1; for (let k = 0; k < n; k++) if (BI[k] >= nb) nb = BI[k] + 1;
      const minH = new Float64Array(nb).fill(1e9), sx = new Float64Array(nb), sz = new Float64Array(nb), cnt = new Uint32Array(nb);
      const bx0 = new Float64Array(nb).fill(1e9), bx1 = new Float64Array(nb).fill(-1e9), bz0 = new Float64Array(nb).fill(1e9), bz1 = new Float64Array(nb).fill(-1e9);
      for (let k = 0; k < n; k++) { const b = BI[k]; if (H[k] < minH[b]) minH[b] = H[k]; sx[b] += X[k]; sz[b] += Z[k]; cnt[b]++; if (X[k] < bx0[b]) bx0[b] = X[k]; if (X[k] > bx1[b]) bx1[b] = X[k]; if (Z[k] < bz0[b]) bz0[b] = Z[k]; if (Z[k] > bz1[b]) bz1[b] = Z[k]; }
      const maxH = new Float64Array(nb).fill(-1e9); for (let k = 0; k < n; k++) { const b = BI[k]; if (H[k] > maxH[b]) maxH[b] = H[k]; }
      const base = new Float64Array(nb), drop = new Uint8Array(nb);
      for (let b = 0; b < nb; b++) {
        if (!cnt[b]) continue; const cx = sx[b] / cnt[b], cz = sz[b] / cnt[b], gy = ground(cx, cz);
        base[b] = gy - minH[b];
        // left out: the game's own models, and anything a carriageway would run through (its deck between foot and roof)
        if (bid && (PA.inLot(cx, cz, 14) || !OWNOFF && OWN.some(([x, z, r]) => Math.hypot(cx - x, cz - z) < r))) { drop[b] = 1; this.stats.dropOwn = (this.stats.dropOwn || 0) + 1; }
        else if (bid) { // a carriageway through it (deck between its foot and roof + 3 m) or an open cutting under it
          const top = gy + maxH[b] - minH[b], city = this.world.city, pts = [[cx, cz], [bx0[b] * 0.8 + bx1[b] * 0.2, bz0[b] * 0.8 + bz1[b] * 0.2], [bx0[b] * 0.2 + bx1[b] * 0.8, bz0[b] * 0.2 + bz1[b] * 0.8], [bx0[b] * 0.8 + bx1[b] * 0.2, bz0[b] * 0.2 + bz1[b] * 0.8], [bx0[b] * 0.2 + bx1[b] * 0.8, bz0[b] * 0.8 + bz1[b] * 0.2]];
          for (const [px, pz] of pts) { if (city?.inTrench(px, pz) || this.world.net.hits(px, pz).some(h => h.inside && h.road.kind !== 'local' && h.y > gy - 12 && h.y < top + 3)) { drop[b] = 1; break; } }
        }
      }
      const tB = performance.now(); this.stats.tb = (this.stats.tb || 0) + tB - tA;
      const out = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { const b = BI[k]; if (drop[b]) { out[k * 3] = sx[b] / cnt[b]; out[k * 3 + 1] = -60; out[k * 3 + 2] = sz[b] / cnt[b]; continue; } out[k * 3] = X[k]; out[k * 3 + 1] = H[k] + base[b]; out[k * 3 + 2] = Z[k]; }
      g.setAttribute('position', new THREE.BufferAttribute(out, 3));
      // normals: mesh → ECEF → local east / up / south at this tile
      if (g.attributes.normal) {
        const R = new THREE.Matrix3().set(-sl, cl, 0, cp * cl, cp * sl, sp, sp * cl, sp * sl, -cp);
        nm.getNormalMatrix(M).premultiply(R);
        const na = g.attributes.normal, no = new Float32Array(na.count * 3);
        for (let k = 0; k < na.count; k++) { nrm.fromBufferAttribute(na, k).applyMatrix3(nm).normalize(); no[k * 3] = nrm.x; no[k * 3 + 1] = nrm.y; no[k * 3 + 2] = nrm.z; }
        g.setAttribute('normal', new THREE.BufferAttribute(no, 3));
      } else g.computeVertexNormals();
      const tC = performance.now(); this.stats.tn = (this.stats.tn || 0) + tC - tB;
      g.computeBoundingBox(); g.computeBoundingSphere();
      const tD = performance.now(); this.stats.tbb = (this.stats.tbb || 0) + tD - tC;
      m.material = this.material(m.material, tile, tiles);
      this.stats.tm = (this.stats.tm || 0) + performance.now() - tD;
      m.castShadow = this.q === 'ultra'; m.receiveShadow = true; // v2.2: shadow pass over whole PLATEAU tiles cost most of the frame m.frustumCulled = true;
      this.stats.verts += n;
    }
    // identity below the tile root; the root undoes the tileset group's frame → world = game coordinates
    scene.traverse(o => { if (o === scene) return; o.matrixAutoUpdate = false; o.matrix.identity(); });
    scene.matrixAutoUpdate = false; scene.matrix.copy(inv); scene.matrixWorldNeedsUpdate = true;
    this.stats.tiles++; this.stats.ms += performance.now() - t0; this.stats.max = Math.max(this.stats.max || 0, performance.now() - t0);
  }

  // PLATEAU's own materials are glossy (roughness 0): a matte facade material with lit windows after dark
  material(old, tile, tiles) {
    const src = Array.isArray(old) ? old[0] : old;
    const map = src?.map || null; if (map) { map.anisotropy = 16; map.colorSpace = THREE.SRGBColorSpace; }
    // the facade atlases are 2048–4096 px (20–85 MB each on the GPU): scale them down off the main thread
    const cap = tile.geometricError > 0 ? Math.min(256, TEX[this.q] || 512) : (TEX[this.q] || 512), im = map?.image;
    const m0 = new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0.02 }); let pending = false;
    if (im && (im.width > cap || im.height > cap) && typeof createImageBitmap === 'function' && typeof ImageBitmap !== 'undefined' && im instanceof ImageBitmap) {
      const k = cap / Math.max(im.width, im.height), w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
      // until the small copy is back the facade stays plain (never upload the full-size atlas)
      const real = map; real.image = null; pending = true;
      resizeInWorker(im, w, h).then(bmp => {
        if (!tile.engineData.scene) { bmp.close(); return; }
        real.image = bmp; real.needsUpdate = true; try { this.renderer.initTexture(real); } catch {} m0.map = real; m0.color.set(0xffffff); m0.needsUpdate = true; // upload now, not inside a frame
        try { tiles._bytesUsed?.delete(tile); tiles.lruCache.setMemoryUsage(tile, tiles.getBytesUsed(tile)); } catch {}
      }).catch(() => {});
    }
    const m = m0; m.map = pending ? null : map; m.color.set(m.map ? 0xffffff : 0xd6d2ca);
    m.onBeforeCompile = sh => {
      sh.uniforms.uNight = this.uniforms.uNight;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uNight; varying vec3 vWP; varying vec3 vWN;\nfloat h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }')
        // v2.4: untextured (LOD1) blocks were all one pale grey — Japanese streets mix off-white, concrete, beige and brown
        // tile; flat roofs read darker. Picked per ~18 m cell so neighbouring buildings differ.
        .replace('#include <map_fragment>', `#include <map_fragment>
        #ifdef USE_MAP
        // v2.15: PLATEAU facades are oblique aerial photos — walls that were in shadow when photographed came out near
        // black. Lift the shadows (keep highlights), add a little colour back, so streets read as daylight concrete.
        {
          vec3 c0 = diffuseColor.rgb; float l0 = dot(c0, vec3(0.299, 0.587, 0.114));
          vec3 lifted = pow(c0, vec3(0.72)) * 1.05;
          diffuseColor.rgb = mix(lifted, c0, smoothstep(0.35, 0.8, l0));
          diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.333))), diffuseColor.rgb, 1.12);
        }
        #endif
        #ifndef USE_MAP
        {
          float t = h21(floor(vWP.xz / 18.0) + 0.37);
          vec3 tint = t < 0.22 ? vec3(0.96, 0.95, 0.91) : t < 0.42 ? vec3(0.80, 0.79, 0.76) : t < 0.58 ? vec3(0.86, 0.78, 0.66) : t < 0.70 ? vec3(0.66, 0.58, 0.50) : t < 0.84 ? vec3(0.74, 0.76, 0.78) : vec3(0.92, 0.88, 0.80);
          diffuseColor.rgb *= tint * (vWN.y > 0.5 ? 0.72 : 1.0);
        }
        #endif`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float wall = step(abs(vWN.y), 0.45);
          vec2 c = vec2(dot(vWP.xz, normalize(vec2(-vWN.z, vWN.x) + 1e-5)), vWP.y);
          vec2 cell = floor(c / vec2(1.8, 3.2)), f = fract(c / vec2(1.8, 3.2));
          float r = h21(cell + floor(vWP.xz / 61.0) * 7.0), r2 = h21(floor(cell / vec2(4.0, 1.0)) + 3.1);
          float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          float frame = step(0.2, f.x) * step(f.x, 0.8) * step(0.32, f.y) * step(f.y, 0.82);
          #ifdef USE_MAP
          float glass = frame * smoothstep(0.5, 0.22, lum);
          #else
          float glass = frame;
          #endif
          float on = step(0.66, r) * step(0.25, r2) * glass * wall * step(1.0, vWP.y);
          vec3 warm = mix(vec3(1.0, 0.8, 0.55), vec3(0.82, 0.9, 1.0), step(0.85, r));
          totalEmissiveRadiance += uNight * on * warm * (0.14 + 0.28 * r);
        }`);
    };
    m.customProgramCacheKey = () => 'plateau' + (m.map ? 1 : 0);
    tile.engineData.materials?.push(m);
    if (src && src !== m) { /* keep the texture alive: it is now ours */ src.map = null; src.dispose?.(); }
    return m;
  }

  // ── per frame ──
  update(focus) {
    if (!this.ready) return;
    const R = ON[this.q] || 3400;
    this.sets.forEach((S, i) => {
      if (this.failed.has(i)) return;
      const dx = Math.max(S.bb[0] - focus.x, 0, focus.x - S.bb[2]), dz = Math.max(S.bb[1] - focus.z, 0, focus.z - S.bb[3]), d = Math.hypot(dx, dz);
      if (d < R && !this.live.has(i)) this.open(i);
      else if (d > R * 1.35 && this.live.has(i)) this.close(i);
    });
    this.camera.updateMatrixWorld(); this.group.updateMatrixWorld(true);
    for (const t of this.live.values()) { t.errorTarget = (ERR[this.q] || 70) * (this.detail || 1); t.setCamera(this.camera); t.setResolutionFromRenderer(this.camera, this.renderer); t.update(); }
  }
  // tiles still on their way (downloads, parses, facade resizes) — the spawn waits for the city around the player
  busy() { let n = rwCb.size; for (const t of this.live.values()) n += t.stats.queued + t.stats.downloading + t.stats.parsing; return n; }
  // visible PLATEAU coverage at (x, z)?
  covers(x, z) {
    const row = this.data?.cov[Math.floor(z / this.data.cell)]; if (!row) return false; const i = Math.floor(x / this.data.cell);
    for (let k = 0; k < row.length; k += 3) { if (i < row[k]) return false; if (i < row[k] + row[k + 1]) return !this.failed.has(row[k + 2]); }
    return false;
  }
}
