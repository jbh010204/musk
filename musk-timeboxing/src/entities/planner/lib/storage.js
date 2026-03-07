import { normalizeBrainDumpPriority, sortBrainDumpItems } from './brainDumpPriority'
import {
  bootstrapServerStorage,
  clearPlannerDataOnServer,
  getServerAvailability,
  isServerPersistenceEnabled,
  saveDayToServer,
  saveLastActiveDateToServer,
  saveLastFocusToServer,
  saveMetaToServer,
  syncSnapshotToServer,
} from './storageServer'

const SCHEMA_VERSION = 2
const META_KEY = 'musk-planner-meta'
const DAY_KEY_PREFIX = 'musk-planner-'
const DAY_KEY_PATTERN = /^musk-planner-\d{4}-\d{2}-\d{2}$/
const DATE_STR_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const LAST_ACTIVE_DATE_KEY = 'musk-planner-last-date'
const LAST_FOCUS_KEY = 'musk-planner-last-focus'

const createEmptyDay = (dateStr) => ({
  schemaVersion: SCHEMA_VERSION,
  date: dateStr,
  brainDump: [],
  bigThree: [],
  timeBoxes: [],
})

const createEmptyMeta = () => ({
  schemaVersion: SCHEMA_VERSION,
  categories: [],
})

const hasMeaningfulDayData = (dayData) => {
  const safeDay = dayData && typeof dayData === 'object' ? dayData : {}
  return (
    (Array.isArray(safeDay.brainDump) && safeDay.brainDump.length > 0) ||
    (Array.isArray(safeDay.bigThree) && safeDay.bigThree.length > 0) ||
    (Array.isArray(safeDay.timeBoxes) && safeDay.timeBoxes.length > 0)
  )
}

const normalizeBrainDumpItem = (item) => {
  const content = typeof item?.content === 'string' ? item.content.trim() : ''

  if (!content) {
    return null
  }

  return {
    id: typeof item?.id === 'string' ? item.id : crypto.randomUUID(),
    content,
    isDone: Boolean(item?.isDone),
    priority: normalizeBrainDumpPriority(item?.priority),
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

const migrateDayData = (dateStr, rawData) => {
  const safeData = rawData && typeof rawData === 'object' ? rawData : {}

  return {
    schemaVersion: SCHEMA_VERSION,
    date: dateStr,
    brainDump: Array.isArray(safeData.brainDump)
      ? sortBrainDumpItems(safeData.brainDump.map(normalizeBrainDumpItem).filter(Boolean))
      : [],
    bigThree: Array.isArray(safeData.bigThree) ? safeData.bigThree : [],
    timeBoxes: Array.isArray(safeData.timeBoxes) ? safeData.timeBoxes.map(normalizeTimeBox) : [],
  }
}

const toPlainDayData = (dateStr, data) => ({
  ...migrateDayData(dateStr, data),
})

const clearPlannerDataLocal = () => {
  if (typeof window === 'undefined') {
    return
  }

  Object.keys(window.localStorage).forEach((key) => {
    if (isDayKey(key) || key === META_KEY || key === LAST_ACTIVE_DATE_KEY || key === LAST_FOCUS_KEY) {
      window.localStorage.removeItem(key)
    }
  })
}

const saveDayLocal = (dateStr, data) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = toPlainDayData(dateStr, data)
  window.localStorage.setItem(getKey(dateStr), JSON.stringify(payload))
}

const saveMetaLocal = (meta) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = {
    schemaVersion: SCHEMA_VERSION,
    categories: Array.isArray(meta?.categories) ? meta.categories : [],
  }

  window.localStorage.setItem(META_KEY, JSON.stringify(payload))
}

const saveLastActiveDateLocal = (dateStr) => {
  if (typeof window === 'undefined' || !DATE_STR_PATTERN.test(String(dateStr))) {
    return
  }

  window.localStorage.setItem(LAST_ACTIVE_DATE_KEY, dateStr)
}

const saveLastFocusLocal = ({ date, slot, ts = Date.now() }) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!DATE_STR_PATTERN.test(String(date)) || !Number.isInteger(slot)) {
    return
  }

  window.localStorage.setItem(
    LAST_FOCUS_KEY,
    JSON.stringify({
      date,
      slot,
      ts,
    }),
  )
}

const parseImportPayload = (input) => {
  if (typeof input === 'string') {
    return JSON.parse(input)
  }

  return input
}

const readLocalDaysSnapshot = (dateStr = null) => {
  if (typeof window === 'undefined') {
    return {}
  }

  const days = {}

  if (dateStr) {
    days[dateStr] = loadDay(dateStr)
    return days
  }

  Object.keys(window.localStorage)
    .filter((key) => isDayKey(key))
    .forEach((key) => {
      const dayStr = key.replace(DAY_KEY_PREFIX, '')
      days[dayStr] = loadDay(dayStr)
    })

  return days
}

const buildSnapshotPayload = (dateStr = null) => ({
  schemaVersion: SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  days: readLocalDaysSnapshot(dateStr),
  meta: loadMeta(),
  lastActiveDate: loadLastActiveDate(),
  lastFocus: loadLastFocus(),
})

const hasPlannerLocalData = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    Object.keys(window.localStorage)
      .filter((key) => isDayKey(key))
      .some((key) => hasMeaningfulDayData(loadDay(key.replace(DAY_KEY_PREFIX, '')))) ||
    loadMeta().categories.length > 0 ||
    loadLastActiveDate() !== null ||
    loadLastFocus() !== null
  )
}

const applySnapshotToLocal = (snapshot) => {
  if (typeof window === 'undefined' || !snapshot || typeof snapshot !== 'object') {
    return
  }

  clearPlannerDataLocal()

  if (snapshot.days && typeof snapshot.days === 'object') {
    Object.entries(snapshot.days).forEach(([dateStr, dayData]) => {
      if (!DATE_STR_PATTERN.test(dateStr)) {
        return
      }

      saveDayLocal(dateStr, dayData)
    })
  }

  if (snapshot.meta && typeof snapshot.meta === 'object') {
    saveMetaLocal(snapshot.meta)
  }

  if (DATE_STR_PATTERN.test(String(snapshot.lastActiveDate))) {
    saveLastActiveDateLocal(snapshot.lastActiveDate)
  }

  if (
    snapshot.lastFocus &&
    typeof snapshot.lastFocus === 'object' &&
    DATE_STR_PATTERN.test(String(snapshot.lastFocus.date)) &&
    Number.isInteger(snapshot.lastFocus.slot)
  ) {
    saveLastFocusLocal(snapshot.lastFocus)
  }
}

export const getKey = (dateStr) => `${DAY_KEY_PREFIX}${dateStr}`

export const isDayKey = (key) => DAY_KEY_PATTERN.test(String(key))

export const loadDay = (dateStr) => {
  if (typeof window === 'undefined') {
    return createEmptyDay(dateStr)
  }

  const raw = window.localStorage.getItem(getKey(dateStr))

  if (!raw) {
    return createEmptyDay(dateStr)
  }

  try {
    return migrateDayData(dateStr, JSON.parse(raw))
  } catch {
    return createEmptyDay(dateStr)
  }
}

export const saveDay = (dateStr, data) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = toPlainDayData(dateStr, data)
  saveDayLocal(dateStr, payload)
  void saveDayToServer(dateStr, payload)
}

export const loadMeta = () => {
  if (typeof window === 'undefined') {
    return createEmptyMeta()
  }

  const raw = window.localStorage.getItem(META_KEY)

  if (!raw) {
    return createEmptyMeta()
  }

  try {
    const parsed = JSON.parse(raw)

    return {
      schemaVersion: SCHEMA_VERSION,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    }
  } catch {
    return createEmptyMeta()
  }
}

export const saveMeta = (meta) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = {
    schemaVersion: SCHEMA_VERSION,
    categories: Array.isArray(meta?.categories) ? meta.categories : [],
  }

  saveMetaLocal(payload)
  void saveMetaToServer(payload)
}

export const loadLastActiveDate = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(LAST_ACTIVE_DATE_KEY)
  return DATE_STR_PATTERN.test(String(value)) ? value : null
}

export const saveLastActiveDate = (dateStr) => {
  if (typeof window === 'undefined' || !DATE_STR_PATTERN.test(String(dateStr))) {
    return
  }

  saveLastActiveDateLocal(dateStr)
  void saveLastActiveDateToServer(dateStr)
}

export const getMostRecentStoredDate = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const dates = Object.keys(window.localStorage)
    .filter((key) => isDayKey(key))
    .map((key) => key.replace(DAY_KEY_PREFIX, ''))
    .filter((dateStr) => DATE_STR_PATTERN.test(dateStr))
    .sort()

  return dates.length > 0 ? dates[dates.length - 1] : null
}

export const loadLastFocus = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(LAST_FOCUS_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    if (!DATE_STR_PATTERN.test(String(parsed?.date)) || !Number.isInteger(parsed?.slot)) {
      return null
    }

    return {
      date: parsed.date,
      slot: parsed.slot,
      ts: Number.isFinite(parsed?.ts) ? Number(parsed.ts) : Date.now(),
    }
  } catch {
    return null
  }
}

export const saveLastFocus = ({ date, slot }) => {
  if (typeof window === 'undefined') {
    return
  }

  if (!DATE_STR_PATTERN.test(String(date)) || !Number.isInteger(slot)) {
    return
  }

  const payload = {
    date,
    slot,
    ts: Date.now(),
  }

  saveLastFocusLocal(payload)
  void saveLastFocusToServer(payload)
}

export const exportPlannerData = (dateStr = null) => {
  if (typeof window === 'undefined') {
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      days: {},
      meta: createEmptyMeta(),
      lastActiveDate: null,
      lastFocus: null,
    }
  }

  return buildSnapshotPayload(dateStr)
}

export const clearPlannerData = () => {
  if (typeof window === 'undefined') {
    return
  }

  clearPlannerDataLocal()
  void clearPlannerDataOnServer()
}

export const importPlannerData = (input, options = {}) => {
  if (typeof window === 'undefined') {
    return { ok: false, error: '브라우저 환경에서만 가져올 수 있습니다' }
  }

  const mode = options.mode === 'replace' ? 'replace' : 'merge'
  let payload

  try {
    payload = parseImportPayload(input)
  } catch {
    return { ok: false, error: '유효한 JSON 형식이 아닙니다' }
  }

  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: '가져오기 데이터 형식이 올바르지 않습니다' }
  }

  const days = payload.days && typeof payload.days === 'object' ? payload.days : null
  const meta = payload.meta && typeof payload.meta === 'object' ? payload.meta : null
  const lastActiveDate = DATE_STR_PATTERN.test(String(payload.lastActiveDate)) ? payload.lastActiveDate : null
  const lastFocus =
    payload.lastFocus &&
    typeof payload.lastFocus === 'object' &&
    DATE_STR_PATTERN.test(String(payload.lastFocus.date)) &&
    Number.isInteger(payload.lastFocus.slot)
      ? payload.lastFocus
      : null

  if (!days && !meta && !lastActiveDate && !lastFocus) {
    return { ok: false, error: 'days 또는 meta 데이터가 필요합니다' }
  }

  if (mode === 'replace') {
    clearPlannerDataLocal()
  }

  let importedDays = 0
  let skippedDays = 0

  if (days) {
    Object.entries(days).forEach(([dateStr, dayData]) => {
      if (!DATE_STR_PATTERN.test(dateStr)) {
        skippedDays += 1
        return
      }

      saveDayLocal(dateStr, toPlainDayData(dateStr, dayData))
      importedDays += 1
    })
  }

  let importedCategories = 0
  if (meta && Array.isArray(meta.categories)) {
    saveMetaLocal({
      categories: meta.categories,
    })
    importedCategories = meta.categories.length
  }

  if (lastActiveDate) {
    saveLastActiveDateLocal(lastActiveDate)
  }

  if (lastFocus) {
    saveLastFocusLocal(lastFocus)
  }

  void syncSnapshotToServer(buildSnapshotPayload(), { mode: 'replace' })

  return {
    ok: true,
    importedDays,
    skippedDays,
    importedCategories,
  }
}

export const hydratePlannerStorageFromServer = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve({ mode: 'disabled', hydrated: false, serverAvailable: false })
  }

  return bootstrapServerStorage({
    hasLocalData: hasPlannerLocalData,
    readLocalSnapshot: () => buildSnapshotPayload(),
    applyServerSnapshot: applySnapshotToLocal,
  })
}

export const syncPlannerDataToServer = async (options = {}) => {
  if (typeof window === 'undefined') {
    return { ok: false, mode: 'disabled' }
  }

  const payload = buildSnapshotPayload(options.dateStr ?? null)
  const result = await syncSnapshotToServer(payload, { mode: options.mode })
  return {
    ...result,
    localDayCount: Object.keys(payload.days).length,
  }
}

export const getPlannerPersistenceStatus = () => ({
  serverEnabled: isServerPersistenceEnabled(),
  serverAvailability: getServerAvailability(),
  hasLocalData: hasPlannerLocalData(),
})
