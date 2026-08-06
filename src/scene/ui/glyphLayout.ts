import * as THREE from 'three'
import {
  glyphAlphaAt,
  glyphKey,
  type FontRole,
  type GlyphAtlas,
  type GlyphMetric,
} from './glyphAtlas'

/**
 * Turns declarative text blocks into instance buffers for `GlyphField`.
 * Hero / project copy can voxelise from the atlas (opaque matter); everything
 * else stays a thin atlas plate so signage stays cheap and legible.
 */

export type GlyphForm = 'flat' | 'voxel'

/**
 * `stack` — identical cubes along Z (hero silhouette).
 * `relief` — one elongated brick per ink cell; depth follows alpha so strokes
 * read as architectural members, not a Lego pile (Work numerals).
 */
export type VoxelProfile = 'stack' | 'relief'

export interface VoxelSpec {
  /** Target cell size in em — smaller = denser. */
  cellEm: number
  /** Max extrusion steps (stack layers, or relief depth units). */
  layers: number
  /** Atlas alpha cutoff for keeping a cell. */
  threshold?: number
  /** Build style. Default `stack`. */
  profile?: VoxelProfile
  /**
   * Relief only: Z thickness as a multiple of the face edge at full ink.
   * >1 pulls the letter into the room like a bay column.
   */
  extrude?: number
}

export interface TextBlock {
  id: string
  text: string
  role: FontRole
  /** World size of one em. */
  em: number
  /** Extra letter spacing, in em. */
  tracking?: number
  /** Baseline-to-baseline distance, in em. */
  leading?: number
  /** Wrap width in em; omit for a single line. */
  wrap?: number
  align?: 'left' | 'centre'
  /** World position of the first baseline, at the alignment point. */
  position: THREE.Vector3
  /** Orientation of the text plane. */
  quaternion: THREE.Quaternion
  /** Build value where the block starts assembling. */
  enter: number
  /** Build span the block takes to assemble. */
  span: number
  /** Build value where the block comes apart again; omit to keep it forever. */
  exit?: number
  /** Build span the block takes to come apart. */
  exitSpan?: number
  /** Flat only: sub-cells per glyph as [columns, rows]. */
  slice?: [number, number]
  /** Scatter radius of the start position, in world units. */
  chaos?: number
  /** How far behind the plane fragments start, in world units. */
  depth?: number
  /** `voxel` = opaque cubes from ink; default `flat` = atlas plate. */
  form?: GlyphForm
  /** Required when `form` is `voxel`. */
  voxel?: VoxelSpec
  /** 0 = ink, 1 = accent. */
  accent?: number
  /** Opacity multiplier. */
  weight?: number
}

export interface GlyphInstances {
  count: number
  /**
   * False when the fragment budget cut the layout short. The blocks that did not
   * fit are simply absent from the mesh, so the DOM copy has to stay visible.
   */
  complete: boolean
  chaos: Float32Array
  home: Float32Array
  quaternion: Float32Array
  axis: Float32Array
  rect: Float32Array
  /** Per instance `[width, height, thickness]`. */
  size: Float32Array
  seed: Float32Array
  window: Float32Array
  /** accent, weight, form (0 = flat, 1 = voxel). */
  style: Float32Array
}

/** Deterministic hash so a fragment starts from the same place on every reload. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123
  return x - Math.floor(x)
}

interface Line {
  chars: string[]
  width: number
}

const advanceOf = (
  atlas: GlyphAtlas,
  role: FontRole,
  char: string,
  tracking: number,
) => (atlas.metrics.get(glyphKey(role, char))?.advance ?? 0.5) + tracking

const measure = (
  atlas: GlyphAtlas,
  role: FontRole,
  chars: string[],
  tracking: number,
) => chars.reduce((total, char) => total + advanceOf(atlas, role, char, tracking), 0)

/** Greedy word wrap in em space; explicit `\n` always breaks. */
const wrapLines = (block: TextBlock, atlas: GlyphAtlas): Line[] => {
  const tracking = block.tracking ?? 0
  const limit = block.wrap ?? Infinity
  const lines: Line[] = []

  for (const paragraph of block.text.split('\n')) {
    let chars: string[] = []
    let width = 0

    for (const word of paragraph.split(' ')) {
      const candidate = chars.length ? [' ', ...word] : Array.from(word)
      const candidateWidth = measure(atlas, block.role, candidate, tracking)

      if (chars.length && width + candidateWidth > limit) {
        lines.push({ chars, width })
        chars = Array.from(word)
        width = measure(atlas, block.role, chars, tracking)
        continue
      }

      chars = chars.concat(candidate)
      width += candidateWidth
    }

    lines.push({ chars, width })
  }

  return lines
}

interface Cursor {
  index: number
  scratch: {
    local: THREE.Vector3
    world: THREE.Vector3
    axis: THREE.Vector3
    normal: THREE.Vector3
  }
}

const gridFor = (metric: GlyphMetric, cellEm: number) => {
  const cols = Math.max(3, Math.round(metric.width / cellEm))
  const rows = Math.max(3, Math.round(metric.height / cellEm))
  return { cols, rows }
}

/** Worst-case instance count so buffers allocate once. */
const countFragments = (blocks: TextBlock[], atlas: GlyphAtlas) =>
  blocks.reduce((total, block) => {
    const glyphs = Array.from(block.text).filter((char) => char !== ' ' && char !== '\n')
    if (block.form === 'voxel') {
      const cellEm = block.voxel?.cellEm ?? 0.1
      const layers = block.voxel?.layers ?? 3
      const profile = block.voxel?.profile ?? 'stack'
      // Relief places one brick per cell; stack multiplies by layer count.
      const perCell = profile === 'relief' ? 1 : layers
      return (
        total +
        glyphs.reduce((sum, char) => {
          const metric = atlas.metrics.get(glyphKey(block.role, char))
          if (!metric || metric.width <= 0) return sum
          const { cols, rows } = gridFor(metric, cellEm)
          return sum + cols * rows * perCell
        }, 0)
      )
    }
    const [columns, rows] = block.slice ?? [1, 1]
    return total + glyphs.length * columns * rows
  }, 0)

const pushFragment = (
  out: GlyphInstances,
  cursor: Cursor,
  block: TextBlock,
  centreX: number,
  centreY: number,
  centreZ: number,
  width: number,
  height: number,
  depth: number,
  rect: [number, number, number, number],
  form: number,
) => {
  const index = cursor.index
  const { local, world, axis, normal } = cursor.scratch
  const seed = hash(index * 1.7 + block.em * 13.1 + block.enter * 97.3)
  const chaosRadius = block.chaos ?? 4.2
  const scatter = block.depth ?? 7

  local.set(centreX, centreY, centreZ).applyQuaternion(block.quaternion)
  world.copy(block.position).add(local)

  out.home[index * 3] = world.x
  out.home[index * 3 + 1] = world.y
  out.home[index * 3 + 2] = world.z

  // Fragments start deeper in the room than the text plane and scattered around
  // it, so the copy reads as arriving out of the background, not fading in.
  normal.set(0, 0, 1).applyQuaternion(block.quaternion)
  world.addScaledVector(normal, -scatter * (0.55 + seed * 0.9))
  world.x += (hash(index * 3.31) - 0.5) * chaosRadius * 2
  world.y += (hash(index * 5.77) - 0.5) * chaosRadius
  world.z += (hash(index * 9.13) - 0.5) * chaosRadius

  out.chaos[index * 3] = world.x
  out.chaos[index * 3 + 1] = world.y
  out.chaos[index * 3 + 2] = world.z

  out.quaternion[index * 4] = block.quaternion.x
  out.quaternion[index * 4 + 1] = block.quaternion.y
  out.quaternion[index * 4 + 2] = block.quaternion.z
  out.quaternion[index * 4 + 3] = block.quaternion.w

  axis
    .set(hash(index + 0.13) - 0.5, hash(index + 7.71) - 0.5, hash(index + 19.3) - 0.5)
    .normalize()
  if (!Number.isFinite(axis.x)) axis.set(0, 1, 0)
  out.axis[index * 3] = axis.x
  out.axis[index * 3 + 1] = axis.y
  out.axis[index * 3 + 2] = axis.z

  out.rect[index * 4] = rect[0]
  out.rect[index * 4 + 1] = rect[1]
  out.rect[index * 4 + 2] = rect[2]
  out.rect[index * 4 + 3] = rect[3]

  out.size[index * 3] = width
  out.size[index * 3 + 1] = height
  out.size[index * 3 + 2] = depth

  out.seed[index] = seed
  out.window[index * 4] = block.enter
  out.window[index * 4 + 1] = block.span
  out.window[index * 4 + 2] = block.exit ?? 2
  out.window[index * 4 + 3] = block.exitSpan ?? 0.08
  out.style[index * 3] = block.accent ?? 0
  out.style[index * 3 + 1] = block.weight ?? 1
  out.style[index * 3 + 2] = form

  cursor.index += 1
}

const pushFlatGlyph = (
  out: GlyphInstances,
  cursor: Cursor,
  capacity: number,
  block: TextBlock,
  metric: GlyphMetric,
  quadLeft: number,
  quadTop: number,
) => {
  const [columns, rows] = block.slice ?? [1, 1]
  const cellWidth = (metric.width * block.em) / columns
  const cellHeight = (metric.height * block.em) / rows
  const uSpan = (metric.u1 - metric.u0) / columns
  const vSpan = (metric.v1 - metric.v0) / rows
  const plate = Math.min(cellWidth, cellHeight) * 0.04

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (cursor.index >= capacity) return false
      pushFragment(
        out,
        cursor,
        block,
        quadLeft + cellWidth * (column + 0.5),
        quadTop - cellHeight * (row + 0.5),
        0,
        cellWidth,
        cellHeight,
        Math.max(plate, 0.012),
        [
          metric.u0 + uSpan * column,
          metric.v1 - vSpan * (row + 1),
          metric.u0 + uSpan * (column + 1),
          metric.v1 - vSpan * row,
        ],
        0,
      )
    }
  }
  return true
}

const pushVoxelGlyph = (
  out: GlyphInstances,
  cursor: Cursor,
  capacity: number,
  block: TextBlock,
  atlas: GlyphAtlas,
  metric: GlyphMetric,
  quadLeft: number,
  quadTop: number,
) => {
  const spec = block.voxel ?? { cellEm: 0.1, layers: 3 }
  const threshold = spec.threshold ?? 0.42
  const profile = spec.profile ?? 'stack'
  const { cols, rows } = gridFor(metric, spec.cellEm)
  const cellW = (metric.width * block.em) / cols
  const cellH = (metric.height * block.em) / rows
  const layers = Math.max(1, spec.layers)

  if (profile === 'relief') {
    // One elongated brick per ink cell. Depth scales with coverage so stroke
    // cores push into the room like bay columns; fringe ink stays shallow.
    const face = Math.min(cellW, cellH) * 0.9
    const extrude = spec.extrude ?? 2.6
    const minDepth = face * 0.55
    const maxDepth = face * extrude * Math.max(layers / 3, 1)

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < cols; column++) {
        const uNorm = (column + 0.5) / cols
        const vNorm = (row + 0.5) / rows
        const ink = glyphAlphaAt(atlas, metric, uNorm, vNorm)
        if (ink < threshold) continue
        if (cursor.index >= capacity) return false

        const strength = Math.min(
          1,
          Math.max(0, (ink - threshold) / Math.max(1 - threshold, 0.0001)),
        )
        // Smoothstep so mid-tones don't jump between depths.
        const eased = strength * strength * (3 - 2 * strength)
        const depth = minDepth + (maxDepth - minDepth) * eased
        // Bias the mass behind the text plane — front face stays readable,
        // body reads as structure when the panel is yawed.
        const centreZ = -depth * 0.38
        // Slight XY taper on shallow fringe cells → stepped relief, not a slab.
        const faceScale = 0.82 + eased * 0.18

        pushFragment(
          out,
          cursor,
          block,
          quadLeft + cellW * (column + 0.5),
          quadTop - cellH * (row + 0.5),
          centreZ,
          face * faceScale,
          face * faceScale,
          depth,
          [0, 0, 0, 0],
          1,
        )
      }
    }
    return true
  }

  // Stack — slight inset so facets read as voxels, not a fused blob.
  const edge = Math.min(cellW, cellH) * 0.88
  const layerPitch = edge

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < cols; column++) {
      const uNorm = (column + 0.5) / cols
      const vNorm = (row + 0.5) / rows
      if (glyphAlphaAt(atlas, metric, uNorm, vNorm) < threshold) continue

      for (let layer = 0; layer < layers; layer++) {
        if (cursor.index >= capacity) return false
        const centreZ = (layer - (layers - 1) * 0.5) * layerPitch
        pushFragment(
          out,
          cursor,
          block,
          quadLeft + cellW * (column + 0.5),
          quadTop - cellH * (row + 0.5),
          centreZ,
          edge,
          edge,
          edge,
          [0, 0, 0, 0],
          1,
        )
      }
    }
  }
  return true
}

/**
 * Lays every block out into one shared instance buffer. `budget` caps the total
 * fragment count so a lower tier can drop density without touching the blocks.
 */
export const layoutBlocks = (
  blocks: TextBlock[],
  atlas: GlyphAtlas,
  budget = Infinity,
): GlyphInstances => {
  // Prefer the tier budget as capacity so sparse voxel fill cannot truncate
  // early from a pessimistic full-rectangle estimate. Unbounded layouts still
  // size from the estimate.
  const estimate = countFragments(blocks, atlas)
  const capacity = Number.isFinite(budget)
    ? Math.max(1, Math.min(budget, Math.max(estimate, 1)))
    : Math.max(estimate, 1)
  const out: GlyphInstances = {
    count: 0,
    complete: true,
    chaos: new Float32Array(capacity * 3),
    home: new Float32Array(capacity * 3),
    quaternion: new Float32Array(capacity * 4),
    axis: new Float32Array(capacity * 3),
    rect: new Float32Array(capacity * 4),
    size: new Float32Array(capacity * 3),
    seed: new Float32Array(capacity),
    window: new Float32Array(capacity * 4),
    style: new Float32Array(capacity * 3),
  }

  const cursor: Cursor = {
    index: 0,
    scratch: {
      local: new THREE.Vector3(),
      world: new THREE.Vector3(),
      axis: new THREE.Vector3(),
      normal: new THREE.Vector3(),
    },
  }

  for (const block of blocks) {
    const tracking = block.tracking ?? 0
    const leading = block.leading ?? 1.15
    const lines = wrapLines(block, atlas)

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const baseline = -lineIndex * leading * block.em
      let pen = block.align === 'centre' ? (-line.width / 2) * block.em : 0

      for (const char of line.chars) {
        const metric = atlas.metrics.get(glyphKey(block.role, char))
        if (!metric) continue

        if (metric.width > 0 && metric.height > 0) {
          const quadLeft = pen - metric.bearingX * block.em
          const quadTop = baseline + metric.top * block.em
          const ok =
            block.form === 'voxel'
              ? pushVoxelGlyph(
                  out,
                  cursor,
                  capacity,
                  block,
                  atlas,
                  metric,
                  quadLeft,
                  quadTop,
                )
              : pushFlatGlyph(
                  out,
                  cursor,
                  capacity,
                  block,
                  metric,
                  quadLeft,
                  quadTop,
                )
          if (!ok) {
            out.count = cursor.index
            out.complete = false
            return out
          }
        }

        pen += (metric.advance + tracking) * block.em
      }
    }
  }

  out.count = cursor.index
  return out
}
