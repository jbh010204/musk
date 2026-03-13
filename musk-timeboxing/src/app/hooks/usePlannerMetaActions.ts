import type { CategoryMutationOptions, CategoryMutationResult } from './useCategoryMeta'
import type { TemplateMutationInput, TemplateMutationResult } from './useTemplateMeta'
import type { ShowToast } from './useToast'

interface UsePlannerMetaActionsOptions {
  lockedParentIds: string[]
  showToast: ShowToast
  addCategory: (
    name: string,
    color: string,
    parentId?: string | null,
    options?: CategoryMutationOptions,
  ) => CategoryMutationResult
  updateCategory: (
    id: string,
    name: string,
    color: string,
    parentId?: string | null,
    options?: CategoryMutationOptions,
  ) => CategoryMutationResult
  removeCategory: (id: string) => CategoryMutationResult
  clearTimeBoxCategory: (categoryId: string | null) => void
  clearTaskCardCategoryState: (categoryId: string | null) => void
  clearTemplateCategory: (categoryId: string | null) => void
  addTemplate: (payload: TemplateMutationInput) => TemplateMutationResult
  updateTemplate: (id: string, payload: TemplateMutationInput) => TemplateMutationResult
  removeTemplate: (id: string) => void
}

export const usePlannerMetaActions = ({
  lockedParentIds,
  showToast,
  addCategory,
  updateCategory,
  removeCategory,
  clearTimeBoxCategory,
  clearTaskCardCategoryState,
  clearTemplateCategory,
  addTemplate,
  updateTemplate,
  removeTemplate,
}: UsePlannerMetaActionsOptions) => {
  const handleAddCategory = (name: string, color: string, parentId: string | null = null) => {
    const result = addCategory(name, color, parentId, {
      lockedParentIds: [...lockedParentIds],
    })
    if (!result.ok) {
      showToast(result.error || '카테고리를 추가하지 못했습니다')
    } else {
      showToast('카테고리를 추가했습니다')
    }

    return result
  }

  const handleUpdateCategory = (id: string, name: string, color: string, parentId: string | null = null) => {
    const result = updateCategory(id, name, color, parentId, {
      lockedParentIds: [...lockedParentIds],
    })
    if (!result.ok) {
      showToast(result.error || '카테고리를 저장하지 못했습니다')
    } else {
      showToast('카테고리를 저장했습니다')
    }

    return result
  }

  const handleDeleteCategory = (id: string) => {
    const result = removeCategory(id)
    if (!result.ok) {
      showToast(result.error || '카테고리를 삭제하지 못했습니다')
      return result
    }

    clearTimeBoxCategory(id)
    clearTaskCardCategoryState(id)
    clearTemplateCategory(id)
    showToast('카테고리를 삭제했습니다')
    return result
  }

  const handleAddTemplate = (payload: TemplateMutationInput) => {
    const result = addTemplate(payload)
    if (!result.ok) {
      showToast(result.error || '템플릿을 추가하지 못했습니다')
      return result
    }

    showToast('템플릿을 추가했습니다')
    return result
  }

  const handleUpdateTemplate = (id: string, payload: TemplateMutationInput) => {
    const result = updateTemplate(id, payload)
    if (!result.ok) {
      showToast(result.error || '템플릿을 저장하지 못했습니다')
      return result
    }

    showToast('템플릿을 저장했습니다')
    return result
  }

  const handleDeleteTemplate = (id: string) => {
    removeTemplate(id)
    showToast('템플릿을 삭제했습니다')
  }

  return {
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
  }
}
