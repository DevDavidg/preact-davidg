import { useEffect, useRef, useState } from 'react'

/**
 * Reports the first time an element enters the viewport, then stops observing.
 * Reduced-motion visitors start as already visible so nothing depends on an
 * animation they never see.
 */
export const useInView = <T extends HTMLElement>(threshold = 0.12) => {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setInView(true)
        observer.disconnect()
      },
      { threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
