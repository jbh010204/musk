import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useRef } from 'react'
import { getCategoryColor, getCategoryLabel, getTimeBoxVisual } from '../../utils/categoryVisual'
import { TOTAL_SLOTS, slotDurationMinutes } from '../../utils/timeSlot'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function TimeBoxCard({
  timeBox,
  categoryMeta,
  onTimeBoxClick,
  slotHeight = 32,
  previewEndSlot,
  onResizePreview,
  onResizeEnd,
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `time-box-${timeBox.id}`,
    data: {
      type: 'TIME_BOX',
      id: timeBox.id,
      startSlot: timeBox.startSlot,
      endSlot: timeBox.endSlot,
    },
  })

  const currentEndSlot = previewEndSlot ?? timeBox.endSlot
  const plannedMinutes = slotDurationMinutes(timeBox.startSlot, currentEndSlot)
  const snappedDragY = transform ? Math.round(transform.y / slotHeight) * slotHeight : 0
  const categoryLabel = getCategoryLabel(categoryMeta, timeBox)
  const categoryColor = getCategoryColor(categoryMeta, timeBox)
  const visual = getTimeBoxVisual(categoryColor, timeBox.status)

  const actualDiff = useMemo(() => {
    if (timeBox.status !== 'COMPLETED' || timeBox.actualMinutes == null) {
      return null
    }

    const diff = timeBox.actualMinutes - slotDurationMinutes(timeBox.startSlot, timeBox.endSlot)
    const sign = diff > 0 ? '+' : ''

    return {
      text: `계획 ${slotDurationMinutes(timeBox.startSlot, timeBox.endSlot)}분 → 실제 ${timeBox.actualMinutes}분 (${sign}${diff}분)`,
      className: diff > 0 ? 'text-orange-200' : diff < 0 ? 'text-green-200' : 'text-gray-200',
    }
  }, [timeBox])

  const resizingRef = useRef({
    startY: 0,
    startEnd: 0,
    currentEnd: currentEndSlot,
  })
  const pointerRef = useRef({
    startX: 0,
    startY: 0,
    moved: false,
  })

  const handleResizeMouseDown = (event) => {
    event.preventDefault()
    event.stopPropagation()

    resizingRef.current = {
      startY: event.clientY,
      startEnd: timeBox.endSlot,
      currentEnd: timeBox.endSlot,
    }

    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - resizingRef.current.startY
      const deltaSlots = Math.round(deltaY / slotHeight)
      const nextEnd = clamp(
        resizingRef.current.startEnd + deltaSlots,
        timeBox.startSlot + 1,
        TOTAL_SLOTS,
      )

      resizingRef.current.currentEnd = nextEnd
      onResizePreview?.(timeBox.id, nextEnd)
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      onResizeEnd?.(timeBox.id, resizingRef.current.currentEnd)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`absolute left-0 right-0 overflow-hidden rounded px-2 py-1 text-left text-xs text-white shadow pointer-events-auto ${
        isDragging ? 'z-40 opacity-80' : ''
      }`}
      style={{
        top: timeBox.startSlot * slotHeight,
        height: (currentEndSlot - timeBox.startSlot) * slotHeight,
        transform: transform ? CSS.Translate.toString({ x: 0, y: snappedDragY }) : undefined,
        background: visual.cardBackground,
        borderLeft: `8px solid ${visual.categoryStripe}`,
      }}
      onPointerDown={(event) => {
        pointerRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
        }
      }}
      onPointerMove={(event) => {
        if (pointerRef.current.moved) {
          return
        }

        const movedX = Math.abs(event.clientX - pointerRef.current.startX)
        const movedY = Math.abs(event.clientY - pointerRef.current.startY)
        if (movedX > 4 || movedY > 4) {
          pointerRef.current.moved = true
        }
      }}
      onClick={(event) => {
        if (pointerRef.current.moved) {
          event.preventDefault()
          pointerRef.current.moved = false
          return
        }

        onTimeBoxClick(timeBox)
      }}
      title={timeBox.content}
      {...listeners}
      {...attributes}
    >
      <span
        className="absolute right-2 top-2 rounded border px-1.5 py-0.5 text-[10px] font-semibold"
        style={{
          backgroundColor: visual.statusBadgeBackground,
          borderColor: visual.statusBadgeBorder,
        }}
      >
        {visual.statusLabel}
      </span>

      {categoryLabel ? (
        <div
          className="mb-1 inline-flex max-w-[80%] rounded border px-1.5 py-0.5 text-[10px] text-white"
          style={{
            backgroundColor: visual.categoryBadgeBackground,
            borderColor: visual.categoryBadgeBorder,
          }}
        >
          <span className="truncate">#{categoryLabel}</span>
        </div>
      ) : null}
      <div className="truncate pr-11 font-medium">{timeBox.content}</div>
      {timeBox.status === 'COMPLETED' && actualDiff ? (
        <div className={`mt-1 truncate text-[11px] ${actualDiff.className}`}>{actualDiff.text}</div>
      ) : null}
      {timeBox.status === 'PLANNED' ? (
        <div className="mt-1 truncate text-[11px] text-white/85">계획 {plannedMinutes}분</div>
      ) : null}
      {timeBox.status === 'SKIPPED' && timeBox.skipReason ? (
        <div className="mt-1 truncate text-[11px] text-amber-100">사유: {timeBox.skipReason}</div>
      ) : null}

      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-black/20"
        onPointerDown={(event) => {
          event.stopPropagation()
        }}
        onMouseDown={handleResizeMouseDown}
      />
    </button>
  )
}

export default TimeBoxCard
