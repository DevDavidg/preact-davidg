import * as THREE from 'three'
import { glyphKey, type FontRole, type GlyphAtlas } from './glyphAtlas'

/**
 * Turns declarative text blocks into the flat instance buffers `GlyphField`
 * uploads once. Every letter can be sliced into a grid of sub-quads, so display
 * type is literally built from separate fragments that fly in from the depth of
 * the room and lock into a legible word.
 */

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
  /** Sub-quads per glyph as [columns, rows]. `[1, 1]` keeps letters whole. */
  slice?: [number, number]
  /** Scatter radius of the start position, in world units. */
  chaos?: number
  /** How far behind the plane fragments start, in world units. */
  depth?: number
  /** 0 = ink, 1 = accent. */
  accent?: number
  /** Opacity multiplier. */
  weight?: number
  /** Strength of the wireframe outline drawn around each fragment while loose. */
  frame?: number
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
  size: Float32Array
  seed: Float32Array
  window: Float32Array
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

const pushFragment = (
  out: GlyphInstances,
  cursor: Cursor,
  block: TextBlock,
  centreX: number,
  centreY: number,
  width: number,
  height: number,
  rect: [number, number, number, number],
) => {
  const index = cursor.index
  const { local, world, axis, normal } = cursor.scratch
  const seed = hash(index * 1.7 + block.em * 13.1 + block.enter * 97.3)
  const chaosRadius = block.chaos ?? 4.2
  const depth = block.depth ?? 7

  local.set(centreX, centreY, 0).applyQuaternion(block.quaternion)
  world.copy(block.position).add(local)

  out.home[index * 3] = world.x
  out.home[index * 3 + 1] = world.y
  out.home[index * 3 + 2] = world.z

  // Fragments start deeper in the room than the text plane and scattered around
  // it, so the copy reads as arriving out of the background, not fading in.
  normal.set(0, 0, 1).applyQuaternion(block.quaternion)
  world.addScaledVector(normal, -depth * (0.55 + seed * 0.9))
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

  out.size[index * 2] = width
  out.size[index * 2 + 1] = height

  out.seed[index] = seed
  out.window[index * 4] = block.enter
  out.window[index * 4 + 1] = block.span
  // Past 1 the exit never triggers, since build itself tops out there.
  out.window[index * 4 + 2] = block.exit ?? 2
  out.window[index * 4 + 3] = block.exitSpan ?? 0.08
  out.style[index * 3] = block.accent ?? 0
  out.style[index * 3 + 1] = block.weight ?? 1
  out.style[index * 3 + 2] = block.frame ?? 1

  cursor.index += 1
}

/** Upper bound on instances so buffers can be allocated in one pass. */
const countFragments = (blocks: TextBlock[]) =>
  blocks.reduce((total, block) => {
    const [columns, rows] = block.slice ?? [1, 1]
    const glyphs = Array.from(block.text).filter((char) => char !== ' ').length
    return total + glyphs * columns * rows
  }, 0)

/**
 * Lays every block out into one shared instance buffer. `budget` caps the total
 * fragment count so a lower tier can drop slicing density without touching the
 * block definitions.
 */
export const layoutBlocks = (
  blocks: TextBlock[],
  atlas: GlyphAtlas,
  budget = Infinity,
): GlyphInstances => {
  const needed = countFragments(blocks)
  const capacity = Math.min(needed, budget)
  const out: GlyphInstances = {
    count: 0,
    complete: needed <= budget,
    chaos: new Float32Array(capacity * 3),
    home: new Float32Array(capacity * 3),
    quaternion: new Float32Array(capacity * 4),
    axis: new Float32Array(capacity * 3),
    rect: new Float32Array(capacity * 4),
    size: new Float32Array(capacity * 2),
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
    const [columns, rows] = block.slice ?? [1, 1]
    const lines = wrapLines(block, atlas)

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const baseline = -lineIndex * leading * block.em
      let pen =
        block.align === 'centre' ? (-line.width / 2) * block.em : 0

      for (const char of line.chars) {
        const metric = atlas.metrics.get(glyphKey(block.role, char))
        if (!metric) continue

        if (metric.width > 0 && metric.height > 0) {
          const quadLeft = pen - metric.bearingX * block.em
          const quadTop = baseline + metric.top * block.em
          const cellWidth = (metric.width * block.em) / columns
          const cellHeight = (metric.height * block.em) / rows
          const uSpan = (metric.u1 - metric.u0) / columns
          const vSpan = (metric.v1 - metric.v0) / rows

          for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
              if (cursor.index >= capacity) {
                out.count = cursor.index
                return out
              }
              pushFragment(
                out,
                cursor,
                block,
                quadLeft + cellWidth * (column + 0.5),
                quadTop - cellHeight * (row + 0.5),
                cellWidth,
                cellHeight,
                [
                  metric.u0 + uSpan * column,
                  // Rows run top-down in layout, V runs bottom-up in the atlas.
                  metric.v1 - vSpan * (row + 1),
                  metric.u0 + uSpan * (column + 1),
                  metric.v1 - vSpan * row,
                ],
              )
            }
          }
        }

        pen += (metric.advance + tracking) * block.em
      }
    }
  }

  out.count = cursor.index
  return out
}
