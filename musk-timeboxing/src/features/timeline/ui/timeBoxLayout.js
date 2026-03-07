const COMPACT_MAX_HEIGHT = 44
const MEDIUM_MAX_HEIGHT = 80
const HANDLE_HEIGHT_PX = 6

const LAYOUT_BY_MODE = {
  compact: {
    topActionsClass: 'top-1/2 -translate-y-1/2',
    statusTextClass: 'text-[9px]',
    showCompactRow: true,
    compactRowClass: 'absolute left-2 top-0 bottom-1.5 flex min-h-0 items-center gap-1.5',
    detailBodyClass: '',
    showTopTimerLabel: false,
    showInlineRuntimeLabel: false,
    showSecondaryMeta: false,
    contentInsetWithTimerClass: 'right-20',
    contentInsetWithoutTimerClass: 'right-12',
    surfaceInsetY: 0.5,
  },
  medium: {
    topActionsClass: 'top-2',
    statusTextClass: 'text-[10px]',
    showCompactRow: false,
    compactRowClass: '',
    detailBodyClass: 'absolute left-2 top-0 bottom-2 pt-8',
    showTopTimerLabel: true,
    showInlineRuntimeLabel: false,
    showSecondaryMeta: false,
    contentInsetWithTimerClass: 'right-20',
    contentInsetWithoutTimerClass: 'right-12',
    surfaceInsetY: 1,
  },
  spacious: {
    topActionsClass: 'top-2',
    statusTextClass: 'text-[10px]',
    showCompactRow: false,
    compactRowClass: '',
    detailBodyClass: 'absolute left-2 top-0 bottom-2.5 pt-9',
    showTopTimerLabel: true,
    showInlineRuntimeLabel: true,
    showSecondaryMeta: true,
    contentInsetWithTimerClass: 'right-20',
    contentInsetWithoutTimerClass: 'right-12',
    surfaceInsetY: 1,
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
    handleHeight: HANDLE_HEIGHT_PX,
    ...profile,
    contentInsetClass: canUseTimer
      ? profile.contentInsetWithTimerClass
      : profile.contentInsetWithoutTimerClass,
  }
}
