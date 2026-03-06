import { slotToTime } from '../../utils/timeSlot'

function WeeklyPlanningBoard({ days = [], onJumpToDate = () => {} }) {
  return (
    <div className="ui-panel mb-4 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">주간 계획 보드</h3>
        <span className="text-[11px] text-gray-500">월~금 미리보기</span>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        {days.map((day) => (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => onJumpToDate(day.dateStr)}
            className="rounded border border-gray-700 bg-gray-900/60 p-2 text-left transition-colors hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`주간보드 ${day.dateStr} 이동`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {day.dayLabel} {day.dayNumber}
              </p>
              <span className="text-[10px] text-gray-500">{day.total}건</span>
            </div>

            <div className="mt-1 space-y-1">
              {day.previewItems.length === 0 ? (
                <p className="text-[11px] text-gray-500">비어 있음</p>
              ) : (
                day.previewItems.map((item) => (
                  <p key={item.id} className="truncate text-xs text-gray-200">
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
