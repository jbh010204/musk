function CanvasSelectionBar({
  selectedCount = 0,
  onMovePrev = () => {},
  onMoveNext = () => {},
  onSendToBigThree = () => {},
  onSchedule = () => {},
  onClear = () => {},
}) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      data-testid="planning-canvas-selection-bar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-500/10 px-4 py-3 ring-1 ring-inset ring-indigo-400/30 dark:bg-indigo-400/10"
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
          {selectedCount}개 선택
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          onClick={onMovePrev}
        >
          이전 도크
        </button>
        <button
          type="button"
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          onClick={onMoveNext}
        >
          다음 도크
        </button>
        <button
          type="button"
          className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
          onClick={onSendToBigThree}
        >
          Big3
        </button>
        <button
          type="button"
          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
          onClick={onSchedule}
        >
          첫 빈 슬롯
        </button>
        <button
          type="button"
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          onClick={onClear}
        >
          선택 해제
        </button>
      </div>
    </div>
  )
}

export default CanvasSelectionBar
