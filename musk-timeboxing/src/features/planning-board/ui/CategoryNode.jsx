import { useDroppable } from '@dnd-kit/core'

function CategoryNode({
  laneId,
  label,
  color,
  count,
  isEmpty = false,
  isArmed = false,
  isActive = false,
  compact = false,
  onClick = () => {},
}) {
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
      aria-pressed={isActive}
      className={`relative flex flex-col items-center justify-center rounded-full border border-dashed bg-white/70 px-3 text-center shadow-sm transition-all dark:bg-slate-900/80 ${
        compact ? 'h-20 w-20' : 'mx-auto h-24 w-24'
      } ${
        isOver || isArmed || isActive
          ? 'scale-[1.03] border-indigo-400 shadow-lg'
          : 'border-slate-300/80 dark:border-slate-700/80'
      } ${isEmpty ? 'opacity-90' : ''} ${isArmed || isActive ? 'cursor-pointer' : ''}`}
      style={{
        boxShadow: isOver || isArmed || isActive ? `0 0 0 3px ${color}33` : undefined,
      }}
    >
      <span
        className={`rounded-full ${compact ? 'mb-1.5 h-2.5 w-2.5' : 'mb-2 h-3 w-3'}`}
        style={{ backgroundColor: color }}
      />
      <span className={`line-clamp-2 font-semibold text-slate-700 dark:text-slate-100 ${compact ? 'text-[11px] leading-4' : 'text-xs'}`}>
        {label}
      </span>
      <span className={`text-slate-500 dark:text-slate-400 ${compact ? 'mt-0.5 text-[10px]' : 'mt-1 text-[11px]'}`}>{count}개</span>
    </div>
  )
}

export default CategoryNode
