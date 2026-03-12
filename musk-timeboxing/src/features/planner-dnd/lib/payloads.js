export const PLANNER_DND_TYPES = {
  BRAIN_DUMP: 'BRAIN_DUMP',
  BIG_THREE: 'BIG_THREE',
  BIG_THREE_SLOT: 'BIG_THREE_SLOT',
  BOARD_CARD: 'BOARD_CARD',
  COMPOSER_CARD: 'COMPOSER_CARD',
  TIME_BOX: 'TIME_BOX',
  TIMELINE_SLOT: 'TIMELINE_SLOT',
}

const isObject = (value) => Boolean(value) && typeof value === 'object'
const normalizeString = (value) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : null)

export const createBrainDumpDragPayload = (item) => ({
  type: PLANNER_DND_TYPES.BRAIN_DUMP,
  id: item.id,
  title: item.title,
})

export const createBigThreeDragPayload = (slot) => ({
  type: PLANNER_DND_TYPES.BIG_THREE,
  id: slot.id,
  content: slot.content,
  taskId: slot.taskId ?? null,
})

export const createBigThreeSlotDropPayload = (slotIndex) => ({
  type: PLANNER_DND_TYPES.BIG_THREE_SLOT,
  slotIndex,
})

export const createBoardCardDragPayload = (itemId) => ({
  type: PLANNER_DND_TYPES.BOARD_CARD,
  itemId,
})

export const createComposerCardDragPayload = (itemId) => ({
  type: PLANNER_DND_TYPES.COMPOSER_CARD,
  itemId,
})

export const createTimeBoxDragPayload = (timeBox) => ({
  type: PLANNER_DND_TYPES.TIME_BOX,
  id: timeBox.id,
  startSlot: timeBox.startSlot,
  endSlot: timeBox.endSlot,
})

export const createTimelineSlotDropPayload = (slotIndex) => ({
  type: PLANNER_DND_TYPES.TIMELINE_SLOT,
  slotIndex,
})

export const getPlannerDndType = (payload) => (isObject(payload) ? payload.type ?? null : null)

export const isPlannerDndType = (payload, type) => getPlannerDndType(payload) === type

export const isScheduleSourceDragPayload = (payload) =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.BRAIN_DUMP) ||
  isPlannerDndType(payload, PLANNER_DND_TYPES.BIG_THREE)

export const isTimeBoxDragPayload = (payload) =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.TIME_BOX)

export const isTimelineSlotDropPayload = (payload) =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.TIMELINE_SLOT) &&
  Number.isInteger(payload?.slotIndex)

export const isBigThreeSlotDropPayload = (payload) =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.BIG_THREE_SLOT) &&
  Number.isInteger(payload?.slotIndex)

export const getPlannerQueueItemId = (payload) =>
  isObject(payload) ? normalizeString(payload.itemId) : null

export const getScheduleSourceContent = (payload) => {
  if (!isObject(payload)) {
    return ''
  }

  if (typeof payload.title === 'string' && payload.title.trim().length > 0) {
    return payload.title
  }

  if (typeof payload.content === 'string' && payload.content.trim().length > 0) {
    return payload.content
  }

  return ''
}

export const getScheduleSourceTaskId = (payload) => {
  if (isPlannerDndType(payload, PLANNER_DND_TYPES.BIG_THREE)) {
    return normalizeString(payload?.taskId)
  }

  if (isPlannerDndType(payload, PLANNER_DND_TYPES.BRAIN_DUMP)) {
    return normalizeString(payload?.id)
  }

  return null
}
