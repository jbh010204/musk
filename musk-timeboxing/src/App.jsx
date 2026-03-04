import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useState } from 'react'
import Header from './components/Header'
import BigThree from './components/LeftPanel/BigThree'
import BrainDump from './components/LeftPanel/BrainDump'
import Timeline from './components/Timeline'
import { useDailyData } from './hooks/useDailyData'
import { useToast } from './hooks/useToast'
import { hasOverlap, TOTAL_SLOTS } from './utils/timeSlot'

function App() {
  const {
    currentDate,
    data,
    goNextDay,
    goPrevDay,
    addBrainDumpItem,
    removeBrainDumpItem,
    sendToBigThree,
    addBigThreeItem,
    removeBigThreeItem,
    addTimeBox,
    updateTimeBox,
  } = useDailyData()

  const { showToast, ToastContainer } = useToast()
  const [mobileTab, setMobileTab] = useState('timeline')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleSendToBigThree = (brainDumpId) => {
    const success = sendToBigThree(brainDumpId)

    if (!success) {
      showToast('빅 3이 이미 가득 찼습니다')
    }
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over) {
      return
    }

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData || !overData) {
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
      const endSlot = Math.min(startSlot + 2, TOTAL_SLOTS)
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
    }
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
    <Timeline data={data} addTimeBox={addTimeBox} updateTimeBox={updateTimeBox} showToast={showToast} />
  )

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="dark h-screen bg-gray-900 text-gray-100">
        <div className="flex h-full flex-col overflow-hidden bg-gray-900">
          <Header currentDate={currentDate} goNextDay={goNextDay} goPrevDay={goPrevDay} />

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
      </div>
    </DndContext>
  )
}

export default App
