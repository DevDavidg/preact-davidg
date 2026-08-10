/**
 * Geodesic reactor — faceted cage + core.
 *
 * Never parks in the hero lane (that filled the lens and hid early cards). It
 * only appears already docked beside the camera once the first work beats have
 * cleared, then rides as a side ornament into the finale.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import type { Quality } from './capability'
import { REACTOR_CORE } from './layout'
import { idleAmount, pulseAt, sectionPhase } from './pulse'
import { ReconstructMaterial } from './ReconstructMaterial'
import { sceneColors } from './sceneColors'
import { livePowerFor, sceneState } from './sceneState'
import { toShards } from './shardGeometry'
import { punchScale, softAssemble } from './ui/assembleDrama'

/** After modules 01–02 — Signal Reactor is the first clear reading beat. */
const CORRIDOR_REVEAL_START = 0.4
const CORRIDOR_REVEAL_END = 0.5
const DOCK_SCALE = 0.58
const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _dock = new THREE.Vector3()
const _finale = new THREE.Vector3()
const _spawn = new THREE.Vector3()

interface ReactorCoreProps {
  quality: Quality
}

export const ReactorCore = ({ quality }: ReactorCoreProps) => {
  const group = useRef<THREE.Group>(null)
  const cage = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const spin = useRef(0)
  const camera = useThree((state) => state.camera)
  const booted = useRef(false)
  const target = useMemo(
    () => ({
      pos: new THREE.Vector3(REACTOR_CORE[0] + 2.8, REACTOR_CORE[1], REACTOR_CORE[2]),
      scale: DOCK_SCALE,
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
      cageMat.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
    },
    [cageGeo, cageMat, innerGeometry, innerMaterial],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const time = state.clock.elapsedTime
    const power = livePowerFor(build)
    const velocity = sceneState.velocity

    const finale = THREE.MathUtils.smoothstep(build, 0.78, 0.96)
    const finaleAssemble = softAssemble(finale)
    const corridorPresence = THREE.MathUtils.smoothstep(
      build,
      CORRIDOR_REVEAL_START,
      CORRIDOR_REVEAL_END,
    )
    const visible = corridorPresence > 0.012 || finale > 0.012
    const assembleEase = softAssemble(corridorPresence)

    camera.getWorldDirection(_fwd)
    _right.crossVectors(_fwd, camera.up).normalize()
    if (_right.lengthSq() < 1e-4) _right.set(1, 0, 0)
    _up.crossVectors(_right, _fwd).normalize()
    // Side ornament — clear of the reading plates in the centre lane.
    _dock
      .copy(camera.position)
      .addScaledVector(_fwd, 4.2)
      .addScaledVector(_right, 2.65)
      .addScaledVector(_up, 0.2)

    _finale
      .copy(_dock)
      .addScaledVector(_right, -1.4)
      .addScaledVector(_fwd, 0.6)

    target.pos.copy(_dock)
    if (finale > 0.01) target.pos.lerp(_finale, finale)
    target.scale =
      THREE.MathUtils.lerp(DOCK_SCALE, 0.95, finale) *
      punchScale(Math.max(assembleEase, finaleAssemble), 0)

    const root = group.current
    if (root) {
      root.visible = visible
      if (visible && !booted.current) {
        // First frame on-screen: snap to dock so it never sweeps through the lens.
        _spawn.copy(_dock)
        root.position.copy(_spawn)
        root.scale.setScalar(target.scale * 0.01)
        booted.current = true
      }
      if (!visible) booted.current = false
      damp3(root.position, target.pos, 5.2, delta)
      const s = THREE.MathUtils.damp(root.scale.x, target.scale, 5.2, delta)
      root.scale.setScalar(s)
    }

    const settle = Math.max(assembleEase, finaleAssemble * 0.85)
    const spinRate =
      THREE.MathUtils.lerp(0.55, 0.16, settle) *
      (1 + Math.abs(velocity) * 0.002) *
      (1 + finale * 0.6)
    spin.current += delta * spinRate

    const shell = cage.current
    if (shell) {
      shell.rotation.y = spin.current
      shell.rotation.x =
        Math.sin(spin.current * 0.28) *
        THREE.MathUtils.lerp(0.22, 0.05, settle)
      shell.rotation.z =
        Math.cos(spin.current * 0.18) *
        THREE.MathUtils.lerp(0.14, 0.03, settle)
    }

    const opacity = (0.55 + settle * 0.3) * Math.max(corridorPresence, finale)

    const settleSpread = THREE.MathUtils.lerp(0.55, 0.04, settle)
    const settleJitter = THREE.MathUtils.lerp(0.12, 0.02, settle)
    const settleDrift = THREE.MathUtils.lerp(0.7, 0.03, settle)

    cageMat.uniforms.uSpread.value = settleSpread
    cageMat.uniforms.uJitter.value = settleJitter
    cageMat.uniforms.uDrift.value = settleDrift
    cageMat.sync({
      build,
      live: power,
      focus: 0.25 + finale * 0.5,
      time,
      velocity,
      assembleAt: settle * 0.95,
    })
    cageMat.uniforms.uOpacity.value = opacity

    const heart = inner.current
    if (heart) {
      innerMaterial.color
        .copy(sceneColors.signal)
        .lerp(sceneColors.accent, power)
      // The heart runs on the room's tempo, not its own. It used to beat at
      // `1.8 + settle * 2` Hz with a `build * 10` term, so it sped up and slid in
      // phase as the visitor scrolled — two clocks in one room.
      const beat = pulseAt(sectionPhase(0))
      const breath = idleAmount(settle)
      innerMaterial.opacity =
        settle * (0.08 + beat * 0.06 * breath + power * 0.18 + finale * 0.18) * opacity
      heart.scale.setScalar(0.7 + beat * 0.06 * breath + power * 0.1)
      heart.rotation.y = -spin.current * 0.7
    }
  })

  return (
    <group
      ref={group}
      position={[REACTOR_CORE[0] + 2.8, REACTOR_CORE[1], REACTOR_CORE[2]]}
      scale={DOCK_SCALE}
      renderOrder={-2}
    >
      <mesh ref={cage} geometry={cageGeo} material={cageMat} frustumCulled={false} />
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
