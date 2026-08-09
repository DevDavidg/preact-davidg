import * as THREE from 'three'
import { toShards } from '../shardGeometry'

/**
 * Low-poly panel primitives: bevelled plates and open frames that read as
 * machined parts under ReconstructMaterial's barycentric wireframe.
 */

const pushQuad = (
  positions: number[],
  normals: number[],
  uvs: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
  normal: THREE.Vector3,
  u0 = 0,
  v0 = 0,
  u1 = 1,
  v1 = 1,
) => {
  const verts = [a, b, c, a, c, d]
  const uv = [
    [u0, v0],
    [u1, v0],
    [u1, v1],
    [u0, v0],
    [u1, v1],
    [u0, v1],
  ]
  for (let i = 0; i < 6; i++) {
    positions.push(verts[i].x, verts[i].y, verts[i].z)
    normals.push(normal.x, normal.y, normal.z)
    uvs.push(uv[i][0], uv[i][1])
  }
}

/**
 * A faceted bevelled plate centred at origin, facing +Z.
 * Face sits at z = depth/2; back at z = -depth/2.
 */
export const bevelPlate = (
  width: number,
  height: number,
  depth = 0.08,
  bevel = 0.04,
): THREE.BufferGeometry => {
  const hw = width / 2
  const hh = height / 2
  const b = Math.min(bevel, hw * 0.35, hh * 0.35)
  const hz = depth / 2
  const innerZ = hz - b * 0.55

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []

  // Outer face corners (inset by bevel)
  const fTL = new THREE.Vector3(-hw + b, hh - b, hz)
  const fTR = new THREE.Vector3(hw - b, hh - b, hz)
  const fBR = new THREE.Vector3(hw - b, -hh + b, hz)
  const fBL = new THREE.Vector3(-hw + b, -hh + b, hz)

  // Outer rim at back of bevel (full size)
  const oTL = new THREE.Vector3(-hw, hh, innerZ)
  const oTR = new THREE.Vector3(hw, hh, innerZ)
  const oBR = new THREE.Vector3(hw, -hh, innerZ)
  const oBL = new THREE.Vector3(-hw, -hh, innerZ)

  // Back face
  const bTL = new THREE.Vector3(-hw, hh, -hz)
  const bTR = new THREE.Vector3(hw, hh, -hz)
  const bBR = new THREE.Vector3(hw, -hh, -hz)
  const bBL = new THREE.Vector3(-hw, -hh, -hz)

  const front = new THREE.Vector3(0, 0, 1)
  const back = new THREE.Vector3(0, 0, -1)
  const top = new THREE.Vector3(0, 1, 0)
  const bottom = new THREE.Vector3(0, -1, 0)
  const left = new THREE.Vector3(-1, 0, 0)
  const right = new THREE.Vector3(1, 0, 0)

  // Face
  pushQuad(positions, normals, uvs, fBL, fBR, fTR, fTL, front)

  // Bevel bands (faceted ramps)
  const bevelN = (ax: number, ay: number) =>
    new THREE.Vector3(ax, ay, 0.55).normalize()

  pushQuad(positions, normals, uvs, fTL, fTR, oTR, oTL, bevelN(0, 1))
  pushQuad(positions, normals, uvs, fBR, fBL, oBL, oBR, bevelN(0, -1))
  pushQuad(positions, normals, uvs, fBL, fTL, oTL, oBL, bevelN(-1, 0))
  pushQuad(positions, normals, uvs, fTR, fBR, oBR, oTR, bevelN(1, 0))

  // Side walls from bevel rim to back
  pushQuad(positions, normals, uvs, oTL, oTR, bTR, bTL, top)
  pushQuad(positions, normals, uvs, oBR, oBL, bBL, bBR, bottom)
  pushQuad(positions, normals, uvs, oBL, oTL, bTL, bBL, left)
  pushQuad(positions, normals, uvs, oTR, oBR, bBR, bTR, right)

  // Back
  pushQuad(positions, normals, uvs, bBR, bBL, bTL, bTR, back)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return toShards(geometry)
}

/**
 * Open rectangular frame (hollow carcase) in the XY plane, extruded on Z.
 * Outer size = width × height; inner opening = outer − 2×thickness.
 */
export const openFrame = (
  width: number,
  height: number,
  thickness = 0.08,
  depth = 0.1,
): THREE.BufferGeometry => {
  const hw = width / 2
  const hh = height / 2
  const t = Math.min(thickness, hw * 0.4, hh * 0.4)
  const hz = depth / 2

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []

  // Four bars as boxes: top, bottom, left, right (inner edges meet without double-fill).
  const bars: Array<[number, number, number, number]> = [
    // x0, x1, y0, y1
    [-hw, hw, hh - t, hh],
    [-hw, hw, -hh, -hh + t],
    [-hw, -hw + t, -hh + t, hh - t],
    [hw - t, hw, -hh + t, hh - t],
  ]

  for (const [x0, x1, y0, y1] of bars) {
    const a = new THREE.Vector3(x0, y0, hz)
    const b = new THREE.Vector3(x1, y0, hz)
    const c = new THREE.Vector3(x1, y1, hz)
    const d = new THREE.Vector3(x0, y1, hz)
    const aB = new THREE.Vector3(x0, y0, -hz)
    const bB = new THREE.Vector3(x1, y0, -hz)
    const cB = new THREE.Vector3(x1, y1, -hz)
    const dB = new THREE.Vector3(x0, y1, -hz)

    pushQuad(positions, normals, uvs, a, b, c, d, new THREE.Vector3(0, 0, 1))
    pushQuad(positions, normals, uvs, bB, aB, dB, cB, new THREE.Vector3(0, 0, -1))
    pushQuad(
      positions,
      normals,
      uvs,
      aB,
      bB,
      b,
      a,
      new THREE.Vector3(0, -1, 0),
    )
    pushQuad(
      positions,
      normals,
      uvs,
      d,
      c,
      cB,
      dB,
      new THREE.Vector3(0, 1, 0),
    )
    pushQuad(
      positions,
      normals,
      uvs,
      aB,
      a,
      d,
      dB,
      new THREE.Vector3(-1, 0, 0),
    )
    pushQuad(
      positions,
      normals,
      uvs,
      b,
      bB,
      cB,
      c,
      new THREE.Vector3(1, 0, 0),
    )
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return toShards(geometry)
}

/** A structural rib / strut as a thin bevelled box. */
export const rib = (
  length: number,
  thickness = 0.12,
  depth = 0.12,
): THREE.BufferGeometry => {
  const source = new THREE.BoxGeometry(thickness, length, depth, 1, Math.max(2, Math.round(length * 2)), 1)
  const shards = toShards(source)
  source.dispose()
  return shards
}
