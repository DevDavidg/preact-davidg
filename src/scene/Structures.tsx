import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import { toShards } from './shardGeometry'
import { buildFor, liveFor, type Tier } from './sceneState'

interface Structure {
  /** Built at final size rather than scaled, so shard drift is not stretched. */
  size: [number, number, number]
  segments: [number, number, number]
  position: [number, number, number]
}

/** Columns sit outside the camera's lateral swing, framing rather than crowding. */
const BAY_X = 3.5
const BEAM_Y = 3.5

const column = (x: number, z: number, height: number): Structure => ({
  size: [0.32, height, 0.32],
  segments: [1, Math.round(height), 1],
  position: [x, height / 2, z],
})

const beam = (z: number): Structure => ({
  size: [BAY_X * 2 + 0.6, 0.3, 0.44],
  segments: [8, 1, 1],
  position: [0, BEAM_Y, z],
})

/**
 * The architecture of the room: a colonnade running down the second half of the
 * camera path, tied together overhead. Without it the BEAUTY and LIVE phases are
 * an empty floor, since every artifact sits near the start of the dolly.
 */
const BAYS = [
  { z: -5.6, left: 4.6, right: 4.2, tie: false },
  { z: -9.2, left: 4.2, right: 5.0, tie: true },
  { z: -12.8, left: 5.0, right: 4.4, tie: false },
  { z: -16.4, left: 4.4, right: 4.9, tie: true },
]

const STRUCTURES: Structure[] = BAYS.flatMap((bay) => [
  column(-BAY_X, bay.z, bay.left),
  column(BAY_X, bay.z, bay.right),
  ...(bay.tie ? [beam(bay.z)] : []),
])

export const Structures = ({ tier }: { tier: Tier }) => {
  const geometries = useMemo(
    () =>
      STRUCTURES.map(({ size, segments }) =>
        toShards(new THREE.BoxGeometry(...size, ...segments)),
      ),
    [],
  )

  // The whole colonnade moves as one, so it shares a material and a single sync.
  // Drift stays small: these are backdrop, and loose shards on a 5m column throw
  // spikes across the copy that sits over the middle of the corridor.
  const material = useMemo(
    () => new ReconstructMaterial({ spread: 0.2, jitter: 0.05, opacity: 0.45 }),
    [],
  )

  useEffect(() => {
    return () => {
      geometries.forEach((geometry) => geometry.dispose())
      material.dispose()
    }
  }, [geometries, material])

  useFrame((state) => {
    const build = buildFor(tier)
    material.sync({
      build,
      live: liveFor(build),
      focus: 0,
      time: state.clock.elapsedTime,
    })
  })

  return (
    <>
      {STRUCTURES.map((structure, index) => (
        <mesh
          key={structure.position.join()}
          geometry={geometries[index]}
          material={material}
          position={structure.position}
        />
      ))}
    </>
  )
}
