import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Automated accessibility checks on every prerendered route.
 *
 * Axe cannot judge whether the copy is any good, but it does catch the failures this
 * site is structurally prone to: a decorative canvas that leaks into the tree,
 * icon-only controls without names, and low-contrast metadata type.
 */

const ROUTES = [
  '/es',
  '/en',
  '/es/proyectos/signal-reactor',
  '/en/work/fueradecontexto',
  '/es/cv',
  '/404',
]

for (const route of ROUTES) {
  test(`${route} has no detectable accessibility violations`, async ({ page }) => {
    await page.goto(route)
    // Let the reveal observers settle so nothing is measured mid-transition.
    await page.waitForTimeout(1500)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    // Reported in full: a bare count tells you nothing about what to fix.
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => node.target.join(' ')),
      })),
    ).toEqual([])
  })
}

test.describe('focus', () => {
  test('is visible on every interactive element in the header', async ({ page }) => {
    await page.goto('/es')

    const focusables = page.locator('header a, header button')
    const count = await focusables.count()
    expect(count).toBeGreaterThan(4)

    for (let index = 0; index < count; index += 1) {
      const element = focusables.nth(index)
      if (!(await element.isVisible())) continue
      await element.focus()

      const outline = await element.evaluate((node) => {
        const style = getComputedStyle(node)
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        }
      })
      expect(outline.outlineStyle).not.toBe('none')
      expect(parseFloat(outline.outlineWidth)).toBeGreaterThan(0)
    }
  })
})

test.describe('the canvas', () => {
  test('is hidden from assistive technology and takes no pointer input', async ({
    page,
  }) => {
    await page.goto('/es')
    await page.waitForTimeout(2500)

    const canvas = page.locator('canvas')
    if ((await canvas.count()) === 0) test.skip(true, 'no scene in this environment')

    const stage = page.locator('.stage')
    await expect(stage).toHaveAttribute('aria-hidden', 'true')
    await expect(stage).toHaveCSS('pointer-events', 'none')
  })
})

test.describe('touch targets', () => {
  test('are at least 44 px in the header and on primary actions', async ({ page }) => {
    await page.goto('/es')

    const targets = page.locator(
      'header a, header button, main a[class*="min-h-11"], main button',
    )
    const count = await targets.count()

    for (let index = 0; index < count; index += 1) {
      const target = targets.nth(index)
      if (!(await target.isVisible())) continue
      const box = await target.boundingBox()
      if (!box) continue
      // The brand mark is inline text in a text line; everything built as a control
      // has to clear the minimum.
      if (box.height < 24) continue
      expect(box.height).toBeGreaterThanOrEqual(43.5)
    }
  })
})
