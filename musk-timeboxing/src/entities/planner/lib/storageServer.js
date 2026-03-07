const STORAGE_API_BASE = import.meta.env.VITE_STORAGE_API_BASE || '/api/planner'
const SERVER_STORAGE_ENABLED = import.meta.env.VITE_SERVER_STORAGE === 'true'
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_STORAGE_REQUEST_TIMEOUT_MS || 2500)

let serverAvailability = SERVER_STORAGE_ENABLED ? 'unknown' : 'disabled'
let writeQueue = Promise.resolve()
let bootstrapPromise = null

const requestJson = async (path, options = {}, requestOptions = {}) => {
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
    const response = await window.fetch(`${STORAGE_API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller?.signal,
    })

    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`)
    }

    serverAvailability = 'online'
    return await response.json()
  } catch {
    if (!force) {
      serverAvailability = 'offline'
    }

    return null
  } finally {
    if (timeoutId != null) {
      window.clearTimeout(timeoutId)
    }
  }
}

const enqueueWrite = (path, payload, method = 'PUT', options = {}) => {
  if (!SERVER_STORAGE_ENABLED) {
    return Promise.resolve(null)
  }

  const force = options.force === true
  if (!force && serverAvailability !== 'online') {
    return Promise.resolve(null)
  }

  writeQueue = writeQueue
    .then(() =>
      requestJson(
        path,
        {
          method,
          body: payload == null ? undefined : JSON.stringify(payload),
        },
        { force },
      ),
    )
    .catch(() => null)

  return writeQueue
}

export const isServerPersistenceEnabled = () => SERVER_STORAGE_ENABLED

export const getServerAvailability = () => serverAvailability

export const bootstrapServerStorage = (callbacks = {}) => {
  if (!SERVER_STORAGE_ENABLED || typeof window === 'undefined') {
    return Promise.resolve({ mode: 'disabled', hydrated: false, serverAvailable: false })
  }

  if (bootstrapPromise) {
    return bootstrapPromise
  }

  const hasLocalData = typeof callbacks.hasLocalData === 'function' ? callbacks.hasLocalData : () => false
  const readLocalSnapshot =
    typeof callbacks.readLocalSnapshot === 'function' ? callbacks.readLocalSnapshot : () => ({})
  const applyServerSnapshot =
    typeof callbacks.applyServerSnapshot === 'function' ? callbacks.applyServerSnapshot : () => {}

  bootstrapPromise = (async () => {
    const response = await requestJson('/bootstrap', { method: 'GET' })

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
      const payload = readLocalSnapshot()
      const migrated = await requestJson(
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

export const syncSnapshotToServer = (payload, options = {}) => {
  if (!SERVER_STORAGE_ENABLED || typeof window === 'undefined') {
    return Promise.resolve({ ok: false, mode: 'disabled' })
  }

  const mode = options.mode === 'replace' ? 'replace' : 'merge'

  return enqueueWrite(
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

export const saveDayToServer = (dateStr, day) => enqueueWrite(`/day/${encodeURIComponent(dateStr)}`, { day })

export const saveMetaToServer = (meta) => enqueueWrite('/meta', { meta })

export const saveLastActiveDateToServer = (dateStr) =>
  enqueueWrite('/last-active-date', { dateStr: dateStr ?? null })

export const saveLastFocusToServer = (focus) => enqueueWrite('/last-focus', { focus: focus ?? null })

export const clearPlannerDataOnServer = () => enqueueWrite('/data', null, 'DELETE')
