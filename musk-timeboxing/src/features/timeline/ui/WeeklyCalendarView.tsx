import { Badge, Button, Card } from '../../../shared/ui'
import { slotToTime } from '../../../entities/planner'
import type { DeadlinePriority, TimeBoxStatus } from '../../../entities/planner/model/types'
import DeadlineStrip from './DeadlineStrip'

interface WeeklyCalendarPreviewItem {
  id: string
  content: string
  startSlot: number
  status: TimeBoxStatus
}

interface WeeklyCalendarDay {
  dateStr: string
  dayLabel: string
  dayNumber: number
  total: number
  completionRate: number
  plannedMinutes: number
  isCurrent: boolean
  previewItems: WeeklyCalendarPreviewItem[]
}

interface WeeklyCalendarViewProps {
  rangeLabel: string
  deadlines?: Array<{
    id: string
    title: string
    dueDate: string
    priority: DeadlinePriority
    urgency: {
      kind: 'DONE' | 'OVERDUE' | 'TODAY' | 'UPCOMING'
      label: string
    }
  }>
  days?: WeeklyCalendarDay[]
  onOpenDate?: (dateStr: string) => void
  onToggleDeadlineComplete?: (deadlineId: string) => void
  onQuickAdd?: (dateStr: string, label: string) => void
}

function WeeklyCalendarView({
  rangeLabel,
  deadlines = [],
  days = [],
  onOpenDate = () => {},
  onToggleDeadlineComplete = () => {},
  onQuickAdd = () => {},
}: WeeklyCalendarViewProps) {
  return (
    <Card className="mb-6 p-6" data-testid="calendar-view-week">
      <DeadlineStrip
        title="이번 주 데드라인"
        items={deadlines}
        onOpenDate={onOpenDate}
        onToggleComplete={onToggleDeadlineComplete}
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            주간 캘린더
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{rangeLabel}</p>
        </div>
        <Badge tone="neutral">{days.length}일 보기</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        {days.map((day) => (
          <div
            key={day.dateStr}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDate(day.dateStr)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenDate(day.dateStr)
              }
            }}
            data-testid={`week-calendar-day-${day.dateStr}`}
            className={`group/day relative rounded-2xl p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              day.isCurrent
                ? 'bg-gradient-to-br from-indigo-600/20 via-cyan-500/10 to-emerald-500/10 shadow-sm ring-1 ring-indigo-300/60'
                : 'bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/35 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {day.dayLabel}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {day.dayNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral" className="bg-slate-200/55 text-slate-500 dark:bg-slate-800/55 dark:text-slate-300">
                  {day.total}건
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${day.dateStr} 빠른 일정 추가`}
                  data-testid={`week-calendar-quick-add-${day.dateStr}`}
                  className="rounded-full bg-white/88 text-slate-500 shadow-sm opacity-70 transition-all hover:bg-white hover:text-slate-900 md:opacity-0 md:translate-y-1 md:group-hover/day:translate-y-0 md:group-hover/day:opacity-100 md:group-focus-within/day:translate-y-0 md:group-focus-within/day:opacity-100 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    onQuickAdd(day.dateStr, `${day.dayLabel} ${day.dayNumber} 빠른 일정 추가`)
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/70">
              <div
                className="h-1.5 rounded-full bg-emerald-500"
                style={{ width: `${day.completionRate}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>완료율 {day.completionRate}%</span>
              <span>계획 {day.plannedMinutes}분</span>
            </div>

            <div className="mt-3 space-y-1.5">
              {day.previewItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">비어 있음</p>
              ) : (
                day.previewItems.map((item) => (
                  <p key={item.id} className="truncate text-sm text-slate-700 dark:text-slate-200">
                    {slotToTime(item.startSlot)} {item.content}
                  </p>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default WeeklyCalendarView
