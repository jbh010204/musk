export type TaskCardPriority = 0 | 1 | 2 | 3 | 4
export type TaskCardOrigin = 'board' | 'list'
export type BigThreeStatus = 'EMPTY' | 'DONE' | 'PENDING'
export type TimeBoxStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED'

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

export interface CategoryRecord {
  id: string
  name: string
  color: string
  parentId: string | null
  order: number
  collapsed: boolean
}

export interface CategoryTreeNode extends CategoryRecord {
  depth: number
  children: CategoryTreeNode[]
}

export interface CategoryViewModel extends CategoryTreeNode {
  childCount: number
  isLeaf: boolean
  pathLabel: string
}

export interface BigThreeItem {
  id: string
  content: string
  taskId: string | null
}

export interface PlannerTemplate {
  id: string
  name: string
  content: string
  durationSlots: number
  categoryId: string | null
}

export interface TimeBox {
  id: string
  content: string
  status: TimeBoxStatus
  taskId: string | null
  startSlot: number
  endSlot: number
  actualMinutes: number | null
  category: string | null
  categoryId: string | null
  skipReason: string | null
  carryOverFromDate: string | null
  carryOverFromBoxId: string | null
  timerStartedAt: number | null
  elapsedSeconds: number
}

export type TimeBoxUpdatePatch = Partial<
  Pick<
    TimeBox,
    | 'content'
    | 'taskId'
    | 'startSlot'
    | 'endSlot'
    | 'status'
    | 'actualMinutes'
    | 'category'
    | 'categoryId'
    | 'skipReason'
    | 'carryOverFromDate'
    | 'carryOverFromBoxId'
    | 'timerStartedAt'
    | 'elapsedSeconds'
  >
>

export interface StackCanvasStateRecord {
  [key: string]: unknown
}

export interface PlannerDay {
  schemaVersion?: number
  date?: string
  taskCards: TaskCard[]
  bigThree: BigThreeItem[]
  timeBoxes: TimeBox[]
  stackCanvasState?: StackCanvasStateRecord
  [key: string]: unknown
}

export interface PlannerMetaModel {
  schemaVersion: number
  categories: CategoryRecord[]
  templates: PlannerTemplate[]
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

export interface TimeBoxReschedulePlan {
  fromDate: string | null
  targetDate: string | null
  planned: TimeBox[]
  skipped: TimeBox[]
}
