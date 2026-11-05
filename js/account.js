// Local (on-device) accounts. Passwords are salted + PBKDF2-hashed with WebCrypto.
// Designed so a real backend can replace this module later with the same API.
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

export async function signUp({ id, password, nickname }) {
  id = (id || '').trim().toLowerCase();
  if (!/^[a-z0-9_.@-]{3,40}$/.test(id)) throw new Error('account.err.id');
  if ((password || '').length < 6) throw new Error('account.err.pw');
  if (!NICK_RE.test((nickname || '').trim())) throw new Error('account.err.nick');
  const users = read(USERS, {});
  if (users[id]) throw new Error('account.err.exists');
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  users[id] = { id, salt, hash: await hash(password, salt), nickname: nickname.trim(), created: Date.now(), profile: {} };
  write(USERS, users); write(SESSION, id);
  return publicUser(users[id]);
}

export async function logIn({ id, password }) {
  id = (id || '').trim().toLowerCase();
  const u = read(USERS, {})[id];
  if (!u || (await hash(password, u.salt)) !== u.hash) throw new Error('account.err.login');
  write(SESSION, id);
  return publicUser(u);
}

export function logOut() { try { localStorage.removeItem(SESSION); } catch {} }

function publicUser(u) { return u && { id: u.id, nickname: u.nickname, created: u.created, profile: u.profile || {} }; }

export function currentUser() {
  const id = read(SESSION, null);
  return id ? publicUser(read(USERS, {})[id]) : null;
}

export function updateUser(patch) {
  const id = read(SESSION, null); const users = read(USERS, {});
  if (!id || !users[id]) return null;
  if (patch.nickname !== undefined) {
    if (!NICK_RE.test(patch.nickname.trim())) throw new Error('account.err.nick');
    users[id].nickname = patch.nickname.trim();
  }
  if (patch.profile) users[id].profile = { ...(users[id].profile || {}), ...patch.profile };
  write(USERS, users);
  return publicUser(users[id]);
}

// Display name for the game: account nickname, or a guest name.
export function displayName() {
  const u = currentUser(); if (u) return u.nickname;
  let g = read('dn.guest', null);
  if (!g) { g = 'Guest-' + Math.floor(1000 + Math.random() * 9000); write('dn.guest', g); }
  return g;
}
