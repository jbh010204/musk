# Musk Time-Boxing Planner

할 일 목록이 아니라 시간 블록 설계에 집중하는 로컬 웹 플래너입니다.

## 바로 실행 (Docker)

```bash
./scripts/docker-dev.sh up
```

- 메인 접속: `http://localhost:5173`
- 레거시 브리지: `http://localhost:4173`
- API 상태: `http://localhost:8787/health`
- 종료: `./scripts/docker-dev.sh down`
- 강제 재빌드: `./scripts/docker-dev.sh rebuild`
- 상태: `./scripts/docker-dev.sh ps`
- 로그: `./scripts/docker-dev.sh logs`

또는 npm 명령:

```bash
npm run docker:up
```

## 기술 스택

- Vite + React 18
- Tailwind CSS v3
- dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- 브라우저 local mirror + Docker volume persistence API

## 개발 실행

```bash
npm install
npm run dev
```

로컬 브라우저 단독 모드입니다. Docker volume 저장까지 함께 쓰려면 아래 중 하나를 실행하세요.

```bash
npm run api:dev
./scripts/docker-dev.sh up
```

## Docker 개발 실행 (핫리로드)

컨테이너만 켜져 있으면 `http://localhost:5173`으로 접속할 수 있습니다.

```bash
docker compose up -d --build
```

- 소스코드는 볼륨 마운트(`.:/app`)되어 변경 시 자동 반영됩니다.
- 파일 감시는 `CHOKIDAR_USEPOLLING=true`로 설정되어 도커 환경에서도 안정적으로 동작합니다.
- planner 데이터는 `planner-data` Docker volume에 저장됩니다.
- `http://localhost:4173`은 legacy browser storage 이관용 브리지 포트로도 함께 열립니다.
- 종료:

```bash
docker compose down
```

상세 의도/운영 가이드:

- `docs/DOCKER_DEV_WORKFLOW.md`
- `docs/DOCKER_DATA_PERSISTENCE.md`

## 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 데이터 백업/복원

- 우하단 `빠른 메뉴(+)`를 열고 `데이터 백업 복원` 액션으로 백업/복원 모달을 엽니다.
- 헤더 우측 배지에서 현재 저장 위치/상태(`로컬 저장`, `저장 대기`, `동기화 중`, `저장됨`, `오프라인`)를 확인할 수 있습니다.
- Docker 저장소를 쓰는 경우:
  - 변경 내용은 약 20초마다 자동으로 Docker volume으로 동기화되고, 탭 복귀/온라인 복구 시에도 즉시 재시도
  - `현재 브라우저 데이터를 서버 저장소로 동기화`: 현재 origin(localStorage) 데이터를 Docker volume으로 반영
  - `localhost:4173`에 남아 있는 구형 데이터를 volume으로 옮길 때 사용
- 내보내기:
  - `전체 내보내기`: 모든 날짜 + 카테고리 메타 JSON 생성
  - `오늘 내보내기`: 현재 날짜 데이터 중심 JSON 생성
- 가져오기:
  - `병합`: 기존 데이터 유지 + JSON 추가 반영
  - `교체`: 기존 planner 데이터 삭제 후 JSON으로 대체

## 일정 보기

- `캔버스`: custom `Stack Canvas`
  - 브레인 덤프 원본 카드를 직접 생성/선택/카테고리 스택 이동하는 작업면입니다.
  - 무한 화이트보드가 아니라, 미분류와 leaf category stack을 한 화면에서 다루는 planner 전용 canvas입니다.
  - 카드/Big3 선택 상태는 `stackCanvasState.selectedCardId`, `selectedCardIds`, `selectedBigThreeId`로만 가볍게 저장하고, 도메인 원본은 계속 `brainDump`와 `bigThree`가 유지합니다.
- `편성기`: 캔버스 카드를 시간표로 보내기 위한 단계
  - 좌측 카드 큐에서 카드를 선택하거나 드래그해 우측 30분 시간표 슬롯에 배치하면 즉시 오늘 타임라인의 timeBox가 생성됨
  - 카드의 예상 길이(`estimatedSlots`)를 기본 블록 길이로 사용하고, 생성된 일정은 `linkedTimeBoxIds`로 다시 보드/편성기 상태와 연결됨
- `워크스페이스`: 메인 작업 화면
  - 상단 `Big3 Focus Strip`, 중앙 `Stack Canvas`, 우측 `Timeline Rail`을 한 화면에 묶어 `캔버스 정리 -> Big3 확정 -> 일정 배치`를 같은 흐름으로 처리합니다.
  - 우측 rail은 별도 축약 편성기가 아니라 실제 일간 타임라인 surface를 공유하므로, 슬롯 클릭 배치/수동 인라인 생성/드래그 드롭/리사이즈/완료 처리까지 workspace 안에서 바로 이어집니다.
  - 세로로 긴 카테고리 목록 대신 상단 `Category Dock`에서 바로 분류하고, 카드가 선택되면 모든 도크가 은은하게 arm되며 목적지 도크는 카테고리 색 기반 gradient glow로 더 분명히 드러납니다.
  - 본문은 `Inbox + Active Category Stack`만 보여주고, 카드 생성도 별도 CTA보다 각 스택 상단 `ghost slot`에서 바로 인라인으로 시작합니다.
  - `Inbox`는 검색, 상태 필터, 접기를 지원해 카드가 많아져도 미분류 묶음을 먼저 좁혀 볼 수 있습니다.
  - 우측 rail은 드래그보다 `선택 후 슬롯 클릭`을 기본 경로로 두고, 이전보다 넓은 폭과 조금 더 큰 슬롯 높이로 시간표를 읽기 쉽게 조정했습니다.
  - 카드의 `선택` 토글로 여러 장을 고른 뒤, timeline rail 슬롯을 한 번 눌러 선택 순서대로 연속 배치할 수 있습니다.
  - 선택한 캔버스 카드를 Big3로 올리고, Big3 슬롯을 눌러 곧바로 우측 배치 대상으로 전환할 수 있습니다.
  - 카드가 선택되면 상단 `Selection Bar`가 떠서 `도크 이동`, `Big3`, `첫 빈 슬롯`, `선택 해제`를 카드 내부 chrome 대신 한곳에서 처리합니다.
  - 선택 카드가 있을 때는 `Shift+B`로 Big3 추가, `Shift+Enter`로 첫 빈 슬롯 배치, `[ ]`로 카테고리 도크 이동이 가능합니다.
  - 보드/캔버스/편성기를 따로 왕복하는 대신 같은 메인 영역에서 연속적으로 처리하는 흐름입니다.
  - 마지막으로 선택한 일정 보기 모드는 새로고침 후에도 복원되며, 계획 카드만 있고 timeBox가 없는 날은 첫 진입을 `워크스페이스`로 시작합니다.
- `일간`: 기존 타임라인 편집/드래그/완료 처리 중심 화면
  - app-level 브레인 덤프 rail 없이 타임라인 메인 surface만 보여주므로, 실행/수정에 집중한 화면으로 유지됩니다.
  - 상단 `퀵 템플릿` 스트립에서 자주 쓰는 블록을 바로 일정 추가 모달로 보낼 수 있음
- `주간`: 현재 주간의 일정 수, 완료율, 계획 시간, 일정 미리보기를 카드로 확인
  - 좌측 planning rail 없이 주간 리포트/보드 surface만 사용합니다.
  - 상단 주간 스트립은 이전/현재/다음 주를 가로 캐러셀로 보여주며, 마우스 드래그/터치 스와이프로 부드럽게 훑을 수 있음
  - 각 날짜 카드 우측 상단 `+`로 해당 날짜에 바로 일정 추가 가능
- `월간`: 월 전체를 캘린더 그리드로 훑고 날짜 클릭으로 상세 시트를 연 뒤, 필요할 때만 일간 보기로 이동
  - 좌측 planning rail 없이 월간 overview와 상세 시트에 집중합니다.
  - 대표 카테고리 색과 완료율/밀도 heatmap으로 바쁜 날과 성격을 한눈에 확인
  - 날짜 셀은 `언제 바쁜지`를 훑는 overview 역할에 집중하고, 자세한 일정 읽기는 옆 상세 시트가 담당
  - 날짜를 누르면 월간 맥락을 유지한 채 상세 패널에서 그날 일정/완료율/카테고리/빠른 추가를 먼저 확인 가능
  - 각 날짜 셀 우측 상단 `+`로 월간 뷰에서도 바로 일정 추가 가능

## 퀵 템플릿

- 우하단 `빠른 메뉴(+) -> 퀵 템플릿`에서 템플릿을 추가/수정/삭제합니다.
- 템플릿은 `이름`, `실제 일정 내용`, `기본 길이`, `기본 카테고리`를 저장합니다.
- 템플릿 데이터는 planner meta에 포함되어 JSON export/import와 Docker 동기화 시 함께 이동합니다.

## 브레인 덤프 우선순위

- 각 항목의 배터리를 눌러 중요도를 `미지정 -> 낮음 -> 보통 -> 높음 -> 최우선` 순으로 올릴 수 있습니다.
- 현재 화면에서는 priority 변경 시 위치를 유지하고, 재진입 시 우선순위 순으로 정렬됩니다.
- `빅3 추천채우기`는 중요도 상위 항목부터 빈 슬롯을 채웁니다.
- Stack Canvas는 이 리스트를 대체하는 시각 작업면이며, 현재는 리스트 fallback과 함께 병행됩니다.
- app-level 브레인 덤프 rail은 standalone `캔버스`, `편성기`에서만 보이고, `워크스페이스/일간/주간/월간`에서는 숨깁니다.

## 정적 배포

`vite.config.js`의 `base: './'`가 설정되어 있어 상대 경로 정적 호스팅이 가능합니다.

### GitHub Pages

1. `npm run build`
2. 생성된 `dist/` 내용을 배포 브랜치(`gh-pages`) 또는 `docs/`로 업로드
3. 저장소 Settings > Pages에서 배포 브랜치/폴더 선택

### Vercel

1. 프로젝트를 Vercel에 연결
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Deploy

## 참고

현재 Vite 7은 Node.js `20.19+`를 권장합니다. Node.js가 `20.17` 이하이면 경고가 표시될 수 있습니다.

Docker image가 이미 존재한다면 `./scripts/docker-dev.sh up`은 새 소스만 마운트해 바로 실행됩니다. 완전 신규 머신에서는 첫 빌드 시 base image pull이 필요합니다.

## AI 협업 문서

- 세션 운영 가이드: `.agents/SESSION_PLAYBOOK.md`
- 프론트 UX 가디언: `.agents/FRONTEND_UX_GUARDIAN.md`
- 엔지니어링 컨벤션: `docs/ENGINEERING_CONVENTIONS.md`
- 도커 개발 워크플로: `docs/DOCKER_DEV_WORKFLOW.md`
- Docker 데이터 영속화: `docs/DOCKER_DATA_PERSISTENCE.md`
- Stack Canvas pivot 문서: `docs/STACK_CANVAS_PIVOT_PLAN.md`
- 전달/리뷰 워크플로: `docs/DELIVERY_WORKFLOW.md`
- 패치노트 운영 워크플로: `docs/PATCH_NOTES_WORKFLOW.md`
- 태스크 실행 보드(86개): `docs/TASK_EXECUTION_BOARD.md`
- FSD 맵(1단계): `docs/FSD_PHASE1_MAP.md`
- FSD 맵(2단계): `docs/FSD_PHASE2_MAP.md`
- 타임박스 레이아웃 매트릭스: `docs/TIMEBOX_LAYOUT_MATRIX.md`
