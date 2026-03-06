import { useState } from 'react'

function WeeklyReportCard({ report }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const diffPrefix = report.diff > 0 ? '+' : ''
  const diffTone = report.diff > 0 ? 'text-orange-300' : report.diff < 0 ? 'text-green-300' : 'text-gray-300'

  return (
    <div className="ui-panel mb-6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          주간 리포트
        </h3>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="ui-btn-ghost ml-auto h-7 w-7 p-0 text-base text-slate-400"
          aria-label={isExpanded ? '주간 리포트 접기' : '주간 리포트 펼치기'}
          data-testid="weekly-report-toggle"
        >
          {isExpanded ? '⌃' : '⌄'}
        </button>
      </div>

      {!isExpanded ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">요약이 접혀 있습니다.</p>
      ) : null}

      {isExpanded && report.total === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">이번 주 데이터가 아직 없습니다.</p>
      ) : null}

      {isExpanded && report.total > 0 ? (
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-base text-gray-200">
            총 일정 <span className="text-xl font-bold text-gray-100">{report.total}개</span> · 완료율{' '}
            <span className="text-xl font-bold text-gray-100">{report.completionRate}%</span>
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
                  className="inline-flex items-center gap-1 rounded-xl bg-gray-900/50 px-2.5 py-1.5 text-xs text-gray-300 shadow-sm"
                >
                  {day.dayLabel} {day.completed}/{day.total}
                  <span className="text-slate-500 dark:text-slate-400">({dayRatio}%)</span>
                </span>
              )
            })}
          </div>

          <div className="text-sm text-gray-300">
            스킵 TOP3:{' '}
            {report.topSkipReasons.length > 0
              ? report.topSkipReasons.map((item) => `${item.reason}(${item.count})`).join(' · ')
              : '없음'}
          </div>

          <div className="ui-panel-subtle px-3 py-2 text-xs text-gray-300">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
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
                      className={`rounded-xl bg-gray-800/80 px-2 py-1 shadow-sm ${tone}`}
                    >
                      {item.reason}: {item.previous}→{item.current} ({deltaPrefix}
                      {item.delta})
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="mt-1 text-slate-500 dark:text-slate-400">비교 데이터가 없습니다.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default WeeklyReportCard
