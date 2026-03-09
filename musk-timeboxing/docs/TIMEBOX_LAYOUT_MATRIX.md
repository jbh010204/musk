# TimeBox Layout Matrix (T8)

타임박스 높이에 따라 어떤 정보를 우선 노출할지 고정 규칙을 정의한다.

## 1) Height Bands

- `compact`: 높이 `<= 44px` (대부분 30분 카드)
- `medium`: 높이 `45px ~ 80px`
- `spacious`: 높이 `>= 81px`

## 2) Display Priority

### compact
- 우측: 상태 배지 + 타이머 버튼을 카드 수직 중앙에 정렬
- 본문: `#태그 -> 제목 -> 시간` 인라인 row를 카드 수직 중앙에 정렬하되, 텍스트 기준선은 왼쪽 정렬 유지
- 제목: `11px` 1줄 고정
- 시간: `10px` 짧은 라벨(`30분` 등)
- 실행시간 라벨(`실행 00:00`)은 숨김
- 리사이즈 핸들은 기본 숨김, hover/focus/resizing 때만 노출

### medium
- 상단: 상태 배지 + 타이머 버튼 + 실행시간(있을 때)
- 본문: `태그 -> 제목 -> 시간` stack을 카드 수직 중앙에 정렬하고, stack 내부는 왼쪽 기준선으로 맞춘다
- 제목: `13px` 2줄까지 허용
- 시간: `11px` 1줄
- 추가 메타는 숨기고 핵심 3요소만 유지

### spacious
- `medium`과 동일한 중앙 stack + 왼쪽 정렬을 유지하되, 메타 라인을 추가해 정보량만 확장
- 제목: `15px` 2줄까지 허용
- 시간: `12px` 1줄
- 메타: `12px` 2줄까지 허용
- 완료 상태의 `차이 N분`은 별도 메타 라인이 아니라 시간 라인에 포함해 3번째 줄 안에서 처리한다

## 3) Source of Truth

- 구현 파일: `src/features/timeline/ui/timeBoxLayout.js`
- 렌더 적용 파일: `src/features/timeline/ui/TimeBoxCard.jsx`

레이아웃 규칙 변경 시 위 두 파일을 동시에 수정하고 E2E를 실행한다.

## 4) Visual Guardrails

- 카드 표면은 슬롯 경계와 완전히 붙지 않도록 `surface inset`을 둔다.
- 그리드 라인이 카드 내부로 과하게 비치지 않도록 카드 배경 알파를 높인다.
- seam이 먼저 보이고 handle이 먼저 보이지 않도록, 리사이즈 핸들은 상시 표시하지 않는다.
