import { useEffect, useMemo, useRef, useState } from 'react'
import { getCategoryColor, getCategoryLabel, hasOverlap, slotToTime, TOTAL_SLOTS } from '../../../entities/planner'
import CompletionModal from './CompletionModal'
import DailyRecapCard from './DailyRecapCard'
import MonthDayDetailSheet from './MonthDayDetailSheet'
import MonthlyCalendarView from './MonthlyCalendarView'
import TimeBoxCard from './TimeBoxCard'
import TimeSlotGrid from './TimeSlotGrid'
import WeeklyCalendarView from './WeeklyCalendarView'
import WeeklyPlanningBoard from './WeeklyPlanningBoard'
import WeeklyReportCard from './WeeklyReportCard'

const DEFAULT_SLOT_HEIGHT = 32
const DEFAULT_BOX_SLOTS = 1
const DURATION_PRESETS = [1, 2, 3, 4]
const VIEW_MODE_OPTIONS = [
  { value: 'DAY', label: '일간' },
  { value: 'WEEK', label: '주간' },
  { value: 'MONTH', label: '월간' },
]
const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'PLANNED', label: '예정' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'SKIPPED', label: '스킵' },
]

function TimelineInsightsSkeleton() {
  return (
    <div
      className="mb-6 space-y-6 transition-opacity duration-300"
      data-testid="timeline-insights-skeleton"
    >
      <div className="ui-panel animate-pulse p-6">
        <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>

      <div className="ui-panel animate-pulse p-6">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 space-y-3">
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-3/5 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      <div className="ui-panel animate-pulse p-6">
        <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-3 rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    </div>
  )
}

function Timeline({
  data,
  currentDate,
  categories,
  templates = [],
  weeklyReport,
  weeklyPlanningPreview = [],
  weekCalendar = { rangeLabel: '', days: [] },
  monthCalendar = { monthLabel: '', cells: [] },
  isInsightsLoading = false,
  onJumpToDate = () => {},
  initialFocusSlot = null,
  suggestionMessage = null,
  suggestionAction = null,
  onApplySuggestionAction = () => {},
  onDismissSuggestion = () => {},
  dropPreviewSlot = null,
  movingTimeBoxPreview = null,
  slotHeight = DEFAULT_SLOT_HEIGHT,
  timelineScale = '30',
  onTimelineScaleChange = () => {},
  addTimeBox,
  updateTimeBox,
  onTimerStart = () => {},
  onTimerPause = () => {},
  onTimerComplete = () => {},
  removeTimeBox,
  showToast,
  showDropGuide = false,
  focusMode = false,
  onToggleFocusMode = () => {},
  onDuplicateTimeBox = () => false,
  onOpenTemplateManager = () => {},
  onOpenQuickAdd = () => {},
  onApplyTemplate = () => {},
}) {
  const sectionRef = useRef(null)
  const [pendingInput, setPendingInput] = useState(null)
  const [selectedBoxId, setSelectedBoxId] = useState(null)
  const [resizePreview, setResizePreview] = useState({})
  const [isComposing, setIsComposing] = useState(false)
  const [timerNow, setTimerNow] = useState(0)
  const [viewMode, setViewMode] = useState('DAY')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [selectedMonthDate, setSelectedMonthDate] = useState(null)
  const isDayView = viewMode === 'DAY'

  const sortedBoxes = useMemo(
    () => [...data.timeBoxes].sort((a, b) => a.startSlot - b.startSlot),
    [data.timeBoxes],
  )
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const selectedBox = useMemo(
    () => data.timeBoxes.find((box) => box.id === selectedBoxId) || null,
    [data.timeBoxes, selectedBoxId],
  )
  const selectedMonthCell = useMemo(
    () =>
      selectedMonthDate
        ? monthCalendar.cells.find((cell) => cell.dateStr === selectedMonthDate) || null
        : null,
    [monthCalendar.cells, selectedMonthDate],
  )
  const hasRunningTimer = useMemo(
    () => data.timeBoxes.some((box) => Number.isFinite(box.timerStartedAt)),
    [data.timeBoxes],
  )

  useEffect(() => {
    if (!Number.isInteger(initialFocusSlot) || !sectionRef.current) {
      return
    }

    const slotButton = sectionRef.current.querySelector(
      `[data-timeline-slot-index="${initialFocusSlot}"]`,
    )
    slotButton?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [initialFocusSlot])

  useEffect(() => {
    if (!hasRunningTimer) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setTimerNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasRunningTimer])

  const categoryLegend = useMemo(() => {
    const legendMap = new Map()

    sortedBoxes.forEach((box) => {
      const meta = box.categoryId ? categoryMap.get(box.categoryId) : null
      const label = getCategoryLabel(meta, box)

      if (!label) {
        return
      }

      const key = meta?.id || `legacy:${label.toLowerCase()}`
      if (legendMap.has(key)) {
        return
      }

      legendMap.set(key, {
        key,
        label,
        color: getCategoryColor(meta, box),
      })
    })

    return [...legendMap.values()]
  }, [categoryMap, sortedBoxes])

  const categoryFilterOptions = useMemo(() => {
    const options = [
      { value: 'ALL', label: '전체 카테고리' },
      { value: 'UNCATEGORIZED', label: '미분류' },
    ]

    categoryLegend.forEach((item) => {
      options.push({ value: item.key, label: item.label })
    })

    return options
  }, [categoryLegend])

  const filteredBoxes = useMemo(
    () =>
      sortedBoxes.filter((box) => {
        if (statusFilter !== 'ALL' && box.status !== statusFilter) {
          return false
        }

        if (categoryFilter === 'ALL') {
          return true
        }

        const meta = box.categoryId ? categoryMap.get(box.categoryId) : null
        const label = getCategoryLabel(meta, box)
        const key = meta?.id || (label ? `legacy:${label.toLowerCase()}` : null)

        if (categoryFilter === 'UNCATEGORIZED') {
          return !key
        }

        return key === categoryFilter
      }),
    [categoryFilter, categoryMap, sortedBoxes, statusFilter],
  )

  const createBox = ({ content, sourceId = null, startSlot, durationSlots = DEFAULT_BOX_SLOTS }) => {
    const duration = Math.max(1, Math.min(TOTAL_SLOTS, Number(durationSlots) || DEFAULT_BOX_SLOTS))
    const newBox = {
      content,
      sourceId,
      startSlot,
      endSlot: Math.min(startSlot + duration, TOTAL_SLOTS),
    }

    if (hasOverlap(data.timeBoxes, newBox)) {
      showToast('해당 시간에 이미 일정이 있습니다')
      return false
    }

    addTimeBox(newBox)
    return true
  }

  const handleSlotClick = (slotIndex) => {
    setPendingInput({ slotIndex, content: '', durationSlots: DEFAULT_BOX_SLOTS })
  }

  const handlePendingSubmit = () => {
    if (!pendingInput) {
      return
    }

    const content = pendingInput.content.trim()
    if (!content) {
      setPendingInput(null)
      return
    }

    const created = createBox({
      content,
      startSlot: pendingInput.slotIndex,
      durationSlots: pendingInput.durationSlots,
    })

    if (created) {
      setPendingInput(null)
    }
  }

  const handleResizePreview = (id, endSlot) => {
    setResizePreview((prev) => ({
      ...prev,
      [id]: endSlot,
    }))
  }

  const handleResizeEnd = (id, endSlot) => {
    const original = data.timeBoxes.find((box) => box.id === id)
    if (!original) {
      return
    }

    const nextBox = {
      ...original,
      endSlot,
    }

    if (hasOverlap(data.timeBoxes, nextBox, id)) {
      showToast('해당 시간에 이미 일정이 있습니다')
      setResizePreview((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      return
    }

    updateTimeBox(id, { endSlot })

    setResizePreview((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  const handleOpenCalendarDate = (dateStr) => {
    onJumpToDate(dateStr)
    setViewMode('DAY')
  }

  const handleSelectMonthDate = (dateStr) => {
    setSelectedMonthDate(dateStr)
  }

  return (
    <section ref={sectionRef} className="h-full p-6 pb-24 md:pb-16">
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              ⏱ 타임라인
            </h2>
            <div className="ui-panel-subtle inline-flex items-center p-1 text-[11px]">
              {VIEW_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-testid={`timeline-view-${option.value.toLowerCase()}`}
                  aria-pressed={viewMode === option.value}
                  onClick={() => setViewMode(option.value)}
                  className={`rounded-lg px-2 py-1 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    viewMode === option.value
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {isDayView ? (
            <button
              type="button"
              onClick={() => onOpenQuickAdd(currentDate, { dateLabel: '오늘 빠른 일정 추가' })}
              className="ui-btn-secondary px-3 py-1.5 text-xs"
            >
              빠른 추가
            </button>
          ) : null}
        </div>

        {isDayView ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-800/35 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wide">보기 옵션</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="timeline-focus-toggle"
                onClick={onToggleFocusMode}
                className={`rounded-xl px-2.5 py-1.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  focusMode
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                }`}
              >
                집중 모드
              </button>

              <div className="ui-panel-subtle inline-flex items-center p-1 text-[11px]">
                <button
                  type="button"
                  data-testid="timeline-scale-30"
                  onClick={() => onTimelineScaleChange('30')}
                  className={`rounded-lg px-2 py-1 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    timelineScale === '30'
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  30분
                </button>
                <button
                  type="button"
                  data-testid="timeline-scale-15"
                  onClick={() => onTimelineScaleChange('15')}
                  className={`rounded-lg px-2 py-1 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    timelineScale === '15'
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  15분 보기
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {!isDayView ? (
        <div className="mb-6 rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/35 dark:text-slate-300">
          {viewMode === 'WEEK'
            ? `${weekCalendar.rangeLabel} 구간의 주간 계획을 한 번에 확인합니다.`
            : `${monthCalendar.monthLabel} 전체 일정을 캘린더 그리드로 확인합니다.`}
        </div>
      ) : null}

      {isDayView ? (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <label className="ui-panel-subtle flex flex-col items-start gap-1 p-3 text-xs text-slate-500 dark:text-slate-300">
            <span className="font-semibold uppercase tracking-wide">상태 필터</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="ui-select !p-2 text-xs"
              data-testid="timeline-status-filter"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="ui-panel-subtle flex flex-col items-start gap-1 p-3 text-xs text-slate-500 dark:text-slate-300">
            <span className="font-semibold uppercase tracking-wide">카테고리 필터</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="ui-select !p-2 text-xs"
              data-testid="timeline-category-filter"
            >
              {categoryFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {isDayView && showDropGuide ? (
        <div
          data-testid="timeline-drop-guide"
          className="ui-panel-subtle mb-6 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100"
        >
          브레인 덤프/빅3 항목을 원하는 시간 슬롯에 드롭하면 일정이 추가됩니다.
        </div>
      ) : null}

      {isDayView ? (
        <div className="mb-6 rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/35">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                퀵 템플릿
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                자주 쓰는 블록을 오늘 일정으로 바로 넣습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenTemplateManager}
              className="rounded-xl px-2.5 py-1.5 text-xs text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              관리
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-500 shadow-sm dark:bg-slate-900/55 dark:text-slate-400">
              아직 템플릿이 없습니다. 관리에서 자주 쓰는 블록을 먼저 저장하세요.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  data-testid={`timeline-template-${template.id}`}
                  onClick={() => onApplyTemplate(template.id, currentDate)}
                  className="rounded-2xl bg-white px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {template.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {template.content} · {template.durationSlots * 30}분
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {isDayView && suggestionMessage ? (
        <div
          data-testid="daily-suggestion-panel"
          className="ui-panel-subtle mb-6 flex items-start justify-between gap-3 bg-sky-500/10 px-4 py-3 text-sm text-sky-100"
        >
          <div className="space-y-2">
            <p>{suggestionMessage}</p>
            {suggestionAction ? (
              <button
                type="button"
                onClick={onApplySuggestionAction}
                className="rounded-xl bg-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-100 transition-colors hover:bg-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                {suggestionAction.label}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onDismissSuggestion}
            className="rounded-xl bg-sky-500/20 px-3 py-1 text-xs text-sky-100 transition-colors hover:bg-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            닫기
          </button>
        </div>
      ) : null}

      {isDayView && !focusMode && isInsightsLoading ? (
        <TimelineInsightsSkeleton />
      ) : isDayView && !focusMode ? (
        <div className="ui-fade-in-up">
          <WeeklyPlanningBoard days={weeklyPlanningPreview} onJumpToDate={onJumpToDate} />
          <WeeklyReportCard report={weeklyReport} />
          <DailyRecapCard timeBoxes={sortedBoxes} categoryMap={categoryMap} />

          {categoryLegend.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {categoryLegend.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1 rounded-xl bg-gray-800/70 px-2.5 py-1.5 text-xs text-gray-200 shadow-sm"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : isDayView ? (
        <div className="mb-6 rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/35 dark:text-slate-300">
          집중 모드가 활성화되어 인사이트 카드를 숨겼습니다.
        </div>
      ) : null}

      {!isDayView && viewMode === 'WEEK' ? (
        <WeeklyCalendarView
          rangeLabel={weekCalendar.rangeLabel}
          days={weekCalendar.days}
          onOpenDate={handleOpenCalendarDate}
          onQuickAdd={(dateStr, dateLabel) => onOpenQuickAdd(dateStr, { dateLabel })}
        />
      ) : null}

      {!isDayView && viewMode === 'MONTH' ? (
        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <MonthlyCalendarView
            monthLabel={monthCalendar.monthLabel}
            cells={monthCalendar.cells}
            legend={monthCalendar.legend}
            scheduledDays={monthCalendar.scheduledDays}
            averageCompletionRate={monthCalendar.averageCompletionRate}
            busiestDay={monthCalendar.busiestDay}
            selectedDateStr={selectedMonthDate}
            onSelectDate={handleSelectMonthDate}
            onQuickAdd={(dateStr, dateLabel) => onOpenQuickAdd(dateStr, { dateLabel })}
          />
          <MonthDayDetailSheet
            day={selectedMonthCell}
            onOpenDate={handleOpenCalendarDate}
            onQuickAdd={(dateStr, dateLabel) => onOpenQuickAdd(dateStr, { dateLabel })}
            onClose={() => setSelectedMonthDate(null)}
          />
        </div>
      ) : null}

      {isDayView ? (
        <div data-testid="timeline-day-view">
          <div className="overflow-x-auto">
            {sortedBoxes.length > 0 && filteredBoxes.length === 0 ? (
              <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                현재 필터 조건에 맞는 일정이 없습니다.
              </p>
            ) : null}

            <div className="relative min-w-[520px]">
              <TimeSlotGrid
                onSlotClick={handleSlotClick}
                showDropGuide={showDropGuide}
                rowHeight={slotHeight}
                showQuarterDividers={timelineScale === '15'}
              />

              {showDropGuide && Number.isInteger(dropPreviewSlot) ? (
                <div
                  data-testid="timeline-drop-preview"
                  className="pointer-events-none absolute left-16 right-2 z-10"
                  style={{ top: dropPreviewSlot * slotHeight }}
                >
                  <div className="relative border-t-2 border-indigo-400/90">
                    <span className="absolute -left-14 -top-3 rounded bg-indigo-600/80 px-1.5 py-0.5 text-[10px] text-white">
                      {slotToTime(dropPreviewSlot)}
                    </span>
                  </div>
                </div>
              ) : null}

              {movingTimeBoxPreview &&
              Number.isInteger(movingTimeBoxPreview.startSlot) &&
              Number.isInteger(movingTimeBoxPreview.endSlot) ? (
                <div
                  data-testid="timeline-move-preview"
                  className="pointer-events-none absolute left-16 right-2 z-20"
                  style={{
                    top: movingTimeBoxPreview.startSlot * slotHeight,
                    height:
                      Math.max(1, movingTimeBoxPreview.endSlot - movingTimeBoxPreview.startSlot) *
                      slotHeight,
                  }}
                >
                  <div
                    className={`h-full rounded border-2 border-dashed px-2 py-1 text-[11px] ${
                      movingTimeBoxPreview.hasConflict
                        ? 'border-red-300 bg-red-500/20 text-red-100'
                        : 'border-cyan-300 bg-cyan-500/20 text-cyan-100'
                    }`}
                  >
                    이동 예정 {slotToTime(movingTimeBoxPreview.startSlot)} ~{' '}
                    {slotToTime(movingTimeBoxPreview.endSlot)}
                    {movingTimeBoxPreview.hasConflict ? ' (겹침)' : ''}
                  </div>
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-y-0 left-16 right-2">
                {filteredBoxes.map((box) => (
                  <TimeBoxCard
                    key={box.id}
                    timeBox={box}
                    slotHeight={slotHeight}
                    previewEndSlot={resizePreview[box.id]}
                    onResizePreview={handleResizePreview}
                    onResizeEnd={handleResizeEnd}
                    nowTimestamp={timerNow}
                    onTimerStart={onTimerStart}
                    onTimerPause={onTimerPause}
                    onTimerComplete={onTimerComplete}
                    categoryMeta={box.categoryId ? categoryMap.get(box.categoryId) : null}
                    onTimeBoxClick={(timeBox) => setSelectedBoxId(timeBox.id)}
                  />
                ))}

                {pendingInput ? (
                  <div
                    className="ui-panel-subtle pointer-events-auto absolute left-0 right-0 z-20 flex items-center gap-2 px-3 py-2"
                    style={{
                      top: pendingInput.slotIndex * slotHeight,
                    }}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={pendingInput.content}
                      onCompositionStart={() => setIsComposing(true)}
                      onCompositionEnd={() => setIsComposing(false)}
                      onChange={(event) =>
                        setPendingInput((prev) =>
                          prev ? { ...prev, content: event.target.value } : prev,
                        )
                      }
                      onKeyDown={(event) => {
                        const nativeComposing = event.nativeEvent?.isComposing || event.keyCode === 229

                        if (isComposing || nativeComposing) {
                          return
                        }

                        if (event.key === 'Enter') {
                          if (event.repeat) {
                            return
                          }

                          event.preventDefault()
                          handlePendingSubmit()
                        }

                        if (event.key === 'Escape') {
                          setPendingInput(null)
                        }
                      }}
                      onBlur={(event) => {
                        const related = event.relatedTarget
                        if (related && related.dataset.durationPreset) {
                          return
                        }
                        setPendingInput(null)
                      }}
                      className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                      placeholder="일정을 입력하고 엔터 (기본 30분)"
                    />

                    <div className="flex items-center gap-1">
                      {DURATION_PRESETS.map((presetSlots) => {
                        const isActive = pendingInput.durationSlots === presetSlots

                        return (
                          <button
                            key={presetSlots}
                            type="button"
                            data-duration-preset="true"
                            aria-label={`${presetSlots * 30}분 프리셋`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() =>
                              setPendingInput((prev) =>
                                prev ? { ...prev, durationSlots: presetSlots } : prev,
                              )
                            }
                            className={`rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isActive
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-700 text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {presetSlots * 30}분
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedBox ? (
        <CompletionModal
          key={selectedBox.id}
          timeBox={selectedBox}
          categories={categories}
          onClose={() => setSelectedBoxId(null)}
          onUpdate={updateTimeBox}
          onDuplicate={(id) => {
            onDuplicateTimeBox(id)
            setSelectedBoxId(null)
          }}
          onDelete={(id) => {
            removeTimeBox(id)
            setSelectedBoxId(null)
          }}
        />
      ) : null}
    </section>
  )
}

export default Timeline
