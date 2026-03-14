import { expect, test } from '@playwright/test'

const seedPlannerStorage = async (page, callback) => page.evaluate(callback)

test('legacy composer view is removed and old composer entries fall back to day timeline', async ({
  page,
}) => {
  await page.goto('/')

  await seedPlannerStorage(page, () => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem('musk-planner-last-view-mode', 'COMPOSER')
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
            note: '옛 편성기 복원값이 남아 있어도 일간 뷰로 열려야 합니다.',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
      }),
    )
  })

  await page.reload()

  await expect(page.locator('[data-testid="timeline-view-composer"]')).toHaveCount(0)
  await expect(page.locator('[data-testid="timeline-day-view"]').first()).toBeVisible()

  const persistedViewMode = await page.evaluate(() => window.localStorage.getItem('musk-planner-last-view-mode'))
  expect(persistedViewMode).toBe('DAY')

  await page.evaluate(() => window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS'))
  await page.reload()
  await page.getByRole('button', { name: '우측 타임라인 보기', exact: true }).click()
  await expect(page.locator('[data-testid="timeline-day-view"]').first()).toBeVisible()
})
