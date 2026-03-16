import { getCategoryColor, getCategoryLabel } from './categoryVisual'
import { loadDay } from './storage'
import { slotDurationMinutes } from './timeSlot'
import { selectDeadlineStripItems } from '../model'
import type { CategoryRecord, DeadlineRecord, TimeBoxStatus } from '../model/types'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface CalendarTimeBoxLike {
  id: string
  content: string
  startSlot: number
  endSlot: number
  status: TimeBoxStatus
  actualMinutes?: unknown
  category?: string | null
  categoryId?: string | null
  skipReason?: unknown
}

interface CalendarDayData {
  timeBoxes?: CalendarTimeBoxLike[]
}

interface CalendarSummaryArgs {
  currentDate: string
  currentDayData: CalendarDayData | null | undefined
  deadlines?: DeadlineRecord[]
}

interface MonthCalendarArgs extends CalendarSummaryArgs {
  categories?: CategoryRecord[]
}

interface CategoryCounterEntry {
  key: string
  label: string
  color: string
  count: number
  completed: number
  plannedMinutes: number
}

const parseDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`)

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfWeekMonday = (date: Date): Date => {
  const next = new Date(date)
  const day = next.getDay()
  const offset = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + offset)
  return next
}

const getSnapshotDayData = (
  dateStr: string,
  currentDate: string,
  currentDayData: CalendarDayData | null | undefined,
): CalendarDayData | null | undefined =>
  dateStr === currentDate ? currentDayData : loadDay(dateStr)

const createCategoryMap = (categories: CategoryRecord[] = []): Map<string, CategoryRecord> =>
  new Map(categories.map((category) => [category.id, category]))

const summarizePlannerDayTimeBoxes = (dayData: CalendarDayData | null | undefined) => {
  const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []
  const total = timeBoxes.length
  const completed = timeBoxes.filter((box) => box.status === 'COMPLETED').length

  return {
    total,
    completed,
    timeBoxes,
  }
}

const getHeatLevel = (total: number, completed: number): number => {
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
  dateStr: string,
  currentDate: string,
  currentDayData: CalendarDayData | null | undefined,
  currentMonthIndex: number | null = null,
  categoryMap: Map<string, CategoryRecord> = new Map(),
) => {
  const date = parseDate(dateStr)
  const dayData = getSnapshotDayData(dateStr, currentDate, currentDayData)
  const timeBoxes = Array.isArray(dayData?.timeBoxes) ? [...dayData.timeBoxes] : []
  const sortedBoxes = timeBoxes.sort((left, right) => left.startSlot - right.startSlot)
  const total = sortedBoxes.length
  const completed = sortedBoxes.filter((box) => box.status === 'COMPLETED').length
  const plannedMinutes = sortedBoxes.reduce(
    (acc, box) => acc + slotDurationMinutes(box.startSlot, box.endSlot),
    0,
  )
  const categoryCounter = new Map<string, CategoryCounterEntry>()

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

export const buildWeekCalendarSnapshot = ({ currentDate, currentDayData, deadlines = [] }: CalendarSummaryArgs) => {
  const startDate = startOfWeekMonday(parseDate(currentDate))
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  const rangeStartDate = formatDate(startDate)
  const rangeEndDate = formatDate(endDate)

  return {
    rangeLabel: `${startDate.getMonth() + 1}.${String(startDate.getDate()).padStart(2, '0')} - ${
      endDate.getMonth() + 1
    }.${String(endDate.getDate()).padStart(2, '0')}`,
    deadlines: selectDeadlineStripItems(deadlines, {
      currentDate,
      rangeStartDate,
      rangeEndDate,
      limit: 5,
    }),
    days: Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      return summarizeCalendarDay(formatDate(date), currentDate, currentDayData)
    }),
  }
}

export const buildMonthCalendarSnapshot = ({
  currentDate,
  currentDayData,
  categories = [],
  deadlines = [],
}: MonthCalendarArgs) => {
  const targetDate = parseDate(currentDate)
  const currentMonthIndex = targetDate.getMonth()
  const firstDay = new Date(targetDate.getFullYear(), currentMonthIndex, 1)
  const gridStart = startOfWeekMonday(firstDay)
  const lastDay = new Date(targetDate.getFullYear(), currentMonthIndex + 1, 0)
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
  const legendCounter = new Map<string, { key: string; label: string; color: string; count: number }>()

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
          completionBase.reduce((acc, cell) => acc + cell.completionRate, 0) /
            completionBase.length,
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
    deadlines: selectDeadlineStripItems(deadlines, {
      currentDate,
      rangeStartDate: formatDate(firstDay),
      rangeEndDate: formatDate(lastDay),
      limit: 6,
    }),
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

export const buildPlannerWeekStrip = ({ currentDate, currentDayData }: CalendarSummaryArgs) => {
  const startDate = startOfWeekMonday(parseDate(currentDate))
  startDate.setDate(startDate.getDate() - 7)

  return Array.from({ length: 21 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    const dateStr = formatDate(date)
    const dayData = getSnapshotDayData(dateStr, currentDate, currentDayData)
    const summary = summarizePlannerDayTimeBoxes(dayData)

    return {
      dateStr,
      dayLabel: WEEKDAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      total: summary.total,
      completed: summary.completed,
      isCurrent: dateStr === currentDate,
    }
  })
}

export const buildWeeklyReport = ({ currentDate, currentDayData }: CalendarSummaryArgs) => {
  const startDate = startOfWeekMonday(parseDate(currentDate))
  let total = 0
  let completed = 0
  let skipped = 0
  let completedPlannedMinutes = 0
  let completedActualMinutes = 0
  const skipReasonCounter = new Map<string, number>()
  const previousSkipReasonCounter = new Map<string, number>()

  const byDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    const dateStr = formatDate(date)
    const dayData = getSnapshotDayData(dateStr, currentDate, currentDayData)
    const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []
    const dayTotal = timeBoxes.length
    const dayCompleted = timeBoxes.filter((box) => box.status === 'COMPLETED').length
    const daySkipped = timeBoxes.filter((box) => box.status === 'SKIPPED').length

    total += dayTotal
    completed += dayCompleted
    skipped += daySkipped

    timeBoxes.forEach((box) => {
      if (
        box.status === 'COMPLETED' &&
        Number.isFinite(box.actualMinutes) &&
        Number(box.actualMinutes) > 0
      ) {
        completedPlannedMinutes += slotDurationMinutes(box.startSlot, box.endSlot)
        completedActualMinutes += Number(box.actualMinutes)
      }

      if (box.status !== 'SKIPPED') {
        return
      }

      const reason =
        typeof box.skipReason === 'string' && box.skipReason.trim().length > 0
          ? box.skipReason.trim()
          : '기타'
      skipReasonCounter.set(reason, (skipReasonCounter.get(reason) || 0) + 1)
    })

    return {
      dateStr,
      dayLabel: WEEKDAY_LABELS[date.getDay()],
      total: dayTotal,
      completed: dayCompleted,
    }
  })

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const diff = completedActualMinutes - completedPlannedMinutes
  const topSkipReasons = [...skipReasonCounter.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([reason, count]) => ({ reason, count }))

  Array.from({ length: 7 }).forEach((_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() - 7 + index)
    const dayData = loadDay(formatDate(date))
    const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []

    timeBoxes.forEach((box) => {
      if (box.status !== 'SKIPPED') {
        return
      }

      const reason =
        typeof box.skipReason === 'string' && box.skipReason.trim().length > 0
          ? box.skipReason.trim()
          : '기타'
      previousSkipReasonCounter.set(reason, (previousSkipReasonCounter.get(reason) || 0) + 1)
    })
  })

  const skipReasonTrend = [...new Set([...skipReasonCounter.keys(), ...previousSkipReasonCounter.keys()])]
    .map((reason) => {
      const current = skipReasonCounter.get(reason) || 0
      const previous = previousSkipReasonCounter.get(reason) || 0
      return {
        reason,
        current,
        previous,
        delta: current - previous,
      }
    })
    .filter((item) => item.current > 0 || item.previous > 0)
    .sort((left, right) => {
      const byDelta = Math.abs(right.delta) - Math.abs(left.delta)
      if (byDelta !== 0) {
        return byDelta
      }

      const byCurrent = right.current - left.current
      if (byCurrent !== 0) {
        return byCurrent
      }

      return left.reason.localeCompare(right.reason, 'ko')
    })
    .slice(0, 3)

  return {
    total,
    completed,
    skipped,
    completionRate,
    completedPlannedMinutes,
    completedActualMinutes,
    diff,
    byDay,
    topSkipReasons,
    skipReasonTrend,
  }
}

export const buildWeeklyPlanningPreview = ({
  currentDate,
  currentDayData,
}: CalendarSummaryArgs) => {
  const startDate = startOfWeekMonday(parseDate(currentDate))

  return Array.from({ length: 5 }, (_, offset) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + offset)
    const dateStr = formatDate(date)
    const dayData = getSnapshotDayData(dateStr, currentDate, currentDayData)
    const timeBoxes = Array.isArray(dayData?.timeBoxes) ? dayData.timeBoxes : []
    const sorted = [...timeBoxes].sort((left, right) => left.startSlot - right.startSlot)
    const previewItems = sorted.slice(0, 3).map((box) => ({
      id: box.id,
      content: box.content,
      startSlot: box.startSlot,
      status: box.status,
    }))

    return {
      dateStr,
      dayLabel: WEEKDAY_LABELS[date.getDay()],
      dayNumber: date.getDate(),
      total: sorted.length,
      previewItems,
    }
  })
}
