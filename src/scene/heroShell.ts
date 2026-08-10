/**
 * The first circle, as geometry.
 *
 * Every facet of the shell lives in one buffer. An earlier version gave each
 * shard its own `<mesh>` plus its own `<lineSegments>`, which at cinema detail is
 * 320 facets — 640 draw calls and 640 material uniform uploads per frame for a
 * single object. Here the peel is a vertex-shader displacement instead, so the
 * whole shell is two draw calls and the saved budget goes into fidelity.
 *
 * Each vertex carries the facet it belongs to:
 *   `aCentroid`   where the facet sits on the sphere
 *   `aFaceNormal` the direction it opens along
 *   `aTangent`    a stable axis to tumble around
 *   `aShard`      row into the per-facet state texture (hover / fire)
 *   `aPhase`      deterministic offset for idle breathe
 *   `aRank`       0 at the facet facing the lens → 1 at the limb
 *
 * `aRank` is what makes the shell read as an aperture rather than an explosion:
 * the peel is ordered by how square-on a facet is to the viewer, so the opening
 * irises out from the centre instead of scattering.
 */
import * as THREE from 'three'

/** 2 caps + 3 rim quads. */
export const TRIS_PER_SHARD = 8
const VERTS_PER_SHARD = TRIS_PER_SHARD * 3
/** Two 3-segment rings plus three connectors, as line pairs. */
const WIRE_VERTS_PER_SHARD = 18

/** Facet inset — the seam of shadow between panels that gives the shell depth. */
const FACE_GAP = 0.93
const PANEL_THICKNESS = 0.1

export interface HeroShell {
  faces: THREE.BufferGeometry
  wires: THREE.BufferGeometry
  count: number
  /** Facet centroids in shell space, for the CPU-side hit highlight. */
  centroids: Float32Array
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()
const _ab = new THREE.Vector3()
const _ac = new THREE.Vector3()
const _n = new THREE.Vector3()
const _centroid = new THREE.Vector3()
const _tangent = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _altUp = new THREE.Vector3(1, 0, 0)

const pushVec = (target: number[], x: number, y: number, z: number) => {
  target.push(x, y, z)
}

/**
 * One extruded facet, written in facet-local space (centroid at the origin) so
 * the shader can rotate it about its own centre before placing it.
 */
const writeFacet = (
  positions: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  normal: THREE.Vector3,
) => {
  const half = PANEL_THICKNESS * 0.5
  const outer = [a, b, c].map((p) => p.clone().addScaledVector(normal, half))
  const inner = [a, b, c].map((p) => p.clone().addScaledVector(normal, -half))

  // Outward cap, then the inward cap wound the other way.
  pushVec(positions, outer[0].x, outer[0].y, outer[0].z)
  pushVec(positions, outer[1].x, outer[1].y, outer[1].z)
  pushVec(positions, outer[2].x, outer[2].y, outer[2].z)
  pushVec(positions, inner[2].x, inner[2].y, inner[2].z)
  pushVec(positions, inner[1].x, inner[1].y, inner[1].z)
  pushVec(positions, inner[0].x, inner[0].y, inner[0].z)

  for (let edge = 0; edge < 3; edge++) {
    const next = (edge + 1) % 3
    const o0 = outer[edge]
    const o1 = outer[next]
    const i0 = inner[edge]
    const i1 = inner[next]
    pushVec(positions, o0.x, o0.y, o0.z)
    pushVec(positions, i0.x, i0.y, i0.z)
    pushVec(positions, i1.x, i1.y, i1.z)
    pushVec(positions, o0.x, o0.y, o0.z)
    pushVec(positions, i1.x, i1.y, i1.z)
    pushVec(positions, o1.x, o1.y, o1.z)
  }
}

/** The wire cage for one facet: outer ring, inner ring, three risers. */
const writeFacetWire = (
  positions: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  normal: THREE.Vector3,
) => {
  const half = PANEL_THICKNESS * 0.5
  const outer = [a, b, c].map((p) => p.clone().addScaledVector(normal, half))
  const inner = [a, b, c].map((p) => p.clone().addScaledVector(normal, -half))

  const ring = (points: THREE.Vector3[]) => {
    for (let index = 0; index < 3; index++) {
      const from = points[index]
      const to = points[(index + 1) % 3]
      pushVec(positions, from.x, from.y, from.z)
      pushVec(positions, to.x, to.y, to.z)
    }
  }
  ring(outer)
  ring(inner)
  for (let index = 0; index < 3; index++) {
    pushVec(positions, outer[index].x, outer[index].y, outer[index].z)
    pushVec(positions, inner[index].x, inner[index].y, inner[index].z)
  }
}

/**
 * Builds the merged shell.
 *
 * `viewDir` points from the shell toward the opening camera position; it sets
 * the iris order, so the facet the visitor is looking straight at is the first
 * one to let light through.
 */
export const buildHeroShell = (
  radius: number,
  detail: number,
  viewDir: THREE.Vector3,
): HeroShell => {
  const source = new THREE.IcosahedronGeometry(radius, detail)
  const nonIndexed = source.index ? source.toNonIndexed() : source
  const position = nonIndexed.getAttribute('position')
  const count = Math.floor(position.count / 3)

  const facePositions: number[] = []
  const wirePositions: number[] = []
  const centroids = new Float32Array(count * 3)

  const faceCentroid = new Float32Array(count * VERTS_PER_SHARD * 3)
  const faceNormal = new Float32Array(count * VERTS_PER_SHARD * 3)
  const faceTangent = new Float32Array(count * VERTS_PER_SHARD * 3)
  const faceShard = new Float32Array(count * VERTS_PER_SHARD)
  const facePhase = new Float32Array(count * VERTS_PER_SHARD)
  const faceRank = new Float32Array(count * VERTS_PER_SHARD)

  const wireCentroid = new Float32Array(count * WIRE_VERTS_PER_SHARD * 3)
  const wireNormal = new Float32Array(count * WIRE_VERTS_PER_SHARD * 3)
  const wireTangent = new Float32Array(count * WIRE_VERTS_PER_SHARD * 3)
  const wireShard = new Float32Array(count * WIRE_VERTS_PER_SHARD)
  const wirePhase = new Float32Array(count * WIRE_VERTS_PER_SHARD)
  const wireRank = new Float32Array(count * WIRE_VERTS_PER_SHARD)

  const forward = viewDir.clone().normalize()

  for (let index = 0; index < count; index++) {
    const first = index * 3
    _a.fromBufferAttribute(position, first)
    _b.fromBufferAttribute(position, first + 1)
    _c.fromBufferAttribute(position, first + 2)

    _centroid
      .addVectors(_a, _b)
      .add(_c)
      .multiplyScalar(1 / 3)

    _ab.subVectors(_b, _a)
    _ac.subVectors(_c, _a)
    _n.crossVectors(_ab, _ac).normalize()
    if (_n.dot(_centroid) < 0) _n.negate()

    // A stable tumble axis in the plane of the facet.
    const reference = Math.abs(_n.dot(_up)) > 0.92 ? _altUp : _up
    _tangent.crossVectors(_n, reference).normalize()

    // Facet-local vertices, pulled in by FACE_GAP to leave a seam.
    const localA = _a.clone().multiplyScalar(FACE_GAP).sub(_centroid)
    const localB = _b.clone().multiplyScalar(FACE_GAP).sub(_centroid)
    const localC = _c.clone().multiplyScalar(FACE_GAP).sub(_centroid)

    writeFacet(facePositions, localA, localB, localC, _n)
    writeFacetWire(wirePositions, localA, localB, localC, _n)

    centroids[index * 3] = _centroid.x
    centroids[index * 3 + 1] = _centroid.y
    centroids[index * 3 + 2] = _centroid.z

    const phase = (index * 2.399963) % (Math.PI * 2)
    // Square-on to the lens → 0, at the limb → 1.
    const rank = (1 - _n.dot(forward)) * 0.5

    const fill = (
      centroidOut: Float32Array,
      normalOut: Float32Array,
      tangentOut: Float32Array,
      shardOut: Float32Array,
      phaseOut: Float32Array,
      rankOut: Float32Array,
      verts: number,
    ) => {
      for (let vertex = 0; vertex < verts; vertex++) {
        const slot = index * verts + vertex
        centroidOut[slot * 3] = _centroid.x
        centroidOut[slot * 3 + 1] = _centroid.y
        centroidOut[slot * 3 + 2] = _centroid.z
        normalOut[slot * 3] = _n.x
        normalOut[slot * 3 + 1] = _n.y
        normalOut[slot * 3 + 2] = _n.z
        tangentOut[slot * 3] = _tangent.x
        tangentOut[slot * 3 + 1] = _tangent.y
        tangentOut[slot * 3 + 2] = _tangent.z
        shardOut[slot] = index
        phaseOut[slot] = phase
        rankOut[slot] = rank
      }
    }

    fill(
      faceCentroid,
      faceNormal,
      faceTangent,
      faceShard,
      facePhase,
      faceRank,
      VERTS_PER_SHARD,
    )
    fill(
      wireCentroid,
      wireNormal,
      wireTangent,
      wireShard,
      wirePhase,
      wireRank,
      WIRE_VERTS_PER_SHARD,
    )
  }

  source.dispose()
  if (nonIndexed !== source) nonIndexed.dispose()

  const faces = new THREE.BufferGeometry()
  faces.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(facePositions, 3),
  )
  faces.setAttribute('aCentroid', new THREE.BufferAttribute(faceCentroid, 3))
  faces.setAttribute('aFaceNormal', new THREE.BufferAttribute(faceNormal, 3))
  faces.setAttribute('aTangent', new THREE.BufferAttribute(faceTangent, 3))
  faces.setAttribute('aShard', new THREE.BufferAttribute(faceShard, 1))
  faces.setAttribute('aPhase', new THREE.BufferAttribute(facePhase, 1))
  faces.setAttribute('aRank', new THREE.BufferAttribute(faceRank, 1))
  // Non-indexed: this yields one normal per triangle, i.e. true flat shading.
  faces.computeVertexNormals()
  // The shell displaces far past its rest pose; a rest-pose sphere would cull it.
  faces.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 8)

  const wires = new THREE.BufferGeometry()
  wires.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(wirePositions, 3),
  )
  wires.setAttribute('aCentroid', new THREE.BufferAttribute(wireCentroid, 3))
  wires.setAttribute('aFaceNormal', new THREE.BufferAttribute(wireNormal, 3))
  wires.setAttribute('aTangent', new THREE.BufferAttribute(wireTangent, 3))
  wires.setAttribute('aShard', new THREE.BufferAttribute(wireShard, 1))
  wires.setAttribute('aPhase', new THREE.BufferAttribute(wirePhase, 1))
  wires.setAttribute('aRank', new THREE.BufferAttribute(wireRank, 1))
  wires.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 8)

  return { faces, wires, count, centroids }
}
