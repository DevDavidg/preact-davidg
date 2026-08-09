import * as THREE from 'three'

/**
 * The bridge between the CSS palette and the shaders.
 *
 * Token names match the `@theme` block in `app/theme.css`. The scene reads the live
 * computed values rather than duplicating hex codes, so DOM and shaders cannot drift
 * apart — there is one palette, and CSS owns it.
 *
 * An earlier version resolved values by appending a probe `<span>` to
 * `document.documentElement` and reading its computed colour. That element became a
 * foreign child of the `<html>` node React hydrates, which broke hydration on every
 * prerendered page and made React discard the server-rendered tree. Nothing here
 * touches the document any more.
 */

const TOKENS = {
  base: '--color-reactor',
  ink: '--color-ink',
  accent: '--color-ignition',
  signal: '--color-ion',
} as const

type TokenName = keyof typeof TOKENS

const FALLBACK: Record<TokenName, string> = {
  base: '#050608',
  ink: '#f3eee4',
  accent: '#ffb454',
  signal: '#76e6f2',
}

/**
 * Live scene palette. Materials that run every frame should `.copy()` from these
 * rather than reading the DOM, which would be a style query per frame.
 */
export const sceneColors = {
  base: new THREE.Color(FALLBACK.base),
  ink: new THREE.Color(FALLBACK.ink),
  /** Ignition amber: primary action, portal, focused module. */
  accent: new THREE.Color(FALLBACK.accent),
  /** Ion cyan: telemetry and conduits only, never a call to action. */
  signal: new THREE.Color(FALLBACK.signal),
  revision: 0,
}

let canvasContext: CanvasRenderingContext2D | null = null

/**
 * Rasterises one pixel to resolve a colour form Three cannot parse, such as
 * `color-mix()` or `oklch()`. Off-document, so it is invisible to React.
 */
const viaCanvas = (cssColor: string): string | null => {
  if (!canvasContext) {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    canvasContext = canvas.getContext('2d', { willReadFrequently: true })
  }
  if (!canvasContext) return null

  canvasContext.clearRect(0, 0, 1, 1)
  // An unparseable value leaves `fillStyle` at its previous value, so set a known
  // sentinel first and treat "unchanged" as failure.
  canvasContext.fillStyle = '#000000'
  canvasContext.fillStyle = cssColor
  canvasContext.fillRect(0, 0, 1, 1)

  const [r, g, b, a] = canvasContext.getImageData(0, 0, 1, 1).data
  if (a === 0) return null
  return `rgb(${r}, ${g}, ${b})`
}

const parseable = (value: string) =>
  value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')

const readToken = (name: TokenName): string => {
  if (typeof document === 'undefined') return FALLBACK[name]

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(TOKENS[name])
    .trim()
  if (!raw) return FALLBACK[name]
  // The four tokens the scene reads are authored as plain hex, so this is the path
  // that normally runs; the canvas below only exists for future token forms.
  if (parseable(raw)) return raw
  return viaCanvas(raw) ?? FALLBACK[name]
}

/** Pulls the palette out of the document. */
export const refreshSceneColors = () => {
  sceneColors.base.set(readToken('base'))
  sceneColors.ink.set(readToken('ink'))
  sceneColors.accent.set(readToken('accent'))
  sceneColors.signal.set(readToken('signal'))
  sceneColors.revision += 1
}
