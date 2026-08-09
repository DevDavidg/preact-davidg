/**
 * The one settle curve the whole atelier shares. Lattice (CPU), the shard
 * material (GPU) and the world typography all read from here, so a fragment
 * flying into place in the background locks in phase with a letter doing the
 * same thing in the foreground.
 */

/** How much of the build a single fragment takes to travel chaos → home. */
const SETTLE_SPAN = 0.36

/** Hard cap on per-fragment delay: everything is settled by BEAUTY → LIVE. */
export const STAGGER_CAP = 0.42

/**
 * Fraction of a block's window spent delaying its own fragments. The remaining
 * `(1 - STAGGER_RATIO)` is the travel itself — so the last seed always finishes
 * exactly at `enter + span`, never past the end of the page.
 */
export const STAGGER_RATIO = 0.28

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Hermite ease — matches `t*t*(3-2t)` in the shaders exactly. */
const smoothstep01 = (t: number) => t * t * (3 - 2 * t)

/**
 * Settle amount for a fragment whose delay is `stagger`, over `span` of build.
 * 0 = scattered and tumbling, 1 = locked into its home transform.
 */
export const settleAt = (build: number, stagger: number, span = SETTLE_SPAN) =>
  smoothstep01(clamp01((build - stagger) / Math.max(span, 1e-4)))
