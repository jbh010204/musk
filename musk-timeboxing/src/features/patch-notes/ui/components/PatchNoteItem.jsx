import { Card } from '../../../../shared/ui'
import PatchNoteDetail from './PatchNoteDetail'
import PatchNoteHeader from './PatchNoteHeader'

function PatchNoteItem({ note, isExpanded, onToggle }) {
  return (
    <Card as="section" tone="subtle" className="p-4">
      <PatchNoteHeader note={note} isExpanded={isExpanded} onToggle={onToggle} />
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note.date}</p>
      {isExpanded ? <PatchNoteDetail note={note} /> : null}
    </Card>
  )
}

export default PatchNoteItem
