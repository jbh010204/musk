import type { BigThreeItem, BigThreeProgress, TaskCard, TimeBox } from './types'

export const deriveLinkedCount = (taskCard: TaskCard | null | undefined): number =>
  Array.isArray(taskCard?.linkedTimeBoxIds) ? taskCard.linkedTimeBoxIds.length : 0

export const deriveTopSkippedReason = (timeBoxes: TimeBox[] = []): string | null => {
  const skipped = timeBoxes.filter((timeBox) => timeBox.status === 'SKIPPED')
  if (skipped.length === 0) {
    return null
  }

  const reasonCounter = new Map<string, number>()
  skipped.forEach((timeBox) => {
    const reason =
      typeof timeBox.skipReason === 'string' && timeBox.skipReason.trim().length > 0
        ? timeBox.skipReason.trim()
        : '기타'
    reasonCounter.set(reason, (reasonCounter.get(reason) || 0) + 1)
  })

  const [topReason, topCount] = [...reasonCounter.entries()].sort((left, right) => right[1] - left[1])[0] || [
    '기타',
    0,
  ]

  return topCount > 0 ? topReason : null
}

export const EMPTY_BIG_THREE_PROGRESS: BigThreeProgress = {
  statuses: ['EMPTY', 'EMPTY', 'EMPTY'],
  completedCount: 0,
  filledCount: 0,
  isPerfect: false,
}

export const deriveTaskCardStatus = (
  taskCard: TaskCard | null | undefined,
  timeBoxes: TimeBox[] = [],
): 'TODO' | 'SCHEDULED' | 'COMPLETED' | 'SKIPPED' | 'PARTIAL' => {
  const linkedIds = Array.isArray(taskCard?.linkedTimeBoxIds) ? taskCard.linkedTimeBoxIds : []
  if (linkedIds.length === 0) {
    return 'TODO'
  }

  const linkedStatuses = linkedIds
    .map((id) => timeBoxes.find((timeBox) => timeBox.id === id)?.status)
    .filter((status): status is TimeBox['status'] => typeof status === 'string')

  if (linkedStatuses.length === 0) {
    return 'SCHEDULED'
  }

  const uniqueStatuses = new Set(linkedStatuses)
  if (uniqueStatuses.size === 1) {
    const [onlyStatus] = uniqueStatuses

    if (onlyStatus === 'COMPLETED') {
      return 'COMPLETED'
    }

    if (onlyStatus === 'SKIPPED') {
      return 'SKIPPED'
    }

    return 'SCHEDULED'
  }

  return 'PARTIAL'
}

export const deriveBigThreeProgress = (
  bigThree: BigThreeItem[] = [],
  timeBoxes: TimeBox[] = [],
): BigThreeProgress => {
  const statuses: BigThreeProgress['statuses'] = [0, 1, 2].map((index) => {
    const item = bigThree[index]
    if (!item) {
      return 'EMPTY'
    }

    const done = timeBoxes.some(
      (timeBox) =>
        timeBox.status === 'COMPLETED' &&
        ((item.taskId && timeBox.taskId === item.taskId) ||
          (item.taskId == null && timeBox.taskId == null && timeBox.content === item.content)),
    )

    return done ? 'DONE' : 'PENDING'
  }) as BigThreeProgress['statuses']

  const completedCount = statuses.filter((status) => status === 'DONE').length
  const filledCount = statuses.filter((status) => status !== 'EMPTY').length

  return {
    statuses,
    completedCount,
    filledCount,
    isPerfect: completedCount === 3,
  }
}
