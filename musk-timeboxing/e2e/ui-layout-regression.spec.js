import { expect, test } from '@playwright/test'

test('weekly strip active date keeps gradient emphasis', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const activeDay = page.locator('button[aria-current="date"]').first()
  await expect(activeDay).toBeVisible()

  const backgroundImage = await activeDay.evaluate(
    (node) => window.getComputedStyle(node).backgroundImage,
  )

  expect(backgroundImage).not.toBe('none')
})

test('patch note toggle width stays stable when expanding details', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '빠른 메뉴' }).click()
  await page.getByRole('button', { name: '패치노트' }).click()

  const latestToggle = page.locator('[data-testid^="patch-note-toggle-"]').first()
  const before = await latestToggle.boundingBox()
  if (!before) {
    throw new Error('latest patch-note toggle not found')
  }

  await latestToggle.click()
  await latestToggle.click()

  const after = await latestToggle.boundingBox()
  if (!after) {
    throw new Error('latest patch-note toggle not found after toggle')
  }

  expect(Math.abs(before.width - after.width)).toBeLessThan(1)
})

test('compact timebox keeps tag-first row and top action alignment', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="빠른 메뉴"]:visible').first().click()
  await page.locator('button[aria-label="카테고리 관리"]:visible').first().click()
  await page.getByPlaceholder('예: Deep Work').fill('레이아웃카테고리')
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await page.getByRole('button', { name: '닫기' }).click()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('컴팩트-정렬-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const createdBox = page.locator('button[title="컴팩트-정렬-테스트"]:visible').first()
  await expect(createdBox).toBeVisible()
  await createdBox.focus()
  await page.keyboard.press('Enter')

  await page.selectOption('#timebox-category', { label: '레이아웃카테고리' })
  await page.getByRole('button', { name: '저장' }).click()

  const card = page.locator('button[title="컴팩트-정렬-테스트"]:visible').first()
  const topActions = card.getByTestId('timebox-top-actions')
  const statusBadge = topActions.locator('span').first()
  const timerStart = card.locator('button[aria-label="타이머 시작"]').first()

  const statusBox = await statusBadge.boundingBox()
  const timerBox = await timerStart.boundingBox()
  if (!statusBox || !timerBox) {
    throw new Error('top actions not found')
  }

  const statusCenterY = statusBox.y + statusBox.height / 2
  const timerCenterY = timerBox.y + timerBox.height / 2
  expect(Math.abs(statusCenterY - timerCenterY)).toBeLessThan(48)

  const compactRowTexts = await card
    .getByTestId('timebox-compact-row')
    .evaluate((node) =>
      [...node.querySelectorAll(':scope > span')].map((child) => (child.textContent || '').trim()),
    )

  expect(compactRowTexts.length).toBeGreaterThanOrEqual(2)
  expect(compactRowTexts[0]).toContain('#레이아웃카테고리')
  expect(compactRowTexts[1]).toContain('컴팩트-정렬-테스트')
})
