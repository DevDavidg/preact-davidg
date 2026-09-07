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
  HOLE_SPIN,
  holeRadiusFor,
  iscoRs,
  PHOTON_RS,
  photonRs,
  photonRsRetro,
  PLUNGE_RADIUS,
  SHADOW_RS,
} from '../src/scene/blackHole'
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

console.log(
  `kerr ok — a=${HOLE_SPIN}: isco ${iscoRs(HOLE_SPIN).toFixed(3)} Rs, ` +
    `photon ${photonRs(HOLE_SPIN).toFixed(3)}/${photonRsRetro(HOLE_SPIN).toFixed(3)} Rs, ` +
    `capture ${captureRs(HOLE_SPIN).toFixed(3)}/${captureRsRetro(HOLE_SPIN).toFixed(3)} Rs; ` +
    `ending Rs ${deepestRs.toFixed(2)} m at ${ENDING_DISTANCE.toFixed(1)} m — ` +
    `shadow ${prograde.toFixed(2)}…${shadowAtEnd.toFixed(2)} half-frames`,
)
