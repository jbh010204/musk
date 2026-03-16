interface CanvasSelectionBarProps {
  selectedCount?: number
  onMovePrev?: () => void
  onMoveNext?: () => void
  onSendToBigThree?: () => void
  onSchedule?: () => void
  onClear?: () => void
}

function CanvasSelectionBar({
  selectedCount = 0,
  onMovePrev = () => {},
  onMoveNext = () => {},
  onSendToBigThree = () => {},
  onSchedule = () => {},
  onClear = () => {},
}: CanvasSelectionBarProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      data-testid="planning-canvas-selection-bar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-full bg-white/88 px-3 py-2 shadow-sm ring-1 ring-inset ring-indigo-400/20 dark:bg-slate-950/80"
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {selectedCount}개 선택
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          onClick={onMovePrev}
        >
          ←
        </button>
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          onClick={onMoveNext}
        >
          →
        </button>
        <button
          type="button"
          className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
          onClick={onSendToBigThree}
        >
          Big3
        </button>
        <button
          type="button"
          className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
          onClick={onSchedule}
        >
          첫 빈 슬롯
        </button>
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          onClick={onClear}
        >
          선택 해제
        </button>
      </div>
    </div>
  )
}

export default CanvasSelectionBar
