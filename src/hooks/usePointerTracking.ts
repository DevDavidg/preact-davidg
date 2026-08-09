import { useEffect } from 'react'
import type { ExperienceState } from '../scene/capability'
import { sceneState } from '../scene/sceneState'

/**
 * Feeds normalised pointer coordinates to the camera rig. Cinema only: on touch
 * there is no hover to reward, and the lower qualities keep the camera centred so
 * they have one less thing moving per frame.
 */
export const usePointerTracking = (experience: ExperienceState) => {
  useEffect(() => {
    if (experience !== 'cinema') {
      sceneState.pointerX = 0
      sceneState.pointerY = 0
      return
    }

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      sceneState.pointerX = (event.clientX / window.innerWidth) * 2 - 1
      sceneState.pointerY = (event.clientY / window.innerHeight) * 2 - 1
    }

    // Recentre when the pointer leaves the window, otherwise the camera keeps a
    // permanent lean toward wherever the cursor exited.
    const handleLeave = () => {
      sceneState.pointerX = 0
      sceneState.pointerY = 0
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    document.addEventListener('pointerleave', handleLeave)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerleave', handleLeave)
    }
  }, [experience])
}
