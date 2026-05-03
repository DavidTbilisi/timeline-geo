import { test, expect } from './fixtures'

// Issue #18 — mobile/tablet responsive layout (phase 1: AppMenu hamburger)
// At < md (768px), the desktop search/buttons row collapses into a hamburger
// that opens a drawer holding search + favorites + FAQ + sign in + lang toggle.
test.describe('AppMenu — mobile hamburger (< md)', () => {
  test.use({ viewport: { width: 375, height: 700 } })

  test('hamburger is visible on mobile, desktop bar items are hidden', async ({ page }) => {
    await page.goto('/period/first-generation')
    // Sidebar is display:none at mobile width; wait for the mobile period chip instead.
    await page.waitForSelector('[data-testid="tl-mobile-period-chip"]', { timeout: 8000 })

    const toggle = page.getByTestId('mobile-menu-toggle')
    await expect(toggle).toBeVisible()

    // Drawer is closed initially
    await expect(page.getByTestId('mobile-menu')).toHaveCount(0)
  })

  test('opens drawer with search + actions, then closes via hamburger toggle', async ({ page }) => {
    await page.goto('/period/first-generation')
    // Sidebar is display:none at mobile width; wait for the mobile period chip instead.
    await page.waitForSelector('[data-testid="tl-mobile-period-chip"]', { timeout: 8000 })

    const toggle = page.getByTestId('mobile-menu-toggle')
    await toggle.click()
    const drawer = page.getByTestId('mobile-menu')
    await expect(drawer).toBeVisible()

    // Drawer contains the FAQ + Sign In + Favorites + Lang buttons
    await expect(drawer.locator('button', { hasText: 'კითხვა-პასუხი' })).toBeVisible()
    await expect(drawer.locator('button', { hasText: 'შესვლა' })).toBeVisible()
    await expect(drawer.locator('button', { hasText: 'რჩეულები' })).toBeVisible()

    // Tap the hamburger again to close
    await toggle.click()
    await expect(drawer).toHaveCount(0)
  })

  test('opening FAQ from drawer closes the drawer', async ({ page }) => {
    await page.goto('/period/first-generation')
    // Sidebar is display:none at mobile width; wait for the mobile period chip instead.
    await page.waitForSelector('[data-testid="tl-mobile-period-chip"]', { timeout: 8000 })

    await page.getByTestId('mobile-menu-toggle').click()
    await page.getByTestId('mobile-menu').locator('button', { hasText: 'კითხვა-პასუხი' }).click()

    await expect(page.getByTestId('faq-modal')).toBeVisible()
    await expect(page.getByTestId('mobile-menu')).toHaveCount(0)
  })

  test('timeline sidebar is hidden and period chip is shown on mobile', async ({ page }) => {
    await page.goto('/period/the-judges')
    // Sidebar viewport stays in DOM for canvas math but is display:none via media query
    const sidebar = page.locator('.tl-sidebar-viewport')
    await expect(sidebar).toBeAttached()
    await expect(sidebar).toBeHidden()

    // Mobile period chip is visible and shows the active period name (Georgian default)
    const chip = page.getByTestId('tl-mobile-period-chip')
    await expect(chip).toBeVisible()
    await expect(chip).toHaveText(/მსაჯულები/)
  })

  test('FAQ modal stacks question list above answer on mobile', async ({ page }) => {
    await page.goto('/period/first-generation')
    // Sidebar is display:none at mobile width; wait for the mobile period chip instead.
    await page.waitForSelector('[data-testid="tl-mobile-period-chip"]', { timeout: 8000 })

    await page.getByTestId('mobile-menu-toggle').click()
    await page.getByTestId('mobile-menu').locator('button', { hasText: 'კითხვა-პასუხი' }).click()

    const modal = page.getByTestId('faq-modal')
    await expect(modal).toBeVisible()

    // First question button (in list) should be vertically above the answer heading
    const firstQuestionBtn = modal.locator('ul button').first()
    const answerHeading = modal.locator('h3').first()
    const qBox = await firstQuestionBtn.boundingBox()
    const aBox = await answerHeading.boundingBox()
    if (!qBox || !aBox) throw new Error('missing bounding boxes')
    // Stacked layout: answer heading is below the question list (greater y).
    expect(aBox.y).toBeGreaterThan(qBox.y + qBox.height)
    // And the question list spans most of the modal width (not w-1/3 like desktop)
    const list = modal.locator('ul')
    const listBox = await list.boundingBox()
    const modalBox = await modal.locator('> div').first().boundingBox()
    if (!listBox || !modalBox) throw new Error('missing layout boxes')
    expect(listBox.width).toBeGreaterThan(modalBox.width * 0.6)
  })
})
