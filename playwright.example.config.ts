import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke test of the example consumer running against the BUILT package
 * (dist/). Run `npm run build:lib` first; CI does this in the package-smoke job.
 */
export default defineConfig({
  testDir: './tests/example',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'EXAMPLE_USE_DIST=1 npx vite -c examples/minimal/vite.config.ts --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
