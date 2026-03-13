import { hasOverlap, TOTAL_SLOTS } from '../lib/timeSlot'
import { findAvailableStartSlot } from '../lib/timeBoxPlacement'

/** @returns {string} */
const defaultCreateId = () => crypto.randomUUID()

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const normalizeNullableText = (value) => {
  const trimmed = normalizeText(value)
  return trimmed.length > 0 ? trimmed : null
}

const clampSlot = (value) => Math.max(0, Math.min(TOTAL_SLOTS - 1, Number(value) || 0))

const normalizeStatus = (value) =>
  value === 'PLANNED' || value === 'COMPLETED' || value === 'SKIPPED' ? value : 'PLANNED'

const normalizeActualMinutes = (value) => (Number.isFinite(value) ? Number(value) : null)

const normalizeElapsedSeconds = (value) => (Number.isFinite(value) ? Math.max(0, Number(value)) : 0)

const normalizeTimerStartedAt = (value) => (Number.isFinite(value) ? Number(value) : null)

const normalizeTaskId = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return value ?? null
}

export const normalizeTimeBoxRecord = (timeBox, createId = defaultCreateId) => {
  const content = normalizeText(timeBox?.content)
  if (!content) {
    return null
  }

  const startSlot = clampSlot(timeBox?.startSlot)
  const endSlot = Math.max(startSlot + 1, Math.min(TOTAL_SLOTS, Number(timeBox?.endSlot) || startSlot + 1))

  return {
    id: typeof timeBox?.id === 'string' ? timeBox.id : createId(),
    content,
    taskId: normalizeTaskId(timeBox?.taskId),
    startSlot,
    endSlot,
    status: normalizeStatus(timeBox?.status),
    actualMinutes: normalizeActualMinutes(timeBox?.actualMinutes),
    category: normalizeNullableText(timeBox?.category),
    categoryId: normalizeNullableText(timeBox?.categoryId),
    skipReason: normalizeNullableText(timeBox?.skipReason),
    carryOverFromDate: normalizeNullableText(timeBox?.carryOverFromDate),
    carryOverFromBoxId: normalizeNullableText(timeBox?.carryOverFromBoxId),
    timerStartedAt: normalizeTimerStartedAt(timeBox?.timerStartedAt),
    elapsedSeconds: normalizeElapsedSeconds(timeBox?.elapsedSeconds),
  }
}

export const createTimeBoxRecord = (input = {}, createId = defaultCreateId) =>
  normalizeTimeBoxRecord(input, createId)

export const createCarryOverTimeBoxRecord = (
  sourceTimeBox,
  { fromDate, startSlot, createId = defaultCreateId } = {},
) => {
  const normalizedSource = normalizeTimeBoxRecord(sourceTimeBox, createId)
  if (!normalizedSource) {
    return null
  }

  const duration = Math.max(1, normalizedSource.endSlot - normalizedSource.startSlot)

  return normalizeTimeBoxRecord(
    {
      ...normalizedSource,
      id: undefined,
      startSlot,
      endSlot: startSlot + duration,
      status: 'PLANNED',
      actualMinutes: null,
      skipReason: normalizeNullableText(normalizedSource.skipReason),
      carryOverFromDate: fromDate,
      carryOverFromBoxId: normalizedSource.id,
      timerStartedAt: null,
      elapsedSeconds: 0,
    },
    createId,
  )
}

export const addTimeBoxRecord = (timeBoxes = [], input = {}, createId = defaultCreateId) => {
  const normalized = createTimeBoxRecord(input, createId)
  if (!normalized) {
    return {
      insertedId: null,
      nextTimeBoxes: timeBoxes,
    }
  }

  const duplicateExists = timeBoxes.some(
    (timeBox) =>
      timeBox.content === normalized.content &&
      (timeBox.taskId ?? null) === (normalized.taskId ?? null) &&
      timeBox.startSlot === normalized.startSlot &&
      timeBox.endSlot === normalized.endSlot &&
      (timeBox.categoryId ?? null) === (normalized.categoryId ?? null),
  )

  if (duplicateExists) {
    return {
      insertedId: null,
      nextTimeBoxes: timeBoxes,
    }
  }

  return {
    insertedId: normalized.id,
    nextTimeBoxes: [...timeBoxes, normalized],
  }
}

export const updateTimeBoxRecord = (timeBoxes = [], timeBoxId, changes = {}) =>
  timeBoxes.map((timeBox) => {
    if (timeBox.id !== timeBoxId) {
      return timeBox
    }

    return (
      normalizeTimeBoxRecord(
        {
          ...timeBox,
          ...changes,
          content:
            typeof changes?.content === 'string' && changes.content.trim().length > 0
              ? changes.content
              : timeBox.content,
          category:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'category')
              ? normalizeNullableText(changes?.category)
              : timeBox.category ?? null,
          categoryId:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'categoryId')
              ? normalizeNullableText(changes?.categoryId)
              : timeBox.categoryId ?? null,
          skipReason:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'skipReason')
              ? normalizeNullableText(changes?.skipReason)
              : timeBox.skipReason ?? null,
          timerStartedAt:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'timerStartedAt')
              ? normalizeTimerStartedAt(changes?.timerStartedAt)
              : timeBox.timerStartedAt ?? null,
          elapsedSeconds:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'elapsedSeconds')
              ? normalizeElapsedSeconds(changes?.elapsedSeconds)
              : timeBox.elapsedSeconds ?? 0,
        },
        () => timeBox.id,
      ) ?? timeBox
    )
  })

export const removeTimeBoxRecord = (timeBoxes = [], timeBoxId) =>
  timeBoxes.filter((timeBox) => timeBox.id !== timeBoxId)

export const clearTimeBoxCategoryRecord = (timeBoxes = [], categoryId) =>
  timeBoxes.map((timeBox) =>
    timeBox.categoryId === categoryId ? { ...timeBox, categoryId: null } : timeBox,
  )

export const restoreTimeBoxRecord = (timeBoxes = [], timeBox, hasOverlapFn = hasOverlap) => {
  const normalized = normalizeTimeBoxRecord(timeBox)
  if (!normalized) {
    return { restored: false, nextTimeBoxes: timeBoxes }
  }

  const existingIndex = timeBoxes.findIndex((entry) => entry.id === normalized.id)
  const conflictExists = hasOverlapFn(timeBoxes, normalized, normalized.id)

  if (conflictExists && existingIndex < 0) {
    return { restored: false, nextTimeBoxes: timeBoxes }
  }

  if (existingIndex >= 0) {
    const nextTimeBoxes = [...timeBoxes]
    nextTimeBoxes[existingIndex] = normalized
    return { restored: true, nextTimeBoxes }
  }

  return {
    restored: true,
    nextTimeBoxes: [...timeBoxes, normalized],
  }
}

export const startTimeBoxTimerRecord = (timeBoxes = [], timeBoxId, now = Date.now()) =>
  timeBoxes.map((timeBox) => {
    if (timeBox.id === timeBoxId) {
      if (timeBox.timerStartedAt) {
        return timeBox
      }

      return {
        ...timeBox,
        status: timeBox.status === 'SKIPPED' ? 'PLANNED' : timeBox.status,
        timerStartedAt: now,
      }
    }

    if (!timeBox.timerStartedAt) {
      return timeBox
    }

    return {
      ...timeBox,
      timerStartedAt: null,
      elapsedSeconds:
        (Number(timeBox.elapsedSeconds) || 0) +
        Math.max(0, Math.floor((now - Number(timeBox.timerStartedAt)) / 1000)),
    }
  })

export const pauseTimeBoxTimerRecord = (timeBoxes = [], timeBoxId, now = Date.now()) =>
  timeBoxes.map((timeBox) => {
    if (timeBox.id !== timeBoxId || !timeBox.timerStartedAt) {
      return timeBox
    }

    return {
      ...timeBox,
      timerStartedAt: null,
      elapsedSeconds:
        (Number(timeBox.elapsedSeconds) || 0) +
        Math.max(0, Math.floor((now - Number(timeBox.timerStartedAt)) / 1000)),
    }
  })

export const completeTimeBoxByTimerRecord = (timeBoxes = [], timeBoxId, now = Date.now()) =>
  timeBoxes.map((timeBox) => {
    if (timeBox.id !== timeBoxId) {
      return timeBox
    }

    const totalSeconds =
      (Number(timeBox.elapsedSeconds) || 0) +
      (timeBox.timerStartedAt
        ? Math.max(0, Math.floor((now - Number(timeBox.timerStartedAt)) / 1000))
        : 0)

    return {
      ...timeBox,
      status: 'COMPLETED',
      actualMinutes: Math.max(1, Math.round(totalSeconds / 60)),
      skipReason: null,
      elapsedSeconds: totalSeconds,
      timerStartedAt: null,
    }
  })

/**
 * @param {{
 *   currentDate?: string,
 *   targetDate?: string,
 *   timeBoxes?: any[],
 *   targetTimeBoxes?: any[],
 *   createId?: () => string,
 * }} [options]
 */
export const buildTimeBoxReschedulePlan = ({
  currentDate,
  targetDate,
  timeBoxes = [],
  targetTimeBoxes = [],
  createId = defaultCreateId,
} = {}) => {
  const planBaseBoxes = [...targetTimeBoxes]
  const pending = [...timeBoxes]
    .filter((timeBox) => timeBox.status !== 'COMPLETED')
    .sort((left, right) => left.startSlot - right.startSlot)

  const planned = []
  const skipped = []

  pending.forEach((timeBox) => {
    const durationSlots = Math.max(1, timeBox.endSlot - timeBox.startSlot)
    const startSlot = findAvailableStartSlot(planBaseBoxes, timeBox.startSlot, durationSlots)

    if (startSlot == null) {
      skipped.push(timeBox)
      return
    }

    const nextTimeBox = normalizeTimeBoxRecord(
      {
        ...timeBox,
        id: undefined,
        taskId: timeBox.taskId ?? null,
        startSlot,
        endSlot: startSlot + durationSlots,
        status: 'PLANNED',
        actualMinutes: null,
        skipReason: null,
        carryOverFromDate: currentDate ?? null,
        carryOverFromBoxId: timeBox.id,
        timerStartedAt: null,
        elapsedSeconds: 0,
      },
      createId,
    )

    if (!nextTimeBox) {
      skipped.push(timeBox)
      return
    }

    planned.push(nextTimeBox)
    planBaseBoxes.push(nextTimeBox)
  })

  return {
    fromDate: currentDate ?? null,
    targetDate: targetDate ?? null,
    planned,
    skipped,
  }
}

export const applyTimeBoxReschedulePlan = (targetTimeBoxes = [], plan = {}) => {
  const planned = Array.isArray(plan?.planned) ? plan.planned.filter(Boolean) : []
  if (planned.length === 0) {
    return {
      appliedCount: 0,
      nextTimeBoxes: targetTimeBoxes,
      dedupedPlanned: [],
    }
  }

  const dedupedPlanned = planned.filter(
    (candidate) =>
      !targetTimeBoxes.some(
        (existing) =>
          existing.carryOverFromDate === candidate.carryOverFromDate &&
          existing.carryOverFromBoxId === candidate.carryOverFromBoxId,
      ),
  )

  return {
    appliedCount: dedupedPlanned.length,
    nextTimeBoxes:
      dedupedPlanned.length > 0 ? [...targetTimeBoxes, ...dedupedPlanned] : targetTimeBoxes,
    dedupedPlanned,
  }
}
