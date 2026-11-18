// Touge roadside facilities (v2.9): 非常駐車帯 (emergency bays) and 駐車帯 (parking strips) along mountain roads —
// on straight, gentle stretches (< 3.5 % grade) every ~650 m, alternating sides, 26 m long, flush beside the lane.
// Shared by roads.js (gaps in the guardrail) and hakone.js (the pads, signs, drivable lots). Region-agnostic: works
// for any road of kind 'mountain' (future Osaka / Rokkō touge included).
import { HAKONE } from '../../data/map-hakone.js';

const cache = new Map();
export function tougeBays(road) {
  if (!road || road.kind !== 'mountain') return [];
  if (cache.has(road)) return cache.get(road);
  const S = road.samples, hw = (road.edgeL - road.edgeR) / 2, out = []; let last = -1e9, side = 1, n = 0;
  for (let i = 20; i < S.length - 20; i++) {
    const q = S[i]; if (q.s - last < 650) continue;
    let ok = true; for (let k = i - 7; k <= i + 7; k++) { const g = S[k].grade, t = S[k].t; if (Math.abs(g) > 0.035 || t.x * q.t.x + t.z * q.t.z < 0.985) { ok = false; break; } } if (!ok) continue;
    const off = (hw + 1.7) * side, x = q.p.x + q.left.x * off, z = q.p.z + q.left.z * off;
    if (HAKONE.lots.some(L => !L.bay && Math.hypot(L.x - x, L.z - z) < 120)) continue;
    out.push({ name: n % 3 === 2 ? '駐車帯' : '非常駐車帯', x, z, y: q.p.y + 0.02, yaw: Math.atan2(q.t.x, q.t.z), l: 26, w: 3.4, bay: true, side, s: q.s }); last = q.s; side = -side; n++;
  }
  cache.set(road, out); return out;
}
// is lateral side `side` (+1 left / −1 right) of `road` at arclength s beside a bay? (guardrail gap incl. 8 m tapers)
export function bayAt(road, s, side) { for (const b of tougeBays(road)) if (b.side === side && Math.abs(s - b.s) < b.l / 2 + 8) return b; return null; }
