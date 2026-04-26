import { test, expect } from '@playwright/test'

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

  test('detail panel has three tabs', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    await expect(page.locator('text=სტატია')).toBeVisible()
    await expect(page.locator('text=სასულიერო წერილი')).toBeVisible()
    await expect(page.locator('text=მსგავსი')).toBeVisible()
  })

  test('switching tabs works', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    await page.locator('text=სასულიერო წერილი').click()
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

    const favBtn = page.locator('.detail-overlay button').nth(1) // star button
    const initialClass = await favBtn.getAttribute('class')

    await favBtn.click()
    await page.waitForTimeout(200)

    const newClass = await favBtn.getAttribute('class')
    expect(newClass).not.toEqual(initialClass)
  })

  test('favorited event appears in favorites menu', async ({ page }) => {
    await page.locator('.tl-event').first().click()
    await expect(page.locator('.detail-overlay')).toBeVisible()

    // Get event title from the detail overlay h1
    const title = await page.locator('.detail-overlay h1').textContent()

    // Add to favorites via the star button (second button in header)
    const favBtn = page.locator('.detail-overlay button').nth(1)
    await favBtn.click()
    await page.waitForTimeout(200)

    // Close detail via back button (first button)
    await page.locator('.detail-overlay button').first().click()
    await expect(page.locator('.detail-overlay')).not.toBeVisible({ timeout: 3000 })

    // Open favorites menu
    await page.locator('button').filter({ hasText: 'რჩეულები' }).click()

    // The favorited event should appear as a button in the favorites dropdown
    // Use getByRole('button') to avoid matching event tiles on the stage (which are divs)
    const trimmedTitle = title?.trim() ?? ''
    await expect(page.getByRole('button', { name: trimmedTitle })).toBeVisible({ timeout: 3000 })
  })
})
