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

/** Console plate multiplier — framed inside the viewport, not edge-to-edge. */
export const consoleSizeFit = (fit: number) => 0.44 + fit * 0.26

/** Hero shell multiplier. */
export const heroSizeFit = (fit: number) => 0.48 + fit * 0.26

/** Metres ahead of the eye — plates assemble at reading distance, not in the lens. */
export const consoleDistanceFor = (fit: number) => 8.6 + (1 - fit) * 3.2

/** FOV bump so short screens see the full plate. */
export const fovCompensation = (fit: number) => (1 - fit) * 12
