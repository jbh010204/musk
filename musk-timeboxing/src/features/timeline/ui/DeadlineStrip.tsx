import { Badge } from '../../../shared/ui'
import type { DeadlinePriority } from '../../../entities/planner/model/types'

interface DeadlineStripItem {
  id: string
  title: string
  dueDate: string
  priority: DeadlinePriority
  urgency: {
    kind: 'DONE' | 'OVERDUE' | 'TODAY' | 'UPCOMING'
    label: string
  }
}

interface DeadlineStripProps {
  title?: string
  items?: DeadlineStripItem[]
  onOpenDate?: (dateStr: string) => void
  onToggleComplete?: (deadlineId: string) => void
}

const PRIORITY_LABEL: Record<DeadlinePriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '중요',
}

const URGENCY_CLASS: Record<DeadlineStripItem['urgency']['kind'], string> = {
  DONE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  OVERDUE: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  TODAY: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  UPCOMING: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
}

function DeadlineStrip({
  title = '데드라인',
  items = [],
  onOpenDate = () => {},
  onToggleComplete = () => {},
}: DeadlineStripProps) {
  const isEmpty = items.length === 0

  return (
    <div
      className={`mb-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/35 ${
        isEmpty ? 'px-3 py-2.5' : 'p-3'
      }`}
      data-testid="deadline-strip"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {isEmpty ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">열린 마감이 없습니다</span>
        ) : null}
      </div>

      {!isEmpty ? (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="deadline-strip-items">
          {items.map((item) => (
            <div
              key={item.id}
              className="group inline-flex max-w-full items-stretch gap-1 rounded-2xl bg-white p-1 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <button
                type="button"
                data-testid={`deadline-chip-${item.id}`}
                onClick={() => onOpenDate(item.dueDate)}
                className="inline-flex min-w-0 items-center gap-2 rounded-[1rem] px-2 py-1 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className={`rounded-xl px-2 py-1 text-[11px] font-semibold ${URGENCY_CLASS[item.urgency.kind]}`}>
                  {item.urgency.label}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                    {item.dueDate} · {PRIORITY_LABEL[item.priority]}
                  </span>
                </span>
                <Badge tone="neutral" className="shrink-0">
                  마감
                </Badge>
              </button>

              <button
                type="button"
                data-testid={`deadline-complete-${item.id}`}
                aria-label={`${item.title} 데드라인 완료`}
                onClick={() => onToggleComplete(item.id)}
                className="rounded-[1rem] bg-emerald-500/10 px-3 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/16 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-emerald-300"
              >
                완료
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default DeadlineStrip
