// Credits page: data-source cards (PLATEAU, OpenStreetMap) + assets/CREDITS.md (headings, paragraphs, lists, tables, links).
import { initSite, onLang, esc } from './common.js';
import { t } from '../i18n.js';

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

// Data sources first (PLATEAU buildings + OpenStreetMap roads), then assets/CREDITS.md.
const dataCards = () => `<div class="data-src">
  <article class="card"><span class="ds-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V9l5-3v15M8 21V4l7 3v14M15 21v-9l6-2v11M2 21h20"/></svg></span>
    <div><h2>3D都市モデル（Project PLATEAU）国土交通省</h2><p>${esc(t('site.footer.plateau'))} — <a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noopener">mlit.go.jp/plateau</a> · <a href="https://www.mlit.go.jp/plateau/site-policy/" target="_blank" rel="noopener">Site Policy</a></p></div></article>
  <article class="card"><span class="ds-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg></span>
    <div><h2>© OpenStreetMap contributors</h2><p>${esc(t('site.footer.osm'))} — <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">openstreetmap.org/copyright</a></p></div></article>
</div>`;

await initSite('credits');
const src = document.getElementById('data-src');
onLang(() => { src.innerHTML = dataCards(); });
const el = document.getElementById('credits');
try {
  const r = await fetch('assets/CREDITS.md'); if (!r.ok) throw new Error(r.status);
  el.innerHTML = md(await r.text());
} catch {}
