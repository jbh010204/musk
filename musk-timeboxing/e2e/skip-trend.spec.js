import { expect, test } from '@playwright/test'

test('weekly report shows skip reason trend against previous week', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const makeDay = (dateStr, timeBoxes) => ({
      date: dateStr,
      brainDump: [],
      bigThree: [],
      timeBoxes,
    })

    const makeSkipped = (id, reason, startSlot) => ({
      id,
      content: `skip-${id}`,
      sourceId: null,
      startSlot,
      endSlot: startSlot + 1,
      status: 'SKIPPED',
      actualMinutes: null,
      skipReason: reason,
    })

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const day = now.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const thisWeekMonday = new Date(now)
    thisWeekMonday.setDate(now.getDate() + mondayOffset)

    const thisWeekTarget = new Date(thisWeekMonday)
    thisWeekTarget.setDate(thisWeekMonday.getDate() + 2)

    const lastWeekTarget = new Date(thisWeekTarget)
    lastWeekTarget.setDate(thisWeekTarget.getDate() - 7)

    const thisWeekDateStr = formatDate(thisWeekTarget)
    const lastWeekDateStr = formatDate(lastWeekTarget)

    window.localStorage.clear()
    window.localStorage.setItem(
      `musk-planner-${thisWeekDateStr}`,
      JSON.stringify(
        makeDay(thisWeekDateStr, [
          makeSkipped('this-1', '우선순위 변경', 6),
          makeSkipped('this-2', '우선순위 변경', 7),
        ]),
      ),
    )
    window.localStorage.setItem(
      `musk-planner-${lastWeekDateStr}`,
      JSON.stringify(
        makeDay(lastWeekDateStr, [
          makeSkipped('last-1', '우선순위 변경', 8),
          makeSkipped('last-2', '외부 일정/방해', 9),
        ]),
      ),
    )
  })

  await page.reload()

  const reportCard = page.locator('div', { hasText: '주간 리포트' }).first()
  await expect(reportCard).toContainText('스킵 원인 변화 (지난주 대비)')
  await expect(reportCard).toContainText('우선순위 변경: 1→2 (+1)')
})
