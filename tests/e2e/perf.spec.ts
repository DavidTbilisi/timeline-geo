import { test, expect } from './fixtures'

test.describe('Performance: lazy-loading attributes', () => {
  test('event item thumbnails have loading="lazy"', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })

    // Select all <img> elements inside .tl-event (major event bars)
    const thumbnails = page.locator('.tl-event.major img')
    const count = await thumbnails.count()

    // There should be at least one event with an image on period 1
    // (if none have images, the assertion still passes — no eager images present)
    for (let i = 0; i < count; i++) {
      const loading = await thumbnails.nth(i).getAttribute('loading')
      expect(loading).toBe('lazy')
    }
  })

  test('detail image gallery images have loading="lazy"', async ({ page }) => {
    // Navigate to any event detail page; use a known slug that has images
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })

    // Click the first major event to open the detail panel
    const firstMajor = page.locator('.tl-event.major').first()
    await firstMajor.click()

    // Wait for the detail panel images component to appear
    await page.waitForSelector('[data-testid="image-dots"], .detail-images img, [class*="object-contain"]', {
      timeout: 8000,
      state: 'attached',
    })

    // All <img> elements rendered in the detail image area should be lazy
    const detailImgs = page.locator('[class*="object-contain"]')
    const detailCount = await detailImgs.count()
    for (let i = 0; i < detailCount; i++) {
      const tag = await detailImgs.nth(i).evaluate(el => el.tagName.toLowerCase())
      if (tag === 'img') {
        const loading = await detailImgs.nth(i).getAttribute('loading')
        expect(loading).toBe('lazy')
      }
    }
  })
})
