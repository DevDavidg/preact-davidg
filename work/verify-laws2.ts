import { chromium } from '@playwright/test'

const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
await p.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 90000 })
await p.waitForTimeout(6000)

const lawButton = p.locator('.operator-bar button').first()
await lawButton.click() // CHAOS
await p.waitForTimeout(8000) // let lawSwallow accumulate visibly

const frac = async (f: number) => {
  await p.evaluate((ff) => {
    const limit = document.documentElement.scrollHeight - innerHeight
    window.scrollTo({ top: limit * ff, behavior: 'instant' })
  }, f)
  await p.waitForTimeout(2200)
}

await frac(0.71) // corridor end: galaxy + well dominate the frame
await p.screenshot({ path: 'work/desktop-audit/chaos-well.png' })

await lawButton.click() // VACUUM
await p.waitForTimeout(3500)
await frac(0.71)
await p.screenshot({ path: 'work/desktop-audit/vacuum-well.png' })
await frac(0.2)
await p.screenshot({ path: 'work/desktop-audit/vacuum-early.png' })
await b.close()
