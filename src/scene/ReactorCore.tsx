import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { REACTOR_CORE } from './layout'
import { ReconstructMaterial } from './ReconstructMaterial'
import { sceneColors } from './sceneColors'
import { livePowerFor, sceneState, clamp01 } from './sceneState'
import { toShards } from './shardGeometry'

/**
 * The object the room is wired to.
 *
 * The scene needed a subject for the opening chapter: before this, standby was an
 * empty corridor and the first scroll had nothing to act on, so "charging" was a
 * label in the HUD rather than something visible. The core is a caged icosahedron
 * that assembles out of shards during standby, spins up through charge, and holds
 * the ignition colour at the end.
 *
 * It is also the only object allowed to move while the camera is still: chapter one
 * has one protagonist, and this is it.
 */

/** Charge value by which the cage has fully assembled. */
const ASSEMBLED_AT = 0.2

interface ReactorCoreProps {
  quality: Quality
}

export const ReactorCore = ({ quality }: ReactorCoreProps) => {
  const cage = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    // Detail 1 on cinema keeps the silhouette readable as a faceted shell;
    // detail 0 halves the triangle count where fill rate is scarcer.
    const source = new THREE.IcosahedronGeometry(0.62, quality === 'cinema' ? 1 : 0)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [quality])

  const material = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 1.6,
        jitter: 0.5,
        depthSpan: 0.04,
      }),
    [],
  )

  // A solid inner mass so the cage reads as a shell around something, not as a
  // hollow wireframe ball. Unlit and additive: it is a light source, not a solid.
  const innerGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(0.26, 1),
    [],
  )
  const innerMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: sceneColors.signal.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
    },
    [geometry, material, innerGeometry, innerMaterial],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const time = state.clock.elapsedTime
    const power = livePowerFor(build)

    // Standby → charge: the cage assembles early, well before the first module.
    const assembled = clamp01(build / ASSEMBLED_AT)

    material.sync({
      build,
      live: power,
      // The core answers the focused module rather than glowing constantly.
      focus: sceneState.focus >= 0 ? 0.5 : 0,
      time,
      velocity: sceneState.velocity,
      assembleAt: assembled * 0.78,
    })
    // Retire as the camera leaves it behind, so it never sits in front of a module.
    material.uniforms.uOpacity.value = 1 - clamp01((build - 0.34) / 0.14)

    const spin = cage.current
    if (spin) {
      // Spin-up is the charge read: slow in standby, faster as the room powers on.
      const rate = 0.12 + build * 0.5 + power * 0.4
      spin.rotation.y += delta * rate
      spin.rotation.x += delta * rate * 0.35
    }

    const heart = inner.current
    if (heart) {
      innerMaterial.color.copy(sceneColors.signal).lerp(sceneColors.accent, power)
      const pulse = 0.5 + 0.5 * Math.sin(time * 1.6 + build * 8)
      innerMaterial.opacity =
        assembled * (0.18 + pulse * 0.14 + power * 0.4) *
        (1 - clamp01((build - 0.34) / 0.14))
      heart.scale.setScalar(0.9 + pulse * 0.08 + power * 0.2)
    }
  })

  return (
    <group position={REACTOR_CORE}>
      <mesh ref={cage} geometry={geometry} material={material} renderOrder={1} />
      <mesh ref={inner} geometry={innerGeometry} material={innerMaterial} />
    </group>
  )
}
