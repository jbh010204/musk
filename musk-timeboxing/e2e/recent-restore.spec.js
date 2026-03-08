import { expect, test } from '@playwright/test'

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

test('refresh restores the most recently used date and focus slot', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="다음 날짜"]').click()
  await page.locator('button[aria-label="다음 날짜"]').click()

  const target = new Date()
  target.setDate(target.getDate() + 2)
  const expectedDate = formatDate(target)

  await page.locator('button[aria-label="13:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('최근복원-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  await page.reload()

  const restored = await page.evaluate(() => {
    return {
      lastDate: window.localStorage.getItem('musk-planner-last-date'),
      lastFocusRaw: window.localStorage.getItem('musk-planner-last-focus'),
    }
  })

  expect(restored.lastDate).toBe(expectedDate)
  expect(restored.lastFocusRaw).toBeTruthy()

  const lastFocus = JSON.parse(restored.lastFocusRaw)
  expect(lastFocus.date).toBe(expectedDate)
  expect(lastFocus.slot).toBeGreaterThanOrEqual(15)
  expect(lastFocus.slot).toBeLessThanOrEqual(16)

  await expect(page.locator('main [title="최근복원-테스트"]:visible').first()).toBeVisible()
})
