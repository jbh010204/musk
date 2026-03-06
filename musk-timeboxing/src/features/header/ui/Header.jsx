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
    <header className="sticky top-0 z-30 bg-slate-50/95 px-6 py-4 text-slate-900 backdrop-blur dark:bg-gray-900/85 dark:text-gray-100">
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
            aria-pressed={theme === 'light'}
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

      <div className="mt-4 grid grid-cols-7 gap-3">
        {weekStrip.map((day) => {
          const ratio = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => goToDate(day.dateStr)}
              className={`relative overflow-hidden rounded-2xl px-1 py-2 text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
                <div className={`text-sm font-semibold ${day.isCurrent ? 'text-gray-100' : 'text-slate-700 dark:text-gray-100'}`}>
                  {day.dayNumber}
                </div>
                <div className={`mt-1.5 h-1 w-full rounded ${day.isCurrent ? 'bg-indigo-300/35' : 'bg-gray-700/70'}`}>
                  <div className="h-1 rounded bg-green-500" style={{ width: `${ratio}%` }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </header>
  )
}

export default Header
