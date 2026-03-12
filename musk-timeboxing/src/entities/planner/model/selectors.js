export const deriveLinkedCount = (taskCard) =>
  Array.isArray(taskCard?.linkedTimeBoxIds) ? taskCard.linkedTimeBoxIds.length : 0

export const EMPTY_BIG_THREE_PROGRESS = {
  statuses: ['EMPTY', 'EMPTY', 'EMPTY'],
  completedCount: 0,
  filledCount: 0,
  isPerfect: false,
}

export const deriveTaskCardStatus = (taskCard, timeBoxes = []) => {
  const linkedIds = Array.isArray(taskCard?.linkedTimeBoxIds) ? taskCard.linkedTimeBoxIds : []
  if (linkedIds.length === 0) {
    return 'TODO'
  }

  const linkedStatuses = linkedIds
    .map((id) => timeBoxes.find((timeBox) => timeBox.id === id)?.status)
    .filter((status) => typeof status === 'string')

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

export const deriveBigThreeProgress = (bigThree = [], timeBoxes = []) => {
  const statuses = [0, 1, 2].map((index) => {
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
  })

  const completedCount = statuses.filter((status) => status === 'DONE').length
  const filledCount = statuses.filter((status) => status !== 'EMPTY').length

  return {
    statuses,
    completedCount,
    filledCount,
    isPerfect: completedCount === 3,
  }
}
