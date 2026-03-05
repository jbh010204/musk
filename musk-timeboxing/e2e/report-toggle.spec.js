import { expect, test } from '@playwright/test'

test('weekly and daily report cards can collapse and expand', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const main = page.locator('main:visible').first()
  const weeklyCard = main.locator('div', { hasText: '주간 리포트' }).first()
  const dailyCard = main.locator('div', { hasText: '오늘 리캡' }).first()

  await expect(weeklyCard).toBeVisible()
  await expect(dailyCard).toBeVisible()

  await weeklyCard.getByRole('button', { name: '접기' }).first().click()
  await expect(weeklyCard).toContainText('요약이 접혀 있습니다.')
  await weeklyCard.getByRole('button', { name: '펼치기' }).first().click()

  await dailyCard.getByRole('button', { name: '접기' }).first().click()
  await expect(dailyCard).toContainText('요약이 접혀 있습니다.')
  await dailyCard.getByRole('button', { name: '펼치기' }).first().click()
})
