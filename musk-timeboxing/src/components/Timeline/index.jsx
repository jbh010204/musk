import { useMemo, useState } from 'react'
import { getCategoryColor, getCategoryLabel } from '../../utils/categoryVisual'
import { hasOverlap, TOTAL_SLOTS } from '../../utils/timeSlot'
import CompletionModal from './CompletionModal'
import DailyRecapCard from './DailyRecapCard'
import TimeBoxCard from './TimeBoxCard'
import TimeSlotGrid from './TimeSlotGrid'
import WeeklyReportCard from './WeeklyReportCard'

const SLOT_HEIGHT = 32
const DEFAULT_BOX_SLOTS = 1
const DURATION_PRESETS = [1, 2, 3, 4]

function Timeline({
  data,
  categories,
  weeklyReport,
  addTimeBox,
  updateTimeBox,
  removeTimeBox,
  showToast,
  showDropGuide = false,
}) {
  const [pendingInput, setPendingInput] = useState(null)
  const [selectedBoxId, setSelectedBoxId] = useState(null)
  const [resizePreview, setResizePreview] = useState({})
  const [isComposing, setIsComposing] = useState(false)

  const sortedBoxes = useMemo(
    () => [...data.timeBoxes].sort((a, b) => a.startSlot - b.startSlot),
    [data.timeBoxes],
  )
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const selectedBox = useMemo(
    () => data.timeBoxes.find((box) => box.id === selectedBoxId) || null,
    [data.timeBoxes, selectedBoxId],
  )
  const categoryLegend = useMemo(() => {
    const legendMap = new Map()

    sortedBoxes.forEach((box) => {
      const meta = box.categoryId ? categoryMap.get(box.categoryId) : null
      const label = getCategoryLabel(meta, box)

      if (!label) {
        return
      }

      const key = meta?.id || `legacy:${label.toLowerCase()}`
      if (legendMap.has(key)) {
        return
      }

      legendMap.set(key, {
        key,
        label,
        color: getCategoryColor(meta, box),
      })
    })

    return [...legendMap.values()]
  }, [categoryMap, sortedBoxes])

  const createBox = ({ content, sourceId = null, startSlot, durationSlots = DEFAULT_BOX_SLOTS }) => {
    const duration = Math.max(1, Math.min(TOTAL_SLOTS, Number(durationSlots) || DEFAULT_BOX_SLOTS))
    const newBox = {
      content,
      sourceId,
      startSlot,
      endSlot: Math.min(startSlot + duration, TOTAL_SLOTS),
    }

    if (hasOverlap(data.timeBoxes, newBox)) {
      showToast('해당 시간에 이미 일정이 있습니다')
      return false
    }

    addTimeBox(newBox)
    return true
  }

  const handleSlotClick = (slotIndex) => {
    setPendingInput({ slotIndex, content: '', durationSlots: DEFAULT_BOX_SLOTS })
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

    const created = createBox({
      content,
      startSlot: pendingInput.slotIndex,
      durationSlots: pendingInput.durationSlots,
    })
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
      {showDropGuide ? (
        <div
          data-testid="timeline-drop-guide"
          className="mb-3 rounded border border-indigo-400/70 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100"
        >
          브레인 덤프/빅3 항목을 원하는 시간 슬롯에 드롭하면 일정이 추가됩니다.
        </div>
      ) : null}
      <WeeklyReportCard report={weeklyReport} />
      <DailyRecapCard timeBoxes={sortedBoxes} categoryMap={categoryMap} />

      {categoryLegend.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {categoryLegend.map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-1 rounded border border-gray-700 bg-gray-800/70 px-2 py-1 text-xs text-gray-200"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="relative min-w-[520px]">
          <TimeSlotGrid onSlotClick={handleSlotClick} showDropGuide={showDropGuide} />

          <div className="pointer-events-none absolute inset-y-0 left-16 right-2">
            {sortedBoxes.map((box) => (
              <TimeBoxCard
                key={box.id}
                timeBox={box}
                slotHeight={SLOT_HEIGHT}
                previewEndSlot={resizePreview[box.id]}
                onResizePreview={handleResizePreview}
                onResizeEnd={handleResizeEnd}
                categoryMeta={box.categoryId ? categoryMap.get(box.categoryId) : null}
                onTimeBoxClick={(timeBox) => setSelectedBoxId(timeBox.id)}
              />
            ))}

            {pendingInput ? (
              <div
                className="pointer-events-auto absolute left-0 right-0 z-20 flex items-center gap-2 rounded border border-indigo-500 bg-gray-800 px-2 py-1"
                style={{
                  top: pendingInput.slotIndex * SLOT_HEIGHT,
                }}
              >
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
                  onBlur={(event) => {
                    const related = event.relatedTarget
                    if (related && related.dataset.durationPreset) {
                      return
                    }
                    setPendingInput(null)
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                  placeholder="일정을 입력하고 엔터 (기본 30분)"
                />
                <div className="flex items-center gap-1">
                  {DURATION_PRESETS.map((presetSlots) => {
                    const isActive = pendingInput.durationSlots === presetSlots
                    return (
                      <button
                        key={presetSlots}
                        type="button"
                        data-duration-preset="true"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          setPendingInput((prev) =>
                            prev ? { ...prev, durationSlots: presetSlots } : prev,
                          )
                        }
                        className={`rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                        aria-label={`${presetSlots * 30}분 프리셋`}
                      >
                        {presetSlots * 30}분
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedBox ? (
        <CompletionModal
          key={selectedBox.id}
          timeBox={selectedBox}
          categories={categories}
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
