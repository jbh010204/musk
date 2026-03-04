const createEmptyDay = (dateStr) => ({
  date: dateStr,
  brainDump: [],
  bigThree: [],
  timeBoxes: [],
})
const META_KEY = 'musk-planner-meta'
const createEmptyMeta = () => ({
  categories: [],
})

export const getKey = (dateStr) => `musk-planner-${dateStr}`

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

    return {
      date: dateStr,
      brainDump: Array.isArray(parsed.brainDump) ? parsed.brainDump : [],
      bigThree: Array.isArray(parsed.bigThree) ? parsed.bigThree : [],
      timeBoxes: Array.isArray(parsed.timeBoxes) ? parsed.timeBoxes : [],
    }
  } catch {
    return createEmptyDay(dateStr)
  }
}

export const saveDay = (dateStr, data) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload = {
    date: dateStr,
    brainDump: Array.isArray(data?.brainDump) ? data.brainDump : [],
    bigThree: Array.isArray(data?.bigThree) ? data.bigThree : [],
    timeBoxes: Array.isArray(data?.timeBoxes) ? data.timeBoxes : [],
  }

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
