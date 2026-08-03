import * as THREE from 'three'

/** Dispatched after `data-palette` / `data-tone` / `data-model` attrs change (DEV debug). */
export const DESIGN_DEBUG_CHANGE_EVENT = 'dg-design-debug-change'

const FALLBACK = {
  base: '#0a0a0b',
  ink: '#f2f0ec',
  accent: '#ff5c38',
} as const

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

/** Reused probe — `getPropertyValue('--x')` keeps `color-mix`/`var` raw; computed `color` is rgb(). */
let colorProbe: HTMLSpanElement | null = null

const resolveCssColor = (raw: string, fallback: string): string => {
  if (typeof document === 'undefined' || !raw) return fallback

  // Fast path: Three already accepts hex / rgb / named colors.
  if (
    raw.startsWith('#') ||
    raw.startsWith('rgb') ||
    raw.startsWith('hsl') ||
    /^[a-z]+$/i.test(raw)
  ) {
    return raw
  }

  if (!colorProbe) {
    colorProbe = document.createElement('span')
    colorProbe.setAttribute('aria-hidden', 'true')
    colorProbe.style.cssText =
      'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;visibility:hidden'
    document.documentElement.appendChild(colorProbe)
  }

  colorProbe.style.color = raw
  const resolved = getComputedStyle(colorProbe).color.trim()
  colorProbe.style.color = ''

  // Invalid CSS leaves computed color as the initial transparent black in some engines.
  if (!resolved || resolved === 'rgba(0, 0, 0, 0)') return fallback
  return resolved
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
}
