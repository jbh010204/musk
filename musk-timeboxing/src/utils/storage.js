const createEmptyDay = (dateStr) => ({
  date: dateStr,
  brainDump: [],
  bigThree: [],
  timeBoxes: [],
})
const META_KEY = 'musk-planner-meta'
const DAY_KEY_PREFIX = 'musk-planner-'
const DAY_KEY_PATTERN = /^musk-planner-\d{4}-\d{2}-\d{2}$/
const DATE_STR_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const createEmptyMeta = () => ({
  categories: [],
})

const toPlainDayData = (dateStr, data) => ({
  date: dateStr,
  brainDump: Array.isArray(data?.brainDump) ? data.brainDump : [],
  bigThree: Array.isArray(data?.bigThree) ? data.bigThree : [],
  timeBoxes: Array.isArray(data?.timeBoxes) ? data.timeBoxes : [],
})

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
    const parsed = JSON.parse(raw)

    return toPlainDayData(dateStr, parsed)
  } catch {
    return createEmptyDay(dateStr)
  }
}

export const saveDay = (dateStr, data) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = toPlainDayData(dateStr, data)

  window.localStorage.setItem(getKey(dateStr), JSON.stringify(payload))
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
    categories: Array.isArray(meta?.categories) ? meta.categories : [],
  }

  window.localStorage.setItem(META_KEY, JSON.stringify(payload))
}

const parseImportPayload = (input) => {
  if (typeof input === 'string') {
    return JSON.parse(input)
  }

  return input
}

export const exportPlannerData = (dateStr = null) => {
  if (typeof window === 'undefined') {
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      days: {},
      meta: createEmptyMeta(),
    }
  }

  const days = {}

  if (dateStr) {
    days[dateStr] = loadDay(dateStr)
  } else {
    Object.keys(window.localStorage)
      .filter((key) => isDayKey(key))
      .forEach((key) => {
        const dayStr = key.replace(DAY_KEY_PREFIX, '')
        days[dayStr] = loadDay(dayStr)
      })
  }

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    days,
    meta: loadMeta(),
  }
}

export const clearPlannerData = () => {
  if (typeof window === 'undefined') {
    return
  }

  Object.keys(window.localStorage).forEach((key) => {
    if (isDayKey(key) || key === META_KEY) {
      window.localStorage.removeItem(key)
    }
  })
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

  if (!days && !meta) {
    return { ok: false, error: 'days 또는 meta 데이터가 필요합니다' }
  }

  if (mode === 'replace') {
    clearPlannerData()
  }

  let importedDays = 0
  let skippedDays = 0

  if (days) {
    Object.entries(days).forEach(([dateStr, dayData]) => {
      if (!DATE_STR_PATTERN.test(dateStr)) {
        skippedDays += 1
        return
      }

      saveDay(dateStr, toPlainDayData(dateStr, dayData))
      importedDays += 1
    })
  }

  let importedCategories = 0
  if (meta && Array.isArray(meta.categories)) {
    saveMeta({
      categories: meta.categories,
    })
    importedCategories = meta.categories.length
  }

  return {
    ok: true,
    importedDays,
    skippedDays,
    importedCategories,
  }
}
