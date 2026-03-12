import { createEmptyDay, createEmptyMeta, PLANNER_SCHEMA_VERSION } from './schema'
import { migratePersistedDayData, migratePersistedMeta } from './migrations'
import { normalizeBoardCard } from '../boardCard'
import { normalizeBigThreeRecord } from '../../model/bigThree'
import { normalizeTaskCard } from '../../model/taskCards'
import { normalizeTimeBoxRecord } from '../../model/timeBoxes'

const fromPersistedTaskCard = (taskCard, fallbackIndex = 0) => {
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

const toPersistedTaskCard = (taskCard, fallbackIndex = 0) => {
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

const fromPersistedBigThreeItem = (item) =>
  normalizeBigThreeRecord({
    id: item?.id,
    content: item?.content,
    taskId: item?.taskId ?? item?.sourceId ?? null,
  })

const toPersistedBigThreeItem = (item) => {
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

const fromPersistedTimeBox = (box) =>
  normalizeTimeBoxRecord({
    ...box,
    taskId: box?.taskId ?? box?.sourceId ?? null,
  })

const toPersistedTimeBox = (box) => {
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

export const toPlannerDayModel = (persistedDay) => {
  const safeDay = persistedDay && typeof persistedDay === 'object' ? persistedDay : createEmptyDay('')
  const taskCards = Array.isArray(safeDay.taskCards)
    ? safeDay.taskCards.map((taskCard, index) => normalizeTaskCard(taskCard, index)).filter(Boolean)
    : Array.isArray(safeDay.brainDump)
      ? safeDay.brainDump.map((taskCard, index) => fromPersistedTaskCard(taskCard, index)).filter(Boolean)
      : []

  return {
    schemaVersion: safeDay.schemaVersion ?? PLANNER_SCHEMA_VERSION,
    date: safeDay.date ?? '',
    taskCards,
    bigThree: Array.isArray(safeDay.bigThree) ? safeDay.bigThree.map(fromPersistedBigThreeItem).filter(Boolean) : [],
    timeBoxes: Array.isArray(safeDay.timeBoxes) ? safeDay.timeBoxes.map(fromPersistedTimeBox).filter(Boolean) : [],
    stackCanvasState: safeDay.stackCanvasState ?? createEmptyDay(safeDay.date ?? '').stackCanvasState,
  }
}

export const fromPlannerDayModel = (dayModel) => ({
  schemaVersion: dayModel?.schemaVersion ?? PLANNER_SCHEMA_VERSION,
  date: dayModel?.date ?? '',
  brainDump: Array.isArray(dayModel?.taskCards)
    ? dayModel.taskCards.map((taskCard, index) => toPersistedTaskCard(taskCard, index)).filter(Boolean)
    : [],
  bigThree: Array.isArray(dayModel?.bigThree) ? dayModel.bigThree.map(toPersistedBigThreeItem).filter(Boolean) : [],
  timeBoxes: Array.isArray(dayModel?.timeBoxes) ? dayModel.timeBoxes.map(toPersistedTimeBox).filter(Boolean) : [],
  stackCanvasState: dayModel?.stackCanvasState ?? createEmptyDay(dayModel?.date ?? '').stackCanvasState,
})

export const normalizePlannerDayInput = (dateStr, input) =>
  toPlannerDayModel(
    input && typeof input === 'object' && Array.isArray(input.taskCards)
      ? {
          ...createEmptyDay(dateStr),
          ...input,
          schemaVersion: input.schemaVersion ?? PLANNER_SCHEMA_VERSION,
          date: input.date ?? dateStr,
        }
      : migratePersistedDayData(dateStr, input),
  )

export const toPersistedDayData = (dateStr, input) => {
  const plannerDay = normalizePlannerDayInput(dateStr, input)
  return migratePersistedDayData(dateStr, fromPlannerDayModel(plannerDay))
}

export const toPlannerMetaModel = (persistedMeta) => {
  const safeMeta = persistedMeta && typeof persistedMeta === 'object' ? persistedMeta : createEmptyMeta()

  return {
    schemaVersion: safeMeta.schemaVersion ?? PLANNER_SCHEMA_VERSION,
    categories: Array.isArray(safeMeta.categories) ? safeMeta.categories : [],
    templates: Array.isArray(safeMeta.templates) ? safeMeta.templates : [],
  }
}

export const fromPlannerMetaModel = (metaModel) => ({
  schemaVersion: metaModel?.schemaVersion ?? PLANNER_SCHEMA_VERSION,
  categories: Array.isArray(metaModel?.categories) ? metaModel.categories : [],
  templates: Array.isArray(metaModel?.templates) ? metaModel.templates : [],
})

export const normalizePlannerMetaInput = (input) => toPlannerMetaModel(migratePersistedMeta(input))

export const toPersistedMeta = (input) => migratePersistedMeta(fromPlannerMetaModel(normalizePlannerMetaInput(input)))
