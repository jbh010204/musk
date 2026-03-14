import { expect, test } from '@playwright/test'

test('timeline insights skeleton appears during date navigation', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '다음 날짜' }).click()
  await expect(page.getByTestId('timeline-insights-skeleton').first()).toBeVisible()
  await expect(page.getByTestId('timeline-insights-skeleton').first()).toHaveCount(0)
})

test('brain dump item slides out on remove', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
  })
  await page.reload()

  await page.getByPlaceholder('할 일을 입력하고 엔터...').fill('SLIDE-삭제-테스트')
  await page.getByPlaceholder('할 일을 입력하고 엔터...').press('Enter')

  const card = page.locator('div[data-removing]:has([title="SLIDE-삭제-테스트"])').first()
  await expect(card).toHaveAttribute('data-removing', 'false')
  await card.hover()
  await card.getByRole('button', { name: '삭제', exact: true }).click()
  await expect(card).toHaveAttribute('data-removing', 'true')
  await expect(card).toHaveCount(0)
})
