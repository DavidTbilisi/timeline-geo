import { test, expect } from '@playwright/test'

test.describe('Navigation & Routing', () => {
  test('root path redirects to or renders the landing page', async ({ page }) => {
    await page.goto('/')
    // Use role heading to avoid matching logo button
    await expect(page.getByRole('heading', { name: 'ბიბლიური ქრონოლოგია' })).toBeVisible({ timeout: 5000 })
  })

  test('unknown route redirects to landing page', async ({ page }) => {
    await page.goto('/this-does-not-exist')
    await expect(page).toHaveURL('/')
  })

  test('/period/:slug routes load the correct period', async ({ page }) => {
    const slugs: [string, string][] = [
      ['first-generation',       'პირველი თაობა'],
      ['noah-and-the-flood',     'ნოე და წარღვნა'],
      ['the-patriarchs',         'პატრიარქები'],
      ['egypt-to-canaan',        'ეგვიპტედან კანაანამდე'],
      ['life-of-christ',         'ქრისტეს ცხოვრება'],
      ['revelation-prophecies',  'გამოცხადების წინასწარმეტყველებები'],
    ]

    for (const [slug, georgianName] of slugs) {
      await page.goto(`/period/${slug}`)
      // Wait for the timeline and sidebar to fully load and settle
      await page.waitForSelector('.tl-sidebar', { timeout: 8000 })
      await expect(page.locator('.tl-sidebar')).toContainText(georgianName, { timeout: 8000 })
    }
  })

  test('app menu logo click navigates to landing', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator('button:has-text("ბიბლიური ქრონოლოგია")').click()
    await expect(page).toHaveURL('/')
  })

  test('browser back button works from detail to timeline', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })

    // Click event — now uses router.push so a new history entry is created
    await page.locator('.tl-event').first().click()
    await expect(page).toHaveURL(/\/event\//, { timeout: 3000 })

    await page.goBack()
    await expect(page).toHaveURL(/\/period\//, { timeout: 3000 })
  })

  test('FAQ panel opens and closes', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator('button:has-text("კითხვა-პასუხი")').click()

    // FAQ content should now render (fixed: using tm() not t() for array)
    await expect(page.locator('text=რა არის ეს ვადათა ღვედი')).toBeVisible({ timeout: 3000 })

    // Click the backdrop (fixed inset-0 z-40) to close — FAQ dropdown is in top-right
    // so clicking the full-screen backdrop at center-left is safe
    await page.locator('.fixed.inset-0.z-40').click({ position: { x: 100, y: 400 } })
    await expect(page.locator('text=რა არის ეს ვადათა ღვედი')).not.toBeVisible({ timeout: 3000 })
  })

  test('favorites panel opens and shows empty state', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator('button:has-text("რჩეულები")').click()

    // No favorites yet — should show empty state message
    await expect(page.locator('text=რჩეულები ცარიელია')).toBeVisible()
  })
})

test.describe('i18n – Language Switch', () => {
  test('switches UI to English and back', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-sidebar', { timeout: 5000 })

    // Switch to English
    await page.locator('button:has-text("EN")').click()
    await expect(page.locator('.tl-sidebar')).toContainText('First Generation')

    // Switch back to Georgian
    await page.locator('button:has-text("ქა")').click()
    await expect(page.locator('.tl-sidebar')).toContainText('პირველი თაობა')
  })

  test('year bubble uses Georgian BC suffix', async ({ page }) => {
    await page.goto('/period/first-generation')
    await expect(page.locator('.year-bubble')).toContainText('ძვ.წ.')
  })

  test('year bubble switches to English BC on locale change', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator('button:has-text("EN")').click()
    await expect(page.locator('.year-bubble')).toContainText('BC')
  })
})
