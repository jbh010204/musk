export const PATCH_NOTES = [
  {
    version: 'v0.22.5',
    date: '2026-03-12',
    title: 'Workspace polish: glowing dock states + roomier timeline rail',
    summary:
      '카드가 쌓인 Category Dock이 카테고리 색 기반 gradient glow로 먼저 드러나도록 하고, 우측 Timeline Rail도 조금 더 넓고 크게 보여 읽기 밀도를 높였습니다.',
    focus: [
      '도크 노드의 시각 상태를 별도 presentation helper로 분리해 카드 존재/활성/드롭 가능 상태를 같은 토큰 계층에서 표현',
      'Timeline Rail의 폭, 라벨 폭, 슬롯 높이, 블록 inset을 workspace layout token으로 묶어 유지보수 시 한 번에 조정 가능하게 정리',
      '워크스페이스 설명 문구와 문서를 현재 dock glow + roomier rail 계약에 맞춰 동기화',
    ],
    improvements: [
      '`categoryNodePresentation.js`, `CategoryNode.jsx`, `PlanningCanvas.jsx`를 수정해 카드가 있는 도크가 그라데이션 glow로 보이고 active/armed 상태가 더 분명하게 드러나도록 조정',
      '`workspaceLayout.js`, `ComposerTimeGrid.jsx`, `ScheduleComposer.jsx`, `PlannerWorkspace.jsx`를 수정해 우측 rail 치수를 토큰화하고 슬롯/블록 배치를 더 넓게 재조정',
      '`README.md`, `STACK_CANVAS_PIVOT_PLAN.md`, `TASK_EXECUTION_BOARD.md`를 현재 시각 계약에 맞춰 갱신',
    ],
    validation: [
      'lint/build 통과',
      'planner-workspace 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.22.4',
    date: '2026-03-12',
    title: 'Workspace declutter: Category Dock + click-first rail',
    summary:
      '워크스페이스의 정보량을 줄이고, 세로 카테고리 나열 대신 상단 Category Dock과 Inbox/Active Stack 구조로 바꿨습니다. 우측 rail도 drag보다 슬롯 클릭을 기본 경로로 재정렬했습니다.',
    focus: [
      'Big3 full rail을 상단 compact focus strip로 축소하고, WORKSPACE 모드에서는 외부 사이드바를 접어 메인 폭을 확보',
      'Stack Canvas는 상단 도크에서 바로 분류하고 본문은 Inbox와 현재 활성 카테고리 한 스택만 보여주도록 단순화',
      'Timeline Rail은 선택 후 슬롯 클릭을 기본 상호작용으로 명확히 하고, workspace 회귀 테스트도 그 계약으로 갱신',
    ],
    improvements: [
      '`PlanningCanvas.jsx`, `CategoryNode.jsx`, `CategoryStackLane.jsx`를 수정해 horizontal category dock + active lane 레이아웃으로 전환',
      '`PlannerWorkspace.jsx`, `WorkspaceBigThreeRail.jsx`, `App.jsx`를 수정해 Big3 strip 상단 배치와 외부 rail 축소를 적용',
      '`ScheduleComposer.jsx`, `planner-workspace.spec.js`, `README.md`를 현재 클릭 우선 워크플로에 맞춰 정리',
    ],
    validation: [
      'lint/build 통과',
      'planner-workspace 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.22.3',
    date: '2026-03-12',
    title: 'Workspace Big3 rail: 캔버스 정리 -> Big3 확정 -> 타임라인 배치',
    summary:
      '워크스페이스 안에 Big3 rail을 편입해 선택 카드 올리기, Big3 슬롯 선택, 우측 timeline rail 배치까지 한 화면에서 닫히도록 정리했습니다.',
    focus: [
      '`stackCanvasState`에 `selectedBigThreeId`를 추가해 카드 선택과 Big3 선택을 같은 workspace 상태 계층에서 관리',
      '선택한 캔버스 카드를 Big3로 올리고, Big3 슬롯을 누르면 source card 또는 직접 입력 항목이 우측 rail 배치 대상으로 전환',
      '워크스페이스 모드에서는 기존 좌측 Big3 섹션을 숨겨 중복 UI를 줄이고, 메인 영역의 좌 Big3 / 중 캔버스 / 우 타임라인 흐름을 강조',
    ],
    improvements: [
      '`WorkspaceBigThreeRail.jsx`를 추가하고 `PlannerWorkspace.jsx`가 Big3 rail, canvas, composer를 3열 조합으로 묶도록 변경',
      '`useDailyData.js`에 `sendManyToBigThree()`를 추가해 다중 선택 카드의 Big3 편입을 한 액션으로 처리',
      '`ScheduleComposer.jsx`, `Timeline/index.jsx`에 Big3 슬롯 직접 배치 경로를 추가하고 `planner-workspace.spec.js`에 one-screen 회귀를 고정',
    ],
    validation: [
      'lint/build 통과',
      'planner-workspace 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.22.2',
    date: '2026-03-12',
    title: 'Workspace bulk scheduling: 캔버스 카드 다중 선택 + 연속 배치',
    summary:
      '워크스페이스의 Stack Canvas에서 여러 카드를 고른 뒤 우측 timeline rail 슬롯을 한 번 눌러 선택 순서대로 연속 배치할 수 있게 했습니다.',
    focus: [
      '`stackCanvasState`에 `selectedCardIds`를 추가해 단일 선택과 다중 선택을 같은 상태 계층에서 관리',
      '카테고리 노드 클릭은 다중 선택 카드 전체를 같은 lane으로 옮기고, 우측 rail은 선택된 카드들을 contiguous block으로 원자적으로 배치',
      '벌크 배치 성공 후 선택 상태를 비우고 `예정 N` badge와 timeBox 생성 결과가 함께 동기화되도록 고정',
    ],
    improvements: [
      '`BoardCard.jsx`, `CategoryStackLane.jsx`, `PlanningCanvas.jsx`에 다중 선택 토글과 선택 요약 UI를 추가',
      '`PlannerWorkspace.jsx`, `ScheduleComposer.jsx`, `Timeline/index.jsx`에 선택 배열 전달과 연속 배치 로직을 연결',
      '`planner-workspace.spec.js`에 다중 선택 -> 슬롯 클릭 -> 연속 timeBox 생성 회귀를 추가',
    ],
    validation: [
      'lint/build 통과',
      'planner-workspace 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.22.1',
    date: '2026-03-12',
    title: 'Workspace preference: 마지막 일정 보기 복원',
    summary:
      '타임라인 상단 보기 모드가 새로고침 후에도 유지되도록 저장하고, 계획 카드만 있고 timeBox가 없는 날은 첫 진입을 `WORKSPACE`로 시작하도록 기본 진입 정책을 조정했습니다.',
    focus: [
      '사용자가 고른 `WORKSPACE/CANVAS/COMPOSER/DAY/WEEK/MONTH` 뷰를 localStorage와 snapshot export 경로에 같이 저장',
      '기존처럼 무조건 `DAY`로 시작하지 않고, 일정이 아직 배치되지 않은 planning day는 `WORKSPACE`를 우선 진입점으로 사용',
      'planner-workspace E2E에 기본 워크스페이스 진입과 마지막 보기 복원 회귀를 추가',
    ],
    improvements: [
      '`storage/index.js`에 `lastViewMode` load/save 경로를 추가하고 snapshot export/import에 포함',
      '`Timeline/index.jsx`가 persisted view를 복원하고, persisted 값이 없을 때는 `brainDump 있음 + timeBox 없음` 조건에서 `WORKSPACE`를 기본으로 선택',
      '`planner-workspace.spec.js`가 workspace 기본 진입과 week view 복원 시나리오를 검증',
    ],
    validation: [
      'lint/build 통과',
      'E2E 전체 회귀 통과 (57 passed)',
    ],
  },
  {
    version: 'v0.22.0',
    date: '2026-03-12',
    title: 'Storage cleanup: boardCanvas -> stackCanvasState',
    summary:
      '캔버스 상태 필드명을 현재 역할에 맞춰 `stackCanvasState`로 정리하고, 기존 `boardCanvas` 로컬 저장 데이터는 로드 시 자동으로 새 스키마로 승격되도록 맞췄습니다.',
    focus: [
      '내부 모델, hook 액션, workspace/canvas prop 이름을 `stackCanvasState` 기준으로 통일',
      '기존 localStorage에 남아 있는 `boardCanvas`는 migration에서 읽고, 재저장 시 새 필드명으로만 기록',
      'planning-canvas E2E에 legacy `boardCanvas` -> `stackCanvasState` 승격 회귀를 추가',
    ],
    improvements: [
      '`stackCanvasState.js`, storage adapter/migration, `useDailyData.js`, `App.jsx`, `Timeline/index.jsx`가 새 필드명을 기준으로 동작하도록 정리',
      '`planning-canvas.spec.js`에 legacy key를 seed한 뒤 reload 후 새 key로 저장되는 시나리오를 추가',
      '`README.md`, `CATEGORY_TREE_TS_REFACTOR_PLAN.md`, `TASK_EXECUTION_BOARD.md`에서 현재 계약 명칭을 새 이름으로 동기화',
    ],
    validation: [
      'lint/build 통과',
      'planning-canvas 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.21.9',
    date: '2026-03-12',
    title: 'Workspace direct scheduling: 캔버스 카드 -> Timeline Rail 직접 드래그',
    summary:
      '워크스페이스에서 캔버스 카드를 먼저 선택한 뒤 슬롯을 누르는 경로 외에, 카드 자체의 `일정` 핸들을 timeline rail 슬롯으로 직접 끌어다 놓아 배치하는 빠른 경로를 추가했습니다.',
    focus: [
      '카테고리 스택 내부의 기존 dnd-kit 재정렬 흐름은 유지하면서, 일정 배치 전용 native drag 경로를 따로 분리',
      'Timeline Rail 슬롯은 native drag hover/drop도 받아 캔버스 카드가 바로 timeBox로 생성되도록 확장',
      '배치 성공 후 `linkedTimeBoxIds` badge가 즉시 `예정 N`으로 갱신되는 회귀를 planner-workspace E2E로 고정',
    ],
    improvements: [
      '`BoardCard.jsx`에 일정 배치 전용 `일정` drag handle을 추가하고 `PlanningCanvas`, `CategoryStackLane`, `PlannerWorkspace`를 통해 workspace 전체로 연결',
      '`ComposerTimeGrid.jsx`, `ScheduleComposer.jsx`에 native drag hover/drop 상태를 추가해 slot highlight와 생성 경로를 분리',
      '`planner-workspace.spec.js`에 캔버스 카드 직접 드래그 -> timeline rail drop -> 예정 배지 갱신 시나리오를 추가',
    ],
    validation: [
      'lint/build 통과',
      'planner-workspace 타깃 E2E 통과',
      'E2E 전체 회귀 통과 (56 passed)',
    ],
  },
  {
    version: 'v0.21.8',
    date: '2026-03-11',
    title: 'Canvas simplification: BOARD view 제거',
    summary:
      '중복되던 BOARD 화면을 내리고 캔버스를 카드 생성/분류의 단일 정리 화면으로 승격했습니다. 이제 편성기와 워크스페이스도 모두 같은 캔버스 계약을 기준으로 동작합니다.',
    focus: [
      '타임라인 상단 view mode에서 BOARD를 제거하고, CANVAS를 카드 생성/카테고리 스택 정리의 기본 화면으로 고정',
      '편성기의 복귀 액션도 이제 캔버스로 돌아가도록 바꿔 화면 간 책임을 단순화',
      '중복되던 planning-board 전용 E2E를 제거하고 planning-canvas / planner-workspace 회귀로 contract를 재정렬',
    ],
    improvements: [
      '`Timeline/index.jsx`에서 BOARD view 분기를 제거하고 CANVAS 안내 문구를 현재 stack-canvas 흐름 기준으로 정리',
      '`ScheduleComposer.jsx`의 문구와 복귀 액션을 캔버스 기준으로 조정',
      '`planning-board.spec.js`를 제거하고 `schedule-composer.spec.js`, `planning-canvas.spec.js`가 새 navigation contract를 검증',
    ],
    validation: [
      'lint/build 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.21.7',
    date: '2026-03-11',
    title: 'Canvas pivot: tldraw 제거 후 Stack Canvas로 전환(P1~P6)',
    summary:
      '자유 화이트보드 엔진이 플래너 UX와 맞지 않는다는 판단에 따라 tldraw 기반 Planning Canvas를 중단하고, 카드 생성/카테고리 스택 이동에 집중한 custom Stack Canvas와 우측 Timeline Rail 구조로 전환했습니다.',
    focus: [
      '캔버스 안에서는 카드 생성, 선택, 카테고리 스택 이동만 담당하고, 시간표 배치는 우측 Timeline Rail에서 계속 처리',
      '`stackCanvasState` persisted 상태는 이제 `selectedCardId`, `focusedLaneId` 같은 lightweight UI state만 저장하고 tldraw snapshot은 더 이상 쓰지 않음',
      '워크스페이스도 `Stack Canvas + Timeline Rail` 2열 흐름으로 단순화해 실제 작업 경로를 줄임',
    ],
    improvements: [
      '`PlanningCanvas.jsx`를 custom Stack Canvas로 재구성하고 `BoardCardEditorModal`, `CategoryStackLane`을 재사용해 카드 생성/분류를 canvas 안으로 이동',
      '`ScheduleComposer.jsx`에 `hideQueue`, 외부 선택 카드 입력을 추가해 workspace에서 canvas 선택 카드만 바로 일정으로 배치할 수 있게 조정',
      '`stackCanvasState.js`를 lightweight UI state normalize 계층으로 교체하고 `docs/STACK_CANVAS_PIVOT_PLAN.md`를 추가',
      '`CanvasInspector.jsx`, `plannerCanvasShapes.jsx`, `docs/TLDRAW_CANVAS_ARCHITECTURE.md`를 제거하고 `tldraw` dependency를 uninstall',
      '`planning-canvas.spec.js`, `planner-workspace.spec.js`를 stack canvas 흐름 기준으로 갱신',
    ],
    validation: [
      'lint/build 통과',
      'planning-canvas, planner-workspace 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.21.6',
    date: '2026-03-11',
    title: 'Planner refactor 3차: unified workspace composition(R5)',
    summary:
      '분리되어 있던 Planning Board, Planning Canvas, Schedule Composer를 하나의 워크스페이스 화면으로 다시 조합해 카드 생성/분류/배치를 같은 메인 영역에서 연속적으로 처리할 수 있게 정리했습니다.',
    focus: [
      '새 `WORKSPACE` view를 추가해 보드, 캔버스, 편성기를 각각 별도 화면으로 왕복하지 않고 한 화면에서 나란히 볼 수 있게 구성',
      'PlanningBoard, PlanningCanvas, ScheduleComposer에 embedded 모드를 도입해 같은 데이터 계약을 유지하면서 워크스페이스용 밀도와 액션 계층만 별도로 다듬음',
      '워크스페이스 안에서도 보드 카드 배치가 실제 timeBox 생성과 linked badge 동기화까지 그대로 이어지도록 기존 composer 경로를 재사용',
    ],
    improvements: [
      '`src/features/planner-workspace/ui/PlannerWorkspace.jsx`를 추가해 좌측 정리 영역, 중앙 canvas, 우측 time grid를 한 레이아웃으로 묶음',
      '`Timeline/index.jsx`에 `WORKSPACE` view mode와 조합 렌더 분기를 추가하고 기존 DAY/BOARD/CANVAS/COMPOSER view는 fallback으로 유지',
      '`PlanningBoard.jsx`, `BoardToolbar.jsx`, `PlanningCanvas.jsx`, `ScheduleComposer.jsx`에 embedded prop을 추가해 workspace 안에서도 과밀하지 않게 동작하도록 조정',
      '`planner-workspace.spec.js`를 추가해 unified workspace에서 board/canvas/composer가 함께 렌더되고 배치까지 이어지는 회귀를 고정',
    ],
    validation: [
      'lint/build 통과',
      'planner-workspace 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.21.5',
    date: '2026-03-11',
    title: 'Planner refactor 2차: category tree model + leaf-only guard(R4)',
    summary:
      '카테고리 메타를 flat list에서 tree-capable model로 올리고, parent/child 이동 규칙과 leaf-only 선택 guard를 category manager, board/canvas/timebox/template 선택 UI까지 반영했습니다.',
    focus: [
      'category meta에 `parentId`, `order`를 정규화하고 parent-child 트리, path label, leaf 판정을 model 계층으로 이동',
      '카테고리 관리 모달에서 부모 선택, 하위 카테고리 삭제 차단, 현재 사용 중인 카테고리의 parent 잠금 흐름을 추가',
      'task/timebox/template/category 선택 UI는 이제 leaf category만 선택지로 노출하고 경로 라벨을 함께 보여줌',
    ],
    improvements: [
      '`src/entities/planner/model/categoryTree.js`를 추가해 tree normalize/build/move/assign/delete guard 유틸을 도입',
      '`storage/migrations.js`가 persisted meta categories를 `parentId`, `order`를 포함한 최신 카테고리 레코드로 보정하도록 확장',
      '`useCategoryMeta.js`를 tree-aware CRUD 훅으로 바꾸고 `App.jsx`에서 category view model과 parent lock 정책을 조합해 manager에 전달',
      '`CategoryManagerModal.jsx`, `BoardCardEditorModal.jsx`, `CanvasInspector.jsx`, `CompletionModal.jsx`, `QuickAddModal.jsx`, `TemplateManagerModal.jsx`에서 leaf-only 옵션과 path label을 반영',
      '`category-manager.spec.js`에 parent-child 생성과 parent delete guard 회귀를 추가',
    ],
    validation: [
      'lint/build 통과',
      'category-manager 타깃 E2E 통과',
    ],
  },
  {
    version: 'v0.21.4',
    date: '2026-03-11',
    title: 'Planner refactor 1차: storage boundary + task card model(R1~R3)',
    summary:
      '리팩토링 문서에 맞춰 persisted storage 경계를 `schema/migrations/adapters`로 분리하고, task card 관련 생성/수정/복원/링크 동기화 규칙을 별도 model helper로 추출해 `useDailyData`의 직접 normalize 책임을 줄였습니다.',
    focus: [
      '기존 `loadDay/saveDay/loadMeta/saveMeta` API는 유지하면서 내부 책임만 `storage/index.js`에서 `schema`, `migrations`, `adapters`로 분리',
      'task card 생성/업데이트/복원/보드 레이아웃 적용/링크 동기화를 `model/taskCards.js`로 올려 hook이 raw array surgery를 덜 하도록 정리',
      'card status 파생 로직을 `model/selectors.js`로 분리하고 canvas projection에서도 같은 selector를 재사용',
    ],
    improvements: [
      '`src/entities/planner/lib/storage/`에 `schema.js`, `migrations.js`, `adapters.js`, `index.js`를 추가하고 기존 `storage.js`는 호환용 re-export 레이어로 축소',
      '`src/entities/planner/model/taskCards.js`, `src/entities/planner/model/selectors.js`를 추가해 task card command/selector 기반의 초기 internal model 계층을 도입',
      '`useDailyData.js`에서 brainDump add/update/remove/restore/layout/category clear 흐름을 새 task card helper 호출로 치환',
      '`CATEGORY_TREE_TS_REFACTOR_PLAN.md`, `TASK_EXECUTION_BOARD.md`에 R1~R5 세부 실행 태스크를 문서화',
    ],
    validation: [
      'lint/build 통과',
      'planning-board, planning-canvas 포함 E2E 회귀 통과',
    ],
  },
  {
    version: 'v0.21.3',
    date: '2026-03-11',
    title: 'Planning Canvas custom shape + inspector 연결(T87~T90)',
    summary:
      'CANVAS 뷰를 shell 수준에서 멈추지 않고, 카테고리 노드와 보드 카드를 custom shape로 바꾼 뒤 우측 inspector에서 원본 brain dump 카드를 직접 수정할 수 있도록 연결했습니다.',
    focus: [
      '카테고리 원형 노드와 일정 카드를 tldraw custom shape로 정의해 lane stack seed보다 도메인 의미가 더 직접 드러나게 정리',
      '카드 shape는 제목, 카테고리, 예상 길이, 배치 수, 메모, 상태를 brainDump/timeBoxes projection으로 그려 source of truth를 유지',
      '우측 inspector에서 선택된 카드의 제목/예상 길이/카테고리/메모를 저장하면 곧바로 원본 brainDump와 canvas snapshot이 함께 갱신',
    ],
    improvements: [
      '`plannerCanvasShapes.jsx`를 추가해 `planner-category-node`, `planner-task-card` custom shape와 selection bridge를 도입',
      '`stackCanvasState.js`에서 stable shape id, custom shape projection, 카드 상태 파생(`TODO/SCHEDULED/PARTIAL/COMPLETED/SKIPPED`)을 담당하도록 확장',
      '`PlanningCanvas.jsx`에 projection sync, legacy shell snapshot 보정, 우측 inspector 레이아웃, card update 연결을 추가',
      '`CanvasInspector.jsx`를 신설하고 `planning-canvas.spec.js`를 확장해 snapshot 저장 + inspector 편집 회귀를 함께 고정',
    ],
    validation: [
      'lint/build 통과',
      'planning-canvas 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.21.2',
    date: '2026-03-11',
    title: 'tldraw Planning Canvas shell 도입(T84~T86)',
    summary:
      'Planning Board를 그대로 대체하기 전에, tldraw 기반 무한 캔버스를 별도 CANVAS 뷰로 병행 도입하고 날짜별 snapshot 저장/복원과 초기 auto-layout migration까지 먼저 연결했습니다.',
    focus: [
      'source of truth는 계속 brainDump에 두고, 캔버스는 위치/카메라/session 같은 시각 상태만 `stackCanvasState` snapshot으로 저장',
      '기존 보드 카드가 있는 날짜는 첫 진입 시 카테고리 노드와 카드 shape를 자동 배치해 빈 캔버스가 아니라 현재 상태를 즉시 투영',
      'tldraw 기본 UI는 숨기고 planner toolbar만 남겨 플래너 흐름에 맞는 shell을 우선 고정',
    ],
    improvements: [
      '`tldraw@4.4.1`을 exact version으로 고정하고 `docs/TLDRAW_CANVAS_ARCHITECTURE.md`에 버전 정책, 저장 구조, 제외 범위를 문서화',
      '`storage.js`, `useDailyData.js`에 `stackCanvasState` 스키마와 normalize/update 경로를 추가해 export/import 및 날짜별 persistence와 같은 계층으로 통합',
      '`PlanningCanvas.jsx`를 신설해 CANVAS view 진입, snapshot debounce 저장, 자동 배치, 보드/카테고리/편성기 전환 액션을 연결',
      '`planning-canvas.spec.js`로 첫 진입 auto-layout 후 legacy canvas snapshot 필드가 localStorage에 저장되는지 회귀를 추가',
    ],
    validation: [
      'lint/build 통과',
      'planning-canvas 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.21.1',
    date: '2026-03-11',
    title: 'Schedule Composer 실배치 + 보드 카드 링크 동기화(T77~T80)',
    summary:
      'Planning Board 1차 MVP 위에 실제 편성기를 붙여, 보드 카드를 30분 시간표 슬롯에 끼워 넣으면 곧바로 일간 타임라인의 timeBox가 생성되고 카드 쪽 `linkedTimeBoxIds` badge도 함께 맞춰지도록 연결했습니다.',
    focus: [
      '편성기는 이제 placeholder가 아니라 좌측 카드 큐와 우측 30분 시간표 그리드로 동작하며, 카드 선택 후 슬롯 클릭 또는 드래그로 바로 배치 가능',
      '`sourceId = boardCard.id`와 `categoryId`를 그대로 timeBox에 내려 보내 보드 카드와 실제 일정이 같은 원본을 공유',
      'timeBox 생성/수정/삭제/복원 시마다 `linkedTimeBoxIds`를 자동 재계산해 보드/편성기 badge가 즉시 일관되게 바뀌도록 고정',
    ],
    improvements: [
      '`ScheduleComposer.jsx`, `ComposerQueueCard.jsx`, `ComposerTimeGrid.jsx`를 추가해 카드 큐/시간표/배치된 블록 미리보기를 구현',
      '`Timeline/index.jsx`에 composer 전용 schedule callback을 추가하고 보드 카드의 예상 길이(`estimatedSlots`)를 실제 배치 길이로 사용',
      '`boardCard.js`, `storage.js`, `useDailyData.js`에서 `syncBoardCardsWithTimeBoxes`를 중심으로 current day와 reload 경로 모두 동일한 링크 계산을 쓰도록 정리',
      '`schedule-composer.spec.js`로 카드 배치 -> 보드 badge 반영 -> 삭제 후 badge 복구까지 회귀를 추가',
    ],
    validation: [
      'lint/build 통과',
      'schedule-composer 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.21.0',
    date: '2026-03-11',
    title: 'Planning Board 1차 MVP 도입(T71~T76)',
    summary:
      '브레인 덤프를 리스트만으로 다루지 않고, Excalidraw처럼 느껴지는 카테고리 스택 보드에서 카드 생성/수정/이동을 먼저 정리한 뒤 나중에 편성기로 넘기는 2단 플로우를 깔았습니다.',
    focus: [
      'brainDump에 categoryId, stackOrder, estimatedSlots, linkedTimeBoxIds, note, createdFrom을 추가해 보드용 데이터 계약을 확장',
      'BOARD / COMPOSER 뷰 모드를 타임라인 상단에 추가하고, Planning Board는 별도 nested DnD context로 분리',
      '카테고리 원형 노드는 anchor이고 실제 카드는 아래 stack lane에 쌓이는 구조로, 자유 캔버스처럼 보이되 저장은 구조화된 lane 기반으로 유지',
    ],
    improvements: [
      '`PLANNING_BOARD_MVP.md`에 보드/편성기/타임라인 책임, 데이터 계약, 제외 범위를 명시',
      '`storage.js`, `useDailyData.js`, `App.jsx`에서 brainDump raw order 보존 + 보드용 액션(add/update/layout/category clear) 추가',
      '`PlanningBoard` feature를 신설해 카드 생성/수정 모달, 카테고리 노드, stack lane, 카드 드래그/재정렬을 구현',
      '`ScheduleComposer` placeholder를 추가해 이후 time-grid 배치 작업의 진입점을 고정',
      '`planning-board.spec.js`로 카드 생성 persistence와 카테고리 노드 드롭 회귀를 추가',
    ],
    validation: [
      'lint/build 통과',
      'planning-board E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.7',
    date: '2026-03-10',
    title: '월간 캘린더 overview-first 리팩토링(T68~T70)',
    summary:
      '월간 셀 하나에 개요와 상세가 함께 섞여 목적이 흐리던 문제를 줄이기 위해, 셀은 날짜 선택용 개요 카드로 단순화하고 세부 읽기는 우측 상세 시트가 전담하도록 정리했습니다.',
    focus: [
      '월간 셀은 이제 날짜, 일정 수, 핵심 상태, 완료 정도만 남기고 일정 제목/계획 시간/카테고리 mix bar는 제거',
      '상세 시트는 주요 카테고리와 일정 목록을 더 풍부하게 받아 월간 선택 이후의 읽기 흐름을 맡음',
      '월간 뷰의 1차 목적을 `한 달 스캔 -> 날짜 선택 -> 상세 확인`으로 명확히 고정',
    ],
    improvements: [
      '`MonthlyCalendarView.jsx`에서 셀 정보를 overview 중심으로 압축하고 empty day 반복 텍스트를 줄여 시각적 소음을 축소',
      '`MonthDayDetailSheet.jsx`에 밀도 배지와 주요 카테고리 요약을 추가해 셀에서 제거한 정보를 상세 시트로 재배치',
      '`monthly-calendar-view.spec.js`, `calendar-quick-add.spec.js`를 overview-first 계약에 맞게 갱신',
    ],
    validation: [
      'lint/build 통과',
      'monthly-calendar-view, monthly-calendar-heatmap, calendar-quick-add 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.6',
    date: '2026-03-10',
    title: '월간 캘린더 날짜 상세 시트 추가(T63~T67)',
    summary:
      '월간 캘린더에서 날짜를 누르면 곧바로 일간 뷰로 튀지 않고, 월간 맥락을 유지한 채 오른쪽 상세 시트에서 그날의 일정과 요약을 먼저 확인할 수 있게 바꿨습니다.',
    focus: [
      '데스크톱에서는 월간 캘린더 옆 고정 상세 시트로, 좁은 폭에서는 아래로 자연스럽게 이어지는 상세 카드로 동작',
      '월간 셀은 이제 선택 상태를 유지하고, 상세 시트에서만 `이 날짜 열기`로 일간 편집 화면으로 진입',
      '상세 시트 안에서 일정 목록, 완료율, 대표 카테고리, 빠른 추가까지 바로 확인하도록 월간 탐색 흐름을 보강',
    ],
    improvements: [
      '`calendarViewData.js` month snapshot에 detailItems를 추가해 월간 상세 시트가 별도 재조회 없이 바로 일정을 렌더링하도록 확장',
      '`MonthlyCalendarView.jsx`에 날짜 선택 상태와 강조 ring을 추가하고, 클릭/키보드 동작을 `상세 시트 열기`로 변경',
      '`MonthDayDetailSheet.jsx`를 새로 추가해 날짜 요약, 일정 목록, 빠른 추가, 일간 뷰 이동 액션을 한 곳에 묶음',
      '`Timeline/index.jsx`에서 월간 레이아웃을 `캘린더 + 상세 시트` 2열 구조로 재구성하고 모바일에서는 단일 컬럼으로 자연스럽게 접히게 조정',
      '`monthly-calendar-view.spec.js`, `calendar-quick-add.spec.js`를 월간 상세 시트 기준으로 갱신',
    ],
    validation: [
      'lint/build 통과',
      'monthly-calendar-view, monthly-calendar-heatmap, calendar-quick-add 타깃 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.5',
    date: '2026-03-09',
    title: '타임박스 중앙 정렬 유지 + 좌측 기준선 통일(T62)',
    summary:
      '중앙에 묶인 content group은 유지하되, 태그/제목/시간 요소를 카드 안에서 같은 왼쪽 기준선으로 읽히게 정리하고 완료 상태의 `차이 N분`을 시간 줄로 흡수해 텍스트 잘림을 줄였습니다.',
    focus: [
      '수직 중앙 정렬은 유지하면서 stack 내부는 `items-start`와 `text-left` 기준으로 통일',
      '완료 카드의 `차이 N분`을 별도 메타 라인이 아니라 시간 라인에 합쳐 medium/spacious 높이에서 줄 수를 안정화',
      '회귀 테스트도 중앙 정렬뿐 아니라 태그/제목/시간의 좌측 기준선 정렬을 함께 확인하도록 강화',
    ],
    improvements: [
      '`timeBoxLayout.js`에서 medium/spacious content container를 왼쪽 정렬 기반으로 재정의하고 compact row도 좌측 흐름으로 조정',
      '`TimeBoxCard.jsx`에서 완료 상태 시간 문구를 `실제 N분 · 차이 +/-N분` 형태로 통합하고 불필요한 완료 메타 라인을 제거',
      '`ui-layout-regression.spec.js`와 `TIMEBOX_LAYOUT_MATRIX.md`를 왼쪽 기준선/시간 라인 통합 계약에 맞게 갱신',
    ],
    validation: [
      'lint/build 통과',
      'ui-layout-regression 좌측 기준선 회귀 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.4',
    date: '2026-03-09',
    title: '타임박스 중앙 정렬 콘텐츠 스택 재구성(T61)',
    summary:
      '타임박스가 커져도 태그/제목/시간이 따로 놀던 문제를, 높이 밴드별 중앙 정렬 content group 전략으로 재구성해 카드 중심에서 같은 읽기 흐름을 유지하도록 정리했습니다.',
    focus: [
      'compact는 `태그 -> 제목 -> 시간` 인라인 row를 카드 중앙에 유지하고, medium/spacious는 같은 요소를 중앙 stack으로 확장',
      'medium에서도 카테고리 태그와 시간 라벨이 빠지지 않도록 하고, spacious만 추가 메타를 확장해 정보량과 정렬을 분리',
      'Playwright 회귀 테스트에서 typography뿐 아니라 content group의 중심점이 카드 중심과 충분히 가까운지도 함께 검증',
    ],
    improvements: [
      '`timeBoxLayout.js`를 content layout strategy(`inline` / `stack-centered`) 중심으로 재정의',
      '`TimeBoxCard.jsx`에서 `timebox-content`, `timebox-time` 테스트 포인트를 추가하고 중앙 content group 렌더 구조로 단순화',
      '`TIMEBOX_LAYOUT_MATRIX.md`와 `ui-layout-regression.spec.js`를 태그/제목/시간 중심 정렬 계약에 맞게 갱신',
    ],
    validation: [
      'lint/build 통과',
      'ui-layout-regression 중앙 정렬 회귀 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.3',
    date: '2026-03-09',
    title: '타임박스 높이별 타이포그래피 전략 재정의(T60)',
    summary:
      '30분 카드만 정렬이 맞고 60분 이상 카드에서는 텍스트 스케일이 거의 반응하지 않던 문제를, 높이 밴드별 layout strategy를 명시적으로 분리하는 방식으로 정리했습니다.',
    focus: [
      'compact/medium/spacious 모두 하나의 resolver가 선택하고, JSX는 선택된 profile만 소비하도록 구조를 단순화',
      'medium 카드는 제목 확대 + 메타 1줄 중심으로, spacious 카드는 제목/메타를 더 여유 있게 노출하도록 정보 밀도를 단계화',
      'Docker bootstrap 환경에서도 깨지지 않도록 ui-layout-regression 회귀 테스트를 서버 snapshot 기준으로 재작성',
    ],
    improvements: [
      '`timeBoxLayout.js`에 title/meta/tag typography token과 line-clamp 전략을 추가하고 `useMemo`로 resolver 호출을 캐싱',
      '`TimeBoxCard.jsx`에 `timebox-title`, `timebox-meta`, `timebox-tag` test id를 추가하고 category badge 노출을 밴드별 규칙으로 분리',
      '`TIMEBOX_LAYOUT_MATRIX.md` 문서와 `ui-layout-regression.spec.js`를 medium/spacious 타이포그래피 기준에 맞게 갱신',
    ],
    validation: [
      'lint/build 통과',
      'ui-layout-regression에서 compact/medium/spacious typography 회귀 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.2',
    date: '2026-03-08',
    title: '헤더 액션 hierarchy + 사이드바 density 정리(T57~T59)',
    summary:
      '헤더 우측 상태/유틸리티 액션을 더 명확히 분리하고, 브레인 덤프와 빅3 슬롯의 padding/컨트롤 크기를 줄여 사이드바 스캔 속도를 높였습니다.',
    focus: [
      '저장 상태는 읽기 전용 badge로, 재배치/테마 전환은 작은 utility cluster로 분리',
      '브레인 덤프/빅3는 정보량은 유지하되 padding과 버튼 크기를 줄여 한 화면에서 더 빠르게 훑히도록 조정',
      '라이트 모드에서 작은 버튼과 subtle surface가 너무 떠 보이지 않도록 secondary tone도 함께 미세 조정',
    ],
    improvements: [
      '`Header.jsx` 우측 액션을 상태 badge + utility cluster 구조로 재배치',
      '`BrainDumpInput.jsx`, `BrainDumpItem.jsx`, `BigThreeSlot.jsx`, `big-three/index.jsx`에서 spacing과 컨트롤 크기 축소',
      'empty Big3 slot에 `핵심 추가` 힌트를 넣어 빈 상태 의미를 더 분명히 표시',
    ],
    validation: [
      'lint/build 통과',
      'Playwright full-page 캡처로 light/dark 홈 화면 재확인',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.1',
    date: '2026-03-08',
    title: '라이트 모드 계층/타임라인 액션 hierarchy 재정리(T54~T56)',
    summary:
      '라이트 모드에서 패널과 카드의 계층이 평평하게 보이던 문제를 줄이고, 타임라인 상단의 주행동/보조행동을 분리해 시선 흐름을 정리했습니다.',
    focus: [
      '라이트 모드에서 메인 패널은 떠 있는 surface로, 보조 패널은 플랫한 subtle surface로 분리',
      '타임라인 상단 컨트롤을 탐색(일간/주간/월간, 빠른 추가)과 보기 옵션(집중 모드, 축척)으로 재배치',
      '주간/월간 카드의 `+` 액션은 hover/focus 중심으로 약화해 날짜/preview 정보와 경쟁하지 않도록 조정',
    ],
    improvements: [
      '`index.css` light theme 토큰에서 surface/shadow 값을 다시 조정하고 subtle panel 그림자를 제거',
      '`App.jsx`에서 우측 메인 패널을 `ui-panel`로 승격해 좌측 사이드바와 계층 차이를 강화',
      '`Timeline/index.jsx`에서 헤더 액션을 2단 구조로 재배치하고 필터 라벨을 수직 정렬로 정리',
      '`WeeklyCalendarView.jsx`, `MonthlyCalendarView.jsx`에서 quick add 버튼을 더 작은 원형 액션으로 약화',
    ],
    validation: [
      'lint/build 통과',
      'Playwright full-page 캡처로 light/dark 홈 화면 재확인',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.20.0',
    date: '2026-03-07',
    title: '저장 상태 배지 + 퀵 템플릿 + 캘린더 빠른 일정 추가(T50~T53)',
    summary:
      '헤더에서 현재 저장 상태를 바로 읽을 수 있게 하고, 자주 쓰는 블록을 템플릿으로 저장해 일간/주간/월간 뷰에서 빠르게 일정으로 넣는 흐름을 추가했습니다.',
    focus: [
      'Docker 저장 모드와 로컬 저장 모드를 사용자가 헤더에서 바로 구분하도록 저장 상태 배지를 상시 노출',
      '퀵 템플릿을 meta 저장소에 포함시켜 백업/복원/Docker 동기화와 같은 경로로 함께 다루도록 확장',
      '일간 템플릿 스트립, 주간/월간 셀별 `+` 액션, 빠른 일정 추가 모달을 하나의 생성 흐름으로 통합',
    ],
    improvements: [
      '`storage.js`와 `storageServer.js`에 persistence 상태 구독과 template 메타 저장을 추가',
      '`Header.jsx`에 `로컬 저장/저장 대기/동기화 중/저장됨/오프라인` 배지 추가',
      '`TemplateManagerModal.jsx`, `QuickAddModal.jsx`를 추가하고 FAB에서 템플릿 관리 진입 지원',
      '`Timeline` 일간 뷰에 템플릿 스트립을 추가하고, 주간/월간 캘린더 카드에서도 빠른 일정 추가 버튼 지원',
      '`TimeBoxCard.jsx`와 주간/월간 캘린더 카드 루트를 button 중첩이 없는 접근성 구조로 정리',
    ],
    validation: [
      'lint/build 통과',
      '신규 E2E 통과(template-quick-add, calendar-quick-add, persistence-badge)',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.19.4',
    date: '2026-03-07',
    title: '타임박스 seam/clipping 레이아웃 재정비(T44~T49)',
    summary:
      'stacked timebox에서 하단 seam이 과하게 보이고 compact 카드 본문이 잘리던 문제를 카드 구조와 레이아웃 토큰을 다시 나누는 방식으로 정리했습니다.',
    focus: [
      'compact 카드의 본문 row가 32px 높이 안에 실제로 들어오도록 수직 중앙 정렬로 재배치',
      '카드 frame과 실제 surface를 분리해 슬롯 정합성은 유지하면서도 시각적인 잘림 인상을 완화',
      '리사이즈 핸들은 기본 상태에서 숨기고 hover/focus/resizing 때만 드러나게 조정',
    ],
    improvements: [
      '`TimeBoxCard.jsx`를 frame/surface/content/handle 구조로 재정리',
      '`timeBoxLayout.js`에서 compact/medium/spacious 토큰을 높이 우선 레이아웃으로 재정의',
      '카드 배경 alpha를 높여 그리드 라인이 내부로 비치는 정도를 완화',
      'stacked timebox clipping 회귀 테스트와 layout matrix 문서를 함께 갱신',
    ],
    validation: [
      'lint/build 통과',
      'ui-layout-regression 신규 stacked seam 검증 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.19.3',
    date: '2026-03-07',
    title: 'Docker 저장소 자동 주기 동기화 추가(T43)',
    summary:
      'Docker volume 저장 모드에서 planner snapshot을 주기적으로 다시 밀어 넣도록 바꿔, 서버 재연결 이후에도 데이터가 자동으로 맞춰지게 했습니다.',
    focus: [
      '개별 `day/meta` write와 전체 snapshot sync를 같은 서버 write queue에 넣어 순서 꼬임을 방지',
      'local 변경은 dirty 상태로 추적하고, 약 20초마다 full snapshot 체크포인트를 다시 저장',
      '브라우저가 다시 온라인 상태가 되거나 탭으로 복귀하면 dirty 상태를 즉시 재시도',
    ],
    improvements: [
      '`storage.js`에 auto-sync scheduler/dirty tracking/최근 동기화 상태 기록 추가',
      '`storageServer.js`의 `/import` sync도 write queue에 직렬화해 개별 write와 경합하지 않게 조정',
      '데이터 모달에 auto-sync 주기/마지막 성공 시각 표시 추가',
      'README 및 Docker 영속화 문서에 자동 동기화 운영 규칙과 환경변수(`VITE_STORAGE_AUTO_SYNC_INTERVAL_MS`) 기록',
    ],
    validation: [
      'lint/build 통과',
      '기존 E2E 전체 회귀 통과',
      'temp API 환경에서 auto-sync smoke 확인',
    ],
  },
  {
    version: 'v0.19.2',
    date: '2026-03-07',
    title: '주간 스트립 카드 폭/드래그 감도 재조정(T42)',
    summary:
      '주간 스트립 카드 폭을 1주 레이아웃 감각에 가깝게 키우고, drag는 포인터를 더 직접 따라가도록 바꿔 끊기는 느낌을 줄였습니다.',
    focus: [
      '3주 캐러셀 구조는 유지하되 각 날짜 카드의 시각 밀도는 기존 1주 레이아웃에 가깝게 복원',
      'drag 중에는 lerp 지연을 제거하고 포인터와 scroll을 바로 동기화해 체감 반응성을 높임',
      '상단 패딩을 보강해 주간 스트립 카드가 헤더 상단에서 살짝 잘려 보이던 인상을 줄임',
    ],
    improvements: [
      '주간 스트립 날짜 카드를 `w-[112px] / md:w-[128px]`로 키워 1주형 카드 비율에 가깝게 조정',
      'drag 중 `target -> lerp` 지연을 제거하고 requestAnimationFrame 단위로 `scrollLeft`를 즉시 반영',
      '스크롤 컨테이너에 상단/하단 패딩을 추가하고 관성 감쇠 계수를 다시 조정',
    ],
    validation: [
      'weekly-strip / weekly-strip-carousel / ui-layout-regression 통과',
      'lint 및 전체 E2E 회귀 통과',
    ],
  },
  {
    version: 'v0.19.1',
    date: '2026-03-07',
    title: '주간 스트립 날짜 클릭 복구(T41)',
    summary:
      '주간 스트립의 drag-to-scroll 도입 이후 날짜 버튼 클릭이 무시되던 문제를 고쳐, 일반 클릭과 drag를 다시 분리했습니다.',
    focus: [
      'pointer capture를 pointerdown 시점에 바로 잡지 않고 실제 drag threshold를 넘긴 뒤에만 활성화',
      '날짜 클릭은 그대로 전달하고, drag일 때만 click suppression이 동작하도록 구조를 단순화',
      '회귀 테스트도 `헤딩/last-date` 기준으로 바꿔 실제 날짜 이동 여부를 직접 검증',
    ],
    improvements: [
      '`Header.jsx`의 주간 스트립 pointer capture 시점을 threshold 이후로 이동',
      'drag 종료 시 pointer state 정리를 명시적으로 보강',
      '`weekly-strip.spec.js`, `weekly-strip-carousel.spec.js`를 실제 날짜 이동 기준으로 업데이트',
    ],
    validation: [
      '실브라우저에서 2026-03-10 클릭 시 헤딩이 즉시 변경되는 것 확인',
      'weekly-strip, weekly-strip-carousel 통과',
      'lint 및 E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.19.0',
    date: '2026-03-07',
    title: 'Docker volume 영속화 + 4173 legacy migration 추가(T37~T40)',
    summary:
      'planner 데이터를 브라우저 localStorage 단독에서 Docker volume source-of-truth 구조로 확장하고, 4173 레거시 브라우저 데이터를 서버 저장소로 이관할 수 있게 했습니다.',
    focus: [
      '앱 레이어를 크게 흔들지 않기 위해 기존 sync localStorage API를 유지하고 시작 전 bootstrap hydrate만 추가',
      '포트가 달라도 같은 데이터가 보이도록 browser local mirror + Docker volume persistence 구조로 전환',
      '이전 4173 origin 데이터는 legacy bridge 포트와 수동/자동 migration 경로로 흡수하도록 설계',
    ],
    improvements: [
      '`server/index.js` 추가: planner snapshot을 `/data/planner-store.json`에 저장하는 Node API 도입',
      '`storage.js`를 local mirror + remote sync 구조로 확장하고 `main.jsx`에서 bootstrap hydrate 수행',
      '서버 비어 있고 현재 origin에 의미 있는 planner 데이터가 있으면 자동 migration 수행',
      '데이터 백업/복원 모달에 `현재 브라우저 데이터를 서버 저장소로 동기화` 액션 추가',
      '`docker-compose.yml`, `scripts/docker-dev.sh`를 `app + api + planner-data` 구조로 정리하고 4173 legacy bridge 포트 동시 오픈',
      'README/DOCKER workflow/신규 persistence 문서로 운영 가이드 동기화',
    ],
    validation: [
      'lint/build 통과',
      'Docker API health 확인(`http://localhost:8787/health`)',
      '실브라우저 smoke: 4173 localStorage -> Docker volume migration 후 5173에서 동일 데이터 복원 확인',
    ],
  },
  {
    version: 'v0.18.1',
    date: '2026-03-07',
    title: '주간 스트립 drag smoothing/inertia 보정(T35~T36)',
    summary:
      '주간 스트립 drag-to-scroll이 끊겨 보이던 문제를 줄이기 위해 보간과 release 후 관성 이동을 추가했습니다.',
    focus: [
      '마우스 drag가 포인터 이벤트 빈도에 직접 묶여 뻣뻣하게 느껴지던 부분을 requestAnimationFrame 기반으로 완화',
      'release 이후 아주 짧은 관성 이동을 더해 캐러셀의 연속성을 높임',
      '기존 날짜 클릭 및 accidental click 방지 정책은 유지',
    ],
    improvements: [
      '주간 스트립 drag target을 rAF 보간 방식으로 처리',
      'release 후 velocity 감쇠 기반 inertia 추가',
      'scroll snap 강도를 mandatory에서 proximity로 완화',
      'weekly-strip/weekly-strip-carousel 회귀 검증 재실행',
    ],
    validation: [
      'lint/build 통과',
      'weekly-strip, weekly-strip-carousel, ui-layout-regression 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.18.0',
    date: '2026-03-07',
    title: '주간 스트립 3주 캐러셀 + drag-to-scroll 추가(T31~T34)',
    summary:
      '헤더의 주간 스트립을 3주 범위 가로 캐러셀로 확장하고, 데스크톱에서는 마우스 drag-to-scroll로 이전/다음 주를 바로 훑을 수 있게 했습니다.',
    focus: [
      '기존 7칸 고정 스트립을 이전/현재/다음 주를 동시에 훑는 탐색형 UI로 변경',
      '마우스 드래그와 날짜 클릭이 충돌하지 않도록 threshold와 suppress-click 정책을 함께 적용',
      '모바일은 native horizontal swipe를 그대로 살리고 데스크톱에만 drag-to-scroll 보조를 추가',
    ],
    improvements: [
      '주간 스트립 데이터 범위를 7일에서 21일로 확장',
      '현재 날짜 카드가 진입 시 중앙 근처에 오도록 자동 정렬 추가',
      '주간 스트립을 horizontal carousel 구조로 변경하고 grab/grabbing 피드백 추가',
      '드래그 후 잘못된 날짜 클릭을 막는 click/drag 분리 로직 추가',
      '신규 E2E `weekly-strip-carousel.spec.js` 추가 및 기존 주간 스트립 테스트 보강',
    ],
    validation: [
      'lint/build 통과',
      'weekly-strip, weekly-strip-carousel 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.17.0',
    date: '2026-03-07',
    title: '월간 카테고리/완료율 heatmap 추가(T28~T30)',
    summary:
      '월간 뷰 셀마다 대표 카테고리와 완료율/밀도 강도를 함께 보여주는 heatmap을 추가해 바쁜 날의 성격을 한눈에 읽을 수 있게 했습니다.',
    focus: [
      '월간 캘린더를 단순 일정 개수 요약이 아니라 카테고리 분포와 완료율 경향을 읽는 스캔 도구로 확장',
      '대표 카테고리 색 tint와 category mix bar를 함께 써서 하루 성격을 빠르게 파악 가능하게 조정',
      '월간 범례와 요약 배지로 이번 달의 주요 카테고리/완료율 상태를 상단에서 먼저 확인하도록 구성',
    ],
    improvements: [
      '`calendarViewData`에 dominant category, category mix, heat level, 월간 범례 집계 추가',
      '월간 셀 배경에 category tint overlay 적용 및 대표 카테고리 배지 추가',
      '월간 셀 하단에 category mix bar 추가로 카테고리 비중 시각화',
      '월간 상단에 카테고리 heatmap 범례와 일정 있는 날/평균 완료율/최다 일정 요약 배지 추가',
      '신규 E2E `monthly-calendar-heatmap.spec.js` 추가',
    ],
    validation: [
      'lint/build 통과',
      'monthly-calendar-view, monthly-calendar-heatmap 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.16.1',
    date: '2026-03-07',
    title: '브레인 덤프 priority 가독성/정렬 UX 보정(T26~T27)',
    summary:
      'priority 배터리의 시각은 유지하면서 폭을 줄여 텍스트 가독성을 개선하고, priority 변경 시 즉시 위로 튀는 정렬을 제거했습니다.',
    focus: [
      '브레인 덤프 입력 단계에서 우선순위 조작이 본문 가독성을 해치지 않도록 레이아웃 밀도를 재조정',
      'priority 변경 중 사용자가 맥락을 잃지 않도록 현재 세션에서는 아이템 위치를 유지',
      '추천 정확도는 유지하기 위해 빅3 추천과 재진입에서는 여전히 priority 정렬을 사용',
    ],
    improvements: [
      'priority 배터리 크기 축소 및 상시 라벨 제거',
      '브레인 덤프 본문을 2줄 clamp로 변경해 긴 텍스트 가독성 보강',
      'priority 변경 시 즉시 재정렬 제거, 재진입 시 정렬 복원 방식으로 조정',
      'priority E2E를 정렬 지연 UX 기준으로 업데이트',
    ],
    validation: [
      'lint/build 통과',
      'brain-dump-priority, bigthree-autofill 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.16.0',
    date: '2026-03-07',
    title: '브레인 덤프 priority 배터리 + 빅3 추천 흐름(T21~T25) 추가',
    summary:
      '브레인 덤프 항목에 중요도(priority)를 배터리 형태로 표시하고, 중요도 기준 자동 정렬과 빅3 추천 채우기를 연결했습니다.',
    focus: [
      'priority를 저장 스키마에 포함해 새 데이터와 기존 localStorage 데이터를 같은 규칙으로 정규화',
      '브레인 덤프 단계에서 우선순위를 빠르게 올리고 바로 정렬 결과를 보게 해 계획 압축 단계를 앞당김',
      '기존 빅3 자동채우기를 유지하되 중요도 기반 추천 흐름으로 의미를 명확히 변경',
    ],
    improvements: [
      '`brainDumpPriority` 유틸 추가: priority 정규화, 순환, stable sort 규칙 정의',
      '브레인 덤프 아이템에 배터리형 priority 컨트롤과 단계 라벨 추가',
      'priority 변경 시 브레인 덤프 리스트가 높은 순으로 자동 재정렬',
      '`빅3 자동채우기`를 `빅3 추천채우기`로 변경하고 priority 상위 항목부터 채우도록 수정',
      'priority 정렬/추천 시나리오 E2E 추가 및 README/Task Board 동기화',
    ],
    validation: [
      'lint/build 통과',
      '신규 E2E 통과(brain-dump-priority)',
      '업데이트된 bigthree-autofill 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.15.0',
    date: '2026-03-07',
    title: '주간/월간 캘린더 뷰(T19~T20) 추가',
    summary:
      '일간 타임라인 편집 흐름은 유지한 채, 주간과 월간 계획을 한 화면에서 읽을 수 있는 읽기 전용 캘린더 뷰를 추가했습니다.',
    focus: [
      '기존 localStorage 날짜별 구조를 그대로 활용해 별도 스키마 변경 없이 캘린더 요약을 계산',
      '일간/주간/월간을 타임라인 내부 뷰 모드로 통합해 탐색 비용을 낮춤',
      '셀 클릭 시 즉시 해당 날짜의 일간 타임라인으로 돌아가도록 연결해 탐색과 편집을 분리',
    ],
    improvements: [
      '`calendarViewData` 유틸 추가: 주간/월간 스냅샷(rangeLabel, completionRate, previewItems) 계산',
      '주간 캘린더 카드 추가: 7일 일정 수/완료율/계획 시간/미리보기 표시',
      '월간 캘린더 그리드 추가: 42셀 구조로 현재 월/비활성 월 셀 구분 및 현재 날짜 강조',
      '타임라인 헤더에 `일간/주간/월간` 뷰 토글 추가',
      '신규 E2E `weekly-calendar-view`, `monthly-calendar-view` 추가',
    ],
    validation: [
      'lint/build 통과',
      '캘린더 전용 E2E 통과',
      'E2E 전체 회귀 통과',
    ],
  },
  {
    version: 'v0.14.0',
    date: '2026-03-07',
    title: '실행 고도화 5종(T14~T18) 추가',
    summary:
      '빅3 자동채우기, 타임라인 집중모드, 상태/카테고리 필터, 타임박스 복제, 파일 기반 데이터 입출력을 한 번에 도입했습니다.',
    focus: [
      '기존 DnD/Undo/저장 구조를 유지한 상태에서 생산성 기능을 확장',
      '각 기능마다 독립 E2E 시나리오를 추가해 회귀 위험을 낮춤',
      'Task Board를 18개 체계로 확장해 세션 간 진행 상태 추적성을 강화',
    ],
    improvements: [
      '브레인덤프에서 빅3 빈 슬롯을 한 번에 채우는 자동 채우기 버튼 추가',
      '타임라인 집중모드(인사이트 숨김) 토글 및 localStorage 복원 추가',
      '타임라인 상태/카테고리 필터 추가 및 필터 결과 빈 상태 안내 추가',
      '완료 모달에서 일정 복제(다음 빈 슬롯 자동 배치) 기능 추가',
      '데이터 백업 모달에 JSON 파일 다운로드/파일 불러오기 흐름 추가',
    ],
    validation: [
      'lint/build 통과',
      '신규 E2E 5종 통과(bigthree-autofill, focus-mode, timeline-filters, timebox-duplicate, data-transfer-file)',
      'E2E 전체 통과',
    ],
  },
  {
    version: 'v0.13.4',
    date: '2026-03-07',
    title: 'FSD 2단계(T13) 구조 정리 + 문서 동기화',
    summary:
      '`hooks/utils` 잔여 레이어를 `app/entities` 경계로 이동하고 배럴 import 규칙으로 정리해 새 세션 진입 비용을 낮췄습니다.',
    focus: [
      'App/Feature가 도메인 유틸에 접근할 때 단일 배럴(`entities/planner`)을 사용하도록 경로 일관화',
      '구조 변경이 동작 변경으로 이어지지 않도록 무동작 리팩토링 원칙과 회귀 테스트를 함께 적용',
      '세션 가이드/README/맵 문서를 코드 구조와 동일한 상태로 업데이트',
    ],
    improvements: [
      '`src/hooks/*` -> `src/app/hooks/*`, `src/utils/*` -> `src/entities/planner/lib/*` 이동',
      '`src/app/hooks/index.js`, `src/entities/planner/index.js` 배럴 엔트리 추가',
      'App/Timeline/DataTransfer 등 import 경로를 새 경계 기준으로 정리',
      '`docs/FSD_PHASE2_MAP.md` 추가 + README/SESSION_PLAYBOOK/TASK_BOARD 동기화',
    ],
    validation: ['lint/build 통과', 'E2E 전체 통과(33 passed)'],
  },
  {
    version: 'v0.13.3',
    date: '2026-03-07',
    title: 'Undo UX(T12) 도입 + 파괴 액션 복구 흐름 추가',
    summary:
      '브레인덤프 삭제, 일정 삭제, 완료/건너뜀 상태변경에 되돌리기(Undo) 토스트를 연결해 실수 복구 흐름을 추가했습니다.',
    focus: [
      '데이터 스냅샷 기반 복구 API를 훅 레벨에 추가해 localStorage 저장 일관성을 유지',
      '기존 타임라인/모달 로직은 유지하고 App 레벨 래퍼로 Undo 정책만 주입',
      '패치노트 테스트를 최신 버전 하드코딩 의존 없이 동작하도록 보강',
    ],
    improvements: [
      '`useToast`에 액션 버튼(`되돌리기`) 지원 및 타이머 정리 로직 추가',
      '`useDailyData`에 `restoreBrainDumpItem`, `restoreTimeBox` 복구 액션 추가',
      '브레인덤프 삭제/일정 삭제/완료·건너뜀·타이머완료 상태변경에 Undo 토스트 연결',
      '신규 E2E `undo-ux.spec.js` 추가 + 패치노트 관련 E2E를 동적 최신 버전 선택 방식으로 전환',
    ],
    validation: [
      'lint/build 통과',
      'E2E 영향 검증 통과(undo-ux, patch-notes, ui-layout-regression)',
      'E2E 전체 통과(33 passed)',
    ],
  },
  {
    version: 'v0.13.2',
    date: '2026-03-07',
    title: 'PatchNotes 컴포넌트 분해(T9) 완료',
    summary: '패치노트 모달을 Item/Header/Detail 단위로 분해해 구조를 단순화하고 유지보수성을 높였습니다.',
    focus: [
      '대형 단일 컴포넌트의 책임을 분리해 변경 포인트를 명확히 구분',
      '기존 동작(test id, 토글 상태, 접근성 속성)은 유지하고 내부 구조만 리팩토링',
      '패치노트 UI 확장 시 상세 영역/헤더 영역을 독립적으로 수정 가능하도록 정리',
    ],
    improvements: [
      '`PatchNoteItem`, `PatchNoteHeader`, `PatchNoteDetail` 서브컴포넌트 추가',
      '`PatchNotesModal`은 상태 관리/리스트 렌더 책임만 유지하도록 단순화',
      '공통 UI primitive(Button/Card/Badge) 사용을 패치노트 영역에도 일관 적용',
    ],
    validation: [
      'lint/build 통과',
      'E2E 전체 통과(30 passed)',
      'E2E: patch-notes, ui-layout-regression(패치노트 토글 안정성 포함) 통과',
    ],
  },
  {
    version: 'v0.13.1',
    date: '2026-03-07',
    title: 'TimeBox 높이별 레이아웃 매트릭스(T8) 적용',
    summary: '타임박스 카드의 높이 분기 로직을 레이아웃 매트릭스로 분리해 유지보수성과 예측 가능성을 높였습니다.',
    focus: [
      '기존 `TimeBoxCard` 내부 조건 분기를 프로파일 함수 기반으로 정리해 향후 수정 비용 축소',
      '30분 카드(compact)와 그 이상 카드의 노출 우선순위를 명시적으로 분리',
      '동작 회귀 없이 구조만 정리하는 리팩토링 원칙 유지',
    ],
    improvements: [
      '`src/features/timeline/ui/timeBoxLayout.js` 신설: compact/medium/spacious 밴드별 규칙 정의',
      '`TimeBoxCard`가 매트릭스 결과(`resolveTimeBoxLayout`)를 사용하도록 치환',
      '타임박스 레이아웃 규격 문서(`docs/TIMEBOX_LAYOUT_MATRIX.md`) 추가',
    ],
    validation: [
      'lint/build 통과',
      'E2E: timer-mode, timeline-scale, timebox-dnd, skip-reason, ui-layout-regression 통과',
    ],
  },
  {
    version: 'v0.13.0',
    date: '2026-03-07',
    title: 'Shared UI Primitive 도입(T7) + 핵심 화면 치환',
    summary: 'Button/Card/Badge/IconButton 공통 컴포넌트를 도입하고 핵심 기능 화면에 점진 적용해 스타일 중복을 줄였습니다.',
    focus: [
      '반복되는 `ui-btn/ui-panel` 클래스 사용을 공통 컴포넌트로 수렴해 유지보수 포인트 축소',
      '기존 동작은 유지하면서 렌더링 레이어만 치환하는 무동작 리팩토링 방식 유지',
      '카테고리/데이터복원/재배치/헤더/패치노트/리포트 카드의 버튼/카드 표현 일관화',
    ],
    improvements: [
      '`src/shared/ui`에 `Button`, `Card`, `Badge`, `IconButton`, `cn` 유틸 추가',
      'Header, PatchNotes, BrainDumpItem, WeeklyReportCard, DailyRecapCard에 공통 primitive 적용',
      'CategoryManagerModal, DataTransferModal, RescheduleAssistantModal에 공통 primitive 적용',
      '기존 E2E 스위트(30개) 통과로 회귀 없이 리팩토링 완료',
    ],
    validation: [
      'lint/build 통과',
      'E2E 전체 통과(30 passed)',
      '핵심 회귀: micro-interactions, category-manager, data-transfer, report-toggle, reschedule-assistant, patch-notes 통과',
    ],
  },
  {
    version: 'v0.12.9',
    date: '2026-03-07',
    title: '테마 토큰 통합 + 접근성 보강 + UI 회귀 테스트 확장',
    summary: '라이트/다크 일관성을 높이기 위해 semantic 토큰을 도입하고, ARIA 개선 및 레이아웃 회귀 테스트를 추가했습니다.',
    focus: [
      '공통 UI 클래스가 theme class와 충돌하지 않도록 색/서피스/보더를 semantic token 중심으로 정리',
      '토스트, 주간 스트립, 패치노트 토글, 플로팅 메뉴에 접근성 상태값(aria-live/expanded/current 등) 보강',
      '최근 조정한 UI(주간 gradient, 패치노트 토글 안정성, 30분 카드 정렬)를 E2E로 고정',
    ],
    improvements: [
      '`ui-panel`, `ui-panel-subtle`, `ui-btn-secondary`, `ui-btn-ghost`, `ui-input`, `ui-select`, `ui-modal-card`, `ui-glass-menu`를 semantic variable 기반으로 전환',
      '토스트 컨테이너 라이브 리전 적용 및 플로팅 메뉴/패치노트 토글 ARIA 상태 정보 추가',
      '새 E2E(`ui-layout-regression.spec.js`)로 핵심 레이아웃 회귀 자동 검출 추가',
    ],
    validation: [
      'lint/build 통과',
      'E2E 전체 통과(27 passed)',
      'E2E 추가 검증: ui-layout-regression, timer-mode, timeline-scale, patch-notes, weekly-strip 통과',
    ],
  },
  {
    version: 'v0.12.8',
    date: '2026-03-07',
    title: '다크 분리/주간 강조/패치노트 안정화/30분 카드 정렬',
    summary: '사용자 피드백 기반으로 다크 모드 경계, 주간 active 인지성, 패치노트 상세 레이아웃, 30분 카드 배치를 일괄 개선했습니다.',
    focus: [
      '다크 모드 브레인덤프 아이템이 배경과 섞여 보이는 문제를 tone contrast로 해소',
      '현재 날짜를 빠르게 인식할 수 있도록 주간 스트립 active 표현을 더 강하게 조정',
      '패치노트 모달의 라이트/다크 텍스트 충돌과 상세보기 토글 시 레이아웃 밀림을 방지',
      '30분 타임박스에서 태그 우측 쏠림을 제거하고 상태 배지와 재생 버튼을 같은 라인으로 정렬',
    ],
    improvements: [
      '브레인덤프 항목에 다크 전용 서피스 톤 + 미세 inset 라인 적용으로 항목 단위 분리 강화',
      '주간 날짜 스트립 active 카드에 gradient tone/ring/상단 하이라이트 라인 추가',
      '패치노트 모달을 slate 토큰으로 정리하고 토글 버튼 폭 고정으로 상세 영역 흔들림 제거',
      '타임박스 compact 레이아웃을 `#태그 -> 제목` 순서로 통일하고 상단 액션 라인을 재배치',
    ],
    validation: [
      'lint/build 통과',
      'E2E: micro-interactions, light-mode-guideline, weekly-strip, patch-notes, timer-mode, timeline-scale, timebox-dnd, skip-reason 통과',
    ],
  },
  {
    version: 'v0.12.7',
    date: '2026-03-07',
    title: 'UI 노이즈 다이어트 + 선택적 글래스모피즘 적용',
    summary: '사이드바/유틸 버튼 노이즈를 줄이고, 모달/FAB에만 전략적으로 글래스모피즘을 적용했습니다.',
    focus: [
      '핵심 콘텐츠 우선 원칙에 맞춰 보조 액션의 시각적 우선순위를 의도적으로 낮춤',
      '중첩 카드 구조의 답답함을 완화하고 라이트 모드에서 액티브 상태 대비를 명확히 강화',
    ],
    improvements: [
      '브레인덤프 액션 버튼(빅3/삭제)을 hover/focus 노출로 전환하고 빅3를 ghost 스타일로 약화',
      '주간/일간 리포트 접기 버튼을 아이콘 토글로 교체하고 유틸 버튼 강조도를 낮춤',
      '주간 계획 보드 내부 카드를 flat 톤(연한 배경+보더, no shadow)으로 재정의',
      '상단 날짜 스트립 gap 확대 + 비활성 날짜 투명도 강화 + 활성 날짜 강조',
      '빅3 빈 슬롯을 dashed border + 흐린 + 아이콘 힌트형 UI로 변경',
      '모달/FAB 메뉴에 선택적 글래스모피즘(라이트: white/40, 다크: slate-900/50) 적용',
    ],
    validation: ['lint/build/e2e 전체 회귀 통과 기준으로 반영'],
  },
  {
    version: 'v0.12.6',
    date: '2026-03-07',
    title: '라이트 모드 계층 분리 + 재생 버튼 우상단 정렬',
    summary: '정보 계층을 더 또렷하게 만들고 재생 버튼을 상태 배지 근처로 재배치해 겹침을 해소했습니다.',
    focus: [
      '라이트 모드에서 중요 카드와 컨테이너 레벨이 섞여 보이는 문제를 톤 단계로 분리',
      '타임박스 재생 버튼이 텍스트와 충돌하지 않도록 액션 영역을 우상단에 고정',
    ],
    improvements: [
      '앱 레이아웃 컨테이너(좌/우 패널)를 `ui-panel-subtle`로 낮추고 내부 카드를 상대적으로 강조',
      '`ui-panel-subtle` 라이트 톤을 `bg-slate-100`으로 조정해 중요/비중요 계층 대비 강화',
      '재생 버튼/완료 버튼을 우상단(상태 배지 주변)으로 이동하고 본문 패딩을 재조정해 겹침 제거',
    ],
    validation: ['Playwright 시각 점검 + lint/build/e2e 전체 회귀 통과'],
  },
  {
    version: 'v0.12.5',
    date: '2026-03-07',
    title: '라이트 모드 톤 계층 리팩토링',
    summary: 'Playwright 시각 점검 결과를 기반으로 라이트 모드 색상 계층을 가이드 토큰에 맞게 정렬했습니다.',
    focus: [
      '라이트 모드에서 어두운 패널이 남는 문제를 제거하고 Surface-over-Background 구조를 강화',
      '가이드 토큰(#F8F9FA/#FFFFFF/#1F1F1F/#444746)을 실제 렌더 결과와 일치시키는 데 집중',
    ],
    improvements: [
      'ui-panel/ui-panel-subtle/modal/app/header/nav의 라이트 기본 톤을 레이어드 화이트 구조로 재정의',
      'theme-light 토큰 오버라이드에 `bg-slate-50`, `bg-white`, `text-slate-*` 계층 추가',
      'Playwright E2E에 라이트 모드 토큰 검증 테스트 추가',
    ],
    validation: ['Playwright 풀스크린 시각 점검 + lint/build/e2e(전체) 통과'],
  },
  {
    version: 'v0.12.4',
    date: '2026-03-07',
    title: '타임라인 재생 버튼 시각 안정화',
    summary: '타임박스 재생 버튼을 중앙 정렬하고 태그 충돌을 해소해 조작성을 높였습니다.',
    focus: [
      '재생 버튼을 핵심 액션 트리거로 인지할 수 있도록 카드 중앙에 명확히 노출',
      '30분 카드에서 카테고리 태그와 버튼이 겹치지 않도록 텍스트 레이아웃 우선순위 조정',
    ],
    improvements: [
      '재생 버튼을 카드 수직 중앙으로 이동하고 좌측 액센트 바 기준 16px 이상 여백 확보',
      '컴팩트 카드에서 내용 텍스트 우선 배치 + 태그를 후순위 배지로 이동',
      '재생/완료 버튼 hover 시 scale-110 마이크로 인터랙션 추가',
    ],
    validation: ['lint/build/e2e(전체) 회귀 통과 기준으로 반영'],
  },
  {
    version: 'v0.12.3',
    date: '2026-03-07',
    title: 'Gemini 라이트 모드 레퍼런스 규칙 추가',
    summary: 'Front-end UX Guardian/가이드에 레이어드 화이트와 톤 기반 계층 원칙을 공식 반영했습니다.',
    focus: [
      '세션마다 라이트 모드 색상 톤이 흔들리지 않도록 참조 토큰을 고정',
      '선 기반 분할 대신 tonal elevation 원칙을 문서 상위 규칙으로 명시',
    ],
    improvements: [
      '.agents/FRONTEND_UX_GUARDIAN에 Gemini Light Mode Principle 섹션 추가',
      'AI_FRONTEND_GUIDE에 Surface-over-Background 요약 규칙 추가',
      '배경/카드/텍스트 색상 기준(#F8F9FA/#FFFFFF/#1F1F1F/#444746) 문서화',
    ],
    validation: ['문서 규칙 반영 + lint/build + patch-notes e2e + 전체 e2e 회귀 통과'],
  },
  {
    version: 'v0.12.2',
    date: '2026-03-07',
    title: '스켈레톤 로딩 + 삭제 마이크로 인터랙션',
    summary: '타임라인 인사이트 카드 로딩 전환을 부드럽게 만들고 브레인덤프 삭제 애니메이션을 추가했습니다.',
    focus: [
      '데이터 전환 시 카드가 갑자기 나타나는 감각을 줄이기 위해 스켈레톤 기반 전환 UX를 적용',
      '작은 삭제 동작에도 시각적 피드백이 남도록 slide-out 마이크로 인터랙션을 도입',
    ],
    improvements: [
      '날짜 이동 시 타임라인 상단 인사이트 영역에 스켈레톤 UI 표시 후 페이드 인 전환',
      '브레인덤프 항목 삭제 시 우측으로 밀리며 사라지는 220ms 애니메이션 적용',
      'E2E에 스켈레톤 표시/삭제 애니메이션 회귀 테스트 추가',
    ],
    validation: ['lint/build/e2e(전체) 통과 기준으로 반영'],
  },
  {
    version: 'v0.12.1',
    date: '2026-03-07',
    title: 'Front-end UX Guardian 규칙 도입',
    summary: '세션 간 UI 일관성을 위해 에이전트 기반 Look & Feel 규칙을 문서 체계에 통합했습니다.',
    focus: [
      '디자인 원칙이 세션마다 흔들리지 않도록 에이전트 문서와 기존 가이드를 동기화',
      'DnD/접근성 무결성을 보존하면서 시각적 미니멀 룰을 강제하는 기준 정립',
    ],
    improvements: [
      '.agents/FRONTEND_UX_GUARDIAN 문서 신설 및 SESSION_PLAYBOOK에 UI 작업 전 참조 규칙 추가',
      'AI_FRONTEND_GUIDE에 Interaction/Component 고정 규칙(브랜드 컬러, DnD 핸들러 보호) 확장',
      'README AI 협업 문서 목록에 Front-end UX Guardian 경로 연결',
    ],
    validation: ['문서 경로 연결 검증 + lint/build/e2e(패치노트/전체 회귀) 통과'],
  },
  {
    version: 'v0.12.0',
    date: '2026-03-07',
    title: '패치노트 운영 규칙 문서화',
    summary: '중요 변경마다 패치노트가 누락되지 않도록 세션 공통 규칙을 고정했습니다.',
    focus: [
      '새 세션이 들어와도 동일한 품질 기준으로 기록이 이어지도록 운영 절차를 표준화',
      '문서와 에이전트 지침이 서로 모순되지 않도록 단일 워크플로 경로를 추가',
    ],
    improvements: [
      '.agents/SESSION_PLAYBOOK에 중요 변경 시 패치노트 반영을 필수 단계로 추가',
      'docs에 PATCH_NOTES_WORKFLOW 문서 신설 및 DELIVERY/CONVENTIONS에 트리거 규칙 연결',
      'README AI 협업 문서 목록에 패치노트 워크플로 링크 추가',
    ],
    validation: [
      '문서 경로 연결 및 패치노트 모달 최신 버전(v0.12.0) 표시 확인',
      'lint/build/e2e 회귀 기준으로 문서 변경 절차를 유지',
    ],
  },
  {
    version: 'v0.11.0',
    date: '2026-03-07',
    title: '패치노트 상세보기 구조 도입',
    summary: '버전별 기록을 요약+상세로 분리해 추적성을 높였습니다.',
    focus: [
      '기능 추가보다 변경 의도와 품질 근거가 남도록 기록 포맷을 표준화',
      '히스토리 누락을 막기 위해 이전 릴리스까지 역추적 반영',
    ],
    improvements: [
      '패치노트를 버전 카드 + 상세보기(아코디언) UI로 개편',
      '`신경 쓴 부분 / 개선 사항 / 검증` 3단 섹션으로 상세 정보 구조화',
    ],
    validation: ['lint/build/e2e 회귀 통과를 기준으로 패치노트 반영'],
  },
  {
    version: 'v0.10.0',
    date: '2026-03-07',
    title: '라이트 모드 가독성 보강 + FAB 패치노트 진입',
    summary: '라이트 테마 대비를 높이고 FAB(플로팅 액션 버튼)에 패치노트 진입을 추가했습니다.',
    focus: [
      'WCAG 대비 기준(일반 텍스트 4.5:1)을 만족하는 텍스트/배경 대비 강화',
      '투명 배경(`bg-gray-900/60` 등)까지 라이트 톤으로 일관 치환',
    ],
    improvements: [
      '라이트 모드 색상 계층(배경/패널/텍스트/보더) 재정의',
      'FAB 메뉴에 `패치노트` 액션 및 모달 연결',
      '30분 카드에서 태그/사유 → 제목 순서로 정렬 통일',
    ],
    validation: ['E2E: theme-toggle, patch-notes, timeline-scale, skip-reason 통과'],
  },
  {
    version: 'v0.9.0',
    date: '2026-03-07',
    title: '실행력 고도화 세트',
    summary: '계획-실행 간 간극을 줄이기 위한 실행 기능들을 추가했습니다.',
    focus: [
      '실행 데이터(actualMinutes) 입력 마찰을 줄이기 위한 자동화',
      '미완료 일정 처리 시간을 단축하는 다음 날 배치 자동화',
    ],
    improvements: [
      '타이머 모드(시작/일시정지/완료) 및 자동 실제시간 반영',
      '자동 재배치 어시스턴트(다음 날 빈 슬롯 기반 일괄 적용)',
      '스킵 원인 기반 액션 템플릿 + 주간 계획 보드 프리뷰',
    ],
    validation: ['E2E: timer-mode, reschedule-assistant, skip-template-action 통과'],
  },
  {
    version: 'v0.8.0',
    date: '2026-03-06',
    title: '테마/조회 복원 + 스토리지 스키마 정비',
    summary: '새로고침 이후 컨텍스트를 잃지 않도록 복원 로직을 추가했습니다.',
    focus: [
      '사용자가 마지막으로 보던 날짜/슬롯에서 즉시 작업 재개 가능하도록 설계',
      '기존 저장 데이터와 호환되는 점진적 스키마 마이그레이션',
    ],
    improvements: [
      '다크/라이트 모드 토글 및 테마 저장',
      '최근 날짜/최근 슬롯 포커스 복원',
      '스토리지 schemaVersion v2 정규화',
    ],
    validation: ['E2E: theme-toggle, recent-restore 통과'],
  },
  {
    version: 'v0.7.0',
    date: '2026-03-06',
    title: '드래그 UX/리포트 확장',
    summary: '드래그 가시성과 주간 리포트를 강화했습니다.',
    focus: [
      '드롭 성공 예측 가능성을 높이기 위해 프리뷰 라인/가이드 도입',
      '주간 리포트의 해석력을 높이기 위해 원인 변화 데이터 추가',
    ],
    improvements: [
      '타임라인 드롭 프리뷰 라인 + 가이드 메시지',
      '주간/일간 리포트 접기-펼치기',
      '스킵 원인 변화(지난주 대비) 시각화',
    ],
    validation: ['E2E: inbox-to-timeline-dnd, report-toggle, weekly-report, skip-trend 통과'],
  },
  {
    version: 'v0.6.0',
    date: '2026-03-05',
    title: '핵심 플래너 루프 안정화',
    summary: '브레인덤프→빅3→타임라인 기본 루프를 안정화했습니다.',
    focus: [
      '드롭 좌표 오차와 겹침 충돌 같은 사용 중단 포인트 제거',
      '완료/스킵 데이터가 회고 카드에 반영되도록 흐름 정합성 확보',
    ],
    improvements: [
      '드래그앤드롭 슬롯 매핑 안정화 및 겹침 방지',
      '완료 모달, 스킵 사유 저장, 카드 비교 지표 반영',
      '카테고리 관리/데이터 내보내기-가져오기 도입',
    ],
    validation: ['E2E 회귀 기준 항목 전체 통과(당시 기준)'],
  },
]
