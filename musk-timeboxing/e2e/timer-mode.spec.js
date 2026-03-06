import { expect, test } from '@playwright/test'

test('timebox timer can start and complete with auto actual minutes', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('타이머-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const timerStart = page.locator('button[aria-label="타이머 시작"]:visible').first()
  await timerStart.click()
  await page.waitForTimeout(1200)

  const timerComplete = page.locator('button[aria-label="타이머 완료 처리"]:visible').first()
  await timerComplete.click()

  const stored = await page.evaluate(() => {
    const key = Object.keys(window.localStorage).find((item) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(item),
    )
    if (!key) {
      return null
    }

    const data = JSON.parse(window.localStorage.getItem(key))
    return data.timeBoxes.find((box) => box.content === '타이머-테스트') || null
  })

  expect(stored).toBeTruthy()
  expect(stored.status).toBe('COMPLETED')
  expect(stored.actualMinutes).toBeGreaterThanOrEqual(1)
})
