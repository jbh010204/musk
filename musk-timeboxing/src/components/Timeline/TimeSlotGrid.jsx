import { useDroppable } from '@dnd-kit/core'
import { TOTAL_SLOTS, slotToTime } from '../../utils/timeSlot'

function TimeSlotRow({ slotIndex, onSlotClick, showDropGuide }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-slot-${slotIndex}`,
    data: {
      type: 'TIMELINE_SLOT',
      slotIndex,
    },
  })

  const label = slotToTime(slotIndex)
  const showLabel = label.endsWith(':00')

  return (
    <div className="flex h-8 border-b border-gray-700">
      <div className="w-16 shrink-0 px-2 text-right text-xs leading-8 text-gray-500">
        {showLabel ? label : ''}
      </div>

      <button
        ref={setNodeRef}
        type="button"
        data-timeline-slot-index={slotIndex}
        onClick={() => onSlotClick(slotIndex)}
        className={`relative block flex-1 text-left ${
          showDropGuide ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'bg-transparent'
        } ${isOver ? 'bg-indigo-500/20 ring-1 ring-inset ring-indigo-400' : ''}`}
        aria-label={`${label} 슬롯`}
      />
    </div>
  )
}

function TimeSlotGrid({ onSlotClick, showDropGuide = false }) {
  return (
    <div className="relative" data-timeline-grid="true">
      {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
        <TimeSlotRow
          key={slotIndex}
          slotIndex={slotIndex}
          onSlotClick={onSlotClick}
          showDropGuide={showDropGuide}
        />
      ))}

      <div className="flex h-8">
        <div className="w-16 shrink-0 px-2 text-right text-xs leading-8 text-gray-500">24:00</div>
        <div className="flex-1" />
      </div>
    </div>
  )
}

export default TimeSlotGrid
