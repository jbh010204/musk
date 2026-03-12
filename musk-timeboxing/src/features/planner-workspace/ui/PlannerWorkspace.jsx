import { useEffect, useMemo } from 'react'
import { UNCATEGORIZED_BOARD_LANE } from '../../../entities/planner'
import PlanningCanvas from '../../planning-canvas'
import ScheduleComposer from '../../schedule-composer'
import WorkspaceBigThreeRail from './WorkspaceBigThreeRail'

function PlannerWorkspace({
  currentDate,
  data,
  categories,
  brainDumpItems,
  bigThree = [],
  addBoardCard,
  addBigThreeItem,
  removeBigThreeItem,
  updateBrainDumpItem,
  applyBrainDumpBoardLayout,
  updateStackCanvasState,
  onOpenCategoryManager,
  onSendCardsToBigThree,
  onScheduleBoardCard,
  onScheduleBoardCards,
  onScheduleBigThreeItem,
  onJumpToDay,
}) {
  const selectedCardId = data.stackCanvasState?.selectedCardId ?? null
  const selectedBigThreeId = data.stackCanvasState?.selectedBigThreeId ?? null
  const selectedCardIds = useMemo(
    () => data.stackCanvasState?.selectedCardIds ?? (selectedCardId ? [selectedCardId] : []),
    [data.stackCanvasState?.selectedCardIds, selectedCardId],
  )
  const selectedBigThreeItem = useMemo(
    () => bigThree.find((item) => item.id === selectedBigThreeId) || null,
    [bigThree, selectedBigThreeId],
  )
  useEffect(() => {
    if (selectedBigThreeId && !bigThree.some((item) => item.id === selectedBigThreeId)) {
      updateStackCanvasState({ selectedBigThreeId: null })
    }
  }, [bigThree, selectedBigThreeId, updateStackCanvasState])

  const syncSelection = (nextIds, preferredId = null, nextBigThreeId = null) => {
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
      selectedBigThreeId: nextBigThreeId,
      focusedLaneId: nextCard?.categoryId || UNCATEGORIZED_BOARD_LANE,
    })
  }

  const handleSelectCard = (nextId) => {
    syncSelection(nextId ? [nextId] : [], nextId, null)
  }

  const handleSelectCards = (nextIds) => {
    syncSelection(nextIds, nextIds.at(-1) ?? null, null)
  }

  const handleSelectBigThree = (slot) => {
    if (!slot) {
      updateStackCanvasState({ selectedBigThreeId: null })
      return
    }

    const sourceCard = slot.sourceId
      ? brainDumpItems.find((item) => item.id === slot.sourceId) || null
      : null

    if (sourceCard) {
      syncSelection([slot.sourceId], slot.sourceId, slot.id)
      return
    }

    updateStackCanvasState({
      selectedCardId: null,
      selectedCardIds: [],
      selectedBigThreeId: slot.id,
    })
  }

  return (
    <section data-testid="planner-workspace-view" className="space-y-4">
      <WorkspaceBigThreeRail
        bigThree={bigThree}
        brainDumpItems={brainDumpItems}
        selectedCardId={selectedCardId}
        selectedCardIds={selectedCardIds}
        selectedBigThreeId={selectedBigThreeId}
        onAddBigThreeItem={addBigThreeItem}
        onRemoveBigThreeItem={(slotId) => {
          removeBigThreeItem(slotId)
          if (selectedBigThreeId === slotId) {
            updateStackCanvasState({ selectedBigThreeId: null })
          }
        }}
        onSelectBigThree={handleSelectBigThree}
        onSendSelectedCardsToBigThree={onSendCardsToBigThree}
      />

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
          embedded
        />

        <ScheduleComposer
          items={brainDumpItems}
          categories={categories}
          timeBoxes={data.timeBoxes}
          onScheduleCard={onScheduleBoardCard}
          onScheduleCards={onScheduleBoardCards}
          onScheduleBigThreeItem={onScheduleBigThreeItem}
          onJumpToDay={onJumpToDay}
          onJumpToBoard={() => {}}
          selectedCardId={selectedCardId}
          selectedCardIds={selectedCardIds}
          selectedBigThreeItem={selectedBigThreeItem}
          onSelectCard={handleSelectCard}
          onSelectCards={handleSelectCards}
          onSelectBigThree={(nextId) => {
            if (!nextId) {
              updateStackCanvasState({ selectedBigThreeId: null })
              return
            }
            const nextSlot = bigThree.find((item) => item.id === nextId) || null
            handleSelectBigThree(nextSlot)
          }}
          hideQueue
          embedded
        />
      </div>
    </section>
  )
}

export default PlannerWorkspace
