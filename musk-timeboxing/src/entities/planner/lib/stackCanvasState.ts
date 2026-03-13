import { deriveTaskCardStatus } from '../model'
import { UNCATEGORIZED_BOARD_LANE } from './boardCard'
import type { StackCanvasStateRecord, TaskCard, TimeBox } from '../model/types'

export const STACK_CANVAS_STATE_VERSION = 2

type StackCanvasInboxFilter = 'ALL' | 'TODO' | 'SCHEDULED' | 'COMPLETED'
type StackCanvasLayoutMode = 'stack'

interface StackCanvasStateLike {
  version?: unknown
  layoutMode?: unknown
  selectedCardId?: unknown
  selectedCardIds?: unknown
  selectedBigThreeId?: unknown
  focusedLaneId?: unknown
  inboxFilter?: unknown
  isInboxCollapsed?: unknown
  migratedFromLegacyBoard?: unknown
  lastSyncedAt?: unknown
  document?: unknown
  session?: unknown
}

interface BigThreeSlotLike {
  id?: unknown
  taskId?: unknown
}

type TaskCardCollection = TaskCard[] | Map<string, TaskCard> | null | undefined

export interface StackCanvasStateValue extends StackCanvasStateRecord {
  version: number
  layoutMode: StackCanvasLayoutMode
  selectedCardId: string | null
  selectedCardIds: string[]
  selectedBigThreeId: string | null
  focusedLaneId: string
  inboxFilter: StackCanvasInboxFilter
  isInboxCollapsed: boolean
  migratedFromLegacyBoard: boolean
  lastSyncedAt: number | null
}

export interface StackCanvasCardSelection extends StackCanvasStateRecord {
  selectedCardId: string | null
  selectedCardIds: string[]
}

type StackCanvasPatch =
  | StackCanvasStateRecord
  | ((current: StackCanvasStateRecord | undefined) => StackCanvasStateRecord)

export const createEmptyStackCanvasState = (): StackCanvasStateValue => ({
  version: STACK_CANVAS_STATE_VERSION,
  layoutMode: 'stack',
  selectedCardId: null,
  selectedCardIds: [],
  selectedBigThreeId: null,
  focusedLaneId: UNCATEGORIZED_BOARD_LANE,
  inboxFilter: 'ALL',
  isInboxCollapsed: false,
  migratedFromLegacyBoard: false,
  lastSyncedAt: null,
})

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeSelectionId = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

const normalizeSelectionIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .map((itemId) => normalizeSelectionId(itemId))
            .filter((itemId): itemId is string => Boolean(itemId)),
        ),
      ]
    : []

const resolveTaskCardFromCollection = (
  taskCards: TaskCardCollection,
  taskCardId: unknown,
): TaskCard | null => {
  const normalizedTaskCardId = normalizeSelectionId(taskCardId)
  if (!normalizedTaskCardId) {
    return null
  }

  if (taskCards instanceof Map) {
    return taskCards.get(normalizedTaskCardId) || null
  }

  if (Array.isArray(taskCards)) {
    return taskCards.find((item) => item?.id === normalizedTaskCardId) || null
  }

  return null
}

export const normalizeStackCanvasState = (value: unknown): StackCanvasStateValue => {
  const safeValue = isObject(value) ? (value as StackCanvasStateLike) : {}
  const hadLegacySnapshot = isObject(safeValue.document) || isObject(safeValue.session)
  const selectedCardIds = normalizeSelectionIds(safeValue.selectedCardIds)
  const selectedCardId =
    normalizeSelectionId(safeValue.selectedCardId) ??
    selectedCardIds[selectedCardIds.length - 1] ??
    null

  const normalizedSelectedCardIds =
    selectedCardId && !selectedCardIds.includes(selectedCardId)
      ? [...selectedCardIds, selectedCardId]
      : selectedCardIds

  return {
    version: STACK_CANVAS_STATE_VERSION,
    layoutMode: 'stack',
    selectedCardId,
    selectedCardIds: normalizedSelectedCardIds,
    selectedBigThreeId:
      typeof safeValue.selectedBigThreeId === 'string' &&
      safeValue.selectedBigThreeId.trim().length > 0
        ? safeValue.selectedBigThreeId
        : null,
    focusedLaneId:
      typeof safeValue.focusedLaneId === 'string' && safeValue.focusedLaneId.trim().length > 0
        ? safeValue.focusedLaneId
        : UNCATEGORIZED_BOARD_LANE,
    inboxFilter:
      safeValue.inboxFilter === 'TODO' ||
      safeValue.inboxFilter === 'SCHEDULED' ||
      safeValue.inboxFilter === 'COMPLETED'
        ? safeValue.inboxFilter
        : 'ALL',
    isInboxCollapsed: Boolean(safeValue.isInboxCollapsed),
    migratedFromLegacyBoard: Boolean(safeValue.migratedFromLegacyBoard || hadLegacySnapshot),
    lastSyncedAt: Number.isFinite(safeValue.lastSyncedAt) ? Number(safeValue.lastSyncedAt) : null,
  }
}

export const getTaskCardStackCanvasStatus = (
  item: TaskCard | null | undefined,
  timeBoxes: TimeBox[] = [],
): ReturnType<typeof deriveTaskCardStatus> => deriveTaskCardStatus(item, timeBoxes)

export const resolveStackCanvasSelectedCardIds = (
  selectedCardId: unknown = null,
  selectedCardIds: unknown = [],
): string[] => {
  const normalizedSelectedCardId = normalizeSelectionId(selectedCardId)
  const normalizedSelectedCardIds = normalizeSelectionIds(selectedCardIds)

  if (!normalizedSelectedCardId) {
    return normalizedSelectedCardIds
  }

  return normalizedSelectedCardIds.includes(normalizedSelectedCardId)
    ? normalizedSelectedCardIds
    : [...normalizedSelectedCardIds, normalizedSelectedCardId]
}

export const sanitizeStackCanvasCardSelection = (
  taskCards: TaskCardCollection,
  selectedCardId: unknown = null,
  selectedCardIds: unknown = [],
): StackCanvasCardSelection => {
  const resolvedSelectedCardIds = resolveStackCanvasSelectedCardIds(
    selectedCardId,
    selectedCardIds,
  ).filter((itemId) => Boolean(resolveTaskCardFromCollection(taskCards, itemId)))
  const normalizedSelectedCardId = normalizeSelectionId(selectedCardId)
  const nextSelectedCardId =
    normalizedSelectedCardId && resolvedSelectedCardIds.includes(normalizedSelectedCardId)
      ? normalizedSelectedCardId
      : resolvedSelectedCardIds[resolvedSelectedCardIds.length - 1] ?? null

  return {
    selectedCardId: nextSelectedCardId,
    selectedCardIds: resolvedSelectedCardIds,
  }
}

export const createStackCanvasCardSelectionPatch = (
  taskCards: TaskCardCollection,
  selectedCardIds: unknown = [],
  preferredCardId: unknown = null,
  selectedBigThreeId: unknown = null,
): StackCanvasCardSelection & { selectedBigThreeId: string | null; focusedLaneId: string } => {
  const sanitizedSelection = sanitizeStackCanvasCardSelection(
    taskCards,
    preferredCardId,
    selectedCardIds,
  )
  const nextCard = resolveTaskCardFromCollection(taskCards, sanitizedSelection.selectedCardId)

  return {
    selectedCardId: sanitizedSelection.selectedCardId,
    selectedCardIds: sanitizedSelection.selectedCardIds,
    selectedBigThreeId: normalizeSelectionId(selectedBigThreeId),
    focusedLaneId: nextCard?.categoryId || UNCATEGORIZED_BOARD_LANE,
  }
}

export const createClearedStackCanvasSelectionPatch = (): {
  selectedCardId: null
  selectedCardIds: string[]
  selectedBigThreeId: null
} => ({
  selectedCardId: null,
  selectedCardIds: [],
  selectedBigThreeId: null,
})

export const createStackCanvasBigThreeSelectionPatch = (
  taskCards: TaskCardCollection,
  slot: BigThreeSlotLike | null | undefined,
):
  | ReturnType<typeof createStackCanvasCardSelectionPatch>
  | ReturnType<typeof createClearedStackCanvasSelectionPatch>
  | { selectedBigThreeId: null }
  | { selectedCardId: null; selectedCardIds: string[]; selectedBigThreeId: string } => {
  const slotId = normalizeSelectionId(slot?.id)
  const taskId = normalizeSelectionId(slot?.taskId)
  const sourceCard = resolveTaskCardFromCollection(taskCards, taskId)

  if (sourceCard) {
    return createStackCanvasCardSelectionPatch(taskCards, [sourceCard.id], sourceCard.id, slotId)
  }

  if (!slotId) {
    return { selectedBigThreeId: null }
  }

  return {
    ...createClearedStackCanvasSelectionPatch(),
    selectedBigThreeId: slotId,
  }
}

export const applyStackCanvasStatePatch = (
  currentStackCanvasState: unknown,
  nextStackCanvasState: StackCanvasPatch,
  lastSyncedAt = Date.now(),
): StackCanvasStateValue => {
  const normalizedCurrentState = normalizeStackCanvasState(currentStackCanvasState)
  const resolvedPatch =
    typeof nextStackCanvasState === 'function'
      ? nextStackCanvasState(normalizedCurrentState)
      : nextStackCanvasState

  return normalizeStackCanvasState({
    ...normalizedCurrentState,
    ...resolvedPatch,
    lastSyncedAt,
  })
}
