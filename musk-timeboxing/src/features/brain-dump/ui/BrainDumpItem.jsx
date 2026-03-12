import { useEffect, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { BRAIN_DUMP_PRIORITY_LABELS } from '../../../entities/planner'
import { Button } from '../../../shared/ui'
import { createBrainDumpDragPayload } from '../../planner-dnd/lib/payloads'

const REMOVE_ANIMATION_MS = 220
const PRIORITY_SEGMENT_CLASSES = [
  'bg-sky-400/80 dark:bg-sky-400/90',
  'bg-cyan-400/85 dark:bg-cyan-400/95',
  'bg-amber-400/90 dark:bg-amber-400/95',
  'bg-gradient-to-r from-amber-400 to-orange-500',
]

function PriorityBattery({ priority = 0, onClick = () => {}, disabled = false, itemId, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`중요도 ${label} (${priority}/4)`}
      title={`중요도 ${label}`}
      data-testid={`brain-dump-priority-${itemId}`}
      className={`shrink-0 rounded-xl p-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        priority > 0
          ? 'bg-slate-100 shadow-sm hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-700/80'
          : 'bg-slate-100/80 hover:bg-slate-50 dark:bg-slate-800/70 dark:hover:bg-slate-700/70'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5'}`}
    >
      <span className="flex h-5 w-9 items-center gap-px rounded-lg bg-slate-200/90 px-1 shadow-inner dark:bg-slate-900/90">
        {PRIORITY_SEGMENT_CLASSES.map((className, index) => (
          <span
            key={index}
            className={`h-2.5 flex-1 rounded-full transition-all ${
              index < priority ? className : 'bg-slate-300/80 dark:bg-slate-700/80'
            }`}
          />
        ))}
      </span>
    </button>
  )
}

function BrainDumpItem({ item, onRemove, onCyclePriority, onSendToBigThree }) {
  const [isRemoving, setIsRemoving] = useState(false)
  const removeTimerRef = useRef(null)
  const priority = Number(item.priority) || 0
  const priorityLabel = BRAIN_DUMP_PRIORITY_LABELS[priority] || BRAIN_DUMP_PRIORITY_LABELS[0]

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `brain-dump-${item.id}`,
    data: createBrainDumpDragPayload(item),
  })

  useEffect(() => {
    return () => {
      if (removeTimerRef.current) {
        window.clearTimeout(removeTimerRef.current)
      }
    }
  }, [])

  const handleRemove = () => {
    if (isRemoving) {
      return
    }

    setIsRemoving(true)
    removeTimerRef.current = window.setTimeout(() => {
      onRemove(item.id)
    }, REMOVE_ANIMATION_MS)
  }

  return (
    <div
      data-removing={isRemoving ? 'true' : 'false'}
      data-testid={`brain-dump-item-${item.id}`}
      data-priority={priority}
      className={`group rounded-xl bg-slate-100/90 p-3.5 shadow-none transition-all duration-200 ease-out hover:bg-slate-50 dark:bg-slate-900/85 dark:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)] dark:hover:bg-slate-800/85 ${
        isDragging ? 'opacity-50' : ''
      } ${isRemoving ? 'pointer-events-none translate-x-6 opacity-0' : 'translate-x-0 opacity-100'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 items-center pt-0.5">
          <PriorityBattery
            priority={priority}
            itemId={item.id}
            label={priorityLabel}
            disabled={isRemoving}
            onClick={() => onCyclePriority(item.id)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <button
            ref={setNodeRef}
            type="button"
            disabled={isRemoving}
            className="w-full cursor-grab rounded-xl px-1.5 py-1 text-left text-sm leading-5 active:cursor-grabbing hover:bg-slate-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/65"
            {...listeners}
            {...attributes}
            title={item.title}
          >
            <span className="block overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {item.title}
            </span>
          </button>
        </div>

        <div className="flex translate-x-1 items-center gap-1 opacity-0 pointer-events-none transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
          <Button
            onClick={() => onSendToBigThree(item.id)}
            disabled={isRemoving}
            className="px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400"
            aria-label="빅3로 보내기"
          >
            빅3
          </Button>
          <Button
            onClick={handleRemove}
            disabled={isRemoving}
            className="px-1.5 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400"
            aria-label="삭제"
          >
            ✕
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BrainDumpItem
