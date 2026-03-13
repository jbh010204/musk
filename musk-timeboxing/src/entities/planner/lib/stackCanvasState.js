import { deriveTaskCardStatus } from '../model'
import { UNCATEGORIZED_BOARD_LANE } from './boardCard'

export const STACK_CANVAS_STATE_VERSION = 2

export const createEmptyStackCanvasState = () => ({
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

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const normalizeSelectionId = (value) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
const normalizeSelectionIds = (value) =>
  Array.isArray(value)
    ? [...new Set(value.map((itemId) => normalizeSelectionId(itemId)).filter(Boolean))]
    : []
const resolveTaskCardFromCollection = (taskCards, taskCardId) => {
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

export const normalizeStackCanvasState = (value) => {
  const safeValue = isObject(value) ? value : {}
  const hadLegacySnapshot = isObject(safeValue.document) || isObject(safeValue.session)
  const selectedCardIds = normalizeSelectionIds(safeValue.selectedCardIds)
  const selectedCardId = normalizeSelectionId(safeValue.selectedCardId) ?? selectedCardIds.at(-1) ?? null

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

export const getTaskCardStackCanvasStatus = (item, timeBoxes = []) => deriveTaskCardStatus(item, timeBoxes)

export const resolveStackCanvasSelectedCardIds = (selectedCardId = null, selectedCardIds = []) => {
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
  taskCards,
  selectedCardId = null,
  selectedCardIds = [],
) => {
  const resolvedSelectedCardIds = resolveStackCanvasSelectedCardIds(selectedCardId, selectedCardIds)
    .filter((itemId) => Boolean(resolveTaskCardFromCollection(taskCards, itemId)))
  const normalizedSelectedCardId = normalizeSelectionId(selectedCardId)
  const nextSelectedCardId =
    normalizedSelectedCardId && resolvedSelectedCardIds.includes(normalizedSelectedCardId)
      ? normalizedSelectedCardId
      : resolvedSelectedCardIds.at(-1) ?? null

  return {
    selectedCardId: nextSelectedCardId,
    selectedCardIds: resolvedSelectedCardIds,
  }
}

export const createStackCanvasCardSelectionPatch = (
  taskCards,
  selectedCardIds = [],
  preferredCardId = null,
  selectedBigThreeId = null,
) => {
  const sanitizedSelection = sanitizeStackCanvasCardSelection(taskCards, preferredCardId, selectedCardIds)
  const nextCard = resolveTaskCardFromCollection(taskCards, sanitizedSelection.selectedCardId)

  return {
    selectedCardId: sanitizedSelection.selectedCardId,
    selectedCardIds: sanitizedSelection.selectedCardIds,
    selectedBigThreeId: normalizeSelectionId(selectedBigThreeId),
    focusedLaneId: nextCard?.categoryId || UNCATEGORIZED_BOARD_LANE,
  }
}

export const createClearedStackCanvasSelectionPatch = () => ({
  selectedCardId: null,
  selectedCardIds: [],
  selectedBigThreeId: null,
})

export const createStackCanvasBigThreeSelectionPatch = (taskCards, slot) => {
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
  currentStackCanvasState,
  nextStackCanvasState,
  lastSyncedAt = Date.now(),
) => {
  const resolvedPatch =
    typeof nextStackCanvasState === 'function'
      ? nextStackCanvasState(currentStackCanvasState)
      : nextStackCanvasState

  return normalizeStackCanvasState({
    ...currentStackCanvasState,
    ...resolvedPatch,
    lastSyncedAt,
  })
}
