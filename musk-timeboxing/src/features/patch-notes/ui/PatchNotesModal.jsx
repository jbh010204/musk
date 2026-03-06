import { useState } from 'react'
import { Button } from '../../../shared/ui'
import { PatchNoteItem } from './components'
import { PATCH_NOTES } from './patchNotesData'

function PatchNotesModal({ onClose }) {
  const [expandedVersions, setExpandedVersions] = useState(() => ({
    [PATCH_NOTES[0]?.version ?? '']: true,
  }))

  const toggleExpanded = (version) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }))
  }

  return (
    <div className="ui-modal-shell" onClick={onClose}>
      <div className="ui-modal-card max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">패치노트</h3>
          <Button onClick={onClose}>
            닫기
          </Button>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          최근 개선 내역을 버전 단위로 정리했습니다.
        </p>

        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {PATCH_NOTES.map((note) => (
            <PatchNoteItem
              key={note.version}
              note={note}
              isExpanded={Boolean(expandedVersions[note.version])}
              onToggle={() => toggleExpanded(note.version)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatchNotesModal
