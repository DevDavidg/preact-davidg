import * as THREE from 'three'

/** Design framing: ~16:10 at 900px tall. */
export const REFERENCE_ASPECT = 1.6
export const REFERENCE_HEIGHT = 900

/**
 * The lens the room is composed for, in degrees of vertical field of view.
 *
 * It lived privately in `Rig.tsx`, which meant the type system had no way to ask
 * how wide the lens was — and without the lens there is no converting a world em
 * into a size on screen. `Rig` still owns every per-frame adjustment around it;
 * this is only the base.
 */
export const BASE_FOV = 46

/**
 * Below this aspect the viewport is portrait enough that width, not height, is
 * the thing the room has to answer to.
 */
const PORTRAIT_ASPECT = 1.0
const PORTRAIT_FULL_ASPECT = 0.62

/**
 * How portrait this viewport is, 0 → 1. A phone held upright is 1; a laptop is 0.
 *
 * This is the value the whole file turned on. Everything below used to be a
 * function of `fit` alone, and `fit` was `min(aspect / 1.6, height / 900)` — so a
 * 390×844 phone resolved to the floor, 0.48, exactly as if it were a 500px
 * browser window. Every consequence pointed the wrong way at once: type scaled
 * to 48%, the plate scaled to 66%, the camera moved 3.2 m further back and the
 * field of view opened another 6°. A title landed at roughly 8 screen pixels per
 * em on the device that needs it largest. Aspect ratio is not a quality signal —
 * it says which axis is scarce.
 */
export const portraitAmount = (aspect: number) =>
  /*
   * Written as `1 - smoothstep(low, high)` rather than as a smoothstep with its
   * bounds reversed. `THREE.MathUtils.smoothstep` returns 0 for anything at or
   * below its `min`, so passing min > max silently answers 0 for *every* input —
   * which is exactly what happened here and meant every phone was treated as
   * landscape, quietly disabling all of the portrait handling below.
   */
  1 -
  THREE.MathUtils.smoothstep(aspect, PORTRAIT_FULL_ASPECT, PORTRAIT_ASPECT)

/**
 * World scale vs the live viewport.
 *
 * Still the room's single "how far from the design frame is this" number, but a
 * portrait viewport is now measured against a portrait reference rather than
 * against a widescreen one, and the floors are high enough that a phone is a
 * smaller room rather than a doll's house.
 */
export const computeViewportFit = (aspect: number, heightPx: number) => {
  const portrait = portraitAmount(aspect)
  const reference = THREE.MathUtils.lerp(
    REFERENCE_ASPECT,
    PORTRAIT_FULL_ASPECT,
    portrait,
  )
  const aspectFit = THREE.MathUtils.clamp(aspect / reference, 0.68, 1)
  const heightFit = THREE.MathUtils.clamp(heightPx / REFERENCE_HEIGHT, 0.62, 1)
  return Math.round(Math.min(aspectFit, heightFit) * 50) / 50
}

/**
 * Console plate multiplier — framed inside the viewport, not edge-to-edge.
 *
 * Raised again from `0.5 + fit * 0.34`. The plate is the reading surface, and on
 * a narrow frame it has to claim most of the width or the copy inside it has
 * nowhere to be.
 */
export const consoleSizeFit = (fit: number) => 0.62 + fit * 0.34

/**
 * Plate width, which has to leave a margin the plate can drift inside.
 *
 * A console is positioned for the camera pose at the middle of its own hold, so
 * for the first part of that hold the camera has not arrived yet and the plate
 * sits off-axis. On a widescreen frame there is room either side to absorb that;
 * on a phone at 82% of the frame's width the plate's leading edge was clipped
 * clean off the screen. Trimming the portrait width is cheaper than fighting the
 * drift, and the type inside no longer scales with the plate anyway.
 */
export const consoleWidthFit = (fit: number, aspect: number) =>
  consoleSizeFit(fit) * (1 - portraitAmount(aspect) * 0.13)

/**
 * Extra height above the corridor's eyeline, in metres.
 *
 * The camera looks slightly down the corridor, which on a widescreen frame reads
 * as a lens with the floor in it and on a tall portrait frame reads as a plate
 * pushed into the bottom third with a screenful of empty ceiling above it. This
 * lifts the plate back toward the middle of a portrait frame.
 */
export const consoleRiseFor = (fit: number, aspect: number, rise: number) =>
  rise * fit + portraitAmount(aspect) * 0.42

/**
 * Plate height, which is a different question from plate width.
 *
 * On a portrait phone the old square-ish plate used about 78% of the frame's
 * width and 24% of its height: three quarters of the screen was empty corridor
 * while the copy inside the plate was being clipped for want of room. A tall
 * frame should get a tall plate — that vertical space is free reading height.
 */
export const consoleHeightFit = (fit: number, aspect: number) =>
  consoleSizeFit(fit) * (1 + portraitAmount(aspect) * 0.55)

/**
 * Type scale — deliberately NOT the plate scale.
 *
 * A smaller plate is a composition decision; smaller type is a legibility
 * regression, and tying the two together is what made the world copy unreadable
 * on a phone. Type is held at roughly its authored size and pushed slightly
 * *past* it on portrait, where the reading distance in device terms is shorter
 * and the frame is narrow.
 */
export const typeFit = (fit: number, aspect: number) =>
  Math.max(fit, 0.88 + portraitAmount(aspect) * 0.24)

/**
 * Metres ahead of the eye — plates assemble at reading distance, not in the lens.
 *
 * This used to *increase* on a tight viewport (`8.6 + (1 - fit) * 3.2`), which
 * put the plate furthest away exactly where it was already smallest. A narrow
 * frame wants the plate closer; the floor keeps it out of the near clip and
 * clear of the corridor's geometry.
 */
export const consoleDistanceFor = (fit: number) => 7.4 + fit * 1.3

/**
 * FOV bump so short screens see the full plate.
 *
 * Much gentler than the old `(1 - fit) * 12`: a wider lens shrinks everything in
 * frame, so on a phone it was a fourth multiplier working against legibility.
 * A couple of degrees is enough to recover a short window's framing.
 */
export const fovCompensation = (fit: number) => (1 - fit) * 4

/**
 * How much of a console's side-lane offset survives at this viewport.
 *
 * The alternating left/right placement is a widescreen device: it reads as a
 * corridor with room either side of the lens. A phone has no "either side", so
 * this collapses to dead-centre on portrait and only opens the lane once the
 * viewport is genuinely wide enough to read as a corridor.
 */
export const lateralFit = (fit: number, aspect = REFERENCE_ASPECT) =>
  THREE.MathUtils.smoothstep(fit, 0.72, 0.95) * (1 - portraitAmount(aspect))

/**
 * Hero shell multiplier.
 *
 * The opening shot is the one object that has to land before the visitor has
 * read a word, so it is scaled to command the frame rather than to sit politely
 * inside it. Raised again: with the lens now aimed straight at it the optic is
 * the composition, and at the old ceiling it was a small object in the middle of
 * a large empty room. The floor stays generous on short viewports — a phone
 * shrinks the instrument but never loses it.
 *
 * Portrait needs its own term. A sphere scaled to fill a tall frame's *height*
 * is wider than that frame is wide, so on a phone the aperture rings and the
 * scroll cue below were both being clipped off the sides. The optic is round:
 * the axis that has to contain it is whichever one is shorter.
 */
export const heroSizeFit = (fit: number, aspect = REFERENCE_ASPECT) =>
  (0.88 + fit * 0.42) * (1 - portraitAmount(aspect) * 0.34)

/**
 * World em that lands at a given number of CSS pixels tall.
 *
 * The unit conversion the type system was missing. World-space type has no
 * intrinsic size: how big a glyph reads depends on the em, the distance and the
 * vertical field of view, and the only honest way to guarantee a legibility
 * floor is to solve for it. `consoleLayout` uses this to raise any row that
 * would otherwise land under the floor, whatever the viewport does.
 */
export const worldEmForPixels = (
  pixels: number,
  heightPx: number,
  distance: number,
  fovDegrees: number,
) => {
  if (heightPx <= 0) return 0
  const visible =
    2 * distance * Math.tan((fovDegrees * Math.PI) / 360)
  return (pixels / heightPx) * visible
}
