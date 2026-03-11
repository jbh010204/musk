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
  groupBoardCardsByCategory,
  UNCATEGORIZED_BOARD_LANE,
} from '../../../entities/planner'
import { Card } from '../../../shared/ui'
import BoardCard from './BoardCard'
import BoardCardEditorModal from './BoardCardEditorModal'
import BoardToolbar from './BoardToolbar'
import CategoryStackLane from './CategoryStackLane'

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

function PlanningBoard({
  items = [],
  categories = [],
  onCreateCard = () => false,
  onUpdateCard = () => {},
  onApplyLayout = () => {},
  onOpenCategoryManager = () => {},
  embedded = false,
}) {
  const [editingCard, setEditingCard] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }))
  const lanes = useMemo(() => groupBoardCardsByCategory(items, categories), [categories, items])
  const [laneState, setLaneState] = useState(() => createLaneState(lanes))

  const cardMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const laneMap = useMemo(() => new Map(lanes.map((lane) => [lane.id, lane])), [lanes])
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

  useEffect(() => {
    setLaneState(createLaneState(lanes))
  }, [lanes])

  const scheduledCards = items.filter((item) => item.linkedTimeBoxIds?.length > 0).length
  const uncategorizedCount =
    visualLanes.find((lane) => lane.id === UNCATEGORIZED_BOARD_LANE)?.items.length || 0
  const activeCard = activeCardId ? cardMap.get(activeCardId) || null : null
  const moveCardToLane = (cardId, targetLaneId) => {
    const nextLaneState = createLaneState(visualLanes)
    const sourceLane = nextLaneState.find((lane) => lane.items.includes(cardId))
    const targetLane = nextLaneState.find((lane) => lane.id === targetLaneId)

    if (!sourceLane || !targetLane) {
      return
    }

    sourceLane.items = sourceLane.items.filter((itemId) => itemId !== cardId)
    targetLane.items = [...targetLane.items, cardId]
    commitLaneState(nextLaneState)
  }

  const commitLaneState = (nextLaneState) => {
    setLaneState(nextLaneState)
    onApplyLayout(buildBoardLayoutEntries(nextLaneState))
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
          const reordered = arrayMove(activeLane.items, activeIndex, activeLane.items.length - 1)
          activeLane.items = reordered
          commitLaneState(nextLaneState)
          return
        }

        setLaneState(nextLaneState)
        return
      }

      const reordered = arrayMove(activeLane.items, activeIndex, overIndex)
      activeLane.items = reordered
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
    if (!selectedCardId) {
      return
    }

    moveCardToLane(selectedCardId, laneId)
    setSelectedCardId(null)
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
    <section data-testid="planning-board-view" className={embedded ? 'space-y-4' : 'space-y-6'}>
      <BoardToolbar
        totalCards={items.length}
        scheduledCards={scheduledCards}
        uncategorizedCount={uncategorizedCount}
        onCreateCard={() => setEditingCard({})}
        onOpenCategoryManager={onOpenCategoryManager}
        embedded={embedded}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <Card className={`overflow-hidden ${embedded ? 'p-4' : 'p-6'}`}>
          <div
            className={`rounded-[28px] bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.25)_1px,transparent_0)] bg-[length:22px_22px] ${embedded ? 'p-4' : 'p-5'} dark:bg-[radial-gradient(circle_at_1px_1px,rgba(71,85,105,0.35)_1px,transparent_0)]`}
          >
            <div className={`grid gap-5 ${embedded ? 'grid-cols-1' : 'xl:grid-cols-3'}`}>
              {visualLanes.map((lane) => (
                <CategoryStackLane
                  key={lane.id}
                  lane={lane}
                  selectedCardId={selectedCardId}
                  onEditCard={setEditingCard}
                  onSelectCard={(item) => setSelectedCardId(item.id)}
                  onSelectNode={handleSelectNode}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card tone="subtle" className="p-4 text-sm text-slate-500 dark:text-slate-400">
          다음 단계는 편성기에서 이 카드를 30분 스냅 시간표에 끼워 넣는 것입니다.
        </Card>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[280px]">
              <BoardCard
                item={activeCard}
                color={
                  activeCard.categoryId
                    ? getCategoryColor(categories.find((category) => category.id === activeCard.categoryId), null)
                    : '#94a3b8'
                }
                sortable={false}
                onEdit={() => {}}
              />
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

export default PlanningBoard
