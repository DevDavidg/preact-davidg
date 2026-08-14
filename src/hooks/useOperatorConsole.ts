import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import type { ExperienceState } from '../scene/capability'
import { installReactorConsole } from '../scene/control/reactorConsole'
import {
  MODES,
  cycleLaw,
  play,
  pushLog,
  reactorControl,
  setMode,
  toggleMode,
  type ModeId,
} from '../scene/control/reactorControl'
import { scrollToSection } from '../motion/ticker'

/**
 * The two ways into the reactor's hidden modes: the developer console, and the
 * keyboard.
 *
 * Typing a word is deliberately not a key combination. A chord is something a
 * visitor has to be told about; a word is something they can guess from the
 * vocabulary the room is already using on screen — the HUD says WIRE, so typing
 * WIRE does the obvious thing. Nothing is captured while focus is in a field, so
 * this can never eat a real keystroke.
 */

/** Typed words that engage a mode. Matched against the tail of the buffer. */
const WORDS: Record<string, ModeId> = {
  WIRE: 'wire',
  CRT: 'crt',
  GHOST: 'ghost',
  OVERCLOCK: 'overclock',
}

const LONGEST_WORD = Math.max(...Object.keys(WORDS).map((word) => word.length))

const editable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export const useOperatorConsole = (
  experience: ExperienceState,
  cvPath: string,
) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (experience === 'checking') return

    const armed = experience === 'cinema'
    reactorControl.armed = armed

    const uninstall = installReactorConsole({
      armed,
      cvPath,
      navigate: (path) => navigate(path),
      scrollTo: scrollToSection,
    })

    if (!armed) {
      return () => {
        reactorControl.armed = false
        uninstall()
      }
    }

    let buffer = ''
    let ghostHeld = false

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (editable(event.target)) return

      // Hold to loosen. A momentary control has to be momentary — a toggle here
      // would leave the room permanently unsettled after one curious press.
      if (event.code === 'KeyG' && !event.repeat) {
        ghostHeld = true
        setMode('ghost', true)
        return
      }

      if (event.code === 'KeyL' && !event.repeat) {
        cycleLaw()
        return
      }

      if (event.code === 'Escape') {
        const engaged = MODES.filter((mode) => reactorControl.modes[mode])
        if (!engaged.length) return
        engaged.forEach((mode) => setMode(mode, false))
        pushLog('modes · all released')
        return
      }

      if (event.key.length !== 1) return
      const character = event.key.toUpperCase()
      if (!/[A-Z]/.test(character)) return

      buffer = (buffer + character).slice(-LONGEST_WORD)
      for (const [word, mode] of Object.entries(WORDS)) {
        if (!buffer.endsWith(word)) continue
        buffer = ''
        toggleMode(mode)
        return
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'KeyG' || !ghostHeld) return
      ghostHeld = false
      setMode('ghost', false)
    }

    // A window that loses focus mid-hold must not leave the room ghosting.
    const handleBlur = () => {
      if (!ghostHeld) return
      ghostHeld = false
      setMode('ghost', false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    play('tick')

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      MODES.forEach((mode) => setMode(mode, false))
      reactorControl.armed = false
      uninstall()
    }
  }, [experience, cvPath, navigate])
}
