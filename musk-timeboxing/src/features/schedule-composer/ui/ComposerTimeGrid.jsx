import { useDroppable } from '@dnd-kit/core'
import { slotToTime, TOTAL_SLOTS } from '../../../entities/planner'
import { WORKSPACE_LAYOUT } from '../../planner-workspace/lib/workspaceLayout'

function ComposerSlotRow({
  slotIndex,
  onSlotClick = () => {},
  onNativeSlotDrop = () => {},
  onNativeSlotHover = () => {},
  nativeOverSlot = null,
  nativeDragActive = false,
}) {
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
    <div
      className="flex border-b border-slate-200 dark:border-slate-800"
      style={{ height: WORKSPACE_LAYOUT.composerSlotHeightPx }}
    >
      <div
        className="shrink-0 px-2 text-right text-xs text-slate-500 dark:text-slate-400"
        style={{
          width: WORKSPACE_LAYOUT.composerLabelWidthPx,
          lineHeight: `${WORKSPACE_LAYOUT.composerSlotHeightPx}px`,
        }}
      >
        {showLabel ? label : ''}
      </div>
      <button
        ref={setNodeRef}
        type="button"
        data-testid={`composer-slot-${slotIndex}`}
        className={`relative block flex-1 text-left transition-colors ${
          isOver || nativeOverSlot === slotIndex
            ? 'bg-indigo-500/12 ring-1 ring-inset ring-indigo-400'
            : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
        }`}
        onClick={() => onSlotClick(slotIndex)}
        onDragOver={(event) => {
          if (!nativeDragActive) {
            return
          }

          event.preventDefault()
          onNativeSlotHover(slotIndex)
        }}
        onDragEnter={(event) => {
          if (!nativeDragActive) {
            return
          }

          event.preventDefault()
          onNativeSlotHover(slotIndex)
        }}
        onDragLeave={() => {
          if (nativeOverSlot === slotIndex) {
            onNativeSlotHover(null)
          }
        }}
        onDrop={(event) => {
          if (!nativeDragActive) {
            return
          }

          event.preventDefault()
          const cardId = event.dataTransfer.getData('text/planner-card-id')
          onNativeSlotDrop(slotIndex, cardId)
        }}
      />
    </div>
  )
}

function ComposerTimeGrid({
  onSlotClick = () => {},
  onNativeSlotDrop = () => {},
  onNativeSlotHover = () => {},
  nativeOverSlot = null,
  nativeDragActive = false,
}) {
  return (
    <div className="relative" data-testid="composer-time-grid">
      {Array.from({ length: TOTAL_SLOTS }).map((_, slotIndex) => (
        <ComposerSlotRow
          key={slotIndex}
          slotIndex={slotIndex}
          onSlotClick={onSlotClick}
          onNativeSlotDrop={onNativeSlotDrop}
          onNativeSlotHover={onNativeSlotHover}
          nativeOverSlot={nativeOverSlot}
          nativeDragActive={nativeDragActive}
        />
      ))}
      <div className="flex" style={{ height: WORKSPACE_LAYOUT.composerSlotHeightPx }}>
        <div
          className="shrink-0 px-2 text-right text-xs text-slate-500 dark:text-slate-400"
          style={{
            width: WORKSPACE_LAYOUT.composerLabelWidthPx,
            lineHeight: `${WORKSPACE_LAYOUT.composerSlotHeightPx}px`,
          }}
        >
          24:00
        </div>
        <div className="flex-1" />
      </div>
    </div>
  )
}

export default ComposerTimeGrid
