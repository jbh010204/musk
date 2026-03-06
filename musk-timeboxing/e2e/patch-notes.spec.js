import { expect, test } from '@playwright/test'

test('floating action menu opens patch notes modal', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '빠른 메뉴' }).click()
  await page.getByRole('button', { name: '패치노트' }).click()

  await expect(page.getByText('패치노트').first()).toBeVisible()
  await expect(page.locator('[data-testid^="patch-note-toggle-"]').first()).toBeVisible()
  await expect(page.getByText('v0.6.0').first()).toBeVisible()

  const latestToggle = page.locator('[data-testid^="patch-note-toggle-"]').first()
  const latestToggleId = await latestToggle.getAttribute('data-testid')
  if (!latestToggleId) {
    throw new Error('latest patch-note toggle id is missing')
  }

  const latestDetail = page.getByTestId(latestToggleId.replace('toggle', 'detail'))
  await expect(latestDetail).toBeVisible()

  await latestToggle.click()
  await expect(latestDetail).toHaveCount(0)
  await latestToggle.click()
  await expect(latestDetail).toBeVisible()

  await page.getByRole('button', { name: '닫기' }).first().click()
  await expect(page.getByText('패치노트').first()).toHaveCount(0)
})
