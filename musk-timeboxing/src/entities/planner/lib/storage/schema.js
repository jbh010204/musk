import { createEmptyStackCanvasState } from '../stackCanvasState'

export const PLANNER_SCHEMA_VERSION = 4
export const PLANNER_META_KEY = 'musk-planner-meta'
export const PLANNER_DAY_KEY_PREFIX = 'musk-planner-'
export const PLANNER_DAY_KEY_PATTERN = /^musk-planner-\d{4}-\d{2}-\d{2}$/
export const PLANNER_DATE_STR_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const PLANNER_LAST_ACTIVE_DATE_KEY = 'musk-planner-last-date'
export const PLANNER_LAST_FOCUS_KEY = 'musk-planner-last-focus'
export const PLANNER_LAST_VIEW_MODE_KEY = 'musk-planner-last-view-mode'
export const PLANNER_AUTO_SYNC_INTERVAL_KEY = 'musk-planner-auto-sync-interval-ms'

export const createEmptyDay = (dateStr) => ({
  schemaVersion: PLANNER_SCHEMA_VERSION,
  date: dateStr,
  brainDump: [],
  bigThree: [],
  timeBoxes: [],
  stackCanvasState: createEmptyStackCanvasState(),
})

export const createEmptyMeta = () => ({
  schemaVersion: PLANNER_SCHEMA_VERSION,
  categories: [],
  templates: [],
})

export const getDayKey = (dateStr) => `${PLANNER_DAY_KEY_PREFIX}${dateStr}`

export const isDayKey = (key) => PLANNER_DAY_KEY_PATTERN.test(String(key))

export const isPlannerDateString = (value) => PLANNER_DATE_STR_PATTERN.test(String(value))
