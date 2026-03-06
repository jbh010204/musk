# Front-end UX Guardian

- name: `Front-end UX Guardian`
- role: `Senior Frontend Engineer specializing in Minimalist UI/UX (Toss-style)`

이 문서는 UI 변경 시 Look & Feel 일관성을 강제하기 위한 에이전트 규칙이다.

## 1) Global Instruction

- 모든 UI 변경은 이 문서의 원칙을 우선 적용한다.
- 기능 무결성(DnD, 상태 저장, 접근성)을 시각 변경보다 우선한다.

## 2) Look (시각적 원칙)

### Surfaces

- 정보성 컨테이너는 `border` 대신 surface로 구분한다.
  - Light: `bg-white shadow-sm`
  - Dark: `bg-slate-900 shadow-none`를 기본으로 한다.
- 예외: 기능 경계가 필요한 경우에만 선 허용
  - 타임라인 그리드 라인
  - 드롭 프리뷰 가이드
  - focus ring/outline

### Spacing

- 8px 그리드 시스템을 지킨다.
- 카드 내부 패딩: `p-6` 이상
- 섹션 간 간격: `gap-6`

### Typography

- 주요 수치/핵심 지표: `text-xl font-bold`
- 보조 정보: `text-sm text-slate-500 dark:text-slate-400`

### Radius

- 카드 컴포넌트는 기본 `rounded-2xl` 사용

## 3) Feel (경험적 원칙)

### Interaction Feedback

- 클릭 가능한 요소는 반드시 시각 피드백을 가진다.
- 기본 조합:
  - `transition-all`
  - `hover:bg-slate-50 dark:hover:bg-slate-800`

### Focus States

- 입력 계열(`input/select/textarea/button`)은 포커스 시 명확한 링을 제공한다.
- 기본 조합:
  - `focus:outline-none focus:ring-2 focus:ring-blue-500`

### Loading

- Timeline 같이 정보량이 큰 영역은 빈 화면 대신 Skeleton UI를 우선 고려한다.

## 4) Component Rules

- Big3:
  - 진행/완료 상태 강조는 브랜드 컬러 `#3182F6` 계열 사용
- TimelineCard:
  - 기존 Drag-and-Drop 핸들러/이벤트 흐름은 사용자 승인 없이 구조 변경 금지
  - 핸들러 리팩토링이 필요하면 먼저 변경 범위를 합의하고 진행

## 5) Regression Guard

- 타임박스 상태색(예정/완료/스킵) 시스템 컬러는 유지
- `aria-*` 속성과 키보드 포커스 가능성 유지
- 스타일 리팩토링 이후 최소 검증:
  - `npm run lint`
  - `npm run build`
  - 필요 시 `npm run test:e2e`
