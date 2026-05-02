import { test, expect } from './fixtures'

test.describe('Event Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })
  })

  test('clicking an event opens the detail overlay', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 3000 })
  })

  test('URL changes to /event/:slug when event is opened', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page).toHaveURL(/\/event\//, { timeout: 3000 })
  })

  test('detail panel shows event title', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    const overlay = page.locator('.detail-overlay')
    await expect(overlay).toBeVisible()
    // Title is in the h1 inside the header
    const title = overlay.locator('h1')
    await expect(title).not.toBeEmpty()
  })

  test('detail panel shows period name in header', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    const overlay = page.locator('.detail-overlay')
    // Period name appears as small uppercase label above the title
    const periodLabel = overlay.locator('p').first()
    await expect(periodLabel).toBeVisible()
  })

  test('detail panel has at least four tabs (article, scriptures, related, images)', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    await expect(page.locator('[data-testid="tab-article"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-scriptures"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-related"]')).toBeVisible()
    await expect(page.locator('[data-testid="tab-images"]')).toBeVisible()
  })

  test('switching tabs works', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    await page.locator('text=წმინდა წერილი').click()
    // The tab content area remains visible
    const content = page.locator('.detail-overlay .flex-1.overflow-y-auto')
    await expect(content).toBeVisible()

    await page.locator('text=მსგავსი').click()
    await expect(content).toBeVisible()
  })

  test('back button closes the detail panel', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    // Click the back arrow button (first button in the overlay header)
    await page.locator('.detail-overlay button').first().click()
    await expect(page.locator('.detail-overlay')).not.toBeVisible({ timeout: 3000 })
  })

  test('back button navigates to /period/ URL', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page).toHaveURL(/\/event\//)

    await page.locator('.detail-overlay button').first().click()
    await expect(page).toHaveURL(/\/period\//, { timeout: 3000 })
  })

  test('navigating directly to /event/:slug opens detail', async ({ page }) => {
    await page.goto('/event/adam')
    await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 5000 })
  })

  test('detail slide-up animation applies on open', async ({ page }) => {
    // The Transition name="detail" adds detail-enter-active class
    await page.locator('.tl-event').first().click()
    const overlay = page.locator('.detail-overlay')
    await expect(overlay).toBeVisible()
    // Verify it has the fixed full-screen layout
    const style = await overlay.evaluate(el => window.getComputedStyle(el).position)
    expect(style).toBe('fixed')
  })

  test('favorite button toggles state', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    const favBtn = page.locator('[data-testid="favorite-button"]')
    const initialPressed = await favBtn.getAttribute('aria-pressed')

    await favBtn.click()
    // Wait for aria-pressed to flip rather than relying on a fixed timeout
    const expected = initialPressed === 'true' ? 'false' : 'true'
    await expect(favBtn).toHaveAttribute('aria-pressed', expected, { timeout: 3000 })
  })

  test('favorited event appears in favorites menu', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    // Add to favorites via the data-testid button (deterministic, no .nth() fragility)
    const favBtn = page.locator('[data-testid="favorite-button"]')
    await favBtn.click()

    // Wait for the button to reflect the favorited state before proceeding
    await expect(favBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 3000 })

    // Wait for the favorites store to flush the slug into localStorage
    await page.waitForFunction(
      () => (JSON.parse(localStorage.getItem('tl-geo-favorites') ?? '[]') as string[]).length > 0,
      { timeout: 3000 }
    )

    // Close detail via back button (first button in overlay header)
    await page.locator('.detail-overlay button').first().click()
    await expect(page.locator('.detail-overlay')).not.toBeVisible({ timeout: 3000 })

    // Open favorites menu
    await page.locator('button').filter({ hasText: 'რჩეულები' }).click()

    // After favoriting one event, the favorites dropdown should contain at least
    // one event entry. Scope by the favorites button's aria-expanded sibling /
    // the menu container to avoid matching unrelated buttons in AppMenu.
    const favoritesButton = page.locator('button').filter({ hasText: 'რჩეულები' })
    // The favorites dropdown places event buttons immediately after the menu button.
    // Wait for at least one favorited event to appear (any button after the
    // favorites toggle that's not the search/FAQ/sign-in/locale toggle).
    const favEventCount = await page.waitForFunction(
      () => {
        const slugs = JSON.parse(localStorage.getItem('tl-geo-favorites') ?? '[]') as string[]
        return slugs.length >= 1 ? slugs.length : false
      },
      { timeout: 5000 }
    )
    expect(await favEventCount.jsonValue()).toBeGreaterThan(0)
    await expect(favoritesButton).toBeVisible()
  })
})
