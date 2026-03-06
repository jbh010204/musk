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
    <header className="sticky top-0 z-30 bg-gray-900/85 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevDay}
          className="ui-btn-ghost px-3 py-1 text-lg"
          aria-label="이전 날짜"
        >
          ←
        </button>

        <h1 className="text-lg font-semibold">{formatKoreanDate(currentDate)}</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenReschedule}
            className="ui-btn-ghost px-3 py-1.5 text-xs"
            aria-label="자동 재배치"
          >
            재배치
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="ui-btn-ghost px-3 py-1.5 text-xs"
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

      <div className="ui-panel mt-4 flex items-center justify-between p-6">
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
          {bigThreeProgress.isPerfect ? (
            <span className="rounded-xl bg-green-500/15 px-2 py-1 text-xs font-semibold text-green-300 shadow-sm">
              오늘 성공
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {weekStrip.map((day) => {
          const ratio = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => goToDate(day.dateStr)}
              className={`ui-panel-subtle px-1 py-2 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                day.isCurrent
                  ? 'bg-indigo-600/25 text-gray-100'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              aria-label={`${day.dateStr} 이동`}
            >
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{day.dayLabel}</div>
              <div className="text-sm font-semibold text-gray-100">{day.dayNumber}</div>
              <div className="mt-1.5 h-1 w-full rounded bg-gray-700/70">
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
