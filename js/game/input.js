// Unified input: keyboard, gamepad (standard mapping) and on-screen touch controls.
// Produces analog axes + one-shot actions; keeps controls simple by default.
export const KEYMAP = {
  throttle: ['KeyW', 'ArrowUp'], brake: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  handbrake: ['Space'], clutch: ['ShiftLeft', 'ShiftRight'],
  // one-shot actions
  shiftUp: ['KeyE'], shiftDown: ['KeyQ'], interact: ['KeyF'], ignition: ['KeyI'], lights: ['KeyL'], horn: ['KeyH'],
  camera: ['KeyC'], radio: ['KeyR'], radioNext: ['KeyT'], signalL: ['KeyZ'], signalR: ['KeyX'], hazard: ['KeyB'], fog: ['KeyO'],
  carMenu: ['Tab'], strobe: ['KeyK'], siren: ['KeyP'], map: ['KeyM'], pause: ['Escape'], photo: ['KeyV'], look: ['KeyG'],
  regen: ['KeyN'], run: ['ShiftLeft'], jump: ['Space'],
  gear1: ['Digit1'], gear2: ['Digit2'], gear3: ['Digit3'], gear4: ['Digit4'], gear5: ['Digit5'], gear6: ['Digit6'], gear7: ['Digit7'], gearR: ['Digit0'], gearN: ['Backquote', 'Digit9'],
};
const ACTIONS = ['shiftUp', 'shiftDown', 'interact', 'ignition', 'lights', 'horn', 'camera', 'radio', 'radioNext', 'signalL', 'signalR', 'hazard', 'fog', 'carMenu', 'strobe', 'siren', 'map', 'pause', 'photo', 'look', 'regen', 'gear1', 'gear2', 'gear3', 'gear4', 'gear5', 'gear6', 'gear7', 'gearR', 'gearN', 'jump'];

export class Input {
  constructor(el) {
    this.down = new Set(); this.pressed = new Set(); this.enabled = true;
    this.axes = { throttle: 0, brake: 0, steer: 0, clutch: 0, handbrake: 0, moveX: 0, moveY: 0, lookX: 0, lookY: 0 };
    this.touch = { throttle: 0, brake: 0, steer: 0, handbrake: 0, moveX: 0, moveY: 0 };
    this.mouse = { dx: 0, dy: 0, wheel: 0, dragging: false };
    this.steerSmooth = 0; this.tilt = false; this.tiltSteer = 0;
    this.lastDevice = 'kb';
    addEventListener('keydown', e => {
      if (!this.enabled) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code); this.lastDevice = 'kb';
    });
    addEventListener('keyup', e => this.down.delete(e.code));
    addEventListener('blur', () => this.down.clear());
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { this.mouse.dragging = true; } });
    addEventListener('pointerup', () => { this.mouse.dragging = false; });
    addEventListener('pointermove', e => { if (this.mouse.dragging || document.pointerLockElement) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; } });
    el.addEventListener('wheel', e => { this.mouse.wheel += Math.sign(e.deltaY); }, { passive: true });
    addEventListener('deviceorientation', e => { if (this.tilt && e.gamma != null) { const land = (screen.orientation?.angle || 0) % 180 !== 0; const v = land ? e.beta * (screen.orientation.angle === 90 ? 1 : -1) : e.gamma; this.tiltSteer = Math.max(-1, Math.min(1, -v / 30)); } });
    this.gpPrev = {};
  }
  key(name) { return KEYMAP[name].some(k => this.down.has(k)); }
  // call once per frame
  poll(dt) {
    const a = this.axes;
    const kb = { throttle: this.key('throttle') ? 1 : 0, brake: this.key('brake') ? 1 : 0, steer: (this.key('left') ? 1 : 0) - (this.key('right') ? 1 : 0), clutch: this.key('clutch') ? 1 : 0, handbrake: this.key('handbrake') ? 1 : 0 };
    // smooth keyboard steering (rate-limited, auto-centre)
    const target = kb.steer;
    const rate = target === 0 ? 5 : (Math.sign(target) !== Math.sign(this.steerSmooth) ? 7 : 3.2);
    this.steerSmooth += Math.max(-rate * dt, Math.min(rate * dt, target - this.steerSmooth));
    // gamepad
    let gp = null;
    try { gp = [...(navigator.getGamepads?.() || [])].find(g => g && g.connected); } catch {}
    const g = { throttle: 0, brake: 0, steer: 0, clutch: 0, handbrake: 0, mx: 0, my: 0, lx: 0, ly: 0 };
    if (gp) {
      const dz = v => Math.abs(v) < 0.12 ? 0 : (v - Math.sign(v) * 0.12) / 0.88;
      g.steer = -dz(gp.axes[0] || 0); g.mx = dz(gp.axes[0] || 0); g.my = -dz(gp.axes[1] || 0);
      g.lx = dz(gp.axes[2] || 0); g.ly = dz(gp.axes[3] || 0);
      g.throttle = gp.buttons[7]?.value || 0; g.brake = gp.buttons[6]?.value || 0;
      g.handbrake = gp.buttons[0]?.pressed ? 1 : 0; g.clutch = gp.buttons[2]?.pressed ? 1 : 0;
      const map = { 5: 'shiftUp', 4: 'shiftDown', 3: 'camera', 13: 'interact', 1: 'interact', 8: 'ignition', 12: 'lights', 11: 'horn', 15: 'radio', 14: 'radioNext', 9: 'pause', 10: 'look' };
      for (const [i, act] of Object.entries(map)) { const p = !!gp.buttons[i]?.pressed; if (p && !this.gpPrev[i]) { this.pressed.add('GP:' + act); this.lastDevice = 'gp'; } this.gpPrev[i] = p; }
      if (g.throttle || g.brake || g.steer) this.lastDevice = 'gp';
    }
    const T = this.touch;
    a.throttle = Math.max(kb.throttle, g.throttle, T.throttle);
    a.brake = Math.max(kb.brake, g.brake, T.brake);
    let st = this.steerSmooth;
    if (Math.abs(g.steer) > Math.abs(st)) st = g.steer;
    if (Math.abs(T.steer) > Math.abs(st)) st = T.steer;
    if (this.tilt && Math.abs(this.tiltSteer) > Math.abs(st)) st = this.tiltSteer;
    a.steer = st;
    a.clutch = Math.max(kb.clutch, g.clutch, T.clutch || 0);
    a.handbrake = Math.max(kb.handbrake, g.handbrake, T.handbrake);
    a.moveY = (this.key('throttle') ? 1 : 0) - (this.key('brake') ? 1 : 0) || g.my || T.moveY;
    a.moveX = (this.key('right') ? 1 : 0) - (this.key('left') ? 1 : 0) || g.mx || T.moveX;
    a.run = this.key('run') || (gp?.buttons[10]?.pressed);
    a.lookX = g.lx; a.lookY = g.ly;
  }
  // one-shot action query (consumes)
  act(name) {
    if (this.pressed.has('GP:' + name)) { this.pressed.delete('GP:' + name); return true; }
    if (this.pressed.has('T:' + name)) { this.pressed.delete('T:' + name); return true; }
    for (const k of KEYMAP[name] || []) if (this.pressed.has(k)) { this.pressed.delete(k); return true; }
    return false;
  }
  tap(name) { this.pressed.add('T:' + name); }
  endFrame() { this.pressed.clear(); this.mouse.dx = this.mouse.dy = 0; this.mouse.wheel = 0; }
}
export { ACTIONS };
