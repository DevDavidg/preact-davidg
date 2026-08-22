import * as THREE from "three";
import { COPY } from "../content";
import { PHASE_BOUNDARIES } from "./sceneState";
import { portraitAmount } from "./viewportFit";
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
 * The dolly: swing onto the optic's axis, fly *through* it, then take the corridor.
 *
 * This used to graze the shell from port — the old control point at
 * (-1.55, 1.75, 5.35) carried the comment "never park the lens inside opaque
 * debris" — and the shell was faded out by build 0.18, just before the camera
 * would have arrived. So the first circle opened and disappeared beside the
 * viewer rather than around them, which wasted the one object the room is built
 * to introduce.
 *
 * The lens now passes dead through the shell's centre. That is only survivable
 * because of what `HeroStage` does with the timing below: the aperture is fully
 * open before transit, so the camera goes through a hole rather than through
 * panels, and the facets are already sweeping *toward* the lens along this same
 * axis — flying through them reads as passing between opening iris blades.
 *
 * The approach is deliberately head-on rather than oblique. An angled entry into
 * a sphere clips the limb on the way in; square-on, the aperture is a circle and
 * the transit is a tunnel.
 */
export const CAMERA_PATH = new THREE.CatmullRomCurve3(
  [
    /*
     * Establishing.
     *
     * Only slightly off the axis now — enough for a three-quarter read on the
     * optic and some parallax on the way in, not enough to throw it off frame.
     * Centring the sphere is `TARGET_PATH`'s job, not this one: the shot is
     * centred by where the lens *looks*, which leaves the position free to be
     * interesting. The previous opening sat 4 m to port, and combined with a
     * look-at aimed 1.5 m in front of the shell it put the object the whole room
     * exists to introduce down in a corner.
     */
    new THREE.Vector3(-1.62, 1.94, 10.6),
    new THREE.Vector3(-1.12, 1.83, 8.55),
    new THREE.Vector3(-0.46, 1.7, 6.5),
    // Through the middle of the shell. Same point as REACTOR_CORE below.
    new THREE.Vector3(0, 1.62, 5.15),
    // Just past it, still inside the housing's wake.
    new THREE.Vector3(0.1, 1.6, 4.15),
    // Clear of the optic; the corridor takes over from here.
    new THREE.Vector3(0.35, 1.66, 3.1),
    new THREE.Vector3(-1.2, 1.95, 1.4),
    new THREE.Vector3(1.5, 2.35, -2.2),
    new THREE.Vector3(-0.9, 1.55, -6.0),
    new THREE.Vector3(0, 1.7, -10.4),
  ],
  false,
  "catmullrom",
  0.35,
);

/**
 * How much of the dolly's side-to-side weave survives at this viewport.
 *
 * The path deliberately swings between x ≈ -1.6 and x ≈ +1.5, which is what makes
 * the corridor read as a space being travelled rather than a tunnel being flown
 * down. On a portrait phone it is a liability: a console is placed at a fixed
 * world point framed for the camera pose at the middle of its own hold, so while
 * the camera is still arriving it is looking at that plate from up to a metre and
 * a half off to the side — around 45% of the frame's width at reading distance.
 * The plate's leading edge simply left the screen.
 *
 * Flattening the weave on a narrow frame trades the corridor's lateral drama for
 * copy that stays inside the viewport, which on a phone is not a close call. Both
 * `Rig` (where the camera goes) and `placement` (where a plate is put) multiply by
 * this, so the two can never disagree about where the lane is.
 */
export const corridorLateral = (aspect: number) =>
  1 - portraitAmount(aspect) * 0.92;

/**
 * Where the camera looks, one beat ahead of where it is.
 *
 * Locked onto the optic's axis for the whole approach: the aperture has to be
 * the centre of frame while the visitor is flying at it, or the transit reads as
 * drifting past something rather than entering it. The lateral weave only starts
 * once the shell is behind the lens.
 */
export const TARGET_PATH = new THREE.CatmullRomCurve3(
  [
    /*
     * Locked on the optic's centre for the whole approach.
     *
     * These three points *are* the sphere's position. Aiming at it is what puts
     * it in the middle of the frame, and it stays there for the entire approach
     * however the dolly moves — which is the only reliable way to centre an
     * object in a moving shot. Aiming at a point in front of it, as this used to,
     * frames the empty space the visitor is about to fly through instead.
     */
    new THREE.Vector3(0, 1.62, 5.15),
    new THREE.Vector3(0, 1.62, 5.15),
    new THREE.Vector3(0, 1.62, 4.9),
    new THREE.Vector3(0.05, 1.6, 3.5),
    new THREE.Vector3(0.1, 1.54, 2.3),
    new THREE.Vector3(0.14, 1.44, 0.6),
    new THREE.Vector3(0, 1.34, -1.6),
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
 * Corridor bays for the featured modules, alternating sides of the lane.
 *
 * There used to be six, each the same size, which made the gallery a slalom with
 * no hierarchy and loaded six full-resolution textures for a scene the visitor
 * scrolls through in seconds. A handful of well-spaced bays give each module a
 * real beat and cut texture memory by half.
 *
 * This is the slot *table*, not the gallery. `ARTIFACTS` below is the table cut
 * to however many featured cases actually exist, because everything downstream
 * treats a slot as a module that is there: `cameraBeatProgresses` puts a dwell
 * beat at each one, and `artifactGroupWindows` rescales the gallery across their
 * span. A hard-coded three outlived the third featured case, so the camera kept
 * easing down at a bay with nothing in it and the gallery's pacing was stretched
 * across a module that had been deleted. Slots past the last case stay inert
 * until a case arrives to fill them.
 */
const ARTIFACT_SLOTS: ArtifactPlacement[] = [
  { position: [-2.15, 1.55, 4.6], yaw: 0.6, pitch: -0.12, scale: 1.18 },
  { position: [2.2, 1.6, 0.4], yaw: -0.62, pitch: -0.13, scale: 1.14 },
  { position: [-2.1, 1.52, -3.8], yaw: 0.64, pitch: -0.12, scale: 1.2 },
  // Starboard bay, clear of the About portrait's lane on the port side.
  { position: [2.15, 1.58, -7.6], yaw: -0.6, pitch: -0.12, scale: 1.16 },
];

/**
 * Featured cases are the same length in both locales — `tests/unit/content.test.ts`
 * holds that — so either one answers how many bays the corridor needs.
 */
export const ARTIFACTS: ArtifactPlacement[] = ARTIFACT_SLOTS.slice(
  0,
  Math.min(COPY.es.featured.length, ARTIFACT_SLOTS.length),
);

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
 * Where along the *path* the lens reaches the centre of the hero optic.
 *
 * Derived from the control points rather than authored, so moving one cannot
 * silently put the camera inside a closed object.
 */
const HERO_TRANSIT_PATH = buildAtDepth(REACTOR_CORE[2]);

/**
 * How much *scroll* the approach is allowed to cost.
 *
 * These are two different quantities and conflating them was a real pacing bug.
 * The camera path is parameterised by arc length, and the swing onto the optic's
 * axis is about a third of the room's total length — so mapping scroll straight
 * onto the path spent a third of the entire page on one shot, roughly six
 * viewport-heights of wheel before the first console could exist. Meanwhile the
 * rail gave the hero chapter 170vh out of ~1780, so the document and the camera
 * disagreed about the same beat by a factor of three.
 *
 * The approach is a shot: it should cost about a screen and a half of scroll and
 * no more. `cameraPacing` below is the remap that buys that, and because it is
 * piecewise linear it is exactly invertible — which matters, because everything
 * that reasons about "where is the camera at this charge" has to be able to ask
 * the question in reverse.
 */
export const HERO_BUILD = 0.11;

/**
 * Scroll → position along the camera path.
 *
 * Monotonic and invertible. Deliberately no easing: the cinematic micro-holds are
 * `cameraProgressFor`'s job, layered on top, and putting a second curve here
 * would make the inverse below approximate rather than exact.
 */
export const cameraPacing = (build: number): number => {
  const progress = THREE.MathUtils.clamp(build, 0, 1);
  if (progress <= HERO_BUILD) {
    return (progress / HERO_BUILD) * HERO_TRANSIT_PATH;
  }
  return (
    HERO_TRANSIT_PATH +
    ((progress - HERO_BUILD) / (1 - HERO_BUILD)) * (1 - HERO_TRANSIT_PATH)
  );
};

/** The inverse: a point on the path → the charge that puts the camera there. */
export const buildForPath = (pathT: number): number => {
  const t = THREE.MathUtils.clamp(pathT, 0, 1);
  if (t <= HERO_TRANSIT_PATH) {
    return (t / HERO_TRANSIT_PATH) * HERO_BUILD;
  }
  return (
    HERO_BUILD +
    ((t - HERO_TRANSIT_PATH) / (1 - HERO_TRANSIT_PATH)) * (1 - HERO_BUILD)
  );
};

/**
 * Where the corridor's own sequence begins.
 *
 * The opening is a shot, not a slot: consoles must not start assembling while the
 * visitor is still flying through the shell. `placement` slices its exclusive
 * reading beats from here to the end, and this sits far enough past the transit
 * for the optic to be behind the lens and faded.
 */
export const CORRIDOR_START = HERO_BUILD + 0.02;

/**
 * Scroll stays continuous, but camera speed eases down at each module and at the
 * portrait. These are soft dwell points, not stops: everything else keeps
 * following real scroll progress while the eye gets a moment to read.
 */
const cameraBeatProgresses = (() => {
  /*
   * In scroll space, via `buildForPath`. `buildAtDepth` answers in path units, and
   * `cameraHoldFor` is handed a charge value — before the pacing remap existed the
   * two happened to be the same number, and afterwards they are not. Comparing
   * them directly would have put every dwell beat at the wrong moment.
   */
  const beats = [
    0,
    ...ARTIFACTS.map(({ position }) => buildForPath(buildAtDepth(position[2]))),
    buildForPath(buildAtDepth(ABOUT_PORTRAIT.position[2])),
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
    // Eased in scroll space, then handed to the pacing remap — the two compose,
    // and the result is still monotonic, so scrubbing stays exact.
    return cameraPacing(THREE.MathUtils.lerp(start, end, easeDwell(local)));
  }

  return cameraPacing(progress);
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
