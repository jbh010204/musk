import { normalizeBoardCard, syncBoardCardsWithTimeBoxes } from './boardCard'
import { sortBrainDumpItems } from './brainDumpPriority'
import { TOTAL_SLOTS } from './timeSlot'
import {
  bootstrapServerStorage,
  getServerAvailability,
  isServerPersistenceEnabled,
  saveDayToServer,
  saveLastActiveDateToServer,
  saveLastFocusToServer,
  saveMetaToServer,
  subscribeServerAvailability,
  syncSnapshotToServer,
} from './storageServer'

const SCHEMA_VERSION = 3
const META_KEY = 'musk-planner-meta'
const DAY_KEY_PREFIX = 'musk-planner-'
const DAY_KEY_PATTERN = /^musk-planner-\d{4}-\d{2}-\d{2}$/
const DATE_STR_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const LAST_ACTIVE_DATE_KEY = 'musk-planner-last-date'
const LAST_FOCUS_KEY = 'musk-planner-last-focus'
const AUTO_SYNC_INTERVAL_KEY = 'musk-planner-auto-sync-interval-ms'
const DEFAULT_AUTO_SYNC_INTERVAL_MS = Number(import.meta.env.VITE_STORAGE_AUTO_SYNC_INTERVAL_MS || 20000)
const MIN_AUTO_SYNC_INTERVAL_MS = 5000

let autoSyncStarted = false
let autoSyncTimerId = null
let autoSyncDirty = false
let autoSyncMode = 'merge'
let autoSyncInFlight = null
let autoSyncLastSuccessAt = null
let autoSyncLastAttemptAt = null
let autoSyncLastStatus = 'idle'
let autoSyncListenersCleanup = null
let plannerChangeVersion = 0
const persistenceListeners = new Set()
let stopServerAvailabilitySubscription = null

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
  templates: [],
})

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

const hasMeaningfulDayData = (dayData) => {
  const safeDay = dayData && typeof dayData === 'object' ? dayData : {}
  return (
    (Array.isArray(safeDay.brainDump) && safeDay.brainDump.length > 0) ||
    (Array.isArray(safeDay.bigThree) && safeDay.bigThree.length > 0) ||
    (Array.isArray(safeDay.timeBoxes) && safeDay.timeBoxes.length > 0)
  )
}

const normalizeBrainDumpItem = (item, index = 0) => normalizeBoardCard(item, index)

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
  const normalizedTimeBoxes = Array.isArray(safeData.timeBoxes) ? safeData.timeBoxes.map(normalizeTimeBox) : []
  const normalizedBrainDump = Array.isArray(safeData.brainDump)
    ? sortBrainDumpItems(
        safeData.brainDump.map((item, index) => normalizeBrainDumpItem(item, index)).filter(Boolean),
      )
    : []

  return {
    schemaVersion: SCHEMA_VERSION,
    date: dateStr,
    brainDump: syncBoardCardsWithTimeBoxes(normalizedBrainDump, normalizedTimeBoxes),
    bigThree: Array.isArray(safeData.bigThree) ? safeData.bigThree : [],
    timeBoxes: normalizedTimeBoxes,
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

  const currentMeta = loadMeta()
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    categories: Array.isArray(meta?.categories) ? meta.categories : currentMeta.categories,
    templates: Array.isArray(meta?.templates)
      ? meta.templates.map(normalizeTemplate).filter(Boolean)
      : currentMeta.templates,
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
    loadMeta().templates.length > 0 ||
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

const emitPersistenceStatus = () => {
  const status = getPlannerPersistenceStatus()
  persistenceListeners.forEach((listener) => {
    try {
      listener(status)
    } catch {
      // no-op
    }
  })
}

const ensurePersistenceStatusSubscription = () => {
  if (stopServerAvailabilitySubscription || typeof window === 'undefined') {
    return
  }

  stopServerAvailabilitySubscription = subscribeServerAvailability(() => {
    emitPersistenceStatus()
  })
}

const getAutoSyncIntervalMs = () => {
  if (typeof window === 'undefined') {
    return Math.max(MIN_AUTO_SYNC_INTERVAL_MS, DEFAULT_AUTO_SYNC_INTERVAL_MS)
  }

  const runtimeOverride = Number(window.__MUSK_PLANNER_AUTO_SYNC_INTERVAL_MS__)
  if (Number.isFinite(runtimeOverride) && runtimeOverride >= MIN_AUTO_SYNC_INTERVAL_MS) {
    return runtimeOverride
  }

  const persistedOverride = Number(window.localStorage.getItem(AUTO_SYNC_INTERVAL_KEY))
  if (Number.isFinite(persistedOverride) && persistedOverride >= MIN_AUTO_SYNC_INTERVAL_MS) {
    return persistedOverride
  }

  return Math.max(MIN_AUTO_SYNC_INTERVAL_MS, DEFAULT_AUTO_SYNC_INTERVAL_MS)
}

const markPlannerDirty = (mode = 'merge') => {
  plannerChangeVersion += 1
  autoSyncDirty = true
  autoSyncLastStatus = 'pending'
  if (mode === 'replace') {
    autoSyncMode = 'replace'
  }
  emitPersistenceStatus()
}

const finalizePlannerSync = (syncedVersion) => {
  autoSyncLastSuccessAt = Date.now()
  if (syncedVersion >= plannerChangeVersion) {
    autoSyncDirty = false
    autoSyncMode = 'merge'
    autoSyncLastStatus = 'synced'
    emitPersistenceStatus()
    return
  }

  autoSyncDirty = true
  autoSyncLastStatus = 'pending'
  emitPersistenceStatus()
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
  markPlannerDirty('merge')
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
      templates: Array.isArray(parsed.templates) ? parsed.templates.map(normalizeTemplate).filter(Boolean) : [],
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
    categories: Array.isArray(meta?.categories) ? meta.categories : loadMeta().categories,
    templates: Array.isArray(meta?.templates)
      ? meta.templates.map(normalizeTemplate).filter(Boolean)
      : loadMeta().templates,
  }

  saveMetaLocal(payload)
  markPlannerDirty('merge')
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
  markPlannerDirty('merge')
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
  markPlannerDirty('merge')
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
  markPlannerDirty('replace')
  void syncPlannerDataToServer({ mode: 'replace', force: true })
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
  let importedTemplates = 0
  if (meta && Array.isArray(meta.categories)) {
    saveMetaLocal({
      categories: meta.categories,
      templates: Array.isArray(meta.templates) ? meta.templates : loadMeta().templates,
    })
    importedCategories = meta.categories.length
    importedTemplates = Array.isArray(meta.templates) ? meta.templates.length : 0
  } else if (meta && Array.isArray(meta.templates)) {
    saveMetaLocal({
      categories: loadMeta().categories,
      templates: meta.templates,
    })
    importedTemplates = meta.templates.length
  }

  if (lastActiveDate) {
    saveLastActiveDateLocal(lastActiveDate)
  }

  if (lastFocus) {
    saveLastFocusLocal(lastFocus)
  }

  markPlannerDirty(mode)
  void syncPlannerDataToServer({ mode, force: true })

  return {
    ok: true,
    importedDays,
    skippedDays,
    importedCategories,
    importedTemplates,
  }
}

export const hydratePlannerStorageFromServer = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve({ mode: 'disabled', hydrated: false, serverAvailable: false })
  }

  return bootstrapServerStorage({
    hasLocalData: hasPlannerLocalData,
    readLocalSnapshot: () => buildSnapshotPayload(),
    applyServerSnapshot: (snapshot) => {
      applySnapshotToLocal(snapshot)
      plannerChangeVersion = 0
      autoSyncDirty = false
      autoSyncMode = 'merge'
      autoSyncLastStatus = 'idle'
      emitPersistenceStatus()
    },
  })
}

export const syncPlannerDataToServer = async (options = {}) => {
  if (typeof window === 'undefined') {
    return { ok: false, mode: 'disabled' }
  }

  let requestedMode = options.mode === 'replace' ? 'replace' : autoSyncMode
  const force = options.force === true

  if (!force && !autoSyncDirty) {
    return {
      ok: true,
      mode: requestedMode,
      skipped: true,
      localDayCount: Object.keys(readLocalDaysSnapshot()).length,
    }
  }

  if (autoSyncInFlight) {
    await autoSyncInFlight
    requestedMode = options.mode === 'replace' ? 'replace' : autoSyncMode
    if (!force && !autoSyncDirty) {
      return {
        ok: true,
        mode: requestedMode,
        skipped: true,
        localDayCount: Object.keys(readLocalDaysSnapshot()).length,
      }
    }
  }

  const payload = buildSnapshotPayload(options.dateStr ?? null)
  const syncVersion = plannerChangeVersion
  autoSyncLastAttemptAt = Date.now()
  autoSyncLastStatus = 'syncing'
  emitPersistenceStatus()

  autoSyncInFlight = syncSnapshotToServer(payload, { mode: requestedMode })
    .then((result) => {
      if (result?.ok) {
        finalizePlannerSync(syncVersion)
      } else {
        autoSyncLastStatus = 'error'
        emitPersistenceStatus()
      }

      return {
        ...result,
        localDayCount: Object.keys(payload.days).length,
      }
    })
    .finally(() => {
      autoSyncInFlight = null
    })

  return autoSyncInFlight
}

export const startPlannerAutoSync = () => {
  if (typeof window === 'undefined' || autoSyncStarted || !isServerPersistenceEnabled()) {
    return () => {}
  }

  autoSyncStarted = true
  ensurePersistenceStatusSubscription()
  emitPersistenceStatus()

  const flushIfDirty = (options = {}) => {
    if (!autoSyncDirty && options.force !== true) {
      return
    }

    void syncPlannerDataToServer(options)
  }

  autoSyncTimerId = window.setInterval(() => {
    flushIfDirty()
  }, getAutoSyncIntervalMs())

  const handleOnline = () => {
    flushIfDirty({ force: true })
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      flushIfDirty({ force: true })
    }
  }

  const handlePageHide = () => {
    flushIfDirty({ force: true })
  }

  window.addEventListener('online', handleOnline)
  window.document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)

  autoSyncListenersCleanup = () => {
    window.removeEventListener('online', handleOnline)
    window.document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', handlePageHide)
  }

  return () => {
    if (autoSyncTimerId != null) {
      window.clearInterval(autoSyncTimerId)
      autoSyncTimerId = null
    }
    autoSyncListenersCleanup?.()
    autoSyncListenersCleanup = null
    autoSyncStarted = false
  }
}

export const getPlannerPersistenceStatus = () => ({
  serverEnabled: isServerPersistenceEnabled(),
  serverAvailability: getServerAvailability(),
  hasLocalData: hasPlannerLocalData(),
  autoSyncIntervalMs: getAutoSyncIntervalMs(),
  autoSyncDirty,
  autoSyncLastSuccessAt,
  autoSyncLastAttemptAt,
  autoSyncLastStatus,
})

export const subscribePlannerPersistenceStatus = (listener) => {
  if (typeof listener !== 'function') {
    return () => {}
  }

  ensurePersistenceStatusSubscription()
  persistenceListeners.add(listener)
  listener(getPlannerPersistenceStatus())

  return () => {
    persistenceListeners.delete(listener)
  }
}
