import BrainDumpItem from './BrainDumpItem'

function BrainDumpList({ items, onRemove, onCyclePriority, onSendToBigThree }) {
  if (items.length === 0) {
    return <p className="py-4 text-sm text-slate-500 dark:text-slate-400">브레인 덤프가 비어있습니다</p>
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <BrainDumpItem
          key={item.id}
          item={item}
          onRemove={onRemove}
          onCyclePriority={onCyclePriority}
          onSendToBigThree={onSendToBigThree}
        />
      ))}
    </div>
  )
}

export default BrainDumpList
