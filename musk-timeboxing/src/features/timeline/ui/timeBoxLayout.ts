const COMPACT_MAX_HEIGHT = 44
const MEDIUM_MAX_HEIGHT = 80
const HANDLE_HEIGHT_PX = 6
const CLAMP_1_CLASS =
  'overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]'
const CLAMP_2_CLASS =
  'overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'

export type TimeBoxLayoutMode = 'compact' | 'medium' | 'spacious'

export interface TimeBoxLayoutProfile {
  mode: TimeBoxLayoutMode
  topActionsClass: string
  statusTextClass: string
  contentLayout: 'inline' | 'stack-centered'
  contentContainerClass: string
  showTag: boolean
  showTime: boolean
  showMeta: boolean
  showTopTimerLabel: boolean
  showInlineRuntimeLabel: boolean
  titleClass: string
  titleClampClass: string
  tagClass: string
  timeClass: string
  metaClass: string
  metaClampClass: string
  contentInsetWithTimerClass: string
  contentInsetWithoutTimerClass: string
  surfaceInsetY: number
  timeVariant: 'short' | 'full'
}

export interface TimeBoxLayout extends TimeBoxLayoutProfile {
  isCompact: boolean
  handleHeight: number
  contentInsetClass: string
}

const LAYOUT_BY_MODE: Record<TimeBoxLayoutMode, TimeBoxLayoutProfile> = {
  compact: {
    mode: 'compact',
    topActionsClass: 'top-1/2 -translate-y-1/2',
    statusTextClass: 'text-[9px]',
    contentLayout: 'inline',
    contentContainerClass: 'absolute left-2 top-0 bottom-1.5 flex min-h-0 items-center justify-start gap-1.5',
    showTag: true,
    showTime: true,
    showMeta: false,
    showTopTimerLabel: false,
    showInlineRuntimeLabel: false,
    titleClass: 'min-w-0 flex-1 text-[11px] font-medium leading-tight text-left',
    titleClampClass: CLAMP_1_CLASS,
    tagClass: 'max-w-[36%] shrink-0 truncate rounded border px-1 py-0.5 text-[10px] text-white/95',
    timeClass: 'max-w-[28%] shrink-0 truncate text-[10px] font-medium text-white/85',
    metaClass: 'hidden',
    metaClampClass: '',
    contentInsetWithTimerClass: 'right-20',
    contentInsetWithoutTimerClass: 'right-12',
    surfaceInsetY: 0.5,
    timeVariant: 'short',
  },
  medium: {
    mode: 'medium',
    topActionsClass: 'top-2',
    statusTextClass: 'text-[10px]',
    contentLayout: 'stack-centered',
    contentContainerClass:
      'absolute left-2 top-0 bottom-1 right-12 flex min-h-0 flex-col items-start justify-center gap-1 overflow-hidden text-left',
    showTag: true,
    showTime: true,
    showMeta: false,
    showTopTimerLabel: true,
    showInlineRuntimeLabel: false,
    titleClass: 'w-full text-[13px] font-semibold leading-[18px] text-white text-left',
    titleClampClass: CLAMP_2_CLASS,
    tagClass: 'inline-flex max-w-[78%] items-center justify-start self-start truncate rounded border px-1.5 py-0.5 text-[10px] text-white',
    timeClass: 'w-full text-[11px] font-medium leading-4 text-white/85 text-left',
    metaClass: 'hidden',
    metaClampClass: '',
    contentInsetWithTimerClass: 'right-20',
    contentInsetWithoutTimerClass: 'right-12',
    surfaceInsetY: 1,
    timeVariant: 'full',
  },
  spacious: {
    mode: 'spacious',
    topActionsClass: 'top-2',
    statusTextClass: 'text-[10px]',
    contentLayout: 'stack-centered',
    contentContainerClass:
      'absolute left-2 top-0 bottom-2.5 right-12 flex min-h-0 flex-col items-start justify-center gap-1.5 overflow-hidden text-left',
    showTag: true,
    showTime: true,
    showMeta: true,
    showTopTimerLabel: true,
    showInlineRuntimeLabel: true,
    titleClass: 'w-full text-[15px] font-semibold leading-5 text-white text-left',
    titleClampClass: CLAMP_2_CLASS,
    tagClass: 'inline-flex max-w-[80%] items-center justify-start self-start truncate rounded border px-1.5 py-0.5 text-[11px] text-white',
    timeClass: 'w-full text-xs font-medium leading-5 text-white/90 text-left',
    metaClass: 'w-full text-xs leading-5 text-left',
    metaClampClass: CLAMP_2_CLASS,
    contentInsetWithTimerClass: 'right-20',
    contentInsetWithoutTimerClass: 'right-12',
    surfaceInsetY: 1,
    timeVariant: 'full',
  },
}

const resolveMode = (boxHeight: number): TimeBoxLayoutMode => {
  if (boxHeight <= COMPACT_MAX_HEIGHT) {
    return 'compact'
  }

  if (boxHeight <= MEDIUM_MAX_HEIGHT) {
    return 'medium'
  }

  return 'spacious'
}

export const resolveTimeBoxLayout = ({
  boxHeight,
  canUseTimer,
}: {
  boxHeight: number
  canUseTimer: boolean
}): TimeBoxLayout => {
  const mode = resolveMode(boxHeight)
  const profile = LAYOUT_BY_MODE[mode]

  return {
    ...profile,
    isCompact: mode === 'compact',
    handleHeight: HANDLE_HEIGHT_PX,
    contentInsetClass: canUseTimer
      ? profile.contentInsetWithTimerClass
      : profile.contentInsetWithoutTimerClass,
  }
}
