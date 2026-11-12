// Accolades (FH-style goals): a set of things to do around the map, tracked locally, each paying a cash reward.
// Progress is checked a few times a second from the live game state — no new systems needed.
import { t } from '../i18n.js';

const KEY = 'dn.goals';
const near = (p, x, z, r) => (p.x - x) ** 2 + (p.z - z) ** 2 < r * r;

// id, icon, reward (¥), target (for counters), check(g, s, dt) → progress value (number) or true
export const GOALS = [
  { id: 'baybridge', icon: '🌉', reward: 20000, check: g => { const v = g.vehicle, sp = g.world.bridgeSpan; const h = v?.surface?.hit; return !!(sp && h && v.road === sp.road && h.s > sp.s0 && h.s < sp.s1 && Math.abs(v.kmh) > 30); } },
  { id: 'tsubasa', icon: '🌁', reward: 20000, check: g => { const z = g.world.zoneAt(g.vehicle.pos.x, g.vehicle.pos.z, g.vehicle.pos.y); return g.vehicle.pos.y > 25 && /つばさ/.test(z); } },
  { id: 'rainbow', icon: '🌈', reward: 30000, check: g => { const v = g.vehicle; return /^(b_11|r1_11)$/.test(v.road?.id || '') && v.pos.y > 40 && Math.abs(v.kmh) > 30; } },
  { id: 'roadtrip', icon: '🚙', reward: 60000, target: 40, check: (g, s, dt) => { const v = g.vehicle; if (/^hk[we]_/.test(v.road?.id || '')) s.v = (s.v || 0) + Math.abs(v.vx) * dt / 1000; return s.v || 0; } },
  { id: 'umihotaru', icon: '🚢', reward: 30000, check: g => /海ほたる/.test(g.world.zoneAt(g.vehicle.pos.x, g.vehicle.pos.z, g.vehicle.pos.y)) && Math.abs(g.vehicle.kmh) < 5 },
  { id: 'daikanyama', icon: '🗻', reward: 40000, check: g => { const L = g.world.hakone?.lotAt?.(g.vehicle.pos.x, g.vehicle.pos.z); return !!L && L.name === '大観山'; } },
  { id: 'c1', icon: '🗼', reward: 30000, target: 5, check: (g, s, dt) => { const v = g.vehicle; if (/^c1/.test(v.road?.id || '')) s.v = (s.v || 0) + Math.abs(v.vx) * dt / 1000; return s.v || 0; } },
  { id: 'city', icon: '🏙️', reward: 30000, target: 4, check: (g, s) => { const P = { mm: [-3949, 1257], chinatown: [-2987, 2310], tsurumi: [-2109, -2792], kawasaki: [2598, -5144], haneda: [7756, -9056] }; s.seen ||= {}; for (const k in P) if (near(g.vehicle.pos, P[k][0], P[k][1], 450)) s.seen[k] = 1; return Object.keys(s.seen).length; } },
  { id: 'speed', icon: '⚡', reward: 25000, check: g => g.vehicle.kmh >= 200 },
  { id: 'drift', icon: '💨', reward: 25000, target: 3, check: (g, s, dt) => { const v = g.vehicle; const ang = Math.atan2(Math.abs(v.vlat || 0), Math.abs(v.vx)); if (v.vx > 9 && ang > 0.3 && !v.airborne) s.cur = (s.cur || 0) + dt; else s.cur = 0; s.best = Math.max(s.best || 0, s.cur); return s.best; } },
  { id: 'distance', icon: '🛣️', reward: 30000, target: 30, check: g => g.stats.km },
  { id: 'escape', icon: '🚓', reward: 30000, check: g => g.stats.escapes > 0 },
  { id: 'konbini', icon: '🍙', reward: 5000, check: g => !!g._inStore },
  { id: 'talk', icon: '💬', reward: 5000, target: 3, check: g => g.stats.talks || 0 },
  { id: 'meet', icon: '🌙', reward: 10000, check: g => g.mode === 'walk' && (g.env?.night ?? 0) > 0.5 && /大黒PA/.test(g.world.zoneAt(g.player.pos.x, g.player.pos.z, 0)) },
];

export class Goals {
  constructor(game) {
    this.g = game; this.t = 0;
    try { this.state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { this.state = {}; }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch {} }
  done(id) { return !!this.state[id]?.done; }
  get count() { return GOALS.filter(G => this.done(G.id)).length; }
  progress(G) { const s = this.state[G.id] || {}; return G.target ? Math.min(G.target, s.p || 0) : (s.done ? 1 : 0); }
  update(dt) {
    const g = this.g; if (!g.vehicle || (g.mode !== 'drive' && g.mode !== 'walk')) return;
    // counters that integrate over time run every frame; the rest are polled
    this.t += dt; const poll = this.t > 0.4; if (poll) this.t = 0;
    for (const G of GOALS) {
      if (this.done(G.id)) continue;
      if (G.id === 'meet' ? g.mode !== 'walk' : g.mode !== 'drive') continue;
      const integ = G.id === 'c1' || G.id === 'drift' || G.id === 'roadtrip'; // integrate every frame; everything else is polled
      if (!integ && !poll) continue;
      const s = this.state[G.id] ||= {};
      let r; try { r = G.check(g, s, dt); } catch { continue; }
      if (G.target) { const p = Math.floor(r * 10) / 10; if (p !== s.p) { s.p = p; if (poll) this.save(); } if (r >= G.target) this.complete(G); }
      else if (r === true) this.complete(G);
    }
  }
  complete(G) {
    const g = this.g, s = this.state[G.id] ||= {};
    s.done = true; s.at = Date.now(); this.save();
    g.money += G.reward;
    g.audio?.sfx('coin');
    g.ui.toast(`${G.icon} ${t('game.goal.done')}: ${t('game.goal.' + G.id)}  +¥${G.reward.toLocaleString()}`, 'goal', 7);
    if (this.count === GOALS.length) setTimeout(() => g.ui.toast('🏆 ' + t('game.goal.all'), 'info', 8), 2500);
    g.ui.updateGoals?.();
  }
}
