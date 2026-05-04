import { test as base, expect } from '@playwright/test'

/**
 * 1x1 transparent PNG used to fulfill image requests in tests.
 *
 * Reference images live under `public/media/images/**` but are gitignored
 * (re-fetchable via `npm run fetch:images`). CI doesn't fetch them, so
 * requests fall through to Vite's SPA fallback (200 + index.html). The
 * browser fails to decode HTML as an image and fires `onError`, which
 * makes `DetailImages` drop the image from `validImages` and hide the
 * pagination dots — flaking `detail-media.spec.ts:27`.
 *
 * Routing all image requests to a known-good PNG keeps the test
 * hermetic and removes the need to fetch hundreds of MB in CI.
 */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==',
  'base64',
)

/**
 * Shared test fixture for timeline-geo e2e specs.
 *
 * - Pre-seeds sessionStorage so the IntroSplash overlay (LandingPage.vue)
 *   never appears in tests — it normally blocks pointer events on first visit.
 * - Intercepts `/media/images/**` requests and returns a 1x1 PNG so tests
 *   don't depend on the gitignored real-image set being present.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        // Set up test storage ONCE per browser context. Subsequent navigations
        // would otherwise wipe state the test itself wrote (e.g. favorites added
        // mid-test then read after a back navigation). The marker lives in
        // sessionStorage so it persists across same-origin navigations.
        if (window.sessionStorage.getItem('__tl_test_init') === '1') return
        window.sessionStorage.setItem('__tl_test_init', '1')
        window.sessionStorage.setItem('tl-intro-seen', '1')
        window.localStorage.removeItem('tl-geo-favorites')
      } catch {
        /* private browsing or storage disabled — splash will show, tests may need to dismiss */
      }
    })

    await page.route('**/media/images/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: TINY_PNG,
      }),
    )

    await use(page)
  },
})

export { expect }
