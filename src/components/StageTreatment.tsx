import { useEffect, useRef } from 'react'
import { addTick } from '../motion/ticker'
import { livePowerFor, sceneState } from '../scene/sceneState'

/**
 * Screen-space atmosphere only: vignette, grain, ignition wash.
 * Not UI — no labels, no meters, no chrome.
 */
export const StageTreatment = () => {
  const ignition = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return addTick(() => {
      if (!ignition.current) return
      ignition.current.style.opacity = (
        livePowerFor(sceneState.build) * 0.1
      ).toFixed(3)
    })
  }, [])

  return (
    <div aria-hidden="true" data-print-hide>
      <div className="stage-vignette" />
      <div ref={ignition} className="stage-ignition" />
      <div className="stage-grain" />
    </div>
  )
}
