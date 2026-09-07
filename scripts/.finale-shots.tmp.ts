/**
 * Captures the swallow, one fresh page load per frame, on the real GPU.
 *
 * A single load that scrolls through every stop is wrong here: the ending is a
 * pure function of scroll, but Lenis eases toward its target and the composer's
 * `flow` accumulates, so a sequence captured in one pass shows each stop carrying
 * the previous one's momentum. One load per stop is the only way to see the frame
 * a visitor who scrolled to exactly that position would see.
 *
 * Run: DG_BASE_URL=http://localhost:4173 pnpm exec tsx <this file>
 */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const OUT = process.env.DG_OUT ?? '/tmp/dg-finale'
const BASE = process.env.DG_BASE_URL ?? 'http://localhost:4173'
const PATH = process.env.DG_PATH ?? '/es'

/** Fraction of the whole scrollable document, so the stops track the rail. */
const STOPS = [
  { name: '00-hero', at: 0 },
  { name: '01-hero-open', at: 0.03 },
  { name: '02-corridor', at: 0.35 },
  { name: '03-gate', at: 0.86 },
  { name: '04-swallow-15', at: 0.915 },
  { name: '05-swallow-40', at: 0.94 },
  { name: '06-swallow-65', at: 0.962 },
  { name: '07-swallow-85', at: 0.98 },
  { name: '08-swallow-end', at: 1 },
]

const main = async () => {
  await mkdir(OUT, { recursive: true })

  // Real GPU. SwiftShader renders the geodesic pass at a few frames a minute and
  // its tone mapping does not match the hardware path, so a software capture
  // cannot answer "does this look right".
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=metal',
      '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist',
    ],
  })

  for (const stop of STOPS) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    page.on('pageerror', (error) => console.error(`[${stop.name}]`, error.message))

    await page.goto(`${BASE}${PATH}`, { waitUntil: 'load' })
    // Boot hold lifts on ReadySignal (4 consecutive frames); the glyph atlas and
    // the shader compile land inside this.
    await page.waitForTimeout(4200)

    if (stop.at > 0) {
      await page.evaluate((at) => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        window.scrollTo(0, max * at)
      }, stop.at)
      // Lenis eases; 2.6s is past its settle for a jump of this size.
      await page.waitForTimeout(2600)
    }

    await page.screenshot({
      path: join(OUT, `${stop.name}.png`),
      type: 'png',
    })
    console.log(join(OUT, `${stop.name}.png`))
    await context.close()
  }

  await browser.close()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
