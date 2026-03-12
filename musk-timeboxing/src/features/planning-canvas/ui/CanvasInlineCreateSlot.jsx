import { useState } from 'react'

const DURATION_OPTIONS = [
  { slots: 1, label: '30분' },
  { slots: 2, label: '60분' },
  { slots: 3, label: '90분' },
]

function CanvasInlineCreateSlot({
  testId,
  title,
  placeholder,
  color = '#94a3b8',
  defaultEstimatedSlots = 1,
  onCreate = () => false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [estimatedSlots, setEstimatedSlots] = useState(defaultEstimatedSlots)
  const [isComposing, setIsComposing] = useState(false)

  const reset = () => {
    setDraft('')
    setEstimatedSlots(defaultEstimatedSlots)
    setIsEditing(false)
  }

  const handleSubmit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      reset()
      return
    }

    const created = onCreate({
      content: trimmed,
      estimatedSlots,
    })

    if (created) {
      reset()
    }
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        data-testid={testId}
        onClick={() => setIsEditing(true)}
        className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-300/80 bg-white/55 px-4 py-3 text-left transition-all hover:border-slate-400 hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/40 dark:hover:border-slate-500 dark:hover:bg-slate-900/70"
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium text-white shadow-sm"
            style={{ background: `linear-gradient(180deg, ${color}cc 0%, ${color}99 100%)` }}
          >
            +
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{placeholder}</p>
          </div>
        </div>
        <span className="rounded-xl bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-500 transition-colors group-hover:bg-slate-200 dark:bg-slate-800/70 dark:text-slate-300">
          30분
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-indigo-300/80 bg-white px-4 py-3 shadow-sm dark:border-indigo-400/40 dark:bg-slate-900/85">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/70">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.slots}
              type="button"
              className={`rounded-lg px-2 py-1 text-[11px] transition-colors ${
                estimatedSlots === option.slots
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
              onClick={() => setEstimatedSlots(option.slots)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <input
        autoFocus
        type="text"
        value={draft}
        data-testid={`${testId}-input`}
        onChange={(event) => setDraft(event.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(event) => {
          const nativeComposing = event.nativeEvent?.isComposing || event.keyCode === 229
          if (isComposing || nativeComposing) {
            return
          }

          if (event.key === 'Enter') {
            event.preventDefault()
            handleSubmit()
          }

          if (event.key === 'Escape') {
            reset()
          }
        }}
        onBlur={() => {
          if (!draft.trim()) {
            reset()
          }
        }}
        className="ui-input mt-3"
        placeholder={placeholder}
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          onClick={reset}
        >
          취소
        </button>
        <button
          type="button"
          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleSubmit}
        >
          추가
        </button>
      </div>
    </div>
  )
}

export default CanvasInlineCreateSlot
