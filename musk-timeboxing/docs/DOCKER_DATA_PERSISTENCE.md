# Docker Data Persistence

Musk Time-Boxing은 이제 브라우저 `localStorage`만 쓰지 않고, Docker volume에 planner 데이터를 영속화합니다.

## 1. 현재 저장 구조

- 브라우저(local mirror)
  - 현재 origin(`localhost:5173`, `localhost:4173` 등)의 `localStorage`
  - 앱 렌더 직전 서버 snapshot으로 hydrate됨
- Docker volume(source of truth)
  - Compose volume: `planner-data`
  - API 컨테이너 내부 파일: `/data/planner-store.json`

즉, 브라우저는 빠른 캐시를 쓰고 실제 장기 저장은 Docker volume이 담당합니다.

## 2. 왜 서버가 필요한가

브라우저 앱은 Docker volume을 직접 읽거나 쓸 수 없습니다.

- `localStorage`는 브라우저 저장소
- Docker volume은 컨테이너 파일시스템 저장소
- 둘 사이를 연결하려면 서버(API)가 필요합니다

이 프로젝트는 `server/index.js`가 그 역할을 담당합니다.

## 3. 포트가 달라도 유지되는 이유

기존에는 `localhost:4173`과 `localhost:5173`이 서로 다른 origin이라 데이터가 분리됐습니다.

이제는:

1. 앱이 시작되기 전에 `/api/planner/bootstrap`으로 Docker volume 데이터를 읽음
2. 읽은 snapshot을 현재 origin의 `localStorage`로 hydrate
3. 이후 편집 내용은 로컬 mirror + Docker volume 양쪽에 반영

그래서 앱 포트가 바뀌어도 서버 저장소만 살아 있으면 동일한 데이터를 다시 불러올 수 있습니다.

추가로 자동 동기화가 활성화된 Docker 모드에서는:

- 편집 후 약 20초마다 전체 snapshot을 서버에 체크포인트로 반영
- 브라우저가 다시 온라인 상태가 되면 즉시 재시도
- 탭으로 다시 돌아왔을 때도 dirty 상태면 즉시 재시도

즉, 개별 `day/meta` write가 잠깐 실패해도 다음 auto-sync 주기에서 Docker volume 상태를 다시 맞춥니다.

## 4. 4173 legacy 데이터 이관

이전 `localhost:4173` 브라우저 저장소에 데이터가 남아 있다면:

1. `./scripts/docker-dev.sh up`
2. `http://localhost:4173` 한 번 열기
3. 서버가 비어 있으면 자동 이관
4. 이미 서버에 데이터가 있으면 우하단 `+` -> `데이터 백업 복원` -> `현재 브라우저 데이터를 서버 저장소로 동기화`
5. 이후 `http://localhost:5173`에서 동일 데이터 확인

## 5. 관련 엔드포인트

- `GET /health`
- `GET /api/planner/bootstrap`
- `GET /api/planner/export`
- `PUT /api/planner/day/:date`
- `PUT /api/planner/meta`
- `PUT /api/planner/last-active-date`
- `PUT /api/planner/last-focus`
- `POST /api/planner/import`
- `DELETE /api/planner/data`

## 6. 운영 메모

- Docker volume을 지우지 않는 한 컨테이너 재시작 후에도 데이터 유지
- 브라우저 `localStorage`를 지워도 서버 bootstrap으로 다시 복원 가능
- 자동 동기화 주기는 `VITE_STORAGE_AUTO_SYNC_INTERVAL_MS`로 조절 가능(기본 20000ms)
- 서버 없이 `npm run dev`만 실행하면 기존처럼 브라우저 localStorage 단독 모드로 동작
