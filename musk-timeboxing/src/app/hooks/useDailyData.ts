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

type DailyDataState = ReturnType<typeof loadPlannerDayModel>
type LastFocusState = ReturnType<typeof loadLastFocus>
type GoNextDayOptions = { autoCarry?: boolean }
type AddBoardCardInput = {
  title: string
  categoryId?: string | null
  estimateSlots?: number
  note?: string
}
type RestoreTaskCardInput = Parameters<typeof restoreTaskCardRecord>[1]
type UpdateTaskCardChanges = Parameters<typeof updateTaskCardRecord>[2]
type TaskCardBoardLayoutEntries = Parameters<typeof applyTaskCardBoardLayoutCommand>[1]
type AddTimeBoxInput = Parameters<typeof addTimeBoxRecord>[1]
type UpdateTimeBoxChanges = Parameters<typeof updateTimeBoxRecord>[2]
type RestoreTimeBoxInput = Parameters<typeof restoreTimeBoxRecord>[1]
type StackCanvasStateUpdater = Parameters<typeof replacePlannerDayStackCanvasState>[1]

const createId = (): string => crypto.randomUUID()

const asDailyDataState = (
  plannerDay: Partial<DailyDataState> | ReturnType<typeof replacePlannerDayTaskCards> | DailyDataState,
): DailyDataState => plannerDay as DailyDataState

const replaceTaskCardsState = (
  plannerDay: DailyDataState,
  taskCards: DailyDataState['taskCards'],
  options?: Parameters<typeof replacePlannerDayTaskCards>[2],
): DailyDataState => asDailyDataState(replacePlannerDayTaskCards(plannerDay, taskCards, options))

const replaceBigThreeState = (
  plannerDay: DailyDataState,
  bigThree: DailyDataState['bigThree'],
): DailyDataState => asDailyDataState(replacePlannerDayBigThree(plannerDay, bigThree))

const replaceTimeBoxesState = (
  plannerDay: DailyDataState,
  timeBoxes: DailyDataState['timeBoxes'],
): DailyDataState => asDailyDataState(replacePlannerDayTimeBoxes(plannerDay, timeBoxes))

const replaceStackCanvasState = (
  plannerDay: DailyDataState,
  nextStackCanvasState: StackCanvasStateUpdater,
): DailyDataState =>
  asDailyDataState(replacePlannerDayStackCanvasState(plannerDay, nextStackCanvasState))

export const useDailyData = () => {
  const today = formatPlannerDate(new Date())
  const initialDate = loadLastActiveDate() ?? getMostRecentStoredDate() ?? today
  const [currentDate, setCurrentDate] = useState<string>(initialDate)
  const [data, setData] = useState<DailyDataState>(() => loadPlannerDayModel(initialDate))
  const [lastFocus, setLastFocus] = useState<LastFocusState>(() => loadLastFocus())

  useEffect(() => {
    savePlannerDayModel(currentDate, data)
  }, [currentDate, data])

  useEffect(() => {
    saveLastActiveDate(currentDate)
  }, [currentDate])

  const rememberFocus = (slot: number): void => {
    const focus = createLastFocusSnapshot(currentDate, slot)
    if (!focus) {
      return
    }

    setLastFocus(focus)
    saveLastFocus(focus)
  }

  const goNextDay = (options: GoNextDayOptions = {}) => {
    const nextDate = shiftPlannerDate(currentDate, 1)
    const shouldCarry = options.autoCarry !== false
    const targetDay = loadPlannerDayModel(nextDate)
    const result = shouldCarry
      ? (() => {
          const carryResult = carryOverPlannerDay({
            fromDate: currentDate,
            toDate: nextDate,
            sourceDay: data,
            targetDay,
            createId,
          })

          return {
            moved: carryResult.moved,
            skipped: carryResult.skipped,
            nextTargetDay: asDailyDataState(carryResult.nextTargetDay ?? targetDay),
          }
        })()
      : { moved: 0, skipped: 0, nextTargetDay: targetDay }
    if (shouldCarry && result.moved > 0) {
      savePlannerDayModel(nextDate, result.nextTargetDay)
    }
    setCurrentDate(nextDate)
    setData(result.nextTargetDay)
    return result
  }

  const goPrevDay = (): void => {
    const prevDate = shiftPlannerDate(currentDate, -1)
    setCurrentDate(prevDate)
    setData(loadPlannerDayModel(prevDate))
  }

  const goToDate = (dateStr: string): void => {
    if (!isPlannerDateString(dateStr)) {
      return
    }

    setCurrentDate(dateStr)
    setData(loadPlannerDayModel(dateStr))
  }

  const addTaskCard = (title: string): void => {
    const trimmed = title.trim()
    if (!trimmed) return

    setData((prev) =>
      replaceTaskCardsState(
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

  const addBoardCard = ({
    title,
    categoryId = null,
    estimateSlots = 1,
    note = '',
  }: AddBoardCardInput): boolean => {
    const trimmed = String(title || '').trim()
    if (!trimmed) {
      return false
    }

    setData((prev) =>
      replaceTaskCardsState(
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

  const removeTaskCard = (id: string): void => {
    setData((prev) => replaceTaskCardsState(prev, removeTaskCardRecord(prev.taskCards, id)))
  }

  const restoreTaskCard = (item: RestoreTaskCardInput, index: number | null = null): boolean => {
    let restored = false
    setData((prev) => {
      const nextTaskCards = restoreTaskCardRecord(prev.taskCards, item, index)
      restored = nextTaskCards.length !== prev.taskCards.length

      return replaceTaskCardsState(prev, nextTaskCards)
    })

    return restored
  }

  const cycleTaskCardItemPriority = (id: string) => {
    let nextPriority = null

    setData((prev) => {
      const { nextTaskCards, nextPriority: resolvedPriority } = cycleTaskCardPriority(prev.taskCards, id)
      if (nextTaskCards === prev.taskCards) {
        return prev
      }
      nextPriority = resolvedPriority

      return replaceTaskCardsState(prev, nextTaskCards)
    })

    return nextPriority
  }

  const updateTaskCard = (id: string, changes: UpdateTaskCardChanges = {}) => {
    setData((prev) =>
      replaceTaskCardsState(prev, updateTaskCardRecord(prev.taskCards, id, changes), {
        syncLinks: true,
      }),
    )
  }

  const applyTaskCardBoardLayout = (layoutEntries: TaskCardBoardLayoutEntries = []) => {
    setData((prev) =>
      replaceTaskCardsState(prev, applyTaskCardBoardLayoutCommand(prev.taskCards, layoutEntries)),
    )
  }

  const clearTaskCardCategoryState = (categoryId: string | null): void => {
    setData((prev) =>
      replaceTaskCardsState(prev, clearTaskCardCategory(prev.taskCards, categoryId), {
        syncLinks: true,
      }),
    )
  }

  const sendToBigThree = (taskCardId: string): boolean => {
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
      return replaceBigThreeState(prev, nextBigThree)
    })

    return inserted
  }

  const sendManyToBigThree = (taskCardIds: string[] = []): number => {
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
      return replaceBigThreeState(prev, nextBigThree)
    })

    return insertedCount
  }

  const fillBigThreeFromTaskCards = (): number => {
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
      return replaceBigThreeState(prev, nextBigThree)
    })

    return insertedCount
  }

  const addBigThreeItem = (content: string): boolean => {
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
      return replaceBigThreeState(prev, nextBigThree)
    })

    return inserted
  }

  const removeBigThreeItem = (id: string): void => {
    setData((prev) => replaceBigThreeState(prev, removeBigThreeItemRecord(prev.bigThree, id)))
  }

  const addTimeBox = ({
    content,
    taskId,
    startSlot,
    endSlot,
    category = null,
    categoryId = null,
  }: AddTimeBoxInput): string | null => {
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

      return replaceTimeBoxesState(prev, nextTimeBoxes)
    })

    if (insertedId) {
      const resolvedStart = Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(startSlot) || 0))
      rememberFocus(resolvedStart)
    }

    return insertedId
  }

  const updateTimeBox = (id: string, changes: UpdateTimeBoxChanges): void => {
    if (Number.isInteger(changes?.startSlot)) {
      rememberFocus(Number(changes.startSlot))
    }

    setData((prev) => replaceTimeBoxesState(prev, updateTimeBoxRecord(prev.timeBoxes, id, changes)))
  }

  const startTimeBoxTimer = (id: string): void => {
    const now = Date.now()

    setData((prev) => replaceTimeBoxesState(prev, startTimeBoxTimerRecord(prev.timeBoxes, id, now)))
  }

  const pauseTimeBoxTimer = (id: string): void => {
    const now = Date.now()
    setData((prev) => replaceTimeBoxesState(prev, pauseTimeBoxTimerRecord(prev.timeBoxes, id, now)))
  }

  const completeTimeBoxByTimer = (id: string): void => {
    const now = Date.now()
    setData((prev) => replaceTimeBoxesState(prev, completeTimeBoxByTimerRecord(prev.timeBoxes, id, now)))
  }

  const clearTimeBoxCategory = (categoryId: string | null): void => {
    setData((prev) => replaceTimeBoxesState(prev, clearTimeBoxCategoryRecord(prev.timeBoxes, categoryId)))
  }

  const removeTimeBox = (id: string): void => {
    setData((prev) => {
      const nextTimeBoxes = removeTimeBoxRecord(prev.timeBoxes, id)
      return replaceTimeBoxesState(prev, nextTimeBoxes)
    })
  }

  const restoreTimeBox = (timeBox: RestoreTimeBoxInput): boolean => {
    let restored = false

    setData((prev) => {
      const { restored: didRestore, nextTimeBoxes } = restoreTimeBoxRecord(prev.timeBoxes, timeBox)
      if (!didRestore) {
        return prev
      }

      restored = didRestore

      return replaceTimeBoxesState(prev, nextTimeBoxes)
    })

    if (restored) {
      const resolvedStart = Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(timeBox?.startSlot) || 0))
      rememberFocus(resolvedStart)
    }

    return restored
  }

  const reloadCurrentDay = (): void => {
    setData(loadPlannerDayModel(currentDate))
  }

  const updateStackCanvasState = (nextStackCanvasState: StackCanvasStateUpdater): void => {
    setData((prev) => replaceStackCanvasState(prev, nextStackCanvasState))
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
