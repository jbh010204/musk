export const TOTAL_SLOTS = 38

const START_HOUR = 5
const SLOT_MINUTES = 30

interface TimeBoxRange {
  id?: string | null
  startSlot: number
  endSlot: number
}

export const slotToTime = (slot: unknown): string => {
  const clamped = Math.max(0, Math.min(TOTAL_SLOTS, Number(slot) || 0))
  const totalMinutes = START_HOUR * 60 + clamped * SLOT_MINUTES

  if (totalMinutes >= 24 * 60) {
    return '24:00'
  }

  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export const timeToSlot = (timeStr: unknown): number => {
  const [hourText = '0', minuteText = '0'] = String(timeStr).split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0
  }

  if (hour === 24 && minute === 0) {
    return TOTAL_SLOTS
  }

  const minutesFromStart = hour * 60 + minute - START_HOUR * 60
  return Math.max(0, Math.round(minutesFromStart / SLOT_MINUTES))
}

export const slotDurationMinutes = (startSlot: number, endSlot: number): number =>
  Math.max(0, (endSlot - startSlot) * SLOT_MINUTES)

export const hasOverlap = (
  timeBoxes: TimeBoxRange[] = [],
  newBox: Pick<TimeBoxRange, 'startSlot' | 'endSlot'>,
  excludeId: string | null = null,
): boolean =>
  timeBoxes.some((box) => {
    if (excludeId && box.id === excludeId) {
      return false
    }

    return newBox.startSlot < box.endSlot && newBox.endSlot > box.startSlot
  })
