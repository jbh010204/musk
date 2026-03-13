import type { ReactNode } from 'react'
import FloatingActionDock from '../../features/floating'

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
}

const THEME_DARK = 'dark'

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
}: PlannerShellLayoutProps) {
  return (
    <div
      className={`${theme === THEME_DARK ? 'theme-dark dark' : 'theme-light'} h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100`}
    >
      <div className="flex h-full flex-col overflow-hidden bg-slate-50 dark:bg-gray-900">
        {header}

        <div className="hidden min-h-0 flex-1 gap-6 overflow-hidden px-6 pb-6 md:flex">
          {showDesktopPlanningRail ? (
            <aside className="ui-panel-subtle w-80 flex-shrink-0 overflow-y-auto">
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
                타임라인
              </button>
            </div>
          </nav>
        ) : null}
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
