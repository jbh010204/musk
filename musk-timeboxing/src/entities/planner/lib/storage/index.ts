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
} from '../storageServer'
import {
  fromPlannerDayModel,
  fromPlannerMetaModel,
  toPersistedDayData,
  toPersistedMeta,
  toPlannerDayModel,
  toPlannerMetaModel,
} from './adapters'
import {
  hasMeaningfulPersistedDayData,
  migratePersistedDayData,
  migratePersistedMeta,
} from './migrations'
import {
  createEmptyDay,
  createEmptyMeta,
  getDayKey as getPersistedDayKey,
  isDayKey as isPersistedDayKey,
  PLANNER_AUTO_SYNC_INTERVAL_KEY,
  PLANNER_DATE_STR_PATTERN,
  PLANNER_DAY_KEY_PREFIX,
  PLANNER_LAST_ACTIVE_DATE_KEY,
  PLANNER_LAST_FOCUS_KEY,
  PLANNER_LAST_VIEW_MODE_KEY,
  PLANNER_META_KEY,
  PLANNER_SCHEMA_VERSION,
} from './schema'
import type {
  PersistedPlannerDay,
  PersistedPlannerMeta,
} from './schema'
import type { LastFocusSnapshot, PlannerMetaModel } from '../../model/types'

type PlannerDayModel = ReturnType<typeof toPlannerDayModel>
type PlannerViewMode = 'WORKSPACE' | 'CANVAS' | 'DAY' | 'WEEK' | 'MONTH'
type AutoSyncMode = 'merge' | 'replace'
type AutoSyncStatus = 'idle' | 'pending' | 'syncing' | 'synced' | 'error'
type ServerAvailability = 'unknown' | 'disabled' | 'online' | 'offline'

interface PlannerSnapshot {
  schemaVersion: number
  exportedAt: string
  days: Record<string, PersistedPlannerDay>
  meta: PersistedPlannerMeta
  lastActiveDate: string | null
  lastFocus: LastFocusSnapshot | null
  lastViewMode: PlannerViewMode | null
}

interface PlannerPersistenceStatus {
  serverEnabled: boolean
  serverAvailability: ServerAvailability
  hasLocalData: boolean
  autoSyncIntervalMs: number
  autoSyncDirty: boolean
  autoSyncLastSuccessAt: number | null
  autoSyncLastAttemptAt: number | null
  autoSyncLastStatus: AutoSyncStatus
}

interface SyncPlannerOptions {
  mode?: AutoSyncMode
  force?: boolean
  dateStr?: string | null
}

interface SyncPlannerResult {
  ok: boolean
  mode: AutoSyncMode | 'disabled'
  skipped?: boolean
  localDayCount?: number
  stats?: unknown
}

interface ImportPlannerOptions {
  mode?: AutoSyncMode
}

type ImportPlannerResult =
  | {
      ok: true
      importedDays: number
      skippedDays: number
      importedCategories: number
      importedTemplates: number
    }
  | {
      ok: false
      error: string
    }

type PersistenceListener = (status: PlannerPersistenceStatus) => void

interface PlannerRuntimeWindow extends Window {
  __MUSK_PLANNER_AUTO_SYNC_INTERVAL_MS__?: number
}

const DEFAULT_AUTO_SYNC_INTERVAL_MS = Number(import.meta.env.VITE_STORAGE_AUTO_SYNC_INTERVAL_MS || 20000)
const MIN_AUTO_SYNC_INTERVAL_MS = 5000
const META_KEY = PLANNER_META_KEY
const DAY_KEY_PREFIX = PLANNER_DAY_KEY_PREFIX
const DATE_STR_PATTERN = PLANNER_DATE_STR_PATTERN
const LAST_ACTIVE_DATE_KEY = PLANNER_LAST_ACTIVE_DATE_KEY
const LAST_FOCUS_KEY = PLANNER_LAST_FOCUS_KEY
const LAST_VIEW_MODE_KEY = PLANNER_LAST_VIEW_MODE_KEY
const AUTO_SYNC_INTERVAL_KEY = PLANNER_AUTO_SYNC_INTERVAL_KEY
const VALID_VIEW_MODES = new Set<PlannerViewMode>([
  'WORKSPACE',
  'CANVAS',
  'DAY',
  'WEEK',
  'MONTH',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isViewMode = (value: unknown): value is PlannerViewMode =>
  value === 'WORKSPACE' ||
  value === 'CANVAS' ||
  value === 'DAY' ||
  value === 'WEEK' ||
  value === 'MONTH'

const normalizeViewMode = (value: unknown): PlannerViewMode | null => {
  if (value === 'COMPOSER') {
    return 'DAY'
  }

  return isViewMode(value) ? value : null
}

const isLastFocusSnapshot = (value: unknown): value is LastFocusSnapshot =>
  isRecord(value) &&
  DATE_STR_PATTERN.test(String(value.date)) &&
  Number.isInteger(value.slot)

const normalizeMaybeDate = (value: unknown): string | null =>
  DATE_STR_PATTERN.test(String(value)) ? String(value) : null

let autoSyncStarted = false
let autoSyncTimerId: number | null = null
let autoSyncDirty = false
let autoSyncMode: AutoSyncMode = 'merge'
let autoSyncInFlight: Promise<SyncPlannerResult> | null = null
let autoSyncLastSuccessAt: number | null = null
let autoSyncLastAttemptAt: number | null = null
let autoSyncLastStatus: AutoSyncStatus = 'idle'
let autoSyncListenersCleanup: (() => void) | null = null
let plannerChangeVersion = 0
const persistenceListeners = new Set<PersistenceListener>()
let stopServerAvailabilitySubscription: (() => void) | null = null

const clearPlannerDataLocal = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  Object.keys(window.localStorage).forEach((key) => {
    if (
      isPersistedDayKey(key) ||
      key === META_KEY ||
      key === LAST_ACTIVE_DATE_KEY ||
      key === LAST_FOCUS_KEY ||
      key === LAST_VIEW_MODE_KEY
    ) {
      window.localStorage.removeItem(key)
    }
  })
}

const saveDayLocal = (dateStr: string, data: unknown): void => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = toPersistedDayData(dateStr, data)
  window.localStorage.setItem(getPersistedDayKey(dateStr), JSON.stringify(payload))
}

const saveMetaLocal = (
  meta: Partial<PersistedPlannerMeta> | Partial<PlannerMetaModel> | null | undefined,
): void => {
  if (typeof window === 'undefined') {
    return
  }

  const currentMeta = loadMeta()
  const payload = toPersistedMeta({
    categories: Array.isArray(meta?.categories) ? meta.categories : currentMeta.categories,
    templates: Array.isArray(meta?.templates) ? meta.templates : currentMeta.templates,
  })

  window.localStorage.setItem(META_KEY, JSON.stringify(payload))
}

const saveLastActiveDateLocal = (dateStr: string): void => {
  if (typeof window === 'undefined' || !DATE_STR_PATTERN.test(String(dateStr))) {
    return
  }

  window.localStorage.setItem(LAST_ACTIVE_DATE_KEY, dateStr)
}

const saveLastFocusLocal = ({
  date,
  slot,
  ts = Date.now(),
}: LastFocusSnapshot): void => {
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

const saveLastViewModeLocal = (viewMode: PlannerViewMode): void => {
  if (typeof window === 'undefined' || !isViewMode(viewMode)) {
    return
  }

  window.localStorage.setItem(LAST_VIEW_MODE_KEY, String(viewMode))
}

const parseImportPayload = (input: string | unknown): unknown => {
  if (typeof input === 'string') {
    return JSON.parse(input)
  }

  return input
}

const readLocalDaysSnapshot = (dateStr: string | null = null): Record<string, PersistedPlannerDay> => {
  if (typeof window === 'undefined') {
    return {}
  }

  const days: Record<string, PersistedPlannerDay> = {}

  if (dateStr) {
    days[dateStr] = loadDay(dateStr)
    return days
  }

  Object.keys(window.localStorage)
    .filter((key) => isPersistedDayKey(key))
    .forEach((key) => {
      const dayStr = key.replace(DAY_KEY_PREFIX, '')
      days[dayStr] = loadDay(dayStr)
    })

  return days
}

const buildSnapshotPayload = (dateStr: string | null = null): PlannerSnapshot => ({
  schemaVersion: PLANNER_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  days: readLocalDaysSnapshot(dateStr),
  meta: loadMeta(),
  lastActiveDate: loadLastActiveDate(),
  lastFocus: loadLastFocus(),
  lastViewMode: loadLastViewMode(),
})

const hasPlannerLocalData = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    Object.keys(window.localStorage)
      .filter((key) => isPersistedDayKey(key))
      .some((key) => hasMeaningfulPersistedDayData(loadDay(key.replace(DAY_KEY_PREFIX, '')))) ||
    loadMeta().categories.length > 0 ||
    loadMeta().templates.length > 0 ||
    loadLastActiveDate() !== null ||
    loadLastFocus() !== null ||
    loadLastViewMode() !== null
  )
}

const applySnapshotToLocal = (snapshot: unknown): void => {
  if (typeof window === 'undefined' || !isRecord(snapshot)) {
    return
  }

  clearPlannerDataLocal()

  const days = isRecord(snapshot.days) ? snapshot.days : null
  const meta = isRecord(snapshot.meta) ? snapshot.meta : null

  if (days) {
    Object.entries(days).forEach(([dateStr, dayData]) => {
      if (!DATE_STR_PATTERN.test(dateStr)) {
        return
      }

      saveDayLocal(dateStr, dayData)
    })
  }

  if (meta) {
    saveMetaLocal(meta)
  }

  const lastActiveDate = normalizeMaybeDate(snapshot.lastActiveDate)
  if (lastActiveDate) {
    saveLastActiveDateLocal(lastActiveDate)
  }

  if (isLastFocusSnapshot(snapshot.lastFocus)) {
    saveLastFocusLocal(snapshot.lastFocus)
  }

  const normalizedLastViewMode = normalizeViewMode(snapshot.lastViewMode)
  if (normalizedLastViewMode) {
    saveLastViewModeLocal(normalizedLastViewMode)
  }
}

const emitPersistenceStatus = (): void => {
  const status = getPlannerPersistenceStatus()
  persistenceListeners.forEach((listener) => {
    try {
      listener(status)
    } catch {
      // no-op
    }
  })
}

const ensurePersistenceStatusSubscription = (): void => {
  if (stopServerAvailabilitySubscription || typeof window === 'undefined') {
    return
  }

  stopServerAvailabilitySubscription = subscribeServerAvailability(() => {
    emitPersistenceStatus()
  })
}

const getAutoSyncIntervalMs = (): number => {
  if (typeof window === 'undefined') {
    return Math.max(MIN_AUTO_SYNC_INTERVAL_MS, DEFAULT_AUTO_SYNC_INTERVAL_MS)
  }

  const runtimeOverride = Number((window as PlannerRuntimeWindow).__MUSK_PLANNER_AUTO_SYNC_INTERVAL_MS__)
  if (Number.isFinite(runtimeOverride) && runtimeOverride >= MIN_AUTO_SYNC_INTERVAL_MS) {
    return runtimeOverride
  }

  const persistedOverride = Number(window.localStorage.getItem(AUTO_SYNC_INTERVAL_KEY))
  if (Number.isFinite(persistedOverride) && persistedOverride >= MIN_AUTO_SYNC_INTERVAL_MS) {
    return persistedOverride
  }

  return Math.max(MIN_AUTO_SYNC_INTERVAL_MS, DEFAULT_AUTO_SYNC_INTERVAL_MS)
}

const markPlannerDirty = (mode: AutoSyncMode = 'merge'): void => {
  plannerChangeVersion += 1
  autoSyncDirty = true
  autoSyncLastStatus = 'pending'
  if (mode === 'replace') {
    autoSyncMode = 'replace'
  }
  emitPersistenceStatus()
}

const finalizePlannerSync = (syncedVersion: number): void => {
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

export const getKey = (dateStr: string): string => getPersistedDayKey(dateStr)

export const isDayKey = (key: unknown): boolean => isPersistedDayKey(key)

export const loadDay = (dateStr: string): PersistedPlannerDay => {
  if (typeof window === 'undefined') {
    return createEmptyDay(dateStr)
  }

  const raw = window.localStorage.getItem(getPersistedDayKey(dateStr))

  if (!raw) {
    return createEmptyDay(dateStr)
  }

  try {
    return migratePersistedDayData(dateStr, JSON.parse(raw))
  } catch {
    return createEmptyDay(dateStr)
  }
}

export const saveDay = (dateStr: string, data: unknown): void => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = toPersistedDayData(dateStr, data)
  saveDayLocal(dateStr, payload)
  markPlannerDirty('merge')
  void saveDayToServer(dateStr, payload)
}

export const loadMeta = (): PersistedPlannerMeta => {
  if (typeof window === 'undefined') {
    return createEmptyMeta()
  }

  const raw = window.localStorage.getItem(META_KEY)

  if (!raw) {
    return createEmptyMeta()
  }

  try {
    return migratePersistedMeta(JSON.parse(raw))
  } catch {
    return createEmptyMeta()
  }
}

export const saveMeta = (
  meta: Partial<PersistedPlannerMeta> | Partial<PlannerMetaModel> | null | undefined,
): void => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = toPersistedMeta({
    categories: Array.isArray(meta?.categories) ? meta.categories : loadMeta().categories,
    templates: Array.isArray(meta?.templates) ? meta.templates : loadMeta().templates,
  })

  saveMetaLocal(payload)
  markPlannerDirty('merge')
  void saveMetaToServer(payload)
}

export const loadLastActiveDate = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(LAST_ACTIVE_DATE_KEY)
  return DATE_STR_PATTERN.test(String(value)) ? value : null
}

export const loadPlannerDayModel = (dateStr: string): PlannerDayModel =>
  toPlannerDayModel(loadDay(dateStr))

export const savePlannerDayModel = (dateStr: string, plannerDay: PlannerDayModel): void => {
  saveDay(dateStr, fromPlannerDayModel(plannerDay))
}

export const loadPlannerMetaModel = (): PlannerMetaModel => toPlannerMetaModel(loadMeta())

export const savePlannerMetaModel = (plannerMeta: PlannerMetaModel): void => {
  saveMeta(fromPlannerMetaModel(plannerMeta))
}

export const saveLastActiveDate = (dateStr: string): void => {
  if (typeof window === 'undefined' || !DATE_STR_PATTERN.test(String(dateStr))) {
    return
  }

  saveLastActiveDateLocal(dateStr)
  markPlannerDirty('merge')
  void saveLastActiveDateToServer(dateStr)
}

export const getMostRecentStoredDate = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const dates = Object.keys(window.localStorage)
    .filter((key) => isPersistedDayKey(key))
    .map((key) => key.replace(DAY_KEY_PREFIX, ''))
    .filter((dateStr) => DATE_STR_PATTERN.test(dateStr))
    .sort()

  return dates.length > 0 ? dates[dates.length - 1] : null
}

export const loadLastFocus = (): LastFocusSnapshot | null => {
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

export const saveLastFocus = ({
  date,
  slot,
}: Pick<LastFocusSnapshot, 'date' | 'slot'>): void => {
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

export const loadLastViewMode = (): PlannerViewMode | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.localStorage.getItem(LAST_VIEW_MODE_KEY)
  return normalizeViewMode(value)
}

export const saveLastViewMode = (viewMode: PlannerViewMode): void => {
  if (typeof window === 'undefined' || !isViewMode(viewMode)) {
    return
  }

  saveLastViewModeLocal(viewMode)
  markPlannerDirty('merge')
}

export const exportPlannerData = (dateStr: string | null = null): PlannerSnapshot => {
  if (typeof window === 'undefined') {
    return {
      schemaVersion: PLANNER_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      days: {},
      meta: createEmptyMeta(),
      lastActiveDate: null,
      lastFocus: null,
      lastViewMode: null,
    }
  }

  return buildSnapshotPayload(dateStr)
}

export const clearPlannerData = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  clearPlannerDataLocal()
  markPlannerDirty('replace')
  void syncPlannerDataToServer({ mode: 'replace', force: true })
}

export const importPlannerData = (
  input: string | unknown,
  options: ImportPlannerOptions = {},
): ImportPlannerResult => {
  if (typeof window === 'undefined') {
    return { ok: false, error: '브라우저 환경에서만 가져올 수 있습니다' }
  }

  const mode = options.mode === 'replace' ? 'replace' : 'merge'
  let payload: unknown

  try {
    payload = parseImportPayload(input)
  } catch {
    return { ok: false, error: '유효한 JSON 형식이 아닙니다' }
  }

  if (!isRecord(payload)) {
    return { ok: false, error: '가져오기 데이터 형식이 올바르지 않습니다' }
  }

  const days = isRecord(payload.days) ? payload.days : null
  const meta = isRecord(payload.meta) ? payload.meta : null
  const lastActiveDate = normalizeMaybeDate(payload.lastActiveDate)
  const lastFocus = isLastFocusSnapshot(payload.lastFocus) ? payload.lastFocus : null
  const lastViewMode = normalizeViewMode(payload.lastViewMode)

  if (!days && !meta && !lastActiveDate && !lastFocus && !lastViewMode) {
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

      saveDayLocal(dateStr, toPersistedDayData(dateStr, dayData))
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

  if (lastViewMode) {
    saveLastViewModeLocal(lastViewMode)
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

export const syncPlannerDataToServer = async (
  options: SyncPlannerOptions = {},
): Promise<SyncPlannerResult> => {
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
    .then((result: { ok?: unknown; stats?: unknown } | null | undefined): SyncPlannerResult => {
      if (result?.ok) {
        finalizePlannerSync(syncVersion)
      } else {
        autoSyncLastStatus = 'error'
        emitPersistenceStatus()
      }

      return {
        ok: Boolean(result?.ok),
        mode: requestedMode,
        stats: result?.stats ?? null,
        localDayCount: Object.keys(payload.days).length,
      }
    })
    .finally(() => {
      autoSyncInFlight = null
    })

  return autoSyncInFlight
}

export const startPlannerAutoSync = (): (() => void) => {
  if (typeof window === 'undefined' || autoSyncStarted || !isServerPersistenceEnabled()) {
    return () => {}
  }

  autoSyncStarted = true
  ensurePersistenceStatusSubscription()
  emitPersistenceStatus()

  const flushIfDirty = (options: SyncPlannerOptions = {}): void => {
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

export const getPlannerPersistenceStatus = (): PlannerPersistenceStatus => ({
  serverEnabled: isServerPersistenceEnabled(),
  serverAvailability: getServerAvailability() as ServerAvailability,
  hasLocalData: hasPlannerLocalData(),
  autoSyncIntervalMs: getAutoSyncIntervalMs(),
  autoSyncDirty,
  autoSyncLastSuccessAt,
  autoSyncLastAttemptAt,
  autoSyncLastStatus,
})

export const subscribePlannerPersistenceStatus = (listener: unknown): (() => void) => {
  if (typeof listener !== 'function') {
    return () => {}
  }

  ensurePersistenceStatusSubscription()
  const typedListener = listener as PersistenceListener
  persistenceListeners.add(typedListener)
  typedListener(getPlannerPersistenceStatus())

  return () => {
    persistenceListeners.delete(typedListener)
  }
}
