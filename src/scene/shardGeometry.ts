import * as THREE from 'three'

/** Deterministic hash so a shard keeps the same seed across reloads. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123
  return x - Math.floor(x)
}

/**
 * Splits a geometry into free-standing triangles and tags each one with what the
 * reconstruction shader needs:
 *
 * - `aBary`   barycentric coords, for a wireframe of constant screen-space width
 * - `aCenter` the triangle centroid, which the shard rotates around and drifts from
 * - `aAxis`   a stable random spin axis
 * - `aSeed`   a stable random value, used to stagger when the shard locks in
 *
 * The result is cached on the source geometry so repeated mounts are free.
 */
export const toShards = (source: THREE.BufferGeometry): THREE.BufferGeometry => {
  const geometry = source.index ? source.toNonIndexed() : source.clone()
  const position = geometry.getAttribute('position')
  const vertexCount = position.count
  const triangleCount = Math.floor(vertexCount / 3)

  const bary = new Float32Array(vertexCount * 3)
  const center = new Float32Array(vertexCount * 3)
  const axis = new Float32Array(vertexCount * 3)
  const seed = new Float32Array(vertexCount)

  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const first = triangle * 3

    let cx = 0
    let cy = 0
    let cz = 0
    for (let corner = 0; corner < 3; corner++) {
      cx += position.getX(first + corner)
      cy += position.getY(first + corner)
      cz += position.getZ(first + corner)
    }
    cx /= 3
    cy /= 3
    cz /= 3

    const spin = new THREE.Vector3(
      hash(triangle + 0.13) - 0.5,
      hash(triangle + 7.71) - 0.5,
      hash(triangle + 19.3) - 0.5,
    )
    if (spin.lengthSq() < 1e-6) spin.set(0, 1, 0)
    spin.normalize()

    const shardSeed = hash(triangle * 1.31 + 4.2)

    for (let corner = 0; corner < 3; corner++) {
      const vertex = first + corner
      // Zero-filled array + a single 1 gives (1,0,0) / (0,1,0) / (0,0,1).
      bary[vertex * 3 + corner] = 1
      center[vertex * 3] = cx
      center[vertex * 3 + 1] = cy
      center[vertex * 3 + 2] = cz
      axis[vertex * 3] = spin.x
      axis[vertex * 3 + 1] = spin.y
      axis[vertex * 3 + 2] = spin.z
      seed[vertex] = shardSeed
    }
  }

  geometry.setAttribute('aBary', new THREE.BufferAttribute(bary, 3))
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(center, 3))
  geometry.setAttribute('aAxis', new THREE.BufferAttribute(axis, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))

  return geometry
}
