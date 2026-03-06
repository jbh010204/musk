import BrainDumpInput from './BrainDumpInput'
import BrainDumpList from './BrainDumpList'

function BrainDump({ items, onAdd, onRemove, onSendToBigThree }) {
  return (
    <section className="space-y-6 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        🧠 브레인 덤프
      </h2>
      <BrainDumpInput onAdd={onAdd} />
      <BrainDumpList items={items} onRemove={onRemove} onSendToBigThree={onSendToBigThree} />
    </section>
  )
}

export default BrainDump
