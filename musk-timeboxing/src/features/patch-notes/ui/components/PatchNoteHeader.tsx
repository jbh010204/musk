import { Badge, Button } from '../../../../shared/ui'
import type { PatchNoteEntry } from '../patchNotesData'

interface PatchNoteHeaderProps {
  note: PatchNoteEntry
  isExpanded: boolean
  onToggle: () => void
}

function PatchNoteHeader({ note, isExpanded, onToggle }: PatchNoteHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{note.title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{note.summary}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start">
        <Badge className="rounded-lg">{note.version}</Badge>
        <Button
          onClick={onToggle}
          className="w-16 px-2 py-1 text-center text-[11px]"
          data-testid={`patch-note-toggle-${note.version}`}
          aria-expanded={isExpanded}
          aria-controls={`patch-note-detail-${note.version}`}
        >
          {isExpanded ? '접기' : '상세보기'}
        </Button>
      </div>
    </div>
  )
}

export default PatchNoteHeader
