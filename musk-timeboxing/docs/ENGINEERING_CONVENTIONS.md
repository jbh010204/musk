# Engineering Conventions

프로젝트 일관성을 위해 아래 외부 규칙을 채택한다.

## 1) Commit & Versioning

- Conventional Commits 1.0.0
- Semantic Versioning 2.0.0
- Keep a Changelog 1.1.0 형식

적용 규칙:

- `feat`: 사용자 기능 추가/확장
- `fix`: 버그 수정
- `docs`: 문서 수정
- `chore`: 빌드/도구/환경 변경
- 브레이킹 변경은 footer에 `BREAKING CHANGE:` 명시

패치노트 반영 규칙:

- 중요 변경은 커밋 단위로 패치노트 반영을 기본으로 한다.
- 위치: `src/components/PatchNotes/patchNotesData.js`
- 작성 필수 필드: `version`, `date`, `title`, `summary`, `focus`, `improvements`, `validation`
- 최신 버전 항목은 배열 최상단에 유지한다.

## 2) React State Rules

- Effect 남용 금지: 계산/동기화가 아닌 로직은 이벤트 핸들러로 이동
- 모달/폼 초기화가 필요할 때는 컴포넌트 `key` 활용
- 저장 payload는 입력 정규화(trim/null 처리) 후 업데이트

## 3) DnD Accessibility Rules

- 드래그 activator는 포커스 가능한 요소 사용(button 우선)
- 키보드 상호작용(Enter/Space/Escape) 동작을 깨지 않게 유지
- 드래그와 클릭 충돌 시 클릭 오작동 방지 처리

## 4) Testing Strategy

- 변경마다 최소:
  - `npm run lint`
  - `npm run build`
- UI 행위 중심 테스트 우선 (사용자 관점)
- 핵심 회귀 시나리오:
  - 타임박스 생성/이동/리사이즈/겹침방지
  - 카테고리 FAB 진입, 카테고리 CRUD, 타임박스 카테고리 반영
  - 완료/건너뜀/실제시간 저장
  - 일정명/카테고리 수정
  - 날짜별 localStorage 분리

## 5) Category Rules

- 카테고리 마스터 데이터는 `musk-planner-meta`에 저장
- 타임박스는 `categoryId`로 참조하고, legacy `category` 문자열은 점진적으로 제거
- 카테고리 삭제 시 현재 날짜 타임박스의 동일 `categoryId`는 `null`로 해제
- 카테고리 색상은 타임박스 카드의 좌측 컬러 바와 배지에 함께 반영

## 6) Deployment Rules

- 정적 배포만 허용
- `vite.config.js`의 `base: './'` 유지

## 7) Patch Note Trigger Rules

아래 항목은 패치노트 업데이트를 트리거한다.

- UI/UX 레이아웃, 디자인 토큰, 인터랙션 정책 변경
- 타임라인/드래그앤드롭/모달/저장 흐름 수정
- E2E 기준 시나리오 추가 또는 기대값 변경
- 사용자에게 전달하는 운영 가이드/워크플로의 규칙 변경

## Reference Links

- Conventional Commits: https://www.conventionalcommits.org/en/v1.0.0/
- Semantic Versioning: https://semver.org/spec/v2.0.0.html
- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- React (You Might Not Need an Effect): https://react.dev/learn/you-might-not-need-an-effect
- React (Preserving and Resetting State): https://react.dev/learn/preserving-and-resetting-state
- dnd-kit Accessibility: https://docs.dndkit.com/guides/accessibility
- Testing Library Guiding Principles: https://testing-library.com/docs/guiding-principles/
- Vite Static Deploy: https://vite.dev/guide/static-deploy.html
