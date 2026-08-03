import { useEffect } from 'react'
import Lenis from 'lenis'
import {
  phaseFor,
  sceneState,
  useSceneStore,
  type Tier,
} from '../scene/sceneState'

let lenis: Lenis | null = null

/** Scrolls to a section by id, respecting the active smooth-scroll instance. */
export const scrollToSection = (id: string) => {
  const target = document.getElementById(id)
  if (!target) return
  if (lenis) {
    lenis.scrollTo(target, { offset: -1 })
    return
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Owns the single source of truth for scroll: Lenis drives the document, and
 * every frame it writes progress and velocity into `sceneState` for the 3D
 * scene to read. Phase is the only value promoted to React state.
 */
export const useSmoothScroll = (tier: Tier) => {
  const setPhase = useSceneStore((s) => s.setPhase)

  useEffect(() => {
    const smooth = tier !== 'still'
    const instance = new Lenis({
      lerp: smooth ? 0.085 : 1,
      smoothWheel: smooth,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    })
    lenis = instance

    let frame = 0
    const raf = (time: number) => {
      instance.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    const handleScroll = () => {
      const progress = Number.isFinite(instance.progress) ? instance.progress : 0
      sceneState.build = Math.min(1, Math.max(0, progress))
      sceneState.velocity = instance.velocity
      setPhase(phaseFor(sceneState.build))
    }

    instance.on('scroll', handleScroll)
    handleScroll()

    return () => {
      cancelAnimationFrame(frame)
      instance.destroy()
      if (lenis === instance) lenis = null
    }
  }, [tier, setPhase])
}
