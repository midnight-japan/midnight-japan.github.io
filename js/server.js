// v2.17 game server client — accounts, drive records, ranking and online rooms live on the MIDNIGHT JAPAN server
// (Cloudflare Workers + Durable Objects + D1, source in server/). Every call fails soft: when the server can't be reached
// the game keeps working offline (local account cache, P2P online meets).
import { SERVER } from '../data/meta.js';

const TOKEN = 'dn.token';
export const serverUrl = SERVER;
export const wsUrl = (room, id) => SERVER.replace(/^http/, 'ws') + '/ws/' + encodeURIComponent(room) + '?id=' + encodeURIComponent(id);

export function getToken() { try { return localStorage.getItem(TOKEN) || ''; } catch { return ''; } }
export function setToken(t) { try { t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN); } catch {} }

export class ServerError extends Error { constructor(code, status) { super(code); this.status = status; } }

/** fetch JSON from the server. Throws ServerError(code) for an API error, TypeError / AbortError when offline. */
export async function api(path, { method = 'GET', body, timeout = 8000, keepalive = false } = {}) {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), timeout);
  const headers = {}; const tk = getToken();
  if (tk) headers.Authorization = 'Bearer ' + tk;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  try {
    const r = await fetch(SERVER + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal, keepalive });
    let data = null; try { data = await r.json(); } catch {}
    if (!r.ok) throw new ServerError(data?.error || 'site.account.err.generic', r.status);
    return data;
  } finally { clearTimeout(to); }
}
export const isOffline = e => !(e instanceof ServerError);

export const ranking = (period = 'week', limit = 20) => api(`/api/ranking?period=${period}&limit=${limit}`);
export const serverStats = () => api('/api/stats', { timeout: 5000 });
