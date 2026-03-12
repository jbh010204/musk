import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import BoardCard from './BoardCard'
import CategoryNode from './CategoryNode'

function CategoryStackLane({
  lane,
  selectedCardId = null,
  selectedCardIds = [],
  showNode = true,
  compactNode = false,
  isNodeActive = false,
  emptyMessage = '카드를 이 노드로 드롭하면 여기 쌓입니다.',
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
}) {
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
      className={`rounded-3xl p-4 ${
        compactSurface
          ? 'bg-slate-50/90 dark:bg-slate-900/40'
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
        className={`${showNode ? 'mt-5' : ''} min-h-[220px] rounded-2xl border border-dashed p-3 transition-all ${
          isOver
            ? 'border-indigo-400 bg-indigo-500/5'
            : compactSurface
              ? 'border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/55'
              : 'border-slate-300/70 bg-slate-50/70 dark:border-slate-700/70 dark:bg-slate-900/45'
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Stack
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{lane.label}</p>
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <span className="rounded-xl bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
              {lane.items.length}개
            </span>
          </div>
        </div>

        <SortableContext items={lane.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {leadingContent}
            {collapsed ? (
              <div className="rounded-2xl px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                {collapsedMessage}
              </div>
            ) : lane.items.length === 0 ? (
              <div className="rounded-2xl px-3 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
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
