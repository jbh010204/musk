# Category Tree + Canvas + Scheduling Refactor Plan

## 2026-03-11 Pivot Note

`Planning Canvas`는 더 이상 `tldraw` 기반 자유 화이트보드로 확장하지 않는다.

현재 기준의 active 방향은 다음과 같다.

- 중앙 메인 작업면은 custom `StackCanvas`
- 카드 생성과 카테고리 스택 이동은 canvas 안에서 처리
- 시간표 배치는 canvas 밖 우측 `Timeline Rail`에서 처리
- `stackCanvasState`는 tldraw snapshot이 아니라 lightweight UI state만 유지

상세 전환 계획은 [STACK_CANVAS_PIVOT_PLAN.md](/Users/bohyeong/Desktop/공부/project/musk/musk-timeboxing/docs/STACK_CANVAS_PIVOT_PLAN.md)에 별도 기록한다.

## 문서 목적

이 문서는 `Planning Board / Planning Canvas / Schedule Composer / Timeline`을
부모/자식 카테고리 구조까지 확장할 수 있도록 리팩토링하는 실행 브리프다.

목표는 다음 3가지를 동시에 만족하는 것이다.

1. 카테고리를 부모/자식 트리로 관리할 수 있어야 한다.
2. 캔버스는 planner 전용 `StackCanvas` UI를 제공하되 도메인 원본을 오염시키지 않아야 한다.
3. 일정(TimeBox)과 카드(TaskCard) 연결이 리팩토링 이후에도 안정적으로 유지되어야 한다.

이 문서는 구현 가이드이며, 한 번에 전부 바꾸는 것을 권장하지 않는다.
작업은 반드시 단계적으로 나눈다.

## 제품 방향 보정

현재 앱은 `Planning Board / Planning Canvas / Schedule Composer / Timeline`이 화면 단위로 분리되어 있다.
이 구조는 기능을 검증하는 중간 단계로는 유효하지만,
장기적으로는 사용자가 느끼기에 너무 분리되어 있고 컨텍스트 전환 비용이 크다.

목표 화면은 **큰 하나의 Planner Workspace**다.

권장 최종 형태:

- 좌측 rail: `Brain Dump`, `Big 3`, 카드 스택
- 중앙 main stage: `Stack Canvas`
- 우측 rail: `Schedule Composer / Time Grid`

즉 사용자는 한 화면 안에서:

1. 카드를 생성하고
2. 카테고리/스택으로 정리하고
3. 필요하면 Big 3에 올리고
4. 바로 옆 시간표에 끼워 넣어 일정으로 만든다

중요:

- 이것은 **한 화면의 통합 workspace**를 뜻한다.
- `Brain Dump`, `Big 3`, `Time Grid`를 모두 canvas 내부 오브젝트로 저장하겠다는 뜻은 아니다.
- 중앙 stack canvas는 도메인 UI 작업면이고, 좌우 rail은 계속 일반 UI 레이어로 유지하는 것이 권장된다.

즉 장기 목표는 `캔버스 중심 단일 화면`이지,
모든 UI를 자유 화이트보드 오브젝트로 바꾸는 것은 아니다.

## 현재 확인된 구조 문제

### 1. 소스 오브 트루스가 너무 넓다

- `src/App.jsx`
- `src/app/hooks/useDailyData.js`

현재 화면 orchestration, drag/drop, 재배치, 타이머, 모달, cross-day 동작이 넓게 퍼져 있다.
특히 `useDailyData.js`가 day state 대부분을 직접 변경한다.

### 2. `brainDump`가 도메인 의미를 너무 많이 맡고 있다

- `brainDump`는 원래 아이디어 수집함처럼 보이지만 실제로는 planning board 카드 원본 역할도 한다.
- `bigThree`, `board`, `composer`, `timeline`이 모두 `brainDump` 카드에 기대고 있다.

이 구조는 당장은 동작하지만, 카테고리 트리나 richer card state가 들어오면 의미가 더 흐려진다.

### 3. 카테고리 모델이 flat 하다

- 현재 category는 사실상 `{ id, name, color }` 수준이다.
- 부모/자식 이동, cycle 방지, sibling order, 삭제 정책이 없다.

### 4. DnD payload 계약이 문자열 분기에 의존한다

- `type: 'BRAIN_DUMP'`
- `type: 'BIG_THREE'`
- `type: 'TIME_BOX'`
- `type: 'BOARD_CARD'`
- `type: 'COMPOSER_CARD'`

payload shape가 컴파일 단계에서 고정되지 않기 때문에 화면이 커질수록 실수 여지가 커진다.

### 5. persistence / normalization / projection 경계가 분산되어 있다

- `src/entities/planner/lib/storage.js`
- `src/app/hooks/useDailyData.js`
- `src/entities/planner/lib/stackCanvasState.js`
- `src/features/planning-canvas/ui/PlanningCanvas.jsx`

정규화와 저장 계약이 여러 곳에 흩어져 있어 스키마 변경 시 누락 위험이 높다.

### 6. 화면 분리가 과하다

- 현재 `BOARD`, `CANVAS`, `COMPOSER`, `TIMELINE`은 각각 독립 view처럼 동작한다.
- 그러나 사용자가 원하는 실제 워크플로는 이들 사이를 자주 왕복하는 것이 아니라,
  한 큰 작업 화면 안에서 카드 생성 -> 분류 -> 배치가 연속적으로 이어지는 형태다.

따라서 리팩토링 이후에는
`화면 분리`보다 `workspace 통합`이 우선되는 방향으로 재설계하는 것이 맞다.

## 리팩토링 목표

이번 리팩토링의 핵심 목표는 아래 순서다.

1. 도메인 타입과 명령(command) 계층을 먼저 만든다.
2. 카테고리 트리 모델을 도입한다.
3. 화면은 도메인 명령을 호출하는 thin UI로 바꾼다.
4. 캔버스는 projection/view state 레이어로 유지한다.
5. persistence migration은 storage 레이어 한 곳에서만 처리한다.

## 합의된 실행 순서

아래 순서를 바꾸지 않는 것을 권장한다.

1. persisted schema 유지
2. storage boundary 분리
   - migration
   - persisted <-> internal adapter
3. internal domain model 도입
4. category tree 정책 확정
5. command / selector 분리
6. `useDailyData` 축소
7. UI thin화
8. 마지막에 TypeScript 범위 확대

이 순서가 중요한 이유:

- 지금 바로 TS부터 도입하면 불안정한 구조를 타입으로 감싸는 데 그칠 수 있다.
- 반대로 adapter / command / selector를 먼저 고정하면,
  TypeScript는 나중에 안정된 경계를 강화하는 역할을 하게 된다.

## 세부 실행 태스크(R1~R5)

리팩토링은 아래 5개 묶음으로 끊어서 진행한다.
한 번에 전부 하지 않고, 각 묶음이 끝날 때마다 회귀를 확인한다.

### R1. storage boundary 분리

목표:

- persisted schema 관련 책임을 `schema`, `migrations`, `adapters`, `index`로 분리한다.
- 기존 `loadDay/saveDay/loadMeta/saveMeta` API는 유지한다.

하위 태스크:

1. persisted constant / key / empty shape를 `schema`로 이동
2. 구 persisted data -> 최신 persisted data 보정을 `migrations`로 이동
3. persisted <-> internal model 변환을 `adapters`로 이동
4. 기존 `storage.js`는 호환용 re-export 레이어로 축소

완료 기준:

- 기존 호출부 변경 없이 동작한다.
- migration과 adapter 책임이 코드에서 분리된다.

### R2. internal domain model 시작

목표:

- `taskCards` 관련 순수 함수 계층을 만든다.
- UI/hook이 raw array surgery 대신 helper를 쓰기 시작한다.

하위 태스크:

1. `taskCards` model helper 추가
2. `selectors` 추가
3. task link/status 계산을 model selector로 이동
4. 기존 board/canvas 코드에서 selector 재사용 시작

완료 기준:

- task card 생성/수정/복원/링크 동기화 규칙이 한 군데로 모인다.

### R3. useDailyData 축소 1차

목표:

- `useDailyData`에서 task card normalization / update / restore / layout 적용 로직을 걷어낸다.

하위 태스크:

1. add/update/remove/restore를 task card command 호출로 교체
2. board layout / category clear도 command 호출로 교체
3. hook 내부 중복 normalize 제거

완료 기준:

- `useDailyData`는 day state orchestration은 유지하되,
  task card shape 보정 로직은 직접 가지지 않는다.

### R4. category tree model

목표:

- parent/child category와 leaf-only 정책을 강제할 수 있는 pure model layer를 만든다.

하위 태스크:

1. `Category`에 `parentId`, `order` 추가
2. `buildCategoryTree`, `isLeafCategory`, `canMoveCategory`, `moveCategory` 구현
3. task -> parent direct attach 금지 guard 추가

완료 기준:

- tree 정책이 UI가 아니라 model에서 먼저 고정된다.

### R5. unified workspace 정리

목표:

- 화면 분리보다 workspace composition을 우선하는 구조로 재정렬한다.

하위 태스크:

1. 좌측 rail / 중앙 canvas / 우측 time grid 계약 정의
2. BOARD / CANVAS / COMPOSER를 같은 workspace 안의 조합 가능한 rail로 재구성
3. canvas는 projection, 좌우 rail은 domain UI라는 원칙 유지

완료 기준:

- 사용자는 한 화면에서 카드 생성 -> 분류 -> 배치를 연속적으로 수행할 수 있다.

## 비목표

이번 단계에서 반드시 하지 않아도 되는 것:

- 전 화면을 한 PR에서 `.tsx`로 전환
- 디자인 전면 개편
- 서버 API 도입
- tldraw 내부 동작 자체를 바꾸는 커스텀 엔진 작업

## 권장 전략

### 권장안: 도메인 이름은 먼저 정리하되 저장 필드명은 임시 유지

가장 현실적인 경로는 persisted schema의 `brainDump` 필드명은 당분간 유지하고,
앱 내부에서는 `TaskCard[]`처럼 읽는 adapter를 두는 것이다.

즉:

- 저장 포맷: 당분간 호환 유지
- 내부 모델: `TaskCard`, `Category`, `TimeBox`, `PlannerDay` 중심으로 재구성

이 방식이면 data migration 비용을 한 번에 크게 치르지 않아도 된다.

## storage boundary 분리 원칙

`storage` 경계는 하나로 유지하되,
그 내부 책임은 반드시 둘로 나눈다.

### 1. migration

역할:

- 구 persisted schema를 최신 persisted schema로 올린다.
- localStorage / import-export / docker persistence와 호환되는 저장 포맷만 다룬다.

예시:

- `schemaVersion: 3 -> 4`
- `stackCanvasState` 누락 보정
- category에 `parentId`, `order` 기본값 보정

### 2. adapter

역할:

- 최신 persisted schema를 internal domain model로 바꾼다.
- internal domain model을 다시 persisted schema로 내린다.

예시:

- persisted `brainDump` -> internal `taskCards`
- persisted `timeBox.sourceId` -> internal `timeBox.taskId`
- persisted `item.content` -> internal `taskCard.title`

중요:

- migration과 adapter는 성격이 다르다.
- 둘을 한 함수에 섞지 않는다.
- storage 레이어는 하나지만 파일/개념 책임은 분리한다.

권장 파일 구조:

```txt
src/entities/planner/lib/storage/
  schema.js
  migrations.js
  adapters.js
  index.js
```

## 목표 도메인 타입 초안

아래 타입은 초안이며, 이 범위를 크게 벗어나지 않는 것이 좋다.

```ts
export type CategoryId = string
export type TaskId = string
export type TimeBoxId = string
export type BigThreeId = string
export type ISODate = `${number}-${number}-${number}`

export type TaskPriority = 0 | 1 | 2 | 3 | 4
export type TimeBoxStatus = 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'SKIPPED'
export type TaskSource = 'list' | 'board' | 'template'

export interface Category {
  id: CategoryId
  name: string
  color: string
  parentId: CategoryId | null
  order: number
  collapsed?: boolean
}

export interface TaskCard {
  id: TaskId
  title: string
  note: string
  priority: TaskPriority
  categoryId: CategoryId | null
  estimateSlots: number
  linkedTimeBoxIds: TimeBoxId[]
  source: TaskSource
  isDone: boolean
}

export interface BigThreeItem {
  id: BigThreeId
  taskId: TaskId | null
  titleSnapshot: string
}

export interface Template {
  id: string
  name: string
  content: string
  durationSlots: number
  categoryId: CategoryId | null
}

export interface TimeBox {
  id: TimeBoxId
  taskId: TaskId | null
  content: string
  date?: ISODate
  startSlot: number
  endSlot: number
  status: TimeBoxStatus
  actualMinutes: number | null
  categoryId: CategoryId | null
  skipReason: string | null
  carryOverFromDate: ISODate | null
  carryOverFromBoxId: TimeBoxId | null
  timerStartedAt: number | null
  elapsedSeconds: number
}

export interface StackCanvasState {
  version: number
  layoutMode: 'stack'
  selectedCardId: TaskId | null
  selectedCardIds: TaskId[]
  focusedLaneId: CategoryId | 'uncategorized'
  migratedFromLegacyBoard: boolean
  lastSyncedAt: number | null
}

export interface PlannerDay {
  schemaVersion: number
  date: ISODate
  taskCards: TaskCard[]
  bigThree: BigThreeItem[]
  timeBoxes: TimeBox[]
  stackCanvasState: StackCanvasState
}

export interface PlannerMeta {
  schemaVersion: number
  categories: Category[]
  templates: Template[]
}

export interface DragPayloadTaskCard {
  kind: 'TASK_CARD'
  taskId: TaskId
}

export interface DragPayloadBigThree {
  kind: 'BIG_THREE'
  bigThreeId: BigThreeId
  taskId: TaskId | null
  titleSnapshot: string
}

export interface DragPayloadTimeBox {
  kind: 'TIME_BOX'
  timeBoxId: TimeBoxId
  startSlot: number
  endSlot: number
}

export interface DragPayloadCategory {
  kind: 'CATEGORY'
  categoryId: CategoryId
}

export type PlannerDragPayload =
  | DragPayloadTaskCard
  | DragPayloadBigThree
  | DragPayloadTimeBox
  | DragPayloadCategory
```

## 호환성 매핑 규칙

기존 persisted schema와 내부 도메인 이름은 바로 1:1로 바꾸지 않는다.

권장 매핑:

- persisted `brainDump` -> internal `taskCards`
- persisted `timeBox.sourceId` -> internal `timeBox.taskId`
- persisted `item.content` -> internal `taskCard.title`
- persisted `estimatedSlots` -> internal `estimateSlots`

즉 storage layer에서 read/write adapter를 둬서
기존 저장 포맷은 유지하고 내부 코드만 새 이름을 쓰는 방식으로 간다.

## schema migration 주의점

현재 E2E를 보면 `schemaVersion: 3`과 `schemaVersion: 4` 데이터가 모두 등장한다.
따라서 migration은 단일 최신 스키마만 가정하면 안 된다.

반드시 확인할 것:

- category에 `parentId`, `order`가 없을 때 기본값 부여
- `stackCanvasState`가 없는 구 스키마를 안전하게 hydrate
- `timeBox.sourceId`가 없는 데이터도 안전하게 normalize

## 카테고리 트리 규칙 초안

부모/자식 카테고리를 추가하려면 아래 규칙을 먼저 고정한다.

1. category는 `parentId`로 트리를 구성한다.
2. 같은 parent 아래에서는 `order`로 정렬한다.
3. 자신을 자기 자식 아래로 이동할 수 없다.
4. 삭제 정책은 반드시 하나만 선택한다.

삭제 정책 후보:

- A. 자식이 있으면 삭제 금지
- B. 자식을 부모로 승격
- C. 자식도 함께 삭제

권장:

- 1차 구현은 `A. 자식이 있으면 삭제 금지`

이유:

- 스케줄/카드 연결 보존 규칙이 가장 단순하다.
- 예상치 못한 데이터 손실을 막기 쉽다.

## task category attachment 정책

카테고리 트리를 도입하기 전에 아래 정책을 먼저 확정한다.

### 권장안: task는 leaf category에만 직접 연결한다

즉:

- `task.categoryId`는 `null` 또는 `leaf category id`
- parent category에는 task를 직접 붙이지 않는다
- parent category는 구조/집계/탐색용 노드다

이 정책을 권장하는 이유:

1. board grouping이 단순해진다
2. composer 표시 기준이 흔들리지 않는다
3. canvas projection이 명확해진다
4. parent는 descendant aggregate, leaf는 direct task라는 규칙이 고정된다

### 비권장안: parent category에도 task 직접 연결 허용

이 방식은 아래 문제를 만든다.

- parent direct task와 child descendant task를 함께 어떻게 그릴지 애매함
- board lane / canvas node / composer filter 집계가 복잡해짐
- 삭제/이동 정책이 훨씬 어려워짐

따라서 1차 리팩토링에서는 **leaf-only 정책을 고정**하는 것이 맞다.

UI 권장 규칙:

- parent category 선택 시 direct attach 금지
- 사용자에게 `하위 카테고리를 선택하세요` 안내
- 미분류(`null`)는 계속 허용

## 권장 도메인 유틸

아래 유틸은 UI보다 먼저 구현한다.

### categoryTree.ts

- `buildCategoryTree(categories)`
- `getCategoryChildren(categories, parentId)`
- `isLeafCategory(categories, categoryId)`
- `getCategoryPath(categories, categoryId)`
- `isDescendant(categories, targetId, ancestorId)`
- `canMoveCategory(categories, categoryId, nextParentId)`
- `moveCategory(categories, categoryId, nextParentId, nextOrder)`
- `reorderSiblingCategories(categories, parentId, orderedIds)`
- `removeCategory(categories, categoryId, policy)`

### taskCards.ts

- `normalizeTaskCard(raw)`
- `canAssignTaskToCategory(categories, categoryId)`
- `moveTaskToCategory(taskCards, taskId, categoryId)`
- `reorderTasksWithinCategory(taskCards, categoryId, orderedTaskIds)`
- `syncTaskLinksWithTimeBoxes(taskCards, timeBoxes)`

### timeBoxes.ts

- `normalizeTimeBox(raw)`
- `scheduleTaskCard(taskCards, timeBoxes, taskId, startSlot)`
- `moveTimeBox(timeBoxes, timeBoxId, startSlot, endSlot)`
- `resizeTimeBox(timeBoxes, timeBoxId, endSlot)`
- `carryOverPendingTimeBoxes(sourceDay, targetDay)`

### canvasProjection.ts

- `buildPlannerCanvasShapes({ taskCards, categories, timeBoxes, positionsById })`
- `buildCategoryNodeShape(...)`
- `buildTaskCardShape(...)`
- `extractCanvasPositions(snapshot)`

### selectors.ts

- `deriveTaskCardStatus(taskCard, timeBoxes)`
- `deriveLinkedCount(taskCard)`
- `deriveCategoryTreeSummary(categories, taskCards)`
- `deriveWorkspaceColumns(plannerDay, plannerMeta)`

## DnD 리팩토링 방향

현재 DnD는 화면마다 payload를 제각각 해석한다.
리팩토링 후에는 아래 규칙을 지킨다.

1. payload는 `kind` discriminated union 하나로 고정한다.
2. 각 화면은 raw string payload를 만들지 말고 helper를 사용한다.
3. drop target도 별도 타입으로 관리한다.

예시:

```ts
type DropTarget =
  | { kind: 'TIMELINE_SLOT'; slotIndex: number }
  | { kind: 'CATEGORY_NODE'; categoryId: CategoryId | null }
  | { kind: 'CATEGORY_LIST'; categoryId: CategoryId | null }
  | { kind: 'BIG_THREE_SLOT'; slotIndex: number }
```

이 구조로 가면 `App.jsx`에 퍼진 drag end 분기를 크게 줄일 수 있다.

## 캔버스 설계 원칙

캔버스는 계속 projection 레이어로 유지한다.

캔버스가 저장해도 되는 것:

- shape 위치
- camera/session
- selection/UI state
- legacy board에서 자동 배치되었는지 여부

캔버스가 저장하면 안 되는 것:

- 카드 제목 자체
- 카테고리 이름 자체
- timeBox 완료 상태 자체

즉 원본은 항상 도메인 데이터이고,
캔버스는 원본을 시각 상태로 투영하는 구조를 유지한다.

## Unified Workspace 설계 원칙

장기적으로는 `BOARD / CANVAS / COMPOSER / TIMELINE`를 별도 화면으로 유지하기보다,
아래처럼 한 화면 안의 workspace로 합치는 방향을 권장한다.

```txt
| Brain Dump / Big 3 / Stack Rail | Planning Canvas | Time Grid / Composer |
```

이때 역할은 다음처럼 나눈다.

- 좌측 rail:
  - 카드 생성
  - Brain Dump
  - Big 3
  - category stack / inbox
- 중앙 canvas:
  - 자유 배치
  - category node / 관계 파악
  - 큰 맥락 설계
- 우측 rail:
  - 시간표
  - 일정 배치
  - 실제 timeBox 생성

중요:

- “통합 workspace”는 UI 통합을 의미한다.
- 도메인 저장 모델까지 한 덩어리로 섞는 것은 아니다.
- 즉 `canvas projection 원칙`은 그대로 유지한 채,
  좌우 rail과 중앙 canvas를 같은 화면 컨테이너로 묶는 방향이 맞다.

## 상태 구조 리팩토링 방향

### 현재 문제

`useDailyData.js`가 너무 많은 mutation 책임을 가진다.

### 목표

아래 중 하나로 옮긴다.

- 선택지 A. `useReducer` + pure domain commands
- 선택지 B. planner store custom hook + reducer

권장:

- 1차는 `useReducer` 기반

이유:

- 외부 상태 라이브러리 도입 없이 책임만 줄일 수 있다.
- 다른 스레드가 단계적으로 적용하기 쉽다.

## 권장 폴더 구조 초안

```txt
src/entities/planner/
  model/
    types.ts
    categoryTree.ts
    taskCards.ts
    timeBoxes.ts
    stackCanvasState.ts
    plannerReducer.ts
    plannerCommands.ts
    index.ts
  lib/
    storage.ts
    calendarViewData.ts
    timeSlot.ts

src/features/planner-dnd/
  lib/
    dragPayload.ts
    dropTarget.ts
    resolveDrop.ts
  hooks/
    usePlannerDnD.ts
```

주의:

- 기존 `lib/` 전부를 한 번에 없애지 않는다.
- 먼저 새 `model/`을 만들고, 구 파일은 점진적으로 흡수한다.

## 단계별 실행 계획

## Phase 0. 안전장치

### 목표

리팩토링 중 회귀를 빠르게 잡을 baseline을 만든다.

### 작업

- 현재 E2E가 green인지 확인
- `planning-board`, `planning-canvas`, `timebox-dnd`, `category-manager` 시나리오를 baseline으로 고정
- 신규 타입/도메인 유틸용 테스트 파일 위치를 미리 만든다

### 완료 기준

- 현행 동작을 재현하는 테스트 기준점이 존재한다

## Phase 1. storage boundary 분리

### 목표

persisted schema와 internal domain model 사이 경계를 먼저 고정한다.

### 작업

- `schema.js`
- `migrations.js`
- `adapters.js`
- `storage/index.js`
- 구 storage 로직 분해
- migration과 adapter 책임 분리

### 우선 파일

- `src/entities/planner/lib/storage.js` 또는 분해 후 `storage/`
- `src/entities/planner/lib/stackCanvasState.js`
- `src/entities/planner/lib/boardCard.js`

### 완료 기준

- persisted schema -> internal model 변환이 storage boundary에서만 일어남

## Phase 2. internal domain model 도입

### 목표

앱 내부에서 `brainDump`가 아니라 `taskCards` 같은 도메인 이름을 사용하기 시작한다.

### 작업

- `types.ts` 또는 동등한 모델 계약 정의
- `PlannerDay`, `PlannerMeta`, `TaskCard`, `Category`, `TimeBox` 내부 모델 고정
- selector / adapter에서 새 내부 이름 사용
- persisted field명은 계속 유지

### 우선 파일

- `src/entities/planner/model/types.ts`
- `src/entities/planner/lib/storage/*`
- `src/entities/planner/lib/boardCard.js`

### 완료 기준

- board/composer/canvas/timeline이 동일한 내부 도메인 계약을 본다

## Phase 3. 카테고리 트리 모델 도입

### 목표

flat category를 tree-capable model로 바꾸고 leaf-only 정책을 강제한다.

### 작업

- `Category`에 `parentId`, `order` 추가
- storage migration 추가
- 카테고리 CRUD를 tree-aware command로 교체
- 삭제 정책 `A` 구현
- task -> parent category direct attach 금지

### 완료 기준

- category create/update/delete/move가 트리 규칙과 leaf-only 정책을 만족함

## Phase 4. domain command 추출

### 목표

UI에서 array surgery와 validation을 제거한다.

### 작업

- `addTaskCard`
- `updateTaskCard`
- `moveTaskToCategory`
- `assignTaskToLeafCategory`
- `scheduleTaskCard`
- `moveTimeBox`
- `carryOverPendingTimeBoxes`
- `applyReschedulePlan`

위 동작을 순수 함수 또는 reducer action handler로 옮긴다.

### 우선 파일

- `src/app/hooks/useDailyData.js`
- `src/App.jsx`
- 신규 `src/entities/planner/model/plannerCommands.ts`
- 신규 `src/entities/planner/model/plannerReducer.ts`

### 완료 기준

- `App.jsx`는 orchestration만 하고 business rule을 거의 가지지 않음

## Phase 5. useDailyData 축소

### 목표

직접 mutation 중심 훅에서 reducer / command adapter 훅으로 역할을 줄인다.

### 작업

- 직접 `setData(prev => ...)` 로직 제거
- reducer action dispatch 또는 command wrapper로 이동
- selector 계산을 외부 도메인 계층으로 이동

### 완료 기준

- `useDailyData.js`는 persistence 연결과 action adapter 수준으로 축소됨

## Phase 6. DnD 계약 통합

### 목표

각 화면의 drag payload 해석을 공통 규칙으로 묶는다.

### 작업

- drag payload helper 생성
- drop target helper 생성
- board/composer/timeline drag end 분기 통합
- `active.data.current` shape 직접 참조 제거

### 우선 파일

- `src/App.jsx`
- `src/features/planning-board/ui/PlanningBoard.jsx`
- `src/features/schedule-composer/ui/ScheduleComposer.jsx`
- `src/features/brain-dump/ui/BrainDumpItem.jsx`
- `src/features/big-three/ui/BigThreeSlot.jsx`
- `src/features/timeline/ui/TimeBoxCard.jsx`

### 완료 기준

- drag source/target 추가 시 한 곳에서 타입과 규칙을 갱신할 수 있음

## Phase 7. Unified Workspace / 캔버스 projection 정리

### 목표

분리된 board/canvas/composer/timeline 화면을 하나의 큰 planner workspace 방향으로 재정렬한다.

### 작업

- 좌측 rail / 중앙 canvas / 우측 time grid 레이아웃 계약 정의
- `PlanningCanvas`는 editor lifecycle과 selection만 담당
- projection builder를 model 계층으로 이동
- inspector 저장은 command를 호출하게 변경
- screen-level 분기보다 workspace composition 우선으로 구조 조정

### 우선 파일

- `src/features/planning-canvas/ui/PlanningCanvas.jsx`
- `src/features/planning-board/ui/PlanningBoard.jsx`
- `src/features/schedule-composer/ui/ScheduleComposer.jsx`
- `src/features/timeline/ui/index.jsx`
- 신규 `src/entities/planner/model/canvasProjection.ts`

### 완료 기준

- 사용자는 한 화면 안에서 카드 생성 -> 분류 -> 스케줄 배치 흐름을 이어갈 수 있음
- canvas는 projection/view state 원칙을 유지함

## Phase 8. App 컨테이너 슬림화

### 목표

`App.jsx`를 feature orchestration 수준으로 줄인다.

### 작업

- modal open/close
- view mode
- toast orchestration
- high-level action wiring

만 남기고, 나머지 계산/validation은 바깥으로 이동한다.

### 완료 기준

- `App.jsx`가 현재보다 크게 줄고 읽기 쉬워짐

## Phase 9. TypeScript 확대

### 목표

안정화된 경계 위에 TS를 단계적으로 올린다.

### 작업

- model / storage adapter / command부터 `.ts` 전환
- canvas shape props / DnD payload union / selector 반환 타입 고정
- UI는 나중에 따라온다

### 완료 기준

- 타입은 구조를 고정하는 역할을 하고, 구조 문제를 가리는 역할을 하지 않음

## 파일별 작업 목록

### `src/entities/planner/lib/storage.js` 또는 `storage/`

- migration 단일 진입점 유지
- adapter 분리
- category tree 필드 추가
- `brainDump` <-> `taskCards` 매핑 제공
- normalization 로직 중복 제거

### `src/app/hooks/useDailyData.js`

- state mutation 중심 파일에서 reducer adapter 파일로 역할 축소
- 직접 `setData(prev => ...)` 하는 로직을 commands 호출 형태로 이동

### `src/app/hooks/useCategoryMeta.js`

- flat CRUD에서 tree-aware command 호출로 변경
- parent assignment, move, delete guard 추가

### `src/features/category/ui/CategoryManagerModal.jsx`

- flat list 편집기에서 tree manager로 전환
- parent 선택 UI
- sibling reorder UI
- child 존재 시 delete guard UI

### `src/entities/planner/lib/boardCard.js`

- task card normalization / grouping / linking 전용 유틸로 역할 축소
- tree category 대응

### `src/features/planning-board/ui/PlanningBoard.jsx`

- lane state 계산을 domain selector 기반으로 변경
- 직접 reorder array를 만지기보다 command 호출

### `src/features/schedule-composer/ui/ScheduleComposer.jsx`

- `taskId -> timeBox` 생성 규칙을 command로 위임

### `src/features/planning-canvas/ui/PlanningCanvas.jsx`

- projection builder를 model 계층으로 이동
- `PlanningCanvas`는 editor lifecycle과 selection만 유지
- inspector 저장은 command를 호출하게 변경

### `src/App.jsx`

- drag/drop branching 최소화
- orchestration-only container로 축소

## 추천 구현 순서

다른 스레드는 아래 순서로 진행하는 것이 가장 안전하다.

1. storage boundary 분리
2. internal domain model 도입
3. category tree 유틸 + leaf-only 정책 고정
4. task/timeBox command 추가
5. `useDailyData` reducer화/축소
6. category manager tree UI 적용
7. DnD payload 통합
8. unified workspace / canvas projection 정리
9. `App.jsx` 슬림화
10. 마지막에 TypeScript 확대

## 테스트 계획

## 유틸 테스트

반드시 추가할 것:

- `isDescendant`
- `isLeafCategory`
- `canAssignTaskToCategory`
- `canMoveCategory`
- `moveCategory`
- `removeCategory` delete policy
- `moveTaskToCategory`
- `scheduleTaskCard`
- `moveTimeBox`
- `carryOverPendingTimeBoxes`
- `syncTaskLinksWithTimeBoxes`

## E2E 유지 대상

기존 아래 시나리오는 계속 살아 있어야 한다.

- `e2e/planning-board.spec.js`
- `e2e/planning-canvas.spec.js`
- `e2e/timebox-dnd.spec.js`
- `e2e/category-manager.spec.js`

## 새 E2E 추가 대상

### category tree

- 부모 카테고리 생성
- 자식 카테고리 생성
- 자식 카테고리를 다른 부모로 이동
- 자기 자손 아래로 이동 시도 차단
- 자식이 있는 카테고리 삭제 차단

### board / composer / timeline

- task를 자식 카테고리로 옮긴 후 board에 정상 표시
- composer에 category path가 깨지지 않고 노출
- schedule 후 timeBox와 task link 유지

### canvas

- 트리 카테고리 상태에서 canvas 자동 배치
- inspector 수정 후 storage 반영
- reload 후 snapshot과 도메인 데이터 모두 유효

## 수동 확인 체크리스트

- reload 후 category tree 유지
- reload 후 task -> category 연결 유지
- reload 후 canvas snapshot 유지
- timeBox drag 후 linkedTimeBoxIds 유지
- category 삭제 시 고아 task가 예상대로 처리되는지 확인

## 다른 스레드용 작업 원칙

1. 한 PR에 한 Phase만 다룬다.
2. storage migration과 UI 대개편을 한 번에 하지 않는다.
3. 기존 E2E를 먼저 통과시킨 후 새 시나리오를 추가한다.
4. `App.jsx`를 마지막에 줄인다. 초반에 무리해서 옮기지 않는다.
5. 캔버스는 projection이라는 원칙을 깨지 않는다.
6. unified workspace를 지향하되, 좌우 rail까지 tldraw shape로 넣지는 않는다.

## 구현 시 주의사항

### 1. persisted data 호환성

이미 localStorage / Docker persistence / import-export가 있으므로
schema migration 누락 시 기존 데이터가 쉽게 깨질 수 있다.

### 2. category path와 categoryId를 혼동하지 말 것

UI에 path가 보여도 실제 참조키는 단일 `categoryId` 하나로 유지하는 편이 안전하다.

### 3. tree UI와 tree model을 동시에 만들지 말 것

먼저 model과 command를 만든 뒤 UI를 얹는다.
순서를 거꾸로 하면 drag/drop 예외 처리가 JSX에 쌓인다.

### 4. `brainDump` 이름을 즉시 없애지 말 것

앱 내부 alias는 바꿔도 persisted schema와 import/export 계약은 신중히 바꿔야 한다.

## 최종 완료 기준

아래가 되면 이 리팩토링은 성공으로 본다.

1. category가 parent/child 구조를 가진다.
2. task card는 어떤 category에 속해도 board/composer/canvas/timeline에서 일관되게 보인다.
3. DnD payload와 drop target이 타입으로 고정된다.
4. `App.jsx`와 `useDailyData.js`의 책임이 현재보다 작아진다.
5. 기존 E2E + 신규 tree E2E가 통과한다.

## 권장 첫 PR 범위

첫 PR은 아래까지만 하는 것을 권장한다.

- storage migration / adapter 분리
- category tree model 유틸 추가
- leaf-only 정책 문서화 및 guard 함수 추가
- category meta CRUD를 tree-capable 하게 변경

즉, 첫 PR에서 canvas / board / timeline DnD까지 같이 건드리지 않는다.

이후 PR에서:

- task commands
- DnD 통합
- unified workspace / canvas projection 정리
- 마지막에 TS 확대

순으로 간다.
