import { useEffect, useState } from 'react'
import { loadMeta, saveMeta, TOTAL_SLOTS } from '../../entities/planner'

type PlannerTemplate = ReturnType<typeof loadMeta>['templates'][number]

interface TemplateInput {
  name: string
  content: string
  durationSlots: number
  categoryId?: string | null
}

const normalizeName = (value: unknown): string => String(value || '').trim()
const normalizeContent = (value: unknown): string => String(value || '').trim()
const normalizeDurationSlots = (value: unknown): number =>
  Math.max(1, Math.min(TOTAL_SLOTS, Number.parseInt(String(value), 10) || 1))

const normalizeCategoryId = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const hasDuplicateName = (
  templates: PlannerTemplate[],
  name: string,
  excludeId: string | null = null,
): boolean =>
  templates.some((template) => {
    if (excludeId && template.id === excludeId) {
      return false
    }

    return String(template.name || '').toLowerCase() === name.toLowerCase()
  })

export const useTemplateMeta = () => {
  const [templates, setTemplates] = useState<PlannerTemplate[]>(() => loadMeta().templates || [])

  useEffect(() => {
    saveMeta({ templates })
  }, [templates])

  const addTemplate = ({
    name,
    content,
    durationSlots,
    categoryId = null,
  }: TemplateInput): { ok: boolean; error?: string } => {
    const normalizedName = normalizeName(name)
    const normalizedContent = normalizeContent(content)

    if (!normalizedName) {
      return { ok: false, error: '템플릿 이름을 입력해 주세요' }
    }

    if (!normalizedContent) {
      return { ok: false, error: '템플릿 내용이 비어 있습니다' }
    }

    if (hasDuplicateName(templates, normalizedName)) {
      return { ok: false, error: '같은 이름의 템플릿이 이미 있습니다' }
    }

    setTemplates((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: normalizedName,
        content: normalizedContent,
        durationSlots: normalizeDurationSlots(durationSlots),
        categoryId: normalizeCategoryId(categoryId),
      },
    ])

    return { ok: true }
  }

  const updateTemplate = (
    id: string,
    { name, content, durationSlots, categoryId = null }: TemplateInput,
  ): { ok: boolean; error?: string } => {
    const normalizedName = normalizeName(name)
    const normalizedContent = normalizeContent(content)

    if (!normalizedName) {
      return { ok: false, error: '템플릿 이름을 입력해 주세요' }
    }

    if (!normalizedContent) {
      return { ok: false, error: '템플릿 내용이 비어 있습니다' }
    }

    if (hasDuplicateName(templates, normalizedName, id)) {
      return { ok: false, error: '같은 이름의 템플릿이 이미 있습니다' }
    }

    setTemplates((prev) =>
      prev.map((template) =>
        template.id === id
          ? {
              ...template,
              name: normalizedName,
              content: normalizedContent,
              durationSlots: normalizeDurationSlots(durationSlots),
              categoryId: normalizeCategoryId(categoryId),
            }
          : template,
      ),
    )

    return { ok: true }
  }

  const removeTemplate = (id: string): void => {
    setTemplates((prev) => prev.filter((template) => template.id !== id))
  }

  const clearTemplateCategory = (categoryId: string | null): void => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.categoryId === categoryId
          ? {
              ...template,
              categoryId: null,
            }
          : template,
      ),
    )
  }

  const reloadTemplates = (): void => {
    setTemplates(loadMeta().templates || [])
  }

  return {
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    clearTemplateCategory,
    reloadTemplates,
  }
}
