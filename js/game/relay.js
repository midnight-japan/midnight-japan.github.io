// v2.15.5 relay fallback for online meets: a tiny MQTT 3.1.1-over-WebSocket client (QoS 0 only, no dependency) that
// carries the same info / state / chat messages through a public broker. WebRTC (Trystero) stays the fast path; the
// relay makes sure players behind strict NATs (mobile carriers, company / school Wi-Fi) still meet. Topics:
// mj2/<room>/<kind>/<senderId>, payload JSON. Everything received is untrusted and validated by online.js.
const BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
const enc = new TextEncoder(), dec = new TextDecoder();

function varint(n) { const b = []; do { let x = n % 128; n = Math.floor(n / 128); if (n > 0) x |= 128; b.push(x); } while (n > 0); return b; }
function mstr(s) { const u = enc.encode(s); return [u.length >> 8, u.length & 255, ...u]; }
function packet(type, body) { return new Uint8Array([type, ...varint(body.length), ...body]); }

// v2.15.6: one connection per broker, all at once — players who end up on different brokers still meet (online.js dedupes)
export class RelayMulti {
  constructor(room, selfId, onMsg, onState) { this.list = BROKERS.map(u => new Relay(room, selfId, onMsg, onState, u)); }
  get ok() { return this.list.some(r => r.ok); }
  send(kind, data) { for (const r of this.list) r.send(kind, data); }
  close() { for (const r of this.list) r.close(); }
}

export class Relay {
  constructor(room, selfId, onMsg, onState, url) { this.room = room; this.id = selfId; this.onMsg = onMsg; this.onState = onState; this.url = url; this.bi = 0; this.buf = new Uint8Array(0); this.closed = false; this.connect(); }
  connect() {
    if (this.closed) return; const url = this.url || BROKERS[this.bi % BROKERS.length];
    let ws; try { ws = new WebSocket(url, 'mqtt'); } catch { return this.retry(); }
    ws.binaryType = 'arraybuffer'; this.ws = ws; this.ok = false;
    const to = setTimeout(() => { if (!this.ok) { try { ws.close(); } catch {} } }, 6000);
    ws.onopen = () => ws.send(packet(0x10, [...mstr('MQTT'), 4, 0x02, 0, 60, ...mstr('mj' + this.id.slice(0, 18) + Math.random().toString(36).slice(2, 6))]));
    ws.onmessage = e => { const a = new Uint8Array(e.data), b = new Uint8Array(this.buf.length + a.length); b.set(this.buf); b.set(a, this.buf.length); this.buf = b; this.parse(); };
    ws.onclose = ws.onerror = () => { clearTimeout(to); clearInterval(this.pingI); if (this.ws !== ws) return; this.ws = null; this.ok = false; this.onState?.('down'); this.bi++; this.retry(); };
    this._to = to;
  }
  retry() { if (!this.closed) setTimeout(() => this.connect(), this.url ? 5000 : 2500); }
  parse() {
    while (this.buf.length >= 2) {
      let len = 0, mul = 1, i = 1, byte; do { if (i >= this.buf.length) return; byte = this.buf[i++]; len += (byte & 127) * mul; mul *= 128; } while (byte & 128);
      if (this.buf.length < i + len) return;
      const type = this.buf[0], body = this.buf.subarray(i, i + len); this.buf = this.buf.slice(i + len);
      if ((type >> 4) === 2) { // CONNACK
        if (body[1] !== 0) { try { this.ws.close(); } catch {} return; }
        this.ok = true; clearTimeout(this._to); this.onState?.('up');
        this.ws.send(packet(0x82, [0, 1, ...mstr(`mj2/${this.room}/#`), 0]));
        this.pingI = setInterval(() => { try { this.ws?.send(new Uint8Array([0xc0, 0])); } catch {} }, 30000);
      } else if ((type >> 4) === 3) { // PUBLISH
        const tl = (body[0] << 8) | body[1]; const topic = dec.decode(body.subarray(2, 2 + tl)); let off = 2 + tl; if ((type >> 1) & 3) off += 2;
        const parts = topic.split('/'); if (parts.length !== 4 || parts[3] === this.id) continue;
        let d; try { d = JSON.parse(dec.decode(body.subarray(off))); } catch { continue; }
        this.onMsg(parts[2], parts[3].slice(0, 40), d);
      }
    }
  }
  send(kind, data) {
    if (!this.ok || !this.ws || this.ws.readyState !== 1 || this.ws.bufferedAmount > 64e3) return;
    const t = enc.encode(`mj2/${this.room}/${kind}/${this.id}`), p = enc.encode(JSON.stringify(data));
    try { this.ws.send(packet(0x30, [t.length >> 8, t.length & 255, ...t, ...p])); } catch {}
  }
  close() { this.closed = true; clearInterval(this.pingI); try { this.ws?.send(new Uint8Array([0xe0, 0])); this.ws?.close(); } catch {} this.ws = null; }
}
