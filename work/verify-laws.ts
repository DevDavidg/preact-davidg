import { chromium } from '@playwright/test'

const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
await p.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 90000 })
await p.waitForTimeout(6000)

const lawButton = p.locator('.operator-bar button').first()
const law = () => lawButton.textContent()

const frac = async (f: number) => {
  await p.evaluate((ff) => {
    const limit = document.documentElement.scrollHeight - innerHeight
    window.scrollTo({ top: limit * ff, behavior: 'instant' })
  }, f)
  await p.waitForTimeout(2000)
}

// CHAOS (one click from VISCOUS), let the infall accumulate
await lawButton.click()
console.log('law:', await law())
await p.waitForTimeout(6000)
await frac(0)
await p.screenshot({ path: 'work/desktop-audit/chaos-start.png' })
await frac(0.45)
await p.screenshot({ path: 'work/desktop-audit/chaos-mid.png' })

// VACUUM
await lawButton.click()
console.log('law:', await law())
await p.waitForTimeout(3000)
await frac(0)
await p.screenshot({ path: 'work/desktop-audit/vacuum-start.png' })
await frac(0.45)
await p.screenshot({ path: 'work/desktop-audit/vacuum-mid.png' })

// Back to VISCOUS: sky restored
await lawButton.click()
console.log('law:', await law())
await p.waitForTimeout(3000)
await p.screenshot({ path: 'work/desktop-audit/viscous-back.png' })
await b.close()
