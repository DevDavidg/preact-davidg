import * as THREE from 'three'
import type { FontRole, GlyphAtlas } from '../ui/glyphAtlas'
import { glyphKey } from '../ui/glyphAtlas'
import type { TextBlock } from '../ui/glyphLayout'

/**
 * Lays declarative console rows into TextBlocks that sit inside a plate's
 * content rect. Text never escapes the plate.
 */

export type ConsoleRowKind = 'eyebrow' | 'title' | 'lead' | 'data' | 'action'

export interface ConsoleRow {
  kind: ConsoleRowKind
  text: string
  /** Override role; defaults follow kind. */
  role?: FontRole
  /** World em size; defaults follow kind. */
  em?: number
  tracking?: number
  accent?: number
  weight?: number
  form?: TextBlock['form']
  voxel?: TextBlock['voxel']
  /** Priority for budget cuts — higher stays longer. Default by kind. */
  priority?: number
}

export interface ConsoleContentRect {
  /** Content width in metres (inside the plate face). */
  width: number
  /** Content height in metres. */
  height: number
  /** Padding from plate edge. */
  pad?: number
  /**
   * Height reserved at the foot of the plate for action plates.
   *
   * It used to be a constant, which meant the five consoles that carry no
   * actions at all — the lab, services, process and about beats — each gave up
   * a third of a metre of reading height to buttons that do not exist, and had
   * their copy clipped for it. Pass 0 when the plate has nothing to press.
   */
  actionBand?: number
}

export interface ConsolePlacement {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  enter: number
  span: number
  exit: number
  exitSpan: number
}

const KIND_DEFAULTS: Record<
  ConsoleRowKind,
  {
    role: FontRole
    em: number
    tracking: number
    leading: number
    form: TextBlock['form']
    priority: number
    weight: number
  }
> = {
  eyebrow: {
    role: 'mono',
    em: 0.11,
    tracking: 0.12,
    leading: 1.2,
    form: 'flat',
    priority: 3,
    weight: 0.85,
  },
  title: {
    role: 'display',
    em: 0.22,
    tracking: -0.02,
    leading: 1.08,
    // Flat atlas plates stay sharp at console scale; voxels read as noise here.
    form: 'flat',
    priority: 5,
    weight: 1,
  },
  lead: {
    role: 'mono',
    em: 0.115,
    tracking: 0.02,
    leading: 1.28,
    form: 'flat',
    priority: 4,
    weight: 0.95,
  },
  data: {
    role: 'mono',
    em: 0.1,
    tracking: 0.06,
    leading: 1.3,
    form: 'flat',
    priority: 2,
    weight: 0.8,
  },
  action: {
    role: 'mono',
    em: 0.1,
    tracking: 0.1,
    leading: 1.2,
    form: 'flat',
    priority: 4,
    weight: 1,
  },
}

const advanceOf = (
  atlas: GlyphAtlas,
  role: FontRole,
  char: string,
  tracking: number,
) => (atlas.metrics.get(glyphKey(role, char))?.advance ?? 0.5) + tracking

const measureLine = (
  atlas: GlyphAtlas,
  role: FontRole,
  chars: string[],
  tracking: number,
) => chars.reduce((total, char) => total + advanceOf(atlas, role, char, tracking), 0)

/** Greedy wrap to a max width in em. */
const wrapToEm = (
  atlas: GlyphAtlas,
  role: FontRole,
  text: string,
  tracking: number,
  maxEm: number,
  maxLines: number,
): string[] => {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    const width = measureLine(atlas, role, Array.from(candidate), tracking)
    if (line && width > maxEm) {
      lines.push(line)
      line = word
      if (lines.length >= maxLines) break
    } else {
      line = candidate
    }
  }
  if (line && lines.length < maxLines) lines.push(line)

  // Soft-trim last line if still too wide.
  if (lines.length) {
    const last = lines[lines.length - 1]
    const lastWidth = measureLine(atlas, role, Array.from(last), tracking)
    if (lastWidth > maxEm) {
      let trimmed = ''
      for (const char of last) {
        const next = trimmed + char
        if (measureLine(atlas, role, Array.from(next), tracking) > maxEm) break
        trimmed = next
      }
      lines[lines.length - 1] = trimmed.trimEnd() || last.slice(0, 8)
    }
  }

  return lines
}

const MAX_LINES: Record<ConsoleRowKind, number> = {
  eyebrow: 1,
  title: 3,
  lead: 3,
  data: 2,
  action: 1,
}

/**
 * Compose rows into TextBlocks in the console's local face space, then
 * transform into world space via placement.
 *
 * Local plate coords: origin = centre of content rect, +X right, +Y up, +Z out.
 * Rows stack from the top of the content area downward.
 */
export const layoutConsoleRows = (
  id: string,
  rows: ConsoleRow[],
  rect: ConsoleContentRect,
  placement: ConsolePlacement,
  atlas: GlyphAtlas,
  fit = 1,
): TextBlock[] => {
  const pad = rect.pad ?? 0.14
  // Keep a clear band for ActionPlates so copy never collides with CTAs.
  const actionBand = rect.actionBand ?? 0.36
  const contentW = Math.max(rect.width - pad * 2, 0.4)
  const contentH = Math.max(rect.height - pad * 2 - actionBand, 0.45)
  const topY = contentH / 2 + actionBand * 0.5
  let cursorY = topY
  const gap = 0.055 * fit
  const blocks: TextBlock[] = []

  const localNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(placement.quaternion)
  const floorY = -contentH / 2 + actionBand * 0.5

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]
    if (!row.text.trim()) continue

    const defaults = KIND_DEFAULTS[row.kind]
    const role = row.role ?? defaults.role
    const em = (row.em ?? defaults.em) * fit
    const tracking = row.tracking ?? defaults.tracking
    const leading = defaults.leading
    const maxEm = contentW / em
    const wrapped = wrapToEm(
      atlas,
      role,
      row.text,
      tracking,
      maxEm,
      MAX_LINES[row.kind],
    )
    if (!wrapped.length) continue

    const blockHeight = wrapped.length * leading * em
    // Leave room for remaining rows — drop low-priority if we run out.
    if (cursorY - blockHeight < floorY) {
      if ((row.priority ?? defaults.priority) < 4) continue
      const remaining = cursorY - floorY
      /*
       * No room is no room, whatever the priority.
       *
       * The clamp below used `Math.max(1, …)`, so a high-priority row with
       * negative remaining space still drew one line — below the floor, on top
       * of the action plates. On the experience console that put a role log
       * straight through "VER CV COMPLETO". Priority decides who gets the last
       * line available; it cannot conjure one that is not there.
       */
      if (remaining < leading * em * 0.9) continue
      // High priority: clamp into remaining space by dropping lines.
      const keep = Math.max(1, Math.floor(remaining / (leading * em)))
      wrapped.length = Math.min(wrapped.length, keep)
    }

    /*
     * Say when the copy was cut.
     *
     * A plate is a fixed rectangle and the copy behind it is translated, so a
     * lead that fits in one language overflows in the other and a row that fits
     * on a laptop is clamped on a short window. Silently dropping the tail read
     * as a rendering fault — "Sitio principal de" and then nothing. An ellipsis
     * turns the same clamp into an abbreviation, which is what it actually is.
     */
    const source = row.text.replace(/\s+/g, ' ').trim()
    if (wrapped.join(' ').length < source.length) {
      const last = wrapped[wrapped.length - 1]
      let shortened = `${last}…`
      // The ellipsis has to fit too, so give back characters until it does.
      while (
        shortened.length > 1 &&
        measureLine(atlas, role, Array.from(shortened), tracking) > maxEm
      ) {
        shortened = `${shortened.slice(0, -2).trimEnd()}…`
      }
      wrapped[wrapped.length - 1] = shortened
    }

    const finalText = wrapped.join('\n')
    const finalHeight = wrapped.length * leading * em
    // Baseline of first line sits near top of this row band.
    const baselineY = cursorY - em * 0.85
    const local = new THREE.Vector3(-contentW / 2, baselineY, 0.03)
    const world = local.clone().applyQuaternion(placement.quaternion).add(placement.position)

    blocks.push({
      id: `${id}-${row.kind}-${index}`,
      text: finalText,
      role,
      em,
      tracking,
      leading,
      wrap: maxEm,
      align: 'left',
      position: world,
      quaternion: placement.quaternion.clone(),
      enter: placement.enter,
      span: placement.span * 0.85,
      exit: placement.exit,
      exitSpan: placement.exitSpan,
      form: row.form ?? defaults.form,
      voxel:
        (row.form ?? defaults.form) === 'voxel'
          ? (row.voxel ?? { cellEm: 0.12, layers: 2, threshold: 0.55 })
          : undefined,
      slice: (row.form ?? defaults.form) === 'flat' ? [1, 1] : undefined,
      // Near-home soft drift — readable while gathering, no corridor spray.
      chaos: row.kind === 'title' ? 0.04 : 0.025,
      depth: row.kind === 'title' ? -0.22 : -0.16,
      accent: row.accent ?? (row.kind === 'action' ? 0.7 : 0),
      weight: row.weight ?? defaults.weight,
      priority: row.priority ?? defaults.priority,
    })

    // Nudge slightly along face normal so glyphs sit in front of the plate.
    blocks[blocks.length - 1].position.addScaledVector(localNormal, 0.05)

    cursorY -= finalHeight + gap
  }

  return blocks
}

/** Clip a string to ~maxChars with word boundary. */
export const trimLead = (text: string, maxChars = 90): string => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxChars) return clean
  const cut = clean.slice(0, maxChars)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

export const trimTitle = (text: string, maxChars = 56): string => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxChars) return clean
  const cut = clean.slice(0, maxChars)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trimEnd()
}
