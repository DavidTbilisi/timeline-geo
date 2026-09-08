import { test, expect } from './fixtures'
import { PERIODS, hexToRgb } from './content'

/**
 * Specs for PeriodColorBar component.
 *
 * The color bar renders one colored segment per period so the user can jump to any
 * period. It appears both on the timeline page (inside TimelineFooter) and
 * on the landing page (inside LandingView footer).
 */
test.describe('PeriodColorBar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.period-color-bar', { timeout: 10000 })
  })

  test('renders exactly one segment per period', async ({ page }) => {
    const segments = page.locator('.period-color-segment')
    await expect(segments).toHaveCount(PERIODS.length)
  })

  test('segments have the correct background colors from the period content', async ({ page }) => {
    // Spot-check the first 3 period colors from content/periods.json.
    // Browsers normalize inline color values to rgb() form, so compare in rgb space.
    const expectedRgb: Record<number, string> = Object.fromEntries(
      PERIODS.slice(0, 3).map((p, i) => [i, hexToRgb(p.color)]),
    )

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
