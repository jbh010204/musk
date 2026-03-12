import { expect, test } from '@playwright/test'

test('planner workspace composes stack canvas and timeline rail in one view', async ({ page }) => {
  await page.goto('/')

  const setup = await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-backend', name: 'Backend', color: '#22c55e', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-card-001',
            content: '워크스페이스 통합 배치 테스트',
            isDone: false,
            priority: 0,
            categoryId: 'cat-backend',
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: 'workspace seed',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          focusedLaneId: 'cat-backend',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )

    return { today }
  })

  await page.reload()

  await expect(page.locator('[data-testid="planner-workspace-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="planning-canvas-view"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="workspace-timeline-rail"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="planning-board-card-workspace-card-001"]:visible').first()).toBeVisible()

  const canvasCard = page.locator('[data-testid="planning-board-card-workspace-card-001"]:visible').first()
  await canvasCard.click()
  await page.locator('[data-testid="workspace-slot-10"]:visible').first().click()

  await expect(canvasCard).toContainText('예정 1')
  await expect(page.locator('[data-testid^="workspace-timeline-block-"]').first()).toContainText(
    '워크스페이스 통합 배치 테스트',
  )

  await page.waitForFunction((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    if (!raw) {
      return false
    }

    const parsed = JSON.parse(raw)
    return (
      parsed?.timeBoxes?.length === 1 &&
      parsed?.brainDump?.find((item) => item.id === 'workspace-card-001')?.linkedTimeBoxIds?.length === 1 &&
      parsed?.stackCanvasState?.selectedCardId === null
    )
  }, setup.today)
})

test('planner workspace closes the loop from canvas selection to big3 rail and timeline scheduling', async ({
  page,
}) => {
  await page.goto('/')

  const setup = await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-deep', name: 'Deep Work', color: '#6366f1', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-big3-card',
            content: '워크스페이스 Big3 연결 테스트',
            isDone: false,
            priority: 0,
            categoryId: 'cat-deep',
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: '',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          selectedCardIds: [],
          selectedBigThreeId: null,
          focusedLaneId: 'cat-deep',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )

    return { today }
  })

  await page.reload()

  await page.locator('[data-testid="planning-board-card-workspace-big3-card"]:visible').first().click()
  await page.locator('[data-testid="workspace-bigthree-add-selected"]:visible').first().click()

  const bigThreeSlot = page.locator('[data-testid="workspace-bigthree-slot-0"]:visible').first()
  await expect(bigThreeSlot).toContainText('워크스페이스 Big3 연결 테스트')
  await bigThreeSlot.click()

  await page.locator('[data-testid="workspace-slot-6"]:visible').first().click()

  await expect(page.locator('[data-testid^="workspace-timeline-block-"]:visible')).toHaveCount(1)
  await expect(page.locator('[data-testid="planning-board-card-workspace-big3-card"]:visible').first()).toContainText(
    '예정 1',
  )

  await page.waitForFunction((today) => {
    const raw = window.localStorage.getItem(`musk-planner-${today}`)
    if (!raw) {
      return false
    }

    const parsed = JSON.parse(raw)
    return (
      parsed?.bigThree?.length === 1 &&
      parsed?.timeBoxes?.length === 1 &&
      parsed?.stackCanvasState?.selectedBigThreeId === null &&
      parsed?.brainDump?.find((item) => item.id === 'workspace-big3-card')?.linkedTimeBoxIds?.length === 1
    )
  }, setup.today)
})

test('planner workspace keeps the last selected timeline view after refresh', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await page.locator('[data-testid="timeline-view-week"]:visible').first().click()
  await expect(page.locator('text=주간 계획을 한 번에 확인합니다.').first()).toBeVisible()

  await page.reload()
  await expect(page.locator('[data-testid="timeline-view-week"][aria-pressed="true"]:visible').first()).toBeVisible()
})

test('planner workspace uses category dock and slot click as the primary scheduling flow', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-focus', name: '집중', color: '#6366f1', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-drag-card',
            content: '도크 분류 후 슬롯 클릭 배치',
            isDone: false,
            priority: 0,
            categoryId: null,
            stackOrder: 0,
            estimatedSlots: 3,
            linkedTimeBoxIds: [],
            note: '',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          focusedLaneId: 'cat-focus',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )
  })

  await page.reload()
  await page.locator('[data-testid="timeline-view-workspace"]:visible').first().click()

  await page.locator('[data-testid="planning-board-card-workspace-drag-card"]:visible').first().click()
  await page.locator('[data-testid="planning-board-node-cat-focus"]:visible').first().click()
  await expect(page.locator('[data-testid="planning-board-lane-cat-focus"]:visible').first()).toContainText(
    '도크 분류 후 슬롯 클릭 배치',
  )

  await page.locator('[data-testid="workspace-slot-12"]:visible').first().click()

  await expect(page.locator('[data-testid^="workspace-timeline-block-"]').first()).toContainText('도크 분류 후 슬롯 클릭 배치')
  await expect(page.locator('[data-testid="planning-board-card-workspace-drag-card"]:visible').first()).toContainText(
    '예정 1',
  )
})

test('planner workspace can bulk schedule multiple selected canvas cards', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-focus', name: '집중', color: '#6366f1', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-bulk-card-1',
            content: '벌크 배치 1',
            isDone: false,
            priority: 0,
            categoryId: 'cat-focus',
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: '',
            createdFrom: 'board',
          },
          {
            id: 'workspace-bulk-card-2',
            content: '벌크 배치 2',
            isDone: false,
            priority: 0,
            categoryId: 'cat-focus',
            stackOrder: 1,
            estimatedSlots: 3,
            linkedTimeBoxIds: [],
            note: '',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          selectedCardIds: [],
          focusedLaneId: 'cat-focus',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )
  })

  await page.reload()

  await page.locator('[data-testid="planning-board-card-select-toggle-workspace-bulk-card-1"]:visible').first().click()
  await page.locator('[data-testid="planning-board-card-select-toggle-workspace-bulk-card-2"]:visible').first().click()

  await expect(page.getByText('다중 선택 2개').first()).toBeVisible()
  await page.locator('[data-testid="workspace-slot-8"]:visible').first().click()

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const dayKey = Object.keys(window.localStorage).find((key) =>
          /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
        )

        if (!dayKey) {
          return 0
        }

        const stored = JSON.parse(window.localStorage.getItem(dayKey) || '{}')
        return Array.isArray(stored.timeBoxes) ? stored.timeBoxes.length : 0
      }),
    )
    .toBe(2)

  await expect(page.locator('[data-testid^="workspace-timeline-block-"]:visible')).toHaveCount(2)
  await expect(page.locator('[data-testid="planning-board-card-workspace-bulk-card-1"]:visible').first()).toContainText(
    '예정 1',
  )
  await expect(page.locator('[data-testid="planning-board-card-workspace-bulk-card-2"]:visible').first()).toContainText(
    '예정 1',
  )

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    return JSON.parse(window.localStorage.getItem(dayKey))
  })

  expect(stored?.timeBoxes).toHaveLength(2)
  expect(stored?.timeBoxes?.[0]?.startSlot).toBe(8)
  expect(stored?.timeBoxes?.[0]?.endSlot).toBe(10)
  expect(stored?.timeBoxes?.[1]?.startSlot).toBe(10)
  expect(stored?.timeBoxes?.[1]?.endSlot).toBe(13)
  expect(stored?.stackCanvasState?.selectedCardIds).toEqual([])
  expect(stored?.stackCanvasState?.selectedCardId).toBeNull()
})

test('planner workspace can search, filter, and collapse inbox cards', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [{ id: 'cat-focus', name: '집중', color: '#6366f1', parentId: null, order: 0 }],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-inbox-card-1',
            content: '로그인 API 정리',
            isDone: false,
            priority: 0,
            categoryId: null,
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: '보안 메모',
            createdFrom: 'board',
          },
          {
            id: 'workspace-inbox-card-2',
            content: '회의 노트 정리',
            isDone: false,
            priority: 0,
            categoryId: null,
            stackOrder: 1,
            estimatedSlots: 2,
            linkedTimeBoxIds: ['inbox-tb-1'],
            note: '',
            createdFrom: 'board',
          },
          {
            id: 'workspace-inbox-card-3',
            content: '회고 정리',
            isDone: false,
            priority: 0,
            categoryId: null,
            stackOrder: 2,
            estimatedSlots: 2,
            linkedTimeBoxIds: ['inbox-tb-2'],
            note: '',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [
          {
            id: 'inbox-tb-1',
            content: '회의 노트 정리',
            sourceId: 'workspace-inbox-card-2',
            startSlot: 8,
            endSlot: 10,
            status: 'PLANNED',
            actualMinutes: null,
            categoryId: null,
            category: null,
          },
          {
            id: 'inbox-tb-2',
            content: '회고 정리',
            sourceId: 'workspace-inbox-card-3',
            startSlot: 10,
            endSlot: 12,
            status: 'COMPLETED',
            actualMinutes: 60,
            categoryId: null,
            category: null,
          },
        ],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          selectedCardIds: [],
          focusedLaneId: 'cat-focus',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )
  })

  await page.reload()
  await page.locator('[data-testid="timeline-view-workspace"]:visible').first().click()

  await page.locator('[data-testid="planning-canvas-inbox-search"]:visible').first().fill('로그인')
  await expect(page.locator('[data-testid="planning-board-card-workspace-inbox-card-1"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="planning-board-card-workspace-inbox-card-2"]:visible')).toHaveCount(0)

  await page.locator('[data-testid="planning-canvas-inbox-search"]:visible').first().fill('')
  await page.locator('[data-testid="planning-canvas-inbox-filter"]:visible').first().selectOption('SCHEDULED')
  await expect(page.locator('[data-testid="planning-board-card-workspace-inbox-card-2"]:visible').first()).toBeVisible()
  await expect(page.locator('[data-testid="planning-board-card-workspace-inbox-card-1"]:visible')).toHaveCount(0)

  await page.locator('[data-testid="planning-canvas-inbox-collapse-toggle"]:visible').first().click()
  await expect(page.getByText('Inbox를 접어두었습니다. 필요할 때 다시 펼쳐 검색하고 정리하세요.').first()).toBeVisible()

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    return JSON.parse(window.localStorage.getItem(dayKey))
  })

  expect(stored?.stackCanvasState?.inboxFilter).toBe('SCHEDULED')
  expect(stored?.stackCanvasState?.isInboxCollapsed).toBe(true)
})

test('planner workspace supports keyboard shortcuts for move, big3, and first-open scheduling', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    window.localStorage.clear()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = formatDate(new Date())
    window.localStorage.setItem('musk-planner-last-date', today)
    window.localStorage.setItem(
      'musk-planner-meta',
      JSON.stringify({
        schemaVersion: 4,
        categories: [
          { id: 'cat-focus', name: '집중', color: '#6366f1', parentId: null, order: 0 },
          { id: 'cat-admin', name: '운영', color: '#f97316', parentId: null, order: 1 },
        ],
        templates: [],
      }),
    )
    window.localStorage.setItem(
      `musk-planner-${today}`,
      JSON.stringify({
        schemaVersion: 4,
        date: today,
        brainDump: [
          {
            id: 'workspace-shortcut-card',
            content: '단축키 플로우 테스트',
            isDone: false,
            priority: 0,
            categoryId: null,
            stackOrder: 0,
            estimatedSlots: 2,
            linkedTimeBoxIds: [],
            note: '',
            createdFrom: 'board',
          },
        ],
        bigThree: [],
        timeBoxes: [],
        stackCanvasState: {
          version: 2,
          layoutMode: 'stack',
          selectedCardId: null,
          selectedCardIds: [],
          focusedLaneId: 'cat-focus',
          migratedFromLegacyBoard: false,
          lastSyncedAt: null,
        },
      }),
    )
  })

  await page.reload()

  await page.locator('[data-testid="planning-board-card-select-toggle-workspace-shortcut-card"]:visible').first().click()
  await expect(page.locator('[data-testid="planning-canvas-selection-bar"]:visible').first()).toBeVisible()
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ']',
        code: 'BracketRight',
        bubbles: true,
      }),
    )
  })
  await expect(page.locator('[data-testid="planning-board-lane-cat-focus"]:visible').first()).toContainText(
    '단축키 플로우 테스트',
  )

  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'B',
        code: 'KeyB',
        shiftKey: true,
        bubbles: true,
      }),
    )
  })
  await expect(page.locator('[data-testid="workspace-bigthree-slot-0"]:visible').first()).toContainText(
    '단축키 플로우 테스트',
  )

  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        shiftKey: true,
        bubbles: true,
      }),
    )
  })
  await expect(page.locator('[data-testid^="workspace-timeline-block-"]:visible')).toHaveCount(1)
  await expect(page.locator('[data-testid="planning-board-card-workspace-shortcut-card"]:visible').first()).toContainText(
    '예정 1',
  )

  const stored = await page.evaluate(() => {
    const dayKey = Object.keys(window.localStorage).find((key) =>
      /^musk-planner-\d{4}-\d{2}-\d{2}$/.test(key),
    )
    if (!dayKey) {
      return null
    }

    return JSON.parse(window.localStorage.getItem(dayKey))
  })

  expect(stored?.bigThree).toHaveLength(1)
  expect(stored?.timeBoxes).toHaveLength(1)
  expect(stored?.timeBoxes?.[0]?.startSlot).toBe(0)
})
