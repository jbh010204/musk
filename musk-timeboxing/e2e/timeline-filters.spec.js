import { expect, test } from '@playwright/test'

test('timeline can filter by status and category', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '빠른 메뉴' }).click()
  await page.getByRole('button', { name: '카테고리 관리' }).click()
  await page.getByPlaceholder('예: Deep Work').fill('필터A')
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await page.getByPlaceholder('예: Deep Work').fill('필터B')
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await page.getByRole('button', { name: '닫기' }).click()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('필터-완료-일정')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  await page.locator('[title="필터-완료-일정"]:visible').first().click()
  await page.selectOption('#timebox-category', { label: '필터A' })
  await page.getByRole('button', { name: '완료 ✓' }).click()
  await page.locator('#actual-minutes').fill('30')
  await page.getByRole('button', { name: '저장' }).click()

  await page.locator('button[aria-label="10:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('필터-예정-일정')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  await page.locator('[title="필터-예정-일정"]:visible').first().click()
  await page.selectOption('#timebox-category', { label: '필터B' })
  await page.getByRole('button', { name: '저장' }).click()

  await page.selectOption('[data-testid="timeline-status-filter"]', 'COMPLETED')
  await expect(page.locator('[title="필터-완료-일정"]:visible').first()).toBeVisible()
  await expect(page.locator('[title="필터-예정-일정"]:visible')).toHaveCount(0)

  await page.selectOption('[data-testid="timeline-status-filter"]', 'ALL')
  await page.selectOption('[data-testid="timeline-category-filter"]', { label: '필터B' })
  await expect(page.locator('[title="필터-예정-일정"]:visible').first()).toBeVisible()
  await expect(page.locator('[title="필터-완료-일정"]:visible')).toHaveCount(0)
})
