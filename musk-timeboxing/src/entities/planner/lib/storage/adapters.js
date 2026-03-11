import { createEmptyDay, createEmptyMeta, PLANNER_SCHEMA_VERSION } from './schema'
import { migratePersistedDayData, migratePersistedMeta } from './migrations'

export const toPlannerDayModel = (persistedDay) => {
  const safeDay = persistedDay && typeof persistedDay === 'object' ? persistedDay : createEmptyDay('')

  return {
    schemaVersion: safeDay.schemaVersion ?? PLANNER_SCHEMA_VERSION,
    date: safeDay.date ?? '',
    taskCards: Array.isArray(safeDay.brainDump) ? safeDay.brainDump : [],
    bigThree: Array.isArray(safeDay.bigThree) ? safeDay.bigThree : [],
    timeBoxes: Array.isArray(safeDay.timeBoxes) ? safeDay.timeBoxes : [],
    boardCanvas: safeDay.boardCanvas ?? createEmptyDay(safeDay.date ?? '').boardCanvas,
  }
}

export const fromPlannerDayModel = (dayModel) => ({
  schemaVersion: dayModel?.schemaVersion ?? PLANNER_SCHEMA_VERSION,
  date: dayModel?.date ?? '',
  brainDump: Array.isArray(dayModel?.taskCards) ? dayModel.taskCards : [],
  bigThree: Array.isArray(dayModel?.bigThree) ? dayModel.bigThree : [],
  timeBoxes: Array.isArray(dayModel?.timeBoxes) ? dayModel.timeBoxes : [],
  boardCanvas: dayModel?.boardCanvas ?? createEmptyDay(dayModel?.date ?? '').boardCanvas,
})

export const normalizePlannerDayInput = (dateStr, input) =>
  toPlannerDayModel(migratePersistedDayData(dateStr, input))

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
