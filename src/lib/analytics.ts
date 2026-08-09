/**
 * The conversion funnel, behind one adapter.
 *
 * There is no vendor here on purpose. The site has two audiences and needs to
 * know which path each one takes, but it should not ship a tracker — or a consent
 * banner — before a host is chosen. Everything is queued into `dataLayer`-style
 * events that a provider can be attached to later without touching call sites.
 *
 * Hard rule: no personal data. Email addresses, phone numbers and any form
 * content are never passed as detail; the event name says *what* happened and the
 * detail says *which item*, nothing more.
 */

export type AnalyticsEvent =
  /** Which audience the visitor self-selected in the hero. */
  | 'hero_intent'
  /** A case study page was opened. */
  | 'case_open'
  /** A live demo of a project was opened. */
  | 'demo_open'
  /** Source code for a project was opened. */
  | 'repo_open'
  /** The CV route was viewed or printed. */
  | 'cv_view'
  | 'cv_print'
  /** A contact channel was used. */
  | 'contact_click'
  | 'email_copy'
  /** Language was switched, with the target locale as detail. */
  | 'locale_switch'
  /** The 3D experience settled at a quality, or was abandoned. */
  | 'experience_resolved'

interface TrackedEvent {
  name: AnalyticsEvent
  detail?: string
  at: number
}

interface AnalyticsWindow extends Window {
  dgAnalytics?: TrackedEvent[]
}

/** Kept short: this is a handoff buffer, not a log. */
const MAX_QUEUE = 50

export const trackEvent = (name: AnalyticsEvent, detail?: string) => {
  if (typeof window === 'undefined') return

  const target = window as AnalyticsWindow
  const queue = (target.dgAnalytics ??= [])
  queue.push({ name, detail, at: Math.round(performance.now()) })
  if (queue.length > MAX_QUEUE) queue.shift()

  // A provider added later listens for this instead of patching every call site.
  window.dispatchEvent(
    new CustomEvent('dg:analytics', { detail: { name, detail } }),
  )
}

/**
 * Core Web Vitals, reported through the same channel.
 *
 * Uses the platform's own PerformanceObserver rather than a library: LCP, CLS and
 * INP are all available directly, and a metrics package would be a bundle cost on
 * the critical path for numbers that only matter in aggregate.
 */
export const observeWebVitals = () => {
  if (typeof PerformanceObserver === 'undefined') return () => {}

  const observers: PerformanceObserver[] = []

  const observe = (
    type: string,
    handler: (list: PerformanceObserverEntryList) => void,
  ) => {
    try {
      const observer = new PerformanceObserver(handler)
      observer.observe({ type, buffered: true })
      observers.push(observer)
    } catch {
      // An unsupported entry type is not an error; the metric is simply absent.
    }
  }

  let layoutShift = 0

  observe('largest-contentful-paint', (list) => {
    const last = list.getEntries().at(-1)
    if (last) trackEvent('experience_resolved', `lcp:${Math.round(last.startTime)}`)
  })

  observe('layout-shift', (list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & {
      value: number
      hadRecentInput: boolean
    })[]) {
      if (entry.hadRecentInput) continue
      layoutShift += entry.value
    }
  })

  observe('event', (list) => {
    const worst = list
      .getEntries()
      .reduce((max, entry) => Math.max(max, entry.duration), 0)
    if (worst > 0) trackEvent('experience_resolved', `inp:${Math.round(worst)}`)
  })

  const flush = () => {
    if (layoutShift > 0) {
      trackEvent('experience_resolved', `cls:${layoutShift.toFixed(3)}`)
      layoutShift = 0
    }
  }
  // `visibilitychange` is the only reliable end-of-session hook on mobile.
  document.addEventListener('visibilitychange', flush)

  return () => {
    document.removeEventListener('visibilitychange', flush)
    observers.forEach((observer) => observer.disconnect())
  }
}
