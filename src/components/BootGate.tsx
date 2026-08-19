import { useEffect } from 'react'
import { play } from '../scene/control/reactorControl'
import { useSceneStore } from '../scene/sceneState'

/**
 * The boot gate.
 *
 * This replaces `Preflight`, which was a telemetry overlay that faded out on a
 * timer. Two things were wrong with it, and they were the same bug seen from
 * either end:
 *
 * 1. The prerendered HTML is the complete document, so it painted — headline,
 *    project cards, the whole portfolio — the instant it arrived, before a line
 *    of JavaScript had run. The canvas then replaced it a beat later. No
 *    layout effect can be "before first paint" when the paint happens before
 *    the script does; the flash had to be prevented in the HTML itself.
 * 2. The overlay that was supposed to cover that window mounted at full opacity
 *    *after* the capability check resolved, so it snapped over content the
 *    visitor had already read, then faded. It advertised the wait instead of
 *    hiding it.
 *
 * So the hold now lives in an inline `<style>` + `<script>` pair in `<head>`
 * (see `app/root.tsx`): the script stamps `data-boot="hold"` on `<html>` before
 * the body is parsed, and the style keeps the body transparent over the reactor
 * background while it is stamped. Nothing is drawn, nothing is announced, and
 * there is no overlay to see — which is what "la precarga que no se vea" asks for.
 *
 * This component is the release valve. It is headless: its whole job is to
 * decide *when* the hold ends.
 *
 * - No scene wanted (`static`) or no scene possible (`failed`): release at once.
 *   The document is the experience for those visitors.
 * - Scene wanted: release when the renderer has actually presented settled
 *   frames (`sceneReady`), so the first thing the visitor sees is the room, not
 *   a half-compiled version of it.
 * - Whatever happens: release on a timeout. A chunk that never arrives must not
 *   leave anyone staring at an empty background, and the inline script carries
 *   the same failsafe for the case where this component never mounts at all.
 */

/** Never hold the document longer than this, whatever the scene is doing. */
const HOLD_TIMEOUT_MS = 2600

const release = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  // `open` rather than removing the attribute: the reveal is a transition on
  // body, and a removed attribute cannot be the end state of one.
  if (root.dataset.boot === 'hold') root.dataset.boot = 'open'
}

export const BootGate = () => {
  const experience = useSceneStore((state) => state.experience)
  const sceneReady = useSceneStore((state) => state.sceneReady)
  const setBooted = useSceneStore((state) => state.setBooted)

  useEffect(() => {
    if (experience === 'checking') return

    if (experience === 'static' || experience === 'failed') {
      release()
      setBooted(true)
      return
    }

    // Silent unless the visitor already opted into sound on a previous visit and
    // has since armed it — `play` is a no-op with no voices registered.
    play('law', 0)

    const timer = window.setTimeout(() => {
      release()
      setBooted(true)
    }, HOLD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [experience, setBooted])

  useEffect(() => {
    if (!sceneReady) return
    release()
    setBooted(true)
  }, [sceneReady, setBooted])

  return null
}
