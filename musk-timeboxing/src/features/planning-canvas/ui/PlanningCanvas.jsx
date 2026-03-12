import {
  DndContext,
  DragOverlay,
  MouseSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEffect, useMemo, useState } from 'react'
import {
  buildBoardLayoutEntries,
  getCategoryColor,
  getCategoryLabel,
  getTaskCardStackCanvasStatus,
  groupBoardCardsByCategory,
  UNCATEGORIZED_BOARD_LANE,
} from '../../../entities/planner'
import { Badge, Button, Card } from '../../../shared/ui'
import BoardCardEditorModal from '../../planning-board/ui/BoardCardEditorModal'
import CategoryStackLane from '../../planning-board/ui/CategoryStackLane'

const resolveLaneIdFromOver = (overId, lanes) => {
  if (typeof overId !== 'string') {
    return null
  }

  if (overId.startsWith('lane:')) {
    return overId.replace('lane:', '')
  }

  if (overId.startsWith('node:')) {
    return overId.replace('node:', '')
  }

  return lanes.find((lane) => lane.items.some((item) => item.id === overId))?.id || null
}

const createLaneState = (lanes) =>
  lanes.map((lane) => ({
    id: lane.id,
    items: lane.items.map((item) => item.id),
  }))

function PlanningCanvas({
  stackCanvasState,
  brainDumpItems = [],
  categories = [],
  timeBoxes = [],
  onUpdateStackCanvasState = () => {},
  onCreateCard = () => false,
  onUpdateCard = () => {},
  onApplyLayout = () => {},
  onOpenCategoryManager = () => {},
  onOpenComposer = () => {},
  selectedCardId: controlledSelectedCardId = null,
  selectedCardIds: controlledSelectedCardIds = null,
  onSelectCard = null,
  onSelectCards = null,
  scheduleDraggable = false,
  onScheduleDragStart = () => {},
  onScheduleDragEnd = () => {},
  embedded = false,
}) {
  const [editingCard, setEditingCard] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)
  const [internalSelectedCardId, setInternalSelectedCardId] = useState(
    controlledSelectedCardId ?? stackCanvasState?.selectedCardId ?? null,
  )
  const [internalSelectedCardIds, setInternalSelectedCardIds] = useState(
    Array.isArray(controlledSelectedCardIds)
      ? controlledSelectedCardIds
      : stackCanvasState?.selectedCardIds ?? [],
  )
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }))
  const lanes = useMemo(() => groupBoardCardsByCategory(brainDumpItems, categories), [brainDumpItems, categories])
  const [laneState, setLaneState] = useState(() => createLaneState(lanes))
  const cardMap = useMemo(() => new Map(brainDumpItems.map((item) => [item.id, item])), [brainDumpItems])
  const laneMap = useMemo(() => new Map(lanes.map((lane) => [lane.id, lane])), [lanes])
  const selectedCardId = controlledSelectedCardId ?? internalSelectedCardId
  const selectedCardIds = Array.isArray(controlledSelectedCardIds)
    ? controlledSelectedCardIds
    : internalSelectedCardIds

  const visualLanes = useMemo(
    () =>
      laneState.map((lane) => {
        const meta = laneMap.get(lane.id)

        return {
          ...(meta || {
            id: lane.id,
            label: lane.id,
            color: '#94a3b8',
            items: [],
          }),
          items: lane.items.map((itemId) => cardMap.get(itemId)).filter(Boolean),
        }
      }),
    [cardMap, laneMap, laneState],
  )

  const activeCard = activeCardId ? cardMap.get(activeCardId) || null : null
  const selectedCard = selectedCardId ? cardMap.get(selectedCardId) || null : null
  const scheduledCards = brainDumpItems.filter((item) => item.linkedTimeBoxIds?.length > 0).length
  const completedCards = brainDumpItems.filter(
    (item) => getTaskCardStackCanvasStatus(item, timeBoxes) === 'COMPLETED',
  ).length
  const uncategorizedCount =
    visualLanes.find((lane) => lane.id === UNCATEGORIZED_BOARD_LANE)?.items.length || 0

  useEffect(() => {
    setLaneState(createLaneState(lanes))
  }, [lanes])

  useEffect(() => {
    if (controlledSelectedCardId !== null) {
      setInternalSelectedCardId(controlledSelectedCardId)
    }
  }, [controlledSelectedCardId])

  useEffect(() => {
    if (Array.isArray(controlledSelectedCardIds)) {
      setInternalSelectedCardIds(controlledSelectedCardIds)
    }
  }, [controlledSelectedCardIds])

  useEffect(() => {
    const nextSelectedCardIds = selectedCardIds.filter((itemId) => cardMap.has(itemId))
    const shouldUpdateIds = nextSelectedCardIds.length !== selectedCardIds.length
    const nextSelectedCardId = nextSelectedCardIds.includes(selectedCardId)
      ? selectedCardId
      : nextSelectedCardIds.at(-1) ?? null
    const shouldUpdateId = nextSelectedCardId !== selectedCardId

    if (!shouldUpdateIds && !shouldUpdateId) {
      return
    }

    if (onSelectCards) {
      onSelectCards(nextSelectedCardIds)
    } else {
      setInternalSelectedCardIds(nextSelectedCardIds)
    }

    if (onSelectCard) {
      onSelectCard(nextSelectedCardId)
    } else {
      setInternalSelectedCardId(nextSelectedCardId)
    }
  }, [cardMap, onSelectCard, onSelectCards, selectedCardId, selectedCardIds])

  const applySelection = (nextSelectedCardIds, nextSelectedCardId = null) => {
    const dedupedIds = [...new Set(nextSelectedCardIds.filter((itemId) => cardMap.has(itemId)))]
    const resolvedSelectedCardId =
      dedupedIds.length === 0
        ? null
        : dedupedIds.includes(nextSelectedCardId)
          ? nextSelectedCardId
          : dedupedIds.at(-1) ?? null
    const nextCard = resolvedSelectedCardId ? cardMap.get(resolvedSelectedCardId) || null : null

    if (onSelectCards) {
      onSelectCards(dedupedIds)
    } else {
      setInternalSelectedCardIds(dedupedIds)
    }

    if (onSelectCard) {
      onSelectCard(resolvedSelectedCardId)
    } else {
      setInternalSelectedCardId(resolvedSelectedCardId)
    }

    onUpdateStackCanvasState({
      selectedCardId: resolvedSelectedCardId,
      selectedCardIds: dedupedIds,
      focusedLaneId: nextCard?.categoryId || UNCATEGORIZED_BOARD_LANE,
    })
  }

  const setSelectedCard = (itemOrId) => {
    const nextId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id || null
    applySelection(nextId ? [nextId] : [], nextId)
  }

  const toggleSelectedCard = (itemOrId) => {
    const nextId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id || null
    if (!nextId) {
      applySelection([], null)
      return
    }

    if (selectedCardIds.includes(nextId)) {
      const nextSelectedCardIds = selectedCardIds.filter((itemId) => itemId !== nextId)
      applySelection(nextSelectedCardIds, nextSelectedCardIds.at(-1) ?? null)
      return
    }

    applySelection([...selectedCardIds, nextId], nextId)
  }

  const commitLaneState = (nextLaneState) => {
    setLaneState(nextLaneState)
    onApplyLayout(buildBoardLayoutEntries(nextLaneState))
  }

  const moveCardsToLane = (cardIds, targetLaneId) => {
    const uniqueCardIds = [...new Set(cardIds)].filter(Boolean)
    if (uniqueCardIds.length === 0) {
      return
    }

    const nextLaneState = createLaneState(visualLanes)
    const targetLane = nextLaneState.find((lane) => lane.id === targetLaneId)
    if (!targetLane) {
      return
    }

    uniqueCardIds.forEach((cardId) => {
      const sourceLane = nextLaneState.find((lane) => lane.items.includes(cardId))
      if (!sourceLane) {
        return
      }

      sourceLane.items = sourceLane.items.filter((itemId) => itemId !== cardId)
    })

    targetLane.items = [...targetLane.items.filter((itemId) => !uniqueCardIds.includes(itemId)), ...uniqueCardIds]
    commitLaneState(nextLaneState)
  }

  const handleDragStart = ({ active }) => {
    setActiveCardId(typeof active?.id === 'string' ? active.id : null)
  }

  const handleDragCancel = () => {
    setActiveCardId(null)
    setLaneState(createLaneState(lanes))
  }

  const handleDragEnd = ({ active, over }) => {
    const activeId = typeof active?.id === 'string' ? active.id : null
    const overId = typeof over?.id === 'string' ? over.id : null

    setActiveCardId(null)

    if (!activeId || !overId) {
      setLaneState(createLaneState(lanes))
      return
    }

    const nextLaneState = createLaneState(lanes)
    const activeLaneId = resolveLaneIdFromOver(activeId, lanes)
    const overLaneId = resolveLaneIdFromOver(overId, lanes)

    if (!activeLaneId || !overLaneId) {
      setLaneState(nextLaneState)
      return
    }

    const activeLane = nextLaneState.find((lane) => lane.id === activeLaneId)
    const overLane = nextLaneState.find((lane) => lane.id === overLaneId)

    if (!activeLane || !overLane) {
      setLaneState(nextLaneState)
      return
    }

    const activeIndex = activeLane.items.indexOf(activeId)
    if (activeIndex < 0) {
      setLaneState(nextLaneState)
      return
    }

    const removeFromSource = () => {
      activeLane.items = activeLane.items.filter((itemId) => itemId !== activeId)
    }

    if (activeLaneId === overLaneId) {
      const overIndex = overLane.items.indexOf(overId)
      if (overIndex < 0) {
        if (overId.startsWith('lane:') || overId.startsWith('node:')) {
          activeLane.items = arrayMove(activeLane.items, activeIndex, activeLane.items.length - 1)
          commitLaneState(nextLaneState)
          return
        }

        setLaneState(nextLaneState)
        return
      }

      activeLane.items = arrayMove(activeLane.items, activeIndex, overIndex)
      commitLaneState(nextLaneState)
      return
    }

    removeFromSource()
    const overIndex = overLane.items.indexOf(overId)
    if (overIndex < 0 || overId.startsWith('lane:') || overId.startsWith('node:')) {
      overLane.items = [...overLane.items, activeId]
    } else {
      overLane.items = [
        ...overLane.items.slice(0, overIndex),
        activeId,
        ...overLane.items.slice(overIndex),
      ]
    }

    commitLaneState(nextLaneState)
  }

  const handleSelectNode = (laneId) => {
    const armedCardIds = selectedCardIds.length > 0 ? selectedCardIds : selectedCardId ? [selectedCardId] : []
    if (armedCardIds.length === 0) {
      return
    }

    moveCardsToLane(armedCardIds, laneId)
    onUpdateStackCanvasState({
      selectedCardId: armedCardIds.at(-1) ?? null,
      selectedCardIds: armedCardIds,
      focusedLaneId: laneId,
    })
  }

  const handleSubmitEditor = (payload) => {
    if (editingCard?.id) {
      onUpdateCard(editingCard.id, payload)
      return true
    }

    return onCreateCard(payload)
  }

  const collisionStrategy = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    return closestCorners(args)
  }

  return (
    <section data-testid="planning-canvas-view" className={embedded ? 'space-y-4' : 'space-y-6'}>
      <Card className={embedded ? 'p-4' : 'p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Stack Canvas
            </h3>
            <p className={`mt-2 font-semibold text-slate-900 dark:text-slate-100 ${embedded ? 'text-base' : 'text-lg'}`}>
              캔버스 안에서 카드를 만들고 카테고리 스택으로 분류합니다.
            </p>
            <p className={`mt-2 text-slate-500 dark:text-slate-400 ${embedded ? 'text-xs' : 'text-sm'}`}>
              브레인 덤프 원본을 카드로 다루고, 드래그로 카테고리 스택을 옮긴 뒤 선택한 카드를 우측 타임라인에 배치합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className={embedded ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
              onClick={onOpenCategoryManager}
            >
              카테고리 관리
            </Button>
            {!embedded ? (
              <Button variant="secondary" className="px-3 py-2 text-sm" onClick={onOpenComposer}>
                우측 타임라인 보기
              </Button>
            ) : null}
            <Button
              variant="primary"
              className={embedded ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
              data-testid="planning-canvas-open-create"
              onClick={() => setEditingCard({})}
            >
              일정 카드 만들기
            </Button>
          </div>
        </div>

        <div className={`${embedded ? 'mt-3' : 'mt-4'} flex flex-wrap items-center gap-2`}>
          <Badge tone="neutral">전체 카드 {brainDumpItems.length}개</Badge>
          <Badge tone="neutral">미분류 {uncategorizedCount}개</Badge>
          <Badge tone="neutral">예정 연결 {scheduledCards}개</Badge>
          <Badge tone="neutral">완료 {completedCards}개</Badge>
          {selectedCardIds.length > 1 ? <Badge tone="neutral">다중 선택 {selectedCardIds.length}개</Badge> : null}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/35 dark:text-slate-300">
          {selectedCardIds.length > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">다중 선택:</span>
              <span>{selectedCardIds.length}개 카드</span>
              <span className="text-slate-400">·</span>
              <span>
                총{' '}
                {selectedCardIds.reduce(
                  (sum, itemId) => sum + ((cardMap.get(itemId)?.estimatedSlots || 1) * 30),
                  0,
                )}
                분
              </span>
              <button
                type="button"
                className="rounded-xl px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                onClick={() => applySelection([], null)}
              >
                선택 해제
              </button>
            </div>
          ) : selectedCard ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">선택됨:</span>
              <span>{selectedCard.content}</span>
              <span className="text-slate-400">·</span>
              <span>{getCategoryLabel(categories.find((category) => category.id === selectedCard.categoryId), null) || '미분류'}</span>
              <span className="text-slate-400">·</span>
              <span>{selectedCard.estimatedSlots * 30}분</span>
              <button
                type="button"
                className="rounded-xl px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                onClick={() => applySelection([], null)}
              >
                선택 해제
              </button>
            </div>
          ) : (
            '카드를 클릭해 선택하고, 같은 화면 오른쪽 시간표에서 원하는 슬롯을 눌러 일정으로 만듭니다.'
          )}
        </div>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <Card className={`overflow-hidden ${embedded ? 'p-4' : 'p-6'}`}>
          <div
            data-testid="planning-canvas-surface"
            className={`rounded-[28px] bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.25)_1px,transparent_0)] bg-[length:24px_24px] ${embedded ? 'p-4' : 'p-5'} dark:bg-[radial-gradient(circle_at_1px_1px,rgba(71,85,105,0.35)_1px,transparent_0)]`}
          >
            <div className={`grid gap-5 ${embedded ? 'grid-cols-1' : 'xl:grid-cols-3'}`}>
            {visualLanes.map((lane) => (
              <CategoryStackLane
                key={lane.id}
                lane={lane}
                selectedCardId={selectedCardId}
                selectedCardIds={selectedCardIds}
                onEditCard={setEditingCard}
                onSelectCard={(item) => setSelectedCard(item)}
                onToggleCardSelect={(item) => toggleSelectedCard(item)}
                onSelectNode={handleSelectNode}
                scheduleDraggable={scheduleDraggable}
                onScheduleDragStart={onScheduleDragStart}
                onScheduleDragEnd={onScheduleDragEnd}
              />
              ))}
            </div>
          </div>
        </Card>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[280px]">
              <div className="rounded-2xl bg-white/95 p-4 shadow-xl dark:bg-slate-900/95">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: activeCard.categoryId
                        ? getCategoryColor(
                            categories.find((category) => category.id === activeCard.categoryId),
                            null,
                          )
                        : '#94a3b8',
                    }}
                  />
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    이동 중
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeCard.content}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCard !== null ? (
        <BoardCardEditorModal
          categories={categories}
          initialCard={editingCard}
          onClose={() => setEditingCard(null)}
          onSubmit={handleSubmitEditor}
        />
      ) : null}
    </section>
  )
}

export default PlanningCanvas
