import type { BigThreeItem } from '../../../entities/planner'
import BigThreeSlot from './BigThreeSlot'

interface BigThreeProps {
  bigThree: BigThreeItem[]
  addBigThreeItem: (content: string) => boolean
  removeBigThreeItem: (id: string) => void
}

function BigThree({ bigThree, addBigThreeItem, removeBigThreeItem }: BigThreeProps) {
  return (
    <section className="space-y-5 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        🎯 오늘의 빅 3
      </h2>

      <div className="space-y-3">
        {[0, 1, 2].map((slotIndex) => (
          <BigThreeSlot
            key={slotIndex}
            slot={bigThree[slotIndex] ?? null}
            slotIndex={slotIndex}
            onAdd={addBigThreeItem}
            onRemove={removeBigThreeItem}
          />
        ))}
      </div>
    </section>
  )
}

export default BigThree
