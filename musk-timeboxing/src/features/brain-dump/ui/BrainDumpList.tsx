import type { TaskCard } from '../../../entities/planner'
import BrainDumpItem from './BrainDumpItem'

interface BrainDumpListProps {
  items: TaskCard[]
  onRemove: (id: string) => void
  onCyclePriority: (id: string) => void
  onSendToBigThree: (id: string) => void
}

function BrainDumpList({ items, onRemove, onCyclePriority, onSendToBigThree }: BrainDumpListProps) {
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
