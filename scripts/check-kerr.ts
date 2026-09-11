/**
 * The well's geometry, checked without a canvas.
 *
 * The spin-dependent radii in src/scene/blackHole.ts are closed forms over one
 * parameter, so the whole contract can be tested here: the a = 0 values must be
 * Schwarzschild exactly (the corridor's frame is built against those numbers), the
 * prograde radii must fall as the spin rises, and the retrograde side must widen —
 * the asymmetry the D-shaped shadow is made of.
 *
 * Then the two things about the *shot* that cannot be checked by reading either
 * file: that the shadow grows large enough to swallow the frame, and that it stops
 * short of swallowing all of it. And last, the one piece of arithmetic inside the
 * shader that can fail silently — the disk's advected-noise cross-fade, which is a
 * weight identity and therefore testable here even though the code it mirrors is
 * GLSL.
 *
 *   pnpm exec tsx scripts/check-kerr.ts
 */
import assert from 'node:assert/strict'
import {
  apparentShadow,
  captureRs,
  captureRsRetro,
  closestApproach,
  DISK_OUTER_RS,
  holeCenter,
  HOLE_SPIN,
  GATE_APERTURE_Z_AHEAD,
  holeGlowFor,
  holeRadiusFor,
  iscoRs,
  LENS_FAR,
  LENS_NEAR,
  PHOTON_RS,
  photonRs,
  photonRsRetro,
  PLUNGE_RADIUS,
  RING_SIGMA,
  ringWidthFor,
  SHADOW_RS,
} from '../src/scene/blackHole'
import { CAMERA_PATH, cameraProgressFor } from '../src/scene/layout'
import { BASE_FOV } from '../src/scene/viewportFit'

// a = 0 is Schwarzschild, bit for bit where the frame depends on it.
assert.equal(iscoRs(0), 3, 'ISCO at a=0 must be exactly 3 Rs')
assert.equal(captureRs(0), SHADOW_RS, 'capture at a=0 must be exactly 3√3/2')
assert.equal(captureRsRetro(0), SHADOW_RS, 'retro capture at a=0 must match')
assert.ok(
  Math.abs(photonRs(0) - PHOTON_RS) < 1e-12,
  'photon sphere at a=0 must be 1.5 Rs',
)
assert.ok(
  Math.abs(photonRsRetro(0) - PHOTON_RS) < 1e-12,
  'retro photon orbit at a=0 must be 1.5 Rs',
)

// Monotonicity across the physical range: spin pulls the prograde side in and
// pushes the retrograde side out. Sampled, not endpoint-only, because the Z₁/Z₂
// form has a subtraction that can turn non-monotone if it loses precision.
const SPIN_SAMPLES = 200
const monotone = (f: (a: number) => number, direction: 1 | -1, label: string) => {
  let previous = f(0)
  for (let index = 1; index <= SPIN_SAMPLES; index += 1) {
    const a = (index / SPIN_SAMPLES) * 0.998
    const value = f(a)
    assert.ok(
      (value - previous) * direction >= -1e-12,
      `${label} moved the wrong way at a=${a.toFixed(3)} (${previous} → ${value})`,
    )
    previous = value
  }
}
monotone(iscoRs, -1, 'ISCO')
monotone(photonRs, -1, 'photon orbit')
monotone(captureRs, -1, 'prograde capture')
monotone(photonRsRetro, 1, 'retrograde photon orbit')
monotone(captureRsRetro, 1, 'retrograde capture')

// The asymmetry itself: with spin, the shadow is wider on the retrograde side.
for (const a of [0.3, 0.7, 0.9, 0.998]) {
  assert.ok(
    captureRsRetro(a) > captureRs(a),
    `shadow must lean retrograde at a=${a}`,
  )
}

// Closed forms still behave at the edge of the physical range (not the site spin).
const A = 0.998
assert.ok(iscoRs(A) > 0.5 && iscoRs(A) < 0.75, `iscoRs(0.998)=${iscoRs(A)}`)
assert.ok(
  photonRs(A) > 0.5 && photonRs(A) < 0.6,
  `photonRs(0.998)=${photonRs(A)}`,
)
assert.ok(
  captureRs(A) > 0.95 && captureRs(A) < 1.2,
  `captureRs(0.998)=${captureRs(A)}`,
)
assert.ok(
  captureRsRetro(A) > 3.0 && captureRsRetro(A) < 4.0,
  `captureRsRetro(0.998)=${captureRsRetro(A)}`,
)

// Working spin: ISCO in, photon in, D still has a gap.
assert.equal(HOLE_SPIN, 0.85, 'site spin is 0.85 — 0.998 is out of scope')
assert.ok(
  iscoRs(HOLE_SPIN) > 1.2 && iscoRs(HOLE_SPIN) < 1.7,
  `iscoRs(0.85)=${iscoRs(HOLE_SPIN)}`,
)
assert.ok(
  photonRs(HOLE_SPIN) > 0.75 && photonRs(HOLE_SPIN) < 1.1,
  `photonRs(0.85)=${photonRs(HOLE_SPIN)}`,
)
assert.ok(
  iscoRs(HOLE_SPIN) > photonRs(HOLE_SPIN),
  'the disk rim must sit outside the photon orbit',
)

// The lens must never reach the photon sphere: closest approach against the
// deepest the well can ever open, with margin. A number that lies here is a
// black frame in the last fifth of the ending.
const deepestRs = holeRadiusFor(1, 1)
assert.ok(
  closestApproach(deepestRs) >= photonRs(HOLE_SPIN) * deepestRs * 1.15 - 1e-12,
  `plunge (${closestApproach(deepestRs)} m) enters the photon sphere ` +
    `(${photonRs(HOLE_SPIN)} Rs × ${deepestRs} m)`,
)
assert.ok(
  closestApproach(deepestRs) >= PLUNGE_RADIUS - 1e-12,
  'authored approach floor must still hold',
)

/*
 * The swallow, in frame units: does the well actually eat the viewport?
 *
 * `RS_OPEN` is the finale's one deliberate piece of licence and it is also the
 * number most likely to be nudged by someone tuning the look, so the two things it
 * is allowed to be between are asserted here rather than described in a comment.
 * Both are geometry — the lens's distance, its field of view and the retrograde
 * edge of the D — so neither needs a canvas to check.
 *
 * The widest viewport the site is composed for is the one with the least shadow
 * coverage per Rs relative to its own diagonal, so the ceiling is tested there and
 * the floor at the reference framing. 21:9 is as wide as a desktop realistically
 * gets; a portrait phone never reaches this code path (it resolves `lite` and gets
 * the billboard).
 */
const ENDING_DISTANCE = closestApproach(deepestRs)
const shadowAtEnd = apparentShadow(deepestRs, ENDING_DISTANCE, BASE_FOV)
// Floor: the shadow has to reach past the top and bottom of the frame. Half-height
// is 1 by construction, so anything under 1 is a jewel at the end of a corridor.
assert.ok(
  shadowAtEnd > 1.05,
  `the shadow must swallow the frame height at the end of the rail — ` +
    `apparent radius ${shadowAtEnd.toFixed(3)} of a half-height of 1`,
)
/*
 * Ceiling: the *prograde* edge — the narrow side of the D, and the one the bright
 * approaching limb sits on — must stay inside the frame's half-diagonal, or the
 * last stretch is a fully black rectangle with nothing left for the ring to close
 * over. That is the regression `RS_OPEN` carries a scar for.
 */
const WIDEST_ASPECT = 21 / 9
const halfDiagonal = Math.hypot(WIDEST_ASPECT, 1)
const prograde =
  shadowAtEnd * (captureRs(HOLE_SPIN) / captureRsRetro(HOLE_SPIN))
assert.ok(
  prograde < halfDiagonal,
  `the prograde edge must leave the corner lit for the ring — ` +
    `${prograde.toFixed(3)} against a half-diagonal of ${halfDiagonal.toFixed(3)}`,
)
// And the lens must sit outside even the widest edge of the shadow it is looking
// at, not merely outside the photon sphere: inside it, every ray is captured and
// the pass has no image left to draw.
assert.ok(
  ENDING_DISTANCE > captureRsRetro(HOLE_SPIN) * deepestRs * 1.1,
  `lens at ${ENDING_DISTANCE.toFixed(2)} m is inside the retrograde shadow ` +
    `(${(captureRsRetro(HOLE_SPIN) * deepestRs).toFixed(2)} m)`,
)

// Growing monotonically to get there, because the ending has to scrub backwards.
let previousRs = holeRadiusFor(1, 0)
for (let index = 1; index <= 400; index += 1) {
  const rs = holeRadiusFor(1, index / 400)
  // `suction` is a beat and rides on top of the swell, so a gulp's release is
  // allowed to give a little back — the same 5% bound `check-swallow.ts` holds.
  assert.ok(
    rs >= previousRs * 0.95,
    `Rs collapsed at swallow=${(index / 400).toFixed(3)} (${previousRs} → ${rs})`,
  )
  previousRs = Math.max(previousRs, rs)
}

/*
 * The disk's advected-noise cross-fade, mirrored from `bhDisk`.
 *
 * Two copies of the gas pattern, half a period out of step. Two things have to hold
 * at every instant or the band visibly breaks: the weights must sum to exactly one
 * (or the disk pulses brighter and dimmer once per period, which reads as the well
 * flickering), and a copy's weight must be zero at the moment it is re-seeded (or
 * the pop is on screen). Both are one line of arithmetic in the shader and neither
 * has any other place it can be tested.
 */
const BH_KEP_PERIOD = 7
const triangle = (t: number) => 1 - Math.abs(1 - 2 * (t - Math.floor(t)))
for (let index = 0; index <= 4000; index += 1) {
  // Deliberately swept past several periods, and off the integers, so the sum is
  // checked where floating point is least comfortable rather than only at 0 and 0.5.
  const flow = (index / 4000) * BH_KEP_PERIOD * 5.37
  const phase = flow / BH_KEP_PERIOD
  const carry = triangle(phase)
  assert.ok(
    Math.abs(carry + triangle(phase + 0.5) - 1) < 1e-12,
    `cross-fade weights sum to ${carry + triangle(phase + 0.5)} at flow=${flow}`,
  )
  assert.ok(carry >= 0 && carry <= 1, `cross-fade weight out of range at ${flow}`)
}
// The lead copy re-seeds on integer phase and the lag copy half a period later, so
// each has to be weighted out at its own seam and not at the other's.
for (const seam of [0, 1, 2, 5, 137]) {
  assert.ok(
    triangle(seam) < 1e-12,
    `the lead copy is visible (${triangle(seam)}) at phase ${seam}, where it re-seeds`,
  )
  assert.ok(
    1 - triangle(seam + 0.5) < 1e-12,
    `the lag copy is visible at phase ${seam + 0.5}, where it re-seeds`,
  )
}

/*
 * The other end of the object's life: the nucleus on the opening frame.
 *
 * The well is the galaxy's own middle and it is drawn from the first frame, so the
 * size it has *there* is now as load-bearing as the size it has at the end — and it
 * is bounded on both sides, but not symmetrically, and this is where the floor
 * used to be wrong. It read `nucleus > 0.045` — a *large* nucleus on the opening
 * frame — from back when the well had to announce itself before the corridor could
 * hand over to it. The shot is now the other way round: the well is a small dark
 * bite in the middle of a distant galaxy, and the whole of the approach is it
 * growing. So the floor is no longer about apparent size at all.
 *
 * What actually fails when the nucleus is too small is legibility, and legibility
 * has two separate failure modes with two separate floors. The photon ring going
 * sub-pixel is the one that fails silently in motion, and it has its own check
 * further down against `ringWidthFor`. This is the other one: the shadow itself has
 * to be a resolvable dark disk rather than a single dim sample, or the middle of
 * the bulge reads as a dead pixel. Three pixels of radius on the shortest frame the
 * cinema path is ever given is that line — and at the authored `RS_DORMANT` there
 * are seven, so the intent is a small nucleus with margin, not a nucleus tuned to
 * the edge of disappearing.
 *
 * Measured from the camera path's own first point rather than from a figure, so a
 * retune of the establishing shot moves this with it.
 */
const OPENING = CAMERA_PATH.getPointAt(0).distanceTo(holeCenter)
const nucleusRs = holeRadiusFor(0, 0)
const nucleus = apparentShadow(nucleusRs, OPENING, BASE_FOV)
// A frame is two half-frame-heights tall, hence the halving.
const SHORTEST_FRAME = 720
assert.ok(
  nucleus * SHORTEST_FRAME * 0.5 > 3,
  `the nucleus is a dead pixel on the opening frame — ${(
    nucleus * SHORTEST_FRAME * 0.5
  ).toFixed(1)} px of radius at ${SHORTEST_FRAME}px, ${OPENING.toFixed(1)} m out`,
)
/*
 * ...and the ceiling, which is the same number pushed the other way.
 *
 * The galaxy's bright core — the exponential disk's scale length, not its outer
 * radius — subtends about 0.14 half-frame-heights from here. The accretion disk is
 * `DISK_OUTER_RS` against the shadow's `captureRsRetro`, so it draws about three
 * times whatever this is; past 0.075 the disk is more than half again as wide as
 * the bulge it is supposed to be the middle of, and the well stops reading as the
 * galaxy's nucleus and starts reading as an object parked in front of it.
 */
assert.ok(
  nucleus * (DISK_OUTER_RS / captureRsRetro(HOLE_SPIN)) < 0.22,
  `the disk is wider than the galaxy around it — shadow ${nucleus.toFixed(4)}, ` +
    `disk ${(nucleus * (DISK_OUTER_RS / captureRsRetro(HOLE_SPIN))).toFixed(4)}`,
)

/* ------------------------------------- the corridor is the charge, not the ending */

/*
 * The middle of the object's life, which nothing here used to bound.
 *
 * `build = 0` is asserted above and `swallow = 1` further up, and between the two
 * the script had no opinion — so `charge` was free to ramp the well to its full
 * charged radius by the middle of the rail, and it did. At the bottom of the
 * corridor, with the room still standing and the finale not yet begun, the shadow
 * covered 0.37 of a half-frame-height: three quarters of the frame's height of black
 * next to a console panel that had not been swallowed by anything. A visitor reads
 * that as the ending having already happened, and then the ending has nothing to be.
 *
 * Measured off the camera path rather than off a figure, exactly as the opening
 * frame is, so a retune of the dolly or of `cameraProgressFor` moves these with it.
 */
const lensAt = (build: number) =>
  CAMERA_PATH.getPointAt(cameraProgressFor(build)).distanceTo(holeCenter)
const shadowAt = (build: number) =>
  apparentShadow(holeRadiusFor(build, 0), lensAt(build), BASE_FOV)

/*
 * Bounded on both sides at the bottom of the corridor, and asymmetrically.
 *
 * The ceiling is the regression above: past a quarter of a half-height the well
 * stops being the destination at the end of the room and starts being the room. The
 * floor is the opposite failure — twenty-four metres of corridor that ends on a
 * jewel is the thing `RS_DORMANT`'s comment records as the original bug, and it is
 * what an over-corrected charge curve produces. 0.17 sits between them with margin
 * either way.
 */
const corridorEnd = shadowAt(1)
assert.ok(
  corridorEnd > 0.11 && corridorEnd < 0.24,
  `the well is the wrong size at the bottom of the corridor, before the ending has ` +
    `begun — ${corridorEnd.toFixed(3)} of a half-frame-height, wanted 0.11…0.24`,
)

/*
 * ...and it gets there late.
 *
 * Past halfway down the rail the well must still be a minority of what it will be at
 * the bottom of it, or the corridor has spent the growth the ending needs. The curve
 * this replaced read 0.42 here — the well was nearly half-open with two fifths of
 * the consoles still unread.
 */
assert.ok(
  shadowAt(0.6) < corridorEnd * 0.36,
  `the well opens in the corridor instead of at the end — ${(
    shadowAt(0.6) / corridorEnd
  ).toFixed(3)} of its bottom-of-corridor size at build 0.6`,
)

/*
 * The beat itself: the ending has to be where the growth is.
 *
 * `shadowAtEnd` is computed above against the same `deepestRs`; this is the ratio
 * the visitor actually experiences, and it is the one number that says "the well
 * swallows the room at the end" rather than "the well was always going to be big".
 * The curve this replaced scored 5.7 — the corridor grew the shadow 19× and the
 * finale only 5.7× more, which is a hole that arrives early and then merely gets
 * closer.
 */
const endingMultiple = shadowAtEnd / corridorEnd
assert.ok(
  endingMultiple > 8,
  `the finale is not where the well opens — it grows ${endingMultiple.toFixed(
    1,
  )}× across the whole ending, against ${(corridorEnd / shadowAt(0)).toFixed(
    1,
  )}× across the corridor`,
)

/*
 * ...without switching on.
 *
 * The other half of the correction, and the one that fails silently: a charge
 * deferred far enough reads as the well being *created* at the end of the rail
 * rather than fed by it, and a still frame never shows it. Bounded as growth per
 * unit scroll, because that is what an eye integrates — and on apparent size rather
 * than on Rs, since the lens is closing over the same stretch and the two multiply.
 * A fifth of the rail is a couple of screens of wheel; nothing in frame may half
 * again inside one.
 *
 * The authored curve scores 1.23 and the one it replaced 1.28, so this is a ceiling
 * on future retunes rather than a description of either.
 */
let worstStep = 1
for (let index = 0; index <= 1900; index += 1) {
  const build = index / 2000
  worstStep = Math.max(worstStep, shadowAt(build + 0.05) / shadowAt(build))
}
assert.ok(
  worstStep < 1.35,
  `the well switches on rather than charging — it grows ${worstStep.toFixed(
    2,
  )}× inside five percent of scroll`,
)

// ...and it only ever grows from there, so the corridor is a charge and not a
// flicker. `swallow` is held at 0: the ending's own growth is asserted above.
let previousCharge = holeRadiusFor(0, 0)
for (let index = 1; index <= 200; index += 1) {
  const rs = holeRadiusFor(index / 200, 0)
  assert.ok(rs >= previousCharge - 1e-12, `Rs fell at build=${index / 200}`)
  previousCharge = rs
}

/*
 * The nucleus never goes out.
 *
 * `holeGlowFor` is the floor under every emissive term in the pass, and the whole
 * of the first fix is that it is a floor rather than a ramp from zero: at zero the
 * disk, the ring and the jets are all multiplied to nothing and the galaxy has a
 * hole where its middle should be.
 */
assert.ok(holeGlowFor(0) > 0.25, `the nucleus starts dark: ${holeGlowFor(0)}`)
let previousGlow = holeGlowFor(0)
for (let index = 1; index <= 200; index += 1) {
  const glow = holeGlowFor(index / 200)
  assert.ok(glow >= previousGlow - 1e-12, `glow fell at build=${index / 200}`)
  assert.ok(glow <= 1 + 1e-12, `glow left the unit range: ${glow}`)
  previousGlow = glow
}
assert.ok(holeGlowFor(1) > 0.99, `the nucleus never reaches full: ${holeGlowFor(1)}`)

/*
 * The photon ring is never thinner than a pixel.
 *
 * The one quantity in this pass that fails *silently in motion*: a Gaussian
 * narrower than the sample grid renders as a dashed line that crawls along the rim
 * rather than as a faint filament, and a still frame does not show it. Checked at
 * both ends of the object's life and at the smallest frame the cinema path is ever
 * given — the governor demotes below roughly 720p, and a shorter frame is the case
 * where the floor has to bite hardest.
 */
const ringPixels = (rs: number, distance: number, framePixels: number) => {
  const narrow =
    apparentShadow(rs, distance, BASE_FOV) *
    (captureRs(HOLE_SPIN) / captureRsRetro(HOLE_SPIN))
  // σ as a fraction, times the narrow edge's own radius in pixels.
  return (
    ringWidthFor(narrow, framePixels) * narrow * framePixels * 0.5
  )
}
for (const framePixels of [720, 900, 1440]) {
  assert.ok(
    ringPixels(nucleusRs, OPENING, framePixels) > 1.1,
    `the ring is sub-pixel on the opening frame at ${framePixels}px: ` +
      `${ringPixels(nucleusRs, OPENING, framePixels).toFixed(2)} px`,
  )
}
// ...and at the end the physics wins outright: the floor must not be fattening a
// filament that is already several pixels wide.
const endNarrow =
  shadowAtEnd * (captureRs(HOLE_SPIN) / captureRsRetro(HOLE_SPIN))
assert.equal(
  ringWidthFor(endNarrow, 900),
  RING_SIGMA,
  `the pixel floor is still widening the ring at the end of the rail: ` +
    `${ringWidthFor(endNarrow, 900)}`,
)

/* ------------------------------------------------- the lens's own depth guard */

/*
 * The band inside which a bent ray may fetch what it lands on.
 *
 * A screen-space lens has no idea how far away the texel it sampled was, so this
 * pair is the only thing standing between the corridor and a frame full of ghosts
 * of itself wrapped around the nucleus. The rule is "only what is *at* the well is
 * lensed by it", and what forces the band to be tight is that the gate's own
 * structure stands `GATE_APERTURE_Z_AHEAD` in front of the singularity — closer to
 * the lens than a body standing out in the corridor can be. So the near edge has
 * to fall beyond the gate's reach, which means the mechanism's columns are not
 * lensed either. That is the trade, and it is the right way round: a column two
 * metres in front of a black hole is not bent around it.
 *
 * The first pass at this pair read 0.86/0.995 fitted to the establishing frame,
 * which left a planet at 0.933 of the lens's own distance inside the transition —
 * three quarters of its ghost survived, rings and all, hanging above the nucleus
 * on the opening shot. These asserts are what that cost.
 */
const gateReach = (OPENING - GATE_APERTURE_Z_AHEAD) / OPENING
assert.ok(
  LENS_NEAR > gateReach,
  `the lens guard reaches in front of the gate, so the corridor is lensable: ` +
    `LENS_NEAR ${LENS_NEAR} vs the gate's own reach ${gateReach.toFixed(3)}`,
)
assert.ok(
  LENS_NEAR < LENS_FAR && LENS_FAR < 1,
  `the guard must cross-fade, and the aperture itself sits at 1.0 and has to be ` +
    `lensed: ${LENS_NEAR} → ${LENS_FAR}`,
)

console.log(
  `kerr ok — a=${HOLE_SPIN}: isco ${iscoRs(HOLE_SPIN).toFixed(3)} Rs, ` +
    `photon ${photonRs(HOLE_SPIN).toFixed(3)}/${photonRsRetro(HOLE_SPIN).toFixed(3)} Rs, ` +
    `capture ${captureRs(HOLE_SPIN).toFixed(3)}/${captureRsRetro(HOLE_SPIN).toFixed(3)} Rs; ` +
    `ending Rs ${deepestRs.toFixed(2)} m at ${ENDING_DISTANCE.toFixed(1)} m — ` +
    `shadow ${prograde.toFixed(2)}…${shadowAtEnd.toFixed(2)} half-frames; ` +
    `nucleus ${nucleus.toFixed(3)} half-frames at ${OPENING.toFixed(1)} m, ` +
    `corridor ends at ${corridorEnd.toFixed(3)} (${endingMultiple.toFixed(1)}× left ` +
    `for the ending, worst step ${worstStep.toFixed(2)}×); ` +
    `ring ${ringPixels(nucleusRs, OPENING, 900).toFixed(2)} px; ` +
    `lens guard ${LENS_NEAR}→${LENS_FAR} clears the gate at ${gateReach.toFixed(3)}`,
)
