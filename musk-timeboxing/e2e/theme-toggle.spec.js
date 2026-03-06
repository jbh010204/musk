import { expect, test } from '@playwright/test'

test('theme toggle persists after refresh', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const toggle = page.getByRole('button', { name: '테마 전환' }).first()
  await expect(toggle).toContainText('라이트')
  await toggle.click()
  await expect(toggle).toContainText('다크')

  const persisted = await page.evaluate(() => window.localStorage.getItem('musk-planner-theme'))
  expect(persisted).toBe('light')

  await page.reload()
  await expect(page.getByRole('button', { name: '테마 전환' }).first()).toContainText('다크')
})
