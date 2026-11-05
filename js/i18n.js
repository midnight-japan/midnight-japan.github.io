// Tiny i18n: loads /i18n/<lang>.json, falls back to English, then to the key itself.
import { LANGS } from '../data/meta.js';
const KEY = 'dn.lang';
let dict = {}, fallback = {}, current = 'en';
const cache = {};

async function load(lang) {
  if (cache[lang]) return cache[lang];
  try {
    const base = new URL('../i18n/', import.meta.url);
    const r = await fetch(new URL(lang + '.json', base));
    cache[lang] = r.ok ? await r.json() : {};
  } catch { cache[lang] = {}; }
  return cache[lang];
}

export function detectLang() {
  let saved = null; try { saved = localStorage.getItem(KEY); } catch {}
  if (saved && LANGS.some(l => l[0] === saved)) return saved;
  const nav = (navigator.languages || [navigator.language || 'en']);
  for (const n of nav) {
    const exact = LANGS.find(l => l[0].toLowerCase() === n.toLowerCase());
    if (exact) return exact[0];
    if (/^zh/i.test(n)) return /TW|HK|Hant/i.test(n) ? 'zh-TW' : 'zh-CN';
    if (/^(tl|fil)/i.test(n)) return 'fil';
    const short = LANGS.find(l => l[0] === n.slice(0, 2).toLowerCase());
    if (short) return short[0];
  }
  return 'en';
}

export async function setLang(lang) {
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch {}
  [fallback, dict] = await Promise.all([load('en'), load(lang)]);
  document.documentElement.lang = lang;
  applyDom();
  window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}

export const getLang = () => current;

export function t(key, vars) {
  let s = dict[key] ?? fallback[key] ?? key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

// <el data-i18n="key">, data-i18n-ph (placeholder), data-i18n-title
export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
}

// Pick ko/ja/en text from a {ko,ja,en} object for the current language.
export function pick(obj) {
  if (!obj) return '';
  return obj[current] ?? obj[current.slice(0, 2)] ?? obj.en ?? obj.ja ?? Object.values(obj)[0];
}

export function langSelect(el) {
  el.innerHTML = LANGS.map(([c, n]) => `<option value="${c}">${n}</option>`).join('');
  el.value = current;
  el.addEventListener('change', () => setLang(el.value));
}
