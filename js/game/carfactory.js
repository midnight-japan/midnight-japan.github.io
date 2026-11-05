// Car model factory: a real glTF model (assets/models/cars/manifest.json, see carglb.js) when one exists for the car,
// otherwise the procedural model. Same CarModel API either way.
import { buildCar } from './carmodel.js';
import { buildGlbCar, glbEntry, requestGlb, loadManifest, hasGlb } from './carglb.js';
export { requestGlb, loadManifest, hasGlb, glbEntry };

/** Synchronous: uses the real model if it is already loaded (and starts loading it otherwise). */
export function buildCarAuto(car, opts = {}) {
  const e = opts.glb === false ? null : glbEntry(car.id);
  if (e) { try { return buildGlbCar(car, e, opts); } catch (err) { console.warn('glb car', car.id, err); } }
  if (opts.glb !== false) requestGlb(car.id).catch(() => {});
  return buildCar(car, opts);
}
/** Async: waits for the real model (if the car has one). */
export async function createCarModel(car, opts = {}) {
  try { await requestGlb(car.id); } catch {}
  return buildCarAuto(car, opts);
}
