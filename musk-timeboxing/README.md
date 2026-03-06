# Musk Time-Boxing Planner

할 일 목록이 아니라 시간 블록 설계에 집중하는 로컬 웹 플래너입니다.

## 바로 실행 (Docker)

```bash
./scripts/docker-dev.sh up
```

- 접속: `http://localhost:5173`
- 종료: `./scripts/docker-dev.sh down`
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
- localStorage (날짜별 `musk-planner-YYYY-MM-DD` 키)

## 개발 실행

```bash
npm install
npm run dev
```

## Docker 개발 실행 (핫리로드)

컨테이너만 켜져 있으면 `http://localhost:5173`으로 접속할 수 있습니다.

```bash
docker compose up -d --build
```

- 소스코드는 볼륨 마운트(`.:/app`)되어 변경 시 자동 반영됩니다.
- 파일 감시는 `CHOKIDAR_USEPOLLING=true`로 설정되어 도커 환경에서도 안정적으로 동작합니다.
- 종료:

```bash
docker compose down
```

상세 의도/운영 가이드:

- `docs/DOCKER_DEV_WORKFLOW.md`

## 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 데이터 백업/복원

- 우하단 `빠른 메뉴(+)`를 열고 `데이터 백업 복원` 액션으로 백업/복원 모달을 엽니다.
- 내보내기:
  - `전체 내보내기`: 모든 날짜 + 카테고리 메타 JSON 생성
  - `오늘 내보내기`: 현재 날짜 데이터 중심 JSON 생성
- 가져오기:
  - `병합`: 기존 데이터 유지 + JSON 추가 반영
  - `교체`: 기존 planner 데이터 삭제 후 JSON으로 대체

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

## AI 협업 문서

- 세션 운영 가이드: `.agents/SESSION_PLAYBOOK.md`
- 프론트 UX 가디언: `.agents/FRONTEND_UX_GUARDIAN.md`
- 엔지니어링 컨벤션: `docs/ENGINEERING_CONVENTIONS.md`
- 도커 개발 워크플로: `docs/DOCKER_DEV_WORKFLOW.md`
- 전달/리뷰 워크플로: `docs/DELIVERY_WORKFLOW.md`
- 패치노트 운영 워크플로: `docs/PATCH_NOTES_WORKFLOW.md`
- 태스크 실행 보드(13개): `docs/TASK_EXECUTION_BOARD.md`
- FSD 맵(1단계): `docs/FSD_PHASE1_MAP.md`
- FSD 맵(2단계): `docs/FSD_PHASE2_MAP.md`
- 타임박스 레이아웃 매트릭스: `docs/TIMEBOX_LAYOUT_MATRIX.md`
