# AI Refactor Guide v1.2

이 문서는 **어떤 AI 에이전트든** 이 프로젝트에서 리팩터링 또는 TypeScript 후속 작업을 시작하기 전에 읽어야 하는 **우선순위 및 방향 문서**다.

> 이 문서는 엄격한 규칙집이 아니다.
> "지금 기준선이 어디인지", "앞으로 무엇을 먼저 건드릴지", "어떤 경계를 깨면 안 되는지"를 정하는 문서다.

작업 전 체크:
- UI 변경 시 `AI_FRONTEND_GUIDE.md`
- 구조/아키텍처/스토리지/TS 후속 작업 시 이 문서
- 실행 상태 기준선은 [docs/FINAL_REFACTOR_EXECUTION_PLAN.md](/Users/bohyeong/Desktop/공부/project/musk/musk-timeboxing/docs/FINAL_REFACTOR_EXECUTION_PLAN.md)

---

## 0. 이 프로젝트의 핵심 제약

| 항목 | 규칙 |
|------|------|
| 상태 관리 | `useState` / `useReducer` 중심. Redux, Zustand 등 외부 상태 라이브러리 도입 금지 |
| 저장소 | persisted 원본은 planner storage boundary가 관리한다. localStorage 키(`musk-planner-*`)와 optional server sync는 모두 `src/entities/planner/lib/storage*` 경계 안에서만 다룬다 |
| 배포 | 정적 빌드 전용 (`vite.config.js`의 `base: './'` 유지) |
| 아키텍처 | Feature-Sliced Design (FSD). 큰 방향: `app → features → entities → shared` |
| 언어 기준선 | `src/` 앱 소스는 현재 TypeScript 기준선이다. 새 앱 코드는 TS를 기본으로 한다 |

---

## 1. 지금도 강하게 지키는 규칙 (Hard Blockers)

지금은 대규모 TS 마이그레이션 단계가 아니라 **기준선 유지 + 후속 정리 단계**다. 아래 3가지는 여전히 차단 기준이다.

### Blocker 1 — storage boundary

persisted field naming(`brainDump`, `content`, `sourceId`, `boardCanvas`)은 **`src/entities/planner/lib/storage*` 밖으로 새지 않는다.**

- `src/entities/planner/lib/storage/adapters.ts`가 persisted ↔ internal 변환을 담당한다.
- `src/entities/planner/lib/storage/migrations.ts`는 persisted schema 보정만 담당한다.
- `src/entities/planner/model/*`은 `taskCards`, `title`, `taskId` 등 internal 이름만 쓴다.
- 새 기능에서 persisted naming이 다시 model/hooks/features로 새면 안 된다.

현재 baseline:

```text
storage/adapters.ts     ← persisted <-> internal 변환 유일 지점
storage/migrations.ts   ← persisted schema 마이그레이션
storage/schema.ts       ← persisted 구조 상수
model/*                 ← internal 이름만 사용
```

### Blocker 2 — command/selector 우선

새로운 비즈니스 로직은 `useDailyData.ts`나 `App.tsx`에 직접 추가하지 않는다.
먼저 `src/entities/planner/model/` 또는 순수 `lib/*` helper에 작성하고, hook/UI는 그것을 호출하게 한다.

### Blocker 3 — TypeScript baseline 유지

이제 `src/`는 TypeScript 기준선이다.

- 새 앱 소스는 `.ts` / `.tsx`로 작성한다.
- 단순 변환 커밋과 로직 변경 커밋은 가능하면 분리한다.
- `any`로 경계를 뚫지 않는다. `unknown` + 타입가드 또는 실제 도메인 타입을 쓴다.

---

## 2. 현재 진행 상황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | storage boundary 분리 (schema/migrations/adapters/index) | ✅ 완료 |
| Phase 2 | internal domain model 도입 (`taskCards`, `timeBoxes`, `bigThree`, `selectors`) | ✅ 완료 |
| Phase 3 | category tree / stack canvas 모델 | ✅ 완료 |
| Phase 4 | domain command 추출 | ✅ 완료 |
| Phase 5 | `useDailyData.ts` 축소 (state owner + adapter) | ✅ 대부분 완료 |
| Phase 6 | DnD payload / timeline orchestration 통합 | ✅ 대부분 완료 |
| Phase 7 | feature / shared / app hook TS 전환 | ✅ 완료 |
| Phase 8 | root shell 정리 (`App.tsx`, shell layout, modal layer) | ✅ 대부분 완료 |
| Phase 9 | 후속 cleanup / 문서 동기화 / 추가 슬림화 | 🔄 현재 단계 |

**현재 해야 할 작업**
- 문서/운영 파일을 현재 코드와 맞춘다.
- exported prop type / alias 정리 같은 cleanup을 진행한다.
- 새 기능 착수 시에는 기존 경계를 깨지 않는지 먼저 확인한다.

> 전체 실행 기준선: [docs/FINAL_REFACTOR_EXECUTION_PLAN.md](/Users/bohyeong/Desktop/공부/project/musk/musk-timeboxing/docs/FINAL_REFACTOR_EXECUTION_PLAN.md)

---

## 3. 아키텍처 원칙

아래는 앞으로도 유지해야 할 목표 구조다.

### 3-1. entities 레이어 구분

`entities/planner` 안에서도 역할이 다르다.

| 경로 | 역할 | 사이드이펙트 |
|------|------|------------|
| `entities/planner/model/*` | 순수 함수 (command, selector, normalizer) | 없음 |
| `entities/planner/lib/storage/*` | persisted storage boundary | 있음 |
| `entities/planner/lib/storageServer.ts` | optional server sync boundary | 있음 |
| `entities/planner/lib/*` (나머지) | 순수 유틸/뷰 데이터 계산 | 없음 |

`model/`은 import해도 사이드이펙트가 없어야 한다. `lib/storage*`는 IO boundary라 예외적으로 side-effect가 허용된다.

### 3-2. SOLID 요약

**SRP**: 훅/컴포넌트는 하나의 책임만 가진다. 위반 신호: 훅 반환값이 과도하게 많고, 로컬 UI + 도메인 규칙 + persistence가 섞임.

**DIP**: UI 컴포넌트는 localStorage/fetch에 직접 의존하지 않는다. 스토리지 의존은 `entities/planner/lib/storage*`에만 둔다.

**ISP**: 사용하지 않는 prop을 전달하지 않는다. 큰 객체를 통째로 넘기지 말고 필요한 필드만 전달한다.

**OCP**: `shared/ui`는 `className` + `children` 합성으로 확장한다. 직접 수정 대신 wrapper 또는 composition을 우선한다.

### 3-3. SSOT

파생 데이터는 state로 저장하지 않고 렌더 타임 또는 selector에서 계산한다.

```tsx
// 나쁨
const [doneCount, setDoneCount] = useState(0)
useEffect(() => setDoneCount(timeBoxes.filter((t) => t.status === 'COMPLETED').length), [timeBoxes])

// 좋음
const doneCount = timeBoxes.filter((t) => t.status === 'COMPLETED').length
```

위반 신호:
- `useEffect`로 state A를 보고 state B를 계속 동기화함
- 같은 데이터가 2개 이상의 `useState`에 중복 저장됨

### 3-4. State Ownership

| 레이어 | 소유할 상태 |
|--------|------------|
| `App.tsx` | root orchestration, layout composition, modal composition |
| `src/app/hooks/*` | 날짜별 planner state, shell UI state, feature action orchestration |
| `src/features/*/ui` | 해당 feature 안에서만 쓰는 로컬 입력값/open state |
| `src/entities/planner/model/*` | 상태 없음 — 순수 함수만 |

### 3-5. features 간 import

UI composition 수준의 cross-feature import는 현재 구조에서 허용된다.

지킬 규칙:
- 새로운 **비즈니스 규칙**이나 **공유 selector/helper**는 feature 간 직접 공유하지 않는다.
- 그런 로직은 `entities/` 또는 `shared/`로 내린다.

---

## 4. TypeScript 이후 작업 규칙

TypeScript 마이그레이션 자체는 `src/` 기준으로 완료됐다. 이제는 **유지 단계**다.

우선순위:

1. `entities/planner/model/*` 타입 정확도 보강
2. `app/hooks/*` 반환 타입과 payload contract 정리
3. feature component prop/exported type 정리
4. 마지막으로 필요 시 `App.tsx` 추가 슬림화

커밋 규칙:

- 타입 정리만 하는 커밋과 로직 변경 커밋을 가능하면 분리한다.
- `.js`로 되돌아가는 새 파일을 추가하지 않는다.
- `Record<string, unknown>`는 임시 완충 타입으로만 두고, 후속 cleanup에서 실제 타입으로 좁힌다.

---

## 5. 작업 범위 가이드

### App.tsx

`App.tsx`는 이제 orchestration 중심 파일이다.

허용:
- shell-level composition 조정
- modal layer wiring 보정
- root selector 연결

주의:
- 새 도메인 규칙을 `App.tsx` 안에 직접 쓰지 않는다.
- `Timeline`, `PlanningCanvas`, `PlannerWorkspace` 내부 규칙을 루트에서 다시 구현하지 않는다.

### 스타일 규칙

`AI_FRONTEND_GUIDE.md` 참조.
다만 구조 후속 정리 단계에서는 시각적 취향보다 boundary 유지와 regression 방지가 우선이다.

### 절대 하지 말 것

- storage migration과 UI 개편을 한 PR에 섞지 않는다.
- persisted naming을 model/hooks/features로 다시 퍼뜨리지 않는다.
- 외부 상태 라이브러리(Redux, Zustand 등)를 도입하지 않는다.
- server sync를 `storageServer.ts` 바깥에서 직접 fetch로 우회하지 않는다.
- patch notes를 건드릴 때 static data shape를 깨뜨리지 않는다.

---

## 6. 작업 완료 기준 (Definition of Done)

1. `npm run typecheck` 통과
2. `npm run lint` 통과
3. `npm run build` 통과
4. 변경 축에 맞는 Playwright E2E 통과
5. localStorage 날짜별 독립성과 persisted migration 회귀가 없음
6. 사용자 체감 변경이면 `src/features/patch-notes/ui/patchNotesData.ts` 패치노트 반영
7. Conventional Commits 메시지로 커밋 (`feat`, `fix`, `refactor`, `chore`, `docs`)

---

## 7. 다음 우선순위

1. `AI_REFACTOR_GUIDE.md`와 [docs/FINAL_REFACTOR_EXECUTION_PLAN.md](/Users/bohyeong/Desktop/공부/project/musk/musk-timeboxing/docs/FINAL_REFACTOR_EXECUTION_PLAN.md) 상태를 계속 동기화
2. `App.tsx` 추가 분해가 실제로 필요한지 판단
3. `usePlannerMetaActions.ts`, `usePlannerTaskActions.ts`, `Timeline/index.tsx` 같은 완충 타입 구간을 더 구체화
4. 그다음 부모/자식 카테고리 UX 확장, 캔버스/일정 기능 확장 같은 실제 기능 작업 재개

---

## 8. 참조 문서

| 작업 종류 | 문서 |
|-----------|------|
| 실행 기준선 | [docs/FINAL_REFACTOR_EXECUTION_PLAN.md](/Users/bohyeong/Desktop/공부/project/musk/musk-timeboxing/docs/FINAL_REFACTOR_EXECUTION_PLAN.md) |
| 상세 구조 계획 | [docs/CATEGORY_TREE_TS_REFACTOR_PLAN.md](/Users/bohyeong/Desktop/공부/project/musk/musk-timeboxing/docs/CATEGORY_TREE_TS_REFACTOR_PLAN.md) |
| UI 변경 | `AI_FRONTEND_GUIDE.md` |
| FSD 경로 구조 | `docs/FSD_PHASE2_MAP.md` |
