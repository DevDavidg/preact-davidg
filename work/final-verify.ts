import { chromium, devices } from '@playwright/test'

const b = await chromium.launch()

// 1. Desktop VISCOUS (default): must look exactly as before the law work.
const d = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
const errors: string[] = []
d.on('pageerror', (e) => errors.push(String(e)))
await d.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 90000 })
await d.waitForTimeout(6000)
const frac = async (f: number) => {
  await d.evaluate((ff) => {
    const limit = document.documentElement.scrollHeight - innerHeight
    window.scrollTo({ top: limit * ff, behavior: 'instant' })
  }, f)
  await d.waitForTimeout(2200)
}
await frac(0.71)
await d.screenshot({ path: 'work/desktop-audit/final-viscous-well.png' })
await frac(0.9)
await d.screenshot({ path: 'work/desktop-audit/final-viscous-swallow.png' })
console.log('desktop VISCOUS ok, js errors:', errors.length ? errors : 'none')
await d.close()

// 2. Mobile lite: nav toggle still works after all scene edits.
const m = await (await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage()
m.on('pageerror', (e) => errors.push(String(e)))
await m.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 90000 })
await m.waitForTimeout(3000)
await m.click('.world-nav-toggle')
await m.waitForTimeout(400)
const open = await m.locator('.world-nav[data-open="true"]').count()
await m.click('.world-nav-panel >> text=CV')
await m.waitForTimeout(2500)
console.log('mobile nav works:', open > 0, '| landed:', m.url())
await b.close()
