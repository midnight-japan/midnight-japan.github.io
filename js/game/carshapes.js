// Shape parameters for the procedural car generator (heights in metres, c* = fraction of length from the FRONT tip).
const BASE = {
  foR: 0.52, clr: 0.13, nose: 0.62, cowl: 0.86, belt: 0.9, deck: 0.93, tail: 0.84, lipF: 0.2, lipR: 0.3,
  cA: 0.31, cB: 0.47, cC: 0.69, cD: 0.83, rearBow: 0.05, wsBow: 0.04,
  wF: 0.86, wR: 0.9, sqTop: 3.2, sqBot: 6, capF: 0.2, capR: 0.14,
  rim: 17, tireW: 0.235, aspect: 0.45, trackAdj: 0, flare: 0.012,
  grilleW: 0.42, grilleY0: 0.35, grilleY1: 0.6,
  doors: 2, hood: true, trunk: true, roofW: 0.74, cabSq: 2.6, sideTh: 0.62, cPillar: 0, open: false, tint: false,
  headlight: [0.5, 0.93, 0.22, 0.78], taillight: [0.55, 0.97, 0.12, 0.62],
  roundTails: false, popup: false, exhaust: 2, wing: null, wheel: '5spoke', rimColor: '#b9bcc0', caliper: '#333333', rearSeat: true,
};
const STYLE = {
  coupe: {},
  sedan: { doors: 4, cA: 0.3, cB: 0.44, cC: 0.7, cD: 0.82, cPillar: 0.18, roofW: 0.78, belt: 0.93, deck: 0.98 },
  fastback: { cC: 0.66, cD: 0.92, rearBow: 0.1, trunk: true },
  hatch: { cA: 0.28, cB: 0.42, cC: 0.86, cD: 0.985, rearBow: 0.02, tail: 0.9, capR: 0.1, roofW: 0.8 },
  wedge: { nose: 0.52, cowl: 0.78, belt: 0.86, deck: 0.92, cA: 0.3, cB: 0.45, cC: 0.62, cD: 0.85, rearBow: 0.14, capF: 0.25, roofW: 0.7, foR: 0.5 },
  roadster: { open: true, cA: 0.36, cB: 0.46, cC: 0.62, cD: 0.7, rearSeat: false, roofW: 0.7 },
  kei_tall: { foR: 0.58, nose: 0.82, cowl: 1.0, belt: 1.02, deck: 1.0, tail: 0.95, cA: 0.13, cB: 0.3, cC: 0.95, cD: 0.995, rearBow: 0.0, wsBow: 0.03, roofW: 0.92, cabSq: 3.8, sqTop: 4.5, capF: 0.16, capR: 0.08, doors: 4, sideTh: 0.72, hood: false, trunk: false, rim: 14, tireW: 0.155, aspect: 0.65, exhaust: 1, flare: 0.0 },
  suv: { foR: 0.5, clr: 0.2, nose: 0.85, cowl: 1.02, belt: 1.08, deck: 1.1, tail: 1.02, lipF: 0.35, lipR: 0.42, cA: 0.24, cB: 0.38, cC: 0.92, cD: 0.99, rearBow: 0.0, roofW: 0.88, cabSq: 3.6, sqTop: 4, capF: 0.14, capR: 0.08, sideTh: 0.7, trunk: false, exhaust: 1, aspect: 0.6, tireW: 0.195, rim: 16 },
  van: { foR: 0.35, nose: 0.85, cowl: 1.0, belt: 1.05, deck: 1.05, tail: 1.0, cA: 0.08, cB: 0.2, cC: 0.96, cD: 0.995, rearBow: 0, wsBow: 0.02, roofW: 0.94, cabSq: 4.5, sqTop: 5, sqBot: 7, capF: 0.12, capR: 0.06, doors: 2, hood: false, trunk: false, sideTh: 0.78, rim: 15, tireW: 0.195, aspect: 0.7, exhaust: 1, flare: 0 },
  wagon: { doors: 4, cC: 0.86, cD: 0.97, rearBow: 0.02, roofW: 0.8 },
  truck: { foR: 0.12, clr: 0.3, nose: 1.3, cowl: 1.5, belt: 1.55, deck: 1.4, tail: 1.3, lipF: 0.45, lipR: 0.6, cA: 0.0, cB: 0.03, cC: 0.15, cD: 0.18, rearBow: 0, wsBow: 0.01, roofW: 0.96, cabSq: 5, sqTop: 6, sqBot: 8, capF: 0.1, capR: 0.08, doors: 2, hood: false, trunk: false, sideTh: 0.8, rim: 22.5, tireW: 0.3, aspect: 0.72, exhaust: 1, flare: 0, roofH: 3.05, wF: 0.98, wR: 0.98, rearSeat: false },
  bus: { foR: 0.2, clr: 0.25, nose: 1.1, cowl: 1.25, belt: 1.3, deck: 1.3, tail: 1.2, lipF: 0.4, lipR: 0.5, cA: 0.0, cB: 0.03, cC: 0.97, cD: 0.995, rearBow: 0, wsBow: 0, roofW: 0.96, cabSq: 6, sqTop: 7, sqBot: 8, capF: 0.12, capR: 0.1, doors: 2, hood: false, trunk: false, sideTh: 0.9, rim: 22.5, tireW: 0.3, aspect: 0.72, exhaust: 1, flare: 0, wF: 0.97, wR: 0.97, tint: true, rearSeat: false },
};

// per-car overrides
const CARS = {
  r32: { style: 'coupe', sqTop: 4.2, nose: 0.66, cowl: 0.86, belt: 0.92, deck: 0.96, tail: 0.88, cA: 0.33, cB: 0.48, cC: 0.68, cD: 0.82, capF: 0.14, capR: 0.1, roundTails: true, wing: 'duck', wheel: 'multi', rimColor: '#c7c9cc', rim: 16, tireW: 0.225, aspect: 0.5, flare: 0.022, headlight: [0.62, 0.95, 0.3, 0.72] },
  r33: { style: 'coupe', sqTop: 3.6, nose: 0.64, cA: 0.33, cB: 0.48, cC: 0.69, cD: 0.83, roundTails: true, wing: 'r34', wheel: '5spoke', flare: 0.02 },
  r34: { style: 'coupe', sqTop: 4.0, nose: 0.66, cowl: 0.88, belt: 0.93, deck: 0.98, tail: 0.9, cA: 0.32, cB: 0.47, cC: 0.69, cD: 0.83, capF: 0.15, capR: 0.1, roundTails: true, wing: 'r34', wheel: '6spoke', rim: 18, tireW: 0.245, aspect: 0.4, flare: 0.024, rimColor: '#9ea2a7', caliper: '#c8a018', grilleW: 0.36, headlight: [0.58, 0.95, 0.26, 0.74] },
  r35: { style: 'coupe', foR: 0.55, sqTop: 3.2, nose: 0.6, cowl: 0.86, belt: 0.92, deck: 0.98, cA: 0.3, cB: 0.45, cC: 0.68, cD: 0.85, roundTails: true, wing: 'lip', wheel: 'multi', rim: 20, tireW: 0.285, aspect: 0.35, rimColor: '#2a2b2e', caliper: '#c8a018', flare: 0.02, exhaust: 4 },
  s15: { style: 'coupe', nose: 0.56, cowl: 0.82, belt: 0.88, deck: 0.92, tail: 0.84, cA: 0.33, cB: 0.48, cC: 0.68, cD: 0.82, wing: 'r34', wheel: '5spoke', rim: 17, exhaust: 1 },
  rps13: { style: 'hatch', nose: 0.56, cowl: 0.8, belt: 0.86, deck: 0.92, tail: 0.88, cA: 0.34, cB: 0.5, cC: 0.75, cD: 0.95, rearBow: 0.06, popup: true, wing: 'lip', wheel: 'mesh', rim: 15, tireW: 0.205, aspect: 0.55, headlight: [0.85, 0.95, 0.5, 0.7], exhaust: 1, sqTop: 4 },
  z33: { style: 'fastback', nose: 0.6, cowl: 0.84, belt: 0.9, deck: 0.96, cA: 0.33, cB: 0.47, cC: 0.6, cD: 0.88, roofW: 0.66, rearSeat: false, wheel: 'twin5', rim: 18, flare: 0.03, sqTop: 2.6 },
  gr86: { style: 'coupe', nose: 0.58, cowl: 0.82, belt: 0.88, deck: 0.92, tail: 0.86, cA: 0.33, cB: 0.48, cC: 0.68, cD: 0.84, wing: 'duck', wheel: 'twin5', rim: 18, tireW: 0.215, aspect: 0.4, rimColor: '#2c2d30', flare: 0.025, grilleW: 0.5, grilleY0: 0.12, grilleY1: 0.5, sqTop: 2.8 },
  ae86: { style: 'hatch', nose: 0.6, cowl: 0.82, belt: 0.88, deck: 0.92, tail: 0.88, cA: 0.33, cB: 0.47, cC: 0.76, cD: 0.95, rearBow: 0.04, sqTop: 5, popup: true, wheel: 'steel', rim: 14, tireW: 0.185, aspect: 0.6, rimColor: '#c9ccd0', twoTone: { y: 0.55, k: 0.05 }, headlight: [0.85, 0.95, 0.5, 0.7], exhaust: 1, capF: 0.12 },
  jza80: { style: 'coupe', nose: 0.56, cowl: 0.8, belt: 0.88, deck: 0.94, tail: 0.86, cA: 0.33, cB: 0.48, cC: 0.66, cD: 0.82, sqTop: 2.6, wing: 'big', wheel: '5spoke', rim: 17, tireW: 0.255, flare: 0.03, roofW: 0.66, headlight: [0.45, 0.9, 0.25, 0.7], taillight: [0.4, 0.97, 0.15, 0.7] },
  a90: { style: 'fastback', nose: 0.56, cowl: 0.8, belt: 0.9, deck: 0.98, cA: 0.37, cB: 0.5, cC: 0.62, cD: 0.88, roofW: 0.64, rearSeat: false, sqTop: 2.4, flare: 0.04, wing: 'duck', wheel: 'twin5', rim: 19, tireW: 0.275, aspect: 0.35, rimColor: '#2a2b2e' },
  jzx100: { style: 'sedan', nose: 0.66, cowl: 0.9, belt: 0.95, deck: 1.0, sqTop: 4.4, wheel: '6spoke', rim: 17, wing: 'lip' },
  crown: { style: 'sedan', nose: 0.7, cowl: 0.92, belt: 0.98, deck: 1.02, sqTop: 3.4, wheel: 'multi', rim: 18, grilleW: 0.5, grilleY0: 0.2, grilleY1: 0.7 },
  fd3s: { style: 'fastback', nose: 0.5, cowl: 0.76, belt: 0.84, deck: 0.92, tail: 0.86, cA: 0.33, cB: 0.48, cC: 0.6, cD: 0.85, roofW: 0.66, popup: true, sqTop: 2.3, capF: 0.28, flare: 0.04, wing: 'gt', wheel: '5spoke', rim: 17, tireW: 0.255, headlight: [0.85, 0.95, 0.5, 0.7], grilleW: 0.3, grilleY0: 0.1, grilleY1: 0.3, exhaust: 2 },
  nd: { style: 'roadster', nose: 0.56, cowl: 0.78, belt: 0.82, deck: 0.86, sqTop: 2.6, flare: 0.04, wheel: 'twin5', rim: 16, tireW: 0.195, aspect: 0.5, rimColor: '#2c2d30', grilleY0: 0.12, grilleY1: 0.45 },
  na1: { style: 'wedge', popup: true, nose: 0.5, cowl: 0.74, belt: 0.82, deck: 0.92, tail: 0.88, cA: 0.29, cB: 0.44, cC: 0.58, cD: 0.8, roofW: 0.66, wheel: '5spoke', rim: 16, rearSeat: false, headlight: [0.85, 0.95, 0.5, 0.7], taillight: [0.4, 0.97, 0.15, 0.95], grilleW: 0.3, grilleY0: 0.1, grilleY1: 0.3 },
  ek9: { style: 'hatch', nose: 0.62, cowl: 0.86, belt: 0.92, deck: 0.98, tail: 0.94, foR: 0.6, wing: 'lip', wheel: '5spoke', rim: 15, tireW: 0.195, aspect: 0.55, rimColor: '#e8e8e8', caliper: '#c11', sqTop: 3.2, exhaust: 1 },
  fl5: { style: 'hatch', foR: 0.58, nose: 0.62, cowl: 0.88, belt: 0.95, deck: 1.0, tail: 0.95, cC: 0.75, cD: 0.95, rearBow: 0.08, doors: 4, wing: 'gt', wheel: 'twin5', rim: 19, tireW: 0.265, aspect: 0.3, rimColor: '#141414', caliper: '#c11', flare: 0.03, exhaust: 3 },
  ap1: { style: 'roadster', nose: 0.58, cowl: 0.8, belt: 0.86, deck: 0.9, cA: 0.37, cB: 0.47, sqTop: 3, wheel: '5spoke', rim: 17, tireW: 0.225, aspect: 0.45 },
  evo9: { style: 'sedan', nose: 0.66, cowl: 0.9, belt: 0.96, deck: 1.02, wing: 'gt', wheel: 'mesh', rim: 17, tireW: 0.235, flare: 0.03, rimColor: '#c9ccd0', caliper: '#c11', grilleY0: 0.1, grilleY1: 0.55, sqTop: 3.8 },
  gdb: { style: 'sedan', nose: 0.66, cowl: 0.9, belt: 0.96, deck: 1.02, wing: 'big', wheel: '6spoke', rim: 17, rimColor: '#c8a018', caliper: '#c8a018', flare: 0.03, sqTop: 3.6 },
  lfa: { style: 'coupe', nose: 0.5, cowl: 0.78, belt: 0.86, deck: 0.94, cA: 0.37, cB: 0.5, cC: 0.62, cD: 0.82, roofW: 0.62, rearSeat: false, wing: 'lip', wheel: 'multi', rim: 20, tireW: 0.285, aspect: 0.3, rimColor: '#2a2b2e', flare: 0.04, sqTop: 2.4, exhaust: 3, capR: 0.08 },
  copen: { style: 'roadster', nose: 0.6, cowl: 0.8, belt: 0.86, deck: 0.9, rim: 16, tireW: 0.165, aspect: 0.5, sqTop: 3.2, wheel: 'twin5', exhaust: 1, capF: 0.17, capR: 0.14 },
  altow: { style: 'hatch', foR: 0.55, nose: 0.66, cowl: 0.9, belt: 0.96, deck: 1.0, tail: 0.95, cA: 0.25, cB: 0.4, cC: 0.88, cD: 0.99, doors: 4, rim: 15, tireW: 0.165, aspect: 0.55, wheel: '5spoke', rimColor: '#141414', caliper: '#c11', sqTop: 4.5, exhaust: 1 },
  s660: { style: 'roadster', nose: 0.56, cowl: 0.74, capF: 0.13, capR: 0.1, belt: 0.8, deck: 0.88, cA: 0.38, cB: 0.47, rim: 16, tireW: 0.195, aspect: 0.45, sqTop: 2.6, wheel: 'twin5', rimColor: '#141414', rearSeat: false, exhaust: 1 },
  jimny: { style: 'suv', nose: 0.95, cowl: 1.05, belt: 1.12, deck: 1.15, tail: 1.1, clr: 0.24, cA: 0.24, cB: 0.33, cC: 0.96, cD: 0.995, wsBow: 0.0, sqTop: 7, sqBot: 8, cabSq: 6, roofW: 0.92, rim: 16, tireW: 0.175, aspect: 0.8, wheel: 'steel', rimColor: '#3b3d40', flare: 0.04, doors: 2, capF: 0.08, capR: 0.06, headlight: [0.8, 0.98, 0.3, 0.75] },
  nbox: { style: 'kei_tall', rim: 15, tireW: 0.165, aspect: 0.55, wheel: 'twin5', rimColor: '#2a2b2e' },
  sakura: { style: 'kei_tall', nose: 0.78, cowl: 0.98, rim: 15, tireW: 0.155, aspect: 0.65, wheel: 'aero', exhaust: 0, rimColor: '#2a2b2e' },
  leaf: { style: 'hatch', doors: 4, nose: 0.68, cowl: 0.94, belt: 1.0, deck: 1.04, tail: 0.98, cA: 0.27, cB: 0.42, cC: 0.85, cD: 0.97, rearBow: 0.06, wheel: 'aero', rim: 17, exhaust: 0, grilleW: 0.3, sqTop: 3 },
  model3: { style: 'fastback', doors: 4, nose: 0.6, cowl: 0.84, belt: 0.92, deck: 0.98, cA: 0.34, cB: 0.45, cC: 0.68, cD: 0.88, roofW: 0.76, glassRoof: true, wheel: 'aero', rim: 20, tireW: 0.235, aspect: 0.35, rimColor: '#2a2b2e', caliper: '#c11', exhaust: 0, grilleW: 0.0, sqTop: 2.6, capF: 0.28, wing: 'lip' },
  p911: { style: 'fastback', foR: 0.4, nose: 0.6, cowl: 0.8, belt: 0.88, deck: 0.96, tail: 0.9, cA: 0.33, cB: 0.45, cC: 0.6, cD: 0.88, rearBow: 0.14, roofW: 0.66, sqTop: 2.3, capF: 0.3, capR: 0.18, flare: 0.05, wheel: 'twin5', rim: 20, tireW: 0.3, aspect: 0.3, grilleW: 0, wing: 'duck', exhaust: 2 },
  e46: { style: 'coupe', nose: 0.64, cowl: 0.88, belt: 0.94, deck: 0.98, cA: 0.33, cB: 0.47, cC: 0.69, cD: 0.82, wheel: 'multi', rim: 18, flare: 0.03, exhaust: 4, sqTop: 3.4, grilleW: 0.2 },
  mustang: { style: 'fastback', foR: 0.55, nose: 0.68, cowl: 0.92, belt: 0.98, deck: 1.02, cA: 0.36, cB: 0.48, cC: 0.62, cD: 0.86, roofW: 0.68, wheel: '5spoke', rim: 19, tireW: 0.255, aspect: 0.4, rimColor: '#2a2b2e', flare: 0.03, exhaust: 4, sqTop: 3.6 },
  police: { style: 'sedan', nose: 0.7, cowl: 0.92, belt: 0.98, deck: 1.02, sqTop: 3.4, wheel: 'steel', rim: 16, rimColor: '#c9ccd0', twoTone: { y: 0.82, k: 0.04 }, grilleW: 0.5, grilleY0: 0.2, grilleY1: 0.7 },
  police_unmarked: { style: 'sedan', nose: 0.7, cowl: 0.92, belt: 0.98, deck: 1.02, sqTop: 3.4, wheel: 'multi', rim: 17, tint: true },
  prius: { style: 'fastback', doors: 4, nose: 0.6, cowl: 0.86, belt: 0.95, deck: 1.0, cA: 0.33, cB: 0.45, cC: 0.68, cD: 0.95, roofW: 0.76, wheel: 'aero', rim: 19, exhaust: 0 },
  taxi: { style: 'kei_tall', doors: 4, foR: 0.5, nose: 0.75, cowl: 0.98, belt: 1.02, deck: 1.0, cA: 0.2, cB: 0.36, cC: 0.93, cD: 0.99, roofW: 0.86, rim: 15, tireW: 0.185, aspect: 0.6, wheel: 'steel', exhaust: 1 },
  hiace: { style: 'van', wheel: 'steel', rimColor: '#c9ccd0' },
  every: { style: 'van', nose: 0.95, capF: 0.07, sqTop: 6, cA: 0.1, rim: 12, tireW: 0.145, aspect: 0.8, wheel: 'steel', rimColor: '#c9ccd0' },
  truck: { style: 'truck', wheel: 'steel', rimColor: '#d8d8d8', dually: true, cargo: { w: 2.45, h: 2.6, l: 8.6, y: 1.05, z: -1.55, color: '#dfe2e4' } },
  bus: { style: 'bus', wheel: 'steel', rimColor: '#d8d8d8' },
};

export function shapeFor(car) {
  const o = CARS[car.id] || {};
  const st = STYLE[o.style || 'coupe'] || {};
  const r = { ...BASE, ...st, ...o };
  r.sqTop = Math.max(r.sqTop, 3.0);
  return r;
}
