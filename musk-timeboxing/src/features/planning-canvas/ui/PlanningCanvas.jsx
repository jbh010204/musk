import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import {
  buildInitialBoardCanvasShapes,
  createPlannerTaskShapeId,
  hasBoardCanvasSnapshot,
  hasPlannerCanvasShapes,
  isPlannerCanvasShape,
  PLANNER_CATEGORY_NODE_SHAPE,
  PLANNER_TASK_CARD_SHAPE,
} from '../../../entities/planner'
import { Button, Card } from '../../../shared/ui'
import {
  plannerCanvasShapeUtils,
  PLANNER_CANVAS_SELECT_EVENT,
} from '../lib/plannerCanvasShapes'
import CanvasInspector from './CanvasInspector'

const SAVE_DEBOUNCE_MS = 400

const arePropsEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right)

function PlanningCanvas({
  currentDate,
  boardCanvas,
  brainDumpItems = [],
  categories = [],
  timeBoxes = [],
  onUpdateBoardCanvas = () => {},
  onUpdateCard = () => {},
  onOpenBoard = () => {},
  onOpenCategoryManager = () => {},
  onOpenComposer = () => {},
  embedded = false,
}) {
  const editorRef = useRef(null)
  const saveTimerRef = useRef(null)
  const didInitializeRef = useRef(false)
  const [selectedShape, setSelectedShape] = useState(null)
  const hasCards = brainDumpItems.length > 0
  const shapeUtils = useMemo(() => plannerCanvasShapeUtils, [])
  const shapeSeed = useMemo(
    () => buildInitialBoardCanvasShapes({ items: brainDumpItems, categories, timeBoxes }),
    [brainDumpItems, categories, timeBoxes],
  )
  const cardMap = useMemo(
    () => new Map(brainDumpItems.map((item) => [item.id, item])),
    [brainDumpItems],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleShapeSelect = (event) => {
      const shapeId = event?.detail?.shapeId
      const editor = editorRef.current
      if (!shapeId || !editor) {
        return
      }

      const shape = editor.getShape(shapeId)
      if (!shape || !isPlannerCanvasShape(shape)) {
        return
      }

      setSelectedShape(shape)
    }

    window.addEventListener(PLANNER_CANVAS_SELECT_EVENT, handleShapeSelect)
    return () => {
      window.removeEventListener(PLANNER_CANVAS_SELECT_EVENT, handleShapeSelect)
    }
  }, [])

  useEffect(() => {
    window.__plannerCanvasSelectCard = (cardId) => {
      const editor = editorRef.current
      if (!editor || typeof cardId !== 'string') {
        return false
      }

      const shapeId = createPlannerTaskShapeId(cardId)
      const shape = editor.getShape(shapeId)
      if (!shape || !isPlannerCanvasShape(shape)) {
        return false
      }

      editor.select(shapeId)
      setSelectedShape(shape)
      return true
    }

    return () => {
      delete window.__plannerCanvasSelectCard
    }
  }, [])

  const resolveSelection = useCallback((editor) => {
    const shape = editor?.getOnlySelectedShape?.()
    if (!shape || !isPlannerCanvasShape(shape)) {
      setSelectedShape(null)
      return
    }

    setSelectedShape(shape)
  }, [])

  const persistSnapshot = useCallback((editor, options = {}) => {
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
  }, [boardCanvas?.migratedFromLegacyBoard, onUpdateBoardCanvas])

  const schedulePersist = useCallback((editor, options = {}) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      persistSnapshot(editor, options)
    }, SAVE_DEBOUNCE_MS)
  }, [persistSnapshot])

  const syncProjection = useCallback((editor, options = {}) => {
    if (!editor) {
      return
    }

    const currentPlannerShapes = editor
      .getCurrentPageShapes()
      .filter((shape) => isPlannerCanvasShape(shape))
    const positionsById = new Map(
      currentPlannerShapes.map((shape) => [
        shape.id,
        {
          x: shape.x,
          y: shape.y,
        },
      ]),
    )
    const nextShapes = buildInitialBoardCanvasShapes({
      items: brainDumpItems,
      categories,
      timeBoxes,
      positionsById,
    })
    const currentShapeMap = new Map(currentPlannerShapes.map((shape) => [shape.id, shape]))
    const nextShapeMap = new Map(nextShapes.map((shape) => [shape.id, shape]))

    const toCreate = nextShapes.filter((shape) => !currentShapeMap.has(shape.id))
    const toUpdate = nextShapes
      .filter((shape) => {
        const current = currentShapeMap.get(shape.id)
        if (!current) {
          return false
        }

        return !arePropsEqual(current.props, shape.props)
      })
      .map((shape) => ({
        id: shape.id,
        type: shape.type,
        props: shape.props,
      }))
    const toDelete = currentPlannerShapes
      .filter((shape) => !nextShapeMap.has(shape.id))
      .map((shape) => shape.id)

    if (toDelete.length > 0) {
      editor.deleteShapes(toDelete)
    }

    if (toCreate.length > 0) {
      editor.createShapes(toCreate)
    }

    if (toUpdate.length > 0) {
      editor.updateShapes(toUpdate)
    }

    resolveSelection(editor)

    if (toCreate.length > 0 || toUpdate.length > 0 || toDelete.length > 0) {
      persistSnapshot(editor, options)
    }
  }, [brainDumpItems, categories, persistSnapshot, resolveSelection, timeBoxes])

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

    resolveSelection(editor)
    persistSnapshot(editor, { migratedFromLegacyBoard: true })
  }

  useEffect(() => {
    if (!didInitializeRef.current || !editorRef.current) {
      return
    }

    syncProjection(editorRef.current, {
      migratedFromLegacyBoard: boardCanvas?.migratedFromLegacyBoard ?? true,
    })
  }, [boardCanvas?.migratedFromLegacyBoard, syncProjection])

  const handleMount = (editor) => {
    editorRef.current = editor
    editor.setCurrentTool('select')

    if (!didInitializeRef.current) {
      if (hasBoardCanvasSnapshot(boardCanvas) && hasPlannerCanvasShapes(boardCanvas)) {
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

    resolveSelection(editor)

    const removeListener = editor.store.listen(
      () => {
        resolveSelection(editor)
        schedulePersist(editor)
      },
      { source: 'user', scope: 'all' },
    )

    return () => {
      removeListener?.()
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }

  const selectedEntity = useMemo(() => {
    if (!selectedShape) {
      return null
    }

    if (selectedShape.type === PLANNER_TASK_CARD_SHAPE) {
      const card = cardMap.get(selectedShape.props.cardId) || null
      if (!card) {
        return null
      }

      return {
        kind: 'card',
        shape: selectedShape,
        card,
      }
    }

    if (selectedShape.type === PLANNER_CATEGORY_NODE_SHAPE) {
      return {
        kind: 'category',
        shape: selectedShape,
      }
    }

    return null
  }, [cardMap, selectedShape])

  const handleCanvasPointerUpCapture = () => {
    window.requestAnimationFrame(() => {
      resolveSelection(editorRef.current)
    })
  }

  const handleCanvasClickCapture = (event) => {
    const shapeId = event.target
      ?.closest?.('[data-planner-shape-id]')
      ?.getAttribute?.('data-planner-shape-id')

    if (!shapeId || !editorRef.current) {
      return
    }

    const shape = editorRef.current.getShape(shapeId)
    if (!shape || !isPlannerCanvasShape(shape)) {
      return
    }

    editorRef.current.select(shapeId)
    setSelectedShape(shape)
  }

  return (
    <section data-testid="planning-canvas-view" className={embedded ? 'space-y-4' : 'space-y-6'}>
      <Card className={embedded ? 'p-4' : 'p-5'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Planning Canvas
            </h3>
            <p className={`mt-2 font-semibold text-slate-900 dark:text-slate-100 ${embedded ? 'text-base' : 'text-lg'}`}>
              무한 캔버스에서 카드와 카테고리 배치를 잡습니다.
            </p>
            <p className={`mt-2 text-slate-500 dark:text-slate-400 ${embedded ? 'text-xs' : 'text-sm'}`}>
              현재 날짜: {currentDate}. 카드/카테고리는 custom shape로 렌더링되고, 편집은 inspector에서 원본 brain dump 카드에 반영됩니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={onOpenCategoryManager}>
              카테고리 관리
            </Button>
            <Button variant="secondary" onClick={handleAutoLayout}>
              자동 배치
            </Button>
            {!embedded ? (
              <>
                <Button variant="secondary" onClick={onOpenBoard}>
                  보드에서 카드 만들기
                </Button>
                <Button variant="primary" onClick={onOpenComposer}>
                  편성기로 보내기
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <div className={`grid gap-6 ${embedded ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
        <Card className="overflow-hidden p-0">
          <div
            className={`relative ${embedded ? 'h-[56vh] min-h-[440px]' : 'h-[72vh] min-h-[560px]'}`}
            data-testid="planning-canvas-surface"
            onPointerUpCapture={handleCanvasPointerUpCapture}
            onClickCapture={handleCanvasClickCapture}
          >
            <Tldraw hideUi onMount={handleMount} shapeUtils={shapeUtils} />

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

        <CanvasInspector
          selection={selectedEntity}
          categories={categories}
          onUpdateCard={onUpdateCard}
          onOpenCategoryManager={onOpenCategoryManager}
        />
      </div>
    </section>
  )
}

export default PlanningCanvas
