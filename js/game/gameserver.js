// v2.17 dedicated game server for online meets: one WebSocket per room to the MIDNIGHT JAPAN server (a Cloudflare
// Durable Object per room, server/src/index.js). The server knows who is in the room, relays info / state / chat,
// keeps the chat in its DB and tells everyone at once when a player leaves. It is the main path now; WebRTC (fastest,
// when a direct link works) and the public MQTT relay stay as extra paths. Same message kinds and ids as relay.js,
// so online.js dedupes whatever arrives twice. Everything received is untrusted and validated by online.js.
import { wsUrl } from '../server.js';

export class GameServer {
  constructor(room, selfId, { onMsg, onWelcome, onLeave, onState }) {
    this.room = room; this.id = selfId; this.onMsg = onMsg; this.onWelcome = onWelcome; this.onLeave = onLeave; this.onState = onState;
    this.ok = false; this.closed = false; this.tries = 0; this.ping = 0;
    this.connect();
  }
  connect() {
    if (this.closed) return;
    let ws; try { ws = new WebSocket(wsUrl(this.room, this.id)); } catch { return this.retry(); }
    this.ws = ws;
    const to = setTimeout(() => { if (!this.ok) try { ws.close(); } catch {} }, 8000);
    ws.onmessage = e => {
      if (typeof e.data !== 'string' || e.data.length > 64e3) return;
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (!m || typeof m !== 'object') return;
      if (m.k === 'w') { clearTimeout(to); this.ok = true; this.tries = 0; this.onState?.('up'); this.onWelcome?.(m); this.pingI = setInterval(() => this.raw({ k: 'p', d: { t: Date.now() } }), 3000); return; }
      if (m.k === 'p') { const t = m.d?.t; if (typeof t === 'number') this.ping = Math.max(1, Date.now() - t); return; }
      if (typeof m.id !== 'string' || m.id === this.id) return;
      if (m.k === 'x') this.onLeave?.(m.id);
      else if (m.k === 'i' || m.k === 's' || m.k === 'c') this.onMsg(m.k, m.id.slice(0, 40), m.d);
    };
    ws.onclose = ws.onerror = () => {
      clearTimeout(to); clearInterval(this.pingI); if (this.ws !== ws) return;
      this.ws = null; const was = this.ok; this.ok = false; if (was) this.onState?.('down'); this.retry();
    };
  }
  retry() { if (this.closed) return; this.tries++; setTimeout(() => this.connect(), Math.min(30000, 1500 * 2 ** Math.min(this.tries, 5))); }
  raw(o) { const ws = this.ws; if (!ws || ws.readyState !== 1 || ws.bufferedAmount > 64e3) return; try { ws.send(JSON.stringify(o)); } catch {} }
  send(kind, data) { if (this.ok) this.raw({ k: kind, d: data }); }
  close() { this.closed = true; clearInterval(this.pingI); try { this.ws?.close(1000); } catch {} this.ws = null; this.ok = false; }
}
