import { useState } from 'react'

const ACTIONS = [
  {
    id: 'category',
    label: '카테고리 관리',
    color: '#6366f1',
    short: 'C',
  },
  {
    id: 'data',
    label: '데이터 백업 복원',
    color: '#0284c7',
    short: 'D',
  },
]

function FloatingActionDock({ onOpenCategory, onOpenData }) {
  const [open, setOpen] = useState(false)

  const handleAction = (actionId) => {
    setOpen(false)

    if (actionId === 'category') {
      onOpenCategory()
      return
    }

    if (actionId === 'data') {
      onOpenData()
    }
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="빠른 메뉴 닫기"
          className="fixed inset-0 z-30 cursor-default bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] md:right-6">
        <div className="flex flex-col items-end gap-2.5">
          {open
            ? ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  aria-label={action.label}
                  onClick={() => handleAction(action.id)}
                  className="ui-panel inline-flex min-w-[180px] items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-gray-100 shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: action.color }}
                    >
                      {action.short}
                    </span>
                    {action.label}
                  </span>
                  <span className="text-gray-400">↗</span>
                </button>
              ))
            : null}

          <button
            type="button"
            aria-label="빠른 메뉴"
            onClick={() => setOpen((prev) => !prev)}
            className={`h-14 w-14 rounded-full border border-indigo-400/70 text-2xl font-semibold text-white shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              open ? 'bg-indigo-500 ring-2 ring-indigo-300/60' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {open ? '×' : '+'}
          </button>
        </div>
      </div>
    </>
  )
}

export default FloatingActionDock
