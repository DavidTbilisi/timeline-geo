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
