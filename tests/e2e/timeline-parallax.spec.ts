import { test, expect } from './fixtures'

/**
 * Specs for the parallax visual layers in TimelineView.vue (issues #5 / #21).
 *
 * TimelineView renders three scrolling layers with independent speeds:
 *   z=1  .tl-period-bg  — full-speed; contains 13 .tl-period-bg-slice divs
 *   z=2  .tl-paper       — 1/3 parallax; paper texture background
 *   z=3  .tl-grid        — 1/3 parallax; grid overlay
 */
test.describe('Timeline Parallax Layers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-stage', { timeout: 10000 })
  })

  test('.tl-paper layer exists and uses paper-bg.jpg as background', async ({ page }) => {
    const paper = page.locator('.tl-paper')
    await expect(paper).toBeAttached()
    const bgImage = await paper.evaluate(
      (el) => (el as HTMLElement).style.backgroundImage
    )
    expect(bgImage).toContain('paper-bg.jpg')
  })

  test('.tl-grid layer exists', async ({ page }) => {
    const grid = page.locator('.tl-grid')
    await expect(grid).toBeAttached()
  })

  test('period background container .tl-period-bg exists', async ({ page }) => {
    const periodBg = page.locator('.tl-period-bg')
    await expect(periodBg).toBeAttached()
  })

  test('exactly 13 .tl-period-bg-slice elements are rendered', async ({ page }) => {
    const slices = page.locator('.tl-period-bg-slice')
    await expect(slices).toHaveCount(13)
  })

  test('each .tl-period-bg-slice has a non-empty backgroundImage style', async ({ page }) => {
    const slices = page.locator('.tl-period-bg-slice')
    const count = await slices.count()
    expect(count).toBe(13)

    for (let i = 0; i < count; i++) {
      const bg = await slices.nth(i).evaluate(
        (el) => (el as HTMLElement).style.backgroundImage
      )
      expect(bg.length).toBeGreaterThan(0)
    }
  })
})
