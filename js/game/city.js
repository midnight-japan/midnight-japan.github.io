// Streamed real city: every building, street, railway, river and park around the expressways from OpenStreetMap
// (data/city/*.json, built by tools/osm-city-build.mjs), turned into Japanese architecture by js/game/city-worker.js.
// Tiles (1 km) stream in around the player at three levels of detail; colliders, river banks and street lamps
// come with them. Facade windows, night lights and traffic-signal cycles are drawn by shaders, so a whole tile is a
// handful of draw calls. Map data © OpenStreetMap contributors (ODbL 1.0).
import * as THREE from 'three';
import { surface, weather } from './textures.js';
import { MAP } from './roads.js';

const TILE = 1000;
const DIST = { low: [380, 950, 2200], medium: [520, 1300, 3200], high: [650, 1600, 4200], ultra: [850, 2000, 5200] };

// ── shop sign atlas (fictional names) ──
const SIGNS = [
  ['居酒屋 まるよし', '#7a1a12', '#fff3d6'], ['ラーメン 龍豚', '#c81e1e', '#fff'], ['歯科クリニック', '#f4f8fb', '#1b5fa8'], ['不動産 アーバンホーム', '#0f5a3a', '#fff'],
  ['カラオケ 歌宴', '#2a0f5e', '#ffd84a'], ['クリーニング', '#e9f4ff', '#1665c2'], ['薬 ドラッグ・ミナト', '#fff7d0', '#d4291a'], ['美容室 HAIR NOA', '#1d1d1d', '#e9e2d0'],
  ['そば・うどん 松庵', '#2b2118', '#f2e3c4'], ['焼肉 牛匠', '#1a1a1a', '#ff6b2c'], ['すし 浜寿司', '#0c2f55', '#fff'], ['コインランドリー', '#00a0e0', '#fff'],
  ['学習塾 未来ゼミ', '#fff', '#e0281e'], ['整骨院', '#e8fff1', '#138a4a'], ['CAFE 港灯', '#3a2a1e', '#f4d9a8'], ['中華料理 福来', '#c41010', '#ffe17a'],
  ['とんかつ かつ栄', '#f6efe0', '#3b2412'], ['牛丼 ほし家', '#f39800', '#fff'], ['スナック 夜曲', '#4a0d3a', '#ff9de6'], ['BAR NIGHT HARBOR', '#0b0b0b', '#59d6ff'],
  ['弁当 ほかほか亭', '#ffe500', '#d42b1a'], ['花 フラワー宮', '#fff0f5', '#c2185b'], ['書店 文港堂', '#103b2a', '#f1e7c8'], ['サイクル 鶴見', '#ffffff', '#00468b'],
  ['タイヤ館', '#ffd400', '#111'], ['自動車整備 KEIHIN', '#1a3d7c', '#fff'], ['眼鏡 オプティカ', '#fafafa', '#222'], ['酒 リカーショップ', '#6b0f1a', '#fff'],
  ['内科・小児科', '#fff', '#0b7a3e'], ['ゲームセンター', '#111', '#ff3df0'], ['マッサージ', '#fff6e8', '#9b5b14'], ['ホテル ベイサイド', '#0a2342', '#e8c66a'],
  ['定食 みなと食堂', '#efe4cf', '#5a2e0e'], ['パン工房 こむぎ', '#fff4e0', '#b0601a'], ['精肉 たかはし', '#b21e1e', '#fff'], ['鮮魚 魚よし', '#0b4f7a', '#fff'],
  ['ゴルフ練習場', '#0e6b2e', '#fff'], ['質 ブランド買取', '#000', '#ffcc00'], ['テイクアウト 餃子', '#fff', '#c81e1e'], ['ネットカフェ', '#202a44', '#4ff0ff'],
  ['月極駐車場', '#ffffff', '#1d4ed8'], ['P 24時間', '#1d4ed8', '#fff'], ['たばこ', '#e9e9e9', '#a01414'], ['クリニック', '#f0f7ff', '#0a58ca'],
  ['焼鳥 とりまさ', '#2a1408', '#ffb066'], ['ステーキ 港', '#2b0e0e', '#ffdfb0'], ['カレー インド亭', '#f4a300', '#3b1f00'], ['ドーナツ', '#ffe3ef', '#d01c6c'],
  ['リサイクル', '#0b7a3e', '#fff'], ['塗装 鈴木工業', '#fff', '#333'], ['司法書士事務所', '#f6f6f2', '#202020'], ['保険 ほけん窓口', '#fff', '#e4007f'],
  ['ペットサロン', '#fff8e1', '#8d6e63'], ['ネイル', '#2b2b2b', '#ffc0cb'], ['餃子の満洲屋', '#fff', '#00843d'], ['うなぎ 川松', '#1f140c', '#f0d29a'],
  ['ハンバーガー', '#c8102e', '#ffc72c'], ['回転寿司', '#ffffff', '#e60012'], ['24H フィットネス', '#111', '#ff7a00'], ['写真館', '#efe9df', '#333'],
  ['銭湯 鶴乃湯', '#2d2a6e', '#fff'], ['喫茶 港', '#3d2b1f', '#f5e1c0'], ['酒場 浜っ子', '#5a0b0b', '#ffd27a'], ['ガソリン', '#d40000', '#fff'],
];
const BRANDS = [['LAWSUN', '#0b5fb8', '#fff'], ['HAPPY MART', '#169a4b', '#fff'], ['YOUR MART', '#ef6c00', '#fff']];
function makeAtlas() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 2048; const g = c.getContext('2d');
  const font = (px, w = 800) => `${w} ${px}px "Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP","Meiryo",sans-serif`;
  // horizontal cells 256×64: 0..63 shops, 64..66 brands
  const H = (k, text, bg, fg) => {
    const x = (k % 8) * 256, y = Math.floor(k / 8) * 64;
    g.fillStyle = bg; g.fillRect(x, y, 256, 64); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, 256, 6);
    g.fillStyle = fg; let px = 40; g.font = font(px); while (g.measureText(text).width > 236 && px > 14) { px -= 2; g.font = font(px); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + 128, y + 34);
  };
  SIGNS.forEach(([t, bg, fg], k) => H(k, t, bg, fg));
  BRANDS.forEach(([t, bg, fg], k) => { H(64 + k, t, bg, fg); });
  // vertical cells 64×256 in the lower half: same shops, text top-to-bottom
  SIGNS.forEach(([t, bg, fg], k) => {
    const x = (k % 32) * 64, y = 1024 + Math.floor(k / 32) * 256;
    g.fillStyle = bg; g.fillRect(x, y, 64, 256); g.fillStyle = fg; g.strokeStyle = fg; g.lineWidth = 3; g.strokeRect(x + 4, y + 4, 56, 248);
    const chars = [...t.replace(/[ ・]/g, '')].slice(0, 6); const step = Math.min(40, 236 / chars.length);
    g.font = font(Math.min(40, step - 2)); g.textAlign = 'center'; g.textBaseline = 'middle';
    chars.forEach((ch, i) => g.fillText(ch, x + 32, y + 14 + step * (i + 0.5)));
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true;
  return t;
}
const atlasRect = (idx, style) => {
  if (style === 1) { const k = idx % SIGNS.length; return [(k % 32) * 64 / 2048, 1 - (1024 + Math.floor(k / 32) * 256 + 256) / 2048, 64 / 2048, 256 / 2048]; }
  const k = style >= 3 ? 64 + (idx % 3) : idx % SIGNS.length;
  return [(k % 8) * 256 / 2048, 1 - (Math.floor(k / 8) * 64 + 64) / 2048, 256 / 2048, 64 / 2048];
};

// ── facade shader: windows, balconies' glass, shopfronts, night lights, roof tiles, grime ──
function buildingMaterial(uniforms) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.0 });
  const plaster = surface('plaster', { tile: 3 });
  if (plaster.normalMap) { m.normalMap = plaster.normalMap; m.normalScale = new THREE.Vector2(0.35, 0.35); }
  m.onBeforeCompile = sh => {
    sh.uniforms.uNight = uniforms.uNight; sh.uniforms.uTime = uniforms.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aInfo; varying vec4 vInfo; varying vec2 vUvM; varying float vNy; varying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvInfo = aInfo; vUvM = uv; vNy = normal.y; vWPos = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uNight; uniform float uTime; varying vec4 vInfo; varying vec2 vUvM; varying float vNy; varying vec3 vWPos;
        float chash(vec2 p) { return fract(sin(dot(p, vec2(41.37, 289.13))) * 43758.5453); }
        float cnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(chash(i), chash(i+vec2(1,0)), f.x), mix(chash(i+vec2(0,1)), chash(i+vec2(1,1)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float gMask = 0.0; vec3 gEmit = vec3(0.0); float gRough = -1.0; float gMetal = -1.0;
        {
          float kind = floor(vInfo.x + 0.5); float seed = vInfo.y; float fh = max(vInfo.z, 2.5);
          vec2 m = vUvM; bool wall = abs(vNy) < 0.5;
          float floorI = floor(m.y / fh); float fy = fract(m.y / fh);
          // window grid per building class: spacing, width, sill & head (fractions of the floor)
          float sx = 3.4, ww = 1.4, y0 = 0.36, y1 = 0.8, skip = 0.3, lit = 0.42; vec3 warm = vec3(1.0, 0.82, 0.55);
          bool grid = wall && kind < 29.5;
          if (kind < 0.5) { sx = 2.9; ww = seed < 0.5 ? 1.65 : 1.3; y0 = 0.34; y1 = 0.8; skip = 0.32; }                                        // house
          else if (kind < 1.5) { sx = 3.6; ww = 2.7; y0 = 0.06; y1 = 0.8; skip = 0.08; lit = 0.5; }   // mansion (balcony doors)
          else if (kind < 2.5 || kind > 8.5 && kind < 9.5) { sx = 3.0; ww = 2.3; y0 = 0.22; y1 = 0.86; skip = 0.12; lit = 0.55; warm = vec3(0.92, 0.95, 1.0); } // shops / station
          else if (kind < 3.5) { sx = 4.2; ww = 3.0; y0 = 0.62; y1 = 0.8; skip = 0.55; lit = 0.5; warm = vec3(0.85, 0.95, 1.0); } // factory
          else if (kind < 4.5 || kind > 9.5 && kind < 10.5) { sx = 3.8; ww = 3.1; y0 = 0.3; y1 = 0.86; skip = 0.05; lit = 0.3; warm = vec3(0.9, 0.96, 1.0); } // school / hospital
          else if (kind < 5.5) grid = false;                                                         // temple
          else if (kind < 6.5 || kind > 13.5 && kind < 14.5) { sx = 1.8; ww = 1.62; y0 = 0.1; y1 = 0.93; skip = 0.0; lit = 0.55; warm = vec3(0.86, 0.93, 1.0); } // office / tower
          else if (kind < 7.5) { sx = 3.0; ww = 0.9; skip = 0.6; }                                    // shed
          else if (kind < 8.5) grid = false;                                                          // tank
          else if (kind > 10.5 && kind < 11.5) { sx = 2.6; ww = 1.5; y0 = 0.25; y1 = 0.85; skip = 0.0; lit = 0.6; } // hotel
          else if (kind > 11.5 && kind < 12.5) grid = false;                                          // konbini (own front)
          else if (kind > 12.5 && kind < 13.5) { sx = 1e3; ww = 1e3; y0 = 0.38; y1 = 0.92; skip = 0.0; lit = 0.9; warm = vec3(0.95, 0.97, 1.0); } // car park
          else if (kind > 14.5 && kind < 15.5) grid = false;                                          // warehouse
          else if (kind > 16.5 && kind < 17.5) { sx = 4.6; ww = 1.5; y0 = 0.25; y1 = 0.82; skip = 0.0; lit = 0.7; warm = vec3(1.0, 0.8, 0.5); } // brick warehouse
          // wall finish: lap siding (houses), small mosaic tiles (mansions), spandrels (offices)
          if (wall && kind < 0.5) { float sd = seed < 0.5 ? 0.24 : 0.42; float ln = smoothstep(0.0, 0.025, fract(m.y / sd)) ; diffuseColor.rgb *= 0.9 + 0.1 * ln; diffuseColor.rgb *= 1.0 - 0.06 * step(0.985, fract(m.x / 1.82)); if (seed > 0.7) diffuseColor.rgb *= mix(1.0, 0.82, step(fh, m.y)); }
          if (wall && (kind > 0.5 && kind < 1.5 || kind > 10.5 && kind < 11.5)) { vec2 tl = fract(m * vec2(1.0 / 0.227, 1.0 / 0.06)); diffuseColor.rgb *= 0.93 + 0.07 * step(0.06, tl.x) * step(0.12, tl.y); }
          vec3 baseD = diffuseColor.rgb;
          if (grid) {
            float cx = floor(m.x / sx); float fx = m.x - cx * sx;
            float h = chash(vec2(cx + seed * 91.7, floorI + seed * 13.1));
            float h2 = chash(vec2(cx * 1.7 + seed * 5.3, floorI * 2.3 + 1.0));
            float wwi = ww, yy0 = y0, yy1 = y1;
            bool small = false;
            if (kind < 0.5 && h2 < 0.3) { wwi = 0.6; yy0 = 0.55; yy1 = 0.8; small = true; }          // bathroom / toilet window
            bool isWin = abs(fx - sx * 0.5) < wwi * 0.5 && fy > yy0 && fy < yy1 && h > skip && m.y > 0.4;
            // ground floor of shops / offices: tall glazing
            if ((kind > 1.5 && kind < 2.5 || kind > 13.5 && kind < 14.5 || kind > 5.5 && kind < 6.5 || kind > 10.5 && kind < 11.5) && floorI < 0.5) { isWin = abs(fx - sx * 0.5) < sx * 0.45 && fy > 0.05 && fy < 0.9; yy0 = 0.05; yy1 = 0.9; wwi = sx * 0.9; }
            // office spandrels (dark metal bands between glass rows)
            if (!isWin && (kind > 5.5 && kind < 6.5 || kind > 13.5 && kind < 14.5) && floorI > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.55 + vec3(0.03), 0.6);
            // amado shutter box above house windows
            if (kind < 0.5 && !small && abs(fx - sx * 0.5) < wwi * 0.5 + 0.08 && fy > yy1 && fy < yy1 + 0.07 && h > skip && h2 > 0.55) diffuseColor.rgb *= 0.7;
            if (isWin) {
              float lx = fx - (sx - wwi) * 0.5, ly = (fy - yy0) * fh;              // metres inside the opening
              float W = wwi, Hh = (yy1 - yy0) * fh;
              float fr = 0.055;
              float frame = 1.0 - step(fr, lx) * step(lx, W - fr) * step(fr, ly) * step(ly, Hh - fr);
              float sash = (kind < 1.5 && !small) ? 1.0 - smoothstep(0.0, 0.025, abs(lx - W * 0.5)) : 0.0;       // sliding sash meeting rail
              float mull = (kind > 5.5 && kind < 6.5 || kind > 13.5 && kind < 14.5) ? 0.0 : 0.0;
              float f = clamp(frame + sash + mull, 0.0, 1.0);
              gMask = 1.0;
              vec3 alu = vec3(0.72, 0.73, 0.74) * (0.9 + 0.1 * chash(vec2(seed, 2.0)));
              if (seed > 0.65) alu = vec3(0.32, 0.27, 0.22);                       // bronze frames
              // glass: dark, reflective; curtains or blinds behind some panes; frosted small windows
              float cur = step(0.45, chash(vec2(cx * 2.1, floorI + seed * 4.0)));
              vec3 curC = mix(vec3(0.82, 0.78, 0.68), vec3(0.62, 0.68, 0.74), chash(vec2(cx, floorI * 3.0) + seed));
              float curMask = cur * smoothstep(0.0, 0.6, abs(fract(lx / max(W, 0.1) * 2.0) - 0.5) * 2.0 + 0.4);
              vec3 glass = mix(vec3(0.16, 0.19, 0.22) + vec3(0.1, 0.12, 0.14) * (ly / max(Hh, 0.1)) + 0.06 * chash(vec2(cx, floorI) + seed), curC * 0.55, curMask * 0.6);
              if (small) glass = vec3(0.55, 0.58, 0.6);
              diffuseColor.rgb = mix(glass, alu, f);
              gRough = mix(small ? 0.35 : 0.08, 0.35, f); gMetal = mix(small ? 0.0 : 0.3, 0.6, f);
              float on = step(1.0 - lit, chash(vec2(cx * 3.1 + seed * 7.0, floorI * 1.7 + 0.3)));
              float tint = chash(vec2(cx, floorI * 5.3) + seed * 3.0);
              vec3 lc = mix(warm, tint < 0.5 ? vec3(1.0, 0.78, 0.5) : vec3(0.82, 0.9, 1.0), 0.35);
              lc = mix(lc, curC * vec3(1.15, 1.0, 0.85), curMask * 0.6);                // light through curtains
              lc *= 0.6 + 0.4 * cnoise(vec2(lx * 1.3, ly * 2.0) + cx);
              gEmit = lc * on * (1.0 - f) * uNight * (0.55 + 0.6 * chash(vec2(floorI, cx * 0.37) + seed));
            } else if (kind > 0.5 && kind < 1.5 || kind > 13.5 && kind < 14.5 || kind > 5.5 && kind < 6.5) {
              float slab = 1.0 - smoothstep(0.0, 0.05, abs(fy - 0.97));
              diffuseColor.rgb *= 1.0 - slab * 0.18;
            }
            // far away the window grid is smaller than a pixel: fade to its average instead of shimmering noise
            float aa = clamp(max(fwidth(m.x) / sx, fwidth(m.y) / fh) * 1.6 - 0.55, 0.0, 1.0);
            if (aa > 0.0) {
              float cover = min(1.0, ww / sx) * (y1 - y0) * (1.0 - skip);
              vec3 avgD = mix(baseD, vec3(0.12, 0.14, 0.17), cover);
              float blk = chash(floor(vec2(m.x / (sx * 3.0), m.y / (fh * 2.0))) + seed * 11.0);
              vec3 avgE = warm * lit * cover * uNight * 0.42 * (0.25 + 1.5 * blk * blk);
              diffuseColor.rgb = mix(diffuseColor.rgb, avgD, aa); gEmit = mix(gEmit, avgE, aa);
              gRough = mix(gRough < 0.0 ? 0.88 : gRough, 0.6, aa); gMetal = mix(gMetal < 0.0 ? 0.0 : gMetal, 0.1, aa);
            }
          }
          if (wall && (kind > 14.5 && kind < 15.5 || kind > 34.5 || kind > 2.5 && kind < 3.5)) {
            // corrugated / ribbed cladding
            float rib = 0.5 + 0.5 * sin(m.x * 6.283 / 0.25);
            diffuseColor.rgb *= 0.9 + rib * 0.12;
          }
          if (wall && kind > 16.5 && kind < 17.5) { // red brick (Flemish bond) with pale stone bands
            vec2 bk = m / vec2(0.23, 0.075); bk.x += 0.5 * mod(floor(bk.y), 2.0);
            float mortar = step(0.08, fract(bk.x)) * step(0.14, fract(bk.y));
            diffuseColor.rgb *= mix(0.62, 0.95 + 0.1 * chash(floor(bk)), mortar);
            if (fract(m.y / fh) > 0.93) diffuseColor.rgb = vec3(0.78, 0.74, 0.66);
          }
          if (kind > 30.5 && kind < 31.5) { // roof tiles (kawara): courses along the slope + seams
            float course = smoothstep(0.0, 0.08, fract(m.y / 0.3)); float seam = smoothstep(0.0, 0.05, abs(fract(m.x / 0.28) - 0.5));
            diffuseColor.rgb *= 0.72 + 0.28 * course * (0.85 + 0.15 * seam);
            diffuseColor.rgb *= 0.9 + 0.2 * chash(floor(vec2(m.x / 0.28, m.y / 0.3)) + seed);
            gRough = 0.55;
          }
          if (kind > 31.5 && kind < 32.5) { diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.38, 0.42), 0.6); gRough = 0.12; } // glass balustrade
          if (kind > 32.5 && kind < 33.5) { // shopfront glazing, lit interior
            float mull = step(0.06, abs(fract(m.x / 2.2) - 0.5) * 2.2 - 0.0);
            float door = step(m.y, 2.4);
            vec3 inside = mix(vec3(1.0, 0.86, 0.62), vec3(0.9, 0.95, 1.0), chash(vec2(seed * 17.0, 3.0)));
            diffuseColor.rgb = mix(vec3(0.2), vec3(0.08, 0.09, 0.1), mull);
            gRough = 0.08; gMetal = 0.3; gEmit = inside * mull * door * (0.35 + uNight * 1.8) * (0.7 + 0.3 * cnoise(m * 0.7));
          }
          if (kind > 33.5 && kind < 34.5) { // konbini: floor-to-ceiling glass, bright fluorescent interior all night
            float mull = step(0.05, abs(fract(m.x / 1.8) - 0.5) * 1.8);
            diffuseColor.rgb = mix(vec3(0.85), vec3(0.1), mull);
            float shelves = 0.75 + 0.25 * step(0.5, fract(m.y * 2.4));
            gRough = 0.06; gEmit = vec3(0.95, 0.98, 1.0) * mull * (0.9 + uNight * 2.4) * shelves;
          }
          // grime: damp base, rain streaks under the roof line
          if (wall && kind < 32.5) {
            float base = 1.0 - smoothstep(0.0, 1.6, m.y);
            float streak = cnoise(vec2(vWPos.x * 1.3 + vWPos.z * 1.3, m.y * 0.06)) * cnoise(vec2((vWPos.x + vWPos.z) * 0.31, 1.7));
            diffuseColor.rgb *= 1.0 - (base * 0.14 + streak * 0.16) * (1.0 - gMask);
          }
          if (!wall && kind < 29.5) diffuseColor.rgb *= 0.86 + 0.14 * cnoise(vWPos.xz * 0.2);
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nif (gRough >= 0.0) roughnessFactor = gRough;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nif (gMetal >= 0.0) metalnessFactor = gMetal;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gEmit;');
  };
  m.customProgramCacheKey = () => 'mj-city-bld';
  return m;
}
function glowMaterial(uniforms) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.0 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uNight = uniforms.uNight; sh.uniforms.uTime = uniforms.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aInfo; varying vec4 vInfo;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvInfo = aInfo;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uNight; uniform float uTime; varying vec4 vInfo;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float k = floor(vInfo.x + 0.5); float e = 0.0; vec3 c = vColor.rgb;
          if (k < 1.5) e = uNight * 3.2;
          else if (k < 2.5) e = 0.25 + uNight * 1.4;
          else if (k < 3.5) e = 0.7 + uNight * 1.6;
          else if (k < 4.5) e = 0.6 + uNight * 1.5;
          else if (k < 5.5) e = step(fract(uTime / 1.5), 0.4) * (0.5 + uNight * 4.0);
          else if (k > 9.5 && k < 16.5) {
            float t = mod(uTime + vInfo.y, 60.0); if (vInfo.z > 0.5) t = mod(t + 30.0, 60.0);
            float slot = k - 10.0;
            float on = slot < 0.5 ? step(t, 25.0) : slot < 1.5 ? step(25.0, t) * step(t, 28.0) : slot < 2.5 ? step(28.0, t) : 0.0;
            float to = mod(t + 30.0, 60.0); // the crossing traffic's clock: pedestrians here walk while it is green
            if (slot > 4.5 && slot < 5.5) on = 1.0 - step(to, 22.0);
            if (slot > 5.5) on = step(to, 18.0) + step(18.0, to) * step(to, 22.0) * step(0.5, fract(uTime * 2.0));
            e = on * (1.6 + uNight * 2.2);
          }
          diffuseColor.rgb = c * 0.18;
          totalEmissiveRadiance += c * e; }`);
  };
  m.customProgramCacheKey = () => 'mj-city-glow';
  return m;
}

// ── trees (3 variants: broadleaf, street tree, pine) ──
function treeGeometry(kind) {
  // foliage = a few soft, displaced icospheres with smooth normals (indexed → no faceting) + vertex-colour AO
  const parts = [];
  const finish = (g, c, jitter, ao) => {
    g = g.index ? g : g; const p = g.attributes.position; const n = p.count; const col = new Float32Array(n * 3);
    let y0 = 1e9, y1 = -1e9; for (let i = 0; i < n; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); }
    for (let i = 0; i < n; i++) { const h = (p.getY(i) - y0) / Math.max(0.01, y1 - y0); const k = (1 + (Math.random() - 0.5) * jitter) * (ao ? 0.62 + 0.45 * h : 1); col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
  };
  const blob = (r, detail, amt) => {
    const g = new THREE.IcosahedronGeometry(r, detail); const m = BufferGeometryMerge(g); const p = m.attributes.position;
    const seed = Math.random() * 10;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + amt * (Math.sin(x * 2.1 + seed) * Math.sin(y * 2.7 + seed * 1.3) * Math.sin(z * 2.3 + seed * 0.7)); p.setXYZ(i, x * f, y * f * 0.85, z * f); }
    m.computeVertexNormals(); return m;
  };
  const trunk = (h, r) => { const g = new THREE.CylinderGeometry(r * 0.7, r, h, 7); g.translate(0, h / 2, 0); return finish(g, [0.3, 0.24, 0.19], 0.15, false); };
  if (kind === 3) { // distant tree: one blob
    parts.push(trunk(3, 0.25)); const g = blob(2.6, 1, 0.25); g.translate(0, 4.6, 0); parts.push(finish(g, [0.26, 0.38, 0.18], 0.2, true));
  } else if (kind === 2) { // black pine (kuromatsu)
    parts.push(trunk(5.5, 0.22));
    for (let k = 0; k < 4; k++) { const g = blob(1.5 - k * 0.12, 1, 0.3); g.scale(1.45, 0.5, 1.45); g.translate((Math.random() - 0.5) * 1.4, 3.4 + k * 1.15, (Math.random() - 0.5) * 1.4); parts.push(finish(g, [0.17, 0.29, 0.17], 0.25, true)); }
  } else {
    const h = kind === 1 ? 4.2 : 3.2; parts.push(trunk(h, kind === 1 ? 0.18 : 0.24));
    const blobs = kind === 1 ? [[0, 5.3, 0, 1.9], [0.5, 6.7, 0.2, 1.45], [-0.4, 4.7, 0.8, 1.35]] : [[0, 4.6, 0, 2.3], [1.4, 4.3, 0.4, 1.6], [-1.2, 4.5, -0.6, 1.7], [0.2, 5.9, -0.3, 1.5]];
    const base = kind === 1 ? [0.3, 0.42, 0.18] : [0.24, 0.37, 0.16];
    for (const [x, y, z, r] of blobs) { const g = blob(r, 1, 0.28); g.translate(x, y, z); parts.push(finish(g, base, 0.18, true)); }
  }
  return mergeSimple(parts.map(g => g.index ? g.toNonIndexed() : g));
}
// icosahedron → indexed (shared vertices) so displacement keeps it closed and normals are smooth
function BufferGeometryMerge(g) {
  const p = g.attributes.position, map = new Map(), pos = [], idx = [];
  for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`; let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(p.getX(i), p.getY(i), p.getZ(i)); } idx.push(j); }
  const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setIndex(idx); return o;
}
function mergeSimple(geos) {
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export class City {
  constructor(world, scene, quality) {
    this.world = world; this.scene = scene; this.q = quality;
    this.R = DIST[quality] || DIST.high;
    this.group = new THREE.Group(); this.group.name = 'city'; scene.add(this.group);
    this.tiles = new Map();        // key → { i, j, lod, want, group, cols, lamps, water, bridges, pending }
    this.index = null; this.ready = false;
    this.uniforms = { uNight: { value: 1 }, uTime: { value: 0 } };
    this.cgrid = new Map(); this.CG = 32;   // collider grid
    this.wgrid = new Map(); this.WG = 50;   // water grid
    this.queue = []; this.busy = 0; this.reqId = 0; this.cb = new Map();
    this.net = new CityNet(this);
  }
  async init() {
    try { const r = await fetch(new URL('../../data/city/index.json', import.meta.url)); if (!r.ok) return false; this.index = await r.json(); } catch { return false; }
    this.has = new Set(this.index.tiles.map(([i, j]) => i + '_' + j));
    const nW = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 4) - 2));
    this.workers = [];
    for (let k = 0; k < nW; k++) {
      const w = new Worker(new URL('./city-worker.js', import.meta.url), { type: 'module' });
      w.onmessage = ev => { const d = ev.data; const f = this.cb.get(d.id); this.cb.delete(d.id); w.busy = false; this.busy--; f?.(d); this.pump(); };
      w.onerror = e => { console.warn('city worker', e.message); w.busy = false; this.busy = Math.max(0, this.busy - 1); };
      w.postMessage({ land: MAP.land.filter(l => !l.main && l.name !== '海ほたるPA').map(l => l.pts) });
      this.workers.push(w);
    }
    // materials
    const U = this.uniforms;
    this.mBld = buildingMaterial(U);
    this.mProp = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.25 });
    this.mGlow = glowMaterial(U);
    this.atlas = makeAtlas();
    this.mSign = new THREE.MeshStandardMaterial({ map: this.atlas, emissiveMap: this.atlas, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.5 });
    const road = surface('asphalt_worn', { tile: 6 });
    this.mRoad = road.clone(); this.mRoad.vertexColors = true; this.mRoad.polygonOffset = true; this.mRoad.polygonOffsetFactor = -1; this.mRoad.polygonOffsetUnits = -1;
    const walk = surface('sidewalk', { tile: 1.6, tint: 0xb5aba3 });
    this.mWalk = walk.clone(); this.mWalk.vertexColors = true; this.mWalk.polygonOffset = true; this.mWalk.polygonOffsetFactor = -0.5; this.mWalk.polygonOffsetUnits = -0.5;
    this.mPaint = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.mWire = new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.85 });
    const g = (role, tile, tint) => { const s = surface(role, { tile, tint }); const m = s.clone(); m.polygonOffset = true; m.polygonOffsetFactor = -0.5; m.polygonOffsetUnits = -0.5; return m; };
    const water = new THREE.MeshStandardMaterial({ color: 0x0d2230, roughness: 0.12, metalness: 0.2, envMapIntensity: 0.5 });
    if (this.world.sea?.material.normalMap) { water.normalMap = this.world.sea.material.normalMap; water.normalScale = new THREE.Vector2(0.25, 0.25); }
    this.mGround = { 0: g('grass', 3, 0x9fb27a), 1: g('concrete_old', 5, 0xb0b0ac), 2: g('gravel', 3, 0xc7b08a), 3: water, 4: g('parking', 5, 0xffffff), 5: g('pavement', 4, 0xffffff), 6: g('pavement', 4, 0xffffff), 7: g('gravel', 2, 0x9a948c), 8: g('concrete_old', 5, 0xa8a8a4), 9: g('sand', 3, 0xffffff), 10: g('grass', 3, 0x6f8a52), 11: g('grass', 2.5, 0x9cc070) };
    this.mLand = surface('concrete', { tile: 6, tint: 0xc9c6bf });
    this.treeGeo = [0, 1, 2, 3].map(treeGeometry);
    this.mTree = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    weather(this.mProp, 0.5);
    this.ready = true;
    return true;
  }

  // ── streaming ──
  update(dt, focus, night) {
    if (!this.ready) return;
    this.uniforms.uTime.value += dt; this.uniforms.uNight.value = night;
    this.mSign.emissiveIntensity = 0.25 + night * 1.6;
    this._t = (this._t || 0) - dt; if (this._t > 0) return; this._t = 0.25;
    const [R0, R1, R2] = this.R; const fx = focus.x, fz = focus.z;
    const want = new Map();
    const i0 = Math.floor((fx - R2) / TILE), i1 = Math.floor((fx + R2) / TILE), j0 = Math.floor((fz - R2) / TILE), j1 = Math.floor((fz + R2) / TILE);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const k = i + '_' + j; if (!this.has.has(k)) continue;
      const dx = Math.max(i * TILE - fx, 0, fx - (i + 1) * TILE), dz = Math.max(j * TILE - fz, 0, fz - (j + 1) * TILE); const d = Math.hypot(dx, dz);
      const lod = d < R0 ? 0 : d < R1 ? 1 : d < R2 ? 2 : -1; if (lod < 0) continue;
      want.set(k, { i, j, lod, d });
    }
    // unload
    for (const [k, t] of this.tiles) if (!want.has(k)) this.unload(k);
    // (re)build where the LOD changed (hysteresis: only rebuild to a coarser LOD when 15 % beyond the radius)
    for (const [k, w] of want) {
      const t = this.tiles.get(k);
      if (t && (t.lod === w.lod || t.pending === w.lod)) continue;
      if (t && w.lod > t.lod && w.d < this.R[t.lod] * 1.15) continue;
      this.request(k, w);
    }
    this.queue.sort((a, b) => a.lod - b.lod || a.d - b.d);
    this.pump();
  }
  request(k, w) {
    let t = this.tiles.get(k); if (!t) this.tiles.set(k, t = { i: w.i, j: w.j, lod: -1, group: null });
    t.pending = w.lod;
    const q = this.queue.find(e => e.k === k); if (q) { q.lod = w.lod; q.d = w.d; return; }
    this.queue.push({ k, lod: w.lod, d: w.d });
  }
  pump() {
    for (const w of this.workers) {
      if (w.busy || !this.queue.length) continue;
      const job = this.queue.shift(); const t = this.tiles.get(job.k); if (!t || t.pending !== job.lod) continue;
      const id = ++this.reqId; w.busy = true; this.busy++;
      const url = new URL(`../../data/city/${job.k}.json`, import.meta.url).href;
      this.cb.set(id, d => { if (!d.ok) { console.warn('city tile', job.k, d.err); t.pending = undefined; return; } if (this.tiles.get(job.k) !== t || t.pending !== job.lod) return; this.install(job.k, t, job.lod, d.o); });
      w.postMessage({ id, url, lod: job.lod, opts: { signs: SIGNS.length } });
    }
  }
  install(k, t, lod, o) {
    const ox = t.i * TILE, oz = t.j * TILE;
    const grp = new THREE.Group(); grp.position.set(ox, 0, oz); grp.name = 'tile_' + k;
    const near = lod === 0, shadows = near && this.q !== 'low';
    const add = (geo, mat, cast = false, recv = true) => { if (!geo) return null; geo.computeBoundingSphere(); const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; m.matrixAutoUpdate = false; m.updateMatrix(); grp.add(m); return m; };
    for (const b of o.bm) add(rich(b), this.mBld, shadows, lod < 2);
    for (const b of o.pm) add(rich(b), this.mProp, shadows, true);
    for (const b of o.gm) add(rich(b), this.mGlow, false, false);
    for (const sgb of o.sg) if (sgb.length) { const g = rich(sgb); const uv = g.attributes.uv, inf = g.attributes.aInfo; for (let v = 0; v < uv.count; v++) { const [x, y, w, h] = atlasRect(Math.round(inf.getX(v)), Math.round(inf.getY(v))); uv.setXY(v, x + uv.getX(v) * w, y + uv.getY(v) * h); } add(g, this.mSign, false, false); }
    add(flat(o.land), this.mLand, false, true);
    add(flat(o.road), this.mRoad, false, true);
    add(flat(o.walk), this.mWalk, false, true);
    add(flat(o.paint), this.mPaint, false, true);
    for (const c in o.ground) add(flat(o.ground[c]), this.mGround[c] || this.mGround[1], false, true);
    if (o.wires.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(o.wires, 3)); g.computeBoundingSphere(); const l = new THREE.LineSegments(g, this.mWire); l.matrixAutoUpdate = false; l.updateMatrix(); grp.add(l); }
    if (o.trees.length) {
      const n = o.trees.length / 5; const byV = [[], [], [], []];
      for (let k2 = 0; k2 < n; k2++) byV[Math.min(3, o.trees[k2 * 5 + 4] | 0)].push(k2);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), P = new THREE.Vector3(), Sc = new THREE.Vector3(), C = new THREE.Color();
      byV.forEach((ids, v) => {
        if (!ids.length) return;
        const im = new THREE.InstancedMesh(this.treeGeo[v], this.mTree, ids.length);
        ids.forEach((k2, n2) => { const b = k2 * 5; const s = o.trees[b + 2]; Q.setFromAxisAngle(Y, o.trees[b + 3]); P.set(o.trees[b], 0, o.trees[b + 1]); Sc.set(s, s * (0.9 + (o.trees[b + 3] % 0.2)), s); M.compose(P, Q, Sc); im.setMatrixAt(n2, M); C.setHSL(0.22 + (o.trees[b + 3] % 0.07), 0.35, 0.42 + (k2 % 7) * 0.02); im.setColorAt(n2, C); });
        im.castShadow = shadows; im.receiveShadow = false; im.computeBoundingSphere(); grp.add(im);
      });
    }
    // swap in
    if (t.group) { this.group.remove(t.group); disposeGroup(t.group); }
    this.unindex(t);
    t.group = grp; t.lod = lod; t.pending = undefined;
    this.group.add(grp);
    // colliders → grid (world coords)
    t.cols = o.cols.map(([x, z, hx, hz, ry, y0, y1]) => ({ x: x + ox, z: z + oz, hx, hz, c: Math.cos(ry), s: Math.sin(ry), y0, y1, kind: 'city' }));
    for (const c of t.cols) { const r = Math.max(c.hx, c.hz); for (let i = Math.floor((c.x - r) / this.CG); i <= Math.floor((c.x + r) / this.CG); i++) for (let j = Math.floor((c.z - r) / this.CG); j <= Math.floor((c.z + r) / this.CG); j++) { const kk = i * 100003 + j; let a = this.cgrid.get(kk); if (!a) this.cgrid.set(kk, a = []); a.push(c); } }
    t.sigs = []; for (let q = 0; q < o.sigs.length; q += 3) t.sigs.push([o.sigs[q] + ox, o.sigs[q + 1] + oz, o.sigs[q + 2]]);
    t.lamps = o.lamps.map(([x, y, z]) => new THREE.Vector3(x + ox, y, z + oz));
    t.water = o.water.map(p => { const pts = p.map(([x, z]) => [x + ox, z + oz]); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return { pts, x0, x1, z0, z1 }; });
    if (this.net) { this.net.remove(k); if (o.net.length) this.net.add(k, o.net, o.sigs, ox, oz); }
    t.bridges = o.bridges.map(([ax, az, bx, bz, hw]) => [ax + ox, az + oz, bx + ox, bz + oz, hw]);
    for (const w of t.water) for (let i = Math.floor(w.x0 / this.WG); i <= Math.floor(w.x1 / this.WG); i++) for (let j = Math.floor(w.z0 / this.WG); j <= Math.floor(w.z1 / this.WG); j++) { const kk = i * 100003 + j; let a = this.wgrid.get(kk); if (!a) this.wgrid.set(kk, a = { w: [], b: [] }); a.w.push(w); }
    for (const b of t.bridges) { const x0 = Math.min(b[0], b[2]) - b[4], x1 = Math.max(b[0], b[2]) + b[4], z0 = Math.min(b[1], b[3]) - b[4], z1 = Math.max(b[1], b[3]) + b[4]; for (let i = Math.floor(x0 / this.WG); i <= Math.floor(x1 / this.WG); i++) for (let j = Math.floor(z0 / this.WG); j <= Math.floor(z1 / this.WG); j++) { const kk = i * 100003 + j; let a = this.wgrid.get(kk); if (!a) this.wgrid.set(kk, a = { w: [], b: [] }); a.b.push(b); } }
  }
  unindex(t) {
    if (t.cols) for (const c of t.cols) { const r = Math.max(c.hx, c.hz); for (let i = Math.floor((c.x - r) / this.CG); i <= Math.floor((c.x + r) / this.CG); i++) for (let j = Math.floor((c.z - r) / this.CG); j <= Math.floor((c.z + r) / this.CG); j++) { const kk = i * 100003 + j; const a = this.cgrid.get(kk); if (!a) continue; const ix = a.indexOf(c); if (ix >= 0) a.splice(ix, 1); if (!a.length) this.cgrid.delete(kk); } }
    if (t.water || t.bridges) for (const [kk, a] of this.wgrid) { if (t.water) a.w = a.w.filter(w => !t.water.includes(w)); if (t.bridges) a.b = a.b.filter(b => !t.bridges.includes(b)); if (!a.w.length && !a.b.length) this.wgrid.delete(kk); }
    t.cols = null; t.water = null; t.bridges = null; t.lamps = null;
  }
  unload(k) {
    const t = this.tiles.get(k); if (!t) return;
    if (t.group) { this.group.remove(t.group); disposeGroup(t.group); }
    this.unindex(t); this.tiles.delete(k); this.net?.remove(k);
    this.queue = this.queue.filter(e => e.k !== k);
  }

  // ── queries used by physics / pedestrians / lights ──
  collidersAt(x, z) { return this.cgrid.get(Math.floor(x / this.CG) * 100003 + Math.floor(z / this.CG)) || EMPTY; }
  inWater(x, z) {
    const a = this.wgrid.get(Math.floor(x / this.WG) * 100003 + Math.floor(z / this.WG)); if (!a || !a.w.length) return false;
    for (const b of a.b) { const dx = b[2] - b[0], dz = b[3] - b[1], L2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - b[0]) * dx + (z - b[1]) * dz) / L2)); if (Math.hypot(x - b[0] - dx * t, z - b[1] - dz * t) < b[4]) return false; }
    for (const w of a.w) if (x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1 && inPoly(x, z, w.pts)) return true;
    return false;
  }
  // nearest traffic signal + which crossing is chiming: 1 = ピヨピヨ (north–south walk), 2 = カッコー (east–west walk)
  chimeAt(p) {
    let best = null;
    for (const t of this.tiles.values()) { if (t.lod !== 0 || !t.sigs) continue; for (const s of t.sigs) { const d = Math.hypot(s[0] - p.x, s[1] - p.z); if (d < 45 && (!best || d < best.d)) best = { d, ph: s[2] }; } }
    if (!best) return { chime: 0, vol: 0 };
    // same clock as the signal shader: E–W traffic green t∈[0,25), N–S green t∈[30,55); walkers cross the road whose traffic is red
    const tt = (this.uniforms.uTime.value + best.ph) % 60;
    const chime = tt >= 30 && tt < 48 ? 1 : tt < 18 ? 2 : 0;
    return { chime, vol: Math.max(0, 1 - best.d / 45) };
  }
  lampsNear(p, r = 260) {
    const out = [];
    for (const t of this.tiles.values()) { if (!t.lamps || t.lod !== 0) continue; for (const l of t.lamps) if (Math.abs(l.x - p.x) < r && Math.abs(l.z - p.z) < r) out.push(l); }
    return out;
  }
  stats() {
    let tris = 0, n = 0; const by = {}, lods = [0, 0, 0];
    for (const t of this.tiles.values()) if (t.group) { n++; lods[t.lod]++; t.group.traverse(o => { if (o.isMesh && o.geometry.attributes.position) { const k = o.geometry.attributes.position.count / 3 * (o.isInstancedMesh ? o.count : 1); tris += k; const nm = o.isInstancedMesh ? 'tree' : o.material === this.mBld ? 'bld' : o.material === this.mProp ? 'prop' : o.material === this.mGlow ? 'glow' : o.material === this.mRoad ? 'road' : 'other'; by[nm] = (by[nm] || 0) + Math.round(k); } }); }
    return { tiles: n, lods, tris: Math.round(tris), by, queue: this.queue.length };
  }
}
const EMPTY = [];

// ── drivable street graph for city traffic (built from the streamed tiles' street centrelines) ──
export class CityNet {
  constructor(city) { this.city = city; this.chains = new Map(); this.byTile = new Map(); this.nodes = new Map(); this.sig = new Map(); this.id = 0; }
  key(x, z) { return Math.round(x * 2) + ',' + Math.round(z * 2); }
  add(tk, streets, sigs, ox, oz) {
    const ids = [];
    // signals → nearest vertex later
    const sg = []; for (let k = 0; k < sigs.length; k += 3) sg.push([sigs[k] + ox, sigs[k + 1] + oz, sigs[k + 2]]);
    for (const a of streets) {
      const pts = []; for (let k = 3; k < a.length; k += 2) pts.push([a[k] + ox, a[k + 1] + oz]);
      const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      const c = { id: ++this.id, tk, cls: a[0], w: a[1], oneway: !!a[2], pts, cum, len: cum[cum.length - 1], keys: pts.map(([x, z]) => this.key(x, z)) };
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } c.bb = [x0, z0, x1, z1];
      this.chains.set(c.id, c); ids.push(c.id);
      c.keys.forEach((k, i) => { let n = this.nodes.get(k); if (!n) this.nodes.set(k, n = []); n.push([c, i]); });
      for (const [sx, sz, ph] of sg) c.keys.forEach((k, i) => { if (Math.hypot(pts[i][0] - sx, pts[i][1] - sz) < 4) this.sig.set(k, ph); });
    }
    this.byTile.set(tk, ids);
  }
  remove(tk) {
    const ids = this.byTile.get(tk); if (!ids) return;
    for (const id of ids) { const c = this.chains.get(id); if (!c) continue; c.dead = true; c.keys.forEach(k => { const n = this.nodes.get(k); if (!n) return; const r = n.filter(e => e[0] !== c); if (r.length) this.nodes.set(k, r); else this.nodes.delete(k); }); this.chains.delete(id); }
    this.byTile.delete(tk);
  }
  // signal state for a car approaching vertex key k travelling (dx, dz): 'go' | 'stop'
  light(k, dx, dz, tNow) {
    const ph = this.sig.get(k); if (ph === undefined) return 'go';
    const axis = Math.abs(dx) > Math.abs(dz) ? 0 : 1;
    let t = (tNow + ph) % 60; if (axis) t = (t + 30) % 60;
    return t < 25 ? 'go' : t < 28 ? 'amber' : 'stop';
  }
  randomNear(x, z, rMin, rMax) {
    const list = []; for (const c of this.chains.values()) { if (c.cls > 4 || c.len < 30) continue; const cx = (c.bb[0] + c.bb[2]) / 2, cz = (c.bb[1] + c.bb[3]) / 2; const d = Math.hypot(cx - x, cz - z); if (d < rMax + c.len / 2 && d > rMin - c.len / 2) list.push(c); }
    for (let tries = 0; tries < 12 && list.length; tries++) {
      const c = list[Math.floor(Math.random() * list.length)]; const s = Math.random() * c.len;
      let i = 0; while (i < c.pts.length - 2 && c.cum[i + 1] < s) i++;
      const t = (s - c.cum[i]) / Math.max(0.01, c.cum[i + 1] - c.cum[i]); const px = c.pts[i][0] + (c.pts[i + 1][0] - c.pts[i][0]) * t, pz = c.pts[i][1] + (c.pts[i + 1][1] - c.pts[i][1]) * t;
      const d = Math.hypot(px - x, pz - z); if (d < rMin || d > rMax) continue;
      return { c, i, d: s - c.cum[i], dir: c.oneway ? 1 : (Math.random() < 0.5 ? 1 : -1) };
    }
    return null;
  }
}
function inPoly(x, z, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
// interleaved stride-15 buffer → geometry
function rich(arr) {
  if (!arr || !arr.length) return null;
  const ib = new THREE.InterleavedBuffer(arr, 15);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.InterleavedBufferAttribute(ib, 3, 0)); g.setAttribute('normal', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  g.setAttribute('uv', new THREE.InterleavedBufferAttribute(ib, 2, 6)); g.setAttribute('color', new THREE.InterleavedBufferAttribute(ib, 3, 8));
  g.setAttribute('aInfo', new THREE.InterleavedBufferAttribute(ib, 4, 11));
  return g;
}
function flat(arr) {
  if (!arr || !arr.length) return null;
  const ib = new THREE.InterleavedBuffer(arr, 8);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.InterleavedBufferAttribute(ib, 3, 0)); g.setAttribute('uv', new THREE.InterleavedBufferAttribute(ib, 2, 3)); g.setAttribute('color', new THREE.InterleavedBufferAttribute(ib, 3, 5));
  const n = new Float32Array(arr.length / 8 * 3); for (let i = 1; i < n.length; i += 3) n[i] = 1; g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}
function disposeGroup(g) { g.traverse(o => { if (o.geometry && !o.isInstancedMesh) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); }); }
