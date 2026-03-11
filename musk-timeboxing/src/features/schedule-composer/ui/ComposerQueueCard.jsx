import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function ComposerQueueCard({ item, color = '#94a3b8', isSelected = false, onSelect = () => {} }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `composer-card-${item.id}`,
    data: {
      type: 'COMPOSER_CARD',
      itemId: item.id,
    },
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid={`composer-queue-card-${item.id}`}
      className={`w-full rounded-2xl bg-white/90 p-4 text-left shadow-sm transition-all dark:bg-slate-900/85 ${
        isSelected ? 'ring-2 ring-indigo-400' : 'hover:-translate-y-0.5'
      } ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
      }}
      onClick={() => onSelect(item.id)}
      {...attributes}
      {...listeners}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-xl px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm dark:text-slate-100"
          style={{
            backgroundColor: `${color}22`,
            border: `1px solid ${color}55`,
          }}
        >
          {item.estimatedSlots * 30}분
        </span>
        {item.linkedTimeBoxIds?.length > 0 ? (
          <span className="rounded-xl bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            예정 {item.linkedTimeBoxIds.length}
          </span>
        ) : (
          <span className="rounded-xl bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
            미배치
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
        {item.content}
      </p>
      {item.note ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.note}</p>
      ) : null}
    </button>
  )
}

export default ComposerQueueCard
