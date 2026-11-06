// Driving effects: skid marks (ring buffer of dark quads on the road), tyre smoke (soft billboard puffs) and body
// damage — the panels around an impact are pushed in, scaled by the impact speed. AI cars always take damage; the
// player's car only when 'damage' is on in the settings. Repair restores the original geometry.
import * as THREE from 'three';

const MAX_Q = 3000, PUFFS = 90;

function smokeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 9; i++) { // lumpy, not a perfect disc
    const x = 64 + (Math.random() - 0.5) * 34, y = 64 + (Math.random() - 0.5) * 34, r = 26 + Math.random() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(235,235,235,.32)'); gr.addColorStop(1, 'rgba(235,235,235,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Fx {
  constructor(game) {
    this.g = game;
    // skid marks
    const pos = new Float32Array(MAX_Q * 4 * 3), alpha = new Float32Array(MAX_Q * 4), idx = new Uint32Array(MAX_Q * 6);
    for (let q = 0; q < MAX_Q; q++) { const v = q * 4; idx.set([v, v + 1, v + 2, v, v + 2, v + 3], q * 6); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('a', new THREE.BufferAttribute(alpha, 1)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      vertexShader: 'attribute float a; varying float vA; void main(){ vA = a; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(0.03, 0.03, 0.035, vA); }',
    });
    this.skid = new THREE.Mesh(geo, mat); this.skid.frustumCulled = false; this.skid.renderOrder = 1; game.scene.add(this.skid);
    this.q = 0; this.used = 0; this.last = [null, null, null, null];
    // smoke
    const tex = smokeTexture(); this.puffs = [];
    for (let i = 0; i < PUFFS; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; game.scene.add(s); this.puffs.push({ s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: 1 }); }
    this.pi = 0; this.emitAcc = 0;
  }

  wheels(v) {
    const f = v.forward, l = v.left, a = v.a ?? v.wb * 0.47, b = v.b ?? v.wb * 0.53, tr = (v.track || 1.5) / 2;
    return [[a, tr], [a, -tr], [-b, tr], [-b, -tr]].map(([o, s]) => ({ x: v.pos.x + f.x * o + l.x * s, z: v.pos.z + f.z * o + l.z * s }));
  }

  update(dt) {
    const g = this.g, v = g.vehicle;
    if (v && g.mode === 'drive' && !v.airborne) {
      const lat = Math.abs(v.vlat), spin = Math.abs(v.slip), sp = Math.abs(v.vx);
      const lock = v.ctl?.brake > 0.85 && v.assist?.abs === false && sp > 4;
      const hb = v.ctl?.handbrake > 0.5 && sp > 3;
      const W = this.wheels(v), y = v.pos.y + 0.025;
      const dr = v.car.drive;
      for (let i = 0; i < 4; i++) {
        const rear = i >= 2, driven = dr === 'AWD' || (dr === 'FF' ? !rear : rear);
        let k = Math.max(0, (lat - (rear ? 2.2 : 3.2)) / 4) + (driven ? Math.max(0, (spin - 2.5) / 5) : 0) + (lock ? 0.6 : 0) + (hb && rear ? 0.5 : 0);
        k = Math.min(1, k);
        const p = W[i];
        if (k > 0.05 && v.onRoad !== undefined) { if (this.last[i]) this.mark(this.last[i], { x: p.x, z: p.z, y }, k); this.last[i] = { x: p.x, z: p.z, y }; }
        else this.last[i] = null;
        // smoke from the tyres that are really sliding
        if (k > 0.35 && sp + lat > 6) { this.emitAcc += dt * 28 * k; while (this.emitAcc > 1) { this.emitAcc--; this.puff(p.x, y + 0.25, p.z, v, k); } }
      }
    } else this.last = [null, null, null, null];
    for (const P of this.puffs) {
      if (P.life <= 0) continue;
      P.life -= dt; const t = 1 - P.life / P.max;
      P.s.position.x += P.vx * dt; P.s.position.y += P.vy * dt; P.s.position.z += P.vz * dt; P.vx *= 0.97; P.vz *= 0.97;
      P.s.scale.setScalar(P.size * (0.6 + t * 2.6)); P.s.material.opacity = 0.55 * (1 - t) * Math.min(1, t * 6);
      if (P.life <= 0) P.s.visible = false;
    }
  }
  mark(a, b, k) {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 0.05 || L > 3) return;
    const w = 0.11, nx = -dz / L * w, nz = dx / L * w;
    const P = this.skid.geometry.attributes.position, A = this.skid.geometry.attributes.a, q = this.q, o = q * 12;
    P.array.set([a.x + nx, a.y, a.z + nz, b.x + nx, b.y, b.z + nz, b.x - nx, b.y, b.z - nz, a.x - nx, a.y, a.z - nz], o);
    const al = 0.25 + 0.5 * k; A.array.set([al, al, al, al], q * 4);
    P.needsUpdate = true; A.needsUpdate = true;
    this.q = (q + 1) % MAX_Q; this.used = Math.min(MAX_Q, this.used + 1); this.skid.geometry.setDrawRange(0, this.used * 6);
  }
  puff(x, y, z, v, k) {
    const P = this.puffs[this.pi]; this.pi = (this.pi + 1) % PUFFS;
    P.s.position.set(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4); P.s.visible = true;
    P.max = P.life = 1.6 + Math.random() * 1.4 * k; P.size = 0.9 + k * 0.8;
    P.vx = v.vel.x * 0.25 + (Math.random() - 0.5) * 1.2; P.vz = v.vel.z * 0.25 + (Math.random() - 0.5) * 1.2; P.vy = 0.5 + Math.random() * 0.7;
  }

  // ── body damage ──
  // hit: {x, y, z} world contact point; vin: closing speed (m/s). Vertices within a radius of the contact point are
  // pushed towards the car's centre (more in the middle of the dent). Geometry is cloned per mesh on first damage.
  damage(model, hit, vin, npc = false) {
    if (!model?.root || vin < 2.5) return;
    if (!npc && !this.g.settings?.damage) return;
    const root = model.root; root.updateMatrixWorld(true);
    const centre = new THREE.Vector3(); new THREE.Box3().setFromObject(root).getCenter(centre);
    const P = new THREE.Vector3(hit.x, Math.min(centre.y + 0.2, hit.y ?? centre.y), hit.z);
    const R = THREE.MathUtils.clamp(0.45 + vin * 0.045, 0.45, 1.3), depth = THREE.MathUtils.clamp(vin * 0.012, 0.02, 0.22);
    const dirW = centre.clone().sub(P).setY(0).normalize();
    const wheelSet = new Set(); for (const w of model.parts?.wheels || []) w.steer?.traverse(o => wheelSet.add(o));
    const tmp = new THREE.Vector3(), inv = new THREE.Matrix4();
    root.traverse(o => {
      if (!o.isMesh || !o.geometry?.attributes?.position || wheelSet.has(o) || o.isSprite) return;
      const gs = o.geometry; if (!gs.boundingSphere) gs.computeBoundingSphere();
      const bs = gs.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (bs.center.distanceTo(P) > bs.radius + R) return;
      if (!o.userData.dmgOrig) { o.userData.dmgOrig = gs; const c = gs.clone(); const a = c.attributes.position;
        if (!(a.array instanceof Float32Array) || a.normalized || a.isInterleavedBufferAttribute) { const f = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); } c.setAttribute('position', new THREE.BufferAttribute(f, 3)); }
        o.geometry = c; }
      const pos = o.geometry.attributes.position; inv.copy(o.matrixWorld).invert();
      const pL = P.clone().applyMatrix4(inv);
      const dL = P.clone().add(dirW).applyMatrix4(inv).sub(pL); const sc = dL.length() || 1; dL.divideScalar(sc); // world 1 m → local units
      const RL = R * sc, DL = depth * sc; let moved = false; // sc = local units per world metre
      for (let i = 0; i < pos.count; i++) {
        tmp.fromBufferAttribute(pos, i); const d = tmp.distanceTo(pL); if (d > RL) continue;
        // smooth dent; the ripple depends only on the position so split vertices (hard edges, UV seams) move together
        const f = (1 - d / RL); const rip = 0.8 + 0.2 * Math.sin(tmp.x / sc * 9.1 + tmp.y / sc * 7.3 + tmp.z / sc * 5.7);
        const k = f * f * (3 - 2 * f) * DL * rip;
        pos.setXYZ(i, tmp.x + dL.x * k, tmp.y + dL.y * k * 0.3 - k * 0.12, tmp.z + dL.z * k); moved = true;
      }
      if (moved) { pos.needsUpdate = true; o.geometry.computeBoundingSphere(); }
    });
    model.damage = Math.min(1, (model.damage || 0) + vin / 40);
    // heavy hits: the bonnet springs open on the struck car
    if (vin > 9 && model.parts?.hood && Math.random() < 0.5) model.parts.hood.target = 0.25 + Math.random() * 0.3;
  }
  repair(model) {
    model?.root?.traverse(o => { if (o.userData.dmgOrig) { o.geometry.dispose(); o.geometry = o.userData.dmgOrig; delete o.userData.dmgOrig; } });
    if (model) { model.damage = 0; if (model.parts?.hood) model.parts.hood.target = 0; }
  }
}
