import { useEffect } from 'react'
import type { ExperienceState } from '../scene/capability'
import { resetSceneMotion } from '../scene/sceneState'
import { refreshLayout, scrollToSection } from './ticker'

/**
 * Installs the motion runtime for experiences that have a scene, and installs
 * nothing at all for the ones that do not.
 *
 * The import is inside the effect so the animation engine is fetched only after the
 * capability gate has said yes — a reduced-motion or data-saver visitor never
 * downloads GSAP or Lenis.
 */
export const useReactorScroll = (
  experience: ExperienceState,
  moduleCount: number,
) => {
  useEffect(() => {
    if (experience === 'checking') return
    if (experience === 'static' || experience === 'failed') {
      resetSceneMotion()
      // The document still scrolls natively; nothing is listening to it.
      return
    }

    let stop: (() => void) | null = null
    let cancelled = false

    import('./runtime')
      .then(({ startMotionRuntime }) => {
        if (cancelled) return
        stop = startMotionRuntime({ moduleCount })
      })
      .catch(() => {
        // A rejected chunk leaves native scrolling in place, which is a complete
        // experience on its own.
      })

    return () => {
      cancelled = true
      stop?.()
      resetSceneMotion()
    }
  }, [experience, moduleCount])
}

/**
 * Sends every in-page anchor through the smooth scroller when one exists, keeps the
 * hash in history so the back button walks the visited sections, and moves keyboard
 * focus into the target rather than leaving it behind in the nav.
 */
export const useAnchorScroll = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest('a[href*="#"]')
      if (!(anchor instanceof HTMLAnchorElement)) return

      const url = new URL(anchor.href, window.location.href)
      // Same-document anchors only; a link elsewhere keeps normal routing.
      if (url.pathname !== window.location.pathname || !url.hash) return

      const id = url.hash.slice(1)
      const target = document.getElementById(id)
      if (!target) return

      event.preventDefault()
      scrollToSection(id)
      // pushState, not replaceState: the hash trail has to be walkable back.
      if (window.location.hash !== url.hash) {
        window.history.pushState(null, '', url.hash)
      }
      target.focus({ preventScroll: true })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
}

/**
 * Announces that positions have moved. Fonts swapping is the change that shifts
 * everything below the fold, and a language switch changes copy length.
 */
export const useScrollRefresh = (dependency: unknown) => {
  useEffect(() => {
    const frame = requestAnimationFrame(refreshLayout)
    document.fonts?.ready.then(refreshLayout).catch(() => undefined)
    return () => cancelAnimationFrame(frame)
  }, [dependency])
}
