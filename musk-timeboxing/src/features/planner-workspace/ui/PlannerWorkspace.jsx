import { useMemo, useState } from 'react'
import { getCategoryColor, getCategoryLabel } from '../../../entities/planner'
import { UNCATEGORIZED_BOARD_LANE } from '../../../entities/planner'
import PlanningCanvas from '../../planning-canvas'
import ScheduleComposer from '../../schedule-composer'

function PlannerWorkspace({
  currentDate,
  data,
  categories,
  brainDumpItems,
  addBoardCard,
  updateBrainDumpItem,
  applyBrainDumpBoardLayout,
  updateStackCanvasState,
  onOpenCategoryManager,
  onScheduleBoardCard,
  onScheduleBoardCards,
  onJumpToDay,
}) {
  const [nativeDraggingCardId, setNativeDraggingCardId] = useState(null)
  const selectedCardId = data.stackCanvasState?.selectedCardId ?? null
  const selectedCardIds = useMemo(
    () => data.stackCanvasState?.selectedCardIds ?? (selectedCardId ? [selectedCardId] : []),
    [data.stackCanvasState?.selectedCardIds, selectedCardId],
  )
  const selectedCard = useMemo(
    () => brainDumpItems.find((item) => item.id === selectedCardId) || null,
    [brainDumpItems, selectedCardId],
  )
  const selectedCards = useMemo(
    () =>
      selectedCardIds
        .map((itemId) => brainDumpItems.find((item) => item.id === itemId) || null)
        .filter(Boolean),
    [brainDumpItems, selectedCardIds],
  )
  const selectedCategory = selectedCard?.categoryId
    ? categories.find((category) => category.id === selectedCard.categoryId) || null
    : null
  const selectedDurationMinutes = selectedCards.reduce(
    (sum, item) => sum + (item.estimatedSlots || 1) * 30,
    0,
  )

  const syncSelection = (nextIds, preferredId = null) => {
    const dedupedIds = [...new Set(nextIds.filter(Boolean))]
    const resolvedSelectedCardId =
      dedupedIds.length === 0
        ? null
        : dedupedIds.includes(preferredId)
          ? preferredId
          : dedupedIds.at(-1) ?? null
    const nextCard = resolvedSelectedCardId
      ? brainDumpItems.find((item) => item.id === resolvedSelectedCardId) || null
      : null

    updateStackCanvasState({
      selectedCardId: resolvedSelectedCardId,
      selectedCardIds: dedupedIds,
      focusedLaneId: nextCard?.categoryId || UNCATEGORIZED_BOARD_LANE,
    })
  }

  const handleSelectCard = (nextId) => {
    syncSelection(nextId ? [nextId] : [], nextId)
  }

  const handleSelectCards = (nextIds) => {
    syncSelection(nextIds, nextIds.at(-1) ?? null)
  }

  return (
    <section data-testid="planner-workspace-view" className="space-y-4">
      <div className="rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/35 dark:text-slate-300">
        메인 영역을 하나의 작업 화면으로 단순화했습니다. 중앙 스택 캔버스에서 카드를 만들고 분류한 뒤, 오른쪽 타임라인 rail에서 선택한 카드를 바로 일정으로 배치합니다.
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <PlanningCanvas
          key={`${currentDate}-workspace`}
          currentDate={currentDate}
          stackCanvasState={data.stackCanvasState}
          brainDumpItems={brainDumpItems}
          categories={categories}
          timeBoxes={data.timeBoxes}
          onUpdateStackCanvasState={updateStackCanvasState}
          onCreateCard={addBoardCard}
          onUpdateCard={updateBrainDumpItem}
          onApplyLayout={applyBrainDumpBoardLayout}
          onOpenCategoryManager={onOpenCategoryManager}
          onOpenComposer={() => {}}
          selectedCardId={selectedCardId}
          selectedCardIds={selectedCardIds}
          onSelectCard={handleSelectCard}
          onSelectCards={handleSelectCards}
          scheduleDraggable
          onScheduleDragStart={(card) => {
            setNativeDraggingCardId(card.id)
            handleSelectCard(card.id)
          }}
          onScheduleDragEnd={() => setNativeDraggingCardId(null)}
          embedded
        />

        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/35 dark:text-slate-300">
            {selectedCards.length > 1 ? (
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  카드 {selectedCards.length}개 선택됨
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-1 font-medium text-indigo-700 dark:text-indigo-300">
                    총 {selectedDurationMinutes}분
                  </span>
                  <span>선택 순서대로 연속 배치됩니다.</span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {selectedCards.map((item) => item.content).join(' · ')}
                </p>
              </div>
            ) : selectedCard ? (
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedCard.content}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-1 font-medium"
                    style={{
                      backgroundColor: `${getCategoryColor(selectedCategory, null)}22`,
                      color: getCategoryColor(selectedCategory, null),
                    }}
                  >
                    #{getCategoryLabel(selectedCategory, null) || '미분류'}
                  </span>
                  <span>{selectedCard.estimatedSlots * 30}분</span>
                  <span>예정 연결 {selectedCard.linkedTimeBoxIds?.length || 0}</span>
                </div>
              </div>
            ) : (
              '캔버스에서 카드를 선택하면 이 rail에서 바로 시간표 슬롯에 넣을 수 있습니다.'
            )}
          </div>

          <ScheduleComposer
            items={brainDumpItems}
            categories={categories}
            timeBoxes={data.timeBoxes}
            onScheduleCard={onScheduleBoardCard}
            onScheduleCards={onScheduleBoardCards}
            onJumpToDay={onJumpToDay}
            onJumpToBoard={() => {}}
            selectedCardId={selectedCardId}
            selectedCardIds={selectedCardIds}
            onSelectCard={handleSelectCard}
            onSelectCards={handleSelectCards}
            hideQueue
            nativeDraggingCardId={nativeDraggingCardId}
            onNativeDragEnd={() => setNativeDraggingCardId(null)}
            embedded
          />
        </div>
      </div>
    </section>
  )
}

export default PlannerWorkspace
