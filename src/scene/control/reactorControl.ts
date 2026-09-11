/**
 * The operator's side of the reactor.
 *
 * `sceneState` answers "where is the visitor in the story". This module answers
 * "what has the visitor done to the machine": which law is running, which modes
 * are engaged, what is currently held in the hand, what the last few operations
 * were. It is the same contract as `sceneState` — a plain mutable object read by
 * `useFrame`, never a store — because every value here is sampled per frame and
 * a React render per pointer move would be the whole budget.
 *
 * Two exceptions get a subscription: the mode flags and the operator log. Those
 * change a handful of times per session and have to reach the DOM (a body class,
 * a canvas strip), so they go through `subscribeControl`.
 */
import type { Vector3 } from 'three'
import { clamp01 } from '../sceneState'

/*
 * No value import of Three.js in this file.
 *
 * The control plane is imported by the DOM chrome — the operator bar, the stage
 * treatment, the preflight overlay — all of which are on the critical path. A
 * single `import * as THREE` here pulled the entire renderer into the chunk the
 * browser needs before it can hydrate, adding about 100 kB gzipped to a page
 * that is supposed to be readable without a scene at all. `Vector3` is imported
 * as a type (erased at build), and the one Three helper actually needed is nine
 * lines below.
 */

/**
 * Frame-rate independent exponential decay — the same curve as
 * `THREE.MathUtils.damp`, which is `lerp` with a `1 - e^(-λt)` factor. Written
 * out so this module carries no renderer.
 */
const damp = (current: number, target: number, lambda: number, delta: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * delta))

/* Laws --------------------------------------------------------------------- */

export const LAWS = ['VACUUM', 'VISCOUS', 'CHAOS'] as const

export type LawId = (typeof LAWS)[number]

/**
 * The three laws, as multipliers rather than as absolute values.
 *
 * Every object already authors its own settled spread/jitter/drift; a law scales
 * what that object was going to do anyway. That is what keeps CHAOS from turning
 * a console plate and a 5 m column into the same amount of noise, and it means a
 * new object joins the system by doing nothing at all.
 */
export interface LawProfile {
  /** Multiplies `uSpread` — how far loose shards sit from home. */
  spread: number
  /** Multiplies `uJitter` — the breathing amplitude of loose matter. */
  jitter: number
  /** Multiplies `uDrift` — how much of the shard displacement is applied. */
  drift: number
  /** Damping for anything the operator can throw. Lower = longer float. */
  damping: number
  /** Pull back toward the dock. Lower = the object stays where it is put. */
  magnet: number
  /** Extra spin on the core, and extra idle motion everywhere. */
  agitation: number
  /** Colour push toward the accent, 0 → 1. */
  heat: number

  /* VACUUM: cold matte mass. VISCOUS: visible structure. CHAOS: heated debris. */
  /** How much the barycentric edge read *replaces* the shaded one, 0 → 1. */
  wire: number
  /**
   * Gain on the edge term inside the normal read.
   *
   * Distinct from `wire`, and the distinction matters: `wire` promotes the
   * drawing over the object, while this decides how visible the object's own
   * triangulation is while it is still an object. It is what separates "solid
   * matter with no lines on it" from "solid matter you can see the construction
   * of" — two of the three laws differ in exactly this and nothing else.
   */
  edge: number
  /** Multiplies the shaded face's presence. Above 1 is denser than authored. */
  solid: number
  /** Flattens lighting toward an unlit UI read, 0 → 1. */
  flat: number
}

export const LAW_PROFILES: Record<LawId, LawProfile> = {
  /** Quiet drift, dim edges and no added heat. */
  VACUUM: {
    spread: 0.42,
    jitter: 0.12,
    drift: 0.85,
    damping: 0.55,
    magnet: 0.45,
    agitation: 0.2,
    heat: 0,
    wire: 0,
    edge: 0.08,
    solid: 1.02,
    flat: 0,
  },
  /**
   * VISCOUS — 3D with its structure showing.
   *
   * The authored law and the default: matter suspended in something, edges
   * visible because the object is still being made. Every other law is a
   * departure from this one, which is why all its multipliers are exactly 1.
   */
  VISCOUS: {
    spread: 1,
    jitter: 1,
    drift: 1,
    damping: 3.4,
    magnet: 2.6,
    agitation: 1,
    heat: 0,
    wire: 0,
    edge: 1,
    solid: 1,
    flat: 0,
  },
  /** Violent motion with shaded, heated matter that retains its volume. */
  CHAOS: {
    spread: 3.4,
    jitter: 3.5,
    drift: 1.8,
    damping: 0.8,
    magnet: 0.55,
    agitation: 4.6,
    heat: 1,
    wire: 0.15,
    edge: 1.45,
    solid: 1.1,
    flat: 0.1,
  },
}

/** The law currently in force, interpolated. Read this, not `LAW_PROFILES`. */
export const liveLaw: LawProfile = { ...LAW_PROFILES.VISCOUS }

/**
 * Every field of a profile, so the interpolation below cannot miss one.
 * Derived from VISCOUS because it is the law whose every value is authored.
 */
const LAW_KEYS = Object.keys(LAW_PROFILES.VISCOUS) as (keyof LawProfile)[]

/* Modes -------------------------------------------------------------------- */

export const MODES = ['crt', 'overclock', 'ghost'] as const

export type ModeId = (typeof MODES)[number]

/* Operator log ------------------------------------------------------------- */

export interface LogEntry {
  /** Monotonic id — the strip uses it to know a line is genuinely new. */
  id: number
  text: string
  /** 0 routine, 1 an operation the visitor performed. Drives the accent. */
  weight: number
}

const LOG_DEPTH = 6

/* Beats -------------------------------------------------------------------- */

/**
 * A console's reading beat, republished here by `WorldConsoles`.
 *
 * Conduits, the portrait and the gate all need to know when a given console is
 * being read, and the console timings are *resequenced* at placement time —
 * so the measured DOM section windows are not the same numbers. Rather than
 * thread the placed array through half the scene graph, the one component that
 * computes it publishes it here and everything else samples it per frame.
 */
export interface Beat {
  id: string
  enter: number
  span: number
  exit: number
  exitSpan: number
  /** World position of the placed console, for objects that aim at it. */
  position: Vector3
}

/* State -------------------------------------------------------------------- */

interface ReactorControl {
  /** Whether the operator layer is live at all. Lite/static never arm it. */
  armed: boolean
  law: LawId
  /** Damped presence per law, so a switch crossfades instead of snapping. */
  lawMix: Record<LawId, number>
  /** Requested modes. */
  modes: Record<ModeId, boolean>
  /** Damped 0 → 1 per mode, for shader uniforms. */
  modeAmount: Record<ModeId, number>
  /** Id of whatever the operator is currently holding, or null. */
  held: string | null
  /** How fast the held object is moving, 0 → 1. */
  heldSpeed: number
  /** Damped 1 while the pointer is over something operable. */
  hot: number
  /** Id of the hot object, for the probe's label. */
  hotId: string | null
  /**
   * Where the probe sits in world space.
   *
   * A plain triple rather than a `Vector3`, so this module needs no renderer.
   * Three's own `copy` takes any `{x, y, z}`, so readers are unaffected.
   */
  probe: { x: number; y: number; z: number }
  /** True once the probe has a real position (pointer has been in the canvas). */
  probeLive: boolean
  /** Camera impulse, decays every frame. Written by `punch()`. */
  punch: number
  /** Sustained camera shake from the law, 0 → 1. */
  shake: number
  /** Sectors the visitor has fired off the hero shell. */
  fired: number
  /** How many times the core has been struck without a decompose. */
  coreStrikes: number
  /** Set for a beat after the core is decomposed. */
  decompose: number
  /** 0 → 1 handshake progress at the finale gate. */
  uplink: number
  /** True once the handshake has been completed at least once. */
  uplinked: boolean
  /** Published console beats, keyed by console id. */
  beats: Map<string, Beat>
  /** Featured module beats in corridor order. */
  moduleBeats: Beat[]
  log: LogEntry[]
  /** Bumped whenever a subscriber-visible value changes. */
  revision: number
}

export const reactorControl: ReactorControl = {
  armed: false,
  law: 'VISCOUS',
  lawMix: { VACUUM: 0, VISCOUS: 1, CHAOS: 0 },
  modes: { crt: false, overclock: false, ghost: false },
  modeAmount: { crt: 0, overclock: 0, ghost: 0 },
  held: null,
  heldSpeed: 0,
  hot: 0,
  hotId: null,
  probe: { x: 0, y: 0, z: 0 },
  probeLive: false,
  punch: 0,
  shake: 0,
  fired: 0,
  coreStrikes: 0,
  decompose: 0,
  uplink: 0,
  uplinked: false,
  beats: new Map(),
  moduleBeats: [],
  log: [],
  revision: 0,
}

let logId = 0

const listeners = new Set<() => void>()

const notify = () => {
  reactorControl.revision += 1
  for (const listener of listeners) listener()
}

export const subscribeControl = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Snapshot for `useSyncExternalStore`; only changes when `notify` runs. */
export const controlRevision = () => reactorControl.revision

/* Operations --------------------------------------------------------------- */

export const pushLog = (text: string, weight = 1) => {
  logId += 1
  reactorControl.log = [
    { id: logId, text: text.toUpperCase(), weight },
    ...reactorControl.log,
  ].slice(0, LOG_DEPTH)
  notify()
}

/** A short camera kick. Additive, so two events in a frame read as one bigger one. */
export const punch = (amount = 1) => {
  reactorControl.punch = Math.min(1.6, reactorControl.punch + amount)
}

export const setLaw = (law: LawId, { silent = false } = {}) => {
  if (!LAWS.includes(law)) law = 'VISCOUS'
  if (reactorControl.law === law) return
  reactorControl.law = law
  if (!silent) {
    pushLog(`law · ${law}`)
    punch(0.35)
  }
  notify()
}

export const cycleLaw = () => {
  const next = LAWS[(LAWS.indexOf(reactorControl.law) + 1) % LAWS.length]
  setLaw(next)
}

export const setMode = (mode: ModeId, on: boolean) => {
  if (!MODES.includes(mode)) return
  if (reactorControl.modes[mode] === on) return
  reactorControl.modes[mode] = on
  // Overclock is a law and a look at once — the visual heat would be a lie if
  // the physics stayed viscous.
  if (mode === 'overclock') setLaw(on ? 'CHAOS' : 'VISCOUS', { silent: true })
  pushLog(`${mode} · ${on ? 'engaged' : 'released'}`)
  notify()
}

export const toggleMode = (mode: ModeId) =>
  setMode(mode, !reactorControl.modes[mode])

/** The pointer entered something operable. */
export const markHot = (id: string) => {
  if (reactorControl.hotId === id) return
  reactorControl.hotId = id
}

export const clearHot = (id: string) => {
  if (reactorControl.hotId !== id) return
  reactorControl.hotId = null
}

export const grab = (id: string | null) => {
  if (reactorControl.held === id) return
  reactorControl.held = id
  if (id) punch(0.12)
  notify()
}

export const strikeCore = () => {
  reactorControl.coreStrikes += 1
  return reactorControl.coreStrikes
}

export const decomposeCore = () => {
  reactorControl.decompose = 1
  reactorControl.coreStrikes = 0
  punch(0.8)
  pushLog('core · decompose', 1)
}

export const fireSector = () => {
  reactorControl.fired += 1
  pushLog(`sector ${String(reactorControl.fired).padStart(2, '0')} · vented`)
  punch(0.18)
  return reactorControl.fired
}

export const completeUplink = () => {
  if (reactorControl.uplinked) return
  reactorControl.uplinked = true
  reactorControl.uplink = 1
  pushLog('uplink · handshake complete', 1)
  punch(1.2)
  notify()
}

export const publishBeats = (beats: Beat[], moduleIds: string[]) => {
  reactorControl.beats.clear()
  for (const beat of beats) reactorControl.beats.set(beat.id, beat)
  reactorControl.moduleBeats = moduleIds
    .map((id) => reactorControl.beats.get(id))
    .filter((beat): beat is Beat => Boolean(beat))
}

export const beatFor = (id: string): Beat | undefined =>
  reactorControl.beats.get(id)

/** Presence of a published beat at the current charge, 0 → 1. */
export const beatPresence = (beat: Beat | undefined, build: number) => {
  if (!beat) return 0
  const arrive = clamp01((build - beat.enter) / Math.max(beat.span, 0.001))
  const leave = clamp01((build - beat.exit) / Math.max(beat.exitSpan, 0.001))
  return arrive * (1 - leave)
}

/* Per-frame ---------------------------------------------------------------- */

const LAW_CROSSFADE = 4.2
const MODE_CROSSFADE = 5.5

/**
 * Advances everything damped. Called once per frame from the same driver that
 * advances the pulse clock, at the same negative priority, so every reader in
 * the frame sees the values that were computed for *this* frame.
 */
export const advanceControl = (delta: number) => {
  const control = reactorControl

  for (const law of LAWS) {
    control.lawMix[law] = damp(
      control.lawMix[law],
      control.law === law ? 1 : 0,
      LAW_CROSSFADE,
      delta,
    )
  }

  /*
   * Blend the profiles rather than switching them: a law change is a physical
   * transition the visitor should be able to watch happen — matter losing its
   * lines, or a solid room dissolving into its own drawing.
   *
   * Written over the profile's own keys rather than as one line per field. The
   * previous version named all seven fields three times each, which is precisely
   * the shape where a newly added field silently never gets interpolated: it
   * would sit at whatever VISCOUS initialised it to and the law would appear to
   * have no effect on it.
   */
  let total = 0
  for (const key of LAW_KEYS) liveLaw[key] = 0
  for (const law of LAWS) {
    const weight = control.lawMix[law]
    if (weight < 1e-4) continue
    const profile = LAW_PROFILES[law]
    total += weight
    for (const key of LAW_KEYS) liveLaw[key] += profile[key] * weight
  }
  const norm = total > 1e-4 ? 1 / total : 1
  for (const key of LAW_KEYS) liveLaw[key] *= norm

  for (const mode of MODES) {
    control.modeAmount[mode] = damp(
      control.modeAmount[mode],
      control.modes[mode] ? 1 : 0,
      MODE_CROSSFADE,
      delta,
    )
  }

  control.hot = damp(
    control.hot,
    control.hotId ? 1 : 0,
    control.hotId ? 12 : 6,
    delta,
  )
  control.punch = damp(control.punch, 0, 7, delta)
  control.decompose = damp(control.decompose, 0, 1.4, delta)
  control.shake = damp(
    control.shake,
    control.modeAmount.overclock * 0.6 + control.lawMix.CHAOS * 0.4,
    3,
    delta,
  )
}

/** Full reset — a route change must not leave the machine mid-operation. */
export const resetControl = () => {
  const control = reactorControl
  control.held = null
  control.heldSpeed = 0
  control.hot = 0
  control.hotId = null
  control.probeLive = false
  control.punch = 0
  control.decompose = 0
  control.uplink = 0
  control.fired = 0
  control.coreStrikes = 0
  control.beats.clear()
  control.moduleBeats = []
  notify()
}
