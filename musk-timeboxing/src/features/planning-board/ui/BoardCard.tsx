import { useRef, type DragEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TaskCard } from '../../../entities/planner/model/types'
import { IconButton } from '../../../shared/ui'
import { applyNativeCardDragPreview } from '../../planner-dnd/lib/nativeCardDragPreview'
import { createBoardCardDragPayload } from '../../planner-dnd/lib/payloads'

const formatDurationLabel = (estimateSlots = 1) => `${estimateSlots * 30}분`

interface BoardCardProps {
  item: TaskCard
  color?: string
  onEdit?: (item: TaskCard) => void
  onSelect?: (item: TaskCard) => void
  onToggleSelect?: (item: TaskCard) => void
  sortable?: boolean
  isSelected?: boolean
  isMultiSelected?: boolean
  scheduleDraggable?: boolean
  onScheduleDragStart?: (item: TaskCard) => void
  onScheduleDragEnd?: (item: TaskCard) => void
}

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
}: BoardCardProps) {
  const nativePreviewCleanupRef = useRef<(() => void) | null>(null)
  const sortableState = useSortable({
    id: item.id,
    data: createBoardCardDragPayload(item.id),
    disabled: !sortable,
  })
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    sortableState

  const clearNativePreview = () => {
    nativePreviewCleanupRef.current?.()
    nativePreviewCleanupRef.current = null
  }

  const startNativeScheduleDrag = (event: DragEvent<HTMLElement>) => {
    event.stopPropagation()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/planner-card-id', item.id)
    event.dataTransfer.setData('text/plain', item.title)
    clearNativePreview()
    nativePreviewCleanupRef.current = applyNativeCardDragPreview(event.dataTransfer, {
      title: item.title,
      durationLabel: formatDurationLabel(item.estimateSlots),
      color,
    })
    onScheduleDragStart(item)
  }

  const endNativeScheduleDrag = (event: DragEvent<HTMLElement>) => {
    event.stopPropagation()
    clearNativePreview()
    onScheduleDragEnd(item)
  }

  return (
    <div
      ref={setNodeRef}
      data-testid={`planning-board-card-${item.id}`}
      onClick={() => onSelect(item)}
      className={`group relative rounded-2xl bg-white/90 p-4 shadow-sm transition-all dark:bg-slate-900/85 ${
        isDragging ? 'opacity-60 shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-indigo-400' : ''
      } ${!isSelected && isMultiSelected ? 'ring-2 ring-sky-300/80' : ''
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="relative z-0 flex items-start justify-between gap-3">
        <div
          data-testid={scheduleDraggable ? `planning-board-card-drag-body-${item.id}` : undefined}
          draggable={scheduleDraggable}
          onDragStart={scheduleDraggable ? startNativeScheduleDrag : undefined}
          onDragEnd={scheduleDraggable ? endNativeScheduleDrag : undefined}
          className={`relative min-w-0 flex-1 ${
            scheduleDraggable ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
        >
          <div className="relative z-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-xl px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm dark:text-slate-100"
                style={{
                  backgroundColor: `${color}22`,
                  border: `1px solid ${color}55`,
                }}
              >
                {formatDurationLabel(item.estimateSlots)}
              </span>
              {item.linkedTimeBoxIds?.length > 0 ? (
                <span className="rounded-xl bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  예정 {item.linkedTimeBoxIds.length}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
              {item.title}
            </p>
            {item.note ? (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {item.note}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
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
              <button
                ref={setActivatorNodeRef}
                type="button"
                aria-label="카드 이동 핸들"
                className="ui-btn-ghost !h-7 !w-7 !p-0 cursor-grab rounded-full text-slate-400 transition-opacity group-hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:group-hover:text-slate-200"
                {...attributes}
                {...listeners}
              >
                ⋮⋮
              </button>
            </>
          ) : null}
          {scheduleDraggable ? (
            <button
              type="button"
              draggable
              data-testid={`planning-board-card-schedule-handle-${item.id}`}
              data-card-schedule-drag-handle="true"
              aria-label="일정 배치 드래그"
              className="rounded-full px-2 py-1 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-400/10"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(item)
              }}
              onDragStart={startNativeScheduleDrag}
              onDragEnd={endNativeScheduleDrag}
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
