import { applyStackCanvasStatePatch } from '../lib/stackCanvasState'
import { syncTaskCardLinksWithTimeBoxes } from './taskCards'
import type { BigThreeItem, PlannerDay, StackCanvasStateRecord, TaskCard, TimeBox } from './types'

const defaultPlannerDay: PlannerDay = {
  taskCards: [],
  bigThree: [],
  timeBoxes: [],
}

const toPlannerDay = (plannerDay: Partial<PlannerDay> | null | undefined): PlannerDay =>
  plannerDay && typeof plannerDay === 'object'
    ? ({ ...defaultPlannerDay, ...plannerDay } as PlannerDay)
    : defaultPlannerDay

export const replacePlannerDayTaskCards = (
  plannerDay: Partial<PlannerDay> | null | undefined,
  taskCards: TaskCard[],
  { syncLinks = false }: { syncLinks?: boolean } = {},
): PlannerDay => {
  const currentDay = toPlannerDay(plannerDay)
  const nextTaskCards = syncLinks
    ? syncTaskCardLinksWithTimeBoxes(taskCards, currentDay.timeBoxes)
    : taskCards

  if (nextTaskCards === currentDay.taskCards) {
    return currentDay
  }

  return {
    ...currentDay,
    taskCards: nextTaskCards,
  }
}

export const replacePlannerDayBigThree = (
  plannerDay: Partial<PlannerDay> | null | undefined,
  bigThree: BigThreeItem[],
): PlannerDay => {
  const currentDay = toPlannerDay(plannerDay)
  if (bigThree === currentDay.bigThree) {
    return currentDay
  }

  return {
    ...currentDay,
    bigThree,
  }
}

export const replacePlannerDayTimeBoxes = (
  plannerDay: Partial<PlannerDay> | null | undefined,
  timeBoxes: TimeBox[],
): PlannerDay => {
  const currentDay = toPlannerDay(plannerDay)
  if (timeBoxes === currentDay.timeBoxes) {
    return currentDay
  }

  return {
    ...currentDay,
    taskCards: syncTaskCardLinksWithTimeBoxes(currentDay.taskCards, timeBoxes),
    timeBoxes,
  }
}

export const replacePlannerDayStackCanvasState = (
  plannerDay: Partial<PlannerDay> | null | undefined,
  nextStackCanvasState: StackCanvasStateRecord | ((currentState: StackCanvasStateRecord | undefined) => StackCanvasStateRecord),
): PlannerDay => {
  const currentDay = toPlannerDay(plannerDay)
  const stackCanvasState = applyStackCanvasStatePatch(
    currentDay.stackCanvasState,
    nextStackCanvasState,
  )

  if (stackCanvasState === currentDay.stackCanvasState) {
    return currentDay
  }

  return {
    ...currentDay,
    stackCanvasState,
  }
}
