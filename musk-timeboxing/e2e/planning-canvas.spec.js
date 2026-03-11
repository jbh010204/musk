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

test('planning canvas inspector edits the selected board card and syncs back to storage', async ({
  page,
}) => {
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

  const card = page.locator('[data-testid="canvas-task-card-canvas-card-001"]')
  await expect(card).toBeVisible()
  await page.evaluate(() => window.__plannerCanvasSelectCard('canvas-card-001'))

  const titleInput = page.locator('[data-testid="planning-canvas-card-title-input"]')
  await expect(titleInput).toHaveValue('로그인 API 개발')

  await titleInput.fill('로그인 API 인증 개발')
  await page.locator('[data-testid="planning-canvas-card-duration-select"]').selectOption('4')
  await page.locator('[data-testid="planning-canvas-card-note-input"]').fill('토큰/세션 흐름 포함')
  await page.locator('[data-testid="planning-canvas-inspector-card"] button:has-text("저장")').click()

  await page.waitForFunction((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    if (!raw) {
      return false
    }

    const parsed = JSON.parse(raw)
    const item = parsed?.brainDump?.find((entry) => entry.id === 'canvas-card-001')
    return (
      item?.content === '로그인 API 인증 개발' &&
      item?.estimatedSlots === 4 &&
      item?.note === '토큰/세션 흐름 포함'
    )
  }, setup.today)

  await expect(page.locator('text=로그인 API 인증 개발').first()).toBeVisible()
})
