/**
 * Geodesic reactor — faceted cage + rings + core. Assembles hard as the hero,
 * then docks beside the reading lane as a readable ornament (never a light blob).
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import type { Quality } from './capability'
import { REACTOR_CORE } from './layout'
import { ReconstructMaterial } from './ReconstructMaterial'
import { sceneColors } from './sceneColors'
import { livePowerFor, sceneState, clamp01 } from './sceneState'
import { toShards } from './shardGeometry'
import { punchScale, softAssemble } from './ui/assembleDrama'

const ASSEMBLED_AT = 0.16
const DOCK_START = 0.12
const DOCK_END = 0.24

const HERO_POS = new THREE.Vector3(REACTOR_CORE[0], REACTOR_CORE[1], REACTOR_CORE[2])
const HERO_SCALE = 1.18
const DOCK_SCALE = 0.78
const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _dock = new THREE.Vector3()
const _finale = new THREE.Vector3()

interface ReactorCoreProps {
  quality: Quality
}

export const ReactorCore = ({ quality }: ReactorCoreProps) => {
  const group = useRef<THREE.Group>(null)
  const cage = useRef<THREE.Mesh>(null)
  const ringA = useRef<THREE.Mesh>(null)
  const ringB = useRef<THREE.Mesh>(null)
  const ringC = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const spin = useRef(0)
  const camera = useThree((state) => state.camera)
  const target = useMemo(
    () => ({
      pos: new THREE.Vector3().copy(HERO_POS),
      scale: HERO_SCALE,
    }),
    [],
  )

  const detail = quality === 'cinema' ? 1 : 0

  const cageGeo = useMemo(() => {
    const source = new THREE.IcosahedronGeometry(0.78, detail)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [detail])

  const ringGeo = useMemo(() => {
    const source = new THREE.TorusGeometry(0.95, 0.025, 6, 28)
    const shards = toShards(source)
    source.dispose()
    return shards
  }, [])

  const cageMat = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0.9,
        jitter: 0.18,
        depthSpan: 0.02,
        opacity: 1,
      }),
    [],
  )
  const ringMat = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0.65,
        jitter: 0.12,
        depthSpan: 0.01,
        opacity: 0.85,
      }),
    [],
  )

  const innerGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(0.22, 1),
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
      cageGeo.dispose()
      ringGeo.dispose()
      cageMat.dispose()
      ringMat.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
    },
    [cageGeo, ringGeo, cageMat, ringMat, innerGeometry, innerMaterial],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const time = state.clock.elapsedTime
    const power = livePowerFor(build)
    const velocity = sceneState.velocity

    const assembleEase = softAssemble(clamp01(build / ASSEMBLED_AT))
    const finale = THREE.MathUtils.smoothstep(build, 0.78, 0.96)
    const finaleAssemble = softAssemble(finale)
    const dockT = clamp01((build - DOCK_START) / (DOCK_END - DOCK_START))
    const dockEase = dockT * dockT * (3 - 2 * dockT) * (1 - finale * 0.85)

    camera.getWorldDirection(_fwd)
    _right.crossVectors(_fwd, camera.up).normalize()
    if (_right.lengthSq() < 1e-4) _right.set(1, 0, 0)
    _up.crossVectors(_right, _fwd).normalize()
    _dock
      .copy(camera.position)
      .addScaledVector(_fwd, 3.8)
      .addScaledVector(_right, 2.35)
      .addScaledVector(_up, 0.35)

    // Finale: return toward path centre ahead of the camera.
    _finale
      .copy(_dock)
      .addScaledVector(_right, -2.35)
      .addScaledVector(_fwd, 0.8)
    target.pos.lerpVectors(HERO_POS, _dock, dockEase)
    if (finale > 0.01) target.pos.lerp(_finale, finale)
    const baseScale = THREE.MathUtils.lerp(
      HERO_SCALE,
      THREE.MathUtils.lerp(DOCK_SCALE, 1.08, finale),
      Math.max(dockEase, finale),
    )
    target.scale = baseScale * punchScale(Math.max(assembleEase, finaleAssemble), 0)

    const root = group.current
    if (root) {
      damp3(root.position, target.pos, 5.2, delta)
      const s = THREE.MathUtils.damp(root.scale.x, target.scale, 5.2, delta)
      root.scale.setScalar(s)
    }

    const settle = Math.max(assembleEase, finaleAssemble * 0.85)
    const spinRate =
      THREE.MathUtils.lerp(0.85, 0.18, settle) *
      (1 + Math.abs(velocity) * 0.002) *
      (1 + finale * 0.6)
    spin.current += delta * spinRate

    const shell = cage.current
    if (shell) {
      shell.rotation.y = spin.current
      shell.rotation.x =
        Math.sin(spin.current * 0.28) *
        THREE.MathUtils.lerp(0.35, 0.06, settle)
      shell.rotation.z =
        Math.cos(spin.current * 0.18) *
        THREE.MathUtils.lerp(0.22, 0.03, settle)
    }

    const ra = ringA.current
    const rb = ringB.current
    const rc = ringC.current
    if (ra) {
      ra.rotation.x = Math.PI / 2
      ra.rotation.z = spin.current * 0.7
    }
    if (rb) {
      rb.rotation.y = spin.current * 0.85
      rb.rotation.x = 0.4 + Math.sin(time * 0.6) * 0.08
    }
    if (rc) {
      rc.rotation.y = -spin.current * 0.55
      rc.rotation.z = 0.9
    }

    const opacity = THREE.MathUtils.lerp(1, 0.82, dockEase * (1 - finale))

    const settleSpread = THREE.MathUtils.lerp(0.9, 0.04, settle)
    const settleJitter = THREE.MathUtils.lerp(0.18, 0.02, settle)
    const settleDrift = THREE.MathUtils.lerp(1, 0.03, settle)

    cageMat.uniforms.uSpread.value = settleSpread
    cageMat.uniforms.uJitter.value = settleJitter
    cageMat.uniforms.uDrift.value = settleDrift
    cageMat.sync({
      build,
      live: power,
      focus: 0.3 + finale * 0.55,
      time,
      velocity,
      assembleAt: settle * 0.95,
    })
    cageMat.uniforms.uOpacity.value = opacity

    const ringAssemble = clamp01((settle - 0.12) / 0.88)
    ringMat.uniforms.uSpread.value = THREE.MathUtils.lerp(0.65, 0.03, ringAssemble)
    ringMat.uniforms.uJitter.value = THREE.MathUtils.lerp(0.12, 0.02, ringAssemble)
    ringMat.uniforms.uDrift.value = THREE.MathUtils.lerp(1, 0.03, ringAssemble)
    ringMat.sync({
      build,
      live: power,
      focus: 0.4 + power * 0.3,
      time,
      velocity,
      assembleAt: ringAssemble * 0.92,
    })
    ringMat.uniforms.uOpacity.value = opacity * (0.5 + ringAssemble * 0.45)

    const heart = inner.current
    if (heart) {
      innerMaterial.color
        .copy(sceneColors.signal)
        .lerp(sceneColors.accent, power)
      const pulse =
        0.5 + 0.5 * Math.sin(time * (1.8 + settle * 2) + build * 10)
      innerMaterial.opacity =
        settle * (0.1 + pulse * 0.08 + power * 0.22 + finale * 0.2) * opacity
      heart.scale.setScalar(0.75 + pulse * 0.08 + power * 0.12)
      heart.rotation.y = -spin.current * 0.7
    }
  })

  return (
    <group ref={group} position={REACTOR_CORE} scale={HERO_SCALE} renderOrder={-2}>
      <mesh ref={cage} geometry={cageGeo} material={cageMat} frustumCulled={false} />
      <mesh ref={ringA} geometry={ringGeo} material={ringMat} frustumCulled={false} />
      <mesh ref={ringB} geometry={ringGeo} material={ringMat} frustumCulled={false} />
      <mesh ref={ringC} geometry={ringGeo} material={ringMat} frustumCulled={false} />
      <mesh
        ref={inner}
        geometry={innerGeometry}
        material={innerMaterial}
        frustumCulled={false}
        renderOrder={-1}
      />
    </group>
  )
}
