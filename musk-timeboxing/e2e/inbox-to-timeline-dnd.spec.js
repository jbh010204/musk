import { expect, test } from '@playwright/test'

test('stack canvas schedule drag can drop a card into workspace timeline rail', async ({ page }) => {
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
        categories: [{ id: 'cat-work', name: '업무', color: '#6366f1', parentId: null, order: 0 }],
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
            id: 'workspace-dnd-card',
            content: '워크스페이스 드롭 테스트',
            isDone: false,
            priority: 0,
            categoryId: 'cat-work',
            stackOrder: 0,
            estimatedSlots: 2,
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
          selectedCardIds: [],
          focusedLaneId: 'cat-work',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )
  })

  await page.reload()
  await page.locator('[data-testid="timeline-view-workspace"]:visible').first().click()

  const source = page.locator('[data-testid="planning-board-card-schedule-handle-workspace-dnd-card"]:visible').first()
  const targetSlot = page.locator('[data-testid="workspace-slot-10"]:visible').first()
  await source.dragTo(targetSlot)

  await expect(page.locator('[data-testid^="workspace-timeline-block-"]:visible')).toHaveCount(1)
  await expect(page.locator('[data-testid="planning-board-card-workspace-dnd-card"]:visible').first()).toContainText('예정 1')
})

test('workspace timeline rail shows armed slots when a canvas card is selected', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('[data-testid="timeline-view-workspace"]:visible').first().click()
  await page.locator('[data-testid="planning-canvas-inbox-create"]:visible').first().click()
  await page.locator('[data-testid="planning-canvas-inbox-create-input"]:visible').first().fill('ARMED-카드')
  await page.locator('[data-testid="planning-canvas-inbox-create-input"]:visible').first().press('Enter')

  await page.locator('[data-testid^="planning-board-card-"]:visible').filter({ hasText: 'ARMED-카드' }).first().click()
  await expect(page.locator('[data-testid="workspace-slot-10"]:visible').first()).toHaveClass(/bg-indigo-500\/5/)
})

test('workspace big3 item can be scheduled directly into timeline rail slot', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('[data-testid="timeline-view-workspace"]:visible').first().click()
  await page.locator('[data-testid="workspace-bigthree-slot-0"]:visible').first().click()
  await page.getByPlaceholder('핵심 할 일을 입력').fill('BIG3-워크스페이스-배치')
  await page.getByPlaceholder('핵심 할 일을 입력').press('Enter')

  const bigThreeSlot = page.locator('[data-testid="workspace-bigthree-slot-0"]:visible').first()
  await bigThreeSlot.click()
  await page.locator('[data-testid="workspace-slot-11"]:visible').first().click()

  await expect(page.locator('[data-testid^="workspace-timeline-block-"]:visible')).toHaveCount(1)

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return dayData.timeBoxes.find((box) => box.content === 'BIG3-워크스페이스-배치') || null
  })

  expect(stored).toBeTruthy()
  expect(stored.startSlot).toBe(11)
})
