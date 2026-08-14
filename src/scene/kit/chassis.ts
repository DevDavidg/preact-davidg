import * as THREE from 'three'
import { toShards } from '../shardGeometry'

/**
 * Module chassis.
 *
 * Three featured projects used to be the same 16:10 rectangle three times, which
 * made the whole charge chapter one object repeated. Each project now arrives in
 * a housing that says what kind of thing it is before a word is read: a sealed
 * vault, an instrument that quotes numbers, a totem that stacks.
 *
 * Everything here is boxes. That is not a limitation — it is the same machined
 * vocabulary the corridor is already built from, and it means every chassis is a
 * single merged geometry under `ReconstructMaterial`, so a housing costs one
 * draw call and inherits the reconstruction, the law and WIRE mode for free.
 * A downloaded GLTF would cost bytes, a second material language, and a look
 * that belongs to someone else's scene.
 */

export type ChassisKind = 'vault' | 'ledger' | 'totem'

interface Box {
  size: [number, number, number]
  position: [number, number, number]
  /** Longest axis gets the extra segment so shards stay roughly square. */
  segments?: [number, number, number]
}

/**
 * Merges boxes into one sharded buffer.
 *
 * `BufferGeometryUtils.mergeGeometries` lives in three's examples, which is a
 * separate entry point and a dependency this file does not need: boxes are
 * non-indexed after `toNonIndexed` and concatenating three float arrays is the
 * whole operation.
 */
const mergeBoxes = (boxes: Box[]): THREE.BufferGeometry => {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []

  for (const box of boxes) {
    const [width, height, depth] = box.size
    const [sx, sy, sz] = box.segments ?? [1, 1, 1]
    const source = new THREE.BoxGeometry(width, height, depth, sx, sy, sz)
    source.translate(box.position[0], box.position[1], box.position[2])
    const flat = source.toNonIndexed()
    source.dispose()

    const position = flat.getAttribute('position')
    const normal = flat.getAttribute('normal')
    const uv = flat.getAttribute('uv')
    for (let index = 0; index < position.count; index += 1) {
      positions.push(position.getX(index), position.getY(index), position.getZ(index))
      normals.push(normal.getX(index), normal.getY(index), normal.getZ(index))
      uvs.push(uv.getX(index), uv.getY(index))
    }
    flat.dispose()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return toShards(geometry)
}

/**
 * A hatch. Heavy jambs, two hinge lugs down one side, and a lip along the
 * bottom — the shot sits behind it, so opening the seal is what shows the work.
 */
export const vaultChassis = (width: number, height: number) => {
  const jamb = 0.13
  const hw = width / 2 + jamb
  const hh = height / 2 + jamb

  return mergeBoxes([
    { size: [width + jamb * 2, jamb, 0.16], position: [0, hh - jamb / 2, 0], segments: [6, 1, 1] },
    { size: [width + jamb * 2, jamb, 0.16], position: [0, -hh + jamb / 2, 0], segments: [6, 1, 1] },
    { size: [jamb, height + jamb * 2, 0.16], position: [-hw + jamb / 2, 0, 0], segments: [1, 5, 1] },
    { size: [jamb, height + jamb * 2, 0.16], position: [hw - jamb / 2, 0, 0], segments: [1, 5, 1] },
    // Hinge lugs — the side the hatch turns on, so the seal has a reason.
    { size: [0.1, 0.2, 0.26], position: [-hw, hh * 0.5, 0.02] },
    { size: [0.1, 0.2, 0.26], position: [-hw, -hh * 0.5, 0.02] },
  ])
}

/** The seal itself: one bar across the face, retracted as the module locks. */
export const vaultSeal = (width: number) =>
  mergeBoxes([
    { size: [width * 0.94, 0.085, 0.1], position: [0, 0, 0], segments: [8, 1, 1] },
    { size: [0.16, 0.16, 0.14], position: [width * 0.32, 0, 0.02] },
  ])

/** How many quote bars an order-book chassis carries. */
export const LEDGER_BARS = 15

/** One bar of the book. Instanced, so the whole row is a single draw call. */
export const ledgerBar = () => {
  const source = new THREE.BoxGeometry(1, 1, 1, 1, 2, 1)
  const shards = toShards(source)
  source.dispose()
  return shards
}

/** The rail the book sits on, plus a scale mark at each end. */
export const ledgerChassis = (width: number, height: number) =>
  mergeBoxes([
    { size: [width * 1.05, 0.07, 0.18], position: [0, -height / 2 - 0.14, 0], segments: [8, 1, 1] },
    { size: [0.07, height * 0.9, 0.14], position: [-width / 2 - 0.12, 0, 0], segments: [1, 5, 1] },
    { size: [0.05, 0.05, 0.12], position: [-width / 2 - 0.12, height * 0.3, 0.05] },
    { size: [0.05, 0.05, 0.12], position: [-width / 2 - 0.12, 0, 0.05] },
    { size: [0.05, 0.05, 0.12], position: [-width / 2 - 0.12, -height * 0.3, 0.05] },
  ])

/**
 * A stack: five plates on a spine, widest at the base.
 *
 * Every plate is wider than the shot it carries, so what reads on screen is the
 * ends protruding either side — a stack the panel is mounted on. Sized inside
 * the panel's own silhouette they would simply be five bars drawn across the
 * screenshot, which is what the first pass looked like.
 */
export const totemChassis = (width: number, height: number) => {
  const plates: Box[] = []
  const count = 5
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1)
    const plateWidth = width * (1.26 - t * 0.16)
    plates.push({
      size: [plateWidth, 0.075, 0.16],
      position: [0, -height / 2 + t * height, 0],
      segments: [6, 1, 1],
    })
  }

  return mergeBoxes([
    ...plates,
    { size: [0.09, height * 1.06, 0.09], position: [0, 0, -0.06], segments: [1, 8, 1] },
  ])
}
