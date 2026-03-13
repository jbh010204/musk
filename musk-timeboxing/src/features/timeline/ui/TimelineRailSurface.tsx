import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { resolveStackCanvasSelectedCardIds, slotToTime } from '../../../entities/planner'
import type { BigThreeItem, CategoryViewModel, TimeBox } from '../../../entities/planner/model/types'
import CompletionModal from './CompletionModal'
import TimeBoxCard from './TimeBoxCard'
import TimeSlotGrid from './TimeSlotGrid'

const DEFAULT_BOX_SLOTS = 1
const DURATION_PRESETS = [1, 2, 3, 4]

interface PendingManualInput {
  slotIndex: number
  content: string
  durationSlots: number
}

interface ManualTimeBoxPayload {
  content: string
  startSlot: number
  durationSlots: number
}

interface MovingTimeBoxPreview {
  startSlot: number
  endSlot: number
  hasConflict: boolean
}

interface TimelineRailSurfaceProps {
  timeBoxes?: TimeBox[]
  categories?: CategoryViewModel[]
  slotHeight?: number
  labelWidth?: number
  selectedCardId?: string | null
  selectedCardIds?: string[]
  selectedBigThreeItem?: BigThreeItem | null
  onClearSelections?: () => void
  onScheduleBoardCard?: (cardId: string, slotIndex: number) => boolean
  onScheduleBoardCards?: (cardIds: string[], slotIndex: number) => boolean
  onScheduleBigThreeItem?: (bigThreeItemId: string, slotIndex: number) => boolean
  onCreateManualTimeBox?: (payload: ManualTimeBoxPayload) => boolean
  onResizeTimeBox?: ((id: string, endSlot: number) => void) | null
  updateTimeBox: (id: string, patch: Record<string, unknown>) => void
  removeTimeBox: (id: string) => void
  onDuplicateTimeBox?: (id: string) => boolean
  onTimerStart?: (id: string) => void
  onTimerPause?: (id: string) => void
  onTimerComplete?: (id: string) => void
  dropPreviewSlot?: number | null
  movingTimeBoxPreview?: MovingTimeBoxPreview | null
  showDropGuide?: boolean
  slotTestIdPrefix?: string | null
  nativeDraggingCardId?: string | null
  onNativeDragEnd?: () => void
  className?: string
  containerTestId?: string | null
  blockTestIdPrefix?: string | null
  emptyState?: ReactNode
  children?: ReactNode
}

function TimelineRailSurface({
  timeBoxes = [],
  categories = [],
  slotHeight = 32,
  labelWidth = 64,
  selectedCardId = null,
  selectedCardIds = [],
  selectedBigThreeItem = null,
  onClearSelections = () => {},
  onScheduleBoardCard = () => false,
  onScheduleBoardCards = () => false,
  onScheduleBigThreeItem = () => false,
  onCreateManualTimeBox = () => false,
  onResizeTimeBox = null,
  updateTimeBox,
  removeTimeBox,
  onDuplicateTimeBox = () => false,
  onTimerStart = () => {},
  onTimerPause = () => {},
  onTimerComplete = () => {},
  dropPreviewSlot = null,
  movingTimeBoxPreview = null,
  showDropGuide = false,
  slotTestIdPrefix = null,
  nativeDraggingCardId = null,
  onNativeDragEnd = () => {},
  className = '',
  containerTestId = null,
  blockTestIdPrefix = null,
  emptyState = null,
  children = null,
}: TimelineRailSurfaceProps) {
  const [pendingInput, setPendingInput] = useState<PendingManualInput | null>(null)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [resizePreview, setResizePreview] = useState<Record<string, number>>({})
  const [isComposing, setIsComposing] = useState(false)
  const [timerNow, setTimerNow] = useState(0)
  const [nativeOverSlot, setNativeOverSlot] = useState<number | null>(null)

  const sortedBoxes = useMemo(
    () => [...timeBoxes].sort((left, right) => left.startSlot - right.startSlot),
    [timeBoxes],
  )
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const selectedBox = useMemo(
    () => timeBoxes.find((box) => box.id === selectedBoxId) || null,
    [selectedBoxId, timeBoxes],
  )
  const hasRunningTimer = useMemo(
    () => timeBoxes.some((box) => Number.isFinite(box.timerStartedAt)),
    [timeBoxes],
  )
  const effectiveSelectedCardIds = resolveStackCanvasSelectedCardIds(selectedCardId, selectedCardIds)
  const hasSelection = Boolean(selectedBigThreeItem) || effectiveSelectedCardIds.length > 0
  const nativeDragActive = typeof nativeDraggingCardId === 'string' && nativeDraggingCardId.trim().length > 0

  useEffect(() => {
    if (!hasRunningTimer) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setTimerNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [hasRunningTimer])

  const clearSelections = () => {
    onClearSelections()
    setNativeOverSlot(null)
  }

  const tryScheduleAtSlot = (slotIndex: number, cardIdsOverride: string[] | null = null) => {
    if (selectedBigThreeItem?.id) {
      const created = onScheduleBigThreeItem(selectedBigThreeItem.id, slotIndex)
      if (created) {
        clearSelections()
      }
      return created
    }

    const targetCardIds = Array.isArray(cardIdsOverride) && cardIdsOverride.length > 0
      ? [...new Set(cardIdsOverride.filter(Boolean))]
      : effectiveSelectedCardIds

    if (targetCardIds.length > 1) {
      const created = onScheduleBoardCards(targetCardIds, slotIndex)
      if (created) {
        clearSelections()
      }
      return created
    }

    if (targetCardIds.length === 1) {
      const created = onScheduleBoardCard(targetCardIds[0], slotIndex)
      if (created) {
        clearSelections()
      }
      return created
    }

    return false
  }

  const handleSlotClick = (slotIndex: number) => {
    if (hasSelection) {
      tryScheduleAtSlot(slotIndex)
      return
    }

    setPendingInput({ slotIndex, content: '', durationSlots: DEFAULT_BOX_SLOTS })
  }

  const handlePendingSubmit = () => {
    if (!pendingInput) {
      return
    }

    const trimmed = pendingInput.content.trim()
    if (!trimmed) {
      setPendingInput(null)
      return
    }

    const created = onCreateManualTimeBox({
      content: trimmed,
      startSlot: pendingInput.slotIndex,
      durationSlots: pendingInput.durationSlots,
    })

    if (created) {
      setPendingInput(null)
    }
  }

  const handleResizePreview = (id: string, endSlot: number) => {
    setResizePreview((prev) => ({
      ...prev,
      [id]: endSlot,
    }))
  }

  const handleResizeEnd = (id: string, endSlot: number) => {
    if (typeof onResizeTimeBox === 'function') {
      onResizeTimeBox(id, endSlot)
    } else {
      updateTimeBox(id, { endSlot })
    }
    setResizePreview((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleNativeSlotDrop = (slotIndex: number, cardId: string | null) => {
    if (!cardId) {
      setNativeOverSlot(null)
      onNativeDragEnd()
      return
    }

    const cardIds =
      effectiveSelectedCardIds.includes(cardId) && effectiveSelectedCardIds.length > 0
        ? effectiveSelectedCardIds
        : [cardId]

    tryScheduleAtSlot(slotIndex, cardIds)
    setNativeOverSlot(null)
    onNativeDragEnd()
  }

  return (
    <div className={className} data-testid={containerTestId || undefined}>
      {children}

      <div className="overflow-x-auto">
        {sortedBoxes.length === 0 && emptyState ? <div className="mb-3">{emptyState}</div> : null}

        <div className="relative min-w-[420px]" data-timeline-grid-shell="true">
          <TimeSlotGrid
            onSlotClick={handleSlotClick}
            showDropGuide={showDropGuide || hasSelection}
            rowHeight={slotHeight}
            labelWidth={labelWidth}
            slotTestIdPrefix={slotTestIdPrefix}
            nativeDragActive={nativeDragActive}
            nativeOverSlot={nativeOverSlot}
            onNativeSlotHover={setNativeOverSlot}
            onNativeSlotDrop={handleNativeSlotDrop}
          />

          {showDropGuide && Number.isInteger(dropPreviewSlot) ? (
            <div
              data-testid="timeline-drop-preview"
              className="pointer-events-none absolute z-10"
              style={{ top: dropPreviewSlot * slotHeight, left: labelWidth, right: 8 }}
            >
              <div className="relative border-t-2 border-indigo-400/90">
                <span className="absolute -left-14 -top-3 rounded bg-indigo-600/80 px-1.5 py-0.5 text-[10px] text-white">
                  {slotToTime(dropPreviewSlot)}
                </span>
              </div>
            </div>
          ) : null}

          {movingTimeBoxPreview &&
          Number.isInteger(movingTimeBoxPreview.startSlot) &&
          Number.isInteger(movingTimeBoxPreview.endSlot) ? (
            <div
              data-testid="timeline-move-preview"
              className="pointer-events-none absolute z-20"
              style={{
                top: movingTimeBoxPreview.startSlot * slotHeight,
                height:
                  Math.max(1, movingTimeBoxPreview.endSlot - movingTimeBoxPreview.startSlot) *
                  slotHeight,
                left: labelWidth,
                right: 8,
              }}
            >
              <div
                className={`h-full rounded border-2 border-dashed px-2 py-1 text-[11px] ${
                  movingTimeBoxPreview.hasConflict
                    ? 'border-red-300 bg-red-500/20 text-red-100'
                    : 'border-cyan-300 bg-cyan-500/20 text-cyan-100'
                }`}
              >
                이동 예정 {slotToTime(movingTimeBoxPreview.startSlot)} ~{' '}
                {slotToTime(movingTimeBoxPreview.endSlot)}
                {movingTimeBoxPreview.hasConflict ? ' (겹침)' : ''}
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-y-0" style={{ left: labelWidth, right: 8 }}>
            {sortedBoxes.map((box) => (
              <TimeBoxCard
                key={box.id}
                testId={blockTestIdPrefix ? `${blockTestIdPrefix}-${box.id}` : 'timebox-card'}
                timeBox={box}
                slotHeight={slotHeight}
                previewEndSlot={resizePreview[box.id]}
                onResizePreview={handleResizePreview}
                onResizeEnd={handleResizeEnd}
                nowTimestamp={timerNow}
                onTimerStart={onTimerStart}
                onTimerPause={onTimerPause}
                onTimerComplete={onTimerComplete}
                categoryMeta={box.categoryId ? categoryMap.get(box.categoryId) : null}
                onTimeBoxClick={(timeBox) => setSelectedBoxId(timeBox.id)}
              />
            ))}

            {pendingInput ? (
              <div
                className="ui-panel-subtle pointer-events-auto absolute left-0 right-0 z-20 flex items-center gap-2 px-3 py-2"
                style={{ top: pendingInput.slotIndex * slotHeight }}
              >
                <input
                  type="text"
                  autoFocus
                  value={pendingInput.content}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onChange={(event) =>
                    setPendingInput((prev) =>
                      prev ? { ...prev, content: event.target.value } : prev,
                    )
                  }
                  onKeyDown={(event) => {
                    const nativeComposing =
                      'isComposing' in event.nativeEvent
                        ? event.nativeEvent.isComposing
                        : event.keyCode === 229

                    if (isComposing || nativeComposing) {
                      return
                    }

                    if (event.key === 'Enter') {
                      if (event.repeat) {
                        return
                      }

                      event.preventDefault()
                      handlePendingSubmit()
                    }

                    if (event.key === 'Escape') {
                      setPendingInput(null)
                    }
                  }}
                  onBlur={(event) => {
                    const related = event.relatedTarget as HTMLElement | null
                    if (related?.dataset.durationPreset) {
                      return
                    }
                    setPendingInput(null)
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                  placeholder="일정을 입력하고 엔터 (기본 30분)"
                />

                <div className="flex items-center gap-1">
                  {DURATION_PRESETS.map((presetSlots) => {
                    const isActive = pendingInput.durationSlots === presetSlots

                    return (
                      <button
                        key={presetSlots}
                        type="button"
                        data-duration-preset="true"
                        aria-label={`${presetSlots * 30}분 프리셋`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          setPendingInput((prev) =>
                            prev ? { ...prev, durationSlots: presetSlots } : prev,
                          )
                        }
                        className={`rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {presetSlots * 30}분
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedBox ? (
        <CompletionModal
          key={selectedBox.id}
          timeBox={selectedBox}
          categories={categories}
          onClose={() => setSelectedBoxId(null)}
          onUpdate={updateTimeBox}
          onDuplicate={(id) => {
            onDuplicateTimeBox(id)
            setSelectedBoxId(null)
          }}
          onDelete={(id) => {
            removeTimeBox(id)
            setSelectedBoxId(null)
          }}
        />
      ) : null}
    </div>
  )
}

export default TimelineRailSurface
