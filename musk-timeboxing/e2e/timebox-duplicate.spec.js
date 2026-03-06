import { expect, test } from '@playwright/test'

test('timebox can be duplicated from completion modal', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('복제-원본-일정')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  await page.locator('button[title="복제-원본-일정"]:visible').first().click()
  await page.locator('.ui-modal-card').getByRole('button', { name: '복제', exact: true }).click()

  await expect(page.locator('button[title="복제-원본-일정 (복제)"]:visible').first()).toBeVisible()

  const counts = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return {
      originalCount: dayData.timeBoxes.filter((item) => item.content === '복제-원본-일정').length,
      copyCount: dayData.timeBoxes.filter((item) => item.content === '복제-원본-일정 (복제)').length,
    }
  })

  expect(counts?.originalCount).toBe(1)
  expect(counts?.copyCount).toBe(1)
})
