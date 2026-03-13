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

/** @returns {string} */
const createId = () => crypto.randomUUID()

const normalizeTaskCardTitle = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const normalizeTaskCardOrigin = (value) =>
  value === 'board' ? 'board' : 'list'

export const normalizeTaskCard = (taskCard, fallbackIndex = 0) => {
  const title = normalizeTaskCardTitle(taskCard?.title)
  if (!title) {
    return null
  }

  return {
    id: typeof taskCard?.id === 'string' ? taskCard.id : createId(),
    title,
    isDone: Boolean(taskCard?.isDone),
    priority: normalizeBrainDumpPriority(taskCard?.priority),
    categoryId: normalizeBoardCategoryId(taskCard?.categoryId),
    stackOrder:
      Number.isInteger(taskCard?.stackOrder)
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

export const createTaskCardRecord = (taskCards = [], input = {}) =>
  normalizeTaskCard({
    id: input.id,
    title: String(input.title || '').trim(),
    isDone: Boolean(input.isDone),
    priority: normalizeBrainDumpPriority(input.priority),
    categoryId: normalizeBoardCategoryId(input.categoryId),
    stackOrder: Number.isInteger(input.stackOrder) ? input.stackOrder : getNextBoardStackOrder(taskCards),
    estimateSlots: normalizeBoardEstimatedSlots(
      input.estimateSlots ?? DEFAULT_BOARD_CARD_ESTIMATED_SLOTS,
    ),
    linkedTimeBoxIds: normalizeBoardLinkedTimeBoxIds(input.linkedTimeBoxIds),
    note: normalizeBoardNote(input.note),
    origin: input.origin,
  })

export const addTaskCardRecord = (taskCards = [], input = {}) => {
  const nextTaskCard = createTaskCardRecord(taskCards, input)
  if (!nextTaskCard) {
    return taskCards
  }

  return [...taskCards, nextTaskCard]
}

export const removeTaskCardRecord = (taskCards = [], taskId) =>
  taskCards.filter((taskCard) => taskCard.id !== taskId)

export const restoreTaskCardRecord = (taskCards = [], taskCard, index = null) => {
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

export const updateTaskCardRecord = (taskCards = [], taskId, changes = {}) =>
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

export const syncTaskCardLinksWithTimeBoxes = (taskCards = [], timeBoxes = []) =>
  syncBoardCardsWithTimeBoxes(taskCards, timeBoxes)

export const applyTaskCardBoardLayout = (taskCards = [], layoutEntries = []) => {
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

export const clearTaskCardCategory = (taskCards = [], categoryId) =>
  taskCards.map((taskCard) =>
    taskCard.categoryId === categoryId ? { ...taskCard, categoryId: null } : taskCard,
  )

export const cycleTaskCardPriority = (taskCards = [], taskId) => {
  let nextPriority = null

  const nextTaskCards = taskCards.map((taskCard) => {
    if (taskCard.id !== taskId) {
      return taskCard
    }

    nextPriority = cycleBrainDumpPriority(taskCard.priority)
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

export const getSortedTaskCards = (taskCards = []) => sortBrainDumpItems(taskCards)
