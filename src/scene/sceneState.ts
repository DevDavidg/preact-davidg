import { create } from 'zustand'
import type { ExperienceState, Quality } from './capability'

/** The reactor's four chapters, in scroll order. */
export const PHASES = ['STANDBY', 'CHARGE', 'TRANSMIT', 'IGNITION'] as const

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
  /** Document scroll progress, 0 → 1. Drives the whole reconstruction. */
  build: 0,
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
