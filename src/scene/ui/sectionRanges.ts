import { clamp01 } from './fragmentSettle'

/**
 * Maps DOM sections onto the same 0 → 1 build axis Lenis writes into
 * `sceneState.build`, so a world-space block can be told "assemble while the
 * visitor is scrolling into Work" without hardcoding scroll percentages that
 * break the moment copy length changes.
 */

export interface SectionWindow {
  /** Build value where the section starts entering the viewport. */
  enter: number
  /** Build value where the section is centred. */
  centre: number
  /** Build value where the section leaves. */
  exit: number
}

export type SectionWindows = Record<string, SectionWindow>

/** Fraction of a viewport before the section top that counts as "entering". */
const LEAD_IN = 0.92

/** Fraction of a viewport past the section top that counts as "centred". */
const LEAD_OUT = 0.18

const scrollLimit = () =>
  Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

export const measureSectionWindows = (
  ids: readonly string[],
): SectionWindows => {
  if (typeof document === 'undefined') return {}

  const limit = scrollLimit()
  const viewport = window.innerHeight
  const windows: SectionWindows = {}

  for (const id of ids) {
    const node = document.getElementById(id)
    if (!node) continue

    const rect = node.getBoundingClientRect()
    const top = rect.top + window.scrollY
    windows[id] = {
      enter: clamp01((top - viewport * LEAD_IN) / limit),
      centre: clamp01((top - viewport * LEAD_OUT) / limit),
      exit: clamp01((top + rect.height - viewport * LEAD_OUT) / limit),
    }
  }

  return windows
}

/**
 * True when two measurements are close enough that re-placing every fragment
 * would be invisible. Reveal transitions nudge section heights constantly, and
 * each rebuild reallocates the instance buffers.
 */
export const sameWindows = (
  a: SectionWindows,
  b: SectionWindows,
  epsilon = 0.004,
): boolean => {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false

  return keys.every((key) => {
    const left = a[key]
    const right = b[key]
    if (!right) return false
    return (
      Math.abs(left.enter - right.enter) < epsilon &&
      Math.abs(left.centre - right.centre) < epsilon &&
      Math.abs(left.exit - right.exit) < epsilon
    )
  })
}

/**
 * Subscribes to layout changes that move sections along the build axis: resize,
 * font swap and the reveal transitions that grow section heights.
 */
export const onSectionLayoutChange = (listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  let frame = 0
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      listener()
    })
  }

  window.addEventListener('resize', schedule)
  const observer = new ResizeObserver(schedule)
  observer.observe(document.documentElement)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('resize', schedule)
    observer.disconnect()
  }
}
