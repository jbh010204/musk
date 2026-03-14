import { expect, test } from '@playwright/test'

test('header shows local persistence badge when server storage is disabled', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
  })
  await page.reload()

  await expect(page.getByText('로컬 저장').first()).toBeVisible()

  await page.getByPlaceholder('할 일을 입력하고 엔터...').fill('저장배지-테스트')
  await page.getByPlaceholder('할 일을 입력하고 엔터...').press('Enter')

  await expect(page.getByText('로컬 저장').first()).toBeVisible()
})
