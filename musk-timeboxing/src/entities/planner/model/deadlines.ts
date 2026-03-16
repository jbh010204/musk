import type { DeadlinePriority, DeadlineRecord } from './types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const PRIORITY_WEIGHT: Record<DeadlinePriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}

interface DeadlineInput {
  id?: unknown
  title?: unknown
  dueDate?: unknown
  taskId?: unknown
  taskDate?: unknown
  priority?: unknown
  note?: unknown
  completedAt?: unknown
}

interface UpsertDeadlineInput {
  taskId: string | null
  taskDate: string | null
  title: string
  dueDate: string
  priority?: DeadlinePriority | null
  note?: string | null
}

export interface DeadlineUrgency {
  kind: 'DONE' | 'OVERDUE' | 'TODAY' | 'UPCOMING'
  daysUntil: number | null
  label: string
}

export interface DeadlineStripItem extends DeadlineRecord {
  urgency: DeadlineUrgency
}

const createId = (): string => crypto.randomUUID()

const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && DATE_PATTERN.test(value)

const parseDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`)

const diffDays = (fromDateStr: string, toDateStr: string): number => {
  const from = parseDate(fromDateStr)
  const to = parseDate(toDateStr)
  const oneDayMs = 24 * 60 * 60 * 1000
  return Math.round((to.getTime() - from.getTime()) / oneDayMs)
}

export const normalizeDeadlinePriority = (value: unknown): DeadlinePriority =>
  value === 'LOW' || value === 'HIGH' ? value : 'MEDIUM'

export const normalizeDeadlineRecord = (
  deadline: DeadlineInput | DeadlineRecord | null | undefined,
): DeadlineRecord | null => {
  const title = typeof deadline?.title === 'string' ? deadline.title.trim() : ''
  const dueDate = typeof deadline?.dueDate === 'string' ? deadline.dueDate.trim() : ''

  if (!title || !isDateString(dueDate)) {
    return null
  }

  const completedAt =
    typeof deadline?.completedAt === 'string' && deadline.completedAt.trim().length > 0
      ? deadline.completedAt
      : null

  return {
    id: typeof deadline?.id === 'string' ? deadline.id : createId(),
    title,
    dueDate,
    taskId: typeof deadline?.taskId === 'string' && deadline.taskId.trim().length > 0 ? deadline.taskId : null,
    taskDate: isDateString(deadline?.taskDate) ? deadline.taskDate : null,
    priority: normalizeDeadlinePriority(deadline?.priority),
    note: typeof deadline?.note === 'string' ? deadline.note.trim() : '',
    completedAt,
  }
}

export const sortDeadlines = (deadlines: DeadlineRecord[] = [], currentDate: string): DeadlineRecord[] =>
  [...deadlines].sort((left, right) => {
    const leftUrgency = getDeadlineUrgency(left, currentDate)
    const rightUrgency = getDeadlineUrgency(right, currentDate)

    const leftCompleted = leftUrgency.kind === 'DONE'
    const rightCompleted = rightUrgency.kind === 'DONE'
    if (leftCompleted !== rightCompleted) {
      return leftCompleted ? 1 : -1
    }

    if (leftUrgency.daysUntil !== rightUrgency.daysUntil) {
      return (leftUrgency.daysUntil ?? Number.MAX_SAFE_INTEGER) - (rightUrgency.daysUntil ?? Number.MAX_SAFE_INTEGER)
    }

    const byPriority = PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority]
    if (byPriority !== 0) {
      return byPriority
    }

    return left.title.localeCompare(right.title, 'ko')
  })

export const getDeadlineUrgency = (
  deadline: DeadlineRecord,
  currentDate: string,
): DeadlineUrgency => {
  if (deadline.completedAt) {
    return {
      kind: 'DONE',
      daysUntil: null,
      label: '완료',
    }
  }

  const daysUntil = diffDays(currentDate, deadline.dueDate)
  if (daysUntil < 0) {
    return {
      kind: 'OVERDUE',
      daysUntil,
      label: `${Math.abs(daysUntil)}일 지남`,
    }
  }

  if (daysUntil === 0) {
    return {
      kind: 'TODAY',
      daysUntil,
      label: '오늘 마감',
    }
  }

  return {
    kind: 'UPCOMING',
    daysUntil,
    label: `D-${daysUntil}`,
  }
}

export const getActiveDeadlineForTask = (
  deadlines: DeadlineRecord[] = [],
  taskId: string | null,
  taskDate: string | null,
): DeadlineRecord | null => {
  if (!taskId) {
    return null
  }

  return (
    deadlines.find(
      (deadline) =>
        deadline.taskId === taskId &&
        deadline.taskDate === taskDate &&
        deadline.completedAt == null,
    ) || null
  )
}

export const upsertDeadlineForTask = (
  deadlines: DeadlineRecord[] = [],
  input: UpsertDeadlineInput,
): DeadlineRecord[] => {
  if (!input.taskId || !isDateString(input.dueDate)) {
    return deadlines
  }

  const normalized = normalizeDeadlineRecord({
    id: getActiveDeadlineForTask(deadlines, input.taskId, input.taskDate)?.id,
    title: input.title,
    dueDate: input.dueDate,
    taskId: input.taskId,
    taskDate: input.taskDate,
    priority: input.priority ?? 'MEDIUM',
    note: input.note ?? '',
    completedAt: null,
  })

  if (!normalized) {
    return deadlines
  }

  const existing = getActiveDeadlineForTask(deadlines, input.taskId, input.taskDate)
  if (!existing) {
    return [...deadlines, normalized]
  }

  return deadlines.map((deadline) => (deadline.id === existing.id ? normalized : deadline))
}

export const removeDeadlineRecord = (deadlines: DeadlineRecord[] = [], deadlineId: string): DeadlineRecord[] =>
  deadlines.filter((deadline) => deadline.id !== deadlineId)

export const removeDeadlineForTask = (
  deadlines: DeadlineRecord[] = [],
  taskId: string | null,
  taskDate: string | null,
): DeadlineRecord[] => {
  if (!taskId) {
    return deadlines
  }

  return deadlines.filter(
    (deadline) => !(deadline.taskId === taskId && deadline.taskDate === taskDate && deadline.completedAt == null),
  )
}

export const completeDeadlineRecord = (
  deadlines: DeadlineRecord[] = [],
  deadlineId: string,
  completedAt: string | null = new Date().toISOString(),
): DeadlineRecord[] =>
  deadlines.map((deadline) =>
    deadline.id === deadlineId
      ? {
          ...deadline,
          completedAt,
        }
      : deadline,
  )

export const clearDeadlineTaskLink = (
  deadlines: DeadlineRecord[] = [],
  taskId: string | null,
  taskDate: string | null,
): DeadlineRecord[] =>
  deadlines.map((deadline) =>
    deadline.taskId === taskId && deadline.taskDate === taskDate
      ? {
          ...deadline,
          taskId: null,
          taskDate: null,
        }
      : deadline,
  )

export const selectDeadlineStripItems = (
  deadlines: DeadlineRecord[] = [],
  options: {
    currentDate: string
    rangeStartDate: string
    rangeEndDate: string
    limit?: number
  },
): DeadlineStripItem[] => {
  const { currentDate, rangeStartDate, rangeEndDate, limit = 5 } = options

  return sortDeadlines(deadlines, currentDate)
    .filter((deadline) => {
      if (deadline.completedAt) {
        return false
      }

      return deadline.dueDate <= rangeEndDate && (deadline.dueDate >= rangeStartDate || deadline.dueDate < rangeStartDate)
    })
    .slice(0, limit)
    .map((deadline) => ({
      ...deadline,
      urgency: getDeadlineUrgency(deadline, currentDate),
    }))
}
