import * as THREE from 'three'
import type { Quality } from '../capability'
import {
  cameraProgressFor,
  CAMERA_PATH,
  TARGET_PATH,
} from '../layout'
import type { SectionWindow } from '../ui/sectionRanges'
import type { BuiltConsole, ConsoleBuildInput, ConsoleSpec } from './types'
import { consoleDistanceFor, lateralFit } from '../viewportFit'

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
): { position: THREE.Vector3; quaternion: THREE.Quaternion } => {
  const cameraBuild = quality === 'cinema' ? cameraProgressFor(centre) : centre
  const eye = CAMERA_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))
  const target = TARGET_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))

  const forward = target.clone().sub(eye).normalize()
  const right = forward.clone().cross(WORLD_UP).normalize()
  const up = right.clone().cross(forward).normalize()

  // Reading distance ahead of the eye — never park a plate in the near clip.
  const distance = consoleDistanceFor(fit)
  const sideSign = spec.side === 0 ? 0 : spec.side
  // The side lane only opens on a viewport wide enough to read as a corridor —
  // on a phone every card collapses back to dead-centre instead of sitting
  // half off-axis with nowhere for the other lane to go.
  const lateral = (spec.lateral ?? 0.55 * sideSign) * lateralFit(fit) * 0.85
  const rise = (spec.rise ?? 0.05) * fit

  const position = eye
    .clone()
    .addScaledVector(forward, distance)
    .addScaledVector(right, lateral)
    .addScaledVector(up, rise)
  // Soft corridor slot only — a hard z pull used to yank plates into the lens.
  position.z = THREE.MathUtils.lerp(position.z, spec.z, 0.12)

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
 * Force exclusive reading beats: console N is mostly gone before N+1 locks.
 * Prevents the debris-cloud pileup seen in the scroll audit.
 */
const serializeTimings = (built: TimedConsole[]): TimedConsole[] => {
  if (built.length <= 1) return built

  const ordered = [...built].sort((a, b) => a.enter - b.enter || a.spec.z - b.spec.z)
  const n = ordered.length
  // Reserve the first viewport for the cinematic product shot. Every console
  // then gets a proportional, exclusive reading slice.
  // Short cinematic beat — avoid a long empty void after the hero sphere.
  const INTRO_END = 0.07
  const END = 0.98
  const slice = (END - INTRO_END) / n
  // Longer hold, shorter assemble — copy should read locked, not mid-flight.
  const assembleSpan = Math.min(0.035, slice * 0.22)
  const exitSpan = Math.min(0.028, slice * 0.14)
  const gap = Math.min(0.01, slice * 0.08)
  const holdEach = Math.max(0.02, slice - assembleSpan - exitSpan - gap)

  let cursor = INTRO_END

  const sequenced = ordered.map((entry) => {
    const enter = cursor
    const span = assembleSpan
    const exit = enter + span + holdEach
    cursor = exit + exitSpan + gap

    return {
      ...entry,
      enter,
      span,
      exit,
      exitSpan,
    }
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

  const sequenced = serializeTimings(timed)
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
    )
    return { ...entry, position, quaternion }
  })
}
