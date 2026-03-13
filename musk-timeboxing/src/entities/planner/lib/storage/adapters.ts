import { createEmptyDay, createEmptyMeta, PLANNER_SCHEMA_VERSION } from './schema'
import { migratePersistedDayData, migratePersistedMeta } from './migrations'
import { normalizeBoardCard } from '../boardCard'
import { normalizeBigThreeRecord } from '../../model/bigThree'
import { normalizeTaskCard } from '../../model/taskCards'
import { normalizeTimeBoxRecord } from '../../model/timeBoxes'
import type {
  BigThreeItem,
  PlannerDay,
  PlannerMetaModel,
  StackCanvasStateRecord,
  TaskCard,
  TimeBox,
} from '../../model/types'

interface PersistedPlannerDayInput {
  schemaVersion?: unknown
  date?: unknown
  taskCards?: unknown[]
  brainDump?: unknown[]
  bigThree?: unknown[]
  timeBoxes?: unknown[]
  stackCanvasState?: unknown
  [key: string]: unknown
}

interface PersistedBigThreeItem {
  id?: unknown
  content?: unknown
  taskId?: unknown
  sourceId?: unknown
}

interface PersistedTimeBoxInput {
  taskId?: unknown
  sourceId?: unknown
  [key: string]: unknown
}

interface PlannerDayModel extends PlannerDay {
  schemaVersion: number
  date: string
  taskCards: TaskCard[]
  bigThree: BigThreeItem[]
  timeBoxes: TimeBox[]
  stackCanvasState: StackCanvasStateRecord
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const normalizeSchemaVersion = (value: unknown): number =>
  Number.isInteger(value) ? Number(value) : PLANNER_SCHEMA_VERSION

const normalizePlannerDate = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const createEmptyStackCanvasState = (dateStr: string): StackCanvasStateRecord =>
  (createEmptyDay(dateStr) as { stackCanvasState: StackCanvasStateRecord }).stackCanvasState

const fromPersistedTaskCard = (
  taskCard: unknown,
  fallbackIndex = 0,
): TaskCard | null => {
  const normalized = normalizeBoardCard(taskCard, fallbackIndex)
  if (!normalized) {
    return null
  }

  return normalizeTaskCard(
    {
      id: normalized.id,
      title: normalized.content,
      isDone: normalized.isDone,
      priority: normalized.priority,
      categoryId: normalized.categoryId,
      stackOrder: normalized.stackOrder,
      estimateSlots: normalized.estimatedSlots,
      linkedTimeBoxIds: normalized.linkedTimeBoxIds,
      note: normalized.note,
      origin: normalized.createdFrom,
    },
    fallbackIndex,
  )
}

const toPersistedTaskCard = (taskCard: unknown, fallbackIndex = 0) => {
  const normalized = normalizeTaskCard(taskCard, fallbackIndex)
  if (!normalized) {
    return null
  }

  return normalizeBoardCard(
    {
      id: normalized.id,
      content: normalized.title,
      isDone: normalized.isDone,
      priority: normalized.priority,
      categoryId: normalized.categoryId,
      stackOrder: normalized.stackOrder,
      estimatedSlots: normalized.estimateSlots,
      linkedTimeBoxIds: normalized.linkedTimeBoxIds,
      note: normalized.note,
      createdFrom: normalized.origin,
    },
    fallbackIndex,
  )
}

const fromPersistedBigThreeItem = (
  item: PersistedBigThreeItem | null | undefined,
): BigThreeItem | null =>
  normalizeBigThreeRecord({
    id: item?.id,
    content: item?.content,
    taskId: item?.taskId ?? item?.sourceId ?? null,
  })

const toPersistedBigThreeItem = (item: unknown) => {
  const normalized = normalizeBigThreeRecord(item)
  if (!normalized) {
    return null
  }

  return {
    id: normalized.id,
    content: normalized.content,
    sourceId: normalized.taskId,
  }
}

const fromPersistedTimeBox = (
  box: PersistedTimeBoxInput | null | undefined,
): TimeBox | null =>
  normalizeTimeBoxRecord({
    ...box,
    taskId: box?.taskId ?? box?.sourceId ?? null,
  })

const toPersistedTimeBox = (box: unknown) => {
  const normalized = normalizeTimeBoxRecord(box)
  if (!normalized) {
    return null
  }

  const { taskId, ...persisted } = normalized
  return {
    ...persisted,
    sourceId: taskId,
  }
}

export const toPlannerDayModel = (persistedDay: unknown): PlannerDayModel => {
  const safeDay = isRecord(persistedDay)
    ? (persistedDay as PersistedPlannerDayInput)
    : (createEmptyDay('') as PersistedPlannerDayInput)
  const taskCards = Array.isArray(safeDay.taskCards)
    ? safeDay.taskCards
        .map((taskCard, index) => normalizeTaskCard(taskCard, index))
        .filter((taskCard): taskCard is TaskCard => Boolean(taskCard))
    : Array.isArray(safeDay.brainDump)
      ? safeDay.brainDump
          .map((taskCard, index) => fromPersistedTaskCard(taskCard, index))
          .filter((taskCard): taskCard is TaskCard => Boolean(taskCard))
      : []

  return {
    schemaVersion: normalizeSchemaVersion(safeDay.schemaVersion),
    date: normalizePlannerDate(safeDay.date),
    taskCards,
    bigThree: Array.isArray(safeDay.bigThree)
      ? safeDay.bigThree
          .map((item) => fromPersistedBigThreeItem(item as PersistedBigThreeItem))
          .filter((item): item is BigThreeItem => Boolean(item))
      : [],
    timeBoxes: Array.isArray(safeDay.timeBoxes)
      ? safeDay.timeBoxes
          .map((box) => fromPersistedTimeBox(box as PersistedTimeBoxInput))
          .filter((box): box is TimeBox => Boolean(box))
      : [],
    stackCanvasState:
      (safeDay.stackCanvasState as StackCanvasStateRecord | undefined) ??
      createEmptyStackCanvasState(normalizePlannerDate(safeDay.date)),
  }
}

export const fromPlannerDayModel = (dayModel: Partial<PlannerDayModel> | null | undefined) => ({
  schemaVersion: dayModel?.schemaVersion ?? PLANNER_SCHEMA_VERSION,
  date: dayModel?.date ?? '',
  brainDump: Array.isArray(dayModel?.taskCards)
    ? dayModel.taskCards.map((taskCard, index) => toPersistedTaskCard(taskCard, index)).filter(Boolean)
    : [],
  bigThree: Array.isArray(dayModel?.bigThree) ? dayModel.bigThree.map(toPersistedBigThreeItem).filter(Boolean) : [],
  timeBoxes: Array.isArray(dayModel?.timeBoxes) ? dayModel.timeBoxes.map(toPersistedTimeBox).filter(Boolean) : [],
  stackCanvasState: dayModel?.stackCanvasState ?? createEmptyDay(dayModel?.date ?? '').stackCanvasState,
})

export const normalizePlannerDayInput = (
  dateStr: string,
  input: unknown,
): PlannerDayModel =>
  toPlannerDayModel(
    isRecord(input) && Array.isArray(input.taskCards)
      ? {
          ...createEmptyDay(dateStr),
          ...input,
          schemaVersion: input.schemaVersion ?? PLANNER_SCHEMA_VERSION,
          date: input.date ?? dateStr,
        }
      : migratePersistedDayData(dateStr, input),
  )

export const toPersistedDayData = (dateStr: string, input: unknown) => {
  const plannerDay = normalizePlannerDayInput(dateStr, input)
  return migratePersistedDayData(dateStr, fromPlannerDayModel(plannerDay))
}

export const toPlannerMetaModel = (persistedMeta: unknown): PlannerMetaModel => {
  const safeMeta = isRecord(persistedMeta) ? persistedMeta : createEmptyMeta()

  return {
    schemaVersion: normalizeSchemaVersion(safeMeta.schemaVersion),
    categories: Array.isArray(safeMeta.categories)
      ? (safeMeta.categories as PlannerMetaModel['categories'])
      : [],
    templates: Array.isArray(safeMeta.templates) ? safeMeta.templates : [],
  }
}

export const fromPlannerMetaModel = (metaModel: Partial<PlannerMetaModel> | null | undefined) => ({
  schemaVersion: metaModel?.schemaVersion ?? PLANNER_SCHEMA_VERSION,
  categories: Array.isArray(metaModel?.categories) ? metaModel.categories : [],
  templates: Array.isArray(metaModel?.templates) ? metaModel.templates : [],
})

export const normalizePlannerMetaInput = (input: unknown): PlannerMetaModel =>
  toPlannerMetaModel(migratePersistedMeta(input))

export const toPersistedMeta = (input: unknown) =>
  migratePersistedMeta(fromPlannerMetaModel(normalizePlannerMetaInput(input)))
