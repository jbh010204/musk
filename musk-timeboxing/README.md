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

- `일간`: 기존 타임라인 편집/드래그/완료 처리 중심 화면
- `주간`: 현재 주간의 일정 수, 완료율, 계획 시간, 일정 미리보기를 카드로 확인
  - 상단 주간 스트립은 이전/현재/다음 주를 가로 캐러셀로 보여주며, 마우스 드래그/터치 스와이프로 부드럽게 훑을 수 있음
- `월간`: 월 전체를 캘린더 그리드로 훑고 날짜 클릭으로 일간 보기로 이동
  - 대표 카테고리 색과 완료율/밀도 heatmap으로 바쁜 날과 성격을 한눈에 확인

## 브레인 덤프 우선순위

- 각 항목의 배터리를 눌러 중요도를 `미지정 -> 낮음 -> 보통 -> 높음 -> 최우선` 순으로 올릴 수 있습니다.
- 현재 화면에서는 priority 변경 시 위치를 유지하고, 재진입 시 우선순위 순으로 정렬됩니다.
- `빅3 추천채우기`는 중요도 상위 항목부터 빈 슬롯을 채웁니다.

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
- 전달/리뷰 워크플로: `docs/DELIVERY_WORKFLOW.md`
- 패치노트 운영 워크플로: `docs/PATCH_NOTES_WORKFLOW.md`
- 태스크 실행 보드(43개): `docs/TASK_EXECUTION_BOARD.md`
- FSD 맵(1단계): `docs/FSD_PHASE1_MAP.md`
- FSD 맵(2단계): `docs/FSD_PHASE2_MAP.md`
- 타임박스 레이아웃 매트릭스: `docs/TIMEBOX_LAYOUT_MATRIX.md`
