import { getTaskCardStackCanvasStatus } from '../../../entities/planner'
import type { TaskCard, TimeBox } from '../../../entities/planner/model/types'

export type InboxFilterValue = 'ALL' | 'TODO' | 'SCHEDULED' | 'COMPLETED'

export const INBOX_FILTER_OPTIONS: Array<{ value: InboxFilterValue; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'TODO', label: '미배치' },
  { value: 'SCHEDULED', label: '예정됨' },
  { value: 'COMPLETED', label: '완료됨' },
]

const matchesQuery = (item: TaskCard, query: string) => {
  if (!query) {
    return true
  }

  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return `${item.title} ${item.note || ''}`.toLowerCase().includes(normalized)
}

export const filterInboxItems = (
  items: TaskCard[] = [],
  {
    query = '',
    filter = 'ALL',
    timeBoxes = [],
  }: {
    query?: string
    filter?: InboxFilterValue
    timeBoxes?: TimeBox[]
  } = {},
): TaskCard[] =>
  items.filter((item) => {
    if (!matchesQuery(item, query)) {
      return false
    }

    if (filter === 'ALL') {
      return true
    }

    return getTaskCardStackCanvasStatus(item, timeBoxes) === filter
  })
