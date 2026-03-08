import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

test('data transfer supports export download and file import', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '빠른 메뉴' }).click()
  await page.getByRole('button', { name: '데이터 백업 복원' }).click()

  await page.getByRole('button', { name: '오늘 내보내기' }).click()
  await expect(page.getByTestId('data-export-text')).toContainText('"days"')

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('data-export-download').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('musk-planner-')

  const today = formatDate(new Date())
  const payload = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    days: {
      [today]: {
        schemaVersion: 2,
        date: today,
        brainDump: [],
        bigThree: [],
        timeBoxes: [
          {
            id: 'imported-timebox-1',
            content: '파일가져오기-일정',
            sourceId: null,
            startSlot: 2,
            endSlot: 3,
            status: 'PLANNED',
            actualMinutes: null,
            category: null,
            categoryId: null,
            skipReason: null,
            timerStartedAt: null,
            elapsedSeconds: 0,
          },
        ],
      },
    },
    meta: {
      schemaVersion: 2,
      categories: [],
    },
  }

  await page
    .getByTestId('data-import-file-input')
    .setInputFiles({
      name: 'import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(payload), 'utf-8'),
    })

  await expect(page.getByTestId('data-import-text')).toContainText('파일가져오기-일정')
  await page.getByRole('button', { name: '가져오기 실행' }).click()

  await expect(page.locator('[title="파일가져오기-일정"]:visible').first()).toBeVisible()
})
