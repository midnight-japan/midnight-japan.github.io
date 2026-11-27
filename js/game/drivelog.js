// v2.17 drive records: distance, top speed and driving time of this play session are saved on the game server
// (POST /api/drive, one row per session, values only grow) and feed the weekly ranking (ranking.html, lobby 🏁).
// Teleports and map travel are not counted: only distance the car actually drove (≤ 0.2 km per frame).
import { api } from '../server.js';
import { displayName } from '../account.js';

const SEND_EVERY = 30; // s

export class DriveLog {
  constructor(game) {
    this.g = game;
    this.sid = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');
    this.km = 0; this.top = 0; this.sec = 0; this.t = SEND_EVERY; this.sentKm = 0; this.lastV = null; this.lastOdo = 0;
    addEventListener('pagehide', () => this.send(true));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.send(true); });
  }
  update(dt) {
    const g = this.g, v = g.vehicle;
    if (!v || g.mode !== 'drive') { this.lastV = null; return; }
    const odo = v.odometer || 0;
    if (v === this.lastV) { const d = (odo - this.lastOdo) / 1000; if (d > 0 && d < 0.2) this.km += d; }
    this.lastV = v; this.lastOdo = odo;
    const kmh = Math.abs(v.kmh || 0);
    if (kmh > 3) { this.sec += dt; if (kmh < 450) this.top = Math.max(this.top, kmh); }
    this.t -= dt; if (this.t <= 0) { this.t = SEND_EVERY; this.send(); }
  }
  get region() { const r = this.g.spawnReq || this.g.settings?.spawn || 'pa'; return /^[a-z0-9_-]{1,24}$/.test(r) ? r : 'pa'; }
  send(leaving = false) {
    if (this.km < 0.05 || this.km - this.sentKm < 0.01) return;
    this.sentKm = this.km;
    const body = { sid: this.sid, name: displayName(), car: this.g.carId || 'r34', region: this.region, km: Math.round(this.km * 1000) / 1000, top: Math.round(this.top), sec: Math.round(this.sec) };
    api('/api/drive', { method: 'POST', body, keepalive: leaving, timeout: 6000 }).catch(() => { this.sentKm = 0; });
  }
}
