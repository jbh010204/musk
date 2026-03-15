import { useMemo, useState } from 'react'
import { canMoveCategory } from '../../../entities/planner'
import { Button, Card } from '../../../shared/ui'

const PRESET_COLORS = [
  '#4f46e5',
  '#2563eb',
  '#0d9488',
  '#16a34a',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#c026d3',
] as const

interface CategoryViewModelLike {
  id: string
  name: string
  color: string
  parentId?: string | null
  pathLabel?: string | null
  childCount: number
  depth: number
  canAcceptChildren?: boolean
  taskCount?: number
  timeBoxCount?: number
  templateCount?: number
  linkedCount?: number
}

interface CategoryMutationResult {
  ok: boolean
  error?: string
}

interface CategoryRowProps {
  category: CategoryViewModelLike
  categories: CategoryViewModelLike[]
  onUpdate: (
    categoryId: string,
    name: string,
    color: string,
    parentId: string | null,
  ) => CategoryMutationResult | undefined
  onDelete: (categoryId: string) => CategoryMutationResult | undefined
}

interface CategoryManagerModalProps {
  categories: CategoryViewModelLike[]
  onClose: () => void
  onAddCategory: (
    name: string,
    color: string,
    parentId: string | null,
  ) => CategoryMutationResult | undefined
  onUpdateCategory: (
    categoryId: string,
    name: string,
    color: string,
    parentId: string | null,
  ) => CategoryMutationResult | undefined
  onDeleteCategory: (categoryId: string) => CategoryMutationResult | undefined
}

function CategoryRow({ category, categories, onUpdate, onDelete }: CategoryRowProps) {
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)
  const [parentId, setParentId] = useState(category.parentId ?? '')
  const [error, setError] = useState('')

  const parentOptions = useMemo(
    () =>
      categories.filter((candidate) => {
        if (candidate.id === category.id) {
          return false
        }

        return canMoveCategory(categories, category.id, candidate.id)
      }),
    [categories, category.id],
  )

  const handleSave = () => {
    const result = onUpdate(category.id, name, color, parentId || null)
    if (!result?.ok) {
      setError(result?.error || '카테고리를 저장하지 못했습니다')
      return
    }

    setError('')
  }

  const handleDelete = () => {
    const taskCount = Number(category.taskCount) || 0
    const timeBoxCount = Number(category.timeBoxCount) || 0
    const templateCount = Number(category.templateCount) || 0
    const linkedCount = Number(category.linkedCount) || taskCount + timeBoxCount + templateCount
    const impactLines =
      linkedCount > 0
        ? [
            `카드 ${taskCount}개`,
            `일정 ${timeBoxCount}개`,
            `템플릿 ${templateCount}개`,
          ].join(', ')
        : '연결된 항목 없음'

    if (
      !window.confirm(
        `카테고리 '${category.name}'을(를) 삭제할까요?\n${impactLines}\n삭제하면 연결된 항목은 미분류로 바뀝니다.`,
      )
    ) {
      return
    }

    const result = onDelete(category.id)
    if (!result?.ok) {
      setError(result?.error || '카테고리를 삭제하지 못했습니다')
      return
    }

    setError('')
  }

  return (
    <Card as="li" className="p-3">
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-full border border-gray-500" style={{ backgroundColor: color }} />
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="ui-input min-w-0 flex-1 text-sm"
          placeholder="카테고리 이름"
        />
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-gray-600 bg-transparent p-1"
          aria-label="카테고리 색상"
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            부모 카테고리
          </label>
          <select
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="ui-select text-sm"
            aria-label={`${category.name} 부모 카테고리`}
          >
            <option value="">루트</option>
            {parentOptions.map((candidate) => (
              <option
                key={candidate.id}
                value={candidate.id}
                disabled={candidate.canAcceptChildren === false && candidate.id !== category.parentId}
              >
                {candidate.pathLabel || candidate.name}
                {candidate.canAcceptChildren === false ? ' (잠김)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 md:text-right">
          <div>{category.pathLabel || category.name}</div>
          <div>{category.childCount > 0 ? `하위 ${category.childCount}개` : 'leaf 카테고리'}</div>
          <div>
            연결 {Number(category.taskCount) || 0}/{Number(category.timeBoxCount) || 0}/
            {Number(category.templateCount) || 0}
          </div>
        </div>
      </div>

      {error ? <p className="mt-2 text-xs text-amber-500">{error}</p> : null}

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={handleSave} className="px-3 py-1 text-xs">
          저장
        </Button>
        <Button variant="danger" onClick={handleDelete} className="px-3 py-1 text-xs">
          삭제
        </Button>
      </div>
    </Card>
  )
}

function CategoryManagerModal({
  categories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerModalProps) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(PRESET_COLORS[0])
  const [newParentId, setNewParentId] = useState('')
  const [feedback, setFeedback] = useState('')

  const parentOptions = useMemo(
    () => categories.filter((category) => category.canAcceptChildren !== false),
    [categories],
  )

  const handleAdd = () => {
    const result = onAddCategory(newName, newColor, newParentId || null)
    if (result?.ok) {
      setNewName('')
      setNewParentId('')
      setFeedback('')
      return
    }

    setFeedback(result?.error || '카테고리를 추가하지 못했습니다')
  }

  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div className="ui-modal-card max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">카테고리 관리</h3>
          <Button onClick={onClose} variant="ghost">
            닫기
          </Button>
        </div>

        <Card tone="subtle" className="mt-4 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">새 카테고리</p>
          <div className="grid gap-2 md:grid-cols-[1fr_180px_56px_auto] md:items-center">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="ui-input min-w-[180px] flex-1 text-sm"
              placeholder="예: Deep Work"
            />
            <select
              value={newParentId}
              onChange={(event) => setNewParentId(event.target.value)}
              className="ui-select text-sm"
              aria-label="새 카테고리 부모"
            >
              <option value="">루트</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.pathLabel || category.name}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-gray-600 bg-transparent p-1"
              aria-label="새 카테고리 색상"
            />
            <Button variant="primary" onClick={handleAdd}>
              추가
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNewColor(preset)}
                className={`h-6 w-6 rounded-full border ${newColor === preset ? 'border-white' : 'border-gray-600'}`}
                style={{ backgroundColor: preset }}
                aria-label={`색상 ${preset}`}
              />
            ))}
          </div>
          {feedback ? <p className="mt-3 text-xs text-amber-500">{feedback}</p> : null}
        </Card>

        <div className="mt-4">
          {categories.length === 0 ? (
            <p className="rounded border border-dashed border-gray-700 p-4 text-sm text-gray-400">
              아직 카테고리가 없습니다.
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {categories.map((category) => (
                <li key={category.id} style={{ paddingLeft: `${category.depth * 20}px` }}>
                  <CategoryRow
                    category={category}
                    categories={categories}
                    onUpdate={onUpdateCategory}
                    onDelete={onDeleteCategory}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryManagerModal
