import { expect, test } from '@playwright/test'

/**
 * The degradation contract.
 *
 * The 3D experience is an upgrade, never a requirement. These tests take the scene
 * away in each of the ways reality does — a preference, a blocked API, a failed
 * chunk, a lost context — and assert the site is still whole.
 */

/** Every project title that has to be reachable no matter what. */
const PROJECTS = [
  'Chroma Dev',
  'Landing Da Vinci',
  'Signal Reactor',
  'Fueradecontexto',
  'Sphere App',
  'Launch Flow',
]

/**
 * Navigates to a section through whichever affordance the current width offers: the
 * desktop bar above `lg`, the menu sheet below it. A test that only knew about one of
 * them would be asserting the layout rather than the capability.
 */
const gotoSection = async (page: import('@playwright/test').Page, id: string) => {
  const direct = page.locator(`header nav a[href="#${id}"]`).first()
  if (await direct.isVisible()) {
    await direct.click()
    return
  }

  await page.getByRole('button', { name: /abrir menú|open menu/i }).click()
  await page.locator(`dialog[open] a[href="#${id}"]`).click()
}

const expectDocumentIntact = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('h1')).toBeVisible()
  for (const title of PROJECTS) {
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible()
  }
  await expect(
    page.locator('a[href^="mailto:dev.davidg"]').first(),
  ).toBeVisible()
}

test.describe('reduced motion', () => {
  /*
   * Emulated per test rather than declared with `test.use({ reducedMotion })`: the
   * fixture did not survive being merged with the project-level device descriptor,
   * and the tests silently ran against the full experience instead. The precondition
   * is asserted below so a regression in the harness cannot masquerade as a pass.
   */
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('downloads no 3D code at all and keeps the page whole', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (request) => requested.push(request.url()))

    await page.goto('/es')

    expect(
      await page.evaluate(
        `window.matchMedia('(prefers-reduced-motion: reduce)').matches`,
      ),
    ).toBe(true)

    await page.waitForTimeout(2500)

    /*
     * The whole point of gating before the import: not one byte of the engine.
     * Matched on the chunk file name, anchored so the always-loaded React vendor
     * chunk (`jsx-runtime-*.js`) is not mistaken for the motion runtime.
     */
    const engine = requested.filter((url) => {
      const file = url.split('/').pop() ?? ''
      return /^(three|ReactorScene|runtime|gsap|lenis)[-.]/i.test(file)
    })
    expect(engine).toEqual([])

    await expect(page.locator('canvas')).toHaveCount(0)
    await expectDocumentIntact(page)
  })

  test('still scrolls to a section from the navigation', async ({ page }) => {
    await page.goto('/es')
    await gotoSection(page, 'work')
    await expect(page).toHaveURL(/#work$/)
    await expect(page.locator('#work')).toBeInViewport()
  })
})

test.describe('without WebGL', () => {
  test('never mounts a canvas and keeps the page whole', async ({ page }) => {
    // Deny the context before any application code runs.
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
    await expectDocumentIntact(page)
  })
})

test.describe('when the scene chunk fails', () => {
  test('falls back to the document instead of a blank region', async ({ page }) => {
    // A flaky connection, a stale deploy, an over-eager blocker: all look like this.
    await page.route('**/assets/ReactorScene-*.js', (route) => route.abort())

    await page.goto('/es')
    await page.waitForTimeout(2500)

    await expect(page.locator('canvas')).toHaveCount(0)
    await expectDocumentIntact(page)
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
    await expectDocumentIntact(page)
  })
})

test.describe('mobile', () => {
  test('reaches every section through the menu', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only')

    await page.goto('/es')
    await page.getByRole('button', { name: /abrir menú/i }).click()

    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    for (const label of ['PROYECTOS', 'EXPERIENCIA', 'SERVICIOS', 'PROCESO', 'SOBRE MÍ']) {
      await expect(dialog.getByRole('link', { name: label })).toBeVisible()
    }

    await dialog.getByRole('link', { name: 'EXPERIENCIA' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('#experience')).toBeInViewport()
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

test.describe('narrow viewport', () => {
  test('fits 320 px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/es')
    await page.waitForTimeout(1200)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('fits at 400% zoom, which is 320 CSS px of a desktop layout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 500 })
    await page.goto('/es')
    await page.waitForTimeout(1200)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.locator('h1')).toBeVisible()
  })
})
