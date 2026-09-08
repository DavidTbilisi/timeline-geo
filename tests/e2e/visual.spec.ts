import { test, expect } from './fixtures'

/**
 * Screenshot guards for the framework refactor.
 *
 * These pin the three main screens so each refactor phase can prove it
 * left rendering unchanged. Chromium only: baselines are generated and
 * compared on Linux (locally and in CI); font rasterisation differs across
 * OSes, so other projects skip. Regenerate deliberately with
 *   npx playwright test visual --project=chromium --update-snapshots
 *
 * The TodayMarker depends on the wall-clock year, so it is masked.
 */
test.describe('visual baselines', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'chromium-only baselines')
  test.use({ viewport: { width: 1280, height: 800 } })

  async function settle(page: import('@playwright/test').Page) {
    await page.evaluate(() => document.fonts.ready)
    // Scroller momentum + period scroll animation (~250ms) + label fade.
    await page.waitForTimeout(900)
  }

  test('landing page', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid^="period-card-"]')
    await settle(page)
    // The welcome paragraph and the footer bar render in Georgia, a system
    // font whose fallback differs between machines; mask them and allow a
    // little more slack for the remaining anti-aliasing differences.
    await expect(page).toHaveScreenshot('landing.png', {
      animations: 'disabled',
      mask: [page.locator('.landing-footer .welcome p'), page.locator('.landing-footer .bar')],
      maxDiffPixelRatio: 0.02,
    })
  })

  test('timeline: first period', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event')
    await settle(page)
    await expect(page).toHaveScreenshot('timeline-first-generation.png', {
      animations: 'disabled',
      mask: [page.locator('.today-marker')],
    })
  })

  test('event detail: adam', async ({ page }) => {
    await page.goto('/event/adam')
    await page.waitForSelector('.detail-overlay h1')
    await page.waitForSelector('.detail-overlay p', { state: 'attached' })
    await settle(page)
    await expect(page).toHaveScreenshot('event-adam.png', {
      animations: 'disabled',
      mask: [page.locator('.today-marker')],
    })
  })
})
