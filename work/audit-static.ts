import { chromium, devices } from '@playwright/test'
const b = await chromium.launch({ args: ['--disable-webgl', '--disable-webgl2'] })
const p = await (await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage()
const errors: string[] = []
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto('http://localhost:5175/es', { waitUntil: 'networkidle', timeout: 60000 })
await p.waitForTimeout(2500)
const report = await p.evaluate(() => {
  const vw = document.documentElement.clientWidth
  const wide: string[] = []
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && (r.right > vw + 1 || r.left < -1))
      wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} right=${Math.round(r.right)}`)
    if (wide.length > 10) break
  }
  return { vw, overflowX: document.documentElement.scrollWidth - vw, wide, h: document.documentElement.scrollHeight }
})
console.log(JSON.stringify(report), 'errors:', errors.length ? errors : 'none')
const n = Math.min(8, Math.ceil(report.h / 700))
for (let i = 0; i < n; i++) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * 700)
  await p.waitForTimeout(400)
  await p.screenshot({ path: `work/mobile-audit/static-${i}.png` })
}
await b.close()
