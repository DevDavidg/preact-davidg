import { useEffect } from 'react'
import { detectTier, useSceneStore, type Tier } from '../scene/sceneState'

/**
 * Resolves the quality tier once on mount and keeps it in sync with the
 * reduced-motion preference, which users can flip without reloading.
 * Initial value comes from the store (`detectTier()` at create time).
 */
export const useMotionTier = (): Tier => {
  const tier = useSceneStore((s) => s.tier)
  const setTier = useSceneStore((s) => s.setTier)

  useEffect(() => {
    setTier(detectTier())

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setTier(detectTier())
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [setTier])

  return tier
}
