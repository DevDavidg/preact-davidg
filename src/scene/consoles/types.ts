import * as THREE from 'three'
import type { Quality } from '../capability'
import type { ChassisKind } from '../kit/chassis'
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
  /**
   * A featured module's bay: the project shot and the housing it seats into.
   * Present only on the three featured consoles, and only rendered where the
   * viewport is wide enough to hold a plate and a bay side by side.
   */
  bay?: {
    shot: string
    chassis: ChassisKind
    /** Short name for the operator log when the module seats. */
    label: string
  }
  /** When set, bypasses section-derived enter/exit (module beats). */
  timing?: ConsoleTimingOverride
  /** The finale console carries the handshake terminals. */
  uplink?: boolean
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
  /**
   * Viewport aspect. Placement needs it as well as `fit`, because whether the
   * corridor has a side lane at all is a question about shape, not about scale:
   * a portrait phone has no "either side of the lens" no matter how tall it is.
   */
  aspect: number
}
