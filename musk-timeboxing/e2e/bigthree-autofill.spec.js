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

test('brain dump auto-fill prefers highest-priority items for big3', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.localStorage.setItem('musk-planner-last-view-mode', 'CANVAS')
  })
  await page.reload()

  const input = page.getByPlaceholder('할 일을 입력하고 엔터...')
  await input.fill('우선순위-낮음')
  await input.press('Enter')
  await input.fill('우선순위-중간')
  await input.press('Enter')
  await input.fill('우선순위-높음')
  await input.press('Enter')
  await input.fill('우선순위-최우선')
  await input.press('Enter')

  await cyclePriority(page, '우선순위-중간', 2)
  await cyclePriority(page, '우선순위-높음', 3)
  await cyclePriority(page, '우선순위-최우선', 4)

  await page.getByTestId('brain-dump-fill-big3').click()

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    const dayData = JSON.parse(window.localStorage.getItem(dayKey))
    return dayData.bigThree.map((item) => item.content)
  })

  expect(stored).toEqual(['우선순위-최우선', '우선순위-높음', '우선순위-중간'])

  const bigThreeSection = page.locator('section').filter({ hasText: '오늘의 빅 3' }).first()
  await expect(bigThreeSection).toContainText('우선순위-최우선')
  await expect(bigThreeSection).toContainText('우선순위-높음')
  await expect(bigThreeSection).toContainText('우선순위-중간')
  await expect(bigThreeSection).not.toContainText('우선순위-낮음')
})
