import * as THREE from 'three'
import type { CaseStudy } from '../../content'
import type { Quality } from '../capability'
import {
  ARTIFACTS,
  artifactGroupWindows,
  artifactLabelWindow,
  cameraProgressFor,
  CAMERA_PATH,
  TARGET_PATH,
  typeVoxelCellEm,
} from '../layout'
import type { TextBlock } from './glyphLayout'
import type { SectionWindows } from './sectionRanges'

/**
 * Typography that lives inside the room.
 *
 * Everything here is *decorative and machine-generated*: a monogram, sector
 * markers and the module plates. None of these strings appears in the document.
 *
 * That constraint is the important part. An earlier version rendered the page's
 * real headings in 3D and made the DOM copies transparent so they would not double
 * up — which broke text selection, high-contrast mode, user stylesheets and any
 * browser where the atlas silently failed. The document now always owns the words;
 * the room only ever adds telemetry around them.
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

/**
 * Places a block relative to where the camera will be at a given charge value, so
 * it is always in frame while the scroll that assembles it is happening.
 */
const anchorAt = (
  build: number,
  offsets: AnchorOffsets,
  quality: Quality,
): Anchor => {
  const cameraBuild = quality === 'cinema' ? cameraProgressFor(build) : build
  const eye = CAMERA_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))
  const target = TARGET_PATH.getPointAt(THREE.MathUtils.clamp(cameraBuild, 0, 1))

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

interface WorldTypeInput {
  featured: CaseStudy[]
  windows: SectionWindows
  quality: Quality
  /**
   * Horizontal fit factor: 1 on a wide canvas, lower as the viewport narrows.
   * World type is placed in metres, so without it a portrait phone would crop the
   * monogram instead of scaling it.
   */
  fit: number
}

/**
 * The monogram. A brand mark rather than a heading — the document's H1 is the value
 * proposition, and this is the object the room is built around.
 *
 * Placed in the empty band below the copy and right of the scroll cue. Centred, the
 * voxel blocks read as noise across the largest type on the page; moved to the upper
 * right they landed behind the availability list. This is the one region of the
 * opening frame the document leaves clear.
 */
const monogramBlock = (input: WorldTypeInput): TextBlock => {
  const hero = input.windows.hero
  const leaves = hero ? hero.exit : 0.14
  const anchor = anchorAt(
    0.01,
    {
      distance: 8.4,
      lateral: 1.95 * input.fit,
      rise: -1.35 * input.fit,
    },
    input.quality,
  )

  return {
    id: 'monogram',
    text: 'DG',
    role: 'display',
    em: (input.quality === 'cinema' ? 1.2 : 1.05) * input.fit,
    tracking: -0.04,
    leading: 1.02,
    align: 'centre',
    position: anchor.position,
    quaternion: anchor.quaternion,
    // Negative enter: mostly assembled on first paint, a few pieces still landing,
    // rather than an empty hero waiting for a scroll that may never come.
    enter: -0.055,
    span: 0.05,
    // Comes apart as the hero leaves, so the camera never drives through it.
    exit: Math.max(leaves - 0.045, 0.06),
    exitSpan: 0.04,
    form: 'voxel',
    voxel: { cellEm: typeVoxelCellEm(), layers: 2, threshold: 0.55 },
    chaos: 1.8,
    depth: 3.5,
    // A mark, not a headline: present in the room without competing for attention.
    weight: 0.85,
  }
}

/**
 * Corridor sector markers. Deliberately technical strings that exist nowhere in
 * the document, hung far down the room and dim, so they read as environmental
 * signage rather than as a second copy of the section heading.
 */
const SECTORS: { id: string; marker: string; lateral: number; rise: number; distance: number }[] =
  [
    { id: 'work', marker: 'SECTOR 01 / TRANSMISSION', lateral: 0.4, rise: 2.75, distance: 14 },
    { id: 'experience', marker: 'SECTOR 02 / TELEMETRY', lateral: 1.9, rise: 2.1, distance: 12.8 },
    { id: 'services', marker: 'SECTOR 03 / SUBSYSTEMS', lateral: 1.8, rise: 1.9, distance: 12.5 },
    { id: 'process', marker: 'SECTOR 04 / CALIBRATION', lateral: 1.7, rise: 2.4, distance: 12.2 },
    { id: 'about', marker: 'SECTOR 05 / OPERATOR', lateral: 2.6, rise: 2.55, distance: 11.8 },
    { id: 'contact', marker: 'SECTOR 06 / IGNITION', lateral: 1.5, rise: 2.65, distance: 12.6 },
  ]

const sectorBlocks = (input: WorldTypeInput): TextBlock[] => {
  const blocks: TextBlock[] = []

  for (const sector of SECTORS) {
    const section = input.windows[sector.id]
    if (!section) continue

    const anchor = anchorAt(
      section.centre,
      {
        distance: sector.distance,
        lateral: sector.lateral * input.fit,
        rise: sector.rise,
      },
      input.quality,
    )

    const length = Math.max(section.centre - section.enter, 0.03)

    blocks.push({
      id: `sector-${sector.id}`,
      text: sector.marker,
      role: 'mono',
      em: 0.2 * input.fit,
      tracking: 0.14,
      align: 'centre',
      position: anchor.position,
      quaternion: anchor.quaternion,
      enter: section.enter,
      span: Math.max(length * 0.6, 0.02),
      // Work and About clear early so the modules and the portrait own the frame.
      exit:
        sector.id === 'work' || sector.id === 'about'
          ? section.centre
          : section.exit,
      exitSpan: 0.05,
      slice: [1, 1],
      chaos: 2.4,
      depth: 5,
      // Dim rather than translucent, so it stays readable against the fog.
      weight: 0.6,
      accent: sector.id === 'contact' ? 0.35 : 0,
    })
  }

  return blocks
}

/**
 * A plate beside each featured module: an outline numeral and the module's own
 * identifier. `plate` is authored purely for the room and is rendered nowhere in
 * the document, so this cannot duplicate a card.
 */
const modulePlates = (input: WorldTypeInput): TextBlock[] => {
  if (input.quality !== 'cinema') return []

  const blocks: TextBlock[] = []
  const groupWindows = artifactGroupWindows(input.windows.work)

  ARTIFACTS.forEach((placement, index) => {
    const study = input.featured[index]
    if (!study) return

    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(placement.pitch, placement.yaw, 0),
    )
    // Beside the panel on its outer edge: above it, the numeral sat inside the
    // lattice band and competed with the shot for the same pixels.
    const side = placement.position[0] < 0 ? -1 : 1
    const numeralOffset = new THREE.Vector3(side * 1.72, 0.85, 0.08).applyQuaternion(
      quaternion,
    )
    const plateOffset = new THREE.Vector3(side * 1.72, 0.15, 0.08).applyQuaternion(
      quaternion,
    )

    const { enter, span } = groupWindows[index]
    const label = artifactLabelWindow(groupWindows[index])
    const workExit = input.windows.work?.exit ?? null
    const fadeEnd =
      workExit != null
        ? Math.min(label.exit + label.exitSpan, workExit)
        : label.exit + label.exitSpan
    const retireAt = fadeEnd - label.exitSpan

    blocks.push({
      id: `module-num-${index}`,
      text: String(index + 1).padStart(2, '0'),
      role: 'display',
      em: 0.88,
      tracking: -0.03,
      align: 'centre',
      position: new THREE.Vector3(...placement.position).add(numeralOffset),
      quaternion,
      enter,
      span,
      exit: Math.max(enter + span, retireAt),
      exitSpan: 0.06,
      form: 'voxel',
      // Relief bricks rather than stacked cubes: ink cores extrude like structural
      // members, so the numeral belongs to the architecture.
      voxel: {
        cellEm: typeVoxelCellEm(),
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

    blocks.push({
      id: `module-plate-${index}`,
      text: study.plate,
      role: 'mono',
      em: 0.22,
      tracking: 0.1,
      align: 'centre',
      position: new THREE.Vector3(...placement.position).add(plateOffset),
      quaternion,
      enter: label.enter,
      span: label.span,
      exit: Math.max(label.enter + label.span, retireAt),
      exitSpan: label.exitSpan,
      slice: [1, 1],
      chaos: 2.2,
      depth: 4,
      weight: 1,
      accent: 0.2,
    })
  })

  return blocks
}

/** Every decorative world-space block for the current layout and quality. */
export const buildWorldType = (input: WorldTypeInput): TextBlock[] => {
  if (input.quality !== 'cinema') return sectorBlocks(input)

  // Monogram and module plates first, so a tight instance budget never drops them
  // in favour of signage hanging further down the corridor.
  return [
    monogramBlock(input),
    ...modulePlates(input),
    ...sectorBlocks(input),
  ]
}

/**
 * The glyphs the atlas must contain. Kept independent of layout so a resize
 * re-places blocks without paying for another rasterisation pass.
 */
export const worldTypeSources = (
  featured: CaseStudy[],
): { role: TextBlock['role']; text: string }[] => [
  { role: 'display', text: 'DG0123456789' },
  {
    role: 'mono',
    text: `${SECTORS.map((sector) => sector.marker).join(' ')} ${featured
      .map((study) => study.plate)
      .join(' ')}`,
  },
]
