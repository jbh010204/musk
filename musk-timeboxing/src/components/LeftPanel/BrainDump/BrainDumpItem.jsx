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
      className={`ui-panel-subtle p-4 transition-all duration-200 ease-out hover:bg-slate-50 dark:hover:bg-slate-800 ${
        isDragging ? 'opacity-50' : ''
      } ${isRemoving ? 'pointer-events-none translate-x-6 opacity-0' : 'translate-x-0 opacity-100'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          ref={setNodeRef}
          type="button"
          disabled={isRemoving}
          className="min-w-0 flex-1 cursor-grab truncate rounded-xl px-2 py-1 text-left text-sm active:cursor-grabbing hover:bg-slate-50 disabled:cursor-not-allowed dark:hover:bg-slate-800"
          {...listeners}
          {...attributes}
          title={item.content}
        >
          {item.content}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSendToBigThree(item.id)}
            disabled={isRemoving}
            className="ui-btn-secondary px-2 py-1 text-xs"
          >
            빅3
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="ui-btn-secondary px-2 py-1 text-xs"
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
