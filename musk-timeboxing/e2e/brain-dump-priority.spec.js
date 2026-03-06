import { expect, test } from '@playwright/test'

const getBrainDumpItem = (page, content) =>
  page.locator('[data-testid^="brain-dump-item-"]').filter({ hasText: content }).first()

const cyclePriority = async (page, content, steps) => {
  const item = getBrainDumpItem(page, content)
  const control = item.locator('[data-testid^="brain-dump-priority-"]').first()

  for (let count = 0; count < steps; count += 1) {
    await control.click()
  }
}

test('brain dump priority control reorders items and persists to storage', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const input = page.getByPlaceholder('할 일을 입력하고 엔터...')

  await input.fill('우선순위-A')
  await input.press('Enter')
  await input.fill('우선순위-B')
  await input.press('Enter')
  await input.fill('우선순위-C')
  await input.press('Enter')

  await cyclePriority(page, '우선순위-C', 4)
  await cyclePriority(page, '우선순위-B', 2)

  const items = page.locator('[data-testid^="brain-dump-item-"]')
  await expect(items.nth(0)).toContainText('우선순위-C')
  await expect(items.nth(1)).toContainText('우선순위-B')
  await expect(items.nth(2)).toContainText('우선순위-A')

  await page.reload()

  await expect(page.locator('[data-testid^="brain-dump-item-"]').nth(0)).toContainText('우선순위-C')

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )

    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return dayData.brainDump.map((item) => ({
      content: item.content,
      priority: item.priority,
    }))
  })

  expect(stored?.[0]).toEqual({ content: '우선순위-C', priority: 4 })
  expect(stored?.[1]).toEqual({ content: '우선순위-B', priority: 2 })
})
