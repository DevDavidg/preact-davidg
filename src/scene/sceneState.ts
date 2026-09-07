import { create } from 'zustand'
import type { ExperienceState, Quality } from './capability'

/** The reactor's four chapters, in scroll order. */
const PHASES = ['STANDBY', 'CHARGE', 'TRANSMIT', 'IGNITION'] as const

export type Phase = (typeof PHASES)[number]

/**
 * Shared boundaries on the 0 → 1 charge axis. The HUD, the materials and the
 * portal all read these, so the readout can never claim CHARGE while the room is
 * already igniting.
 */
export const PHASE_BOUNDARIES = {
  standbyEnd: 0.16,
  chargeEnd: 0.46,
  transmitEnd: 0.78,
  ignitionPrecharge: 0.72,
} as const

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Values that change every frame live outside React. `useFrame` reads them
 * directly, so scrolling costs zero renders; only discrete state below goes
 * through the store.
 */
export const sceneState = {
  /**
   * Progress through the *corridor*, 0 → 1. Drives the whole reconstruction.
   *
   * Deliberately not raw scroll progress any more. The rail carries one extra
   * chapter past the end of the story — the finale, where the portal takes the
   * room in — and if that stretch were folded into `build` then every authored
   * window, every console beat and the camera path itself would have been
   * compressed to make room for it. `build` still means exactly what it always
   * meant and still reaches 1 at the end of the corridor; the finale gets its own
   * axis below.
   */
  build: 0,
  /**
   * Progress through the swallow, 0 → 1. Zero for the whole corridor.
   *
   * A pure function of scroll position, like `build`, and for the same reason:
   * the visitor has to be able to stop it by stopping, run it forward by scrolling
   * down and run it backward by scrolling up. Nothing may integrate this — no
   * springs, no accumulators, no one-way latches — or the ending stops being
   * scrubbable and becomes an animation that merely starts when you arrive.
   */
  swallow: 0,
  /** Smoothed scroll velocity. Feeds camera weight and shard jitter. */
  velocity: 0,
  /** Pointer in normalised device coordinates, -1 → 1. */
  pointerX: 0,
  pointerY: 0,
  /** Index of the featured module currently under focus, or -1. */
  focus: -1,
}

export const resetSceneMotion = () => {
  sceneState.build = 0
  sceneState.swallow = 0
  sceneState.velocity = 0
  sceneState.pointerX = 0
  sceneState.pointerY = 0
  sceneState.focus = -1
}

export const phaseFor = (build: number): Phase => {
  if (build < PHASE_BOUNDARIES.standbyEnd) return 'STANDBY'
  if (build < PHASE_BOUNDARIES.chargeEnd) return 'CHARGE'
  if (build < PHASE_BOUNDARIES.transmitEnd) return 'TRANSMIT'
  return 'IGNITION'
}

/** Precharge handed to materials as the room approaches ignition, 0 → 1. */
export const liveFor = (build: number) =>
  clamp01(
    (build - PHASE_BOUNDARIES.ignitionPrecharge) /
      (1 - PHASE_BOUNDARIES.ignitionPrecharge),
  )

/**
 * The power-on curve. It deliberately waits for the final chapter rather than
 * letting the portal, the bloom and the contact pulse compete with the
 * controlled light of the transmission chapter.
 */
export const livePowerFor = (build: number) => {
  const live = clamp01(
    (build - PHASE_BOUNDARIES.transmitEnd) /
      (1 - PHASE_BOUNDARIES.transmitEnd),
  )
  return live * live * (3 - 2 * live)
}

/**
 * Where the room's orbit ends, as a fraction of where it started.
 *
 * Deliberately not zero: past this the room is a point, which draws as nothing
 * while costing exactly as much as drawing everything.
 */
const ORBIT_FLOOR = 0.03
/** Full turns the room makes around the well on its way in. Three gulps, four turns. */
const ORBIT_TURNS = 4

/**
 * Three suction beats across the swallow — sequential, not stacked.
 *
 * Centres and half-widths are authored so the pulses do not overlap: only one
 * gulp is live at a time, which is what keeps the ending readable as three pulls
 * rather than a continuous mush. Amplitudes climb so the last gulp is the one
 * that takes the room.
 */
const SUCTION_GULPS = [
  { centre: 0.16, half: 0.12, amp: 0.95 },
  { centre: 0.42, half: 0.13, amp: 1.28 },
  { centre: 0.68, half: 0.15, amp: 1.62 },
] as const

export interface SwallowShape {
  amount: number
  pull: number
  grip: number
  /** Orbital radius as a fraction of the corridor's own length. */
  radius: number
  /** Accumulated orbital angle, in radians. Keplerian, so it accelerates. */
  orbit: number
  /** Tidal stretch along the radius, 0 → 1. Goes as 1/r³, like the real thing. */
  tide: number
  beyond: number
  /** The horizon itself: the last few percent, where the light goes out. */
  crossing: number
  /**
   * How much of the room the well has actually taken, 0 → 1. Monotonic.
   *
   * The channel every layer that *collapses* something should read. `suction`
   * below is a beat — it returns to zero between gulps — so anything that
   * multiplied by it was letting the room back out again the moment a pulse
   * passed. This is what those three pulses have removed and are never giving
   * back, so the ending only ever tightens.
   */
  drain: number
  /**
   * How present the corridor's already-retired matter is, 0 → 1.
   *
   * The finale runs entirely at `build === 1`, by which point every console has
   * passed its own exit window and faded — so the field was closing on an empty
   * room. This brings back what the corridor built, for exactly as long as there
   * is a room left to take it out of.
   */
  recall: number
  /**
   * Instantaneous suction of the active gulp, 0 → 1.62 (the third gulp's amp).
   * Non-monotonic by design — three peaks — but still a pure function of scroll.
   */
  suction: number
  /** Which gulp is peaking (0, 1, or 2). Sticky to the nearest live pulse. */
  gulp: number
  /** Squared kick for camera / scale punches — reads as a tug, not a sine wave. */
  surge: number
}

/**
 * The swallow, shaped.
 *
 * One curve, read by every layer that takes part in the ending, so the room, the
 * camera, the fog and the well's own field can never disagree about how far in
 * the collapse is.
 *
 * `pull` is eased in — the first pixels of scroll past the corridor should read as
 * a tug rather than a lurch — while `grip` is a later, sharper curve for the
 * things that should only happen once the room is genuinely going.
 *
 * `orbit` and `tide` are the two that make the ending read as *falling* rather
 * than as shrinking:
 *
 * - **orbit** is the winding. Angular speed on a decaying orbit goes as r^-3/2 by
 *   Kepler's third law, so the room does not merely keep turning as it goes in, it
 *   turns *faster and faster* — and that runaway is the single most recognisable
 *   thing about matter falling into a well.
 * - **tide** is spaghettification. Gravity's gradient across an object goes as
 *   1/r³, pulling the near side in harder than the far, so infalling matter is
 *   drawn out into a filament aimed at the hole rather than shrinking evenly.
 *
 * Both are powers of scroll rather than the literal laws, and the reason is the
 * rail. Substituting a decaying radius into r^-3/2 really does reproduce the
 * runaway — and puts sixty percent of the turns inside the last ten percent of the
 * swallow, which on this page is about a hundred and seventy pixels of wheel. The
 * physics is a divergence and the scroll is finite, so what is authored here is the
 * *character* of those laws — an angular rate that climbs by an order of magnitude
 * across the fall, a stretch that stays out of the way until the end and then takes
 * over — spread across scroll a visitor can actually travel through.
 *
 * Every channel is monotonic and pure, which is the whole contract of this ending:
 * scroll up and all of them run backwards, exactly.
 */
/** Raised-cosine envelope, 1 at the centre and 0 at ±half. */
const gulpEnvelope = (s: number, centre: number, half: number) => {
  const t = (s - centre) / half
  if (Math.abs(t) >= 1) return 0
  return 0.5 * (1 + Math.cos(Math.PI * t))
}

/**
 * How much of one beat has been *taken*, 0 before it and 1 after.
 *
 * The integral of `gulpEnvelope`, in closed form and normalised. Its derivative
 * is the envelope itself — never negative — so this cannot decrease, which is the
 * whole point: a gulp that is over has still happened, and the room it pulled in
 * does not come back out while the visitor scrolls between beats.
 */
const gulpProgress = (s: number, centre: number, half: number) => {
  const t = Math.min(1, Math.max(-1, (s - centre) / half))
  return (t + 1) / 2 + Math.sin(Math.PI * t) / (2 * Math.PI)
}

/** Denominator for the drain: what all three gulps take between them. */
const GULP_TOTAL = SUCTION_GULPS.reduce((sum, beat) => sum + beat.amp, 0)

/**
 * Where the recalled room reaches full strength, in swallow units.
 *
 * Short on purpose. The matter has to be back before the first gulp at 0.16 has
 * anything to pull on, and the visitor is at `build === 1` looking down a
 * corridor whose far end is behind them — so the room re-forms out of frame and
 * arrives already falling.
 */
const RECALL_IN = 0.1

/**
 * Where the recalled room is taken back off the screen, in drain units.
 *
 * The recall used to hold at full strength until `beyond` opened at swallow 0.72,
 * and `beyond` is the *last* stretch — so for the whole middle of the ending every
 * line of copy the corridor had already retired was back, at full size, drawn
 * without depth, directly across the aperture. The well is a post-process pass, so
 * it has no depth to be occluded by and no way to reject those fragments: what the
 * visitor actually saw at the third gulp was the event horizon behind a wall of
 * type and voxels, which is the one thing an event horizon must never have in
 * front of it.
 *
 * Tying the exit to the drain instead is what hands the well its own beat. The
 * matter comes back for the gulps that are supposed to eat it, and it is gone by
 * the time there is a shadow large enough for it to be standing in front of. The
 * window starts past drain 0.3 so the room is still whole at swallow 0.3, which
 * `scripts/check-swallow.ts` asserts, and closes at 0.72 — reached just before the
 * third gulp, the beat that was always meant to be the last thing the room does.
 */
const RECALL_OUT_FROM = 0.3
const RECALL_OUT_TO = 0.72

export const swallowShape = (swallow: number): SwallowShape => {
  const s = clamp01(swallow)
  const pull = s * s

  let suction = 0
  let gulp = 0
  let taken = 0
  for (let index = 0; index < SUCTION_GULPS.length; index += 1) {
    const beat = SUCTION_GULPS[index]
    const strength = gulpEnvelope(s, beat.centre, beat.half) * beat.amp
    if (strength >= suction) {
      suction = strength
      gulp = index
    }
    taken += gulpProgress(s, beat.centre, beat.half) * beat.amp
  }

  /*
   * The drain is the gulps themselves, ratcheted.
   *
   * Four fifths of it is what the three beats have carried off, which is what
   * makes the ending read as three pulls rather than as a slide: the curve
   * climbs steeply through a gulp and only creeps between them. The remaining
   * fifth is a continuous floor, so those quiet stretches still tighten instead
   * of holding — and it is also what lands the sum exactly on 1 at the end of
   * the rail, where the third beat alone would have finished early.
   */
  const drain = clamp01((taken / GULP_TOTAL) * 0.82 + pull * 0.18)
  const beyond = clamp01((s - 0.72) / 0.24)
  const recalled = clamp01(s / RECALL_IN)
  // Smoothstep on the drain, not on scroll: the room leaves as fast as the well
  // is actually taking it, so a visitor who stalls between gulps keeps the room
  // they can still see rather than watching it evaporate on a timer.
  const spent = clamp01(
    (drain - RECALL_OUT_FROM) / (RECALL_OUT_TO - RECALL_OUT_FROM),
  )
  const cleared = spent * spent * (3 - 2 * spent)

  return {
    amount: s,
    pull,
    grip: s * s * s,
    /*
     * The room's span *is* the drain.
     *
     * It used to be its own near-linear power of scroll, which meant the beats
     * had to be applied on top as a multiplier — and a multiplier that returns
     * to 1 between gulps let the corridor spring back out to four fifths of its
     * width after the first pull. Reading the ratchet directly is what makes the
     * span monotonic: the room holds between beats, it never re-opens.
     */
    radius: 1 - drain * (1 - ORBIT_FLOOR),
    // 2.05 still runs away — end rate ~ten times the first gulp — without parking
    // three of the four turns inside the last eighty pixels of wheel.
    orbit: s ** 2.05 * ORBIT_TURNS * Math.PI * 2,
    tide: s ** 2.05,
    /** The last stretch, where the room is gone and only the light is left. */
    beyond,
    /*
     * Finished before the end of the rail, not at it.
     *
     * This drives the light going out, and Lenis eases toward its target rather
     * than snapping to it — so a curve that only completed at exactly 1 would
     * leave the visitor holding the bottom of the page watching a bloomed photon
     * ring at thirty percent, which is a haze, not an ending. Completing at 0.97
     * gives the black frame a few percent of scroll to actually exist in.
     */
    crossing: clamp01((s - 0.86) / 0.11),
    drain,
    // Smoothstep in, then handed back: past `beyond` the room is a point inside
    // the well and what is left in frame is the well's own light.
    recall:
      recalled * recalled * (3 - 2 * recalled) * (1 - cleared) * (1 - beyond),
    suction,
    gulp,
    surge: suction * suction,
  }
}

/** Scroll speed normalised for shard jitter (matches ReconstructMaterial). */
export const speedFor = () =>
  Math.min(1.5, Math.abs(sceneState.velocity) * 0.012)

/**
 * Depth wave along the dolly: nearer Z locks first. Mirrors the shader's
 * `(8 - worldZ) / 30 * span` term so CPU and GPU stay in phase.
 */
export const depthBiasFor = (worldZ: number, span = 0.1) => {
  const depth = clamp01((8 - worldZ) / 30)
  return depth * span
}

/**
 * How much post-processing and resolution the governor currently allows.
 * `full` is the authored look; `reduced` drops the post chain; `minimal` also
 * pins device pixel ratio to 1.
 */
export type Fidelity = 'full' | 'reduced' | 'minimal'

interface SceneStore {
  /** Resolved capability decision. `checking` until the client has looked. */
  experience: ExperienceState
  /** True once the renderer has actually presented a frame. */
  sceneReady: boolean
  fidelity: Fidelity
  phase: Phase
  booted: boolean
  activeSection: string
  setExperience: (experience: ExperienceState) => void
  setSceneReady: (ready: boolean) => void
  setFidelity: (fidelity: Fidelity) => void
  setPhase: (phase: Phase) => void
  setBooted: (booted: boolean) => void
  setActiveSection: (id: string) => void
}

/**
 * The store boots in `checking` with the scene absent. That is also the state the
 * prerendered HTML is generated in, so the static output is always the complete
 * document and hydration never has to undo a 3D-only layout.
 */
export const useSceneStore = create<SceneStore>((set) => ({
  experience: 'checking',
  sceneReady: false,
  fidelity: 'full',
  phase: 'STANDBY',
  booted: false,
  activeSection: 'hero',
  setExperience: (experience) =>
    set((s) => (s.experience === experience ? s : { experience })),
  setSceneReady: (sceneReady) =>
    set((s) => (s.sceneReady === sceneReady ? s : { sceneReady })),
  setFidelity: (fidelity) =>
    set((s) => (s.fidelity === fidelity ? s : { fidelity })),
  setPhase: (phase) => set((s) => (s.phase === phase ? s : { phase })),
  setBooted: (booted) => set((s) => (s.booted === booted ? s : { booted })),
  setActiveSection: (activeSection) =>
    set((s) => (s.activeSection === activeSection ? s : { activeSection })),
}))

/** True when a WebGL canvas should exist for this experience state. */
export const rendersCanvas = (experience: ExperienceState): boolean =>
  experience === 'lite' || experience === 'cinema'

/** The quality to hand to the scene; `checking`/`failed` never reach it. */
export const qualityOf = (experience: ExperienceState): Quality =>
  experience === 'cinema' ? 'cinema' : 'lite'
