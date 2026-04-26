import { test, expect } from '@playwright/test'

test.describe('Date Bars & Center Line', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-datebar', { timeout: 10000 })
  })

  test('top date bar is visible', async ({ page }) => {
    const topBar = page.locator('.tl-datebar').first()
    await expect(topBar).toBeVisible()
  })

  test('top date bar has correct height (66px)', async ({ page }) => {
    const height = await page.locator('.tl-datebar').first().evaluate(
      el => el.getBoundingClientRect().height
    )
    expect(height).toBeCloseTo(66, 0)
  })

  test('bottom date bar is rendered', async ({ page }) => {
    // Bottom bar has class tl-datebar-bottom
    const bottomBar = page.locator('.tl-datebar-bottom')
    await expect(bottomBar).toBeAttached()
  })

  test('both date bars contain tick marks', async ({ page }) => {
    // Count tick marks in top date bar
    const ticks = page.locator('.tl-datebar .absolute.w-px')
    const count = await ticks.count()
    // Should have both minor and major ticks (we expect many)
    expect(count).toBeGreaterThan(10)
  })

  test('date bar labels contain Georgian BC text', async ({ page }) => {
    const labels = page.locator('.tl-datebar span')
    const firstLabel = await labels.first().textContent()
    // First period labels should contain ძვ.წ.
    expect(firstLabel).toMatch(/ძვ\.წ\./)
  })

  test('center line is rendered at 50% from left', async ({ page }) => {
    const centerLine = page.locator('[style*="left: 50%"][style*="width: 1px"]')
    await expect(centerLine).toBeAttached()
    const left = await centerLine.evaluate(el =>
      window.getComputedStyle(el).left
    )
    // Should be 50% of container width
    const containerWidth = await page.locator('.bg-stone-950').evaluate(
      el => el.getBoundingClientRect().width
    )
    const leftPx = parseFloat(left)
    expect(leftPx).toBeCloseTo(containerWidth / 2, -1)
  })

  test('year bubble is centered horizontally at 50%', async ({ page }) => {
    const bubble = page.locator('.year-bubble')
    await expect(bubble).toBeVisible()
    const bubbleBox = await bubble.boundingBox()
    const containerBox = await page.locator('.bg-stone-950').boundingBox()
    if (bubbleBox && containerBox) {
      const bubbleCenter = bubbleBox.x + bubbleBox.width / 2
      const containerCenter = containerBox.x + containerBox.width / 2
      // Bubble center should be within 10px of viewport center
      expect(Math.abs(bubbleCenter - containerCenter)).toBeLessThan(10)
    }
  })

  test('date bars translate when timeline scrolls', async ({ page }) => {
    const topBar = page.locator('.tl-datebar').first()
    const initialTransform = await topBar.evaluate(el => el.style.transform)

    // Scroll the timeline right
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)

    const newTransform = await topBar.evaluate(el => el.style.transform)
    expect(newTransform).not.toEqual(initialTransform)
  })

  test('date bar labels switch to AD for post-BC periods', async ({ page }) => {
    // Navigate to Life of Christ period which crosses BC/AD boundary
    await page.goto('/period/life-of-christ')
    await page.waitForSelector('.tl-datebar', { timeout: 10000 })

    const labels = page.locator('.tl-datebar span')
    const allLabels = await labels.allTextContents()
    // Should have at least one AD label
    const hasAD = allLabels.some(l => l.includes('ახ.წ.'))
    expect(hasAD).toBe(true)
  })
})
