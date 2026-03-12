import { normalizeBoardCard } from '../boardCard'
import { normalizeStackCanvasState } from '../stackCanvasState'
import { sortBrainDumpItems } from '../brainDumpPriority'
import { TOTAL_SLOTS } from '../timeSlot'
import { normalizeCategoryRecords } from '../../model'
import { createEmptyDay, createEmptyMeta, PLANNER_SCHEMA_VERSION } from './schema'

const normalizeTemplate = (template) => {
  const name = typeof template?.name === 'string' ? template.name.trim() : ''
  const content = typeof template?.content === 'string' ? template.content.trim() : ''

  if (!name || !content) {
    return null
  }

  return {
    id: typeof template?.id === 'string' ? template.id : crypto.randomUUID(),
    name,
    content,
    durationSlots: Math.max(1, Math.min(TOTAL_SLOTS, Number(template?.durationSlots) || 1)),
    categoryId:
      typeof template?.categoryId === 'string' && template.categoryId.trim().length > 0
        ? template.categoryId
        : null,
  }
}

const normalizeTimeBox = (box) => ({
  id: box?.id ?? crypto.randomUUID(),
  content: typeof box?.content === 'string' ? box.content : '',
  sourceId: box?.sourceId ?? null,
  startSlot: Number.isInteger(box?.startSlot) ? box.startSlot : 0,
  endSlot: Number.isInteger(box?.endSlot) ? box.endSlot : 1,
  status:
    box?.status === 'COMPLETED' || box?.status === 'SKIPPED' || box?.status === 'PLANNED'
      ? box.status
      : 'PLANNED',
  actualMinutes: Number.isFinite(box?.actualMinutes) ? Number(box.actualMinutes) : null,
  category: typeof box?.category === 'string' ? box.category : null,
  categoryId: typeof box?.categoryId === 'string' ? box.categoryId : null,
  skipReason: typeof box?.skipReason === 'string' ? box.skipReason : null,
  carryOverFromDate: typeof box?.carryOverFromDate === 'string' ? box.carryOverFromDate : null,
  carryOverFromBoxId: typeof box?.carryOverFromBoxId === 'string' ? box.carryOverFromBoxId : null,
  timerStartedAt: Number.isFinite(box?.timerStartedAt) ? Number(box.timerStartedAt) : null,
  elapsedSeconds: Number.isFinite(box?.elapsedSeconds) ? Math.max(0, Number(box.elapsedSeconds)) : 0,
})

const normalizeBrainDumpItem = (item, index = 0) => normalizeBoardCard(item, index)

const areLinkedIdsEqual = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index])

const syncPersistedBrainDumpWithPersistedTimeBoxes = (brainDump = [], timeBoxes = []) => {
  const linkedMap = new Map()

  ;[...timeBoxes]
    .sort((left, right) => left.startSlot - right.startSlot)
    .forEach((box) => {
      if (typeof box?.sourceId !== 'string' || box.sourceId.trim().length === 0) {
        return
      }

      const next = linkedMap.get(box.sourceId) || []
      next.push(box.id)
      linkedMap.set(box.sourceId, next)
    })

  return brainDump.map((item) => {
    const linkedTimeBoxIds = linkedMap.get(item.id) || []
    if (areLinkedIdsEqual(item.linkedTimeBoxIds || [], linkedTimeBoxIds)) {
      return item
    }

    return {
      ...item,
      linkedTimeBoxIds,
    }
  })
}

export const hasMeaningfulPersistedDayData = (dayData) => {
  const safeDay = dayData && typeof dayData === 'object' ? dayData : {}
  return (
    (Array.isArray(safeDay.brainDump) && safeDay.brainDump.length > 0) ||
    (Array.isArray(safeDay.bigThree) && safeDay.bigThree.length > 0) ||
    (Array.isArray(safeDay.timeBoxes) && safeDay.timeBoxes.length > 0) ||
    Boolean(safeDay.stackCanvasState?.document) ||
    Boolean(safeDay.boardCanvas?.document)
  )
}

export const migratePersistedDayData = (dateStr, rawData) => {
  const safeData = rawData && typeof rawData === 'object' ? rawData : {}
  const persistedStackCanvasState =
    safeData.stackCanvasState && typeof safeData.stackCanvasState === 'object'
      ? safeData.stackCanvasState
      : safeData.boardCanvas
  const normalizedTimeBoxes = Array.isArray(safeData.timeBoxes) ? safeData.timeBoxes.map(normalizeTimeBox) : []
  const normalizedBrainDump = Array.isArray(safeData.brainDump)
    ? sortBrainDumpItems(
        safeData.brainDump.map((item, index) => normalizeBrainDumpItem(item, index)).filter(Boolean),
      )
    : []

  return {
    ...createEmptyDay(dateStr),
    schemaVersion: PLANNER_SCHEMA_VERSION,
    date: dateStr,
    brainDump: syncPersistedBrainDumpWithPersistedTimeBoxes(normalizedBrainDump, normalizedTimeBoxes),
    bigThree: Array.isArray(safeData.bigThree) ? safeData.bigThree : [],
    timeBoxes: normalizedTimeBoxes,
    stackCanvasState: normalizeStackCanvasState(persistedStackCanvasState),
  }
}

export const migratePersistedMeta = (rawMeta) => {
  const parsed = rawMeta && typeof rawMeta === 'object' ? rawMeta : {}

  return {
    ...createEmptyMeta(),
    schemaVersion: PLANNER_SCHEMA_VERSION,
    categories: Array.isArray(parsed.categories) ? normalizeCategoryRecords(parsed.categories) : [],
    templates: Array.isArray(parsed.templates) ? parsed.templates.map(normalizeTemplate).filter(Boolean) : [],
  }
}
