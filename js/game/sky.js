// Time of day: 30 real minutes = 12 game hours (1 real second = 24 game seconds).
// Sun/moon, physical sky, stars, fog, light rigs and HDRI environment blending.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { hdriList, assetURL } from './textures.js';

export const TIME_SCALE = 24; // game seconds per real second
const LAT = 35.46 * Math.PI / 180;

export class TimeOfDay {
  constructor(scene, renderer, quality) {
    this.scene = scene; this.renderer = renderer; this.q = quality;
    this.hours = 21.5; // start at night — car-meet time
    this.paused = false; this.scale = TIME_SCALE;
    this.sky = new Sky(); this.sky.scale.setScalar(80000);
    const u = this.sky.material.uniforms;
    u.turbidity.value = 2.2; u.rayleigh.value = 2.4; u.mieCoefficient.value = 0.003; u.mieDirectionalG.value = 0.82;
    scene.add(this.sky);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = quality !== 'low';
    const sz = quality === 'ultra' ? 4096 : quality === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(sz, sz);
    const c = this.sun.shadow.camera; c.left = -70; c.right = 70; c.top = 70; c.bottom = -70; c.near = 10; c.far = 600;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x3a3a3a, 0.6); scene.add(this.hemi);
    this.moonLight = new THREE.DirectionalLight(0x9db4ff, 0.0); scene.add(this.moonLight);
    scene.fog = new THREE.FogExp2(0x9fb4c8, 0.00018);
    // stars
    const n = 2500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection(); if (v.y < 0.05) v.y = Math.abs(v.y) + 0.05; v.setLength(15000); pos.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    scene.add(this.stars);
    // moon
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(160, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf3f1e6, fog: false }));
    scene.add(this.moon);
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.env = { day: null, night: null, dusk: null };
    this.night = 0; this.sunDir = new THREE.Vector3();
    this._envT = 0;
    this.loadHDRI();
  }
  async loadHDRI() {
    const list = hdriList(); const loader = new HDRLoader();
    for (const [name, info] of Object.entries(list)) {
      try {
        const tex = await loader.loadAsync(assetURL(info.file));
        tex.mapping = THREE.EquirectangularReflectionMapping;
        const rt = this.pmrem.fromEquirectangular(tex); tex.dispose();
        this.env[info.kind] = rt.texture;
      } catch (e) { console.warn('hdri', name, e); }
    }
    this._envDirty = true;
  }
  get clock() { const h = Math.floor(this.hours) % 24, m = Math.floor((this.hours % 1) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
  setHours(h) { this.hours = ((h % 24) + 24) % 24; this._envDirty = true; }

  update(dt, focus) {
    if (!this.paused) this.hours = (this.hours + dt * this.scale / 3600) % 24;
    // sun position: simple solar model (equinox-ish), azimuth from south
    const H = (this.hours - 12) / 12 * Math.PI; // hour angle
    const decl = 0.15;
    const alt = Math.asin(Math.sin(LAT) * Math.sin(decl) + Math.cos(LAT) * Math.cos(decl) * Math.cos(H));
    const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LAT) - Math.tan(decl) * Math.cos(LAT));
    // world: +z south, +x east. az=0 → south
    const d = this.sunDir.set(-Math.sin(az) * Math.cos(alt), Math.sin(alt), Math.cos(az) * Math.cos(alt)).normalize();
    this.sky.material.uniforms.sunPosition.value.copy(d);
    const day = THREE.MathUtils.smoothstep(d.y, -0.12, 0.12);
    this.night = 1 - day;
    const golden = THREE.MathUtils.smoothstep(d.y, -0.05, 0.2) * (1 - THREE.MathUtils.smoothstep(d.y, 0.2, 0.5));
    // sun light follows focus for shadows
    const sunPos = focus.clone().addScaledVector(d, 300);
    this.sun.position.copy(sunPos); this.sun.target.position.copy(focus);
    // sky dome & stars travel with the player (the map now spans ~30 km of Tokyo Bay)
    this.sky.position.set(focus.x, 0, focus.z); this.stars.position.set(focus.x, 0, focus.z);
    this.sun.intensity = 2.4 * THREE.MathUtils.smoothstep(d.y, -0.02, 0.15);
    this.sun.color.setHSL(0.09 + 0.04 * (1 - golden), 0.6 * golden + 0.1, 0.6 + 0.3 * (1 - golden));
    this.sun.visible = this.sun.intensity > 0.01;
    // moon opposite-ish
    const md = d.clone().negate(); md.y = Math.abs(md.y) * 0.8 + 0.25; md.normalize();
    this.moon.position.copy(focus).addScaledVector(md, 12000);
    this.moonLight.position.copy(focus).addScaledVector(md, 300); this.moonLight.target = this.sun.target;
    this.moonLight.intensity = 0.25 * this.night;
    this.hemi.intensity = 0.42 + 0.23 * day;
    this.hemi.color.setHSL(0.62, 0.35, 0.42 + 0.35 * day);
    this.hemi.groundColor.setHSL(0.08, 0.15, 0.08 + 0.2 * day);
    this.stars.material.opacity = THREE.MathUtils.smoothstep(this.night, 0.6, 1);
    this.moon.visible = this.night > 0.3;
    // sky shader is too dark at night → hide it and use a night gradient background
    this.sky.visible = d.y > -0.2;
    const fogDay = new THREE.Color(0x9fb6cf), fogNight = new THREE.Color(0x0a1220), fogGold = new THREE.Color(0xd9a37a);
    const fc = fogDay.clone().lerp(fogGold, golden * 0.6).lerp(fogNight, this.night);
    this.scene.fog.color.copy(fc);
    this.scene.fog.density = 0.000045 + 0.00004 * this.night; // long view distance: Tokyo Bay skyline stays visible
    if (!this.sky.visible) this.scene.background = fc.clone().multiplyScalar(0.9); else this.scene.background = null;
    this.renderer.toneMappingExposure = 0.62 + 0.12 * day + 0.25 * this.night;
    // environment (reflections): blend between HDRIs by switching (PMREM textures can't be lerped cheaply)
    const want = this.night > 0.7 ? 'night' : this.night > 0.25 ? 'dusk' : 'day';
    if (want !== this._envKind || this._envDirty) {
      const tex = this.env[want] || this.env.day || this.env.night || null;
      if (tex) { this.scene.environment = tex; this._envKind = want; this._envDirty = false; }
    }
    this.scene.environmentIntensity = 0.12 + 0.5 * day;
    return { night: this.night, day, golden, sunDir: d };
  }
}
