// Changelog page: renders every CHANGELOG entry (newest first) as a timeline. New entries appear automatically.
import { CHANGELOG } from '../../data/meta.js';
import { t, pick } from '../i18n.js';
import { initSite, onLang, esc } from './common.js';

const ORDER = ['new', 'change', 'fix', 'known'];

function render() {
  const el = document.getElementById('timeline');
  if (!CHANGELOG.length) { el.innerHTML = `<div class="empty">${esc(t('site.changelog.empty'))}</div>`; return; }
  el.innerHTML = CHANGELOG.map((rel, idx) => {
    const groups = ORDER.concat([...new Set((rel.items || []).map(i => i.type))].filter(x => !ORDER.includes(x)))
      .map(type => [type, (rel.items || []).filter(i => i.type === type)]).filter(([, a]) => a.length);
    return `<article class="card rel" id="v${esc(rel.version.replace(/\./g, '-'))}">
      <div class="rel-head"><span class="rel-ver">v${esc(rel.version)}</span>${rel.codename ? `<span class="rel-code">${esc(rel.codename)}</span>` : ''}
        ${idx === 0 ? `<span class="rel-latest">${esc(t('site.changelog.latest'))}</span>` : ''}<time class="rel-date" datetime="${esc(rel.date)}">${esc(rel.date)}</time></div>
      ${rel.summary ? `<p class="rel-sum">${esc(pick(rel.summary))}</p>` : ''}
      ${groups.map(([type, items]) => `<section class="rel-group ${esc(type)}"><h4><span class="ty ${esc(type)}">${esc(t('site.type.' + type))}</span><span>${esc(t('site.changelog.count', { n: items.length }))}</span></h4>
        <ul>${items.map(i => `<li>${esc(pick(i))}</li>`).join('')}</ul></section>`).join('')}
    </article>`;
  }).join('');
}

await initSite('changelog');
onLang(render);
if (location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
