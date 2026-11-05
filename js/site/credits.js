// Credits page: renders assets/CREDITS.md (headings, paragraphs, lists, tables, links) + OpenStreetMap attribution.
import { initSite, esc } from './common.js';

const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/(^|[\s(])(https?:\/\/[^\s)<|]+)/g, (m, pre, url) => `${pre}<a href="${url}" target="_blank" rel="noopener" title="${url}">${shortUrl(url)}</a>`);
// Long asset URLs make table columns explode on phones: show "host/…/last-part" (full URL stays in href/title).
function shortUrl(u) {
  const m = u.match(/^https?:\/\/(?:www\.)?([^/]+)(\/.*)?$/); if (!m) return u;
  const parts = (m[2] || '').split('/').filter(Boolean);
  if (!parts.length) return m[1];
  let last = parts[parts.length - 1]; if (last.length > 32) last = last.slice(0, 30) + '…';
  return m[1] + (parts.length > 1 ? '/…/' : '/') + last;
}
function md(text) {
  const out = []; const lines = text.split('\n'); let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const [h, , ...b] = rows;
      out.push(`<div class="table-wrap"><table><thead><tr>${cells(h).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${b.map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    const hm = l.match(/^(#{1,4})\s+(.*)/); if (hm) { const n = Math.min(4, hm[1].length + 1); out.push(`<h${n}>${inline(hm[2])}</h${n}>`); i++; continue; }
    if (/^\s*[-*]\s+/.test(l)) { const items = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, '')); out.push(`<ul>${items.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`); continue; }
    if (l.trim()) out.push(`<p>${inline(l)}</p>`);
    i++;
  }
  return out.join('\n');
}

await initSite('credits');
const el = document.getElementById('credits');
try {
  const r = await fetch('assets/CREDITS.md'); if (!r.ok) throw new Error(r.status);
  el.innerHTML = `<p>Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (ODbL 1.0).</p>` + md(await r.text());
} catch {}
