import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import type { Quality } from './capability'
import { mergeBoxes, type Box } from './kit/chassis'
import { ARTIFACTS } from './layout'
import { liveFor, sceneState } from './sceneState'

/**
 * The architecture of the room.
 *
 * A colonnade down the corridor, tied together overhead, with a kerb running the
 * length of the lane. Without it the second half of the dolly is an empty floor,
 * since every module sits near the start.
 *
 * Everything here used to be a plain box per part — a column was literally
 * `BoxGeometry(0.32, h, 0.32)` — which is exactly the failure the finale gate's
 * own comment describes: under the reconstruction material a five-metre extruded
 * rectangle reads as scaffolding rather than as a building. The gate answered
 * that with base plates, plinths, banded shafts, collars and heads; this file now
 * speaks the same vocabulary, so the corridor and the thing at the end of it
 * belong to one structure.
 *
 * It is also cheaper than before. Each bay merges into a *single* sharded buffer
 * through `mergeBoxes`, so a bay costs one draw call where it previously cost one
 * per part — which is what pays for the extra detail.
 */

/** Columns sit outside the camera's lateral swing, framing rather than crowding. */
const BAY_X = 3.5
const BEAM_Y = 3.5
/** Kerb length per bay, a little over the spacing so the rail reads continuous. */
const KERB_SPAN = 4.4

/**
 * A machined column: base plate, plinth, banded shaft, three collars, capital.
 *
 * Segmented on the long axis so the reconstruction breaks it into plausible
 * pieces. A single tall box shatters into tall splinters, which is what made the
 * old colonnade look like debris instead of like a structure assembling.
 */
const columnBoxes = (x: number, height: number): Box[] => {
  const shaft = 0.3
  const shaftHeight = Math.max(height - 0.95, 0.6)
  const boxes: Box[] = [
    { size: [0.86, 0.13, 0.86], position: [x, 0.065, 0], segments: [2, 1, 2] },
    { size: [0.6, 0.22, 0.6], position: [x, 0.24, 0] },
    {
      size: [shaft, shaftHeight, shaft],
      position: [x, 0.35 + shaftHeight / 2, 0],
      segments: [1, Math.max(3, Math.round(shaftHeight * 1.6)), 1],
    },
    { size: [0.62, 0.22, 0.62], position: [x, height - 0.28, 0] },
    { size: [0.74, 0.1, 0.74], position: [x, height - 0.12, 0] },
  ]
  // Collars up the shaft: the banding is what gives a vertical its scale.
  for (let index = 1; index <= 3; index += 1) {
    boxes.push({
      size: [0.44, 0.07, 0.44],
      position: [x, 0.35 + (shaftHeight * index) / 4, 0],
    })
  }
  // An outboard fin, so the column has a direction and casts a silhouette
  // against the fog rather than reading as a round post.
  boxes.push({
    size: [0.1, shaftHeight * 0.72, 0.34],
    position: [x + Math.sign(x) * 0.24, 0.4 + shaftHeight * 0.36, 0],
    segments: [1, 5, 1],
  })
  return boxes
}

/** The tie overhead: a main beam, a fascia under it, and brackets hanging down. */
const beamBoxes = (): Box[] => {
  const span = BAY_X * 2 + 0.7
  const boxes: Box[] = [
    { size: [span, 0.26, 0.42], position: [0, BEAM_Y, 0], segments: [10, 1, 1] },
    {
      size: [span - 0.6, 0.1, 0.56],
      position: [0, BEAM_Y - 0.17, 0],
      segments: [8, 1, 1],
    },
  ]
  for (let index = 0; index < 5; index += 1) {
    const t = index / 4 - 0.5
    boxes.push({
      size: [0.08, 0.3, 0.26],
      position: [t * (span - 1.6), BEAM_Y - 0.36, 0],
    })
  }
  return boxes
}

/**
 * The kerb: a low rail either side of the lane.
 *
 * The cheapest thing in this file and the one that does the most. A corridor with
 * no edge where the floor meets the walls has no width — the grid simply fades
 * out sideways — and every object in it loses its sense of standing *in* somewhere.
 */
const kerbBoxes = (): Box[] => {
  const boxes: Box[] = []
  for (const side of [-1, 1]) {
    const x = side * (BAY_X - 0.62)
    boxes.push(
      { size: [0.26, 0.14, KERB_SPAN], position: [x, 0.07, 0], segments: [1, 1, 6] },
      { size: [0.1, 0.08, KERB_SPAN], position: [x + side * 0.16, 0.18, 0], segments: [1, 1, 6] },
    )
  }
  return boxes
}

interface Bay {
  z: number
  left: number
  right: number
  tie: boolean
}

const BAYS: Bay[] = [
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
  boxes: Box[]
}

const BAY_BUILDS: BayBuild[] = BAYS.map((bay, index) => ({
  z: bay.z,
  buildBias: index * 0.02,
  boxes: [
    ...columnBoxes(-BAY_X, bay.left),
    ...columnBoxes(BAY_X, bay.right),
    ...kerbBoxes(),
    ...(bay.tie ? beamBoxes() : []),
  ],
}))

const BayMesh = ({
  bay,
  geometry,
  material,
  quality,
}: {
  bay: BayBuild
  geometry: THREE.BufferGeometry
  material: ReconstructMaterial
  quality: Quality
}) => {
  const focus = useRef(0)
  const cinema = quality === 'cinema'

  useFrame((state, delta) => {
    const build = sceneState.build
    // The room has to exist by the time the lens clears the hero optic — the
    // transit hands off into the corridor, not into an empty floor.
    const corridorPresence = THREE.MathUtils.smoothstep(build, 0.09, 0.2)
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

    // Backdrop shapes stay small on purpose — loose shards on a five-metre
    // column throw spikes across the copy in the middle of the corridor — but
    // they are still scaled by the law, so the architecture belongs to the same
    // physics as the objects in front of it. Cinema affords a slightly livelier
    // read; lite keeps it calm to protect fill rate.
    material.setShape({
      spread: cinema ? 0.42 : 0.35,
      jitter: cinema ? 0.11 : 0.08,
      drift: 1,
    })
    material.sync({
      build,
      live: liveFor(build),
      focus: focus.current,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      buildBias: bay.buildBias,
    })
    /*
     * Raised from 0.55. At that level the colonnade was a suggestion of a
     * building rather than a building — barely separable from the fog behind it,
     * which is most of why the corridor read as empty even though it was full of
     * geometry.
     */
    material.uniforms.uOpacity.value =
      0.78 * corridorPresence * (cinema ? 1.08 : 0.94)
  })

  // One mesh for the whole bay: columns, kerb and tie in a single buffer.
  return <mesh geometry={geometry} material={material} position={[0, 0, bay.z]} />
}

export const Structures = ({ quality }: { quality: Quality }) => {
  const geometries = useMemo(
    () => BAY_BUILDS.map((bay) => mergeBoxes(bay.boxes)),
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
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
    }
  }, [geometries, materials])

  return (
    <>
      {/* The far bays are the first thing to go when fill rate is scarce: they
          frame the corridor rather than carry any content. */}
      {BAY_BUILDS.slice(0, quality === 'cinema' ? BAY_BUILDS.length : 6).map(
        (bay, index) => (
          <BayMesh
            key={bay.z}
            bay={bay}
            geometry={geometries[index]}
            material={materials[index]}
            quality={quality}
          />
        ),
      )}
    </>
  )
}
