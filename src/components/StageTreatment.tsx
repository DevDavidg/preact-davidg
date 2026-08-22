import { useEffect, useRef } from 'react'
import { addTick } from '../motion/ticker'
import {
  MODES,
  reactorControl,
  subscribeControl,
} from '../scene/control/reactorControl'
import { livePowerFor, sceneState, swallowShape } from '../scene/sceneState'

/**
 * Screen-space atmosphere only: vignette, grain, ignition wash — and the two
 * modes that are cheaper as a filter over the page than as a render pass.
 *
 * CRT and overclock are deliberately not post-processing. A composer would cost
 * roughly 200 kB and a full-screen ping-pong every frame to deliver a scanline
 * and a warm wash; both are a fixed overlay and one CSS filter here. The filter
 * is only mounted while its mode is engaged — an identity `contrast(1)` still
 * promotes the canvas to its own compositing layer, so it has to be genuinely
 * absent, not merely neutral.
 *
 * Not UI: no labels, no meters, no chrome.
 */
export const StageTreatment = () => {
  const ignition = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /*
     * Write only what changed.
     *
     * A custom property set on the root element invalidates style for the whole
     * document, so doing it unconditionally every frame charged a full style
     * recalculation to a scene that is already spending its budget on the GPU —
     * enough, on a weak device, to push measured frame time past the point where
     * the governor abandons the scene entirely. The mode amounts are damped, so
     * they change for a fraction of a second and then sit at exactly 0 or 1;
     * comparing first means the common case writes nothing at all.
     */
    let lastIgnition = ''
    let lastCrt = ''
    let lastOverclock = ''

    return addTick(() => {
      const root = document.documentElement

      /*
       * The ignition wash carries the swallow as well as the charge, but only a
       * little of it. The finale is a black hole now, and the defining feature of
       * one is that the middle of the frame is the *darkest* thing in it. A strong
       * screen-space wash lifted the whole image, the event horizon along with it,
       * and turned the well into a bright disc. Enough to spill the aperture's
       * light past its own geometry, and no more.
       */
      const swallow = swallowShape(sceneState.swallow)
      const glow = (
        livePowerFor(sceneState.build) * 0.1 +
        swallow.grip * 0.24
      ).toFixed(3)
      if (ignition.current && glow !== lastIgnition) {
        lastIgnition = glow
        ignition.current.style.opacity = glow
      }

      const crt = reactorControl.modeAmount.crt.toFixed(3)
      if (crt !== lastCrt) {
        lastCrt = crt
        root.style.setProperty('--crt', crt)
      }

      const overclock = reactorControl.modeAmount.overclock.toFixed(3)
      if (overclock !== lastOverclock) {
        lastOverclock = overclock
        root.style.setProperty('--overclock', overclock)
      }
    })
  }, [])

  /*
   * Modes reach the document as data attributes.
   *
   * The per-frame value above is the *amount*; this is the switch. Splitting
   * them is what lets the CSS mount an expensive rule only while a mode is
   * actually on, while still crossfading its strength.
   */
  useEffect(() => {
    const apply = () => {
      const root = document.documentElement
      for (const mode of MODES) {
        if (reactorControl.modes[mode]) root.dataset[mode] = 'on'
        else delete root.dataset[mode]
      }
    }
    apply()
    const stop = subscribeControl(apply)
    return () => {
      stop()
      const root = document.documentElement
      for (const mode of MODES) delete root.dataset[mode]
      root.style.removeProperty('--crt')
      root.style.removeProperty('--overclock')
    }
  }, [])

  return (
    <div aria-hidden="true" data-print-hide>
      <div className="stage-vignette" />
      <div ref={ignition} className="stage-ignition" />
      <div className="stage-scanlines" />
      <div className="stage-heat" />
      <div className="stage-grain" />
    </div>
  )
}
