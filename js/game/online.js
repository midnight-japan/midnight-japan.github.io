// Online meets (beta) — serverless peer-to-peer via WebRTC (Trystero, Nostr relays for signalling).
// No game server: players in the same room see each other's cars, name tags, lights and engine sound,
// and can chat. Everything received from peers is untrusted and validated before use.
import * as THREE from 'three';
import { CAR_BY_ID } from '../../data/cars.js';
import { buildCarAuto } from './carfactory.js';
import { createHuman, createNameTag, defaultOutfit, OUTFIT_OPTIONS } from './humans.js';
import { displayName } from '../account.js';
import { t } from '../i18n.js';
import { PLATE_TYPES } from './plates.js';

const APP_ID = 'midnight-japan-v2';
export const ROOM_DEFAULT = 'daikoku-pa';
const SEND_HZ = 10;
const MAX_PEERS = 24;

const isNum = (x, lim = 1e5) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) < lim;
const str = (x, n) => (typeof x === 'string' ? x : '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n);
const hex = x => (typeof x === 'string' && /^#[0-9a-fA-F]{6}$/.test(x) ? x : null);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function cleanPlate(p) {
  if (!p || typeof p !== 'object') return undefined;
  const types = Object.keys(PLATE_TYPES);
  const type = types.includes(p.type) ? p.type : 'private';
  const num = Number.isInteger(p.num) ? clamp(p.num, 1, 9999) : 1;
  return { type, region: str(p.region, 6) || '横浜', cls: str(p.cls, 3).replace(/[^0-9A-Z]/g, '') || '300', kana: str(p.kana, 1) || 'さ', num };
}
function cleanOutfit(o) {
  const out = defaultOutfit();
  if (!o || typeof o !== 'object') return out;
  for (const k of Object.keys(out)) {
    const v = o[k];
    if (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) out[k] = v;
    else if (typeof v === 'string' && Array.isArray(OUTFIT_OPTIONS[k]) && OUTFIT_OPTIONS[k].includes(v)) out[k] = v;
    else if (k === 'scale' && typeof v === 'number' && Number.isFinite(v)) out[k] = clamp(v, 0.85, 1.15);
  }
  return out;
}

export class Online {
  constructor(game) {
    this.g = game; this.peers = new Map(); this.status = 'off'; this.sendT = 0; this.room = null; this.roomName = ROOM_DEFAULT;
    this.chatLog = [];
  }
  get count() { return this.peers.size; }

  async start(roomName = this.roomName) {
    if (this.room || this.status === 'connecting') return;
    this.status = 'connecting'; this.roomName = roomName; this.g.ui.updateOnline?.();
    try {
      const { joinRoom, selfId } = await import('../../vendor/trystero/trystero-nostr.mjs');
      this.selfId = selfId;
      const room = this.room = joinRoom({ appId: APP_ID }, roomName);
      const aInfo = room.makeAction('info'), aSt = room.makeAction('st'), aChat = room.makeAction('chat');
      const send = a => (data, target) => a.send(data, target ? { target } : undefined);
      this._sendInfo = send(aInfo); this._sendSt = send(aSt); this._sendChat = send(aChat);
      room.onPeerJoin = id => { if (this.peers.size >= MAX_PEERS) return; this.peer(id); this._sendInfo(this.info(), id); };
      room.onPeerLeave = id => { const p = this.peers.get(id); if (p?.name) this.g.ui.toast(t('game.online.left', { name: p.name }), 'info'); this.remove(id); };
      aInfo.onMessage = (d, m) => this.setInfo(m?.peerId ?? m, d);
      aSt.onMessage = (d, m) => this.setState(m?.peerId ?? m, d);
      aChat.onMessage = (d, m) => this.onChat(m?.peerId ?? m, d);
      this.status = 'on';
    } catch (e) { console.warn('online', e); this.err = String(e?.stack || e); this.status = 'error'; this.room = null; }
    this.g.ui.updateOnline?.();
  }
  stop() {
    try { this.room?.leave(); } catch {}
    this.room = null; this.status = 'off';
    for (const id of [...this.peers.keys()]) this.remove(id);
    this.g.ui.updateOnline?.();
  }

  info() {
    const g = this.g, id = g.carId || g.garage.car, S = g.carSetup(id);
    return { n: str(displayName(), 20), c: id, col: S.color, fin: S.finish, rim: S.rim, plate: S.plate, cf: S.camberF, cr: S.camberR, ride: S.ride, tr: S.track, o: g.outfit };
  }
  /** call after the player changes car / paint / outfit */
  announce() { if (this._sendInfo) try { this._sendInfo(this.info()); } catch {} }
  chat(text) {
    text = str(text, 120).trim(); if (!text || !this._sendChat) return;
    try { this._sendChat({ m: text }); } catch {}
    this.pushChat(displayName(), text, true);
  }
  pushChat(name, text, mine) {
    this.chatLog.push({ name, text, mine, t: performance.now() });
    if (this.chatLog.length > 30) this.chatLog.shift();
    this.g.ui.renderChat?.();
  }

  peer(id) {
    let p = this.peers.get(id);
    if (!p) { p = { id, name: '', info: null, model: null, human: null, tag: null, snd: null, have: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), tgt: new THREE.Vector3(), yaw: 0, tyaw: 0, recv: 0, mode: 'd', kmh: 0, rpm: 900, steer: 0, lights: 0, cp: null, cy: 0 }; this.peers.set(id, p); }
    return p;
  }
  setInfo(id, d) {
    if (!d || typeof d !== 'object') return;
    const p = this.peer(id); const first = !p.info;
    const car = CAR_BY_ID[d.c] ? d.c : 'gr86';
    const info = { n: str(d.n, 20) || 'Guest', c: car, col: hex(d.col) || CAR_BY_ID[car].colors[0], fin: ['metallic', 'solid', 'pearl', 'matte', 'chrome'].includes(d.fin) ? d.fin : 'metallic', rim: hex(d.rim), plate: cleanPlate(d.plate), cf: isNum(d.cf, 15) ? d.cf : 0, cr: isNum(d.cr, 15) ? d.cr : 0, ride: isNum(d.ride, 1) ? d.ride : 0, tr: isNum(d.tr, 1) ? d.tr : 0, o: cleanOutfit(d.o) };
    const rebuild = !p.info || p.info.c !== info.c || p.info.col !== info.col || p.info.fin !== info.fin || JSON.stringify(p.info.plate) !== JSON.stringify(info.plate) || p.info.rim !== info.rim || p.info.cf !== info.cf || p.info.cr !== info.cr || p.info.ride !== info.ride || p.info.tr !== info.tr;
    const outfitChanged = !p.info || JSON.stringify(p.info.o) !== JSON.stringify(info.o);
    const nameChanged = p.name !== info.n;
    p.info = info; p.name = info.n;
    if (rebuild) this.buildModel(p);
    if (outfitChanged && p.human) { try { p.human.setOutfit(info.o); } catch {} }
    if (nameChanged || !p.tag) this.buildTag(p);
    if (first) this.g.ui.toast(t('game.online.joined', { name: p.name }), 'info');
    this.g.ui.updateOnline?.();
  }
  buildModel(p) {
    const g = this.g;
    if (p.model) { g.scene.remove(p.model.root); p.model.dispose(); p.model = null; }
    if (p.snd) { p.snd.dispose(); p.snd = null; }
    const i = p.info, car = CAR_BY_ID[i.c];
    try {
      const m = buildCarAuto(car, { color: i.col, finish: i.fin, plate: i.plate, openable: false });
      m.setStance({ camberF: i.cf, camberR: i.cr, ride: i.ride, track: i.tr });
      if (i.rim) m.setRimColor(i.rim);
      m.root.visible = p.have; m.root.position.copy(p.pos); m.root.rotation.y = p.yaw;
      g.scene.add(m.root); p.model = m;
      if (g.audio?.ready) p.snd = g.audio.createEngine(car, { lod: 'lite' });
    } catch (e) { console.warn('peer car', e); }
    if (p.tag) this.attachTag(p);
  }
  buildTag(p) {
    if (p.tag) { p.tag.parent?.remove(p.tag); p.tag.userData.dispose?.(); }
    p.tag = createNameTag('🌐 ' + p.name); p.tag.scale.multiplyScalar(3.2);
    this.attachTag(p);
  }
  attachTag(p) {
    const host = p.mode === 'w' && p.human ? p.human.object : p.model?.root;
    if (!host || !p.tag) return;
    host.add(p.tag);
    p.tag.position.set(0, p.mode === 'w' ? 1.95 : (CAR_BY_ID[p.info?.c]?.H || 1.4) + 0.55, 0);
    if (p.mode === 'w') p.tag.scale.set(p.tag.scale.x / 3.2 * 1.6, p.tag.scale.y / 3.2 * 1.6, 1);
  }
  setState(id, d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.p) || d.p.length !== 3 || !d.p.every(x => isNum(x, 2e4)) || !isNum(d.y, 100)) return;
    const p = this.peer(id); const now = performance.now();
    const np = new THREE.Vector3(d.p[0], d.p[1], d.p[2]);
    if (p.have) { const dtr = Math.max(0.05, (now - p.recv) / 1000); p.vel.subVectors(np, p.tgt).divideScalar(dtr); if (p.vel.length() > 120) p.vel.set(0, 0, 0); }
    else { p.pos.copy(np); p.yaw = d.y; }
    p.tgt.copy(np); p.tyaw = d.y; p.recv = now; p.have = true;
    p.kmh = isNum(d.v, 600) ? d.v : 0; p.rpm = isNum(d.r, 20000) ? d.r : 900; p.steer = isNum(d.s, 2) ? d.s : 0; p.lights = Number.isInteger(d.l) ? d.l : 0;
    const mode = d.m === 'w' ? 'w' : 'd';
    p.cp = mode === 'w' && Array.isArray(d.cp) && d.cp.length === 3 && d.cp.every(x => isNum(x, 2e4)) ? new THREE.Vector3(...d.cp) : null; p.cy = isNum(d.cy, 100) ? d.cy : 0;
    if (mode !== p.mode) { p.mode = mode; this.attachTag(p); }
  }
  onChat(id, d) {
    const p = this.peers.get(id); if (!p || !d) return;
    const text = str(d.m, 120).trim(); if (!text) return;
    const now = performance.now(); if (p.lastChat && now - p.lastChat < 600) return; p.lastChat = now; // flood guard
    this.pushChat(p.name || 'Guest', text, false);
  }
  remove(id) {
    const p = this.peers.get(id); if (!p) return;
    const g = this.g;
    if (p.model) { g.scene.remove(p.model.root); p.model.dispose(); }
    if (p.human) { g.scene.remove(p.human.object); p.human.dispose?.(); }
    p.tag?.userData.dispose?.(); p.snd?.dispose();
    this.peers.delete(id); g.ui.updateOnline?.();
  }

  update(dt) {
    if (!this.room) return;
    const g = this.g;
    // ── send my state
    this.sendT -= dt;
    if (this.sendT <= 0 && this._sendSt && g.vehicle && (g.mode === 'drive' || g.mode === 'walk')) {
      this.sendT = 1 / SEND_HZ;
      const v = g.vehicle, L = g.model?.lights || {};
      const lights = (L.head ? 1 : 0) | (L.brake ? 2 : 0) | (L.hazard ? 4 : 0) | (L.reverse ? 8 : 0) | (L.strobe && L.strobe !== 'off' ? 16 : 0);
      const walk = g.mode === 'walk' && g.player;
      const P = walk ? g.player.pos : v.pos, r = x => Math.round(x * 100) / 100;
      const msg = { p: [r(P.x), r(P.y), r(P.z)], y: r(walk ? g.player.yaw : v.yaw), v: Math.round(walk ? g.player.speed * 3.6 : v.kmh), r: Math.round(v.engine?.rpm || 0), s: r(v.steerAng || 0), l: lights, m: walk ? 'w' : 'd' };
      if (walk) { msg.cp = [r(v.pos.x), r(v.pos.y), r(v.pos.z)]; msg.cy = r(v.yaw); }
      try { this._sendSt(msg); } catch {}
    }
    // ── render peers
    const now = performance.now();
    for (const p of this.peers.values()) {
      if (!p.have || !p.info) continue;
      if (now - p.recv > 8000) { if (p.model) p.model.root.visible = false; if (p.human) p.human.object.visible = false; continue; }
      const ahead = Math.min(0.35, (now - p.recv) / 1000);
      const target = p.tgt.clone().addScaledVector(p.vel, ahead);
      if (p.pos.distanceTo(target) > 25) p.pos.copy(target); else p.pos.lerp(target, 1 - Math.exp(-dt * 10));
      let dy = p.tyaw - p.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.yaw += dy * (1 - Math.exp(-dt * 10));
      const m = p.model;
      if (p.mode === 'd') {
        if (p.human) p.human.object.visible = false;
        if (m) {
          m.root.visible = true; m.root.position.copy(p.pos); m.root.rotation.y = p.yaw;
          m.lights.head = !!(p.lights & 1); m.lights.brake = !!(p.lights & 2); m.lights.hazard = !!(p.lights & 4); m.lights.reverse = !!(p.lights & 8);
          const spin = p.kmh / 3.6 / 0.32;
          m.update(dt, { steer: p.steer, spin: [spin, spin, spin, spin], susp: [0, 0, 0, 0], pitch: 0, roll: 0 });
        }
      } else {
        if (!p.human) { try { p.human = createHuman(p.info.o); g.scene.add(p.human.object); this.attachTag(p); } catch (e) { console.warn(e); } }
        if (p.human) { p.human.object.visible = true; p.human.object.position.copy(p.pos); p.human.object.rotation.y = p.yaw; p.human.update(dt, { speed: p.kmh / 3.6 }); }
        if (m && p.cp) { m.root.visible = true; m.root.position.copy(p.cp); m.root.rotation.y = p.cy; m.update(dt, { steer: 0, spin: [0, 0, 0, 0], susp: [0, 0, 0, 0], pitch: 0, roll: 0 }); }
      }
      if (!p.snd && m && g.audio?.ready) p.snd = g.audio.createEngine(CAR_BY_ID[p.info.c], { lod: 'lite' });
      p.snd?.update({ rpm: p.rpm, throttle: p.kmh > 2 ? 0.4 : 0, load: 0.3, running: p.rpm > 300, cranking: false, boost: 0, speed: p.kmh / 3.6, slip: 0, position: p.mode === 'w' && p.cp ? p.cp : p.pos, interior: false, openness: 1 });
    }
  }
}
