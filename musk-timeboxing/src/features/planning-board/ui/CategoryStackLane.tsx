import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ReactNode } from 'react'
import type { TaskCard } from '../../../entities/planner/model/types'
import BoardCard from './BoardCard'
import CategoryNode from './CategoryNode'

interface LaneViewModel {
  id: string
  label: string
  color: string
  items: TaskCard[]
}

interface CategoryStackLaneProps {
  lane: LaneViewModel
  selectedCardId?: string | null
  selectedCardIds?: string[]
  showNode?: boolean
  compactNode?: boolean
  isNodeActive?: boolean
  emptyMessage?: string
  onEditCard?: (item: TaskCard) => void
  onSelectCard?: (item: TaskCard) => void
  onToggleCardSelect?: (item: TaskCard) => void
  onSelectNode?: (laneId: string) => void
  scheduleDraggable?: boolean
  onScheduleDragStart?: (item: TaskCard) => void
  onScheduleDragEnd?: (item: TaskCard) => void
  headerActions?: ReactNode
  leadingContent?: ReactNode
  collapsed?: boolean
  collapsedMessage?: string
  compactSurface?: boolean
}

function CategoryStackLane({
  lane,
  selectedCardId = null,
  selectedCardIds = [],
  showNode = true,
  compactNode = false,
  isNodeActive = false,
  emptyMessage = '아직 카드가 없습니다.',
  onEditCard = () => {},
  onSelectCard = () => {},
  onToggleCardSelect = () => {},
  onSelectNode = () => {},
  scheduleDraggable = false,
  onScheduleDragStart = () => {},
  onScheduleDragEnd = () => {},
  headerActions = null,
  leadingContent = null,
  collapsed = false,
  collapsedMessage = '접힌 상태입니다.',
  compactSurface = false,
}: CategoryStackLaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane:${lane.id}`,
    data: {
      type: 'BOARD_LANE',
      laneId: lane.id,
    },
  })

  return (
    <section
      data-testid={`planning-board-lane-${lane.id}`}
      className={`rounded-3xl ${compactSurface ? 'p-2.5' : 'p-4'} ${
        compactSurface
          ? 'bg-white/40 dark:bg-slate-950/20'
          : 'bg-white/45 shadow-sm backdrop-blur-sm dark:bg-slate-950/35'
      }`}
    >
      {showNode ? (
        <CategoryNode
          laneId={lane.id}
          label={lane.label}
          color={lane.color}
          count={lane.items.length}
          isEmpty={lane.items.length === 0}
          isArmed={Boolean(selectedCardId) || selectedCardIds.length > 0}
          isActive={isNodeActive}
          compact={compactNode}
          onClick={onSelectNode}
        />
      ) : null}

      <div
        ref={setNodeRef}
        className={`${showNode ? 'mt-5' : ''} ${compactSurface ? 'min-h-[180px]' : 'min-h-[220px]'} rounded-2xl border border-dashed ${
          compactSurface ? 'p-2' : 'p-3'
        } transition-all ${
          isOver
            ? 'border-indigo-400 bg-indigo-500/6 shadow-[0_0_0_1px_rgba(99,102,241,0.12)]'
            : compactSurface
              ? 'border-slate-200/70 bg-white/70 dark:border-slate-800/70 dark:bg-slate-950/42'
              : 'border-slate-300/70 bg-slate-50/70 dark:border-slate-700/70 dark:bg-slate-900/45'
        }`}
      >
        <div className={`mb-3 ${compactSurface ? 'space-y-2.5' : 'space-y-3'}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`mt-0.5 shrink-0 rounded-full ${compactSurface ? 'h-8 w-1.5' : 'h-10 w-2'} ${
                  isNodeActive ? 'opacity-100' : 'opacity-70'
                }`}
                style={{ backgroundColor: lane.color }}
              />
              <div className="min-w-0">
                <p
                  className={`font-semibold text-slate-900 dark:text-slate-100 ${
                    compactSurface ? 'text-base leading-6' : 'text-sm'
                  }`}
                >
                  {lane.label}
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 rounded-xl px-2 py-0.5 text-[11px] ${
                isNodeActive
                  ? 'bg-white/88 text-slate-700 dark:bg-slate-900/88 dark:text-slate-100'
                  : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300'
              }`}
            >
                {lane.items.length}개
              </span>
            </div>

            {headerActions ? <div className="min-w-0">{headerActions}</div> : null}
          </div>

        <SortableContext items={lane.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className={compactSurface ? 'space-y-2.5' : 'space-y-3'}>
            {leadingContent}
            {collapsed ? (
              <div
                className={`rounded-2xl px-3 text-center text-sm text-slate-500 dark:text-slate-400 ${
                  compactSurface ? 'py-[1.125rem]' : 'py-6'
                }`}
              >
                {collapsedMessage}
              </div>
            ) : lane.items.length === 0 ? (
              <div
                className={`rounded-2xl px-3 text-center text-sm text-slate-500 dark:text-slate-400 ${
                  compactSurface ? 'py-6' : 'py-8'
                }`}
              >
                {emptyMessage}
              </div>
            ) : (
              lane.items.map((item) => (
                <BoardCard
                  key={item.id}
                  item={item}
                  color={lane.color}
                  onEdit={onEditCard}
                  onSelect={onSelectCard}
                  onToggleSelect={onToggleCardSelect}
                  isSelected={selectedCardId === item.id}
                  isMultiSelected={selectedCardIds.includes(item.id)}
                  compact={compactSurface}
                  scheduleDraggable={scheduleDraggable}
                  onScheduleDragStart={onScheduleDragStart}
                  onScheduleDragEnd={onScheduleDragEnd}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </section>
  )
}

export default CategoryStackLane
