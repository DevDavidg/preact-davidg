import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneColors } from './sceneColors'
import { buildFor, liveFor, type Tier } from './sceneState'

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
 * onto an ordered lattice as the build progresses. Same idea as the artifacts,
 * one scale down, so the whole space participates in the reconstruction.
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

  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.1, 0), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: sceneColors.ink.clone(),
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
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
    const { dummy, position } = scratch

    for (let index = 0; index < fragments.length; index++) {
      const fragment = fragments[index]
      // Matches the artifact shader: everything is in place by the BEAUTY phase.
      const stagger = fragment.seed * 0.42
      const raw = THREE.MathUtils.clamp((build - stagger) / 0.36, 0, 1)
      const settled = raw * raw * (3 - 2 * raw)
      const loose = 1 - settled

      position.lerpVectors(fragment.chaos, fragment.home, settled)
      position.y += Math.sin(time * 0.4 + fragment.seed * 8) * 0.18 * loose
      dummy.position.copy(position)

      dummy.rotation.set(
        THREE.MathUtils.lerp(fragment.tumble.x, fragment.settled.x, settled) +
          time * 0.25 * loose,
        THREE.MathUtils.lerp(fragment.tumble.y, fragment.settled.y, settled) +
          time * 0.3 * loose,
        THREE.MathUtils.lerp(fragment.tumble.z, fragment.settled.z, settled),
      )
      dummy.scale.setScalar(fragment.size * (0.45 + settled * 0.55))
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    material.color.copy(sceneColors.ink).lerp(sceneColors.accent, live * 0.6)
    material.opacity = 0.1 + (1 - build) * 0.16 + live * 0.1
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  )
}
