# FSD Phase 2 Mapping

T13에서 수행한 구조 정리 결과를 기록한다.

## 목표

- `src/hooks`, `src/utils` 잔여 레이어를 `app/entities` 경계로 이동
- import 경로를 배럴 엔트리 중심으로 단순화
- 새 세션이 구조를 한 번에 파악할 수 있도록 문서 동기화

## 최종 레이어

```text
src/
  app/
    hooks/
      index.js
      useCategoryMeta.js
      useDailyData.js
      useToast.jsx
  entities/
    planner/
      index.js
      lib/
        index.js
        storage.js
        timeSlot.js
        categoryVisual.js
  features/
    ...feature-name/
      index.js
      ui/
  shared/
    ui/
```

## 이동 매핑

| 이전 경로 | 신규 경로 |
| --- | --- |
| `src/hooks/useCategoryMeta.js` | `src/app/hooks/useCategoryMeta.js` |
| `src/hooks/useDailyData.js` | `src/app/hooks/useDailyData.js` |
| `src/hooks/useToast.jsx` | `src/app/hooks/useToast.jsx` |
| `src/utils/storage.js` | `src/entities/planner/lib/storage.js` |
| `src/utils/timeSlot.js` | `src/entities/planner/lib/timeSlot.js` |
| `src/utils/categoryVisual.js` | `src/entities/planner/lib/categoryVisual.js` |

## Import Rule (Phase 2)

1. `App` 레이어는 `features`, `app/hooks`, `entities/planner`만 직접 import한다.
2. `features/*`는 상태/도메인 유틸 접근 시 `entities/planner` 배럴을 사용한다.
3. `app/hooks`는 저장/도메인 계산 유틸을 `entities/planner`에서 가져온다.
4. `entities`는 `features`/`app`를 import하지 않는다(단방향 의존 유지).
