// Texture library: CC0 PBR sets from assets/textures (manifest.json) with procedural canvas fallbacks.
// All world geometry uses UVs in METRES, so a material's texture repeat = 1 / tileSize.
import * as THREE from 'three';

const BASE = new URL('../../assets/', import.meta.url);
let manifest = null;
let anisotropy = 4;
let hiRes = false; // load 2K maps (manifest `hi`) on high/ultra
const loader = new THREE.TextureLoader();
const matCache = new Map();

export async function initTextures(renderer, quality = 'high') {
  anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), quality === 'low' ? 2 : quality === 'medium' ? 4 : quality === 'high' ? 12 : 16);
  hiRes = quality === 'high' || quality === 'ultra';
  try { const r = await fetch(new URL('textures/manifest.json', BASE)); manifest = r.ok ? await r.json() : null; } catch { manifest = null; }
}

// preferred real texture names per role (first found in manifest wins)
const ROLE = {
  asphalt: ['asphalt_fresh', 'asphalt_main', 'asphalt', 'asphalt_dark', 'asphalt_new', 'road_asphalt'],
  asphalt_worn: ['asphalt_worn', 'asphalt_old', 'asphalt_cracked', 'asphalt_patched', 'asphalt_fresh'],
  concrete: ['concrete_barrier', 'concrete_smooth', 'concrete', 'concrete_wall', 'concrete_weathered'],
  concrete_old: ['concrete_weathered', 'concrete_wall', 'concrete_old', 'concrete_smooth'],
  pavement: ['concrete_floor', 'concrete_pavement', 'concrete_tiles', 'paving_tiles', 'concrete_smooth'],
  sidewalk: ['paving_square', 'paving_small_tiles', 'interlocking_paving', 'paving_tiles', 'sidewalk'],
  metal: ['metal_galvanized', 'metal_plate', 'steel_plate', 'metal_painted', 'metal'],
  corrugated: ['metal_corrugated', 'corrugated_metal', 'corrugated_iron', 'metal_painted'],
  rust: ['metal_rusty', 'rusty_metal', 'rust'],
  plaster: ['plaster_white', 'stucco', 'plaster', 'painted_plaster', 'concrete_smooth'],
  tiles: ['facade_tiles', 'tiles', 'wall_tiles', 'floor_tiles', 'tiles_white'],
  grass: ['grass', 'grass_meadow', 'lawn'],
  gravel: ['gravel', 'dirt', 'ground_gravel'],
  sand: ['sand', 'beach_sand'],
  pier: ['concrete_formwork', 'concrete_weathered'], precast: ['concrete_precast', 'concrete_smooth'], container: ['metal_container'], boxprofile: ['metal_box_profile', 'metal_corrugated'], shutter: ['metal_shutter_painted'], parking: ['asphalt_parking', 'asphalt_patched', 'asphalt_fresh'], patched: ['asphalt_patched', 'asphalt_worn'],
  chainlink: ['fence_chainlink', 'chainlink', 'chain_link_fence', 'fence_chainlink'],
  rubber: ['rubber'], fabric: ['fabric', 'leather'], wood: ['wood_planks', 'wood'],
};

function findReal(role) {
  if (!manifest?.materials) return null;
  for (const n of ROLE[role] || [role]) if (manifest.materials[n]) return [n, manifest.materials[n]];
  // category fallback
  const cat = role.replace(/_.*/, '');
  for (const [n, m] of Object.entries(manifest.materials)) if (m.category === cat) return [n, m];
  return null;
}

function loadMap(name, map, srgb, rep) {
  const hi = hiRes && manifest?.materials?.[name]?.hi?.includes(map);
  const t = loader.load(new URL(`textures/${name}/${hi ? '2k/' : ''}${map}.jpg`, BASE).href);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(rep, rep);
  return t;
}

// opts: { color, tile (m), roughness, metalness, tint }
export function surface(role, opts = {}) {
  const key = role + JSON.stringify(opts);
  if (matCache.has(key)) return matCache.get(key);
  const real = findReal(role);
  let m;
  if (real) {
    const [name, info] = real;
    const tile = opts.tile || info.meters || 2;
    const rep = 1 / tile;
    m = new THREE.MeshStandardMaterial({
      map: loadMap(name, 'diff', true, rep),
      normalMap: info.maps?.includes('nor_gl') !== false ? loadMap(name, 'nor_gl', false, rep) : null,
      roughnessMap: info.maps?.includes('rough') !== false ? loadMap(name, 'rough', false, rep) : null,
      aoMap: info.maps?.includes('ao') ? loadMap(name, 'ao', false, rep) : null,
      color: opts.tint ?? 0xffffff, roughness: opts.roughness ?? 1, metalness: opts.metalness ?? 0,
    });
    if (opts.normalScale) m.normalScale.set(opts.normalScale, opts.normalScale);
  } else {
    const tile = opts.tile || 4;
    const t = procedural(role); t.repeat.set(1 / tile, 1 / tile);
    m = new THREE.MeshStandardMaterial({ map: t, color: opts.tint ?? 0xffffff, roughness: opts.roughness ?? 0.9, metalness: opts.metalness ?? 0 });
  }
  if (opts.polygonOffset) { m.polygonOffset = true; m.polygonOffsetFactor = -1; }
  matCache.set(key, m);
  return m;
}

// ───────── procedural fallbacks ─────────
const procCache = new Map();
function procedural(role) {
  if (procCache.has(role)) return procCache.get(role);
  const N = 512; const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  const noise = (base, amp, count, size) => { for (let i = 0; i < count; i++) { const v = base + (Math.random() - 0.5) * amp; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * N, Math.random() * N, size * Math.random() + 1, size * Math.random() + 1); } };
  switch (role.replace(/_.*/, '')) {
    case 'asphalt': g.fillStyle = '#3a3a3c'; g.fillRect(0, 0, N, N); noise(58, 50, 26000, 2.5); break;
    case 'concrete': case 'pavement': case 'plaster': g.fillStyle = '#9c9a95'; g.fillRect(0, 0, N, N); noise(156, 30, 14000, 3); break;
    case 'sidewalk': g.fillStyle = '#8e8178'; g.fillRect(0, 0, N, N); noise(140, 30, 8000, 3); g.strokeStyle = 'rgba(40,30,25,.5)'; g.lineWidth = 3;
      for (let y = 0; y < N; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(N, y); g.stroke(); for (let x = (y / 64) % 2 * 64; x < N; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } } break;
    case 'corrugated': { for (let x = 0; x < N; x++) { const v = 150 + Math.sin(x / N * Math.PI * 32) * 40; g.fillStyle = `rgb(${v},${v + 3},${v + 6})`; g.fillRect(x, 0, 1, N); } noise(150, 30, 3000, 2); break; }
    case 'grass': g.fillStyle = '#4d6a32'; g.fillRect(0, 0, N, N); for (let i = 0; i < 20000; i++) { g.fillStyle = `hsl(${80 + Math.random() * 30},40%,${20 + Math.random() * 20}%)`; g.fillRect(Math.random() * N, Math.random() * N, 1, 4); } break;
    case 'metal': case 'rust': g.fillStyle = '#80868c'; g.fillRect(0, 0, N, N); noise(130, 30, 8000, 2); break;
    case 'chainlink': g.clearRect(0, 0, N, N); g.strokeStyle = '#9aa0a4'; g.lineWidth = 4; for (let i = -N; i < N * 2; i += 48) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + N, N); g.stroke(); g.beginPath(); g.moveTo(i, N); g.lineTo(i + N, 0); g.stroke(); } break;
    default: g.fillStyle = '#888'; g.fillRect(0, 0, N, N); noise(136, 30, 8000, 2);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anisotropy;
  procCache.set(role, t);
  return t;
}

// Chain-link fence material (alpha-tested)
export function chainlinkMaterial() {
  if (matCache.has('chainlink-fence')) return matCache.get('chainlink-fence');
  let m;
  const real = manifest?.materials?.fence_chainlink;
  if (real) {
    const rep = 1 / (real.meters || 1.5);
    m = new THREE.MeshStandardMaterial({ map: loadMap('fence_chainlink', 'diff', true, rep), alphaMap: loadMap('fence_chainlink', 'opacity', false, rep), normalMap: loadMap('fence_chainlink', 'nor_gl', false, rep), alphaTest: 0.45, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.45 });
  } else {
    const t = procedural('chainlink'); t.repeat.set(1 / 1.2, 1 / 1.2);
    m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.4, transparent: false, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.5, color: 0xb8bcc0 });
  }
  matCache.set('chainlink-fence', m);
  return m;
}

// Night-window facade texture for distant buildings (emissive)
export function windowTexture(seed = 1, lit = 0.35, cols = 8, rows = 24, warm = true) {
  const key = `win${seed}_${lit}_${cols}_${rows}_${warm}`;
  if (procCache.has(key)) return procCache.get(key);
  const c = document.createElement('canvas'); c.width = cols * 16; c.height = rows * 16;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (rnd() < lit) { const k = 0.5 + rnd() * 0.5; g.fillStyle = warm && rnd() < 0.6 ? `rgba(255,${200 + rnd() * 40 | 0},${130 + rnd() * 60 | 0},${k})` : `rgba(${200 + rnd() * 50 | 0},${225 + rnd() * 30 | 0},255,${k})`; g.fillRect(x * 16 + 3, y * 16 + 4, 10, 8); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  procCache.set(key, t);
  return t;
}

// radial glow sprite texture (light pools, lamp halos)
export function glowTexture() {
  if (procCache.has('glow')) return procCache.get('glow');
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); procCache.set('glow', t); return t;
}

export function hdriList() { return manifest?.hdri || {}; }
export const assetURL = p => new URL(p.replace(/^assets\//, ''), BASE).href;

// ───────── weathering (aged Tokyo concrete & facades) ─────────
// Adds world-space grime to any MeshStandardMaterial: vertical rain streaks running down from ledges, damp dark bases,
// soot blotches and a faint rust-brown tint. No extra textures — pure shader, so it costs nothing to load.
export function weather(mat, amt = 1) {
  if (!mat || mat.userData.weathered) return mat;
  mat.userData.weathered = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    prev?.call(mat, sh, r);
    sh.uniforms.uAge = { value: amt };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vAgeW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 aw = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        aw = instanceMatrix * aw;
      #endif
        vAgeW = (modelMatrix * aw).xyz; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vAgeW; uniform float uAge;
      float ahash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float anoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(ahash(i), ahash(i + vec2(1, 0)), f.x), mix(ahash(i + vec2(0, 1)), ahash(i + vec2(1, 1)), f.x), f.y); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      { vec3 w = vAgeW; float hz = w.x + w.z;
        float streak = anoise(vec2(hz * 1.7, w.y * 0.04)) * anoise(vec2(hz * 0.35, w.y * 0.015 + 3.1));   // long vertical runs
        float blot = anoise(w.xz * 0.045 + w.y * 0.03) * 0.6 + anoise(vec2(hz, w.y) * 0.21) * 0.4;     // soot / patch repairs
        float base = 1.0 - smoothstep(0.0, 2.2, w.y);                                                   // damp splash zone
        float g = clamp(streak * 1.25 + base * 0.55 + (blot - 0.45) * 0.5, 0.0, 1.0) * uAge;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.66, 0.63, 0.58), g);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.04, 0.96, 0.86), smoothstep(0.62, 0.9, blot) * 0.35 * uAge); }`);
  };
  const key = mat.customProgramCacheKey?.bind(mat);
  mat.customProgramCacheKey = () => (key ? key() : '') + '|age';
  mat.needsUpdate = true;
  return mat;
}
