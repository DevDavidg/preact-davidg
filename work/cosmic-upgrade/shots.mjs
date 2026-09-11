import { chromium } from '@playwright/test'
const stops = JSON.parse(process.env.STOPS)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []
page.on('pageerror', e => errs.push(e.message.slice(0, 300)))
page.on('console', m => { if (/shader error|Shader Error|undeclared|no matching/i.test(m.text())) errs.push(m.text().slice(0, 600)) })
await page.goto('http://localhost:5173/es/', { waitUntil: 'load' })
await page.locator('canvas').waitFor({ timeout: 25000 })
await page.waitForTimeout(3000)
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
const finale = await page.evaluate(() => document.getElementById('finale').getBoundingClientRect().top + scrollY)
for (const [label, frac, base] of stops) {
  const y = base === 'f' ? finale * frac : finale + (max - finale) * frac
  await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y)
  await page.waitForTimeout(2200)
  const clip = process.env.CLIP ? JSON.parse(process.env.CLIP) : undefined
  await page.screenshot({ path: `work/cosmic-upgrade/shot-${label}.jpg`, quality: 92, clip })
  console.log(label, 'y=' + Math.round(y), 'scrollY=' + await page.evaluate(() => Math.round(scrollY)))
}
console.log('ERRS', errs.length, errs.slice(0, 3).join(' | '))
await browser.close()
