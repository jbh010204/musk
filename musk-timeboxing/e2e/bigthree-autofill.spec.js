import { expect, test } from '@playwright/test'

test('brain dump can auto-fill big3 slots', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const input = page.getByPlaceholder('할 일을 입력하고 엔터...')
  await input.fill('자동채우기-1')
  await input.press('Enter')
  await input.fill('자동채우기-2')
  await input.press('Enter')
  await input.fill('자동채우기-3')
  await input.press('Enter')

  await page.getByTestId('brain-dump-fill-big3').click()

  await expect(page.locator('button[title="자동채우기-1"]').first()).toBeVisible()
  await expect(page.locator('button[title="자동채우기-2"]').first()).toBeVisible()
  await expect(page.locator('button[title="자동채우기-3"]').first()).toBeVisible()

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return {
      bigThreeCount: dayData.bigThree.length,
      sourceIdCount: dayData.bigThree.filter((item) => typeof item.sourceId === 'string').length,
    }
  })

  expect(stored?.bigThreeCount).toBe(3)
  expect(stored?.sourceIdCount).toBe(3)
})
