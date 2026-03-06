import BrainDumpInput from './BrainDumpInput'
import BrainDumpList from './BrainDumpList'

function BrainDump({
  items,
  bigThreeCount = 0,
  onAdd,
  onRemove,
  onSendToBigThree,
  onFillBigThree = () => {},
}) {
  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          🧠 브레인 덤프
        </h2>
        <button
          type="button"
          onClick={onFillBigThree}
          className="rounded-xl px-2 py-1 text-xs text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="브레인 덤프에서 빅3 자동 채우기"
          data-testid="brain-dump-fill-big3"
          disabled={bigThreeCount >= 3 || items.length === 0}
        >
          빅3 자동채우기
        </button>
      </div>
      <BrainDumpInput onAdd={onAdd} />
      <BrainDumpList items={items} onRemove={onRemove} onSendToBigThree={onSendToBigThree} />
    </section>
  )
}

export default BrainDump
