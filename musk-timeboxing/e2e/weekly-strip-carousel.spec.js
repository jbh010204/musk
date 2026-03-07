import { expect, test } from '@playwright/test'

test('weekly strip supports drag-to-scroll without accidental date change', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const currentDate = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      throw new Error('day key not found')
    }
    return dayKey.replace('musk-planner-', '')
  })

  const strip = page.getByTestId('week-strip-scroll')

  await expect(strip).toBeVisible()

  const before = await strip.evaluate((node) => node.scrollLeft)
  const box = await strip.boundingBox()
  if (!box) {
    throw new Error('week strip not found')
  }

  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2, { steps: 12 })
  await page.mouse.up()

  const after = await strip.evaluate((node) => node.scrollLeft)
  expect(after).toBeGreaterThan(before)

  const lastDate = await page.evaluate(() => window.localStorage.getItem('musk-planner-last-date'))
  expect(lastDate).toBe(currentDate)
})
