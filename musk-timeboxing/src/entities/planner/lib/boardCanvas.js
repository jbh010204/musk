import { toRichText } from 'tldraw'
import { groupBoardCardsByCategory } from './boardCard'

export const BOARD_CANVAS_VERSION = 1

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

const buildCategoryNodeText = (lane) => `${lane.label}\n${lane.items.length}개`

const buildCardText = (item) => {
  const lines = [item.content, `예상 ${item.estimatedSlots * 30}분`]
  if (item.linkedTimeBoxIds?.length > 0) {
    lines.push(`예정 ${item.linkedTimeBoxIds.length}`)
  }
  return lines.join('\n')
}

const createGeoProps = ({ geo, text, w, h, color = 'blue', fill = 'semi', dash = 'solid' }) => ({
  geo,
  w,
  h,
  richText: toRichText(text),
  color,
  fill,
  dash,
  size: 'm',
  font: 'sans',
  align: 'middle',
  verticalAlign: 'middle',
  labelColor: 'black',
  url: '',
  growY: 0,
  scale: 1,
})

const createNoteProps = ({ text, color = 'light-blue' }) => ({
  richText: toRichText(text),
  color,
  labelColor: 'black',
  size: 'm',
  font: 'sans',
  fontSizeAdjustment: 0,
  align: 'start',
  verticalAlign: 'start',
  url: '',
  growY: 0,
  scale: 1,
})

export const buildInitialBoardCanvasShapes = ({ items = [], categories = [] }) => {
  const lanes = groupBoardCardsByCategory(items, categories)
  const shapes = []

  lanes.forEach((lane, laneIndex) => {
    const baseX = laneIndex * 320
    const nodeY = 0
    const cardStartY = 240

    shapes.push({
      type: 'geo',
      x: baseX,
      y: nodeY,
      props: createGeoProps({
        geo: 'ellipse',
        w: 180,
        h: 180,
        text: buildCategoryNodeText(lane),
        color: lane.category?.color ? 'green' : 'blue',
        fill: 'semi',
        dash: 'dashed',
      }),
    })

    lane.items.forEach((item, itemIndex) => {
      shapes.push({
        type: 'note',
        x: baseX - 24,
        y: cardStartY + itemIndex * 148,
        props: createNoteProps({
          text: buildCardText(item),
          color: item.categoryId ? 'light-green' : 'yellow',
        }),
      })
    })
  })

  return shapes
}
