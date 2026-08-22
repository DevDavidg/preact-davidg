import type { GlyphAtlas } from '../ui/glyphAtlas'
import { glyphKey } from '../ui/glyphAtlas'
import { worldEmForPixels } from '../viewportFit'
import type { TypeMetrics } from './consoleLayout'

/**
 * Where a console's controls go, and how big their labels are.
 *
 * This exists because the plate and the label used to be laid out in two
 * different files from two different sets of constants, and they disagreed.
 * `Console.tsx` sized the plate with `min(1.25, width * 0.88 / n)` while
 * `WorldConsoles.actionLabelBlocks` sized the label against
 * `min(1.35, width * 0.9 / n)` — so the type was measured against a plate
 * roughly 8% wider than the one actually drawn, and long labels ("VER
 * EXPERIENCIA", "ESCRIBIME POR MAIL") pushed straight out through their own
 * outline. A legibility floor on the em made it worse rather than better: the
 * floor could raise the type above what the plate had room for, and nothing
 * downstream was allowed to argue.
 *
 * So both consumers now read the same slots from here, and the label's width is
 * *measured* from the atlas rather than estimated from a per-character constant.
 * The invariant this file exists to hold:
 *
 *   every label fits inside its own plate, at every viewport, in both locales.
 *
 * It is held by having somewhere to give: the row shrinks the type to a floor,
 * then — rather than overflowing — stops being a row at all and stacks into a
 * column, which is the right shape for a phone anyway.
 */

/** Smallest a control's label may get, in CSS pixels of em height on screen. */
const MIN_ACTION_PX = 14
/** Clear space between the label and its plate's outline, in em of that label. */
const PAD_EM = 0.55
/** Metres between plates. */
const GAP = 0.11

export interface ActionSlot {
  id: string
  label: string
  /** World em for this label's glyphs. */
  em: number
  /** Plate size in metres. */
  width: number
  height: number
  /** Plate centre in the console's local face space. */
  x: number
  y: number
}

export interface ActionRowLayout {
  slots: ActionSlot[]
  /**
   * Height to reserve at the foot of the plate so copy never collides with the
   * controls. `layoutConsoleRows` subtracts this from its content rect, which is
   * why it has to be computed before the rows are laid out rather than guessed.
   */
  band: number
  /** True when the controls stacked instead of sitting in a row. */
  stacked: boolean
}

const advanceOf = (
  atlas: GlyphAtlas,
  char: string,
  tracking: number,
): number => (atlas.metrics.get(glyphKey('mono', char))?.advance ?? 0.5) + tracking

/** A label's width in em, from the atlas the glyphs will actually be drawn from. */
const measure = (atlas: GlyphAtlas, label: string, tracking: number): number =>
  Array.from(label).reduce(
    (total, char) => total + advanceOf(atlas, char, tracking),
    0,
  )

export interface ActionRowInput {
  actions: { id: string; label: string }[]
  /** The console's *rendered* size, after every viewport multiplier. */
  consoleWidth: number
  consoleHeight: number
  atlas: GlyphAtlas
  type: TypeMetrics
  tracking?: number
}

export const layoutActionRow = ({
  actions,
  consoleWidth,
  consoleHeight,
  atlas,
  type,
  tracking = 0.06,
}: ActionRowInput): ActionRowLayout => {
  if (!actions.length) return { slots: [], band: 0.08, stacked: false }

  const count = actions.length
  const rowWidth = consoleWidth * 0.9
  const advances = actions.map((action) => measure(atlas, action.label, tracking))

  // The size the label wants, and the size below which it stops being readable.
  const floorEm = worldEmForPixels(
    MIN_ACTION_PX,
    type.heightPx,
    type.distance,
    type.fov,
  )
  /*
   * What the label would like to be. A console's controls are the only thing on
   * the plate the visitor is meant to *act* on, so they get to be the second
   * largest type on it after the title — the previous 0.115 left a lone button
   * the same size as a metadata row. Where the row has no space this is only a
   * ceiling and the solve below takes over.
   */
  const wantEm = Math.max(0.14 * type.scale, floorEm)

  /*
   * Solved, not approximated.
   *
   * Row width is `emCost * em + GAP * (count - 1)` — affine in `em`, because the
   * gaps between plates are a fixed distance and do not scale with the type. So
   * the em that exactly fills the row is a division, and the largest em that
   * fits is that value.
   *
   * Scaling `em` by `rowWidth / rowAt(em)` instead — the obvious first move — is
   * wrong for exactly the reason the gaps do not scale: it undershoots by the
   * gap's share, leaving the row a few millimetres over and stacking a set of
   * controls that would have fitted. On a laptop that meant two buttons that fit
   * side by side became a column.
   */
  const emCost = advances.reduce(
    (total, advance) => total + advance + PAD_EM * 2,
    0,
  )
  const emFits = (rowWidth - GAP * (count - 1)) / Math.max(emCost, 0.001)

  let em = Math.min(wantEm, emFits)
  // Below the readability floor a row is not a row worth having.
  const stacked = em < floorEm
  if (stacked) em = wantEm

  if (stacked) {
    /*
     * Stacked: every plate takes the full row width, so the longest label sets
     * the type size and all of them share it. A column of full-width controls is
     * what a narrow plate wants regardless — three buttons abreast on a phone
     * were unreadable long before they overflowed.
     */
    // Same solve, one plate wide: the longest label sets the size for all of them.
    const widest = Math.max(...advances)
    const fit = rowWidth / Math.max(widest + PAD_EM * 2, 0.001)
    em = Math.max(floorEm, Math.min(em, fit))
    const plateHeight = Math.max(0.28, em * 2.3)
    const pitch = plateHeight + GAP * 0.8
    const band = pitch * count + GAP
    // Bottom-up, so the first action sits highest and reading order is preserved.
    const top = -consoleHeight / 2 + band - plateHeight / 2 - GAP * 0.5
    return {
      stacked,
      band,
      slots: actions.map((action, index) => ({
        id: action.id,
        label: action.label,
        em,
        width: rowWidth,
        height: plateHeight,
        x: 0,
        y: top - index * pitch,
      })),
    }
  }

  const plateHeight = Math.max(0.26, em * 2.2)
  const widths = advances.map((advance) => (advance + PAD_EM * 2) * em)
  const total = widths.reduce((sum, width) => sum + width, 0) + GAP * (count - 1)
  const band = plateHeight + GAP * 2

  let cursor = -total / 2
  const slots = actions.map((action, index) => {
    const width = widths[index]
    const x = cursor + width / 2
    cursor += width + GAP
    return {
      id: action.id,
      label: action.label,
      em,
      width,
      height: plateHeight,
      x,
      y: -consoleHeight / 2 + band - plateHeight / 2 - GAP,
    }
  })

  return { slots, band, stacked }
}
