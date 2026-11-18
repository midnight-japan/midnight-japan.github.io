// Shared game metadata: version, changelog, regions. Update VERSION + CHANGELOG on every release.
export const GAME = { title: 'MIDNIGHT JAPAN', titleJa: 'ミッドナイト・ジャパン', version: '2.13.1', build: '2026.11.18' };

// Newest first. type: new | change | fix | known
export const CHANGELOG = [
  {
    version: '2.13.1', date: '2026-11-18', codename: 'Way Out',
    summary: { ko: '버그 수정: 대흑 PA 주차장에서 자율주행이 보이지 않는 벽에 막히거나 옆 칸 주차 차량을 길막으로 오인해 멈추던 문제를 고쳤습니다.', ja: '不具合修正：大黒PAの駐車場で自動運転が見えない壁に止まったり、隣の駐車車両を障害物と誤認して止まる問題を修正しました。', en: 'Bug fixes: the autopilot no longer stops at an invisible wall in the Daikoku PA car park or mistakes cars in the neighbouring bays for obstacles.' },
    items: [
      { type: 'fix', ko: 'PA 주차장 경계와 출구 차선 사이에 폭 1칸의 “보이지 않는 벽”이 있던 문제(실제 펜스는 그대로 막힘)', ja: 'PA駐車場の縁と出口レーンの間にあった幅1マスの「見えない壁」を解消（実際のフェンスはそのまま）', en: 'A one-cell “invisible wall” between the PA car park edge and the exit lane is gone (the real fence still blocks)' },
      { type: 'fix', ko: '자율주행: 주차칸에서 나올 때 통로 건너편·옆 칸 차량을 길막으로 오인하던 문제, 통로에 다 나온 뒤 회전하도록 수정, 붐비는 주차장에서 세 번 막히면 출구 차선에서 이어가기 — 탈출 성공률 2/4 → 4/4', ja: '自動運転：駐車枠から出るとき通路の向かいや隣の車を障害物と誤認する問題を修正、通路に出てから曲がるように、混雑時は3回詰まると出口レーンから再開 — 脱出成功率 2/4 → 4/4', en: 'Autopilot: no longer mistakes cars across the aisle or in the next bay for obstacles, turns only once fully in the aisle, and in a packed car park continues from the exit lane after three tries — escape rate 2/4 → 4/4' },
      { type: 'change', ko: '점검: 사이트 6개 페이지(PC·휴대폰), 메뉴·지도·차고·날씨·계절·용어집, 스폰 15곳, 플레이 가능 차량 전부(실제 모델·바퀴 4개), 2분 자율주행, 하차·탑승에서 오류 없음 확인', ja: '点検：サイト6ページ（PC・スマホ）、メニュー・地図・ガレージ・天気・季節・用語集、スポーン15か所、全プレイアブル車両（実車モデル・タイヤ4本）、2分間の自動運転、降車・乗車でエラーなしを確認', en: 'Checked: 6 site pages (desktop and phone), menus, map, garage, weather, season, glossary, all 15 spawns, every playable car (real model, 4 wheels), a 2-minute autopilot drive, getting out and back in — no errors' },
    ],
  },
  {
    version: '2.13.0', date: '2026-11-18', codename: 'Garage 43',
    summary: { ko: '실제 차량 모델 14종 추가(총 43종) — S13 실비아, S2000, 로드스터 ND, RX-8, RX-7 FC, 인테그라 타입R, LFA, 왜건R, 허슬러, 엑스트레일, 어코드, 하이젯, 액티, 엘프. NPC용 저폴리곤 모델과 격자 컬링으로 저화질 60fps, 일본 지도에 47개 도도부현, 스폰 지역 지도 미리보기.', ja: '実車モデルを14車種追加（計43車種）— S13シルビア、S2000、ロードスターND、RX-8、RX-7 FC、インテグラ タイプR、LFA、ワゴンR、ハスラー、エクストレイル、アコード、ハイゼット、アクティ、エルフ。NPC用の軽量モデルとセル単位のカリングで低画質60fps、日本地図に47都道府県、スポーン地点の地図プレビュー。', en: '14 more real car models (43 in all) — S13 Silvia, S2000, Roadster ND, RX-8, RX-7 FC, Integra Type R, LFA, Wagon R, Hustler, X-Trail, Accord, Hijet, Acty, Elf. Low-poly NPC models and cell culling give 60 fps on Low, 47 prefectures on the Japan map, and a map preview of your spawn.' },
    items: [
      { type: 'new', ko: '실제 모델 14종(CC-BY, 순정 위주): 닛산 실비아 S13, 혼다 S2000(AP1), 마쓰다 로드스터(ND), RX-8, RX-7 FC, 혼다 인테그라 타입R(DC2), 렉서스 LFA, 스즈키 왜건R, 허슬러, 닛산 엑스트레일, 혼다 어코드 — 그리고 NPC 교통용 다이하쓰 하이젯, 혼다 액티, 이스즈 엘프. 모두 바퀴가 따로 굴러가고 번호판·라이트가 붙음', ja: '実車モデル14車種（CC-BY、ノーマル中心）：日産シルビアS13、ホンダS2000（AP1）、マツダ ロードスター（ND）、RX-8、RX-7 FC、ホンダ インテグラ タイプR（DC2）、レクサスLFA、スズキ ワゴンR、ハスラー、日産エクストレイル、ホンダ アコード — NPC交通用にダイハツ ハイゼット、ホンダ アクティ、いすゞ エルフ。すべてタイヤが回り、ナンバーとライト付き', en: '14 real models (CC-BY, mostly stock): Nissan Silvia S13, Honda S2000 (AP1), Mazda Roadster (ND), RX-8, RX-7 FC, Honda Integra Type R (DC2), Lexus LFA, Suzuki Wagon R, Hustler, Nissan X-Trail, Honda Accord — plus Daihatsu Hijet, Honda Acty and Isuzu Elf in traffic. All with spinning wheels, plates and lights' },
      { type: 'change', ko: '모델 품질 기준: 게임에서 추출한 모델(포르자 재질명 등), 레이싱 래핑·밈 스티커, 바퀴 분리 불가, 출처 불확실 모델은 제외', ja: 'モデル品質基準：ゲームから抽出したモデル（Forzaのマテリアル名など）、レース用ラッピング・ミームステッカー、タイヤ分離不可、出所が不確かなモデルは除外', en: 'Model rules: anything extracted from games (Forza material names …), race liveries / meme decals, wheels that can’t be separated or unclear provenance is left out' },
      { type: 'change', ko: '최적화: NPC 차량은 저폴리곤 버전(평균 3만 삼각형) 사용, 도로 설비·소품·표지판·하코네 나무와 풀을 격자 단위로 컬링 — 저화질 기준 PA 1,700만→320만, 시내 1,100만→320만, 하코네 490만→280만 삼각형으로 60fps', ja: '最適化：NPC車両は軽量版（平均3万三角形）、道路設備・小物・標識・箱根の木と草をセル単位でカリング — 低画質でPA 1,700万→320万、街 1,100万→320万、箱根 490万→280万三角形で60fps', en: 'Optimisation: NPC cars use low-poly versions (~30k triangles), road furniture, props, signs and Hakone trees/grass are culled per cell — on Low: PA 17M→3.2M, city 11M→3.2M, Hakone 4.9M→2.8M triangles, 60 fps' },
      { type: 'new', ko: '일본 전체 지도에 47개 도도부현 경계·이름, 타이틀의 스폰 지역 선택 시 실제 지도 미리보기와 출발 방향 화살표', ja: '日本全図に47都道府県の境界と名前、タイトルのスポーン地点選択で実際の地図プレビューと出発方向の矢印', en: 'The Japan map shows all 47 prefectures; choosing a spawn on the title screen shows a real map preview with the direction you set off in' },
    ],
  },
  {
    version: '2.12.0', date: '2026-11-18', codename: 'Kei Truck',
    summary: { ko: '실제 모델 경트럭 스즈키 캐리 추가(원본 실내 그대로 콕핏), 차·일본 도로를 몰라도 이해할 수 있는 용어 사전, 새 게임 아이콘.', ja: '実車モデルの軽トラ、スズキ・キャリイを追加（純正インテリアのままのコクピット）、クルマや日本の道を知らなくても分かる用語集、新しいアイコン。', en: 'A real-model Suzuki Carry kei truck (with its own cab as the cockpit), a plain-language glossary for anyone new to cars or Japanese roads, and a new game icon.' },
    items: [
      { type: 'new', ko: '스즈키 캐리 트럭(DD51T): 실내·계기판·핸들까지 있는 고품질 모델(CC-BY), 콕핏은 원본 실내 그대로. 시내·도로에도 경트럭이 달림', ja: 'スズキ・キャリイ トラック（DD51T）：室内・メーター・ハンドルまである高品質モデル（CC-BY）、コクピットは純正の室内そのまま。街や道路にも軽トラが走る', en: 'Suzuki Carry truck (DD51T): a detailed model with full cab, gauges and wheel (CC-BY); the cockpit is its own real cab. Kei trucks now drive around town too' },
      { type: 'new', ko: '용어 사전(📖, 메뉴): 완간선·수도고·C1·PA·JCT·ETC·토게·비상주차대·차선규제, 츠라이치·샤코탄·VIP·오니캔·캠버·차고조, 경차·경트럭·JDM·터보·로터리·구동방식·변속기를 쉬운 말로. 차고 스탠스 프리셋 아래에 설명, 처음 들어가는 도로에선 한 줄 안내', ja: '用語集（📖・メニュー）：湾岸線・首都高・C1・PA・JCT・ETC・峠・非常駐車帯・車線規制、ツライチ・シャコタン・VIP・鬼キャン・キャンバー・車高調、軽自動車・軽トラ・JDM・ターボ・ロータリー・駆動方式・変速機をやさしく解説。ガレージの車高プリセットの下に説明、初めて走る道路では一言ガイド', en: 'Glossary (📖, menu): the Bayshore, Shutokō, C1, PA, JCT, ETC, touge, emergency bays and lane closures; tsuraichi, shakotan, VIP, oni-camber, camber, coilovers; kei cars and trucks, JDM, turbo, rotary, drivetrains and gearboxes — in plain words. Explained under the garage stance presets, and a one-line tip the first time you drive onto a kind of road' },
      { type: 'change', ko: '새 게임 아이콘(석양과 고속도로), 이전 아이콘 교체', ja: '新しいアイコン（夕日と高速道路）、以前のアイコンを置き換え', en: 'New game icon (sunset over the expressway), replacing the old one' },
    ],
  },
  {
    version: '2.11.1', date: '2026-11-18', codename: 'Tune-up',
    summary: { ko: '버그 수정과 최적화: 제동 시 앞이 숙여지고 가속 시 뒤로 앉도록 차체 움직임 방향 수정, 그려지는 삼각형을 최대 70% 줄인 거리 컬링, 추적 카메라가 고가·건물을 통과하지 않게, R35 차체 반사 개선, NPC 차량 야간 조명, 일본 지도 경계 수정, 이탤릭 제거.', ja: '不具合修正と最適化：ブレーキで前が沈み加速で後ろが沈むよう車体の動きの向きを修正、描画する三角形を最大70%減らす距離カリング、追従カメラが高架や建物を突き抜けないように、R35の車体反射を改善、NPC車両の夜間ライト、日本地図の境界を修正、イタリック体を廃止。', en: 'Fixes and optimisation: the nose now dives under braking and squats on throttle (it was reversed), distance culling draws up to 70% fewer triangles, the chase camera no longer passes through decks or buildings, smoother R35 paint reflections, NPC car lights at night, a correct Japan outline on the map, upright text.' },
    items: [
      { type: 'fix', ko: '차체 피치·롤 방향 반전 수정(제동=앞 숙임, 가속=뒤 앉음, 코너 바깥쪽으로 기울기), 언덕/공중 서스펜션 방향 수정', ja: '車体のピッチ・ロールの向きを修正（ブレーキ＝前が沈む、加速＝後ろが沈む、コーナーで外側に傾く）、起伏・ジャンプ時のサスペンションの向きも修正', en: 'Body pitch and roll were reversed — braking now dips the nose, throttle squats the rear, the body leans out of a corner; crest/air suspension travel fixed too' },
      { type: 'change', ko: '최적화: 도로망을 1.5km 격자로 나눠 화면 밖·먼 구간 생략, 하코네는 근처에서만 렌더링, 멀리 있는 NPC 차량 생략 — 장면 삼각형 2,000만~4,600만 → 1,100만~1,700만', ja: '最適化：道路網を1.5kmのマスに分けて画面外・遠方を省略、箱根は近くでのみ描画、遠くのNPC車両を省略 — シーンの三角形 2,000万〜4,600万 → 1,100万〜1,700万', en: 'Optimisation: the road network is split into 1.5 km cells (off-screen and far cells skipped), Hakone only renders nearby, far NPC cars are skipped — scene triangles 20–46 M → 11–17 M' },
      { type: 'fix', ko: '추적 카메라가 위쪽 고가 상판이나 건물·교각을 통과하지 않고 낮추거나 가까이 붙음', ja: '追従カメラが上の高架や建物・橋脚を突き抜けず、低くなるか近づく', en: 'The chase camera drops under an overhead deck or moves in rather than passing through decks, buildings and piers' },
      { type: 'fix', ko: 'R35 등 차체 반사가 구겨진 은박지처럼 보이던 문제(차체 노멀 재계산), 메탈릭 도장 반사를 실제 수준으로', ja: 'R35などの車体反射がしわくちゃのアルミ箔のように見えた問題（法線を再計算）、メタリック塗装の反射を実車並みに', en: 'Body reflections that rippled like crumpled foil (R35 and others) — paint normals recomputed; metallic paint toned to real-car levels' },
      { type: 'fix', ko: 'NPC 차량 야간 전조등·미등 점등, 낙엽·꽃잎은 낙엽이 깔린 토게에서만 튐, 일본 전체 지도에서 일본 외 지역(한반도 연안 섬 등) 제거, 사이트·게임 텍스트 이탤릭 제거', ja: 'NPC車両の夜間ヘッドライト・テールライト点灯、落ち葉・花びらは落ち葉の積もった峠でのみ舞う、日本全図から日本以外の地域を除去、サイト・ゲームのイタリック体を廃止', en: 'NPC cars light up at night; petals/leaves only kick up on the leaf-strewn touge; non-Japanese coasts removed from the Japan map; no more italic text' },
    ],
  },
  {
    version: '2.11.0', date: '2026-11-18', codename: 'Festival',
    summary: { ko: '웹사이트와 게임 UI를 완전히 새 디자인으로: 카본 블랙에 마젠타→오렌지 그라데이션, 사선 버튼과 각진 패널, 굵은 이탤릭 타이포. NPC 차량에 운전자가 타고, 새 대표 스크린샷.', ja: 'サイトとゲームUIをまったく新しいデザインに：カーボンブラックにマゼンタ→オレンジのグラデーション、斜めのボタンと角を落としたパネル、太いイタリック。NPCの車に運転手が乗り、新しいスクリーンショット。', en: 'A completely new look for the site and the in-game UI: carbon black with a magenta-to-orange gradient, slanted buttons, cut-corner panels and bold italic type. NPC cars now have drivers, plus new screenshots.' },
    items: [
      { type: 'change', ko: '웹사이트 전면 리디자인: 새 첫 화면(벚꽃 토게), 사선 버튼, 각진 카드, 사선 섹션 구분, 그라데이션 포인트', ja: 'サイトを全面リデザイン：新しいトップ（桜の峠）、斜めのボタン、角を落としたカード、斜めのセクション区切り、グラデーションのアクセント', en: 'Site redesign: new hero (the cherry-blossom touge), slanted buttons, cut-corner cards, diagonal section bands, gradient accents' },
      { type: 'change', ko: '게임 UI 리디자인: 타이틀·메뉴·팝업·HUD 버튼·지도 패널·알림을 같은 디자인 언어로, 반짝임·글로우 효과는 걷어내 눈이 편안하게', ja: 'ゲームUIをリデザイン：タイトル・メニュー・ポップアップ・HUDボタン・地図パネル・通知を同じデザイン言語に、キラキラやグロー効果は外して目にやさしく', en: 'In-game UI redesign: title, menus, pop-ups, HUD buttons, map panels and toasts in the same language; shine/glow effects removed for a calmer look' },
      { type: 'new', ko: 'NPC 차량 운전석에 운전자 탑승(주차 중엔 빈 좌석)', ja: 'NPCの車の運転席に運転手（駐車中は空席）', en: 'NPC cars have a driver at the wheel (empty seat when parked)' },
      { type: 'change', ko: 'GitHub README 갱신: 새 대표 이미지와 v2.6~v2.11 요약', ja: 'GitHubのREADMEを更新：新しいメイン画像とv2.6〜v2.11の要約', en: 'GitHub README refreshed: new header image and a v2.6–v2.11 summary' },
    ],
  },
  {
    version: '2.10.0', date: '2026-11-18', codename: 'Living City',
    summary: { ko: '살아 있는 거리: 스포츠카가 지나가면 멈춰서 촬영하거나 손 흔드는 사람, 스마트폰 보는 사람, 나란히 걷는 커플. 수도고 야간 도로공사(추월차선 규제)가 일정 시간 생겼다 철수하고, 차가 벚꽃잎·낙엽을 흩날립니다.', ja: '生きた街：スポーツカーが通ると立ち止まって撮影したり手を振る人、スマホを見る人、並んで歩くカップル。首都高の夜間工事（右車線規制）が一定時間現れて撤収し、車が桜の花びらや落ち葉を舞い上げます。', en: 'A living street: people stop to film or wave at a passing sports car, check their phones, couples walk side by side. Shutokō night road works (right-lane closures) come and go, and your car kicks up cherry petals and fallen leaves.' },
    items: [
      { type: 'new', ko: '보행자 성격: 차 마니아(스포츠카가 지나가거나 회전수를 올리면 멈춰 폰으로 촬영·손 흔들기), 걷다 멈춰 스마트폰 보기, 커플은 같은 속도로 나란히 걷기, 비 오면 우산', ja: '歩行者の個性：クルマ好き（スポーツカーの通過や空ぶかしで立ち止まり撮影・手を振る）、立ち止まってスマホ、カップルは並んで同じ歩調で、雨なら傘', en: 'Pedestrian characters: car fans film or wave at a sports car going by (or revving), people stop to check their phones, couples walk side by side, umbrellas in the rain' },
      { type: 'new', ko: '도로공사: 고속도로 앞쪽에 추월차선 규제(1차로는 유지) — 60m 라바콘 테이퍼, 깜빡이는 화살표 트럭, 500m·200m 전 「この先 工事中 / 右車線規制」 표지. 2.5~5.5분 뒤 철수, 밤에 더 자주. AI 차량과 자율주행이 미리 차선 변경', ja: '道路工事：前方の高速道路で右車線規制（第一通行帯は維持）— 60mのコーンのテーパー、点滅する矢印板車、500m・200m手前に「この先 工事中／右車線規制」。2.5〜5.5分で撤収、夜ほど多い。AIと自動運転は早めに車線変更', en: 'Road works: a right-lane closure ahead on the expressway (the travel lane stays open) — 60 m cone taper, blinking arrow-board truck, 「この先 工事中 / 右車線規制」 boards 500 m and 200 m before. Packed up after 2.5–5.5 min, more often at night; AI traffic and the autopilot move over early' },
      { type: 'new', ko: '봄엔 벚꽃잎, 가을엔 낙엽이 차 뒤로 흩날림(하코네 토게에서 가장 많이)', ja: '春は桜の花びら、秋は落ち葉が車の後ろに舞う（箱根の峠で最も多く）', en: 'Cherry petals in spring and fallen leaves in autumn swirl up behind the car (most on the Hakone touge)' },
    ],
  },
  {
    version: '2.9.0', date: '2026-11-18', codename: 'Four Seasons',
    summary: { ko: '사계절 도입(봄 벚꽃 흩날리는 토게, 여름 신록, 가을 단풍, 겨울 앙상한 나무와 눈), 하코네 턴파이크에 비상주차대·주차대, 편의점 앞 아스팔트 주차장과 실제 편의점 브랜드, 콕핏·모바일 버그 수정.', ja: '四季を導入（春は桜吹雪の峠、夏は新緑、秋は紅葉、冬は葉の落ちた木と雪）、箱根ターンパイクに非常駐車帯・駐車帯、コンビニ前のアスファルト駐車場と実在のコンビニ、コクピットとスマホの不具合を修正。', en: 'Four seasons (cherry petals on the touge in spring, summer green, autumn colour, bare trees and snow in winter), emergency bays and parking strips on the Hakone Turnpike, asphalt car parks and real chains at convenience stores, cockpit and phone fixes.' },
    items: [
      { type: 'new', ko: '계절 버튼(🗓/🌸/🌿/🍁/❄️): 자동(현재 날짜)·봄·여름·가을·겨울. 나무 색이 계절 따라 바뀌고 겨울엔 낙엽수가 앙상해짐. 봄엔 벚꽃잎, 가을엔 낙엽이 날리고, 겨울엔 비 대신 눈', ja: '季節ボタン（🗓/🌸/🌿/🍁/❄️）：自動（今日の日付）・春・夏・秋・冬。木の色が季節で変わり、冬は落葉樹が裸に。春は桜の花びら、秋は落ち葉が舞い、冬は雨の代わりに雪', en: 'Season button (🗓/🌸/🌿/🍁/❄️): auto (today), spring, summer, autumn, winter. Trees change colour, deciduous trees go bare in winter; cherry petals in spring, falling leaves in autumn, snow instead of rain in winter' },
      { type: 'new', ko: '하코네 턴파이크: 완만한 직선 구간마다 비상주차대(非常駐車帯)·주차대(駐車帯) 10곳 — 가드레일 개구부, 성토 옹벽, 표지판. 아래 구간 도로변엔 벚나무 가로수, 위쪽엔 단풍', ja: '箱根ターンパイク：緩やかな直線ごとに非常駐車帯・駐車帯を10か所 — ガードレールの切れ目、盛土の擁壁、標識。下の区間は桜並木、上はモミジ', en: 'Hakone Turnpike: 10 emergency bays and parking strips on gentle straights — guardrail openings, embankment walls, signs; cherry trees line the lower road, maples higher up' },
      { type: 'new', ko: '도시 편의점: 실제 브랜드(LAWSON·FamilyMart·7-ELEVEN, 이름과 색만), 가게 앞 아스팔트 주차장과 P 표지판. 대흑 PA 편의점도 LAWSON', ja: '街のコンビニ：実在ブランド（LAWSON・FamilyMart・7-ELEVEN、名前と色のみ）、店前のアスファルト駐車場とP標識。大黒PAのコンビニもLAWSONに', en: 'City convenience stores: real chains (LAWSON, FamilyMart, 7-ELEVEN — name and colour only), an asphalt car park and P sign out front; the Daikoku PA store is a LAWSON' },
      { type: 'fix', ko: '콕핏: GR86 앞유리가 검게 막히던 문제, 왼쪽 핸들 원본 모델의 실내가 남던 문제. 실내 품질이 낮은 닛산 리프 퇴출', ja: 'コクピット：GR86のフロントガラスが黒くふさがる問題、左ハンドル元モデルの室内が残る問題を修正。室内品質の低い日産リーフを除外', en: 'Cockpit: GR86 windscreen was blacked out; left-hand-drive source cabins showed through. The low-quality Nissan Leaf model is retired' },
      { type: 'fix', ko: '모바일: 실제 차량 모델을 받는 동안 임시 차량이 보이던 문제(타이틀 화면에서 미리 받음), 세로 화면에서 페달·핸들 버튼 겹침, 상단 버튼을 하나의 툴바로 정리', ja: 'スマホ：実車モデルの読み込み中に仮の車が見えた問題（タイトル画面で先読み）、縦画面でペダルとハンドルのボタンが重なる問題、上部ボタンを1本のツールバーに整理', en: 'Phones: no stand-in car while the real model loads (preloaded on the title screen), portrait pedals/steering no longer overlap, top buttons in one toolbar' },
    ],
  },
  {
    version: '2.8.0', date: '2026-11-18', codename: 'Autumn Leaves',
    summary: { ko: '나무를 전부 새로 만들었습니다: 은행·느티나무·벚나무·녹나무·곰솔·삼나무·단풍나무가 지역과 11월 단풍색에 맞게 서 있고, 하코네엔 황금빛 억새가 핍니다. 은빛 구름 가장자리와 권운, 곡선 가로등, 수도고식 교각, 회색 콘크리트 지면.', ja: '木をすべて作り直しました：イチョウ・ケヤキ・サクラ・クスノキ・クロマツ・スギ・モミジが地域と11月の紅葉色に合わせて並び、箱根には黄金色のススキ。雲の銀の縁取りと巻雲、曲線の街灯、首都高らしい橋脚、灰色のコンクリート地面。', en: 'Every tree is new: ginkgo, zelkova, cherry, camphor, black pine, cedar and maple stand by region in November colours, with golden susuki grass in Hakone. Silver-lined clouds and cirrus, swan-neck street lamps, Shutokō-style pier heads, grey concrete ground.' },
    items: [
      { type: 'new', ko: '수종별 나무 7종(잎 다발 카드 + 가지): 가로수는 은행·느티나무, 공원은 벚나무·녹나무, 해안은 곰솔, 하코네는 삼나무·단풍 — 도시 전체·PA·하코네 공통', ja: '樹種別の木7種（葉の房のカード＋枝）：街路樹はイチョウ・ケヤキ、公園はサクラ・クスノキ、海沿いはクロマツ、箱根はスギ・モミジ — 街全体・PA・箱根で共通', en: 'Seven tree species (leaf-spray cards on real limbs): ginkgo and zelkova avenues, cherry and camphor in parks, black pine by the sea, cedar and maple in Hakone — city-wide, the PA and Hakone' },
      { type: 'new', ko: '하코네 도로변 억새·조릿대 풀(품질별 2,500~14,000포기), 하코네 지형 풀 텍스처가 제대로 보이도록 수정', ja: '箱根の道路沿いにススキ・ササ（画質別に2,500〜14,000株）、箱根の地形の草テクスチャが正しく見えるよう修正', en: 'Hakone roadside susuki and bamboo grass (2,500–14,000 tufts by quality); Hakone terrain grass texture fixed (it was stretched to flat brown)' },
      { type: 'new', ko: '하늘: 태양 쪽 구름 가장자리가 은빛으로 빛나고, 높은 권운층 추가', ja: '空：太陽側の雲の縁が銀色に光り、高層の巻雲を追加', en: 'Sky: cloud edges glow silver towards the sun, plus a high cirrus layer' },
      { type: 'change', ko: '네모 오브젝트 정리: 가로등은 곡선 암 + 타원형 등기구, 교각 머리는 양끝이 얇아지는 수도고식 T형', ja: '四角いオブジェクトを整理：街灯は曲線アーム＋楕円の灯具、橋脚の頭部は両端が細くなる首都高のT形', en: 'No more boxes: swan-neck lamp arms with oval luminaires, tapered Shutokō T-pier heads' },
      { type: 'fix', ko: '맵 전체 지면이 갈색 흙처럼 보이던 문제(벽용 텍스처 사용) → 회색 바닥 콘크리트', ja: 'マップ全体の地面が茶色の土に見えた問題（壁用テクスチャを使用）→ 灰色の床コンクリート', en: 'Ground across the map looked like brown earth (a wall texture) → grey floor concrete' },
    ],
  },
  {
    version: '2.7.1', date: '2026-11-18', codename: 'Wayfinder',
    summary: { ko: '지도에서 일본 전체를 볼 수 있고, 사진·방향·거리가 보이는 빠른 이동 카드로 텔레포트가 쉬워졌습니다. 내비가 PA 주차장에서도 하네다·하코네·C1까지 경로를 찾고, 자율주행이 그 경로를 따라갑니다.', ja: '地図で日本全体を見渡せ、写真・方向・距離が分かるクイック移動カードでテレポートが簡単に。ナビがPAの駐車場からも羽田・箱根・C1までルートを見つけ、自動運転がそのルートをたどります。', en: 'The map zooms out to all of Japan, and quick-travel cards with a photo, direction and distance make teleporting easy. GPS now routes from the PA car park to Haneda, Hakone and C1, and the autopilot follows the route.' },
    items: [
      { type: 'new', ko: '일본 전체 지도(🗾 버튼): 해안선과 주요 도시 51곳, 플레이 지역 표시', ja: '日本全体の地図（🗾ボタン）：海岸線と主要51都市、プレイエリアを表示', en: 'All-Japan map (🗾 button): coastline, 51 major cities and the drivable area' },
      { type: 'new', ko: '빠른 이동: 13개 목적지 카드에 실제 게임 화면 사진, 현재 진행 방향 기준 화살표, 방위와 거리. 고르면 그 자리에서 진행 방향을 골라 출발', ja: 'クイック移動：13か所の目的地カードにゲーム画面の写真、進行方向基準の矢印、方位と距離。選ぶとその場で進行方向を選んで出発', en: 'Quick travel: 13 destination cards with an in-game photo, an arrow relative to your heading, compass point and distance; pick one, then pick the direction to set off in' },
      { type: 'fix', ko: '내비: PA 주차장 등 고속도로 밖에서도 경로 탐색, 왕복 도로 끝(완안선 하네다 쪽 등) 연결 — 하네다·하코네·C1 경로가 안 잡히던 문제 수정', ja: 'ナビ：PA駐車場など高速道路の外からもルート探索、往復道路の端（湾岸線の羽田側など）の接続 — 羽田・箱根・C1のルートが出なかった不具合を修正', en: 'GPS: routes from off the expressway (PA car park) and across two-way road ends (Bayshore at Haneda) — Haneda, Hakone and C1 routes now found' },
      { type: 'fix', ko: '자율주행: 목적지가 있으면 분기점에서 경로대로 진행(출구 포함), 주차장에서 통로로 먼저 나간 뒤 이동, 서 있는 사람·통로 건너편 차 때문에 멈추던 문제 수정', ja: '自動運転：目的地があれば分岐でルート通りに進行（出口を含む）、駐車場では通路に出てから移動、立っている人や通路向かいの車で止まる不具合を修正', en: 'Autopilot: follows the GPS route at junctions (exits included), leaves a bay into the aisle first, no longer stops for people standing about or cars across the aisle' },
    ],
  },
  {
    version: '2.7.0', date: '2026-11-18', codename: 'Real Cars',
    summary: { ko: '애매한 차량 모델 12종을 정리해 실제 모델이 있는 차만 남기고, 차가 노면에 붙어 달리도록 수직 물리와 노면별 접지력을 새로 만들었습니다.', ja: '曖昧な車両モデル12車種を整理して実在のモデルがある車だけを残し、車が路面に張り付いて走るよう上下方向の物理と路面ごとのグリップを作り直しました。', en: 'Twelve vague car models retired so only cars with real models remain, and new vertical physics and per-surface grip keep the car planted on the road.' },
    items: [
      { type: 'change', ko: '절차 생성·카툰풍·로우폴리 차량 정리(로드스터, S2000, 코펜, S660, N-BOX, 사쿠라, 프리우스, 에브리, 알토웍스, 짐니, LFA, 하이에이스) — 실제 모델이 있는 29대만 남김', ja: '手続き生成・トゥーン調・ローポリの車両を整理（ロードスター、S2000、コペン、S660、N-BOX、サクラ、プリウス、エブリイ、アルトワークス、ジムニー、LFA、ハイエース）— 実在モデルのある29台だけに', en: 'Procedural, cartoon and low-poly cars retired (Roadster, S2000, Copen, S660, N-BOX, Sakura, Prius, Every, Alto Works, Jimny, LFA, HiAce) — 29 cars with real models remain' },
      { type: 'fix', ko: '공장 기본 도색: R33 형광 휠 → 순정 실버, JZA80 초록 데칼 제거', ja: 'メーカー標準塗装：R33の蛍光ホイール→純正シルバー、JZA80の緑デカールを除去', en: 'Factory finish: R33 lime rims → stock silver, JZA80 green livery removed' },
      { type: 'new', ko: '수직 물리: 고속으로 언덕 정점을 넘으면 차가 가벼워지고, 움푹한 곳에선 눌리며, 그 하중이 타이어 접지력에 반영. 노면별 접지(고속도로·일반도로·산길·비포장), 빗길 고속 수막현상, 노면별 진동', ja: '上下方向の物理：高速で頂点を越えると車が軽くなり、くぼみでは沈み込み、その荷重がタイヤのグリップに反映。路面ごとのグリップ（高速・一般道・山道・未舗装）、雨天高速でのハイドロプレーニング、路面ごとの振動', en: 'Vertical physics: crests taken fast make the car light, dips press it down, and that load sets tyre grip. Per-surface grip (expressway, street, mountain, off-tarmac), aquaplaning at speed in the rain, per-surface vibration' },
      { type: 'fix', ko: '자율주행: 주차된 차가 막으면 옆으로 돌아가고, 오래 막히면 경로 재계산(이전엔 주차장에서 영구 정지)', ja: '自動運転：駐車車両にふさがれたら横を回り込み、長く止まったら経路を再計算（以前は駐車場で永久停止）', en: 'Autopilot: steers round a parked car blocking the lot route and replans when stuck (it used to stop for good in the car park)' },
    ],
  },
  {
    version: '2.6.1', date: '2026-11-18', codename: 'Clear Road',
    summary: { ko: '도로망 전수 점검: 데크가 서로 뚫고 지나가던 15곳, 접속부 단차, 지상 도로를 가로막던 램프 방호벽을 모두 수정하고 램프의 급경사·덜컹임을 완화했습니다.', ja: '道路網を全数点検：デッキ同士がめり込んでいた15か所、接続部の段差、地上の道路をふさいでいたランプの防護壁をすべて修正し、ランプの急勾配とガタつきを緩和しました。', en: 'Full road-network audit: 15 places where decks cut through each other, a junction step and a ramp wall blocking a street are fixed, and steep, jolting ramps are smoothed.' },
    items: [
      { type: 'fix', ko: '다이코쿠 JCT: K5 하행 끝이 반대 방향 상층 데크 높이로 끌려 올라가던 버그 수정 → K5→완안선 램프가 다시 고가에서 분기하고, 다이코쿠 부두 지상 도로를 가로막던 벽이 사라짐', ja: '大黒JCT：K5下り線の終点が反対方向の上層デッキの高さまで引き上げられていた不具合を修正 → K5→湾岸線ランプが再び高架から分岐し、大黒ふ頭の地上道路をふさいでいた壁が消えた', en: 'Daikoku JCT: the end of K5 southbound was hauled up to the opposite-direction upper deck — fixed, so the K5→Bayshore ramp leaves the viaduct again and the wall across the Daikoku-futō street is gone' },
      { type: 'fix', ko: '머리 위 여유 높이 부족 자동 보정: 다이시 출구(K1 아래 3.6m), 이시카와초 JCT K3→K1 램프, 도심환상선 겹친 터널 — 최소 5m(터널 7.2m) 확보', ja: '頭上クリアランス不足を自動補正：大師出口（K1の下3.6m）、石川町JCTのK3→K1ランプ、都心環状線の重なったトンネル — 最低5m（トンネルは7.2m）を確保', en: 'Headroom auto-fix: Daishi exit (3.6 m under K1), the Ishikawachō K3→K1 ramp and the stacked C1 tunnels now keep at least 5 m (7.2 m in tunnels)' },
      { type: 'fix', ko: '나마무기: K1 본선이 합류 램프 높이를 따라가며 생기던 1m 단차 제거, 램프 끝이 지상 도로와 만나는 곳의 턱 제거', ja: '生麦：K1本線が合流ランプの高さに引っ張られてできていた1mの段差を解消、ランプの末端が地上道路と交わる所の段差も解消', en: 'Namamugi: a 1 m step where K1 followed a merging ramp\'s height is gone; ramp feet now meet street level flush' },
      { type: 'change', ko: '램프 종단 다듬기: 급격한 경사 변화 44→23곳, 12% 이상 급경사 16→5곳, 분기·합류 이음부 블렌딩 30→60m', ja: 'ランプの縦断を整形：急な勾配変化44→23か所、12%超の急勾配16→5か所、分岐・合流部のつなぎを30→60mに', en: 'Ramp profiles faired: sudden grade breaks 44→23, steep (>12 %) spots 16→5, join blends 30→60 m' },
    ],
  },
  {
    version: '2.6.0', date: '2026-11-14', codename: 'Skyline',
    summary: { ko: '후지산처럼 도쿄 랜드마크가 멀리서도 선명하게: 도쿄도청·신주쿠 초고층군·롯폰기힐스·미드타운·아자부다이힐스·도라노몬힐스·요코하마 랜드마크타워 추가, 야간 조명과 30km 밖에서도 보이는 항공장애등, 덜 뿌연 공기·밝아진 밤, 창고 외벽 디테일, 무게감 있는 차체 움직임과 수도고 이음매 진동.', ja: '富士山のように東京のランドマークが遠くからでもくっきり：東京都庁・西新宿の超高層群・六本木ヒルズ・ミッドタウン・麻布台ヒルズ・虎ノ門ヒルズ・横浜ランドマークタワーを追加、夜のライトアップと30km先でも見える航空障害灯、霞を薄く・夜を明るく、倉庫の外壁ディテール、重みのある車体の動きと首都高の継ぎ目。', en: 'Tokyo landmarks read from far away like Mt Fuji: Tochō, the West Shinjuku towers, Roppongi Hills, Midtown, Azabudai Hills, Toranomon Hills and Yokohama Landmark Tower added, night lighting and aviation lights visible from 30 km, clearer air and brighter nights, detailed warehouses, weighty body motion and Shutokō expansion joints.' },
    items: [
      { type: 'new', ko: '도쿄 스카이라인 랜드마크 추가: 도쿄도청(쌍둥이 타워), 니시신주쿠 초고층군, 롯폰기힐스 모리타워, 도쿄 미드타운, 아자부다이힐스(325m), 도라노몬힐스, 요코하마 랜드마크타워 — 층별 조명과 왕관 조명', ja: '東京スカイラインのランドマークを追加：東京都庁（ツインタワー）、西新宿の超高層群、六本木ヒルズ森タワー、東京ミッドタウン、麻布台ヒルズ（325m）、虎ノ門ヒルズ、横浜ランドマークタワー — フロアの灯りと頂部のライトアップ', en: 'Skyline landmarks added: Tochō twin towers, the West Shinjuku cluster, Roppongi Hills Mori Tower, Tokyo Midtown, Azabudai Hills (325 m), Toranomon Hills, Yokohama Landmark Tower — lit floors and crown lights' },
      { type: 'change', ko: '랜드마크 가시성: 도쿄타워·스카이트리·게이트브리지·코스모클락·마린타워가 후지산처럼 안개를 뚫고 보이고, 실제 3D 모델은 마지막 1.5~2.5km에서만 교대', ja: 'ランドマークの視認性：東京タワー・スカイツリー・ゲートブリッジ・コスモクロック・マリンタワーが富士山のように霞を抜けて見え、実際の3Dモデルへの切替は最後の1.5〜2.5kmだけ', en: 'Landmark visibility: Tokyo Tower, Skytree, Gate Bridge, Cosmo Clock and Marine Tower cut through the haze like Mt Fuji; the surveyed 3D model only takes over in the last 1.5–2.5 km' },
      { type: 'change', ko: '항공장애등을 하나의 드로우콜로 통합(170개 메시 → 1), 거리와 상관없이 픽셀 크기로 깜빡여 30km 밖에서도 보임', ja: '航空障害灯を1回の描画に統合（メッシュ170個→1）、距離に関係なくピクセル単位で点滅し30km先でも見える', en: 'Aviation lights merged into one draw call (170 meshes → 1), sized in pixels so they blink visibly from 30 km' },
      { type: 'change', ko: '공기를 더 맑게, 밤을 덜 탁하게(도시광 반사), 원경 고층빌딩 야간 조명 강화', ja: '空気をより澄ませ、夜を明るく（街明かりの照り返し）、遠景の高層ビルの夜景を強化', en: 'Clearer air, less murky nights (city-glow bounce), brighter far skyline at night' },
      { type: 'change', ko: '항만 창고 외벽: 하역장 롤러 셔터, 하역등, 고창 띠, 도장된 하부', ja: '港湾倉庫の外壁：荷捌き場のシャッター、荷捌き灯、高窓の帯、塗装された腰壁', en: 'Bay-side warehouses: loading-dock roller shutters, dock lamps, clerestory windows, painted plinth' },
      { type: 'change', ko: '차체 움직임을 스프링·댐퍼로: 제동 시 노즈 다이브 후 살짝 출렁이며 안정, 코너에서 기울었다 되돌아옴 / 수도고 고가 이음매(약 38m마다) 앞바퀴→뒷바퀴 진동', ja: '車体の動きをスプリング・ダンパーで：ブレーキでノーズダイブして少し揺れて収まり、コーナーで傾いて戻る / 首都高の高架の継ぎ目（約38mごと）で前輪→後輪の振動', en: 'Body motion on springs and dampers: the nose dives and settles under braking, the body leans and rocks back in corners / Shutokō viaduct expansion joints (every ~38 m) thump front then rear' },
    ],
  },
  {
    version: '2.5.4', date: '2026-11-14', codename: 'No Dead Ends',
    summary: { ko: '맵 전체 도로 끝 자동 점검으로 끊긴 곳 모두 연결(나마무기 K1 5.6m 절벽, 다이코쿠 JCT 만안선→다이코쿠 램프, 하네다 만안선 단차, 공중에서 끝나던 츠루미·시바우라 램프), 텔레포트는 도로와 진행 방향을 골라서.', ja: 'マップ全体の道路の端を自動点検して途切れた所をすべて接続（生麦のK1・5.6mの崖、大黒JCTの湾岸線→大黒ランプ、羽田の湾岸線の段差、空中で終わっていた生麦・芝浦のランプ）、テレポートは道路と進行方向を選んで。', en: 'Every road end on the map checked automatically and every broken one joined (a 5.6 m cliff on K1 at Namamugi, the Bayshore→Daikoku ramp at Daikoku JCT, a step on the Bayshore at Haneda, the Namamugi and Shibaura ramps that ended in mid-air), and teleport now lets you pick the road and direction.' },
    items: [
      { type: 'fix', ko: '끊긴 길 전부 연결(맵 전체 자동 점검): K1 북행이 나마무기에서 19.6m 높이로 끝나고 다음 구간은 14m에서 시작하던 5.6m 절벽, 다이코쿠 JCT 「만안선→다이코쿠」 램프가 만안선 상판보다 2.7m 아래에서 시작하던 문제, 하네다에서 만안선 남행이 5m 아래에서 끝나던 단차', ja: '途切れた道をすべて接続（マップ全体を自動点検）：K1上りが生麦で高さ19.6mで終わり次の区間が14mから始まっていた5.6mの崖、大黒JCT「湾岸線→大黒」ランプが湾岸線の床版より2.7m下から始まっていた問題、羽田で湾岸線の下りが5m下で終わっていた段差', en: 'Broken roads joined (whole map checked automatically): K1 northbound ended at 19.6 m at Namamugi while the next section began at 14 m (a 5.6 m cliff), the Daikoku JCT Bayshore→Daikoku ramp started 2.7 m under the Bayshore deck, and the Bayshore southbound ended 5 m low at Haneda' },
      { type: 'fix', ko: '공중에서 끝나던 램프를 지면까지: 생麦(츠루미) 입구·시바우라 출구가 고가 높이 그대로 끝나 막다른 길이었던 것을 실제처럼 지상 도로로 내려오게', ja: '空中で終わっていたランプを地上まで：生麦入口・芝浦出口が高架の高さのまま終わり行き止まりだったのを実際のように地上へ', en: 'Ramps that ended in mid-air now reach the ground: the Namamugi entrance and the Shibaura exit stayed at viaduct height and dead-ended' },
      { type: 'change', ko: '텔레포트: 지도에서 누른 곳의 이름을 크게(플레이 언어 + 일본어), 가장 가까운 도로의 진행 방향을 「남동쪽으로 출발 · 도로 이름」처럼 골라서 그 차로에 정확히 출발 — 엉뚱한 곳에 떨어지지 않음; 근처 랜드마크 이름은 크게 강조', ja: 'テレポート：地図で押した場所の名前を大きく（プレイ言語＋日本語）、最寄りの道路の進行方向を「南東方面・道路名」のように選んでその車線から正確に出発——変な所に落ちない；近くのランドマーク名は大きく強調', en: 'Teleport: the picked place is named large (your language + Japanese) and you choose the direction on the nearest road ("south-east bound · road name") to start exactly in that lane — no more odd drop points; nearby landmark names are enlarged' },
    ]
  },
  {
    version: '2.5.3', date: '2026-11-14', codename: 'Night Fixes',
    summary: { ko: '베이브리지 서쪽 끝 막다른 길 연결, 나란한 고가 사이 구멍 메움과 중앙 방호벽, 터널에서 내려 점프하면 바다 위로 가던 버그, 시빅 번호판, 전체 음량·사이렌 낮춤, 경찰·NPC가 따라붙지 않게, VTEC 소리 강화.', ja: 'ベイブリッジ西端の行き止まりを接続、並んだ高架の間の穴を塞ぎ中央分離帯、トンネルで降りてジャンプすると海の上に出たバグ、シビックのナンバー、全体の音量とサイレンを下げた、警察・NPCが付きまとわない、VTECの音を強化。', en: 'The Bay Bridge west-end dead end is connected, the slot between twin viaducts is closed with a centre barrier, jumping out of the car in a tunnel no longer lands you on the sea, the Civic\'s plate, quieter sound and siren, police and NPCs no longer tail you, and a stronger VTEC.' },
    items: [
      { type: 'fix', ko: '요코하마 베이브리지 서쪽 끝: 서쪽으로 달리면 다리 끝(높이 14m)에서 길이 끊기고 K3 서행이 9m 아래에서 시작하던 문제 → 다리 위 같은 높이에서 K3 서행으로 자연스럽게 이어짐(자동주행으로 확인)', ja: '横浜ベイブリッジ西端：西へ走ると橋の端（高さ14m）で道が切れ、K3下りが9m下から始まっていた問題→橋の上で同じ高さのままK3へ自然につながる（自動運転で確認）', en: 'Yokohama Bay Bridge, west end: driving west the deck ended at 14 m while K3 westbound began 9 m lower — K3 westbound now continues from the bridge at the same height (checked on autopilot)' },
      { type: 'fix', ko: '나란히 달리는 두 고가(아쿠아라인·만안선 등) 사이가 구멍처럼 보이던 틈을 상판으로 메우고, 반대 방향 차로 사이에는 콘크리트 중앙 방호벽(충돌 포함) — 합류 구간은 막지 않음', ja: '並んで走る2本の高架（アクアライン・湾岸線など）の間が穴のように見えていた隙間を床版で塞ぎ、反対方向の車線の間にはコンクリートの中央分離帯（衝突あり）——合流区間はふさがない', en: 'The slot between twin viaducts (Aqua-Line, Bayshore…) that looked like a hole is decked over, with a concrete centre barrier (solid) between opposite carriageways — merges are left open' },
      { type: 'fix', ko: '터널(아쿠아라인 등)에서 내려 점프하면 바다 위로 올라가던 버그: 점프 중에도 발밑 노면을 기준으로, 해수면 아래에서는 절대 수면으로 튀어오르지 않음', ja: 'トンネル（アクアラインなど）で降りてジャンプすると海の上に出てしまうバグ：ジャンプ中も足元の路面を基準に、海面より下では水面に飛び出さない', en: 'Jumping after getting out in a tunnel (Aqua-Line…) put you on top of the sea — the floor under you now counts mid-jump, and below sea level you never pop up to the surface' },
      { type: 'fix', ko: '혼다 시빅(EK9): 차체 텍스처에 그려진 외국 번호판이 일본 번호판 위로 보이던 문제 → 차체색 커버로 가리고 일본 번호판을 실제 번호판 자리·각도에', ja: 'ホンダ シビック（EK9）：ボディのテクスチャに描かれた外国のナンバーが日本のナンバーの上に見えていた問題→ボディ色のカバーで隠し、日本のナンバーを本来の位置・角度に', en: 'Honda Civic (EK9): the foreign plate painted into the body texture showed above the Japanese plate — covered in body colour, with the Japanese plate at the real plate position and angle' },
      { type: 'change', ko: '음량: 기본 음량 전체 낮춤(기존 설정도 75%로), 사이렌은 지금의 약 1/4 크기', ja: '音量：初期音量を全体に下げた（既存の設定も75％に）、サイレンは今の約1/4', en: 'Volume: all defaults lowered (existing settings scaled to 75 %), the siren to about a quarter' },
      { type: 'change', ko: '경찰·NPC가 따라붙지 않게: 경찰의 NPC 단속은 내 차에서 220m 이상 떨어진 곳에서만, 사고 후 경찰은 대화에서 직접 부를 때만, 뒤따르는 차는 2.8초 간격을 두고 떨어져서', ja: '警察・NPCが付きまとわない：警察のNPC取り締まりは自分の車から220m以上離れた所でのみ、事故後の警察は会話で自分で呼んだ時だけ、後ろの車は2.8秒の車間で離れて', en: 'Nobody tails you: police only chase NPCs more than 220 m from you, police come to an accident only if you call them in the conversation, and cars behind you hang back 2.8 s' },
      { type: 'change', ko: 'VTEC: 캠 전환 순간 흡기 「하울링」과 고음이 확 열리도록 강화(EK9·AP1·NSX)', ja: 'VTEC：カムが切り替わる瞬間に吸気の「咆哮」と高音がぐっと開くように強化（EK9・AP1・NSX）', en: 'VTEC: the cam changeover now opens up with a hard intake howl and top end (EK9, AP1, NSX)' },
    ]
  },
  {
    version: '2.5.2', date: '2026-11-14', codename: 'Every Phone',
    summary: { ko: '아이폰 사파리에서 게임이 시작되지 않던 치명적 버그 수정, 휴대폰 HUD 겹침 정리와 버튼 이름 표시, 중앙분리대 통과 금지, 내비 경로 탐색 개선, 번호판(꺾인·字光式) 묻힘 수정, 엔진음 통일감, 젖은 노면·라이트 빛 과함 완화.', ja: 'iPhoneのSafariでゲームが始まらなかった致命的なバグを修正、スマホHUDの重なりを整理しボタンに名前、中央分離帯をすり抜けない、ナビのルート探索を改善、ナンバー（お辞儀・字光式）の埋もれを修正、エンジン音に統一感、濡れた路面とライトの光りすぎを抑制。', en: 'Fixed a critical bug that stopped the game starting in iPhone Safari, a phone HUD with nothing overlapping and labelled buttons, no driving through the central reservation, better navigation routing, plates (bowed / illuminated) no longer buried, a more coherent engine sound, and calmer wet roads and lamp glows.' },
    items: [
      { type: 'fix', ko: '아이폰 사파리(및 iOS의 모든 브라우저)에서 주행이 시작되지 않던 문제: 큰 배열을 한 번에 넘기는 코드가 사파리의 인자 개수 제한을 넘어 오류 — 수정 후 사파리 엔진(WebKit)·안드로이드 크롬·삼성 인터넷 환경에서 주행 시작 확인', ja: 'iPhoneのSafari（とiOSのすべてのブラウザ）で走り出せなかった問題：大きな配列を一度に渡すコードがSafariの引数の上限を超えてエラー——修正後、Safariエンジン（WebKit）・Android Chrome・Samsung Internetの環境で走行開始を確認', en: 'iPhone Safari (and every iOS browser) could not start a drive: code passing a huge array in one call exceeded Safari\'s argument limit — fixed, and checked on the Safari engine (WebKit), Android Chrome and Samsung Internet profiles' },
      { type: 'change', ko: '휴대폰 HUD: 위치 이름 한 줄, 큰 미니맵 오른쪽 위, 그 아래 버튼 줄(☰·차고·지도·날씨·자동 — 아이콘과 이름), 라디오 줄과 알림이 버튼·조작부와 겹치지 않게; PC도 버튼에 이름 표시', ja: 'スマホのHUD：地名は1行、大きなミニマップを右上、その下にボタンの列（☰・ガレージ・地図・天気・自動——アイコンと名前）、ラジオと通知がボタンや操作部と重ならないように；PCもボタンに名前', en: 'Phone HUD: a one-line place name, a bigger minimap top-right with a labelled button row under it (☰, garage, map, weather, auto), radio and toasts clear of the buttons and touch controls; buttons are labelled on PC too' },
      { type: 'fix', ko: '중앙분리대: 같은 도로의 반대 차로로 뚫고 넘어가지 못함(차체가 분리대에 닿는 위치에서 벽처럼 멈춤)', ja: '中央分離帯：同じ道路の対向車線へすり抜けられない（車体が分離帯に触れる位置で壁のように止まる）', en: 'Central reservation: no more driving through to the opposite carriageway — it stops you like a wall where the body meets it' },
      { type: 'fix', ko: '내비: 목적지 가장 가까운 한 지점만 노리다 "경로 없음"이 되던 문제 → 주변 400m 안의 도로 후보 중 남은 거리까지 계산해 최적 선택, 고속도로 경로가 없으면 시내 도로로; 전체 지도의 현재 위치 카드에 지금 있는 곳(플레이 언어 + 일본어)', ja: 'ナビ：目的地に一番近い1点だけを狙って「ルートなし」になっていた問題→周辺400m内の道路候補から残りの距離も含めて最適を選択、高速のルートがなければ一般道で；全体地図の現在地カードに今いる場所（プレイ言語＋日本語）', en: 'Navigation: aiming at the single closest road point often gave "no route" — it now weighs every road within 400 m including the distance left, and falls back to city streets; the full map\'s "you are here" card names the place (your language + Japanese)' },
      { type: 'fix', ko: '번호판: お辞儀(꺾인) 번호판이 범퍼에 반쯤 묻히고 뒤쪽은 반대로 꺾이던 문제 → 아래 끝을 축으로 위가 밖으로 숙여지게, 이름 없는 원래 외국 번호판도 모양으로 찾아 숨김', ja: 'ナンバー：お辞儀ナンバーがバンパーに半分埋まり、リアは逆に曲がっていた問題→下端を軸に上が外へ傾くように、名前のない元の外国ナンバーも形で見つけて非表示', en: 'Plates: the bowed plate sank half into the bumper and leaned the wrong way at the rear — it now hinges at its bottom edge with the top out; unnamed foreign plates on the models are found by their shape and hidden' },
      { type: 'change', ko: '엔진음: 차마다 너무 달랐던 공명·거친 소리 폭을 줄여 따뜻하고 풍성한 배기음 쪽으로(엔진별 개성은 유지)', ja: 'エンジン音：車ごとに違いすぎた共鳴とざらつきの幅を抑え、温かく厚みのある排気音へ（エンジンごとの個性は維持）', en: 'Engine sound: the per-car spread of resonance and rasp is narrowed towards one warm, rich exhaust voice (each engine keeps its character)' },
      { type: 'change', ko: '빛·반사 완화: 비에 젖은 노면이 거울처럼 번들거리던 것을 촉촉한 정도로, 램프 빛 번짐 크기 축소', ja: '光と反射を控えめに：雨に濡れた路面が鏡のようにギラついていたのをしっとり程度に、ランプの光のにじみを縮小', en: 'Calmer light: wet roads are damp rather than mirror-like, and lamp glows are smaller' },
      { type: 'new', ko: '하이빔 패싱: 상향등을 2.5초 안에 두 번 이상 켰다 껐다 하면(L 키 연타·💡) 앞차가 경적을 울렸을 때처럼 비켜 줌 — 비킬 때는 항상 내 차에서 먼 쪽으로, 내 차로로 끼어들지 않음', ja: 'パッシング：2.5秒以内にハイビームを2回以上切り替えると（Lキー連打・💡）、クラクションと同じように前の車が譲る——譲る時は必ず自分の車から離れる側へ、自分の車線には入らない', en: 'High-beam flashing: switch the high beams twice within 2.5 s (tap L or 💡) and the car ahead moves over as it does for the horn — always away from you, never into your lane' },
      { type: 'new', ko: '라디오 줄 접기(📻 버튼), 접은 상태 기억', ja: 'ラジオの列を折りたたみ（📻ボタン）、状態を記憶', en: 'The radio bar folds away (📻) and remembers it' },
    ]
  },
  {
    version: '2.5.1', date: '2026-11-14', codename: 'Fast Start',
    summary: { ko: '로딩 대폭 단축(PC 48초 → 13초, 시작 전 데이터 96MB → 25MB), 휴대폰 전용 가벼운 텍스처, 디테일한 후지산, 수도고 전역에 큰 방면 안내판·정보판·속도 표지, 다이코쿠 PA 분수 광장·이륜차 주차장·흡연소(OSM 위치).', ja: 'ロードを大幅短縮（PCで48秒→13秒、開始前のデータ96MB→25MB）、スマホ向けの軽いテクスチャ、ディテールのある富士山、首都高全域に大きな方面案内・情報板・速度標識、大黒PAに噴水広場・二輪車駐車場・喫煙所（OSMの位置）。', en: 'Much faster loading (48 s → 13 s on PC, 96 MB → 25 MB before you drive), lighter textures for phones, a detailed Mt Fuji, big direction signs / message boards / speed limits along every expressway, and Daikoku PA\'s fountain plaza, motorcycle bay and smoking corner at their OpenStreetMap positions.' },
    items: [
      { type: 'fix', ko: '로딩 속도: 땅에서 지하 구간을 잘라내는 계산이 매번 모든 구간을 검사해 로딩의 3/4(35초)을 차지하던 문제를 공간 격자로 해결 — PC 기준 48초 → 13초', ja: 'ロード速度：地面から掘割を切り抜く計算が毎回すべての区間を調べてロードの3/4（35秒）を占めていた問題を空間グリッドで解決——PCで48秒→13秒', en: 'Loading: cutting the open cuttings out of the ground tested every cutting each time — 35 s of a 48 s load; a spatial grid brings it to 13 s on a PC' },
      { type: 'change', ko: '휴대폰: 시작 전에 받는 데이터 96MB → 25MB — NPC 차량 모델은 출발한 뒤에 두 개씩 차례로, 저품질(휴대폰 기본값)에서는 512px 텍스처', ja: 'スマホ：開始前に読み込むデータ96MB→25MB——NPC車のモデルは走り出してから2台ずつ順番に、低画質（スマホの初期設定）では512pxのテクスチャ', en: 'Phones: 96 MB → 25 MB before you can drive — NPC car models stream in two at a time after you set off, and low quality (the phone default) uses 512 px textures' },
      { type: 'change', ko: '후지산: 실제 성층화산 실루엣(완만한 기슭·가파른 정상부·분화구·호에이 분화구), 계곡을 따라 내려오는 눈 줄기, 햇빛 방향 음영, 밤에는 어둡게 — 멀리서도 또렷하게', ja: '富士山：本物の成層火山のシルエット（なだらかな裾野・急な山頂部・火口・宝永火口）、沢に沿って下りる雪筋、日の当たる向きの陰影、夜は暗く——遠くからでもくっきり', en: 'Mt Fuji: a real stratovolcano silhouette (gentle foot, steep top, summit crater, the Hōei crater), snow streaks down the ravines, sun-side shading, dark at night — clear from far away' },
      { type: 'new', ko: '수도고 전역의 큰 표지판: 분기점이 없는 구간에도 약 2km마다 머리 위 방면 안내판, 약 3.5km마다 전광 정보판(渋滞·事故多発·車線規制 등), 약 1.5km마다 속도 제한 표지 — 총 290여 개', ja: '首都高全域の大きな標識：分岐のない区間にも約2kmごとに頭上の方面案内、約3.5kmごとに情報板（渋滞・事故多発・車線規制など）、約1.5kmごとに速度規制標識——計290以上', en: 'Big signs along every expressway: an overhead direction sign about every 2 km between junctions, a message board (congestion, accidents, lane closures…) every ~3.5 km and speed limits every ~1.5 km — about 290 in all' },
      { type: 'new', ko: '다이코쿠 PA (OpenStreetMap 위치 그대로): 「フォンターナ・ダイコク」의 분수 광장과 벤치, 이륜차 주차장(초록 도색·표지), 남쪽 건물 앞 흡연소', ja: '大黒PA（OpenStreetMapの位置どおり）：「フォンターナ・ダイコク」の噴水広場とベンチ、二輪車駐車場（緑の塗装・標識）、南の建物前の喫煙所', en: 'Daikoku PA (at their OpenStreetMap positions): the fountain plaza of "Fontana Daikoku" with benches, the motorcycle bay (green paint, sign) and the smoking corner by the south building' },
    ]
  },
  {
    version: '2.5.0', date: '2026-11-14', codename: 'Night Cruise',
    summary: { ko: '왼쪽 아래 큰 지도(실제 지도·내 위치·차종), 더 똑똑한 자동변속, 실제 램프 위치에서 나오는 깜빡이·브레이크·전조등, 바다에 빠지지 않게, ETC 안내 음성, 엔진 개성 강화, 그 자리에서 차고·튜닝, 라디오 다음 곡, 字光式·お辞儀 번호판.', ja: '左下に大きな地図（実際の地図・現在地・車種）、賢くなったAT、本物のランプ位置で光るウインカー・ブレーキ・ヘッドライト、海に落ちない、ETCの音声案内、エンジンの個性を強化、その場でガレージ・チューニング、ラジオの次の曲、字光式・お辞儀ナンバー。', en: 'A big map bottom-left (real map, your position and car), a smarter automatic gearbox, indicators / brake lights / headlights at the real lamps, no more falling into the sea, ETC voice announcements, more engine character, garage and tuning on the spot, radio skip, and illuminated / bowed plates.' },
    items: [
      { type: 'new', ko: '왼쪽 아래 큰 지도: 진행 방향이 위로 오는 실제 지도(OSM) 위에 도로·교통·경로와 내 위치, 속도에 따라 자동 확대·축소, 아래에 지금 타는 차와 현재 위치 이름, 축척 표시. 내비 경로는 굵은 테두리선으로 또렷하게', ja: '左下に大きな地図：進行方向が上になる実際の地図（OSM）に道路・交通・ルートと現在地、速度に合わせて自動ズーム、下に乗っている車と現在地の名前、縮尺表示。ナビのルートは太い縁取りでくっきり', en: 'A big map bottom-left: heading-up real map (OSM) with roads, traffic, route and your position, auto-zoom with speed, your car and place name in the footer and a scale bar; the navigation route is drawn thick with a dark outline' },
      { type: 'change', ko: '속도계 보강: 레티나 선명도, 500rpm 눈금, 시프트 램프 7개(레드존 점멸), 터보 차량 부스트 게이지', ja: 'スピードメーターを強化：Retinaでくっきり、500rpm目盛り、シフトランプ7個（レッドゾーンで点滅）、ターボ車のブースト計', en: 'Sharper speedo: Retina resolution, 500 rpm ticks, a 7-LED shift light (flashes at the limiter) and a boost gauge on turbo cars' },
      { type: 'change', ko: 'HUD 편의성: 오른쪽 위에 지도·차고 버튼, 처음 출발할 때 키 안내 줄(12초 후 사라짐), 지금 듣는 곡 표시와 ⏮ ⏭ 버튼(Y 키: 다음 곡), 전체 지도(M)는 가장자리에 게임 화면이 보이도록', ja: 'HUDの使いやすさ：右上に地図・ガレージボタン、走り出す時のキー案内（12秒で消える）、再生中の曲名と⏮ ⏭ボタン（Yキー：次の曲）、全体地図（M）は周りにゲーム画面が見えるように', en: 'HUD conveniences: map and garage buttons top-right, a key guide when you set off (fades after 12 s), now-playing with ⏮ ⏭ buttons (Y: next song), and the full map (M) leaves the drive visible around it' },
      { type: 'new', ko: '그 자리에서 차 바꾸기·튜닝: U 키 또는 🔧 버튼(시속 12km 이하), 새 차는 같은 자리에서 출발', ja: 'その場で乗り換え・チューニング：Uキーか🔧ボタン（時速12km以下）、新しい車は同じ場所から', en: 'Change car or tune on the spot: U or the 🔧 button (below 12 km/h); the new car starts right there' },
      { type: 'change', ko: '자동변속 개선(모든 차): 가볍게 밟으면 일찍 변속해 낮은 회전으로 순항, 끝까지 밟으면 레드존 직전까지, 킥다운으로 여러 단 한 번에, 브레이크 때 단계적으로 내려 엔진브레이크, 코너 중 업시프트 금지 — NPC 엔진음도 실제 기어비로', ja: 'ATを改善（全車）：軽く踏めば早めにシフトアップして低回転で巡航、踏み切ればレッド手前まで、キックダウンで数段一気に、ブレーキでは段階的にシフトダウン、コーナー中はシフトアップしない——NPCのエンジン音も実際のギア比で', en: 'Smarter automatic (every car): early upshifts and low-rpm cruising on light throttle, revs to the redline when floored, multi-gear kickdown, stepped downshifts under braking, no upshifts mid-corner — NPC engines follow real gear ratios too' },
      { type: 'fix', ko: '실제 모델 차량의 램프: 비상등이 전조등·후미등 전체를 흰색·빨간색으로 깜빡이던 문제 → 차마다 실제 램프 위치(주황 렌즈가 있으면 그 자리)의 주황 깜빡이, 전조등·후미등·브레이크등에서 빛이 퍼짐, 전조등 더 밝고 멀리', ja: '本物のモデルの車のランプ：ハザードでヘッドライトとテールランプ全体が白・赤に点滅していた問題→車ごとの実際のランプ位置（オレンジのレンズがあればそこ）でアンバーのウインカー、ヘッド・テール・ブレーキランプから光がにじむ、ヘッドライトはより明るく遠くまで', en: 'Real-model lamps: hazards used to flash the whole headlight white and the tail red — now amber indicators at each model\'s own lamps (its amber lenses where it has them), glowing head / tail / brake lights, and brighter, longer headlight beams' },
      { type: 'fix', ko: '바다에 빠져 PA로 돌아가던 문제: 도로 위 마지막 위치를 기억해서, 다리 틈으로 떨어지거나 물에 닿으면 바로 그 자리로 복귀(같은 방향)', ja: '海に落ちてPAに戻されていた問題：道路上の最後の位置を覚えておき、橋の隙間から落ちたり水に触れたらすぐその場所に戻る（同じ向き）', en: 'Falling into the bay sent you back to the PA — the last spot on the road is remembered and a fall through a gap or a splash puts you straight back there, facing the same way' },
      { type: 'new', ko: 'ETC 안내 음성: 차량 탑재기의 「料金は、○○円です。」 안내가 항상 나옴(음성 설정과 무관), 고속도로를 나갈 때 주행 거리 요금(¥300 + 약 ¥29.5/km, 최대 ¥1,950) 정산', ja: 'ETCの音声案内：車載器の「料金は、○○円です。」が常に流れる（音声設定に関係なく）、高速を降りる時に走行距離の料金（¥300＋約¥29.5/km、上限¥1,950）を精算', en: 'ETC voice: the on-board unit\'s "料金は、○○円です" announcement always plays (whatever the voice setting), and leaving the expressway charges the distance fare (¥300 + ~¥29.5/km, capped at ¥1,950)' },
      { type: 'change', ko: '엔진 개성: VTEC 전환을 더 날카롭게(NSX도 VTEC), 자연흡기 스포츠 엔진 흡기음 강화, 풀스로틀 변속 때 배기 「팡」, 터보는 변속 때 짧은 처프', ja: 'エンジンの個性：VTECの切り替わりをよりシャープに（NSXもVTEC）、NAスポーツエンジンの吸気音を強化、全開シフトで排気の「パン」、ターボはシフトで短いチャープ', en: 'Engine character: a sharper VTEC changeover (the NSX gets VTEC too), louder induction on NA sports engines, an exhaust crack on flat-out shifts and a turbo chirp' },
      { type: 'new', ko: '번호판 스타일: 字光式(밤에 글자가 빛나는 번호판)·お辞儀(아래로 꺾인 번호판) — 차고의 번호판 메뉴에서', ja: 'ナンバーのスタイル：字光式（夜に文字が光る）・お辞儀（下向きに曲げた）——ガレージのナンバーメニューから', en: 'Plate styles: 字光式 illuminated characters at night and the お辞儀 bowed plate — in the garage plate menu' },
      { type: 'change', ko: '돈 받을 때 효과음을 부드러운 세 음 차임으로', ja: 'お金が入る時の効果音をやさしい3音のチャイムに', en: 'The money sound is now a soft three-note chime' },
      { type: 'fix', ko: '렉 감소: 사라지는 NPC 차가 다른 차들이 같이 쓰는 모델 데이터를 지워 매번 다시 올리던 문제', ja: 'カクつきを削減：消えるNPC車が他の車と共有するモデルデータを消して毎回アップロードし直していた問題', en: 'Less stutter: a despawning NPC car disposed the model data every copy shares, so it was re-uploaded each time' },
    ]
  },
  {
    version: '2.4.0', date: '2026-11-13', codename: 'Smooth Stance',
    summary: { ko: '렉·끊김 대폭 감소(주행 중 셰이더 재컴파일 제거), 차 파손은 옵션(기본 끔), 더 간단한 설정 화면, 스탠스 프리셋 9종과 차종별 기본 세팅, 실제 3D 도쿄 타워.', ja: 'カクつき・引っかかりを大幅に削減（走行中のシェーダー再コンパイルを排除）、車体の損傷はオプション（初期設定オフ）、シンプルになった設定画面、スタンスのプリセット9種と車種ごとの初期セッティング、リアル3Dの東京タワー。', en: 'Far less stutter (no more shader recompiles while driving), body damage is now an option (off by default), a simpler settings screen, nine stance presets with a per-car default setup, and the real 3D Tokyo Tower.' },
    items: [
      { type: 'fix', ko: '렉·끊김 대폭 감소: 프레임 관리가 단계를 바꿀 때마다 모든 셰이더가 다시 컴파일되며 수 초씩 멈추던 문제 제거(조명 개수·그림자·블룸 경로 고정), 셰이더 오류 검사로 인한 동기 대기 제거, 차량 모델 셰이더를 미리 병렬 컴파일, 유리를 한 번에 그리기, 번호판 위치 계산 캐시', ja: 'カクつき・引っかかりを大幅に削減：フレーム管理が段階を変えるたびに全シェーダーが再コンパイルされ数秒止まっていた問題を解消（ライト数・影・ブルームの経路を固定）、シェーダーのエラーチェックによる同期待ちを廃止、車のシェーダーを事前に並列コンパイル、ガラスを1パスで描画、ナンバー位置の計算をキャッシュ', en: 'Far less stutter: every shader in the scene was recompiled (multi-second freezes) whenever the frame governor changed level — light count, shadows and the bloom path are now fixed; no blocking shader error checks; car shaders precompile in parallel; glass draws in one pass; plate placement is cached' },
      { type: 'change', ko: '도로 위 NPC 차량을 재질별로 합쳐서 그리기: 차 한 대당 수백 개였던 부품·드로우콜이 수십 개로(멀리 보이는 차 전부)', ja: '道路のNPC車を素材ごとにまとめて描画：1台あたり数百あった部品・描画呼び出しが数十に（遠くの車すべて）', en: 'Road traffic is drawn merged per material: hundreds of parts and draw calls per car down to a few dozen (all distant cars)' },
      { type: 'new', ko: '차량 파손 효과는 설정의 옵션(기본 끔, 켜면 내 차와 NPC 모두) — 찌그러짐 계산을 여러 프레임에 나눠 충돌 순간 멈추지 않음, 끄면 바로 수리', ja: '車体の損傷は設定のオプション（初期設定オフ、オンで自車とNPCの両方）——へこみの計算を複数フレームに分けて衝突の瞬間に止まらない、オフにすると即修理', en: 'Body damage is a setting (off by default; when on, for your car and NPCs alike) — dents are worked out over several frames so a crash never hitches, and switching it off repairs the car' },
      { type: 'change', ko: '설정 화면 간소화: 자주 쓰는 항목(언어·그래픽·난이도·변속기·날씨·볼륨·파손·온라인·FPS)만 위에, 주행 보조·화면·사운드는 접이식 섹션으로, 「기본값으로 되돌리기」 버튼, 슬라이더를 움직일 때 저장 지연으로 끊김 없음', ja: '設定画面をシンプルに：よく使う項目（言語・画質・難易度・トランスミッション・天気・音量・損傷・オンライン・FPS）だけ上に、運転アシスト・画面・サウンドは折りたたみ、「初期設定に戻す」ボタン、スライダー操作中の保存を遅らせて引っかかりなし', en: 'Simpler settings: the essentials (language, graphics, difficulty, transmission, weather, volume, damage, online, FPS) up top, driving assists / display / sound in folding sections, a "Reset to defaults" button, and no hitching while dragging sliders' },
      { type: 'new', ko: '스탠스 프리셋 9종: 순정·스트리트·츠라이치·샤코탄·VIP·오니캔버·드리프트·서킷·리프트업, 새 조절 항목 앞/뒤 토와 레이크, 캠버(최대 -22°)·차고(-120 ~ +80 mm)·트레드 범위 확대', ja: 'スタンスのプリセット9種：ノーマル・ストリート・ツライチ・シャコタン・VIP・鬼キャン・ドリフト・サーキット・リフトアップ、新しくフロント／リアのトーとレーキ、キャンバー（最大-22°）・車高（-120〜+80 mm）・トレッドの範囲を拡大', en: 'Nine stance presets — stock, street, flush (tsuraichi), slammed (shakotan), VIP, oni-camber, drift, track and lifted — plus front/rear toe and rake; wider camber (to -22°), ride height (-120 to +80 mm) and track ranges' },
      { type: 'change', ko: '차종마다 다른 기본 세팅: S15·180SX·JZX100·AE86·FD3S·R32는 드리프트, R34·JZA80은 츠라이치, 시빅 타입R·랜에보·임프레자는 서킷, 크라운은 VIP, 짐니는 리프트업 등 — PA에 모인 차들도 각자 스탠스로', ja: '車種ごとに違う初期セッティング：S15・180SX・JZX100・AE86・FD3S・R32はドリフト、R34・JZA80はツライチ、シビック タイプR・ランエボ・インプレッサはサーキット、クラウンはVIP、ジムニーはリフトアップなど——PAに集まる車もそれぞれのスタンスで', en: 'Every car leaves the garage with its own typical setup — S15, 180SX, JZX100, AE86, FD3S and R32 on drift stance, R34 and JZA80 flush, Civic Type R / Evo / Impreza track, Crown VIP, Jimny lifted — and the cars at the PA meet run their own stances too' },
      { type: 'fix', ko: '도쿄 타워: 실제 3D 모델(PLATEAU)을 덮고 있던 주황색 원뿔 대체물 제거 — 근처에서는 실제 모델, 먼 곳에서는 주황·흰 띠의 새 원경 모델(스카이트리도 같은 방식)', ja: '東京タワー：本物の3Dモデル（PLATEAU）を覆っていたオレンジ色の円錐の代用品を撤去——近くでは本物のモデル、遠くからはオレンジと白の帯の新しい遠景モデル（スカイツリーも同じ方式）', en: 'Tokyo Tower: the orange cone stand-in that hid the real 3D model (PLATEAU) is gone — the real model up close, a new orange-and-white banded far model from a distance (Skytree works the same way)' },
      { type: 'fix', ko: '우미호타루 PA·다이코쿠 부두 등 다이코쿠 PA가 아닌 주차장에서 자동주행이 「도로 없음」으로 켜지지 않던 문제 — 가장 가까운 도로까지 스스로 나가서 합류', ja: '海ほたるPA・大黒ふ頭など大黒PA以外の駐車場で自動運転が「道路なし」で始まらなかった問題——最寄りの道路まで自分で出て合流', en: 'Autopilot refused to start ("no road") in car parks other than Daikoku PA, such as Umihotaru PA and Daikoku-futō — it now drives out to the nearest road and joins it' },
      { type: 'change', ko: '텍스처가 없는 실제 3D 건물(LOD1)을 일본 거리처럼 흰색·콘크리트·베이지·갈색 타일 등으로 다양하게, 옥상은 조금 어둡게', ja: 'テクスチャのないリアル3Dの建物（LOD1）を日本の街並みのように白・コンクリート・ベージュ・茶色のタイルなど多彩に、屋上は少し暗く', en: 'Untextured real 3D buildings (LOD1) now vary like a Japanese street — off-white, concrete, beige and brown tile — with darker flat roofs' },
    ]
  },
  {
    version: '2.3.0', date: '2026-11-13', codename: 'Clean Cars',
    summary: { ko: '깨져 보이던 차량 모델 전부 수정, 차마다 다른 엔진·블로오프 사운드, 일본 일상 교통, 더 멀리·선명한 실제 3D 건물, 과한 빛 효과 완화, M1 맥북 에어 60fps.', ja: '崩れて見えた車のモデルをすべて修正、車ごとに違うエンジン・ブローオフ音、日本の日常の交通、もっと遠く・くっきりなリアル3Dの建物、やりすぎの光を抑制、M1 MacBook Airで60fps。', en: 'Every broken-looking car model fixed, engine and blow-off sounds unique to each car, everyday Japanese traffic, real 3D buildings further and sharper, calmer lighting, 60 fps on an M1 MacBook Air.' },
    items: [
      { type: "fix", ko: "깨져 보이던 차량 모델 전부 수정: 유리를 실제처럼 어두운 반투명 틴트로 통일(R32는 흰 판처럼, 모델 3는 지붕이 없는 것처럼 보였음), 한쪽 면만 그려져 각도에 따라 구멍이 나던 차체 패널을 양면으로", ja: "崩れて見えた車のモデルをすべて修正：ガラスを実車のような暗い半透明のスモークに統一（R32は白い板、モデル3は屋根がないように見えていた）、片面だけ描かれて角度によって穴が開いていたボディパネルを両面に", en: "Broken-looking car models fixed across the board: glass is a real dark tint everywhere (the R32 had white panes, the Model 3 looked roofless) and one-sided body panels that opened holes at some angles are drawn from both sides" },
      { type: "change", ko: "엔진·블로오프 사운드 다양화: 차마다 다른 머플러 공명·고음 거친 소리·저음 무게(RB26·2JZ·13B 로터리·VTEC·EJ20 박서 등 엔진별 튜닝), 블로오프 5종(순정 「프슈」·대기개방 BOV·서지 플러터·짧은 처프·큰 「휘익」)", ja: "エンジン・ブローオフ音を多彩に：車ごとに違うマフラーの共鳴・高音のざらつき・低音の厚み（RB26・2JZ・13Bロータリー・VTEC・EJ20ボクサーなどエンジン別に調整）、ブローオフ5種（純正「プシュ」・大気開放BOV・サージのバタつき・短いチャープ・大きな「シュワー」）", en: "Engine and blow-off sounds with far more character: every car gets its own muffler resonance, rasp and low-end weight (tuned for the RB26, 2JZ, 13B rotary, VTEC, EJ20 boxer …), and five blow-off styles — stock 'pssh', vent-to-atmosphere BOV, surge flutter, a short chirp and a big whoosh" },
      { type: "change", ko: "도로 위 NPC는 일본에서 흔히 보는 차 위주(택시·크라운·하이에이스·트럭·버스·경차·리프 등), 스포츠카는 가끔 — 모두 실제 3D 모델", ja: "道路のNPCは日本でよく見る車が中心（タクシー・クラウン・ハイエース・トラック・バス・軽・リーフなど）、スポーツカーはたまに——すべて本物の3Dモデル", en: "Road traffic is everyday Japan — taxis, Crowns, Hiaces, trucks, buses, kei cars, Leafs — with the odd sports car; all real 3D models" },
      { type: "change", ko: "더 멀리, 더 선명하게: 실제 3D 건물을 2배 먼 거리까지 표시, 안개를 옅게, 건물 텍스처를 3개 작업자로 병렬 처리해 더 빨리 선명해지고 비스듬한 각도에서도 선명(이방성 16배)", ja: "もっと遠く、もっとくっきり：リアル3Dの建物を2倍遠くまで表示、霧を薄く、建物テクスチャを3つのワーカーで並列処理してより早くくっきり、斜めから見てもシャープ（異方性16倍）", en: "Further and sharper: the real 3D buildings show twice as far, lighter haze, facade textures are processed by three workers in parallel so they sharpen sooner, and stay crisp at grazing angles (16× anisotropic)" },
      { type: "change", ko: "과한 빛 효과 완화: 블룸(빛 번짐) 절반, 가로등 조명 세기 60% 감소(건물 벽이 하얗게 날아가던 문제), 밤 창문 불빛도 차분하게", ja: "やりすぎの光を抑制：ブルーム（光のにじみ）を半分、街灯の明るさを60％減（建物の壁が白飛びしていた問題）、夜の窓明かりも控えめに", en: "Lighting toned down: half the bloom, street lamps 60 % dimmer (they washed building walls out white), calmer window lights at night" },
      { type: "change", ko: "M1 맥북 에어 등 내장 GPU에서 60fps: 처음부터 가벼운 그림자 설정으로 시작하고 프레임 관리가 60fps를 유지", ja: "M1 MacBook Airなど内蔵GPUで60fps：最初から軽い影の設定で始め、フレーム管理が60fpsを維持", en: "60 fps on integrated GPUs such as the M1 MacBook Air: they start on the lighter shadow settings and the governor holds 60 fps" },
    ]
  },
  {
    version: '2.2.2', date: '2026-11-13', codename: 'Bugfix',
    summary: { ko: '버그 수정: 지상으로 내려온 램프(다이시·헤이와지마·시바우라) 끝을 실제 시내 도로와 포장 연결로 이어 막다른 길 제거.', ja: 'バグ修正：地上に下りたランプ（大師・平和島・芝浦）の終点を実際の街の道路と舗装でつなぎ、行き止まりを解消。', en: 'Bug fixes: the feet of the ramps brought down to the ground (Daishi, Heiwajima, Shibaura) are paved through to the real streets — no more dead ends there.' },
    items: [
      { type: "fix", ko: "다이시·헤이와지마·시바우라 램프 끝이 시내 도로에서 8~36m 떨어져 막다른 길이 되던 문제 — 가장 가까운 실제 도로까지 짧은 포장 연결", ja: "大師・平和島・芝浦のランプの終点が街の道路から8〜36m離れて行き止まりになっていた問題——いちばん近い実際の道路まで短い舗装でつなぐ", en: "The Daishi, Heiwajima and Shibaura ramps ended 8–36 m short of the city streets (a dead end) — a short paved link now joins them to the nearest real street" },
    ]
  },
  {
    version: '2.2.1', date: '2026-11-13', codename: '60fps',
    summary: { ko: '모든 기기에서 60프레임 목표: 선명한 해상도는 유지하고 무거운 효과부터 자동으로 줄이는 프레임 관리, 셰이더 미리 컴파일로 끊김 감소.', ja: 'すべての端末で60fpsを目標に：くっきりした解像度は保ち、重い効果から自動で減らすフレーム管理、シェーダーの事前コンパイルでカクつきを軽減。', en: '60 fps on every device: sharpness is kept while the heaviest effects are dialled back automatically, and shaders compile behind the loading screen to stop the hitches.' },
    items: [
      { type: "change", ko: "프레임 관리: 60fps를 목표로 앰비언트 오클루전 → 그림자 해상도·갱신 주기 → 블룸 → 가로등 조명 → 건물 표시 거리 → 그림자 순서로 단계적으로 줄이고, 여유가 생기면 다시 올림. 해상도는 마지막 수단으로만 낮춤", ja: "フレーム管理：60fpsを目標に、アンビエントオクルージョン→影の解像度と更新頻度→ブルーム→街灯のライト→建物の表示距離→影の順に段階的に減らし、余裕があれば戻す。解像度は最後の手段としてだけ下げる", en: "Frame-rate governor aiming at 60 fps: steps down ambient occlusion → shadow resolution and update rate → bloom → street-light lamps → building detail distance → shadows, and steps back up when there is headroom; resolution is lowered only as a last resort" },
      { type: "change", ko: "선명도: 화면 실제 해상도로 렌더링(최대 2배), 3배 밀도 휴대폰 화면은 2배로 — 눈으로 보이는 차이 없이 부하는 절반 이하", ja: "くっきり：画面の実解像度で描画（最大2倍）、3倍密度のスマホ画面は2倍に——見た目は変わらず負荷は半分以下", en: "Sharpness: rendering at the display's own resolution (up to 2×); 3× phone panels render at 2×, which looks the same at less than half the cost" },
      { type: "fix", ko: "주행 중 끊김 감소: 모든 셰이더를 로딩 화면에서 미리 컴파일, 건물 텍스처는 도착 즉시 업로드, 시내 타일은 한 프레임에 하나씩 설치, 효과가 꺼지면 후처리 패스 생략", ja: "走行中のカクつきを軽減：全シェーダーをロード画面で事前コンパイル、建物のテクスチャは届いたらすぐ転送、街のタイルは1フレームに1つずつ設置、効果が切れたら後処理パスを省略", en: "Fewer hitches while driving: every shader compiles behind the loading screen, building textures upload as soon as they arrive, city tiles install one per frame, and the post-processing pass is skipped when no effect needs it" },
    ]
  },
  {
    version: '2.2.0', date: '2026-11-13', codename: 'Open Road',
    summary: { ko: '막다른 길·덮인 터널 입구·단차를 맵 전체에서 수정, 경찰은 NPC만 추격, 선명한 실해상도와 더 높은 프레임, 내 위치를 따라가는 반투명 지도, 날씨 버튼.', ja: '行き止まり・ふさがれたトンネル入口・段差をマップ全体で修正、警察はNPCだけを追跡、くっきり実解像度と高いフレーム、現在地を追う半透明マップ、天気ボタン。', en: 'Dead ends, lidded tunnel approaches and steps fixed across the map; police chase NPCs only; true resolution and a higher frame rate; a translucent map that follows you; a weather button.' },
    items: [
      { type: "fix", ko: "맵 전체 막힌 길 수정: 1km 시내 타일 경계마다 도로 위에 보이지 않는 벽이 생기던 문제(구간이 이웃 타일로 넘어가는 부분이 빠져 있었음) 해결, 공중에서 끊긴 출입구 램프(다이시·헤이와지마·시바우라)를 실제처럼 지상 도로까지 연결", ja: "マップ全体の行き止まりを修正：1kmの街タイルの境目ごとに道路上に見えない壁ができていた問題（隣のタイルへはみ出す区間が抜けていた）を解決、空中で途切れていた出入口ランプ（大師・平和島・芝浦）を実際どおり地上の道路まで接続", en: "Dead ends fixed across the map: an invisible wall stood across streets at every 1 km city-tile border (the part of a street running into the next tile was missing); exit/entry ramps cut off in mid-air (Daishi, Heiwajima, Shibaura) now continue down to street level" },
      { type: "fix", ko: "터널 입구 앞 반지하(掘割) 구간이 땅·바다·블록으로 덮여 길이 사라지던 문제: 시내 지면을 도려내고, 바다가 차오르지 않게, 그 위의 건물 제거 — 맵 전체 64곳", ja: "トンネル入口手前の掘割が地面・海・ブロックでふさがれ道が消えていた問題：街の地面を切り抜き、海が入り込まないようにし、上に建っていた建物を撤去——マップ全体で64か所", en: "Open cuttings before tunnel mouths were lidded over by ground, filled with sea or covered by blocks — the city ground is cut away, the sea kept out and buildings over them removed, at all 64 of them" },
      { type: "fix", ko: "오르막·램프·터널의 단차 제거: 도로 높이 데이터의 튀는 점과 몇 m 사이 10m씩 떨어지던 절벽을 매끈한 경사(고속 7%·램프 9%)로, 본선과 겹치는 램프 구간 높이를 일치", ja: "坂・ランプ・トンネルの段差を解消：道路の高さデータの飛び跳ねや数mで10m落ちる崖をなめらかな勾配（本線7％・ランプ9％）に、本線と重なるランプ区間の高さを一致", en: "No more steps on climbs, ramps and in tunnels: spikes in the height data and 10 m drops over a few metres became smooth grades (7 % main line, 9 % ramps), and ramps now match the main road where they overlap" },
      { type: "change", ko: "경찰은 플레이어를 잡지 않음 — 과속하는 NPC 차량을 추격해 갓길에 세움. 사고 대화는 내려서 상대 운전자에게 F를 눌렀을 때만", ja: "警察はプレイヤーを捕まえない——速度超過のNPCの車を追跡して路肩に停める。事故の会話は降りて相手の運転手にFを押したときだけ", en: "The police never chase you — they go after speeding NPC cars and pull them over. Accident conversations only start when you walk up to the other driver and press F" },
      { type: "change", ko: "자동주행 최고속도 = 차량의 최고속도 (커브·앞차에서만 감속)", ja: "自動運転の最高速度＝車の最高速度（カーブと前の車でだけ減速）", en: "Autopilot drives up to the car's own top speed, slowing only for bends and traffic" },
      { type: "new", ko: "지도(M)가 내 위치를 중심으로 열리고 계속 따라감, 반투명이라 지도를 보면서도 계속 주행 가능(자동주행 포함)", ja: "マップ（M）が現在地を中心に開いて追従、半透明なので見ながら運転を続けられる（自動運転も）", en: "The map (M) opens on your position and follows you; it is translucent, so you keep driving (or autopilot) while it is open" },
      { type: "new", ko: "날씨 버튼(AUTO 옆): 자동 → 맑음 → 흐림 → 비 → 폭우 → 안개, 설정 메뉴에서도 선택", ja: "天気ボタン（AUTOの横）：自動→晴れ→曇り→雨→嵐→霧、設定メニューでも選択", en: "Weather button next to AUTO: auto → clear → cloudy → rain → storm → fog, also in the settings" },
      { type: "change", ko: "선명한 화면: 맥·윈도우·휴대폰 모두 화면의 실제 해상도로 렌더링(이전엔 프레임이 떨어지면 60%까지 낮아짐), PLATEAU 건물 텍스처 2배 해상도", ja: "くっきり表示：Mac・Windows・スマホとも画面の実解像度で描画（以前はフレームが落ちると60％まで下げていた）、PLATEAUの建物テクスチャを2倍の解像度に", en: "Sharp on every screen: Mac, Windows and phones render at the display's true resolution (it used to drop to 60 % when the frame rate dipped); PLATEAU facades at twice the texture resolution" },
      { type: "change", ko: "프레임 향상: 도로 표지판 1,952개를 188개 메쉬로 합침, PLATEAU 건물 그림자 계산 제거, 동적 조명 수 절반", ja: "フレーム向上：道路標識1,952枚を188メッシュに統合、PLATEAUの建物の影計算を省略、動的ライトを半分に", en: "Higher frame rate: 1,952 roadside signs merged into 188 meshes, no shadow pass for the PLATEAU buildings, half the dynamic lights" },
      { type: "fix", ko: "번호판이 두 개 겹쳐 보이던 모델(AE86·크라운·택시·경찰차·짐니·마크II 등) 수정 — 모델의 원래 번호판을 숨기고 그 자리에 일본 번호판, 없는 모델은 범퍼 표면에 정확히", ja: "ナンバーが2枚重なって見えたモデル（AE86・クラウン・タクシー・パトカー・ジムニー・マークIIなど）を修正——モデル本来のプレートを隠してその位置に日本のナンバー、ないモデルはバンパー面にぴったり", en: "Doubled number plates fixed (AE86, Crown, taxi, police cars, Jimny, Mark II …): the model's own plate is hidden and the Japanese plate takes its exact place; on other models it now sits flush on the bumper" },
      { type: "fix", ko: "도색 안 된 흰 차 수정: 버스 차체 도색(파랑·초록·빨강·노랑), 하이에이스는 차체·창문·하부를 나눠 도색", ja: "塗装されていない白い車を修正：バスの車体を塗装（青・緑・赤・黄）、ハイエースは車体・窓・下回りに分けて塗装", en: "Unpainted white vehicles fixed: buses get real liveries (blue, green, red, yellow), the Hiace is split into painted body, dark glass and chassis" },
      { type: "new", ko: "표지판·노면 표시 추가: 신호 교차로의 횡단보도 표지와 차로 화살표, 간선도로 주차금지 표지, 일방통행 표지", ja: "標識・路面標示を追加：信号交差点の横断歩道標識と進行方向の矢印、幹線道路の駐車禁止標識、一方通行標識", en: "More signs and markings: crosswalk signs and lane arrows at signalised junctions, no-parking signs on arterials, one-way signs" },
      { type: "new", ko: "편의점이 다시: 실제 3D 건물 앞에 간판·매장 정면·주차장 + 분리수거함·자전거 거치대·재떨이·주차장 조명", ja: "コンビニが復活：リアル3Dの建物の前に看板・店頭・駐車場＋分別ゴミ箱・駐輪場・灰皿・駐車場の照明", en: "Konbini are back in front of the real 3D buildings — sign, storefront and car park, plus recycling bins, a bike rack, an ashtray and lot lights" },
      { type: "fix", ko: "도로 위에 서 있던 전봇대·가로수·가로등·자판기·버스정류장 표지와 도로가 없는 이상한 곳의 신호등 제거", ja: "道路上に立っていた電柱・街路樹・街灯・自販機・バス停標識と、道路のない変な場所の信号機を撤去", en: "Utility poles, street trees, lamps, vending machines and bus-stop signs standing on the carriageway are gone, and so are traffic signals in places with no road" },
      { type: "change", ko: "웹사이트 지역 페이지 최신화: 도쿄 23구(실제 3D)·기사라즈·쇼난 추가", ja: "ウェブサイトの地域ページを最新に：東京23区（リアル3D）・木更津・湘南を追加", en: "Website regions page brought up to date: Tokyo's 23 wards (real 3D), Kisarazu and Shōnan added" },
    ]
  },
  {
    version: '2.1.0', date: '2026-11-13', codename: 'Road Marks',
    summary: { ko: '실제 일본 도로처럼: 맵 전체에 노면 표시·표지판 — 급커브의 빨간 미끄럼 방지 포장과 감속 표시, 「速度落とせ」「合流注意」, 골목의 「止まれ」 정지선과 표지판, 속도 숫자, 그린벨트, 자전거 화살표. 다리·터널 부근의 하얀 네모 구조물 제거.', ja: '本物の日本の道路のように：マップ全体に路面標示と標識——急カーブの赤い滑り止め舗装と減速表示、「速度落とせ」「合流注意」、路地の「止まれ」と停止線・標識、速度の数字、グリーンベルト、自転車ナビマーク。橋・トンネル付近の白い四角い構造物を撤去。', en: "Roads marked like Japan's: across the whole map — red anti-skid pavement and deceleration bars on sharp bends, 「速度落とせ」 and 「合流注意」 on the asphalt, 止まれ stop lines and signs in the side streets, painted speed limits, green belts and bicycle arrows. The white blocks at bridge ends and tunnel mouths are gone." },
    items: [
      { type: "new", ko: "고속도로 급커브 264곳: 실제 수도고처럼 빨간 미끄럼 방지 포장, 커브 앞 가로 감속 표시(점점 촘촘하게), 노면 「速度落とせ」, 노란 마름모 급커브 경고 표지, 커브 바깥쪽 화살깃(矢羽根) 표지", ja: "高速の急カーブ264か所：首都高のような赤い滑り止め舗装、カーブ手前の減速表示（だんだん間隔が詰まる）、路面の「速度落とせ」、黄色いひし形の急カーブ警戒標識、カーブ外側の矢羽根", en: "264 sharp expressway bends: red anti-skid pavement like the Shuto's, transverse deceleration bars closing up before the bend, 「速度落とせ」 on the asphalt, yellow diamond curve warnings and chevron boards on the outside" },
      { type: "new", ko: "합류부 60곳: 램프에 「合流注意」 표지, 본선에 합류 경고 표지와 노면 「合流注意」 / 긴 직선 구간에 「追突注意」「車間距離確認」 안내판", ja: "合流部60か所：ランプに「合流注意」、本線に合流の警戒標識と路面の「合流注意」／長い直線に「追突注意」「車間距離確認」の看板", en: "60 merges: 「合流注意」 boards on the ramps, merge warnings and 「合流注意」 painted on the main line; 「追突注意」 / 「車間距離確認」 boards along the long straights" },
      { type: "new", ko: "시내 모든 거리: 작은 길이 큰 길과 만나는 곳마다 정지선 + 노면 「止まれ/とまれ」 + 빨간 역삼각형 「止まれ」 표지, 신호 교차로 앞 ◇ 횡단보도 예고, 간선도로에 노면 속도 숫자(60/50/40/30)와 속도제한 표지, 파란 자전거 화살표, 좁은 골목·통학로에 초록 그린벨트와 「通学路」, 신호 없는 교차로의 빨간 컬러 포장", ja: "街のすべての道：細い道が広い道に出る所に停止線と路面の「止まれ／とまれ」と赤い逆三角の「止まれ」標識、信号交差点手前の◇（横断歩道あり）、幹線道路に路面の速度数字（60/50/40/30）と速度規制標識、青い自転車ナビマーク、狭い道・通学路に緑のグリーンベルトと「通学路」、信号のない交差点の赤いカラー舗装", en: "Every city street: stop lines with 「止まれ／とまれ」 on the asphalt and the red 止まれ triangle where a side street meets a bigger road, ◇ crossing-ahead marks before signals, painted speed limits (60/50/40/30) with speed-limit signs, blue bicycle arrows on arterials, green belts and 「通学路」 on narrow school routes, red pavement on unsignalled crossings" },
      { type: "fix", ko: "다리 끝·터널 입구 고저차 부분의 하얀 네모 구조물 제거: 땅 위로 2.4m 솟고 양옆으로 튀어나왔던 터널 문 벽을 지면 높이·절개부 폭에 맞추고, 낮은 고가 끝부분에서 땅에 박혀 있던 교각 캡 블록과 긴 문형 보 제거", ja: "橋の端・トンネル入口の高低差部分の白い四角い構造物を撤去：地面から2.4m突き出し両脇にはみ出していた坑口の壁を地面の高さと掘割の幅に合わせ、低い高架の端で地面に埋まっていた橋脚の梁ブロックと長い門型の梁を撤去", en: "The white blocks where bridges and tunnels change height are gone: tunnel headwalls no longer stand 2.4 m proud and stick out past the cutting, and the pier caps that sat on the ground at low bridge ends (and the long portal beams) were removed" },
    ]
  },
  {
    version: '2.0.0', date: '2026-11-13', codename: 'Real 3D',
    summary: { ko: '진짜 3D 일본: 일본 정부 3D 도시 모델(PLATEAU)로 도쿄 23구·요코하마·가와사키 등 46개 구·시의 실제 건물을 스트리밍. 맵 전체에서 차는 도로·갓길·주차장, 사람은 인도·주차장·건물 안으로만. 구멍 난 땅 메움, 실제 차량 그대로의 콕핏.', ja: 'リアル3Dジャパン：国の3D都市モデル（PLATEAU）で東京23区・横浜・川崎など46区市の実在の建物をストリーミング。マップ全体でクルマは道路・路肩・駐車場、人は歩道・駐車場・建物の中だけ。地面の穴をふさぎ、実車そのままのコックピットに。', en: "Real 3D Japan: the national 3D city model (PLATEAU) streams the real buildings of 46 wards and cities — all of Tokyo's 23 wards, Yokohama, Kawasaki and more. Map-wide fence: cars keep to roads, shoulders and car parks, people to sidewalks, car parks and buildings. No more holes in the ground, and cockpits built on the real cars." },
    items: [
      { type: "new", ko: "실제 3D 도시: 일본 국토교통성 3D 도시 모델(Project PLATEAU)의 실제 건물을 달리는 동안 스트리밍 — 도쿄 23구 전체, 요코하마 전역, 가와사키·가마쿠라·후지사와·기사라즈·하코네 등 46개 구·시. 측량된 실제 형태와 실제 외벽 사진(LOD2 텍스처), 밤에는 창문에 불, 설치 없이 브라우저에서", ja: "リアル3D都市：国土交通省の3D都市モデル（Project PLATEAU）の実在の建物を走りながらストリーミング——東京23区すべて、横浜市全域、川崎・鎌倉・藤沢・木更津・箱根など46区市。測量された本物の形と外壁写真（LOD2テクスチャ）、夜は窓に明かり、インストール不要でブラウザで", en: "Real 3D city: the real buildings of MLIT's 3D city model (Project PLATEAU) stream in as you drive — all 23 Tokyo wards, all of Yokohama, Kawasaki, Kamakura, Fujisawa, Kisarazu, Hakone: 46 wards and cities with their surveyed shapes and real facade photos (LOD2 textures), lit windows at night, in the browser with nothing to install" },
      { type: "new", ko: "맵 전체 경계: 차는 차도·갓길·주차장(PA·우미호타루·하코네·시내 모든 주차장·주유소·편의점 앞)에서만, 걸을 때는 인도·보행로·주차장·건물 안에서만 — 공터·정원·밭으로는 못 들어가고 벽처럼 미끄러지듯 막힘", ja: "マップ全体の境界：クルマは車道・路肩・駐車場（PA・海ほたる・箱根・街のすべての駐車場・ガソリンスタンド・コンビニ前）だけ、歩くときは歩道・遊歩道・駐車場・建物の中だけ——空き地・庭・畑には入れず、壁のように滑って止まる", en: "Map-wide fence: cars stay on carriageways, shoulders and car parks (the PA, Umihotaru, Hakone, every city car park, fuel forecourt and konbini lot); on foot you keep to sidewalks, footpaths, car parks and buildings — no more driving into yards, gardens or fields, you slide along the edge like a wall" },
      { type: "fix", ko: "v1.1.0부터 시내(건물·도로·주차장 전부)가 아예 로드되지 않던 오류 수정 — 맵 곳곳이 텅 빈 구멍처럼 보이던 원인", ja: "v1.1.0から街（建物・道路・駐車場すべて）が読み込まれていなかった不具合を修正——マップのあちこちが空っぽの穴に見えた原因", en: "Fixed the streamed city (every building, street and car park) not loading at all since v1.1.0 — why the map looked like empty holes" },
      { type: "fix", ko: "구멍 메움: 해안선 데이터에 빠져 있던 부두·컨테이너 야드·매립지에 땅을 깔고 물리도 적용 (차가 바다 밑으로 떨어지던 곳), 위에서 검게 보이던 바다는 남색으로", ja: "穴ふさぎ：海岸線データから抜けていた埠頭・コンテナヤード・埋立地に地面を敷き物理にも反映（クルマが海底に落ちた所）、上から黒く見えた海は紺色に", en: "No holes: piers, container yards and reclaimed land the coastline data missed now have ground — rendered and solid (cars used to drop to the sea floor there) — and the sea no longer looks like a black void from above" },
      { type: "change", ko: "콕핏을 실제 차량 그대로: 1인칭에서 실제 3D 모델의 A필러·지붕·보닛·사이드미러를 그대로 보여 주고, 계기판·핸들·시트를 실제 차 실내 치수(지붕 높이·앞유리·도어)에 맞춰 배치 — 화면을 가로지르던 검은 필러, 보닛 위에 떠 있던 미러, 겹쳐 보이던 핸들 제거", ja: "コックピットを実車そのままに：一人称で実車3DモデルのAピラー・ルーフ・ボンネット・ドアミラーをそのまま表示し、メーター・ハンドル・シートを実車の室内寸法（ルーフ高・フロントガラス・ドア）に合わせて配置——画面を横切る黒いピラー、ボンネットに浮いたミラー、二重のハンドルを解消", en: "Cockpits built on the real cars: first person keeps the real 3D model's A-pillars, roof, bonnet and door mirrors, and the dash, wheel and seats are fitted to the real cabin (roof height, windscreen, door) — no more black pillar across the screen, mirrors floating on the bonnet or doubled steering wheels" },
      { type: "change", ko: "새로 단장한 웹사이트(진짜 3D 일본 섹션·새 스크린샷)와 GitHub 소개", ja: "ウェブサイト（リアル3Dジャパンのセクション・新スクリーンショット）とGitHubの紹介を一新", en: "Renewed website (Real 3D Japan section, new screenshots) and GitHub page" },
    ]
  },
  {
    version: '1.2.0', date: '2026-11-13', codename: 'Autopilot',
    summary: { ko: '자동주행(J / AUTO 버튼): 주차 칸에서 출발해 1차로(추월차로)로 맵 전체를 순회. 지도(M)는 실제 OSM 도로·건물·강·철도까지 전부 보이는 전체 지도로 열리고, 차량은 실제 순정 컬러로 도색.', ja: '自動運転（J／AUTOボタン）：駐車枠から出発し追越車線でマップ全体を巡回。マップ（M）は実際のOSMの道路・建物・川・鉄道まで全部見える全体図で開き、車は本物の純正色に。', en: 'Autopilot (J / AUTO button): leaves your parking bay and tours the whole map in the overtaking lane. The map (M) opens on the whole real map — every OSM street, building, river and railway — and cars wear real factory colours.' },
    items: [
      { type: "new", ko: "자동주행(J 키 또는 미니맵 아래 AUTO 버튼): 주차 칸에서 후진으로 빠져나와 PA 출구로, 고속도로에서는 1차로(추월차로) 위주로 주행 — 앞차와 차간거리 유지, 빈 공간에만 깜빡이 켜고 차로 변경, 커브 전 감속, 안 가 본 도로를 우선 골라 맵 전체를 순회하고 맵 끝에서는 회차. 핸들·페달을 조작하면 바로 해제", ja: "自動運転（Jキーまたはミニマップ下のAUTOボタン）：駐車枠からバックで出てPA出口へ、高速では追越車線を中心に走行——車間を保ち、空いた所にだけウインカーを出して車線変更、カーブ手前で減速、まだ走っていない道を優先してマップ全体を巡回し、マップの端では折り返し。ハンドル・ペダル操作ですぐ解除", en: "Autopilot (J, or the AUTO button under the minimap): backs out of your bay to the PA exit, then cruises mostly in the overtaking lane — keeps its distance, signals and changes lanes only into clear gaps, slows for curves, prefers roads it hasn't driven yet so it tours the whole map, and turns round at the map edge. Touch the wheel or a pedal to take over" },
      { type: "new", ko: "지도(M)를 열면 맵 전체가 한눈에 — 하코네까지 포함. 실제 OpenStreetMap 데이터로 구운 지도에 모든 시내 도로·건물·공원·강·철도·해안선·하코네 지형 음영 표시, 확대하면 고해상도 타일로 건물 하나하나까지", ja: "マップ（M）を開くと箱根まで含む全体が一目で。実際のOpenStreetMapデータから焼いた地図に、すべての街路・建物・公園・川・鉄道・海岸線・箱根の地形陰影、拡大すると高解像度タイルで建物一つ一つまで", en: "The map (M) opens on the whole world, Hakone included, drawn from the real OpenStreetMap data — every street, building, park, river, railway, the coastline and Hakone's relief — with high-resolution tiles down to single buildings when you zoom in" },
      { type: "change", ko: "모든 차종 색상을 실제 순정 컬러로 교체 (R34 베이사이드 블루·밀레니엄 제이드, FD 빈티지 레드, NSX 포뮬러 레드, Z33 르망 선셋 등), 대표 컬러가 기본값. 흰색은 펄 도장으로 광택이 나고 교통차량에서 흰 차 비율 감소", ja: "全車種の色を本物の純正色に（R34ベイサイドブルー・ミレニアムジェイド、FDヴィンテージレッド、NSXフォーミュラレッド、Z33ル・マン サンセットなど）、代表色が初期値。白はパール塗装で艶が出て、交通の白い車も減少", en: "Every car now comes in its real factory colours (R34 Bayside Blue and Millennium Jade, FD Vintage Red, NSX Formula Red, Z33 Le Mans Sunset …) with the signature colour first; whites are a glossy pearl and rarer in traffic" },
      { type: "fix", ko: "도색이 안 된 하얀 덩어리로 보이던 캔터 트럭: 캐빈은 차체 색, 적재함은 알루미늄, 하부·타이어는 검정으로", ja: "塗装されていない白い塊に見えたキャンター：キャブは車体色、荷箱はアルミ、下回りとタイヤは黒に", en: "The Canter truck no longer looks like unpainted white clay: painted cab, aluminium box, dark chassis and tyres" },
    ]
  },
  {
    version: '1.1.1', date: '2026-11-13', codename: 'Sound & Traffic',
    summary: { ko: '교통차량은 전부 실제 3D 모델, 추월차로(1차로)는 플레이어 전용, 경적에 비켜 주는 차들, 실제 녹음으로 바꾼 사운드와 터보 블로오프 「프슈욱」.', ja: '交通はすべて本物の3Dモデル、追越車線はプレイヤー専用、クラクションで道を譲る車、本物の録音に替えたサウンドとターボのブローオフ「プシュッ」。', en: 'All traffic uses real 3D models, the overtaking lane is yours, cars move over when you honk, recorded sounds replace the synthetic ones, and turbo cars go “pssshh”.' },
    items: [
      { type: "change", ko: "교통·주차·카밋 차량을 실제 3D 모델이 있는 차로만 (버스·트럭·하이에이스·경차 포함), 경찰차·택시도 실제 크라운 모델 + 경광등", ja: "交通・駐車・カーミートの車はすべて本物の3Dモデルのある車種に（バス・トラック・ハイエース・軽を含む）、パトカーとタクシーも本物のクラウンのモデル＋赤色灯", en: "Traffic, parked and meet cars only use models with a real 3D model (buses, trucks, the Hiace and kei cars included); police cars and taxis use the real Crown model with their lightbar" },
      { type: "change", ko: "추월차로(중앙분리대 쪽 차로, 한국식 1차로)는 플레이어 전용 — 교통차량은 생성되지도 들어가지도 않음", ja: "追越車線（中央分離帯側）はプレイヤー専用——交通は出現も進入もしない", en: "The overtaking lane (median side) is yours alone — traffic never appears in it or changes into it" },
      { type: "fix", ko: "경적을 울리면 앞차가 플레이어 반대쪽으로 비키고, 비킬 곳이 없으면 감속·가장자리로 붙어 길을 터 줌 (옆 차로 차가 내 차로로 끼어들던 문제)", ja: "クラクションを鳴らすと前の車はプレイヤーと反対側へ避け、避けられなければ減速して端に寄る（隣の車線の車が自分の車線に入ってきた問題）", en: "Honk and the car ahead moves away from you, or slows and hugs the edge if it can't (cars in the next lane used to swerve into yours)" },
      { type: "new", ko: "터보차(GT-R 등) 액셀을 뗄 때마다 블로오프 「프슈욱」(실제 녹음) + 일부 차는 서지 플러터, 터보 스풀 휘슬 강화", ja: "ターボ車（GT-Rなど）はアクセルを抜くたびにブローオフ「プシュッ」（本物の録音）＋一部の車はサージ音、タービンの過給音を強化", en: "Turbo cars (GT-Rs and co.) blow off — a real recorded “pssshh” — every time you lift, some with compressor-surge flutter, and a louder spool whistle" },
      { type: "change", ko: "경적·시동·충돌·문 여는 소리를 실제 녹음(CC0)으로 교체, 시내·PA에 실제 도쿄 밤거리 녹음 앰비언스", ja: "クラクション・セル・衝突・ドアを開ける音を本物の録音（CC0）に、街とPAには本物の東京の夜の街の環境音", en: "The horn, starter, crash and door sounds are real recordings (CC0), and the city and PA have a real Tokyo-at-night ambience" },
      { type: "change", ko: "기계음 같던 TTS 음성 대사와 합성 군중 웅성거림 제거(자막은 그대로) — 설정에서 다시 켤 수 있음", ja: "機械的だった読み上げ音声と合成の人の声を廃止（字幕はそのまま）——設定で戻せる", en: "The robotic text-to-speech lines and the synthetic crowd murmur are gone (subtitles stay) — the voices can be switched back on in the settings" },
    ]
  },
  {
    version: '1.1.0', date: '2026-11-12', codename: 'Connected',
    summary: { ko: '맵 전체가 하나로 — 다이코쿠·요코하마·가와사키·하네다·도쿄 도심(C1)·레인보우 브리지·하코네까지 실제 도로로 막힘 없이 이어짐.', ja: 'マップがひとつに——大黒・横浜・川崎・羽田・都心（C1）・レインボーブリッジ・箱根まで、本物の道路で途切れずにつながる。', en: 'One connected map: Daikoku, Yokohama, Kawasaki, Haneda, central Tokyo (C1), the Rainbow Bridge and Hakone, all joined by the real roads.' },
    items: [
      { type: "new", ko: "레인보우 브리지를 실제 모습으로: 높이 126m 하얀 주탑 2기, 주경간 570m 현수 케이블·행어, 야간 조명", ja: "レインボーブリッジを実物どおりに：高さ126mの白い主塔2基、中央径間570mの吊りケーブルとハンガー、夜間照明", en: "The Rainbow Bridge as it really is: two white 126 m towers, the 570 m main span's suspension cables and hangers, lit at night" },
      { type: "new", ko: "요코하마 서쪽에 실제 해안선의 사가미만 바다 — 세이쇼 바이패스가 바다를 따라 달림", ja: "横浜より西に実際の海岸線で相模湾 — 西湘バイパスは海沿いを走る", en: "Sagami Bay west of Yokohama, from the real coastline — the Seishō bypass runs along the sea" },
      { type: "new", ko: "시작 시 새 버전 소개 창(레인보우 브리지·하코네에서 바로 출발), 화면 좌상단 다음 도전 과제 진행 표시, 달성 시 큰 배너", ja: "起動時に新バージョン紹介（レインボーブリッジ・箱根からすぐ出発）、画面左上に次のアコレードの進み具合、達成時は大きなバナー", en: "A what's-new screen at start (jump straight to the Rainbow Bridge or Hakone), the next accolade and its progress top-left, and a big banner when you earn one" },
      { type: "fix", ko: "PA 시작 주차칸 바로 앞에 가로등 기둥이 있어 출발하자마자 부딪히던 문제", ja: "PAのスタート枠のすぐ前に街灯の柱があり、発進直後にぶつかっていた問題", en: "The starting stall at the PA could face a lamp mast right ahead" },
      { type: "new", ko: "수도고 K1 요코하네선·K3 가리바선 양방향, 1호 하네다선, 만안선 북부(도쿄항 터널), 11호 다이바선(레인보우 브리지)을 실제 OSM 형상·JCT 그대로 추가 — 요코하마 루프에서 C1까지 고속도로로 직행", ja: "首都高K1横羽線・K3狩場線（上下線）、1号羽田線、湾岸線北部（東京港トンネル）、11号台場線（レインボーブリッジ）を本物のOSMの線形とJCTのまま追加——横浜ループからC1まで高速道路で直行", en: "Shuto K1 Yokohane and K3 Kariba both ways, Route 1 Haneda, the Bayshore north (Tokyo Port Tunnel) and Route 11 Daiba (Rainbow Bridge), from OpenStreetMap with the real junctions — drive from the Yokohama loop straight to the C1" },
      { type: "new", ko: "하코네까지 도로로: 요코하마 신도 → 국도1호 → 신쇼난 바이패스 → 국도134호 → 세이쇼 바이패스 → 턴파이크 (편도 약 59km, 주변 시가지 포함)", ja: "箱根まで道路で：横浜新道 → 国道1号 → 新湘南バイパス → 国道134号 → 西湘バイパス → ターンパイク（片道約59km、沿道の街並みつき）", en: "Drive to Hakone: Yokohama Shindō → Route 1 → Shin-Shōnan bypass → Route 134 → Seishō bypass → the Turnpike (about 59 km, with the towns along the way)" },
      { type: "new", ko: "실제 출입 램프 13곳(하네다공항·헤이와지마·시바우라·다이바·아리아케·다이시 등)으로 고속도로와 시내 도로가 연결 — 출구로 나간 교통차량은 그대로 시내를 달림", ja: "本物の出入口ランプ13か所（羽田空港・平和島・芝浦・台場・有明・大師など）で高速道路と一般道がつながる——出口を降りた車はそのまま街を走る", en: "13 real exits and entrances (Haneda Airport, Heiwajima, Shibaura, Daiba, Ariake, Daishi …) join the expressways to the city streets — traffic leaving an exit carries on through town" },
      { type: "change", ko: "일반국도(1호·134호)는 보도·연석이 있는 실제 국도 모습으로, 고가 구간만 난간 있는 육교로", ja: "一般国道（1号・134号）は歩道と縁石のある本物の国道の姿に、高架部分だけ欄干つきの跨道橋に", en: "Ordinary national roads (Routes 1 and 134) look like the real thing — kerbs and pavements, parapets only on their overpasses" },
      { type: "fix", ko: "시가지의 교각·건물·가로등·나무가 주행 가능한 고가를 관통하던 문제 — 고가 위치를 알고 자동으로 비켜 배치", ja: "街の橋脚・建物・街灯・木が走れる高架を突き抜けていた問題——高架の位置を知って自動でよけて配置", en: "City piers, buildings, street lamps and trees no longer stand through a driveable deck — the tiles know where the decks are" },
      { type: "change", ko: "만안선 양 끝 U턴 제거, 교통차량은 플레이어 주변 도로에 생성, 새 JCT의 녹색 방향 안내판(羽田·台場·都心·有明 등)", ja: "湾岸線両端のUターンを廃止、交通は自分の周りの道路に発生、新しいJCTに緑の方面看板（羽田・台場・都心・有明など）", en: "No more U-turns at the Bayshore's ends, traffic appears on the roads around you, and green direction signs (Haneda, Daiba, City Centre, Ariake …) at the new junctions" },
      { type: "new", ko: "도전 과제(13+2개, 보상금): 베이브리지·쓰바사교·레인보우 브리지 횡단, 우미호타루, 다이칸야마 정상, C1 러너, 하코네 로드트립, 드리프트, 200km/h, 추격 따돌리기 등 — 일시정지 메뉴에서 진행 확인", ja: "アコレード（13+2個、賞金つき）：ベイブリッジ・つばさ橋・レインボーブリッジ、海ほたる、大観山、C1ランナー、箱根ロードトリップ、ドリフト、200km/h、追跡振り切りなど——ポーズメニューで進み具合を確認", en: "Accolades (15, with cash rewards): the Bay, Tsubasa and Rainbow bridges, Umihotaru, the Daikanyama summit, C1 runner, a road trip to Hakone, drifting, 200 km/h, escaping the police … — progress in the pause menu" },
      { type: "new", ko: "스폰 지역 추가: 레인보우 브리지(11호 다이바선), 1호 하네다선, 세이쇼 바이패스(하코네 방면)", ja: "スポーン地点を追加：レインボーブリッジ（11号台場線）、1号羽田線、西湘バイパス（箱根方面）", en: "New spawn points: the Rainbow Bridge (Route 11), Route 1 Haneda and the Seishō bypass (towards Hakone)" },
      { type: "fix", ko: "가벼운 접촉(시속 18km 미만)으로는 사고 장면이 시작되지 않음, 순간이동하면 경찰 추격 종료, 지면보다 살짝 낮은 도로에서 도로 인식이 끊기던 문제", ja: "軽い接触（時速18km未満）では事故シーンにならない、ワープすると追跡終了、地面より少し低い道路で道路判定が切れていた問題", en: "A light bump (under 18 km/h) no longer starts an accident scene, fast travel ends a pursuit, and roads lying just below ground level are recognised" },
    ]
  },
  {
    version: '1.0.1', date: '2026-11-12', codename: 'Shakedown',
    summary: { ko: '직접 플레이하며 찾은 버그 대수술 — 고속도로의 보이지 않는 벽, PA 밖 허공, 하차 시 끼임, 터널 눈부심, 모바일 페달 실종 등 수정.', ja: '実際に走って見つけた不具合を一斉修正——高速道路の見えない壁、PAの外の虚空、降車時のはまり込み、トンネルのまぶしさ、スマホのペダル消失など。', en: 'A full playtest pass: invisible walls on the expressways, the void outside the PA, getting stuck when stepping out, tunnel glare, missing mobile pedals and more — fixed.' },
    items: [
      { type: "fix", ko: "K5 고가도로(다이코쿠 PA 위)에 PA 건물 충돌판정이 20m 높이까지 솟아 있어 보이지 않는 벽에 부딪히던 문제", ja: "K5の高架（大黒PAの上）でPAの建物の当たり判定が高さ20mまであり、見えない壁にぶつかっていた問題", en: "PA buildings had 20 m-tall collision boxes that formed invisible walls on the K5 viaduct above the lot" },
      { type: "fix", ko: "다이코쿠 JCT 램프(PA→K5)에서 지상 차량 야적장의 충돌판정 때문에 차가 멈추던 문제, 교각이 바로 아래 램프를 뚫고 서던 문제", ja: "大黒JCTのランプ（PA→K5）で地上の自動車ヤードの当たり判定に引っかかって止まっていた問題、橋脚がすぐ下のランプを突き抜けていた問題", en: "Cars stopped dead on the Daikoku JCT ramp (PA→K5) against the ground-level car yard's collision box; piers no longer stand through a ramp passing just below" },
      { type: "fix", ko: "우미호타루 섬 방파제 충돌판정이 아쿠아라인 본선과 터널 입구를 막던 문제, 쓰루미 쓰바사교 주탑이 추월차로를 침범하던 문제", ja: "海ほたるの護岸の当たり判定がアクアライン本線とトンネル入口を塞いでいた問題、鶴見つばさ橋の主塔が追越車線にはみ出していた問題", en: "The Umihotaru seawall blocked the Aqua-Line carriageway and tunnel mouth; the Tsurumi Tsubasa pylon stuck into the fast lane" },
      { type: "fix", ko: "PA 출구 램프 옆으로 빠져 고가 아래 검은 허공을 달릴 수 있던 문제 — 이제 램프와 도로를 벗어날 수 없음", ja: "PA出口ランプの脇から抜け出し、高架下の真っ暗な虚空を走れてしまった問題——ランプと道路から外れられないように", en: "You could leave the PA exit ramp sideways and roam a black void under the viaducts — the car now stays on the ramps and streets" },
      { type: "fix", ko: "요코하마 베이브리지 노면이 100m마다 ±5m씩 출렁이던 문제 — 고가·터널 구간 노면을 매끄럽게", ja: "横浜ベイブリッジの路面が100mごとに±5m波打っていた問題——高架・トンネル区間の路面を滑らかに", en: "The Bay Bridge deck rose and dipped ±5 m every 100 m — elevated and tunnel profiles are now smooth" },
      { type: "fix", ko: "시내: 철도 펜스가 건널목 도로를 막고, 고가 교각이 도로 한가운데 서고, 도로 위에 겹친 건물이 길을 막던 문제", ja: "市街地：鉄道のフェンスが踏切の道路を塞ぎ、高架の橋脚が道路の真ん中に立ち、道路に重なった建物が道を塞いでいた問題", en: "City: rail fences sealed off level crossings, viaduct piers stood in the street and buildings overlapping a road walled it off" },
      { type: "fix", ko: "차에서 내리면 옆 주차 차량 안에 들어가 움직일 수 없던 문제 — 빈 쪽(조수석·뒤·앞)으로 내림", ja: "降車すると隣の駐車車両の中に入って動けなくなった問題——空いている側（助手席側・後ろ・前）に降りる", en: "Stepping out could put you inside the neighbouring parked car, unable to move — you now step out on a free side" },
      { type: "fix", ko: "정지 상태에서 S를 꾹 눌러 후진할 때 시동이 안 걸려 R단만 들어가고 움직이지 않던 문제", ja: "停止中にSを長押しして後退しようとしても、エンジンがかからずRに入るだけで動かなかった問題", en: "Holding S from a standstill selected R but never started the engine, so the car didn't reverse" },
      { type: "change", ko: "자동 헤드라이트: 해 질 녘·밤·터널에서 자동으로 켜짐(직접 조작하면 수동으로 전환)", ja: "オートライト：夕方・夜・トンネルで自動点灯（自分で操作すると手動に切替）", en: "Automatic headlights at dusk, at night and in tunnels (switching them by hand turns the automatic off)" },
      { type: "fix", ko: "C1 터널: 조명·블룸이 과해 벽이 하얗게 날아가던 문제, 벽 텍스처가 길게 늘어지던 문제, 터널·고가 아래에서도 비가 내리던 문제", ja: "C1のトンネル：照明とブルームが強すぎて壁が白飛びしていた問題、壁のテクスチャが引き伸ばされていた問題、トンネルや高架下でも雨が降っていた問題", en: "C1 tunnels: lamps and bloom blew the walls out white, the wall texture was smeared into streaks, and it rained inside tunnels and under decks" },
      { type: "fix", ko: "모바일: 가속·브레이크 페달과 좌우 조향 버튼이 화면 밖에 그려져 보이지 않던 문제, 버튼이 미니맵·속도계와 겹치던 문제", ja: "スマホ：アクセル・ブレーキペダルと左右ハンドルボタンが画面外に描かれて見えなかった問題、ボタンがミニマップ・速度計と重なっていた問題", en: "Mobile: the GAS/BRAKE pedals and steering buttons were drawn off-screen, and the buttons overlapped the minimap and speedometer" },
      { type: "fix", ko: "우미호타루 스폰이 방파제를 향해 시작하던 문제 — PA 주차칸에서 시작, 하코네 요금소 부스가 하행 차로를 막던 문제", ja: "海ほたるのスポーンが護岸に向いていた問題——PAの駐車枠から開始、箱根の料金所ブースが下り車線を塞いでいた問題", en: "Umihotaru spawn faced the seawall — you now start in a PA stall; the Hakone toll booth no longer blocks the downhill lane" },
      { type: "fix", ko: "온라인: 지정한 안정적인 릴레이 대신 무작위 릴레이(일부 다운)에 접속하던 문제", ja: "オンライン：指定した安定したリレーではなく、ランダムなリレー（一部ダウン）に接続していた問題", en: "Online: the game connected to random (partly dead) relays instead of the chosen stable ones" },
    ]
  },
  {
    version: '1.0.0', date: '2026-11-06', codename: 'Real Japan',
    summary: { ko: '정식 1.0 — 실제 일본의 다섯 곳(C1·하코네·K1 루프·다이코쿠 PA와 만안선·요코하마/도쿄 시가지)을 달리는 게임으로. 홈페이지 전면 리뉴얼.', ja: '正式版1.0——本物の日本の5つの場所（C1・箱根・K1ループ・大黒PAと湾岸線・横浜／東京の街）を走るゲームに。ホームページを全面リニューアル。', en: 'Version 1.0: a game about driving the real Japan in five places — C1, Hakone, the K1 loop, Daikoku PA and the Bayshore, and the streets of Yokohama and Tokyo. A brand-new homepage.' },
    items: [
      { type: "new", ko: "정식 1.0: C1 도심환상선·하코네 턴파이크·K1 요코하마 루프·다이코쿠 PA와 만안선·요코하마/도쿄 시가지 — 실제 일본을 다섯 곳에서 달리는 게임", ja: "正式版1.0：C1都心環状線・箱根ターンパイク・K1横浜ループ・大黒PAと湾岸線・横浜／東京の街——本物の日本を5つの場所で走るゲーム", en: "Version 1.0: the C1 Inner Circular, the Hakone Turnpike, the K1 Yokohama loop, Daikoku PA and the Bayshore, and the streets of Yokohama and Tokyo — the real Japan in five places" },
      { type: "change", ko: "홈페이지 전면 리뉴얼: 실제 주행 장면이 천천히 바뀌는 시네마틱 히어로(촬영 위치 표시), 「실제 일본, 다섯 곳을 달린다」 코스 카드(누르면 그 자리에서 바로 출발), 새 스크린샷", ja: "ホームページを全面リニューアル：実際の走行シーンがゆっくり切り替わるシネマティックなヒーロー（撮影地表示）、「実在の日本を、5つの場所で走る」コースカード（押すとその場から走り出せる）、新しいスクリーンショット", en: "A completely new homepage: a cinematic hero cycling through real in-game scenes (with where each was taken), “Five real places to drive” route cards that start the game right there, and new screenshots" },
      { type: "change", ko: "경제: 시작 자금 ¥500,000, 5km마다 주행 보너스 ¥3,000, 잔액이 ¥20,000 아래로 내려가지 않음 — 벌금·합의금 때문에 막히지 않게", ja: "お金：初期資金¥500,000、5kmごとに走行ボーナス¥3,000、残高は¥20,000未満にならない——反則金や示談金で詰まらない", en: "Money: start with ¥500,000, earn a ¥3,000 driving bonus every 5 km, and never drop below ¥20,000 — fines and settlements can’t leave you stuck" },
      { type: "fix", ko: "C1 내·외회선이 나란히 달리는 구간에서 두 차도가 겹치고 반대 방향 터널 벽이 차로 한가운데 서 있던 문제 — 두 선을 9m 이상 분리하고 공유 터널로", ja: "C1の内回りと外回りが並ぶ区間で車道が重なり、反対側のトンネル壁が車線の真ん中に立っていた問題——2本を9m以上離し、共用のトンネルに", en: "Where the C1 loops run side by side the carriageways overlapped and the other bore’s tunnel wall stood in the middle of your lane — the loops are now at least 9 m apart and share one tunnel" },
      { type: "change", ko: "GitHub README: C1 야경 대표 이미지, 5개 코스 표(바로 시작 링크)", ja: "GitHub README：C1の夜景をトップ画像に、5つのコース表（すぐ走れるリンク付き）", en: "GitHub README: the C1 at night as the header image and a table of the five routes with direct start links" }
    ]
  },
  {
    version: '0.11.1', date: '2026-11-06', codename: 'Coin Parking',
    summary: { ko: '시내 주차장에 코인파킹 디테일(주차선·차막이·P 간판·정산기).', ja: '市街地の駐車場にコインパーキングのディテール（区画線・車止め・P看板・精算機）。', en: 'Coin-parking detail in city car parks (bay lines, wheel stops, P sign, pay machine).' },
    items: [
      { type: "new", ko: "시내 주차장마다 일본식 코인파킹: 흰 주차선·차막이, 노란 「P」 간판 기둥, 정산기", ja: "市街地の駐車場にコインパーキング：白い区画線と車止め、黄色の「P」看板ポール、精算機", en: "Coin parking in every city car park: white bay lines and wheel stops, a yellow “P” sign pole and a pay machine" }
    ]
  },
  {
    version: '0.11.0', date: '2026-11-06', codename: 'Inner Circular',
    summary: { ko: 'C1 도심환상선 개통 — 도쿄 도심의 터널과 고가를 도는 내·외회선 루프, 주변 도쿄 도심 시가지.', ja: 'C1都心環状線開通——東京都心のトンネルと高架を巡る内回り・外回りのループと、周囲の都心の街並み。', en: 'The C1 Inner Circular Route opens: both loops through central Tokyo’s tunnels and viaducts, with the city around them.' },
    items: [
      { type: "new", ko: "C1 도심환상선: 내회선·외회선 각 약 14km — 지하 터널(일반 -9m, 깊은 구간 -14m), 掘割(지면 아래 트렌치), 고층 빌딩 사이 고가(7·13·19m 3층), OpenStreetMap 실제 노선", ja: "C1都心環状線：内回り・外回り各約14km——地下トンネル（通常-9m、深い区間-14m）、掘割、高層ビルの間の高架（7・13・19mの3層）、OpenStreetMapの実在路線", en: "C1 Inner Circular Route: inner and outer loops of about 14 km each — tunnels (−9 m, deep sections −14 m), open cuttings, and viaducts at three levels (7 / 13 / 19 m) between the towers, from real OpenStreetMap routes" },
      { type: "new", ko: "도쿄 도심 시가지: C1 주변 1.8km(긴자·시오도메·가스미가세키·간다…) 실제 건물 — 도시 전체 건물 54만 6천 채, 타일 637개", ja: "東京都心の街並み：C1の周囲1.8km（銀座・汐留・霞が関・神田…）の実在建物——街全体で建物54万6千棟、637タイル", en: "Central Tokyo: the real buildings within 1.8 km of the C1 (Ginza, Shiodome, Kasumigaseki, Kanda …) — 546,000 buildings across the whole city in 637 tiles" },
      { type: "new", ko: "스폰 지점 「C1 도심환상선」, 지역 페이지에 C1·하코네 추가", ja: "スポーン地点「C1 都心環状線」、地域ページにC1・箱根を追加", en: "A “C1 Inner Circular” spawn point; C1 and Hakone added to the regions page" },
      { type: "fix", ko: "지면 높이 근처를 지나는 고속도로 위에 공원 나무·가로등이 겹쳐 자라던 문제", ja: "地面の高さを通る高速道路の上に公園の木や街灯が重なっていた問題", en: "Park trees and street lights no longer grow on top of expressways running near street level" },
      { type: "fix", ko: "지상 높이의 고속도로에서 위치 표시가 근처 지명(예: 東京湾)으로 잘못 나오던 문제", ja: "地面の高さの高速道路で現在地表示が近くの地名（例：東京湾）になっていた問題", en: "On expressways near ground level the location label showed a nearby place (e.g. Tokyo Bay) instead of the road" }
    ]
  },
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
    desc: { ko: '요코하마시 전 구역의 실제 3D 건물(PLATEAU)과 미나토미라이·차이나타운·야마시타 공원의 실제 거리, 편의점·코인파킹·표지판·노면 표시. 코스모클록 21, 마린타워, 히카와마루.', ja: '横浜市全域のリアル3Dの建物（PLATEAU）と、みなとみらい・中華街・山下公園の実在の街並み、コンビニ・コインパーキング・標識・路面標示。コスモクロック21、マリンタワー、氷川丸。', en: 'All of Yokohama in real 3D (PLATEAU) plus the real streets of Minato Mirai, Chinatown and Yamashita Park, with Cosmo Clock 21, Marine Tower and the Hikawa Maru.' } },
  { id: 'kawasaki', status: 'live', name: { ko: '쓰루미·가와사키', ja: '鶴見・川崎', en: 'Tsurumi & Kawasaki' }, pref: '神奈川県横浜市鶴見区・川崎市',
    desc: { ko: '주택가·상점가·공장 지대와 철도 노선이 촘촘한 실제 시가지.', ja: '住宅街・商店街・工場地帯と鉄道が密集する実在の市街地。', en: 'Real neighbourhoods, shopping streets, factory districts and dense rail lines.' } },
  { id: 'haneda', status: 'live', name: { ko: '하네다 공항', ja: '羽田空港', en: 'Haneda Airport' }, pref: '東京都大田区',
    desc: { ko: '실제 활주로와 주기장, 이착륙하는 여객기. 만안선 다마가와 터널로 연결.', ja: '実在の滑走路とスポット、離着陸する旅客機。湾岸線の多摩川トンネルで接続。', en: 'The real runways and stands with airliners landing and taking off, reached through the Bayshore’s Tama River Tunnel.' } },
  { id: 'tsubasa', status: 'live', name: { ko: '츠루미 츠바사 다리', ja: '鶴見つばさ橋', en: 'Tsurumi Tsubasa Bridge' }, pref: '首都高速 湾岸線', desc: { ko: '하네다로 이어지는 완간선의 1주 사장교. 밤이면 케이블 조명이 바다 위에 떠요.', ja: '羽田へ続く湾岸線の一本柱斜張橋。夜はケーブルの照明が海に浮かぶ。', en: 'The single-tower cable-stayed bridge on the Bayshore Route toward Haneda; its cables glow over the sea at night.' } },
  { id: 'c1', status: 'live', name: { ko: 'C1 도심환상선', ja: 'C1 都心環状線', en: 'C1 Inner Circular' }, pref: '東京都千代田区・中央区・港区',
    desc: { ko: '도쿄 도심을 도는 약 14km 루프 — 내·외회선, 지하 터널, 掘割(트렌치), 고층 빌딩 사이 고가.', ja: '東京都心を巡る約14kmのループ——内回り・外回り、地下トンネル、掘割、高層ビルの間の高架。', en: 'The ~14 km loop round central Tokyo — inner and outer loops, tunnels, open cuttings and viaducts between the towers.' } },
  { id: 'hakone', status: 'live', name: { ko: '하코네 턴파이크', ja: '箱根ターンパイク', en: 'Hakone Turnpike' }, pref: '神奈川県小田原市・箱根町',
    desc: { ko: '오다와라에서 다이칸야마(990m)까지 13.5km 토우게. 실제 고도 데이터로 만든 산길.', ja: '小田原から大観山（990m）まで13.5kmの峠道。実際の標高データで作った山道。', en: 'A 13.5 km touge from Odawara up to Daikanyama (990 m), built from real elevation data.' } },
  { id: 'route1', status: 'live', name: { ko: '1호 하네다선 · K1 북부', ja: '1号羽田線・K1北部', en: 'Route 1 Haneda & K1 north' }, pref: '首都高速 1号羽田線・K1横羽線',
    desc: { ko: '나마무기에서 가와사키·하네다를 지나 헤이와지마·시바우라를 거쳐 하마자키바시 JCT에서 C1로. 양방향 실제 노선.', ja: '生麦から川崎・羽田を経て平和島・芝浦、浜崎橋JCTでC1へ。上下線とも実在の線形。', en: 'From Namamugi past Kawasaki and Haneda, through Heiwajima and Shibaura to the C1 at Hamazakibashi JCT — both directions, as built.' } },
  { id: 'rainbow', status: 'live', name: { ko: '레인보우 브리지 · 만안선 북부', ja: 'レインボーブリッジ・湾岸線北部', en: 'Rainbow Bridge & Bayshore north' }, pref: '首都高速 11号台場線・湾岸線',
    desc: { ko: '하네다에서 도쿄항 터널을 지나 아리아케 JCT, 11호 다이바선 레인보우 브리지(높이 약 50m)를 건너 시바우라 JCT까지.', ja: '羽田から東京港トンネルを抜けて有明JCT、11号台場線のレインボーブリッジ（高さ約50m）を渡り芝浦JCTへ。', en: 'From Haneda through the Tokyo Port Tunnel to Ariake JCT, then over the Rainbow Bridge (about 50 m up) on Route 11 to Shibaura JCT.' } },
  { id: 'seisho', status: 'live', name: { ko: '하코네 가는 길 (세이쇼 바이패스)', ja: '箱根への道（西湘バイパス）', en: 'Road to Hakone (Seishō bypass)' }, pref: '横浜新道・国道1号・新湘南バイパス・国道134号・西湘バイパス',
    desc: { ko: 'K3 가리바에서 요코하마 신도·국도1호·신쇼난 바이패스를 지나 바다를 따라 세이쇼 바이패스로 오다와라 턴파이크 입구까지 59km.', ja: 'K3狩場から横浜新道・国道1号・新湘南バイパスを経て、海沿いの西湘バイパスで小田原のターンパイク入口まで59km。', en: '59 km from Kariba on the K3 via the Yokohama Shindō, Route 1 and the Shin-Shōnan bypass, then along the sea on the Seishō bypass to the Turnpike at Odawara.' } },
  { id: 'tokyo3d', status: 'live', name: { ko: '도쿄 23구 (실제 3D)', ja: '東京23区（リアル3D）', en: 'Tokyo’s 23 wards (real 3D)' }, pref: '東京都 千代田区・中央区・港区 ほか23区',
    desc: { ko: '국토교통성 3D 도시 모델(PLATEAU)로 23구 전체의 실제 건물을 외벽 사진째 스트리밍. 도쿄타워·긴자·시오도메·오다이바, 밤에는 창문 불빛.', ja: '国土交通省の3D都市モデル（PLATEAU）で23区すべての実在の建物を外壁写真ごとストリーミング。東京タワー・銀座・汐留・お台場、夜は窓の明かり。', en: 'Every real building of all 23 wards from MLIT’s 3D city model (PLATEAU), facade photos included — Tokyo Tower, Ginza, Shiodome, Odaiba, lit windows at night.' } },
  { id: 'kisarazu', status: 'live', name: { ko: '기사라즈', ja: '木更津', en: 'Kisarazu' }, pref: '千葉県木更津市',
    desc: { ko: '아쿠아라인 동쪽 끝. 바다 위 다리를 건너면 닿는 지바현의 실제 3D 시가지.', ja: 'アクアライン東の終点。海上の橋を渡った先の千葉県のリアル3D市街。', en: 'The eastern end of the Aqua-Line: the sea bridge lands you in a real-3D Chiba town.' } },
  { id: 'shonan', status: 'live', name: { ko: '쇼난 (가마쿠라·후지사와)', ja: '湘南（鎌倉・藤沢）', en: 'Shōnan (Kamakura & Fujisawa)' }, pref: '神奈川県鎌倉市・藤沢市',
    desc: { ko: '하코네 가는 해안길 주변의 실제 3D 건물 — 신쇼난 바이패스와 국도 134호.', ja: '箱根へ向かう海沿いのリアル3Dの街——新湘南バイパスと国道134号。', en: 'Real-3D towns along the coast road to Hakone — the Shin-Shōnan bypass and Route 134.' } },
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
