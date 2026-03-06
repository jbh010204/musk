import { expect, test } from '@playwright/test'

const getVisibleBrainDumpItems = (page) =>
  page.locator('[data-testid^="brain-dump-item-"]:visible')

const getBrainDumpItem = (page, content) =>
  getVisibleBrainDumpItems(page).filter({ hasText: content }).first()

const cyclePriority = async (page, content, steps) => {
  const item = getBrainDumpItem(page, content)
  const control = item.locator('[data-testid^="brain-dump-priority-"]').first()

  for (let count = 0; count < steps; count += 1) {
    await control.click()
  }
}

test('brain dump priority change keeps current order until reload, then restores sorted order', async ({
  page,
}) => {
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

  const itemsBeforeReload = getVisibleBrainDumpItems(page)
  await expect(itemsBeforeReload.nth(0)).toContainText('우선순위-A')
  await expect(itemsBeforeReload.nth(1)).toContainText('우선순위-B')
  await expect(itemsBeforeReload.nth(2)).toContainText('우선순위-C')

  await page.reload()

  const itemsAfterReload = getVisibleBrainDumpItems(page)
  await expect(itemsAfterReload.nth(0)).toContainText('우선순위-C')
  await expect(itemsAfterReload.nth(1)).toContainText('우선순위-B')
  await expect(itemsAfterReload.nth(2)).toContainText('우선순위-A')

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

test('brain dump long text uses two-line clamp with compact battery width', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const longText =
    '이것은 브레인 덤프에서 길게 적었을 때도 한 줄만 보이지 않고 두 줄까지 안정적으로 보여야 하는 테스트 문장입니다'

  await page.getByPlaceholder('할 일을 입력하고 엔터...').fill(longText)
  await page.getByPlaceholder('할 일을 입력하고 엔터...').press('Enter')

  const item = getBrainDumpItem(page, longText)
  const contentStyle = await item.locator(`button[title="${longText}"]`).evaluate((node) => {
    const text = node.querySelector('span')
    const styles = window.getComputedStyle(text)

    return {
      webkitLineClamp: styles.webkitLineClamp,
      orient: styles.webkitBoxOrient,
    }
  })

  expect(contentStyle.webkitLineClamp).toBe('2')
  expect(contentStyle.orient).toBe('vertical')
})
