import { useEffect, useRef } from 'react'
import { useCopy } from '../i18n/copy'
import { liveFor, sceneState, useSceneStore } from '../scene/sceneState'

const GLYPHS = '▚▞█▛▜/\\_—'
const SCRAMBLE_STEPS = 5

/**
 * The fixed instrumentation layer: progress bar, phase readout, build percentage
 * and the screen-space portal glow.
 *
 * These values change every frame, so they are written straight to the DOM from
 * a single rAF loop. Routing them through React state would re-render the tree
 * sixty times a second for four numbers.
 */
export const Hud = () => {
  const { copy } = useCopy()
  const phase = useSceneStore((state) => state.phase)
  const tier = useSceneStore((state) => state.tier)
  const booted = useSceneStore((state) => state.booted)

  const bar = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const percent = useRef<HTMLSpanElement>(null)
  const portal = useRef<HTMLDivElement>(null)
  const phaseLabel = useRef<HTMLSpanElement>(null)
  const cluster = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    let lastPercent = -1

    const tick = () => {
      // The readout tracks real scroll even on the reduced-motion tier, where the
      // 3D scene itself is frozen. Reporting the frozen value instead would make
      // the HUD claim ASSEMBLING while you are reading the LIVE section.
      const build = sceneState.build
      const scale = `scaleX(${build.toFixed(4)})`
      if (bar.current) bar.current.style.transform = scale
      if (fill.current) fill.current.style.transform = scale
      if (portal.current) {
        portal.current.style.opacity = (liveFor(build) * 0.26).toFixed(3)
      }

      // Instrumentation retires once the build finishes, which also keeps it
      // clear of the footer at the very bottom of the page.
      const retire = (1 - Math.max(0, (build - 0.94) / 0.06)).toFixed(3)
      if (cluster.current) cluster.current.style.opacity = retire
      if (hint.current) hint.current.style.opacity = retire

      const rounded = Math.round(build * 100)
      if (rounded !== lastPercent) {
        lastPercent = rounded
        if (percent.current) {
          percent.current.textContent = String(rounded).padStart(3, '0')
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [tier])

  // Phase changes glitch through block glyphs before resolving — the readout
  // behaves like instrumentation rather than a label swap.
  useEffect(() => {
    const node = phaseLabel.current
    if (!node) return
    if (tier === 'still') {
      node.textContent = phase
      return
    }

    let step = 0
    const timer = window.setInterval(() => {
      step += 1
      if (step > SCRAMBLE_STEPS) {
        node.textContent = phase
        window.clearInterval(timer)
        return
      }
      node.textContent = Array.from(phase)
        .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
        .join('')
    }, 45)

    return () => {
      window.clearInterval(timer)
      node.textContent = phase
    }
  }, [phase, tier])

  return (
    <>
      <div className="stage stage--vignette" aria-hidden="true" />
      <div ref={portal} className="stage stage--portal" aria-hidden="true" />
      <div ref={bar} className="progress" aria-hidden="true" />

      {/* The instrumentation assembles once the boot overlay clears, like the
          rest of the overlay. Its own opacity is written per frame above, so the
          pieces carry the arrival instead of the cluster. */}
      <div
        ref={cluster}
        className="hud hud--left"
        aria-hidden="true"
        data-shown={booted}
      >
        {/* The caption promises a rebuild, so on the frozen tier it says so
            instead — the meter below still tracks the reader's real position. */}
        <span className="hud__label shard shard--fine">
          {tier === 'still' ? copy.hud.subtitleStill : copy.hud.subtitle}
        </span>
        <span className="hud__line shard shard--fine">
          <span ref={phaseLabel} className="hud__phase">
            {phase}
          </span>
          <span className="hud__build">
            {copy.hud.build} <span ref={percent}>000</span>%
          </span>
        </span>
        <div className="hud__track shard shard--fine">
          <div ref={fill} className="hud__fill" />
        </div>
      </div>

      <div
        ref={hint}
        className="hud hud--right"
        aria-hidden="true"
        data-shown={booted}
      >
        <span className="hud__label shard shard--fine">{copy.hud.hint}</span>
      </div>
    </>
  )
}
