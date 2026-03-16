import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
  addManualBigThreeItem,
  addManyTaskCardsToBigThree,
  addTaskCardRecord,
  createTaskCardRecord,
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
type TaskCardsState = DailyDataState['taskCards']
type BigThreeState = DailyDataState['bigThree']
type TimeBoxesState = DailyDataState['timeBoxes']
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
type TaskCardsUpdater = (taskCards: TaskCardsState, plannerDay: DailyDataState) => TaskCardsState
type BigThreeUpdater = (bigThree: BigThreeState, plannerDay: DailyDataState) => BigThreeState
type TimeBoxesUpdater = (timeBoxes: TimeBoxesState, plannerDay: DailyDataState) => TimeBoxesState

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
  const pendingFocusSlotRef = useRef<number | null>(null)

  useEffect(() => {
    savePlannerDayModel(currentDate, data)
  }, [currentDate, data])

  useEffect(() => {
    saveLastActiveDate(currentDate)
  }, [currentDate])

  const loadPlannerDate = (dateStr: string, nextDayData: DailyDataState = loadPlannerDayModel(dateStr)): void => {
    setCurrentDate(dateStr)
    setData(nextDayData)
  }

  const rememberFocus = (slot: number): void => {
    const focus = createLastFocusSnapshot(currentDate, slot)
    if (!focus) {
      return
    }

    setLastFocus(focus)
    saveLastFocus(focus)
  }

  useEffect(() => {
    if (!Number.isInteger(pendingFocusSlotRef.current)) {
      return
    }

    const slot = Number(pendingFocusSlotRef.current)
    pendingFocusSlotRef.current = null
    rememberFocus(slot)
  }, [data])

  const commitTaskCards = (
    updater: TaskCardsUpdater,
    options?: Parameters<typeof replacePlannerDayTaskCards>[2],
  ): void => {
    setData((prev) => replaceTaskCardsState(prev, updater(prev.taskCards, prev), options))
  }

  const commitBigThree = (updater: BigThreeUpdater): void => {
    setData((prev) => replaceBigThreeState(prev, updater(prev.bigThree, prev)))
  }

  const commitTimeBoxes = (updater: TimeBoxesUpdater): void => {
    setData((prev) => replaceTimeBoxesState(prev, updater(prev.timeBoxes, prev)))
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

    loadPlannerDate(nextDate, result.nextTargetDay)
    return result
  }

  const goPrevDay = (): void => {
    const prevDate = shiftPlannerDate(currentDate, -1)
    loadPlannerDate(prevDate)
  }

  const goToDate = (dateStr: string): void => {
    if (!isPlannerDateString(dateStr)) {
      return
    }

    loadPlannerDate(dateStr)
  }

  const addTaskCard = (title: string): void => {
    const trimmed = title.trim()
    if (!trimmed) return

    commitTaskCards((taskCards) =>
      addTaskCardRecord(taskCards, {
          title: trimmed,
          isDone: false,
          priority: 0,
          categoryId: null,
          estimateSlots: DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
          linkedTimeBoxIds: [],
          note: '',
          origin: 'list',
      }),
    )
  }

  const addBoardCard = ({
    title,
    categoryId = null,
    estimateSlots = 1,
    note = '',
  }: AddBoardCardInput): string | null => {
    const trimmed = String(title || '').trim()
    if (!trimmed) {
      return null
    }

    const nextTaskCard = createTaskCardRecord(data.taskCards, {
      title: trimmed,
      isDone: false,
      priority: 0,
      categoryId,
      estimateSlots,
      linkedTimeBoxIds: [],
      note,
      origin: 'board',
    })

    if (!nextTaskCard) {
      return null
    }

    commitTaskCards((taskCards) => [...taskCards, nextTaskCard])

    return nextTaskCard.id
  }

  const removeTaskCard = (id: string): void => {
    commitTaskCards((taskCards) => removeTaskCardRecord(taskCards, id))
  }

  const restoreTaskCard = (item: RestoreTaskCardInput, index: number | null = null): boolean => {
    let restored = false
    commitTaskCards((taskCards) => {
      const nextTaskCards = restoreTaskCardRecord(taskCards, item, index)
      restored = nextTaskCards.length !== taskCards.length
      return nextTaskCards
    })

    return restored
  }

  const cycleTaskCardItemPriority = (id: string) => {
    let nextPriority = null

    commitTaskCards((taskCards, plannerDay) => {
      const { nextTaskCards, nextPriority: resolvedPriority } = cycleTaskCardPriority(taskCards, id)
      if (nextTaskCards === taskCards) {
        return plannerDay.taskCards
      }
      nextPriority = resolvedPriority

      return nextTaskCards
    })

    return nextPriority
  }

  const updateTaskCard = (id: string, changes: UpdateTaskCardChanges = {}) => {
    commitTaskCards(
      (taskCards) => updateTaskCardRecord(taskCards, id, changes),
      {
        syncLinks: true,
      },
    )
  }

  const applyTaskCardBoardLayout = (layoutEntries: TaskCardBoardLayoutEntries = []) => {
    commitTaskCards((taskCards) => applyTaskCardBoardLayoutCommand(taskCards, layoutEntries))
  }

  const clearTaskCardCategoryState = (categoryId: string | null): void => {
    commitTaskCards(
      (taskCards) => clearTaskCardCategory(taskCards, categoryId),
      {
        syncLinks: true,
      },
    )
  }

  const sendToBigThree = (taskCardId: string): boolean => {
    let inserted = false

    commitBigThree((bigThree, plannerDay) => {
      const { inserted: didInsert, nextBigThree } = addTaskCardToBigThree(
        bigThree,
        plannerDay.taskCards,
        taskCardId,
        createId,
      )
      if (!didInsert) {
        return plannerDay.bigThree
      }

      inserted = didInsert
      return nextBigThree
    })

    return inserted
  }

  const sendManyToBigThree = (taskCardIds: string[] = []): number => {
    let insertedCount = 0

    commitBigThree((bigThree, plannerDay) => {
      const { insertedCount: nextInsertedCount, nextBigThree } = addManyTaskCardsToBigThree(
        bigThree,
        plannerDay.taskCards,
        taskCardIds,
        createId,
      )
      if (nextInsertedCount === 0) {
        return plannerDay.bigThree
      }

      insertedCount = nextInsertedCount
      return nextBigThree
    })

    return insertedCount
  }

  const fillBigThreeFromTaskCards = (): number => {
    let insertedCount = 0

    commitBigThree((bigThree, plannerDay) => {
      const { insertedCount: nextInsertedCount, nextBigThree } = autofillBigThreeFromTaskCards(
        bigThree,
        plannerDay.taskCards,
        createId,
      )
      if (nextInsertedCount === 0) {
        return plannerDay.bigThree
      }

      insertedCount = nextInsertedCount
      return nextBigThree
    })

    return insertedCount
  }

  const addBigThreeItem = (content: string): boolean => {
    let inserted = false

    commitBigThree((bigThree, plannerDay) => {
      const { inserted: didInsert, nextBigThree } = addManualBigThreeItem(bigThree, content, createId)
      if (!didInsert) {
        return plannerDay.bigThree
      }

      inserted = didInsert
      return nextBigThree
    })

    return inserted
  }

  const removeBigThreeItem = (id: string): void => {
    commitBigThree((bigThree) => removeBigThreeItemRecord(bigThree, id))
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

    commitTimeBoxes((timeBoxes, plannerDay) => {
      const { insertedId: nextInsertedId, nextTimeBoxes } = addTimeBoxRecord(
        timeBoxes,
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
        return plannerDay.timeBoxes
      }

      insertedId = nextInsertedId
      pendingFocusSlotRef.current = Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(startSlot) || 0))

      return nextTimeBoxes
    })

    return insertedId
  }

  const updateTimeBox = (id: string, changes: UpdateTimeBoxChanges): void => {
    if (Number.isInteger(changes?.startSlot)) {
      rememberFocus(Number(changes.startSlot))
    }

    commitTimeBoxes((timeBoxes) => updateTimeBoxRecord(timeBoxes, id, changes))
  }

  const startTimeBoxTimer = (id: string): void => {
    const now = Date.now()

    commitTimeBoxes((timeBoxes) => startTimeBoxTimerRecord(timeBoxes, id, now))
  }

  const pauseTimeBoxTimer = (id: string): void => {
    const now = Date.now()
    commitTimeBoxes((timeBoxes) => pauseTimeBoxTimerRecord(timeBoxes, id, now))
  }

  const pauseTimeBoxTimerAndPersist = (id: string): void => {
    const now = Date.now()
    setData((prev) => {
      const nextTimeBoxes = pauseTimeBoxTimerRecord(prev.timeBoxes, id, now)
      const nextPlannerDay = replaceTimeBoxesState(prev, nextTimeBoxes)
      savePlannerDayModel(currentDate, nextPlannerDay)
      return nextPlannerDay
    })
  }

  const completeTimeBoxByTimer = (id: string): void => {
    const now = Date.now()
    commitTimeBoxes((timeBoxes) => completeTimeBoxByTimerRecord(timeBoxes, id, now))
  }

  const clearTimeBoxCategory = (categoryId: string | null): void => {
    commitTimeBoxes((timeBoxes) => clearTimeBoxCategoryRecord(timeBoxes, categoryId))
  }

  const removeTimeBox = (id: string): void => {
    commitTimeBoxes((timeBoxes) => removeTimeBoxRecord(timeBoxes, id))
  }

  const restoreTimeBox = (timeBox: RestoreTimeBoxInput): boolean => {
    let restored = false

    commitTimeBoxes((timeBoxes, plannerDay) => {
      const { restored: didRestore, nextTimeBoxes } = restoreTimeBoxRecord(timeBoxes, timeBox)
      if (!didRestore) {
        return plannerDay.timeBoxes
      }

      restored = didRestore
      pendingFocusSlotRef.current = Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(timeBox?.startSlot) || 0))

      return nextTimeBoxes
    })

    return restored
  }

  const reloadCurrentDay = (): void => {
    loadPlannerDate(currentDate)
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
    pauseTimeBoxTimerAndPersist,
    completeTimeBoxByTimer,
    removeTimeBox,
    restoreTimeBox,
    clearTimeBoxCategory,
    updateStackCanvasState,
    reloadCurrentDay,
  }
}
