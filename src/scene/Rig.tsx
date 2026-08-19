import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { damp3 } from 'maath/easing'
import type { Quality } from './capability'
import { reactorControl } from './control/reactorControl'
import {
  cameraFovFor,
  cameraHoldFor,
  cameraPacing,
  cameraProgressFor,
  corridorLateral,
  CAMERA_PATH,
  PORTAL_POSITION,
  TARGET_PATH,
} from './layout'
import { sceneState, swallowShape } from './sceneState'
import { BASE_FOV, computeViewportFit, fovCompensation } from './viewportFit'

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
  /** Portrait flies straight down the lane; see `corridorLateral`. */
  const lane = corridorLateral(aspect)

  const vectors = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      smoothTarget: new THREE.Vector3(0, 1.25, 4.2),
      /** Just short of the aperture: where the lens is pulled to as the room goes in. */
      mouth: new THREE.Vector3(
        PORTAL_POSITION[0],
        PORTAL_POSITION[1],
        PORTAL_POSITION[2] + 2.6,
      ),
      portal: new THREE.Vector3(...PORTAL_POSITION),
    }),
    [],
  )
  const roll = useRef(0)

  useFrame((state, delta) => {
    const scrollBuild = sceneState.build
    /*
     * Both qualities go through the pacing remap — it is what decides how much
     * scroll the hero transit costs, and a phone flying through the same shell
     * has to reach it at the same charge value the consoles were sequenced
     * against. Only the *dwell* easing on top is cinema-only: that is pacing
     * luxury, and it is the part a demand-driven loop cannot really show.
     */
    const build = cinema
      ? cameraProgressFor(scrollBuild)
      : cameraPacing(scrollBuild)
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
    vectors.position.x *= lane
    vectors.position.x += pointerX * 0.85
    vectors.position.y -= pointerY * 0.45
    // Fast scrolling pulls the camera back a little, which reads as weight.
    vectors.position.z += Math.min(0.7, Math.abs(sceneState.velocity) * 0.007)
    vectors.position.y += breath * 0.03
    vectors.position.z += Math.cos(time * 0.28) * 0.05 * standby

    TARGET_PATH.getPointAt(build, vectors.target)
    vectors.target.x *= lane
    vectors.target.x += pointerX * 0.36
    vectors.target.y -= pointerY * 0.2
    vectors.target.y += breath * 0.012

    /*
     * The swallow takes the lens too.
     *
     * The room is collapsing into the aperture; a camera that stayed parked at the
     * end of the corridor would watch that happen from outside, which is a
     * different and much weaker idea than going in with it. So the eye is drawn
     * down the axis to the mouth of the gate as the pull builds, and pushed
     * *through* it over the last stretch — by which point the corridor has already
     * gone and the aperture's own light is the only thing left in frame.
     *
     * `lerp` toward a target derived from scroll, not an added velocity: the
     * damping below still smooths it, but the destination is a pure function of
     * scroll position, so scrolling back up walks the lens straight back out.
     */
    const swallow = swallowShape(sceneState.swallow)
    if (swallow.amount > 0.0005) {
      vectors.position.lerp(vectors.mouth, swallow.pull)
      vectors.position.z -= swallow.beyond * 5.4
      vectors.target.lerp(vectors.portal, Math.min(1, swallow.pull * 1.4))
    }

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
      // The lens opens up as it falls through the aperture — a wider angle is what
      // sells "going in" rather than "arriving at".
      const swallowFov = swallowShape(sceneState.swallow)
      const targetFov =
        THREE.MathUtils.lerp(base, 42 + fovBump * 0.55, standby) +
        swallowFov.grip * 14
      // The kick reaches the lens as well as the body — a punch-in of a couple
      // of degrees is what turns a nudge into an impact.
      camera.fov =
        THREE.MathUtils.damp(camera.fov, targetFov, 2.4, delta) - kick * 1.8
      camera.updateProjectionMatrix()
    }
  })

  return null
}
