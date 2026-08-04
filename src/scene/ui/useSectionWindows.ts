import { useEffect, useState } from 'react'
import { SECTION_IDS } from '../../sections'
import {
  measureSectionWindows,
  onSectionLayoutChange,
  sameWindows,
  type SectionWindows,
} from './sectionRanges'

/**
 * Where each section sits on the build axis, kept in sync with layout. Measured
 * once above the canvas and handed down as props: both the world typography and
 * the artifact panels need the same numbers, and measuring twice would mean two
 * forced reflows per resize.
 */
export const useSectionWindows = (): SectionWindows => {
  const [windows, setWindows] = useState<SectionWindows>(() =>
    measureSectionWindows(SECTION_IDS),
  )

  useEffect(() => {
    const remeasure = () => {
      const next = measureSectionWindows(SECTION_IDS)
      setWindows((current) => (sameWindows(current, next) ? current : next))
    }
    remeasure()
    return onSectionLayoutChange(remeasure)
  }, [])

  return windows
}
