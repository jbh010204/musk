# Musk Time-Boxing AI Session Playbook

이 문서는 새로운 AI 세션이 들어와도 같은 방식으로 작업하기 위한 실행 규칙이다.

## 1) Session Start Checklist

1. `git status -sb`로 워킹트리 확인
2. `npm install` 확인 (처음 세션)
3. 최근 변경 확인: `git log --oneline -n 10`
4. 아래 고정 제약 확인

## 2) Fixed Product Constraints

- Framework: Vite + React 18
- Styling: Tailwind CSS v3
- DnD: dnd-kit
- Storage: localStorage only (`musk-planner-YYYY-MM-DD`)
- State: `useState` / `useReducer` only
- Theme: dark/light toggle (둘 다 깨지지 않게 유지)
- Deployment: static build only

## 3) Current UX Decisions (must keep)

- 기본 타임박스 길이: 30분(1 slot)
- 60분 이상은 타임박스 하단 리사이즈로 확장
- 타임박스 이동: 타임박스 자체 드래그로 슬롯 이동
- 타임박스 편집: 모달에서 이름/상태/실제시간/카테고리 수정
- 건너뜀(Skipped): amber 계열 색상
- 카테고리 관리는 FAB(`+ 카테고리`) 진입을 기본으로 유지
- 카테고리 색상은 타임박스 좌측 컬러 바와 배지에 함께 반영

## 4) Task Loop (required)

요청 1개를 아래 순서로 처리한다.

1. 작업을 하위 태스크로 분해
2. 코드 변경 (작게)
3. 검증
   - `npm run lint`
   - `npm run build`
4. 리뷰
   - 부작용/회귀 여부 확인
   - 겹침 검사/저장 로직/IME 입력 영향 확인
5. 중요 변경이면 패치노트 업데이트
   - 파일: `src/components/PatchNotes/patchNotesData.js`
   - 규칙: 최신 버전 항목을 맨 위에 추가하고 `focus/improvements/validation`을 채운다.
6. 커밋 + 푸시
7. 카테고리/DnD/모달/타임라인 수정 시 `npm run test:e2e` 실행

## 4-1) Patch Note Policy (required)

아래 중 하나라도 해당하면 패치노트 업데이트를 반드시 수행한다.

- 사용자 체감 기능 변경 (`feat`, 주요 `fix`)
- 데이터 스키마/저장 방식 변경
- UI 구조/가이드/디자인 시스템 변경
- 테스트 전략/회귀 기준 변경

패치노트 업데이트를 생략할 수 있는 경우:

- 오탈자/주석/문서 문구만 바뀌고 동작 영향이 없는 변경
- 내부 리팩토링이지만 사용자 동작/테스트/품질 기준에 영향이 없는 변경

## 5) Git Rules

- 브랜치: `main` 사용 (현재 원격 기본 브랜치)
- 커밋 메시지: Conventional Commits
  - 예: `feat(timeline): add category editing in modal`
  - 예: `fix(input): prevent duplicate submit during IME composition`
- 큰 변경은 기능 단위로 커밋 분리

## 6) Definition of Done

- 요구사항 동작 확인
- lint/build 통과
- 로컬 저장(localStorage) 유지 확인
- 날짜 이동 시 데이터 독립성 유지 확인
- 중요 변경이면 패치노트 항목 추가 완료
- 커밋/푸시 완료

## 7) Handoff Template

다음 세션으로 넘길 때 아래를 포함한다.

1. 무엇을 구현했는지(기능/파일)
2. 검증 결과(lint/build)
3. 남은 리스크/후속 작업
4. 마지막 커밋 해시
5. 패치노트 버전(또는 생략 사유)

## 8) User Delivery Workflow (must follow)

사용자에게 작업 완료 보고할 때 아래 순서를 항상 유지한다.

1. 구현(무엇을 바꿨는지)
2. 리뷰(문제/리스크/품질 체크)
3. 검증(실행한 명령과 결과)
4. 다음 작업 추천(우선순위 3개)

출력 템플릿:

- `구현`: 기능 단위 요약 + 파일 경로
- `리뷰`: 발견 이슈(없으면 없음 명시) + 잔여 리스크
- `검증`: `lint/build/e2e` 결과
- `다음 작업 추천`: `1,2,3` 순서 제안
