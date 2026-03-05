import { expect, test } from '@playwright/test'

test('shows skip-based suggestion when moving to next day', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('스킵제안-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const box = page.locator('button[title="스킵제안-테스트"]:visible').first()
  await box.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: '건너뜀 ✗' }).click()
  await page.selectOption('#skip-reason', { label: '외부 일정/방해' })
  await page.getByRole('button', { name: '저장' }).click()

  await page.locator('button[aria-label="다음 날짜"]').click()

  const suggestion = page.locator('[data-testid="daily-suggestion-panel"]:visible').first()
  await expect(suggestion).toContainText(
    '자동 제안: 외부 일정 변동이 있었어요. 버퍼 30분 블록을 먼저 배치해보세요.',
  )
  await suggestion.getByRole('button', { name: '닫기' }).click()
  await expect(suggestion).toHaveCount(0)
})
