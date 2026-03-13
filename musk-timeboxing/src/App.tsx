import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useMemo } from 'react'
import BigThree from './features/big-three'
import BrainDump from './features/brain-dump'
import CategoryManagerModal from './features/category'
import DataTransferModal from './features/data-transfer'
import FloatingActionDock from './features/floating'
import Header from './features/header'
import PatchNotesModal from './features/patch-notes'
import TemplateManagerModal from './features/template'
import Timeline, { RescheduleAssistantModal } from './features/timeline'
import QuickAddModal from './features/timeline/ui/QuickAddModal'
import {
  useCategoryMeta,
  useDailyData,
  usePlannerDayFlow,
  usePlannerMetaActions,
  usePlannerShellState,
  usePlannerTaskActions,
  usePlannerTimeBoxActions,
  useTemplateMeta,
  useToast,
} from './app/hooks'
import {
  buildManagedCategoryViewModels,
  buildPlannerWeekStrip,
  buildMonthCalendarSnapshot,
  buildWeekCalendarSnapshot,
  buildWeeklyPlanningPreview,
  buildWeeklyReport,
  deriveBigThreeProgress,
} from './entities/planner'
import { usePlannerTimelineDnd } from './features/planner-dnd/usePlannerTimelineDnd'
import { PlannerModalLayer } from './app/ui/PlannerModalLayer'
import { PlannerShellLayout } from './app/ui/PlannerShellLayout'

const BASE_SLOT_HEIGHT = 32
const DETAIL_SLOT_HEIGHT = 64
const THEME_DARK = 'dark'
const UNDO_TOAST_MS = 5000

const formatShortDateLabel = (dateStr: string): string =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateStr}T00:00:00`))

function App() {
  const {
    currentDate,
    data,
    lastFocus,
    goNextDay: goNextDayRaw,
    goPrevDay: goPrevDayRaw,
    goToDate: goToDateRaw,
    addTaskCard,
    addBoardCard,
    removeTaskCard,
    restoreTaskCard,
    cycleTaskCardItemPriority,
    updateTaskCard,
    applyTaskCardBoardLayout,
    clearTaskCardCategoryState,
    sendToBigThree,
    sendManyToBigThree,
    fillBigThreeFromTaskCards,
    addBigThreeItem,
    removeBigThreeItem,
    addTimeBox,
    updateTimeBox,
    startTimeBoxTimer,
    pauseTimeBoxTimer,
    completeTimeBoxByTimer,
    removeTimeBox,
    restoreTimeBox,
    clearTimeBoxCategory,
    updateStackCanvasState,
    reloadCurrentDay,
  } = useDailyData()
  const {
    categories: rawCategories,
    addCategory,
    updateCategory,
    removeCategory,
    reloadCategories,
  } = useCategoryMeta()
  const { templates, addTemplate, updateTemplate, removeTemplate, clearTemplateCategory, reloadTemplates } =
    useTemplateMeta()
  const categories = useMemo(
    () =>
      buildManagedCategoryViewModels(rawCategories, {
        taskCards: data.taskCards,
        timeBoxes: data.timeBoxes,
        templates,
      }),
    [data.taskCards, data.timeBoxes, rawCategories, templates],
  )
  const lockedParentIds = useMemo(
    () => categories.filter((category) => !category.canAcceptChildren).map((category) => category.id),
    [categories],
  )

  const { showToast, ToastContainer } = useToast()
  const {
    setTimelineViewMode,
    persistenceStatus,
    theme,
    toggleTheme,
    mobileTab,
    setMobileTab,
    timelineScale,
    setTimelineScale,
    isTimelineFocusMode,
    toggleTimelineFocusMode,
    isCategoryManagerOpen,
    openCategoryManager,
    closeCategoryManager,
    isDataModalOpen,
    openDataModal,
    closeDataModal,
    isPatchNotesOpen,
    openPatchNotes,
    closePatchNotes,
    isTemplateManagerOpen,
    openTemplateManager,
    closeTemplateManager,
    isRescheduleModalOpen,
    openRescheduleModal,
    closeRescheduleModal,
    quickAddContext,
    openQuickAdd,
    closeQuickAdd,
    timelineSlotHeight,
    showDesktopPlanningRail,
    showMobilePlanningTabs,
  } = usePlannerShellState({
    showToast,
    formatDateLabel: formatShortDateLabel,
    baseSlotHeight: BASE_SLOT_HEIGHT,
    detailSlotHeight: DETAIL_SLOT_HEIGHT,
  })
  const {
    sensors,
    activeDragPreview,
    dropPreviewSlot,
    movingTimeBoxPreview,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  } = usePlannerTimelineDnd({
    timeBoxes: data.timeBoxes,
    timelineSlotHeight,
    addTimeBox,
    updateTimeBox,
    sendToBigThree,
    showToast,
  })
  const {
    isTimelineInsightsLoading,
    dailySuggestion,
    setDailySuggestion,
    crossDateRevision,
    bumpCrossDateRevision,
    goNextDay,
    goPrevDay,
    goToDate,
    applySkipSuggestionAction,
    buildReschedulePlan,
    applyReschedulePlan,
    handleImported,
  } = usePlannerDayFlow({
    currentDate,
    data,
    showToast,
    goNextDayRaw,
    goPrevDayRaw,
    goToDateRaw,
    addTimeBox,
    reloadCurrentDay,
    reloadCategories,
    reloadTemplates,
  })
  const {
    handleSendToBigThree,
    handleRemoveTaskCard,
    handleFillBigThreeFromTaskCards,
    handleSendCardsToBigThree,
  } = usePlannerTaskActions({
    taskCards: data.taskCards,
    bigThree: data.bigThree,
    undoToastMs: UNDO_TOAST_MS,
    showToast,
    removeTaskCard,
    restoreTaskCard,
    sendToBigThree,
    sendManyToBigThree,
    fillBigThreeFromTaskCards,
  })
  const {
    handleUpdateTimeBox,
    handleTimerComplete,
    handleRemoveTimeBox,
    handleDuplicateTimeBox,
    createTimeBoxOnDate,
  } = usePlannerTimeBoxActions({
    currentDate,
    data,
    undoToastMs: UNDO_TOAST_MS,
    showToast,
    formatDateLabel: formatShortDateLabel,
    addTimeBox,
    updateTimeBox,
    completeTimeBoxByTimer,
    removeTimeBox,
    restoreTimeBox,
    bumpCrossDateRevision,
  })
  const {
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
  } = usePlannerMetaActions({
    lockedParentIds,
    showToast,
    addCategory,
    updateCategory,
    removeCategory,
    clearTimeBoxCategory,
    clearTaskCardCategoryState,
    clearTemplateCategory,
    addTemplate,
    updateTemplate,
    removeTemplate,
  })

  const weekStrip = buildPlannerWeekStrip({
    currentDate,
    currentDayData: data,
  })
  void crossDateRevision
  const weeklyReport = buildWeeklyReport({
    currentDate,
    currentDayData: data,
  })
  const weeklyPlanningPreview = buildWeeklyPlanningPreview({
    currentDate,
    currentDayData: data,
  })
  const weekCalendar = buildWeekCalendarSnapshot({
    currentDate,
    currentDayData: data,
  })
  const monthCalendar = buildMonthCalendarSnapshot({
    currentDate,
    currentDayData: data,
    categories,
  })
  const bigThreeProgress = useMemo(
    () => deriveBigThreeProgress(data.bigThree, data.timeBoxes),
    [data.bigThree, data.timeBoxes],
  )

  const dumpSection = (
    <BrainDump
      items={data.taskCards}
      bigThreeCount={data.bigThree.length}
      onAdd={addTaskCard}
      onRemove={handleRemoveTaskCard}
      onCyclePriority={cycleTaskCardItemPriority}
      onSendToBigThree={handleSendToBigThree}
      onFillBigThree={handleFillBigThreeFromTaskCards}
    />
  )

  const bigThreeSection = (
    <BigThree
      bigThree={data.bigThree}
      addBigThreeItem={addBigThreeItem}
      removeBigThreeItem={removeBigThreeItem}
    />
  )

  const timelineSection = (
    <Timeline
      data={data}
      currentDate={currentDate}
      categories={categories}
      taskCards={data.taskCards}
      bigThree={data.bigThree}
      templates={templates}
      weeklyReport={weeklyReport}
      weeklyPlanningPreview={weeklyPlanningPreview}
      weekCalendar={weekCalendar}
      monthCalendar={monthCalendar}
      isInsightsLoading={isTimelineInsightsLoading}
      onJumpToDate={goToDate}
      onViewModeChange={setTimelineViewMode}
      initialFocusSlot={lastFocus?.date === currentDate ? lastFocus.slot : null}
      suggestionMessage={dailySuggestion?.forDate === currentDate ? dailySuggestion.message : null}
      suggestionAction={dailySuggestion?.forDate === currentDate ? dailySuggestion.action : null}
      onApplySuggestionAction={applySkipSuggestionAction}
      onDismissSuggestion={() => setDailySuggestion(null)}
      dropPreviewSlot={dropPreviewSlot}
      movingTimeBoxPreview={movingTimeBoxPreview}
      slotHeight={timelineSlotHeight}
      timelineScale={timelineScale}
      onTimelineScaleChange={setTimelineScale}
      focusMode={isTimelineFocusMode}
      onToggleFocusMode={toggleTimelineFocusMode}
      addTimeBox={addTimeBox}
      addBoardCard={addBoardCard}
      addBigThreeItem={addBigThreeItem}
      removeBigThreeItem={removeBigThreeItem}
      onSendCardsToBigThree={handleSendCardsToBigThree}
      updateTaskCard={updateTaskCard}
      applyTaskCardBoardLayout={applyTaskCardBoardLayout}
      updateStackCanvasState={updateStackCanvasState}
      updateTimeBox={handleUpdateTimeBox}
      onTimerStart={startTimeBoxTimer}
      onTimerPause={pauseTimeBoxTimer}
      onTimerComplete={handleTimerComplete}
      removeTimeBox={handleRemoveTimeBox}
      onDuplicateTimeBox={handleDuplicateTimeBox}
      onOpenTemplateManager={openTemplateManager}
      onOpenCategoryManager={openCategoryManager}
      onOpenQuickAdd={(dateStr, options = {}) => openQuickAdd(dateStr, options)}
      onApplyTemplate={(templateId, dateStr = currentDate) =>
        openQuickAdd(dateStr, {
          dateLabel: formatShortDateLabel(dateStr),
          templateId,
        })
      }
      showToast={showToast}
      showDropGuide={
        activeDragPreview?.type === 'BRAIN_DUMP' || activeDragPreview?.type === 'BIG_THREE'
      }
    />
  )

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <PlannerShellLayout
        theme={theme}
        dumpSection={dumpSection}
        bigThreeSection={bigThreeSection}
        timelineSection={timelineSection}
        header={
          <Header
            currentDate={currentDate}
            goNextDay={goNextDay}
            goPrevDay={goPrevDay}
            weekStrip={weekStrip}
            goToDate={goToDate}
            bigThreeProgress={bigThreeProgress}
            theme={theme}
            persistenceStatus={persistenceStatus}
            onOpenReschedule={openRescheduleModal}
            onToggleTheme={toggleTheme}
          />
        }
        toastContainer={<ToastContainer />}
        modalLayer={
          <PlannerModalLayer
            isPatchNotesOpen={isPatchNotesOpen}
            onClosePatchNotes={closePatchNotes}
            isDataModalOpen={isDataModalOpen}
            dataTransfer={{
              currentDate,
              onImported: handleImported,
              showToast,
            }}
            onCloseDataModal={closeDataModal}
            isCategoryManagerOpen={isCategoryManagerOpen}
            categoryManager={{
              categories,
              onAddCategory: handleAddCategory,
              onUpdateCategory: handleUpdateCategory,
              onDeleteCategory: handleDeleteCategory,
            }}
            onCloseCategoryManager={closeCategoryManager}
            isTemplateManagerOpen={isTemplateManagerOpen}
            templateManager={{
              templates,
              categories,
              onAddTemplate: handleAddTemplate,
              onUpdateTemplate: handleUpdateTemplate,
              onDeleteTemplate: handleDeleteTemplate,
            }}
            onCloseTemplateManager={closeTemplateManager}
            quickAddContext={quickAddContext}
            quickAdd={{
              categories,
              templates,
              onSubmit: createTimeBoxOnDate,
            }}
            onCloseQuickAdd={closeQuickAdd}
            isRescheduleModalOpen={isRescheduleModalOpen}
            reschedule={{
              plan: buildReschedulePlan(),
              onApply: (plan) => {
                if (applyReschedulePlan(plan)) {
                  closeRescheduleModal()
                }
              },
            }}
            onCloseRescheduleModal={closeRescheduleModal}
          />
        }
        showDesktopPlanningRail={showDesktopPlanningRail}
        showMobilePlanningTabs={showMobilePlanningTabs}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        onOpenPatchNotes={openPatchNotes}
        onOpenCategoryManager={openCategoryManager}
        onOpenDataModal={openDataModal}
        onOpenTemplateManager={openTemplateManager}
      />
      <DragOverlay>
        {activeDragPreview ? (
          <div className="pointer-events-none max-w-xs rounded-2xl bg-indigo-600/95 px-4 py-3 text-sm text-white shadow-lg">
            {activeDragPreview.content}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App
