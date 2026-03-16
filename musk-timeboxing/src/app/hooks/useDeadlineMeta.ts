import { useEffect, useState } from 'react'
import {
  clearDeadlineTaskLink,
  completeDeadlineRecord,
  getActiveDeadlineForTask,
  loadPlannerMetaModel,
  removeDeadlineForTask,
  removeDeadlineRecord,
  savePlannerMetaModel,
  upsertDeadlineForTask,
} from '../../entities/planner'
import type { DeadlinePriority, DeadlineRecord } from '../../entities/planner/model/types'

export interface DeadlineMutationInput {
  taskId: string | null
  taskDate: string | null
  title: string
  dueDate: string
  priority?: DeadlinePriority | null
  note?: string | null
}

export const useDeadlineMeta = () => {
  const [deadlines, setDeadlines] = useState<DeadlineRecord[]>(() => loadPlannerMetaModel().deadlines || [])

  useEffect(() => {
    const currentMeta = loadPlannerMetaModel()
    savePlannerMetaModel({
      ...currentMeta,
      deadlines,
    })
  }, [deadlines])

  const upsertDeadline = (input: DeadlineMutationInput): void => {
    setDeadlines((prev) => upsertDeadlineForTask(prev, input))
  }

  const removeDeadline = (deadlineId: string): void => {
    setDeadlines((prev) => removeDeadlineRecord(prev, deadlineId))
  }

  const removeDeadlineForLinkedTask = (taskId: string | null, taskDate: string | null): void => {
    setDeadlines((prev) => removeDeadlineForTask(prev, taskId, taskDate))
  }

  const completeDeadline = (deadlineId: string, completedAt?: string | null): void => {
    setDeadlines((prev) => completeDeadlineRecord(prev, deadlineId, completedAt))
  }

  const detachDeadlineFromTask = (taskId: string | null, taskDate: string | null): void => {
    setDeadlines((prev) => clearDeadlineTaskLink(prev, taskId, taskDate))
  }

  const getTaskDeadline = (taskId: string | null, taskDate: string | null): DeadlineRecord | null =>
    getActiveDeadlineForTask(deadlines, taskId, taskDate)

  const reloadDeadlines = (): void => {
    setDeadlines(loadPlannerMetaModel().deadlines || [])
  }

  return {
    deadlines,
    upsertDeadline,
    removeDeadline,
    removeDeadlineForLinkedTask,
    completeDeadline,
    detachDeadlineFromTask,
    getTaskDeadline,
    reloadDeadlines,
  }
}
