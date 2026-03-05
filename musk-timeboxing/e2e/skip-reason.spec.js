import { expect, test } from '@playwright/test'

test('skip reason is saved and displayed', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('스킵사유-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const box = page.locator('button[title="스킵사유-테스트"]:visible').first()
  await box.focus()
  await page.keyboard.press('Enter')

  await page.getByRole('button', { name: '건너뜀 ✗' }).click()
  await page.selectOption('#skip-reason', { label: '외부 일정/방해' })
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.locator('button[title="스킵사유-테스트"]:visible').first()).toContainText(
    '사유: 외부 일정/방해',
  )
  await expect(page.getByText('주요 스킵 사유 외부 일정/방해').first()).toBeVisible()

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return dayData.timeBoxes.find((item) => item.content === '스킵사유-테스트') || null
  })

  expect(stored).toBeTruthy()
  expect(stored.status).toBe('SKIPPED')
  expect(stored.skipReason).toBe('외부 일정/방해')
})
