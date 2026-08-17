import { useEffect, useLayoutEffect } from 'react'
import {
  detectQuality,
  onCapabilityChange,
  type ExperienceState,
} from '../scene/capability'
import { useSceneStore } from '../scene/sceneState'

/**
 * Resolves which experience this visitor gets, and keeps it correct afterwards.
 *
 * The decision is deliberately made in an effect rather than during render: the
 * prerendered HTML is produced in the `checking` state, which is the complete
 * document, so hydration adds the scene instead of replacing a 3D-only layout.
 *
 * That effect runs as a layout effect on the client (a no-op during any actual
 * SSR pass, since the server never runs effects at all) so the decision lands
 * before the browser's first paint rather than after it — otherwise the static
 * document paints once, unmasked, before the scene takes over.
 *
 * Once the scene has failed we stay failed. Retrying a lost context or a rejected
 * chunk on every resize would thrash a device that has already told us it cannot
 * cope.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const useExperience = (): ExperienceState => {
  const experience = useSceneStore((s) => s.experience)
  const setExperience = useSceneStore((s) => s.setExperience)

  useIsomorphicLayoutEffect(() => {
    if (useSceneStore.getState().experience === 'failed') return

    setExperience(detectQuality())

    return onCapabilityChange(() => {
      if (useSceneStore.getState().experience === 'failed') return
      setExperience(detectQuality())
    })
  }, [setExperience])

  return experience
}
