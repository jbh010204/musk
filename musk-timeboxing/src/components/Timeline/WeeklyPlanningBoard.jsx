import { slotToTime } from '../../utils/timeSlot'

function WeeklyPlanningBoard({ days = [], onJumpToDate = () => {} }) {
  return (
    <div className="ui-panel mb-6 p-6 shadow-md dark:shadow-none">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          주간 계획 보드
        </h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">월~금 미리보기</span>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {days.map((day) => (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => onJumpToDate(day.dateStr)}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-left shadow-none transition-all hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-800/30 dark:hover:bg-slate-800/45"
            aria-label={`주간보드 ${day.dateStr} 이동`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {day.dayLabel} {day.dayNumber}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">{day.total}건</span>
            </div>

            <div className="mt-2 space-y-1.5">
              {day.previewItems.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">비어 있음</p>
              ) : (
                day.previewItems.map((item) => (
                  <p key={item.id} className="truncate text-sm text-gray-200">
                    {slotToTime(item.startSlot)} {item.content}
                  </p>
                ))
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default WeeklyPlanningBoard
