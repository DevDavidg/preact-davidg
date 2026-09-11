import * as THREE from 'three'
import { PORTAL_POSITION } from './layout'
import { swallowShape } from './sceneState'

/**
 * The well at the end of the corridor, as a physical object.
 *
 * Everything that draws, lights, occludes or falls into the finale reads this
 * module, so there is exactly one answer to "how big is the hole right now" and
 * "which way is the disk facing". Before it existed the aperture shader, the
 * camera and the room's collapse each carried their own private notion of the
 * ending's geometry, which is why the light never quite lined up with the mouth
 * everything was being drawn into.
 *
 * The unit throughout is the Schwarzschild radius, Rs = 2GM/c². It is the only
 * length a black hole has, and writing the rest of the object in multiples of it
 * is what lets the whole thing be scaled by one number without any of its
 * features drifting out of proportion:
 *
 * - 1.5 Rs — the photon sphere, where light can orbit.
 * - 2.598 Rs (3√3/2) — the *apparent* radius of the shadow to a distant viewer.
 *   Larger than the horizon itself, because the horizon is seen through its own
 *   lensing. This, not Rs, is the black disc a viewer actually measures.
 * - 3 Rs — the innermost stable circular orbit. Matter inside it cannot hold an
 *   orbit, so the accretion disk has a hard inner edge here rather than reaching
 *   the horizon. It is the reason a real image has a *gap* between the shadow and
 *   the bright ring.
 */

/** Apparent radius of the shadow, in Rs. 3√3/2 — the photon capture radius. */
export const SHADOW_RS = 2.5980762
/** The photon sphere, in Rs: the last radius at which light can orbit. */
export const PHOTON_RS = 1.5
/** Inner edge of the disk, in Rs. The ISCO of a Schwarzschild hole. */
export const DISK_INNER_RS = 3
/**
 * Outer edge of the disk, in Rs. Authored, not physical: disks have no edge.
 *
 * Ten rather than a larger number because of what has to contain it. For the whole
 * corridor the well is seen *through* the gate's aperture, and the pass that draws
 * it is masked to a disc a few times the shadow's own radius so the rest of the
 * frame does not pay for geodesics. Ten Rs is what fits inside that mask while the
 * room is still standing — and since emission falls off as r^-3, the light this
 * gives up is under a percent of the total.
 */
export const DISK_OUTER_RS = 10

/**
 * The hole's spin, dimensionless: a = Jc/GM², 0 ≤ a < 1.
 *
 * Schwarzschild is the a = 0 case of Kerr, not a separate object, so the spin
 * lives in exactly this one place and every radius that depends on it is a
 * function below. Each function returns the constants above, bit for bit, at
 * a = 0 — which is the value while the integrator is Schwarzschild-only. The
 * finale's target is 0.85: enough spin to flatten the shadow into a D and pull
 * the ISCO in from 3 Rs to ~1.4, without parking the photon orbit on the
 * horizon (that is a = 0.998, and it forces a plunge rewrite we do not want).
 *
 * All radii below are equatorial and returned in Rs. The closed forms are
 * Kerr's in geometric units (rg = GM/c² = Rs/2), halved on the way out.
 */
export const HOLE_SPIN = 0.85

/**
 * Innermost stable circular orbit, prograde, in Rs. a = 0 → 3, a → 1 → 0.5.
 *
 * Bardeen's Z₁/Z₂ form. This is the disk's inner edge: the single radius the
 * spin moves that the image cannot hide, because it sets the width of the dark
 * gap between the shadow and the bright rim.
 */
export const iscoRs = (a: number): number => {
  const z1 =
    1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a))
  const z2 = Math.sqrt(3 * a * a + z1 * z1)
  return (3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2))) / 2
}

/**
 * The prograde photon orbit, in Rs. a = 0 → 1.5 (the photon sphere),
 * a → 1 → 0.5. Frame dragging lets light orbiting *with* the spin survive
 * closer in; light orbiting against it is flung out, which is the retrograde
 * variant below.
 */
export const photonRs = (a: number): number =>
  1 + Math.cos((2 / 3) * Math.acos(-a))

/** The retrograde photon orbit, in Rs. a = 0 → 1.5, a → 1 → 2. */
export const photonRsRetro = (a: number): number =>
  1 + Math.cos((2 / 3) * Math.acos(a))

/**
 * The critical impact parameter for capture from the prograde side, in Rs:
 * how big the shadow is on the side the spin drags toward itself. a = 0 →
 * 3√3/2 (2.5980762), a → 1 → 1.
 *
 * From the circular-orbit conditions on the equatorial null radial potential
 * R = (r² + a² − ab)² − Δ(b − a)²: eliminating Δ between R = 0 and dR/dr = 0
 * gives b = a − r(r² − 3r + 2a²)/(a(r − 1)) evaluated at the photon orbit.
 * The a = 0 limit is 0/0, so it is special-cased to the exact Schwarzschild
 * value — which is also the value the a = 0 frame must reproduce bit for bit.
 */
export const captureRs = (a: number): number => {
  if (a === 0) return SHADOW_RS
  const r = photonRs(a) * 2
  return (a - (r * (r * r - 3 * r + 2 * a * a)) / (a * (r - 1))) / 2
}

/** The same from the retrograde side: a = 0 → 2.5980762, a → 1 → ~3.5. */
export const captureRsRetro = (a: number): number => {
  if (a === 0) return SHADOW_RS
  const r = photonRsRetro(a) * 2
  return (-a + (r * (r * r - 3 * r + 2 * a * a)) / (a * (r - 1))) / 2
}

/**
 * Gravitational radius while the well is merely charged, in metres.
 *
 * Sized against the room it has to stand next to, not against the finale. At the
 * bottom of the corridor the lens is 11.2 m from the singularity, so one metre of
 * Rs is worth `3.374 / 11.2 / tan(23°)` = 0.71 half-frame-heights on the
 * retrograde edge. 0.52 put the fully-charged shadow at 0.37 of a half-height — a
 * black disc three quarters of the frame tall standing beside a console panel that
 * is still assembled, which is what a visitor described as the hole having already
 * swallowed the page before the ending starts. 0.24 puts it at 0.17: the largest
 * thing in the frame, unmistakably the destination, and still an object *in* a room
 * rather than the room's replacement. The shadow is then ~0.62 m and the disk
 * ~2.4 m.
 *
 * The size the ending needs is not taken away by this — `RS_OPEN` is reached
 * through `swell` and is unchanged, so lowering this makes the finale a 12.3×
 * opening instead of a 5.7× one. The licence was always meant to be spent at the
 * end.
 */
const RS_CHARGED = 0.24

/**
 * ...and how much of that it already has on the opening frame.
 *
 * Re-derived, not retuned: `RS_CHARGED · RS_DORMANT` is 0.078 m either side of the
 * change above, bit for bit, because the opening frame was never the thing that was
 * wrong. The well is the galaxy's nucleus and the galaxy is drawn from frame one,
 * so the shadow starts at 0.019 half-frame-heights — 6.9 px of radius on the
 * shortest frame the cinema path is given, against a floor of 3 — and the accretion
 * disk starts at 0.057, comfortably inside the bulge it is the middle of. Both are
 * asserted in `scripts/check-kerr.ts` and both are unmoved.
 *
 * A third rather than a seventh only because `RS_CHARGED` came down by the same
 * factor. The ratio is the free variable here; the product is the measurement.
 */
const RS_DORMANT = 0.325

/**
 * ...and once the room is going in.
 *
 * The well opening is the finale's one piece of licence. A real hole's mass is
 * fixed and it is the *viewer* who closes the distance; here both happen, because
 * the corridor is only twenty-four metres long and an ending that depends on
 * travelling far enough would have to be either much longer or much less. The
 * shadow reaching past the frame edges is the beat the whole page is built
 * toward, and this is the number that guarantees it arrives.
 *
 * It did not, at 0.96. That number is a survivor of the era when `APPROACH_Z` was
 * 2.4 m short and the lens ended up 2.2 m from the singularity — at *that*
 * distance 0.96 m of Rs subtended most of the frame, and it was the reason the
 * ending went black. `APPROACH_Z` was fixed and the lens now stops 10.2 m out;
 * 0.96 was never re-derived against it, so the shadow's widest apparent radius at
 * the end of the rail came to 0.75 in half-frame-heights — three quarters of the
 * way to the top edge of a 16:9 viewport and under half the way to the side. A
 * jewel at the end of a corridor, which is what a visitor reported: the well never
 * ate anything.
 *
 * Re-derived here from the shot instead. The widest edge of the shadow is
 * `captureRsRetro(a) · Rs` at 10.2 m through a 46° lens, so one metre of Rs is
 * worth `3.374 / 10.2 / tan(23°)` = 0.78 half-frame-heights. 1.58 puts the
 * retrograde edge at 1.23 and the top and bottom at 0.89 before the crossing, and
 * `CROSSING_SWELL` carries it the rest of the way past the corners.
 * `scripts/check-kerr.ts` asserts both ends of that: the shadow has to cover the
 * frame's own half-height, and it has to leave the prograde side short of the
 * half-diagonal so there is always something for the ring to close over.
 */
const RS_OPEN = 1.58

/**
 * How much further the crossing itself opens the well.
 *
 * The last eleven percent of the rail is the horizon arriving, and it is the one
 * stretch where growing Rs costs nothing anywhere else: the room has already gone,
 * the depth guard has already lifted, and the lens is already parked on its clamp.
 * So the swell that could not be spent earlier without putting a jewel-sized
 * shadow over a room that was still standing gets spent here, which is what turns
 * the ending from a shadow that stops growing into one that goes past the frame.
 *
 * Monotone in scroll, because `crossing` is — the whole ending stays scrubbable.
 */
const CROSSING_SWELL = 0.55

/**
 * How far the disk's axis is tipped off the room's vertical, in radians.
 *
 * The single most consequential number in the finale. The camera flies down a
 * corridor at eye height toward a hole at eye height, so a disk lying in the
 * floor plane is seen almost exactly edge-on — and edge-on is the orientation in
 * which a black hole looks like a black hole: the near side of the disk crosses
 * *below* the shadow, the far side is lensed up and over the *top* of it, and the
 * two join into the closed band that no other object in nature produces.
 *
 * Tipping it ~20° off vertical opens enough of the upper face for the band to
 * have thickness when the camera stays level with the aperture. More than that
 * reads as looking down a hole in the floor; face-on collapses the three arcs
 * into a spinning ring.
 */
const DISK_TILT = 0.35

/**
 * Where the gate's aperture actually is, relative to `PORTAL_POSITION`.
 *
 * The gate is a freestanding mechanism — columns, a lintel, a stator ring — and
 * the opening it holds is at the stator's own middle, not at the room's general
 * "destination" height. `FinaleGate` parks its group at `PORTAL_POSITION` on the
 * X/Z plane but at world Y = 0, then places every ring and collar at local
 * Y = `GATE_APERTURE_Y` and a further `GATE_APERTURE_Z_AHEAD` toward the camera —
 * so the aperture's true world position is offset from `PORTAL_POSITION` by
 * exactly these two numbers, and anything that has to line up with the aperture
 * (the singularity below, the camera's swallow target in `Rig`) has to read them
 * from here rather than re-deriving them, or the mechanism and the thing it
 * frames drift apart the moment one of the two is retuned.
 */
export const GATE_APERTURE_Y = 2.55
export const GATE_APERTURE_Z_AHEAD = 2.4

/**
 * The singularity, in world space.
 *
 * Exactly the gate's aperture, not `PORTAL_POSITION` — the aperture is the thing
 * the mechanism was built to hold open, so it is the only point a black hole
 * drawn inside that mechanism can be centred on without the ring and the well it
 * rings visibly disagreeing about where "here" is.
 */
export const holeCenter = new THREE.Vector3(
  PORTAL_POSITION[0],
  GATE_APERTURE_Y,
  PORTAL_POSITION[2] + GATE_APERTURE_Z_AHEAD,
)

/**
 * Where the lens is drawn to as the room goes in: short of the gate, on the axis.
 *
 * Split out of `Rig` because the effect that draws the hole has to know how close
 * the camera will ever get — the entire shape of the shot is the ratio between
 * that distance and Rs above, and having the two live in different files is how
 * you end up with a camera parked inside its own event horizon.
 *
 * Measured from the singularity, which is the correction this line records. It
 * used to read `PORTAL_POSITION[2] + 4`, and `PORTAL_POSITION` is not where the
 * well is — the aperture the well is centred on stands `GATE_APERTURE_Z_AHEAD`
 * further along, so every distance derived from it was 2.4 m short. The lens's
 * approach ended 1.6 m from a hole whose Rs had opened to 0.96, the plunge then
 * carried it another 2.07 m, and the last third of the ending was shot from
 * *inside* the shadow: a black frame, which is exactly what a viewer reported
 * seeing. Declared below `holeCenter` so the two can never drift again.
 */
export const APPROACH_Z = holeCenter.z + 12
/** How much further the last stretch carries the lens — through the doorway. */
export const PLUNGE_DEPTH = 1.8

/**
 * Closest the lens ever gets to the singularity, in metres.
 *
 * 10.2 m against RS_OPEN's 0.96 m is r ≈ 10.6 Rs, well outside the Kerr photon
 * orbit (~0.85 Rs at a = 0.85). `closestApproach` also floors against
 * photonRs(a) * rs * 1.15 so a later Rs swell cannot put the lens inside.
 *
 * This is a floor `Rig` clamps against, not merely a description: the plunge
 * carries a gulp kick on top of `PLUNGE_DEPTH`, and no amount of retuning that
 * kick may be allowed to put the camera through its own horizon.
 */
export const PLUNGE_RADIUS = APPROACH_Z - PLUNGE_DEPTH - holeCenter.z

/**
 * Where the lens stops trusting a screen-space fetch, as fractions of the lens's
 * own distance to the singularity.
 *
 * A bent ray fetches whatever texel it lands on with no idea how far away that
 * texel was, so the pass has to decide for itself what counts as *behind* the
 * well. These two are that line: the sample is taken at `LENS_FAR` and beyond,
 * dropped below `LENS_NEAR`, and cross-faded between them so the rim has no edge.
 *
 * They are this tight because of what they have to separate, and the separation
 * is not available at any wider setting. The rule is "only what is *at* the well
 * is lensed by it": the gate's aperture is centred on the singularity and reads
 * 1.000, while the gate's own structure reaches `GATE_APERTURE_Z_AHEAD` toward
 * the lens and reads 0.926 — and a body standing in the corridor can read 0.933,
 * which is nearer the well than the gate's columns are. So a band wide enough to
 * spare the mechanism is also wide enough to lens the corridor, and the mechanism
 * loses: a column two metres in front of a black hole is not bent around it
 * either.
 *
 * Written as fractions rather than metres because the lens closes on the well
 * throughout, and a fixed distance would mean something different at every point
 * of the approach. `scripts/check-kerr.ts` holds the width honest — widen the
 * band and the corridor starts coming back as ghosts of itself lensed beside the
 * nucleus, which is the regression these numbers exist to prevent.
 */
export const LENS_NEAR = 0.96
export const LENS_FAR = 0.995

/** Closest the lens may sit, in metres: authored floor vs the Kerr photon orbit. */
export const closestApproach = (rs: number, a = HOLE_SPIN): number =>
  Math.max(PLUNGE_RADIUS, photonRs(a) * rs * 1.15)

/**
 * Gravitational radius for a given point in the story.
 *
 * The well is charged by the corridor and opened by the ending, but it is never
 * *created* by either: it starts at `RS_DORMANT` of its charged radius on the
 * opening frame, because the galaxy it is the nucleus of is drawn on the opening
 * frame too. The corridor feeds it; it does not switch it on.
 */
export const holeRadiusFor = (build: number, swallow: number): number => {
  /*
   * The corridor charges the well *late*, and the third power is the whole fix.
   *
   * `smoothstep(build, 0.1, 0.96)` spent its steepest stretch at build 0.5, so the
   * well was at 40% of charge before the visitor had read half the consoles and at
   * 68% by 0.6 — the object at the end of the corridor arrived at the middle of it,
   * and there was nothing left for the last screen of scroll to do. Cubing a curve
   * that is already eased at both ends moves the work to the end without introducing
   * a knee: the well is at 4% of charge at build 0.4 and 23% at 0.6, and the *whole*
   * of the second half of the rail is the growth.
   *
   * The upper edge is 1 rather than 0.96 for the same reason — 0.96 finished the
   * charge four percent of scroll early, which with the lens still closing over that
   * stretch is a well that visibly stops growing before the corridor ends. The lower
   * edge moves 0.1 → 0.06 to put a little charge under the hero transit, so the
   * nucleus is already feeding while the lens is inside the optic.
   *
   * Measured against the failure this replaces: the apparent shadow's steepest rate
   * of change over the corridor falls from 0.84 to 0.48 half-frame-heights per unit
   * build, and the worst growth inside any five percent of scroll from 1.28× to
   * 1.23×. The late curve is *smoother* than the one it replaces, not poppier — the
   * old curve's peak rate was the camera closing and the charge ramping at the same
   * moment, and separating the two is what buys both the small corridor and the
   * absence of a switch-on.
   */
  const charge = THREE.MathUtils.smoothstep(build, 0.06, 1) ** 3
  const open = swallowShape(swallow)
  /*
   * The drain leads, `grip` holds the end of the schedule.
   *
   * `pull * 0.55 + grip * 0.45` left the well only an eighth open at the second
   * gulp, so the shadow was still a jewel while the room was already halfway
   * down it. Weighting the drain moves that forward — but only so far: a first
   * pass at 0.7/0.3 opened Rs to 0.83 by swallow 0.83, which with the lens
   * 2.2 m out put the camera inside the shadow's apparent radius and turned the
   * last fifth of the ending into a black frame. Keeping most of the weight on
   * `grip` leads the old curve without arriving before the rail does.
   */
  const swell = Math.min(1, open.drain * 0.45 + open.grip * 0.55)
  return (
    THREE.MathUtils.lerp(
      RS_CHARGED * (RS_DORMANT + charge * (1 - RS_DORMANT)),
      RS_OPEN,
      swell,
    ) *
    (1 + open.drain * 0.1) *
    // ...and the crossing takes it the rest of the way out of the frame.
    (1 + open.crossing * CROSSING_SWELL)
  )
}

/**
 * The shadow's widest apparent radius, in half-frame-heights.
 *
 * The one number that answers "does the well actually eat the viewport", and it is
 * here rather than inside `CinemaLayer` because the check script has to be able to
 * ask it without a canvas. `captureRsRetro` because the retrograde edge of the D
 * reaches furthest; a figure fitted to the prograde side would claim the frame was
 * covered while half of it still had disk in it.
 *
 * `1` is the top and bottom edge of the frame by construction, and the side edges
 * sit at the viewport's aspect ratio — so the frame's half-diagonal is
 * `hypot(aspect, 1)`, which is the ceiling the ending must *not* clear.
 */
export const apparentShadow = (
  rs: number,
  distance: number,
  fovDegrees: number,
  a = HOLE_SPIN,
): number =>
  Math.tan(Math.atan2(captureRsRetro(a) * rs, Math.max(distance, rs))) /
  Math.tan(THREE.MathUtils.degToRad(fovDegrees) / 2)

/**
 * The photon ring's Gaussian σ, as a fraction of the capture radius.
 *
 * 2.2% is the figure the references carry: EHT's published rings are beam-blurred
 * to roughly half their own diameter, but the intrinsic ring behind those papers —
 * and the filament tracing the top of the shadow in NASA's edge-on render — is on
 * the order of one percent of the shadow's *diameter*.
 *
 * It is also a width in metres at the hole, and what has to stay legible is a
 * width in pixels. For the whole corridor the well is thirty metres off and the
 * narrow edge of its D covers about a dozen pixels of radius, so the honest 2.2%
 * is a quarter of a pixel — and a Gaussian narrower than the grid it is sampled on
 * does not draw faint, it draws as a dashed line that crawls along the rim as the
 * camera moves. That is not a black hole with a subtle ring, it is an artefact,
 * and it is what would have made the nucleus at corridor distance read as a bug.
 *
 * So the fraction is floored at whatever buys `RING_PIXELS` of them. A frame is two
 * half-frame-heights tall, hence the 2. `narrow` is the *prograde* edge's apparent
 * radius — the flattened side of the D, and therefore the side that runs out of
 * pixels first; fitting the floor to the wide side would leave the narrow one
 * dashed. Above that size the physical width wins and this does nothing at all.
 */
export const RING_SIGMA = 0.022
const RING_PIXELS = 1.25

export const ringWidthFor = (narrow: number, framePixels: number): number =>
  Math.max(
    RING_SIGMA,
    (RING_PIXELS * 2) / (framePixels * Math.max(narrow, 1e-4)),
  )

/**
 * How hot the nucleus burns, before the room's own light is added, 0 → 1.
 *
 * This replaces a ramp called `holeGateFor` that answered "how present is the
 * well" with a number that started at zero and reached one at build 0.94, and
 * every layer multiplied itself by it — so for three quarters of the page the
 * answer to "where is the black hole" was that there wasn't one. That was
 * defensible while the well was a mechanism at the end of a corridor waiting to
 * be switched on. It stopped being defensible the moment the galaxy was centred
 * on it: a spiral with a hole where its nucleus should be is not a galaxy with a
 * surprise coming, it is a galaxy with a bug.
 *
 * So presence is no longer a ramp at all — the well is drawn from the first
 * frame, at `RS_DORMANT` of its size — and what is left for a ramp to describe is
 * the only thing that honestly varies: how hard the thing is feeding. A quiescent
 * nucleus at two fifths, climbing as the corridor charges. Never zero, because an
 * accretion disk that goes out is not a dimmer nucleus, it is a different object —
 * and two fifths rather than three tenths because the billboard the no-post-chain
 * path draws has nothing else to carry the object with, so a floor that reads on
 * cinema as a restrained disk reads on lite as an empty circle.
 *
 * Normalised, not in any layer's own units: the finale's light and the room's
 * ignition are both far brighter than a quiescent nucleus, so each caller scales
 * this into whatever it is comparing against rather than the ramp guessing.
 *
 * `Atmosphere`'s ambient glow at the end of the room hands over on
 * `holeRender.lensing` rather than on this, so there is still never a moment
 * where the destination is neither lit nor drawn.
 */
export const holeGlowFor = (build: number): number =>
  0.4 + THREE.MathUtils.smoothstep(build, 0.08, 0.82) * 0.6

/**
 * The disk's axis, in world space.
 *
 * Precesses, slowly and by very little. A perfectly fixed axis reads as a decal;
 * a degree and a half of wander over half a minute is enough for the band to
 * breathe without ever looking like it is being animated.
 */
export const holeAxis = (out: THREE.Vector3, time: number): THREE.Vector3 => {
  const wobble = Math.sin(time * 0.11) * 0.026
  return out
    .set(
      Math.sin(wobble),
      Math.cos(DISK_TILT),
      // Toward the camera: enough tip for the near/far band from a level shot.
      Math.sin(DISK_TILT),
    )
    .normalize()
}

/**
 * Which layer is drawing the well.
 *
 * Two of them can: the composer's geodesic pass, which is the real one, and the
 * gate's own billboard, which is what a device without a post chain gets. They
 * must never both be on — two accretion disks in the same aperture is not twice
 * the light, it is a bright smear with no structure — so the expensive one claims
 * the disk on mount and the cheap one stands down while the claim is held.
 *
 * A ref count rather than a boolean because the composer can unmount and remount
 * on a governor demotion, and a stale `false` would leave the finale with no light
 * in it at all.
 */
const claims = { lensing: 0 }

export const holeRender = {
  /** True while the composer is drawing the hole for real. */
  get lensing() {
    return claims.lensing > 0
  },
}

export const claimLensing = (): (() => void) => {
  claims.lensing += 1
  return () => {
    claims.lensing = Math.max(0, claims.lensing - 1)
  }
}
