// MIDNIGHT JAPAN — granular engine player (AudioWorklet).
// Engine recordings are pre-processed offline into the crank-angle domain: every 720° engine cycle is resampled to
// a fixed number of samples (N per block), and blocks of a few consecutive cycles are stored at many RPM points for
// two load layers (on = pulling under throttle, off = overrun / coasting). Playback advances a crank phase at
// rpm/120 cycles per second and overlap-adds 2-cycle Hann grains (hop = 1 cycle) picked at random from the blocks
// closest to the current RPM, so pitch follows RPM exactly, the timbre is that of the real engine at that RPM, and
// grains always line up on the engine cycle (no comb-filtering, no clicks at loop points).
// Bank data is registered once per family in the shared worklet global scope and referenced by all voices.

const BANKS = (globalThis.__mjBanks = globalThis.__mjBanks || new Map());

class Layer {
  constructor(bank, blocks) {
    this.bank = bank;
    this.b = blocks; // [{o, N, n, rpm}], sorted by rpm
    this.rpms = new Float64Array(blocks.map((x) => x.rpm));
  }
  // pick the two blocks around rpm + equal-power weights
  pick(rpm, out) {
    const r = this.rpms, n = r.length;
    if (rpm <= r[0]) { out.i0 = 0; out.i1 = 0; out.w0 = 1; out.w1 = 0; return; }
    if (rpm >= r[n - 1]) { out.i0 = n - 1; out.i1 = n - 1; out.w0 = 1; out.w1 = 0; return; }
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (r[m] <= rpm) lo = m; else hi = m; }
    const k = (rpm - r[lo]) / (r[hi] - r[lo]);
    out.i0 = lo; out.i1 = hi; out.w0 = Math.cos(k * Math.PI / 2); out.w1 = Math.sin(k * Math.PI / 2);
  }
}

class Grain {
  constructor() { this.active = false; this.age = 0; this.i0 = 0; this.i1 = 0; this.c0 = 0; this.c1 = 0; this.w0 = 1; this.w1 = 0; }
}

class GranularEngine extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 800, minValue: 0, maxValue: 30000, automationRate: 'k-rate' },
      { name: 'on', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' },
      { name: 'off', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' },
    ];
  }
  constructor(opts) {
    super();
    this.fam = (opts && opts.processorOptions && opts.processorOptions.fam) || '';
    this.L = null;
    this.ph = 0; // crank phase in cycles (fractional part used)
    this.g = { on: [new Grain(), new Grain()], off: [new Grain(), new Grain()] };
    this.next = 0; // which grain slot starts at the next cycle boundary
    this.gOn = 0; this.gOff = 0; this.rpmS = 0;
    this.sel = { i0: 0, i1: 0, w0: 1, w1: 0 };
    this.rnd = (Math.random() * 4294967296) >>> 0;
    this.alive = true;
    this.port.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === 'bank' && m.fam) {
        if (!BANKS.has(m.fam)) BANKS.set(m.fam, m.bank);
      } else if (m.type === 'stop') this.alive = false;
    };
  }
  _rand() { let x = this.rnd; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.rnd = x >>> 0; return this.rnd / 4294967296; }
  _ready() {
    if (this.L) return true;
    const bank = BANKS.get(this.fam);
    if (!bank) return false;
    this.data = bank.data;
    this.L = { on: new Layer(bank, bank.on), off: new Layer(bank, bank.off && bank.off.length ? bank.off : bank.on) };
    return true;
  }
  _start(gr, layer, rpm) {
    layer.pick(rpm, this.sel);
    const s = this.sel, B = layer.b;
    gr.active = true; gr.age = 0;
    gr.i0 = s.i0; gr.i1 = s.i1; gr.w0 = s.w0; gr.w1 = s.w1;
    // random cycle inside each block (grain spans 2 cycles → start in [0, n-2])
    const b0 = B[s.i0], b1 = B[s.i1];
    let c0 = Math.floor(this._rand() * (b0.n - 1));
    if (c0 === gr.c0 && b0.n > 2) c0 = (c0 + 1) % (b0.n - 1);
    gr.c0 = c0;
    gr.c1 = Math.floor(this._rand() * (b1.n - 1));
  }
  process(inputs, outputs, params) {
    const out = outputs[0] && outputs[0][0];
    if (!out) return this.alive;
    const n = out.length;
    if (!this._ready()) { out.fill(0); return this.alive; }
    const rpmT = Math.max(0, params.rpm[0]);
    const onT = params.on[0], offT = params.off[0];
    const sr = sampleRate;
    const D = this.data;
    const rpm0 = this.rpmS || rpmT;
    const on0 = this.gOn, off0 = this.gOff;
    const LO = this.L.on, LF = this.L.off;
    const GO = this.g.on, GF = this.g.off;
    let ph = this.ph;
    for (let i = 0; i < n; i++) {
      const k = (i + 1) / n;
      const rpm = rpm0 + (rpmT - rpm0) * k;
      const gOn = on0 + (onT - on0) * k, gOff = off0 + (offT - off0) * k;
      const f = Math.max(1, rpm) / 120;
      ph += f / sr;
      if (ph >= 1) {
        ph -= 1;
        // a new grain starts on every cycle boundary in the slot whose grain just finished (age 2 cycles)
        const s = this.next; this.next ^= 1;
        this._start(GO[s], LO, rpm);
        this._start(GF[s], LF, rpm);
      }
      let yOn = 0, yOff = 0;
      for (let s = 0; s < 2; s++) {
        // grain s phase in [0,2): slot "next" holds the older grain
        const u = (s === this.next ? 1 : 0) + ph; // older grain is 1 cycle ahead
        const w = Math.sin(Math.PI * u * 0.5); const win = w * w; // Hann over 2 cycles, sums to 1 with hop 1
        const go = GO[s];
        if (go.active && gOn > 1e-4) yOn += win * this._read(D, LO.b, go, u);
        const gf = GF[s];
        if (gf.active && gOff > 1e-4) yOff += win * this._read(D, LF.b, gf, u);
      }
      out[i] = yOn * gOn + yOff * gOff;
    }
    this.ph = ph; this.rpmS = rpmT; this.gOn = onT; this.gOff = offT;
    for (let c = 1; c < outputs[0].length; c++) outputs[0][c].set(out);
    return this.alive;
  }
  _read(D, B, g, u) {
    let y = 0;
    const b0 = B[g.i0];
    let p = b0.o + (g.c0 + u) * b0.N;
    let ip = p | 0, a = p - ip;
    y += g.w0 * (D[ip] + (D[ip + 1] - D[ip]) * a);
    if (g.w1 > 1e-3) {
      const b1 = B[g.i1];
      p = b1.o + (g.c1 + u) * b1.N;
      ip = p | 0; a = p - ip;
      y += g.w1 * (D[ip] + (D[ip + 1] - D[ip]) * a);
    }
    return y;
  }
}

registerProcessor('mj-granular-engine', GranularEngine);
