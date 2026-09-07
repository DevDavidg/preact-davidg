import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import { toShards } from './shardGeometry'
import type { Quality } from './capability'
import { liveFor, sceneState } from './sceneState'

/**
 * Corridor architecture — posts, rails, braces, and overhead ties outside the
 * reading cone. Assembles as a wave down the dolly so the room never feels empty.
 */

type PartKind = 'post' | 'rail' | 'brace' | 'tie' | 'plinth'

interface Part {
  kind: PartKind
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  seed: number
}

const SIDE = 3.85
const Z_START = 9.2
const Z_END = -22
const BAYS = 11

const buildParts = (rich: boolean): Part[] => {
  const parts: Part[] = []
  const bayCount = rich ? BAYS : 7

  for (let bay = 0; bay < bayCount; bay++) {
    const t = bay / Math.max(bayCount - 1, 1)
    const z = THREE.MathUtils.lerp(Z_START, Z_END, t)
    const seed = t * 0.55
    const height = 2.6 + (bay % 3) * 0.45
    const nextZ =
      bay < bayCount - 1
        ? THREE.MathUtils.lerp(Z_START, Z_END, (bay + 1) / Math.max(bayCount - 1, 1))
        : z - 2.8
    const span = Math.abs(z - nextZ)

    for (const side of [-1, 1] as const) {
      const x = side * SIDE
      // Vertical post
      parts.push({
        kind: 'post',
        position: new THREE.Vector3(x, height / 2, z),
        rotation: new THREE.Euler(0, side > 0 ? -0.04 : 0.04, 0),
        scale: new THREE.Vector3(1, height, 1),
        seed: seed + (side > 0 ? 0.02 : 0),
      })
      // Plinth foot
      parts.push({
        kind: 'plinth',
        position: new THREE.Vector3(x, 0.08, z),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1.6, 1, 1.6),
        seed: seed + 0.03,
      })
      // Mid rail toward next bay
      if (bay < bayCount - 1) {
        parts.push({
          kind: 'rail',
          position: new THREE.Vector3(x, 1.15, (z + nextZ) / 2),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(1, 1, span * 0.92),
          seed: seed + 0.05,
        })
        parts.push({
          kind: 'rail',
          position: new THREE.Vector3(x, height - 0.25, (z + nextZ) / 2),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(0.85, 1, span * 0.92),
          seed: seed + 0.07,
        })
      }
      // Diagonal brace
      if (rich && bay % 2 === 0 && bay < bayCount - 1) {
        parts.push({
          kind: 'brace',
          position: new THREE.Vector3(x, height * 0.45, (z + nextZ) / 2),
          rotation: new THREE.Euler(side > 0 ? 0.55 : -0.55, 0, 0),
          scale: new THREE.Vector3(0.7, 1, span * 1.05),
          seed: seed + 0.09,
        })
      }
    }

    // Overhead cross tie every other bay
    if (bay % 2 === 1) {
      parts.push({
        kind: 'tie',
        position: new THREE.Vector3(0, height + 0.15, z),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(SIDE * 2.05, 1, 1),
        seed: seed + 0.11,
      })
    }
  }

  return parts
}

const GEO_SPECS: Record<PartKind, () => THREE.BufferGeometry> = {
  post: () => toShards(new THREE.BoxGeometry(0.14, 1, 0.14, 1, 5, 1)),
  rail: () => toShards(new THREE.BoxGeometry(0.07, 0.07, 1, 1, 1, 4)),
  brace: () => toShards(new THREE.BoxGeometry(0.05, 0.05, 1, 1, 1, 3)),
  tie: () => toShards(new THREE.BoxGeometry(1, 0.1, 0.12, 6, 1, 1)),
  plinth: () => toShards(new THREE.BoxGeometry(0.28, 0.1, 0.28, 1, 1, 1)),
}

export const Lattice = ({ quality }: { quality: Quality }) => {
  const rich = quality === 'cinema'
  const parts = useMemo(() => buildParts(rich), [rich])
  const scratch = useMemo(() => ({ dummy: new THREE.Object3D() }), [])

  const geos = useMemo(() => {
    const map = {} as Record<PartKind, THREE.BufferGeometry>
    ;(Object.keys(GEO_SPECS) as PartKind[]).forEach((kind) => {
      map[kind] = GEO_SPECS[kind]()
    })
    return map
  }, [])

  const material = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0.35,
        jitter: 0.08,
        opacity: 0.32,
        drift: false,
        depthSpan: 0.08,
      }),
    [],
  )

  const groups = useMemo(() => {
    const byKind: Record<PartKind, Part[]> = {
      post: [],
      rail: [],
      brace: [],
      tie: [],
      plinth: [],
    }
    for (const part of parts) byKind[part.kind].push(part)
    return byKind
  }, [parts])

  const refs = useRef<Partial<Record<PartKind, THREE.InstancedMesh>>>({})
  const root = useRef<THREE.Group>(null)
  /** Last build the instance matrices were written for; NaN forces a first pass. */
  const written = useRef(Number.NaN)
  /**
   * The five part kinds, once.
   *
   * `Object.keys(groups)` inside the frame loop allocated a fresh five-element
   * array and a closure every frame for a set that is fixed at module scope.
   */
  const kinds = useMemo(
    () => (Object.keys(groups) as PartKind[]).filter((k) => groups[k].length),
    [groups],
  )

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose())
      material.dispose()
    },
    [geos, material],
  )

  useFrame((state) => {
    const build = sceneState.build
    const live = liveFor(build)
    const time = state.clock.elapsedTime
    const { dummy } = scratch
    const corridorPresence = THREE.MathUtils.smoothstep(build, 0.15, 0.28)

    /*
     * Absent below the entry ramp, for the same reason as the colonnade: the
     * shard material discards on alpha far too late to save the fill, so an
     * opacity of zero still shades five instanced meshes' worth of double-sided
     * transparent triangles through the whole opening shot.
     */
    const shown = corridorPresence > 0.002
    if (root.current) root.current.visible = shown
    if (!shown) return

    /*
     * The matrices are only moving while something is still loose.
     *
     * Every instance's transform is a function of `build` alone, except for the
     * `sin(time …) * loose` bob — and `loose` is zero for every part once
     * `build` clears the largest stagger plus its ramp, at 0.82. Past that the
     * loop was recomposing a hundred identical matrices and re-uploading five
     * instance buffers every frame, for the whole middle of the corridor and for
     * as long as the visitor stood still. Rewriting only when the scroll has
     * actually moved, or while something is genuinely animating, leaves the
     * result bit-identical.
     */
    const animating = build < 0.83
    if (animating || build !== written.current) {
    written.current = build
    kinds.forEach((kind) => {
      const mesh = refs.current[kind]
      const list = groups[kind]
      if (!mesh || list.length === 0) return

      for (let i = 0; i < list.length; i++) {
        const entry = list[i]
        const stagger = Math.min(entry.seed, 0.5)
        const assembled = THREE.MathUtils.smoothstep(
          build,
          stagger,
          stagger + 0.32,
        )
        const loose = 1 - assembled
        const endHold = 1 - THREE.MathUtils.smoothstep(build, 0.92, 1) * 0.12

        dummy.position.copy(entry.position)
        dummy.position.y +=
          Math.sin(time * 0.3 + entry.seed * 8) * 0.03 * loose
        dummy.rotation.copy(entry.rotation)
        dummy.rotation.z += loose * entry.seed * 0.12
        dummy.scale.set(
          entry.scale.x * (0.55 + assembled * 0.45) * endHold,
          entry.scale.y * (0.45 + assembled * 0.55) * endHold,
          entry.scale.z * (0.55 + assembled * 0.45) * endHold,
        )
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.count = list.length
    })
    }

    material.sync({
      build,
      live,
      focus: 0.08 + live * 0.2,
      time,
      velocity: sceneState.velocity,
    })
    /*
     * A ghost while the room stands — a lattice at 0.3 opacity has no business
     * cutting holes in the consoles behind it. But once the swallow begins the
     * lattice must occlude: `sync` keeps writers off under WIRE, and the lensing
     * pass only spares depth-written geometry. Without an explicit true here the
     * hole paints over wires that are still in front of it.
     */
    material.depthWrite = sceneState.swallow >= 0.12
    // The opening is a dedicated product shot; corridor architecture enters after it.
    material.uniforms.uOpacity.value =
      (0.26 + live * 0.14) * corridorPresence * (rich ? 1.15 : 1)
    // CPU-placed, so `drift` is pinned to 0 by construction; the law still gets
    // to breathe the lattice, which is what keeps CHAOS from stopping at the
    // objects the visitor happens to be looking at. Cinema gets a touch more
    // spread/jitter — the same density boost the bays get.
    material.setShape({
      spread: rich ? 0.16 : 0.12,
      jitter: rich ? 0.06 : 0.04,
    })
  })

  return (
    <group ref={root}>
      {kinds.map((kind) => {
        const count = groups[kind].length
        return (
          <instancedMesh
            key={kind}
            ref={(node) => {
              if (node) refs.current[kind] = node
            }}
            args={[geos[kind], material, count]}
            frustumCulled={false}
          />
        )
      })}
    </group>
  )
}
