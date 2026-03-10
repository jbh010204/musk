import { expect, test } from '@playwright/test'

const seedBaseStorage = async (page, callback) => {
  return page.evaluate(callback)
}

test('planning board creates a card and keeps it after reload, composer view also opens', async ({ page }) => {
  await page.goto('/')

  const setup = await seedBaseStorage(page, () => {
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
        schemaVersion: 3,
        categories: [{ id: 'cat-club', name: '동아리', color: '#f97316' }],
        templates: [],
      }),
    )

    return { today }
  })

  await page.reload()

  await page.locator('[data-testid="timeline-view-board"]:visible').first().click()
  await expect(page.locator('[data-testid="planning-board-view"]:visible').first()).toBeVisible()

  await page.locator('[data-testid="planning-board-open-create"]:visible').first().click()
  await page.locator('#board-card-content').fill('보드 카드 생성 테스트')
  await page.selectOption('#board-card-category', 'cat-club')
  await page.selectOption('#board-card-duration', '3')
  await page.locator('#board-card-note').fill('보드에서 만든 카드가 reload 후에도 남아야 합니다.')
  await page.locator('.ui-modal-card').last().getByRole('button', { name: '추가', exact: true }).click()

  await expect(page.locator('[data-testid="planning-board-lane-cat-club"]:visible').first()).toContainText(
    '보드 카드 생성 테스트',
  )

  await page.locator('[data-testid="timeline-view-composer"]:visible').first().click()
  await expect(page.locator('[data-testid="schedule-composer-view"]:visible').first()).toBeVisible()

  await page.reload()
  await page.locator('[data-testid="timeline-view-board"]:visible').first().click()
  await expect(page.locator('[data-testid="planning-board-lane-cat-club"]:visible').first()).toContainText(
    '보드 카드 생성 테스트',
  )

  const stored = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(stored.brainDump[0].categoryId).toBe('cat-club')
  expect(stored.brainDump[0].estimatedSlots).toBe(3)
  expect(stored.brainDump[0].createdFrom).toBe('board')
})

test('planning board selected card can move from uncategorized stack to category node', async ({ page }) => {
  await page.goto('/')

  const setup = await seedBaseStorage(page, () => {
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
        schemaVersion: 3,
        categories: [{ id: 'cat-study', name: '개인', color: '#6366f1' }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 3,
        date: today,
        brainDump: [
          {
            id: 'board-seed-card',
            content: '보드 카테고리 이동 테스트',
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
      }),
    )

    return { today }
  })

  await page.reload()

  await page.locator('[data-testid="timeline-view-board"]:visible').first().click()
  await page.locator('[data-testid="planning-board-card-board-seed-card"]:visible').first().click()
  await page.locator('[data-testid="planning-board-node-cat-study"]:visible').first().click()

  await expect(page.locator('[data-testid="planning-board-lane-cat-study"]:visible').first()).toContainText(
    '보드 카테고리 이동 테스트',
  )

  const stored = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(stored.brainDump[0].categoryId).toBe('cat-study')
})
