import { useEffect, useState } from 'react'
import { SECTION_IDS } from '../../lib/routes'
import { useSceneStore } from '../sceneState'
import {
  measureSectionWindows,
  onSectionLayoutChange,
  sameWindows,
  type SectionWindows,
} from './sectionRanges'

/**
 * Where each chapter sits on the build axis. The scroll rail owns the DOM nodes;
 * the canvas only reads their measured windows.
 */
export const useSectionWindows = (
  ids: readonly string[] = SECTION_IDS,
): SectionWindows => {
  const experience = useSceneStore((state) => state.experience)
  const [windows, setWindows] = useState<SectionWindows>(() =>
    measureSectionWindows(ids),
  )

  useEffect(() => {
    const remeasure = () => {
      const next = measureSectionWindows(ids)
      setWindows((current) => (sameWindows(current, next) ? current : next))
    }
    remeasure()
    return onSectionLayoutChange(remeasure)
  }, [experience, ids])

  return windows
}
