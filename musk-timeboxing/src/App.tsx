import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useCallback, useMemo } from 'react'
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
  useDeadlineMeta,
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
  derivePlannerRunSession,
  shiftPlannerDate,
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
    pauseTimeBoxTimerAndPersist,
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
  const { deadlines, upsertDeadline, removeDeadlineForLinkedTask, reloadDeadlines } = useDeadlineMeta()
  const categories = useMemo(
    () =>
      buildManagedCategoryViewModels(rawCategories, {
        taskCards: data.taskCards,
        timeBoxes: data.timeBoxes,
        templates,
      }),
    [data.taskCards, data.timeBoxes, rawCategories, templates],
  )
  const categoriesWithUsage = useMemo(
    () =>
      categories.map((category) => {
        const taskCount = data.taskCards.filter((taskCard) => taskCard.categoryId === category.id).length
        const timeBoxCount = data.timeBoxes.filter((timeBox) => timeBox.categoryId === category.id).length
        const templateCount = templates.filter((template) => template.categoryId === category.id).length

        return {
          ...category,
          taskCount,
          timeBoxCount,
          templateCount,
          linkedCount: taskCount + timeBoxCount + templateCount,
        }
      }),
    [categories, data.taskCards, data.timeBoxes, templates],
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
    goNextDay: goNextDayFlow,
    goPrevDay: goPrevDayFlow,
    goToDate: goToDateFlow,
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
    reloadDeadlines,
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
    deadlines,
  })
  const monthCalendar = buildMonthCalendarSnapshot({
    currentDate,
    currentDayData: data,
    categories,
    deadlines,
  })
  const syncTaskDeadlineFromEditor = useCallback(
    (
      taskId: string | null,
      payload: {
        title?: unknown
        deadlineDate?: unknown
        deadlinePriority?: unknown
        deadlineNote?: unknown
      },
    ) => {
      if (!taskId) {
        return
      }

      const dueDate = typeof payload.deadlineDate === 'string' ? payload.deadlineDate.trim() : ''
      if (!dueDate) {
        removeDeadlineForLinkedTask(taskId, currentDate)
        return
      }

      const title = typeof payload.title === 'string' ? payload.title.trim() : ''
      if (!title) {
        return
      }

      upsertDeadline({
        taskId,
        taskDate: currentDate,
        title,
        dueDate,
        priority:
          payload.deadlinePriority === 'LOW' || payload.deadlinePriority === 'HIGH'
            ? payload.deadlinePriority
            : 'MEDIUM',
        note: typeof payload.deadlineNote === 'string' ? payload.deadlineNote : '',
      })
    },
    [currentDate, removeDeadlineForLinkedTask, upsertDeadline],
  )
  const handleCreateBoardCardWithDeadline = useCallback(
    (payload: {
      title?: unknown
      categoryId?: string | null
      estimateSlots?: number
      note?: string
      deadlineDate?: unknown
      deadlinePriority?: unknown
      deadlineNote?: unknown
    }) => {
      const nextTaskId = addBoardCard({
        title: typeof payload.title === 'string' ? payload.title : '',
        categoryId: payload.categoryId ?? null,
        estimateSlots: typeof payload.estimateSlots === 'number' ? payload.estimateSlots : 1,
        note: payload.note,
      })

      if (!nextTaskId) {
        return false
      }

      syncTaskDeadlineFromEditor(nextTaskId, payload)
      return true
    },
    [addBoardCard, syncTaskDeadlineFromEditor],
  )
  const handleUpdateTaskCardWithDeadline = useCallback(
    (
      id: string,
      payload: {
        title?: unknown
        categoryId?: string | null
        estimateSlots?: number
        note?: string
        deadlineDate?: unknown
        deadlinePriority?: unknown
        deadlineNote?: unknown
      },
    ) => {
      updateTaskCard(id, {
        title: typeof payload.title === 'string' ? payload.title : undefined,
        categoryId: Object.prototype.hasOwnProperty.call(payload, 'categoryId') ? payload.categoryId ?? null : undefined,
        estimateSlots: typeof payload.estimateSlots === 'number' ? payload.estimateSlots : undefined,
        note: typeof payload.note === 'string' ? payload.note : undefined,
      })

      syncTaskDeadlineFromEditor(id, payload)
    },
    [syncTaskDeadlineFromEditor, updateTaskCard],
  )
  const bigThreeProgress = useMemo(
    () => deriveBigThreeProgress(data.bigThree, data.timeBoxes),
    [data.bigThree, data.timeBoxes],
  )
  const runSession = useMemo(
    () => derivePlannerRunSession(data.timeBoxes),
    [data.timeBoxes],
  )
  const activeRunTimeBox = useMemo(
    () => data.timeBoxes.find((timeBox) => timeBox.id === runSession.activeTimeBoxId) || null,
    [data.timeBoxes, runSession.activeTimeBoxId],
  )
  const activeRunAccent = useMemo(() => {
    if (!activeRunTimeBox?.categoryId) {
      return null
    }

    return categories.find((category) => category.id === activeRunTimeBox.categoryId)?.color || null
  }, [activeRunTimeBox?.categoryId, categories])
  const confirmDayNavigation = useCallback(
    (targetDate: string): boolean => {
      if (targetDate === currentDate || runSession.mode === 'IDLE') {
        return true
      }

      const activeLabel = activeRunTimeBox?.content || '현재 일정'

      if (runSession.mode === 'RUNNING') {
        const confirmed = window.confirm(
          `'${activeLabel}' 타이머가 실행 중입니다. 날짜를 이동하면 타이머를 일시정지하고 이동합니다. 계속할까요?`,
        )

        if (!confirmed) {
          return false
        }

        if (activeRunTimeBox?.id) {
          pauseTimeBoxTimerAndPersist(activeRunTimeBox.id)
          showToast(`'${activeLabel}' 타이머를 일시정지하고 날짜를 이동했습니다`, 2600)
        }

        return true
      }

      return window.confirm(
        `'${activeLabel}' 실행 컨텍스트가 일시정지된 상태입니다. 날짜를 이동할까요?`,
      )
    },
    [
      activeRunTimeBox?.content,
      activeRunTimeBox?.id,
      currentDate,
      pauseTimeBoxTimerAndPersist,
      runSession.mode,
      showToast,
    ],
  )
  const goToDate = useCallback(
    (targetDate: string) => {
      if (!confirmDayNavigation(targetDate)) {
        return
      }

      goToDateFlow(targetDate)
    },
    [confirmDayNavigation, goToDateFlow],
  )
  const goPrevDay = useCallback(() => {
    const targetDateStr = shiftPlannerDate(currentDate, -1)

    if (!confirmDayNavigation(targetDateStr)) {
      return
    }

    goPrevDayFlow()
  }, [confirmDayNavigation, currentDate, goPrevDayFlow])
  const goNextDay = useCallback(() => {
    const targetDateStr = shiftPlannerDate(currentDate, 1)

    if (!confirmDayNavigation(targetDateStr)) {
      return
    }

    if (runSession.mode === 'IDLE') {
      goNextDayFlow()
      return
    }

    goToDateFlow(targetDateStr)
  }, [confirmDayNavigation, currentDate, goNextDayFlow, goToDateFlow, runSession.mode])

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
      deadlines={deadlines}
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
      addBoardCard={handleCreateBoardCardWithDeadline}
      addBigThreeItem={addBigThreeItem}
      removeBigThreeItem={removeBigThreeItem}
      onSendCardsToBigThree={handleSendCardsToBigThree}
      updateTaskCard={handleUpdateTaskCardWithDeadline}
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
      runSession={runSession}
      activeRunTimeBoxId={runSession.activeTimeBoxId}
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
            runMode={runSession.mode}
            activeRunLabel={activeRunTimeBox?.content || null}
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
              categories: categoriesWithUsage,
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
        runMode={runSession.mode}
        activeRunAccent={activeRunAccent}
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
