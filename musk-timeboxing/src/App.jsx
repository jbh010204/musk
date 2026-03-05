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
import { hasOverlap, TOTAL_SLOTS } from './utils/timeSlot'

const DEFAULT_BOX_SLOTS = 1
const SLOT_HEIGHT = 32
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const parseDate = (dateStr) => new Date(`${dateStr}T00:00:00`)
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const getVisibleTimelineGridAtPoint = (clientX, clientY) => {
  if (typeof document === 'undefined') {
    return null
  }

  const grids = [...document.querySelectorAll('[data-timeline-grid="true"]')]
  return (
    grids.find((grid) => {
      const rect = grid.getBoundingClientRect()
      if (rect.width < 40 || rect.height < SLOT_HEIGHT) {
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
  const rowHeight = Math.max(1, Number(firstSlot?.getBoundingClientRect?.().height) || SLOT_HEIGHT)
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
    goPrevDay,
    goToDate,
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
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [activeDragPreview, setActiveDragPreview] = useState(null)
  const lastPointerRef = useRef(null)
  const pointerTrackingRef = useRef(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const goNextDay = () => {
    const result = goNextDayRaw({ autoCarry: true })

    if (result.moved > 0) {
      showToast(`미완료 일정 ${result.moved}건을 다음 날로 이월했습니다`)
      return
    }

    if (result.skipped > 0) {
      showToast(`이월 가능한 일정이 없어 ${result.skipped}건을 건너뛰었습니다`)
    }
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

  const handleSendToBigThree = (brainDumpId) => {
    const success = sendToBigThree(brainDumpId)

    if (!success) {
      showToast('빅 3이 이미 가득 찼습니다')
    }
  }

  const trackPointerMove = (event) => {
    lastPointerRef.current = {
      clientX: Number(event?.clientX),
      clientY: Number(event?.clientY),
    }
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
    lastPointerRef.current = {
      clientX: Number(activatorEvent?.clientX),
      clientY: Number(activatorEvent?.clientY),
    }

    if (!payload) {
      setActiveDragPreview(null)
      return
    }

    startPointerTracking()

    if (payload.type === 'BRAIN_DUMP' || payload.type === 'BIG_THREE') {
      setActiveDragPreview({
        type: payload.type,
        content: payload.content,
      })
      return
    }

    setActiveDragPreview(null)
  }

  const handleDragCancel = () => {
    setActiveDragPreview(null)
    lastPointerRef.current = null
    stopPointerTracking()
  }

  const handleDragEnd = ({ active, over, delta }) => {
    setActiveDragPreview(null)
    const finalize = () => {
      lastPointerRef.current = null
      stopPointerTracking()
    }

    const activeData = active.data.current

    if (!activeData) {
      finalize()
      return
    }

    if (activeData.type === 'TIME_BOX') {
      const activeStart = Number(activeData.startSlot) || 0
      const activeEnd = Number(activeData.endSlot) || activeStart + 1
      const duration = Math.max(1, activeEnd - activeStart)
      const slotDelta = Math.round((delta?.y ?? 0) / SLOT_HEIGHT)

      if (slotDelta === 0) {
        finalize()
        return
      }

      let startSlot = activeStart + slotDelta
      startSlot = Math.max(0, Math.min(startSlot, TOTAL_SLOTS - duration))
      let endSlot = startSlot + duration

      if (endSlot > TOTAL_SLOTS) {
        endSlot = TOTAL_SLOTS
        startSlot = Math.max(0, endSlot - duration)
      }

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
