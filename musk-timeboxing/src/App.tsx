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
      <div className={`${theme === THEME_DARK ? 'theme-dark dark' : 'theme-light'} h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100`}>
        <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-gray-900">
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

          <div className="hidden min-h-0 flex-1 gap-6 overflow-hidden px-6 pb-6 md:flex">
            {showDesktopPlanningRail ? (
              <aside className="ui-panel-subtle w-80 flex-shrink-0 overflow-y-auto">
                {dumpSection}
                {bigThreeSection}
              </aside>
            ) : null}
            <main className="ui-panel flex-1 overflow-y-auto">{timelineSection}</main>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:hidden">
            {showMobilePlanningTabs ? (
              <>
                {mobileTab === 'dump' ? dumpSection : null}
                {mobileTab === 'big3' ? bigThreeSection : null}
                {mobileTab === 'timeline' ? timelineSection : null}
              </>
            ) : (
              timelineSection
            )}
          </div>

          {showMobilePlanningTabs ? (
            <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 shadow-sm backdrop-blur dark:bg-gray-800/95 md:hidden">
              <div className="grid grid-cols-3">
                <button
                  type="button"
                  onClick={() => setMobileTab('dump')}
                  className={`px-3 py-3 text-sm ${
                    mobileTab === 'dump'
                      ? 'bg-indigo-600 text-gray-100'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-slate-800'
                  }`}
                >
                  덤프
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('big3')}
                  className={`px-3 py-3 text-sm ${
                    mobileTab === 'big3'
                      ? 'bg-indigo-600 text-gray-100'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-slate-800'
                  }`}
                >
                  빅3
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('timeline')}
                  className={`px-3 py-3 text-sm ${
                    mobileTab === 'timeline'
                      ? 'bg-indigo-600 text-gray-100'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-slate-800'
                  }`}
                >
                  타임라인
                </button>
              </div>
            </nav>
          ) : null}
        </div>

        <ToastContainer />
        <FloatingActionDock
          onOpenPatchNotes={openPatchNotes}
          onOpenCategory={openCategoryManager}
          onOpenData={openDataModal}
          onOpenTemplate={openTemplateManager}
        />
        {isPatchNotesOpen ? <PatchNotesModal onClose={closePatchNotes} /> : null}
        {isDataModalOpen ? (
          <DataTransferModal
            currentDate={currentDate}
            onClose={closeDataModal}
            onImported={handleImported}
            showToast={showToast}
          />
        ) : null}
        {isCategoryManagerOpen ? (
          <CategoryManagerModal
            categories={categories}
            onClose={closeCategoryManager}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        ) : null}
        {isTemplateManagerOpen ? (
          <TemplateManagerModal
            templates={templates}
            categories={categories}
            onClose={closeTemplateManager}
            onAddTemplate={handleAddTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        ) : null}
        {quickAddContext ? (
          <QuickAddModal
            dateStr={quickAddContext.dateStr}
            dateLabel={quickAddContext.dateLabel}
            categories={categories}
            templates={templates}
            initialTemplateId={quickAddContext.initialTemplateId}
            onClose={closeQuickAdd}
            onSubmit={(payload) => createTimeBoxOnDate(payload)}
          />
        ) : null}
        {isRescheduleModalOpen ? (
          <RescheduleAssistantModal
            plan={buildReschedulePlan()}
            onClose={closeRescheduleModal}
            onApply={(plan) => {
              if (applyReschedulePlan(plan)) {
                closeRescheduleModal()
              }
            }}
          />
        ) : null}
      </div>
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
