/* eslint-disable react-refresh/only-export-components */
import {
  BaseBoxShapeUtil,
  Circle2d,
  HTMLContainer,
  Rectangle2d,
  T,
  resizeBox,
  useEditor,
} from 'tldraw'
import {
  PLANNER_CATEGORY_NODE_SHAPE,
  PLANNER_TASK_CARD_SHAPE,
} from '../../../entities/planner'

export const PLANNER_CANVAS_SELECT_EVENT = 'planner-canvas-select-shape'

const withAlpha = (hex, alpha) => {
  if (typeof hex !== 'string') {
    return `rgba(148, 163, 184, ${alpha})`
  }

  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) {
    return `rgba(148, 163, 184, ${alpha})`
  }

  const value = Number.parseInt(normalized, 16)
  if (Number.isNaN(value)) {
    return `rgba(148, 163, 184, ${alpha})`
  }

  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const resolveStatusLabel = (status) => {
  switch (status) {
    case 'COMPLETED':
      return '완료'
    case 'PARTIAL':
      return '부분'
    case 'SKIPPED':
      return '스킵'
    case 'SCHEDULED':
      return '예정'
    default:
      return '초안'
  }
}

const resolveStatusTone = (status) => {
  switch (status) {
    case 'COMPLETED':
      return {
        bg: 'rgba(21, 128, 61, 0.16)',
        fg: '#166534',
      }
    case 'PARTIAL':
      return {
        bg: 'rgba(245, 158, 11, 0.18)',
        fg: '#b45309',
      }
    case 'SKIPPED':
      return {
        bg: 'rgba(100, 116, 139, 0.18)',
        fg: '#475569',
      }
    case 'SCHEDULED':
      return {
        bg: 'rgba(79, 70, 229, 0.16)',
        fg: '#4338ca',
      }
    default:
      return {
        bg: 'rgba(148, 163, 184, 0.18)',
        fg: '#475569',
      }
  }
}

function CategoryNodeBody({ shape }) {
  const editor = useEditor()
  const handleSelect = () => {
    editor.select(shape.id)
    window.dispatchEvent(
      new CustomEvent(PLANNER_CANVAS_SELECT_EVENT, {
        detail: { shapeId: shape.id },
      }),
    )
  }

  return (
    <HTMLContainer
      data-testid={`canvas-category-node-${shape.props.laneId}`}
      data-planner-shape-id={shape.id}
      className="flex h-full w-full items-center justify-center"
      onPointerDownCapture={handleSelect}
      onClickCapture={handleSelect}
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/50 px-6 text-center shadow-sm backdrop-blur-sm"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${withAlpha(
            shape.props.colorHex,
            0.3,
          )}, ${withAlpha(shape.props.colorHex, 0.14)})`,
          color: '#0f172a',
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          {shape.props.isUncategorized ? 'Unsorted' : 'Category'}
        </div>
        <div className="mt-3 text-2xl font-bold">{shape.props.label}</div>
        <div className="mt-4 inline-flex min-w-[72px] items-center justify-center rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          {shape.props.itemCount}개
        </div>
      </div>
    </HTMLContainer>
  )
}

function TaskCardBody({ shape }) {
  const editor = useEditor()
  const statusTone = resolveStatusTone(shape.props.status)
  const handleSelect = () => {
    editor.select(shape.id)
    window.dispatchEvent(
      new CustomEvent(PLANNER_CANVAS_SELECT_EVENT, {
        detail: { shapeId: shape.id },
      }),
    )
  }

  return (
    <HTMLContainer
      data-testid={`canvas-task-card-${shape.props.cardId}`}
      data-planner-shape-id={shape.id}
      className="flex h-full w-full"
      onPointerDownCapture={handleSelect}
      onClickCapture={handleSelect}
    >
      <div
        className="relative flex h-full w-full overflow-hidden rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-lg backdrop-blur-sm"
        style={{
          boxShadow: `0 18px 44px ${withAlpha(shape.props.categoryColor, 0.18)}`,
        }}
      >
        <div
          className="absolute inset-y-0 left-0 w-2"
          style={{ backgroundColor: shape.props.categoryColor }}
        />
        <div className="flex min-w-0 flex-1 flex-col pl-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: withAlpha(shape.props.categoryColor, 0.16),
                color: shape.props.categoryColor,
              }}
            >
              #{shape.props.categoryLabel}
            </div>
            <div
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: statusTone.bg, color: statusTone.fg }}
            >
              {resolveStatusLabel(shape.props.status)}
            </div>
          </div>

          <div className="mt-4 line-clamp-2 text-left text-[15px] font-semibold leading-5 text-slate-900">
            {shape.props.title}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{shape.props.estimatedSlots * 30}분</span>
            <span>·</span>
            <span>배치 {shape.props.linkedCount}</span>
          </div>

          {shape.props.note ? (
            <div className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
              {shape.props.note}
            </div>
          ) : (
            <div className="mt-3 text-xs text-slate-400">메모 없음</div>
          )}
        </div>
      </div>
    </HTMLContainer>
  )
}

export class PlannerCategoryNodeShapeUtil extends BaseBoxShapeUtil {
  static type = PLANNER_CATEGORY_NODE_SHAPE
  static props = {
    w: T.number,
    h: T.number,
    laneId: T.string,
    label: T.string,
    colorHex: T.string,
    itemCount: T.number,
    isUncategorized: T.boolean,
  }

  canEdit() {
    return false
  }

  canResize() {
    return false
  }

  hideResizeHandles() {
    return true
  }

  canBind() {
    return false
  }

  getDefaultProps() {
    return {
      w: 188,
      h: 188,
      laneId: 'uncategorized',
      label: '미분류',
      colorHex: '#94a3b8',
      itemCount: 0,
      isUncategorized: true,
    }
  }

  onResize(shape, info) {
    return resizeBox(shape, info)
  }

  getGeometry(shape) {
    const radius = Math.min(shape.props.w, shape.props.h) / 2
    return new Circle2d({
      x: shape.props.w / 2 - radius,
      y: shape.props.h / 2 - radius,
      radius,
      isFilled: true,
    })
  }

  component(shape) {
    return <CategoryNodeBody shape={shape} />
  }

  indicator(shape) {
    return (
      <ellipse
        cx={shape.props.w / 2}
        cy={shape.props.h / 2}
        rx={shape.props.w / 2}
        ry={shape.props.h / 2}
      />
    )
  }
}

export class PlannerTaskCardShapeUtil extends BaseBoxShapeUtil {
  static type = PLANNER_TASK_CARD_SHAPE
  static props = {
    w: T.number,
    h: T.number,
    cardId: T.string,
    title: T.string,
    categoryLabel: T.string,
    categoryColor: T.string,
    estimatedSlots: T.number,
    linkedCount: T.number,
    note: T.string,
    status: T.string,
  }

  canEdit() {
    return false
  }

  canResize() {
    return false
  }

  hideResizeHandles() {
    return true
  }

  canBind() {
    return false
  }

  getDefaultProps() {
    return {
      w: 272,
      h: 132,
      cardId: '',
      title: '',
      categoryLabel: '미분류',
      categoryColor: '#94a3b8',
      estimatedSlots: 1,
      linkedCount: 0,
      note: '',
      status: 'TODO',
    }
  }

  onResize(shape, info) {
    return resizeBox(shape, info)
  }

  getGeometry(shape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape) {
    return <TaskCardBody shape={shape} />
  }

  indicator(shape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={24} ry={24} />
  }
}

export const plannerCanvasShapeUtils = [
  PlannerCategoryNodeShapeUtil,
  PlannerTaskCardShapeUtil,
]
