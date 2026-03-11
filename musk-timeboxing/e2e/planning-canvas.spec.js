import { expect, test } from '@playwright/test'

test('planning canvas initializes and persists a boardCanvas snapshot per day', async ({ page }) => {
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
        categories: [{ id: 'cat-backend', name: 'Backend', color: '#22c55e' }],
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
            id: 'canvas-card-001',
            content: '로그인 API 개발',
            isDone: false,
            priority: 0,
            categoryId: 'cat-backend',
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: 'canvas seed',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        boardCanvas: {
          version: 1,
          document: null,
          session: null,
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )

    return { today }
  })

  await page.reload()

  await page.locator('[data-testid="timeline-view-canvas"]:visible').first().click()
  await expect(page.locator('[data-testid="planning-canvas-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="planning-canvas-surface"]:visible').first()).toBeVisible()

  await page.waitForFunction((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    if (!raw) {
      return false
    }

    const parsed = JSON.parse(raw)
    return Boolean(parsed?.boardCanvas?.document && parsed?.boardCanvas?.session)
  }, setup.today)

  const stored = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(stored.boardCanvas.version).toBe(1)
  expect(stored.boardCanvas.migratedFromLegacyBoard).toBe(true)
  expect(stored.boardCanvas.document).not.toBeNull()
  expect(stored.boardCanvas.session).not.toBeNull()
})
