import { useMemo, useState } from 'react'
import { hasOverlap, TOTAL_SLOTS } from '../../utils/timeSlot'
import CompletionModal from './CompletionModal'
import TimeBoxCard from './TimeBoxCard'
import TimeSlotGrid from './TimeSlotGrid'

const SLOT_HEIGHT = 32
const DEFAULT_BOX_SLOTS = 1

function Timeline({ data, addTimeBox, updateTimeBox, removeTimeBox, showToast }) {
  const [pendingInput, setPendingInput] = useState(null)
  const [selectedBoxId, setSelectedBoxId] = useState(null)
  const [resizePreview, setResizePreview] = useState({})
  const [isComposing, setIsComposing] = useState(false)

  const sortedBoxes = useMemo(
    () => [...data.timeBoxes].sort((a, b) => a.startSlot - b.startSlot),
    [data.timeBoxes],
  )
  const selectedBox = useMemo(
    () => data.timeBoxes.find((box) => box.id === selectedBoxId) || null,
    [data.timeBoxes, selectedBoxId],
  )

  const createBox = ({ content, sourceId = null, startSlot }) => {
    const newBox = {
      content,
      sourceId,
      startSlot,
      endSlot: Math.min(startSlot + DEFAULT_BOX_SLOTS, TOTAL_SLOTS),
    }

    if (hasOverlap(data.timeBoxes, newBox)) {
      showToast('해당 시간에 이미 일정이 있습니다')
      return false
    }

    addTimeBox(newBox)
    return true
  }

  const handleSlotClick = (slotIndex) => {
    setPendingInput({ slotIndex, content: '' })
  }

  const handlePendingSubmit = () => {
    if (!pendingInput) {
      return
    }

    const content = pendingInput.content.trim()
    if (!content) {
      setPendingInput(null)
      return
    }

    const created = createBox({ content, startSlot: pendingInput.slotIndex })
    if (created) {
      setPendingInput(null)
    }
  }

  const handleResizePreview = (id, endSlot) => {
    setResizePreview((prev) => ({
      ...prev,
      [id]: endSlot,
    }))
  }

  const handleResizeEnd = (id, endSlot) => {
    const original = data.timeBoxes.find((box) => box.id === id)
    if (!original) {
      return
    }

    const nextBox = {
      ...original,
      endSlot,
    }

    if (hasOverlap(data.timeBoxes, nextBox, id)) {
      showToast('해당 시간에 이미 일정이 있습니다')
      setResizePreview((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      return
    }

    updateTimeBox(id, { endSlot })

    setResizePreview((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  return (
    <section className="h-full p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">⏱ 타임라인</h2>

      <div className="overflow-x-auto">
        <div className="relative min-w-[520px]">
          <TimeSlotGrid onSlotClick={handleSlotClick} />

          <div className="pointer-events-none absolute inset-y-0 left-16 right-2">
            {sortedBoxes.map((box) => (
              <TimeBoxCard
                key={box.id}
                timeBox={box}
                slotHeight={SLOT_HEIGHT}
                previewEndSlot={resizePreview[box.id]}
                onResizePreview={handleResizePreview}
                onResizeEnd={handleResizeEnd}
                onTimeBoxClick={(timeBox) => setSelectedBoxId(timeBox.id)}
              />
            ))}

            {pendingInput ? (
              <input
                type="text"
                autoFocus
                value={pendingInput.content}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onChange={(event) =>
                  setPendingInput((prev) => (prev ? { ...prev, content: event.target.value } : prev))
                }
                onKeyDown={(event) => {
                  const nativeComposing = event.nativeEvent?.isComposing || event.keyCode === 229

                  if (isComposing || nativeComposing) {
                    return
                  }

                  if (event.key === 'Enter') {
                    if (event.repeat) {
                      return
                    }

                    event.preventDefault()
                    handlePendingSubmit()
                  }

                  if (event.key === 'Escape') {
                    setPendingInput(null)
                  }
                }}
                onBlur={() => setPendingInput(null)}
                className="pointer-events-auto absolute left-0 right-0 z-20 rounded border border-indigo-500 bg-gray-800 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{
                  top: pendingInput.slotIndex * SLOT_HEIGHT,
                }}
                placeholder="일정을 입력하고 엔터 (기본 30분)"
              />
            ) : null}
          </div>
        </div>
      </div>

      {selectedBox ? (
        <CompletionModal
          key={selectedBox.id}
          timeBox={selectedBox}
          onClose={() => setSelectedBoxId(null)}
          onUpdate={updateTimeBox}
          onDelete={(id) => {
            removeTimeBox(id)
            setSelectedBoxId(null)
          }}
        />
      ) : null}
    </section>
  )
}

export default Timeline
