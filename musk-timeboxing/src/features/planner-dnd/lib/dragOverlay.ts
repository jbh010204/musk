import type { Modifier } from '@dnd-kit/core'

interface CursorAlignedOverlayOptions {
  offsetX?: number
  offsetY?: number
}

const resolveClientCoordinate = (
  event: Event | null,
  key: 'clientX' | 'clientY',
): number | null => {
  if (!event || !(key in event)) {
    return null
  }

  const value = Number((event as MouseEvent)[key])
  return Number.isFinite(value) ? value : null
}

export const createCursorAlignedOverlayModifier = ({
  offsetX = 24,
  offsetY = 18,
}: CursorAlignedOverlayOptions = {}): Modifier => ({
  activatorEvent,
  activeNodeRect,
  overlayNodeRect,
  transform,
}) => {
  const clientX = resolveClientCoordinate(activatorEvent, 'clientX')
  const clientY = resolveClientCoordinate(activatorEvent, 'clientY')

  if (clientX == null || clientY == null || !activeNodeRect || !overlayNodeRect) {
    return transform
  }

  const pointerOffsetX = clientX - activeNodeRect.left
  const pointerOffsetY = clientY - activeNodeRect.top
  const safeOffsetX = Math.min(Math.max(offsetX, 12), Math.max(overlayNodeRect.width - 20, 12))
  const safeOffsetY = Math.min(Math.max(offsetY, 12), Math.max(overlayNodeRect.height - 12, 12))

  return {
    ...transform,
    x: transform.x + pointerOffsetX - safeOffsetX,
    y: transform.y + pointerOffsetY - safeOffsetY,
  }
}

export const COMPACT_CARD_DRAG_OVERLAY_MODIFIER = createCursorAlignedOverlayModifier()
