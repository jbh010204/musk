import { useState } from 'react'
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
          <h3 className="text-lg font-semibold">패치노트</h3>
          <button type="button" onClick={onClose} className="ui-btn-ghost">
            닫기
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-300">
          최근 개선 내역을 버전 단위로 정리했습니다.
        </p>

        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {PATCH_NOTES.map((note) => (
            <section key={note.version} className="ui-panel-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-100">{note.title}</h4>
                  <p className="mt-0.5 text-xs text-gray-300">{note.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-gray-700 bg-gray-800/70 px-2 py-0.5 text-xs text-gray-300">
                    {note.version}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(note.version)}
                    className="ui-btn-ghost px-2 py-0.5 text-[11px]"
                    data-testid={`patch-note-toggle-${note.version}`}
                  >
                    {expandedVersions[note.version] ? '접기' : '상세보기'}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-400">{note.date}</p>

              {expandedVersions[note.version] ? (
                <div
                  className="mt-3 grid gap-2 text-sm md:grid-cols-3"
                  data-testid={`patch-note-detail-${note.version}`}
                >
                  <div className="rounded border border-gray-700 bg-gray-800/60 p-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      신경 쓴 부분
                    </p>
                    <ul className="mt-1 space-y-1 text-gray-200">
                      {note.focus.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded border border-gray-700 bg-gray-800/60 p-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      개선 사항
                    </p>
                    <ul className="mt-1 space-y-1 text-gray-200">
                      {note.improvements.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded border border-gray-700 bg-gray-800/60 p-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      검증
                    </p>
                    <ul className="mt-1 space-y-1 text-gray-200">
                      {note.validation.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PatchNotesModal
