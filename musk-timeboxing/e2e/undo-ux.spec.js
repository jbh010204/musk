import { expect, test } from '@playwright/test'

test('brain dump delete supports undo action', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
  })
  await page.reload()

  const input = page.getByPlaceholder('할 일을 입력하고 엔터...')
  await input.fill('UNDO-브레인덤프')
  await input.press('Enter')

  const itemButton = page.locator('[title="UNDO-브레인덤프"]').first()
  await expect(itemButton).toBeVisible()

  const itemRow = page.locator('div[data-removing]').filter({ has: itemButton }).first()
  await itemRow.hover()
  await itemRow.getByRole('button', { name: '삭제' }).click()

  await expect(page.locator('[title="UNDO-브레인덤프"]')).toHaveCount(0)
  await page.getByRole('button', { name: '되돌리기' }).first().click()
  await expect(page.locator('[title="UNDO-브레인덤프"]').first()).toBeVisible()
})

test('status update in completion modal supports undo action', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('UNDO-상태변경')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const box = page.locator('[title="UNDO-상태변경"]:visible').first()
  await box.click()

  await page.getByRole('button', { name: '완료 ✓' }).click()
  await page.locator('#actual-minutes').fill('45')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.locator('[title="UNDO-상태변경"]:visible').first()).toContainText('완료')
  await page.getByRole('button', { name: '되돌리기' }).first().click()
  await expect(page.locator('[title="UNDO-상태변경"]:visible').first()).toContainText('예정')

  const status = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    const box = dayData.timeBoxes.find((item) => item.content === 'UNDO-상태변경')
    return box?.status ?? null
  })

  expect(status).toBe('PLANNED')
})

test('timebox delete supports undo action', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="10:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('UNDO-일정삭제')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const box = page.locator('[title="UNDO-일정삭제"]:visible').first()
  await box.click()

  page.once('dialog', async (dialog) => {
    await dialog.accept()
  })
  await page
    .locator('.ui-modal-card')
    .getByRole('button', { name: '삭제', exact: true })
    .click({ force: true })

  await expect(page.locator('[title="UNDO-일정삭제"]:visible')).toHaveCount(0)
  await page.getByRole('button', { name: '되돌리기' }).first().click()
  await expect(page.locator('[title="UNDO-일정삭제"]:visible').first()).toBeVisible()
})
