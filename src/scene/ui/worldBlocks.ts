import * as THREE from 'three'
import type { Copy } from '../../i18n/copy'
import {
  ARTIFACTS,
  artifactGroupWindows,
  artifactLabelWindow,
  cameraProgressFor,
  CAMERA_PATH,
  cinemaTypeVoxelCellEm,
  TARGET_PATH,
} from '../layout'
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

const anchorAt = (
  build: number,
  offsets: AnchorOffsets,
  tier: Tier,
): Anchor => {
  // Cinema's camera dwells around gallery beats. Place any screen-facing copy
  // from that same camera axis while leaving its assemble window on raw build.
  const cameraBuild =
    tier === 'cinema' ? cameraProgressFor(build) : build
  const eye = CAMERA_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))
  const target = TARGET_PATH.getPointAt(
    THREE.MathUtils.clamp(cameraBuild, 0, 1),
  )

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
  if (suffix) {
    const number = prefix.trim().split(/\s+/)[0]
    return `${number} / ${suffix.trim()}`
  }
  // English labels without ⁄ still need corridor signage.
  const match = label.match(/^(\d+)\s*[—-]\s*(.+)$/u)
  if (!match) return null
  return `${match[1]} / ${match[2].trim()}`
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
  // Work hangs high and far: the panels own the mid-band, so the label is
  // environmental signage above them rather than a second headline in the shot.
  { id: 'work', label: (c) => c.work.label, lateral: 0.4, rise: 2.75, distance: 14 },
  { id: 'services', label: (c) => c.services.label, lateral: 1.8, rise: 1.9, distance: 12.5 },
  { id: 'process', label: (c) => c.process.label, lateral: 1.7, rise: 2.4, distance: 12.2 },
  // Far right + high — must not sit on the left voxel portrait.
  { id: 'about', label: (c) => c.about.label, lateral: 2.6, rise: 2.55, distance: 11.8 },
  // Contact hangs above the title line, but not so high it clips under the nav.
  { id: 'contact', label: (c) => c.contact.label, lateral: 1.5, rise: 2.65, distance: 12.6 },
]

/** Slicing density per tier: the lower tiers keep letters whole. */
const sliceFor = (tier: Tier, cinema: [number, number]): [number, number] =>
  tier === 'cinema' ? cinema : [1, 1]

const heroBlock = (input: WorldCopyInput): TextBlock => {
  const hero = input.windows.hero
  const leaves = hero ? hero.exit : 0.14
  const anchor = anchorAt(
    0.01,
    { distance: 6.9, rise: 1.0 * input.fit },
    input.tier,
  )

  return {
    id: 'hero-title',
    text: input.copy.hero.title.replace(' ', '\n'),
    role: 'display',
    em: (input.tier === 'cinema' ? 1.22 : 1.1) * input.fit,
    tracking: -0.02,
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
    // Two layers + firmer ink cut — keeps the name a silhouette, not gravel.
    form: 'voxel',
    voxel: {
      cellEm: cinemaTypeVoxelCellEm('hero'),
      layers: 2,
      threshold: 0.55,
    },
    chaos: 1.8,
    depth: 3.5,
    weight: 1,
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
    }, input.tier)

    blocks.push({
      id: `signage-${entry.id}`,
      text,
      role: 'mono',
      // Far down the corridor and dim on purpose: this is signage hanging in the
      // room, not a second copy of the heading the overlay already carries.
      em: (entry.id === 'work' ? 0.2 : 0.26) * input.fit,
      tracking: 0.14,
      align: 'centre',
      position: anchor.position,
      quaternion: anchor.quaternion,
      ...windowIn(section, 0, entry.id === 'work' ? 0.45 : 0.7),
      // Work / About exit early so panels / portrait own the frame once settled.
      exit:
        entry.id === 'work' || entry.id === 'about'
          ? section.centre
          : section.exit,
      exitSpan: 0.05,
      slice: [1, 1],
      chaos: 2.4,
      depth: 5,
      // Corridor labels must stay readable against fog — dim, not translucent.
      weight: entry.id === 'work' ? 0.55 : 0.82,
      accent: entry.id === 'contact' ? 0.35 : 0,
    })
  }

  return blocks
}

/**
 * An outline numeral beside every artifact panel, in the panel's own plane —
 * Work has no DOM dossier, so this is the project's index in the room.
 */
const artifactNumerals = (input: WorldCopyInput): TextBlock[] => {
  if (input.tier !== 'cinema') return []

  const blocks: TextBlock[] = []
  const groupWindows = artifactGroupWindows(input.windows.work)

  ARTIFACTS.forEach((placement, index) => {
    const item = input.copy.work.items[index]
    if (!item) return

    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(placement.pitch, placement.yaw, 0),
    )
    // Beside the panel, on its outer edge — above it sat inside the lattice band
    // and competed with the shot for the same pixels.
    const side = placement.position[0] < 0 ? -1 : 1
    const numOffset = new THREE.Vector3(
      side * 1.72,
      0.85,
      0.08,
    ).applyQuaternion(quaternion)
    const titleOffset = new THREE.Vector3(
      side * 1.72,
      0.15,
      0.08,
    ).applyQuaternion(quaternion)

    // Same view window as the panel shards: labels land while the project is
    // looked at, hold through the pass, then drift out behind the camera.
    // Bound by Work exit — Services.enter can land mid-spacer and would retire
    // titles before late panels finish assembling (cinema has no DOM dossier).
    const { enter, span } = groupWindows[index]
    const label = artifactLabelWindow(groupWindows[index])
    const workExit = input.windows.work?.exit ?? null
    const exitSpan = label.exitSpan
    const fadeEnd =
      workExit != null
        ? Math.min(label.exit + exitSpan, workExit)
        : label.exit + exitSpan
    const retireAt = fadeEnd - exitSpan
    // Numerals use the full panel window; titles use the shorter label window.
    const numExit = Math.max(enter + span, retireAt)
    const titleExit = Math.max(label.enter + label.span, retireAt)

    blocks.push({
      id: `artifact-num-${index}`,
      text: String(index + 1).padStart(2, '0'),
      role: 'display',
      em: 0.88,
      tracking: -0.03,
      align: 'centre',
      position: new THREE.Vector3(...placement.position).add(numOffset),
      quaternion,
      enter,
      span,
      exit: numExit,
      exitSpan: 0.06,
      form: 'voxel',
      // Relief bricks (not stacked cubes): ink cores extrude like bay members.
      voxel: {
        cellEm: cinemaTypeVoxelCellEm('numeral'),
        layers: 5,
        threshold: 0.38,
        profile: 'relief',
        extrude: 2.8,
      },
      chaos: 3.2,
      depth: 6,
      weight: 1,
      accent: 0.25,
    })

    // Flat atlas plate — small voxel titles read as mush at this em size.
    blocks.push({
      id: `artifact-title-${index}`,
      text: item.title.toUpperCase(),
      role: 'mono',
      em: 0.24,
      tracking: 0.1,
      align: 'centre',
      position: new THREE.Vector3(...placement.position).add(titleOffset),
      quaternion,
      enter: label.enter,
      span: label.span,
      exit: titleExit,
      exitSpan,
      slice: [1, 1],
      chaos: 2.2,
      depth: 4,
      weight: 1,
      accent: 0.2,
    })
  })

  return blocks
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
    }, input.tier)
    const window = Math.max(stride * (section.exit - section.enter), 0.05)

    const aboutEnter = input.windows.about?.enter
    const exit = at + window * 0.45
    // Last digit must clear before About's reading plate — it was ghosting the bio.
    const cappedExit =
      aboutEnter != null ? Math.min(exit, aboutEnter) : exit

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
      exit: cappedExit,
      exitSpan: Math.min(window * 0.4, Math.max(0.04, cappedExit - at)),
      slice: sliceFor(input.tier, [1, 1]),
      chaos: 3.6,
      depth: 7,
      weight: 0.92,
      accent: 0.16,
    }
  })
}

const contactBlock = (input: WorldCopyInput): TextBlock | null => {
  const section = input.windows.contact
  if (!section) return null

  // The title is almost complete as Contact starts entering, so compose it from
  // that measured point rather than a fixed end-of-path camera position.
  const approach = Math.max(section.centre - section.enter, 0.06)
  const span = Math.max(approach * 0.72, 0.05)
  const enter = Math.max(section.enter - span * 0.9, 0)
  const anchor = anchorAt(
    section.enter,
    { distance: 7.4, rise: 0.75 },
    input.tier,
  )
  // Cinema has already voided the DOM heading by the time Contact enters. Start
  // its room-copy on the final approach so the first readable frame of Contact
  // always has a title, while keeping it out of About's visible centre.

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
    enter,
    span,
    // Whole letters — sliced quads at this scale read as noise, not as type.
    slice: [1, 1],
    chaos: 1.8,
    depth: 4,
    // Accent hint only — full accent + LIVE bloom washed the strokes out.
    accent: 0.28,
    weight: 1,
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

  // Voxel hero + project labels first so a tight instance budget never drops them
  // in favour of flat signage / process numerals further down the corridor.
  // About quote/bio stay DOM — world-copy body at that density was unreadable.
  const blocks: TextBlock[] = [heroBlock(input), ...artifactNumerals(input)]

  blocks.push(...signageBlocks(input), ...processNumerals(input))

  const contact = contactBlock(input)
  if (contact) blocks.push(contact)

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
  const titles = copy.work.items.map((item) => item.title.toUpperCase()).join(' ')
  return [
    { role: 'display', text: copy.hero.title },
    { role: 'display', text: copy.contact.title },
    // Every numeral the artifact and process blocks can ask for.
    { role: 'display', text: '0123456789' },
    {
      role: 'mono',
      text: `${labels.join(' ')} ${titles}`,
    },
  ]
}
