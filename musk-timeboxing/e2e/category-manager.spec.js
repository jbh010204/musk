import { expect, test } from '@playwright/test'

test('category manager assigns managed category to timebox', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="빠른 메뉴"]:visible').first().click()
  await page.locator('button[aria-label="카테고리 관리"]:visible').first().click()
  await page.getByPlaceholder('예: Deep Work').fill('Deep Work')
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await page.getByRole('button', { name: '닫기' }).click()

  const targetSlot = page.locator('button[aria-label="09:00 슬롯"]:visible').first()
  await targetSlot.click()

  const input = page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)')
  await input.fill('CatTest Task')
  await input.press('Enter')

  const box = page.locator('[title="CatTest Task"]:visible').first()
  await expect(box).toBeVisible()
  await box.focus()
  await page.keyboard.press('Enter')

  await expect(page.locator('#timebox-category')).toBeVisible()
  await page.selectOption('#timebox-category', { label: 'Deep Work' })
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.locator('[title="CatTest Task"]:visible').first()).toContainText('#Deep Work')

  const storage = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    const dayData = dayKey ? JSON.parse(window.localStorage.getItem(dayKey)) : null
    const metaData = JSON.parse(window.localStorage.getItem('musk-planner-meta') || '{}')

    return {
      dayData,
      metaData,
    }
  })

  const category = storage.metaData.categories.find((item) => item.name === 'Deep Work')
  expect(category).toBeTruthy()

  const timeBox = storage.dayData.timeBoxes.find((item) => item.content === 'CatTest Task')
  expect(timeBox).toBeTruthy()
  expect(timeBox.categoryId).toBe(category.id)
})
