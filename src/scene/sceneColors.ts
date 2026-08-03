import * as THREE from 'three'

/** Dispatched after `data-palette` / `data-tone` / `data-model` attrs change (DEV debug). */
export const DESIGN_DEBUG_CHANGE_EVENT = 'dg-design-debug-change'

const FALLBACK = {
  base: '#070605',
  ink: '#f4efe6',
  accent: '#d4a054',
} as const

/** Sentinel so a rejected `style.color` assignment is detectable. */
const PROBE_SENTINEL = 'rgb(1, 2, 3)'

/**
 * Live scene palette — mirrors CSS tokens on `:root`.
 * Materials that run every frame should `.copy()` from these; background/fog
 * listeners refresh on `DESIGN_DEBUG_CHANGE_EVENT`.
 */
export const sceneColors = {
  base: new THREE.Color(FALLBACK.base),
  ink: new THREE.Color(FALLBACK.ink),
  accent: new THREE.Color(FALLBACK.accent),
  revision: 0,
}

/** Reused probe — `getPropertyValue('--x')` keeps `color-mix`/`var` raw; computed `color` is resolved. */
let colorProbe: HTMLSpanElement | null = null
let canvasCtx: CanvasRenderingContext2D | null = null

const ensureColorProbe = (): HTMLSpanElement => {
  if (colorProbe?.isConnected) return colorProbe

  colorProbe = document.createElement('span')
  colorProbe.setAttribute('aria-hidden', 'true')
  colorProbe.style.cssText =
    'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;visibility:hidden'
  document.documentElement.appendChild(colorProbe)
  return colorProbe
}

/** `color(srgb r g b)` → `rgb()` — Three does not accept the CSS Color 4 form. */
const fromCssColorFunction = (value: string): string | null => {
  const match = value.match(
    /^color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)$/i,
  )
  if (!match) return null

  const r = Math.round(Number(match[1]) * 255)
  const g = Math.round(Number(match[2]) * 255)
  const b = Math.round(Number(match[3]) * 255)
  const alpha = match[4] === undefined ? 1 : Number(match[4])
  if (![r, g, b, alpha].every((n) => Number.isFinite(n))) return null
  if (alpha < 1) return `rgba(${r}, ${g}, ${b}, ${alpha})`
  return `rgb(${r}, ${g}, ${b})`
}

/** Canvas rasterization — last resort for odd computed formats. */
const fromCanvas = (cssColor: string): string | null => {
  if (!canvasCtx) {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    canvasCtx = canvas.getContext('2d', { willReadFrequently: true })
  }
  if (!canvasCtx) return null

  canvasCtx.clearRect(0, 0, 1, 1)
  canvasCtx.fillStyle = cssColor
  canvasCtx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = canvasCtx.getImageData(0, 0, 1, 1).data
  if (a === 0) return null
  if (a === 255) return `rgb(${r}, ${g}, ${b})`
  return `rgba(${r}, ${g}, ${b}, ${Number((a / 255).toFixed(3))})`
}

/** Normalize any resolved CSS color into a Three-parseable rgb/rgba/hex string. */
const toThreeColor = (resolved: string, fallback: string): string => {
  if (
    resolved.startsWith('#') ||
    resolved.startsWith('rgb') ||
    resolved.startsWith('hsl')
  ) {
    return resolved
  }

  const fromSrgb = fromCssColorFunction(resolved)
  if (fromSrgb) return fromSrgb

  return fromCanvas(resolved) ?? fallback
}

/**
 * Resolve any CSS color string (including `color-mix` / `var`) to `rgb()`/`rgba()`
 * that THREE.Color can parse.
 */
const resolveCssColor = (raw: string, fallback: string): string => {
  if (typeof document === 'undefined' || !raw) return fallback

  const probe = ensureColorProbe()
  probe.style.color = PROBE_SENTINEL
  probe.style.color = raw
  const resolved = getComputedStyle(probe).color.trim()
  probe.style.color = ''

  // Browser kept the sentinel → assignment was rejected / not a color.
  if (!resolved || resolved === PROBE_SENTINEL) return fallback
  return toThreeColor(resolved, fallback)
}

const readCssColor = (prop: keyof typeof FALLBACK): string => {
  if (typeof document === 'undefined') return FALLBACK[prop]
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${prop}`)
    .trim()
  return resolveCssColor(value, FALLBACK[prop])
}

/** Pull `--base` / `--ink` / `--accent` from the document (theme-aware). */
export const refreshSceneColors = () => {
  sceneColors.base.set(readCssColor('base'))
  sceneColors.ink.set(readCssColor('ink'))
  sceneColors.accent.set(readCssColor('accent'))
  sceneColors.revision += 1
}

/**
 * Subscribe to design-debug theme changes. Always refreshes CSS→Three colors
 * before invoking the listener. Safe in production (event never fires).
 */
export const onDesignDebugChange = (listener: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  const handleChange = () => {
    refreshSceneColors()
    listener()
  }

  window.addEventListener(DESIGN_DEBUG_CHANGE_EVENT, handleChange)
  return () => window.removeEventListener(DESIGN_DEBUG_CHANGE_EVENT, handleChange)
}

if (typeof document !== 'undefined') {
  refreshSceneColors()
  // Module eval can precede stylesheet / data-* application; re-sync next frame.
  requestAnimationFrame(() => {
    refreshSceneColors()
  })
}
