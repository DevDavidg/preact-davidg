import { useEffect } from 'react'
import { useSceneStore, type Tier } from '../scene/sceneState'

interface Capabilities {
  deviceMemory?: number
  hardwareConcurrency?: number
}

const detectTier = (): Tier => {
  if (typeof window === 'undefined') return 'lite'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'still'
  }

  const nav = navigator as Navigator & Capabilities
  const cores = nav.hardwareConcurrency ?? 8
  const memory = nav.deviceMemory ?? 8
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 900

  if (coarse || narrow || cores <= 4 || memory <= 4) return 'lite'
  return 'cinema'
}

/**
 * Resolves the quality tier once on mount and keeps it in sync with the
 * reduced-motion preference, which users can flip without reloading.
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
