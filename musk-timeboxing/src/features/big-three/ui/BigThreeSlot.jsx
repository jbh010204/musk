import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'

function BigThreeSlot({ slot, slotIndex, onAdd, onRemove }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    isDragging,
  } = useDraggable({
    id: `big-three-item-${slot?.id ?? slotIndex}`,
    disabled: !slot,
    data: slot
      ? {
          type: 'BIG_THREE',
          id: slot.id,
          content: slot.content,
          taskId: slot.taskId ?? null,
        }
      : null,
  })

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `big-three-slot-${slotIndex}`,
    disabled: Boolean(slot),
    data: {
      type: 'BIG_THREE_SLOT',
      slotIndex,
    },
  })

  const handleSubmit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setIsEditing(false)
      setDraft('')
      return
    }

    const success = onAdd(trimmed)
    if (success) {
      setIsEditing(false)
      setDraft('')
    }
  }

  return (
    <div
      ref={setDroppableNodeRef}
      className={`p-4 ${
        slot ? 'ui-panel' : 'ui-panel-subtle'
      } ${isOver && !slot ? 'bg-indigo-500/10 ring-2 ring-indigo-400' : ''} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        슬롯 {slotIndex + 1}
      </div>

      {!slot && !isEditing ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label="빅3 빈 슬롯"
          className="w-full rounded-2xl border border-dashed border-slate-300/90 px-3 py-3 text-left text-sm text-slate-400 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/20 dark:text-slate-500 dark:hover:bg-slate-800"
        >
          <span className="inline-flex items-center gap-2">
            <span className="text-lg leading-none text-slate-400/80 dark:text-slate-500/80">＋</span>
            <span className="text-xs font-medium uppercase tracking-wide">핵심 추가</span>
          </span>
        </button>
      ) : null}

      {!slot && isEditing ? (
        <input
          type="text"
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(event) => {
            const nativeComposing = event.nativeEvent?.isComposing || event.keyCode === 229

            if (isComposing || nativeComposing) {
              return
            }

            if (event.key === 'Enter') {
              if (event.repeat) {
                return
              }

              event.preventDefault()
              handleSubmit()
            }
            if (event.key === 'Escape') {
              setIsEditing(false)
              setDraft('')
            }
          }}
          onBlur={() => {
            setIsEditing(false)
            setDraft('')
          }}
          className="ui-input text-sm"
          placeholder="빅3 입력 후 엔터"
        />
      ) : null}

      {slot ? (
        <div className="flex items-start justify-between gap-2">
          <button
            ref={setDraggableNodeRef}
            type="button"
            className="min-w-0 flex-1 cursor-grab truncate rounded-xl px-2 py-1.5 text-left text-sm active:cursor-grabbing hover:bg-slate-50 dark:hover:bg-slate-800"
            {...listeners}
            {...attributes}
            title={slot.content}
          >
            {slot.content}
          </button>
          <button
            type="button"
            onClick={() => onRemove(slot.id)}
            className="ui-btn-secondary px-2 py-1 text-[11px]"
            aria-label="빅3 삭제"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default BigThreeSlot
