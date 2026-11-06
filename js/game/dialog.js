// Conversations with clear, big choice cards (Sims-style): after an accident with the other driver (mood, apology,
// insurance, a cash settlement you negotiate, blaming them, a slap …) and when a police officer stops you (show your
// licence, refuse, or floor it). Keys 1–6 pick an option. Texts in Korean / Japanese / English (others → English).
import { getLang } from '../i18n.js';

export const L = (o) => o[getLang()] || o[(getLang() || '').split('-')[0]] || o.en;
const yen = (n) => '¥' + Math.round(n).toLocaleString('ja-JP');

export class Dialog {
  constructor(game) {
    this.g = game; this.open = false;
    const el = document.createElement('div'); el.id = 'dlg'; el.className = 'dlg'; el.hidden = true;
    el.innerHTML = '<div class="dlg-card"><div class="dlg-top"><div class="dlg-who"></div><div class="dlg-mood"><span class="dlg-mood-l"></span><div class="dlg-bar"><i></i></div></div></div><p class="dlg-text"></p><div class="dlg-opts"></div></div>';
    document.body.appendChild(el); this.el = el;
    addEventListener('keydown', (e) => { if (!this.open) return; const n = +e.key; if (n >= 1 && n <= this.opts.length) { e.preventDefault(); e.stopPropagation(); this.choose(n - 1); } }, true);
  }
  show({ who, text, mood = null, moodLabel = '', options }) {
    this.open = true; this.opts = options; this.el.hidden = false;
    this.el.querySelector('.dlg-who').textContent = who;
    this.el.querySelector('.dlg-text').textContent = text;
    const m = this.el.querySelector('.dlg-mood'); m.hidden = mood === null;
    if (mood !== null) { const v = Math.max(0, Math.min(100, mood)); m.querySelector('i').style.width = v + '%'; m.querySelector('i').style.background = v > 65 ? '#33c27a' : v > 35 ? '#ffb347' : '#ff4d4d'; m.querySelector('.dlg-mood-l').textContent = moodLabel; }
    const box = this.el.querySelector('.dlg-opts'); box.innerHTML = '';
    options.forEach((o, i) => { const b = document.createElement('button'); b.className = 'dlg-opt' + (o.tone ? ' ' + o.tone : ''); b.innerHTML = `<kbd>${i + 1}</kbd><span></span>`; b.querySelector('span').textContent = o.label; b.onclick = () => this.choose(i); box.appendChild(b); });
    this.g.audio?.sfx('ui_select');
  }
  choose(i) { const o = this.opts?.[i]; if (!o) return; this.g.audio?.sfx('ui_click'); o.act(); }
  close() { this.open = false; this.el.hidden = true; this.opts = []; }

  // ── accident with an AI driver ──
  accident(inc, onEnd) {
    const g = this.g, impact = inc.impact;
    const S = { mood: Math.max(15, 62 - impact * 2.2), asked: false, offer: 0, said: 0 };
    const claim = Math.round((15000 + impact * 4500) / 1000) * 1000;
    const moodL = () => L({ ko: '상대방 기분', ja: '相手の機嫌', en: 'Their mood' });
    const face = () => S.mood > 70 ? L({ ko: '😊 누그러짐', ja: '😊 和らいだ', en: '😊 calmer' }) : S.mood > 40 ? L({ ko: '😐 불편함', ja: '😐 不満', en: '😐 upset' }) : L({ ko: '😠 화남', ja: '😠 怒っている', en: '😠 angry' });
    const say = (ja, ko, en) => { g.audio?.speak(ja, 'ja-JP', inc.voice); return L({ ko: `「${ja}」\n${ko}`, ja: `「${ja}」`, en: `“${ja}”\n${en}` }); };
    const end = (result) => { this.close(); onEnd(result); };
    const menu = (text) => this.show({ who: L({ ko: '사고 상대 운전자', ja: '事故の相手', en: 'The other driver' }), text, mood: S.mood, moodLabel: `${moodL()} · ${face()}`, options: [
      { label: L({ ko: '정중하게 사과한다', ja: '丁寧に謝る', en: 'Apologise sincerely' }), act: () => { S.mood += S.said++ < 2 ? 18 : 4; menu(say('…まあ、怪我がなくてよかったです。', '…뭐, 다친 데가 없어서 다행이에요.', '…Well, at least nobody is hurt.')); } },
      { label: L({ ko: '괜찮은지 묻고 상태를 살핀다', ja: '怪我がないか気遣う', en: 'Ask if they are alright' }), act: () => { S.mood += 10; menu(say('大丈夫です。でも車が…', '저는 괜찮아요. 그런데 차가…', 'I’m fine. But my car…')); } },
      { label: L({ ko: `보험 정보를 교환하고 경찰을 기다린다`, ja: '保険の情報を交換して警察を待つ', en: 'Swap insurance details and wait for the police' }), tone: 'safe', act: () => { S.mood += 8; this.g.audio?.speak('はい、保険会社に連絡しておきます。', 'ja-JP', inc.voice); end({ kind: 'insurance', mood: S.mood }); } },
      { label: L({ ko: `현장 합의금 제안 (${yen(claim * 0.5)})`, ja: `示談金を提案（${yen(claim * 0.5)}）`, en: `Offer a settlement (${yen(claim * 0.5)})` }), act: () => this.offer(S, claim, 0.5, menu, end, say) },
      { label: L({ ko: `넉넉하게 합의금 제안 (${yen(claim)})`, ja: `十分な示談金を提案（${yen(claim)}）`, en: `Offer a generous settlement (${yen(claim)})` }), act: () => this.offer(S, claim, 1, menu, end, say) },
      { label: L({ ko: '상대 탓을 한다', ja: '相手のせいにする', en: 'Blame them' }), tone: 'bad', act: () => { S.mood -= 25; menu(say('は？ぶつけてきたのはそっちでしょう！', '네? 박은 건 그쪽이잖아요!', 'Excuse me? You hit me!')); } },
      { label: L({ ko: '뺨을 때린다', ja: '平手打ちする', en: 'Slap them' }), tone: 'bad', act: () => { g.audio?.sfx('slap'); S.mood = 0; g.shake = 0.4; this.g.audio?.speak('痛っ！何するんですか！警察呼びますよ！', 'ja-JP', inc.voice); end({ kind: 'assault', mood: 0 }); } },
      { label: L({ ko: '그냥 자리를 뜬다 (뺑소니)', ja: 'その場を立ち去る（当て逃げ）', en: 'Just leave (hit and run)' }), tone: 'bad', act: () => end({ kind: 'leave', mood: S.mood }) },
    ] });
    menu(say('ちょっと！どこ見て運転してるんですか！', '이봐요! 어딜 보고 운전하는 거예요!', 'Hey! Where were you looking?!'));
  }
  offer(S, claim, k, menu, end, say) {
    const amt = Math.round(claim * k);
    const need = 0.45 + (1 - S.mood / 100) * 0.7; // angrier → wants more
    if (k >= need || (k >= 0.5 && S.mood > 70)) {
      this.g.money -= amt; this.g.audio?.sfx('coin');
      this.g.audio?.speak('わかりました。今回はこれで示談にしましょう。', 'ja-JP');
      end({ kind: 'settled', amount: amt, mood: Math.min(100, S.mood + 25) });
    } else { S.mood -= 6; menu(say('それじゃ修理代にもなりませんよ。', '그걸로는 수리비도 안 나와요.', 'That won’t even cover the repairs.')); }
  }

  // ── police stop ──
  policeStop(over, onEnd) {
    const fine = over >= 50 ? 100000 : over >= 40 ? 40000 : over >= 30 ? 25000 : over >= 20 ? 18000 : 12000;
    const end = (r) => { this.close(); onEnd(r); };
    const off = (ja) => { this.g.audio?.speak(ja, 'ja-JP', { role: 'police', megaphone: false, seed: 4 }); };
    off('神奈川県警です。免許証を見せてください。');
    this.show({ who: L({ ko: '가나가와현경 교통기동대', ja: '神奈川県警 交通機動隊', en: 'Kanagawa Police, traffic unit' }),
      text: L({ ko: `「免許証を見せてください。」\n면허증을 보여 주세요. 제한속도보다 ${Math.round(over)} km/h 빨랐습니다.`, ja: `「免許証を見せてください。」\n制限速度を${Math.round(over)}km/h超えています。`, en: `“Your licence, please.”\nYou were ${Math.round(over)} km/h over the limit.` }),
      options: [
        { label: L({ ko: `면허증을 제시한다 (범칙금 약 ${yen(fine)})`, ja: `免許証を見せる（反則金 約${yen(fine)}）`, en: `Show your licence (fine about ${yen(fine)})` }), tone: 'safe', act: () => { off('ご協力ありがとうございます。安全運転でお願いします。'); end({ kind: 'comply', fine: over < 15 ? 0 : fine }); } },
        { label: L({ ko: '정중하게 사정을 설명한다', ja: '事情を丁寧に説明する', en: 'Politely explain yourself' }), act: () => { const lucky = over < 25 && Math.random() < 0.5; off(lucky ? '今回は警告にしておきます。気をつけてください。' : '事情はわかりますが、違反は違反です。'); end({ kind: lucky ? 'warning' : 'comply', fine: lucky ? 0 : fine }); } },
        { label: L({ ko: '면허증 제시를 거부한다', ja: '免許証の提示を拒否する', en: 'Refuse to show your licence' }), tone: 'bad', act: () => { off('提示を拒否するなら、署まで同行してもらいます。'); end({ kind: 'refuse', fine: fine * 2 }); } },
        { label: L({ ko: '액셀을 밟고 도주한다', ja: 'アクセルを踏んで逃げる', en: 'Floor it and run' }), tone: 'bad', act: () => { off('止まりなさい！逃走車両、止まりなさい！'); end({ kind: 'flee' }); } },
      ] });
  }
}
