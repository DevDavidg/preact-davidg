import { describe, expect, it } from 'vitest'
import { layoutActionRow } from '../../src/scene/kit/actionRow'
import type { GlyphAtlas } from '../../src/scene/ui/glyphAtlas'
import type { TypeMetrics } from '../../src/scene/kit/consoleLayout'

/**
 * The invariant this file exists for:
 *
 *   a control's label always fits inside the control.
 *
 * It has been broken twice, both times because the plate and the label were
 * sized in different files from different constants, and both times it showed up
 * as letters hanging out through a button's outline. It is not something to
 * re-discover by looking at a screenshot on one viewport.
 */

const ADVANCE = 0.6
const TRACKING = 0.06

/** A monospace stand-in, so an expected width is arithmetic rather than a guess. */
const atlas = (): GlyphAtlas => {
  const metrics = new Map()
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ abcdefghijklmnopqrstuvwxyz0123456789·…'
  for (const char of chars) metrics.set(`mono:${char}`, { advance: ADVANCE })
  return { metrics } as unknown as GlyphAtlas
}

const DESKTOP: TypeMetrics = {
  scale: 1,
  distance: 8.7,
  fov: 46,
  heightPx: 945,
}
const PHONE: TypeMetrics = {
  scale: 1.12,
  distance: 8.36,
  fov: 47,
  heightPx: 844,
}

/** The width the glyph field will actually draw, from the same numbers it uses. */
const drawnWidth = (label: string, em: number) =>
  Array.from(label).length * (ADVANCE + TRACKING) * em

const run = (
  labels: string[],
  consoleWidth: number,
  consoleHeight: number,
  type: TypeMetrics,
) =>
  layoutActionRow({
    actions: labels.map((label, index) => ({ id: `a${index}`, label })),
    consoleWidth,
    consoleHeight,
    atlas: atlas(),
    type,
  })

/** Every console in the corridor, at both breakpoints. */
const CASES: [string, string[], number, number, TypeMetrics][] = [
  ['hero, desktop', ['TENGO UN PROYECTO', 'VER EXPERIENCIA'], 2.98, 2.06, DESKTOP],
  ['hero, phone', ['TENGO UN PROYECTO', 'VER EXPERIENCIA'], 2.39, 2.9, PHONE],
  ['module, desktop', ['LEER EL CASO', 'ABRIR SITIO'], 3.02, 2.02, DESKTOP],
  ['module, phone', ['LEER EL CASO', 'ABRIR SITIO'], 2.42, 2.84, PHONE],
  ['experience, desktop', ['VER CV COMPLETO'], 3.07, 2.11, DESKTOP],
  ['experience, phone', ['VER CV COMPLETO'], 2.46, 2.97, PHONE],
  ['contact, desktop', ['ESCRIBIME POR MAIL', 'EN', 'GITHUB'], 3.17, 2.11, DESKTOP],
  ['contact, phone', ['ESCRIBIME POR MAIL', 'EN', 'GITHUB'], 2.54, 2.97, PHONE],
  // English is the longer locale in several places, which is where a layout
  // tuned on Spanish alone gives way.
  ['contact EN, phone', ['WRITE ME AN EMAIL', 'ES', 'GITHUB'], 2.54, 2.97, PHONE],
]

describe('action row', () => {
  it.each(CASES)('keeps %s inside its plates', (_name, labels, w, h, type) => {
    const { slots } = run(labels, w, h, type)
    expect(slots).toHaveLength(labels.length)
    for (const slot of slots) {
      expect(drawnWidth(slot.label, slot.em)).toBeLessThanOrEqual(slot.width)
    }
  })

  it.each(CASES)('keeps %s inside the console', (_name, labels, w, h, type) => {
    const { slots, stacked } = run(labels, w, h, type)
    if (stacked) {
      // A column: each plate on its own row, so only individual width matters.
      for (const slot of slots) expect(slot.width).toBeLessThanOrEqual(w * 0.9 + 1e-9)
      return
    }
    const total =
      slots.reduce((sum, slot) => sum + slot.width, 0) + 0.11 * (slots.length - 1)
    expect(total).toBeLessThanOrEqual(w * 0.9 + 1e-9)
  })

  it('reserves exactly the band the controls occupy', () => {
    // `layoutConsoleRows` subtracts this from its content rect. Too small and
    // copy lands on a button; too large and the plate throws away reading room.
    for (const [, labels, w, h, type] of CASES) {
      const { slots, band } = run(labels, w, h, type)
      const lowest = Math.min(...slots.map((slot) => slot.y - slot.height / 2))
      expect(lowest).toBeGreaterThanOrEqual(-h / 2 - 1e-9)
      expect(band).toBeGreaterThan(0)
      // Every plate sits inside the reserved band.
      const highest = Math.max(...slots.map((slot) => slot.y + slot.height / 2))
      expect(highest).toBeLessThanOrEqual(-h / 2 + band + 1e-9)
    }
  })

  it('stacks rather than overflowing when a row cannot fit', () => {
    // Three long labels on a narrow plate: there is no em at which this is a row.
    const { stacked, slots } = run(
      ['ESCRIBIME POR MAIL', 'VER CV COMPLETO', 'ABRIR EL SITIO'],
      2.2,
      3.0,
      PHONE,
    )
    expect(stacked).toBe(true)
    for (const slot of slots) {
      expect(drawnWidth(slot.label, slot.em)).toBeLessThanOrEqual(slot.width)
    }
  })

  it('stays in one row when there is room for one', () => {
    const { stacked } = run(['EN', 'ES'], 3.0, 2.0, DESKTOP)
    expect(stacked).toBe(false)
  })

  it('has nothing to lay out for a console with no controls', () => {
    const { slots, band } = run([], 3.0, 2.0, DESKTOP)
    expect(slots).toEqual([])
    expect(band).toBeLessThan(0.2)
  })
})
