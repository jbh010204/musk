# FSD Phase 1 Mapping

이 문서는 T1(구조 개편 1단계)에서 수행한 무동작 파일 이동 매핑이다.

## 목적

- `src/components/*` 중심 구조를 `src/features/*/ui` 중심 구조로 1차 정렬
- 동작 변경 없이 import 경로만 교체

## 이동 매핑

| 이전 경로 | 신규 경로 |
| --- | --- |
| `src/components/Header.jsx` | `src/features/header/ui/Header.jsx` |
| `src/components/Category/CategoryManagerModal.jsx` | `src/features/category/ui/CategoryManagerModal.jsx` |
| `src/components/Data/DataTransferModal.jsx` | `src/features/data-transfer/ui/DataTransferModal.jsx` |
| `src/components/Floating/FloatingActionDock.jsx` | `src/features/floating/ui/FloatingActionDock.jsx` |
| `src/components/PatchNotes/*` | `src/features/patch-notes/ui/*` |
| `src/components/LeftPanel/BrainDump/*` | `src/features/brain-dump/ui/*` |
| `src/components/LeftPanel/BigThree/*` | `src/features/big-three/ui/*` |
| `src/components/Timeline/*` | `src/features/timeline/ui/*` |

## Feature Entry Points

- `src/features/header/index.js`
- `src/features/category/index.js`
- `src/features/data-transfer/index.js`
- `src/features/floating/index.js`
- `src/features/patch-notes/index.js`
- `src/features/brain-dump/index.js`
- `src/features/big-three/index.js`
- `src/features/timeline/index.js`

## App Import Rule (Phase 1)

`src/App.jsx`는 더 이상 `src/components/*`를 직접 참조하지 않고,
`src/features/*` 엔트리만 참조한다.
