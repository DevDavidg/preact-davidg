import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import { toShards } from './shardGeometry'
import {
  buildFor,
  depthBiasFor,
  liveFor,
  sceneState,
  speedFor,
  type Tier,
} from './sceneState'
import { settleAt, STAGGER_CAP } from './ui/fragmentSettle'

interface Fragment {
  chaos: THREE.Vector3
  home: THREE.Vector3
  tumble: THREE.Euler
  settled: THREE.Euler
  seed: number
  size: number
}

/**
 * Raw material for the room: fragments start scattered and tumbling, then snap
 * onto an ordered lattice as the build progresses. Same wire→solid→lit signature
 * as the artifacts, one scale down, so the whole space participates.
 */
const buildFragments = (count: number): Fragment[] => {
  const columns = 8
  const rows = Math.ceil(count / columns)
  /** Fragments keep out of the middle lane, where panels and copy sit. */
  const CLEARANCE = 3.7

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const lane = column - (columns - 1) / 2
    const side = lane < 0 ? -1 : 1

    return {
      // Chaos starts deep and already biased to the walls: flying through the
      // centre lane would paint over the artifact panels as they assemble.
      chaos: new THREE.Vector3(
        side * (2.2 + Math.random() * 5.5),
        Math.random() * 8 - 1.2,
        -13 - Math.random() * 17,
      ),
      home: new THREE.Vector3(
        side * (CLEARANCE + Math.abs(lane) * 1.9),
        0.15 + (row % 3) * 1.55,
        7.5 - (row / rows) * 24,
      ),
      tumble: new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ),
      settled: new THREE.Euler(0, lane * 0.12, 0),
      seed: Math.random(),
      size: 0.55 + Math.random() * 0.7,
    }
  })
}

export const Lattice = ({ tier }: { tier: Tier }) => {
  const count = tier === 'cinema' ? 154 : 63
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const fragments = useMemo(() => buildFragments(count), [count])
  const scratch = useMemo(
    () => ({ dummy: new THREE.Object3D(), position: new THREE.Vector3() }),
    [],
  )

  // CPU flies each instance chaos→home; the material stages wire→solid→lit
  // without a second drift pass (would fight the lattice paths).
  const geometry = useMemo(() => {
    const source = new THREE.OctahedronGeometry(0.1, 0)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [])
  const material = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0,
        jitter: 0,
        opacity: 0.32,
        drift: false,
        depthSpan: 0.1,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const build = buildFor(tier)
    const live = liveFor(build)
    const time = state.clock.elapsedTime
    const speed = speedFor()
    const { dummy, position } = scratch
    // Cinema SCANNING: the room idles before the first scroll — drift, lean
    // toward the pointer, and a touch more presence so wireframe reads as space.
    const scanning =
      tier === 'cinema'
        ? 1 - THREE.MathUtils.smoothstep(build, 0.02, 0.18)
        : 0
    // Leave the project lane visually quiet while panels are assembling. This
    // affects only backdrop drift/opacity; it never pauses the reconstruction.
    // Hold through most of Work — ending at ~0.52 let the swarm re-cover shots.
    const workQuiet = THREE.MathUtils.smoothstep(build, 0.14, 0.22) *
      (1 - THREE.MathUtils.smoothstep(build, 0.48, 0.58))
    const backgroundMotion = 1 - workQuiet * 0.72
    const motionTime = time * backgroundMotion

    for (let index = 0; index < fragments.length; index++) {
      const fragment = fragments[index]
      // Matches ReconstructMaterial: seed + depth wave, settled by BEAUTY.
      const stagger = Math.min(
        fragment.seed * 0.3 + depthBiasFor(fragment.home.z),
        STAGGER_CAP,
      )
      const settled = settleAt(build, stagger)
      const loose = 1 - settled
      const idle = loose * (1 + scanning * 0.55)

      position.lerpVectors(fragment.chaos, fragment.home, settled)
      position.y +=
        Math.sin(time * 0.4 + fragment.seed * 8) *
        0.18 *
        idle *
        (1 + speed * 0.55) *
        backgroundMotion
      if (scanning > 0.001) {
        position.x +=
          sceneState.pointerX * scanning * (0.08 + fragment.seed * 0.08)
        position.y +=
          Math.sin(time * 0.62 + fragment.seed * 11) * 0.07 * scanning
        position.z +=
          Math.sin(time * 0.28 + fragment.seed * 6) * 0.06 * scanning
      }
      dummy.position.copy(position)

      const spin = 1 + (speed * 0.7 + scanning * 0.22) * backgroundMotion
      dummy.rotation.set(
        THREE.MathUtils.lerp(fragment.tumble.x, fragment.settled.x, settled) +
          motionTime * 0.25 * idle * spin,
        THREE.MathUtils.lerp(fragment.tumble.y, fragment.settled.y, settled) +
          motionTime * 0.3 * idle * spin,
        THREE.MathUtils.lerp(fragment.tumble.z, fragment.settled.z, settled),
      )
      dummy.scale.setScalar(
        fragment.size * (0.45 + settled * 0.55) * (1 + scanning * 0.04),
      )
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true

    material.sync({
      build,
      live,
      focus: 0,
      time,
      velocity: sceneState.velocity,
    })
    // Backdrop only — never occlude corridor copy. Dim harder in SCANNING so
    // the hero voxel name keeps silhouette against the wire noise.
    material.depthWrite = false
    material.uniforms.uOpacity.value =
      (0.08 + (1 - build) * 0.08 + live * 0.08 + scanning * 0.015) *
      (1 - workQuiet * 0.92)
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  )
}
