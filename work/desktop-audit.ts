import { chromium } from '@playwright/test'

// Desktop cinema: 1920x1080, fine pointer, motion allowed → experience = cinema.
// Scrolls to fractions of the rail and screenshots, then cycles the law button.
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
await p.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 90000 })
await p.waitForTimeout(6000)

const frac = async (f: number) => {
  await p.evaluate((ff) => {
    const limit = document.documentElement.scrollHeight - innerHeight
    window.scrollTo({ top: limit * ff, behavior: 'instant' })
  }, f)
  await p.waitForTimeout(2500)
}

for (const [name, f] of [['start', 0], ['mid', 0.45], ['corridor-end', 0.71], ['swallow-mid', 0.85], ['end', 0.99]] as const) {
  await frac(f)
  await p.screenshot({ path: `work/desktop-audit/${name}.png` })
}

// Cycle law: VACUUM (1 click), back to corridor mid for a readable frame
await frac(0.45)
await p.click('.operator-bar button[aria-label^="BUILD"], .operator-bar button.text-meta')
await p.waitForTimeout(2500)
await p.screenshot({ path: 'work/desktop-audit/law-1.png' })
await p.click('.operator-bar button.text-meta')
await p.waitForTimeout(2500)
await p.screenshot({ path: 'work/desktop-audit/law-2.png' })
console.log('law now:', await p.locator('.operator-bar button.text-meta').textContent())
await b.close()
