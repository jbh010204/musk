import { useDraggable } from '@dnd-kit/core'

function BrainDumpItem({ item, onRemove, onSendToBigThree }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `brain-dump-${item.id}`,
    data: {
      type: 'BRAIN_DUMP',
      id: item.id,
      content: item.content,
    },
  })

  return (
    <div
      className={`ui-panel-subtle p-2 transition-colors hover:bg-gray-700/70 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          ref={setNodeRef}
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
            className="ui-btn-secondary px-2 py-1 text-xs"
          >
            빅3
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
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
