import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from './ReconstructMaterial'
import { toShards } from './shardGeometry'
import { ARTIFACTS, type ArtifactPlacement } from './layout'
import { buildFor, liveFor, sceneState, type Tier } from './sceneState'

/**
 * Deliberately plain solids: a gem, a monolith, a disc. The drama comes from the
 * reconstruction, not from stock 3D shapes, and low triangle counts keep the
 * individual shards big enough to read while they fly in.
 */
const buildGeometries = () => [
  toShards(new THREE.IcosahedronGeometry(0.85, 1)),
  toShards(new THREE.BoxGeometry(1.05, 1.5, 1.05, 2, 3, 2)),
  toShards(new THREE.CylinderGeometry(0.85, 0.85, 0.42, 6, 1)),
]

interface ArtifactProps {
  index: number
  placement: ArtifactPlacement
  geometry: THREE.BufferGeometry
  tier: Tier
}

const Artifact = ({ index, placement, geometry, tier }: ArtifactProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const focus = useRef(0)

  // Spread stays under the object's own radius: the silhouette has to stay
  // readable while it assembles, otherwise it is just floating triangles.
  const material = useMemo(
    () => new ReconstructMaterial({ spread: 0.72, jitter: 0.18 }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    const build = buildFor(tier)
    const targetFocus = sceneState.focus === index ? 1 : 0
    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 6, delta)

    material.sync({
      build,
      live: liveFor(build),
      focus: focus.current,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
    })

    const mesh = meshRef.current
    if (!mesh || tier === 'still') return

    // Rotation slows as the object solidifies — settling, not spinning forever.
    mesh.rotation.y += delta * placement.spin * (1.5 - build)
    mesh.position.y =
      placement.position[1] +
      Math.sin(state.clock.elapsedTime * 0.55 + index * 1.7) * 0.09
    mesh.scale.setScalar(placement.scale * (1 + focus.current * 0.07))
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={placement.position}
      scale={placement.scale}
    />
  )
}

/** The three project artifacts, index-matched to their DOM overlay panels. */
export const Artifacts = ({ tier }: { tier: Tier }) => {
  const geometries = useMemo(buildGeometries, [])
  useEffect(
    () => () => geometries.forEach((geometry) => geometry.dispose()),
    [geometries],
  )

  return (
    <>
      {ARTIFACTS.map((placement, index) => (
        <Artifact
          key={index}
          index={index}
          placement={placement}
          geometry={geometries[index]}
          tier={tier}
        />
      ))}
    </>
  )
}
