import { useEffect } from 'react'
import { addTick } from '../motion/ticker'
import type { ExperienceState } from '../scene/capability'
import { useSceneStore, type Fidelity } from '../scene/sceneState'

/**
 * Watches real frame time and lowers quality when the device cannot hold the
 * budget.
 *
 * Screen width and core count are a guess; this is the measurement. It is what
 * catches the common failure the initial guess misses — a capable CPU driving a
 * weak integrated GPU — and it degrades in the order that costs the least look
 * per frame recovered: post-processing, then resolution, then the whole scene.
 *
 * Sampling piggybacks on the shared tick bus, the clock that is already running, so
 * measuring performance does not itself cost a frame.
 */

/** Frame time we are aiming to stay under, in milliseconds (~55 fps). */
const TARGET_MS = 18
/** Sustained frame time that forces a step down. */
const DEMOTE_MS = 22
/** Frame time bad enough to abandon the scene entirely. */
const ABANDON_MS = 34

/** Consecutive bad seconds before demoting; avoids reacting to one long task. */
const DEMOTE_STRIKES = 2
/** Consecutive good seconds before recovering. Deliberately slow: hysteresis. */
const PROMOTE_STRIKES = 10

const SAMPLE_MS = 1000

/**
 * Frames during this window are ignored entirely.
 *
 * The first second of a WebGL scene is shader compilation, texture upload and
 * layout, and it is always slow — measuring it would demote every device on the
 * strength of work that happens exactly once.
 */
const WARM_UP_MS = 2000

const NEXT_DOWN: Record<Fidelity, Fidelity> = {
  full: 'reduced',
  reduced: 'minimal',
  minimal: 'minimal',
}

const NEXT_UP: Record<Fidelity, Fidelity> = {
  minimal: 'reduced',
  reduced: 'full',
  full: 'full',
}

export const usePerformanceGovernor = (experience: ExperienceState) => {
  const setFidelity = useSceneStore((s) => s.setFidelity)
  const setExperience = useSceneStore((s) => s.setExperience)

  useEffect(() => {
    if (experience !== 'cinema' && experience !== 'lite') return

    let frames = 0
    let elapsed = 0
    let warmUp = 0
    let badSeconds = 0
    let goodSeconds = 0
    let abandonSeconds = 0

    const sample = (_time: number, delta: number) => {
      if (warmUp < WARM_UP_MS) {
        warmUp += delta
        return
      }

      frames += 1
      elapsed += delta
      if (elapsed < SAMPLE_MS) return

      const average = elapsed / frames
      frames = 0
      elapsed = 0

      // Abandoning is the most destructive step available, so it also has to be
      // sustained: one stalled second — a background tab waking, a heavy image
      // decoding — must not cost the visitor the whole experience.
      if (average >= ABANDON_MS) {
        abandonSeconds += 1
        if (abandonSeconds >= DEMOTE_STRIKES) {
          setExperience('static')
          return
        }
      } else {
        abandonSeconds = 0
      }

      if (average >= DEMOTE_MS) {
        goodSeconds = 0
        badSeconds += 1
        if (badSeconds < DEMOTE_STRIKES) return
        badSeconds = 0

        const { fidelity } = useSceneStore.getState()
        if (fidelity === 'minimal') {
          // Already stripped to the cheapest render and still missing: the scene
          // is not what this device should be spending its frame on.
          setExperience(experience === 'cinema' ? 'lite' : 'static')
          return
        }
        setFidelity(NEXT_DOWN[fidelity])
        return
      }

      badSeconds = 0
      if (average > TARGET_MS) {
        goodSeconds = 0
        return
      }

      goodSeconds += 1
      if (goodSeconds < PROMOTE_STRIKES) return
      goodSeconds = 0

      const { fidelity } = useSceneStore.getState()
      const restored = NEXT_UP[fidelity]
      if (restored !== fidelity) setFidelity(restored)
    }

    return addTick(sample)
  }, [experience, setFidelity, setExperience])
}
