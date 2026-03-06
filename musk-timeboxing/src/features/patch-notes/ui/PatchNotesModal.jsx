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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">패치노트</h3>
          <button type="button" onClick={onClose} className="ui-btn-ghost">
            닫기
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          최근 개선 내역을 버전 단위로 정리했습니다.
        </p>

        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {PATCH_NOTES.map((note) => (
            <section key={note.version} className="ui-panel-subtle p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {note.summary}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start">
                  <span className="rounded-lg bg-slate-200/80 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800/65 dark:text-slate-200">
                    {note.version}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(note.version)}
                    className="ui-btn-ghost w-16 px-2 py-1 text-center text-[11px]"
                    data-testid={`patch-note-toggle-${note.version}`}
                    aria-expanded={Boolean(expandedVersions[note.version])}
                    aria-controls={`patch-note-detail-${note.version}`}
                  >
                    {expandedVersions[note.version] ? '접기' : '상세보기'}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note.date}</p>

              {expandedVersions[note.version] ? (
                <div
                  id={`patch-note-detail-${note.version}`}
                  className="mt-3 grid gap-3 text-sm md:grid-cols-3"
                  data-testid={`patch-note-detail-${note.version}`}
                >
                  <div className="rounded-2xl bg-slate-200/60 p-3 dark:bg-slate-900/45">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      신경 쓴 부분
                    </p>
                    <ul className="mt-1 space-y-1 text-slate-700 dark:text-slate-200">
                      {note.focus.map((item) => (
                        <li key={item} className="break-words leading-relaxed">• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-slate-200/60 p-3 dark:bg-slate-900/45">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      개선 사항
                    </p>
                    <ul className="mt-1 space-y-1 text-slate-700 dark:text-slate-200">
                      {note.improvements.map((item) => (
                        <li key={item} className="break-words leading-relaxed">• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-slate-200/60 p-3 dark:bg-slate-900/45">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      검증
                    </p>
                    <ul className="mt-1 space-y-1 text-slate-700 dark:text-slate-200">
                      {note.validation.map((item) => (
                        <li key={item} className="break-words leading-relaxed">• {item}</li>
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
