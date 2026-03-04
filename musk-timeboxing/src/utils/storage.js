const createEmptyDay = (dateStr) => ({
  date: dateStr,
  brainDump: [],
  bigThree: [],
  timeBoxes: [],
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
