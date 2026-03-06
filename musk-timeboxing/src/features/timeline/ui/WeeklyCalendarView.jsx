import { Badge, Card } from '../../../shared/ui'
import { slotToTime } from '../../../entities/planner'

function WeeklyCalendarView({ rangeLabel, days = [], onOpenDate = () => {} }) {
  return (
    <Card className="mb-6 p-6" data-testid="calendar-view-week">
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
          <button
            key={day.dateStr}
            type="button"
            onClick={() => onOpenDate(day.dateStr)}
            data-testid={`week-calendar-day-${day.dateStr}`}
            className={`rounded-2xl p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
              <Badge tone="neutral">{day.total}건</Badge>
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
          </button>
        ))}
      </div>
    </Card>
  )
}

export default WeeklyCalendarView
