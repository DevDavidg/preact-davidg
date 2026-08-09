import { expect, test } from '@playwright/test'

/**
 * Full-3D portfolio contract.
 *
 * Capable visitors get the reactor canvas. Chapter rail ids stay in the DOM for
 * hash navigation / Lenis. There is no visible UI chrome and no sr-only mirror.
 */

const CHAPTERS = [
  'hero',
  'work',
  'lab',
  'archive',
  'experience',
  'services',
  'process',
  'about',
  'contact',
]

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('still mounts a demand-driven scene', async ({ page }) => {
    await page.goto('/es')

    expect(
      await page.evaluate(
        `window.matchMedia('(prefers-reduced-motion: reduce)').matches`,
      ),
    ).toBe(true)

    await page.waitForTimeout(2500)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('main')).toBeAttached()
  })

  test('still scrolls to a chapter from a hash', async ({ page }) => {
    await page.goto('/es#work')
    await expect(page).toHaveURL(/#work$/)
    await expect(page.locator('#work')).toBeAttached()
  })
})

test.describe('without WebGL', () => {
  test('never mounts a canvas and keeps the scroll rail', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function patched(
        this: HTMLCanvasElement,
        kind: string,
        ...rest: unknown[]
      ) {
        if (kind === 'webgl' || kind === 'webgl2') return null
        return (original as never as (...args: unknown[]) => unknown).call(
          this,
          kind,
          ...rest,
        )
      } as never
    })

    await page.goto('/es')
    await page.waitForTimeout(2500)

    await expect(page.locator('canvas')).toHaveCount(0)
    for (const id of CHAPTERS) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }
  })
})

test.describe('when the scene chunk fails', () => {
  test('keeps the scroll rail instead of a blank region', async ({ page }) => {
    await page.route('**/assets/ReactorScene-*.js', (route) => route.abort())

    await page.goto('/es')
    await page.waitForTimeout(2500)

    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator('#hero')).toBeAttached()
  })
})

test.describe('data saver', () => {
  test('is treated as a request not to download the scene', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', {
        value: { saveData: true, effectiveType: '3g' },
        configurable: true,
      })
    })

    await page.goto('/es')
    await page.waitForTimeout(2000)
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator('main')).toBeAttached()
  })
})

test.describe('mobile', () => {
  test('exposes every chapter id for hash navigation', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'mobile project only')

    await page.goto('/es')
    for (const id of CHAPTERS) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }

    await page.goto('/es#experience')
    await expect(page.locator('#experience')).toBeAttached()
  })

  test('never scrolls horizontally', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only')

    await page.goto('/es')
    await page.waitForTimeout(1200)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe('cinema path', () => {
  test('mounts a canvas on a capable desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop project only')

    await page.goto('/es')
    await page.waitForTimeout(3000)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('.stage')).toBeAttached()
  })
})
