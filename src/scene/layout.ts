import * as THREE from "three";
import { PHASE_BOUNDARIES } from "./sceneState";
import type { SectionWindow } from "./ui/sectionRanges";

/**
 * The room, in metres.
 *
 * The camera dollies along a spline as the page scrolls, so scrolling reads as
 * travelling through one space rather than cutting between sections. Every object
 * is placed relative to that spline, and every assembly window is derived from a
 * measured DOM section — no hand-tuned scroll percentages, which drift the moment
 * copy length or language changes.
 */

/**
 * Side-entry dolly: approach from port, pass through the hero core, then settle
 * into the corridor lane. Early points are denser so scroll owns the traversal.
 */
export const CAMERA_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-5.4, 2.05, 8.4),
    new THREE.Vector3(-3.1, 1.85, 6.5),
    // Graze the shell from port — never park the lens inside opaque debris.
    new THREE.Vector3(-1.55, 1.75, 5.35),
    new THREE.Vector3(0.35, 1.65, 3.7),
    new THREE.Vector3(-1.2, 1.95, 1.7),
    new THREE.Vector3(1.5, 2.35, -2.2),
    new THREE.Vector3(-0.9, 1.55, -6.0),
    new THREE.Vector3(0, 1.7, -10.4),
  ],
  false,
  "catmullrom",
  0.35,
);

/** Where the camera looks, one beat ahead of where it is. */
export const TARGET_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 1.55, 5.0),
    new THREE.Vector3(-0.15, 1.5, 4.2),
    new THREE.Vector3(0.25, 1.45, 2.4),
    new THREE.Vector3(0.15, 1.35, 0.05),
    new THREE.Vector3(0, 1.3, -1.6),
    new THREE.Vector3(0, 1.35, -5.0),
    new THREE.Vector3(0, 1.25, -8.8),
    new THREE.Vector3(0, 1.45, -13.6),
  ],
  false,
  "catmullrom",
  0.35,
);

export interface ArtifactPlacement {
  position: [number, number, number];
  /** Yaw in radians, angling the module back toward the corridor centre. */
  yaw: number;
  /** Pitch in radians, tipping the module down toward the dolly. */
  pitch: number;
  scale: number;
}

/**
 * Three featured modules, alternating sides of the corridor.
 *
 * There used to be six, each the same size, which made the gallery a slalom with
 * no hierarchy and loaded six full-resolution textures for a scene the visitor
 * scrolls through in seconds. Three modules match the three featured cases, give
 * each one a real beat, and cut texture memory by half.
 */
export const ARTIFACTS: ArtifactPlacement[] = [
  { position: [-2.15, 1.55, 4.6], yaw: 0.6, pitch: -0.12, scale: 1.18 },
  { position: [2.2, 1.6, 0.4], yaw: -0.62, pitch: -0.13, scale: 1.14 },
  { position: [-2.1, 1.52, -3.8], yaw: 0.64, pitch: -0.12, scale: 1.2 },
];

/**
 * Corridor slots for the three featured modules.
 *
 * These are no longer free-standing panels in the room — a module's bay is now
 * mounted on the console that carries its copy, so the work and the words about
 * it can never be on screen at different times. What survives here is the
 * corridor geometry the slots still drive: which bay a conduit runs to, and
 * which column of the colonnade lifts when a module is in focus.
 */

/**
 * The reactor core: the object the whole room is wired to. It sits behind the
 * opening vantage point so the first chapter has something to charge, and the
 * conduits below run from it toward each module.
 */
/** Hero centrepiece — close to the opening camera look-target. */
export const REACTOR_CORE: [number, number, number] = [0, 1.62, 5.15];

/** Conduit spine height — below eye level so it never crosses a module face. */
export const CONDUIT_Y = 0.42;

/**
 * About headshot — left of the lane at eye height, kept clear of the right-hand
 * reading column in the DOM.
 */
export const ABOUT_PORTRAIT: ArtifactPlacement = {
  position: [-1.15, 1.42, -7.35],
  yaw: 0.28,
  pitch: -0.06,
  scale: 1.05,
};

/** ~3:4 plate for the headshot voxel field. */
export const ABOUT_PANEL = { width: 1.35, height: 1.85 } as const;

export const ABOUT_PORTRAIT_URL = "/about/david-portrait.jpg";

/**
 * The glow the room powers on toward. Far enough past the end of the camera path
 * that it reads as a destination rather than a plane in front of the lens.
 */
export const PORTAL_POSITION: [number, number, number] = [0, 1.8, -24];

/** Fog density — tint comes from `sceneColors.base` in Atmosphere. */
export const FOG_DENSITY = 0.04;

/**
 * Charge value at which the dolly reaches a given depth. Objects planted in the
 * room time their assembly against the camera rather than against a section's
 * scroll range, so nothing lands after the camera has already driven past it.
 */
const buildAtDepth = (() => {
  const SAMPLES = 96;
  const point = new THREE.Vector3();
  const depths: number[] = [];

  for (let index = 0; index <= SAMPLES; index++) {
    CAMERA_PATH.getPointAt(index / SAMPLES, point);
    depths.push(point.z);
  }

  return (z: number): number => {
    for (let index = 1; index <= SAMPLES; index++) {
      if (depths[index] > z) continue;
      const previous = depths[index - 1];
      const t = (previous - z) / Math.max(previous - depths[index], 1e-5);
      return (index - 1 + t) / SAMPLES;
    }
    return 1;
  };
})();

/**
 * Scroll stays continuous, but camera speed eases down at each module and at the
 * portrait. These are soft dwell points, not stops: everything else keeps
 * following real scroll progress while the eye gets a moment to read.
 */
const cameraBeatProgresses = (() => {
  const beats = [
    0,
    ...ARTIFACTS.map(({ position }) => buildAtDepth(position[2])),
    buildAtDepth(ABOUT_PORTRAIT.position[2]),
    1,
  ].sort((left, right) => left - right);

  return beats.reduce<number[]>((unique, beat) => {
    const previous = unique.at(-1);
    if (previous === undefined || beat - previous > 0.001) unique.push(beat);
    return unique;
  }, []);
})();

const easeDwell = (value: number) => value * value * (3 - 2 * value);

/** Proximity to a dwell beat, used to add a little camera weight. */
export const cameraHoldFor = (build: number) => {
  const nearest = cameraBeatProgresses
    .slice(1, -1)
    .reduce(
      (distance, beat) => Math.min(distance, Math.abs(build - beat)),
      Infinity,
    );

  return 1 - THREE.MathUtils.smoothstep(nearest, 0.008, 0.052);
};

/**
 * A monotonic remap with the same endpoints as scroll. Its zero-velocity tangents
 * create cinematic micro-holds without desynchronising geometry that has to keep
 * assembling against the real charge value.
 */
export const cameraProgressFor = (build: number) => {
  const progress = THREE.MathUtils.clamp(build, 0, 1);

  for (let index = 1; index < cameraBeatProgresses.length; index++) {
    const end = cameraBeatProgresses[index];
    if (progress > end) continue;

    const start = cameraBeatProgresses[index - 1];
    const span = Math.max(end - start, 0.0001);
    const local = THREE.MathUtils.clamp((progress - start) / span, 0, 1);
    return THREE.MathUtils.lerp(start, end, easeDwell(local));
  }

  return progress;
};

/**
 * Focal length as a story beat. Standby is wide and watchful, transmission is
 * longer and more observational, ignition tightens onto the portal.
 *
 * Framed as focal length rather than raw field of view because that is the unit
 * the shot list is written in: ~38 mm opening, ~55 mm mid, ~40 mm axial close.
 */
export const cameraFovFor = (build: number, baseFov: number) => {
  const standby =
    1 - THREE.MathUtils.smoothstep(build, 0.03, PHASE_BOUNDARIES.standbyEnd);
  const transmit =
    THREE.MathUtils.smoothstep(build, PHASE_BOUNDARIES.chargeEnd, 0.66) *
    (1 - THREE.MathUtils.smoothstep(build, PHASE_BOUNDARIES.transmitEnd, 0.9));
  const ignition = THREE.MathUtils.smoothstep(
    build,
    PHASE_BOUNDARIES.transmitEnd,
    0.92,
  );

  // Longer lens through transmission (narrower fov), opening again at ignition.
  return baseFov + standby * 1.4 - transmit * 4.2 + ignition * 2.6;
};

/**
 * Metres ahead of a module along the corridor. Assembly is timed to visibility,
 * not to the moment the dolly draws alongside — otherwise a module only finishes
 * arriving once the visitor has scrolled past it.
 */
const VIEW_START_Z = 5.5;
/** Fully locked while the camera is still this far in front. */
const VIEW_LOCK_Z = 1.6;

const artifactAssembleWindow = (
  z: number,
): { enter: number; span: number; pass: number; lock: number } => {
  const pass = buildAtDepth(z);
  const rawEnter = buildAtDepth(z + VIEW_START_Z);
  const rawLock = buildAtDepth(z + VIEW_LOCK_Z);
  const enter = Math.max(Math.min(rawEnter, rawLock - 0.04), 0);
  const lock = Math.max(rawLock, enter + 0.04);
  return { enter, span: Math.max(lock - enter, 0.04), pass, lock };
};

export interface ArtifactWindow {
  enter: number;
  span: number;
  pass: number;
}

/**
 * Camera-depth timing alone drifts from the document the moment Work's measured
 * height changes, which had modules passing the camera only once the visitor was
 * already reading a later section. This keeps each module's relative pacing —
 * nearer objects still land first — but rescales the gallery into Work's own
 * measured bounds, so the last module always finishes before Work leaves.
 */
export const artifactGroupWindows = (
  work: SectionWindow | undefined,
): ArtifactWindow[] => {
  const raw = ARTIFACTS.map(({ position }) =>
    artifactAssembleWindow(position[2]),
  );
  if (!work) return raw.map(({ enter, span, pass }) => ({ enter, span, pass }));

  const first = raw[0].enter;
  const last = raw.at(-1)!.pass;
  const reference = Math.max(last - first, 0.08);

  const from = work.enter;
  const to = Math.max(work.exit - 0.03, from + 0.16);
  const scale = (to - from) / reference;

  return raw.map(({ enter, span, pass }) => ({
    enter: from + (enter - first) * scale,
    span: span * scale,
    pass: from + (pass - first) * scale,
  }));
};

/** Plate label window: lands after the module starts, holds past the pass. */
const LABEL_ENTER_FRAC = 0.15;
const LABEL_SPAN_FRAC = 0.7;
const LABEL_HOLD_PAST_PASS = 0.12;
const LABEL_EXIT_SPAN = 0.05;

export const artifactLabelWindow = (
  window: ArtifactWindow,
): { enter: number; span: number; exit: number; exitSpan: number } => {
  const { enter, span, pass } = window;
  const exit = Math.min(pass + LABEL_HOLD_PAST_PASS, 1);
  return {
    enter: enter + span * LABEL_ENTER_FRAC,
    span: span * LABEL_SPAN_FRAC,
    exit,
    exitSpan: Math.min(LABEL_EXIT_SPAN, Math.max(1 - exit, 0)),
  };
};

/** True when the viewport is tight enough to want the lighter instance budgets. */
const compactViewport = () =>
  typeof window !== "undefined" &&
  (window.innerWidth < 1200 || window.innerHeight < 720);

/** Voxel grid for the About headshot; background cull drops most cells. */
export const portraitVoxelGrid = (): [number, number] =>
  compactViewport() ? [48, 64] : [64, 86];

/** Em cell size for decorative world type. */
export const typeVoxelCellEm = () => (compactViewport() ? 0.13 : 0.11);
