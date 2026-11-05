// Account page: sign-up / log-in / log-out, nickname change, profile (favourite car + outfit colours). Uses js/account.js.
import { CARS } from '../../data/cars.js';
import { t } from '../i18n.js';
import { signUp, logIn, logOut, currentUser, updateUser } from '../account.js';
import { initSite, onLang, esc } from './common.js';
import { carSilhouette } from './carart.js';

export const DEFAULT_OUTFIT = { top: '#1f2a44', bottom: '#2a2f3a', shoes: '#e9e9e7', cap: '#ff9a2e' };
const PLAYABLE = CARS.filter(c => c.playable);
const $ = s => document.querySelector(s);
const changed = () => window.dispatchEvent(new CustomEvent('accountchange'));
const errText = e => { const k = e?.message || ''; return /^(account|site)\./.test(k) ? t(k) : t('site.account.err.generic'); };

function figure(o) {
  return `<svg viewBox="0 0 100 200" aria-hidden="true">
    <ellipse cx="50" cy="194" rx="30" ry="4" fill="#000" opacity=".5"/>
    <circle cx="50" cy="30" r="15" fill="#e8c4a0"/>
    <path d="M34 28a16 14 0 0 1 32 0z" fill="${o.cap}"/><path d="M60 26h14v4H60z" fill="${o.cap}"/>
    <path d="M30 52q20-8 40 0l6 54H24z" fill="${o.top}"/>
    <path d="M24 60l-8 44h8l8-34zM76 60l8 44h-8l-8-34z" fill="${o.top}"/>
    <circle cx="20" cy="108" r="4" fill="#e8c4a0"/><circle cx="80" cy="108" r="4" fill="#e8c4a0"/>
    <path d="M26 104h48l-4 80H54l-4-56-4 56H30z" fill="${o.bottom}"/>
    <path d="M28 182h18v8H24zM54 182h18l4 8H54z" fill="${o.shoes}"/>
  </svg>`;
}

function show() {
  const u = currentUser();
  $('#acc-out').hidden = !!u; $('#acc-in').hidden = !u;
  if (!u) return;
  $('#p-av').textContent = [...u.nickname][0].toUpperCase();
  $('#p-nick').textContent = u.nickname;
  $('#p-id').textContent = 'ID: ' + u.id;
  let since = ''; try { since = new Date(u.created).toLocaleDateString(document.documentElement.lang); } catch {}
  $('#p-since').textContent = t('site.account.since', { date: since });
  $('#form-nick').nickname.value = u.nickname;
  const p = u.profile || {};
  const sel = $('#p-car');
  sel.innerHTML = PLAYABLE.map(c => `<option value="${esc(c.id)}">${esc(c.maker)} ${esc(c.name)} (${esc(c.chassis)})</option>`).join('');
  sel.value = PLAYABLE.some(c => c.id === p.car) ? p.car : 'r34';
  const o = { ...DEFAULT_OUTFIT, ...(p.outfit || {}) };
  const f = $('#form-profile');
  for (const k of Object.keys(DEFAULT_OUTFIT)) f.elements.namedItem(k).value = o[k];
  preview();
}

function preview() {
  const f = $('#form-profile');
  const c = CARS.find(x => x.id === f.elements.namedItem('car').value) || PLAYABLE[0];
  $('#p-car-prev').innerHTML = carSilhouette(c);
  const o = {}; for (const k of Object.keys(DEFAULT_OUTFIT)) o[k] = f.elements.namedItem(k).value;
  $('#p-figure').innerHTML = figure(o);
}

function tab(which) {
  const login = which === 'login';
  $('#tab-login').setAttribute('aria-selected', String(login)); $('#tab-signup').setAttribute('aria-selected', String(!login));
  $('#form-login').hidden = !login; $('#form-signup').hidden = login;
}

$('#tab-login').onclick = () => tab('login');
$('#tab-signup').onclick = () => tab('signup');

$('#form-login').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, err = f.querySelector('.form-err'); err.textContent = '';
  try { await logIn({ id: f.elements.namedItem('id').value, password: f.password.value }); f.reset(); changed(); show(); }
  catch (x) { err.textContent = errText(x); }
});
$('#form-signup').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, err = f.querySelector('.form-err'); err.textContent = '';
  if (f.password.value !== f.password2.value) { err.textContent = t('site.account.err.pwMatch'); return; }
  try {
    await signUp({ id: f.elements.namedItem('id').value, password: f.password.value, nickname: f.nickname.value });
    updateUser({ profile: { car: 'r34', outfit: { ...DEFAULT_OUTFIT } } });
    f.reset(); changed(); show();
  } catch (x) { err.textContent = errText(x); }
});
$('#form-nick').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, err = f.querySelector('.form-err'); err.textContent = '';
  try { updateUser({ nickname: f.nickname.value }); changed(); show(); err.textContent = ''; }
  catch (x) { err.textContent = errText(x); }
});
$('#form-profile').addEventListener('input', preview);
$('#form-profile').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target; const outfit = {};
  for (const k of Object.keys(DEFAULT_OUTFIT)) outfit[k] = f.elements.namedItem(k).value;
  updateUser({ profile: { car: f.elements.namedItem('car').value, outfit } }); changed();
  const ok = f.querySelector('.form-ok'); ok.textContent = t('site.account.saved'); setTimeout(() => { ok.textContent = ''; }, 2500);
});
$('#btn-logout').onclick = () => { logOut(); changed(); show(); tab('login'); };

await initSite('account');
if (location.hash === '#signup') tab('signup');
onLang(show);
