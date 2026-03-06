import { expect, test } from '@playwright/test'

test('header shows big3 completion progress', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const header = page.locator('header').first()
  await expect(header).toContainText('0/3')

  await page.getByRole('button', { name: '빅3 빈 슬롯' }).first().click()
  await page.getByPlaceholder('빅3 입력 후 엔터').fill('BIG3-완료대시')
  await page.getByPlaceholder('빅3 입력 후 엔터').press('Enter')

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('BIG3-완료대시')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const createdBox = page.locator('main button[title="BIG3-완료대시"]:visible').first()
  await createdBox.dispatchEvent('click')
  await page.getByRole('button', { name: '완료 ✓' }).click()
  await page.locator('#actual-minutes').fill('30')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(header).toContainText('1/3')
  await expect(header.getByLabel('빅3 완료 1 / 3').first()).toBeVisible()
})
