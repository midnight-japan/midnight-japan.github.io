// Shared game metadata: version, changelog, regions. Update VERSION + CHANGELOG on every release.
export const GAME = { title: 'MIDNIGHT JAPAN', titleJa: 'ミッドナイト・ジャパン', version: '0.3.0', build: '2026.11.06' };

// Newest first. type: new | change | fix | known
export const CHANGELOG = [
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
  { id: 'baybridge', status: 'partial', name: { ko: '요코하마 베이브리지', ja: '横浜ベイブリッジ', en: 'Yokohama Bay Bridge' }, pref: '首都高速 湾岸線',
    desc: { ko: '사장교 진입부까지 구현. 혼모쿠 방면은 다음 업데이트.', ja: '斜張橋の取付部まで。本牧方面は次回。', en: 'Built up to the cable-stayed span; Honmoku side comes later.' } },
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
