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
      className={`group relative overflow-hidden border text-left transition-all dark:bg-slate-900/80 ${
        compact
          ? 'min-h-[5.25rem] min-w-[8.75rem] max-w-[8.75rem] rounded-[1.6rem] px-3 py-3'
          : 'mx-auto min-h-[6.25rem] w-full max-w-[14rem] rounded-[1.75rem] px-4 py-4'
      } ${presentation.className} ${isEmpty ? 'opacity-90' : ''} ${isArmed || isActive ? 'cursor-pointer' : ''}`}
      style={{
        ...presentation.surfaceStyle,
        ...presentation.style,
      }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-0.5 shrink-0 rounded-full ${compact ? 'h-8 w-1.5' : 'h-10 w-2'}`}
          style={presentation.accentStyle}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`min-w-0 truncate font-semibold text-slate-800 dark:text-slate-100 ${
                compact ? 'text-[12px] leading-5' : 'text-sm leading-6'
              }`}
            >
              {label}
            </span>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${presentation.countClassName}`}
              style={presentation.badgeStyle}
            >
              {count}개
            </span>
          </div>

          <p
            className={`mt-1 truncate ${presentation.metaClassName} ${
              compact ? 'text-[11px] leading-4' : 'text-xs leading-5'
            }`}
          >
            {presentation.metaLabel}
          </p>
        </div>
      </div>
    </div>
  )
}

export default CategoryNode
