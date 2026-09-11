import { chromium } from '@playwright/test'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173/es/', { waitUntil: 'load' })
await page.locator('canvas').waitFor({ timeout: 25000 })
await page.waitForTimeout(3000)
const finale = await page.evaluate(() => document.getElementById('finale').getBoundingClientRect().top + scrollY)
await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), finale * 0.9)
await page.waitForTimeout(2500)
console.log(JSON.stringify(await page.evaluate(() => {
  const scene = window.__scene
  const rows = []
  scene.traverse(o => {
    const m = o.material
    if (!m || !o.visible) return
    const z = o.matrixWorld.elements[14]
    if (z > -8.0 || z < -14) return
    rows.push(`z=${z.toFixed(2)} ${o.type}/${o.name || '-'} ${m.type}${m.uniforms ? (m.uniforms.uAssembleAt ? ' [reconstruct]' : ' [shader]') : ''} dw=${m.depthWrite} dt=${m.depthTest} tr=${m.transparent} ro=${o.renderOrder}`)
  })
  rows.sort()
  return rows
}), null, 1).slice(0, 5000))
await browser.close()
