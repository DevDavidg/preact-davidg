import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import type { Quality } from './capability'
import { ARTIFACTS } from './layout'
import { toShards } from './shardGeometry'
import { liveFor, sceneState } from './sceneState'

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
  { z: 6.4, left: 3.4, right: 3.2, tie: true },
  { z: 2.2, left: 3.8, right: 3.6, tie: false },
  { z: -2.0, left: 4.0, right: 3.8, tie: true },
  { z: -5.6, left: 4.6, right: 4.2, tie: false },
  { z: -9.2, left: 4.2, right: 5.0, tie: true },
  { z: -12.8, left: 5.0, right: 4.4, tie: false },
  { z: -16.4, left: 4.4, right: 4.9, tie: true },
  { z: -20.0, left: 4.8, right: 4.6, tie: true },
]

interface BayBuild {
  z: number
  /** Extra assemble delay so distant bays finish after nearer ones. */
  buildBias: number
  structures: Structure[]
}

const BAY_BUILDS: BayBuild[] = BAYS.map((bay, index) => ({
  z: bay.z,
  buildBias: index * 0.02,
  structures: [
    column(-BAY_X, bay.z, bay.left),
    column(BAY_X, bay.z, bay.right),
    ...(bay.tie ? [beam(bay.z)] : []),
  ],
}))

const Bay = ({
  bay,
  geometries,
  material,
}: {
  bay: BayBuild
  geometries: THREE.BufferGeometry[]
  material: ReconstructMaterial
}) => {
  const focus = useRef(0)

  useFrame((state, delta) => {
    const build = sceneState.build
    const artifactIndex = sceneState.focus
    const artifactZ =
      artifactIndex >= 0 ? ARTIFACTS[artifactIndex]?.position[2] : null
    const workFocus =
      THREE.MathUtils.smoothstep(build, 0.16, 0.23) *
      (1 - THREE.MathUtils.smoothstep(build, 0.44, 0.52))
    const proximity =
      artifactZ === null
        ? 0
        : THREE.MathUtils.clamp(1 - Math.abs(artifactZ - bay.z) / 6.5, 0, 1)
    // A focused project briefly pulls its nearest bay forward in contrast. The
    // squared falloff keeps neighbouring columns present but not equally loud.
    const targetFocus = proximity * proximity * workFocus

    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 7, delta)

    material.sync({
      build,
      live: liveFor(build),
      focus: focus.current,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      buildBias: bay.buildBias,
    })
  })

  return (
    <>
      {bay.structures.map((structure, index) => (
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

export const Structures = ({ quality }: { quality: Quality }) => {
  const geometries = useMemo(
    () =>
      BAY_BUILDS.map((bay) =>
        bay.structures.map(({ size, segments }) =>
          toShards(new THREE.BoxGeometry(...size, ...segments)),
        ),
      ),
    [],
  )

  // One material per bay: shared sync + independent focus/buildBias.
  // Drift stays small: these are backdrop, and loose shards on a 5m column throw
  // spikes across the copy that sits over the middle of the corridor.
  const materials = useMemo(
    () =>
      BAY_BUILDS.map(
        () =>
          new ReconstructMaterial({
            spread: 0.35,
            jitter: 0.08,
            opacity: 0.55,
            depthSpan: 0.1,
          }),
      ),
    [],
  )

  useEffect(() => {
    return () => {
      geometries.forEach((bay) => bay.forEach((geometry) => geometry.dispose()))
      materials.forEach((material) => material.dispose())
    }
  }, [geometries, materials])

  return (
    <>
      {/* The far bays are the first thing to go when fill rate is scarce: they
          frame the corridor rather than carry any content. */}
      {BAY_BUILDS.slice(0, quality === 'cinema' ? BAY_BUILDS.length : 4).map(
        (bay, index) => (
          <Bay
            key={bay.z}
            bay={bay}
            geometries={geometries[index]}
            material={materials[index]}
          />
        ),
      )}
    </>
  )
}
