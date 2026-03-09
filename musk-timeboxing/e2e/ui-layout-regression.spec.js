import { expect, test } from '@playwright/test'

test('weekly strip active date keeps gradient emphasis', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const activeDay = page.locator('button[aria-current="date"]').first()
  await expect(activeDay).toBeVisible()

  const backgroundImage = await activeDay.evaluate(
    (node) => window.getComputedStyle(node).backgroundImage,
  )

  expect(backgroundImage).not.toBe('none')
})

test('patch note toggle width stays stable when expanding details', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.getByRole('button', { name: '빠른 메뉴' }).click()
  await page.getByRole('button', { name: '패치노트' }).click()

  const latestToggle = page.locator('[data-testid^="patch-note-toggle-"]').first()
  const before = await latestToggle.boundingBox()
  if (!before) {
    throw new Error('latest patch-note toggle not found')
  }

  await latestToggle.click()
  await latestToggle.click()

  const after = await latestToggle.boundingBox()
  if (!after) {
    throw new Error('latest patch-note toggle not found after toggle')
  }

  expect(Math.abs(before.width - after.width)).toBeLessThan(1)
})

test('compact timebox keeps tag-first row and top action alignment', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('button[aria-label="빠른 메뉴"]:visible').first().click()
  await page.locator('button[aria-label="카테고리 관리"]:visible').first().click()
  await page.getByPlaceholder('예: Deep Work').fill('레이아웃카테고리')
  await page.getByRole('button', { name: '추가', exact: true }).click()
  await page.getByRole('button', { name: '닫기' }).click()

  await page.locator('button[aria-label="09:00 슬롯"]:visible').first().click()
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').fill('컴팩트-정렬-테스트')
  await page.getByPlaceholder('일정을 입력하고 엔터 (기본 30분)').press('Enter')

  const createdBox = page.locator('[title="컴팩트-정렬-테스트"]:visible').first()
  await expect(createdBox).toBeVisible()
  await createdBox.focus()
  await page.keyboard.press('Enter')

  await page.selectOption('#timebox-category', { label: '레이아웃카테고리' })
  await page.getByRole('button', { name: '저장' }).click()

  const card = page.locator('[title="컴팩트-정렬-테스트"]:visible').first()
  const topActions = card.getByTestId('timebox-top-actions')
  const statusBadge = topActions.locator('span').first()
  const timerStart = card.locator('button[aria-label="타이머 시작"]').first()

  const statusBox = await statusBadge.boundingBox()
  const timerBox = await timerStart.boundingBox()
  if (!statusBox || !timerBox) {
    throw new Error('top actions not found')
  }

  const statusCenterY = statusBox.y + statusBox.height / 2
  const timerCenterY = timerBox.y + timerBox.height / 2
  expect(Math.abs(statusCenterY - timerCenterY)).toBeLessThan(48)

  const compactContent = card.getByTestId('timebox-content')
  const compactTexts = await compactContent.evaluate((node) =>
    [...node.querySelectorAll('[data-testid="timebox-tag"], [data-testid="timebox-title"], [data-testid="timebox-time"]')].map(
      (child) => (child.textContent || '').trim(),
    ),
  )
  const cardBox = await card.boundingBox()
  const contentBox = await compactContent.boundingBox()

  if (!cardBox || !contentBox) {
    throw new Error('compact content geometry not available')
  }

  expect(compactTexts.length).toBeGreaterThanOrEqual(3)
  expect(compactTexts[0]).toContain('#레이아웃카테고리')
  expect(compactTexts[1]).toContain('컴팩트-정렬-테스트')
  expect(compactTexts[2]).toContain('30분')
  expect(
    Math.abs(
      contentBox.y + contentBox.height / 2 - (cardBox.y + cardBox.height / 2),
    ),
  ).toBeLessThan(6)

  const compactTagBox = await compactContent.getByTestId('timebox-tag').boundingBox()
  const compactTitleBox = await compactContent.getByTestId('timebox-title').boundingBox()
  const compactTimeBox = await compactContent.getByTestId('timebox-time').boundingBox()

  if (!compactTagBox || !compactTitleBox || !compactTimeBox) {
    throw new Error('compact content item geometry not available')
  }

  expect(compactTitleBox.x).toBeGreaterThan(compactTagBox.x)
  expect(compactTimeBox.x).toBeGreaterThan(compactTitleBox.x)
})

test('timebox typography scales across compact medium and spacious heights', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    window.localStorage.clear()
    window.localStorage.setItem(
      `musk-planner-${dateStr}`,
      JSON.stringify({
        date: dateStr,
        brainDump: [],
        bigThree: [],
        timeBoxes: [
          {
            id: 'layout-compact',
            content: '짧은 30분 작업 제목',
            sourceId: null,
            startSlot: 2,
            endSlot: 3,
            status: 'PLANNED',
            actualMinutes: null,
            category: '개인',
            categoryId: null,
          },
          {
            id: 'layout-medium',
            content: '한 시간 카드에서는 제목이 두 줄까지 자연스럽게 보이는지 확인하는 긴 작업 이름',
            sourceId: null,
            startSlot: 4,
            endSlot: 6,
            status: 'PLANNED',
            actualMinutes: null,
            category: '업무',
            categoryId: null,
          },
          {
            id: 'layout-spacious',
            content: '두 시간 카드에서는 제목과 메타 정보가 더 여유 있는 스케일로 배치되어야 하는 긴 작업 이름',
            sourceId: null,
            startSlot: 7,
            endSlot: 11,
            status: 'COMPLETED',
            actualMinutes: 150,
            category: '개인',
            categoryId: null,
          },
        ],
      }),
    )
    window.localStorage.setItem('musk-planner-last-date', dateStr)
  })
  await page.reload()

  const compactCard = page.locator('[title="짧은 30분 작업 제목"]:visible').first()
  const mediumCard = page
    .locator('[title="한 시간 카드에서는 제목이 두 줄까지 자연스럽게 보이는지 확인하는 긴 작업 이름"]:visible')
    .first()
  const spaciousCard = page
    .locator('[title="두 시간 카드에서는 제목과 메타 정보가 더 여유 있는 스케일로 배치되어야 하는 긴 작업 이름"]:visible')
    .first()

  await expect(compactCard).toBeVisible()
  await expect(mediumCard).toBeVisible()
  await expect(spaciousCard).toBeVisible()

  const compactTitle = compactCard.getByTestId('timebox-title')
  const mediumTitle = mediumCard.getByTestId('timebox-title')
  const spaciousTitle = spaciousCard.getByTestId('timebox-title')
  await expect(mediumCard.getByTestId('timebox-tag')).toBeVisible()
  await expect(mediumCard.getByTestId('timebox-time')).toBeVisible()
  await expect(spaciousCard.getByTestId('timebox-tag')).toBeVisible()
  await expect(spaciousCard.getByTestId('timebox-time')).toBeVisible()

  const compactFont = Number(
    await compactTitle.evaluate((node) => window.getComputedStyle(node).fontSize.replace('px', '')),
  )
  const mediumFont = Number(
    await mediumTitle.evaluate((node) => window.getComputedStyle(node).fontSize.replace('px', '')),
  )
  const spaciousFont = Number(
    await spaciousTitle.evaluate((node) => window.getComputedStyle(node).fontSize.replace('px', '')),
  )

  expect(mediumFont).toBeGreaterThan(compactFont)
  expect(spaciousFont).toBeGreaterThan(mediumFont)

  const compactTitleBox = await compactTitle.boundingBox()
  const mediumTitleBox = await mediumTitle.boundingBox()
  const spaciousTitleBox = await spaciousTitle.boundingBox()
  const mediumTagBox = await mediumCard.getByTestId('timebox-tag').boundingBox()
  const mediumTimeBox = await mediumCard.getByTestId('timebox-time').boundingBox()
  const spaciousTagBox = await spaciousCard.getByTestId('timebox-tag').boundingBox()
  const spaciousTimeBox = await spaciousCard.getByTestId('timebox-time').boundingBox()
  const mediumCardBox = await mediumCard.boundingBox()
  const spaciousCardBox = await spaciousCard.boundingBox()
  const mediumContentBox = await mediumCard.getByTestId('timebox-content').boundingBox()
  const spaciousContentBox = await spaciousCard.getByTestId('timebox-content').boundingBox()

  if (
    !compactTitleBox ||
    !mediumTitleBox ||
    !spaciousTitleBox ||
    !mediumTagBox ||
    !mediumTimeBox ||
    !spaciousTagBox ||
    !spaciousTimeBox ||
    !mediumCardBox ||
    !spaciousCardBox ||
    !mediumContentBox ||
    !spaciousContentBox
  ) {
    throw new Error('timebox typography geometry not available')
  }

  expect(mediumTitleBox.height).toBeGreaterThan(compactTitleBox.height)
  expect(Math.abs(mediumTagBox.x - mediumTitleBox.x)).toBeLessThan(8)
  expect(Math.abs(mediumTitleBox.x - mediumTimeBox.x)).toBeLessThan(8)
  expect(Math.abs(spaciousTagBox.x - spaciousTitleBox.x)).toBeLessThan(8)
  expect(Math.abs(spaciousTitleBox.x - spaciousTimeBox.x)).toBeLessThan(8)
  expect(mediumTitleBox.y + mediumTitleBox.height).toBeLessThanOrEqual(
    mediumCardBox.y + mediumCardBox.height - 2,
  )
  expect(
    Math.abs(
      mediumContentBox.y + mediumContentBox.height / 2 - (mediumCardBox.y + mediumCardBox.height / 2),
    ),
  ).toBeLessThan(10)
  expect(
    Math.abs(
      spaciousContentBox.y + spaciousContentBox.height / 2 -
        (spaciousCardBox.y + spaciousCardBox.height / 2),
    ),
  ).toBeLessThan(12)
  await expect(spaciousCard.getByTestId('timebox-time')).toContainText('차이')
  await expect(spaciousCard.getByTestId('timebox-meta')).toHaveCount(0)
})

test('stacked timeboxes keep compact content within bounds and hide resize seam until hover', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    window.localStorage.clear()
    window.localStorage.setItem(
      `musk-planner-${dateStr}`,
      JSON.stringify({
        date: dateStr,
        brainDump: [],
        bigThree: [],
        timeBoxes: [
          {
            id: 'layout-large-completed',
            content: '리준쉴량 디코',
            sourceId: null,
            startSlot: 10,
            endSlot: 13,
            status: 'COMPLETED',
            actualMinutes: 60,
            category: '개인',
            categoryId: null,
          },
          {
            id: 'layout-compact-planned',
            content: '[GDG] 자기소개 템플리 만들기',
            sourceId: null,
            startSlot: 13,
            endSlot: 14,
            status: 'PLANNED',
            actualMinutes: null,
            category: '개인',
            categoryId: null,
          },
        ],
      }),
    )
    window.localStorage.setItem('musk-planner-last-date', dateStr)
  })
  await page.reload()

  const compactCard = page.locator('[title="[GDG] 자기소개 템플리 만들기"]:visible').first()
  await expect(compactCard).toBeVisible()

  const compactRow = compactCard.getByTestId('timebox-content')
  const handle = compactCard.getByTestId('timebox-resize-handle')

  const cardBox = await compactCard.boundingBox()
  const compactRowBox = await compactRow.boundingBox()
  const handleBox = await handle.boundingBox()

  if (!cardBox || !compactRowBox || !handleBox) {
    throw new Error('timebox card geometry not available')
  }

  expect(compactRowBox.y).toBeGreaterThanOrEqual(cardBox.y)
  expect(compactRowBox.y + compactRowBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height - 2)

  const initialOpacity = Number(
    await handle.evaluate((node) => window.getComputedStyle(node).opacity),
  )
  expect(initialOpacity).toBeLessThan(0.1)

  await compactCard.hover()

  await expect
    .poll(async () => Number(await handle.evaluate((node) => window.getComputedStyle(node).opacity)))
    .toBeGreaterThan(0.5)
})
