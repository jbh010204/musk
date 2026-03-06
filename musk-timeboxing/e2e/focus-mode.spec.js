import { expect, test } from '@playwright/test'

test('timeline focus mode hides insight cards and persists', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await expect(page.getByText('주간 리포트').first()).toBeVisible()

  await page.locator('[data-testid="timeline-focus-toggle"]:visible').first().click()
  await expect(
    page.locator('main:visible').getByText('집중 모드가 활성화되어 인사이트 카드를 숨겼습니다.').first(),
  ).toBeVisible()
  await expect(page.getByText('주간 리포트').first()).toHaveCount(0)

  await page.reload()
  await expect(
    page.locator('main:visible').getByText('집중 모드가 활성화되어 인사이트 카드를 숨겼습니다.').first(),
  ).toBeVisible()
})
