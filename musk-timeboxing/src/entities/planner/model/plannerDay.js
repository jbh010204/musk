import { applyStackCanvasStatePatch } from '../lib/stackCanvasState'
import { syncTaskCardLinksWithTimeBoxes } from './taskCards'

const defaultPlannerDay = {
  taskCards: [],
  bigThree: [],
  timeBoxes: [],
  stackCanvasState: undefined,
}

const toPlannerDay = (plannerDay) =>
  plannerDay && typeof plannerDay === 'object'
    ? plannerDay
    : defaultPlannerDay

export const replacePlannerDayTaskCards = (
  plannerDay,
  taskCards,
  { syncLinks = false } = {},
) => {
  const currentDay = toPlannerDay(plannerDay)
  const nextTaskCards =
    syncLinks
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

export const replacePlannerDayBigThree = (plannerDay, bigThree) => {
  const currentDay = toPlannerDay(plannerDay)
  if (bigThree === currentDay.bigThree) {
    return currentDay
  }

  return {
    ...currentDay,
    bigThree,
  }
}

export const replacePlannerDayTimeBoxes = (plannerDay, timeBoxes) => {
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

export const replacePlannerDayStackCanvasState = (plannerDay, nextStackCanvasState) => {
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
