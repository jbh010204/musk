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
    steps: 12,
  })
  await page.mouse.up()
}

const getStorageState = async (page) => {
  return page.evaluate(() => {
    const key = Object.keys(window.localStorage).find((item) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(item),
    )
    if (!key) {
      return null
    }

    return {
      key,
      data: JSON.parse(window.localStorage.getItem(key)),
    }
  })
}

test('timebox drag interaction keeps persisted timebox data valid', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const targetSlot = page.locator('button[aria-label="09:00 슬롯"]:visible').first()
  await targetSlot.click()

  const input = page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)')
  await input.fill('E2E-드래그-검증')
  await input.press('Enter')

  const box = page.locator('[title="E2E-드래그-검증"]:visible').first()
  await expect(box).toBeVisible()

  const before = await getStorageState(page)
  const beforeBox = before?.data?.timeBoxes?.find((item) => item.content === 'E2E-드래그-검증')
  expect(beforeBox).toBeTruthy()

  const dropTargetSlot = page.locator('button[aria-label="11:00 슬롯"]:visible').first()
  await dragBetween(page, box, dropTargetSlot)

  await page.waitForTimeout(120)

  const after = await getStorageState(page)
  const afterBox = after?.data?.timeBoxes?.find((item) => item.id === beforeBox.id)
  expect(afterBox).toBeTruthy()
  expect(afterBox.startSlot).toBeGreaterThanOrEqual(11)
  expect(afterBox.startSlot).toBeLessThanOrEqual(13)
  expect(afterBox.startSlot).toBeGreaterThanOrEqual(0)
  expect(afterBox.endSlot - afterBox.startSlot).toBe(beforeBox.endSlot - beforeBox.startSlot)
})
