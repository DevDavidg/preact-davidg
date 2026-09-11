import { chromium } from '@playwright/test'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 900)))
page.on('console', m => {
  const t = m.text()
  if (m.type() === 'error' || /shader error|WebGL|GL_INVALID|context lost|THREE\./i.test(t)) errors.push(m.type().toUpperCase() + ': ' + t.slice(0, 2500))
})
await page.goto('http://localhost:5173/es/', { waitUntil: 'load' })
await page.locator('canvas').waitFor({ timeout: 25000 })
await page.waitForTimeout(3500)

// find the R3F scene however this version exposes it
const probe = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  const holders = [canvas, canvas?.parentElement, canvas?.parentElement?.parentElement]
  let scene = null, how = 'none'
  for (const h of holders) {
    const r = h && h.__r3f
    if (!r) continue
    const store = r.root ?? r.store ?? r.container?.root
    const state = typeof store?.getState === 'function' ? store.getState() : null
    if (state?.scene) { scene = state.scene; how = 'element.__r3f'; break }
    if (r.scene) { scene = r.scene; how = '__r3f.scene'; break }
  }
  if (!scene) return { how, keys: holders.map(h => h && Object.keys(h.__r3f ?? {})) }
  const out = []
  scene.traverse(o => {
    const m = o.material
    const kind = m?.fragmentShader ? 'shader' : m?.type
    out.push({
      type: o.type, name: o.name || '', visible: o.visible,
      inTree: o.parent ? o.parent.type : null,
      pos: o.position.toArray().map(n => +n.toFixed(2)),
      scale: +o.scale.x.toFixed(3),
      material: kind ?? null,
      progOk: m && m.program ? !!m.program.diagnostics === false : null,
      renderOrder: o.renderOrder,
      depthTest: m?.depthTest ?? null,
      depthWrite: m?.depthWrite ?? null,
      transparent: m?.transparent ?? null,
    })
  })
  return { how, count: out.length, objects: out }
})
console.log('SCROLL', JSON.stringify(await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight, innerHeight, max: document.documentElement.scrollHeight - innerHeight,
  finale: document.getElementById('finale') ? document.getElementById('finale').getBoundingClientRect().top + scrollY : null,
  chapters: [...document.querySelectorAll('.scroll-rail-chapter')].map(e => e.id),
  bodyOverflow: getComputedStyle(document.body).overflow,
}))))
console.log('PROBE', JSON.stringify(probe).slice(0, 9000))
await page.screenshot({ path: 'work/cosmic-upgrade/diag-open.jpg', quality: 82 })
// earth's money frame
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
const finale = await page.evaluate(() => { const e = document.getElementById('finale'); return e ? e.getBoundingClientRect().top + scrollY : null })
for (const [label, y] of [['earth', (finale ?? max) * 0.24], ['saturn', (finale ?? max) * 0.46]]) {
  await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y)
  await page.waitForTimeout(2200)
  await page.screenshot({ path: `work/cosmic-upgrade/diag-${label}.jpg`, quality: 82 })
  const st = await page.evaluate(async () => {
    const { sceneState } = await import('/src/scene/sceneState.ts')
    return { build: +sceneState.build.toFixed(3), swallow: +sceneState.swallow.toFixed(3), distortion: +sceneState.distortion.toFixed(3) }
  })
  console.log(label, JSON.stringify(st))
}
console.log('ERRORS', errors.length)
for (const e of errors.slice(0, 12)) console.log('---\n' + e)
await browser.close()
