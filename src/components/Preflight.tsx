import { useEffect, useState } from 'react'
import { useCopy } from '../lib/locale'
import { hasVoices, play } from '../scene/control/reactorControl'
import { useSceneStore } from '../scene/sceneState'

/** Never hold the document longer than this, whatever the scene is doing. */
const TIMEOUT_MS = 2200
/** Below this the overlay would be a flash, so it is skipped entirely. */
const MIN_VISIBLE_MS = 320
/** Gap between telemetry lines. Fast enough to read as a machine, not a wait. */
const LINE_MS = 110

/**
 * Preflight.
 *
 * This was a solid rectangle that faded out on a timer — a loading screen
 * pretending not to be one. A reactor's first scene is its boot, so the overlay
 * now reports what is actually coming online, and every line is a fact the app
 * already knows: the capability gate's answer, the fidelity the governor
 * starts at, whether audio is armed, and the first presented frame.
 *
 * Deliberately not a progress bar. A bar would have to invent a percentage, and
 * the one honest signal here — `sceneReady`, the first real frame — arrives all
 * at once. Lines tick in sequence; the last one waits for that frame.
 */
export const Preflight = () => {
  const { copy } = useCopy()
  const experience = useSceneStore((state) => state.experience)
  const fidelity = useSceneStore((state) => state.fidelity)
  const sceneReady = useSceneStore((state) => state.sceneReady)
  const booted = useSceneStore((state) => state.booted)
  const setBooted = useSceneStore((state) => state.setBooted)
  const [mounted, setMounted] = useState(false)
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (experience === 'checking') return
    if (experience === 'static' || experience === 'failed') {
      setBooted(true)
      return
    }
    setMounted(true)
    // Silent unless the visitor already opted into sound on a previous visit and
    // has since armed it — `play` is a no-op with no voices registered.
    play('law', 0)

    const timeout = window.setTimeout(() => setBooted(true), TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [experience, setBooted])

  const lines = copy.hud.bootLines

  // Every line but the last is a fact already resolved; they tick in sequence so
  // the boot reads as a sequence rather than appearing whole.
  useEffect(() => {
    if (!mounted || stage >= lines.length - 1) return
    const timer = window.setTimeout(() => setStage((value) => value + 1), LINE_MS)
    return () => window.clearTimeout(timer)
  }, [mounted, stage, lines.length])

  useEffect(() => {
    if (!sceneReady || booted) return
    setStage(lines.length)
    const timer = window.setTimeout(() => setBooted(true), MIN_VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [sceneReady, booted, setBooted, lines.length])

  if (!mounted) return null

  const values = [
    'OK',
    fidelity.toUpperCase(),
    'ARMED',
    hasVoices() ? 'ONLINE' : 'STANDBY',
    sceneReady ? 'ONLINE' : '····',
  ]

  return (
    <div
      aria-hidden="true"
      data-print-hide
      data-done={booted}
      className="pointer-events-none fixed inset-0 z-boot flex items-end bg-reactor p-gutter opacity-100 transition-opacity duration-700 ease-signal data-[done=true]:opacity-0"
    >
      <div className="w-full max-w-sm">
        <p className="text-meta">{copy.hud.boot}</p>
        <ul className="mt-3 flex flex-col gap-1">
          {lines.map((line, index) => (
            <li
              key={line}
              data-lit={index < stage}
              className="text-meta flex items-center justify-between border-b border-line py-1 opacity-0 transition-opacity duration-300 ease-signal data-[lit=true]:opacity-100"
            >
              <span>{line}</span>
              <span className="text-ignition">{values[index] ?? 'OK'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
