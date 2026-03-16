import { expect, test } from '@playwright/test'

test('weekly calendar view summarizes the week and can jump to a selected date', async ({ page }) => {
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
    const monday = new Date(todayDate)
    const weekday = monday.getDay()
    monday.setDate(monday.getDate() + (weekday === 0 ? -6 : 1 - weekday))

    const targetDate = formatDate(
      formatDate(monday) === today ? new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 1) : monday,
    )

    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 5,
        categories: [],
        templates: [],
        deadlines: [
          {
            id: 'weekly-deadline-001',
            title: '주간 데드라인 테스트',
            dueDate: targetDate,
            taskId: null,
            taskDate: null,
            priority: 'HIGH',
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
            id: 'weekly-calendar-timebox',
            content: '주간캘린더-테스트',
            sourceId: null,
            startSlot: 8,
            endSlot: 10,
            status: 'PLANNED',
            actualMinutes: null,
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

  await page.locator('[data-testid="timeline-view-week"]:visible').first().click()
  await expect(page.locator('[data-testid="calendar-view-week"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="deadline-chip-weekly-deadline-001"]:visible').first()).toContainText(
    '주간 데드라인 테스트',
  )
  await expect(
    page.locator(`[data-testid="week-calendar-day-${setup.targetDate}"]:visible`).first(),
  ).toContainText('주간캘린더-테스트')

  await page.locator('[data-testid="deadline-chip-weekly-deadline-001"]:visible').first().click()

  await expect(page.locator('[data-testid="timeline-day-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[title="주간캘린더-테스트"]:visible').first()).toBeVisible()

  await page.locator('[data-testid="timeline-view-week"]:visible').first().click()
  await page.locator('[data-testid="deadline-complete-weekly-deadline-001"]:visible').first().click()

  await expect(page.locator('[data-testid="deadline-chip-weekly-deadline-001"]:visible')).toHaveCount(0)
  await page.waitForFunction(() => {
    const rawMeta = window.localStorage.getItem('musk-planner-meta')
    if (!rawMeta) {
      return false
    }

    const parsedMeta = JSON.parse(rawMeta)
    const deadline = parsedMeta?.deadlines?.find((item) => item.id === 'weekly-deadline-001')
    return typeof deadline?.completedAt === 'string' && deadline.completedAt.length > 0
  })
})
