// Shared site chrome: header (nav, language select, login chip), footer, service worker, install prompt.
// Usage in a page module:  import { initSite } from './common.js';  await initSite('cars');
import { GAME } from '../../data/meta.js';
import { detectLang, setLang, langSelect, t } from '../i18n.js';
import { currentUser } from '../account.js';

export const SITE_URL = 'https://midnight-japan.github.io/';

// ── Motion: page fade-in/out, header state, scroll reveal (IntersectionObserver). Skipped for prefers-reduced-motion.
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOTION = !reducedMotion() && 'IntersectionObserver' in window;
if (MOTION) document.documentElement.classList.add('motion');
const RV_SEL = '.section .sec-head, .card:not(.form), .shot, .faq details, .table-wrap, .sign, .toolbar, .notice';
let rvIO = null;
function revealScan(root) {
  if (!rvIO) return;
  const list = root.matches?.(RV_SEL) ? [root] : [];
  list.push(...(root.querySelectorAll?.(RV_SEL) || []));
  for (const el of list) {
    if (el.dataset.rv || el.closest('.modal, .lightbox, .hero, .page-hero, .site-header')) continue;
    el.dataset.rv = '1'; el.classList.add('rv'); rvIO.observe(el);
  }
}
function setupReveal() {
  if (!MOTION) return;
  rvIO = new IntersectionObserver(entries => {
    const vis = entries.filter(e => e.isIntersecting).map(e => e.target)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    vis.forEach((el, i) => {
      rvIO.unobserve(el);
      const d = Math.min(i * 0.06, 0.42);
      el.style.setProperty('--d', d + 's');
      el.classList.add('in');
      // hand the element back to its own hover transitions once revealed
      setTimeout(() => { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); }, 1300 + d * 1000);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  const main = document.getElementById('main') || document.body;
  revealScan(main);
  new MutationObserver(muts => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) revealScan(n); })
    .observe(main, { childList: true, subtree: true });
}
/** Re-trigger the short "content swapped" animation on an element (tabs, filters, lightbox). */
export function swap(el) { if (!el || !MOTION) return; el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }

function setupPageMotion() {
  const hdr = document.getElementById('site-header');
  const onScroll = () => hdr?.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('pageshow', () => document.documentElement.classList.remove('leaving'));
  if (!MOTION) return;
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
    e.preventDefault();
    document.documentElement.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 170);
  });
}


export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Original emblem: JCT loop ramp + mainline + crescent moon.
export function emblem(id = 'em') {
  return `<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14213f"/><stop offset="1" stop-color="#05070d"/></linearGradient>
    <mask id="${id}m"><rect width="512" height="512" fill="#fff"/><circle cx="418" cy="98" r="46" fill="#000"/></mask>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#${id}bg)"/>
  <circle cx="392" cy="118" r="52" fill="#f6e7bf" mask="url(#${id}m)"/>
  <path d="M40 410H240A110 110 0 1 0 130 300V470" fill="none" stroke="#05070d" stroke-width="58" stroke-linecap="round"/>
  <path d="M40 410H240A110 110 0 1 0 130 300V470" fill="none" stroke="#ff9a2e" stroke-width="30" stroke-linecap="round"/>
  <path d="M40 410H240" stroke="#ffd29a" stroke-width="4" stroke-dasharray="14 14"/>
  <path d="M130 370V470" stroke="#05070d" stroke-width="58"/>
  <path d="M130 360V470" stroke="#ff9a2e" stroke-width="30" stroke-linecap="round"/>
  <path d="M36 190H476" stroke="#05070d" stroke-width="50" stroke-linecap="round"/>
  <path d="M36 190H476" stroke="#2fbf71" stroke-width="28" stroke-linecap="round"/>
  <path d="M60 190H452" stroke="#e9fff2" stroke-width="4" stroke-dasharray="18 16"/>
</svg>`;
}

const I = {
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 20h16"/></svg>',
};
export const ICON = I;

const NAV = [
  ['home', 'index.html', 'site.nav.home', 'Home'],
  ['cars', 'cars.html', 'site.nav.cars', 'Cars'],
  ['regions', 'regions.html', 'site.nav.regions', 'Regions'],
  ['changelog', 'changelog.html', 'site.nav.updates', 'Updates'],
  ['account', 'account.html', 'site.nav.account', 'Account'],
];

function header(page) {
  const links = NAV.map(([id, href, key, en]) =>
    `<a class="nl" href="${href}" data-i18n="${key}"${id === page ? ' aria-current="page"' : ''}>${en}</a>`).join('');
  return `<a class="skip" href="#main" data-i18n="site.skip">Skip to content</a>
  <div class="wrap hdr">
    <a class="brand" href="index.html" aria-label="MIDNIGHT JAPAN">${emblem('hd')}<span class="brand-t">MIDNIGHT<b>JAPAN</b></span><span class="brand-jp">ミッドナイト・ジャパン</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-i18n-title="site.nav.menu" title="Menu"><span></span><span class="sr-only" data-i18n="site.nav.menu">Menu</span></button>
    <nav id="site-nav" class="nav" aria-label="Main">
      ${links}
      <div class="nav-tools">
        <label class="lang">${I.globe}<span class="sr-only" data-i18n="site.nav.language">Language</span><select id="lang-select"></select></label>
        <a id="user-chip" class="user-chip guest" href="account.html"></a>
        <button id="install-btn" class="btn btn-ghost btn-sm" type="button" hidden data-i18n-title="site.install" title="Install app">${I.dl}<span class="sr-only" data-i18n="site.install">Install app</span></button>
        <a class="btn btn-play sm" href="play.html" data-i18n="site.nav.play">Play</a>
      </div>
    </nav>
  </div>`;
}

function footer() {
  const y = new Date().getFullYear();
  return `<div class="wrap">
    <div class="ft-grid">
      <div>
        <a class="brand" href="index.html" aria-label="MIDNIGHT JAPAN">${emblem('ft')}<span class="brand-t">MIDNIGHT<b>JAPAN</b></span></a>
        <p style="margin-top:14px;max-width:420px" data-i18n="site.footer.about">A browser car-meet game set at Daikoku PA on the Shuto Expressway, Yokohama.</p>
        <p class="ft-ver">v${esc(GAME.version)} · build ${esc(GAME.build)}</p>
        <p class="ft-aka">MIDNIGHT JAPAN · <span lang="ja">ミッドナイト・ジャパン</span> · <span lang="ko">미드나잇 재팬</span> — Daikoku PA game · <span lang="ja">大黒PA ゲーム</span> · <span lang="ko">다이코쿠 PA 게임</span></p>
      </div>
      <div>
        <h4 data-i18n="site.footer.game">Game</h4>
        <ul>
          <li><a href="play.html" data-i18n="site.nav.play">Play</a></li>
          <li><a href="cars.html" data-i18n="site.nav.cars">Cars</a></li>
          <li><a href="regions.html" data-i18n="site.nav.regions">Regions</a></li>
          <li><a href="changelog.html" data-i18n="site.nav.updates">Updates</a></li>
        </ul>
      </div>
      <div>
        <h4 data-i18n="site.footer.more">More</h4>
        <ul>
          <li><a href="account.html" data-i18n="site.nav.account">Account</a></li>
          <li><a href="credits.html" data-i18n="site.footer.credits">Credits</a></li>
          <li><a href="index.html#faq" data-i18n="site.footer.faq">FAQ</a></li>
        </ul>
      </div>
    </div>
    <div class="disclaimer">
      <span data-i18n="site.footer.disclaimer">Non-commercial fan project. Vehicle names and trademarks belong to their owners. Not affiliated with Shuto Expressway, NEXCO, or Kanagawa Prefectural Police.</span>
      <span>© ${y} MIDNIGHT JAPAN</span>
    </div>
  </div>`;
}

export function renderUserChip() {
  const el = document.getElementById('user-chip'); if (!el) return;
  const u = currentUser();
  el.classList.toggle('guest', !u);
  el.innerHTML = u
    ? `<span class="av">${esc([...u.nickname][0].toUpperCase())}</span><span class="nm">${esc(u.nickname)}</span>`
    : `<span class="av">?</span><span class="nm">${esc(t('site.nav.login'))}</span>`;
  el.title = u ? t('site.nav.signedInAs', { name: u.nickname }) : t('site.nav.login');
}

let deferredPrompt = null;
function setupInstall() {
  const btn = document.getElementById('install-btn');
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (btn) btn.hidden = false; });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; if (btn) btn.hidden = true; });
  btn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch {}
    deferredPrompt = null; btn.hidden = true;
  });
}

function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('[sw] registration failed', err));
  });
}

let pageKey = 'home';
function setTitle() {
  const name = t('site.page.' + pageKey);
  if (pageKey === 'home') return; // keep the static multilingual <title> (ko/ja/en names, good for search)
  document.title = `${name} — MIDNIGHT JAPAN`;
}

/** Build chrome, load language, wire everything. Page modules re-render dynamic parts on the 'langchange' event. */
export async function initSite(page) {
  pageKey = page;
  document.body.dataset.page = page;
  const h = document.getElementById('site-header'), f = document.getElementById('site-footer');
  if (h) { h.className = 'site-header'; h.innerHTML = header(page); }
  if (f) { f.className = 'site-footer'; f.innerHTML = footer(); }

  const toggle = h?.querySelector('.nav-toggle'), nav = h?.querySelector('#site-nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav?.classList.contains('open')) toggle.click(); });

  window.addEventListener('langchange', () => { renderUserChip(); setTitle(); });
  window.addEventListener('accountchange', renderUserChip);
  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('dn.')) renderUserChip(); });

  await setLang(detectLang());
  const sel = document.getElementById('lang-select');
  if (sel) { langSelect(sel); sel.setAttribute('aria-label', t('site.nav.language')); }
  setupInstall();
  registerSW();
  setupPageMotion();
  setupReveal();
}

/** Run fn now and on every language change. */
export function onLang(fn) { fn(); window.addEventListener('langchange', fn); }

/** Number formatting in the current UI language. */
export const num = (n, d = 0) => { try { return Number(n).toLocaleString(document.documentElement.lang || 'en', { maximumFractionDigits: d, minimumFractionDigits: d }); } catch { return String(n); } };
