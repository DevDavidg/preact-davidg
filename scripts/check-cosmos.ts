/**
 * The cosmic world's one runnable check: the infall spiral and the galaxy.
 *
 * Two pieces of maths in `src/scene/CosmicWorld.tsx` are non-trivial and neither is
 * visible in a screenshot until it is already wrong.
 *
 * `spiralFall` is the ending: it has to be a pure function of the swallow curve
 * (scroll up and the galaxy comes back out of the hole, exactly), monotonic up to
 * the gulps' own tug, ordered from the inside out, and it has to actually *arrive* —
 * an outer arm still hanging at half radius when the frame goes black is the failure
 * mode the previous `position.lerp` never had and this one can.
 *
 * `galaxyGeometry` is the other one. "Looks like a galaxy" is five statistical
 * properties at once — a concentrated bulge, two logarithmic arms, an exponential
 * disk, a thin flaring plane, a colour gradient from old core to young arms — and
 * any of them can regress silently while the other four still draw something
 * plausible. So they are measured here rather than eyeballed.
 *
 *   pnpm exec tsx scripts/check-cosmos.ts
 */
import assert from 'node:assert/strict'
import { galaxyGeometry, spiralFall } from '../src/scene/CosmicWorld'
import { swallowShape } from '../src/scene/sceneState'

const SAMPLES = 1201
const SPAN = 12
const at = (s: number) => swallowShape(s)

/* ------------------------------------------------------------------ the fall */

// Nothing has moved before the finale starts.
for (const r of [1, 5, 12, 27]) {
  const rest = spiralFall(r, 3, at(0), SPAN)
  assert.equal(rest.fall, 0, `r=${r} must not be falling at swallow 0`)
  assert.equal(rest.radius, r, `r=${r} must sit exactly where it was authored`)
  assert.equal(rest.height, 3, 'the disk must not be flattened before the fall')
  assert.equal(rest.wind, 0, 'no winding before the fall')
  assert.equal(rest.stretch, 1, 'no tidal stretch before the fall')
  assert.equal(rest.squeeze, 1, 'no transverse squeeze before the fall')
}

// ...and everything has arrived by the end of the rail. This is the one the old
// `lerp` got for free and a decaying orbit does not: the far matter has to be taken
// too, or the last frame is a black hole with an arm still parked beside it.
for (const r of [1, 5, 12, 27, 60]) {
  const done = spiralFall(r, 8, at(1), SPAN)
  assert.ok(done.fall > 0.98, `r=${r} never crossed (fall ${done.fall})`)
  assert.ok(
    done.radius < r * 0.05,
    `r=${r} was left at ${done.radius.toFixed(2)} of ${r}`,
  )
  assert.ok(done.height < 1e-9, 'the disk must be flat by the horizon')
}

// Inside out. A well eats what is nearest first — the orbital time is shorter
// there — and this ordering is what makes the collapse read as a drain rather than
// as the whole sky shrinking on one timer.
for (const s of [0.2, 0.45, 0.7, 0.9]) {
  const shape = at(s)
  let previous = Infinity
  for (const r of [1, 4, 9, 16, 25, 40]) {
    const fall = spiralFall(r, 0, shape, SPAN).fall
    assert.ok(fall <= previous + 1e-12, `at s=${s}, r=${r} outran what is inside it`)
    previous = fall
  }
  assert.ok(
    spiralFall(1, 0, shape, SPAN).fall > spiralFall(40, 0, shape, SPAN).fall,
    `at s=${s} the near matter must be ahead of the far`,
  )
}

// Purity. The whole ending is scrubbable, so the same scroll value has to hand back
// the same numbers however many times it is asked, and out of range has to clamp.
for (const s of [0.08, 0.31, 0.5, 0.77, 0.96]) {
  assert.deepEqual(
    spiralFall(7, 2, at(s), SPAN, 0.3),
    spiralFall(7, 2, at(s), SPAN, 0.3),
    `spiralFall is not pure at s=${s}`,
  )
}
assert.deepEqual(
  spiralFall(7, 2, at(-0.5), SPAN),
  spiralFall(7, 2, at(0), SPAN),
  'below the rail must clamp to the start',
)
assert.deepEqual(
  spiralFall(7, 2, at(2), SPAN),
  spiralFall(7, 2, at(1), SPAN),
  'past the rail must clamp to the end',
)

/*
 * It only ever tightens.
 *
 * This is the invariant `scripts/check-swallow.ts` exists to protect, applied to this
 * file's channels — and here it is the strict version, because `suction` is
 * deliberately kept out of every position: a gulp is a beat that returns to zero, so
 * multiplying an orbital radius by it is a planet climbing back out of the hole
 * between pulls. The beats are still felt through the drain, which is four fifths
 * gulps; the kick they carry lives on brightness in the shader instead.
 *
 * `radius` is the one that can still break, because it folds in the tidal smear —
 * a per-star spread that *grows* while the orbit shrinks, so a smear coefficient
 * too large for the decay it rides on makes the outer stars drift outward mid-fall.
 * A hair of tolerance for the sampling, and no more.
 */
const monotone = (f: (s: number) => number, label: string, slack = 1e-12) => {
  let peak = -Infinity
  for (let index = 0; index < SAMPLES; index += 1) {
    const s = index / (SAMPLES - 1)
    const value = f(s)
    assert.ok(
      peak - value <= slack,
      `${label} went backwards by ${(peak - value).toFixed(5)} at s=${s}`,
    )
    peak = Math.max(peak, value)
  }
}
for (const r of [0.05, 0.4, 1, 6, 14, 27]) {
  monotone((s) => spiralFall(r, 0, at(s), SPAN).fall, `fall at r=${r}`)
  monotone((s) => spiralFall(r, 0, at(s), SPAN).wind, `winding at r=${r}`)
  // The orbit's own radius, normalised, tidal smear included — the number a viewer
  // is actually watching. Both extremes of the per-point smear, since a seed near 0
  // pulls a star inward and a seed near 1 trails it out behind.
  for (const seed of [0, 0.5, 1]) {
    monotone(
      (s) => -spiralFall(r, 0, at(s), SPAN, seed).radius / r,
      `radius at r=${r}, seed ${seed}`,
      0.002,
    )
  }
}

// The runaway. Angular rate has to climb by roughly an order of magnitude across the
// fall, which is the single most recognisable thing about matter going into a well —
// and it has to be bounded, because the real r^-3/2 law is a divergence and the rail
// is a few hundred pixels of wheel.
const rateAt = (s: number, r: number) => {
  const h = 1e-4
  return (
    (spiralFall(r, 0, at(s + h), SPAN).wind - spiralFall(r, 0, at(s), SPAN).wind) / h
  )
}
const early = rateAt(0.25, 6)
const late = rateAt(0.97, 6)
assert.ok(early > 0, `winding must run forward (early rate ${early})`)
assert.ok(late > early * 8, `angular rate barely climbed: ${early} → ${late}`)
assert.ok(late < early * 400, `angular rate diverged: ${early} → ${late}`)

// Spaghettification: drawn out along the radius, squeezed across it, never through
// zero — a squeeze that reaches 0 is a body folded inside out, and the shader divides
// by it to correct its normals — and volume-preserving, because a tidal field shears
// at fixed density. Two independently tuned coefficients inflate the planet on its
// way in, which reads as ballooning rather than as being pulled apart.
let stretch = 0
for (let index = 0; index < SAMPLES; index += 1) {
  const s = index / (SAMPLES - 1)
  const { stretch: out, squeeze } = spiralFall(6, 0, at(s), SPAN)
  assert.ok(out >= 1 - 1e-12, `stretch inverted at s=${s}: ${out}`)
  assert.ok(squeeze > 0.25 && squeeze <= 1 + 1e-12, `squeeze out of range: ${squeeze}`)
  assert.ok(
    Math.abs(out * squeeze * squeeze - 1) < 1e-12,
    `tidal map is not volume-preserving at s=${s}: ${out * squeeze * squeeze}`,
  )
  stretch = Math.max(stretch, out)
}
assert.ok(stretch > 1.6, `stretch never became visible (peak ${stretch.toFixed(2)})`)

// The stretch has to stay out of the way until the fall is genuinely on, or every
// planet is a rugby ball for the whole finale.
assert.ok(spiralFall(6, 0, at(0.2), SPAN).stretch < 1.05, 'stretch arrived too early')

/* ---------------------------------------------------------------- the galaxy */

const COUNT = 9000
const galaxy = galaxyGeometry(COUNT)
assert.equal(galaxy.position.length, COUNT * 3, 'the galaxy came up short')
assert.deepEqual(
  galaxyGeometry(512).position,
  galaxyGeometry(512).position,
  'galaxyGeometry must be deterministic — the check below is meaningless otherwise',
)

const stars = Array.from({ length: COUNT }, (_, i) => {
  const [x, y, z] = [galaxy.position[i * 3], galaxy.position[i * 3 + 1], galaxy.position[i * 3 + 2]]
  return { x, y, z, r: Math.hypot(x, z), theta: Math.atan2(z, x) }
})

// Normalised and centred: the caller scales this and pins its origin to the
// singularity, so anything outside radius 1 or any drift in the centroid lands
// somewhere the well is not.
const centroid = ['x', 'y', 'z'].map(
  (k) => stars.reduce((sum, s) => sum + s[k as 'x'], 0) / COUNT,
)
for (const [index, mean] of centroid.entries()) {
  assert.ok(Math.abs(mean) < 0.02, `centroid drifted on axis ${index}: ${mean}`)
}
assert.ok(
  Math.max(...stars.map((s) => Math.hypot(s.r, s.y))) <= 1.001,
  'a star escaped the unit radius',
)

/*
 * A bulge, and a steep one.
 *
 * The property that makes the well read as a *nucleus*: light has to pile up toward
 * the centre so the shadow is a bite taken out of something bright. Compared against
 * a uniform disk, where the fraction inside radius f is f² — so inside 0.1 a
 * featureless disk puts 1%, and this has to put far more than that.
 */
const within = (f: number) => stars.filter((s) => s.r < f).length / COUNT
assert.ok(within(0.1) > 0.14, `no bulge: ${(within(0.1) * 100).toFixed(1)}% inside 0.1 R`)
assert.ok(within(0.3) > 0.45, `light is not centrally concentrated: ${within(0.3)}`)
// ...and the concentration has to keep going all the way in, not stop at a ring.
assert.ok(
  within(0.04) / within(0.12) > 0.1,
  'the innermost region is hollow — the shadow would sit in a gap, not in light',
)
// An exponential disk, not a filled circle: the outskirts have to thin out.
assert.ok(within(0.9) > 0.97, 'too much light in the outer disk to read as a spiral')

/*
 * Two logarithmic arms.
 *
 * Unwinding a log spiral by its own pitch — θ − ln(r)/tan(pitch) — turns each arm
 * into a constant, so the arms become two peaks in a histogram of that residual.
 * A modulo-placed spiral at a fixed angular rate (what this replaced) unwinds to a
 * smear here, which is the point of measuring it this way rather than counting
 * points in wedges.
 */
const PITCH = 0.24
const BINS = 24
const arms = new Array<number>(BINS).fill(0)
for (const star of stars) {
  if (star.r < 0.2) continue
  const residual = star.theta - Math.log(star.r) / Math.tan(PITCH)
  // Two arms half a turn apart, so the residual is folded modulo π and both land
  // in the same peak — which is what makes this test count *arms* and not phase.
  const folded = ((residual % Math.PI) + Math.PI) % Math.PI
  arms[Math.floor((folded / Math.PI) * BINS) % BINS] += 1
}
const armTotal = arms.reduce((a, b) => a + b, 0)
const peak = Math.max(...arms) / (armTotal / BINS)
assert.ok(armTotal > COUNT * 0.1, `not enough disk stars to measure arms: ${armTotal}`)
assert.ok(peak > 2.4, `arms are a smear, not arms: peak/mean = ${peak.toFixed(2)}`)
// The dust lane is an absence, so the arm's profile has to be lopsided. Compared as
// the two flanks of the peak rather than as single bins, because the arm is only a
// few bins wide and the bins out at its edges are empty on both sides either way.
const brightest = arms.indexOf(Math.max(...arms))
const flank = (sign: number) =>
  [1, 2, 3, 4].reduce((sum, i) => sum + arms[(brightest + sign * i + BINS) % BINS], 0)
const lopsided = Math.abs(flank(-1) - flank(1)) / (flank(-1) + flank(1))
assert.ok(lopsided > 0.1, `the arm profile is symmetric — no dust lane (${lopsided})`)

/*
 * A thin disk that flares.
 *
 * Thin, because a disk as thick as it is wide is a blob; flaring, because the same
 * vertical dispersion carries further out where the disk's own gravity is weaker,
 * and that widening silhouette is what tells the eye it is looking at a disk seen
 * at an angle rather than at a sphere.
 */
const thickness = (lo: number, hi: number) => {
  const band = stars.filter((s) => s.r >= lo && s.r < hi)
  return band.reduce((sum, s) => sum + Math.abs(s.y), 0) / Math.max(1, band.length)
}
// The inner band starts past the bulge's outer edge on purpose: a spheroid is as
// tall as it is wide, so any band that overlaps it measures the bulge's height and
// reports the disk as flat by comparison whether it flares or not.
const inner = thickness(0.35, 0.5)
const outer = thickness(0.75, 1)
assert.ok(outer > inner * 1.5, `the disk does not flare: ${inner} → ${outer}`)
assert.ok(outer < 0.09, `the outer disk is too thick to read as a disk: ${outer}`)

/*
 * Old core, young arms.
 *
 * The colour gradient is doing as much work as the density: a yellow-red centre
 * running out to blue arms is how a viewer knows which part of the object is its
 * middle. Measured as the blue/red ratio of the mean colour in each band.
 */
const ratio = (lo: number, hi: number) => {
  let red = 0
  let blue = 0
  for (const [index, star] of stars.entries()) {
    if (star.r < lo || star.r >= hi) continue
    red += galaxy.tint[index * 3]
    blue += galaxy.tint[index * 3 + 2]
  }
  return blue / Math.max(1e-6, red)
}
const core = ratio(0, 0.12)
const arm = ratio(0.5, 1)
assert.ok(core < 0.85, `the core is not old and yellow: blue/red ${core.toFixed(2)}`)
assert.ok(arm > 1.6, `the arms are not young and blue: blue/red ${arm.toFixed(2)}`)
assert.ok(arm > core * 2, `no colour gradient at all: ${core} → ${arm}`)

// Per-point size, which is the difference between a galaxy and gravel: the bulge is
// thousands of unresolved specks and the arms carry the few bright ones.
const sizes = [...galaxy.size]
assert.ok(Math.min(...sizes) > 0, 'a star with no size draws nothing')
assert.ok(Math.max(...sizes) / Math.min(...sizes) > 4, 'every star is the same size')

console.log(
  `cosmos ok — bulge ${(within(0.1) * 100).toFixed(1)}% inside 0.1 R, ` +
    `arms ${peak.toFixed(2)}× mean, flare ${inner.toFixed(4)}→${outer.toFixed(4)}, ` +
    `colour ${core.toFixed(2)}→${arm.toFixed(2)}; ` +
    `fall r=6 ${[0.2, 0.45, 0.7, 0.9, 1]
      .map((s) => `${s}:${spiralFall(6, 0, at(s), SPAN).fall.toFixed(2)}`)
      .join(' ')}, ` +
    `stretch peak ${stretch.toFixed(2)}×, spin-up ${(late / early).toFixed(0)}×`,
)
