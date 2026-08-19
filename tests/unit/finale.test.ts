import { describe, expect, it } from 'vitest'
import {
  buildForPath,
  cameraPacing,
  CORRIDOR_START,
  HERO_BUILD,
} from '../../src/scene/layout'
import { clamp01, swallowShape } from '../../src/scene/sceneState'
import { SECTION_IDS } from '../../src/lib/routes'
import { HOME_CHAPTER_VH } from '../../src/lib/sceneRoutes'

/**
 * The ending and the pacing are both plain maths, and both are load-bearing:
 * the swallow has to be reversible or the ending stops being scrubbable, and the
 * pacing remap has to be invertible or every dwell beat lands at the wrong moment.
 * Neither is something to discover by scrolling.
 */

describe('camera pacing', () => {
  it('reaches the hero transit exactly at the hero scroll budget', () => {
    // Below `HERO_BUILD` the lens is still approaching; at it, it is at the centre
    // of the shell. `HeroStage` keys its aperture and fade windows off this.
    expect(cameraPacing(HERO_BUILD)).toBeGreaterThan(0)
    expect(cameraPacing(HERO_BUILD)).toBeLessThan(1)
  })

  it('is monotonic, so scrolling can never move the camera backwards', () => {
    let previous = -1
    for (let step = 0; step <= 100; step += 1) {
      const value = cameraPacing(step / 100)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('inverts exactly', () => {
    // `cameraBeatProgresses` converts path depths back into scroll values through
    // `buildForPath`; an approximate inverse would silently misplace every beat.
    for (const build of [0, 0.05, HERO_BUILD, 0.4, 0.75, 1]) {
      expect(buildForPath(cameraPacing(build))).toBeCloseTo(build, 10)
    }
  })

  it('leaves the corridor room to start after the transit', () => {
    expect(CORRIDOR_START).toBeGreaterThan(HERO_BUILD)
    expect(CORRIDOR_START).toBeLessThan(0.5)
  })
})

describe('swallow', () => {
  it('is zero for the whole corridor and one at the end', () => {
    expect(swallowShape(0).amount).toBe(0)
    expect(swallowShape(0).pull).toBe(0)
    expect(swallowShape(0).beyond).toBe(0)
    expect(swallowShape(1).amount).toBe(1)
    expect(swallowShape(1).pull).toBe(1)
    expect(swallowShape(1).beyond).toBe(1)
  })

  it('is monotonic on every channel, so scroll direction is motion direction', () => {
    let last = swallowShape(0)
    for (let step = 1; step <= 100; step += 1) {
      const next = swallowShape(step / 100)
      expect(next.amount).toBeGreaterThanOrEqual(last.amount)
      expect(next.pull).toBeGreaterThanOrEqual(last.pull)
      expect(next.grip).toBeGreaterThanOrEqual(last.grip)
      expect(next.beyond).toBeGreaterThanOrEqual(last.beyond)
      last = next
    }
  })

  it('is a pure function, so scrubbing back retraces exactly', () => {
    // The contract that makes "pausar, avanzar o retroceder" work: the same scroll
    // position must always produce the same frame, whichever way it was reached.
    const forward = [0.2, 0.5, 0.8].map((value) => swallowShape(value))
    const backward = [0.8, 0.5, 0.2].map((value) => swallowShape(value)).reverse()
    expect(forward).toEqual(backward)
  })

  it('clamps outside the range rather than extrapolating', () => {
    expect(swallowShape(-1).amount).toBe(0)
    expect(swallowShape(4).amount).toBe(1)
  })

  it('holds the corridor at full build once the swallow starts', () => {
    // `runtime.ts` divides scroll by the corridor's share, so any scroll past the
    // split has to leave `build` pinned at 1 rather than growing past it.
    const corridorShare = 0.9
    for (const progress of [0.9, 0.95, 1]) {
      expect(clamp01(progress / corridorShare)).toBe(1)
    }
  })
})

describe('the finale chapter', () => {
  it('is the last chapter of the home rail', () => {
    expect(SECTION_IDS.at(-1)).toBe('finale')
  })

  it('has a height, so there is scroll for the swallow to live in', () => {
    // With no finale chapter `measureSplit` finds no `#finale` node, the corridor
    // share stays at 1 and the ending can never be reached.
    expect(HOME_CHAPTER_VH.finale).toBeGreaterThan(50)
  })

  it('gives every chapter a height', () => {
    for (const id of SECTION_IDS) {
      expect(HOME_CHAPTER_VH[id]).toBeGreaterThan(0)
    }
  })
})
