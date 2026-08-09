import * as THREE from 'three'
import type { Quality } from '../capability'
import {
  cameraProgressFor,
  CAMERA_PATH,
  TARGET_PATH,
} from '../layout'
import type { SectionWindow } from '../ui/sectionRanges'
import type { BuiltConsole, ConsoleBuildInput, ConsoleSpec } from './types'

const WORLD_UP = new THREE.Vector3(0, 1, 0)

/**
 * Place a console facing the camera nearly square-on so type stays legible.
 * Side offset is mild — extreme yaw was clipping titles off the plate.
 */
export const placeConsole = (
  spec: ConsoleSpec,
  window: SectionWindow | undefined,
  quality: Quality,
  fit: number,
): BuiltConsole | null => {
  const timing = spec.timing
  if (!timing && !window) return null

  const centre = timing?.centre ?? window!.centre
  const enter = timing?.enter ?? window!.enter
  const span =
    timing?.span ??
    Math.min(Math.max(window!.centre - window!.enter, 0.05) * 0.85, 0.09)
  const exit =
    timing?.exit ?? Math.max(window!.exit - 0.02, window!.centre + span + 0.04)
  const exitSpan = timing?.exitSpan ?? 0.04

  const cameraBuild = quality === 'cinema' ? cameraProgressFor(centre) : centre
  const eye = CAMERA_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))
  const target = TARGET_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))

  const forward = target.clone().sub(eye).normalize()
  const right = forward.clone().cross(WORLD_UP).normalize()
  const up = right.clone().cross(forward).normalize()

  // Clear of the docked reactor (right/back) + mild yaw for legibility.
  const distance = 5.85
  const sideSign = spec.side === 0 ? 0 : spec.side
  const lateral =
    (spec.lateral ?? 1.2 * sideSign) * fit
  const rise = spec.rise ?? 0.1

  const position = eye
    .clone()
    .addScaledVector(forward, distance)
    .addScaledVector(right, lateral)
    .addScaledVector(up, rise)
  position.z = THREE.MathUtils.lerp(position.z, spec.z, 0.35)

  // Aim slightly past the plate so the face reads flatter to the lens.
  const lookAt = position.clone().addScaledVector(forward, -0.2)
  const orientation = new THREE.Matrix4().lookAt(eye, lookAt, WORLD_UP)
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(orientation)

  return {
    spec,
    position,
    quaternion,
    enter,
    span,
    exit,
    exitSpan,
  }
}

/**
 * Force exclusive reading beats: console N is mostly gone before N+1 locks.
 * Prevents the debris-cloud pileup seen in the scroll audit.
 */
export const serializeTimings = (built: BuiltConsole[]): BuiltConsole[] => {
  if (built.length <= 1) return built

  const ordered = [...built].sort((a, b) => a.enter - b.enter || a.spec.z - b.spec.z)
  const n = ordered.length
  // Soft windows — enough time to ease in/out without frantic overlap.
  const ASSEMBLE = 0.055
  const EXIT_SPAN = 0.038
  const GAP = 0.008
  const budget = 0.97
  const fixed = n * (ASSEMBLE + EXIT_SPAN * 0.55 + GAP)
  const holdEach = Math.max(0.032, (budget - fixed) / n)

  let cursor = -0.04

  const sequenced = ordered.map((entry, index) => {
    const enter = index === 0 ? -0.04 : cursor
    const span = ASSEMBLE
    const exit = enter + span + holdEach
    const exitSpan = EXIT_SPAN
    cursor = exit + exitSpan * 0.55 + GAP

    return {
      ...entry,
      enter,
      span,
      exit,
      exitSpan,
    }
  })

  // If we still overshot (many consoles), normalize into [0, 0.98].
  const last = sequenced.at(-1)!
  const end = last.exit + last.exitSpan
  if (end <= 0.98) return sequenced

  const scale = 0.98 / end
  return sequenced.map((entry) => ({
    ...entry,
    enter: entry.enter * scale,
    span: Math.max(entry.span * scale, 0.03),
    exit: entry.exit * scale,
    exitSpan: Math.max(entry.exitSpan * scale, 0.02),
  }))
}

export const assertNoOverlap = (built: BuiltConsole[]) => {
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
  const built: BuiltConsole[] = []
  for (const spec of specs) {
    const placed = placeConsole(
      spec,
      input.windows[spec.section],
      input.quality,
      input.fit,
    )
    if (placed) built.push(placed)
  }
  const serialized = serializeTimings(built)
  assertNoOverlap(serialized)
  return serialized
}
