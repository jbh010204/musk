import { expect, test } from '@playwright/test'

test('floating action menu opens patch notes modal', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '빠른 메뉴' }).click()
  await page.getByRole('button', { name: '패치노트' }).click()

  await expect(page.getByText('패치노트').first()).toBeVisible()
  await expect(page.getByText('v0.10.0').first()).toBeVisible()

  await page.getByRole('button', { name: '닫기' }).first().click()
  await expect(page.getByText('패치노트').first()).toHaveCount(0)
})
