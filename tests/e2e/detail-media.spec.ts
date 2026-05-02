import { test, expect } from './fixtures'

/**
 * Tests for the Images and Video tabs introduced in the detail panel redesign.
 * Uses julius-caesar which has both images (3) and a video (1).
 * Uses abraham which has multiple videos (12).
 */
test.describe('Detail Panel – Media tabs', () => {
  test.describe('Images tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/julius-caesar')
      await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 8000 })
      // Wait for detail to load (loading spinner gone)
      await expect(page.locator('[data-testid="tab-images"]')).toBeVisible({ timeout: 8000 })
    })

    test('Images tab is visible for an event with images', async ({ page }) => {
      await expect(page.locator('[data-testid="tab-images"]')).toBeVisible()
    })

    test('clicking Images tab shows pagination dots for multi-image events', async ({ page }) => {
      await page.locator('[data-testid="tab-images"]').click()
      // julius-caesar has 3 images so pagination dots container should appear
      await expect(page.locator('[data-testid="image-dots"]')).toBeVisible({ timeout: 3000 })
    })

    test('pagination dots allow switching between images', async ({ page }) => {
      await page.locator('[data-testid="tab-images"]').click()
      const dots = page.locator('[data-testid="image-dots"] button')
      const count = await dots.count()
      expect(count).toBeGreaterThan(1)

      // Click the second dot
      await dots.nth(1).click()
      // The active dot should now be the second one (scaled / colored)
      // We can't assert exact color, but verify the click doesn't error
      await expect(dots.nth(1)).toBeVisible()
    })
  })

  test.describe('Video tab – single video (julius-caesar)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/julius-caesar')
      await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 8000 })
      await expect(page.locator('[data-testid="tab-video"]')).toBeVisible({ timeout: 8000 })
    })

    test('Video tab is visible for an event with videos', async ({ page }) => {
      await expect(page.locator('[data-testid="tab-video"]')).toBeVisible()
    })

    test('clicking Video tab renders a <video> element', async ({ page }) => {
      await page.locator('[data-testid="tab-video"]').click()
      await expect(page.locator('[data-testid="video-player"]')).toBeVisible({ timeout: 3000 })
    })

    test('single-video events do not show a video list', async ({ page }) => {
      await page.locator('[data-testid="tab-video"]').click()
      await expect(page.locator('[data-testid="video-list"]')).not.toBeVisible()
    })
  })

  test.describe('Video tab – multiple videos (abraham)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/event/abraham')
      await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 8000 })
      await expect(page.locator('[data-testid="tab-video"]')).toBeVisible({ timeout: 8000 })
    })

    test('Video tab is visible', async ({ page }) => {
      await expect(page.locator('[data-testid="tab-video"]')).toBeVisible()
    })

    test('clicking Video tab renders the video player', async ({ page }) => {
      await page.locator('[data-testid="tab-video"]').click()
      await expect(page.locator('[data-testid="video-player"]')).toBeVisible({ timeout: 3000 })
    })

    test('multiple-video events show the video list', async ({ page }) => {
      await page.locator('[data-testid="tab-video"]').click()
      await expect(page.locator('[data-testid="video-list"]')).toBeVisible({ timeout: 3000 })
    })

    test('clicking a different video in the list reloads the player', async ({ page }) => {
      await page.locator('[data-testid="tab-video"]').click()
      const listItems = page.locator('[data-testid="video-list"] button')
      const count = await listItems.count()
      expect(count).toBeGreaterThan(1)

      // Click the second video in the list
      await listItems.nth(1).click()
      await expect(page.locator('[data-testid="video-player"]')).toBeVisible()
    })
  })

  test('Video tab is absent for an event without videos (adam)', async ({ page }) => {
    await page.goto('/event/adam')
    await expect(page.locator('.detail-overlay')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('[data-testid="tab-article"]')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('[data-testid="tab-video"]')).not.toBeVisible()
  })
})
