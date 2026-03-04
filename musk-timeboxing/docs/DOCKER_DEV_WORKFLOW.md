# Docker Dev Workflow

Musk Time-Boxing을 로컬 머신 환경 차이 없이, 항상 같은 방식으로 개발 서버(`npm run dev`)를 띄우기 위한 가이드입니다.

## 1) 의도 (Why)

- 개발 환경 표준화:
  - Node/NPM 버전 차이로 생기는 실행 이슈를 줄입니다.
- 빠른 온보딩:
  - 신규 세션/신규 PC에서도 `docker compose up`만으로 바로 접속 가능합니다.
- 실행 지속성:
  - 컨테이너를 백그라운드로 띄워두면 도커가 켜져 있는 동안 서버가 계속 살아있습니다.

## 2) 구성 (What)

- `Dockerfile.dev`
  - Node 20 Alpine 기반
  - `npm ci`로 의존성 설치
  - `npm run dev -- --host 0.0.0.0 --port 5173` 실행
- `docker-compose.yml`
  - 서비스명: `app`
  - 컨테이너명: `musk-timeboxing-dev`
  - 포트: `5173:5173`
  - 볼륨: `.:/app`, `/app/node_modules`
  - 파일 감시: `CHOKIDAR_USEPOLLING=true`

## 3) 사용법 (How)

### 시작

```bash
docker compose up -d --build
```

접속:

- `http://localhost:5173`

### 상태 확인

```bash
docker compose ps
docker compose logs -f
```

### 중지/정리

```bash
docker compose down
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

## 5) 운영/개발 주의사항

- 브라우저 데이터(localStorage)는 컨테이너가 아니라 브라우저에 저장됩니다.
  - 즉, 컨테이너를 내렸다 올려도 브라우저를 유지하면 데이터는 남아있습니다.
- `5173` 포트 충돌 시:
  - 다른 프로세스를 종료하거나 `docker-compose.yml` 포트 매핑을 변경하세요.

## 6) 빠른 체크리스트

1. `docker compose up -d --build`
2. `docker compose ps`에서 `Up` 확인
3. `http://localhost:5173` 접속
4. 코드 수정 후 화면 자동 반영(HMR) 확인
