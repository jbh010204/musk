const STORAGE_API_BASE = import.meta.env.VITE_STORAGE_API_BASE || '/api/planner'
const SERVER_STORAGE_ENABLED = import.meta.env.VITE_SERVER_STORAGE === 'true'
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_STORAGE_REQUEST_TIMEOUT_MS || 2500)

type ServerAvailability = 'unknown' | 'disabled' | 'online' | 'offline'
type SyncMode = 'merge' | 'replace'

interface RequestOptions {
  force?: boolean
}

interface BootstrapCallbacks {
  hasLocalData?: () => boolean
  readLocalSnapshot?: () => unknown
  applyServerSnapshot?: (snapshot: unknown) => void
}

interface BootstrapResponse {
  ok?: boolean
  data?: unknown
  stats?: {
    hasData?: boolean
    dayCount?: number
  }
}

type BootstrapResult =
  | { mode: 'disabled'; hydrated: false; serverAvailable: false }
  | { mode: 'local-only'; hydrated: false; serverAvailable: false }
  | { mode: 'server-migrated-local'; hydrated: true; serverAvailable: true; migratedDays: number }
  | { mode: 'server-hydrated'; hydrated: true; serverAvailable: true; dayCount: number }
  | { mode: 'server-empty'; hydrated: false; serverAvailable: true }

type AvailabilityListener = (availability: ServerAvailability) => void

let serverAvailability: ServerAvailability = SERVER_STORAGE_ENABLED ? 'unknown' : 'disabled'
let writeQueue: Promise<unknown | null> = Promise.resolve()
let bootstrapPromise: Promise<BootstrapResult> | null = null
const availabilityListeners = new Set<AvailabilityListener>()

const setServerAvailability = (nextAvailability: ServerAvailability): void => {
  if (serverAvailability === nextAvailability) {
    return
  }

  serverAvailability = nextAvailability
  availabilityListeners.forEach((listener) => {
    try {
      listener(serverAvailability)
    } catch {
      // no-op
    }
  })
}

const requestJson = async <T = unknown>(
  path: string,
  options: RequestInit = {},
  requestOptions: RequestOptions = {},
): Promise<T | null> => {
  if (!SERVER_STORAGE_ENABLED) {
    return null
  }

  const force = requestOptions.force === true
  if (!force && serverAvailability === 'offline') {
    return null
  }

  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timeoutId =
    controller != null
      ? window.setTimeout(() => {
          controller.abort()
        }, REQUEST_TIMEOUT_MS)
      : null

  try {
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')

    const response = await window.fetch(`${STORAGE_API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller?.signal,
    })

    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`)
    }

    setServerAvailability('online')
    return (await response.json()) as T
  } catch {
    if (!force) {
      setServerAvailability('offline')
    }

    return null
  } finally {
    if (timeoutId != null) {
      window.clearTimeout(timeoutId)
    }
  }
}

const enqueueWrite = <T = unknown>(
  path: string,
  payload: unknown,
  method = 'PUT',
  options: RequestOptions = {},
): Promise<T | null> => {
  if (!SERVER_STORAGE_ENABLED) {
    return Promise.resolve(null)
  }

  const force = options.force === true
  if (!force && serverAvailability !== 'online') {
    return Promise.resolve(null)
  }

  writeQueue = writeQueue
    .then(() =>
      requestJson<T>(
        path,
        {
          method,
          body: payload == null ? undefined : JSON.stringify(payload),
        },
        { force },
      ),
    )
    .catch(() => null)

  return writeQueue as Promise<T | null>
}

export const isServerPersistenceEnabled = (): boolean => SERVER_STORAGE_ENABLED

export const getServerAvailability = (): ServerAvailability => serverAvailability

export const subscribeServerAvailability = (
  listener: AvailabilityListener | null | undefined,
): (() => void) => {
  if (typeof listener !== 'function') {
    return () => {}
  }

  availabilityListeners.add(listener)
  return () => {
    availabilityListeners.delete(listener)
  }
}

export const bootstrapServerStorage = (
  callbacks: BootstrapCallbacks = {},
): Promise<BootstrapResult> => {
  if (!SERVER_STORAGE_ENABLED || typeof window === 'undefined') {
    return Promise.resolve({ mode: 'disabled', hydrated: false, serverAvailable: false })
  }

  if (bootstrapPromise) {
    return bootstrapPromise
  }

  const hasLocalData =
    typeof callbacks.hasLocalData === 'function' ? callbacks.hasLocalData : () => false
  const readLocalSnapshot =
    typeof callbacks.readLocalSnapshot === 'function' ? callbacks.readLocalSnapshot : () => ({})
  const applyServerSnapshot =
    typeof callbacks.applyServerSnapshot === 'function'
      ? callbacks.applyServerSnapshot
      : () => {}

  bootstrapPromise = (async () => {
    const response = await requestJson<BootstrapResponse>('/bootstrap', { method: 'GET' })

    if (!response?.ok || !response?.data) {
      return {
        mode: 'local-only',
        hydrated: false,
        serverAvailable: false,
      }
    }

    const stats = response.stats || {}
    const serverHasData = Boolean(stats.hasData)

    if (!serverHasData && hasLocalData()) {
      const payload = readLocalSnapshot() as { days?: Record<string, unknown> } | null
      const migrated = await requestJson<{ ok?: boolean }>(
        '/import',
        {
          method: 'POST',
          body: JSON.stringify({
            mode: 'replace',
            payload,
          }),
        },
        { force: true },
      )

      if (migrated?.ok) {
        return {
          mode: 'server-migrated-local',
          hydrated: true,
          serverAvailable: true,
          migratedDays: Object.keys(payload?.days || {}).length,
        }
      }
    }

    if (serverHasData) {
      applyServerSnapshot(response.data)
      return {
        mode: 'server-hydrated',
        hydrated: true,
        serverAvailable: true,
        dayCount: Number(stats.dayCount) || 0,
      }
    }

    return {
      mode: 'server-empty',
      hydrated: false,
      serverAvailable: true,
    }
  })()

  return bootstrapPromise
}

export const syncSnapshotToServer = (
  payload: unknown,
  options: { mode?: SyncMode } = {},
): Promise<{ ok: boolean; mode: SyncMode | 'disabled'; stats: unknown | null }> => {
  if (!SERVER_STORAGE_ENABLED || typeof window === 'undefined') {
    return Promise.resolve({ ok: false, mode: 'disabled', stats: null })
  }

  const mode: SyncMode = options.mode === 'replace' ? 'replace' : 'merge'

  return enqueueWrite<{ ok?: boolean; stats?: unknown }>(
    '/import',
    {
      mode,
      payload,
    },
    'POST',
    { force: true },
  ).then((response) => ({
    ok: Boolean(response?.ok),
    mode,
    stats: response?.stats || null,
  }))
}

export const saveDayToServer = (dateStr: string, day: unknown): Promise<unknown | null> =>
  enqueueWrite(`/day/${encodeURIComponent(dateStr)}`, { day })

export const saveMetaToServer = (meta: unknown): Promise<unknown | null> =>
  enqueueWrite('/meta', { meta })

export const saveLastActiveDateToServer = (dateStr: string | null | undefined): Promise<unknown | null> =>
  enqueueWrite('/last-active-date', { dateStr: dateStr ?? null })

export const saveLastFocusToServer = (focus: unknown): Promise<unknown | null> =>
  enqueueWrite('/last-focus', { focus: focus ?? null })

export const clearPlannerDataOnServer = (): Promise<unknown | null> =>
  enqueueWrite('/data', null, 'DELETE')
