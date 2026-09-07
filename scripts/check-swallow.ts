/**
 * The swallow curve's one runnable check.
 *
 * The whole ending is a pure function of one scroll value, so this is the only
 * place the contract can actually be tested: monotonicity, the endpoints, and
 * the fact that the room's span never re-opens between gulps — which is the
 * exact bug that made the finale read as the corridor breathing rather than
 * being eaten.
 *
 *   pnpm exec tsx scripts/check-swallow.ts
 */
import assert from 'node:assert/strict'
import { swallowShape } from '../src/scene/sceneState'

const SAMPLES = 2001
const at = (s: number) => swallowShape(s)

// Endpoints.
assert.equal(at(0).drain, 0, 'drain must start at 0')
assert.ok(Math.abs(at(1).drain - 1) < 1e-9, 'drain must reach 1 at the end')
assert.equal(at(0).recall, 0, 'nothing is recalled before the swallow starts')
assert.equal(at(1).recall, 0, 'nothing is left to recall past the horizon')
assert.ok(at(0.3).recall > 0.99, 'the room is back well before the second gulp')

// The plan's own acceptance check.
assert.ok(at(0.8).drain > at(0.4).drain, 'drain(0.8) > drain(0.4)')

// Monotonicity, sampled across the whole rail. `radius` is the one that broke:
// it used to be multiplied by a gulp factor that returned to 1.
let previous = at(0)
let minRadiusStep = Infinity
for (let index = 1; index < SAMPLES; index += 1) {
  const s = index / (SAMPLES - 1)
  const shape = at(s)
  assert.ok(shape.drain >= previous.drain - 1e-12, `drain fell at s=${s}`)
  assert.ok(shape.radius <= previous.radius + 1e-12, `radius grew at s=${s}`)
  minRadiusStep = Math.min(minRadiusStep, previous.radius - shape.radius)
  previous = shape
}
assert.ok(minRadiusStep >= -1e-12, 'the room must never re-open')

// ...and the beats are still beats: three peaks, back to nothing between them.
const suctionAt = (s: number) => at(s).suction
assert.ok(suctionAt(0.16) > 0.9, 'first gulp peaks')
// 0.285 is the trough: gulp one ends at 0.28, gulp two opens at 0.29.
assert.ok(suctionAt(0.285) < 0.05, 'and lets go before the second')
assert.ok(suctionAt(0.42) > 1.2, 'second gulp peaks harder')
assert.ok(suctionAt(0.68) > 1.5, 'third gulp takes the room')

// Out of range in either direction has to clamp, not extrapolate — a rubber-band
// overscroll hands this negative values and numbers past 1.
assert.deepEqual(at(-0.4), at(0), 'below the rail must clamp to the start')
assert.deepEqual(at(1.6), at(1), 'past the rail must clamp to the end')

// Scrubbing back up has to land on exactly the same numbers.
for (const s of [0.07, 0.23, 0.5, 0.71, 0.93]) {
  assert.deepEqual(at(s), at(s), `swallowShape(${s}) is not pure`)
}

/*
 * The one invariant every consumer of the ending has to keep.
 *
 * A gulp is a tug laid over a fall, so a consumer writes `drain * a + surge * b`
 * (or `radius * (1 - suction * b)`). The tug is meant to be felt, so these are
 * not required to be monotonic — but if `b` is too large for `a`, the beat's
 * release between two gulps outruns what the drain took across them and the
 * thing springs back out, which is the bug this whole curve exists to end. It is
 * invisible in any single number and only shows up as a give-back, so what is
 * bounded here is exactly that: how far below its own running maximum a channel
 * is ever allowed to fall.
 *
 * These mirror the coefficients actually in use. Retune a call site past the safe
 * ratio and this fails instead of the browser.
 */
const GIVE_BACK = 0.05

const neverGivesBack = (f: (s: number) => number, label: string) => {
  let peak = -Infinity
  for (let index = 0; index < SAMPLES; index += 1) {
    const s = index / (SAMPLES - 1)
    const value = f(s)
    assert.ok(
      peak - value <= GIVE_BACK,
      `${label} gave back ${(peak - value).toFixed(3)} at s=${s}`,
    )
    peak = Math.max(peak, value)
  }
}

// Rig.tsx — the lens closing on the mouth, and its look-at target.
neverGivesBack(
  (s) => Math.min(1, at(s).drain * 1.05 + at(s).surge * 0.1),
  'Rig draw-in',
)
neverGivesBack(
  (s) => Math.min(1, at(s).drain * 1.25 + at(s).surge * 0.1),
  'Rig look-at',
)
// ReactorScene.tsx SwallowField — the room's own span, tug included.
neverGivesBack((s) => -(at(s).radius * (1 - at(s).suction * 0.12)), 'room span')
// ReconstructMaterial / GridFloor — the per-vertex infall, at a mid-corridor r.
neverGivesBack((s) => {
  const { drain, suction } = at(s)
  const grav = Math.min(0.94, drain * (0.55 + drain * 0.9) * (12 / (8 + 2.2)))
  return Math.min(0.97, grav * (1 + suction * 0.3))
}, 'shard infall')

console.log(
  `swallow ok — radius ${at(0).radius.toFixed(3)} → ${at(1).radius.toFixed(3)}, ` +
    `drain ${[0.16, 0.28, 0.42, 0.55, 0.68, 0.83, 1]
      .map((s) => `${s}:${at(s).drain.toFixed(2)}`)
      .join(' ')}`,
)
