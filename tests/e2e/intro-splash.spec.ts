import { test, expect } from './fixtures'

/**
 * Specs for IntroSplash (LandingPage.vue).
 *
 * The shared fixture pre-sets sessionStorage 'tl-intro-seen'='1', so each
 * test that wants to see the splash must clear it in an addInitScript override
 * or via a beforeEach page.evaluate before navigation.
 */
test.describe('IntroSplash', () => {
  test('splash is visible on first visit (no sessionStorage flag)', async ({ page }) => {
    // Override the fixture's pre-seed: clear the intro-seen flag before the page loads
    await page.addInitScript(() => {
      sessionStorage.removeItem('tl-intro-seen')
    })
    await page.goto('/')
    // The splash overlay covers the whole viewport
    const splash = page.locator('.fixed.inset-0.z-50')
    await expect(splash).toBeVisible({ timeout: 5000 })
  })

  test('clicking the splash dismisses it and sets sessionStorage flag', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('tl-intro-seen')
    })
    await page.goto('/')

    const splash = page.locator('.fixed.inset-0.z-50')
    await expect(splash).toBeVisible({ timeout: 5000 })

    // Click to dismiss
    await splash.click()

    // The splash fades out (300 ms transition) then the component is removed
    await expect(splash).not.toBeVisible({ timeout: 2000 })

    // sessionStorage flag must be set
    const flag = await page.evaluate(() => sessionStorage.getItem('tl-intro-seen'))
    expect(flag).toBe('1')
  })

  test('reload within the same session does not re-show the splash', async ({ page }) => {
    // The fixture already sets tl-intro-seen=1 so the splash is never rendered.
    // Navigate to the landing page and verify the splash is absent.
    await page.goto('/')

    // The landing view (period cards) should be visible immediately
    await expect(page.locator('[data-testid="landing-view"]')).toBeVisible({ timeout: 5000 })

    // The splash overlay must not be in the DOM
    await expect(page.locator('.fixed.inset-0.z-50')).not.toBeAttached()
  })
})
