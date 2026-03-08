import { useEffect, useState } from 'react'
import { loadMeta, saveMeta, TOTAL_SLOTS } from '../../entities/planner'

const normalizeName = (value) => String(value || '').trim()
const normalizeContent = (value) => String(value || '').trim()
const normalizeDurationSlots = (value) =>
  Math.max(1, Math.min(TOTAL_SLOTS, Number.parseInt(value, 10) || 1))

const normalizeCategoryId = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const hasDuplicateName = (templates, name, excludeId = null) =>
  templates.some((template) => {
    if (excludeId && template.id === excludeId) {
      return false
    }

    return String(template.name || '').toLowerCase() === name.toLowerCase()
  })

export const useTemplateMeta = () => {
  const [templates, setTemplates] = useState(() => loadMeta().templates || [])

  useEffect(() => {
    saveMeta({ templates })
  }, [templates])

  const addTemplate = ({ name, content, durationSlots, categoryId = null }) => {
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

  const updateTemplate = (id, { name, content, durationSlots, categoryId = null }) => {
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

  const removeTemplate = (id) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id))
  }

  const reloadTemplates = () => {
    setTemplates(loadMeta().templates || [])
  }

  return {
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    reloadTemplates,
  }
}
