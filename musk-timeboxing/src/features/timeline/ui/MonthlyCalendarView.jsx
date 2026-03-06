import { Badge, Card } from '../../../shared/ui'
import { hexToRgba, slotToTime } from '../../../entities/planner'

const WEEK_HEADER_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const HEAT_LEVEL_LABELS = {
  0: '비어 있음',
  1: '낮은 밀도',
  2: '보통 밀도',
  3: '높은 밀도',
  4: '집중 밀도',
}

const getHeatOverlayStyle = (cell) => {
  if (!cell?.dominantCategory || cell.heatLevel <= 0) {
    return null
  }

  const alphaByLevel = {
    1: 0.1,
    2: 0.16,
    3: 0.22,
    4: 0.28,
  }
  const alpha = alphaByLevel[cell.heatLevel] || 0.12

  return {
    background: `linear-gradient(135deg, ${hexToRgba(cell.dominantCategory.color, alpha)} 0%, ${hexToRgba(
      cell.dominantCategory.color,
      alpha * 0.38,
    )} 100%)`,
  }
}

function MonthlyCalendarView({
  monthLabel,
  cells = [],
  legend = [],
  scheduledDays = 0,
  averageCompletionRate = 0,
  busiestDay = null,
  onOpenDate = () => {},
}) {
  return (
    <Card className="mb-6 p-6" data-testid="calendar-view-month">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            월간 캘린더
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{monthLabel}</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            대표 카테고리 색이 깔리고, 셀이 진할수록 일정 밀도와 완료율이 높습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="neutral">일정 있는 날 {scheduledDays}일</Badge>
          <Badge tone="neutral">평균 완료율 {averageCompletionRate}%</Badge>
          {busiestDay ? (
            <Badge tone="neutral">최다 일정 {busiestDay.dayNumber}일 · {busiestDay.total}건</Badge>
          ) : null}
        </div>
      </div>

      <div
        data-testid="calendar-view-month-legend"
        className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50/80 p-3 dark:bg-slate-800/35"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          카테고리 히트맵
        </span>
        {legend.length === 0 ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">카테고리 일정이 아직 없습니다.</span>
        ) : (
          legend.map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-2.5 py-1 text-xs text-slate-700 shadow-sm dark:bg-slate-900/60 dark:text-slate-200"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
              <span className="text-slate-400 dark:text-slate-500">{item.count}</span>
            </span>
          ))
        )}
      </div>

      <div className="mb-3 grid grid-cols-7 gap-3">
        {WEEK_HEADER_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {cells.map((cell) => (
          <button
            key={cell.dateStr}
            type="button"
            onClick={() => onOpenDate(cell.dateStr)}
            data-testid={`month-calendar-day-${cell.dateStr}`}
            data-heat-intensity={cell.heatLevel}
            data-dominant-category={cell.dominantCategory?.label || 'none'}
            className={`relative min-h-[156px] overflow-hidden rounded-2xl p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              cell.isCurrent
                ? 'ring-1 ring-indigo-300/60 shadow-sm'
                : cell.inCurrentMonth
                  ? 'bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/35 dark:hover:bg-slate-800/50'
                  : 'bg-slate-100/60 text-slate-400 hover:bg-slate-100 dark:bg-slate-900/35 dark:text-slate-500 dark:hover:bg-slate-900/50'
            }`}
          >
            {cell.isCurrent ? (
              <span
                aria-hidden
                className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent"
              />
            ) : null}
            {getHeatOverlayStyle(cell) ? (
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl"
                style={getHeatOverlayStyle(cell)}
              />
            ) : null}

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-sm font-semibold ${
                    cell.inCurrentMonth ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {cell.dayNumber}
                </p>
                <span className="rounded-xl bg-slate-200/80 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                  {cell.total}건
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {HEAT_LEVEL_LABELS[cell.heatLevel] || HEAT_LEVEL_LABELS[0]}
                </span>
                {cell.dominantCategory ? (
                  <span
                    className="inline-flex max-w-[92px] items-center gap-1 truncate rounded-xl px-2 py-0.5 text-[11px] text-slate-800 shadow-sm dark:text-slate-100"
                    style={{
                      backgroundColor: hexToRgba(cell.dominantCategory.color, 0.22),
                      border: `1px solid ${hexToRgba(cell.dominantCategory.color, 0.45)}`,
                    }}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: cell.dominantCategory.color }}
                    />
                    <span className="truncate">{cell.dominantCategory.label}</span>
                  </span>
                ) : null}
              </div>

              <div className="mt-2 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/70">
                <div
                  className="h-1.5 rounded-full bg-emerald-500"
                  style={{ width: `${cell.completionRate}%` }}
                />
              </div>

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                완료 {cell.completed}/{cell.total} · 계획 {cell.plannedMinutes}분
              </div>

              <div className="mt-2 min-h-[38px] space-y-1">
                {cell.previewItems.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">비어 있음</p>
                ) : (
                  cell.previewItems.slice(0, 2).map((item) => (
                    <p key={item.id} className="truncate text-xs text-slate-700 dark:text-slate-200">
                      {slotToTime(item.startSlot)} {item.content}
                    </p>
                  ))
                )}
              </div>

              <div className="mt-auto pt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/85 dark:bg-slate-800/75">
                  {cell.categoryMix.length === 0 ? (
                    <span className="block h-full w-full bg-slate-300/70 dark:bg-slate-700/70" />
                  ) : (
                    cell.categoryMix.map((category) => (
                      <span
                        key={category.key}
                        className="inline-block h-full"
                        style={{
                          width: `${category.share}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}

export default MonthlyCalendarView
