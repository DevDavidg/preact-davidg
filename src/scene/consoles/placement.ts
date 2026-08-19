import * as THREE from 'three'
import type { Quality } from '../capability'
import {
  cameraPacing,
  cameraProgressFor,
  corridorLateral,
  CAMERA_PATH,
  CORRIDOR_START,
  TARGET_PATH,
} from '../layout'
import type { SectionWindow, SectionWindows } from '../ui/sectionRanges'
import type { BuiltConsole, ConsoleBuildInput, ConsoleSpec } from './types'
import {
  consoleDistanceFor,
  consoleRiseFor,
  lateralFit,
  portraitAmount,
} from '../viewportFit'

const WORLD_UP = new THREE.Vector3(0, 1, 0)

/** A console's reading beat, before it has been placed in space. */
interface TimedConsole {
  spec: ConsoleSpec
  enter: number
  span: number
  exit: number
  exitSpan: number
}

/**
 * A console's reading beat only — no position yet.
 *
 * Splitting this out from placement is what keeps "when is this card visible"
 * and "where does it face the camera" from drifting apart. They used to be
 * computed from the same `centre` in one pass, but `serializeTimings` below
 * then rewrote enter/exit into an evenly-sliced, exclusive sequence *without*
 * touching position — so a card ended up facing the camera at the build value
 * from its original section window while actually being shown at a different,
 * resequenced one. On a corridor whose camera path weaves left and right,
 * that gap between "aimed here" and "shown there" read as a card parked
 * off-centre. `buildPlacedConsoles` now sequences every card's timing first
 * and only then asks this file where to put it.
 */
const timeConsole = (
  spec: ConsoleSpec,
  window: SectionWindow | undefined,
): TimedConsole | null => {
  const timing = spec.timing
  if (!timing && !window) return null

  const enter = timing?.enter ?? window!.enter
  const span =
    timing?.span ??
    Math.min(Math.max(window!.centre - window!.enter, 0.05) * 0.85, 0.09)
  const exit =
    timing?.exit ?? Math.max(window!.exit - 0.02, window!.centre + span + 0.04)
  const exitSpan = timing?.exitSpan ?? 0.04

  return { spec, enter, span, exit, exitSpan }
}

/**
 * Place a console facing the camera nearly square-on so type stays legible.
 * Side offset is mild — extreme yaw was clipping titles off the plate.
 *
 * `centre` is the build value the card is actually held at once sequenced —
 * see `timeConsole` above for why this can no longer be derived internally.
 */
const frameConsole = (
  spec: ConsoleSpec,
  centre: number,
  quality: Quality,
  fit: number,
  aspect: number,
): { position: THREE.Vector3; quaternion: THREE.Quaternion } => {
  // Same remap the camera itself uses, or the plate is framed for a pose the
  // camera never takes.
  const cameraBuild =
    quality === 'cinema' ? cameraProgressFor(centre) : cameraPacing(centre)
  const eye = CAMERA_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))
  const target = TARGET_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))
  // Same flattening the camera itself applies — see `corridorLateral`.
  const lane = corridorLateral(aspect)
  eye.x *= lane
  target.x *= lane

  const forward = target.clone().sub(eye).normalize()
  const right = forward.clone().cross(WORLD_UP).normalize()
  const up = right.clone().cross(forward).normalize()

  // Reading distance ahead of the eye — never park a plate in the near clip.
  const distance = consoleDistanceFor(fit)
  const sideSign = spec.side === 0 ? 0 : spec.side
  // The side lane only opens on a viewport wide enough to read as a corridor —
  // on a phone every card collapses back to dead-centre instead of sitting
  // half off-axis with nowhere for the other lane to go.
  const lateral = (spec.lateral ?? 0.55 * sideSign) * lateralFit(fit, aspect) * 0.85
  const rise = consoleRiseFor(fit, aspect, spec.rise ?? 0.05)

  const position = eye
    .clone()
    .addScaledVector(forward, distance)
    .addScaledVector(right, lateral)
    .addScaledVector(up, rise)
  /*
   * Soft corridor slot only — a hard z pull used to yank plates into the lens.
   *
   * The pull also moves the plate off the camera's own axis, because it changes
   * depth without changing the lateral offset that depth was computed for. On a
   * narrow frame there is no margin for that, so portrait keeps far more of the
   * on-axis placement and gives up some of the corridor's sense of slotting.
   */
  const slotPull = 0.12 * (1 - portraitAmount(aspect) * 0.75)
  position.z = THREE.MathUtils.lerp(position.z, spec.z, slotPull)

  // Enforce a floor distance after the slot blend.
  const fromEye = position.clone().sub(eye)
  const minDist = distance * 0.92
  if (fromEye.lengthSq() < minDist * minDist) {
    position.copy(eye).addScaledVector(fromEye.normalize(), minDist)
  }

  // Aim slightly past the plate so the face reads flatter to the lens.
  const lookAt = position.clone().addScaledVector(forward, -0.2)
  const orientation = new THREE.Matrix4().lookAt(eye, lookAt, WORLD_UP)
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(orientation)

  return { position, quaternion }
}

/**
 * Reading beats, cut from the rail the visitor is actually scrolling.
 *
 * The previous version threw the measured section windows away and sliced the
 * whole corridor into N equal parts. That guaranteed exclusivity — its stated
 * purpose — but it meant the scroll rail had no influence at all on when anything
 * happened. Two consequences, both visible:
 *
 * - The chapter heights in `HOME_CHAPTER_VH` were decoration. Work was authored at
 *   340vh and Process at 210vh, and both got exactly the same beat.
 * - Anchors lied. `#services` scrolls to the Services chapter of the rail, but the
 *   Services console was shown at whatever slice its index happened to land on, so
 *   following the link put the visitor at the wrong moment in the story.
 *
 * Beats now come from each console's own section window, split evenly when a
 * section carries more than one console (Work carries the featured modules), and
 * clamped so consecutive sections cannot overlap — section windows deliberately
 * start a viewport early, which is right for "am I entering this" and wrong as a
 * slot boundary. The even slicing survives as the fallback for the frames before
 * the DOM has been measured.
 */
const SEQUENCE_END = 0.985

interface Slot {
  from: number
  to: number
}

/** Turns one slot into the assemble / hold / exit shape a console reads. */
const beatIn = (entry: TimedConsole, slot: Slot): TimedConsole => {
  const span = Math.max(slot.to - slot.from, 0.02)
  // Longer hold, shorter assemble — copy should read locked, not mid-flight.
  const assembleSpan = Math.min(0.03, span * 0.2)
  const exitSpan = Math.min(0.026, span * 0.14)
  const gap = Math.min(0.008, span * 0.06)
  const hold = Math.max(0.015, span - assembleSpan - exitSpan - gap)

  return {
    ...entry,
    enter: slot.from,
    span: assembleSpan,
    exit: slot.from + assembleSpan + hold,
    exitSpan,
  }
}

/** The fallback: exclusive, evenly spaced, no rail required. */
const sequenceEvenly = (ordered: TimedConsole[]): TimedConsole[] => {
  const span = (SEQUENCE_END - CORRIDOR_START) / ordered.length
  return ordered.map((entry, index) =>
    beatIn(entry, {
      from: CORRIDOR_START + index * span,
      to: CORRIDOR_START + (index + 1) * span,
    }),
  )
}

const sequenceTimings = (
  built: TimedConsole[],
  windows: SectionWindows,
): TimedConsole[] => {
  if (built.length <= 1) return built

  // Corridor order, which is the order the specs are authored in.
  const ordered = [...built].sort(
    (a, b) => b.spec.z - a.spec.z || a.enter - b.enter,
  )

  /*
   * Section order comes from the consoles themselves rather than from
   * `SECTION_IDS`: a route's specs are the authority on which chapters exist and
   * in what order (the CV and case corridors have their own).
   */
  const sections: string[] = []
  for (const entry of ordered) {
    if (!sections.includes(entry.spec.section)) sections.push(entry.spec.section)
  }

  const starts = sections.map((section) => windows[section]?.enter)
  if (starts.some((value) => value === undefined)) return sequenceEvenly(ordered)

  const sequenced: TimedConsole[] = []
  let cursor = CORRIDOR_START

  sections.forEach((section, index) => {
    const group = ordered.filter((entry) => entry.spec.section === section)
    // The next section's own start is this section's hard boundary, so a window
    // that begins a viewport early cannot eat into its neighbour's beat.
    const nextStart = starts[index + 1] ?? SEQUENCE_END
    const from = Math.max(cursor, starts[index] as number)
    const to = Math.max(nextStart, from + 0.02 * group.length)
    const step = (to - from) / group.length

    group.forEach((entry, position) => {
      sequenced.push(
        beatIn(entry, {
          from: from + position * step,
          to: from + (position + 1) * step,
        }),
      )
    })
    cursor = to
  })

  return sequenced
}

const assertNoOverlap = (built: TimedConsole[]) => {
  if (!import.meta.env.DEV) return
  const ordered = [...built].sort((a, b) => a.enter - b.enter)
  for (let i = 0; i < ordered.length - 1; i++) {
    const current = ordered[i]
    const next = ordered[i + 1]
    const currentGone = current.exit + current.exitSpan * 0.55
    const nextForty = next.enter + next.span * 0.4
    if (nextForty < currentGone - 0.01) {
      console.warn(
        `[consoles] overlap ${current.spec.id} → ${next.spec.id}: next@40% (${nextForty.toFixed(3)}) before current gone (${currentGone.toFixed(3)})`,
      )
    }
  }
}

export const buildPlacedConsoles = (
  specs: ConsoleSpec[],
  input: ConsoleBuildInput,
): BuiltConsole[] => {
  const timed: TimedConsole[] = []
  for (const spec of specs) {
    const beat = timeConsole(spec, input.windows[spec.section])
    if (beat) timed.push(beat)
  }

  const sequenced = sequenceTimings(timed, input.windows)
  assertNoOverlap(sequenced)

  return sequenced.map((entry) => {
    // Centre of the *held* portion, not the whole enter→exit span — the same
    // point serializeTimings itself treats as "locked and readable," so the
    // card faces the camera exactly where it will actually be read from.
    const centre = (entry.enter + entry.span + entry.exit) / 2
    const { position, quaternion } = frameConsole(
      entry.spec,
      centre,
      input.quality,
      input.fit,
      input.aspect,
    )
    return { ...entry, position, quaternion }
  })
}
