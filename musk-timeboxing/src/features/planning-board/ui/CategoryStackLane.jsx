import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import BoardCard from './BoardCard'
import CategoryNode from './CategoryNode'

function CategoryStackLane({
  lane,
  selectedCardId = null,
  onEditCard = () => {},
  onSelectCard = () => {},
  onSelectNode = () => {},
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
      className="rounded-3xl bg-white/45 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-950/35"
    >
      <CategoryNode
        laneId={lane.id}
        label={lane.label}
        color={lane.color}
        count={lane.items.length}
        isEmpty={lane.items.length === 0}
        isArmed={Boolean(selectedCardId)}
        onClick={onSelectNode}
      />

      <div
        ref={setNodeRef}
        className={`mt-5 min-h-[200px] rounded-2xl border border-dashed p-3 transition-all ${
          isOver ? 'border-indigo-400 bg-indigo-500/5' : 'border-slate-300/70 bg-slate-50/70 dark:border-slate-700/70 dark:bg-slate-900/45'
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Stack
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{lane.label}</p>
          </div>
          <span className="rounded-xl bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
            {lane.items.length}개
          </span>
        </div>

        <SortableContext items={lane.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {lane.items.length === 0 ? (
              <div className="rounded-2xl px-3 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                카드를 이 노드로 드롭하면 여기 쌓입니다.
              </div>
            ) : (
              lane.items.map((item) => (
                <BoardCard
                  key={item.id}
                  item={item}
                  color={lane.color}
                  onEdit={onEditCard}
                  onSelect={onSelectCard}
                  isSelected={selectedCardId === item.id}
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
