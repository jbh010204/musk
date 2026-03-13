import { useEffect, useState } from 'react'
import {
  applyTimeBoxReschedulePlan,
  buildTimeBoxReschedulePlan,
  deriveTopSkippedReason,
  loadPlannerDayModel,
  planTimeBoxPlacement,
  savePlannerDayModel,
  shiftPlannerDate,
  type TimeBox,
  type TimeBoxReschedulePlan,
} from '../../entities/planner'

const INSIGHTS_LOADING_MS = 220

const SKIP_SUGGESTION_BY_REASON = {
  '외부 일정/방해': '자동 제안: 외부 일정 변동이 있었어요. 버퍼 30분 블록을 먼저 배치해보세요.',
  '예상보다 오래 걸림': '자동 제안: 주요 일정 예상 시간을 +30분 늘려 계획해보세요.',
  '우선순위 변경': '자동 제안: 타임라인 배치 전에 빅3를 먼저 확정해보세요.',
  '컨디션 저하': '자동 제안: 오전 첫 블록을 30분 저강도 작업으로 시작해보세요.',
  '자료/준비 부족': '자동 제안: 실행 전에 준비/정리 30분 블록을 먼저 잡아보세요.',
  기타: '자동 제안: 건너뜀이 반복됩니다. 오늘은 버퍼 블록 1개를 먼저 배치해보세요.',
} as const

const SKIP_ACTION_TEMPLATE_BY_REASON = {
  '외부 일정/방해': {
    label: '버퍼 30분 블록 추가',
    content: '버퍼 블록',
    durationSlots: 1,
    preferredStartSlot: 10,
  },
  '예상보다 오래 걸림': {
    label: '집중 블록 60분 추가',
    content: '집중 작업(보정)',
    durationSlots: 2,
    preferredStartSlot: 8,
  },
  '우선순위 변경': {
    label: '빅3 재정렬 30분 추가',
    content: '빅3 재정렬',
    durationSlots: 1,
    preferredStartSlot: 1,
  },
  '컨디션 저하': {
    label: '저강도 시작 30분 추가',
    content: '저강도 워밍업',
    durationSlots: 1,
    preferredStartSlot: 0,
  },
  '자료/준비 부족': {
    label: '준비/정리 30분 추가',
    content: '준비/정리',
    durationSlots: 1,
    preferredStartSlot: 2,
  },
  기타: {
    label: '버퍼 30분 블록 추가',
    content: '버퍼 블록',
    durationSlots: 1,
    preferredStartSlot: 10,
  },
} as const

type PlannerDayState = ReturnType<typeof loadPlannerDayModel>
type SkipReasonKey = keyof typeof SKIP_ACTION_TEMPLATE_BY_REASON
type DailySuggestion = {
  forDate: string
  message: string
  action: (typeof SKIP_ACTION_TEMPLATE_BY_REASON)[SkipReasonKey]
} | null

interface UsePlannerDayFlowOptions {
  currentDate: string
  data: PlannerDayState
  showToast: (message: string, duration?: number, options?: unknown) => void
  goNextDayRaw: (options?: { autoCarry?: boolean }) => { moved: number; skipped: number }
  goPrevDayRaw: () => void
  goToDateRaw: (dateStr: string) => void
  addTimeBox: (timeBox: TimeBox) => unknown
  reloadCurrentDay: () => void
  reloadCategories: () => void
  reloadTemplates: () => void
}

const showPlacementFailureToast = (
  reason: 'invalid-content' | 'no-space' | 'overlap' | null,
  showToast: UsePlannerDayFlowOptions['showToast'],
  messages: {
    invalidContent?: string
    overlap?: string
    noSpace?: string
  } = {},
) => {
  if (reason === 'invalid-content') {
    showToast(messages.invalidContent || '일정 내용을 입력해 주세요')
    return
  }

  if (reason === 'overlap') {
    showToast(messages.overlap || '해당 시간에 이미 일정이 있습니다')
    return
  }

  showToast(messages.noSpace || '배치할 빈 시간이 없습니다')
}

export const usePlannerDayFlow = ({
  currentDate,
  data,
  showToast,
  goNextDayRaw,
  goPrevDayRaw,
  goToDateRaw,
  addTimeBox,
  reloadCurrentDay,
  reloadCategories,
  reloadTemplates,
}: UsePlannerDayFlowOptions) => {
  const [isTimelineInsightsLoading, setIsTimelineInsightsLoading] = useState(true)
  const [dailySuggestion, setDailySuggestion] = useState<DailySuggestion>(null)
  const [crossDateRevision, setCrossDateRevision] = useState(0)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsTimelineInsightsLoading(false)
    }, INSIGHTS_LOADING_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentDate])

  const bumpCrossDateRevision = () => {
    setCrossDateRevision((prev) => prev + 1)
  }

  const goNextDay = () => {
    setIsTimelineInsightsLoading(true)
    const skipReason = deriveTopSkippedReason(data.timeBoxes)
    const nextDate = shiftPlannerDate(currentDate, 1)
    const result = goNextDayRaw({ autoCarry: true })

    if (result.moved > 0) {
      showToast(`미완료 일정 ${result.moved}건을 다음 날로 이월했습니다`)
    } else if (result.skipped > 0) {
      showToast(`이월 가능한 일정이 없어 ${result.skipped}건을 건너뛰었습니다`)
    }

    if (skipReason) {
      const resolvedReason = (skipReason in SKIP_ACTION_TEMPLATE_BY_REASON ? skipReason : '기타') as SkipReasonKey
      setDailySuggestion({
        forDate: nextDate,
        message: SKIP_SUGGESTION_BY_REASON[resolvedReason],
        action: SKIP_ACTION_TEMPLATE_BY_REASON[resolvedReason],
      })
      return
    }

    setDailySuggestion(null)
  }

  const goPrevDay = () => {
    setIsTimelineInsightsLoading(true)
    goPrevDayRaw()
    setDailySuggestion(null)
  }

  const goToDate = (dateStr: string) => {
    setIsTimelineInsightsLoading(true)
    goToDateRaw(dateStr)
    setDailySuggestion(null)
  }

  const applySkipSuggestionAction = () => {
    const action = dailySuggestion?.action
    if (!action) {
      return
    }

    const placement = planTimeBoxPlacement(data.timeBoxes, {
      content: action.content,
      taskId: null,
      preferredStartSlot: action.preferredStartSlot,
      durationSlots: action.durationSlots,
    })

    if (!placement.timeBox) {
      showPlacementFailureToast(placement.reason, showToast, {
        noSpace: '추천 블록을 배치할 빈 시간이 없습니다',
      })
      return
    }

    addTimeBox(placement.timeBox)
    showToast(`추천 블록을 추가했습니다: ${placement.timeBox.content}`)
  }

  const buildReschedulePlan = (): TimeBoxReschedulePlan => {
    const targetDate = shiftPlannerDate(currentDate, 1)
    const targetDay = loadPlannerDayModel(targetDate)
    return buildTimeBoxReschedulePlan({
      currentDate,
      targetDate,
      timeBoxes: data.timeBoxes,
      targetTimeBoxes: targetDay.timeBoxes,
    })
  }

  const applyReschedulePlan = (plan: TimeBoxReschedulePlan): boolean => {
    if (!plan || !Array.isArray(plan.planned) || plan.planned.length === 0) {
      showToast('재배치할 일정이 없습니다')
      return false
    }

    const targetDate = typeof plan.targetDate === 'string' && plan.targetDate.trim().length > 0 ? plan.targetDate : null
    if (!targetDate) {
      showToast('재배치 대상 날짜가 올바르지 않습니다')
      return false
    }

    const targetDay = loadPlannerDayModel(targetDate)
    const { appliedCount, nextTimeBoxes } = applyTimeBoxReschedulePlan(targetDay.timeBoxes, plan)
    if (appliedCount === 0) {
      showToast('이미 재배치된 일정입니다')
      return false
    }

    savePlannerDayModel(targetDate, {
      ...targetDay,
      timeBoxes: nextTimeBoxes,
    })
    bumpCrossDateRevision()
    showToast(`다음 날(${targetDate})로 ${appliedCount}건 재배치했습니다`, 2600)
    return true
  }

  const handleImported = () => {
    reloadCategories()
    reloadTemplates()
    reloadCurrentDay()
    bumpCrossDateRevision()
  }

  return {
    isTimelineInsightsLoading,
    dailySuggestion,
    setDailySuggestion,
    crossDateRevision,
    bumpCrossDateRevision,
    goNextDay,
    goPrevDay,
    goToDate,
    applySkipSuggestionAction,
    buildReschedulePlan,
    applyReschedulePlan,
    handleImported,
  }
}
