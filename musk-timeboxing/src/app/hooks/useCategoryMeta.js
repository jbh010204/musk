import { useEffect, useMemo, useState } from 'react'
import {
  addCategoryRecord,
  getAssignableCategories,
  getCategoryViewModels,
  loadPlannerMetaModel,
  removeCategoryRecord,
  savePlannerMetaModel,
  updateCategoryRecord,
} from '../../entities/planner'

export const useCategoryMeta = () => {
  const [categories, setCategories] = useState(() => loadPlannerMetaModel().categories)

  useEffect(() => {
    const currentMeta = loadPlannerMetaModel()
    savePlannerMetaModel({
      ...currentMeta,
      categories,
    })
  }, [categories])

  const categoryViewModels = useMemo(() => getCategoryViewModels(categories), [categories])
  const assignableCategories = useMemo(() => getAssignableCategories(categories), [categories])

  const addCategory = (name, color, parentId = null, options = {}) => {
    if (Array.isArray(options.lockedParentIds) && options.lockedParentIds.includes(parentId)) {
      return { ok: false, error: '일정이 연결된 카테고리 아래에는 하위 카테고리를 만들 수 없습니다' }
    }

    const result = addCategoryRecord(categories, { name, color, parentId })
    if (!result.ok) {
      return result
    }

    setCategories(result.nextCategories)
    return { ok: true, category: result.category }
  }

  const updateCategory = (id, name, color, parentId = null, options = {}) => {
    const previous = categories.find((category) => category.id === id) || null
    const normalizedParentId = typeof parentId === 'string' && parentId.trim().length > 0 ? parentId : null
    const parentChanged = (previous?.parentId ?? null) !== normalizedParentId

    if (parentChanged && Array.isArray(options.lockedParentIds) && options.lockedParentIds.includes(normalizedParentId)) {
      return { ok: false, error: '일정이 연결된 카테고리 아래에는 하위 카테고리를 둘 수 없습니다' }
    }

    const result = updateCategoryRecord(categories, id, {
      name,
      color,
      parentId: normalizedParentId,
    })
    if (!result.ok) {
      return result
    }

    setCategories(result.nextCategories)
    return { ok: true }
  }

  const removeCategory = (id) => {
    const result = removeCategoryRecord(categories, id)
    if (!result.ok) {
      return result
    }

    setCategories(result.nextCategories)
    return { ok: true }
  }

  const reloadCategories = () => {
    setCategories(loadPlannerMetaModel().categories)
  }

  return {
    categories,
    categoryViewModels,
    assignableCategories,
    addCategory,
    updateCategory,
    removeCategory,
    reloadCategories,
  }
}
