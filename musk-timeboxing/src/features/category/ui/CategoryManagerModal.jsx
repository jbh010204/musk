import { useState } from 'react'
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
]

function CategoryRow({ category, onUpdate, onDelete }) {
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)

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

      <div className="mt-2 flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => onUpdate(category.id, name, color)}
          className="px-3 py-1 text-xs"
        >
          저장
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (window.confirm(`카테고리 '${category.name}'을(를) 삭제할까요?`)) {
              onDelete(category.id)
            }
          }}
          className="px-3 py-1 text-xs"
        >
          삭제
        </Button>
      </div>
    </Card>
  )
}

function CategoryManagerModal({ categories, onClose, onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  const handleAdd = () => {
    const result = onAddCategory(newName, newColor)
    if (result.ok) {
      setNewName('')
    }
  }

  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div
        className="ui-modal-card max-w-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">카테고리 관리</h3>
          <Button
            onClick={onClose}
            variant="ghost"
          >
            닫기
          </Button>
        </div>

        <Card tone="subtle" className="mt-4 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">새 카테고리</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="ui-input min-w-[180px] flex-1 text-sm"
              placeholder="예: Deep Work"
            />
            <input
              type="color"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-gray-600 bg-transparent p-1"
              aria-label="새 카테고리 색상"
            />
            <Button
              variant="primary"
              onClick={handleAdd}
            >
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
        </Card>

        <div className="mt-4">
          {categories.length === 0 ? (
            <p className="rounded border border-dashed border-gray-700 p-4 text-sm text-gray-400">
              아직 카테고리가 없습니다.
            </p>
          ) : (
            <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onUpdate={onUpdateCategory}
                  onDelete={onDeleteCategory}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryManagerModal
