/**
 * Lists the elements that stick out past the viewport, at a given width.
 *
 * `overflow-x: hidden` would hide the symptom and clip focus rings with it, so the
 * offending element has to be found and fixed instead.
 *
 * Run with: pnpm exec tsx scripts/find-overflow.ts [width] [path]
 */
import { chromium } from '@playwright/test'

const WIDTH = Number(process.argv[2] ?? 320)
const TARGET = process.argv[3] ?? '/es'
const BASE = process.env.DG_BASE_URL ?? 'http://localhost:4173'

const main = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 720 } })
  await page.goto(`${BASE}${TARGET}`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)

  /*
   * Written as a source string rather than a function: `tsx` compiles named inner
   * functions with an esbuild `__name` helper that does not exist in the page, so a
   * normal callback throws `__name is not defined` once it is serialised across.
   */
  const offenders = (await page.evaluate(`(() => {
    const viewportWidth = ${WIDTH};
    const results = [];
    for (const node of document.querySelectorAll('*')) {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right <= viewportWidth + 0.5 && rect.left >= -0.5) continue;
      const parts = [node.tagName.toLowerCase()];
      if (node.id) parts.push('#' + node.id);
      const className = node.getAttribute('class');
      if (className) parts.push('.' + className.split(/\\s+/).slice(0, 4).join('.'));
      results.push({
        selector: parts.join(''),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      });
    }
    return results;
  })()`)) as { selector: string; right: number; width: number }[]

  const scroll = (await page.evaluate(
    `({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth })`,
  )) as { scrollWidth: number; innerWidth: number }

  console.log(`\n${TARGET} at ${WIDTH}px — scrollWidth ${scroll.scrollWidth}, viewport ${scroll.innerWidth}`)
  console.log(`offenders: ${offenders.length}`)
  offenders.slice(0, 25).forEach((entry) => {
    console.log(`  right=${entry.right} w=${entry.width}  ${entry.selector.slice(0, 140)}`)
  })

  await browser.close()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
