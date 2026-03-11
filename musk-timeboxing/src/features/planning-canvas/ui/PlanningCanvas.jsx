import { useEffect, useMemo, useRef } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import {
  buildInitialBoardCanvasShapes,
  hasBoardCanvasSnapshot,
} from '../../../entities/planner'
import { Button, Card } from '../../../shared/ui'

const SAVE_DEBOUNCE_MS = 400

function PlanningCanvas({
  currentDate,
  boardCanvas,
  brainDumpItems = [],
  categories = [],
  onUpdateBoardCanvas = () => {},
  onOpenBoard = () => {},
  onOpenCategoryManager = () => {},
  onOpenComposer = () => {},
}) {
  const editorRef = useRef(null)
  const saveTimerRef = useRef(null)
  const didInitializeRef = useRef(false)
  const hasCards = brainDumpItems.length > 0
  const shapeSeed = useMemo(
    () => buildInitialBoardCanvasShapes({ items: brainDumpItems, categories }),
    [brainDumpItems, categories],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const persistSnapshot = (editor, options = {}) => {
    if (!editor) {
      return
    }

    const snapshot = editor.getSnapshot()
    onUpdateBoardCanvas({
      document: snapshot.document,
      session: snapshot.session,
      migratedFromLegacyBoard:
        options.migratedFromLegacyBoard ?? boardCanvas?.migratedFromLegacyBoard ?? false,
    })
  }

  const schedulePersist = (editor, options = {}) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      persistSnapshot(editor, options)
    }, SAVE_DEBOUNCE_MS)
  }

  const handleAutoLayout = () => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    const currentIds = [...editor.getCurrentPageShapeIds()]
    if (currentIds.length > 0) {
      editor.deleteShapes(currentIds)
    }

    if (shapeSeed.length > 0) {
      editor.createShapes(shapeSeed)
      editor.zoomToFit({ animation: { duration: 0 } })
    }

    persistSnapshot(editor, { migratedFromLegacyBoard: true })
  }

  const handleMount = (editor) => {
    editorRef.current = editor
    editor.setCurrentTool('select')

    if (!didInitializeRef.current) {
      if (hasBoardCanvasSnapshot(boardCanvas)) {
        editor.loadSnapshot({
          document: boardCanvas.document,
          session: boardCanvas.session ?? undefined,
        })
      } else if (shapeSeed.length > 0) {
        editor.createShapes(shapeSeed)
        editor.zoomToFit({ animation: { duration: 0 } })
        persistSnapshot(editor, { migratedFromLegacyBoard: true })
      } else {
        persistSnapshot(editor, { migratedFromLegacyBoard: false })
      }

      didInitializeRef.current = true
    }

    const removeListener = editor.store.listen(() => {
      schedulePersist(editor)
    }, { source: 'user', scope: 'all' })

    return () => {
      removeListener?.()
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }

  return (
    <section data-testid="planning-canvas-view" className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Planning Canvas
            </h3>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              무한 캔버스에서 카드와 카테고리 배치를 먼저 잡고 편성기로 넘깁니다.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              현재 날짜: {currentDate}. 기본 tldraw UI는 숨기고, planner 전용 toolbar와 storage snapshot만 먼저 연결했습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={onOpenCategoryManager}>
              카테고리 관리
            </Button>
            <Button variant="secondary" onClick={handleAutoLayout}>
              자동 배치
            </Button>
            <Button variant="secondary" onClick={onOpenBoard}>
              보드에서 카드 만들기
            </Button>
            <Button variant="primary" onClick={onOpenComposer}>
              편성기로 보내기
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="relative h-[72vh] min-h-[560px]" data-testid="planning-canvas-surface">
          <Tldraw hideUi onMount={handleMount} />

          {!hasCards ? (
            <div
              data-testid="planning-canvas-empty"
              className="pointer-events-none absolute left-6 top-6 rounded-2xl bg-white/90 px-4 py-3 text-sm text-slate-500 shadow-sm dark:bg-slate-950/85 dark:text-slate-400"
            >
              카드가 아직 없습니다. `보드에서 카드 만들기`로 브레인 덤프 카드를 추가하면 캔버스 자동 배치로 시작할 수 있습니다.
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  )
}

export default PlanningCanvas
