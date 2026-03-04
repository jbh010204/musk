import { useMemo, useState } from 'react'
import { slotDurationMinutes } from '../../utils/timeSlot'

function CompletionModal({ timeBox, onClose, onUpdate, onDelete }) {
  const [content, setContent] = useState(timeBox.content)
  const [status, setStatus] = useState(
    timeBox.status === 'COMPLETED' || timeBox.status === 'SKIPPED' ? timeBox.status : null,
  )
  const [actualMinutes, setActualMinutes] = useState(
    timeBox.actualMinutes != null ? String(timeBox.actualMinutes) : '',
  )

  const plannedMinutes = slotDurationMinutes(timeBox.startSlot, timeBox.endSlot)

  const diffSummary = useMemo(() => {
    const actual = Number(actualMinutes)

    if (status !== 'COMPLETED' || !Number.isFinite(actual) || actual <= 0) {
      return null
    }

    const diff = actual - plannedMinutes
    const sign = diff > 0 ? '+' : ''

    return {
      text: `계획 ${plannedMinutes}분 → 실제 ${actual}분 (${sign}${diff}분)`,
      className: diff > 0 ? 'text-orange-300' : diff < 0 ? 'text-green-300' : 'text-gray-300',
    }
  }, [actualMinutes, plannedMinutes, status])

  const handleSave = () => {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return
    }

    const selectedStatus = status ?? timeBox.status

    if (selectedStatus === 'SKIPPED') {
      onUpdate(timeBox.id, {
        content: trimmedContent,
        status: 'SKIPPED',
        actualMinutes: null,
      })
      onClose()
      return
    }

    if (selectedStatus === 'COMPLETED') {
      const actual = Number(actualMinutes)
      if (!Number.isFinite(actual) || actual <= 0) {
        return
      }

      onUpdate(timeBox.id, {
        content: trimmedContent,
        status: 'COMPLETED',
        actualMinutes: actual,
      })
      onClose()
      return
    }

    onUpdate(timeBox.id, { content: trimmedContent })
    onClose()
  }

  const handleDelete = () => {
    const confirmed = window.confirm('이 일정을 삭제할까요?')
    if (!confirmed) {
      return
    }

    onDelete(timeBox.id)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">완료 처리</h3>
        <div className="mt-3">
          <label className="mb-1 block text-sm text-gray-300" htmlFor="timebox-content">
            일정 이름
          </label>
          <input
            id="timebox-content"
            type="text"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full rounded bg-gray-700 p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="mt-2 text-sm text-gray-400">계획: {plannedMinutes}분</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setStatus('COMPLETED')}
            className={`rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              status === 'COMPLETED' ? 'bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            완료 ✓
          </button>
          <button
            type="button"
            onClick={() => setStatus('SKIPPED')}
            className={`rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              status === 'SKIPPED' ? 'bg-amber-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            건너뜀 ✗
          </button>
        </div>

        {status === 'COMPLETED' ? (
          <div className="mt-4 space-y-2">
            <label className="block text-sm text-gray-300" htmlFor="actual-minutes">
              실제 소요 시간(분)
            </label>
            <input
              id="actual-minutes"
              type="number"
              min="1"
              value={actualMinutes}
              onChange={(event) => setActualMinutes(event.target.value)}
              className="w-full rounded bg-gray-700 p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {diffSummary ? <p className={`text-sm ${diffSummary.className}`}>{diffSummary.text}</p> : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded bg-red-700 px-3 py-2 text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            삭제
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompletionModal
