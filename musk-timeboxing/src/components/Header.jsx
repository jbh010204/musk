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
  return (
    <header className="sticky top-0 z-30 border-b border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevDay}
          className="ui-btn-ghost px-3 py-1 text-lg"
          aria-label="이전 날짜"
        >
          ←
        </button>

        <h1 className="text-base font-semibold">{formatKoreanDate(currentDate)}</h1>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenReschedule}
            className="ui-btn-ghost px-2 py-1 text-xs"
            aria-label="자동 재배치"
          >
            재배치
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="ui-btn-ghost px-2 py-1 text-xs"
            aria-label="테마 전환"
          >
            {theme === 'dark' ? '라이트' : '다크'}
          </button>
          <button
            type="button"
            onClick={goNextDay}
            className="ui-btn-ghost px-3 py-1 text-lg"
            aria-label="다음 날짜"
          >
            →
          </button>
        </div>
      </div>

      <div className="ui-panel-subtle mt-3 flex items-center justify-between px-3 py-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Big3 완료</p>
          <p className="text-sm font-semibold text-white">
            {bigThreeProgress.completedCount}/3
            <span className="ml-2 text-xs font-normal text-gray-400">
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
          {bigThreeProgress.isPerfect ? (
            <span className="rounded border border-green-400/60 bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-300">
              오늘 성공
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {weekStrip.map((day) => {
          const ratio = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => goToDate(day.dateStr)}
              className={`rounded border px-1 py-1.5 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                day.isCurrent
                  ? 'border-indigo-400 bg-indigo-600/30 text-white'
                  : 'border-gray-700 bg-gray-800/80 text-gray-300 hover:bg-gray-700'
              }`}
              aria-label={`${day.dateStr} 이동`}
            >
              <div className="text-[10px]">{day.dayLabel}</div>
              <div className="text-sm font-semibold">{day.dayNumber}</div>
              <div className="mt-1 h-1 w-full rounded bg-gray-700">
                <div className="h-1 rounded bg-green-500" style={{ width: `${ratio}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </header>
  )
}

export default Header
