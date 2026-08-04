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
  /** Fragments keep out of the middle lane, where the overlay copy sits. */
  const CLEARANCE = 3.1

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const lane = column - (columns - 1) / 2
    const side = lane < 0 ? -1 : 1

    return {
      chaos: new THREE.Vector3(
        side * (CLEARANCE + Math.random() * 9),
        Math.random() * 8 - 1,
        8 - Math.random() * 28,
      ),
      home: new THREE.Vector3(
        side * (CLEARANCE + Math.abs(lane) * 1.9),
        0.3 + (row % 3) * 1.45,
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

    for (let index = 0; index < fragments.length; index++) {
      const fragment = fragments[index]
      // Matches ReconstructMaterial: seed + depth wave, settled by BEAUTY.
      const stagger = Math.min(
        fragment.seed * 0.3 + depthBiasFor(fragment.home.z),
        0.42,
      )
      const raw = THREE.MathUtils.clamp((build - stagger) / 0.36, 0, 1)
      const settled = raw * raw * (3 - 2 * raw)
      const loose = 1 - settled

      position.lerpVectors(fragment.chaos, fragment.home, settled)
      position.y +=
        Math.sin(time * 0.4 + fragment.seed * 8) * 0.18 * loose * (1 + speed * 0.55)
      dummy.position.copy(position)

      const spin = 1 + speed * 0.7
      dummy.rotation.set(
        THREE.MathUtils.lerp(fragment.tumble.x, fragment.settled.x, settled) +
          time * 0.25 * loose * spin,
        THREE.MathUtils.lerp(fragment.tumble.y, fragment.settled.y, settled) +
          time * 0.3 * loose * spin,
        THREE.MathUtils.lerp(fragment.tumble.z, fragment.settled.z, settled),
      )
      dummy.scale.setScalar(fragment.size * (0.45 + settled * 0.55))
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
    // Backdrop only — never occlude the corridor copy with lattice faces.
    material.depthWrite = false
    // Lattice stays a whisper under the copy; live only lifts it slightly.
    material.uniforms.uOpacity.value = 0.14 + (1 - build) * 0.12 + live * 0.1
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  )
}
