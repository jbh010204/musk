import { expect, test } from '@playwright/test'

test('monthly calendar exposes category and completion heatmap for dense days', async ({ page }) => {
  await page.goto('/')

  const setup = await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const todayDate = new Date()
    const today = formatDate(todayDate)
    const target = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)

    if (formatDate(target) === today) {
      target.setDate(2)
    }

    const targetDate = formatDate(target)

    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 2,
        categories: [
          { id: 'cat-deep', name: '딥워크', color: '#16a34a' },
          { id: 'cat-ops', name: '운영', color: '#2563eb' },
        ],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${targetDate}`,
      JSON.stringify({
        schemaVersion: 2,
        date: targetDate,
        brainDump: [],
        bigThree: [],
        timeBoxes: [
          {
            id: 'heatmap-box-1',
            content: '집중 블록 1',
            sourceId: null,
            startSlot: 4,
            endSlot: 6,
            status: 'COMPLETED',
            actualMinutes: 60,
            category: null,
            categoryId: 'cat-deep',
            skipReason: null,
            timerStartedAt: null,
            elapsedSeconds: 0,
          },
          {
            id: 'heatmap-box-2',
            content: '집중 블록 2',
            sourceId: null,
            startSlot: 7,
            endSlot: 9,
            status: 'PLANNED',
            actualMinutes: null,
            category: null,
            categoryId: 'cat-deep',
            skipReason: null,
            timerStartedAt: null,
            elapsedSeconds: 0,
          },
          {
            id: 'heatmap-box-3',
            content: '운영 회의',
            sourceId: null,
            startSlot: 10,
            endSlot: 11,
            status: 'COMPLETED',
            actualMinutes: 30,
            category: null,
            categoryId: 'cat-ops',
            skipReason: null,
            timerStartedAt: null,
            elapsedSeconds: 0,
          },
        ],
      }),
    )

    return { targetDate }
  })

  await page.reload()

  await page.locator('[data-testid="timeline-view-month"]:visible').first().click()

  const legend = page.locator('[data-testid="calendar-view-month-legend"]:visible').first()
  await expect(legend).toContainText('딥워크')
  await expect(legend).toContainText('운영')

  const cell = page.locator(`[data-testid="month-calendar-day-${setup.targetDate}"]:visible`).first()
  await expect(cell).toHaveAttribute('data-dominant-category', '딥워크')
  await expect(cell).toHaveAttribute('data-heat-intensity', /[1-4]/)
  await expect(cell).toContainText('완료 2/3')
})
