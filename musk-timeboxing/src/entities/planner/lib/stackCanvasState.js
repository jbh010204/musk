import { deriveTaskCardStatus } from '../model'
import { UNCATEGORIZED_BOARD_LANE } from './boardCard'

export const STACK_CANVAS_STATE_VERSION = 2

export const createEmptyStackCanvasState = () => ({
  version: STACK_CANVAS_STATE_VERSION,
  layoutMode: 'stack',
  selectedCardId: null,
  focusedLaneId: UNCATEGORIZED_BOARD_LANE,
  migratedFromLegacyBoard: false,
  lastSyncedAt: null,
})

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const normalizeStackCanvasState = (value) => {
  const safeValue = isObject(value) ? value : {}
  const hadLegacySnapshot = isObject(safeValue.document) || isObject(safeValue.session)

  return {
    version: STACK_CANVAS_STATE_VERSION,
    layoutMode: 'stack',
    selectedCardId:
      typeof safeValue.selectedCardId === 'string' && safeValue.selectedCardId.trim().length > 0
        ? safeValue.selectedCardId
        : null,
    focusedLaneId:
      typeof safeValue.focusedLaneId === 'string' && safeValue.focusedLaneId.trim().length > 0
        ? safeValue.focusedLaneId
        : UNCATEGORIZED_BOARD_LANE,
    migratedFromLegacyBoard: Boolean(safeValue.migratedFromLegacyBoard || hadLegacySnapshot),
    lastSyncedAt: Number.isFinite(safeValue.lastSyncedAt) ? Number(safeValue.lastSyncedAt) : null,
  }
}

export const getTaskCardStackCanvasStatus = (item, timeBoxes = []) => deriveTaskCardStatus(item, timeBoxes)
