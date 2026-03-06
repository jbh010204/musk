import BigThreeSlot from './BigThreeSlot'

function BigThree({ bigThree, addBigThreeItem, removeBigThreeItem }) {
  return (
    <section className="space-y-6 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        🎯 오늘의 빅 3
      </h2>

      <div className="space-y-4">
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
