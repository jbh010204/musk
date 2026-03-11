export const deriveLinkedCount = (taskCard) =>
  Array.isArray(taskCard?.linkedTimeBoxIds) ? taskCard.linkedTimeBoxIds.length : 0

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
