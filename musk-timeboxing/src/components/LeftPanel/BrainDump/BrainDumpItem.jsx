import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function BrainDumpItem({ item, onRemove, onSendToBigThree }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `brain-dump-${item.id}`,
    data: {
      type: 'BRAIN_DUMP',
      id: item.id,
      content: item.content,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded p-2 hover:bg-gray-700 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 cursor-grab truncate text-left active:cursor-grabbing"
          {...listeners}
          {...attributes}
          title={item.content}
        >
          {item.content}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSendToBigThree(item.id)}
            className="rounded bg-gray-600 px-2 py-1 text-xs hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            빅3
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
