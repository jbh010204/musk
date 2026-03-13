interface ToastOptions {
  actionLabel?: string
  onAction?: () => void
}

interface TaskCardRecord {
  id: string
  [key: string]: unknown
}

interface BigThreeRecord {
  id: string
  [key: string]: unknown
}

interface UsePlannerTaskActionsOptions {
  taskCards: TaskCardRecord[]
  bigThree: BigThreeRecord[]
  undoToastMs: number
  showToast: (message: string, duration?: number, options?: ToastOptions | null) => void
  removeTaskCard: (id: string) => void
  restoreTaskCard: (item: TaskCardRecord, index: number | null) => boolean
  sendToBigThree: (taskCardId: string) => boolean
  sendManyToBigThree: (taskCardIds?: string[]) => number
  fillBigThreeFromTaskCards: () => number
}

export const usePlannerTaskActions = ({
  taskCards,
  bigThree,
  undoToastMs,
  showToast,
  removeTaskCard,
  restoreTaskCard,
  sendToBigThree,
  sendManyToBigThree,
  fillBigThreeFromTaskCards,
}: UsePlannerTaskActionsOptions) => {
  const handleSendToBigThree = (taskCardId: string) => {
    const success = sendToBigThree(taskCardId)

    if (!success) {
      showToast('빅 3이 이미 가득 찼습니다')
    }
  }

  const handleRemoveTaskCard = (id: string) => {
    const removedIndex = taskCards.findIndex((item) => item.id === id)
    const removedItem = removedIndex >= 0 ? taskCards[removedIndex] : null

    if (!removedItem) {
      return
    }

    removeTaskCard(id)
    showToast('브레인 덤프를 삭제했습니다', undoToastMs, {
      actionLabel: '되돌리기',
      onAction: () => {
        restoreTaskCard(removedItem, removedIndex)
      },
    })
  }

  const handleFillBigThreeFromTaskCards = () => {
    const insertedCount = fillBigThreeFromTaskCards()

    if (insertedCount > 0) {
      showToast(`우선순위 상위 ${insertedCount}개를 빅3로 채웠습니다`)
      return
    }

    if (bigThree.length >= 3) {
      showToast('빅 3이 이미 가득 찼습니다')
      return
    }

    showToast('채울 브레인 덤프 항목이 없습니다')
  }

  const handleSendCardsToBigThree = (taskCardIds: string[] = []) => {
    const insertedCount = sendManyToBigThree(taskCardIds)

    if (insertedCount > 0) {
      showToast(`선택 카드 ${insertedCount}개를 빅3에 추가했습니다`)
      return insertedCount
    }

    if (bigThree.length >= 3) {
      showToast('빅 3이 이미 가득 찼습니다')
      return 0
    }

    showToast('빅3에 추가할 카드가 없습니다')
    return 0
  }

  return {
    handleSendToBigThree,
    handleRemoveTaskCard,
    handleFillBigThreeFromTaskCards,
    handleSendCardsToBigThree,
  }
}
