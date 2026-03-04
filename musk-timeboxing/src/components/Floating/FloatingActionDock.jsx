import { useState } from 'react'

const ACTIONS = [
  {
    id: 'category',
    label: '카테고리 관리',
    color: '#4f46e5',
  },
  {
    id: 'data',
    label: '데이터 백업 복원',
    color: '#0284c7',
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
          className="fixed inset-0 z-30 cursor-default bg-black/0"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="fixed right-4 z-40 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-end gap-2">
          {open
            ? ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  aria-label={action.label}
                  onClick={() => handleAction(action.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-100 shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: action.color }}
                  />
                  {action.label}
                </button>
              ))
            : null}

          <button
            type="button"
            aria-label="빠른 메뉴"
            onClick={() => setOpen((prev) => !prev)}
            className="h-14 w-14 rounded-full bg-indigo-600 text-2xl font-semibold text-white shadow-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {open ? '×' : '+'}
          </button>
        </div>
      </div>
    </>
  )
}

export default FloatingActionDock
