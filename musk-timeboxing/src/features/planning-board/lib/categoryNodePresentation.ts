const hexToRgba = (hex: string | null | undefined, alpha: number): string => {
  if (typeof hex !== 'string') {
    return `rgba(99, 102, 241, ${alpha})`
  }

  const normalized = hex.replace('#', '')
  const safe =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(safe)) {
    return `rgba(99, 102, 241, ${alpha})`
  }

  const red = Number.parseInt(safe.slice(0, 2), 16)
  const green = Number.parseInt(safe.slice(2, 4), 16)
  const blue = Number.parseInt(safe.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

interface CategoryNodePresentationInput {
  color: string
  count: number
  isOver: boolean
  isArmed: boolean
  isActive: boolean
}

export const getCategoryNodePresentation = ({
  color,
  count,
  isOver,
  isArmed,
  isActive,
}: CategoryNodePresentationInput) => {
  const hasCards = count > 0
  const isHighlighted = isOver || isActive
  const borderAlpha = isOver ? 0.42 : isActive ? 0.28 : hasCards ? 0.16 : isArmed ? 0.12 : 0.08
  const topTintAlpha = isOver ? 0.24 : isActive ? 0.18 : hasCards ? 0.08 : 0
  const bottomTintAlpha = isOver ? 0.12 : isActive ? 0.08 : hasCards ? 0.03 : 0
  const glowAlpha = isOver ? 0.18 : isActive ? 0.14 : 0
  const accentAlpha = isOver ? 1 : isActive ? 0.9 : hasCards ? 0.74 : 0.48
  const metaLabel = isOver ? '여기로 이동' : isActive ? '현재 열림' : hasCards ? `${count}개 카드` : '비어 있음'

  return {
    isHighlighted,
    hasCards,
    metaLabel,
    className: isOver
      ? 'border-transparent -translate-y-0.5 shadow-lg'
      : isActive
        ? 'border-transparent shadow-md'
        : hasCards
          ? 'border-slate-200/90 shadow-sm dark:border-slate-800/90'
          : isArmed
            ? 'border-slate-300/80 dark:border-slate-700/80'
            : 'border-dashed border-slate-300/80 dark:border-slate-700/80',
    countClassName: isHighlighted
      ? 'bg-white/88 text-slate-900 dark:bg-slate-950/80 dark:text-slate-100'
      : hasCards
        ? 'bg-slate-900/6 text-slate-700 dark:bg-slate-100/10 dark:text-slate-200'
        : 'bg-transparent text-slate-500 dark:text-slate-400',
    metaClassName: isHighlighted
      ? 'text-slate-700 dark:text-slate-200'
      : 'text-slate-500 dark:text-slate-400',
    style: {
      borderColor: hexToRgba(color, borderAlpha),
      backgroundImage:
        topTintAlpha > 0
          ? `linear-gradient(135deg, ${hexToRgba(color, topTintAlpha)} 0%, ${hexToRgba(color, bottomTintAlpha)} 100%)`
          : undefined,
      boxShadow:
        glowAlpha > 0
          ? `0 0 0 1px ${hexToRgba(color, 0.12)}, 0 10px 28px ${hexToRgba(color, glowAlpha)}`
          : hasCards
            ? `inset 0 1px 0 ${hexToRgba('#ffffff', 0.45)}, 0 6px 16px ${hexToRgba(color, 0.08)}`
            : 'inset 0 1px 0 rgba(255,255,255,0.45)',
    },
    accentStyle: {
      backgroundColor: hexToRgba(color, accentAlpha),
      boxShadow: isHighlighted ? `0 0 0 1px ${hexToRgba(color, 0.12)}` : undefined,
    },
    badgeStyle: isHighlighted
      ? {
          borderColor: hexToRgba(color, 0.2),
        }
      : hasCards
        ? {
            borderColor: hexToRgba(color, 0.12),
          }
        : undefined,
    surfaceStyle: {
      backgroundColor: hasCards || isHighlighted ? hexToRgba('#ffffff', 0.72) : hexToRgba('#ffffff', 0.58),
    },
  }
}
