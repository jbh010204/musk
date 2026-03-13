import { normalizeBrainDumpPriority, sortBrainDumpItems } from './brainDumpPriority'
import { TOTAL_SLOTS } from './timeSlot'
import type {
  CategoryViewModel,
  TaskCardOrigin,
  TaskCardPriority,
  TimeBox,
} from '../model/types'

export const UNCATEGORIZED_BOARD_LANE = 'uncategorized'
export const DEFAULT_BOARD_CARD_ESTIMATED_SLOTS = 1

interface BoardCardInput {
  id?: unknown
  content?: unknown
  isDone?: unknown
  priority?: unknown
  categoryId?: unknown
  stackOrder?: unknown
  estimatedSlots?: unknown
  linkedTimeBoxIds?: unknown
  note?: unknown
  createdFrom?: unknown
}

interface LinkedCardLike {
  id: string
  linkedTimeBoxIds?: string[]
}

interface StackOrderedItem {
  stackOrder?: unknown
}

interface CategorizedItem extends StackOrderedItem {
  categoryId?: string | null
}

interface BoardLayoutLane {
  id: string
  items: Array<string | { id?: string | null }>
}

export interface BoardCardRecord {
  id: string
  content: string
  isDone: boolean
  priority: TaskCardPriority
  categoryId: string | null
  stackOrder: number
  estimatedSlots: number
  linkedTimeBoxIds: string[]
  note: string
  createdFrom: TaskCardOrigin
}

export interface BoardLane<T> {
  id: string
  categoryId: string | null
  label: string
  color: string
  items: T[]
}

export interface BoardLayoutEntry {
  id: string
  categoryId: string | null
  stackOrder: number
}

export const normalizeBoardCategoryId = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeBoardEstimatedSlots = (value: unknown): number => {
  const next = Number(value)

  if (!Number.isInteger(next)) {
    return DEFAULT_BOARD_CARD_ESTIMATED_SLOTS
  }

  return Math.max(1, Math.min(TOTAL_SLOTS, next))
}

export const normalizeBoardNote = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export const normalizeBoardCreatedFrom = (value: unknown): TaskCardOrigin =>
  value === 'board' ? 'board' : 'list'

export const normalizeBoardLinkedTimeBoxIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []

export const normalizeBoardStackOrder = (value: unknown, fallback = 0): number => {
  const next = Number(value)
  return Number.isInteger(next) ? next : fallback
}

export const normalizeBoardCard = (
  item: BoardCardInput | BoardCardRecord | null | undefined,
  fallbackIndex = 0,
): BoardCardRecord | null => {
  const content = typeof item?.content === 'string' ? item.content.trim() : ''
  if (!content) {
    return null
  }

  return {
    id: typeof item?.id === 'string' ? item.id : crypto.randomUUID(),
    content,
    isDone: Boolean(item?.isDone),
    priority: normalizeBrainDumpPriority(item?.priority) as TaskCardPriority,
    categoryId: normalizeBoardCategoryId(item?.categoryId),
    stackOrder: normalizeBoardStackOrder(item?.stackOrder, fallbackIndex),
    estimatedSlots: normalizeBoardEstimatedSlots(item?.estimatedSlots),
    linkedTimeBoxIds: normalizeBoardLinkedTimeBoxIds(item?.linkedTimeBoxIds),
    note: normalizeBoardNote(item?.note),
    createdFrom: normalizeBoardCreatedFrom(item?.createdFrom),
  }
}

const areLinkedIdsEqual = (left: string[] = [], right: string[] = []): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index])

export const syncBoardCardsWithTimeBoxes = <T extends LinkedCardLike>(
  brainDump: T[] = [],
  timeBoxes: Array<Pick<TimeBox, 'id' | 'taskId' | 'startSlot'>> = [],
): T[] => {
  const linkedMap = new Map<string, string[]>()

  ;[...timeBoxes]
    .sort((left, right) => left.startSlot - right.startSlot)
    .forEach((box) => {
      if (typeof box?.taskId !== 'string' || box.taskId.trim().length === 0) {
        return
      }

      const next = linkedMap.get(box.taskId) || []
      next.push(box.id)
      linkedMap.set(box.taskId, next)
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

export const sortBoardCardsByStackOrder = <T extends StackOrderedItem>(items: T[] = []): T[] =>
  [...items]
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const byStack =
        normalizeBoardStackOrder(left.item?.stackOrder, left.index) -
        normalizeBoardStackOrder(right.item?.stackOrder, right.index)

      if (byStack !== 0) {
        return byStack
      }

      return left.index - right.index
    })
    .map(({ item }) => item)

export const groupBoardCardsByCategory = <T extends CategorizedItem>(
  items: T[] = [],
  categories: CategoryViewModel[] = [],
): BoardLane<T>[] => {
  const grouped = new Map<string, BoardLane<T>>()
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
    const laneKey =
      item.categoryId && grouped.has(item.categoryId) ? item.categoryId : UNCATEGORIZED_BOARD_LANE
    grouped.get(laneKey)?.items.push(item)
  })

  return [
    grouped.get(UNCATEGORIZED_BOARD_LANE) as BoardLane<T>,
    ...visibleCategories.map((category) => grouped.get(category.id) as BoardLane<T>),
  ]
}

export const buildBoardLayoutEntries = (lanes: BoardLayoutLane[] = []): BoardLayoutEntry[] =>
  lanes.flatMap((lane) =>
    lane.items.flatMap((item, index) => {
      const itemId = typeof item === 'string' ? item : item?.id ?? null
      if (!itemId) {
        return []
      }

      return {
        id: itemId,
        categoryId: lane.id === UNCATEGORIZED_BOARD_LANE ? null : lane.id,
        stackOrder: index,
      }
    }),
  )

export const getNextBoardStackOrder = <T extends StackOrderedItem>(items: T[] = []): number =>
  items.reduce(
    (max, item, index) => Math.max(max, normalizeBoardStackOrder(item?.stackOrder, index)),
    -1,
  ) + 1

export const getBrainDumpSidebarItems = <T extends { priority?: unknown }>(items: T[] = []): T[] =>
  sortBrainDumpItems(items)
