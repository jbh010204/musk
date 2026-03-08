import { useMemo, useState } from 'react'
import { Button, Card } from '../../../shared/ui'

const DURATION_OPTIONS = [
  { value: 1, label: '30분' },
  { value: 2, label: '60분' },
  { value: 3, label: '90분' },
  { value: 4, label: '120분' },
]

function TemplateRow({ template, categories, onUpdate, onDelete }) {
  const [name, setName] = useState(template.name)
  const [content, setContent] = useState(template.content)
  const [durationSlots, setDurationSlots] = useState(String(template.durationSlots))
  const [categoryId, setCategoryId] = useState(template.categoryId ?? '')

  return (
    <Card as="li" className="p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_120px_160px_auto]">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="ui-input text-sm"
          placeholder="템플릿 이름"
        />
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="ui-input text-sm"
          placeholder="실제 일정 내용"
        />
        <select
          value={durationSlots}
          onChange={(event) => setDurationSlots(event.target.value)}
          className="ui-select text-sm"
          aria-label={`${template.name} 기본 길이`}
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="ui-select text-sm"
          aria-label={`${template.name} 기본 카테고리`}
        >
          <option value="">미분류</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1 text-xs"
            onClick={() =>
              onUpdate(template.id, {
                name,
                content,
                durationSlots,
                categoryId,
              })
            }
          >
            저장
          </Button>
          <Button
            variant="danger"
            className="px-3 py-1 text-xs"
            onClick={() => {
              if (window.confirm(`템플릿 '${template.name}'을(를) 삭제할까요?`)) {
                onDelete(template.id)
              }
            }}
          >
            삭제
          </Button>
        </div>
      </div>
    </Card>
  )
}

function TemplateManagerModal({
  templates,
  categories,
  onClose,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}) {
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newDurationSlots, setNewDurationSlots] = useState('2')
  const [newCategoryId, setNewCategoryId] = useState('')

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [templates],
  )

  const handleAdd = () => {
    const result = onAddTemplate({
      name: newName,
      content: newContent,
      durationSlots: newDurationSlots,
      categoryId: newCategoryId,
    })

    if (result.ok) {
      setNewName('')
      setNewContent('')
      setNewDurationSlots('2')
      setNewCategoryId('')
    }
  }

  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div className="ui-modal-card max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">퀵 템플릿</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              자주 쓰는 블록을 저장해 두고 일간/주간/월간 뷰에서 바로 넣습니다.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        <Card tone="subtle" className="mt-4 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            새 템플릿
          </p>
          <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_120px_160px_auto]">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="ui-input text-sm"
              placeholder="예: 아침 딥워크"
            />
            <input
              type="text"
              value={newContent}
              onChange={(event) => setNewContent(event.target.value)}
              className="ui-input text-sm"
              placeholder="예: 알고리즘 2문제 풀이"
            />
            <select
              value={newDurationSlots}
              onChange={(event) => setNewDurationSlots(event.target.value)}
              className="ui-select text-sm"
              aria-label="새 템플릿 기본 길이"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={newCategoryId}
              onChange={(event) => setNewCategoryId(event.target.value)}
              className="ui-select text-sm"
              aria-label="새 템플릿 기본 카테고리"
            >
              <option value="">미분류</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button variant="primary" onClick={handleAdd}>
              추가
            </Button>
          </div>
        </Card>

        <div className="mt-4">
          {sortedTemplates.length === 0 ? (
            <p className="rounded-2xl bg-slate-100/80 p-4 text-sm text-slate-500 dark:bg-slate-800/35 dark:text-slate-400">
              아직 저장된 템플릿이 없습니다.
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {sortedTemplates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  categories={categories}
                  onUpdate={onUpdateTemplate}
                  onDelete={onDeleteTemplate}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateManagerModal
