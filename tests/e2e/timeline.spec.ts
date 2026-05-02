import { test, expect } from './fixtures'

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    // Wait for event items to be rendered (they have explicit width/height/left so are always visible)
    await page.waitForSelector('.tl-event', { timeout: 10000 })
  })

  test('renders the timeline container', async ({ page }) => {
    // .tl-stage has an explicit width set so it is visible
    await expect(page.locator('.tl-stage')).toBeVisible()
  })

  test('shows the top date bar with year labels', async ({ page }) => {
    const datebar = page.locator('.tl-datebar').first()
    await expect(datebar).toBeVisible()
    // Should have year label spans with Georgian BC suffix
    await expect(page.locator('.tl-datebar span').first()).toBeVisible()
  })

  test('shows bottom date bar with year labels', async ({ page }) => {
    // Bottom date bar has class tl-datebar-bottom
    const bottomBar = page.locator('.tl-datebar-bottom')
    await expect(bottomBar).toBeAttached()
    // Bottom bar also has tick spans
    const bottomSpans = page.locator('.tl-datebar-bottom span')
    await expect(bottomSpans.first()).toBeVisible()
  })

  test('year bubble shows current year in Georgian', async ({ page }) => {
    const bubble = page.locator('.year-bubble')
    await expect(bubble).toBeVisible()
    const text = await bubble.textContent()
    // Should contain Georgian BC suffix for period 1
    expect(text).toMatch(/ძვ\.წ\./)
  })

  test('year bubble has downward arrow indicator', async ({ page }) => {
    // The arrow div is a child of year-bubble
    const arrow = page.locator('.year-bubble > div')
    await expect(arrow).toBeAttached()
  })

  test('shows a center line indicator', async ({ page }) => {
    const centerLine = page.locator('[style*="left: 50%"][style*="width: 1px"]')
    await expect(centerLine).toBeAttached()
  })

  test('shows the sidebar panel with period name', async ({ page }) => {
    await expect(page.locator('.tl-sidebar')).toBeVisible()
    await expect(page.locator('.tl-sidebar')).toContainText('პირველი თაობა')
  })

  test('renders event bars on the stage', async ({ page }) => {
    const events = page.locator('.tl-event')
    await expect(events.first()).toBeVisible()
    const count = await events.count()
    expect(count).toBeGreaterThan(0)
  })

  test('shows period color bands background', async ({ page }) => {
    const bands = page.locator('[style*="linear-gradient(to right"]')
    await expect(bands).toBeAttached()
  })

  test('shows paper texture background', async ({ page }) => {
    const paper = page.locator('.tl-paper')
    await expect(paper).toBeAttached()
    const bg = await paper.evaluate(el =>
      window.getComputedStyle(el).backgroundImage
    )
    expect(bg).toContain('paper-bg.jpg')
  })

  test('arrow nav buttons are visible', async ({ page }) => {
    // Left and right scroll buttons contain SVG icons
    const leftBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M15 18"]') })
    const rightBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M9 18"]') })
    await expect(leftBtn).toBeVisible()
    await expect(rightBtn).toBeVisible()
  })

  test('right arrow scrolls the timeline', async ({ page }) => {
    const stage = page.locator('.tl-stage')
    const initialTransform = await stage.evaluate(el => el.style.transform)

    const rightBtn = page.locator('button').filter({ has: page.locator('svg path[d*="M9 18"]') })
    await rightBtn.click()
    await page.waitForTimeout(600) // scroll animation settles

    const newTransform = await stage.evaluate(el => el.style.transform)
    expect(newTransform).not.toEqual(initialTransform)
  })

  test('keyboard arrow keys scroll the timeline', async ({ page }) => {
    const stage = page.locator('.tl-stage')
    const initialTransform = await stage.evaluate(el => el.style.transform)

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)

    const newTransform = await stage.evaluate(el => el.style.transform)
    expect(newTransform).not.toEqual(initialTransform)
  })

  test('period footer shows 13 period dots', async ({ page }) => {
    const dots = page.locator('[data-testid="period-dot"]')
    await expect(dots).toHaveCount(13)
  })

  test('active period dot is highlighted', async ({ page }) => {
    // Period 1 dot should be the active (larger) one
    const activeDot = page.locator('[data-testid="period-dot"]').first()
    const cls = await activeDot.getAttribute('class')
    // Active dot has 'w-4 h-4' class, inactive dots have 'w-2.5 h-2.5'
    expect(cls).toContain('w-4')
  })

  test('clicking period dot changes active period', async ({ page }) => {
    const secondDot = page.locator('[data-testid="period-dot"]').nth(1)
    await secondDot.click()
    await page.waitForTimeout(800)

    // Sidebar should update to period 2 name
    await expect(page.locator('.tl-sidebar')).toContainText('ნოე')
  })

  test('navigating via URL slug loads correct period', async ({ page }) => {
    await page.goto('/period/united-kingdom')
    await page.waitForSelector('.tl-sidebar')
    await expect(page.locator('.tl-sidebar')).toContainText('გაერთიანებული სამეფო')
  })
})
