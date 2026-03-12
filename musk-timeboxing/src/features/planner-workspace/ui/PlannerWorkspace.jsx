import { useEffect, useMemo, useState } from 'react'
import {
  createClearedStackCanvasSelectionPatch,
  createStackCanvasBigThreeSelectionPatch,
  createStackCanvasCardSelectionPatch,
  resolveStackCanvasSelectedCardIds,
} from '../../../entities/planner'
import { Card } from '../../../shared/ui'
import PlanningCanvas from '../../planning-canvas'
import TimelineRailSurface from '../../timeline/ui/TimelineRailSurface'
import { WORKSPACE_LAYOUT } from '../lib/workspaceLayout'
import WorkspaceBigThreeRail from './WorkspaceBigThreeRail'

function PlannerWorkspace({
  currentDate,
  data,
  categories,
  taskCards,
  bigThree = [],
  addBoardCard,
  addBigThreeItem,
  removeBigThreeItem,
  updateTaskCard,
  applyTaskCardBoardLayout,
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
    () => resolveStackCanvasSelectedCardIds(selectedCardId, data.stackCanvasState?.selectedCardIds ?? []),
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
    updateStackCanvasState(
      createStackCanvasCardSelectionPatch(taskCards, nextIds, preferredId, nextBigThreeId),
    )
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

    updateStackCanvasState(createStackCanvasBigThreeSelectionPatch(taskCards, slot))
  }

  const handleClearSelections = () => {
    updateStackCanvasState(createClearedStackCanvasSelectionPatch())
  }

  return (
    <section data-testid="planner-workspace-view" className="space-y-4">
      <Card className="overflow-hidden p-0" data-testid="workspace-shell">
        <WorkspaceBigThreeRail
          bigThree={bigThree}
          taskCards={taskCards}
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
          className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,var(--workspace-timeline-rail))]"
          style={{ '--workspace-timeline-rail': WORKSPACE_LAYOUT.timelineRailWidth }}
        >
          <div className="min-w-0 p-5">
            <PlanningCanvas
              key={`${currentDate}-workspace`}
              currentDate={currentDate}
              stackCanvasState={data.stackCanvasState}
              taskCards={taskCards}
              categories={categories}
              timeBoxes={data.timeBoxes}
              onUpdateStackCanvasState={updateStackCanvasState}
              onCreateCard={addBoardCard}
              onUpdateCard={updateTaskCard}
              onApplyLayout={applyTaskCardBoardLayout}
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
          </div>

          <aside
            className="min-w-0 border-t border-slate-200/80 bg-slate-50/55 p-4 dark:border-slate-800/80 dark:bg-slate-950/45 xl:border-l xl:border-t-0"
            data-testid="workspace-timeline-rail"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Timeline
                </p>
                {selectedBigThreeItem ? (
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                    Big3 선택됨
                  </span>
                ) : selectedCardIds.length > 0 ? (
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                    {selectedCardIds.length}개 선택됨
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
                    빈 슬롯에서 바로 생성
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onJumpToDay}
                className="rounded-xl px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
                <div className="rounded-2xl bg-white/85 px-4 py-3 text-sm text-slate-500 shadow-sm dark:bg-slate-900/60 dark:text-slate-400">
                  {selectedBigThreeItem
                    ? '원하는 시간 슬롯을 눌러 배치'
                    : selectedCardIds.length > 0
                      ? `${selectedCardIds.length}개 선택됨 · 슬롯 클릭으로 바로 배치`
                      : '빈 슬롯을 눌러 일정 만들기'}
                </div>
              }
            />
          </aside>
        </div>
      </Card>
    </section>
  )
}

export default PlannerWorkspace
