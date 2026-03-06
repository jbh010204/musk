const COMPACT_MAX_HEIGHT = 44
const MEDIUM_MAX_HEIGHT = 80

const LAYOUT_BY_MODE = {
  compact: {
    topActionsTopClass: 'top-1.5',
    statusTextClass: 'text-[9px]',
    showCompactRow: true,
    compactRowMarginTopClass: 'mt-5',
    detailPaddingTopClass: 'pt-5',
    showTopTimerLabel: false,
    showInlineRuntimeLabel: false,
    paddingRightWithTimerClass: 'pr-20',
    paddingRightWithoutTimerClass: 'pr-12',
  },
  medium: {
    topActionsTopClass: 'top-2',
    statusTextClass: 'text-[10px]',
    showCompactRow: false,
    compactRowMarginTopClass: 'mt-5',
    detailPaddingTopClass: 'pt-5',
    showTopTimerLabel: true,
    showInlineRuntimeLabel: true,
    paddingRightWithTimerClass: 'pr-20',
    paddingRightWithoutTimerClass: 'pr-12',
  },
  spacious: {
    topActionsTopClass: 'top-2',
    statusTextClass: 'text-[10px]',
    showCompactRow: false,
    compactRowMarginTopClass: 'mt-5',
    detailPaddingTopClass: 'pt-6',
    showTopTimerLabel: true,
    showInlineRuntimeLabel: true,
    paddingRightWithTimerClass: 'pr-20',
    paddingRightWithoutTimerClass: 'pr-12',
  },
}

const resolveMode = (boxHeight) => {
  if (boxHeight <= COMPACT_MAX_HEIGHT) {
    return 'compact'
  }

  if (boxHeight <= MEDIUM_MAX_HEIGHT) {
    return 'medium'
  }

  return 'spacious'
}

export const resolveTimeBoxLayout = ({ boxHeight, canUseTimer }) => {
  const mode = resolveMode(boxHeight)
  const profile = LAYOUT_BY_MODE[mode]

  return {
    mode,
    isCompact: mode === 'compact',
    ...profile,
    contentPaddingRightClass: canUseTimer
      ? profile.paddingRightWithTimerClass
      : profile.paddingRightWithoutTimerClass,
  }
}
