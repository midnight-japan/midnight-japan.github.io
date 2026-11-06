// MIDNIGHT JAPAN — game bootstrap & main loop.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { CARS, CAR_BY_ID } from '../../data/cars.js';
import { GAME } from '../../data/meta.js';
import { detectLang, setLang, t } from '../i18n.js';
import { displayName, currentUser, updateUser } from '../account.js';
import { initTextures } from './textures.js';
import { setSignAnisotropy } from './signs.js';
import { RoadNet, PA_RECT, PA } from './roads.js';
import { Fx } from './fx.js';
import { Nav } from './nav.js';
import { Dialog } from './dialog.js';
import { World } from './world.js';
import { TimeOfDay } from './sky.js';
import { buildCarAuto, requestGlb, loadManifest, hasGlb, glbEntry } from './carfactory.js';
import { Vehicle, assistsFromSettings } from './vehicle.js';
import { Input } from './input.js';
import { Traffic } from './traffic.js';
import { Trains } from './trains.js';
import { Walkers } from './walkers.js';
import { Planes } from './planes.js';
import { Weather } from './weather.js';
import { NPCs, CHATTER } from './npc.js';
import { Online } from './online.js';
import { Accidents } from './accident.js';
import { Police } from './police.js';
import { TollPlaza } from './toll.js';
import { GameAudio } from './audio.js';
import { createHuman, defaultOutfit, createNameTag } from './humans.js';
import { UI } from './ui.js';
import { randomPlate } from './plates.js';

// merging helpers call toNonIndexed() on geometries that may already be non-indexed: skip those quietly
{ const tni = THREE.BufferGeometry.prototype.toNonIndexed; THREE.BufferGeometry.prototype.toNonIndexed = function () { return this.index === null ? this : tni.call(this); }; }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const SETTINGS_KEY = 'dn.settings', GARAGE_KEY = 'dn.garage';
const load = (k, d) => { try { return { ...d, ...(JSON.parse(localStorage.getItem(k)) || {}) }; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const isMobile = /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
export const DEFAULT_SETTINGS = {
  quality: isMobile ? 'low' : 'high', resScale: isMobile ? 0.75 : 1, transmission: 'auto', assist: true, units: 'kmh', etc: true,
  difficulty: 'standard', steerAssist: 'standard', stm: 'sport', tcs: 'sport', abs: true, police: 'normal',
  master: 0.8, engine: 0.85, sfx: 0.8, ambient: 0.6, radio: 0.7, dj: true, spawn: 'pa', weather: 'auto', damage: true, tilt: false, shake: true, fps: true, timeSpeed: 1, bloom: true, online: true, touch: isMobile ? 'on' : 'auto',
};

class Game {
  constructor() {
    this.settings = load(SETTINGS_KEY, DEFAULT_SETTINGS);
    if (!this.settings.fpsOn) { this.settings.fps = true; this.settings.fpsOn = 1; } // v0.3.3: FPS + version shown by default
    this.garage = load(GARAGE_KEY, { car: 'r34', cars: {} });
    this.quality = this.settings.quality;
    this.mode = 'loading'; this.frame = 0; this.money = 30000;
    this.stats = { tickets: 0, escapes: 0, tolls: 0, warnings: 0, km: 0 };
    this.focus = new THREE.Vector3(0, 0, 0);
    this.camMode = 'chase'; this.camModes = ['chase', 'far', 'hood', 'cockpit', 'orbit'];
    this.orbit = { yaw: 0.6, pitch: 0.25, dist: 7 };
    this.lookYaw = 0; this.lookPitch = 0;
    this.outfit = currentUser()?.profile?.outfitFull || load('dn.outfit', defaultOutfit());
  }
  saveSettings() { save(SETTINGS_KEY, this.settings); }
  saveGarage() { save(GARAGE_KEY, this.garage); }
  carSetup(id) {
    const car = CAR_BY_ID[id];
    const s = this.garage.cars[id] || (this.garage.cars[id] = {});
    if (!s.plate) { s.plate = randomPlate(car.plate); this.saveGarage(); }
    return { tune: s.tune || { preset: 'stock' }, color: s.color || car.colors[0], finish: s.finish || (car.cat === 'police' ? 'solid' : 'metallic'), rim: s.rim || null, camberF: s.camberF ?? 0, camberR: s.camberR ?? 0, ride: s.ride ?? 0, track: s.track ?? 0, strobe: s.strobe || 'off', plate: s.plate || randomPlate(car.plate), tint: s.tint ?? false };
  }

  async init() {
    await setLang(detectLang());
    this.ui = new UI(this);
    this.ui.loading(0.05, t('game.load.renderer'));
    const canvas = document.getElementById('gl');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false }); }
    catch (e) { this.ui.fatal(t('game.err.webgl')); throw e; }
    this.renderer = renderer;
    renderer.localClippingEnabled = true; // openable bonnets on the real car models
    loadManifest();
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2) * this.settings.resScale);
    renderer.setSize(innerWidth, innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = this.quality !== 'low';
    renderer.shadowMap.type = this.quality === 'ultra' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 60000);
    this.scene.add(this.camera);
    await initTextures(renderer, this.quality);
    setSignAnisotropy(this.quality === 'low' ? 2 : 8);
    this.ui.loading(0.2, t('game.load.roads'));
    this.net = new RoadNet();
    const bay = this.net.byId.bayshore;
    this.sPAin = (this.net.hits(150, -225.3).find(h => h.road === bay) || {}).s || 0;
    this.ui.loading(0.35, t('game.load.world'));
    await new Promise(r => setTimeout(r, 20));
    this.world = new World(this.scene, this.net, this.quality);
    await this.world.build();
    this.world.initDynamicLights(this.quality === 'low' ? 0 : this.quality === 'medium' ? 4 : 8);
    this.ui.loading(0.65, t('game.load.sky'));
    this.tod = new TimeOfDay(this.scene, renderer, this.quality);
    // post-processing
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.4, 0.45, 0.9);
    this.bloom.enabled = this.settings.bloom && this.quality !== 'low';
    // ambient occlusion: contact shadows under cars, kerbs, barriers (ultra — it costs about a third of the frame)
    if (this.quality === 'ultra') {
      try {
        const ao = new GTAOPass(this.scene, this.camera, innerWidth, innerHeight);
        ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.2, thickness: 1.2, scale: 1.1, samples: this.quality === 'ultra' ? 16 : 10, distanceFallOff: 1, screenSpaceRadius: false });
        ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
        ao.blendIntensity = 0.85;
        this.composer.addPass(ao); this.gtao = ao;
      } catch (e) { console.warn('GTAO', e); }
    }
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    // filmic grade: gentle S-curve, warm highlights / cool shadows, vignette (display space)
    this.grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, night: { value: 1 }, vig: { value: 0.32 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float night, vig; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          float l = dot(c, vec3(0.2126,0.7152,0.0722));
          c = mix(vec3(l), c, 1.08 + 0.06*night);                       // saturation
          c = mix(c, c*c*(3.0-2.0*c), 0.22);                           // soft S-curve
          vec3 shadowTint = mix(vec3(0.985,1.0,1.03), vec3(0.96,0.99,1.06), night);
          vec3 hiTint = vec3(1.025,1.0,0.97);
          c *= mix(shadowTint, hiTint, smoothstep(0.15, 0.85, l));
          vec2 d = vUv - 0.5; c *= 1.0 - vig * smoothstep(0.25, 0.95, dot(d,d)*2.2);
          gl_FragColor = vec4(clamp(c,0.0,1.0), 1.0);
        }`
    });
    this.composer.addPass(this.grade);
    if (this.quality === 'high' || this.quality === 'ultra') { try { this.composer.addPass(new SMAAPass(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio())); } catch {} }
    addEventListener('resize', () => this.resize());
    this.input = new Input(canvas);
    this.input.tilt = this.settings.tilt;
    this.audio = new GameAudio({ maxEngines: isMobile ? 10 : 24 }); this.audio.attachWorld?.(this.net, this.world);
    this.ui.loading(0.8, t('game.load.traffic'));
    this.npc = new NPCs(this);
    this.traffic = new Traffic(this);
    this.police = new Police(this);
    this.traffic.init();
    this.trains = new Trains(this);
    this.walkers = new Walkers(this);
    this.planes = new Planes(this);
    this.weather = new Weather(this);
    this.fx = new Fx(this);
    this.nav = new Nav(this);
    this.dialog = new Dialog(this);
    this.toll = new TollPlaza(this);
    this.online = new Online(this);
    this.accidents = new Accidents(this);
    this.ui.loading(1, t('game.load.done'));
    this.applyVolumes();
    // title cam
    this.mode = 'title';
    this.ui.showTitle();
    this.last = performance.now();
    renderer.setAnimationLoop(() => this.loop());
    window.__game = this;
    // deep link ?car=
    const q = new URLSearchParams(location.search);
    if (q.get('car') && CAR_BY_ID[q.get('car')]) this.garage.car = q.get('car');
    if (q.get('t')) this.tod.setHours(+q.get('t'));
    if (q.get('auto') || q.get('go')) { this.startDrive(this.garage.car); if (q.get('cam')) this.camMode = q.get('cam'); }
    // browsers only allow sound after a user gesture: unlock on the first key/tap
    const unlock = () => { this.unlockAudio(); removeEventListener('pointerdown', unlock, true); removeEventListener('keydown', unlock, true); };
    addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);
    // Enter on the title screen = quick start
    addEventListener('keydown', e => {
      if (e.key !== 'Enter' || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (this.mode === 'title' && document.querySelector('#title.show')) { e.preventDefault(); this.ui.action('play'); }
      else if ((this.mode === 'drive' || this.mode === 'walk') && !this.ui.paused) { e.preventDefault(); this.ui.openChat(); }
    });
  }
  resize() {
    this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight); this.composer.setSize(innerWidth, innerHeight);
  }
  applyVolumes() { const s = this.settings; this.audio.setVolumes({ master: s.master, engine: s.engine, sfx: s.sfx, ambient: s.ambient, radio: s.radio }); }
  async unlockAudio() { try { await this.audio.unlock(); this.applyVolumes(); if (!this.radio) { this.radio = this.audio.createRadio(); this.radio.djVoice = this.settings.dj; } } catch (e) { console.warn(e); } }

  // ───────────────────────── spawning ─────────────────────────
  spawnPoint() {
    // a free parking stall in the east meet area
    const spots = this.world.parkingSpots.filter(s => !s.taken && s.size === 's' && s.pos.x > 55);
    const spot = spots[Math.floor(spots.length / 2)] || this.world.parkingSpots.find(s => !s.taken);
    spot.taken = true; this.mySpot = spot;
    // backed in, nose to the aisle (as people park in Japan) — a nose-in spawn faces the next row and can't drive off
    return { ...spot, yaw: spot.yaw + Math.PI };
  }
  buildPlayerCar(id) {
    const car = CAR_BY_ID[id]; const S = this.carSetup(id);
    const model = buildCarAuto(car, { color: S.color, finish: S.finish, plate: S.plate });
    model.setStance({ camberF: S.camberF, camberR: S.camberR, ride: S.ride, track: S.track });
    if (S.rim) model.setRimColor(S.rim);
    model.lights.strobe = 'off'; model.strobeMode = S.strobe;
    model.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return model;
  }
  // spawn region chosen on the title screen: Daikoku PA stall, Bayshore shoulder at the Bay Bridge, Umihotaru PA, Daikoku-futō
  regionSpawn(region) {
    const net = this.net, at = (r, s, lat) => { const q = r.at(s), d = r.dirAt(s); const pos = q.clone(); pos.x += d.z * lat; pos.z -= d.x * lat; pos.y = (net.query(pos.x, pos.z, q.y + 1)?.y ?? q.y) + 0.3; return { pos, yaw: Math.atan2(d.x, d.z) }; };
    try {
      if (region === 'bay') { const r = net.byId.bayshore, sp = this.world.bridgeSpan; const s = sp ? Math.max(50, sp.s0 - 250) : r.length * 0.2; const L = r.lanes.filter(l => l.dir === 1).sort((a, b) => b.lat - a.lat)[0]; return at(r, s, L.lat); }
      // K1 Yokohane Line just after Namamugi JCT, heading for Yokohama Station / Minato Mirai (the Yokohama loop)
      if (region === 'k1' && net.byId.k1) { const r = net.byId.k1; const L = r.lanes.filter(l => l.dir === 1).sort((a, b) => b.lat - a.lat)[0]; return at(r, 1300, L.lat); }
      if (region === 'umi') { const r = net.byId.umi_in_e || net.byId.umi_in_w; return at(r, Math.max(2, r.length - 10), 0); }
      // city streets (real OpenStreetMap roads): keep to the left lane
      const CITY_SPAWN = { mm: [-3949.7, 1257.2, 1.01, 14], chinatown: [-2987.3, 2310, -1.04, 7.5], tsurumi: [-2109.4, -2792.6, -0.93, 7.5], kawasaki: [2598.8, -5144.9, -0.91, 7.5], haneda: [7756.1, -9056.3, 1.02, 7.5] };
      if (CITY_SPAWN[region]) { const [x, z, yaw, w] = CITY_SPAWN[region]; const o = w / 4; return { pos: new THREE.Vector3(x + Math.cos(yaw) * o, 0.3, z - Math.sin(yaw) * o), yaw }; }
      if (region === 'futo') { const r = net.byId.futo_5 || net.roads.find(x => x.kind === 'local'); const L = r.lanes.filter(l => l.dir === 1).sort((a, b) => b.lat - a.lat)[0] || r.lanes[0]; return at(r, r.length * 0.5, L.lat); }
    } catch (e) { console.warn('spawn', e); }
    return null;
  }
  startDrive(id, keepPos = false) {
    this.unlockAudio();
    const prev = this.vehicle;
    const reg = keepPos && prev ? null : (new URLSearchParams(location.search).get('spawn') || this.settings.spawn || 'pa');
    const spot = keepPos && prev ? null : ((reg !== 'pa' && this.regionSpawn(reg)) || this.spawnPoint());
    if (spot && !spot.size && this.mySpot) { this.mySpot.taken = false; this.mySpot = null; }
    if (this.model) { this.scene.remove(this.model.root); this.model.dispose(); }
    if (this.engineSnd) { this.engineSnd.dispose(); this.engineSnd = null; }
    this.carId = id; this.garage.car = id; this.saveGarage();
    const car = CAR_BY_ID[id];
    this.model = this.buildPlayerCar(id);
    this.scene.add(this.model.root);
    // the real 3D model may still be downloading → swap it in when ready (keeps position, lights, doors)
    if (!this.model.isGlb) loadManifest().then(() => hasGlb(id) && requestGlb(id).then(() => this.swapPlayerModel(id)).catch(() => {}));
    const v = new Vehicle(car, this.model, { mode: this.settings.transmission, assists: assistsFromSettings(this.settings), tune: this.carSetup(id).tune });
    v.camberF = this.model.camber.f; v.camberR = this.model.camber.r;
    if (keepPos && prev) v.place(prev.pos, prev.yaw); else v.place(spot.pos.clone(), spot.yaw);
    v.handbrakeOn = true;
    if (this.settings.transmission === 'auto' || v.ev) v.atSel = 'P';
    this.vehicle = v;
    this.engineSnd = this.audio.createEngine(car, { lod: 'full' });
    this.mode = 'drive'; this.camMode = this.camMode === 'orbit' ? 'chase' : this.camMode;
    this.ui.showHUD();
    this.ui.toast(t('game.hint.start'), 'info', 7);
    if (this.player) { this.scene.remove(this.player.h.object); this.player = null; }
    this.camSnap = true;
    if (this.settings.online) { this.online.start(); this.online.announce(); }
    let seen = false; try { seen = localStorage.getItem('dn.tutorial') === '1'; } catch {}
    if (!seen && !new URLSearchParams(location.search).get('auto')) this.ui.startTutorial();
  }

  swapPlayerModel(id) {
    if (this.carId !== id || !this.model || this.model.isGlb || !glbEntry(id)) return;
    const old = this.model, nm = this.buildPlayerCar(id);
    if (!nm.isGlb) { nm.dispose(); return; }
    Object.assign(nm.lights, old.lights); nm.strobeMode = old.strobeMode;
    if (old.parts.hood && nm.parts.hood) nm.parts.hood.target = old.parts.hood.target;
    nm.root.position.copy(old.root.position); nm.root.rotation.copy(old.root.rotation);
    this.scene.remove(old.root); old.dispose(); this.scene.add(nm.root);
    this.model = nm; if (this.vehicle) this.vehicle.model = nm;
  }

  // ───────────────────────── walking ─────────────────────────
  exitCar() {
    const v = this.vehicle; if (!v) return;
    if (Math.abs(v.kmh) > 4) { this.ui.toast(t('game.walk.stopfirst'), 'info', 2); return; }
    v.ctl.throttle = 0; v.handbrakeOn = true;
    const side = this.model.parts.driverX > 0 ? 1 : -1;
    const exit = this.model.parts.exitPoint.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw).add(v.pos); exit.y = v.pos.y;
    const door = this.model.parts.doors.find(d => !d.rear && (side > 0 ? d.left : !d.left));
    if (door) { door.target = 1; setTimeout(() => door.target = 0, 1400); }
    this.audio.sfx('door_open', { position: v.pos });
    setTimeout(() => this.audio.sfx('door_close', { position: v.pos }), 1300);
    if (!this.walkable(exit.x, exit.z, v.pos.y)) { // other side
      exit.copy(this.model.parts.exitPoint).setX(-this.model.parts.exitPoint.x).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.yaw).add(v.pos); exit.y = v.pos.y;
      if (!this.walkable(exit.x, exit.z, v.pos.y)) { this.ui.toast(t('game.walk.noexit'), 'warn'); return; }
    }
    exit.y = this.walkY(exit.x, exit.z, v.pos.y);
    const h = createHuman(this.outfit); h.object.position.copy(exit); this.scene.add(h.object);
    h.object.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const tag = createNameTag(displayName()); tag.position.y = h.height + 0.25; h.object.add(tag);
    this.player = { h, pos: h.object.position, yaw: v.yaw + Math.PI / 2 * side, action: 'exit', t: 0, speed: 0 };
    this.mode = 'walk'; this.ui.showHUD();
  }
  enterCar() {
    const v = this.vehicle, p = this.player; if (!v || !p) return;
    this.scene.remove(p.h.object); p.h.dispose?.(); this.player = null;
    const side = this.model.parts.driverX > 0 ? 1 : -1;
    const door = this.model.parts.doors.find(d => !d.rear && (side > 0 ? d.left : !d.left));
    if (door) { door.target = 1; setTimeout(() => door.target = 0, 900); }
    this.audio.sfx('door_open', { position: v.pos }); setTimeout(() => this.audio.sfx('door_close', { position: v.pos }), 850);
    this.mode = 'drive'; this.ui.showHUD();
  }
  // walkable = PA/lot walk areas, or any road deck (shoulder / stopped on the expressway) at our level
  roadAt(x, z, y) { const q = this.net.query(x, z, y + 0.6, (a, b) => this.world.ground(a, b)); return q.onRoad && Math.abs(q.y - y) < 0.9 ? q : null; }
  walkable(x, z, y) { return (y < 1.2 && this.world.canWalk(x, z, true) && !this.cityBlocked(x, z)) || !!this.roadAt(x, z, y); }
  cityBlocked(x, z) { const c = this.world.city; if (!c) return false; for (const C of c.collidersAt(x, z)) { const dx = x - C.x, dz = z - C.z; const lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; if (Math.abs(lx) < C.hx + 0.3 && Math.abs(lz) < C.hz + 0.3) return true; } return false; }
  walkY(x, z, y) { const q = this.roadAt(x, z, y); if (q && (y > 1.2 || !this.world.canWalk(x, z))) return q.y; return (z < -53.9 && z > -60.2) ? 0.15 : z < -60 && z > -84 && x > -55 && x < 55 ? 0.21 : 0; }
  updateWalk(dt) {
    const p = this.player, I = this.input.axes, W = this.world;
    // camera-relative movement
    const camYaw = this.orbit.yaw;
    const mx = I.moveX, my = I.moveY;
    const sp = (I.run ? 4.2 : 1.6) * Math.min(1, Math.hypot(mx, my));
    if (sp > 0.05) {
      const ang = Math.atan2(-mx, my) + camYaw + Math.PI;
      let d = ang - p.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      p.yaw += d * (1 - Math.exp(-dt * 10));
      const nx = p.pos.x + Math.sin(p.yaw) * sp * dt, nz = p.pos.z + Math.cos(p.yaw) * sp * dt;
      const ok = (x, z) => this.walkable(x, z, p.pos.y) && !this.npc.blocked(x, z, 0.3) && !this.carBlocks(x, z);
      if (ok(nx, nz)) { p.pos.x = nx; p.pos.z = nz; }
      else if (ok(nx, p.pos.z)) p.pos.x = nx; else if (ok(p.pos.x, nz)) p.pos.z = nz;
      else if (!this.walkable(nx, nz, p.pos.y) && !this._blockMsgT) { this.ui.toast(t('game.walk.blocked'), 'warn', 2); this._blockMsgT = 3; }
    }
    this._blockMsgT = Math.max(0, (this._blockMsgT || 0) - dt) || 0;
    p.speed = sp;
    // floor height (building floor slightly raised)
    p.pos.y = this.walkY(p.pos.x, p.pos.z, p.pos.y);
    p.t += dt; let action = sp > 3 ? 'run' : sp > 0.1 ? 'walk' : (p.hold || 'idle');
    if (p.action === 'exit' && p.t < 1) action = 'exit';
    p.action = action;
    p.h.object.rotation.y = p.yaw;
    p.h.update(dt, { speed: sp, action, t: Math.min(1, p.t) });
    // interactions
    const v = this.vehicle;
    let prompt = null;
    if (v && p.pos.distanceTo(v.pos) < v.car.L / 2000 + 1.6) { prompt = ['F', t('game.walk.enter')]; if (this.input.act('interact')) { this.enterCar(); return; } }
    else {
      const it = W.interact.find(i => i.pos.distanceTo(p.pos) < i.r);
      if (it) { prompt = ['F', t('game.walk.' + it.type)]; if (this.input.act('interact')) this.ui.interaction(it); }
      else { const n = this.npc.nearest(p.pos, 2.2); if (n) { prompt = ['F', t('game.walk.talk')]; if (this.input.act('interact')) this.talkTo(n); } }
    }
    if (prompt) this.ui.prompt(...prompt); else this.ui.prompt(null);
    // konbini chime
    const inStore = W.konbini && p.pos.x > W.konbini.x0 && p.pos.x < W.konbini.x1 && p.pos.z > W.konbini.z0 && p.pos.z < W.konbini.z1;
    if (inStore && !this._inStore) { this.audio.sfx('store_chime'); this.audio.speak('いらっしゃいませー。', 'ja-JP', { role: 'female', seed: 5 }); }
    this._inStore = inStore;
  }
  carBlocks(x, z) {
    for (const ai of this.traffic.cars) {
      if (ai.mode === 'road') continue; const dx = x - ai.pos.x, dz = z - ai.pos.z; if (dx * dx + dz * dz > 16) continue;
      const f = Math.sin(ai.yaw), c = Math.cos(ai.yaw); const lz = dx * f + dz * c, lx = dx * c - dz * f;
      if (Math.abs(lz) < ai.halfL + 0.15 && Math.abs(lx) < ai.radius + 0.15) return true;
    }
    const v = this.vehicle; if (v) { const dx = x - v.pos.x, dz = z - v.pos.z; const f = v.forward; const lz = dx * f.x + dz * f.z, lx = dx * f.z - dz * f.x; if (Math.abs(lz) < v.car.L / 2000 + 0.1 && Math.abs(lx) < v.car.W / 2000 + 0.1) return true; }
    return false;
  }
  talkTo(n) {
    const c = CHATTER[Math.floor(Math.random() * CHATTER.length)];
    n.state = 'idle'; n.action = 'talk'; n.wait = 6; n.focus = { pos: this.player.pos };
    this.ui.toast(`「${c.ja}」 — ${t(c.k)}`, 'chat', 5);
    this.audio.speak(c.ja, 'ja-JP', { rate: 1.05, role: Math.random() < 0.5 ? 'male' : 'female', seed: Math.random() * 10 });
  }

  // ───────────────────────── driving ─────────────────────────
  updateDrive(dt) {
    const v = this.vehicle, I = this.input, A = I.axes, m = this.model;
    if (I.act('ignition')) { if (v.engine.running) { v.stopEngine(); this.ui.toast(t('game.car.engineOff'), 'info'); } else v.startEngine(); }
    // easy start: pressing throttle with engine off starts it in auto mode
    if (!v.engine.running && !v.engine.cranking && A.throttle > 0.5 && this.settings.transmission !== 'manual_clutch' && !this._autoStartBlock) { v.startEngine(); this._autoStartBlock = 1.5; }
    this._autoStartBlock = Math.max(0, (this._autoStartBlock || 0) - dt);
    // auto/EV selector: brake at standstill + S → R, W → D (simple controls)
    const auto = v.mode === 'auto' || v.ev;
    let throttle = A.throttle, brake = A.brake;
    if (auto && this.settings.assist) {
      if (Math.abs(v.vx) < 0.6) {
        if (throttle > 0.1 && (v.atSel === 'P' || v.atSel === 'N' || v.atSel === 'R') && !(v.atSel === 'R' && brake > 0.1)) { if (v.atSel === 'R') { throttle = 0; brake = 1; } v.setSel('D'); if (v.handbrakeOn) v.handbrakeOn = false; }
        else if (brake > 0.1 && throttle < 0.1 && (v.atSel === 'D' || v.atSel === 'P' || v.atSel === 'N') && this._brakeHold > 0.35) { v.setSel('R'); if (v.handbrakeOn) v.handbrakeOn = false; }
      }
      this._brakeHold = (brake > 0.1 && Math.abs(v.vx) < 0.6) ? (this._brakeHold || 0) + dt : 0;
      if (v.atSel === 'R') { const tmp = throttle; throttle = brake; brake = tmp; if (v.vx > 0.5) { brake = Math.max(brake, throttle); throttle = 0; } }
    } else if (!auto && this.settings.assist && v.handbrakeOn && throttle > 0.2) { v.handbrakeOn = false; }
    if (A.handbrake > 0.5 && v.handbrakeOn === false) { /* pulled while driving: momentary */ }
    if (I.act('shiftUp')) v.shiftUp();
    if (I.act('shiftDown')) v.shiftDown();
    for (let gN = 1; gN <= 7; gN++) if (I.act('gear' + gN)) { if (auto) v.setSel('D'); else v.selectGear(gN); }
    if (I.act('gearR')) { if (auto) v.setSel('R'); else v.selectGear(-1); }
    if (I.act('gearN')) { if (auto) v.setSel('N'); else v.selectGear(0); }
    if (I.act('jump')) {} // space is handbrake (axis)
    if (A.handbrake > 0.5 && Math.abs(v.vx) < 0.3 && !this._hbToggle) { v.handbrakeOn = !v.handbrakeOn; this._hbToggle = true; this.audio.sfx(v.handbrakeOn ? 'handbrake_on' : 'handbrake_off'); }
    if (A.handbrake < 0.2) this._hbToggle = false;
    if (Math.abs(v.vx) > 0.5 && v.handbrakeOn && throttle > 0.2) v.handbrakeOn = false;
    v.ctl.throttle = throttle; v.ctl.brake = brake; v.ctl.steer = A.steer; v.ctl.steerDigital = A.steerDigital !== false; v.ctl.handbrake = Math.abs(v.vx) > 0.3 ? A.handbrake : 0; v.ctl.clutch = A.clutch;
    // auto clutch for "manual" (sequential) mode: blip-free
    // lights & misc
    const L = m.lights;
    if (I.act('lights')) { if (!L.head) L.head = true; else if (!L.high) L.high = true; else { L.head = false; L.high = false; } this.audio.sfx('ui_click'); }
    if (I.act('horn')) { this.engineSnd?.horn(true); this._hornT = 0.35; this.traffic.honk(v.pos, v.forward); }
    if (this._hornT > 0) { this._hornT -= dt; if (I.key('horn')) this._hornT = 0.1; if (this._hornT <= 0) this.engineSnd?.horn(false); }
    if (I.act('signalL')) { L.left = !L.left; L.right = false; L.hazard = false; }
    if (I.act('signalR')) { L.right = !L.right; L.left = false; L.hazard = false; }
    if (I.act('hazard')) { L.hazard = !L.hazard; }
    if (I.act('fog')) { L.fog = !L.fog; this.audio.sfx('ui_click'); this.ui.toast(t('game.car.fog') + (L.fog ? ' ON' : ' OFF'), 'info', 2); }
    // self-cancelling indicators: cancel once the wheel returns after a turn
    if (L.left || L.right) { if (Math.abs(A.steer) > 0.4 && Math.sign(A.steer) === (L.left ? 1 : -1)) this._sigTurn = true; else if (this._sigTurn && Math.abs(A.steer) < 0.08) { L.left = L.right = false; this._sigTurn = false; } } else this._sigTurn = false;
    if (I.act('strobe')) { const modes = ['off', 'flash', 'triple', 'police', 'amber', 'steady']; L.strobe = modes[(modes.indexOf(L.strobe) + 1) % modes.length]; this.ui.toast(t('game.car.strobe') + ': ' + t('game.strobe.' + L.strobe), 'info', 2); }
    if (I.act('siren') && v.car.cat === 'police') { L.beacon = !L.beacon; this._siren = L.beacon ? (this._siren === 'wail' ? 'yelp' : 'wail') : 'off'; }
    if (I.act('regen') && v.ev) { v.regenLevel = (v.regenLevel + 1) % 4; this.ui.toast(t('game.car.regen') + ': ' + t('game.regen.' + v.regenLevel), 'info', 2); }
    if (I.act('radio')) { if (this.radio) { if (!this.radio.on) this.radio.power(true); else this.radio.power(false); this.ui.radioBanner(); } }
    if (I.act('radioNext')) { if (this.radio) { if (!this.radio.on) this.radio.power(true); else this.radio.next(); this.ui.radioBanner(); } }
    if (I.act('carMenu')) this.ui.toggleCarMenu();
    if (I.act('interact')) { this.exitCar(); return; }
    // reverse light / brake light
    L.brake = brake > 0.1 || (v.regenActive && v.regenLevel === 3);
    L.reverse = v.gear === -1 || v.atSel === 'R';
    // physics
    v.update(dt, this.net, this.world);
    this.traffic.collidePlayer(v);
    // events → audio
    for (const e of v.events) {
      switch (e) {
        case 'crank': this.audio.sfx('ignition_click'); break;
        case 'started': this.ui.toast(t('game.car.started'), 'info', 1.5); if (this.settings.etc) this.audio.speak('ETCカードが挿入されました。', 'ja-JP', { priority: 'low' }); else this.audio.speak('ETCカードが挿入されていません。', 'ja-JP', { priority: 'low' }); break;
        case 'ready': this.ui.toast('READY', 'info', 1.5); this.audio.sfx('ui_select'); break;
        case 'stall': this.engineSnd?.stall(); this.ui.toast(t('game.car.stall'), 'warn', 2.5); break;
        case 'lurch': this.ui.toast(t('game.car.clutchStart'), 'warn', 2.5); break;
        case 'grind': this.audio.sfx('clutch'); this.ui.toast(t('game.car.grind'), 'warn', 1.5); break;
        case 'shift': this.engineSnd?.shift(); break;
        case 'blowoff': this.engineSnd?.blowOff(); break;
        case 'backfire': this.engineSnd?.backfire(); break;
        case 'crash': if (!this._crashT && v.lastHit && performance.now() - v.lastHit.t < 300) this.fx?.damage(this.model, v.lastHit, v.lastHit.vin); if (!this._crashT) this.accidents.onCrash(v.speed); if (!this._crashT) { this.audio.sfx('crash', { position: v.pos, volume: clamp(v.speed / 20, 0.3, 1) }); this._crashT = 0.5; this.shake = Math.min(1, v.speed / 15); } break;
      }
    }
    v.events.length = 0;
    this._crashT = Math.max(0, (this._crashT || 0) - dt) || 0;
    if (v.inWater) { this.ui.toast(t('game.car.water'), 'warn', 3); v.inWater = false; this.respawnPA(); }
    // out-of-area boundary
    if (v.road && (v.road.lanesB || v.road.partner)) {
      const h = v.surface.hit, r = v.road;
      // two-way roads: U-turn only where a carriageway really leaves the map (the Bayshore's forward side starts at
      // Honmoku JCT where the K3 Kariba Line flows into it, so cars arriving there carry straight on)
      const fwdSide = Math.sign(r.lanes.find(l => l.dir === 1)?.lat ?? 1), onFwd = h && Math.sign(h.lat) === fwdSide;
      const fedStart = r.id === 'bayshore' && this.net.byId.k3;
      const atEdge = h && (r.lanesB ? ((h.s < 15 && !(fedStart && onFwd)) || h.s > r.length - 15) : r.edge === 'end' ? h.s > r.length - 15 : h.s < 15);
      if (atEdge && (r.lanesB ? (r.id === 'bayshore' || r.id === 'k5') : true)) this.uturn(v, h);
    }
    // model visuals
    const sp = v.spin;
    const susp = v.susp;
    m.update(dt, { steer: v.steerAng, spin: [sp[0], sp[1], sp[2], sp[3]], susp, pitch: v.pitch, roll: v.roll });
    // align body to the road plane: yaw first, then pitch/roll in the car's own frame (YXZ), so slopes tilt the nose, not the side
    m.root.position.copy(v.pos); m.root.rotation.order = 'YXZ'; m.root.rotation.y = v.yaw;
    this._gs = lerp(this._gs ?? 0, -Math.atan(v.grade || 0), 1 - Math.exp(-dt * 14)); this._bs = lerp(this._bs ?? 0, Math.atan(v.bank || 0), 1 - Math.exp(-dt * 14));
    m.root.rotation.x = this._gs; m.root.rotation.z = this._bs;
    // gauges in cockpit
    if (this.camMode === 'cockpit' && this.frame % 3 === 0) m.drawGauges({ rpm: v.engine.rpm, kmh: Math.abs(v.kmh), gear: v.gearLabel, kw: v.kw, info: v.ev ? `${Math.round(v.battery * 100)}%` : (this.settings.etc ? 'ETC' : ''), warn: !v.engine.running ? 'ENGINE OFF' : v.handbrakeOn ? '(P)' : '', boost: v.engine.boost, fuel: v.ev ? v.battery : v.fuel, running: v.engine.running, night: this.env?.night ?? 1, ctl: v.ctl, hb: v.handbrakeOn, ax: v.ax, ay: v.ay, odo: v.odometer });
    // engine sound
    const openness = clamp(m.parts.doors.reduce((a, d) => a + d.open, 0) * 0.6 + m.parts.windows.reduce((a, d) => a + (d.winOpen || 0), 0) * 0.5 + (v.car.open ? 0.6 : 0), 0, 1);
    this.openness = openness;
    this.engineSnd?.update({ rpm: v.engine.rpm, throttle: v.ctl.throttle, load: v.ctl.throttle > 0.05 ? v.ctl.throttle : (v.engine.running ? -0.4 : 0), running: v.engine.running, cranking: v.engine.cranking > 0, boost: v.engine.boost, speed: v.speed, slip: v.tireSlip, position: v.pos, interior: this.camMode === 'cockpit' || this.camMode === 'hood', openness });
    this.stats.km = v.odometer / 1000;
  }
  uturn(v, h) {
    // the map ends here → turn the car around onto the opposite carriageway
    let road = v.road; let lanes = road.lanes;
    let back = lanes.filter(l => Math.sign(l.lat) !== Math.sign(h.lat)), s = clamp(h.s, 30, road.length - 30);
    if (!road.lanesB && road.partner && this.net.byId[road.partner]) {
      // one-way carriageway at the map edge → continue on its partner (the opposite carriageway)
      const pr = this.net.byId[road.partner]; const e = road.at(h.s);
      let best = null; for (let k = 0; k <= pr.length; k += 10) { const q = pr.at(k); const d = q.distanceToSquared(e); if (!best || d < best.d) best = { d, k }; }
      road = pr; lanes = pr.lanes; back = lanes.filter(l => l.dir === 1).slice(-1); s = clamp(best.k, 30, pr.length - 30);
    }
    if (!back.length) return;
    const lane = back[0];
    const p = road.at(s, lane.lat); const tdir = road.dirAt(s);
    const yaw = Math.atan2(tdir.x * lane.dir, tdir.z * lane.dir);
    v.place(p, yaw); v.vel.copy(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(Math.max(8, Math.abs(v.vx) * 0.5)));
    this.ui.toast(t('game.area.edge'), 'info', 4); this.camSnap = true;
  }
  // teleport (full map): onto the nearest expressway lane when one is close, otherwise onto the city street nearest
  // the point once its tiles have streamed in (the car waits on the spot with the handbrake on until then)
  teleport(x, z) {
    if (!this.world.isLand(x, z) && !this.net.hits(x, z).some(h => h.inside)) {
      let best = null; for (const r of this.net.roads) for (const q of r.samples) { const d = (q.p.x - x) ** 2 + (q.p.z - z) ** 2; if (!best || d < best.d) best = { d, q }; }
      if (!best || best.d > 400 * 400) { this.ui.toast(t('game.map.tpSea'), 'warn', 3); return; }
      x = best.q.p.x; z = best.q.p.z;
    }
    if (this.mode === 'walk') this.enterCar();
    const v = this.vehicle; if (!v) return;
    if (this.mySpot) { this.mySpot.taken = false; this.mySpot = null; }
    // nearest expressway lane within 60 m
    let best = null; for (const r of this.net.roads) for (let i = 0; i < r.samples.length; i += 2) { const q = r.samples[i]; const d = (q.p.x - x) ** 2 + (q.p.z - z) ** 2; if (!best || d < best.d) best = { d, r, s: q.s }; }
    if (best && best.d < 60 * 60) {
      const r = best.r, L = r.lanes.filter(l => l.dir === 1).sort((a, b) => b.lat - a.lat)[0] || r.lanes[0];
      const p = r.at(best.s, L.lat), d = r.dirAt(best.s); v.place(p.clone().setY(p.y + 0.3), Math.atan2(d.x * L.dir, d.z * L.dir));
    } else { v.place(new THREE.Vector3(x, this.world.ground(x, z) + 0.4, z), v.yaw); this._snap = { x, z, t: 12 }; }
    v.handbrakeOn = true; this.camSnap = true; this.ui.toast(t('game.map.tpDone'), 'info', 2);
  }
  snapUpdate(dt) {
    const S = this._snap; if (!S) return; S.t -= dt; const N = this.world.city?.net; const v = this.vehicle;
    if (!v || S.t <= 0) { this._snap = null; return; }
    if (!N) return;
    let best = null; for (const c of N.chains.values()) { if (c.dead || c.cls > 5 || c.bb[0] > S.x + 150 || c.bb[2] < S.x - 150 || c.bb[1] > S.z + 150 || c.bb[3] < S.z - 150) continue; for (let i = 0; i < c.pts.length - 1; i++) { const p = c.pts[i]; const d = (p[0] - S.x) ** 2 + (p[1] - S.z) ** 2; if (!best || d < best.d) best = { d, c, i }; } }
    if (!best) return;
    const { c, i } = best, a = c.pts[i], b = c.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, off = c.w / 4;
    const px = (a[0] + b[0]) / 2 + tz * off, pz = (a[1] + b[1]) / 2 - tx * off; // keep left
    if (this.cityBlocked(px, pz)) return;
    v.place(new THREE.Vector3(px, this.world.ground(px, pz) + 0.3, pz), Math.atan2(tx, tz)); this.camSnap = true; this._snap = null;
  }
  respawnPA() {
    const v = this.vehicle; if (!v) return;
    if (this.mySpot) this.mySpot.taken = false;
    const s = this.spawnPoint(); v.place(s.pos.clone(), s.yaw); v.handbrakeOn = true; this.camSnap = true; this.fx?.repair(this.model);
  }

  // ───────────────────────── camera ─────────────────────────
  updateCamera(dt) {
    // near plane: tight only inside the car; elsewhere 0.45 m keeps distant ground from z-fighting with the sea
    { const nr = (this.mode === 'drive' && (this.camMode === 'cockpit' || this.camMode === 'hood')) ? 0.08 : this.mode === 'walk' ? 0.2 : 0.45; if (this.camera.near !== nr) { this.camera.near = nr; this.camera.updateProjectionMatrix(); } }
    const cam = this.camera, I = this.input;
    if (this.debugCam) { cam.position.copy(this.debugCam.pos); cam.lookAt(this.debugCam.look); return; } // dev / screenshot tool
    if (I.act('camera')) { const list = this.mode === 'walk' ? ['chase', 'orbit'] : this.camModes; this.camMode = list[(list.indexOf(this.camMode) + 1) % list.length]; this.lookYaw = 0; this.lookPitch = 0; this.camSnap = true; }
    const md = I.mouse;
    if (this.mode === 'title' || this.mode === 'garage') {
      const target = this.mode === 'garage' && this.preview ? this.preview.root.position.clone().add(new THREE.Vector3(0, 0.7, 0)) : new THREE.Vector3(0, 8, 0);
      this.orbit.yaw += (md.dx * 0.005) + dt * (this.mode === 'title' ? 0.03 : md.dragging ? 0 : 0.12);
      this.orbit.pitch = clamp(this.orbit.pitch + md.dy * 0.003, 0.02, 1.2);
      const dist = this.mode === 'title' ? 230 : clamp(this.orbit.dist + md.wheel * 0.4, 3.5, 14);
      if (this.mode === 'garage') this.orbit.dist = dist;
      cam.position.set(target.x + Math.sin(this.orbit.yaw) * Math.cos(this.orbit.pitch) * dist, target.y + Math.sin(this.orbit.pitch) * dist + (this.mode === 'title' ? 40 : 0), target.z + Math.cos(this.orbit.yaw) * Math.cos(this.orbit.pitch) * dist);
      cam.lookAt(target); this.focus.copy(target);
      cam.fov = 50; cam.updateProjectionMatrix();
      return;
    }
    if (this.mode === 'walk') {
      const p = this.player; const target = p.pos.clone().add(new THREE.Vector3(0, 1.55, 0));
      this.orbit.yaw -= md.dx * 0.004 + I.axes.lookX * dt * 2.5; this.orbit.pitch = clamp(this.orbit.pitch + md.dy * 0.003 + I.axes.lookY * dt * 1.5, -0.3, 1.1);
      if (this.touchLook) { this.orbit.yaw -= this.touchLook.dx * 0.006; this.orbit.pitch = clamp(this.orbit.pitch + this.touchLook.dy * 0.004, -0.3, 1.1); this.touchLook.dx = this.touchLook.dy = 0; }
      const dist = this.camMode === 'orbit' ? 6 : 3.2;
      const want = new THREE.Vector3(target.x + Math.sin(this.orbit.yaw) * Math.cos(this.orbit.pitch) * dist, target.y + Math.sin(this.orbit.pitch) * dist, target.z + Math.cos(this.orbit.yaw) * Math.cos(this.orbit.pitch) * dist);
      want.y = Math.max(want.y, 0.4);
      cam.position.lerp(want, this.camSnap ? 1 : 1 - Math.exp(-dt * 12)); this.camSnap = false;
      cam.lookAt(target); this.focus.copy(p.pos);
      cam.fov = 60; cam.updateProjectionMatrix();
      return;
    }
    const v = this.vehicle; if (!v) return;
    const f = v.forward, up = new THREE.Vector3(0, 1, 0);
    const L = v.car.L / 1000, H = v.car.H / 1000;
    this.focus.copy(v.pos);
    // free look (mouse drag / right stick / G)
    this.lookYaw = clamp(this.lookYaw - md.dx * 0.004 - I.axes.lookX * dt * 2, -2.6, 2.6);
    this.lookPitch = clamp(this.lookPitch - md.dy * 0.003 - I.axes.lookY * dt * 1.5, -0.6, 0.6);
    if (this.touchLook) { this.lookYaw = clamp(this.lookYaw - this.touchLook.dx * 0.006, -2.6, 2.6); this.lookPitch = clamp(this.lookPitch - this.touchLook.dy * 0.004, -0.6, 0.6); this.touchLook.dx = this.touchLook.dy = 0; }
    if (!md.dragging && !(this.touchLook?.active) && Math.abs(I.axes.lookX) < 0.1) { this.lookYaw *= Math.exp(-dt * 2.5); this.lookPitch *= Math.exp(-dt * 2.5); }
    if (I.key('look')) this.lookYaw = Math.PI; // look back
    const speedK = clamp(v.speed / 50, 0, 1);
    let fov = 60 + speedK * 12;
    const ck = this.camMode === 'cockpit';
    this.model.setCockpitView?.(ck); // real-model cars swap in the detailed cabin for the first-person view
    if (ck && this.model.parts.eye) {
      // driver's eye rides on the (pitching / rolling) body; the head lags the g-forces a little
      const hk = this.headK ||= { x: 0, y: 0, z: 0 }, kk = this.camSnap ? 1 : 1 - Math.exp(-dt * 6);
      hk.x = lerp(hk.x, clamp(-(v.ay || 0) * 0.0032, -0.035, 0.035), kk);
      hk.z = lerp(hk.z, clamp(-(v.ax || 0) * 0.0028, -0.03, 0.03), kk);
      hk.y = lerp(hk.y, clamp(-Math.abs(v.ay || 0) * 0.0006 - Math.max(0, -(v.ax || 0)) * 0.0008, -0.012, 0), kk);
      const bg = this.model.bodyG; this.model.root.updateMatrixWorld(true);
      const eye = this.model.parts.eye.clone().add(new THREE.Vector3(hk.x, hk.y, hk.z));
      const world = bg.localToWorld(eye);
      cam.position.copy(world);
      const pa = this.lookPitch - (this.model.parts.eyePitch ?? 0.07);
      const dir = new THREE.Vector3(Math.sin(this.lookYaw) * Math.cos(pa), Math.sin(pa), Math.cos(this.lookYaw) * Math.cos(pa));
      dir.transformDirection(bg.matrixWorld);
      cam.up.set(0, 1, 0); cam.lookAt(world.clone().add(dir));
      cam.rotateZ(-v.roll * 0.35 - hk.x * 0.6); // body roll partly, head tilts into the corner slightly
      fov = 72 + speedK * 4;
      this.camVel = null;
      this.model.renderMirrors?.(this.renderer, this.scene, this.frame);
    } else if (this.camMode === 'cockpit' || this.camMode === 'hood') {
      const eye = new THREE.Vector3(0, H + 0.05, L * 0.12);
      const world = eye.applyAxisAngle(up, v.yaw).add(v.pos);
      cam.position.copy(world);
      const dir = new THREE.Vector3(Math.sin(v.yaw + this.lookYaw) * Math.cos(this.lookPitch - 0.06), Math.sin(this.lookPitch - 0.06) + (v.grade || 0), Math.cos(v.yaw + this.lookYaw) * Math.cos(this.lookPitch - 0.06));
      cam.lookAt(world.clone().add(dir));
      this.camVel = null;
    } else {
      const far = this.camMode === 'far';
      const dist = (far ? 9.5 : 5.6) + L * 0.45 + (this.camMode === 'orbit' ? 3 : 0);
      const height = (far ? 3.2 : 1.7) + H * 0.35;
      // follow velocity direction a bit when drifting
      // follow the velocity direction a bit when drifting (forward only, so reversing doesn't swing the camera)
      const vdir = v.vx > 3 ? new THREE.Vector3(v.vel.x, 0, v.vel.z).normalize() : f;
      const heading = f.clone().lerp(vdir, 0.35).normalize();
      // smooth the camera's angle around the car (not its world position) so it stays locked on at 200+ km/h
      // instead of trailing further and further behind; slight pull-back with speed for a sense of pace
      const yawT = Math.atan2(heading.x, heading.z);
      if (this.camSnap || this.camYaw === undefined) this.camYaw = yawT;
      this.camYaw += Math.atan2(Math.sin(yawT - this.camYaw), Math.cos(yawT - this.camYaw)) * (1 - Math.exp(-dt * (far ? 4 : 7)));
      const yaw = this.camYaw + this.lookYaw + (this.camMode === 'orbit' ? this.orbit.yaw : 0);
      if (this.camMode === 'orbit') { this.orbit.yaw += dt * 0.25; }
      const dist2 = dist + speedK * 0.9;
      const want = new THREE.Vector3(v.pos.x - Math.sin(yaw) * dist2, v.pos.y + height + this.lookPitch * 4, v.pos.z - Math.cos(yaw) * dist2);
      // keep camera above ground / deck
      const gy = this.net.query(want.x, want.z, v.pos.y + 2, (x, z) => this.world.ground(x, z)).y;
      want.y = Math.max(want.y, gy + 0.6);
      const off = want.sub(v.pos); // offset relative to the car, smoothed
      if (this.camSnap || !this.camOff) { this.camOff = off.clone(); this.camSnap = false; }
      this.camOff.lerp(off, 1 - Math.exp(-dt * (far ? 6 : 10)));
      this.camPos = v.pos.clone().add(this.camOff);
      cam.position.copy(this.camPos);
      const look = v.pos.clone().add(new THREE.Vector3(0, H * 0.75, 0)).addScaledVector(f, 1.5);
      cam.lookAt(look);
    }
    if (this.shake > 0 && this.settings.shake) { cam.position.x += (Math.random() - 0.5) * this.shake * 0.15; cam.position.y += (Math.random() - 0.5) * this.shake * 0.15; this.shake *= Math.exp(-dt * 6); }
    if (this.settings.shake && v.speed > 30 && this.camMode !== 'orbit') { cam.position.y += (Math.random() - 0.5) * 0.004 * v.speed / 30; }
    if (Math.abs(cam.fov - fov) > 0.1) { cam.fov = lerp(cam.fov, fov, 1 - Math.exp(-dt * 3)); cam.updateProjectionMatrix(); }
    // the sea plane runs under the whole map just below ground level; in an open cutting on land (K1 at Ishikawachō …)
    // it would show as a sheet of water across the trench and hide the car → hide it while the camera is down there
    const sea = this.world.sea; if (sea) sea.visible = !(cam.position.y < 0.3 && this.world.isLand(cam.position.x, cam.position.z));
  }

  // ───────────────────────── main loop ─────────────────────────
  loop() {
    const now = performance.now();
    let dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.frame++;
    this.fpsAcc = (this.fpsAcc || 0) + dt; this.fpsN = (this.fpsN || 0) + 1;
    if (this.fpsAcc > 0.5) { this.fps = this.fpsN / this.fpsAcc; this.fpsAcc = 0; this.fpsN = 0; this.autoQuality(); }
    const I = this.input; I.poll(dt);
    if (I.act('pause') && (this.mode === 'drive' || this.mode === 'walk')) this.ui.togglePause();
    const paused = this.ui.paused;
    if (!paused) {
      this.tod.scale = 24 * this.settings.timeSpeed;
      if (this.mode === 'drive') this.updateDrive(dt);
      else if (this.mode === 'walk') { this.updateWalk(dt); this.idleVehicle(dt); }
      this.traffic.update(dt, this.env || { night: 1 });
      try { this.trains?.update(dt, this.focus, this.env?.night ?? 1); } catch (e) { console.warn('trains', e); this.trains = null; }
      try { this.walkers?.update(dt, this.focus, this.env?.night ?? 1); } catch (e) { console.warn('walkers', e); this.walkers = null; }
      try { this.planes?.update(dt, this.focus, this.env?.night ?? 1); } catch (e) { console.warn('planes', e); this.planes = null; }
      this.npc.update(dt);
      this.toll.update(dt);
      this.online.update(dt);
      this.accidents.update(dt);
    }
    if (I.act('map')) this.ui.toggleMap();
    if (I.act('photo')) this.ui.togglePhoto();
    this.updateCamera(dt);
    this.env = this.tod.update(paused ? 0 : dt, this.focus);
    if (this.fx && !paused) { try { this.fx.update(dt); } catch (e) { console.warn('fx', e); } }
    if (this.nav && !paused) { try { this.nav.update(dt); this.snapUpdate(dt); } catch (e) { console.warn('nav', e); } }
    if (this.weather) { try { const w = this.weather.update(paused ? 0 : dt, this.camera, this.env); this.env.rain = w.rain; this.env.wet = w.wet; } catch (e) { console.warn('weather', e); this.weather = null; } }
    this.world.update(dt, this.env);
    this.world.updateDynamicLights(dt, this.focus, this.env.night);
    this.world.city?.update(dt, this.focus, this.env.night);
    // audio listener & environment
    if (this.audio.ready) {
      const cam = this.camera; const fw = new THREE.Vector3(); cam.getWorldDirection(fw);
      this.audio.setListener(cam.position, fw, cam.up);
      const inPA = this.focus.x > PA_RECT.x0 && this.focus.x < PA_RECT.x1 && this.focus.z > PA_RECT.z0 && this.focus.z < PA_RECT.z1;
      const city = this.world.city, onLand = this.world.isLand(this.focus.x, this.focus.z);
      const inCity = city && onLand && !inPA && this.focus.y < 8 && Math.hypot(this.focus.x - 150, this.focus.z + 100) > 900 ? 1 : 0;
      const ch = inCity ? city.chimeAt(this.focus) : { chime: 0, vol: 0 };
      this.audio.setEnvironment({ night: this.env.night, rain: this.env.rain || 0, inside: this.camMode === 'cockpit' && this.mode === 'drive', inPA, inCity, chime: ch.chime, chimeVol: ch.vol, nearSea: !onLand || this.focus.y > 10, speedWind: this.mode === 'drive' ? this.vehicle.speed * (this.vehicle.car.open ? 1 : 0.3) : 0 });
      if (this.radio && this.vehicle) this.radio.update({ position: this.vehicle.pos, interior: this.mode === 'drive' && (this.camMode === 'cockpit' || this.camMode === 'hood' || this.camMode === 'chase'), openness: this.openness ?? 0, speed: this.vehicle.speed });
      this.audio.update(dt);
    }
    this.ui.update(dt);
    I.endFrame();
    if (this.bloom) this.bloom.strength = 0.16 + 0.3 * (this.env?.night ?? 1);
    if (this.grade) this.grade.uniforms.night.value = this.env?.night ?? 1;
    if (this.composer && (this.bloom.enabled || this.quality !== 'low')) this.composer.render(); else this.renderer.render(this.scene, this.camera);
  }
  idleVehicle(dt) {
    const v = this.vehicle; if (!v) return;
    v.ctl.throttle = 0; v.ctl.brake = 0; v.ctl.steer = 0; v.handbrakeOn = true;
    v.update(dt, this.net, this.world);
    this.model.update(dt, { steer: v.steerAng, spin: v.spin, susp: [0, 0, 0, 0], pitch: 0, roll: 0 });
    this.model.root.position.copy(v.pos); this.model.root.rotation.y = v.yaw;
    this.engineSnd?.update({ rpm: v.engine.rpm, throttle: 0, load: 0, running: v.engine.running, cranking: false, boost: 0, speed: 0, slip: 0, position: v.pos, interior: false, openness: this.openness ?? 0 });
  }
  autoQuality() {
    // dynamic resolution if fps drops
    if (!this.fps || this.mode === 'title') return;
    const r = this.renderer; const pr = r.getPixelRatio();
    const base = Math.min(devicePixelRatio, isMobile ? 1.5 : 2) * this.settings.resScale;
    if (this.fps < 28 && pr > 0.6) r.setPixelRatio(Math.max(0.6, pr * 0.85));
    else if (this.fps > 55 && pr < base) r.setPixelRatio(Math.min(base, pr * 1.08));
    else return;
    this.composer.setPixelRatio?.(r.getPixelRatio()); this.composer.setSize(innerWidth, innerHeight);
  }

  // ───────────────────────── garage ─────────────────────────
  openGarage() {
    // the garage opens wherever you have stopped (not only in the PA): the new car is set down in the same place
    const v = this.vehicle; this.garageAt = v ? { pos: v.pos.clone(), yaw: v.yaw } : null;
    this.mode = 'garage';
    if (this.vehicle) { this.scene.remove(this.model.root); }
    this.engineSnd?.update({ rpm: 0, throttle: 0, load: 0, running: false, cranking: false, boost: 0, speed: 0, slip: 0, position: this.focus, interior: false, openness: 0 });
    this.previewCar(this.garage.car);
    this.ui.showGarage();
  }
  previewCar(id) {
    if (this.preview) { this.scene.remove(this.preview.root); this.preview.dispose(); }
    this.preview = this.buildPlayerCar(id);
    const at = this.garageAt && !PA.inLot(this.garageAt.pos.x, this.garageAt.pos.z, 0) ? this.garageAt : null;
    if (at) { this.preview.root.position.copy(at.pos); this.preview.root.rotation.y = at.yaw; } else { this.preview.root.position.set(96, 0, -46); this.preview.root.rotation.y = -0.5; }
    this.preview.lights.head = this.env?.night > 0.4; this.preview.update(0.016, {});
    this.scene.add(this.preview.root);
    this.previewId = id;
    this.orbit.dist = 6 + CAR_BY_ID[id].L / 2000;
    if (!this.preview.isGlb) loadManifest().then(() => hasGlb(id) && requestGlb(id).then(() => { if (this.previewId === id && this.preview && !this.preview.isGlb && this.mode === 'garage') this.previewCar(id); }).catch(() => {}));
  }
  applyPreview(patch) {
    const id = this.previewId; this.garage.cars[id] = { ...this.carSetup(id), ...(this.garage.cars[id] || {}), ...patch }; this.saveGarage();
    const p = this.preview; const s = this.carSetup(id);
    if (patch.color) p.setPaint(patch.color);
    if (patch.finish) p.setFinish(patch.finish);
    if (patch.rim) p.setRimColor(patch.rim);
    if (patch.plate) p.setPlate(patch.plate);
    if ('camberF' in patch || 'camberR' in patch || 'ride' in patch || 'track' in patch) p.setStance({ camberF: s.camberF, camberR: s.camberR, ride: s.ride, track: s.track });
  }
  quickStart() { this.unlockAudio(); this.startDrive(CAR_BY_ID[this.garage.car] ? this.garage.car : 'r34'); }
  closeGarage(drive) {
    if (this.preview) { this.scene.remove(this.preview.root); this.preview.dispose(); this.preview = null; }
    const away = this.garageAt && !PA.inLot(this.garageAt.pos.x, this.garageAt.pos.z, 0);
    if (drive) { if (!away && this.mySpot) this.mySpot.taken = false; this.startDrive(this.previewId, !!away); }
    else if (this.vehicle) { this.scene.add(this.model.root); this.mode = 'drive'; this.ui.showHUD(); }
    else { this.mode = 'title'; this.ui.showTitle(); }
  }
  setOutfit(o) { this.outfit = o; save('dn.outfit', o); if (currentUser()) try { updateUser({ profile: { outfitFull: o } }); } catch {} if (this.player) this.player.h.setOutfit(o); this.online?.announce(); }
}

const game = new Game();
game.init().catch(e => { console.error(e); document.getElementById('fatal')?.classList.add('show'); const el = document.getElementById('fatal-msg'); if (el) el.textContent = String(e?.message || e); });
export default game;
