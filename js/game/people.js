// Realistic people (v2.16): rigged, skinned 3D people from Sketchfab (CC BY — see assets/CREDITS.md), baked by
// tools/people-bake.mjs into assets/models/people/. Every character shares its geometry + material with all of its
// copies (only the skeleton is cloned), and every animation clip is retargeted at run time from whichever rig it was
// recorded on (Mixamo or Renderpeople) onto each character's own skeleton, so one walk / idle / talk / phone … library
// drives every body. A Person exposes the same interface as the procedural Human of js/game/humans.js
// (object, update(dt, { speed, action }), lookAt(), dispose(), height, handL, handR) so the crowd code can use either:
// createPerson() falls back to the procedural human until the models have loaded (or if they fail to).
//
// Cost control: a person whose mesh was not drawn last frame (off screen / behind the camera) does not advance its
// skeleton at all; far people update their animation at a lower rate (the managers pass a bigger dt every few frames)
// and only people near the camera cast shadows.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createHuman } from './humans.js';

const BASE = new URL('../../assets/models/people/', import.meta.url);

// characters: sex, build height (m) and which crowds they fit. tags: office / casual / student / shopper / staff / elder
export const CHARS = [
  { id: 'shun', sex: 'm', h: 1.72, w: 2, tags: ['casual', 'office', 'student', 'shopper', 'staff', 'driver'] },
  { id: 'kana', sex: 'f', h: 1.60, w: 2.5, tags: ['casual', 'office', 'student', 'shopper', 'staff', 'driver'] },
  { id: 'eric', sex: 'm', h: 1.76, tags: ['office', 'driver'] },
  { id: 'carla', sex: 'f', h: 1.62, tags: ['office', 'shopper', 'driver'] },
  { id: 'claudia', sex: 'f', h: 1.61, tags: ['office', 'shopper', 'driver'] },
  { id: 'nathan', sex: 'm', h: 1.74, tags: ['casual', 'shopper', 'driver'] },
  { id: 'sophia', sex: 'f', h: 1.60, tags: ['casual', 'shopper', 'driver'] },
  { id: 'manuel', sex: 'm', h: 1.70, tags: ['casual', 'shopper', 'driver'] },
  { id: 'yuto', sex: 'm', h: 1.73, w: 2, tags: ['casual', 'student', 'shopper', 'staff', 'driver'] },
];
// clip library: file a_<name>.glb, loop?, and which actions use it
const CLIPS = {
  walk_m: { loop: true }, walk_f: { loop: true }, walk_rp: { loop: true },
  idle_m: { loop: true }, idle_f: { loop: true }, run: { loop: true },
  talk_m: { loop: true }, talk_f: { loop: true }, phone: { loop: true }, argue: { loop: true },
  wave: { loop: true }, kneel: { loop: true }, sit: { loop: true }, lying: { loop: true, keepXZ: true },
  hit: { loop: false, keepXZ: true }, drive: { loop: true },
};

// Mixamo bone name → Renderpeople bone name (the Mixamo names are the master keys)
const RP = { Hips: 'hip', Spine: 'spine_01', Spine1: 'spine_02', Spine2: 'spine_03', Neck: 'neck', Head: 'head' };
for (const [s, r] of [['Left', 'l'], ['Right', 'r']]) {
  Object.assign(RP, { [s + 'Shoulder']: 'shoulder_' + r, [s + 'Arm']: 'upperarm_' + r, [s + 'ForeArm']: 'lowerarm_' + r, [s + 'Hand']: 'hand_' + r,
    [s + 'UpLeg']: 'upperleg_' + r, [s + 'Leg']: 'lowerleg_' + r, [s + 'Foot']: 'foot_' + r, [s + 'ToeBase']: 'ball_' + r });
  for (const f of ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']) for (let i = 1; i <= 3; i++) RP[s + 'Hand' + f + i] = f.toLowerCase() + '_0' + i + '_' + r;
}
const MASTER = Object.keys(RP);
// the bone each bone points at in its rest pose (used to line the rest poses of two rigs up: T-pose vs A-pose)
const CHILD = { Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head' };
for (const s of ['Left', 'Right']) {
  Object.assign(CHILD, { [s + 'Shoulder']: s + 'Arm', [s + 'Arm']: s + 'ForeArm', [s + 'ForeArm']: s + 'Hand', [s + 'Hand']: s + 'HandMiddle1',
    [s + 'UpLeg']: s + 'Leg', [s + 'Leg']: s + 'Foot', [s + 'Foot']: s + 'ToeBase' });
  for (const f of ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']) { CHILD[s + 'Hand' + f + '1'] = s + 'Hand' + f + '2'; CHILD[s + 'Hand' + f + '2'] = s + 'Hand' + f + '3'; }
}

// ─────────────────────────────────────────────────────────────── rigs ──
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _s = new THREE.Vector3();
// rest (bind) pose of a loaded glTF: world matrices of every skinned bone, keyed by master bone name
function makeRig(scene) {
  scene.updateMatrixWorld(true);
  let sm = null; scene.traverse(o => { if (o.isSkinnedMesh && !sm) sm = o; });
  if (!sm) throw new Error('no skinned mesh');
  const sk = sm.skeleton, byName = new Map(); for (const b of sk.bones) byName.set(b.name, b);
  const rp = byName.has('hip') && !byName.has('Hips');
  const rig = { scene, sm, rp, bones: {}, restW: new Map(), node: n => byName.get(rp ? RP[n] : n) };
  sk.bones.forEach((b, i) => { const M = new THREE.Matrix4().copy(sm.bindMatrix).multiply(_m.copy(sk.boneInverses[i]).invert()); rig.restW.set(b, M); });
  for (const n of MASTER) { const b = rig.node(n); if (b && rig.restW.has(b)) rig.bones[n] = b; }
  rig.all = sk.bones;
  // rest world position / rotation per master bone
  rig.rp_ = {}; rig.rq = {};
  for (const n in rig.bones) { const M = rig.restW.get(rig.bones[n]); const p = new THREE.Vector3(), q = new THREE.Quaternion(); M.decompose(p, q, _s); rig.rp_[n] = p; rig.rq[n] = q; }
  // facing: the character's right side (Mixamo / RP: right leg) — the yaw that lines two rigs up
  const L = rig.rp_.LeftUpLeg, R = rig.rp_.RightUpLeg; rig.right = new THREE.Vector3(R.x - L.x, 0, R.z - L.z).normalize();
  rig.hipY = rig.rp_.Hips.y - Math.min(rig.rp_.LeftFoot?.y ?? 0, rig.rp_.RightFoot?.y ?? 0) + 0.0001;
  return rig;
}
// put every bone of a rig into its bind pose (the node TRS in a file is often the first frame of some take)
function poseRest(rig) {
  for (const b of rig.all) {
    const W = rig.restW.get(b); if (!W) continue;
    const P = b.parent && rig.restW.get(b.parent) ? rig.restW.get(b.parent) : (b.parent ? b.parent.matrixWorld : _m2.identity());
    _m.copy(P).invert().multiply(W); _m.decompose(b.position, b.quaternion, b.scale);
  }
  rig.scene.updateMatrixWorld(true);
}

// sample a clip on its own rig: world rotations of the master bones + world hip position per frame
function sampleSource(src, clip, fps) {
  const mixer = new THREE.AnimationMixer(src.scene), act = mixer.clipAction(clip); act.play();
  const T = clip.duration, n = Math.max(2, Math.round(T * fps) + 1), frames = [];
  for (let i = 0; i < n; i++) {
    const t = Math.min(T, i / (n - 1) * T); mixer.setTime(t); src.scene.updateMatrixWorld(true);
    const f = { t, q: {}, hip: new THREE.Vector3() };
    for (const k in src.bones) { const b = src.bones[k]; b.matrixWorld.decompose(_v, f.q[k] = new THREE.Quaternion(), _s); if (k === 'Hips') f.hip.copy(_v); }
    for (const k of ['LeftFoot', 'RightFoot']) if (src.bones[k]) { f[k] = new THREE.Vector3().setFromMatrixPosition(src.bones[k].matrixWorld); }
    frames.push(f);
  }
  act.stop(); mixer.uncacheRoot(src.scene); poseRest(src);
  return { T, frames };
}

// retarget sampled source frames onto a target rig → AnimationClip with the target's bone names
function retarget(src, S, tgt, name, opts = {}) {
  // yaw that turns the source's facing into the target's
  const a = Math.atan2(src.right.x, src.right.z), b = Math.atan2(tgt.right.x, tgt.right.z);
  const G = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), b - a), Gi = G.clone().invert();
  // per-bone rest alignment: C rotates the target's rest bone direction onto the (yaw-aligned) source rest direction
  const C = {}, srcRestInv = {};
  for (const k in tgt.bones) {
    if (!src.bones[k]) continue;
    srcRestInv[k] = src.rq[k].clone().invert();
    const ch = CHILD[k];
    if (ch && src.bones[ch] && tgt.bones[ch]) {
      const dS = _v.subVectors(src.rp_[ch], src.rp_[k]).applyQuaternion(G).normalize(), dT = _v2.subVectors(tgt.rp_[ch], tgt.rp_[k]).normalize();
      C[k] = new THREE.Quaternion().setFromUnitVectors(dT, dS);
    } else C[k] = new THREE.Quaternion();
  }
  // bones in parent-first order; parent world of the skeleton root comes from the scene graph
  const order = []; const walk = o => { if (o.isBone) order.push(o); for (const c of o.children) walk(c); };
  const top = tgt.all.filter(x => !x.parent?.isBone); for (const r of top) walk(r);
  const key = new Map(); for (const k in tgt.bones) key.set(tgt.bones[k], k);
  const restLocal = new Map(); for (const bn of order) { const W = tgt.restW.get(bn), P = bn.parent?.isBone ? tgt.restW.get(bn.parent) : bn.parent?.matrixWorld; if (!W || !P) continue; _m.copy(P).invert().multiply(W); const q = new THREE.Quaternion(); _m.decompose(_v, q, _s); restLocal.set(bn, q); }
  const tracks = new Map(); const times = S.frames.map(f => f.t);
  for (const bn of order) if (key.has(bn) && src.bones[key.get(bn)]) tracks.set(bn, new Float32Array(times.length * 4));
  const hipT = new Float32Array(times.length * 3);
  const kH = tgt.hipY / src.hipY;
  const f0 = S.frames[0], fN = S.frames[S.frames.length - 1];
  const worldQ = new Map(), worldM = new Map();
  const hipB = tgt.bones.Hips, hipParentW = hipB.parent?.isBone ? tgt.restW.get(hipB.parent) : hipB.parent.matrixWorld, hipParentInv = hipParentW.clone().invert();
  S.frames.forEach((f, fi) => {
    worldQ.clear();
    for (const bn of order) {
      const k = key.get(bn), parentQ = bn.parent?.isBone ? worldQ.get(bn.parent) : bn.parent.getWorldQuaternion(new THREE.Quaternion());
      let wq;
      if (tracks.has(bn)) {
        // Δ = source world rotation relative to its rest, turned into the target's frame; applied to the aligned target rest
        const d = _q.copy(f.q[k]).multiply(srcRestInv[k]); d.premultiply(G).multiply(Gi);
        wq = new THREE.Quaternion().copy(d).multiply(C[k]).multiply(tgt.rq[k]);
        const lq = _q2.copy(parentQ).invert().multiply(wq);
        tracks.get(bn).set([lq.x, lq.y, lq.z, lq.w], fi * 4);
      } else wq = new THREE.Quaternion().copy(parentQ).multiply(restLocal.get(bn) || bn.quaternion);
      worldQ.set(bn, wq);
    }
    // hips: vertical motion scaled to the target's leg length; root motion (drift along the clip) removed
    const u = S.frames.length > 1 ? fi / (S.frames.length - 1) : 0;
    const d = _v.copy(f.hip).sub(src.rp_.Hips);
    if (!opts.keepXZ) { d.x -= f0.hip.x - src.rp_.Hips.x + (fN.hip.x - f0.hip.x) * u; d.z -= f0.hip.z - src.rp_.Hips.z + (fN.hip.z - f0.hip.z) * u; }
    d.applyQuaternion(G).multiplyScalar(kH);
    const wp = _v2.copy(tgt.rp_.Hips).add(d).applyMatrix4(hipParentInv);
    hipT.set([wp.x, wp.y, wp.z], fi * 3);
  });
  const out = [];
  for (const [bn, arr] of tracks) out.push(new THREE.QuaternionKeyframeTrack(bn.name + '.quaternion', times, arr));
  out.push(new THREE.VectorKeyframeTrack(hipB.name + '.position', times, hipT));
  const clip = new THREE.AnimationClip(name, S.T, out);
  // natural walking speed of a locomotion clip (m/s at scale 1): root motion if the clip has it, else the feet's
  // back-and-forth travel (stance ≈ 60 % of the cycle)
  const rootD = Math.hypot(fN.hip.x - f0.hip.x, fN.hip.z - f0.hip.z);
  let ex = 0; for (const fk of ['LeftFoot', 'RightFoot']) { let lo = 1e9, hi = -1e9; for (const f of S.frames) if (f[fk]) { const p = f[fk].clone().sub(f.hip); const z = p.applyQuaternion(G).z; lo = Math.min(lo, z); hi = Math.max(hi, z); } ex = Math.max(ex, hi - lo); }
  clip.userData = { speed: (rootD > 0.3 ? rootD / S.T : (ex / 0.6) / S.T) * kH };
  return clip;
}

// ──────────────────────────────────────────────────────────── loading ──
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const load = f => loader.loadAsync(new URL(f + '.glb', BASE).href);
const TPL = new Map(); // id → template
const SRC = new Map(); // clip name → { rig, S, clip }
let readyP = null, ready = false, failed = false;
const FPS = { idle_f: 15, idle_m: 20, argue: 15, sit: 12, talk_f: 15, talk_m: 20, phone: 15, lying: 12 };

export function loadPeople() {
  if (readyP) return readyP;
  readyP = (async () => {
    const chars = await Promise.all(CHARS.map(c => load(c.id).then(g => ({ c, g })).catch(e => { console.warn('person', c.id, e.message); return null; })));
    for (const r of chars) if (r) { try { TPL.set(r.c.id, makeTemplate(r.c, r.g)); } catch (e) { console.warn('person', r.c.id, e.message); } }
    const clips = await Promise.all(Object.keys(CLIPS).map(n => load('a_' + n).then(g => ({ n, g })).catch(e => { console.warn('person clip', n, e.message); return null; })));
    for (const r of clips) if (r && r.g.animations[0]) { try { const rig = makeRig(r.g.scene); poseRest(rig); SRC.set(r.n, { rig, clip: r.g.animations[0], S: null }); } catch (e) { console.warn('person clip', r.n, e.message); } }
    if (!TPL.size || !SRC.has('walk_m') || !SRC.has('idle_m')) throw new Error('people assets missing');
    ready = true;
  })();
  readyP.catch(e => { failed = true; console.warn('people', e.message); });
  return readyP;
}
export const peopleReady = () => ready;
export const peopleFailed = () => failed;

function makeTemplate(c, g) {
  const scene = g.scene; const rig = makeRig(scene); poseRest(rig);
  // rest-pose bounds (vertices are in bind space; bindMatrix takes them to the scene frame)
  const geo = rig.sm.geometry; geo.computeBoundingBox(); const bb = geo.boundingBox.clone().applyMatrix4(rig.sm.bindMatrix);
  const h = bb.max.y - bb.min.y;
  const yaw = Math.atan2(-1, 0) - Math.atan2(rig.right.x, rig.right.z); // character's right side → −X (faces +Z)
  const mat = rig.sm.material;
  for (const m of Array.isArray(mat) ? mat : [mat]) { m.roughness = Math.max(0.7, m.roughness ?? 0.85); m.metalness = 0; m.envMapIntensity = 0.6; if (m.map) m.map.anisotropy = 4; }
  return { c, scene, rig, h, bb, yaw, clips: new Map() };
}
function clipFor(tpl, name) {
  let clip = tpl.clips.get(name); if (clip) return clip;
  const s = SRC.get(name); if (!s) return null;
  if (!s.S) s.S = sampleSource(s.rig, s.clip, FPS[name] || 24);
  clip = retarget(s.rig, s.S, tpl.rig, name, CLIPS[name]); tpl.clips.set(name, clip); return clip;
}

// skeleton-aware clone: geometry + material shared, bones cloned and re-bound
function cloneSkinned(src) {
  const map = new Map(); const clone = src.clone(true);
  const a = [], b = []; src.traverse(o => a.push(o)); clone.traverse(o => b.push(o)); a.forEach((o, i) => map.set(o, b[i]));
  clone.traverse(o => { if (o.isSkinnedMesh) { const s = a[b.indexOf(o)]; o.bind(new THREE.Skeleton(s.skeleton.bones.map(x => map.get(x)), s.skeleton.boneInverses), s.bindMatrix); } });
  return clone;
}

// ─────────────────────────────────────────────────────────── persons ──
let frameNo = 0, viewCam = null;
/** called once per frame by the crowd managers: enables "skip people that were not drawn" and near-only shadows */
export function peopleFrame(game) { frameNo = game.frame ?? frameNo + 1; viewCam = game.camera || viewCam; }

const PHONE = (() => { let G = null; return () => G || (G = [new THREE.BoxGeometry(0.072, 0.15, 0.009), new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.3, metalness: 0.4 })]); })();
const ACT = {
  idle: p => p.sex === 'f' ? 'idle_f' : 'idle_m', walk: p => p.walkClip, run: () => 'run',
  talk: p => p.sex === 'f' ? 'talk_f' : 'talk_m', phone: () => 'phone', photo: () => 'phone', wave: () => 'wave',
  crouch: () => 'kneel', sit: () => 'sit', lying: () => 'lying', injured: () => 'lying', argue: () => 'argue', angry: () => 'argue', hit: () => 'hit', slapped: () => 'hit',
  lean: p => p.sex === 'f' ? 'idle_f' : 'idle_m', smoke: p => p.sex === 'f' ? 'idle_f' : 'idle_m', drink: p => p.sex === 'f' ? 'idle_f' : 'idle_m',
  enter: p => p.sex === 'f' ? 'idle_f' : 'idle_m', exit: p => p.sex === 'f' ? 'idle_f' : 'idle_m',
};

class Person {
  constructor(tpl, o = {}) {
    this.tpl = tpl; this.sex = tpl.c.sex; this.id = tpl.c.id; this.realistic = true;
    this.object = new THREE.Group(); this.object.name = 'person';
    const inner = this.inner = cloneSkinned(tpl.scene);
    const H = (o.height || tpl.c.h * (0.97 + Math.random() * 0.06)); const k = H / tpl.h;
    this.height = H;
    const pivot = new THREE.Group(); pivot.rotation.y = tpl.yaw; pivot.scale.setScalar(k);
    const cx = (tpl.bb.min.x + tpl.bb.max.x) / 2, cz = (tpl.bb.min.z + tpl.bb.max.z) / 2;
    inner.position.set(-cx, -tpl.bb.min.y, -cz); pivot.add(inner); this.object.add(pivot);
    if (o.mirror ?? Math.random() < 0.4) pivot.scale.x *= -1; // a mirrored copy reads as a different person in a crowd
    this.pivot = pivot;
    inner.traverse(m => { if (m.isSkinnedMesh) { this.mesh = m; m.castShadow = true; m.receiveShadow = false; m.frustumCulled = true;
      m.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, (tpl.bb.min.y + tpl.bb.max.y) / 2, cz), tpl.h * 0.75);
      m.onBeforeRender = () => { this.seen = frameNo; };
      if (o.tint) { m.material = m.material.clone(); m.material.color.multiplyScalar(o.tint); }
    } });
    this.bones = {}; for (const n of ['Hips', 'Head', 'Neck', 'LeftHand', 'RightHand', 'Spine2']) { const b = tpl.rig.node(n); if (b) this.bones[n] = inner.getObjectByName(b.name); }
    this.handL = new THREE.Object3D(); this.handR = new THREE.Object3D(); this.object.add(this.handL, this.handR);
    this.phone = new THREE.Mesh(...PHONE()); this.phone.visible = false; this.phone.position.set(0, 0.03, 0.05); this.phone.rotation.x = -0.9; this.handR.add(this.phone);
    this.mixer = new THREE.AnimationMixer(inner); this.cur = null; this.curName = ''; this.acc = 0; this.seen = frameNo;
    this.walkClip = o.walk || (this.sex === 'f' ? 'walk_f' : (Math.random() < 0.5 ? 'walk_m' : 'walk_rp'));
    this.lookTarget = null; this._look = 0; this._lookP = 0;
    this.play('idle', 0);
    this.mixer.update(Math.random() * 3); this.cur && (this.cur.time = Math.random() * this.cur.getClip().duration);
  }
  play(action, fade = 0.3, once = false) {
    const name = (ACT[action] || ACT.idle)(this); if (name === this.curName) return this.cur;
    const clip = clipFor(this.tpl, name) || clipFor(this.tpl, this.sex === 'f' ? 'idle_f' : 'idle_m'); if (!clip) return null;
    const a = this.mixer.clipAction(clip);
    a.reset(); a.setLoop(CLIPS[name]?.loop === false || once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = true;
    if (this.cur && fade > 0) { a.play(); this.cur.crossFadeTo(a, fade, false); } else { if (this.cur) this.cur.stop(); a.play(); }
    if (CLIPS[name]?.loop !== false) a.time = Math.random() * clip.duration;
    this.prev = this.cur; this.cur = a; this.curName = name; return a;
  }
  lookAt(target) { if (!target) { this.lookTarget = null; return; } (this.lookTarget ||= new THREE.Vector3()).copy(target); }
  update(dt, state = {}) {
    dt = Math.min(dt || 0, 0.5);
    if (this.override) { this.override.t -= dt; if (this.override.t <= 0) this.override = null; else state = { speed: 0, action: this.override.action }; }
    const speed = Math.max(0, state.speed || 0);
    let action = state.action || (speed > 0.15 ? 'walk' : 'idle');
    if ((action === 'idle' || action === 'walk' || action === 'run') && speed > 0.15) action = speed > 2.6 ? 'run' : 'walk';
    else if (action === 'walk' || action === 'run') action = 'idle';
    this.play(action, 0.3);
    if (this.cur && (this.curName.startsWith('walk') || this.curName === 'run')) { const nat = (this.cur.getClip().userData.speed || 1.3) * (this.height / 1.7); this.cur.timeScale = THREE.MathUtils.clamp(speed / nat, 0.5, 1.8); }
    else if (this.cur) this.cur.timeScale = 1;
    this.phone.visible = action === 'phone' || action === 'photo';
    // not drawn last frame → don't pose the skeleton (keeps accumulating so it resumes in phase)
    this.acc += dt;
    if (this.seen < frameNo - 2 && dt > 0) { if (this.acc > 4) this.acc = 4; return; }
    this.mixer.update(this.acc); this.acc = 0;
    // lying (injured): the clip was recorded on a bed — drop the body so the pelvis rests on the surface below it
    if (this.curName === 'lying' && this.bones.Hips) { this.object.updateMatrixWorld(true); this.bones.Hips.getWorldPosition(_v); this.object.worldToLocal(_v); this.pivot.position.y += (0.11 - _v.y); }
    else if (this.pivot.position.y) this.pivot.position.y = 0;
    // near-only shadows
    if (viewCam && this.mesh) { const d2 = viewCam.position.distanceToSquared(this.object.position); this.mesh.castShadow = d2 < 45 * 45; this.near = d2 < 25 * 25; }
    const needHands = this.handL.children.length || this.handR.children.length && this.phone.visible || this.handR.children.length > 1;
    if (this.lookTarget || needHands) this.object.updateMatrixWorld(true);
    if (this.lookTarget || this._look) this.applyLook(dt);
    if (needHands) { this.anchor(this.handL, this.bones.LeftHand); this.anchor(this.handR, this.bones.RightHand); }
  }
  // hand anchors stay upright (bags hang straight down) and follow the hand bone
  anchor(a, b) { if (!b) return; b.getWorldPosition(_v); this.object.worldToLocal(_v); a.position.copy(_v); }
  applyLook(dt) {
    const h = this.bones.Head; if (!h) return;
    let ty = 0;
    if (this.lookTarget) { _v.copy(this.lookTarget); this.object.worldToLocal(_v); const a = Math.atan2(_v.x, _v.z); ty = Math.abs(a) > 2.2 ? 0 : THREE.MathUtils.clamp(a, -1.1, 1.1); }
    this._look += (ty - this._look) * (1 - Math.exp(-dt * 5)); if (Math.abs(this._look) < 0.002 && !this.lookTarget) { this._look = 0; return; }
    // rotate the head about the body's vertical axis, in world space, on top of the animation
    this.object.getWorldQuaternion(_q2); _v2.set(0, 1, 0).applyQuaternion(_q2);
    const R = _q.setFromAxisAngle(_v2, this._look * (this.pivot.scale.x < 0 ? 1 : 1));
    h.parent.getWorldQuaternion(_q2); const wq = _q2.clone().multiply(h.quaternion); wq.premultiply(R); h.quaternion.copy(_q2.invert().multiply(wq));
  }
  playOnce(action, dur) { this.override = { action, t: dur }; }
  /** play a one-shot (hit reaction …); returns its duration */
  oneShot(action) { const a = this.play(action, 0.12, true); return a ? a.getClip().duration : 0; }
  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.inner); this.object.removeFromParent(); }
}

const lastPick = [];
/**
 * A person for the crowd. opts: { type: 'office'|'student'|'shopper'|'casual'|'staff'|'driver'|'elder', sex, id, height, outfit }
 * Returns a realistic Person once the models are loaded, else the procedural human (outfit) as a stand-in.
 */
export function createPerson(opts = {}) {
  if (!ready) { if (!readyP) loadPeople(); return createHuman(opts.outfit); }
  let pool = [...TPL.values()];
  if (opts.id && TPL.has(opts.id)) pool = [TPL.get(opts.id)];
  else {
    if (opts.type) { const p = pool.filter(t => t.c.tags.includes(opts.type)); if (p.length) pool = p; }
    if (opts.sex) { const p = pool.filter(t => t.c.sex === opts.sex); if (p.length) pool = p; }
    // avoid the same body twice in a row
    if (pool.length > 2) { const p = pool.filter(t => !lastPick.includes(t.c.id)); if (p.length) pool = p; }
  }
  // weighted: the Japanese bodies are the most common on these streets
  let sum = 0; for (const t of pool) sum += t.c.w || 1; let r = Math.random() * sum, tpl = pool[0]; for (const t of pool) { r -= t.c.w || 1; if (r <= 0) { tpl = t; break; } }
  lastPick.push(tpl.c.id); if (lastPick.length > 3) lastPick.shift();
  return new Person(tpl, opts);
}
export { Person };

// ───────────────────────────────────────────────────── seated drivers ──
// Drivers seen through the windows of passing traffic don't need a live skeleton: each body is posed once in the
// driving clip and baked into a static mesh (geometry shared by every driver of that body, one draw call, no skinning).
// The object's origin is the seat (under the pelvis), facing +Z.
const SEATED = new Map();
function seatedGeometry(tpl) {
  let g = SEATED.get(tpl.c.id); if (g) return g;
  const clip = clipFor(tpl, 'drive'); if (!clip) return null;
  const sm = tpl.rig.sm, mixer = new THREE.AnimationMixer(tpl.scene); const a = mixer.clipAction(clip); a.play(); mixer.setTime(clip.duration * 0.3);
  tpl.scene.updateMatrixWorld(true); sm.skeleton.update();
  const src = sm.geometry, n = src.attributes.position.count, pos = new Float32Array(n * 3), v = new THREE.Vector3();
  // skinned (mesh-local) → the Person frame: mesh matrix, then the template's centring / facing
  const toScene = sm.matrixWorld, k = 1 / tpl.h; // unit height; scaled per driver
  const pivot = new THREE.Matrix4().makeRotationY(tpl.yaw), off = new THREE.Matrix4().makeTranslation(-(tpl.bb.min.x + tpl.bb.max.x) / 2, -tpl.bb.min.y, -(tpl.bb.min.z + tpl.bb.max.z) / 2);
  const M = new THREE.Matrix4().multiplyMatrices(pivot, off).multiply(toScene);
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(src.attributes.position, i); sm.applyBoneTransform(i, v); v.applyMatrix4(M).multiplyScalar(k); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; }
  // seat point: below the hips
  const hip = tpl.rig.bones.Hips; const hp = new THREE.Vector3().setFromMatrixPosition(hip.matrixWorld).applyMatrix4(new THREE.Matrix4().multiplyMatrices(pivot, off)).multiplyScalar(k);
  for (let i = 0; i < n; i++) { pos[i * 3] -= hp.x; pos[i * 3 + 1] -= hp.y - 0.055; pos[i * 3 + 2] -= hp.z; }
  g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); if (src.attributes.uv) g.setAttribute('uv', src.attributes.uv); g.setIndex(src.index);
  g.computeVertexNormals(); g.computeBoundingSphere(); g.userData.shared = true;
  a.stop(); mixer.uncacheRoot(tpl.scene); poseRest(tpl.rig);
  SEATED.set(tpl.c.id, g); return g;
}
/** a static seated driver (Group, origin at the seat, faces +Z) or null while the models are loading */
export function createDriver(opts = {}) {
  if (!ready) { if (!readyP) loadPeople(); return null; }
  let pool = [...TPL.values()].filter(t => t.c.tags.includes('driver')); if (opts.sex) pool = pool.filter(t => t.c.sex === opts.sex);
  const tpl = pool[Math.floor(Math.random() * pool.length)]; if (!tpl) return null;
  const geo = seatedGeometry(tpl); if (!geo) return null;
  const m = new THREE.Mesh(geo, tpl.rig.sm.material); m.castShadow = false; m.scale.setScalar(tpl.c.h * (0.97 + Math.random() * 0.06));
  if (Math.random() < 0.4) m.scale.x *= -1;
  const g = new THREE.Group(); g.add(m); g.name = 'driver'; g.userData.person = tpl.c.id; return g;
}

// small static props that go with people (bicycle …), loaded once, cloned per use (geometry shared)
const PROPS = new Map();
export function loadPeopleProp(name) {
  if (!PROPS.has(name)) PROPS.set(name, load(name).then(g => { g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.geometry.userData.shared = true; } }); return g.scene; }));
  return PROPS.get(name);
}
