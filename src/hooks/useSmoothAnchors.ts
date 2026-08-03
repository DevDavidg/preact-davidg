import { useEffect } from 'react'
import { scrollToSection } from './useSmoothScroll'

/**
 * Routes every in-page anchor through the smooth-scroll instance. Delegating at
 * the document means nav, CTAs and footer links all behave the same without
 * each one wiring up a handler.
 */
export const useSmoothAnchors = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as Element | null
      const anchor = target?.closest('a[href^="#"]')
      if (!(anchor instanceof HTMLAnchorElement)) return

      const id = anchor.getAttribute('href')?.slice(1)
      if (!id || !document.getElementById(id)) return

      event.preventDefault()
      scrollToSection(id)
      window.history.replaceState(null, '', `#${id}`)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
}
