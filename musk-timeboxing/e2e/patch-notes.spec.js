import { expect, test } from '@playwright/test'

test('floating action menu opens patch notes modal', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '빠른 메뉴' }).click()
  await page.getByRole('button', { name: '패치노트' }).click()

  await expect(page.getByText('패치노트').first()).toBeVisible()
  await expect(page.getByText('v0.13.0').first()).toBeVisible()
  await expect(page.getByText('v0.6.0').first()).toBeVisible()

  const latestToggle = page.getByTestId('patch-note-toggle-v0.13.0')
  const latestDetail = page.getByTestId('patch-note-detail-v0.13.0')
  await expect(latestDetail).toBeVisible()

  await latestToggle.click()
  await expect(latestDetail).toHaveCount(0)
  await latestToggle.click()
  await expect(latestDetail).toBeVisible()

  await page.getByRole('button', { name: '닫기' }).first().click()
  await expect(page.getByText('패치노트').first()).toHaveCount(0)
})
