// Seasons (v2.9): spring / summer / autumn / winter, or 'auto' from the real date (Japan). Drives the tree colours
// (flora.js: cherry blossom in spring, fresh green summer, autumn colour, bare deciduous trees in winter) and a
// particle layer around the camera: cherry petals drifting in spring (thick on the Hakone touge and in parks), falling
// leaves in autumn, snow instead of rain in winter. One Points draw call, sprite shapes drawn in the shader.
import * as THREE from 'three';
import { setSeason } from './flora.js';

export const SEASONS = ['auto', 'spring', 'summer', 'autumn', 'winter'];
export function seasonOf(setting, date = new Date()) {
  if (setting && setting !== 'auto') return setting;
  const m = date.getMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
}

export class SeasonFX {
  constructor(game) {
    this.g = game; this.season = null;
    const N = { low: 700, medium: 1400, high: 2600, ultra: 3600 }[game.quality] ?? 1400;
    const pos = new Float32Array(N * 3), rnd = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 80; pos[i * 3 + 1] = Math.random() * 36; pos[i * 3 + 2] = (Math.random() - 0.5) * 80; rnd[i] = Math.random(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aR', new THREE.BufferAttribute(rnd, 1));
    this.uni = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uKind: { value: 0 }, uAmt: { value: 0 }, uNight: { value: 0 }, uPx: { value: 1 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.uni, transparent: true, depthWrite: false,
      vertexShader: `attribute float aR; uniform float uT, uKind, uAmt, uPx; uniform vec3 uCam; varying float vR; varying float vA;
        void main(){ vec3 p = position; vR = aR;
          float fall = uKind == 2.0 ? 1.1 + aR * 0.6 : 0.9 + aR * 0.7;           // snow / petals & leaves: slow
          p.y = mod(p.y - uT * fall, 36.0) - 8.0;
          float sw = uT * (0.6 + aR) + aR * 40.0; p.x += sin(sw) * 1.4 + uT * 0.8; p.z += cos(sw * 0.8) * 1.1 + uT * 0.3; // sway + breeze
          vec3 w = p; w.xz = mod(w.xz - uCam.xz + 40.0, 80.0) - 40.0; w.xz += uCam.xz; w.y += uCam.y;
          vA = step(aR, uAmt);                                                       // density = share of particles shown
          vec4 mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = (uKind == 2.0 ? 0.09 : 0.14) * uPx / max(1.0, -mv.z) * (0.7 + aR * 0.6); }`,
      fragmentShader: `uniform float uKind, uNight; varying float vR; varying float vA;
        void main(){ if (vA < 0.5) discard; vec2 q = gl_PointCoord * 2.0 - 1.0;
          float a = sin(vR * 40.0), c = cos(vR * 40.0); q = vec2(c * q.x - a * q.y, a * q.x + c * q.y);
          float al; vec3 col;
          if (uKind == 2.0) { al = smoothstep(1.0, 0.2, length(q)); col = vec3(1.0); }                        // snow flake
          else { vec2 e = q * vec2(1.0, 1.9); al = smoothstep(1.0, 0.75, length(e));                             // petal / leaf
            if (uKind == 1.0) { al *= smoothstep(0.0, 0.25, abs(q.x + 0.85) + q.y * q.y * 2.0); col = mix(vec3(1.0, 0.8, 0.86), vec3(1.0, 0.92, 0.95), vR); } // notched sakura petal
            else col = mix(vec3(0.85, 0.35, 0.1), vec3(0.9, 0.7, 0.15), vR); }
          gl_FragColor = vec4(col * mix(1.0, 0.35, uNight), al * 0.95); }`,
    });
    // v2.9: petals / leaves kicked up behind the car when it drives through them (CPU pool, one draw call)
    const K = 160; this.kick = { n: K, p: new Float32Array(K * 3), v: new Float32Array(K * 3), life: new Float32Array(K), next: 0, acc: 0 };
    const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.BufferAttribute(this.kick.p, 3)); const kr = new Float32Array(K); for (let i = 0; i < K; i++) kr[i] = Math.random(); kg.setAttribute('aR', new THREE.BufferAttribute(kr, 1));
    const km = m.clone(); km.uniforms = this.kU = { ...THREE.UniformsUtils.clone(this.uni) };
    km.vertexShader = `attribute float aR; uniform float uPx; varying float vR; varying float vA; void main(){ vR = aR; vA = 1.0; vec4 mv = viewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 0.13 * uPx / max(1.0, -mv.z); }`;
    this.kpts = new THREE.Points(kg, km); this.kpts.frustumCulled = false; this.kpts.renderOrder = 3; this.kpts.visible = false; game.scene.add(this.kpts);
    this.pts = new THREE.Points(geo, m); this.pts.frustumCulled = false; this.pts.renderOrder = 3; this.pts.visible = false;
    game.scene.add(this.pts);
    this.apply();
  }
  // (re)apply the season from the settings — recolours every tree already built
  apply() { const s = seasonOf(this.g.settings?.season); if (s === this.season) return s; this.season = s; setSeason(s); return s; }
  update(dt, cam) {
    const s = this.apply(), U = this.uni, W = this.g.weather;
    U.uT.value += dt; U.uCam.value.copy(cam.position); U.uPx.value = this.g.renderer.domElement.height * 0.9; U.uNight.value = this.g.tod?.night ?? 0;
    const p = cam.position, hakone = p.x < -30000;
    let kind = 0, amt = 0;
    if (s === 'winter' && W && W.rain > 0.02) { kind = 2; amt = W.rain; if (W.uni) W.uni.uRain.value = 0; } // snow instead of rain
    else if (s === 'spring') { kind = 1; amt = hakone ? 0.55 : 0.12; }
    else if (s === 'autumn') { kind = 3; amt = hakone ? 0.3 : 0.06; }
    U.uKind.value = kind; U.uAmt.value = amt; this.pts.visible = kind > 0 && amt > 0;
    // kick-up behind the wheels: spring petals / autumn leaves lying on the road, thickest on the Hakone touge
    const v = this.g.vehicle, k = this.kick, kU = this.kU; kU.uKind.value = s === 'spring' ? 1 : 3; kU.uPx.value = U.uPx.value; kU.uNight.value = U.uNight.value;
    if (v && this.g.mode === 'drive' && (s === 'spring' || s === 'autumn') && v.onRoad && !(v.airborne > 0)) { const sp = Math.abs(v.vx || 0), litter = v.road?.kind === 'mountain', rate = sp > 6 && litter ? 60 * Math.min(1, sp / 30) : 0; // v2.11.1: only where leaves / petals lie (tree-lined touge), not on clean streets k.acc += rate * dt;
      while (k.acc >= 1) { k.acc -= 1; const i = k.next; k.next = (k.next + 1) % k.n; const f = v.forward, side = Math.random() < 0.5 ? 1 : -1, l = v.left;
        k.p[i * 3] = v.pos.x - f.x * 1.6 + l.x * side * 0.8; k.p[i * 3 + 1] = v.pos.y + 0.1; k.p[i * 3 + 2] = v.pos.z - f.z * 1.6 + l.z * side * 0.8;
        k.v[i * 3] = v.vel.x * 0.35 + (Math.random() - 0.5) * 2 + l.x * side * 1.5; k.v[i * 3 + 1] = 1.5 + Math.random() * 2.5 + sp * 0.05; k.v[i * 3 + 2] = v.vel.z * 0.35 + (Math.random() - 0.5) * 2 + l.z * side * 1.5; k.life[i] = 2.5 + Math.random() * 1.5; } }
    let any = false;
    for (let i = 0; i < k.n; i++) { if (k.life[i] <= 0) { k.p[i * 3 + 1] = -1e4; continue; } any = true; k.life[i] -= dt; const j = i * 3;
      k.v[j] *= 1 - dt * 1.2; k.v[j + 2] *= 1 - dt * 1.2; k.v[j + 1] = Math.max(-0.9, k.v[j + 1] - 3.5 * dt); // light: drag + slow fall
      k.p[j] += (k.v[j] + Math.sin(k.life[i] * 5 + i) * 0.6) * dt; k.p[j + 1] += k.v[j + 1] * dt; k.p[j + 2] += k.v[j + 2] * dt; if (k.p[j + 1] < (v?.pos.y ?? 0) - 0.5) k.life[i] = 0; }
    this.kpts.visible = any; if (any) this.kpts.geometry.attributes.position.needsUpdate = true;
  }
}
