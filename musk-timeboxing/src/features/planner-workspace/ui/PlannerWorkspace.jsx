import { useEffect, useMemo, useState } from 'react'
import { UNCATEGORIZED_BOARD_LANE } from '../../../entities/planner'
import { Card } from '../../../shared/ui'
import PlanningCanvas from '../../planning-canvas'
import TimelineRailSurface from '../../timeline/ui/TimelineRailSurface'
import { WORKSPACE_LAYOUT } from '../lib/workspaceLayout'
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
  onScheduleSelectedCardsToFirstOpen,
  onScheduleBigThreeItem,
  onCreateManualTimeBox,
  onResizeTimeBox,
  updateTimeBox,
  removeTimeBox,
  onDuplicateTimeBox,
  onTimerStart,
  onTimerPause,
  onTimerComplete,
  onJumpToDay,
}) {
  const [nativeDraggingCardId, setNativeDraggingCardId] = useState(null)
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

  const handleClearSelections = () => {
    updateStackCanvasState({
      selectedCardId: null,
      selectedCardIds: [],
      selectedBigThreeId: null,
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

      <div
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,var(--workspace-timeline-rail))]"
        style={{ '--workspace-timeline-rail': WORKSPACE_LAYOUT.timelineRailWidth }}
      >
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
          onSendSelectedCardsToBigThree={onSendCardsToBigThree}
          onScheduleSelectedCardsToFirstOpen={onScheduleSelectedCardsToFirstOpen}
          scheduleDraggable
          onScheduleDragStart={(item) => setNativeDraggingCardId(item.id)}
          onScheduleDragEnd={() => setNativeDraggingCardId(null)}
          embedded
        />

        <Card className="p-4" data-testid="workspace-timeline-rail">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Timeline Rail
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                선택한 카드나 Big3를 바로 시간표에 넣습니다.
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                선택된 항목이 없으면 슬롯을 눌러 바로 일정을 만듭니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onJumpToDay}
              className="rounded-xl px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              일간 전체 보기
            </button>
          </div>

          <TimelineRailSurface
            containerTestId="workspace-timeline-surface"
            timeBoxes={data.timeBoxes}
            categories={categories}
            slotHeight={WORKSPACE_LAYOUT.composerSlotHeightPx}
            labelWidth={WORKSPACE_LAYOUT.composerLabelWidthPx}
            slotTestIdPrefix="workspace-slot"
            blockTestIdPrefix="workspace-timeline-block"
            selectedCardId={selectedCardId}
            selectedCardIds={selectedCardIds}
            selectedBigThreeItem={selectedBigThreeItem}
            onClearSelections={handleClearSelections}
            onScheduleBoardCard={onScheduleBoardCard}
            onScheduleBoardCards={onScheduleBoardCards}
            onScheduleBigThreeItem={onScheduleBigThreeItem}
            onCreateManualTimeBox={onCreateManualTimeBox}
            onResizeTimeBox={onResizeTimeBox}
            updateTimeBox={updateTimeBox}
            removeTimeBox={removeTimeBox}
            onDuplicateTimeBox={onDuplicateTimeBox}
            onTimerStart={onTimerStart}
            onTimerPause={onTimerPause}
            onTimerComplete={onTimerComplete}
            nativeDraggingCardId={nativeDraggingCardId}
            onNativeDragEnd={() => setNativeDraggingCardId(null)}
            emptyState={
              <div className="rounded-2xl bg-slate-50/80 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                {selectedBigThreeItem
                  ? '선택한 Big3를 원하는 시간 슬롯에 배치하세요.'
                  : selectedCardIds.length > 0
                    ? `${selectedCardIds.length}개 선택됨 · 슬롯 클릭으로 바로 배치할 수 있습니다.`
                    : '카드를 선택하거나 빈 슬롯을 눌러 바로 일정을 만드세요.'}
              </div>
            }
          />
        </Card>
      </div>
    </section>
  )
}

export default PlannerWorkspace
