import { expect, test } from '@playwright/test'

test('weekly strip allows direct date jump', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const currentDate = await page.evaluate(() => window.localStorage.getItem('musk-planner-last-date'))
  expect(currentDate).toBeTruthy()

  const formatHeadingLabel = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return `${year}년 ${month}월 ${day}일`
  }

  const expectedCurrentHeading = formatHeadingLabel(currentDate)

  await expect(page.getByRole('heading', { level: 1 })).toContainText(expectedCurrentHeading)

  await page.locator('button[aria-label="다음 날짜"]').click()
  await expect(page.getByRole('heading', { level: 1 })).not.toContainText(expectedCurrentHeading)

  await page.getByTestId(`week-strip-day-${currentDate}`).scrollIntoViewIfNeeded()
  await page.getByTestId(`week-strip-day-${currentDate}`).click()

  await expect(page.getByRole('heading', { level: 1 })).toContainText(expectedCurrentHeading)
  const lastDate = await page.evaluate(() => window.localStorage.getItem('musk-planner-last-date'))
  expect(lastDate).toBe(currentDate)
})
