import { useMemo } from 'react'
import { getCategoryLabel } from '../../utils/categoryVisual'
import { slotDurationMinutes } from '../../utils/timeSlot'

function DailyRecapCard({ timeBoxes, categoryMap }) {
  const recap = useMemo(() => {
    const total = timeBoxes.length
    const completed = timeBoxes.filter((box) => box.status === 'COMPLETED').length
    const skipped = timeBoxes.filter((box) => box.status === 'SKIPPED').length
    const planned = timeBoxes.filter((box) => box.status === 'PLANNED').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const completedBoxes = timeBoxes.filter(
      (box) => box.status === 'COMPLETED' && Number.isFinite(box.actualMinutes) && box.actualMinutes > 0,
    )
    const completedPlannedMinutes = completedBoxes.reduce(
      (acc, box) => acc + slotDurationMinutes(box.startSlot, box.endSlot),
      0,
    )
    const completedActualMinutes = completedBoxes.reduce((acc, box) => acc + Number(box.actualMinutes), 0)
    const diff = completedActualMinutes - completedPlannedMinutes
    const diffText = `${diff > 0 ? '+' : ''}${diff}분`
    const diffTone = diff > 0 ? 'text-orange-300' : diff < 0 ? 'text-green-300' : 'text-gray-300'

    const categoryCounter = new Map()
    timeBoxes.forEach((box) => {
      const label = getCategoryLabel(box.categoryId ? categoryMap.get(box.categoryId) : null, box)
      if (!label) {
        return
      }

      const count = categoryCounter.get(label) || 0
      categoryCounter.set(label, count + 1)
    })

    const focusCategory =
      [...categoryCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '미분류'

    const skipReasonCounter = new Map()
    timeBoxes.forEach((box) => {
      if (box.status !== 'SKIPPED' || typeof box.skipReason !== 'string' || box.skipReason.trim() === '') {
        return
      }

      const count = skipReasonCounter.get(box.skipReason) || 0
      skipReasonCounter.set(box.skipReason, count + 1)
    })
    const topSkipReason = [...skipReasonCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      total,
      completed,
      skipped,
      planned,
      completionRate,
      completedPlannedMinutes,
      completedActualMinutes,
      diffText,
      diffTone,
      focusCategory,
      topSkipReason,
    }
  }, [categoryMap, timeBoxes])

  return (
    <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/70 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">오늘 리캡</h3>

      {recap.total === 0 ? (
        <p className="mt-2 text-sm text-gray-400">아직 등록된 일정이 없습니다.</p>
      ) : (
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
          <p className="text-gray-200">
            총 일정 <span className="font-semibold text-white">{recap.total}</span>개
          </p>
          <p className="text-gray-200">
            완료율 <span className="font-semibold text-white">{recap.completionRate}%</span>
          </p>
          <p className="text-gray-200">
            완료 {recap.completed} · 예정 {recap.planned} · 건너뜀 {recap.skipped}
          </p>
          <p className="text-gray-200">
            집중 카테고리 <span className="font-semibold text-white">#{recap.focusCategory}</span>
          </p>
          <p className="text-gray-200">
            주요 스킵 사유{' '}
            <span className="font-semibold text-white">{recap.topSkipReason ?? '없음'}</span>
          </p>
          <p className="text-gray-300 md:col-span-2">
            완료 일정 기준 계획 {recap.completedPlannedMinutes}분 → 실제 {recap.completedActualMinutes}분 (
            <span className={recap.diffTone}>{recap.diffText}</span>)
          </p>
        </div>
      )}
    </div>
  )
}

export default DailyRecapCard
