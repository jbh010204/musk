import { normalizeBoardCard } from '../boardCard'
import { normalizeStackCanvasState } from '../stackCanvasState'
import { sortBrainDumpItems } from '../brainDumpPriority'
import { TOTAL_SLOTS } from '../timeSlot'
import { normalizeCategoryRecords, normalizeDeadlineRecord } from '../../model'
import { createEmptyDay, createEmptyMeta, PLANNER_SCHEMA_VERSION } from './schema'
import type {
  PersistedPlannerDeadline,
  PersistedBigThreeItem,
  PersistedBrainDumpItem,
  PersistedPlannerDay,
  PersistedPlannerMeta,
  PersistedPlannerTemplate,
  PersistedTimeBox,
} from './schema'
import type { CategoryRecord, StackCanvasStateRecord, TimeBoxStatus } from '../../model/types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeTimeBoxStatus = (value: unknown): TimeBoxStatus =>
  value === 'COMPLETED' || value === 'SKIPPED' || value === 'PLANNED' ? value : 'PLANNED'

const normalizeTemplate = (
  template: unknown,
): PersistedPlannerTemplate | null => {
  const safeTemplate = isRecord(template) ? template : {}
  const name = typeof safeTemplate.name === 'string' ? safeTemplate.name.trim() : ''
  const content = typeof safeTemplate.content === 'string' ? safeTemplate.content.trim() : ''

  if (!name || !content) {
    return null
  }

  return {
    id: typeof safeTemplate.id === 'string' ? safeTemplate.id : crypto.randomUUID(),
    name,
    content,
    durationSlots: Math.max(1, Math.min(TOTAL_SLOTS, Number(safeTemplate.durationSlots) || 1)),
    categoryId:
      typeof safeTemplate.categoryId === 'string' && safeTemplate.categoryId.trim().length > 0
        ? safeTemplate.categoryId
        : null,
  }
}

const normalizeDeadline = (
  deadline: unknown,
): PersistedPlannerDeadline | null =>
  normalizeDeadlineRecord(deadline) as PersistedPlannerDeadline | null

const normalizeTimeBox = (box: unknown): PersistedTimeBox => {
  const safeBox = isRecord(box) ? box : {}

  return {
    id: typeof safeBox.id === 'string' ? safeBox.id : crypto.randomUUID(),
    content: typeof safeBox.content === 'string' ? safeBox.content : '',
    sourceId: typeof safeBox.sourceId === 'string' ? safeBox.sourceId : null,
    startSlot: Number.isInteger(safeBox.startSlot) ? Number(safeBox.startSlot) : 0,
    endSlot: Number.isInteger(safeBox.endSlot) ? Number(safeBox.endSlot) : 1,
    status: normalizeTimeBoxStatus(safeBox.status),
    actualMinutes: Number.isFinite(safeBox.actualMinutes) ? Number(safeBox.actualMinutes) : null,
    category: typeof safeBox.category === 'string' ? safeBox.category : null,
    categoryId: typeof safeBox.categoryId === 'string' ? safeBox.categoryId : null,
    skipReason: typeof safeBox.skipReason === 'string' ? safeBox.skipReason : null,
    carryOverFromDate:
      typeof safeBox.carryOverFromDate === 'string' ? safeBox.carryOverFromDate : null,
    carryOverFromBoxId:
      typeof safeBox.carryOverFromBoxId === 'string' ? safeBox.carryOverFromBoxId : null,
    timerStartedAt: Number.isFinite(safeBox.timerStartedAt) ? Number(safeBox.timerStartedAt) : null,
    elapsedSeconds: Number.isFinite(safeBox.elapsedSeconds)
      ? Math.max(0, Number(safeBox.elapsedSeconds))
      : 0,
  }
}

const normalizeBrainDumpItem = (
  item: unknown,
  index = 0,
): PersistedBrainDumpItem | null =>
  normalizeBoardCard(item, index) as PersistedBrainDumpItem | null

const areLinkedIdsEqual = (left: string[] = [], right: string[] = []): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index])

const syncPersistedBrainDumpWithPersistedTimeBoxes = (
  brainDump: PersistedBrainDumpItem[] = [],
  timeBoxes: PersistedTimeBox[] = [],
): PersistedBrainDumpItem[] => {
  const linkedMap = new Map<string, string[]>()

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

export const hasMeaningfulPersistedDayData = (dayData: unknown): boolean => {
  const safeDay = isRecord(dayData) ? dayData : {}
  const stackCanvasState = isRecord(safeDay.stackCanvasState) ? safeDay.stackCanvasState : null
  const boardCanvas = isRecord(safeDay.boardCanvas) ? safeDay.boardCanvas : null
  return (
    (Array.isArray(safeDay.brainDump) && safeDay.brainDump.length > 0) ||
    (Array.isArray(safeDay.bigThree) && safeDay.bigThree.length > 0) ||
    (Array.isArray(safeDay.timeBoxes) && safeDay.timeBoxes.length > 0) ||
    Boolean(stackCanvasState?.document) ||
    Boolean(boardCanvas?.document)
  )
}

export const migratePersistedDayData = (
  dateStr: string,
  rawData: unknown,
): PersistedPlannerDay => {
  const safeData = isRecord(rawData) ? rawData : {}
  const persistedStackCanvasState =
    isRecord(safeData.stackCanvasState)
      ? safeData.stackCanvasState
      : safeData.boardCanvas
  const normalizedTimeBoxes = Array.isArray(safeData.timeBoxes) ? safeData.timeBoxes.map(normalizeTimeBox) : []
  const normalizedBrainDump = Array.isArray(safeData.brainDump)
    ? sortBrainDumpItems(
        safeData.brainDump.map((item, index) => normalizeBrainDumpItem(item, index)).filter(Boolean),
      ) as PersistedBrainDumpItem[]
    : []

  return {
    ...createEmptyDay(dateStr),
    schemaVersion: PLANNER_SCHEMA_VERSION,
    date: dateStr,
    brainDump: syncPersistedBrainDumpWithPersistedTimeBoxes(normalizedBrainDump, normalizedTimeBoxes),
    bigThree: Array.isArray(safeData.bigThree)
      ? (safeData.bigThree as PersistedBigThreeItem[])
      : [],
    timeBoxes: normalizedTimeBoxes,
    stackCanvasState: normalizeStackCanvasState(persistedStackCanvasState) as StackCanvasStateRecord,
  }
}

export const migratePersistedMeta = (rawMeta: unknown): PersistedPlannerMeta => {
  const parsed = isRecord(rawMeta) ? rawMeta : {}

  return {
    ...createEmptyMeta(),
    schemaVersion: PLANNER_SCHEMA_VERSION,
    categories: Array.isArray(parsed.categories)
      ? (normalizeCategoryRecords(parsed.categories) as CategoryRecord[])
      : [],
    templates: Array.isArray(parsed.templates)
      ? parsed.templates
          .map((template) => normalizeTemplate(template))
          .filter((template): template is PersistedPlannerTemplate => Boolean(template))
      : [],
    deadlines: Array.isArray(parsed.deadlines)
      ? parsed.deadlines
          .map((deadline) => normalizeDeadline(deadline))
          .filter((deadline): deadline is PersistedPlannerDeadline => Boolean(deadline))
      : [],
  }
}
