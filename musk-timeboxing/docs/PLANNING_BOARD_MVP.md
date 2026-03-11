# Planning Board MVP

## 목적

Planning Board는 기존 브레인 덤프를 시각적으로 정리하는 단계다.

- `Planning Board`: 무엇을 할지 카테고리 스택으로 정리
- `Schedule Composer`: 정리된 카드를 시간표 슬롯에 배치
- `Day Timeline`: 실제 수행/완료/스킵/실측 기록

월간/주간/일간과 달리, 보드는 `생각 정리`가 1차 목적이다.

## 핵심 원칙

1. Excalidraw처럼 보이되 데이터는 구조화한다.
2. 카테고리 원 노드는 anchor이고, 실제 카드는 노드 아래 stack lane에 쌓인다.
3. 카드의 `x/y` 자유 배치는 저장하지 않는다.
4. 카드 배치는 보드에서 정리하고, 실제 시간 배치는 편성기에서 한다.
5. 브레인 덤프 리스트는 fallback으로 유지하되, 장기적으로는 보드가 주요 입력 인터페이스가 된다.

## 데이터 계약

`brainDump[]`는 다음 필드를 추가로 가진다.

```js
{
  id: "uuid",
  content: "리준쉐량 디코",
  isDone: false,
  priority: 0,
  categoryId: "cat-study" || null,
  stackOrder: 3,
  estimatedSlots: 2,
  linkedTimeBoxIds: [],
  note: "",
  createdFrom: "list" | "board"
}
```

## 현재 MVP 범위

포함:

1. `BOARD` 뷰 모드 추가
2. 카드 생성/수정
3. 카테고리 노드 드롭
4. lane 내 스택 재정렬
5. `COMPOSER` 카드 큐 + 30분 시간표 그리드
6. 카드 선택/드래그 -> 슬롯 배치로 `timeBox` 생성
7. `linkedTimeBoxIds` 자동 동기화 및 reload 보존

제외:

1. 벌크 배치
2. Big3 연동
3. 자유 캔버스 위치 저장
4. 모바일 전용 보드 최적화
5. 보드 카드 상태의 완료/스킵 세분화

## UI 책임

### Planning Board

- 상단: 보드 목적 설명, 카드 생성, 카테고리 관리
- 본문: 카테고리 원형 노드 + stack lane
- 카드: 제목, 예상 시간, 메모, 향후 예정 연결 상태

### Schedule Composer

- 좌측 카드 큐에서 카드를 선택하거나 드래그해 우측 시간표 슬롯으로 보낸다.
- 시간표 슬롯에 배치되면 `sourceId = boardCard.id` 기반으로 실제 `timeBox`가 생성된다.
- 카드 자체는 남아 있고, `linkedTimeBoxIds` badge로 예정 연결 수를 표시한다.

## 회귀 금지 규칙

1. 기존 Day/Week/Month 뷰 동작을 깨지 않는다.
2. brainDump priority 기반 Big3 추천은 유지한다.
3. localStorage/Docker volume hydration 경로를 깨지 않는다.
4. category 삭제 시 timeBox와 board card 모두 categoryId를 해제한다.
