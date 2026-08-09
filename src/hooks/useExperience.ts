import { useEffect } from 'react'
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
 * Once the scene has failed we stay failed. Retrying a lost context or a rejected
 * chunk on every resize would thrash a device that has already told us it cannot
 * cope.
 */
export const useExperience = (): ExperienceState => {
  const experience = useSceneStore((s) => s.experience)
  const setExperience = useSceneStore((s) => s.setExperience)

  useEffect(() => {
    if (useSceneStore.getState().experience === 'failed') return

    setExperience(detectQuality())

    return onCapabilityChange(() => {
      if (useSceneStore.getState().experience === 'failed') return
      setExperience(detectQuality())
    })
  }, [setExperience])

  return experience
}
