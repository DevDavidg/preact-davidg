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
  TARGET_PATH,
} from './layout'
import { sceneState, swallowShape } from './sceneState'
import {
  APPROACH_Z,
  closestApproach,
  holeCenter,
  holeRadiusFor,
  PLUNGE_DEPTH,
} from './blackHole'
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
      /**
       * Where the lens is pulled to as the room goes in: short of the gate, on
       * the aperture's own axis — same height as the well, not above it.
       *
       * Looking down from over the disk turned the ending into a top-down hole in
       * the floor. The band's thickness comes from `DISK_TILT` in `blackHole.ts`,
       * not from raising the camera. `APPROACH_Z` is shared with that module so the
       * lens and the event horizon agree on how close the shot gets.
       */
      mouth: new THREE.Vector3(holeCenter.x, holeCenter.y, APPROACH_Z),
      /**
       * Where the look-at target converges as the swallow takes hold.
       *
       * Exactly the well's centre — `camera.lookAt` puts this in screen centre
       * once `pull` reaches 1, so there is no second place for "where the black
       * hole sits" to drift.
       */
      portal: holeCenter.clone(),
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
      /*
       * Base draw-in plus a lurch on each of the three gulps — but the draw-in
       * has to be the monotonic channel, and it was not.
       *
       * `surge` is `suction` squared and `suction` is a beat, so this used to
       * read `pull * 1.2 + surge * 0.88` and the *destination* itself oscillated:
       * 0.83 of the way to the mouth at the first gulp's peak, 0.09 a few percent
       * of scroll later. Recomputed from the spline every frame, that is a ten
       * metre yo-yo down the corridor that no damping coefficient can absorb —
       * the lens fell toward the well and was pulled back out three times.
       *
       * On the drain the destination only closes. The beat is still here, sized
       * so the worst give-back across the whole rail is 3% of the distance to
       * the mouth — a third of a metre, which is a tug. `check-swallow.ts` holds
       * that bound against every call site that mixes the two channels.
       *
       * 1.05 is a *schedule*, not a strength: it lands the lens at the mouth at
       * swallow 0.86, against 0.91 for the curve this replaced. The first pass at
       * this used 1.35, which arrived at 0.68 — and a lens parked at the aperture
       * while the room was still three quarters of the way in put the eye inside
       * the collapsing corridor, which renders as a white wash of recalled matter
       * at arm's length rather than as a room going away from you.
       */
      vectors.position.lerp(
        vectors.mouth,
        Math.min(1, swallow.drain * 1.05 + swallow.surge * 0.1),
      )
      /*
       * The last stretch carries the lens *through* the doorway.
       *
       * `PLUNGE_DEPTH` is measured against the geometry in `blackHole.ts`, and the
       * numbers this comment used to quote — 2.2 m from the singularity, r ≈ 2.3 Rs
       * — are from before `APPROACH_Z` was corrected for the aperture offset. The
       * lens actually stops `PLUNGE_RADIUS` = 10.2 m out. Against the deepest the
       * well ever opens (`holeRadiusFor(1, 1)` ≈ 2.45 m) that is r ≈ 4.2 Rs, five
       * times the Kerr photon orbit at a = 0.85 and comfortably outside even the
       * retrograde edge of the shadow's own apparent radius — so the ending stays a
       * shot *of* a black hole rather than one from inside it, while the shadow
       * subtends past the top and bottom of the frame and there is nothing else in
       * it. `scripts/check-kerr.ts` holds both halves of that.
       */
      vectors.position.z -=
        swallow.beyond * PLUNGE_DEPTH * 1.15 + swallow.surge * 0.75
      /*
       * And no further, whatever the gulps do.
       *
       * `surge` is `suction` squared and `suction` peaks at 1.62, so the kick
       * above is worth up to 1.97 m on its own — more than the authored plunge.
       * Unclamped, the third gulp threw the lens straight through the
       * singularity and out the back of it, which renders as a black frame with
       * the disk behind the camera. `closestApproach` floors the destination at
       * `PLUNGE_RADIUS` (10.2 m) or the Kerr photon orbit with margin, whichever is
       * further out — so no retune of the kick, and no swell of `RS_OPEN`, can put
       * the lens through its own horizon. The clamp is on the destination, not on
       * the damped position, so it is still a pure function of scroll and still
       * scrubs backwards.
       */
      vectors.position.z = Math.max(
        vectors.position.z,
        holeCenter.z +
          closestApproach(holeRadiusFor(sceneState.build, sceneState.swallow)),
      )
      vectors.target.lerp(
        vectors.portal,
        Math.min(1, swallow.drain * 1.25 + swallow.surge * 0.1),
      )
    }

    // Extra damping around each dwell beat: fast wheel flicks feel weighted
    // without freezing the reconstruction happening behind them.
    const follow =
      swallow.amount > 0.0005
        ? THREE.MathUtils.lerp(0.28, 0.1, swallow.grip)
        : THREE.MathUtils.lerp(0.3, 0.44, hold)
    damp3(camera.position, vectors.position, follow, delta)
    damp3(
      vectors.smoothTarget,
      vectors.target,
      swallow.amount > 0.0005
        ? THREE.MathUtils.lerp(0.32, 0.12, swallow.grip)
        : THREE.MathUtils.lerp(0.36, 0.5, hold),
      delta,
    )
    camera.lookAt(vectors.smoothTarget)

    /*
     * Roll, and the one place the cap comes off.
     *
     * A degree of roll from the pointer is deliberate restraint: any more and a
     * horizon that is not level reads as a tilted monitor rather than as a camera
     * move. The swallow is the exception, and the reason is that there is no
     * horizon left to be wrong about — the room is winding around the axis the
     * lens is looking down, and a lens that stayed rigidly level through that
     * would be the one object in frame insisting nothing was happening.
     *
     * Sixteen degrees, against the room's own winding so the relative twist is
     * larger than either. Bounded by `grip` rather than following `orbit`, because
     * two and a half turns of camera roll is not vertigo, it is a washing machine.
     */
    roll.current = THREE.MathUtils.damp(
      roll.current,
      -pointerX * 0.017 - (cinema ? swallow.grip * 0.18 + Math.min(swallow.surge, 1) * 0.06 : 0),
      3,
      delta,
    )
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
      // sells "going in" rather than "arriving at", and it is also what lets the
      // shadow reach the frame edges instead of sitting inside them.
      const targetFov =
        THREE.MathUtils.lerp(base, 42 + fovBump * 0.55, standby) +
        swallow.grip * 8 +
        (cinema ? Math.min(swallow.surge, 1) * 3 : 0)
      // The kick reaches the lens as well as the body — a punch-in of a couple
      // of degrees is what turns a nudge into an impact.
      camera.fov =
        THREE.MathUtils.damp(camera.fov, targetFov, 2.4, delta) - kick * 1.8
      camera.updateProjectionMatrix()
    }
  })

  return null
}
