import { expect, test } from '@playwright/test'

const seedPlannerStorage = async (page, callback) => page.evaluate(callback)

test('schedule composer creates timeboxes from board cards and keeps links in sync after delete', async ({
  page,
}) => {
  await page.goto('/')

  const setup = await seedPlannerStorage(page, () => {
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
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 3,
        date: today,
        brainDump: [
          {
            id: 'board-composer-card',
            content: '편성기 배치 테스트',
            isDone: false,
            priority: 0,
            categoryId: 'cat-club',
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: '큐에서 시간표로 배치한 뒤 링크가 유지되어야 합니다.',
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

  await page.locator('[data-testid="timeline-view-composer"]:visible').first().click()
  await expect(page.locator('[data-testid="schedule-composer-view"]:visible').first()).toBeVisible()

  const queueCard = page.locator('[data-testid="composer-queue-card-board-composer-card"]:visible').first()
  await expect(queueCard).toContainText('미배치')

  await queueCard.click()
  await page.locator('[data-testid="composer-slot-8"]:visible').first().click()

  await expect(queueCard).toContainText('예정 1')
  await expect(page.locator('[data-testid^="composer-block-"]').first()).toContainText('편성기 배치 테스트')

  const storedAfterCreate = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(storedAfterCreate.timeBoxes).toHaveLength(1)
  expect(storedAfterCreate.timeBoxes[0].sourceId).toBe('board-composer-card')
  expect(storedAfterCreate.timeBoxes[0].categoryId).toBe('cat-club')
  expect(storedAfterCreate.brainDump[0].linkedTimeBoxIds).toHaveLength(1)

  await page.locator('[data-testid="timeline-view-board"]:visible').first().click()
  await expect(page.locator('[data-testid="planning-board-card-board-composer-card"]:visible').first()).toContainText(
    '예정 1',
  )

  page.on('dialog', async (dialog) => {
    await dialog.accept()
  })

  await page.locator('[data-testid="timeline-view-day"]:visible').first().click()
  await page.locator('[data-testid="timebox-card"]').first().click()
  await page.locator('.ui-modal-card').last().getByRole('button', { name: '삭제', exact: true }).click()

  await page.locator('[data-testid="timeline-view-composer"]:visible').first().click()
  await expect(queueCard).toContainText('미배치')

  const storedAfterDelete = await page.evaluate((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    return raw ? JSON.parse(raw) : null
  }, setup.today)

  expect(storedAfterDelete.timeBoxes).toHaveLength(0)
  expect(storedAfterDelete.brainDump[0].linkedTimeBoxIds).toEqual([])
})
