# 📜 MIDNIGHT JAPAN 업데이트 기록 · Changelog

현재 버전 · Current: **v0.2.0**

| 버전 | 날짜 | 이름 | 요약 |
|---|---|---|---|
| [v0.2.0](#v020--bayshore-2026-11-05) | 2026-11-05 | Bayshore | 수도고속 완간선을 따라 하네다까지, 도쿄만 아쿠아라인 해저터널을 지나 우미호타루 PA까지. 실제 3D 차량 모델과 열리는 보닛도 들어왔어요. |
| [v0.1.1](#v011--one-click-2026-11-04) | 2026-11-04 | One Click | 링크 하나로 바로 플레이. 크롬에서 공식 사이트 주소만 열면 설치 없이 실행돼요. |
| [v0.1.0](#v010--first-meet-2026-11-04) | 2026-11-04 | First Meet | 첫 공개 버전. 다이코쿠 JCT·PA와 다이코쿠 부두 일대를 3D로 구현했습니다. |

---

## v0.2.0 — Bayshore (2026-11-05)

> 수도고속 완간선을 따라 하네다까지, 도쿄만 아쿠아라인 해저터널을 지나 우미호타루 PA까지. 실제 3D 차량 모델과 열리는 보닛도 들어왔어요.
> Drive the Shuto Bayshore Route to Haneda and the Tokyo Bay Aqua-Line under the sea to Umihotaru PA — plus real 3D car models with opening bonnets.

**✨ 추가 · New**

- 완간선(B) 연장: 다이코쿠 → 츠루미 츠바사교 → 오기시마 → 가와사키 항로 터널 → 가와사키 우키시마 JCT → 다마가와 터널 → 하네다 (OpenStreetMap 기반)<br><sub>Bayshore Route (B) extended: Daikoku → Tsurumi Tsubasa Bridge → Ōgishima → Kawasaki Fairway Tunnel → Kawasaki-Ukishima JCT → Tama River Tunnel → Haneda (from OpenStreetMap)</sub>
- 도쿄만 아쿠아라인: 9.6km 해저 터널(조명·환기탑 「바람의 탑」) → 우미호타루 → 4.4km 아쿠아 브리지 → 기사라즈<br><sub>Tokyo Bay Aqua-Line: 9.6 km undersea tunnel (lit, with the Kaze-no-Tō ventilation towers) → Umihotaru → 4.4 km Aqua Bridge → Kisarazu</sub>
- 우미호타루 PA: 배 모양 5층 건물(필로티 아래로 본선 통과), 방향별 주차장과 진출입 램프, 커터페이스 기념비, 야간 조명<br><sub>Umihotaru PA: the ship-shaped 5-storey building (the expressway runs beneath it), a lot with entry/exit ramps for each direction, the cutter-face monument, night lighting</sub>
- 도쿄만 풍경: 츠루미 츠바사교, 하네다 공항 활주로 조명, 도쿄 타워, 스카이트리, 레인보우 브리지, 도쿄 게이트 브리지, 가와사키·지바 공업지대 야경, 서쪽 지평선의 후지산<br><sub>Tokyo Bay scenery: Tsurumi Tsubasa Bridge, Haneda runway lights, Tokyo Tower, Skytree, Rainbow Bridge, Tokyo Gate Bridge, Kawasaki & Chiba factory night views, Mt. Fuji on the western horizon</sub>
- 실제 3D 차량 모델 25개를 28개 차종에 적용 (CC BY 4.0, 제작자 표기는 assets/CREDITS.md) — 도장 색·마감 실시간 변경, 바퀴 회전·조향, 램프 점등<br><sub>25 real 3D car models on 28 cars (CC BY 4.0, credits in assets/CREDITS.md) with live paint colour & finish, spinning/steering wheels and working lamps</sub>
- 보닛 개방: 모든 차량에서 엔진룸을 열 수 있음 (MR/RR 차량은 엔진 리드) — 직렬·V형·수평대향·로터리별 엔진 디테일<br><sub>Opening bonnet on every car (engine lid on mid/rear-engined cars) with inline / V / boxer / rotary engine detail</sub>
- 웹사이트: 차량 페이지 3D 미리보기(드래그 회전), 모든 순정 색상·커스텀 색상·마감·휠 색 적용 후 「이 색으로 운전」, 스크롤·호버 모션<br><sub>Website: 3D car preview (drag to rotate), every factory colour plus custom colour, finish and wheel colour, “Drive in this colour”, scroll & hover motion</sub>

**🔧 변경 · Changed**

- 게임 UI 모션: 화면 전환 페이드·슬라이드, 버튼 반응, 계기판 바늘·기어 표시 애니메이션<br><sub>In-game UI motion: fading/sliding screens, button feedback, animated speedometer needle and gear display</sub>

**🐞 수정 · Fixed**

- 도로 노면이 위에서 보면 투명하게 뚫려 보이던 문제 수정 (노면이 아래쪽을 향하고 있었음)<br><sub>Fixed road decks looking transparent from above (their faces pointed downwards)</sub>
- 게임 시작 시 차량 생성 오류와 월드 좌표 오류(NaN)로 일부 지형·건물이 사라지던 문제 수정<br><sub>Fixed a car-building crash at start-up and NaN world coordinates that made parts of the ground and buildings disappear</sub>
- 절차적 차량의 지붕·필러가 보이지 않던 문제 수정, 멀리서 노면 텍스처가 줄무늬로 깨지던 문제 수정<br><sub>Fixed missing roofs/pillars on procedural cars and striped road textures far from the start</sub>

**⚠️ 알려진 문제 · Known issues**

- R34·LFA 등 13종은 라이선스가 확실한 3D 모델이 없어 기존 절차적 모델을 사용<br><sub>13 cars (incl. R34, LFA) still use the procedural model — no clearly licensed 3D model was available</sub>

---

## v0.1.1 — One Click (2026-11-04)

> 링크 하나로 바로 플레이. 크롬에서 공식 사이트 주소만 열면 설치 없이 실행돼요.
> One link, instant play — open the official site in Chrome, no install needed.

**✨ 추가 · New**

- 웹 버전 공개 — 브라우저에서 바로 플레이<br><sub>Web version released — play right in the browser</sub>
- 타이틀 화면에 「▶ 바로 출발」 버튼 — 마지막에 탄 차로 즉시 출발 (Enter 키도 가능)<br><sub>Title screen “▶ Quick start” — drive off instantly in your last car (or press Enter)</sub>

**🔧 변경 · Changed**

- 웹사이트의 「지금 플레이」와 차량 목록의 「운전하기」를 누르면 타이틀을 건너뛰고 바로 주행 시작<br><sub>Website “Play now” and car-list “Drive” buttons skip the title and start driving right away</sub>
- 소리는 첫 키 입력/터치 때 자동으로 켜짐 (브라우저 정책)<br><sub>Sound turns on automatically at the first key press or tap (browser policy)</sub>

---

## v0.1.0 — First Meet (2026-11-04)

> 첫 공개 버전. 다이코쿠 JCT·PA와 다이코쿠 부두 일대를 3D로 구현했습니다.
> First public build — Daikoku JCT, Daikoku PA and the surrounding Daikoku-futō area in full 3D.

**✨ 추가 · New**

- 다이코쿠 PA: 주차장·대형차 구역·편의점(24h)·푸드코트·화장실·자판기 줄·흡연소·고속도로 교통경찰대 분주소<br><sub>Daikoku PA: car & truck bays, 24h convenience store, food court, toilets, vending-machine row, smoking area, expressway police post</sub>
- 다이코쿠 JCT 나선형 루프 램프, 만안선(B)·K5 다이코쿠선 고가도로, 베이브리지 방면<br><sub>Daikoku JCT spiral loop ramps, elevated Bayshore Route (B) and K5 Daikoku Line, Bay Bridge approach</sub>
- 다이코쿠 부두 출입구 톨게이트 (ETC/일반 차로, 차단봉, 보통차·경차 요금)<br><sub>Daikoku-futō toll gate with ETC / cash lanes, barrier arms, standard & kei fares</sub>
- 실제 차량 41종 (R32·R33·R34·R35·GR86·AE86·FD3S·NSX·S2000·경차·EV·순찰차 등) 절차적 고폴리곤 모델<br><sub>41 real-world vehicles (R32/R33/R34/R35, GR86, AE86, FD3S, NSX, S2000, kei, EVs, police) as procedural high-poly models</sub>
- 수동: 시동·클러치·H패턴 변속·엔스트 / 자동: P·R·N·D, 사이드브레이크 / EV 회생제동 3단계·원페달<br><sub>Manual: ignition, clutch, H-pattern, stalling · Auto: P/R/N/D, handbrake · EV regen 3 levels + one-pedal</sub>
- 문·트렁크·창문·후드 개폐, 스트로보 라이트 패턴, 1인칭 콕핏(우핸들), 캠버·차고·트레드 세팅<br><sub>Doors, trunk, windows, hood; strobe patterns; RHD cockpit view; camber, ride height & track tuning</sub>
- 일본 번호판 시스템: 자가용(흰색)·사업용(녹색)·경(노랑)·경사업용(검정)·8넘버<br><sub>Japanese plates: private (white), commercial (green), kei (yellow), kei commercial (black), 8-series</sub>
- 30분 = 12시간 낮밤 순환, 도쿄만 야경(미나토미라이·관람차·공장 야경·베이브리지 조명)<br><sub>30 min = 12 h day/night cycle, Tokyo Bay night view (Minato Mirai, Ferris wheel, factory lights, Bay Bridge)</sub>
- 고속도로 교통 AI, 카밋 NPC (하차·대화·차 구경·출발), 순찰차 단속·확성기·PA 폐쇄 이벤트<br><sub>Traffic AI, car-meet NPCs (get out, chat, admire, leave), police enforcement, loudspeaker, PA closure event</sub>
- 도보 모드와 복장 선택, 출입 금지 구역 차단<br><sub>On-foot mode with outfit selection; restricted areas are blocked</sub>
- 차량 라디오 4채널 (자작 시티팝·유로비트·로파이·엔카풍) — 창문/문을 열면 밖에서도 들림<br><sub>Car radio with 4 stations (original city pop, eurobeat, lo-fi, enka-style) — audible outside when windows/doors are open</sub>
- 20개 언어, 키보드·게임패드·모바일 터치 조작, 그래픽 품질 프리셋<br><sub>20 languages, keyboard / gamepad / touch controls, graphics presets</sub>
- 공식 웹사이트, 로컬 계정(회원가입·닉네임), PWA 설치, 데스크탑 앱(Electron)<br><sub>Official website, local accounts (sign-up, nickname), installable PWA, desktop app (Electron)</sub>
- 차종별 엔진음: 엔진 형식(직렬4·6, V6·V8·V10, 수평대향, 로터리, 경차 3기통, EV)·배기량·엔진 코드별 음색, 터보 휘슬과 블로오프, 자연흡기 고회전·VTEC 전환음, 디젤 트럭<br><sub>Per-car engine sound: layout (I4/I6/V6/V8/V10/boxer/rotary/kei I3/EV), displacement and engine-code voicing, turbo whistle and blow-off, NA high-rev & VTEC crossover, diesel trucks</sub>
- 차량 정보: 제조사·연식·섀시 코드·엔진·구동방식(FF 전륜 / FR·MR·RR 후륜 / AWD 사륜)·터보/자연흡기 표시 (게임 차고 + 웹사이트)<br><sub>Vehicle info: maker, year, chassis code, engine, drivetrain (FF / FR·MR·RR / AWD) and turbo/NA shown in the garage and on the website</sub>
- 실행 간편화: start.command / start.bat 더블클릭, 데스크탑 앱(Windows·macOS·Linux) 자동 빌드<br><sub>Easy launch: double-click start.command / start.bat; desktop builds for Windows, macOS and Linux</sub>

**🔧 변경 · Changed**

- 게임 이름을 MIDNIGHT JAPAN(ミッドナイト・ジャパン)으로 확정<br><sub>Title set to MIDNIGHT JAPAN (ミッドナイト・ジャパン)</sub>

**⚠️ 알려진 문제 · Known issues**

- 온라인 멀티플레이는 아직 없음 (계정은 이 기기에만 저장)<br><sub>No online multiplayer yet — accounts are stored on this device only</sub>


<sub>이 파일은 `data/meta.js`에서 자동 생성됩니다 (`node tools/gen-changelog.mjs`). 게임 안 · 웹사이트 모두 같은 기록을 씁니다.</sub>
