import { useState } from 'react'
import { exportPlannerData, importPlannerData } from '../../utils/storage'

function DataTransferModal({ currentDate, onClose, onImported, showToast }) {
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [importMode, setImportMode] = useState('merge')

  const handleExportAll = () => {
    const payload = exportPlannerData()
    const serialized = JSON.stringify(payload, null, 2)
    setExportText(serialized)
    showToast('전체 데이터를 생성했습니다')
  }

  const handleExportToday = () => {
    const payload = exportPlannerData(currentDate)
    const serialized = JSON.stringify(payload, null, 2)
    setExportText(serialized)
    showToast('오늘 데이터를 생성했습니다')
  }

  const handleCopyExport = async () => {
    if (!exportText.trim()) {
      showToast('먼저 내보내기를 실행해 주세요')
      return
    }

    try {
      await navigator.clipboard.writeText(exportText)
      showToast('JSON을 클립보드에 복사했습니다')
    } catch {
      showToast('복사에 실패했습니다')
    }
  }

  const handleImport = () => {
    const raw = importText.trim()
    if (!raw) {
      showToast('가져올 JSON을 입력해 주세요')
      return
    }

    const result = importPlannerData(raw, { mode: importMode })
    if (!result.ok) {
      showToast(result.error)
      return
    }

    showToast(
      `가져오기 완료: ${result.importedDays}일, 카테고리 ${result.importedCategories}개`,
      2600,
    )
    onImported()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">데이터 백업 / 복원</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-800 px-2 py-1 text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 rounded border border-gray-700 bg-gray-800/50 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">내보내기 (Export)</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportAll}
              className="rounded bg-sky-700 px-3 py-2 text-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              전체 내보내기
            </button>
            <button
              type="button"
              onClick={handleExportToday}
              className="rounded bg-sky-700 px-3 py-2 text-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              오늘 내보내기
            </button>
            <button
              type="button"
              onClick={handleCopyExport}
              className="rounded bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              복사
            </button>
          </div>

          <textarea
            readOnly
            value={exportText}
            placeholder="내보내기 버튼을 누르면 JSON이 표시됩니다"
            className="mt-3 h-44 w-full rounded bg-gray-950 p-2 font-mono text-xs text-gray-200 focus:outline-none"
          />
        </div>

        <div className="mt-4 rounded border border-gray-700 bg-gray-800/50 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">가져오기 (Import)</p>

          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-300">
            <label htmlFor="import-mode">모드</label>
            <select
              id="import-mode"
              value={importMode}
              onChange={(event) => setImportMode(event.target.value)}
              className="rounded bg-gray-700 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="merge">병합 (기존 유지)</option>
              <option value="replace">교체 (기존 삭제)</option>
            </select>
          </div>

          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="JSON을 붙여넣고 가져오기를 실행하세요"
            className="h-44 w-full rounded bg-gray-950 p-2 font-mono text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              className="rounded bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              가져오기 실행
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataTransferModal
