# Stack Canvas Pivot Plan

## 목적

`tldraw` 기반 Planning Canvas를 중단하고, 카드 생성/카테고리 분류에 최적화된 custom `StackCanvas`로 전환한다.

핵심 원칙:

1. `taskCard`는 계속 source of truth다.
2. 캔버스는 자유 화이트보드가 아니라 구조화된 스택 작업면이다.
3. 타임라인 배치는 캔버스 밖 우측 rail에서 처리한다.
4. `boardCanvas` persisted 필드는 당분간 유지하되, tldraw snapshot이 아니라 lightweight UI state만 저장한다.

## 범위

### 캔버스 안
- 브레인 덤프 카드 생성
- 카드 수정
- 카드 선택
- 카테고리 스택 이동
- 미분류 -> 카테고리 분류

### 캔버스 밖
- 시간표 슬롯 클릭 또는 카드 직접 드래그로 일정 생성
- 30분 스냅
- overlap 검사
- 완료/스킵/실측 기록

## P1~P6

### P1. pivot 문서화
- tldraw 중단 이유 정리
- StackCanvas 역할 재정의
- workspace 목표 레이아웃 고정

### P2. StackCanvas 데이터 계약
- `boardCanvas.version = 2`
- `layoutMode = 'stack'`
- `selectedCardId`
- `focusedLaneId`
- `migratedFromLegacyBoard`
- `lastSyncedAt`

### P3. StackCanvas shell
- dotted surface
- 미분류 + leaf category stack lane
- 카드 생성 toolbar
- 선택 상태 배지

### P4. 캔버스 내 생성 + 카테고리 DnD
- `BoardCardEditorModal` 재사용
- `CategoryStackLane` 재사용
- drag/drop으로 `categoryId`, `stackOrder` 반영

### P5. StackCanvas -> TimelineRail 연결
- workspace에서 canvas card 선택
- 우측 timeline rail 슬롯 클릭 또는 카드의 `일정` 핸들 직접 드래그로 `timeBox` 생성
- 성공 시 linked badge 동기화

### P6. tldraw 제거
- dependency 제거
- custom shape / inspector 삭제
- 관련 문서 교체

## 목표 레이아웃

```text
| App Left Rail | StackCanvas | Timeline Rail |
```

- App Left Rail: Brain Dump, Big3, 날짜/리포트 등 기존 앱 rail
- StackCanvas: 카드 생성/분류 중심
- Timeline Rail: 선택 카드 일정 배치 중심

## 비목표
- 무한 캔버스
- 자유 draw/freehand
- zoom/pan 엔진
- canvas 내부 time grid
- canvas 내부 Big3 편집
