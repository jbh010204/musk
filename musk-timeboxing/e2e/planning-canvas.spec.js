import { expect, test } from '@playwright/test'

test('planning canvas creates a card and keeps it after reload', async ({ page }) => {
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
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
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
        brainDump: [],
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
  await expect(page.locator('[data-testid="planning-canvas-view"]:visible').first()).toBeVisible()

  await page.locator('[data-testid="planning-canvas-open-create"]:visible').first().click()
  await page.locator('[data-testid="planning-canvas-open-create-input"]:visible').first().fill('스택 캔버스 카드 생성')
  await page.locator('[data-testid="planning-canvas-open-create-input"]:visible').first().press('Enter')

  await expect(page.locator('[data-testid="planning-board-lane-cat-backend"]:visible').first()).toContainText(
    '스택 캔버스 카드 생성',
  )

  await page.reload()
  await expect(page.locator('[data-testid="planning-board-lane-cat-backend"]:visible').first()).toContainText(
    '스택 캔버스 카드 생성',
  )

  const stored = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(stored.brainDump.some((item) => item.content === '스택 캔버스 카드 생성')).toBe(true)
  expect(stored.brainDump.find((item) => item.content === '스택 캔버스 카드 생성')?.categoryId).toBe('cat-backend')
  expect(stored.stackCanvasState.version).toBe(2)
})

test('planning canvas editor stores a linked deadline in planner meta', async ({ page }) => {
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
    const due = formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 5,
        categories: [{ id: 'cat-deadline', name: 'Deadline', color: '#ef4444', parentId: null, order: 0 }],
        templates: [],
        deadlines: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 5,
        date: today,
        brainDump: [
          {
            id: 'canvas-card-deadline',
            content: '마감 저장 테스트',
            isDone: false,
            priority: 0,
            categoryId: 'cat-deadline',
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
          focusedLaneId: 'cat-deadline',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )

    return { today, due }
  })

  await page.reload()

  const card = page.locator('[data-testid="planning-board-card-canvas-card-deadline"]:visible').first()
  await card.getByLabel('카드 수정').click()
  await page.locator('#board-card-deadline-date').fill(setup.due)
  await page.locator('#board-card-deadline-priority').selectOption('HIGH')
  await page.locator('#board-card-deadline-note').fill('중요도 높은 마감')
  await page.getByRole('button', { name: '저장', exact: true }).click()

  await page.waitForFunction(
    ({ today, due }) => {
      const rawMeta = window.localStorage.getItem('musk-planner-meta')
      if (!rawMeta) {
        return false
      }

      const parsedMeta = JSON.parse(rawMeta)
      const deadline = parsedMeta?.deadlines?.find((item) => item.taskId === 'canvas-card-deadline')
      return (
        deadline?.dueDate === due &&
        deadline?.priority === 'HIGH' &&
        deadline?.taskDate === today &&
        deadline?.note === '중요도 높은 마감'
      )
    },
    { today: setup.today, due: setup.due },
  )
})

test('planning canvas moves cards between uncategorized and category stacks', async ({ page }) => {
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
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
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
            id: 'canvas-card-001',
            content: '캔버스 분류 테스트',
            isDone: false,
            priority: 0,
            categoryId: null,
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
          focusedLaneId: 'uncategorized',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )

    return { today }
  })

  await page.reload()
  await page.locator('[data-testid="planning-board-card-canvas-card-001"]:visible').first().click()
  await page.locator('[data-testid="planning-board-node-cat-backend"]:visible').first().click()

  await expect(page.locator('[data-testid="planning-board-lane-cat-backend"]:visible').first()).toContainText(
    '캔버스 분류 테스트',
  )

  const stored = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(stored.brainDump[0].categoryId).toBe('cat-backend')
})

test('planning canvas migrates legacy boardCanvas storage into stackCanvasState', async ({ page }) => {
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
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [],
        bigThree: [],
        timeBoxes: [],
        boardCanvas: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: 'legacy-card-id',
          focusedLaneId: 'uncategorized',
          migratedFromLegacyBoard: false,
          lastSyncedAt: 12345,
        },
      }),
    )

    return { today }
  })

  await page.reload()
  await expect(page.locator('[data-testid="planning-canvas-view"]:visible').first()).toBeVisible()

  const stored = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(stored.boardCanvas).toBeUndefined()
  expect(stored.stackCanvasState).toMatchObject({
    version: 2,
    layoutMode: 'stack',
    selectedCardId: 'legacy-card-id',
    focusedLaneId: 'uncategorized',
  })
})

test('planning canvas keeps only uncategorized active when uncategorized dock is selected', async ({ page }) => {
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
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-personal', name: '개인', color: '#8b5cf6', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          focusedLaneId: 'cat-personal',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )
  })

  await page.reload()

  const uncategorizedNode = page.locator('[data-testid="planning-board-node-uncategorized"]:visible').first()
  const personalNode = page.locator('[data-testid="planning-board-node-cat-personal"]:visible').first()

  await expect(personalNode).toHaveAttribute('aria-pressed', 'true')
  await uncategorizedNode.click()
  await expect(uncategorizedNode).toHaveAttribute('aria-pressed', 'true')
  await expect(personalNode).toHaveAttribute('aria-pressed', 'false')
})
