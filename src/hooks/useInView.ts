import { useEffect, useRef, useState } from 'react'

/**
 * Reports the first time an element enters the viewport, then stops observing.
 *
 * Starts `true` when the visitor prefers reduced motion so nothing they will
 * never see gates the content behind it.
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

    // Anything already on screen at mount — the hero, or a deep link's target —
    // should be treated as arrived rather than waiting for a scroll that may
    // never happen.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setInView(true)
        observer.disconnect()
      },
      { threshold, rootMargin: '0px 0px -5% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}
