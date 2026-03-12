import { expect, test } from '@playwright/test'

test('planner workspace composes board canvas and composer in one view', async ({ page }) => {
  await page.goto('/')

  const setup = await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-backend', name: 'Backend', color: '#22c55e', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-card-001',
            content: '워크스페이스 통합 배치 테스트',
            isDone: false,
            priority: 0,
            categoryId: 'cat-backend',
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: 'workspace seed',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          focusedLaneId: 'cat-backend',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )

    return { today }
  })

  await page.reload()
  await page.locator('[data-testid="timeline-view-workspace"]:visible').first().click()

  await expect(page.locator('[data-testid="planner-workspace-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="planning-canvas-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="schedule-composer-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="planning-board-card-workspace-card-001"]:visible').first()).toBeVisible()

  const canvasCard = page.locator('[data-testid="planning-board-card-workspace-card-001"]:visible').first()
  await canvasCard.click()
  await page.locator('[data-testid="composer-slot-10"]:visible').first().click()

  await expect(canvasCard).toContainText('예정 1')
  await expect(page.locator('[data-testid^="composer-block-"]').first()).toContainText(
    '워크스페이스 통합 배치 테스트',
  )

  await page.waitForFunction((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    if (!raw) {
      return false
    }

    const parsed = JSON.parse(raw)
    return (
      parsed?.timeBoxes?.length === 1 &&
      parsed?.brainDump?.find((item) => item.id === 'workspace-card-001')?.linkedTimeBoxIds?.length === 1 &&
      parsed?.stackCanvasState?.selectedCardId === null
    )
  }, setup.today)
})

test('planner workspace can drag a canvas card directly into the timeline rail', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-focus', name: '집중', color: '#6366f1', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-drag-card',
            content: '직접 드래그 배치 테스트',
            isDone: false,
            priority: 0,
            categoryId: 'cat-focus',
            stackOrder: 0,
            estimatedSlots: 3,
            linkedTimeBoxIds: [],
            note: '',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          focusedLaneId: 'cat-focus',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )
  })

  await page.reload()
  await page.locator('[data-testid="timeline-view-workspace"]:visible').first().click()

  const dragHandle = page.locator('[data-testid="planning-board-card-schedule-handle-workspace-drag-card"]').first()
  const targetSlot = page.locator('[data-testid="composer-slot-12"]:visible').first()
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())

  await dragHandle.dispatchEvent('dragstart', { dataTransfer })
  await targetSlot.dispatchEvent('dragenter', { dataTransfer })
  await targetSlot.dispatchEvent('dragover', { dataTransfer })
  await targetSlot.dispatchEvent('drop', { dataTransfer })
  await dragHandle.dispatchEvent('dragend', { dataTransfer })

  await expect(page.locator('[data-testid^="composer-block-"]').first()).toContainText('직접 드래그 배치 테스트')
  await expect(page.locator('[data-testid="planning-board-card-workspace-drag-card"]:visible').first()).toContainText(
    '예정 1',
  )
})
