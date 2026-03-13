import { applyTimeBoxReschedulePlan, buildTimeBoxReschedulePlan } from './timeBoxes'
import type { LastFocusSnapshot, PlannerDay } from './types'

const PLANNER_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const formatPlannerDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const shiftPlannerDate = (dateStr: string, offset: number): string => {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + offset)
  return formatPlannerDate(date)
}

export const isPlannerDateString = (value: unknown): value is string =>
  PLANNER_DATE_PATTERN.test(String(value))

export const createLastFocusSnapshot = (
  date: string,
  slot: number,
  ts = Date.now(),
): LastFocusSnapshot | null => {
  if (!isPlannerDateString(date) || !Number.isInteger(slot)) {
    return null
  }

  return {
    date,
    slot,
    ts,
  }
}

interface CarryOverPlannerDayInput {
  fromDate?: string
  toDate?: string
  sourceDay?: Partial<PlannerDay>
  targetDay?: Partial<PlannerDay>
  createId?: () => string
}

export const carryOverPlannerDay = ({
  fromDate,
  toDate,
  sourceDay,
  targetDay,
  createId,
}: CarryOverPlannerDayInput = {}) => {
  const plan = buildTimeBoxReschedulePlan({
    currentDate: fromDate,
    targetDate: toDate,
    timeBoxes: Array.isArray(sourceDay?.timeBoxes) ? sourceDay.timeBoxes : [],
    targetTimeBoxes: Array.isArray(targetDay?.timeBoxes) ? targetDay.timeBoxes : [],
    createId,
  })
  const { appliedCount, nextTimeBoxes } = applyTimeBoxReschedulePlan(targetDay?.timeBoxes, plan)
  const skipped = plan.skipped.length + Math.max(0, plan.planned.length - appliedCount)

  return {
    moved: appliedCount,
    skipped,
    nextTargetDay:
      appliedCount > 0
        ? {
            ...targetDay,
            timeBoxes: nextTimeBoxes,
          }
        : targetDay,
  }
}
