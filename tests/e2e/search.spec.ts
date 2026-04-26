import { test, expect } from '@playwright/test'

// The search results dropdown selector: absolute-positioned within the search widget
// Using .absolute to exclude the page wrapper that also has .bg-stone-900
const SEARCH_DROPDOWN = '.bg-stone-900.absolute'

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    // Wait for events to render
    await page.waitForSelector('.tl-event', { timeout: 10000 })
  })

  test('search input is visible in the nav bar', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    await expect(input).toBeVisible()
  })

  test('typing in search shows results dropdown', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    await input.fill('adam')
    await page.waitForTimeout(300) // debounce

    // The results dropdown is absolutely positioned within the search widget
    const results = page.locator(SEARCH_DROPDOWN)
    await expect(results).toBeVisible({ timeout: 3000 })
  })

  test('search results contain matching events', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    await input.fill('noah')
    await page.waitForTimeout(300)

    const resultButtons = page.locator(`${SEARCH_DROPDOWN} button`)
    await expect(resultButtons.first()).toBeVisible({ timeout: 3000 })
  })

  test('clicking a search result opens event detail', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    await input.fill('adam')
    await page.waitForTimeout(300)

    const resultButtons = page.locator(`${SEARCH_DROPDOWN} button`)
    await resultButtons.first().click({ force: true }) // mousedown triggers before blur

    await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 3000 })
  })

  test('clearing search hides the results dropdown', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    await input.fill('adam')
    await page.waitForTimeout(300)
    // Verify dropdown appeared first
    await expect(page.locator(SEARCH_DROPDOWN)).toBeVisible({ timeout: 3000 })

    // Clear the search
    await input.fill('')
    // Dropdown should disappear (v-if="searchResults.length" becomes false)
    await expect(page.locator(SEARCH_DROPDOWN)).not.toBeVisible({ timeout: 3000 })
  })

  test('shows no-results message for unknown query', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    await input.fill('xyzxyzxyz_nonexistent')
    await page.waitForTimeout(300) // debounce

    await expect(page.locator('text=შედეგი ვერ მოიძებნა')).toBeVisible({ timeout: 3000 })
  })
})
