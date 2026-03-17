import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Badge, Button, Card } from '../../../shared/ui'
import type { RunMode } from '../../../entities/planner/model/types'

const DRAG_THRESHOLD_PX = 6
const MOMENTUM_FRICTION = 0.94
const MIN_MOMENTUM_VELOCITY = 0.08
const MAX_MOMENTUM_VELOCITY = 22

type BigThreeStatus = 'DONE' | 'PENDING' | 'EMPTY'
type PersistenceBadgeTone = 'neutral' | 'danger' | 'success'

interface WeekStripDay {
  dateStr: string
  isCurrent: boolean
  total: number
  completed: number
  dayLabel: string
  dayNumber: string | number
}

interface BigThreeProgress {
  statuses: BigThreeStatus[]
  completedCount: number
  filledCount: number
  isPerfect: boolean
}

interface PlannerPersistenceStatusLike {
  serverEnabled?: boolean
  serverAvailability?: 'unknown' | 'disabled' | 'online' | 'offline'
  autoSyncLastStatus?: 'idle' | 'pending' | 'syncing' | 'synced' | 'error'
  autoSyncDirty?: boolean
}

interface DragState {
  active: boolean
  pointerId: number | null
  captured: boolean
  startX: number
  startScrollLeft: number
  moved: boolean
  pendingScrollLeft: number
  targetScrollLeft: number
  lastMoveTs: number
  lastMomentumTs: number
  velocity: number
  frameId: number | null
  momentumFrameId: number | null
}

interface HeaderProps {
  currentDate: string
  goNextDay: () => void
  goPrevDay: () => void
  weekStrip?: WeekStripDay[]
  goToDate?: (dateStr: string) => void
  bigThreeProgress?: BigThreeProgress
  theme?: 'dark' | 'light'
  persistenceStatus?: PlannerPersistenceStatusLike | null
  onOpenReschedule?: () => void
  onToggleTheme?: () => void
  runMode?: RunMode
  activeRunLabel?: string | null
}

const DEFAULT_BIG_THREE_PROGRESS: BigThreeProgress = {
  statuses: ['EMPTY', 'EMPTY', 'EMPTY'],
  completedCount: 0,
  filledCount: 0,
  isPerfect: false,
}

const formatKoreanDate = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`)
  const [year, month, day] = dateStr.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

const getPersistenceBadge = (status: PlannerPersistenceStatusLike | null | undefined): { tone: PersistenceBadgeTone; label: string } => {
  if (!status?.serverEnabled) {
    return {
      tone: 'neutral',
      label: '로컬 저장',
    }
  }

  if (status.serverAvailability === 'offline') {
    return {
      tone: 'danger',
      label: '오프라인',
    }
  }

  if (status.autoSyncLastStatus === 'syncing') {
    return {
      tone: 'neutral',
      label: '동기화 중',
    }
  }

  if (status.autoSyncDirty) {
    return {
      tone: 'neutral',
      label: '저장 대기',
    }
  }

  return {
    tone: 'success',
    label: '저장됨',
  }
}

function Header({
  currentDate,
  goNextDay,
  goPrevDay,
  weekStrip = [],
  goToDate = () => {},
  bigThreeProgress = DEFAULT_BIG_THREE_PROGRESS,
  theme = 'dark',
  persistenceStatus = null,
  onOpenReschedule = () => {},
  onToggleTheme = () => {},
  runMode = 'IDLE',
  activeRunLabel = null,
}: HeaderProps) {
  const stripRef = useRef<HTMLDivElement | null>(null)
  const currentDayRef = useRef<HTMLButtonElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef<DragState>({
    active: false,
    pointerId: null,
    captured: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    pendingScrollLeft: 0,
    targetScrollLeft: 0,
    lastMoveTs: 0,
    lastMomentumTs: 0,
    velocity: 0,
    frameId: null,
    momentumFrameId: null,
  })
  const suppressClickRef = useRef(false)
  const persistenceBadge = getPersistenceBadge(persistenceStatus)

  useEffect(() => {
    const dragState = dragStateRef.current

    return () => {
      if (dragState.frameId) {
        window.cancelAnimationFrame(dragState.frameId)
      }
      if (dragState.momentumFrameId) {
        window.cancelAnimationFrame(dragState.momentumFrameId)
      }
    }
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    const current = currentDayRef.current

    if (!strip || !current) {
      return
    }

    current.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'auto',
    })
  }, [currentDate, weekStrip.length])

  const cancelMomentum = () => {
    const dragState = dragStateRef.current
    if (dragState.momentumFrameId) {
      window.cancelAnimationFrame(dragState.momentumFrameId)
      dragState.momentumFrameId = null
    }
    dragState.lastMomentumTs = 0
  }

  const stopDragFrame = () => {
    const dragState = dragStateRef.current
    if (dragState.frameId) {
      window.cancelAnimationFrame(dragState.frameId)
      dragState.frameId = null
    }
  }

  const scheduleScrollWrite = () => {
    const strip = stripRef.current
    const dragState = dragStateRef.current

    if (!strip || dragState.frameId) {
      return
    }

    dragState.frameId = window.requestAnimationFrame(() => {
      dragState.frameId = null
      strip.scrollLeft = dragState.pendingScrollLeft
    })
  }

  const startMomentum = () => {
    const strip = stripRef.current
    const dragState = dragStateRef.current

    if (!strip || Math.abs(dragState.velocity) < MIN_MOMENTUM_VELOCITY) {
      return
    }

    cancelMomentum()

    const step = (timestamp: number) => {
      dragState.momentumFrameId = null
      const elapsed = dragState.lastMomentumTs > 0 ? Math.max(1, timestamp - dragState.lastMomentumTs) : 16
      const frameScale = elapsed / 16
      const before = strip.scrollLeft

      strip.scrollLeft += dragState.velocity * frameScale
      const applied = strip.scrollLeft - before
      dragState.lastMomentumTs = timestamp

      if (Math.abs(applied) < 0.25) {
        dragState.velocity = 0
        dragState.lastMomentumTs = 0
        return
      }

      dragState.velocity *= Math.pow(MOMENTUM_FRICTION, frameScale)
      if (Math.abs(dragState.velocity) < MIN_MOMENTUM_VELOCITY) {
        dragState.velocity = 0
        dragState.lastMomentumTs = 0
        return
      }

      dragState.momentumFrameId = window.requestAnimationFrame(step)
    }

    dragState.momentumFrameId = window.requestAnimationFrame(step)
  }

  const finishDrag = () => {
    const strip = stripRef.current
    const dragState = dragStateRef.current

    if (strip && dragState.active && dragState.captured && dragState.pointerId != null) {
      try {
        strip.releasePointerCapture(dragState.pointerId)
      } catch {
        // no-op
      }
    }

    if (dragState.moved) {
      suppressClickRef.current = true
      if (strip) {
        strip.scrollLeft = dragState.pendingScrollLeft
      }
      startMomentum()
    }

    stopDragFrame()
    setIsDragging(false)

    Object.assign(dragStateRef.current, {
      active: false,
      pointerId: null,
      captured: false,
      startX: 0,
      startScrollLeft: 0,
      moved: false,
      pendingScrollLeft: strip?.scrollLeft ?? 0,
      targetScrollLeft: strip?.scrollLeft ?? 0,
      lastMoveTs: 0,
      lastMomentumTs: dragState.lastMomentumTs,
      velocity: dragState.velocity,
      frameId: null,
      momentumFrameId: dragState.momentumFrameId,
    } satisfies DragState)
  }

  const handleStripPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !stripRef.current) {
      return
    }

    cancelMomentum()
    stopDragFrame()

    if (suppressClickRef.current) {
      suppressClickRef.current = false
    }

    Object.assign(dragStateRef.current, {
      active: true,
      pointerId: event.pointerId,
      captured: false,
      startX: event.clientX,
      startScrollLeft: stripRef.current.scrollLeft,
      moved: false,
      pendingScrollLeft: stripRef.current.scrollLeft,
      targetScrollLeft: stripRef.current.scrollLeft,
      lastMoveTs: performance.now(),
      lastMomentumTs: 0,
      velocity: 0,
      frameId: null,
      momentumFrameId: null,
    } satisfies DragState)
  }

  const handleStripPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const strip = stripRef.current
    const dragState = dragStateRef.current

    if (!strip || !dragState.active || dragState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    if (!dragState.moved && Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      dragState.moved = true
      setIsDragging(true)
      if (!dragState.captured) {
        try {
          strip.setPointerCapture(event.pointerId)
          dragState.captured = true
        } catch {
          dragState.captured = false
        }
      }
    }

    if (!dragState.moved) {
      return
    }

    const nextTarget = dragState.startScrollLeft - deltaX
    const now = performance.now()
    const elapsed = Math.max(1, now - dragState.lastMoveTs)
    const deltaTarget = nextTarget - dragState.pendingScrollLeft

    dragState.velocity = Math.max(
      -MAX_MOMENTUM_VELOCITY,
      Math.min(MAX_MOMENTUM_VELOCITY, (deltaTarget / elapsed) * 16),
    )
    dragState.pendingScrollLeft = nextTarget
    dragState.targetScrollLeft = nextTarget
    dragState.lastMoveTs = now
    scheduleScrollWrite()
    event.preventDefault()
  }

  const handleStripPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return
    }

    finishDrag()
  }

  const handleStripPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return
    }

    finishDrag()
  }

  const handleDayClick =
    (dateStr: string) =>
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (suppressClickRef.current) {
        event.preventDefault()
        event.stopPropagation()
        suppressClickRef.current = false
        return
      }

      goToDate(dateStr)
    }

  return (
    <header className="sticky top-0 z-30 bg-slate-50/95 px-6 py-4 text-slate-900 backdrop-blur dark:bg-gray-900/85 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <Button onClick={goPrevDay} className="px-3 py-1 text-lg" aria-label="이전 날짜">
          ←
        </Button>

        <h1 className="text-lg font-semibold">{formatKoreanDate(currentDate)}</h1>

        <div className="flex items-center gap-2">
          <Badge
            tone={persistenceBadge.tone}
            className="px-2.5 py-1 text-[11px] font-medium tracking-wide"
          >
            {persistenceBadge.label}
          </Badge>
          {runMode !== 'IDLE' ? (
            <div
              data-testid="planner-run-badge"
              className="inline-flex max-w-[18rem] items-center gap-2 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100"
            >
              <span className="font-semibold tracking-[0.16em] text-indigo-600 dark:text-cyan-300">
                {runMode === 'RUNNING' ? 'RUNNING' : 'PAUSED'}
              </span>
              {activeRunLabel ? (
                <span className="truncate text-slate-500 dark:text-slate-300">{activeRunLabel}</span>
              ) : null}
            </div>
          ) : null}
          <div className="ui-panel-subtle inline-flex items-center gap-1 p-1">
            <Button
              variant="ghost"
              onClick={onOpenReschedule}
              className="px-2.5 py-1.5 text-[11px] font-medium"
              aria-label="자동 재배치"
            >
              재배치
            </Button>
            <Button
              variant="ghost"
              onClick={onToggleTheme}
              className={`px-2.5 py-1.5 text-[11px] font-medium ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : ''
              }`}
              aria-label="테마 전환"
              aria-pressed={theme === 'light'}
            >
              {theme === 'dark' ? '라이트' : '다크'}
            </Button>
          </div>
          <Button onClick={goNextDay} className="px-3 py-1 text-lg" aria-label="다음 날짜">
            →
          </Button>
        </div>
      </div>

      <Card className="mt-4 flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">BIG3 완료</p>
          <p className="text-2xl font-bold text-gray-100">
            {bigThreeProgress.completedCount}/3
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              입력 {bigThreeProgress.filledCount}/3
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-label={`빅3 완료 ${bigThreeProgress.completedCount} / 3`}>
            {bigThreeProgress.statuses.map((status, index) => (
              <span
                key={index}
                className={`h-2.5 w-2.5 rounded-full ${
                  status === 'DONE'
                    ? 'bg-green-500'
                    : status === 'PENDING'
                      ? 'bg-indigo-400'
                      : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          {bigThreeProgress.isPerfect ? <Badge tone="success">오늘 성공</Badge> : null}
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          주간 스트립
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          좌우로 드래그해 이전/다음 주를 훑고 날짜를 클릭하세요.
        </p>
      </div>

      <div className="relative mt-3">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-50/95 to-transparent dark:from-gray-900/85"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-50/95 to-transparent dark:from-gray-900/85"
        />

        <div
          ref={stripRef}
          data-testid="week-strip-scroll"
          className={`flex cursor-grab gap-3 overflow-x-auto px-1 pt-2 pb-3 select-none [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden active:cursor-grabbing ${
            isDragging ? 'snap-none' : 'snap-x snap-proximity'
          }`}
          onPointerDown={handleStripPointerDown}
          onPointerMove={handleStripPointerMove}
          onPointerUp={handleStripPointerUp}
          onPointerCancel={handleStripPointerCancel}
        >
          {weekStrip.map((day) => {
            const ratio = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0

            return (
              <button
                key={day.dateStr}
                ref={day.isCurrent ? currentDayRef : null}
                type="button"
                data-testid={`week-strip-day-${day.dateStr}`}
                onClick={handleDayClick(day.dateStr)}
                className={`relative w-[112px] shrink-0 snap-center overflow-hidden rounded-2xl px-3 py-3 text-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:w-[128px] ${
                  day.isCurrent
                    ? 'bg-gradient-to-br from-indigo-600/35 via-indigo-600/25 to-cyan-500/20 text-gray-100 ring-1 ring-indigo-300/75 shadow-[0_8px_20px_rgba(79,70,229,0.18)]'
                    : 'bg-white/45 text-slate-600 hover:bg-white/80 dark:bg-slate-800/15 dark:text-slate-400 dark:hover:bg-slate-800/35'
                }`}
                aria-label={`${day.dateStr} 이동`}
                aria-current={day.isCurrent ? 'date' : undefined}
              >
                {day.isCurrent ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-1 top-0 h-px bg-gradient-to-r from-transparent via-indigo-100/95 to-transparent"
                  />
                ) : null}
                <div className="relative z-10">
                  <div
                    className={`text-[10px] ${
                      day.isCurrent ? 'text-indigo-100/90' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.dayLabel}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      day.isCurrent ? 'text-gray-100' : 'text-slate-700 dark:text-gray-100'
                    }`}
                  >
                    {day.dayNumber}
                  </div>
                  <div
                    className={`mt-1.5 h-1 w-full rounded ${
                      day.isCurrent ? 'bg-indigo-300/35' : 'bg-gray-700/70'
                    }`}
                  >
                    <div className="h-1 rounded bg-green-500" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}

export default Header
