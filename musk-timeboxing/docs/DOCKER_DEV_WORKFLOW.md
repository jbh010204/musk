# Docker Dev Workflow

Musk Time-Boxing을 로컬 머신 환경 차이 없이, 항상 같은 방식으로 개발 서버(`npm run dev`)를 띄우기 위한 가이드입니다.

## 1) 의도 (Why)

- 개발 환경 표준화:
  - Node/NPM 버전 차이로 생기는 실행 이슈를 줄입니다.
- 빠른 온보딩:
  - 신규 세션/신규 PC에서도 `docker compose up`만으로 바로 접속 가능합니다.
- 실행 지속성:
  - 컨테이너를 백그라운드로 띄워두면 도커가 켜져 있는 동안 서버가 계속 살아있습니다.
- 포트 독립 저장:
  - planner 데이터는 Docker volume에 저장되어 `4173`, `5173` 등 앱 포트가 달라도 다시 복원됩니다.

## 2) 구성 (What)

- `Dockerfile.dev`
  - Node 20 Alpine 기반
  - `npm ci`로 의존성 설치
  - `npm run dev -- --host 0.0.0.0 --port 5173` 실행
- `docker-compose.yml`
  - 서비스명: `app`, `api`
  - 컨테이너명: `musk-timeboxing-dev`, `musk-timeboxing-api`
  - 포트: `5173 -> 앱`, `4173 -> legacy bridge`, `8787 -> API`
  - 볼륨: `.:/app`, `/app/node_modules`, `planner-data:/data`
  - 파일 감시: `CHOKIDAR_USEPOLLING=true`
- `server/index.js`
  - planner snapshot을 `/data/planner-store.json`에 저장하는 Node API

## 3) 사용법 (How)

### 시작

```bash
./scripts/docker-dev.sh up
```

의존성 변경이나 Dockerfile 변경 후에는:

```bash
./scripts/docker-dev.sh rebuild
```

접속:

- 메인 앱: `http://localhost:5173`
- legacy bridge: `http://localhost:4173`
- API 상태: `http://localhost:8787/health`

### 상태 확인

```bash
./scripts/docker-dev.sh ps
./scripts/docker-dev.sh logs
```

### 중지/정리

```bash
./scripts/docker-dev.sh down
```

이미지까지 정리:

```bash
docker compose down --rmi local
```

## 4) 변경 반영 방식

- 소스코드는 `.:/app`로 마운트되어, 파일을 수정하면 Vite HMR로 브라우저가 자동 반영됩니다.
- 의존성이 바뀐 경우(`package.json`, `package-lock.json` 변경):

```bash
docker compose up -d --build
```

## 5) legacy 데이터 이관

기존 `localhost:4173` 브라우저 저장소에 데이터가 남아 있었다면:

1. `./scripts/docker-dev.sh up`
2. `http://localhost:4173`을 한 번 연다
3. 서버 저장소가 비어 있으면 자동 이관
4. 이미 서버 데이터가 있으면 우하단 `+` -> `데이터 백업 복원` -> `현재 브라우저 데이터를 서버 저장소로 동기화`
5. 이후 `http://localhost:5173`에서 동일 데이터 확인

## 6) 운영/개발 주의사항

- 앱은 브라우저 localStorage를 local mirror로 쓰고, 실제 planner 데이터는 Docker volume을 source of truth로 유지합니다.
- `APP_PORT`, `LEGACY_PORT`, `API_PORT` 환경변수로 포트 변경 가능:

```bash
APP_PORT=5273 LEGACY_PORT=4273 API_PORT=8877 ./scripts/docker-dev.sh up
```

- 첫 빌드 시 Docker base image pull이 필요할 수 있습니다.

## 7) 빠른 체크리스트

1. `docker compose up -d --build`
2. `docker compose ps`에서 `Up` 확인
3. `http://localhost:5173` 접속
4. `http://localhost:8787/health`에서 API 상태 확인
5. 코드 수정 후 화면 자동 반영(HMR) 확인
