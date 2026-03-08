import { expect, test } from '@playwright/test'

test('weekly calendar quick add creates a timebox on the selected date', async ({ page }) => {
  await page.goto('/')

  const setup = await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = new Date()
    const todayStr = formatDate(today)
    window.localStorage.setItem('musk-planner-last-date', todayStr)

    return { todayStr }
  })

  await page.reload()

  await page.locator('[data-testid="timeline-view-week"]:visible').first().click()
  await page.locator(`[data-testid="week-calendar-quick-add-${setup.todayStr}"]:visible`).first().click()
  await page.locator('#quick-add-content').fill('주간 퀵 추가')
  await page.selectOption('#quick-add-start-slot', '6')
  await page.locator('.ui-modal-card').last().getByRole('button', { name: '추가', exact: true }).click()

  await expect(page.locator(`[data-testid="week-calendar-day-${setup.todayStr}"]:visible`).first()).toContainText(
    '주간 퀵 추가',
  )

  await page.locator(`[data-testid="week-calendar-day-${setup.todayStr}"]:visible`).first().click()
  await expect(page.locator('[title="주간 퀵 추가"]:visible').first()).toBeVisible()
})

test('monthly calendar quick add creates a timebox on the selected date', async ({ page }) => {
  await page.goto('/')

  const setup = await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = new Date()
    const target = new Date(today.getFullYear(), today.getMonth(), Math.min(today.getDate() + 1, 28))
    const todayStr = formatDate(today)
    const targetDate = formatDate(target)
    window.localStorage.setItem('musk-planner-last-date', todayStr)

    return { targetDate }
  })

  await page.reload()

  await page.locator('[data-testid="timeline-view-month"]:visible').first().click()
  await page.locator(`[data-testid="month-calendar-quick-add-${setup.targetDate}"]:visible`).first().click()
  await page.locator('#quick-add-content').fill('월간 퀵 추가')
  await page.selectOption('#quick-add-start-slot', '10')
  await page.locator('.ui-modal-card').last().getByRole('button', { name: '추가', exact: true }).click()

  await expect(page.locator(`[data-testid="month-calendar-day-${setup.targetDate}"]:visible`).first()).toContainText(
    '월간 퀵 추가',
  )

  await page.locator(`[data-testid="month-calendar-day-${setup.targetDate}"]:visible`).first().click()
  await expect(page.locator('[title="월간 퀵 추가"]:visible').first()).toBeVisible()
})
