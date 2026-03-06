import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useMemo, useRef, useState } from 'react'
import CategoryManagerModal from './components/Category/CategoryManagerModal'
import DataTransferModal from './components/Data/DataTransferModal'
import FloatingActionDock from './components/Floating/FloatingActionDock'
import Header from './components/Header'
import BigThree from './components/LeftPanel/BigThree'
import BrainDump from './components/LeftPanel/BrainDump'
import Timeline from './components/Timeline'
import { useCategoryMeta } from './hooks/useCategoryMeta'
import { useDailyData } from './hooks/useDailyData'
import { useToast } from './hooks/useToast'
import { loadDay } from './utils/storage'
import { hasOverlap, slotDurationMinutes, TOTAL_SLOTS } from './utils/timeSlot'

const DEFAULT_BOX_SLOTS = 1
const BASE_SLOT_HEIGHT = 32
const DETAIL_SLOT_HEIGHT = 64
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

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

  return SKIP_SUGGESTION_BY_REASON[topReason] || SKIP_SUGGESTION_BY_REASON.기타
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
    goNextDay: goNextDayRaw,
    goPrevDay: goPrevDayRaw,
    goToDate: goToDateRaw,
    addBrainDumpItem,
    removeBrainDumpItem,
    sendToBigThree,
    addBigThreeItem,
    removeBigThreeItem,
    addTimeBox,
    updateTimeBox,
    removeTimeBox,
    clearTimeBoxCategory,
    reloadCurrentDay,
  } = useDailyData()
  const { categories, addCategory, updateCategory, removeCategory, reloadCategories } = useCategoryMeta()

  const { showToast, ToastContainer } = useToast()
  const [mobileTab, setMobileTab] = useState('timeline')
  const [timelineScale, setTimelineScale] = useState('30')
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [activeDragPreview, setActiveDragPreview] = useState(null)
  const [dropPreviewSlot, setDropPreviewSlot] = useState(null)
  const [movingTimeBoxPreview, setMovingTimeBoxPreview] = useState(null)
  const [dailySuggestion, setDailySuggestion] = useState(null)
  const lastPointerRef = useRef(null)
  const dropPreviewSlotRef = useRef(null)
  const activeDragTypeRef = useRef(null)
  const pointerTrackingRef = useRef(false)
  const timelineSlotHeight = timelineScale === '15' ? DETAIL_SLOT_HEIGHT : BASE_SLOT_HEIGHT

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
        message: skipSuggestion,
      })
      return
    }

    setDailySuggestion(null)
  }
  const goPrevDay = () => {
    goPrevDayRaw()
    setDailySuggestion(null)
  }
  const goToDate = (dateStr) => {
    goToDateRaw(dateStr)
    setDailySuggestion(null)
  }

  const weekStrip = useMemo(() => {
    const startDate = startOfWeekMonday(currentDate)

    return Array.from({ length: 7 }, (_, index) => {
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
  }, [currentDate, data])
  const weeklyReport = useMemo(
    () =>
      buildWeeklyReport({
        currentDate,
        currentDayData: data,
      }),
    [currentDate, data],
  )
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
      const startSlot =
        dropPreviewSlotRef.current ??
        resolveSlotFromFinalPosition(active, delta) ??
        resolveSlotFromPointerPosition(lastPointerRef.current) ??
        (overData?.type === 'TIMELINE_SLOT' ? overData.slotIndex : null) ??
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

  const handleAddCategory = (name, color) => {
    const result = addCategory(name, color)
    if (!result.ok) {
      showToast(result.error)
    } else {
      showToast('카테고리를 추가했습니다')
    }

    return result
  }

  const handleUpdateCategory = (id, name, color) => {
    const result = updateCategory(id, name, color)
    if (!result.ok) {
      showToast(result.error)
    } else {
      showToast('카테고리를 저장했습니다')
    }

    return result
  }

  const handleDeleteCategory = (id) => {
    removeCategory(id)
    clearTimeBoxCategory(id)
    showToast('카테고리를 삭제했습니다')
  }

  const handleImported = () => {
    reloadCategories()
    reloadCurrentDay()
  }

  const dumpSection = (
    <BrainDump
      items={data.brainDump}
      onAdd={addBrainDumpItem}
      onRemove={removeBrainDumpItem}
      onSendToBigThree={handleSendToBigThree}
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
      categories={categories}
      weeklyReport={weeklyReport}
      suggestionMessage={dailySuggestion?.forDate === currentDate ? dailySuggestion.message : null}
      onDismissSuggestion={() => setDailySuggestion(null)}
      dropPreviewSlot={dropPreviewSlot}
      movingTimeBoxPreview={movingTimeBoxPreview}
      slotHeight={timelineSlotHeight}
      timelineScale={timelineScale}
      onTimelineScaleChange={setTimelineScale}
      addTimeBox={addTimeBox}
      updateTimeBox={updateTimeBox}
      removeTimeBox={removeTimeBox}
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
      <div className="dark h-screen bg-gray-900 text-gray-100">
        <div className="flex h-full flex-col overflow-hidden bg-gray-900">
          <Header
            currentDate={currentDate}
            goNextDay={goNextDay}
            goPrevDay={goPrevDay}
            weekStrip={weekStrip}
            goToDate={goToDate}
            bigThreeProgress={bigThreeProgress}
          />

          <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
            <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-gray-700">
              {dumpSection}
              {bigThreeSection}
            </aside>
            <main className="flex-1 overflow-y-auto">{timelineSection}</main>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:hidden">
            {mobileTab === 'dump' ? dumpSection : null}
            {mobileTab === 'big3' ? bigThreeSection : null}
            {mobileTab === 'timeline' ? timelineSection : null}
          </div>

          <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-700 bg-gray-800 md:hidden">
            <div className="grid grid-cols-3">
              <button
                type="button"
                onClick={() => setMobileTab('dump')}
                className={`px-3 py-3 text-sm ${
                  mobileTab === 'dump' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                덤프
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('big3')}
                className={`px-3 py-3 text-sm ${
                  mobileTab === 'big3' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                빅3
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('timeline')}
                className={`px-3 py-3 text-sm ${
                  mobileTab === 'timeline'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                타임라인
              </button>
            </div>
          </nav>
        </div>

        <ToastContainer />
        <FloatingActionDock
          onOpenCategory={() => setIsCategoryManagerOpen(true)}
          onOpenData={() => setIsDataModalOpen(true)}
        />
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
      </div>
      <DragOverlay>
        {activeDragPreview ? (
          <div className="pointer-events-none max-w-xs rounded border border-indigo-400 bg-indigo-600/90 px-3 py-2 text-sm text-white shadow-lg">
            {activeDragPreview.content}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default App
