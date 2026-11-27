// Accounts. v2.17: the MIDNIGHT JAPAN server is the source of truth (one account on every device — js/server.js →
// /api/signup, /api/login, /api/me). This module keeps a local cache of the signed-in user so the game can read the
// nickname synchronously and still log in offline. Local passwords are salted + PBKDF2-hashed with WebCrypto.
// Accounts made before v2.17 (device-only) are moved to the server automatically on the next login.
import { api, setToken, getToken, isOffline, ServerError } from './server.js';

const USERS = 'dn.users', SESSION = 'dn.session';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');

async function hash(password, saltHex) {
  if (!crypto.subtle) return 'plain:' + password; // non-secure context fallback (http on LAN)
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256));
}

export const NICK_RE = /^[\p{L}\p{N}_\-. ]{2,16}$/u;

function validate({ id, password, nickname }, signup) {
  if (!/^[a-z0-9_.@-]{3,40}$/.test(id)) throw new Error(signup ? 'account.err.id' : 'account.err.login');
  if ((password || '').length < 6) throw new Error(signup ? 'account.err.pw' : 'account.err.login');
  if (signup && !NICK_RE.test((nickname || '').trim())) throw new Error('account.err.nick');
}

// keep a local copy (with a local password hash for offline login) of a server account
async function cache(user, password) {
  const users = read(USERS, {}); const old = users[user.id] || {};
  const salt = old.salt || hex(crypto.getRandomValues(new Uint8Array(16)));
  users[user.id] = { ...old, id: user.id, salt, hash: password ? await hash(password, salt) : old.hash, nickname: user.nickname, created: user.created ?? old.created ?? Date.now(), profile: user.profile || old.profile || {}, server: true };
  write(USERS, users); write(SESSION, user.id);
  return publicUser(users[user.id]);
}

export async function signUp({ id, password, nickname }) {
  id = (id || '').trim().toLowerCase(); nickname = (nickname || '').trim();
  validate({ id, password, nickname }, true);
  try {
    const r = await api('/api/signup', { method: 'POST', body: { id, password, nickname } });
    setToken(r.token); return cache(r.user, password);
  } catch (e) {
    if (!isOffline(e)) throw new Error(e.message);
    // server unreachable → device-only account, moved to the server on the next online login
    const users = read(USERS, {});
    if (users[id]) throw new Error('account.err.exists');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    users[id] = { id, salt, hash: await hash(password, salt), nickname, created: Date.now(), profile: {} };
    write(USERS, users); write(SESSION, id);
    return publicUser(users[id]);
  }
}

export async function logIn({ id, password }) {
  id = (id || '').trim().toLowerCase();
  validate({ id, password }, false);
  const local = read(USERS, {})[id];
  const localOk = async () => !!local && (await hash(password, local.salt)) === local.hash;
  try {
    const r = await api('/api/login', { method: 'POST', body: { id, password } });
    setToken(r.token); return cache(r.user, password);
  } catch (e) {
    if (isOffline(e)) { if (await localOk()) { write(SESSION, id); return publicUser(local); } throw new Error('account.err.login'); }
    if (e.status !== 401 || !(await localOk())) throw new Error(e.message);
    // device-only account from before v2.17 → create it on the server with the same id, nickname and profile
    try {
      const r = await api('/api/signup', { method: 'POST', body: { id, password, nickname: local.nickname, profile: local.profile || {} } });
      setToken(r.token); return cache(r.user, password);
    } catch (e2) { if (e2 instanceof ServerError && e2.status === 409) throw new Error('account.err.login'); throw new Error(e2.message); }
  }
}

export function logOut() {
  if (getToken()) api('/api/logout', { method: 'POST' }).catch(() => {});
  setToken(''); try { localStorage.removeItem(SESSION); } catch {}
}

function publicUser(u) { return u && { id: u.id, nickname: u.nickname, created: u.created, profile: u.profile || {}, server: !!u.server && !!getToken() }; }

export function currentUser() {
  const id = read(SESSION, null);
  return id ? publicUser(read(USERS, {})[id]) : null;
}

export function updateUser(patch) {
  const id = read(SESSION, null); const users = read(USERS, {});
  if (!id || !users[id]) return null;
  const body = {};
  if (patch.nickname !== undefined) {
    if (!NICK_RE.test(patch.nickname.trim())) throw new Error('account.err.nick');
    users[id].nickname = body.nickname = patch.nickname.trim();
  }
  if (patch.profile) { users[id].profile = { ...(users[id].profile || {}), ...patch.profile }; body.profile = patch.profile; }
  write(USERS, users);
  if (getToken()) api('/api/me', { method: 'PUT', body }).catch(() => {}); // saved on the server for the other devices
  return publicUser(users[id]);
}

/** pull the signed-in user's nickname + profile from the server (another device may have changed them). */
export async function syncAccount() {
  if (!getToken() || !currentUser()) return currentUser();
  try { const r = await api('/api/me'); return cache(r.user); }
  catch (e) { if (!isOffline(e) && e.status === 401) setToken(''); return currentUser(); }
}

// Display name for the game: account nickname, or a guest name.
export function displayName() {
  const u = currentUser(); if (u) return u.nickname;
  let g = read('dn.guest', null);
  if (!g) { g = 'Guest-' + Math.floor(1000 + Math.random() * 9000); write('dn.guest', g); }
  return g;
}
