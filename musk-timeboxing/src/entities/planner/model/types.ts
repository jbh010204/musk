export interface TaskCard {
  id: string
  title: string
  categoryId?: string | null
  linkedTimeBoxIds?: string[] | null
}

export interface BigThreeItem {
  id: string
  content: string
  taskId?: string | null
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
  statuses: Array<'EMPTY' | 'DONE' | 'PENDING'>
  completedCount: number
  filledCount: number
  isPerfect: boolean
}
