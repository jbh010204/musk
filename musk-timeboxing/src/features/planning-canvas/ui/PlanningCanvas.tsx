import {
  DndContext,
  DragOverlay,
  MouseSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  buildBoardLayoutEntries,
  createStackCanvasCardSelectionPatch,
  getCategoryColor,
  resolveStackCanvasSelectedCardIds,
  sanitizeStackCanvasCardSelection,
  getTaskCardStackCanvasStatus,
  groupBoardCardsByCategory,
  UNCATEGORIZED_BOARD_LANE,
} from '../../../entities/planner'
import type { CategoryViewModel, TaskCard, TimeBox } from '../../../entities/planner/model/types'
import { Button, Card } from '../../../shared/ui'
import { INBOX_FILTER_OPTIONS, filterInboxItems, type InboxFilterValue } from '../lib/inboxFilters'
import { COMPACT_CARD_DRAG_OVERLAY_MODIFIER } from '../../planner-dnd/lib/dragOverlay'
import CanvasInlineCreateSlot from './CanvasInlineCreateSlot'
import CanvasSelectionBar from './CanvasSelectionBar'
import BoardCardEditorModal from '../../planning-board/ui/BoardCardEditorModal'
import CategoryNode from '../../planning-board/ui/CategoryNode'
import CategoryStackLane from '../../planning-board/ui/CategoryStackLane'

const BoardCardEditorModalCompat = BoardCardEditorModal as unknown as ComponentType<Record<string, unknown>>
const CategoryNodeCompat = CategoryNode as unknown as ComponentType<Record<string, unknown>>
const CategoryStackLaneCompat = CategoryStackLane as unknown as ComponentType<Record<string, unknown>>

interface LaneStateEntry {
  id: string
  items: string[]
}

interface LaneViewModel {
  id: string
  label: string
  color: string
  items: TaskCard[]
}

interface PlanningCanvasProps {
  stackCanvasState?: Record<string, unknown>
  taskCards?: TaskCard[]
  categories?: CategoryViewModel[]
  timeBoxes?: TimeBox[]
  onUpdateStackCanvasState?: (patch: Record<string, unknown>) => void
  onCreateCard?: (payload: Record<string, unknown>) => boolean
  onUpdateCard?: (id: string, payload: Record<string, unknown>) => void
  onApplyLayout?: (entries: unknown[]) => void
  onOpenCategoryManager?: () => void
  onOpenComposer?: () => void
  selectedCardId?: string | null
  selectedCardIds?: string[] | null
  onSelectCard?: ((cardId: string | null) => void) | null
  onSelectCards?: ((cardIds: string[]) => void) | null
  onSendSelectedCardsToBigThree?: (cardIds: string[]) => number
  onScheduleSelectedCardsToFirstOpen?: (cardIds: string[]) => boolean
  scheduleDraggable?: boolean
  onScheduleDragStart?: (item: TaskCard) => void
  onScheduleDragEnd?: () => void
  embedded?: boolean
}

const resolveLaneIdFromOver = (overId: string | null, lanes: LaneViewModel[]): string | null => {
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

const createLaneState = (lanes: LaneViewModel[]): LaneStateEntry[] =>
  lanes.map((lane) => ({
    id: lane.id,
    items: lane.items.map((item) => item.id),
  }))

const areIdsEqual = (left: string[] = [], right: string[] = []) =>
  left.length === right.length && left.every((itemId, index) => itemId === right[index])

function PlanningCanvas({
  stackCanvasState,
  taskCards = [],
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
}: PlanningCanvasProps) {
  const initialSelectedCardId =
    typeof stackCanvasState?.selectedCardId === 'string' ? stackCanvasState.selectedCardId : null
  const initialSelectedCardIds = Array.isArray(stackCanvasState?.selectedCardIds)
    ? stackCanvasState.selectedCardIds.filter((item): item is string => typeof item === 'string')
    : []
  const [editingCard, setEditingCard] = useState<TaskCard | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [inboxSearch, setInboxSearch] = useState('')
  const [internalSelectedCardId, setInternalSelectedCardId] = useState(
    controlledSelectedCardId ?? initialSelectedCardId,
  )
  const [internalSelectedCardIds, setInternalSelectedCardIds] = useState(
    Array.isArray(controlledSelectedCardIds)
      ? controlledSelectedCardIds
      : initialSelectedCardIds,
  )
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }))
  const lanes = useMemo(() => groupBoardCardsByCategory(taskCards, categories), [taskCards, categories])
  const [laneState, setLaneState] = useState<LaneStateEntry[]>(() => createLaneState(lanes))
  const cardMap = useMemo(() => new Map(taskCards.map((item) => [item.id, item])), [taskCards])
  const laneMap = useMemo(() => new Map(lanes.map((lane) => [lane.id, lane])), [lanes])
  const isControlledSelection = typeof onSelectCard === 'function' || typeof onSelectCards === 'function'
  const rawSelectedCardId = isControlledSelection ? controlledSelectedCardId : internalSelectedCardId
  const rawSelectedCardIds = useMemo(
    () =>
      isControlledSelection
        ? Array.isArray(controlledSelectedCardIds)
          ? controlledSelectedCardIds.filter((item): item is string => typeof item === 'string')
          : []
        : internalSelectedCardIds,
    [controlledSelectedCardIds, internalSelectedCardIds, isControlledSelection],
  )
  const resolvedRawSelectedCardIds = useMemo(
    () => resolveStackCanvasSelectedCardIds(rawSelectedCardId, rawSelectedCardIds),
    [rawSelectedCardId, rawSelectedCardIds],
  )
  const { selectedCardId, selectedCardIds } = useMemo(
    () => sanitizeStackCanvasCardSelection(cardMap, rawSelectedCardId, rawSelectedCardIds),
    [cardMap, rawSelectedCardId, rawSelectedCardIds],
  )
  const hasPersistedFocusedLaneId = typeof stackCanvasState?.focusedLaneId === 'string'
  const focusedLaneId: string = hasPersistedFocusedLaneId
    ? (stackCanvasState.focusedLaneId as string)
    : UNCATEGORIZED_BOARD_LANE
  const inboxFilter: InboxFilterValue =
    stackCanvasState?.inboxFilter === 'TODO' ||
    stackCanvasState?.inboxFilter === 'SCHEDULED' ||
    stackCanvasState?.inboxFilter === 'COMPLETED'
      ? stackCanvasState.inboxFilter
      : 'ALL'
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
  const scheduledCards = taskCards.filter((item) => item.linkedTimeBoxIds?.length > 0).length
  const completedCards = taskCards.filter(
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

    if (hasPersistedFocusedLaneId && focusedLaneId === UNCATEGORIZED_BOARD_LANE) {
      return null
    }

    return visualLanes.find((lane) => lane.id !== UNCATEGORIZED_BOARD_LANE) || null
  }, [focusedLaneId, hasPersistedFocusedLaneId, visualLanes])
  const orderedDockLaneIds = useMemo(() => dockLanes.map((lane) => lane.id), [dockLanes])

  useEffect(() => {
    setLaneState(createLaneState(lanes))
  }, [lanes])

  useEffect(() => {
    const nextSelectedCardIds = selectedCardIds
    const nextSelectedCardId = selectedCardId
    const shouldUpdateIds = !areIdsEqual(nextSelectedCardIds, resolvedRawSelectedCardIds)
    const shouldUpdateId = nextSelectedCardId !== rawSelectedCardId

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
  }, [onSelectCard, onSelectCards, rawSelectedCardId, resolvedRawSelectedCardIds, selectedCardId, selectedCardIds])

  const applySelection = (nextSelectedCardIds: string[], nextSelectedCardId: string | null = null) => {
    const nextSelectionPatch = createStackCanvasCardSelectionPatch(
      cardMap,
      nextSelectedCardIds,
      nextSelectedCardId,
    )

    if (onSelectCards) {
      onSelectCards(nextSelectionPatch.selectedCardIds)
    } else {
      setInternalSelectedCardIds(nextSelectionPatch.selectedCardIds)
    }

    if (onSelectCard) {
      onSelectCard(nextSelectionPatch.selectedCardId)
    } else {
      setInternalSelectedCardId(nextSelectionPatch.selectedCardId)
    }

    onUpdateStackCanvasState(nextSelectionPatch)
  }

  const setSelectedCard = (itemOrId: TaskCard | string | null) => {
    const nextId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id || null
    applySelection(nextId ? [nextId] : [], nextId)
  }

  const toggleSelectedCard = (itemOrId: TaskCard | string | null) => {
    const nextId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id || null
    if (!nextId) {
      applySelection([], null)
      return
    }

    if (selectedCardIds.includes(nextId)) {
      const nextSelectedCardIds = selectedCardIds.filter((itemId) => itemId !== nextId)
      applySelection(nextSelectedCardIds, nextSelectedCardIds[nextSelectedCardIds.length - 1] ?? null)
      return
    }

    applySelection([...selectedCardIds, nextId], nextId)
  }

  const commitLaneState = useCallback((nextLaneState: LaneStateEntry[]) => {
    setLaneState(nextLaneState)
    onApplyLayout(buildBoardLayoutEntries(nextLaneState))
  }, [onApplyLayout])

  const moveCardsToLane = useCallback((cardIds: string[], targetLaneId: string) => {
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

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveCardId(typeof active?.id === 'string' ? active.id : null)
  }

  const handleDragCancel = (_event?: DragCancelEvent) => {
    setActiveCardId(null)
    setLaneState(createLaneState(lanes))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
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

  const handleSelectNode = useCallback((laneId: string) => {
    const armedCardIds = resolveStackCanvasSelectedCardIds(selectedCardId, selectedCardIds)
    if (armedCardIds.length === 0) {
      onUpdateStackCanvasState({
        focusedLaneId: laneId,
      })
      return
    }

    moveCardsToLane(armedCardIds, laneId)
    onUpdateStackCanvasState({
      selectedCardId: armedCardIds[armedCardIds.length - 1] ?? null,
      selectedCardIds: armedCardIds,
      focusedLaneId: laneId,
    })
  }, [moveCardsToLane, onUpdateStackCanvasState, selectedCardId, selectedCardIds])

  const moveSelectionAcrossDock = useCallback((offset: number) => {
    const armedCardIds = resolveStackCanvasSelectedCardIds(selectedCardId, selectedCardIds)
    if (armedCardIds.length === 0 || orderedDockLaneIds.length === 0) {
      return
    }

    const anchorCard = cardMap.get(armedCardIds[armedCardIds.length - 1]) || null
    const currentLaneId = anchorCard
      ? anchorCard.categoryId || UNCATEGORIZED_BOARD_LANE
      : focusedLaneId || UNCATEGORIZED_BOARD_LANE
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

  const handleSubmitEditor = (payload: Record<string, unknown>) => {
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

  const handleInlineCreate = ({
    title,
    estimateSlots = 1,
    categoryId = null,
  }: {
    title: string
    estimateSlots?: number
    categoryId?: string | null
  }) =>
    onCreateCard({
      title,
      estimateSlots,
      categoryId,
      note: '',
    })

  const collisionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    return closestCorners(args)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return
      }

      const target = event.target
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.closest('[role="dialog"]'))

      if (editingCard || isEditableTarget) {
        return
      }

      const armedCardIds = resolveStackCanvasSelectedCardIds(selectedCardId, selectedCardIds)
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

      if (event.key === '[' || event.code === 'BracketLeft') {
        event.preventDefault()
        moveSelectionAcrossDock(-1)
        return
      }

      if (event.key === ']' || event.code === 'BracketRight') {
        event.preventDefault()
        moveSelectionAcrossDock(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingCard, moveSelectionAcrossDock, onScheduleSelectedCardsToFirstOpen, onSendSelectedCardsToBigThree, selectedCardId, selectedCardIds])

  const headerContent: ReactNode = (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Stack Canvas
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            전체 {taskCards.length}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            미분류 {uncategorizedCount}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            예정 {scheduledCards}
          </span>
          {completedCards > 0 ? (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              완료 {completedCards}
            </span>
          ) : null}
          {selectedCardIds.length > 1 ? (
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              선택 {selectedCardIds.length}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          className={embedded ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
          onClick={onOpenCategoryManager}
        >
          카테고리
        </Button>
        {!embedded ? (
          <Button variant="secondary" className="px-3 py-2 text-sm" onClick={onOpenComposer}>
            우측 타임라인 보기
          </Button>
        ) : null}
      </div>
    </div>
  )

  const canvasContent: ReactNode = (
    <div
      data-testid="planning-canvas-surface"
      className={`rounded-[28px] bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.14)_1px,transparent_0)] bg-[length:24px_24px] ${embedded ? 'p-3' : 'p-5'} dark:bg-[radial-gradient(circle_at_1px_1px,rgba(71,85,105,0.2)_1px,transparent_0)]`}
    >
      <div className="space-y-4">
        <CanvasSelectionBar
          selectedCount={selectedCardIds.length}
          onMovePrev={() => moveSelectionAcrossDock(-1)}
          onMoveNext={() => moveSelectionAcrossDock(1)}
          onSendToBigThree={() => onSendSelectedCardsToBigThree(selectedCardIds)}
          onSchedule={() => onScheduleSelectedCardsToFirstOpen(selectedCardIds)}
          onClear={() => applySelection([], null)}
        />

        <div
          className={`${
            embedded
              ? 'rounded-[1.5rem] border border-slate-200/70 bg-white/72 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-slate-800/70 dark:bg-slate-950/28'
              : 'rounded-[1.85rem] border border-slate-200/70 bg-white/74 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/35'
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Category Dock
            </p>
            <button
              type="button"
              className="rounded-full border border-slate-200/80 bg-white/88 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300/90 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/82 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
              onClick={onOpenCategoryManager}
            >
              + 카테고리
            </button>
          </div>

          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-stretch gap-2 rounded-[1.35rem] bg-slate-100/72 p-1.5 dark:bg-slate-900/55">
              {dockLanes.map((lane) => (
                <CategoryNodeCompat
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

        <div className="grid gap-3 xl:grid-cols-[minmax(16rem,17.5rem)_minmax(0,1fr)]">
          {uncategorizedLane ? (
            <CategoryStackLaneCompat
              lane={inboxLane}
              selectedCardId={selectedCardId}
              selectedCardIds={selectedCardIds}
              showNode={false}
              isNodeActive={focusedLaneId === UNCATEGORIZED_BOARD_LANE}
              emptyMessage="새 카드가 여기 들어옵니다."
              headerActions={
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={inboxSearch}
                    onChange={(event) => setInboxSearch(event.target.value)}
                    className="ui-input h-9 min-w-[12rem] flex-1 px-3 py-1 text-xs"
                    placeholder="Inbox 검색"
                    data-testid="planning-canvas-inbox-search"
                  />
                  <select
                    data-testid="planning-canvas-inbox-filter"
                    className="ui-input h-9 w-[7.5rem] shrink-0 rounded-full px-3 py-1 text-xs"
                    value={inboxFilter}
                    onChange={(event) => onUpdateStackCanvasState({ inboxFilter: event.target.value })}
                  >
                    {INBOX_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              }
              leadingContent={
                <CanvasInlineCreateSlot
                  testId="planning-canvas-inbox-create"
                  title="새 미분류 일정"
                  placeholder="내용 입력 후 Enter"
                  color={inboxLane?.color}
                  onCreate={({ title, estimateSlots }) =>
                    handleInlineCreate({
                      title,
                      estimateSlots,
                      categoryId: null,
                    })
                  }
                />
              }
              onEditCard={setEditingCard}
              onSelectCard={(item) => setSelectedCard(item)}
              onToggleCardSelect={(item) => toggleSelectedCard(item)}
              onSelectNode={handleSelectNode}
              scheduleDraggable={scheduleDraggable}
              onScheduleDragStart={onScheduleDragStart}
              onScheduleDragEnd={onScheduleDragEnd}
              compactSurface={embedded}
            />
          ) : null}

          {activeLane ? (
            <CategoryStackLaneCompat
              key={activeLane.id}
              lane={activeLane}
              selectedCardId={selectedCardId}
              selectedCardIds={selectedCardIds}
              showNode={false}
              isNodeActive
              emptyMessage="이 카테고리는 아직 비어 있습니다."
              leadingContent={
                <CanvasInlineCreateSlot
                  testId="planning-canvas-open-create"
                  title={`${activeLane.label} 새 일정`}
                  placeholder="여기서 바로 만들기"
                  color={activeLane.color}
                  onCreate={({ title, estimateSlots }) =>
                    handleInlineCreate({
                      title,
                      estimateSlots,
                      categoryId: activeLane.id === UNCATEGORIZED_BOARD_LANE ? null : activeLane.id,
                    })
                  }
                />
              }
              onEditCard={setEditingCard}
              onSelectCard={(item) => setSelectedCard(item)}
              onToggleCardSelect={(item) => toggleSelectedCard(item)}
              onSelectNode={handleSelectNode}
              scheduleDraggable={scheduleDraggable}
              onScheduleDragStart={onScheduleDragStart}
              onScheduleDragEnd={onScheduleDragEnd}
              compactSurface={embedded}
            />
          ) : (
            <div
              className={`rounded-2xl px-6 py-10 text-sm text-slate-500 dark:text-slate-400 ${
                embedded ? 'bg-slate-50/85 dark:bg-slate-900/40' : 'bg-white/45 shadow-sm backdrop-blur-sm'
              }`}
            >
              카테고리를 하나 만들면 이 영역이 바로 작업 스택으로 바뀝니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <section data-testid="planning-canvas-view" className={embedded ? 'space-y-4' : 'space-y-6'}>
      {embedded ? (
        <div className="border-b border-slate-200/70 px-1 pb-3 dark:border-slate-800/70">{headerContent}</div>
      ) : (
        <Card className="p-6">
          {headerContent}
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        {embedded ? (
          canvasContent
        ) : (
          <Card className="overflow-hidden p-6">{canvasContent}</Card>
        )}

        <DragOverlay modifiers={[COMPACT_CARD_DRAG_OVERLAY_MODIFIER]}>
          {activeCard ? (
            <div className="pointer-events-none w-[220px]">
              <div className="rounded-[1.2rem] border border-slate-200/90 bg-white/96 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] dark:border-slate-800/90 dark:bg-slate-950/96">
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
                <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                  {activeCard.title}
                </p>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  원하는 도크 위에 올려 놓으세요
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCard !== null ? (
        <BoardCardEditorModalCompat
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
