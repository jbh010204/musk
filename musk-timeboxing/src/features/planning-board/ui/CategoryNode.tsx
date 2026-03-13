import { useDroppable } from '@dnd-kit/core'
import { getCategoryNodePresentation } from '../lib/categoryNodePresentation'

interface CategoryNodeProps {
  laneId: string
  label: string
  color: string
  count: number
  isEmpty?: boolean
  isArmed?: boolean
  isActive?: boolean
  compact?: boolean
  onClick?: (laneId: string) => void
}

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
}: CategoryNodeProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `node:${laneId}`,
    data: {
      type: 'BOARD_NODE',
      laneId,
    },
  })
  const presentation = getCategoryNodePresentation({
    color,
    count,
    isOver,
    isArmed,
    isActive,
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
        compact ? 'h-[5.5rem] w-[5.5rem]' : 'mx-auto h-24 w-24'
      } ${presentation.className} ${isEmpty ? 'opacity-90' : ''} ${isArmed || isActive ? 'cursor-pointer' : ''}`}
      style={presentation.style}
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
