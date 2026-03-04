import { expect, test } from '@playwright/test'

test('duration preset creates multi-slot timebox', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()

  const input = page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)')
  await input.fill('프리셋-90분')
  await page.getByRole('button', { name: '90분 프리셋' }).click()
  await input.press('Enter')

  await expect(page.locator('button[title="프리셋-90분"]:visible').first()).toBeVisible()

  const saved = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      throw new Error('day key missing')
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return dayData.timeBoxes.find((box) => box.content === '프리셋-90분')
  })

  expect(saved).toBeTruthy()
  expect(saved.endSlot - saved.startSlot).toBe(3)
})
