import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  clearHot,
  markHot,
  play,
  punch,
  reactorControl,
} from '../control/reactorControl'
import { pulseAt } from '../pulse'
import { sceneState, clamp01 } from '../sceneState'
import {
  punchScale,
  softAssemble,
  softDisassemble,
} from '../ui/assembleDrama'

/**
 * Clickable console tile — solid face + rectangular outline (no triangle diagonal).
 */

export interface ActionPlateProps {
  label: string
  width?: number
  height?: number
  position: [number, number, number]
  rotation?: [number, number, number]
  enter: number
  span: number
  exit: number
  exitSpan?: number
  /**
   * This plate is what the uplink handshake charges. Once the circuit closes it
   * stops looking like one control among several and starts looking like the
   * thing the whole corridor has been charging toward.
   */
  charged?: boolean
  onActivate: () => void
}

const rectOutline = (width: number, height: number) => {
  const hw = width / 2
  const hh = height / 2
  const points = [
    new THREE.Vector3(-hw, -hh, 0),
    new THREE.Vector3(hw, -hh, 0),
    new THREE.Vector3(hw, hh, 0),
    new THREE.Vector3(-hw, hh, 0),
    new THREE.Vector3(-hw, -hh, 0),
  ]
  return new THREE.BufferGeometry().setFromPoints(points)
}

export const ActionPlate = ({
  label,
  width = 1.35,
  height = 0.32,
  position,
  rotation = [0, 0, 0],
  enter,
  span,
  exit,
  exitSpan = 0.05,
  charged = false,
  onActivate,
}: ActionPlateProps) => {
  const group = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const press = useRef(0)
  const hoverAmt = useRef(0)
  const invalidate = useThree((state) => state.invalidate)
  const hotId = `plate-${label}-${position.join(',')}`

  const faceMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#0c0e14',
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
  const outline = useMemo(() => {
    const geo = rectOutline(width, height)
    const line = new THREE.Line(geo, rimMat)
    line.renderOrder = 3
    return line
  }, [width, height, rimMat])

  useEffect(
    () => () => {
      outline.geometry.dispose()
      faceMat.dispose()
      rimMat.dispose()
    },
    [outline, faceMat, rimMat],
  )

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  useFrame((_, delta) => {
    const build = sceneState.build
    const progress = clamp01((build - enter) / Math.max(span, 0.001))
    const leaving = clamp01((build - exit) / Math.max(exitSpan, 0.001))
    const assemble = softAssemble(progress)
    const { presence: leavePresence, scatter } = softDisassemble(leaving)
    const presence = assemble * leavePresence

    hoverAmt.current = THREE.MathUtils.damp(
      hoverAmt.current,
      hovered ? 1 : 0,
      10,
      delta,
    )
    press.current = THREE.MathUtils.damp(press.current, 0, 10, delta)

    // A charged plate breathes on the room's own clock rather than on a timer of
    // its own, so the payoff joins the reactor instead of blinking at it.
    const live = charged && reactorControl.uplinked ? pulseAt(0) : 0

    // Keep the face airy so glyph labels stay readable on top.
    faceMat.opacity = presence * (0.55 + hoverAmt.current * 0.2 + live * 0.18)
    faceMat.color.set(hoverAmt.current > 0.3 || live > 0.5 ? '#1c1814' : '#0e0c0a')
    rimMat.opacity = presence * (0.9 + hoverAmt.current * 0.1)
    rimMat.color.set(
      hoverAmt.current > 0.3 || live > 0.35 ? '#ffb454' : '#f4efe6',
    )

    const node = group.current
    if (node) {
      node.visible = presence > 0.02
      const scale =
        punchScale(assemble, scatter) *
        (1 + hoverAmt.current * 0.04 - press.current * 0.03 + live * 0.02)
      node.scale.setScalar(scale)
      node.position.z = hoverAmt.current * 0.03 - press.current * 0.025
      node.rotation.z = 0
    }
  })

  return (
    <group ref={group} position={position} rotation={rotation}>
      <mesh
        renderOrder={2}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          // UI ticks sit above the world's hover voice on purpose: a control and
          // a piece of the room should never sound like the same thing.
          markHot(hotId, { ui: true })
          invalidate()
        }}
        onPointerOut={() => {
          setHovered(false)
          clearHot(hotId)
          invalidate()
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
          press.current = 1
          invalidate()
        }}
        onClick={(event) => {
          event.stopPropagation()
          play('lock', 3)
          punch(0.25)
          onActivate()
        }}
      >
        <planeGeometry args={[width, height]} />
        <primitive object={faceMat} attach="material" />
      </mesh>
      <primitive object={outline} />
    </group>
  )
}
