import { chromium, devices } from '@playwright/test'
const b = await chromium.launch({ args: ['--disable-webgl', '--disable-webgl2'] })
const p = await (await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' })).newPage()
await p.goto('http://localhost:5175/es', { waitUntil: 'networkidle', timeout: 60000 })
await p.waitForTimeout(2000)
await p.click('header button[aria-label]')
await p.waitForTimeout(400)
await p.screenshot({ path: 'work/mobile-audit/doc-menu.png' })
console.log('doc dialog open:', (await p.locator('dialog[open]').count()) > 0)
await p.click('dialog >> text=Contacto')
await p.waitForTimeout(1200)
console.log(
  'after contact click, hash:',
  await p.evaluate(() => location.hash),
  '| dialog closed:',
  (await p.locator('dialog[open]').count()) === 0,
)
await b.close()
