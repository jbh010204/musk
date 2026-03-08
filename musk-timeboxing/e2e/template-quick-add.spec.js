import { expect, test } from '@playwright/test'

test('template manager saves template and applies it through quick add', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="빠른 메뉴"]:visible').first().click()
  await page.locator('button[aria-label="퀵 템플릿"]:visible').first().click()

  await page.getByPlaceholder('예: 아침 딥워크').fill('아침 딥워크')
  await page.getByPlaceholder('예: 알고리즘 2문제 풀이').fill('템플릿 일정 테스트')
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await page.getByRole('button', { name: '닫기' }).click()

  await expect(page.getByText('아침 딥워크').first()).toBeVisible()

  await page.getByText('아침 딥워크').first().click()
  await expect(page.getByRole('heading', { name: '빠른 일정 추가' })).toBeVisible()
  await expect(page.locator('#quick-add-content')).toHaveValue('템플릿 일정 테스트')
  await page.selectOption('#quick-add-start-slot', '8')
  await page.locator('.ui-modal-card').last().getByRole('button', { name: '추가', exact: true }).click()

  await expect(page.locator('[title="템플릿 일정 테스트"]:visible').first()).toBeVisible()

  const templateCount = await page.evaluate(() => {
    const meta = JSON.parse(window.localStorage.getItem('musk-planner-meta') || '{}')
    return Array.isArray(meta.templates) ? meta.templates.length : 0
  })

  expect(templateCount).toBe(1)
})
