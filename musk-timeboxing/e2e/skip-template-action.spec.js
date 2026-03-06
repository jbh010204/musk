import { expect, test } from '@playwright/test'

test('skip suggestion action inserts recommended block on next day', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('스킵-템플릿-원본')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const box = page.locator('main button[title="스킵-템플릿-원본"]:visible').first()
  await box.click()
  await page.getByRole('button', { name: '건너뜀 ✗' }).click()
  await page.selectOption('#skip-reason', { label: '외부 일정/방해' })
  await page.getByRole('button', { name: '저장' }).click()

  await page.locator('button[aria-label="다음 날짜"]').click()
  const panel = page.locator('[data-testid="daily-suggestion-panel"]:visible').first()
  await expect(panel).toContainText('버퍼 30분 블록')
  await panel.getByRole('button', { name: '버퍼 30분 블록 추가' }).click()

  await expect(page.locator('main button[title="버퍼 블록"]:visible').first()).toBeVisible()
})
