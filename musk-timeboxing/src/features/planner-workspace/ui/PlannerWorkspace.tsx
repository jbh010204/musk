import { useEffect, useMemo, useState, type ComponentType, type CSSProperties } from 'react'
import {
  createClearedStackCanvasSelectionPatch,
  createStackCanvasBigThreeSelectionPatch,
  createStackCanvasCardSelectionPatch,
  resolveStackCanvasSelectedCardIds,
} from '../../../entities/planner'
import type {
  BigThreeItem,
  CategoryViewModel,
  DeadlineRecord,
  PlannerDay,
  PlannerRunSession,
  TaskCard,
} from '../../../entities/planner/model/types'
import { Card } from '../../../shared/ui'
import PlanningCanvas from '../../planning-canvas'
import TimelineRailSurface from '../../timeline/ui/TimelineRailSurface'
import { WORKSPACE_LAYOUT } from '../lib/workspaceLayout'
import WorkspaceBigThreeRail from './WorkspaceBigThreeRail'

const PlanningCanvasCompat = PlanningCanvas as unknown as ComponentType<Record<string, unknown>>

interface PlannerWorkspaceProps {
  currentDate: string
  data: PlannerDay
  categories: CategoryViewModel[]
  taskCards: TaskCard[]
  deadlines?: DeadlineRecord[]
  bigThree?: BigThreeItem[]
  addBoardCard: (...args: unknown[]) => boolean
  addBigThreeItem: (content: string) => boolean
  removeBigThreeItem: (slotId: string) => void
  updateTaskCard: (...args: unknown[]) => void
  applyTaskCardBoardLayout: (...args: unknown[]) => void
  updateStackCanvasState: (patch: Record<string, unknown>) => void
  onOpenCategoryManager: () => void
  onSendCardsToBigThree: (cardIds: string[]) => number
  onScheduleBoardCard: (cardId: string, startSlot: number) => boolean
  onScheduleBoardCards: (cardIds: string[], startSlot: number) => boolean
  onScheduleSelectedCardsToFirstOpen: (cardIds: string[]) => boolean
  onScheduleBigThreeItem: (bigThreeItemId: string, startSlot: number) => boolean
  onCreateManualTimeBox: (payload: {
    content: string
    startSlot: number
    durationSlots: number
  }) => boolean
  onResizeTimeBox: ((id: string, endSlot: number) => void) | null
  updateTimeBox: (id: string, patch: Record<string, unknown>) => void
  removeTimeBox: (id: string) => void
  onDuplicateTimeBox: (id: string) => boolean
  onTimerStart: (id: string) => void
  onTimerPause: (id: string) => void
  onTimerComplete: (id: string) => void
  onJumpToDay: () => void
  slotHeight?: number
  timelineScale?: '15' | '30'
  onTimelineScaleChange?: (scale: '15' | '30') => void
  runSession?: PlannerRunSession
  activeRunTimeBoxId?: string | null
}

function PlannerWorkspace({
  currentDate,
  data,
  categories,
  taskCards,
  deadlines = [],
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
  slotHeight = WORKSPACE_LAYOUT.composerSlotHeightPx,
  timelineScale = '30',
  onTimelineScaleChange = () => {},
  runSession = { mode: 'IDLE', activeTimeBoxId: null },
  activeRunTimeBoxId = null,
}: PlannerWorkspaceProps) {
  const [nativeDraggingCardId, setNativeDraggingCardId] = useState<string | null>(null)
  const selectedCardId =
    typeof data.stackCanvasState?.selectedCardId === 'string' ? data.stackCanvasState.selectedCardId : null
  const selectedBigThreeId =
    typeof data.stackCanvasState?.selectedBigThreeId === 'string'
      ? data.stackCanvasState.selectedBigThreeId
      : null
  const rawSelectedCardIds = Array.isArray(data.stackCanvasState?.selectedCardIds)
    ? data.stackCanvasState.selectedCardIds.filter((item): item is string => typeof item === 'string')
    : []
  const selectedCardIds = useMemo(
    () => resolveStackCanvasSelectedCardIds(selectedCardId, rawSelectedCardIds),
    [rawSelectedCardIds, selectedCardId],
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

  const syncSelection = (
    nextIds: string[],
    preferredId: string | null = null,
    nextBigThreeId: string | null = null,
  ) => {
    updateStackCanvasState(
      createStackCanvasCardSelectionPatch(taskCards, nextIds, preferredId, nextBigThreeId),
    )
  }

  const handleSelectCard = (nextId: string | null) => {
    syncSelection(nextId ? [nextId] : [], nextId, null)
  }

  const handleSelectCards = (nextIds: string[]) => {
    syncSelection(nextIds, nextIds[nextIds.length - 1] ?? null, null)
  }

  const handleSelectBigThree = (slot: BigThreeItem | null) => {
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
      <Card className="overflow-hidden p-0 shadow-sm" data-testid="workspace-shell">
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
          style={{ '--workspace-timeline-rail': WORKSPACE_LAYOUT.timelineRailWidth } as CSSProperties}
        >
          <div className="min-w-0 p-4 xl:p-5">
            <PlanningCanvasCompat
              key={`${currentDate}-workspace`}
              currentDate={currentDate}
              stackCanvasState={data.stackCanvasState}
              taskCards={taskCards}
              categories={categories}
              deadlines={deadlines}
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
              onScheduleDragStart={(item: { id: string }) => setNativeDraggingCardId(item.id)}
              onScheduleDragEnd={() => setNativeDraggingCardId(null)}
              embedded
            />
          </div>

          <aside
            className="min-w-0 border-t border-slate-200/70 bg-transparent p-4 dark:border-slate-800/70 xl:border-l xl:border-t-0 xl:p-5"
            data-testid="workspace-timeline-rail"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  오늘 타임라인
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
                    슬롯 클릭으로 바로 추가
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-slate-100/90 p-1 dark:bg-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onTimelineScaleChange('30')}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      timelineScale === '30'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                    }`}
                  >
                    30분
                  </button>
                  <button
                    type="button"
                    onClick={() => onTimelineScaleChange('15')}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      timelineScale === '15'
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                    }`}
                  >
                    15분
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onJumpToDay}
                  className="rounded-xl px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  일간 보기
                </button>
              </div>
            </div>

            <TimelineRailSurface
              containerTestId="workspace-timeline-surface"
              timeBoxes={data.timeBoxes}
              categories={categories}
              slotHeight={slotHeight}
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
              runMode={runSession.mode}
              activeRunTimeBoxId={activeRunTimeBoxId}
              nativeDraggingCardId={nativeDraggingCardId}
              onNativeDragEnd={() => setNativeDraggingCardId(null)}
              emptyState={
                <div className="rounded-2xl bg-slate-100/85 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                  {selectedBigThreeItem
                    ? '원하는 시간 슬롯을 눌러 배치'
                    : selectedCardIds.length > 0
                      ? `${selectedCardIds.length}개 선택됨 · 슬롯 클릭으로 바로 배치`
                      : '카드를 끌어 놓거나 빈 슬롯을 눌러 일정 만들기'}
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
