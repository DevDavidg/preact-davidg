import * as THREE from 'three'
import type { Copy } from '../../i18n/copy'
import { ARTIFACTS, buildAtDepth, CAMERA_PATH, TARGET_PATH } from '../layout'
import type { Tier } from '../sceneState'
import type { TextBlock } from './glyphLayout'
import type { SectionWindow, SectionWindows } from './sectionRanges'

/**
 * Where the page's typography lives inside the room. Anchors are derived from
 * the camera spline at the build value each section owns, so a block is always
 * in frame while the scroll that assembles it is happening — no hand-tuned
 * screen coordinates to drift when copy length changes.
 */

const WORLD_UP = new THREE.Vector3(0, 1, 0)

interface AnchorOffsets {
  /** Units in front of the camera. */
  distance: number
  /** Units to the camera's right; negative is left. */
  lateral?: number
  /** Units above the view ray. */
  rise?: number
}

interface Anchor {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

const anchorAt = (build: number, offsets: AnchorOffsets): Anchor => {
  const eye = CAMERA_PATH.getPointAt(THREE.MathUtils.clamp(build, 0, 1))
  const target = TARGET_PATH.getPointAt(THREE.MathUtils.clamp(build, 0, 1))

  const forward = target.clone().sub(eye).normalize()
  const right = forward.clone().cross(WORLD_UP).normalize()
  const up = right.clone().cross(forward).normalize()

  const position = eye
    .clone()
    .addScaledVector(forward, offsets.distance)
    .addScaledVector(right, offsets.lateral ?? 0)
    .addScaledVector(up, offsets.rise ?? 0)

  const orientation = new THREE.Matrix4().lookAt(eye, position, WORLD_UP)
  return {
    position,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(orientation),
  }
}

/**
 * Carves a build window out of a section: `from`/`to` are fractions of the span
 * between the section entering the viewport and being centred.
 */
const windowIn = (
  section: SectionWindow,
  from = 0,
  to = 1,
): { enter: number; span: number } => {
  const length = Math.max(section.centre - section.enter, 0.03)
  return {
    enter: section.enter + length * from,
    span: Math.max(length * (to - from), 0.02),
  }
}

/** `01 — PROYECTOS ⁄ ARTIFACTS IN SPACE` → `01 / ARTIFACTS IN SPACE`. */
const signage = (label: string): string | null => {
  const [prefix, suffix] = label.split('\u2044')
  if (!suffix) return null
  const number = prefix.trim().split(/\s+/)[0]
  return `${number} / ${suffix.trim()}`
}

interface WorldCopyInput {
  copy: Copy
  windows: SectionWindows
  tier: Tier
  /**
   * Horizontal fit factor, 1 on a wide desktop canvas and lower as the viewport
   * narrows. World copy is placed in metres, so without it a phone in portrait
   * would crop the hero name instead of scaling it.
   */
  fit: number
}

const SECTION_SIGNAGE: {
  id: string
  label: (copy: Copy) => string
  lateral: number
  rise: number
  distance: number
}[] = [
  { id: 'work', label: (c) => c.work.label, lateral: 1.6, rise: 2.1, distance: 12 },
  { id: 'services', label: (c) => c.services.label, lateral: 1.8, rise: 1.9, distance: 12.5 },
  { id: 'process', label: (c) => c.process.label, lateral: 1.7, rise: 2.4, distance: 12.2 },
  { id: 'about', label: (c) => c.about.label, lateral: 1.8, rise: 2.0, distance: 12.4 },
  // Contact hangs higher than the rest: it is the only section whose signage
  // shares the frame with a near title, and 12.6 units back it would otherwise
  // read inside the first line of it.
  { id: 'contact', label: (c) => c.contact.label, lateral: 1.5, rise: 3.4, distance: 12.6 },
]

/** Slicing density per tier: the lower tiers keep letters whole. */
const sliceFor = (tier: Tier, cinema: [number, number]): [number, number] =>
  tier === 'cinema' ? cinema : [1, 1]

const heroBlock = (input: WorldCopyInput): TextBlock => {
  const hero = input.windows.hero
  const leaves = hero ? hero.exit : 0.14
  const anchor = anchorAt(0.01, { distance: 6.9, rise: 1.0 * input.fit })

  return {
    id: 'hero-title',
    text: input.copy.hero.title.replace(' ', '\n'),
    role: 'display',
    em: (input.tier === 'cinema' ? 1.22 : 1.1) * input.fit,
    tracking: -0.03,
    leading: 1.06,
    align: 'centre',
    position: anchor.position,
    quaternion: anchor.quaternion,
    // Negative enter means the name is mostly built on first paint — a few pieces
    // still landing — rather than an empty hero waiting for a scroll.
    enter: -0.055,
    span: 0.05,
    // It comes apart as the hero leaves, so the camera never drives through it.
    exit: Math.max(leaves - 0.045, 0.06),
    exitSpan: 0.04,
    slice: sliceFor(input.tier, [2, 3]),
    // Tight scatter: the letters have to stay recognisable while they tumble.
    chaos: 2.1,
    depth: 4,
    frame: 1,
  }
}

const signageBlocks = (input: WorldCopyInput): TextBlock[] => {
  const blocks: TextBlock[] = []

  for (const entry of SECTION_SIGNAGE) {
    const section = input.windows[entry.id]
    if (!section) continue
    const text = signage(entry.label(input.copy))
    if (!text) continue

    const anchor = anchorAt(section.centre, {
      distance: entry.distance,
      lateral: entry.lateral * input.fit,
      rise: entry.rise,
    })

    blocks.push({
      id: `signage-${entry.id}`,
      text,
      role: 'mono',
      // Far down the corridor and dim on purpose: this is signage hanging in the
      // room, not a second copy of the heading the overlay already carries.
      em: 0.26 * input.fit,
      tracking: 0.14,
      align: 'centre',
      position: anchor.position,
      quaternion: anchor.quaternion,
      ...windowIn(section, 0, 0.7),
      exit: section.exit,
      exitSpan: 0.05,
      slice: [1, 1],
      chaos: 2.4,
      depth: 5,
      weight: 0.5,
      frame: 0.45,
      accent: entry.id === 'contact' ? 0.5 : 0,
    })
  }

  return blocks
}

/**
 * An outline numeral beside every artifact panel, in the panel's own plane, so
 * the object in space is labelled the same way the overlay card is.
 */
const artifactNumerals = (input: WorldCopyInput): TextBlock[] => {
  if (input.tier !== 'cinema') return []

  return ARTIFACTS.map((placement, index) => {
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(placement.pitch, placement.yaw, 0),
    )
    // Above the panel it labels, in the panel's own plane.
    const offset = new THREE.Vector3(0, 1.3, 0).applyQuaternion(quaternion)

    // Timed against the dolly, like the panel it labels: assembled while still
    // ahead of the camera, gone once it is behind.
    const passes = buildAtDepth(placement.position[2])
    return {
      id: `artifact-num-${index}`,
      text: String(index + 1).padStart(2, '0'),
      role: 'display',
      em: 0.78,
      tracking: -0.02,
      align: 'centre',
      position: new THREE.Vector3(...placement.position).add(offset),
      quaternion,
      enter: Math.max(passes - 0.22, 0),
      span: 0.09,
      exit: passes + 0.01,
      exitSpan: 0.05,
      slice: [2, 2],
      chaos: 2.2,
      depth: 4,
      weight: 0.9,
      frame: 1,
    }
  })
}

/**
 * The process numerals are the visual hero of their section, so they get the
 * densest slicing in the scene: a grid of fragments per digit, floating over the
 * colonnade while the steps read on the overlay below.
 */
const processNumerals = (input: WorldCopyInput): TextBlock[] => {
  const section = input.windows.process
  if (!section) return []

  const steps = input.copy.process.steps
  const stride = 1 / steps.length

  return steps.map((step, index) => {
    const at = THREE.MathUtils.lerp(
      section.enter,
      section.exit,
      (index + 0.35) * stride,
    )
    const anchor = anchorAt(at, {
      distance: 8.6,
      lateral: (index % 2 === 0 ? -1.5 : 1.6) * input.fit,
      rise: 1.85,
    })
    const window = Math.max(stride * (section.exit - section.enter), 0.05)

    return {
      id: `process-num-${step.num}`,
      text: step.num,
      role: 'display',
      em: (input.tier === 'cinema' ? 1.85 : 1.5) * input.fit,
      tracking: -0.04,
      align: 'centre',
      position: anchor.position,
      quaternion: anchor.quaternion,
      enter: Math.max(at - window * 0.75, 0),
      span: window * 0.45,
      // Each digit hands off to the next: one phase in the air at a time.
      exit: at + window * 0.45,
      exitSpan: window * 0.4,
      // The densest slicing in the scene — the numeral is this section's hero.
      slice: sliceFor(input.tier, [3, 4]),
      chaos: 3.6,
      depth: 7,
      weight: 0.92,
      accent: 0.16,
      frame: 1,
    }
  })
}

const contactBlock = (input: WorldCopyInput): TextBlock | null => {
  const section = input.windows.contact
  if (!section) return null

  const anchor = anchorAt(0.97, { distance: 7.4, rise: 0.75 })
  return {
    id: 'contact-title',
    text: input.copy.contact.title,
    role: 'display',
    em: (input.tier === 'cinema' ? 0.72 : 0.64) * input.fit,
    tracking: -0.025,
    leading: 1.1,
    wrap: 9 / input.fit,
    align: 'centre',
    position: anchor.position,
    quaternion: anchor.quaternion,
    ...windowIn(section, 0, 0.85),
    slice: sliceFor(input.tier, [2, 2]),
    chaos: 4.6,
    depth: 8,
    // The room powers on here: the copy carries the accent with it.
    accent: 0.55,
    frame: 1,
  }
}

/**
 * Every world-space text block for the current copy, layout and tier.
 *
 * Only the cinema tier hands headings over to the scene. Reduced-motion visitors
 * get none at all, and the lite tier keeps just the environmental signage — its
 * strings appear nowhere in the DOM, so the HTML stays the reading layer on a
 * phone without any copy showing up twice.
 */
export const buildWorldCopy = (input: WorldCopyInput): TextBlock[] => {
  if (input.tier === 'still') return []
  if (input.tier === 'lite') return signageBlocks(input)

  const blocks: TextBlock[] = [heroBlock(input), ...signageBlocks(input)]

  const contact = contactBlock(input)
  if (contact) blocks.push(contact)

  blocks.push(...processNumerals(input), ...artifactNumerals(input))
  return blocks
}

/**
 * Glyphs the atlas has to contain, derived from copy alone. Keeping this
 * independent of layout means a resize re-places the blocks without paying for
 * another rasterization pass.
 */
export const worldCopySources = (
  copy: Copy,
): { role: TextBlock['role']; text: string }[] => {
  const labels = SECTION_SIGNAGE.map((entry) => signage(entry.label(copy)) ?? '')
  return [
    { role: 'display', text: copy.hero.title },
    { role: 'display', text: copy.contact.title },
    // Every numeral the artifact and process blocks can ask for.
    { role: 'display', text: '0123456789' },
    { role: 'mono', text: labels.join(' ') },
  ]
}
