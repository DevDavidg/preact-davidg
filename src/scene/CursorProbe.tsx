import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { reactorControl } from './control/reactorControl'
import { pointerOnPlane } from './control/pointerPlane'
import { pulseAt } from './pulse'
import { sceneState } from './sceneState'
import { sceneColors } from './sceneColors'

/**
 * The probe.
 *
 * The operating-system cursor is an arrow from a desktop metaphor; inside the
 * reactor the pointer is an instrument, and it should look like one. This is a
 * ring and a crosshair drawn in the room at the pointer's own position: nearly
 * invisible while it is crossing empty corridor, blooming the moment it finds
 * something operable.
 *
 * It is a readout, not decoration. `reactorControl.hot` is written by every
 * object that accepts a hand — the shell, the law ring, the core, a bay, a
 * plate, the uplink terminals — so the probe is the room's single answer to
 * "can I touch this", and the visitor learns the vocabulary once.
 *
 * Two draw calls, no textures, cinema only.
 */

/** Metres ahead of the eye. Far enough to sit in the room, near enough to lead. */
const PROBE_DISTANCE = 6

const _probe = new THREE.Vector3()

const ringGeometry = (radius: number, segments: number) => {
  const points: number[] = []
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2
    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return geometry
}

const crossGeometry = (inner: number, outer: number) => {
  const points = [
    -outer, 0, 0, -inner, 0, 0,
    inner, 0, 0, outer, 0, 0,
    0, -outer, 0, 0, -inner, 0,
    0, inner, 0, 0, outer, 0,
  ]
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return geometry
}

export const CursorProbe = () => {
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.LineLoop>(null)
  const camera = useThree((state) => state.camera)

  const geometries = useMemo(
    () => ({
      ring: ringGeometry(0.11, 40),
      cross: crossGeometry(0.05, 0.2),
    }),
    [],
  )

  const materials = useMemo(
    () => ({
      ring: new THREE.LineBasicMaterial({
        color: sceneColors.signal.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        // The probe is an overlay on the room, not an object inside it: a
        // crosshair that disappears behind a console is a crosshair that fails
        // exactly when the visitor is aiming at something.
        depthTest: false,
        toneMapped: false,
      }),
      cross: new THREE.LineBasicMaterial({
        color: sceneColors.signal.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    }),
    [],
  )

  useEffect(
    () => () => {
      geometries.ring.dispose()
      geometries.cross.dispose()
      materials.ring.dispose()
      materials.cross.dispose()
    },
    [geometries, materials],
  )

  useFrame(() => {
    const node = group.current
    if (!node) return

    /*
     * No pointer, no reticle.
     *
     * The tracking hook leaves both axes at exactly zero until a real mouse
     * move, so this is also the honest reading: before the visitor has put a
     * pointer in the room there is nothing to probe with, and drawing a
     * crosshair dead-centre of the opening shot is a mark on the hero, not an
     * instrument.
     */
    const live = sceneState.pointerX !== 0 || sceneState.pointerY !== 0
    node.visible = live
    if (!live) return

    pointerOnPlane(camera, PROBE_DISTANCE, _probe)
    // The control plane stores a plain triple so it can stay free of the
    // renderer; this is the one place that writes it.
    reactorControl.probe.x = _probe.x
    reactorControl.probe.y = _probe.y
    reactorControl.probe.z = _probe.z
    reactorControl.probeLive = true
    node.position.copy(_probe)
    // Square to the lens, always. A probe that foreshortens is a shape on a
    // wall rather than a reticle.
    node.quaternion.copy(camera.quaternion)

    const hot = reactorControl.hot
    const held = reactorControl.held ? 1 : 0
    const breath = pulseAt(Math.PI * 0.5)

    node.scale.setScalar(0.85 + hot * 0.5 - held * 0.18)
    if (ring.current) {
      ring.current.rotation.z += 0.004 + hot * 0.02 + held * 0.05
    }

    materials.ring.color
      .copy(sceneColors.signal)
      .lerp(sceneColors.accent, hot * 0.9)
    materials.cross.color.copy(materials.ring.color)
    materials.ring.opacity = 0.1 + hot * 0.55 + breath * 0.04
    materials.cross.opacity = 0.06 + hot * 0.42
  })

  return (
    <group ref={group} renderOrder={9} visible={false}>
      <lineLoop
        ref={ring}
        geometry={geometries.ring}
        material={materials.ring}
        renderOrder={9}
        frustumCulled={false}
      />
      <lineSegments
        geometry={geometries.cross}
        material={materials.cross}
        renderOrder={9}
        frustumCulled={false}
      />
    </group>
  )
}
