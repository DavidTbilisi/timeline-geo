import { test as base, expect } from '@playwright/test'

/**
 * Shared test fixture for timeline-geo e2e specs.
 *
 * Pre-seeds sessionStorage so the IntroSplash overlay (LandingPage.vue) never
 * appears in tests — it normally blocks pointer events on the first visit.
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
    await use(page)
  },
})

export { expect }
