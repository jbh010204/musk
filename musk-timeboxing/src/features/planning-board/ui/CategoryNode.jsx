import { useDroppable } from '@dnd-kit/core'

function CategoryNode({ laneId, label, color, count, isEmpty = false, isArmed = false, onClick = () => {} }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `node:${laneId}`,
    data: {
      type: 'BOARD_NODE',
      laneId,
    },
  })

  return (
    <div
      ref={setNodeRef}
      data-testid={`planning-board-node-${laneId}`}
      role="button"
      tabIndex={0}
      onClick={() => onClick(laneId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(laneId)
        }
      }}
      className={`relative mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border border-dashed bg-white/70 px-3 text-center shadow-sm transition-all dark:bg-slate-900/80 ${
        isOver || isArmed
          ? 'scale-[1.03] border-indigo-400 shadow-lg'
          : 'border-slate-300/80 dark:border-slate-700/80'
      } ${isEmpty ? 'opacity-90' : ''} ${isArmed ? 'cursor-pointer' : ''}`}
      style={{
        boxShadow: isOver || isArmed ? `0 0 0 3px ${color}33` : undefined,
      }}
    >
      <span
        className="mb-2 h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="line-clamp-2 text-xs font-semibold text-slate-700 dark:text-slate-100">
        {label}
      </span>
      <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{count}개</span>
    </div>
  )
}

export default CategoryNode
