# TimeBox Layout Matrix (T8)

타임박스 높이에 따라 어떤 정보를 우선 노출할지 고정 규칙을 정의한다.

## 1) Height Bands

- `compact`: 높이 `<= 44px` (대부분 30분 카드)
- `medium`: 높이 `45px ~ 80px`
- `spacious`: 높이 `>= 81px`

## 2) Display Priority

### compact
- 우측: 상태 배지 + 타이머 버튼을 카드 수직 중앙에 정렬
- 본문: `#태그 -> 제목` 순서 고정, 카드 높이 안에서 수직 중앙 정렬
- 실행시간 라벨(`실행 00:00`)은 숨김
- 리사이즈 핸들은 기본 숨김, hover/focus/resizing 때만 노출

### medium
- 상단: 상태 배지 + 타이머 버튼 + 실행시간(있을 때)
- 본문: 태그(있을 때) + 제목 + 핵심 요약 1라인
- 하단 리사이즈 핸들과 겹치지 않도록 하단 여백 예약

### spacious
- `medium`과 동일하되 본문 상단 여백을 1단계 더 확보
- 실행시간 + 계획/실제/사유를 최대 2라인까지 허용해 가독성 우선

## 3) Source of Truth

- 구현 파일: `src/features/timeline/ui/timeBoxLayout.js`
- 렌더 적용 파일: `src/features/timeline/ui/TimeBoxCard.jsx`

레이아웃 규칙 변경 시 위 두 파일을 동시에 수정하고 E2E를 실행한다.

## 4) Visual Guardrails

- 카드 표면은 슬롯 경계와 완전히 붙지 않도록 `surface inset`을 둔다.
- 그리드 라인이 카드 내부로 과하게 비치지 않도록 카드 배경 알파를 높인다.
- seam이 먼저 보이고 handle이 먼저 보이지 않도록, 리사이즈 핸들은 상시 표시하지 않는다.
