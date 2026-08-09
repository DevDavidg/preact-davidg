/**
 * The tick bus, and the scroll control surface.
 *
 * This module has no dependencies on purpose. Everything that needs a per-frame
 * callback — the HUD, the ignition indicator, the heading weight morph, the
 * performance governor — subscribes here instead of importing GSAP, which is what
 * keeps the animation engine out of the critical bundle. Nothing drives these
 * callbacks until `src/motion/runtime.ts` is loaded, and that only happens once the
 * capability gate has decided a scene is warranted.
 *
 * So on the static experience there is genuinely no loop: subscribers exist, and
 * are simply never called.
 */

export type TickHandler = (time: number, delta: number) => void

const handlers = new Set<TickHandler>()

export const addTick = (handler: TickHandler) => {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

/** Called by the runtime, once per frame, from whatever clock it installed. */
export const runTicks = (time: number, delta: number) => {
  for (const handler of handlers) handler(time, delta)
}

/* Scroll control ---------------------------------------------------------- */

export interface Scroller {
  toElement: (element: HTMLElement) => void
}

let scroller: Scroller | null = null

export const setScroller = (next: Scroller | null) => {
  scroller = next
}

const nativeBehavior = (): ScrollBehavior =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'

/**
 * Scrolls to an element through the smooth scroller when one is installed, and
 * natively otherwise. Both paths have to exist: anchors must work on the static
 * experience, where no scroller is ever created.
 */
export const scrollToSection = (id: string) => {
  const target = document.getElementById(id)
  if (!target) return

  if (scroller) {
    scroller.toElement(target)
    return
  }
  target.scrollIntoView({ behavior: nativeBehavior(), block: 'start' })
}

/* Layout invalidation ----------------------------------------------------- */

type RefreshHandler = () => void

const refreshHandlers = new Set<RefreshHandler>()

export const onLayoutRefresh = (handler: RefreshHandler) => {
  refreshHandlers.add(handler)
  return () => {
    refreshHandlers.delete(handler)
  }
}

/**
 * Announces that element positions have moved — a font swapped, a language
 * changed the copy length, an image decoded. Scroll-linked machinery caches
 * positions and has to be told.
 */
export const refreshLayout = () => {
  for (const handler of refreshHandlers) handler()
}
