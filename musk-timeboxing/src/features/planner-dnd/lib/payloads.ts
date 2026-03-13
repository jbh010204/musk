export const PLANNER_DND_TYPES = {
  BRAIN_DUMP: 'BRAIN_DUMP',
  BIG_THREE: 'BIG_THREE',
  BIG_THREE_SLOT: 'BIG_THREE_SLOT',
  BOARD_CARD: 'BOARD_CARD',
  COMPOSER_CARD: 'COMPOSER_CARD',
  TIME_BOX: 'TIME_BOX',
  TIMELINE_SLOT: 'TIMELINE_SLOT',
} as const

type PlannerDndType = (typeof PLANNER_DND_TYPES)[keyof typeof PLANNER_DND_TYPES]

interface BrainDumpLike {
  id: string
  title: string
}

interface BigThreeLike {
  id: string
  content: string
  taskId?: string | null
}

interface TimeBoxLike {
  id: string
  startSlot: number
  endSlot: number
}

export interface BrainDumpDragPayload {
  type: typeof PLANNER_DND_TYPES.BRAIN_DUMP
  id: string
  title: string
}

export interface BigThreeDragPayload {
  type: typeof PLANNER_DND_TYPES.BIG_THREE
  id: string
  content: string
  taskId: string | null
}

export interface BigThreeSlotDropPayload {
  type: typeof PLANNER_DND_TYPES.BIG_THREE_SLOT
  slotIndex: number
}

export interface BoardCardDragPayload {
  type: typeof PLANNER_DND_TYPES.BOARD_CARD
  itemId: string
}

export interface ComposerCardDragPayload {
  type: typeof PLANNER_DND_TYPES.COMPOSER_CARD
  itemId: string
}

export interface TimeBoxDragPayload {
  type: typeof PLANNER_DND_TYPES.TIME_BOX
  id: string
  startSlot: number
  endSlot: number
}

export interface TimelineSlotDropPayload {
  type: typeof PLANNER_DND_TYPES.TIMELINE_SLOT
  slotIndex: number
}

export type PlannerDndPayload =
  | BrainDumpDragPayload
  | BigThreeDragPayload
  | BigThreeSlotDropPayload
  | BoardCardDragPayload
  | ComposerCardDragPayload
  | TimeBoxDragPayload
  | TimelineSlotDropPayload

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object'
const normalizeString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

export const createBrainDumpDragPayload = (item: BrainDumpLike): BrainDumpDragPayload => ({
  type: PLANNER_DND_TYPES.BRAIN_DUMP,
  id: item.id,
  title: item.title,
})

export const createBigThreeDragPayload = (slot: BigThreeLike): BigThreeDragPayload => ({
  type: PLANNER_DND_TYPES.BIG_THREE,
  id: slot.id,
  content: slot.content,
  taskId: slot.taskId ?? null,
})

export const createBigThreeSlotDropPayload = (slotIndex: number): BigThreeSlotDropPayload => ({
  type: PLANNER_DND_TYPES.BIG_THREE_SLOT,
  slotIndex,
})

export const createBoardCardDragPayload = (itemId: string): BoardCardDragPayload => ({
  type: PLANNER_DND_TYPES.BOARD_CARD,
  itemId,
})

export const createComposerCardDragPayload = (itemId: string): ComposerCardDragPayload => ({
  type: PLANNER_DND_TYPES.COMPOSER_CARD,
  itemId,
})

export const createTimeBoxDragPayload = (timeBox: TimeBoxLike): TimeBoxDragPayload => ({
  type: PLANNER_DND_TYPES.TIME_BOX,
  id: timeBox.id,
  startSlot: timeBox.startSlot,
  endSlot: timeBox.endSlot,
})

export const createTimelineSlotDropPayload = (slotIndex: number): TimelineSlotDropPayload => ({
  type: PLANNER_DND_TYPES.TIMELINE_SLOT,
  slotIndex,
})

export const getPlannerDndType = (payload: unknown): PlannerDndType | null =>
  isObject(payload) && typeof payload.type === 'string' ? (payload.type as PlannerDndType) : null

export const isPlannerDndType = <TType extends PlannerDndType>(
  payload: unknown,
  type: TType,
): payload is Extract<PlannerDndPayload, { type: TType }> => getPlannerDndType(payload) === type

export const isScheduleSourceDragPayload = (
  payload: unknown,
): payload is BrainDumpDragPayload | BigThreeDragPayload =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.BRAIN_DUMP) ||
  isPlannerDndType(payload, PLANNER_DND_TYPES.BIG_THREE)

export const isTimeBoxDragPayload = (payload: unknown): payload is TimeBoxDragPayload =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.TIME_BOX)

export const isTimelineSlotDropPayload = (payload: unknown): payload is TimelineSlotDropPayload =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.TIMELINE_SLOT) && Number.isInteger(payload.slotIndex)

export const isBigThreeSlotDropPayload = (payload: unknown): payload is BigThreeSlotDropPayload =>
  isPlannerDndType(payload, PLANNER_DND_TYPES.BIG_THREE_SLOT) && Number.isInteger(payload.slotIndex)

export const getPlannerQueueItemId = (payload: unknown): string | null =>
  isObject(payload) ? normalizeString(payload.itemId) : null

export const getScheduleSourceContent = (payload: unknown): string => {
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

export const getScheduleSourceTaskId = (payload: unknown): string | null => {
  if (isPlannerDndType(payload, PLANNER_DND_TYPES.BIG_THREE)) {
    return normalizeString(payload.taskId)
  }

  if (isPlannerDndType(payload, PLANNER_DND_TYPES.BRAIN_DUMP)) {
    return normalizeString(payload.id)
  }

  return null
}
