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
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildBoardLayoutEntries,
  getCategoryColor,
  getTaskCardStackCanvasStatus,
  groupBoardCardsByCategory,
  UNCATEGORIZED_BOARD_LANE,
} from '../../../entities/planner'
import { Badge, Button, Card } from '../../../shared/ui'
import { INBOX_FILTER_OPTIONS, filterInboxItems } from '../lib/inboxFilters'
import BoardCardEditorModal from '../../planning-board/ui/BoardCardEditorModal'
import CategoryNode from '../../planning-board/ui/CategoryNode'
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
  onSendSelectedCardsToBigThree = () => 0,
  onScheduleSelectedCardsToFirstOpen = () => false,
  scheduleDraggable = false,
  onScheduleDragStart = () => {},
  onScheduleDragEnd = () => {},
  embedded = false,
}) {
  const [editingCard, setEditingCard] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)
  const [inboxSearch, setInboxSearch] = useState('')
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
  const focusedLaneId = stackCanvasState?.focusedLaneId ?? UNCATEGORIZED_BOARD_LANE
  const inboxFilter = stackCanvasState?.inboxFilter ?? 'ALL'
  const isInboxCollapsed = Boolean(stackCanvasState?.isInboxCollapsed)

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
  const scheduledCards = brainDumpItems.filter((item) => item.linkedTimeBoxIds?.length > 0).length
  const completedCards = brainDumpItems.filter(
    (item) => getTaskCardStackCanvasStatus(item, timeBoxes) === 'COMPLETED',
  ).length
  const uncategorizedCount =
    visualLanes.find((lane) => lane.id === UNCATEGORIZED_BOARD_LANE)?.items.length || 0
  const dockLanes = useMemo(() => visualLanes, [visualLanes])
  const uncategorizedLane =
    visualLanes.find((lane) => lane.id === UNCATEGORIZED_BOARD_LANE) || visualLanes[0] || null
  const filteredInboxItems = useMemo(
    () =>
      filterInboxItems(uncategorizedLane?.items || [], {
        query: inboxSearch,
        filter: inboxFilter,
        timeBoxes,
      }),
    [inboxFilter, inboxSearch, timeBoxes, uncategorizedLane?.items],
  )
  const inboxLane = useMemo(
    () => (uncategorizedLane ? { ...uncategorizedLane, items: filteredInboxItems } : null),
    [filteredInboxItems, uncategorizedLane],
  )
  const activeLane = useMemo(() => {
    const preferredLane =
      focusedLaneId && focusedLaneId !== UNCATEGORIZED_BOARD_LANE
        ? visualLanes.find((lane) => lane.id === focusedLaneId) || null
        : null

    if (preferredLane) {
      return preferredLane
    }

    return visualLanes.find((lane) => lane.id !== UNCATEGORIZED_BOARD_LANE) || null
  }, [focusedLaneId, visualLanes])
  const orderedDockLaneIds = useMemo(() => dockLanes.map((lane) => lane.id), [dockLanes])

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
      selectedBigThreeId: null,
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

  const commitLaneState = useCallback((nextLaneState) => {
    setLaneState(nextLaneState)
    onApplyLayout(buildBoardLayoutEntries(nextLaneState))
  }, [onApplyLayout])

  const moveCardsToLane = useCallback((cardIds, targetLaneId) => {
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
  }, [commitLaneState, visualLanes])

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

  const handleSelectNode = useCallback((laneId) => {
    const armedCardIds = selectedCardIds.length > 0 ? selectedCardIds : selectedCardId ? [selectedCardId] : []
    if (armedCardIds.length === 0) {
      onUpdateStackCanvasState({
        focusedLaneId: laneId,
      })
      return
    }

    moveCardsToLane(armedCardIds, laneId)
    onUpdateStackCanvasState({
      selectedCardId: armedCardIds.at(-1) ?? null,
      selectedCardIds: armedCardIds,
      focusedLaneId: laneId,
    })
  }, [moveCardsToLane, onUpdateStackCanvasState, selectedCardId, selectedCardIds])

  const moveSelectionAcrossDock = useCallback((offset) => {
    const armedCardIds = selectedCardIds.length > 0 ? selectedCardIds : selectedCardId ? [selectedCardId] : []
    if (armedCardIds.length === 0 || orderedDockLaneIds.length === 0) {
      return
    }

    const anchorCard = cardMap.get(armedCardIds.at(-1)) || null
    const currentLaneId = anchorCard?.categoryId || focusedLaneId || UNCATEGORIZED_BOARD_LANE
    const currentIndex = orderedDockLaneIds.indexOf(currentLaneId)
    if (currentIndex < 0) {
      return
    }

    const nextIndex = currentIndex + offset
    if (nextIndex < 0 || nextIndex >= orderedDockLaneIds.length) {
      return
    }

    handleSelectNode(orderedDockLaneIds[nextIndex])
  }, [cardMap, focusedLaneId, handleSelectNode, orderedDockLaneIds, selectedCardId, selectedCardIds])

  const handleSubmitEditor = (payload) => {
    if (editingCard?.id) {
      onUpdateCard(editingCard.id, payload)
      onUpdateStackCanvasState({
        focusedLaneId: payload.categoryId || UNCATEGORIZED_BOARD_LANE,
      })
      return true
    }

    const inserted = onCreateCard(payload)
    if (inserted) {
      onUpdateStackCanvasState({
        focusedLaneId: payload.categoryId || UNCATEGORIZED_BOARD_LANE,
      })
    }
    return inserted
  }

  const collisionStrategy = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    return closestCorners(args)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.closest('[role="dialog"]'))

      if (editingCard || isEditableTarget) {
        return
      }

      const armedCardIds = selectedCardIds.length > 0 ? selectedCardIds : selectedCardId ? [selectedCardId] : []
      if (armedCardIds.length === 0) {
        return
      }

      if (event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        onSendSelectedCardsToBigThree(armedCardIds)
        return
      }

      if (event.shiftKey && event.key === 'Enter') {
        event.preventDefault()
        onScheduleSelectedCardsToFirstOpen(armedCardIds)
        return
      }

      if (event.key === '[') {
        event.preventDefault()
        moveSelectionAcrossDock(-1)
        return
      }

      if (event.key === ']') {
        event.preventDefault()
        moveSelectionAcrossDock(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingCard, moveSelectionAcrossDock, onScheduleSelectedCardsToFirstOpen, onSendSelectedCardsToBigThree, selectedCardId, selectedCardIds])

  return (
    <section data-testid="planning-canvas-view" className={embedded ? 'space-y-4' : 'space-y-6'}>
      <Card className={embedded ? 'p-4' : 'p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Stack Canvas
            </h3>
            <p className={`mt-1 font-semibold text-slate-900 dark:text-slate-100 ${embedded ? 'text-base' : 'text-lg'}`}>
              먼저 카드 생성과 분류만 빠르게 끝냅니다.
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
          {completedCards > 0 ? <Badge tone="neutral">완료 {completedCards}개</Badge> : null}
          {selectedCardIds.length > 1 ? <Badge tone="neutral">다중 선택 {selectedCardIds.length}개</Badge> : null}
          <Badge tone="neutral">
            활성 카테고리 {activeLane?.label || '없음'}
          </Badge>
          {selectedCardIds.length > 0 ? <Badge tone="neutral">단축키 Shift+B · Shift+Enter · [ ]</Badge> : null}
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
            <div className="space-y-5">
              <div className="rounded-3xl bg-white/55 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-950/35">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Category Dock
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      카드가 쌓인 도크는 그라데이션 glow로 먼저 드러납니다. 선택한 카드는 여기서 바로 분류합니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCardIds.length > 0 ? (
                      <button
                        type="button"
                        className="rounded-xl px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                        onClick={() => applySelection([], null)}
                      >
                        선택 해제
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-xl px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      data-testid="planning-canvas-inbox-collapse-toggle"
                      onClick={() =>
                        onUpdateStackCanvasState({
                          isInboxCollapsed: !isInboxCollapsed,
                        })
                      }
                    >
                      {isInboxCollapsed ? 'Inbox 펼치기' : 'Inbox 접기'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex min-w-max items-start gap-3 pb-1">
                    {dockLanes.map((lane) => (
                      <CategoryNode
                        key={lane.id}
                        laneId={lane.id}
                        label={lane.label}
                        color={lane.color}
                        count={lane.items.length}
                        isEmpty={lane.items.length === 0}
                        isArmed={Boolean(selectedCardId) || selectedCardIds.length > 0}
                        isActive={
                          lane.id === UNCATEGORIZED_BOARD_LANE
                            ? focusedLaneId === UNCATEGORIZED_BOARD_LANE
                            : activeLane?.id === lane.id
                        }
                        compact
                        onClick={handleSelectNode}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
                {uncategorizedLane ? (
                  <CategoryStackLane
                    lane={inboxLane}
                    selectedCardId={selectedCardId}
                    selectedCardIds={selectedCardIds}
                    showNode={false}
                    isNodeActive={focusedLaneId === UNCATEGORIZED_BOARD_LANE}
                    emptyMessage="새 카드가 여기 들어옵니다. 위 도크를 눌러 바로 분류하세요."
                    collapsed={isInboxCollapsed}
                    collapsedMessage="Inbox를 접어두었습니다. 필요할 때 다시 펼쳐 검색하고 정리하세요."
                    headerActions={
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inboxSearch}
                          onChange={(event) => setInboxSearch(event.target.value)}
                          className="ui-input h-8 w-36 px-3 py-1 text-xs"
                          placeholder="Inbox 검색"
                          data-testid="planning-canvas-inbox-search"
                        />
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-900/60">
                          {INBOX_FILTER_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              data-testid={`planning-canvas-inbox-filter-${option.value}`}
                              className={`rounded-lg px-2 py-1 text-[11px] transition-colors ${
                                inboxFilter === option.value
                                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                              }`}
                              onClick={() => onUpdateStackCanvasState({ inboxFilter: option.value })}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    }
                    onEditCard={setEditingCard}
                    onSelectCard={(item) => setSelectedCard(item)}
                    onToggleCardSelect={(item) => toggleSelectedCard(item)}
                    onSelectNode={handleSelectNode}
                    scheduleDraggable={scheduleDraggable}
                    onScheduleDragStart={onScheduleDragStart}
                    onScheduleDragEnd={onScheduleDragEnd}
                  />
                ) : null}

                {activeLane ? (
                  <CategoryStackLane
                    key={activeLane.id}
                    lane={activeLane}
                    selectedCardId={selectedCardId}
                    selectedCardIds={selectedCardIds}
                    showNode={false}
                    isNodeActive
                    emptyMessage="이 카테고리는 아직 비어 있습니다. Inbox 카드나 다른 카테고리 카드를 위 도크로 보내 보세요."
                    onEditCard={setEditingCard}
                    onSelectCard={(item) => setSelectedCard(item)}
                    onToggleCardSelect={(item) => toggleSelectedCard(item)}
                    onSelectNode={handleSelectNode}
                    scheduleDraggable={scheduleDraggable}
                    onScheduleDragStart={onScheduleDragStart}
                    onScheduleDragEnd={onScheduleDragEnd}
                  />
                ) : (
                  <div className="rounded-3xl bg-white/45 p-6 text-sm text-slate-500 shadow-sm backdrop-blur-sm dark:bg-slate-950/35 dark:text-slate-400">
                    아직 카테고리가 없습니다. 먼저 카테고리를 만든 뒤, 위 도크에서 선택하면 해당 스택이 여기 열립니다.
                  </div>
                )}
              </div>
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
