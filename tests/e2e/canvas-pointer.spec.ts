import { test, expect } from './fixtures'

test.describe('Canvas Pointer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })
  })

  test('canvas element is present in the DOM on the timeline page', async ({ page }) => {
    const canvas = page.locator('canvas.tl-canvas-pointer')
    await expect(canvas).toBeAttached()
  })

  test('hovering an event card causes the canvas to render pixels', async ({ page }) => {
    const canvas = page.locator('canvas.tl-canvas-pointer')
    await expect(canvas).toBeAttached()

    // Find a major event card and hover over it
    const eventCard = page.locator('.tl-event.major').first()
    await expect(eventCard).toBeAttached()
    await eventCard.hover()

    // Wait a moment for the canvas to render
    await page.waitForTimeout(100)

    // Check that the canvas has been painted (non-zero pixel data exists)
    const hasPixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.tl-canvas-pointer') as HTMLCanvasElement | null
      if (!canvas) return false
      const ctx = canvas.getContext('2d')
      if (!ctx) return false
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      // Check if any pixel has non-zero alpha
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return true
      }
      return false
    })

    expect(hasPixels).toBe(true)
  })
})
