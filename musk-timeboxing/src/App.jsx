import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  buildMonthCalendarSnapshot,
  buildWeekCalendarSnapshot,
  getCategoryViewModels,
  getPlannerPersistenceStatus,
  hasOverlap,
  loadDay,
  loadLastViewMode,
  saveDay,
  slotDurationMinutes,
  subscribePlannerPersistenceStatus,
  TOTAL_SLOTS,
} from './entities/planner'

const DEFAULT_BOX_SLOTS = 1
const BASE_SLOT_HEIGHT = 32
const DETAIL_SLOT_HEIGHT = 64
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const THEME_KEY = 'musk-planner-theme'
const TIMELINE_FOCUS_MODE_KEY = 'musk-planner-timeline-focus-mode'
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'
const INSIGHTS_LOADING_MS = 220
const UNDO_TOAST_MS = 5000
const BOOTSTRAP_NOTICE_KEY = 'musk-planner-bootstrap-notice-shown'

const parseDate = (dateStr) => new Date(`${dateStr}T00:00:00`)
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const shiftDate = (dateStr, offset) => {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return formatDate(date)
}
const formatShortDateLabel = (dateStr) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateStr}T00:00:00`))

const startOfWeekMonday = (dateStr) => {
  const date = parseDate(dateStr)
  const day = date.getDay()
  const offset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + offset)
  return date
}

const summarizeDay = (dayData) => {
  const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []
  const total = timeBoxes.length
  const completed = timeBoxes.filter((box) => box.status === 'COMPLETED').length
  return {
    total,
    completed,
  }
}

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

const getSkipBasedSuggestion = (dayData) => {
  const skipped = (Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []).filter(
    (box) => box.status === 'SKIPPED',
  )

  if (skipped.length === 0) {
    return null
  }

  const reasonCounter = new Map()
  skipped.forEach((box) => {
    const reason =
      typeof box.skipReason === 'string' && box.skipReason.trim().length > 0 ? box.skipReason.trim() : '기타'
    reasonCounter.set(reason, (reasonCounter.get(reason) || 0) + 1)
  })

  const [topReason, topCount] = [...reasonCounter.entries()].sort((a, b) => b[1] - a[1])[0] || ['기타', 0]
  if (topCount < 1) {
    return null
  }

  return {
    reason: topReason,
    message: SKIP_SUGGESTION_BY_REASON[topReason] || SKIP_SUGGESTION_BY_REASON.기타,
  }
}

const buildWeeklyReport = ({ currentDate, currentDayData }) => {
  const startDate = startOfWeekMonday(currentDate)
  let total = 0
  let completed = 0
  let skipped = 0
  let completedPlannedMinutes = 0
  let completedActualMinutes = 0
  const skipReasonCounter = new Map()
  const previousSkipReasonCounter = new Map()

  const byDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    const dateStr = formatDate(date)
    const dayData = dateStr === currentDate ? currentDayData : loadDay(dateStr)
    const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []
    const dayTotal = timeBoxes.length
    const dayCompleted = timeBoxes.filter((box) => box.status === 'COMPLETED').length
    const daySkipped = timeBoxes.filter((box) => box.status === 'SKIPPED').length

    total += dayTotal
    completed += dayCompleted
    skipped += daySkipped

    timeBoxes.forEach((box) => {
      if (
        box.status === 'COMPLETED' &&
        Number.isFinite(box.actualMinutes) &&
        Number(box.actualMinutes) > 0
      ) {
        completedPlannedMinutes += slotDurationMinutes(box.startSlot, box.endSlot)
        completedActualMinutes += Number(box.actualMinutes)
      }

      if (box.status !== 'SKIPPED') {
        return
      }

      const reason =
        typeof box.skipReason === 'string' && box.skipReason.trim().length > 0 ? box.skipReason.trim() : '기타'
      skipReasonCounter.set(reason, (skipReasonCounter.get(reason) || 0) + 1)
    })

    return {
      dateStr,
      dayLabel: DAY_LABELS[date.getDay()],
      total: dayTotal,
      completed: dayCompleted,
    }
  })

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const diff = completedActualMinutes - completedPlannedMinutes
  const topSkipReasons = [...skipReasonCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => ({ reason, count }))
  Array.from({ length: 7 }).forEach((_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() - 7 + index)
    const dayData = loadDay(formatDate(date))
    const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []

    timeBoxes.forEach((box) => {
      if (box.status !== 'SKIPPED') {
        return
      }

      const reason =
        typeof box.skipReason === 'string' && box.skipReason.trim().length > 0
          ? box.skipReason.trim()
          : '기타'
      previousSkipReasonCounter.set(reason, (previousSkipReasonCounter.get(reason) || 0) + 1)
    })
  })

  const skipReasonTrend = [...new Set([...skipReasonCounter.keys(), ...previousSkipReasonCounter.keys()])]
    .map((reason) => {
      const current = skipReasonCounter.get(reason) || 0
      const previous = previousSkipReasonCounter.get(reason) || 0
      return {
        reason,
        current,
        previous,
        delta: current - previous,
      }
    })
    .filter((item) => item.current > 0 || item.previous > 0)
    .sort((a, b) => {
      const byDelta = Math.abs(b.delta) - Math.abs(a.delta)
      if (byDelta !== 0) {
        return byDelta
      }

      const byCurrent = b.current - a.current
      if (byCurrent !== 0) {
        return byCurrent
      }

      return a.reason.localeCompare(b.reason, 'ko')
    })
    .slice(0, 3)

  return {
    total,
    completed,
    skipped,
    completionRate,
    completedPlannedMinutes,
    completedActualMinutes,
    diff,
    byDay,
    topSkipReasons,
    skipReasonTrend,
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const findAvailableStartSlot = (timeBoxes, preferredStartSlot, durationSlots) => {
  const safeDuration = Math.max(1, Math.min(TOTAL_SLOTS, Number(durationSlots) || 1))
  const maxStart = TOTAL_SLOTS - safeDuration
  const safePreferred = clamp(Number(preferredStartSlot) || 0, 0, maxStart)

  const findFrom = (start) => {
    for (let slot = start; slot <= maxStart; slot += 1) {
      if (!hasOverlap(timeBoxes, { startSlot: slot, endSlot: slot + safeDuration })) {
        return slot
      }
    }

    return null
  }

  return findFrom(safePreferred) ?? findFrom(0)
}

const buildWeeklyPlanningPreview = ({ currentDate, currentDayData }) => {
  const startDate = startOfWeekMonday(currentDate)

  return Array.from({ length: 5 }, (_, offset) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + offset)
    const dateStr = formatDate(date)
    const dayData = dateStr === currentDate ? currentDayData : loadDay(dateStr)
    const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []
    const sorted = [...timeBoxes].sort((a, b) => a.startSlot - b.startSlot)
    const previewItems = sorted.slice(0, 3).map((box) => ({
      id: box.id,
      content: box.content,
      startSlot: box.startSlot,
      status: box.status,
    }))

    return {
      dateStr,
      dayLabel: DAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      total: sorted.length,
      previewItems,
    }
  })
}

const resolveMovedRangeFromDelta = (activeData, deltaY, slotHeight) => {
  const activeStart = Number(activeData?.startSlot) || 0
  const activeEnd = Number(activeData?.endSlot) || activeStart + 1
  const duration = Math.max(1, activeEnd - activeStart)
  const normalizedSlotHeight = Math.max(1, Number(slotHeight) || BASE_SLOT_HEIGHT)
  const slotDelta = Math.round((Number(deltaY) || 0) / normalizedSlotHeight)

  let startSlot = activeStart + slotDelta
  startSlot = clamp(startSlot, 0, TOTAL_SLOTS - duration)
  const endSlot = startSlot + duration

  return {
    startSlot,
    endSlot,
    duration,
    slotDelta,
  }
}

const getVisibleTimelineGridAtPoint = (clientX, clientY) => {
  if (typeof document === 'undefined') {
    return null
  }

  const grids = [...document.querySelectorAll('[data-timeline-grid="true"]')]
  return (
    grids.find((grid) => {
      const rect = grid.getBoundingClientRect()
      if (rect.width < 40 || rect.height < BASE_SLOT_HEIGHT) {
        return false
      }

      return (
        clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
      )
    }) || null
  )
}

const resolveSlotFromGridPoint = (grid, clientY) => {
  const gridRect = grid.getBoundingClientRect()
  const firstSlot = grid.querySelector('[data-timeline-slot-index="0"]')
  const rowHeight = Math.max(
    1,
    Number(firstSlot?.getBoundingClientRect?.().height) || BASE_SLOT_HEIGHT,
  )
  const slotOffset = Math.floor((clientY - gridRect.top) / rowHeight)
  return clamp(slotOffset, 0, TOTAL_SLOTS - 1)
}

const resolveSlotFromPointerPosition = (pointer) => {
  if (typeof document === 'undefined') {
    return null
  }

  const clientX = Number(pointer?.clientX)
  const clientY = Number(pointer?.clientY)

  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return null
  }

  const element = document.elementFromPoint(clientX, clientY)
  const slotElement = element?.closest?.('[data-timeline-slot-index]')

  if (slotElement) {
    const slotIndex = Number(slotElement.getAttribute('data-timeline-slot-index'))
    return Number.isInteger(slotIndex) ? slotIndex : null
  }

  const grid = getVisibleTimelineGridAtPoint(clientX, clientY)
  if (!grid) {
    return null
  }

  const gridRect = grid.getBoundingClientRect()
  if (
    clientX < gridRect.left ||
    clientX > gridRect.right ||
    clientY < gridRect.top ||
    clientY > gridRect.bottom
  ) {
    return null
  }

  return resolveSlotFromGridPoint(grid, clientY)
}

const resolveSlotFromFinalPosition = (active, delta) => {
  if (typeof document === 'undefined') {
    return null
  }

  const translatedRect = active?.rect?.current?.translated
  const initialRect = active?.rect?.current?.initial

  let centerX = null
  let centerY = null

  if (translatedRect) {
    centerX = translatedRect.left + translatedRect.width / 2
    centerY = translatedRect.top + translatedRect.height / 2
  } else if (initialRect) {
    centerX = initialRect.left + initialRect.width / 2 + Number(delta?.x || 0)
    centerY = initialRect.top + initialRect.height / 2 + Number(delta?.y || 0)
  }

  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
    return null
  }

  const grid = getVisibleTimelineGridAtPoint(centerX, centerY)
  if (!grid) {
    return null
  }

  const gridRect = grid.getBoundingClientRect()
  if (
    centerX < gridRect.left ||
    centerX > gridRect.right ||
    centerY < gridRect.top ||
    centerY > gridRect.bottom
  ) {
    return null
  }

  return resolveSlotFromGridPoint(grid, centerY)
}

function App() {
  const {
    currentDate,
    data,
    lastFocus,
    goNextDay: goNextDayRaw,
    goPrevDay: goPrevDayRaw,
    goToDate: goToDateRaw,
    addBrainDumpItem,
    addBoardCard,
    removeBrainDumpItem,
    restoreBrainDumpItem,
    cycleBrainDumpItemPriority,
    updateBrainDumpItem,
    applyBrainDumpBoardLayout,
    clearBrainDumpCategory,
    sendToBigThree,
    sendManyToBigThree,
    fillBigThreeFromBrainDump,
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
  const lockedParentIds = useMemo(() => {
    const usedIds = new Set()

    data.brainDump.forEach((item) => {
      if (item.categoryId) {
        usedIds.add(item.categoryId)
      }
    })
    data.timeBoxes.forEach((box) => {
      if (box.categoryId) {
        usedIds.add(box.categoryId)
      }
    })
    templates.forEach((template) => {
      if (template.categoryId) {
        usedIds.add(template.categoryId)
      }
    })

    return usedIds
  }, [data.brainDump, data.timeBoxes, templates])
  const categories = useMemo(
    () =>
      getCategoryViewModels(rawCategories).map((category) => ({
        ...category,
        canAcceptChildren: !lockedParentIds.has(category.id),
      })),
    [lockedParentIds, rawCategories],
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
  const [activeDragPreview, setActiveDragPreview] = useState(null)
  const [dropPreviewSlot, setDropPreviewSlot] = useState(null)
  const [movingTimeBoxPreview, setMovingTimeBoxPreview] = useState(null)
  const [dailySuggestion, setDailySuggestion] = useState(null)
  const lastPointerRef = useRef(null)
  const dropPreviewSlotRef = useRef(null)
  const activeDragTypeRef = useRef(null)
  const pointerTrackingRef = useRef(false)
  const timelineSlotHeight = timelineScale === '15' ? DETAIL_SLOT_HEIGHT : BASE_SLOT_HEIGHT
  const showDesktopPlanningRail = timelineViewMode === 'CANVAS' || timelineViewMode === 'COMPOSER'
  const showMobilePlanningTabs = timelineViewMode === 'CANVAS' || timelineViewMode === 'COMPOSER'

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const updateDropPreviewSlot = (slot) => {
    const normalized = Number.isInteger(slot) ? slot : null
    dropPreviewSlotRef.current = normalized
    setDropPreviewSlot((prev) => (prev === normalized ? prev : normalized))
  }

  const updateDropPreviewFromPointer = (pointer) => {
    if (activeDragTypeRef.current !== 'BRAIN_DUMP' && activeDragTypeRef.current !== 'BIG_THREE') {
      updateDropPreviewSlot(null)
      return
    }

    const slot = resolveSlotFromPointerPosition(pointer)
    updateDropPreviewSlot(slot)
  }

  const goNextDay = () => {
    setIsTimelineInsightsLoading(true)
    const skipSuggestion = getSkipBasedSuggestion(data)
    const nextDate = shiftDate(currentDate, 1)
    const result = goNextDayRaw({ autoCarry: true })

    if (result.moved > 0) {
      showToast(`미완료 일정 ${result.moved}건을 다음 날로 이월했습니다`)
    } else if (result.skipped > 0) {
      showToast(`이월 가능한 일정이 없어 ${result.skipped}건을 건너뛰었습니다`)
    }

    if (skipSuggestion) {
      setDailySuggestion({
        forDate: nextDate,
        message: skipSuggestion.message,
        action: SKIP_ACTION_TEMPLATE_BY_REASON[skipSuggestion.reason] || SKIP_ACTION_TEMPLATE_BY_REASON.기타,
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

  const weekStrip = (() => {
    const startDate = startOfWeekMonday(currentDate)
    startDate.setDate(startDate.getDate() - 7)

    return Array.from({ length: 21 }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      const dateStr = formatDate(date)
      const dayData = dateStr === currentDate ? data : loadDay(dateStr)
      const summary = summarizeDay(dayData)

      return {
        dateStr,
        dayLabel: DAY_LABELS[date.getDay()],
        dayNumber: date.getDate(),
        total: summary.total,
        completed: summary.completed,
        isCurrent: dateStr === currentDate,
      }
    })
  })()
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
  const bigThreeProgress = useMemo(() => {
    const statuses = [0, 1, 2].map((index) => {
      const item = data.bigThree[index]
      if (!item) {
        return 'EMPTY'
      }

      const done = data.timeBoxes.some(
        (box) =>
          box.status === 'COMPLETED' &&
          (box.sourceId === item.id || (box.sourceId == null && box.content === item.content)),
      )

      return done ? 'DONE' : 'PENDING'
    })

    const completedCount = statuses.filter((status) => status === 'DONE').length
    const filledCount = statuses.filter((status) => status !== 'EMPTY').length

    return {
      statuses,
      completedCount,
      filledCount,
      isPerfect: completedCount === 3,
    }
  }, [data.bigThree, data.timeBoxes])

  const handleSendToBigThree = (brainDumpId) => {
    const success = sendToBigThree(brainDumpId)

    if (!success) {
      showToast('빅 3이 이미 가득 찼습니다')
    }
  }

  const handleRemoveBrainDumpItem = (id) => {
    const removedIndex = data.brainDump.findIndex((item) => item.id === id)
    const removedItem = removedIndex >= 0 ? data.brainDump[removedIndex] : null

    if (!removedItem) {
      return
    }

    removeBrainDumpItem(id)
    showToast('브레인 덤프를 삭제했습니다', UNDO_TOAST_MS, {
      actionLabel: '되돌리기',
      onAction: () => {
        restoreBrainDumpItem(removedItem, removedIndex)
      },
    })
  }

  const handleFillBigThreeFromBrainDump = () => {
    const insertedCount = fillBigThreeFromBrainDump()

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

  const handleSendCardsToBigThree = (brainDumpIds = []) => {
    const insertedCount = sendManyToBigThree(brainDumpIds)

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

    const startSlot = findAvailableStartSlot(
      data.timeBoxes,
      action.preferredStartSlot,
      action.durationSlots,
    )

    if (startSlot == null) {
      showToast('추천 블록을 배치할 빈 시간이 없습니다')
      return
    }

    addTimeBox({
      content: action.content,
      sourceId: null,
      startSlot,
      endSlot: Math.min(TOTAL_SLOTS, startSlot + action.durationSlots),
    })
    showToast(`추천 블록을 추가했습니다: ${action.content}`)
  }

  const buildReschedulePlan = () => {
    const targetDate = shiftDate(currentDate, 1)
    const targetDay = loadDay(targetDate)
    const planBaseBoxes = [...targetDay.timeBoxes]
    const pending = [...data.timeBoxes]
      .filter((box) => box.status !== 'COMPLETED')
      .sort((a, b) => a.startSlot - b.startSlot)

    const planned = []
    const skipped = []

    pending.forEach((box) => {
      const durationSlots = Math.max(1, box.endSlot - box.startSlot)
      const startSlot = findAvailableStartSlot(planBaseBoxes, box.startSlot, durationSlots)

      if (startSlot == null) {
        skipped.push(box)
        return
      }

      const nextBox = {
        id: crypto.randomUUID(),
        content: box.content,
        sourceId: box.sourceId ?? null,
        startSlot,
        endSlot: startSlot + durationSlots,
        status: 'PLANNED',
        actualMinutes: null,
        category: box.category ?? null,
        categoryId: box.categoryId ?? null,
        skipReason: null,
        carryOverFromDate: currentDate,
        carryOverFromBoxId: box.id,
        timerStartedAt: null,
        elapsedSeconds: 0,
      }

      planned.push(nextBox)
      planBaseBoxes.push(nextBox)
    })

    return {
      fromDate: currentDate,
      targetDate,
      planned,
      skipped,
    }
  }

  const applyReschedulePlan = (plan) => {
    if (!plan || !Array.isArray(plan.planned) || plan.planned.length === 0) {
      showToast('재배치할 일정이 없습니다')
      return
    }

    const targetDay = loadDay(plan.targetDate)
    const deduped = plan.planned.filter(
      (candidate) =>
        !targetDay.timeBoxes.some(
          (existing) =>
            existing.carryOverFromDate === candidate.carryOverFromDate &&
            existing.carryOverFromBoxId === candidate.carryOverFromBoxId,
        ),
    )
    if (deduped.length === 0) {
      showToast('이미 재배치된 일정입니다')
      setIsRescheduleModalOpen(false)
      return
    }

    const merged = {
      ...targetDay,
      timeBoxes: [...targetDay.timeBoxes, ...deduped],
    }

    saveDay(plan.targetDate, merged)
    setCrossDateRevision((prev) => prev + 1)
    showToast(`다음 날(${plan.targetDate})로 ${deduped.length}건 재배치했습니다`, 2600)
    setIsRescheduleModalOpen(false)
  }

  const trackPointerMove = (event) => {
    const pointer = {
      clientX: Number(event?.clientX),
      clientY: Number(event?.clientY),
    }
    lastPointerRef.current = pointer
    updateDropPreviewFromPointer(pointer)
  }

  const startPointerTracking = () => {
    if (pointerTrackingRef.current || typeof window === 'undefined') {
      return
    }

    pointerTrackingRef.current = true
    window.addEventListener('pointermove', trackPointerMove)
  }

  const stopPointerTracking = () => {
    if (!pointerTrackingRef.current || typeof window === 'undefined') {
      return
    }

    pointerTrackingRef.current = false
    window.removeEventListener('pointermove', trackPointerMove)
  }

  const handleDragStart = ({ active, activatorEvent }) => {
    const payload = active?.data?.current
    const pointer = {
      clientX: Number(activatorEvent?.clientX),
      clientY: Number(activatorEvent?.clientY),
    }
    lastPointerRef.current = pointer

    if (!payload) {
      setActiveDragPreview(null)
      setMovingTimeBoxPreview(null)
      updateDropPreviewSlot(null)
      return
    }

    activeDragTypeRef.current = payload.type ?? null

    if (payload.type === 'BRAIN_DUMP' || payload.type === 'BIG_THREE') {
      startPointerTracking()
      setActiveDragPreview({
        type: payload.type,
        content: payload.content,
      })
      updateDropPreviewFromPointer(pointer)
      return
    }

    if (payload.type === 'TIME_BOX') {
      setMovingTimeBoxPreview({
        id: payload.id,
        startSlot: Number(payload.startSlot) || 0,
        endSlot: Number(payload.endSlot) || (Number(payload.startSlot) || 0) + 1,
        hasConflict: false,
      })
      return
    }

    setActiveDragPreview(null)
    setMovingTimeBoxPreview(null)
    updateDropPreviewSlot(null)
  }

  const handleDragCancel = () => {
    setActiveDragPreview(null)
    setMovingTimeBoxPreview(null)
    lastPointerRef.current = null
    activeDragTypeRef.current = null
    updateDropPreviewSlot(null)
    stopPointerTracking()
  }

  const handleDragMove = ({ over, activatorEvent, active, delta }) => {
    if (activeDragTypeRef.current === 'TIME_BOX') {
      const activeData = active?.data?.current
      if (!activeData) {
        setMovingTimeBoxPreview(null)
        return
      }

      const movedRange = resolveMovedRangeFromDelta(activeData, delta?.y, timelineSlotHeight)
      const hasConflict = hasOverlap(data.timeBoxes, movedRange, activeData.id)
      setMovingTimeBoxPreview({
        id: activeData.id,
        ...movedRange,
        hasConflict,
      })
      return
    }

    if (activeDragTypeRef.current !== 'BRAIN_DUMP' && activeDragTypeRef.current !== 'BIG_THREE') {
      return
    }

    const overData = over?.data?.current
    if (overData?.type === 'TIMELINE_SLOT' && Number.isInteger(overData.slotIndex)) {
      updateDropPreviewSlot(overData.slotIndex)
      return
    }

    let pointerSlot = null
    const clientX = Number(activatorEvent?.clientX)
    const clientY = Number(activatorEvent?.clientY)

    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      const pointer = { clientX, clientY }
      lastPointerRef.current = pointer
      pointerSlot = resolveSlotFromPointerPosition(pointer)
    }

    const rectSlot = resolveSlotFromFinalPosition(active, delta)
    updateDropPreviewSlot(pointerSlot ?? rectSlot)
  }

  const handleDragEnd = ({ active, over, delta }) => {
    setActiveDragPreview(null)
    const finalize = () => {
      setMovingTimeBoxPreview(null)
      lastPointerRef.current = null
      activeDragTypeRef.current = null
      updateDropPreviewSlot(null)
      stopPointerTracking()
    }

    const activeData = active.data.current

    if (!activeData) {
      finalize()
      return
    }

    if (activeData.type === 'TIME_BOX') {
      const movedRange = resolveMovedRangeFromDelta(activeData, delta?.y, timelineSlotHeight)
      const activeStart = Number(activeData.startSlot) || 0
      const activeEnd = Number(activeData.endSlot) || activeStart + 1

      if (movedRange.slotDelta === 0) {
        finalize()
        return
      }

      const { startSlot, endSlot } = movedRange

      if (startSlot === activeStart && endSlot === activeEnd) {
        finalize()
        return
      }

      const movedBox = {
        startSlot,
        endSlot,
      }

      if (hasOverlap(data.timeBoxes, movedBox, activeData.id)) {
        showToast('해당 시간에 이미 일정이 있습니다')
        finalize()
        return
      }

      updateTimeBox(activeData.id, { startSlot, endSlot })
      finalize()
      return
    }

    const overData = over?.data?.current ?? null

    if (activeData.type === 'BRAIN_DUMP' && overData?.type === 'BIG_THREE_SLOT') {
      const success = sendToBigThree(activeData.id)
      if (!success) {
        showToast('빅 3이 이미 가득 찼습니다')
      }
      finalize()
      return
    }

    if (activeData.type === 'BRAIN_DUMP' || activeData.type === 'BIG_THREE') {
      const overSlot =
        overData?.type === 'TIMELINE_SLOT' && Number.isInteger(overData.slotIndex)
          ? overData.slotIndex
          : null
      const startSlot =
        overSlot ??
        dropPreviewSlotRef.current ??
        resolveSlotFromPointerPosition(lastPointerRef.current) ??
        resolveSlotFromFinalPosition(active, delta) ??
        null

      if (!Number.isInteger(startSlot)) {
        finalize()
        return
      }

      const endSlot = Math.min(startSlot + DEFAULT_BOX_SLOTS, TOTAL_SLOTS)
      const newBox = {
        content: activeData.content,
        sourceId: activeData.id,
        startSlot,
        endSlot,
      }

      if (hasOverlap(data.timeBoxes, newBox)) {
        showToast('해당 시간에 이미 일정이 있습니다')
        finalize()
        return
      }

      addTimeBox(newBox)
    }
    finalize()
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
    clearBrainDumpCategory(id)
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

    const duration = Math.max(1, source.endSlot - source.startSlot)
    const startSlot = findAvailableStartSlot(data.timeBoxes, source.endSlot, duration)
    if (startSlot == null) {
      showToast('복제할 빈 시간이 없습니다')
      return false
    }

    addTimeBox({
      content: `${source.content} (복제)`,
      sourceId: source.sourceId ?? source.id,
      startSlot,
      endSlot: Math.min(TOTAL_SLOTS, startSlot + duration),
      category: source.category ?? null,
      categoryId: source.categoryId ?? null,
    })
    showToast(`일정을 ${slotDurationMinutes(startSlot, Math.min(TOTAL_SLOTS, startSlot + duration))}분 블록으로 복제했습니다`)
    return true
  }

  const createTimeBoxOnDate = ({
    dateStr,
    content,
    durationSlots = 1,
    startSlot = null,
    categoryId = null,
    sourceId = null,
  }) => {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false
    }

    const trimmedContent = String(content || '').trim()
    if (!trimmedContent) {
      showToast('일정 내용을 입력해 주세요')
      return false
    }

    const safeDuration = Math.max(1, Math.min(TOTAL_SLOTS, Number(durationSlots) || 1))
    const targetDay = dateStr === currentDate ? data : loadDay(dateStr)
    const requestedStart = Number.isInteger(startSlot)
      ? clamp(Number(startSlot), 0, TOTAL_SLOTS - safeDuration)
      : null
    const resolvedStart =
      requestedStart != null
        ? requestedStart
        : findAvailableStartSlot(targetDay.timeBoxes, 0, safeDuration)

    if (resolvedStart == null) {
      showToast('배치할 빈 시간이 없습니다')
      return false
    }

    const newBox = {
      content: trimmedContent,
      sourceId,
      startSlot: resolvedStart,
      endSlot: Math.min(TOTAL_SLOTS, resolvedStart + safeDuration),
      categoryId: categoryId || null,
    }

    if (hasOverlap(targetDay.timeBoxes, newBox)) {
      showToast('해당 시간에 이미 일정이 있습니다')
      return false
    }

    if (dateStr === currentDate) {
      addTimeBox(newBox)
    } else {
      saveDay(dateStr, {
        ...targetDay,
        timeBoxes: [
          ...targetDay.timeBoxes,
          {
            id: crypto.randomUUID(),
            ...newBox,
            status: 'PLANNED',
            actualMinutes: null,
            category: null,
            skipReason: null,
            timerStartedAt: null,
            elapsedSeconds: 0,
            carryOverFromDate: null,
            carryOverFromBoxId: null,
          },
        ],
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
      items={data.brainDump}
      bigThreeCount={data.bigThree.length}
      onAdd={addBrainDumpItem}
      onRemove={handleRemoveBrainDumpItem}
      onCyclePriority={cycleBrainDumpItemPriority}
      onSendToBigThree={handleSendToBigThree}
      onFillBigThree={handleFillBigThreeFromBrainDump}
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
      brainDumpItems={data.brainDump}
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
      updateBrainDumpItem={updateBrainDumpItem}
      applyBrainDumpBoardLayout={applyBrainDumpBoardLayout}
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
