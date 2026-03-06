import { Card } from '../../../shared/ui'
import { slotToTime } from '../../../entities/planner'

const WEEK_HEADER_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function MonthlyCalendarView({ monthLabel, cells = [], onOpenDate = () => {} }) {
  return (
    <Card className="mb-6 p-6" data-testid="calendar-view-month">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            월간 캘린더
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{monthLabel}</p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">날짜 클릭 시 일간 보기로 이동</p>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-3">
        {WEEK_HEADER_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {cells.map((cell) => (
          <button
            key={cell.dateStr}
            type="button"
            onClick={() => onOpenDate(cell.dateStr)}
            data-testid={`month-calendar-day-${cell.dateStr}`}
            className={`min-h-[132px] rounded-2xl p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              cell.isCurrent
                ? 'bg-gradient-to-br from-indigo-600/20 via-cyan-500/10 to-emerald-500/10 ring-1 ring-indigo-300/60'
                : cell.inCurrentMonth
                  ? 'bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/35 dark:hover:bg-slate-800/50'
                  : 'bg-slate-100/60 text-slate-400 hover:bg-slate-100 dark:bg-slate-900/35 dark:text-slate-500 dark:hover:bg-slate-900/50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-sm font-semibold ${
                  cell.inCurrentMonth ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {cell.dayNumber}
              </p>
              <span className="rounded-xl bg-slate-200/80 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                {cell.total}건
              </span>
            </div>

            <div className="mt-2 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/70">
              <div
                className="h-1.5 rounded-full bg-emerald-500"
                style={{ width: `${cell.completionRate}%` }}
              />
            </div>

            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              완료 {cell.completed}/{cell.total} · 계획 {cell.plannedMinutes}분
            </div>

            <div className="mt-2 space-y-1">
              {cell.previewItems.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">비어 있음</p>
              ) : (
                cell.previewItems.slice(0, 2).map((item) => (
                  <p key={item.id} className="truncate text-xs text-slate-700 dark:text-slate-200">
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

export default MonthlyCalendarView
