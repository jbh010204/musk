const formatKoreanDate = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`)
  const [year, month, day] = dateStr.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)
  return `${year}년 ${month}월 ${day}일 (${weekday})`
}

function Header({ currentDate, goNextDay, goPrevDay }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
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
    </header>
  )
}

export default Header
