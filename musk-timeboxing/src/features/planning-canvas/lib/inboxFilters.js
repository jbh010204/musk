import { getTaskCardStackCanvasStatus } from '../../../entities/planner'

export const INBOX_FILTER_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'TODO', label: '미배치' },
  { value: 'SCHEDULED', label: '예정됨' },
  { value: 'COMPLETED', label: '완료됨' },
]

const matchesQuery = (item, query) => {
  if (!query) {
    return true
  }

  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return `${item.title} ${item.note || ''}`.toLowerCase().includes(normalized)
}

export const filterInboxItems = (items = [], { query = '', filter = 'ALL', timeBoxes = [] } = {}) =>
  items.filter((item) => {
    if (!matchesQuery(item, query)) {
      return false
    }

    if (filter === 'ALL') {
      return true
    }

    return getTaskCardStackCanvasStatus(item, timeBoxes) === filter
  })
