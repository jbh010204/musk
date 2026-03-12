import { useEffect, useState } from 'react'
import {
  DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
  addManualBigThreeItem,
  addManyTaskCardsToBigThree,
  addTaskCardRecord,
  addTaskCardToBigThree,
  addTimeBoxRecord,
  applyTaskCardBoardLayout as applyTaskCardBoardLayoutCommand,
  autofillBigThreeFromTaskCards,
  clearTaskCardCategory,
  clearTimeBoxCategoryRecord,
  completeTimeBoxByTimerRecord,
  createCarryOverTimeBoxRecord,
  cycleTaskCardPriority,
  findAvailableStartSlot,
  getMostRecentStoredDate,
  loadLastActiveDate,
  loadLastFocus,
  loadPlannerDayModel,
  normalizeStackCanvasState,
  removeTaskCardRecord,
  removeBigThreeItemRecord,
  removeTimeBoxRecord,
  restoreTaskCardRecord,
  restoreTimeBoxRecord,
  saveLastActiveDate,
  saveLastFocus,
  savePlannerDayModel,
  startTimeBoxTimerRecord,
  syncTaskCardLinksWithTimeBoxes,
  TOTAL_SLOTS,
  updateTimeBoxRecord,
  updateTaskCardRecord,
  pauseTimeBoxTimerRecord,
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

const syncTaskCardLinks = (taskCards, timeBoxes) => syncTaskCardLinksWithTimeBoxes(taskCards, timeBoxes)

export const useDailyData = () => {
  const today = formatDate(new Date())
  const initialDate = loadLastActiveDate() ?? getMostRecentStoredDate() ?? today
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [data, setData] = useState(() => loadPlannerDayModel(initialDate))
  const [lastFocus, setLastFocus] = useState(() => loadLastFocus())

  useEffect(() => {
    savePlannerDayModel(currentDate, data)
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
    const source = fromDate === currentDate ? data : loadPlannerDayModel(fromDate)
    const target = loadPlannerDayModel(toDate)
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

      const nextBox = createCarryOverTimeBoxRecord(box, {
        fromDate,
        startSlot,
        createId,
      })
      if (!nextBox) {
        skipped += 1
        return
      }

      nextBoxes.push(nextBox)
      moved += 1
    })

    if (moved > 0) {
      savePlannerDayModel(toDate, {
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
    setData(loadPlannerDayModel(nextDate))
    return result
  }

  const goPrevDay = () => {
    const prevDate = shiftDate(currentDate, -1)
    setCurrentDate(prevDate)
    setData(loadPlannerDayModel(prevDate))
  }

  const goToDate = (dateStr) => {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return
    }

    setCurrentDate(dateStr)
    setData(loadPlannerDayModel(dateStr))
  }

  const addTaskCard = (title) => {
    const trimmed = title.trim()
    if (!trimmed) return

    setData((prev) => ({
      ...prev,
      taskCards: addTaskCardRecord(prev.taskCards, {
        title: trimmed,
        isDone: false,
        priority: 0,
        categoryId: null,
        estimateSlots: DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
        linkedTimeBoxIds: [],
        note: '',
        origin: 'list',
      }),
    }))
  }

  const addBoardCard = ({ title, categoryId = null, estimateSlots = 1, note = '' }) => {
    const trimmed = String(title || '').trim()
    if (!trimmed) {
      return false
    }

    setData((prev) => ({
      ...prev,
      taskCards: addTaskCardRecord(prev.taskCards, {
        title: trimmed,
        isDone: false,
        priority: 0,
        categoryId,
        estimateSlots,
        linkedTimeBoxIds: [],
        note,
        origin: 'board',
      }),
    }))

    return true
  }

  const removeTaskCard = (id) => {
    setData((prev) => ({
      ...prev,
      taskCards: removeTaskCardRecord(prev.taskCards, id),
    }))
  }

  const restoreTaskCard = (item, index = null) => {
    let restored = false
    setData((prev) => {
      const nextTaskCards = restoreTaskCardRecord(prev.taskCards, item, index)
      restored = nextTaskCards.length !== prev.taskCards.length

      return {
        ...prev,
        taskCards: nextTaskCards,
      }
    })

    return restored
  }

  const cycleTaskCardItemPriority = (id) => {
    let nextPriority = null

    setData((prev) => {
      const { nextTaskCards, nextPriority: resolvedPriority } = cycleTaskCardPriority(prev.taskCards, id)
      if (nextTaskCards === prev.taskCards) {
        return prev
      }
      nextPriority = resolvedPriority

      return {
        ...prev,
        taskCards: nextTaskCards,
      }
    })

    return nextPriority
  }

  const updateTaskCard = (id, changes = {}) => {
    setData((prev) => {
      const nextTaskCards = updateTaskCardRecord(prev.taskCards, id, changes)

      return {
        ...prev,
        taskCards: syncTaskCardLinks(nextTaskCards, prev.timeBoxes),
      }
    })
  }

  const applyTaskCardBoardLayout = (layoutEntries = []) => {
    setData((prev) => ({
      ...prev,
      taskCards: applyTaskCardBoardLayoutCommand(prev.taskCards, layoutEntries),
    }))
  }

  const clearTaskCardCategoryState = (categoryId) => {
    setData((prev) => ({
      ...prev,
      taskCards: syncTaskCardLinks(clearTaskCardCategory(prev.taskCards, categoryId), prev.timeBoxes),
    }))
  }

  const sendToBigThree = (taskCardId) => {
    let inserted = false

    setData((prev) => {
      const { inserted: didInsert, nextBigThree } = addTaskCardToBigThree(
        prev.bigThree,
        prev.taskCards,
        taskCardId,
        createId,
      )
      if (!didInsert) {
        return prev
      }

      inserted = didInsert
      return {
        ...prev,
        bigThree: nextBigThree,
      }
    })

    return inserted
  }

  const sendManyToBigThree = (taskCardIds = []) => {
    let insertedCount = 0

    setData((prev) => {
      const { insertedCount: nextInsertedCount, nextBigThree } = addManyTaskCardsToBigThree(
        prev.bigThree,
        prev.taskCards,
        taskCardIds,
        createId,
      )
      if (nextInsertedCount === 0) {
        return prev
      }

      insertedCount = nextInsertedCount
      return {
        ...prev,
        bigThree: nextBigThree,
      }
    })

    return insertedCount
  }

  const fillBigThreeFromTaskCards = () => {
    let insertedCount = 0

    setData((prev) => {
      const { insertedCount: nextInsertedCount, nextBigThree } = autofillBigThreeFromTaskCards(
        prev.bigThree,
        prev.taskCards,
        createId,
      )
      if (nextInsertedCount === 0) {
        return prev
      }

      insertedCount = nextInsertedCount
      return {
        ...prev,
        bigThree: nextBigThree,
      }
    })

    return insertedCount
  }

  const addBigThreeItem = (content) => {
    let inserted = false

    setData((prev) => {
      const { inserted: didInsert, nextBigThree } = addManualBigThreeItem(
        prev.bigThree,
        content,
        createId,
      )
      if (!didInsert) {
        return prev
      }

      inserted = didInsert
      return {
        ...prev,
        bigThree: nextBigThree,
      }
    })

    return inserted
  }

  const removeBigThreeItem = (id) => {
    setData((prev) => ({
      ...prev,
      bigThree: removeBigThreeItemRecord(prev.bigThree, id),
    }))
  }

  const addTimeBox = ({ content, taskId, startSlot, endSlot, category = null, categoryId = null }) => {
    let insertedId = null

    setData((prev) => {
      const { insertedId: nextInsertedId, nextTimeBoxes } = addTimeBoxRecord(
        prev.timeBoxes,
        {
          content,
          taskId,
          startSlot,
          endSlot,
          category,
          categoryId,
        },
        createId,
      )
      if (!nextInsertedId) {
        return prev
      }

      insertedId = nextInsertedId

      return {
        ...prev,
        taskCards: syncTaskCardLinks(prev.taskCards, nextTimeBoxes),
        timeBoxes: nextTimeBoxes,
      }
    })

    if (insertedId) {
      const resolvedStart = Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(startSlot) || 0))
      rememberFocus(resolvedStart)
    }

    return insertedId
  }

  const updateTimeBox = (id, changes) => {
    if (Number.isInteger(changes?.startSlot)) {
      rememberFocus(changes.startSlot)
    }

    setData((prev) => {
      const nextTimeBoxes = updateTimeBoxRecord(prev.timeBoxes, id, changes)

      return {
        ...prev,
        taskCards: syncTaskCardLinks(prev.taskCards, nextTimeBoxes),
        timeBoxes: nextTimeBoxes,
      }
    })
  }

  const startTimeBoxTimer = (id) => {
    const now = Date.now()

    setData((prev) => {
      const nextTimeBoxes = startTimeBoxTimerRecord(prev.timeBoxes, id, now)

      return {
        ...prev,
        taskCards: syncTaskCardLinks(prev.taskCards, nextTimeBoxes),
        timeBoxes: nextTimeBoxes,
      }
    })
  }

  const pauseTimeBoxTimer = (id) => {
    const now = Date.now()
    setData((prev) => {
      const nextTimeBoxes = pauseTimeBoxTimerRecord(prev.timeBoxes, id, now)

      return {
        ...prev,
        taskCards: syncTaskCardLinks(prev.taskCards, nextTimeBoxes),
        timeBoxes: nextTimeBoxes,
      }
    })
  }

  const completeTimeBoxByTimer = (id) => {
    const now = Date.now()
    setData((prev) => {
      const nextTimeBoxes = completeTimeBoxByTimerRecord(prev.timeBoxes, id, now)

      return {
        ...prev,
        taskCards: syncTaskCardLinks(prev.taskCards, nextTimeBoxes),
        timeBoxes: nextTimeBoxes,
      }
    })
  }

  const clearTimeBoxCategory = (categoryId) => {
    setData((prev) => ({
      ...prev,
      timeBoxes: clearTimeBoxCategoryRecord(prev.timeBoxes, categoryId),
    }))
  }

  const removeTimeBox = (id) => {
    setData((prev) => {
      const nextTimeBoxes = removeTimeBoxRecord(prev.timeBoxes, id)

      return {
        ...prev,
        taskCards: syncTaskCardLinks(prev.taskCards, nextTimeBoxes),
        timeBoxes: nextTimeBoxes,
      }
    })
  }

  const restoreTimeBox = (timeBox) => {
    let restored = false

    setData((prev) => {
      const { restored: didRestore, nextTimeBoxes } = restoreTimeBoxRecord(prev.timeBoxes, timeBox)
      if (!didRestore) {
        return prev
      }

      restored = didRestore

      return {
        ...prev,
        taskCards: syncTaskCardLinks(prev.taskCards, nextTimeBoxes),
        timeBoxes: nextTimeBoxes,
      }
    })

    if (restored) {
      const resolvedStart = Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(timeBox?.startSlot) || 0))
      rememberFocus(resolvedStart)
    }

    return restored
  }

  const reloadCurrentDay = () => {
    setData(loadPlannerDayModel(currentDate))
  }

  const updateStackCanvasState = (nextStackCanvasState) => {
    setData((prev) => {
      const resolved =
        typeof nextStackCanvasState === 'function' ? nextStackCanvasState(prev.stackCanvasState) : nextStackCanvasState

      return {
        ...prev,
        stackCanvasState: normalizeStackCanvasState({
          ...prev.stackCanvasState,
          ...resolved,
          lastSyncedAt: Date.now(),
        }),
      }
    })
  }

  return {
    currentDate,
    data,
    lastFocus,
    goNextDay,
    goPrevDay,
    goToDate,
    addTaskCard,
    addBoardCard,
    removeTaskCard,
    restoreTaskCard,
    cycleTaskCardItemPriority,
    updateTaskCard,
    applyTaskCardBoardLayout,
    clearTaskCardCategoryState,
    sendToBigThree,
    sendManyToBigThree,
    fillBigThreeFromTaskCards,
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
  }
}
