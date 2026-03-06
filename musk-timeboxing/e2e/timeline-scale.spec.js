import { expect, test } from '@playwright/test'

test('timeline scale toggle switches row density between 30 and 15 view', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const slot0900 = page.locator('button[aria-label="09:00 슬롯"]:visible').first()
  const before = await slot0900.boundingBox()
  if (!before) {
    throw new Error('09:00 slot not found')
  }

  await page.locator('[data-testid="timeline-scale-15"]:visible').first().click()
  const detail = await slot0900.boundingBox()
  if (!detail) {
    throw new Error('09:00 slot not found after 15-minute toggle')
  }

  expect(detail.height).toBeGreaterThan(before.height * 1.8)

  await page.locator('[data-testid="timeline-scale-30"]:visible').first().click()
  const back = await slot0900.boundingBox()
  if (!back) {
    throw new Error('09:00 slot not found after 30-minute toggle')
  }

  expect(back.height).toBeLessThan(detail.height * 0.7)
})
