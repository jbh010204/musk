# Tldraw Planning Canvas Architecture

## 목표

`Planning Board`를 자유 배치가 가능한 `Planning Canvas`로 확장하되,
기존 planner 데이터 계약을 깨지 않고 점진 전환한다.

- `brainDump`: 도메인 원본 카드
- `boardCanvas`: tldraw scene / camera / session snapshot
- `timeBoxes`: 실제 일정 실행 기록

## 핵심 원칙

1. tldraw는 canvas engine이고, source of truth는 여전히 planner 데이터다.
2. 카드 내용/예상 길이/카테고리/링크 수는 `brainDump + timeBoxes`에서 파생한다.
3. 캔버스에는 위치, 카메라, selection 등 시각 상태만 저장한다.
4. 첫 단계에서는 `BOARD`와 `CANVAS`를 병행하고, `CANVAS`가 안정화된 뒤 `BOARD`를 축소한다.
5. `tldraw`는 semver 비준수 정책을 명시하므로 exact version pin을 유지한다.

## 패키지 정책

- package: `tldraw`
- version: `4.4.1`
- 설치 방식: `npm install tldraw@4.4.1 --save-exact`
- caret(`^`) 금지

공식 참고:
- https://tldraw.dev/docs/installation
- https://tldraw.dev/sdk-features/store
- https://tldraw.dev/features/customization/custom-user-interface-components

## 저장 스키마

각 날짜 데이터는 아래 구조를 추가로 가진다.

```js
{
  schemaVersion: 4,
  date: '2026-03-11',
  brainDump: [],
  bigThree: [],
  timeBoxes: [],
  boardCanvas: {
    version: 1,
    document: null,
    session: null,
    migratedFromLegacyBoard: false,
    lastSyncedAt: null
  }
}
```

## 책임 분리

### brainDump

- 카드의 제목
- 카테고리
- 예상 길이(`estimatedSlots`)
- 링크된 timeBox ids
- 메모

### boardCanvas

- 카드/노드의 자유 위치
- 줌/팬
- selection/session
- canvas 안에서의 scene 상태

### timeBoxes

- 실제 스케줄 배치
- 완료/스킵/실측

## 현재 범위 (T86~T90)

포함:

1. `CANVAS` view mode 추가
2. tldraw mount + 기본 UI 숨김
3. 날짜별 snapshot save / load
4. legacy board 데이터를 canvas의 초기 custom shape 배치로 자동 투영
5. toolbar에서 `보드로 이동`, `카테고리 관리`, `자동 배치`, `편성기 이동`
6. category node / task card custom shape 렌더
7. 우측 inspector에서 카드 제목/예상 길이/카테고리/메모 편집

제외:

1. canvas 안에서 새 카드 직접 생성
2. custom category node의 직접 편집
3. canvas 선택 카드 다중 편집
4. 모바일 전용 canvas UX
5. canvas 선택 -> composer 다중 카드 브리지

## 초기 auto-layout 규칙

1. lane 순서대로 좌 -> 우 컬럼 배치
2. 각 lane 상단에 `planner-category-node` 원형 노드 배치
3. lane 아래에 `planner-task-card` 카드 stack 배치
4. 첫 mount 시 snapshot이 없을 때만 자동 배치
5. 이후는 저장된 boardCanvas snapshot이 우선

## 구현 메모

- 카드/카테고리 shape id는 stable id(`planner-task-{cardId}`, `planner-category-{laneId}`)를 사용한다.
- 카드 상태는 persisted field가 아니라 `brainDump.linkedTimeBoxIds + timeBoxes.status`에서 파생한다.
- inspector 편집은 brainDump를 수정하고, canvas shape props는 projection sync로 갱신한다.
- Playwright는 tldraw custom shape hit-test가 불안정해서 dev hook `window.__plannerCanvasSelectCard(cardId)`를 사용해 inspector 회귀를 고정한다.

## 다음 단계

- `T91` canvas selected card -> composer queue bridge
- `T92` canvas card bulk selection / multi-schedule flow
- `T93` canvas 삭제/연결 해제 정책 정리
