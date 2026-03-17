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

test('weekly strip does not leave highlight residue after rapid date changes', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  for (let i = 0; i < 5; i += 1) {
    await page.getByRole('button', { name: '다음 날짜' }).click()
  }

  const stripState = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[data-testid^="week-strip-day-"]')]
    return nodes.map((node) => {
      const style = getComputedStyle(node)
      return {
        date: node.getAttribute('data-testid')?.replace('week-strip-day-', ''),
        current: node.getAttribute('aria-current') === 'date',
        boxShadow: style.boxShadow,
      }
    })
  })

  const highlighted = stripState.filter((item) => item.boxShadow !== 'none')
  const current = stripState.filter((item) => item.current)

  expect(current).toHaveLength(1)
  expect(highlighted).toHaveLength(1)
  expect(highlighted[0].date).toBe(current[0].date)
})
