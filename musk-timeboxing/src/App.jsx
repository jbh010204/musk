import { DndContext, DragOverlay } from '@dnd-kit/core'
import { useEffect, useMemo, useState } from 'react'
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
import { useCategoryMeta, useDailyData, useTemplateMeta, useToast } from './app/hooks'
import {
  applyTimeBoxReschedulePlan,
  buildManagedCategoryViewModels,
  buildPlannerWeekStrip,
  buildMonthCalendarSnapshot,
  buildWeekCalendarSnapshot,
  buildTimeBoxReschedulePlan,
  buildWeeklyPlanningPreview,
  buildWeeklyReport,
  deriveBigThreeProgress,
  deriveTopSkippedReason,
  getPlannerPersistenceStatus,
  loadPlannerDayModel,
  planTimeBoxPlacement,
  loadLastViewMode,
  savePlannerDayModel,
  shiftPlannerDate,
  slotDurationMinutes,
  subscribePlannerPersistenceStatus,
  TOTAL_SLOTS,
} from './entities/planner'
import { usePlannerTimelineDnd } from './features/planner-dnd/usePlannerTimelineDnd'

const BASE_SLOT_HEIGHT = 32
const DETAIL_SLOT_HEIGHT = 64
const THEME_KEY = 'musk-planner-theme'
const TIMELINE_FOCUS_MODE_KEY = 'musk-planner-timeline-focus-mode'
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'
const INSIGHTS_LOADING_MS = 220
const UNDO_TOAST_MS = 5000
const BOOTSTRAP_NOTICE_KEY = 'musk-planner-bootstrap-notice-shown'

const formatShortDateLabel = (dateStr) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateStr}T00:00:00`))

const SKIP_SUGGESTION_BY_REASON = {
  '외부 일정/방해': '자동 제안: 외부 일정 변동이 있었어요. 버퍼 30분 블록을 먼저 배치해보세요.',
  '예상보다 오래 걸림': '자동 제안: 주요 일정 예상 시간을 +30분 늘려 계획해보세요.',
  '우선순위 변경': '자동 제안: 타임라인 배치 전에 빅3를 먼저 확정해보세요.',
  '컨디션 저하': '자동 제안: 오전 첫 블록을 30분 저강도 작업으로 시작해보세요.',
  '자료/준비 부족': '자동 제안: 실행 전에 준비/정리 30분 블록을 먼저 잡아보세요.',
  기타: '자동 제안: 건너뜀이 반복됩니다. 오늘은 버퍼 블록 1개를 먼저 배치해보세요.',
}

const SKIP_ACTION_TEMPLATE_BY_REASON = {
  '외부 일정/방해': {
    label: '버퍼 30분 블록 추가',
    content: '버퍼 블록',
    durationSlots: 1,
    preferredStartSlot: 10,
  },
  '예상보다 오래 걸림': {
    label: '집중 블록 60분 추가',
    content: '집중 작업(보정)',
    durationSlots: 2,
    preferredStartSlot: 8,
  },
  '우선순위 변경': {
    label: '빅3 재정렬 30분 추가',
    content: '빅3 재정렬',
    durationSlots: 1,
    preferredStartSlot: 1,
  },
  '컨디션 저하': {
    label: '저강도 시작 30분 추가',
    content: '저강도 워밍업',
    durationSlots: 1,
    preferredStartSlot: 0,
  },
  '자료/준비 부족': {
    label: '준비/정리 30분 추가',
    content: '준비/정리',
    durationSlots: 1,
    preferredStartSlot: 2,
  },
  기타: {
    label: '버퍼 30분 블록 추가',
    content: '버퍼 블록',
    durationSlots: 1,
    preferredStartSlot: 10,
  },
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const showPlacementFailureToast = (reason, showToast, messages = {}) => {
  if (reason === 'invalid-content') {
    showToast(messages.invalidContent || '일정 내용을 입력해 주세요')
    return
  }

  if (reason === 'overlap') {
    showToast(messages.overlap || '해당 시간에 이미 일정이 있습니다')
    return
  }

  showToast(messages.noSpace || '배치할 빈 시간이 없습니다')
}

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
  const [timelineViewMode, setTimelineViewMode] = useState(() => loadLastViewMode())
  const [persistenceStatus, setPersistenceStatus] = useState(() => getPlannerPersistenceStatus())
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return THEME_DARK
    }

    const stored = window.localStorage.getItem(THEME_KEY)
    return stored === THEME_LIGHT ? THEME_LIGHT : THEME_DARK
  })
  const [mobileTab, setMobileTab] = useState('timeline')
  const [timelineScale, setTimelineScale] = useState('30')
  const [isTimelineFocusMode, setIsTimelineFocusMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(TIMELINE_FOCUS_MODE_KEY) === 'true'
  })
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false)
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [quickAddContext, setQuickAddContext] = useState(null)
  const [isTimelineInsightsLoading, setIsTimelineInsightsLoading] = useState(true)
  const [crossDateRevision, setCrossDateRevision] = useState(0)
  const [dailySuggestion, setDailySuggestion] = useState(null)
  const timelineSlotHeight = timelineScale === '15' ? DETAIL_SLOT_HEIGHT : BASE_SLOT_HEIGHT
  const showDesktopPlanningRail = timelineViewMode === 'CANVAS' || timelineViewMode === 'COMPOSER'
  const showMobilePlanningTabs = timelineViewMode === 'CANVAS' || timelineViewMode === 'COMPOSER'
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(THEME_KEY, theme)
    const root = window.document.documentElement
    if (theme === THEME_DARK) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const result = window.__MUSK_PLANNER_BOOTSTRAP_RESULT__
    if (!result || window.sessionStorage.getItem(BOOTSTRAP_NOTICE_KEY) === 'true') {
      return
    }

    if (result.mode === 'server-migrated-local') {
      showToast(
        `이 브라우저 데이터 ${result.migratedDays || 0}일치를 Docker 저장소로 이관했습니다`,
        3200,
      )
    } else if (result.mode === 'server-hydrated' && Number(result.dayCount) > 0) {
      showToast(`Docker 저장소에서 ${result.dayCount}일 데이터를 불러왔습니다`, 2400)
    }

    window.sessionStorage.setItem(BOOTSTRAP_NOTICE_KEY, 'true')
  }, [showToast])

  useEffect(() => {
    const unsubscribe = subscribePlannerPersistenceStatus((status) => {
      setPersistenceStatus(status)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsTimelineInsightsLoading(false)
    }, INSIGHTS_LOADING_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentDate])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(TIMELINE_FOCUS_MODE_KEY, isTimelineFocusMode ? 'true' : 'false')
  }, [isTimelineFocusMode])

  const goNextDay = () => {
    setIsTimelineInsightsLoading(true)
    const skipReason = deriveTopSkippedReason(data.timeBoxes)
    const nextDate = shiftPlannerDate(currentDate, 1)
    const result = goNextDayRaw({ autoCarry: true })

    if (result.moved > 0) {
      showToast(`미완료 일정 ${result.moved}건을 다음 날로 이월했습니다`)
    } else if (result.skipped > 0) {
      showToast(`이월 가능한 일정이 없어 ${result.skipped}건을 건너뛰었습니다`)
    }

    if (skipReason) {
      setDailySuggestion({
        forDate: nextDate,
        message: SKIP_SUGGESTION_BY_REASON[skipReason] || SKIP_SUGGESTION_BY_REASON.기타,
        action: SKIP_ACTION_TEMPLATE_BY_REASON[skipReason] || SKIP_ACTION_TEMPLATE_BY_REASON.기타,
      })
      return
    }

    setDailySuggestion(null)
  }
  const goPrevDay = () => {
    setIsTimelineInsightsLoading(true)
    goPrevDayRaw()
    setDailySuggestion(null)
  }
  const goToDate = (dateStr) => {
    setIsTimelineInsightsLoading(true)
    goToDateRaw(dateStr)
    setDailySuggestion(null)
  }

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

  const handleSendToBigThree = (taskCardId) => {
    const success = sendToBigThree(taskCardId)

    if (!success) {
      showToast('빅 3이 이미 가득 찼습니다')
    }
  }

  const handleRemoveTaskCard = (id) => {
    const removedIndex = data.taskCards.findIndex((item) => item.id === id)
    const removedItem = removedIndex >= 0 ? data.taskCards[removedIndex] : null

    if (!removedItem) {
      return
    }

    removeTaskCard(id)
    showToast('브레인 덤프를 삭제했습니다', UNDO_TOAST_MS, {
      actionLabel: '되돌리기',
      onAction: () => {
        restoreTaskCard(removedItem, removedIndex)
      },
    })
  }

  const handleFillBigThreeFromTaskCards = () => {
    const insertedCount = fillBigThreeFromTaskCards()

    if (insertedCount > 0) {
      showToast(`우선순위 상위 ${insertedCount}개를 빅3로 채웠습니다`)
      return
    }

    if (data.bigThree.length >= 3) {
      showToast('빅 3이 이미 가득 찼습니다')
      return
    }

    showToast('채울 브레인 덤프 항목이 없습니다')
  }

  const handleSendCardsToBigThree = (taskCardIds = []) => {
    const insertedCount = sendManyToBigThree(taskCardIds)

    if (insertedCount > 0) {
      showToast(`선택 카드 ${insertedCount}개를 빅3에 추가했습니다`)
      return insertedCount
    }

    if (data.bigThree.length >= 3) {
      showToast('빅 3이 이미 가득 찼습니다')
      return 0
    }

    showToast('빅3에 추가할 카드가 없습니다')
    return 0
  }

  const applySkipSuggestionAction = () => {
    const action = dailySuggestion?.action
    if (!action) {
      return
    }

    const placement = planTimeBoxPlacement(
      data.timeBoxes,
      {
        content: action.content,
        taskId: null,
        preferredStartSlot: action.preferredStartSlot,
        durationSlots: action.durationSlots,
      },
    )

    if (!placement.timeBox) {
      showPlacementFailureToast(placement.reason, showToast, {
        noSpace: '추천 블록을 배치할 빈 시간이 없습니다',
      })
      return
    }

    addTimeBox(placement.timeBox)
    showToast(`추천 블록을 추가했습니다: ${placement.timeBox.content}`)
  }

  const buildReschedulePlan = () => {
    const targetDate = shiftPlannerDate(currentDate, 1)
    const targetDay = loadPlannerDayModel(targetDate)
    return buildTimeBoxReschedulePlan({
      currentDate,
      targetDate,
      timeBoxes: data.timeBoxes,
      targetTimeBoxes: targetDay.timeBoxes,
    })
  }

  const applyReschedulePlan = (plan) => {
    if (!plan || !Array.isArray(plan.planned) || plan.planned.length === 0) {
      showToast('재배치할 일정이 없습니다')
      return
    }

    const targetDay = loadPlannerDayModel(plan.targetDate)
    const { appliedCount, nextTimeBoxes } = applyTimeBoxReschedulePlan(targetDay.timeBoxes, plan)
    if (appliedCount === 0) {
      showToast('이미 재배치된 일정입니다')
      setIsRescheduleModalOpen(false)
      return
    }

    const merged = {
      ...targetDay,
      timeBoxes: nextTimeBoxes,
    }

    savePlannerDayModel(plan.targetDate, merged)
    setCrossDateRevision((prev) => prev + 1)
    showToast(`다음 날(${plan.targetDate})로 ${appliedCount}건 재배치했습니다`, 2600)
    setIsRescheduleModalOpen(false)
  }

  const handleAddCategory = (name, color, parentId = null) => {
    const result = addCategory(name, color, parentId, {
      lockedParentIds: [...lockedParentIds],
    })
    if (!result.ok) {
      showToast(result.error)
    } else {
      showToast('카테고리를 추가했습니다')
    }

    return result
  }

  const handleUpdateCategory = (id, name, color, parentId = null) => {
    const result = updateCategory(id, name, color, parentId, {
      lockedParentIds: [...lockedParentIds],
    })
    if (!result.ok) {
      showToast(result.error)
    } else {
      showToast('카테고리를 저장했습니다')
    }

    return result
  }

  const handleDeleteCategory = (id) => {
    const result = removeCategory(id)
    if (!result.ok) {
      showToast(result.error)
      return result
    }

    clearTimeBoxCategory(id)
    clearTaskCardCategoryState(id)
    clearTemplateCategory(id)
    showToast('카테고리를 삭제했습니다')
    return result
  }

  const handleImported = () => {
    reloadCategories()
    reloadTemplates()
    reloadCurrentDay()
    setCrossDateRevision((prev) => prev + 1)
  }

  const handleAddTemplate = (payload) => {
    const result = addTemplate(payload)
    if (!result.ok) {
      showToast(result.error)
      return result
    }

    showToast('템플릿을 추가했습니다')
    return result
  }

  const handleUpdateTemplate = (id, payload) => {
    const result = updateTemplate(id, payload)
    if (!result.ok) {
      showToast(result.error)
      return result
    }

    showToast('템플릿을 저장했습니다')
    return result
  }

  const handleDeleteTemplate = (id) => {
    removeTemplate(id)
    showToast('템플릿을 삭제했습니다')
  }

  const handleUpdateTimeBox = (id, changes) => {
    const previous = data.timeBoxes.find((box) => box.id === id)
    if (!previous) {
      return
    }

    const hasStatusField = Object.prototype.hasOwnProperty.call(changes ?? {}, 'status')
    const nextStatus = hasStatusField ? changes.status : null
    const isUndoTargetStatus = nextStatus === 'COMPLETED' || nextStatus === 'SKIPPED'
    const statusChanged = isUndoTargetStatus && previous.status !== nextStatus
    const actualChanged =
      nextStatus === 'COMPLETED' &&
      Object.prototype.hasOwnProperty.call(changes ?? {}, 'actualMinutes') &&
      Number(previous.actualMinutes ?? 0) !== Number(changes.actualMinutes ?? 0)
    const skipReasonChanged =
      nextStatus === 'SKIPPED' &&
      Object.prototype.hasOwnProperty.call(changes ?? {}, 'skipReason') &&
      (previous.skipReason ?? null) !== (changes.skipReason ?? null)
    const shouldOfferUndo = statusChanged || actualChanged || skipReasonChanged

    updateTimeBox(id, changes)

    if (!shouldOfferUndo) {
      return
    }

    const statusLabel = nextStatus === 'COMPLETED' ? '완료' : '건너뜀'
    showToast(`일정을 ${statusLabel} 처리했습니다`, UNDO_TOAST_MS, {
      actionLabel: '되돌리기',
      onAction: () => {
        const restored = restoreTimeBox(previous)
        if (!restored) {
          showToast('원래 시간대가 이미 사용 중이라 되돌릴 수 없습니다')
        }
      },
    })
  }

  const handleTimerComplete = (id) => {
    const previous = data.timeBoxes.find((box) => box.id === id)
    if (!previous) {
      return
    }

    completeTimeBoxByTimer(id)
    showToast('타이머 완료로 일정을 완료 처리했습니다', UNDO_TOAST_MS, {
      actionLabel: '되돌리기',
      onAction: () => {
        const restored = restoreTimeBox(previous)
        if (!restored) {
          showToast('원래 시간대가 이미 사용 중이라 되돌릴 수 없습니다')
        }
      },
    })
  }

  const handleRemoveTimeBox = (id) => {
    const removed = data.timeBoxes.find((box) => box.id === id)
    if (!removed) {
      return
    }

    removeTimeBox(id)
    showToast('일정을 삭제했습니다', UNDO_TOAST_MS, {
      actionLabel: '되돌리기',
      onAction: () => {
        const restored = restoreTimeBox(removed)
        if (!restored) {
          showToast('원래 시간대가 이미 사용 중이라 되돌릴 수 없습니다')
        }
      },
    })
  }

  const handleDuplicateTimeBox = (id) => {
    const source = data.timeBoxes.find((box) => box.id === id)
    if (!source) {
      return false
    }

    const placement = planTimeBoxPlacement(data.timeBoxes, {
      content: `${source.content} (복제)`,
      taskId: source.taskId ?? null,
      preferredStartSlot: source.endSlot,
      durationSlots: Math.max(1, source.endSlot - source.startSlot),
      category: source.category ?? null,
      categoryId: source.categoryId ?? null,
    })

    if (!placement.timeBox) {
      showPlacementFailureToast(placement.reason, showToast, {
        noSpace: '복제할 빈 시간이 없습니다',
      })
      return false
    }

    addTimeBox(placement.timeBox)
    showToast(
      `일정을 ${slotDurationMinutes(placement.timeBox.startSlot, placement.timeBox.endSlot)}분 블록으로 복제했습니다`,
    )
    return true
  }

  const createTimeBoxOnDate = ({
    dateStr,
    content,
    durationSlots = 1,
    startSlot = null,
    categoryId = null,
    taskId = null,
  }) => {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false
    }

    const targetDay = dateStr === currentDate ? data : loadPlannerDayModel(dateStr)
    const placement = planTimeBoxPlacement(targetDay.timeBoxes, {
      content,
      taskId,
      startSlot: Number.isInteger(startSlot)
        ? clamp(Number(startSlot), 0, TOTAL_SLOTS - Math.max(1, Math.min(TOTAL_SLOTS, Number(durationSlots) || 1)))
        : null,
      durationSlots,
      categoryId: categoryId || null,
    })

    if (!placement.timeBox) {
      showPlacementFailureToast(placement.reason, showToast)
      return false
    }

    if (dateStr === currentDate) {
      addTimeBox(placement.timeBox)
    } else {
      savePlannerDayModel(dateStr, {
        ...targetDay,
        timeBoxes: [...targetDay.timeBoxes, placement.timeBox],
      })
      setCrossDateRevision((prev) => prev + 1)
    }

    showToast(`${formatShortDateLabel(dateStr)}에 일정을 추가했습니다`)
    return true
  }

  const openQuickAdd = (dateStr, options = {}) => {
    setQuickAddContext({
      dateStr,
      dateLabel: options.dateLabel || formatShortDateLabel(dateStr),
      initialTemplateId: options.templateId || '',
    })
  }

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
      onToggleFocusMode={() => setIsTimelineFocusMode((prev) => !prev)}
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
      onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
      onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
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
            onOpenReschedule={() => setIsRescheduleModalOpen(true)}
            onToggleTheme={() =>
              setTheme((prev) => (prev === THEME_DARK ? THEME_LIGHT : THEME_DARK))
            }
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
          onOpenPatchNotes={() => setIsPatchNotesOpen(true)}
          onOpenCategory={() => setIsCategoryManagerOpen(true)}
          onOpenData={() => setIsDataModalOpen(true)}
          onOpenTemplate={() => setIsTemplateManagerOpen(true)}
        />
        {isPatchNotesOpen ? <PatchNotesModal onClose={() => setIsPatchNotesOpen(false)} /> : null}
        {isDataModalOpen ? (
          <DataTransferModal
            currentDate={currentDate}
            onClose={() => setIsDataModalOpen(false)}
            onImported={handleImported}
            showToast={showToast}
          />
        ) : null}
        {isCategoryManagerOpen ? (
          <CategoryManagerModal
            categories={categories}
            onClose={() => setIsCategoryManagerOpen(false)}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        ) : null}
        {isTemplateManagerOpen ? (
          <TemplateManagerModal
            templates={templates}
            categories={categories}
            onClose={() => setIsTemplateManagerOpen(false)}
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
            onClose={() => setQuickAddContext(null)}
            onSubmit={(payload) => createTimeBoxOnDate(payload)}
          />
        ) : null}
        {isRescheduleModalOpen ? (
          <RescheduleAssistantModal
            plan={buildReschedulePlan()}
            onClose={() => setIsRescheduleModalOpen(false)}
            onApply={applyReschedulePlan}
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
