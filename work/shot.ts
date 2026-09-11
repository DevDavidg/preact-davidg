import { chromium, devices } from '@playwright/test'
const [url, dir, stops] = process.argv.slice(2)
const b = await chromium.launch()
const p = await (await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage()
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await p.waitForTimeout(2500)
for (const [i, y] of stops.split(',').entries()) {
  await p.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Number(y))
  await p.waitForTimeout(600)
  await p.screenshot({ path: `${dir}/${i}-${y}.png` })
}
await b.close()
