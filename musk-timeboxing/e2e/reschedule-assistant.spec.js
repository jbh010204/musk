import { expect, test } from '@playwright/test'

test('reschedule assistant applies planned boxes to next day', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="10:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('재배치-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  await page.getByRole('button', { name: '자동 재배치' }).first().click()
  await expect(page.getByText('자동 재배치 어시스턴트').first()).toBeVisible()
  await page.getByRole('button', { name: '다음 날에 배치 적용' }).click()

  const result = await page.evaluate(() => {
    const today = new Date()
    const formatDate = (date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const next = new Date(today)
    next.setDate(today.getDate() + 1)
    const nextKey = `musk-planner-${formatDate(next)}`
    const payload = JSON.parse(window.localStorage.getItem(nextKey) || '{}')
    return Array.isArray(payload.timeBoxes)
      ? payload.timeBoxes.find((box) => box.content === '재배치-테스트') || null
      : null
  })

  expect(result).toBeTruthy()
  expect(result.status).toBe('PLANNED')
})
