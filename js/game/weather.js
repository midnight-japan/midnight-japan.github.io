// Weather: clear / cloudy / rain (or automatic changes). Rain = falling streaks around the camera, overcast sky,
// thicker grey fog, wet roads that turn glossy and reflect the lights (roughness ↓, colour ↓), less tyre grip,
// and the hiss of rain. Roads stay wet for a while after the rain stops.
import * as THREE from 'three';

export const WEATHER_MODES = ['auto', 'clear', 'cloudy', 'rain'];

export class Weather {
  constructor(game) {
    this.g = game; this.rain = 0; this.cloud = 0.3; this.wet = 0; this.t = 0; this.autoT = 0; this.autoState = 'clear';
    const N = { low: 2500, medium: 5000, high: 8000, ultra: 12000 }[game.quality] ?? 5000;
    const pos = new Float32Array(N * 2 * 3), seed = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { const x = (Math.random() - 0.5) * 70, y = Math.random() * 40, z = (Math.random() - 0.5) * 70; pos.set([x, y, z, x, y, z], i * 6); seed[i * 2] = 0; seed[i * 2 + 1] = 1; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('tail', new THREE.BufferAttribute(seed, 1));
    this.uni = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uRain: { value: 0 }, uWind: { value: new THREE.Vector2(1.5, 0.6) }, uNight: { value: 1 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.uni, transparent: true, depthWrite: false,
      vertexShader: `attribute float tail; uniform float uT; uniform vec3 uCam; uniform vec2 uWind; varying float vA;
        void main(){ vec3 p = position; float fall = 11.0;
          p.y = mod(p.y - uT * fall, 40.0) - 12.0;
          vec3 w = p; w.xz = mod(w.xz - uCam.xz + 35.0, 70.0) - 35.0; w.xz += uCam.xz; w.y += uCam.y;
          w.xz += uWind * (tail * 0.08); w.y += tail * 0.55;           // streak length (motion blur)
          vA = 1.0 - tail * 0.7;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
      fragmentShader: `uniform float uRain, uNight; varying float vA; void main(){ gl_FragColor = vec4(vec3(0.75, 0.8, 0.88) * (0.6 + 0.4 * (1.0 - uNight)), 0.32 * uRain * vA); }`,
    });
    this.streaks = new THREE.LineSegments(g, m); this.streaks.frustumCulled = false; this.streaks.visible = false; this.streaks.renderOrder = 3;
    game.scene.add(this.streaks);
    this.wetMats = null;
  }
  target() {
    const mode = this.g.settings.weather || 'auto';
    if (mode !== 'auto') return mode;
    return this.autoState;
  }
  collect() {
    // road / ground / pavement materials that get wet (from the hand-built world and the streamed city)
    const set = new Set(); const c = this.g.world.city;
    if (c) for (const m of [c.mRoad, c.mWalk, c.mLand, c.mPaint, ...Object.values(c.mGround || {})]) if (m) set.add(m);
    this.g.world.group.traverse(o => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { const src = m?.map?.image?.src || m?.map?.image?.currentSrc || ''; if (m?.isMeshStandardMaterial && /asphalt|concrete|paving|pavement/.test(src)) set.add(m); } });
    this.wetMats = [...set].map(m => ({ m, r: m.roughness, c: m.color.clone(), e: m.envMapIntensity ?? 1 }));
    this._n = this.wetMats.length;
  }
  update(dt, cam, env) {
    this.t += dt;
    // automatic weather: a new state every few in-game hours
    this.autoT -= dt;
    if (this.autoT <= 0) { this.autoT = 240 + Math.random() * 360; const r = Math.random(); this.autoState = r < 0.5 ? 'clear' : r < 0.78 ? 'cloudy' : 'rain'; }
    const tg = this.target();
    const rainT = tg === 'rain' ? 1 : 0, cloudT = tg === 'clear' ? 0.3 : tg === 'cloudy' ? 0.8 : 0.97;
    this.rain += (rainT - this.rain) * Math.min(1, dt * 0.15);
    this.cloud += (cloudT - this.cloud) * Math.min(1, dt * 0.1);
    this.wet += ((this.rain > 0.2 ? 1 : 0) - this.wet) * Math.min(1, dt * (this.rain > 0.2 ? 0.08 : 0.012));
    // sky / light / fog on top of the time of day
    const tod = this.g.tod; const cu = tod.clouds?.material.uniforms;
    if (cu?.cover) cu.cover.value = this.cloud * 0.95;
    const oc = Math.max(0, this.cloud - 0.3) / 0.67; // 0 clear … 1 overcast
    tod.sun.intensity *= 1 - 0.8 * oc; tod.hemi.intensity *= 1 - 0.25 * oc;
    const fog = this.g.scene.fog; if (fog) { fog.density += 0.00022 * this.rain + 0.00003 * oc; fog.color.lerp(new THREE.Color(env.night > 0.5 ? 0x1a2028 : 0x8a939c), 0.6 * Math.max(oc, this.rain)); }
    this.g.scene.environmentIntensity = (this.g.scene.environmentIntensity ?? 1) * (1 - 0.35 * oc);
    // rain streaks follow the camera
    this.streaks.visible = this.rain > 0.03 && cam.position.y < 400;
    this.uni.uT.value = this.t; this.uni.uCam.value.copy(cam.position); this.uni.uRain.value = this.rain; this.uni.uNight.value = env.night;
    // wet surfaces
    if (!this.wetMats || (this._ct = (this._ct || 0) - dt) <= 0) { this._ct = 10; this.collect(); }
    if (Math.abs((this._lw ?? -1) - this.wet) > 0.01) {
      this._lw = this.wet;
      for (const { m, r, c, e } of this.wetMats) { m.roughness = r * (1 - 0.72 * this.wet); m.color.copy(c).multiplyScalar(1 - 0.32 * this.wet); m.envMapIntensity = e * (1 + 1.6 * this.wet); }
    }
    this.g.world.wetGrip = 1 - 0.2 * this.wet;
    return { rain: this.rain, wet: this.wet, overcast: oc };
  }
}
