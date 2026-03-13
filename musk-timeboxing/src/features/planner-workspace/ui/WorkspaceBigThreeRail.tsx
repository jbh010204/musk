import { useMemo, useState } from 'react'
import type { BigThreeItem, TaskCard } from '../../../entities/planner/model/types'
import { Button } from '../../../shared/ui'

interface WorkspaceBigThreeRailProps {
  bigThree?: BigThreeItem[]
  taskCards?: TaskCard[]
  selectedCardIds?: string[]
  selectedCardId?: string | null
  selectedBigThreeId?: string | null
  onAddBigThreeItem?: (content: string) => boolean
  onRemoveBigThreeItem?: (slotId: string) => void
  onSelectBigThree?: (slot: BigThreeItem | null) => void
  onSendSelectedCardsToBigThree?: (cardIds: string[]) => number
}

function WorkspaceBigThreeRail({
  bigThree = [],
  taskCards = [],
  selectedCardIds = [],
  selectedCardId = null,
  selectedBigThreeId = null,
  onAddBigThreeItem = () => false,
  onRemoveBigThreeItem = () => {},
  onSelectBigThree = () => {},
  onSendSelectedCardsToBigThree = () => 0,
}: WorkspaceBigThreeRailProps) {
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const sourceCardMap = useMemo(
    () => new Map(taskCards.map((item) => [item.id, item])),
    [taskCards],
  )
  const remainingSlots = Math.max(0, 3 - bigThree.length)

  const handleSubmit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setEditingSlotIndex(null)
      setDraft('')
      return
    }

    const inserted = onAddBigThreeItem(trimmed)
    if (inserted) {
      setEditingSlotIndex(null)
      setDraft('')
    }
  }

  return (
    <section
      data-testid="workspace-bigthree-rail"
      className="border-b border-slate-200/80 bg-white/80 px-5 py-4 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/70"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Focus
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">오늘의 Big3</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800/80 dark:text-slate-300">
            {bigThree.length}/3
          </span>
        </div>

        <Button
          data-testid="workspace-bigthree-add-selected"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          disabled={selectedCardIds.length === 0 || remainingSlots === 0}
          onClick={() => onSendSelectedCardsToBigThree(selectedCardIds)}
        >
          {selectedCardIds.length > 1
            ? `선택 ${Math.min(selectedCardIds.length, remainingSlots)}개 → Big3`
            : '선택 카드 → Big3'}
        </Button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((slotIndex) => {
          const slot = bigThree[slotIndex] ?? null
          const sourceCard = slot?.taskId ? sourceCardMap.get(slot.taskId) || null : null
          const isSelected =
            selectedBigThreeId === slot?.id ||
            Boolean(sourceCard && selectedCardId === sourceCard.id)

          if (!slot) {
            if (editingSlotIndex === slotIndex) {
              return (
                <div
                  key={slotIndex}
                  className="rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/90 p-3 dark:border-white/20 dark:bg-slate-900/40"
                >
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    슬롯 {slotIndex + 1}
                  </p>
                  <input
                    autoFocus
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(event) => {
                      const nativeComposing =
                        'isComposing' in event.nativeEvent
                          ? event.nativeEvent.isComposing
                          : event.keyCode === 229

                      if (isComposing || nativeComposing) {
                        return
                      }

                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleSubmit()
                      }

                      if (event.key === 'Escape') {
                        setEditingSlotIndex(null)
                        setDraft('')
                      }
                    }}
                    onBlur={() => {
                      setEditingSlotIndex(null)
                      setDraft('')
                    }}
                    className="ui-input text-sm"
                    placeholder="핵심 할 일을 입력"
                  />
                </div>
              )
            }

            return (
              <button
                key={slotIndex}
                type="button"
                data-testid={`workspace-bigthree-slot-${slotIndex}`}
                onClick={() => {
                  setEditingSlotIndex(slotIndex)
                  setDraft('')
                }}
                className="flex min-h-[88px] w-full flex-col rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/90 p-3 text-left transition-all hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/20 dark:bg-slate-900/40 dark:hover:bg-slate-900"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  슬롯 {slotIndex + 1}
                </span>
                <span className="mt-2 text-sm text-slate-400 dark:text-slate-500">핵심 추가</span>
              </button>
            )
          }

          return (
            <div
              key={slot.id}
              data-testid={`workspace-bigthree-slot-${slotIndex}`}
              className={`min-h-[88px] rounded-2xl border p-3 transition-all ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-sm'
                  : 'border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectBigThree(slot)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    슬롯 {slotIndex + 1}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                    {slot.content}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {sourceCard ? (
                      <>
                        <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 font-medium text-indigo-700 dark:text-indigo-300">
                          {sourceCard.estimateSlots * 30}분
                        </span>
                        <span>예정 {sourceCard.linkedTimeBoxIds?.length || 0}</span>
                      </>
                    ) : (
                      <span className="rounded-full bg-slate-200/70 px-2 py-0.5 dark:bg-slate-800/70">
                        직접 입력
                      </span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  aria-label="빅3 삭제"
                  className="rounded-full px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  onClick={() => onRemoveBigThreeItem(slot.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default WorkspaceBigThreeRail
