import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Quality } from './capability'
import { FOG_DENSITY, PORTAL_POSITION } from './layout'
import { sceneColors } from './sceneColors'
import { livePowerFor, sceneState } from './sceneState'

/**
 * A soft radial falloff, generated rather than shipped as an asset. A flat
 * additive circle reads as a hard-edged shape on screen; this reads as light.
 */
const createGlowTexture = () => {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')
  if (context) {
    const half = size / 2
    const gradient = context.createRadialGradient(half, half, 0, half, half, half)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.32)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }

  return new THREE.CanvasTexture(canvas)
}

/** Deterministic [0, 1) from an integer seed — keeps dust stable across remounts. */
const hash01 = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

const createDustGeometry = (count: number) => {
  const positions = new Float32Array(count * 3)
  for (let index = 0; index < count; index++) {
    const i3 = index * 3
    positions[i3] = (hash01(index * 3.1) - 0.5) * 6.4
    positions[i3 + 1] = 0.35 + hash01(index * 5.7) * 2.9
    positions[i3 + 2] = THREE.MathUtils.lerp(9.2, -22, hash01(index * 2.3))
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

interface ShardSpec {
  position: THREE.Vector3
  scale: number
  spin: THREE.Vector3
  phase: number
  signal: boolean
  kind: 'tetra' | 'ico'
}

const createShardSpecs = (count: number): ShardSpec[] => {
  const specs: ShardSpec[] = []
  for (let index = 0; index < count; index++) {
    const side = index % 2 === 0 ? -1 : 1
    const t = index / Math.max(count - 1, 1)
    specs.push({
      position: new THREE.Vector3(
        side * (2.4 + hash01(index + 11) * 1.1),
        0.9 + hash01(index + 23) * 1.8,
        THREE.MathUtils.lerp(7.5, -18, t),
      ),
      scale: 0.11 + hash01(index + 41) * 0.16,
      spin: new THREE.Vector3(
        0.08 + hash01(index + 53) * 0.12,
        0.11 + hash01(index + 67) * 0.16,
        0.05 + hash01(index + 79) * 0.08,
      ),
      phase: hash01(index + 97) * Math.PI * 2,
      signal: index % 3 !== 1,
      kind: index % 2 === 0 ? 'tetra' : 'ico',
    })
  }
  return specs
}

/**
 * Depth, dust, low-poly volume markers, and the portal at the end of the room.
 *
 * There are deliberately no scene lights: every material here is unlit and
 * carries its own hard-coded light directions, so `ambientLight` and friends
 * would cost uniforms and render nothing. The fog does the depth work for the
 * lattice and the portal, both of which are fog-aware basic materials.
 */
export const Atmosphere = ({ quality }: { quality: Quality }) => {
  const portal = useRef<THREE.Mesh>(null)
  const fog = useRef<THREE.FogExp2>(null)
  const dust = useRef<THREE.Points>(null)
  const shards = useRef<THREE.Group>(null)

  const dustCount = quality === 'cinema' ? 80 : 36
  const shardCount = quality === 'cinema' ? 6 : 4

  const glow = useMemo(createGlowTexture, [])
  const portalMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glow,
        color: sceneColors.accent.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    [glow],
  )
  const portalGeometry = useMemo(() => new THREE.PlaneGeometry(13, 13), [])

  const dustGeometry = useMemo(() => createDustGeometry(dustCount), [dustCount])
  const dustMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: sceneColors.signal.clone(),
        size: 0.028,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        sizeAttenuation: true,
        toneMapped: false,
        fog: true,
      }),
    [],
  )

  const shardSpecs = useMemo(() => createShardSpecs(shardCount), [shardCount])
  const shardGeometry = useMemo(
    () => ({
      tetra: new THREE.TetrahedronGeometry(1, 0),
      ico: new THREE.IcosahedronGeometry(1, 0),
    }),
    [],
  )
  const shardMaterials = useMemo(
    () => ({
      signal: new THREE.MeshBasicMaterial({
        color: sceneColors.signal.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        fog: true,
      }),
      accent: new THREE.MeshBasicMaterial({
        color: sceneColors.accent.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        fog: true,
      }),
      wireSignal: new THREE.MeshBasicMaterial({
        color: sceneColors.signal.clone(),
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        fog: true,
      }),
      wireAccent: new THREE.MeshBasicMaterial({
        color: sceneColors.accent.clone(),
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        fog: true,
      }),
    }),
    [],
  )

  useEffect(() => {
    return () => {
      glow.dispose()
      portalMaterial.dispose()
      portalGeometry.dispose()
      dustGeometry.dispose()
      dustMaterial.dispose()
      shardGeometry.tetra.dispose()
      shardGeometry.ico.dispose()
      shardMaterials.signal.dispose()
      shardMaterials.accent.dispose()
      shardMaterials.wireSignal.dispose()
      shardMaterials.wireAccent.dispose()
    }
  }, [
    glow,
    portalMaterial,
    portalGeometry,
    dustGeometry,
    dustMaterial,
    shardGeometry,
    shardMaterials,
  ])

  useFrame((state, delta) => {
    const power = livePowerFor(sceneState.build)
    const time = state.clock.elapsedTime
    // Dust settles in after the hero product shot, then rides the corridor.
    const dustPresence = THREE.MathUtils.smoothstep(sceneState.build, 0.08, 0.28)
    const volumePresence =
      THREE.MathUtils.smoothstep(sceneState.build, 0.12, 0.34) *
      (1 - THREE.MathUtils.smoothstep(sceneState.build, 0.9, 0.98) * 0.35)

    if (fog.current) {
      fog.current.color.copy(sceneColors.base)
      // Ignition opens the end of the room a touch; the change stays restrained
      // so it reads as power coming on, not as the scene losing its depth.
      fog.current.density = FOG_DENSITY * (1 - power * 0.16)
    }
    portalMaterial.color.copy(sceneColors.accent)
    if (portal.current) {
      const breathe =
        1 +
        power * 0.13 +
        Math.sin(time * 0.8) * 0.028 * power
      portal.current.scale.setScalar(breathe)
      // Effectively off until the final chapter, then accelerating. A radial plane
      // keeps this one extra draw cheap.
      // Visible earlier so the corridor end never reads as a black void.
      const approach = THREE.MathUtils.smoothstep(sceneState.build, 0.62, 0.92)
      portalMaterial.opacity =
        Math.max(power, approach * 0.55) * (0.28 + power * 0.55)
    }

    dustMaterial.color.copy(sceneColors.signal).lerp(sceneColors.accent, 0.12 + power * 0.18)
    dustMaterial.opacity = (0.14 + power * 0.12) * dustPresence
    if (dust.current) {
      dust.current.rotation.y = THREE.MathUtils.damp(
        dust.current.rotation.y,
        time * 0.012,
        1.4,
        delta,
      )
      dust.current.position.y = Math.sin(time * 0.21) * 0.04
    }

    shardMaterials.signal.color.copy(sceneColors.signal)
    shardMaterials.accent.color.copy(sceneColors.accent)
    shardMaterials.wireSignal.color.copy(sceneColors.signal)
    shardMaterials.wireAccent.color.copy(sceneColors.accent)
    shardMaterials.signal.opacity = 0.18 * volumePresence
    shardMaterials.accent.opacity = 0.22 * volumePresence
    shardMaterials.wireSignal.opacity = 0.28 * volumePresence
    shardMaterials.wireAccent.opacity = 0.32 * volumePresence

    const shardRoot = shards.current
    if (shardRoot) {
      shardRoot.children.forEach((child, index) => {
        const spec = shardSpecs[index]
        if (!spec) return
        child.rotation.x = time * spec.spin.x + spec.phase
        child.rotation.y = time * spec.spin.y
        child.rotation.z = time * spec.spin.z * 0.6
        child.position.y =
          spec.position.y + Math.sin(time * 0.55 + spec.phase) * 0.08
      })
    }
  })

  return (
    <>
      <fogExp2
        ref={fog}
        attach="fog"
        args={[`#${sceneColors.base.getHexString()}`, FOG_DENSITY]}
      />
      <mesh
        ref={portal}
        geometry={portalGeometry}
        material={portalMaterial}
        position={PORTAL_POSITION}
      />

      <points
        ref={dust}
        geometry={dustGeometry}
        material={dustMaterial}
        frustumCulled={false}
      />

      <group ref={shards}>
        {shardSpecs.map((spec, index) => {
          const geometry =
            spec.kind === 'tetra' ? shardGeometry.tetra : shardGeometry.ico
          const fill = spec.signal ? shardMaterials.signal : shardMaterials.accent
          const wire = spec.signal
            ? shardMaterials.wireSignal
            : shardMaterials.wireAccent
          return (
            <group
              key={`shard-${index}`}
              position={spec.position}
              scale={spec.scale}
            >
              <mesh geometry={geometry} material={fill} />
              <mesh geometry={geometry} material={wire} scale={1.04} />
            </group>
          )
        })}
      </group>
    </>
  )
}
