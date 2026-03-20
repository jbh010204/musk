# Musk Time-Boxing Planner

할 일을 나열하는 데서 끝나지 않고, 실제 시간 블록으로 설계하는 데 집중한 local-first 플래너입니다. Elon Musk의 timeboxing/time blocking 방식에서 영감을 받았고, 그 방식이 나에게도 필요하다고 느껴 직접 만들기 시작했습니다.

이 프로젝트는 `Brain Dump -> Stack Canvas -> Big 3 -> Timeline` 흐름으로 생각 수집부터 우선순위 정리, 실제 일정 배치까지 하나의 작업면에서 이어지도록 설계했습니다.

체험은 정적 배포판에서 바로 가능합니다.
- 체험 링크: [https://jbh010204.github.io/musk/](https://jbh010204.github.io/musk/)
- 정적 체험판이라 데이터는 각 브라우저 `localStorage`에만 저장됩니다.
- 실제 사용이나 안정적인 검증은 아래 로컬 실행 또는 Docker 실행을 권장합니다.

- 메인 앱: [`musk-timeboxing/`](./musk-timeboxing/)
- 상세 개발 문서: [`musk-timeboxing/README.md`](./musk-timeboxing/README.md)
- 체험 링크: [https://jbh010204.github.io/musk/](https://jbh010204.github.io/musk/)

## 왜 만들었는가

일반적인 투두 앱은 할 일을 쌓는 데는 익숙하지만, 실제 시간을 배치하는 데는 약한 경우가 많습니다. Elon Musk가 사용하는 것으로 널리 알려진 timeboxing/time blocking 방식을 보고, 그 방식이 나에게도 실제로 필요하다고 느꼈습니다.

`Musk Time-Boxing Planner`는 그 흐름을 내 작업 방식에 맞게 구현해보려는 시도에서 시작했고, 아래 문제를 풀기 위해 만들었습니다.

- 생각과 할 일을 빠르게 수집하고 싶다.
- 카테고리와 우선순위를 정리한 뒤, 실제 일정에 자연스럽게 연결하고 싶다.
- 로컬 환경 중심으로 빠르게 쓰되, 백업과 복원은 쉽게 하고 싶다.

## 핵심 흐름

1. `Brain Dump`
   떠오르는 할 일을 빠르게 기록합니다.
2. `Stack Canvas`
   카드를 카테고리별로 정리하고 작업 덩어리를 시각적으로 재배치합니다.
3. `Big 3`
   오늘 가장 중요한 작업 3개를 추립니다.
4. `Timeline`
   실제 30분 슬롯 기반 일정으로 배치하고 수정합니다.

## 주요 기능

- local-first 일간 플래너
- `Brain Dump -> Stack Canvas -> Big 3 -> Timeline` 작업 흐름
- 드래그 앤 드롭 기반 일정 편성
- 일간, 주간, 월간 뷰 제공
- JSON 기반 데이터 백업 및 복원
- 브라우저 저장소 + 선택적 Docker volume 동기화
- 다크 모드 / 라이트 모드 지원

## 스크린샷

README에 사용할 이미지는 `README_ASSETS/`에 넣고 아래 경로로 연결하면 됩니다.

```md
![Workspace](./README_ASSETS/workspace.png)
![Daily Timeline](./README_ASSETS/daily-timeline.png)
![Monthly View](./README_ASSETS/monthly-view.png)
```

## 기술 스택

- React 18
- Vite
- TypeScript
- Tailwind CSS v3
- dnd-kit
- Playwright
- localStorage + optional Docker volume persistence

## 빠른 실행

```bash
cd musk-timeboxing
npm install
npm run dev
```

- 앱: `http://localhost:5173`

Docker 기반으로 실행하려면:

```bash
cd musk-timeboxing
npm run docker:up
```

- 앱: `http://localhost:5173`
- 레거시 브리지: `http://localhost:4173`
- API 상태 확인: `http://localhost:8787/health`

## 데이터 저장 방식

- 기본 저장소는 브라우저 local storage입니다.
- 필요할 경우 Docker volume 기반 저장소와 동기화할 수 있습니다.
- JSON 내보내기 / 가져오기를 통해 백업과 복원이 가능합니다.

## 자주 쓰는 명령어

```bash
cd musk-timeboxing
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test:e2e
```

## 프로젝트 구조

```text
musk/
└── musk-timeboxing/
    ├── src/
    │   ├── app/
    │   ├── entities/
    │   ├── features/
    │   └── shared/
    ├── docs/
    ├── e2e/
    ├── server/
    └── README.md
```

앱 내부 구조는 Feature-Sliced Design(FSD) 방향으로 정리하고 있습니다.

## AI 활용 방식

이 프로젝트에서는 AI를 단순 코드 생성 도구가 아니라, 프로젝트 문맥을 먼저 이해시키고 작업을 구조화하는 엔지니어링 도구로 활용했습니다.

- 세션 플레이북과 가이드를 통해 AI가 동일한 기준선 위에서 작업하도록 설정
- 구조 리팩터링과 TypeScript 전환 작업을 단계적으로 분해해 진행
- `lint`, `build`, `e2e`, 문서 동기화를 포함한 검증 루프로 결과물 관리
- 비사소한 프론트 기능/리팩토링은 구현 전에 `/fqa <기능명>`으로 intent, happy path, edge case, guard, invariant를 먼저 고정

## 문서

- 프로젝트 상세 설명: [`./musk-timeboxing/README.md`](./musk-timeboxing/README.md)
- 설계 및 작업 기록: [`./musk-timeboxing/docs`](./musk-timeboxing/docs)

## 앞으로 보강할 내용

- 주요 화면별 사용자 시나리오 정리
- 로드맵 및 개선 예정 항목 공개
