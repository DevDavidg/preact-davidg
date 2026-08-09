import { useEffect, useState } from 'react'
import { useCopy } from '../lib/locale'
import { useSceneStore } from '../scene/sceneState'

/** Never hold the document longer than this, whatever the scene is doing. */
const TIMEOUT_MS = 2200
/** Below this the overlay would be a flash, so it is skipped entirely. */
const MIN_VISIBLE_MS = 320

/**
 * A brief preflight while the reactor comes online.
 *
 * The previous version always ran for exactly 900 ms and reported a percentage of
 * that timer — theatre on a fast machine, and gone too early on a slow one. This
 * one tracks the real signal (`sceneReady`, set when the renderer presents its
 * first frame) and has a hard timeout so a stalled scene can never hold the page
 * hostage.
 *
 * Crucially it is not a gate: the document underneath is already complete and
 * scrollable, and the overlay is skipped outright when there is no scene to wait
 * for.
 */
export const Preflight = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const sceneReady = useSceneStore((state) => state.sceneReady)
  const booted = useSceneStore((state) => state.booted)
  const setBooted = useSceneStore((state) => state.setBooted)
  const [mounted, setMounted] = useState(false)

  // The static experience and a failed scene have nothing to wait for, so they are
  // "booted" immediately and this component renders nothing.
  useEffect(() => {
    if (experience === 'checking') return
    if (experience === 'static' || experience === 'failed') {
      setBooted(true)
      return
    }
    setMounted(true)

    const timeout = window.setTimeout(() => setBooted(true), TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [experience, setBooted])

  useEffect(() => {
    if (!sceneReady || booted) return
    // A minimum on-screen time so the overlay reads as a deliberate power-up
    // rather than a flicker when the scene happens to be instant.
    const timer = window.setTimeout(() => setBooted(true), MIN_VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [sceneReady, booted, setBooted])

  if (!mounted) return null

  return (
    <div
      aria-hidden="true"
      data-print-hide
      data-done={booted}
      className="pointer-events-none fixed inset-0 z-boot grid place-content-center gap-4 bg-reactor opacity-100 transition-opacity duration-700 ease-signal data-[done=true]:opacity-0"
    >
      <span className="text-eyebrow text-center">{copy.hud.boot}</span>
      <div className="h-px w-56 overflow-hidden bg-ink/12">
        <div
          data-ready={sceneReady}
          className="h-full w-full origin-left scale-x-[0.08] bg-ignition transition-transform duration-700 ease-signal data-[ready=true]:scale-x-100"
        />
      </div>
    </div>
  )
}
