import { expect, test } from '@playwright/test'

test('unfinished timeboxes are auto-carried to next day once', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('자동이월-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')
  await expect(page.locator('[title="자동이월-테스트"]:visible').first()).toBeVisible()

  await page.locator('button[aria-label="다음 날짜"]').click()
  await expect(page.locator('[title="자동이월-테스트"]:visible').first()).toBeVisible()

  await page.locator('button[aria-label="이전 날짜"]').click()
  await page.locator('button[aria-label="다음 날짜"]').click()

  const snapshot = await page.evaluate(() => {
    const dayKeys = Object.keys(window.localStorage)
      .filter((key) => /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key))
      .sort()

    const days = dayKeys.map((key) => ({
      date: key.replace('musk-planner-', ''),
      data: JSON.parse(window.localStorage.getItem(key)),
    }))

    return {
      days,
    }
  })

  expect(snapshot.days.length).toBeGreaterThanOrEqual(2)
  const nextDay = snapshot.days[snapshot.days.length - 1]
  const moved = nextDay.data.timeBoxes.filter((box) => box.content === '자동이월-테스트')
  expect(moved).toHaveLength(1)
  expect(moved[0].status).toBe('PLANNED')
})
