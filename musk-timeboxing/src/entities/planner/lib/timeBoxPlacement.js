import { TOTAL_SLOTS } from './timeSlot'

export const findAvailableStartSlot = (timeBoxes, preferredStart, duration) => {
  const normalizedDuration = Math.max(1, Math.min(TOTAL_SLOTS, Number(duration) || 1))
  const maxStart = TOTAL_SLOTS - normalizedDuration
  const safePreferred = Math.max(0, Math.min(maxStart, Number(preferredStart) || 0))

  const findFrom = (startIndex) => {
    for (let slot = startIndex; slot <= maxStart; slot += 1) {
      const overlaps = timeBoxes.some(
        (box) => slot < box.endSlot && slot + normalizedDuration > box.startSlot,
      )

      if (!overlaps) {
        return slot
      }
    }

    return null
  }

  return findFrom(safePreferred) ?? findFrom(0)
}

export const findContiguousStartSlot = (timeBoxes, durations = [], preferredStart = 0) => {
  const normalizedDurations = durations
    .map((value) => Math.max(1, Math.min(TOTAL_SLOTS, Number(value) || 1)))
    .filter(Boolean)

  if (normalizedDurations.length === 0) {
    return null
  }

  const maxStart = TOTAL_SLOTS - normalizedDurations.reduce((sum, value) => sum + value, 0)
  if (maxStart < 0) {
    return null
  }

  const safePreferred = Math.max(0, Math.min(maxStart, Number(preferredStart) || 0))
  const hasCollision = (startSlot) => {
    let cursor = startSlot

    for (const duration of normalizedDurations) {
      const endSlot = cursor + duration
      const overlaps = timeBoxes.some((box) => cursor < box.endSlot && endSlot > box.startSlot)
      if (overlaps) {
        return true
      }
      cursor = endSlot
    }

    return false
  }

  for (let slot = safePreferred; slot <= maxStart; slot += 1) {
    if (!hasCollision(slot)) {
      return slot
    }
  }

  for (let slot = 0; slot < safePreferred; slot += 1) {
    if (!hasCollision(slot)) {
      return slot
    }
  }

  return null
}
