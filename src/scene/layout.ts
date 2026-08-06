import * as THREE from 'three'
import { PHASE_BOUNDARIES } from './sceneState'
import type { SectionWindow } from './ui/sectionRanges'

/**
 * The camera dollies along this spline as the page scrolls, so scrolling reads
 * as travelling through one room rather than cutting between sections.
 */
export const CAMERA_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.75, 10.2),
    new THREE.Vector3(2.6, 1.35, 5.6),
    new THREE.Vector3(-1.5, 1.95, 1.8),
    new THREE.Vector3(1.9, 2.45, -2.4),
    new THREE.Vector3(-1.0, 1.4, -6.2),
    new THREE.Vector3(0, 1.6, -10.6),
  ],
  false,
  'catmullrom',
  0.35,
)

/** Where the camera looks, one beat ahead of where it is. */
export const TARGET_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.25, 4.2),
    new THREE.Vector3(0.7, 1.05, 1.4),
    new THREE.Vector3(0, 1.3, -1.6),
    new THREE.Vector3(0, 1.35, -5.0),
    new THREE.Vector3(0, 1.2, -9.0),
    new THREE.Vector3(0, 1.45, -14.0),
  ],
  false,
  'catmullrom',
  0.35,
)

export interface ArtifactPlacement {
  position: [number, number, number]
  /** Yaw in radians, angling the panel back toward the corridor centre. */
  yaw: number
  /** Pitch in radians, tipping the panel down toward the dolly. */
  pitch: number
  scale: number
}

/**
 * Artifacts line the corridor like a gallery: eye height, on the wall opposite
 * the camera's swing at that depth, angled back into the lane. Index matches the
 * DOM artifact index.
 *
 * Lateral ~2.35 keeps them inside the frustum without parking them on the lens —
 * at ±1.85 and scale >1 they filled the frame and read as a full-bleed wallpaper
 * instead of objects in the room.
 */
export const ARTIFACTS: ArtifactPlacement[] = [
  { position: [-2.15, 1.55, 5.2], yaw: 0.62, pitch: -0.12, scale: 1.12 },
  { position: [2.2, 1.6, 2.6], yaw: -0.65, pitch: -0.14, scale: 1.08 },
  { position: [-2.2, 1.5, 0.0], yaw: 0.68, pitch: -0.12, scale: 1.16 },
  { position: [2.15, 1.58, -2.6], yaw: -0.6, pitch: -0.14, scale: 1.1 },
  { position: [-2.1, 1.52, -5.2], yaw: 0.64, pitch: -0.14, scale: 1.14 },
  { position: [2.2, 1.55, -7.8], yaw: -0.66, pitch: -0.12, scale: 1.08 },
]

/** Aspect of the artifact panels, matching the 16:10 project shots. */
export const ARTIFACT_PANEL = { width: 2.8, height: 1.75 } as const

/**
 * About headshot — left of the lane at eye height. Kept in-frame (not clipped
 * on the left edge) while the dolly sits on About centre.
 */
export const ABOUT_PORTRAIT: ArtifactPlacement = {
  position: [-1.15, 1.42, -7.35],
  yaw: 0.28,
  pitch: -0.06,
  scale: 1.05,
}

/** ~3:4 plate for the headshot voxel field. */
export const ABOUT_PANEL = { width: 1.35, height: 1.85 } as const

/** Public URL for the cinema portrait texture sampled into voxels. */
export const ABOUT_PORTRAIT_URL = '/about/david-portrait.jpg'

/**
 * The glow the room powers on toward. Far enough past the end of the camera path
 * that it reads as a destination rather than a plane in front of the lens.
 */
export const PORTAL_POSITION: [number, number, number] = [0, 1.8, -24]

/** Fog density — tint comes from `sceneColors.base` in Atmosphere. */
export const FOG_DENSITY = 0.052

/**
 * Build value at which the dolly reaches a given depth. Objects planted in the
 * room use this to time their own assembly against the camera instead of against
 * a section's scroll range, so nothing lands after the camera has driven past it.
 */
export const buildAtDepth = (() => {
  const SAMPLES = 96
  const point = new THREE.Vector3()
  const depths: number[] = []

  for (let index = 0; index <= SAMPLES; index++) {
    CAMERA_PATH.getPointAt(index / SAMPLES, point)
    depths.push(point.z)
  }

  return (z: number): number => {
    for (let index = 1; index <= SAMPLES; index++) {
      if (depths[index] > z) continue
      const previous = depths[index - 1]
      const t = (previous - z) / Math.max(previous - depths[index], 1e-5)
      return (index - 1 + t) / SAMPLES
    }
    return 1
  }
})()

/**
 * Scroll remains continuous, but camera speed eases down at each gallery object
 * and the About portrait. These are soft dwell points, not hard stops: panels,
 * typography and the DOM keep following real build progress while the eye gets
 * a moment to read each shot.
 */
const cameraBeatProgresses = (() => {
  const beats = [
    0,
    ...ARTIFACTS.map(({ position }) => buildAtDepth(position[2])),
    buildAtDepth(ABOUT_PORTRAIT.position[2]),
    1,
  ].sort((left, right) => left - right)

  return beats.reduce<number[]>((unique, beat) => {
    const previous = unique.at(-1)
    if (previous === undefined || beat - previous > 0.001) unique.push(beat)
    return unique
  }, [])
})()

const easeDwell = (value: number) => value * value * (3 - 2 * value)

/** Strength near a gallery/portrait beat; used to add a little camera weight. */
export const cameraHoldFor = (build: number) => {
  const nearest = cameraBeatProgresses
    .slice(1, -1)
    .reduce(
      (distance, beat) => Math.min(distance, Math.abs(build - beat)),
      Infinity,
    )

  return 1 - THREE.MathUtils.smoothstep(nearest, 0.008, 0.052)
}

/**
 * A monotonic remap with the same endpoints as scroll. Its zero-velocity
 * tangents create cinematic micro-holds without desynchronising world geometry
 * that must continue to assemble against the real `build` value.
 */
export const cameraProgressFor = (build: number) => {
  const progress = THREE.MathUtils.clamp(build, 0, 1)

  for (let index = 1; index < cameraBeatProgresses.length; index++) {
    const end = cameraBeatProgresses[index]
    if (progress > end) continue

    const start = cameraBeatProgresses[index - 1]
    const span = Math.max(end - start, 0.0001)
    const local = THREE.MathUtils.clamp((progress - start) / span, 0, 1)
    return THREE.MathUtils.lerp(start, end, easeDwell(local))
  }

  return progress
}

/**
 * SCANNING is closer and watchful, BEAUTY opens once the room has settled, and
 * LIVE tightens toward the portal. The base remains owned by the Canvas camera.
 */
export const cameraFovFor = (build: number, baseFov: number) => {
  const scanning =
    1 -
    THREE.MathUtils.smoothstep(
      build,
      0.03,
      PHASE_BOUNDARIES.scanningEnd,
    )
  const beauty =
    THREE.MathUtils.smoothstep(
      build,
      PHASE_BOUNDARIES.assemblingEnd,
      0.66,
    ) *
    (1 -
      THREE.MathUtils.smoothstep(
        build,
        PHASE_BOUNDARIES.beautyEnd,
        0.9,
      ))
  const live = THREE.MathUtils.smoothstep(
    build,
    PHASE_BOUNDARIES.beautyEnd,
    0.92,
  )

  return baseFov - scanning * 1.25 + beauty * 0.7 - live * 1.05
}

/**
 * Metres ahead of the panel along the corridor. Assembly is timed to visibility,
 * not to the moment the dolly draws alongside (that read as “arms only after I
 * already passed it”).
 */
const VIEW_START_Z = 5.5
/** Fully locked while the camera is still this far in front — plate readable in frame. */
const VIEW_LOCK_Z = 1.6

/**
 * Scroll window shared by artifact shard panels and their world-copy labels.
 * Starts when the panel enters the approach view; finishes before `pass` so the
 * project is assembled while the visitor is looking at it.
 */
export const artifactAssembleWindow = (
  z: number,
): { enter: number; span: number; pass: number; lock: number } => {
  const pass = buildAtDepth(z)
  const rawEnter = buildAtDepth(z + VIEW_START_Z)
  const rawLock = buildAtDepth(z + VIEW_LOCK_Z)
  const enter = Math.max(Math.min(rawEnter, rawLock - 0.04), 0)
  const lock = Math.max(rawLock, enter + 0.04)
  const span = Math.max(lock - enter, 0.04)
  return { enter, span, pass, lock }
}

export interface ArtifactWindow {
  enter: number
  span: number
  pass: number
}

/**
 * `artifactAssembleWindow` times each panel purely off camera depth, which
 * drifts from the DOM the moment Work's measured height (or the camera path)
 * changes — measured drift on this build reached ~900px for the middle panel
 * and ~1800px for the last one (of a ~6100px page), i.e. panels were only
 * passing the camera once the visitor had already scrolled into
 * Services/Process, sometimes About. This keeps each panel's relative pacing
 * (nearer objects still land first) but rescales the whole gallery to fit
 * inside Work's own measured bounds, so the last panel always finishes its
 * pass before Work is done on screen.
 */
export const artifactGroupWindows = (
  work: SectionWindow | undefined,
): ArtifactWindow[] => {
  const raw = ARTIFACTS.map(({ position }) => artifactAssembleWindow(position[2]))
  if (!work) return raw.map(({ enter, span, pass }) => ({ enter, span, pass }))

  const first = raw[0].enter
  const last = raw.at(-1)!.pass
  const reference = Math.max(last - first, 0.08)

  const from = work.enter
  const to = Math.max(work.exit - 0.03, from + 0.16)
  const scale = (to - from) / reference

  return raw.map(({ enter, span, pass }) => ({
    enter: from + (enter - first) * scale,
    span: span * scale,
    pass: from + (pass - first) * scale,
  }))
}

/** World-copy title lands after the panel starts; holds past the camera pass. */
const LABEL_ENTER_FRAC = 0.15
const LABEL_SPAN_FRAC = 0.7
const LABEL_HOLD_PAST_PASS = 0.12
const LABEL_EXIT_SPAN = 0.05

/**
 * Scroll window for the 3D artifact title / numeral labels.
 * Kept in one place so world-copy glyphs stay aligned with the panel shards.
 */
export const artifactLabelWindow = (
  window: ArtifactWindow,
): { enter: number; span: number; exit: number; exitSpan: number } => {
  const { enter, span, pass } = window
  // Cap at 1 so deep cards never keep DOM titles transparent past scroll end
  // (build clamps to 1 while pass + hold can exceed it).
  const exit = Math.min(pass + LABEL_HOLD_PAST_PASS, 1)
  return {
    enter: enter + span * LABEL_ENTER_FRAC,
    span: span * LABEL_SPAN_FRAC,
    exit,
    exitSpan: Math.min(LABEL_EXIT_SPAN, Math.max(1 - exit, 0)),
  }
}

/**
 * Cinema shard density. Narrow / short viewports keep one draw call but fewer
 * tris — fill-rate is the cinema cost, not draw count.
 */
export const cinemaPanelSegments = (): [number, number] => {
  if (typeof window === 'undefined') return [12, 8]
  if (window.innerWidth < 1200 || window.innerHeight < 720) return [9, 6]
  return [12, 8]
}

/**
 * Voxel grid for the About headshot. Background cull drops most cells; denser
 * sampling keeps face/glasses readable. Narrow viewports thin the grid.
 */
export const cinemaPortraitVoxelGrid = (): [number, number] => {
  if (typeof window === 'undefined') return [64, 86]
  if (window.innerWidth < 1200 || window.innerHeight < 720) return [48, 64]
  return [64, 86]
}

/** True when the cinema tier should use the lighter instance budgets. */
export const cinemaCompactViewport = () =>
  typeof window !== 'undefined' &&
  (window.innerWidth < 1200 || window.innerHeight < 720)

/**
 * Em cell size for world-copy voxels. Compact viewports use a coarser grid so
 * hero + project labels stay under the cinema instance budget.
 */
export const cinemaTypeVoxelCellEm = (kind: 'hero' | 'numeral') => {
  const compact = cinemaCompactViewport()
  if (kind === 'hero') return compact ? 0.13 : 0.11
  return compact ? 0.13 : 0.11
}
