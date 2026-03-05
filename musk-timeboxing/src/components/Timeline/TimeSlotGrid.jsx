import { useDroppable } from '@dnd-kit/core'
import { TOTAL_SLOTS, slotToTime } from '../../utils/timeSlot'

function TimeSlotRow({ slotIndex, onSlotClick }) {
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
        className={`relative block flex-1 text-left ${isOver ? 'bg-indigo-500/20' : 'bg-transparent'}`}
        aria-label={`${label} 슬롯`}
      />
    </div>
  )
}

function TimeSlotGrid({ onSlotClick }) {
  return (
    <div className="relative">
      {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
        <TimeSlotRow key={slotIndex} slotIndex={slotIndex} onSlotClick={onSlotClick} />
      ))}

      <div className="flex h-8">
        <div className="w-16 shrink-0 px-2 text-right text-xs leading-8 text-gray-500">24:00</div>
        <div className="flex-1" />
      </div>
    </div>
  )
}

export default TimeSlotGrid
