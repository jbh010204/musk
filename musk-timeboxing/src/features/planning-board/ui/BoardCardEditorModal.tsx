import { useMemo, useState } from 'react'
import type {
  CategoryViewModel,
  DeadlinePriority,
  DeadlineRecord,
  TaskCard,
} from '../../../entities/planner/model/types'
import { Button, Card } from '../../../shared/ui'

const DURATION_OPTIONS = [
  { value: 1, label: '30분' },
  { value: 2, label: '60분' },
  { value: 3, label: '90분' },
  { value: 4, label: '120분' },
 ] as const

interface BoardCardEditorModalProps {
  categories?: CategoryViewModel[]
  initialCard?: Partial<TaskCard> | null
  initialDeadline?: DeadlineRecord | null
  onClose?: () => void
  onSubmit?: (payload: {
    title: string
    categoryId: string
    estimateSlots: number
    note: string
    deadlineDate: string
    deadlinePriority: DeadlinePriority
    deadlineNote: string
  }) => boolean | void
}

function BoardCardEditorModal({
  categories = [],
  initialCard = null,
  initialDeadline = null,
  onClose = () => {},
  onSubmit = () => false,
}: BoardCardEditorModalProps) {
  const assignableCategories = useMemo(
    () => categories.filter((category) => category?.isLeaf !== false),
    [categories],
  )
  const isEdit = Boolean(initialCard?.id)
  const initialDuration = useMemo(
    () => String(initialCard?.estimateSlots ?? 1),
    [initialCard?.estimateSlots],
  )
  const [title, setTitle] = useState(initialCard?.title ?? '')
  const [categoryId, setCategoryId] = useState(initialCard?.categoryId ?? '')
  const [estimateSlots, setEstimateSlots] = useState(initialDuration)
  const [note, setNote] = useState(initialCard?.note ?? '')
  const [deadlineDate, setDeadlineDate] = useState(initialDeadline?.dueDate ?? '')
  const [deadlinePriority, setDeadlinePriority] = useState<DeadlinePriority>(
    initialDeadline?.priority ?? 'MEDIUM',
  )
  const [deadlineNote, setDeadlineNote] = useState(initialDeadline?.note ?? '')

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      return
    }

    const result = onSubmit({
      title: trimmed,
      categoryId,
      estimateSlots: Number(estimateSlots),
      note,
      deadlineDate,
      deadlinePriority,
      deadlineNote,
    })

    if (result !== false) {
      onClose()
    }
  }

  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div className="ui-modal-card max-w-lg" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div className="max-w-[26rem]">
            <h3 className="text-lg font-semibold">{isEdit ? '일정 카드 수정' : '일정 카드 만들기'}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              보드에서 카테고리별 스택을 만들고, 이후 편성기로 일정에 넣습니다.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        <Card tone="subtle" className="mt-5 p-4 sm:p-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="board-card-content">
                카드 내용
              </label>
              <input
                id="board-card-content"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="ui-input"
                placeholder="예: 리준쉐량 디코 답장하기"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="board-card-category">
                  카테고리
                </label>
                <select
                  id="board-card-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="ui-select"
                >
                  <option value="">미분류</option>
                  {assignableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.pathLabel || category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="board-card-duration">
                  예상 길이
                </label>
                <select
                  id="board-card-duration"
                  value={estimateSlots}
                  onChange={(event) => setEstimateSlots(event.target.value)}
                  className="ui-select"
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="board-card-note">
                메모
              </label>
              <textarea
                id="board-card-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="ui-input min-h-[88px] resize-none"
                placeholder="실행 전 참고할 조건이나 준비물을 적습니다."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm text-slate-500 dark:text-slate-400"
                  htmlFor="board-card-deadline-date"
                >
                  마감일
                </label>
                <input
                  id="board-card-deadline-date"
                  type="date"
                  value={deadlineDate}
                  onChange={(event) => setDeadlineDate(event.target.value)}
                  className="ui-input"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm text-slate-500 dark:text-slate-400"
                  htmlFor="board-card-deadline-priority"
                >
                  마감 중요도
                </label>
                <select
                  id="board-card-deadline-priority"
                  value={deadlinePriority}
                  onChange={(event) => setDeadlinePriority(event.target.value as DeadlinePriority)}
                  className="ui-select"
                >
                  <option value="LOW">낮음</option>
                  <option value="MEDIUM">보통</option>
                  <option value="HIGH">높음</option>
                </select>
              </div>
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-slate-500 dark:text-slate-400"
                htmlFor="board-card-deadline-note"
              >
                데드라인 메모
              </label>
              <textarea
                id="board-card-deadline-note"
                rows={2}
                value={deadlineNote}
                onChange={(event) => setDeadlineNote(event.target.value)}
                className="ui-input min-h-[72px] resize-none"
                placeholder="예: 중간발표 자료 제출 전날 검토"
              />
            </div>
          </div>
        </Card>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200/70 pt-4 dark:border-white/10">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {isEdit ? '저장' : '추가'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BoardCardEditorModal
