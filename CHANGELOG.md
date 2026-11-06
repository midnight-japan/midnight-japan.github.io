# 📜 MIDNIGHT JAPAN 업데이트 기록 · Changelog

현재 버전 · Current: **v0.6.0** · [▶ 웹에서 플레이](https://midnight-japan.github.io/) · [🌐 업데이트 페이지](https://midnight-japan.github.io/changelog.html)

| 버전 | 날짜 | 이름 | 요약 |
|---|---|---|---|
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
