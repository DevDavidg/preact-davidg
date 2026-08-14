import * as THREE from 'three'

/**
 * Every glyph the scene will ever draw, rasterized once into a single canvas
 * texture. That is what makes typography-as-geometry affordable: one atlas plus
 * one instanced quad mesh renders the whole page's world copy in one draw call,
 * no per-letter mesh and no SDF worker.
 *
 * The families come from the live CSS tokens, so the scene never drifts from the
 * design system (including the DEV theme playground).
 */

export type FontRole = 'display' | 'body' | 'mono'

/** Rasterization height for one em. Big enough to read at hero scale. */
const RASTER = 72

/** Transparent gutter around each glyph so bilinear sampling never bleeds. */
const PADDING = 5

const ATLAS_WIDTH = 1024
const ATLAS_MAX_HEIGHT = 2048

const ROLE_WEIGHT: Record<FontRole, number> = {
  display: 600,
  body: 400,
  mono: 500,
}

const ROLE_TOKEN: Record<FontRole, string> = {
  display: '--font-display',
  body: '--font-body',
  mono: '--font-mono',
}

const FALLBACK_FAMILY: Record<FontRole, string> = {
  display: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Newsreader', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
}

export interface GlyphMetric {
  /** Atlas UV rect. */
  u0: number
  v0: number
  u1: number
  v1: number
  /** Quad size in em (multiply by the block's world em size). */
  width: number
  height: number
  /** Em from the pen position to the quad's left edge (leftwards is positive). */
  bearingX: number
  /** Em from the baseline up to the quad's top edge. */
  top: number
  /** Pen advance in em. */
  advance: number
}

export interface GlyphAtlas {
  texture: THREE.Texture
  /** Key is `${role}:${char}`. */
  metrics: Map<string, GlyphMetric>
  /** Canvas pixel buffer for CPU voxelisation (RGBA). */
  pixels: Uint8ClampedArray
  width: number
  height: number
  /**
   * False when the requested glyphs did not fit the atlas. Missing metrics would
   * drop characters out of the middle of a word, so the caller must keep the DOM
   * text visible rather than hand the copy over to the scene.
   */
  complete: boolean
  dispose: () => void
}

/**
 * Alpha inside a glyph's atlas rect. `uNorm`/`vNorm` are 0→1 across the glyph
 * quad (vNorm 0 = top, matching layout rows).
 */
export const glyphAlphaAt = (
  atlas: GlyphAtlas,
  metric: GlyphMetric,
  uNorm: number,
  vNorm: number,
): number => {
  const u = metric.u0 + (metric.u1 - metric.u0) * uNorm
  // Metrics store texture V (flipY on): v1 = top of glyph, v0 = bottom.
  const v = metric.v1 + (metric.v0 - metric.v1) * vNorm
  const x = Math.min(
    atlas.width - 1,
    Math.max(0, Math.floor(u * atlas.width)),
  )
  const y = Math.min(
    atlas.height - 1,
    Math.max(0, Math.floor((1 - v) * atlas.height)),
  )
  return atlas.pixels[(y * atlas.width + x) * 4 + 3] / 255
}

export const glyphKey = (role: FontRole, char: string) => `${role}:${char}`

const readFamily = (role: FontRole): string => {
  if (typeof document === 'undefined') return FALLBACK_FAMILY[role]
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(ROLE_TOKEN[role])
    .trim()
  return value || FALLBACK_FAMILY[role]
}

const fontString = (role: FontRole, family: string) =>
  `${ROLE_WEIGHT[role]} ${RASTER}px ${family}`

/**
 * Webfonts resolve after first paint. Rasterizing before they land would bake
 * the fallback family into the texture permanently, so wait for both the
 * explicit loads and the document-wide ready signal.
 */
const waitForFonts = async (specs: string[]) => {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all(
    specs.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  )
  await document.fonts.ready.catch(() => undefined)
}

interface Request {
  role: FontRole
  chars: Set<string>
}

/**
 * Always rasterised, for every role.
 *
 * Layout can introduce an ellipsis that appears in no source string: a plate is
 * a fixed rectangle, so a row that overflows it is abbreviated at layout time,
 * long after the atlas was built from the untruncated copy. Without this the
 * mark would silently render as a blank advance.
 */
const ALWAYS = '…'

/** Collapses the requested strings into the unique glyph set per role. */
const collectRequests = (
  sources: Iterable<{ role: FontRole; text: string }>,
): Request[] => {
  const byRole = new Map<FontRole, Set<string>>()
  for (const { role, text } of sources) {
    let chars = byRole.get(role)
    if (!chars) {
      chars = new Set<string>([ALWAYS])
      byRole.set(role, chars)
    }
    for (const char of text) {
      if (char === ' ' || char === '\n') continue
      chars.add(char)
    }
  }
  return Array.from(byRole, ([role, chars]) => ({ role, chars }))
}

/** Space has no ink: measure the advance and store an empty rect. */
const spaceMetric = (advance: number): GlyphMetric => ({
  u0: 0,
  v0: 0,
  u1: 0,
  v1: 0,
  width: 0,
  height: 0,
  bearingX: 0,
  top: 0,
  advance,
})

/**
 * Builds the atlas for exactly the glyphs the scene asks for. Resolves after the
 * webfonts are ready; callers should treat the world copy as absent until then
 * and keep the DOM text visible in the meantime.
 */
export const buildGlyphAtlas = async (
  sources: Iterable<{ role: FontRole; text: string }>,
): Promise<GlyphAtlas> => {
  const requests = collectRequests(sources)
  const families = new Map<FontRole, string>()
  for (const { role } of requests) families.set(role, readFamily(role))

  await waitForFonts(
    Array.from(families, ([role, family]) => fontString(role, family)),
  )

  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_WIDTH
  const context = canvas.getContext('2d')
  if (!context) throw new Error('glyphAtlas: 2D context unavailable')

  const rowHeight = Math.ceil(RASTER * 1.42) + PADDING * 2
  // One pass to lay out rows, so the canvas is sized before anything is drawn:
  // resizing a canvas clears it.
  let cursorX = 0
  let rows = 1
  const placements: {
    role: FontRole
    char: string
    x: number
    y: number
    metrics: TextMetrics
  }[] = []

  let complete = true

  for (const { role, chars } of requests) {
    if (!complete) break
    context.font = fontString(role, families.get(role) ?? FALLBACK_FAMILY[role])
    for (const char of chars) {
      const metrics = context.measureText(char)
      const inkWidth =
        Math.abs(metrics.actualBoundingBoxLeft) +
        Math.abs(metrics.actualBoundingBoxRight)
      const rectWidth = Math.ceil(inkWidth) + PADDING * 2
      if (cursorX + rectWidth > ATLAS_WIDTH) {
        cursorX = 0
        rows += 1
      }
      if (rows * rowHeight > ATLAS_MAX_HEIGHT) {
        complete = false
        break
      }
      placements.push({
        role,
        char,
        x: cursorX,
        y: (rows - 1) * rowHeight,
        metrics,
      })
      cursorX += rectWidth
    }
  }

  canvas.height = Math.min(ATLAS_MAX_HEIGHT, rows * rowHeight)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.textBaseline = 'alphabetic'
  context.textAlign = 'left'
  // White ink: the shader tints it with the live palette, so the atlas stays
  // theme-agnostic and never needs a rebuild when tokens change.
  context.fillStyle = '#ffffff'

  const metrics = new Map<string, GlyphMetric>()
  let activeRole: FontRole | null = null

  for (const placement of placements) {
    if (placement.role !== activeRole) {
      activeRole = placement.role
      context.font = fontString(
        activeRole,
        families.get(activeRole) ?? FALLBACK_FAMILY[activeRole],
      )
    }

    const box = placement.metrics
    const left = Math.abs(box.actualBoundingBoxLeft)
    const right = Math.abs(box.actualBoundingBoxRight)
    const ascent = Math.abs(box.actualBoundingBoxAscent)
    const descent = Math.abs(box.actualBoundingBoxDescent)
    const rectWidth = Math.ceil(left + right) + PADDING * 2
    const rectHeight = Math.ceil(ascent + descent) + PADDING * 2

    context.fillText(
      placement.char,
      placement.x + PADDING + left,
      placement.y + PADDING + ascent,
    )

    metrics.set(glyphKey(placement.role, placement.char), {
      u0: placement.x / canvas.width,
      // Canvas Y grows down, texture V grows up (flipY stays on).
      v0: 1 - (placement.y + rectHeight) / canvas.height,
      u1: (placement.x + rectWidth) / canvas.width,
      v1: 1 - placement.y / canvas.height,
      width: rectWidth / RASTER,
      height: rectHeight / RASTER,
      bearingX: (left + PADDING) / RASTER,
      top: (ascent + PADDING) / RASTER,
      advance: box.width / RASTER,
    })
  }

  for (const { role } of requests) {
    context.font = fontString(role, families.get(role) ?? FALLBACK_FAMILY[role])
    metrics.set(
      glyphKey(role, ' '),
      spaceMetric(context.measureText(' ').width / RASTER),
    )
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 4
  texture.needsUpdate = true

  // Snapshot before the texture owns the canvas — voxels sample ink on the CPU.
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data

  return {
    texture,
    metrics,
    pixels,
    width: canvas.width,
    height: canvas.height,
    complete,
    dispose: () => texture.dispose(),
  }
}
