import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useRef } from 'react'
import { getCategoryColor, getCategoryLabel, getTimeBoxVisual } from '../../../utils/categoryVisual'
import { TOTAL_SLOTS, slotDurationMinutes } from '../../../utils/timeSlot'
import { resolveTimeBoxLayout } from './timeBoxLayout'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function TimeBoxCard({
  timeBox,
  categoryMeta,
  onTimeBoxClick,
  slotHeight = 32,
  previewEndSlot,
  onResizePreview,
  onResizeEnd,
  nowTimestamp = 0,
  onTimerStart,
  onTimerPause,
  onTimerComplete,
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
  const boxHeight = (currentEndSlot - timeBox.startSlot) * slotHeight
  const snappedDragY = transform ? Math.round(transform.y / slotHeight) * slotHeight : 0
  const categoryLabel = getCategoryLabel(categoryMeta, timeBox)
  const categoryColor = getCategoryColor(categoryMeta, timeBox)
  const visual = getTimeBoxVisual(categoryColor, timeBox.status)
  const canUseTimer = timeBox.status !== 'COMPLETED' && timeBox.status !== 'SKIPPED'
  const layout = resolveTimeBoxLayout({ boxHeight, canUseTimer })
  const isRunning = Number.isFinite(timeBox.timerStartedAt)
  const runningSeconds =
    isRunning && nowTimestamp > 0
      ? Math.max(0, Math.floor((nowTimestamp - Number(timeBox.timerStartedAt)) / 1000))
      : 0
  const elapsedSeconds =
    (Number(timeBox.elapsedSeconds) || 0) + runningSeconds
  const timerMinutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const timerSeconds = String(elapsedSeconds % 60).padStart(2, '0')
  const timerLabel = `${timerMinutes}:${timerSeconds}`

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

  const handleTimerAction = (event, handler) => {
    event.preventDefault()
    event.stopPropagation()
    handler?.(timeBox.id)
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-timebox-dragging={isDragging ? 'true' : 'false'}
      className={`timebox-card absolute left-0 right-0 overflow-hidden rounded px-2 py-1 text-left text-xs text-white shadow pointer-events-auto transition-[transform,top,height,opacity] duration-100 ease-out will-change-transform ${
        isDragging ? 'z-40 opacity-80 ring-2 ring-cyan-300/70' : ''
      }`}
      style={{
        top: timeBox.startSlot * slotHeight,
        height: boxHeight,
        transform: transform ? CSS.Translate.toString({ x: 0, y: snappedDragY }) : undefined,
        background: visual.cardBackground,
        borderLeft: `8px solid ${visual.categoryStripe}`,
      }}
      onMouseDown={(event) => {
        pointerRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
        }
      }}
      onMouseMove={(event) => {
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
      <div
        data-testid="timebox-top-actions"
        className={`absolute right-2 z-20 flex items-center gap-1 ${layout.topActionsTopClass}`}
      >
        <span
          className={`rounded border px-1.5 py-0.5 font-semibold ${layout.statusTextClass}`}
          style={{
            backgroundColor: visual.statusBadgeBackground,
            borderColor: visual.statusBadgeBorder,
          }}
          aria-label={visual.statusLabel}
        >
          {visual.statusLabel}
        </span>

        {canUseTimer ? (
          <>
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) =>
                handleTimerAction(event, isRunning ? onTimerPause : onTimerStart)
              }
              className={`rounded border border-white/35 bg-black/20 px-1 py-0.5 text-[10px] leading-none text-white transition-all hover:scale-110 hover:bg-black/35 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                isRunning ? 'ring-1 ring-cyan-200/80' : ''
              }`}
              aria-label={isRunning ? '타이머 일시정지' : '타이머 시작'}
            >
              {isRunning ? '⏸' : '▶'}
            </button>
            {elapsedSeconds > 0 ? (
              <>
                {layout.showTopTimerLabel ? (
                  <span className="rounded bg-black/20 px-1 py-0.5 text-[10px] text-white/90">
                    {timerLabel}
                  </span>
                ) : null}
                <button
                  type="button"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => handleTimerAction(event, onTimerComplete)}
                  className="rounded border border-emerald-300/50 bg-emerald-500/20 px-1 py-0.5 text-[10px] leading-none text-emerald-100 transition-all hover:scale-110 hover:bg-emerald-500/35 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  aria-label="타이머 완료 처리"
                >
                  ✓
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {layout.showCompactRow ? (
        <div
          data-testid="timebox-compact-row"
          className={`${layout.compactRowMarginTopClass} flex items-center gap-1.5 ${layout.contentPaddingRightClass}`}
        >
          {timeBox.status === 'SKIPPED' && timeBox.skipReason ? (
            <span className="max-w-[50%] shrink-0 truncate rounded border border-amber-300/40 bg-amber-500/15 px-1 py-0.5 text-[10px] text-amber-100">
              사유: {timeBox.skipReason}
            </span>
          ) : categoryLabel ? (
            <span
              data-testid="timebox-compact-tag"
              className="max-w-[42%] shrink-0 truncate rounded border px-1 py-0.5 text-[10px] text-white/95"
              style={{
                backgroundColor: visual.categoryBadgeBackground,
                borderColor: visual.categoryBadgeBorder,
              }}
            >
              #{categoryLabel}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 truncate font-medium">{timeBox.content}</span>
        </div>
      ) : null}

      {!layout.showCompactRow ? (
        <div className={`${layout.detailPaddingTopClass} ${layout.contentPaddingRightClass}`}>
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
          {canUseTimer && elapsedSeconds > 0 && layout.showInlineRuntimeLabel ? (
            <div className="mt-1 truncate text-[11px] text-cyan-100">실행 {timerLabel}</div>
          ) : null}
          {timeBox.status === 'COMPLETED' && actualDiff ? (
            <div className={`mt-1 truncate text-[11px] ${actualDiff.className}`}>{actualDiff.text}</div>
          ) : null}
          {timeBox.status === 'PLANNED' ? (
            <div className="mt-1 truncate text-[11px] text-white/85">계획 {plannedMinutes}분</div>
          ) : null}
          {timeBox.status === 'SKIPPED' && timeBox.skipReason ? (
            <div className="mt-1 truncate text-[11px] text-amber-100">사유: {timeBox.skipReason}</div>
          ) : null}
        </div>
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
