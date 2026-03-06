import { expect, test } from '@playwright/test'

test('light mode follows layered-whites guideline tokens', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '테마 전환' }).first().click()

  const tokens = await page.evaluate(() => {
    const root = document.querySelector('.theme-light')
    const panel = document.querySelector('.ui-panel')
    const headerTitle = document.querySelector('header h1')

    return {
      rootBg: root ? window.getComputedStyle(root).backgroundColor : null,
      panelBg: panel ? window.getComputedStyle(panel).backgroundColor : null,
      panelShadow: panel ? window.getComputedStyle(panel).boxShadow : null,
      headerText: headerTitle ? window.getComputedStyle(headerTitle).color : null,
    }
  })

  expect(tokens.rootBg).toBe('rgb(248, 249, 250)')
  expect(tokens.panelBg).toBe('rgb(255, 255, 255)')
  expect(tokens.headerText).toBe('rgb(31, 31, 31)')
  expect(tokens.panelShadow).not.toBe('none')
})
