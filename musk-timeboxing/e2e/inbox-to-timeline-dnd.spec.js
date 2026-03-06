import { expect, test } from '@playwright/test'

const dragBetween = async (page, source, target) => {
  await source.scrollIntoViewIfNeeded()
  await target.scrollIntoViewIfNeeded()

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()

  if (!sourceBox || !targetBox) {
    throw new Error('drag source/target bounding box missing')
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 10,
  })
  await page.mouse.up()
}

test('brain dump item can be dropped into timeline slot', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByPlaceholder('할 일을 입력하고 엔터...').fill('BDD-드롭-테스트')
  await page.getByPlaceholder('할 일을 입력하고 엔터...').press('Enter')

  const source = page.locator('button[title="BDD-드롭-테스트"]:visible').first()
  const targetSlot = page.locator('button[aria-label="10:00 슬롯"]:visible').first()
  await dragBetween(page, source, targetSlot)

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return dayData.timeBoxes.find((box) => box.content === 'BDD-드롭-테스트') || null
  })

  expect(stored).toBeTruthy()
  expect(stored.startSlot).toBeGreaterThanOrEqual(9)
  expect(stored.startSlot).toBeLessThanOrEqual(11)
})

test('drag guide appears while dragging from brain dump', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByPlaceholder('할 일을 입력하고 엔터...').fill('GUIDE-테스트')
  await page.getByPlaceholder('할 일을 입력하고 엔터...').press('Enter')

  const source = page.locator('button[title="GUIDE-테스트"]:visible').first()
  const targetSlot = page.locator('button[aria-label="10:00 슬롯"]:visible').first()
  const sourceBox = await source.boundingBox()
  const targetBox = await targetSlot.boundingBox()
  if (!sourceBox || !targetBox) {
    throw new Error('drag source bounding box missing')
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 })
  await expect(page.locator('[data-testid="timeline-drop-guide"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="timeline-drop-preview"]:visible').first()).toBeVisible()
  await page.mouse.up()
})

test('big three item can be dropped into timeline slot', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button:has-text("— 비어있음 —"):visible').first().click()
  await page.getByPlaceholder('빅3 입력 후 엔터').fill('BIG3-드롭-테스트')
  await page.getByPlaceholder('빅3 입력 후 엔터').press('Enter')

  const source = page.locator('button[title="BIG3-드롭-테스트"]:visible').first()
  const targetSlot = page.locator('button[aria-label="11:00 슬롯"]:visible').first()
  await dragBetween(page, source, targetSlot)

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return dayData.timeBoxes.find((box) => box.content === 'BIG3-드롭-테스트') || null
  })

  expect(stored).toBeTruthy()
  expect(stored.startSlot).toBeGreaterThanOrEqual(11)
  expect(stored.startSlot).toBeLessThanOrEqual(13)
})
