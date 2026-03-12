import { useEffect, useMemo, useState } from 'react'
import { getCategoryColor, getCategoryLabel } from '../../../entities/planner'
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
  const [nativeDraggingCardId, setNativeDraggingCardId] = useState(null)
  const selectedCardId = data.stackCanvasState?.selectedCardId ?? null
  const selectedBigThreeId = data.stackCanvasState?.selectedBigThreeId ?? null
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
  const selectedBigThreeItem = useMemo(
    () => bigThree.find((item) => item.id === selectedBigThreeId) || null,
    [bigThree, selectedBigThreeId],
  )
  const selectedBigThreeSourceCard = useMemo(
    () =>
      selectedBigThreeItem?.sourceId
        ? brainDumpItems.find((item) => item.id === selectedBigThreeItem.sourceId) || null
        : null,
    [brainDumpItems, selectedBigThreeItem],
  )
  const selectedCategory = selectedCard?.categoryId
    ? categories.find((category) => category.id === selectedCard.categoryId) || null
    : null
  const selectedDurationMinutes = selectedCards.reduce(
    (sum, item) => sum + (item.estimatedSlots || 1) * 30,
    0,
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
      <div className="rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/35 dark:text-slate-300">
        메인 영역을 하나의 작업 화면으로 단순화했습니다. 캔버스에서 카드를 만들고 정리한 뒤 왼쪽 Big3 rail에서 핵심 3개를 고르고, 오른쪽 타임라인 rail에서 바로 일정으로 배치합니다.
      </div>

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
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
            ) : selectedBigThreeItem && !selectedBigThreeSourceCard ? (
              <div className="space-y-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Big3 직접 입력 선택됨
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-1 font-medium text-indigo-700 dark:text-indigo-300">
                    기본 30분 배치
                  </span>
                  <span>우측 rail 슬롯을 누르면 바로 일정으로 들어갑니다.</span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {selectedBigThreeItem.content}
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
                  {selectedBigThreeItem ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-1 font-medium text-amber-700 dark:text-amber-300">
                      Big3 확정
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              '캔버스 카드 또는 Big3 슬롯을 선택하면 이 rail에서 바로 시간표 슬롯에 넣을 수 있습니다.'
            )}
          </div>

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
