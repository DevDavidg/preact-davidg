import { create } from 'zustand'

export const PHASES = ['SCANNING', 'ASSEMBLING', 'BEAUTY', 'LIVE'] as const

export type Phase = (typeof PHASES)[number]

/**
 * Quality tier. `still` renders a single frame in the BEAUTY state, `lite`
 * drops shard count and post-processing, `cinema` is the full experience.
 */
export type Tier = 'still' | 'lite' | 'cinema'

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
  if (build < 0.18) return 'SCANNING'
  if (build < 0.48) return 'ASSEMBLING'
  if (build < 0.78) return 'BEAUTY'
  return 'LIVE'
}

/** How far into the LIVE portal we are, 0 → 1. */
export const liveFor = (build: number) =>
  Math.min(1, Math.max(0, (build - 0.72) / 0.28))

/** Reduced-motion visitors get one frozen frame at the top of the BEAUTY phase,
 *  where the objects are fully assembled and lit. */
const STILL_BUILD = 0.78
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

interface SceneStore {
  phase: Phase
  tier: Tier
  booted: boolean
  activeSection: string
  setPhase: (phase: Phase) => void
  setTier: (tier: Tier) => void
  setBooted: (booted: boolean) => void
  setActiveSection: (id: string) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  phase: 'SCANNING',
  tier: 'cinema',
  booted: false,
  activeSection: 'hero',
  setPhase: (phase) => set((s) => (s.phase === phase ? s : { phase })),
  setTier: (tier) => set({ tier }),
  setBooted: (booted) => set({ booted }),
  setActiveSection: (activeSection) =>
    set((s) => (s.activeSection === activeSection ? s : { activeSection })),
}))
