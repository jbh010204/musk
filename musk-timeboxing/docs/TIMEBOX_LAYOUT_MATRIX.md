# TimeBox Layout Matrix (T8)

타임박스 높이에 따라 어떤 정보를 우선 노출할지 고정 규칙을 정의한다.

## 1) Height Bands

- `compact`: 높이 `<= 44px` (대부분 30분 카드)
- `medium`: 높이 `45px ~ 80px`
- `spacious`: 높이 `>= 81px`

## 2) Display Priority

### compact
- 상단: 상태 배지 + 타이머 버튼(동일 라인)
- 본문: `#태그 -> 제목` 순서 고정
- 실행시간 라벨(`실행 00:00`)은 숨김

### medium
- 상단: 상태 배지 + 타이머 버튼 + 실행시간(있을 때)
- 본문: 태그(있을 때) + 제목 + 계획/실제/사유 라인

### spacious
- `medium`과 동일하되 본문 상단 여백을 1단계 더 확보해 가독성 우선

## 3) Source of Truth

- 구현 파일: `src/features/timeline/ui/timeBoxLayout.js`
- 렌더 적용 파일: `src/features/timeline/ui/TimeBoxCard.jsx`

레이아웃 규칙 변경 시 위 두 파일을 동시에 수정하고 E2E를 실행한다.
