import type { PatchNoteEntry } from '../patchNotesData'

interface DetailColumnProps {
  title: string
  items: string[]
}

function DetailColumn({ title, items }: DetailColumnProps) {
  return (
    <div className="rounded-2xl bg-slate-200/60 p-3 dark:bg-slate-900/45">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <ul className="mt-1 space-y-1 text-slate-700 dark:text-slate-200">
        {items.map((item) => (
          <li key={item} className="break-words leading-relaxed">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface PatchNoteDetailProps {
  note: PatchNoteEntry
}

function PatchNoteDetail({ note }: PatchNoteDetailProps) {
  return (
    <div
      id={`patch-note-detail-${note.version}`}
      className="mt-3 grid gap-3 text-sm md:grid-cols-3"
      data-testid={`patch-note-detail-${note.version}`}
    >
      <DetailColumn title="신경 쓴 부분" items={note.focus} />
      <DetailColumn title="개선 사항" items={note.improvements} />
      <DetailColumn title="검증" items={note.validation} />
    </div>
  )
}

export default PatchNoteDetail
