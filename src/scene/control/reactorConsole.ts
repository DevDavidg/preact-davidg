/**
 * `window.reactor` — the developer console as a control surface.
 *
 * People who open devtools on a WebGL portfolio are looking for something. A
 * cute `console.log` is a dead end; a real object is a subsystem. Every command
 * here does exactly what a physical control would do — it changes a uniform,
 * plays a voice, and writes a line to the operator log the room is already
 * showing — so what the visitor types and what the machine does are the same
 * event.
 *
 * Cinema only. On the lighter quality the object still exists and says so,
 * because a console that silently does nothing is worse than no console.
 */
import { phaseFor, sceneState } from '../sceneState'
import type { LawId, ModeId } from './reactorControl'
import {
  LAWS,
  MODES,
  decomposeCore,
  play,
  pushLog,
  reactorControl,
  requestSound,
  setLaw,
  setMode,
  toggleMode,
} from './reactorControl'

export interface ReactorConsoleContext {
  /** Where the corridor's contact beat lives, so `uplink()` can travel to it. */
  scrollTo: (id: string) => void
  /** Client-side navigation, for `hardcopy()`. */
  navigate: (path: string) => void
  cvPath: string
  armed: boolean
}

const BANNER = 'color:#ffb454;font:600 12px ui-monospace,monospace'
const KEY = 'color:#f3eee4;font:500 12px ui-monospace,monospace'
const DIM = 'color:#8d8578;font:400 12px ui-monospace,monospace'

const COMMANDS: Array<[string, string]> = [
  ['reactor.help()', 'this list'],
  ['reactor.status()', 'current law, modes, charge'],
  [`reactor.law('${LAWS.join("' | '")}')`, 'change the physics'],
  ['reactor.wire()', 'blueprint mode — the corridor as a diagram'],
  ['reactor.crt()', 'terminal mode — scanlines and aberration'],
  ['reactor.overclock()', 'chaos law + heat. the governor may abort it'],
  ['reactor.ghost()', 'loosen every settled glyph'],
  ['reactor.decompose()', 'blow the core apart, then let it reassemble'],
  ['reactor.uplink()', 'travel to the contact beat'],
  ['reactor.hardcopy()', 'the operator dossier, print-ready'],
  ['reactor.quiet()', 'mute'],
  ['reactor.loud()', 'unmute'],
]

export interface ReactorStatus {
  charge: number
  phase: string
  law: LawId
  modes: string
  held: string
  sectorsVented: number
  uplink: string
  armed: boolean
}

export interface ReactorConsoleApi {
  help: () => void
  status: () => ReactorStatus
  law: (id?: string) => void
  wire: (on?: boolean) => void
  crt: (on?: boolean) => void
  overclock: (on?: boolean) => void
  ghost: (on?: boolean) => void
  decompose: () => void
  uplink: () => void
  hardcopy: () => void
  quiet: () => void
  loud: () => void
}

declare global {
  interface Window {
    reactor?: ReactorConsoleApi
  }
}

const isLaw = (value: string): value is LawId =>
  (LAWS as readonly string[]).includes(value)

export const installReactorConsole = (
  context: ReactorConsoleContext,
): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  const standby = (name: string) => {
    console.info(
      `%cREACTOR%c ${name} — instrument in standby.\n%cThe operator layer runs on the full experience. A wide viewport with a fine pointer and no reduced-motion preference arms it.`,
      BANNER,
      KEY,
      DIM,
    )
    return false
  }

  /** Every command funnels through here so "not armed" is answered once. */
  const armed = (name: string) => (context.armed ? true : standby(name))

  const flag = (mode: ModeId) => (on?: boolean) => {
    if (!armed(`reactor.${mode}()`)) return
    if (on === undefined) toggleMode(mode)
    else setMode(mode, on)
    console.info(
      `%c${mode.toUpperCase()}%c ${reactorControl.modes[mode] ? 'engaged' : 'released'}`,
      BANNER,
      KEY,
    )
  }

  const api: ReactorConsoleApi = {
    help: () => {
      const lines = COMMANDS.map(([call, note]) => `  ${call}\n      ${note}`)
      console.info(
        `%cSIGNAL REACTOR%c · operator console\n\n%c${lines.join('\n')}\n`,
        BANNER,
        KEY,
        DIM,
      )
      if (!context.armed) standby('reactor.help()')
      else play('tick')
    },
    status: () => {
      const modes = MODES.filter((mode) => reactorControl.modes[mode])
      const report = {
        charge: Number(sceneState.build.toFixed(3)),
        phase: phaseFor(sceneState.build),
        law: reactorControl.law,
        modes: modes.length ? modes.join(' + ') : '—',
        held: reactorControl.held ?? '—',
        sectorsVented: reactorControl.fired,
        uplink: reactorControl.uplinked ? 'complete' : 'pending',
        armed: context.armed,
      }
      console.table(report)
      // Returned as well as printed: a console that only prints cannot be used
      // from a script, and reading the machine's state is the one thing a
      // visitor poking at this object is certain to want.
      return report
    },
    law: (id) => {
      if (!armed('reactor.law()')) return
      const next = (id ?? '').toUpperCase()
      if (!isLaw(next)) {
        console.warn(
          `%cLAW%c expected one of ${LAWS.join(', ')}`,
          BANNER,
          KEY,
        )
        play('deny')
        return
      }
      setLaw(next)
    },
    wire: flag('wire'),
    crt: flag('crt'),
    overclock: flag('overclock'),
    ghost: flag('ghost'),
    decompose: () => {
      if (!armed('reactor.decompose()')) return
      decomposeCore()
    },
    uplink: () => {
      pushLog('uplink · requested')
      context.scrollTo('contact')
    },
    hardcopy: () => {
      pushLog('dossier · hardcopy')
      context.navigate(context.cvPath)
    },
    quiet: () => requestSound(false),
    loud: () => requestSound(true),
  }

  window.reactor = api

  // One quiet line on load. Anything louder is a console that shouts at people
  // who opened devtools for an unrelated reason.
  console.info(
    `%cSIGNAL REACTOR%c online · %creactor.help()`,
    BANNER,
    DIM,
    KEY,
  )

  return () => {
    if (window.reactor === api) delete window.reactor
  }
}
