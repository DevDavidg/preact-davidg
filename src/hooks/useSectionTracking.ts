import { useEffect } from 'react'
import { useSceneStore } from '../scene/sceneState'

/**
 * Marks the section currently crossing the middle of the viewport so the nav can
 * show where you are. A narrow root margin band beats "most visible", which
 * flickers between tall neighbouring sections.
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
