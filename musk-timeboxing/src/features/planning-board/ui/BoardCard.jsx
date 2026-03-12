import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, IconButton } from '../../../shared/ui'

const formatDurationLabel = (estimatedSlots = 1) => `${estimatedSlots * 30}분`

function BoardCard({
  item,
  color = '#94a3b8',
  onEdit = () => {},
  onSelect = () => {},
  onToggleSelect = () => {},
  sortable = true,
  isSelected = false,
  isMultiSelected = false,
  scheduleDraggable = false,
  onScheduleDragStart = () => {},
  onScheduleDragEnd = () => {},
}) {
  const sortableState = useSortable({
    id: item.id,
    data: {
      type: 'BOARD_CARD',
      itemId: item.id,
    },
    disabled: !sortable,
  })
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortableState

  return (
    <div
      ref={setNodeRef}
      data-testid={`planning-board-card-${item.id}`}
      onClick={() => onSelect(item)}
      className={`group rounded-2xl bg-white/90 p-4 shadow-sm transition-all dark:bg-slate-900/85 ${
        isDragging ? 'opacity-60 shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-indigo-400' : ''
      } ${!isSelected && isMultiSelected ? 'ring-2 ring-sky-300/80' : ''
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-xl px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm dark:text-slate-100"
              style={{
                backgroundColor: `${color}22`,
                border: `1px solid ${color}55`,
              }}
            >
              {formatDurationLabel(item.estimatedSlots)}
            </span>
            {item.linkedTimeBoxIds?.length > 0 ? (
              <span className="rounded-xl bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                예정 {item.linkedTimeBoxIds.length}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
            {item.content}
          </p>
          {item.note ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {item.note}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid={`planning-board-card-select-toggle-${item.id}`}
            aria-label={isMultiSelected ? '다중 선택 해제' : '다중 선택'}
            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
              isMultiSelected
                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            }`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleSelect(item)
            }}
          >
            {isMultiSelected ? '✓' : '○'}
          </button>
          {sortable ? (
            <>
              <IconButton
                aria-label="카드 수정"
                className="text-sm text-slate-400 transition-opacity group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-200"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(item)
                }}
              >
                ✎
              </IconButton>
              <Button
                variant="ghost"
                size="icon"
                aria-label="카드 이동 핸들"
                className="cursor-grab rounded-full text-slate-400 transition-opacity group-hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:group-hover:text-slate-200"
                {...attributes}
                {...listeners}
              >
                ⋮⋮
              </Button>
            </>
          ) : null}
          {scheduleDraggable ? (
            <button
              type="button"
              draggable
              data-testid={`planning-board-card-schedule-handle-${item.id}`}
              aria-label="일정 배치 드래그"
              className="rounded-full px-2 py-1 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-400/10"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(item)
              }}
              onDragStart={(event) => {
                event.stopPropagation()
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/planner-card-id', item.id)
                onSelect(item)
                onScheduleDragStart(item)
              }}
              onDragEnd={(event) => {
                event.stopPropagation()
                onScheduleDragEnd(item)
              }}
            >
              일정
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default BoardCard
