// MIDNIGHT JAPAN — recorded-sample banks (lazy loaded).
// Engine banks: CC0 recordings converted offline to crank-angle-domain grain tables (see audio-engine-worklet.js).
// SFX: CC0 one-shots / loops. Sources and licences: assets/CREDITS.md.

const BASE = new URL('../../assets/audio/', import.meta.url).href;
// families that have a bank on disk (anything else silently stays on the synthesizer)
const FAMS = new Set(['i4', 'i6', 'f4', 'v8', 'v10', 'diesel']);
const WORKLET = new URL('./audio-engine-worklet.js', import.meta.url).href;

// engine layout → bank family + rpm scale (bank rpm = engine rpm × scale keeps the firing frequency right:
// a 3-cyl played through a 4-cyl bank at ¾ rpm fires 3 times per cycle, a 6-cyl diesel through the 4-cyl diesel at 1.5×)
export function engineFamily(car) {
  const e = (car && car.engine) || {};
  const type = e.type || 'I4';
  const diesel = type !== 'EV' && (e.redline || 7000) < 5000;
  if (type === 'EV') return null;
  if (diesel) return { fam: 'diesel', scale: (e.cyl || (type === 'I6' ? 6 : 4)) / 4 };
  switch (type) {
    case 'I6': return { fam: 'i6', scale: 1 };
    case 'V6': return { fam: 'i6', scale: 1, tone: 'v6' };
    case 'F6': return { fam: 'i6', scale: 1, tone: 'f6' };
    case 'V8': return { fam: 'v8', scale: 1 };
    case 'V10': return { fam: 'v10', scale: 1 };
    case 'V12': return { fam: 'v10', scale: 1.2 };
    case 'F4': return { fam: 'f4', scale: 1 };
    case 'R2': return { fam: 'i4', scale: 1, tone: 'rotary' };
    case 'I3': return { fam: 'i4', scale: 0.75, tone: 'i3' };
    default: return { fam: 'i4', scale: 1 };
  }
}

export class Banks {
  constructor(ctx) {
    this.ctx = ctx;
    this.engines = new Map(); // fam → Promise<bank|null>
    this.ready = new Map(); // fam → bank (sync access)
    this.sfx = new Map(); // name → Promise<AudioBuffer|null>
    this.sfxReady = new Map();
    this.registered = new Set(); // fams already posted to the worklet scope
    this.workletOk = false;
    this.workletP = null;
    try {
      if (ctx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        this.workletP = ctx.audioWorklet.addModule(WORKLET).then(() => { this.workletOk = true; return true; }, (e) => { console.warn('[audio] worklet', e); return false; });
      } else this.workletP = Promise.resolve(false);
    } catch (e) { this.workletP = Promise.resolve(false); }
  }
  async _decode(url, rate) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ' ' + r.status);
    const ab = await r.arrayBuffer();
    // decode at the file's own rate so sample offsets stay exact (an OfflineAudioContext decodes to its own rate)
    const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
    const dc = rate && OAC ? new OAC(1, 1, rate) : this.ctx;
    return await new Promise((res, rej) => { const p = dc.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); });
  }
  engine(fam) {
    if (!fam || !FAMS.has(fam)) return Promise.resolve(null);
    if (this.engines.has(fam)) return this.engines.get(fam);
    const p = (async () => {
      try {
        const ok = await this.workletP;
        if (!ok) return null;
        const meta = await (await fetch(BASE + 'engines/' + fam + '.json')).json();
        const buf = await this._decode(BASE + 'engines/' + fam + '.ogg', meta.sr);
        const data = buf.getChannelData(0);
        const bank = { fam, data, on: meta.on, off: meta.off, sr: meta.sr, rpmMin: Math.min(...meta.on.map((b) => b.rpm)), rpmMax: Math.max(...meta.on.map((b) => b.rpm)) };
        this.ready.set(fam, bank);
        return bank;
      } catch (e) { console.warn('[audio] engine bank', fam, e); return null; }
    })();
    this.engines.set(fam, p);
    return p;
  }
  // create a granular voice for a loaded bank (sync; caller checks this.ready first)
  voice(fam) {
    const bank = this.ready.get(fam);
    if (!bank || !this.workletOk) return null;
    this.live = (this.live || 0) + 1;
    const node = new AudioWorkletNode(this.ctx, 'mj-granular-engine', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1], processorOptions: { fam } });
    if (!this.registered.has(fam)) {
      this.registered.add(fam);
      node.port.postMessage({ type: 'bank', fam, bank: { data: bank.data, on: bank.on, off: bank.off } });
    }
    return node;
  }
  buffer(name) {
    if (this.sfx.has(name)) return this.sfx.get(name);
    const p = this._decode(BASE + 'sfx/' + name + '.ogg').then((b) => { this.sfxReady.set(name, b); return b; }, (e) => { console.warn('[audio] sfx', name, e); return null; });
    this.sfx.set(name, p);
    return p;
  }
  get(name) { return this.sfxReady.get(name) || null; }
}
