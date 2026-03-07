import { useEffect, useRef } from 'react'
import { Badge, Button, Card } from '../../../shared/ui'

const DRAG_THRESHOLD_PX = 6

const formatKoreanDate = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`)
  const [year, month, day] = dateStr.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

function Header({
  currentDate,
  goNextDay,
  goPrevDay,
  weekStrip = [],
  goToDate = () => {},
  bigThreeProgress = {
    statuses: ['EMPTY', 'EMPTY', 'EMPTY'],
    completedCount: 0,
    filledCount: 0,
    isPerfect: false,
  },
  theme = 'dark',
  onOpenReschedule = () => {},
  onToggleTheme = () => {},
}) {
  const stripRef = useRef(null)
  const currentDayRef = useRef(null)
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  })
  const suppressClickRef = useRef(false)

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

  const finishDrag = (pointerId = null) => {
    const strip = stripRef.current
    const dragState = dragStateRef.current

    if (strip && dragState.active && dragState.pointerId != null) {
      try {
        strip.releasePointerCapture(dragState.pointerId)
      } catch {
        // no-op
      }
    }

    if (dragState.moved) {
      suppressClickRef.current = true
    }

    dragStateRef.current = {
      active: false,
      pointerId,
      startX: 0,
      startScrollLeft: 0,
      moved: false,
    }
  }

  const handleStripPointerDown = (event) => {
    if (event.pointerType !== 'mouse' || !stripRef.current) {
      return
    }

    if (suppressClickRef.current) {
      suppressClickRef.current = false
    }

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: stripRef.current.scrollLeft,
      moved: false,
    }
    stripRef.current.setPointerCapture(event.pointerId)
  }

  const handleStripPointerMove = (event) => {
    const strip = stripRef.current
    const dragState = dragStateRef.current

    if (!strip || !dragState.active || dragState.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    if (!dragState.moved && Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      dragState.moved = true
    }

    if (!dragState.moved) {
      return
    }

    strip.scrollLeft = dragState.startScrollLeft - deltaX
    event.preventDefault()
  }

  const handleStripPointerUp = (event) => {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return
    }

    finishDrag(event.pointerId)
  }

  const handleStripPointerCancel = (event) => {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return
    }

    finishDrag(event.pointerId)
  }

  const handleDayClick = (dateStr) => (event) => {
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
          <Button
            onClick={onOpenReschedule}
            className="px-3 py-1.5 text-xs"
            aria-label="자동 재배치"
          >
            재배치
          </Button>
          <Button
            onClick={onToggleTheme}
            className="px-3 py-1.5 text-xs"
            aria-label="테마 전환"
            aria-pressed={theme === 'light'}
          >
            {theme === 'dark' ? '라이트' : '다크'}
          </Button>
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
          className="flex cursor-grab gap-3 overflow-x-auto pb-2 select-none snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden active:cursor-grabbing"
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
                onPointerDown={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false
                  }
                }}
                onClick={handleDayClick(day.dateStr)}
                className={`relative w-[104px] shrink-0 snap-center overflow-hidden rounded-2xl px-3 py-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 md:w-[112px] ${
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
