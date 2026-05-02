import { test, expect } from './fixtures'

/**
 * Keyboard navigation tests for useKeyboard composable.
 * Covers ArrowRight/ArrowLeft scrolling and Escape-to-close-detail.
 */
test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10_000 })
  })

  test('ArrowRight scrolls the timeline forward', async ({ page }) => {
    // Read the current CSS transform / scroll position from the timeline stage
    const getTranslateX = () =>
      page.evaluate(() => {
        const stage = document.querySelector<HTMLElement>('.tl-stage')
        if (!stage) return 0
        const m = new DOMMatrix(window.getComputedStyle(stage).transform)
        return m.m41 // translateX value
      })

    const before = await getTranslateX()
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(50)
    const after = await getTranslateX()

    // After pressing ArrowRight the stage should have scrolled left
    // (translateX becomes more negative, i.e. after < before)
    expect(after).toBeLessThan(before)
  })

  test('ArrowLeft scrolls the timeline back', async ({ page }) => {
    const getTranslateX = () =>
      page.evaluate(() => {
        const stage = document.querySelector<HTMLElement>('.tl-stage')
        if (!stage) return 0
        const m = new DOMMatrix(window.getComputedStyle(stage).transform)
        return m.m41
      })

    // First scroll right so we have room to go left. Wait long enough for the
    // scroll animation (driven by useScroller) to settle before reading position.
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)
    const mid = await getTranslateX()

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(500)
    const after = await getTranslateX()

    // After ArrowLeft translateX should increase (move right)
    expect(after).toBeGreaterThan(mid)
  })

  test('Escape closes the event detail overlay', async ({ page }) => {
    // Open the first event via click
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 3_000 })

    // Press Escape — should close the overlay
    await page.keyboard.press('Escape')
    await expect(page.locator('.detail-overlay')).not.toBeVisible({ timeout: 3_000 })
  })

  test('Escape after closing detail navigates to /period/ URL', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page).toHaveURL(/\/event\//, { timeout: 3_000 })

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/period\//, { timeout: 3_000 })
  })
})
