import type { CategoryRecord, CategoryTreeNode, CategoryViewModel } from './types'

const DEFAULT_CATEGORY_COLOR = '#6366f1'

interface CategoryInput {
  id?: unknown
  name?: unknown
  color?: unknown
  parentId?: unknown
  order?: unknown
  collapsed?: unknown
}

interface CategoryMutationInput {
  name?: unknown
  color?: unknown
  parentId?: unknown
}

interface CategoryUsageRef {
  categoryId?: unknown
}

type CategoryMutationResult =
  | { ok: true; nextCategories: CategoryRecord[]; category?: CategoryRecord }
  | { ok: false; error: string }

const normalizeName = (value: unknown): string => String(value || '').trim()
const normalizeColor = (value: unknown): string => {
  const raw = String(value || '').trim()
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : DEFAULT_CATEGORY_COLOR
}

export const normalizeCategoryParentId = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeCategoryOrder = (value: unknown, fallback = 0): number => {
  const next = Number(value)
  return Number.isInteger(next) ? next : fallback
}

export const normalizeCategoryRecord = (
  category: CategoryInput | CategoryRecord | null | undefined,
  fallbackIndex = 0,
): CategoryRecord | null => {
  const name = normalizeName(category?.name)
  if (!name) {
    return null
  }

  return {
    id: typeof category?.id === 'string' ? category.id : crypto.randomUUID(),
    name,
    color: normalizeColor(category?.color),
    parentId: normalizeCategoryParentId(category?.parentId),
    order: normalizeCategoryOrder(category?.order, fallbackIndex),
    collapsed: Boolean(category?.collapsed),
  }
}

const compareCategoryOrder = (
  left: CategoryInput | CategoryRecord | null | undefined,
  right: CategoryInput | CategoryRecord | null | undefined,
): number => {
  const byOrder = normalizeCategoryOrder(left?.order) - normalizeCategoryOrder(right?.order)
  if (byOrder !== 0) {
    return byOrder
  }

  return String(left?.name || '').localeCompare(String(right?.name || ''), 'ko')
}

export const normalizeCategoryRecords = (
  categories: Array<CategoryInput | CategoryRecord> = [],
): CategoryRecord[] =>
  categories
    .map((category, index) => normalizeCategoryRecord(category, index))
    .filter((category): category is CategoryRecord => Boolean(category))

export const getCategoryChildren = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  parentId: string | null = null,
): CategoryRecord[] =>
  normalizeCategoryRecords(categories)
    .filter((category) => (category.parentId ?? null) === (parentId ?? null))
    .sort(compareCategoryOrder)

export const buildCategoryTree = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  parentId: string | null = null,
  depth = 0,
): CategoryTreeNode[] =>
  getCategoryChildren(categories, parentId).map((category) => ({
    ...category,
    depth,
    children: buildCategoryTree(categories, category.id, depth + 1),
  }))

export const getCategoryDescendantIds = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string,
): string[] => {
  const descendants: string[] = []
  const visit = (parentId: string) => {
    getCategoryChildren(categories, parentId).forEach((child) => {
      descendants.push(child.id)
      visit(child.id)
    })
  }

  visit(categoryId)
  return descendants
}

export const isDescendantCategory = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  targetId: string,
  ancestorId: string,
): boolean =>
  getCategoryDescendantIds(categories, ancestorId).includes(targetId)

export const isLeafCategory = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string,
): boolean =>
  getCategoryChildren(categories, categoryId).length === 0

export const canAssignTaskToCategory = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string | null,
): boolean =>
  categoryId == null || (categories.some((category) => category.id === categoryId) && isLeafCategory(categories, categoryId))

export const getCategoryPath = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string | null,
): CategoryRecord[] => {
  const categoryMap = new Map(normalizeCategoryRecords(categories).map((category) => [category.id, category]))
  const path: CategoryRecord[] = []
  let current = categoryId ? categoryMap.get(categoryId) || null : null
  const visited = new Set()

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    path.unshift(current)
    current = current.parentId ? categoryMap.get(current.parentId) || null : null
  }

  return path
}

export const getCategoryPathLabel = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string | null,
): string => {
  const path = getCategoryPath(categories, categoryId)
  if (path.length === 0) {
    return ''
  }

  return path.map((category) => category.name).join(' / ')
}

export const getAssignableCategories = (
  categories: Array<CategoryInput | CategoryRecord> = [],
): CategoryViewModel[] => {
  const tree = buildCategoryTree(categories)
  const flattened: CategoryViewModel[] = []
  const visit = (nodes: CategoryTreeNode[]) => {
    nodes.forEach((node) => {
      const childCount = node.children.length
      const pathLabel = getCategoryPathLabel(categories, node.id)
      flattened.push({
        ...node,
        childCount,
        isLeaf: childCount === 0,
        pathLabel,
      })
      visit(node.children)
    })
  }

  visit(tree)
  return flattened.filter((category) => category.isLeaf)
}

export const getCategoryViewModels = (
  categories: Array<CategoryInput | CategoryRecord> = [],
): CategoryViewModel[] => {
  const tree = buildCategoryTree(categories)
  const flattened: CategoryViewModel[] = []
  const visit = (nodes: CategoryTreeNode[]) => {
    nodes.forEach((node) => {
      const childCount = node.children.length
      flattened.push({
        ...node,
        childCount,
        isLeaf: childCount === 0,
        pathLabel: getCategoryPathLabel(categories, node.id),
      })
      visit(node.children)
    })
  }

  visit(tree)
  return flattened
}

export const collectLockedCategoryIds = (
  taskCards: CategoryUsageRef[] = [],
  timeBoxes: CategoryUsageRef[] = [],
  templates: CategoryUsageRef[] = [],
): Set<string> => {
  const usedIds = new Set<string>()

  ;[...taskCards, ...timeBoxes, ...templates].forEach((entry) => {
    if (typeof entry?.categoryId === 'string' && entry.categoryId.trim().length > 0) {
      usedIds.add(entry.categoryId)
    }
  })

  return usedIds
}

export const buildManagedCategoryViewModels = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  {
    taskCards = [],
    timeBoxes = [],
    templates = [],
  }: {
    taskCards?: CategoryUsageRef[]
    timeBoxes?: CategoryUsageRef[]
    templates?: CategoryUsageRef[]
  } = {},
): Array<CategoryViewModel & { canAcceptChildren: boolean }> => {
  const lockedCategoryIds = collectLockedCategoryIds(taskCards, timeBoxes, templates)

  return getCategoryViewModels(categories).map((category) => ({
    ...category,
    canAcceptChildren: !lockedCategoryIds.has(category.id),
  }))
}

export const hasDuplicateCategoryName = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  name: string,
  excludeId: string | null = null,
): boolean =>
  normalizeCategoryRecords(categories).some((category) => {
    if (excludeId && category.id === excludeId) {
      return false
    }

    return category.name.toLowerCase() === String(name).toLowerCase()
  })

const getNextSiblingOrder = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  parentId: string | null = null,
): number =>
  getCategoryChildren(categories, parentId).reduce(
    (max, category) => Math.max(max, normalizeCategoryOrder(category.order)),
    -1,
  ) + 1

export const canMoveCategory = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string,
  nextParentId: string | null,
): boolean => {
  if (nextParentId == null) {
    return true
  }

  if (categoryId === nextParentId) {
    return false
  }

  return !isDescendantCategory(categories, nextParentId, categoryId)
}

export const addCategoryRecord = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  { name, color, parentId = null }: CategoryMutationInput = {},
): CategoryMutationResult => {
  const normalizedName = normalizeName(name)
  if (!normalizedName) {
    return { ok: false, error: '카테고리 이름을 입력해 주세요' }
  }

  if (hasDuplicateCategoryName(categories, normalizedName)) {
    return { ok: false, error: '같은 이름의 카테고리가 이미 있습니다' }
  }

  const normalizedParentId = normalizeCategoryParentId(parentId)
  if (normalizedParentId && !categories.some((category) => category.id === normalizedParentId)) {
    return { ok: false, error: '유효한 부모 카테고리를 선택해 주세요' }
  }

  const nextCategory = normalizeCategoryRecord({
    id: crypto.randomUUID(),
    name: normalizedName,
    color,
    parentId: normalizedParentId,
    order: getNextSiblingOrder(categories, normalizedParentId),
  })
  if (!nextCategory) {
    return { ok: false, error: '카테고리를 생성할 수 없습니다' }
  }

  return {
    ok: true,
    nextCategories: [...normalizeCategoryRecords(categories), nextCategory],
    category: nextCategory,
  }
}

export const updateCategoryRecord = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string,
  { name, color, parentId }: CategoryMutationInput = {},
): CategoryMutationResult => {
  const normalizedCategories = normalizeCategoryRecords(categories)
  const target = normalizedCategories.find((category) => category.id === categoryId)
  if (!target) {
    return { ok: false, error: '카테고리를 찾을 수 없습니다' }
  }

  const normalizedName = normalizeName(name)
  if (!normalizedName) {
    return { ok: false, error: '카테고리 이름을 입력해 주세요' }
  }

  if (hasDuplicateCategoryName(normalizedCategories, normalizedName, categoryId)) {
    return { ok: false, error: '같은 이름의 카테고리가 이미 있습니다' }
  }

  const normalizedParentId = normalizeCategoryParentId(parentId)
  if (normalizedParentId && !normalizedCategories.some((category) => category.id === normalizedParentId)) {
    return { ok: false, error: '유효한 부모 카테고리를 선택해 주세요' }
  }

  if (!canMoveCategory(normalizedCategories, categoryId, normalizedParentId)) {
    return { ok: false, error: '자기 자신이나 하위 카테고리 아래로 이동할 수 없습니다' }
  }

  const parentChanged = (target.parentId ?? null) !== (normalizedParentId ?? null)

  const nextCategories = normalizedCategories.map((category) => {
    if (category.id !== categoryId) {
      return category
    }

    return {
      ...category,
      name: normalizedName,
      color: normalizeColor(color),
      parentId: normalizedParentId,
      order: parentChanged ? getNextSiblingOrder(normalizedCategories, normalizedParentId) : category.order,
    }
  })

  return {
    ok: true,
    nextCategories,
  }
}

export const removeCategoryRecord = (
  categories: Array<CategoryInput | CategoryRecord> = [],
  categoryId: string,
): CategoryMutationResult => {
  const normalizedCategories = normalizeCategoryRecords(categories)
  const target = normalizedCategories.find((category) => category.id === categoryId)
  if (!target) {
    return { ok: false, error: '카테고리를 찾을 수 없습니다' }
  }

  if (getCategoryChildren(normalizedCategories, categoryId).length > 0) {
    return { ok: false, error: '하위 카테고리가 있는 항목은 삭제할 수 없습니다' }
  }

  return {
    ok: true,
    nextCategories: normalizedCategories.filter((category) => category.id !== categoryId),
  }
}
