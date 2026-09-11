import { chromium, devices } from '@playwright/test'

const url = process.argv[2] ?? 'http://localhost:5175/'
const outDir = 'work/mobile-audit'

const browser = await chromium.launch()
const context = await browser.newContext({
  ...devices['iPhone 13'],
  reducedMotion: 'reduce', // faster settle; we audit layout, not animation
})
const page = await context.newPage()
const errors: string[] = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
await page.waitForTimeout(3000)

const report = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth
  const overflowX = document.documentElement.scrollWidth - vw
  const wide: string[] = []
  if (overflowX > 0) {
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width > vw + 1 || r.right > vw + 1 || r.left < -1) {
        wide.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} left=${Math.round(r.left)} right=${Math.round(r.right)} w=${Math.round(r.width)}`,
        )
        if (wide.length > 15) break
      }
    }
  }
  const smallTargets: string[] = []
  for (const el of document.querySelectorAll('a, button')) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    if (r.width < 44 || r.height < 44) {
      smallTargets.push(
        `${el.tagName} "${(el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`,
      )
    }
  }
  return { vw, overflowX, wide, smallTargets, scrollHeight: document.documentElement.scrollHeight }
})
console.log(JSON.stringify(report, null, 2))
console.log('JS errors:', errors.length ? errors : 'none')

// Screenshots down the page
const shots = Math.min(6, Math.ceil(report.scrollHeight / 812))
for (let i = 0; i < shots; i++) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * 812)
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${outDir}/home-${i}.png` })
}
await browser.close()
