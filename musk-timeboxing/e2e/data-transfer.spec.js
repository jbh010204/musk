import { expect, test } from '@playwright/test'

test('export and import planner data restores timebox and category', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="빠른 메뉴"]:visible').first().click()
  await page.locator('button[aria-label="카테고리 관리"]:visible').first().click()
  await page.getByPlaceholder('예: Deep Work').fill('백업카테고리')
  await page.getByRole('button', { name: '추가' }).click()
  await page.getByRole('button', { name: '닫기' }).click()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('백업테스트일정')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const createdBox = page.locator('button[title="백업테스트일정"]:visible').first()
  await expect(createdBox).toBeVisible()
  await createdBox.focus()
  await page.keyboard.press('Enter')

  await page.selectOption('#timebox-category', { label: '백업카테고리' })
  await page.getByRole('button', { name: '저장' }).click()

  await page.locator('button[aria-label="빠른 메뉴"]:visible').first().click()
  await page.locator('button[aria-label="데이터 백업 복원"]:visible').first().click()
  await page.getByRole('button', { name: '전체 내보내기' }).click()

  const exportedJson = await page
    .locator('textarea[readonly]')
    .inputValue()

  expect(exportedJson.length).toBeGreaterThan(20)

  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await expect(page.locator('button[title="백업테스트일정"]:visible').first()).toHaveCount(0)

  await page.locator('button[aria-label="빠른 메뉴"]:visible').first().click()
  await page.locator('button[aria-label="데이터 백업 복원"]:visible').first().click()
  await page.getByPlaceholder('JSON을 붙여넣고 가져오기를 실행하세요').fill(exportedJson)
  await page.getByRole('button', { name: '가져오기 실행' }).click()

  await expect(page.locator('button[title="백업테스트일정"]:visible').first()).toContainText('#백업카테고리')
})
