import { expect, test } from '@playwright/test'

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

test('timebox drop persists with 30-minute snapping', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const targetSlot = page.locator('button[aria-label="09:00 슬롯"]:visible').first()
  await targetSlot.click()

  const input = page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)')
  await input.fill('E2E-드래그-검증')
  await input.press('Enter')

  const box = page.locator('button[title="E2E-드래그-검증"]:visible').first()
  await expect(box).toBeVisible()

  const before = await getStorageState(page)
  const beforeBox = before?.data?.timeBoxes?.find((item) => item.content === 'E2E-드래그-검증')
  expect(beforeBox).toBeTruthy()

  const bb = await box.boundingBox()
  if (!bb) {
    throw new Error('timebox bounding box not found')
  }

  const startX = bb.x + bb.width / 2
  const startY = bb.y + Math.min(12, bb.height / 2)

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX, startY + 64, { steps: 8 })
  await page.mouse.up()

  await page.waitForTimeout(120)

  const after = await getStorageState(page)
  const afterBox = after?.data?.timeBoxes?.find((item) => item.id === beforeBox.id)
  expect(afterBox).toBeTruthy()
  expect(afterBox.startSlot).toBe(beforeBox.startSlot + 2)
  expect(afterBox.endSlot).toBe(beforeBox.endSlot + 2)
})
