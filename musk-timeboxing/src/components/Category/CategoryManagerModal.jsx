import { useState } from 'react'

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
    <li className="rounded border border-gray-700 bg-gray-800/80 p-3">
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-full border border-gray-500" style={{ backgroundColor: color }} />
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-w-0 flex-1 rounded bg-gray-700 p-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <button
          type="button"
          onClick={() => onUpdate(category.id, name, color)}
          className="rounded bg-gray-700 px-3 py-1 text-xs hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          저장
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`카테고리 '${category.name}'을(를) 삭제할까요?`)) {
              onDelete(category.id)
            }
          }}
          className="rounded bg-red-700 px-3 py-1 text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          삭제
        </button>
      </div>
    </li>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-lg border border-gray-700 bg-gray-900 p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">카테고리 관리</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-800 px-2 py-1 text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 rounded border border-gray-700 bg-gray-800/50 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">새 카테고리</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="min-w-[180px] flex-1 rounded bg-gray-700 p-2 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="예: Deep Work"
            />
            <input
              type="color"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              className="h-10 w-12 cursor-pointer rounded border border-gray-600 bg-transparent p-1"
              aria-label="새 카테고리 색상"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="rounded bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              추가
            </button>
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
        </div>

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
