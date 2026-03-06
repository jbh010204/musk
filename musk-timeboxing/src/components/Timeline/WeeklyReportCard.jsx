import { useState } from 'react'

function WeeklyReportCard({ report }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const diffPrefix = report.diff > 0 ? '+' : ''
  const diffTone = report.diff > 0 ? 'text-orange-300' : report.diff < 0 ? 'text-green-300' : 'text-gray-300'

  return (
    <div className="ui-panel mb-4 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">주간 리포트</h3>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="ui-btn-ghost text-[11px]"
        >
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>

      {!isExpanded ? (
        <p className="mt-2 text-sm text-gray-400">요약이 접혀 있습니다.</p>
      ) : null}

      {isExpanded && report.total === 0 ? (
        <p className="mt-2 text-sm text-gray-400">이번 주 데이터가 아직 없습니다.</p>
      ) : null}

      {isExpanded && report.total > 0 ? (
        <div className="mt-2 space-y-2 text-sm">
          <p className="text-gray-200">
            총 일정 <span className="font-semibold text-gray-100">{report.total}개</span> · 완료율{' '}
            <span className="font-semibold text-gray-100">{report.completionRate}%</span>
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

          <div className="rounded border border-gray-700 bg-gray-900/60 px-2 py-1 text-xs text-gray-300">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              스킵 원인 변화 (지난주 대비)
            </p>
            {report.skipReasonTrend?.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {report.skipReasonTrend.map((item) => {
                  const tone =
                    item.delta > 0 ? 'text-orange-300' : item.delta < 0 ? 'text-green-300' : 'text-gray-300'
                  const deltaPrefix = item.delta > 0 ? '+' : ''

                  return (
                    <span
                      key={item.reason}
                      className={`rounded border border-gray-600 bg-gray-800 px-2 py-0.5 ${tone}`}
                    >
                      {item.reason}: {item.previous}→{item.current} ({deltaPrefix}
                      {item.delta})
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="mt-1 text-gray-400">비교 데이터가 없습니다.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default WeeklyReportCard
