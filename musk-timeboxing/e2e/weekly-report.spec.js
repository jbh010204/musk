import { expect, test } from '@playwright/test'

test('weekly report reflects completion and skip metrics', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('주간완료')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const doneBox = page.locator('main button[title="주간완료"]:visible').first()
  await doneBox.dispatchEvent('click')
  await page.getByRole('button', { name: '완료 ✓' }).click()
  await page.locator('#actual-minutes').fill('45')
  await page.getByRole('button', { name: '저장' }).click()

  await page.locator('button[aria-label="10:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('주간스킵')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const skippedBox = page.locator('main button[title="주간스킵"]:visible').first()
  await skippedBox.dispatchEvent('click')
  await page.getByRole('button', { name: '건너뜀 ✗' }).click()
  await page.selectOption('#skip-reason', { label: '외부 일정/방해' })
  await page.getByRole('button', { name: '저장' }).click()

  const reportCard = page.locator('div', { hasText: '주간 리포트' }).first()
  await expect(reportCard).toContainText('총 일정 2개')
  await expect(reportCard).toContainText('완료율 50%')
  await expect(reportCard).toContainText('스킵 TOP3: 외부 일정/방해(1)')
})
