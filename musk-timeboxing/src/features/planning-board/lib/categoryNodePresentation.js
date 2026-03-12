const hexToRgba = (hex, alpha) => {
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

export const getCategoryNodePresentation = ({
  color,
  count,
  isOver,
  isArmed,
  isActive,
}) => {
  const hasCards = count > 0
  const isHighlighted = isOver || isArmed || isActive
  const showGradient = hasCards || isArmed || isActive
  const glowAlpha = isHighlighted ? 0.34 : hasCards ? 0.2 : 0
  const edgeAlpha = isHighlighted ? 0.2 : hasCards ? 0.12 : 0.04

  return {
    isHighlighted,
    hasCards,
    className: isHighlighted
      ? 'scale-[1.04] border-transparent shadow-xl'
      : hasCards
        ? 'border-slate-300/70 shadow-lg dark:border-slate-700/70'
        : isArmed
          ? 'scale-[1.02] border-transparent shadow-lg'
          : 'border-slate-300/80 dark:border-slate-700/80',
    style: {
      backgroundImage: showGradient
        ? `radial-gradient(circle at 50% 15%, ${hexToRgba(color, isHighlighted ? 0.28 : 0.18)} 0%, transparent 52%), linear-gradient(180deg, ${hexToRgba(color, isHighlighted ? 0.24 : hasCards ? 0.16 : 0.1)} 0%, ${hexToRgba(color, 0.05)} 100%)`
        : undefined,
      boxShadow:
        glowAlpha > 0
          ? `0 0 0 1px ${hexToRgba(color, 0.16)}, 0 0 0 5px ${hexToRgba(color, 0.1)}, 0 18px 38px ${hexToRgba(color, glowAlpha)}`
          : hasCards
            ? `inset 0 1px 0 ${hexToRgba(color, edgeAlpha)}, 0 12px 26px ${hexToRgba(color, 0.12)}`
            : `inset 0 1px 0 ${hexToRgba(color, edgeAlpha)}`,
    },
  }
}
