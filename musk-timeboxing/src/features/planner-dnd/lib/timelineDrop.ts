interface TimelinePointerLike {
  clientX?: unknown
  clientY?: unknown
}

interface TimelineDeltaLike {
  x?: unknown
  y?: unknown
}

interface TimelineRectLike {
  left: number
  top: number
  width: number
  height: number
}

interface TimelineActiveRectState {
  translated?: TimelineRectLike | null
  initial?: TimelineRectLike | null
}

interface TimelineActiveLike {
  rect?: {
    current?: TimelineActiveRectState | null
  } | null
}

interface TimelineTimeBoxLike {
  startSlot?: unknown
  endSlot?: unknown
}

interface TimelineDropOptions {
  totalSlots: number
  baseSlotHeight: number
}

interface MovedRange {
  startSlot: number
  endSlot: number
  duration: number
  slotDelta: number
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const getVisibleTimelineGridAtPoint = (
  clientX: number,
  clientY: number,
  baseSlotHeight: number,
): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const grids = [...document.querySelectorAll<HTMLElement>('[data-timeline-grid="true"]')]
  return (
    grids.find((grid) => {
      const rect = grid.getBoundingClientRect()
      if (rect.width < 40 || rect.height < baseSlotHeight) {
        return false
      }

      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    }) ?? null
  )
}

const resolveSlotFromGridPoint = (
  grid: HTMLElement,
  clientY: number,
  { totalSlots, baseSlotHeight }: TimelineDropOptions,
): number => {
  const gridRect = grid.getBoundingClientRect()
  const firstSlot = grid.querySelector<HTMLElement>('[data-timeline-slot-index="0"]')
  const rowHeight = Math.max(1, Number(firstSlot?.getBoundingClientRect?.().height) || baseSlotHeight)
  const slotOffset = Math.floor((clientY - gridRect.top) / rowHeight)
  return clamp(slotOffset, 0, totalSlots - 1)
}

export const resolveMovedRangeFromDelta = (
  activeData: TimelineTimeBoxLike | null | undefined,
  deltaY: unknown,
  slotHeight: unknown,
  totalSlots: number,
): MovedRange => {
  const activeStart = Number(activeData?.startSlot) || 0
  const activeEnd = Number(activeData?.endSlot) || activeStart + 1
  const duration = Math.max(1, activeEnd - activeStart)
  const normalizedSlotHeight = Math.max(1, Number(slotHeight) || 32)
  const slotDelta = Math.round((Number(deltaY) || 0) / normalizedSlotHeight)

  let startSlot = activeStart + slotDelta
  startSlot = clamp(startSlot, 0, totalSlots - duration)

  return {
    startSlot,
    endSlot: startSlot + duration,
    duration,
    slotDelta,
  }
}

export const resolveTimelineSlotFromPointerPosition = (
  pointer: TimelinePointerLike | null | undefined,
  options: TimelineDropOptions,
): number | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const clientX = Number(pointer?.clientX)
  const clientY = Number(pointer?.clientY)

  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return null
  }

  const element = document.elementFromPoint(clientX, clientY)
  const slotElement = element?.closest?.('[data-timeline-slot-index]')

  if (slotElement instanceof HTMLElement) {
    const slotIndex = Number(slotElement.getAttribute('data-timeline-slot-index'))
    return Number.isInteger(slotIndex) ? slotIndex : null
  }

  const grid = getVisibleTimelineGridAtPoint(clientX, clientY, options.baseSlotHeight)
  if (!grid) {
    return null
  }

  const gridRect = grid.getBoundingClientRect()
  if (
    clientX < gridRect.left ||
    clientX > gridRect.right ||
    clientY < gridRect.top ||
    clientY > gridRect.bottom
  ) {
    return null
  }

  return resolveSlotFromGridPoint(grid, clientY, options)
}

export const resolveTimelineSlotFromFinalPosition = (
  active: TimelineActiveLike | null | undefined,
  delta: TimelineDeltaLike | null | undefined,
  options: TimelineDropOptions,
): number | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const translatedRect = active?.rect?.current?.translated
  const initialRect = active?.rect?.current?.initial

  let centerX: number | null = null
  let centerY: number | null = null

  if (translatedRect) {
    centerX = translatedRect.left + translatedRect.width / 2
    centerY = translatedRect.top + translatedRect.height / 2
  } else if (initialRect) {
    centerX = initialRect.left + initialRect.width / 2 + Number(delta?.x || 0)
    centerY = initialRect.top + initialRect.height / 2 + Number(delta?.y || 0)
  }

  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
    return null
  }

  const grid = getVisibleTimelineGridAtPoint(centerX, centerY, options.baseSlotHeight)
  if (!grid) {
    return null
  }

  const gridRect = grid.getBoundingClientRect()
  if (
    centerX < gridRect.left ||
    centerX > gridRect.right ||
    centerY < gridRect.top ||
    centerY > gridRect.bottom
  ) {
    return null
  }

  return resolveSlotFromGridPoint(grid, centerY, options)
}
