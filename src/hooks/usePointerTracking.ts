import { useEffect } from 'react'
import type { ExperienceState } from '../scene/capability'
import { sceneState } from '../scene/sceneState'

/**
 * Feeds normalised pointer coordinates to the camera rig. Cinema only: the
 * lower qualities keep the camera centred so they have one less thing moving
 * per frame.
 *
 * `capability.ts` already sends any device whose *primary* pointer is coarse
 * to `lite`, so a pure touch phone never reaches this hook at all — this is
 * not where that gate lives. What it did gate, on top of that, was `mouse`
 * specifically: a cinema-quality laptop with a touchscreen has a fine primary
 * pointer and so qualifies for cinema, but a finger on that touchscreen fired
 * `pointerType: 'touch'` events this hook threw away, so the one class of
 * visitor who could reach the effect and chose to touch it felt nothing.
 * Touch now drives the same parallax while a finger is actually down — never
 * a simulated hover, since it recentres on lift exactly like a mouse leaving
 * the window.
 */
export const usePointerTracking = (experience: ExperienceState) => {
  useEffect(() => {
    if (experience !== 'cinema') {
      sceneState.pointerX = 0
      sceneState.pointerY = 0
      return
    }

    const setFrom = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'touch') return
      sceneState.pointerX = (event.clientX / window.innerWidth) * 2 - 1
      sceneState.pointerY = (event.clientY / window.innerHeight) * 2 - 1
    }

    // Recentre when the pointer leaves the window, otherwise the camera keeps
    // a permanent lean toward wherever the cursor exited.
    const handleLeave = () => {
      sceneState.pointerX = 0
      sceneState.pointerY = 0
    }
    // A lifted finger is gone, unlike a released mouse button — a touch has no
    // hover to fall back on once contact ends, so losing contact has to mean
    // the same thing `pointerleave` means for a mouse.
    const handleTouchEnd = (event: PointerEvent) => {
      if (event.pointerType === 'touch') handleLeave()
    }

    window.addEventListener('pointermove', setFrom, { passive: true })
    // A tap alone fires no `pointermove`; without this a touch that does not
    // drag reads as never having touched at all.
    window.addEventListener('pointerdown', setFrom, { passive: true })
    document.addEventListener('pointerleave', handleLeave)
    window.addEventListener('pointerup', handleTouchEnd, { passive: true })
    window.addEventListener('pointercancel', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('pointermove', setFrom)
      window.removeEventListener('pointerdown', setFrom)
      document.removeEventListener('pointerleave', handleLeave)
      window.removeEventListener('pointerup', handleTouchEnd)
      window.removeEventListener('pointercancel', handleTouchEnd)
    }
  }, [experience])
}
