import { test, expect } from './fixtures'

/**
 * Issue #58 — period view used to (per the bug report) fetch all 13
 * `period-N.json` files plus thumbnails for events across the whole
 * timeline on first paint. The current `TimelineStage.refreshEvents`
 * already restricts loading to the active period ± 1, but there's no
 * test pinning that contract; a future change could regress it.
 *
 * This spec records the expected request envelope: opening
 * `/period/early-church` (id=10) should request period-9, period-10,
 * and period-11 — at most 4 distinct period JSONs, never all 13.
 */
test.describe('Period lazy-load (issue #58)', () => {
  test('only fetches active period ± 1 JSONs on first paint', async ({ page }) => {
    const periodFetches = new Set<number>()
    page.on('request', (req) => {
      const url = req.url()
      // Match Vite's served path for src/data/events/period-N.json (dev) and
      // the asset path that vite-built code uses (prod): both end in
      // `period-N.json` (possibly with a hash suffix in prod, e.g.
      // `period-3-abc123.json`).
      const match = url.match(/period-(\d+)(?:[.-][^/]*)?\.json(?:\?|$)/)
      if (match) periodFetches.add(Number(match[1]))
    })

    await page.goto('/period/early-church') // id=10
    await page.waitForSelector('.tl-event', { timeout: 10000 })

    // Helpful diagnostic if the assertions below fail.
    const fetched = Array.from(periodFetches).sort((a, b) => a - b)
    test.info().annotations.push({
      type: 'periods-fetched',
      description: fetched.join(','),
    })

    // We MUST have loaded period 10 (the active one).
    expect(fetched).toContain(10)

    // We MUST NOT have loaded distant periods.
    expect(fetched).not.toContain(1)
    expect(fetched).not.toContain(13)

    // Total fetched should be small: active + neighbors only.
    expect(fetched.length).toBeLessThanOrEqual(4)
  })
})
