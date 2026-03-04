import { useEffect, useState } from 'react'
import { loadDay, saveDay } from '../utils/storage'
import { TOTAL_SLOTS } from '../utils/timeSlot'

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

const createId = () => crypto.randomUUID()

export const useDailyData = () => {
  const today = formatDate(new Date())
  const [currentDate, setCurrentDate] = useState(today)
  const [data, setData] = useState(() => loadDay(today))

  useEffect(() => {
    setData(loadDay(currentDate))
  }, [currentDate])

  useEffect(() => {
    saveDay(currentDate, data)
  }, [currentDate, data])

  const goNextDay = () => {
    setCurrentDate((prev) => shiftDate(prev, 1))
  }

  const goPrevDay = () => {
    setCurrentDate((prev) => shiftDate(prev, -1))
  }

  const addBrainDumpItem = (content) => {
    const trimmed = content.trim()
    if (!trimmed) return

    setData((prev) => ({
      ...prev,
      brainDump: [...prev.brainDump, { id: createId(), content: trimmed, isDone: false }],
    }))
  }

  const removeBrainDumpItem = (id) => {
    setData((prev) => ({
      ...prev,
      brainDump: prev.brainDump.filter((item) => item.id !== id),
    }))
  }

  const sendToBigThree = (brainDumpId) => {
    let inserted = false

    setData((prev) => {
      if (prev.bigThree.length >= 3) {
        return prev
      }

      const source = prev.brainDump.find((item) => item.id === brainDumpId)
      if (!source) {
        return prev
      }

      inserted = true
      return {
        ...prev,
        bigThree: [
          ...prev.bigThree,
          {
            id: createId(),
            content: source.content,
            sourceId: source.id,
          },
        ],
      }
    })

    return inserted
  }

  const addBigThreeItem = (content) => {
    const trimmed = content.trim()
    if (!trimmed) return false

    let inserted = false

    setData((prev) => {
      if (prev.bigThree.length >= 3) {
        return prev
      }

      inserted = true
      return {
        ...prev,
        bigThree: [...prev.bigThree, { id: createId(), content: trimmed, sourceId: null }],
      }
    })

    return inserted
  }

  const removeBigThreeItem = (id) => {
    setData((prev) => ({
      ...prev,
      bigThree: prev.bigThree.filter((item) => item.id !== id),
    }))
  }

  const addTimeBox = ({ content, sourceId, startSlot, endSlot }) => {
    const trimmed = String(content || '').trim()
    if (!trimmed) return null

    const normalizedStart = Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(startSlot) || 0))
    const normalizedEnd = Math.max(
      normalizedStart + 1,
      Math.min(TOTAL_SLOTS, Number(endSlot) || normalizedStart + 1),
    )

    const id = createId()

    setData((prev) => ({
      ...prev,
      timeBoxes: [
        ...prev.timeBoxes,
        {
          id,
          content: trimmed,
          sourceId: sourceId ?? null,
          startSlot: normalizedStart,
          endSlot: normalizedEnd,
          status: 'PLANNED',
          actualMinutes: null,
        },
      ],
    }))

    return id
  }

  const updateTimeBox = (id, changes) => {
    setData((prev) => ({
      ...prev,
      timeBoxes: prev.timeBoxes.map((box) => {
        if (box.id !== id) {
          return box
        }

        return {
          ...box,
          ...changes,
          content:
            typeof changes?.content === 'string' && changes.content.trim().length > 0
              ? changes.content
              : box.content,
        }
      }),
    }))
  }

  const removeTimeBox = (id) => {
    setData((prev) => ({
      ...prev,
      timeBoxes: prev.timeBoxes.filter((box) => box.id !== id),
    }))
  }

  return {
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
    removeTimeBox,
  }
}
