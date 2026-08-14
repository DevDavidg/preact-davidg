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

    ;(Object.keys(groups) as PartKind[]).forEach((kind) => {
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

    material.sync({
      build,
      live,
      focus: 0.08 + live * 0.2,
      time,
      velocity: sceneState.velocity,
    })
    material.depthWrite = false
    // The opening is a dedicated product shot; corridor architecture enters after it.
    material.uniforms.uOpacity.value = (0.26 + live * 0.14) * corridorPresence
    // CPU-placed, so `drift` is pinned to 0 by construction; the law still gets
    // to breathe the lattice, which is what keeps CHAOS from stopping at the
    // objects the visitor happens to be looking at.
    material.setShape({ spread: 0.12, jitter: 0.04 })
  })

  return (
    <group>
      {(Object.keys(groups) as PartKind[]).map((kind) => {
        const count = groups[kind].length
        if (count === 0) return null
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
