import BrainDumpInput from './BrainDumpInput'
import BrainDumpList from './BrainDumpList'

function BrainDump({
  items,
  bigThreeCount = 0,
  onAdd,
  onRemove,
  onCyclePriority,
  onSendToBigThree,
  onFillBigThree = () => {},
}) {
  return (
    <section className="space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          🧠 브레인 덤프
        </h2>
        <button
          type="button"
          onClick={onFillBigThree}
          className="rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="브레인 덤프 우선순위 기준으로 빅3 추천 채우기"
          data-testid="brain-dump-fill-big3"
          disabled={bigThreeCount >= 3 || items.length === 0}
        >
          빅3 추천채우기
        </button>
      </div>
      <p className="-mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
        배터리로 중요도를 조정하면 빅3 추천채우기와 다음 재진입 때 우선순위가 반영됩니다.
      </p>
      <BrainDumpInput onAdd={onAdd} />
      <BrainDumpList
        items={items}
        onRemove={onRemove}
        onCyclePriority={onCyclePriority}
        onSendToBigThree={onSendToBigThree}
      />
    </section>
  )
}

export default BrainDump
