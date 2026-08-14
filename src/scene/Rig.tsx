import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import type { Quality } from './capability'
import { reactorControl } from './control/reactorControl'
import {
  cameraFovFor,
  cameraHoldFor,
  cameraProgressFor,
  CAMERA_PATH,
  TARGET_PATH,
} from './layout'
import { sceneState } from './sceneState'
import { computeViewportFit, fovCompensation } from './viewportFit'

/** Matches the Canvas default; the standby breath oscillates around this. */
const BASE_FOV = 46

/**
 * The camera.
 *
 * Damping — not the raw scroll value — is what keeps a fast flick from reading as a
 * teleport. Roll is capped at roughly one degree: any more and a horizon that is
 * not level starts to feel like a tilted monitor rather than a camera move.
 *
 * Pointer parallax is cinema-only and damped, so the shot never jitters with the
 * mouse; on the quieter quality the camera stays on the spline and nothing else.
 */
export const Rig = ({ quality }: { quality: Quality }) => {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.viewport.aspect)
  const heightPx = useThree((state) => state.size.height)
  const cinema = quality === 'cinema'
  const fit = computeViewportFit(aspect, heightPx)
  const fovBump = fovCompensation(fit)

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
    const scrollBuild = sceneState.build
    // Only cinema gets the dwell curve; the lighter quality keeps predictable
    // framing rather than paying for pacing it cannot fully show.
    const build = cinema ? cameraProgressFor(scrollBuild) : scrollBuild
    const hold = cinema ? cameraHoldFor(scrollBuild) : 0
    const parallax = cinema ? 1 : 0
    const pointerX = sceneState.pointerX * parallax
    const pointerY = sceneState.pointerY * parallax
    const standby = cinema
      ? 1 - THREE.MathUtils.smoothstep(scrollBuild, 0.02, 0.16)
      : 0
    const time = state.clock.elapsedTime
    const breath = Math.sin(time * 0.35) * standby

    CAMERA_PATH.getPointAt(build, vectors.position)
    vectors.position.x += pointerX * 0.85
    vectors.position.y -= pointerY * 0.45
    // Fast scrolling pulls the camera back a little, which reads as weight.
    vectors.position.z += Math.min(0.7, Math.abs(sceneState.velocity) * 0.007)
    vectors.position.y += breath * 0.03
    vectors.position.z += Math.cos(time * 0.28) * 0.05 * standby

    TARGET_PATH.getPointAt(build, vectors.target)
    vectors.target.x += pointerX * 0.36
    vectors.target.y -= pointerY * 0.2
    vectors.target.y += breath * 0.012

    // Extra damping around each dwell beat: fast wheel flicks feel weighted
    // without freezing the reconstruction happening behind them.
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

    roll.current = THREE.MathUtils.damp(roll.current, -pointerX * 0.017, 3, delta)
    camera.rotateZ(roll.current)

    /*
     * Operator feedback in the lens.
     *
     * `punch` is the impulse every operation writes: a module seating, a law
     * turning, the handshake closing. It is applied *after* `lookAt`, in camera
     * space, so it never fights the spline — the shot stays exactly where the
     * story put it and simply flinches. `shake` is the sustained one CHAOS and
     * overclock hold, which is why it is a rotation rather than a translation:
     * a translating camera in a corridor reads as a physics bug, a rotating one
     * reads as a machine running hot.
     *
     * Both are damped to nothing in `advanceControl`, so a dropped frame or a
     * torn-down scene can never leave the camera displaced.
     */
    const kick = reactorControl.punch
    const shake = reactorControl.shake
    if (kick > 0.001) camera.translateZ(-kick * 0.34)
    if (shake > 0.001) {
      camera.rotateX(Math.sin(time * 31.7) * shake * 0.0035)
      camera.rotateY(Math.cos(time * 27.3) * shake * 0.0035)
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      // Wider FOV on short viewports so plates and the hero stay framed.
      const base =
        (cinema ? cameraFovFor(scrollBuild, BASE_FOV) : BASE_FOV) +
        breath * 0.5 +
        fovBump
      const targetFov = THREE.MathUtils.lerp(base, 42 + fovBump * 0.55, standby)
      // The kick reaches the lens as well as the body — a punch-in of a couple
      // of degrees is what turns a nudge into an impact.
      camera.fov =
        THREE.MathUtils.damp(camera.fov, targetFov, 2.4, delta) - kick * 1.8
      camera.updateProjectionMatrix()
    }
  })

  return null
}
