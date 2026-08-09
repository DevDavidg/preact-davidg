import { useEffect } from 'react'
import { useSceneStore } from '../scene/sceneState'

/**
 * Marks the section crossing the middle of the viewport so the nav can show where
 * the visitor is. A narrow band beats "most visible", which flickers between two
 * tall neighbouring sections.
 *
 * An observer rather than a scroll handler, so this costs nothing per frame and
 * works on the static experience where no clock is running at all.
 */
export const useSectionTracking = (ids: readonly string[]) => {
  const setActiveSection = useSceneStore((state) => state.setActiveSection)

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null)
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.find((entry) => entry.isIntersecting)
        if (entering) setActiveSection(entering.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [ids, setActiveSection])
}
