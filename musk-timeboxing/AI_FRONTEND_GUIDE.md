# AI Frontend Guide v2.0

이 문서는 프로젝트의 시각적 일관성과 기능적 안정성을 위한 최상위 기술 지침서입니다.

## 0. Agent Profile

- Name: `Front-end UX Guardian`
- Role: `Senior Frontend Engineer specializing in Minimalist UI/UX (Toss-style)`
- UI 변경 시 `.agents/FRONTEND_UX_GUARDIAN.md`와 본 문서를 함께 따른다.

## 1. Visual Rules

### Border & Focus 정책
- 정보성 카드(`Card`, `List Item`): `border` 사용을 지양하고 surface로 구분한다.
  - Light: `bg-white shadow-sm`
  - Dark: `bg-slate-900 shadow-none`
- 예외: 기능적 경계가 필요한 경우(`Timeline grid`, `DnD drop preview`, `focus-visible outline`)는 목적성 있는 선을 허용한다.
- 폼 요소(`Input`, `Select`, `Button`): 인터랙션 요소는 `focus:ring-2` 또는 포커스 상태의 `border`로 상태 변화를 명확히 제공한다.

### 테마 및 색상 (Light/Dark Mode)
- 모든 배경색 변화는 라이트/다크 쌍으로 정의한다.
- 예: `hover:bg-slate-50 dark:hover:bg-slate-800`
- 보조 텍스트 기본값: `text-slate-500 dark:text-slate-400`

### Radius
- 카드 기본 반경: `rounded-2xl` (12px)

## 2. Scope

아래 명칭의 컴포넌트 작업 시 이 가이드를 우선 적용한다.

- Navigation: `Header`, `FAB (Floating Action Button)`
- Dashboard: `WeeklyStrip`, `BrainDump`, `Big3`, `TimelineCard`
- Elements: `Input`, `Button`, `Badge`

## 2-1. Interaction Vibe

- Feedback: 클릭 가능한 요소는 `transition-all` + subtle hover 적용
- Focus: 입력 계열은 `focus:outline-none focus:ring-2 focus:ring-blue-500` 유지
- Loading: Timeline 같은 정보량 큰 영역은 blank screen 대신 Skeleton UI를 우선 고려

## 2-2. Component Fixed Rules

- `Big3`: 진행률 강조는 브랜드 블루(`#3182F6`) 계열을 기본 사용
- `TimelineCard`: DnD 핸들러/이벤트 구조는 사용자 합의 없이 리팩토링 금지

## 3. Definition of Done (DoD)

코드 생성/수정 시 아래 항목을 모두 충족해야 한다.

- Spacing: 카드 내부 패딩 `p-6` 이상, 섹션 간 간격 `gap-6`
- Typography: 주요 지표(수치) `text-xl` 이상 + `font-bold`, 보조 정보 `text-sm`
- Theme Pairing: 호버/활성 상태 클래스는 라이트/다크 쌍으로 정의
- Regression Check:
  - 타임박스 상태색(예정/완료/스킵) 시스템 컬러 유지
  - DnD 로직 및 접근성 속성(`aria-*`, 포커스 가능 버튼) 훼손 금지
- Validation Commands:
  - `npm run lint`
  - `npm run build`
  - `npm run test:e2e`

## 4. Anti-Regression

- 신규 기능으로 기존 UI 여백/톤앤매너가 깨질 가능성이 있으면, 구현 전 사용자와 범위를 먼저 합의한다.
- E2E 대상 컴포넌트 변경 시 기능 무결성을 최우선으로 한다.
- 시각 리팩토링은 가능하면 작업 단위를 분리해 커밋한다.

## 5. Code Constraints

- Framework: React + Tailwind CSS (Utility-first)
- Structure: 공통 UI는 `src/components/common` 원자 단위 컴포넌트로 분리하는 것을 우선한다.
- Clarity: 매직 넘버(`margin-top: 13px`) 금지, Tailwind 표준 스케일 사용
