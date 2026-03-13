import { sortBrainDumpItems } from '../lib/brainDumpPriority'
import type { BigThreeItem, TaskCard } from './types'

export const MAX_BIG_THREE_ITEMS = 3

interface BigThreeInput {
  id?: unknown
  content?: unknown
  taskId?: unknown
}

const defaultCreateId = (): string => crypto.randomUUID()

const normalizeText = (value: unknown): string => String(value || '').trim()

const normalizeTaskId = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeBigThreeRecord = (
  item: BigThreeInput | BigThreeItem | null | undefined,
  createId: () => string = defaultCreateId,
): BigThreeItem | null => {
  const content = normalizeText(item?.content)
  if (!content) {
    return null
  }

  return {
    id: typeof item?.id === 'string' ? item.id : createId(),
    content,
    taskId: normalizeTaskId(item?.taskId),
  }
}

const createLinkedBigThreeRecord = (
  taskCard: TaskCard,
  createId: () => string = defaultCreateId,
): BigThreeItem => ({
  id: createId(),
  content: taskCard.title,
  taskId: taskCard.id,
})

const createManualBigThreeRecord = (
  content: string,
  createId: () => string = defaultCreateId,
): BigThreeItem => ({
  id: createId(),
  content,
  taskId: null,
})

export const addTaskCardToBigThree = (
  bigThree: BigThreeItem[] = [],
  taskCards: TaskCard[] = [],
  taskCardId: string,
  createId = defaultCreateId,
): { inserted: boolean; nextBigThree: BigThreeItem[] } => {
  if (bigThree.length >= MAX_BIG_THREE_ITEMS) {
    return { inserted: false, nextBigThree: bigThree }
  }

  const source = taskCards.find((item) => item.id === taskCardId)
  if (!source) {
    return { inserted: false, nextBigThree: bigThree }
  }

  return {
    inserted: true,
    nextBigThree: [...bigThree, createLinkedBigThreeRecord(source, createId)],
  }
}

export const addManyTaskCardsToBigThree = (
  bigThree: BigThreeItem[] = [],
  taskCards: TaskCard[] = [],
  taskCardIds: string[] = [],
  createId = defaultCreateId,
): { insertedCount: number; nextBigThree: BigThreeItem[] } => {
  if (bigThree.length >= MAX_BIG_THREE_ITEMS) {
    return { insertedCount: 0, nextBigThree: bigThree }
  }

  const remainSlots = MAX_BIG_THREE_ITEMS - bigThree.length
  const uniqueIds = [...new Set(taskCardIds.filter((taskCardId) => typeof taskCardId === 'string' && taskCardId.trim().length > 0))]
  const existingTaskIds = new Set(
    bigThree
      .map((item) => item.taskId)
      .filter((taskId) => typeof taskId === 'string' && taskId.length > 0),
  )
  const candidates = uniqueIds
    .map((taskCardId) => taskCards.find((item) => item.id === taskCardId) || null)
    .filter((taskCard): taskCard is TaskCard => Boolean(taskCard))
    .filter((taskCard) => !existingTaskIds.has(taskCard.id))
    .slice(0, remainSlots)

  if (candidates.length === 0) {
    return { insertedCount: 0, nextBigThree: bigThree }
  }

  return {
    insertedCount: candidates.length,
    nextBigThree: [...bigThree, ...candidates.map((taskCard) => createLinkedBigThreeRecord(taskCard, createId))],
  }
}

export const autofillBigThreeFromTaskCards = (
  bigThree: BigThreeItem[] = [],
  taskCards: TaskCard[] = [],
  createId = defaultCreateId,
): { insertedCount: number; nextBigThree: BigThreeItem[] } => {
  if (bigThree.length >= MAX_BIG_THREE_ITEMS || taskCards.length === 0) {
    return { insertedCount: 0, nextBigThree: bigThree }
  }

  const remainSlots = MAX_BIG_THREE_ITEMS - bigThree.length
  const existingTaskIds = new Set(
    bigThree
      .map((item) => item.taskId)
      .filter((taskId) => typeof taskId === 'string' && taskId.length > 0),
  )
  const candidates = taskCards.filter((taskCard) => !existingTaskIds.has(taskCard.id))
  const prioritizedCandidates = sortBrainDumpItems(candidates) as TaskCard[]
  const selectedCandidates = prioritizedCandidates.slice(0, remainSlots)

  if (selectedCandidates.length === 0) {
    return { insertedCount: 0, nextBigThree: bigThree }
  }

  return {
    insertedCount: selectedCandidates.length,
    nextBigThree: [
      ...bigThree,
      ...selectedCandidates.map((taskCard) => createLinkedBigThreeRecord(taskCard, createId)),
    ],
  }
}

export const addManualBigThreeItem = (
  bigThree: BigThreeItem[] = [],
  content: string,
  createId = defaultCreateId,
): { inserted: boolean; nextBigThree: BigThreeItem[] } => {
  const trimmed = normalizeText(content)
  if (!trimmed || bigThree.length >= MAX_BIG_THREE_ITEMS) {
    return { inserted: false, nextBigThree: bigThree }
  }

  return {
    inserted: true,
    nextBigThree: [...bigThree, createManualBigThreeRecord(trimmed, createId)],
  }
}

export const removeBigThreeItemRecord = (
  bigThree: BigThreeItem[] = [],
  bigThreeId: string,
): BigThreeItem[] =>
  bigThree.filter((item) => item.id !== bigThreeId)
