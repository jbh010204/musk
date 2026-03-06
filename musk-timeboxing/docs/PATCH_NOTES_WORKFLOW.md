# Patch Notes Workflow

중요 변경이 생길 때마다 패치노트를 누락 없이 업데이트하기 위한 운영 문서입니다.

## 1) 언제 업데이트하나

아래 중 하나라도 해당하면 패치노트를 반드시 업데이트합니다.

- 사용자 체감 기능 추가/수정 (`feat`, 주요 `fix`)
- UI 시스템/디자인 가이드 변경
- DnD, 타임라인, 모달, 저장 로직 변경
- 스키마/로컬스토리지 구조 변경
- E2E 기대값/회귀 기준 변경

## 2) 어디를 업데이트하나

- 파일: `src/components/PatchNotes/patchNotesData.js`
- 최신 버전을 배열 맨 위에 추가
- 날짜는 `YYYY-MM-DD`

## 3) 버전 규칙

- 기본: `v0.x.y`
- 사용자 기능 추가/큰 UX 변화: `minor` 증가
- 버그 수정/문서성 내부 수정: `patch` 증가

## 4) 항목 작성 템플릿

```js
{
  version: 'v0.12.0',
  date: '2026-03-07',
  title: '한 줄 제목',
  summary: '짧은 요약',
  focus: ['신경 쓴 부분 1', '신경 쓴 부분 2'],
  improvements: ['개선 사항 1', '개선 사항 2'],
  validation: ['lint/build/e2e 결과 또는 핵심 검증 근거'],
}
```

## 5) 커밋 전 체크리스트

1. `patchNotesData.js`에 최신 항목 추가
2. 패치노트 모달에서 버전 표시 확인
3. 최소 검증 실행:
   - `npm run lint`
   - `npm run build`
4. 영향이 큰 변경이면:
   - `npm run test:e2e`

## 6) 세션 핸드오프 필수 항목

- 이번 작업의 패치노트 버전
- 반영 파일 경로
- 검증 결과 요약
