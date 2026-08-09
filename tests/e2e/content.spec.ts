import { expect, test } from '@playwright/test'

/**
 * The promise this site makes is that the document is complete on its own, and that
 * every project can be opened. These tests hold it to that.
 */

const LOCALES = [
  { code: 'es', home: '/es', caseSegment: 'proyectos', work: 'PROYECTOS' },
  { code: 'en', home: '/en', caseSegment: 'work', work: 'WORK' },
] as const

for (const locale of LOCALES) {
  test.describe(`${locale.code} home`, () => {
    test('serves the whole page as static HTML, without running JavaScript', async ({
      request,
    }) => {
      // Fetched, not rendered: this is exactly what a crawler or a scraper receives.
      const html = await (await request.get(locale.home)).text()

      expect(html).toContain('<h1')
      expect(html).toContain(`lang="${locale.code}"`)
      expect(html).toContain('rel="canonical"')
      expect(html).toContain('og:image')
      expect(html).toContain('application/ld+json')

      // Every project, its dossier and its destination.
      for (const slug of [
        'chroma-dev',
        'landing-davinci',
        'signal-reactor',
        'fueradecontexto',
        'sphere-app',
        'launch-flow',
        'david-g-dev',
      ]) {
        expect(html).toContain(`/${locale.code}/${locale.caseSegment}/${slug}`)
      }

      // The two audience paths and the contact channel.
      expect(html).toContain('#contact')
      expect(html).toContain('#experience')
      expect(html).toContain('mailto:dev.davidg@gmail.com')
    })

    test('exposes exactly one h1 and an ordered heading outline', async ({ page }) => {
      await page.goto(locale.home)
      await expect(page.locator('main h1')).toHaveCount(1)

      const levels = await page
        .locator('main h1, main h2, main h3')
        .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName[1])))

      // No level may be skipped on the way down.
      let previous = levels[0]
      for (const level of levels) {
        expect(level - previous).toBeLessThanOrEqual(1)
        previous = level
      }
    })

    test('opens a project with the keyboard alone', async ({ page }) => {
      await page.goto(locale.home)

      const firstCase = page
        .locator(`a[href="/${locale.code}/${locale.caseSegment}/chroma-dev"]`)
        .first()
      await firstCase.focus()
      await expect(firstCase).toBeFocused()
      await page.keyboard.press('Enter')

      await expect(page).toHaveURL(
        new RegExp(`/${locale.code}/${locale.caseSegment}/chroma-dev$`),
      )
      await expect(page.locator('h1')).toHaveText('Chroma Dev')
    })

    /*
     * Asserted structurally rather than by pressing Tab: Safari does not move focus
     * to links on Tab unless the user has enabled it, so a keystroke-based check
     * would fail on WebKit for a reason that has nothing to do with the markup.
     */
    test('puts the skip link first in the focus order and reveals it', async ({
      page,
    }) => {
      await page.goto(locale.home)

      const firstFocusableHref = await page.evaluate(
        `(() => {
          const focusable = document.querySelectorAll(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          for (const node of focusable) {
            if (node.closest('[hidden]')) continue;
            return node.getAttribute('href') || '';
          }
          return '';
        })()`,
      )
      expect(firstFocusableHref).toBe('#main')

      const skip = page.locator('a[href="#main"]')
      await skip.focus()
      // Visually hidden until focused, then a real, readable control.
      const box = await skip.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(40)

      await skip.press('Enter')
      await expect(page).toHaveURL(/#main$/)
    })

    test('has no external link without noopener', async ({ page }) => {
      await page.goto(locale.home)
      const unsafe = await page.locator('a[target="_blank"]').evaluateAll((nodes) =>
        nodes
          .filter((node) => !(node as HTMLAnchorElement).rel.includes('noopener'))
          .map((node) => (node as HTMLAnchorElement).href),
      )
      expect(unsafe).toEqual([])
    })

    test('never opens a mail or phone link in a blank tab', async ({ page }) => {
      await page.goto(locale.home)
      const blankProtocols = await page
        .locator('a[target="_blank"]')
        .evaluateAll((nodes) =>
          nodes
            .map((node) => (node as HTMLAnchorElement).protocol)
            .filter((protocol) => protocol === 'mailto:' || protocol === 'tel:'),
        )
      expect(blankProtocols).toEqual([])
    })
  })
}

test.describe('case studies', () => {
  test('answer the questions a reader actually has', async ({ page }) => {
    await page.goto('/es/proyectos/chroma-dev')

    for (const heading of [
      'Resultado',
      'Problema',
      'Decisiones clave',
      'Qué construí',
      'Qué podés verificar',
    ]) {
      await expect(
        page.getByRole('heading', { name: heading, exact: false }),
      ).toBeVisible()
    }

    // Role, scope and stack are a definition list beside the narrative, not headings.
    for (const term of ['Mi rol', 'Equipo y alcance', 'Stack']) {
      await expect(page.getByRole('term').filter({ hasText: term })).toBeVisible()
    }
  })

  test('are reachable in both locales at their own URL', async ({ request }) => {
    for (const path of [
      '/es/proyectos/signal-reactor',
      '/en/work/signal-reactor',
    ]) {
      const response = await request.get(path)
      expect(response.status()).toBe(200)
    }
  })

  test('refuse a mismatched locale segment rather than duplicating content', async ({
    page,
  }) => {
    // `/en/proyectos/...` must not be a second URL for the Spanish segment's page.
    await page.goto('/en/proyectos/chroma-dev')
    await expect(page.locator('h1')).not.toHaveText('Chroma Dev')
  })
})

test.describe('language', () => {
  test('is switchable, shareable and reciprocal', async ({ page }) => {
    await page.goto('/es/proyectos/sphere-app')
    await page.getByRole('link', { name: 'English' }).first().click()
    await expect(page).toHaveURL(/\/en\/work\/sphere-app$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('declares reciprocal alternates on every page', async ({ request }) => {
    const html = await (await request.get('/es')).text()
    expect(html).toContain('hrefLang="es"')
    expect(html).toContain('hrefLang="en"')
    expect(html).toContain('hrefLang="x-default"')
  })
})

test.describe('not found', () => {
  test('answers with a real 404 status and a way out', async ({ page }) => {
    const response = await page.goto('/es/this-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('link', { name: /inicio|home/i }).first()).toBeVisible()
  })
})

test.describe('discovery', () => {
  test('publishes a sitemap of canonical URLs only', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('<loc>')
    expect(sitemap).toContain('/es/proyectos/chroma-dev')
    expect(sitemap).toContain('/en/work/chroma-dev')
    // The 404 page is prerendered but must never be advertised.
    expect(sitemap).not.toContain('/404')
  })

  test('publishes robots.txt pointing at the sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Sitemap:')
    expect(robots).toContain('Allow: /')
  })

  test('ships the social cards its metadata references', async ({ request }) => {
    for (const path of ['/social/og-es.png', '/social/og-en.png']) {
      expect((await request.get(path)).status()).toBe(200)
    }
  })
})
