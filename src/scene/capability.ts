/**
 * Decides whether the browser gets the 3D reactor at all, and at which quality.
 *
 * This runs *before* the scene chunk is imported. That ordering is the whole
 * point: a visitor who asked for reduced motion, is on a metered connection, or
 * has no WebGL2 must not pay for Three.js at all, so the check cannot live inside
 * the scene it is gating.
 */

/**
 * The two qualities the renderer knows about.
 *
 * `lite` renders on demand — a frame per scroll settle, not a continuous loop.
 * `cinema` is the full experience with post-processing and pointer parallax.
 */
export type Quality = 'lite' | 'cinema'

/**
 * What the visitor is getting.
 *
 * `checking` is the prerendered state: the document is complete and no decision
 * has been made yet. `static` renders no canvas and starts no loop at all.
 * `failed` means the scene was wanted but could not run, and the document has to
 * carry everything on its own — which it always can.
 */
export type ExperienceState = 'checking' | 'static' | Quality | 'failed'

interface NetworkInformation {
  saveData?: boolean
  effectiveType?: string
}

interface CapabilityNavigator extends Navigator {
  deviceMemory?: number
  connection?: NetworkInformation
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Data saver, or a connection slow enough that a 3D payload is hostile. */
const prefersLessData = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const connection = (navigator as CapabilityNavigator).connection
  if (!connection) return false
  if (connection.saveData) return true
  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g'
  )
}

/**
 * Probes for a real WebGL2 context rather than trusting `'WebGL2RenderingContext'
 * in window`: a browser can expose the constructor and still fail to allocate a
 * context on a blocklisted or exhausted GPU.
 *
 * The context is explicitly released afterwards, because browsers cap the number
 * of live contexts and the scene needs to claim one moments later.
 */
const supportsWebGL2 = (): boolean => {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', {
      failIfMajorPerformanceCaveat: false,
    })
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/** Below this width the story is told editorially; a corridor needs room. */
const CINEMA_MIN_WIDTH = 1100
const LITE_MIN_WIDTH = 768

/**
 * The starting quality. It is a first guess only — `usePerformanceGovernor`
 * measures real frame time afterwards and can demote from here, which is what
 * catches a fast CPU paired with a weak GPU.
 */
export const detectQuality = (): ExperienceState => {
  if (typeof window === 'undefined') return 'checking'
  // Metered / no WebGL: no scene payload. Reduced motion still gets lite (demand
  // frames) so the portfolio remains a 3D scroll narrative without a continuous loop.
  if (prefersLessData()) return 'static'
  if (!supportsWebGL2()) return 'static'

  const nav = navigator as CapabilityNavigator
  const cores = nav.hardwareConcurrency ?? 8
  // Safari does not expose deviceMemory; absence must not imply a weak device.
  const memory = nav.deviceMemory ?? 8
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const width = window.innerWidth
  const reduced = prefersReducedMotion()

  if (reduced) return 'lite'
  if (width < LITE_MIN_WIDTH) return 'lite'
  if (coarsePointer || width < CINEMA_MIN_WIDTH) return 'lite'
  if (cores <= 4 || memory <= 4) return 'lite'
  return 'cinema'
}

/**
 * Notifies when a capability that changes the answer changes. Reduced motion and
 * viewport size are both live: a visitor can flip the OS setting or resize a
 * window from desktop to phone width without reloading.
 */
export const onCapabilityChange = (listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const pointer = window.matchMedia('(pointer: coarse)')

  let frame = 0
  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      listener()
    })
  }

  motion.addEventListener('change', schedule)
  pointer.addEventListener('change', schedule)
  window.addEventListener('resize', schedule)
  window.addEventListener('orientationchange', schedule)

  return () => {
    if (frame) cancelAnimationFrame(frame)
    motion.removeEventListener('change', schedule)
    pointer.removeEventListener('change', schedule)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('orientationchange', schedule)
  }
}
