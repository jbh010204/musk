import { useEffect, useState } from 'react'
import { loadDay, saveDay } from '../utils/storage'
import { hasOverlap, TOTAL_SLOTS } from '../utils/timeSlot'

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
const normalizeCategory = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
const normalizeCategoryId = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
const normalizeSkipReason = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const clampSlot = (value) => Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(value) || 0))

const findAvailableStartSlot = (timeBoxes, preferredStart, duration) => {
  const normalizedDuration = Math.max(1, Math.min(TOTAL_SLOTS, Number(duration) || 1))
  const maxStart = TOTAL_SLOTS - normalizedDuration
  const safePreferred = Math.max(0, Math.min(maxStart, clampSlot(preferredStart)))
  const findFrom = (startIndex) => {
    for (let slot = startIndex; slot <= maxStart; slot += 1) {
      const candidate = {
        startSlot: slot,
        endSlot: slot + normalizedDuration,
      }

      if (!hasOverlap(timeBoxes, candidate)) {
        return slot
      }
    }

    return null
  }

  return findFrom(safePreferred) ?? findFrom(0)
}

export const useDailyData = () => {
  const today = formatDate(new Date())
  const [currentDate, setCurrentDate] = useState(today)
  const [data, setData] = useState(() => loadDay(today))

  useEffect(() => {
    saveDay(currentDate, data)
  }, [currentDate, data])

  const carryOverUnfinished = (fromDate, toDate) => {
    const source = fromDate === currentDate ? data : loadDay(fromDate)
    const target = loadDay(toDate)
    const nextBoxes = [...target.timeBoxes]
    const pendingBoxes = source.timeBoxes.filter((box) => box.status !== 'COMPLETED')
    let moved = 0
    let skipped = 0

    pendingBoxes.forEach((box) => {
      const alreadyMoved = nextBoxes.some(
        (targetBox) =>
          targetBox.carryOverFromDate === fromDate && targetBox.carryOverFromBoxId === box.id,
      )

      if (alreadyMoved) {
        skipped += 1
        return
      }

      const duration = Math.max(1, Math.min(TOTAL_SLOTS, box.endSlot - box.startSlot))
      const startSlot = findAvailableStartSlot(nextBoxes, box.startSlot, duration)

      if (startSlot == null) {
        skipped += 1
        return
      }

      nextBoxes.push({
        id: createId(),
        content: box.content,
        sourceId: box.sourceId ?? null,
        startSlot,
        endSlot: startSlot + duration,
        status: 'PLANNED',
        actualMinutes: null,
        category: normalizeCategory(box.category),
        categoryId: normalizeCategoryId(box.categoryId),
        skipReason: normalizeSkipReason(box.skipReason),
        carryOverFromDate: fromDate,
        carryOverFromBoxId: box.id,
      })
      moved += 1
    })

    if (moved > 0) {
      saveDay(toDate, {
        ...target,
        timeBoxes: nextBoxes,
      })
    }

    return {
      moved,
      skipped,
    }
  }

  const goNextDay = (options = {}) => {
    const nextDate = shiftDate(currentDate, 1)
    const shouldCarry = options.autoCarry !== false
    const result = shouldCarry ? carryOverUnfinished(currentDate, nextDate) : { moved: 0, skipped: 0 }
    setCurrentDate(nextDate)
    setData(loadDay(nextDate))
    return result
  }

  const goPrevDay = () => {
    const prevDate = shiftDate(currentDate, -1)
    setCurrentDate(prevDate)
    setData(loadDay(prevDate))
  }

  const goToDate = (dateStr) => {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return
    }

    setCurrentDate(dateStr)
    setData(loadDay(dateStr))
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

  const addTimeBox = ({ content, sourceId, startSlot, endSlot, category = null, categoryId = null }) => {
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
          category: normalizeCategory(category),
          categoryId: normalizeCategoryId(categoryId),
          skipReason: null,
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
          category:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'category')
              ? normalizeCategory(changes?.category)
              : box.category ?? null,
          categoryId:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'categoryId')
              ? normalizeCategoryId(changes?.categoryId)
              : box.categoryId ?? null,
          skipReason:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'skipReason')
              ? normalizeSkipReason(changes?.skipReason)
              : box.skipReason ?? null,
        }
      }),
    }))
  }

  const clearTimeBoxCategory = (categoryId) => {
    setData((prev) => ({
      ...prev,
      timeBoxes: prev.timeBoxes.map((box) =>
        box.categoryId === categoryId ? { ...box, categoryId: null } : box,
      ),
    }))
  }

  const removeTimeBox = (id) => {
    setData((prev) => ({
      ...prev,
      timeBoxes: prev.timeBoxes.filter((box) => box.id !== id),
    }))
  }

  const reloadCurrentDay = () => {
    setData(loadDay(currentDate))
  }

  return {
    currentDate,
    data,
    goNextDay,
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
  }
}
