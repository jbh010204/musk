export type TaskCardPriority = 0 | 1 | 2 | 3 | 4
export type TaskCardOrigin = 'board' | 'list'
export type BigThreeStatus = 'EMPTY' | 'DONE' | 'PENDING'

export interface TaskCard {
  id: string
  title: string
  isDone: boolean
  priority: TaskCardPriority
  categoryId: string | null
  stackOrder: number
  estimateSlots: number
  linkedTimeBoxIds: string[]
  note: string
  origin: TaskCardOrigin
}

export interface BigThreeItem {
  id: string
  content: string
  taskId: string | null
}

export interface TimeBox {
  id: string
  content: string
  status?: string | null
  taskId?: string | null
  startSlot: number
  endSlot: number
  actualMinutes?: number | null
  skipReason?: string | null
  carryOverFromDate?: string | null
  carryOverFromBoxId?: string | null
}

export interface StackCanvasStateRecord {
  [key: string]: unknown
}

export interface PlannerDay {
  taskCards: TaskCard[]
  bigThree: BigThreeItem[]
  timeBoxes: TimeBox[]
  stackCanvasState?: StackCanvasStateRecord
  [key: string]: unknown
}

export interface LastFocusSnapshot {
  date: string
  slot: number
  ts: number
}

export interface BigThreeProgress {
  statuses: BigThreeStatus[]
  completedCount: number
  filledCount: number
  isPerfect: boolean
}
