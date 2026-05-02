import { test, expect } from './fixtures'

/**
 * Specs for DetailArticle paragraph splitting.
 *
 * DetailArticle.vue splits the raw article string on runs of two or more
 * consecutive <BR /> tags, producing individual <p> elements.  The adam
 * detail JSON has three such paragraphs.
 */
test.describe('DetailArticle paragraph splitting', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the adam event detail
    await page.goto('/event/adam')
    await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 10000 })
    // Wait for the loading spinner to disappear (detail JSON fetched)
    await expect(page.locator('.detail-overlay .animate-spin')).not.toBeAttached({ timeout: 10000 })
    // Make sure the article tab is active (it is the default)
    await expect(page.locator('[data-testid="tab-article"]')).toBeVisible()
  })

  test('article tab renders more than one paragraph element', async ({ page }) => {
    // The tab content area contains <p> tags for each split paragraph
    const tabContent = page.locator('.detail-overlay .flex-1.overflow-y-auto')
    const paragraphs = tabContent.locator('p')
    const count = await paragraphs.count()
    expect(count).toBeGreaterThan(1)
  })

  test('each paragraph has non-empty text content', async ({ page }) => {
    const tabContent = page.locator('.detail-overlay .flex-1.overflow-y-auto')
    const paragraphs = tabContent.locator('p')
    const count = await paragraphs.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const text = await paragraphs.nth(i).textContent()
      expect(text?.trim().length ?? 0).toBeGreaterThan(0)
    }
  })
})
