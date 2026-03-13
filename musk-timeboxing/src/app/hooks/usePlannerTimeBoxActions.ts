import {
  loadPlannerDayModel,
  planTimeBoxPlacement,
  savePlannerDayModel,
  slotDurationMinutes,
  TOTAL_SLOTS,
  type TimeBox,
} from '../../entities/planner'
import type { TimeBoxUpdatePatch } from '../../entities/planner/model/types'
import type { ShowToast } from './useToast'

interface CreateTimeBoxOnDateInput {
  dateStr: string
  content: string
  durationSlots?: number
  startSlot?: number | null
  categoryId?: string | null
  taskId?: string | null
}

interface UsePlannerTimeBoxActionsOptions {
  currentDate: string
  data: ReturnType<typeof loadPlannerDayModel>
  undoToastMs: number
  showToast: ShowToast
  formatDateLabel: (dateStr: string) => string
  addTimeBox: (timeBox: TimeBox) => string | null
  updateTimeBox: (id: string, changes: TimeBoxUpdatePatch) => void
  completeTimeBoxByTimer: (id: string) => void
  removeTimeBox: (id: string) => void
  restoreTimeBox: (timeBox: TimeBox) => boolean
  bumpCrossDateRevision: () => void
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const showPlacementFailureToast = (
  reason: 'invalid-content' | 'no-space' | 'overlap' | null,
  showToast: UsePlannerTimeBoxActionsOptions['showToast'],
  messages: {
    invalidContent?: string
    overlap?: string
    noSpace?: string
  } = {},
) => {
  if (reason === 'invalid-content') {
    showToast(messages.invalidContent || '일정 내용을 입력해 주세요')
    return
  }

  if (reason === 'overlap') {
    showToast(messages.overlap || '해당 시간에 이미 일정이 있습니다')
    return
  }

  showToast(messages.noSpace || '배치할 빈 시간이 없습니다')
}

const showRestoreFailureToast = (showToast: UsePlannerTimeBoxActionsOptions['showToast']) => {
  showToast('원래 시간대가 이미 사용 중이라 되돌릴 수 없습니다')
}

export const usePlannerTimeBoxActions = ({
  currentDate,
  data,
  undoToastMs,
  showToast,
  formatDateLabel,
  addTimeBox,
  updateTimeBox,
  completeTimeBoxByTimer,
  removeTimeBox,
  restoreTimeBox,
  bumpCrossDateRevision,
}: UsePlannerTimeBoxActionsOptions) => {
  const handleUpdateTimeBox = (id: string, changes: TimeBoxUpdatePatch) => {
    const previous = data.timeBoxes.find((box) => box.id === id)
    if (!previous) {
      return
    }

    const hasStatusField = Object.prototype.hasOwnProperty.call(changes ?? {}, 'status')
    const nextStatus = hasStatusField ? changes.status : null
    const isUndoTargetStatus = nextStatus === 'COMPLETED' || nextStatus === 'SKIPPED'
    const statusChanged = isUndoTargetStatus && previous.status !== nextStatus
    const actualChanged =
      nextStatus === 'COMPLETED' &&
      Object.prototype.hasOwnProperty.call(changes ?? {}, 'actualMinutes') &&
      Number(previous.actualMinutes ?? 0) !== Number(changes.actualMinutes ?? 0)
    const skipReasonChanged =
      nextStatus === 'SKIPPED' &&
      Object.prototype.hasOwnProperty.call(changes ?? {}, 'skipReason') &&
      (previous.skipReason ?? null) !== (changes.skipReason ?? null)
    const shouldOfferUndo = statusChanged || actualChanged || skipReasonChanged

    updateTimeBox(id, changes)

    if (!shouldOfferUndo) {
      return
    }

    const statusLabel = nextStatus === 'COMPLETED' ? '완료' : '건너뜀'
    showToast(`일정을 ${statusLabel} 처리했습니다`, undoToastMs, {
      actionLabel: '되돌리기',
      onAction: () => {
        const restored = restoreTimeBox(previous)
        if (!restored) {
          showRestoreFailureToast(showToast)
        }
      },
    })
  }

  const handleTimerComplete = (id: string) => {
    const previous = data.timeBoxes.find((box) => box.id === id)
    if (!previous) {
      return
    }

    completeTimeBoxByTimer(id)
    showToast('타이머 완료로 일정을 완료 처리했습니다', undoToastMs, {
      actionLabel: '되돌리기',
      onAction: () => {
        const restored = restoreTimeBox(previous)
        if (!restored) {
          showRestoreFailureToast(showToast)
        }
      },
    })
  }

  const handleRemoveTimeBox = (id: string) => {
    const removed = data.timeBoxes.find((box) => box.id === id)
    if (!removed) {
      return
    }

    removeTimeBox(id)
    showToast('일정을 삭제했습니다', undoToastMs, {
      actionLabel: '되돌리기',
      onAction: () => {
        const restored = restoreTimeBox(removed)
        if (!restored) {
          showRestoreFailureToast(showToast)
        }
      },
    })
  }

  const handleDuplicateTimeBox = (id: string) => {
    const source = data.timeBoxes.find((box) => box.id === id)
    if (!source) {
      return false
    }

    const placement = planTimeBoxPlacement(data.timeBoxes, {
      content: `${source.content} (복제)`,
      taskId: source.taskId ?? null,
      preferredStartSlot: source.endSlot,
      durationSlots: Math.max(1, source.endSlot - source.startSlot),
      category: source.category ?? null,
      categoryId: source.categoryId ?? null,
    })

    if (!placement.timeBox) {
      showPlacementFailureToast(placement.reason, showToast, {
        noSpace: '복제할 빈 시간이 없습니다',
      })
      return false
    }

    addTimeBox(placement.timeBox)
    showToast(
      `일정을 ${slotDurationMinutes(placement.timeBox.startSlot, placement.timeBox.endSlot)}분 블록으로 복제했습니다`,
    )
    return true
  }

  const createTimeBoxOnDate = ({
    dateStr,
    content,
    durationSlots = 1,
    startSlot = null,
    categoryId = null,
    taskId = null,
  }: CreateTimeBoxOnDateInput) => {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false
    }

    const targetDay = dateStr === currentDate ? data : loadPlannerDayModel(dateStr)
    const placement = planTimeBoxPlacement(targetDay.timeBoxes, {
      content,
      taskId,
      startSlot: Number.isInteger(startSlot)
        ? clamp(Number(startSlot), 0, TOTAL_SLOTS - Math.max(1, Math.min(TOTAL_SLOTS, Number(durationSlots) || 1)))
        : null,
      durationSlots,
      categoryId: categoryId || null,
    })

    if (!placement.timeBox) {
      showPlacementFailureToast(placement.reason, showToast)
      return false
    }

    if (dateStr === currentDate) {
      addTimeBox(placement.timeBox)
    } else {
      savePlannerDayModel(dateStr, {
        ...targetDay,
        timeBoxes: [...targetDay.timeBoxes, placement.timeBox],
      })
      bumpCrossDateRevision()
    }

    showToast(`${formatDateLabel(dateStr)}에 일정을 추가했습니다`)
    return true
  }

  return {
    handleUpdateTimeBox,
    handleTimerComplete,
    handleRemoveTimeBox,
    handleDuplicateTimeBox,
    createTimeBoxOnDate,
  }
}
