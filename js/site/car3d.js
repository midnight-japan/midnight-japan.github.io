// Live 3D car preview for the website (cars page modal). Uses the game's own car model factory.
// ONE shared WebGL renderer is created lazily and its canvas is moved into whichever host is open.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCarModel } from '../game/carfactory.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let R = null;        // { renderer, scene, camera, stage, shadow }
let failed = false;
let view = null;     // current view state
let token = 0;

/** True if a WebGL context can be created (checked once, lazily). */
export function webglAvailable() {
  if (failed) return false;
  if (R) return true;
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), grd = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.85)'); grd.addColorStop(.45, 'rgba(0,0,0,.45)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function floorTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'), grd = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  grd.addColorStop(0, 'rgba(255,170,80,.16)'); grd.addColorStop(.55, 'rgba(95,140,255,.06)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(255,154,46,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(256, 256, 236, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function setup() {
  if (R) return R;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.localClippingEnabled = true;
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement; canvas.className = 'car3d-canvas';
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); failed = true; view?.onFail?.(); });

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();
  scene.environmentIntensity = 0.9;
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2); key.position.set(4, 6, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb6ff, 1.4); rim.position.set(-5, 3, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xbcd2ff, 0x1a1208, 0.5));

  const camera = new THREE.PerspectiveCamera(30, 2, 0.1, 100);
  const stage = new THREE.Group(); scene.add(stage);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: floorTexture(), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.002; scene.add(floor);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.001; scene.add(shadow);
  R = { renderer, scene, camera, stage, shadow, floor };
  return R;
}

function frame() {
  if (!view || !R) return;
  const now = performance.now(), dt = Math.min(0.05, (now - view.last) / 1000); view.last = now;
  if (!view.drag && now - view.idleAt > 1800 && !reduced()) view.yawV = 0.32;
  view.yaw += view.yawV * dt;
  if (!view.drag) view.yawV *= Math.pow(0.4, dt * (now - view.idleAt > 1800 ? 0 : 1)); // inertia after release
  view.pitch = Math.max(0.04, Math.min(0.62, view.pitch));
  const { camera, renderer, scene } = R;
  const host = view.host, w = host.clientWidth, h = host.clientHeight;
  if (w && h && (w !== view.w || h !== view.h)) { view.w = w; view.h = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const hf = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect); // keep the whole car in frame on narrow screens
  const d = Math.max(view.dist, view.ext / Math.tan(hf));
  camera.position.set(Math.sin(view.yaw) * Math.cos(view.pitch) * d, view.ty + Math.sin(view.pitch) * d, Math.cos(view.yaw) * Math.cos(view.pitch) * d);
  camera.lookAt(0, view.ty, 0);
  view.model?.update?.(dt, {});
  if (view.fadeIn < 1) { view.fadeIn = Math.min(1, view.fadeIn + dt * 2.5); R.stage.scale.setScalar(0.94 + 0.06 * easeOut(view.fadeIn)); }
  renderer.render(scene, camera);
  view.raf = requestAnimationFrame(frame);
}
const easeOut = x => 1 - Math.pow(1 - x, 3);

function wirePointer(canvas) {
  if (canvas._wired) return; canvas._wired = true;
  let px = 0, py = 0, lastT = 0;
  canvas.addEventListener('pointerdown', e => {
    if (!view) return; view.drag = true; view.yawV = 0; px = e.clientX; py = e.clientY; lastT = performance.now();
    canvas.setPointerCapture?.(e.pointerId); canvas.classList.add('grabbing');
  });
  canvas.addEventListener('pointermove', e => {
    if (!view?.drag) return;
    const dx = e.clientX - px, dy = e.clientY - py, now = performance.now(), dts = Math.max(0.008, (now - lastT) / 1000);
    px = e.clientX; py = e.clientY; lastT = now;
    view.yaw -= dx * 0.008; view.pitch += dy * 0.005; view.yawV = -dx * 0.008 / dts * 0.6; view.idleAt = now;
  });
  const up = e => { if (!view) return; view.drag = false; view.idleAt = performance.now(); canvas.classList.remove('grabbing'); try { canvas.releasePointerCapture?.(e.pointerId); } catch {} };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', e => {
    if (!view) return;
    if (e.key === 'ArrowLeft') { view.yaw += 0.25; view.idleAt = performance.now(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { view.yaw -= 0.25; view.idleAt = performance.now(); e.preventDefault(); }
  });
}

/**
 * Mount the shared 3D view into `host` for `car`. Resolves to a controller, or null if WebGL is unavailable/fails.
 * opts: { color, finish, rim, onFail }
 */
export async function mountCar3D(host, car, opts = {}) {
  unmountCar3D();
  if (!webglAvailable()) return null;
  const my = ++token;
  try { setup(); } catch (e) { failed = true; console.warn('[car3d] WebGL unavailable', e); return null; }
  const { renderer, stage, shadow, floor } = R;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0; canvas.setAttribute('aria-label', `${car.maker} ${car.name} — 3D`);
  host.appendChild(canvas); wirePointer(canvas);
  view = { host, car, yaw: 0.75, pitch: 0.16, yawV: 0, drag: false, idleAt: performance.now() - 1000, last: performance.now(), w: 0, h: 0, dist: 6, ty: 0.6, model: null, fadeIn: 0, onFail: opts.onFail };
  const L = car.L / 1000, H = car.H / 1000, W = car.W / 1000;
  view.dist = Math.max(3.9, L * 1.24 + H * 0.35); view.ty = Math.min(1.4, H * 0.42); view.ext = Math.max(L, W) * 0.6;
  shadow.scale.set(W * 1.55, L * 1.25, 1); floor.scale.setScalar(Math.max(L, 4.2) * 1.3);
  view.raf = requestAnimationFrame(frame);
  let model;
  try { model = await createCarModel(car, { color: opts.color || car.colors[0], finish: opts.finish || 'metallic', lod: 'mid' }); }
  catch (e) { console.warn('[car3d] model failed', e); if (my === token) unmountCar3D(); return null; }
  if (my !== token || !view) { model.dispose?.(); return null; }
  if (opts.rim) model.setRimColor(opts.rim);
  stage.add(model.root); view.model = model; view.fadeIn = 0;
  host.classList.add('ready');
  return {
    setPaint: hex => model.setPaint(hex),
    setFinish: f => model.setFinish(f),
    setRim: hex => model.setRimColor(hex),
    spinTo: () => { if (view) { view.yawV = 2.4; view.idleAt = performance.now(); } },
  };
}

/** Stop rendering and detach (renderer + context are kept for the next car). */
export function unmountCar3D() {
  token++;
  if (!view) return;
  cancelAnimationFrame(view.raf);
  view.host?.classList.remove('ready');
  if (view.model && R) { R.stage.remove(view.model.root); try { view.model.dispose?.(); } catch {} }
  R?.renderer.domElement.remove();
  view = null;
}
