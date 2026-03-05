function WeeklyReportCard({ report }) {
  const diffPrefix = report.diff > 0 ? '+' : ''
  const diffTone = report.diff > 0 ? 'text-orange-300' : report.diff < 0 ? 'text-green-300' : 'text-gray-300'

  return (
    <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/70 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">주간 리포트</h3>

      {report.total === 0 ? (
        <p className="mt-2 text-sm text-gray-400">이번 주 데이터가 아직 없습니다.</p>
      ) : (
        <div className="mt-2 space-y-2 text-sm">
          <p className="text-gray-200">
            총 일정 <span className="font-semibold text-white">{report.total}개</span> · 완료율{' '}
            <span className="font-semibold text-white">{report.completionRate}%</span>
          </p>
          <p className="text-gray-300">
            완료 일정 기준 계획 {report.completedPlannedMinutes}분 → 실제 {report.completedActualMinutes}분 (
            <span className={diffTone}>
              {diffPrefix}
              {report.diff}분
            </span>
            )
          </p>

          <div className="flex flex-wrap gap-1">
            {report.byDay.map((day) => {
              const dayRatio = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0
              return (
                <span
                  key={day.dateStr}
                  className="inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-900/50 px-2 py-1 text-xs text-gray-300"
                >
                  {day.dayLabel} {day.completed}/{day.total}
                  <span className="text-gray-500">({dayRatio}%)</span>
                </span>
              )
            })}
          </div>

          <div className="text-xs text-gray-300">
            스킵 TOP3:{' '}
            {report.topSkipReasons.length > 0
              ? report.topSkipReasons.map((item) => `${item.reason}(${item.count})`).join(' · ')
              : '없음'}
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyReportCard
