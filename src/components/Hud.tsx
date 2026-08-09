import { useEffect, useRef } from 'react'
import { addTick } from '../motion/ticker'
import { useCopy } from '../lib/locale'
import { livePowerFor, sceneState, useSceneStore } from '../scene/sceneState'

const GLYPHS = '▚▞█▛▜/\\_—'
const SCRAMBLE_STEPS = 5

/**
 * The instrument cluster: charge meter, phase readout and the screen-space
 * confirmation of the portal.
 *
 * Rendered only when a canvas exists, which is what keeps the promise that the
 * static experience runs no loop at all. The values here change every frame, so
 * they are written straight to the DOM from the shared tick bus — routing four
 * numbers through React state would re-render the tree sixty times a second.
 */
export const Hud = () => {
  const { copy } = useCopy()
  const phase = useSceneStore((state) => state.phase)
  const experience = useSceneStore((state) => state.experience)
  const booted = useSceneStore((state) => state.booted)

  const bar = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const percent = useRef<HTMLSpanElement>(null)
  const portal = useRef<HTMLDivElement>(null)
  const phaseLabel = useRef<HTMLSpanElement>(null)
  const cluster = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let lastPercent = -1
    let presence = 0
    let sinceMount = 0

    const tick = (_time: number, delta: number) => {
      sinceMount += delta
      const build = sceneState.build
      const scale = `scaleX(${build.toFixed(4)})`
      if (bar.current) bar.current.style.transform = scale
      if (fill.current) fill.current.style.transform = scale
      if (portal.current) {
        portal.current.style.opacity = (livePowerFor(build) * 0.1).toFixed(3)
      }

      /*
       * The cluster is fixed chrome in a corner that every section eventually scrolls
       * a heading through, so leaving it up permanently meant instrumentation sitting
       * on top of copy. It shows briefly on arrival — long enough to be noticed — and
       * afterwards only while the visitor is actually moving, which is the only time a
       * charge readout means anything.
       *
       * Tied to elapsed time rather than to scroll position: a fraction of this page's
       * length is most of a viewport, so a "still in the first chapter" test kept the
       * cluster up across the whole opening screen.
       */
      const moving = Math.min(1, Math.abs(sceneState.velocity) * 0.05)
      const intro = 1 - Math.min(1, Math.max(0, (sinceMount - 2200) / 600))
      // Retire entirely before the contact address lands in the same corner.
      const retire = Math.max(0, 1 - Math.max(0, (build - 0.86) / 0.08))
      const target = Math.max(moving, intro) * retire

      // Asymmetric damping: appear promptly, leave slowly.
      const rate = target > presence ? 12 : 2.4
      presence += (target - presence) * Math.min(1, (delta / 1000) * rate)
      const opacity = presence.toFixed(3)
      if (cluster.current) cluster.current.style.opacity = opacity
      if (hint.current) hint.current.style.opacity = opacity

      const rounded = Math.round(build * 100)
      if (rounded !== lastPercent) {
        lastPercent = rounded
        if (percent.current) {
          percent.current.textContent = String(rounded).padStart(3, '0')
        }
      }
    }

    return addTick(tick)
  }, [])

  // The phase readout glitches through block glyphs before resolving, so it reads
  // as instrumentation rather than a label swap.
  useEffect(() => {
    const node = phaseLabel.current
    if (!node) return

    const label = copy.hud.phases[phase] ?? phase
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = label
      return
    }

    let step = 0
    const timer = window.setInterval(() => {
      step += 1
      if (step > SCRAMBLE_STEPS) {
        node.textContent = label
        window.clearInterval(timer)
        return
      }
      node.textContent = Array.from(label)
        .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
        .join('')
    }, 45)

    return () => {
      window.clearInterval(timer)
      node.textContent = label
    }
  }, [phase, copy.hud.phases])

  // Opacity is written per frame above, so it is deliberately not transitioned here.
  const instrument =
    'pointer-events-none fixed bottom-6 z-hud hidden flex-col gap-1.5 border border-line bg-reactor/85 px-3.5 py-2.5 opacity-0 backdrop-blur-sm xl:flex'

  return (
    <div aria-hidden="true" data-print-hide>
      <div className="stage-vignette" />
      <div ref={portal} className="stage-ignition" />
      <div className="stage-grain" />
      <div
        ref={bar}
        className="fixed inset-x-0 top-0 z-[300] h-0.5 origin-left scale-x-0 bg-ignition will-change-transform"
      />

      <div
        ref={cluster}
        data-shown={booted}
        className={`${instrument} left-gutter`}
      >
        <span className="text-meta shard shard-fine">
          {experience === 'lite' ? copy.hud.subtitleStatic : copy.hud.subtitle}
        </span>
        <span className="shard shard-fine flex items-baseline gap-3.5">
          <span
            ref={phaseLabel}
            className="font-mono text-xs font-semibold tracking-[0.22em] text-ignition"
            style={{ minWidth: '11ch' }}
          >
            {copy.hud.phases[phase] ?? phase}
          </span>
          <span className="text-meta tabular">
            {copy.hud.build} <span ref={percent}>000</span>%
          </span>
        </span>
        <div className="shard shard-fine mt-0.5 h-0.5 w-36 overflow-hidden bg-ink/10">
          <div
            ref={fill}
            className="h-full origin-left scale-x-0 bg-ignition will-change-transform"
          />
        </div>
      </div>

      <div
        ref={hint}
        data-shown={booted}
        className={`${instrument} right-gutter text-right`}
      >
        <span className="text-meta shard shard-fine">{copy.hud.hint}</span>
      </div>
    </div>
  )
}
