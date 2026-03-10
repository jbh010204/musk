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
5. `COMPOSER` 뷰 모드 골격 추가
6. storage migration 및 reload 보존

제외:

1. 보드 카드 -> 시간표 드롭
2. linkedTimeBoxIds 동기화
3. 벌크 배치
4. Big3 연동
5. 자유 캔버스 위치 저장
6. 모바일 전용 보드 최적화

## UI 책임

### Planning Board

- 상단: 보드 목적 설명, 카드 생성, 카테고리 관리
- 본문: 카테고리 원형 노드 + stack lane
- 카드: 제목, 예상 시간, 메모, 향후 예정 연결 상태

### Schedule Composer

- 현재 단계에서는 placeholder만 제공
- 다음 단계에서 카드 큐 + 시간표 그리드로 확장

## 회귀 금지 규칙

1. 기존 Day/Week/Month 뷰 동작을 깨지 않는다.
2. brainDump priority 기반 Big3 추천은 유지한다.
3. localStorage/Docker volume hydration 경로를 깨지 않는다.
4. category 삭제 시 timeBox와 board card 모두 categoryId를 해제한다.
