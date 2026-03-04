import { expect, test } from '@playwright/test'

test('weekly strip allows direct date jump', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('주간스트립-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')
  await expect(page.locator('button[title="주간스트립-테스트"]:visible').first()).toBeVisible()

  const currentDate = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      throw new Error('day key not found')
    }
    return dayKey.replace('musk-planner-', '')
  })

  await page.locator('button[aria-label="다음 날짜"]').click()
  await expect(page.locator('button[title="주간스트립-테스트"]:visible').first()).toBeVisible()

  await page.locator(`button[aria-label="${currentDate} 이동"]`).click()
  await expect(page.locator('button[title="주간스트립-테스트"]:visible').first()).toBeVisible()
})
