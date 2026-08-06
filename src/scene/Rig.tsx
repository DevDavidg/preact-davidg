import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import {
  cameraFovFor,
  cameraHoldFor,
  cameraProgressFor,
  CAMERA_PATH,
  TARGET_PATH,
} from './layout'
import { cameraBuildFor, sceneState, type Tier } from './sceneState'

interface RigProps {
  tier: Tier
}

/** Matches the Canvas default; SCANNING breath oscillates around this. */
const BASE_FOV = 42

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

  useFrame((state, delta) => {
    const scrollBuild = cameraBuildFor(tier)
    // Only cinema gets the dwell curve. Lite and still retain their proven,
    // predictable framing instead of paying for pacing they cannot fully show.
    const build =
      tier === 'cinema' ? cameraProgressFor(scrollBuild) : scrollBuild
    const hold = tier === 'cinema' ? cameraHoldFor(scrollBuild) : 0
    const parallax = tier === 'cinema' ? 1 : 0
    const pointerX = sceneState.pointerX * parallax
    const pointerY = sceneState.pointerY * parallax
    const scanning =
      tier === 'cinema'
        ? 1 - THREE.MathUtils.smoothstep(scrollBuild, 0.02, 0.18)
        : 0
    const time = state.clock.elapsedTime
    const breath = Math.sin(time * 0.35) * scanning

    CAMERA_PATH.getPointAt(build, vectors.position)
    vectors.position.x += pointerX * 0.95
    vectors.position.y -= pointerY * 0.5
    // Fast scrolling pulls the camera back a little, which reads as weight.
    vectors.position.z += Math.min(0.7, Math.abs(sceneState.velocity) * 0.007)
    // Idle scan breath: restrained so world-copy glyphs do not swim.
    vectors.position.y += breath * 0.03
    vectors.position.z += Math.cos(time * 0.28) * 0.05 * scanning

    TARGET_PATH.getPointAt(build, vectors.target)
    vectors.target.x += pointerX * 0.4
    vectors.target.y -= pointerY * 0.22
    vectors.target.y += breath * 0.012

    // A fraction more damping around each beat makes fast wheel flicks feel
    // weighted without freezing the scroll-driven reconstruction behind it.
    damp3(
      camera.position,
      vectors.position,
      THREE.MathUtils.lerp(0.3, 0.44, hold),
      delta,
    )
    damp3(
      vectors.smoothTarget,
      vectors.target,
      THREE.MathUtils.lerp(0.36, 0.5, hold),
      delta,
    )
    camera.lookAt(vectors.smoothTarget)

    roll.current = THREE.MathUtils.damp(roll.current, -pointerX * 0.035, 3, delta)
    camera.rotateZ(roll.current)

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov =
        (tier === 'cinema'
          ? cameraFovFor(scrollBuild, BASE_FOV)
          : BASE_FOV) +
        breath * 0.55
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 2.2, delta)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
