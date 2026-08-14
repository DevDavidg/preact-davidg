/**
 * The core — the one object in the room the visitor can pick up.
 *
 * It used to be a side ornament: it appeared already docked beside the lens once
 * the first work beats had cleared, and rode along. It now has an arc. It is
 * released by the hero aperture, it travels with the operator through the
 * corridor, and it takes the axis of the gate at ignition.
 *
 * And it is operable. Hovering opens the cage; dragging takes it off the dock;
 * releasing lets a spring-damper pull it home. The spring constants come from
 * whatever law is in force, so the same gesture reads as floating in VACUUM,
 * weighted in VISCOUS, and barely controllable in CHAOS — the object is how the
 * physics is taught.
 *
 * There is no physics engine here on purpose. One position, one velocity and a
 * spring is the entire simulation; Rapier would be ~150 kB to make one object
 * behave in a way ten lines already describe exactly.
 */
import { useEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import type { Quality } from './capability'
import {
  clearHot,
  decomposeCore,
  grab,
  liveLaw,
  markHot,
  play,
  pushLog,
  reactorControl,
  strikeCore,
} from './control/reactorControl'
import { pointerOnPlane } from './control/pointerPlane'
import { REACTOR_CORE } from './layout'
import { idleAmount, pulseAt, sectionPhase } from './pulse'
import { ReconstructMaterial } from './ReconstructMaterial'
import { sceneColors } from './sceneColors'
import { clamp01, livePowerFor, sceneState } from './sceneState'
import { toShards } from './shardGeometry'
import { punchScale, softAssemble } from './ui/assembleDrama'

/**
 * The core leaves the shell rather than arriving from nowhere. The hero fades
 * across 0.055 → 0.18, so decoupling inside that window reads as the aperture
 * letting it out.
 */
const CORRIDOR_REVEAL_START = 0.12
const CORRIDOR_REVEAL_END = 0.24
const DOCK_SCALE = 0.58
/** Strikes on the cage before it gives up and comes apart. */
const STRIKES_TO_DECOMPOSE = 7
/** How far the held core can be dragged from its dock, in metres. */
const LEASH = 3.2

const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _fwd = new THREE.Vector3()
const _dock = new THREE.Vector3()
const _finale = new THREE.Vector3()
const _pointer = new THREE.Vector3()
const _want = new THREE.Vector3()
const _delta = new THREE.Vector3()

interface ReactorCoreProps {
  quality: Quality
}

export const ReactorCore = ({ quality }: ReactorCoreProps) => {
  const group = useRef<THREE.Group>(null)
  const cage = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const spin = useRef(0)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const booted = useRef(false)
  const hovered = useRef(0)
  /** Displacement from the dock, and its velocity. The whole simulation. */
  const offset = useRef(new THREE.Vector3())
  const velocity = useRef(new THREE.Vector3())
  const heldAt = useRef(0)
  const target = useMemo(
    () => ({
      pos: new THREE.Vector3(REACTOR_CORE[0] + 2.8, REACTOR_CORE[1], REACTOR_CORE[2]),
      scale: DOCK_SCALE,
    }),
    [],
  )

  const cinema = quality === 'cinema'
  const detail = cinema ? 1 : 0

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

  /*
   * Release has to be global.
   *
   * A pointer that goes up outside the canvas — off the window, over the nav,
   * on a different monitor — still ended the drag. Without this the core stays
   * welded to the cursor for the rest of the session.
   */
  useEffect(() => {
    if (!cinema) return

    const release = () => {
      if (reactorControl.held !== 'core') return
      grab(null)
      reactorControl.heldSpeed = 0
      document.body.style.cursor = ''
      const thrown = velocity.current.length()
      if (thrown > 1.4) {
        pushLog('core · thrown')
        play('whoosh')
      }
    }

    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('blur', release)
      release()
    }
  }, [cinema])

  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const time = state.clock.elapsedTime
    const power = livePowerFor(build)
    const scrollVelocity = sceneState.velocity
    const step = Math.min(delta, 1 / 30)

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

    // Ignition takes the axis: the core stops riding shotgun and lines itself up
    // with the gate the corridor has been pointing at the whole time.
    _finale
      .copy(camera.position)
      .addScaledVector(_fwd, 4.6)
      .addScaledVector(_up, 0.28)

    target.pos.copy(_dock)
    if (finale > 0.01) target.pos.lerp(_finale, finale)

    /* ---- the hand -------------------------------------------------------- */

    const held = reactorControl.held === 'core'
    hovered.current = THREE.MathUtils.damp(
      hovered.current,
      reactorControl.hotId === 'core' || held ? 1 : 0,
      9,
      delta,
    )

    if (held) {
      heldAt.current = time
      // The plane the core is dragged on is the plane it is already on, so
      // picking it up never yanks it toward or away from the lens.
      const distance = target.pos.clone().sub(camera.position).dot(_fwd)
      pointerOnPlane(camera, distance, _pointer)
      _want.copy(_pointer).sub(target.pos)
      if (_want.length() > LEASH) _want.setLength(LEASH)

      // Velocity is measured from the motion actually applied this frame, so a
      // release inherits the gesture rather than a guess at it.
      _delta.copy(_want).sub(offset.current)
      offset.current.copy(_want)
      velocity.current.copy(_delta).divideScalar(Math.max(step, 1e-3))
      reactorControl.heldSpeed = clamp01(velocity.current.length() * 0.22)
    } else {
      // Spring back to the dock. `magnet` is the stiffness and `damping` the
      // friction, both handed over by the law — that is the entire difference
      // between VACUUM's long float and VISCOUS's short, weighted return.
      const stiffness = liveLaw.magnet * 7.5
      _delta
        .copy(offset.current)
        .multiplyScalar(-stiffness)
        .addScaledVector(velocity.current, -liveLaw.damping)
      velocity.current.addScaledVector(_delta, step)
      offset.current.addScaledVector(velocity.current, step)
      // Below a millimetre it is home; leaving it to decay asymptotically keeps
      // the whole simulation awake forever on the on-demand renderer.
      if (offset.current.lengthSq() < 1e-6 && velocity.current.lengthSq() < 1e-4) {
        offset.current.set(0, 0, 0)
        velocity.current.set(0, 0, 0)
      }
      reactorControl.heldSpeed = 0
    }

    target.pos.add(offset.current)

    const decompose = reactorControl.decompose
    const grip = Math.max(hovered.current, held ? 1 : 0)

    target.scale =
      THREE.MathUtils.lerp(DOCK_SCALE, 0.95, finale) *
      punchScale(Math.max(assembleEase, finaleAssemble), 0) *
      (1 + grip * 0.08 + decompose * 0.22)

    const root = group.current
    if (root) {
      root.visible = visible
      if (visible && !booted.current) {
        // First frame on-screen the core is still inside the shell, so it starts
        // at the hero and flies out — never a pop-in beside the lens.
        root.position.set(REACTOR_CORE[0], REACTOR_CORE[1], REACTOR_CORE[2])
        root.scale.setScalar(target.scale * 0.2)
        offset.current.set(0, 0, 0)
        velocity.current.set(0, 0, 0)
        booted.current = true
      }
      if (!visible) booted.current = false
      // Held motion has to be immediate: damping the follow makes the object
      // feel like it is being dragged through treacle by the cursor rather than
      // held by it. The law's own damping is the only softness in the loop.
      if (held) root.position.copy(target.pos)
      else damp3(root.position, target.pos, 5.2, delta)
      const s = THREE.MathUtils.damp(root.scale.x, target.scale, 5.2, delta)
      root.scale.setScalar(s)
    }

    const settle = Math.max(assembleEase, finaleAssemble * 0.85)
    const spinRate =
      THREE.MathUtils.lerp(0.55, 0.16, settle) *
      (1 + Math.abs(scrollVelocity) * 0.002) *
      (1 + finale * 0.6) *
      (0.4 + liveLaw.agitation * 0.6) *
      (1 + decompose * 2.4)
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

    // The cage opens under the hand and blows apart on a decompose. Both are the
    // same two uniforms the settle already drives, pushed further.
    const open = grip * 0.32 + decompose * 1.9
    cageMat.setShape({
      spread: THREE.MathUtils.lerp(0.55, 0.04, settle) + open * 0.9,
      jitter: THREE.MathUtils.lerp(0.12, 0.02, settle) + open * 0.24,
      drift: THREE.MathUtils.lerp(0.7, 0.03, settle) + open * 0.8,
    })
    cageMat.sync({
      build,
      live: power,
      focus: 0.25 + finale * 0.5 + grip * 0.4,
      time,
      velocity: scrollVelocity,
      // A decompose reopens the assembly rather than adding a second motion, so
      // the pieces travel home along the path they arrived by.
      assembleAt: settle * 0.95 * (1 - decompose * 0.85),
    })
    cageMat.uniforms.uOpacity.value = opacity

    const heart = inner.current
    if (heart) {
      innerMaterial.color
        .copy(sceneColors.signal)
        .lerp(sceneColors.accent, Math.max(power, liveLaw.heat))
      // The heart runs on the room's tempo, not its own. It used to beat at
      // `1.8 + settle * 2` Hz with a `build * 10` term, so it sped up and slid in
      // phase as the visitor scrolled — two clocks in one room.
      const beat = pulseAt(sectionPhase(0))
      const breath = idleAmount(settle)
      innerMaterial.opacity =
        settle *
        (0.08 +
          beat * 0.06 * breath +
          power * 0.18 +
          finale * 0.18 +
          grip * 0.22 +
          reactorControl.audio * 0.12) *
        opacity
      heart.scale.setScalar(
        0.7 + beat * 0.06 * breath + power * 0.1 + grip * 0.18,
      )
      heart.rotation.y = -spin.current * 0.7
    }

    // The lighter quality renders on demand, and a spring that is still settling
    // is motion the scroll driver knows nothing about — so it has to ask.
    if (!cinema && (held || velocity.current.lengthSq() > 1e-4)) invalidate()
  })

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    if (!cinema) return
    event.stopPropagation()
    markHot('core')
    document.body.style.cursor = 'grab'
    invalidate()
  }

  const handleOut = () => {
    if (!cinema) return
    clearHot('core')
    if (reactorControl.held !== 'core') document.body.style.cursor = ''
    invalidate()
  }

  const handleDown = (event: ThreeEvent<PointerEvent>) => {
    if (!cinema) return
    event.stopPropagation()
    grab('core')
    document.body.style.cursor = 'grabbing'
    velocity.current.set(0, 0, 0)
    invalidate()
  }

  /*
   * Striking the cage.
   *
   * A click that does nothing on an object that visibly reacts to the pointer
   * is a broken promise, so every strike rings the cage — and the seventh one
   * takes it apart. The count is the reward for the visitor who kept going, and
   * `dblclick` is the shortcut for the one who guessed.
   */
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!cinema) return
    event.stopPropagation()
    // A drag ends in a click event too; only a gesture that barely moved counts.
    if (velocity.current.length() > 1.2) return

    const strikes = strikeCore()
    if (strikes >= STRIKES_TO_DECOMPOSE) {
      decomposeCore()
      return
    }
    play('lock', strikes)
    if (strikes === 3) pushLog('cage · stress rising')
    invalidate()
  }

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!cinema) return
    event.stopPropagation()
    decomposeCore()
    invalidate()
  }

  return (
    <group
      ref={group}
      position={[REACTOR_CORE[0] + 2.8, REACTOR_CORE[1], REACTOR_CORE[2]]}
      scale={DOCK_SCALE}
      renderOrder={-2}
    >
      <mesh
        ref={cage}
        geometry={cageGeo}
        material={cageMat}
        frustumCulled={false}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onPointerDown={handleDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
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
