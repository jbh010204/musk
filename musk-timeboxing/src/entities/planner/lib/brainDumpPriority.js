export const MIN_BRAIN_DUMP_PRIORITY = 0
export const MAX_BRAIN_DUMP_PRIORITY = 4

export const BRAIN_DUMP_PRIORITY_LABELS = {
  0: '미지정',
  1: '낮음',
  2: '보통',
  3: '높음',
  4: '최우선',
}

export const normalizeBrainDumpPriority = (value) => {
  const next = Number(value)

  if (!Number.isInteger(next)) {
    return MIN_BRAIN_DUMP_PRIORITY
  }

  return Math.max(MIN_BRAIN_DUMP_PRIORITY, Math.min(MAX_BRAIN_DUMP_PRIORITY, next))
}

export const cycleBrainDumpPriority = (value) => {
  const normalized = normalizeBrainDumpPriority(value)
  return normalized >= MAX_BRAIN_DUMP_PRIORITY ? MIN_BRAIN_DUMP_PRIORITY : normalized + 1
}

export const sortBrainDumpItems = (items = []) =>
  [...items]
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const byPriority =
        normalizeBrainDumpPriority(right.item?.priority) -
        normalizeBrainDumpPriority(left.item?.priority)

      if (byPriority !== 0) {
        return byPriority
      }

      return left.index - right.index
    })
    .map(({ item }) => item)
