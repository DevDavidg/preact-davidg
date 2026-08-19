import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  clamp01,
  phaseFor,
  sceneState,
  useSceneStore,
} from '../scene/sceneState'
import { onLayoutRefresh, runTicks, setScroller } from './ticker'

/**
 * The motion engine, loaded on demand.
 *
 * GSAP, ScrollTrigger and Lenis all live behind this module's dynamic import, so a
 * visitor on the static experience never downloads any of them. Everything else in
 * the app talks to `ticker.ts` instead, which has no dependencies.
 *
 * One clock: Lenis is stepped by GSAP's ticker, ScrollTrigger is updated from
 * Lenis, and the scene reads the values Lenis wrote during that same tick. Before
 * this, each of the three ran its own `requestAnimationFrame`, which meant scroll
 * position, DOM timelines and the camera could each be reading a different moment.
 */

gsap.registerPlugin(ScrollTrigger)

export interface MotionRuntimeOptions {
  /** Featured module count, for the scroll-linked focus triggers. */
  moduleCount: number
}

export const startMotionRuntime = ({
  moduleCount,
}: MotionRuntimeOptions): (() => void) => {
  const { setPhase } = useSceneStore.getState()

  const lenis = new Lenis({
    // Slightly heavier damping: scroll feels deliberate without lagging input.
    lerp: 0.065,
    smoothWheel: true,
    wheelMultiplier: 0.92,
    touchMultiplier: 1.45,
    autoResize: true,
  })

  setScroller({
    toElement: (element) => lenis.scrollTo(element, { offset: -1 }),
    // `immediate` on purpose: a drag is the visitor's own hand on the value, and
    // easing toward a target that moves again next frame turns a 1:1 gesture
    // into a rubber band. The wheel keeps its smoothing; this does not want it.
    by: (pixels) =>
      lenis.scrollTo(lenis.targetScroll + pixels, {
        immediate: true,
        force: true,
      }),
  })

  /*
   * Where the corridor ends and the swallow begins, as a fraction of total scroll.
   *
   * Measured from the rail rather than configured, so the split cannot drift from
   * the chapter heights in `HOME_CHAPTER_VH`. Routes without a finale chapter —
   * the CV and the case studies — measure 1, which is exactly right: their whole
   * rail is corridor and `swallow` stays at zero for the entire page.
   */
  let corridorShare = 1

  const measureSplit = () => {
    const node = document.getElementById('finale')
    const limit = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    )
    if (!node) {
      corridorShare = 1
      return
    }
    // The corridor is finished the moment the finale chapter reaches the top of
    // the viewport; everything after that is the ending.
    const top = node.getBoundingClientRect().top + window.scrollY
    corridorShare = clamp01(top / limit) || 1
  }
  measureSplit()

  const handleScroll = () => {
    const progress = Number.isFinite(lenis.progress) ? lenis.progress : 0
    const clamped = clamp01(progress)
    /*
     * One scroll position, two axes. `build` is stretched back out over the
     * corridor's own share so the story still occupies a full 0 → 1 — that is
     * what lets the finale be added without re-timing a single authored window —
     * and the remainder drives the swallow.
     */
    sceneState.build = clamp01(clamped / corridorShare)
    sceneState.swallow =
      corridorShare >= 1
        ? 0
        : clamp01((clamped - corridorShare) / (1 - corridorShare))
    sceneState.velocity = lenis.velocity
    setPhase(phaseFor(sceneState.build))
    ScrollTrigger.update()
  }

  const step = (time: number, delta: number) => {
    lenis.raf(time * 1000)
    runTicks(time * 1000, delta)
  }

  gsap.ticker.add(step)
  // Lag smoothing off: after a long task, pretending less time passed would make
  // the scroll position and the scene disagree about where the visitor is.
  gsap.ticker.lagSmoothing(0)

  lenis.on('scroll', handleScroll)
  handleScroll()

  /*
   * Scroll-linked module focus.
   *
   * Hovering a project card lights its module in the room, but touch has no hover,
   * so on a phone the connection would never be made. These triggers derive focus
   * from scroll position instead, which also makes the desktop handoff continuous
   * rather than snapping at an intersection threshold.
   *
   * Hover still wins while it is active: the card sets `sceneState.focus` directly
   * and these only run when the pointer is not doing so.
   */
  const focusTriggers: ScrollTrigger[] = []
  for (let index = 0; index < moduleCount; index += 1) {
    const card = document.querySelector<HTMLElement>(
      `[data-module-index="${index}"]`,
    )
    if (!card) continue

    focusTriggers.push(
      ScrollTrigger.create({
        trigger: card,
        start: 'top 65%',
        end: 'bottom 35%',
        onToggle: (self) => {
          if (self.isActive) {
            sceneState.focus = index
            return
          }
          // Only release focus if this module still owns it, otherwise leaving one
          // card would cancel the neighbour that just claimed it.
          if (sceneState.focus === index) sceneState.focus = -1
        },
      }),
    )
  }

  const stopRefresh = onLayoutRefresh(() => {
    lenis.resize()
    ScrollTrigger.refresh()
    measureSplit()
    handleScroll()
  })

  // The rail's height moves with the viewport, so the split has to be remeasured
  // whenever it does — otherwise a rotated phone puts the swallow in the wrong place.
  const handleResize = () => {
    measureSplit()
    handleScroll()
  }
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)

  // A hidden tab must cost nothing: stop the clock rather than idle it.
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      gsap.ticker.sleep()
      return
    }
    gsap.ticker.wake()
  }
  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)
    document.removeEventListener('visibilitychange', handleVisibility)
    stopRefresh()
    focusTriggers.forEach((trigger) => trigger.kill())
    gsap.ticker.remove(step)
    lenis.destroy()
    setScroller(null)
    sceneState.focus = -1
  }
}
