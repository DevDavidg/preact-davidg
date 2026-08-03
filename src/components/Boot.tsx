import { useEffect, useRef, useState } from 'react'
import { useCopy } from '../i18n/copy'
import { useSceneStore } from '../scene/sceneState'

const DURATION = 900

/**
 * A short power-up before the atelier appears. It buys time for the first shader
 * compile — which is where the jank would otherwise land — and frames the scene
 * as something being switched on.
 */
export const Boot = () => {
  const { copy } = useCopy()
  const tier = useSceneStore((state) => state.tier)
  const setBooted = useSceneStore((state) => state.setBooted)
  const [done, setDone] = useState(false)
  const fill = useRef<HTMLDivElement>(null)
  const percent = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (tier === 'still') {
      setDone(true)
      setBooted(true)
      return
    }

    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const ratio = Math.min(1, (now - start) / DURATION)
      if (fill.current) fill.current.style.transform = `scaleX(${ratio.toFixed(3)})`
      if (percent.current) {
        percent.current.textContent = String(Math.round(ratio * 100)).padStart(3, '0')
      }
      if (ratio < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      setDone(true)
      setBooted(true)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [tier, setBooted])

  return (
    <div className="boot" data-done={done} aria-hidden="true">
      <span className="boot__title">{copy.hud.boot}</span>
      <div className="boot__track">
        <div ref={fill} className="boot__fill" style={{ transform: 'scaleX(0)' }} />
      </div>
      <span className="boot__pct">
        {copy.hud.build} <span ref={percent}>000</span>%
      </span>
    </div>
  )
}
