import {
  DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
  getNextBoardStackOrder,
  normalizeBoardCategoryId,
  normalizeBoardEstimatedSlots,
  normalizeBoardLinkedTimeBoxIds,
  normalizeBoardNote,
  syncBoardCardsWithTimeBoxes,
} from '../lib/boardCard'
import { cycleBrainDumpPriority, normalizeBrainDumpPriority, sortBrainDumpItems } from '../lib/brainDumpPriority'
import type { TaskCard, TaskCardOrigin, TaskCardPriority, TimeBox } from './types'

interface TaskCardInput {
  id?: unknown
  title?: unknown
  isDone?: unknown
  priority?: unknown
  categoryId?: unknown
  stackOrder?: unknown
  estimateSlots?: unknown
  linkedTimeBoxIds?: unknown
  note?: unknown
  origin?: unknown
}

interface TaskCardLayoutEntry {
  id?: unknown
  categoryId?: unknown
  stackOrder?: unknown
}

const createId = (): string => crypto.randomUUID()

const normalizeTaskCardTitle = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const normalizeTaskCardOrigin = (value: unknown): TaskCardOrigin =>
  value === 'board' ? 'board' : 'list'

const normalizeTaskCardPriority = (value: unknown): TaskCardPriority =>
  normalizeBrainDumpPriority(value) as TaskCardPriority

export const normalizeTaskCard = (
  taskCard: TaskCardInput | TaskCard | null | undefined,
  fallbackIndex = 0,
): TaskCard | null => {
  const title = normalizeTaskCardTitle(taskCard?.title)
  if (!title) {
    return null
  }

  return {
    id: typeof taskCard?.id === 'string' ? taskCard.id : createId(),
    title,
    isDone: Boolean(taskCard?.isDone),
    priority: normalizeTaskCardPriority(taskCard?.priority),
    categoryId: normalizeBoardCategoryId(taskCard?.categoryId),
    stackOrder:
      typeof taskCard?.stackOrder === 'number' && Number.isInteger(taskCard.stackOrder)
        ? taskCard.stackOrder
        : fallbackIndex,
    estimateSlots: normalizeBoardEstimatedSlots(
      taskCard?.estimateSlots ?? DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
    ),
    linkedTimeBoxIds: normalizeBoardLinkedTimeBoxIds(taskCard?.linkedTimeBoxIds),
    note: normalizeBoardNote(taskCard?.note),
    origin: normalizeTaskCardOrigin(taskCard?.origin),
  }
}

export const createTaskCardRecord = (
  taskCards: TaskCard[] = [],
  input: TaskCardInput = {},
): TaskCard | null =>
  normalizeTaskCard({
    id: input.id,
    title: String(input.title || '').trim(),
    isDone: Boolean(input.isDone),
    priority: normalizeTaskCardPriority(input.priority),
    categoryId: normalizeBoardCategoryId(input.categoryId),
    stackOrder:
      typeof input.stackOrder === 'number' && Number.isInteger(input.stackOrder)
        ? input.stackOrder
        : getNextBoardStackOrder(taskCards),
    estimateSlots: normalizeBoardEstimatedSlots(
      input.estimateSlots ?? DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
    ),
    linkedTimeBoxIds: normalizeBoardLinkedTimeBoxIds(input.linkedTimeBoxIds),
    note: normalizeBoardNote(input.note),
    origin: input.origin,
  })

export const addTaskCardRecord = (taskCards: TaskCard[] = [], input: TaskCardInput = {}): TaskCard[] => {
  const nextTaskCard = createTaskCardRecord(taskCards, input)
  if (!nextTaskCard) {
    return taskCards
  }

  return [...taskCards, nextTaskCard]
}

export const removeTaskCardRecord = (taskCards: TaskCard[] = [], taskId: string): TaskCard[] =>
  taskCards.filter((taskCard) => taskCard.id !== taskId)

export const restoreTaskCardRecord = (
  taskCards: TaskCard[] = [],
  taskCard: TaskCardInput | TaskCard | null | undefined,
  index: number | null = null,
): TaskCard[] => {
  const normalized = normalizeTaskCard(taskCard)
  if (!normalized || taskCards.some((existing) => existing.id === normalized.id)) {
    return taskCards
  }

  const nextTaskCards = [...taskCards]
  const insertAt = Number.isInteger(index)
    ? Math.max(0, Math.min(nextTaskCards.length, Number(index)))
    : nextTaskCards.length

  nextTaskCards.splice(insertAt, 0, normalized)
  return nextTaskCards
}

export const updateTaskCardRecord = (
  taskCards: TaskCard[] = [],
  taskId: string,
  changes: TaskCardInput = {},
): TaskCard[] =>
  taskCards.map((taskCard, index) => {
    if (taskCard.id !== taskId) {
      return taskCard
    }

    return (
      normalizeTaskCard(
        {
          ...taskCard,
          ...changes,
          title:
            typeof changes?.title === 'string' && changes.title.trim().length > 0
              ? changes.title
              : taskCard.title,
          categoryId:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'categoryId')
              ? normalizeBoardCategoryId(changes?.categoryId)
              : taskCard.categoryId ?? null,
          estimateSlots:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'estimateSlots')
              ? normalizeBoardEstimatedSlots(changes?.estimateSlots)
              : taskCard.estimateSlots ?? DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
          note:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'note')
              ? normalizeBoardNote(changes?.note)
              : taskCard.note ?? '',
          linkedTimeBoxIds:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'linkedTimeBoxIds')
              ? normalizeBoardLinkedTimeBoxIds(changes?.linkedTimeBoxIds)
              : taskCard.linkedTimeBoxIds ?? [],
          origin:
            Object.prototype.hasOwnProperty.call(changes ?? {}, 'origin')
              ? normalizeTaskCardOrigin(changes?.origin)
              : taskCard.origin ?? 'list',
        },
        index,
      ) ?? taskCard
    )
  })

export const syncTaskCardLinksWithTimeBoxes = (
  taskCards: TaskCard[] = [],
  timeBoxes: TimeBox[] = [],
): TaskCard[] => syncBoardCardsWithTimeBoxes(taskCards, timeBoxes) as TaskCard[]

export const applyTaskCardBoardLayout = (
  taskCards: TaskCard[] = [],
  layoutEntries: TaskCardLayoutEntry[] = [],
): TaskCard[] => {
  const layoutMap = new Map(
    layoutEntries
      .filter((entry) => typeof entry?.id === 'string')
      .map((entry) => [
        entry.id,
        {
          categoryId: normalizeBoardCategoryId(entry.categoryId),
          stackOrder: Number.isInteger(entry.stackOrder) ? entry.stackOrder : 0,
        },
      ]),
  )

  return taskCards.map((taskCard, index) => {
    const layout = layoutMap.get(taskCard.id)
    if (!layout) {
      return taskCard
    }

    return (
      normalizeTaskCard(
        {
          ...taskCard,
          categoryId: layout.categoryId,
          stackOrder: layout.stackOrder,
        },
        index,
      ) ?? taskCard
    )
  })
}

export const clearTaskCardCategory = (
  taskCards: TaskCard[] = [],
  categoryId: string | null,
): TaskCard[] =>
  taskCards.map((taskCard) =>
    taskCard.categoryId === categoryId ? { ...taskCard, categoryId: null } : taskCard,
  )

export const cycleTaskCardPriority = (
  taskCards: TaskCard[] = [],
  taskId: string,
): { nextTaskCards: TaskCard[]; nextPriority: TaskCardPriority | null } => {
  let nextPriority: TaskCardPriority | null = null

  const nextTaskCards = taskCards.map((taskCard) => {
    if (taskCard.id !== taskId) {
      return taskCard
    }

    nextPriority = cycleBrainDumpPriority(taskCard.priority) as TaskCardPriority
    return {
      ...taskCard,
      priority: nextPriority,
    }
  })

  return {
    nextTaskCards,
    nextPriority,
  }
}

export const getSortedTaskCards = (taskCards: TaskCard[] = []): TaskCard[] =>
  sortBrainDumpItems(taskCards) as TaskCard[]
