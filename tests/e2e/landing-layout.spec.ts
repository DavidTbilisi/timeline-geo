import { test, expect } from './fixtures'

/**
 * Focused layout checks for the reference-matching landing page.
 * Verifies: 13 period cards, 3 era arches, welcome panel visibility,
 * and period-card click navigation.
 */
test.describe('Landing layout — reference match', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Dismiss intro splash if present (it blocks interaction)
    const launchBtn = page.locator('button:has-text("Launch"), button:has-text("Enter"), [data-testid="launch-btn"]')
    if (await launchBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await launchBtn.click()
    }
  })

  test('renders exactly 13 period cards', async ({ page }) => {
    const cards = page.locator('[data-testid^="period-card-"]')
    await expect(cards).toHaveCount(13)
  })

  test('era arches show 3 era headings', async ({ page }) => {
    const arches = page.locator('[data-testid^="era-arch-"]')
    await expect(arches).toHaveCount(3)
    // The era arch h3 text is in the DOM even if visually hidden by sprite CSS
    await expect(page.locator('[data-testid="era-arch-1"] h3')).toContainText(/Patriarchs|პატრიარქ/i)
    await expect(page.locator('[data-testid="era-arch-2"] h3')).toContainText(/Israel|ისრაელ/i)
    await expect(page.locator('[data-testid="era-arch-3"] h3')).toContainText(/Christ|ქრისტე/i)
  })

  test('welcome panel is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="welcome-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="welcome-heading"]')).toBeVisible()
  })

  test('period card click navigates to /period/:slug', async ({ page }) => {
    // Click the first period card (First Generation / პირველი თაობა)
    await page.locator('[data-testid="period-card-1"]').click()
    await expect(page).toHaveURL(/\/period\/first-generation/)
  })
})
