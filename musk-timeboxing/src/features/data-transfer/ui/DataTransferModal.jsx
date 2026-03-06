import { useRef, useState } from 'react'
import { Button, Card } from '../../../shared/ui'
import { exportPlannerData, importPlannerData } from '../../../entities/planner'

function DataTransferModal({ currentDate, onClose, onImported, showToast }) {
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [importMode, setImportMode] = useState('merge')
  const fileInputRef = useRef(null)

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

  const handleDownloadExport = () => {
    const payload = exportText.trim()
    if (!payload) {
      showToast('먼저 내보내기를 실행해 주세요')
      return
    }

    const blob = new Blob([payload], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `musk-planner-${currentDate}.json`
    window.document.body.appendChild(anchor)
    anchor.click()
    window.document.body.removeChild(anchor)
    window.URL.revokeObjectURL(url)
    showToast('JSON 파일 다운로드를 시작했습니다')
  }

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      setImportText(text)
      showToast(`파일 불러오기 완료: ${file.name}`)
    } catch {
      showToast('파일 읽기에 실패했습니다')
    } finally {
      event.target.value = ''
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
    <div className="ui-modal-shell" onClick={onClose}>
      <div
        className="ui-modal-card max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">데이터 백업 / 복원</h3>
          <Button
            onClick={onClose}
          >
            닫기
          </Button>
        </div>

        <Card tone="subtle" className="mt-4 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">내보내기 (Export)</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="sky"
              onClick={handleExportAll}
            >
              전체 내보내기
            </Button>
            <Button
              variant="sky"
              onClick={handleExportToday}
            >
              오늘 내보내기
            </Button>
            <Button
              variant="secondary"
              onClick={handleCopyExport}
            >
              복사
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadExport}
              data-testid="data-export-download"
            >
              파일 다운로드
            </Button>
          </div>

          <textarea
            readOnly
            value={exportText}
            placeholder="내보내기 버튼을 누르면 JSON이 표시됩니다"
            className="ui-textarea-code mt-3 h-44"
            data-testid="data-export-text"
          />
        </Card>

        <Card tone="subtle" className="mt-4 p-3">
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
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFileChange}
              data-testid="data-import-file-input"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              data-testid="data-import-file-button"
            >
              파일 선택
            </Button>
          </div>

          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="JSON을 붙여넣고 가져오기를 실행하세요"
            className="ui-textarea-code h-44"
            data-testid="data-import-text"
          />

          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              onClick={handleImport}
            >
              가져오기 실행
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DataTransferModal
