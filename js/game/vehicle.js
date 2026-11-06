// Vehicle dynamics: single-track (2-axle) tyre model with a smooth slip-angle curve (peak + gentle falloff),
// longitudinal & lateral load transfer with tyre load sensitivity, combined slip (friction ellipse + sliding),
// wheelspin, wheel lock (no ABS) and handbrake drift; engine with torque curve / turbo lag / rev limiter,
// clutch (manual or auto), MT / AT / DCT / EV with regen.
// Driver assists (FH-style): speed-sensitive steering with slip-angle limiting & auto counter-steer,
// stability management (STM), traction control (TCS) and ABS — see ASSIST_PRESETS.
import * as THREE from 'three';

const G = 9.81;
const RPM2W = Math.PI * 2 / 60;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const TRANS_MODES = ['auto', 'manual', 'manual_clutch']; // auto = AT behaviour for everything, manual = sequential with auto-clutch, manual_clutch = H-pattern + clutch pedal

// difficulty presets → individual assists. steer: assisted | standard | sim, stm: full | sport | off,
// tcs: full | sport | off, abs: bool, trans: default gearbox for the preset
export const ASSIST_PRESETS = {
  beginner: { steer: 'assisted', stm: 'full', tcs: 'full', abs: true, trans: 'auto', police: 'lenient' },
  standard: { steer: 'standard', stm: 'sport', tcs: 'sport', abs: true, trans: 'auto', police: 'normal' },
  pro: { steer: 'standard', stm: 'off', tcs: 'off', abs: true, trans: 'manual', police: 'normal' },
  sim: { steer: 'sim', stm: 'off', tcs: 'off', abs: false, trans: 'manual_clutch', police: 'strict' },
};
export const DIFFICULTIES = Object.keys(ASSIST_PRESETS);
// game settings ↔ vehicle assists (settings keys: difficulty, steerAssist, stm, tcs, abs, police)
export const ASSIST_SETTING_KEYS = ['steerAssist', 'stm', 'tcs', 'abs'];
export function assistsFromSettings(s) { return { steer: s.steerAssist || 'standard', stm: s.stm || 'sport', tcs: s.tcs || 'sport', abs: s.abs !== false }; }
/** write a difficulty preset into a settings object (assists, default gearbox, police tolerance) */
export function applyDifficulty(s, name) {
  const p = ASSIST_PRESETS[name]; if (!p) return s;
  Object.assign(s, { difficulty: name, steerAssist: p.steer, stm: p.stm, tcs: p.tcs, abs: p.abs, transmission: p.trans, police: p.police });
  return s;
}
// ── performance tuning (garage): presets + individual settings. Every value is a multiplier/offset on the stock car.
//   power ×, weight − fraction, tyre compound, final drive ×, brake force ×, brake bias (front share), balance −1 (understeer)
//   … +1 (oversteer), downforce 0..1, steering lock (deg), lsd 0 open … 1 locked
export const TYRES = { eco: { mu: 0.9, r: 1 }, street: { mu: 1, r: 1 }, sport: { mu: 1.07, r: 1 }, semi: { mu: 1.15, r: 1 }, drift: { mu: 1.02, r: 0.86 } };
export const TUNE_DEFAULT = { preset: 'stock', power: 1, weight: 0, tyre: 'street', final: 1, brake: 1, bias: 0.64, balance: 0, aero: 0, lock: 34, lsd: 0.2 };
export const TUNE_PRESETS = {
  stock: { ...TUNE_DEFAULT },
  street: { power: 1.12, weight: 0.03, tyre: 'sport', final: 1.03, brake: 1.08, bias: 0.64, balance: 0, aero: 0.1, lock: 36, lsd: 0.35 },
  grip: { power: 1.22, weight: 0.08, tyre: 'semi', final: 1.05, brake: 1.22, bias: 0.62, balance: -0.1, aero: 0.6, lock: 34, lsd: 0.45 },
  drift: { power: 1.3, weight: 0.06, tyre: 'drift', final: 1.12, brake: 1.1, bias: 0.6, balance: 0.55, aero: 0.15, lock: 54, lsd: 0.95 },
  wangan: { power: 1.55, weight: 0.04, tyre: 'sport', final: 0.86, brake: 1.25, bias: 0.63, balance: -0.25, aero: 0.45, lock: 30, lsd: 0.5 },
  touge: { power: 1.15, weight: 0.12, tyre: 'semi', final: 1.1, brake: 1.15, bias: 0.6, balance: 0.15, aero: 0.25, lock: 40, lsd: 0.6 },
};
export function resolveTune(t) { const p = t && TUNE_PRESETS[t.preset] && t.preset !== 'custom' ? TUNE_PRESETS[t.preset] : {}; return { ...TUNE_DEFAULT, ...(t || {}), ...p, preset: t?.preset || 'stock' }; }

// steering assist tuning: lockK = how far past the geometric (neutral-steer) angle the fronts may be steered,
// in multiples of the peak slip angle; cs = auto counter-steer gain; rateK = digital (keyboard/touch) steering speed
const STEER_P = {
  assisted: { lockK: 1.0, cs: 0.7, alphaK: 0.85, rateK: 0.9, damp: 3 },
  standard: { lockK: 1.1, cs: 0.4, alphaK: 1.0, rateK: 1, damp: 2.2 },
  sim: { lockK: 1.7, cs: 0, alphaK: 0, rateK: 1.25, damp: 1.2 },
};
/** resolve a preset name or partial assist object into a full assist set */
export function resolveAssists(a) {
  if (typeof a === 'string') return { ...(ASSIST_PRESETS[a] || ASSIST_PRESETS.standard) };
  return { ...ASSIST_PRESETS.standard, ...(a || {}) };
}
// tyre lateral curve (Pacejka-like, normalised): peak at alpha = ap, then a gentle falloff to ~0.89
const MU_LONG = 1.1;
const WHEEL_MASS = 0.06; // driven wheels + driveline inertia as a fraction of the car's mass
const TC = 1.3, TB = Math.tan(Math.PI / (2 * TC));
const spinFracAudio = slip => clamp((Math.abs(slip) - 0.6) / 3.4, 0, 1);
const tyre = (alpha, ap) => Math.sin(TC * Math.atan(TB * alpha / ap));

function torqueCurve(e) {
  const red = e.redline, Tpk = e.nm, Ppk = e.hp * 735.5;
  const Rp = red * (e.turbo ? 0.86 : 0.9);
  const Tp = Ppk / (Rp * RPM2W);
  const keys = e.turbo
    ? [[0, Tpk * 0.3], [e.idle || 800, Tpk * 0.45], [red * 0.38, Tpk * 0.98], [red * 0.62, Tpk], [Rp, Math.min(Tpk, Tp)], [red, Math.min(Tpk, Tp) * 0.88], [red * 1.1, Tp * 0.6]]
    : [[0, Tpk * 0.4], [e.idle || 800, Tpk * 0.62], [red * 0.45, Tpk * 0.9], [red * 0.68, Tpk], [Rp, Math.min(Tpk, Tp * 1.0)], [red, Math.min(Tpk, Tp) * 0.9], [red * 1.1, Tp * 0.6]];
  return rpm => {
    if (rpm <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (rpm <= keys[i][0]) { const [a, ta] = keys[i - 1], [b, tb] = keys[i]; return lerp(ta, tb, (rpm - a) / (b - a)); }
    return keys[keys.length - 1][1];
  };
}

export class Vehicle {
  constructor(car, model, opts = {}) {
    this.car = car; this.model = model;
    const P = model?.P || { wb: car.wb / 1000, hw: car.W / 2000, wheelR: 0.32, track: car.W / 2000 - 0.15 };
    this.wb = car.wb / 1000; this.track = P.track * 2; this.r = P.wheelR || 0.32;
    this.m = car.mass + 75; // + driver
    const fw = { FR: 0.53, FF: 0.61, MR: 0.43, RR: 0.4, AWD: 0.56 }[car.drive] ?? 0.53;
    this.a = this.wb * (1 - fw); this.b = this.wb * fw; // CG→front axle, CG→rear axle
    this.h = car.cat === 'traffic' && car.mass > 5000 ? 1.4 : Math.min(0.62, car.H / 2600);
    this.Iz = this.m * ((car.L / 1000) ** 2 + (car.W / 1000) ** 2) / 12 * 0.85;
    // grip: narrow kei / traffic tyres grip less, high power-to-weight cars run stickier rubber
    const pw = car.engine.hp / car.mass;
    this.mu = car.cat === 'traffic' ? 0.92 : car.cat === 'kei' ? 0.96 : 1.0 + clamp((pw - 0.1) * 0.55, 0, 0.12);
    this.apF = 0.13; this.apR = 0.115; // peak slip angles (rad); rear slightly stiffer → stable, mild understeer
    this.Fz0 = this.m * G / 4;
    this.lock = 0.6; // max road-wheel angle (rad) at parking speed
    // linear understeer gradient (s²/m) from axle cornering stiffnesses → steady-state steer angle for a given lateral g
    const Cf = this.mu * this.m * G * this.b / this.wb * TC * TB / this.apF, Cr = this.mu * this.m * G * this.a / this.wb * TC * TB / this.apR;
    this.Kus = Math.max(0.0004, this.m / this.wb * (this.b / Cf - this.a / Cr));
    // aero
    const cd = car.cd ?? (car.cat === 'ev' ? 0.27 : car.cat === 'kei' ? 0.36 : car.cat === 'traffic' ? (car.mass > 5000 ? 0.6 : car.H > 1800 ? 0.44 : 0.33) : 0.33);
    this.dragK = 0.5 * 1.2 * cd * (car.W / 1000) * (car.H / 1000) * 0.82;
    this.downK = car.cat === 'traffic' ? 0 : 0.5 * 1.2 * 0.12;
    this.ev = car.engine.type === 'EV';
    this.tq = torqueCurve(car.engine);
    this.Ie = this.ev ? 0.08 : 0.16 + car.engine.disp / 20000;
    this.gears = car.trans.gears; this.final = car.trans.final; this.revRatio = car.trans.rev;
    this.transType = car.trans.type; // MT AT DCT EV
    this.mode = opts.mode || 'auto';
    this.pos = new THREE.Vector3(); this.yaw = 0; this.vel = new THREE.Vector3(); this.yawRate = 0; this.vy = 0;
    this.vx = 0; this.vlat = 0; this.slip = 0;
    this.engine = { running: this.ev, rpm: 0, cranking: 0, stallFlash: 0, boost: 0, limiter: 0 };
    this.gear = 0;          // -1 R, 0 N, 1..n
    this.atSel = 'P';       // P R N D (auto mode) — EV/AT selector
    this.shiftT = 0; this.shiftTarget = null;
    this.ctl = { throttle: 0, brake: 0, steer: 0, handbrake: 0, clutch: 0 };
    this.handbrakeOn = true; // parked with handbrake
    this.steerAng = 0; this.spin = [0, 0, 0, 0]; this.susp = [0, 0, 0, 0]; this.pitch = 0; this.roll = 0;
    this.ax = 0; this.ay = 0;
    this.regenLevel = 2; // 0 off, 1 low, 2 normal, 3 one-pedal
    this.battery = car.battery ? 0.82 : 0; this.kw = 0;
    this.fuel = 0.7;
    this.surface = null; this.onRoad = false; this.airborne = 0;
    this.events = []; // 'stall','backfire','blowoff','shift','crash','limiter'
    this.camberF = 0; this.camberR = 0;
    this.odometer = 0;
    this.engineOffByUser = false;
    this.steerIn = 0; this.tcCut = 0; this.stmCut = 0; this.lockF = false; this.lockR = false;
    this.stmActive = 0; this.tcsActive = 0; this.absActive = 0; // 0..1 flags for HUD / audio
    this.setAssists(opts.assists ?? (opts.tcs === false ? 'pro' : 'standard'));
    this.base = { mu: this.mu, final: this.final, downK: this.downK, m: this.m, Iz: this.Iz, tq: this.tq, Kus: this.Kus };
    this.gF = 1; this.gR = 1; this.brakeK = 1; this.bias = 0.64; this.lsd = 0.2;
    this.applyTune(opts.tune);
  }
  // performance tuning (see TUNE_PRESETS); safe to call while driving
  applyTune(t) {
    const T = this.tune = resolveTune(t), B = this.base, car = this.car;
    if (car.cat === 'traffic' && !t) return;
    const ty = TYRES[T.tyre] || TYRES.street;
    this.m = B.m * (1 - clamp(T.weight, 0, 0.2)); this.Iz = B.Iz * this.m / B.m; this.Fz0 = this.m * G / 4;
    this.mu = B.mu * ty.mu;
    const bal = clamp(T.balance, -1, 1);
    this.gF = 1 - bal * 0.05; this.gR = (1 + bal * 0.05) * ty.r;
    this.final = B.final * clamp(T.final, 0.7, 1.4);
    this.downK = B.downK * (1 + clamp(T.aero, 0, 1) * 3.2);
    const pk = clamp(T.power, 0.8, 2); this.tq = rpm => B.tq(rpm) * pk; this.powerK = pk;
    this.brakeK = clamp(T.brake, 0.7, 1.5); this.bias = clamp(T.bias, 0.45, 0.8); this.lsd = clamp(T.lsd, 0, 1);
    this.lock = clamp(T.lock, 25, 60) * Math.PI / 180;
    this.Kus = B.Kus * (1 - bal * 0.35);
  }
  setAssists(a) { this.assist = resolveAssists(a); this.tcs = this.assist.tcs !== 'off'; }
  get kmh() { return this.vx * 3.6; }
  get speed() { return Math.hypot(this.vel.x, this.vel.z); }
  get forward() { return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  get left() { return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); }
  place(pos, yaw) { this.pos.copy(pos); this.yaw = yaw; this.vel.set(0, 0, 0); this.yawRate = 0; this.vx = 0; this.vlat = 0; this.vy = 0; this.slip = 0; }

  get gearLabel() {
    if (this.mode === 'auto' || this.ev) { if (this.atSel === 'D') return this.ev ? (this.regenLevel === 3 ? 'B' : 'D') : 'D' + (this.gear > 0 ? this.gear : ''); return this.atSel; }
    return this.gear === -1 ? 'R' : this.gear === 0 ? 'N' : String(this.gear);
  }
  ratio(g = this.gear) { if (g === 0) return 0; if (g < 0) return -this.revRatio * this.final; return (this.gears[g - 1] || this.gears[this.gears.length - 1]) * this.final; }

  // ignition: returns status string
  startEngine() {
    if (this.engine.running || this.engine.cranking) return;
    if (this.ev) { this.engine.running = true; this.events.push('ready'); return; }
    const inGear = this.mode === 'auto' ? !(this.atSel === 'P' || this.atSel === 'N') : this.gear !== 0;
    if (this.mode === 'manual_clutch' && inGear && this.ctl.clutch < 0.8) { this.events.push('lurch'); this.vx += 0.25; return; }
    if (this.mode === 'auto' && inGear) { this.atSel = 'P'; }
    this.engine.cranking = 0.55 + Math.random() * 0.5 + (this.car.year < 1995 ? 0.3 : 0);
    this.events.push('crank');
  }
  stopEngine() { if (this.ev) { this.engine.running = false; return; } this.engine.running = false; this.engine.cranking = 0; }

  shiftUp() {
    if (this.mode === 'auto' || this.ev) { const order = ['P', 'R', 'N', 'D']; const i = order.indexOf(this.atSel); if (i < 3) this.setSel(order[i + 1]); return; }
    if (this.gear < this.gears.length) this.requestGear(this.gear + 1);
  }
  shiftDown() {
    if (this.mode === 'auto' || this.ev) { const order = ['P', 'R', 'N', 'D']; const i = order.indexOf(this.atSel); if (i > 0) this.setSel(order[i - 1]); return; }
    if (this.gear > -1) this.requestGear(this.gear - 1);
  }
  setSel(s) {
    if ((s === 'R' || s === 'P') && Math.abs(this.vx) > 2) return; // interlock
    this.atSel = s; this.events.push('shift');
    if (s === 'D') this.gear = Math.max(1, this.gear); else if (s === 'R') this.gear = -1; else this.gear = 0;
  }
  requestGear(g) {
    if (this.mode === 'manual_clutch' && this.ctl.clutch < 0.6 && this.engine.running) { this.events.push('grind'); return; }
    if (g === -1 && this.vx > 2) { this.events.push('grind'); return; }
    this.shiftTarget = g; this.shiftT = this.transType === 'DCT' ? 0.06 : this.mode === 'manual_clutch' ? 0.0 : 0.16;
    this.events.push('shift');
  }
  selectGear(g) { if (g >= -1 && g <= this.gears.length) this.requestGear(g); }

  // ───────────────────────── main step ─────────────────────────
  update(dt, net, world) {
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.step(h);
    this.contact(dt, net, world);
    this.visual(dt);
  }

  autoClutchEngagement(we, thr) {
    // launch control for auto-clutch modes: the engine flares to a launch rpm that rises with throttle
    const idle = (this.car.engine.idle || 800) * RPM2W;
    const launch = idle * 1.15 + thr * this.car.engine.redline * RPM2W * (this.car.engine.turbo ? 0.45 : 0.38); // flare to a proper launch rpm (turbo: build boost)
    // creep bite just above idle, then the clutch only really bites near the launch rpm so the engine can rev up
    // torque-converter automatics creep firmly at idle and take up drive progressively as the engine revs
    if (this.mode === 'auto' && this.transType === 'AT') return Math.min(1, 0.3 * sstep(idle * 0.8, idle * 1.0, we) + 0.7 * sstep(idle * 1.05, Math.max(idle * 1.3, launch * 0.7), we));
    return 0.07 * sstep(idle * 0.8, idle * 1.0, we) + 0.93 * sstep(Math.max(idle * 1.05, launch * 0.55), launch, we);
  }

  step(dt) {
    const c = this.ctl, e = this.engine, car = this.car, A = this.assist, SP = STEER_P[A.steer] || STEER_P.standard;
    const m = this.m, L = this.wb;
    // ── body-frame velocities
    const f = this.forward, l = this.left;
    let vx = this.vel.dot(f), vy = this.vel.dot(l);
    const r = this.yawRate, av = Math.abs(vx);
    const beta = av > 3 ? Math.atan2(vy, av) : 0; // body sideslip
    const hbPull = c.handbrake > 0.3;
    // ── loads: longitudinal transfer (front/rear) + aero downforce; lateral transfer handled per axle below
    const ax = this.ax, ay = this.ay, down = this.downK * vx * vx;
    const Fzf = clamp(m * G * this.b / L - m * ax * this.h / L, m * G * 0.12, m * G * 0.9) + down * 0.45;
    const Fzr = clamp(m * G * this.a / L + m * ax * this.h / L, m * G * 0.12, m * G * 0.9) + down * 0.55;
    const camberGain = 1 + clamp(-(this.camberF + this.camberR) * 0.008, -0.05, 0.06);
    const mu = this.mu * (this.surfaceMu ?? 1) * camberGain;
    const dFz = m * ay * this.h / this.track, Fz0 = this.Fz0;
    // axle grip with tyre load sensitivity: the outer tyre gains less than the inner loses → the axle with more
    // roll stiffness (front) loses a little grip → stable, slightly understeering balance
    const axleGrip = (Fz, share) => { const d = clamp(dFz * share, -Fz * 0.5, Fz * 0.5); const w1 = Fz / 2 + d, w2 = Fz / 2 - d; return mu * (w1 * (1 - 0.1 * (w1 / Fz0 - 1)) + w2 * (1 - 0.1 * (w2 / Fz0 - 1))); };
    const Fmf = axleGrip(Fzf, 0.58) * this.gF, Fmr = axleGrip(Fzr, 0.42) * this.gR;

    // ── steering: input conditioning (keyboard ramps in speed-sensitively + auto-centres; pads stay direct)
    if (c.steerDigital) {
      const tgt = c.steer, k = sstep(4, 45, av);
      const back = tgt === 0 || (this.steerIn !== 0 && Math.sign(tgt) !== Math.sign(this.steerIn));
      const rate = (back ? lerp(9, 5, k) : lerp(6, 2.2, k)) * SP.rateK;
      this.steerIn += clamp(tgt - this.steerIn, -rate * dt, rate * dt);
    } else this.steerIn = lerp(this.steerIn, c.steer, 1 - Math.exp(-dt * 30));
    // speed-sensitive lock: stick travel maps onto the angle that actually turns the car at this speed: the geometric (neutral-steer)
    // angle for lockK × max lateral g (incl. understeer gradient) + a little transient slip → no over-driven fronts at 200 km/h
    const v2 = Math.max(vx * vx, 1);
    const geo = Math.atan((L + this.Kus * v2) * mu * G * SP.lockK / v2);
    let lim = Math.min(this.lock, geo + this.apF * 0.12);
    // counter-steering into a slide is always allowed (up to the slide angle + peak slip)
    if (this.steerIn * beta > 0) lim = lerp(lim, Math.min(this.lock, Math.max(lim, Math.abs(beta) + this.apF * 1.2)), sstep(0.04, 0.15, Math.abs(beta)));
    const dUser = this.steerIn * lim;
    // auto counter-steer: point the fronts towards the direction of travel when the car slides
    // (only once the rear is past its grip peak and swinging out — not in a normal fast corner)
    let dAssist = 0;
    if (vx > 3 && SP.cs > 0 && r * beta < 0) dAssist = SP.cs * beta * sstep(this.apR * 0.9, this.apR * 2, Math.abs(this.alphaR || 0)) * sstep(3, 8, vx);
    let dCmd = clamp(dUser + dAssist, -this.lock, this.lock);
    // slip-angle limiter: never ask the fronts for more than ~peak slip relative to where they're travelling
    // (θf = direction of the front axle's velocity). When the rear steps out θf swings → counter-steer for free.
    if (SP.alphaK && vx > 4) {
      const thF = Math.atan2(vy + this.a * r, vx), aT = lerp(this.lock, this.apF * SP.alphaK, sstep(5, 14, vx));
      dCmd = clamp(dCmd, thF - aT, thF + aT);
    }
    this.steerAng += clamp(dCmd - this.steerAng, -4.5 * dt, 4.5 * dt); // steering rack speed
    const delta = this.steerAng;

    // ── slip angles (front in wheel frame; low-speed floor keeps it smooth / jitter-free when parking)
    const cd = Math.cos(delta), sd = Math.sin(delta);
    const vyF = vy + this.a * r, vyR = vy - this.b * r;
    const vxw = vx * cd + vyF * sd, vyw = -vx * sd + vyF * cd;
    const af = Math.atan2(vyw, Math.max(Math.abs(vxw), 3)), ar = Math.atan2(vyR, Math.max(av, 3));
    const nf = tyre(af, this.apF), nr = tyre(ar, this.apR); // normalised lateral demand

    // ── drivetrain
    const drive = car.drive;
    let front = drive === 'FF' ? 1 : drive === 'AWD' ? 0.45 : 0;
    if (hbPull && drive === 'AWD') front = 1; // handbrake decouples the rear (centre coupling)
    const ratio = this.ratio();
    const eta = 0.9;
    let Fdrive = 0;
    const we = e.rpm * RPM2W;
    const idleW = (car.engine.idle || 800) * RPM2W;
    let throttle = c.throttle;
    // traction control: cut throttle smoothly when the driven wheels slip beyond the target slip speed (m/s)
    if (A.tcs !== 'off' && !hbPull) {
      const tgt = A.tcs === 'full' ? 0.8 : 2.4 + 6 * sstep(0.1, 0.3, Math.abs(beta)); // sport: hands off once you're already sideways
      const want = clamp((Math.abs(this.slip) - tgt) * (A.tcs === 'full' ? 0.6 : 0.35), 0, 0.9);
      this.tcCut = lerp(this.tcCut, want, 1 - Math.exp(-dt * (want > this.tcCut ? 25 : 5)));
    } else this.tcCut = 0;
    this.tcsActive = this.tcCut > 0.05 ? 1 : 0;
    throttle *= (1 - this.tcCut) * (1 - this.stmCut);
    // shifting: torque cut
    if (this.shiftTarget !== null) {
      this.shiftT -= dt; throttle = 0;
      if (this.shiftT <= 0) { this.gear = this.shiftTarget; this.shiftTarget = null; if (car.engine.turbo && c.throttle < 0.2 && e.boost > 0.5) this.events.push('blowoff'); }
    }
    // auto box logic
    if ((this.mode === 'auto' && !this.ev) && this.atSel === 'D' && this.shiftTarget === null && this.gear > 0) {
      const rpm = e.rpm, red = car.engine.redline;
      const up = lerp(red * 0.36, red * 0.93, Math.pow(c.throttle, 1.3));
      const down = lerp(red * 0.18, red * 0.36, c.throttle);
      if (rpm > up && Math.abs(this.slip) < 1.5 && this.gear < this.gears.length && this.timeInGear > 0.6) { this.shiftTarget = this.gear + 1; this.shiftT = this.transType === 'DCT' ? 0.08 : 0.22; this.timeInGear = 0; this.events.push('shift_auto'); }
      else if (rpm < down && this.gear > 1 && this.timeInGear > 0.4) { const nr2 = this.ratio(this.gear - 1); if (Math.abs(vx) / this.r * nr2 / RPM2W < red * 0.88) { this.shiftTarget = this.gear - 1; this.shiftT = 0.18; this.timeInGear = 0; } }
    }
    this.timeInGear = (this.timeInGear || 0) + dt;

    // engine torque available
    let Teng = 0;
    if (this.ev) {
      const wm = Math.abs(vx) / this.r * Math.abs(ratio || this.final);
      const Pmax = car.engine.hp * 735.5, Tmax = car.engine.nm, red = car.engine.redline;
      const avail = this.battery > 0.01 && e.running;
      const Tm = avail ? Math.min(Tmax, Pmax / Math.max(wm, 1)) * (1 - sstep(red * 0.96, red, wm / RPM2W)) : 0; // motor speed limit
      const dirSel = this.atSel === 'D' ? 1 : this.atSel === 'R' ? -1 : 0;
      let T = Tm * throttle * dirSel;
      // regenerative braking (lift-off) and on brake pedal
      const regenK = [0, 0.06, 0.12, 0.24][this.regenLevel];
      let Tregen = 0;
      if (dirSel !== 0 && Math.abs(vx) > 0.3) Tregen = -Math.sign(vx) * Math.min(Tmax, m * G * (regenK * (1 - c.throttle) + 0.15 * c.brake) * this.r / Math.abs(this.final)) * sstep(0.3, 2, Math.abs(vx));
      T += Tregen;
      Fdrive = T * this.final * eta / this.r;
      e.rpm = wm / RPM2W;
      this.kw = (T * wm) / 1000;
      this.battery = clamp(this.battery - (this.kw > 0 ? this.kw : this.kw * 0.7) * dt / (3600 * (car.battery || 40)), 0, 1);
      this.regenActive = Tregen !== 0 && Math.abs(Tregen) > 5;
    } else {
      // cranking
      if (e.cranking > 0) {
        e.cranking -= dt; e.rpm = lerp(e.rpm, 260 + Math.sin(performance.now() / 60) * 40, 1 - Math.exp(-dt * 8));
        if (e.cranking <= 0) { e.running = this.fuel > 0; e.rpm = (car.engine.idle || 800) * 1.6; this.events.push(e.running ? 'started' : 'nostart'); }
      }
      const rpm = e.rpm, red = car.engine.redline;
      if (e.running) {
        // turbo spool
        if (car.engine.turbo) { const target = throttle * sstep(red * 0.25, red * 0.6, rpm); e.boost = lerp(e.boost, target, 1 - Math.exp(-dt * (target > e.boost ? 2.6 : 6))); }
        let thr = throttle;
        // idle control
        if (rpm < idleW / RPM2W * 1.05) thr = Math.max(thr, clamp((idleW / RPM2W * 1.05 - rpm) / 400, 0, 0.35));
        // rev limiter
        if (rpm > red) { e.limiter = 0.08; this.events.push('limiter'); }
        if (e.limiter > 0) { e.limiter -= dt; thr = 0; }
        let T = this.tq(rpm) * (car.engine.turbo ? 0.68 + 0.32 * e.boost : 1) * 1.12;
        if (car.engine.vtec && rpm > car.engine.vtec) T *= 1.08;
        Teng = T * thr;
        if (thr < 0.05 && rpm > red * 0.6 && Math.random() < dt * 3) this.events.push('backfire');
      }
      // friction / pumping losses
      const Tfric = (8 + car.engine.disp / 260 + rpm * 0.003 * (car.engine.disp / 2000)) * (rpm > 50 ? 1 : 0) * (throttle > 0.05 ? 0.6 : 1);
      // clutch engagement
      let eng;
      const inGear = ratio !== 0 && this.shiftTarget === null && !(this.mode === 'auto' && (this.atSel === 'P' || this.atSel === 'N'));
      if (!inGear) eng = 0;
      else if (this.mode === 'manual_clutch') eng = 1 - c.clutch;
      else {
        // auto clutch: launch curve, closes with road speed or once the gearbox side has caught up with the engine;
        // never lets the engine be dragged below idle (anti-stall)
        const wIn = (vx + this.slip) / this.r * ratio;
        eng = Math.max(this.autoClutchEngagement(we, throttle), sstep(3, 9, Math.abs(vx)), we > idleW * 1.3 ? sstep(0.8, 0.97, wIn / we) * sstep(idleW * 1.3, idleW * 1.8, we) : 0);
        eng *= sstep(idleW * 0.55, idleW * 0.85, we) * 0.85 + 0.15 * (we > idleW * 0.5 ? 1 : 0);
      }
      if (this.mode !== 'manual_clutch') eng *= (this.mode === 'auto' && c.brake > 0.5 && Math.abs(vx) < 0.5 ? 0.35 : 1);
      // pulling the handbrake in a RWD car with an auto clutch dips the clutch (release = clutch kick)
      if (hbPull && front === 0 && this.mode !== 'manual_clutch') eng = 0;
      const wt = (vx + this.slip) / this.r * ratio; // transmission input speed (signed by gear)
      const kc = 35, cap = eng * car.engine.nm * 1.6;
      let Tc = 0;
      if (eng > 0.001) {
        // implicit clutch coupling: the wheel side is light while spinning (low gears) → an explicit spring
        // chatters every sub-step and keeps the wheels spinning forever; solve for the end-of-step torque instead
        const Meff = lerp(m, WHEEL_MASS * m, sstep(0.05, 0.6, Math.abs(this.slip)));
        const A = 1 / this.Ie + ratio * ratio * eta / (this.r * this.r * Meff);
        Tc = clamp(kc * (we - wt + dt * (Teng - Tfric) / this.Ie) / (1 + kc * A * dt), -cap, cap);
      }
      // engine speed
      let weN = we + (Teng - Tfric - Tc) / this.Ie * dt;
      if (!e.running && e.cranking <= 0) weN = Math.max(0, weN);
      if (eng > 0.97 && Math.abs(we - wt) < 6) Tc = Teng - Tfric;
      e.rpm = Math.max(0, weN / RPM2W);
      if (e.running && e.rpm < 380 && inGear && eng > 0.5) { e.running = false; this.events.push('stall'); }
      if (!e.running && e.cranking <= 0) e.rpm = Math.max(0, e.rpm - dt * 1500);
      // torque converter multiplication (AT) while slipping
      const tcMul = (this.mode === 'auto' && this.transType === 'AT' && we > 1) ? 1 + 0.9 * clamp(1 - Math.abs(wt) / we, 0, 1) : 1;
      Fdrive = Tc * tcMul * ratio * eta / this.r;
      // hill-start assist: in D/R the car is held instead of rolling backwards against the selected direction
      const dirS = this.atSel === 'D' ? 1 : this.atSel === 'R' ? -1 : 0;
      const rollback = (this.mode === 'auto' || this.ev) && dirS && e.running && vx * dirS < -0.02 && Math.abs(vx) < 2.5;
      if ((this.mode === 'auto' && this.atSel === 'P' && Math.abs(vx) < 1.5) || rollback) { this.parkLock = true; } else this.parkLock = false;
    }

    // ── wheelspin: the driven wheels' slip speed grows when drive force exceeds what the tyres can transmit
    // (less when they are also cornering → power oversteer / understeer comes out naturally)
    const capF = MU_LONG * Fmf * Math.sqrt(Math.max(0.04, 1 - (0.8 * nf) ** 2)), capR = MU_LONG * Fmr * Math.sqrt(Math.max(0.04, 1 - (0.8 * nr) ** 2));
    const capD = front >= 1 ? capF : front <= 0 ? capR : Math.min(capF / front, capR / (1 - front));
    const excess = Math.abs(Fdrive) - capD * 0.98;
    const Mw = m * WHEEL_MASS; // equivalent wheel/driveline inertia as mass
    if (excess > 0 && Math.abs(Fdrive) > 1) this.slip += excess / Mw * Math.sign(Fdrive) * dt;
    else if (this.slip !== 0) { const dec = (Math.max(0, -excess) / Mw + 3) * dt; this.slip = Math.abs(this.slip) <= dec ? 0 : this.slip - Math.sign(this.slip) * dec; }
    this.slip = clamp(this.slip, -25, 40);
    const spinW = sstep(0.8, 3.2, Math.abs(this.slip)); // 0 = gripping, 1 = fully spinning
    const FxD = Math.sign(Fdrive) * Math.min(Math.abs(Fdrive), capD * 0.98);

    // ── brakes: pedal can ask for more than the tyres have; ABS caps each axle at its (combined) limit
    const hbPark = this.handbrakeOn && !hbPull ? 1 : 0;
    const Fb = c.brake * m * G * 1.3 * this.brakeK;
    let FbF = Fb * this.bias, FbR = Fb * (1 - this.bias) + hbPark * Fmr;
    if (this.parkLock) { FbF += Fmf; FbR += Fmr; }
    this.absActive = 0;
    if (A.abs) {
      if (FbF > capF * 0.97 && av > 1) { FbF = capF * 0.97; this.absActive = 1; }
      if (FbR > capR * 0.97 && av > 1) { FbR = capR * 0.97; this.absActive = 1; }
      this.lockF = this.lockR = false;
    } else {
      this.lockF = av > 1 && (this.lockF ? FbF > Fmf * 0.85 : FbF > capF * 1.02);
      this.lockR = av > 1 && (this.lockR ? FbR > Fmr * 0.85 : FbR > capR * 1.02);
    }
    // ── per-axle tyre forces (wheel frame)
    const slide = (vxc, vyc, Fm, k) => { const s = Math.hypot(vxc, vyc) || 1; return [-k * Fm * vxc / s, -k * Fm * vyc / s]; };
    // friction ellipse: tyres have ~10% more longitudinal than lateral grip
    const circle = (Fx, Fy, Fm) => { const t = Math.hypot(Fx / MU_LONG, Fy); return t > Fm ? [Fx * Fm / t, Fy * Fm / t] : [Fx, Fy]; };
    const bsF = Math.abs(vxw) > 0.05 ? -Math.sign(vxw) : 0, bsR = av > 0.05 ? -Math.sign(vx) : 0;
    // front
    let [Fxf, Fyf] = circle(FxD * front + bsF * FbF, -Fmf * nf, Fmf);
    if (this.lockF) [Fxf, Fyf] = slide(vxw, vyw, Fmf, 0.8);
    else if (front > 0 && spinW > 0) { const [sx, sy] = slide(-this.slip, vyw, Fmf, 0.9); Fxf = lerp(Fxf, sx + bsF * FbF * 0.3, spinW); Fyf = lerp(Fyf, sy, spinW); }
    // rear
    let [Fxr, Fyr] = circle(FxD * (1 - front) + bsR * FbR, -Fmr * nr, Fmr);
    if (this.lockR) [Fxr, Fyr] = slide(vx, vyR, Fmr, 0.8);
    else if (front < 1 && spinW > 0) { const [sx, sy] = slide(-this.slip, vyR, Fmr, 0.9); Fxr = lerp(Fxr, sx + bsR * FbR * 0.3, spinW); Fyr = lerp(Fyr, sy, spinW); }
    if (hbPull && av > 0.5) { // handbrake: rear wheels lock and slide along the contact patch velocity
      const k = sstep(0.3, 0.7, c.handbrake); const [sx, sy] = slide(vx, vyR, Fmr, 0.85);
      Fxr = lerp(Fxr, sx, k); Fyr = lerp(Fyr, sy, k);
    }

    // ── stability management (STM): ESC-style yaw moment from individual wheel braking + throttle cut
    let Mstm = 0, Fstm = 0;
    this.stmCut = 0; this.stmActive = 0;
    if (A.stm !== 'off' && vx > 4 && !hbPull) {
      const full = A.stm === 'full';
      let ex = 0;
      if (full) { // keep yaw rate close to what the driver asked for (no oversteer beyond a small margin)
        const rLim = mu * G / vx * 1.05;
        const rDes = clamp(vx * dUser / (L * (1 + vx * vx / 900)), -rLim, rLim);
        const err = r - rDes;
        if (Math.abs(r) > Math.abs(rDes) && Math.sign(err) === Math.sign(r)) ex = Math.sign(err) * Math.max(0, Math.abs(err) - 0.08);
      }
      // sideslip limit (sport lets you hang the tail out ~20° before catching it)
      const bMax = full ? 0.09 : lerp(0.42, 0.14, sstep(22, 50, vx));
      const bEx = Math.abs(beta) - bMax;
      if (bEx > 0 && r * beta < 0) ex += -Math.sign(beta) * bEx * 2.5;
      if (ex !== 0) {
        const Mmax = 0.45 * m * G * this.track / 2;
        Mstm = -clamp(ex * this.Iz * 9, -Mmax, Mmax);
        Fstm = Math.abs(Mstm) / (this.track / 2) * 0.5;
        this.stmCut = clamp(Math.abs(ex) * (full ? 2.5 : 1.2), 0, 0.85);
        this.stmActive = 1;
      }
    }

    // ── rolling + aero
    const drag = this.dragK * vx * Math.abs(vx);
    const roll = 0.013 * m * G * Math.sign(vx) * Math.min(1, Math.abs(vx));
    // ── integrate in body frame
    const Fx = Fxf * cd - Fyf * sd + Fxr - drag - roll + this.gradeForce() - Math.sign(vx) * Math.min(Fstm, m * av * 2);
    const Fy = Fxf * sd + Fyf * cd + Fyr;
    let ax2 = Fx / m;
    const ay2 = Fy / m;
    // sideslip-rate damping (stands in for tyre relaxation / damper effects the single-track model lacks):
    // resists the body yawing faster or slower than the path curves (r − ay/v = −β̇), so the car settles
    // instead of wagging at the limit; zero effect in a steady corner or steady drift
    let Mdamp = 0;
    if (av > 5) {
      // eased off while sliding on purpose (big sideslip or handbrake) so drifts can be initiated and held
      const k = SP.damp * sstep(5, 15, av) * lerp(1, 0.3, sstep(0.08, 0.3, Math.abs(beta))) * (hbPull ? 0.3 : 1);
      Mdamp = -clamp((r - ay2 / vx) * this.Iz * k, -m * G * 0.6, m * G * 0.6);
    }
    const Mz = this.a * (Fxf * sd + Fyf * cd) - this.b * Fyr + Mstm + Mdamp;
    // stop exactly when braking at low speed
    const hold = c.brake + (hbPull || hbPark ? 1 : 0) + (this.parkLock ? 1 : 0);
    if (Math.abs(vx) < 0.4 && hold > 0.1 && Math.abs(FxD) < hold * m * G * 0.6) { vx *= Math.exp(-dt * 20); ax2 = 0; }
    vx += (ax2 + vy * r) * dt;
    vy += (ay2 - vx * r) * dt;
    let rN = r + Mz / this.Iz * dt;
    // parking speeds: blend smoothly into kinematic (Ackermann) yaw and no lateral creep
    const kin = 1 - sstep(0.4, 2.5, Math.abs(vx));
    if (kin > 0) { vy *= Math.exp(-dt * 12 * kin); rN = lerp(rN, (vx / L) * Math.tan(delta), 1 - Math.exp(-dt * 14 * kin)); }
    this.yawRate = rN;
    this.yaw += rN * dt;
    this.ax = lerp(this.ax, ax2, 1 - Math.exp(-dt * 8)); this.ay = lerp(this.ay, ay2, 1 - Math.exp(-dt * 8));
    // back to world
    const f2 = this.forward, l2 = this.left;
    this.vel.set(f2.x * vx + l2.x * vy, 0, f2.z * vx + l2.z * vy);
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    this.vx = vx; this.vlat = vy;
    this.odometer += Math.abs(vx) * dt;
    this.slipAngle = Math.atan2(vy, Math.max(2, Math.abs(vx)));
    this.alphaF = af; this.alphaR = ar;
    const moving = sstep(1.5, 4, Math.hypot(vx, vy));
    this.tireSlip = clamp(Math.max((Math.abs(ar) / this.apR - 0.75) * 0.9, (Math.abs(af) / this.apF - 0.85) * 0.7, spinFracAudio(this.slip), (hbPull && av > 3) ? 0.8 : 0, (this.lockF || this.lockR) ? 0.9 : 0, this.absActive ? 0.35 : 0) * moving, 0, 1);
    if (!this.ev && this.fuel > 0) this.fuel -= (this.engine.running ? 0.000004 + Teng * 0.0000002 : 0) * dt;
  }
  gradeForce() { return -this.m * G * (this.grade || 0); }

  // ground contact, barriers, colliders
  contact(dt, net, world) {
    const q = net.query(this.pos.x, this.pos.z, this.pos.y + 0.5, (x, z) => world.ground(x, z));
    const target = q.y;
    if (target < this.pos.y - 0.6) { // falling
      this.vy -= G * dt; this.pos.y += this.vy * dt; this.airborne += dt;
      if (this.pos.y <= target) { this.pos.y = target; if (this.vy < -6) this.events.push('crash'); this.vy = 0; }
    } else { this.pos.y = this.pos.y < target ? target : lerp(this.pos.y, target, 1 - Math.exp(-dt * 40)); this.vy = 0; this.airborne = 0; } // never sink below the surface
    this.onRoad = q.onRoad; this.road = q.road; this.surface = q;
    // grade along heading (from two-point sample)
    const f = this.forward;
    const qa = net.query(this.pos.x + f.x * 1.3, this.pos.z + f.z * 1.3, this.pos.y + 0.6, (x, z) => world.ground(x, z)).y;
    const qb = net.query(this.pos.x - f.x * 1.3, this.pos.z - f.z * 1.3, this.pos.y + 0.6, (x, z) => world.ground(x, z)).y;
    this.grade = clamp((qa - qb) / 2.6, -0.15, 0.15);
    // cross-slope (camber / banked ramps): sample the body's left and right edge
    const lx = Math.cos(this.yaw), lz = -Math.sin(this.yaw), hw = 0.8;
    const ql = net.query(this.pos.x + lx * hw, this.pos.z + lz * hw, this.pos.y + 0.6, (x, z) => world.ground(x, z)).y;
    const qr = net.query(this.pos.x - lx * hw, this.pos.z - lz * hw, this.pos.y + 0.6, (x, z) => world.ground(x, z)).y;
    this.bank = clamp((ql - qr) / (hw * 2), -0.12, 0.12);
    this.surfaceMu = (q.onRoad || world.isLand(this.pos.x, this.pos.z) ? 1 : 0.6) * (world.wetGrip ?? 1);
    // barriers on elevated / ramp roads, and tunnel walls below ground (without them a car leaving the carriageway in a
    // tunnel lost the road and popped up to the surface)
    if (q.hit && q.road.kind !== 'local' && (q.y > 0.5 || q.y < -0.5)) {
      const hRoad = q.hit; const edge = hRoad.lat > 0 ? hRoad.road.edgeL - 0.95 : hRoad.road.edgeR + 0.95;
      if (Math.abs(hRoad.lat) > Math.abs(edge)) {
        // is there another surface here (junction)?
        const others = net.hits(this.pos.x, this.pos.z).filter(h => h.road !== hRoad.road && h.inside && Math.abs(h.y - q.y) < 1.2 && Math.abs(h.lat) < Math.abs(h.lat > 0 ? h.road.edgeL : h.road.edgeR) - 0.9);
        if (!others.length) {
          const seg = hRoad.road.samples[hRoad.i]; const left = seg.left;
          const push = hRoad.lat - edge;
          this.pos.x -= left.x * push; this.pos.z -= left.z * push;
          const vn = this.vel.x * left.x + this.vel.z * left.z;
          if (vn * Math.sign(push) > 0) {
            this.wallHit(-left.x * Math.sign(push), -left.z * Math.sign(push), Math.abs(vn));
            if (Math.abs(vn) > 3) this.events.push('crash');
          }
        }
      }
    }
    // static colliders (3 circles along the car)
    const rad = this.car.W / 2000 * 0.95, halfL = this.car.L / 2000;
    for (const off of [-halfL + rad, 0, halfL - rad]) {
      const cx = this.pos.x + f.x * off, cz = this.pos.z + f.z * off;
      for (const list of world.colliderLists ? world.colliderLists(cx, cz) : [world.colliders]) for (const C of list) {
        if (this.pos.y + 1.5 < C.y0 || this.pos.y > C.y1) continue;
        const dx = cx - C.x, dz = cz - C.z;
        if (Math.abs(dx) > C.hx + C.hz + rad + 1 && Math.abs(dz) > C.hx + C.hz + rad + 1) continue;
        const lx = dx * C.c - dz * C.s, lz = dx * C.s + dz * C.c; // into collider frame
        const px = clamp(lx, -C.hx, C.hx), pz = clamp(lz, -C.hz, C.hz);
        const ex = lx - px, ez = lz - pz; const d2 = ex * ex + ez * ez;
        if (d2 < rad * rad) {
          let nx, nz, pen;
          if (d2 > 1e-6) { const d = Math.sqrt(d2); nx = ex / d; nz = ez / d; pen = rad - d; }
          else { // centre inside box
            const ox = C.hx - Math.abs(lx), oz = C.hz - Math.abs(lz);
            if (ox < oz) { nx = Math.sign(lx); nz = 0; pen = ox + rad; } else { nx = 0; nz = Math.sign(lz); pen = oz + rad; }
          }
          // back to world
          const wx = nx * C.c + nz * C.s, wz = -nx * C.s + nz * C.c;
          this.pos.x += wx * pen; this.pos.z += wz * pen;
          const vn = this.vel.x * wx + this.vel.z * wz;
          if (vn < 0) { this.wallHit(wx, wz, -vn); if (vn < -3) this.events.push('crash'); }
        }
      }
    }
    if (this.pos.y < -1.2 && !this.onRoad) this.inWater = true; // tunnels run below sea level
  }

  /**
   * Resolve an impact against a wall / barrier / static box. (nx, nz) = unit normal pointing away from the wall
   * (towards the car), vin = closing speed (m/s).
   * Grazing hits keep most of the speed and slide along (the nose is turned to follow the wall); head-on hits
   * stop the car with a small bounce instead of sticking or ricocheting.
   */
  wallHit(nx, nz, vin) {
    // contact point on the body (for damage): the side of the car facing the wall
    if (vin > 1.5) this.lastHit = { x: this.pos.x - nx * this.car.W / 2000, z: this.pos.z - nz * this.car.W / 2000, y: this.pos.y + 0.6, vin, t: performance.now() };
    const v = this.vel, sp = Math.hypot(v.x, v.z) || 1;
    const sinA = clamp(vin / sp, 0, 1); // 0 = parallel graze, 1 = head-on
    const e = 0.12 + 0.1 * sinA;        // restitution
    v.x += nx * vin * (1 + e); v.z += nz * vin * (1 + e);
    // scrub: friction along the wall proportional to the normal impulse (capped so a graze doesn't stop you)
    const tx = -nz, tz = nx, vt = v.x * tx + v.z * tz;
    const scrub = Math.min(Math.abs(vt), vin * 0.3);
    v.x -= tx * Math.sign(vt) * scrub; v.z -= tz * Math.sign(vt) * scrub;
    // align the body with the wall on glancing hits / while scraping along it (the touching corner pivots the
    // car) so it slides along instead of being steered back into the wall by its own tyres every frame
    const f = this.forward, dir = Math.sign(v.x * f.x + v.z * f.z) || 1;
    const fn = (f.x * nx + f.z * nz) * dir; // <0: nose pointing into the wall
    if (sinA < 0.6 && fn < 0) {
      const cross = (f.x * nz - f.z * nx) * dir; // which way to rotate to become parallel
      const k = clamp(0.12 + vin * 0.04, 0.12, 0.35);
      this.yaw += clamp(-Math.sign(cross) * Math.asin(clamp(-fn, 0, 1)), -0.3, 0.3) * k;
    }
    if (vin > 1) this.yawRate *= sinA > 0.6 ? 0.4 : 0.75;
    this.slip *= 0.5;
    this.vx = v.dot(this.forward); this.vlat = v.dot(this.left);
  }

  visual(dt) {
    const w = this.speed / this.r;
    for (let i = 0; i < 4; i++) {
      const driven = this.car.drive === 'AWD' || (this.car.drive === 'FF' ? i < 2 : i >= 2);
      const extra = driven ? this.slip / this.r : 0;
      const locked = i >= 2 && (this.ctl.handbrake > 0.3 || this.handbrakeOn);
      this.spin[i] += (locked ? 0 : (Math.sign(this.vx) * w + extra)) * dt;
    }
    this.pitch = lerp(this.pitch, clamp(this.ax * 0.006, -0.04, 0.04) - Math.atan(this.grade || 0) * 0, 1 - Math.exp(-dt * 6));
    this.roll = lerp(this.roll, clamp(-this.ay * 0.008, -0.06, 0.06), 1 - Math.exp(-dt * 6));
    // per-wheel suspension (visual): spring-damper following road texture (finer on expressway asphalt, coarser on
    // streets / lots) plus load transfer — front dips under braking, outer side compresses in corners
    if (!this.suspV) { this.suspV = [0, 0, 0, 0]; this.suspD = 0; }
    this.suspD += Math.abs(this.vx) * dt;
    const rough = this.road?.kind === 'local' || !this.onRoad ? 0.007 : 0.0035, sp = Math.min(1, Math.abs(this.vx) / 15);
    for (let i = 0; i < 4; i++) {
      const d = this.suspD + (i >= 2 ? 2.6 : 0) + (i % 2) * 0.37;
      const road = rough * sp * (Math.sin(d * 2.1 + i) * 0.6 + Math.sin(d * 5.3 + i * 1.7) * 0.3 + Math.sin(d * 13.7) * 0.1);
      const load = (i < 2 ? 1 : -1) * clamp(-this.ax * 0.0035, -0.03, 0.03) + ((i % 2) ? 1 : -1) * clamp(this.ay * 0.003, -0.03, 0.03);
      const tgt = road + load, k = 180, c = 2 * Math.sqrt(k) * 0.55;
      this.suspV[i] += (k * (tgt - this.susp[i]) - c * this.suspV[i]) * dt;
      this.susp[i] = clamp(this.susp[i] + this.suspV[i] * dt, -0.06, 0.06);
    }
  }
}
