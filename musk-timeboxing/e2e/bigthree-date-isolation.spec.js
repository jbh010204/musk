import { expect, test } from '@playwright/test'

test('big three stays isolated by date when navigating days', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button:has-text("— 비어있음 —"):visible').first().click()
  await page.getByPlaceholder('빅3 입력 후 엔터').fill('빅3-날짜독립')
  await page.getByPlaceholder('빅3 입력 후 엔터').press('Enter')
  await expect(page.locator('button[title="빅3-날짜독립"]:visible').first()).toBeVisible()

  await page.locator('button[aria-label="다음 날짜"]').click()
  await expect(page.locator('button[title="빅3-날짜독립"]:visible')).toHaveCount(0)

  const nextDayBigThreeCount = await page.evaluate(() => {
    const dayKeys = Object.keys(window.localStorage)
      .filter((key) => /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key))
      .sort()

    const latestKey = dayKeys[dayKeys.length - 1]
    if (!latestKey) {
      return -1
    }

    const dayData = JSON.parse(window.localStorage.getItem(latestKey))
    return Array.isArray(dayData.bigThree) ? dayData.bigThree.length : -1
  })

  expect(nextDayBigThreeCount).toBe(0)

  await page.locator('button[aria-label="이전 날짜"]').click()
  await expect(page.locator('button[title="빅3-날짜독립"]:visible').first()).toBeVisible()
})
