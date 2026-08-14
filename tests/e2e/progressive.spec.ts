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
  /*
   * What this asserts, and what it deliberately does not.
   *
   * The contract is that a capable desktop is *offered* the reactor: the gate
   * says cinema and the canvas mounts. It used to assert that by sleeping three
   * seconds first, which quietly folded in a second, much stronger claim —
   * that the scene is still running three seconds later.
   *
   * These runs use SwiftShader, a software rasteriser standing in for a GPU the
   * headless browser does not have. It is slower than any real device the site
   * will meet, and `usePerformanceGovernor` is built to notice exactly that and
   * hand the visitor the document instead. So on a rich enough scene the old
   * assertion tested the governor's willingness to give up, not the gate's
   * decision — and it failed for precisely the reason the governor exists.
   *
   * Waiting on the canvas from the moment of navigation tests the mount itself.
   * The abandon path has its own coverage below: whatever the governor decides,
   * the page it leaves behind has to be complete.
   */
  test('mounts a canvas on a capable desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop project only')

    await page.goto('/es')
    await expect(page.locator('canvas')).toHaveCount(1, { timeout: 8000 })
    await expect(page.locator('.stage')).toBeAttached()
  })

  test('leaves a usable page if the governor abandons the scene', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'desktop project only')

    await page.goto('/es')
    await expect(page.locator('canvas')).toHaveCount(1, { timeout: 8000 })
    // Long enough for the governor to have measured and, on this rasteriser,
    // most likely to have given up.
    await page.waitForTimeout(6000)

    const abandoned = (await page.locator('canvas').count()) === 0
    // Either the scene survived, or it went away and the scroll narrative and
    // its chapter anchors are still there to carry the page.
    await expect(page.locator('main')).toBeAttached()
    for (const id of ['hero', 'work', 'contact']) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }
    if (abandoned) {
      await expect(page.locator('.stage')).toHaveCount(0)
    }
  })
})
