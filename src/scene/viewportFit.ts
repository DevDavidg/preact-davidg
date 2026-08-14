import * as THREE from 'three'

/** Design framing: ~16:10 at 900px tall. */
export const REFERENCE_ASPECT = 1.6
export const REFERENCE_HEIGHT = 900

/**
 * World scale vs the live viewport. Height dominates — a short window must shrink
 * plates and the hero so nothing clips the lens; aspect only trims ultra-wide.
 */
export const computeViewportFit = (aspect: number, heightPx: number) => {
  const aspectFit = THREE.MathUtils.clamp(aspect / REFERENCE_ASPECT, 0.48, 1)
  const heightFit = THREE.MathUtils.clamp(heightPx / REFERENCE_HEIGHT, 0.52, 1)
  return Math.round(Math.min(aspectFit, heightFit) * 50) / 50
}

/**
 * Console plate multiplier — framed inside the viewport, not edge-to-edge.
 *
 * Raised from `0.44 + fit * 0.26`. Type size scales with `fit` while the plate
 * scaled with this, so at the old ceiling the plates were too small for the copy
 * they carry and every console clipped: headlines rendered as "Interfaces qu…"
 * and whole data rows were dropped. A bigger plate at the same type size is
 * reading room, not a louder card — even at the new ceiling a console occupies
 * about a quarter of the frame at its reading distance.
 */
export const consoleSizeFit = (fit: number) => 0.5 + fit * 0.34

/**
 * Hero shell multiplier.
 *
 * The opening shot is the one object that has to land before the visitor has
 * read a word, so it is scaled to command the frame rather than to sit politely
 * inside it. The floor stays generous on short viewports — a phone shrinks the
 * instrument but never loses it.
 */
export const heroSizeFit = (fit: number) => 0.62 + fit * 0.36

/** Metres ahead of the eye — plates assemble at reading distance, not in the lens. */
export const consoleDistanceFor = (fit: number) => 8.6 + (1 - fit) * 3.2

/** FOV bump so short screens see the full plate. */
export const fovCompensation = (fit: number) => (1 - fit) * 12

/**
 * How much of a console's side-lane offset survives at this viewport.
 *
 * The alternating left/right placement is a widescreen device: it reads as a
 * corridor with room either side of the lens. A phone has no "either side" —
 * `fit` bottoms out at its floor for every portrait width from a small phone
 * up through an iPad in portrait, and at that floor the old code still kept
 * ~48% of the desktop offset, which put every card visibly off-balance on a
 * screen too narrow to justify it. This collapses to dead-centre at the fit
 * floor and only starts opening the lane once the viewport is genuinely wide
 * enough to read as a corridor (roughly a small-laptop width and up).
 */
export const lateralFit = (fit: number) =>
  THREE.MathUtils.smoothstep(fit, 0.48, 0.75)
