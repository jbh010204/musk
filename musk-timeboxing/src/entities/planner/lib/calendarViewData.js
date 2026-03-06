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

const summarizeCalendarDay = (dateStr, currentDate, currentDayData, currentMonthIndex = null) => {
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

  return {
    dateStr,
    dayLabel: WEEKDAY_LABELS[date.getDay()],
    dayNumber: date.getDate(),
    total,
    completed,
    plannedMinutes,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    previewItems: sortedBoxes.slice(0, 4).map((box) => ({
      id: box.id,
      content: box.content,
      startSlot: box.startSlot,
      status: box.status,
    })),
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

export const buildMonthCalendarSnapshot = ({ currentDate, currentDayData }) => {
  const targetDate = parseDate(currentDate)
  const currentMonthIndex = targetDate.getMonth()
  const firstDay = new Date(targetDate.getFullYear(), currentMonthIndex, 1)
  const gridStart = startOfWeekMonday(firstDay)
  const monthLabel = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(firstDay)

  return {
    monthLabel,
    cells: Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + index)
      return summarizeCalendarDay(
        formatDate(date),
        currentDate,
        currentDayData,
        currentMonthIndex,
      )
    }),
  }
}
