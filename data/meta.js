// Shared game metadata: version, changelog, regions. Update VERSION + CHANGELOG on every release.
export const GAME = { title: 'MIDNIGHT JAPAN', titleJa: 'ミッドナイト・ジャパン', version: '0.10.0', build: '2026.11.06' };

// Newest first. type: new | change | fix | known
export const CHANGELOG = [
  {
    version: '0.10.0', date: '2026-11-06', codename: 'Touge',
    summary: { ko: '하코네 턴파이크 개통 — 실제 고도 데이터로 만든 산길 13.5km, 정상 다이칸야마 전망 주차장까지.', ja: '箱根ターンパイク開通——実際の標高データで作った山道13.5km、山頂の大観山駐車場まで。', en: 'The Hakone Turnpike opens: 13.5 km of mountain road built from real elevation data, up to the Daikanyama summit car park.' },
    items: [
      { type: "new", ko: "하코네 턴파이크 토우게: 오다와라 요금소(해발 34m)에서 다이칸야마(990m)까지 13.5km — 도로는 OpenStreetMap, 높이·산 지형은 실제 고도 데이터", ja: "箱根ターンパイクの峠道：小田原の料金所（標高34m）から大観山（990m）まで13.5km——道路はOpenStreetMap、高さと山の地形は実際の標高データ", en: "Hakone Turnpike touge: 13.5 km from the Odawara toll gate (34 m) up to Daikanyama (990 m) — road from OpenStreetMap, heights and mountains from real elevation data" },
      { type: "new", ko: "흰 W빔 가드레일·시선유도표, 황색 중앙선(추월 금지), 절토·성토 사면, 삼나무·활엽수 숲, 조명 없는 밤길", ja: "白いガードレールと視線誘導標、黄色の中央線（追越し禁止）、切土・盛土の法面、杉と広葉樹の森、照明のない夜の峠", en: "White W-beam guardrails and delineators, a yellow no-overtaking centre line, cut-and-fill slopes, cedar and broadleaf forest, and no street lights at night" },
      { type: "new", ko: "정상 다이칸야마 주차장(라운지·화장실·자판기·전망 난간·표지), 중턱 전망 주차대, 오다와라 요금소", ja: "山頂の大観山駐車場（ラウンジ・トイレ・自販機・展望の手すり・標識）、中腹の見晴らし駐車帯、小田原料金所", en: "The Daikanyama summit car park (lounge, toilets, vending machines, viewing rail and sign), a viewpoint lay-by half way up, and the Odawara toll gate" },
      { type: "new", ko: "스폰 지점 「하코네 턴파이크」, 지도에서 텔레포트로도 이동 가능", ja: "スポーン地点「箱根ターンパイク」、地図からテレポートでも移動可能", en: "A “Hakone Turnpike” spawn point (and teleport from the map)" }
    ]
  },
  {
    version: '0.9.1', date: '2026-11-06', codename: 'Hill Start',
    summary: { ko: '오르막 출발 버그 수정, NPC 차량 엔진음, 차 위로 점프, 다이코쿠 부두·PA를 실제처럼 채움.', ja: '坂道発進のバグ修正、NPC車のエンジン音、車の上へジャンプ、大黒ふ頭・PAを実際のように。', en: 'Hill-start fix, engine sound for AI cars, jumping onto cars, and a fuller, more lifelike Daikoku-futō and PA.' },
    items: [
      { type: "fix", ko: "오르막에서 출발하면 차가 뒤로 밀리고 자동변속이 후진처럼 동작하던 문제 — 힐 스타트 어시스트와 토크컨버터식 출발 체결", ja: "坂道発進で車が後ろへ下がり、ATが後退のように動いていた問題——ヒルスタートアシストとトルコン式の発進", en: "Hill starts: the car no longer rolls back (hill-start assist) and torque-converter automatics take up drive straight away" },
      { type: "new", ko: "NPC 차량 엔진음: 가까운 차 4대가 공회전·주행 소리를 냄(위치 기반, 과하지 않은 음량)", ja: "NPC車のエンジン音：近くの4台がアイドリングや走行音を出す（位置に応じた控えめな音量）", en: "AI cars now have engine sound — the four nearest idle and drive by audibly, at a sensible volume" },
      { type: "new", ko: "걷는 중 Space로 점프 — 차 지붕 위에 올라설 수 있음", ja: "歩行中にSpaceでジャンプ——車の屋根に乗れる", en: "Jump with Space while walking — you can climb onto car roofs" },
      { type: "change", ko: "다이코쿠 부두: 수출 신차 야드를 6블록에서 최대 40블록으로(차체+유리 형태, 주차선 포함), 부두 포장을 회색 아스팔트로", ja: "大黒ふ頭：輸出車ヤードを6区画から最大40区画に（車体＋ガラスの形、区画線付き）、ふ頭の舗装をグレーのアスファルトに", en: "Daikoku-futō: the export-car yards grow from 6 to up to 40 blocks of car-shaped rows with bay lines, and the quays are paved in grey asphalt" },
      { type: "change", ko: "다이코쿠 PA: 대형 칸은 쉬고 있는 트럭으로 대부분 차고, 일반 차량도 주차장 곳곳에 주차", ja: "大黒PA：大型車枠は休憩中のトラックでほぼ埋まり、一般車も駐車場のあちこちに", en: "Daikoku PA: the big-vehicle bays are mostly taken by resting trucks and ordinary cars are parked all over the lot" }
    ]
  },
  {
    version: '0.9.0', date: '2026-11-06', codename: 'Real Drive',
    summary: {
      ko: '대규모 업데이트 — 차체 파손, 스키드마크·타이어 연기, 내비게이션과 텔레포트, 사고 상대·경찰과의 선택형 대화, 일본식 차선 주행과 시간대별 교통량, 터널 갱문과 표지판, 주유소 165곳, 지명 병기.',
      ja: '大型アップデート——車体の損傷、スキッドマークとタイヤスモーク、ナビとテレポート、事故の相手・警察との選択式の会話、日本式の車線走行と時間帯別の交通量、トンネル坑門と標識、ガソリンスタンド165か所、地名の併記。',
      en: 'A big one: body damage, skid marks and tyre smoke, GPS navigation and teleport, choice-based conversations with other drivers and the police, Japanese lane discipline and traffic that follows the clock, tunnel portals and signs, 165 fuel stations and bilingual place names.'
    },
    items: [
      { type: "new", ko: "차체 파손: 충돌 지점이 실제로 찌그러짐(NPC 차량은 항상, 내 차는 설정에서 켜기/끄기), 일시정지 메뉴 「수리」", ja: "車体の損傷：ぶつけた所が実際にへこむ（NPC車は常に、自分の車は設定でオン／オフ）、ポーズメニューに「修理」", en: "Body damage: panels really dent where you hit (AI cars always; your own car on/off in settings), plus Repair in the pause menu" },
      { type: "new", ko: "스키드마크와 타이어 연기: 드리프트·휠스핀·사이드브레이크·잠긴 바퀴에서 노면에 자국이 남고 연기가 피어오름", ja: "スキッドマークとタイヤスモーク：ドリフト・ホイールスピン・サイドブレーキ・ロックで路面に跡が残り煙が上がる", en: "Skid marks and tyre smoke from drifts, wheelspin, the handbrake and locked wheels" },
      { type: "new", ko: "내비게이션: 지도에서 목적지를 누르면 고속도로망(진행 방향·분기 반영)과 시내 도로(일방통행 반영)로 경로 탐색, 미니맵 경로선·거리·방향 화살표·목적지 빛기둥", ja: "ナビ：地図で目的地を押すと高速道路網（進行方向・分岐）と市街地（一方通行）で経路探索、ミニマップのルート線・距離・矢印・目的地の光の柱", en: "GPS navigation: tap a destination on the map for a route over the expressways (direction and junctions) or city streets (one-way streets), shown on the minimap with distance, a turn arrow and a light beam at the destination" },
      { type: "new", ko: "텔레포트: 지도에서 고른 곳의 가장 가까운 도로로 즉시 이동(일시정지 메뉴 「텔레포트」)", ja: "テレポート：地図で選んだ場所の最寄りの道路へ瞬時に移動（ポーズメニュー「テレポート」）", en: "Teleport to the nearest road at any place you pick on the map (pause menu → Teleport)" },
      { type: "new", ko: "사고 상대와 대화: 기분 게이지, 사과·안부·보험 교환·합의금 협상·상대 탓·뺨 때리기·자리 뜨기 선택지(크고 명확한 카드, 숫자키 1–8)", ja: "事故の相手と会話：機嫌ゲージ、謝罪・気遣い・保険交換・示談金交渉・相手のせい・平手打ち・立ち去るの選択肢（大きく明確なカード、数字キー1–8）", en: "Talk to the other driver after a crash: a mood meter and big, clear choices — apologise, check on them, swap insurance, negotiate a settlement, blame them, slap them or leave (keys 1–8)" },
      { type: "new", ko: "경찰 단속 대화: 면허증 제시·사정 설명·제시 거부·도주 중 선택, 추격 중 경찰 거리·사고 출동 도착 예상 시간·놓쳤을 때 마지막 목격 위치(지도) 표시", ja: "警察の取り締まり：免許証提示・事情説明・提示拒否・逃走を選択、追跡中の距離・事故出動の到着予想・逃げ切った後の最終目撃位置（地図）を表示", en: "Police stops: show your licence, explain, refuse or run; the HUD shows the police distance in a chase, the ETA of a unit coming to your accident, and where they last saw you after you lose them" },
      { type: "new", ko: "터널 입구: 콘크리트 갱문과 터널명 명판, 진입 150m 전 「トンネル内 ライト点灯」「ラジオ再放送 1620kHz」 표지판", ja: "トンネル坑口：コンクリートの坑門とトンネル名の銘板、手前150mに「トンネル内 ライト点灯」「ラジオ再放送 1620kHz」", en: "Tunnel mouths: concrete portals with the tunnel’s name plate, and “Headlights on” / “Tunnel radio 1620 kHz” boards 150 m before each entrance" },
      { type: "new", ko: "주유소 165곳: 실제 위치(OSM)에 조명 캐노피·주유기 아일랜드·가격 표시 기둥, 차로 진입 가능", ja: "ガソリンスタンド165か所：実在の位置（OSM）に照明付きキャノピー・給油機アイランド・価格表示ポール、車で入れる", en: "165 fuel stations at their real (OSM) locations: lit canopies, pump islands and price poles — you can drive in" },
      { type: "new", ko: "지명·도로명을 일본어와 함께 현재 언어로 병기(지도·화면 위치 표시)", ja: "地名・道路名を日本語と現在の言語で併記（地図・画面の現在地表示）", en: "Place and road names shown in Japanese together with your language (map and on-screen location)" },
      { type: "change", ko: "교통: 일본식 주행(왼쪽 주행차로, 오른쪽 추월 후 복귀), 경적을 울리면 앞차가 비켜 줌, 시간대별 교통량(새벽 적고 출퇴근 시간 많음)", ja: "交通：日本式の走り方（左の走行車線、右から追い越して戻る）、クラクションで前の車が譲る、時間帯で交通量が変化（深夜少なく通勤時間に多い）", en: "Traffic: Japanese lane discipline (keep left, overtake on the right and move back), cars move over when you sound the horn, and volume follows the clock (quiet before dawn, busy at rush hour)" },
      { type: "change", ko: "음성: 경찰은 남성 목소리에 확성기 효과, 사고 상대·점원 등은 사람마다 다른 목소리와 높낮이", ja: "音声：警察は男性の声とメガホン効果、事故の相手や店員は人ごとに違う声と高さ", en: "Voices: police in a male voice through a loud-hailer, other drivers and staff each with their own voice and pitch" },
      { type: "change", ko: "어디서든 차량 변경: 멈춘 곳에서 차고를 열고 그 자리에서 바꾼 차로 출발", ja: "どこでも車両変更：止まった場所でガレージを開き、その場で乗り換え", en: "Change cars anywhere: open the garage wherever you have stopped and drive off from the same spot" },
      { type: "fix", ko: "차량과 3D 모델 불일치 수정: S14 실비아, 1세대 86(ZN6), 크라운 택시, H50 하이에이스, 후소 캔터, 후소 로사 — 이름·제원·크기를 실제 모델에 맞춤(트럭·버스 충돌 크기가 모델의 2배이던 문제 포함)", ja: "車種と3Dモデルの不一致を修正：S14シルビア、初代86（ZN6）、クラウンタクシー、H50ハイエース、ふそうキャンター、ふそうローザ——名前・諸元・サイズをモデルに合わせた（トラック・バスの当たり判定がモデルの2倍だった問題含む）", en: "Cars now match their 3D models: S14 Silvia, first-gen 86 (ZN6), Crown taxi, H50 HiAce, Fuso Canter and Fuso Rosa — names, specs and sizes (the truck and bus collision boxes were twice the model size)" },
      { type: "fix", ko: "경찰 사이렌: 긴급 상황(추격·사고 출동)에서만, 그리고 경찰차가 700m 이내일 때만 울림", ja: "パトカーのサイレン：緊急時（追跡・事故出動）だけ、700m以内のときだけ鳴る", en: "Police sirens sound only in an emergency (a chase or an accident call) and only within 700 m" },
      { type: "fix", ko: "AI 차량의 차선 변경 방향지시등이 반대로 켜지던 문제", ja: "AI車の車線変更でウインカーが逆に点いていた問題", en: "AI cars no longer signal the wrong way when changing lanes" },
      { type: "fix", ko: "미니맵에 시내 도로가 표시되지 않던 문제", ja: "ミニマップに市街地の道路が表示されなかった問題", en: "City streets now appear on the minimap" }
    ]
  },
  {
    version: '0.8.1', date: '2026-11-06', codename: 'Pavement',
    summary: {
      ko: '일본 거리다운 회색 보도블록(상점가 일부는 적갈색 블록), 지역 페이지에 K1 요코하마 루프·요코하마 시가지·쓰루미·가와사키·하네다 추가, README·사이트 수치 최신화.',
      ja: '日本の街らしいグレーの歩道ブロック（商店街の一部はえんじ色）、地域ページにK1横浜ループ・横浜市街・鶴見・川崎・羽田を追加、README・サイトの数値を最新に。',
      en: 'Grey interlocking pavements as on most Japanese streets (brown-red blocks on some shopping streets), the K1 Yokohama loop, Yokohama city, Tsurumi & Kawasaki and Haneda on the regions page, and up-to-date figures on the site and README.'
    },
    items: [
      { type: 'change', ko: '시내 인도를 붉은 벽돌에서 일본에서 흔한 회색 사각 보도블록으로 — 거리마다 일부는 적갈색·청회색 블록', ja: '市街地の歩道を赤レンガから日本でよく見るグレーの角形ブロックに——通りによってはえんじ色・青みのグレー', en: 'City pavements switch from red brick to the grey square blocks common in Japan, with brown-red or blue-grey blocks on some streets' },
      { type: 'change', ko: '지역 페이지: 베이브리지 「구현 완료」, K1 요코하마 루프·요코하마 시가지·쓰루미·가와사키·하네다 공항 추가, 지도에 루프 노선 표시', ja: '地域ページ：ベイブリッジを「実装済み」に、K1横浜ループ・横浜市街・鶴見・川崎・羽田空港を追加、地図にループ路線を表示', en: 'Regions page: the Bay Bridge is now complete; the K1 Yokohama loop, Yokohama city, Tsurumi & Kawasaki and Haneda Airport are added, with the loop drawn on the map' },
      { type: 'change', ko: '사이트 소개·특징·README의 도시 수치를 최신으로(건물 42만 채, 도로 5만 3천 개), README에 K1 루프·날씨·하네다 소개 추가', ja: 'サイト紹介・特徴・READMEの街の数値を最新に（建物42万棟、道路5万3千本）、READMEにK1ループ・天気・羽田の紹介を追加', en: 'City figures on the site and README updated (421,000 buildings, 53,000 streets); the README now introduces the K1 loop, weather and Haneda' },
    ]
  },
  {
    version: '0.8.0', date: '2026-11-06', codename: 'Yokohama Loop',
    summary: {
      ko: '요코하마 루프 개통 — 다이코쿠 JCT에서 K5를 타고 나마무기 JCT로, K1 요코하네선으로 요코하마역·미나토미라이를 지나 지하로 내려간 뒤, K3 가리바선과 혼모쿠 JCT를 거쳐 베이브리지로 돌아오는 약 17km의 실제 수도고 루프를 달릴 수 있어요.',
      ja: '横浜ループ開通——大黒JCTからK5で生麦JCTへ、K1横羽線で横浜駅・みなとみらいを抜けて地下へ潜り、K3狩場線と本牧JCTを経てベイブリッジへ戻る約17kmの実在の首都高ループを走れる。',
      en: 'The Yokohama loop opens: from Daikoku JCT take the K5 to Namamugi JCT, the K1 Yokohane Line past Yokohama Station and Minato Mirai and down underground, then the K3 Kariba Line and Honmoku JCT back over the Bay Bridge — about 17 km of real Shuto expressway.'
    },
    items: [
      { type: 'new', ko: 'K5 대황선 전 구간(다이코쿠 JCT ↔ 나마무기 JCT), K1 요코하네선 9km(요코하마역 앞 고가, 이시카와초 지하 구간), K3 가리바선 2.5km, 나마무기·이시카와초 JCT 연결로 — 모두 OpenStreetMap 실제 노선', ja: 'K5大黒線の全区間（大黒JCT↔生麦JCT）、K1横羽線9km（横浜駅前の高架、石川町の地下区間）、K3狩場線2.5km、生麦・石川町JCTの連絡路——すべてOpenStreetMapの実在路線', en: 'The whole K5 Daikoku Line (Daikoku JCT ↔ Namamugi JCT), 9 km of the K1 Yokohane Line (the viaduct past Yokohama Station and the underground section at Ishikawachō), 2.5 km of the K3 Kariba Line and the Namamugi / Ishikawachō junction ramps, all from real OpenStreetMap routes' },
      { type: 'new', ko: '스폰 지점 「K1 요코하마 루프」, 분기점 노면 행선지 표시(横浜·大黒·本牧), 루프를 따라 달리는 고속도로 교통', ja: 'スポーン地点「K1横浜ループ」、分岐の路面行き先表示（横浜・大黒・本牧）、ループを走る高速道路の交通', en: 'A "K1 Yokohama Loop" spawn point, painted destinations at the new junctions (Yokohama, Daikoku, Honmoku) and expressway traffic that follows the loop' },
      { type: 'change', ko: '도시를 새 루프 주변까지 확장: 건물 42만 채, 도로 5만 3천 개, 타일 504개', ja: '街を新しいループの周囲まで拡張：建物42万棟、道路5万3千本、504タイル', en: 'The city now also surrounds the new loop: 421,000 buildings, 53,000 streets, 504 tiles' },
      { type: 'fix', ko: '터널·지하 구간에 벽 충돌이 없어 차로를 벗어나면 차가 지상으로 튀어 오르던 문제(만안선 해저터널 포함)', ja: 'トンネル・地下区間に壁の当たり判定がなく、車線を外れると車が地上へ飛び出していた問題（湾岸線の海底トンネル含む）', en: 'Tunnels and underground sections had no wall collisions, so leaving the carriageway popped the car up to the surface (including the Bayshore undersea tunnels)' },
      { type: 'fix', ko: 'AI 차량이 끝과 시작이 맞닿은 도로(램프→본선)에서 65% 확률로 사라지던 문제', ja: 'AI車両が終点と始点が接する道路（ランプ→本線）で65%の確率で消えていた問題', en: 'AI cars vanished 65% of the time where one road ends exactly where the next begins (ramp → main line)' },
      { type: 'fix', ko: '분기점에서 달릴 수 없는 장식용 고가(K2 등)와 반대 차로 고가의 가로등이 주행 차로를 막거나 뚫고 나오던 문제', ja: '分岐部で走れない装飾用の高架（K2など）や反対車線の高架の街灯が走行車線をふさいだり突き抜けたりしていた問題', en: 'Decorative (non-drivable) viaducts such as the K2 at junctions, and the street lights of the opposite carriageway, no longer block or poke through the lanes you drive on' },
      { type: 'fix', ko: '지붕 없는 지하 진입 구간에서 바다 수면이 비쳐 차가 가려지던 문제', ja: '屋根のない地下への進入区間で海面が映り込み、車が隠れていた問題', en: 'In open cuttings below ground level the sea surface showed across the road and hid the car' },
    ]
  },
  {
    version: '0.7.2', date: '2026-11-06', codename: 'Umbrella',
    summary: {
      ko: '비 오는 날 보행자들이 우산을 써요(투명 편의점 우산이 가장 많아요). 달리는 중에 하차 키를 누르면 안내가 나와요.',
      ja: '雨の日は歩行者が傘をさす（いちばん多いのはコンビニのビニール傘）。走行中に降車キーを押すと案内が出る。',
      en: 'Pedestrians put up umbrellas when it rains (clear konbini umbrellas are the most common), and pressing the exit key while moving now tells you to stop first.'
    },
    items: [
      { type: 'new', ko: '비 오는 날 보행자 우산 — 투명 비닐우산과 검정·남색·버건디·녹색 우산', ja: '雨の日の歩行者の傘——透明のビニール傘と黒・紺・えんじ・緑の傘', en: 'Umbrellas for pedestrians in the rain: clear plastic ones plus black, navy, burgundy and green' },
      { type: 'fix', ko: '주행 중 F(하차)를 누르면 아무 반응이 없던 문제 — "멈춘 뒤에 내릴 수 있어요" 안내 표시(20개 언어)', ja: '走行中にF（降車）を押しても無反応だった問題——「停車してから降りてください」と表示（20言語）', en: 'Pressing F (get out) while moving did nothing; it now shows "Stop the car to get out" (20 languages)' },
    ]
  },
  {
    version: '0.7.1', date: '2026-11-06', codename: 'Shakedown',
    summary: {
      ko: '버그 수정 — PA에서 시작하면 바로 출발할 수 있고, 여객기 자세·전철 정차·보행자 회피가 자연스러워졌어요.',
      ja: 'バグ修正——PAからすぐ発進でき、旅客機の姿勢・電車の停車・歩行者の回避が自然に。',
      en: 'Bug fixes: you can drive straight off from the PA, and airliner attitude, train stops and pedestrians stepping aside now behave properly.'
    },
    items: [
      { type: 'fix', ko: 'PA 스폰: 앞차 줄을 보고 주차된 채 시작해 앞으로 나갈 수 없던 문제 — 일본식으로 후진 주차된 상태(앞이 통로 쪽)로 시작', ja: 'PAスポーン：前の列に向いて停まった状態で始まり前進できなかった問題——日本式のバック駐車（前が通路側）で開始', en: 'PA spawn: you started nose-in against the next row and could not drive forward — you now start backed in, nose to the aisle, as people park in Japan' },
      { type: 'fix', ko: '여객기: 남북 이외 방향의 활주로에서 이착륙할 때 기체가 옆으로 기울던 문제', ja: '旅客機：南北以外の滑走路で離着陸すると機体が横に傾いていた問題', en: 'Airliners: planes on runways not aligned north–south rolled sideways instead of pitching on take-off and landing' },
      { type: 'fix', ko: '여객기를 지울 때 형상·재질을 해제해 장시간 플레이 시 메모리가 늘던 문제', ja: '旅客機を消すときに形状・マテリアルを解放し、長時間プレイでメモリが増えていた問題を修正', en: 'Airliners now free their geometry and materials when removed, so memory no longer grows over long sessions' },
      { type: 'fix', ko: '전철: 옆 노선의 역 근처를 지날 때 이유 없이 감속하던 문제', ja: '電車：隣の路線の駅の近くを通るときに理由なく減速していた問題', en: 'Trains: they no longer slow down for stations on a neighbouring line' },
      { type: 'fix', ko: '보행자: 다가오는 차를 피해 비켜서는 동작이 실제로 보이도록 수정(이후 인도로 복귀)', ja: '歩行者：近づく車を避けて脇によける動きが実際に見えるよう修正（その後歩道へ戻る）', en: 'Pedestrians: stepping aside for an approaching car now actually shows, and they drift back onto the pavement afterwards' },
    ]
  },
  {
    version: '0.7.0', date: '2026-11-06', codename: 'Downpour',
    summary: {
      ko: '날씨가 생겼어요 — 비 오는 밤의 젖은 노면이 불빛을 반사하고, 그립이 줄고, 빗소리가 들려요. 도시는 고속도로 주변 5km(건물 35만 8천 채)로 넓어졌어요.',
      ja: '天気が登場——雨の夜、濡れた路面が灯りを映し、グリップが落ち、雨音が聞こえる。街は高速道路の周囲5km（建物35万8千棟）に拡大。',
      en: 'Weather arrives: on rainy nights the wet asphalt mirrors the lights, grip drops and you hear the rain. The city now reaches 5 km around the expressways (358,000 buildings).'
    },
    items: [
      { type: 'new', ko: '날씨: 자동(변화)·맑음·흐림·비 — 카메라 주변 빗줄기, 짙어지는 회색 안개, 흐린 하늘과 약해지는 햇빛', ja: '天気：自動（変化）・晴れ・くもり・雨——カメラ周囲の雨筋、濃くなる灰色の霧、曇り空と弱まる日差し', en: 'Weather: automatic, clear, cloudy or rain — rain streaks around the camera, thicker grey fog, overcast skies and weaker sunlight' },
      { type: 'new', ko: '젖은 노면: 도로·보도·지면이 젖으면 광택이 생겨 가로등과 헤드라이트를 반사하고, 비가 그친 뒤에도 한동안 젖어 있음', ja: '濡れた路面：道路・歩道・地面が濡れると艶が出て街灯やヘッドライトを映し、雨が止んでもしばらく濡れたまま', en: 'Wet roads: asphalt, pavements and ground turn glossy and reflect street lights and headlights, and stay wet for a while after the rain' },
      { type: 'new', ko: '비 오는 날 타이어 그립 약 20% 감소, 빗소리(차 안에서는 지붕 두드리는 소리)', ja: '雨の日はタイヤのグリップが約20%低下、雨音（車内では屋根を叩く音）', en: 'About 20% less tyre grip in the wet; the sound of rain (drumming on the roof from inside the car)' },
      { type: 'change', ko: '도시 범위를 고속도로 주변 3.2km → 5km로 확장: 건물 35만 8천 채, 도로 4만 5천 개, 철도 2,300개 노선', ja: '街の範囲を高速道路の周囲3.2km→5kmに拡大：建物35万8千棟、道路4万5千本、鉄道2,300路線', en: 'The city now reaches 5 km (was 3.2 km) around the expressways: 358,000 buildings, 45,000 streets, 2,300 rail lines' },
    ]
  },
  {
    version: '0.6.1', date: '2026-11-06', codename: 'Faces',
    summary: {
      ko: '사람 얼굴 조형, 실제 3D 모델만 쓰는 NPC 차량, 기본 그래픽(높음)에서 프레임 약 35% 향상.',
      ja: '人の顔の造形、実車3DモデルだけのNPC車両、標準グラフィック（高）でフレームレート約35%向上。',
      en: 'Sculpted faces, NPC traffic made only of real 3D car models, and about 35% more frames on the default High setting.'
    },
    items: [
      { type: 'change', ko: '사람 얼굴: 콧대·코끝·눈두덩·광대·입술·턱을 머리 형태에 조형하고 머리 해상도 6배', ja: '人の顔：鼻筋・鼻先・眉骨・頬骨・唇・顎を頭部の形状に造形し、頭部の解像度を6倍に', en: 'Faces: nose bridge and tip, brow ridge, eye sockets, cheekbones, lips and chin are sculpted into the head, at six times the head resolution' },
      { type: 'change', ko: '고속도로·시내·PA의 NPC 차량을 실제 3D 모델이 있는 차종으로만 구성(택시·크라운·리프·하이에이스·트럭·버스 등)', ja: '高速道路・市街地・PAのNPC車両を実車3Dモデルのある車種だけで構成（タクシー・クラウン・リーフ・ハイエース・トラック・バスなど）', en: 'NPC cars on the expressways, in the city and at the PA now use only cars with real 3D models (taxis, Crown, Leaf, HiAce, trucks, buses …)' },
      { type: 'change', ko: '앰비언트 오클루전(GTAO)을 울트라 전용으로 — 높음 품질에서 프레임 약 35% 향상', ja: 'アンビエントオクルージョン（GTAO）をウルトラ専用に——高品質でフレームレート約35%向上', en: 'Ambient occlusion (GTAO) is now Ultra-only — about 35% more frames on High' },
      { type: 'fix', ko: '여객기 항법등·충돌방지등이 날개 끝에 오도록 수정', ja: '旅客機の航法灯・衝突防止灯を翼端に修正', en: 'Airliner nav and strobe lights sit on the wingtips' },
    ]
  },
  {
    version: '0.6.0', date: '2026-11-06', codename: 'Rush Hour',
    summary: {
      ko: '도시가 움직이기 시작했어요 — 실제 노선을 달리는 전철, 인도를 걷는 사람들, 하네다 공항에 내리고 뜨는 여객기, 걸어 들어갈 수 있는 PA 실내.',
      ja: '街が動き出す——実際の路線を走る電車、歩道を歩く人々、羽田空港に離着陸する旅客機、歩いて入れるPAの屋内。',
      en: 'The city comes alive: trains on the real lines, people on the sidewalks, airliners landing and taking off at Haneda, and walk-in PA interiors.'
    },
    items: [
      { type: 'new', ko: '전철: OpenStreetMap의 실제 철도 노선을 따라 4~10량 편성이 달리고(타일 경계를 넘어 연속 주행), 역에서 정차, 밤에는 객실 조명, 가까이 지나가면 철로 소리', ja: '電車：OpenStreetMapの実際の路線に沿って4〜10両編成が走り（タイル境界を越えて連続走行）、駅で停車、夜は車内灯、近くを通ると走行音', en: 'Trains: 4–10 car sets run along the real OpenStreetMap rail lines (seamlessly across tiles), stop at stations, light up at night and rumble past' },
      { type: 'new', ko: '보행자: 시내 인도를 따라 걷고 교차로에서 방향을 바꾸며, 밤에는 줄어들고 다가오는 차를 피함', ja: '歩行者：市街地の歩道を歩き、交差点で曲がり、夜は少なくなり、近づく車を避ける', en: 'Pedestrians walk the city sidewalks, turn at junctions, thin out late at night and step aside for cars' },
      { type: 'new', ko: '하네다 공항: 실제 활주로·유도로(표시선·끝단 줄무늬·활주로등·청색 유도로등), 계류장, 510개 실제 주기장 중 가까운 곳에 여객기, 3° 진입각 착륙과 이륙(착륙등·충돌방지등·항법등, 제트 소음), 하네다 스폰', ja: '羽田空港：実際の滑走路・誘導路（標識・末端標識・滑走路灯・青い誘導路灯）、エプロン、実在の510スポットのうち近くに旅客機、3°の進入角での着陸と離陸（着陸灯・衝突防止灯・航法灯、ジェット音）、羽田スポーン', en: 'Haneda Airport: the real runways and taxiways (markings, threshold bars, edge lights, blue taxiway lights), aprons, airliners at the nearest of 510 real stands, 3° approaches and take-offs with landing, strobe and nav lights and jet noise; Haneda spawn' },
      { type: 'new', ko: 'PA 실내: 푸드코트(식권 발매기·조명 메뉴판·호출 번호판·주방·급수기·교통정보 TV·창가 스툴), 화장실(칸·소변기·세면대·거울), 하이웨이 정보 코너(노선 지도·기념품)', ja: 'PAの屋内：フードコート（食券機・電照メニュー・呼び出し番号表示・厨房・給水機・交通情報TV・窓際の椅子）、トイレ（個室・小便器・洗面台・鏡）、ハイウェイ情報コーナー（路線図・お土産）', en: 'PA interiors: food court (meal-ticket machine, lit menu board, call-number display, kitchen, water station, traffic-info TV, window stools), toilets (stalls, urinals, sinks, mirrors), highway info corner (route map, souvenirs)' },
      { type: 'change', ko: '실내에 들어가면 조명이 따라와 밝아짐', ja: '屋内に入ると照明が追従して明るく', en: 'Interior lights follow you inside' },
    ]
  },
  {
    version: '0.5.0', date: '2026-11-06', codename: 'Metropolis',
    summary: {
      ko: '고속도로 밖으로 — OpenStreetMap 실제 데이터로 만든 요코하마·가와사키 시가지 전체(건물 23만 6천 채)를 달릴 수 있게 됐어요. 신호를 지키는 시내 교통, 랜드마크, 튜닝 프리셋, 도시 환경음까지.',
      ja: '高速道路の外へ——OpenStreetMapの実データで作った横浜・川崎の市街地（建物23万6千棟）を走れるように。信号を守る市街地交通、ランドマーク、チューニングプリセット、街の環境音まで。',
      en: 'Off the expressway: the whole of Yokohama and Kawasaki around the routes — 236,000 real buildings from OpenStreetMap — is now drivable, with city traffic that obeys the signals, landmarks, tuning presets and a city soundscape.'
    },
    items: [
      { type: 'new', ko: '실제 도시: OpenStreetMap의 건물 23만 6천 채·도로 2만 7천 개·철도 1,500개 노선·하천·공원을 1km 타일로 스트리밍(백그라운드 워커, 3단계 LOD) — 고속도로 주변 3.2km가 전부 실제 지형', ja: '本物の街：OpenStreetMapの建物23万6千棟・道路2万7千本・鉄道1,500路線・河川・公園を1kmタイルでストリーミング（バックグラウンドワーカー、3段階LOD）——高速道路の周囲3.2kmがすべて実在の地形', en: 'A real city: 236,000 buildings, 27,000 streets, 1,500 rail lines, rivers and parks from OpenStreetMap stream in as 1 km tiles (background workers, three levels of detail) — everything within 3.2 km of the expressways is the real place' },
      { type: 'new', ko: '일본식 건축 자동 생성: 기와 박공·우진각 지붕 주택, 발코니·외부 복도·엘리베이터실이 있는 맨션, 1층 상점과 간판·차양, 편의점(주차장·폴사인), 공장·창고·저장탱크·굴뚝, 붉은 벽돌 창고', ja: '日本の建築を自動生成：瓦の切妻・寄棟屋根の住宅、バルコニー・外廊下・エレベーター塔のあるマンション、1階の店舗と看板・テント、コンビニ（駐車場・ポールサイン）、工場・倉庫・タンク・煙突、赤レンガ倉庫', en: 'Japanese architecture, generated per building: houses with tiled gable/hip roofs, mansions with balconies, open corridors and lift towers, ground-floor shops with signs and awnings, konbini with car parks and pole signs, factories, warehouses, tanks and stacks, red-brick warehouses' },
      { type: 'new', ko: '거리 디테일: 전봇대와 전선, 블록 담장과 대문, 자판기, 가로등, 가드레일, 가로수, 횡단보도·정지선, 실제로 바뀌는 신호등(보행자 신호 포함), 고가 수도고 노선, 고가·지상 철도, 하천 제방', ja: '街のディテール：電柱と電線、ブロック塀と門、自販機、街灯、ガードレール、街路樹、横断歩道・停止線、実際に切り替わる信号機（歩行者用も）、高架の首都高、高架・地上の鉄道、河川の護岸', en: 'Street detail: utility poles and wires, block walls and gates, vending machines, street lights, guard rails, street trees, zebra crossings and stop lines, working traffic lights (with pedestrian signals), elevated Shuto routes, elevated and ground-level railways, river embankments' },
      { type: 'new', ko: '창문 셰이더: 알루미늄 새시·커튼·반투명 욕실창·덧문 박스, 밤에는 집집마다 다른 불빛, 멀리서는 깜빡임 없이 부드럽게', ja: '窓シェーダー：アルミサッシ・カーテン・すりガラスの浴室窓・雨戸の戸袋、夜は家ごとに違う明かり、遠くはちらつかず滑らかに', en: 'Window shader: aluminium sashes, curtains, frosted bathroom windows, shutter boxes; every home lit differently at night, and no shimmer in the distance' },
      { type: 'new', ko: '시내 교통: NPC 차량이 실제 도로망을 좌측통행으로 달리며 교차로에서 방향을 고르고, 앞차를 따라가며, 신호등 주기에 맞춰 정지·출발(방향지시등 포함)', ja: '市街地交通：NPC車両が実際の道路網を左側通行で走り、交差点で進路を選び、前の車に続き、信号のサイクルに合わせて停止・発進（ウインカー付き）', en: 'City traffic: NPC cars drive the real street network on the left, pick turns at junctions, queue behind each other and stop and go with the signal cycle (with indicators)' },
      { type: 'new', ko: '랜드마크: 실제 위치의 코스모클록21(곤돌라 60대, 게임 시각을 보여주는 디지털 시계), 요코하마 마린타워 격자 구조, 야마시타 공원의 히카와마루, 실제 높이의 랜드마크 타워·퀸즈스퀘어', ja: 'ランドマーク：実際の位置のコスモクロック21（ゴンドラ60基、ゲーム内時刻を表示するデジタル時計）、横浜マリンタワーの格子構造、山下公園の氷川丸、実際の高さのランドマークタワー・クイーンズスクエア', en: 'Landmarks: Cosmo Clock 21 at its real spot (60 gondolas, a digital clock showing the in-game time), the lattice Yokohama Marine Tower, the Hikawa Maru at Yamashita Park, and Landmark Tower and Queen\'s Square at their real heights' },
      { type: 'new', ko: '튜닝: 순정·스트리트·그립·드리프트·완간·토우게 프리셋 + 출력·경량화·타이어 5종·최종감속비·제동력·브레이크 배분·핸들링 밸런스·다운포스·조향각', ja: 'チューニング：ノーマル・ストリート・グリップ・ドリフト・湾岸・峠のプリセット＋出力・軽量化・タイヤ5種・ファイナル・ブレーキ力・配分・ハンドリングバランス・ダウンフォース・切れ角', en: 'Tuning: Stock, Street, Grip, Drift, Wangan and Touge presets plus power, weight reduction, five tyre compounds, final drive, brake force and bias, handling balance, downforce and steering lock' },
      { type: 'new', ko: '도시 환경음: 시가지의 웅성거림, 보행자 신호에 맞춰 울리는 "삐요삐요"·"뻐꾹" 안내음, 낮의 까마귀, 멀리 지나가는 전철', ja: '街の環境音：市街地のざわめき、歩行者信号に合わせて鳴る「ピヨピヨ」「カッコー」、昼のカラス、遠くを通る電車', en: 'City soundscape: the hum of the streets, crossing chimes ("piyo-piyo" / cuckoo) in time with the walk signals, crows by day, trains passing in the distance' },
      { type: 'new', ko: '시내 스폰 지역 추가: 미나토미라이·차이나타운·모토마치·쓰루미·가와사키, 정차 후 시내 어디서든 하차해 걷기', ja: '市街地のスポーン地点を追加：みなとみらい・中華街・元町・鶴見・川崎、停車すれば街のどこでも降りて歩ける', en: 'New city spawn points: Minato Mirai, Chinatown–Motomachi, Tsurumi, Kawasaki; stop anywhere in the city and walk' },
      { type: 'change', ko: '고속도로 교통량 1.5배(품질별 28~112대), 멀리 있는 차량을 플레이어 주변으로 재배치해 항상 붐비게', ja: '高速道路の交通量1.5倍（品質別28〜112台）、遠くの車をプレイヤーの周囲へ再配置して常に賑やかに', en: '1.5x expressway traffic (28–112 cars by quality); cars far away are moved near you so the road always feels busy' },
      { type: 'fix', ko: '멀리 있는 지면이 바다와 겹쳐 보이던 깊이 정밀도 문제 수정, 거대한 해안선 다각형 대신 타일별 지면', ja: '遠くの地面が海と重なって見えた深度精度の問題を修正、巨大な海岸線ポリゴンの代わりにタイル別の地面', en: 'Fixed distant ground z-fighting with the sea (depth precision); ground is now built per tile instead of one huge coastline polygon' },
    ]
  },
  {
    version: '0.4.0', date: '2026-11-06', codename: 'Roadside',
    summary: {
      ko: '도로와 수평으로 기우는 차체, 교통량 2배, 고속도로 위 하차, 방음벽·시선유도표, 세월이 묻은 도시, 세밀한 지명, 인쇄물까지 그린 편의점, 실제 버전에 맞춘 로드맵.',
      ja: '路面に沿って傾く車体、交通量2倍、高速道路上での降車、防音壁・視線誘導標、年季の入った街並み、詳しい地名、印刷物まで描いたコンビニ、実際の版に合わせたロードマップ。',
      en: 'Cars sit level with the road, twice the traffic, step out on the expressway, noise barriers and delineators, a weathered city, detailed place names, a konbini with printed goods, and a roadmap that matches the real releases.'
    },
    items: [
      { type: 'fix', ko: '오르막·내리막·편경사에서 차체가 도로면과 평행하게 기울도록 수정(동서 방향 경사에서 차가 옆으로 기울던 회전 순서 버그), 차가 노면 아래로 가라앉지 않게 접지 보정, NPC 차량도 경사에 맞춰 기울어짐', ja: '上り・下り・横断勾配で車体が路面と平行に傾くよう修正（東西方向の坂で車が横に傾いていた回転順のバグ）、車が路面に沈まないよう接地を補正、NPC車両も勾配に合わせて傾く', en: 'Bodies now pitch and roll with the road on climbs, descents and camber (fixed a rotation-order bug that tilted cars sideways on east–west slopes); cars never sink below the surface; NPC cars pitch with the grade too' },
      { type: 'new', ko: '정차하면 갓길·고가도로 위 어디서든 하차해 노면 위를 걸을 수 있음', ja: '停車すれば路肩でも高架の上でも降車して路面を歩ける', en: 'Stop anywhere — shoulder or elevated expressway — and step out to walk on the deck' },
      { type: 'change', ko: 'NPC 교통량 약 2배(품질별 18~76대), 내 주변 고속도로 전체에 차량이 생성', ja: 'NPC交通量を約2倍（品質別18〜76台）、周囲の高速道路全体に車両が出現', en: 'About twice the NPC traffic (18–76 cars by quality), spawning on every expressway around you' },
      { type: 'new', ko: '수도고식 방음벽(아연도금 하부 패널+안쪽으로 휜 투명 아크릴, H형 지주 4m 간격)을 육상 고가 구간에, 방호벽 위 시선유도표(좌측 흰색·우측 주황) 10m 간격', ja: '首都高型の防音壁（亜鉛めっき下部パネル＋内側に曲がる透明アクリル、H形支柱4m間隔）を陸上の高架区間に、防護柵上に視線誘導標（左白・右橙）を10m間隔で', en: 'Shuto-style noise barriers (galvanised lower panel, inward-curving clear acrylic, H-posts every 4 m) on elevated sections over land; delineators every 10 m (white left, amber right)' },
      { type: 'new', ko: '도시 풍화 표현: 빗물 자국·그을음·하단 습기 얼룩을 건물·교각·방호벽·스카이라인에', ja: '街の経年表現：雨だれ・煤・足元の湿り染みを建物・橋脚・防護柵・スカイラインに', en: 'Weathering: rain streaks, soot and damp bases on buildings, piers, parapets and the skyline' },
      { type: 'new', ko: '세밀한 지명 59곳(나마무기·末広町·扇島·浮島町·大井ふ頭 등): HUD에 "노선 · 지명", 전체 지도에 확대 단계별 표시', ja: '詳しい地名59か所（生麦・末広町・扇島・浮島町・大井ふ頭など）：HUDに「路線・地名」、全体マップに拡大段階ごとに表示', en: '59 detailed place names (Namamugi, Suehiro-chō, Ōgishima, Ukishima-chō, Ōi Wharf…): "route · place" on the HUD and zoom-dependent labels on the full map' },
      { type: 'new', ko: '편의점: 상품명·용량·가격이 인쇄된 포장(3개씩 진열), 잡지 표지·신문, 선반 가격표(세금 포함가)', ja: 'コンビニ：商品名・容量・価格を印刷したパッケージ（3フェイス陳列）、雑誌の表紙・新聞、棚の値札（税込価格）', en: 'Konbini: packaging printed with names, sizes and prices (faced in threes), magazine covers and a newspaper, shelf price tags with tax-in prices' },
      { type: 'change', ko: '웹사이트 로드맵을 실제 출시 내용에 맞게 정리: 0.3 출시됨, 0.4 현재, 0.5 C1·랜드마크 정밀 모델', ja: 'サイトのロードマップを実際のリリースに合わせて整理：0.3リリース済み、0.4現在、0.5でC1・ランドマーク精密モデル', en: 'Website roadmap now matches the real releases: 0.3 released, 0.4 now, 0.5 C1 and detailed landmark models' },
    ]
  },
  {
    version: '0.3.5', date: '2026-11-06', codename: 'Polish',
    summary: {
      ko: '버그·경고 정리와 웹사이트·GitHub 페이지 리뉴얼.',
      ja: 'バグと警告の整理、サイトとGitHubページの刷新。',
      en: 'Bug and warning clean-up, refreshed website and GitHub page.'
    },
    items: [
      { type: 'fix', ko: '게임 실행 중 콘솔 경고 740여 건 제거(지오메트리 병합), 표지판 텍스처 갱신 오류 수정', ja: 'ゲーム中のコンソール警告約740件を解消（ジオメトリ結合）、標識テクスチャ更新の不具合を修正', en: 'Removed ~740 console warnings during play (geometry merging) and fixed a sign-texture update error' },
      { type: 'change', ko: '웹사이트: 로드맵 5단 레이아웃(혼자 떨어지던 카드 수정), 카드 호버·포커스 표시·스크롤 다듬기, 스크린샷 색감·캡션 가독성 개선', ja: 'サイト：ロードマップを5列レイアウトに（はみ出たカードを修正）、カードのホバー・フォーカス表示・スクロールを改善、スクリーンショットの色味とキャプションの読みやすさを向上', en: 'Website: five-column roadmap (no more orphaned card), refined card hover, focus rings and scrolling, richer screenshots with readable captions' },
      { type: 'change', ko: 'GitHub 소개 페이지 리뉴얼: 히어로 이미지, 플레이 버튼, 최근 업데이트 표, 스크린샷 특징 그리드, 영어 소개 갱신', ja: 'GitHub紹介ページを刷新：ヒーロー画像、プレイボタン、最近の更新表、スクリーンショット付き特徴グリッド、英語紹介を更新', en: 'GitHub page renewed: hero image, play button, recent-updates table, screenshot feature grid, updated English intro' },
    ]
  },
  {
    version: '0.3.4', date: '2026-11-06', codename: 'Full Map',
    summary: {
      ko: '확대·축소·이동되는 전체 지도, 바퀴마다 움직이는 서스펜션, 로드맵 갱신, GitHub 소개 페이지 리뉴얼.',
      ja: '拡大・縮小・移動できる全体マップ、4輪それぞれが動くサスペンション、ロードマップ更新、GitHub紹介ページを刷新。',
      en: 'A zoomable, pannable full map, per-wheel suspension, an updated roadmap and a renewed GitHub page.'
    },
    items: [
      { type: 'new', ko: '전체 지도(M 키 또는 미니맵 클릭): 휠·핀치로 확대/축소, 드래그로 이동, 내 위치·전체 보기 버튼, 육지·건물·도로 이름·랜드마크·교통 표시, 최대 확대 시 차선까지, 축척 막대', ja: '全体マップ（Mキーまたはミニマップをクリック）：ホイール・ピンチで拡大縮小、ドラッグで移動、現在地・全体表示ボタン、陸地・建物・道路名・ランドマーク・交通を表示、最大拡大で車線まで、縮尺バー', en: 'Full map (M or click the minimap): wheel/pinch zoom, drag to pan, locate-me and fit-all buttons, land, buildings, road names, landmarks and traffic, lanes at max zoom, scale bar' },
      { type: 'new', ko: '서스펜션: 네 바퀴가 노면 요철(고속도로는 곱게, 일반도로·주차장은 거칠게)과 하중 이동(제동 시 앞, 코너 시 바깥쪽)에 따라 각각 움직임', ja: 'サスペンション：4輪それぞれが路面の凹凸（高速は細かく、一般道・駐車場は粗く）と荷重移動（ブレーキで前、コーナーで外側）に合わせて動く', en: 'Suspension: each wheel moves with road texture (fine on expressways, coarser on streets and lots) and load transfer (nose under braking, outside wheels in corners)' },
      { type: 'change', ko: 'GitHub 소개 페이지 리뉴얼: 비설치 고사양 웹 게임으로 안내, 업데이트 기록 정리', ja: 'GitHub紹介ページを刷新：インストール不要の高性能ブラウザゲームとして案内、更新履歴を整理', en: 'GitHub page renewed: presented as a no-install, high-end browser game; release history tidied' },
      { type: 'change', ko: '웹사이트 로드맵 갱신: 0.2 완료, 0.3 진행 중, 0.4 수도고 C1·새 지역 예정', ja: 'サイトのロードマップを更新：0.2完了、0.3進行中、0.4で首都高C1・新エリア予定', en: 'Website roadmap updated: 0.2 done, 0.3 in progress, 0.4 Shuto C1 and new areas next' },
    ]
  },
  {
    version: '0.3.3', date: '2026-11-06', codename: 'Smooth Ride',
    summary: {
      ko: '오디오 음량 평준화, 도로 단차 95% 제거, 표지판 171개로 확대, 화면 하단 버전·FPS 표시, 웹사이트 사진 전면 교체.',
      ja: 'オーディオの音量を平準化、道路の段差を95%解消、標識を171基に拡充、画面下にバージョン・FPS表示、サイトの写真を一新。',
      en: 'Audio loudness levelled, 95% of road steps removed, 171 roadside signs, version + FPS at the bottom of the screen, all website photos retaken.'
    },
    items: [
      { type: 'change', ko: '오디오 평준화: 엔진 녹음의 RPM 구간별 음량을 통일(차종 간 편차 제거), 효과음 피크 정리, 마스터 컴프레서 강화', ja: 'オーディオ平準化：エンジン録音の回転域ごとの音量を統一（車種間の差を解消）、効果音のピークを整え、マスターコンプを強化', en: 'Audio levelling: every rpm slice of every engine recording at the same loudness (no jumps between cars), SFX peaks evened out, stronger master compressor' },
      { type: 'fix', ko: '도로 단차 543곳 → 26곳: 같은 도로의 높이 판정 오류(10~20cm 턱) 수정, 램프 합류·분기부를 본선 높이에 맞춰 부드럽게 연결, 노면이 바퀴보다 떠 보이던 문제 수정', ja: '道路の段差 543か所→26か所：同じ道路の高さ判定の誤り（10〜20cmの段）を修正、ランプの合流・分岐を本線の高さに合わせてなめらかに接続、路面がタイヤより浮いて見える問題を修正', en: 'Road steps 543 → 26: fixed a height lookup that put 10–20 cm ledges in the same road, ramps now meet the main line flush at merges and diverges, decks no longer drawn above the tyres' },
      { type: 'new', ko: '표지판 대폭 추가(171개): 분기 1km 전 출구 예고, 분기점 노선 표시, 제한속도·노선 표지 반복 설치, 킬로포스트, 일반도로 제한속도와 「止まれ」 표지', ja: '標識を大幅追加（171基）：分岐1km手前の出口予告、分岐点の路線標識、速度規制・路線標識の繰り返し、キロポスト、一般道の速度規制と「止まれ」標識', en: 'Many more signs (171): exit warnings 1 km before junctions, route markers at the gore, repeated speed-limit and route signs, kilometre posts, street speed limits and STOP signs' },
      { type: 'new', ko: '화면 하단에 게임 버전과 FPS 상시 표시 (설정에서 FPS 끄기 가능)', ja: '画面下にバージョンとFPSを常時表示（設定でFPSはオフ可能）', en: 'Game version and FPS always shown at the bottom of the screen (FPS can be turned off in settings)' },
      { type: 'change', ko: '웹사이트 사진 전면 교체: HUD 없는 깨끗한 새 스크린샷, 고해상도 히어로', ja: 'サイトの写真を一新：HUDなしの新しいスクリーンショット、高解像度ヒーロー', en: 'Website photos retaken: clean new screenshots without HUD, high-resolution hero' },
      { type: 'fix', ko: '부두 스폰 시 일본 좌측통행에 맞게 왼쪽 차로에서 출발', ja: 'ふ頭スタート時は左側通行に合わせ左車線から出発', en: 'Wharf spawn now starts in the left lane (Japan drives on the left)' },
      { type: 'known', ko: '다이코쿠 JCT 일부 램프가 반대 차로 위를 낮게 지나는 구간(지도 데이터)에 작은 단차가 남아 있음', ja: '大黒JCTの一部ランプが反対車線の上を低く通る区間（地図データ）に小さな段差が残っています', en: 'A few small steps remain where Daikoku JCT ramps pass low over the opposite lanes (map data)' },
    ]
  },
  {
    version: '0.3.2', date: '2026-11-06', codename: 'Road Paint',
    summary: {
      ko: '노면에 행선지·화살표·제한속도·「止まれ」 표시, 분기점마다 안내 표지판, 도로 구멍과 차로 위 가로등 수정, 스폰 지역 선택과 버전 표시.',
      ja: '路面に行き先・矢印・速度・「止まれ」を表示、分岐ごとに案内標識、道路の穴と車線上の街灯を修正、スタート地点の選択とバージョン表示。',
      en: 'Destinations, arrows, speed numbers and 止まれ painted on the road, guide signs before every junction, road holes and lamp posts on lanes fixed, spawn-region choice and version display.'
    },
    items: [
      { type: 'new', ko: '노면 표시: 분기 전 차로마다 행선지(東京·横浜·大黒PA·アクアライン 등)와 직진/분기 화살표, 고속도로 제한속도 숫자, 일반도로 교차로의 정지선과 「止まれ」', ja: '路面標示：分岐手前の各車線に行き先（東京・横浜・大黒PA・アクアラインなど）と直進／分岐矢印、高速の速度数字、一般道交差点の停止線と「止まれ」', en: 'Road markings: per-lane destinations (Tokyo, Yokohama, Daikoku PA, Aqua-Line…) with straight/branch arrows before junctions, speed numbers on expressways, stop lines and 止まれ at street junctions' },
      { type: 'new', ko: '모든 고속도로 분기점 500m·200m 전에 오버헤드 안내 표지판 자동 배치 (아쿠아라인·우미호타루·K5 포함)', ja: '高速のすべての分岐の500m・200m手前に門型案内標識（アクアライン・海ほたる・K5含む）', en: 'Overhead guide signs 500 m and 200 m before every expressway junction (incl. Aqua-Line, Umihotaru, K5)' },
      { type: 'new', ko: '타이틀에서 스폰 지역 선택: 다이코쿠 PA · 완간선(베이브리지) · 우미호타루 PA · 다이코쿠 부두', ja: 'タイトルでスタート地点を選択：大黒PA・湾岸線（ベイブリッジ）・海ほたるPA・大黒ふ頭', en: 'Choose where to spawn on the title screen: Daikoku PA, Bayshore (Bay Bridge), Umihotaru PA or Daikoku Wharf' },
      { type: 'new', ko: '타이틀 화면과 주행 화면에 게임 버전 표시', ja: 'タイトルと走行画面にバージョンを表示', en: 'Game version shown on the title screen and in-game' },
      { type: 'fix', ko: '도로 구멍 수정: 교차로에서 끊겨 있던 일반도로 연결, 우키시마 JCT 램프가 터널과 16m 어긋나던 문제 수정', ja: '道路の穴を修正：交差点で途切れていた一般道をつなぎ、浮島JCTのランプがトンネルと16mずれていた問題を修正', en: 'Road holes fixed: streets that stopped short of junctions now connect, and the Ukishima JCT ramp no longer sits 16 m above its tunnel' },
      { type: 'fix', ko: '가로등이 다른 도로·램프·교차로의 차로 위에 서 있던 문제 수정 (1,517개 전수 검사 0건)', ja: '街灯が他の道路・ランプ・交差点の車線上に立っていた問題を修正（1,517本を全数検査で0件）', en: 'Lamp posts no longer stand on the lanes of other roads, ramps or junctions (all 1,517 checked)' },
      { type: 'fix', ko: '교차로에서 인도가 차로를 덮던 문제 수정', ja: '交差点で歩道が車線を覆っていた問題を修正', en: 'Sidewalks no longer cover the carriageway at junctions' },
    ]
  },
  {
    version: '0.3.1', date: '2026-11-06', codename: 'Clean Lines',
    summary: {
      ko: '차선 표시 정리: 교차로·합류부에서 다른 도로 위로 그어지던 차선 제거, 고속도로 합류·분류부에 굵은 점선, 온라인 접속 안정화.',
      ja: '車線表示を整理：交差点・合流部で他の道路の上に引かれていた線を削除、高速の合流・分流部に太い破線、オンライン接続を安定化。',
      en: 'Lane markings cleaned up: no more lines painted across other roads at junctions and merges, thick dashed merge lines on the expressways, steadier online connections.'
    },
    items: [
      { type: 'fix', ko: '교차로·램프 합류부에서 차선·가장자리선이 다른 도로의 차로 위를 가로지르던 문제 수정', ja: '交差点・ランプ合流部で車線や外側線が他の道路の車線を横切っていた問題を修正', en: 'Fixed lane and edge lines running across other roads\' lanes at intersections and ramp junctions' },
      { type: 'new', ko: '고속도로 합류·분류 구간에 실제 수도고처럼 굵은 흰 점선 표시', ja: '高速の合流・分流区間に首都高と同じ太い白破線', en: 'Thick white dashed merge/diverge lines on the expressways, as on the real Shutoko' },
      { type: 'fix', ko: '온라인: 자주 꺼지던 소형 릴레이 대신 대형 공개 릴레이 고정 사용 → 접속 오류 감소', ja: 'オンライン：落ちやすい小規模リレーをやめ大手公開リレーに固定 → 接続エラーを削減', en: 'Online: pinned large public relays instead of small ones that went offline — fewer connection errors' },
    ]
  },
  {
    version: '0.3.0', date: '2026-11-06', codename: 'Full Throttle',
    summary: {
      ko: '주행감·사운드·콕핏·그래픽을 전부 다시 만들었어요. 실제 R34, 차종별 실내, 실녹음 엔진음, 난이도 설정, 그리고 도로 위에 서 있던 교각 수정.',
      ja: '走り・サウンド・コックピット・グラフィックを作り直しました。リアルなR34、車種別の室内、実録エンジン音、難易度設定、そして道路上の橋脚を修正。',
      en: 'Handling, sound, cockpits and graphics rebuilt: a real R34, per-car interiors, recorded engines, difficulty settings — and no more piers on the road.'
    },
    items: [
      { type: 'new', ko: '주행 모델 전면 재작성: 부드러운 타이어 그립 곡선·하중 이동·속도 감응 조향 — 200km/h 이상에서도 안정, 코너 약 1g, 실제에 가까운 제동거리', ja: '走行モデルを全面刷新：なめらかなタイヤグリップ・荷重移動・車速感応ステアリング — 200km/h超でも安定、コーナー約1g、実車に近い制動距離', en: 'Driving model rebuilt: smooth tyre grip curve, load transfer and speed-sensitive steering — planted at 200+ km/h, ~1 g cornering, realistic braking distances' },
      { type: 'new', ko: '난이도 프리셋(초보·표준·프로·시뮬레이션)과 조향 보조·STM·TCS·ABS·경찰 단속 개별 설정', ja: '難易度プリセット（ビギナー・スタンダード・プロ・シミュレーション）と、ステアリングアシスト・STM・TCS・ABS・取り締まりの個別設定', en: 'Difficulty presets (Beginner / Standard / Pro / Simulation) with separate steering assist, STM, TCS, ABS and police-tolerance options' },
      { type: 'new', ko: '차종별 실제 콕핏: 우핸들/좌핸들, 야간 조명이 들어오는 실시간 계기판, R34 멀티 디스플레이·R32/R33 센터 3연계, 비치는 룸미러·사이드미러, 움직이는 핸들·시프터·페달', ja: '車種別のリアルなコックピット：右/左ハンドル、夜間照明付きのライブメーター、R34マルチファンクションディスプレイ・R32/R33センター3連メーター、映るミラー、連動するハンドル・シフト・ペダル', en: 'Per-car cockpits: RHD/LHD, live night-lit clusters, R34 multi-function display and R32/R33 console gauges, working mirrors, moving wheel, shifter and pedals' },
      { type: 'new', ko: '실제 R34 GT-R 3D 모델 및 시빅 타입R·머스탱 GT·마크II(JZX100)·LFA 모델 추가 (CC BY 4.0)', ja: 'R34 GT-Rの実車3Dモデル、シビック タイプR・マスタングGT・マークII(JZX100)・LFAのモデルを追加（CC BY 4.0）', en: 'Real 3D model for the R34 GT-R, plus Civic Type R, Mustang GT, Mark II (JZX100) and LFA models (CC BY 4.0)' },
      { type: 'new', ko: '엔진음: 실제 CC0 녹음 기반(직렬6·직렬4·수평대향·V8·V10·디젤), 가속/엔진브레이크 별도 레이어, 타이어 스퀼·노면·바람·팝·블로오프 실녹음, 터널·고가 아래 잔향, 이음매 「타탄」 소리', ja: 'エンジン音：実録CC0素材ベース（直6・直4・水平対向・V8・V10・ディーゼル）、加速／エンブレ別レイヤー、スキール・ロードノイズ・風・アフターファイア・ブローオフも実録、トンネル・高架下の残響、継ぎ目の「タタン」', en: 'Engines from real CC0 recordings (I6, I4, boxer, V8, V10, diesel) with on/off-throttle layers; recorded tyre squeal, road, wind, pops and blow-off; tunnel and under-viaduct reverb; expansion-joint thumps' },
      { type: 'change', ko: '다이코쿠 PA 밋: 차와 사람이 동쪽 밋 구역에 모이고 규모가 커짐, 가로수 개선', ja: '大黒PAのミーティング：クルマと人が東側に集まり規模アップ、植栽を改善', en: 'Daikoku PA meet: cars and people gather in the east meet rows, bigger crowds, better trees' },
      { type: 'change', ko: '하늘: 낮 하늘이 하얗게 날아가지 않음, 구름층, 도쿄 광공해가 비치는 밤하늘, 밤바다의 금빛 번쩍임 제거', ja: '空：昼の空が白飛びしない、雲、東京の光害を映す夜空、夜の海の金色の反射を解消', en: 'Sky: blue day sky (no more white-out), cloud deck, light-polluted Tokyo night sky, no more golden glare on the night sea' },
      { type: 'change', ko: '웹사이트 리디자인: 인게임 히어로, 도쿄만 섹션, 빠른 이미지, 휴대폰·4K 레이아웃 수정, 20개 언어 완성', ja: 'サイトをリデザイン：ゲーム画面のヒーロー、東京湾セクション、高速な画像、スマホ・4Kのレイアウト修正、20言語完備', en: 'Website redesign: in-game hero, Tokyo Bay section, faster images, phone/4K layout fixes, all 20 languages complete' },
      { type: 'fix', ko: '고가 교각이 아래 도로 차선 위에 서 있던 문제 수정 — 아래 도로를 걸치는 문형 교각으로 변경, 교각 충돌 판정 추가', ja: '高架の橋脚が下の道路の車線上に立っていた問題を修正 — 下の道路をまたぐ門型橋脚に、橋脚の当たり判定も追加', en: 'Fixed viaduct piers standing on the lanes of roads below — they are now portal frames straddling the lower road, and piers are solid' },
      { type: 'fix', ko: '도로 위에 서 있던 표지판, 상층 데크를 뚫던 가로등 수정 (2층 구간은 데크 하부 조명)', ja: '道路上に立っていた標識、上層デッキを突き抜けていた街灯を修正（2層区間はデッキ下照明に）', en: 'Fixed signs standing on the road and lamp posts piercing the deck above (stacked sections now use soffit lights)' },
      { type: 'fix', ko: '지붕이 투명해 오픈카처럼 보이던 절차적 차량 수정, 12개 3D 차량의 야간 램프 점등', ja: '屋根が透けてオープンカーに見えていた車両を修正、3Dモデル12車種の夜間ランプ点灯', en: 'Fixed procedural cars whose roofs looked see-through; night lamps now light on 12 more 3D models' },
      { type: 'fix', ko: '벽에 닿으면 멈춰 붙던 문제 → 벽을 따라 미끄러짐, 저단 무한 휠스핀·자동 변속 시동 꺼짐 수정', ja: '壁に張り付く問題→壁に沿って滑るように、低速ギアの空転とAT時のエンストを修正', en: 'Walls: you now slide along instead of sticking; fixed endless low-gear wheelspin and auto-gearbox stalls' },
      { type: 'known', ko: 'ND·S2000·S660 등 8종은 아직 라이선스가 확실한 3D 모델이 없어 절차적 모델 사용', ja: 'ND・S2000・S660など8車種はライセンスの明確な3Dモデルがなく、手続き生成モデルのまま', en: '8 cars (incl. ND, S2000, S660) still use procedural models — no clearly licensed 3D model yet' },
    ]
  },
  {
    version: '0.2.0', date: '2026-11-05', codename: 'Bayshore',
    summary: {
      ko: '수도고속 완간선을 따라 하네다까지, 도쿄만 아쿠아라인 해저터널을 지나 우미호타루 PA까지. 실제 3D 차량 모델과 열리는 보닛도 들어왔어요.',
      ja: '首都高湾岸線を羽田まで、東京湾アクアラインの海底トンネルを抜けて海ほたるPAへ。実在車の3Dモデルと開くボンネットも登場。',
      en: 'Drive the Shuto Bayshore Route to Haneda and the Tokyo Bay Aqua-Line under the sea to Umihotaru PA — plus real 3D car models with opening bonnets.'
    },
    items: [
      { type: 'new', ko: '완간선(B) 연장: 다이코쿠 → 츠루미 츠바사교 → 오기시마 → 가와사키 항로 터널 → 가와사키 우키시마 JCT → 다마가와 터널 → 하네다 (OpenStreetMap 기반)', ja: '湾岸線(B)延伸：大黒→鶴見つばさ橋→扇島→川崎航路トンネル→川崎浮島JCT→多摩川トンネル→羽田（OpenStreetMapに基づく）', en: 'Bayshore Route (B) extended: Daikoku → Tsurumi Tsubasa Bridge → Ōgishima → Kawasaki Fairway Tunnel → Kawasaki-Ukishima JCT → Tama River Tunnel → Haneda (from OpenStreetMap)' },
      { type: 'new', ko: '도쿄만 아쿠아라인: 9.6km 해저 터널(조명·환기탑 「바람의 탑」) → 우미호타루 → 4.4km 아쿠아 브리지 → 기사라즈', ja: '東京湾アクアライン：9.6kmの海底トンネル（照明・換気塔「風の塔」）→海ほたる→4.4kmのアクアブリッジ→木更津', en: 'Tokyo Bay Aqua-Line: 9.6 km undersea tunnel (lit, with the Kaze-no-Tō ventilation towers) → Umihotaru → 4.4 km Aqua Bridge → Kisarazu' },
      { type: 'new', ko: '우미호타루 PA: 배 모양 5층 건물(필로티 아래로 본선 통과), 방향별 주차장과 진출입 램프, 커터페이스 기념비, 야간 조명', ja: '海ほたるPA：船の形の5階建て（ピロティの下を本線が通過）、方向別の駐車場と出入口ランプ、カッターフェイス、夜間照明', en: 'Umihotaru PA: the ship-shaped 5-storey building (the expressway runs beneath it), a lot with entry/exit ramps for each direction, the cutter-face monument, night lighting' },
      { type: 'new', ko: '도쿄만 풍경: 츠루미 츠바사교, 하네다 공항 활주로 조명, 도쿄 타워, 스카이트리, 레인보우 브리지, 도쿄 게이트 브리지, 가와사키·지바 공업지대 야경, 서쪽 지평선의 후지산', ja: '東京湾の景色：鶴見つばさ橋、羽田空港の滑走路灯、東京タワー、スカイツリー、レインボーブリッジ、東京ゲートブリッジ、川崎・千葉の工場夜景、西の地平線の富士山', en: 'Tokyo Bay scenery: Tsurumi Tsubasa Bridge, Haneda runway lights, Tokyo Tower, Skytree, Rainbow Bridge, Tokyo Gate Bridge, Kawasaki & Chiba factory night views, Mt. Fuji on the western horizon' },
      { type: 'new', ko: '실제 3D 차량 모델 25개를 28개 차종에 적용 (CC BY 4.0, 제작자 표기는 assets/CREDITS.md) — 도장 색·마감 실시간 변경, 바퀴 회전·조향, 램프 점등', ja: '実在車の3Dモデル25点を28車種に採用（CC BY 4.0、作者表記は assets/CREDITS.md）— 塗装色・仕上げのリアルタイム変更、ホイールの回転・操舵、ランプ点灯', en: '25 real 3D car models on 28 cars (CC BY 4.0, credits in assets/CREDITS.md) with live paint colour & finish, spinning/steering wheels and working lamps' },
      { type: 'new', ko: '보닛 개방: 모든 차량에서 엔진룸을 열 수 있음 (MR/RR 차량은 엔진 리드) — 직렬·V형·수평대향·로터리별 엔진 디테일', ja: 'ボンネット開閉：全車でエンジンルームを開けられる（MR/RR車はエンジンフード）— 直列・V型・水平対向・ロータリー別のエンジン', en: 'Opening bonnet on every car (engine lid on mid/rear-engined cars) with inline / V / boxer / rotary engine detail' },
      { type: 'new', ko: '웹사이트: 차량 페이지 3D 미리보기(드래그 회전), 모든 순정 색상·커스텀 색상·마감·휠 색 적용 후 「이 색으로 운전」, 스크롤·호버 모션', ja: 'サイト：車両ページの3Dプレビュー（ドラッグで回転）、全純正色・カスタム色・仕上げ・ホイール色を適用して「この色で運転」、スクロール・ホバーのモーション', en: 'Website: 3D car preview (drag to rotate), every factory colour plus custom colour, finish and wheel colour, “Drive in this colour”, scroll & hover motion' },
      { type: 'change', ko: '게임 UI 모션: 화면 전환 페이드·슬라이드, 버튼 반응, 계기판 바늘·기어 표시 애니메이션', ja: 'ゲームUIのモーション：画面切替のフェード・スライド、ボタンの反応、メーター針・ギア表示のアニメーション', en: 'In-game UI motion: fading/sliding screens, button feedback, animated speedometer needle and gear display' },
      { type: 'fix', ko: '도로 노면이 위에서 보면 투명하게 뚫려 보이던 문제 수정 (노면이 아래쪽을 향하고 있었음)', ja: '路面が上から見ると透けて見えていた問題を修正（面の向きが下向きだった）', en: 'Fixed road decks looking transparent from above (their faces pointed downwards)' },
      { type: 'fix', ko: '게임 시작 시 차량 생성 오류와 월드 좌표 오류(NaN)로 일부 지형·건물이 사라지던 문제 수정', ja: '起動時の車両生成エラーと、ワールド座標のNaNで一部の地形・建物が消えていた問題を修正', en: 'Fixed a car-building crash at start-up and NaN world coordinates that made parts of the ground and buildings disappear' },
      { type: 'fix', ko: '절차적 차량의 지붕·필러가 보이지 않던 문제 수정, 멀리서 노면 텍스처가 줄무늬로 깨지던 문제 수정', ja: '手続き生成車の屋根・ピラーが表示されない問題、遠方で路面テクスチャが縞模様になる問題を修正', en: 'Fixed missing roofs/pillars on procedural cars and striped road textures far from the start' },
      { type: 'known', ko: 'R34·LFA 등 13종은 라이선스가 확실한 3D 모델이 없어 기존 절차적 모델을 사용', ja: 'R34・LFAなど13車種はライセンスの明確な3Dモデルがないため、従来の手続き生成モデルを使用', en: '13 cars (incl. R34, LFA) still use the procedural model — no clearly licensed 3D model was available' },
    ]
  },
  {
    version: '0.1.1', date: '2026-11-04', codename: 'One Click',
    summary: {
      ko: '링크 하나로 바로 플레이. 크롬에서 공식 사이트 주소만 열면 설치 없이 실행돼요.',
      ja: 'リンクひとつですぐプレイ。Chromeで公式サイトを開くだけ、インストール不要。',
      en: 'One link, instant play — open the official site in Chrome, no install needed.'
    },
    items: [
      { type: 'new', ko: '웹 버전 공개 — 브라우저에서 바로 플레이', ja: 'Web版を公開 — ブラウザですぐプレイ', en: 'Web version released — play right in the browser' },
      { type: 'new', ko: '타이틀 화면에 「▶ 바로 출발」 버튼 — 마지막에 탄 차로 즉시 출발 (Enter 키도 가능)', ja: 'タイトルに「▶ すぐに出発」ボタン — 前回の車ですぐ出発（Enterキーでも可）', en: 'Title screen “▶ Quick start” — drive off instantly in your last car (or press Enter)' },
      { type: 'change', ko: '웹사이트의 「지금 플레이」와 차량 목록의 「운전하기」를 누르면 타이틀을 건너뛰고 바로 주행 시작', ja: 'サイトの「今すぐプレイ」・車両一覧の「運転する」からタイトルを飛ばして即スタート', en: 'Website “Play now” and car-list “Drive” buttons skip the title and start driving right away' },
      { type: 'change', ko: '소리는 첫 키 입력/터치 때 자동으로 켜짐 (브라우저 정책)', ja: 'サウンドは最初のキー入力／タップで自動的にオン（ブラウザ仕様）', en: 'Sound turns on automatically at the first key press or tap (browser policy)' }
    ]
  },
  {
    version: '0.1.0', date: '2026-11-04', codename: 'First Meet',
    summary: {
      ko: '첫 공개 버전. 다이코쿠 JCT·PA와 다이코쿠 부두 일대를 3D로 구현했습니다.',
      ja: '最初の公開版。大黒JCT・PAと大黒ふ頭周辺を3Dで再現。',
      en: 'First public build — Daikoku JCT, Daikoku PA and the surrounding Daikoku-futō area in full 3D.'
    },
    items: [
      { type: 'new', ko: '다이코쿠 PA: 주차장·대형차 구역·편의점(24h)·푸드코트·화장실·자판기 줄·흡연소·고속도로 교통경찰대 분주소', ja: '大黒PA：駐車場・大型車マス・コンビニ(24h)・フードコート・トイレ・自販機コーナー・喫煙所・高速隊分駐所', en: 'Daikoku PA: car & truck bays, 24h convenience store, food court, toilets, vending-machine row, smoking area, expressway police post' },
      { type: 'new', ko: '다이코쿠 JCT 나선형 루프 램프, 만안선(B)·K5 다이코쿠선 고가도로, 베이브리지 방면', ja: '大黒JCTのループランプ、湾岸線(B)・K5大黒線の高架、ベイブリッジ方面', en: 'Daikoku JCT spiral loop ramps, elevated Bayshore Route (B) and K5 Daikoku Line, Bay Bridge approach' },
      { type: 'new', ko: '다이코쿠 부두 출입구 톨게이트 (ETC/일반 차로, 차단봉, 보통차·경차 요금)', ja: '大黒ふ頭出入口の料金所（ETC/一般レーン・開閉バー・普通車/軽自動車料金）', en: 'Daikoku-futō toll gate with ETC / cash lanes, barrier arms, standard & kei fares' },
      { type: 'new', ko: '실제 차량 41종 (R32·R33·R34·R35·GR86·AE86·FD3S·NSX·S2000·경차·EV·순찰차 등) 절차적 고폴리곤 모델', ja: '実在車41車種（R32/R33/R34/R35/GR86/AE86/FD3S/NSX/S2000・軽・EV・パトカー等）', en: '41 real-world vehicles (R32/R33/R34/R35, GR86, AE86, FD3S, NSX, S2000, kei, EVs, police) as procedural high-poly models' },
      { type: 'new', ko: '수동: 시동·클러치·H패턴 변속·엔스트 / 자동: P·R·N·D, 사이드브레이크 / EV 회생제동 3단계·원페달', ja: 'MT：始動・クラッチ・Hパターン・エンスト／AT：P・R・N・D、サイドブレーキ／EV回生3段階・ワンペダル', en: 'Manual: ignition, clutch, H-pattern, stalling · Auto: P/R/N/D, handbrake · EV regen 3 levels + one-pedal' },
      { type: 'new', ko: '문·트렁크·창문·후드 개폐, 스트로보 라이트 패턴, 1인칭 콕핏(우핸들), 캠버·차고·트레드 세팅', ja: 'ドア・トランク・窓・ボンネット開閉、ストロボ設定、コックピット視点(右ハンドル)、キャンバー・車高・トレッド調整', en: 'Doors, trunk, windows, hood; strobe patterns; RHD cockpit view; camber, ride height & track tuning' },
      { type: 'new', ko: '일본 번호판 시스템: 자가용(흰색)·사업용(녹색)·경(노랑)·경사업용(검정)·8넘버', ja: 'ナンバープレート：自家用(白)・事業用(緑)・軽(黄)・軽事業用(黒)・8ナンバー', en: 'Japanese plates: private (white), commercial (green), kei (yellow), kei commercial (black), 8-series' },
      { type: 'new', ko: '30분 = 12시간 낮밤 순환, 도쿄만 야경(미나토미라이·관람차·공장 야경·베이브리지 조명)', ja: '30分＝12時間の昼夜サイクル、東京湾の夜景（みなとみらい・観覧車・工場夜景・ベイブリッジ）', en: '30 min = 12 h day/night cycle, Tokyo Bay night view (Minato Mirai, Ferris wheel, factory lights, Bay Bridge)' },
      { type: 'new', ko: '고속도로 교통 AI, 카밋 NPC (하차·대화·차 구경·출발), 순찰차 단속·확성기·PA 폐쇄 이벤트', ja: '交通AI、カーミーティングNPC（降車・会話・見学・出発）、パトカーの取締り・拡声器・PA閉鎖イベント', en: 'Traffic AI, car-meet NPCs (get out, chat, admire, leave), police enforcement, loudspeaker, PA closure event' },
      { type: 'new', ko: '도보 모드와 복장 선택, 출입 금지 구역 차단', ja: '徒歩モードと服装選択、立入禁止エリア', en: 'On-foot mode with outfit selection; restricted areas are blocked' },
      { type: 'new', ko: '차량 라디오 4채널 (자작 시티팝·유로비트·로파이·엔카풍) — 창문/문을 열면 밖에서도 들림', ja: 'カーラジオ4局（オリジナルのシティポップ・ユーロビート・ローファイ・演歌風）— 窓やドアを開けると車外にも聞こえる', en: 'Car radio with 4 stations (original city pop, eurobeat, lo-fi, enka-style) — audible outside when windows/doors are open' },
      { type: 'new', ko: '20개 언어, 키보드·게임패드·모바일 터치 조작, 그래픽 품질 프리셋', ja: '20言語、キーボード・ゲームパッド・タッチ操作、画質プリセット', en: '20 languages, keyboard / gamepad / touch controls, graphics presets' },
      { type: 'new', ko: '공식 웹사이트, 로컬 계정(회원가입·닉네임), PWA 설치', ja: '公式サイト、ローカルアカウント（登録・ニックネーム）、PWA', en: 'Official website, local accounts (sign-up, nickname), installable PWA' },
      { type: 'new', ko: '차종별 엔진음: 엔진 형식(직렬4·6, V6·V8·V10, 수평대향, 로터리, 경차 3기통, EV)·배기량·엔진 코드별 음색, 터보 휘슬과 블로오프, 자연흡기 고회전·VTEC 전환음, 디젤 트럭', ja: '車種ごとのエンジン音：形式（直4・直6・V6・V8・V10・水平対向・ロータリー・軽3気筒・EV）、排気量、エンジン型式ごとの音色、ターボのヒューン音とブローオフ、NAの高回転・VTEC切替、ディーゼル', en: 'Per-car engine sound: layout (I4/I6/V6/V8/V10/boxer/rotary/kei I3/EV), displacement and engine-code voicing, turbo whistle and blow-off, NA high-rev & VTEC crossover, diesel trucks' },
      { type: 'new', ko: '차량 정보: 제조사·연식·섀시 코드·엔진·구동방식(FF 전륜 / FR·MR·RR 후륜 / AWD 사륜)·터보/자연흡기 표시 (게임 차고 + 웹사이트)', ja: '車両情報：メーカー・年式・型式・エンジン・駆動方式（FF／FR・MR・RR／4WD）・ターボ/NA表示（ゲーム内ガレージ＋公式サイト）', en: 'Vehicle info: maker, year, chassis code, engine, drivetrain (FF / FR·MR·RR / AWD) and turbo/NA shown in the garage and on the website' },
      { type: 'new', ko: '실행 간편화: start.command / start.bat 더블클릭', ja: 'かんたん起動：start.command／start.bat をダブルクリック', en: 'Easy launch: double-click start.command / start.bat' },
      { type: 'change', ko: '게임 이름을 MIDNIGHT JAPAN(ミッドナイト・ジャパン)으로 확정', ja: 'タイトルを MIDNIGHT JAPAN（ミッドナイト・ジャパン）に決定', en: 'Title set to MIDNIGHT JAPAN (ミッドナイト・ジャパン)' },
      { type: 'known', ko: '온라인 멀티플레이는 아직 없음 (계정은 이 기기에만 저장)', ja: 'オンラインマルチは未実装（アカウントは端末内保存）', en: 'No online multiplayer yet — accounts are stored on this device only' },
    ]
  },
];

// status: live | partial | planned
export const REGIONS = [
  { id: 'daikoku_pa', status: 'live', name: { ko: '다이코쿠 PA', ja: '大黒PA', en: 'Daikoku PA' }, pref: '神奈川県横浜市鶴見区大黒ふ頭',
    desc: { ko: '다이코쿠 JCT 루프 안쪽에 자리한 수도고 최대급 파킹에리어. 주말 밤이면 전국의 튜닝카가 모인다.', ja: '大黒JCTのループの内側にある首都高最大級のパーキングエリア。週末の夜には全国からチューニングカーが集まる。', en: 'One of the Shuto Expressway’s largest parking areas, set inside the Daikoku JCT loops — the weekend-night gathering spot for tuned cars.' } },
  { id: 'daikoku_jct', status: 'live', name: { ko: '다이코쿠 JCT', ja: '大黒JCT', en: 'Daikoku JCT' }, pref: '首都高速 湾岸線 / K5 大黒線',
    desc: { ko: '만안선과 K5 다이코쿠선이 만나는 나선형 루프 분기점.', ja: '湾岸線とK5大黒線が交わるループ状のジャンクション。', en: 'The spiral junction where the Bayshore Route meets the K5 Daikoku Line.' } },
  { id: 'daikoku_futo', status: 'partial', name: { ko: '다이코쿠 부두', ja: '大黒ふ頭', en: 'Daikoku-futō' }, pref: '横浜港',
    desc: { ko: '컨테이너 야드·자동차 수출 선적장·창고가 늘어선 매립지. 출입구 톨게이트 포함.', ja: 'コンテナヤード・自動車積出し埠頭・倉庫が並ぶ埋立地。出入口料金所あり。', en: 'Reclaimed port island of container yards, car-export berths and warehouses, with its toll gate.' } },
  { id: 'baybridge', status: 'live', name: { ko: '요코하마 베이브리지', ja: '横浜ベイブリッジ', en: 'Yokohama Bay Bridge' }, pref: '首都高速 湾岸線',
    desc: { ko: '높이 55m의 사장교 상판. K3에서 혼모쿠 JCT를 지나 바로 진입해 다이코쿠로 돌아오는 요코하마 루프의 마지막 구간.', ja: '高さ55mの斜張橋の上層。K3から本牧JCTを経て渡り、大黒へ戻る横浜ループの最終区間。', en: 'The cable-stayed upper deck, 55 m above the water — the last leg of the Yokohama loop, entered from the K3 via Honmoku JCT and back to Daikoku.' } },
  { id: 'k1loop', status: 'live', name: { ko: 'K1 요코하마 루프', ja: 'K1 横浜ループ', en: 'K1 Yokohama Loop' }, pref: '首都高速 K5・K1・K3',
    desc: { ko: '나마무기 JCT → 요코하마역 앞 고가 → 이시카와초 지하 → K3 가리바선 → 혼모쿠 JCT. 약 17km의 실제 노선.', ja: '生麦JCT→横浜駅前の高架→石川町の地下→K3狩場線→本牧JCT。約17kmの実在路線。', en: 'Namamugi JCT → the viaduct past Yokohama Station → underground at Ishikawachō → K3 Kariba Line → Honmoku JCT. About 17 km of real route.' } },
  { id: 'yokohama', status: 'live', name: { ko: '요코하마 시가지', ja: '横浜市街', en: 'Yokohama city' }, pref: '神奈川県横浜市 西区・中区',
    desc: { ko: '미나토미라이·차이나타운·야마시타 공원의 실제 거리. 코스모클록 21, 마린타워, 히카와마루.', ja: 'みなとみらい・中華街・山下公園の実在の街並み。コスモクロック21、マリンタワー、氷川丸。', en: 'The real streets of Minato Mirai, Chinatown and Yamashita Park, with Cosmo Clock 21, Marine Tower and the Hikawa Maru.' } },
  { id: 'kawasaki', status: 'live', name: { ko: '쓰루미·가와사키', ja: '鶴見・川崎', en: 'Tsurumi & Kawasaki' }, pref: '神奈川県横浜市鶴見区・川崎市',
    desc: { ko: '주택가·상점가·공장 지대와 철도 노선이 촘촘한 실제 시가지.', ja: '住宅街・商店街・工場地帯と鉄道が密集する実在の市街地。', en: 'Real neighbourhoods, shopping streets, factory districts and dense rail lines.' } },
  { id: 'haneda', status: 'live', name: { ko: '하네다 공항', ja: '羽田空港', en: 'Haneda Airport' }, pref: '東京都大田区',
    desc: { ko: '실제 활주로와 주기장, 이착륙하는 여객기. 만안선 다마가와 터널로 연결.', ja: '実在の滑走路とスポット、離着陸する旅客機。湾岸線の多摩川トンネルで接続。', en: 'The real runways and stands with airliners landing and taking off, reached through the Bayshore’s Tama River Tunnel.' } },
  { id: 'tsubasa', status: 'live', name: { ko: '츠루미 츠바사 다리', ja: '鶴見つばさ橋', en: 'Tsurumi Tsubasa Bridge' }, pref: '首都高速 湾岸線', desc: { ko: '하네다로 이어지는 완간선의 1주 사장교. 밤이면 케이블 조명이 바다 위에 떠요.', ja: '羽田へ続く湾岸線の一本柱斜張橋。夜はケーブルの照明が海に浮かぶ。', en: 'The single-tower cable-stayed bridge on the Bayshore Route toward Haneda; its cables glow over the sea at night.' } },
  { id: 'tatsumi', status: 'planned', name: { ko: '타츠미 PA', ja: '辰巳第一PA', en: 'Tatsumi PA' }, pref: '東京都江東区', desc: { ko: '예정', ja: '予定', en: 'Planned' } },
  { id: 'shibaura', status: 'planned', name: { ko: '시바우라 PA', ja: '芝浦PA', en: 'Shibaura PA' }, pref: '東京都港区', desc: { ko: '예정', ja: '予定', en: 'Planned' } },
  { id: 'umihotaru', status: 'live', name: { ko: '우미호타루 PA', ja: '海ほたるPA', en: 'Umihotaru PA' }, pref: '東京湾アクアライン', desc: { ko: '도쿄만 한가운데 배 모양 PA. 해저 터널을 빠져나오면 바로 나와요.', ja: '東京湾の真ん中に浮かぶ船の形のPA。海底トンネルを抜けるとすぐ。', en: 'The ship-shaped PA in the middle of Tokyo Bay, right where the undersea tunnel surfaces.' } },
];

export const LANGS = [
  ['ko', '한국어'], ['ja', '日本語'], ['en', 'English'], ['zh-CN', '简体中文'], ['zh-TW', '繁體中文'],
  ['fr', 'Français'], ['es', 'Español'], ['de', 'Deutsch'], ['it', 'Italiano'], ['pt', 'Português'],
  ['nl', 'Nederlands'], ['pl', 'Polski'], ['tr', 'Türkçe'], ['sv', 'Svenska'], ['ru', 'Русский'],
  ['th', 'ไทย'], ['vi', 'Tiếng Việt'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu'], ['fil', 'Filipino'],
];
