// MIDNIGHT JAPAN service worker.
// - vendor/ (three.js etc.): cache-first (immutable per release)
// - pages, scripts, styles, data, translations (html/js/mjs/css/json/md/webmanifest): NETWORK-FIRST, cache only as offline fallback
//   → a new release is picked up on the next load; game code is never served stale while online
// - everything else (images, models, audio): stale-while-revalidate
// - cross-origin (Google Fonts, GitHub) is not intercepted
// Keep VERSION in sync with GAME.version in data/meta.js — bumping it drops old caches.
const VERSION = '0.3.2';
const CACHE = 'dn-' + VERSION + '-nf1'; // suffix bumps when the caching strategy changes
const VENDOR = 'dn-vendor-' + VERSION;

const PRECACHE = [
  './', 'index.html', 'cars.html', 'regions.html', 'changelog.html', 'account.html', 'credits.html',
  'manifest.webmanifest', 'css/site.css',
  'js/i18n.js', 'js/account.js',
  'js/site/common.js', 'js/site/carart.js', 'js/site/car3d.js', 'js/site/home.js', 'js/site/cars.js', 'js/site/regions.js', 'js/site/changelog.js', 'js/site/account-page.js',
  'data/cars.js', 'data/meta.js', 'data/map-daikoku.js', 'assets/models/cars/manifest.json',
  'play.html', 'css/game.css', ...['main','ui','world','roads','bay','vehicle','carmodel','carglb','carfactory','carparts','carshapes','plates','traffic','npc','police','toll','sky','textures','signs','humans','audio','music','input','online','accident'].map(f => `js/game/${f}.js`),
  'i18n/en.json', 'i18n/ko.json', 'i18n/ja.json',
  'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/favicon-32.png', 'assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Add individually so one missing file never fails the install.
    await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([CACHE, VENDOR]);
    for (const k of await caches.keys()) if (k.startsWith('dn-') && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const okToCache = res => res && res.ok && res.status === 200 && (res.type === 'basic' || res.type === 'default');

async function put(cacheName, req, res) {
  try { if (okToCache(res)) await (await caches.open(cacheName)).put(req, res); } catch { /* quota etc. — ignore */ }
}

async function cacheFirst(req) {
  const hit = await caches.match(req, { cacheName: VENDOR }).catch(() => null) || await caches.match(req).catch(() => null);
  if (hit) return hit;
  const res = await fetch(req);
  put(VENDOR, req, res.clone());
  return res;
}

async function staleWhileRevalidate(event, req) {
  const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' }).catch(() => null);
  const net = fetch(req).then(res => { put(CACHE, req, res.clone()); return res; });
  if (hit) { event.waitUntil(net.catch(() => {})); return hit; }
  try { return await net; }
  catch (err) {
    if (req.mode === 'navigate') { const home = await caches.match('index.html').catch(() => null); if (home) return home; }
    throw err; // behave like a normal network failure
  }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    put(CACHE, req, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' }).catch(() => null);
    if (hit) return hit;
    if (req.mode === 'navigate') { const home = await caches.match('index.html').catch(() => null); if (home) return home; }
    throw err;
  }
}
const CODE = /\.(?:html?|m?js|css|json|md|webmanifest)$/i;

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return; // let media range requests etc. go straight through
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;
  const scope = new URL(self.registration.scope).pathname;
  const path = url.pathname.startsWith(scope) ? url.pathname.slice(scope.length) : url.pathname;
  const handler = path.startsWith('vendor/') ? cacheFirst(req)
    : (req.mode === 'navigate' || path === '' || CODE.test(path)) ? networkFirst(req)
    : staleWhileRevalidate(event, req);
  // Never let a SW bug break the page: fall back to a plain network fetch.
  event.respondWith(handler.catch(() => fetch(req)));
});
