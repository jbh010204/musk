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
import ComposerQueueCard from './ComposerQueueCard'
import ComposerTimeGrid from './ComposerTimeGrid'

const SLOT_HEIGHT = 32

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
  onJumpToDay = () => {},
  onJumpToBoard = () => {},
}) {
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }))
  const lanes = useMemo(
    () => groupBoardCardsByCategory(items, categories).filter((lane) => lane.items.length > 0),
    [categories, items],
  )
  const cardMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const activeCard = activeCardId ? cardMap.get(activeCardId) || null : null
  const visibleTimeBoxes = useMemo(
    () => [...timeBoxes].sort((left, right) => left.startSlot - right.startSlot),
    [timeBoxes],
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
      setSelectedCardId(null)
    }
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
    <section data-testid="schedule-composer-view" className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Schedule Composer
            </h3>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              카드를 시간표에 끼워 넣어 오늘 타임라인으로 넘깁니다.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              카드를 선택한 뒤 원하는 슬롯을 누르거나, 카드 자체를 시간표로 드래그해 배치합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onJumpToBoard}>
              보드로 돌아가기
            </Button>
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
        <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
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
                  보드 카드가 아직 없습니다.
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
                          onSelect={setSelectedCardId}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="overflow-hidden p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  오늘 시간표
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  30분 스냅 기준으로 즉시 타임박스를 만듭니다.
                </p>
              </div>
              {selectedCardId ? (
                <span className="rounded-xl bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  선택됨: {cardMap.get(selectedCardId)?.content}
                </span>
              ) : null}
            </div>

            <div className="relative min-w-[520px]">
              <ComposerTimeGrid
                onSlotClick={(slotIndex) => {
                  if (!selectedCardId) {
                    return
                  }

                  handleCreateFromCard(selectedCardId, slotIndex)
                }}
              />

              <div className="pointer-events-none absolute inset-y-0 left-16 right-2">
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
