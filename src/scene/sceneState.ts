import { create } from 'zustand'

export const PHASES = ['SCANNING', 'ASSEMBLING', 'BEAUTY', 'LIVE'] as const

export type Phase = (typeof PHASES)[number]

/** Shared visual boundaries: HUD, material staging and the portal agree on them. */
export const PHASE_BOUNDARIES = {
  scanningEnd: 0.18,
  assemblingEnd: 0.48,
  beautyEnd: 0.78,
  livePrecharge: 0.72,
} as const

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Quality tier. `still` renders a single frame in the BEAUTY state, `lite`
 * drops shard count and post-processing, `cinema` is the full experience.
 */
export type Tier = 'still' | 'lite' | 'cinema'

interface Capabilities {
  deviceMemory?: number
  hardwareConcurrency?: number
}

/** Sync resolve — store boots with the real tier so lite/still never flash cinema spacers. */
export const detectTier = (): Tier => {
  if (typeof window === 'undefined') return 'lite'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'still'
  }

  const nav = navigator as Navigator & Capabilities
  const cores = nav.hardwareConcurrency ?? 8
  const memory = nav.deviceMemory ?? 8
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 900

  if (coarse || narrow || cores <= 4 || memory <= 4) return 'lite'
  return 'cinema'
}

/**
 * Values that change every frame (scroll progress, pointer) live here rather
 * than in React state: `useFrame` reads them directly, so a scroll never costs
 * a render. Only discrete state goes through the store below.
 */
export const sceneState = {
  /** Document scroll progress, 0 → 1. Drives the whole reconstruction. */
  build: 0,
  /** Scroll velocity in px/frame, smoothed. Feeds camera lag and shard jitter. */
  velocity: 0,
  /** Pointer in normalized device coords, -1 → 1 on both axes. */
  pointerX: 0,
  pointerY: 0,
  /** Index of the artifact under the pointer, or -1. */
  focus: -1,
}

export const phaseFor = (build: number): Phase => {
  if (build < PHASE_BOUNDARIES.scanningEnd) return 'SCANNING'
  if (build < PHASE_BOUNDARIES.assemblingEnd) return 'ASSEMBLING'
  if (build < PHASE_BOUNDARIES.beautyEnd) return 'BEAUTY'
  return 'LIVE'
}

/** Precharge sent to materials as the room approaches LIVE, 0 → 1. */
export const liveFor = (build: number) =>
  clamp01(
    (build - PHASE_BOUNDARIES.livePrecharge) /
      (1 - PHASE_BOUNDARIES.livePrecharge),
  )

/**
 * The actual power-on curve. It deliberately waits for LIVE rather than making
 * the portal, bloom and Contact pulse compete with BEAUTY's controlled light.
 */
export const livePowerFor = (build: number) => {
  const live = clamp01(
    (build - PHASE_BOUNDARIES.beautyEnd) /
      (1 - PHASE_BOUNDARIES.beautyEnd),
  )
  return live * live * (3 - 2 * live)
}

/** Scroll speed normalized for shard jitter (matches ReconstructMaterial). */
export const speedFor = () =>
  Math.min(1.5, Math.abs(sceneState.velocity) * 0.012)

/**
 * Depth wave along the dolly: nearer Z locks first. Matches the shader's
 * `(8 - worldZ) / 30 * span` term so CPU and GPU stay in phase.
 */
export const depthBiasFor = (worldZ: number, span = 0.1) => {
  const depth = Math.min(1, Math.max(0, (8 - worldZ) / 30))
  return depth * span
}

/** Reduced-motion visitors get one frozen frame at the top of the BEAUTY phase,
 *  where the objects are fully assembled and lit. */
const STILL_BUILD = PHASE_BOUNDARIES.beautyEnd
/** ...composed from near the start of the dolly, so the artifacts are in frame. */
const STILL_CAMERA = 0.12

export const buildFor = (tier: Tier) =>
  tier === 'still' ? STILL_BUILD : sceneState.build

/**
 * Camera progress is separate from material progress so the frozen frame can
 * show finished objects from the opening vantage point rather than an empty
 * corridor halfway down the room.
 */
export const cameraBuildFor = (tier: Tier) =>
  tier === 'still' ? STILL_CAMERA : sceneState.build

/**
 * Cinema About voxels: `pending` = loading / not yet legible; `live` = mesh can
 * carry the face; `dead` = load/cull failed — DOM portrait stays.
 */
export type AboutVoxels = 'pending' | 'live' | 'dead'

interface SceneStore {
  phase: Phase
  tier: Tier
  booted: boolean
  /** True once the scene's typography has taken the DOM headings over. */
  worldCopy: boolean
  aboutVoxels: AboutVoxels
  activeSection: string
  setPhase: (phase: Phase) => void
  setTier: (tier: Tier) => void
  setBooted: (booted: boolean) => void
  setWorldCopy: (worldCopy: boolean) => void
  setAboutVoxels: (aboutVoxels: AboutVoxels) => void
  setActiveSection: (id: string) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  phase: 'SCANNING',
  tier: detectTier(),
  booted: false,
  worldCopy: false,
  aboutVoxels: 'pending',
  activeSection: 'hero',
  setPhase: (phase) => set((s) => (s.phase === phase ? s : { phase })),
  setTier: (tier) => set({ tier }),
  setBooted: (booted) => set({ booted }),
  setWorldCopy: (worldCopy) => set({ worldCopy }),
  setAboutVoxels: (aboutVoxels) =>
    set((s) => (s.aboutVoxels === aboutVoxels ? s : { aboutVoxels })),
  setActiveSection: (activeSection) =>
    set((s) => (s.activeSection === activeSection ? s : { activeSection })),
}))
