import { useEffect, useState } from 'react'
import {
  getPlannerPersistenceStatus,
  loadLastViewMode,
  subscribePlannerPersistenceStatus,
} from '../../entities/planner'
import type { ShowToast } from './useToast'

const THEME_KEY = 'musk-planner-theme'
const TIMELINE_FOCUS_MODE_KEY = 'musk-planner-timeline-focus-mode'
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'
const BOOTSTRAP_NOTICE_KEY = 'musk-planner-bootstrap-notice-shown'

type PlannerTheme = typeof THEME_DARK | typeof THEME_LIGHT
type TimelineViewMode = ReturnType<typeof loadLastViewMode>
type MobileTab = 'dump' | 'big3' | 'timeline'
type TimelineScale = '15' | '30'

type BootstrapResult =
  | {
      mode: 'server-migrated-local'
      migratedDays?: number
    }
  | {
      mode: 'server-hydrated'
      dayCount?: number
    }
  | {
      mode?: string
      migratedDays?: number
      dayCount?: number
    }

interface PlannerAppWindow extends Window {
  __MUSK_PLANNER_BOOTSTRAP_RESULT__?: BootstrapResult
}

interface QuickAddContext {
  dateStr: string
  dateLabel: string
  initialTemplateId: string
}

interface QuickAddOptions {
  dateLabel?: string
  templateId?: string
}

interface UsePlannerShellStateOptions {
  showToast: ShowToast
  formatDateLabel: (dateStr: string) => string
  baseSlotHeight: number
  detailSlotHeight: number
}

const readInitialTheme = (): PlannerTheme => {
  if (typeof window === 'undefined') {
    return THEME_DARK
  }

  const stored = window.localStorage.getItem(THEME_KEY)
  return stored === THEME_LIGHT ? THEME_LIGHT : THEME_DARK
}

const readInitialTimelineFocusMode = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(TIMELINE_FOCUS_MODE_KEY) === 'true'
}

export const usePlannerShellState = ({
  showToast,
  formatDateLabel,
  baseSlotHeight,
  detailSlotHeight,
}: UsePlannerShellStateOptions) => {
  const [timelineViewMode, setTimelineViewMode] = useState<TimelineViewMode>(() => loadLastViewMode())
  const [persistenceStatus, setPersistenceStatus] = useState(() => getPlannerPersistenceStatus())
  const [theme, setTheme] = useState<PlannerTheme>(() => readInitialTheme())
  const [mobileTab, setMobileTab] = useState<MobileTab>('timeline')
  const [timelineScale, setTimelineScale] = useState<TimelineScale>('30')
  const [isTimelineFocusMode, setIsTimelineFocusMode] = useState(() => readInitialTimelineFocusMode())
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [isDataModalOpen, setIsDataModalOpen] = useState(false)
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false)
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [quickAddContext, setQuickAddContext] = useState<QuickAddContext | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(THEME_KEY, theme)
    const root = window.document.documentElement
    if (theme === THEME_DARK) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const result = (window as PlannerAppWindow).__MUSK_PLANNER_BOOTSTRAP_RESULT__
    if (!result || window.sessionStorage.getItem(BOOTSTRAP_NOTICE_KEY) === 'true') {
      return
    }

    if (result.mode === 'server-migrated-local') {
      showToast(`이 브라우저 데이터 ${result.migratedDays || 0}일치를 Docker 저장소로 이관했습니다`, 3200)
    } else if (result.mode === 'server-hydrated' && Number(result.dayCount) > 0) {
      showToast(`Docker 저장소에서 ${result.dayCount}일 데이터를 불러왔습니다`, 2400)
    }

    window.sessionStorage.setItem(BOOTSTRAP_NOTICE_KEY, 'true')
  }, [showToast])

  useEffect(() => {
    const unsubscribe = subscribePlannerPersistenceStatus((status) => {
      setPersistenceStatus(status)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(TIMELINE_FOCUS_MODE_KEY, isTimelineFocusMode ? 'true' : 'false')
  }, [isTimelineFocusMode])

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEME_DARK ? THEME_LIGHT : THEME_DARK))
  }

  const toggleTimelineFocusMode = () => {
    setIsTimelineFocusMode((prev) => !prev)
  }

  const openCategoryManager = () => {
    setIsCategoryManagerOpen(true)
  }

  const closeCategoryManager = () => {
    setIsCategoryManagerOpen(false)
  }

  const openDataModal = () => {
    setIsDataModalOpen(true)
  }

  const closeDataModal = () => {
    setIsDataModalOpen(false)
  }

  const openPatchNotes = () => {
    setIsPatchNotesOpen(true)
  }

  const closePatchNotes = () => {
    setIsPatchNotesOpen(false)
  }

  const openTemplateManager = () => {
    setIsTemplateManagerOpen(true)
  }

  const closeTemplateManager = () => {
    setIsTemplateManagerOpen(false)
  }

  const openRescheduleModal = () => {
    setIsRescheduleModalOpen(true)
  }

  const closeRescheduleModal = () => {
    setIsRescheduleModalOpen(false)
  }

  const openQuickAdd = (dateStr: string, options: QuickAddOptions = {}) => {
    setQuickAddContext({
      dateStr,
      dateLabel: options.dateLabel || formatDateLabel(dateStr),
      initialTemplateId: options.templateId || '',
    })
  }

  const closeQuickAdd = () => {
    setQuickAddContext(null)
  }

  const timelineSlotHeight = timelineScale === '15' ? detailSlotHeight : baseSlotHeight
  const showDesktopPlanningRail = timelineViewMode === 'CANVAS'
  const showMobilePlanningTabs = showDesktopPlanningRail

  return {
    timelineViewMode,
    setTimelineViewMode,
    persistenceStatus,
    theme,
    toggleTheme,
    mobileTab,
    setMobileTab,
    timelineScale,
    setTimelineScale,
    isTimelineFocusMode,
    toggleTimelineFocusMode,
    isCategoryManagerOpen,
    openCategoryManager,
    closeCategoryManager,
    isDataModalOpen,
    openDataModal,
    closeDataModal,
    isPatchNotesOpen,
    openPatchNotes,
    closePatchNotes,
    isTemplateManagerOpen,
    openTemplateManager,
    closeTemplateManager,
    isRescheduleModalOpen,
    openRescheduleModal,
    closeRescheduleModal,
    quickAddContext,
    openQuickAdd,
    closeQuickAdd,
    timelineSlotHeight,
    showDesktopPlanningRail,
    showMobilePlanningTabs,
  }
}
