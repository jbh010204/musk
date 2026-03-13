# Final Refactor Execution Plan

## 목적

이 문서는 현재 진행 중인 planner 리팩토링을 끝까지 밀기 위한 실행 문서다.

참조 문서 역할:

- 방향 문서: `AI_REFACTOR_GUIDE.md`
- 상세 구조 계획: `docs/CATEGORY_TREE_TS_REFACTOR_PLAN.md`

이 문서는 위 두 문서를 실제 작업 순서와 PR 단위로 압축한 운영 문서다.

## 최종 목표

최종적으로 아래 상태에 도달하는 것을 목표로 한다.

1. persisted schema와 internal model의 경계가 `entities/planner/lib/storage/*`에 고정된다.
2. `entities/planner/model/*`은 순수 command / selector / normalizer만 가진다.
3. `useDailyData.js`는 state owner + command adapter 역할만 수행한다.
4. `App.jsx`는 orchestration만 담당한다.
5. category tree, stack canvas state, timebox scheduling이 같은 도메인 규칙을 공유한다.
6. TypeScript는 구조 안정화 이후 model부터 점진 전환한다.

## 현재 상태 요약

완료 또는 대부분 진행:

- `storage/schema.js`
- `storage/migrations.js`
- `storage/adapters.js`
- `model/taskCards.ts`
- `model/timeBoxes.js`
- `model/dayState.ts`
- `model/plannerDay.ts`
- `model/selectors.ts`
- `model/types.ts`
- persisted `brainDump -> taskCards` internal adapter 경계
- internal task card naming(`title`, `estimateSlots`, `origin`) 도입
- `model/categoryTree.ts`
- `model/bigThree.ts`
- internal `sourceId -> taskId` adapter boundary
- `boardCanvas -> stackCanvasState` 전환
- workspace / selection helper extraction
- App-level Big3/reschedule derivation extraction
- core DnD payload helper extraction
- day navigation / carry-over helper extraction
- weekly strip / report / planning preview extraction
- planner day mutation helper extraction
- TypeScript `typecheck` 런웨이 추가 (`tsconfig.json`, `npm run typecheck`)

아직 큰 덩어리로 남아 있는 곳:

- `src/app/hooks/useDailyData.js`
- `src/App.jsx`
- weekly/report level derived planner state 정리
- storage/model 다음 TS 전환 대상 선정

## 작업 원칙

### 원칙 1. persisted naming은 더 이상 퍼뜨리지 않는다

새 코드에서는 가능한 한 아래 naming을 직접 퍼뜨리지 않는다.

- `brainDump`
- `sourceId`
- `boardCanvas`

단, 이미 남아 있는 persisted naming은 이번 리팩토링 동안 점진적으로 줄인다.
기존 naming을 한 번에 전부 없애는 작업은 하지 않는다.

### 원칙 2. 새 비즈니스 로직은 hook 안에 직접 쓰지 않는다

새 규칙은 먼저 `entities/planner/model/*`로 이동한다.

### 원칙 3. 한 번에 한 축만 옮긴다

아래 셋을 한 PR에 섞지 않는다.

- storage migration
- UI 구조 변경
- TypeScript 전환

## 남은 실행 단계

## Step 1. Big3 command 분리 [Done]

목표:

- `useDailyData.js`에서 Big3 mutation 로직 제거

대상:

- `sendToBigThree`
- `sendManyToBigThree`
- `fillBigThreeFromBrainDump`
- `addBigThreeItem`
- `removeBigThreeItem`

생성 파일:

- `src/entities/planner/model/bigThree.ts`

완료 기준:

- hook 내부의 Big3 관련 `setData` 분기가 command 호출형으로 바뀜

## Step 2. TimeBox command 분리 + taskId boundary [Done]

목표:

- timebox CRUD / timer / restore / category clear를 model command로 이동
- internal link naming을 `taskId`로 고정하고 persisted `sourceId`는 storage adapter로 한정

대상:

- `addTimeBox`
- `updateTimeBox`
- `removeTimeBox`
- `restoreTimeBox`
- `clearTimeBoxCategory`
- `startTimeBoxTimer`
- `pauseTimeBoxTimer`
- `completeTimeBoxByTimer`

권장 파일:

- `src/entities/planner/model/timeBoxes.js`

완료 기준:

- `useDailyData.js`에서 timebox mutation이 순수 함수 조합으로 줄어듦
- task card sync는 hook 안이 아니라 timebox command 결과에서 함께 보장됨
- `sourceId`는 storage boundary 외부에서 더 이상 직접 읽지 않음

## Step 3. DailyData를 reducer adapter처럼 축소 [In Progress]

목표:

- `useDailyData.js`를 "state owner + persistence sync + command adapter" 수준으로 줄인다.

결과:

- business rule은 model에 있고
- hook은 `prev -> next` 연결만 담당

현재까지:

- day navigation date helper를 model로 이동
- carry-over 계산을 model helper로 이동
- stack canvas patch 적용을 lib helper로 이동
- planner day record mutation helper를 model로 이동

## Step 4. selection / workspace command 정리 [Done]

목표:

- stackCanvasState와 workspace selection 업데이트를 별도 command/helper로 정리

대상:

- selectedCardId
- selectedCardIds
- selectedBigThreeId
- focusedLaneId

완료 기준:

- selection patch 계산이 `stackCanvasState` helper로 이동
- `PlanningCanvas`, `PlannerWorkspace`, `TimelineRailSurface`가 같은 selection 규칙을 공유

## Step 5. App orchestration 축소 [In Progress]

목표:

- `App.jsx`에서 도메인 계산, 중복 가공, 데이터 조립을 줄인다.

현재까지:

- `bigThreeProgress` selector를 model로 이동
- reschedule plan / apply helper를 model로 이동
- weekly strip / weekly report / weekly planning preview를 lib로 이동

허용:

- prop plumbing
- toast orchestration
- modal open/close
- cross-feature wiring

이동 대상:

- timebox 계획 보정 로직
- Big3 / task / timebox 파생 계산
- selection 관련 헬퍼

## Step 6. DnD payload 통합 [Mostly Done]

목표:

- drag source / drop target 계약을 공통 discriminated union으로 고정

현재까지:

- 주요 `dnd-kit` payload 생성 로직을 공통 helper로 이동
- `App.jsx`, `PlanningBoard`, `Timeline`, `ScheduleComposer`, `BigThree`, `BrainDump`가 같은 payload shape를 공유

후보 파일:

- `src/features/planner-dnd/lib/dragPayload.js`
- `src/features/planner-dnd/lib/dropTarget.js`
- `src/features/planner-dnd/hooks/usePlannerDnD.js`

## Step 7. TypeScript 점진 전환

현재까지:

- `typescript` dev dependency 추가
- `tsconfig.json` 추가
- `npm run typecheck` 추가
- `model/types.ts` 도입
- `model/selectors`, `model/dayState`, `model/plannerDay`를 `.ts`로 전환
- `model/taskCards`, `model/bigThree`를 `.ts`로 전환
- `model/categoryTree`를 `.ts`로 전환
- JS model helper의 `createId` 추론을 `string`으로 고정해 TS import 경계를 안정화

다음 우선순위:

1. `entities/planner/model/timeBoxes.js`
2. `entities/planner/lib/storage/*`
3. `app/hooks/useDailyData.js`의 타입 경계 초안

순서:

1. `entities/planner/model/*`
2. `entities/planner/lib/storage/*`
3. `shared/ui/*`
4. `app/hooks/*`
5. `features/*`

규칙:

- 타입 추가만 하는 커밋과 로직 변경 커밋을 섞지 않는다.

## PR 단위 권장 분할

### PR 1

- Big3 command 분리
- 관련 hook 연결
- 관련 E2E 확인

### PR 2

- timebox command 분리
- restore / timer / category clear 정리
- 관련 E2E 확인

### PR 3

- `useDailyData.js` 축소
- reducer adapter 형태 정리

### PR 4

- workspace / selection command 정리
- stackCanvasState command 정리

### PR 5

- App orchestration 슬림화

### PR 6

- DnD payload 통합

### PR 7+

- TypeScript 점진 전환

## 현재 바로 시작할 작업

다음 턴에서 바로 시작할 범위:

1. `useDailyData.js`에서 남은 command adapter 중복을 추가 축소
2. `timeBoxes.js` 또는 `taskCards.js` 중 하나를 다음 TS 대상로 선택
3. storage adapter 타입 초안이 필요한 부분을 문서화
4. 관련 `lint` / `build` / `typecheck` / targeted E2E 확인

## 검증 기준

최소 검증:

- `npm run lint`
- `npm run build`
- `npm run typecheck`
- Big3 관련 E2E

해당 변경이 timebox / workspace에 걸치면 추가로:

- `e2e/planner-workspace.spec.js`
- `e2e/bigthree-progress.spec.js`
- `e2e/bigthree-autofill.spec.js`

## 중단 조건

아래 중 하나가 발생하면 다음 step으로 넘어가지 않는다.

1. persisted schema가 의도치 않게 바뀜
2. 기존 localStorage 데이터가 migration 없이 깨짐
3. hook에서 model command보다 직접 mutation이 다시 늘어남
4. build / lint / 핵심 E2E 중 하나라도 깨짐

## 완료 정의

이 문서 기준 "최종 리팩토링 완료"는 아래를 만족하는 시점이다.

1. `useDailyData.js`가 현재보다 현저히 작아지고 역할이 명확하다.
2. Big3 / taskCards / timeBoxes / categoryTree / selectors가 model 계층에서 닫힌다.
3. `App.jsx`는 orchestration 중심 파일로 남는다.
4. DnD 계약이 통합된다.
5. TS 전환이 model부터 무리 없이 진행된다.
