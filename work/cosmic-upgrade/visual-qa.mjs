import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const out = new URL(`./${process.env.QA_LABEL || 'baseline'}/`, import.meta.url).pathname
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
const errors = []
page.on('pageerror', error => errors.push({ kind: 'pageerror', text: error.message }))
page.on('console', message => { if (message.type() === 'error' || /WebGL|GL_INVALID|shader error|context lost/i.test(message.text())) errors.push({ kind: message.type(), text: message.text().slice(0, 1500) }) })
page.on('response', response => { if (response.status() >= 400) errors.push({ kind: 'http', status: response.status(), url: response.url() }) })
await page.goto('http://localhost:5173/es/', { waitUntil: 'load' })
await page.locator('canvas').waitFor({ timeout: 20000 }).catch(async error => {
  console.log('canvas unavailable', await page.locator('body').innerText(), errors)
  await browser.close()
  throw error
})
await page.waitForTimeout(1000)
const sections = await page.evaluate(() => [...document.querySelectorAll('.scroll-rail-chapter')].map(e => ({ id: e.id, top: e.getBoundingClientRect().top + scrollY, height: e.getBoundingClientRect().height })))
console.log('sections', sections)
const read = () => page.evaluate(async () => {
  const { sceneState, useSceneStore } = await import('/src/scene/sceneState.ts')
  const { reactorControl } = await import('/src/scene/control/reactorControl.ts')
  const { experience, fidelity } = useSceneStore.getState()
  const canvas = document.querySelector('canvas')
  return { y: scrollY, build: sceneState.build, swallow: sceneState.swallow, scrollSwallow: sceneState.scrollSwallow, autonomousSwallow: sceneState.autonomousSwallow, distortion: sceneState.distortion, law: reactorControl.law, experience, fidelity, canvas: !!canvas }
})
const snapshots = []
const finale = sections.find(s => s.id === 'finale').top
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
const stops = [['opening', 0], ['earth', finale * 0.25], ['saturn', finale * 0.58], ['portrait-enter', finale * 0.76], ['portrait-hold', finale * 0.83], ['portrait-exit', finale * 0.89], ['galaxy-approach', finale], ['swallow-mid', finale + (max - finale) * 0.5], ['ending', max]]
for (const [name, y] of stops) {
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y)
  await page.waitForTimeout(1900)
  const state = await read()
  await page.screenshot({ path: `${out}${name}.jpg`, quality: 86 })
  snapshots.push({ name, ...state })
  console.log(name, JSON.stringify(state))
}
await writeFile(`${out}report.json`, JSON.stringify({ sections, snapshots, errors }, null, 2))
console.log('errors', JSON.stringify(errors))
console.log('output', out)
await browser.close()
