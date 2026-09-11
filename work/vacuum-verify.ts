import { chromium } from '@playwright/test'

const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
const errors: string[] = []
p.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 400))
})
p.on('pageerror', (e) => errors.push(String(e).slice(0, 400)))
await p.goto('http://localhost:5199/', { waitUntil: 'networkidle', timeout: 90000 })
await p.waitForTimeout(6000)

const lawButton = p.locator('.operator-bar button').first()
await lawButton.click() // CHAOS → ... cycle order VACUUM,VISCOUS,CHAOS: from VISCOUS one click = CHAOS
await p.waitForTimeout(500)
await lawButton.click() // VACUUM
await p.waitForTimeout(3500)

const frac = async (f: number) => {
  await p.evaluate((ff) => {
    const limit = document.documentElement.scrollHeight - innerHeight
    window.scrollTo({ top: limit * ff, behavior: 'instant' })
  }, f)
  await p.waitForTimeout(2200)
}

await frac(0.2)
await p.screenshot({ path: 'work/cosmic-upgrade/vacuum-early.png' })
await frac(0.71)
await p.screenshot({ path: 'work/cosmic-upgrade/vacuum-well.png' })
await frac(0.97)
await p.waitForTimeout(1500)
await p.screenshot({ path: 'work/cosmic-upgrade/vacuum-end.png' })

console.log('CONSOLE ERRORS:', errors.length ? errors.join('\n---\n') : 'none')
await b.close()
