import { defineConfig, devices } from '@playwright/test'

/**
 * The end-to-end suite runs against the real prerendered output, not the dev
 * server: the things worth asserting — static HTML content, hydration, the
 * capability gate, bundle behaviour — only exist in a production build.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list']],

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },

  webServer: {
    // `serve-build` is a plain static file server, which is what production is.
    command: 'pnpm exec tsx tests/e2e/serve-build.ts',
    url: 'http://localhost:4173/es',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        // Headless Chromium has no GPU; SwiftShader lets the capability gate say yes
        // so the 3D path is actually exercised rather than skipped.
        launchOptions: {
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
          ],
        },
      },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
