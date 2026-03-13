import type { CategoryRecord, TimeBoxStatus } from '../model/types'

const DEFAULT_CATEGORY_COLOR = '#4f46e5'

interface CategoryMetaLike {
  name?: unknown
  color?: unknown
}

interface LegacyTimeBoxCategoryLike {
  category?: unknown
}

interface StatusVisual {
  label: string
  color: string
}

interface TimeBoxVisual {
  cardBackground: string
  categoryStripe: string
  categoryBadgeBackground: string
  categoryBadgeBorder: string
  statusLabel: string
  statusColor: string
  statusBadgeBackground: string
  statusBadgeBorder: string
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const hslToHex = (h: number, s: number, l: number): string => {
  const sat = clamp(s, 0, 100) / 100
  const lig = clamp(l, 0, 100) / 100
  const chroma = (1 - Math.abs(2 * lig - 1)) * sat
  const huePrime = (h % 360) / 60
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1))

  let r = 0
  let g = 0
  let b = 0

  if (huePrime >= 0 && huePrime < 1) {
    r = chroma
    g = x
  } else if (huePrime < 2) {
    r = x
    g = chroma
  } else if (huePrime < 3) {
    g = chroma
    b = x
  } else if (huePrime < 4) {
    g = x
    b = chroma
  } else if (huePrime < 5) {
    r = x
    b = chroma
  } else {
    r = chroma
    b = x
  }

  const m = lig - chroma / 2
  const toHex = (channel: number): string => {
    const value = Math.round((channel + m) * 255)
    return clamp(value, 0, 255).toString(16).padStart(2, '0')
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const hashString = (value: string): number => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

export const colorFromCategoryName = (name: unknown): string => {
  const normalized = String(name || '').trim()
  if (!normalized) {
    return DEFAULT_CATEGORY_COLOR
  }

  const hue = hashString(normalized) % 360
  return hslToHex(hue, 68, 56)
}

export const hexToRgba = (hex: unknown, alpha: number): string => {
  const normalized = String(hex || '').trim()
  const matched = normalized.match(/^#([0-9a-fA-F]{6})$/)

  if (!matched) {
    return `rgba(79, 70, 229, ${alpha})`
  }

  const raw = matched[1]
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const getCategoryLabel = (
  categoryMeta: Pick<CategoryRecord, 'name'> | CategoryMetaLike | null | undefined,
  timeBox: LegacyTimeBoxCategoryLike | null | undefined,
): string | null => {
  const metaName = typeof categoryMeta?.name === 'string' ? categoryMeta.name.trim() : ''
  if (metaName) {
    return metaName
  }

  const legacy = typeof timeBox?.category === 'string' ? timeBox.category.trim() : ''
  if (legacy) {
    return legacy
  }

  return null
}

export const getCategoryColor = (
  categoryMeta: Pick<CategoryRecord, 'name' | 'color'> | CategoryMetaLike | null | undefined,
  timeBox: LegacyTimeBoxCategoryLike | null | undefined,
): string => {
  const metaColor = typeof categoryMeta?.color === 'string' ? categoryMeta.color.trim() : ''
  if (/^#[0-9a-fA-F]{6}$/.test(metaColor)) {
    return metaColor
  }

  const label = getCategoryLabel(categoryMeta, timeBox)
  if (label) {
    return colorFromCategoryName(label)
  }

  return DEFAULT_CATEGORY_COLOR
}

export const getStatusVisual = (status: TimeBoxStatus | unknown): StatusVisual => {
  if (status === 'COMPLETED') {
    return {
      label: '완료',
      color: '#16a34a',
    }
  }

  if (status === 'SKIPPED') {
    return {
      label: '스킵',
      color: '#d97706',
    }
  }

  return {
    label: '예정',
    color: '#6366f1',
  }
}

export const getTimeBoxVisual = (
  categoryColor: unknown,
  status: TimeBoxStatus | unknown,
): TimeBoxVisual => {
  const baseColor = /^#[0-9a-fA-F]{6}$/.test(String(categoryColor || ''))
    ? String(categoryColor)
    : DEFAULT_CATEGORY_COLOR
  const statusVisual = getStatusVisual(status)

  return {
    cardBackground: `linear-gradient(180deg, ${hexToRgba(baseColor, 0.92)} 0%, ${hexToRgba(baseColor, 0.84)} 100%)`,
    categoryStripe: baseColor,
    categoryBadgeBackground: hexToRgba(baseColor, 0.5),
    categoryBadgeBorder: hexToRgba(baseColor, 0.85),
    statusLabel: statusVisual.label,
    statusColor: statusVisual.color,
    statusBadgeBackground: hexToRgba(statusVisual.color, 0.24),
    statusBadgeBorder: hexToRgba(statusVisual.color, 0.72),
  }
}
