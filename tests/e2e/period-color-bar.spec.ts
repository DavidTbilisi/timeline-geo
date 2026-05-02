import { test, expect } from './fixtures'

/**
 * Specs for PeriodColorBar component.
 *
 * The color bar renders 13 colored segments that let the user jump to any
 * period. It appears both on the timeline page (inside TimelineFooter) and
 * on the landing page (inside LandingView footer).
 */
test.describe('PeriodColorBar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.period-color-bar', { timeout: 10000 })
  })

  test('renders exactly 13 segments', async ({ page }) => {
    const segments = page.locator('.period-color-segment')
    await expect(segments).toHaveCount(13)
  })

  test('segments have the correct background colors from PERIODS data', async ({ page }) => {
    // Spot-check the first 3 period colors defined in src/data/periods.ts.
    // Browsers normalize inline color values to rgb() form, so compare in rgb space.
    const expectedRgb: Record<number, string> = {
      0: 'rgb(173, 31, 38)',  // #ad1f26 — First Generation
      1: 'rgb(219, 47, 44)',  // #db2f2c — Noah & the Flood
      2: 'rgb(187, 51, 128)', // #bb3380 — The Patriarchs
    }

    const segments = page.locator('.period-color-segment')
    for (const [indexStr, rgb] of Object.entries(expectedRgb)) {
      const index = Number(indexStr)
      const bg = await segments.nth(index).evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      )
      expect(bg).toBe(rgb)
    }
  })

  test('clicking a segment navigates to the corresponding period URL', async ({ page }) => {
    // Click the 3rd segment (index 2) → "the-patriarchs"
    const segments = page.locator('.period-color-segment')
    await segments.nth(2).click()
    await expect(page).toHaveURL(/\/period\/the-patriarchs/, { timeout: 5000 })
  })

  test('the active segment has is-active class', async ({ page }) => {
    // On /period/first-generation the first segment (period id=1) should be active
    const firstSegment = page.locator('.period-color-segment').first()
    await expect(firstSegment).toHaveClass(/is-active/)
  })

  test('navigating to a different period updates the active segment', async ({ page }) => {
    const segments = page.locator('.period-color-segment')

    // Click the second segment (period id=2, noah-and-the-flood)
    await segments.nth(1).click()
    await expect(page).toHaveURL(/\/period\/noah-and-the-flood/, { timeout: 5000 })

    // Now the second segment should carry is-active
    await expect(segments.nth(1)).toHaveClass(/is-active/, { timeout: 3000 })
    // And the first should no longer be active
    await expect(segments.first()).not.toHaveClass(/is-active/)
  })
})
