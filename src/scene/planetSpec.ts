import * as THREE from 'three'

/**
 * The three worlds, and where the flyby puts them.
 *
 * Its own module, and not for tidiness: this is the half of `Planets.tsx` that is
 * pure arithmetic over the camera path, so `scripts/check-planets.ts` can hold the
 * framing honest without a canvas. The shaders and the materials stay next door.
 *
 * The framing is the whole problem this file exists to solve, and the first attempt
 * got it exactly backwards. That version hung each world near the lane and swept it
 * outboard as the lens drew level — which sounds like a flyby and is not one, because
 * `swing` only reaches 1 when the lens is *beside* the world, and by then the world
 * is a sliver at the frame edge. Every metre of the approach, where the disc grows
 * from a speck to two thirds of the frame, happened with the world sitting on the
 * axis: a bright globe parked precisely behind the copy the visitor is meant to be
 * reading. It read as a backdrop, not as a body passing.
 *
 * So a world is off-axis for the *whole* pass: `at[0]` is already all the way outboard
 * while the world is still far enough to be small. The disc grows in the side of the
 * frame it will leave by, the copy keeps the middle, and the pass still ends with the
 * world sliding past the lens.
 *
 * `sweep` used to be described as finishing that job, and for two of the three worlds
 * it now does the opposite — it is a small *inboard* correction. That is not a change
 * of intent, it is `CAMERA_PATH` being measured properly: the path itself weaves from
 * x −1.2 at z 1.4 to +1.4 at z −2.2, so at Earth's depth the camera already supplies
 * the whole lateral pass, and a large outboard sweep on top of it pushes the disc out
 * of frame *before* it reaches its biggest. Optimising over the real camera basis
 * (~400 k samples per world, then local refinement, scored against `check-planets`'s
 * own arithmetic at all three aspects) puts Earth's and Saturn's `sweep.x` positive.
 */
export interface PlanetSpec {
  /** Where the world hangs during the approach: outboard already, above eye level. */
  readonly at: readonly [number, number, number]
  /** How far it has moved, laterally and up, by the time the lens is level. */
  readonly sweep: readonly [number, number]
  /** Metres of remaining corridor the sweep is spent over. */
  readonly reach: number
  readonly size: number
  readonly air: string
  readonly kind: number
  readonly tilt: number
  readonly spin: number
  readonly phase: number
  readonly idle: number
  readonly relief: number
  readonly ring: boolean
}

/**
 * Sides and depths, and why each world is where it is. Every number here is a
 * `scripts/check-planets.ts` output, not a preference.
 *
 * Each z is a gap between two colonnade bays (bays at 6.4 / 2.2 / −2.0 / −5.6 / −9.2,
 * 0.86 m-deep bases, columns at x = ±3.5), because depth is the one axis the sweep
 * cannot escape along: a world whose sphere overlaps a bay's depth span can grow
 * through a column at some x, and no lateral offset saves it. Only −0.10, −3.80 and
 * −7.40 clear at these radii — an earlier −6.2 for the moon read fine on screen and
 * passed straight through the bay at −5.6. Clearances are 0.37 / 0.20 / 0.18 m.
 *
 * That colonnade is also what caps two of the three, and it is worth writing down
 * which lever moves them. Earth is bound by the copy box at aspect 1.60 and by
 * nothing else — deleting the colonnade entirely changes its score by under 0.5% —
 * so it is finished at 96% of the geometric ceiling for a disc that fits the frame
 * and clears the copy. Saturn and the moon are pinned to those two depths, and
 * neither is the depth the camera path frames best: freed of the bays they would sit
 * at z −2.54 and −6.36 and read 0.458 and 0.481 instead of 0.364 and 0.415. So if
 * those two need to be materially closer, the lever is `BAYS` in `Structures.tsx`,
 * not this file. `size` is not the lever anywhere — Earth's optimum drifts *down*
 * to 1.10, and the other two are already at their bay-imposed caps.
 *
 * Sides go to the half of the frame the beat's copy does not use. The featured bays
 * are at x −2.15 / +2.2 / −2.1 / +2.15 for z 4.6 / 0.4 / −3.8 / −7.6, so Earth
 * leaves to port past the starboard console at z 0.4, and Saturn to starboard past
 * the port console at z −3.8.
 *
 * The moon is the one that has to be argued rather than looked up. Its bay-clearing
 * z of −7.4 is the About portrait's own depth (−7.35), and the portrait is on the
 * port lane — so port looks unavailable. It is not: the plate is 1.35 m wide at
 * x −1.15, spanning x −1.86 to −0.44, and a moon of radius 1.19 whose centre starts
 * at −4.65 reaches no further inboard than −3.46. It passes outboard of the plate
 * with 1.60 m to spare, which starboard could not offer — the starboard bay at
 * z −7.6 is closer to the lane than the portrait is.
 *
 * Sizes and the inboard shift are the third pass, and what paid for them was not a
 * better search — it was the copy-box rule getting less superstitious. A world behind
 * an opaque console plate cannot obscure the copy on it, and `check-planets.ts` now
 * only counts an intrusion when the world is in *front* of the nearest plate. That
 * one clause took Earth's disc from 0.76 to 0.95 of a half-height, Saturn's from 0.48
 * to 0.63 and the moon's from 0.48 to 0.60 — the worlds are a quarter to a third
 * larger in frame than the previous optimum allowed, without a pixel of copy lost.
 *
 * The `y` values are the second lever and the one the first attempt never used. The
 * frame is 1.78 half-widths wide and 1 half-height tall, so lifting a world is a
 * cheaper way out of the copy than pushing it sideways — which is why Saturn is at
 * 3.20 and the moon at 2.85, both higher than the version this replaces.
 */
export const PLANETS: readonly PlanetSpec[] = [
  // Earth. 23.4° of tilt, leaning *south* toward the lens — see ARG_LAT in Planets.
  { at: [-2.75, 2.9, -0.1], sweep: [0.3, -0.1], reach: 10.4, size: 1.31, air: '#5f9fe0', kind: 0, tilt: -0.41, spin: 0.9, phase: 0, idle: 0.01, relief: 3.4, ring: false },
  // Saturn. 26.7° opens the rings to the ~27° they are famous for.
  { at: [3.0, 3.2, -3.8], sweep: [1, 0.1], reach: 16.3, size: 1.17, air: '#c8b489', kind: 1, tilt: 0.47, spin: 1.2, phase: 1.7, idle: 0.006, relief: 0, ring: true },
  // The moon. Outboard of the About portrait's plate rather than across it.
  { at: [-3.85, 2.85, -7.4], sweep: [-0.8, 0.55], reach: 10.9, size: 1.21, air: '#000000', kind: 2, tilt: 0.09, spin: 1.2, phase: 3.4, idle: 0.014, relief: 2.2, ring: false },
]

/** Span for the worlds, in metres: the corridor's own length, so they fall with it. */
export const PLANET_SPAN = 12

/**
 * How far through its pass a world is, 0 → 1, from the lens's remaining depth.
 *
 * Read from the live camera rather than from `build` so the pass stays exact through
 * the Rig's damping, its lane offset and the pointer parallax — none of which the
 * scroll value knows about.
 *
 * Smoothstep and not linear: it front-loads the outboard move into the far half of
 * `reach`, which is what keeps the world clear of the middle of the frame during the
 * stretch where its disc is actually large.
 */
export const planetSwing = (spec: PlanetSpec, cameraZ: number): number =>
  1 - THREE.MathUtils.smoothstep(cameraZ - spec.at[2], 0, spec.reach)

/** Where a world hangs this frame, before the swallow's orbit decay touches it. */
export const planetAnchor = (
  spec: PlanetSpec,
  cameraZ: number,
  out: THREE.Vector3,
): THREE.Vector3 => {
  const swing = planetSwing(spec, cameraZ)
  return out.set(
    spec.at[0] + spec.sweep[0] * swing,
    spec.at[1] + spec.sweep[1] * swing,
    spec.at[2],
  )
}

/**
 * How far through Earth's pass the lens is, 0 → 1.
 *
 * Its own exported function because three places have to agree on it exactly: the
 * Rig swings the camera round Earth on it, `Planets` lands the Argentina lock and
 * the country's mark on it, and `scripts/check-planets.ts` has to reproduce the
 * camera the other two produce or its framing numbers describe a shot that is not
 * being rendered.
 *
 * The window is measured rather than chosen. Earth is on screen from build 0 to
 * about 0.24 and its disc grows 0.31 → 0.77 over that; past 0.24 it is leaving the
 * frame and by 0.28 it is gone. Those are `planetSwing` 0.02 → 0.70.
 */
export const earthPass = (railZ: number): number =>
  THREE.MathUtils.smoothstep(planetSwing(PLANETS[0], railZ), 0.02, 0.7)

/**
 * The lens's angle around Earth during the pass, in radians.
 *
 * Exactly one turn, and that is what makes it free: a full revolution ends where it
 * started, so the camera rejoins the rail with no displacement to blend out and no
 * seam at either end. Smoothstepped so it accelerates away from the rail and settles
 * back onto it rather than snapping into motion.
 */
export const earthOrbitAngle = (pass: number): number =>
  Math.PI * 2 * (pass * pass * (3 - 2 * pass))

/**
 * Swing a point around Earth's axis, in place.
 *
 * About world up through the anchor, not about the camera's own axis: the visitor is
 * being carried around the planet, so the height and the distance are what stay
 * fixed while the bearing sweeps.
 */
export const orbitAround = (
  point: THREE.Vector3,
  anchor: THREE.Vector3,
  angle: number,
): THREE.Vector3 => {
  const dx = point.x - anchor.x
  const dz = point.z - anchor.z
  const c = Math.cos(angle)
  const sn = Math.sin(angle)
  point.x = anchor.x + dx * c - dz * sn
  point.z = anchor.z + dx * sn + dz * c
  return point
}
