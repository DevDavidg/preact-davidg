/**
 * End-of-corridor gate — assembles in the final beat so the scroll never dies
 * into an empty black void.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PORTAL_POSITION } from './layout'
import { ReconstructMaterial } from './ReconstructMaterial'
import { livePowerFor, sceneState, clamp01 } from './sceneState'
import { toShards } from './shardGeometry'
import { softAssemble } from './ui/assembleDrama'

const posts = [
  { x: -2.4, h: 4.2 },
  { x: 2.4, h: 4.2 },
]

export const FinaleGate = () => {
  const group = useRef<THREE.Group>(null)
  const spin = useRef(0)

  const postGeo = useMemo(() => {
    const source = new THREE.BoxGeometry(0.28, 1, 0.28, 1, 6, 1)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [])
  const lintelGeo = useMemo(() => {
    const source = new THREE.BoxGeometry(5.2, 0.22, 0.32, 8, 1, 1)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [])
  const ringGeo = useMemo(() => {
    const source = new THREE.TorusGeometry(1.35, 0.04, 6, 36)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [])

  const material = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0.7,
        jitter: 0.14,
        opacity: 0.8,
        depthSpan: 0.05,
      }),
    [],
  )

  useEffect(
    () => () => {
      postGeo.dispose()
      lintelGeo.dispose()
      ringGeo.dispose()
      material.dispose()
    },
    [postGeo, lintelGeo, ringGeo, material],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const power = livePowerFor(build)
    const enter = clamp01((build - 0.7) / 0.24)
    const ease = softAssemble(enter)

    material.uniforms.uSpread.value = THREE.MathUtils.lerp(0.7, 0.05, ease)
    material.uniforms.uJitter.value = THREE.MathUtils.lerp(0.14, 0.02, ease)
    material.uniforms.uDrift.value = THREE.MathUtils.lerp(1, 0.04, ease)
    material.sync({
      build,
      live: power,
      focus: ease * 0.45,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      assembleAt: ease * 0.88,
    })
    material.uniforms.uOpacity.value = ease * (0.5 + power * 0.35)

    spin.current += delta * (0.18 + power * 0.45)
    const root = group.current
    if (root) {
      root.visible = ease > 0.02
      root.scale.setScalar(0.9 + ease * 0.12 + power * 0.05)
      const ring = root.children[posts.length + 1] as THREE.Mesh | undefined
      if (ring) ring.rotation.z = spin.current
    }
  })

  return (
    <group
      ref={group}
      position={[PORTAL_POSITION[0], 0, PORTAL_POSITION[2] + 2.4]}
      visible={false}
    >
      {posts.map((post) => (
        <mesh
          key={post.x}
          geometry={postGeo}
          material={material}
          position={[post.x, post.h / 2, 0]}
          scale={[1, post.h, 1]}
          frustumCulled={false}
        />
      ))}
      <mesh
        geometry={lintelGeo}
        material={material}
        position={[0, 4.15, 0]}
        frustumCulled={false}
      />
      <mesh
        geometry={ringGeo}
        material={material}
        position={[0, 2.1, 0.2]}
        rotation={[Math.PI / 2, 0, 0]}
        frustumCulled={false}
      />
    </group>
  )
}
