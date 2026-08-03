import { useEffect } from 'react'
import { sceneState, type Tier } from '../scene/sceneState'

/**
 * Feeds normalized pointer coordinates into `sceneState` for the camera rig and
 * the heading weight-morph. Skipped on touch and reduced-motion tiers, where the
 * scene stays centred.
 */
export const usePointerTracking = (tier: Tier) => {
  useEffect(() => {
    if (tier !== 'cinema') {
      sceneState.pointerX = 0
      sceneState.pointerY = 0
      return
    }

    const handleMove = (event: PointerEvent) => {
      sceneState.pointerX = (event.clientX / window.innerWidth) * 2 - 1
      sceneState.pointerY = (event.clientY / window.innerHeight) * 2 - 1
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMove)
  }, [tier])
}
