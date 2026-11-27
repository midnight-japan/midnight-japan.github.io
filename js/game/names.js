// Place / road names are Japanese (as on the real signs). In other languages they are shown together with a reading:
// 「鶴見区 · 쓰루미구」 / 「鶴見区 · Tsurumi Ward」. Korean readings for ko, romaji/English for every other language.
import { getLang } from '../i18n.js';

const N = {
  '鶴見区': ['쓰루미구', 'Tsurumi Ward'], '大黒ふ頭': ['다이코쿠 부두', 'Daikoku Wharf'], '大黒町': ['다이코쿠초', 'Daikoku-chō'], '大黒JCT': ['다이코쿠 JCT', 'Daikoku JCT'],
  '生麦': ['나마무기', 'Namamugi'], '生麦JCT': ['나마무기 JCT', 'Namamugi JCT'], '新子安': ['신코야스', 'Shin-Koyasu'], '末広町': ['스에히로초', 'Suehiro-chō'],
  '安善町': ['안젠초', 'Anzen-chō'], '弁天町': ['벤텐초', 'Benten-chō'], '扇島': ['오기시마', 'Ōgishima'], '鶴見川': ['쓰루미강', 'Tsurumi River'],
  '京浜運河': ['게이힌 운하', 'Keihin Canal'], '横浜港': ['요코하마항', 'Port of Yokohama'], 'みなとみらい': ['미나토미라이', 'Minato Mirai'], '横浜駅': ['요코하마역', 'Yokohama Station'],
  '大さん橋': ['오산바시', 'Ōsanbashi Pier'], '山下公園': ['야마시타 공원', 'Yamashita Park'], '横浜中華街': ['요코하마 차이나타운', 'Yokohama Chinatown'], '本牧ふ頭': ['혼모쿠 부두', 'Honmoku Wharf'],
  '本牧JCT': ['혼모쿠 JCT', 'Honmoku JCT'], '横浜ベイブリッジ': ['요코하마 베이브리지', 'Yokohama Bay Bridge'], '新山下': ['신야마시타', 'Shin-Yamashita'], '磯子': ['이소고', 'Isogo'],
  '川崎区': ['가와사키구', 'Kawasaki Ward'], '川崎駅': ['가와사키역', 'Kawasaki Station'], '東扇島': ['히가시오기시마', 'Higashi-Ōgishima'], '浮島町': ['우키시마초', 'Ukishima-chō'],
  '川崎浮島JCT': ['가와사키 우키시마 JCT', 'Kawasaki-Ukishima JCT'], '千鳥町': ['치도리초', 'Chidori-chō'], '水江町': ['미즈에초', 'Mizue-chō'], '殿町': ['도노마치', 'Tonomachi'],
  '多摩川': ['다마강', 'Tama River'], '羽田空港': ['하네다 공항', 'Haneda Airport'], '京浜島': ['게이힌지마', 'Keihinjima'], '昭和島': ['쇼와지마', 'Shōwajima'],
  '城南島': ['조난지마', 'Jōnanjima'], '平和島': ['헤이와지마', 'Heiwajima'], '大井ふ頭': ['오이 부두', 'Ōi Wharf'], '大井JCT': ['오이 JCT', 'Ōi JCT'],
  '東海JCT': ['도카이 JCT', 'Tōkai JCT'], '天王洲アイル': ['덴노즈 아일', 'Tennōzu Isle'], '品川': ['시나가와', 'Shinagawa'], 'お台場': ['오다이바', 'Odaiba'],
  '有明': ['아리아케', 'Ariake'], '青海': ['아오미', 'Aomi'], '新木場': ['신키바', 'Shin-Kiba'], '若洲': ['와카스', 'Wakasu'], '芝浦': ['시바우라', 'Shibaura'],
  '汐留': ['시오도메', 'Shiodome'], '銀座': ['긴자', 'Ginza'], '海ほたるPA': ['우미호타루 PA', 'Umihotaru PA'], '風の塔': ['가제노토', 'Kaze-no-Tō'],
  '木更津': ['기사라즈', 'Kisarazu'], '木更津金田': ['기사라즈 가네다', 'Kisarazu-Kaneda'], '東京湾': ['도쿄만', 'Tokyo Bay'], '大黒PA': ['다이코쿠 PA', 'Daikoku PA'],
  'アネスト岩田ターンパイク箱根': ['하코네 턴파이크', 'Hakone Turnpike'], '大観山': ['다이칸야마', 'Daikanyama'], '箱根': ['하코네', 'Hakone'], '大観山 · 箱根': ['다이칸야마 · 하코네', 'Daikanyama · Hakone'], '見晴らし駐車帯 · 箱根ターンパイク': ['전망 주차대 · 하코네 턴파이크', 'Viewpoint lay-by · Hakone Turnpike'],
  // v2.16 regions (region.js)
  '箱根七曲り': ['하코네 나나마가리', 'Hakone Nanamagari'], '富士山スカイライン': ['후지산 스카이라인', 'Fuji Skyline'], '江の島': ['에노시마', 'Enoshima'], 'ビーナスライン': ['비너스 라인', 'Venus Line'],
  '湯本元箱根線（七曲り）': ['유모토 모토하코네선 (나나마가리)', 'Yumoto–Motohakone Rd (Nanamagari)'], '湯河原箱根仙石原線': ['유가와라 하코네 센고쿠하라선', 'Yugawara–Hakone–Sengokuhara Rd'], '富士宮富士公園線': ['후지노미야 후지공원선', 'Fujinomiya–Fuji Park Rd'],
  '富士山スカイライン（水ヶ塚）': ['후지산 스카이라인 (미즈가쓰카)', 'Fuji Skyline (Mizugatsuka)'], '国道134号': ['국도 134호', 'Route 134'], '江の島大橋': ['에노시마 대교', 'Enoshima Ohashi Bridge'], '江の島弁天橋': ['에노시마 벤텐교', 'Enoshima Benten Bridge'],
  '畑宿': ['하타주쿠', 'Hatajuku'], '元箱根': ['모토하코네', 'Moto-Hakone'], '七曲り 駐車帯': ['나나마가리 주차대', 'Nanamagari lay-by'], '富士宮口五合目': ['후지노미야 입구 5합목', 'Fujinomiya 5th Station'], '水ヶ塚駐車場': ['미즈가쓰카 주차장', 'Mizugatsuka car park'],
  '西臼塚駐車場': ['니시우스즈카 주차장', 'Nishi-Usuzuka car park'], '湘南港駐車場': ['쇼난항 주차장', 'Shōnan Port car park'], '七里ヶ浜駐車場': ['시치리가하마 주차장', 'Shichirigahama car park'], '鵠沼海岸駐車場': ['구게누마 해안 주차장', 'Kugenuma Beach car park'],
  '美ヶ原高原美術館': ['우쓰쿠시가하라 고원 미술관', 'Utsukushigahara Open-Air Museum'], '白樺湖': ['시라카바호', 'Lake Shirakaba'], '車山肩': ['구루마야마카타', 'Kurumayama-kata'], '霧ヶ峰 強清水': ['기리가미네 고와시미즈', 'Kirigamine Kowashimizu'], '扉峠': ['도비라 고개', 'Tobira Pass'],
  '非常駐車帯': ['비상 주차대', 'Emergency bay'], '駐車帯': ['주차대', 'Lay-by'],
  '首都高速都心環状線（内回り）': ['수도고속 도심환상선 (내회선)', 'Shuto C1 Inner Circular (inner loop)'], '首都高速都心環状線（外回り）': ['수도고속 도심환상선 (외회선)', 'Shuto C1 Inner Circular (outer loop)'],
  '首都高速湾岸線': ['수도고속 완간선', 'Shuto Bayshore Route'], '東京湾アクアライン': ['도쿄만 아쿠아라인', 'Tokyo Bay Aqua-Line'], '首都高速K5大黒線': ['수도고속 K5 다이코쿠선', 'Shuto K5 Daikoku Route'],
  '首都高速K1横羽線': ['수도고속 K1 요코하네선', 'Shuto K1 Yokohane Route'], '首都高速K3狩場線': ['수도고속 K3 가리바선', 'Shuto K3 Kariba Route'],
  '大黒PA 入口ランプ': ['다이코쿠 PA 진입 램프', 'Daikoku PA entry ramp'], '大黒PA 出口ランプ': ['다이코쿠 PA 진출 램프', 'Daikoku PA exit ramp'],
  '大黒ふ頭入口': ['다이코쿠 부두 입구', 'Daikoku Wharf entrance'], '大黒ふ頭出口': ['다이코쿠 부두 출구', 'Daikoku Wharf exit'], '大黒ふ頭 中央通り': ['다이코쿠 부두 중앙로', 'Daikoku Wharf Central Ave.'],
  '海ほたるPA · 東京湾アクアライン': ['우미호타루 PA · 도쿄만 아쿠아라인', 'Umihotaru PA · Aqua-Line'], '大黒PA · 鶴見区大黒ふ頭': ['다이코쿠 PA · 쓰루미구 다이코쿠 부두', 'Daikoku PA · Daikoku Wharf'],
};
// JCT ramps: 「生麦JCT（K5→K1 横浜方面）」 → translate the JCT part, keep the route numbers
const DIR = { '横浜方面': ['요코하마 방면', 'to Yokohama'], '大黒方面': ['다이코쿠 방면', 'to Daikoku'], '本牧方面': ['혼모쿠 방면', 'to Honmoku'], '東京方面': ['도쿄 방면', 'to Tokyo'], '湾岸線': ['완간선', 'Bayshore'], 'アクアライン': ['아쿠아라인', 'Aqua-Line'], '大黒PA': ['다이코쿠 PA', 'Daikoku PA'] };

function one(ja, k) {
  if (N[ja]) return N[ja][k];
  const m = /^(.*?JCT)（(.*)）$/.exec(ja);
  if (m && N[m[1]]) { let inner = m[2]; for (const [j, t] of Object.entries(DIR)) inner = inner.split(j).join(t[k]); return `${N[m[1]][k]} (${inner})`; }
  return null;
}
/** the reading of a Japanese name in the current language (null for Japanese or unknown names) */
export function reading(ja) {
  const lang = getLang() || 'en'; if (lang === 'ja' || !ja) return null;
  const k = lang === 'ko' ? 0 : 1;
  // composite "A · B" labels (road · district)
  if (ja.includes(' · ') && !N[ja]) { const parts = ja.split(' · ').map(p => one(p, k)); return parts.every(Boolean) ? parts.join(' · ') : null; }
  return one(ja, k);
}
/** 「鶴見区 · 쓰루미구」 style label: Japanese first, then the reading */
export function bilingual(ja) { const r = reading(ja); return r ? `${ja}  ${r}` : ja; }

/** v2.14: the romaji / English on real road signs (guide boards, intersection plates) — '' when unknown */
export function romaji(ja) { return (N[ja]?.[1] || one(ja, 1) || '').replace(/ (Ward|Station)$/, m => m); }
