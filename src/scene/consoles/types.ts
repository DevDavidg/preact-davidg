import * as THREE from 'three'
import type { Quality } from '../capability'
import type { ConsoleRow } from '../kit/consoleLayout'
import type { SectionWindows } from '../ui/sectionRanges'

export interface ConsoleActionSpec {
  id: string
  label: string
  /** Navigation / side-effect key resolved at render time. */
  kind:
    | 'scroll'
    | 'route'
    | 'external'
    | 'mailto'
    | 'locale'
    | 'copy-email'
    | 'print'
  target: string
}

export interface ConsoleTimingOverride {
  enter: number
  span: number
  exit: number
  exitSpan?: number
  /** Build value used for camera-facing placement. */
  centre: number
}

export interface ConsoleSpec {
  id: string
  /** Section id used for window timing; may be a rail chapter. */
  section: string
  width: number
  height: number
  /** Corridor slot along Z (world). */
  z: number
  /** -1 left / +1 right of centre lane. */
  side: -1 | 0 | 1
  lateral?: number
  rise?: number
  rows: ConsoleRow[]
  actions?: ConsoleActionSpec[]
  /** Optional link to a featured module index for focus boost. */
  moduleIndex?: number
  /** When set, bypasses section-derived enter/exit (module beats). */
  timing?: ConsoleTimingOverride
}

export interface BuiltConsole {
  spec: ConsoleSpec
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  enter: number
  span: number
  exit: number
  exitSpan: number
}

export interface ConsoleBuildInput {
  windows: SectionWindows
  quality: Quality
  fit: number
}
