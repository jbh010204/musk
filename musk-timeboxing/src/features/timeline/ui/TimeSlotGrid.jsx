import { useDroppable } from '@dnd-kit/core'
import { TOTAL_SLOTS, slotToTime } from '../../../entities/planner'
import { createTimelineSlotDropPayload } from '../../planner-dnd/lib/payloads'

function TimeSlotRow({
  slotIndex,
  onSlotClick,
  showDropGuide,
  rowHeight,
  showQuarterDividers,
  labelWidth,
  slotTestIdPrefix,
  nativeDragActive,
  nativeOverSlot,
  onNativeSlotHover,
  onNativeSlotDrop,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-slot-${slotIndex}`,
    data: createTimelineSlotDropPayload(slotIndex),
  })

  const label = slotToTime(slotIndex)
  const showLabel = label.endsWith(':00')

  return (
    <div className="flex border-b border-gray-700" style={{ height: rowHeight }}>
      <div
        className="shrink-0 px-2 text-right text-xs text-slate-500 dark:text-slate-400"
        style={{ width: labelWidth, lineHeight: `${rowHeight}px` }}
      >
        {showLabel ? label : ''}
      </div>

      <button
        ref={setNodeRef}
        type="button"
        data-timeline-slot-index={slotIndex}
        data-testid={slotTestIdPrefix ? `${slotTestIdPrefix}-${slotIndex}` : undefined}
        onClick={() => onSlotClick(slotIndex)}
        className={`relative block flex-1 text-left transition-colors ${
          showDropGuide
            ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
            : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
        } ${isOver || nativeOverSlot === slotIndex ? 'bg-indigo-500/20 ring-1 ring-inset ring-indigo-400' : ''}`}
        aria-label={`${label} 슬롯`}
        onDragOver={(event) => {
          if (!nativeDragActive) {
            return
          }

          event.preventDefault()
          onNativeSlotHover?.(slotIndex)
        }}
        onDragEnter={(event) => {
          if (!nativeDragActive) {
            return
          }

          event.preventDefault()
          onNativeSlotHover?.(slotIndex)
        }}
        onDragLeave={() => {
          if (nativeOverSlot === slotIndex) {
            onNativeSlotHover?.(null)
          }
        }}
        onDrop={(event) => {
          if (!nativeDragActive) {
            return
          }

          event.preventDefault()
          const cardId = event.dataTransfer.getData('text/planner-card-id')
          onNativeSlotDrop?.(slotIndex, cardId)
        }}
      >
        {showQuarterDividers ? (
          <span
            className="pointer-events-none absolute inset-x-0 border-t border-gray-700/80"
            style={{ top: rowHeight / 2 }}
          />
        ) : null}
      </button>
    </div>
  )
}

function TimeSlotGrid({
  onSlotClick,
  showDropGuide = false,
  rowHeight = 32,
  showQuarterDividers = false,
  labelWidth = 64,
  slotTestIdPrefix = null,
  nativeDragActive = false,
  nativeOverSlot = null,
  onNativeSlotHover = () => {},
  onNativeSlotDrop = () => {},
}) {
  return (
    <div className="relative" data-timeline-grid="true">
      {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
        <TimeSlotRow
          key={slotIndex}
          slotIndex={slotIndex}
          onSlotClick={onSlotClick}
          showDropGuide={showDropGuide}
          rowHeight={rowHeight}
          showQuarterDividers={showQuarterDividers}
          labelWidth={labelWidth}
          slotTestIdPrefix={slotTestIdPrefix}
          nativeDragActive={nativeDragActive}
          nativeOverSlot={nativeOverSlot}
          onNativeSlotHover={onNativeSlotHover}
          onNativeSlotDrop={onNativeSlotDrop}
        />
      ))}

      <div className="flex" style={{ height: rowHeight }}>
        <div
          className="shrink-0 px-2 text-right text-xs text-slate-500 dark:text-slate-400"
          style={{ width: labelWidth, lineHeight: `${rowHeight}px` }}
        >
          24:00
        </div>
        <div className="flex-1" />
      </div>
    </div>
  )
}

export default TimeSlotGrid
