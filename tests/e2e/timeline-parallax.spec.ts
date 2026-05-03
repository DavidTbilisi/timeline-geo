import { test, expect } from './fixtures'

/**
 * Specs for the visual layers in TimelineView.vue (issues #5 / #21).
 *
 * TimelineView renders two scrolling layers behind the events:
 *   z=1  .tl-paper  — paper-bg.jpg, full-speed (matches landing-paper)
 *   z=3  .tl-grid   — vertical grid lines, 1/3 parallax for depth
 *
 * The legacy .tl-period-bg slice layer was removed: it painted the
 * landing-page poster paintings under the events, which clashed with
 * the reference design (cream paper backdrop, period color shown only
 * via the sidebar artwork).
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

  test('legacy .tl-period-bg layer is no longer rendered', async ({ page }) => {
    await expect(page.locator('.tl-period-bg')).toHaveCount(0)
    await expect(page.locator('.tl-period-bg-slice')).toHaveCount(0)
  })
})
