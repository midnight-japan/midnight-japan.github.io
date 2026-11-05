// Vehicle dynamics: 2-axle tyre model with load transfer, friction circle, wheelspin & handbrake drift,
// engine with torque curve / turbo lag / rev limiter, clutch (manual or auto), MT / AT / DCT / EV with regen.
import * as THREE from 'three';

const G = 9.81;
const RPM2W = Math.PI * 2 / 60;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const TRANS_MODES = ['auto', 'manual', 'manual_clutch']; // auto = AT behaviour for everything, manual = sequential with auto-clutch, manual_clutch = H-pattern + clutch pedal

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
    this.mu = (car.cat === 'traffic' ? 0.95 : 1.05);
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
    this.tcs = opts.tcs ?? true;
  }
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
    const launch = idle * (1.15 + thr * 2.4);
    return 0.07 * sstep(idle * 0.8, idle * 1.0, we) + 0.93 * sstep(idle * 1.05, launch, we);
  }

  step(dt) {
    const c = this.ctl, e = this.engine, car = this.car;
    const m = this.m, L = this.wb;
    // ── body-frame velocities
    const f = this.forward, l = this.left;
    let vx = this.vel.dot(f), vy = this.vel.dot(l);
    const r = this.yawRate;
    // ── steering (speed-sensitive, smoothed)
    const maxSteer = 0.62 / (1 + Math.abs(vx) / 22);
    this.steerAng = lerp(this.steerAng, c.steer * maxSteer, 1 - Math.exp(-dt * 9));
    const delta = this.steerAng;
    // ── loads
    const ax = this.ax;
    const Fzf = clamp(m * G * this.b / L - m * ax * this.h / L, m * G * 0.1, m * G * 0.9);
    const Fzr = clamp(m * G * this.a / L + m * ax * this.h / L, m * G * 0.1, m * G * 0.9);
    const camberGain = 1 + clamp(-(this.camberF + this.camberR) * 0.008, -0.05, 0.06);
    const mu = this.mu * (this.surfaceMu ?? 1) * camberGain;
    // ── slip angles
    const vxs = Math.max(Math.abs(vx), 1.0);
    const sgn = vx >= 0 ? 1 : -1;
    const af = Math.atan2(vy + this.a * r, vxs) - delta * sgn;
    const ar = Math.atan2(vy - this.b * r, vxs);
    const lat = (alpha, Fz, muK) => -muK * Fz * Math.sin(1.45 * Math.atan(9 * alpha));
    // ── drivetrain
    const drive = car.drive;
    const front = drive === 'FF' ? 1 : drive === 'AWD' ? 0.45 : 0;
    const Fzd = drive === 'AWD' ? Fzf + Fzr : Fzf * front + Fzr * (1 - front); // driven load
    const ratio = this.ratio();
    const eta = 0.9;
    let Fdrive = 0;
    const we = e.rpm * RPM2W;
    const idleW = (car.engine.idle || 800) * RPM2W;
    let throttle = c.throttle;
    // traction control (assist): cut throttle on sustained wheelspin unless the handbrake is used
    if (this.tcs && Math.abs(this.slip) > 1.2 && !(c.handbrake > 0.3)) throttle *= clamp(1 - (Math.abs(this.slip) - 1.2) / 2.5, 0.25, 1);
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
      else if (rpm < down && this.gear > 1 && this.timeInGear > 0.4) { const nr = this.ratio(this.gear - 1); if (Math.abs(vx) / this.r * nr / RPM2W < red * 0.88) { this.shiftTarget = this.gear - 1; this.shiftT = 0.18; this.timeInGear = 0; } }
    }
    this.timeInGear = (this.timeInGear || 0) + dt;

    // engine torque available
    let Teng = 0;
    if (this.ev) {
      const wm = Math.abs(vx) / this.r * Math.abs(ratio || this.final);
      const Pmax = car.engine.hp * 735.5, Tmax = car.engine.nm;
      const avail = this.battery > 0.01 && e.running;
      const Tm = avail ? Math.min(Tmax, Pmax / Math.max(wm, 1)) : 0;
      const dirSel = this.atSel === 'D' ? 1 : this.atSel === 'R' ? -1 : 0;
      let T = Tm * throttle * dirSel;
      // regenerative braking (lift-off) and on brake pedal
      const regenK = [0, 0.06, 0.12, 0.24][this.regenLevel];
      let Tregen = 0;
      if (dirSel !== 0 && Math.abs(vx) > 0.3) Tregen = -Math.sign(vx) * Math.min(Tmax, m * G * (regenK * (1 - throttle) + 0.15 * c.brake) * this.r / Math.abs(this.final));
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
        if (car.engine.turbo) { const target = throttle * sstep(red * 0.25, red * 0.6, rpm); e.boost = lerp(e.boost, target, 1 - Math.exp(-dt * (target > e.boost ? 2.2 : 6))); }
        let thr = throttle;
        // idle control
        if (rpm < idleW / RPM2W * 1.05) thr = Math.max(thr, clamp((idleW / RPM2W * 1.05 - rpm) / 400, 0, 0.35));
        // rev limiter
        if (rpm > red) { e.limiter = 0.08; this.events.push('limiter'); }
        if (e.limiter > 0) { e.limiter -= dt; thr = 0; }
        let T = this.tq(rpm) * (car.engine.turbo ? 0.62 + 0.38 * e.boost : 1) * 1.12;
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
      else eng = Math.max(this.autoClutchEngagement(we, throttle), sstep(2.5, 6, Math.abs(vx))) * (this.mode === 'auto' && c.brake > 0.5 && Math.abs(vx) < 0.5 ? 0.35 : 1);
      const wt = (vx + this.slip) / this.r * ratio; // transmission input speed (signed by gear)
      const kc = 35, cap = eng * car.engine.nm * 1.6;
      let Tc = 0;
      if (eng > 0.001) Tc = clamp(kc * (we - wt), -cap, cap);
      // engine speed
      let weN = we + (Teng - Tfric - Tc) / this.Ie * dt;
      if (!e.running && e.cranking <= 0) weN = Math.max(0, weN);
      // locked clutch shortcut (stiff coupling) for full engagement
      if (eng > 0.97 && Math.abs(we - wt) < 6) { weN = wt + (Teng - Tfric) / (this.Ie + this.m * this.r * this.r / (ratio * ratio + 1e-6)) * dt * 0; Tc = Teng - Tfric; }
      e.rpm = Math.max(0, weN / RPM2W);
      if (e.running && e.rpm < 380 && inGear && eng > 0.5) { e.running = false; this.events.push('stall'); }
      if (this.mode !== 'manual_clutch' && e.running && inGear && e.rpm < (car.engine.idle || 800) * 0.75) {/* auto clutch slips more */ }
      if (!e.running && e.cranking <= 0) e.rpm = Math.max(0, e.rpm - dt * 1500);
      // torque converter multiplication (AT) while slipping
      const tcMul = (this.mode === 'auto' && this.transType === 'AT' && we > 1) ? 1 + 0.9 * clamp(1 - Math.abs(wt) / we, 0, 1) : 1;
      Fdrive = Tc * tcMul * ratio * eta / this.r;
      if (this.mode === 'auto' && this.atSel === 'P' && Math.abs(vx) < 1.5) { this.parkLock = true; } else this.parkLock = false;
    }
    // ── tyre forces (friction circle per axle)
    const gripD = mu * Fzd;
    let Fx_d = Fdrive;
    // wheelspin state
    if (Math.abs(Fdrive) > gripD) { this.slip += (Math.abs(Fdrive) - gripD * 0.85) / (m * 0.06) * Math.sign(Fdrive) * dt; Fx_d = Math.sign(Fdrive) * gripD * 0.85; }
    else this.slip *= Math.exp(-dt * 6);
    this.slip = clamp(this.slip, -25, 40);
    if (Math.abs(this.slip) < 0.05) this.slip = 0;
    const spinFrac = clamp(Math.abs(this.slip) / 4, 0, 1);
    // brakes (ABS-ish)
    const brake = c.brake * (this.ev || this.mode === 'auto' ? 1 : 1);
    let Fb = brake * m * G * 1.05;
    // handbrake → rear lock
    const hb = c.handbrake || (this.handbrakeOn ? 1 : 0);
    let Fxf = Fx_d * front, Fxr = Fx_d * (1 - front);
    const bsgn = Math.abs(vx) > 0.05 ? -Math.sign(vx) : 0;
    Fxf += bsgn * Math.min(Fb * 0.62, mu * Fzf * 0.98);
    Fxr += bsgn * Math.min(Fb * 0.38, mu * Fzr * 0.98);
    if (hb > 0.3) Fxr += bsgn * mu * Fzr * 0.9 * hb;
    if (this.parkLock) { Fxf += bsgn * mu * Fzf; Fxr += bsgn * mu * Fzr; }
    // rolling + aero
    const drag = 0.5 * 1.2 * 0.32 * 2.0 * vx * Math.abs(vx);
    const roll = 0.013 * m * G * Math.sign(vx) * Math.min(1, Math.abs(vx));
    // lateral with friction circle
    let Fyf = lat(af, Fzf, mu), Fyr = lat(ar, Fzr, mu);
    const circle = (Fx, Fy, Fz, k = 1) => { const max = mu * Fz * k; const t = Math.hypot(Fx, Fy); if (t > max) { const s = max / t; return [Fx * s, Fy * s]; } return [Fx, Fy]; };
    const rearK = hb > 0.3 ? 0.55 : (1 - front) * spinFrac > 0.3 ? 0.7 : 1;
    [Fxf, Fyf] = circle(Fxf, Fyf, Fzf, front * spinFrac > 0.3 ? 0.75 : 1);
    [Fxr, Fyr] = circle(Fxr, Fyr, Fzr, rearK);
    // low-speed stabilisation: kill lateral sliding when nearly stopped
    // ── integrate in body frame
    const cosd = Math.cos(delta), sind = Math.sin(delta);
    const Fx = Fxf * cosd - Fyf * sind + Fxr - drag - roll + this.gradeForce();
    const Fy = Fxf * sind + Fyf * cosd + Fyr;
    const Mz = this.a * (Fxf * sind + Fyf * cosd) - this.b * Fyr;
    let ax2 = Fx / m, ay2 = Fy / m;
    // stop exactly when braking at low speed
    if (Math.abs(vx) < 0.4 && (brake > 0.1 || hb > 0.3 || this.parkLock) && Math.abs(Fx_d) < (brake + hb + (this.parkLock ? 1 : 0)) * m * G * 0.6) { vx *= Math.exp(-dt * 20); ax2 = 0; }
    vx += (ax2 + vy * r) * dt;
    vy += (ay2 - vx * r) * dt;
    let rN = r + Mz / this.Iz * dt;
    if (Math.abs(vx) < 1.5) { vy *= Math.exp(-dt * 8); rN = lerp(rN, (vx / L) * Math.tan(delta), 1 - Math.exp(-dt * 10)); }
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
    this.tireSlip = clamp(Math.max(Math.abs(this.slipAngle) * 3 - 0.25, spinFrac, (hb > 0.3 && Math.abs(vx) > 3) ? 0.8 : 0, (brake > 0.9 && Math.abs(vx) > 8) ? 0.3 : 0), 0, 1);
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
    } else { this.pos.y = lerp(this.pos.y, target, 1 - Math.exp(-dt * 25)); this.vy = 0; this.airborne = 0; }
    this.onRoad = q.onRoad; this.road = q.road; this.surface = q;
    // grade along heading (from two-point sample)
    const f = this.forward;
    const qa = net.query(this.pos.x + f.x * 1.3, this.pos.z + f.z * 1.3, this.pos.y + 0.6, (x, z) => world.ground(x, z)).y;
    const qb = net.query(this.pos.x - f.x * 1.3, this.pos.z - f.z * 1.3, this.pos.y + 0.6, (x, z) => world.ground(x, z)).y;
    this.grade = clamp((qa - qb) / 2.6, -0.15, 0.15);
    this.surfaceMu = q.onRoad || world.isLand(this.pos.x, this.pos.z) ? 1 : 0.6;
    // barriers on elevated / ramp roads
    if (q.hit && q.road.kind !== 'local' && q.y > 0.5) {
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
            this.vel.x -= left.x * vn * 1.3; this.vel.z -= left.z * vn * 1.3;
            if (Math.abs(vn) > 3) this.events.push('crash');
            this.vel.multiplyScalar(0.985);
            this.yawRate *= 0.6;
            // re-sync body speeds
            this.vx = this.vel.dot(this.forward); this.vlat = this.vel.dot(this.left);
          }
        }
      }
    }
    // static colliders (3 circles along the car)
    const rad = this.car.W / 2000 * 0.95, halfL = this.car.L / 2000;
    for (const off of [-halfL + rad, 0, halfL - rad]) {
      const cx = this.pos.x + f.x * off, cz = this.pos.z + f.z * off;
      for (const C of world.colliders) {
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
          if (vn < 0) { this.vel.x -= wx * vn * 1.4; this.vel.z -= wz * vn * 1.4; if (vn < -3) this.events.push('crash'); this.yawRate *= 0.7; }
          this.vx = this.vel.dot(this.forward); this.vlat = this.vel.dot(this.left);
        }
      }
    }
    if (this.pos.y < -1.2 && !this.onRoad) this.inWater = true; // tunnels run below sea level
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
  }
}
