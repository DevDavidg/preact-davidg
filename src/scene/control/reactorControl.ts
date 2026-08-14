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
}

export const LAW_PROFILES: Record<LawId, LawProfile> = {
  VACUUM: {
    spread: 1.55,
    jitter: 1.3,
    drift: 1.15,
    damping: 0.55,
    magnet: 0.45,
    agitation: 0.7,
    heat: 0.08,
  },
  VISCOUS: {
    spread: 1,
    jitter: 1,
    drift: 1,
    damping: 3.4,
    magnet: 2.6,
    agitation: 1,
    heat: 0,
  },
  CHAOS: {
    spread: 2.1,
    jitter: 2.4,
    drift: 1.35,
    damping: 1.5,
    magnet: 1.4,
    agitation: 2.6,
    heat: 0.85,
  },
}

/** The law currently in force, interpolated. Read this, not `LAW_PROFILES`. */
export const liveLaw: LawProfile = { ...LAW_PROFILES.VISCOUS }

/* Modes -------------------------------------------------------------------- */

export const MODES = ['wire', 'crt', 'overclock', 'ghost'] as const

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

/* Audio bridge ------------------------------------------------------------- */

/**
 * The voices the scene can ask for. Implemented by `reactorSound`, registered by
 * the sound toggle, and null until the visitor opts in — so every call site can
 * fire an event unconditionally and silence is the default, not a special case.
 */
export interface ReactorVoices {
  /** Pointer crossed a hot object. */
  hover: () => void
  /** UI plate hover — brighter than a world hover so the two never blur. */
  tick: () => void
  /** A module locked. `index` selects the pitch, so each module has a voice. */
  lock: (index: number) => void
  /** The law changed — an interval, not a transient. */
  law: (index: number) => void
  /** Energy arriving down a conduit. */
  whoosh: () => void
  /** The uplink handshake completed. */
  uplink: () => void
  /** A refused operation (a mode the fidelity cannot afford). */
  deny: () => void
  /** Instantaneous loudness, 0 → 1, for anything that visualises the sound. */
  level: () => number
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
  /** How fast the held object is moving, 0 → 1. Feeds friction audio. */
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
  /** Smoothed audio loudness for `uAudio`. */
  audio: number
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
  modes: { wire: false, crt: false, overclock: false, ghost: false },
  modeAmount: { wire: 0, crt: 0, overclock: 0, ghost: 0 },
  held: null,
  heldSpeed: 0,
  hot: 0,
  hotId: null,
  probe: { x: 0, y: 0, z: 0 },
  probeLive: false,
  punch: 0,
  shake: 0,
  audio: 0,
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

let voices: ReactorVoices | null = null
/**
 * The sound toggle's own switch, registered by the button. The developer
 * console needs to be able to mute without owning React state, and the button
 * has to stay the single place that starts and tears down the audio graph.
 */
let soundRequest: ((on: boolean) => void) | null = null
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

/* Audio -------------------------------------------------------------------- */

export const setVoices = (next: ReactorVoices | null) => {
  voices = next
}

export const hasVoices = () => voices !== null

export const setSoundRequest = (next: ((on: boolean) => void) | null) => {
  soundRequest = next
}

/** Ask the sound toggle to switch. No-ops when the button is not mounted. */
export const requestSound = (on: boolean) => {
  soundRequest?.(on)
}

/**
 * Play a voice if the visitor has opted into sound. Every call site fires
 * unconditionally — silence is a null bridge, not a branch in the scene.
 */
export const play = <K extends keyof ReactorVoices>(
  name: K,
  ...args: Parameters<Extract<ReactorVoices[K], (...rest: never[]) => unknown>>
) => {
  const voice = voices?.[name] as ((...rest: unknown[]) => unknown) | undefined
  voice?.(...(args as unknown[]))
}

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
  if (reactorControl.law === law) return
  reactorControl.law = law
  if (!silent) {
    play('law', LAWS.indexOf(law))
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
  if (reactorControl.modes[mode] === on) return
  reactorControl.modes[mode] = on
  // Overclock is a law and a look at once — the visual heat would be a lie if
  // the physics stayed viscous.
  if (mode === 'overclock') setLaw(on ? 'CHAOS' : 'VISCOUS', { silent: true })
  pushLog(`${mode} · ${on ? 'engaged' : 'released'}`)
  play(on ? 'law' : 'tick', 1)
  notify()
}

export const toggleMode = (mode: ModeId) =>
  setMode(mode, !reactorControl.modes[mode])

/**
 * The pointer entered something operable. Only the first entry sounds, so a
 * pointer sliding across a shell does not machine-gun the hover voice.
 */
export const markHot = (id: string, { ui = false } = {}) => {
  if (reactorControl.hotId === id) return
  reactorControl.hotId = id
  play(ui ? 'tick' : 'hover')
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
  play('lock', 0)
  pushLog('core · decompose', 1)
}

export const fireSector = () => {
  reactorControl.fired += 1
  play('lock', reactorControl.fired % 3)
  pushLog(`sector ${String(reactorControl.fired).padStart(2, '0')} · vented`)
  punch(0.18)
  return reactorControl.fired
}

export const completeUplink = () => {
  if (reactorControl.uplinked) return
  reactorControl.uplinked = true
  reactorControl.uplink = 1
  play('uplink')
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

  // Blend the profiles rather than switching them: a law change is a physical
  // transition the visitor should be able to watch happen.
  let total = 0
  let spread = 0
  let jitter = 0
  let drift = 0
  let damping = 0
  let magnet = 0
  let agitation = 0
  let heat = 0
  for (const law of LAWS) {
    const weight = control.lawMix[law]
    if (weight < 1e-4) continue
    const profile = LAW_PROFILES[law]
    total += weight
    spread += profile.spread * weight
    jitter += profile.jitter * weight
    drift += profile.drift * weight
    damping += profile.damping * weight
    magnet += profile.magnet * weight
    agitation += profile.agitation * weight
    heat += profile.heat * weight
  }
  const norm = total > 1e-4 ? 1 / total : 1
  liveLaw.spread = spread * norm
  liveLaw.jitter = jitter * norm
  liveLaw.drift = drift * norm
  liveLaw.damping = damping * norm
  liveLaw.magnet = magnet * norm
  liveLaw.agitation = agitation * norm
  liveLaw.heat = heat * norm

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
  control.audio = damp(
    control.audio,
    voices ? voices.level() : 0,
    9,
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
