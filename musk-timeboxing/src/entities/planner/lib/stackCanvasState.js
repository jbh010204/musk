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

export const normalizeStackCanvasState = (value) => {
  const safeValue = isObject(value) ? value : {}
  const hadLegacySnapshot = isObject(safeValue.document) || isObject(safeValue.session)
  const selectedCardIds = Array.isArray(safeValue.selectedCardIds)
    ? [...new Set(safeValue.selectedCardIds.filter((itemId) => typeof itemId === 'string' && itemId.trim().length > 0))]
    : []
  const selectedCardId =
    typeof safeValue.selectedCardId === 'string' && safeValue.selectedCardId.trim().length > 0
      ? safeValue.selectedCardId
      : selectedCardIds.at(-1) ?? null

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
