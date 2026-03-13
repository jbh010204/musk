import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useRef, useState } from 'react'
import {
  getCategoryColor,
  getCategoryLabel,
  getTimeBoxVisual,
  slotDurationMinutes,
  TOTAL_SLOTS,
} from '../../../entities/planner'
import type { CategoryRecord, CategoryViewModel, TimeBox } from '../../../entities/planner/model/types'
import { createTimeBoxDragPayload } from '../../planner-dnd/lib/payloads'
import { resolveTimeBoxLayout } from './timeBoxLayout'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

type CategoryMeta = CategoryRecord | CategoryViewModel | null | undefined

interface TimeBoxCardProps {
  timeBox: TimeBox
  categoryMeta?: CategoryMeta
  onTimeBoxClick: (timeBox: TimeBox) => void
  slotHeight?: number
  previewEndSlot?: number
  onResizePreview?: (id: string, endSlot: number) => void
  onResizeEnd?: (id: string, endSlot: number) => void
  nowTimestamp?: number
  onTimerStart?: (id: string) => void
  onTimerPause?: (id: string) => void
  onTimerComplete?: (id: string) => void
  testId?: string
}

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
  testId = 'timebox-card',
}: TimeBoxCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `time-box-${timeBox.id}`,
    data: createTimeBoxDragPayload(timeBox),
  })

  const currentEndSlot = previewEndSlot ?? timeBox.endSlot
  const plannedMinutes = slotDurationMinutes(timeBox.startSlot, currentEndSlot)
  const boxHeight = (currentEndSlot - timeBox.startSlot) * slotHeight
  const snappedDragY = transform ? Math.round(transform.y / slotHeight) * slotHeight : 0
  const categoryLabel = getCategoryLabel(categoryMeta, timeBox)
  const categoryColor = getCategoryColor(categoryMeta, timeBox)
  const visual = getTimeBoxVisual(categoryColor, timeBox.status)
  const canUseTimer = timeBox.status !== 'COMPLETED' && timeBox.status !== 'SKIPPED'
  const layout = useMemo(
    () => resolveTimeBoxLayout({ boxHeight, canUseTimer }),
    [boxHeight, canUseTimer],
  )
  const [isResizing, setIsResizing] = useState(false)
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
      text:
        diff === 0
          ? `실제 ${timeBox.actualMinutes}분 · 차이 0분`
          : `실제 ${timeBox.actualMinutes}분 · 차이 ${sign}${diff}분`,
      prefixText: `실제 ${timeBox.actualMinutes}분`,
      diffText: diff === 0 ? '차이 0분' : `차이 ${sign}${diff}분`,
      className: diff > 0 ? 'text-orange-200' : diff < 0 ? 'text-green-200' : 'text-gray-200',
    }
  }, [timeBox])

  const primaryTimeLine = useMemo(() => {
    if (timeBox.status === 'COMPLETED' && actualDiff) {
      return {
        text:
          layout.timeVariant === 'short'
            ? `${timeBox.actualMinutes}분`
            : actualDiff.text,
        prefixText: layout.timeVariant === 'short' ? null : actualDiff.prefixText,
        diffText: layout.timeVariant === 'short' ? null : actualDiff.diffText,
        className: actualDiff.className,
      }
    }

    if (timeBox.status === 'SKIPPED') {
      return {
        text: layout.timeVariant === 'short' ? `${plannedMinutes}분` : `계획 ${plannedMinutes}분`,
        className: 'text-white/80',
      }
    }

    if (timeBox.status === 'PLANNED') {
      return {
        text: layout.timeVariant === 'short' ? `${plannedMinutes}분` : `계획 ${plannedMinutes}분`,
        className: 'text-white/85',
      }
    }

    return null
  }, [actualDiff, layout.timeVariant, plannedMinutes, timeBox.actualMinutes, timeBox.status])

  const runtimeLine: { text: string; className: string } | null =
    canUseTimer && elapsedSeconds > 0 && layout.showInlineRuntimeLabel
      ? {
          text: `실행 ${timerLabel}`,
          className: 'text-cyan-100',
        }
      : null

  const detailMetaLine = useMemo(() => {
    if (timeBox.status === 'SKIPPED' && timeBox.skipReason) {
      return {
        text: `사유: ${timeBox.skipReason}`,
        className: 'text-amber-100',
      }
    }

    return null
  }, [timeBox.skipReason, timeBox.status])

  const metaLines = layout.showMeta
    ? [runtimeLine, detailMetaLine].filter(
        (line): line is { text: string; className: string } => Boolean(line),
      )
    : []

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

  const handleResizeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsResizing(true)

    resizingRef.current = {
      startY: event.clientY,
      startEnd: timeBox.endSlot,
      currentEnd: timeBox.endSlot,
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
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
      setIsResizing(false)
      onResizeEnd?.(timeBox.id, resizingRef.current.currentEnd)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleTimerAction = (
    event: React.MouseEvent<HTMLButtonElement>,
    handler: ((id: string) => void) | undefined,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    handler?.(timeBox.id)
  }

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      data-timebox-dragging={isDragging ? 'true' : 'false'}
      data-timebox-title={timeBox.content}
      data-testid={testId}
      className={`timebox-card group/timebox absolute left-0 right-0 text-left text-xs text-white pointer-events-auto transition-[transform,top,height,opacity] duration-100 ease-out will-change-transform ${
        isDragging ? 'z-40 opacity-80 ring-2 ring-cyan-300/70' : ''
      }`}
      style={{
        top: timeBox.startSlot * slotHeight,
        height: boxHeight,
        transform: transform
          ? CSS.Translate.toString({
              ...transform,
              x: 0,
              y: snappedDragY,
            })
          : undefined,
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
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }

        event.preventDefault()
        onTimeBoxClick(timeBox)
      }}
      title={timeBox.content}
      {...listeners}
      {...attributes}
    >
      <div
        className="absolute inset-x-0 overflow-hidden rounded shadow"
        style={{
          top: layout.surfaceInsetY,
          bottom: layout.surfaceInsetY,
          background: visual.cardBackground,
          borderLeft: `8px solid ${visual.categoryStripe}`,
        }}
      >
        <div
          data-testid="timebox-top-actions"
          className={`absolute right-2 z-20 flex items-center gap-1 ${layout.topActionsClass}`}
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

        {layout.contentLayout === 'inline' ? (
          <div
            data-testid="timebox-content"
            className={`${layout.contentContainerClass} ${layout.contentInsetClass}`}
          >
            {layout.showTag
              ? timeBox.status === 'SKIPPED' && timeBox.skipReason
                ? (
                    <span
                      data-testid="timebox-tag"
                      className={`${layout.tagClass} border-amber-300/40 bg-amber-500/15 text-amber-100`}
                    >
                      사유: {timeBox.skipReason}
                    </span>
                  )
                : categoryLabel
                  ? (
                      <span
                        data-testid="timebox-tag"
                        className={layout.tagClass}
                        style={{
                          backgroundColor: visual.categoryBadgeBackground,
                          borderColor: visual.categoryBadgeBorder,
                        }}
                      >
                        #{categoryLabel}
                      </span>
                    )
                  : null
              : null}
            <span
              data-testid="timebox-title"
              className={`${layout.titleClass} ${layout.titleClampClass}`}
            >
              {timeBox.content}
            </span>
            {layout.showTime && primaryTimeLine ? (
              <span data-testid="timebox-time" className={layout.timeClass}>
                {primaryTimeLine.text}
              </span>
            ) : null}
          </div>
        ) : null}

        {layout.contentLayout === 'stack-centered' ? (
          <div
            data-testid="timebox-content"
            className={`${layout.contentContainerClass} ${layout.contentInsetClass}`}
          >
            {layout.showTag && categoryLabel ? (
              <div
                data-testid="timebox-tag"
                className={layout.tagClass}
                style={{
                  backgroundColor: visual.categoryBadgeBackground,
                  borderColor: visual.categoryBadgeBorder,
                }}
              >
                <span className="truncate">#{categoryLabel}</span>
              </div>
            ) : null}
            <div
              data-testid="timebox-title"
              className={`${layout.titleClass} ${layout.titleClampClass}`}
            >
              {timeBox.content}
            </div>
            {layout.showTime && primaryTimeLine ? (
              <div
                data-testid="timebox-time"
                className={layout.timeClass}
              >
                {primaryTimeLine.prefixText && primaryTimeLine.diffText ? (
                  <>
                    <span className="text-white/90">{primaryTimeLine.prefixText}</span>
                    <span className="text-white/60"> · </span>
                    <span className={primaryTimeLine.className}>{primaryTimeLine.diffText}</span>
                  </>
                ) : (
                  <span className={primaryTimeLine.className}>{primaryTimeLine.text}</span>
                )}
              </div>
            ) : null}
            {metaLines.map((line, index) => (
              <div
                key={`${line.text}-${index}`}
                data-testid="timebox-meta"
                className={`${layout.metaClass} ${layout.metaClampClass} ${line.className}`}
              >
                {line.text}
              </div>
            ))}
          </div>
        ) : null}

        <div
          data-testid="timebox-resize-handle"
          className={`absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize bg-black/25 transition-opacity duration-150 ${
            isResizing
              ? 'opacity-100'
              : 'opacity-0 group-hover/timebox:opacity-100 group-focus-within/timebox:opacity-100'
          }`}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onMouseDown={handleResizeMouseDown}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      </div>
    </div>
  )
}

export default TimeBoxCard
