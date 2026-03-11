import { useDroppable } from '@dnd-kit/core'
import { slotToTime, TOTAL_SLOTS } from '../../../entities/planner'

function ComposerSlotRow({ slotIndex, onSlotClick = () => {} }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `composer-slot-${slotIndex}`,
    data: {
      type: 'COMPOSER_SLOT',
      slotIndex,
    },
  })

  const label = slotToTime(slotIndex)
  const showLabel = label.endsWith(':00')

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800" style={{ height: 32 }}>
      <div className="w-16 shrink-0 px-2 text-right text-xs text-slate-500 dark:text-slate-400" style={{ lineHeight: '32px' }}>
        {showLabel ? label : ''}
      </div>
      <button
        ref={setNodeRef}
        type="button"
        data-testid={`composer-slot-${slotIndex}`}
        className={`relative block flex-1 text-left transition-colors ${
          isOver
            ? 'bg-indigo-500/12 ring-1 ring-inset ring-indigo-400'
            : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
        }`}
        onClick={() => onSlotClick(slotIndex)}
      />
    </div>
  )
}

function ComposerTimeGrid({ onSlotClick = () => {} }) {
  return (
    <div className="relative" data-testid="composer-time-grid">
      {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
        <ComposerSlotRow key={slotIndex} slotIndex={slotIndex} onSlotClick={onSlotClick} />
      ))}
      <div className="flex" style={{ height: 32 }}>
        <div className="w-16 shrink-0 px-2 text-right text-xs text-slate-500 dark:text-slate-400" style={{ lineHeight: '32px' }}>
          24:00
        </div>
        <div className="flex-1" />
      </div>
    </div>
  )
}

export default ComposerTimeGrid
