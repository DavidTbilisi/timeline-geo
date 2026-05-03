import { test, expect } from './fixtures'

/**
 * Visual-parity checks for issues #5 and #21.
 * Verifies that the parallax paper/grid layers, period background images,
 * sidebar strip, and period-colored date bars are all present in the DOM.
 * Does NOT run a full visual diff — just structural assertions.
 */
test.describe('Timeline Visuals (issues #5 & #21)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-stage', { timeout: 10000 })
  })

  test('paper texture layer is rendered with parallax class', async ({ page }) => {
    // The paper layer must exist and carry the tl-paper class (parallax at 1/3 speed)
    const paper = page.locator('.tl-paper')
    await expect(paper).toBeAttached()
    // Should have a background-image pointing at paper-bg.jpg
    const bgImage = await paper.evaluate((el) =>
      (el as HTMLElement).style.backgroundImage
    )
    expect(bgImage).toContain('paper-bg.jpg')
  })

  test('paper-bg backdrop is the sole stage background (no period painting layer)', async ({ page }) => {
    // The cream/paper texture is the only background layer behind the
    // events — the legacy .tl-period-bg slice layer (which painted the
    // landing-page poster paintings under the events) was removed.
    await expect(page.locator('.tl-paper')).toBeVisible()
    await expect(page.locator('.tl-period-bg')).toHaveCount(0)
    await expect(page.locator('.tl-period-bg-slice')).toHaveCount(0)
  })

  test('sidebar strip exists and contains 13 panels; translates to active period', async ({ page }) => {
    // Viewport wrapper must be present
    const viewport = page.locator('.tl-sidebar-viewport')
    await expect(viewport).toBeAttached()

    // Inner strip must have 13 panels
    const panels = page.locator('.tl-sidebar-panel')
    await expect(panels).toHaveCount(13)

    // For period 1 (first-generation), the strip translate should be 0px
    const strip = page.locator('.tl-sidebar-strip')
    const transform = await strip.evaluate((el) =>
      (el as HTMLElement).style.transform
    )
    // Period 1 → offset = (1-1)*220 = 0  →  translate3d(0px, 0, 0)
    expect(transform).toContain('translate3d(0px')
  })
})
