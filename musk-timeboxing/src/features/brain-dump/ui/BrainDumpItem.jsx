import { useEffect, useRef, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'

const REMOVE_ANIMATION_MS = 220

function BrainDumpItem({ item, onRemove, onSendToBigThree }) {
  const [isRemoving, setIsRemoving] = useState(false)
  const removeTimerRef = useRef(null)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `brain-dump-${item.id}`,
    data: {
      type: 'BRAIN_DUMP',
      id: item.id,
      content: item.content,
    },
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
      className={`group rounded-2xl bg-slate-100 p-4 shadow-none transition-all duration-200 ease-out hover:bg-slate-50 dark:bg-slate-900/85 dark:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)] dark:hover:bg-slate-800/85 ${
        isDragging ? 'opacity-50' : ''
      } ${isRemoving ? 'pointer-events-none translate-x-6 opacity-0' : 'translate-x-0 opacity-100'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          ref={setNodeRef}
          type="button"
          disabled={isRemoving}
          className="min-w-0 flex-1 cursor-grab truncate rounded-xl px-2 py-1 text-left text-sm active:cursor-grabbing hover:bg-slate-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/65"
          {...listeners}
          {...attributes}
          title={item.content}
        >
          {item.content}
        </button>

        <div className="flex translate-x-1 items-center gap-1.5 opacity-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onSendToBigThree(item.id)}
            disabled={isRemoving}
            className="ui-btn-ghost px-2 py-1 text-xs text-slate-500 dark:text-slate-400"
            aria-label="빅3로 보내기"
          >
            빅3
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="ui-btn-ghost px-1.5 py-1 text-xs text-slate-500 dark:text-slate-400"
            aria-label="삭제"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default BrainDumpItem
