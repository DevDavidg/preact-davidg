import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import { CAMERA_PATH, TARGET_PATH } from './layout'
import { cameraBuildFor, sceneState, type Tier } from './sceneState'

interface RigProps {
  tier: Tier
}

/**
 * Drives the camera along the dolly spline from scroll progress, with damped
 * pointer parallax and a touch of roll. Damping — not the raw scroll value — is
 * what keeps fast flicks from feeling like a teleport.
 */
export const Rig = ({ tier }: RigProps) => {
  const camera = useThree((state) => state.camera)
  const vectors = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      smoothTarget: new THREE.Vector3(0, 1.25, 4.2),
    }),
    [],
  )
  const roll = useRef(0)

  useFrame((_, delta) => {
    const build = cameraBuildFor(tier)
    const parallax = tier === 'cinema' ? 1 : 0
    const pointerX = sceneState.pointerX * parallax
    const pointerY = sceneState.pointerY * parallax

    CAMERA_PATH.getPointAt(build, vectors.position)
    vectors.position.x += pointerX * 0.95
    vectors.position.y -= pointerY * 0.5
    // Fast scrolling pulls the camera back a little, which reads as weight.
    vectors.position.z += Math.min(0.7, Math.abs(sceneState.velocity) * 0.007)

    TARGET_PATH.getPointAt(build, vectors.target)
    vectors.target.x += pointerX * 0.4
    vectors.target.y -= pointerY * 0.22

    damp3(camera.position, vectors.position, 0.3, delta)
    damp3(vectors.smoothTarget, vectors.target, 0.36, delta)
    camera.lookAt(vectors.smoothTarget)

    roll.current = THREE.MathUtils.damp(roll.current, -pointerX * 0.035, 3, delta)
    camera.rotateZ(roll.current)
  })

  return null
}
