// Plain-language glossary (v2.12) for people who don't know car or Japanese road culture. Shown in the in-game 用語集
// panel, as a one-line explainer under the garage stance presets, as a first-time tip when you enter a road type, and
// on the website. Each term: ja (as written in Japan), r (reading), and short ko / ja / en explanations.
export const GLOSSARY = [
  // stance & tuning
  { k: 'tsura', ja: 'ツライチ', r: 'tsuraichi', tag: 'stance', ko: '타이어 바깥면을 펜더(바퀴 덮개) 끝과 딱 맞춘 세팅. 바퀴가 차체와 한 면처럼 보여 깔끔하다.', jp: 'タイヤの外側をフェンダーの縁とぴったり揃えたセッティング。', en: 'Wheels set so the tyre face sits exactly flush with the fender lip — a clean, “one surface” look.' },
  { k: 'shakotan', ja: 'シャコタン', r: 'shakotan', tag: 'stance', ko: '차고를 아주 낮춘 스타일(“차고 단(短)”). 노면 턱에 주의!', jp: '車高を極端に下げたスタイル（車高短）。段差に注意。', en: '“Short ride height” — slammed low. Watch out for speed bumps!' },
  { k: 'vip', ja: 'VIP', r: 'bippu', tag: 'stance', ko: '고급 세단을 낮추고 바퀴를 안쪽으로 기울인(캠버) 일본식 럭셔리 커스텀.', jp: '高級セダンを低くし、キャンバーを付けた日本のラグジュアリーカスタム。', en: 'Japanese luxury-saloon style: low, with wheels tilted in at the top (camber) and deep-dish rims.' },
  { k: 'onikyan', ja: '鬼キャン', r: 'oni-kyan', tag: 'stance', ko: '“귀신 캠버”. 바퀴를 극단적으로 기울인 과시용 세팅. 주행보다 보여주기용.', jp: '「鬼キャンバー」。極端に傾けた見せるためのセッティング。', en: '“Demon camber” — wheels tilted to the extreme. For show, not for driving.' },
  { k: 'camber', ja: 'キャンバー', r: 'kyanbā', tag: 'stance', ko: '앞에서 봤을 때 바퀴 위쪽이 안으로 기운 각도. 코너링 접지가 좋아지지만 너무 크면 직진이 불안정.', jp: '前から見たタイヤの傾き。コーナーのグリップが増えるが付けすぎは直進が不安定。', en: 'How much the top of the wheel leans in, seen from the front. A little helps cornering grip; too much hurts straight-line stability.' },
  { k: 'shakochou', ja: '車高調', r: 'shakō-chō', tag: 'stance', ko: '차고 조절식 서스펜션. 높이와 단단함을 바꿀 수 있다.', jp: '車高調整式サスペンション。高さと硬さを変えられる。', en: 'Height-adjustable coilovers — change how low and how stiff the car sits.' },
  { k: 'drift', ja: 'ドリフト', r: 'dorifuto', tag: 'drive', ko: '뒷바퀴를 일부러 미끄러뜨리며 코너를 도는 기술. 일본 토게에서 시작됐다.', jp: '後輪をわざと滑らせてコーナーを回る技術。日本の峠が発祥。', en: 'Sliding the rear wheels on purpose through a corner — born on Japan’s mountain passes.' },
  // roads
  { k: 'wangan', ja: '湾岸線', r: 'wangan-sen', tag: 'road', ko: '도쿄만 해안을 따라 요코하마~도쿄~지바를 잇는 수도고 고속도로. 길고 곧은 구간이 많아 “완간”이라 불리며 밤 드라이브의 상징.', jp: '東京湾岸を横浜〜東京〜千葉と結ぶ首都高。長い直線が多く、夜のドライブの象徴。', en: 'The Bayshore Route — the Shutokō expressway along Tokyo Bay from Yokohama to Chiba. Long and straight; the icon of night driving.' },
  { k: 'shutoko', ja: '首都高', r: 'shutokō', tag: 'road', ko: '수도고속도로. 도쿄·가나가와를 거미줄처럼 잇는 도시 고속도로로 대부분 고가 위를 달린다.', jp: '首都高速道路。東京・神奈川を網の目のように結ぶ都市高速。ほとんどが高架。', en: 'Shuto Expressway — the web of urban motorways over Tokyo and Kanagawa, mostly on viaducts.' },
  { k: 'c1', ja: '都心環状線', r: 'toshin kanjō-sen', tag: 'road', ko: '도쿄 도심을 한 바퀴 도는 C1 루프. 터널·급커브가 이어지는 수도고의 심장.', jp: '東京都心を一周するC1。トンネルと急カーブが続く首都高の心臓。', en: 'The C1 inner loop around central Tokyo — tunnels and tight bends, the heart of the Shutokō.' },
  { k: 'pa', ja: 'PA', r: 'pākingu eria', tag: 'road', ko: '파킹 에어리어(휴게소). 고속도로 안의 주차장·편의점·화장실. 다이코쿠 PA는 밤마다 차 모임이 열리는 성지.', jp: 'パーキングエリア。高速道路内の駐車場・売店・トイレ。大黒PAは夜のクルマ好きの聖地。', en: 'Parking Area — a rest stop inside the expressway with toilets and a shop. Daikoku PA is the night-time car-meet mecca.' },
  { k: 'jct', ja: 'JCT', r: 'jankushon', tag: 'road', ko: '분기점. 고속도로끼리 갈라지거나 합쳐지는 곳.', jp: 'ジャンクション。高速道路同士が分かれたり合流したりする所。', en: 'Junction — where two expressways split or merge.' },
  { k: 'etc', ja: 'ETC', r: 'ī-tī-shī', tag: 'road', ko: '자동 요금 징수 시스템(하이패스). 톨게이트를 서지 않고 통과한다.', jp: '自動料金収受システム。料金所を止まらずに通過できる。', en: 'Electronic Toll Collection — drive through the toll gate without stopping.' },
  { k: 'touge', ja: '峠', r: 'tōge', tag: 'road', ko: '산고개 길. 굽은 길이 이어져 드라이브와 드리프트의 무대가 된다(하코네 턴파이크 등).', jp: '山の峠道。カーブが続き、ドライブやドリフトの舞台に（箱根ターンパイクなど）。', en: 'A mountain pass road — corner after corner, the home of drives and drifting (e.g. the Hakone Turnpike).' },
  { k: 'hijouchuusha', ja: '非常駐車帯', r: 'hijō chūsha-tai', tag: 'road', ko: '비상주차대. 고장·사고 때 잠시 세우는 갓길 공간.', jp: '故障や事故のときに一時的に止める路肩のスペース。', en: 'Emergency bay — a widened shoulder to stop in a breakdown.' },
  { k: 'kosen', ja: '車線規制', r: 'shasen kisei', tag: 'road', ko: '공사로 차로 하나를 막는 것. 라바콘과 화살표 트럭을 보면 미리 차선을 바꾸자.', jp: '工事で車線を閉鎖すること。コーンと矢印板車を見たら早めに車線変更。', en: 'Lane closure for road works — see the cones and the arrow truck, move over early.' },
  // cars
  { k: 'kei', ja: '軽自動車', r: 'kei-jidōsha', tag: 'car', ko: '경차. 길이 3.4m·배기량 660cc 이하의 일본 규격 차. 노란 번호판.', jp: '全長3.4m・排気量660cc以下の日本独自の規格。黄色ナンバー。', en: 'Kei car — Japan’s tiny-car class (≤3.4 m long, ≤660 cc). Yellow number plates.' },
  { k: 'keitora', ja: '軽トラ', r: 'kei-tora', tag: 'car', ko: '경트럭. 시골과 밭의 필수품(캐리·하이젯·액티).', jp: '軽トラック。田舎と畑の必需品（キャリイ・ハイゼット・アクティ）。', en: 'Kei truck — the essential of every farm and village (Carry, Hijet, Acty).' },
  { k: 'jdm', ja: 'JDM', r: 'jē-dī-emu', tag: 'car', ko: '일본 내수용 차(Japanese Domestic Market). 넓게는 일본 차 문화 전체.', jp: '日本国内仕様（Japanese Domestic Market）。広く日本の車文化全体。', en: 'Japanese Domestic Market — cars built for Japan, and by extension Japanese car culture.' },
  { k: 'turbo', ja: 'ターボ', r: 'tābo', tag: 'car', ko: '배기가스로 공기를 밀어 넣어 출력을 높이는 장치. “부스트” 게이지가 오른다.', jp: '排気で空気を押し込み出力を上げる装置。ブースト計が上がる。', en: 'Uses exhaust gas to force more air into the engine — watch the boost gauge climb.' },
  { k: 'rotary', ja: 'ロータリー', r: 'rōtarī', tag: 'car', ko: '피스톤 대신 삼각 로터가 도는 마쓰다 엔진(RX-7·RX-8). 고회전이 특기.', jp: 'ピストンの代わりに三角ローターが回るマツダのエンジン（RX-7・RX-8）。', en: 'Mazda’s engine with a spinning triangular rotor instead of pistons (RX-7, RX-8) — loves to rev.' },
  { k: 'drivetrain', ja: 'FF / FR / MR / RR / AWD', r: '', tag: 'car', ko: '엔진 위치와 구동 바퀴. FF=앞엔진 앞바퀴, FR=앞엔진 뒷바퀴(드리프트 향), MR=가운데 엔진, RR=뒤 엔진, AWD=네 바퀴 모두.', jp: 'エンジンの位置と駆動輪。FF=前エンジン前輪、FR=前エンジン後輪、MR=ミッドシップ、RR=リアエンジン、AWD=四輪。', en: 'Engine position and driven wheels: FF front/front, FR front/rear (drift-friendly), MR mid-engine, RR rear-engine, AWD all four.' },
  { k: 'mt', ja: 'MT / AT / DCT', r: '', tag: 'car', ko: 'MT=수동, AT=자동, DCT=듀얼클러치 자동. 설정에서 바꿀 수 있다.', jp: 'MT=マニュアル、AT=オートマ、DCT=デュアルクラッチ。設定で切替。', en: 'MT manual, AT automatic, DCT dual-clutch. Switch in the settings.' },
];
export const STANCE_TERM = { street: null, tsura: 'tsura', shakotan: 'shakotan', vip: 'vip', oni: 'onikyan', drift: 'drift', stock: null, track: 'camber', lift: 'shakochou' };
// road name → term, for the first-time tip when you drive onto it
export const ROAD_TERM = [[/湾岸/, 'wangan'], [/都心環状/, 'c1'], [/ターンパイク|峠/, 'touge'], [/首都高/, 'shutoko']];
export const term = k => GLOSSARY.find(g => g.k === k);
