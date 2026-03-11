import { createShapeId } from 'tldraw'
import { groupBoardCardsByCategory, UNCATEGORIZED_BOARD_LANE } from './boardCard'

export const BOARD_CANVAS_VERSION = 1
export const PLANNER_CATEGORY_NODE_SHAPE = 'planner-category-node'
export const PLANNER_TASK_CARD_SHAPE = 'planner-task-card'
export const PLANNER_CANVAS_SHAPE_TYPES = [
  PLANNER_CATEGORY_NODE_SHAPE,
  PLANNER_TASK_CARD_SHAPE,
]

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const createEmptyBoardCanvas = () => ({
  version: BOARD_CANVAS_VERSION,
  document: null,
  session: null,
  migratedFromLegacyBoard: false,
  lastSyncedAt: null,
})

export const normalizeBoardCanvas = (value) => {
  const safeValue = isObject(value) ? value : {}

  return {
    version: BOARD_CANVAS_VERSION,
    document: isObject(safeValue.document) ? safeValue.document : null,
    session: isObject(safeValue.session) ? safeValue.session : null,
    migratedFromLegacyBoard: Boolean(safeValue.migratedFromLegacyBoard),
    lastSyncedAt: Number.isFinite(safeValue.lastSyncedAt) ? Number(safeValue.lastSyncedAt) : null,
  }
}

export const hasBoardCanvasSnapshot = (boardCanvas) =>
  isObject(boardCanvas?.document) && Object.keys(boardCanvas.document).length > 0

export const createPlannerCategoryShapeId = (laneId = UNCATEGORIZED_BOARD_LANE) =>
  createShapeId(`planner-category-${laneId}`)

export const createPlannerTaskShapeId = (cardId) => createShapeId(`planner-task-${cardId}`)

export const isPlannerCanvasShape = (shape) =>
  PLANNER_CANVAS_SHAPE_TYPES.includes(shape?.type)

export const hasPlannerCanvasShapes = (boardCanvas) => {
  const records = boardCanvas?.document?.store
  if (!isObject(records)) {
    return false
  }

  return Object.values(records).some((record) => isPlannerCanvasShape(record))
}

export const getBoardCardCanvasStatus = (item, timeBoxes = []) => {
  const linkedIds = Array.isArray(item?.linkedTimeBoxIds) ? item.linkedTimeBoxIds : []
  if (linkedIds.length === 0) {
    return 'TODO'
  }

  const linkedStatuses = linkedIds
    .map((id) => timeBoxes.find((box) => box.id === id)?.status)
    .filter((status) => typeof status === 'string')

  if (linkedStatuses.length === 0) {
    return 'SCHEDULED'
  }

  const uniqueStatuses = new Set(linkedStatuses)
  if (uniqueStatuses.size === 1) {
    const [onlyStatus] = uniqueStatuses
    if (onlyStatus === 'COMPLETED') {
      return 'COMPLETED'
    }
    if (onlyStatus === 'SKIPPED') {
      return 'SKIPPED'
    }
    return 'SCHEDULED'
  }

  return 'PARTIAL'
}

const getLaneDefaults = (laneIndex, itemIndex = 0) => ({
  nodeX: laneIndex * 340,
  nodeY: 0,
  cardX: laneIndex * 340 - 32,
  cardY: 244 + itemIndex * 172,
})

const withPosition = (positionsById, id, fallback) => {
  const saved = positionsById.get(id)
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    return {
      x: saved.x,
      y: saved.y,
    }
  }

  return fallback
}

const buildCategoryNodeShape = ({ lane, laneIndex, positionsById }) => {
  const id = createPlannerCategoryShapeId(lane.id)
  const { nodeX, nodeY } = getLaneDefaults(laneIndex)

  return {
    id,
    type: PLANNER_CATEGORY_NODE_SHAPE,
    ...withPosition(positionsById, id, { x: nodeX, y: nodeY }),
    props: {
      w: 188,
      h: 188,
      laneId: lane.id,
      label: lane.label,
      colorHex: lane.color,
      itemCount: lane.items.length,
      isUncategorized: lane.id === UNCATEGORIZED_BOARD_LANE,
    },
  }
}

const buildTaskCardShape = ({ item, lane, laneIndex, itemIndex, timeBoxes, positionsById }) => {
  const id = createPlannerTaskShapeId(item.id)
  const { cardX, cardY } = getLaneDefaults(laneIndex, itemIndex)

  return {
    id,
    type: PLANNER_TASK_CARD_SHAPE,
    ...withPosition(positionsById, id, { x: cardX, y: cardY }),
    props: {
      w: 272,
      h: 132,
      cardId: item.id,
      title: item.content,
      categoryLabel: lane.label,
      categoryColor: lane.color,
      estimatedSlots: item.estimatedSlots,
      linkedCount: item.linkedTimeBoxIds?.length || 0,
      note: item.note || '',
      status: getBoardCardCanvasStatus(item, timeBoxes),
    },
  }
}

export const buildInitialBoardCanvasShapes = ({
  items = [],
  categories = [],
  timeBoxes = [],
  positionsById = new Map(),
}) => {
  const lanes = groupBoardCardsByCategory(items, categories)
  const shapes = []

  lanes.forEach((lane, laneIndex) => {
    shapes.push(buildCategoryNodeShape({ lane, laneIndex, positionsById }))

    lane.items.forEach((item, itemIndex) => {
      shapes.push(
        buildTaskCardShape({
          item,
          lane,
          laneIndex,
          itemIndex,
          timeBoxes,
          positionsById,
        }),
      )
    })
  })

  return shapes
}
