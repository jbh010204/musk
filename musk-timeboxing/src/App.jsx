import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
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

  const handleDragEnd = ({ active, over, delta }) => {
    const activeData = active.data.current

    if (!activeData) {
      return
    }

    if (activeData.type === 'TIME_BOX') {
      const activeStart = Number(activeData.startSlot) || 0
      const activeEnd = Number(activeData.endSlot) || activeStart + 1
      const duration = Math.max(1, activeEnd - activeStart)
      const slotDelta = Math.round((delta?.y ?? 0) / SLOT_HEIGHT)

      if (slotDelta === 0) {
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
        return
      }

      const movedBox = {
        startSlot,
        endSlot,
      }

      if (hasOverlap(data.timeBoxes, movedBox, activeData.id)) {
        showToast('해당 시간에 이미 일정이 있습니다')
        return
      }

      updateTimeBox(activeData.id, { startSlot, endSlot })
      return
    }

    if (!over) {
      return
    }

    const overData = over.data.current

    if (!overData) {
      return
    }

    if (activeData.type === 'BRAIN_DUMP' && overData.type === 'BIG_THREE_SLOT') {
      const success = sendToBigThree(activeData.id)
      if (!success) {
        showToast('빅 3이 이미 가득 찼습니다')
      }
      return
    }

    if (
      (activeData.type === 'BRAIN_DUMP' || activeData.type === 'BIG_THREE') &&
      overData.type === 'TIMELINE_SLOT'
    ) {
      const startSlot = overData.slotIndex
      const endSlot = Math.min(startSlot + DEFAULT_BOX_SLOTS, TOTAL_SLOTS)
      const newBox = {
        content: activeData.content,
        sourceId: activeData.id,
        startSlot,
        endSlot,
      }

      if (hasOverlap(data.timeBoxes, newBox)) {
        showToast('해당 시간에 이미 일정이 있습니다')
        return
      }

      addTimeBox(newBox)
      return
    }

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
    />
  )

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
    </DndContext>
  )
}

export default App
