import type { CSSProperties, ReactNode } from 'react'
import FloatingActionDock from '../../features/floating'
import type { RunMode } from '../../entities/planner/model/types'

type MobileTab = 'dump' | 'big3' | 'timeline'

interface PlannerShellLayoutProps {
  theme: 'dark' | 'light'
  dumpSection: ReactNode
  bigThreeSection: ReactNode
  timelineSection: ReactNode
  header: ReactNode
  toastContainer: ReactNode
  modalLayer: ReactNode
  showDesktopPlanningRail: boolean
  showMobilePlanningTabs: boolean
  mobileTab: MobileTab
  onMobileTabChange: (tab: MobileTab) => void
  onOpenPatchNotes: () => void
  onOpenCategoryManager: () => void
  onOpenDataModal: () => void
  onOpenTemplateManager: () => void
  runMode?: RunMode
  activeRunAccent?: string | null
}

const THEME_DARK = 'dark'
const DEFAULT_RUN_ACCENT = '#6366f1'

const toRgba = (hexColor: string, alpha: number): string => {
  const normalized = hexColor.replace('#', '').trim()
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized

  if (expanded.length !== 6) {
    return `rgba(99, 102, 241, ${alpha})`
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function PlannerShellLayout({
  theme,
  dumpSection,
  bigThreeSection,
  timelineSection,
  header,
  toastContainer,
  modalLayer,
  showDesktopPlanningRail,
  showMobilePlanningTabs,
  mobileTab,
  onMobileTabChange,
  onOpenPatchNotes,
  onOpenCategoryManager,
  onOpenDataModal,
  onOpenTemplateManager,
  runMode = 'IDLE',
  activeRunAccent = null,
}: PlannerShellLayoutProps) {
  const isDark = theme === THEME_DARK
  const accentColor = activeRunAccent || DEFAULT_RUN_ACCENT
  const ambientPrimary = `radial-gradient(circle at 16% 18%, ${toRgba(
    accentColor,
    isDark ? 0.12 : 0.07,
  )} 0%, transparent 46%)`
  const ambientSecondary = `radial-gradient(circle at 84% 82%, ${toRgba(
    accentColor,
    isDark ? 0.08 : 0.05,
  )} 0%, transparent 44%)`
  const frameShadow = [
    `inset 0 0 0 1px ${toRgba(accentColor, isDark ? 0.18 : 0.12)}`,
    `inset 0 0 72px ${toRgba(accentColor, isDark ? 0.16 : 0.1)}`,
    `0 0 28px ${toRgba(accentColor, isDark ? 0.08 : 0.04)}`,
  ].join(', ')
  const frameBorder = toRgba(accentColor, isDark ? 0.24 : 0.18)

  return (
    <div
      data-run-mode={runMode}
      className={`${theme === THEME_DARK ? 'theme-dark dark' : 'theme-light'} planner-run-shell relative h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100`}
    >
      {runMode !== 'IDLE' ? (
        <>
          <div
            aria-hidden="true"
            className={`planner-run-frame ${
              runMode === 'RUNNING' ? 'planner-run-frame-running' : 'planner-run-frame-paused'
            }`}
            style={{ boxShadow: frameShadow, borderColor: frameBorder } as CSSProperties}
          />
          <div
            aria-hidden="true"
            className={`planner-run-ambient planner-run-ambient-primary ${
              runMode === 'RUNNING' ? 'planner-run-ambient-running' : 'planner-run-ambient-paused'
            }`}
            style={{ backgroundImage: ambientPrimary } as CSSProperties}
          />
          <div
            aria-hidden="true"
            className={`planner-run-ambient planner-run-ambient-secondary ${
              runMode === 'RUNNING' ? 'planner-run-ambient-running' : 'planner-run-ambient-paused'
            }`}
            style={{ backgroundImage: ambientSecondary } as CSSProperties}
          />
        </>
      ) : null}

      <div
        className={`relative z-10 flex h-full flex-col overflow-hidden ${
          runMode === 'IDLE' ? 'bg-slate-50/94 dark:bg-gray-900/94' : 'bg-slate-50/92 dark:bg-gray-900/92'
        }`}
      >
        <div className="relative z-10 flex h-full flex-col overflow-hidden">
          {header}

          <div className="hidden min-h-0 flex-1 overflow-hidden px-6 pb-6 md:flex">
            {showDesktopPlanningRail ? (
              <aside className="ui-panel-subtle mr-6 w-80 flex-shrink-0 overflow-y-auto">
                {dumpSection}
                {bigThreeSection}
              </aside>
            ) : null}
            <main className="ui-panel flex-1 overflow-y-auto">{timelineSection}</main>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:hidden">
            {showMobilePlanningTabs ? (
              <>
                {mobileTab === 'dump' ? dumpSection : null}
                {mobileTab === 'big3' ? bigThreeSection : null}
                {mobileTab === 'timeline' ? timelineSection : null}
              </>
            ) : (
              timelineSection
            )}
          </div>

          {showMobilePlanningTabs ? (
            <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 shadow-sm backdrop-blur dark:bg-gray-800/95 md:hidden">
              <div className="grid grid-cols-3">
                <button
                  type="button"
                  onClick={() => onMobileTabChange('dump')}
                  className={`px-3 py-3 text-sm ${
                    mobileTab === 'dump'
                      ? 'bg-indigo-600 text-gray-100'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-slate-800'
                  }`}
                >
                  덤프
                </button>
                <button
                  type="button"
                  onClick={() => onMobileTabChange('big3')}
                  className={`px-3 py-3 text-sm ${
                    mobileTab === 'big3'
                      ? 'bg-indigo-600 text-gray-100'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-slate-800'
                  }`}
                >
                  빅3
                </button>
                <button
                  type="button"
                  onClick={() => onMobileTabChange('timeline')}
                  className={`px-3 py-3 text-sm ${
                    mobileTab === 'timeline'
                      ? 'bg-indigo-600 text-gray-100'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-slate-800'
                  }`}
                >
                  TIMELINE
                </button>
              </div>
            </nav>
          ) : null}
        </div>
      </div>

      {toastContainer}
      <FloatingActionDock
        onOpenPatchNotes={onOpenPatchNotes}
        onOpenCategory={onOpenCategoryManager}
        onOpenData={onOpenDataModal}
        onOpenTemplate={onOpenTemplateManager}
      />
      {modalLayer}
    </div>
  )
}
