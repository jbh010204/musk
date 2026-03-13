interface NativeCardDragPreviewOptions {
  title: string
  durationLabel: string
  color?: string
}

const createPreviewElement = ({
  title,
  durationLabel,
  color = '#6366f1',
}: NativeCardDragPreviewOptions): HTMLDivElement | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const wrapper = document.createElement('div')
  wrapper.setAttribute('aria-hidden', 'true')
  wrapper.style.position = 'fixed'
  wrapper.style.top = '-9999px'
  wrapper.style.left = '-9999px'
  wrapper.style.width = '220px'
  wrapper.style.padding = '12px 14px'
  wrapper.style.borderRadius = '20px'
  wrapper.style.border = '1px solid rgba(99,102,241,0.18)'
  wrapper.style.background = 'rgba(255,255,255,0.96)'
  wrapper.style.boxShadow = '0 16px 40px rgba(15,23,42,0.16), 0 4px 14px rgba(15,23,42,0.08)'
  wrapper.style.backdropFilter = 'blur(8px)'
  wrapper.style.setProperty('-webkit-backdrop-filter', 'blur(8px)')
  wrapper.style.color = '#0f172a'
  wrapper.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

  const topRow = document.createElement('div')
  topRow.style.display = 'flex'
  topRow.style.alignItems = 'center'
  topRow.style.justifyContent = 'space-between'
  topRow.style.gap = '12px'

  const badge = document.createElement('span')
  badge.textContent = durationLabel
  badge.style.display = 'inline-flex'
  badge.style.alignItems = 'center'
  badge.style.borderRadius = '999px'
  badge.style.padding = '4px 10px'
  badge.style.fontSize = '11px'
  badge.style.fontWeight = '600'
  badge.style.background = `${color}16`
  badge.style.border = `1px solid ${color}3f`
  badge.style.color = '#334155'

  const hint = document.createElement('span')
  hint.textContent = 'Timeline'
  hint.style.fontSize = '11px'
  hint.style.fontWeight = '700'
  hint.style.letterSpacing = '0.08em'
  hint.style.textTransform = 'uppercase'
  hint.style.color = color

  const titleNode = document.createElement('div')
  titleNode.textContent = title
  titleNode.style.marginTop = '10px'
  titleNode.style.fontSize = '14px'
  titleNode.style.fontWeight = '700'
  titleNode.style.lineHeight = '1.35'
  titleNode.style.whiteSpace = 'nowrap'
  titleNode.style.overflow = 'hidden'
  titleNode.style.textOverflow = 'ellipsis'

  topRow.appendChild(badge)
  topRow.appendChild(hint)
  wrapper.appendChild(topRow)
  wrapper.appendChild(titleNode)

  return wrapper
}

export const applyNativeCardDragPreview = (
  dataTransfer: DataTransfer | null,
  options: NativeCardDragPreviewOptions,
): (() => void) => {
  if (!dataTransfer || typeof document === 'undefined') {
    return () => {}
  }

  const previewElement = createPreviewElement(options)
  if (!previewElement) {
    return () => {}
  }

  document.body.appendChild(previewElement)
  dataTransfer.setDragImage(previewElement, 24, 18)

  let disposed = false
  const cleanup = () => {
    if (disposed) {
      return
    }

    disposed = true
    previewElement.remove()
  }

  window.setTimeout(cleanup, 0)
  return cleanup
}
