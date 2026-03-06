import { useEffect, useState } from 'react'
import {
  cycleBrainDumpPriority,
  getMostRecentStoredDate,
  hasOverlap,
  loadDay,
  loadLastActiveDate,
  loadLastFocus,
  normalizeBrainDumpPriority,
  saveDay,
  saveLastActiveDate,
  saveLastFocus,
  sortBrainDumpItems,
  TOTAL_SLOTS,
} from '../../entities/planner'

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
const normalizeBrainDumpItem = (item) => {
  const content = typeof item?.content === 'string' ? item.content.trim() : ''
  if (!content) {
    return null
  }

  return {
    id: typeof item?.id === 'string' ? item.id : createId(),
    content,
    isDone: Boolean(item?.isDone),
    priority: normalizeBrainDumpPriority(item?.priority),
  }
}
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
const normalizeStatus = (value) =>
  value === 'PLANNED' || value === 'COMPLETED' || value === 'SKIPPED' ? value : 'PLANNED'
const normalizeActualMinutes = (value) => (Number.isFinite(value) ? Number(value) : null)
const normalizeElapsedSeconds = (value) => (Number.isFinite(value) ? Math.max(0, Number(value)) : 0)

const normalizeRestoredTimeBox = (box) => {
  const content = typeof box?.content === 'string' ? box.content.trim() : ''
  if (!content) {
    return null
  }

  const startSlot = clampSlot(box?.startSlot)
  const endSlot = Math.max(startSlot + 1, Math.min(TOTAL_SLOTS, Number(box?.endSlot) || startSlot + 1))

  return {
    id: typeof box?.id === 'string' ? box.id : createId(),
    content,
    sourceId: box?.sourceId ?? null,
    startSlot,
    endSlot,
    status: normalizeStatus(box?.status),
    actualMinutes: normalizeActualMinutes(box?.actualMinutes),
    category: normalizeCategory(box?.category),
    categoryId: normalizeCategoryId(box?.categoryId),
    skipReason: normalizeSkipReason(box?.skipReason),
    carryOverFromDate:
      typeof box?.carryOverFromDate === 'string' && box.carryOverFromDate.trim().length > 0
        ? box.carryOverFromDate
        : null,
    carryOverFromBoxId:
      typeof box?.carryOverFromBoxId === 'string' && box.carryOverFromBoxId.trim().length > 0
        ? box.carryOverFromBoxId
        : null,
    timerStartedAt: Number.isFinite(box?.timerStartedAt) ? Number(box.timerStartedAt) : null,
    elapsedSeconds: normalizeElapsedSeconds(box?.elapsedSeconds),
  }
}

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
  const initialDate = loadLastActiveDate() ?? getMostRecentStoredDate() ?? today
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [data, setData] = useState(() => loadDay(initialDate))
  const [lastFocus, setLastFocus] = useState(() => loadLastFocus())

  useEffect(() => {
    saveDay(currentDate, data)
  }, [currentDate, data])

  useEffect(() => {
    saveLastActiveDate(currentDate)
  }, [currentDate])

  const rememberFocus = (slot) => {
    if (!Number.isInteger(slot)) {
      return
    }

    const focus = {
      date: currentDate,
      slot,
      ts: Date.now(),
    }

    setLastFocus(focus)
    saveLastFocus(focus)
  }

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
      brainDump: sortBrainDumpItems([
        ...prev.brainDump,
        { id: createId(), content: trimmed, isDone: false, priority: 0 },
      ]),
    }))
  }

  const removeBrainDumpItem = (id) => {
    setData((prev) => ({
      ...prev,
      brainDump: prev.brainDump.filter((item) => item.id !== id),
    }))
  }

  const restoreBrainDumpItem = (item, index = null) => {
    const normalized = normalizeBrainDumpItem(item)
    if (!normalized) {
      return false
    }

    let restored = false
    setData((prev) => {
      if (prev.brainDump.some((existing) => existing.id === normalized.id)) {
        return prev
      }

      const next = [...prev.brainDump]
      const insertAt = Number.isInteger(index)
        ? Math.max(0, Math.min(next.length, Number(index)))
        : next.length
      next.splice(insertAt, 0, normalized)
      restored = true

      return {
        ...prev,
        brainDump: sortBrainDumpItems(next),
      }
    })

    return restored
  }

  const cycleBrainDumpItemPriority = (id) => {
    let nextPriority = null

    setData((prev) => {
      const hasTarget = prev.brainDump.some((item) => item.id === id)
      if (!hasTarget) {
        return prev
      }

      const nextBrainDump = prev.brainDump.map((item) => {
        if (item.id !== id) {
          return item
        }

        nextPriority = cycleBrainDumpPriority(item.priority)

        return {
          ...item,
          priority: nextPriority,
        }
      })

      return {
        ...prev,
        brainDump: sortBrainDumpItems(nextBrainDump),
      }
    })

    return nextPriority
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

  const fillBigThreeFromBrainDump = () => {
    let insertedCount = 0

    setData((prev) => {
      if (prev.bigThree.length >= 3 || prev.brainDump.length === 0) {
        return prev
      }

      const remainSlots = 3 - prev.bigThree.length
      const existingSourceIds = new Set(
        prev.bigThree
          .map((item) => item.sourceId)
          .filter((sourceId) => typeof sourceId === 'string' && sourceId.length > 0),
      )
      const candidates = prev.brainDump
        .filter((item) => !existingSourceIds.has(item.id))
      const prioritizedCandidates = sortBrainDumpItems(candidates)
      const selectedCandidates = prioritizedCandidates
        .slice(0, remainSlots)

      if (selectedCandidates.length === 0) {
        return prev
      }

      insertedCount = selectedCandidates.length
      return {
        ...prev,
        bigThree: [
          ...prev.bigThree,
          ...selectedCandidates.map((source) => ({
            id: createId(),
            content: source.content,
            sourceId: source.id,
          })),
        ],
      }
    })

    return insertedCount
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
          timerStartedAt: null,
          elapsedSeconds: 0,
        },
      ],
    }))

    rememberFocus(normalizedStart)

    return id
  }

  const updateTimeBox = (id, changes) => {
    if (Number.isInteger(changes?.startSlot)) {
      rememberFocus(changes.startSlot)
    }

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
          timerStartedAt:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'timerStartedAt')
              ? changes?.timerStartedAt ?? null
              : box.timerStartedAt ?? null,
          elapsedSeconds:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'elapsedSeconds')
              ? Number(changes?.elapsedSeconds) || 0
              : box.elapsedSeconds ?? 0,
        }
      }),
    }))
  }

  const startTimeBoxTimer = (id) => {
    const now = Date.now()

    setData((prev) => ({
      ...prev,
      timeBoxes: prev.timeBoxes.map((box) => {
        if (box.id === id) {
          if (box.timerStartedAt) {
            return box
          }

          return {
            ...box,
            status: box.status === 'SKIPPED' ? 'PLANNED' : box.status,
            timerStartedAt: now,
          }
        }

        if (!box.timerStartedAt) {
          return box
        }

        return {
          ...box,
          timerStartedAt: null,
          elapsedSeconds:
            (Number(box.elapsedSeconds) || 0) + Math.max(0, Math.floor((now - box.timerStartedAt) / 1000)),
        }
      }),
    }))
  }

  const pauseTimeBoxTimer = (id) => {
    const now = Date.now()
    setData((prev) => ({
      ...prev,
      timeBoxes: prev.timeBoxes.map((box) => {
        if (box.id !== id || !box.timerStartedAt) {
          return box
        }

        return {
          ...box,
          timerStartedAt: null,
          elapsedSeconds:
            (Number(box.elapsedSeconds) || 0) + Math.max(0, Math.floor((now - box.timerStartedAt) / 1000)),
        }
      }),
    }))
  }

  const completeTimeBoxByTimer = (id) => {
    const now = Date.now()
    setData((prev) => ({
      ...prev,
      timeBoxes: prev.timeBoxes.map((box) => {
        if (box.id !== id) {
          return box
        }

        const totalSeconds =
          (Number(box.elapsedSeconds) || 0) +
          (box.timerStartedAt ? Math.max(0, Math.floor((now - box.timerStartedAt) / 1000)) : 0)

        const actualMinutes = Math.max(1, Math.round(totalSeconds / 60))

        return {
          ...box,
          status: 'COMPLETED',
          actualMinutes,
          skipReason: null,
          elapsedSeconds: totalSeconds,
          timerStartedAt: null,
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

  const restoreTimeBox = (timeBox) => {
    const normalized = normalizeRestoredTimeBox(timeBox)
    if (!normalized) {
      return false
    }

    let restored = false
    setData((prev) => {
      const existingIndex = prev.timeBoxes.findIndex((box) => box.id === normalized.id)
      const conflictExists = hasOverlap(prev.timeBoxes, normalized, normalized.id)

      if (conflictExists && existingIndex < 0) {
        return prev
      }

      if (existingIndex >= 0) {
        const next = [...prev.timeBoxes]
        next[existingIndex] = normalized
        restored = true

        return {
          ...prev,
          timeBoxes: next,
        }
      }

      restored = true
      return {
        ...prev,
        timeBoxes: [...prev.timeBoxes, normalized],
      }
    })

    if (restored) {
      rememberFocus(normalized.startSlot)
    }

    return restored
  }

  const reloadCurrentDay = () => {
    setData(loadDay(currentDate))
  }

  return {
    currentDate,
    data,
    lastFocus,
    goNextDay,
    goPrevDay,
    goToDate,
    addBrainDumpItem,
    removeBrainDumpItem,
    restoreBrainDumpItem,
    cycleBrainDumpItemPriority,
    sendToBigThree,
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
    reloadCurrentDay,
  }
}
