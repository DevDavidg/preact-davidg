import { useEffect, useState } from 'react'
import { useSceneStore } from '../scene/sceneState'

/** Never hold the document longer than this, whatever the scene is doing. */
const TIMEOUT_MS = 2200
/** Below this the overlay would be a flash, so it is skipped entirely. */
const MIN_VISIBLE_MS = 320

/**
 * Solid colour fade while the reactor comes online — no labels, no bar.
 */
export const Preflight = () => {
  const experience = useSceneStore((state) => state.experience)
  const sceneReady = useSceneStore((state) => state.sceneReady)
  const booted = useSceneStore((state) => state.booted)
  const setBooted = useSceneStore((state) => state.setBooted)
  const [mounted, setMounted] = useState(false)

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
    const timer = window.setTimeout(() => setBooted(true), MIN_VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [sceneReady, booted, setBooted])

  if (!mounted) return null

  return (
    <div
      aria-hidden="true"
      data-print-hide
      data-done={booted}
      className="pointer-events-none fixed inset-0 z-boot bg-reactor opacity-100 transition-opacity duration-700 ease-signal data-[done=true]:opacity-0"
    />
  )
}
