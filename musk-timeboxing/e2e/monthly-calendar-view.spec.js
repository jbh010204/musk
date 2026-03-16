import { expect, test } from '@playwright/test'

test('monthly calendar view opens a detail sheet and can jump to a selected date', async ({ page }) => {
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
        schemaVersion: 5,
        categories: [],
        templates: [],
        deadlines: [
          {
            id: 'monthly-deadline-001',
            title: '월간 데드라인 테스트',
            dueDate: targetDate,
            taskId: null,
            taskDate: null,
            priority: 'MEDIUM',
            note: '',
            completedAt: null,
          },
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
            id: 'monthly-calendar-timebox',
            content: '월간캘린더-테스트',
            sourceId: null,
            startSlot: 12,
            endSlot: 13,
            status: 'COMPLETED',
            actualMinutes: 30,
            category: null,
            categoryId: null,
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
  await expect(page.locator('[data-testid="calendar-view-month"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="deadline-chip-monthly-deadline-001"]:visible').first()).toContainText(
    '월간 데드라인 테스트',
  )
  await expect(page.locator('[data-testid="month-day-detail-sheet-empty"]:visible').first()).toBeVisible()
  await expect(
    page.locator(`[data-testid="month-calendar-day-${setup.targetDate}"]:visible`).first(),
  ).toContainText('1건')

  await page.locator('[data-testid="deadline-chip-monthly-deadline-001"]:visible').first().click()

  await expect(page.locator('[data-testid="month-day-detail-sheet"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="month-day-detail-sheet"]:visible').first()).toContainText(
    '월간캘린더-테스트',
  )

  await page.locator('[data-testid="timeline-view-month"]:visible').first().click()
  await page.locator(`[data-testid="month-calendar-day-${setup.targetDate}"]:visible`).first().click()

  const detailSheet = page.locator('[data-testid="month-day-detail-sheet"]:visible').first()
  await expect(detailSheet).toBeVisible()
  await expect(detailSheet).toContainText('월간캘린더-테스트')

  await page.locator('[data-testid="month-day-detail-open-date"]:visible').first().click()

  await expect(page.locator('[data-testid="timeline-day-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[title="월간캘린더-테스트"]:visible').first()).toBeVisible()
})
