# 📜 MIDNIGHT JAPAN 업데이트 기록 · Changelog

현재 버전 · Current: **v2.15.5** · [▶ 웹에서 플레이](https://midnight-japan.github.io/) · [🌐 업데이트 페이지](https://midnight-japan.github.io/changelog.html)

| 버전 | 날짜 | 이름 | 요약 |
|---|---|---|---|
| [v2.15.5](#v2155--always-connected-2026-11-20) | 2026-11-20 | Always Connected | 어떤 네트워크에서도 만나도록 중계(MQTT) 예비 경로 추가, 상대 이름표 크기 버그 수정, 일본 전역 지도를 게임답게 단순화. |
| [v2.15.4](#v2154--lobby-online-2026-11-20) | 2026-11-20 | Lobby Online | 온라인 서버(방) 선택과 친구끼리 비공개 방 코드, 🌐 버튼으로 플레이어 목록(차종·거리·핑 ms), 위치 동기화 초당 30회로 지연 감소. |
| [v2.15.3](#v2153--fresh-cache-2026-11-20) | 2026-11-20 | Fresh Cache | 오프라인 캐시 갱신: 새 버전이 바로 적용되도록 캐시 버전 정리, 실사 소품·나무·지도 아이콘 파일도 오프라인 저장. |
| [v2.15.2](#v2152--who-is-where-2026-11-20) | 2026-11-20 | Who Is Where | 온라인 접속자 위치 표시: 미니맵·큰 지도에 닉네임과 차종, 차 위 이름표에도 차종. |
| [v2.15.1](#v2151--meet-up-2026-11-20) | 2026-11-20 | Meet Up | 온라인 만남 연결 안정화: 차단·불안정 신호 서버 교체, 다양한 네트워크(공유기·모바일)에서 서로 찾도록 STUN 서버 추가. |
| [v2.15.0](#v2150--real-streets-2026-11-20) | 2026-11-20 | Real Streets | 실사 3D 모델: 자판기·전신주·가로수 6종·봄 벚꽃(Sketchfab CC BY), 건물 외벽 그늘 보정, 지도 즉시 열기 + 일본 전역 상세 지도·랜드마크 아이콘 약 150개, 원탭 이동, 로비 시작, UI 전면 리디자인·라디오 개선, 차량 실내·유리 개선. |
| [v2.14.4](#v2144--clear-portals-2026-11-20) | 2026-11-20 | Clear Portals | 터널 입구 정리: 지하로 내려가기 직전 도로 위에 깔려 있던 땅·도시 도로·보도·주차장 판을 걷어 내 차가 판을 뚫고 들어가는 것처럼 보이던 문제 수정(38곳 전수 점검). |
| [v2.14.3](#v2143--signposted-2026-11-20) | 2026-11-20 | Signposted | 도심 교차로 표지가 반대 차선에 있던 큰 버그 수정(정지선·止まれ·신호등·횡단보도·속도·일방통행 표지가 이제 내 차선 왼쪽에), 국도·현도에 파란 방면 안내 표지판과 교차로 이름판 추가. |
| [v2.14.2](#v2142--straight-lines-2026-11-20) | 2026-11-20 | Straight Lines | 꼬부랑 차선 수정(차선이 도로 곡선을 정확히 따라감, 도로 중심선의 잔떨림 제거), 고가도로 벽을 뚫고 옆 고가로 넘어가던 문제 수정. |
| [v2.14.1](#v2141--whole-japan-map-2026-11-20) | 2026-11-20 | Whole Japan Map | 인게임 지도가 일본 전체로 열린 뒤 내 위치로 확대, 모든 확대 단계에서 일본 땅·도도부현 경계 표시, 추가된 모든 지역에 핀, 자마 지역 도로까지 지도에, 지도 그리기 10배 빠르게. |
| [v2.14.0](#v2140--open-road-2026-11-20) | 2026-11-20 | Open Road | 투명벽 제거(보이는 벽·건물·물·고가/터널 벽에서만 막힘), 주유소 직원 상주, NPC 트럭 실제 크기, 해바라기 밭을 멀리서도 보이게. |
| [v2.13.11](#v21311--himawari-2026-11-18) | 2026-11-18 | Himawari | 새 지역: 자마 해바라기 밭(가나가와현 자마시, 사가미강) — 실제 밭 모양에 약 2m 해바라기가 줄지어 동쪽을 향하고, 계절 따라 새싹·만개·마른 씨앗·맨흙으로. 주변 7km 마을 도로·건물도 실제 지도로. 보행자가 편의점에 들어가고 나옴. |
| [v2.13.10](#v21310--next-stop-2026-11-18) | 2026-11-18 | Next Stop | 전철에 승객: 창문이 뚫린 차체와 투명 유리, 형광등이 켜진 실내, 파란 롱시트와 손잡이 봉, 앉고 서 있는 승객 — 출퇴근 시간엔 만원, 심야엔 한산. |
| [v2.13.9](#v2139--all-japan-2026-11-18) | 2026-11-18 | All Japan | 사이트 지역 페이지를 일본 전체 지도로(도도부현·주요 도시·오키나와 인셋, 플레이 가능 지역과 오사카 예정 표시), 지역마다 명소 일러스트와 「여기서 달리기」 버튼. 다이코쿠 PA 입구·출구에 段差あり 표시와 과속방지턱. |
| [v2.13.8](#v2138--living-streets-2026-11-18) | 2026-11-18 | Living Streets | 거리에 사람과 동물: 시간대별 보행자(등하교 학생, 출퇴근 직장인, 장보는 사람), 비둘기 무리와 까마귀, 하코네 산길의 사슴. |
| [v2.13.7](#v2137--irasshaimase-2026-11-18) | 2026-11-18 | Irasshaimase | 다이코쿠 PA 편의점에 직원: 계산대 점원(들어오면 돌아보며 인사, 계산할 때 응대)과 진열대를 정리하는 아르바이트생. 진열대 상품이 선반 안에 묻혀 안 보이던 문제 수정. |
| [v2.13.6](#v2136--fill-up-2026-11-18) | 2026-11-18 | Fill Up | 주유소 대폭 추가: 간선도로를 따라 약 1km마다 빈 땅에 주유소(캐노피·펌프·가격 간판·사무실)를 배치 — 모든 주유소에서 풀서비스. |
| [v2.13.5](#v2135--garage-52-2026-11-18) | 2026-11-18 | Garage 52 | 실제 차량 4대 추가로 총 52대 — 프렐류드 BB6·BB1, 시빅 EG 해치백, 레거시 B4 tS. 바퀴가 차체와 한 덩어리인 모델도 바퀴만 떼어 내 굴러가게 처리. |
| [v2.13.4](#v2134--full-service-2026-11-18) | 2026-11-18 | Full Service | 주유소 풀서비스(직원이 나와 유종 추천·주유·창 닦기·결제·출차 유도), 도심 어디서든 자율주행 시작, 실제 차량 5대 추가(48대). |
| [v2.13.3](#v2133--smooth-ride-2026-11-18) | 2026-11-18 | Smooth Ride | 60fps 우선 기본값(내장 GPU는 낮음, 그 외 중간), 프레임에 따라 그리는 거리까지 줄이는 자동 조절, 자율주행 커브 감속과 내비 경로 엄수, NPC 역주행처럼 보이던 문제, 흰 덩어리 트럭·버스 교체, 더 자연스러운 나무, 아주 작게까지 줄어드는 볼륨, 설정 중에도 게임 계속, 로딩 화면 사진, 새 사이트 로고. |
| [v2.13.2](#v2132--lighter-2026-11-18) | 2026-11-18 | Lighter | 메모리 절약: 같은 지면·벽 텍스처를 재질마다 따로 올리던 문제를 고쳐 그래픽 메모리를 약 0.6GB 줄였습니다. C1·하코네·K1·완간선 장거리 자율주행 점검 완료. |
| [v2.13.1](#v2131--way-out-2026-11-18) | 2026-11-18 | Way Out | 버그 수정: 대흑 PA 주차장에서 자율주행이 보이지 않는 벽에 막히거나 옆 칸 주차 차량을 길막으로 오인해 멈추던 문제를 고쳤습니다. |
| [v2.13.0](#v2130--garage-43-2026-11-18) | 2026-11-18 | Garage 43 | 실제 차량 모델 14종 추가(총 43종) — S13 실비아, S2000, 로드스터 ND, RX-8, RX-7 FC, 인테그라 타입R, LFA, 왜건R, 허슬러, 엑스트레일, 어코드, 하이젯, 액티, 엘프. NPC용 저폴리곤 모델과 격자 컬링으로 저화질 60fps, 일본 지도에 47개 도도부현, 스폰 지역 지도 미리보기. |
| [v2.12.0](#v2120--kei-truck-2026-11-18) | 2026-11-18 | Kei Truck | 실제 모델 경트럭 스즈키 캐리 추가(원본 실내 그대로 콕핏), 차·일본 도로를 몰라도 이해할 수 있는 용어 사전, 새 게임 아이콘. |
| [v2.11.1](#v2111--tune-up-2026-11-18) | 2026-11-18 | Tune-up | 버그 수정과 최적화: 제동 시 앞이 숙여지고 가속 시 뒤로 앉도록 차체 움직임 방향 수정, 그려지는 삼각형을 최대 70% 줄인 거리 컬링, 추적 카메라가 고가·건물을 통과하지 않게, R35 차체 반사 개선, NPC 차량 야간 조명, 일본 지도 경계 수정, 이탤릭 제거. |
| [v2.11.0](#v2110--festival-2026-11-18) | 2026-11-18 | Festival | 웹사이트와 게임 UI를 완전히 새 디자인으로: 카본 블랙에 마젠타→오렌지 그라데이션, 사선 버튼과 각진 패널, 굵은 이탤릭 타이포. NPC 차량에 운전자가 타고, 새 대표 스크린샷. |
| [v2.10.0](#v2100--living-city-2026-11-18) | 2026-11-18 | Living City | 살아 있는 거리: 스포츠카가 지나가면 멈춰서 촬영하거나 손 흔드는 사람, 스마트폰 보는 사람, 나란히 걷는 커플. 수도고 야간 도로공사(추월차선 규제)가 일정 시간 생겼다 철수하고, 차가 벚꽃잎·낙엽을 흩날립니다. |
| [v2.9.0](#v290--four-seasons-2026-11-18) | 2026-11-18 | Four Seasons | 사계절 도입(봄 벚꽃 흩날리는 토게, 여름 신록, 가을 단풍, 겨울 앙상한 나무와 눈), 하코네 턴파이크에 비상주차대·주차대, 편의점 앞 아스팔트 주차장과 실제 편의점 브랜드, 콕핏·모바일 버그 수정. |
| [v2.8.0](#v280--autumn-leaves-2026-11-18) | 2026-11-18 | Autumn Leaves | 나무를 전부 새로 만들었습니다: 은행·느티나무·벚나무·녹나무·곰솔·삼나무·단풍나무가 지역과 11월 단풍색에 맞게 서 있고, 하코네엔 황금빛 억새가 핍니다. 은빛 구름 가장자리와 권운, 곡선 가로등, 수도고식 교각, 회색 콘크리트 지면. |
| [v2.7.1](#v271--wayfinder-2026-11-18) | 2026-11-18 | Wayfinder | 지도에서 일본 전체를 볼 수 있고, 사진·방향·거리가 보이는 빠른 이동 카드로 텔레포트가 쉬워졌습니다. 내비가 PA 주차장에서도 하네다·하코네·C1까지 경로를 찾고, 자율주행이 그 경로를 따라갑니다. |
| [v2.7.0](#v270--real-cars-2026-11-18) | 2026-11-18 | Real Cars | 애매한 차량 모델 12종을 정리해 실제 모델이 있는 차만 남기고, 차가 노면에 붙어 달리도록 수직 물리와 노면별 접지력을 새로 만들었습니다. |
| [v2.6.1](#v261--clear-road-2026-11-18) | 2026-11-18 | Clear Road | 도로망 전수 점검: 데크가 서로 뚫고 지나가던 15곳, 접속부 단차, 지상 도로를 가로막던 램프 방호벽을 모두 수정하고 램프의 급경사·덜컹임을 완화했습니다. |
| [v2.6.0](#v260--skyline-2026-11-14) | 2026-11-14 | Skyline | 후지산처럼 도쿄 랜드마크가 멀리서도 선명하게: 도쿄도청·신주쿠 초고층군·롯폰기힐스·미드타운·아자부다이힐스·도라노몬힐스·요코하마 랜드마크타워 추가, 야간 조명과 30km 밖에서도 보이는 항공장애등, 덜 뿌연 공기·밝아진 밤, 창고 외벽 디테일, 무게감 있는 차체 움직임과 수도고 이음매 진동. |
| [v2.5.4](#v254--no-dead-ends-2026-11-14) | 2026-11-14 | No Dead Ends | 맵 전체 도로 끝 자동 점검으로 끊긴 곳 모두 연결(나마무기 K1 5.6m 절벽, 다이코쿠 JCT 만안선→다이코쿠 램프, 하네다 만안선 단차, 공중에서 끝나던 츠루미·시바우라 램프), 텔레포트는 도로와 진행 방향을 골라서. |
| [v2.5.3](#v253--night-fixes-2026-11-14) | 2026-11-14 | Night Fixes | 베이브리지 서쪽 끝 막다른 길 연결, 나란한 고가 사이 구멍 메움과 중앙 방호벽, 터널에서 내려 점프하면 바다 위로 가던 버그, 시빅 번호판, 전체 음량·사이렌 낮춤, 경찰·NPC가 따라붙지 않게, VTEC 소리 강화. |
| [v2.5.2](#v252--every-phone-2026-11-14) | 2026-11-14 | Every Phone | 아이폰 사파리에서 게임이 시작되지 않던 치명적 버그 수정, 휴대폰 HUD 겹침 정리와 버튼 이름 표시, 중앙분리대 통과 금지, 내비 경로 탐색 개선, 번호판(꺾인·字光式) 묻힘 수정, 엔진음 통일감, 젖은 노면·라이트 빛 과함 완화. |
| [v2.5.1](#v251--fast-start-2026-11-14) | 2026-11-14 | Fast Start | 로딩 대폭 단축(PC 48초 → 13초, 시작 전 데이터 96MB → 25MB), 휴대폰 전용 가벼운 텍스처, 디테일한 후지산, 수도고 전역에 큰 방면 안내판·정보판·속도 표지, 다이코쿠 PA 분수 광장·이륜차 주차장·흡연소(OSM 위치). |
| [v2.5.0](#v250--night-cruise-2026-11-14) | 2026-11-14 | Night Cruise | 왼쪽 아래 큰 지도(실제 지도·내 위치·차종), 더 똑똑한 자동변속, 실제 램프 위치에서 나오는 깜빡이·브레이크·전조등, 바다에 빠지지 않게, ETC 안내 음성, 엔진 개성 강화, 그 자리에서 차고·튜닝, 라디오 다음 곡, 字光式·お辞儀 번호판. |
| [v2.4.0](#v240--smooth-stance-2026-11-13) | 2026-11-13 | Smooth Stance | 렉·끊김 대폭 감소(주행 중 셰이더 재컴파일 제거), 차 파손은 옵션(기본 끔), 더 간단한 설정 화면, 스탠스 프리셋 9종과 차종별 기본 세팅, 실제 3D 도쿄 타워. |
| [v2.3.0](#v230--clean-cars-2026-11-13) | 2026-11-13 | Clean Cars | 깨져 보이던 차량 모델 전부 수정, 차마다 다른 엔진·블로오프 사운드, 일본 일상 교통, 더 멀리·선명한 실제 3D 건물, 과한 빛 효과 완화, M1 맥북 에어 60fps. |
| [v2.2.2](#v222--bugfix-2026-11-13) | 2026-11-13 | Bugfix | 버그 수정: 지상으로 내려온 램프(다이시·헤이와지마·시바우라) 끝을 실제 시내 도로와 포장 연결로 이어 막다른 길 제거. |
| [v2.2.1](#v221--60fps-2026-11-13) | 2026-11-13 | 60fps | 모든 기기에서 60프레임 목표: 선명한 해상도는 유지하고 무거운 효과부터 자동으로 줄이는 프레임 관리, 셰이더 미리 컴파일로 끊김 감소. |
| [v2.2.0](#v220--open-road-2026-11-13) | 2026-11-13 | Open Road | 막다른 길·덮인 터널 입구·단차를 맵 전체에서 수정, 경찰은 NPC만 추격, 선명한 실해상도와 더 높은 프레임, 내 위치를 따라가는 반투명 지도, 날씨 버튼. |
| [v2.1.0](#v210--road-marks-2026-11-13) | 2026-11-13 | Road Marks | 실제 일본 도로처럼: 맵 전체에 노면 표시·표지판 — 급커브의 빨간 미끄럼 방지 포장과 감속 표시, 「速度落とせ」「合流注意」, 골목의 「止まれ」 정지선과 표지판, 속도 숫자, 그린벨트, 자전거 화살표. 다리·터널 부근의 하얀 네모 구조물 제거. |
| [v2.0.0](#v200--real-3d-2026-11-13) | 2026-11-13 | Real 3D | 진짜 3D 일본: 일본 정부 3D 도시 모델(PLATEAU)로 도쿄 23구·요코하마·가와사키 등 46개 구·시의 실제 건물을 스트리밍. 맵 전체에서 차는 도로·갓길·주차장, 사람은 인도·주차장·건물 안으로만. 구멍 난 땅 메움, 실제 차량 그대로의 콕핏. |
| [v1.2.0](#v120--autopilot-2026-11-13) | 2026-11-13 | Autopilot | 자동주행(J / AUTO 버튼): 주차 칸에서 출발해 1차로(추월차로)로 맵 전체를 순회. 지도(M)는 실제 OSM 도로·건물·강·철도까지 전부 보이는 전체 지도로 열리고, 차량은 실제 순정 컬러로 도색. |
| [v1.1.1](#v111--sound-&-traffic-2026-11-13) | 2026-11-13 | Sound & Traffic | 교통차량은 전부 실제 3D 모델, 추월차로(1차로)는 플레이어 전용, 경적에 비켜 주는 차들, 실제 녹음으로 바꾼 사운드와 터보 블로오프 「프슈욱」. |
| [v1.1.0](#v110--connected-2026-11-12) | 2026-11-12 | Connected | 맵 전체가 하나로 — 다이코쿠·요코하마·가와사키·하네다·도쿄 도심(C1)·레인보우 브리지·하코네까지 실제 도로로 막힘 없이 이어짐. |
| [v1.0.1](#v101--shakedown-2026-11-12) | 2026-11-12 | Shakedown | 직접 플레이하며 찾은 버그 대수술 — 고속도로의 보이지 않는 벽, PA 밖 허공, 하차 시 끼임, 터널 눈부심, 모바일 페달 실종 등 수정. |
| [v1.0.0](#v100--real-japan-2026-11-06) | 2026-11-06 | Real Japan | 정식 1.0 — 실제 일본의 다섯 곳(C1·하코네·K1 루프·다이코쿠 PA와 만안선·요코하마/도쿄 시가지)을 달리는 게임으로. 홈페이지 전면 리뉴얼. |
| [v0.11.1](#v0111--coin-parking-2026-11-06) | 2026-11-06 | Coin Parking | 시내 주차장에 코인파킹 디테일(주차선·차막이·P 간판·정산기). |
| [v0.11.0](#v0110--inner-circular-2026-11-06) | 2026-11-06 | Inner Circular | C1 도심환상선 개통 — 도쿄 도심의 터널과 고가를 도는 내·외회선 루프, 주변 도쿄 도심 시가지. |
| [v0.10.0](#v0100--touge-2026-11-06) | 2026-11-06 | Touge | 하코네 턴파이크 개통 — 실제 고도 데이터로 만든 산길 13.5km, 정상 다이칸야마 전망 주차장까지. |
| [v0.9.1](#v091--hill-start-2026-11-06) | 2026-11-06 | Hill Start | 오르막 출발 버그 수정, NPC 차량 엔진음, 차 위로 점프, 다이코쿠 부두·PA를 실제처럼 채움. |
| [v0.9.0](#v090--real-drive-2026-11-06) | 2026-11-06 | Real Drive | 대규모 업데이트 — 차체 파손, 스키드마크·타이어 연기, 내비게이션과 텔레포트, 사고 상대·경찰과의 선택형 대화, 일본식 차선 주행과 시간대별 교통량, 터널 갱문과 표지판, 주유소 165곳, 지명 병기. |
| [v0.8.1](#v081--pavement-2026-11-06) | 2026-11-06 | Pavement | 일본 거리다운 회색 보도블록(상점가 일부는 적갈색 블록), 지역 페이지에 K1 요코하마 루프·요코하마 시가지·쓰루미·가와사키·하네다 추가, README·사이트 수치 최신화. |
| [v0.8.0](#v080--yokohama-loop-2026-11-06) | 2026-11-06 | Yokohama Loop | 요코하마 루프 개통 — 다이코쿠 JCT에서 K5를 타고 나마무기 JCT로, K1 요코하네선으로 요코하마역·미나토미라이를 지나 지하로 내려간 뒤, K3 가리바선과 혼모쿠 JCT를 거쳐 베이브리지로 돌아오는 약 17km의 실제 수도고 루프를 달릴 수 있어요. |
| [v0.7.2](#v072--umbrella-2026-11-06) | 2026-11-06 | Umbrella | 비 오는 날 보행자들이 우산을 써요(투명 편의점 우산이 가장 많아요). 달리는 중에 하차 키를 누르면 안내가 나와요. |
| [v0.7.1](#v071--shakedown-2026-11-06) | 2026-11-06 | Shakedown | 버그 수정 — PA에서 시작하면 바로 출발할 수 있고, 여객기 자세·전철 정차·보행자 회피가 자연스러워졌어요. |
| [v0.7.0](#v070--downpour-2026-11-06) | 2026-11-06 | Downpour | 날씨가 생겼어요 — 비 오는 밤의 젖은 노면이 불빛을 반사하고, 그립이 줄고, 빗소리가 들려요. 도시는 고속도로 주변 5km(건물 35만 8천 채)로 넓어졌어요. |
| [v0.6.1](#v061--faces-2026-11-06) | 2026-11-06 | Faces | 사람 얼굴 조형, 실제 3D 모델만 쓰는 NPC 차량, 기본 그래픽(높음)에서 프레임 약 35% 향상. |
| [v0.6.0](#v060--rush-hour-2026-11-06) | 2026-11-06 | Rush Hour | 도시가 움직이기 시작했어요 — 실제 노선을 달리는 전철, 인도를 걷는 사람들, 하네다 공항에 내리고 뜨는 여객기, 걸어 들어갈 수 있는 PA 실내. |
| [v0.5.0](#v050--metropolis-2026-11-06) | 2026-11-06 | Metropolis | 고속도로 밖으로 — OpenStreetMap 실제 데이터로 만든 요코하마·가와사키 시가지 전체(건물 23만 6천 채)를 달릴 수 있게 됐어요. 신호를 지키는 시내 교통, 랜드마크, 튜닝 프리셋, 도시 환경음까지. |
| [v0.4.0](#v040--roadside-2026-11-06) | 2026-11-06 | Roadside | 도로와 수평으로 기우는 차체, 교통량 2배, 고속도로 위 하차, 방음벽·시선유도표, 세월이 묻은 도시, 세밀한 지명, 인쇄물까지 그린 편의점, 실제 버전에 맞춘 로드맵. |
| [v0.3.5](#v035--polish-2026-11-06) | 2026-11-06 | Polish | 버그·경고 정리와 웹사이트·GitHub 페이지 리뉴얼. |
| [v0.3.4](#v034--full-map-2026-11-06) | 2026-11-06 | Full Map | 확대·축소·이동되는 전체 지도, 바퀴마다 움직이는 서스펜션, 로드맵 갱신, GitHub 소개 페이지 리뉴얼. |
| [v0.3.3](#v033--smooth-ride-2026-11-06) | 2026-11-06 | Smooth Ride | 오디오 음량 평준화, 도로 단차 95% 제거, 표지판 171개로 확대, 화면 하단 버전·FPS 표시, 웹사이트 사진 전면 교체. |
| [v0.3.2](#v032--road-paint-2026-11-06) | 2026-11-06 | Road Paint | 노면에 행선지·화살표·제한속도·「止まれ」 표시, 분기점마다 안내 표지판, 도로 구멍과 차로 위 가로등 수정, 스폰 지역 선택과 버전 표시. |
| [v0.3.1](#v031--clean-lines-2026-11-06) | 2026-11-06 | Clean Lines | 차선 표시 정리: 교차로·합류부에서 다른 도로 위로 그어지던 차선 제거, 고속도로 합류·분류부에 굵은 점선, 온라인 접속 안정화. |
| [v0.3.0](#v030--full-throttle-2026-11-06) | 2026-11-06 | Full Throttle | 주행감·사운드·콕핏·그래픽을 전부 다시 만들었어요. 실제 R34, 차종별 실내, 실녹음 엔진음, 난이도 설정, 그리고 도로 위에 서 있던 교각 수정. |
| [v0.2.0](#v020--bayshore-2026-11-05) | 2026-11-05 | Bayshore | 수도고속 완간선을 따라 하네다까지, 도쿄만 아쿠아라인 해저터널을 지나 우미호타루 PA까지. 실제 3D 차량 모델과 열리는 보닛도 들어왔어요. |
| [v0.1.1](#v011--one-click-2026-11-04) | 2026-11-04 | One Click | 링크 하나로 바로 플레이. 크롬에서 공식 사이트 주소만 열면 설치 없이 실행돼요. |
| [v0.1.0](#v010--first-meet-2026-11-04) | 2026-11-04 | First Meet | 첫 공개 버전. 다이코쿠 JCT·PA와 다이코쿠 부두 일대를 3D로 구현했습니다. |

---

## v2.15.5 — Always Connected (2026-11-20)

> 어떤 네트워크에서도 만나도록 중계(MQTT) 예비 경로 추가, 상대 이름표 크기 버그 수정, 일본 전역 지도를 게임답게 단순화.
> Relay (MQTT) fallback so players meet on any network, fixed tiny remote name tags, cleaner game-style all-Japan map.

**✨ 추가 · New**

- 직접 연결(WebRTC)이 막힌 모바일·회사·학교 네트워크에서도 공개 MQTT 중계로 위치·차량·채팅 전달(직접 연결되면 자동으로 빠른 경로 사용)<br><sub>Players behind strict NATs (mobile, office, school) now meet through a public MQTT relay; the fast WebRTC path is used whenever it works</sub>

**🐞 수정 · Fixed**

- 다른 플레이어 이름표가 아주 작게 보이던 문제<br><sub>Other players' name tags were tiny</sub>
- 전국·지역 보기 지도: 지리원 상세 타일은 도시 확대부터, 랜드마크·도시 이름은 줌에 따라 줄여 깔끔하게<br><sub>Country/region map decluttered: detailed GSI tiles only from city zoom, fewer landmarks and city names when zoomed out</sub>

---

## v2.15.4 — Lobby Online (2026-11-20)

> 온라인 서버(방) 선택과 친구끼리 비공개 방 코드, 🌐 버튼으로 플레이어 목록(차종·거리·핑 ms), 위치 동기화 초당 30회로 지연 감소.
> Pick an online server (room) or a private room code for friends, player list on the 🌐 button (car, distance, ping ms), 30 Hz position sync for less lag.

**✨ 추가 · New**

- 🌐 버튼 → 플레이어 목록: 나와 접속자 전원의 닉네임·차종·거리·핑(ms), 채팅 버튼<br><sub>🌐 button → player list: nickname, car, distance and ping (ms) for everyone, plus chat</sub>
- 서버(방) 선택: 大黒PA·湾岸線·C1·箱根·横浜·Free 1·Free 2, 🔒 비공개 방 코드 — 선택한 방은 다음에도 기억<br><sub>Server (room) picker: Daikoku PA, Wangan, C1, Hakone, Yokohama, Free 1/2, or a 🔒 private room code — remembered next time</sub>

**🐞 수정 · Fixed**

- 상대 차 끊김·지연 감소: 위치 전송 초당 10→30회, 핑을 반영한 위치 예측, 더 빠른 보간<br><sub>Smoother, lower-lag remote cars: 10 → 30 Hz updates, ping-aware prediction, faster smoothing</sub>

---

## v2.15.3 — Fresh Cache (2026-11-20)

> 오프라인 캐시 갱신: 새 버전이 바로 적용되도록 캐시 버전 정리, 실사 소품·나무·지도 아이콘 파일도 오프라인 저장.
> Offline cache refresh: cache version synced so new releases apply right away; real props, trees and map icons are cached offline too.

**🐞 수정 · Fixed**

- 서비스 워커 캐시 버전이 1.1.1에 멈춰 있어 일부 브라우저가 예전 파일을 쓰던 문제<br><sub>Service-worker cache version was stuck at 1.1.1, so some browsers kept old files</sub>

---

## v2.15.2 — Who Is Where (2026-11-20)

> 온라인 접속자 위치 표시: 미니맵·큰 지도에 닉네임과 차종, 차 위 이름표에도 차종.
> See where other online players are: nickname and car model on the minimap and full map, car model on their name tags.

**✨ 추가 · New**

- 미니맵: 다른 플레이어를 하늘색 점 + 「닉네임 · 차종」으로, 화면 밖이면 가장자리에 방향 표시<br><sub>Minimap: other players as cyan dots with "nickname · car", on the rim when out of view</sub>
- 큰 지도: 접속자마다 닉네임과 제조사·차종<br><sub>Full map: each player with nickname and make/model</sub>

---

## v2.15.1 — Meet Up (2026-11-20)

> 온라인 만남 연결 안정화: 차단·불안정 신호 서버 교체, 다양한 네트워크(공유기·모바일)에서 서로 찾도록 STUN 서버 추가.
> Steadier online meets: swapped rate-limited/unstable signalling relays and added STUN servers so players on home routers and mobile networks find each other.

**🐞 수정 · Fixed**

- 접속자가 같은 방(다이코쿠 PA)에 있어도 서로 안 보이던 경우 — relay.damus.io 차단·relay.nostr.band 다운 대응<br><sub>Players in the same room sometimes never saw each other — relay.damus.io bans and relay.nostr.band outages worked around</sub>

---

## v2.15.0 — Real Streets (2026-11-20)

> 실사 3D 모델: 자판기·전신주·가로수 6종·봄 벚꽃(Sketchfab CC BY), 건물 외벽 그늘 보정, 지도 즉시 열기 + 일본 전역 상세 지도·랜드마크 아이콘 약 150개, 원탭 이동, 로비 시작, UI 전면 리디자인·라디오 개선, 차량 실내·유리 개선.
> Real 3D models: vending machines, utility poles, six street-tree species and spring cherry trees (Sketchfab CC BY), lifted facade shadows, instant map + detailed all-Japan map with ~150 landmark icons, one-tap travel, lobby on start, full UI redesign and better radio, improved car cabins and glass.

**✨ 추가 · New**

- 실사 3D 자판기·콘크리트 전신주(변압기 포함)·가로수 6종(은행·느티·녹나무·곰솔·삼나무·단풍), 봄에는 실사 벚꽃 — 플레이어 주변은 실사 모델, 멀리는 가벼운 나무<br><sub>Real 3D vending machines, concrete utility poles (some with transformers) and six street-tree species, real cherry blossoms in spring — real models near the player, light trees in the distance</sub>
- 지도: 열자마자 내 위치, 지리원 타일로 일본 전역 상세 지도, 명소별 아이콘 약 150개, 목적지에서 바로 이동<br><sub>Map: opens on your position, detailed all-Japan GSI tiles, ~150 landmark icons, go-now travel</sub>
- 시작하면 항상 로비, UI 전면 리디자인, 새 라디오 플레이어와 음질 개선<br><sub>Always starts in the lobby, full UI redesign, new radio player and cleaner radio sound</sub>

**🐞 수정 · Fixed**

- 항공사진 건물 외벽의 새카만 그늘 보정, 메뉴 위로 겹치던 터치 버튼·HUD, 늘 보이던 경로 안내 바, 라디오 주파수 중복 표시, 차량 실내가 비어 보이던 유리<br><sub>Near-black aerial-photo facades lifted; touch buttons/HUD over menus, always-visible route bar, doubled radio frequency, see-through car glass fixed</sub>

---

## v2.14.4 — Clear Portals (2026-11-20)

> 터널 입구 정리: 지하로 내려가기 직전 도로 위에 깔려 있던 땅·도시 도로·보도·주차장 판을 걷어 내 차가 판을 뚫고 들어가는 것처럼 보이던 문제 수정(38곳 전수 점검).
> Tunnel mouths cleaned up: the ground, city streets, pavements and car parks that lay over the road just before it dips underground are cut away — cars no longer appear to drive through a slab (all 38 portals checked).

**🐞 수정 · Fixed**

- 터널 입구 앞 얕은 구간(지면 −0.3~+0.3m, 입구 60m 앞까지)의 땅을 잘라 냄 — 도쿄 C1·1호선 쪽 큰 땅판과 가나가와 서부 땅판에도 적용(1km 조각으로 나눠 로딩 속도 유지)<br><sub>The ground over the shallow lead-in to tunnel mouths (−0.3…+0.3 m, up to 60 m before) is cut away — also on the big ground planes around the C1 / Route 1 and in western Kanagawa (split into 1 km cells so loading stays fast)</sub>
- 도시 도로·보도·노면 표시·주차장 선이 고속도로 지하 진입부 위에 겹쳐 있던 문제(깊은 구간 위 다리는 그대로)<br><sub>City streets, pavements, road paint and car-park lines no longer lie across expressway cuttings (street bridges over the deep parts stay)</sub>

---

## v2.14.3 — Signposted (2026-11-20)

> 도심 교차로 표지가 반대 차선에 있던 큰 버그 수정(정지선·止まれ·신호등·횡단보도·속도·일방통행 표지가 이제 내 차선 왼쪽에), 국도·현도에 파란 방면 안내 표지판과 교차로 이름판 추가.
> Fixed a big bug that put city junction markings in the oncoming lane (stop lines, 止まれ, signals, crossing / speed / one-way signs now on your own, left-hand side); blue overhead direction boards and intersection name plates on main roads.

**✨ 추가 · New**

- 방면 안내 표지판(方面看板): 국도·현도의 신호 교차로 약 45m 앞, 왼쪽 기둥에서 차로 위로 뻗은 파란 표지 — 직진·좌·우 화살표와 그 방향의 실제 지명(한자 + 로마자)<br><sub>Direction boards (方面看板): ~45 m before signalled junctions on main roads, a blue board cantilevered over the lanes from the left kerb — straight / left / right arrows with the real place names in each direction (kanji + romaji)</sub>
- 교차로 이름판(交差点名): 신호 교차로 모서리 기둥에 파란 이름판(동네 이름 + 로마자)<br><sub>Intersection name plates: a blue plate with the district name (and romaji) on a pole at the corner of signalled junctions</sub>

**🐞 수정 · Fixed**

- 도심 교차로: 정지선·「止まれ」·일시정지 표지·신호등 기둥·횡단보도 표지·차선 화살표·◇ 표시·속도 표지·일방통행·통학로 표지가 모두 반대(오른쪽) 차선에 그려지던 문제 → 일본처럼 진행 방향 왼쪽에<br><sub>City junctions: stop lines, 止まれ, stop signs, signal poles, crossing signs, lane arrows, ◇ markings, speed / one-way / school-route signs were all drawn on the opposite (right) side → now on the left of your direction of travel, as in Japan</sub>

---

## v2.14.2 — Straight Lines (2026-11-20)

> 꼬부랑 차선 수정(차선이 도로 곡선을 정확히 따라감, 도로 중심선의 잔떨림 제거), 고가도로 벽을 뚫고 옆 고가로 넘어가던 문제 수정.
> Wavy lane lines fixed (markings follow the road curve exactly, the jitter in road centrelines is smoothed out); cars no longer slip through a viaduct wall onto the neighbouring deck.

**🐞 수정 · Fixed**

- 도심 차선: 실선이 도로 처음부터 끝까지 직선 하나로 그려져 커브를 가로지르던 문제, 점선이 꺾이는 곳마다 옆으로 밀리던 문제, 교차로 근처면 실선 전체가 사라지던 문제 — 도로와 같은 꼭짓점·4m 간격으로 분할해 정확히 따라감<br><sub>City lane lines: solid lines were one straight quad from end to end (cutting across curves), dashes stepped sideways at every bend, and solid lines vanished entirely near junctions — now split at the road’s own vertices every 4 m and follow it exactly</sub>
- 고속도로·일반도로 중심선의 작은 지그재그를 다듬어 차선 점선과 가장자리가 흔들리지 않음(교차점 연결부는 그대로)<br><sub>Small zigzags in expressway and road centrelines are smoothed so lane dashes and edges no longer ripple (junction joins untouched)</sub>
- 고가도로: 옆에 붙은 다른 고가로 벽을 뚫고 넘어가던 문제 — 실제로 합류·분기하는 구간에서만 건너갈 수 있음<br><sub>Viaducts: you could slip through the wall onto an adjacent deck — now only possible where the roads really merge or diverge</sub>

---

## v2.14.1 — Whole Japan Map (2026-11-20)

> 인게임 지도가 일본 전체로 열린 뒤 내 위치로 확대, 모든 확대 단계에서 일본 땅·도도부현 경계 표시, 추가된 모든 지역에 핀, 자마 지역 도로까지 지도에, 지도 그리기 10배 빠르게.
> The in-game map opens on all of Japan and flies in to you, shows Japan’s land and prefecture borders at every zoom, pins every added region, includes the Zama streets, and draws 10× faster.

**✨ 추가 · New**

- 지도에 모든 지역 핀(다이코쿠 PA·하코네·자마 해바라기 밭·우미호타루 등)과 자마 지역 도로·건물<br><sub>Pins for every region on the map (Daikoku PA, Hakone, Zama sunflower fields, Umihotaru …) and the Zama streets and buildings</sub>

**🔧 변경 · Changed**

- 지도(M): 일본 전체가 보이는 상태로 열리고 1.6초 동안 내 위치로 확대(휠·터치하면 멈춤)<br><sub>Map (M): opens on all of Japan and zooms in to you over 1.6 s (wheel / touch stops it)</sub>
- 성능: 지도 그리기 11ms → 1ms (화면 밖 도로 생략, 경로 캐시) — 지도를 열어도 프레임 유지<br><sub>Performance: map drawing 11 ms → 1 ms (off-screen roads skipped, cached paths) — the frame rate holds with the map open</sub>

**🐞 수정 · Fixed**

- 지도에서 고속도로 데이터 밖 지역(자마·하코네 가는 길 등)이 바다처럼 보이던 문제 — 모든 확대 단계에서 일본 땅과 도도부현 경계, 땅·바다 대비 강화<br><sub>Areas beyond the expressway data (Zama, the road to Hakone …) looked like sea on the map — Japan’s land and prefecture borders now show at every zoom, with clearer land / sea contrast</sub>

---

## v2.14.0 — Open Road (2026-11-20)

> 투명벽 제거(보이는 벽·건물·물·고가/터널 벽에서만 막힘), 주유소 직원 상주, NPC 트럭 실제 크기, 해바라기 밭을 멀리서도 보이게.
> No more invisible walls (only visible walls, buildings, water and viaduct / tunnel sides stop you), attendants always on duty at fuel stations, NPC trucks at real size, sunflower fields visible from afar.

**✨ 추가 · New**

- 주유소 직원 상주: 주변 주유소마다 직원이 항상 사무실 앞에 서 있고, 주유 공간을 오가며, 차가 들어오면 돌아보고 손짓 — 주유하면 그 직원이 응대하고 끝나면 사무실 앞으로 돌아감<br><sub>Fuel-station attendants are always on duty: standing at the office door, walking the forecourt, turning and waving cars in — the same attendant serves you and walks back to the door afterwards</sub>

**🔧 변경 · Changed**

- 해바라기 밭: 밭 가장자리를 따라 해바라기 띠, 꽃밭 면 양면 표시, 6km 밖에서도 표시<br><sub>Sunflower fields: a band of sunflowers along the field edges, the flower surface shown from both sides, drawn from 6 km away</sub>

**🐞 수정 · Fixed**

- 투명벽 제거: 지도상 도로·주차장 밖이라도 빈 땅이면 들어갈 수 있음 — 건물·펜스·기둥(충돌체), 바다·강, 고가 위(난간)와 터널 안(벽)에서만 막힘<br><sub>Invisible walls removed: open ground off the mapped streets and car parks is now drivable — only buildings, fences and poles (their colliders), the sea and rivers, viaduct parapets and tunnel walls stop you</sub>
- NPC 트럭(이스즈 엘프 탑차)이 4.7m로 줄어 있던 문제 → 실제 3톤 탑차 크기(길이 6.6m·높이 2.35m)<br><sub>NPC trucks (Isuzu Elf box truck) were shrunk to 4.7 m → real 3-tonne box-truck size (6.6 m long, 2.35 m tall)</sub>

---

## v2.13.11 — Himawari (2026-11-18)

> 새 지역: 자마 해바라기 밭(가나가와현 자마시, 사가미강) — 실제 밭 모양에 약 2m 해바라기가 줄지어 동쪽을 향하고, 계절 따라 새싹·만개·마른 씨앗·맨흙으로. 주변 7km 마을 도로·건물도 실제 지도로. 보행자가 편의점에 들어가고 나옴.
> New area: the Zama sunflower fields (Zama, Kanagawa, on the Sagami River) — ~2 m sunflowers in rows facing east on the real plots, changing with the season (young plants, full bloom, dry seed heads, bare soil), plus 7 km of the surrounding town from the real map. Pedestrians now go in and out of konbini.

**✨ 추가 · New**

- 자마 해바라기 밭: 자카에바시 북쪽 자마 구역과 요쓰야 구역(실제 농지 경계), 가까이는 3D 해바라기(줄기·잎·꽃잎·씨앗), 멀리는 꽃밭 표면, 뒤로 후지산 — 스폰 선택·빠른 이동·사이트 지역 페이지에 추가<br><sub>Zama sunflower fields: the Zama plots north of Zakae Bridge and the Yotsuya plots (real field outlines), 3D sunflowers up close (stem, leaves, petals, seed disc) and a flower-field surface further out, Mt Fuji behind — in the spawn picker, quick travel and the site regions page</sub>
- 자마 주변 약 7×7km 마을(도로·건물·철도·편의점·주유소)을 실제 지도 데이터로 추가<br><sub>About 7 × 7 km of the town around Zama (streets, buildings, railway, konbini, fuel stations) from real map data</sub>
- 보행자 일과: 지나가다 편의점에 들어가거나, 편의점에서 봉지를 들고 나와 길을 걸어감<br><sub>Pedestrian routines: people pop into konbini they pass, others come out carrying a bag and walk on</sub>

---

## v2.13.10 — Next Stop (2026-11-18)

> 전철에 승객: 창문이 뚫린 차체와 투명 유리, 형광등이 켜진 실내, 파란 롱시트와 손잡이 봉, 앉고 서 있는 승객 — 출퇴근 시간엔 만원, 심야엔 한산.
> Passengers on the trains: a body with real window openings and clear glass, a lit cabin, blue long bench seats and grab rails, seated and standing passengers — packed at rush hour, nearly empty late at night.

**✨ 추가 · New**

- 전철 실내와 승객(혼잡도는 시간대에 따라: 출퇴근 만원·낮 보통·심야 한산), 밤에는 실내 불빛<br><sub>Train cabins with passengers (load by the hour: packed at rush hour, normal by day, nearly empty late at night), lit at night</sub>

**🐞 수정 · Fixed**

- 전철 문이 차체 폭 전체를 막는 상자였던 문제 → 양쪽 얇은 문짝<br><sub>Train doors were full-width blocks through the car → thin door leaves on each side</sub>

---

## v2.13.9 — All Japan (2026-11-18)

> 사이트 지역 페이지를 일본 전체 지도로(도도부현·주요 도시·오키나와 인셋, 플레이 가능 지역과 오사카 예정 표시), 지역마다 명소 일러스트와 「여기서 달리기」 버튼. 다이코쿠 PA 입구·출구에 段差あり 표시와 과속방지턱.
> The site regions page is now a map of all Japan (prefectures, major cities, Okinawa inset, drivable area and planned Osaka) with a landmark illustration and a “Drive here” button per region. 段差あり markings and speed humps at the Daikoku PA entry and exit.

**✨ 추가 · New**

- 지역 페이지: 일본 전체 도도부현 지도 + 도쿄만·하코네 확대 지도(지역 마커), 각 지역 카드에 명소 일러스트(PA·JCT·부두·사장교·도시·공장·공항·도쿄타워·산길·해안·우미호타루)와 바로 그 장소에서 시작하는 버튼<br><sub>Regions page: a prefecture map of all Japan plus a Tokyo Bay & Hakone close-up with region markers; each region card has a landmark illustration (PA, JCT, port, cable-stayed bridge, city, factories, airport, Tokyo Tower, mountain road, coast, Umihotaru) and a button that starts the game right there</sub>
- 다이코쿠 PA: 입구와 출구 차로에 노란 「段差あり」 노면 표시와 노랑·검정 과속방지턱<br><sub>Daikoku PA: yellow 段差あり road markings and yellow-black speed humps on the entry and exit lanes</sub>

---

## v2.13.8 — Living Streets (2026-11-18)

> 거리에 사람과 동물: 시간대별 보행자(등하교 학생, 출퇴근 직장인, 장보는 사람), 비둘기 무리와 까마귀, 하코네 산길의 사슴.
> People and animals on the streets: pedestrians by the hour (students going to school, commuters, shoppers), pigeon flocks and crows, deer on the Hakone mountain roads.

**✨ 추가 · New**

- 보행자 유형: 등하교 시간엔 교복 학생(가쿠란·세일러복, 둘씩 걷기, 책가방), 출퇴근 시간엔 정장 직장인(서류가방, 빠른 걸음, 휴대폰), 낮에는 쇼핑백을 든 사람들<br><sub>Pedestrian types: uniformed students at school times (gakuran / sailor suits, in pairs, school bags), suited office workers at rush hour (briefcases, brisk pace, phones), shoppers with carrier bags by day</sub>
- 비둘기: 낮의 도심 보도에서 무리 지어 모이를 쪼다가 차나 사람이 다가오면 날갯짓 소리와 함께 날아오름 / 까마귀: 도심 상공을 선회하며 가끔 울음<br><sub>Pigeons peck in flocks on city pavements by day and burst up with a clatter of wings when a car or you come close / crows circle over the city and caw now and then</sub>
- 사슴: 하코네 산길 가장자리(가드레일 밖)에서 풀을 뜯다가 고개를 들고, 차가 다가오면 숲으로 뛰어감 — 해 질 녘·밤에 더 자주, 헤드라이트에 눈이 반짝임<br><sub>Deer graze at the edge of the Hakone roads (beyond the guardrail), look up and bound into the trees as you approach — more often at dusk and night, eyes shining in the headlights</sub>

---

## v2.13.7 — Irasshaimase (2026-11-18)

> 다이코쿠 PA 편의점에 직원: 계산대 점원(들어오면 돌아보며 인사, 계산할 때 응대)과 진열대를 정리하는 아르바이트생. 진열대 상품이 선반 안에 묻혀 안 보이던 문제 수정.
> Staff in the Daikoku PA konbini: a clerk at the register (turns and greets you as you come in, serves you at checkout) and a part-timer restocking the aisles. Fixed products buried inside the shelves.

**✨ 추가 · New**

- 편의점 점원: 유니폼 차림으로 계산대 뒤에 서서 손님 쪽을 보고, 들어오면 인사, 구매하면 응대<br><sub>Konbini clerk in uniform behind the register — greets you on entry and serves you when you buy</sub>
- 품출 아르바이트생: 통로를 걸어 다니며 선반 앞에 쪼그려 앉아 상품을 정리<br><sub>A part-timer walks the aisles and crouches at the shelves restocking</sub>

**🐞 수정 · Fixed**

- 진열대가 통째 상자라 상품이 안에 묻혀 보이지 않던 문제 — 뒤판과 선반으로 교체<br><sub>Shelves were solid blocks hiding the products inside — now a back panel with boards</sub>

---

## v2.13.6 — Fill Up (2026-11-18)

> 주유소 대폭 추가: 간선도로를 따라 약 1km마다 빈 땅에 주유소(캐노피·펌프·가격 간판·사무실)를 배치 — 모든 주유소에서 풀서비스.
> Many more fuel stations: one about every kilometre along main roads on free lots (canopy, pumps, price pole, office) — full service at every one.

**✨ 추가 · New**

- 주유소가 지도에 빠져 있던 곳까지 간선도로변 빈 땅에 자동 배치(다른 주유소와 420m 이상, 교차로·건물·물가 회피), 주행 가능한 콘크리트 바닥과 진입로 포함<br><sub>Fuel stations are placed on free lots along main roads where the map had none (420 m+ apart, clear of junctions, buildings and water), with a drivable concrete forecourt and driveway</sub>
- 주유소 사무실(유리 정면·브랜드 띠) — 직원이 실제 사무실 문에서 걸어 나옴<br><sub>A sales office at each station (glass front, brand band) — the attendant now walks out of its door</sub>

---

## v2.13.5 — Garage 52 (2026-11-18)

> 실제 차량 4대 추가로 총 52대 — 프렐류드 BB6·BB1, 시빅 EG 해치백, 레거시 B4 tS. 바퀴가 차체와 한 덩어리인 모델도 바퀴만 떼어 내 굴러가게 처리.
> 4 more real cars, 52 in total — Prelude BB6 and BB1, Civic EG hatchback, Legacy B4 tS. Models whose wheels were fused to the body now get them split out so they roll.

**✨ 추가 · New**

- 실제 차량 4대(CC-BY, 순정): 혼다 프렐류드 SiR(BB6), 혼다 프렐류드 4세대(BB1), 혼다 시빅 EG 해치백, 스바루 레거시 B4 2.5GT tS(BM9) — 총 52대<br><sub>4 real cars (CC-BY, stock): Honda Prelude SiR (BB6), Prelude 4th gen (BB1), Civic EG hatchback, Subaru Legacy B4 2.5GT tS (BM9) — 52 in total</sub>

**🔧 변경 · Changed**

- 차량 변환 도구: 바퀴가 차체 메시에 붙은 모델에서 연결된 부품 단위로 타이어·휠을 찾아 분리(굴러가는 바퀴). 게임 리핑이 의심되는 S14·데미오·DC5·레거시 왜건 모델과 텍스처가 깨지는 세드릭 모델은 저작권·품질 이유로 제외<br><sub>Car pipeline: wheels fused into the body mesh are found by connected parts and split out so they roll. S14, Demio, DC5 and Legacy wagon models that look like game rips, and a Cedric with broken textures, were left out for copyright / quality reasons</sub>

---

## v2.13.4 — Full Service (2026-11-18)

> 주유소 풀서비스(직원이 나와 유종 추천·주유·창 닦기·결제·출차 유도), 도심 어디서든 자율주행 시작, 실제 차량 5대 추가(48대).
> Full-service fuel stations (an attendant recommends the fuel, fills up, wipes the glass, takes payment and waves you out), autopilot from any city street, 5 more real cars (48).

**✨ 추가 · New**

- 주유소 풀서비스: 펌프 옆에 서서 E — 직원이 사무실에서 걸어 나와 「いらっしゃいませ！」, 차에 맞는 유종 추천(하이옥/레귤러/경유, 잘못된 유종은 거절), 가득·¥3,000·20L 선택, 걸레를 대고 주유, 창 닦기, 결제 후 「어느 쪽으로 나가세요?」 묻고 도로까지 유도<br><sub>Full-service fuel: stop by a pump and press E — the attendant walks out of the office (“いらっしゃいませ！”), recommends the right fuel (high-octane / regular / diesel, refuses the wrong one), full / ¥3,000 / 20 L, fills up with a cloth at the filler, wipes the glass, takes payment, asks which way you are heading and guides you out onto the road</sub>
- 자율주행을 도심 도로에서도 시작: 가장 가까운 고속도로 진입로까지 도시 도로망으로 경로를 짜고(지나친 모서리는 건너뜀), 막히면 진입로로 이동<br><sub>Autopilot now starts from city streets: routes the street network to the nearest expressway on-ramp (skips passed corners), with an on-ramp fallback when stuck</sub>
- 실제 차량 5대(CC-BY, 순정에 가까운 모델): 닛산 로렐 C33, 혼다 라그레이트, 닛산 큐브 Z11, 미쓰비시 랜서 에볼루션 VI, 미쓰비시 GTO — 큐브·라그레이트·로렐은 도심 교통에도 등장 (총 48대). 바퀴가 차체와 붙어 굴러가지 않는 프렐류드·시빅 모델은 제외<br><sub>5 real cars (CC-BY, close to stock): Nissan Laurel C33, Honda LaGreat, Nissan Cube Z11, Mitsubishi Lancer Evolution VI, Mitsubishi GTO — Cube, LaGreat and Laurel also drive in city traffic (48 total). Prelude and Civic models with wheels fused to the body were not used</sub>

**🐞 수정 · Fixed**

- 주유소 바닥과 진입로가 주행 가능 영역에서 빠져 있어 펌프 옆에 세우면 차가 밀려나던 문제<br><sub>Fuel-station forecourts and driveways were missing from the drivable area (a car stopped at a pump was pushed away)</sub>

---

## v2.13.3 — Smooth Ride (2026-11-18)

> 60fps 우선 기본값(내장 GPU는 낮음, 그 외 중간), 프레임에 따라 그리는 거리까지 줄이는 자동 조절, 자율주행 커브 감속과 내비 경로 엄수, NPC 역주행처럼 보이던 문제, 흰 덩어리 트럭·버스 교체, 더 자연스러운 나무, 아주 작게까지 줄어드는 볼륨, 설정 중에도 게임 계속, 로딩 화면 사진, 새 사이트 로고.
> 60-fps-first defaults (Low on integrated GPUs, Medium otherwise), an auto-governor that also cuts draw distance, autopilot slows for bends and sticks to the GPS route, NPC cars no longer look like they drive the wrong way, the white clay truck and bus replaced, more natural trees, volume that goes really quiet, settings without pausing, a loading-screen photo and the new site logo.

**🔧 변경 · Changed**

- 성능: 기본 화질을 60fps 기준으로(M1 같은 내장 GPU·휴대폰은 낮음, 그 외 중간 — 기존 저장값도 한 번 이동), 프레임이 떨어지면 그림자·해상도뿐 아니라 도로·소품·NPC 차량의 그리는 거리도 줄이고 2배 빨리 반응, 표지판 텍스처 해상도 상한, GPU에 올린 지오메트리 사본 해제<br><sub>Performance: 60-fps defaults (Low on integrated GPUs such as M1 and on phones, Medium otherwise — saved settings move once), the governor now also shortens the draw distance of roads, props and NPC cars and reacts twice as fast, capped sign-texture resolution, CPU copies of uploaded geometry freed</sub>
- 나무 잎을 1.6배 빽빽하게, 11월 색을 초록 위주로(은행·단풍만 노랑·빨강)<br><sub>Tree crowns 1.6× fuller, November colours mostly green (only ginkgo and maple turn yellow and red)</sub>
- 소리: 체감 곡선으로 낮은 단계가 훨씬 조용하게, 1% 단위 조절 / 설정 화면을 열어도 게임이 멈추지 않음 / 로딩 화면에 분위기 사진 / 사이트 로고·파비콘 새 아이콘으로(캐시 갱신)<br><sub>Sound: a perceptual curve so low settings are really quiet, 1 % steps / settings no longer pause the game / an atmospheric photo on the loading screen / site logo and favicon updated to the new icon (cache-busted)</sub>

**🐞 수정 · Fixed**

- 자율주행: 커브에서 감속(횡가속 5→2.6m/s²), 제한속도의 약 1.25배까지만, 목적지가 있으면 경로가 계산될 때까지 분기점을 추측하지 않음(이탈 최대 13m), 주차장 출구 모서리에서 펜스에 걸리던 문제<br><sub>Autopilot: slows for bends (lateral 5→2.6 m/s²), keeps to about 1.25× the limit, never guesses at junctions while the GPS route is being worked out (max 13 m off route), no longer rubs along the fence at the car-park exit corner</sub>
- NPC 차량이 재배치된 직후 반대 방향을 보며 회전해 역주행처럼 보이던 문제, 지도 NPC 아이콘을 진행 방향 화살표로(주차 차량은 표시 안 함), 단일 재질이라 흰 덩어리로 보이던 캔터 트럭·로자 버스를 이스즈 엘프로 교체<br><sub>NPC cars spun round right after being re-placed (looked like wrong-way driving), map NPC icons are now heading arrows (parked cars hidden), the single-material white Canter truck and Rosa bus are replaced by the Isuzu Elf</sub>

---

## v2.13.2 — Lighter (2026-11-18)

> 메모리 절약: 같은 지면·벽 텍스처를 재질마다 따로 올리던 문제를 고쳐 그래픽 메모리를 약 0.6GB 줄였습니다. C1·하코네·K1·완간선 장거리 자율주행 점검 완료.
> Memory saving: the same ground and wall textures were uploaded once per material — now shared, about 0.6 GB less video memory. Long autopilot drives on C1, Hakone, K1 and the Bayshore checked.

**🐞 수정 · Fixed**

- 지면·벽·콘크리트 등 텍스처를 이미지 1장으로 공유(2K 텍스처 192→170장, 약 2.4GB→1.9GB) — 저사양·휴대폰에서 탭이 종료될 위험 감소<br><sub>Ground, wall and concrete textures now share one image each (2K maps 192→170, ~2.4 GB→1.9 GB) — less risk of the tab being killed on low-memory machines and phones</sub>

---

## v2.13.1 — Way Out (2026-11-18)

> 버그 수정: 대흑 PA 주차장에서 자율주행이 보이지 않는 벽에 막히거나 옆 칸 주차 차량을 길막으로 오인해 멈추던 문제를 고쳤습니다.
> Bug fixes: the autopilot no longer stops at an invisible wall in the Daikoku PA car park or mistakes cars in the neighbouring bays for obstacles.

**🔧 변경 · Changed**

- 점검: 사이트 6개 페이지(PC·휴대폰), 메뉴·지도·차고·날씨·계절·용어집, 스폰 15곳, 플레이 가능 차량 전부(실제 모델·바퀴 4개), 2분 자율주행, 하차·탑승에서 오류 없음 확인<br><sub>Checked: 6 site pages (desktop and phone), menus, map, garage, weather, season, glossary, all 15 spawns, every playable car (real model, 4 wheels), a 2-minute autopilot drive, getting out and back in — no errors</sub>

**🐞 수정 · Fixed**

- PA 주차장 경계와 출구 차선 사이에 폭 1칸의 “보이지 않는 벽”이 있던 문제(실제 펜스는 그대로 막힘)<br><sub>A one-cell “invisible wall” between the PA car park edge and the exit lane is gone (the real fence still blocks)</sub>
- 자율주행: 주차칸에서 나올 때 통로 건너편·옆 칸 차량을 길막으로 오인하던 문제, 통로에 다 나온 뒤 회전하도록 수정, 붐비는 주차장에서 세 번 막히면 출구 차선에서 이어가기 — 탈출 성공률 2/4 → 4/4<br><sub>Autopilot: no longer mistakes cars across the aisle or in the next bay for obstacles, turns only once fully in the aisle, and in a packed car park continues from the exit lane after three tries — escape rate 2/4 → 4/4</sub>

---

## v2.13.0 — Garage 43 (2026-11-18)

> 실제 차량 모델 14종 추가(총 43종) — S13 실비아, S2000, 로드스터 ND, RX-8, RX-7 FC, 인테그라 타입R, LFA, 왜건R, 허슬러, 엑스트레일, 어코드, 하이젯, 액티, 엘프. NPC용 저폴리곤 모델과 격자 컬링으로 저화질 60fps, 일본 지도에 47개 도도부현, 스폰 지역 지도 미리보기.
> 14 more real car models (43 in all) — S13 Silvia, S2000, Roadster ND, RX-8, RX-7 FC, Integra Type R, LFA, Wagon R, Hustler, X-Trail, Accord, Hijet, Acty, Elf. Low-poly NPC models and cell culling give 60 fps on Low, 47 prefectures on the Japan map, and a map preview of your spawn.

**✨ 추가 · New**

- 실제 모델 14종(CC-BY, 순정 위주): 닛산 실비아 S13, 혼다 S2000(AP1), 마쓰다 로드스터(ND), RX-8, RX-7 FC, 혼다 인테그라 타입R(DC2), 렉서스 LFA, 스즈키 왜건R, 허슬러, 닛산 엑스트레일, 혼다 어코드 — 그리고 NPC 교통용 다이하쓰 하이젯, 혼다 액티, 이스즈 엘프. 모두 바퀴가 따로 굴러가고 번호판·라이트가 붙음<br><sub>14 real models (CC-BY, mostly stock): Nissan Silvia S13, Honda S2000 (AP1), Mazda Roadster (ND), RX-8, RX-7 FC, Honda Integra Type R (DC2), Lexus LFA, Suzuki Wagon R, Hustler, Nissan X-Trail, Honda Accord — plus Daihatsu Hijet, Honda Acty and Isuzu Elf in traffic. All with spinning wheels, plates and lights</sub>
- 일본 전체 지도에 47개 도도부현 경계·이름, 타이틀의 스폰 지역 선택 시 실제 지도 미리보기와 출발 방향 화살표<br><sub>The Japan map shows all 47 prefectures; choosing a spawn on the title screen shows a real map preview with the direction you set off in</sub>

**🔧 변경 · Changed**

- 모델 품질 기준: 게임에서 추출한 모델(포르자 재질명 등), 레이싱 래핑·밈 스티커, 바퀴 분리 불가, 출처 불확실 모델은 제외<br><sub>Model rules: anything extracted from games (Forza material names …), race liveries / meme decals, wheels that can’t be separated or unclear provenance is left out</sub>
- 최적화: NPC 차량은 저폴리곤 버전(평균 3만 삼각형) 사용, 도로 설비·소품·표지판·하코네 나무와 풀을 격자 단위로 컬링 — 저화질 기준 PA 1,700만→320만, 시내 1,100만→320만, 하코네 490만→280만 삼각형으로 60fps<br><sub>Optimisation: NPC cars use low-poly versions (~30k triangles), road furniture, props, signs and Hakone trees/grass are culled per cell — on Low: PA 17M→3.2M, city 11M→3.2M, Hakone 4.9M→2.8M triangles, 60 fps</sub>

---

## v2.12.0 — Kei Truck (2026-11-18)

> 실제 모델 경트럭 스즈키 캐리 추가(원본 실내 그대로 콕핏), 차·일본 도로를 몰라도 이해할 수 있는 용어 사전, 새 게임 아이콘.
> A real-model Suzuki Carry kei truck (with its own cab as the cockpit), a plain-language glossary for anyone new to cars or Japanese roads, and a new game icon.

**✨ 추가 · New**

- 스즈키 캐리 트럭(DD51T): 실내·계기판·핸들까지 있는 고품질 모델(CC-BY), 콕핏은 원본 실내 그대로. 시내·도로에도 경트럭이 달림<br><sub>Suzuki Carry truck (DD51T): a detailed model with full cab, gauges and wheel (CC-BY); the cockpit is its own real cab. Kei trucks now drive around town too</sub>
- 용어 사전(📖, 메뉴): 완간선·수도고·C1·PA·JCT·ETC·토게·비상주차대·차선규제, 츠라이치·샤코탄·VIP·오니캔·캠버·차고조, 경차·경트럭·JDM·터보·로터리·구동방식·변속기를 쉬운 말로. 차고 스탠스 프리셋 아래에 설명, 처음 들어가는 도로에선 한 줄 안내<br><sub>Glossary (📖, menu): the Bayshore, Shutokō, C1, PA, JCT, ETC, touge, emergency bays and lane closures; tsuraichi, shakotan, VIP, oni-camber, camber, coilovers; kei cars and trucks, JDM, turbo, rotary, drivetrains and gearboxes — in plain words. Explained under the garage stance presets, and a one-line tip the first time you drive onto a kind of road</sub>

**🔧 변경 · Changed**

- 새 게임 아이콘(석양과 고속도로), 이전 아이콘 교체<br><sub>New game icon (sunset over the expressway), replacing the old one</sub>

---

## v2.11.1 — Tune-up (2026-11-18)

> 버그 수정과 최적화: 제동 시 앞이 숙여지고 가속 시 뒤로 앉도록 차체 움직임 방향 수정, 그려지는 삼각형을 최대 70% 줄인 거리 컬링, 추적 카메라가 고가·건물을 통과하지 않게, R35 차체 반사 개선, NPC 차량 야간 조명, 일본 지도 경계 수정, 이탤릭 제거.
> Fixes and optimisation: the nose now dives under braking and squats on throttle (it was reversed), distance culling draws up to 70% fewer triangles, the chase camera no longer passes through decks or buildings, smoother R35 paint reflections, NPC car lights at night, a correct Japan outline on the map, upright text.

**🔧 변경 · Changed**

- 최적화: 도로망을 1.5km 격자로 나눠 화면 밖·먼 구간 생략, 하코네는 근처에서만 렌더링, 멀리 있는 NPC 차량 생략 — 장면 삼각형 2,000만~4,600만 → 1,100만~1,700만<br><sub>Optimisation: the road network is split into 1.5 km cells (off-screen and far cells skipped), Hakone only renders nearby, far NPC cars are skipped — scene triangles 20–46 M → 11–17 M</sub>

**🐞 수정 · Fixed**

- 차체 피치·롤 방향 반전 수정(제동=앞 숙임, 가속=뒤 앉음, 코너 바깥쪽으로 기울기), 언덕/공중 서스펜션 방향 수정<br><sub>Body pitch and roll were reversed — braking now dips the nose, throttle squats the rear, the body leans out of a corner; crest/air suspension travel fixed too</sub>
- 추적 카메라가 위쪽 고가 상판이나 건물·교각을 통과하지 않고 낮추거나 가까이 붙음<br><sub>The chase camera drops under an overhead deck or moves in rather than passing through decks, buildings and piers</sub>
- R35 등 차체 반사가 구겨진 은박지처럼 보이던 문제(차체 노멀 재계산), 메탈릭 도장 반사를 실제 수준으로<br><sub>Body reflections that rippled like crumpled foil (R35 and others) — paint normals recomputed; metallic paint toned to real-car levels</sub>
- NPC 차량 야간 전조등·미등 점등, 낙엽·꽃잎은 낙엽이 깔린 토게에서만 튐, 일본 전체 지도에서 일본 외 지역(한반도 연안 섬 등) 제거, 사이트·게임 텍스트 이탤릭 제거<br><sub>NPC cars light up at night; petals/leaves only kick up on the leaf-strewn touge; non-Japanese coasts removed from the Japan map; no more italic text</sub>

---

## v2.11.0 — Festival (2026-11-18)

> 웹사이트와 게임 UI를 완전히 새 디자인으로: 카본 블랙에 마젠타→오렌지 그라데이션, 사선 버튼과 각진 패널, 굵은 이탤릭 타이포. NPC 차량에 운전자가 타고, 새 대표 스크린샷.
> A completely new look for the site and the in-game UI: carbon black with a magenta-to-orange gradient, slanted buttons, cut-corner panels and bold italic type. NPC cars now have drivers, plus new screenshots.

**✨ 추가 · New**

- NPC 차량 운전석에 운전자 탑승(주차 중엔 빈 좌석)<br><sub>NPC cars have a driver at the wheel (empty seat when parked)</sub>

**🔧 변경 · Changed**

- 웹사이트 전면 리디자인: 새 첫 화면(벚꽃 토게), 사선 버튼, 각진 카드, 사선 섹션 구분, 그라데이션 포인트<br><sub>Site redesign: new hero (the cherry-blossom touge), slanted buttons, cut-corner cards, diagonal section bands, gradient accents</sub>
- 게임 UI 리디자인: 타이틀·메뉴·팝업·HUD 버튼·지도 패널·알림을 같은 디자인 언어로, 반짝임·글로우 효과는 걷어내 눈이 편안하게<br><sub>In-game UI redesign: title, menus, pop-ups, HUD buttons, map panels and toasts in the same language; shine/glow effects removed for a calmer look</sub>
- GitHub README 갱신: 새 대표 이미지와 v2.6~v2.11 요약<br><sub>GitHub README refreshed: new header image and a v2.6–v2.11 summary</sub>

---

## v2.10.0 — Living City (2026-11-18)

> 살아 있는 거리: 스포츠카가 지나가면 멈춰서 촬영하거나 손 흔드는 사람, 스마트폰 보는 사람, 나란히 걷는 커플. 수도고 야간 도로공사(추월차선 규제)가 일정 시간 생겼다 철수하고, 차가 벚꽃잎·낙엽을 흩날립니다.
> A living street: people stop to film or wave at a passing sports car, check their phones, couples walk side by side. Shutokō night road works (right-lane closures) come and go, and your car kicks up cherry petals and fallen leaves.

**✨ 추가 · New**

- 보행자 성격: 차 마니아(스포츠카가 지나가거나 회전수를 올리면 멈춰 폰으로 촬영·손 흔들기), 걷다 멈춰 스마트폰 보기, 커플은 같은 속도로 나란히 걷기, 비 오면 우산<br><sub>Pedestrian characters: car fans film or wave at a sports car going by (or revving), people stop to check their phones, couples walk side by side, umbrellas in the rain</sub>
- 도로공사: 고속도로 앞쪽에 추월차선 규제(1차로는 유지) — 60m 라바콘 테이퍼, 깜빡이는 화살표 트럭, 500m·200m 전 「この先 工事中 / 右車線規制」 표지. 2.5~5.5분 뒤 철수, 밤에 더 자주. AI 차량과 자율주행이 미리 차선 변경<br><sub>Road works: a right-lane closure ahead on the expressway (the travel lane stays open) — 60 m cone taper, blinking arrow-board truck, 「この先 工事中 / 右車線規制」 boards 500 m and 200 m before. Packed up after 2.5–5.5 min, more often at night; AI traffic and the autopilot move over early</sub>
- 봄엔 벚꽃잎, 가을엔 낙엽이 차 뒤로 흩날림(하코네 토게에서 가장 많이)<br><sub>Cherry petals in spring and fallen leaves in autumn swirl up behind the car (most on the Hakone touge)</sub>

---

## v2.9.0 — Four Seasons (2026-11-18)

> 사계절 도입(봄 벚꽃 흩날리는 토게, 여름 신록, 가을 단풍, 겨울 앙상한 나무와 눈), 하코네 턴파이크에 비상주차대·주차대, 편의점 앞 아스팔트 주차장과 실제 편의점 브랜드, 콕핏·모바일 버그 수정.
> Four seasons (cherry petals on the touge in spring, summer green, autumn colour, bare trees and snow in winter), emergency bays and parking strips on the Hakone Turnpike, asphalt car parks and real chains at convenience stores, cockpit and phone fixes.

**✨ 추가 · New**

- 계절 버튼(🗓/🌸/🌿/🍁/❄️): 자동(현재 날짜)·봄·여름·가을·겨울. 나무 색이 계절 따라 바뀌고 겨울엔 낙엽수가 앙상해짐. 봄엔 벚꽃잎, 가을엔 낙엽이 날리고, 겨울엔 비 대신 눈<br><sub>Season button (🗓/🌸/🌿/🍁/❄️): auto (today), spring, summer, autumn, winter. Trees change colour, deciduous trees go bare in winter; cherry petals in spring, falling leaves in autumn, snow instead of rain in winter</sub>
- 하코네 턴파이크: 완만한 직선 구간마다 비상주차대(非常駐車帯)·주차대(駐車帯) 10곳 — 가드레일 개구부, 성토 옹벽, 표지판. 아래 구간 도로변엔 벚나무 가로수, 위쪽엔 단풍<br><sub>Hakone Turnpike: 10 emergency bays and parking strips on gentle straights — guardrail openings, embankment walls, signs; cherry trees line the lower road, maples higher up</sub>
- 도시 편의점: 실제 브랜드(LAWSON·FamilyMart·7-ELEVEN, 이름과 색만), 가게 앞 아스팔트 주차장과 P 표지판. 대흑 PA 편의점도 LAWSON<br><sub>City convenience stores: real chains (LAWSON, FamilyMart, 7-ELEVEN — name and colour only), an asphalt car park and P sign out front; the Daikoku PA store is a LAWSON</sub>

**🐞 수정 · Fixed**

- 콕핏: GR86 앞유리가 검게 막히던 문제, 왼쪽 핸들 원본 모델의 실내가 남던 문제. 실내 품질이 낮은 닛산 리프 퇴출<br><sub>Cockpit: GR86 windscreen was blacked out; left-hand-drive source cabins showed through. The low-quality Nissan Leaf model is retired</sub>
- 모바일: 실제 차량 모델을 받는 동안 임시 차량이 보이던 문제(타이틀 화면에서 미리 받음), 세로 화면에서 페달·핸들 버튼 겹침, 상단 버튼을 하나의 툴바로 정리<br><sub>Phones: no stand-in car while the real model loads (preloaded on the title screen), portrait pedals/steering no longer overlap, top buttons in one toolbar</sub>

---

## v2.8.0 — Autumn Leaves (2026-11-18)

> 나무를 전부 새로 만들었습니다: 은행·느티나무·벚나무·녹나무·곰솔·삼나무·단풍나무가 지역과 11월 단풍색에 맞게 서 있고, 하코네엔 황금빛 억새가 핍니다. 은빛 구름 가장자리와 권운, 곡선 가로등, 수도고식 교각, 회색 콘크리트 지면.
> Every tree is new: ginkgo, zelkova, cherry, camphor, black pine, cedar and maple stand by region in November colours, with golden susuki grass in Hakone. Silver-lined clouds and cirrus, swan-neck street lamps, Shutokō-style pier heads, grey concrete ground.

**✨ 추가 · New**

- 수종별 나무 7종(잎 다발 카드 + 가지): 가로수는 은행·느티나무, 공원은 벚나무·녹나무, 해안은 곰솔, 하코네는 삼나무·단풍 — 도시 전체·PA·하코네 공통<br><sub>Seven tree species (leaf-spray cards on real limbs): ginkgo and zelkova avenues, cherry and camphor in parks, black pine by the sea, cedar and maple in Hakone — city-wide, the PA and Hakone</sub>
- 하코네 도로변 억새·조릿대 풀(품질별 2,500~14,000포기), 하코네 지형 풀 텍스처가 제대로 보이도록 수정<br><sub>Hakone roadside susuki and bamboo grass (2,500–14,000 tufts by quality); Hakone terrain grass texture fixed (it was stretched to flat brown)</sub>
- 하늘: 태양 쪽 구름 가장자리가 은빛으로 빛나고, 높은 권운층 추가<br><sub>Sky: cloud edges glow silver towards the sun, plus a high cirrus layer</sub>

**🔧 변경 · Changed**

- 네모 오브젝트 정리: 가로등은 곡선 암 + 타원형 등기구, 교각 머리는 양끝이 얇아지는 수도고식 T형<br><sub>No more boxes: swan-neck lamp arms with oval luminaires, tapered Shutokō T-pier heads</sub>

**🐞 수정 · Fixed**

- 맵 전체 지면이 갈색 흙처럼 보이던 문제(벽용 텍스처 사용) → 회색 바닥 콘크리트<br><sub>Ground across the map looked like brown earth (a wall texture) → grey floor concrete</sub>

---

## v2.7.1 — Wayfinder (2026-11-18)

> 지도에서 일본 전체를 볼 수 있고, 사진·방향·거리가 보이는 빠른 이동 카드로 텔레포트가 쉬워졌습니다. 내비가 PA 주차장에서도 하네다·하코네·C1까지 경로를 찾고, 자율주행이 그 경로를 따라갑니다.
> The map zooms out to all of Japan, and quick-travel cards with a photo, direction and distance make teleporting easy. GPS now routes from the PA car park to Haneda, Hakone and C1, and the autopilot follows the route.

**✨ 추가 · New**

- 일본 전체 지도(🗾 버튼): 해안선과 주요 도시 51곳, 플레이 지역 표시<br><sub>All-Japan map (🗾 button): coastline, 51 major cities and the drivable area</sub>
- 빠른 이동: 13개 목적지 카드에 실제 게임 화면 사진, 현재 진행 방향 기준 화살표, 방위와 거리. 고르면 그 자리에서 진행 방향을 골라 출발<br><sub>Quick travel: 13 destination cards with an in-game photo, an arrow relative to your heading, compass point and distance; pick one, then pick the direction to set off in</sub>

**🐞 수정 · Fixed**

- 내비: PA 주차장 등 고속도로 밖에서도 경로 탐색, 왕복 도로 끝(완안선 하네다 쪽 등) 연결 — 하네다·하코네·C1 경로가 안 잡히던 문제 수정<br><sub>GPS: routes from off the expressway (PA car park) and across two-way road ends (Bayshore at Haneda) — Haneda, Hakone and C1 routes now found</sub>
- 자율주행: 목적지가 있으면 분기점에서 경로대로 진행(출구 포함), 주차장에서 통로로 먼저 나간 뒤 이동, 서 있는 사람·통로 건너편 차 때문에 멈추던 문제 수정<br><sub>Autopilot: follows the GPS route at junctions (exits included), leaves a bay into the aisle first, no longer stops for people standing about or cars across the aisle</sub>

---

## v2.7.0 — Real Cars (2026-11-18)

> 애매한 차량 모델 12종을 정리해 실제 모델이 있는 차만 남기고, 차가 노면에 붙어 달리도록 수직 물리와 노면별 접지력을 새로 만들었습니다.
> Twelve vague car models retired so only cars with real models remain, and new vertical physics and per-surface grip keep the car planted on the road.

**✨ 추가 · New**

- 수직 물리: 고속으로 언덕 정점을 넘으면 차가 가벼워지고, 움푹한 곳에선 눌리며, 그 하중이 타이어 접지력에 반영. 노면별 접지(고속도로·일반도로·산길·비포장), 빗길 고속 수막현상, 노면별 진동<br><sub>Vertical physics: crests taken fast make the car light, dips press it down, and that load sets tyre grip. Per-surface grip (expressway, street, mountain, off-tarmac), aquaplaning at speed in the rain, per-surface vibration</sub>

**🔧 변경 · Changed**

- 절차 생성·카툰풍·로우폴리 차량 정리(로드스터, S2000, 코펜, S660, N-BOX, 사쿠라, 프리우스, 에브리, 알토웍스, 짐니, LFA, 하이에이스) — 실제 모델이 있는 29대만 남김<br><sub>Procedural, cartoon and low-poly cars retired (Roadster, S2000, Copen, S660, N-BOX, Sakura, Prius, Every, Alto Works, Jimny, LFA, HiAce) — 29 cars with real models remain</sub>

**🐞 수정 · Fixed**

- 공장 기본 도색: R33 형광 휠 → 순정 실버, JZA80 초록 데칼 제거<br><sub>Factory finish: R33 lime rims → stock silver, JZA80 green livery removed</sub>
- 자율주행: 주차된 차가 막으면 옆으로 돌아가고, 오래 막히면 경로 재계산(이전엔 주차장에서 영구 정지)<br><sub>Autopilot: steers round a parked car blocking the lot route and replans when stuck (it used to stop for good in the car park)</sub>

---

## v2.6.1 — Clear Road (2026-11-18)

> 도로망 전수 점검: 데크가 서로 뚫고 지나가던 15곳, 접속부 단차, 지상 도로를 가로막던 램프 방호벽을 모두 수정하고 램프의 급경사·덜컹임을 완화했습니다.
> Full road-network audit: 15 places where decks cut through each other, a junction step and a ramp wall blocking a street are fixed, and steep, jolting ramps are smoothed.

**🔧 변경 · Changed**

- 램프 종단 다듬기: 급격한 경사 변화 44→23곳, 12% 이상 급경사 16→5곳, 분기·합류 이음부 블렌딩 30→60m<br><sub>Ramp profiles faired: sudden grade breaks 44→23, steep (>12 %) spots 16→5, join blends 30→60 m</sub>

**🐞 수정 · Fixed**

- 다이코쿠 JCT: K5 하행 끝이 반대 방향 상층 데크 높이로 끌려 올라가던 버그 수정 → K5→완안선 램프가 다시 고가에서 분기하고, 다이코쿠 부두 지상 도로를 가로막던 벽이 사라짐<br><sub>Daikoku JCT: the end of K5 southbound was hauled up to the opposite-direction upper deck — fixed, so the K5→Bayshore ramp leaves the viaduct again and the wall across the Daikoku-futō street is gone</sub>
- 머리 위 여유 높이 부족 자동 보정: 다이시 출구(K1 아래 3.6m), 이시카와초 JCT K3→K1 램프, 도심환상선 겹친 터널 — 최소 5m(터널 7.2m) 확보<br><sub>Headroom auto-fix: Daishi exit (3.6 m under K1), the Ishikawachō K3→K1 ramp and the stacked C1 tunnels now keep at least 5 m (7.2 m in tunnels)</sub>
- 나마무기: K1 본선이 합류 램프 높이를 따라가며 생기던 1m 단차 제거, 램프 끝이 지상 도로와 만나는 곳의 턱 제거<br><sub>Namamugi: a 1 m step where K1 followed a merging ramp's height is gone; ramp feet now meet street level flush</sub>

---

## v2.6.0 — Skyline (2026-11-14)

> 후지산처럼 도쿄 랜드마크가 멀리서도 선명하게: 도쿄도청·신주쿠 초고층군·롯폰기힐스·미드타운·아자부다이힐스·도라노몬힐스·요코하마 랜드마크타워 추가, 야간 조명과 30km 밖에서도 보이는 항공장애등, 덜 뿌연 공기·밝아진 밤, 창고 외벽 디테일, 무게감 있는 차체 움직임과 수도고 이음매 진동.
> Tokyo landmarks read from far away like Mt Fuji: Tochō, the West Shinjuku towers, Roppongi Hills, Midtown, Azabudai Hills, Toranomon Hills and Yokohama Landmark Tower added, night lighting and aviation lights visible from 30 km, clearer air and brighter nights, detailed warehouses, weighty body motion and Shutokō expansion joints.

**✨ 추가 · New**

- 도쿄 스카이라인 랜드마크 추가: 도쿄도청(쌍둥이 타워), 니시신주쿠 초고층군, 롯폰기힐스 모리타워, 도쿄 미드타운, 아자부다이힐스(325m), 도라노몬힐스, 요코하마 랜드마크타워 — 층별 조명과 왕관 조명<br><sub>Skyline landmarks added: Tochō twin towers, the West Shinjuku cluster, Roppongi Hills Mori Tower, Tokyo Midtown, Azabudai Hills (325 m), Toranomon Hills, Yokohama Landmark Tower — lit floors and crown lights</sub>

**🔧 변경 · Changed**

- 랜드마크 가시성: 도쿄타워·스카이트리·게이트브리지·코스모클락·마린타워가 후지산처럼 안개를 뚫고 보이고, 실제 3D 모델은 마지막 1.5~2.5km에서만 교대<br><sub>Landmark visibility: Tokyo Tower, Skytree, Gate Bridge, Cosmo Clock and Marine Tower cut through the haze like Mt Fuji; the surveyed 3D model only takes over in the last 1.5–2.5 km</sub>
- 항공장애등을 하나의 드로우콜로 통합(170개 메시 → 1), 거리와 상관없이 픽셀 크기로 깜빡여 30km 밖에서도 보임<br><sub>Aviation lights merged into one draw call (170 meshes → 1), sized in pixels so they blink visibly from 30 km</sub>
- 공기를 더 맑게, 밤을 덜 탁하게(도시광 반사), 원경 고층빌딩 야간 조명 강화<br><sub>Clearer air, less murky nights (city-glow bounce), brighter far skyline at night</sub>
- 항만 창고 외벽: 하역장 롤러 셔터, 하역등, 고창 띠, 도장된 하부<br><sub>Bay-side warehouses: loading-dock roller shutters, dock lamps, clerestory windows, painted plinth</sub>
- 차체 움직임을 스프링·댐퍼로: 제동 시 노즈 다이브 후 살짝 출렁이며 안정, 코너에서 기울었다 되돌아옴 / 수도고 고가 이음매(약 38m마다) 앞바퀴→뒷바퀴 진동<br><sub>Body motion on springs and dampers: the nose dives and settles under braking, the body leans and rocks back in corners / Shutokō viaduct expansion joints (every ~38 m) thump front then rear</sub>

---

## v2.5.4 — No Dead Ends (2026-11-14)

> 맵 전체 도로 끝 자동 점검으로 끊긴 곳 모두 연결(나마무기 K1 5.6m 절벽, 다이코쿠 JCT 만안선→다이코쿠 램프, 하네다 만안선 단차, 공중에서 끝나던 츠루미·시바우라 램프), 텔레포트는 도로와 진행 방향을 골라서.
> Every road end on the map checked automatically and every broken one joined (a 5.6 m cliff on K1 at Namamugi, the Bayshore→Daikoku ramp at Daikoku JCT, a step on the Bayshore at Haneda, the Namamugi and Shibaura ramps that ended in mid-air), and teleport now lets you pick the road and direction.

**🔧 변경 · Changed**

- 텔레포트: 지도에서 누른 곳의 이름을 크게(플레이 언어 + 일본어), 가장 가까운 도로의 진행 방향을 「남동쪽으로 출발 · 도로 이름」처럼 골라서 그 차로에 정확히 출발 — 엉뚱한 곳에 떨어지지 않음; 근처 랜드마크 이름은 크게 강조<br><sub>Teleport: the picked place is named large (your language + Japanese) and you choose the direction on the nearest road ("south-east bound · road name") to start exactly in that lane — no more odd drop points; nearby landmark names are enlarged</sub>

**🐞 수정 · Fixed**

- 끊긴 길 전부 연결(맵 전체 자동 점검): K1 북행이 나마무기에서 19.6m 높이로 끝나고 다음 구간은 14m에서 시작하던 5.6m 절벽, 다이코쿠 JCT 「만안선→다이코쿠」 램프가 만안선 상판보다 2.7m 아래에서 시작하던 문제, 하네다에서 만안선 남행이 5m 아래에서 끝나던 단차<br><sub>Broken roads joined (whole map checked automatically): K1 northbound ended at 19.6 m at Namamugi while the next section began at 14 m (a 5.6 m cliff), the Daikoku JCT Bayshore→Daikoku ramp started 2.7 m under the Bayshore deck, and the Bayshore southbound ended 5 m low at Haneda</sub>
- 공중에서 끝나던 램프를 지면까지: 생麦(츠루미) 입구·시바우라 출구가 고가 높이 그대로 끝나 막다른 길이었던 것을 실제처럼 지상 도로로 내려오게<br><sub>Ramps that ended in mid-air now reach the ground: the Namamugi entrance and the Shibaura exit stayed at viaduct height and dead-ended</sub>

---

## v2.5.3 — Night Fixes (2026-11-14)

> 베이브리지 서쪽 끝 막다른 길 연결, 나란한 고가 사이 구멍 메움과 중앙 방호벽, 터널에서 내려 점프하면 바다 위로 가던 버그, 시빅 번호판, 전체 음량·사이렌 낮춤, 경찰·NPC가 따라붙지 않게, VTEC 소리 강화.
> The Bay Bridge west-end dead end is connected, the slot between twin viaducts is closed with a centre barrier, jumping out of the car in a tunnel no longer lands you on the sea, the Civic's plate, quieter sound and siren, police and NPCs no longer tail you, and a stronger VTEC.

**🔧 변경 · Changed**

- 음량: 기본 음량 전체 낮춤(기존 설정도 75%로), 사이렌은 지금의 약 1/4 크기<br><sub>Volume: all defaults lowered (existing settings scaled to 75 %), the siren to about a quarter</sub>
- 경찰·NPC가 따라붙지 않게: 경찰의 NPC 단속은 내 차에서 220m 이상 떨어진 곳에서만, 사고 후 경찰은 대화에서 직접 부를 때만, 뒤따르는 차는 2.8초 간격을 두고 떨어져서<br><sub>Nobody tails you: police only chase NPCs more than 220 m from you, police come to an accident only if you call them in the conversation, and cars behind you hang back 2.8 s</sub>
- VTEC: 캠 전환 순간 흡기 「하울링」과 고음이 확 열리도록 강화(EK9·AP1·NSX)<br><sub>VTEC: the cam changeover now opens up with a hard intake howl and top end (EK9, AP1, NSX)</sub>

**🐞 수정 · Fixed**

- 요코하마 베이브리지 서쪽 끝: 서쪽으로 달리면 다리 끝(높이 14m)에서 길이 끊기고 K3 서행이 9m 아래에서 시작하던 문제 → 다리 위 같은 높이에서 K3 서행으로 자연스럽게 이어짐(자동주행으로 확인)<br><sub>Yokohama Bay Bridge, west end: driving west the deck ended at 14 m while K3 westbound began 9 m lower — K3 westbound now continues from the bridge at the same height (checked on autopilot)</sub>
- 나란히 달리는 두 고가(아쿠아라인·만안선 등) 사이가 구멍처럼 보이던 틈을 상판으로 메우고, 반대 방향 차로 사이에는 콘크리트 중앙 방호벽(충돌 포함) — 합류 구간은 막지 않음<br><sub>The slot between twin viaducts (Aqua-Line, Bayshore…) that looked like a hole is decked over, with a concrete centre barrier (solid) between opposite carriageways — merges are left open</sub>
- 터널(아쿠아라인 등)에서 내려 점프하면 바다 위로 올라가던 버그: 점프 중에도 발밑 노면을 기준으로, 해수면 아래에서는 절대 수면으로 튀어오르지 않음<br><sub>Jumping after getting out in a tunnel (Aqua-Line…) put you on top of the sea — the floor under you now counts mid-jump, and below sea level you never pop up to the surface</sub>
- 혼다 시빅(EK9): 차체 텍스처에 그려진 외국 번호판이 일본 번호판 위로 보이던 문제 → 차체색 커버로 가리고 일본 번호판을 실제 번호판 자리·각도에<br><sub>Honda Civic (EK9): the foreign plate painted into the body texture showed above the Japanese plate — covered in body colour, with the Japanese plate at the real plate position and angle</sub>

---

## v2.5.2 — Every Phone (2026-11-14)

> 아이폰 사파리에서 게임이 시작되지 않던 치명적 버그 수정, 휴대폰 HUD 겹침 정리와 버튼 이름 표시, 중앙분리대 통과 금지, 내비 경로 탐색 개선, 번호판(꺾인·字光式) 묻힘 수정, 엔진음 통일감, 젖은 노면·라이트 빛 과함 완화.
> Fixed a critical bug that stopped the game starting in iPhone Safari, a phone HUD with nothing overlapping and labelled buttons, no driving through the central reservation, better navigation routing, plates (bowed / illuminated) no longer buried, a more coherent engine sound, and calmer wet roads and lamp glows.

**✨ 추가 · New**

- 하이빔 패싱: 상향등을 2.5초 안에 두 번 이상 켰다 껐다 하면(L 키 연타·💡) 앞차가 경적을 울렸을 때처럼 비켜 줌 — 비킬 때는 항상 내 차에서 먼 쪽으로, 내 차로로 끼어들지 않음<br><sub>High-beam flashing: switch the high beams twice within 2.5 s (tap L or 💡) and the car ahead moves over as it does for the horn — always away from you, never into your lane</sub>
- 라디오 줄 접기(📻 버튼), 접은 상태 기억<br><sub>The radio bar folds away (📻) and remembers it</sub>

**🔧 변경 · Changed**

- 휴대폰 HUD: 위치 이름 한 줄, 큰 미니맵 오른쪽 위, 그 아래 버튼 줄(☰·차고·지도·날씨·자동 — 아이콘과 이름), 라디오 줄과 알림이 버튼·조작부와 겹치지 않게; PC도 버튼에 이름 표시<br><sub>Phone HUD: a one-line place name, a bigger minimap top-right with a labelled button row under it (☰, garage, map, weather, auto), radio and toasts clear of the buttons and touch controls; buttons are labelled on PC too</sub>
- 엔진음: 차마다 너무 달랐던 공명·거친 소리 폭을 줄여 따뜻하고 풍성한 배기음 쪽으로(엔진별 개성은 유지)<br><sub>Engine sound: the per-car spread of resonance and rasp is narrowed towards one warm, rich exhaust voice (each engine keeps its character)</sub>
- 빛·반사 완화: 비에 젖은 노면이 거울처럼 번들거리던 것을 촉촉한 정도로, 램프 빛 번짐 크기 축소<br><sub>Calmer light: wet roads are damp rather than mirror-like, and lamp glows are smaller</sub>

**🐞 수정 · Fixed**

- 아이폰 사파리(및 iOS의 모든 브라우저)에서 주행이 시작되지 않던 문제: 큰 배열을 한 번에 넘기는 코드가 사파리의 인자 개수 제한을 넘어 오류 — 수정 후 사파리 엔진(WebKit)·안드로이드 크롬·삼성 인터넷 환경에서 주행 시작 확인<br><sub>iPhone Safari (and every iOS browser) could not start a drive: code passing a huge array in one call exceeded Safari's argument limit — fixed, and checked on the Safari engine (WebKit), Android Chrome and Samsung Internet profiles</sub>
- 중앙분리대: 같은 도로의 반대 차로로 뚫고 넘어가지 못함(차체가 분리대에 닿는 위치에서 벽처럼 멈춤)<br><sub>Central reservation: no more driving through to the opposite carriageway — it stops you like a wall where the body meets it</sub>
- 내비: 목적지 가장 가까운 한 지점만 노리다 "경로 없음"이 되던 문제 → 주변 400m 안의 도로 후보 중 남은 거리까지 계산해 최적 선택, 고속도로 경로가 없으면 시내 도로로; 전체 지도의 현재 위치 카드에 지금 있는 곳(플레이 언어 + 일본어)<br><sub>Navigation: aiming at the single closest road point often gave "no route" — it now weighs every road within 400 m including the distance left, and falls back to city streets; the full map's "you are here" card names the place (your language + Japanese)</sub>
- 번호판: お辞儀(꺾인) 번호판이 범퍼에 반쯤 묻히고 뒤쪽은 반대로 꺾이던 문제 → 아래 끝을 축으로 위가 밖으로 숙여지게, 이름 없는 원래 외국 번호판도 모양으로 찾아 숨김<br><sub>Plates: the bowed plate sank half into the bumper and leaned the wrong way at the rear — it now hinges at its bottom edge with the top out; unnamed foreign plates on the models are found by their shape and hidden</sub>

---

## v2.5.1 — Fast Start (2026-11-14)

> 로딩 대폭 단축(PC 48초 → 13초, 시작 전 데이터 96MB → 25MB), 휴대폰 전용 가벼운 텍스처, 디테일한 후지산, 수도고 전역에 큰 방면 안내판·정보판·속도 표지, 다이코쿠 PA 분수 광장·이륜차 주차장·흡연소(OSM 위치).
> Much faster loading (48 s → 13 s on PC, 96 MB → 25 MB before you drive), lighter textures for phones, a detailed Mt Fuji, big direction signs / message boards / speed limits along every expressway, and Daikoku PA's fountain plaza, motorcycle bay and smoking corner at their OpenStreetMap positions.

**✨ 추가 · New**

- 수도고 전역의 큰 표지판: 분기점이 없는 구간에도 약 2km마다 머리 위 방면 안내판, 약 3.5km마다 전광 정보판(渋滞·事故多発·車線規制 등), 약 1.5km마다 속도 제한 표지 — 총 290여 개<br><sub>Big signs along every expressway: an overhead direction sign about every 2 km between junctions, a message board (congestion, accidents, lane closures…) every ~3.5 km and speed limits every ~1.5 km — about 290 in all</sub>
- 다이코쿠 PA (OpenStreetMap 위치 그대로): 「フォンターナ・ダイコク」의 분수 광장과 벤치, 이륜차 주차장(초록 도색·표지), 남쪽 건물 앞 흡연소<br><sub>Daikoku PA (at their OpenStreetMap positions): the fountain plaza of "Fontana Daikoku" with benches, the motorcycle bay (green paint, sign) and the smoking corner by the south building</sub>

**🔧 변경 · Changed**

- 휴대폰: 시작 전에 받는 데이터 96MB → 25MB — NPC 차량 모델은 출발한 뒤에 두 개씩 차례로, 저품질(휴대폰 기본값)에서는 512px 텍스처<br><sub>Phones: 96 MB → 25 MB before you can drive — NPC car models stream in two at a time after you set off, and low quality (the phone default) uses 512 px textures</sub>
- 후지산: 실제 성층화산 실루엣(완만한 기슭·가파른 정상부·분화구·호에이 분화구), 계곡을 따라 내려오는 눈 줄기, 햇빛 방향 음영, 밤에는 어둡게 — 멀리서도 또렷하게<br><sub>Mt Fuji: a real stratovolcano silhouette (gentle foot, steep top, summit crater, the Hōei crater), snow streaks down the ravines, sun-side shading, dark at night — clear from far away</sub>

**🐞 수정 · Fixed**

- 로딩 속도: 땅에서 지하 구간을 잘라내는 계산이 매번 모든 구간을 검사해 로딩의 3/4(35초)을 차지하던 문제를 공간 격자로 해결 — PC 기준 48초 → 13초<br><sub>Loading: cutting the open cuttings out of the ground tested every cutting each time — 35 s of a 48 s load; a spatial grid brings it to 13 s on a PC</sub>

---

## v2.5.0 — Night Cruise (2026-11-14)

> 왼쪽 아래 큰 지도(실제 지도·내 위치·차종), 더 똑똑한 자동변속, 실제 램프 위치에서 나오는 깜빡이·브레이크·전조등, 바다에 빠지지 않게, ETC 안내 음성, 엔진 개성 강화, 그 자리에서 차고·튜닝, 라디오 다음 곡, 字光式·お辞儀 번호판.
> A big map bottom-left (real map, your position and car), a smarter automatic gearbox, indicators / brake lights / headlights at the real lamps, no more falling into the sea, ETC voice announcements, more engine character, garage and tuning on the spot, radio skip, and illuminated / bowed plates.

**✨ 추가 · New**

- 왼쪽 아래 큰 지도: 진행 방향이 위로 오는 실제 지도(OSM) 위에 도로·교통·경로와 내 위치, 속도에 따라 자동 확대·축소, 아래에 지금 타는 차와 현재 위치 이름, 축척 표시. 내비 경로는 굵은 테두리선으로 또렷하게<br><sub>A big map bottom-left: heading-up real map (OSM) with roads, traffic, route and your position, auto-zoom with speed, your car and place name in the footer and a scale bar; the navigation route is drawn thick with a dark outline</sub>
- 그 자리에서 차 바꾸기·튜닝: U 키 또는 🔧 버튼(시속 12km 이하), 새 차는 같은 자리에서 출발<br><sub>Change car or tune on the spot: U or the 🔧 button (below 12 km/h); the new car starts right there</sub>
- ETC 안내 음성: 차량 탑재기의 「料金は、○○円です。」 안내가 항상 나옴(음성 설정과 무관), 고속도로를 나갈 때 주행 거리 요금(¥300 + 약 ¥29.5/km, 최대 ¥1,950) 정산<br><sub>ETC voice: the on-board unit's "料金は、○○円です" announcement always plays (whatever the voice setting), and leaving the expressway charges the distance fare (¥300 + ~¥29.5/km, capped at ¥1,950)</sub>
- 번호판 스타일: 字光式(밤에 글자가 빛나는 번호판)·お辞儀(아래로 꺾인 번호판) — 차고의 번호판 메뉴에서<br><sub>Plate styles: 字光式 illuminated characters at night and the お辞儀 bowed plate — in the garage plate menu</sub>

**🔧 변경 · Changed**

- 속도계 보강: 레티나 선명도, 500rpm 눈금, 시프트 램프 7개(레드존 점멸), 터보 차량 부스트 게이지<br><sub>Sharper speedo: Retina resolution, 500 rpm ticks, a 7-LED shift light (flashes at the limiter) and a boost gauge on turbo cars</sub>
- HUD 편의성: 오른쪽 위에 지도·차고 버튼, 처음 출발할 때 키 안내 줄(12초 후 사라짐), 지금 듣는 곡 표시와 ⏮ ⏭ 버튼(Y 키: 다음 곡), 전체 지도(M)는 가장자리에 게임 화면이 보이도록<br><sub>HUD conveniences: map and garage buttons top-right, a key guide when you set off (fades after 12 s), now-playing with ⏮ ⏭ buttons (Y: next song), and the full map (M) leaves the drive visible around it</sub>
- 자동변속 개선(모든 차): 가볍게 밟으면 일찍 변속해 낮은 회전으로 순항, 끝까지 밟으면 레드존 직전까지, 킥다운으로 여러 단 한 번에, 브레이크 때 단계적으로 내려 엔진브레이크, 코너 중 업시프트 금지 — NPC 엔진음도 실제 기어비로<br><sub>Smarter automatic (every car): early upshifts and low-rpm cruising on light throttle, revs to the redline when floored, multi-gear kickdown, stepped downshifts under braking, no upshifts mid-corner — NPC engines follow real gear ratios too</sub>
- 엔진 개성: VTEC 전환을 더 날카롭게(NSX도 VTEC), 자연흡기 스포츠 엔진 흡기음 강화, 풀스로틀 변속 때 배기 「팡」, 터보는 변속 때 짧은 처프<br><sub>Engine character: a sharper VTEC changeover (the NSX gets VTEC too), louder induction on NA sports engines, an exhaust crack on flat-out shifts and a turbo chirp</sub>
- 돈 받을 때 효과음을 부드러운 세 음 차임으로<br><sub>The money sound is now a soft three-note chime</sub>

**🐞 수정 · Fixed**

- 실제 모델 차량의 램프: 비상등이 전조등·후미등 전체를 흰색·빨간색으로 깜빡이던 문제 → 차마다 실제 램프 위치(주황 렌즈가 있으면 그 자리)의 주황 깜빡이, 전조등·후미등·브레이크등에서 빛이 퍼짐, 전조등 더 밝고 멀리<br><sub>Real-model lamps: hazards used to flash the whole headlight white and the tail red — now amber indicators at each model's own lamps (its amber lenses where it has them), glowing head / tail / brake lights, and brighter, longer headlight beams</sub>
- 바다에 빠져 PA로 돌아가던 문제: 도로 위 마지막 위치를 기억해서, 다리 틈으로 떨어지거나 물에 닿으면 바로 그 자리로 복귀(같은 방향)<br><sub>Falling into the bay sent you back to the PA — the last spot on the road is remembered and a fall through a gap or a splash puts you straight back there, facing the same way</sub>
- 렉 감소: 사라지는 NPC 차가 다른 차들이 같이 쓰는 모델 데이터를 지워 매번 다시 올리던 문제<br><sub>Less stutter: a despawning NPC car disposed the model data every copy shares, so it was re-uploaded each time</sub>

---

## v2.4.0 — Smooth Stance (2026-11-13)

> 렉·끊김 대폭 감소(주행 중 셰이더 재컴파일 제거), 차 파손은 옵션(기본 끔), 더 간단한 설정 화면, 스탠스 프리셋 9종과 차종별 기본 세팅, 실제 3D 도쿄 타워.
> Far less stutter (no more shader recompiles while driving), body damage is now an option (off by default), a simpler settings screen, nine stance presets with a per-car default setup, and the real 3D Tokyo Tower.

**✨ 추가 · New**

- 차량 파손 효과는 설정의 옵션(기본 끔, 켜면 내 차와 NPC 모두) — 찌그러짐 계산을 여러 프레임에 나눠 충돌 순간 멈추지 않음, 끄면 바로 수리<br><sub>Body damage is a setting (off by default; when on, for your car and NPCs alike) — dents are worked out over several frames so a crash never hitches, and switching it off repairs the car</sub>
- 스탠스 프리셋 9종: 순정·스트리트·츠라이치·샤코탄·VIP·오니캔버·드리프트·서킷·리프트업, 새 조절 항목 앞/뒤 토와 레이크, 캠버(최대 -22°)·차고(-120 ~ +80 mm)·트레드 범위 확대<br><sub>Nine stance presets — stock, street, flush (tsuraichi), slammed (shakotan), VIP, oni-camber, drift, track and lifted — plus front/rear toe and rake; wider camber (to -22°), ride height (-120 to +80 mm) and track ranges</sub>

**🔧 변경 · Changed**

- 도로 위 NPC 차량을 재질별로 합쳐서 그리기: 차 한 대당 수백 개였던 부품·드로우콜이 수십 개로(멀리 보이는 차 전부)<br><sub>Road traffic is drawn merged per material: hundreds of parts and draw calls per car down to a few dozen (all distant cars)</sub>
- 설정 화면 간소화: 자주 쓰는 항목(언어·그래픽·난이도·변속기·날씨·볼륨·파손·온라인·FPS)만 위에, 주행 보조·화면·사운드는 접이식 섹션으로, 「기본값으로 되돌리기」 버튼, 슬라이더를 움직일 때 저장 지연으로 끊김 없음<br><sub>Simpler settings: the essentials (language, graphics, difficulty, transmission, weather, volume, damage, online, FPS) up top, driving assists / display / sound in folding sections, a "Reset to defaults" button, and no hitching while dragging sliders</sub>
- 차종마다 다른 기본 세팅: S15·180SX·JZX100·AE86·FD3S·R32는 드리프트, R34·JZA80은 츠라이치, 시빅 타입R·랜에보·임프레자는 서킷, 크라운은 VIP, 짐니는 리프트업 등 — PA에 모인 차들도 각자 스탠스로<br><sub>Every car leaves the garage with its own typical setup — S15, 180SX, JZX100, AE86, FD3S and R32 on drift stance, R34 and JZA80 flush, Civic Type R / Evo / Impreza track, Crown VIP, Jimny lifted — and the cars at the PA meet run their own stances too</sub>
- 텍스처가 없는 실제 3D 건물(LOD1)을 일본 거리처럼 흰색·콘크리트·베이지·갈색 타일 등으로 다양하게, 옥상은 조금 어둡게<br><sub>Untextured real 3D buildings (LOD1) now vary like a Japanese street — off-white, concrete, beige and brown tile — with darker flat roofs</sub>

**🐞 수정 · Fixed**

- 렉·끊김 대폭 감소: 프레임 관리가 단계를 바꿀 때마다 모든 셰이더가 다시 컴파일되며 수 초씩 멈추던 문제 제거(조명 개수·그림자·블룸 경로 고정), 셰이더 오류 검사로 인한 동기 대기 제거, 차량 모델 셰이더를 미리 병렬 컴파일, 유리를 한 번에 그리기, 번호판 위치 계산 캐시<br><sub>Far less stutter: every shader in the scene was recompiled (multi-second freezes) whenever the frame governor changed level — light count, shadows and the bloom path are now fixed; no blocking shader error checks; car shaders precompile in parallel; glass draws in one pass; plate placement is cached</sub>
- 도쿄 타워: 실제 3D 모델(PLATEAU)을 덮고 있던 주황색 원뿔 대체물 제거 — 근처에서는 실제 모델, 먼 곳에서는 주황·흰 띠의 새 원경 모델(스카이트리도 같은 방식)<br><sub>Tokyo Tower: the orange cone stand-in that hid the real 3D model (PLATEAU) is gone — the real model up close, a new orange-and-white banded far model from a distance (Skytree works the same way)</sub>
- 우미호타루 PA·다이코쿠 부두 등 다이코쿠 PA가 아닌 주차장에서 자동주행이 「도로 없음」으로 켜지지 않던 문제 — 가장 가까운 도로까지 스스로 나가서 합류<br><sub>Autopilot refused to start ("no road") in car parks other than Daikoku PA, such as Umihotaru PA and Daikoku-futō — it now drives out to the nearest road and joins it</sub>

---

## v2.3.0 — Clean Cars (2026-11-13)

> 깨져 보이던 차량 모델 전부 수정, 차마다 다른 엔진·블로오프 사운드, 일본 일상 교통, 더 멀리·선명한 실제 3D 건물, 과한 빛 효과 완화, M1 맥북 에어 60fps.
> Every broken-looking car model fixed, engine and blow-off sounds unique to each car, everyday Japanese traffic, real 3D buildings further and sharper, calmer lighting, 60 fps on an M1 MacBook Air.

**🔧 변경 · Changed**

- 엔진·블로오프 사운드 다양화: 차마다 다른 머플러 공명·고음 거친 소리·저음 무게(RB26·2JZ·13B 로터리·VTEC·EJ20 박서 등 엔진별 튜닝), 블로오프 5종(순정 「프슈」·대기개방 BOV·서지 플러터·짧은 처프·큰 「휘익」)<br><sub>Engine and blow-off sounds with far more character: every car gets its own muffler resonance, rasp and low-end weight (tuned for the RB26, 2JZ, 13B rotary, VTEC, EJ20 boxer …), and five blow-off styles — stock 'pssh', vent-to-atmosphere BOV, surge flutter, a short chirp and a big whoosh</sub>
- 도로 위 NPC는 일본에서 흔히 보는 차 위주(택시·크라운·하이에이스·트럭·버스·경차·리프 등), 스포츠카는 가끔 — 모두 실제 3D 모델<br><sub>Road traffic is everyday Japan — taxis, Crowns, Hiaces, trucks, buses, kei cars, Leafs — with the odd sports car; all real 3D models</sub>
- 더 멀리, 더 선명하게: 실제 3D 건물을 2배 먼 거리까지 표시, 안개를 옅게, 건물 텍스처를 3개 작업자로 병렬 처리해 더 빨리 선명해지고 비스듬한 각도에서도 선명(이방성 16배)<br><sub>Further and sharper: the real 3D buildings show twice as far, lighter haze, facade textures are processed by three workers in parallel so they sharpen sooner, and stay crisp at grazing angles (16× anisotropic)</sub>
- 과한 빛 효과 완화: 블룸(빛 번짐) 절반, 가로등 조명 세기 60% 감소(건물 벽이 하얗게 날아가던 문제), 밤 창문 불빛도 차분하게<br><sub>Lighting toned down: half the bloom, street lamps 60 % dimmer (they washed building walls out white), calmer window lights at night</sub>
- M1 맥북 에어 등 내장 GPU에서 60fps: 처음부터 가벼운 그림자 설정으로 시작하고 프레임 관리가 60fps를 유지<br><sub>60 fps on integrated GPUs such as the M1 MacBook Air: they start on the lighter shadow settings and the governor holds 60 fps</sub>

**🐞 수정 · Fixed**

- 깨져 보이던 차량 모델 전부 수정: 유리를 실제처럼 어두운 반투명 틴트로 통일(R32는 흰 판처럼, 모델 3는 지붕이 없는 것처럼 보였음), 한쪽 면만 그려져 각도에 따라 구멍이 나던 차체 패널을 양면으로<br><sub>Broken-looking car models fixed across the board: glass is a real dark tint everywhere (the R32 had white panes, the Model 3 looked roofless) and one-sided body panels that opened holes at some angles are drawn from both sides</sub>

---

## v2.2.2 — Bugfix (2026-11-13)

> 버그 수정: 지상으로 내려온 램프(다이시·헤이와지마·시바우라) 끝을 실제 시내 도로와 포장 연결로 이어 막다른 길 제거.
> Bug fixes: the feet of the ramps brought down to the ground (Daishi, Heiwajima, Shibaura) are paved through to the real streets — no more dead ends there.

**🐞 수정 · Fixed**

- 다이시·헤이와지마·시바우라 램프 끝이 시내 도로에서 8~36m 떨어져 막다른 길이 되던 문제 — 가장 가까운 실제 도로까지 짧은 포장 연결<br><sub>The Daishi, Heiwajima and Shibaura ramps ended 8–36 m short of the city streets (a dead end) — a short paved link now joins them to the nearest real street</sub>

---

## v2.2.1 — 60fps (2026-11-13)

> 모든 기기에서 60프레임 목표: 선명한 해상도는 유지하고 무거운 효과부터 자동으로 줄이는 프레임 관리, 셰이더 미리 컴파일로 끊김 감소.
> 60 fps on every device: sharpness is kept while the heaviest effects are dialled back automatically, and shaders compile behind the loading screen to stop the hitches.

**🔧 변경 · Changed**

- 프레임 관리: 60fps를 목표로 앰비언트 오클루전 → 그림자 해상도·갱신 주기 → 블룸 → 가로등 조명 → 건물 표시 거리 → 그림자 순서로 단계적으로 줄이고, 여유가 생기면 다시 올림. 해상도는 마지막 수단으로만 낮춤<br><sub>Frame-rate governor aiming at 60 fps: steps down ambient occlusion → shadow resolution and update rate → bloom → street-light lamps → building detail distance → shadows, and steps back up when there is headroom; resolution is lowered only as a last resort</sub>
- 선명도: 화면 실제 해상도로 렌더링(최대 2배), 3배 밀도 휴대폰 화면은 2배로 — 눈으로 보이는 차이 없이 부하는 절반 이하<br><sub>Sharpness: rendering at the display's own resolution (up to 2×); 3× phone panels render at 2×, which looks the same at less than half the cost</sub>

**🐞 수정 · Fixed**

- 주행 중 끊김 감소: 모든 셰이더를 로딩 화면에서 미리 컴파일, 건물 텍스처는 도착 즉시 업로드, 시내 타일은 한 프레임에 하나씩 설치, 효과가 꺼지면 후처리 패스 생략<br><sub>Fewer hitches while driving: every shader compiles behind the loading screen, building textures upload as soon as they arrive, city tiles install one per frame, and the post-processing pass is skipped when no effect needs it</sub>

---

## v2.2.0 — Open Road (2026-11-13)

> 막다른 길·덮인 터널 입구·단차를 맵 전체에서 수정, 경찰은 NPC만 추격, 선명한 실해상도와 더 높은 프레임, 내 위치를 따라가는 반투명 지도, 날씨 버튼.
> Dead ends, lidded tunnel approaches and steps fixed across the map; police chase NPCs only; true resolution and a higher frame rate; a translucent map that follows you; a weather button.

**✨ 추가 · New**

- 지도(M)가 내 위치를 중심으로 열리고 계속 따라감, 반투명이라 지도를 보면서도 계속 주행 가능(자동주행 포함)<br><sub>The map (M) opens on your position and follows you; it is translucent, so you keep driving (or autopilot) while it is open</sub>
- 날씨 버튼(AUTO 옆): 자동 → 맑음 → 흐림 → 비 → 폭우 → 안개, 설정 메뉴에서도 선택<br><sub>Weather button next to AUTO: auto → clear → cloudy → rain → storm → fog, also in the settings</sub>
- 표지판·노면 표시 추가: 신호 교차로의 횡단보도 표지와 차로 화살표, 간선도로 주차금지 표지, 일방통행 표지<br><sub>More signs and markings: crosswalk signs and lane arrows at signalised junctions, no-parking signs on arterials, one-way signs</sub>
- 편의점이 다시: 실제 3D 건물 앞에 간판·매장 정면·주차장 + 분리수거함·자전거 거치대·재떨이·주차장 조명<br><sub>Konbini are back in front of the real 3D buildings — sign, storefront and car park, plus recycling bins, a bike rack, an ashtray and lot lights</sub>

**🔧 변경 · Changed**

- 경찰은 플레이어를 잡지 않음 — 과속하는 NPC 차량을 추격해 갓길에 세움. 사고 대화는 내려서 상대 운전자에게 F를 눌렀을 때만<br><sub>The police never chase you — they go after speeding NPC cars and pull them over. Accident conversations only start when you walk up to the other driver and press F</sub>
- 자동주행 최고속도 = 차량의 최고속도 (커브·앞차에서만 감속)<br><sub>Autopilot drives up to the car's own top speed, slowing only for bends and traffic</sub>
- 선명한 화면: 맥·윈도우·휴대폰 모두 화면의 실제 해상도로 렌더링(이전엔 프레임이 떨어지면 60%까지 낮아짐), PLATEAU 건물 텍스처 2배 해상도<br><sub>Sharp on every screen: Mac, Windows and phones render at the display's true resolution (it used to drop to 60 % when the frame rate dipped); PLATEAU facades at twice the texture resolution</sub>
- 프레임 향상: 도로 표지판 1,952개를 188개 메쉬로 합침, PLATEAU 건물 그림자 계산 제거, 동적 조명 수 절반<br><sub>Higher frame rate: 1,952 roadside signs merged into 188 meshes, no shadow pass for the PLATEAU buildings, half the dynamic lights</sub>
- 웹사이트 지역 페이지 최신화: 도쿄 23구(실제 3D)·기사라즈·쇼난 추가<br><sub>Website regions page brought up to date: Tokyo's 23 wards (real 3D), Kisarazu and Shōnan added</sub>

**🐞 수정 · Fixed**

- 맵 전체 막힌 길 수정: 1km 시내 타일 경계마다 도로 위에 보이지 않는 벽이 생기던 문제(구간이 이웃 타일로 넘어가는 부분이 빠져 있었음) 해결, 공중에서 끊긴 출입구 램프(다이시·헤이와지마·시바우라)를 실제처럼 지상 도로까지 연결<br><sub>Dead ends fixed across the map: an invisible wall stood across streets at every 1 km city-tile border (the part of a street running into the next tile was missing); exit/entry ramps cut off in mid-air (Daishi, Heiwajima, Shibaura) now continue down to street level</sub>
- 터널 입구 앞 반지하(掘割) 구간이 땅·바다·블록으로 덮여 길이 사라지던 문제: 시내 지면을 도려내고, 바다가 차오르지 않게, 그 위의 건물 제거 — 맵 전체 64곳<br><sub>Open cuttings before tunnel mouths were lidded over by ground, filled with sea or covered by blocks — the city ground is cut away, the sea kept out and buildings over them removed, at all 64 of them</sub>
- 오르막·램프·터널의 단차 제거: 도로 높이 데이터의 튀는 점과 몇 m 사이 10m씩 떨어지던 절벽을 매끈한 경사(고속 7%·램프 9%)로, 본선과 겹치는 램프 구간 높이를 일치<br><sub>No more steps on climbs, ramps and in tunnels: spikes in the height data and 10 m drops over a few metres became smooth grades (7 % main line, 9 % ramps), and ramps now match the main road where they overlap</sub>
- 번호판이 두 개 겹쳐 보이던 모델(AE86·크라운·택시·경찰차·짐니·마크II 등) 수정 — 모델의 원래 번호판을 숨기고 그 자리에 일본 번호판, 없는 모델은 범퍼 표면에 정확히<br><sub>Doubled number plates fixed (AE86, Crown, taxi, police cars, Jimny, Mark II …): the model's own plate is hidden and the Japanese plate takes its exact place; on other models it now sits flush on the bumper</sub>
- 도색 안 된 흰 차 수정: 버스 차체 도색(파랑·초록·빨강·노랑), 하이에이스는 차체·창문·하부를 나눠 도색<br><sub>Unpainted white vehicles fixed: buses get real liveries (blue, green, red, yellow), the Hiace is split into painted body, dark glass and chassis</sub>
- 도로 위에 서 있던 전봇대·가로수·가로등·자판기·버스정류장 표지와 도로가 없는 이상한 곳의 신호등 제거<br><sub>Utility poles, street trees, lamps, vending machines and bus-stop signs standing on the carriageway are gone, and so are traffic signals in places with no road</sub>

---

## v2.1.0 — Road Marks (2026-11-13)

> 실제 일본 도로처럼: 맵 전체에 노면 표시·표지판 — 급커브의 빨간 미끄럼 방지 포장과 감속 표시, 「速度落とせ」「合流注意」, 골목의 「止まれ」 정지선과 표지판, 속도 숫자, 그린벨트, 자전거 화살표. 다리·터널 부근의 하얀 네모 구조물 제거.
> Roads marked like Japan's: across the whole map — red anti-skid pavement and deceleration bars on sharp bends, 「速度落とせ」 and 「合流注意」 on the asphalt, 止まれ stop lines and signs in the side streets, painted speed limits, green belts and bicycle arrows. The white blocks at bridge ends and tunnel mouths are gone.

**✨ 추가 · New**

- 고속도로 급커브 264곳: 실제 수도고처럼 빨간 미끄럼 방지 포장, 커브 앞 가로 감속 표시(점점 촘촘하게), 노면 「速度落とせ」, 노란 마름모 급커브 경고 표지, 커브 바깥쪽 화살깃(矢羽根) 표지<br><sub>264 sharp expressway bends: red anti-skid pavement like the Shuto's, transverse deceleration bars closing up before the bend, 「速度落とせ」 on the asphalt, yellow diamond curve warnings and chevron boards on the outside</sub>
- 합류부 60곳: 램프에 「合流注意」 표지, 본선에 합류 경고 표지와 노면 「合流注意」 / 긴 직선 구간에 「追突注意」「車間距離確認」 안내판<br><sub>60 merges: 「合流注意」 boards on the ramps, merge warnings and 「合流注意」 painted on the main line; 「追突注意」 / 「車間距離確認」 boards along the long straights</sub>
- 시내 모든 거리: 작은 길이 큰 길과 만나는 곳마다 정지선 + 노면 「止まれ/とまれ」 + 빨간 역삼각형 「止まれ」 표지, 신호 교차로 앞 ◇ 횡단보도 예고, 간선도로에 노면 속도 숫자(60/50/40/30)와 속도제한 표지, 파란 자전거 화살표, 좁은 골목·통학로에 초록 그린벨트와 「通学路」, 신호 없는 교차로의 빨간 컬러 포장<br><sub>Every city street: stop lines with 「止まれ／とまれ」 on the asphalt and the red 止まれ triangle where a side street meets a bigger road, ◇ crossing-ahead marks before signals, painted speed limits (60/50/40/30) with speed-limit signs, blue bicycle arrows on arterials, green belts and 「通学路」 on narrow school routes, red pavement on unsignalled crossings</sub>

**🐞 수정 · Fixed**

- 다리 끝·터널 입구 고저차 부분의 하얀 네모 구조물 제거: 땅 위로 2.4m 솟고 양옆으로 튀어나왔던 터널 문 벽을 지면 높이·절개부 폭에 맞추고, 낮은 고가 끝부분에서 땅에 박혀 있던 교각 캡 블록과 긴 문형 보 제거<br><sub>The white blocks where bridges and tunnels change height are gone: tunnel headwalls no longer stand 2.4 m proud and stick out past the cutting, and the pier caps that sat on the ground at low bridge ends (and the long portal beams) were removed</sub>

---

## v2.0.0 — Real 3D (2026-11-13)

> 진짜 3D 일본: 일본 정부 3D 도시 모델(PLATEAU)로 도쿄 23구·요코하마·가와사키 등 46개 구·시의 실제 건물을 스트리밍. 맵 전체에서 차는 도로·갓길·주차장, 사람은 인도·주차장·건물 안으로만. 구멍 난 땅 메움, 실제 차량 그대로의 콕핏.
> Real 3D Japan: the national 3D city model (PLATEAU) streams the real buildings of 46 wards and cities — all of Tokyo's 23 wards, Yokohama, Kawasaki and more. Map-wide fence: cars keep to roads, shoulders and car parks, people to sidewalks, car parks and buildings. No more holes in the ground, and cockpits built on the real cars.

**✨ 추가 · New**

- 실제 3D 도시: 일본 국토교통성 3D 도시 모델(Project PLATEAU)의 실제 건물을 달리는 동안 스트리밍 — 도쿄 23구 전체, 요코하마 전역, 가와사키·가마쿠라·후지사와·기사라즈·하코네 등 46개 구·시. 측량된 실제 형태와 실제 외벽 사진(LOD2 텍스처), 밤에는 창문에 불, 설치 없이 브라우저에서<br><sub>Real 3D city: the real buildings of MLIT's 3D city model (Project PLATEAU) stream in as you drive — all 23 Tokyo wards, all of Yokohama, Kawasaki, Kamakura, Fujisawa, Kisarazu, Hakone: 46 wards and cities with their surveyed shapes and real facade photos (LOD2 textures), lit windows at night, in the browser with nothing to install</sub>
- 맵 전체 경계: 차는 차도·갓길·주차장(PA·우미호타루·하코네·시내 모든 주차장·주유소·편의점 앞)에서만, 걸을 때는 인도·보행로·주차장·건물 안에서만 — 공터·정원·밭으로는 못 들어가고 벽처럼 미끄러지듯 막힘<br><sub>Map-wide fence: cars stay on carriageways, shoulders and car parks (the PA, Umihotaru, Hakone, every city car park, fuel forecourt and konbini lot); on foot you keep to sidewalks, footpaths, car parks and buildings — no more driving into yards, gardens or fields, you slide along the edge like a wall</sub>

**🔧 변경 · Changed**

- 콕핏을 실제 차량 그대로: 1인칭에서 실제 3D 모델의 A필러·지붕·보닛·사이드미러를 그대로 보여 주고, 계기판·핸들·시트를 실제 차 실내 치수(지붕 높이·앞유리·도어)에 맞춰 배치 — 화면을 가로지르던 검은 필러, 보닛 위에 떠 있던 미러, 겹쳐 보이던 핸들 제거<br><sub>Cockpits built on the real cars: first person keeps the real 3D model's A-pillars, roof, bonnet and door mirrors, and the dash, wheel and seats are fitted to the real cabin (roof height, windscreen, door) — no more black pillar across the screen, mirrors floating on the bonnet or doubled steering wheels</sub>
- 새로 단장한 웹사이트(진짜 3D 일본 섹션·새 스크린샷)와 GitHub 소개<br><sub>Renewed website (Real 3D Japan section, new screenshots) and GitHub page</sub>

**🐞 수정 · Fixed**

- v1.1.0부터 시내(건물·도로·주차장 전부)가 아예 로드되지 않던 오류 수정 — 맵 곳곳이 텅 빈 구멍처럼 보이던 원인<br><sub>Fixed the streamed city (every building, street and car park) not loading at all since v1.1.0 — why the map looked like empty holes</sub>
- 구멍 메움: 해안선 데이터에 빠져 있던 부두·컨테이너 야드·매립지에 땅을 깔고 물리도 적용 (차가 바다 밑으로 떨어지던 곳), 위에서 검게 보이던 바다는 남색으로<br><sub>No holes: piers, container yards and reclaimed land the coastline data missed now have ground — rendered and solid (cars used to drop to the sea floor there) — and the sea no longer looks like a black void from above</sub>

---

## v1.2.0 — Autopilot (2026-11-13)

> 자동주행(J / AUTO 버튼): 주차 칸에서 출발해 1차로(추월차로)로 맵 전체를 순회. 지도(M)는 실제 OSM 도로·건물·강·철도까지 전부 보이는 전체 지도로 열리고, 차량은 실제 순정 컬러로 도색.
> Autopilot (J / AUTO button): leaves your parking bay and tours the whole map in the overtaking lane. The map (M) opens on the whole real map — every OSM street, building, river and railway — and cars wear real factory colours.

**✨ 추가 · New**

- 자동주행(J 키 또는 미니맵 아래 AUTO 버튼): 주차 칸에서 후진으로 빠져나와 PA 출구로, 고속도로에서는 1차로(추월차로) 위주로 주행 — 앞차와 차간거리 유지, 빈 공간에만 깜빡이 켜고 차로 변경, 커브 전 감속, 안 가 본 도로를 우선 골라 맵 전체를 순회하고 맵 끝에서는 회차. 핸들·페달을 조작하면 바로 해제<br><sub>Autopilot (J, or the AUTO button under the minimap): backs out of your bay to the PA exit, then cruises mostly in the overtaking lane — keeps its distance, signals and changes lanes only into clear gaps, slows for curves, prefers roads it hasn't driven yet so it tours the whole map, and turns round at the map edge. Touch the wheel or a pedal to take over</sub>
- 지도(M)를 열면 맵 전체가 한눈에 — 하코네까지 포함. 실제 OpenStreetMap 데이터로 구운 지도에 모든 시내 도로·건물·공원·강·철도·해안선·하코네 지형 음영 표시, 확대하면 고해상도 타일로 건물 하나하나까지<br><sub>The map (M) opens on the whole world, Hakone included, drawn from the real OpenStreetMap data — every street, building, park, river, railway, the coastline and Hakone's relief — with high-resolution tiles down to single buildings when you zoom in</sub>

**🔧 변경 · Changed**

- 모든 차종 색상을 실제 순정 컬러로 교체 (R34 베이사이드 블루·밀레니엄 제이드, FD 빈티지 레드, NSX 포뮬러 레드, Z33 르망 선셋 등), 대표 컬러가 기본값. 흰색은 펄 도장으로 광택이 나고 교통차량에서 흰 차 비율 감소<br><sub>Every car now comes in its real factory colours (R34 Bayside Blue and Millennium Jade, FD Vintage Red, NSX Formula Red, Z33 Le Mans Sunset …) with the signature colour first; whites are a glossy pearl and rarer in traffic</sub>

**🐞 수정 · Fixed**

- 도색이 안 된 하얀 덩어리로 보이던 캔터 트럭: 캐빈은 차체 색, 적재함은 알루미늄, 하부·타이어는 검정으로<br><sub>The Canter truck no longer looks like unpainted white clay: painted cab, aluminium box, dark chassis and tyres</sub>

---

## v1.1.1 — Sound & Traffic (2026-11-13)

> 교통차량은 전부 실제 3D 모델, 추월차로(1차로)는 플레이어 전용, 경적에 비켜 주는 차들, 실제 녹음으로 바꾼 사운드와 터보 블로오프 「프슈욱」.
> All traffic uses real 3D models, the overtaking lane is yours, cars move over when you honk, recorded sounds replace the synthetic ones, and turbo cars go “pssshh”.

**✨ 추가 · New**

- 터보차(GT-R 등) 액셀을 뗄 때마다 블로오프 「프슈욱」(실제 녹음) + 일부 차는 서지 플러터, 터보 스풀 휘슬 강화<br><sub>Turbo cars (GT-Rs and co.) blow off — a real recorded “pssshh” — every time you lift, some with compressor-surge flutter, and a louder spool whistle</sub>

**🔧 변경 · Changed**

- 교통·주차·카밋 차량을 실제 3D 모델이 있는 차로만 (버스·트럭·하이에이스·경차 포함), 경찰차·택시도 실제 크라운 모델 + 경광등<br><sub>Traffic, parked and meet cars only use models with a real 3D model (buses, trucks, the Hiace and kei cars included); police cars and taxis use the real Crown model with their lightbar</sub>
- 추월차로(중앙분리대 쪽 차로, 한국식 1차로)는 플레이어 전용 — 교통차량은 생성되지도 들어가지도 않음<br><sub>The overtaking lane (median side) is yours alone — traffic never appears in it or changes into it</sub>
- 경적·시동·충돌·문 여는 소리를 실제 녹음(CC0)으로 교체, 시내·PA에 실제 도쿄 밤거리 녹음 앰비언스<br><sub>The horn, starter, crash and door sounds are real recordings (CC0), and the city and PA have a real Tokyo-at-night ambience</sub>
- 기계음 같던 TTS 음성 대사와 합성 군중 웅성거림 제거(자막은 그대로) — 설정에서 다시 켤 수 있음<br><sub>The robotic text-to-speech lines and the synthetic crowd murmur are gone (subtitles stay) — the voices can be switched back on in the settings</sub>

**🐞 수정 · Fixed**

- 경적을 울리면 앞차가 플레이어 반대쪽으로 비키고, 비킬 곳이 없으면 감속·가장자리로 붙어 길을 터 줌 (옆 차로 차가 내 차로로 끼어들던 문제)<br><sub>Honk and the car ahead moves away from you, or slows and hugs the edge if it can't (cars in the next lane used to swerve into yours)</sub>

---

## v1.1.0 — Connected (2026-11-12)

> 맵 전체가 하나로 — 다이코쿠·요코하마·가와사키·하네다·도쿄 도심(C1)·레인보우 브리지·하코네까지 실제 도로로 막힘 없이 이어짐.
> One connected map: Daikoku, Yokohama, Kawasaki, Haneda, central Tokyo (C1), the Rainbow Bridge and Hakone, all joined by the real roads.

**✨ 추가 · New**

- 레인보우 브리지를 실제 모습으로: 높이 126m 하얀 주탑 2기, 주경간 570m 현수 케이블·행어, 야간 조명<br><sub>The Rainbow Bridge as it really is: two white 126 m towers, the 570 m main span's suspension cables and hangers, lit at night</sub>
- 요코하마 서쪽에 실제 해안선의 사가미만 바다 — 세이쇼 바이패스가 바다를 따라 달림<br><sub>Sagami Bay west of Yokohama, from the real coastline — the Seishō bypass runs along the sea</sub>
- 시작 시 새 버전 소개 창(레인보우 브리지·하코네에서 바로 출발), 화면 좌상단 다음 도전 과제 진행 표시, 달성 시 큰 배너<br><sub>A what's-new screen at start (jump straight to the Rainbow Bridge or Hakone), the next accolade and its progress top-left, and a big banner when you earn one</sub>
- 수도고 K1 요코하네선·K3 가리바선 양방향, 1호 하네다선, 만안선 북부(도쿄항 터널), 11호 다이바선(레인보우 브리지)을 실제 OSM 형상·JCT 그대로 추가 — 요코하마 루프에서 C1까지 고속도로로 직행<br><sub>Shuto K1 Yokohane and K3 Kariba both ways, Route 1 Haneda, the Bayshore north (Tokyo Port Tunnel) and Route 11 Daiba (Rainbow Bridge), from OpenStreetMap with the real junctions — drive from the Yokohama loop straight to the C1</sub>
- 하코네까지 도로로: 요코하마 신도 → 국도1호 → 신쇼난 바이패스 → 국도134호 → 세이쇼 바이패스 → 턴파이크 (편도 약 59km, 주변 시가지 포함)<br><sub>Drive to Hakone: Yokohama Shindō → Route 1 → Shin-Shōnan bypass → Route 134 → Seishō bypass → the Turnpike (about 59 km, with the towns along the way)</sub>
- 실제 출입 램프 13곳(하네다공항·헤이와지마·시바우라·다이바·아리아케·다이시 등)으로 고속도로와 시내 도로가 연결 — 출구로 나간 교통차량은 그대로 시내를 달림<br><sub>13 real exits and entrances (Haneda Airport, Heiwajima, Shibaura, Daiba, Ariake, Daishi …) join the expressways to the city streets — traffic leaving an exit carries on through town</sub>
- 도전 과제(13+2개, 보상금): 베이브리지·쓰바사교·레인보우 브리지 횡단, 우미호타루, 다이칸야마 정상, C1 러너, 하코네 로드트립, 드리프트, 200km/h, 추격 따돌리기 등 — 일시정지 메뉴에서 진행 확인<br><sub>Accolades (15, with cash rewards): the Bay, Tsubasa and Rainbow bridges, Umihotaru, the Daikanyama summit, C1 runner, a road trip to Hakone, drifting, 200 km/h, escaping the police … — progress in the pause menu</sub>
- 스폰 지역 추가: 레인보우 브리지(11호 다이바선), 1호 하네다선, 세이쇼 바이패스(하코네 방면)<br><sub>New spawn points: the Rainbow Bridge (Route 11), Route 1 Haneda and the Seishō bypass (towards Hakone)</sub>

**🔧 변경 · Changed**

- 일반국도(1호·134호)는 보도·연석이 있는 실제 국도 모습으로, 고가 구간만 난간 있는 육교로<br><sub>Ordinary national roads (Routes 1 and 134) look like the real thing — kerbs and pavements, parapets only on their overpasses</sub>
- 만안선 양 끝 U턴 제거, 교통차량은 플레이어 주변 도로에 생성, 새 JCT의 녹색 방향 안내판(羽田·台場·都心·有明 등)<br><sub>No more U-turns at the Bayshore's ends, traffic appears on the roads around you, and green direction signs (Haneda, Daiba, City Centre, Ariake …) at the new junctions</sub>

**🐞 수정 · Fixed**

- PA 시작 주차칸 바로 앞에 가로등 기둥이 있어 출발하자마자 부딪히던 문제<br><sub>The starting stall at the PA could face a lamp mast right ahead</sub>
- 시가지의 교각·건물·가로등·나무가 주행 가능한 고가를 관통하던 문제 — 고가 위치를 알고 자동으로 비켜 배치<br><sub>City piers, buildings, street lamps and trees no longer stand through a driveable deck — the tiles know where the decks are</sub>
- 가벼운 접촉(시속 18km 미만)으로는 사고 장면이 시작되지 않음, 순간이동하면 경찰 추격 종료, 지면보다 살짝 낮은 도로에서 도로 인식이 끊기던 문제<br><sub>A light bump (under 18 km/h) no longer starts an accident scene, fast travel ends a pursuit, and roads lying just below ground level are recognised</sub>

---

## v1.0.1 — Shakedown (2026-11-12)

> 직접 플레이하며 찾은 버그 대수술 — 고속도로의 보이지 않는 벽, PA 밖 허공, 하차 시 끼임, 터널 눈부심, 모바일 페달 실종 등 수정.
> A full playtest pass: invisible walls on the expressways, the void outside the PA, getting stuck when stepping out, tunnel glare, missing mobile pedals and more — fixed.

**🔧 변경 · Changed**

- 자동 헤드라이트: 해 질 녘·밤·터널에서 자동으로 켜짐(직접 조작하면 수동으로 전환)<br><sub>Automatic headlights at dusk, at night and in tunnels (switching them by hand turns the automatic off)</sub>

**🐞 수정 · Fixed**

- K5 고가도로(다이코쿠 PA 위)에 PA 건물 충돌판정이 20m 높이까지 솟아 있어 보이지 않는 벽에 부딪히던 문제<br><sub>PA buildings had 20 m-tall collision boxes that formed invisible walls on the K5 viaduct above the lot</sub>
- 다이코쿠 JCT 램프(PA→K5)에서 지상 차량 야적장의 충돌판정 때문에 차가 멈추던 문제, 교각이 바로 아래 램프를 뚫고 서던 문제<br><sub>Cars stopped dead on the Daikoku JCT ramp (PA→K5) against the ground-level car yard's collision box; piers no longer stand through a ramp passing just below</sub>
- 우미호타루 섬 방파제 충돌판정이 아쿠아라인 본선과 터널 입구를 막던 문제, 쓰루미 쓰바사교 주탑이 추월차로를 침범하던 문제<br><sub>The Umihotaru seawall blocked the Aqua-Line carriageway and tunnel mouth; the Tsurumi Tsubasa pylon stuck into the fast lane</sub>
- PA 출구 램프 옆으로 빠져 고가 아래 검은 허공을 달릴 수 있던 문제 — 이제 램프와 도로를 벗어날 수 없음<br><sub>You could leave the PA exit ramp sideways and roam a black void under the viaducts — the car now stays on the ramps and streets</sub>
- 요코하마 베이브리지 노면이 100m마다 ±5m씩 출렁이던 문제 — 고가·터널 구간 노면을 매끄럽게<br><sub>The Bay Bridge deck rose and dipped ±5 m every 100 m — elevated and tunnel profiles are now smooth</sub>
- 시내: 철도 펜스가 건널목 도로를 막고, 고가 교각이 도로 한가운데 서고, 도로 위에 겹친 건물이 길을 막던 문제<br><sub>City: rail fences sealed off level crossings, viaduct piers stood in the street and buildings overlapping a road walled it off</sub>
- 차에서 내리면 옆 주차 차량 안에 들어가 움직일 수 없던 문제 — 빈 쪽(조수석·뒤·앞)으로 내림<br><sub>Stepping out could put you inside the neighbouring parked car, unable to move — you now step out on a free side</sub>
- 정지 상태에서 S를 꾹 눌러 후진할 때 시동이 안 걸려 R단만 들어가고 움직이지 않던 문제<br><sub>Holding S from a standstill selected R but never started the engine, so the car didn't reverse</sub>
- C1 터널: 조명·블룸이 과해 벽이 하얗게 날아가던 문제, 벽 텍스처가 길게 늘어지던 문제, 터널·고가 아래에서도 비가 내리던 문제<br><sub>C1 tunnels: lamps and bloom blew the walls out white, the wall texture was smeared into streaks, and it rained inside tunnels and under decks</sub>
- 모바일: 가속·브레이크 페달과 좌우 조향 버튼이 화면 밖에 그려져 보이지 않던 문제, 버튼이 미니맵·속도계와 겹치던 문제<br><sub>Mobile: the GAS/BRAKE pedals and steering buttons were drawn off-screen, and the buttons overlapped the minimap and speedometer</sub>
- 우미호타루 스폰이 방파제를 향해 시작하던 문제 — PA 주차칸에서 시작, 하코네 요금소 부스가 하행 차로를 막던 문제<br><sub>Umihotaru spawn faced the seawall — you now start in a PA stall; the Hakone toll booth no longer blocks the downhill lane</sub>
- 온라인: 지정한 안정적인 릴레이 대신 무작위 릴레이(일부 다운)에 접속하던 문제<br><sub>Online: the game connected to random (partly dead) relays instead of the chosen stable ones</sub>

---

## v1.0.0 — Real Japan (2026-11-06)

> 정식 1.0 — 실제 일본의 다섯 곳(C1·하코네·K1 루프·다이코쿠 PA와 만안선·요코하마/도쿄 시가지)을 달리는 게임으로. 홈페이지 전면 리뉴얼.
> Version 1.0: a game about driving the real Japan in five places — C1, Hakone, the K1 loop, Daikoku PA and the Bayshore, and the streets of Yokohama and Tokyo. A brand-new homepage.

**✨ 추가 · New**

- 정식 1.0: C1 도심환상선·하코네 턴파이크·K1 요코하마 루프·다이코쿠 PA와 만안선·요코하마/도쿄 시가지 — 실제 일본을 다섯 곳에서 달리는 게임<br><sub>Version 1.0: the C1 Inner Circular, the Hakone Turnpike, the K1 Yokohama loop, Daikoku PA and the Bayshore, and the streets of Yokohama and Tokyo — the real Japan in five places</sub>

**🔧 변경 · Changed**

- 홈페이지 전면 리뉴얼: 실제 주행 장면이 천천히 바뀌는 시네마틱 히어로(촬영 위치 표시), 「실제 일본, 다섯 곳을 달린다」 코스 카드(누르면 그 자리에서 바로 출발), 새 스크린샷<br><sub>A completely new homepage: a cinematic hero cycling through real in-game scenes (with where each was taken), “Five real places to drive” route cards that start the game right there, and new screenshots</sub>
- 경제: 시작 자금 ¥500,000, 5km마다 주행 보너스 ¥3,000, 잔액이 ¥20,000 아래로 내려가지 않음 — 벌금·합의금 때문에 막히지 않게<br><sub>Money: start with ¥500,000, earn a ¥3,000 driving bonus every 5 km, and never drop below ¥20,000 — fines and settlements can’t leave you stuck</sub>
- GitHub README: C1 야경 대표 이미지, 5개 코스 표(바로 시작 링크)<br><sub>GitHub README: the C1 at night as the header image and a table of the five routes with direct start links</sub>

**🐞 수정 · Fixed**

- C1 내·외회선이 나란히 달리는 구간에서 두 차도가 겹치고 반대 방향 터널 벽이 차로 한가운데 서 있던 문제 — 두 선을 9m 이상 분리하고 공유 터널로<br><sub>Where the C1 loops run side by side the carriageways overlapped and the other bore’s tunnel wall stood in the middle of your lane — the loops are now at least 9 m apart and share one tunnel</sub>

---

## v0.11.1 — Coin Parking (2026-11-06)

> 시내 주차장에 코인파킹 디테일(주차선·차막이·P 간판·정산기).
> Coin-parking detail in city car parks (bay lines, wheel stops, P sign, pay machine).

**✨ 추가 · New**

- 시내 주차장마다 일본식 코인파킹: 흰 주차선·차막이, 노란 「P」 간판 기둥, 정산기<br><sub>Coin parking in every city car park: white bay lines and wheel stops, a yellow “P” sign pole and a pay machine</sub>

---

## v0.11.0 — Inner Circular (2026-11-06)

> C1 도심환상선 개통 — 도쿄 도심의 터널과 고가를 도는 내·외회선 루프, 주변 도쿄 도심 시가지.
> The C1 Inner Circular Route opens: both loops through central Tokyo’s tunnels and viaducts, with the city around them.

**✨ 추가 · New**

- C1 도심환상선: 내회선·외회선 각 약 14km — 지하 터널(일반 -9m, 깊은 구간 -14m), 掘割(지면 아래 트렌치), 고층 빌딩 사이 고가(7·13·19m 3층), OpenStreetMap 실제 노선<br><sub>C1 Inner Circular Route: inner and outer loops of about 14 km each — tunnels (−9 m, deep sections −14 m), open cuttings, and viaducts at three levels (7 / 13 / 19 m) between the towers, from real OpenStreetMap routes</sub>
- 도쿄 도심 시가지: C1 주변 1.8km(긴자·시오도메·가스미가세키·간다…) 실제 건물 — 도시 전체 건물 54만 6천 채, 타일 637개<br><sub>Central Tokyo: the real buildings within 1.8 km of the C1 (Ginza, Shiodome, Kasumigaseki, Kanda …) — 546,000 buildings across the whole city in 637 tiles</sub>
- 스폰 지점 「C1 도심환상선」, 지역 페이지에 C1·하코네 추가<br><sub>A “C1 Inner Circular” spawn point; C1 and Hakone added to the regions page</sub>

**🐞 수정 · Fixed**

- 지면 높이 근처를 지나는 고속도로 위에 공원 나무·가로등이 겹쳐 자라던 문제<br><sub>Park trees and street lights no longer grow on top of expressways running near street level</sub>
- 지상 높이의 고속도로에서 위치 표시가 근처 지명(예: 東京湾)으로 잘못 나오던 문제<br><sub>On expressways near ground level the location label showed a nearby place (e.g. Tokyo Bay) instead of the road</sub>

---

## v0.10.0 — Touge (2026-11-06)

> 하코네 턴파이크 개통 — 실제 고도 데이터로 만든 산길 13.5km, 정상 다이칸야마 전망 주차장까지.
> The Hakone Turnpike opens: 13.5 km of mountain road built from real elevation data, up to the Daikanyama summit car park.

**✨ 추가 · New**

- 하코네 턴파이크 토우게: 오다와라 요금소(해발 34m)에서 다이칸야마(990m)까지 13.5km — 도로는 OpenStreetMap, 높이·산 지형은 실제 고도 데이터<br><sub>Hakone Turnpike touge: 13.5 km from the Odawara toll gate (34 m) up to Daikanyama (990 m) — road from OpenStreetMap, heights and mountains from real elevation data</sub>
- 흰 W빔 가드레일·시선유도표, 황색 중앙선(추월 금지), 절토·성토 사면, 삼나무·활엽수 숲, 조명 없는 밤길<br><sub>White W-beam guardrails and delineators, a yellow no-overtaking centre line, cut-and-fill slopes, cedar and broadleaf forest, and no street lights at night</sub>
- 정상 다이칸야마 주차장(라운지·화장실·자판기·전망 난간·표지), 중턱 전망 주차대, 오다와라 요금소<br><sub>The Daikanyama summit car park (lounge, toilets, vending machines, viewing rail and sign), a viewpoint lay-by half way up, and the Odawara toll gate</sub>
- 스폰 지점 「하코네 턴파이크」, 지도에서 텔레포트로도 이동 가능<br><sub>A “Hakone Turnpike” spawn point (and teleport from the map)</sub>

---

## v0.9.1 — Hill Start (2026-11-06)

> 오르막 출발 버그 수정, NPC 차량 엔진음, 차 위로 점프, 다이코쿠 부두·PA를 실제처럼 채움.
> Hill-start fix, engine sound for AI cars, jumping onto cars, and a fuller, more lifelike Daikoku-futō and PA.

**✨ 추가 · New**

- NPC 차량 엔진음: 가까운 차 4대가 공회전·주행 소리를 냄(위치 기반, 과하지 않은 음량)<br><sub>AI cars now have engine sound — the four nearest idle and drive by audibly, at a sensible volume</sub>
- 걷는 중 Space로 점프 — 차 지붕 위에 올라설 수 있음<br><sub>Jump with Space while walking — you can climb onto car roofs</sub>

**🔧 변경 · Changed**

- 다이코쿠 부두: 수출 신차 야드를 6블록에서 최대 40블록으로(차체+유리 형태, 주차선 포함), 부두 포장을 회색 아스팔트로<br><sub>Daikoku-futō: the export-car yards grow from 6 to up to 40 blocks of car-shaped rows with bay lines, and the quays are paved in grey asphalt</sub>
- 다이코쿠 PA: 대형 칸은 쉬고 있는 트럭으로 대부분 차고, 일반 차량도 주차장 곳곳에 주차<br><sub>Daikoku PA: the big-vehicle bays are mostly taken by resting trucks and ordinary cars are parked all over the lot</sub>

**🐞 수정 · Fixed**

- 오르막에서 출발하면 차가 뒤로 밀리고 자동변속이 후진처럼 동작하던 문제 — 힐 스타트 어시스트와 토크컨버터식 출발 체결<br><sub>Hill starts: the car no longer rolls back (hill-start assist) and torque-converter automatics take up drive straight away</sub>

---

## v0.9.0 — Real Drive (2026-11-06)

> 대규모 업데이트 — 차체 파손, 스키드마크·타이어 연기, 내비게이션과 텔레포트, 사고 상대·경찰과의 선택형 대화, 일본식 차선 주행과 시간대별 교통량, 터널 갱문과 표지판, 주유소 165곳, 지명 병기.
> A big one: body damage, skid marks and tyre smoke, GPS navigation and teleport, choice-based conversations with other drivers and the police, Japanese lane discipline and traffic that follows the clock, tunnel portals and signs, 165 fuel stations and bilingual place names.

**✨ 추가 · New**

- 차체 파손: 충돌 지점이 실제로 찌그러짐(NPC 차량은 항상, 내 차는 설정에서 켜기/끄기), 일시정지 메뉴 「수리」<br><sub>Body damage: panels really dent where you hit (AI cars always; your own car on/off in settings), plus Repair in the pause menu</sub>
- 스키드마크와 타이어 연기: 드리프트·휠스핀·사이드브레이크·잠긴 바퀴에서 노면에 자국이 남고 연기가 피어오름<br><sub>Skid marks and tyre smoke from drifts, wheelspin, the handbrake and locked wheels</sub>
- 내비게이션: 지도에서 목적지를 누르면 고속도로망(진행 방향·분기 반영)과 시내 도로(일방통행 반영)로 경로 탐색, 미니맵 경로선·거리·방향 화살표·목적지 빛기둥<br><sub>GPS navigation: tap a destination on the map for a route over the expressways (direction and junctions) or city streets (one-way streets), shown on the minimap with distance, a turn arrow and a light beam at the destination</sub>
- 텔레포트: 지도에서 고른 곳의 가장 가까운 도로로 즉시 이동(일시정지 메뉴 「텔레포트」)<br><sub>Teleport to the nearest road at any place you pick on the map (pause menu → Teleport)</sub>
- 사고 상대와 대화: 기분 게이지, 사과·안부·보험 교환·합의금 협상·상대 탓·뺨 때리기·자리 뜨기 선택지(크고 명확한 카드, 숫자키 1–8)<br><sub>Talk to the other driver after a crash: a mood meter and big, clear choices — apologise, check on them, swap insurance, negotiate a settlement, blame them, slap them or leave (keys 1–8)</sub>
- 경찰 단속 대화: 면허증 제시·사정 설명·제시 거부·도주 중 선택, 추격 중 경찰 거리·사고 출동 도착 예상 시간·놓쳤을 때 마지막 목격 위치(지도) 표시<br><sub>Police stops: show your licence, explain, refuse or run; the HUD shows the police distance in a chase, the ETA of a unit coming to your accident, and where they last saw you after you lose them</sub>
- 터널 입구: 콘크리트 갱문과 터널명 명판, 진입 150m 전 「トンネル内 ライト点灯」「ラジオ再放送 1620kHz」 표지판<br><sub>Tunnel mouths: concrete portals with the tunnel’s name plate, and “Headlights on” / “Tunnel radio 1620 kHz” boards 150 m before each entrance</sub>
- 주유소 165곳: 실제 위치(OSM)에 조명 캐노피·주유기 아일랜드·가격 표시 기둥, 차로 진입 가능<br><sub>165 fuel stations at their real (OSM) locations: lit canopies, pump islands and price poles — you can drive in</sub>
- 지명·도로명을 일본어와 함께 현재 언어로 병기(지도·화면 위치 표시)<br><sub>Place and road names shown in Japanese together with your language (map and on-screen location)</sub>

**🔧 변경 · Changed**

- 교통: 일본식 주행(왼쪽 주행차로, 오른쪽 추월 후 복귀), 경적을 울리면 앞차가 비켜 줌, 시간대별 교통량(새벽 적고 출퇴근 시간 많음)<br><sub>Traffic: Japanese lane discipline (keep left, overtake on the right and move back), cars move over when you sound the horn, and volume follows the clock (quiet before dawn, busy at rush hour)</sub>
- 음성: 경찰은 남성 목소리에 확성기 효과, 사고 상대·점원 등은 사람마다 다른 목소리와 높낮이<br><sub>Voices: police in a male voice through a loud-hailer, other drivers and staff each with their own voice and pitch</sub>
- 어디서든 차량 변경: 멈춘 곳에서 차고를 열고 그 자리에서 바꾼 차로 출발<br><sub>Change cars anywhere: open the garage wherever you have stopped and drive off from the same spot</sub>

**🐞 수정 · Fixed**

- 차량과 3D 모델 불일치 수정: S14 실비아, 1세대 86(ZN6), 크라운 택시, H50 하이에이스, 후소 캔터, 후소 로사 — 이름·제원·크기를 실제 모델에 맞춤(트럭·버스 충돌 크기가 모델의 2배이던 문제 포함)<br><sub>Cars now match their 3D models: S14 Silvia, first-gen 86 (ZN6), Crown taxi, H50 HiAce, Fuso Canter and Fuso Rosa — names, specs and sizes (the truck and bus collision boxes were twice the model size)</sub>
- 경찰 사이렌: 긴급 상황(추격·사고 출동)에서만, 그리고 경찰차가 700m 이내일 때만 울림<br><sub>Police sirens sound only in an emergency (a chase or an accident call) and only within 700 m</sub>
- AI 차량의 차선 변경 방향지시등이 반대로 켜지던 문제<br><sub>AI cars no longer signal the wrong way when changing lanes</sub>
- 미니맵에 시내 도로가 표시되지 않던 문제<br><sub>City streets now appear on the minimap</sub>

---

## v0.8.1 — Pavement (2026-11-06)

> 일본 거리다운 회색 보도블록(상점가 일부는 적갈색 블록), 지역 페이지에 K1 요코하마 루프·요코하마 시가지·쓰루미·가와사키·하네다 추가, README·사이트 수치 최신화.
> Grey interlocking pavements as on most Japanese streets (brown-red blocks on some shopping streets), the K1 Yokohama loop, Yokohama city, Tsurumi & Kawasaki and Haneda on the regions page, and up-to-date figures on the site and README.

**🔧 변경 · Changed**

- 시내 인도를 붉은 벽돌에서 일본에서 흔한 회색 사각 보도블록으로 — 거리마다 일부는 적갈색·청회색 블록<br><sub>City pavements switch from red brick to the grey square blocks common in Japan, with brown-red or blue-grey blocks on some streets</sub>
- 지역 페이지: 베이브리지 「구현 완료」, K1 요코하마 루프·요코하마 시가지·쓰루미·가와사키·하네다 공항 추가, 지도에 루프 노선 표시<br><sub>Regions page: the Bay Bridge is now complete; the K1 Yokohama loop, Yokohama city, Tsurumi & Kawasaki and Haneda Airport are added, with the loop drawn on the map</sub>
- 사이트 소개·특징·README의 도시 수치를 최신으로(건물 42만 채, 도로 5만 3천 개), README에 K1 루프·날씨·하네다 소개 추가<br><sub>City figures on the site and README updated (421,000 buildings, 53,000 streets); the README now introduces the K1 loop, weather and Haneda</sub>

---

## v0.8.0 — Yokohama Loop (2026-11-06)

> 요코하마 루프 개통 — 다이코쿠 JCT에서 K5를 타고 나마무기 JCT로, K1 요코하네선으로 요코하마역·미나토미라이를 지나 지하로 내려간 뒤, K3 가리바선과 혼모쿠 JCT를 거쳐 베이브리지로 돌아오는 약 17km의 실제 수도고 루프를 달릴 수 있어요.
> The Yokohama loop opens: from Daikoku JCT take the K5 to Namamugi JCT, the K1 Yokohane Line past Yokohama Station and Minato Mirai and down underground, then the K3 Kariba Line and Honmoku JCT back over the Bay Bridge — about 17 km of real Shuto expressway.

**✨ 추가 · New**

- K5 대황선 전 구간(다이코쿠 JCT ↔ 나마무기 JCT), K1 요코하네선 9km(요코하마역 앞 고가, 이시카와초 지하 구간), K3 가리바선 2.5km, 나마무기·이시카와초 JCT 연결로 — 모두 OpenStreetMap 실제 노선<br><sub>The whole K5 Daikoku Line (Daikoku JCT ↔ Namamugi JCT), 9 km of the K1 Yokohane Line (the viaduct past Yokohama Station and the underground section at Ishikawachō), 2.5 km of the K3 Kariba Line and the Namamugi / Ishikawachō junction ramps, all from real OpenStreetMap routes</sub>
- 스폰 지점 「K1 요코하마 루프」, 분기점 노면 행선지 표시(横浜·大黒·本牧), 루프를 따라 달리는 고속도로 교통<br><sub>A "K1 Yokohama Loop" spawn point, painted destinations at the new junctions (Yokohama, Daikoku, Honmoku) and expressway traffic that follows the loop</sub>

**🔧 변경 · Changed**

- 도시를 새 루프 주변까지 확장: 건물 42만 채, 도로 5만 3천 개, 타일 504개<br><sub>The city now also surrounds the new loop: 421,000 buildings, 53,000 streets, 504 tiles</sub>

**🐞 수정 · Fixed**

- 터널·지하 구간에 벽 충돌이 없어 차로를 벗어나면 차가 지상으로 튀어 오르던 문제(만안선 해저터널 포함)<br><sub>Tunnels and underground sections had no wall collisions, so leaving the carriageway popped the car up to the surface (including the Bayshore undersea tunnels)</sub>
- AI 차량이 끝과 시작이 맞닿은 도로(램프→본선)에서 65% 확률로 사라지던 문제<br><sub>AI cars vanished 65% of the time where one road ends exactly where the next begins (ramp → main line)</sub>
- 분기점에서 달릴 수 없는 장식용 고가(K2 등)와 반대 차로 고가의 가로등이 주행 차로를 막거나 뚫고 나오던 문제<br><sub>Decorative (non-drivable) viaducts such as the K2 at junctions, and the street lights of the opposite carriageway, no longer block or poke through the lanes you drive on</sub>
- 지붕 없는 지하 진입 구간에서 바다 수면이 비쳐 차가 가려지던 문제<br><sub>In open cuttings below ground level the sea surface showed across the road and hid the car</sub>

---

## v0.7.2 — Umbrella (2026-11-06)

> 비 오는 날 보행자들이 우산을 써요(투명 편의점 우산이 가장 많아요). 달리는 중에 하차 키를 누르면 안내가 나와요.
> Pedestrians put up umbrellas when it rains (clear konbini umbrellas are the most common), and pressing the exit key while moving now tells you to stop first.

**✨ 추가 · New**

- 비 오는 날 보행자 우산 — 투명 비닐우산과 검정·남색·버건디·녹색 우산<br><sub>Umbrellas for pedestrians in the rain: clear plastic ones plus black, navy, burgundy and green</sub>

**🐞 수정 · Fixed**

- 주행 중 F(하차)를 누르면 아무 반응이 없던 문제 — "멈춘 뒤에 내릴 수 있어요" 안내 표시(20개 언어)<br><sub>Pressing F (get out) while moving did nothing; it now shows "Stop the car to get out" (20 languages)</sub>

---

## v0.7.1 — Shakedown (2026-11-06)

> 버그 수정 — PA에서 시작하면 바로 출발할 수 있고, 여객기 자세·전철 정차·보행자 회피가 자연스러워졌어요.
> Bug fixes: you can drive straight off from the PA, and airliner attitude, train stops and pedestrians stepping aside now behave properly.

**🐞 수정 · Fixed**

- PA 스폰: 앞차 줄을 보고 주차된 채 시작해 앞으로 나갈 수 없던 문제 — 일본식으로 후진 주차된 상태(앞이 통로 쪽)로 시작<br><sub>PA spawn: you started nose-in against the next row and could not drive forward — you now start backed in, nose to the aisle, as people park in Japan</sub>
- 여객기: 남북 이외 방향의 활주로에서 이착륙할 때 기체가 옆으로 기울던 문제<br><sub>Airliners: planes on runways not aligned north–south rolled sideways instead of pitching on take-off and landing</sub>
- 여객기를 지울 때 형상·재질을 해제해 장시간 플레이 시 메모리가 늘던 문제<br><sub>Airliners now free their geometry and materials when removed, so memory no longer grows over long sessions</sub>
- 전철: 옆 노선의 역 근처를 지날 때 이유 없이 감속하던 문제<br><sub>Trains: they no longer slow down for stations on a neighbouring line</sub>
- 보행자: 다가오는 차를 피해 비켜서는 동작이 실제로 보이도록 수정(이후 인도로 복귀)<br><sub>Pedestrians: stepping aside for an approaching car now actually shows, and they drift back onto the pavement afterwards</sub>

---

## v0.7.0 — Downpour (2026-11-06)

> 날씨가 생겼어요 — 비 오는 밤의 젖은 노면이 불빛을 반사하고, 그립이 줄고, 빗소리가 들려요. 도시는 고속도로 주변 5km(건물 35만 8천 채)로 넓어졌어요.
> Weather arrives: on rainy nights the wet asphalt mirrors the lights, grip drops and you hear the rain. The city now reaches 5 km around the expressways (358,000 buildings).

**✨ 추가 · New**

- 날씨: 자동(변화)·맑음·흐림·비 — 카메라 주변 빗줄기, 짙어지는 회색 안개, 흐린 하늘과 약해지는 햇빛<br><sub>Weather: automatic, clear, cloudy or rain — rain streaks around the camera, thicker grey fog, overcast skies and weaker sunlight</sub>
- 젖은 노면: 도로·보도·지면이 젖으면 광택이 생겨 가로등과 헤드라이트를 반사하고, 비가 그친 뒤에도 한동안 젖어 있음<br><sub>Wet roads: asphalt, pavements and ground turn glossy and reflect street lights and headlights, and stay wet for a while after the rain</sub>
- 비 오는 날 타이어 그립 약 20% 감소, 빗소리(차 안에서는 지붕 두드리는 소리)<br><sub>About 20% less tyre grip in the wet; the sound of rain (drumming on the roof from inside the car)</sub>

**🔧 변경 · Changed**

- 도시 범위를 고속도로 주변 3.2km → 5km로 확장: 건물 35만 8천 채, 도로 4만 5천 개, 철도 2,300개 노선<br><sub>The city now reaches 5 km (was 3.2 km) around the expressways: 358,000 buildings, 45,000 streets, 2,300 rail lines</sub>

---

## v0.6.1 — Faces (2026-11-06)

> 사람 얼굴 조형, 실제 3D 모델만 쓰는 NPC 차량, 기본 그래픽(높음)에서 프레임 약 35% 향상.
> Sculpted faces, NPC traffic made only of real 3D car models, and about 35% more frames on the default High setting.

**🔧 변경 · Changed**

- 사람 얼굴: 콧대·코끝·눈두덩·광대·입술·턱을 머리 형태에 조형하고 머리 해상도 6배<br><sub>Faces: nose bridge and tip, brow ridge, eye sockets, cheekbones, lips and chin are sculpted into the head, at six times the head resolution</sub>
- 고속도로·시내·PA의 NPC 차량을 실제 3D 모델이 있는 차종으로만 구성(택시·크라운·리프·하이에이스·트럭·버스 등)<br><sub>NPC cars on the expressways, in the city and at the PA now use only cars with real 3D models (taxis, Crown, Leaf, HiAce, trucks, buses …)</sub>
- 앰비언트 오클루전(GTAO)을 울트라 전용으로 — 높음 품질에서 프레임 약 35% 향상<br><sub>Ambient occlusion (GTAO) is now Ultra-only — about 35% more frames on High</sub>

**🐞 수정 · Fixed**

- 여객기 항법등·충돌방지등이 날개 끝에 오도록 수정<br><sub>Airliner nav and strobe lights sit on the wingtips</sub>

---

## v0.6.0 — Rush Hour (2026-11-06)

> 도시가 움직이기 시작했어요 — 실제 노선을 달리는 전철, 인도를 걷는 사람들, 하네다 공항에 내리고 뜨는 여객기, 걸어 들어갈 수 있는 PA 실내.
> The city comes alive: trains on the real lines, people on the sidewalks, airliners landing and taking off at Haneda, and walk-in PA interiors.

**✨ 추가 · New**

- 전철: OpenStreetMap의 실제 철도 노선을 따라 4~10량 편성이 달리고(타일 경계를 넘어 연속 주행), 역에서 정차, 밤에는 객실 조명, 가까이 지나가면 철로 소리<br><sub>Trains: 4–10 car sets run along the real OpenStreetMap rail lines (seamlessly across tiles), stop at stations, light up at night and rumble past</sub>
- 보행자: 시내 인도를 따라 걷고 교차로에서 방향을 바꾸며, 밤에는 줄어들고 다가오는 차를 피함<br><sub>Pedestrians walk the city sidewalks, turn at junctions, thin out late at night and step aside for cars</sub>
- 하네다 공항: 실제 활주로·유도로(표시선·끝단 줄무늬·활주로등·청색 유도로등), 계류장, 510개 실제 주기장 중 가까운 곳에 여객기, 3° 진입각 착륙과 이륙(착륙등·충돌방지등·항법등, 제트 소음), 하네다 스폰<br><sub>Haneda Airport: the real runways and taxiways (markings, threshold bars, edge lights, blue taxiway lights), aprons, airliners at the nearest of 510 real stands, 3° approaches and take-offs with landing, strobe and nav lights and jet noise; Haneda spawn</sub>
- PA 실내: 푸드코트(식권 발매기·조명 메뉴판·호출 번호판·주방·급수기·교통정보 TV·창가 스툴), 화장실(칸·소변기·세면대·거울), 하이웨이 정보 코너(노선 지도·기념품)<br><sub>PA interiors: food court (meal-ticket machine, lit menu board, call-number display, kitchen, water station, traffic-info TV, window stools), toilets (stalls, urinals, sinks, mirrors), highway info corner (route map, souvenirs)</sub>

**🔧 변경 · Changed**

- 실내에 들어가면 조명이 따라와 밝아짐<br><sub>Interior lights follow you inside</sub>

---

## v0.5.0 — Metropolis (2026-11-06)

> 고속도로 밖으로 — OpenStreetMap 실제 데이터로 만든 요코하마·가와사키 시가지 전체(건물 23만 6천 채)를 달릴 수 있게 됐어요. 신호를 지키는 시내 교통, 랜드마크, 튜닝 프리셋, 도시 환경음까지.
> Off the expressway: the whole of Yokohama and Kawasaki around the routes — 236,000 real buildings from OpenStreetMap — is now drivable, with city traffic that obeys the signals, landmarks, tuning presets and a city soundscape.

**✨ 추가 · New**

- 실제 도시: OpenStreetMap의 건물 23만 6천 채·도로 2만 7천 개·철도 1,500개 노선·하천·공원을 1km 타일로 스트리밍(백그라운드 워커, 3단계 LOD) — 고속도로 주변 3.2km가 전부 실제 지형<br><sub>A real city: 236,000 buildings, 27,000 streets, 1,500 rail lines, rivers and parks from OpenStreetMap stream in as 1 km tiles (background workers, three levels of detail) — everything within 3.2 km of the expressways is the real place</sub>
- 일본식 건축 자동 생성: 기와 박공·우진각 지붕 주택, 발코니·외부 복도·엘리베이터실이 있는 맨션, 1층 상점과 간판·차양, 편의점(주차장·폴사인), 공장·창고·저장탱크·굴뚝, 붉은 벽돌 창고<br><sub>Japanese architecture, generated per building: houses with tiled gable/hip roofs, mansions with balconies, open corridors and lift towers, ground-floor shops with signs and awnings, konbini with car parks and pole signs, factories, warehouses, tanks and stacks, red-brick warehouses</sub>
- 거리 디테일: 전봇대와 전선, 블록 담장과 대문, 자판기, 가로등, 가드레일, 가로수, 횡단보도·정지선, 실제로 바뀌는 신호등(보행자 신호 포함), 고가 수도고 노선, 고가·지상 철도, 하천 제방<br><sub>Street detail: utility poles and wires, block walls and gates, vending machines, street lights, guard rails, street trees, zebra crossings and stop lines, working traffic lights (with pedestrian signals), elevated Shuto routes, elevated and ground-level railways, river embankments</sub>
- 창문 셰이더: 알루미늄 새시·커튼·반투명 욕실창·덧문 박스, 밤에는 집집마다 다른 불빛, 멀리서는 깜빡임 없이 부드럽게<br><sub>Window shader: aluminium sashes, curtains, frosted bathroom windows, shutter boxes; every home lit differently at night, and no shimmer in the distance</sub>
- 시내 교통: NPC 차량이 실제 도로망을 좌측통행으로 달리며 교차로에서 방향을 고르고, 앞차를 따라가며, 신호등 주기에 맞춰 정지·출발(방향지시등 포함)<br><sub>City traffic: NPC cars drive the real street network on the left, pick turns at junctions, queue behind each other and stop and go with the signal cycle (with indicators)</sub>
- 랜드마크: 실제 위치의 코스모클록21(곤돌라 60대, 게임 시각을 보여주는 디지털 시계), 요코하마 마린타워 격자 구조, 야마시타 공원의 히카와마루, 실제 높이의 랜드마크 타워·퀸즈스퀘어<br><sub>Landmarks: Cosmo Clock 21 at its real spot (60 gondolas, a digital clock showing the in-game time), the lattice Yokohama Marine Tower, the Hikawa Maru at Yamashita Park, and Landmark Tower and Queen's Square at their real heights</sub>
- 튜닝: 순정·스트리트·그립·드리프트·완간·토우게 프리셋 + 출력·경량화·타이어 5종·최종감속비·제동력·브레이크 배분·핸들링 밸런스·다운포스·조향각<br><sub>Tuning: Stock, Street, Grip, Drift, Wangan and Touge presets plus power, weight reduction, five tyre compounds, final drive, brake force and bias, handling balance, downforce and steering lock</sub>
- 도시 환경음: 시가지의 웅성거림, 보행자 신호에 맞춰 울리는 "삐요삐요"·"뻐꾹" 안내음, 낮의 까마귀, 멀리 지나가는 전철<br><sub>City soundscape: the hum of the streets, crossing chimes ("piyo-piyo" / cuckoo) in time with the walk signals, crows by day, trains passing in the distance</sub>
- 시내 스폰 지역 추가: 미나토미라이·차이나타운·모토마치·쓰루미·가와사키, 정차 후 시내 어디서든 하차해 걷기<br><sub>New city spawn points: Minato Mirai, Chinatown–Motomachi, Tsurumi, Kawasaki; stop anywhere in the city and walk</sub>

**🔧 변경 · Changed**

- 고속도로 교통량 1.5배(품질별 28~112대), 멀리 있는 차량을 플레이어 주변으로 재배치해 항상 붐비게<br><sub>1.5x expressway traffic (28–112 cars by quality); cars far away are moved near you so the road always feels busy</sub>

**🐞 수정 · Fixed**

- 멀리 있는 지면이 바다와 겹쳐 보이던 깊이 정밀도 문제 수정, 거대한 해안선 다각형 대신 타일별 지면<br><sub>Fixed distant ground z-fighting with the sea (depth precision); ground is now built per tile instead of one huge coastline polygon</sub>

---

## v0.4.0 — Roadside (2026-11-06)

> 도로와 수평으로 기우는 차체, 교통량 2배, 고속도로 위 하차, 방음벽·시선유도표, 세월이 묻은 도시, 세밀한 지명, 인쇄물까지 그린 편의점, 실제 버전에 맞춘 로드맵.
> Cars sit level with the road, twice the traffic, step out on the expressway, noise barriers and delineators, a weathered city, detailed place names, a konbini with printed goods, and a roadmap that matches the real releases.

**✨ 추가 · New**

- 정차하면 갓길·고가도로 위 어디서든 하차해 노면 위를 걸을 수 있음<br><sub>Stop anywhere — shoulder or elevated expressway — and step out to walk on the deck</sub>
- 수도고식 방음벽(아연도금 하부 패널+안쪽으로 휜 투명 아크릴, H형 지주 4m 간격)을 육상 고가 구간에, 방호벽 위 시선유도표(좌측 흰색·우측 주황) 10m 간격<br><sub>Shuto-style noise barriers (galvanised lower panel, inward-curving clear acrylic, H-posts every 4 m) on elevated sections over land; delineators every 10 m (white left, amber right)</sub>
- 도시 풍화 표현: 빗물 자국·그을음·하단 습기 얼룩을 건물·교각·방호벽·스카이라인에<br><sub>Weathering: rain streaks, soot and damp bases on buildings, piers, parapets and the skyline</sub>
- 세밀한 지명 59곳(나마무기·末広町·扇島·浮島町·大井ふ頭 등): HUD에 "노선 · 지명", 전체 지도에 확대 단계별 표시<br><sub>59 detailed place names (Namamugi, Suehiro-chō, Ōgishima, Ukishima-chō, Ōi Wharf…): "route · place" on the HUD and zoom-dependent labels on the full map</sub>
- 편의점: 상품명·용량·가격이 인쇄된 포장(3개씩 진열), 잡지 표지·신문, 선반 가격표(세금 포함가)<br><sub>Konbini: packaging printed with names, sizes and prices (faced in threes), magazine covers and a newspaper, shelf price tags with tax-in prices</sub>

**🔧 변경 · Changed**

- NPC 교통량 약 2배(품질별 18~76대), 내 주변 고속도로 전체에 차량이 생성<br><sub>About twice the NPC traffic (18–76 cars by quality), spawning on every expressway around you</sub>
- 웹사이트 로드맵을 실제 출시 내용에 맞게 정리: 0.3 출시됨, 0.4 현재, 0.5 C1·랜드마크 정밀 모델<br><sub>Website roadmap now matches the real releases: 0.3 released, 0.4 now, 0.5 C1 and detailed landmark models</sub>

**🐞 수정 · Fixed**

- 오르막·내리막·편경사에서 차체가 도로면과 평행하게 기울도록 수정(동서 방향 경사에서 차가 옆으로 기울던 회전 순서 버그), 차가 노면 아래로 가라앉지 않게 접지 보정, NPC 차량도 경사에 맞춰 기울어짐<br><sub>Bodies now pitch and roll with the road on climbs, descents and camber (fixed a rotation-order bug that tilted cars sideways on east–west slopes); cars never sink below the surface; NPC cars pitch with the grade too</sub>

---

## v0.3.5 — Polish (2026-11-06)

> 버그·경고 정리와 웹사이트·GitHub 페이지 리뉴얼.
> Bug and warning clean-up, refreshed website and GitHub page.

**🔧 변경 · Changed**

- 웹사이트: 로드맵 5단 레이아웃(혼자 떨어지던 카드 수정), 카드 호버·포커스 표시·스크롤 다듬기, 스크린샷 색감·캡션 가독성 개선<br><sub>Website: five-column roadmap (no more orphaned card), refined card hover, focus rings and scrolling, richer screenshots with readable captions</sub>
- GitHub 소개 페이지 리뉴얼: 히어로 이미지, 플레이 버튼, 최근 업데이트 표, 스크린샷 특징 그리드, 영어 소개 갱신<br><sub>GitHub page renewed: hero image, play button, recent-updates table, screenshot feature grid, updated English intro</sub>

**🐞 수정 · Fixed**

- 게임 실행 중 콘솔 경고 740여 건 제거(지오메트리 병합), 표지판 텍스처 갱신 오류 수정<br><sub>Removed ~740 console warnings during play (geometry merging) and fixed a sign-texture update error</sub>

---

## v0.3.4 — Full Map (2026-11-06)

> 확대·축소·이동되는 전체 지도, 바퀴마다 움직이는 서스펜션, 로드맵 갱신, GitHub 소개 페이지 리뉴얼.
> A zoomable, pannable full map, per-wheel suspension, an updated roadmap and a renewed GitHub page.

**✨ 추가 · New**

- 전체 지도(M 키 또는 미니맵 클릭): 휠·핀치로 확대/축소, 드래그로 이동, 내 위치·전체 보기 버튼, 육지·건물·도로 이름·랜드마크·교통 표시, 최대 확대 시 차선까지, 축척 막대<br><sub>Full map (M or click the minimap): wheel/pinch zoom, drag to pan, locate-me and fit-all buttons, land, buildings, road names, landmarks and traffic, lanes at max zoom, scale bar</sub>
- 서스펜션: 네 바퀴가 노면 요철(고속도로는 곱게, 일반도로·주차장은 거칠게)과 하중 이동(제동 시 앞, 코너 시 바깥쪽)에 따라 각각 움직임<br><sub>Suspension: each wheel moves with road texture (fine on expressways, coarser on streets and lots) and load transfer (nose under braking, outside wheels in corners)</sub>

**🔧 변경 · Changed**

- GitHub 소개 페이지 리뉴얼: 비설치 고사양 웹 게임으로 안내, 업데이트 기록 정리<br><sub>GitHub page renewed: presented as a no-install, high-end browser game; release history tidied</sub>
- 웹사이트 로드맵 갱신: 0.2 완료, 0.3 진행 중, 0.4 수도고 C1·새 지역 예정<br><sub>Website roadmap updated: 0.2 done, 0.3 in progress, 0.4 Shuto C1 and new areas next</sub>

---

## v0.3.3 — Smooth Ride (2026-11-06)

> 오디오 음량 평준화, 도로 단차 95% 제거, 표지판 171개로 확대, 화면 하단 버전·FPS 표시, 웹사이트 사진 전면 교체.
> Audio loudness levelled, 95% of road steps removed, 171 roadside signs, version + FPS at the bottom of the screen, all website photos retaken.

**✨ 추가 · New**

- 표지판 대폭 추가(171개): 분기 1km 전 출구 예고, 분기점 노선 표시, 제한속도·노선 표지 반복 설치, 킬로포스트, 일반도로 제한속도와 「止まれ」 표지<br><sub>Many more signs (171): exit warnings 1 km before junctions, route markers at the gore, repeated speed-limit and route signs, kilometre posts, street speed limits and STOP signs</sub>
- 화면 하단에 게임 버전과 FPS 상시 표시 (설정에서 FPS 끄기 가능)<br><sub>Game version and FPS always shown at the bottom of the screen (FPS can be turned off in settings)</sub>

**🔧 변경 · Changed**

- 오디오 평준화: 엔진 녹음의 RPM 구간별 음량을 통일(차종 간 편차 제거), 효과음 피크 정리, 마스터 컴프레서 강화<br><sub>Audio levelling: every rpm slice of every engine recording at the same loudness (no jumps between cars), SFX peaks evened out, stronger master compressor</sub>
- 웹사이트 사진 전면 교체: HUD 없는 깨끗한 새 스크린샷, 고해상도 히어로<br><sub>Website photos retaken: clean new screenshots without HUD, high-resolution hero</sub>

**🐞 수정 · Fixed**

- 도로 단차 543곳 → 26곳: 같은 도로의 높이 판정 오류(10~20cm 턱) 수정, 램프 합류·분기부를 본선 높이에 맞춰 부드럽게 연결, 노면이 바퀴보다 떠 보이던 문제 수정<br><sub>Road steps 543 → 26: fixed a height lookup that put 10–20 cm ledges in the same road, ramps now meet the main line flush at merges and diverges, decks no longer drawn above the tyres</sub>
- 부두 스폰 시 일본 좌측통행에 맞게 왼쪽 차로에서 출발<br><sub>Wharf spawn now starts in the left lane (Japan drives on the left)</sub>

**⚠️ 알려진 문제 · Known issues**

- 다이코쿠 JCT 일부 램프가 반대 차로 위를 낮게 지나는 구간(지도 데이터)에 작은 단차가 남아 있음<br><sub>A few small steps remain where Daikoku JCT ramps pass low over the opposite lanes (map data)</sub>

---

## v0.3.2 — Road Paint (2026-11-06)

> 노면에 행선지·화살표·제한속도·「止まれ」 표시, 분기점마다 안내 표지판, 도로 구멍과 차로 위 가로등 수정, 스폰 지역 선택과 버전 표시.
> Destinations, arrows, speed numbers and 止まれ painted on the road, guide signs before every junction, road holes and lamp posts on lanes fixed, spawn-region choice and version display.

**✨ 추가 · New**

- 노면 표시: 분기 전 차로마다 행선지(東京·横浜·大黒PA·アクアライン 등)와 직진/분기 화살표, 고속도로 제한속도 숫자, 일반도로 교차로의 정지선과 「止まれ」<br><sub>Road markings: per-lane destinations (Tokyo, Yokohama, Daikoku PA, Aqua-Line…) with straight/branch arrows before junctions, speed numbers on expressways, stop lines and 止まれ at street junctions</sub>
- 모든 고속도로 분기점 500m·200m 전에 오버헤드 안내 표지판 자동 배치 (아쿠아라인·우미호타루·K5 포함)<br><sub>Overhead guide signs 500 m and 200 m before every expressway junction (incl. Aqua-Line, Umihotaru, K5)</sub>
- 타이틀에서 스폰 지역 선택: 다이코쿠 PA · 완간선(베이브리지) · 우미호타루 PA · 다이코쿠 부두<br><sub>Choose where to spawn on the title screen: Daikoku PA, Bayshore (Bay Bridge), Umihotaru PA or Daikoku Wharf</sub>
- 타이틀 화면과 주행 화면에 게임 버전 표시<br><sub>Game version shown on the title screen and in-game</sub>

**🐞 수정 · Fixed**

- 도로 구멍 수정: 교차로에서 끊겨 있던 일반도로 연결, 우키시마 JCT 램프가 터널과 16m 어긋나던 문제 수정<br><sub>Road holes fixed: streets that stopped short of junctions now connect, and the Ukishima JCT ramp no longer sits 16 m above its tunnel</sub>
- 가로등이 다른 도로·램프·교차로의 차로 위에 서 있던 문제 수정 (1,517개 전수 검사 0건)<br><sub>Lamp posts no longer stand on the lanes of other roads, ramps or junctions (all 1,517 checked)</sub>
- 교차로에서 인도가 차로를 덮던 문제 수정<br><sub>Sidewalks no longer cover the carriageway at junctions</sub>

---

## v0.3.1 — Clean Lines (2026-11-06)

> 차선 표시 정리: 교차로·합류부에서 다른 도로 위로 그어지던 차선 제거, 고속도로 합류·분류부에 굵은 점선, 온라인 접속 안정화.
> Lane markings cleaned up: no more lines painted across other roads at junctions and merges, thick dashed merge lines on the expressways, steadier online connections.

**✨ 추가 · New**

- 고속도로 합류·분류 구간에 실제 수도고처럼 굵은 흰 점선 표시<br><sub>Thick white dashed merge/diverge lines on the expressways, as on the real Shutoko</sub>

**🐞 수정 · Fixed**

- 교차로·램프 합류부에서 차선·가장자리선이 다른 도로의 차로 위를 가로지르던 문제 수정<br><sub>Fixed lane and edge lines running across other roads' lanes at intersections and ramp junctions</sub>
- 온라인: 자주 꺼지던 소형 릴레이 대신 대형 공개 릴레이 고정 사용 → 접속 오류 감소<br><sub>Online: pinned large public relays instead of small ones that went offline — fewer connection errors</sub>

---

## v0.3.0 — Full Throttle (2026-11-06)

> 주행감·사운드·콕핏·그래픽을 전부 다시 만들었어요. 실제 R34, 차종별 실내, 실녹음 엔진음, 난이도 설정, 그리고 도로 위에 서 있던 교각 수정.
> Handling, sound, cockpits and graphics rebuilt: a real R34, per-car interiors, recorded engines, difficulty settings — and no more piers on the road.

**✨ 추가 · New**

- 주행 모델 전면 재작성: 부드러운 타이어 그립 곡선·하중 이동·속도 감응 조향 — 200km/h 이상에서도 안정, 코너 약 1g, 실제에 가까운 제동거리<br><sub>Driving model rebuilt: smooth tyre grip curve, load transfer and speed-sensitive steering — planted at 200+ km/h, ~1 g cornering, realistic braking distances</sub>
- 난이도 프리셋(초보·표준·프로·시뮬레이션)과 조향 보조·STM·TCS·ABS·경찰 단속 개별 설정<br><sub>Difficulty presets (Beginner / Standard / Pro / Simulation) with separate steering assist, STM, TCS, ABS and police-tolerance options</sub>
- 차종별 실제 콕핏: 우핸들/좌핸들, 야간 조명이 들어오는 실시간 계기판, R34 멀티 디스플레이·R32/R33 센터 3연계, 비치는 룸미러·사이드미러, 움직이는 핸들·시프터·페달<br><sub>Per-car cockpits: RHD/LHD, live night-lit clusters, R34 multi-function display and R32/R33 console gauges, working mirrors, moving wheel, shifter and pedals</sub>
- 실제 R34 GT-R 3D 모델 및 시빅 타입R·머스탱 GT·마크II(JZX100)·LFA 모델 추가 (CC BY 4.0)<br><sub>Real 3D model for the R34 GT-R, plus Civic Type R, Mustang GT, Mark II (JZX100) and LFA models (CC BY 4.0)</sub>
- 엔진음: 실제 CC0 녹음 기반(직렬6·직렬4·수평대향·V8·V10·디젤), 가속/엔진브레이크 별도 레이어, 타이어 스퀼·노면·바람·팝·블로오프 실녹음, 터널·고가 아래 잔향, 이음매 「타탄」 소리<br><sub>Engines from real CC0 recordings (I6, I4, boxer, V8, V10, diesel) with on/off-throttle layers; recorded tyre squeal, road, wind, pops and blow-off; tunnel and under-viaduct reverb; expansion-joint thumps</sub>

**🔧 변경 · Changed**

- 다이코쿠 PA 밋: 차와 사람이 동쪽 밋 구역에 모이고 규모가 커짐, 가로수 개선<br><sub>Daikoku PA meet: cars and people gather in the east meet rows, bigger crowds, better trees</sub>
- 하늘: 낮 하늘이 하얗게 날아가지 않음, 구름층, 도쿄 광공해가 비치는 밤하늘, 밤바다의 금빛 번쩍임 제거<br><sub>Sky: blue day sky (no more white-out), cloud deck, light-polluted Tokyo night sky, no more golden glare on the night sea</sub>
- 웹사이트 리디자인: 인게임 히어로, 도쿄만 섹션, 빠른 이미지, 휴대폰·4K 레이아웃 수정, 20개 언어 완성<br><sub>Website redesign: in-game hero, Tokyo Bay section, faster images, phone/4K layout fixes, all 20 languages complete</sub>

**🐞 수정 · Fixed**

- 고가 교각이 아래 도로 차선 위에 서 있던 문제 수정 — 아래 도로를 걸치는 문형 교각으로 변경, 교각 충돌 판정 추가<br><sub>Fixed viaduct piers standing on the lanes of roads below — they are now portal frames straddling the lower road, and piers are solid</sub>
- 도로 위에 서 있던 표지판, 상층 데크를 뚫던 가로등 수정 (2층 구간은 데크 하부 조명)<br><sub>Fixed signs standing on the road and lamp posts piercing the deck above (stacked sections now use soffit lights)</sub>
- 지붕이 투명해 오픈카처럼 보이던 절차적 차량 수정, 12개 3D 차량의 야간 램프 점등<br><sub>Fixed procedural cars whose roofs looked see-through; night lamps now light on 12 more 3D models</sub>
- 벽에 닿으면 멈춰 붙던 문제 → 벽을 따라 미끄러짐, 저단 무한 휠스핀·자동 변속 시동 꺼짐 수정<br><sub>Walls: you now slide along instead of sticking; fixed endless low-gear wheelspin and auto-gearbox stalls</sub>

**⚠️ 알려진 문제 · Known issues**

- ND·S2000·S660 등 8종은 아직 라이선스가 확실한 3D 모델이 없어 절차적 모델 사용<br><sub>8 cars (incl. ND, S2000, S660) still use procedural models — no clearly licensed 3D model yet</sub>

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
- 공식 웹사이트, 로컬 계정(회원가입·닉네임), PWA 설치<br><sub>Official website, local accounts (sign-up, nickname), installable PWA</sub>
- 차종별 엔진음: 엔진 형식(직렬4·6, V6·V8·V10, 수평대향, 로터리, 경차 3기통, EV)·배기량·엔진 코드별 음색, 터보 휘슬과 블로오프, 자연흡기 고회전·VTEC 전환음, 디젤 트럭<br><sub>Per-car engine sound: layout (I4/I6/V6/V8/V10/boxer/rotary/kei I3/EV), displacement and engine-code voicing, turbo whistle and blow-off, NA high-rev & VTEC crossover, diesel trucks</sub>
- 차량 정보: 제조사·연식·섀시 코드·엔진·구동방식(FF 전륜 / FR·MR·RR 후륜 / AWD 사륜)·터보/자연흡기 표시 (게임 차고 + 웹사이트)<br><sub>Vehicle info: maker, year, chassis code, engine, drivetrain (FF / FR·MR·RR / AWD) and turbo/NA shown in the garage and on the website</sub>
- 실행 간편화: start.command / start.bat 더블클릭<br><sub>Easy launch: double-click start.command / start.bat</sub>

**🔧 변경 · Changed**

- 게임 이름을 MIDNIGHT JAPAN(ミッドナイト・ジャパン)으로 확정<br><sub>Title set to MIDNIGHT JAPAN (ミッドナイト・ジャパン)</sub>

**⚠️ 알려진 문제 · Known issues**

- 온라인 멀티플레이는 아직 없음 (계정은 이 기기에만 저장)<br><sub>No online multiplayer yet — accounts are stored on this device only</sub>


<sub>이 파일은 `data/meta.js`에서 자동 생성됩니다 (`node tools/gen-changelog.mjs`). 게임 안 · 웹사이트 모두 같은 기록을 씁니다.</sub>
