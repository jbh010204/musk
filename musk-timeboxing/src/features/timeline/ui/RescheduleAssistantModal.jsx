import { slotToTime } from '../../../entities/planner'
import { Button, Card } from '../../../shared/ui'

function RescheduleAssistantModal({ plan, onClose, onApply }) {
  const planned = Array.isArray(plan?.planned) ? plan.planned : []
  const skipped = Array.isArray(plan?.skipped) ? plan.skipped : []

  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div className="ui-modal-card max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">자동 재배치 어시스턴트</h3>
          <Button onClick={onClose}>
            닫기
          </Button>
        </div>

        <p className="mt-2 text-sm text-gray-300">
          {plan?.fromDate} → {plan?.targetDate} 기준 추천 배치
        </p>

        <Card tone="subtle" className="mt-4 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            배치 가능 {planned.length}건 · 배치 실패 {skipped.length}건
          </p>

          {planned.length > 0 ? (
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm">
              {planned.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded border border-gray-700 bg-gray-800/70 px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-gray-100">{item.content}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {slotToTime(item.startSlot)} ~ {slotToTime(item.endSlot)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-400">재배치 가능한 일정이 없습니다.</p>
          )}
        </Card>

        {skipped.length > 0 ? (
          <Card tone="subtle" className="mt-3 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-400">배치 실패</p>
            <p className="mt-1 text-sm text-gray-300">
              빈 슬롯 부족으로 {skipped.length}건은 자동 배치하지 못했습니다.
            </p>
          </Card>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => onApply(plan)}
            disabled={planned.length === 0}
          >
            다음 날에 배치 적용
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RescheduleAssistantModal
