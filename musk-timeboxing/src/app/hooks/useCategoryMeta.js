import { useEffect, useState } from 'react'
import { loadMeta, saveMeta } from '../../entities/planner'

const normalizeName = (value) => String(value || '').trim()
const normalizeColor = (value) => {
  const raw = String(value || '').trim()
  const isHex = /^#[0-9a-fA-F]{6}$/.test(raw)
  return isHex ? raw : '#6366f1'
}

const hasDuplicateName = (categories, name, excludeId = null) => {
  return categories.some((category) => {
    if (excludeId && category.id === excludeId) {
      return false
    }

    return String(category.name || '').toLowerCase() === name.toLowerCase()
  })
}

export const useCategoryMeta = () => {
  const [categories, setCategories] = useState(() => loadMeta().categories)

  useEffect(() => {
    saveMeta({ categories })
  }, [categories])

  const addCategory = (name, color) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName) {
      return { ok: false, error: '카테고리 이름을 입력해 주세요' }
    }

    if (hasDuplicateName(categories, normalizedName)) {
      return { ok: false, error: '같은 이름의 카테고리가 이미 있습니다' }
    }

    setCategories((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: normalizedName,
        color: normalizeColor(color),
      },
    ])

    return { ok: true }
  }

  const updateCategory = (id, name, color) => {
    const normalizedName = normalizeName(name)
    if (!normalizedName) {
      return { ok: false, error: '카테고리 이름을 입력해 주세요' }
    }

    if (hasDuplicateName(categories, normalizedName, id)) {
      return { ok: false, error: '같은 이름의 카테고리가 이미 있습니다' }
    }

    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== id) {
          return category
        }

        return {
          ...category,
          name: normalizedName,
          color: normalizeColor(color),
        }
      }),
    )

    return { ok: true }
  }

  const removeCategory = (id) => {
    setCategories((prev) => prev.filter((category) => category.id !== id))
  }

  const reloadCategories = () => {
    setCategories(loadMeta().categories)
  }

  return {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    reloadCategories,
  }
}
