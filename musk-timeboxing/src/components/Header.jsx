const formatKoreanDate = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`)
  const [year, month, day] = dateStr.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

function Header({ currentDate, goNextDay, goPrevDay, weekStrip = [], goToDate = () => {} }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevDay}
          className="rounded px-3 py-1 text-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="이전 날짜"
        >
          ←
        </button>

        <h1 className="text-base font-semibold">{formatKoreanDate(currentDate)}</h1>

        <button
          type="button"
          onClick={goNextDay}
          className="rounded px-3 py-1 text-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="다음 날짜"
        >
          →
        </button>
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
