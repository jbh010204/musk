# Musk Planner Task Execution Board (13 Tasks)

이 문서는 현재 합의된 작업(기존 5개 + 추가 8개)을 한 번에 처리하지 않고,
작업 단위를 쪼개서 순차 실행하기 위한 운영 보드다.

## 0. 운영 원칙

1. 한 번에 1개 Task만 진행한다.
2. 각 Task는 하위 태스크 단위로 구현한다.
3. Task 종료 시 반드시 `리뷰 + 검증 + 다음 Task 제안`을 함께 보고한다.
4. 중요 변경은 패치노트를 업데이트한다.
5. Task 종료 시 커밋/푸시 후 다음 Task로 넘어간다.

## 1. Task 종료 체크리스트 (반드시 매번 실행)

1. 구현 완료
2. 코드 리뷰(회귀/리스크 확인)
3. 검증 실행
   - `npm run lint`
   - `npm run build`
   - 필요 시 `npm run test:e2e` (DnD/모달/테마/타임라인 변경 포함)
4. 패치노트 업데이트 여부 판단 및 반영
5. 커밋/푸시
6. 아래 형식으로 보고
   - 구현
   - 리뷰
   - 검증
   - 다음 작업 추천(다음 Task ID)

## 2. 실행 상태 보드

- Current Task: `T7`
- Next Candidate: `T8`
- Blocker: `None`
- Completed:
  - `T1` FSD 1단계 구조 전환
  - `T2` 다크 모드 브레인덤프 면 분리
  - `T3` 주간 스트립 active 그라데이션 강조
  - `T4` 패치노트 테마 충돌/상세 밀림 수정
  - `T5` 30분 타임박스 태그/재생버튼 정렬
  - `T6` semantic 테마 토큰 통합(1차)
  - `T10` UI 레이아웃 회귀 E2E 추가
  - `T11` 접근성(ARIA/라이브 리전) 보강

## 3. Prioritized Task List

### T1. FSD 전환 1단계 (폴더 구조 개편 기반)
목표: 현재 구조를 깨지 않으면서 `features/shared/entities/app` 방향으로 이동 시작

하위 태스크:
1. 현재 파일 맵과 목표 파일 맵 정의
2. `features`/`shared` 기본 디렉터리 생성
3. 무동작 변경(파일 이동 + import 경로 교체) 1차
4. 배럴(index) 정리
5. dead import 제거

완료 기준(DoD):
- 동작 변화 없음
- 경로 정리 후 `lint/build` 성공

테스트:
- `npm run lint`
- `npm run build`
- 스모크: 앱 진입/날짜 이동/타임박스 생성

권장 커밋 메시지:
- `refactor(arch): start fsd phase-1 structure migration`

---

### T2. 다크 모드 브레인덤프 면 분리 강화
목표: 다크 모드에서 브레인덤프 아이템 경계/층위 인지성 개선

하위 태스크:
1. `ui-panel-subtle` dark tone 재정의
2. 브레인덤프 리스트/아이템 톤 대비 조정
3. hover/focus 상태 대비 점검
4. light/dark 양쪽 시각 점검

완료 기준(DoD):
- 다크 모드에서 각 아이템 분리가 즉시 인지됨
- 라이트 모드 회귀 없음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e` (light-mode + micro-interactions 관련)

권장 커밋 메시지:
- `fix(ui): improve dark-mode separation in brain-dump list`

---

### T3. 주간 스트립 현재 날짜 강조(그라데이션 경계)
목표: 현재 날짜 카드(active)를 더 명확히 강조

하위 태스크:
1. active 상태 ring/gradient edge 설계
2. inactive 카드 대비 약화
3. hover/focus와 충돌 없는지 확인
4. 모바일/데스크톱 모두 확인

완료 기준(DoD):
- active 날짜가 한눈에 식별됨
- 과도한 시각 노이즈 없음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/weekly-strip.spec.js`

권장 커밋 메시지:
- `feat(header): add gradient emphasis for active week date`

---

### T4. 패치노트 모달 테마 충돌/상세보기 밀림 수정
목표: 패치노트 모달의 light/dark 충돌 제거, 상세보기 레이아웃 안정화

하위 태스크:
1. gray 계열 직접 클래스 -> semantic token/슬레이트 톤 정리
2. 상세보기 토글 버튼 폭 안정화
3. 긴 텍스트 줄바꿈/줄간격 규칙 고정
4. 반응형(좁은 폭) 레이아웃 점검

완료 기준(DoD):
- 라이트/다크 모두 텍스트 가독성 확보
- 상세보기 토글 시 레이아웃 흔들림 없음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/patch-notes.spec.js`

권장 커밋 메시지:
- `fix(patch-notes): resolve theme conflicts and detail layout shift`

---

### T5. 30분 타임박스 레이아웃 통일 + 재생버튼 정렬
목표: 30분 카드에서도 태그/제목/상태/재생 버튼을 일관 배치

하위 태스크:
1. compact 레이아웃 규칙 정의(`#태그 -> 제목`)
2. 상태 배지와 재생 버튼을 동일 상단 라인에 정렬
3. 30/60/90분 높이별 텍스트 잘림 정책 정리
4. 클릭/드래그/DnD 이벤트 간섭 점검

완료 기준(DoD):
- 30분 카드에서 태그 우측 튐 현상 제거
- 재생 버튼이 상태 배지와 시각적으로 정렬됨

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/timer-mode.spec.js e2e/timebox-dnd.spec.js e2e/timeline-scale.spec.js`

권장 커밋 메시지:
- `fix(timeline): unify compact timebox layout and timer alignment`

---

### T6. 테마 토큰 통합(semantic tokens)
목표: light/dark 충돌을 줄이기 위해 색상/면/텍스트를 의미 기반 토큰화

하위 태스크:
1. 토큰 정의(배경/서피스/텍스트/보더/상태)
2. 기존 하드코딩 클래스 치환
3. 주요 컴포넌트(Header/Timeline/Modal) 우선 적용
4. 회귀 점검

완료 기준(DoD):
- gray 직접색 의존 감소
- 테마 전환 시 톤 일관성 확보

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/theme-toggle.spec.js e2e/light-mode-guideline.spec.js`

권장 커밋 메시지:
- `refactor(theme): consolidate semantic color tokens`

---

### T7. Shared UI 컴포넌트 추출
목표: 반복되는 버튼/카드/배지 스타일을 공통 컴포넌트로 통합

하위 태스크:
1. `shared/ui/Button`, `Card`, `Badge`, `IconButton` 생성
2. 기존 컴포넌트에서 점진 치환
3. props 규약 문서화
4. 스타일 회귀 점검

완료 기준(DoD):
- 공통 UI 재사용률 증가
- 클래스 중복 감소

테스트:
- `npm run lint`
- `npm run build`

권장 커밋 메시지:
- `refactor(ui): extract shared primitives for buttons and cards`

---

### T8. TimeBox 레이아웃 규격 매트릭스
목표: 카드 높이별(30/60/90+) 표시 우선순위를 규격화

하위 태스크:
1. 높이 구간별 콘텐츠 우선순위 정의
2. 렌더링 조건 함수로 분리
3. 타이머/상태/태그/텍스트 배치 규칙 문서화
4. 회귀 점검

완료 기준(DoD):
- 높이에 따라 흔들리던 레이아웃이 예측 가능해짐

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/timeline-scale.spec.js e2e/timer-mode.spec.js`

권장 커밋 메시지:
- `refactor(timebox): define height-based content matrix`

---

### T9. PatchNotes 컴포넌트 분해
목표: 단일 대형 컴포넌트를 분해해 유지보수성과 레이아웃 안정성 개선

하위 태스크:
1. `PatchNoteItem`, `PatchNoteDetail`, `PatchNoteHeader` 분리
2. 토글 상태/애니메이션 분리
3. 텍스트 wrapping 규칙 고정
4. 문서와 테스트 동기화

완료 기준(DoD):
- 코드 가독성 개선
- 상세보기 레이아웃 흔들림 재발 방지

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/patch-notes.spec.js`

권장 커밋 메시지:
- `refactor(patch-notes): split modal into stable subcomponents`

---

### T10. 시각 회귀 테스트 강화 (Playwright)
목표: 라이트/다크/타임라인 밀도 변화의 시각 회귀 자동 탐지

하위 태스크:
1. 핵심 화면 스냅샷 시나리오 정의
2. theme별 baseline 캡처
3. CI 또는 로컬 비교 기준 정리
4. false-positive 최소화 튜닝

완료 기준(DoD):
- 디자인 회귀를 테스트로 조기 탐지 가능

테스트:
- `npm run test:e2e`

권장 커밋 메시지:
- `test(e2e): add visual regression coverage for theme and timeline`

---

### T11. 접근성(A11y) 보강
목표: 키보드 탐색/포커스/명도 대비를 안정화

하위 태스크:
1. 버튼/입력 aria-label 점검
2. 포커스 링 일관화
3. 대비(contrast) 미달 구간 수정
4. 모달 포커스 트랩 점검

완료 기준(DoD):
- 주요 사용자 경로를 키보드만으로 수행 가능
- 포커스 위치가 항상 시각적으로 식별 가능

테스트:
- `npm run lint`
- `npm run build`
- 수동 키보드 점검 + 관련 e2e

권장 커밋 메시지:
- `fix(a11y): improve focus visibility and keyboard interaction`

---

### T12. Undo UX 도입 (삭제/상태변경)
목표: 파괴적 액션에 대한 복구 가능성 제공

하위 태스크:
1. 삭제 액션 Undo 토스트 설계
2. 상태변경(건너뜀/완료) Undo 옵션 설계
3. 만료 시간/중복 액션 정책 정의
4. localStorage 일관성 검증

완료 기준(DoD):
- 주요 파괴 액션에서 되돌리기 가능
- 저장 데이터 불일치 없음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e` (신규 시나리오 포함)

권장 커밋 메시지:
- `feat(ux): add undo flow for destructive actions`

---

### T13. FSD 전환 2단계 + 정리
목표: 남은 화면/훅/유틸을 FSD 경계에 맞춰 정리하고 문서 동기화

하위 태스크:
1. `features/entities/shared/app` 최종 경계 점검
2. 잔여 import alias/상대경로 정리
3. README/SESSION_PLAYBOOK 구조 문서 업데이트
4. 회귀 테스트

완료 기준(DoD):
- 구조가 문서와 일치
- 신규 세션이 즉시 구조 파악 가능

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e`

권장 커밋 메시지:
- `refactor(arch): complete fsd phase-2 migration and docs sync`

## 4. 보고 템플릿 (Task 완료 시)

아래 4블록을 고정 사용한다.

1. 구현: 변경 파일 + 핵심 변경
2. 리뷰: 발견 이슈/리스크(없으면 없음 명시)
3. 검증: 실행 명령 + 통과 여부
4. 다음 작업 추천: `다음 Task ID` + 착수 이유
