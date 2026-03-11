import { normalizeBrainDumpPriority, sortBrainDumpItems } from './brainDumpPriority'
import { TOTAL_SLOTS } from './timeSlot'

export const UNCATEGORIZED_BOARD_LANE = 'uncategorized'
export const DEFAULT_BOARD_CARD_ESTIMATED_SLOTS = 1

export const normalizeBoardCategoryId = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeBoardEstimatedSlots = (value) => {
  const next = Number(value)

  if (!Number.isInteger(next)) {
    return DEFAULT_BOARD_CARD_ESTIMATED_SLOTS
  }

  return Math.max(1, Math.min(TOTAL_SLOTS, next))
}

export const normalizeBoardNote = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export const normalizeBoardCreatedFrom = (value) =>
  value === 'board' ? 'board' : 'list'

export const normalizeBoardLinkedTimeBoxIds = (value) =>
  Array.isArray(value)
    ? value.filter((id) => typeof id === 'string' && id.trim().length > 0)
    : []

export const normalizeBoardStackOrder = (value, fallback = 0) => {
  const next = Number(value)
  return Number.isInteger(next) ? next : fallback
}

export const normalizeBoardCard = (item, fallbackIndex = 0) => {
  const content = typeof item?.content === 'string' ? item.content.trim() : ''
  if (!content) {
    return null
  }

  return {
    id: typeof item?.id === 'string' ? item.id : crypto.randomUUID(),
    content,
    isDone: Boolean(item?.isDone),
    priority: normalizeBrainDumpPriority(item?.priority),
    categoryId: normalizeBoardCategoryId(item?.categoryId),
    stackOrder: normalizeBoardStackOrder(item?.stackOrder, fallbackIndex),
    estimatedSlots: normalizeBoardEstimatedSlots(item?.estimatedSlots),
    linkedTimeBoxIds: normalizeBoardLinkedTimeBoxIds(item?.linkedTimeBoxIds),
    note: normalizeBoardNote(item?.note),
    createdFrom: normalizeBoardCreatedFrom(item?.createdFrom),
  }
}

const areLinkedIdsEqual = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index])

export const syncBoardCardsWithTimeBoxes = (brainDump = [], timeBoxes = []) => {
  const linkedMap = new Map()

  ;[...timeBoxes]
    .sort((left, right) => left.startSlot - right.startSlot)
    .forEach((box) => {
      if (typeof box?.sourceId !== 'string' || box.sourceId.trim().length === 0) {
        return
      }

      const next = linkedMap.get(box.sourceId) || []
      next.push(box.id)
      linkedMap.set(box.sourceId, next)
    })

  return brainDump.map((item) => {
    const linkedTimeBoxIds = linkedMap.get(item.id) || []
    if (areLinkedIdsEqual(item.linkedTimeBoxIds || [], linkedTimeBoxIds)) {
      return item
    }

    return {
      ...item,
      linkedTimeBoxIds,
    }
  })
}

export const sortBoardCardsByStackOrder = (items = []) =>
  [...items]
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const byStack = normalizeBoardStackOrder(left.item?.stackOrder, left.index) -
        normalizeBoardStackOrder(right.item?.stackOrder, right.index)

      if (byStack !== 0) {
        return byStack
      }

      return left.index - right.index
    })
    .map(({ item }) => item)

export const groupBoardCardsByCategory = (items = [], categories = []) => {
  const grouped = new Map()
  const visibleCategories = categories.filter((category) => category?.isLeaf !== false)

  grouped.set(UNCATEGORIZED_BOARD_LANE, {
    id: UNCATEGORIZED_BOARD_LANE,
    categoryId: null,
    label: '미분류',
    color: '#94a3b8',
    items: [],
  })

  visibleCategories.forEach((category) => {
    grouped.set(category.id, {
      id: category.id,
      categoryId: category.id,
      label: category.pathLabel || category.name,
      color: category.color,
      items: [],
    })
  })

  sortBoardCardsByStackOrder(items).forEach((item) => {
    const laneKey = item.categoryId && grouped.has(item.categoryId) ? item.categoryId : UNCATEGORIZED_BOARD_LANE
    grouped.get(laneKey).items.push(item)
  })

  return [grouped.get(UNCATEGORIZED_BOARD_LANE), ...visibleCategories.map((category) => grouped.get(category.id))]
}

export const buildBoardLayoutEntries = (lanes = []) =>
  lanes.flatMap((lane) =>
    lane.items.map((itemId, index) => ({
      id: itemId,
      categoryId: lane.id === UNCATEGORIZED_BOARD_LANE ? null : lane.id,
      stackOrder: index,
    })),
  )

export const getNextBoardStackOrder = (items = []) =>
  items.reduce((max, item, index) => Math.max(max, normalizeBoardStackOrder(item?.stackOrder, index)), -1) + 1

export const getBrainDumpSidebarItems = (items = []) => sortBrainDumpItems(items)
