// v2.17 ranking page: weekly / all-time driver ranking + players online now, read from the game server DB (js/server.js).
import { CAR_BY_ID } from '../../data/cars.js';
import { t } from '../i18n.js';
import { ranking, serverStats } from '../server.js';
import { initSite, onLang, esc } from './common.js';

let period = 'week', last = null, stats = null;
const $ = s => document.querySelector(s);
const hm = sec => { const h = Math.floor(sec / 3600), m = Math.round(sec % 3600 / 60); return h ? `${h}h ${m}m` : `${m}m`; };

function render() {
  const body = $('#rk-body');
  if (!last) { body.innerHTML = `<tr><td colspan="6" class="rk-msg">${esc(t(last === null ? 'site.rank.loading' : 'site.rank.offline'))}</td></tr>`; return; }
  $('#rk-stats').innerHTML = [
    [stats ? stats.online : '—', t('site.rank.onlineNow')], [last.drivers, t('site.rank.drivers')], [Math.round(last.km).toLocaleString() + ' km', t('site.rank.total')], [stats ? stats.members : '—', t('site.rank.members')],
  ].map(([v, l]) => `<div class="rk-stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
  body.innerHTML = last.rows.length ? last.rows.map((r, i) => { const c = CAR_BY_ID[r.car];
    return `<tr${i < 3 ? ' class="top"' : ''}><td>${i + 1}</td><td>${r.member ? '★ ' : ''}${esc(r.name)}</td><td>${esc(c ? c.maker + ' ' + c.name : r.car)}</td><td>${r.km.toFixed(1)} km</td><td>${Math.round(r.top)} km/h</td><td>${hm(r.sec)}</td></tr>`; }).join('')
    : `<tr><td colspan="6" class="rk-msg">${esc(t('site.rank.empty'))}</td></tr>`;
}
async function load() {
  last = null; render();
  try { [last, stats] = await Promise.all([ranking(period, 50), serverStats().catch(() => null)]); }
  catch { last = undefined; }
  render();
}
document.querySelectorAll('.rk-tabs .chip').forEach(b => b.onclick = () => {
  period = b.dataset.p; document.querySelectorAll('.rk-tabs .chip').forEach(x => x.setAttribute('aria-selected', String(x === b))); load();
});
await initSite('ranking');
onLang(render);
load(); setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000);
