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
3. `useDailyData.ts`는 state owner + command adapter 역할만 수행한다.
4. `App.jsx`는 orchestration만 담당한다.
5. category tree, stack canvas state, timebox scheduling이 같은 도메인 규칙을 공유한다.
6. TypeScript는 구조 안정화 이후 model부터 점진 전환한다.

## 현재 상태 요약

완료 또는 대부분 진행:

- `storage/schema.ts`
- `storage/migrations.ts`
- `storage/adapters.ts`
- `storage/index.ts`
- `app/hooks/useDailyData.ts`
- `model/taskCards.ts`
- `model/timeBoxes.ts`
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
- planner model layer TypeScript 전환 완료
- storage adapter TypeScript 전환 완료
- storage schema/migration TypeScript 전환 완료
- storage/index TypeScript 전환 완료
- planner lib utility/barrel TypeScript 전환 완료
- planner lib core (`boardCard`, `stackCanvasState`, `calendarViewData`) TypeScript 전환 완료
- `useDailyData` TypeScript 경계 추가
- `app/hooks/useCategoryMeta`, `useTemplateMeta`, `useToast`, `app/hooks/index` TypeScript 전환 완료
- `main.tsx`, `features/floating/*` TypeScript 전환 완료
- `entities/planner/lib/storageServer.ts` TypeScript 전환 완료
- `features/patch-notes/*` TypeScript 전환 완료
- `src/App.tsx` TypeScript 전환 완료
- `shared/ui/*` TypeScript 전환 완료
- `features/header/*` TypeScript 전환 완료
- `features/big-three/*` TypeScript 전환 완료
- `features/brain-dump/*` TypeScript 전환 완료
- `features/template/*` TypeScript 전환 완료
- `features/category/*` TypeScript 전환 완료
- `features/data-transfer/*` TypeScript 전환 완료
- timeline DnD orchestration hook(`usePlannerTimelineDnd.ts`)
- timebox action orchestration hook(`usePlannerTimeBoxActions.ts`)
- day flow orchestration hook(`usePlannerDayFlow.ts`)
- task / Big3 action orchestration hook(`usePlannerTaskActions.ts`)
- category / template action orchestration hook(`usePlannerMetaActions.ts`)
- App UI shell state hook(`usePlannerShellState.ts`)

아직 큰 덩어리로 남아 있는 곳:

- app source 기준 TypeScript 전환은 완료
- 남은 후속 작업은 문서/운영 파일 정리와 추가 구조 슬림화

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

- `src/entities/planner/model/timeBoxes.ts`

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
- task/big3/timebox mutation adapter를 hook 내부 helper로 공통화
- date reload / date move 경로를 단일 `loadPlannerDate` 흐름으로 정리

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
- skip reason selector를 model로 이동
- managed category view model 계산을 model로 이동
- repeated timebox placement planning을 model helper로 이동
- timeline slot hit-test / drag range 계산을 `planner-dnd` helper로 이동
- timeline DnD state/sensor/handler orchestration을 `usePlannerTimelineDnd` hook으로 이동
- timebox undo/duplicate/quick-add orchestration을 `usePlannerTimeBoxActions` hook으로 이동
- date navigation / daily suggestion / reschedule orchestration을 `usePlannerDayFlow` hook으로 이동
- task remove / Big3 send / autofill orchestration을 `usePlannerTaskActions` hook으로 이동
- category / template CRUD orchestration을 `usePlannerMetaActions` hook으로 이동
- theme / modal / quick-add / persistence shell state를 `usePlannerShellState` hook으로 이동
- `PlannerShellLayout.tsx`, `PlannerModalLayer.tsx`로 root layout / modal composition을 분리해 `App.tsx`를 orchestration 중심으로 축소

허용:

- prop plumbing
- toast orchestration
- modal open/close
- cross-feature wiring

이동 대상:

- toast lifecycle helper
- modal open/close wiring 보조 helper
- cross-feature section composition 보조 selector
- section-level presentational extraction

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
- `model/timeBoxes`를 `.ts`로 전환
- `storage/adapters`를 `.ts`로 전환
- `storage/schema`, `storage/migrations`를 `.ts`로 전환
- `storage/index`, `model/index`를 `.ts`로 전환
- `lib/timeSlot`, `lib/categoryVisual`, `lib/timeBoxPlacement`, `lib/brainDumpPriority`, `lib/index`, `lib/storage`, `entities/planner/index`를 `.ts`로 전환
- `lib/boardCard`, `lib/stackCanvasState`, `lib/calendarViewData`를 `.ts`로 전환
- `app/hooks/useDailyData`를 `.ts`로 전환
- `app/hooks/useCategoryMeta`, `useTemplateMeta`, `useToast`, `app/hooks/index`를 `.ts` / `.tsx`로 전환
- `main`, `features/floating/index`, `features/floating/ui/FloatingActionDock`를 `.ts` / `.tsx`로 전환
- `storageServer`, `features/patch-notes/*`, `App.tsx`를 `.ts` / `.tsx`로 전환
- `shared/ui/Badge`, `Button`, `Card`, `IconButton`, `cn`, `index`를 TS로 전환
- `features/header/index`, `features/header/ui/Header`를 TS로 전환
- `features/big-three/index`, `features/big-three/ui/index`, `features/big-three/ui/BigThreeSlot`을 TS로 전환
- `features/brain-dump/index`, `features/brain-dump/ui/*`를 TS로 전환
- `features/template/index`, `features/template/ui/TemplateManagerModal`을 TS로 전환
- `features/category/index`, `features/category/ui/CategoryManagerModal`을 TS로 전환
- `features/data-transfer/index`, `features/data-transfer/ui/DataTransferModal`을 TS로 전환
- `features/timeline/ui/QuickAddModal`, `RescheduleAssistantModal`, `CompletionModal`을 TS로 전환
- `features/timeline/ui/DailyRecapCard`, `WeeklyReportCard`를 TS로 전환
- `features/timeline/ui/WeeklyPlanningBoard`, `WeeklyCalendarView`를 TS로 전환
- `features/timeline/ui/MonthlyCalendarView`, `MonthDayDetailSheet`를 TS로 전환
- `features/timeline/ui/timeBoxLayout`, `TimeBoxCard`를 TS로 전환
- `features/timeline/ui/TimeSlotGrid`, `TimelineRailSurface`를 TS로 전환
- `features/timeline/ui/index`, `features/timeline/index`를 TS로 전환
- `features/schedule-composer/*`를 TS로 전환
- `features/planner-workspace/lib/workspaceLayout`, `ui/WorkspaceBigThreeRail`, `index`를 TS로 전환
- `features/planner-workspace/ui/PlannerWorkspace`를 TS로 전환
- `features/planning-canvas/lib/inboxFilters`, `ui/CanvasInlineCreateSlot`, `ui/CanvasSelectionBar`, `index`를 TS로 전환
- `features/planning-canvas/ui/PlanningCanvas`, `ui/index`를 TS로 전환
- `features/planning-board/lib/categoryNodePresentation`, `ui/BoardToolbar`, `ui/BoardCardEditorModal`, `index`, `ui/index`를 TS로 전환
- `features/planning-board/ui/CategoryNode`, `ui/CategoryStackLane`, `ui/BoardCard`, `ui/PlanningBoard`를 TS로 전환
- Tailwind content glob을 `ts/tsx`까지 확장해 TS 전환된 UI 유틸이 purge 대상에서 빠지지 않도록 고정
- `features/planner-dnd/lib/payloads`를 `.ts`로 전환
- `features/planner-dnd/usePlannerTimelineDnd`를 `.ts`로 추가
- `app/hooks/usePlannerTimeBoxActions`를 `.ts`로 추가
- `app/hooks/usePlannerDayFlow`를 `.ts`로 추가
- JS model helper의 `createId` 추론을 `string`으로 고정해 TS import 경계를 안정화

다음 우선순위:

1. 문서/운영 파일(`AI_REFACTOR_GUIDE.md` 등)과 현재 구현 상태 동기화
2. 필요하면 타입 alias / exported prop type 정리 같은 후속 cleanup 진행
3. 기능 재개 전 `App.tsx` 추가 분해가 정말 필요한지 점검

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

### PR 7

- hook orchestration extraction

### PR 8+

- TypeScript 점진 전환

## 현재 바로 시작할 작업

다음 턴에서 바로 시작할 범위:

1. `src/App.jsx`의 toast / section composition helper 추가 추출
2. `features/*`에서 planner 관련 주요 UI부터 `.ts` / `.tsx` 전환 시작
3. feature selector / payload 타입을 model 타입과 맞물리게 정리
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
