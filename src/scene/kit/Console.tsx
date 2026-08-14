import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ReconstructMaterial } from '../ReconstructMaterial'
import { liveFor, sceneState, clamp01 } from '../sceneState'
import {
  punchScale,
  softAssemble,
  softDisassemble,
} from '../ui/assembleDrama'
import { ActionPlate } from './ActionPlate'
import type { ChassisKind } from './chassis'
import { ModuleRig } from './ModuleRig'
import { openFrame } from './panelGeometry'
import { UplinkGate } from './UplinkGate'

/**
 * Reading console: solid face + softly assembling sharded frame.
 */

export interface ConsoleAction {
  id: string
  label: string
  onActivate: () => void
}

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
}: ConsoleProps) => {
  const group = useRef<THREE.Group>(null)
  const face = useRef<THREE.Mesh>(null)
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

  useEffect(
    () => () => {
      frameGeo.dispose()
      rim.geometry.dispose()
      frameMat.dispose()
      faceMat.dispose()
      rimMat.dispose()
    },
    [frameGeo, rim, frameMat, faceMat, rimMat],
  )

  useFrame((state, delta) => {
    const build = sceneState.build
    const progress = clamp01((build - enter) / Math.max(span, 0.001))
    const leaving = clamp01((build - exit) / Math.max(exitSpan, 0.001))

    const assemble = softAssemble(progress)
    const { presence: leavePresence, scatter } = softDisassemble(leaving)
    const presence = assemble * leavePresence

    const targetFocus =
      moduleIndex != null && sceneState.focus === moduleIndex ? 1 : 0
    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 5, delta)

    const targetPunch = presence > 0.01 ? punchScale(assemble, scatter) : 0.96
    punch.current = THREE.MathUtils.damp(punch.current, targetPunch, 6, delta)

    const node = group.current
    if (node) {
      node.visible = presence > 0.02
      node.scale.setScalar(punch.current)
      node.position.set(
        position[0],
        position[1] + (1 - assemble) * 0.06 * leavePresence,
        position[2],
      )
    }

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
      assembleAt: assemble * 0.85 * leavePresence,
    })
    frameMat.uniforms.uOpacity.value =
      presence * (0.5 + assemble * 0.4 + focus.current * 0.1)

    const faceOpacity =
      THREE.MathUtils.smoothstep(assemble, 0.15, 0.75) * leavePresence
    faceMat.opacity = faceOpacity * 0.98
    // Never occlude glyphs — letters assemble in front of an opaque writer.
    faceMat.depthWrite = false
    rimMat.opacity = faceOpacity * (0.4 + focus.current * 0.3)

    const faceNode = face.current
    if (faceNode) faceNode.visible = faceOpacity > 0.02
  })

  const actionY = -height / 2 + 0.24
  const actionGap = Math.min(
    1.25,
    (width * 0.88) / Math.max(actions.length, 1),
  )
  const actionWidth = Math.min(
    1.2,
    actionGap * 0.9,
    width * 0.42,
  )
  const actionStartX =
    actions.length <= 1 ? 0 : -((actions.length - 1) * actionGap) / 2

  return (
    <group ref={group} position={position} quaternion={quaternion}>
      <mesh ref={face} position={[0, 0, -0.01]} renderOrder={1} visible={false}>
        <planeGeometry args={[width, height]} />
        <primitive object={faceMat} attach="material" />
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
      {actions.map((action, index) => (
        <ActionPlate
          key={action.id}
          label={action.label}
          width={actionWidth}
          height={0.28}
          position={[actionStartX + index * actionGap, actionY, 0.05]}
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
