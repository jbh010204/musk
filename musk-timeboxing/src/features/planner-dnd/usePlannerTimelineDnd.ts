import { PointerSensor, useSensor, useSensors, type DragCancelEvent, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from '@dnd-kit/core'
import { useMemo, useRef, useState } from 'react'
import { TOTAL_SLOTS, hasOverlap, planTimeBoxPlacement, type TimeBox } from '../../entities/planner'
import {
  getPlannerDndType,
  getScheduleSourceContent,
  getScheduleSourceTaskId,
  isBigThreeSlotDropPayload,
  isScheduleSourceDragPayload,
  isTimeBoxDragPayload,
  isTimelineSlotDropPayload,
  PLANNER_DND_TYPES,
} from './lib/payloads'
import {
  resolveMovedRangeFromDelta,
  resolveTimelineSlotFromFinalPosition,
  resolveTimelineSlotFromPointerPosition,
} from './lib/timelineDrop'

const BASE_SLOT_HEIGHT = 32
const DEFAULT_BOX_SLOTS = 1

interface ActiveDragPreview {
  type: string
  content: string
}

interface MovingTimeBoxPreview {
  id: string
  startSlot: number
  endSlot: number
  hasConflict: boolean
}

interface UsePlannerTimelineDndOptions {
  timeBoxes: TimeBox[]
  timelineSlotHeight: number
  addTimeBox: (timeBox: TimeBox) => unknown
  updateTimeBox: (id: string, changes: { startSlot: number; endSlot: number }) => void
  sendToBigThree: (taskCardId: string) => boolean
  showToast: (message: string) => void
}

const showPlacementFailureToast = (
  reason: 'invalid-content' | 'no-space' | 'overlap' | null,
  showToast: (message: string) => void,
): void => {
  if (reason === 'invalid-content') {
    showToast('일정 내용을 입력해 주세요')
    return
  }

  if (reason === 'overlap') {
    showToast('해당 시간에 이미 일정이 있습니다')
    return
  }

  showToast('배치할 빈 시간이 없습니다')
}

export const usePlannerTimelineDnd = ({
  timeBoxes,
  timelineSlotHeight,
  addTimeBox,
  updateTimeBox,
  sendToBigThree,
  showToast,
}: UsePlannerTimelineDndOptions) => {
  const [activeDragPreview, setActiveDragPreview] = useState<ActiveDragPreview | null>(null)
  const [dropPreviewSlot, setDropPreviewSlot] = useState<number | null>(null)
  const [movingTimeBoxPreview, setMovingTimeBoxPreview] = useState<MovingTimeBoxPreview | null>(null)
  const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const dropPreviewSlotRef = useRef<number | null>(null)
  const activeDragTypeRef = useRef<string | null>(null)
  const pointerTrackingRef = useRef(false)
  const trackPointerMoveRef = useRef<(event: PointerEvent) => void>(() => {})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const updateDropPreviewSlot = (slot: number | null) => {
    const normalized = Number.isInteger(slot) ? slot : null
    dropPreviewSlotRef.current = normalized
    setDropPreviewSlot((prev) => (prev === normalized ? prev : normalized))
  }

  const updateDropPreviewFromPointer = (pointer: { clientX: number; clientY: number } | null) => {
    if (activeDragTypeRef.current !== PLANNER_DND_TYPES.BRAIN_DUMP && activeDragTypeRef.current !== PLANNER_DND_TYPES.BIG_THREE) {
      updateDropPreviewSlot(null)
      return
    }

    const slot = resolveTimelineSlotFromPointerPosition(pointer, {
      totalSlots: TOTAL_SLOTS,
      baseSlotHeight: BASE_SLOT_HEIGHT,
    })
    updateDropPreviewSlot(slot)
  }

  trackPointerMoveRef.current = (event: PointerEvent) => {
    const pointer = {
      clientX: Number(event?.clientX),
      clientY: Number(event?.clientY),
    }
    lastPointerRef.current = pointer
    updateDropPreviewFromPointer(pointer)
  }
  const handleWindowPointerMove = useMemo(
    () => (event: PointerEvent) => {
      trackPointerMoveRef.current(event)
    },
    [],
  )

  const startPointerTracking = () => {
    if (pointerTrackingRef.current || typeof window === 'undefined') {
      return
    }

    pointerTrackingRef.current = true
    window.addEventListener('pointermove', handleWindowPointerMove)
  }

  const stopPointerTracking = () => {
    if (!pointerTrackingRef.current || typeof window === 'undefined') {
      return
    }

    pointerTrackingRef.current = false
    window.removeEventListener('pointermove', handleWindowPointerMove)
  }

  const finalizeDrag = () => {
    setActiveDragPreview(null)
    setMovingTimeBoxPreview(null)
    lastPointerRef.current = null
    activeDragTypeRef.current = null
    updateDropPreviewSlot(null)
    stopPointerTracking()
  }

  const handleDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const payload = active?.data?.current
    const pointer = {
      clientX: Number(activatorEvent && 'clientX' in activatorEvent ? activatorEvent.clientX : null),
      clientY: Number(activatorEvent && 'clientY' in activatorEvent ? activatorEvent.clientY : null),
    }
    lastPointerRef.current = pointer

    if (!payload) {
      setActiveDragPreview(null)
      setMovingTimeBoxPreview(null)
      updateDropPreviewSlot(null)
      return
    }

    activeDragTypeRef.current = getPlannerDndType(payload)

    if (isScheduleSourceDragPayload(payload)) {
      startPointerTracking()
      setActiveDragPreview({
        type: getPlannerDndType(payload) ?? '',
        content: getScheduleSourceContent(payload),
      })
      updateDropPreviewFromPointer(pointer)
      return
    }

    if (isTimeBoxDragPayload(payload)) {
      setMovingTimeBoxPreview({
        id: payload.id,
        startSlot: Number(payload.startSlot) || 0,
        endSlot: Number(payload.endSlot) || (Number(payload.startSlot) || 0) + 1,
        hasConflict: false,
      })
      return
    }

    setActiveDragPreview(null)
    setMovingTimeBoxPreview(null)
    updateDropPreviewSlot(null)
  }

  const handleDragCancel = (_event?: DragCancelEvent) => {
    finalizeDrag()
  }

  const handleDragMove = ({ over, activatorEvent, active, delta }: DragMoveEvent) => {
    if (activeDragTypeRef.current === PLANNER_DND_TYPES.TIME_BOX) {
      const activeData = active?.data?.current
      if (!isTimeBoxDragPayload(activeData)) {
        setMovingTimeBoxPreview(null)
        return
      }

      const movedRange = resolveMovedRangeFromDelta(activeData, delta?.y, timelineSlotHeight, TOTAL_SLOTS)
      const hasConflict = hasOverlap(timeBoxes, movedRange, activeData.id)
      setMovingTimeBoxPreview({
        id: activeData.id,
        ...movedRange,
        hasConflict,
      })
      return
    }

    if (
      activeDragTypeRef.current !== PLANNER_DND_TYPES.BRAIN_DUMP &&
      activeDragTypeRef.current !== PLANNER_DND_TYPES.BIG_THREE
    ) {
      return
    }

    const overData = over?.data?.current
    if (isTimelineSlotDropPayload(overData)) {
      updateDropPreviewSlot(overData.slotIndex)
      return
    }

    let pointerSlot: number | null = null
    const clientX = Number(activatorEvent && 'clientX' in activatorEvent ? activatorEvent.clientX : null)
    const clientY = Number(activatorEvent && 'clientY' in activatorEvent ? activatorEvent.clientY : null)

    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      const pointer = { clientX, clientY }
      lastPointerRef.current = pointer
      pointerSlot = resolveTimelineSlotFromPointerPosition(pointer, {
        totalSlots: TOTAL_SLOTS,
        baseSlotHeight: BASE_SLOT_HEIGHT,
      })
    }

    const rectSlot = resolveTimelineSlotFromFinalPosition(active, delta, {
      totalSlots: TOTAL_SLOTS,
      baseSlotHeight: BASE_SLOT_HEIGHT,
    })
    updateDropPreviewSlot(pointerSlot ?? rectSlot)
  }

  const handleDragEnd = ({ active, over, delta }: DragEndEvent) => {
    const activeData = active.data.current

    if (!activeData) {
      finalizeDrag()
      return
    }

    if (isTimeBoxDragPayload(activeData)) {
      const movedRange = resolveMovedRangeFromDelta(activeData, delta?.y, timelineSlotHeight, TOTAL_SLOTS)
      const activeStart = Number(activeData.startSlot) || 0
      const activeEnd = Number(activeData.endSlot) || activeStart + 1

      if (movedRange.slotDelta === 0) {
        finalizeDrag()
        return
      }

      const { startSlot, endSlot } = movedRange

      if (startSlot === activeStart && endSlot === activeEnd) {
        finalizeDrag()
        return
      }

      if (hasOverlap(timeBoxes, { startSlot, endSlot }, activeData.id)) {
        showToast('해당 시간에 이미 일정이 있습니다')
        finalizeDrag()
        return
      }

      updateTimeBox(activeData.id, { startSlot, endSlot })
      finalizeDrag()
      return
    }

    const overData = over?.data?.current ?? null

    if (
      getPlannerDndType(activeData) === PLANNER_DND_TYPES.BRAIN_DUMP &&
      isBigThreeSlotDropPayload(overData)
    ) {
      const success = sendToBigThree(activeData.id)
      if (!success) {
        showToast('빅 3이 이미 가득 찼습니다')
      }
      finalizeDrag()
      return
    }

    if (isScheduleSourceDragPayload(activeData)) {
      const overSlot = isTimelineSlotDropPayload(overData) ? overData.slotIndex : null
      const startSlot =
        overSlot ??
        dropPreviewSlotRef.current ??
        resolveTimelineSlotFromPointerPosition(lastPointerRef.current, {
          totalSlots: TOTAL_SLOTS,
          baseSlotHeight: BASE_SLOT_HEIGHT,
        }) ??
        resolveTimelineSlotFromFinalPosition(active, delta, {
          totalSlots: TOTAL_SLOTS,
          baseSlotHeight: BASE_SLOT_HEIGHT,
        }) ??
        null

      if (!Number.isInteger(startSlot)) {
        finalizeDrag()
        return
      }

      const placement = planTimeBoxPlacement(timeBoxes, {
        content: getScheduleSourceContent(activeData),
        taskId: getScheduleSourceTaskId(activeData),
        startSlot,
        durationSlots: DEFAULT_BOX_SLOTS,
      })

      if (!placement.timeBox) {
        showPlacementFailureToast(placement.reason, showToast)
        finalizeDrag()
        return
      }

      addTimeBox(placement.timeBox)
    }

    finalizeDrag()
  }

  return {
    sensors,
    activeDragPreview,
    dropPreviewSlot,
    movingTimeBoxPreview,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  }
}
