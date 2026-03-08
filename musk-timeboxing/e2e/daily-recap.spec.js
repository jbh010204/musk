import { expect, test } from '@playwright/test'

test('daily recap updates after completion', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const recapCard = page.locator('div', { hasText: '오늘 리캡' }).first()
  await expect(recapCard.getByText('아직 등록된 일정이 없습니다.').first()).toBeVisible()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('리캡-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  await expect(recapCard.getByText('총 일정 1개').first()).toBeVisible()
  await expect(recapCard.getByText('완료율 0%').first()).toBeVisible()

  const box = page.locator('[title="리캡-테스트"]:visible').first()
  await box.focus()
  await page.keyboard.press('Enter')

  await page.getByRole('button', { name: '완료 ✓' }).click()
  await page.locator('#actual-minutes').fill('45')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(recapCard.getByText('완료율 100%').first()).toBeVisible()
  await expect(
    recapCard.getByText('완료 일정 기준 계획 30분 → 실제 45분 (+15분)').first(),
  ).toBeVisible()
})
