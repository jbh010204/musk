import { DndContext, DragOverlay, MouseSensor, closestCorners, pointerWithin, useSensor, useSensors } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import {
  getCategoryColor,
  getCategoryLabel,
  groupBoardCardsByCategory,
  hasOverlap,
  slotDurationMinutes,
  slotToTime,
} from '../../../entities/planner'
import { Button, Card } from '../../../shared/ui'
import { WORKSPACE_LAYOUT } from '../../planner-workspace/lib/workspaceLayout'
import ComposerQueueCard from './ComposerQueueCard'
import ComposerTimeGrid from './ComposerTimeGrid'

const SLOT_HEIGHT = WORKSPACE_LAYOUT.composerSlotHeightPx

const resolveSlotFromOver = (overId) => {
  if (typeof overId !== 'string' || !overId.startsWith('composer-slot-')) {
    return null
  }

  const slot = Number(overId.replace('composer-slot-', ''))
  return Number.isInteger(slot) ? slot : null
}

function ScheduleComposer({
  items = [],
  categories = [],
  timeBoxes = [],
  onScheduleCard = () => false,
  onScheduleCards = () => false,
  onScheduleBigThreeItem = () => false,
  onJumpToDay = () => {},
  onJumpToBoard = () => {},
  selectedCardId: controlledSelectedCardId = null,
  selectedCardIds: controlledSelectedCardIds = null,
  selectedBigThreeItem = null,
  onSelectCard = null,
  onSelectCards = null,
  onSelectBigThree = () => {},
  hideQueue = false,
  nativeDraggingCardId = null,
  onNativeDragEnd = () => {},
  embedded = false,
}) {
  const [internalSelectedCardId, setInternalSelectedCardId] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)
  const [nativeOverSlot, setNativeOverSlot] = useState(null)
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }))
  const lanes = useMemo(
    () => groupBoardCardsByCategory(items, categories).filter((lane) => lane.items.length > 0),
    [categories, items],
  )
  const cardMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const selectedCardId = controlledSelectedCardId ?? internalSelectedCardId
  const selectedCardIds = Array.isArray(controlledSelectedCardIds)
    ? controlledSelectedCardIds
    : selectedCardId
      ? [selectedCardId]
      : []
  const nativeDragActive = typeof nativeDraggingCardId === 'string' && nativeDraggingCardId.trim().length > 0
  const effectiveNativeOverSlot = nativeDragActive ? nativeOverSlot : null
  const activeCard = activeCardId ? cardMap.get(activeCardId) || null : null
  const visibleTimeBoxes = useMemo(
    () => [...timeBoxes].sort((left, right) => left.startSlot - right.startSlot),
    [timeBoxes],
  )
  const selectedDurationMinutes = selectedCardIds.reduce(
    (sum, itemId) => sum + ((cardMap.get(itemId)?.estimatedSlots || 1) * 30),
    0,
  )

  const handleCreateFromCard = (cardId, startSlot) => {
    const card = cardMap.get(cardId)
    if (!card) {
      return false
    }

    const nextBox = {
      startSlot,
      endSlot: startSlot + card.estimatedSlots,
    }

    if (hasOverlap(timeBoxes, nextBox)) {
      return false
    }

    const success = onScheduleCard(card.id, startSlot)
    if (success) {
      if (onSelectCard) {
        onSelectCard(null)
      } else {
        setInternalSelectedCardId(null)
      }
      if (onSelectCards) {
        onSelectCards([])
      }
      onSelectBigThree(null)
    }
    setNativeOverSlot(null)
    return success
  }

  const handleCreateFromCards = (cardIds, startSlot) => {
    const normalizedIds = [...new Set(cardIds.filter((itemId) => cardMap.has(itemId)))]
    if (normalizedIds.length === 0) {
      return false
    }

    const success = onScheduleCards(normalizedIds, startSlot)
    if (success) {
      if (onSelectCard) {
        onSelectCard(null)
      } else {
        setInternalSelectedCardId(null)
      }
      if (onSelectCards) {
        onSelectCards([])
      }
      onSelectBigThree(null)
    }
    setNativeOverSlot(null)
    return success
  }

  const handleCreateFromBigThree = (bigThreeId, startSlot) => {
    const success = onScheduleBigThreeItem(bigThreeId, startSlot)
    if (success) {
      if (onSelectCard) {
        onSelectCard(null)
      } else {
        setInternalSelectedCardId(null)
      }
      if (onSelectCards) {
        onSelectCards([])
      }
      onSelectBigThree(null)
    }
    setNativeOverSlot(null)
    return success
  }

  const handleDragEnd = ({ active, over }) => {
    const cardId =
      typeof active?.data?.current?.itemId === 'string'
        ? active.data.current.itemId
        : null
    const slotIndex = resolveSlotFromOver(typeof over?.id === 'string' ? over.id : null)

    setActiveCardId(null)

    if (!cardId || !Number.isInteger(slotIndex)) {
      return
    }

    handleCreateFromCard(cardId, slotIndex)
  }

  const collisionStrategy = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    return closestCorners(args)
  }

  return (
    <section data-testid="schedule-composer-view" className={embedded ? 'space-y-4' : 'space-y-6'}>
      <Card className={embedded ? 'p-4' : 'p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Schedule Composer
            </h3>
            <p className={`mt-2 font-semibold text-slate-900 dark:text-slate-100 ${embedded ? 'text-base' : 'text-lg'}`}>
              카드를 시간표에 배치합니다.
            </p>
            <p className={`mt-2 text-slate-500 dark:text-slate-400 ${embedded ? 'text-xs' : 'text-sm'}`}>
              카드를 먼저 선택한 뒤 원하는 슬롯을 눌러 배치합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!embedded ? (
              <Button variant="secondary" onClick={onJumpToBoard}>
                캔버스로 돌아가기
              </Button>
            ) : null}
            <Button variant="primary" onClick={onJumpToDay}>
              일간 타임라인 보기
            </Button>
          </div>
        </div>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragStart={({ active }) => {
          setActiveCardId(typeof active?.data?.current?.itemId === 'string' ? active.data.current.itemId : null)
        }}
        onDragCancel={() => setActiveCardId(null)}
        onDragEnd={handleDragEnd}
      >
        <div className={`grid gap-6 ${hideQueue ? 'grid-cols-1' : embedded ? 'grid-cols-1' : 'xl:grid-cols-[20rem_minmax(0,1fr)]'}`}>
          {!hideQueue ? (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    카드 큐
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    카테고리별로 정리된 카드를 오늘 시간표로 보냅니다.
                  </p>
                </div>
                <span className="rounded-xl bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
                  {items.length}개
                </span>
              </div>

              <div className="mt-4 space-y-5">
                {lanes.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50/80 px-4 py-5 text-sm text-slate-500 dark:bg-slate-900/45 dark:text-slate-400">
                    캔버스 카드가 아직 없습니다.
                  </div>
                ) : (
                  lanes.map((lane) => (
                    <div key={lane.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: lane.color }}
                        />
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {lane.label}
                        </p>
                      </div>
                      <div className="space-y-3">
                        {lane.items.map((item) => (
                          <ComposerQueueCard
                            key={item.id}
                            item={item}
                            color={lane.color}
                            isSelected={selectedCardId === item.id}
                            onSelect={(nextId) => {
                              if (onSelectCard) {
                                onSelectCard(nextId)
                                return
                              }

                              setInternalSelectedCardId(nextId)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  오늘 시간표
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {hideQueue
                    ? '왼쪽에서 대상을 하나 고른 뒤, 여기 슬롯을 눌러 30분 스냅으로 일정에 넣습니다.'
                    : '30분 스냅 기준으로 즉시 타임박스를 만듭니다.'}
                </p>
              </div>
              {selectedCardIds.length > 1 ? (
                <span className="rounded-xl bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {selectedCardIds.length}개 선택 · 총 {selectedDurationMinutes}분
                </span>
              ) : selectedCardId ? (
                <span className="rounded-xl bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  선택됨: {cardMap.get(selectedCardId)?.content}
                </span>
              ) : selectedBigThreeItem ? (
                <span className="rounded-xl bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Big3 선택: {selectedBigThreeItem.content}
                </span>
              ) : hideQueue ? (
                <span className="rounded-xl bg-slate-200/70 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
                  캔버스 또는 Big3에서 대상을 선택하세요
                </span>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <div className="relative" style={{ minWidth: embedded ? '100%' : WORKSPACE_LAYOUT.composerMinWidth }}>
              <ComposerTimeGrid
                onSlotClick={(slotIndex) => {
                  if (selectedCardIds.length > 1) {
                    handleCreateFromCards(selectedCardIds, slotIndex)
                    return
                  }

                  if (!selectedCardId) {
                    if (selectedBigThreeItem) {
                      handleCreateFromBigThree(selectedBigThreeItem.id, slotIndex)
                    }
                    return
                  }

                  handleCreateFromCard(selectedCardId, slotIndex)
                }}
                onNativeSlotDrop={(slotIndex, cardId) => {
                  if (!cardId) {
                    return
                  }

                  handleCreateFromCard(cardId, slotIndex)
                  onNativeDragEnd()
                }}
                onNativeSlotHover={setNativeOverSlot}
                nativeOverSlot={effectiveNativeOverSlot}
                nativeDragActive={nativeDragActive}
              />

              <div
                className="pointer-events-none absolute inset-y-0"
                style={{
                  left: WORKSPACE_LAYOUT.composerLabelWidthPx,
                  right: WORKSPACE_LAYOUT.composerBlocksInsetRightPx,
                }}
              >
                {visibleTimeBoxes.map((box) => {
                  const categoryMeta = box.categoryId
                    ? categories.find((category) => category.id === box.categoryId)
                    : null
                  const label = getCategoryLabel(categoryMeta, box)
                  const color = getCategoryColor(categoryMeta, box)

                  return (
                    <div
                      key={box.id}
                      data-testid={`composer-block-${box.id}`}
                      className="pointer-events-none absolute left-0 right-0 overflow-hidden rounded-2xl px-3 py-2 text-xs text-white shadow-sm"
                      style={{
                        top: box.startSlot * SLOT_HEIGHT,
                        height: (box.endSlot - box.startSlot) * SLOT_HEIGHT,
                        background: `linear-gradient(180deg, ${color}ee 0%, ${color}d2 100%)`,
                        borderLeft: `6px solid ${color}`,
                      }}
                    >
                      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-white/80">
                        {slotToTime(box.startSlot)} - {slotToTime(box.endSlot)}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold">{box.content}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-white/85">
                        <span>{slotDurationMinutes(box.startSlot, box.endSlot)}분</span>
                        {label ? <span>#{label}</span> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
              </div>
            </div>
          </Card>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[280px]">
              <ComposerQueueCard
                item={activeCard}
                color={
                  activeCard.categoryId
                    ? getCategoryColor(categories.find((category) => category.id === activeCard.categoryId), null)
                    : '#94a3b8'
                }
                onSelect={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  )
}

export default ScheduleComposer
