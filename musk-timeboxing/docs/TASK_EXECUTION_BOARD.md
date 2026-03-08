# Musk Planner Task Execution Board (59 Tasks)

이 문서는 현재 합의된 작업을 한 번에 처리하지 않고,
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

- Current Task: `None`
- Next Candidate: `None`
- Blocker: `None`
- Completed:
  - `T1` FSD 1단계 구조 전환
  - `T2` 다크 모드 브레인덤프 면 분리
  - `T3` 주간 스트립 active 그라데이션 강조
  - `T4` 패치노트 테마 충돌/상세 밀림 수정
  - `T5` 30분 타임박스 태그/재생버튼 정렬
  - `T6` semantic 테마 토큰 통합(1차)
  - `T7` Shared UI primitive 추출/핵심 화면 치환
  - `T8` TimeBox 높이별 레이아웃 매트릭스 적용
  - `T9` PatchNotes 컴포넌트 분해(Item/Header/Detail)
  - `T10` UI 레이아웃 회귀 E2E 추가
  - `T11` 접근성(ARIA/라이브 리전) 보강
  - `T12` Undo UX(삭제/상태변경) 도입
  - `T13` FSD 2단계 경계 정리 + 문서 동기화
  - `T14` 빅3 자동 채우기(BrainDump -> Big3)
  - `T15` 타임라인 집중 모드
  - `T16` 타임라인 필터(상태/카테고리)
  - `T17` 타임박스 복제 액션
  - `T18` 데이터 파일 입출력 강화
  - `T19` 주간 캘린더 뷰
  - `T20` 월간 캘린더 뷰
  - `T21` 브레인 덤프 priority 스키마
  - `T22` 브레인 덤프 priority 배터리 UI
  - `T23` 브레인 덤프 priority 기반 자동 정렬
  - `T24` 브레인 덤프 priority 기반 빅3 추천
  - `T25` priority E2E/문서/패치노트 동기화
  - `T26` 브레인 덤프 priority 레이아웃 압축
  - `T27` 브레인 덤프 priority 정렬 UX 완화
  - `T28` 월간 heatmap 데이터 스냅샷
  - `T29` 월간 heatmap UI/범례
  - `T30` 월간 heatmap E2E/문서/패치노트 동기화
  - `T31` 주간 스트립 3주 캐러셀 확장
  - `T32` 주간 스트립 drag-to-scroll
  - `T33` 주간 스트립 클릭/드래그 threshold 보정
  - `T34` 주간 스트립 E2E/문서/패치노트 동기화
  - `T35` 주간 스트립 drag smoothing/inertia
  - `T36` 주간 스트립 smoothing 회귀 검증
  - `T41` 주간 스트립 날짜 클릭 복구
  - `T42` 주간 스트립 카드 폭/드래그 감도 재조정
  - `T43` Docker 저장소 자동 주기 동기화
  - `T44` 타임박스 clipping 재현 회귀 테스트
  - `T45` TimeBoxCard frame/surface/content 분리
  - `T46` 타임박스 높이별 레이아웃 토큰 재정의
  - `T47` 리사이즈 핸들 시각 분리
  - `T48` 타임박스 배경 불투명도 조정
  - `T49` 타임박스 seam 회귀/문서 동기화
  - `T50` 저장 상태 배지
  - `T51` 타임박스/캘린더 카드 DOM 접근성 정리
  - `T52` 퀵 템플릿 관리
  - `T53` 주간/월간 빠른 일정 추가
  - `T54` 라이트 모드 surface hierarchy 재정의
  - `T55` 타임라인 상단 컨트롤 hierarchy 재배치
  - `T56` 주간/월간 quick add 액션 약화
  - `T57` 헤더 우측 상태/유틸리티 액션 분리
  - `T58` 브레인 덤프 density 재조정
  - `T59` Big3 density/빈 슬롯 힌트 개선

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

### T19. 주간 캘린더 뷰
목표: 현재 주간 계획을 날짜 카드 형태로 한 화면에 확인하고, 날짜 클릭 시 일간 보기로 점프

하위 태스크:
1. 주간 요약 스냅샷 유틸 추가
2. 주간 캘린더 카드 UI 구현
3. 타임라인 뷰 모드 토글(일간/주간) 연결
4. 셀 클릭 시 해당 날짜로 이동하는 흐름 연결
5. E2E 시나리오 추가

완료 기준(DoD):
- 주간 단위 일정 수/완료율/계획 시간/미리보기 확인 가능
- 클릭 시 해당 날짜 일간 타임라인으로 복귀

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/weekly-calendar-view.spec.js`

권장 커밋 메시지:
- `feat(calendar): add weekly planner overview`

---

### T20. 월간 캘린더 뷰
목표: 월간 계획을 5~6주 그리드로 요약해서 보고, 날짜 클릭 시 일간 보기로 점프

하위 태스크:
1. 월간 요약 스냅샷 유틸 추가
2. 월간 캘린더 그리드 UI 구현
3. 타임라인 뷰 모드 토글(일간/월간) 연결
4. 현재 날짜/현재 월 외 날짜 표현 구분
5. E2E 시나리오 추가

완료 기준(DoD):
- 월 전체 계획을 한 화면에서 스캔 가능
- 현재 날짜 강조와 비활성 월 셀 구분이 명확함
- 클릭 시 해당 날짜 일간 타임라인으로 복귀

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/monthly-calendar-view.spec.js`

권장 커밋 메시지:
- `feat(calendar): add monthly planner overview`

---

### T21. 브레인 덤프 priority 스키마
목표: 브레인 덤프 아이템에 중요도(priority)를 저장하고 기존 데이터도 안전하게 마이그레이션

하위 태스크:
1. brainDump priority 유틸 정의
2. storage load/save 시 priority 정규화
3. 기존 저장 데이터 priority 기본값(0) 보정
4. 훅의 복구/생성 경로 정규화

완료 기준(DoD):
- 모든 브레인 덤프 아이템이 `priority: 0~4`를 안정적으로 가짐
- 기존 localStorage 데이터가 깨지지 않음

테스트:
- `npm run lint`
- `npm run build`

권장 커밋 메시지:
- `feat(brain-dump): add persistent priority schema`

---

### T22. 브레인 덤프 priority 배터리 UI
목표: 각 브레인 덤프 아이템에서 중요도를 즉시 인지하고 한 번 클릭으로 조정 가능하게 만들기

하위 태스크:
1. 배터리형 priority 컨트롤 구현
2. priority 단계별 라벨/시각 톤 정리
3. hover 액션과 분리해 항상 표시
4. 접근성 라벨 추가

완료 기준(DoD):
- 배터리 컨트롤만 보고도 중요도 단계가 인지됨
- 클릭 시 다음 단계로 순환

테스트:
- `npm run lint`
- `npm run build`

권장 커밋 메시지:
- `feat(brain-dump): add battery-style priority control`

---

### T23. 브레인 덤프 priority 기반 자동 정렬
목표: 중요도 높은 항목이 상단으로 올라오도록 자동 정렬

하위 태스크:
1. stable sort 규칙 정의(priority desc, 기존 순서 유지)
2. priority 변경 시 재정렬
3. load/restore 후에도 정렬 일관성 유지

완료 기준(DoD):
- 중요도 변경 시 리스트가 즉시 재정렬됨
- 같은 priority 그룹은 기존 순서를 유지

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/brain-dump-priority.spec.js`

권장 커밋 메시지:
- `feat(brain-dump): sort items by priority`

---

### T24. 브레인 덤프 priority 기반 빅3 추천
목표: 빅3 추천 채우기가 중요도 상위 항목을 우선 선택하도록 변경

하위 태스크:
1. 기존 자동 채우기 로직을 priority 기준으로 전환
2. 버튼 라벨/가이드 문구를 추천 의미로 변경
3. 중복 sourceId 제외 규칙 유지

완료 기준(DoD):
- 빅3 추천채우기가 중요도 상위 항목부터 빈 슬롯을 채움
- 기존 Big3 직접입력/수동추가 흐름과 충돌 없음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/bigthree-autofill.spec.js`

권장 커밋 메시지:
- `feat(big3): recommend top-priority brain dump items`

---

### T25. priority E2E/문서/패치노트 동기화
목표: priority 기능을 세션 문서와 회귀 테스트에 반영

하위 태스크:
1. priority 정렬 E2E 추가
2. README 사용 설명 추가
3. 패치노트 업데이트
4. Task Board 완료 상태 반영

완료 기준(DoD):
- 새 세션이 문서만 읽어도 priority 흐름을 이해 가능
- 정렬/추천 로직 회귀가 자동 검출됨

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1`

권장 커밋 메시지:
- `docs(priority): sync tests notes and execution board`

---

### T26. 브레인 덤프 priority 레이아웃 압축
목표: priority 배터리 시각은 유지하면서 텍스트 가독성을 높이기 위해 좌측 점유 폭을 줄이기

하위 태스크:
1. 배터리 컨트롤 크기 축소
2. priority 라벨 상시 노출 제거
3. 본문을 2줄까지 표시하는 clamp 규칙 적용

완료 기준(DoD):
- 긴 텍스트가 한 줄 `...`로 과도하게 잘리지 않음
- 배터리 시각은 유지하되 리스트 밀도가 과하지 않음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/brain-dump-priority.spec.js`

권장 커밋 메시지:
- `refactor(brain-dump): compact priority battery layout`

---

### T27. 브레인 덤프 priority 정렬 UX 완화
목표: priority 변경 시 항목이 즉시 위로 튀는 문제를 제거하고 추천/재진입에서만 정렬 기준을 반영

하위 태스크:
1. priority 변경 시 현재 배열 순서 유지
2. 추천채우기 로직은 priority 정렬 유지
3. 재진입(load) 시 정렬 상태 복원
4. 문구/테스트 기대값 수정

완료 기준(DoD):
- priority 조정 중 현재 리스트 위치가 유지됨
- Big3 추천과 재진입 시에는 priority 순이 반영됨

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/brain-dump-priority.spec.js e2e/bigthree-autofill.spec.js`

권장 커밋 메시지:
- `fix(brain-dump): delay priority sorting until reload or recommendation`

---

### T28. 월간 heatmap 데이터 스냅샷
목표: 월간 셀별로 대표 카테고리와 완료율/밀도 강도를 계산할 수 있는 스냅샷 데이터 추가

하위 태스크:
1. 월간 셀별 category mix 집계
2. 대표 카테고리(dominant category) 계산
3. 완료율/밀도 기반 heat level 계산
4. 월간 범례용 카테고리 집계 추가

완료 기준(DoD):
- 월간 셀 데이터에 대표 카테고리, category mix, heat level이 포함됨
- 현재 월 기준 범례/요약 데이터 계산 가능

테스트:
- `npm run lint`
- `npm run build`

권장 커밋 메시지:
- `feat(calendar): add monthly heatmap snapshot data`

---

### T29. 월간 heatmap UI/범례
목표: 월간 캘린더에서 대표 카테고리 색과 완료율/밀도 강도를 바로 인지할 수 있는 UI 추가

하위 태스크:
1. 셀 배경에 카테고리 tint overlay 적용
2. 대표 카테고리 배지와 category mix bar 표시
3. 월간 범례/요약 배지 추가
4. 현재 날짜 강조와 충돌 없는지 조정

완료 기준(DoD):
- 월간 뷰를 훑기만 해도 바쁜 날/카테고리 분포/완료율 강도를 파악 가능
- light/dark 모두 가독성 유지

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/monthly-calendar-view.spec.js`

권장 커밋 메시지:
- `feat(calendar): visualize monthly heatmap by category and completion`

---

### T30. 월간 heatmap E2E/문서/패치노트 동기화
목표: 월간 heatmap 기능을 테스트와 세션 문서에 반영

하위 태스크:
1. heatmap E2E 추가
2. README 월간 뷰 설명 보강
3. 패치노트 기록 추가
4. Task Board 완료 상태 반영

완료 기준(DoD):
- category heatmap 회귀가 자동 검출됨
- 새 세션이 문서만 읽어도 월간 heatmap 기능을 이해 가능

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1`

권장 커밋 메시지:
- `docs(calendar): sync monthly heatmap notes and tests`

---

### T31. 주간 스트립 3주 캐러셀 확장
목표: 헤더의 주간 스트립을 현재 주 7칸 고정에서 이전/현재/다음 주를 함께 훑는 가로 캐러셀로 확장

하위 태스크:
1. 주간 스트립 데이터 범위를 21일로 확장
2. 현재 날짜 중심으로 뷰포트 정렬
3. 카드 폭/간격을 캐러셀 구조에 맞게 재조정

완료 기준(DoD):
- 주간 스트립에서 이전/다음 주 날짜가 같은 행에 존재
- 현재 날짜가 진입 시 중앙 근처에 위치

테스트:
- `npm run lint`
- `npm run build`

권장 커밋 메시지:
- `feat(header): expand weekly strip into three-week carousel`

---

### T32. 주간 스트립 drag-to-scroll
목표: 데스크톱 마우스 드래그와 모바일 스와이프로 주간 스트립을 자연스럽게 훑을 수 있게 만들기

하위 태스크:
1. 가로 overflow 캐러셀 구조 적용
2. 마우스 포인터 drag-to-scroll 추가
3. 터치 스와이프는 native horizontal scroll 유지
4. grab/grabbing 시각 피드백 추가

완료 기준(DoD):
- 마우스로 주간 스트립을 좌우로 끌어 스크롤 가능
- 모바일에서 손가락 스와이프로 자연스럽게 이동

테스트:
- `npm run lint`
- `npm run build`

권장 커밋 메시지:
- `feat(header): add drag-to-scroll for weekly strip`

---

### T33. 주간 스트립 클릭/드래그 threshold 보정
목표: 드래그 직후 날짜가 오작동으로 클릭되지 않도록 threshold와 suppress-click 정책 보강

하위 태스크:
1. 클릭/드래그 분리 기준 픽셀 정의
2. 드래그 후 1회 클릭 억제
3. 날짜 클릭 이동은 유지

완료 기준(DoD):
- 짧은 클릭은 날짜 이동
- 드래그 후에는 잘못된 날짜 이동이 발생하지 않음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1 e2e/weekly-strip-carousel.spec.js`

권장 커밋 메시지:
- `fix(header): separate click and drag behavior in weekly strip`

---

### T34. 주간 스트립 E2E/문서/패치노트 동기화
목표: 캐러셀 주간 스트립 기능을 회귀 테스트와 세션 문서에 반영

하위 태스크:
1. drag-to-scroll E2E 추가
2. 기존 direct date jump E2E 보강
3. README 사용 의도 추가
4. 패치노트 기록 추가

완료 기준(DoD):
- 캐러셀 스크롤과 날짜 클릭 회귀가 자동 검출됨
- 새 세션이 문서만 읽어도 주간 스트립 상호작용을 이해 가능

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1`

권장 커밋 메시지:
- `docs(header): sync weekly strip carousel notes and tests`

---

### T35. 주간 스트립 drag smoothing/inertia
목표: 마우스 drag-to-scroll이 뚝뚝 끊기지 않도록 보간과 release 후 관성 이동을 추가

하위 태스크:
1. pointer move 기반 목표 scroll 위치 추적
2. requestAnimationFrame 보간 적용
3. release 후 velocity 감쇠 기반 inertia 추가
4. snap 강도를 완화해 끊김 감소

완료 기준(DoD):
- 드래그 중 가로 이동이 즉시 부드럽게 따라옴
- 손을 놓은 뒤 약한 관성 이동이 이어짐

테스트:
- `npm run lint`
- `npm run build`

권장 커밋 메시지:
- `fix(header): smooth weekly strip dragging with inertia`

---

### T36. 주간 스트립 smoothing 회귀 검증
목표: smoothing 보정 이후 drag와 date jump 회귀가 없는지 다시 고정

하위 태스크:
1. 기존 weekly-strip/weekly-strip-carousel 회귀 재검증
2. 문구/README 업데이트
3. 패치노트 기록 추가

완료 기준(DoD):
- 스크롤과 날짜 클릭이 모두 유지됨
- 새 세션이 smoothing 추가 배경을 문서에서 확인 가능

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1`

권장 커밋 메시지:
- `docs(header): sync weekly strip smoothing updates`

---

### T41. 주간 스트립 날짜 클릭 복구
목표: drag-to-scroll 도입 이후 날짜 카드 직접 클릭이 막히지 않도록 click과 drag를 다시 분리

하위 태스크:
1. pointer capture 시점을 drag threshold 이후로 이동
2. click suppression이 실제 drag 종료 시에만 동작하도록 보정
3. 날짜 이동 검증 기준을 header/last-date 상태 기반으로 강화
4. 회귀 테스트로 직접 date jump를 재검증

완료 기준(DoD):
- 주간 스트립 날짜 클릭이 즉시 해당 일자로 이동
- drag 후에는 accidental click이 다시 발생하지 않음

테스트:
- `npm run lint`
- `npm run test:e2e -- --workers=1 e2e/weekly-strip.spec.js e2e/weekly-strip-carousel.spec.js`

권장 커밋 메시지:
- `fix(header): restore direct date clicks in weekly strip`

---

### T42. 주간 스트립 카드 폭/드래그 감도 재조정
목표: 3주 캐러셀 구조를 유지하면서도 카드 밀도와 drag 반응성을 1주 레이아웃에 가까운 체감으로 보정

하위 태스크:
1. 날짜 카드 폭을 더 넉넉하게 조정
2. drag 중 포인터와 scroll을 직접 동기화해 지연 감소
3. release 이후에만 관성을 적용하고 감쇠값 재조정
4. 스트립 상단/하단 패딩을 보강해 카드 잘림 인상 제거

완료 기준(DoD):
- 드래그 중 스트립이 손을 바로 따라옴
- 날짜 카드가 상단에서 잘려 보이지 않음
- 기존 날짜 클릭 및 전체 planner 플로우 회귀 없음

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1`

권장 커밋 메시지:
- `fix(header): rebalance weekly strip card sizing and drag response`

---

### T43. Docker 저장소 자동 주기 동기화
목표: 서버 저장소를 쓰는 Docker 모드에서 변경 사항이 주기적으로 자동 체크포인트 되도록 보강

하위 태스크:
1. local 변경 시 dirty 상태를 추적
2. 서버 write queue와 full snapshot sync를 한 레일로 직렬화
3. 약 20초 간격 자동 sync + online/visibility 복귀 시 즉시 재시도
4. 데이터 모달/README/영속화 문서에 운영 방식 반영

완료 기준(DoD):
- 서버가 잠깐 내려가도 다음 auto-sync 주기에서 snapshot이 다시 반영됨
- 수동 sync 버튼 없이도 Docker volume이 지속적으로 최신 상태를 따라감
- 문서만 읽어도 auto-sync 동작 시점과 설정 키를 이해 가능

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1`
- temp API 환경에서 auto-sync smoke 확인

권장 커밋 메시지:
- `feat(storage): add scheduled auto-sync for docker persistence`

---

### T44. 타임박스 clipping 재현 회귀 테스트
목표: 90분 카드 아래 30분 카드가 붙을 때 내용이 잘리거나 seam이 과하게 드러나는 케이스를 고정

하위 태스크:
1. stacked timebox fixture를 localStorage로 주입
2. compact 카드의 content/handle bounding box 검증
3. 기본 상태에서 handle이 숨겨지는지 확인

완료 기준(DoD):
- compact 카드 본문이 카드 높이 밖으로 넘치지 않음
- hover 전 seam/handle이 상시 떠 있지 않음

테스트:
- `npm run test:e2e -- --workers=1 e2e/ui-layout-regression.spec.js`

권장 커밋 메시지:
- `test(timeline): lock stacked timebox clipping regression`

---

### T45. TimeBoxCard frame/surface/content 분리
목표: absolute 배치 프레임과 실제 카드 표면/본문/핸들을 분리해 clipping 원인을 줄이기

하위 태스크:
1. outer frame은 위치 계산만 담당
2. inner surface에만 rounded/shadow/background 적용
3. content와 handle 레이어를 서로 분리

완료 기준(DoD):
- 카드 높이 계산은 유지
- 내부 레이어가 서로 겹치지 않음

테스트:
- `npm run lint`
- `npm run test:e2e -- --workers=1 e2e/ui-layout-regression.spec.js`

권장 커밋 메시지:
- `refactor(timeline): separate timebox frame from content surface`

---

### T46. 타임박스 높이별 레이아웃 토큰 재정의
목표: compact/medium/spacious별 고정 margin/padding 의존을 줄이고 높이에 맞는 텍스트 우선순위를 다시 정의

하위 태스크:
1. compact는 수직 중앙 정렬 + 제목 1줄 우선
2. medium은 핵심 요약 1라인만 노출
3. spacious만 보조 정보 2라인 허용

완료 기준(DoD):
- 30분 카드에서 텍스트 잘림이 줄어듦
- 60분/90분 카드에서 정보량 우선순위가 안정적임

테스트:
- `npm run lint`
- `npm run test:e2e -- --workers=1 e2e/ui-layout-regression.spec.js`

권장 커밋 메시지:
- `fix(timeline): rebalance compact and medium timebox density`

---

### T47. 리사이즈 핸들 시각 분리
목표: 카드 하단의 어두운 띠가 상시 seam처럼 보이는 인상을 없애기

하위 태스크:
1. handle을 hover/focus/resizing 때만 노출
2. 본문 하단에 handle reserve 공간 확보
3. 카드 표면과 handle 색 대비 약화

완료 기준(DoD):
- 기본 상태에서 하단 seam 노이즈 감소
- resize 발견성은 hover/focus에서 유지

테스트:
- `npm run test:e2e -- --workers=1 e2e/ui-layout-regression.spec.js`

권장 커밋 메시지:
- `fix(timeline): decouple resize handle from resting card surface`

---

### T48. 타임박스 배경 불투명도 조정
목표: 그리드 선이 카드 내부로 비쳐 clipping처럼 보이는 착시를 줄이기

하위 태스크:
1. 카드 gradient alpha 상향
2. category stripe/배지 대비는 유지
3. 라이트/다크 공통 가독성 점검

완료 기준(DoD):
- 슬롯 선이 카드 내부에서 덜 거슬림
- 카테고리/상태 색 구분은 유지

테스트:
- `npm run lint`
- `npm run test:e2e -- --workers=1`

권장 커밋 메시지:
- `fix(timeline): increase timebox surface opacity for clearer stacking`

---

### T49. 타임박스 seam 회귀/문서 동기화
목표: 새 레이아웃 규칙을 문서/패치노트/세션 보드에 반영

하위 태스크:
1. layout matrix 업데이트
2. task board/patch notes 기록 추가
3. 전체 E2E 회귀 재실행

완료 기준(DoD):
- 새 세션이 문서만 읽어도 timebox seam 보정 의도를 이해 가능

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- --workers=1`

권장 커밋 메시지:
- `docs(timeline): sync timebox seam refactor notes`

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

---

### T14. 빅3 자동 채우기 (BrainDump -> Big3)
목표: 브레인덤프 항목으로 빅3 빈 슬롯을 한 번에 채우기

하위 태스크:
1. `fillBigThreeFromBrainDump` 액션 추가
2. 브레인덤프 섹션에 자동 채우기 버튼 노출
3. 슬롯 가득/소스 없음 케이스 토스트 처리
4. E2E 시나리오 추가

완료 기준(DoD):
- 버튼 1회 클릭으로 빅3 빈 슬롯이 최대 3개까지 채워짐

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/bigthree-autofill.spec.js`

권장 커밋 메시지:
- `feat(big3): add one-click autofill from brain dump`

---

### T15. 타임라인 집중 모드
목표: 인사이트 카드를 숨기고 일정 그리드에만 집중할 수 있는 모드 제공

하위 태스크:
1. 집중 모드 토글 UI 추가
2. 집중 모드 활성 시 인사이트 카드 비노출
3. localStorage 기반 모드 복원
4. E2E 시나리오 추가

완료 기준(DoD):
- 집중 모드에서 타임라인 본문만 표시되고 새로고침 후 유지됨

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/focus-mode.spec.js`

권장 커밋 메시지:
- `feat(timeline): add focus mode toggle and persistence`

---

### T16. 타임라인 필터 (상태/카테고리)
목표: 많은 일정에서도 원하는 상태/카테고리만 빠르게 조회

하위 태스크:
1. 상태 필터(select) 추가
2. 카테고리 필터(select) 추가
3. 필터링 결과 렌더링 + 빈 결과 안내
4. E2E 시나리오 추가

완료 기준(DoD):
- 상태/카테고리 조합으로 타임박스 노출이 즉시 반영됨

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/timeline-filters.spec.js`

권장 커밋 메시지:
- `feat(timeline): add status and category filters`

---

### T17. 타임박스 복제 액션
목표: 모달에서 일정 복제를 실행해 다음 빈 슬롯에 빠르게 재배치

하위 태스크:
1. 완료 모달에 복제 버튼 추가
2. 다음 빈 슬롯 탐색 로직(App) 연결
3. 복제 실패(빈 슬롯 없음) 토스트 처리
4. E2E 시나리오 추가

완료 기준(DoD):
- 일정 1건을 클릭 몇 번으로 복제 생성 가능

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/timebox-duplicate.spec.js`

권장 커밋 메시지:
- `feat(timeline): add quick duplicate action for timeboxes`

---

### T18. 데이터 파일 입출력 강화
목표: JSON 복붙 외에 파일 다운로드/파일 불러오기를 지원

하위 태스크:
1. 내보내기 결과 파일 다운로드 버튼 추가
2. JSON 파일 선택 후 import textarea 자동 채움
3. 가져오기 플로우와 결합
4. E2E 시나리오 추가

완료 기준(DoD):
- 파일 기반 백업/복원이 브라우저 UI에서 동작함

테스트:
- `npm run lint`
- `npm run build`
- `npm run test:e2e -- e2e/data-transfer-file.spec.js`

권장 커밋 메시지:
- `feat(data): add file download and upload for backup restore`

---

### T37. Docker volume 저장 API 도입
목표: planner 데이터를 브라우저 localStorage가 아니라 Docker volume에도 영속화

하위 태스크:
1. `server/index.js` Node API 추가
2. `/api/planner/bootstrap`, `/api/planner/day/:date`, `/api/planner/import` 등 저장 엔드포인트 구현
3. `planner-data` volume 및 API 컨테이너 구성
4. 서버 health 체크 경로 추가

완료 기준(DoD):
- Docker volume(`/data/planner-store.json`)에 planner snapshot이 저장됨

테스트:
- `npm run lint`
- `curl http://localhost:8787/health`

권장 커밋 메시지:
- `feat(storage): add docker volume backed planner api`

---

### T38. 클라이언트 bootstrap hydrate + legacy 4173 이관
목표: 앱 진입 전에 서버 snapshot으로 local mirror를 맞추고, 4173 legacy browser data를 서버로 옮길 수 있게 한다

하위 태스크:
1. `storage.js`를 local mirror + remote sync 구조로 확장
2. `main.jsx`에서 bootstrap hydrate 실행
3. 서버 비어 있고 local data가 있으면 자동 migration
4. 데이터 모달에 `현재 브라우저 데이터를 서버 저장소로 동기화` 액션 추가

완료 기준(DoD):
- 4173 origin에 남아 있던 planner 데이터가 5173에서도 동일하게 복원됨

테스트:
- `npm run lint`
- `npm run build`
- Docker app에서 4173 -> 5173 수동 smoke 확인

권장 커밋 메시지:
- `feat(storage): hydrate from server and migrate legacy browser data`

---

### T39. Docker 실행 스크립트/포트 전략 정리
목표: 쉘 스크립트 한 번으로 app/api/volume을 같이 올리고 legacy bridge 포트까지 안내

하위 태스크:
1. `docker-compose.yml`에 `app + api + planner-data` 구성 반영
2. `4173`, `5173`, `8787` 포트 동시 구성
3. `scripts/docker-dev.sh`에 health wait 및 안내 메시지 추가
4. `APP_PORT`, `LEGACY_PORT`, `API_PORT` 환경변수 대응

완료 기준(DoD):
- `./scripts/docker-dev.sh up` 한 번으로 전체 개발 스택이 기동됨

테스트:
- `./scripts/docker-dev.sh up`
- `./scripts/docker-dev.sh ps`

권장 커밋 메시지:
- `chore(docker): add one-command app api and legacy bridge startup`

---

### T40. 문서/운영 가이드 동기화
목표: 새 세션이나 외부 사용자도 Docker persistence와 이관 방식을 바로 이해하게 만든다

하위 태스크:
1. README에 저장 구조/접속 포트/이관 절차 반영
2. `docs/DOCKER_DEV_WORKFLOW.md` 업데이트
3. `docs/DOCKER_DATA_PERSISTENCE.md` 신설
4. 패치노트에 버전 추가

완료 기준(DoD):
- 저장 구조와 4173 legacy migration 절차가 문서만 읽고 재현 가능

테스트:
- 문서 경로 검수
- 패치노트 모달 최신 버전 확인

권장 커밋 메시지:
- `docs(storage): document docker persistence and legacy migration`

## 4. 보고 템플릿 (Task 완료 시)

아래 4블록을 고정 사용한다.

1. 구현: 변경 파일 + 핵심 변경
2. 리뷰: 발견 이슈/리스크(없으면 없음 명시)
3. 검증: 실행 명령 + 통과 여부
4. 다음 작업 추천: `다음 Task ID` + 착수 이유
