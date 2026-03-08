import { useMemo, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import { slotToTime } from '../../../entities/planner'

const DURATION_OPTIONS = [
  { value: 1, label: '30분' },
  { value: 2, label: '60분' },
  { value: 3, label: '90분' },
  { value: 4, label: '120분' },
]

function QuickAddModal({
  dateStr,
  dateLabel,
  categories,
  templates,
  initialTemplateId = '',
  onClose,
  onSubmit,
}) {
  const initialTemplate = useMemo(
    () => templates.find((template) => template.id === initialTemplateId) || null,
    [initialTemplateId, templates],
  )
  const [templateId, setTemplateId] = useState(initialTemplateId)
  const [content, setContent] = useState(initialTemplate?.content ?? '')
  const [durationSlots, setDurationSlots] = useState(String(initialTemplate?.durationSlots ?? 1))
  const [categoryId, setCategoryId] = useState(initialTemplate?.categoryId ?? '')
  const [startSlot, setStartSlot] = useState('AUTO')

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (!trimmed) {
      return
    }

    const result = onSubmit({
      dateStr,
      content: trimmed,
      durationSlots: Number(durationSlots),
      categoryId,
      startSlot: startSlot === 'AUTO' ? null : Number(startSlot),
      templateId: templateId || null,
    })

    if (result !== false) {
      onClose()
    }
  }

  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div className="ui-modal-card max-w-lg" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">빠른 일정 추가</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{dateLabel || dateStr}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        {templates.length > 0 ? (
          <Card tone="subtle" className="mt-4 p-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              템플릿
            </label>
            <select
              value={templateId}
              onChange={(event) => {
                const nextTemplateId = event.target.value
                const nextTemplate = templates.find((template) => template.id === nextTemplateId) || null
                setTemplateId(nextTemplateId)
                if (!nextTemplate) {
                  return
                }

                setContent(nextTemplate.content)
                setDurationSlots(String(nextTemplate.durationSlots))
                setCategoryId(nextTemplate.categoryId ?? '')
              }}
              className="ui-select mt-2 text-sm"
            >
              <option value="">직접 입력</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </Card>
        ) : null}

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="quick-add-content">
              일정 내용
            </label>
            <input
              id="quick-add-content"
              type="text"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="ui-input"
              placeholder="예: 알고리즘 2문제 풀이"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="quick-add-duration">
                길이
              </label>
              <select
                id="quick-add-duration"
                value={durationSlots}
                onChange={(event) => setDurationSlots(event.target.value)}
                className="ui-select"
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="quick-add-start-slot">
                시작 시간
              </label>
              <select
                id="quick-add-start-slot"
                value={startSlot}
                onChange={(event) => setStartSlot(event.target.value)}
                className="ui-select"
              >
                <option value="AUTO">자동 배치</option>
                {Array.from({ length: 38 }).map((_, slot) => (
                  <option key={slot} value={slot}>
                    {slotToTime(slot)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400" htmlFor="quick-add-category">
                카테고리
              </label>
              <select
                id="quick-add-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="ui-select"
              >
                <option value="">미분류</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            추가
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QuickAddModal
