import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

const HOST = process.env.PLANNER_SERVER_HOST || '0.0.0.0'
const PORT = Number(process.env.PLANNER_SERVER_PORT || 8787)
const DATA_DIR = path.resolve(process.env.PLANNER_DATA_DIR || path.join(process.cwd(), '.planner-data'))
const DATA_FILE = path.resolve(process.env.PLANNER_DATA_FILE || path.join(DATA_DIR, 'planner-store.json'))
const SCHEMA_VERSION = 2
const DATE_STR_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const createEmptyState = () => ({
  schemaVersion: SCHEMA_VERSION,
  updatedAt: new Date().toISOString(),
  days: {},
  meta: {
    schemaVersion: SCHEMA_VERSION,
    categories: [],
  },
  lastActiveDate: null,
  lastFocus: null,
})

const normalizeLastFocus = (input) => {
  if (!input || typeof input !== 'object') {
    return null
  }

  if (!DATE_STR_PATTERN.test(String(input.date)) || !Number.isInteger(input.slot)) {
    return null
  }

  return {
    date: input.date,
    slot: input.slot,
    ts: Number.isFinite(input.ts) ? Number(input.ts) : Date.now(),
  }
}

const normalizeState = (input) => {
  const safeInput = input && typeof input === 'object' ? input : {}
  const days = safeInput.days && typeof safeInput.days === 'object' ? safeInput.days : {}
  const meta = safeInput.meta && typeof safeInput.meta === 'object' ? safeInput.meta : {}

  return {
    schemaVersion: SCHEMA_VERSION,
    updatedAt:
      typeof safeInput.updatedAt === 'string' && safeInput.updatedAt.trim().length > 0
        ? safeInput.updatedAt
        : new Date().toISOString(),
    days,
    meta: {
      schemaVersion: SCHEMA_VERSION,
      categories: Array.isArray(meta.categories) ? meta.categories : [],
    },
    lastActiveDate: DATE_STR_PATTERN.test(String(safeInput.lastActiveDate)) ? safeInput.lastActiveDate : null,
    lastFocus: normalizeLastFocus(safeInput.lastFocus),
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

const getMeaningfulDayCount = (state) =>
  Object.values(state.days).filter((dayData) => hasMeaningfulDayData(dayData)).length

const hasAnyData = (state) => {
  return (
    getMeaningfulDayCount(state) > 0 ||
    state.meta.categories.length > 0 ||
    DATE_STR_PATTERN.test(String(state.lastActiveDate)) ||
    normalizeLastFocus(state.lastFocus) !== null
  )
}

const summarizeState = (state) => ({
  dayCount: getMeaningfulDayCount(state),
  storedDayCount: Object.keys(state.days).length,
  categoryCount: state.meta.categories.length,
  hasData: hasAnyData(state),
})

const ensureStoreFile = async () => {
  await mkdir(path.dirname(DATA_FILE), { recursive: true })

  if (!existsSync(DATA_FILE)) {
    await writeFile(DATA_FILE, JSON.stringify(createEmptyState(), null, 2), 'utf8')
  }
}

const readState = async () => {
  await ensureStoreFile()

  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    return normalizeState(JSON.parse(raw))
  } catch {
    const emptyState = createEmptyState()
    await writeFile(DATA_FILE, JSON.stringify(emptyState, null, 2), 'utf8')
    return emptyState
  }
}

let writeQueue = Promise.resolve()

const persistState = async (state) => {
  const normalized = normalizeState(state)
  normalized.updatedAt = new Date().toISOString()
  await writeFile(DATA_FILE, JSON.stringify(normalized, null, 2), 'utf8')
  return normalized
}

const updateState = async (updater) => {
  writeQueue = writeQueue.then(async () => {
    const current = await readState()
    const next = await updater(current)
    return persistState(next)
  })

  return writeQueue
}

const readJsonBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return null
  }

  const text = Buffer.concat(chunks).toString('utf8').trim()
  if (!text) {
    return null
  }

  return JSON.parse(text)
}

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

const sendNotFound = (response) => {
  sendJson(response, 404, {
    ok: false,
    error: 'Not found',
  })
}

const mergeImportPayload = (currentState, payload, mode) => {
  const safePayload = payload && typeof payload === 'object' ? payload : {}
  const nextState = mode === 'replace' ? createEmptyState() : normalizeState(currentState)
  const nextDays = safePayload.days && typeof safePayload.days === 'object' ? safePayload.days : {}

  nextState.days = mode === 'replace' ? nextDays : { ...nextState.days, ...nextDays }

  if (safePayload.meta && typeof safePayload.meta === 'object') {
    nextState.meta = {
      schemaVersion: SCHEMA_VERSION,
      categories: Array.isArray(safePayload.meta.categories)
        ? safePayload.meta.categories
        : nextState.meta.categories,
    }
  }

  if (DATE_STR_PATTERN.test(String(safePayload.lastActiveDate))) {
    nextState.lastActiveDate = safePayload.lastActiveDate
  } else if (mode === 'replace') {
    nextState.lastActiveDate = null
  }

  const normalizedFocus = normalizeLastFocus(safePayload.lastFocus)
  if (normalizedFocus) {
    nextState.lastFocus = normalizedFocus
  } else if (mode === 'replace') {
    nextState.lastFocus = null
  }

  return nextState
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  const { method = 'GET' } = request
  const pathname = url.pathname

  try {
    if (method === 'GET' && pathname === '/health') {
      const state = await readState()
      sendJson(response, 200, {
        ok: true,
        status: 'healthy',
        storeFile: DATA_FILE,
        stats: summarizeState(state),
      })
      return
    }

    if (method === 'GET' && pathname === '/api/planner/bootstrap') {
      const state = await readState()
      sendJson(response, 200, {
        ok: true,
        data: state,
        stats: summarizeState(state),
      })
      return
    }

    if (method === 'GET' && pathname === '/api/planner/export') {
      const state = await readState()
      sendJson(response, 200, {
        ok: true,
        data: {
          schemaVersion: SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          days: state.days,
          meta: state.meta,
          lastActiveDate: state.lastActiveDate,
          lastFocus: state.lastFocus,
        },
      })
      return
    }

    if (method === 'PUT' && pathname.startsWith('/api/planner/day/')) {
      const dateStr = decodeURIComponent(pathname.replace('/api/planner/day/', ''))
      if (!DATE_STR_PATTERN.test(dateStr)) {
        sendJson(response, 400, {
          ok: false,
          error: '유효한 날짜 형식이 아닙니다',
        })
        return
      }

      const body = await readJsonBody(request)
      const nextState = await updateState((currentState) => ({
        ...currentState,
        days: {
          ...currentState.days,
          [dateStr]: body?.day ?? body ?? null,
        },
      }))

      sendJson(response, 200, {
        ok: true,
        stats: summarizeState(nextState),
      })
      return
    }

    if (method === 'PUT' && pathname === '/api/planner/meta') {
      const body = await readJsonBody(request)
      const nextState = await updateState((currentState) => ({
        ...currentState,
        meta: {
          schemaVersion: SCHEMA_VERSION,
          categories: Array.isArray(body?.meta?.categories)
            ? body.meta.categories
            : Array.isArray(body?.categories)
              ? body.categories
              : currentState.meta.categories,
        },
      }))

      sendJson(response, 200, {
        ok: true,
        stats: summarizeState(nextState),
      })
      return
    }

    if (method === 'PUT' && pathname === '/api/planner/last-active-date') {
      const body = await readJsonBody(request)
      const dateStr = DATE_STR_PATTERN.test(String(body?.dateStr)) ? body.dateStr : null
      const nextState = await updateState((currentState) => ({
        ...currentState,
        lastActiveDate: dateStr,
      }))

      sendJson(response, 200, {
        ok: true,
        stats: summarizeState(nextState),
      })
      return
    }

    if (method === 'PUT' && pathname === '/api/planner/last-focus') {
      const body = await readJsonBody(request)
      const nextState = await updateState((currentState) => ({
        ...currentState,
        lastFocus: normalizeLastFocus(body?.focus ?? body),
      }))

      sendJson(response, 200, {
        ok: true,
        stats: summarizeState(nextState),
      })
      return
    }

    if (method === 'DELETE' && pathname === '/api/planner/data') {
      const nextState = await updateState(() => createEmptyState())
      sendJson(response, 200, {
        ok: true,
        stats: summarizeState(nextState),
      })
      return
    }

    if (method === 'POST' && pathname === '/api/planner/import') {
      const body = await readJsonBody(request)
      const mode = body?.mode === 'replace' ? 'replace' : 'merge'
      const payload = body?.payload ?? {}
      const nextState = await updateState((currentState) => mergeImportPayload(currentState, payload, mode))
      sendJson(response, 200, {
        ok: true,
        mode,
        stats: summarizeState(nextState),
      })
      return
    }

    sendNotFound(response)
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: error instanceof Error ? error.message : '알 수 없는 서버 오류가 발생했습니다',
    })
  }
})

server.listen(PORT, HOST, async () => {
  await ensureStoreFile()
  console.log(`[planner-api] listening on http://${HOST}:${PORT}`)
  console.log(`[planner-api] data file: ${DATA_FILE}`)
})
