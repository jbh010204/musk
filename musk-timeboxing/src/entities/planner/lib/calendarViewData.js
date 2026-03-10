import { getCategoryColor, getCategoryLabel } from './categoryVisual'
import { loadDay } from './storage'
import { slotDurationMinutes } from './timeSlot'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const parseDate = (dateStr) => new Date(`${dateStr}T00:00:00`)

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfWeekMonday = (date) => {
  const next = new Date(date)
  const day = next.getDay()
  const offset = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + offset)
  return next
}

const getSnapshotDayData = (dateStr, currentDate, currentDayData) =>
  dateStr === currentDate ? currentDayData : loadDay(dateStr)

const createCategoryMap = (categories = []) =>
  new Map(
    categories.map((category) => [category.id, category]),
  )

const getHeatLevel = (total, completed) => {
  if (total <= 0) {
    return 0
  }

  const densityRatio = Math.min(1, total / 6)
  const completionRatio = completed / total
  const weightedScore = densityRatio * 0.55 + completionRatio * 0.45

  if (weightedScore >= 0.76) {
    return 4
  }

  if (weightedScore >= 0.52) {
    return 3
  }

  if (weightedScore >= 0.28) {
    return 2
  }

  return 1
}

const summarizeCalendarDay = (
  dateStr,
  currentDate,
  currentDayData,
  currentMonthIndex = null,
  categoryMap = new Map(),
) => {
  const date = parseDate(dateStr)
  const dayData = getSnapshotDayData(dateStr, currentDate, currentDayData)
  const timeBoxes = Array.isArray(dayData?.timeBoxes) ? [...dayData.timeBoxes] : []
  const sortedBoxes = timeBoxes.sort((a, b) => a.startSlot - b.startSlot)
  const total = sortedBoxes.length
  const completed = sortedBoxes.filter((box) => box.status === 'COMPLETED').length
  const plannedMinutes = sortedBoxes.reduce(
    (acc, box) => acc + slotDurationMinutes(box.startSlot, box.endSlot),
    0,
  )
  const categoryCounter = new Map()

  sortedBoxes.forEach((box) => {
    const meta = box.categoryId ? categoryMap.get(box.categoryId) : null
    const label = getCategoryLabel(meta, box)

    if (!label) {
      return
    }

    const key = meta?.id || `legacy:${label.toLowerCase()}`
    const entry = categoryCounter.get(key) || {
      key,
      label,
      color: getCategoryColor(meta, box),
      count: 0,
      completed: 0,
      plannedMinutes: 0,
    }

    entry.count += 1
    entry.plannedMinutes += slotDurationMinutes(box.startSlot, box.endSlot)
    if (box.status === 'COMPLETED') {
      entry.completed += 1
    }

    categoryCounter.set(key, entry)
  })

  const categoryMix = [...categoryCounter.values()]
    .sort((left, right) => {
      const byCount = right.count - left.count
      if (byCount !== 0) {
        return byCount
      }

      const byMinutes = right.plannedMinutes - left.plannedMinutes
      if (byMinutes !== 0) {
        return byMinutes
      }

      return left.label.localeCompare(right.label, 'ko')
    })
    .map((entry) => ({
      ...entry,
      share: total > 0 ? Math.round((entry.count / total) * 100) : 0,
      completionRate: entry.count > 0 ? Math.round((entry.completed / entry.count) * 100) : 0,
    }))
  const dominantCategory = categoryMix[0] || null
  const heatLevel = getHeatLevel(total, completed)

  return {
    dateStr,
    dayLabel: WEEKDAY_LABELS[date.getDay()],
    dayNumber: date.getDate(),
    total,
    completed,
    plannedMinutes,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    heatLevel,
    dominantCategory: dominantCategory
      ? {
          key: dominantCategory.key,
          label: dominantCategory.label,
          color: dominantCategory.color,
          count: dominantCategory.count,
        }
      : null,
    categoryMix: categoryMix.slice(0, 3),
    previewItems: sortedBoxes.slice(0, 4).map((box) => ({
      id: box.id,
      content: box.content,
      startSlot: box.startSlot,
      status: box.status,
    })),
    detailItems: sortedBoxes.map((box) => {
      const meta = box.categoryId ? categoryMap.get(box.categoryId) : null
      const label = getCategoryLabel(meta, box)

      return {
        id: box.id,
        content: box.content,
        startSlot: box.startSlot,
        endSlot: box.endSlot,
        status: box.status,
        plannedMinutes: slotDurationMinutes(box.startSlot, box.endSlot),
        actualMinutes: Number.isFinite(box.actualMinutes) ? Number(box.actualMinutes) : null,
        skipReason: typeof box.skipReason === 'string' ? box.skipReason.trim() : '',
        categoryLabel: label,
        categoryColor: label ? getCategoryColor(meta, box) : null,
      }
    }),
    isCurrent: dateStr === currentDate,
    inCurrentMonth: currentMonthIndex == null ? true : date.getMonth() === currentMonthIndex,
  }
}

export const buildWeekCalendarSnapshot = ({ currentDate, currentDayData }) => {
  const startDate = startOfWeekMonday(parseDate(currentDate))
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)

  return {
    rangeLabel: `${startDate.getMonth() + 1}.${String(startDate.getDate()).padStart(2, '0')} - ${
      endDate.getMonth() + 1
    }.${String(endDate.getDate()).padStart(2, '0')}`,
    days: Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      return summarizeCalendarDay(formatDate(date), currentDate, currentDayData)
    }),
  }
}

export const buildMonthCalendarSnapshot = ({ currentDate, currentDayData, categories = [] }) => {
  const targetDate = parseDate(currentDate)
  const currentMonthIndex = targetDate.getMonth()
  const firstDay = new Date(targetDate.getFullYear(), currentMonthIndex, 1)
  const gridStart = startOfWeekMonday(firstDay)
  const monthLabel = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(firstDay)
  const categoryMap = createCategoryMap(categories)
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return summarizeCalendarDay(
      formatDate(date),
      currentDate,
      currentDayData,
      currentMonthIndex,
      categoryMap,
    )
  })
  const currentMonthCells = cells.filter((cell) => cell.inCurrentMonth)
  const legendCounter = new Map()

  currentMonthCells.forEach((cell) => {
    cell.categoryMix.forEach((category) => {
      const entry = legendCounter.get(category.key) || {
        key: category.key,
        label: category.label,
        color: category.color,
        count: 0,
      }

      entry.count += category.count
      legendCounter.set(category.key, entry)
    })
  })

  const legend = [...legendCounter.values()]
    .sort((left, right) => {
      const byCount = right.count - left.count
      if (byCount !== 0) {
        return byCount
      }

      return left.label.localeCompare(right.label, 'ko')
    })
    .slice(0, 5)

  const scheduledDays = currentMonthCells.filter((cell) => cell.total > 0).length
  const completionBase = currentMonthCells.filter((cell) => cell.total > 0)
  const averageCompletionRate =
    completionBase.length > 0
      ? Math.round(
          completionBase.reduce((acc, cell) => acc + cell.completionRate, 0) / completionBase.length,
        )
      : 0
  const busiestDay =
    [...currentMonthCells]
      .sort((left, right) => {
        const byTotal = right.total - left.total
        if (byTotal !== 0) {
          return byTotal
        }

        return right.plannedMinutes - left.plannedMinutes
      })[0] || null

  return {
    monthLabel,
    cells,
    legend,
    scheduledDays,
    averageCompletionRate,
    busiestDay:
      busiestDay && busiestDay.total > 0
        ? {
            dateStr: busiestDay.dateStr,
            dayNumber: busiestDay.dayNumber,
            total: busiestDay.total,
          }
        : null,
  }
}
