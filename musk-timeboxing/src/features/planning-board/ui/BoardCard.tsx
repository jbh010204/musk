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
  compact?: boolean
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
  compact = false,
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
      className={`group relative bg-white/90 shadow-sm transition-all dark:bg-slate-900/85 ${
        compact ? 'rounded-[1.35rem] p-3' : 'rounded-2xl p-4'
      } ${
        isDragging ? 'opacity-60 shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-indigo-400' : ''
      } ${!isSelected && isMultiSelected ? 'ring-2 ring-sky-300/80' : ''
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className={`relative z-0 flex items-start justify-between ${compact ? 'gap-2.5' : 'gap-3'}`}>
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
                className={`inline-flex items-center rounded-xl px-2 py-0.5 font-medium text-slate-700 shadow-sm dark:text-slate-100 ${
                  compact ? 'text-[10px]' : 'text-[11px]'
                }`}
                style={{
                  backgroundColor: `${color}22`,
                  border: `1px solid ${color}55`,
                }}
              >
                {formatDurationLabel(item.estimateSlots)}
              </span>
              {item.linkedTimeBoxIds?.length > 0 ? (
                <span
                  className={`rounded-xl bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300 ${
                    compact ? 'text-[10px]' : 'text-[11px]'
                  }`}
                >
                  예정 {item.linkedTimeBoxIds.length}
                </span>
              ) : null}
            </div>
            <p
              className={`font-semibold text-slate-900 dark:text-slate-100 ${
                compact ? 'mt-2 text-[13px] leading-5' : 'mt-3 text-sm leading-5'
              }`}
            >
              {item.title}
            </p>
            {item.note ? (
              <p
                className={`text-slate-500 dark:text-slate-400 ${
                  compact ? 'mt-1.5 line-clamp-1 text-[11px] leading-4' : 'mt-2 line-clamp-2 text-xs leading-5'
                }`}
              >
                {item.note}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={`relative z-20 flex items-center opacity-70 transition-opacity group-hover:opacity-100 ${
            compact ? 'gap-0.5' : 'gap-1'
          }`}
        >
          <button
            type="button"
            data-testid={`planning-board-card-select-toggle-${item.id}`}
            aria-label={isMultiSelected ? '다중 선택 해제' : '다중 선택'}
            className={`rounded-full font-medium transition-colors ${
              compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'
            } ${
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
                className={`text-slate-400 transition-opacity group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-200 ${
                  compact ? 'text-[13px]' : 'text-sm'
                }`}
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
                className={`ui-btn-ghost !p-0 cursor-grab rounded-full text-slate-400 transition-opacity group-hover:text-slate-600 active:cursor-grabbing dark:text-slate-500 dark:group-hover:text-slate-200 ${
                  compact ? '!h-6 !w-6 text-[11px]' : '!h-7 !w-7'
                }`}
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
              className={`rounded-full font-medium text-indigo-600 transition-colors hover:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-400/10 ${
                compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
              }`}
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
