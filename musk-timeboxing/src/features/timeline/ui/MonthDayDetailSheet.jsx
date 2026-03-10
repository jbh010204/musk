import { Badge, Button, Card } from '../../../shared/ui'
import { getStatusVisual, hexToRgba, slotToTime } from '../../../entities/planner'

const formatDateLabel = (dateStr) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateStr}T00:00:00`))

function MonthDayDetailSheet({
  day = null,
  onOpenDate = () => {},
  onQuickAdd = () => {},
  onClose = () => {},
}) {
  if (!day) {
    return (
      <Card
        className="p-6 xl:sticky xl:top-6"
        data-testid="month-day-detail-sheet-empty"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          날짜 상세
        </h3>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          월간 캘린더에서 날짜를 선택하면 이곳에 그날의 상세 일정과 요약이 표시됩니다.
        </p>
      </Card>
    )
  }

  return (
    <Card
      className="p-6 xl:sticky xl:top-6"
      data-testid="month-day-detail-sheet"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            날짜 상세
          </h3>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatDateLabel(day.dateStr)}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            총 일정 {day.total}건 · 완료율 {day.completionRate}% · 계획 {day.plannedMinutes}분
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="월간 상세 닫기"
          onClick={onClose}
          className="rounded-full"
        >
          ×
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">완료 {day.completed}/{day.total}</Badge>
        <Badge tone="neutral">계획 {day.plannedMinutes}분</Badge>
        {day.dominantCategory ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs text-slate-800 shadow-sm dark:text-slate-100"
            style={{
              backgroundColor: hexToRgba(day.dominantCategory.color, 0.18),
              border: `1px solid ${hexToRgba(day.dominantCategory.color, 0.42)}`,
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: day.dominantCategory.color }}
            />
            {day.dominantCategory.label}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          className="px-3 py-2 text-xs"
          data-testid="month-day-detail-open-date"
          onClick={() => onOpenDate(day.dateStr)}
        >
          이 날짜 열기
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-2 text-xs"
          data-testid="month-day-detail-quick-add"
          onClick={() => onQuickAdd(day.dateStr, `${day.dayLabel} ${day.dayNumber} 빠른 일정 추가`)}
        >
          빠른 추가
        </Button>
      </div>

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          일정 목록
        </h4>

        {day.detailItems.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-slate-50/80 px-4 py-4 text-sm text-slate-500 dark:bg-slate-800/35 dark:text-slate-400">
            등록된 일정이 없습니다.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {day.detailItems.map((item) => {
              const status = getStatusVisual(item.status)
              const timeRange = `${slotToTime(item.startSlot)} - ${slotToTime(item.endSlot)}`
              const summary =
                item.status === 'COMPLETED' && item.actualMinutes != null
                  ? `실제 ${item.actualMinutes}분`
                  : item.status === 'SKIPPED' && item.skipReason
                    ? `사유: ${item.skipReason}`
                    : `계획 ${item.plannedMinutes}분`

              return (
                <div
                  key={item.id}
                  data-testid={`month-day-detail-item-${item.id}`}
                  className="rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-800/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {timeRange}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.content}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-xl px-2 py-1 text-[11px] font-medium text-white"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.categoryLabel && item.categoryColor ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-slate-700 dark:text-slate-100"
                        style={{
                          backgroundColor: hexToRgba(item.categoryColor, 0.16),
                          border: `1px solid ${hexToRgba(item.categoryColor, 0.4)}`,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.categoryColor }}
                        />
                        {item.categoryLabel}
                      </span>
                    ) : null}
                    <span>{summary}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

export default MonthDayDetailSheet
