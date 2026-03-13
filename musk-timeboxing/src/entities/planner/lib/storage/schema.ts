import { createEmptyStackCanvasState } from '../stackCanvasState'
import type {
  CategoryRecord,
  StackCanvasStateRecord,
  TaskCardOrigin,
  TaskCardPriority,
  TimeBoxStatus,
} from '../../model/types'

export const PLANNER_SCHEMA_VERSION = 4
export const PLANNER_META_KEY = 'musk-planner-meta'
export const PLANNER_DAY_KEY_PREFIX = 'musk-planner-'
export const PLANNER_DAY_KEY_PATTERN = /^musk-planner-\d{4}-\d{2}-\d{2}$/
export const PLANNER_DATE_STR_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const PLANNER_LAST_ACTIVE_DATE_KEY = 'musk-planner-last-date'
export const PLANNER_LAST_FOCUS_KEY = 'musk-planner-last-focus'
export const PLANNER_LAST_VIEW_MODE_KEY = 'musk-planner-last-view-mode'
export const PLANNER_AUTO_SYNC_INTERVAL_KEY = 'musk-planner-auto-sync-interval-ms'

export interface PersistedBrainDumpItem {
  id: string
  content: string
  isDone: boolean
  priority: TaskCardPriority
  categoryId: string | null
  stackOrder: number
  estimatedSlots: number
  linkedTimeBoxIds: string[]
  note: string
  createdFrom: TaskCardOrigin
}

export interface PersistedBigThreeItem {
  id: string
  content: string
  sourceId: string | null
}

export interface PersistedTimeBox {
  id: string
  content: string
  sourceId: string | null
  startSlot: number
  endSlot: number
  status: TimeBoxStatus
  actualMinutes: number | null
  category: string | null
  categoryId: string | null
  skipReason: string | null
  carryOverFromDate: string | null
  carryOverFromBoxId: string | null
  timerStartedAt: number | null
  elapsedSeconds: number
}

export interface PersistedPlannerTemplate {
  id: string
  name: string
  content: string
  durationSlots: number
  categoryId: string | null
}

export interface PersistedPlannerDay {
  schemaVersion: number
  date: string
  brainDump: PersistedBrainDumpItem[]
  bigThree: PersistedBigThreeItem[]
  timeBoxes: PersistedTimeBox[]
  stackCanvasState: StackCanvasStateRecord
}

export interface PersistedPlannerMeta {
  schemaVersion: number
  categories: CategoryRecord[]
  templates: PersistedPlannerTemplate[]
}

export const createEmptyDay = (dateStr: string): PersistedPlannerDay => ({
  schemaVersion: PLANNER_SCHEMA_VERSION,
  date: dateStr,
  brainDump: [],
  bigThree: [],
  timeBoxes: [],
  stackCanvasState: createEmptyStackCanvasState(),
})

export const createEmptyMeta = (): PersistedPlannerMeta => ({
  schemaVersion: PLANNER_SCHEMA_VERSION,
  categories: [],
  templates: [],
})

export const getDayKey = (dateStr: string): string => `${PLANNER_DAY_KEY_PREFIX}${dateStr}`

export const isDayKey = (key: unknown): boolean => PLANNER_DAY_KEY_PATTERN.test(String(key))

export const isPlannerDateString = (value: unknown): boolean =>
  PLANNER_DATE_STR_PATTERN.test(String(value))
