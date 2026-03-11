import { useMemo, useState } from 'react'
import { Button, Card } from '../../../shared/ui'

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-300 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600'

function CardInspector({ selection, categories, onUpdateCard }) {
  const assignableCategories = useMemo(
    () => categories.filter((category) => category?.isLeaf !== false),
    [categories],
  )
  const [draft, setDraft] = useState(() => ({
    content: selection.card.content,
    estimatedSlots: selection.card.estimatedSlots,
    note: selection.card.note || '',
    categoryId: selection.card.categoryId || '',
  }))

  const hasChanges = useMemo(() => {
    if (!selection?.card) {
      return false
    }

    return (
      draft.content.trim() !== selection.card.content ||
      Number(draft.estimatedSlots) !== selection.card.estimatedSlots ||
      draft.note.trim() !== (selection.card.note || '') ||
      (draft.categoryId || '') !== (selection.card.categoryId || '')
    )
  }, [draft, selection])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!selection?.card) {
      return
    }

    const trimmed = draft.content.trim()
    if (!trimmed) {
      return
    }

    onUpdateCard(selection.card.id, {
      content: trimmed,
      estimatedSlots: Number(draft.estimatedSlots),
      note: draft.note,
      categoryId: draft.categoryId || null,
    })
  }

  return (
    <Card className="p-5" data-testid="planning-canvas-inspector-card">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          선택된 카드
        </div>
        <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {selection.card.content}
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">제목</span>
          <input
            data-testid="planning-canvas-card-title-input"
            className={inputClassName}
            value={draft.content}
            onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">예상 길이</span>
          <select
            data-testid="planning-canvas-card-duration-select"
            className={inputClassName}
            value={String(draft.estimatedSlots)}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, estimatedSlots: Number(event.target.value) }))
            }
          >
            {[1, 2, 3, 4, 6, 8].map((value) => (
              <option key={value} value={value}>
                {value * 30}분
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">카테고리</span>
          <select
            data-testid="planning-canvas-card-category-select"
            className={inputClassName}
            value={draft.categoryId}
            onChange={(event) => setDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">미분류</option>
            {assignableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.pathLabel || category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">메모</span>
          <textarea
            data-testid="planning-canvas-card-note-input"
            className={`${inputClassName} min-h-28 resize-none`}
            value={draft.note}
            onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            편집은 원본 brain dump 카드에 바로 반영됩니다.
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={!hasChanges || draft.content.trim().length === 0}
          >
            저장
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CategoryInspector({ selection, onOpenCategoryManager }) {
  return (
    <Card className="p-5" data-testid="planning-canvas-inspector-category">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        선택된 카테고리
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {selection.shape.props.label}
      </div>
      <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        현재 카드 {selection.shape.props.itemCount}개가 이 노드에 연결되어 있습니다.
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          카테고리 이름과 색은 전역 카테고리 관리자에서 수정합니다.
        </div>
        <Button variant="secondary" onClick={onOpenCategoryManager}>
          카테고리 관리
        </Button>
      </div>
    </Card>
  )
}

function EmptyInspector() {
  return (
    <Card className="p-5" data-testid="planning-canvas-inspector-empty">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        Inspector
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        캔버스에서 카드나 카테고리 노드를 선택하세요.
      </div>
      <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        카드는 제목/예상 길이/카테고리/메모를 바로 수정할 수 있고, 카테고리 노드는 연결 상태를 확인하는 용도로 씁니다.
      </div>
    </Card>
  )
}

function CanvasInspector({
  selection = null,
  categories = [],
  onUpdateCard = () => {},
  onOpenCategoryManager = () => {},
}) {
  if (!selection) {
    return <EmptyInspector />
  }

  if (selection.kind === 'card' && selection.card) {
    return (
      <CardInspector
        key={selection.card.id}
        selection={selection}
        categories={categories}
        onUpdateCard={onUpdateCard}
      />
    )
  }

  if (selection.kind === 'category') {
    return (
      <CategoryInspector
        selection={selection}
        onOpenCategoryManager={onOpenCategoryManager}
      />
    )
  }

  return <EmptyInspector />
}

export default CanvasInspector
