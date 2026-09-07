import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from '../ReconstructMaterial'
import { liveFor, sceneState, clamp01, swallowShape } from '../sceneState'
import {
  punchScale,
  softAssemble,
  softDisassemble,
} from '../ui/assembleDrama'
import { ActionPlate } from './ActionPlate'
import type { ActionSlot } from './actionRow'
import type { ChassisKind } from './chassis'
import { ModuleRig } from './ModuleRig'
import { openFrame } from './panelGeometry'
import { UplinkGate } from './UplinkGate'

/**
 * Reading console: solid face + softly assembling sharded frame.
 */

/**
 * A control, with its geometry already decided.
 *
 * The plate's size and position come from `layoutActionRow`, not from this file.
 * They used to be computed here *and* again where the label glyphs are laid out,
 * from different constants — which is how labels ended up wider than the plates
 * they were supposed to sit inside. One layout, two consumers.
 */
export type ConsoleAction = ActionSlot & { onActivate: () => void }

export interface ConsoleProps {
  width: number
  height: number
  position: [number, number, number]
  quaternion: THREE.Quaternion
  enter: number
  span: number
  exit: number
  exitSpan?: number
  moduleIndex?: number
  actions?: ConsoleAction[]
  /** Which lane the plate sits in — the bay takes the other one. */
  side?: -1 | 0 | 1
  /** A featured module's bay. Omitted where the viewport cannot hold it. */
  bay?: { shot: string; chassis: ChassisKind; label: string }
  /** The finale plate carries the handshake terminals. */
  uplink?: boolean
  /** Which action id, if any, is the uplink's payload. */
  chargedAction?: string
  /** The shared studio, reflected on the frame the same way the gate is. */
  envMap?: THREE.Texture | null
}

const FRAME_PAD = 0.1

export const Console = ({
  width,
  height,
  position,
  quaternion,
  enter,
  span,
  exit,
  exitSpan = 0.05,
  moduleIndex,
  actions = [],
  side = 0,
  bay,
  uplink = false,
  chargedAction,
  envMap = null,
}: ConsoleProps) => {
  const group = useRef<THREE.Group>(null)
  const face = useRef<THREE.Mesh>(null)
  const occluder = useRef<THREE.Mesh>(null)
  const focus = useRef(0)
  const punch = useRef(1)

  const frameGeo = useMemo(
    () => openFrame(width + FRAME_PAD * 2, height + FRAME_PAD * 2, 0.075, 0.12),
    [width, height],
  )

  const frameMat = useMemo(
    () =>
      new ReconstructMaterial({
        spread: 0.55,
        jitter: 0.12,
        depthSpan: 0.03,
        opacity: 0.88,
      }),
    [],
  )
  const faceMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#090b10',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  )
  const rimMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#e8e2d6',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  )

  /**
   * The plate, as far as the post chain is concerned.
   *
   * `faceMat` above must not write depth — world type assembles *through* the
   * plate, letters travelling from scattered positions that are often behind it,
   * and an opaque depth writer clips them mid-flight. That is the right call for
   * the scene and it leaves the depth buffer with a hole exactly the shape of a
   * console: nothing near, according to depth, where in fact there is an opaque
   * panel at reading distance.
   *
   * Which was fine until something read that buffer. `BlackHoleEffect` draws the
   * well as a full-screen pass and leaves alone whatever the room put in front of
   * it — so with no depth here, the event horizon was drawn straight through a
   * panel's copy whenever the gate's doorway happened to sit behind one.
   *
   * This writes the depth and nothing else. `colorWrite: false` means it shades no
   * pixels, and a render order past the glyphs means it lands after the type has
   * already been drawn, so the letters keep their flight and the buffer still ends
   * the frame knowing there is a plate here.
   */
  const occluderMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
        depthTest: true,
      }),
    [],
  )
  const rim = useMemo(() => {
    const hw = width / 2
    const hh = height / 2
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-hw, -hh, 0.005),
      new THREE.Vector3(hw, -hh, 0.005),
      new THREE.Vector3(hw, hh, 0.005),
      new THREE.Vector3(-hw, hh, 0.005),
      new THREE.Vector3(-hw, -hh, 0.005),
    ])
    const line = new THREE.Line(geo, rimMat)
    line.renderOrder = 2
    return line
  }, [width, height, rimMat])

  // The frame is bare metal with no photo to protect, so — like the gate — it
  // earns a mirror sheen from the same shared room rather than staying flat.
  useEffect(() => {
    frameMat.setEnv(envMap)
  }, [frameMat, envMap])

  useEffect(
    () => () => {
      frameGeo.dispose()
      rim.geometry.dispose()
      frameMat.dispose()
      faceMat.dispose()
      rimMat.dispose()
      occluderMat.dispose()
    },
    [frameGeo, rim, frameMat, faceMat, rimMat, occluderMat],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const progress = clamp01((build - enter) / Math.max(span, 0.001))
    const leaving = clamp01((build - exit) / Math.max(exitSpan, 0.001))

    const assemble = softAssemble(progress)
    const { presence: leavePresence, scatter } = softDisassemble(leaving)
    /*
     * The well cannot eat an empty room.
     *
     * The finale runs entirely at `build === 1`, which is past every console's
     * own exit window — so by the time the field started closing, the room had
     * already put its work away and there was nothing left to take in. This
     * plate used to fade for the swallow as well, on the reasoning that it
     * would otherwise sit over the aperture; it does not, because `SwallowField`
     * is now dragging it *into* the aperture. `recall` holds it there for
     * exactly as long as there is a room, and lets go once the well's own light
     * is the only thing left in frame.
     */
    const swallow = swallowShape(sceneState.swallow)
    const held = Math.max(leavePresence, swallow.recall)
    const presence = assemble * held

    const targetFocus =
      moduleIndex != null && sceneState.focus === moduleIndex ? 1 : 0
    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 5, delta)

    const targetPunch = presence > 0.01 ? punchScale(assemble, scatter) : 0.96
    punch.current = THREE.MathUtils.damp(punch.current, targetPunch, 6, delta)

    const node = group.current
    const shown = presence > 0.02
    if (node) {
      node.visible = shown
      node.scale.setScalar(punch.current)
      node.position.set(
        position[0],
        position[1] + (1 - assemble) * 0.06 * leavePresence,
        position[2],
      )
    }

    /*
     * Nothing below this reaches a console that is not on screen.
     *
     * Placement gives every console an exclusive reading slice, so at any scroll
     * position eight or nine of the home corridor's ten are invisible — and each
     * of them was still running a `setShape`, a `sync` and three opacity writes,
     * which between them are on the order of thirty `gl.uniform*` calls and a
     * handful of throwaway object literals. Multiplied out that is the corridor's
     * single largest piece of redundant driver traffic. `ModuleRig` has carried
     * exactly this guard since it was written; this file never got it.
     *
     * Above the line is the damped state, which has to keep converging whether or
     * not anyone can see it — otherwise a console re-entering its window would
     * snap from wherever it was abandoned.
     */
    if (!shown) return

    frameMat.setShape({
      spread: THREE.MathUtils.lerp(0.55, 0.06, assemble),
      jitter: THREE.MathUtils.lerp(0.12, 0.02, assemble),
      drift: THREE.MathUtils.lerp(1, 0.04, assemble),
    })
    frameMat.sync({
      build,
      live: liveFor(build),
      focus: focus.current,
      time: state.clock.elapsedTime,
      velocity: sceneState.velocity,
      assembleAt: assemble * 0.85 * held,
    })
    frameMat.uniforms.uOpacity.value =
      presence * (0.5 + assemble * 0.4 + focus.current * 0.1)

    /*
     * The frame is matter and falls in; the reading surface is not, and goes.
     *
     * This is where the old `1 - pull` earned its keep, and it is the only place
     * it still belongs. `occluderMat` below writes depth for the whole plate, and
     * `BlackHoleEffect` zeroes its own lensing mask wherever something nearer
     * than the guard wrote depth — so a plate held opaque all the way in ends up
     * a metre from the lens, subtending most of the frame, punching the event
     * horizon out of the shot at exactly the climax. Fading the face takes the
     * occluder below its own threshold around the second gulp, well before the
     * plate is close enough to matter, and leaves the sharded frame — which is
     * thin, and which the well is supposed to bend — still falling.
     */
    const faceOpacity =
      THREE.MathUtils.smoothstep(assemble, 0.15, 0.75) *
      held *
      (1 - swallow.drain)
    // Uplink is a window onto the well — airy face, no depth punch-out.
    faceMat.opacity = faceOpacity * (uplink ? 0.45 : 0.98)
    // Never occlude glyphs — letters assemble in front of an opaque writer.
    faceMat.depthWrite = false
    rimMat.opacity = faceOpacity * (0.4 + focus.current * 0.3)

    const faceNode = face.current
    if (faceNode) faceNode.visible = faceOpacity > 0.02
    // The depth proxy exists only while there is a plate to stand in for, and it
    // waits until the panel is genuinely opaque: a half-faded plate does not
    // occlude anything, and writing depth for one would punch a hole in the post
    // chain wherever a console was still arriving.
    const occluderNode = occluder.current
    if (occluderNode) occluderNode.visible = !uplink && faceOpacity > 0.85
  })

  return (
    <group ref={group} position={position} quaternion={quaternion}>
      <mesh ref={face} position={[0, 0, -0.01]} renderOrder={1} visible={false}>
        <planeGeometry args={[width, height]} />
        <primitive object={faceMat} attach="material" />
      </mesh>
      {/* Depth only, and last. See `occluderMat`. */}
      <mesh
        ref={occluder}
        position={[0, 0, -0.01]}
        renderOrder={900}
        visible={false}
      >
        <planeGeometry args={[width, height]} />
        <primitive object={occluderMat} attach="material" />
      </mesh>
      <primitive object={rim} />
      <mesh
        geometry={frameGeo}
        material={frameMat}
        position={[0, 0, -0.02]}
        renderOrder={1}
      />
      {bay && moduleIndex != null ? (
        <ModuleRig
          consoleWidth={width}
          consoleHeight={height}
          side={side}
          enter={enter}
          span={span}
          exit={exit}
          exitSpan={exitSpan}
          moduleIndex={moduleIndex}
          shot={bay.shot}
          chassis={bay.chassis}
          label={bay.label}
        />
      ) : null}
      {uplink ? (
        <UplinkGate
          width={width}
          height={height}
          enter={enter}
          span={span}
          exit={exit}
          exitSpan={exitSpan}
        />
      ) : null}
      {actions.map((action) => (
        <ActionPlate
          key={action.id}
          label={action.label}
          width={action.width}
          height={action.height}
          position={[action.x, action.y, 0.05]}
          enter={enter + span * 0.35}
          span={span * 0.55}
          exit={exit}
          exitSpan={exitSpan}
          charged={action.id === chargedAction}
          onActivate={action.onActivate}
        />
      ))}
    </group>
  )
}
