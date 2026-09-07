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
  const vignette = useRef<HTMLDivElement>(null)

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
    let lastVignette = ''
    let lastCrt = ''
    let lastOverclock = ''

    return addTick(() => {
      const root = document.documentElement

      /*
       * The ignition wash carries the swallow as well as the charge, but barely.
       *
       * The finale is a black hole, and the defining feature of one is that the
       * middle of the frame is the *darkest* thing in it. A screen-space wash lifts
       * the whole image, the event horizon along with it, and turns the well into a
       * grey disc — and now that the well is drawn by a pass that emits its own
       * light and blooms, this has nothing left to contribute but that lift. What
       * survives is a trace, enough to say the room is under a light it cannot see
       * the source of.
       */
      const swallow = swallowShape(sceneState.swallow)
      const glow = (
        livePowerFor(sceneState.build) * 0.1 * (1 - swallow.amount) +
        swallow.grip * 0.02
      ).toFixed(3)
      if (ignition.current && glow !== lastIgnition) {
        lastIgnition = glow
        ignition.current.style.opacity = glow
      }

      /*
       * The vignette lets go of the ending.
       *
       * It is a fixed radial scrim that pulls the corners toward the reactor
       * colour, and for the whole corridor that is what gives the room a frame.
       * The finale is the one shot where a frame is wrong: the well opens past
       * the edges of the viewport, so the scrim was laying an opaque border over
       * the outermost arcs of the lensed image — the part that carries how far
       * the field reaches — and flattening the interior along with it.
       *
       * Opacity on one element rather than a custom property on the root: a
       * property write invalidates style for the whole document, and this
       * changes every frame for the length of the ending, which is exactly the
       * stretch that can least afford a style recalculation.
       */
      const scrim = (1 - swallow.drain * 0.94).toFixed(3)
      if (vignette.current && scrim !== lastVignette) {
        lastVignette = scrim
        vignette.current.style.opacity = scrim
      }

      const crt = (reactorControl.modeAmount.crt * (1 - swallow.drain)).toFixed(3)
      if (crt !== lastCrt) {
        lastCrt = crt
        root.style.setProperty('--crt', crt)
      }

      const overclock = (reactorControl.modeAmount.overclock * (1 - swallow.drain)).toFixed(3)
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
      <div ref={vignette} className="stage-vignette" />
      <div ref={ignition} className="stage-ignition" />
      <div className="stage-scanlines" />
      <div className="stage-heat" />
      <div className="stage-grain" />
    </div>
  )
}
