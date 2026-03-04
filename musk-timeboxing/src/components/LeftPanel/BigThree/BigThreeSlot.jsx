import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useCallback, useState } from 'react'

function BigThreeSlot({ slot, slotIndex, onAdd, onRemove }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  const draggable = useDraggable({
    id: `big-three-item-${slot?.id ?? slotIndex}`,
    disabled: !slot,
    data: slot
      ? {
          type: 'BIG_THREE',
          id: slot.id,
          content: slot.content,
        }
      : null,
  })

  const droppable = useDroppable({
    id: `big-three-slot-${slotIndex}`,
    disabled: Boolean(slot),
    data: {
      type: 'BIG_THREE_SLOT',
      slotIndex,
    },
  })

  const setRefs = useCallback(
    (node) => {
      draggable.setNodeRef(node)
      droppable.setNodeRef(node)
    },
    [draggable, droppable],
  )

  const style = {
    transform: CSS.Translate.toString(draggable.transform),
  }

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
      ref={setRefs}
      style={style}
      className={`rounded border p-3 ${
        slot ? 'border-gray-600 bg-gray-800' : 'border-dashed border-gray-600 bg-gray-800/70'
      } ${droppable.isOver && !slot ? 'border-indigo-400 bg-gray-700/60' : ''} ${
        draggable.isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="mb-1 text-xs text-gray-500">슬롯 {slotIndex + 1}</div>

      {!slot && !isEditing ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full rounded px-2 py-1 text-left text-sm text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          — 비어있음 —
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
          className="w-full rounded bg-gray-700 p-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="빅3 입력 후 엔터"
        />
      ) : null}

      {slot ? (
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 cursor-grab truncate text-left text-sm active:cursor-grabbing"
            {...draggable.listeners}
            {...draggable.attributes}
            title={slot.content}
          >
            {slot.content}
          </button>
          <button
            type="button"
            onClick={() => onRemove(slot.id)}
            className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
