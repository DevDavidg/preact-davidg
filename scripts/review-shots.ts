/**
 * Captures a set of views into a temporary directory for visual review.
 *
 * Output goes to the system temp directory on purpose: these are throwaway review
 * artefacts, not assets, and they must never land in the repo.
 *
 * Run with: pnpm exec tsx scripts/review-shots.ts
 */
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, devices } from '@playwright/test'

const OUT = join(tmpdir(), 'dg-review')
const BASE = process.env.DG_BASE_URL ?? 'http://localhost:4173'

interface View {
  name: string
  path: string
  width: number
  height: number
  /** Scroll down by this many viewport heights before capturing. */
  scroll?: number
  mobile?: boolean
}

const VIEWS: View[] = [
  { name: '01-hero', path: '/es', width: 1440, height: 900 },
  { name: '02-work', path: '/es', width: 1440, height: 900, scroll: 1.4 },
  { name: '03-experience', path: '/es', width: 1440, height: 900, scroll: 4.4 },
  { name: '04-services', path: '/es', width: 1440, height: 900, scroll: 5.6 },
  { name: '05-process', path: '/es', width: 1440, height: 900, scroll: 6.8 },
  { name: '06-about', path: '/es', width: 1440, height: 900, scroll: 8.0 },
  { name: '07-contact', path: '/es', width: 1440, height: 900, scroll: 9.4 },
  { name: '08-case', path: '/es/proyectos/chroma-dev', width: 1440, height: 900 },
  { name: '09-cv', path: '/es/cv', width: 1440, height: 900 },
  { name: '10-mobile-hero', path: '/es', width: 390, height: 844, mobile: true },
  { name: '11-mobile-work', path: '/es', width: 390, height: 844, scroll: 1.6, mobile: true },
  { name: '12-en-hero', path: '/en', width: 1440, height: 900 },
]

const main = async () => {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })

  for (const view of VIEWS) {
    const context = await browser.newContext(
      view.mobile
        ? { ...devices['iPhone 13'], defaultBrowserType: 'chromium' }
        : { viewport: { width: view.width, height: view.height } },
    )
    const page = await context.newPage()

    await page.goto(`${BASE}${view.path}`, { waitUntil: 'load' })
    await page.waitForTimeout(3000)

    if (view.scroll) {
      await page.evaluate(
        `window.scrollTo(0, window.innerHeight * ${view.scroll})`,
      )
      await page.waitForTimeout(1600)
    }

    await page.screenshot({
      path: join(OUT, `${view.name}.jpg`),
      type: 'jpeg',
      quality: 84,
    })
    console.log(join(OUT, `${view.name}.jpg`))
    await context.close()
  }

  await browser.close()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
