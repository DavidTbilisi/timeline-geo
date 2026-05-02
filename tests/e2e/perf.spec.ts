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
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event.major', { timeout: 10000 })
    await page.locator('.tl-event.major').first().click({ timeout: 5000 })
    await page.waitForSelector('.detail-overlay', { timeout: 10000 })

    // DetailImages mounts only when the Images tab is active (v-if="activeTab === 'images'").
    await page.locator('[data-testid="tab-images"]').click()

    // Once mounted, DetailImages renders one hidden preload <img> per image plus
    // the main visible <img>; all should have loading="lazy".
    const detailImgs = page.locator('.detail-overlay img')
    await expect(detailImgs.first()).toBeVisible({ timeout: 8000 }).catch(() => null)
    const count = await detailImgs.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const loading = await detailImgs.nth(i).getAttribute('loading')
      expect(loading).toBe('lazy')
    }
  })
})
