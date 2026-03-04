import BigThreeSlot from './BigThreeSlot'

function BigThree({ bigThree, addBigThreeItem, removeBigThreeItem }) {
  return (
    <section className="space-y-3 border-t border-gray-700 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">🎯 오늘의 빅 3</h2>

      <div className="space-y-2">
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
