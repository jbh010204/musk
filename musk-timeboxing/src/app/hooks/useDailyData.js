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
  carryOverPlannerDay,
  clearTaskCardCategory,
  clearTimeBoxCategoryRecord,
  completeTimeBoxByTimerRecord,
  createLastFocusSnapshot,
  cycleTaskCardPriority,
  formatPlannerDate,
  getMostRecentStoredDate,
  isPlannerDateString,
  loadLastActiveDate,
  loadLastFocus,
  loadPlannerDayModel,
  removeTaskCardRecord,
  removeBigThreeItemRecord,
  removeTimeBoxRecord,
  restoreTaskCardRecord,
  restoreTimeBoxRecord,
  saveLastActiveDate,
  saveLastFocus,
  savePlannerDayModel,
  startTimeBoxTimerRecord,
  shiftPlannerDate,
  TOTAL_SLOTS,
  updateTimeBoxRecord,
  updateTaskCardRecord,
  pauseTimeBoxTimerRecord,
  replacePlannerDayBigThree,
  replacePlannerDayStackCanvasState,
  replacePlannerDayTaskCards,
  replacePlannerDayTimeBoxes,
} from '../../entities/planner'

const createId = () => crypto.randomUUID()

export const useDailyData = () => {
  const today = formatPlannerDate(new Date())
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
    const focus = createLastFocusSnapshot(currentDate, slot)
    if (!focus) {
      return
    }

    setLastFocus(focus)
    saveLastFocus(focus)
  }

  const goNextDay = (options = {}) => {
    const nextDate = shiftPlannerDate(currentDate, 1)
    const shouldCarry = options.autoCarry !== false
    const targetDay = loadPlannerDayModel(nextDate)
    const result = shouldCarry
      ? carryOverPlannerDay({
          fromDate: currentDate,
          toDate: nextDate,
          sourceDay: data,
          targetDay,
          createId,
        })
      : { moved: 0, skipped: 0, nextTargetDay: targetDay }
    if (shouldCarry && result.moved > 0) {
      savePlannerDayModel(nextDate, result.nextTargetDay)
    }
    setCurrentDate(nextDate)
    setData(result.nextTargetDay)
    return result
  }

  const goPrevDay = () => {
    const prevDate = shiftPlannerDate(currentDate, -1)
    setCurrentDate(prevDate)
    setData(loadPlannerDayModel(prevDate))
  }

  const goToDate = (dateStr) => {
    if (!isPlannerDateString(dateStr)) {
      return
    }

    setCurrentDate(dateStr)
    setData(loadPlannerDayModel(dateStr))
  }

  const addTaskCard = (title) => {
    const trimmed = title.trim()
    if (!trimmed) return

    setData((prev) =>
      replacePlannerDayTaskCards(
        prev,
        addTaskCardRecord(prev.taskCards, {
          title: trimmed,
          isDone: false,
          priority: 0,
          categoryId: null,
          estimateSlots: DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
          linkedTimeBoxIds: [],
          note: '',
          origin: 'list',
        }),
      ),
    )
  }

  const addBoardCard = ({ title, categoryId = null, estimateSlots = 1, note = '' }) => {
    const trimmed = String(title || '').trim()
    if (!trimmed) {
      return false
    }

    setData((prev) =>
      replacePlannerDayTaskCards(
        prev,
        addTaskCardRecord(prev.taskCards, {
          title: trimmed,
          isDone: false,
          priority: 0,
          categoryId,
          estimateSlots,
          linkedTimeBoxIds: [],
          note,
          origin: 'board',
        }),
      ),
    )

    return true
  }

  const removeTaskCard = (id) => {
    setData((prev) => replacePlannerDayTaskCards(prev, removeTaskCardRecord(prev.taskCards, id)))
  }

  const restoreTaskCard = (item, index = null) => {
    let restored = false
    setData((prev) => {
      const nextTaskCards = restoreTaskCardRecord(prev.taskCards, item, index)
      restored = nextTaskCards.length !== prev.taskCards.length

      return replacePlannerDayTaskCards(prev, nextTaskCards)
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

      return replacePlannerDayTaskCards(prev, nextTaskCards)
    })

    return nextPriority
  }

  const updateTaskCard = (id, changes = {}) => {
    setData((prev) =>
      replacePlannerDayTaskCards(prev, updateTaskCardRecord(prev.taskCards, id, changes), {
        syncLinks: true,
      }),
    )
  }

  const applyTaskCardBoardLayout = (layoutEntries = []) => {
    setData((prev) =>
      replacePlannerDayTaskCards(prev, applyTaskCardBoardLayoutCommand(prev.taskCards, layoutEntries)),
    )
  }

  const clearTaskCardCategoryState = (categoryId) => {
    setData((prev) =>
      replacePlannerDayTaskCards(prev, clearTaskCardCategory(prev.taskCards, categoryId), {
        syncLinks: true,
      }),
    )
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
      return replacePlannerDayBigThree(prev, nextBigThree)
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
      return replacePlannerDayBigThree(prev, nextBigThree)
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
      return replacePlannerDayBigThree(prev, nextBigThree)
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
      return replacePlannerDayBigThree(prev, nextBigThree)
    })

    return inserted
  }

  const removeBigThreeItem = (id) => {
    setData((prev) => replacePlannerDayBigThree(prev, removeBigThreeItemRecord(prev.bigThree, id)))
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

      return replacePlannerDayTimeBoxes(prev, nextTimeBoxes)
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

    setData((prev) => replacePlannerDayTimeBoxes(prev, updateTimeBoxRecord(prev.timeBoxes, id, changes)))
  }

  const startTimeBoxTimer = (id) => {
    const now = Date.now()

    setData((prev) => replacePlannerDayTimeBoxes(prev, startTimeBoxTimerRecord(prev.timeBoxes, id, now)))
  }

  const pauseTimeBoxTimer = (id) => {
    const now = Date.now()
    setData((prev) => replacePlannerDayTimeBoxes(prev, pauseTimeBoxTimerRecord(prev.timeBoxes, id, now)))
  }

  const completeTimeBoxByTimer = (id) => {
    const now = Date.now()
    setData((prev) => replacePlannerDayTimeBoxes(prev, completeTimeBoxByTimerRecord(prev.timeBoxes, id, now)))
  }

  const clearTimeBoxCategory = (categoryId) => {
    setData((prev) => replacePlannerDayTimeBoxes(prev, clearTimeBoxCategoryRecord(prev.timeBoxes, categoryId)))
  }

  const removeTimeBox = (id) => {
    setData((prev) => {
      const nextTimeBoxes = removeTimeBoxRecord(prev.timeBoxes, id)
      return replacePlannerDayTimeBoxes(prev, nextTimeBoxes)
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

      return replacePlannerDayTimeBoxes(prev, nextTimeBoxes)
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
    setData((prev) => replacePlannerDayStackCanvasState(prev, nextStackCanvasState))
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
